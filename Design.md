# Build-in-Public Companion — Design

## Problem
Building in public means doing the work *and* writing about it. By day's end it's easy to forget what you did, and writing the post feels like a separate chore.

## Solution
One app: a to-do/done list beside a writing area. The list reminds you what you did; you draft your post next to it; an AI chat polishes the writing; you publish to X and LinkedIn — without leaving the app.

---

## Phase 1 — Scope

**Locked V1**
A deployed web app with open signup (hosted auth). Each user gets a private to-do/done list and a writing notepad. They draft a build-in-public post with their done-list in view, refine it through a multi-turn AI chat, then publish via *manual-assist*: pick X / LinkedIn / both, one button per platform (X = prefilled compose window, LinkedIn = copy + open). A character counter shows whenever X is a selected target.

**Deliberately deferred** — real one-click X/LinkedIn API posting, streaming AI replies, post scheduling, analytics, media attachments, AWS.

**Guiding principle** — *isolate external-dependency risk from the deadline.* Anything gated by a third party's approval or paid tier (e.g. LinkedIn's API review) is a schedule you don't control, so V1 hides it behind a clean seam and defers the integration.

---

## Phase 2 — Stack Decisions

| Area | Choice | Why |
|---|---|---|
| Frontend | **Next.js** (React) on **Vercel** | Known; deploys on push |
| Backend | **FastAPI** on **Railway** | Owns data + logic; holds secrets |
| Database | **Postgres** — Neon (prod) + local | Concurrency + persistence for multi-user |
| ORM | **SQLModel** | Work with rows as Python objects |
| Auth | **Clerk** | Rent login; never store passwords ourselves |
| AI | **OpenAI**, replies all-at-once | Known provider; simplest reliable version first |

**Hosting rationale** — start on PaaS (managed platforms) that meet the reliability bar; graduate to raw cloud (AWS) only when a real limit forces it. Learn heavy infra as its own project, not tangled into a deadline.

**Guiding principle** — *spend your build budget on what's unique to the project (the AI writing loop); rent the solved problems (auth, hosting).*

---

## Phase 2.5 — Design

### Separation of concerns
```
Next.js (browser)  →  FastAPI (backend)  →  Postgres (DB)
                             └──────────────→ OpenAI
                       Clerk guards the door
```
The browser never touches the database or the OpenAI key. All secrets and data access live behind FastAPI — the single backend. (Next.js is used for frontend only.)

### Data model
Only what needs to persist is stored. The notepad and AI chat are **not** stored on the server — the notepad auto-saves to the browser's local storage, matching the real "write → post → forget" workflow.

```
users        (id, clerk_user_id, email, created_at)
todos        (id, user_id, title, description, status, created_at)
daily_usage  (id, user_id, date, count)   # enforces the AI cap
```
Every table holding user content carries `user_id`; every query filters by it — that's how per-user isolation works.

### API contract
Every route carries the Clerk token and is scoped to the logged-in user.

```
POST   /users/sync     on login → ensure local users row exists
GET    /todos          list my todos
POST   /todos          {title, description} → new todo
PATCH  /todos/{id}     {title? description? status?} → updated todo
DELETE /todos/{id}     remove it
POST   /chat           {messages[]} → {reply}   # context-free, checks + bumps daily cap
GET    /usage          → {used_today, limit}
```

### Frontend components (inside the Next.js box)
- **Auth gate** — Clerk's ready-made login/signup.
- **Todos** — `TodoList`, `TodoItem`, `AddTodo`.
- **Writing** — `Notepad` (local-storage autosave), `ChatPanel` (calls `/chat`), `PublishBar` (platform toggles + per-platform button + X counter).
- **Shared** — `UsageBadge` (reads `/usage`), `AppLayout`.

Principle: one component = one job.

---

## Design principles applied
- **Just enough design up front** — sketch the spine (data model, API, components); let small details emerge in development.
- **Persistence is a choice** — store only what loses value if forgotten; distinguish *storage* (the only copy) from *cache* (a disposable fast copy).
- **Design flows downhill** — data model → API contract → components. Each layer falls out of the one above.
- **Don't generalize a one-off** — solve the single case in place (e.g. the cap lives inside `/chat`, not in shared middleware).
