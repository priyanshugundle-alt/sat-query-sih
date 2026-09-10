import sys
import os
import time

sys.path.insert(0, r"D:\database\satquery-s2")

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision.models import resnet18

from bigearthnet_npz_dataset_augmented import BigEarthNetS2NPZDataset
import random
import math
import pandas as pd

class RandomAugmentedBigEarthNetS2NPZDataset(BigEarthNetS2NPZDataset):
    def __getitem__(self, index):
        original = self.augment
        self.augment = random.choice([None, "hflip", "vflip", "rot90"])
        try:
            return super().__getitem__(index)
        finally:
            self.augment = original


# ============================================================
# CONFIG
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

METADATA = r"D:\database\BigEarthNet-S2\metadata.parquet"

NPZ_DIR = r"D:\database\BigEarthNet-S2\preprocessed_test"
VAL_NPZ_DIR = r"D:\database\BigEarthNet-S2\preprocessed_val"

CHECKPOINT_DIR = r"D:\database\satquery-s2\checkpoints_classbalance"

BEST_MODEL_PATH = os.path.join(
    CHECKPOINT_DIR,
    "best_model.pth"
)

BATCH_SIZE = 16

EPOCHS = 10

LEARNING_RATE = 1e-4

WEIGHT_DECAY = 1e-4

NUM_WORKERS = 0

NUM_CLASSES = 19

os.makedirs(
    CHECKPOINT_DIR,
    exist_ok=True
)


# ============================================================
# DATASETS
# ============================================================

print("=" * 70)
print("Loading NPZ datasets...")
print("=" * 70)

train_dataset = RandomAugmentedBigEarthNetS2NPZDataset(
    METADATA,
    NPZ_DIR,
    split="train"
)

val_dataset = BigEarthNetS2NPZDataset(
    METADATA,
    VAL_NPZ_DIR,
    split="validation"
)

print("Train samples:", len(train_dataset))
print("Validation samples:", len(val_dataset))
print("Classes:", len(train_dataset.classes))


# ============================================================
# DATALOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=NUM_WORKERS,
    pin_memory=True
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS,
    pin_memory=True
)

print("Train batches:", len(train_loader))
print("Validation batches:", len(val_loader))


# ============================================================
# MODEL
# ============================================================

print("\n" + "=" * 70)
print("Creating ResNet-18...")
print("=" * 70)

model = resnet18(weights=None)

# Sentinel-2 has 12 bands
model.conv1 = nn.Conv2d(
    12,
    64,
    kernel_size=7,
    stride=2,
    padding=3,
    bias=False
)

# Keep original classifier size
model.fc = nn.Linear(
    model.fc.in_features,
    NUM_CLASSES
)

model = model.to(DEVICE)

print("Device:", DEVICE)

if torch.cuda.is_available():
    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )


# ============================================================
# 512-D FEATURE EXTRACTION
# ============================================================

def extract_features(model, x):
    """
    Returns 512-dimensional ResNet-18 embeddings.
    """

    x = model.conv1(x)
    x = model.bn1(x)
    x = model.relu(x)
    x = model.maxpool(x)

    x = model.layer1(x)
    x = model.layer2(x)
    x = model.layer3(x)
    x = model.layer4(x)

    x = model.avgpool(x)

    x = torch.flatten(
        x,
        1
    )

    return x


# ============================================================
# LOSS + OPTIMIZER
# ============================================================

# ============================================================
# CLASS IMBALANCE: SOFTENED POSITIVE WEIGHTS
# ============================================================

train_df = pd.read_parquet(METADATA)
train_df = train_df[train_df["split"] == "train"]

class_counts = {}

for labels in train_df["labels"]:
    for label in labels:
        class_counts[label] = class_counts.get(label, 0) + 1

total_train = len(train_df)

raw_pos_weights = []

for class_name in train_dataset.classes:
    positive_count = class_counts[class_name]
    raw_weight = (total_train - positive_count) / positive_count
    softened_weight = min(5.0, math.sqrt(raw_weight))
    raw_pos_weights.append(softened_weight)

pos_weight = torch.tensor(
    raw_pos_weights,
    dtype=torch.float32,
    device=DEVICE
)

print("\nClass-balanced positive weights:")
for class_name, weight in zip(train_dataset.classes, raw_pos_weights):
    print(f"{class_name}: {weight:.3f}")

criterion = nn.BCEWithLogitsLoss(
    pos_weight=pos_weight
)

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=WEIGHT_DECAY
)

scaler = torch.amp.GradScaler(
    "cuda",
    enabled=torch.cuda.is_available()
)


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    all_outputs,
    all_targets
):

    probabilities = torch.sigmoid(
        all_outputs
    )

    predictions = (
        probabilities >= 0.5
    ).float()

    targets = all_targets.float()

    tp = (
        predictions * targets
    ).sum(dim=0)

    fp = (
        predictions * (1 - targets)
    ).sum(dim=0)

    fn = (
        (1 - predictions) * targets
    ).sum(dim=0)

    # Per-class precision
    precision_per_class = (
        tp / (tp + fp + 1e-8)
    )

    # Per-class recall
    recall_per_class = (
        tp / (tp + fn + 1e-8)
    )

    # Per-class F1
    f1_per_class = (
        2
        * precision_per_class
        * recall_per_class
        / (
            precision_per_class
            + recall_per_class
            + 1e-8
        )
    )

    macro_precision = (
        precision_per_class.mean().item()
    )

    macro_recall = (
        recall_per_class.mean().item()
    )

    macro_f1 = (
        f1_per_class.mean().item()
    )

    total_tp = tp.sum()
    total_fp = fp.sum()
    total_fn = fn.sum()

    micro_precision = (
        total_tp
        / (total_tp + total_fp + 1e-8)
    ).item()

    micro_recall = (
        total_tp
        / (total_tp + total_fn + 1e-8)
    ).item()

    micro_f1 = (
        2
        * micro_precision
        * micro_recall
        / (
            micro_precision
            + micro_recall
            + 1e-8
        )
    )

    return {
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "macro_f1": macro_f1,
        "micro_precision": micro_precision,
        "micro_recall": micro_recall,
        "micro_f1": micro_f1
    }


# ============================================================
# TRAINING
# ============================================================

best_val_f1 = -1.0

print("\n" + "=" * 70)
print("STARTING TRAINING")
print("=" * 70)

print("Batch size:", BATCH_SIZE)
print("Epochs:", EPOCHS)
print("Learning rate:", LEARNING_RATE)
print("Best model:", BEST_MODEL_PATH)
print("Augmentation: ON (random None/HFlip/VFlip/Rot90)")
print("Class balancing: ON (sqrt(pos_weight), capped at 5.0)")


for epoch in range(EPOCHS):

    epoch_start = time.time()

    # ========================================================
    # TRAIN
    # ========================================================

    model.train()

    train_loss = 0.0

    for batch_idx, (x, y) in enumerate(
        train_loader
    ):

        x = x.to(
            DEVICE,
            non_blocking=True
        )

        y = y.to(
            DEVICE,
            non_blocking=True
        )

        optimizer.zero_grad(
            set_to_none=True
        )

        with torch.amp.autocast(
            "cuda",
            enabled=torch.cuda.is_available()
        ):

            output = model(x)

            loss = criterion(
                output,
                y
            )

        scaler.scale(
            loss
        ).backward()

        scaler.step(
            optimizer
        )

        scaler.update()

        train_loss += loss.item()

        if batch_idx % 1000 == 0:

            print(
                f"Epoch {epoch + 1}/{EPOCHS} | "
                f"Train {batch_idx}/{len(train_loader)} | "
                f"Loss {loss.item():.4f}"
            )

    train_loss /= len(train_loader)


    # ========================================================
    # VALIDATION
    # ========================================================

    model.eval()

    val_loss = 0.0

    all_outputs = []
    all_targets = []

    with torch.no_grad():

        for x, y in val_loader:

            x = x.to(
                DEVICE,
                non_blocking=True
            )

            y = y.to(
                DEVICE,
                non_blocking=True
            )

            with torch.amp.autocast(
                "cuda",
                enabled=torch.cuda.is_available()
            ):

                output = model(x)

                loss = criterion(
                    output,
                    y
                )

            val_loss += loss.item()

            all_outputs.append(
                output.float().cpu()
            )

            all_targets.append(
                y.float().cpu()
            )

    val_loss /= len(val_loader)

    all_outputs = torch.cat(
        all_outputs,
        dim=0
    )

    all_targets = torch.cat(
        all_targets,
        dim=0
    )

    metrics = calculate_metrics(
        all_outputs,
        all_targets
    )


    # ========================================================
    # RESULTS
    # ========================================================

    epoch_time = (
        time.time()
        - epoch_start
    )

    print("\n" + "-" * 70)
    print(
        f"Epoch {epoch + 1}/{EPOCHS} Results"
    )
    print("-" * 70)

    print(
        f"Train Loss       : {train_loss:.4f}"
    )

    print(
        f"Validation Loss  : {val_loss:.4f}"
    )

    print(
        f"Macro Precision  : "
        f"{metrics['macro_precision']:.4f}"
    )

    print(
        f"Macro Recall     : "
        f"{metrics['macro_recall']:.4f}"
    )

    print(
        f"Macro F1         : "
        f"{metrics['macro_f1']:.4f}"
    )

    print(
        f"Micro Precision  : "
        f"{metrics['micro_precision']:.4f}"
    )

    print(
        f"Micro Recall     : "
        f"{metrics['micro_recall']:.4f}"
    )

    print(
        f"Micro F1         : "
        f"{metrics['micro_f1']:.4f}"
    )

    print(
        f"Epoch Time       : "
        f"{epoch_time / 60:.2f} minutes"
    )


    # ========================================================
    # BEST MODEL
    # ========================================================

    if metrics["macro_f1"] > best_val_f1:

        best_val_f1 = metrics[
            "macro_f1"
        ]

        checkpoint = {

            "model_state_dict":
                model.state_dict(),

            "best_val_f1":
                best_val_f1,

            "val_loss":
                val_loss,

            "epoch":
                epoch + 1,

            "classes":
                train_dataset.classes,

            "bands":
                train_dataset.bands,

            "feature_dim":
                512,

            "input_channels":
                12,

            "image_size":
                120
        }

        torch.save(
            checkpoint,
            BEST_MODEL_PATH
        )

        print("\n*** NEW BEST MODEL SAVED ***")

        print(
            "Path:",
            BEST_MODEL_PATH
        )

        print(
            "Best Macro F1:",
            round(best_val_f1, 4)
        )


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("TRAINING COMPLETE")
print("=" * 70)

print(
    "Best Validation Macro F1:",
    round(best_val_f1, 4)
)

print(
    "Best Model:",
    BEST_MODEL_PATH
)