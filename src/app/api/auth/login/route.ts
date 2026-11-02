/**
 * POST /api/auth/login
 * Body: { email, password }
 */

import { NextResponse } from "next/server";
import { makeToken, setAuthCookie } from "@/lib/auth";
import { authenticateUser } from "@/lib/db";
import type { LoginInput } from "@/types";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as LoginInput;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { user, token } = authenticateUser(body);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err: any) {
    if (err.status === 401) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message ?? "Login failed" },
      { status: 500 }
    );
  }
}
