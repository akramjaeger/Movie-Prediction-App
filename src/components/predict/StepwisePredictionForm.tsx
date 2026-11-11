"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MoviePredictionInput } from "@/types";

const STEPS: { id: keyof StepState; label: string }[] = [
  { id: "basics", label: "Movie basics" },
  { id: "team", label: "Creative team" },
  { id: "release", label: "Release info" },
  { id: "review", label: "Review & predict" },
];

export type StepId = (typeof STEPS)[number]["id"];

interface StepState {
  basics: {
    title: string;
    releaseYear: number;
    budget: string;
    runtime: string;
  };
  team: {
    genre: string[];
    director: string;
    cast: string[];
    productionCompany: string;
  };
  release: {
    language: string;
    country: string;
    rating: string;
  };
  review: null;
}

const INITIAL_STATE: StepState = {
  basics: { title: "", releaseYear: new Date().getFullYear(), budget: "", runtime: "120" },
  team: { genre: [], director: "", cast: [], productionCompany: "" },
  release: { language: "English", country: "USA", rating: "PG-13" },
  review: null,
};

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western",
];
const RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

export default function StepwisePredictionForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<StepState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  // Reset to step 1 whenever the component mounts / remounts.
  useEffect(() => {
    setStepIndex(0);
    setErrors({});
    setSubmitError("");
  }, []);

  const setField = <K extends keyof StepState, F extends keyof StepState[K]>(
    stepId: K,
    field: F,
    value: StepState[K][F]
  ) => {
    setForm((prev) => ({ ...prev, [stepId]: { ...prev[stepId], [field]: value } }));
    // Clear field-level error when user starts editing.
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${String(stepId)}.${String(field)}`];
      return next;
    });
  };

  const handleGenreToggle = (g: string) => {
    setField("team", "genre", form.team.genre.includes(g)
      ? form.team.genre.filter((x) => x !== g)
      : [...form.team.genre, g]);
  };

  const castList = form.team.cast.join(", ");

  // ---- Per-step validation -------------------------------------------------
  const validateStep = (id: StepId): boolean => {
    const next: Record<string, string[]> = {};
    let valid = true;

    if (id === "basics") {
      if (!form.basics.title.trim()) {
        next["basics.title"] = ["Movie title is required"];
        valid = false;
      }
      if (!form.basics.releaseYear || form.basics.releaseYear < 1888) {
        next["basics.releaseYear"] = ["Enter a valid release year"];
        valid = false;
      }
      if (!form.basics.budget.trim() || Number(form.basics.budget) <= 0) {
        next["basics.budget"] = ["Enter a valid budget"];
        valid = false;
      }
      if (!form.basics.runtime.trim() || Number(form.basics.runtime) <= 0) {
        next["basics.runtime"] = ["Enter a valid runtime"];
        valid = false;
      }
    } else if (id === "team") {
      if (form.team.genre.length === 0) {
        next["team.genre"] = ["Select at least one genre"];
        valid = false;
      }
      if (!form.team.director.trim()) {
        next["team.director"] = ["Director is required"];
        valid = false;
      }
      if (!form.team.productionCompany.trim()) {
        next["team.productionCompany"] = ["Production company is required"];
        valid = false;
      }
    } else if (id === "release") {
      if (!form.release.language.trim()) {
        next["release.language"] = ["Language is required"];
        valid = false;
      }
      if (!form.release.country.trim()) {
        next["release.country"] = ["Country is required"];
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  };

  const goNext = () => {
    if (validateStep(currentStep.id)) {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }
  };

  const goBack = () => {
    setStepIndex((i) => (i > 0 ? i - 1 : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep.id)) return;

    setSubmitError("");
    setLoading(true);

    const input: MoviePredictionInput = {
      title: form.basics.title.trim(),
      releaseYear: form.basics.releaseYear,
      budget: Number(form.basics.budget) || 0,
      runtime: Number(form.basics.runtime) || 0,
      genre: form.team.genre,
      director: form.team.director.trim(),
      cast: form.team.cast,
      productionCompany: form.team.productionCompany.trim(),
      language: form.release.language.trim(),
      country: form.release.country.trim(),
      rating: form.release.rating,
    };

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Prediction failed");
        setLoading(false);
        return;
      }
      router.push(`/predict/${json.data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Prediction failed");
      setLoading(false);
    }
  };

  // Build the prediction payload for the review step display.
  const payload: MoviePredictionInput = {
    title: form.basics.title.trim(),
    releaseYear: form.basics.releaseYear,
    budget: Number(form.basics.budget) || 0,
    runtime: Number(form.basics.runtime) || 0,
    genre: form.team.genre,
    director: form.team.director.trim(),
    cast: form.team.cast,
    productionCompany: form.team.productionCompany.trim(),
    language: form.release.language.trim(),
    country: form.release.country.trim(),
    rating: form.release.rating,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Predict success</h1>
          <p className="text-black/60">
            Enter your movie details step by step, then run the prediction.
          </p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 rounded border border-red-900/30 bg-red-50 p-3 text-sm text-red-900">
          {submitError}
        </div>
      )}

      {/* Step indicator */}
      <ol className="mb-8 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-black/40">
        {STEPS.map((step, i) => {
          const active = i === stepIndex;
          const completed = i < stepIndex;
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={`rounded-full border px-2.5 py-1 ${
                  completed ? "bg-black text-white border-black" : active ? "bg-black/10 border-black text-black" : "border-black/30"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`${
                  completed ? "text-black" : active ? "text-red-900" : "text-black/40"
                } font-medium ${completed ? "line-through decoration-black/30" : ""}`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="h-px w-4 bg-black/20 mx-1 hidden sm:block" />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basics */}
        <section
          id="step-basics"
          hidden={stepIndex !== 0}
          className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-black/60">
            Step 1 — Movie basics
          </h2>

          <div className="field">
            <label className="block text-sm font-bold mb-1.5 tracking-tight">Movie title</label>
            <input
              className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                errors["basics.title"]
                  ? "border-red-900 focus:ring-red-900"
                  : "border-black focus:ring-red-900"
              }`}
              placeholder="e.g. The Midnight Run"
              value={form.basics.title}
              onChange={(e) => setField("basics", "title", e.target.value)}
              required
            />
            {errors["basics.title"]?.map((m) => (
              <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Release year</label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  errors["basics.releaseYear"]
                    ? "border-red-900 focus:ring-red-900"
                    : "border-black focus:ring-red-900"
                }`}
                type="number"
                value={String(form.basics.releaseYear)}
                onChange={(e) =>
                  setField("basics", "releaseYear", Number(e.target.value) || 0)
                }
                required
              />
              {errors["basics.releaseYear"]?.map((m) => (
                <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
              ))}
            </div>
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Budget (USD)</label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  errors["basics.budget"] ? "border-red-900 focus:ring-red-900" : "border-black focus:ring-red-900"
                }`}
                type="number"
                placeholder="e.g. 25000000"
                value={form.basics.budget}
                onChange={(e) => setField("basics", "budget", e.target.value)}
                required
              />
              {errors["basics.budget"]?.map((m) => (
                <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
              ))}
            </div>
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Runtime (minutes)</label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  errors["basics.runtime"] ? "border-red-900 focus:ring-red-900" : "border-black focus:ring-red-900"
                }`}
                type="number"
                value={form.basics.runtime}
                onChange={(e) => setField("basics", "runtime", e.target.value)}
                required
              />
              {errors["basics.runtime"]?.map((m) => (
                <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-8">
            <button
              type="button"
              disabled={loading}
              onClick={goNext}
              className="rounded border border-black px-5 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        {/* Step 2: Creative team */}
        <section
          id="step-team"
          hidden={stepIndex !== 1}
          className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-black/60">
            Step 2 — Creative team
          </h2>

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
                    form.team.genre.includes(g)
                      ? "bg-red-900 border-red-900 text-white"
                      : "border-black text-black hover:bg-black/5"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {errors["team.genre"]?.map((m) => (
              <p className="text-xs text-red-900 mt-1">{m}</p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Director</label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  errors["team.director"] ? "border-red-900 focus:ring-red-900" : "border-black focus:ring-red-900"
                }`}
                placeholder="e.g. Denis Villeneuve"
                value={form.team.director}
                onChange={(e) => setField("team", "director", e.target.value)}
                required
              />
              {errors["team.director"]?.map((m) => (
                <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
              ))}
            </div>
            <div className="field md:col-span-2">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">
                Cast members (comma-separated)
              </label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 border-black focus:ring-red-900`}
                placeholder="Actor A, Actor B, Actor C"
                value={castList}
                onChange={(e) =>
                  setField("team", "cast", e.target.value.split(",").map((c) => c.trim()).filter(Boolean))
                }
                required
              />
            </div>
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Production company</label>
              <input
                className={`w-full rounded border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  errors["team.productionCompany"] ? "border-red-900 focus:ring-red-900" : "border-black focus:ring-red-900"
                }`}
                placeholder="e.g. Warner Bros."
                value={form.team.productionCompany}
                onChange={(e) => setField("team", "productionCompany", e.target.value)}
                required
              />
              {errors["team.productionCompany"]?.map((m) => (
                <p key={m} className="text-xs text-red-900 mt-1">{m}</p>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-between gap-3 mt-8">
            <button
              type="button"
              disabled={loading}
              onClick={goBack}
              className="rounded border border-black px-5 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={goNext}
              className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        {/* Step 3: Release info */}
        <section
          id="step-release"
          hidden={stepIndex !== 2}
          className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-black/60">
            Step 3 — Release info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Language</label>
              <input
                className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="e.g. English"
                value={form.release.language}
                onChange={(e) => setField("release", "language", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Country</label>
              <input
                className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="e.g. USA"
                value={form.release.country}
                onChange={(e) => setField("release", "country", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="block text-sm font-bold mb-1.5 tracking-tight">Rating</label>
              <select
                className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
                value={form.release.rating}
                onChange={(e) => setField("release", "rating", e.target.value)}
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-between gap-3 mt-8">
            <button
              type="button"
              disabled={loading}
              onClick={goBack}
              className="rounded border border-black px-5 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={goNext}
              className="rounded bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        {/* Step 4: Review & predict */}
        <section
          id="step-review"
          hidden={stepIndex !== 3}
          className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-black/60">
            Step 4 — Review & predict
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Title
                </label>
                <p className="text-black text-sm">{payload.title}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Release year
                </label>
                <p className="text-black text-sm">{payload.releaseYear}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Budget
                </label>
                <p className="text-black text-sm">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(payload.budget)}
                </p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Runtime
                </label>
                <p className="text-black text-sm">{payload.runtime} min</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Genres
                </label>
                <p className="text-black text-sm">{payload.genre.join(", ") || "—"}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Director
                </label>
                <p className="text-black text-sm">{payload.director}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Cast
                </label>
                <p className="text-black text-sm">{payload.cast.join(", ") || "—"}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Production company
                </label>
                <p className="text-black text-sm">{payload.productionCompany}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Language
                </label>
                <p className="text-black text-sm">{payload.language}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Country
                </label>
                <p className="text-black text-sm">{payload.country}</p>
              </div>
              <div className="field">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                  Rating
                </label>
                <p className="text-black text-sm">{payload.rating}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-between gap-3 mt-10">
            <button
              type="button"
              disabled={loading}
              onClick={goBack}
              className="rounded border border-black px-5 py-2.5 text-sm font-bold text-black hover:bg-black/5 transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg disabled:opacity-50"
            >
              {loading ? "Predicting…" : "Run prediction"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
