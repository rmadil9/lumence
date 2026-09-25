# ADR 0019 — App and Domain become their own tables, scoped per user

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-25
- **Amends:** signed-off `04-contracts.md` §1.6 and §3.2, and `03-domain.md` §2.
- **Source:** the second surviving idea from the conceptual-modelling session
  (`conceptual-model.md`), decided on its own merits after review.

## Context
`04-contracts.md` §1.6 stores the focused application and the browser domain as **plain text on
every activity sample** — roughly 2,400 rows per user per working day, each carrying the string
again.

The conceptual-modelling session proposed making both into subjects in their own right. That
session's related proposal — scoping a domain *within* an app, so `github.com` in Chrome and
`github.com` in Firefox are two different records — **was rejected first.** The file itself
conceded that a cross-app total would then be "a derived rollup by name, computed at query
time", which is splitting the data and un-splitting it on every read. Spec D2 asks for time per
domain, singular. A domain is a domain.

## Options considered
1. **Keep both as text** — one table, no join, and the day view is a single `GROUP BY`.
   **I recommended this and was overruled.** The argument, recorded: nothing in spec D1 or D2
   needs anything about an app beyond its name and a number, so the second table earns nothing
   and costs a join on every read. On storage, text costs roughly 21 MB per user-year against
   7 MB for integer references — a difference of ~14 MB on a 100 GB disk, which is not a reason.
2. **App and Domain as their own tables, referenced by id — chosen.**

### Shared catalogue, or per user?
The deciding rule for this class of product:

> A shared catalogue exists to hold **shared knowledge** about an app. No shared knowledge, no
> reason to share the table.

Products that classify applications as productive or unproductive need a global catalogue,
because that judgement is the same for every user and has to live in one place. Trackers that
do not classify simply record the name.

[ADR 0006](0006-lock-in-is-a-plain-countdown.md) put Lumence firmly in the second group: the
product never classifies, scores, or categorises anything. **The one thing a global catalogue is
for, this product does not have.** Adil chose per-user.

## Decision
- **Two new tables, `app` and `domain`.** An activity sample references them by id rather than
  carrying their names.
- **Both are scoped per user.** One person's "Chrome" and another's are separate rows.
- **Rows are created automatically on first sight.** When the daemon reports a name the server
  has not seen for that user, the server creates the row and carries on. The daemon never learns
  that ids exist — it keeps sending names, and the ingest contract's request body is unchanged.
- **A domain is a domain.** It is scoped to the user, **not** to the app it was seen in.
  `github.com` is one row however many browsers reach it.
- The `domain` reference stays **optional**, exactly as the text column was. Null remains the
  normal case, and contingency ladder rung 1 — dropping browser tracking — still costs nothing.

## Consequences
- **The hot path gains a step.** Ingest must now resolve each name to an id before inserting the
  sample, on the highest-volume write in the system. It is a lookup on a tiny per-user table and
  will be cached in practice, but it is work the text column did not do.
- **A race to create the same app, and the fix for it.** Two samples naming a new app can arrive
  together and both try to create it. The table needs a **unique constraint on (user, name)** and
  the create must be an upsert — *insert, and if it already exists, take the existing row*. This
  is the same discipline as the sample key itself: make the repeat harmless rather than try to
  prevent it.
- **Every read now joins.** The day view (D1, D2) and the lock-in review (L7) must join to get
  names back. Cheap against dozens of rows; it is simply work option 1 did not do.
- **Invariant 1 survives** — every row in the schema still belongs to exactly one user. A global
  catalogue would have been the first exception in the whole product.
- **There is now somewhere to put an icon or a display name**, which is what the second table
  genuinely buys. Nothing in v1 uses it.
- **Renaming is now possible and was not before.** With text on 2,400 rows a day, correcting a
  name meant rewriting history. With a reference, it is one row. Not a v1 feature, but it is the
  door this opens.
- **Storage drops by roughly 14 MB per user-year.** Recorded for completeness; it did not decide
  anything.
- **`04-contracts.md` changes, and `03-domain.md` gains two subjects.** The ingest contract's
  wire format does **not** change — the daemon still sends names — so no deployed client is
  affected.

## What would make us revisit
Wanting shipped defaults — a known-app icon set, say — which would want a global table alongside
the per-user rows. That can be added later without touching anything decided here.
