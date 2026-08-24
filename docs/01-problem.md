# 01 — Problem

## Who has the pain

**Adil** — a solo developer building in public, working ~10 hours a day. He is the primary
user, the builder, and the only user v1 is designed for. This is stated deliberately, not
as a placeholder for a market segment.

TODO(adil): is there a *secondary* user you have in mind — other solo devs building in
public — or is v1 genuinely an audience of one? This changes nothing about v1's scope, but
it changes whether open signup is a real requirement or an exercise.

## The pain, stated concretely

Adil's working day generates six kinds of artefact — tasks, written notes, build-in-public
posts, LLM conversations, time spent per task, and time spent per application — and every
one of them currently lives in a different place. The cost is not that any individual tool
is bad; it is **fragmentation**:

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
why its feasibility is proven before anything is designed (`00-process.md`).

## What Adil does today instead

Uses separate, unintegrated tools for each of the six artefacts.

TODO(adil): name them. Knowing *specifically* what you are replacing tells us what "good
enough to actually switch" means for each surface — and where a v1 that is worse than your
current tool would make you quietly stop using Lumence.

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
6. Structured logs with request IDs exist, health checks pass, every endpoint has
   authorisation, and at least one alert would actually wake him.
7. **The real test:** Adil uses Lumence for seven consecutive days without falling back to
   the tool it replaced. This is the only criterion that measures whether the product
   works rather than whether it was built.

TODO(adil): criterion 7 sits past day 20. Accept it as a post-launch gate, or replace it?

## Non-goals for v1

Explicitly out, and not to be reopened mid-slice:

- **Revenue and subscription plans.** No billing, no payment processing, no pricing page,
  no plan tiers. Subscriptions are a v2 concern and will use **Paddle** when they arrive.
- **User acquisition.** No marketing site, no onboarding funnel, no analytics on visitors.
- **Hard enforcement.** The lock-in timer measures; it does not block or kill applications.
  Blocking is privileged system software and is out of scope.
- **Real X API posting.** Manual-assist only, behind a `Publisher` seam.
- Other platforms (LinkedIn et al.), mobile apps, offline-first sync, media attachments,
  team or collaboration features, and any analytics dimension other than time.

## Open questions, not blockers

- Whether "one timer running at a time" is a true invariant for how Adil actually works.
- Whether the browser-tab dimension survives the descope ladder.
- Whether v1 needs any LLM usage cap at all for cost control, given that plan tiers are
  deferred. A single global cap is not the same thing as a subscription tier.
