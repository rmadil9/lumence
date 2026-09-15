# 00 — Process

## Dominant risk

**The unproven cost of activity capture.**

> Restated 2026-09-11. This was previously *"scope against a fixed deadline"*. There is no
> deadline ([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md)), so the risk
> that was always second is now first.

- Not value uncertainty — Adil is the user, has the pain, and does not care about revenue or
  outside adoption for v1.
- Not requirement uncertainty — the behaviours are known and listable (`02-spec.md`), and both
  `03-domain.md` and `04-contracts.md` are signed off.
- Not time — there is no deadline and no time budget.
- What remains: **whole-day activity capture is the one item in scope whose cost is unknown**,
  and the spike that would have priced it was cut ([ADR 0003](adr/0003-no-spike-phase.md)). Its
  ingest contract was locked in `04-contracts.md` before any client ran against it.

**Secondary risk: scope growing back.** With no clock, nothing external forces a cut. The
defence is now `02-spec.md` itself — its **Out** lists are explicit and it is signed off.

One item inside that scope is unproven: capturing which desktop application and which
browser tab has the user's attention all day, and getting it to the server. We do not yet
know its cost. Mechanism is not decided here — it belongs to `05-architecture.md`.

## Chosen model — linear (waterfall-lite)

- One understanding pass: problem → spec → domain → contracts → architecture.
- Then vertical iterations, built in order, one at a time.
- No spike phase, no throwaway prototypes. Decided by Adil — see
  [ADR 0003](adr/0003-no-spike-phase.md).
- Legitimate here because requirements and value are both settled, and because the project
  is deliberately fast-moving.

## The rule for the whole project

**Work is ordered by descending risk — never by convenience, never by layer.**

This rule is what carries the unproven item. Activity capture is the riskiest thing in the
build, so it is designed early in `05-architecture.md` and built early — not left to the
back half where a surprise has nowhere to go.

## Iterations expected

- One understanding pass — **essentially complete.** `00`–`04` drafted, `03` and `04` signed off
- Then roughly 10 delivery iterations, one at a time, WIP = 1
- No second understanding pass
- **No time-box on any of it** ([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md))

## Evidence that would make us switch models

- Activity capture turns out to be materially harder than `05-architecture.md` estimated →
  descend the contingency ladder.
- Adil starts optimising for other people's adoption → dominant risk becomes value
  uncertainty, and the model should switch to Lean MVP.

## Contingency ladder

**Re-framed 2026-09-11** ([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md)).
There is no deadline, so the ladder is no longer triggered by running out of time. It is now a
standing guide: **if a piece of work turns out harder than it is worth, this is the order in
which things get cut.** The most likely trigger is activity capture overrunning what it is
worth, since that is the one unpriced item. Agreed while calm, so the choice is never made
under pressure. Taken in this order:

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

**~~Checkpoints: end of day 4, day 9, day 14.~~ Dropped 2026-09-11
([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md))** — there are no days to
check against.

**The cost of dropping them, stated plainly.** [ADR 0003](adr/0003-no-spike-phase.md) cut the
spike and named these checkpoints as *"the only early-warning system the project has."* That
system is now gone. Risk-ordering survives — activity capture is still built early — but
nothing will tell Adil that capture is overrunning except **noticing it himself while building
it.** The ladder is still there to descend; there is simply no longer anything scheduled to
prompt the descent.

## Exit criteria for the understanding phase

- [x] `00-process.md` through `04-contracts.md` drafted; `03` and `04` **signed off**
- [x] An ADR for every irreversible decision — stack (0008), activity capture (0009), LLM
      provider (0010), account linking (0011), process (0012), email relay (0013)
- [x] `05-architecture.md` drafted
- [x] `iterations.md` populated and risk-ordered
- **No time-box** ([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md)).
  Unresolved ambiguity becomes an open question in `iterations.md`, never a blocker

## Hats

One hat per session, declared at the start. The architect's decisions become ADRs; the coder
does not renegotiate scope mid-iteration; QA runs in a fresh session with no build context. The
growth-manager hat is **unused** — there is no acquisition goal.

## Known process risks

- **Adil is both the only user and the only builder.** Nobody else will notice a wrong
  assumption. QA must genuinely run in fresh sessions, and the end-of-iteration comprehension
  question is not optional.
- **Self-hosting plus self-hosted signup means owning operations** — TLS renewal (nginx +
  Certbot, so renewal is ours to test), backups with a tested restore, restart-on-reboot, OS
  patching. Email deliverability is now Resend's
  ([ADR 0013](adr/0013-resend-as-the-email-relay.md)), which removes one of these. None of the
  rest appear on a feature list.
- **No spike means the activity-capture cost is discovered during the build, not before it.**
  Accepted tradeoff (ADR 0003). **Mitigated now only by risk-ordering** — the checkpoints that
  were the other half of that mitigation were dropped in ADR 0012.
- **Nothing external forces a scope cut any more.** `02-spec.md` and its **Out** lists are the
  only defence against sprawl. Reopening the spec is therefore more costly than it was.
