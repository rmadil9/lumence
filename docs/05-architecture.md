# 05 — Architecture (High-Level Design)

> Status: **redrawn 2026-09-15** for the two-service split
> ([ADR 0016](adr/0016-split-into-nextjs-bff-and-fastapi-backend.md)). Supersedes the
> single-application version.
>
> **This document is the HLD.** High-level design = components, boundaries, what talks to what,
> and where it all runs. Low-level design — classes, interfaces, responsibilities inside one
> component — is done per iteration, just before that component is built.

**Terms, defined once:**
- **front-end (also called a front-end, Backend For Frontend)** — a thin server that exists only to serve one user interface.
  It holds sign-in state and shapes data for the screen. **It is not where product rules live.**
- **Container** — an application packaged with its dependencies so it runs the same anywhere.
- **Reverse proxy** — the program in front of everything: takes requests from the internet,
  handles HTTPS, passes them inward.
- **Internal network** — a private network between containers. Nothing outside the host reaches it.
- **Trust boundary** — the line past which you stop believing what the other side tells you.

---

## 1. Components

### 1.1 On the VPS

| Component | What it is | What it owns |
|---|---|---|
| **nginx** | Reverse proxy | The **only** thing exposed to the internet. Terminates HTTPS |
| **Certbot** | Certificate tool | Gets and renews the HTTPS certificate. Ours to run, because nginx does not do it itself |
| **frontend** | Next.js | Rendering, sign-in state, shaping data for the screen. **Never opens a database connection** |
| **backend** | FastAPI (Python) | Business rules, domain logic, and the only connection to Postgres. Also serves the daemon's ingest endpoint |
| **postgres** | Database | Every table in `04-contracts.md` |
| **scheduler** | Python, same image as `backend` | The day-boundary work — §1.3 |
| **backup** | Scheduled `pg_dump` | Database snapshots (§4.2) |

### 1.2 Who owns what — the line that matters

**The rule: if it is a rule about the product, it belongs in the backend.**

| Belongs in the front-end | Belongs in the backend |
|---|---|
| Rendering pages | "One lock-in at a time" |
| Sign-in, verification, password reset, Google OAuth (Better Auth) | "A todo is due the day it was created" |
| Holding the user's token | "20 chat turns per day" |
| Combining two backend calls into one screen | The idle rules, and every other query |
| Nothing else | Everything else |

**The standard failure of this pattern is the front-end quietly growing product logic.** It happens
gradually and nobody notices. Worth a deliberate check at each iteration's review.

- **Data access:** SQLAlchemy with Alembic for migrations (Adil, 2026-09-15). **Prisma is gone** —
  it is a TypeScript tool, and the database now belongs to Python. SQLAlchemy maps rows to
  objects; Alembic versions the schema changes.
- **Better Auth stays in the front-end.** Sign-in is browser-facing, which is exactly what a front-end is for.
  Stateless JWT, 15 days ([ADR 0014](adr/0014-jwt-sessions-instead-of-database-sessions.md)).

### 1.3 The scheduler
Runs on a timer with nobody watching:
- **Spec T4 / E11** — a todo not completed by the end of its due day becomes `delayed`, correct
  whether or not the app was open at midnight.
- **Lock-in sweep** — closing a lock-in whose clock ran out unobserved.

**Python, same image as `backend`, different command.** It needs the database and the domain
rules, both of which now live in the backend. A separate container rather than a thread, so it
never competes with user requests and never runs twice.

### 1.4 On Adil's laptop — outside the perimeter

| Component | Language | What it does |
|---|---|---|
| **GNOME Shell extension** | JavaScript | Runs *inside* the desktop process and publishes the focused window over D-Bus. The only route available on Wayland |
| **Capture daemon** | Python | Samples every 15s; reads three facts over D-Bus — focused window, screen-lock state, and whether an application is holding the desktop awake ([ADR 0015](adr/0015-idle-inhibitor-distinguishes-watching-from-away.md)). Buffers to local SQLite, uploads batches |
| **Browser extension** | JavaScript | Reports the active tab's domain to the daemon over localhost |

**The daemon posts straight to the backend, never through the front-end.** It is a machine talking to a
machine and has no business passing through a front-end server.

### 1.5 Outside services

| Service | For | Called from |
|---|---|---|
| **Resend** | Verification and password-reset email | The **front-end** — auth lives there |
| **OpenAI** | The chat surface, behind the adapter | The **backend** — the turn cap is a product rule |
| **Google** | OAuth sign-in | The **front-end** and the user's browser |

**No API key for any of these ever reaches the browser.**

---

## 2. Deployment topology

```
                              the internet
                                   │
                                   │  443 / 80  ← the only ports open
                                   ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  THE VPS  (16 GB / 100 GB — one host, no redundancy)           │
   │                                                                │
   │     ┌──────────────┐                                           │
   │     │    nginx     │◄── Certbot renews the certificate         │
   │     │  TLS ends    │                                           │
   │     └──┬────────┬──┘                                           │
   │        │        │                                              │
   │   browser    daemon posts activity                             │
   │   traffic    straight through                                  │
   │        │        │                                              │
   │        ▼        │                                              │
   │  ┌───────────┐  │                                              │
   │  │    bff    │  │   Next.js · Better Auth · no DB connection   │
   │  │           │  │                                              │
   │  └─────┬─────┘  │                                              │
   │        │        │                                              │
   │        │  forwarded user token, verified by the backend (0017) │
   │        ▼        ▼                                              │
   │  ┌──────────────────────┐      ┌───────────────┐               │
   │  │      backend         │      │  scheduler    │               │
   │  │  FastAPI · all       │      │  same image,  │               │
   │  │  product rules ·     │      │  on a timer   │               │
   │  │  ingest endpoint     │      └───────┬───────┘               │
   │  └──────────┬───────────┘              │                       │
   │             │                          │                       │
   │             └────────┬─────────────────┘                       │
   │                      ▼                                         │
   │              ┌─────────────┐        ┌──────────────┐           │
   │              │  postgres   │───────►│    backup    │           │
   │              │ NOT exposed │        │   pg_dump    │           │
   │              └─────────────┘        └──────────────┘           │
   └────────────────────────────────────────────────────────────────┘
```

- **Only nginx publishes ports.** `frontend`, `backend`, `scheduler` and `postgres` are reachable only
  on the internal network. Postgres has no public attack surface at all.
- **Two paths through nginx:** browser traffic goes to the front-end; the daemon's ingest route goes
  straight to the backend.
- **Every container restarts on failure and on reboot** — success criterion 1, one line of
  Compose configuration each.
- **One host, no redundancy** ([ADR 0002](adr/0002-self-host-on-a-single-vps.md)). Both services
  share fate, so the split buys design clarity, not availability. Worth being honest about.

---

## 3. Trust boundaries

Five now, in order of how much they matter.

### Boundary 1 — the laptop and the server
The capture daemon runs outside everything the server controls.
- Revocable **device token**, stored hashed. Not a password.
- **The server decides whose data it is**, from the token. A user id in the body is ignored.
- Untrusted **even though Adil wrote it** — a token can be copied off a laptop and the server
  cannot tell.

### Boundary 2 — the front-end and the backend  *(new, and the sharpest)*
Created by the split. Governed by [ADR 0017](adr/0017-bff-to-backend-authentication.md).
- **The user's token is forwarded unchanged, and the backend verifies it itself.** There is no
  service credential — the backend is not reachable from the internet, so it was guarding a door
  that is not open (ADR 0017, amended).
- **The backend never reads a user id from a body, a query parameter, or a header the front-end filled
  in.** Identity comes only from the verified token.
- **That is what keeps spec A7 true across two services** — a front-end bug cannot leak another user's
  data, because the front-end is never asked who the user is.
- Tokens are signed with an **asymmetric key**: the front-end signs with a private key, the backend
  holds only the public one. The backend can verify a token without being able to create one.
- **The check must live in one shared place**, not be repeated per route. Repeated authorization
  code is where mistakes happen.
- **Because the service credential is gone, the nginx routing is security-critical.** It is the
  only thing keeping the backend off the internet. Adding a route that exposes it removes the
  design's entire outer defence.

### Boundary 3 — the internet and nginx
Everything public arrives here. TLS ends at nginx; behind it is plain HTTP on a private network,
which is safe because nothing outside can reach that network.

### Boundary 4 — the backend and postgres
The database trusts the backend completely, which is acceptable only because it is unreachable
from anywhere else. **Per-user isolation is enforced in the backend, not by the database.**

### Boundary 5 — the browser extension and the daemon
Both on Adil's laptop, over localhost. **Deliberately unspecified** (`04-contracts.md` §3.0) so
it can change without touching anything the server knows about.

### Secrets
Database password · Resend key · OpenAI key · Google OAuth secret · the JWT key pair. All
**environment variables on the host**, never baked into an
image, never sent to the browser.

---

## 4. The operational surface

On no feature list; all of it in `01-problem.md`'s success criteria.

### 4.1 TLS
nginx plus Certbot. Certificates last ~90 days, so renewal must be automatic **and tested**.

### 4.2 Backups — criterion 4
- `pg_dump` on a schedule.
- **The criterion is a restore actually performed.** A backup never restored is not a backup.
- **TODO(adil): where the dumps go.** On the same disk as the database they do not survive the
  failure most likely to need them.

### 4.3 Restart and rollback — criteria 1 and 5
- Restart on reboot: Compose restart policies.
- Rollback: deploy tagged images, never `latest`.
- **Two services now deploy together.** A rollback must roll back *both*, or you run a new front-end
  against an old backend. **TODO(adil):** decide at iteration 0 whether they always version
  together.
- **The criterion is a rollback actually executed once**, before it is needed.

### 4.4 Logs and health — criterion 6
- **Structured logs with a request id**, and the id **passed from the front-end to the backend** so one
  browser action can be traced across both services. Without that, the split makes debugging
  meaningfully harder.
- A **health check** per service.
- **No uptime alert** — dropped by Adil 2026-09-11.

### 4.5 Deliberately absent
No queue, no cache, no CDN, no load balancer, no second host, no orchestration beyond Compose.
Reasonable for a product with paying users; unjustifiable for one person on one VPS.

---

## 5. Open — for Adil

1. **Where backups go** — off-host, and where? (§4.2) **Parked by Adil.**
2. ~~Do the services version together?~~ **No — versioned separately** (§4.3). The contract
   between them must stay backward-compatible as a result.
3. ~~Where the JWT key pair lives~~ — **decided 2026-09-15.** Generated once at setup. The
   **private key is an environment variable on the front-end**, the **public key on the
   backend** — so the backend can verify a token but never create one. Rotation is manual, rare
   and deliberate, because it signs every user out at once; it is the only global revocation this
   design has. The generate command belongs in `runbook.md`.
4. **Whether to generate the TypeScript side from FastAPI's schema** to stop the two descriptions
   of each operation drifting (ADR 0016). Belongs in the contracts revision.
