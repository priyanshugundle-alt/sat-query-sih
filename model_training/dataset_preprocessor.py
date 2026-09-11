"""
SatQuery AI — BigEarthNet Dataset Preprocessor (Sentinel-1 SAR + Sentinel-2 Optical)
Aligns SAR backscatter & Optical reflectance bands and formats VQA instruction dataset.
"""

import os
import json
import numpy as np

def process_sentinel_patch(s1_path: str, s2_path: str):
    """
    Simulates / loads Sentinel-1 (VV, VH) and Sentinel-2 (B02, B03, B04, B08) bands.
    Resamples to 10m grid, normalizes reflectance [0, 1] & SAR dB values.
    """
    # Placeholder for rasterio multi-spectral band reading
    # Sentinel-2 RGB + NIR (4 channels)
    # Sentinel-1 VV + VH (2 channels)
    # Merged tensor shape: (6, H, W)
    pass

def generate_vqa_prompt(patch_id: str, land_cover_labels: list) -> dict:
    """
    Generates Q&A pairs formatted for VLM fine-tuning (Qwen2.5-VL / LLaVA format).
    """
    labels_str = ", ".join(land_cover_labels)
    return {
        "id": patch_id,
        "conversations": [
            {
                "from": "user",
                "value": "<image>\nAnalyze this remote sensing scene. Identify the land-cover classes and sensor capabilities present."
            },
            {
                "from": "assistant",
                "value": f"This scene presents the following land-cover categories: {labels_str}. "
                         f"Sentinel-1 SAR confirms structural surface roughness, while Sentinel-2 optical bands distinguish vegetation canopy."
            }
        ]
    }

if __name__ == "__main__":
    print("SatQuery BigEarthNet Preprocessor Module Ready.")
