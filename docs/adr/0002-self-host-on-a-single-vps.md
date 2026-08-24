# ADR 0002 — Self-host everything on a single VPS

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-24

## Context
Deploy target is a VPS with 16 GB RAM and 100 GB SSD. The original stated budget was
$0/month. v1 had chosen rented PaaS (Vercel + Railway + Neon + Clerk), which contradicts
both the deploy target and the budget.

## Options considered
1. **Rented PaaS** — fastest to a URL, least operational surface. Rejected: Vercel's free
   tier excludes commercial use, Railway has no free tier, and it wastes an owned VPS.
2. **Hybrid — app and DB on the VPS, rent auth and email** — materially less security
   surface owned, at small monthly cost. Rejected by Adil in favour of full self-hosting.
3. **Self-host everything** — chosen.

## Decision
All components run on the single VPS under Docker Compose: Postgres, the API, the web app,
and a reverse proxy terminating TLS. Authentication is self-hosted (ADR pending). The one
external paid dependency is the OpenAI API.

## Consequences
- **The budget line changes from $0/month to VPS + OpenAI usage.** Metered LLM cost is why
  per-plan token quotas are in v1 scope rather than deferred.
- We own, and must therefore build and document: TLS issuance and renewal, Postgres backups
  **with a tested restore**, process supervision and restart-on-reboot, OS patching, and —
  because signup requires email verification — transactional email deliverability. A fresh
  VPS IP has no sending reputation, so a third-party SMTP relay is the likely outcome
  despite the self-hosting stance. That is a dependency to plan for, not discover.
- Single host means **no redundancy**: it is a single point of failure for compute and data
  alike. Acceptable for a personal tool; it would not be for paying users.
- Real learning value in operations, which is an explicit project goal.

## What would make us revisit
Real users depending on uptime; the VPS becoming resource-bound; or email deliverability
consuming more than one day.
