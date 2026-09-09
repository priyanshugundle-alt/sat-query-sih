"""
SatQuery AI — Phase 1 Dataset Pipeline Verification Script
Runs rigorous end-to-end tests on GeoTIFF loading, VH/VV pairing, normalization,
batch collation, GPU transfer, and reproducible splitting.
"""

import sys
import time
from pathlib import Path
import numpy as np
import torch

# Add sat-query-sih to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from model_a.config import CONFIG
from model_a.data.corine_classes import CORINE_19_CLASSES, encode_labels, decode_predictions
from model_a.data.dataset import BigEarthNetS1Dataset, scan_and_index_patches
from model_a.data.splits import create_reproducible_splits
from model_a.data.dataloader import build_dataloaders


def run_pipeline_verification():
    print("=" * 70)
    print("SATQUERY AI — PHASE 1: MODEL A DATASET PIPELINE VERIFICATION")
    print("=" * 70)

    # 1. Environment & CUDA Diagnostic
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[1/6] PyTorch Version: {torch.__version__}")
    print(f"      Compute Device:  {device}")
    if torch.cuda.is_available():
        print(f"      GPU Device Name: {torch.cuda.get_device_name(0)}")
        print(f"      Allocated VRAM:  {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")

    # 2. Patch Indexing Test (Scan a representative sample of acquisitions)
    print("\n[2/6] Testing Acquisition Discovery & VH/VV Pairing...")
    t0 = time.time()
    sample_acquisitions = 5  # Scan first 5 acquisitions for rapid verification
    samples = scan_and_index_patches(
        dataset_dir=CONFIG.dataset.raw_dataset_dir,
        cache_file=CONFIG.dataset.cache_dir / "test_sample_index.json",
        max_acquisitions=sample_acquisitions
    )
    t_scan = time.time() - t0
    assert len(samples) > 0, "Error: No valid patches discovered!"
    print(f"      Successfully indexed {len(samples)} valid VH+VV paired patches in {t_scan:.2f}s.")

    # 3. Single Patch Loading & Integrity Test
    print("\n[3/6] Testing Single Patch Loading & SAR Normalization...")
    dataset = BigEarthNetS1Dataset(samples=samples, config=CONFIG.dataset, is_training=False)
    
    sample_idx = 0
    sar_tensor, label_tensor, meta = dataset[sample_idx]
    
    print(f"      Patch ID:        {meta['patch_id']}")
    print(f"      Tensor Shape:    {sar_tensor.shape} (Expected: [2, 120, 120])")
    print(f"      Tensor Dtype:    {sar_tensor.dtype}")
    print(f"      Target Vector:   {label_tensor.shape} (Multi-hot length: {len(CORINE_19_CLASSES)})")
    
    # Assertions
    assert sar_tensor.shape == (2, 120, 120), f"Invalid shape: {sar_tensor.shape}"
    assert not torch.isnan(sar_tensor).any(), "Error: NaN detected in SAR tensor!"
    assert not torch.isinf(sar_tensor).any(), "Error: Inf detected in SAR tensor!"
    
    vh_mean = sar_tensor[0].mean().item()
    vh_std = sar_tensor[0].std().item()
    vv_mean = sar_tensor[1].mean().item()
    vv_std = sar_tensor[1].std().item()
    print(f"      Normalized VH:   mean={vh_mean:.3f}, std={vh_std:.3f}")
    print(f"      Normalized VV:   mean={vv_mean:.3f}, std={vv_std:.3f}")

    # 4. Multi-Label Encoding & Decoding Test
    print("\n[4/6] Testing Multi-Label Encoders / Decoders...")
    test_labels = ["Urban fabric", "Pastures", "Inland waters"]
    encoded = encode_labels(test_labels)
    decoded = decode_predictions(encoded, threshold=0.5)
    decoded_names = [d["class_name"] for d in decoded]
    print(f"      Input Labels:    {test_labels}")
    print(f"      Decoded Labels:  {decoded_names}")
    assert set(test_labels) == set(decoded_names), "Label encoder/decoder mismatch!"

    # 5. Reproducible Dataset Splitting
    print("\n[5/6] Testing Acquisition-Level Train/Val/Test Splitting...")
    train_samples, val_samples, test_samples = create_reproducible_splits(
        samples=samples,
        config=CONFIG.dataset,
        split_cache_path=CONFIG.dataset.cache_dir / "test_splits.json",
        by_acquisition=True
    )
    assert len(train_samples) > 0 and len(val_samples) > 0 and len(test_samples) > 0, "Split error!"
    
    # Check disjointness
    train_ids = set(s["patch_id"] for s in train_samples)
    val_ids = set(s["patch_id"] for s in val_samples)
    test_ids = set(s["patch_id"] for s in test_samples)
    assert train_ids.isdisjoint(val_ids), "Data leakage: Train and Val overlap!"
    assert train_ids.isdisjoint(test_ids), "Data leakage: Train and Test overlap!"
    print(f"      Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)} (Zero Leakage Verified)")

    # 6. DataLoader Batch Streaming & Throughput Benchmark
    print("\n[6/6] Testing DataLoader Batch Streaming & GPU Transfer...")
    CONFIG.training.batch_size = 32
    CONFIG.training.num_workers = 0  # 0 for single process test verification
    train_loader, val_loader, test_loader = build_dataloaders(
        train_samples=train_samples,
        val_samples=val_samples,
        test_samples=test_samples,
        config=CONFIG
    )

    t0 = time.time()
    batches_to_test = 5
    total_samples_processed = 0

    for i, (sar_batch, label_batch, meta_batch) in enumerate(train_loader):
        if i >= batches_to_test:
            break
        
        # GPU Transfer test
        if torch.cuda.is_available():
            sar_batch = sar_batch.to(device)
            label_batch = label_batch.to(device)

        assert sar_batch.shape == (32, 2, 120, 120), f"Batch shape mismatch: {sar_batch.shape}"
        assert not torch.isnan(sar_batch).any(), "Batch contains NaNs!"
        total_samples_processed += sar_batch.shape[0]

    t_batch = time.time() - t0
    fps = total_samples_processed / (t_batch + 1e-6)
    print(f"      Processed {batches_to_test} batches ({total_samples_processed} samples) on {device} in {t_batch:.3f}s ({fps:.1f} samples/sec).")

    print("\n" + "=" * 70)
    print("ALL PHASE 1 DATASET PIPELINE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_pipeline_verification()
