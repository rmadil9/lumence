# Build-in-Public Companion

A private per-user to-do/done list beside a writing notepad. An AI chat polishes your writing; publish via manual-assist to X / LinkedIn.

Design rationale: see [`Design.md`](./Design.md).

## Structure

```
/backend   FastAPI app (owns all data + secrets)
/frontend  Next.js app (frontend only)
```

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, CLERK_SECRET_KEY, OPENAI_API_KEY, etc.
alembic upgrade head    # apply DB migrations
uvicorn app.main:app --reload
```

Run tests: `pytest` (uses an in-memory SQLite DB and mocked OpenAI calls — no live services required).

New migration after changing `app/models.py`: `alembic revision --autogenerate -m "..."`, review the generated file, then `alembic upgrade head`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local Postgres

```bash
docker compose up -d
```

## Deployment

Locked stack (see [`Design.md`](./Design.md)): frontend on Vercel, backend on Railway, prod Postgres on Neon. Nothing is provisioned yet — this section is the checklist for when it is.

### Backend (Railway + Neon)

1. Create a Neon Postgres project, copy its connection string.
2. Create a Railway service pointing at `/backend`. It reads `backend/Procfile`:
   - `web`: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - `release`: `alembic upgrade head` (runs migrations before each deploy)
3. Set these env vars on the Railway service (see `backend/.env.example` for the full list with descriptions):
   - `DATABASE_URL` — the Neon connection string
   - `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES` — same Clerk app as dev, but `CLERK_AUTHORIZED_PARTIES` must be the prod frontend origin
   - `CORS_ORIGINS` — the prod frontend origin (comma-separated if more than one)
   - `OPENAI_API_KEY`, `DAILY_CHAT_LIMIT`

### Frontend (Vercel)

1. Import the repo into Vercel, set the root directory to `/frontend`. No `vercel.json` needed — Next.js is zero-config there.
2. Set these env vars in the Vercel project (see `frontend/.env.example`):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — same Clerk app as dev
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`
   - `NEXT_PUBLIC_API_URL` — the deployed Railway backend URL
3. Once the Vercel domain exists, add it to the backend's `CORS_ORIGINS` and `CLERK_AUTHORIZED_PARTIES` env vars.

## Status

Phase 1 (repo setup), Phase 2 backend (API, auth, DB, tests), and frontend Phases 0–6 (foundations through polish + tests) are complete. Deployment (Vercel/Railway/Neon) has not been provisioned yet.
