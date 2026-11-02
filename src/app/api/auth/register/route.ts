/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */

import { NextResponse } from "next/server";
import { makeToken, setAuthCookie } from "@/lib/auth";
import { createUser } from "@/lib/db";
import type { RegisterInput } from "@/types";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RegisterInput;

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = createUser(body);
    const token = makeToken({ id: user.id, email: user.email, role: user.role });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err: any) {
    if (err.status === 409) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message ?? "Registration failed" },
      { status: 500 }
    );
  }
}
