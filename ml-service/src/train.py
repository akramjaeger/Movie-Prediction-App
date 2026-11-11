"""Model training pipeline.

Compares Logistic Regression, Random Forest and Gradient Boosting on the same
train/test split, selects the best model by ROC-AUC (per the cahier des
charges), and saves the best model + preprocessor to artifacts/.
"""

from __future__ import annotations

import json
import os
from typing import Tuple

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from evaluate import evaluate_model, print_metrics, reference_metrics
from preprocessing import CATEGORICAL_FEATURES, NUMERIC_FEATURES, build_preprocessor, split_features_target

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "artifacts")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
RANDOM_SEED = 42
TEST_SIZE = 0.2


def _model_pipeline(name: str, preprocessor) -> Pipeline:
    if name == "Logistic Regression":
        clf = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=RANDOM_SEED)
    elif name == "Random Forest":
        clf = RandomForestClassifier(
            n_estimators=300, max_depth=None, min_samples_leaf=2,
            class_weight="balanced", random_state=RANDOM_SEED, n_jobs=-1,
        )
    elif name == "Gradient Boosting":
        clf = GradientBoostingClassifier(
            n_estimators=300, learning_rate=0.05, max_depth=4,
            random_state=RANDOM_SEED,
        )
    else:
        raise ValueError(f"Unknown model: {name}")

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clf),
    ])


def train_and_select(csv_path: str) -> Tuple[str, dict, dict]:
    df = pd.read_csv(csv_path)

    # Build target from ROI (training only).
    df = df.copy()
    if "roi" not in df.columns:
        df["roi"] = (df["revenue"] - df["budget"]) / df["budget"]
    df["success"] = (df["roi"] > 0.0).astype(int)  # profitable = success

    X, y = split_features_target(df)

    # Temporal-aware split: keep a simple random split here; the document notes
    # a temporal split can be relevant. We stratify to preserve class balance.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    preprocessor = build_preprocessor()

    results = {}
    best_name = None
    best_auc = -1.0
    best_pipeline = None

    for name in ["Logistic Regression", "Random Forest", "Gradient Boosting"]:
        pipe = _model_pipeline(name, preprocessor)
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        metrics = evaluate_model(y_test, y_pred, y_proba)
        metrics["train_size"] = int(len(X_train))
        metrics["test_size"] = int(len(X_test))
        results[name] = metrics
        print_metrics(name, metrics)

        auc = metrics["roc_auc"] if metrics["roc_auc"] is not None else 0.0
        if auc > best_auc:
            best_auc = auc
            best_name = name
            best_pipeline = pipe

    ref = reference_metrics(y_test)
    print_metrics("Reference (majority class)", ref)

    print(f"\nBest model: {best_name} (ROC-AUC = {best_auc:.4f})")

    # Save artifacts.
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    model_path = os.path.join(ARTIFACTS_DIR, "model.joblib")
    preprocessor_path = os.path.join(ARTIFACTS_DIR, "preprocessor.joblib")
    meta_path = os.path.join(ARTIFACTS_DIR, "metadata.json")

    joblib.dump(best_pipeline, model_path)
    joblib.dump(preprocessor, preprocessor_path)

    metadata = {
        "best_model": best_name,
        "best_roc_auc": best_auc,
        "metrics": results,
        "reference": ref,
        "features": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
        "target": "success",
        "success_rule": "ROI > 0  (revenue > budget => profitable)",
        "random_seed": RANDOM_SEED,
        "n_samples": int(len(df)),
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"Saved model -> {model_path}")
    print(f"Saved preprocessor -> {preprocessor_path}")
    print(f"Saved metadata -> {meta_path}")
    return best_name, results, metadata


if __name__ == "__main__":
    csv_path = os.path.join(DATA_DIR, "movies.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Run data/generate_dataset.py first."
        )
    train_and_select(csv_path)
