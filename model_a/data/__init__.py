"""
SatQuery AI — Model A Data Module
"""

from model_a.data.corine_classes import (
    CORINE_19_CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    encode_labels,
    decode_predictions
)
from model_a.data.transforms import SARDecibelNormalization, SARAugmentations
from model_a.data.dataset import BigEarthNetS1Dataset, scan_and_index_patches
from model_a.data.splits import create_reproducible_splits
from model_a.data.dataloader import build_dataloaders

__all__ = [
    "CORINE_19_CLASSES",
    "CLASS_TO_IDX",
    "IDX_TO_CLASS",
    "encode_labels",
    "decode_predictions",
    "SARDecibelNormalization",
    "SARAugmentations",
    "BigEarthNetS1Dataset",
    "scan_and_index_patches",
    "create_reproducible_splits",
    "build_dataloaders"
]
