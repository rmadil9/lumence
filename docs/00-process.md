# 00 — Process

## Dominant risk and chosen model

Lumence's dominant risk is **scope against a fixed deadline, with one unresolved
technology question sitting inside the scope.**

- It is **not value uncertainty.** Adil is the user, has the pain, and has said he does not
  care about revenue or outside adoption for v1. There is no "will anyone want this" left
  to answer.
- It is **not requirement uncertainty.** The behaviours are known and listable (`02-spec.md`).
- What remains: six product surfaces plus self-hosted signup plus whole-day activity
  tracking, against a hard **20-day** deadline at 10 h/day — and one of those items depends
  on capability we have not yet proven exists on the target platform.

**The unproven capability:** capturing which desktop application and which browser tab had
the user's attention, all day, and getting that data to the server. Nothing about *how* is
decided here — mechanism belongs to the architecture phase. What belongs here is the
honest statement that we do not yet know the cost, and everything downstream assumes an
answer.

## What "spike-gated linear" means

Two words, two ideas:

- **Linear** — we do the understanding pass once (problem → spec → domain → contracts →
  architecture), then build slices in order. No repeated re-specification. This is
  legitimate *because* requirements and value are already settled.
- **Spike-gated** — a **spike** is a short, time-boxed experiment whose only output is an
  answer to one question. The code is thrown away on purpose. It is "gated" because the
  linear pass does not start until the spike has answered.

Why not pure linear: a linear plan would design the tracker around an assumption. If that
assumption is wrong, the tracker, the analytics view, and the reason the product exists all
collapse — on day 12, not day 1. One day spent proving it up front is cheap insurance.

Why not iterative or Lean MVP: both exist to discover *what to build* or *whether anyone
wants it*. Neither is in doubt here, so both would just add ceremony.

## The rule for the whole project

**Work is ordered by descending risk — never by convenience, never by layer.**
The scariest unknown goes first, every time, even when something easier would feel more
productive.

## Iterations expected

- One understanding pass (spine steps 1–6), time-boxed to **2 days**
- Then roughly 10 delivery slices
- No second understanding pass planned inside the 20 days

## Evidence that would make us switch models

- If the spike fails, or the tracker work overruns its estimate by more than 50% → we do
  not extend the deadline and do not loosen the model. We use the contingency ladder below.
- If Adil starts optimising for other people's adoption → dominant risk becomes value
  uncertainty, and the model should switch to Lean MVP.

## Contingency ladder

The deadline is fixed; scope is the variable. At 20 days the current scope roughly fits, so
these are **contingency, not plan** — agreed now, while calm, so the choice is never made
in a panic. Taken in this order:

1. **Browser tabs → desktop applications only.** Per-application time survives; per-domain
   breakdown is lost. Tab capture becomes a later client against an unchanged ingest
   contract.
2. **Open signup → multi-user schema with a single account.** Same tables, same per-user
   filtering; no signup flow, no email verification, no password reset. Upgrades later with
   no data migration.
3. **Lock-in session review UI → raw day view only.**
4. **X manual-assist publishing → cut.** Drafts get copied out by hand.

**Checkpoints:** end of day 4, day 9, day 14. At each, compare slices done against slices
left. If work left exceeds days left, descend one rung immediately — do not wait for the
next checkpoint and hope.

## Exit criteria for the understanding phase

- `00-process.md` through `05-architecture.md` drafted and signed off
- An ADR for every irreversible decision: stack, self-hosted auth, activity-capture
  architecture, LLM provider
- `slices.md` populated and risk-ordered
- Time-boxed to 2 days. Unresolved ambiguity becomes an open question in `slices.md`, never
  a blocker

## Hats

One hat per session, declared at the start. The architect's decisions become ADRs; the
coder does not renegotiate scope mid-slice; QA runs in a fresh session with no build
context. The growth-manager hat is **unused** — there is no acquisition goal.

## Known process risks

- **Adil is both the only user and the only builder.** Nobody else will notice a wrong
  assumption. So QA must genuinely run in fresh sessions, and the end-of-slice
  comprehension question is not optional.
- **Self-hosting plus self-hosted signup means owning operations** — TLS renewal, backups
  with a tested restore, restart-on-reboot, OS patching, and email deliverability. None of
  these appear on a feature list. Each can eat a day.
