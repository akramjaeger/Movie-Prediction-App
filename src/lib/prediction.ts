/**
 * Movie success prediction — real model implementation.
 *
 * Delegates to the self-contained logistic regression in @/lib/ml/model,
 * trained on a reproducible historical dataset (see scripts/train-ts-model.js
 * and the ml-service/ Python service described in the cahier des charges).
 *
 * Kept as a stable entry point so @/app/api/predictions and other callers
 * continue to work unchanged.
 */

import type { MoviePredictionInput, Prediction } from "@/types";

import {
  predictSuccess as modelPredictSuccess,
  scoreToLabel,
  scoreToVerdict,
  verdictLabel,
  verdictColorClass,
  formatBudget,
  formatScore,
  MODEL_METADATA,
  MODEL_WEIGHTS,
} from "@/lib/ml/model";

/** Active model version exposed to the rest of the app. */
export const MODEL_VERSION = MODEL_WEIGHTS.version;

/**
 * Run a movie success prediction.
 *
 * @param input - validated movie features
 * @returns a Prediction-compatible result (probability, score, label, factors)
 */
export async function predictSuccess(
  input: MoviePredictionInput
): Promise<Prediction> {
  return modelPredictSuccess(input);
}

/** Re-exported helpers for UI consistency. */
export {
  scoreToLabel,
  scoreToVerdict,
  verdictLabel,
  verdictColorClass,
  formatBudget,
  formatScore,
  MODEL_METADATA,
};
