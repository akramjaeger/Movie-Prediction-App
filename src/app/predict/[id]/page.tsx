"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PredictionCard from "@/components/PredictionCard";

interface Prediction {
  id: string;
  title: string;
  result: "SUCCESS" | "FAILURE";
  probability?: number | null;
  successScore?: number | null;
  confidence?: number | null;
  factors?: Array<{ name: string; impact: string; weight: number; description?: string }> | null;
  predictedAt: string;
  inputSnapshot: { title: string };
}

export default function PredictionResultPage() {
  const router = useRouter();
  const params = useParams();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = (params as { id: string }).id;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/predictions/${id}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Prediction not found");
        return res.json();
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error ?? "Prediction not found");
        setPrediction(json.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Prediction not found");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this prediction?")) return;
    await fetch(`/api/predictions/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (loading) {
    return null; // loading.tsx handles the skeleton
  }

  if (!prediction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-red-900/30 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-900">{error || "Prediction not found"}</h2>
          <Link href="/dashboard" className="mt-4 inline-block rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <button
          onClick={handleDelete}
          className="text-sm font-bold underline underline-offset-4 hover:text-red-900"
        >
          Delete
        </button>
      </div>
      <PredictionCard result={prediction as any} />
    </div>
  );
}
