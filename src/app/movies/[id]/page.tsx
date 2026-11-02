"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface Movie {
  id: string;
  title: string;
  description?: string | null;
  genre: string[];
  budget: number;
  duration: number;
  releaseDate: string;
  language: string;
  country: string;
  rating?: string | null;
  cast: string[];
  director?: string | null;
  productionCompany?: string | null;
  actorScore?: number | null;
  createdAt: string;
}

interface Prediction {
  id: string;
  result: "SUCCESS" | "FAILURE";
  successScore?: number | null;
  predictedAt: string;
}

export default function MovieDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = (params as { id: string }).id;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/movies/${id}`, { cache: "no-store", credentials: "include" }).then((r) => r.json()),
      fetch(`/api/predictions`, { cache: "no-store", credentials: "include" }).then((r) => r.json()),
    ])
      .then(([movieRes, predRes]) => {
        if (!movieRes.success) throw new Error(movieRes.error ?? "Movie not found");
        setMovie(movieRes.data);
        const allPreds = predRes.data ?? [];
        setPredictions(allPreds.filter((p: any) => p.movieId === id));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load movie");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this movie? Associated predictions will also be removed.")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    router.push("/movies");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-black/40">
        Loading…
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-red-900/30 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-900">{error || "Movie not found"}</h2>
          <Link href="/movies" className="mt-4 inline-block rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition">
            Back to movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/movies"
          className="text-sm font-bold text-black/60 hover:underline"
        >
          ← Back to movies
        </Link>
        <button
          onClick={handleDelete}
          className="rounded border border-red-900 px-4 py-2.5 text-sm font-bold text-red-900 hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight mb-1">{movie.title}</h1>
        {movie.director && (
          <p className="text-black/60 text-sm mb-4">Directed by {movie.director}</p>
        )}

        {movie.description && (
          <div className="mb-6">
            <p className="text-black/70 leading-relaxed">{movie.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Budget</div>
            <div className="font-bold">$ {movie.budget.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Duration</div>
            <div className="font-bold">{movie.duration} min</div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Release date</div>
            <div className="font-bold">{new Date(movie.releaseDate).toLocaleDateString()}</div>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Language / Country</div>
            <div className="font-bold">{movie.language} / {movie.country}</div>
          </div>
          {movie.rating && (
            <div className="rounded-lg border border-black/10 p-4 bg-black/2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Rating</div>
              <div className="font-bold">{movie.rating}</div>
            </div>
          )}
          {movie.actorScore != null && (
            <div className="rounded-lg border border-black/10 p-4 bg-black/2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Actor score</div>
              <div className="font-bold">{movie.actorScore}</div>
            </div>
          )}
          {movie.productionCompany && (
            <div className="rounded-lg border border-black/10 p-4 bg-black/2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Production company</div>
              <div className="font-bold">{movie.productionCompany}</div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-bold tracking-tight">Genres</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {movie.genre.map((g, i) => (
              <span key={i} className="rounded-full border border-black px-3 py-1 text-[10px] font-bold">
                {g}
              </span>
            ))}
          </div>
        </div>

        {movie.cast.length > 0 && (
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-bold tracking-tight">Cast</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.cast.map((name, i) => (
                <span key={i} className="rounded border border-black px-2 py-1 text-[10px] font-medium">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {predictions.length > 0 && (
          <div className="mt-10 pt-8 border-t border-black/10">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4">
              Predictions for this movie
            </h2>
            <div className="space-y-3">
              {predictions.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded border border-black/10 bg-black/2">
                  <div>
                    <Link
                      href={`/predict/${p.id}`}
                      className="font-bold hover:underline"
                    >
                      Prediction #{p.id.slice(-6)}
                    </Link>
                    <div className="text-xs text-black/50">
                      {new Date(p.predictedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-[10px] font-bold tracking-tighter uppercase ${
                      p.result === "SUCCESS"
                        ? "border-blue-900 text-blue-900 bg-blue-50"
                        : "border-rose-900 text-rose-900 bg-rose-50"
                    }`}>
                      {p.result === "SUCCESS" ? "Success" : "Failure"}
                    </span>
                    {p.successScore != null && (
                      <span className="text-xs font-mono font-bold">{p.successScore}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-black/10">
          <Link
            href={`/predict?movieId=${movie.id}`}
            className="inline-flex items-center rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
          >
            🔮 Predict success for this movie
          </Link>
        </div>
      </div>
    </div>
  );
}
