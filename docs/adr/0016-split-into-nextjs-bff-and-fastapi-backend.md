# ADR 0016 — Split into a Next.js BFF and a separate FastAPI backend

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-15
- **Supersedes:** the "one application, not two" decision in
  [ADR 0008](0008-stack-single-nextjs-app-on-docker.md). The rest of ADR 0008 — Postgres,
  Prisma, Better Auth, Docker Compose, nginx, Certbot — stands.

## Context
[ADR 0008](0008-stack-single-nextjs-app-on-docker.md) chose a single Next.js project holding
both the user interface and the server code. The reasoning was explicitly about schedule: two
codebases meant the shape of every operation written twice, in two languages, drifting silently
— costed at 1.5–2 days of plumbing taken straight out of activity capture's budget. A separate
Python API was considered and rejected on exactly those grounds.

**Two things changed since.**

1. **The deadline is gone** ([ADR 0012](0012-no-deadline-ladder-kept-checkpoints-dropped.md)).
   The schedule argument that decided ADR 0008 no longer applies.
2. **The goal changed.** Adil restated it on 2026-09-15: the point is to learn to build
   reliable, scalable, maintainable software **as an engineer, not just a developer** — high-level
   and low-level design, service boundaries, and the trade-offs behind them. He is a backend
   developer and wants the backend to be real backend work rather than a folder inside a
   front-end project.

Under the original goal — ship fast — one application was correct. Under the new goal, the
plumbing that ADR 0008 counted as pure cost is a substantial part of what is being learned.

**Terms, defined once:**
- **BFF (Backend For Frontend)** — a thin server that exists only to serve one user interface.
  It holds the sign-in state, shapes data to suit the screen, and calls the real backend. It is
  not where business rules live.
- **Service boundary** — the line between two separately deployed programs, across which they
  can only talk over a network and must agree a contract.

## Options considered
1. **Keep one Next.js application** (the ADR 0008 decision). Simplest to build and operate, one
   language, no second deployment. Rejected: it teaches nothing about service boundaries, and the
   reason it was chosen — schedule — no longer exists.
2. **Next.js BFF plus a Node backend.** One language everywhere and shared types across the
   boundary. Rejected: if both halves are TypeScript it becomes unclear why they are separate
   services at all, so it pays the cost of a split without most of its benefit.
3. **Next.js BFF plus a FastAPI (Python) backend — chosen.** Adil already knows Python. It is
   better suited to the activity-data work, which is the heaviest thing in the product. And the
   boundary is genuinely a boundary — two languages cannot share types by accident, so the
   contract has to be explicit, which is the thing being learned.

## Decision

**Two deployed services.**

| | Next.js BFF | FastAPI backend |
|---|---|---|
| Serves | The browser | The BFF |
| Owns | Rendering, sign-in state, shaping data for the screen | Business rules, the database, all domain logic |
| Language | TypeScript | Python |
| Talks to | The backend | Postgres |

- **Better Auth stays in the BFF.** Sign-in, verification, password reset and Google OAuth are
  browser-facing concerns, which is exactly what a BFF is for. The 15-day stateless JWT
  ([ADR 0014](0014-jwt-sessions-instead-of-database-sessions.md)) is unchanged.
- **The daemon's endpoint moves to the FastAPI backend.** It is a machine-to-machine endpoint
  with its own credential and has no reason to pass through a front-end server.
- **Postgres is reached only by the backend.** The BFF never opens a database connection.
- **TODO(adil): how the BFF authenticates to the backend.** A service credential, or forwarding
  the user's token. This is an auth rule and sits on the human veto list — Adil decides it, and
  it belongs in the contracts revision, not here.

## Consequences
- **Two codebases, two deployments, two dependency sets, two sets of logs.** The cost ADR 0008
  named is now being paid deliberately rather than avoided.
- **The shape of every operation is written twice** — once in Python, once in TypeScript — and
  they can drift with nothing to catch it. **TODO(adil):** whether to generate the TypeScript
  side from the backend's own schema, which is the standard defence and something FastAPI
  supports well. Belongs in the contracts revision.
- **`04-contracts.md` needs revising and is signed off**, so this ADR is what authorises that.
  It currently describes one boundary, browser to server. There are now two: browser to BFF, and
  BFF to backend. **Adil drives that revision** — he is the backend developer and the first pass
  was written for him rather than by him.
- **`05-architecture.md` needs redrawing** — one application becomes two services, and the ingest
  path changes.
- **An extra network hop on every request the browser makes.** More latency, and one more thing
  that can fail. Acceptable on one host where the hop is local.
- **The BFF will try to grow business logic.** This is the standard failure of the pattern and it
  happens gradually. The rule: **if it is a rule about the product, it belongs in the backend.**
  Worth checking at each iteration's review.
- **Spec A7 — a user seeing only their own data — now has to hold across two services.** The
  backend must never trust a user identifier the BFF sends without that being a deliberate,
  documented decision. This is the sharpest new risk the split introduces.
- **Adil's Python stops being laptop-only.** It was previously confined to the capture daemon;
  it is now the product's core.
- **Reversible, expensively.** Merging back into one application later is real work, though not a
  rewrite — the domain model and the database are untouched by this decision.

## What would make us revisit
The split producing more plumbing than learning — that is, time going into keeping two
descriptions of the same thing in step rather than into design. The answer then would be
generating one side from the other, not merging the services.
