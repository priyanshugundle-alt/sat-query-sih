"""
SatQuery AI — Central AI Agent Orchestrator (Phase 5)
Orchestrates Specialist Models (Model A, Model B, Change Detector, Geo-Validity Gate, Evidence Verifier).
"""

from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

from agent.config import CONFIG, AgentConfig, TaskIntent, UncertaintyLevel
from agent.geo_validator import GeoValidityGate
from agent.change_detector import SARChangeDetector
from agent.evidence_verifier import EvidenceVerifier
from agent.audit_tracer import AuditTracer
from agent.scene_captioner import SceneCaptioner
from agent.model_b_adapter import OpticalSpecialistSimulator
from agent.multimodal_fusion import MultiModalFusionEngine
from model_a.inference import ModelAInference
from model_a.encoder import SAREncoder
from agent.qwen_brain import QWEN_BRAIN


class SatQueryAgent:
    """
    Central AI Agent for Remote Sensing & Earth Observation.
    Directs specialized models based on user intent, sensor modality, and verification requirements.
    """
    def __init__(self, config: AgentConfig = CONFIG):
        self.config = config
        self.geo_gate = GeoValidityGate()
        self.evidence_verifier = EvidenceVerifier()
        self.tracer = AuditTracer(config.audit_log_dir)

        # Specialist Models
        checkpoint = (
            config.model_a_checkpoint
            if config.model_a_checkpoint.exists()
            else config.model_a_latest_checkpoint
        )
        self.model_a = ModelAInference(checkpoint_path=checkpoint if checkpoint.exists() else None)
        self.sar_encoder = SAREncoder(checkpoint_path=checkpoint if checkpoint.exists() else None)
        self.change_detector = SARChangeDetector(encoder=self.sar_encoder)
        
        # Model B registry (will be plugged in when Dataset 2 is trained)
        self.model_b = None
        
        # Ensure Qwen Brain is initialized
        self.qwen = QWEN_BRAIN

    def _generate_png_bytes(self, vh_path, vv_path) -> bytes:
        from PIL import Image
        import io
        with Image.open(vh_path) as img_vh:
            vh_arr = np.array(img_vh, dtype=np.float32)
        with Image.open(vv_path) as img_vv:
            vv_arr = np.array(img_vv, dtype=np.float32)
        # False color mapping
        r = np.clip((vv_arr - (-25.0)) / 25.0, 0.0, 1.0) * 255.0
        g = np.clip((vh_arr - (-32.0)) / 27.0, 0.0, 1.0) * 255.0
        ratio = np.clip((vv_arr - vh_arr) / 15.0, 0.0, 1.0) * 255.0
        rgb = np.stack([r, g, ratio], axis=-1).astype(np.uint8)
        pil_img = Image.fromarray(rgb).resize((256, 256), Image.Resampling.BILINEAR)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return buf.getvalue()

    def register_model_b(self, model_b_instance: Any):
        """
        Registers Model B when the second dataset and pipeline are developed.
        """
        self.model_b = model_b_instance
        print("[SatQuery Agent] Model B registered successfully as a secondary specialist.")

    def parse_intent(
        self,
        query: str,
        has_temporal_pair: bool = False,
        modality: str = "SAR"
    ) -> TaskIntent:
        """
        Extracts the semantic intent from user natural language query.
        """
        q = query.lower().strip()

        if has_temporal_pair or any(kw in q for kw in ["change", "difference", "compare", "temporal", "t1", "t2", "over time", "increase", "decrease"]):
            return TaskIntent.CHANGE_DETECTION
        
        if any(kw in q for kw in ["validate", "check crs", "metadata", "resolution", "bounds", "verify data"]):
            return TaskIntent.GEO_VALIDATION_ONLY

        if any(kw in q for kw in ["embed", "feature", "vector", "latent", "encode"]):
            return TaskIntent.SAR_FEATURE_EXTRACTION

        if any(kw in q for kw in ["optical", "rgb", "multispectral", "dataset 2"]) and self.model_b is not None:
            return TaskIntent.MODEL_B_TASK

        if any(kw in q for kw in ["classify", "land cover", "what is this", "identify", "detect", "sar", "radar", "trees", "water", "urban"]):
            return TaskIntent.SAR_CLASSIFICATION

        # Default VQA / Classification
        return TaskIntent.SAR_CLASSIFICATION

    def process_query(
        self,
        query: str,
        vh_path: Union[str, Path, np.ndarray],
        vv_path: Union[str, Path, np.ndarray],
        t2_vh_path: Optional[Union[str, Path, np.ndarray]] = None,
        t2_vv_path: Optional[Union[str, Path, np.ndarray]] = None
    ) -> Dict[str, Any]:
        """
        Main Agent Execution Pipeline:
        1. Parse query intent
        2. Execute Geo-Validity Gate
        3. Route to specialist model
        4. Apply Evidence & Uncertainty verification
        5. Generate transparent Audit Receipt & Final Answer
        """
        t0 = time.time()
        has_temporal = (t2_vh_path is not None and t2_vv_path is not None)
        intent = self.parse_intent(query, has_temporal_pair=has_temporal)

        # Step 1: Geo-Validity Gate
        if has_temporal:
            geo_check = self.geo_gate.validate_temporal_pair((vh_path, vv_path), (t2_vh_path, t2_vv_path))
        else:
            geo_check = self.geo_gate.validate_sar_pair(vh_path, vv_path)

        # Reject corrupted data immediately
        if geo_check["status"] == "INVALID":
            elapsed_ms = (time.time() - t0) * 1000.0
            error_ans = f"Query rejected by Geo-Validity Gate. Reason: {geo_check.get('reason', 'Corrupted or incompatible raster data.')}"
            receipt = self.tracer.record_receipt(
                query=query,
                intent=intent.value,
                input_info={"vh": str(vh_path), "vv": str(vv_path)},
                geo_validity=geo_check,
                selected_model="GeoValidityGate",
                model_output={"error": error_ans},
                verification={"uncertainty_level": UncertaintyLevel.INSUFFICIENT_EVIDENCE.value, "confidence_score": 0.0},
                final_answer=error_ans,
                elapsed_ms=elapsed_ms
            )
            return {
                "answer": error_ans,
                "uncertainty_level": UncertaintyLevel.INSUFFICIENT_EVIDENCE.value,
                "confidence": 0.0,
                "audit_receipt": receipt
            }

        # Step 2: Route to Specialist Tool
        if intent == TaskIntent.CHANGE_DETECTION and has_temporal:
            selected_model_name = "SARChangeDetector"
            model_res = self.change_detector.detect_change(
                t1_vh=vh_path, t1_vv=vv_path,
                t2_vh=t2_vh_path, t2_vv=t2_vv_path
            )
            ans = (
                f"Bi-Temporal Change Analysis: {model_res['explanation']} "
                f"(Semantic Similarity: {model_res['semantic_similarity']}, "
                f"Changed Area: {model_res['changed_surface_percentage']}%, "
                f"Severity: {model_res['change_severity']})."
            )

        elif intent == TaskIntent.SAR_FEATURE_EXTRACTION:
            selected_model_name = "SAREncoder"
            emb = self.sar_encoder.encode_sar(vh_path, vv_path)
            model_res = {
                "task": "sar_feature_extraction",
                "embedding_dim": len(emb),
                "confidence": 1.0,
                "processing_time_ms": 15.0
            }
            ans = f"Extracted {len(emb)}-dimensional normalized SAR semantic feature vector successfully."

        elif intent == TaskIntent.GEO_VALIDATION_ONLY:
            selected_model_name = "GeoValidityGate"
            model_res = {"task": "geo_validation", "confidence": 1.0, "processing_time_ms": 5.0}
            ans = f"Geospatial Validation Passed. Status: {geo_check['status']}."

        elif intent == TaskIntent.MODEL_B_TASK and self.model_b is not None:
            selected_model_name = "Model-B-Specialist"
            model_res = self.model_b.predict(vh_path)
            ans = str(model_res.get("result", {}))

        else:
            # Default: SAR Analysis (Model A + Qwen)
            selected_model_name = "Agentic-VQA-Pipeline"
            model_res = self.model_a.predict(vh_input=vh_path, vv_input=vv_path)
            detected = model_res["result"]["detected_classes"]
            probs = model_res["result"].get("class_probabilities", {})

            # Convert GeoTIFF to PNG for Qwen NLP visual reasoning
            try:
                png_bytes = self._generate_png_bytes(vh_path, vv_path)
            except Exception:
                png_bytes = None

            # Check if user asked a specific targeted question or requested caption
            specific_ans = SceneCaptioner.answer_specific_question(
                query=query, 
                image_bytes=png_bytes,
                detected_classes=detected, 
                probabilities=probs
            )
            if specific_ans:
                ans = specific_ans
            elif detected:
                ans = f"Based on Sentinel-1 SAR analysis, the primary land-cover categories detected are: {', '.join(detected)} (Confidence: {model_res['confidence']:.2f})."
            else:
                ans = f"No distinctive land-cover patterns could be identified with high confidence from the SAR backscatter."

        # Step 3: Evidence & Uncertainty Verification
        verification = self.evidence_verifier.verify_prediction(
            model_result=model_res,
            geo_validity=geo_check,
            query=query
        )

        elapsed_ms = (time.time() - t0) * 1000.0

        # Step 4: Record Audit Receipt
        receipt = self.tracer.record_receipt(
            query=query,
            intent=intent.value,
            input_info={"vh": str(vh_path), "vv": str(vv_path)},
            geo_validity=geo_check,
            selected_model=selected_model_name,
            model_output=model_res,
            verification=verification,
            final_answer=ans,
            elapsed_ms=elapsed_ms
        )

        return {
            "answer": ans,
            "intent": intent.value,
            "selected_model": selected_model_name,
            "uncertainty_level": verification["uncertainty_level"],
            "confidence": verification["confidence_score"],
            "evidence_claims": verification["claims"],
            "model_raw_output": model_res,
            "audit_receipt_id": receipt["receipt_id"],
            "total_latency_ms": round(elapsed_ms, 2)
        }
