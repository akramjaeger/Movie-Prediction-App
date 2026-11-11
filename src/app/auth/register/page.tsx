"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // The httpOnly cookie is set by the server. Redirect to dashboard.
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <span className="h-1 w-8 bg-red-900 rounded inline-block mb-3"></span>
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-black/60">Join CinePredict to save your movies & predictions</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-8 sm:p-10 shadow-sm">
        {error && (
          <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Full name</label>
            <input
              type="text"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-black/50">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-black hover:underline">
            Log in
          </Link>
        </p>
        <p className="mt-6 text-center text-[10px] text-black/40 uppercase tracking-widest">
          Demo: any email + password (6+ chars) works
        </p>
      </div>
    </div>
  );
}
