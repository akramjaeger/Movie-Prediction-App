/**
 * GET /api/predictions — list predictions (optionally ?userId= for admins)
 * POST /api/predictions — run a prediction
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import {
  findUserById,
  createPrediction,
  getPredictions,
  getActiveMLModel,
  getMovieById,
} from "@/lib/db";
import { predictSuccess } from "@/lib/prediction";
import type { MoviePredictionInput } from "@/types";

async function currentUser(): Promise<{ id: string; role: string } | null> {
  const token = await getAuthCookie();
  const payload = token ? decodeToken(token) : null;
  return payload ? { id: payload.sub, role: payload.role } : null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  const userId = user.role === "ADMIN" && targetUserId ? targetUserId : user.id;

  const data = getPredictions(userId);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    let movieId: string | null = body.movieId ?? null;
    let input: MoviePredictionInput;

    if (movieId) {
      const movie = getMovieById(movieId);
      if (!movie) {
        return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
      }
      if (user.role !== "ADMIN" && movie.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      input = {
        title: movie.title,
        releaseYear: new Date(movie.releaseDate).getFullYear(),
        budget: movie.budget,
        runtime: movie.duration,
        genre: movie.genre,
        director: movie.director ?? "",
        cast: movie.cast,
        productionCompany: movie.productionCompany ?? "",
        language: movie.language,
        country: movie.country,
        rating: movie.rating ?? "",
      };
    } else {
      input = {
        title: body.title,
        releaseYear: Number(body.releaseYear),
        budget: Number(body.budget),
        runtime: Number(body.runtime),
        genre: body.genre,
        director: body.director,
        cast: body.cast,
        productionCompany: body.productionCompany,
        language: body.language,
        country: body.country,
        rating: body.rating,
      };
    }

    const model = getActiveMLModel();
    if (!model) {
      return NextResponse.json(
        { success: false, error: "No active ML model available" },
        { status: 503 }
      );
    }

    const result = await predictSuccess({
      title: input.title,
      releaseYear: input.releaseYear,
      budget: input.budget,
      runtime: input.runtime,
      genre: input.genre,
      director: input.director,
      cast: input.cast,
      productionCompany: input.productionCompany,
      language: input.language,
      country: input.country,
      rating: input.rating,
    });

    const prediction = createPrediction(user.id, movieId || "manual", model.id, {
      result:
        result.result === "SUCCESS" || result.result === "FAILURE"
          ? result.result
          : scoreToLabel(result.successScore ?? 0),
      probability: result.probability ?? null,
      successScore: result.successScore ?? null,
      confidence: result.confidence ?? null,
      factors: result.factors ?? null,
      inputSnapshot: input,
    });

    return NextResponse.json({ success: true, data: prediction }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Prediction failed" },
      { status: 500 }
    );
  }
}

function scoreToLabel(score: number): "SUCCESS" | "FAILURE" {
  return score >= 60 ? "SUCCESS" : "FAILURE";
}
