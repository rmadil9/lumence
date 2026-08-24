# ADR 0003 — No spike phase; linear execution

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-24

## Context
Whole-day activity capture — knowing which desktop application and which browser tab holds
attention — is the spine of the product and the one item in scope whose cost is unknown.

The process doc originally proposed a one-day time-boxed spike before the understanding
pass: prove the capability exists on the target machine, throw the code away, then design
around a known answer.

## Options considered
1. **Spike first, then linear.** One day spent up front to retire the largest unknown before
   any design depends on it. Rejected by Adil as too slow for a fast-moving project.
2. **Linear, with activity capture ordered first among the slices.** The unknown is carried
   into the build and resolved by building the real thing. Chosen.
3. **Linear, activity capture last.** Rejected by both of us — it puts the biggest surprise
   where there is no time left to absorb it.

## Decision
No spike phase. Straight linear execution: one understanding pass, then risk-ordered
slices, with activity capture designed early in `05-architecture.md` and sliced early.

## Consequences
- **Saves one day up front.** That is the whole point and it is a real gain on a 20-day
  budget.
- **The cost of activity capture is discovered while building production code, not throwaway
  code.** If the approach turns out to be wrong, the loss is a partly-built slice plus the
  design decisions that assumed it, rather than one deliberately disposable day.
- Contracts are the risk here specifically: `04-contracts.md` locks the ingest surface
  before we have run a capture client against it. If capture turns out to work differently
  than assumed, the contract changes after lock-in — which the veto list flags as a
  decision needing an ADR.
- **Mitigations, which are now load-bearing rather than nice-to-have:**
  - The descending-risk rule — activity capture is sliced early, not late.
  - The day 4 / 9 / 14 checkpoints — the only early-warning system left.
  - The contingency ladder — rung 1 drops browser tabs, which is the more speculative half.
- I advised for the spike once and was overruled. Recorded here so the reasoning survives if
  this bites; not to be re-argued.

## What would make us revisit
Activity capture consuming more than its estimate by 50% or more. At that point the answer
is the contingency ladder, not a retroactive spike.
