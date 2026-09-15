# Iterations — ordered delivery backlog

**WIP = 1.** Estimate in iterations, never hours. Ordered by **descending risk**, never by
convenience or by layer (`00-process.md`).

An **iteration** = one small end-to-end piece of working software — through every layer,
deployed. Not a layer, not a module. (Industry name: *vertical slice*.)

> Status: **drafted 2026-09-11** against signed-off `02-spec.md`, `03-domain.md`,
> `04-contracts.md` and drafted `05-architecture.md`.

---

## The ordering rule

Risk first. Two things carry real risk:
1. **Activity capture** — the only item never priced. The spike was cut
   ([ADR 0003](adr/0003-no-spike-phase.md)) and the checkpoints were dropped
   ([ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md)), so **noticing it
   overrun is now manual**.
2. **Deployment and operations** — TLS, backups, restart-on-reboot. Owned, not rented
   ([ADR 0002](adr/0002-self-host-on-a-single-vps.md)).

Everything else is known work.

---

## Backlog

### 0 — Walking skeleton
Browser → front-end → FastAPI → Postgres → back out → deployed HTTPS URL → CI green. Nothing else.
- Docker Compose: nginx, front-end, backend, postgres · Certbot issuing a real certificate
- **Proves the service boundary works before anything depends on it** ([ADR 0016](adr/0016-split-into-nextjs-bff-and-fastapi-backend.md))
- One trivial page reading one row
- Restart-on-reboot proven by actually rebooting
- **Done when:** a public HTTPS URL serves it and CI is green on `master`

### 1 — Auth
Spec A1–A7. Better Auth, stateless JWT ([ADR 0014](adr/0014-jwt-sessions-instead-of-database-sessions.md)).
- Sign up · verify by emailed link · sign in · sign out · password reset · Google OAuth
- Account linking requires a verified email ([ADR 0011](adr/0011-account-linking-requires-a-verified-email.md))
- Resend wired in ([ADR 0013](adr/0013-resend-as-the-email-relay.md)) — **needs the sending domain and SPF/DKIM**
- **Blocks everything after it.** Nothing else can be per-user until this exists

### 2 — Ingest endpoint + device registration
The server half of capture, built **before** the client. Contract is `04-contracts.md` part 3.
- `activity_sample` and `device` tables · register a device, token shown once, stored hashed
- `POST /api/ingest/activity` — batch, duplicate-ignore, partial accept, error codes
- **Done when:** `curl` can post a batch twice and the row count does not change
- **Why before the daemon:** it is testable without any desktop code, and it proves the riskiest
  design decision in the project

### 3 — GNOME Shell extension
**The real unknown.** Read the focused window on Wayland and publish it over D-Bus.
- **If this overruns badly:** escape hatch 1 — log in under X11, zero code (ADR 0009)
- **Done when:** a shell command prints the currently focused application

### 4 — Capture daemon
Python. Sample every 15s → local SQLite → upload batches.
- Sampler and uploader independent · idle seconds · screen-locked flag · **idle-inhibitor flag**
  (ADR 0015) · retry with backoff
- **Done when:** kill the network for an hour, restore it, and the hour appears correctly once

### 5 — Day analytics
Spec D1–D6. The payoff for iterations 2–4.
- Per-application and per-domain totals · day picker · empty state
- **The idle rules** (ADR 0015): locked → discard · under 5 min → count · over 5 min **with an
  inhibitor** → count · over 5 min without → discard
- **Reading B** governs the last two — group consecutive no-input samples into stretches and drop
  whole stretches that reached 5 minutes (invariant 22a). Gaps-and-islands SQL
- **Done when:** a real day of your own data looks right

### 6 — Todos
Spec T1–T7. Known work, no risk.
- CRUD · four statuses, none final · fractional positions for drag-and-drop
- Scheduler container: the `delayed` flip at the day boundary (T4, E11)

### 7 — Lock-in
Spec L1–L8. Countdown derived from `expires_at`, never stored.
- Start, pause, resume, reset · one live lock-in per user (partial unique constraint)
- Scheduler also closes expired lock-ins
- **Depends on iteration 5** — the review (L7) is the day-view aggregation with a different window

### 8 — Notepad + X link
Spec N1–N3, X1. Smallest iteration in the project.
- One scratchpad per user, autosave, plain text · a button that opens X in a new tab

### 9 — LLM chat
Spec M1–M6. OpenAI behind the adapter ([ADR 0010](adr/0010-llm-provider-openai-behind-an-adapter.md)).
- Not persisted — the client sends the whole conversation each turn
- 20 turns/user/day, counted **only on success** · no half-written reply on failure

### 10 — Operations hardening
The success criteria that are not features (`01-problem.md` 1–6).
- `pg_dump` on a timer, **restore actually performed**
- **Rollback actually executed once**, before it is needed
- Structured logs with request ids · health check
- Certificate renewal tested, not assumed
- No uptime alert — dropped 2026-09-11

---

## Deliberately spread out
Iteration 10 is a backstop, not the first time ops is touched. TLS, restart-on-reboot and CI land
in iteration 0; backups should land as soon as there is data worth losing.

---

## Contingency ladder — reminder
Not triggered by a clock (ADR 0012). Triggered by work turning out harder than it is worth:
1. Drop browser domains → iteration 4 shrinks, `domain` stays null, no schema change
2. Open signup → single account → iteration 1 shrinks sharply
3. Lock-in review → raw day view only → iteration 7 shrinks

---

## Open questions (not blockers)
- Resend sending domain + SPF/DKIM — **deferred by Adil**; iteration 1 cannot send real mail until it lands
- OpenAI model — needed by iteration 9
- Where backups go, off-host — needed by iteration 10
- **TODO(adil): non-negotiables** — what must never be traded away when the ladder is descended.
  Open since the spec session

---

## Retro lines
One line per completed iteration: what surprised us.
