# Slices — ordered delivery backlog

**WIP = 1.** Estimate in slices, never hours. Ordered by descending risk, not by convenience.

> Status: **skeleton.** Populated after 05-architecture.md sign-off.

## Slice 0 — walking skeleton (always first)
Request → logic → Postgres → response → UI → deployed HTTPS URL → CI green. Nothing else.

## Spike S1 — tracker feasibility (runs BEFORE design, time-boxed to 1 day)
Question to answer: can a GNOME Shell extension on Ubuntu/Wayland report the focused
window over D-Bus to a local process, reliably, without breaking on shell restart?
Deliverable: a yes/no answer and a thrown-away prototype. Not production code.
Gate: a NO here descends the descope ladder immediately.

## Backlog
TODO(adil)

## Open questions (not blockers)
TODO(adil)

## Retro lines
One line per completed slice: what surprised us.
