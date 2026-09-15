# Lumence — agent context

A single-platform personal work hub for solo developers: todos, a lock-in (deep-work)
countdown timer, a notepad, an LLM chat for refining writing, a link out to X, and
whole-day analytics of time spent per application and browser domain. Self-hosted on one
VPS, with open signup for real users. Built to production standards. Monetisation is out of scope for
v1; subscription plans are a v2 concern and will use Paddle.

The spine of the product is the activity tracker — it is what makes the lock-in timer
verifiable rather than an honour system. Treat it as core, not as an accessory.

## Status
**Understanding phase reopened 2026-09-15.** [ADR 0016](docs/adr/0016-split-into-nextjs-bff-and-fastapi-backend.md)
splits the app into a Next.js BFF plus a FastAPI backend, which reverses ADR 0008's "one app".
**Three spine steps need work:** step 4 contracts (two boundaries now, **Adil drives**), step 5
UX/UI (never done), step 6 architecture (redraw). No product code yet. Stack is chosen ([ADR 0008](docs/adr/0008-stack-single-nextjs-app-on-docker.md))
activity capture is designed ([ADR 0009](docs/adr/0009-activity-capture-fixed-window-samples.md)),
and `03-domain.md` and `04-contracts.md` are both **signed off** — the data model is frozen and
changes to it now need an ADR.
`02-spec.md` is drafted and awaiting sign-off — v1 has **five surfaces**: auth, todos,
lock-in timer, notepad (with LLM chat and an X link), and day analytics. Per-todo time
tracking is cut ([ADR 0004](docs/adr/0004-drop-per-todo-time-tracking.md)).

## Tech stack and why
**Decided — [ADR 0008](docs/adr/0008-stack-single-nextjs-app-on-docker.md).**

| Layer | Choice |
|---|---|
| Front end / BFF | Next.js — rendering, sign-in state, shaping data for the screen ([ADR 0016](docs/adr/0016-split-into-nextjs-bff-and-fastapi-backend.md)) |
| Backend | **FastAPI (Python)** — business rules, domain logic, the only thing that touches Postgres |
| Database | PostgreSQL |
| ORM + migrations | Prisma |
| Auth | Better Auth, self-hosted. **Stateless JWT sign-in, not database sessions** — [ADR 0014](docs/adr/0014-jwt-sessions-instead-of-database-sessions.md). **15-day token lifetime** |
| Deployment | Docker Compose |
| Reverse proxy + TLS | nginx + Certbot |
| Laptop capture client | Python daemon — 15-second samples, local SQLite buffer ([ADR 0009](docs/adr/0009-activity-capture-fixed-window-samples.md)) |
| Focused-app source | GNOME Shell extension — laptop is Wayland, D-Bus introspection restricted |
| Browser tab capture | Browser extension (JavaScript) → reports to the local daemon, not the VPS |
| Email relay | **Resend** — [ADR 0013](docs/adr/0013-resend-as-the-email-relay.md). TODO(adil): sending domain + SPF/DKIM — **deferred** |
| Background job home (spec T4) | Python, alongside the FastAPI backend — it owns the database |

Deployment and auth model settled earlier:
- **Deployment model:** everything self-hosted on one VPS — [ADR 0002](docs/adr/0002-self-host-on-a-single-vps.md)
- **Auth model:** self-hosted, multi-user with open signup — [ADR 0005](docs/adr/0005-full-email-auth-plus-google-oauth.md)
- **LLM:** OpenAI behind a provider-agnostic adapter — [ADR 0010](docs/adr/0010-llm-provider-openai-behind-an-adapter.md). Exact model TODO(adil)
- **Archived prior project discarded, not extended** — [ADR 0001](docs/adr/0001-discard-archived-codebase.md)

**No deadline and no time budget** — [ADR 0012](docs/adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md).
The contingency ladder survives as a standing "cut this first if it gets hard" guide; the
day 4/9/14 checkpoints are dropped. Dominant risk is now **the unproven cost of activity
capture**, and there is no longer an early-warning system for it.

Scope decisions from the spec session (2026-08-26): [ADR 0004](docs/adr/0004-drop-per-todo-time-tracking.md)
per-todo timers cut · [ADR 0005](docs/adr/0005-full-email-auth-plus-google-oauth.md) full
email auth + Google OAuth · [ADR 0006](docs/adr/0006-lock-in-is-a-plain-countdown.md)
lock-in is a plain countdown · [ADR 0007](docs/adr/0007-x-publishing-reduced-to-a-link.md)
X publishing is a link.

## Commands
TODO(adil): install / dev / test / lint / typecheck / migrate / deploy — fill in at iteration 0.

## Conventions
TODO(adil): naming, file layout, error handling, logging, test style — decide at iteration 0,
not by accretion.

## Human veto list — never decide these alone
Architecture and irreversible technology picks · data model changes after `04-contracts.md`
is signed off · auth and permission rules · anything touching money, PII, or deletion ·
production deploys and rollbacks · third-party dependency adoption · scope changes.
Everything else: propose and proceed.

## Working rules
**Read [docs/preferences.md](docs/preferences.md) first — it governs how to answer.**
In short: answer in points, plain words, keep it short, and commit without asking.

- Explain the *why* before non-trivial implementation: the pattern, the rejected
  alternative, the cost of changing it later. Name the concept; define it inline once.
- One hat per session (PM / architect / coder / QA / operator) — ask which at the start.
- WIP = 1 iteration. No spec, no code.
- Stay in the current phase. Later-phase decisions get flagged, not made.
- Every concept Adil meets goes in `docs/learning-log.md`, one line.
- End each iteration with one comprehension question about the code just written.

## docs/ index
| File | Purpose |
|---|---|
| [preferences.md](docs/preferences.md) | How Adil wants this run — output style, commit policy, learning rules |
| [00-process.md](docs/00-process.md) | Dominant risk, process model, **contingency ladder**, exit criteria |
| [01-problem.md](docs/01-problem.md) | Who has the pain, measurable success criteria, non-goals |
| [02-spec.md](docs/02-spec.md) | v1 behaviours in and explicitly out |
| [03-domain.md](docs/03-domain.md) | Entities, lifecycle states, invariants, ubiquitous language — **signed off 2026-09-02** |
| [04-contracts.md](docs/04-contracts.md) | Data schema + API surface + tracker ingest — **SIGNED OFF 2026-09-11. The lock-in point — changes need an ADR** |
| [05-architecture.md](docs/05-architecture.md) | Component boundaries, deployment topology |
| [adr/](docs/adr/) | One irreversible decision each |
| [iterations.md](docs/iterations.md) | Risk-ordered delivery backlog + retro lines |
| [test-strategy.md](docs/test-strategy.md) | What is unit/integration/e2e, what we skip |
| [runbook.md](docs/runbook.md) | Deploy, rollback, logs, what to do at 2am |
| [learning-log.md](docs/learning-log.md) | Concepts met, one line each |
