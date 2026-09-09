"""
SatQuery AI — Multi-Label Evaluation Metrics
Calculates Macro F1, Micro F1, Precision, Recall, Hamming Loss, and Subset Accuracy.
"""

from typing import Dict
import numpy as np
import torch


def calculate_multilabel_metrics(
    y_true: np.ndarray,
    y_pred_probs: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, float]:
    """
    Computes comprehensive multi-label evaluation metrics:
    - Macro F1, Precision, Recall (unweighted average across all 19 classes)
    - Micro F1, Precision, Recall (global aggregate over all instances and classes)
    - Hamming Loss (fraction of incorrect label predictions)
    - Subset Accuracy (exact match ratio)
    """
    y_true = (y_true > 0.5).astype(int)
    y_pred = (y_pred_probs >= threshold).astype(int)

    num_samples, num_classes = y_true.shape

    # Per-class True Positives, False Positives, False Negatives
    tp_per_class = np.sum((y_true == 1) & (y_pred == 1), axis=0)
    fp_per_class = np.sum((y_true == 0) & (y_pred == 1), axis=0)
    fn_per_class = np.sum((y_true == 1) & (y_pred == 0), axis=0)

    # Class-wise precision, recall, F1
    has_support = (tp_per_class + fn_per_class) > 0
    has_predictions = (tp_per_class + fp_per_class) > 0

    precision_per_class = np.divide(
        tp_per_class,
        tp_per_class + fp_per_class,
        out=np.zeros(num_classes, dtype=float),
        where=has_predictions
    )
    recall_per_class = np.divide(
        tp_per_class,
        tp_per_class + fn_per_class,
        out=np.zeros(num_classes, dtype=float),
        where=has_support
    )
    f1_per_class = np.divide(
        2 * precision_per_class * recall_per_class,
        precision_per_class + recall_per_class,
        out=np.zeros(num_classes, dtype=float),
        where=(precision_per_class + recall_per_class) > 0
    )

    # Macro metrics averaged over classes that have support (or all classes if none specified)
    if np.any(has_support):
        macro_precision = float(np.mean(precision_per_class[has_support]))
        macro_recall = float(np.mean(recall_per_class[has_support]))
        macro_f1 = float(np.mean(f1_per_class[has_support]))
    else:
        macro_precision = float(np.mean(precision_per_class))
        macro_recall = float(np.mean(recall_per_class))
        macro_f1 = float(np.mean(f1_per_class))

    # Micro Metrics
    total_tp = float(np.sum(tp_per_class))
    total_fp = float(np.sum(fp_per_class))
    total_fn = float(np.sum(fn_per_class))

    micro_precision = total_tp / (total_tp + total_fp + 1e-7)
    micro_recall = total_tp / (total_tp + total_fn + 1e-7)
    micro_f1 = (2 * micro_precision * micro_recall) / (micro_precision + micro_recall + 1e-7)

    # Hamming Loss & Exact Match
    hamming_loss = float(np.mean(y_true != y_pred))
    exact_match = float(np.mean(np.all(y_true == y_pred, axis=1)))

    return {
        "macro_f1": macro_f1,
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "micro_f1": micro_f1,
        "micro_precision": micro_precision,
        "micro_recall": micro_recall,
        "hamming_loss": hamming_loss,
        "exact_match_ratio": exact_match
    }
