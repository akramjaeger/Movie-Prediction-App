# Deployment — Movie Success Prediction

This guide covers deploying both parts of the system described in the *cahier des charges*:

1. **ML Service** (Python / FastAPI / scikit-learn) — `ml-service/`
2. **Frontend** (Next.js) — the app in this repo

The architecture keeps them separate, as recommended in the document: Next.js handles UI/auth/CRUD, while the Python service exposes the trained model via `POST /predict`.

---

## Architecture

```
┌─────────────────┐        HTTP /predict        ┌─────────────────────┐
│   Next.js App   │ ───────────────────────────► │  FastAPI ML Service │
│  (Vercel / Node)│  POST /api/predictions      │   (Docker / cloud)  │
│                 │                             │  POST /predict      │
│                 │                             │  GET  /health       │
└─────────────┬───┘                             └──────────┬──────────┘
              │                                            │
              │ ML_SERVICE_URL                             │ model.joblib
              │                                            │ preprocessor.joblib
              ▼                                            ▼
      PostgreSQL / Prisma                            artifacts/
```

---

## Prerequisites

| Component | Requirement |
|---|---|
| ML Service | Python 3.10+, `pip`, `uvicorn`, `fastapi`, `scikit-learn`, `pandas`, `joblib` |
| Frontend | Node.js 18+, `npm` |
| Database | PostgreSQL (or the in-memory adapter for dev) |
| Container (optional) | Docker |

---

## Part A — Deploy the ML Service (FastAPI)

### 1. Prepare artifacts

The notebook `ml-service/notebooks/model_training.ipynb` trains the model and writes:

```
ml-service/artifacts/
├── model.joblib
├── preprocessor.joblib
└── metadata.json
```

Run the notebook (or `src/train.py`) on a machine where scikit-learn imports cleanly (see note below if you hit Windows App Control blocks).

### 2. Install dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 3. Run locally

```bash
cd ml-service
uvicorn main:app --reload --port 8000
```

Test it:

```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"budget":150000000,"runtime":125,"release_year":2024,"cast_count":10,"has_director":true,"genre":"Action","language":"en","country":"US"}'
```

### 4. Dockerize the ML service

`ml-service/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY schemas.py main.py predict.py preprocessing.py ./
COPY artifacts ./artifacts

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
cd ml-service
docker build -t movie-ml-service .
docker run -p 8000:8000 movie-ml-service
```

### 5. Deploy to cloud (Fly.io / Railway / Render / EC2)

Example `fly.toml`:

```toml
app = "movie-ml-service"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  http_checks = []

[[services.ports]]
  port = 8000
  handlers = ["http"]
  force_https = true
```

Set the resulting public URL (e.g. `https://movie-ml-service.fly.dev`) as `ML_SERVICE_URL` in the frontend.

---

## Part B — Deploy the Next.js Frontend

### 1. Environment variables

Create `.env.local` (dev) or set these in your hosting provider:

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_ML_SERVICE_URL` | Base URL of the FastAPI ML service | `https://movie-ml-service.fly.dev` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Session signing secret | `openssl rand -base64 32` |

If `NEXT_PUBLIC_ML_SERVICE_URL` is not set, the app falls back to the self-contained TypeScript model in `src/lib/ml/` (no Python service required).

### 2. Deploy on Vercel (recommended)

```bash
cd /path/to/Movie-Prediction-App-main
npx vercel
```

Follow the prompts, then add environment variables in the Vercel project dashboard:
- Settings → Environment Variables → add `NEXT_PUBLIC_ML_SERVICE_URL`, `DATABASE_URL`, `NEXTAUTH_SECRET`

Redeploy after adding variables.

### 3. Deploy with Docker (self-hosted)

```dockerfile
# Dockerfile at repo root (optional)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t movie-app .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_ML_SERVICE_URL=https://movie-ml-service.fly.dev \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  movie-app
```

### 4. Connect frontend to ML service

The Next.js API route `src/app/api/predictions/route.ts` already calls `predictSuccess()` from `src/lib/prediction.ts`. If you want it to call the remote FastAPI service instead of the local TypeScript model, set `NEXT_PUBLIC_ML_SERVICE_URL` and update `prediction.ts` to forward to `fetch(${ML_SERVICE_URL}/predict)`.

Current behavior (no env var): uses the TypeScript logistic regression in `src/lib/ml/model.ts` — works fully standalone.

---

## Part C — Database (PostgreSQL + Prisma)

The app uses Prisma with an in-memory adapter by default so it runs without a database. For production, connect PostgreSQL:

1. Provision PostgreSQL (Vercel Postgres, Supabase, Railway, Neon, or self-hosted).
2. Set `DATABASE_URL` in your env.
3. Generate Prisma client and push the schema:

```bash
npx prisma generate
npx prisma db push
```

Or run migrations:

```bash
npx prisma migrate dev --name init
```

The schema (`prisma/schema.prisma`) already defines `User`, `Movie`, `Prediction`, and `MLModel` per the cahier des charges.

---

## Health checks & verification

| Endpoint | Expected |
|---|---|
| `GET https://<ml-service>/health` | `{"status":"ok","service":"movie-success-ml","version":"1.0.0"}` |
| `POST https://<ml-service>/predict` | JSON with `success`, `probability`, `success_score` |
| `GET https://<app>/api/predictions` | Authenticated user's prediction history |
| `GET https://<app>/api/dashboard` | Dashboard statistics |

---

## Notes

- **Windows App Control**: If `import pandas` / `import sklearn` fails with "Application Control policy has blocked this file," unblock the `.pyd` files under Python's `site-packages` (`Unblock-File`), use WSL2, or rely on the self-contained TypeScript model in the Next.js app (no Python needed).
- **Data leakage**: Revenues are used **only** to build the training target (`ROI > 0`). They are never features at prediction time, per the methodological rule in the cahier des charges.
- **Model versioning**: Each trained run is saved to `artifacts/` with `metadata.json`. The active model version is recorded in the `MLModel` table so predictions can be audited by version.
