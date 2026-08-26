# ADR 0007 — X publishing is reduced to a link

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-26

## Context
The product description names "manual-assist publishing to X" as a surface, and
`01-problem.md` lists build-in-public posts among the six artefacts of Adil's day.
"Manual-assist" was understood as: Lumence holds a draft, enforces the character limit,
and opens X's compose window prefilled, leaving the actual posting to the human.

Contingency ladder rung 4 already contemplated cutting this surface entirely, with drafts
copied out by hand.

## Options considered
1. **Full manual-assist**: stored drafts, character counting, prefilled compose window, a
   posted state marked by the user. The original seed.
2. **Prefilled compose only**, no stored drafts. Discussed, then dropped.
3. **A plain link.** Chosen.

## Decision
The notepad carries a **"Post on X" button that opens X in a new browser tab.** That is the
whole surface. There is no prefill, no stored draft, no character count, and no posted
state. The user copies whatever text they want from the notepad, whenever they want.
Lumence stores nothing about X and never knows whether anything was posted.

## Consequences
- **A surface becomes a hyperlink.** There is almost nothing to build and almost nothing to
  test — one acceptance criterion (spec X1).
- **Ladder rung 4 is effectively pre-spent.** There is no longer an X surface worth cutting
  if the schedule tightens; the remaining rungs are 1, 2, and 3.
- **No `Publisher` seam is needed in v1.** `01-problem.md` previously promised one behind
  the manual-assist behaviour; with nothing to publish, the seam has nothing to abstract.
  If the real X API arrives in v2 it will be new work, not a swapped implementation.
- **Character-limit correctness is not v1's problem** — including the emoji counting issue
  flagged during the interview. The user finds out in X's own composer.
- The build-in-public artefact is therefore only partly addressed by v1: Lumence holds the
  text, X holds the posting.

## What would make us revisit
Adil finding the copy-paste step is what stops him posting. The next step then is a
prefilled compose URL, which is small; the X API is a much larger commitment and is v2.
