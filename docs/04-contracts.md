# 04 — Contracts (data schema + API surface)

> Status: **draft, part 1 of 3.** This is the **LOCK-IN POINT**. Once signed off, nothing here
> changes without an ADR (`CLAUDE.md`, human veto list).
>
> Written 2026-09-03 against the signed-off `02-spec.md` and `03-domain.md`. Every table and
> column traces to a spec line, a domain invariant, or an ADR. Unknowns are `TODO(adil):`.

**Terms, defined once:**
- **Primary key** — the column, or set of columns, that identifies a row. No two rows share it.
- **Foreign key** — a column holding another table's primary key, with the database refusing
  values that do not exist there.
- **Unique constraint** — a rule the database enforces that no two rows may share a value.
  Unlike a check in application code, it cannot be forgotten or raced past.
- **Partial unique constraint** — the same, but applied only to rows matching a condition.
- **Index** — a lookup structure that makes a particular query fast. Costs a little on write.
- **`timestamptz`** — a Postgres timestamp that knows it is in UTC. All instants use it.
- **`date`** — a calendar day with no time attached. Used for day boundaries only.

**Two conventions applied everywhere:**
- **Identifiers are UUIDs** (decided by Adil, 2026-09-03). Long random strings, safe to put in
  a URL — nobody can guess a neighbouring row or infer how many exist. Chosen over
  auto-incrementing numbers, which leak both.
- **All instants are stored in UTC.** Calendar days are derived in **one fixed timezone**,
  Adil's (spec E7). The timezone is configuration, in one place, never scattered.

---

# Part 1 — Data schema

## 1.0 Tables Better Auth owns

Better Auth ([ADR 0008](adr/0008-stack-single-nextjs-app-on-docker.md)) creates and manages its
own tables in our Postgres — `user`, `session`, `account`, `verification`. **We do not define,
alter, or write to them.** They give us:

- the user record, including whether the email is verified (spec A1, A2),
- the password credential and the Google identity as two rows pointing at one user (A6,
  [ADR 0011](adr/0011-account-linking-requires-a-verified-email.md)),
- browser sign-in state — the **auth session** (`03-domain.md` §1: never just "session").

Everything below references `user.id` as a foreign key and touches nothing else.

**Configuration this schema depends on, not a table:** account linking is set to require a
verified email, per ADR 0011. If that setting is wrong, invariant 7 is silently broken and no
table will notice.

---

## 1.1 `todo`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | foreign key → `user.id`, not null |
| `title` | text | not null (spec T1, T2) |
| `status` | enum | `pending` · `in_progress` · `completed` · `delayed` (T3) |
| `due_day` | date | not null. **The day the todo was created**, in the fixed timezone |
| `position` | double precision | not null. Fractional ordering — see below |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

- **Index:** `(user_id, due_day, position)` — this is the day's list, in order, and it is the
  most frequent read in the product.
- **`due_day` never changes** (invariant 8). There is no date picker in v1.
- **No status is final** — `completed` can go back to `pending` (Adil, 2026-09-02). The enum
  is a set of labels, not a one-way ladder.
- **Deletion is a real `DELETE`**, not a flag. Spec T5: gone permanently, no undo, no archive.

**Why fractional positions** (decided by Adil, 2026-09-03). Each todo holds a decimal. Dropping
one between positions `2.0` and `3.0` writes `2.5` — **one row changes, not the whole list.**
The alternative, renumbering `1, 2, 3…` on every move, rewrites every row after the drop point
and lets two open tabs fight over the result (spec T7 requires the order to hold across
devices).

- **The known cost:** repeatedly dropping into the same gap halves the decimal each time
  (`2.5`, `2.25`, `2.125`…) and eventually exhausts the precision a `double` can hold.
  **Decided (Adil, 2026-09-03): no automatic renumbering in v1.** A personal todo list will not
  reach the limit. If it ever does, renumbering one user's list is a small additive fix.

---

## 1.2 `lock_in`

One row per lock-in that currently exists. A **reset lock-in has no row** — it is deleted, not
flagged (spec L5, [ADR 0006](adr/0006-lock-in-is-a-plain-countdown.md)).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | foreign key → `user.id`, not null |
| `planned_duration_seconds` | integer | not null. Any value — no minimum, no maximum (L1) |
| `state` | enum | `running` · `paused` · `completed` |
| `started_at` | timestamptz | not null. When it was first started |
| `expires_at` | timestamptz | set while `running`, null otherwise |
| `remaining_seconds` | integer | set while `paused`, null otherwise |
| `completed_at` | timestamptz | set only when `completed` |
| `created_at` / `updated_at` | timestamptz | not null |

**The key idea — the countdown is not stored, it is derived.**
- While **running**, the row holds `expires_at`. Remaining time is `expires_at − now`, worked
  out fresh on every read. This is what makes spec L2 (survives a reload) and E5 (survives
  being signed out) true without any special handling: the browser holds nothing that matters.
- On **pause**, we compute `remaining_seconds = expires_at − now`, store it, and clear
  `expires_at`. Nothing is counting down any more, so the countdown genuinely **freezes** (L3).
- On **resume**, we set `expires_at = now + remaining_seconds` and clear `remaining_seconds`.
  It continues from exactly where it froze (L4), and a two-hour lock-in may span any amount of
  wall-clock time.

**Constraints:**
- **Partial unique constraint on `(user_id)` where `state IN ('running','paused')`.** This is
  domain invariant 11 — *at most one live lock-in per user* — enforced by Postgres rather than
  by application code. Spec L8 and edge case E2 (two tabs, double-click) become impossible
  rather than carefully handled. A second start fails at the database, whatever races.
- A check that exactly one of `expires_at` / `remaining_seconds` is set while not completed.
- **Index:** `(user_id, completed_at)` for listing completed lock-ins on a day (spec D4).

**Closing an expired lock-in — decided (Adil, 2026-09-03): both mechanisms.**
A row may say `running` with an `expires_at` already in the past, because nobody was looking
when the clock ran out.
- **Lazily, on the next read** — anything that loads the lock-in sees the expiry has passed and
  writes `completed` before answering. This makes it correct whenever it actually matters,
  because the only way to observe a lock-in is to read it.
- **And a scheduled sweep** — the same background job that handles spec T4 also closes expired
  lock-ins, so the record is right even when nobody looks.

The two together mean a finished lock-in is never missing from a day view, and the sweep is not
load-bearing if it fails.

---

## 1.3 `notepad`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | **primary key**, foreign key → `user.id` |
| `content` | text | not null, default `''` |
| `updated_at` | timestamptz | not null |

- **`user_id` is the primary key, not a plain column.** That single choice makes domain
  invariant 14 — *exactly one notepad per user, always* — impossible to violate. There is no
  `id`, because there is nothing to identify: the user *is* the identity of their notepad
  (spec N2).
- Plain text only (N3). No format column, because there is no format.
- Created together with the user, never deleted.
- Spec E6 (emoji, non-Latin text) is free — Postgres `text` is UTF-8.
- Spec E14 (a notepad growing to thousands of lines) is **LOG** in the spec, not built. Postgres
  `text` has no practical size limit, so nothing here fails; the concern is transferring the
  whole document on every save. **Not solved in v1, deliberately.**

---

## 1.4 `chat_quota`

The **only** thing stored about the LLM chat. There is no conversation table, no message table
(spec M4, domain §5).

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | foreign key → `user.id` |
| `day` | date | the calendar day, in the fixed timezone |
| `turns_used` | integer | not null, default 0 |

- **Primary key `(user_id, day)`.** One counter per person per day.
- Incremented **only when a turn succeeds** (Adil, 2026-09-02; invariant 15a). A reply that
  dies partway costs the user nothing and can be retried (spec M6, E4).
- The cap of 20 is **not** a column — it is one configured number
  ([ADR 0010](adr/0010-llm-provider-openai-behind-an-adapter.md)). Putting it in the table would
  imply per-user limits, which is a plan tier, which is v2 and Paddle.
- "Resets at the day boundary" (M5) needs no job: the next day is simply a different row.

---

## 1.5 `device`

One registered capture client ([ADR 0009](adr/0009-activity-capture-fixed-window-samples.md)).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key. **This is the `device` half of the activity key** |
| `user_id` | uuid | foreign key → `user.id`, **unique** |
| `name` | text | not null. What the user called it, e.g. "Laptop" |
| `token_hash` | text | not null, unique. **A hash of the device token, never the token** |
| `created_at` | timestamptz | not null |
| `last_seen_at` | timestamptz | null until the first successful upload |
| `revoked_at` | timestamptz | null unless revoked |

- **`user_id` is unique**, which enforces *one device per user in v1* (Adil, 2026-09-02;
  invariant 18a) in the database. Lifting the limit later is dropping one constraint — no
  migration, because `device_id` is already part of every activity sample's key.
- **We store a hash of the token, not the token.** The plain token is shown to the user exactly
  once, at creation, and never again — the same discipline as a password. If the database leaks,
  the tokens in it are not usable. ADR 0001 already records one credential leak in this
  repository's history; this is the lesson applied.
- **`revoked_at` is a column, not a delete.** Revoking must not destroy the activity samples the
  device already reported. A revoked device is refused at ingest; its history stays.

---

## 1.6 `activity_sample`

The high-volume table — roughly **2,400 rows per user per ten-hour day** (ADR 0009). Every other
table in this schema is tiny by comparison.

| Column | Type | Notes |
|---|---|---|
| `device_id` | uuid | foreign key → `device.id` |
| `box_start` | timestamptz | the start of the 15-second box, rounded down onto a fixed grid |
| `user_id` | uuid | foreign key → `user.id`. **Set by the server from the device token** |
| `application` | text | not null. The focused application, or `"Desktop"` for the bare desktop |
| `domain` | text | **nullable, and null is normal** — see below |
| `idle_seconds` | integer | not null. Seconds since the last keyboard or mouse input |
| `screen_locked` | boolean | not null |
| `received_at` | timestamptz | not null. When the server got it — for diagnosis only |

**Primary key: `(device_id, box_start)`.** This is the single most important line in the
schema. It is domain invariant 19, and it is what makes spec **E10** — the riskiest line in
`02-spec.md` — safe. A replayed backlog inserts with *"if this key exists, do nothing"*, so
sending the same batch fifty times leaves the same result as sending it once. There is no
surrogate `id` column, because the natural key already identifies the row and adding a second
identity would let duplicates in through the back door.

**`user_id` is stored on the row even though it could be reached through `device_id`.** Two
reasons, one of them non-negotiable: every day-view and lock-in-review query filters by user and
time, and joining 2,400 rows a day through `device` to do it is waste; and it makes the
per-user filter (spec A7) a condition on the table being read rather than on a join, which is
harder to get wrong. It is written by the server from the device token, never from the request
body (invariant 4).

**`domain` is nullable, and this is the seam.** It is empty whenever the focused application is
not a browser, and empty *always* if the browser extension was never built. Contingency ladder
rung 1 — dropping browser tracking — is therefore **not a schema change**: the column simply
stays null and the day view's domain panel is empty. Nothing migrates.

- **Index: `(user_id, box_start)`.** Serves the day view (D1, D2), the lock-in review (L7), and
  nothing else. Both queries are "this user, this time range".
- **Rows are never updated and never deleted** (invariants 21, 22). A sample is a fact about a
  moment that has already passed.
- **`received_at` exists only to make a wrong laptop clock visible.** Comparing it to
  `box_start` shows skew. Nothing in the product reads it, and no rule ever depends on it — a
  sample is filed by the time inside it, never by arrival (invariant 20).
- **No column says whether a sample is idle.** That is a rule, not a fact, and rules are applied
  when the day view is read (invariant 22, ADR 0009). Reading B (invariant 22a) needs
  `idle_seconds` and `screen_locked` and nothing more.

**Growth.** ~0.9M rows per user per year. Trivial for Postgres to store; the thing that matters
is that the day view **aggregates in the database** and never fetches rows into the app.
**Retention — decided (Adil, 2026-09-03): none. Keep everything.** Deleting history would make
the day view unable to answer questions about the past, which is the whole point of the
feature. Revisit only if disk becomes a real constraint on the VPS.

---

## 1.7 What is deliberately absent

Named so their absence reads as a decision rather than an oversight:

- **No time-entry or timer table.** Todos have no time ([ADR 0004](adr/0004-drop-per-todo-time-tracking.md)).
- **No chat message or conversation table.** Only the daily counter (spec M4).
- **No X draft, post, or status table.** Lumence stores nothing about X ([ADR 0007](adr/0007-x-publishing-reduced-to-a-link.md)).
- **No app category, whitelist, or score table.** The product never judges (ADR 0006).
- **No idle or away rows.** Idle is subtracted at read time and never displayed (spec D5).
- **No plan, tier, subscription, or price table.** v2, via Paddle.
- **No settings table.** Nothing in v1 is configurable per user.

---

## 1.8 Part 1 — resolved

All three questions closed on 2026-09-03: **no automatic renumbering** of todo positions;
**both** lazy-on-read and a scheduled sweep close an expired lock-in; **no retention policy** —
activity samples are kept indefinitely.

---

# Part 2 — API surface

> Drafted 2026-09-03. Every operation below is **scoped to the signed-in user**. There is no
> route anywhere in this product that reads or writes across users.

## 2.0 Rules that apply to every operation

These are stated once here and never repeated per route. If an operation below seems to be
missing a check, it is because it is in this list.

1. **The user is taken from the auth session, never from the request.** No operation accepts a
   user identifier as input. A request cannot name whose data it wants — it can only ask for
   "mine". This is spec A7 and edge case E8, and it is a property of the shape of the API, not
   a check that has to be remembered.
2. **A signed-out request is refused** and, on a page, redirects to sign-in (spec A4).
3. **An unverified user is refused on every app operation** (spec A1) — todos, notepad, chat,
   day view, devices, all of it. Verification and password-reset routes are Better Auth's and
   are naturally exempt.
4. **A request for something that is not yours is `404`, not `403`.** Telling someone "that
   exists but is not yours" confirms it exists. They get the same answer as for a row that was
   never there.
5. **Every response carries a request id**, and it appears in the structured log line for that
   request (`01-problem.md` success criterion 6). This is what makes a 2am problem traceable.
6. **Errors have one shape** across the whole surface: a machine-readable code and a message
   fit to show a person.
7. **Day parameters are `YYYY-MM-DD` in the one fixed timezone** (spec E7). The server converts
   to UTC instants at the boundary. No route accepts a timezone.

## 2.1 Where these operations live — Server Actions vs HTTP routes

A single Next.js app can expose server work two ways. A **Server Action** is a server function
the browser calls directly, with arguments and return values typed end to end and no URL to
design. An **HTTP route handler** is a conventional endpoint at a URL.

**Recommended split:**
- **Everything the Lumence user interface calls → Server Actions.** Less code, no hand-written
  fetch layer, and the types cannot drift because both sides are the same TypeScript project.
- **The tracker ingest endpoint → a real HTTP route** (part 3). It is called by a Python daemon,
  which cannot invoke a Server Action. It needs a stable URL and its own authentication.

**Decided (Adil, 2026-09-03): the split above.** Server Actions for everything the Lumence user
interface calls; a real HTTP route for ingest only. Rejected: conventional REST routes
throughout — more code to write and maintain, and its advantages (callable with `curl`, testable
from outside) matter only for the one surface that is already an HTTP route.

**This document defines the operations, not the transport.** The list is the contract either
way — the same inputs, the same rules, the same errors.

## 2.2 Authentication — owned by Better Auth

Sign up, verify by emailed link, sign in, sign out, request a password reset, complete a
password reset, and Google sign-in are **all provided by Better Auth**
([ADR 0008](adr/0008-stack-single-nextjs-app-on-docker.md)) at its own routes. We define none of
them and must not reimplement any of them.

Covers spec A1–A6. Two configuration facts this contract depends on:
- Account linking requires a verified email ([ADR 0011](adr/0011-account-linking-requires-a-verified-email.md)).
- Verification is a **link**, not a typed code (Adil, 2026-09-02; spec A2).

## 2.3 Todos

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **List todos for a day** | `day` | The day's todos in `position` order | T1, T6 |
| **Create a todo** | `id` (client-generated), `title` | The created todo | T1, T6, E3 |
| **Edit a title** | `id`, `title` | The updated todo | T2 |
| **Set a status** | `id`, `status` | The updated todo | T3 |
| **Move a todo** | `id`, `beforeId` and/or `afterId` | The updated todo | T7 |
| **Delete a todo** | `id` | Nothing | T5 |

- **The client generates the todo's UUID and sends it.** This is how spec **E3** — double-clicking
  create — is solved: the second click carries the same id, the insert says *"if it exists, do
  nothing"*, and one todo is created. It is the same trick as the activity ingest key, applied to
  a button. The alternative, the server generating the id, makes two identical todos and forces
  the client to guess which one to keep.
- **A new todo's `due_day` is today** and its `position` puts it at the end (T6). Neither is an
  input; there is no date picker in v1.
- **Move takes neighbours, not a number.** The client says *"put this between these two"* and the
  server computes the midpoint. Sending a raw position would make two tabs able to compute the
  same one.
- **Any status may be set from any status.** `completed` is not final (Adil, 2026-09-02).
- **Delete is permanent** — no undo, no archive (T5).
- **`delayed` is not set here.** A todo not completed by the end of its due day is flipped by the
  scheduled job (T4, E11), correctly whether or not the app was open. It can also be set by hand
  through *Set a status*.

## 2.4 Lock-in

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **Get the live lock-in** | — | The running or paused lock-in, or nothing | L2, L8 |
| **Start** | `id` (client-generated), `durationSeconds` | The running lock-in | L1, E3 |
| **Pause** | — | The paused lock-in | L3 |
| **Resume** | — | The running lock-in | L4 |
| **Reset** | — | Nothing | L5 |
| **Review a completed lock-in** | `id` | Per-application and per-domain totals inside its window | L7 |
| **List completed lock-ins on a day** | `day` | Their start and end times | D4 |

- **Pause, resume and reset take no id.** A user has at most one live lock-in (invariant 11), so
  there is nothing to identify. This removes a whole class of mistake: you cannot pause someone
  else's lock-in, or a stale one from another tab.
- **Start is idempotent** on the client-supplied id, closing E3 for the start button too. A
  second start with a *different* id while one is live is **refused** — that is spec L8, and the
  partial unique constraint in §1.2 enforces it even if two requests arrive at once.
- **There is no "end early" operation, deliberately** (ADR 0006). The absence is the contract.
- **Reset destroys.** It does not return a record, because there is no longer one (L5).
- **Remaining time is always computed by the server** from `expires_at`. The browser renders a
  countdown for smoothness but is never the source of truth — which is what makes L2 (reload) and
  E5 (signed out mid-lock-in) work.
- **Review is the same aggregation as the day view**, bounded by the lock-in's start and end
  instead of by a day. Same rules, including idle (§2.6).

## 2.5 Notepad

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **Get the notepad** | — | Content and its `updatedAt` | N1, N2 |
| **Save the notepad** | `content`, `updatedAt` | The new `updatedAt` | N1, E9 |

- **No create, no delete, no list.** There is exactly one and it always exists (N2).
- **Saving sends the whole content.** It is plain text and there is one of them; a diff or patch
  format would be machinery for no gain.
- **`updatedAt` is sent back with the save** so the server can tell whether it is writing over a
  version the client had not seen — two tabs, or a slow reply that arrived out of order.
  **Decided (Adil, 2026-09-03): last write wins, and the client is told.** The save succeeds, and
  the response says the version it replaced was not the one the client held, so the interface can
  warn rather than pretend nothing happened. Refusing the write instead would mean a person loses
  what they just typed, which spec E9 exists to prevent. Nothing in the spec covers two tabs on
  the notepad; this fills the gap in the direction E9 points.
- **Spec E9 — the connection dropping mid-save — is a client responsibility**, and the contract
  is what makes it possible: saving is **idempotent**, so the client can hold unsent text and
  retry until it is acknowledged. Sending the same content twice changes nothing.

## 2.6 Day analytics

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **Get the day** | `day` | Per-application totals, per-domain totals, and that day's completed lock-ins | D1–D4 |

- **One operation, one request.** The three panels are one view of one day, and splitting them
  would let them disagree with each other.
- **A day with no data returns empty lists, not an error** (D3). This is the normal case for any
  day before the daemon was installed.
- **All totals are aggregated in Postgres.** The app never pulls 2,400 rows a day into memory to
  add them up.
- **The five-minute idle rule is applied here, and only here** (ADR 0009, invariant 22). Reading
  B (invariant 22a): consecutive no-input samples are grouped into stretches, and **any stretch
  that reached five minutes is dropped whole** — including its first five minutes. A stretch in
  which the screen became locked is dropped whole as well.
- **Idle time is never returned as a category** (D5). It is subtracted and never named. The
  totals will therefore be less than the wall-clock day, and that gap is deliberate.
- **`domain` totals come only from samples that have one.** With no browser extension every
  sample's domain is null and this list is simply empty — contingency ladder rung 1 with no code
  change (§1.6).
- **No week, month, trend, or comparison operation exists** (D6). The absence is the contract.

## 2.7 Chat

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **Send a turn** | The whole conversation so far | The reply | M1, M2, M5, M6 |
| **Get today's remaining turns** | — | Turns used and the cap | M5, M12 |

- **The client sends the entire conversation every time**, because nothing is stored (M4). This
  is what makes M2 — a third message answered with turns 1 and 2 in context — work without a
  conversation table.
- **The cap is checked before calling the provider**, so a refused turn costs nothing (M5). The
  21st turn returns a clear, showable message, and the count resets at the day boundary simply
  by being a different row (§1.4).
- **The counter is incremented only on success** (invariant 15a). A failed reply is not charged
  and can be retried (M6, E12).
- **A failed turn returns an error, never a partial reply** (M6, E4). The reply is complete or it
  did not happen.
- **The OpenAI key is used server-side only** ([ADR 0010](adr/0010-llm-provider-openai-behind-an-adapter.md)).
  It never reaches the browser, in any form, ever.
- **No operation exists to read chat history**, because there is none.

## 2.8 Devices

| Operation | Input | Returns | Spec |
|---|---|---|---|
| **Get my device** | — | The device, or nothing | ADR 0009 |
| **Register a device** | `name` | The device **and the plain token, once** | ADR 0009 |
| **Revoke a device** | `id` | Nothing | ADR 0009 |

- **The plain token is returned exactly once**, in the response to registration, and is never
  retrievable again — only its hash is stored (§1.5). If it is lost, revoke and register again.
- **Registering a second device is refused in v1** (invariant 18a), enforced by the unique
  constraint on `device.user_id`.
- **Revoking does not delete the device or its samples.** It sets `revoked_at`, ingest starts
  refusing that token, and the history stays (§1.5).

## 2.9 Part 2 — resolved

Both questions closed on 2026-09-03: **Server Actions for the interface, an HTTP route for
ingest only**; notepad saves are **last-write-wins, with the client told** when it overwrote a
version it had not seen.

# Part 3 — Ingest contract for the tracker

> Drafted 2026-09-03. This is the seam [ADR 0003](adr/0003-no-spike-phase.md) warned about: it
> is being locked **before any capture client has run against it**, because the spike that would
> have priced it was cut. Everything here is therefore written to be forgiving — the failure
> modes matter more than the happy path.

## 3.0 What this contract is, and what it deliberately is not

**It is:** the one HTTP endpoint the Python daemon on Adil's laptop posts activity samples to.

**It is not** the link between the browser extension and the daemon. That conversation happens
entirely on Adil's laptop, over localhost, inside his own machine
([ADR 0009](adr/0009-activity-capture-fixed-window-samples.md)). It is **deliberately left
unspecified here** so it can change freely without touching anything the server knows about.
That freedom is the point of routing the extension through the daemon rather than to the VPS.

## 3.1 The endpoint

```
POST /api/ingest/activity
Authorization: Bearer <device token>
Content-Type: application/json
```

- **A real HTTP route**, not a Server Action (§2.1). A Python daemon cannot call a Server Action.
- **It does not use the auth session.** There is no cookie, no browser, no signed-in user. The
  device token is the only credential.
- **The server hashes the presented token and looks up the device** (§1.5). It never stores or
  compares plain tokens.
- **A revoked device is refused** — `revoked_at` set means every request fails from then on.
- **The user is resolved from the device.** The request body has no user field and never will;
  a body that contained one would be ignored, not honoured (invariant 4).

## 3.2 The request

```json
{
  "clientSentAt": "2026-09-03T14:32:10.412Z",
  "samples": [
    {
      "boxStart": "2026-09-03T09:15:00.000Z",
      "application": "Code",
      "domain": null,
      "idleSeconds": 3,
      "screenLocked": false
    }
  ]
}
```

| Field | Rule |
|---|---|
| `clientSentAt` | Required. What the laptop believed the time was when it sent. **Diagnostic only** — no behaviour depends on it |
| `samples` | Required. **1 to 500 entries**, oldest first |
| `boxStart` | Required, UTC, and **must fall exactly on a 15-second boundary**. Anything else is a daemon bug |
| `application` | Required, non-empty. `"Desktop"` for the bare desktop with nothing open (ADR 0009) |
| `domain` | Optional, and **null is the normal case** — present only when the focused application is a browser and the extension is installed |
| `idleSeconds` | Required, zero or greater. Seconds since the last keyboard or mouse input |
| `screenLocked` | Required boolean |

- **500 is the batch ceiling** so that replaying a long backlog never becomes one enormous
  request that times out halfway (ADR 0009).
- **Request bodies are capped** — **TODO(adil):** at what size. 500 samples is on the order of
  100 KB; a 1 MB cap leaves generous headroom and stops a malformed client from sending
  something absurd.
- **Ordering between batches is not required.** Each sample carries its own `boxStart`, so a
  batch about yesterday may arrive after a batch about today with no ill effect.

## 3.3 How duplicates are handled — the whole point

Every sample is inserted against the primary key **`(device_id, boxStart)`** with *"if this key
already exists, do nothing"* (§1.6).

- **A batch may be sent any number of times with the same result as sending it once.** This is
  spec **E10**, the riskiest line in `02-spec.md`, and it is answered by a key and one clause of
  SQL rather than by logic that reconciles overlapping time ranges.
- The case this exists for is not exotic: the server commits the batch, the acknowledgement is
  lost on a flaky connection, the daemon assumes failure and re-sends. Without the key that is a
  doubled day. With it, nothing happens.
- **Duplicates are a success, not an error.** They are counted and reported, never rejected.

## 3.4 The response

```json
{
  "requestId": "...",
  "accepted": 480,
  "duplicates": 19,
  "rejected": [{ "index": 12, "reason": "boxStart not on a 15-second boundary" }],
  "serverTime": "2026-09-03T14:32:11.002Z",
  "clockSkewSeconds": 0.6
}
```

- **`accepted` + `duplicates` + `rejected.length` always equals the number of samples sent.**
- **`serverTime` and `clockSkewSeconds` are returned on every request** so the daemon can log a
  warning when the laptop's clock has drifted. The server records the skew too. A wrong clock is
  thereby **visible** rather than quietly corrupting a day.

## 3.5 A bad sample must never wedge the backlog

**One invalid sample does not fail the batch.** Valid samples are accepted, invalid ones are
listed in `rejected`, and the response is a success.

This is the most important failure-mode decision in this contract. The alternative — rejecting
the whole batch because one sample is malformed — creates a **poison pill**: the daemon retries
the batch forever, it fails forever, and every sample behind it in the queue is stuck. Hours of
genuine activity would be lost behind one bad row. Accepting what is valid and reporting what is
not means the queue always drains.

**On a success response the daemon marks every sample in the batch as sent** — accepted,
duplicate and rejected alike. A rejected sample is rejected deterministically and would be
rejected again on every retry, so keeping it achieves nothing.

## 3.6 Errors, and what the daemon does about each

The daemon must treat these differently, or it will either wedge or lose data.

| Status | Means | The daemon must |
|---|---|---|
| `200` | Processed, possibly with rejections | **Mark the batch sent.** Move on |
| `400` | The request itself is malformed — not one sample, the whole envelope | **Not retry.** Log loudly; this is a bug in the daemon, and retrying cannot fix it |
| `401` | Unknown, revoked, or missing token | **Stop uploading and say so.** Keep buffering. Retrying will never help until a human re-registers the device |
| `413` | Body too large | **Not retry as-is.** Halve the batch size and try again |
| `429` | Too many requests | **Retry after backing off**, honouring any interval the response gives |
| `5xx` | The server failed | **Retry with increasing backoff.** Change nothing |
| network failure / timeout | Never reached the server, or the reply was lost | **Retry.** This is the case §3.3 makes safe |

**The rule underneath the table:** the daemon marks samples as sent **only** on a `200`. Every
other outcome leaves them buffered. It is always safe to send again; it is never safe to assume
a lost reply meant failure.

## 3.7 Clock skew

The laptop's clock can be wrong. Nothing here tries to correct it.

- **A sample is always filed by its own `boxStart`** (invariant 20). Arrival time is never used
  to decide which day a sample belongs to — that is what makes a six-hour backlog land in the
  hours it actually happened.
- **Skew is recorded and returned** (§3.4), so a broken clock shows up in logs instead of
  silently producing a wrong day.
- **Samples timestamped far in the future are rejected**, as a sanity guard against a badly wrong
  clock. **TODO(adil): how far is far.** My reading: reject beyond about 24 hours ahead. Tighter
  than that risks discarding real data from a mildly wrong clock; looser lets nonsense in. Old
  timestamps are **always** accepted, however old — that is the backlog case, and it is normal.

## 3.8 Rate limiting

- Normal operation is **one request per device roughly every 60 seconds** (ADR 0009).
- Backlog replay is faster and legitimately so: a six-hour backlog is about 1,440 samples, which
  is three batches, sent back to back.
- **TODO(adil): the limit.** My reading: generous per device — a few requests per second, enough
  that a replay never trips it — and rely on the token, not the rate limit, as the real defence.
  The device is authenticated; it is not an anonymous endpoint.

## 3.9 Versioning — the daemon updates on a different schedule from the server

The server is redeployed whenever Adil deploys. **The daemon is a separate program on his own
laptop and updates whenever he remembers.** They will therefore be different versions, routinely
and for long stretches.

**The policy that follows:**
- **The server must keep accepting requests from older daemons indefinitely.** It is the half
  that changes without warning.
- **Additive changes only** at this URL: new optional fields may appear; existing fields never
  change meaning and are never removed.
- **A genuinely breaking change gets a new path**, and the old one keeps working until Adil has
  confirmed every device has been updated.
- Nothing here needs building in v1 — but the URL is being locked now, and this is the rule that
  keeps it locked safely.

## 3.10 What the server never does

Stated plainly because each one is a rule that a future change could quietly break:

1. **Never trusts a user identifier from the client.** The user comes from the device token
   (invariant 4).
2. **Never files a sample by arrival time.** Only by `boxStart` (invariant 20).
3. **Never modifies or deletes a sample** once written (invariant 21).
4. **Never applies the idle rule at write time.** It stores facts; the day view applies the rule
   (invariant 22, ADR 0009).
5. **Never rejects a whole batch for one bad sample** (§3.5).
6. **Never returns a plain device token.** Only the hash is stored; the token is shown once at
   registration and never again (§1.5, §2.8).

## 3.11 Part 3 — open for Adil

1. **Request body size cap** — 1 MB? (§3.2)
2. **How far in the future is too far** for a `boxStart` — 24 hours? (§3.7)
3. **Rate limit per device** — generous, or a specific number? (§3.8)

All three are numbers, not shapes. None of them changes the schema, and all can be tuned after
the daemon has run for real — which, given ADR 0003, is exactly when we will first learn what
the right values are.

