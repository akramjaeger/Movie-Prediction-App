/**
 * Self-contained movie success prediction model.
 *
 * A logistic regression trained on the real TMDB-derived movie dataset
 * (6,987 films; see /tmp/train_real.py). It requires no external ML dependency
 * or Python service, so the Next.js app can produce predictions standalone.
 *
 * Success definition (cahier des charges):
 *   ROI = (Revenue - Budget) / Budget
 *   success = 1 if ROI > 0 (i.e. the film is profitable)
 * Revenues build the target at training time only and are NEVER features at
 * prediction time (no data leakage).
 *
 * Features (all available before release):
 *   budget (log-scaled), runtime, releaseYear, castCount, hasDirector,
 *   genre (multi-indicator), language, country.
 */

import type {
  MoviePredictionInput,
  Prediction,
  PredictionFactor,
} from "@/types";
import { MODEL_WEIGHTS } from "./model-weights";

const { weights, featureNames, intercept, threshold, numericStats, categories } =
  MODEL_WEIGHTS;

const NUMERIC_FEATURES = ["log_budget", "runtime", "releaseYear", "castCount"];

/** Sigmoid activation. */
function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

/** Build the numeric feature value for a movie input. */
function numericValue(name: string, input: MoviePredictionInput): number {
  switch (name) {
    case "log_budget": return Math.log1p(input.budget);
    case "runtime": return input.runtime;
    case "releaseYear": return input.releaseYear;
    case "castCount": return input.cast.length;
    default: return 0;
  }
}

/** Build the full standardized + one-hot feature vector (order = featureNames). */
function buildFeatureVector(input: MoviePredictionInput): number[] {
  const x: number[] = [];

  for (const name of featureNames) {
    if (NUMERIC_FEATURES.includes(name)) {
      const stat = numericStats[name];
      const raw = numericValue(name, input);
      x.push((raw - stat.mean) / stat.std);
    } else if (name.startsWith("genre__")) {
      const genre = name.slice("genre__".length);
      x.push(input.genre.includes(genre) ? 1 : 0);
    } else if (name.startsWith("lang__")) {
      const language = name.slice("lang__".length);
      x.push(input.language === language ? 1 : 0);
    } else if (name.startsWith("country__")) {
      const country = name.slice("country__".length);
      x.push(input.country === country ? 1 : 0);
    } else if (name.startsWith("rating__")) {
      const rating = name.slice("rating__".length);
      x.push(input.rating === rating ? 1 : 0);
    } else if (name === "hasDirector") {
      x.push(Boolean(input.director?.trim()) ? 1 : 0);
    } else {
      x.push(0);
    }
  }

  return x;
}

/** Convert a success score (0..100) into a SUCCESS/FAILURE label. */
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

export function formatBudget(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatScore(value: number): string {
  return `${Math.round(value)}%`;
}

/** Human-readable description per feature for the explanation factors. */
const factorDescriptions: Record<string, string> = {
  log_budget: "Production budget (log-scaled). Larger budgets enable wider release.",
  runtime: "Film runtime in minutes. Very long runtimes can limit daily showings.",
  releaseYear: "Release year. More recent titles reflect current market taste.",
  castCount: "Number of cast members. More known cast can help marketing.",
  hasDirector: "Whether a director is attached.",
};

/**
 * Predict the success of a movie.
 *
 * Returns a Prediction-compatible result: probability (0..1), success score
 * (0..100), SUCCESS/FAILURE label, confidence, and per-feature impact factors.
 */
export async function predictSuccess(
  input: MoviePredictionInput
): Promise<Prediction> {
  // Simulate model latency so loading states work during development.
  await new Promise((resolve) => setTimeout(resolve, 400));

  const x = buildFeatureVector(input);

  // logit = intercept + w . x
  let logit = intercept;
  for (let i = 0; i < x.length; i++) {
    logit += weights[featureNames[i]] * x[i];
  }

  const probability = sigmoid(logit);
  const successScore = Math.round(probability * 100);
  const label = probability >= threshold ? "SUCCESS" : "FAILURE";

  // Confidence: how far the probability is from the decision boundary, scaled.
  const confidence = Math.min(Math.max(0.5 + Math.abs(probability - 0.5), 0), 1);

  // Explainable factors: each feature's contribution to the logit.
  const contributions: { name: string; contribution: number; weight: number }[] =
    [];
  for (let i = 0; i < x.length; i++) {
    const contribution = weights[featureNames[i]] * x[i];
    if (Math.abs(contribution) < 1e-6) continue;
    contributions.push({
      name: featureNames[i],
      contribution,
      weight: Math.abs(contribution),
    });
  }

  const totalWeight =
    contributions.reduce((sum, c) => sum + c.weight, 0) || 1;
  contributions.sort((a, b) => b.weight - a.weight);

  const factors: PredictionFactor[] = contributions
    .slice(0, 6)
    .map((c) => {
      let displayName = c.name;
      if (c.name === "log_budget") displayName = "Budget";
      else if (c.name.startsWith("genre__")) displayName = `Genre: ${c.name.slice("genre__".length)}`;
      else if (c.name.startsWith("lang__")) displayName = `Language: ${c.name.slice("lang__".length)}`;
      else if (c.name.startsWith("country__")) displayName = `Country: ${c.name.slice("country__".length)}`;
      else if (c.name.startsWith("rating__")) displayName = `Rating: ${c.name.slice("rating__".length)}`;

      return {
        name: displayName,
        impact: c.contribution > 0 ? "positive" : "negative",
        weight: Number((c.weight / totalWeight).toFixed(2)),
        description:
          factorDescriptions[c.name] ||
          `${displayName} influence on the success score.`,
      };
    });

  return {
    id: `pred_${Date.now()}`,
    userId: "",
    movieId: "manual",
    modelId: `model_${MODEL_WEIGHTS.version}`,
    result: label,
    probability,
    successScore,
    confidence,
    factors,
    predictedAt: new Date().toISOString(),
    inputSnapshot: input,
  };
}

/** Metadata about the trained model (useful for the API / dashboard). */
export const MODEL_METADATA = {
  id: `model_${MODEL_WEIGHTS.version}`,
  name: "Movie Success Classifier",
  version: MODEL_WEIGHTS.version,
  algorithm: MODEL_WEIGHTS.algorithm,
  evaluationScore: MODEL_WEIGHTS.metrics.roc_auc,
  status: "ACTIVE" as const,
  metrics: MODEL_WEIGHTS.metrics,
  successRule: MODEL_WEIGHTS.successRule,
};

export { MODEL_WEIGHTS };
