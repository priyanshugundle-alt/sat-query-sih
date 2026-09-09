"""
SatQuery AI — Comprehensive Unit Test Suite for Model A
Tests model architecture, input/output tensor shapes, forward/backward pass,
loss computation, and inference engine.
"""

import sys
import time
from pathlib import Path
import numpy as np
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from model_a.config import CONFIG
from model_a.models.resnet_sar import ResNet18_SAR
from model_a.models.losses import MultiLabelBCEWithLogitsLoss, MultiLabelFocalLoss
from model_a.models.metrics import calculate_multilabel_metrics
from model_a.inference import ModelAInference


def test_model_a_suite():
    print("=" * 70)
    print("SATQUERY AI — PHASE 2: MODEL A ARCHITECTURE & INFERENCE TESTS")
    print("=" * 70)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[1/5] Compute Device: {device}")

    # 1. Architecture instantiation & 2-channel conv1 test
    print("\n[2/5] Testing ResNet-18 SAR Model Initialization...")
    model = ResNet18_SAR(num_classes=19, in_channels=2, pretrained=False).to(device)
    dummy_input = torch.randn(4, 2, 120, 120, device=device)
    
    # Forward pass
    logits = model(dummy_input)
    assert logits.shape == (4, 19), f"Expected shape (4, 19), got {logits.shape}"
    print(f"      Forward logits shape: {logits.shape} — PASS")

    # Feature extraction pass
    features = model.extract_features(dummy_input)
    assert features.shape == (4, 512), f"Expected feature shape (4, 512), got {features.shape}"
    print(f"      Feature embedding shape: {features.shape} — PASS")

    # Probability prediction
    probs = model.predict_probabilities(dummy_input)
    assert probs.shape == (4, 19), f"Expected probs shape (4, 19), got {probs.shape}"
    assert (probs >= 0.0).all() and (probs <= 1.0).all(), "Probabilities outside [0, 1] range!"
    print(f"      Calibrated Sigmoid output range: [{probs.min().item():.3f}, {probs.max().item():.3f}] — PASS")

    # 2. Loss computation and backward gradient test
    print("\n[3/5] Testing Multi-Label Losses & Backprop Gradient Flow...")
    dummy_targets = torch.randint(0, 2, (4, 19), dtype=torch.float32, device=device)
    
    bce_loss_fn = MultiLabelBCEWithLogitsLoss()
    focal_loss_fn = MultiLabelFocalLoss()

    loss_bce = bce_loss_fn(logits, dummy_targets)
    loss_focal = focal_loss_fn(logits, dummy_targets)

    print(f"      BCE Loss:   {loss_bce.item():.4f}")
    print(f"      Focal Loss: {loss_focal.item():.4f}")

    assert not torch.isnan(loss_bce) and not torch.isinf(loss_bce), "NaN in BCE loss!"
    assert not torch.isnan(loss_focal) and not torch.isinf(loss_focal), "NaN in Focal loss!"

    # Test backward pass
    loss_bce.backward()
    assert model.conv1.weight.grad is not None, "Gradients not computed for conv1!"
    print("      Backward pass & Gradient Flow — PASS")

    # 3. Multi-label metrics test
    print("\n[4/5] Testing Evaluation Metrics...")
    y_true = np.array([
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ])
    y_probs = np.array([
        [0.9, 0.1, 0.8, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        [0.2, 0.85, 0.1, 0.75, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
    ])
    metrics = calculate_multilabel_metrics(y_true, y_probs, threshold=0.5)
    print(f"      Calculated Macro F1:       {metrics['macro_f1']:.4f}")
    print(f"      Calculated Micro F1:       {metrics['micro_f1']:.4f}")
    print(f"      Calculated Exact Match:    {metrics['exact_match_ratio']:.4f}")
    assert metrics["macro_f1"] > 0.9, "Metric calculation failed on synthetic test!"
    print("      Metric calculations — PASS")

    # 4. Standardized Inference Engine test
    print("\n[5/5] Testing Standardized Inference Interface (ModelAInference)...")
    inference_engine = ModelAInference()
    
    dummy_vh = np.random.uniform(-30.0, -5.0, (120, 120)).astype(np.float32)
    dummy_vv = np.random.uniform(-25.0, 0.0, (120, 120)).astype(np.float32)

    result = inference_engine.predict(vh_input=dummy_vh, vv_input=dummy_vv)
    
    print(f"      Model Name:        {result['model_name']}")
    print(f"      Task:              {result['task']}")
    print(f"      Processing Time:   {result['processing_time_ms']} ms")
    print(f"      Confidence:        {result['confidence']}")
    print(f"      Detected Classes:  {result['result']['detected_classes']}")
    print(f"      Evidence Sensor:   {result['evidence']['sensor']}")

    assert "model_name" in result and "confidence" in result and "feature_embedding" in result
    assert len(result["feature_embedding"]) == 512, "Feature embedding size must be 512!"
    print("      Standardized Interface Contract — PASS")

    print("\n" + "=" * 70)
    print("ALL PHASE 2 MODEL A ARCHITECTURE & INFERENCE TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_model_a_suite()
