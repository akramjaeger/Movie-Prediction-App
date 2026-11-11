"""Pydantic schemas for the FastAPI ML service (POST /predict).

Input matches the features used at training time on the real dataset
(movies_dataset.csv): all pre-release information, no revenue leakage.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, condecimal, confloat, conint


class MovieFeatures(BaseModel):
    """Input characteristics expected by the model (pre-release information)."""

    budget: condecimal(ge=0) = Field(
        ..., description="Production budget in USD."
    )
    runtime: conint(ge=1, le=400) = Field(
        ..., description="Runtime in minutes."
    )
    release_year: conint(ge=1888, le=2100) = Field(
        ..., description="Release year."
    )
    cast_count: conint(ge=0, le=100) = Field(
        ..., description="Number of cast members."
    )
    has_director: bool = Field(
        ..., description="Whether a director is attached."
    )
    genre: str = Field(..., description="Primary genre.")
    language: str = Field(..., description="Original language (e.g. 'en').")
    country: str = Field(..., description="Country of production (e.g. 'US').")


class PredictionOut(BaseModel):
    """Structured prediction returned by the service."""

    success: bool = Field(..., description="Predicted class: success (profitable) or failure.")
    probability: float = Field(..., ge=0, le=1, description="Probability of success.")
    success_score: float = Field(
        ..., ge=0, le=100, description="Success score on a 0..100 scale."
    )
    model_version: str = Field(..., description="Version of the model used.")
    message: str = Field(..., description="Interpretation note.")
