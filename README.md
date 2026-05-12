# BayesFlow AI

An interactive AI-powered Machine Learning laboratory that guides users through a 9-stage Naive Bayes classification workflow — from dataset selection to prediction history analytics.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 20, TypeScript 5.9
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Recharts, wouter
- **API**: Express 5 (Node.js) — calls Python ML scripts via child_process
- **ML**: Python 3.11 + scikit-learn (Gaussian / Multinomial / Bernoulli NB), pandas, numpy
- **Database**: PostgreSQL + Drizzle ORM (prediction history)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (OpenAPI spec → React Query hooks + Zod schemas)

## Project Structure

```
artifacts/
  bayesflow/          # React + Vite frontend (9-stage ML workflow UI)
  api-server/         # Express API server
    src/ml/           # Python ML scripts (load, explore, preprocess, train, predict, evaluate)
    src/lib/python.ts # Node → Python bridge (stdin/stdout JSON)
    requirements.txt  # Python dependencies
lib/
  api-spec/           # OpenAPI spec (source of truth)
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
  db/                 # PostgreSQL schema + Drizzle ORM
```

## The 9-Stage Workflow

1. **Dataset Selection** — upload CSV or choose from 4 built-in datasets (Iris, Spam, Student, Heart)
2. **Dataset Exploration** — stats, histograms, correlation heatmap, class distributions
3. **Data Preprocessing** — handle missing values, encode categoricals, feature scaling
4. **Feature Selection & Train-Test Split** — target column, feature selection, split slider
5. **Model Selection** — Gaussian / Multinomial / Bernoulli NB with AI recommendation
6. **Model Training** — training logs, accuracy metrics, probability distributions
7. **Prediction** — dynamic input form, predicted class + confidence bars + explanation
8. **Model Evaluation** — confusion matrix, ROC curve, precision / recall / F1
9. **Prediction History & Analytics** — prediction logs, confidence trends, class distributions, export

## Architecture

- Express API proxies all ML work to Python scripts via stdin/stdout JSON — no separate Python server needed while still using scikit-learn natively
- ML session state (DataFrames, trained models) stored in `/tmp/bayesflow_<sessionId>/` as pickle files — fast, zero-config
- Prediction history stored in PostgreSQL for persistence across sessions
- CSV upload is base64-encoded in the JSON body (50 MB limit)

## Deployment

This app is deployed in two parts:

| Part | Platform |
|------|----------|
| Frontend (React) | **Netlify** |
| Backend (Node.js + Python) + Database (PostgreSQL) | **Render** |

### Backend → Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint** → connect the repo
3. Render reads `render.yaml` and automatically provisions the web service + PostgreSQL database
4. After deploy, add one environment variable in the Render dashboard:
   - `CORS_ORIGIN` = your Netlify site URL (e.g. `https://bayesflow.netlify.app`)

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → **New site → import from GitHub**
2. Netlify reads `netlify.toml` automatically — no manual build settings needed
3. Add one environment variable in the Netlify dashboard:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://bayesflow-api.onrender.com`)

### Environment Variables

| Variable | Platform | Value |
|----------|----------|-------|
| `VITE_API_BASE_URL` | Netlify | Your Render service URL |
| `CORS_ORIGIN` | Render | Your Netlify site URL |
| `DATABASE_URL` | Render | Auto-wired from Render PostgreSQL |
| `PYTHON_BIN` | Render | `python3` (pre-set in `render.yaml`) |

> **Note:** Render's free tier spins down web services after 15 minutes of inactivity. The first request after a period of inactivity takes ~30 seconds to wake up.

## Local Development

```bash
# Install dependencies
pnpm install

# Run the API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Run the React frontend (port 5173)
pnpm --filter @workspace/bayesflow run dev

# Type-check everything
pnpm run typecheck

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only — requires DATABASE_URL)
pnpm --filter @workspace/db run push
```

> **Python deps**: locally, Python scripts run from `.pythonlibs/bin/python` (managed by the Replit environment). On Render, they use system `python3` with packages installed from `artifacts/api-server/requirements.txt`.
