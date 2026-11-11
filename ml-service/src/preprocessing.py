"""Preprocessing pipeline for the movie success prediction model.

Trained on the real TMDB-derived dataset (movies_dataset.csv).
Respects the methodological rule from the cahier des charges: the model must
NOT receive final revenues (or any post-release information) at prediction
time. Revenues are used only to build the target variable during training.

Success rule: ROI = (Revenue - Budget) / Budget; success = 1 if ROI > 0
(the film is profitable).
"""

from __future__ import annotations

from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.impute import SimpleImputer

# Features the model receives at prediction time (pre-release information only).
NUMERIC_FEATURES = ["budget", "runtime", "release_year", "cast_count"]
CATEGORICAL_FEATURES = ["genre", "language", "country"]

# Target built from revenues (training only).
TARGET = "success"
REVENUE = "revenue"
ROI = "roi"

# Budget is log-transformed before scaling to tame heavy-tailed outliers.
LOG_TRANSFORM_NUMERIC = ["budget"]

# Features that must never be used as inputs (post-release / target leakage).
LEAKY_FEATURES = [REVENUE, ROI]


def build_preprocessor() -> ColumnTransformer:
    """Build the scikit-learn preprocessing column transformer.

    Numeric features: log1p-transform budget, impute (median), standard scale.
    Categorical features: impute (most frequent) + one-hot encoding
    (unknown categories are ignored at inference time).
    """
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        (
            "log1p",
            FunctionTransformer(np.log1p, validate=False, feature_names_out="one-to-one"),
        ),
        ("scaler", StandardScaler()),
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer([
        ("numeric", numeric_pipeline, NUMERIC_FEATURES),
        ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
    ])

    return preprocessor


def split_features_target(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Return (X, y) using only non-leaky prediction features."""
    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    missing = [c for c in feature_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")

    X = df[feature_cols].copy()
    y = df[TARGET].astype(int)
    return X, y


def add_target(df: pd.DataFrame, threshold: float = 0.0) -> pd.DataFrame:
    """Add the binary `success` target from ROI (training set construction only).

    success = 1 when ROI > threshold, else 0.
    """
    df = df.copy()
    if ROI not in df.columns and REVENUE in df.columns and "budget" in df.columns:
        df[ROI] = (df[REVENUE] - df["budget"]) / df["budget"]
    df[TARGET] = (df[ROI] > threshold).astype(int)
    return df
