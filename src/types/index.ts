/**
 * Movie Success Prediction — TypeScript interfaces
 * Aligned with the cahier des charges v1.0
 */

export type UserRole = "USER" | "ADMIN";

export type MovieStatus = "draft" | "submitted" | "predicted" | "error";

export type PredictionResultLabel = "SUCCESS" | "FAILURE";

export type Impact = "positive" | "negative" | "neutral";

/** Auth */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Pick<User, "id" | "name" | "email" | "role">;
  token: string;
}

/** Movies (CRUD) */
export interface Movie {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  genre: string[];
  budget: number; // USD
  duration: number; // minutes
  releaseDate: string; // ISO date
  language: string;
  country: string;
  rating?: string | null;
  cast: string[];
  director?: string | null;
  productionCompany?: string | null;
  actorScore?: number | null;
  actualRevenue?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovieInput {
  title: string;
  description?: string;
  genre: string[];
  budget: number;
  duration: number;
  releaseDate: string;
  language: string;
  country: string;
  rating?: string;
  cast: string[];
  director?: string;
  productionCompany?: string;
  actorScore?: number;
}

export interface MovieFilters {
  search?: string;
  genre?: string;
  minBudget?: number;
  maxBudget?: number;
}

/** Predictions */
export interface Prediction {
  id: string;
  userId: string;
  movieId: string;
  modelId: string;
  result: PredictionResultLabel;
  probability?: number | null; // 0 .. 1
  successScore?: number | null; // 0 .. 100
  confidence?: number | null;
  factors?: PredictionFactor[] | null;
  predictedAt: string;
  inputSnapshot: MoviePredictionInput;
  movie?: Movie;
}

export interface MoviePredictionInput {
  title: string;
  releaseYear: number;
  budget: number;
  runtime: number;
  genre: string[];
  director: string;
  cast: string[];
  productionCompany: string;
  language: string;
  country: string;
  rating: string;
}

export interface PredictionFactor {
  name: string;
  impact: Impact;
  weight: number;
  description?: string;
}

/** ML Model versioning */
export interface MLModel {
  id: string;
  name: string;
  version: string;
  algorithm: string;
  evaluationScore?: number | null;
  status: "TRAINING" | "ACTIVE" | "DEPRECATED";
  createdAt: string;
}

/** API response envelopes */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/** Dashboard stats */
export interface DashboardStats {
  totalMovies: number;
  totalPredictions: number;
  successCount: number;
  failureCount: number;
  recentPredictions: Prediction[];
  resultsDistribution: { label: PredictionResultLabel; count: number }[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}
