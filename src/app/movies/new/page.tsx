"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western",
];

const RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

export default function NewMoviePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: [] as string[],
    budget: "",
    duration: "",
    releaseDate: "",
    language: "English",
    country: "USA",
    rating: "PG-13",
    cast: [] as string[],
    director: "",
    productionCompany: "",
    actorScore: "",
  });

  const [castInput, setCastInput] = useState("");

  const handleChange = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenreToggle = (g: string) => {
    setForm((prev) => {
      const next = prev.genre.includes(g)
        ? prev.genre.filter((x) => x !== g)
        : [...prev.genre, g];
      return { ...prev, genre: next };
    });
  };

  const handleCastAdd = () => {
    const v = castInput.trim();
    if (!v) return;
    if (form.cast.includes(v)) return;
    setForm((prev) => ({ ...prev, cast: [...prev.cast, v] }));
    setCastInput("");
  };

  const handleCastRemove = (name: string) => {
    setForm((prev) => ({ ...prev, cast: prev.cast.filter((c) => c !== name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          genre: form.genre,
          budget: Number(form.budget) || 0,
          duration: Number(form.duration) || 0,
          releaseDate: form.releaseDate,
          language: form.language,
          country: form.country,
          rating: form.rating || undefined,
          cast: form.cast,
          director: form.director || undefined,
          productionCompany: form.productionCompany || undefined,
          actorScore: form.actorScore ? Number(form.actorScore) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to create movie");
        setLoading(false);
        return;
      }

      router.push(`/movies/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create movie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Add movie</h1>
        <p className="text-black/60">Enter the movie details</p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Title</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="e.g. The Midnight Run"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2 field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Description</label>
          <textarea
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="A brief synopsis…"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Release date</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            type="date"
            value={form.releaseDate}
            onChange={(e) => handleChange("releaseDate", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Budget (USD)</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            type="number"
            placeholder="e.g. 25000000"
            value={form.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Duration (minutes)</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            type="number"
            value={form.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2 field">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-bold tracking-tight">Genres</span>
            <span className="text-xs text-black/50">(select at least one)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenreToggle(g)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.genre.includes(g)
                    ? "bg-red-900 border-red-900 text-white"
                    : "border-black text-black hover:bg-black/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {form.genre.length === 0 && (
            <p className="text-xs text-red-900 mt-1">Select at least one genre</p>
          )}
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Director</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="e.g. Denis Villeneuve"
            value={form.director}
            onChange={(e) => handleChange("director", e.target.value)}
          />
        </div>

        <div className="md:col-span-2 field">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-bold tracking-tight">Cast members</span>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="Add cast member…"
              value={castInput}
              onChange={(e) => setCastInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCastAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleCastAdd}
              className="rounded border border-black px-4 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {form.cast.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCastRemove(name)}
                className="rounded border border-black px-2 py-1 text-xs font-medium text-black hover:bg-black/5"
              >
                {name} ×
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Production company</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="e.g. Warner Bros."
            value={form.productionCompany}
            onChange={(e) => handleChange("productionCompany", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Language</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="e.g. English"
            value={form.language}
            onChange={(e) => handleChange("language", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Country</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            placeholder="e.g. USA"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Rating</label>
          <select
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            value={form.rating}
            onChange={(e) => handleChange("rating", e.target.value)}
          >
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="block text-sm font-bold mb-1.5 tracking-tight">Actor score (optional)</label>
          <input
            className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
            type="number"
            placeholder="e.g. 7.5"
            value={form.actorScore}
            onChange={(e) => handleChange("actorScore", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create movie"}
          </button>
          <Link
            href="/movies"
            className="mt-2 block text-center rounded border border-black px-5 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
