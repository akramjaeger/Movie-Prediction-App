/**
 * GET /api/auth/me
 * Returns the current user from the auth cookie.
 */

import { NextResponse } from "next/server";
import { getAuthCookie, decodeToken } from "@/lib/auth";
import { findUserById } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const token = await getAuthCookie();
  const payload = token ? decodeToken(token) : null;
  const user = payload ? findUserById(payload.sub) : null;

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
  });
}
