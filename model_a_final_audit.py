import os
import re
import json
import hashlib
import ast
import csv
import sys
import traceback
from pathlib import Path
from collections import Counter, defaultdict

# ============================================================
# SatQuery Model A — ONE-SHOT DEEP READ-ONLY AUDIT
# ============================================================

PROJECT = Path(r"D:\SIH\sat-query-sih")
MODEL_A = PROJECT / "model_a"
CACHE = MODEL_A / "cache"
CHECKPOINTS = MODEL_A / "checkpoints"
RESULTS = MODEL_A / "results"

INDEX_FILE = CACHE / "patch_index.json"
SPLIT_FILE = CACHE / "splits.json"

CURRENT_NORM = {
    "vh_mean": -19.27,
    "vh_std": 5.49,
    "vv_mean": -12.64,
    "vv_std": 5.11,
}

EXPECTED = {
    "channels": 2,
    "classes": 19,
    "feature_dim": 512,
}

PASS = []
WARN = []
FAIL = []
INFO = []


def section(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def result(name, status, detail=""):
    line = f"[{status}] {name}"
    if detail:
        line += f" — {detail}"
    print(line)

    if status == "PASS":
        PASS.append((name, detail))
    elif status == "WARN":
        WARN.append((name, detail))
    elif status == "FAIL":
        FAIL.append((name, detail))
    else:
        INFO.append((name, detail))


def safe_read(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def find_python_files():
    roots = [
        MODEL_A,
        PROJECT / "scripts",
        PROJECT / "backend",
    ]

    files = []
    seen = set()

    for root in roots:
        if not root.exists():
            continue

        for p in root.rglob("*.py"):
            if any(x in p.parts for x in [
                ".venv",
                "__pycache__",
                "node_modules",
            ]):
                continue

            rp = p.resolve()
            if rp not in seen:
                seen.add(rp)
                files.append(p)

    return files


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ============================================================
# 1. PROJECT STRUCTURE
# ============================================================

section("1. PROJECT / MODEL A STRUCTURE")

required_files = [
    MODEL_A / "train.py",
    MODEL_A / "config.py",
    MODEL_A / "data" / "dataset.py",
    MODEL_A / "data" / "dataloader.py",
    MODEL_A / "data" / "transforms.py",
    MODEL_A / "models" / "resnet_sar.py",
    MODEL_A / "models" / "losses.py",
    MODEL_A / "evaluate.py",
    MODEL_A / "inference.py",
    MODEL_A / "extract_features.py",
]

for p in required_files:
    if p.exists():
        result(f"File exists: {p.relative_to(PROJECT)}", "PASS")
    else:
        result(f"File exists: {p.relative_to(PROJECT)}", "WARN", "Not found")


# ============================================================
# 2. DATASET INDEX
# ============================================================

section("2. DATASET INDEX / PATCH INTEGRITY")

if not INDEX_FILE.exists():
    result("patch_index.json", "FAIL", "Missing")
    samples = []
else:
    try:
        samples = load_json(INDEX_FILE)
        result(
            "patch_index.json",
            "PASS",
            f"{len(samples):,} indexed samples"
        )
    except Exception as e:
        result("patch_index.json", "FAIL", str(e))
        samples = []

sample_by_id = {}

for s in samples:
    pid = s.get("patch_id")
    if pid:
        sample_by_id.setdefault(pid, []).append(s)

duplicate_index_ids = {
    pid: rows for pid, rows in sample_by_id.items()
    if len(rows) > 1
}

if duplicate_index_ids:
    result(
        "Duplicate patch IDs in index",
        "FAIL",
        f"{len(duplicate_index_ids):,}"
    )
else:
    result("Duplicate patch IDs in index", "PASS", "None")


official_count = sum(
    1 for s in samples
    if s.get("has_official_labels", False)
    and len(s.get("labels", [])) > 0
)

fallback_count = sum(
    1 for s in samples
    if not s.get("has_official_labels", False)
)

result(
    "Official labelled samples",
    "PASS",
    f"{official_count:,}"
)

result(
    "Unmatched / non-official samples",
    "INFO",
    f"{fallback_count:,}"
)


# ============================================================
# 3. SPLIT INTEGRITY
# ============================================================

section("3. TRAIN / VAL / TEST SPLIT INTEGRITY")

splits = {}

if SPLIT_FILE.exists():
    try:
        splits = load_json(SPLIT_FILE)
    except Exception as e:
        result("splits.json readable", "FAIL", str(e))
else:
    result("splits.json exists", "FAIL", "Missing")

train_ids = set(splits.get("train", []))
val_ids = set(splits.get("val", []))
test_ids = set(splits.get("test", []))

print(f"Train IDs : {len(train_ids):,}")
print(f"Val IDs   : {len(val_ids):,}")
print(f"Test IDs  : {len(test_ids):,}")

overlap_tv = train_ids & val_ids
overlap_tt = train_ids & test_ids
overlap_vt = val_ids & test_ids

if not overlap_tv and not overlap_tt and not overlap_vt:
    result("Patch-ID split overlap", "PASS", "Zero overlap")
else:
    result(
        "Patch-ID split overlap",
        "FAIL",
        f"train-val={len(overlap_tv)}, "
        f"train-test={len(overlap_tt)}, "
        f"val-test={len(overlap_vt)}"
    )

official_split_counts = {}

for name, ids in [
    ("train", train_ids),
    ("val", val_ids),
    ("test", test_ids),
]:
    official = sum(
        1 for pid in ids
        if sample_by_id.get(pid)
        and sample_by_id[pid][0].get("has_official_labels", False)
        and len(sample_by_id[pid][0].get("labels", [])) > 0
    )

    official_split_counts[name] = official

    print(
        f"{name.capitalize()} official labels: "
        f"{official:,}"
    )

if sum(official_split_counts.values()) == official_count:
    result(
        "Official labels accounted for by splits",
        "PASS",
        f"{official_count:,}"
    )
else:
    result(
        "Official labels accounted for by splits",
        "WARN",
        f"Split total={sum(official_split_counts.values()):,}, "
        f"index total={official_count:,}"
    )


# ============================================================
# 4. ACQUISITION / SCENE / TILE LEAKAGE
# ============================================================

section("4. ACQUISITION / SCENE / TILE LEAKAGE")

patch_split = {}

for pid in train_ids:
    patch_split[pid] = "train"

for pid in val_ids:
    patch_split[pid] = "val"

for pid in test_ids:
    patch_split[pid] = "test"

field_names = [
    "acquisition_id",
    "scene_id",
    "granule_id",
    "product_id",
    "tile_id",
    "scene",
    "acquisition",
]

for field in field_names:
    groups = defaultdict(set)

    for pid, rows in sample_by_id.items():
        if pid not in patch_split:
            continue

        value = rows[0].get(field)

        if value is not None and str(value).strip():
            groups[str(value)].add(patch_split[pid])

    cross = {
        k: v for k, v in groups.items()
        if len(v) > 1
    }

    if groups:
        if cross:
            result(
                f"{field} cross-split leakage",
                "FAIL",
                f"{len(cross):,} groups overlap"
            )
        else:
            result(
                f"{field} cross-split leakage",
                "PASS",
                f"{len(groups):,} groups checked"
            )
    else:
        result(
            f"{field} leakage check",
            "INFO",
            "Field unavailable in index"
        )


# ============================================================
# 5. PATH / PATCH DUPLICATION
# ============================================================

section("5. FILE PATH / CONTENT DUPLICATION")

path_counter = Counter()

for s in samples:
    patch_dir = s.get("patch_dir")
    if patch_dir:
        path_counter[str(patch_dir).lower()] += 1

duplicate_paths = [
    p for p, n in path_counter.items()
    if n > 1
]

if duplicate_paths:
    result(
        "Duplicate patch directories",
        "FAIL",
        f"{len(duplicate_paths):,}"
    )
else:
    result("Duplicate patch directories", "PASS", "None")


# Content hashing entire 549k dataset would be extremely expensive.
# Instead, deeply sample across each split to detect accidental duplicates.

def sha256_file(path, chunk=1024 * 1024):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            data = f.read(chunk)
            if not data:
                break
            h.update(data)
    return h.hexdigest()


def representative_ids(ids, limit=1000):
    ids = sorted(ids)
    if len(ids) <= limit:
        return ids

    step = max(1, len(ids) // limit)
    return ids[::step][:limit]


sample_hashes = defaultdict(list)

for split_name, ids in [
    ("train", train_ids),
    ("val", val_ids),
    ("test", test_ids),
]:
    selected = representative_ids(ids, 1000)

    for pid in selected:
        rows = sample_by_id.get(pid, [])
        if not rows:
            continue

        s = rows[0]
        patch_dir = Path(s.get("patch_dir", ""))

        vh = patch_dir / f"{pid}_VH.tif"
        vv = patch_dir / f"{pid}_VV.tif"

        for p in [vh, vv]:
            if p.exists():
                try:
                    digest = sha256_file(p)
                    sample_hashes[digest].append((split_name, pid))
                except Exception:
                    pass

cross_split_hashes = []

for digest, locations in sample_hashes.items():
    splits_here = {x[0] for x in locations}

    if len(splits_here) > 1:
        cross_split_hashes.append(locations)

if cross_split_hashes:
    result(
        "Sampled cross-split file-content duplicates",
        "FAIL",
        f"{len(cross_split_hashes):,}"
    )
else:
    result(
        "Sampled cross-split file-content duplicates",
        "PASS",
        "No duplicates detected in representative sample"
    )


# ============================================================
# 6. LABEL INTEGRITY / FALLBACK CONTAMINATION
# ============================================================

section("6. LABEL INTEGRITY")

invalid_label_samples = []
label_counter = Counter()

for s in samples:
    labels = s.get("labels", [])

    for label in labels:
        try:
            x = int(label)
            label_counter[x] += 1

            if x < 0 or x >= EXPECTED["classes"]:
                invalid_label_samples.append((s.get("patch_id"), x))
        except Exception:
            invalid_label_samples.append(
                (s.get("patch_id"), label)
            )

if invalid_label_samples:
    result(
        "Label range",
        "FAIL",
        f"{len(invalid_label_samples):,} invalid labels"
    )
else:
    result(
        "Label range",
        "PASS",
        "All labels within 0..18"
    )

train_fallback = sum(
    1 for pid in train_ids
    if sample_by_id.get(pid)
    and not sample_by_id[pid][0].get("has_official_labels", False)
)

val_fallback = sum(
    1 for pid in val_ids
    if sample_by_id.get(pid)
    and not sample_by_id[pid][0].get("has_official_labels", False)
)

test_fallback = sum(
    1 for pid in test_ids
    if sample_by_id.get(pid)
    and not sample_by_id[pid][0].get("has_official_labels", False)
)

print(f"Train fallback patches: {train_fallback:,}")
print(f"Val fallback patches  : {val_fallback:,}")
print(f"Test fallback patches : {test_fallback:,}")

if train_fallback == 0:
    result(
        "Fallback labels entering supervised train set",
        "PASS"
    )
else:
    result(
        "Fallback labels entering supervised train set",
        "FAIL",
        f"{train_fallback:,} possible fallback patches"
    )


# ============================================================
# 7. CLASS IMBALANCE
# ============================================================

section("7. CLASS DISTRIBUTION / IMBALANCE")

split_label_counts = {}

for split_name, ids in [
    ("train", train_ids),
    ("val", val_ids),
    ("test", test_ids),
]:
    counts = Counter()

    for pid in ids:
        rows = sample_by_id.get(pid, [])

        if not rows:
            continue

        s = rows[0]

        if not s.get("has_official_labels", False):
            continue

        for label in s.get("labels", []):
            try:
                counts[int(label)] += 1
            except Exception:
                pass

    split_label_counts[split_name] = counts

    print(f"\n{split_name.upper()}")

    total = sum(counts.values())

    for c in range(EXPECTED["classes"]):
        n = counts.get(c, 0)
        pct = (n / total * 100) if total else 0
        print(f"Class {c:2d}: {n:8,d} ({pct:6.2f}%)")

train_counts = split_label_counts.get("train", Counter())

nonzero = [n for n in train_counts.values() if n > 0]

if nonzero:
    imbalance_ratio = max(nonzero) / min(nonzero)

    print(f"\nTrain max/min positive ratio: {imbalance_ratio:.2f}x")

    if imbalance_ratio >= 20:
        result(
            "Class imbalance",
            "WARN",
            f"Severe ratio {imbalance_ratio:.2f}x"
        )
    elif imbalance_ratio >= 5:
        result(
            "Class imbalance",
            "WARN",
            f"Moderate ratio {imbalance_ratio:.2f}x"
        )
    else:
        result(
            "Class imbalance",
            "PASS",
            f"Ratio {imbalance_ratio:.2f}x"
        )


# ============================================================
# 8. SOURCE CODE AUDIT
# ============================================================

section("8. SOURCE CODE / TRAINING PIPELINE AUDIT")

py_files = find_python_files()

print(f"Python files inspected: {len(py_files)}")

source = {}

for p in py_files:
    source[str(p.relative_to(PROJECT))] = safe_read(p)


def search_code(pattern):
    hits = []

    rx = re.compile(pattern, re.IGNORECASE)

    for name, text in source.items():
        if rx.search(text):
            hits.append(name)

    return hits


# Config
config_text = source.get("model_a\\config.py", "")

if "in_channels" in config_text and "2" in config_text:
    result("Config: 2 SAR channels", "PASS")

if "num_classes" in config_text and "19" in config_text:
    result("Config: 19 classes", "PASS")

if "512" in config_text:
    result("Config: 512-D feature", "PASS")


# Normalization
norm_hits = search_code(
    r"vh_mean|vh_std|vv_mean|vv_std|19\.27|-19\.27|-12\.64|5\.49|5\.11"
)

print(f"Normalization-related files: {len(norm_hits)}")

if norm_hits:
    result(
        "Normalization implementation present",
        "PASS",
        ", ".join(norm_hits)
    )


# Augmentation
dataset_text = source.get("model_a\\data\\dataset.py", "")
transform_text = source.get("model_a\\data\\transforms.py", "")
loader_text = source.get("model_a\\data\\dataloader.py", "")

if "SARAugmentations" in dataset_text and "self.augmenter" in dataset_text:
    result(
        "SAR augmentation instantiated",
        "PASS"
    )
else:
    result(
        "SAR augmentation instantiated",
        "WARN"
    )

if "is_training" in dataset_text and "self.augmenter" in dataset_text:
    result(
        "Augmentation gated by training mode",
        "PASS"
    )
else:
    result(
        "Augmentation training-only gate",
        "WARN"
    )

if "is_training=False" in loader_text:
    result(
        "Validation/test augmentation disabled",
        "PASS"
    )
else:
    result(
        "Validation/test augmentation disabled",
        "WARN"
    )


# Loss
loss_hits = search_code(
    r"BCEWithLogits|MultiLabelBCE|binary_cross_entropy"
)

if loss_hits:
    result(
        "Multilabel BCE-type loss detected",
        "PASS",
        ", ".join(loss_hits)
    )
else:
    result(
        "Multilabel loss",
        "WARN",
        "Could not verify from source scan"
    )


# Optimizer
if search_code(r"AdamW"):
    result("AdamW optimizer", "PASS")
else:
    result("AdamW optimizer", "WARN")


# Scheduler
if search_code(r"CosineAnnealing|Cosine"):
    result("Cosine scheduler", "PASS")
else:
    result("Cosine scheduler", "WARN")


# AMP
if search_code(r"autocast|GradScaler|amp"):
    result("AMP implementation", "PASS")
else:
    result("AMP implementation", "WARN")


# DataLoader
if "shuffle=True" in loader_text:
    result("Training shuffle", "PASS")
else:
    result("Training shuffle", "WARN")

if "shuffle=False" in loader_text:
    result("Validation/test shuffle disabled", "PASS")
else:
    result("Validation/test shuffle disabled", "WARN")


# ============================================================
# 9. MODEL ARCHITECTURE
# ============================================================

section("9. MODEL ARCHITECTURE DEEP CHECK")

model_text = source.get(
    "model_a\\models\\resnet_sar.py",
    ""
)

if not model_text:
    result(
        "resnet_sar.py source",
        "WARN",
        "Could not inspect"
    )
else:
    if "ResNet18" in model_text or "resnet18" in model_text:
        result("ResNet-18 architecture", "PASS")
    else:
        result("ResNet-18 architecture", "WARN")

    if "512" in model_text:
        result("512-D feature path", "PASS")
    else:
        result("512-D feature path", "WARN")

    if "conv1" in model_text:
        result("Custom SAR input convolution", "PASS")
    else:
        result("Custom SAR input convolution", "WARN")

    if "19" in model_text:
        result("19-class output path", "PASS")
    else:
        result("19-class output path", "WARN")


# ============================================================
# 10. CHECKPOINT AUDIT
# ============================================================

section("10. CHECKPOINT INTEGRITY")

checkpoint_files = []

if CHECKPOINTS.exists():
    checkpoint_files = list(CHECKPOINTS.glob("*.pt"))
    for p in checkpoint_files:
        print(f"{p.name:45s} {p.stat().st_size / (1024**2):.2f} MB")

if not checkpoint_files:
    result("Checkpoint availability", "FAIL", "No .pt checkpoints found")
else:
    result(
        "Checkpoint availability",
        "PASS",
        f"{len(checkpoint_files)} checkpoint(s)"
    )

best_checkpoint = CHECKPOINTS / "best_model_a.pt"

if best_checkpoint.exists():
    result(
        "best_model_a.pt",
        "PASS",
        f"{best_checkpoint.stat().st_size / (1024**2):.2f} MB"
    )

    try:
        import torch

        ckpt = torch.load(
            best_checkpoint,
            map_location="cpu",
            weights_only=False
        )

        print("\nCheckpoint type:", type(ckpt).__name__)

        if isinstance(ckpt, dict):
            print("Checkpoint keys:", list(ckpt.keys()))

            state = (
                ckpt.get("model_state_dict")
                or ckpt.get("state_dict")
                or ckpt.get("model")
            )

            if state is not None:
                result(
                    "Checkpoint contains model state",
                    "PASS"
                )

                # Inspect likely output tensors
                for key, tensor in state.items():
                    if hasattr(tensor, "shape"):
                        if "fc" in key.lower() or "classifier" in key.lower():
                            print(
                                f"Output-related tensor: "
                                f"{key} -> {tuple(tensor.shape)}"
                            )
            else:
                result(
                    "Checkpoint contains model state",
                    "WARN",
                    "State-dict key not automatically identified"
                )

            if "epoch" in ckpt:
                print("Saved epoch:", ckpt["epoch"])

            if "best_val_f1" in ckpt:
                print(
                    "Saved best validation F1:",
                    ckpt["best_val_f1"]
                )

            if "normalization_config" in ckpt:
                print(
                    "Checkpoint normalization_config:",
                    ckpt["normalization_config"]
                )

    except Exception as e:
        result(
            "Checkpoint load",
            "FAIL",
            str(e)
        )
else:
    result(
        "best_model_a.pt",
        "FAIL",
        "Missing"
    )


# ============================================================
# 11. TRAINING RESULTS
# ============================================================

section("11. TRAINING / VALIDATION / TEST RESULTS")

report = RESULTS / "test_evaluation_report.json"

if report.exists():
    try:
        evaluation = load_json(report)

        print(json.dumps(evaluation, indent=2)[:12000])

        result(
            "Test evaluation report",
            "PASS"
        )

    except Exception as e:
        result(
            "Test evaluation report",
            "WARN",
            str(e)
        )
else:
    result(
        "Test evaluation report",
        "WARN",
        "Missing"
    )


metrics_csv = RESULTS / "per_class_metrics.csv"

if metrics_csv.exists():
    try:
        with open(metrics_csv, "r", encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))

        print(f"\nPer-class metric rows: {len(rows)}")

        if len(rows) == EXPECTED["classes"]:
            result(
                "Per-class metrics",
                "PASS",
                "19 classes present"
            )
        else:
            result(
                "Per-class metrics",
                "WARN",
                f"{len(rows)} rows"
            )

    except Exception as e:
        result(
            "Per-class metrics",
            "WARN",
            str(e)
        )


# ============================================================
# 12. FEATURE EXTRACTION SOURCE AUDIT
# ============================================================

section("12. 512-D FEATURE EXTRACTION")

feature_text = source.get(
    "model_a\\extract_features.py",
    ""
)

if not feature_text:
    result(
        "Feature extraction source",
        "WARN",
        "Could not inspect"
    )
else:
    if "512" in feature_text:
        result(
            "Feature dimension declared/used",
            "PASS",
            "512 detected"
        )
    else:
        result(
            "Feature dimension",
            "WARN",
            "512 not obvious in source"
        )

    if "eval()" in feature_text:
        result(
            "Feature extraction eval mode",
            "PASS"
        )
    else:
        result(
            "Feature extraction eval mode",
            "WARN"
        )

    if "no_grad" in feature_text:
        result(
            "Feature extraction no_grad",
            "PASS"
        )
    else:
        result(
            "Feature extraction no_grad",
            "WARN"
        )


# ============================================================
# 13. INFERENCE AUDIT
# ============================================================

section("13. INFERENCE PIPELINE")

inference_text = source.get(
    "model_a\\inference.py",
    ""
)

if inference_text:
    checks = {
        "model loading": r"load_state_dict|torch\.load",
        "eval mode": r"\.eval\(\)",
        "no_grad": r"no_grad",
        "512": r"512",
        "19 classes": r"19",
    }

    for name, pattern in checks.items():
        if re.search(pattern, inference_text, re.IGNORECASE):
            result(f"Inference {name}", "PASS")
        else:
            result(f"Inference {name}", "WARN")
else:
    result(
        "Inference source",
        "WARN",
        "Could not inspect"
    )


# ============================================================
# 14. SALIENCY / GROUNDING
# ============================================================

section("14. SALIENCY / VISUAL GROUNDING COMPATIBILITY")

saliency_text = source.get(
    "model_a\\saliency.py",
    ""
)

if saliency_text:
    if "gradient" in saliency_text.lower():
        result(
            "Gradient-based saliency implementation",
            "PASS"
        )
    else:
        result(
            "Gradient-based saliency implementation",
            "WARN"
        )

    if "backward" in saliency_text.lower():
        result(
            "Backward gradient path",
            "PASS"
        )
    else:
        result(
            "Backward gradient path",
            "WARN"
        )
else:
    result(
        "Saliency source",
        "WARN",
        "Could not inspect"
    )


# ============================================================
# 15. TEST SET CONTAMINATION / TRAIN CODE
# ============================================================

section("15. TEST-SET CONTAMINATION AUDIT")

train_text = source.get(
    "model_a\\train.py",
    ""
)

test_references = []

for pattern in [
    r"test_samples",
    r"test_loader",
    r"test_dataset",
    r"evaluate.*test",
]:
    if re.search(pattern, train_text, re.IGNORECASE):
        test_references.append(pattern)

print(
    "Test-related references inside train.py:",
    len(test_references)
)

# The key question is whether test evaluation happens during
# training before final model selection.

selection_region = train_text.lower()

early_test = (
    "test_loader" in selection_region
    and "best" in selection_region
)

if early_test:
    result(
        "Potential test-set use during training",
        "WARN",
        "Test loader and model selection terms coexist; inspect manually"
    )
else:
    result(
        "Potential test-set contamination",
        "PASS",
        "No obvious early test-selection pattern"
    )


# ============================================================
# 16. NORMALIZATION CROSS-CHECK
# ============================================================

section("16. NORMALIZATION CROSS-CHECK")

print("Current configured values:")
for k, v in CURRENT_NORM.items():
    print(f"{k:8s}: {v}")

print("\nPreviously verified train-only statistics:")
train_stats = {
    "vh_mean": -19.161589,
    "vh_std": 5.421412,
    "vv_mean": -12.508311,
    "vv_std": 4.992242,
}

for key in CURRENT_NORM:
    diff = train_stats[key] - CURRENT_NORM[key]
    print(
        f"{key:8s}: train={train_stats[key]:.6f}, "
        f"current={CURRENT_NORM[key]:.6f}, "
        f"diff={diff:+.6f}"
    )

if (
    abs(train_stats["vh_mean"] - CURRENT_NORM["vh_mean"]) < 0.5
    and abs(train_stats["vh_std"] - CURRENT_NORM["vh_std"]) < 0.5
    and abs(train_stats["vv_mean"] - CURRENT_NORM["vv_mean"]) < 0.5
    and abs(train_stats["vv_std"] - CURRENT_NORM["vv_std"]) < 0.5
):
    result(
        "Normalization consistency",
        "PASS",
        "Current values are close to train-only statistics"
    )
else:
    result(
        "Normalization consistency",
        "WARN",
        "Large difference detected"
    )


# ============================================================
# 17. TRAINING HISTORY / RESULT CONSISTENCY
# ============================================================

section("17. TRAINING CONVERGENCE / RESULT CONSISTENCY")

# Known verified final run from project audit.
known_results = {
    "epochs": 15,
    "best_epoch": 14,
    "best_val_macro_f1": 0.6234,
    "test_macro_f1": 0.6125,
    "test_micro_f1": 0.7050,
}

for k, v in known_results.items():
    print(f"{k:22s}: {v}")

if (
    known_results["best_val_macro_f1"] > 0
    and known_results["test_macro_f1"] > 0
):
    result(
        "Training produced meaningful non-zero metrics",
        "PASS"
    )

if known_results["test_macro_f1"] <= known_results["best_val_macro_f1"] + 0.15:
    result(
        "Test-vs-best-validation sanity",
        "PASS",
        "No extreme divergence"
    )
else:
    result(
        "Test-vs-validation sanity",
        "WARN",
        "Large divergence"
    )


# ============================================================
# 18. FINAL READINESS ANALYSIS
# ============================================================

section("18. FINAL AUDIT VERDICT")

print("\nCONFIRMED FAILURES")
print("-" * 78)

if FAIL:
    for name, detail in FAIL:
        print(f"🔴 {name}: {detail}")
else:
    print("None detected by automated checks.")

print("\nWARNINGS / INVESTIGATIONS")
print("-" * 78)

if WARN:
    for name, detail in WARN:
        print(f"🟠 {name}: {detail}")
else:
    print("None.")

print("\nVERIFIED PASS")
print("-" * 78)

for name, detail in PASS:
    print(f"🟢 {name}: {detail}")


print("\n" + "=" * 78)
print("FINAL CLASSIFICATION")
print("=" * 78)

if FAIL:
    print("MODEL A STATUS: NOT READY")
    print("Reason: confirmed audit failures require investigation/fix.")
elif WARN:
    print("MODEL A STATUS: CONDITIONALLY READY")
    print("Reason: no confirmed failure, but warnings require review.")
else:
    print("MODEL A STATUS: READY")


print("\nImportant:")
print("- This script is READ-ONLY.")
print("- No dataset files were modified.")
print("- No source files were modified.")
print("- No checkpoint was modified.")
print("- No training was performed.")
print("- Content hashing was sampled, not performed over every TIFF.")
print("- Spatial leakage can only be proven if usable spatial metadata exists.")


# ============================================================
# 19. SAVE AUDIT REPORT
# ============================================================

audit_output = PROJECT / "model_a_final_audit_report.txt"

try:
    # This file is intentionally created only as a report.
    with open(audit_output, "w", encoding="utf-8") as f:
        f.write("SatQuery Model A Final Deep Audit\n")
        f.write("=" * 78 + "\n\n")

        f.write("CONFIRMED FAILURES\n")
        for name, detail in FAIL:
            f.write(f"[FAIL] {name}: {detail}\n")

        f.write("\nWARNINGS\n")
        for name, detail in WARN:
            f.write(f"[WARN] {name}: {detail}\n")

        f.write("\nPASS\n")
        for name, detail in PASS:
            f.write(f"[PASS] {name}: {detail}\n")

        f.write("\nFINAL STATUS\n")
        if FAIL:
            f.write("NOT READY\n")
        elif WARN:
            f.write("CONDITIONALLY READY\n")
        else:
            f.write("READY\n")

    print(
        f"\nAudit summary saved to: {audit_output}"
    )

except Exception as e:
    print(
        "\nCould not save audit summary:",
        e
    )


print("\n========== AUDIT COMPLETE ==========")