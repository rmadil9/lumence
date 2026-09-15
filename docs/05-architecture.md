# 05 — Architecture

> Status: **draft for Adil to review.** Written 2026-09-11.
>
> Almost nothing here is a new decision. The stack came from
> [ADR 0008](adr/0008-stack-single-nextjs-app-on-docker.md), activity capture from
> [ADR 0009](adr/0009-activity-capture-fixed-window-samples.md), the hosting model from
> [ADR 0002](adr/0002-self-host-on-a-single-vps.md), and the data and API shapes from the
> signed-off `04-contracts.md`. This document assembles them into **what runs where, and what
> is allowed to talk to what.** Where something genuinely was not decided before, it says so.

**Terms, defined once:**
- **Container** — an application packaged with its dependencies so it runs the same anywhere.
- **Docker Compose** — one file describing several containers and how they start together.
- **Reverse proxy** — the program in front of everything: it takes requests from the internet,
  handles HTTPS, and passes them inward.
- **Internal network** — a private network Docker creates between containers. Nothing outside
  the host can reach it.
- **Trust boundary** — the line past which you stop believing what the other side tells you.

---

## 1. Components

### 1.1 On the VPS — inside Docker Compose

| Component | What it is | What it does |
|---|---|---|
| **nginx** | Reverse proxy | The **only** thing exposed to the internet. Terminates HTTPS and forwards inward |
| **Certbot** | TLS certificate tool | Obtains and renews the HTTPS certificate. Ours to run, because nginx does not do it itself (ADR 0008) |
| **app** | The Next.js application | The whole product: user interface, Server Actions, and the one ingest HTTP route |
| **postgres** | The database | Every table in `04-contracts.md`, plus the tables Better Auth owns |
| **scheduler** | A small recurring job runner | The day-boundary work — see §1.2 |
| **backup** | A scheduled `pg_dump` | Database snapshots to disk (§4.2) |

**One application, one deploy.** ADR 0008 chose a single Next.js project rather than a separate
API, so there is no service-to-service traffic inside the product at all. The user interface and
the server code are the same deployable thing.

**Sign-in state is carried by a stateless JWT** — [ADR 0014](adr/0014-jwt-sessions-instead-of-database-sessions.md),
which supersedes the session-storage half of ADR 0008. A **JWT** (JSON Web Token) is a signed
token the browser holds which *asserts* who the user is, so the server verifies the signature and
needs no database lookup.

- **What it buys:** no lookup per request, and a shape that carries over if the product ever runs
  on more than one server. Adil chose it to design toward that.
- **What it costs, and this is not small: a JWT cannot be withdrawn once issued.** It is valid
  until it expires. Signing out deletes the cookie, so *that browser* is signed out and spec A4
  is satisfied — but a copy of the token taken beforehand keeps working. A password reset (A5)
  likewise cannot end tokens already issued.
- **Therefore token lifetime must be short**, because expiry is the only thing that ends a
  token's life. **TODO(adil): how short.**
- **Device tokens are a separate mechanism and are unaffected** — still hashed, still individually
  revocable (`04-contracts.md` §1.5).
- I recommended database sessions and was overruled; the reasoning is preserved in ADR 0014.

### 1.2 The scheduler — the one thing this document actually decides

Two behaviours need something running on a timer, with nobody watching:

- **Spec T4 / E11** — a todo not completed by the end of its due day becomes `delayed`, and this
  must be correct *whether or not the app was open at midnight*.
- **Lock-in sweep** — closing a lock-in whose `expires_at` has passed while nobody looked
  (`04-contracts.md` §1.2, where "both mechanisms" was decided).

`CLAUDE.md` has carried this as `TODO(adil)` since the stack ADR: a scheduled TypeScript job in
the same repository, or a separate Python process.

**Recommendation: a TypeScript job in the same repository, run as its own container from the
same image as `app`.**

- **One schema, one language.** A Python process would need its own view of the database, so the
  schema would live in two places — Prisma's schema file and whatever Python used — and they
  would drift. Everything ADR 0008 bought by choosing one language is spent on this one job.
- **Its own container, not a thread inside `app`.** If it ran inside the web application it would
  compete with user requests, and it would run twice the moment anything runs two copies of the
  app. A separate container makes it one process doing one thing.
- **Same image, different command.** No second build, no second dependency set.

**Confirmed by Adil, 2026-09-11: the scheduler stays.** The alternative — resolving stale state
**lazily on read**, where the next read notices the day has turned and fixes it before answering
— would also satisfy spec T4, since a todo only ever *shows* as `delayed` when someone looks. It
was put to Adil and he chose the scheduler.

- **What the scheduler buys:** no read path has to remember to resolve stale state. Miss one path
  under the lazy approach and it quietly shows wrong data.
- **What it costs:** one more container, one more thing that can fail.

This matches signed-off `04-contracts.md` §1.2, which specifies both mechanisms. Nothing reopens.

### 1.3 On Adil's laptop — outside the server perimeter

| Component | Language | What it does |
|---|---|---|
| **GNOME Shell extension** | JavaScript | Runs *inside* the desktop process and publishes which window has focus over D-Bus. The only route available, because the laptop runs Wayland (ADR 0009) |
| **Capture daemon** | Python | Samples every 15 seconds, writes to a local SQLite file, uploads batches to the VPS. Reads three facts from the desktop over D-Bus: the focused window, the screen-lock state, and whether an application is holding the desktop awake ([ADR 0015](adr/0015-idle-inhibitor-distinguishes-watching-from-away.md)) |
| **Browser extension** | JavaScript | Reports the active tab's domain to the daemon over localhost |

**These are a second deployable thing** with their own install and update story. They are not
covered by the VPS deploy, and they will routinely be a different version from the server —
which is why `04-contracts.md` §3.9 requires the server to keep accepting older daemons.

### 1.4 Outside services

| Service | Used for | Reached from |
|---|---|---|
| **Resend** | Verification and password-reset email ([ADR 0013](adr/0013-resend-as-the-email-relay.md)) | The app, server-side only |
| **OpenAI** | The chat surface ([ADR 0010](adr/0010-llm-provider-openai-behind-an-adapter.md)) | The app, server-side only, behind the adapter |
| **Google** | OAuth sign-in (ADR 0005) | The app and the user's browser |

**No API key for any of these ever reaches the browser.** Every call is made from the server.

---

## 2. Deployment topology

```
                            the internet
                                 │
                                 │  443 / 80  ← the only ports open
                                 ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  THE VPS  (16 GB RAM, 100 GB SSD — one host, no redundancy)  │
   │                                                              │
   │   ┌──────────────┐                                           │
   │   │    nginx     │◄── Certbot renews the certificate         │
   │   │  TLS ends    │                                           │
   │   │    here      │                                           │
   │   └──────┬───────┘                                           │
   │          │  plain HTTP, internal network only                │
   │          ▼                                                   │
   │   ┌──────────────┐        ┌───────────────┐                  │
   │   │     app      │        │   scheduler   │                  │
   │   │  Next.js     │        │  same image,  │                  │
   │   │  UI +        │        │  different    │                  │
   │   │  Server      │        │  command      │                  │
   │   │  Actions +   │        └───────┬───────┘                  │
   │   │  ingest      │                │                          │
   │   └──────┬───────┘                │                          │
   │          │                        │                          │
   │          └────────┬───────────────┘                          │
   │                   ▼                                          │
   │            ┌─────────────┐         ┌──────────────┐          │
   │            │  postgres   │────────►│    backup    │          │
   │            │  NOT exposed│         │   pg_dump    │          │
   │            │  to the host│         │  on a timer  │          │
   │            └─────────────┘         └──────────────┘          │
   └──────────────────────────────────────────────────────────────┘
```

- **Only nginx publishes ports.** `app`, `postgres` and `scheduler` are reachable **only** on
  Docker's internal network. Postgres in particular is not exposed to the host, let alone the
  internet — so the database has no public attack surface at all.
- **Every container restarts on failure and on reboot**, which is `01-problem.md` success
  criterion 1 and costs one line of Compose configuration each.
- **One host, no redundancy** (ADR 0002). A single point of failure for compute and data alike,
  accepted deliberately for a personal tool.

---

## 3. Trust boundaries

Four lines, in order of how much they matter.

### Boundary 1 — the laptop and the server
**The most important one.** The capture daemon runs on Adil's machine, outside everything the
server controls.

- The daemon holds a **device token**, not a password. Revocable on its own, stored hashed
  (`04-contracts.md` §1.5).
- **The server decides whose data it is**, resolved from the token. A user identifier in a
  request body is ignored, not honoured.
- **The daemon is treated as untrusted even though Adil wrote it**, because a token can be
  copied off a laptop and the server cannot tell the difference.

### Boundary 2 — the internet and nginx
Everything public arrives here. TLS ends at nginx; behind it is plain HTTP on a private network,
which is safe precisely because nothing outside can reach that network.

### Boundary 3 — the app and postgres
The database trusts the app completely, and this is only acceptable because the database is
unreachable from anywhere else. **Per-user isolation (spec A7) is enforced in the app, not by
the database** — which is why `04-contracts.md` §2.0 makes "the user comes from the session,
never the request" a property of the API's shape rather than a check on each route.

### Boundary 4 — the browser extension and the daemon
Both run on Adil's laptop and talk over localhost. **Deliberately left unspecified**
(`04-contracts.md` §3.0) so it can change without touching anything the server knows about.
That freedom is why ADR 0009 routed the extension through the daemon instead of straight to the
VPS.

### Secrets
- Database password, Resend key, OpenAI key, Google OAuth secret and the Better Auth signing
  secret are **environment variables on the host**, never baked into an image and never sent to
  the browser.
- ADR 0001 records a credentials file committed and pushed in this repository's history. **Those
  keys are public and must be rotated** — still an open action.

---

## 4. The operational surface

None of this appears on a feature list. All of it is in `01-problem.md`'s success criteria, and
ADR 0002 warned each item can eat a day.

### 4.1 TLS
nginx plus Certbot. Certificates last about 90 days, so renewal must be automatic **and tested**
rather than assumed. This is the half-day ADR 0008 priced when nginx was chosen over Caddy.

### 4.2 Backups — criterion 4
- `pg_dump` on a schedule, written to disk.
- **The criterion is a restore actually performed**, not a script that exists. Backups that have
  never been restored are not backups.
- **TODO(adil): where the dumps go.** On the same disk as the database they do not survive the
  failure most likely to need them — a lost or corrupted VPS. Off-host storage is the point.

### 4.3 Restart and rollback — criteria 1 and 5
- Restart on reboot: Compose restart policies.
- Rollback: deploy tagged images, never `latest`, so rolling back is starting the previous tag.
- **The criterion is a rollback actually executed once**, before it is needed.

### 4.4 Logs, health, alerts — criterion 6
- **Structured logs with a request id** on every request, matching `04-contracts.md` §2.0.
- A **health check** endpoint the container runtime can poll.
- ~~**At least one alert that would genuinely wake him.**~~ **Dropped by Adil, 2026-09-11.**
  This is `01-problem.md` success criterion 6, which is signed off, so the criterion is now
  partly unmet by choice rather than by oversight. **Consequence:** if the VPS goes down at 3am,
  Adil finds out the next time he opens the app. Accepted for a personal tool; it would not be
  acceptable with users depending on uptime. Structured logs, request ids and the health check
  all remain.

### 4.5 What is deliberately absent
No queue, no cache layer, no CDN, no load balancer, no second host, no container orchestration
beyond Compose. Each would be reasonable for a product with paying users and is unjustifiable
for one person on one VPS. Named here so their absence reads as a decision.

---

## 5. Open — for Adil

1. **Where database backups are stored** — off-host, and where? (§4.2)
2. **JWT lifetime** — how short? (§1.1, [ADR 0014](adr/0014-jwt-sessions-instead-of-database-sessions.md))
   Expiry is the only thing that ends a token's life, so this number *is* the security control.

**Deferred, not open:** the Resend sending domain and its SPF/DKIM records (ADR 0013) — nothing
else is blocked by it.

**Closed:** the scheduler stays (§1.2) · the alert is dropped (§4.4) · the ADR 0001 credential
leak is lower severity than recorded, because the repository is private.
