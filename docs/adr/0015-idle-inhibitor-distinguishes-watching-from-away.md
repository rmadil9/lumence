# ADR 0015 — An idle-inhibitor signal distinguishes watching from away

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-14
- **Amends:** signed-off `04-contracts.md` §1.6 and §3.2 (one new field), and `03-domain.md`
  §2 and invariant 22a. Supersedes the "logged, not built" disposition of the passive-media
  limitation in [ADR 0009](0009-activity-capture-fixed-window-samples.md).

## Context
Adil worked three concrete cases from first principles:

1. He walks away; the screen blanks after two minutes.
2. Someone walks away; their screen never blanks, because of their settings.
3. Someone watches a film, giving no keyboard or mouse input at all.

**Two premises had to be corrected before the cases could be reasoned about:**
- **A blanked screen does not stop sampling.** Blanking only switches the display off. The
  daemon is an ordinary program and keeps running. Only **sleep** stops it, and sleep produces
  no rows at all — which is why absence and idleness are never confused (spec E13).
- **Locked is not asleep.** A locked machine is awake with a password prompt on screen, so it
  still produces samples; a sleeping machine produces none.

With those corrected, the three cases turn out to be **indistinguishable in the data we
currently record**. All three produce a run of samples whose `idle_seconds` climbs steadily.
Two of them are the user being absent; one is the user present and watching. The existing
five-minute rule discards all three, so case 3 loses genuinely engaged time — the limitation
ADR 0009 logged and chose not to fix.

## The signal
A media player asks the desktop not to blank the screen while it is playing. That request is an
**idle inhibitor** — a standard desktop mechanism, readable over D-Bus, and the reason a screen
stays lit through a film. It is present in case 3 and absent in cases 1 and 2.

**It is therefore the discriminator**, and notably the *blanking itself is not*: whether the
screen actually went dark depends on per-machine settings and power source, which is exactly
why it cannot be a rule. Cases 1 and 2 collapse into a single rule once the inhibitor, rather
than the blank, is what we look at.

## Options considered
1. **Keep the passive-media limitation logged and unfixed** — the ADR 0009 disposition. Rejected
   now that its cost is understood: a day spent reading and watching reads as far emptier than
   it was, and this product exists to make a focus claim checkable. A checker that
   systematically undercounts attention is a worse checker.
2. **Infer presence from the screen not blanking.** Rejected: the blank timeout differs per
   machine, per user and per power source, and can be switched off entirely.
3. **Record whether an idle inhibitor is active, and treat it as evidence of presence —
   chosen.**

**I previously advised against fixing this, calling it real work competing with the riskiest
iteration. That was over-cautious and is corrected here:** it is one additional D-Bus read in
the daemon, on the same bus it already queries for the screen-lock flag.

## Decision

**One new fact per sample: `idle_inhibited`** — whether any application is currently asking the
desktop to stay awake. Recorded as a raw fact, like every other field; no rule is applied at
write time (ADR 0009, invariant 22).

**The day view applies these rules, in order:**

| # | Condition | Outcome | Example |
|---|---|---|---|
| 1 | Screen locked | **Discard** | Locked before lunch; VS Code still focused. Locking is unambiguous — no five-minute wait |
| 2 | `idle_seconds` < 300 | **Count** | Reading a paragraph, untouched for 40 seconds |
| 3 | `idle_seconds` ≥ 300 **and** `idle_inhibited` | **Count** | A 20-minute tutorial, nothing touched. The inhibitor is the evidence of presence |
| 4 | `idle_seconds` ≥ 300, no inhibitor | **Discard** | Away for coffee 25 minutes with Slack in front |

**Reading B still governs rules 2 and 4** (invariant 22a, decided 2026-09-02). The decision is
made about a **stretch**, not about each sample alone: a gap only counts under rule 2 if the
stretch **ends** before five minutes. A stretch that reaches five minutes is discarded whole,
including its opening five minutes. Rule 3 exempts a stretch from that entirely.

## Consequences
- **The one case where the day view lied badly is fixed.** Watched and listened-to time is now
  attributed instead of erased.
- **A signed-off contract changes**, which is why this ADR exists. One nullable-free boolean
  column on `activity_sample` and one field in the ingest body. No existing row changes meaning;
  samples recorded before this shipped simply lack the signal and fall back to rules 1, 2 and 4 —
  the behaviour they have today.
- **A known imperfection, accepted:** some applications inhibit idle while compiling, downloading
  or copying files. Those stretches will count as present when the user is away. It is rarer than
  watching video and errs toward over-counting rather than under-counting, which is the safer
  direction for a tool whose totals are already deliberately lower than the wall clock.
- **The daemon reads one more D-Bus property per sample.** Negligible; it already queries the
  same bus for the screen-lock state.
- **The threshold and the rules remain changeable**, because nothing is discarded at write time.
  That property is why this fix was cheap to add after the fact rather than a re-processing job.

## What would make us revisit
Inhibitor-based over-counting proving noisy in real use — long compiles being credited as
attention. The answer would be to narrow which inhibitor flags count, not to remove the signal.
