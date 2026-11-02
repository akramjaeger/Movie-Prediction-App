/**
 * Placeholder prediction function
 *
 * Kept for backward compatibility / manual prediction input.
 * Returns a Prediction-compatible result. Replace the body with your QI model
 * or a call to the FastAPI ML service when ready.
 */

import type {
  MoviePredictionInput,
  Prediction,
  PredictionFactor,
} from "@/types";

const MODEL_VERSION = "placeholder-v0.1.0";

/**
 * Convert a raw success score (0..100) into a SUCCESS/FAILURE label.
 */
export function scoreToLabel(score: number): "SUCCESS" | "FAILURE" {
  return score >= 60 ? "SUCCESS" : "FAILURE";
}

export function scoreToVerdict(score: number): string {
  if (score >= 80) return "BLOCKBUSTER";
  if (score >= 60) return "HIT";
  if (score >= 40) return "AVERAGE";
  return "FLOP";
}

export function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    BLOCKBUSTER: "Blockbuster",
    HIT: "Hit",
    AVERAGE: "Average",
    FLOP: "Flop",
  };
  return labels[verdict] || "Hit";
}

export function verdictColorClass(verdict: string): string {
  const classes: Record<string, string> = {
    BLOCKBUSTER: "border-emerald-900 text-emerald-900 bg-emerald-50",
    HIT: "border-blue-900 text-blue-900 bg-blue-50",
    AVERAGE: "border-amber-900 text-amber-900 bg-amber-50",
    FLOP: "border-rose-900 text-rose-900 bg-rose-50",
  };
  return classes[verdict] || classes.HIT;
}

/**
 * Format a budget number as a localized currency string.
 */
export function formatBudget(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a success score as a percentage string.
 */
export function formatScore(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Placeholder prediction function.
 *
 * @param input - validated movie features
 * @returns a Prediction-compatible result with mock values
 *
 * TODO: Replace this body with your QI model inference (or a FastAPI call).
 * Keep the return type `Promise<Prediction>`.
 */
export async function predictSuccess(input: MoviePredictionInput): Promise<Prediction> {
  // Simulate model latency so loading states work during development.
  await new Promise((resolve) => setTimeout(resolve, 600));

  // ---- PLACEHOLDER LOGIC (remove when you plug in the QI model) ----
  const seed =
    input.title.length +
    input.releaseYear +
    input.budget +
    input.runtime +
    input.genre.length +
    input.cast.length;
  const rawScore = seed % 101; // 0 .. 100
  const probability = rawScore / 100;
  const label = scoreToLabel(rawScore);
  const confidence = Math.min(Math.max(0.72 + (rawScore % 30) / 100, 0), 1);

  const factors: PredictionFactor[] = [
    {
      name: "Budget",
      impact: input.budget > 50_000_000 ? "positive" : "neutral",
      weight: 0.25,
      description: "Higher budgets tend to correlate with wider release.",
    },
    {
      name: "Runtime",
      impact: input.runtime > 120 ? "negative" : "positive",
      weight: 0.15,
      description: "Very long runtimes can limit daily showings.",
    },
    {
      name: "Genre mix",
      impact: input.genre.length >= 2 ? "positive" : "neutral",
      weight: 0.2,
      description: "Multi-genre films often reach broader audiences.",
    },
    {
      name: "Cast size",
      impact: input.cast.length >= 3 ? "positive" : "neutral",
      weight: 0.15,
      description: "More known cast members can help marketing.",
    },
    {
      name: "Release year",
      impact: input.releaseYear >= 2020 ? "positive" : "neutral",
      weight: 0.1,
      description: "More recent releases reflect current market taste.",
    },
    {
      name: "Director",
      impact: "neutral",
      weight: 0.15,
      description: "Director track record (model input).",
    },
  ];

  return {
    id: `pred_${Date.now()}`,
    userId: "",
    movieId: "manual",
    modelId: "model_placeholder",
    result: label,
    probability,
    successScore: rawScore,
    confidence,
    factors,
    predictedAt: new Date().toISOString(),
    inputSnapshot: input,
  };
}

export { MODEL_VERSION };
