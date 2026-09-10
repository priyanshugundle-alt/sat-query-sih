"""
SatQuery AI — SAR Preprocessing & Augmentation Transforms
Handles Sentinel-1 dual-polarization [VH, VV] decibel clipping, normalization, and tensor conversion.
"""

from typing import Optional, Tuple
import numpy as np
import torch


class SARDecibelNormalization:
    """
    Normalizes 2-channel SAR array [VH, VV] in decibels:
    1. Clips values to [db_min, db_max] to remove radar artifacts.
    2. Applies z-score standardization: (x - mean) / std.
    """
    def __init__(
        self,
        vh_mean: float = -19.27,
        vh_std: float = 5.49,
        vv_mean: float = -12.64,
        vv_std: float = 5.11,
        db_min: float = -50.0,
        db_max: float = 5.0
    ):
        self.vh_mean = vh_mean
        self.vh_std = vh_std
        self.vv_mean = vv_mean
        self.vv_std = vv_std
        self.db_min = db_min
        self.db_max = db_max

    def __call__(self, sar_2ch: np.ndarray) -> np.ndarray:
        """
        Input: numpy array of shape (2, H, W) or (H, W, 2)
        Output: normalized float32 array of shape (2, H, W)
        """
        if sar_2ch.ndim == 3 and sar_2ch.shape[-1] == 2:
            # (H, W, 2) -> (2, H, W)
            sar_2ch = np.transpose(sar_2ch, (2, 0, 1))

        # Handle NaNs / Infs safely
        sar_2ch = np.nan_to_num(sar_2ch, nan=self.db_min, posinf=self.db_max, neginf=self.db_min)

        # Clip values
        sar_2ch = np.clip(sar_2ch, self.db_min, self.db_max)

        # Normalize per channel
        sar_norm = np.empty_like(sar_2ch, dtype=np.float32)
        sar_norm[0] = (sar_2ch[0] - self.vh_mean) / (self.vh_std + 1e-7)
        sar_norm[1] = (sar_2ch[1] - self.vv_mean) / (self.vv_std + 1e-7)

        return sar_norm


class SARAugmentations:
    """
    Geospatially valid augmentations for SAR remote sensing:
    - Random Horizontal Flip
    - Random Vertical Flip
    - Random 90/180/270 degree Rotations (Dihedral symmetry D4)
    """
    def __init__(self, is_training: bool = True):
        self.is_training = is_training

    def __call__(self, sar_tensor: torch.Tensor) -> torch.Tensor:
        """
        Input: torch.Tensor of shape (2, H, W)
        """
        if not self.is_training:
            return sar_tensor

        # Random Horizontal Flip (p=0.5)
        if torch.rand(1).item() > 0.5:
            sar_tensor = torch.flip(sar_tensor, dims=[2])

        # Random Vertical Flip (p=0.5)
        if torch.rand(1).item() > 0.5:
            sar_tensor = torch.flip(sar_tensor, dims=[1])

        # Random 90 deg rotation (k in [0, 1, 2, 3])
        k = torch.randint(0, 4, (1,)).item()
        if k > 0:
            sar_tensor = torch.rot90(sar_tensor, k=k, dims=[1, 2])

        return sar_tensor
