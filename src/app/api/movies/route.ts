/**
 * GET /api/movies  — list movies (with optional filters)
 * POST /api/movies — create a movie
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import { findUserById, createMovie, getMovies, getMoviesByUser } from "@/lib/db";
import type { MovieFilters } from "@/types";

async function currentUserId(): Promise<string | null> {
  const token = await getAuthCookie();
  const payload = token ? decodeToken(token) : null;
  return payload ? payload.sub : null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters: MovieFilters = {};
  if (searchParams.get("search")) filters.search = searchParams.get("search")!;
  if (searchParams.get("genre")) filters.genre = searchParams.get("genre")!;
  if (searchParams.get("minBudget")) filters.minBudget = Number(searchParams.get("minBudget"));
  if (searchParams.get("maxBudget")) filters.maxBudget = Number(searchParams.get("maxBudget"));

  const user = findUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const data = user.role === "ADMIN" ? getMovies(filters) : getMoviesByUser(userId);

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request): Promise<NextResponse> {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const required = ["title", "genre", "budget", "duration", "releaseDate", "language", "country"];
    for (const field of required) {
      if (body[field] == null || body[field] === "") {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.genre) || body.genre.length === 0) {
      return NextResponse.json(
        { success: false, error: "Select at least one genre" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.cast) || body.cast.length === 0) {
      return NextResponse.json(
        { success: false, error: "Add at least one cast member" },
        { status: 400 }
      );
    }

    const movie = createMovie(userId, {
      title: body.title,
      description: body.description ?? undefined,
      genre: body.genre,
      budget: Number(body.budget),
      duration: Number(body.duration),
      releaseDate: body.releaseDate,
      language: body.language,
      country: body.country,
      rating: body.rating ?? undefined,
      cast: body.cast,
      director: body.director ?? undefined,
      productionCompany: body.productionCompany ?? undefined,
      actorScore: body.actorScore != null ? Number(body.actorScore) : undefined,
    });

    return NextResponse.json({ success: true, data: movie }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to create movie" },
      { status: 500 }
    );
  }
}
