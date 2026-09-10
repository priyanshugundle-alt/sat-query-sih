"""
SatQuery AI — Specialist Bi-Temporal Change Detection Component
Performs multi-temporal SAR difference analysis and semantic embedding comparison (T1 vs T2).
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image

from model_a.encoder import SAREncoder
from agent.config import CONFIG


class SARChangeDetector:
    """
    Specialist component for detecting surface/infrastructure/water body changes between two dates.
    """
    def __init__(self, encoder: Optional[SAREncoder] = None):
        self.encoder = encoder or SAREncoder()

    def _read_band(self, path: Union[str, Path]) -> np.ndarray:
        with Image.open(path) as img:
            arr = np.array(img, dtype=np.float32)
        return arr

    def detect_change(
        self,
        t1_vh: Union[str, Path, np.ndarray],
        t1_vv: Union[str, Path, np.ndarray],
        t2_vh: Union[str, Path, np.ndarray],
        t2_vv: Union[str, Path, np.ndarray],
        similarity_threshold: float = CONFIG.change_detection_threshold
    ) -> Dict[str, Any]:
        """
        Analyzes bi-temporal SAR patches and detects land-cover / structural changes.
        """
        # 1. Feature Embedding Similarity
        emb_t1 = self.encoder.encode_sar(t1_vh, t1_vv)
        emb_t2 = self.encoder.encode_sar(t2_vh, t2_vv)
        cosine_sim = float(self.encoder.compute_similarity(emb_t1, emb_t2))

        # 2. Pixel-level SAR Log-Ratio Difference Analysis
        arr_t1_vh = self._read_band(t1_vh) if isinstance(t1_vh, (str, Path)) else t1_vh.astype(np.float32)
        arr_t1_vv = self._read_band(t1_vv) if isinstance(t1_vv, (str, Path)) else t1_vv.astype(np.float32)
        arr_t2_vh = self._read_band(t2_vh) if isinstance(t2_vh, (str, Path)) else t2_vh.astype(np.float32)
        arr_t2_vv = self._read_band(t2_vv) if isinstance(t2_vv, (str, Path)) else t2_vv.astype(np.float32)

        # Difference in backscatter amplitude (dB difference)
        diff_vh = np.abs(arr_t2_vh - arr_t1_vh)
        diff_vv = np.abs(arr_t2_vv - arr_t1_vv)
        combined_diff = (diff_vh + diff_vv) / 2.0

        # Changed pixel threshold (e.g. > 3.0 dB delta in SAR backscatter)
        changed_pixels_mask = (combined_diff > 3.0)
        changed_pixel_ratio = float(np.mean(changed_pixels_mask))
        mean_backscatter_delta_db = float(np.mean(combined_diff))

        # Decision Logic
        has_changed = (cosine_sim < similarity_threshold) or (changed_pixel_ratio > 0.10)
        
        if changed_pixel_ratio > 0.25 or cosine_sim < 0.70:
            change_severity = "High"
            summary = "Significant structural/environmental change detected between T1 and T2."
        elif has_changed:
            change_severity = "Moderate"
            summary = "Moderate localized surface variations observed between acquisitions."
        else:
            change_severity = "None/Minimal"
            summary = "No significant land-cover change detected. High temporal stability."

        confidence = round(1.0 - (cosine_sim if not has_changed else (1.0 - cosine_sim)), 3)
        confidence = max(0.60, min(0.99, confidence))

        return {
            "task": "bi_temporal_change_detection",
            "has_changed": bool(has_changed),
            "change_severity": change_severity,
            "semantic_similarity": round(cosine_sim, 4),
            "changed_surface_percentage": round(changed_pixel_ratio * 100.0, 2),
            "mean_backscatter_delta_db": round(mean_backscatter_delta_db, 2),
            "confidence": confidence,
            "explanation": summary,
            "evidence": {
                "t1_embedding_norm": float(np.linalg.norm(emb_t1)),
                "t2_embedding_norm": float(np.linalg.norm(emb_t2)),
                "max_pixel_delta_db": float(np.max(combined_diff)),
                "analyzed_patch_resolution": "10m GSD"
            }
        }
