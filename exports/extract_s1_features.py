"""
Standalone S1 Feature Extractor for S1+S2 Multi-Modal Fusion
Can be copied directly into Sentinel-2 team repository.
"""
import numpy as np
from PIL import Image
import torch

def load_and_preprocess_s1(vh_tif_path, vv_tif_path):
    def read_band(p):
        with Image.open(p) as img:
            return np.array(img, dtype=np.float32)
    vh = read_band(vh_tif_path)
    vv = read_band(vv_tif_path)
    # Decibel conversion
    vh_db = np.clip(10.0 * np.log10(np.clip(vh, 1e-5, None)), -50.0, 5.0)
    vv_db = np.clip(10.0 * np.log10(np.clip(vv, 1e-5, None)), -50.0, 5.0)
    # Z-score normalization
    vh_norm = (vh_db - (-19.27)) / 5.49
    vv_norm = (vv_db - (-12.64)) / 5.11
    tensor = torch.from_numpy(np.stack([vh_norm, vv_norm], axis=0)).unsqueeze(0).float()
    return tensor

def extract_s1_vector(s1_tensor, jit_model_path="sar_encoder_jit.pt"):
    model = torch.jit.load(jit_model_path)
    model.eval()
    with torch.no_grad():
        feat = model.extract_features(s1_tensor)
        norm_feat = torch.nn.functional.normalize(feat, p=2, dim=1)
    return norm_feat.cpu().numpy().flatten()  # 512-dim
