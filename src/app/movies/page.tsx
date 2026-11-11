"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  createdAt: string;
  updatedAt: string;
}

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [error, setError] = useState("");

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (genreFilter) params.set("genre", genreFilter);

      const res = await fetch(`/api/movies?${params}`, { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("Failed to load movies");
      const json = await res.json();
      setMovies(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movies");
    } finally {
      setLoading(false);
    }
  }, [search, genreFilter]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this movie? Associated predictions will also be removed.")) return;
    try {
      const res = await fetch(`/api/movies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMovies((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const genres = [...new Set(movies.flatMap((m) => m.genre))].sort();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center text-black/40">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Movies</h1>
          <p className="text-black/60">Manage your movie library</p>
        </div>
        <Link
          href="/movies/new"
          className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
        >
          Add movie
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or director…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
          />
        </div>
        <div className="w-full lg:w-auto">
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
        {movies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-black/50 text-sm">No movies yet.</p>
            <Link
              href="/movies/new"
              className="mt-4 inline-block rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition"
            >
              Add your first movie
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm divide-y divide-black/10">
            <thead>
              <tr className="border-b border-black bg-black/5">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-black/50">Title</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-black/50">Genre</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-black/50">Budget</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-black/50">Released</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-black/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-black/2 transition group">
                  <td className="px-4 py-4">
                    <Link
                      href={`/movies/${movie.id}`}
                      className="font-bold hover:underline"
                    >
                      {movie.title}
                    </Link>
                    {movie.director && (
                      <p className="text-xs text-black/50 mt-0.5">{movie.director}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {movie.genre.map((g, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-full border border-black px-2 py-0.5 text-[10px] font-bold mr-1 mb-1"
                      >
                        {g}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-4 text-black/60">${movie.budget.toLocaleString()}</td>
                  <td className="px-4 py-4 text-black/60">
                    {new Date(movie.releaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/movies/${movie.id}`}
                      className="text-xs font-bold text-red-900 hover:underline mr-2"
                    >
                      View
                    </Link>
                    <Link
                      href={`/movies/${movie.id}/edit`}
                      className="text-xs font-bold text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(movie.id)}
                      className="text-xs font-bold underline underline-offset-4 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
