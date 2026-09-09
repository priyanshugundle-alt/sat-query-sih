"""
SatQuery AI — Model A Configuration
Centralized configuration parameters for BigEarthNet-S1 SAR Dataset and Model A.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Tuple


@dataclass
class DatasetConfig:
    # Root dataset path
    raw_dataset_dir: Path = Path(r"D:\SIH\BigEarthNet-S1")
    
    # Metadata & Splitting cache directory
    cache_dir: Path = Path(r"D:\SIH\sat-query-sih\model_a\cache")
    
    # SAR image specs
    img_height: int = 120
    img_width: int = 120
    in_channels: int = 2  # [VH, VV]
    
    # Polarizations
    polarizations: Tuple[str, ...] = ("VH", "VV")
    
    # SAR Backscatter (dB) Statistics (BigEarthNet-S1 reference standard)
    vh_mean: float = -19.27
    vh_std: float = 5.49
    vv_mean: float = -12.64
    vv_std: float = 5.11
    
    # Clip extreme noise / outliers in dB
    db_min: float = -50.0
    db_max: float = 5.0
    
    # Dataset splits
    train_ratio: float = 0.70
    val_ratio: float = 0.15
    test_ratio: float = 0.15
    random_seed: int = 42
    
    # Number of multi-label classes (CORINE 19)
    num_classes: int = 19


@dataclass
class TrainingConfig:
    batch_size: int = 32
    num_workers: int = 2
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    max_epochs: int = 15
    use_amp: bool = True  # Automatic Mixed Precision for RTX 3050 (4GB VRAM)
    grad_accum_steps: int = 2
    device: str = "cuda"  # fallback to 'cpu' if cuda unavailable
    checkpoint_dir: Path = Path(r"D:\SIH\sat-query-sih\model_a\checkpoints")
    logs_dir: Path = Path(r"D:\SIH\sat-query-sih\model_a\logs")


@dataclass
class ModelAConfig:
    dataset: DatasetConfig = field(default_factory=DatasetConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)


# Global instance
CONFIG = ModelAConfig()
