"""
SatQuery AI — Unit Tests for Phase 4 SAR Feature Encoder
Tests encode_sar(), batch_encode_sar(), cosine similarity, and TorchScript export.
"""

import sys
import time
from pathlib import Path
import numpy as np
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from model_a.encoder import SAREncoder


def test_sar_encoder_suite():
    print("=" * 70)
    print("SATQUERY AI — PHASE 4: SAR FEATURE ENCODER SUITE")
    print("=" * 70)

    encoder = SAREncoder()
    
    # 1. Single patch encoding
    print("\n[1/4] Testing Single Patch encode_sar()...")
    dummy_vh = np.random.uniform(-30.0, -10.0, (120, 120)).astype(np.float32)
    dummy_vv = np.random.uniform(-20.0, -5.0, (120, 120)).astype(np.float32)

    emb = encoder.encode_sar(dummy_vh, dummy_vv)
    assert emb.shape == (512,), f"Expected shape (512,), got {emb.shape}"
    assert np.isclose(np.linalg.norm(emb), 1.0, atol=1e-3), "Embedding is not unit normalized!"
    print(f"      Embedding shape: {emb.shape} | L2-norm: {np.linalg.norm(emb):.4f} — PASS")

    # 2. Batch encoding
    print("\n[2/4] Testing batch_encode_sar()...")
    dummy_batch = torch.randn(8, 2, 120, 120)
    batch_emb = encoder.batch_encode_sar(dummy_batch)
    assert batch_emb.shape == (8, 512), f"Expected shape (8, 512), got {batch_emb.shape}"
    print(f"      Batch embedding shape: {batch_emb.shape} — PASS")

    # 3. Cosine similarity sanity check (T1 vs T1 vs T2)
    print("\n[3/4] Testing Cosine Similarity (Temporal Comparison)...")
    # Same patch should have similarity 1.0
    sim_self = encoder.compute_similarity(emb, emb)
    assert np.isclose(sim_self, 1.0, atol=1e-4), f"Self similarity should be 1.0, got {sim_self}"

    # Different random patch
    different_vh = np.random.uniform(-10.0, 0.0, (120, 120)).astype(np.float32)
    different_vv = np.random.uniform(-5.0, 5.0, (120, 120)).astype(np.float32)
    emb_diff = encoder.encode_sar(different_vh, different_vv)
    sim_diff = encoder.compute_similarity(emb, emb_diff)
    print(f"      Self-Similarity (No change):    {sim_self:.4f}")
    print(f"      Cross-Similarity (Diff patch):  {sim_diff:.4f}")
    print("      Similarity metric — PASS")

    # 4. TorchScript export test
    print("\n[4/4] Testing TorchScript Export for Cross-Platform Deployment...")
    export_file = BASE_DIR / "model_a" / "checkpoints" / "sar_encoder_jit.pt"
    encoder.export_torchscript(export_file)
    assert export_file.exists(), "TorchScript file not generated!"
    
    # Reload traced model to verify
    loaded_jit = torch.jit.load(str(export_file))
    with torch.no_grad():
        jit_out = loaded_jit(torch.randn(1, 2, 120, 120, device=encoder.device))
    assert jit_out.shape == (1, 512), "JIT model output shape mismatch!"
    print(f"      JIT Model Verified: {export_file.name} ({export_file.stat().st_size / 1024:.1f} KB) — PASS")

    print("\n" + "=" * 70)
    print("ALL PHASE 4 SAR FEATURE ENCODER TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_sar_encoder_suite()
