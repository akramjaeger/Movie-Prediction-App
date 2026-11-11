"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import StepwisePredictionForm from "@/components/predict/StepwisePredictionForm";

interface Movie {
  id: string;
  title: string;
  genre: string[];
  budget: number;
  duration: number;
  releaseDate: string;
  director?: string | null;
  cast: string[];
  productionCompany?: string | null;
  language: string;
  country: string;
  rating?: string | null;
}

export default function PredictPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(
    searchParams.get("movieId") || null
  );
  const [manualMode, setManualMode] = useState(!selectedMovieId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/movies", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((json) => setMovies(json.data ?? []))
      .catch(() => setMovies([]));
  }, []);

  const handlePredictFromMovie = async (movieId: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Prediction failed");
        setLoading(false);
        return;
      }
      router.push(`/predict/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Predict success</h1>
          <p className="text-black/60">
            Choose an existing movie or enter details manually.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setManualMode(true)}
            className={`rounded border border-black px-4 py-2.5 text-sm font-bold ${manualMode ? "bg-black text-white" : "text-black hover:bg-black/5"} transition`}
          >
            Manual input
          </button>
          <button
            onClick={() => setManualMode(false)}
            className={`rounded border border-black px-4 py-2.5 text-sm font-bold ${!manualMode ? "bg-black text-white" : "text-black hover:bg-black/5"} transition`}
          >
            Existing movie
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {!manualMode && (
        <div className="mb-8 rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Select a movie</h2>
          {movies.length === 0 ? (
            <p className="text-black/50 text-sm">No movies yet. <Link href="/movies/new" className="font-bold hover:underline">Add one</Link> first.</p>
          ) : (
            <div className="space-y-2">
              {movies.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handlePredictFromMovie(m.id)}
                  className={`w-full text-left rounded border px-4 py-3 transition ${
                    selectedMovieId === m.id
                      ? "bg-black text-white border-black"
                      : "text-black hover:bg-black/5 border-black/50"
                  }`}
                >
                  <div className="font-bold">{m.title}</div>
                  <div className="text-xs text-black/50 mt-1">
                    {m.genre.join(", ")} • $ {m.budget.toLocaleString()} • {m.duration} min
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {manualMode && (
        <StepwisePredictionForm />
      )}
    </div>
  );
}
