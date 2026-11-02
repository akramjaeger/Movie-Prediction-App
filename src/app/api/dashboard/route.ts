/**
 * GET /api/dashboard — statistics for the current user (or global if admin + ?global=1)
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import { getDashboardStats, getMovies } from "@/lib/db";

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
  const global = searchParams.get("global") === "1";

  const userId = user.role === "ADMIN" && global ? undefined : user.id;
  const stats = getDashboardStats(userId);

  let totalMoviesAll = 0;
  if (user.role === "ADMIN" && global) {
    totalMoviesAll = getMovies().length;
  }

  return NextResponse.json({
    success: true,
    data: { ...stats, totalMoviesAll },
  });
}
