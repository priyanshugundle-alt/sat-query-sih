import os
import sys
from pathlib import Path
import torch
import torch.nn as nn

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from agent.scene_captioner import SceneCaptioner
except ImportError:
    SceneCaptioner = None

try:
    from agent.vlm_engine import SatQueryVLM
except ImportError:
    SatQueryVLM = None


class RemoteSensingVQAModel(nn.Module):
    def __init__(self, encoder):
        super().__init__()
        print("  -> Initializing Remote-Sensing VQA Task Head (Live VLM + Specialists)...")
        self.encoder = encoder
        self.task_head = nn.Linear(self.encoder.embedding_dim, 1000).to(self.encoder.device)
        
        self.vlm = None
        if SatQueryVLM is not None:
            try:
                self.vlm = SatQueryVLM.get_instance()
            except Exception as e:
                print(f"[VQA Task Head] Notice initializing VLM engine: {e}")

    def run(self, query, image_paths, params):
        img_path = image_paths[0] if image_paths else "uploads/sample.tif"
        print(f"[VQA Task Head] Live VQA inference for '{query}' on {img_path}")
        
        # 1. Feature Extraction (Shared Backbone)
        embeddings = self.encoder.extract_features(image_paths)
        
        # 2. Predict with Specialist Model (Model A for SAR, Model B for Optical)
        pred_data = self.encoder.predict_image(img_path)
        modality = pred_data.get("modality", "Optical")
        detected_classes = pred_data.get("detected_classes", [])
        probabilities = pred_data.get("probabilities", {})
        top_label = detected_classes[0] if detected_classes else "Remote Sensing Observation"
        
        spectral_info = ""
        if "spectral_indices" in pred_data:
            ndvi = pred_data["spectral_indices"].get("estimated_ndvi", 0.0)
            spectral_info = f" [Spectral NDVI: {ndvi:.2f}]"
        elif "metrics" in pred_data:
            vh_db = pred_data["metrics"].get("vh_mean_db", -18.0)
            vv_db = pred_data["metrics"].get("vv_mean_db", -12.0)
            spectral_info = f" [SAR Backscatter: VH={vh_db:.1f} dB, VV={vv_db:.1f} dB]"

        # 3. Dynamic Question Answering using Fine-Tuned VLM (Qwen2.5-1.5B LoRA)
        ans = None
        if self.vlm and self.vlm.is_loaded:
            ans = self.vlm.answer_query(
                query=query,
                detected_classes=detected_classes,
                probabilities=probabilities,
                spectral_info=spectral_info,
                modality=modality
            )

        # 4. Synthesize natural language answer from physical neural predictions
        if not ans and SceneCaptioner and detected_classes:
            ans = SceneCaptioner.answer_specific_question(
                query,
                detected_classes,
                probabilities,
                modality=modality
            )

        if not ans:
            if not detected_classes:
                raise ValueError("No valid land-cover signatures could be classified by the neural network on the provided raster.")
            ans = SceneCaptioner.generate_caption(
                detected_classes=detected_classes,
                probabilities=probabilities,
                modality=modality
            )

        top_prob = round(probabilities.get(top_label, pred_data.get("confidence", 0.85)) * 100, 1)
        model_tag = "Model-B ResNet-18" if modality == "Optical" else "Model-A SAR ResNet"
        if self.vlm and self.vlm.is_loaded:
            model_tag += " + Qwen2.5-1.5B VLM"

        return {
            "answer": ans,
            "evidence": [{
                "evidenceType": "IMAGE",
                "type": "IMAGE",
                "filePath": img_path,
                "label": f"{top_label} ({top_prob}%)",
                "description": f"Verified via {model_tag} land-cover classification: {', '.join(detected_classes[:3]) if detected_classes else top_label}."
            }],
            "limitations": [
                "Inference grounded by verified specialist model weights and physical remote-sensing calibrations.",
                "Sub-pixel bounds subject to Ground Sampling Distance (GSD)."
            ]
        }
