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

try:
    from agent.api_fallback import SatQueryApiFallback
except ImportError:
    SatQueryApiFallback = None


class CaptioningModel(nn.Module):
    def __init__(self, encoder):
        super().__init__()
        print("  -> Initializing Scene Captioning Task Head (Live Specialists + VLM)...")
        self.encoder = encoder
        self.task_head = nn.Linear(self.encoder.embedding_dim, 500).to(self.encoder.device)
        self.vlm = None
        if SatQueryVLM is not None:
            try:
                self.vlm = SatQueryVLM.get_instance()
            except Exception:
                pass

    def run(self, query, image_paths, params):
        img_path = image_paths[0] if image_paths else "uploads/sample.tif"
        print(f"[Captioning Task Head] Live caption generation for {img_path}")
        
        # 1. Feature Extraction (Shared Backbone)
        embeddings = self.encoder.extract_features(image_paths)
        
        # 2. Specialist Prediction
        pred_data = self.encoder.predict_image(img_path)
        modality = pred_data.get("modality", "Optical")
        detected_classes = pred_data.get("detected_classes", [])
        probabilities = pred_data.get("probabilities", {})
        top_label = detected_classes[0] if detected_classes else "Remote Sensing Scene"
        
        spectral_info = ""
        vh_mean = None
        vv_mean = None
        if "spectral_indices" in pred_data:
            ndvi = pred_data["spectral_indices"].get("estimated_ndvi", 0.0)
            spectral_info = f" [NDVI: {ndvi:.2f}]"
        elif "metrics" in pred_data:
            vh_mean = pred_data["metrics"].get("vh_mean_db", None)
            vv_mean = pred_data["metrics"].get("vv_mean_db", None)

        # 3. Dynamic Natural Language Caption
        ans_text = None
        # Try VLM first if query asks for descriptive summary
        if self.vlm and self.vlm.is_loaded and query:
            ans_text = self.vlm.answer_query(
                query=query if query else "Provide a detailed land-cover caption for this satellite scene.",
                detected_classes=detected_classes,
                probabilities=probabilities,
                spectral_info=spectral_info,
                modality=modality
            )

        if not ans_text and SatQueryApiFallback and SatQueryApiFallback.is_available():
            ans_text = SatQueryApiFallback.query_vlm_api(
                query=query or "Provide a detailed land-cover caption for this satellite scene.",
                detected_classes=detected_classes,
                modality=modality,
                image_path=img_path,
                context_extra=spectral_info
            )

        if not ans_text:
            if not detected_classes:
                raise ValueError("No valid land-cover signatures could be classified by the neural network on the provided raster.")
            ans_text = SceneCaptioner.generate_caption(
                detected_classes=detected_classes,
                probabilities=probabilities,
                vh_mean=vh_mean,
                vv_mean=vv_mean,
                modality=modality
            )

        top_prob = round(probabilities.get(top_label, pred_data.get("confidence", 0.85)) * 100, 1)
        model_name = "Model-B Optical ResNet-18" if modality == "Optical" else "Model-A SAR ResNet"

        return {
            "answer": ans_text,
            "evidence": [{
                "evidenceType": "IMAGE",
                "type": "IMAGE",
                "filePath": img_path,
                "label": f"{top_label} ({top_prob}%)",
                "description": f"Live {model_name} classification: {', '.join(detected_classes[:3]) if detected_classes else top_label}."
            }],
            "limitations": [f"Live inference computed using {model_name} specialist backbone."]
        }
