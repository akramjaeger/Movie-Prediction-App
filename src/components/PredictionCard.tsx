"use client";

import Link from "next/link";
import type { Prediction } from "@/types";

interface PredictionCardProps {
  result: Prediction;
}

function toVerdict(result: "SUCCESS" | "FAILURE", score?: number | null): string {
  if (result === "SUCCESS") {
    if (score != null && score >= 80) return "BLOCKBUSTER";
    return "HIT";
  }
  if (score != null && score >= 40) return "AVERAGE";
  return "FLOP";
}

function verdictColorClass(verdict: string): string {
  const classes: Record<string, string> = {
    BLOCKBUSTER: "border-emerald-900 text-emerald-900 bg-emerald-50",
    HIT: "border-blue-900 text-blue-900 bg-blue-50",
    AVERAGE: "border-amber-900 text-amber-900 bg-amber-50",
    FLOP: "border-rose-900 text-rose-900 bg-rose-50",
  };
  return classes[verdict] || classes.HIT;
}

function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    BLOCKBUSTER: "Blockbuster",
    HIT: "Hit",
    AVERAGE: "Average",
    FLOP: "Flop",
  };
  return labels[verdict] || "Hit";
}

export default function PredictionCard({ result }: PredictionCardProps) {
  const verdict = toVerdict(result.result, result.successScore);
  const verdictClass = verdictColorClass(verdict);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-bold text-black/60 hover:underline mb-2 inline-block">
            ← Back to dashboard
          </Link>
          <h2 className="text-3xl font-black tracking-tight">{result.inputSnapshot.title}</h2>
          <p className="text-black/60 text-sm">
            Predicted <time>{new Date(result.predictedAt).toLocaleString()}</time>
          </p>
        </div>
        <div className={`inline-flex items-center rounded-full border border-black px-3.5 py-1.5 text-xs font-bold tracking-tighter uppercase ${verdictClass}`}>
          {verdictLabel(verdict)}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-8 sm:p-10 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-10">
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Success score</div>
            <div className="text-3xl font-bold">{result.successScore ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Probability</div>
            <div className="text-3xl font-bold">
              {result.probability != null ? (result.probability * 100).toFixed(0) + "%" : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Confidence</div>
            <div className="text-3xl font-bold">
              {result.confidence != null ? (result.confidence * 100).toFixed(0) + "%" : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Model version</div>
            <div className="text-sm font-mono font-bold">placeholder-v0.1.0</div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Contributing factors</h3>
          <div className="space-y-3">
            {(result.factors ?? []).map((factor, i) => {
              const impactColor =
                factor.impact === "positive"
                  ? "text-green-900"
                  : factor.impact === "negative"
                    ? "text-red-900"
                    : "text-black/50";
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded border border-black/10 bg-black/2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${impactColor}`}>
                      {factor.impact}
                    </span>
                    <span className="text-sm font-medium">{factor.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold">
                    {(factor.weight * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 border-t border-black/10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Verdict summary</h3>
              <div className={`inline-flex items-center rounded-full border border-black px-4 py-2 text-sm font-bold tracking-tighter uppercase mb-3 ${verdictClass}`}>
                {verdictLabel(verdict)}
              </div>
              <p className="text-black/60 text-sm leading-relaxed">
                Based on the placeholder model. Replace with your QI model / FastAPI service for real predictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
