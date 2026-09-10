import json
from pathlib import Path

ROOT = Path(r"D:\SIH\sat-query-sih")
MODEL_A = ROOT / "model_a"

INDEX_FILE = MODEL_A / "cache" / "patch_index.json"
SPLIT_FILE = MODEL_A / "cache" / "splits.json"
LABEL_FILE = MODEL_A / "data" / "label_indices.json"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_mapping(raw):
    if not isinstance(raw, dict):
        raise ValueError("label_indices.json is not a dictionary")

    candidates = []

    def inspect(obj):
        if isinstance(obj, dict):
            if len(obj) == 19 and all(isinstance(v, int) for v in obj.values()):
                candidates.append(obj)

            for v in obj.values():
                inspect(v)

        elif isinstance(obj, list):
            if len(obj) == 19 and all(isinstance(v, str) for v in obj):
                candidates.append({name: i for i, name in enumerate(obj)})

    inspect(raw)

    preferred = [
        "Urban fabric",
        "Arable land",
        "Broad-leaved forest",
        "Marine waters",
    ]

    for mapping in candidates:
        names = set(mapping.keys())
        if all(x in names for x in preferred):
            return mapping

    if candidates:
        return candidates[0]

    raise ValueError("Could not find 19-class mapping")


index = load_json(INDEX_FILE)
splits = load_json(SPLIT_FILE)
label_raw = load_json(LABEL_FILE)

label_map = find_mapping(label_raw)

train_ids = set(splits["train"])

by_id = {
    s["patch_id"]: s
    for s in index
    if "patch_id" in s
}

counts = [0] * 19
train_samples = 0

for pid in train_ids:
    s = by_id.get(pid)

    if s is None:
        continue

    if not s.get("has_official_labels", False):
        continue

    labels = s.get("labels", [])

    if not labels:
        continue

    train_samples += 1

    seen = set()

    for label in labels:
        label = str(label)

        if label not in label_map:
            raise ValueError(
                f"Unknown label: {label}"
            )

        idx = label_map[label]

        if idx not in seen:
            counts[idx] += 1
            seen.add(idx)


# Multi-label BCE pos_weight:
# positive weight = negative_count / positive_count

pos_weights = []

for idx in range(19):
    positive = counts[idx]
    negative = train_samples - positive

    if positive == 0:
        weight = 1.0
    else:
        weight = negative / positive

    pos_weights.append(weight)


print("=" * 78)
print("SATQUERY MODEL A — TRAINING POS_WEIGHT")
print("=" * 78)

print(f"Official training samples: {train_samples:,}")

print("\nClass weights:")

reverse = {v: k for k, v in label_map.items()}

for idx in range(19):
    print(
        f"{idx:2d} | "
        f"{reverse[idx]:65s} | "
        f"positive={counts[idx]:8,} | "
        f"pos_weight={pos_weights[idx]:.6f}"
    )

print("\nPython list:")
print(
    "[" +
    ", ".join(f"{x:.6f}" for x in pos_weights) +
    "]"
)

# Save ONLY a small experiment configuration file.
output = MODEL_A / "pos_weights_experiment.json"

payload = {
    "training_samples": train_samples,
    "class_positive_counts": counts,
    "pos_weights": pos_weights,
    "classes": [
        reverse[i]
        for i in range(19)
    ]
}

with open(output, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)

print(f"\nSaved experiment weights to:")
print(output)

print("\nNo model/checkpoint was modified.")
print("No training was performed.")