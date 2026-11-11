/**
 * Authentication helpers
 * Simple JWT-in-cookie approach. Replace with Auth.js / NextAuth when you
 * connect a real identity provider.
 */

import { cookies } from "next/headers";
import { User } from "@/types";

const TOKEN_NAME = "cp_token";

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_NAME)?.value;
}

export function makeToken(user: Pick<User, "id" | "email" | "role">): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeToken(token: string): {
  sub: string;
  email: string;
  role: string;
  iat: number;
} | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return null;
  }
}
