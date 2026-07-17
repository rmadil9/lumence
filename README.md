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
cp .env.example .env   # fill in DATABASE_URL etc.
uvicorn app.main:app --reload
```

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

Phase 1 (repo setup) in progress.
