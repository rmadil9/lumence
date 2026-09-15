# 01 — Problem

## Who has the pain

**Adil** — a solo developer building in public, working ~10 hours a day. He is the primary
user and the builder.

**v1 is built for real users, not for an audience of one.** Open signup is a genuine
requirement, not an exercise: other people can sign up and use it. Adil is simply the first
user and the one whose pain defines the scope.

## The pain, stated concretely

Adil's working day generates five kinds of artefact — tasks, written notes, build-in-public
posts, LLM conversations, and time spent per application — and every one of them currently
lives in a different place. The cost is not that any individual tool is bad; it is
**fragmentation**:

- Context-switching between tools to do one coherent thing (finish a task → write about it
  → post it).
- No single record of where a day actually went, so there is nothing to reason about
  afterwards.
- Intentions ("I will focus for three hours") have no evidence attached, so there is no way
  to know whether they held.

The specific insight worth naming, because it is the only genuinely non-obvious thing in
the product: **whole-day activity tracking is what gives the lock-in timer meaning.** A
focus timer on its own is a stopwatch plus an honour system, and a dozen apps ship one. A
focus timer whose claim can be checked against where the attention actually went is a
different product. The tracker is the spine of the idea, not an accessory to it — which is
why it is built first (`00-process.md`).

Since per-todo time tracking was cut ([ADR 0004](adr/0004-drop-per-todo-time-tracking.md)),
the lock-in session is the **only** thing in v1 that ties a stated intention to measured
reality. That makes the insight above load-bearing rather than merely interesting.

## What Adil does today instead

One LibreOffice document on Ubuntu, plus three browser tabs:

| Artefact | Tool today | What Lumence must beat |
|---|---|---|
| Tasks | A LibreOffice doc — writes the day's plan into it each morning | Must be at least as fast to open and type into as a document already on screen |
| Time per task | **Nothing.** No habit exists | — cut from v1, see ADR 0004 |
| Focus timer | Google's stopwatch/timer in a browser tab | Must behave like the Google timer: type a number, it counts down. No ceremony |
| Notes | The same LibreOffice doc | One scratchpad, always there, never asks to be saved |
| LLM writing | Copy-paste out of LibreOffice into ChatGPT, refine, copy back | Must not be *more* steps than copy-paste into ChatGPT already is |
| Posting | Open X, paste, post | Must not add friction to something that is already two actions |

**The switching test, in Adil's words:** he stops using Lumence if the user experience is
poor, or if it does not save time relative to what he does today. Every surface above is
replacing something that costs approximately zero to use right now. That is the bar.

## Success criteria

Stated goal, in Adil's words: *"build a SaaS product end to end, deployable, fully
functional."* Money and third-party adoption are explicitly not success criteria.

Made measurable — v1 succeeds if, by day 20:

1. The app is reachable at a public HTTPS URL, self-hosted on the VPS, and survives a
   reboot without manual intervention.
2. All in-scope behaviours in `02-spec.md` work end to end.
3. CI is green on `master`, and the deploy is triggered by a documented, repeatable command.
4. A database backup has been taken **and restored** — the restore actually performed, not
   just scripted.
5. A rollback has been executed once in practice, by Adil, before it is ever needed.
6. Structured logs with request IDs exist, health checks pass, and every endpoint has
   authorisation. ~~At least one alert would actually wake him.~~ **The alert requirement was
   dropped by Adil on 2026-09-11** — accepted consequence: the site going down is noticed the
   next time he opens it, not sooner.

**7. The post-launch gate:** Adil uses Lumence for seven consecutive days without falling
back to LibreOffice, the Google timer, or ChatGPT-by-copy-paste.

Criterion 7 is deliberately **not** a day-20 gate, and cannot be — a product cannot be used
for seven days on the day it ships. Criteria 1–6 measure whether it was *built*. Criterion 7
is the only one that measures whether it *works*. It is checked at day 27 and does not block
sign-off at day 20.

## Non-goals for v1

Explicitly out, and not to be reopened mid-iteration:

- **Revenue and subscription plans.** No billing, no payment processing, no pricing page,
  no plan tiers. Subscriptions are a v2 concern and will use **Paddle** when they arrive.
- **User acquisition.** No marketing site, no onboarding funnel, no analytics on visitors.
- **Hard enforcement.** The lock-in timer measures; it does not block or kill applications.
  Blocking is privileged system software and is out of scope.
- **Judging focus.** No productive/unproductive classification, no focus score
  ([ADR 0006](adr/0006-lock-in-is-a-plain-countdown.md)).
- **Per-todo time tracking** ([ADR 0004](adr/0004-drop-per-todo-time-tracking.md)).
- **X publishing beyond a link** ([ADR 0007](adr/0007-x-publishing-reduced-to-a-link.md)).
- Other platforms (LinkedIn et al.), mobile apps, offline-first sync, media attachments,
  team or collaboration features, and any analytics dimension other than time.

## Resolved during the scope interview (2026-08-26)

- **"One timer running at a time"** — moot for todos, which no longer have timers. It holds
  for lock-in sessions: one active session per user (spec E2).
- **LLM cost control** — a single global cap of **20 chat turns per user per day**. Not a
  plan tier; tiers remain v2/Paddle.
- **Idle time** — excluded from the day view after 5 minutes of no input, and never
  displayed as its own category (spec D5).

## Open questions, not blockers

- Whether the browser-tab dimension survives the descope ladder.
- TODO(adil): **non-negotiables** — what must never be traded away when the ladder is
  descended. Belongs in `docs/preferences.md`.
