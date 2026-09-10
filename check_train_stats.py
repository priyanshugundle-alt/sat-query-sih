import json
from pathlib import Path
import numpy as np
from PIL import Image

PROJECT = Path(r"D:\SIH\sat-query-sih")
INDEX_FILE = PROJECT / "model_a" / "cache" / "patch_index.json"
SPLIT_FILE = PROJECT / "model_a" / "cache" / "splits.json"

print("Loading index...")
with open(INDEX_FILE, "r", encoding="utf-8") as f:
    samples = json.load(f)

print("Loading split...")
with open(SPLIT_FILE, "r", encoding="utf-8") as f:
    splits = json.load(f)

train_ids = set(splits["train"])

train_samples = [
    s for s in samples
    if s.get("patch_id") in train_ids
    and s.get("has_official_labels", False)
    and len(s.get("labels", [])) > 0
]

print(f"Official training patches: {len(train_samples):,}")

# Online statistics: sum, squared sum, count
sums = np.zeros(2, dtype=np.float64)
sq_sums = np.zeros(2, dtype=np.float64)
counts = np.zeros(2, dtype=np.int64)

for i, sample in enumerate(train_samples, 1):
    patch_dir = Path(sample["patch_dir"])
    patch_id = sample["patch_id"]

    vh_path = patch_dir / f"{patch_id}_VH.tif"
    vv_path = patch_dir / f"{patch_id}_VV.tif"

    with Image.open(vh_path) as img:
        vh = np.asarray(img, dtype=np.float32)

    with Image.open(vv_path) as img:
        vv = np.asarray(img, dtype=np.float32)

    for c, arr in enumerate([vh, vv]):
        arr = np.nan_to_num(
            arr,
            nan=-50.0,
            posinf=5.0,
            neginf=-50.0
        )

        arr = np.clip(arr, -50.0, 5.0)

        sums[c] += arr.sum(dtype=np.float64)
        sq_sums[c] += np.square(arr, dtype=np.float64).sum(dtype=np.float64)
        counts[c] += arr.size

    if i % 10000 == 0:
        print(f"Processed {i:,}/{len(train_samples):,}")

means = sums / counts
variances = (sq_sums / counts) - np.square(means)
stds = np.sqrt(np.maximum(variances, 0))

print("\n========== TRAIN-ONLY STATISTICS ==========")
print(f"VH mean = {means[0]:.6f}")
print(f"VH std  = {stds[0]:.6f}")
print(f"VV mean = {means[1]:.6f}")
print(f"VV std  = {stds[1]:.6f}")

print("\n========== CURRENT VALUES ==========")
print("VH mean = -19.270000")
print("VH std  = 5.490000")
print("VV mean = -12.640000")
print("VV std  = 5.110000")

print("\n========== DIFFERENCE ==========")
print(f"VH mean difference = {means[0] - (-19.27):.6f}")
print(f"VH std difference  = {stds[0] - 5.49:.6f}")
print(f"VV mean difference = {means[1] - (-12.64):.6f}")
print(f"VV std difference  = {stds[1] - 5.11:.6f}")

print("\nDONE — no files were modified.")
