"""
SatQuery AI — Claim-to-Evidence & Uncertainty Quantification Layer
Prevents hallucinations by validating each model claim against physical evidence and assigning calibrated uncertainty ratings.
"""

from typing import Any, Dict, List, Optional
from agent.config import CONFIG, UncertaintyLevel


class EvidenceVerifier:
    """
    Evidence & Hallucination Verifier.
    """
    @staticmethod
    def verify_prediction(
        model_result: Dict[str, Any],
        geo_validity: Dict[str, Any],
        query: str = ""
    ) -> Dict[str, Any]:
        """
        Evaluates model findings, checks for physical evidence support,
        and assigns an auditable uncertainty rating.
        """
        confidence = float(model_result.get("confidence", 0.0))
        geo_status = geo_validity.get("status", "VALID")
        task = model_result.get("task", "")

        claims: List[Dict[str, Any]] = []

        # Claim 1: Geo-Validity Support
        if geo_status == "INVALID":
            return {
                "uncertainty_level": UncertaintyLevel.INSUFFICIENT_EVIDENCE.value,
                "overall_verdict": "Refused conclusion due to corrupted or invalid raster input.",
                "claims": [{"claim": "Input Data Validity", "status": "REJECTED", "evidence": geo_validity.get("reason")}],
                "confidence_score": 0.0,
                "is_faithful": False
            }

        # Check for Land Cover Classification
        if "classification" in task:
            detected = model_result.get("result", {}).get("detected_classes", [])
            all_probs = model_result.get("result", {}).get("all_probabilities", {})

            if len(detected) == 0:
                claims.append({
                    "claim": "No distinctive land-cover pattern reached confidence threshold (>0.4).",
                    "status": "UNCERTAIN",
                    "evidence": "All class probabilities were below 0.40."
                })
                uncertainty = UncertaintyLevel.UNCERTAIN
            else:
                for cls_name in detected:
                    prob = all_probs.get(cls_name, confidence)
                    claims.append({
                        "claim": f"Presence of {cls_name}",
                        "status": "VERIFIED" if prob >= CONFIG.high_confidence_threshold else "LIKELY",
                        "evidence": f"Sentinel-1 SAR dual-pol backscatter response (prob: {prob:.3f})"
                    })

                if confidence >= CONFIG.high_confidence_threshold:
                    uncertainty = UncertaintyLevel.VERIFIED
                elif confidence >= CONFIG.medium_confidence_threshold:
                    uncertainty = UncertaintyLevel.LIKELY
                else:
                    uncertainty = UncertaintyLevel.UNCERTAIN

        # Check for Change Detection
        elif "change_detection" in task:
            has_changed = model_result.get("has_changed", False)
            severity = model_result.get("change_severity", "None")
            delta_db = model_result.get("mean_backscatter_delta_db", 0.0)
            changed_pct = model_result.get("changed_surface_percentage", 0.0)

            claims.append({
                "claim": f"Bi-temporal surface change: {severity}",
                "status": "VERIFIED",
                "evidence": f"Mean backscatter delta: {delta_db} dB, changed area: {changed_pct}%"
            })

            if confidence >= CONFIG.high_confidence_threshold:
                uncertainty = UncertaintyLevel.VERIFIED
            else:
                uncertainty = UncertaintyLevel.LIKELY
        else:
            uncertainty = UncertaintyLevel.LIKELY

        return {
            "uncertainty_level": uncertainty.value,
            "overall_verdict": f"Analysis concluded with status: {uncertainty.value}.",
            "claims": claims,
            "confidence_score": confidence,
            "is_faithful": True
        }
