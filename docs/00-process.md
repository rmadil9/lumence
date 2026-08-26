# 00 — Process

## Dominant risk

**Scope against a fixed deadline.**

- Not value uncertainty — Adil is the user, has the pain, and does not care about revenue or
  outside adoption for v1.
- Not requirement uncertainty — the behaviours are known and listable (`02-spec.md`).
- What remains: six product surfaces plus self-hosted signup plus whole-day activity
  tracking, against a hard **20-day** deadline at 10 h/day.

One item inside that scope is unproven: capturing which desktop application and which
browser tab has the user's attention all day, and getting it to the server. We do not yet
know its cost. Mechanism is not decided here — it belongs to `05-architecture.md`.

## Chosen model — linear (waterfall-lite)

- One understanding pass: problem → spec → domain → contracts → architecture.
- Then vertical slices, built in order, one at a time.
- No spike phase, no throwaway prototypes. Decided by Adil — see
  [ADR 0003](adr/0003-no-spike-phase.md).
- Legitimate here because requirements and value are both settled, and because the project
  is deliberately fast-moving.

## The rule for the whole project

**Work is ordered by descending risk — never by convenience, never by layer.**

This rule is what carries the unproven item. Activity capture is the riskiest thing in the
build, so it is designed early in `05-architecture.md` and sliced early — not left to the
back half where a surprise has nowhere to go.

## Iterations expected

- Understanding pass (spine steps 1–6): time-boxed to **2 days**
- Then roughly 10 delivery slices
- No second understanding pass inside the 20 days

## Evidence that would make us switch models

- Activity capture turns out to be materially harder than the architecture phase estimated →
  descend the contingency ladder. Do not extend the deadline.
- Adil starts optimising for other people's adoption → dominant risk becomes value
  uncertainty, and the model should switch to Lean MVP.

## Contingency ladder

The deadline is fixed; scope is the variable. At 20 days the current scope roughly fits, so
these are **contingency, not plan** — agreed now, while calm, so the choice is never made in
a panic. Taken in this order:

1. **Browser tabs → desktop applications only.** Per-application time survives; per-domain
   breakdown is lost. Tab capture becomes a later client against an unchanged ingest
   contract.
2. **Open signup → multi-user schema with a single account.** Same tables, same per-user
   filtering; no signup flow, no email verification, no password reset. Upgrades later with
   no data migration.
3. **Lock-in session review UI → raw day view only.**
4. ~~**X manual-assist publishing → cut.**~~ **Already spent.** X publishing was reduced to
   a plain link during the spec session ([ADR 0007](adr/0007-x-publishing-reduced-to-a-link.md)),
   so there is nothing left here to cut. Rungs 1–3 are the whole ladder now.

**Checkpoints:** end of day 4, day 9, day 14. At each, compare slices done against slices
left. If work left exceeds days left, descend one rung immediately — do not wait for the
next checkpoint and hope.

With no spike phase, these checkpoints are the only early-warning system the project has.
Skipping one removes the safety net entirely.

## Exit criteria for the understanding phase

- `00-process.md` through `05-architecture.md` drafted and signed off
- An ADR for every irreversible decision: stack, self-hosted auth, activity-capture
  architecture, LLM provider
- `slices.md` populated and risk-ordered
- Time-boxed to 2 days. Unresolved ambiguity becomes an open question in `slices.md`, never
  a blocker

## Hats

One hat per session, declared at the start. The architect's decisions become ADRs; the coder
does not renegotiate scope mid-slice; QA runs in a fresh session with no build context. The
growth-manager hat is **unused** — there is no acquisition goal.

## Known process risks

- **Adil is both the only user and the only builder.** Nobody else will notice a wrong
  assumption. QA must genuinely run in fresh sessions, and the end-of-slice comprehension
  question is not optional.
- **Self-hosting plus self-hosted signup means owning operations** — TLS renewal, backups
  with a tested restore, restart-on-reboot, OS patching, email deliverability. None appear on
  a feature list. Each can eat a day.
- **No spike means the activity-capture cost is discovered during the build, not before it.**
  Accepted tradeoff (ADR 0003). Mitigated only by risk-ordering and the checkpoints above.
