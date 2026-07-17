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

## Status

Phase 1 (repo setup) and Phase 2 backend (API, auth, DB, tests) complete. Frontend implementation paused pending UI/UX design.
