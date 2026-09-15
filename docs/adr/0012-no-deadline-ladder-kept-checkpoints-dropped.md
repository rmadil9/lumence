# ADR 0012 — There is no deadline; the contingency ladder stays, the checkpoints go

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-11

## Context
Every process decision on this project was built on a fixed deadline. `00-process.md` named the
dominant risk as *"scope against a fixed deadline"* and sized the work at 20 working days at
10 h/day. `decision-log.md` §1 called the deadline *"the fixed constraint everything else bends
around"* — deadline fixed, **scope is the variable**.

Three mechanisms hung off that:
- the **contingency ladder** — an ordered list of features to cut when the deadline got tight,
  agreed while calm so the choice was never made in a panic;
- the **day 4 / 9 / 14 checkpoints** — compare iterations done against iterations left, and descend a
  rung immediately if work left exceeds days left;
- the **2-day time-box** on the understanding phase.

On 2026-09-11 Adil confirmed **there is no deadline.** That removes the premise all three rested
on, so they had to be decided again rather than left as text that no longer means anything.

## Options considered
1. **A self-imposed 20-day budget** — same number, same checkpoints, same ladder, enforced by
   Adil rather than by an outside date. **I recommended this and was overruled.** The argument:
   the deadline is what produced this project's best decisions. ADR 0004 (per-todo timers cut),
   ADR 0006 (no focus scoring) and ADR 0007 (X reduced to a link) were all "this does not fit in
   the time." With no clock at all, nothing forces a cut, and cut features quietly return.
2. **No time budget at all**, ladder and checkpoints both dropped as dead text.
3. **Keep the ladder, drop the checkpoints — chosen.** No time budget. The ordered cut list
   survives as a standing *"if this turns out hard, cut this first"* guide rather than as a
   response to a clock.

## Decision
- **There is no deadline and no time budget.** Work is not measured against days.
- **The contingency ladder stays**, unchanged in content and order, and is re-framed: it is no
  longer triggered by running out of time. It is triggered by a piece of work turning out
  **harder than it is worth** — most plausibly activity capture, which
  [ADR 0003](0003-no-spike-phase.md) left unpriced.
  1. Browser tabs → desktop applications only.
  2. Open signup → multi-user schema with a single account.
  3. Lock-in session review → raw day view only.
- **The day 4 / 9 / 14 checkpoints are dropped.** There are no days to check against.
- **The 2-day time-box on the understanding phase is dropped**, and is moot in any case — the
  phase is essentially complete.
- **The dominant risk is restated.** It is no longer scope against a deadline. It is now
  **the unproven cost of activity capture**, which was always the second risk and is now the
  first by default.

## Consequences
- **The project loses its early-warning system entirely, and this is the real cost.**
  [ADR 0003](0003-no-spike-phase.md) cut the spike and named the checkpoints as *"the only
  early-warning system the project has"* — mitigated only by risk-ordering and those checkpoints.
  Risk-ordering survives; the checkpoints do not. Nothing now tells Adil that activity capture
  is overrunning **except noticing it himself while building it.** I raised this once and it is
  recorded here, not to be re-argued.
- **The ladder becomes reactive rather than scheduled.** It is consulted when something turns out
  hard, not at fixed moments. That is a weaker mechanism than a calendar trigger, but it is not
  nothing — the cuts are still pre-agreed and pre-ordered, which is the part that mattered most.
- **Nothing forces a scope cut any more.** The scope in `02-spec.md` is signed off and its
  **Out** lists are explicit, so the defence against sprawl is now the spec itself rather than
  the clock. That puts real weight on not reopening `02-spec.md`.
- **`iterations.md` becomes a plain risk-ordered backlog**, not a triage plan. It is ordered by
  descending risk, with activity capture early — that rule is from `00-process.md` and is
  unaffected by the deadline going away.
- **No decision already made is reversed.** ADR 0004, 0006 and 0007 cut scope for reasons that
  stand on their own merits as well as on time, and they stay cut.
- **Quality pressure changes direction.** With no clock, the temptation is no longer to cut
  corners but to gold-plate. The success criteria in `01-problem.md` — especially criterion 7,
  seven consecutive days of real use — remain the definition of done.

## What would make us revisit
Adil adopting a deadline again, self-imposed or external. The checkpoints would then come back
with it, since they are only meaningful against a clock.
