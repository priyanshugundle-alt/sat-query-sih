"""
SatQuery AI — Model A Reusable SAR Feature Encoder (Phase 4)
Extracts 512-dimensional feature embeddings from Sentinel-1 SAR imagery for downstream
Agent reasoning, multi-sensor Optical-SAR fusion, and bi-temporal change detection.
"""

from pathlib import Path
import time
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F

from model_a.config import CONFIG, ModelAConfig
from model_a.data.transforms import SARDecibelNormalization
from model_a.models.resnet_sar import ResNet18_SAR


class SAREncoder:
    """
    Decoupled, high-performance SAR Feature Encoder.
    Transforms raw Sentinel-1 [VH, VV] GeoTIFFs into 512-dimensional semantic embeddings.
    """
    def __init__(
        self,
        checkpoint_path: Optional[Union[str, Path]] = None,
        config: ModelAConfig = CONFIG,
        device: Optional[str] = None
    ):
        self.config = config
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        
        self.normalizer = SARDecibelNormalization(
            vh_mean=self.config.dataset.vh_mean,
            vh_std=self.config.dataset.vh_std,
            vv_mean=self.config.dataset.vv_mean,
            vv_std=self.config.dataset.vv_std,
            db_min=self.config.dataset.db_min,
            db_max=self.config.dataset.db_max
        )

        # Initialize base ResNet-18 SAR model
        self.model = ResNet18_SAR(
            num_classes=self.config.dataset.num_classes,
            in_channels=self.config.dataset.in_channels,
            pretrained=False
        )

        if checkpoint_path and Path(checkpoint_path).exists():
            checkpoint = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            print(f"[SAREncoder] Loaded encoder weights from {checkpoint_path}")
        else:
            print("[SAREncoder] Initialized with default feature extractor weights.")

        self.model.to(self.device)
        self.model.eval()

    def _read_band(self, band_input: Union[str, Path, np.ndarray]) -> np.ndarray:
        if isinstance(band_input, (str, Path)):
            with Image.open(band_input) as img:
                arr = np.array(img, dtype=np.float32)
        else:
            arr = band_input.astype(np.float32)

        if arr.shape != (self.config.dataset.img_height, self.config.dataset.img_width):
            img_pil = Image.fromarray(arr)
            img_pil = img_pil.resize(
                (self.config.dataset.img_width, self.config.dataset.img_height),
                Image.BILINEAR
            )
            arr = np.array(img_pil, dtype=np.float32)
        return arr

    def preprocess(
        self,
        vh: Union[str, Path, np.ndarray],
        vv: Union[str, Path, np.ndarray]
    ) -> torch.Tensor:
        vh_arr = self._read_band(vh)
        vv_arr = self._read_band(vv)
        sar_2ch = np.stack([vh_arr, vv_arr], axis=0)
        sar_norm = self.normalizer(sar_2ch)
        sar_tensor = torch.from_numpy(sar_norm).unsqueeze(0).float()
        return sar_tensor.to(self.device)

    @torch.no_grad()
    def encode_sar(
        self,
        vh: Union[str, Path, np.ndarray],
        vv: Union[str, Path, np.ndarray],
        normalize_embedding: bool = True
    ) -> np.ndarray:
        """
        Public Specialist Interface:
        Encodes a single SAR patch into a 512-dimensional vector.
        """
        sar_tensor = self.preprocess(vh, vv)
        features = self.model.extract_features(sar_tensor)  # (1, 512)
        
        if normalize_embedding:
            features = F.normalize(features, p=2, dim=1)

        return features.squeeze(0).cpu().numpy()

    @torch.no_grad()
    def batch_encode_sar(
        self,
        sar_batch: torch.Tensor,
        normalize_embedding: bool = True
    ) -> np.ndarray:
        """
        Batch encoding interface for tensor streams: (B, 2, 120, 120) -> (B, 512)
        """
        sar_batch = sar_batch.to(self.device)
        features = self.model.extract_features(sar_batch)
        if normalize_embedding:
            features = F.normalize(features, p=2, dim=1)
        return features.cpu().numpy()

    @staticmethod
    def compute_similarity(emb_1: np.ndarray, emb_2: np.ndarray) -> float:
        """
        Computes cosine similarity between two 512-dim SAR embeddings.
        Used for bi-temporal change detection (T1 vs T2 similarity).
        """
        norm_1 = np.linalg.norm(emb_1)
        norm_2 = np.linalg.norm(emb_2)
        if norm_1 == 0 or norm_2 == 0:
            return 0.0
        return float(np.dot(emb_1, emb_2) / (norm_1 * norm_2))

    def export_torchscript(self, export_path: Union[str, Path]) -> Path:
        """
        Exports the SAR Feature Encoder to TorchScript JIT for zero-overhead C++/Java deployment.
        """
        export_path = Path(export_path)
        export_path.parent.mkdir(parents=True, exist_ok=True)
        
        class FeatureExtractorWrapper(nn.Module):
            def __init__(self, base_model):
                super().__init__()
                self.base_model = base_model

            def forward(self, x: torch.Tensor) -> torch.Tensor:
                feat = self.base_model.extract_features(x)
                return F.normalize(feat, p=2, dim=1)

        wrapper = FeatureExtractorWrapper(self.model).to(self.device).eval()
        dummy_input = torch.randn(1, 2, 120, 120, device=self.device)
        traced_model = torch.jit.trace(wrapper, dummy_input)
        traced_model.save(str(export_path))
        print(f"[SAREncoder] Exported TorchScript model to {export_path}")
        return export_path
