# Slices — ordered delivery backlog

**WIP = 1.** Estimate in slices, never hours. Ordered by descending risk, not by convenience.

> Status: **skeleton.** Populated after 05-architecture.md sign-off.

## Slice 0 — walking skeleton (always first)
Request → logic → database → response → UI → deployed HTTPS URL → CI green. Nothing else.

## Spike S1 — activity-capture feasibility (runs BEFORE design, time-boxed to 1 day)
Question to answer: on Adil's actual machine, can something reliably observe which desktop
application and which browser tab has attention, and hand that off to another process?
Mechanism is deliberately unspecified — finding it is the spike.
Deliverable: a yes/no answer, a cost estimate, and a thrown-away prototype. Not production
code. Gate: a NO here descends the contingency ladder immediately.

## Backlog
TODO(adil)

## Open questions (not blockers)
TODO(adil)

## Retro lines
One line per completed slice: what surprised us.
