"""
SatQuery AI — Model A Training Pipeline
Executes mixed-precision training for ResNet-18 SAR Multi-label classifier with checkpointing.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.cuda.amp import GradScaler, autocast

# Add parent directory to sys.path
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
        sample_ratio: Optional[float] = 0.01
    ):
        self.config = config
        self.device = torch.device(config.training.device if torch.cuda.is_available() else "cpu")
        print(f"[Trainer] Running on device: {self.device}")

        # Ensure directories exist
        self.config.training.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.config.training.logs_dir.mkdir(parents=True, exist_ok=True)

        # 1. Dataset Indexing & Splitting
        print("[Trainer] Initializing Dataset Pipeline...")
        self.samples = scan_and_index_patches(
            dataset_dir=config.dataset.raw_dataset_dir,
            cache_file=config.dataset.cache_dir / "patch_index.json",
            metadata_file=Path(__file__).resolve().parent / "data" / "metadata.parquet",
            max_acquisitions=max_acquisitions
        )
        self.train_samples, self.val_samples, self.test_samples = create_reproducible_splits(
            samples=self.samples,
            config=config.dataset,
            split_cache_path=config.dataset.cache_dir / "splits.json",
            by_acquisition=True
        )

        # Stratified sampling across all acquisitions to ensure all 19 classes are represented
        if sample_ratio is not None and 0.0 < sample_ratio < 1.0:
            import random
            rng = random.Random(config.dataset.random_seed)
            def stratify(samples_list):
                acq_groups = {}
                for s in samples_list:
                    acq_groups.setdefault(str(s.get("acquisition", "unknown")), []).append(s)
                subset = []
                for a in sorted(acq_groups.keys()):
                    items = acq_groups[a]
                    k = max(1, int(len(items) * sample_ratio))
                    subset.extend(rng.sample(items, min(k, len(items))))
                return subset

            self.train_samples = stratify(self.train_samples)
            self.val_samples = stratify(self.val_samples)
            self.test_samples = stratify(self.test_samples)
            print(f"[Trainer] Stratified geographic sampling across acquisitions ({sample_ratio*100:.1f}%): "
                  f"Train: {len(self.train_samples):,} | Val: {len(self.val_samples):,} | Test: {len(self.test_samples):,}")

        # 2. Build DataLoaders
        self.train_loader, self.val_loader, self.test_loader = build_dataloaders(
            train_samples=self.train_samples,
            val_samples=self.val_samples,
            test_samples=self.test_samples,
            config=self.config
        )

        # 3. Model Architecture
        print("[Trainer] Initializing ResNet-18 SAR Model...")
        self.model = ResNet18_SAR(
            num_classes=self.config.dataset.num_classes,
            in_channels=self.config.dataset.in_channels,
            pretrained=True
        ).to(self.device)

        # 4. Loss, Discriminative Optimizer, Scheduler & Scaler
        self.criterion = MultiLabelBCEWithLogitsLoss()
        
        # Discriminative learning rates:
        # Backbone (pretrained ImageNet features): 1e-4
        # Adapted conv1 (SAR 2-channel) & final classifier (19 classes): 1e-3
        backbone_params = []
        adapted_params = []
        for name, param in self.model.named_parameters():
            if not param.requires_grad:
                continue
            if "conv1" in name or "fc" in name:
                adapted_params.append(param)
            else:
                backbone_params.append(param)

        self.optimizer = AdamW([
            {"params": backbone_params, "lr": 1e-4, "name": "backbone"},
            {"params": adapted_params, "lr": 1e-3, "name": "adapted_layers"}
        ], weight_decay=self.config.training.weight_decay)

        self.scheduler = CosineAnnealingLR(
            self.optimizer,
            T_max=self.config.training.max_epochs,
            eta_min=1e-6
        )
        self.scaler = GradScaler(enabled=(self.config.training.use_amp and self.device.type == "cuda"))

        self.best_macro_f1 = 0.0
        self.history: List[Dict] = []
        print(f"[Trainer] Optimizer initialized with discriminative LRs: Backbone=1e-4 ({len(backbone_params)} tensors), Adapted/Head=1e-3 ({len(adapted_params)} tensors)")

    def train_epoch(self, epoch: int) -> float:
        self.model.train()
        total_loss = 0.0
        num_batches = len(self.train_loader)
        t0 = time.time()

        self.optimizer.zero_grad()

        for batch_idx, (sar_batch, label_batch, _) in enumerate(self.train_loader):
            sar_batch = sar_batch.to(self.device, non_blocking=True)
            label_batch = label_batch.to(self.device, non_blocking=True)

            with autocast(enabled=(self.config.training.use_amp and self.device.type == "cuda")):
                logits = self.model(sar_batch)
                loss = self.criterion(logits, label_batch)
                loss = loss / self.config.training.grad_accum_steps

            self.scaler.scale(loss).backward()

            if (batch_idx + 1) % self.config.training.grad_accum_steps == 0 or (batch_idx + 1) == num_batches:
                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad()

            total_loss += loss.item() * self.config.training.grad_accum_steps

        avg_loss = total_loss / max(1, num_batches)
        elapsed = time.time() - t0
        print(f"[Epoch {epoch:02d}] Train Loss: {avg_loss:.4f} | Time: {elapsed:.2f}s")
        return avg_loss

    @torch.no_grad()
    def evaluate(self, data_loader) -> Tuple[float, Dict[str, float]]:
        self.model.eval()
        total_loss = 0.0
        all_targets = []
        all_pred_probs = []

        for sar_batch, label_batch, _ in data_loader:
            sar_batch = sar_batch.to(self.device, non_blocking=True)
            label_batch = label_batch.to(self.device, non_blocking=True)

            with autocast(enabled=(self.config.training.use_amp and self.device.type == "cuda")):
                logits = self.model(sar_batch)
                loss = self.criterion(logits, label_batch)

            total_loss += loss.item()
            probs = torch.sigmoid(logits)

            all_targets.append(label_batch.cpu().numpy())
            all_pred_probs.append(probs.cpu().numpy())

        avg_loss = total_loss / max(1, len(data_loader))
        y_true = np.vstack(all_targets)
        y_probs = np.vstack(all_pred_probs)

        metrics = calculate_multilabel_metrics(y_true, y_probs, threshold=0.5)
        metrics["loss"] = avg_loss
        return avg_loss, metrics

    def save_checkpoint(self, epoch: int, metrics: Dict[str, float], is_best: bool = False):
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "best_macro_f1": self.best_macro_f1,
            "best_metric": metrics.get("macro_f1", 0.0),
            "metrics": metrics,
            "class_names": CORINE_19_CLASSES,
            "model_config": {
                "architecture": "ResNet18_SAR",
                "in_channels": self.config.dataset.in_channels,
                "num_classes": self.config.dataset.num_classes,
                "feature_dim": 512
            },
            "normalization_config": {
                "vh_mean": self.config.dataset.vh_mean,
                "vh_std": self.config.dataset.vh_std,
                "vv_mean": self.config.dataset.vv_mean,
                "vv_std": self.config.dataset.vv_std,
                "db_min": self.config.dataset.db_min,
                "db_max": self.config.dataset.db_max,
                "input_order": ["VH", "VV"]
            }
        }
        latest_path = self.config.training.checkpoint_dir / "latest_checkpoint.pt"
        torch.save(checkpoint, latest_path)

        if is_best:
            best_path = self.config.training.checkpoint_dir / "best_model_a.pt"
            torch.save(checkpoint, best_path)
            print(f"[*] Saved new best Model A checkpoint to {best_path} (Macro F1: {metrics['macro_f1']:.4f})")

    def run_training(self, num_epochs: Optional[int] = None):
        epochs = num_epochs or self.config.training.max_epochs
        print("=" * 70)
        print(f"SATQUERY AI — TRAINING MODEL A (ResNet-18 SAR) FOR {epochs} EPOCHS")
        print("=" * 70)

        for epoch in range(1, epochs + 1):
            train_loss = self.train_epoch(epoch)
            val_loss, val_metrics = self.evaluate(self.val_loader)
            self.scheduler.step()

            macro_f1 = val_metrics["macro_f1"]
            micro_f1 = val_metrics["micro_f1"]
            hamming = val_metrics["hamming_loss"]

            print(f"[Epoch {epoch:02d}] Val Loss: {val_loss:.4f} | Val Macro F1: {macro_f1:.4f} | Val Micro F1: {micro_f1:.4f} | Hamming Loss: {hamming:.4f}")

            is_best = macro_f1 > self.best_macro_f1
            if is_best:
                self.best_macro_f1 = macro_f1

            self.save_checkpoint(epoch, val_metrics, is_best=is_best)

            self.history.append({
                "epoch": epoch,
                "train_loss": train_loss,
                "val_loss": val_loss,
                **val_metrics,
                "lr": float(self.optimizer.param_groups[0]["lr"])
            })

            # Save training log JSON
            log_file = self.config.training.logs_dir / "training_history.json"
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(self.history, f, indent=2)

        print("\n" + "=" * 70)
        print(f"MODEL A TRAINING COMPLETED. BEST VALIDATION MACRO F1: {self.best_macro_f1:.4f}")
        print("=" * 70)

        # Final Test Evaluation using Best Trained Checkpoint
        best_ckpt_path = self.config.training.checkpoint_dir / "best_model_a.pt"
        if best_ckpt_path.exists() and self.test_loader is not None:
            print("\n[Trainer] Evaluating Best Model Checkpoint on Held-Out Test Split...")
            ckpt = torch.load(best_ckpt_path, map_location=self.device)
            self.model.load_state_dict(ckpt["model_state_dict"])
            test_loss, test_metrics = self.evaluate(self.test_loader)
            
            print(f"\n========================================")
            print(f"FINAL TEST SET EVALUATION REPORT")
            print(f"========================================")
            print(f"Test Loss:            {test_loss:.4f}")
            print(f"Test Macro F1:        {test_metrics['macro_f1']:.4f}")
            print(f"Test Macro Precision: {test_metrics['macro_precision']:.4f}")
            print(f"Test Macro Recall:    {test_metrics['macro_recall']:.4f}")
            print(f"Test Micro F1:        {test_metrics['micro_f1']:.4f}")
            print(f"Test Micro Precision: {test_metrics['micro_precision']:.4f}")
            print(f"Test Micro Recall:    {test_metrics['micro_recall']:.4f}")
            print(f"Test Hamming Loss:    {test_metrics['hamming_loss']:.4f}")
            print(f"Exact Match Ratio:    {test_metrics['exact_match_ratio']:.4f}")
            print(f"========================================")

            # Compute and save per-class metrics
            results_dir = BASE_DIR / "model_a" / "results"
            results_dir.mkdir(parents=True, exist_ok=True)
            
            # Run detailed per-class pass
            all_t, all_p = [], []
            self.model.eval()
            with torch.no_grad():
                for s_x, s_y, _ in self.test_loader:
                    s_x, s_y = s_x.to(self.device), s_y.to(self.device)
                    with autocast(enabled=(self.config.training.use_amp and self.device.type == "cuda")):
                        logits = self.model(s_x)
                    all_t.append(s_y.cpu().numpy())
                    all_p.append(torch.sigmoid(logits).cpu().numpy())

            y_true = np.vstack(all_t)
            y_pred = (np.vstack(all_p) >= 0.5).astype(int)
            tp_c = np.sum((y_true == 1) & (y_pred == 1), axis=0)
            fp_c = np.sum((y_true == 0) & (y_pred == 1), axis=0)
            fn_c = np.sum((y_true == 1) & (y_pred == 0), axis=0)
            sup_c = np.sum(y_true == 1, axis=0)

            per_class_records = []
            for i, cname in enumerate(CORINE_19_CLASSES):
                tp, fp, fn, sup = int(tp_c[i]), int(fp_c[i]), int(fn_c[i]), int(sup_c[i])
                prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
                rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
                f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
                per_class_records.append({
                    "class_id": i,
                    "class_name": cname,
                    "support": sup,
                    "true_positives": tp,
                    "false_positives": fp,
                    "false_negatives": fn,
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1_score": round(f1, 4)
                })

            report_payload = {
                "model_name": "ResNet18_SAR",
                "checkpoint": str(best_ckpt_path),
                "test_loss": test_loss,
                "global_metrics": test_metrics,
                "per_class_metrics": per_class_records
            }

            rep_json = results_dir / "test_evaluation_report.json"
            with open(rep_json, "w", encoding="utf-8") as f:
                json.dump(report_payload, f, indent=2)

            import pandas as pd
            pd.DataFrame(per_class_records).to_csv(results_dir / "per_class_metrics.csv", index=False)
            print(f"[*] Exported evaluation report to {rep_json}")
            print(f"[*] Exported per-class metrics to {results_dir / 'per_class_metrics.csv'}")

        return self.best_macro_f1


if __name__ == "__main__":
    trainer = ModelATrainer(sample_ratio=0.01)
    trainer.run_training(num_epochs=15)

