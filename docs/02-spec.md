# 02 — V1 Scope

> Status: **skeleton, not signed off.** Written after 01-problem.md is approved.

## Observable behaviours IN v1
TODO(adil): one line per behaviour, phrased as something a user can *see happen*.
Seed list from the kickoff interview (needs your confirmation and sharpening):
- Sign up, verify email, sign in, sign out, reset password
- Create / edit / complete / delete a todo
- Start and stop a timer against a specific todo; see accumulated time per todo
- Start a lock-in session of 1–4 hours; see it counting down; review afterwards where the time actually went
- Write in a notepad that persists
- Multi-turn LLM chat that refines notepad text
- Publish a draft to X via manual-assist (prefilled compose window)
- See a day view: time per application and per browser domain

## Explicitly OUT of v1
- Billing, payment processing, and subscription plan tiers — deferred to v2 (Paddle)
- Hard enforcement or blocking of apps and sites during a lock-in session
- Real X API posting (manual-assist only; `Publisher` seam left in place)
- LinkedIn or any other platform
- Mobile app, offline-first sync, media attachments
- Any analytics beyond time use

## Edge cases to force at spec time (per slice)
TODO(adil): decide in-scope vs logged, per §8 of the blueprint.
empty / one / many · concurrent timers · duplicate submit · partial failure ·
expired session · unicode · timezone + DST · permission-denied · network mid-flight ·
tracker daemon offline then reconnecting with a backlog
