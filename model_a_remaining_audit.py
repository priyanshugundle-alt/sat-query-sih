import os
import sys
import json
import csv
import ast
import math
import traceback
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent
MODEL_A = ROOT / "model_a"

INDEX_FILE = MODEL_A / "cache" / "patch_index.json"
SPLIT_FILE = MODEL_A / "cache" / "splits.json"
LABEL_FILE = MODEL_A / "data" / "label_indices.json"

TRAIN_FILE = MODEL_A / "train.py"
DATASET_FILE = MODEL_A / "data" / "dataset.py"
DATALOADER_FILE = MODEL_A / "data" / "dataloader.py"
TRANSFORMS_FILE = MODEL_A / "data" / "transforms.py"
MODEL_FILE = MODEL_A / "models" / "resnet_sar.py"
EXTRACT_FILE = MODEL_A / "extract_features.py"
SALIENCY_FILE = MODEL_A / "saliency.py"

CHECKPOINT_FILE = MODEL_A / "checkpoints" / "best_model_a.pt"
REPORT_FILE = MODEL_A / "results" / "test_evaluation_report.json"
PER_CLASS_FILE = MODEL_A / "results" / "per_class_metrics.csv"


PASS = []
WARN = []
FAIL = []


def section(title):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def ok(msg):
    PASS.append(msg)
    print(f"[PASS] {msg}")


def warn(msg):
    WARN.append(msg)
    print(f"[WARN] {msg}")


def fail(msg):
    FAIL.append(msg)
    print(f"[FAIL] {msg}")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def safe_read(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def normalize_label_mapping(raw):
    """
    Supports:
      {"Forest": 0, "Water": 1}
      {"0": "Forest", "1": "Water"}
      ["Forest", "Water"]
    Returns:
      name -> integer index
    """
    if isinstance(raw, list):
        return {str(name): i for i, name in enumerate(raw)}

    if not isinstance(raw, dict):
        return {}

    mapping = {}

    # name -> index
    if all(isinstance(v, int) for v in raw.values()):
        for k, v in raw.items():
            mapping[str(k)] = int(v)
        return mapping

    # numeric index -> name
    numeric_keys = True
    for k in raw.keys():
        try:
            int(k)
        except Exception:
            numeric_keys = False
            break

    if numeric_keys:
        for k, v in raw.items():
            mapping[str(v)] = int(k)
        return mapping

    # Last-resort deterministic enumeration
    for i, k in enumerate(raw.keys()):
        mapping[str(k)] = i

    return mapping


def get_patch_id(item):
    if isinstance(item, str):
        return item

    if isinstance(item, dict):
        for key in [
            "patch_id",
            "id",
            "patch",
            "patch_name",
            "name"
        ]:
            if key in item:
                return str(item[key])

    return None


def make_split_ids(split_data):
    result = {}

    if not isinstance(split_data, dict):
        return result

    for split_name in ["train", "val", "test"]:
        items = split_data.get(split_name, [])
        ids = set()

        if isinstance(items, list):
            for item in items:
                pid = get_patch_id(item)
                if pid:
                    ids.add(pid)

        result[split_name] = ids

    return result


def labels_to_indices(labels, label_map):
    ids = []

    if not isinstance(labels, list):
        return ids

    for label in labels:
        label = str(label)

        if label in label_map:
            ids.append(label_map[label])
        else:
            # Sometimes stored as numeric strings
            try:
                idx = int(label)
                if 0 <= idx < len(label_map):
                    ids.append(idx)
            except Exception:
                pass

    return sorted(set(ids))


def inspect_source_ast(path):
    source = safe_read(path)

    if not source:
        return None

    try:
        return ast.parse(source)
    except Exception as e:
        warn(f"AST parse failed for {path}: {e}")
        return None


def source_has(path, patterns):
    text = safe_read(path).lower()
    return all(p.lower() in text for p in patterns)


# ============================================================
# 1. FILE STRUCTURE
# ============================================================

section("1. MODEL A FILE STRUCTURE")

required_files = [
    TRAIN_FILE,
    DATASET_FILE,
    DATALOADER_FILE,
    TRANSFORMS_FILE,
    MODEL_FILE,
    EXTRACT_FILE,
    SALIENCY_FILE,
    INDEX_FILE,
    SPLIT_FILE,
    LABEL_FILE,
    CHECKPOINT_FILE,
    REPORT_FILE,
    PER_CLASS_FILE,
]

for path in required_files:
    if path.exists():
        ok(f"Exists: {path.relative_to(ROOT)}")
    else:
        warn(f"Missing: {path.relative_to(ROOT)}")


# ============================================================
# 2. DATASET / LABEL MAPPING
# ============================================================

section("2. AUTHORITATIVE LABEL AUDIT")

try:
    index = load_json(INDEX_FILE)
    split_data = load_json(SPLIT_FILE)
    label_raw = load_json(LABEL_FILE)
    if isinstance(label_raw, dict) and "BigEarthNet-19_labels" in label_raw:
        label_raw = label_raw["BigEarthNet-19_labels"]

    label_map = normalize_label_mapping(label_raw)
    reverse_map = {v: k for k, v in label_map.items()}

    print(f"Index entries: {len(index):,}")
    print(f"Label classes: {len(label_map)}")

    if len(label_map) == 19:
        ok("label_indices.json contains exactly 19 classes.")
    else:
        fail(
            f"Expected 19 classes but found {len(label_map)}."
        )

    if len(set(label_map.values())) == len(label_map):
        ok("Class indices are unique.")
    else:
        fail("Duplicate class indices detected.")

    print("\nClass mapping:")
    for idx in sorted(reverse_map):
        print(f"  {idx:2d} -> {reverse_map[idx]}")

except Exception as e:
    fail(f"Could not load dataset metadata: {e}")
    traceback.print_exc()
    sys.exit(1)


# ============================================================
# 3. BUILD AUTHORITATIVE SUPERVISED SETS
# ============================================================

section("3. SUPERVISED DATASET FILTER")

try:
    split_ids = make_split_ids(split_data)

    by_id = {}
    for sample in index:
        pid = get_patch_id(sample)
        if pid:
            by_id[pid] = sample

    supervised = {
        "train": [],
        "val": [],
        "test": [],
    }

    excluded_nonofficial = Counter()

    for split_name in ["train", "val", "test"]:
        for pid in split_ids.get(split_name, set()):

            sample = by_id.get(pid)

            if sample is None:
                warn(
                    f"{split_name}: split patch missing from patch_index: {pid}"
                )
                continue

            official = bool(
                sample.get("has_official_labels", False)
            )

            labels = sample.get("labels", [])

            # IMPORTANT:
            # 69,450 non-official/unmatched samples are intentionally ignored.
            if not official or not labels:
                excluded_nonofficial[split_name] += 1
                continue

            supervised[split_name].append(sample)

    print()
    for split_name in ["train", "val", "test"]:
        raw_n = len(split_ids.get(split_name, set()))
        sup_n = len(supervised[split_name])
        excluded_n = excluded_nonofficial[split_name]

        print(
            f"{split_name.upper():5s}: "
            f"raw={raw_n:,} "
            f"official_supervised={sup_n:,} "
            f"ignored_nonofficial={excluded_n:,}"
        )

    total_sup = sum(len(v) for v in supervised.values())

    if total_sup == 480038:
        ok(
            "All 480,038 authoritative BigEarthNet-labelled patches "
            "are accounted for in supervised train/val/test."
        )
    else:
        fail(
            f"Expected 480,038 official samples, got {total_sup:,}."
        )

    if sum(excluded_nonofficial.values()) == 69450:
        ok(
            "Exactly 69,450 intentionally unmatched/non-official patches "
            "are excluded from supervised training."
        )
    else:
        warn(
            "Ignored non-official count differs from expected 69,450: "
            f"{sum(excluded_nonofficial.values()):,}"
        )

except Exception as e:
    fail(f"Supervised-set construction failed: {e}")
    traceback.print_exc()


# ============================================================
# 4. CLASS IMBALANCE
# ============================================================

section("4. CLASS IMBALANCE — AUTHORITATIVE LABELS ONLY")

class_counts = {}

try:
    for split_name in ["train", "val", "test"]:
        counter = Counter()

        for sample in supervised[split_name]:
            labels = sample.get("labels", [])
            ids = labels_to_indices(labels, label_map)

            for idx in ids:
                counter[idx] += 1

        class_counts[split_name] = counter

        print(f"\n{split_name.upper()} positive-label counts:")

        for idx in range(19):
            name = reverse_map.get(idx, f"class_{idx}")
            count = counter.get(idx, 0)

            print(
                f"  {idx:2d} | "
                f"{name:35s} | "
                f"{count:8,}"
            )

    train_counts = class_counts["train"]

    nonzero = [
        (idx, count)
        for idx, count in train_counts.items()
        if count > 0
    ]

    zero_classes = [
        idx for idx in range(19)
        if train_counts.get(idx, 0) == 0
    ]

    if zero_classes:
        fail(
            "Training set contains classes with ZERO positive samples: "
            + ", ".join(str(x) for x in zero_classes)
        )
    else:
        ok("All 19 classes have positive training examples.")

    if nonzero:
        min_idx, min_count = min(nonzero, key=lambda x: x[1])
        max_idx, max_count = max(nonzero, key=lambda x: x[1])

        ratio = max_count / max(min_count, 1)

        print()
        print(
            f"Most common: {reverse_map[min_idx] if min_idx in reverse_map else min_idx}"
            f" = {min_count:,}"
        )
        print(
            f"Least common: {reverse_map[max_idx] if max_idx in reverse_map else max_idx}"
            f" = {max_count:,}"
        )

        print(f"Max/min positive-count ratio: {ratio:.2f}x")

        if ratio >= 100:
            warn(
                "Very strong class imbalance detected. "
                "This is a training-design concern, not automatically a bug."
            )
        elif ratio >= 20:
            warn(
                "Moderate/high class imbalance detected. "
                "Review per-class recall/F1 before changing the loss."
            )
        else:
            ok(
                "Class imbalance is not extreme enough by itself "
                "to justify changing the training pipeline."
            )

except Exception as e:
    fail(f"Class imbalance audit failed: {e}")
    traceback.print_exc()


# ============================================================
# 5. SPLIT LEAKAGE
# ============================================================

section("5. SPLIT / ACQUISITION LEAKAGE")

try:
    split_sets = {
        k: set(v)
        for k, v in split_ids.items()
    }

    overlaps = False

    for a, b in [
        ("train", "val"),
        ("train", "test"),
        ("val", "test"),
    ]:
        overlap = split_sets[a] & split_sets[b]

        if overlap:
            overlaps = True
            fail(
                f"Patch overlap {a}/{b}: {len(overlap):,}"
            )
        else:
            ok(f"No patch-ID overlap: {a} vs {b}")

    acquisitions = defaultdict(set)

    for split_name in ["train", "val", "test"]:
        for sample in supervised[split_name]:
            acq = sample.get("acquisition")

            if acq is not None:
                acquisitions[str(acq)].add(split_name)

    leaked_acq = {
        acq: splits
        for acq, splits in acquisitions.items()
        if len(splits) > 1
    }

    if leaked_acq:
        fail(
            f"Acquisition leakage detected across splits: "
            f"{len(leaked_acq):,} acquisitions."
        )
        for acq, splits in list(leaked_acq.items())[:10]:
            print(f"  {acq}: {sorted(splits)}")
    else:
        ok(
            f"No acquisition-level leakage detected "
            f"across {len(acquisitions):,} acquisition groups."
        )

except Exception as e:
    fail(f"Leakage audit failed: {e}")
    traceback.print_exc()


# ============================================================
# 6. FALLBACK LABEL SAFETY
# ============================================================

section("6. FALLBACK LABEL SAFETY")

try:
    dataset_source = safe_read(DATASET_FILE).lower()
    train_source = safe_read(TRAIN_FILE).lower()

    if "infer_corine_labels_from_sar" in dataset_source:
        ok(
            "Heuristic fallback label function exists in dataset.py."
        )
    else:
        warn(
            "Fallback label function not found in dataset.py."
        )

    official_filter_patterns = [
        "has_official_labels",
        "labels",
        "train_samples",
        "val_samples",
        "test_samples",
    ]

    if all(p in train_source for p in official_filter_patterns):
        ok(
            "train.py contains explicit official-label filtering "
            "before supervised training."
        )
    else:
        warn(
            "Could not prove official-label filtering from source scan."
        )

    fallback_supervised = 0

    for split_name in ["train", "val", "test"]:
        for sample in supervised[split_name]:
            if not sample.get("has_official_labels", False):
                fallback_supervised += 1

    if fallback_supervised == 0:
        ok(
            "ZERO non-official/fallback-labelled samples enter "
            "the authoritative supervised dataset."
        )
    else:
        fail(
            f"{fallback_supervised:,} non-official samples enter "
            "the supervised dataset."
        )

except Exception as e:
    fail(f"Fallback safety audit failed: {e}")


# ============================================================
# 7. LABEL ORDER CONSISTENCY
# ============================================================

section("7. LABEL / CLASS ORDER CONSISTENCY")

checkpoint = None

try:
    import torch

    checkpoint = torch.load(
        CHECKPOINT_FILE,
        map_location="cpu",
        weights_only=False
    )

    ckpt_class_names = checkpoint.get("class_names", [])
    model_config = checkpoint.get("model_config", {})

    print("Checkpoint class names:")

    for i, name in enumerate(ckpt_class_names):
        print(f"  {i:2d} -> {name}")

    if len(ckpt_class_names) != 19:
        fail(
            f"Checkpoint contains {len(ckpt_class_names)} class names, expected 19."
        )
    else:
        ok("Checkpoint contains 19 class names.")

    mismatches = []

    for i in range(19):
        expected = reverse_map.get(i)
        actual = str(ckpt_class_names[i]) if i < len(ckpt_class_names) else None

        if expected != actual:
            mismatches.append(
                (i, expected, actual)
            )

    if mismatches:
        fail(
            f"Checkpoint/class-index ordering mismatch: "
            f"{len(mismatches)} classes."
        )

        for item in mismatches[:10]:
            print(" ", item)
    else:
        ok(
            "Checkpoint class ordering exactly matches label_indices.json."
        )

except Exception as e:
    fail(f"Checkpoint label-order audit failed: {e}")
    traceback.print_exc()


# ============================================================
# 8. ACTUAL FEATURE EXTRACTION TEST
# ============================================================

section("8. ACTUAL 512-D FEATURE EXTRACTION TEST")

try:
    import torch

    sys.path.insert(0, str(ROOT))

    from model_a.models.resnet_sar import ResNet18_SAR
    from model_a.data.dataset import BigEarthNetS1Dataset

    # Select one authoritative test sample
    sample = supervised["test"][0]

    model = ResNet18_SAR(
        in_channels=2,
        num_classes=19,
        pretrained=False
    )

    model.load_state_dict(
        checkpoint["model_state_dict"],
        strict=True
    )

    model.eval()

    # Build dataset with exactly one test sample.
    from model_a.config import CONFIG

    ds = BigEarthNetS1Dataset(
        samples=[sample],
        config=CONFIG.dataset,
        is_training=False
    )

    item = ds[0]

    x = item["image"] if isinstance(item, dict) else item[0]

    if x.ndim == 3:
        x = x.unsqueeze(0)

    x = x.float()

    with torch.no_grad():
        features = model.extract_features(
            x,
            normalize=False
        )

        normalized_features = model.extract_features(
            x,
            normalize=True
        )

        logits = model(x)

    print(f"Input shape: {tuple(x.shape)}")
    print(f"Feature shape: {tuple(features.shape)}")
    print(f"Normalized feature shape: {tuple(normalized_features.shape)}")
    print(f"Logit shape: {tuple(logits.shape)}")

    if tuple(features.shape) == (1, 512):
        ok("Actual feature extraction returns [1, 512].")
    else:
        fail(
            f"Feature extraction returned {tuple(features.shape)}, "
            "expected (1, 512)."
        )

    if tuple(logits.shape) == (1, 19):
        ok("Actual model forward returns [1, 19] logits.")
    else:
        fail(
            f"Model forward returned {tuple(logits.shape)}, "
            "expected (1, 19)."
        )

    if torch.isfinite(features).all():
        ok("Extracted features are finite.")
    else:
        fail("Extracted features contain NaN/Inf.")

    norms = torch.linalg.vector_norm(
        normalized_features,
        dim=-1
    )

    print(f"Normalized feature L2 norm: {norms.tolist()}")

    if torch.allclose(
        norms,
        torch.ones_like(norms),
        atol=1e-4
    ):
        ok(
            "normalize=True produces unit-L2 512-D embeddings."
        )
    else:
        warn(
            "Normalized feature norm is not exactly 1.0."
        )

except Exception as e:
    fail(
        "Actual feature extraction test failed: "
        f"{type(e).__name__}: {e}"
    )
    traceback.print_exc()


# ============================================================
# 9. ACTUAL SALIENCY / GRADIENT TEST
# ============================================================

section("9. ACTUAL SALIENCY / GRADIENT PATH TEST")

try:
    import torch

    # Reuse model/x if available
    model.eval()

    x_grad = x.clone().detach().requires_grad_(True)

    model.zero_grad(set_to_none=True)

    logits = model(x_grad)

    # Use the strongest predicted class
    target_class = int(
        torch.argmax(logits[0]).item()
    )

    score = logits[0, target_class]

    score.backward()

    grad = x_grad.grad

    if grad is None:
        fail(
            "Backward pass completed but input gradient is None."
        )
    else:
        ok("Actual backward pass produced input gradients.")

        if torch.isfinite(grad).all():
            ok("Input gradients are finite.")
        else:
            fail("Input gradients contain NaN/Inf.")

        saliency = grad.abs().max(dim=1).values

        print(f"Gradient shape: {tuple(grad.shape)}")
        print(f"Saliency shape: {tuple(saliency.shape)}")
        print(
            f"Gradient absolute max: "
            f"{grad.abs().max().item():.8f}"
        )
        print(
            f"Gradient absolute mean: "
            f"{grad.abs().mean().item():.8f}"
        )

        if saliency.ndim == 3 and saliency.shape[1:] == x.shape[-2:]:
            ok(
                "Saliency map has correct spatial dimensions."
            )
        else:
            fail(
                f"Unexpected saliency shape: {tuple(saliency.shape)}"
            )

        if grad.abs().sum().item() > 0:
            ok(
                "Saliency gradient is non-zero."
            )
        else:
            fail(
                "Saliency gradient is completely zero."
            )

        print(
            f"Saliency target class: "
            f"{target_class} -> "
            f"{reverse_map.get(target_class, 'UNKNOWN')}"
        )

except Exception as e:
    fail(
        "Actual saliency/backward test failed: "
        f"{type(e).__name__}: {e}"
    )
    traceback.print_exc()


# ============================================================
# 10. TRAINING SOURCE FLOW
# ============================================================

section("10. TRAINING / MODEL-SELECTION FLOW")

try:
    train_source = safe_read(TRAIN_FILE)

    # Required concepts
    required_terms = [
        "best_macro_f1",
        "best_model_a.pt",
        "val",
        "test",
        "evaluate_model",
    ]

    missing = [
        term for term in required_terms
        if term.lower() not in train_source.lower()
    ]

    if missing:
        warn(
            "Training source is missing expected terms: "
            + ", ".join(missing)
        )
    else:
        ok(
            "train.py contains validation, best-checkpoint, "
            "and final-test evaluation components."
        )

    # Check approximate source ordering
    source_lower = train_source.lower()

    best_pos = source_lower.find("best_model_a.pt")
    test_pos = source_lower.find("test_loader")

    if best_pos >= 0 and test_pos >= 0:
        print(
            f"First best-checkpoint reference line position: {best_pos}"
        )
        print(
            f"First test-loader reference position: {test_pos}"
        )

    # Ensure no obvious optimizer use of test metric
    suspicious = []

    for line_no, line in enumerate(train_source.splitlines(), 1):
        low = line.lower()

        if "optimizer" in low and "test" in low:
            suspicious.append(
                (line_no, line.strip())
            )

        if "scheduler" in low and "test" in low:
            suspicious.append(
                (line_no, line.strip())
            )

        if "best_" in low and "test_" in low:
            suspicious.append(
                (line_no, line.strip())
            )

    if suspicious:
        warn(
            "Potential test-set/model-selection coupling needs manual review:"
        )
        for line_no, line in suspicious[:10]:
            print(f"  line {line_no}: {line}")
    else:
        ok(
            "No obvious optimizer/scheduler/best-model selection "
            "dependency on test metrics was found."
        )

except Exception as e:
    warn(f"Training-flow audit incomplete: {e}")


# ============================================================
# 11. CHECKPOINT INTEGRITY
# ============================================================

section("11. CHECKPOINT INTEGRITY")

try:
    if checkpoint is None:
        import torch
        checkpoint = torch.load(
            CHECKPOINT_FILE,
            map_location="cpu",
            weights_only=False
        )

    state = checkpoint.get("model_state_dict", {})

    fc_weight = state.get("fc.weight")
    fc_bias = state.get("fc.bias")

    if fc_weight is not None:
        print(
            f"fc.weight shape: {tuple(fc_weight.shape)}"
        )

        if tuple(fc_weight.shape) == (19, 512):
            ok(
                "Checkpoint classifier is correctly shaped [19, 512]."
            )
        else:
            fail(
                f"Unexpected fc.weight shape: {tuple(fc_weight.shape)}"
            )

    if fc_bias is not None:
        print(
            f"fc.bias shape: {tuple(fc_bias.shape)}"
        )

        if tuple(fc_bias.shape) == (19,):
            ok(
                "Checkpoint classifier bias is correctly shaped [19]."
            )
        else:
            fail(
                f"Unexpected fc.bias shape: {tuple(fc_bias.shape)}"
            )

    epoch = checkpoint.get("epoch")
    best_metric = checkpoint.get("best_metric")
    best_macro_f1 = checkpoint.get("best_macro_f1")

    print(f"Checkpoint epoch: {epoch}")
    print(f"Checkpoint best_metric: {best_metric}")
    print(f"Checkpoint best_macro_f1: {best_macro_f1}")

    if epoch == 14:
        ok(
            "Best checkpoint corresponds to expected epoch 14."
        )
    else:
        warn(
            f"Best checkpoint epoch is {epoch}, not expected 14."
        )

    if isinstance(best_macro_f1, (float, int)):
        if abs(float(best_macro_f1) - 0.6234) < 0.005:
            ok(
                "Checkpoint best Macro F1 matches the recorded "
                "training result (~0.6234)."
            )
        else:
            warn(
                f"Checkpoint best Macro F1={best_macro_f1} "
                "differs from expected ~0.6234."
            )

except Exception as e:
    fail(f"Checkpoint integrity audit failed: {e}")
    traceback.print_exc()


# ============================================================
# 12. TEST REPORT CONSISTENCY
# ============================================================

section("12. FINAL TEST REPORT CONSISTENCY")

try:
    report = load_json(REPORT_FILE)

    print(json.dumps(report, indent=2)[:5000])

    expected = {
        "test_macro_f1": 0.6125,
        "test_macro_precision": 0.7228,
        "test_macro_recall": 0.5497,
        "test_micro_f1": 0.7050,
        "test_hamming_loss": 0.0862,
        "test_exact_match_ratio": 0.2593,
    }

    found_keys = 0

    for key, expected_value in expected.items():
        if key not in report:
            continue

        found_keys += 1
        actual = float(report[key])

        print(
            f"{key}: actual={actual:.6f}, "
            f"expected≈{expected_value:.6f}"
        )

        if abs(actual - expected_value) < 0.01:
            ok(f"{key} matches recorded training result.")
        else:
            warn(
                f"{key} differs from recorded result."
            )

    if found_keys == 0:
        warn(
            "Could not identify expected metric keys in test report."
        )

except Exception as e:
    fail(f"Test report audit failed: {e}")


# ============================================================
# 13. PER-CLASS METRICS
# ============================================================

section("13. PER-CLASS METRIC AUDIT")

try:
    with open(
        PER_CLASS_FILE,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:
        rows = list(csv.DictReader(f))

    print(f"Rows: {len(rows)}")

    if len(rows) == 19:
        ok("Per-class metrics contains exactly 19 rows.")
    else:
        fail(
            f"Expected 19 per-class rows, found {len(rows)}."
        )

    # Find likely class-name column
    name_col = None

    if rows:
        for candidate in [
            "class_name",
            "class",
            "label",
            "name",
        ]:
            if candidate in rows[0]:
                name_col = candidate
                break

    if name_col:
        report_names = {
            str(row[name_col])
            for row in rows
        }

        expected_names = set(label_map.keys())

        missing_names = expected_names - report_names
        extra_names = report_names - expected_names

        if not missing_names and not extra_names:
            ok(
                "Per-class metric class names match "
                "label_indices.json."
            )
        else:
            warn(
                "Per-class metric names differ from label mapping."
            )

            if missing_names:
                print("Missing:", sorted(missing_names))

            if extra_names:
                print("Extra:", sorted(extra_names))
    else:
        warn(
            "Could not identify class-name column in per-class CSV."
        )

except Exception as e:
    fail(f"Per-class metric audit failed: {e}")


# ============================================================
# 14. MODEL CONFIGURATION
# ============================================================

section("14. MODEL CONFIGURATION")

try:
    cfg = checkpoint.get("model_config", {})

    print(json.dumps(cfg, indent=2))

    in_channels = cfg.get("in_channels")
    num_classes = cfg.get("num_classes")

    if in_channels == 2:
        ok("Checkpoint model_config confirms 2-channel SAR input.")
    else:
        warn(
            f"Checkpoint model_config in_channels={in_channels}"
        )

    if num_classes == 19:
        ok("Checkpoint model_config confirms 19 classes.")
    else:
        fail(
            f"Checkpoint model_config num_classes={num_classes}"
        )

except Exception as e:
    warn(f"Could not fully inspect model_config: {e}")


# ============================================================
# 15. NORMALIZATION CONFIG CONSISTENCY
# ============================================================

section("15. NORMALIZATION CONFIG CONSISTENCY")

try:
    norm_cfg = checkpoint.get("normalization_config", {})

    print(json.dumps(norm_cfg, indent=2))

    expected_norm = {
        "vh_mean": -19.27,
        "vh_std": 5.49,
        "vv_mean": -12.64,
        "vv_std": 5.11,
    }

    norm_ok = True

    for key, expected_value in expected_norm.items():
        actual = norm_cfg.get(key)

        if actual is None:
            norm_ok = False
            warn(f"Missing normalization value: {key}")
            continue

        if abs(float(actual) - expected_value) > 1e-5:
            norm_ok = False
            warn(
                f"{key}: checkpoint={actual}, "
                f"expected={expected_value}"
            )

    if norm_ok:
        ok(
            "Checkpoint normalization configuration matches "
            "the verified training configuration."
        )

except Exception as e:
    warn(f"Normalization configuration audit incomplete: {e}")


# ============================================================
# 16. FINAL VERDICT
# ============================================================

section("FINAL MODEL A AUDIT VERDICT")

print(f"PASS COUNT : {len(PASS)}")
print(f"WARN COUNT : {len(WARN)}")
print(f"FAIL COUNT : {len(FAIL)}")

print("\nCONFIRMED FAILURES:")
if FAIL:
    for item in FAIL:
        print(f"  - {item}")
else:
    print("  NONE")

print("\nWARNINGS:")
if WARN:
    for item in WARN:
        print(f"  - {item}")
else:
    print("  NONE")

print("\nIMPORTANT:")
print("  69,450 unmatched/non-official patches were intentionally")
print("  excluded from this supervised audit.")
print("  They are NOT treated as a Model A defect.")

print("\nDECISION LOGIC:")

if FAIL:
    print("  >>> RETRAINING IS NOT AUTOMATICALLY RECOMMENDED.")
    print("  >>> First determine whether every FAIL is a real pipeline bug.")
    print("  >>> A false-positive audit failure must NOT trigger retraining.")
else:
    if WARN:
        print("  >>> NO CONFIRMED TRAINING BUG FOUND.")
        print("  >>> Review WARN items before changing the model.")
        print("  >>> Current checkpoint remains valid.")
    else:
        print("  >>> MODEL A PIPELINE PASSES THE REMAINING AUDITS.")
        print("  >>> NO RETRAINING REQUIRED.")

print("\nFINAL CHECKPOINT:")
print(f"  {CHECKPOINT_FILE}")

print("\nAUDIT COMPLETE — READ ONLY")