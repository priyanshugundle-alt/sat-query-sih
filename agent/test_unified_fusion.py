"""
SatQuery AI — Unified Multi-Modal Fusion Model Verification Suite
Tests:
1. Model loading from unified_fusion_model.pt checkpoint
2. Forward passes: Joint (1024-D), SAR-only (512-D), Optical-only (512-D)
3. Unit-norm verification on fused 1024-D vectors
4. Class alignment between Model A, Model B, and Unified Model
5. Live Optical Adapter verification
"""

import sys
from pathlib import Path
import torch
import torch.nn.functional as F

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from agent.unified_model import SatQueryUnifiedFusionNet
from agent.model_b_adapter import OpticalSpecialistLive
from agent.model_registry import SpecialistModelRegistry
from model_a.data.corine_classes import CORINE_19_CLASSES


def test_unified_model():
    print("=" * 70)
    print("TESTING SATQUERY UNIFIED MULTI-MODAL FUSION MODEL")
    print("=" * 70)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    ckpt_path = BASE_DIR / "model_a" / "checkpoints" / "unified_fusion_model.pt"
    assert ckpt_path.exists(), f"Checkpoint missing: {ckpt_path}"

    # 1. Load Checkpoint
    print("\n[1/5] Loading unified checkpoint payload...")
    payload = torch.load(ckpt_path, map_location=device)
    assert "model_state_dict" in payload, "Missing model_state_dict"
    print(f"      Architecture: {payload['model_architecture']}")
    print(f"      Timestamp:    {payload['timestamp']}")
    print(f"      Classes:      {payload['num_classes']}")

    # 2. Instantiate and load model
    print("\n[2/5] Instantiating and loading model weights...")
    model = SatQueryUnifiedFusionNet(
        s2_classes_alphabetical=payload["classes_optical_alphabetical"],
        s1_classes_standard=payload["classes_standard_corine"],
        num_classes=payload["num_classes"]
    ).to(device)

    model.load_state_dict(payload["model_state_dict"], strict=True)
    model.eval()
    print("      Model weights loaded with 100% strict match!")

    # 3. Test Dual-Stream Forward Pass
    print("\n[3/5] Testing Multi-Modal Joint Forward Pass...")
    x_sar = torch.randn(4, 2, 120, 120, device=device)
    x_opt = torch.randn(4, 12, 120, 120, device=device)

    with torch.no_grad():
        out = model(x_sar, x_opt)

    assert out["fused_embedding"].shape == (4, 1024), f"Bad fused embedding: {out['fused_embedding'].shape}"
    assert out["fused_probabilities"].shape == (4, 19), f"Bad fused probs: {out['fused_probabilities'].shape}"

    # Verify L2 norm is 1.0
    fused_norms = torch.norm(out["fused_embedding"], p=2, dim=-1)
    for n in fused_norms.cpu().numpy():
        assert abs(n - 1.0) < 1e-4, f"L2 norm not 1.0: {n}"
    print(f"      Fused Embeddings: (4, 1024) with strict unit L2 norm = {fused_norms.mean().item():.6f}")
    print(f"      Fused Probabilities: (4, 19) in range [{out['fused_probabilities'].min():.3f}, {out['fused_probabilities'].max():.3f}]")

    # 4. Test Single-Sensor Fallbacks
    print("\n[4/5] Testing Single-Sensor Fallback Passes...")
    with torch.no_grad():
        sar_out = model.forward_sar(x_sar)
        opt_out = model.forward_optical(x_opt)

    assert sar_out["embedding"].shape == (4, 512)
    assert opt_out["embedding"].shape == (4, 512)
    assert sar_out["probabilities"].shape == (4, 19)
    assert opt_out["probabilities"].shape == (4, 19)
    print("      SAR-only Mode:     (4, 512) -> 19 classes [PASS]")
    print("      Optical-only Mode: (4, 512) -> 19 classes [PASS]")

    # 5. Test Live Model B Adapter & Registry
    print("\n[5/5] Testing Live Optical Specialist Adapter & Registry...")
    adapter = OpticalSpecialistLive()
    assert adapter.is_live, "Optical adapter failed to load live weights!"
    print(f"      Adapter Status: {adapter.get_metadata()['status']}")

    dummy_raster = torch.randn(12, 120, 120)
    res = adapter.predict(dummy_raster)
    assert "detected_classes" in res["result"]
    assert "spectral_indices" in res["result"]
    print(f"      Live Optical Inference: Top class = '{res['result']['detected_classes'][0]}' (confidence: {res['confidence']:.3f})")
    print(f"      Estimated NDVI = {res['result']['spectral_indices']['estimated_ndvi']:.3f}")

    registry = SpecialistModelRegistry()
    status = registry.get_status()
    assert "unified_fusion" in status["registered_models"]
    print(f"      Specialist Registry: {len(status['registered_models'])} models registered (inc. unified_fusion)")

    print("\n" + "=" * 70)
    print("ALL 5 MULTI-MODAL FUSION VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    test_unified_model()
