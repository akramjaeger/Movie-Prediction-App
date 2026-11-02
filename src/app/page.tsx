"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecentPredictions from "@/components/dashboard/RecentPredictions";
import type { Prediction } from "@/types";

export default function Home() {
  const [records, setRecords] = useState<Prediction[]>([]);

  useEffect(() => {
    fetch("/api/predictions")
      .then((res) => res.json())
      .then((data) => {
        setRecords((data as { data?: Prediction[] }).data ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
        </div>

        <div className="relative text-center max-w-2xl mx-auto">
          <span className="inline-block mb-4 px-3 py-0.5 rounded border border-black text-[10px] font-bold uppercase tracking-widest">
            Coming soon
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-balance leading-tight tracking-tight">
            Predict the next blockbuster
          </h1>
          <p className="mt-6 text-lg text-black/70 max-w-xl mx-auto leading-relaxed">
            Enter a movie's details and get an instant success score, verdict,
            and confidence — straight from your QI model.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/predict"
              className="rounded bg-black px-8 py-3.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
            >
              Run a prediction
            </Link>
            <Link
              href="/auth/signup"
              className="rounded border border-black px-8 py-3 text-sm font-bold text-black hover:bg-black/5 transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-black/10 bg-black/5">
        <h2 className="sr-only">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-black text-red-900 font-bold">
              1
            </div>
            <h3 className="text-lg font-bold mb-2">Fill in the details</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Budget, runtime, genre, cast, director, release year and more.
            </p>
          </div>
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-black text-red-900 font-bold">
              2
            </div>
            <h3 className="text-lg font-bold mb-2">Get a verdict</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Blockbuster, Hit, Average or Flop — with a success score and
              confidence.
            </p>
          </div>
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-black text-red-900 font-bold">
              3
            </div>
            <h3 className="text-lg font-bold mb-2">Track your history</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Every prediction is saved so you can revisit it anytime.
            </p>
          </div>
        </div>
      </section>

      {/* History preview */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Recent predictions</h2>
          <Link href="/predict" className="text-sm font-semibold text-red-900 hover:underline">
            View all →
          </Link>
        </div>
        <RecentPredictions predictions={records} />
      </section>
    </div>
  );
}
