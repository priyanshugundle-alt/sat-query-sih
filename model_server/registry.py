from models.vqa_model import RemoteSensingVQAModel
from models.captioning_model import CaptioningModel
from models.grounding_model import GroundingModel
from models.change_understanding_model import ChangeUnderstandingModel
from models.change_vqa_model import ChangeVQAModel
from models.fusion_model import OpticalSARFusionModel
from models.extraction_model import InformationExtractionModel

from shared_encoder import QwenFeatureExtractor
import torch

class ModelRegistry:
    def __init__(self):
        print("[Registry] Initializing Agentic ML Models (Feature Extractor + Task Heads)...")
        
        # 1. Load the Shared Visual Encoder (Qwen)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.encoder = QwenFeatureExtractor(device=device)

        # 2. Load the 7 downstream PyTorch Task Heads, passing the shared encoder to them
        self.models = {
            "VQA": RemoteSensingVQAModel(self.encoder),
            "CAPTIONING": CaptioningModel(self.encoder),
            "GROUNDING": GroundingModel(self.encoder),
            "CHANGE_UNDERSTANDING": ChangeUnderstandingModel(self.encoder),
            "CHANGE_ANALYSIS": ChangeVQAModel(self.encoder), # Maps to the Java backend's CHANGE_ANALYSIS task
            "FUSION_ANALYSIS": OpticalSARFusionModel(self.encoder),
            "INFORMATION_EXTRACTION": InformationExtractionModel(self.encoder)
        }
        print(f"[Registry] Successfully loaded 1 Shared Encoder and {len(self.models)} Task Heads.")

    def get_model(self, task_type: str):
        task = task_type.upper()
        if task not in self.models:
            raise ValueError(f"TASK_NOT_SUPPORTED: No specialised model found for {task}")
        return self.models[task]
