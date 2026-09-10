"""
SatQuery AI — Model A Training Pipeline
ResNet-18 SAR Multi-label training with:
- Official BigEarthNet-S1 labels only
- Acquisition-level split
- Optional stratified sampling
- Conservative class-balanced BCE experiment
- Mixed precision training
- Validation-based best checkpoint selection
- Final held-out test evaluation
"""

import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.cuda.amp import GradScaler, autocast

# ---------------------------------------------------------------------
# Project imports
# ---------------------------------------------------------------------

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


class ModelATrainer:
    def __init__(
        self,
        config: ModelAConfig = CONFIG,
        max_acquisitions: Optional[int] = None,
        sample_ratio: Optional[float] = 0.01,
    ):
        self.config = config

        # -------------------------------------------------------------
        # Reproducibility
        # -------------------------------------------------------------
        seed = self.config.dataset.random_seed

        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)

        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

        # Deterministic algorithms are intentionally not forced because
        # they can reduce throughput on the RTX 3050.
        print(f"[Trainer] Random seed set to: {seed}")

        # -------------------------------------------------------------
        # Device
        # -------------------------------------------------------------
        requested_device = self.config.training.device

        if requested_device == "cuda" and torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")

        print(f"[Trainer] Running on device: {self.device}")

        if self.device.type == "cuda":
            print(f"[Trainer] GPU: {torch.cuda.get_device_name(0)}")

        # -------------------------------------------------------------
        # Directories
        # -------------------------------------------------------------
        self.config.training.checkpoint_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.config.training.logs_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        # -------------------------------------------------------------
        # 1. Dataset indexing + splitting
        # -------------------------------------------------------------
        print("[Trainer] Initializing Dataset Pipeline...")

        self.samples = scan_and_index_patches(
            dataset_dir=self.config.dataset.raw_dataset_dir,
            cache_file=self.config.dataset.cache_dir / "patch_index.json",
            metadata_file=(
                Path(__file__).resolve().parent
                / "data"
                / "metadata.parquet"
            ),
            max_acquisitions=max_acquisitions,
        )

        self.train_samples, self.val_samples, self.test_samples = (
            create_reproducible_splits(
                samples=self.samples,
                config=self.config.dataset,
                split_cache_path=(
                    self.config.dataset.cache_dir / "splits.json"
                ),
                by_acquisition=True,
            )
        )

        # -------------------------------------------------------------
        # Keep ONLY authoritative BigEarthNet-labelled samples for
        # supervised training.
        #
        # The 69,450 unmatched/non-official patches are intentionally
        # preserved in the index for future unsupervised use.
        # -------------------------------------------------------------
        self.train_samples = [
            s
            for s in self.train_samples
            if s.get("has_official_labels", False)
            and len(s.get("labels", [])) > 0
        ]

        self.val_samples = [
            s
            for s in self.val_samples
            if s.get("has_official_labels", False)
            and len(s.get("labels", [])) > 0
        ]

        self.test_samples = [
            s
            for s in self.test_samples
            if s.get("has_official_labels", False)
            and len(s.get("labels", [])) > 0
        ]

        print(
            f"[Trainer] Official-label filter applied | "
            f"Train: {len(self.train_samples):,} | "
            f"Val: {len(self.val_samples):,} | "
            f"Test: {len(self.test_samples):,}"
        )

        # -------------------------------------------------------------
        # Optional stratified sampling.
        #
        # IMPORTANT:
        # sample_ratio=None means FULL official dataset.
        # -------------------------------------------------------------
        if sample_ratio is not None and 0.0 < sample_ratio < 1.0:
            rng = random.Random(self.config.dataset.random_seed)

            def stratify(samples_list: List[Dict]) -> List[Dict]:
                acquisition_groups: Dict[str, List[Dict]] = {}

                for sample in samples_list:
                    acquisition = str(
                        sample.get("acquisition", "unknown")
                    )

                    acquisition_groups.setdefault(
                        acquisition,
                        [],
                    ).append(sample)

                subset: List[Dict] = []

                for acquisition in sorted(acquisition_groups.keys()):
                    items = acquisition_groups[acquisition]

                    k = max(
                        1,
                        int(len(items) * sample_ratio),
                    )

                    subset.extend(
                        rng.sample(
                            items,
                            min(k, len(items)),
                        )
                    )

                return subset

            self.train_samples = stratify(self.train_samples)
            self.val_samples = stratify(self.val_samples)
            self.test_samples = stratify(self.test_samples)

            print(
                f"[Trainer] Stratified geographic sampling "
                f"across acquisitions "
                f"({sample_ratio * 100:.1f}%): "
                f"Train: {len(self.train_samples):,} | "
                f"Val: {len(self.val_samples):,} | "
                f"Test: {len(self.test_samples):,}"
            )

        # -------------------------------------------------------------
        # 2. DataLoaders
        # -------------------------------------------------------------
        self.train_loader, self.val_loader, self.test_loader = (
            build_dataloaders(
                train_samples=self.train_samples,
                val_samples=self.val_samples,
                test_samples=self.test_samples,
                config=self.config,
            )
        )

        # -------------------------------------------------------------
        # 3. Model
        # -------------------------------------------------------------
        print("[Trainer] Initializing ResNet-18 SAR Model...")

        self.model = ResNet18_SAR(
            num_classes=self.config.dataset.num_classes,
            in_channels=self.config.dataset.in_channels,
            pretrained=True,
        ).to(self.device)

        # -------------------------------------------------------------
        # 4. Loss
        #
        # Conservative class-balancing experiment:
        # raw train-only pos_weights were:
        #   [6.07, 43.47, 1.70, 15.37, 3.83, 3.69, 2.71,
        #    14.61, 2.37, 2.23, 2.01, 37.03, 28.50,
        #    2.54, 373.11, 24.29, 335.70, 7.44, 5.91]
        #
        # Extreme values are capped at 10.
        # -------------------------------------------------------------
        raw_pos_weights = [
            6.070657,
            43.473916,
            1.695749,
            15.371906,
            3.828309,
            3.685709,
            2.712640,
            14.606161,
            2.371758,
            2.227616,
            2.010150,
            37.034231,
            28.501018,
            2.540812,
            373.109989,
            24.294582,
            335.698990,
            7.436222,
            5.907147,
        ]

        max_pos_weight = 10.0

        pos_weights = torch.tensor(
            [
                min(weight, max_pos_weight)
                for weight in raw_pos_weights
            ],
            dtype=torch.float32,
            device=self.device,
        )

        self.pos_weights = pos_weights

        print(
            "[Trainer] Using capped class weights "
            f"(max={max_pos_weight:.1f})"
        )

        print(
            "[Trainer] pos_weight = "
            + str([round(float(x), 4) for x in pos_weights.cpu()])
        )

        self.criterion = MultiLabelBCEWithLogitsLoss(
            pos_weight=self.pos_weights
        )

        # -------------------------------------------------------------
        # 5. Discriminative optimizer
        # -------------------------------------------------------------
        backbone_params = []
        adapted_params = []

        for name, param in self.model.named_parameters():
            if not param.requires_grad:
                continue

            if "conv1" in name or "fc" in name:
                adapted_params.append(param)
            else:
                backbone_params.append(param)

        self.optimizer = AdamW(
            [
                {
                    "params": backbone_params,
                    "lr": 1e-4,
                    "name": "backbone",
                },
                {
                    "params": adapted_params,
                    "lr": 1e-3,
                    "name": "adapted_layers",
                },
            ],
            weight_decay=self.config.training.weight_decay,
        )

        print(
            "[Trainer] Optimizer initialized with discriminative LRs: "
            f"Backbone=1e-4 ({len(backbone_params)} tensors), "
            f"Adapted/Head=1e-3 ({len(adapted_params)} tensors)"
        )

        # -------------------------------------------------------------
        # 6. Scheduler
        # -------------------------------------------------------------
        self.scheduler = CosineAnnealingLR(
            self.optimizer,
            T_max=self.config.training.max_epochs,
            eta_min=1e-6,
        )

        # -------------------------------------------------------------
        # 7. AMP
        # -------------------------------------------------------------
        self.scaler = GradScaler(
            enabled=(
                self.config.training.use_amp
                and self.device.type == "cuda"
            )
        )

        # -------------------------------------------------------------
        # Training state
        # -------------------------------------------------------------
        self.best_macro_f1 = 0.0
        self.best_epoch = 0
        self.history: List[Dict] = []

    # ================================================================
    # TRAIN ONE EPOCH
    # ================================================================

    def train_epoch(self, epoch: int) -> float:
        self.model.train()

        total_loss = 0.0
        num_batches = len(self.train_loader)
        t0 = time.time()

        self.optimizer.zero_grad(set_to_none=True)

        grad_accum_steps = max(
            1,
            self.config.training.grad_accum_steps,
        )

        for batch_idx, (sar_batch, label_batch, _) in enumerate(
            self.train_loader
        ):
            sar_batch = sar_batch.to(
                self.device,
                non_blocking=True,
            )

            label_batch = label_batch.to(
                self.device,
                non_blocking=True,
            )

            with autocast(
                enabled=(
                    self.config.training.use_amp
                    and self.device.type == "cuda"
                )
            ):
                logits = self.model(sar_batch)

                loss = self.criterion(
                    logits,
                    label_batch,
                )

                loss = loss / grad_accum_steps

            self.scaler.scale(loss).backward()

            should_step = (
                (batch_idx + 1) % grad_accum_steps == 0
                or (batch_idx + 1) == num_batches
            )

            if should_step:
                self.scaler.step(self.optimizer)
                self.scaler.update()

                self.optimizer.zero_grad(
                    set_to_none=True
                )

            total_loss += (
                loss.item() * grad_accum_steps
            )

        avg_loss = total_loss / max(
            1,
            num_batches,
        )

        elapsed = time.time() - t0

        print(
            f"[Epoch {epoch:02d}] "
            f"Train Loss: {avg_loss:.4f} | "
            f"Time: {elapsed:.2f}s"
        )

        return avg_loss

    # ================================================================
    # EVALUATION
    # ================================================================

    @torch.no_grad()
    def evaluate(
        self,
        data_loader,
    ) -> Tuple[float, Dict[str, float]]:

        self.model.eval()

        total_loss = 0.0
        all_targets = []
        all_pred_probs = []

        for sar_batch, label_batch, _ in data_loader:
            sar_batch = sar_batch.to(
                self.device,
                non_blocking=True,
            )

            label_batch = label_batch.to(
                self.device,
                non_blocking=True,
            )

            with autocast(
                enabled=(
                    self.config.training.use_amp
                    and self.device.type == "cuda"
                )
            ):
                logits = self.model(sar_batch)

                loss = self.criterion(
                    logits,
                    label_batch,
                )

            total_loss += loss.item()

            probs = torch.sigmoid(logits)

            all_targets.append(
                label_batch.cpu().numpy()
            )

            all_pred_probs.append(
                probs.cpu().numpy()
            )

        if not all_targets:
            raise RuntimeError(
                "Evaluation loader produced zero batches."
            )

        avg_loss = total_loss / max(
            1,
            len(data_loader),
        )

        y_true = np.vstack(all_targets)
        y_probs = np.vstack(all_pred_probs)

        metrics = calculate_multilabel_metrics(
            y_true,
            y_probs,
            threshold=0.5,
        )

        metrics["loss"] = avg_loss

        return avg_loss, metrics

    # ================================================================
    # SAVE CHECKPOINT
    # ================================================================

    def save_checkpoint(
        self,
        epoch: int,
        metrics: Dict[str, float],
        is_best: bool = False,
    ) -> None:

        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),

            "best_macro_f1": self.best_macro_f1,

            "best_metric": metrics.get(
                "macro_f1",
                0.0,
            ),

            "metrics": metrics,

            "class_names": CORINE_19_CLASSES,

            "model_config": {
                "architecture": "ResNet18_SAR",
                "in_channels": self.config.dataset.in_channels,
                "num_classes": self.config.dataset.num_classes,
                "feature_dim": 512,
            },

            "normalization_config": {
                "vh_mean": self.config.dataset.vh_mean,
                "vh_std": self.config.dataset.vh_std,
                "vv_mean": self.config.dataset.vv_mean,
                "vv_std": self.config.dataset.vv_std,
                "db_min": self.config.dataset.db_min,
                "db_max": self.config.dataset.db_max,
                "input_order": ["VH", "VV"],
            },

            "training_config": {
                "batch_size": self.config.training.batch_size,
                "weight_decay": self.config.training.weight_decay,
                "backbone_lr": 1e-4,
                "adapted_lr": 1e-3,
                "max_epochs": self.config.training.max_epochs,
                "grad_accum_steps": self.config.training.grad_accum_steps,
                "use_amp": self.config.training.use_amp,
                "loss": "BCEWithLogitsLoss",
                "class_balancing": "capped_pos_weight",
                "max_pos_weight": 10.0,
                "pos_weights": [
                    float(x)
                    for x in self.pos_weights.cpu()
                ],
                "seed": self.config.dataset.random_seed,
            },
        }

        latest_path = (
            self.config.training.checkpoint_dir
            / "latest_checkpoint.pt"
        )

        torch.save(
            checkpoint,
            latest_path,
        )

        if is_best:
            best_path = (
                self.config.training.checkpoint_dir
                / "best_model_a_weighted.pt"
            )

            torch.save(
                checkpoint,
                best_path,
            )

            print(
                f"[*] Saved new best WEIGHTED Model A checkpoint "
                f"to {best_path} "
                f"(Macro F1: {metrics['macro_f1']:.4f})"
            )

    # ================================================================
    # FULL TRAINING
    # ================================================================

    def run_training(
        self,
        num_epochs: Optional[int] = None,
    ) -> float:

        epochs = (
            num_epochs
            if num_epochs is not None
            else self.config.training.max_epochs
        )

        print("=" * 70)
        print(
            "SATQUERY AI — WEIGHTED MODEL A "
            f"(ResNet-18 SAR) FOR {epochs} EPOCHS"
        )
        print("=" * 70)

        print(
            f"Training samples: {len(self.train_samples):,}"
        )

        print(
            f"Validation samples: {len(self.val_samples):,}"
        )

        print(
            f"Test samples: {len(self.test_samples):,}"
        )

        for epoch in range(1, epochs + 1):

            train_loss = self.train_epoch(epoch)

            # ---------------------------------------------------------
            # Validation is the ONLY split used for model selection.
            # ---------------------------------------------------------
            val_loss, val_metrics = self.evaluate(
                self.val_loader
            )

            self.scheduler.step()

            macro_f1 = val_metrics["macro_f1"]
            micro_f1 = val_metrics["micro_f1"]
            hamming = val_metrics["hamming_loss"]

            current_lr = float(
                self.optimizer.param_groups[0]["lr"]
            )

            print(
                f"[Epoch {epoch:02d}] "
                f"Val Loss: {val_loss:.4f} | "
                f"Val Macro F1: {macro_f1:.4f} | "
                f"Val Micro F1: {micro_f1:.4f} | "
                f"Hamming Loss: {hamming:.4f} | "
                f"LR: {current_lr:.8f}"
            )

            # ---------------------------------------------------------
            # Best model = BEST VALIDATION Macro F1.
            # Test set is NOT involved here.
            # ---------------------------------------------------------
            is_best = macro_f1 > self.best_macro_f1

            if is_best:
                self.best_macro_f1 = macro_f1
                self.best_epoch = epoch

            self.save_checkpoint(
                epoch=epoch,
                metrics=val_metrics,
                is_best=is_best,
            )

            self.history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_loss,
                    "val_loss": val_loss,
                    **val_metrics,
                    "lr": current_lr,
                }
            )

            # ---------------------------------------------------------
            # Save history
            # ---------------------------------------------------------
            log_file = (
                self.config.training.logs_dir
                / "weighted_training_history.json"
            )

            with open(
                log_file,
                "w",
                encoding="utf-8",
            ) as f:
                json.dump(
                    self.history,
                    f,
                    indent=2,
                )

        print("\n" + "=" * 70)
        print(
            "WEIGHTED MODEL A TRAINING COMPLETED."
        )
        print(
            f"BEST VALIDATION MACRO F1: "
            f"{self.best_macro_f1:.4f}"
        )
        print(
            f"BEST EPOCH: {self.best_epoch}"
        )
        print("=" * 70)

        # =============================================================
        # FINAL TEST EVALUATION
        #
        # Test is intentionally touched ONLY after all training and
        # validation-based checkpoint selection is complete.
        # =============================================================

        best_ckpt_path = (
            self.config.training.checkpoint_dir
            / "best_model_a_weighted.pt"
        )

        if (
            best_ckpt_path.exists()
            and self.test_loader is not None
        ):
            print(
                "\n[Trainer] Evaluating BEST WEIGHTED checkpoint "
                "on Held-Out Test Split..."
            )

            ckpt = torch.load(
                best_ckpt_path,
                map_location=self.device,
                weights_only=False,
            )

            self.model.load_state_dict(
                ckpt["model_state_dict"]
            )

            test_loss, test_metrics = self.evaluate(
                self.test_loader
            )

            print("\n========================================")
            print("WEIGHTED MODEL A — FINAL TEST REPORT")
            print("========================================")
            print(
                f"Test Loss:            {test_loss:.4f}"
            )
            print(
                f"Test Macro F1:        "
                f"{test_metrics['macro_f1']:.4f}"
            )
            print(
                f"Test Macro Precision: "
                f"{test_metrics['macro_precision']:.4f}"
            )
            print(
                f"Test Macro Recall:    "
                f"{test_metrics['macro_recall']:.4f}"
            )
            print(
                f"Test Micro F1:        "
                f"{test_metrics['micro_f1']:.4f}"
            )
            print(
                f"Test Micro Precision: "
                f"{test_metrics['micro_precision']:.4f}"
            )
            print(
                f"Test Micro Recall:    "
                f"{test_metrics['micro_recall']:.4f}"
            )
            print(
                f"Test Hamming Loss:    "
                f"{test_metrics['hamming_loss']:.4f}"
            )
            print(
                f"Exact Match Ratio:    "
                f"{test_metrics['exact_match_ratio']:.4f}"
            )
            print("========================================")

            # ---------------------------------------------------------
            # Detailed per-class metrics
            # ---------------------------------------------------------
            results_dir = (
                BASE_DIR
                / "model_a"
                / "results"
                / "weighted_experiment"
            )

            results_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            all_targets = []
            all_probs = []

            self.model.eval()

            with torch.no_grad():
                for s_x, s_y, _ in self.test_loader:

                    s_x = s_x.to(
                        self.device,
                        non_blocking=True,
                    )

                    s_y = s_y.to(
                        self.device,
                        non_blocking=True,
                    )

                    with autocast(
                        enabled=(
                            self.config.training.use_amp
                            and self.device.type == "cuda"
                        )
                    ):
                        logits = self.model(s_x)

                    all_targets.append(
                        s_y.cpu().numpy()
                    )

                    all_probs.append(
                        torch.sigmoid(logits)
                        .cpu()
                        .numpy()
                    )

            y_true = np.vstack(all_targets)
            y_probs = np.vstack(all_probs)

            y_pred = (
                y_probs >= 0.5
            ).astype(int)

            tp_c = np.sum(
                (y_true == 1) & (y_pred == 1),
                axis=0,
            )

            fp_c = np.sum(
                (y_true == 0) & (y_pred == 1),
                axis=0,
            )

            fn_c = np.sum(
                (y_true == 1) & (y_pred == 0),
                axis=0,
            )

            support_c = np.sum(
                y_true == 1,
                axis=0,
            )

            per_class_records = []

            for i, class_name in enumerate(
                CORINE_19_CLASSES
            ):
                tp = int(tp_c[i])
                fp = int(fp_c[i])
                fn = int(fn_c[i])
                support = int(support_c[i])

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
                            float(precision),
                            4,
                        ),
                        "recall": round(
                            float(recall),
                            4,
                        ),
                        "f1_score": round(
                            float(f1),
                            4,
                        ),
                    }
                )

            report_payload = {
                "model_name": "ResNet18_SAR_WEIGHTED",
                "checkpoint": str(best_ckpt_path),
                "best_epoch": self.best_epoch,
                "best_validation_macro_f1": self.best_macro_f1,
                "test_loss": test_loss,
                "global_metrics": test_metrics,
                "pos_weights": [
                    float(x)
                    for x in self.pos_weights.cpu()
                ],
                "per_class_metrics": per_class_records,
            }

            report_json = (
                results_dir
                / "test_evaluation_report_weighted.json"
            )

            with open(
                report_json,
                "w",
                encoding="utf-8",
            ) as f:
                json.dump(
                    report_payload,
                    f,
                    indent=2,
                )

            import pandas as pd

            pd.DataFrame(
                per_class_records
            ).to_csv(
                results_dir
                / "per_class_metrics_weighted.csv",
                index=False,
            )

            print(
                f"[*] Exported weighted test report to "
                f"{report_json}"
            )

            print(
                "[*] Exported weighted per-class metrics to "
                f"{results_dir / 'per_class_metrics_weighted.csv'}"
            )

        else:
            print(
                "[WARN] Weighted best checkpoint or test loader "
                "was not available; test evaluation skipped."
            )

        return self.best_macro_f1


# ================================================================
# MAIN
# ================================================================

if __name__ == "__main__":
    trainer = ModelATrainer(
        sample_ratio=None
    )

    trainer.run_training(
        num_epochs=15
    )