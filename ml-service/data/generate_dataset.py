"""Synthetic historical movie dataset generator.

This file generates a reproducible, license-free dataset used to train and
evaluate the movie success prediction model described in the cahier des charges.

Generation rules (kept explicit so the dataset is auditable):
  * Target (success) is defined through profitability:
        ROI = (Revenue - Budget) / Budget
    A film is a SUCCESS when ROI > SUCCESS_ROI_THRESHOLD (default 1.0, i.e.
    revenue more than doubles the budget). This matches the document's
    recommended definition of success.
  * Revenue is simulated from interpretable drivers so the learned signal is
    realistic: budget, genre, runtime, release month, language, country and
    an actor score, plus random noise.
  * Revenues réelles are used ONLY to build the target. They are never exposed
    to the model at prediction time (no data leakage), as required by the
    methodological note in the document.
"""

from __future__ import annotations

import os
import random
from datetime import date

import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RANDOM_SEED = 42
N_SAMPLES = 2_000
SUCCESS_ROI_THRESHOLD = 1.0  # film rentable si ROI > 100 %

GENRES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western",
]
LANGUAGES = ["English", "French", "Spanish", "Mandarin", "Hindi", "Arabic", "Other"]
COUNTRIES = ["USA", "France", "United Kingdom", "India", "Japan", "South Korea", "Other"]
RATINGS = ["G", "PG", "PG-13", "R", "NC-17"]

# Genre box-office multiplier (relative audience reach).
GENRE_FACTOR = {
    "Action": 1.30, "Adventure": 1.25, "Animation": 1.20, "Comedy": 1.05,
    "Crime": 0.95, "Documentary": 0.55, "Drama": 0.90, "Fantasy": 1.15,
    "Horror": 1.05, "Mystery": 0.95, "Romance": 0.90, "Sci-Fi": 1.20,
    "Thriller": 1.00, "Western": 0.70,
}

# Release-month multiplier (seasonality).
MONTH_FACTOR = {
    1: 0.85, 2: 0.85, 3: 0.95, 4: 1.00, 5: 1.00, 6: 1.15,
    7: 1.20, 8: 1.20, 9: 0.95, 10: 1.05, 11: 1.10, 12: 1.25,
}

# Language / country multipliers.
LANGUAGE_FACTOR = {
    "English": 1.25, "French": 0.95, "Spanish": 1.00, "Mandarin": 1.05,
    "Hindi": 0.90, "Arabic": 0.85, "Other": 0.80,
}
COUNTRY_FACTOR = {
    "USA": 1.30, "France": 0.95, "United Kingdom": 1.00, "India": 0.85,
    "Japan": 0.90, "South Korea": 0.95, "Other": 0.80,
}


def _simulate_revenue(rng: random.Random, row: dict) -> float:
    """Simulate gross revenue from interpretable drivers (+ noise)."""
    budget = row["budget"]
    genre = row["genre"][0] if isinstance(row["genre"], list) else row["genre"]
    runtime = row["duration"]
    month = row["release_month"]
    language = row["language"]
    country = row["country"]
    actor_score = row.get("actor_score", 50.0)

    # Budget effect: revenue grows with budget but with diminishing returns
    # and an increasing risk component for very large budgets.
    budget_effect = (budget / 5_000_000) ** 0.7
    risk_penalty = 1.0 - min(budget / 200_000_000, 0.35)

    # Runtime effect: sweet spot around 90-130 min.
    runtime_factor = 1.0 - abs(runtime - 110) / 400.0
    runtime_factor = max(runtime_factor, 0.70)

    base = (
        budget_effect
        * GENRE_FACTOR.get(genre, 1.0)
        * MONTH_FACTOR.get(month, 1.0)
        * LANGUAGE_FACTOR.get(language, 1.0)
        * COUNTRY_FACTOR.get(country, 1.0)
        * runtime_factor
        * (1.0 + (actor_score - 50.0) / 200.0)
        * risk_penalty
    )

    revenue = budget * base * rng.uniform(0.5, 1.8)
    return max(revenue, budget * 0.05)


def generate_dataset(n_samples: int = N_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = random.Random(seed)

    rows = []
    for _ in range(n_samples):
        budget = rng.choice(
            [rng.uniform(2_000_000, 15_000_000),      # low budget
             rng.uniform(15_000_000, 50_000_000),     # medium
             rng.uniform(50_000_000, 120_000_000),    # high
             rng.uniform(120_000_000, 250_000_000)]   # blockbuster
        )
        genre = rng.choice(GENRES)
        duration = int(rng.uniform(75, 180))
        release_year = rng.randint(2010, 2025)
        release_month = rng.randint(1, 12)
        language = rng.choice(LANGUAGES)
        country = rng.choice(COUNTRIES)
        actor_score = round(rng.uniform(20.0, 95.0), 1)
        rating = rng.choice(RATINGS)

        revenue = _simulate_revenue(rng, {
            "budget": budget, "genre": genre, "duration": duration,
            "release_month": release_month, "language": language,
            "country": country, "actor_score": actor_score,
        })

        roi = (revenue - budget) / budget
        success = 1 if roi > SUCCESS_ROI_THRESHOLD else 0

        rows.append({
            "title": f"Movie {_}",
            "budget": round(budget, 2),
            "genre": genre,
            "duration": duration,
            "release_year": release_year,
            "release_month": release_month,
            "language": language,
            "country": country,
            "rating": rating,
            "actor_score": actor_score,
            "revenue": round(revenue, 2),
            "roi": round(roi, 4),
            "success": success,
        })

    return pd.DataFrame(rows)


def main() -> None:
    out_dir = os.path.dirname(os.path.abspath(__file__))
    df = generate_dataset()
    csv_path = os.path.join(out_dir, "movies.csv")
    df.to_csv(csv_path, index=False)

    n_success = int(df["success"].sum())
    print(f"Generated {len(df)} movies -> {csv_path}")
    print(f"Success rate: {n_success / len(df):.2%} "
          f"({n_success} success, {len(df) - n_success} failure)")
    print(df[["budget", "genre", "duration", "release_year", "language", "country",
              "revenue", "roi", "success"]].describe(include="all").to_string())


if __name__ == "__main__":
    main()
