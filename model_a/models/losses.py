"""
SatQuery AI — Loss Functions for Multi-Label SAR Classification
Includes Binary Cross-Entropy with Logits and Multi-Label Focal Loss for class imbalance.
"""

from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F


class MultiLabelBCEWithLogitsLoss(nn.Module):
    """
    Standard Binary Cross-Entropy with Logits Loss with optional positive class weights.
    """
    def __init__(self, pos_weight: Optional[torch.Tensor] = None):
        super().__init__()
        self.criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        return self.criterion(logits, targets)


class MultiLabelFocalLoss(nn.Module):
    """
    Focal Loss adapted for Multi-Label Classification:
    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)
    Helps focus training on hard negative / sparse minority land-cover classes.
    """
    def __init__(self, gamma: float = 2.0, alpha: float = 0.25, reduction: str = "mean"):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        
        p_t = probs * targets + (1 - probs) * (1 - targets)
        alpha_factor = targets * self.alpha + (1 - targets) * (1 - self.alpha)
        modulating_factor = torch.pow(1.0 - p_t, self.gamma)
        
        focal_loss = alpha_factor * modulating_factor * bce_loss

        if self.reduction == "mean":
            return focal_loss.mean()
        elif self.reduction == "sum":
            return focal_loss.sum()
        else:
            return focal_loss
