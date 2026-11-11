/**
 * POST /api/auth/logout
 */

import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
