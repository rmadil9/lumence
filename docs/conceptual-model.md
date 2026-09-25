# Conceptual data model

> **Reviewed 2026-09-25 against the signed-off documents. Not adopted.** The session ran without
> `02-spec.md`, `03-domain.md` or `04-contracts.md` in context, so it re-derived a model that
> contradicts them in several places (todo statuses, "focus session" instead of the agreed word
> *lock-in*, per-user timezone against the one-fixed-timezone decision in E7, theme preference
> and names that are not in scope, credentials that Better Auth owns) and omits three subjects
> entirely (Device, the chat turn counter, and the whole idle mechanism). Phases 4 and 5 —
> relationships and scenario validation — were skipped, which are the phases that would have
> caught this.
>
> **Two ideas survived the review and were adopted on their own merits:**
> - `delayed` as a derived value rather than a stored status →
>   [ADR 0018](adr/0018-delayed-is-derived-not-stored.md). **Done.**
> - App and Domain as subjects in their own right, rather than text on every activity sample →
>   [ADR 0019](adr/0019-app-and-domain-become-their-own-tables.md). **Done, but scoped per user
>   and *not* per app** — the file's idea that `github.com` in Chrome differs from `github.com`
>   in Firefox was rejected.
>
> Kept as a record of the exercise. **Do not treat anything below as current.**

> Produced from a conceptual-data-modelling interview
> ([prompt](prompts/conceptual-data-modeling.md)). **Phases 4 (relationships) and 5
> (scenario validation) were skipped at Adil's request** — relationships below are only
> what surfaced incidentally while discussing characteristics, not properly tested. Treat
> this as a first pass, not a signed-off model.

## 1. Subjects

- **User** — the individual using the app.
- **Todo** — a task the user adds.
- **Focus session** — a countdown-timer deep-work block.
- **Note** — a single ongoing free-text scratchpad per user.
- **App** — an application observed on the user's machine (e.g. Chrome, Slack).
- **Domain** — a website visited inside a browser App (e.g. github.com inside Chrome).
- **Activity sample** — a 15-second observed slice of time, pointing at an App and
  optionally a Domain.

## 2. Characteristics

### User
- First name
- Last name
- Email
- Timezone
- Theme preference (dark/light)
- Password (credential)

### Todo
- Title
- Due date
- Status — stored values: `pending`, `cancelled`, `completed`
- "Delayed" — **derived**, not stored (due date passed, not cancelled/completed)

### Focus session
- Start time
- Duration (minutes set at start — also the plan, since it can't be shortened, only
  paused)
- Status: running / paused / completed (reaches 00:00:00)
- Cancelled sessions (never reach 00:00:00) are **not recorded at all**
- No individual pause events are stored (see Decisions)

### Note
- Content (free text block)
- Last-edited timestamp

### App
- Name
- Icon
- Belongs to exactly one User (not a shared/global catalogue)

### Domain
- Name (e.g. "github.com")
- Belongs to exactly one App
- Belongs to exactly one User

### Activity sample
- Timestamp (when it occurred)
- Duration (15 seconds)
- Belongs to exactly one App
- Optionally belongs to one Domain (only when the App is a browser and a domain was
  active)
- Belongs to exactly one User

## 3. Relationships (unconfirmed — Phase 4 skipped)

Plain-word relationships as they surfaced, none tested for "can either side exist
without the other" or cardinality edge cases:

- A User has many Todos.
- A User has many Focus sessions.
- A User has exactly one Note.
- A User has many Apps (each App belongs to one User only — not shared across users).
- An App has many Domains (only meaningful when the App is a browser).
- An Activity sample belongs to one App, and optionally one Domain within that App.
- Todos and Focus sessions are **not linked** to each other.

TODO(adil): all of the above need the proper Phase 4 treatment — one/many in each
direction, optional/mandatory each side.

## 4. Decisions taken, with reason

- **Activity sample kept as its own subject**, not a column on App. Reason: time-spent
  varies by app, by domain, and by time-of-day — a value that varies this many ways
  can't live as a single characteristic (the "hidden subject" tell).
- **Domain is scoped per App, per User** — the same domain visited in two different
  browser apps (e.g. github.com in Chrome vs. Firefox) is two separate Domain records,
  not one shared record. "Total time on github.com across apps" is a derived rollup by
  name, computed at query time — not stored.
- **App is scoped per User**, not a shared global catalogue — each user's "Chrome" is
  its own record.
- **Pause considered and rejected as a subject.** Pausing/resuming a Focus session can
  happen multiple times, which initially looked like a hidden-subject tell, but Adil
  confirmed paused time is never measured or subtracted — the timer just holds its
  remaining value and resumes from there. So pause/resume is runtime UI state, not a
  stored fact.
- **Todo's "delayed" status is derived**, computed from due date + status, not stored
  as its own value — the stored statuses are pending, cancelled, completed.
- **Cancelled Focus sessions are not recorded** — only sessions that reach 00:00:00
  count as a Focus session for history/analytics purposes.
- **Todo has no description field** — title only, no category/list grouping.
- **Note is a single ongoing scratchpad per user**, not a collection of many notes.

## 5. Open questions and assumptions

- TODO(adil): Phase 4 (relationships) not run — cardinality and optionality for every
  relationship above needs proper testing.
- TODO(adil): Phase 5 (scenario validation) not run — model has not been walked through
  real end-to-end scenarios.
- TODO(adil): does a User need any characteristic for auth provider (e.g. Google OAuth
  vs. email/password), given [ADR 0005](adr/0005-full-email-auth-plus-google-oauth.md)
  mentions both? Not asked in this session.
- TODO(adil): is there any idle/no-App time that needs representing (e.g. laptop
  locked, no active window)? Adil said a sample can never exist with no App, but the
  "what happens when there's genuinely nothing active" case wasn't scenario-tested.
