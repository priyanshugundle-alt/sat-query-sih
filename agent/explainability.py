"""
SatQuery AI — Explainable AI (XAI) & Grad-CAM Saliency Engine (Phase 9)
Computes Gradient-weighted Class Activation Mapping (Grad-CAM) over Model A (ResNet-18 SAR)
to physically explain and localize predictions on Sentinel-1 radar rasters.
"""

from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F

from model_a.config import CONFIG as MODEL_A_CONFIG
from model_a.data.corine_classes import CORINE_19_CLASSES
from model_a.data.transforms import SARDecibelNormalization
from model_a.models.resnet_sar import ResNet18_SAR


def _jet_colormap(x: np.ndarray) -> np.ndarray:
    """
    Pure NumPy Jet colormap mapping [0.0, 1.0] -> RGB uint8 without matplotlib.
    """
    r = np.clip(1.5 - np.abs(4.0 * x - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(4.0 * x - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(4.0 * x - 1.0), 0.0, 1.0)
    return (np.stack([r, g, b], axis=-1) * 255.0).astype(np.uint8)


class GradCAMExplainer:
    """
    Grad-CAM implementation tailored for 2-channel ResNet-18 SAR imagery.
    Produces high-resolution spatial attribution heatmaps showing exactly which
    radar backscatter features (specular reflection, double bounce, volume scatter)
    triggered specific land-cover classifications.
    """
    def __init__(
        self,
        model: Optional[ResNet18_SAR] = None,
        checkpoint_path: Optional[Union[str, Path]] = None,
        device: Optional[str] = None
    ):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        
        if model is not None:
            self.model = model
        else:
            self.model = ResNet18_SAR(
                num_classes=MODEL_A_CONFIG.dataset.num_classes,
                in_channels=MODEL_A_CONFIG.dataset.in_channels,
                pretrained=False
            )
            ckpt = checkpoint_path or (MODEL_A_CONFIG.training.checkpoint_dir / "latest_checkpoint.pt")
            if Path(ckpt).exists():
                state = torch.load(ckpt, map_location=self.device)
                self.model.load_state_dict(state["model_state_dict"])
                print(f"[GradCAM] Loaded weights from {ckpt}")

        self.model.to(self.device)
        self.model.eval()

        self.normalizer = SARDecibelNormalization(
            vh_mean=MODEL_A_CONFIG.dataset.vh_mean,
            vh_std=MODEL_A_CONFIG.dataset.vh_std,
            vv_mean=MODEL_A_CONFIG.dataset.vv_mean,
            vv_std=MODEL_A_CONFIG.dataset.vv_std,
            db_min=MODEL_A_CONFIG.dataset.db_min,
            db_max=MODEL_A_CONFIG.dataset.db_max
        )

        # Hook storage
        self.activations: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None
        self._register_hooks()

    def _register_hooks(self):
        """Registers forward and backward hooks on layer4."""
        target_layer = self.model.layer4

        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        target_layer.register_forward_hook(forward_hook)
        target_layer.register_full_backward_hook(backward_hook)

    def _load_input_tensor(self, vh_path: Path, vv_path: Path) -> Tuple[torch.Tensor, np.ndarray, np.ndarray]:
        """Reads raw 16-bit GeoTIFFs, normalizes, and returns (1, 2, H, W) tensor."""
        with Image.open(vh_path) as img_vh:
            arr_vh = np.array(img_vh, dtype=np.float32)
        with Image.open(vv_path) as img_vv:
            arr_vv = np.array(img_vv, dtype=np.float32)

        # Raw decibel conversion
        eps = 1e-7
        vh_db = 10.0 * np.log10(np.clip(arr_vh, eps, None))
        vv_db = 10.0 * np.log10(np.clip(arr_vv, eps, None))

        # Normalization
        vh_norm = (np.clip(vh_db, -45.0, 0.0) - MODEL_A_CONFIG.dataset.vh_mean) / MODEL_A_CONFIG.dataset.vh_std
        vv_norm = (np.clip(vv_db, -45.0, 0.0) - MODEL_A_CONFIG.dataset.vv_mean) / MODEL_A_CONFIG.dataset.vv_std

        tensor = torch.tensor(np.stack([vh_norm, vv_norm], axis=0), dtype=torch.float32).unsqueeze(0).to(self.device)
        return tensor, vh_db, vv_db

    def generate_saliency_map(
        self,
        vh_path: Path,
        vv_path: Path,
        target_class: Optional[Union[int, str]] = None
    ) -> Dict[str, Any]:
        """
        Computes the Grad-CAM activation map for the given patch and class.
        Returns:
          - class_name: string
          - class_id: int
          - confidence: float
          - heatmap: np.ndarray (120, 120) float [0, 1]
        """
        tensor, vh_db, vv_db = self._load_input_tensor(vh_path, vv_path)
        tensor.requires_grad = True

        # Forward pass
        self.model.zero_grad()
        logits = self.model(tensor)
        probs = torch.sigmoid(logits)[0]

        # Resolve target class
        if target_class is None:
            class_idx = int(torch.argmax(logits[0]).item())
        elif isinstance(target_class, str):
            # Lookup in CORINE_19_CLASSES
            target_class_clean = target_class.strip().lower()
            matches = [i for i, c in enumerate(CORINE_19_CLASSES) if c.lower() == target_class_clean]
            class_idx = matches[0] if matches else int(torch.argmax(logits[0]).item())
        else:
            class_idx = int(target_class)

        target_class_name = CORINE_19_CLASSES[class_idx]
        confidence = float(probs[class_idx].item())

        # Backward pass on target class logit
        score = logits[0, class_idx]
        score.backward(retain_graph=True)

        # Grad-CAM computation: pool gradients across spatial dims
        grads = self.gradients.detach()  # (1, 512, H_feat, W_feat)
        acts = self.activations.detach() # (1, 512, H_feat, W_feat)

        weights = torch.mean(grads, dim=(2, 3), keepdim=True)  # (1, 512, 1, 1)
        cam = torch.sum(weights * acts, dim=1, keepdim=True)   # (1, 1, H_feat, W_feat)
        cam = F.relu(cam)

        # Upsample to full resolution (120, 120)
        cam = F.interpolate(cam, size=(120, 120), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()

        # Normalize to [0, 1]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            heatmap = (cam - cam_min) / (cam_max - cam_min)
        else:
            heatmap = np.zeros_like(cam)

        return {
            "class_id": class_idx,
            "class_name": target_class_name,
            "confidence": round(confidence, 4),
            "heatmap": heatmap,
            "vh_db": vh_db,
            "vv_db": vv_db,
        }

    def generate_saliency_png(
        self,
        vh_path: Path,
        vv_path: Path,
        target_class: Optional[Union[int, str]] = None,
        alpha: float = 0.55
    ) -> bytes:
        """
        Generates a blended false-color + Grad-CAM heatmap PNG image in bytes.
        Suitable for direct HTTP streaming.
        """
        result = self.generate_saliency_map(vh_path, vv_path, target_class=target_class)
        heatmap = result["heatmap"]
        vh_db = result["vh_db"]
        vv_db = result["vv_db"]

        # 1. Base False-color RGB (R=VV, G=VH, B=|VV-VH|)
        vh_u8 = np.clip((vh_db - (-25.0)) / ((-5.0) - (-25.0)) * 255.0, 0, 255).astype(np.uint8)
        vv_u8 = np.clip((vv_db - (-20.0)) / ((0.0) - (-20.0)) * 255.0, 0, 255).astype(np.uint8)
        ratio_u8 = np.clip(np.abs(vv_db - vh_db) / 15.0 * 255.0, 0, 255).astype(np.uint8)
        base_rgb = np.stack([vv_u8, vh_u8, ratio_u8], axis=-1)  # (120, 120, 3)

        # 2. Apply Colormap to heatmap using pure NumPy Jet colormap
        heatmap_rgb = _jet_colormap(heatmap)

        # 3. Alpha blend using thresholded mask so low activations remain true false-color
        mask = (heatmap > 0.15).astype(np.float32)[..., np.newaxis]
        blend_rgb = (base_rgb * (1.0 - alpha * mask) + heatmap_rgb * (alpha * mask)).astype(np.uint8)

        # 4. Convert to PIL Image & encode to PNG
        img = Image.fromarray(blend_rgb)
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
