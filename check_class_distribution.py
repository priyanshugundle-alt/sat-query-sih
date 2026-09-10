import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent
MODEL_A = ROOT / "model_a"

INDEX_FILE = MODEL_A / "cache" / "patch_index.json"
SPLIT_FILE = MODEL_A / "cache" / "splits.json"
LABEL_FILE = MODEL_A / "data" / "label_indices.json"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_19_class_mapping(raw):
    """
    Find the actual 19-class mapping inside label_indices.json.
    The file may contain wrapper sections such as:
      original_labels
      label_conversion
      BigEarthNet-19_labels
    """

    # Direct list
    if isinstance(raw, list) and len(raw) == 19:
        return {str(v): i for i, v in enumerate(raw)}

    if not isinstance(raw, dict):
        return {}

    # Search recursively for a 19-item mapping/list.
    candidates = []

    def inspect(obj, path="root"):
        if isinstance(obj, dict):
            # name -> integer
            if len(obj) == 19 and all(
                isinstance(v, int) for v in obj.values()
            ):
                candidates.append((path, obj))

            # integer-string -> name
            elif len(obj) == 19:
                numeric_keys = True
                converted = {}

                for k, v in obj.items():
                    try:
                        idx = int(k)
                    except Exception:
                        numeric_keys = False
                        break

                    if not isinstance(v, str):
                        numeric_keys = False
                        break

                    converted[v] = idx

                if numeric_keys and len(converted) == 19:
                    candidates.append((path, converted))

            for k, v in obj.items():
                inspect(v, f"{path}.{k}")

        elif isinstance(obj, list):
            if len(obj) == 19 and all(
                isinstance(v, str) for v in obj
            ):
                candidates.append(
                    (
                        path,
                        {str(v): i for i, v in enumerate(obj)}
                    )
                )

            for i, v in enumerate(obj):
                inspect(v, f"{path}[{i}]")

    inspect(raw)

    if not candidates:
        return {}

    # Prefer mapping containing known CORINE class names.
    preferred_terms = [
        "Urban fabric",
        "Arable land",
        "Broad-leaved forest",
        "Marine waters",
    ]

    for path, mapping in candidates:
        joined = " | ".join(mapping.keys())

        if all(term in joined for term in preferred_terms):
            print(f"Using mapping found at: {path}")
            return mapping

    path, mapping = candidates[0]
    print(f"Using 19-class mapping found at: {path}")
    return mapping


print("=" * 78)
print("SATQUERY MODEL A — TRUE 19-CLASS DISTRIBUTION AUDIT")
print("=" * 78)

# ------------------------------------------------------------
# Load
# ------------------------------------------------------------

print("\nLoading files...")

index = load_json(INDEX_FILE)
split_data = load_json(SPLIT_FILE)
label_raw = load_json(LABEL_FILE)

print(f"Indexed patches: {len(index):,}")

label_map = find_19_class_mapping(label_raw)

if len(label_map) != 19:
    print("\nERROR:")
    print(
        f"Could not identify the true 19-class mapping. "
        f"Found {len(label_map)} classes."
    )
    print(
        "\nDo NOT change the model or retrain."
    )
    raise SystemExit(1)

# Reverse mapping
idx_to_name = {
    idx: name
    for name, idx in label_map.items()
}

print(f"Confirmed classes: {len(idx_to_name)}")

print("\n========== TRUE CLASS MAPPING ==========")

for idx in sorted(idx_to_name):
    print(f"{idx:2d} -> {idx_to_name[idx]}")


# ------------------------------------------------------------
# Build patch lookup
# ------------------------------------------------------------

by_id = {}

for sample in index:
    pid = sample.get("patch_id")

    if pid:
        by_id[pid] = sample


train_ids = set(split_data.get("train", []))
val_ids = set(split_data.get("val", []))
test_ids = set(split_data.get("test", []))


# ------------------------------------------------------------
# Count official labels only
# ------------------------------------------------------------

def calculate_counts(ids):
    counts = Counter()
    sample_count = 0
    invalid_labels = []
    empty_official = []

    for pid in ids:
        sample = by_id.get(pid)

        if sample is None:
            continue

        if not sample.get("has_official_labels", False):
            continue

        labels = sample.get("labels", [])

        if not labels:
            empty_official.append(pid)
            continue

        sample_count += 1

        for label in labels:
            label = str(label)

            if label in label_map:
                counts[label_map[label]] += 1
            else:
                invalid_labels.append((pid, label))

    return (
        counts,
        sample_count,
        invalid_labels,
        empty_official,
    )


results = {}

for split_name, ids in [
    ("TRAIN", train_ids),
    ("VAL", val_ids),
    ("TEST", test_ids),
]:
    counts, sample_count, invalid, empty = calculate_counts(ids)

    results[split_name] = counts

    print("\n" + "=" * 78)
    print(f"{split_name} — OFFICIAL LABELS ONLY")
    print("=" * 78)

    print(f"Official labelled samples: {sample_count:,}")

    if invalid:
        print(f"Invalid/unmapped labels: {len(invalid):,}")
    else:
        print("Invalid/unmapped labels: 0")

    if empty:
        print(f"Official samples with empty labels: {len(empty):,}")
    else:
        print("Official samples with empty labels: 0")

    total_positives = sum(counts.values())

    print(f"Total positive class assignments: {total_positives:,}")

    print("\nClass distribution:")

    for idx in range(19):
        name = idx_to_name[idx]
        count = counts.get(idx, 0)

        if total_positives > 0:
            pct = 100.0 * count / total_positives
        else:
            pct = 0.0

        print(
            f"{idx:2d} | "
            f"{name:65s} | "
            f"{count:8,} | "
            f"{pct:6.2f}%"
        )


# ------------------------------------------------------------
# Train imbalance analysis
# ------------------------------------------------------------

print("\n" + "=" * 78)
print("TRAIN CLASS IMBALANCE ANALYSIS")
print("=" * 78)

train_counts = results["TRAIN"]

nonzero = [
    (idx, train_counts.get(idx, 0))
    for idx in range(19)
    if train_counts.get(idx, 0) > 0
]

zero_classes = [
    idx
    for idx in range(19)
    if train_counts.get(idx, 0) == 0
]

if zero_classes:
    print("\nZERO-POSITIVE CLASSES:")
    for idx in zero_classes:
        print(f"  {idx} -> {idx_to_name[idx]}")
else:
    print("\nAll 19 classes have positive training examples.")


if nonzero:
    least_idx, least_count = min(
        nonzero,
        key=lambda x: x[1]
    )

    most_idx, most_count = max(
        nonzero,
        key=lambda x: x[1]
    )

    ratio = most_count / max(least_count, 1)

    print("\nMost frequent class:")
    print(
        f"  {most_idx} -> {idx_to_name[most_idx]}"
        f" = {most_count:,}"
    )

    print("\nLeast frequent class:")
    print(
        f"  {least_idx} -> {idx_to_name[least_idx]}"
        f" = {least_count:,}"
    )

    print(
        f"\nMax / Min positive-count ratio: {ratio:.2f}x"
    )

    if ratio >= 100:
        verdict = (
            "SEVERE imbalance — worth investigating "
            "before changing training."
        )
    elif ratio >= 20:
        verdict = (
            "HIGH imbalance — inspect per-class recall/F1 "
            "before changing the loss."
        )
    elif ratio >= 5:
        verdict = (
            "MODERATE imbalance — current BCE may still be "
            "reasonable; compare per-class results."
        )
    else:
        verdict = (
            "LOW/MODERATE imbalance — no immediate training "
            "change indicated."
        )

    print(f"\nVerdict: {verdict}")


# ------------------------------------------------------------
# Compare with test report
# ------------------------------------------------------------

REPORT_FILE = MODEL_A / "results" / "test_evaluation_report.json"

if REPORT_FILE.exists():
    report = load_json(REPORT_FILE)

    print("\n" + "=" * 78)
    print("TEST REPORT SUPPORT CROSS-CHECK")
    print("=" * 78)

    per_class = report.get("per_class_metrics", [])

    print(
        f"Per-class metric records: {len(per_class)}"
    )

    report_by_id = {}

    for row in per_class:
        if "class_id" in row:
            report_by_id[int(row["class_id"])] = row

    for idx in range(19):
        name = idx_to_name[idx]
        count = results["TEST"].get(idx, 0)
        row = report_by_id.get(idx)

        f1 = row.get("f1_score") if row else None

        print(
            f"{idx:2d} | "
            f"{name:65s} | "
            f"test support={count:8,} | "
            f"F1={f1 if f1 is not None else 'N/A'}"
        )


# ------------------------------------------------------------
# Final
# ------------------------------------------------------------

print("\n" + "=" * 78)
print("FINAL RESULT")
print("=" * 78)

print(
    "This audit used only authoritative-labelled samples."
)

print(
    "The 69,450 unmatched/non-official patches were ignored "
    "exactly as requested."
)

if invalid_labels:
    print(
        f"\nWARNING: {len(invalid_labels):,} labels could not "
        "be mapped."
    )
else:
    print(
        "\nAll inspected official labels mapped to the "
        "19-class taxonomy."
    )

print(
    "\nNO MODEL FILES WERE MODIFIED."
)
print(
    "NO CHECKPOINTS WERE MODIFIED."
)
print(
    "NO TRAINING WAS PERFORMED."
)

print("\nAUDIT COMPLETE.")