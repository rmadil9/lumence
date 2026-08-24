# Lumence — agent context

A single-platform personal work hub for one solo developer: todos with per-todo time
tracking, a lock-in (deep-work) timer, a notepad, LLM-assisted writing, manual-assist
publishing to X, and whole-day analytics of time spent per application and browser tab.
Self-hosted on one VPS. Built to production standards. Monetisation is out of scope for
v1; subscription plans are a v2 concern and will use Paddle.

The spine of the product is the activity tracker — it is what makes the lock-in timer
verifiable rather than an honour system. Treat it as core, not as an accessory.

## Status
Understanding phase. **No product code yet.** Stack is not chosen; see the TODOs below.

## Tech stack and why
**Not decided.** The stack belongs to the architecture phase and gets its own ADR. Do not
assume a runtime, framework, database, or container setup anywhere in the docs or the code
until that ADR exists.

Settled so far, and only this:
- **Deployment model:** everything self-hosted on one VPS — [ADR 0002](docs/adr/0002-self-host-on-a-single-vps.md)
- **Auth model:** self-hosted, multi-user with open signup — mechanism TBD, ADR pending
- **LLM:** a paid API behind a provider-agnostic adapter — provider pending the stack ADR
- **Archived prior project discarded, not extended** — [ADR 0001](docs/adr/0001-discard-archived-codebase.md)

## Commands
TODO(adil): install / dev / test / lint / typecheck / migrate / deploy — fill in at slice 0.

## Conventions
TODO(adil): naming, file layout, error handling, logging, test style — decide at slice 0,
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
- WIP = 1 slice. No spec, no code.
- Stay in the current phase. Later-phase decisions get flagged, not made.
- Every concept Adil meets goes in `docs/learning-log.md`, one line.
- End each slice with one comprehension question about the code just written.

## docs/ index
| File | Purpose |
|---|---|
| [preferences.md](docs/preferences.md) | How Adil wants this run — output style, commit policy, learning rules |
| [00-process.md](docs/00-process.md) | Dominant risk, process model, **contingency ladder**, exit criteria |
| [01-problem.md](docs/01-problem.md) | Who has the pain, measurable success criteria, non-goals |
| [02-spec.md](docs/02-spec.md) | v1 behaviours in and explicitly out |
| [03-domain.md](docs/03-domain.md) | Entities, lifecycle states, invariants, ubiquitous language |
| [04-contracts.md](docs/04-contracts.md) | Data schema + API surface — the lock-in point |
| [05-architecture.md](docs/05-architecture.md) | Component boundaries, deployment topology |
| [adr/](docs/adr/) | One irreversible decision each |
| [slices.md](docs/slices.md) | Risk-ordered delivery backlog + retro lines |
| [test-strategy.md](docs/test-strategy.md) | What is unit/integration/e2e, what we skip |
| [runbook.md](docs/runbook.md) | Deploy, rollback, logs, what to do at 2am |
| [learning-log.md](docs/learning-log.md) | Concepts met, one line each |
