"""FastAPI service exposing the trained movie success model via POST /predict.

Per the cahier des charges architecture, Next.js forwards pre-release movie
characteristics to this service, which applies the saved preprocessing and
returns the prediction. Access to this route should be controlled when
reserved to the backend.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from predict import predict
from schemas import MovieFeatures, PredictionOut

app = FastAPI(title="Movie Success Prediction ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "movie-success-ml", "version": "1.0.0"}


@app.post("/predict", response_model=PredictionOut)
def predict_endpoint(features: MovieFeatures) -> PredictionOut:
    try:
        return predict(features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc))
