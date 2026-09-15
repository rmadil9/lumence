# ADR 0001 — Discard the archived codebase entirely

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-24

## Context
Commit `63f42081` of this repo holds a **separate, earlier product** — a
"build-in-public companion" (todos, notepad, OpenAI polish, manual-assist publishing).
It was complete and tested but never deployed. Commit `796a65e3` wiped the working tree
with no recorded rationale.

Lumence is a different product with a different deployment model. The archived project is
not an earlier version of it and is not referred to as one anywhere in these docs.

## Options considered
1. **Resurrect and fix forward** — fastest route to a live URL, but inherits a product we
   are not building.
2. **Salvage selectively** — port the data model and tests. Rejected: too little overlap to
   be worth hunting down the assumptions that come with it.
3. **Reference only, rewrite fresh.**
4. **Discard entirely** — chosen.

## Decision
Discard. The archived code, its PRD, and its design artefacts hold no authority over
Lumence and are not cited in Lumence's documents.

## Consequences
- We re-solve problems that project already solved (auth wiring, todo CRUD, per-user
  isolation) and pay that cost knowingly.
- One judgement from it is adopted **independently, on its own merits** — not inherited:
  defer any integration gated by a third party's approval or paid tier behind a clean seam.
- **Security consequence:** `backend/.env` is committed at `012ab423` and pushed to
  `origin`. Discarding the code does not remove it — deleting a file from git does not delete
  it from history, so it is still readable at that commit.
  **Severity revised 2026-09-11 (Adil): the repository is private.** Only people with repository
  access have ever been able to read it, so the keys are not public. Rotation is good hygiene
  rather than an emergency, and it stops being optional the moment the repository is made public
  or shared.

## What would make us revisit
Nothing. The decision is already executed; this ADR exists so the reason survives.
