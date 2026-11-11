/**
 * GET /api/predictions/:id — get a single prediction
 * DELETE /api/predictions/:id — delete a prediction entry
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import { getPredictionById, deletePrediction } from "@/lib/db";

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
  const prediction = getPredictionById(id);
  if (!prediction) {
    return NextResponse.json({ success: false, error: "Prediction not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && prediction.userId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: prediction });
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
  const prediction = getPredictionById(id);
  if (!prediction) {
    return NextResponse.json({ success: false, error: "Prediction not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && prediction.userId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const ok = deletePrediction(id);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Prediction not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
