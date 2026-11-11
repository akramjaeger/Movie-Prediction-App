/**
 * GET /api/movies/:id
 * PATCH /api/movies/:id
 * DELETE /api/movies/:id
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import {
  findUserById,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "@/lib/db";

async function currentUser(): Promise<{ id: string; role: string } | null> {
  const token = await getAuthCookie();
  const payload = token ? decodeToken(token) : null;
  return payload ? { id: payload.sub, role: payload.role } : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const movie = getMovieById(id);
  if (!movie) {
    return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && movie.userId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: movie });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const movie = getMovieById(id);
  if (!movie) {
    return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && movie.userId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = updateMovie(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to update movie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const movie = getMovieById(id);
  if (!movie) {
    return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && movie.userId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const ok = deleteMovie(id);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Movie not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
