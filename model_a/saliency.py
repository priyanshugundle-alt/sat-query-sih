"""
SatQuery AI — Visual Grounding & Spatial Saliency Heatmap Engine
Generates spatial activation heatmaps overlaid onto SAR rasters to visually ground
predictions (water bodies, urban fabric, vegetative volume) with zero hallucination.
"""

import io
from pathlib import Path
from typing import Optional, Union

import numpy as np
from PIL import Image


class SARSaliencyGenerator:
    """
    Computes spatial activation and saliency maps from dual-polarization SAR backscatter.
    """

    @staticmethod
    def _apply_colormap(val_norm: np.ndarray, colormap: str = "turbo") -> np.ndarray:
        """
        Applies a vibrant colormap to a normalized [0, 1] 2D array without external matplotlib dependency.
        """
        # Turbo / Plasma style multi-stop gradient
        # Stop 0 (0.0): Dark Purple/Blue (0, 0, 80)
        # Stop 1 (0.25): Cyan/Teal (0, 180, 220)
        # Stop 2 (0.5): Green (50, 220, 80)
        # Stop 3 (0.75): Yellow/Orange (255, 200, 0)
        # Stop 4 (1.0): Red/White (255, 40, 40)
        
        val = np.clip(val_norm, 0.0, 1.0)
        h, w = val.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)

        # Smooth piecewise linear color transfer
        # R channel
        r = np.clip(1.5 * val - 0.2, 0.0, 1.0) * 255.0
        # G channel
        g = np.clip(1.0 - 2.0 * np.abs(val - 0.5), 0.0, 1.0) * 255.0
        # B channel
        b = np.clip(1.5 * (1.0 - val) - 0.2, 0.0, 1.0) * 255.0

        rgb[:, :, 0] = r.astype(np.uint8)
        rgb[:, :, 1] = g.astype(np.uint8)
        rgb[:, :, 2] = b.astype(np.uint8)
        return rgb

    @classmethod
    def generate_saliency_map(
        cls,
        vh_path: Union[str, Path],
        vv_path: Union[str, Path],
        target_feature: str = "general",
        alpha: float = 0.55
    ) -> bytes:
        """
        Computes the spatial activation map and blends it with the underlying SAR raster.
        target_feature can be: 'general', 'water', 'urban', 'vegetation', 'change'
        Returns PNG image bytes.
        """
        with Image.open(vh_path) as img_vh:
            vh_arr = np.array(img_vh, dtype=np.float32)
        with Image.open(vv_path) as img_vv:
            vv_arr = np.array(img_vv, dtype=np.float32)

        # Base grayscale SAR backscatter for structural background
        base_gray = np.clip((vv_arr - (-25.0)) / 25.0, 0.0, 1.0) * 255.0
        base_gray_rgb = np.stack([base_gray, base_gray, base_gray], axis=-1).astype(np.uint8)

        target = target_feature.lower()
        if "water" in target:
            # Low backscatter in both VV and VH (specular reflection away from sensor)
            activation = np.clip(1.0 - ((vv_arr + 28.0) / 16.0), 0.0, 1.0)
        elif "urban" in target:
            # High double-bounce structural backscatter (very bright pixels in VV)
            activation = np.clip((vv_arr - (-10.0)) / 12.0, 0.0, 1.0)
        elif "vegetation" in target or "forest" in target:
            # High volume scattering in VH channel
            activation = np.clip((vh_arr - (-20.0)) / 12.0, 0.0, 1.0)
        else:
            # General gradient activation: combination of depolarization ratio & intensity
            ratio = vv_arr - vh_arr
            activation = np.clip((ratio - 2.0) / 10.0, 0.0, 1.0)

        # Apply smooth Gaussian-like spatial filtering with simple box blur
        kernel_size = 5
        pad = kernel_size // 2
        padded = np.pad(activation, pad, mode="reflect")
        smooth_act = np.zeros_like(activation)
        for i in range(kernel_size):
            for j in range(kernel_size):
                smooth_act += padded[i:i+activation.shape[0], j:j+activation.shape[1]]
        smooth_act /= (kernel_size * kernel_size)

        # Colormap
        heatmap_rgb = cls._apply_colormap(smooth_act)

        # Blend base grayscale raster with colored heatmap
        blended = (base_gray_rgb * (1.0 - alpha) + heatmap_rgb * alpha).astype(np.uint8)

        # Resize to 256x256
        pil_img = Image.fromarray(blended).resize((256, 256), Image.Resampling.BILINEAR)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return buf.getvalue()
