"""
SatQuery AI — Model A Architecture: ResNet-18 SAR Specialist
Modified 2-channel ResNet backbone for dual-polarization Sentinel-1 [VH, VV] imagery.
Supports both multi-label land-cover classification and standalone 512-dim SAR feature extraction.
"""

from typing import Dict, Optional, Tuple
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet18_Weights


class ResNet18_SAR(nn.Module):
    """
    ResNet-18 adapted for Dual-Polarization (VH/VV) SAR inputs:
    - Input: (B, 2, 120, 120) tensor of normalized SAR decibel values.
    - Conv1: Modified to accept 2 channels instead of 3 (initialized with averaged RGB weights).
    - Backbone: Standard ResNet-18 residual stages (Residual Blocks 1 to 4).
    - AdaptiveAvgPool2d: Outputs a 512-dimensional spatial feature vector.
    - Classifier: Linear(512, num_classes) with dropout for regularization.
    """
    def __init__(
        self,
        num_classes: int = 19,
        in_channels: int = 2,
        pretrained: bool = True,
        dropout: float = 0.2
    ):
        super().__init__()
        self.num_classes = num_classes
        self.in_channels = in_channels

        # Load standard ResNet-18
        if pretrained:
            base_model = models.resnet18(weights=ResNet18_Weights.DEFAULT)
        else:
            base_model = models.resnet18(weights=None)

        # Adapt first conv layer for 2-channel SAR input
        original_conv1 = base_model.conv1
        self.conv1 = nn.Conv2d(
            in_channels=in_channels,
            out_channels=original_conv1.out_channels,
            kernel_size=original_conv1.kernel_size,
            stride=original_conv1.stride,
            padding=original_conv1.padding,
            bias=original_conv1.bias is not None
        )

        # Initialize 2-channel conv1 weights from pretrained 3-channel weights
        if pretrained:
            with torch.no_grad():
                # Average across 3 channels and duplicate across 2 channels
                w = original_conv1.weight.data  # (64, 3, 7, 7)
                w_mean = w.mean(dim=1, keepdim=True)  # (64, 1, 7, 7)
                self.conv1.weight.data = w_mean.repeat(1, in_channels, 1, 1)

        # Residual Stages
        self.bn1 = base_model.bn1
        self.relu = base_model.relu
        self.maxpool = base_model.maxpool
        self.layer1 = base_model.layer1
        self.layer2 = base_model.layer2
        self.layer3 = base_model.layer3
        self.layer4 = base_model.layer4

        # Global Pooling & Classifier
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=dropout)
        self.fc = nn.Linear(512, num_classes)

    def extract_features(self, x: torch.Tensor, normalize: bool = False) -> torch.Tensor:
        """
        Extracts a 512-dimensional feature embedding for downstream Agent reasoning,
        multimodal fusion, or change detection.
        Input: (B, 2, 120, 120)
        Output: (B, 512) feature embedding
        """
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        features = torch.flatten(x, 1)
        if normalize:
            features = torch.nn.functional.normalize(features, p=2, dim=-1)
        return features

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass returning raw class logits for multi-label BCE loss.
        Input: (B, 2, 120, 120)
        Output: (B, num_classes) raw logits
        """
        features = self.extract_features(x)
        features = self.dropout(features)
        logits = self.fc(features)
        return logits

    @torch.no_grad()
    def predict_probabilities(self, x: torch.Tensor) -> torch.Tensor:
        """
        Returns calibrated Sigmoid probabilities in range [0.0, 1.0].
        """
        self.eval()
        logits = self.forward(x)
        return torch.sigmoid(logits)
