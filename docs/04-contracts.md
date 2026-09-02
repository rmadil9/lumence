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

**This document defines the operations, not the transport.** The list below is the contract
either way — the same inputs, the same rules, the same errors. **TODO(adil): confirm the split**;
the alternative is conventional REST routes throughout, which is more code but easier to call
from outside the app, and easier to test with `curl`.

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
  version the client had not seen — two tabs, or a slow reply that arrived out of order. The
  client is told rather than silently losing keystrokes. **TODO(adil): what should happen on that
  conflict?** My reading: last write wins, but the client is told, so it can warn rather than
  fail. Nothing in the spec covers two tabs on the notepad.
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

## 2.9 Part 2 — open for Adil

1. **Server Actions for the user interface, HTTP routes only for ingest** — confirm, or use
   conventional REST routes throughout? (§2.1)
2. **Notepad save conflict** — two tabs, or an out-of-order reply. Last-write-wins with the
   client told, or something stricter? Not covered by the spec. (§2.5)

# Part 3 — Ingest contract for the tracker

> **Not yet drafted.** Batch size, idempotency key, clock-skew handling, backlog replay.
