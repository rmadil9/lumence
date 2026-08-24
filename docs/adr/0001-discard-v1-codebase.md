# ADR 0001 — Discard the v1 codebase entirely

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-24

## Context
Commit `63f42081` held a near-complete, tested v1 under the name Lumence: a
"build-in-public companion" (todos, notepad, OpenAI polish, manual-assist publishing to
X/LinkedIn) on Next.js/Vercel + FastAPI/Railway + Neon Postgres + Clerk. It was never
deployed. Commit `796a65e3` wiped the working tree with no recorded rationale.

Lumence v2 is a **different product** — a single-platform personal work hub whose spine is
whole-day activity tracking — and targets a **different deployment model** (one self-hosted
VPS, not rented PaaS). Roughly the only overlap is "todos and a notepad exist".

## Options considered
1. **Resurrect and fix forward** — fastest route to a live URL, but inherits a stack chosen
   for PaaS constraints that no longer apply, and an architecture aimed at a product we are
   not building.
2. **Salvage selectively** — port the data model and tests. Rejected: the v2 domain is
   dominated by activity sessions and quotas, which v1 had no concept of, so the salvageable
   surface is small and carries assumptions we would have to hunt down.
3. **Reference only, rewrite fresh** — keep the docs for context.
4. **Discard entirely** — chosen.

## Decision
Discard. v1's code, PRD, and design artefacts hold no authority over v2 and are not cited
in v2's documents.

## Consequences
- We re-solve problems v1 already solved (auth wiring, todo CRUD, per-user isolation) and
  pay that cost knowingly.
- v1's one genuinely good judgement call is adopted independently on its own merits, not
  inherited: **defer integrations gated by a third party's approval or paid tier behind a
  clean seam.** That is why v2 also ships manual-assist X publishing.
- v1's opposite judgement — renting auth from Clerk — is *rejected* in v2 by the
  self-hosting decision (ADR 0002). This is the single largest cost increase between the two
  and it was chosen deliberately.
- **Security consequence:** `backend/.env` is committed at `012ab423` and pushed to
  `origin`. Discarding the code does not unleak those credentials. Any Clerk and OpenAI keys
  in that file must be treated as public and rotated. Open action for Adil.

## What would make us revisit
Nothing. The decision is already executed; this ADR exists so the *reason* survives.
