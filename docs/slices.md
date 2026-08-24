# Slices — ordered delivery backlog

**WIP = 1.** Estimate in slices, never hours. Ordered by descending risk, not by convenience.

> Status: **skeleton.** Populated after 05-architecture.md sign-off.

## Slice 0 — walking skeleton (always first)
Request → logic → database → response → UI → deployed HTTPS URL → CI green. Nothing else.

## No spike phase
Decided in [ADR 0003](adr/0003-no-spike-phase.md). Activity capture is the riskiest item in
scope, so it is **sliced early** — immediately after slice 0 and auth — rather than proven
up front. If it overruns its estimate by 50% or more, descend the contingency ladder in
`00-process.md`.

## Backlog
TODO(adil)

## Open questions (not blockers)
TODO(adil)

## Retro lines
One line per completed slice: what surprised us.
