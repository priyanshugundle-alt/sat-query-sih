"""
SatQuery AI — Unified Dual-Stream Multi-Modal Fusion Model
Integrates:
1. Sentinel-1 SAR Specialist Branch (2-channel ResNet-18, 512-D)
2. Sentinel-2 Optical Specialist Branch (12-channel ResNet-18, 512-D)
3. Bidirectional Cross-Attention Latent Fusion Neck (1024-D)
4. Class-Index Alignment Permutation Layer (mapping S2 alphabetical to standard CORINE 19)
5. Multi-Sensor Consensus Classifier Head
"""

from typing import Dict, List, Optional, Tuple, Any
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet18

from model_a.data.corine_classes import CORINE_19_CLASSES


class CrossAttentionLatentNeck(nn.Module):
    """
    Bidirectional Cross-Attention & Gated Latent Fusion Neck.
    Takes 512-D SAR embeddings and 512-D Optical embeddings, allows cross-attention,
    and fuses them into a unit-normalized 1024-dimensional joint representation.
    """
    def __init__(self, sar_dim: int = 512, optical_dim: int = 512, fused_dim: int = 1024, num_heads: int = 4):
        super().__init__()
        self.sar_dim = sar_dim
        self.optical_dim = optical_dim
        self.fused_dim = fused_dim
        self.num_heads = num_heads

        # Projections to fused latent dimension
        self.proj_q_sar = nn.Linear(sar_dim, fused_dim)
        self.proj_k_optical = nn.Linear(optical_dim, fused_dim)
        self.proj_v_optical = nn.Linear(optical_dim, fused_dim)

        self.proj_q_optical = nn.Linear(optical_dim, fused_dim)
        self.proj_k_sar = nn.Linear(sar_dim, fused_dim)
        self.proj_v_sar = nn.Linear(sar_dim, fused_dim)

        # Gated fusion layer
        self.gate_layer = nn.Sequential(
            nn.Linear(fused_dim * 2, fused_dim),
            nn.Sigmoid()
        )

        # Layer normalization
        self.norm_sar = nn.LayerNorm(fused_dim)
        self.norm_optical = nn.LayerNorm(fused_dim)
        self.norm_fused = nn.LayerNorm(fused_dim)

    def forward(self, z_sar: torch.Tensor, z_optical: torch.Tensor) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        # Normalize inputs
        norm_sar = F.normalize(z_sar, p=2, dim=-1)
        norm_optical = F.normalize(z_optical, p=2, dim=-1)

        # Queries, Keys, Values
        q_sar = self.proj_q_sar(norm_sar)
        k_opt = self.proj_k_optical(norm_optical)
        v_opt = self.proj_v_optical(norm_optical)

        q_opt = self.proj_q_optical(norm_optical)
        k_sar = self.proj_k_sar(norm_sar)
        v_sar = self.proj_v_sar(norm_sar)

        # Cross-attention weights (scaled dot-product)
        scale = 1.0 / math.sqrt(self.fused_dim)
        attn_sar_to_opt = torch.sigmoid((q_sar * k_opt).sum(dim=-1, keepdim=True) * scale)
        attn_opt_to_sar = torch.sigmoid((q_opt * k_sar).sum(dim=-1, keepdim=True) * scale)

        # Contextual representations
        ctx_sar = self.norm_sar(attn_sar_to_opt * v_opt + (1.0 - attn_sar_to_opt) * q_sar)
        ctx_opt = self.norm_optical(attn_opt_to_sar * v_sar + (1.0 - attn_opt_to_sar) * q_opt)

        # Gated combination
        concat = torch.cat([ctx_sar, ctx_opt], dim=-1)
        gate = self.gate_layer(concat)
        fused = self.norm_fused(gate * ctx_sar + (1.0 - gate) * ctx_opt)

        # Final unit L2 normalization
        fused_normalized = F.normalize(fused, p=2, dim=-1)

        # Cross-sensor alignment metric (cosine similarity between 512-D raw embeddings)
        cosine_sim = F.cosine_similarity(norm_sar, norm_optical, dim=-1)

        meta = {
            "attn_sar_to_opt": attn_sar_to_opt,
            "attn_opt_to_sar": attn_opt_to_sar,
            "gate_mean": gate.mean(dim=-1),
            "cross_sensor_cosine": cosine_sim
        }

        return fused_normalized, meta


class SatQueryUnifiedFusionNet(nn.Module):
    """
    Unified Single PyTorch Model containing both Sentinel-1 SAR and Sentinel-2 Optical branches.
    Provides:
    - Dual-input joint inference: forward(sar_tensor, optical_tensor)
    - Single-sensor fallback: forward_sar(sar_tensor), forward_optical(optical_tensor)
    - 512-D single sensor embeddings + 1024-D cross-modal joint embedding
    - Automatic class permutation to guarantee standard CORINE 19 alignment
    """
    def __init__(
        self,
        s2_classes_alphabetical: Optional[List[str]] = None,
        s1_classes_standard: Optional[List[str]] = None,
        num_classes: int = 19
    ):
        super().__init__()
        self.num_classes = num_classes

        # Setup class names
        self.classes_standard = s1_classes_standard or CORINE_19_CLASSES

        # -------------------------------------------------------------
        # 1. Branch A: Sentinel-1 SAR ResNet-18 (2 input channels)
        # -------------------------------------------------------------
        self.branch_sar = resnet18(weights=None)
        self.branch_sar.conv1 = nn.Conv2d(
            in_channels=2,
            out_channels=64,
            kernel_size=7,
            stride=2,
            padding=3,
            bias=False
        )
        self.branch_sar.fc = nn.Linear(self.branch_sar.fc.in_features, num_classes)

        # -------------------------------------------------------------
        # 2. Branch B: Sentinel-2 Optical ResNet-18 (12 input channels)
        # -------------------------------------------------------------
        self.branch_optical = resnet18(weights=None)
        self.branch_optical.conv1 = nn.Conv2d(
            in_channels=12,
            out_channels=64,
            kernel_size=7,
            stride=2,
            padding=3,
            bias=False
        )
        self.branch_optical.fc = nn.Linear(self.branch_optical.fc.in_features, num_classes)

        # -------------------------------------------------------------
        # 3. Class Alignment Map: S2 (alphabetical) -> Standard CORINE
        # -------------------------------------------------------------
        default_s2_alpha = [
            'Agro-forestry areas', 'Arable land', 'Beaches, dunes, sands', 'Broad-leaved forest',
            'Coastal wetlands', 'Complex cultivation patterns', 'Coniferous forest',
            'Industrial or commercial units', 'Inland waters', 'Inland wetlands',
            'Land principally occupied by agriculture, with significant areas of natural vegetation',
            'Marine waters', 'Mixed forest', 'Moors, heathland and sclerophyllous vegetation',
            'Natural grassland and sparsely vegetated areas', 'Pastures', 'Permanent crops',
            'Transitional woodland, shrub', 'Urban fabric'
        ]
        s2_list = s2_classes_alphabetical or default_s2_alpha

        # Build index mapping: for each standard index i, what was its index in s2_list?
        mapping = [s2_list.index(c) for c in self.classes_standard]
        self.register_buffer("s2_to_standard_indices", torch.tensor(mapping, dtype=torch.long))

        # -------------------------------------------------------------
        # 4. Latent Cross-Attention Neck (1024-D)
        # -------------------------------------------------------------
        self.fusion_neck = CrossAttentionLatentNeck(
            sar_dim=512,
            optical_dim=512,
            fused_dim=1024,
            num_heads=4
        )

        # -------------------------------------------------------------
        # 5. Joint Fused Classifier Head
        # -------------------------------------------------------------
        self.fused_classifier = nn.Sequential(
            nn.Linear(1024, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes)
        )

    def extract_sar_embedding(self, x_sar: torch.Tensor) -> torch.Tensor:
        """Extracts 512-D embedding from Sentinel-1 SAR input."""
        x = self.branch_sar.conv1(x_sar)
        x = self.branch_sar.bn1(x)
        x = self.branch_sar.relu(x)
        x = self.branch_sar.maxpool(x)

        x = self.branch_sar.layer1(x)
        x = self.branch_sar.layer2(x)
        x = self.branch_sar.layer3(x)
        x = self.branch_sar.layer4(x)

        x = self.branch_sar.avgpool(x)
        emb = torch.flatten(x, 1)
        return F.normalize(emb, p=2, dim=-1)

    def extract_optical_embedding(self, x_optical: torch.Tensor) -> torch.Tensor:
        """Extracts 512-D embedding from Sentinel-2 Optical input."""
        x = self.branch_optical.conv1(x_optical)
        x = self.branch_optical.bn1(x)
        x = self.branch_optical.relu(x)
        x = self.branch_optical.maxpool(x)

        x = self.branch_optical.layer1(x)
        x = self.branch_optical.layer2(x)
        x = self.branch_optical.layer3(x)
        x = self.branch_optical.layer4(x)

        x = self.branch_optical.avgpool(x)
        emb = torch.flatten(x, 1)
        return F.normalize(emb, p=2, dim=-1)

    def forward_sar(self, x_sar: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Single-sensor inference using only Sentinel-1 SAR."""
        emb = self.extract_sar_embedding(x_sar)
        logits = self.branch_sar.fc(emb)
        probs = torch.sigmoid(logits)
        return {
            "mode": "sar_only",
            "logits": logits,
            "probabilities": probs,
            "embedding": emb,
            "embedding_dim": 512
        }

    def forward_optical(self, x_optical: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Single-sensor inference using only Sentinel-2 Optical (aligned to standard CORINE)."""
        emb = self.extract_optical_embedding(x_optical)
        raw_logits = self.branch_optical.fc(emb)
        # Permute logits to standard CORINE order
        aligned_logits = raw_logits[:, self.s2_to_standard_indices]
        probs = torch.sigmoid(aligned_logits)
        return {
            "mode": "optical_only",
            "logits": aligned_logits,
            "probabilities": probs,
            "embedding": emb,
            "embedding_dim": 512
        }

    def forward(
        self,
        x_sar: torch.Tensor,
        x_optical: torch.Tensor,
        alpha_sar: float = 0.5
    ) -> Dict[str, Any]:
        """
        Unified Multi-Modal Forward Pass.
        Computes SAR, Optical, and 1024-D cross-attention fused predictions.
        """
        # 1. Extract individual embeddings
        emb_sar = self.extract_sar_embedding(x_sar)
        emb_opt = self.extract_optical_embedding(x_optical)

        # 2. Extract branch logits
        sar_logits = self.branch_sar.fc(emb_sar)
        opt_raw_logits = self.branch_optical.fc(emb_opt)
        opt_aligned_logits = opt_raw_logits[:, self.s2_to_standard_indices]

        # 3. Compute 1024-D cross-attention fused embedding
        fused_emb, meta = self.fusion_neck(emb_sar, emb_opt)

        # 4. Fused classifier logits
        fused_logits = self.fused_classifier(fused_emb)

        # 5. Consensus Ensemble Logits (weighted combination of fused + individual specialist votes)
        consensus_logits = 0.5 * fused_logits + 0.25 * sar_logits + 0.25 * opt_aligned_logits
        consensus_probs = torch.sigmoid(consensus_logits)

        return {
            "mode": "joint_fusion",
            "fused_logits": consensus_logits,
            "fused_probabilities": consensus_probs,
            "fused_embedding": fused_emb,  # (B, 1024)
            "fused_dim": 1024,
            "sar_logits": sar_logits,
            "sar_probabilities": torch.sigmoid(sar_logits),
            "sar_embedding": emb_sar,      # (B, 512)
            "optical_logits": opt_aligned_logits,
            "optical_probabilities": torch.sigmoid(opt_aligned_logits),
            "optical_embedding": emb_opt,  # (B, 512)
            "alignment_meta": meta
        }
