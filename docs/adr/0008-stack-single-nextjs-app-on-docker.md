# ADR 0008 — The stack: one Next.js app, Postgres, Prisma, Better Auth, Docker Compose behind nginx

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-27

## Context
`decision-log.md` §4 kept the stack deliberately open until the architecture phase. Two
facts constrain it: everything self-hosts on one VPS with no redundancy
([ADR 0002](0002-self-host-on-a-single-vps.md)), and the budget is a fixed 20 days against
five surfaces plus the unproven activity tracker ([ADR 0003](0003-no-spike-phase.md)).

Adil knows Next.js and Python. Nothing else was assumed anywhere in the docs.

**Terms, defined once:**
- **ORM** — a library that reads and writes database rows as objects in your code, instead
  of you writing SQL by hand.
- **Migration** — a versioned script that changes the database's shape (adds a table, adds
  a column) so the schema and the code stay in step.
- **Container** — an app packaged with its dependencies so it runs the same on any machine.
- **Reverse proxy** — the program sitting in front of the app: it takes requests from the
  internet, handles HTTPS, and passes them through.

## Options considered

### The shape of the web app
1. **One Next.js app** — the React user interface and the server code in a single
   TypeScript project, deployed as one unit. **Chosen.**
2. **Next.js user interface plus a separate Python API** (FastAPI). Uses both languages
   Adil knows and is better suited to background jobs and activity-data work. Rejected: two
   codebases, two deploys, and every API shape written twice — once in Python and once in
   TypeScript — where they drift silently. Estimated at 1.5–2 days of plumbing that would
   come directly out of activity capture's budget.

### Database
1. **PostgreSQL** — **chosen.** Activity records are the high-volume table (roughly a few
   thousand rows per user per day). Concurrent writes arrive from both the web app and the
   ingest endpoint, and backup-and-restore is a signed success criterion
   (`01-problem.md` #4) that is far better trodden on Postgres.
2. SQLite — a database that is just a file, with no server. Would technically cope, but
   concurrent writes are its weak spot and the restore story is thinner.

### The layer between code and database
1. **Prisma** — **chosen by Adil.** Better documentation, gentler landing, its own schema
   language and generated migrations.
2. Drizzle — thinner and SQL-shaped, so more of the SQL stays visible. **I recommended
   Drizzle and was overruled**, on the reasoning that an ORM which hides SQL teaches less on
   a project whose stated purpose is learning. Adil chose the smoother path. The day-view
   aggregation queries are expected to need raw SQL through Prisma's escape hatch regardless.

### Authentication
1. **Better Auth** — **chosen.** A self-hosted TypeScript auth library that owns its own
   tables inside our Postgres. Email and password, verification links, password reset,
   Google OAuth and account linking are all built in — which is exactly the spec A1–A7 set
   that [ADR 0005](0005-full-email-auth-plus-google-oauth.md) locked in.
2. Auth.js / NextAuth — more popular, but email-and-password is deliberately second-class
   in it; password hashing, verification tokens and the reset flow would be hand-written.
3. Roll our own — 2+ days, and password reset is where security bugs ship.

Adopting Better Auth is a third-party dependency adoption, which `CLAUDE.md` places on the
human veto list. Adil approved it explicitly.

### Deployment
1. **Docker Compose, with nginx as the reverse proxy** — **chosen.** One file describes the
   app container, the Postgres container and the proxy. Restart-on-reboot and rollback
   (`01-problem.md` success criteria 1 and 5) come nearly free.
2. Docker Compose with Caddy — **I recommended Caddy and was overruled.** Caddy issues and
   renews HTTPS certificates automatically with no configuration, which would have deleted
   one of the ops chores ADR 0002 flagged. Adil chose nginx for its ubiquity and because
   nginx configuration is a transferable skill.
3. Bare systemd with no containers — rejected; hand-managed Node and Postgres versions.

### The laptop capture client
Python, because it runs on Ubuntu outside the server perimeter and only speaks HTTP to it,
so a different language costs nothing. The browser half must be JavaScript — a browser
extension has no other option. Detail belongs to the activity-capture ADR, not here.

## Decision
| Layer | Choice |
|---|---|
| Web application | One Next.js app — user interface and server code in one TypeScript project |
| Database | PostgreSQL |
| ORM and migrations | Prisma |
| Authentication | Better Auth, self-hosted, tables in our own Postgres |
| Deployment | Docker Compose |
| Reverse proxy and TLS | nginx, with Certbot for certificate issue and renewal |
| Laptop capture client | Python |
| Browser tab capture | A browser extension (JavaScript — no alternative) |
| Email relay for verification and reset | **TODO(adil):** Resend / Postmark / Amazon SES — needs the domain setup, deferred |

## Consequences
- **The whole web app is one language and one deploy unit.** This is the single largest
  schedule saving available and it was taken deliberately, so the days go to activity
  capture instead.
- **nginx means TLS certificates are our job.** Certbot must be installed, wired into the
  Compose file, and its renewal actually tested — not assumed. Roughly half a day, and it
  belongs in `runbook.md`. This is the price paid for the transferable skill.
- **Prisma means less SQL written by hand**, which was the point, and less SQL learned,
  which was the cost. Escape-hatch raw queries are expected for the day view.
- **Better Auth keeps authentication off the critical path.** ADR 0005 made auth a real
  slice competing with the riskier work; this reduces it to configuration plus a Google
  client registration.
- **A background-job home is still open.** Spec T4 — todos flipping to `delayed` at the day
  boundary whether or not the app is open — needs something that runs on a schedule.
  **TODO(adil):** decide whether that is a scheduled TypeScript script inside the same
  codebase (my recommendation — one schema, one language) or a separate Python process
  (which would put the database schema in two places). Not decided here.
- **Outbound email remains an unpriced v1 dependency**, exactly as ADR 0002 and ADR 0005
  both warned. Nothing in this ADR reduces that risk.
- **Reversibility is mixed.** Swapping the reverse proxy or the email relay later is cheap.
  Swapping Prisma or Better Auth is moderate — both own database tables. Splitting the one
  app into two services later is real work but not a rewrite; the seam would be the HTTP
  API surface defined in `04-contracts.md`.

## What would make us revisit
- One VPS becoming resource-bound under the activity-record write volume — the answer would
  be moving Postgres off the app host, not changing the stack.
- Certificate renewal or email deliverability consuming more than half a day each. The
  answer then is the contingency ladder in `00-process.md`, not a redesign.
