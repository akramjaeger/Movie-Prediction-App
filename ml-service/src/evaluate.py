"""Evaluation metrics for the movie success prediction model.

Computes Accuracy, Precision, Recall, F1-score and ROC-AUC as required by
the cahier des charges, and compares against a reference model.
"""

from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def evaluate_model(y_true, y_pred, y_proba) -> dict:
    """Return a dict of classification metrics.

    y_proba is the probability of the positive (success) class. When it cannot
    be computed, ROC-AUC is reported as None.
    """
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
    }

    try:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba))
    except (ValueError, TypeError):
        metrics["roc_auc"] = None

    return metrics


def reference_metrics(y_true) -> dict:
    """Metrics of a naive reference model that always predicts the majority class."""
    majority = int(round(y_true.mean()))
    y_pred = np.full_like(y_true, majority)
    y_proba = np.full_like(y_true, float(majority), dtype=float)
    return evaluate_model(y_true, y_pred, y_proba)


def print_metrics(name: str, metrics: dict) -> None:
    print(f"--- {name} ---")
    for key, value in metrics.items():
        if value is None:
            print(f"  {key}: N/A")
        else:
            print(f"  {key}: {value:.4f}")
