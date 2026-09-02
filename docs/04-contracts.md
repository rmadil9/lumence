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
  (`2.5`, `2.25`, `2.125`…) and eventually exhausts the precision a `double` can hold. The fix
  is a rare renumber of that user's list. **TODO(adil):** whether v1 renumbers automatically at
  a threshold or leaves it. My reading — leave it; a personal todo list will not reach it.

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

**Open — this one needs your answer, it is behavioural:**
**TODO(adil): who notices that a running lock-in has reached zero when nobody is looking?**
The row says `running` with an `expires_at` in the past. Two ways:
- **Lazily, on the next read** — anything that loads the lock-in sees the expiry has passed and
  writes `completed`. Nothing extra to build. But a lock-in finished at 14:00 is not a record
  until someone opens the app, so the day view is briefly wrong if read by something else first.
- **A scheduled sweep** — the same background job that handles spec T4 also closes expired
  lock-ins. Always correct, one more thing running.
My reading: **do both.** Lazy on read makes it correct whenever it matters; the sweep makes it
correct even when it does not.

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
**TODO(adil):** whether v1 has any retention policy at all. My reading: none — keep everything,
revisit if it ever matters.

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

## 1.8 Open in part 1 — for Adil

1. **Fractional-position renumbering** — automatic at a threshold, or left alone? (§1.1)
2. **Who closes an expired lock-in** — lazily on read, a scheduled sweep, or both? (§1.2)
3. **Activity-sample retention** — keep everything forever in v1? (§1.6)

---

# Part 2 — API surface

> **Not yet drafted.** Every route, scoped to the authenticated user.

# Part 3 — Ingest contract for the tracker

> **Not yet drafted.** Batch size, idempotency key, clock-skew handling, backlog replay.
