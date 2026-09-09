"""
SatQuery AI — Unified Multi-Modal Fusion Checkpoint Builder
Merges Model A (Sentinel-1 SAR) and Model B (Sentinel-2 Optical) into a single
unified PyTorch checkpoint: unified_fusion_model.pt
"""

import os
import sys
from pathlib import Path
import time
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from agent.unified_model import SatQueryUnifiedFusionNet
from model_a.data.corine_classes import CORINE_19_CLASSES


def build_and_save_unified_checkpoint(
    s1_checkpoint_path: Path = BASE_DIR / "model_a" / "checkpoints" / "best_model_a.pt",
    s2_checkpoint_path: Path = BASE_DIR.parent / "SatQuery_S2_FINAL" / "model" / "best_model.pth",
    output_checkpoint_path: Path = BASE_DIR / "model_a" / "checkpoints" / "unified_fusion_model.pt",
    device: str = "cpu"
) -> Path:
    print("=" * 70)
    print("SATQUERY AI — BUILDING UNIFIED MULTI-MODAL FUSION MODEL")
    print("=" * 70)

    # 1. Verify existence of input checkpoints
    assert s1_checkpoint_path.exists(), f"Missing Model A checkpoint: {s1_checkpoint_path}"
    assert s2_checkpoint_path.exists(), f"Missing Model B checkpoint: {s2_checkpoint_path}"

    print(f"[1/5] Loading Model A (SAR Specialist): {s1_checkpoint_path}")
    s1_ckpt = torch.load(s1_checkpoint_path, map_location="cpu")
    s1_state = s1_ckpt.get("model_state_dict", s1_ckpt)
    s1_classes = s1_ckpt.get("class_names", CORINE_19_CLASSES)

    print(f"[2/5] Loading Model B (Optical Specialist): {s2_checkpoint_path}")
    s2_ckpt = torch.load(s2_checkpoint_path, map_location="cpu")
    s2_state = s2_ckpt.get("model_state_dict", s2_ckpt)
    s2_classes = s2_ckpt.get("classes", [])

    print(f"      Model A Classes (CORINE standard): {len(s1_classes)}")
    print(f"      Model B Classes (Alphabetical):    {len(s2_classes)}")

    # 2. Instantiate Unified Model
    print("\n[3/5] Instantiating SatQueryUnifiedFusionNet...")
    model = SatQueryUnifiedFusionNet(
        s2_classes_alphabetical=s2_classes,
        s1_classes_standard=s1_classes,
        num_classes=len(s1_classes)
    )

    # 3. Transfer weights
    print("      Transferring weights to branch_sar...")
    missing_sar, unexp_sar = model.branch_sar.load_state_dict(s1_state, strict=True)
    print(f"      SAR Branch: 100% weights matched (strict=True)")

    print("      Transferring weights to branch_optical...")
    missing_opt, unexp_opt = model.branch_optical.load_state_dict(s2_state, strict=True)
    print(f"      Optical Branch: 100% weights matched (strict=True)")

    model.eval()

    # 4. Smoke test forward passes
    print("\n[4/5] Executing Multi-Modal Forward Pass Smoke Tests...")
    x_sar = torch.randn(2, 2, 120, 120)
    x_opt = torch.randn(2, 12, 120, 120)

    with torch.no_grad():
        # Joint mode
        out_joint = model(x_sar, x_opt)
        assert out_joint["fused_embedding"].shape == (2, 1024), f"Bad fused embedding shape: {out_joint['fused_embedding'].shape}"
        assert out_joint["fused_probabilities"].shape == (2, 19), f"Bad fused prob shape: {out_joint['fused_probabilities'].shape}"
        print(f"      Joint Forward Pass: OK (fused_embedding: {out_joint['fused_embedding'].shape}, probs: {out_joint['fused_probabilities'].shape})")
        print(f"      Cross-Sensor Cosine: {out_joint['alignment_meta']['cross_sensor_cosine'].tolist()}")

        # SAR-only mode
        out_sar = model.forward_sar(x_sar)
        assert out_sar["embedding"].shape == (2, 512)
        assert out_sar["probabilities"].shape == (2, 19)
        print(f"      SAR-Only Forward Pass: OK (embedding: {out_sar['embedding'].shape}, probs: {out_sar['probabilities'].shape})")

        # Optical-only mode
        out_opt = model.forward_optical(x_opt)
        assert out_opt["embedding"].shape == (2, 512)
        assert out_opt["probabilities"].shape == (2, 19)
        print(f"      Optical-Only Forward Pass: OK (embedding: {out_opt['embedding'].shape}, probs: {out_opt['probabilities'].shape})")

    # 5. Save unified checkpoint
    output_checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"\n[5/5] Saving Unified Checkpoint to: {output_checkpoint_path}")

    checkpoint_payload = {
        "model_state_dict": model.state_dict(),
        "model_architecture": "SatQueryUnifiedFusionNet",
        "description": "Unified Dual-Stream ResNet-18 Multi-Modal Earth Observation Fusion Network",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "modalities": {
            "sar": {
                "sensor": "Sentinel-1 C-SAR",
                "bands": ["VH", "VV"],
                "in_channels": 2,
                "embedding_dim": 512,
                "source_checkpoint": str(s1_checkpoint_path)
            },
            "optical": {
                "sensor": "Sentinel-2 MSI",
                "bands": ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B11", "B12"],
                "in_channels": 12,
                "embedding_dim": 512,
                "source_checkpoint": str(s2_checkpoint_path)
            }
        },
        "joint_fusion": {
            "neck_type": "CrossAttentionLatentNeck",
            "joint_embedding_dim": 1024,
            "alignment": "bidirectional_gated_cross_attention"
        },
        "classes_standard_corine": s1_classes,
        "classes_optical_alphabetical": s2_classes,
        "s2_to_standard_indices": model.s2_to_standard_indices.tolist(),
        "num_classes": 19
    }

    torch.save(checkpoint_payload, output_checkpoint_path)
    file_size_mb = output_checkpoint_path.stat().st_size / (1024 * 1024)
    print(f"      Successfully saved unified model ({file_size_mb:.2f} MB)")
    print("=" * 70)
    print("UNIFIED MODEL CREATION COMPLETE!")
    print("=" * 70)

    return output_checkpoint_path


if __name__ == "__main__":
    build_and_save_unified_checkpoint()
