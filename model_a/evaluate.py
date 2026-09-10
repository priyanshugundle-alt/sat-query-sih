"""
SatQuery AI — Model A Comprehensive Evaluation Pipeline (Phase 3)

Evaluates the trained Model A on the held-out official-label Test split.

Metrics:
- Test Loss
- Macro F1
- Micro F1
- Hamming Loss
- Exact Match Ratio
- Per-class Precision / Recall / F1

The evaluation dataset selection intentionally matches the supervised
training pipeline:
- Same patch index
- Same acquisition-level splits
- Same official-label filtering
- Full dataset (no max_acquisitions limit)
"""

import json
from pathlib import Path
import sys
import time
from typing import Dict, Optional

import numpy as np
import pandas as pd
import torch
from torch.cuda.amp import autocast

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from model_a.config import CONFIG, ModelAConfig
from model_a.data.corine_classes import CORINE_19_CLASSES
from model_a.data.dataset import scan_and_index_patches
from model_a.data.splits import create_reproducible_splits
from model_a.data.dataloader import build_dataloaders
from model_a.models.resnet_sar import ResNet18_SAR
from model_a.models.losses import MultiLabelBCEWithLogitsLoss
from model_a.models.metrics import calculate_multilabel_metrics


class ModelAEvaluator:
    def __init__(
        self,
        checkpoint_path: Optional[Path] = None,
        config: ModelAConfig = CONFIG,
        results_dir: Optional[Path] = None,
    ):
        self.config = config
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.results_dir = (
            results_dir
            or (BASE_DIR / "model_a" / "results")
        )
        self.results_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # ---------------------------------------------------------
        # Initialize Model A
        # ---------------------------------------------------------
        self.model = ResNet18_SAR(
            num_classes=self.config.dataset.num_classes,
            in_channels=self.config.dataset.in_channels,
            pretrained=False,
        )

        if checkpoint_path and Path(checkpoint_path).exists():
            checkpoint = torch.load(
                checkpoint_path,
                map_location=self.device
            )

            self.model.load_state_dict(
                checkpoint["model_state_dict"]
            )

            print(
                f"[Evaluator] Loaded checkpoint: "
                f"{checkpoint_path}"
            )
        else:
            raise FileNotFoundError(
                "Trained Model A checkpoint was not found."
            )

        self.model.to(self.device)
        self.model.eval()

        self.criterion = MultiLabelBCEWithLogitsLoss()

    def evaluate_dataset(
        self,
        test_loader,
        threshold: float = 0.5,
    ) -> Dict:

        print("=" * 70)
        print(
            "SATQUERY AI — PHASE 3: "
            "RUNNING MODEL A BENCHMARK EVALUATION"
        )
        print("=" * 70)

        total_loss = 0.0

        all_targets = []
        all_probs = []
        all_patch_ids = []

        t0 = time.time()

        # ---------------------------------------------------------
        # Run inference
        # ---------------------------------------------------------
        with torch.no_grad():

            for (
                sar_batch,
                label_batch,
                meta_batch,
            ) in test_loader:

                sar_batch = sar_batch.to(
                    self.device,
                    non_blocking=True
                )

                label_batch = label_batch.to(
                    self.device,
                    non_blocking=True
                )

                with autocast(
                    enabled=(self.device.type == "cuda")
                ):
                    logits = self.model(sar_batch)

                    loss = self.criterion(
                        logits,
                        label_batch
                    )

                total_loss += (
                    loss.item()
                    * sar_batch.size(0)
                )

                probs = torch.sigmoid(logits)

                all_targets.append(
                    label_batch.cpu().numpy()
                )

                all_probs.append(
                    probs.cpu().numpy()
                )

                all_patch_ids.extend(
                    meta_batch["patch_id"]
                )

        # ---------------------------------------------------------
        # Aggregate predictions
        # ---------------------------------------------------------
        total_samples = len(all_patch_ids)

        avg_loss = (
            total_loss / max(1, total_samples)
        )

        y_true = np.vstack(all_targets)
        y_probs = np.vstack(all_probs)

        y_pred = (
            y_probs >= threshold
        ).astype(int)

        # ---------------------------------------------------------
        # Global metrics
        # ---------------------------------------------------------
        global_metrics = calculate_multilabel_metrics(
            y_true,
            y_probs,
            threshold=threshold
        )

        global_metrics["test_loss"] = float(
            avg_loss
        )

        global_metrics["total_test_samples"] = (
            total_samples
        )

        global_metrics["evaluation_time_sec"] = float(
            time.time() - t0
        )

        global_metrics["threshold"] = float(
            threshold
        )

        # ---------------------------------------------------------
        # Per-class metrics
        # ---------------------------------------------------------
        per_class_records = []

        tp_per_class = np.sum(
            (y_true == 1) & (y_pred == 1),
            axis=0
        )

        fp_per_class = np.sum(
            (y_true == 0) & (y_pred == 1),
            axis=0
        )

        fn_per_class = np.sum(
            (y_true == 1) & (y_pred == 0),
            axis=0
        )

        support_per_class = np.sum(
            y_true == 1,
            axis=0
        )

        for i, class_name in enumerate(
            CORINE_19_CLASSES
        ):

            tp = int(tp_per_class[i])
            fp = int(fp_per_class[i])
            fn = int(fn_per_class[i])
            support = int(
                support_per_class[i]
            )

            precision = (
                tp / (tp + fp)
                if (tp + fp) > 0
                else 0.0
            )

            recall = (
                tp / (tp + fn)
                if (tp + fn) > 0
                else 0.0
            )

            f1 = (
                2 * precision * recall
                / (precision + recall)
                if (precision + recall) > 0
                else 0.0
            )

            per_class_records.append(
                {
                    "class_id": i,
                    "class_name": class_name,
                    "support": support,
                    "true_positives": tp,
                    "false_positives": fp,
                    "false_negatives": fn,
                    "precision": round(
                        precision,
                        4
                    ),
                    "recall": round(
                        recall,
                        4
                    ),
                    "f1_score": round(
                        f1,
                        4
                    ),
                }
            )

        # ---------------------------------------------------------
        # Build report
        # ---------------------------------------------------------
        report_payload = {
            "model_name": "Model-A-ResNet18-SAR",
            "model_version": "1.0.0",
            "evaluation_timestamp": time.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "dataset": (
                "BigEarthNet-S1 "
                "(Sentinel-1 SAR)"
            ),
            "evaluation_protocol": {
                "split": "held_out_test",
                "split_type": (
                    "acquisition_level"
                ),
                "official_labels_only": True,
                "threshold": threshold,
            },
            "global_metrics": global_metrics,
            "per_class_metrics": (
                per_class_records
            ),
        }

        # ---------------------------------------------------------
        # Save JSON report
        # ---------------------------------------------------------
        json_report_path = (
            self.results_dir
            / "test_evaluation_report.json"
        )

        with open(
            json_report_path,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                report_payload,
                f,
                indent=2
            )

        # ---------------------------------------------------------
        # Save CSV report
        # ---------------------------------------------------------
        csv_report_path = (
            self.results_dir
            / "per_class_metrics.csv"
        )

        pd.DataFrame(
            per_class_records
        ).to_csv(
            csv_report_path,
            index=False
        )

        # ---------------------------------------------------------
        # Print results
        # ---------------------------------------------------------
        print(
            f"\n[Evaluator] Test Loss:            "
            f"{global_metrics['test_loss']:.4f}"
        )

        print(
            f"[Evaluator] Test Macro F1:        "
            f"{global_metrics['macro_f1']:.4f}"
        )

        print(
            f"[Evaluator] Test Micro F1:        "
            f"{global_metrics['micro_f1']:.4f}"
        )

        print(
            f"[Evaluator] Test Hamming Loss:    "
            f"{global_metrics['hamming_loss']:.4f}"
        )

        print(
            f"[Evaluator] Exact Match Ratio:    "
            f"{global_metrics['exact_match_ratio']:.4f}"
        )

        print(
            f"[Evaluator] Test Samples:          "
            f"{total_samples:,}"
        )

        print(
            f"[Evaluator] Saved JSON report to: "
            f"{json_report_path}"
        )

        print(
            f"[Evaluator] Saved CSV metrics to: "
            f"{csv_report_path}"
        )

        print("=" * 70)

        return report_payload


def run_evaluation_benchmark():

    # -------------------------------------------------------------
    # Configuration
    # -------------------------------------------------------------
    CONFIG.training.num_workers = 0

    # -------------------------------------------------------------
    # 1. Load full indexed dataset
    #    SAME configuration as training
    # -------------------------------------------------------------
    samples = scan_and_index_patches(
        dataset_dir=CONFIG.dataset.raw_dataset_dir,
        cache_file=(
            CONFIG.dataset.cache_dir
            / "patch_index.json"
        ),
        metadata_file=(
            BASE_DIR
            / "model_a"
            / "data"
            / "metadata.parquet"
        ),
        max_acquisitions=None,
    )

    print(
        f"[Evaluator] Total indexed samples: "
        f"{len(samples):,}"
    )

    # -------------------------------------------------------------
    # 2. Recreate acquisition-level splits
    # -------------------------------------------------------------
    train_s, val_s, test_s = (
        create_reproducible_splits(
            samples=samples,
            config=CONFIG.dataset,
            split_cache_path=(
                CONFIG.dataset.cache_dir
                / "splits.json"
            ),
        )
    )

    print(
        f"[Evaluator] Raw splits | "
        f"Train: {len(train_s):,} | "
        f"Val: {len(val_s):,} | "
        f"Test: {len(test_s):,}"
    )

    # -------------------------------------------------------------
    # 3. Apply EXACT same official-label filtering
    #    used during Model A supervised training
    # -------------------------------------------------------------
    train_s = [
        s
        for s in train_s
        if s.get(
            "has_official_labels",
            False
        )
        and len(
            s.get("labels", [])
        ) > 0
    ]

    val_s = [
        s
        for s in val_s
        if s.get(
            "has_official_labels",
            False
        )
        and len(
            s.get("labels", [])
        ) > 0
    ]

    test_s = [
        s
        for s in test_s
        if s.get(
            "has_official_labels",
            False
        )
        and len(
            s.get("labels", [])
        ) > 0
    ]

    print(
        f"[Evaluator] Official-label filter applied | "
        f"Train: {len(train_s):,} | "
        f"Val: {len(val_s):,} | "
        f"Test: {len(test_s):,}"
    )

    # -------------------------------------------------------------
    # 4. Build DataLoaders
    # -------------------------------------------------------------
    _, _, test_loader = build_dataloaders(
        train_s,
        val_s,
        test_s,
        config=CONFIG,
    )

    # -------------------------------------------------------------
    # 5. Load ORIGINAL Model A checkpoint
    # -------------------------------------------------------------
    checkpoint_path = (
        CONFIG.training.checkpoint_dir
        / "best_model_a.pt"
    )

    if not checkpoint_path.exists():

        raise FileNotFoundError(
            f"Expected trained checkpoint not found:\n"
            f"{checkpoint_path}"
        )

    evaluator = ModelAEvaluator(
        checkpoint_path=checkpoint_path
    )

    # -------------------------------------------------------------
    # 6. Evaluate held-out official-label Test set
    # -------------------------------------------------------------
    evaluator.evaluate_dataset(
        test_loader,
        threshold=0.5
    )


if __name__ == "__main__":
    run_evaluation_benchmark()