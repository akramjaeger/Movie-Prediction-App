"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCurrentUser, logout } from "@/lib/session";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((u) => {
        if (mounted && u) {
          setUser(u);
          setFormName(u.name);
          setFormEmail(u.email);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaveLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formName || undefined,
          email: formEmail || undefined,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to update profile");
        setSaveLoading(false);
        return;
      }

      if (json.data?.user) {
        setUser(json.data.user);
        setFormName(json.data.user.name);
        setFormEmail(json.data.user.email);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      setError("");
      setSaveLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-black/40">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-xl border border-red-900/30 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-900">Not authenticated</h2>
          <Link
            href="/auth/login"
            className="mt-4 inline-block rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Profile</h1>
        <Link
          href="/dashboard"
          className="text-sm font-bold text-black/60 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-8 sm:p-10 shadow-sm">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-black text-2xl font-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
          <p className="text-black/60 text-sm">{user.email}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-black/40">
            Role: {user.role}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Full name</label>
            <input
              type="text"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Email address</label>
            <input
              type="email"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
            />
          </div>

          <hr className="border-black/10 my-6" />

          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-black/60">Change password</h3>

          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Current password</label>
            <input
              type="password"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">New password</label>
            <input
              type="password"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Confirm new password</label>
            <input
              type="password"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
          >
            {saveLoading ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-black/10">
          <button
            onClick={handleLogout}
            className="w-full rounded border border-red-900 px-5 py-3 text-sm font-bold text-red-900 hover:bg-red-50 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
