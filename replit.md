# BayesFlow AI

An interactive AI-powered Machine Learning laboratory that guides users through a 9-stage Naive Bayes classification workflow — from dataset selection to prediction history analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bayesflow run dev` — run the React frontend (port 25242)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, wouter
- API: Express 5 (Node.js) calling Python ML scripts via child_process
- ML Backend: Python 3.11 + scikit-learn (Gaussian/Multinomial/Bernoulli NB), pandas, numpy
- DB: PostgreSQL + Drizzle ORM (prediction history)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bayesflow/` — React + Vite frontend (9-stage ML workflow UI)
- `artifacts/api-server/` — Express API server + Python ML script runner
- `artifacts/api-server/src/ml/` — Python ML scripts (load, explore, preprocess, configure, recommend, train, predict, evaluate)
- `artifacts/api-server/src/lib/python.ts` — Node→Python bridge (stdin/stdout JSON)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/predictions.ts` — Prediction history DB table
- `.pythonlibs/` — Python virtual environment (scikit-learn, pandas, numpy)

## Architecture decisions

- Express API proxies all ML work to Python scripts via stdin/stdout JSON — avoids running a separate Python server while using scikit-learn natively
- Session state (DataFrames, trained models) stored in `/tmp/bayesflow_<sessionId>/` as pickle files — fast, zero-config, no DB for ML state
- Prediction history stored in PostgreSQL for persistence across sessions
- All 9 workflow stages have corresponding API endpoints with OpenAPI codegen (React Query hooks + Zod schemas)
- CSV upload base64-encoded in JSON body (50MB limit) — avoids multipart form complexity

## Product

9-stage interactive ML workflow:
1. Dataset Selection — upload CSV or choose from 4 built-in datasets (Iris, Spam, Student, Heart)
2. Dataset Exploration — stats, histograms, correlation heatmap, class distributions
3. Data Preprocessing — handle missing values, encode categoricals, feature scaling
4. Feature Selection & Train-Test Split — target column, input features, split slider
5. Model Selection — Gaussian / Multinomial / Bernoulli NB with AI recommendation
6. Model Training — real-time training logs, accuracy metrics, probability distributions
7. Prediction — dynamic input form, predicted class + confidence bars + explanation
8. Model Evaluation — confusion matrix, ROC curve, precision/recall/F1
9. Prediction History & Analytics — prediction logs, confidence trends, class distributions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Python scripts run from `.pythonlibs/bin/python` (uv venv); system `python3` won't have scikit-learn
- Session data is stored in `/tmp/bayesflow_<sessionId>/` — ephemeral, lost on server restart
- ML scripts path is resolved relative to the compiled server location — SCRIPTS_DIR points to `../../src/ml` from `dist/lib/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
