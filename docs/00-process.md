# 00 — Process

## Dominant risk and chosen model

Lumence's dominant risk is **scope against a fixed deadline, with one unresolved
technology question embedded inside it.** It is *not* value uncertainty: Adil is the
primary user, faces the pain himself, and has explicitly stated he does not care about
revenue or third-party adoption for v1 — so there is no "will anyone want this" question
left to retire. It is *not* requirement uncertainty either: the behaviours are known and
enumerable (see `02-spec.md`). What remains is that the chosen v1 surface — six product
areas, self-hosted auth with open signup, and whole-day activity tracking across both
desktop applications and browser tabs — estimates at roughly **18–19 working days against
a hard 15-day deadline**, and one line item in that estimate (desktop activity tracking
on Ubuntu GNOME/Wayland) rests on an API neither of us has used.

The chosen model is therefore **spike-gated linear**. Linear is legitimate here because
requirements and value are both settled — but a pure linear pass would design around an
assumption (that the focused window is observable) which, if false, invalidates the
tracker, the analytics dashboard, and half the reason the product exists. So one
time-boxed spike runs *before* design, answers that single question, and is thrown away.
Everything after it is a single understanding pass followed by risk-ordered vertical
slices.

**Iterations expected:** one pass through spine steps 1–6 (understanding), time-boxed to
**2 days**; then approximately 10 delivery slices. No second understanding pass is planned
before day 15.

**Evidence that would make us switch models:** if spike S1 fails, or if the tracker slice
overruns its box by more than 50%, we do not extend the deadline and we do not switch to a
looser model — we descend the descope ladder below. If, contrary to the stated goal, Adil
starts optimising for other users' adoption, the dominant risk becomes value uncertainty
and the model should switch to Lean MVP.

## The rule for the whole project

**Work is always ordered by descending risk, not by convenience and not by layer.**
The scariest unknown goes first, every time, even when a lower-risk task would feel more
productive.

## The descope ladder

The deadline is the fixed constraint; scope is the variable. These cuts are agreed **now**,
while calm, and taken in this order at the checkpoints below. Taking rungs 1 and 2 brings
the estimate to roughly 15 days with slack.

1. **Browser tabs → desktop apps only** (~1.5 days saved). Per-application time survives;
   per-domain breakdown is lost. Tab tracking becomes a v2 client against the same
   unchanged ingest contract.
2. **Open signup → multi-user schema with a single account** (~2 days saved). Identical
   tables and identical per-user query filtering; no signup flow, no email verification,
   no password reset, no transactional email to own. Upgrades to open signup later with
   zero data migration.
3. **Lock-in session review UI → raw day view only** (~0.5 days saved).
4. **X manual-assist publishing → cut** (~0.5 days saved). Notepad drafts get copied out
   by hand.

**Checkpoints:** end of day 3, end of day 7, end of day 11. At each, compare slices
completed against slices remaining. If remaining work exceeds remaining days, descend one
rung. Do not wait for the next checkpoint to hope.

## Exit criteria for the understanding phase

- `00-process.md` through `05-architecture.md` drafted and signed off by Adil
- Every irreversible decision has an ADR: self-hosting vs PaaS, self-hosted auth,
  tracker architecture, LLM provider adapter, and the discard of the v1 codebase
- `slices.md` populated and risk-ordered
- Time-boxed to 2 days. Unresolved ambiguity becomes an open question in `slices.md`,
  never a blocker.

## Hats

Per blueprint §5, one hat at a time, declared at the start of each session. The
architect's decisions are logged as ADRs; the coder does not renegotiate scope mid-slice;
QA runs in a fresh session with no build context. The growth-manager hat is **unused in
v1** — there is no acquisition goal.

## Known process risks

- **Adil is both the only user and the only builder.** There is no external party who will
  notice a wrong assumption. QA must therefore run in genuinely fresh sessions, and the
  comprehension question at the end of each slice is not optional.
- **Self-hosting plus self-hosted auth means owning credential security, TLS renewal,
  Postgres backups, and transactional email deliverability** — four operational surfaces,
  none of which appear in a feature list, all of which can consume a day.
