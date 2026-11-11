"use client";

import Link from "next/link";
import { fetchCurrentUser, logout, setCachedUser } from "@/lib/session";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((u) => {
      if (mounted) {
        setUser(u ? { name: u.name, email: u.email, role: u.role } : null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setLoading(false);
    router.push("/auth/login");
  };

  return (
    <nav className="border-b border-black/10 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="h-1 w-6 bg-red-900 rounded"></span>
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-black text-black tracking-tighter italic">CINE</span>
              <span className="text-2xl font-black text-red-900 tracking-tighter italic">PREDICT</span>
            </Link>
          </div>

          {loading ? (
            <div className="hidden md:flex items-center gap-4 text-sm font-semibold text-black">
              <div className="h-5 w-16 rounded bg-black/10 animate-pulse" />
              <div className="h-5 w-24 rounded bg-black/10 animate-pulse" />
            </div>
          ) : !user ? (
            <div className="hidden md:flex items-center gap-4 text-sm font-semibold text-black">
              <Link href="/" className="px-3 py-2 rounded-md transition text-black/80 hover:text-black hover:bg-black/5">
                Home
              </Link>
              <Link href="/auth/login" className="text-black/80 hover:text-black hover:underline">
                Log in
              </Link>
              <Link href="/auth/register" className="text-black/80 hover:text-black hover:underline">
                Sign up
              </Link>
              <Link
                href="/predict"
                className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition"
              >
                New prediction
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm font-semibold text-black">
              <Link href="/dashboard" className="px-3 py-2 rounded-md transition text-black/80 hover:text-black hover:bg-black/5">
                Dashboard
              </Link>
              <Link href="/movies" className="px-3 py-2 rounded-md transition text-black/80 hover:text-black hover:bg-black/5">
                Movies
              </Link>
              <Link href="/predict" className="px-3 py-2 rounded-md transition text-black/80 hover:text-black hover:bg-black/5">
                Predict
              </Link>
              <Link
                href="/profile"
                className="px-3 py-2 rounded-md transition text-black/80 hover:text-black hover:bg-black/5"
              >
                {user.name}
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg">
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
