"""
SatQuery AI — DataLoader Builder for Model A
Configures optimized PyTorch DataLoaders with multi-process prefetching and memory pinning.
"""

from typing import Dict, List, Optional, Tuple
import torch
from torch.utils.data import DataLoader

from model_a.config import CONFIG, ModelAConfig
from model_a.data.dataset import BigEarthNetS1Dataset


def build_dataloaders(
    train_samples: List[Dict],
    val_samples: List[Dict],
    test_samples: Optional[List[Dict]] = None,
    config: ModelAConfig = CONFIG
) -> Tuple[DataLoader, DataLoader, Optional[DataLoader]]:
    """
    Constructs PyTorch DataLoaders for Training, Validation, and Testing.
    """
    train_dataset = BigEarthNetS1Dataset(
        samples=train_samples,
        config=config.dataset,
        is_training=True
    )
    val_dataset = BigEarthNetS1Dataset(
        samples=val_samples,
        config=config.dataset,
        is_training=False
    )

    pin_memory = torch.cuda.is_available()
    # On Windows, num_workers > 0 requires __main__ protection
    num_workers = config.training.num_workers

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.training.batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=pin_memory,
        drop_last=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=config.training.batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        drop_last=False
    )

    test_loader = None
    if test_samples:
        test_dataset = BigEarthNetS1Dataset(
            samples=test_samples,
            config=config.dataset,
            is_training=False
        )
        test_loader = DataLoader(
            test_dataset,
            batch_size=config.training.batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=pin_memory,
            drop_last=False
        )

    return train_loader, val_loader, test_loader
