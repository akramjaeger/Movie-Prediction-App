"""Single-movie inference used by the FastAPI service (predict.py).

Loads the saved pipeline from artifacts/ and returns a structured prediction:
predicted class (success/failure), probability and success score (0..100).

Success rule (cahier des charges): ROI = (Revenue - Budget) / Budget;
success = 1 if ROI > 0 (the film is profitable). Revenues build the target at
training time only and are NEVER features at prediction time.
"""

from __future__ import annotations

import os
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd

from schemas import MovieFeatures, PredictionOut
from preprocessing import NUMERIC_FEATURES, CATEGORICAL_FEATURES

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")

# Threshold above which a film is predicted as a success.
SUCCESS_PROBABILITY_THRESHOLD = 0.5

_pipeline = None


def _load_pipeline():
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Trained model not found at {MODEL_PATH}. "
                "Run src/train.py first to train and save the model."
            )
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline


def predict(features: MovieFeatures) -> PredictionOut:
    pipeline = _load_pipeline()

    record = {
        "budget": float(features.budget),
        "runtime": features.runtime,
        "release_year": features.release_year,
        "cast_count": features.cast_count,
        "genre": features.genre,
        "language": features.language,
        "country": features.country,
    }
    X = pd.DataFrame([record], columns=NUMERIC_FEATURES + CATEGORICAL_FEATURES)

    proba = float(pipeline.predict_proba(X)[0, 1])
    pred_class = int(proba >= SUCCESS_PROBABILITY_THRESHOLD)
    success_score = round(proba * 100, 1)

    return PredictionOut(
        success=bool(pred_class),
        probability=round(proba, 4),
        success_score=success_score,
        model_version="v1.0.0",
        message=(
            "Prédiction estimée : ce résultat est une estimation statistique, "
            "et non une garantie de succès commercial."
        ),
    )
