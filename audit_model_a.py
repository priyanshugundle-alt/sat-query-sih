from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parent

print("=" * 75)
print("SATQUERY MODEL A — DEEP STATIC AUDIT")
print("=" * 75)
print(f"Project: {ROOT}\n")

# ============================================================
# 1. FIND ALL RELEVANT FILES
# ============================================================

print("[1] SEARCHING PROJECT FILES\n")

patterns = [
    "*.py",
    "*.json",
    "*.csv",
    "*.yaml",
    "*.yml",
    "*.pt",
    "*.pth",
    "*.parquet",
]

all_files = []

for pattern in patterns:
    all_files.extend(ROOT.rglob(pattern))

# Remove duplicates
all_files = sorted(set(all_files))

for f in all_files:
    rel = f.relative_to(ROOT)

    # Skip huge/unnecessary directories
    if any(x in rel.parts for x in [".git", "__pycache__", "node_modules"]):
        continue

    print(f"  {rel}")

print(f"\nTotal relevant files found: {len(all_files)}")

# ============================================================
# 2. SEARCH PYTHON SOURCE
# ============================================================

print("\n" + "=" * 75)
print("[2] SEARCHING PYTHON SOURCE CODE")
print("=" * 75)

py_files = [
    f for f in all_files
    if f.suffix == ".py"
    and "__pycache__" not in f.parts
    and "node_modules" not in f.parts
]

source = {}

for f in py_files:
    try:
        source[str(f.relative_to(ROOT))] = f.read_text(
            encoding="utf-8",
            errors="ignore"
        )
    except Exception:
        pass

print(f"Python files scanned: {len(source)}")

# ============================================================
# 3. LOCATE IMPORTANT COMPONENTS
# ============================================================

print("\n[3] IMPORTANT COMPONENT LOCATION\n")

keywords = {
    "Dataset": ["Dataset", "DataLoader", "scan_and_index_patches"],
    "SAR": ["Sentinel-1", "VH", "VV", "SAR"],
    "Labels": ["label", "labels", "encode_labels", "class_to_idx"],
    "ResNet": ["ResNet18", "resnet18", "ResNet"],
    "Feature": ["512", "extract_features", "embedding"],
    "Loss": ["BCEWithLogitsLoss", "CrossEntropyLoss", "Focal"],
    "Optimizer": ["AdamW", "Adam", "SGD"],
    "Scheduler": ["CosineAnnealing", "scheduler"],
    "AMP": ["autocast", "GradScaler", "torch.amp"],
    "Augmentation": [
        "RandomHorizontalFlip",
        "RandomVerticalFlip",
        "RandomRotation",
        "ColorJitter",
        "RandomCrop",
        "GaussianNoise",
        "augmentation",
        "augment",
    ],
    "Checkpoint": ["torch.save", "torch.load", "best_model", "checkpoint"],
    "Evaluation": [
        "precision",
        "recall",
        "f1",
        "macro",
        "micro",
        "threshold",
        "sigmoid",
    ],
}

for category, terms in keywords.items():
    matches = []

    for filename, text in source.items():
        found = []

        for term in terms:
            if re.search(re.escape(term), text, re.I):
                found.append(term)

        if found:
            matches.append((filename, found))

    print(f"\n{category}:")
    if matches:
        for filename, found in matches:
            print(f"  {filename}")
            print(f"    -> {', '.join(found)}")
    else:
        print("  NOT FOUND")

# ============================================================
# 4. CONFIGURATION DETAILS
# ============================================================

print("\n" + "=" * 75)
print("[4] CONFIGURATION VALUES")
print("=" * 75)

config_files = [
    (name, text)
    for name, text in source.items()
    if Path(name).name.lower() == "config.py"
]

if not config_files:
    print("No config.py found.")
else:

    for filename, text in config_files:

        print(f"\n--- {filename} ---")

        config_patterns = [
            "batch_size",
            "num_workers",
            "learning_rate",
            "weight_decay",
            "max_epochs",
            "use_amp",
            "grad_accum",
            "seed",
            "image_size",
            "num_classes",
            "in_channels",
            "mean",
            "std",
        ]

        lines = text.splitlines()

        for i, line in enumerate(lines, 1):
            if any(
                re.search(r"\b" + re.escape(p) + r"\b", line, re.I)
                for p in config_patterns
            ):
                print(f"{i:4}: {line.strip()}")

# ============================================================
# 5. TRAINING DETAILS
# ============================================================

print("\n" + "=" * 75)
print("[5] TRAINING DETAILS")
print("=" * 75)

for filename, text in source.items():

    if Path(filename).name.lower() == "train.py":

        print(f"\n--- {filename} ---")

        lines = text.splitlines()

        training_terms = [
            "run_training",
            "num_epochs",
            "BCEWithLogitsLoss",
            "AdamW",
            "CosineAnnealing",
            "GradScaler",
            "autocast",
            "best_macro_f1",
            "sample_ratio",
            "train_loader",
            "val_loader",
            "test_loader",
        ]

        for i, line in enumerate(lines, 1):

            if any(
                term.lower() in line.lower()
                for term in training_terms
            ):
                print(f"{i:4}: {line.strip()}")

# ============================================================
# 6. DATASET / PREPROCESSING DETAILS
# ============================================================

print("\n" + "=" * 75)
print("[6] DATASET + PREPROCESSING DETAILS")
print("=" * 75)

for filename, text in source.items():

    name = Path(filename).name.lower()

    if name in ["dataset.py", "dataloader.py"] or "dataset" in name:

        print(f"\n--- {filename} ---")

        lines = text.splitlines()

        important_terms = [
            "VH",
            "VV",
            "120",
            "normalize",
            "mean",
            "std",
            "clip",
            "nan",
            "inf",
            "nodata",
            "labels",
            "has_official_labels",
            "infer_corine_labels",
            "encode_labels",
            "augmentation",
            "transform",
        ]

        for i, line in enumerate(lines, 1):

            if any(
                term.lower() in line.lower()
                for term in important_terms
            ):
                print(f"{i:4}: {line.strip()}")

# ============================================================
# 7. SPLIT FILE
# ============================================================

print("\n" + "=" * 75)
print("[7] SPLIT FILE AUDIT")
print("=" * 75)

split_files = [
    f for f in all_files
    if f.name.lower() == "splits.json"
]

if not split_files:
    print("splits.json NOT FOUND")

for f in split_files:

    print(f"\nFile: {f.relative_to(ROOT)}")

    try:
        data = json.loads(
            f.read_text(
                encoding="utf-8",
                errors="ignore"
            )
        )

        if isinstance(data, dict):

            for key, value in data.items():

                if isinstance(value, list):
                    print(f"  {key}: {len(value):,}")

                elif isinstance(value, dict):
                    print(f"  {key}: {len(value):,}")

    except Exception as e:
        print(f"  Could not parse: {e}")

# ============================================================
# 8. CHECKPOINT AUDIT
# ============================================================

print("\n" + "=" * 75)
print("[8] CHECKPOINT AUDIT")
print("=" * 75)

checkpoint_files = [
    f for f in all_files
    if f.suffix.lower() in [".pt", ".pth"]
]

if not checkpoint_files:
    print("No checkpoints found.")

for f in checkpoint_files:

    size_mb = f.stat().st_size / (1024 * 1024)

    print(
        f"  {f.relative_to(ROOT)} "
        f"({size_mb:.2f} MB)"
    )

# ============================================================
# 9. RESULT FILES
# ============================================================

print("\n" + "=" * 75)
print("[9] RESULT FILES")
print("=" * 75)

for f in all_files:

    name = f.name.lower()

    if (
        "result" in name
        or "metric" in name
        or "evaluation" in name
        or "report" in name
    ):
        print(f"  {f.relative_to(ROOT)}")

# ============================================================
# 10. FINAL PRELIMINARY STATUS
# ============================================================

print("\n" + "=" * 75)
print("PRELIMINARY AUDIT COMPLETE")
print("=" * 75)

print("""
This audit is READ-ONLY.

It does NOT:
- modify code
- modify datasets
- modify checkpoints
- retrain the model
- delete anything

It only locates and inspects the existing Model A pipeline.

Send me this complete output.
Then I will determine:

CONFIRMED BUG
LIKELY PROBLEM
POSSIBLE IMPROVEMENT
OPTIONAL EXPERIMENT
OK
""")

print("=" * 75)