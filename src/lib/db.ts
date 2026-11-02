/**
 * In-memory database adapter
 *
 * Mimics the Prisma schema from `prisma/schema.prisma` so the app runs
 * without a live PostgreSQL instance. When you connect a real DB, replace
 * these functions with Prisma calls (prisma.user, prisma.movie, etc.).
 *
 * Entities: User, Movie, Prediction, MLModel
 */

import type {
  User,
  RegisterInput,
  LoginInput,
  Movie,
  MovieInput,
  MovieFilters,
  Prediction,
  MoviePredictionInput,
  MLModel,
  DashboardStats,
  PredictionResultLabel,
  UserRole,
  PredictionFactor,
} from "@/types";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const users: User[] = [
  {
    id: "user_000000000001",
    name: "Admin User",
    email: "admin@cinepredict.local",
    passwordHash: "$2b$10$placeholder.admin.hash",
    role: "ADMIN",
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  },
];

const mlModels: MLModel[] = [
  {
    id: "model_000000000001",
    name: "Movie Success Classifier",
    version: "v1.0.0",
    algorithm: "Random Forest",
    evaluationScore: 0.84,
    status: "ACTIVE",
    createdAt: new Date("2026-01-15T00:00:00Z").toISOString(),
  },
];

const movies: Movie[] = [];
const predictions: Prediction[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

function verifyPassword(plain: string, hash: string): boolean {
  // Placeholder: accept any non-empty password for demo purposes.
  // Replace with bcrypt.compare when you connect a real auth layer.
  return plain.length > 0;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function createUser(input: RegisterInput): User {
  if (findUserByEmail(input.email)) {
    const err: any = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const user: User = {
    id: uid("user"),
    name: input.name,
    email: input.email,
    passwordHash: `placeholder:${input.password}`,
    role: users.length === 0 ? "ADMIN" : "USER",
    createdAt: nowISO(),
  };
  users.push(user);
  return user;
}

export function authenticateUser(input: LoginInput): { user: User; token: string } {
  const user = findUserByEmail(input.email);
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    const err: any = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  return {
    user,
    token: Buffer.from(
      JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() })
    ).toString("base64"),
  };
}

export function getAllUsers(): Omit<User, "passwordHash">[] {
  return users.map(({ passwordHash, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// Movies
// ---------------------------------------------------------------------------

export function createMovie(userId: string, input: MovieInput): Movie {
  const movie: Movie = {
    id: uid("movie"),
    userId,
    title: input.title,
    description: input.description ?? null,
    genre: input.genre,
    budget: input.budget,
    duration: input.duration,
    releaseDate: input.releaseDate,
    language: input.language,
    country: input.country,
    rating: input.rating ?? null,
    cast: input.cast,
    director: input.director ?? null,
    productionCompany: input.productionCompany ?? null,
    actorScore: input.actorScore ?? null,
    actualRevenue: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  movies.push(movie);
  return movie;
}

export function getMovies(filters: MovieFilters = {}): Movie[] {
  let result = [...movies];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (m) => m.title.toLowerCase().includes(q) || (m.director ?? "").toLowerCase().includes(q)
    );
  }

  if (filters.genre) {
    result = result.filter((m) => m.genre.includes(filters.genre!));
  }

  if (filters.minBudget != null) {
    result = result.filter((m) => m.budget >= filters.minBudget!);
  }

  if (filters.maxBudget != null) {
    result = result.filter((m) => m.budget <= filters.maxBudget!);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMovieById(id: string): Movie | undefined {
  return movies.find((m) => m.id === id);
}

export function updateMovie(id: string, input: Partial<MovieInput>): Movie | null {
  const movie = movies.find((m) => m.id === id);
  if (!movie) return null;

  Object.assign(movie, input, { updatedAt: nowISO() });
  return movie;
}

export function deleteMovie(id: string): boolean {
  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) return false;
  for (let i = predictions.length - 1; i >= 0; i--) {
    if (predictions[i].movieId === id) predictions.splice(i, 1);
  }
  movies.splice(index, 1);
  return true;
}

export function getMoviesByUser(userId: string): Movie[] {
  return movies
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

export function createPrediction(
  userId: string,
  movieId: string,
  modelId: string,
  data: {
    result: PredictionResultLabel;
    probability?: number | null;
    successScore?: number | null;
    confidence?: number | null;
    factors?: PredictionFactor[] | null;
    inputSnapshot: MoviePredictionInput;
  }
): Prediction {
  const prediction: Prediction = {
    id: uid("pred"),
    userId,
    movieId,
    modelId,
    result: data.result,
    probability: data.probability ?? null,
    successScore: data.successScore ?? null,
    confidence: data.confidence ?? null,
    factors: data.factors ?? null,
    predictedAt: nowISO(),
    inputSnapshot: data.inputSnapshot,
  };
  predictions.push(prediction);
  return prediction;
}

export function getPredictions(userId?: string): Prediction[] {
  let result = predictions.filter((p) => !userId || p.userId === userId);
  return result.sort(
    (a, b) => new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime()
  );
}

export function getPredictionById(id: string): Prediction | undefined {
  return predictions.find((p) => p.id === id);
}

export function deletePrediction(id: string): boolean {
  const index = predictions.findIndex((p) => p.id === id);
  if (index === -1) return false;
  predictions.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export function getDashboardStats(userId?: string): DashboardStats {
  const userPredictions = getPredictions(userId);
  const userMovies = userId ? getMoviesByUser(userId) : getMovies();

  const successCount = userPredictions.filter((p) => p.result === "SUCCESS").length;
  const failureCount = userPredictions.filter((p) => p.result === "FAILURE").length;

  const distribution: { label: PredictionResultLabel; count: number }[] = [
    { label: "SUCCESS", count: successCount },
    { label: "FAILURE", count: failureCount },
  ];

  return {
    totalMovies: userMovies.length,
    totalPredictions: userPredictions.length,
    successCount,
    failureCount,
    recentPredictions: userPredictions.slice(0, 5),
    resultsDistribution: distribution,
  };
}

// ---------------------------------------------------------------------------
// ML Models
// ---------------------------------------------------------------------------

export function getMLModels(): MLModel[] {
  return mlModels;
}

export function getActiveMLModel(): MLModel | undefined {
  return mlModels.find((m) => m.status === "ACTIVE");
}

// ---------------------------------------------------------------------------
// Expose raw arrays for advanced queries / reset
// ---------------------------------------------------------------------------

export { users, movies, predictions, mlModels };
