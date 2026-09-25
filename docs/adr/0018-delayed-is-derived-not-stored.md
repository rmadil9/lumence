# ADR 0018 — `delayed` is derived, not a stored status

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-25
- **Amends:** signed-off `02-spec.md` (T3, T4) and `04-contracts.md` §1.1. Removes one of the
  two jobs the scheduler was created for in `05-architecture.md` §1.3.
- **Source:** surfaced by the conceptual-modelling session
  (`conceptual-model.md`), cross-checked against the signed-off documents.

## Context
`02-spec.md` T3 lists four todo statuses — `pending`, `in-progress`, `completed`, `delayed` —
and T4 requires that a todo not completed by the end of its due day *"shows `delayed` at the
next day boundary, correctly, whether or not the app was open at midnight"* (also E11). A note
under T3 adds that `delayed` *"is set automatically at the day boundary and can also be set
manually."*

Storing it means something must run at midnight to change it. That is why
`05-architecture.md` §1.3 has a scheduler container at all.

A separate conceptual-modelling session, run without these documents in context, produced a
different answer: `delayed` is not a status the user sets but a **fact about time passing**, so
it should be computed rather than stored. Most of that session's output contradicted the
signed-off documents and was discarded; this idea survived scrutiny.

**Derived** here means: not written anywhere, worked out fresh each time the data is read.

## Options considered
1. **Keep `delayed` as a stored status** — the signed-off design. Manual setting keeps working.
   Rejected: it requires a job that runs correctly every single night, and if that job fails or
   is late, todos silently show the wrong status with nothing to notice it.
2. **Store it *and* derive it as a fallback** — the read treats an overdue incomplete todo as
   delayed even if the job did not run. Rejected: two sources of truth for one fact. They can
   disagree, and reconciling them is the sort of bug that is very hard to see.
3. **Derive it — chosen.**

## Decision
- **Three stored statuses:** `pending`, `in-progress`, `completed`.
- **`delayed` is computed at read time:** the todo's due day has passed **and** it is not
  completed.
- **A todo can no longer be marked `delayed` by hand.** Spec T3's note is void.
- `due_day` remains the day the todo was created and still never changes (invariant 8).

## Consequences
- **T4 and E11 become trivially true instead of conditionally true.** The acceptance criterion
  is *"shows `delayed` correctly, whether or not the app was open at midnight."* A derived value
  is computed fresh on every read, so it is correct by construction. The stored version was only
  correct if a job had run — which is a weaker guarantee than the spec asks for.
- **The scheduler loses one of its two jobs.** Only the lock-in sweep remains
  (`05-architecture.md` §1.3). Whether one job still justifies a container is a fair question,
  but it is not reopened here — Adil chose the scheduler over lazy resolution on 2026-09-11.
- **Manual marking is gone, and it was worth less than it looked.** There is no date picker in
  v1, so marking a todo `delayed` never rescheduled anything — the todo stayed in the same list
  either way. It was a label meaning "not doing this today", and that is nearly all the value
  it had.
- **A behaviour change:** reopening a completed todo from a past day now shows it as `delayed`
  immediately, rather than showing whatever status was last written. This is the more honest
  answer.
- **The status enum shrinks from four values to three.** Removing a value from a database enum
  is awkward once rows exist — which is precisely why this is worth deciding now, before there
  are any.
- **Filtering and sorting by `delayed` become computed, not indexed.** Irrelevant at a personal
  todo list's scale; it would matter at a much larger one.

## What would make us revisit
Wanting a todo to carry a *reason* for being delayed, or wanting to defer one to a specific
future day. Either turns `delayed` back into something the user asserts rather than something
time does, and both imply the date picker that v1 deliberately does not have.
