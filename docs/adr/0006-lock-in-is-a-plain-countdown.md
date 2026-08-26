# ADR 0006 — The lock-in session is a plain countdown, and does not judge focus

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-26

## Context
The seed scope described the lock-in session as a 1–4 hour block with an "end early" exit
and an afterwards-review showing "where the time actually went", which implied some notion
of focused versus unfocused time — a whitelist of permitted applications, a default set, or
a score.

That notion is where focus apps usually go wrong, and it is also where the effort is: the
classification is subjective, it needs configuration, and it is wrong often enough to be
distrusted.

## Options considered
1. **Whitelist per session** — the user names permitted apps; the review reports adherence.
   Rejected: configuration burden on every session, and it is guesswork.
2. **A default productive/unproductive classification** shipped with the product.
   Rejected: it would be wrong for this user, and maintaining it is unbounded work.
3. **No classification. Show the raw breakdown; the user judges it.** Chosen.

Separately, on the timer's own shape, Adil asked for it to behave exactly like the Google
timer: type any duration, count down, pause, resume, reset.

## Decision
- The lock-in timer takes **any duration**. The 1–4 hour bounds are removed.
- Its controls are **pause, resume, reset**. There is no "end early".
- **Reset discards the session entirely** — nothing is stored, and it appears in no review
  or day view.
- A session is stored **only** when the clock reaches 00:00:00.
- The review shows **time per application and per browser domain within the session window**
  and nothing else. No focus score, no adherence percentage, no productive/unproductive split.

## Consequences
- **Sessions are all-or-nothing.** Reset means the record is gone. A session abandoned at
  90% leaves no trace, and the day view will show the underlying activity without a session
  attached to it. Accepted deliberately: Adil does not want partial sessions in his history.
- **The product never tells the user they did badly.** It shows them where their attention
  went and stops. This is a smaller build and a more honest one.
- **No configuration surface** for whitelists or categories — a whole settings area avoided.
- **Unbounded durations** mean the review and day view must cope with a session of any
  length, including one that crosses midnight (spec E7).
- **Reversible.** Classification could be layered on later over unchanged session and
  activity records.

## What would make us revisit
Adil finding the raw breakdown too noisy to draw a conclusion from. The first answer would
be better presentation, not a scoring system.
