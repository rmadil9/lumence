# ADR 0004 — Drop per-todo time tracking from v1

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-26

## Context
The kickoff description of Lumence names "todos with per-todo time tracking" as a core
surface, and `01-problem.md` counts "time spent per task" as one of the six artefacts a
working day produces. The seed scope list carried a full timer surface: start a timer
against a todo, stop it, accumulate totals, enforce one timer at a time.

During the scope interview Adil observed that he has no existing habit of measuring time
per task — today he runs a Google stopwatch for focus sessions only, and nothing at all
per todo. The surface would be built for a behaviour he does not currently have.

## Options considered
1. **Keep the full per-todo timer.** Faithful to the original product description.
   Rejected: it is a whole surface — timer state, time entries, totals, the one-timer
   invariant, and its own edge cases — built on an unproven habit, against a fixed 20-day
   deadline.
2. **Keep a reduced version** (manual time entry, no live timer). Rejected: still a data
   model, still a UI, still solving a problem Adil does not yet have.
3. **Drop it entirely from v1.** Chosen.

## Decision
Per-todo time tracking is out of v1. Todos have no timer, no time entries, and no totals.
The lock-in session timer is unaffected and remains in scope.

## Consequences
- **v1 has five surfaces, not six.** `CLAUDE.md` and `01-problem.md` are updated to match.
- **Nothing connects a todo to time spent.** The day view reports time per application and
  per browser domain only. There is no task dimension anywhere in the product.
- **The lock-in timer becomes the only link between stated intention and measured reality.**
  That was already the product's central insight; this decision concentrates it.
- **Real scope relief on a fixed deadline** — a whole surface and its edge cases removed
  before any of it was built. This is the right kind of cut and it was made early.
- **Reversible.** Todo records remain. Adding time entries against them later is additive,
  not a migration of existing data.
- I did not argue against this. Recorded because it changes the product's stated shape.

## What would make us revisit
Adil finding, during real use, that he wants to know where a specific task's hours went and
the day view cannot answer it. That is a v2 addition, not a v1 reopening.
