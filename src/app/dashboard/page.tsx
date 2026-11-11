"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardStatsCard from "@/components/dashboard/StatsCard";
import ResultsChart from "@/components/dashboard/ResultsChart";
import RecentPredictions from "@/components/dashboard/RecentPredictions";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalMovies: number;
    totalPredictions: number;
    successCount: number;
    failureCount: number;
    recentPredictions: Array<{
      id: string;
      inputSnapshot: { title: string };
      result: "SUCCESS" | "FAILURE";
      successScore?: number | null;
      predictedAt: string;
    }>;
    resultsDistribution: { label: "SUCCESS" | "FAILURE"; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        setStats(json.data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-black/40">Loading…</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-red-900/30 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-900">Failed to load dashboard</h2>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-black/60">Your activity at a glance</p>
        </div>
        <Link
          href="/predict"
          className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
        >
          New prediction
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardStatsCard
          title="Movies registered"
          value={stats.totalMovies}
          icon="🎬"
        />
        <DashboardStatsCard
          title="Predictions"
          value={stats.totalPredictions}
          icon="🔮"
        />
        <DashboardStatsCard
          title="Predicted success"
          value={stats.successCount}
          icon="✅"
          variant="green"
        />
        <DashboardStatsCard
          title="Predicted failure"
          value={stats.failureCount}
          icon="❌"
          variant="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6">
            Results distribution
          </h2>
          <ResultsChart distribution={stats.resultsDistribution} />
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
          <RecentPredictions predictions={stats.recentPredictions} />
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-black/10 bg-black/5 p-8 text-center">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">
          Quick actions
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/movies"
            className="rounded border border-black px-6 py-3 text-sm font-bold text-black hover:bg-black/5 transition"
          >
            Manage movies
          </Link>
          <Link
            href="/predict"
            className="rounded bg-black px-6 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
          >
            Run prediction
          </Link>
        </div>
      </div>
    </div>
  );
}
