/**
 * Train the self-contained TypeScript movie success model.
 *
 * Generates a reproducible synthetic historical dataset (seeded PRNG), builds
 * the feature matrix (standardized numerics + one-hot categoricals), trains a
 * logistic regression with gradient descent, and writes a TypeScript weights
 * module to src/lib/ml/model-weights.ts.
 *
 * The success target follows the cahier des charges rule:
 *   ROI = (Revenue - Budget) / Budget; success = 1 if ROI > 1.0
 * Revenues build the target only; they are never features at prediction time.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) - deterministic, no Math.random()
// ---------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;
const rng = mulberry32(SEED);
const rand = () => rng();
const randInt = (n) => Math.floor(rand() * n);
const pick = (arr) => arr[randInt(arr.length)];
const uniform = (a, b) => a + rand() * (b - a);

const N_SAMPLES = 3000;

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western",
];
const LANGUAGES = ["English", "French", "Spanish", "Mandarin", "Hindi", "Arabic", "Other"];
const COUNTRIES = ["USA", "France", "United Kingdom", "India", "Japan", "South Korea", "Other"];
const RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

// True genre effects on log-odds of success (documented, interpretable).
const GENRE_EFFECT = {
  Action: 0.30, Adventure: 0.25, Animation: 0.20, Comedy: 0.00, Crime: -0.05,
  Documentary: -0.50, Drama: -0.10, Fantasy: 0.15, Horror: 0.10, Mystery: 0.00,
  Romance: -0.05, "Sci-Fi": 0.20, Thriller: 0.05, Western: -0.15,
};
const LANGUAGE_EFFECT = { English: 0.30, French: 0.05, Spanish: 0.0, Mandarin: 0.05,
  Hindi: -0.05, Arabic: -0.10, Other: -0.15 };
const COUNTRY_EFFECT = { USA: 0.30, France: 0.0, "United Kingdom": 0.05, India: -0.10,
  Japan: 0.0, "South Korea": 0.05, Other: -0.10 };

// ---------------------------------------------------------------------------
// Dataset generation
// ---------------------------------------------------------------------------
function generate() {
  const rows = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const budgetTier = randInt(4);
    let budget;
    if (budgetTier === 0) budget = uniform(2e6, 15e6);
    else if (budgetTier === 1) budget = uniform(15e6, 50e6);
    else if (budgetTier === 2) budget = uniform(50e6, 120e6);
    else budget = uniform(120e6, 250e6);

    const nGenres = rand() < 0.35 ? 2 : 1;
    const genres = [];
    while (genres.length < nGenres) {
      const g = pick(GENRES);
      if (!genres.includes(g)) genres.push(g);
    }

    const runtime = uniform(75, 180);
    const releaseYear = randInt(2010, 2026);
    const language = pick(LANGUAGES);
    const country = pick(COUNTRIES);
    const rating = pick(RATINGS);
    const actorScore = uniform(20, 95);
    const castCount = randInt(1, 12);
    const hasDirector = rand() < 0.9;

    // Simulated revenue (target construction only).
    const budgetEffect = Math.pow(budget / 5e6, 0.7);
    const riskPenalty = 1 - Math.min(budget / 2e8, 0.35);
    const runtimeFactor = Math.max(1 - Math.abs(runtime - 110) / 400, 0.7);
    const primaryGenre = genres[0];
    const revenue =
      budget *
      budgetEffect *
      (GENRE_EFFECT[primaryGenre] !== undefined ? 1 + GENRE_EFFECT[primaryGenre] : 1) *
      (1 + (LANGUAGE_EFFECT[language] || 0)) *
      (1 + (COUNTRY_EFFECT[country] || 0)) *
      runtimeFactor *
      (1 + (actorScore - 50) / 200) *
      riskPenalty *
      uniform(0.5, 1.8);

    const roi = (revenue - budget) / budget;
    const success = roi > 1.0 ? 1 : 0;

    rows.push({
      title: `Movie ${i}`,
      budget,
      runtime,
      releaseYear,
      genre: genres,
      language,
      country,
      rating,
      actorScore,
      castCount,
      hasDirector: hasDirector ? 1 : 0,
      revenue,
      roi,
      success,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Feature engineering
// ---------------------------------------------------------------------------
function featureNames() {
  const names = ["budget", "runtime", "releaseYear", "castCount", "hasDirector"];
  for (const g of GENRES) names.push(`genre__${g}`);
  for (const l of LANGUAGES) names.push(`lang__${l}`);
  for (const c of COUNTRIES) names.push(`country__${c}`);
  for (const r of RATINGS) names.push(`rating__${r}`);
  return names;
}

const FEATURE_NAMES = featureNames();

function standardize(values) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1;
  return { mean, std };
}

function buildMatrix(rows) {
  const numericCols = ["budget", "runtime", "releaseYear", "castCount"];
  const stats = {};
  for (const col of numericCols) {
    stats[col] = standardize(rows.map((r) => r[col]));
  }

  const X = [];
  const y = [];
  for (const r of rows) {
    const f = [];
    f.push((r.budget - stats.budget.mean) / stats.budget.std);
    f.push((r.runtime - stats.runtime.mean) / stats.runtime.std);
    f.push((r.releaseYear - stats.releaseYear.mean) / stats.releaseYear.std);
    f.push((r.castCount - stats.castCount.mean) / stats.castCount.std);
    f.push(r.hasDirector);
    for (const g of GENRES) f.push(r.genre.includes(g) ? 1 : 0);
    for (const l of LANGUAGES) f.push(r.language === l ? 1 : 0);
    for (const c of COUNTRIES) f.push(r.country === c ? 1 : 0);
    for (const rt of RATINGS) f.push(r.rating === rt ? 1 : 0);
    X.push(f);
    y.push(r.success);
  }
  return { X, y, stats };
}

// ---------------------------------------------------------------------------
// Logistic regression (gradient descent)
// ---------------------------------------------------------------------------
function sigmoid(z) {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function train(X, y, lr = 0.1, iters = 2000, lambda = 0.0001) {
  const n = X.length;
  const d = X[0].length;
  const w = new Array(d).fill(0);
  let b = 0;

  for (let it = 0; it < iters; it++) {
    let dw = new Array(d).fill(0);
    let db = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let j = 0; j < d; j++) z += w[j] * X[i][j];
      const p = sigmoid(z);
      const err = p - y[i];
      db += err;
      for (let j = 0; j < d; j++) dw[j] += err * X[i][j];
    }
    for (let j = 0; j < d; j++) {
      w[j] -= lr * ((dw[j] / n) + lambda * w[j]);
    }
    b -= lr * (db / n);
  }
  return { w, b };
}

function predictRow(Xrow, w, b) {
  let z = b;
  for (let j = 0; j < w.length; j++) z += w[j] * Xrow[j];
  return sigmoid(z);
}

function metrics(X, y, w, b, threshold = 0.5) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  let correct = 0;
  const probs = [];
  for (let i = 0; i < y.length; i++) {
    const p = predictRow(X[i], w, b);
    probs.push(p);
    const pred = p >= threshold ? 1 : 0;
    if (pred === 1 && y[i] === 1) tp++;
    else if (pred === 1 && y[i] === 0) fp++;
    else if (pred === 0 && y[i] === 0) tn++;
    else fn++;
    if (pred === y[i]) correct++;
  }
  const acc = correct / y.length;
  const prec = tp / (tp + fp) || 0;
  const rec = tp / (tp + fn) || 0;
  const f1 = (2 * prec * rec) / (prec + rec) || 0;
  // ROC-AUC via Mann-Whitney U
  let auc = 0;
  let pairs = 0;
  for (let i = 0; i < y.length; i++) {
    for (let j = 0; j < y.length; j++) {
      if (y[i] === 1 && y[j] === 0) {
        pairs++;
        if (probs[i] > probs[j]) auc += 1;
        else if (probs[i] === probs[j]) auc += 0.5;
      }
    }
  }
  auc = pairs ? auc / pairs : 0.5;
  return { accuracy: acc, precision: prec, recall: rec, f1, roc_auc: auc };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const rows = generate();
const { X, y, stats } = buildMatrix(rows);

// 80/20 stratified split
const pos = rows.map((_, i) => i).filter((i) => y[i] === 1);
const neg = rows.map((_, i) => i).filter((i) => y[i] === 0);
const shuffle = (arr) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const posSh = shuffle(pos);
const negSh = shuffle(neg);
const nPosTest = Math.floor(posSh.length * 0.2);
const nNegTest = Math.floor(negSh.length * 0.2);
const testIdx = new Set([...posSh.slice(0, nPosTest), ...negSh.slice(0, nNegTest)]);

const X_train = [], y_train = [], X_test = [], y_test = [];
for (let i = 0; i < X.length; i++) {
  if (testIdx.has(i)) { X_test.push(X[i]); y_test.push(y[i]); }
  else { X_train.push(X[i]); y_train.push(y[i]); }
}

console.log(`Samples: ${X.length} (train ${X_train.length}, test ${X_test.length})`);
console.log(`Train success rate: ${(y_train.reduce((a,b)=>a+b,0)/y_train.length*100).toFixed(1)}%`);

const { w, b } = train(X_train, y_train);
const mTrain = metrics(X_train, y_train, w, b);
const mTest = metrics(X_test, y_test, w, b);
console.log("Train:", JSON.stringify(mTrain));
console.log("Test :", JSON.stringify(mTest));

// ---------------------------------------------------------------------------
// Emit TypeScript weights module
// ---------------------------------------------------------------------------
const featureStats = {};
for (const col of ["budget", "runtime", "releaseYear", "castCount"]) {
  featureStats[col] = stats[col];
}

const ts = `// Auto-generated by scripts/train-ts-model.js. Do not edit by hand.
// Self-contained logistic regression model for movie success prediction.
// Trained on a reproducible synthetic dataset (seed ${SEED}, ${N_SAMPLES} samples).
// Success rule (cahier des charges): ROI = (Revenue - Budget) / Budget;
// success = 1 if ROI > 1.0 (revenue > 2 x budget). Revenues build the target
// only and are never features at prediction time (no data leakage).

export interface ModelWeights {
  version: string;
  algorithm: string;
  threshold: number;
  intercept: number;
  weights: Record<string, number>;
  featureNames: string[];
  numericStats: Record<string, { mean: number; std: number }>;
  categories: {
    genre: string[];
    language: string[];
    country: string[];
    rating: string[];
  };
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    trainSize: number;
    testSize: number;
  };
  successRule: string;
}

export const MODEL_WEIGHTS: ModelWeights = {
  version: "v1.0.0",
  algorithm: "Logistic Regression",
  threshold: 0.5,
  intercept: ${b},
  weights: ${JSON.stringify(
    Object.fromEntries(FEATURE_NAMES.map((name, i) => [name, w[i]])),
    null,
    2
  )},
  featureNames: ${JSON.stringify(FEATURE_NAMES)},
  numericStats: ${JSON.stringify(featureStats)},
  categories: {
    genre: ${JSON.stringify(GENRES)},
    language: ${JSON.stringify(LANGUAGES)},
    country: ${JSON.stringify(COUNTRIES)},
    rating: ${JSON.stringify(RATINGS)},
  },
  metrics: {
    accuracy: ${mTest.accuracy},
    precision: ${mTest.precision},
    recall: ${mTest.recall},
    f1: ${mTest.f1},
    roc_auc: ${mTest.roc_auc},
    trainSize: ${X_train.length},
    testSize: ${X_test.length},
  },
  successRule: "ROI > 1.0 (revenue > 2 x budget); target built from revenues at training time only",
};

`;

const outDir = path.join(__dirname, "..", "src", "lib", "ml");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "model-weights.ts"), ts);
console.log(`\nWrote ${path.join(outDir, "model-weights.ts")}`);
