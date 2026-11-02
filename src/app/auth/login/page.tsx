"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Invalid email or password");
        setLoading(false);
        return;
      }

      const callbackUrl = new URL(window.location.search, window.location.href).searchParams.get("callbackUrl");
      router.push(callbackUrl || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <span className="h-1 w-8 bg-red-900 rounded inline-block mb-3"></span>
        <h1 className="text-3xl font-black tracking-tight">Log in</h1>
        <p className="mt-2 text-black/60">Sign in to your CinePredict account</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-8 sm:p-10 shadow-sm">
        {error && (
          <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Email address</label>
            <input
              type="email"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Password</label>
            <input
              type="password"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-black/50">
          Don't have an account?{" "}
          <Link href="/auth/register" className="font-bold text-black hover:underline">
            Create account
          </Link>
        </p>
        <p className="mt-6 text-center text-[10px] text-black/40 uppercase tracking-widest">
          Demo: any email + password (6+ chars) works
        </p>
      </div>
    </div>
  );
}
