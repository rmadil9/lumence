# Learning Log

One line per concept I met and what it means. My proof I am not vibe coding.

| Concept | Where it bit me | One-sentence definition |
|---|---|---|
| Contingency ladder | Kickoff: chosen scope came to ~18–19 days against a then-15-day deadline | A pre-agreed, ordered list of cuts to make when a fixed deadline meets excess scope, decided while calm rather than on the last day. |
| Spike | Kickoff: choosing the process model | A short, time-boxed experiment whose only output is the answer to one question — the code is thrown away on purpose. |
| Seam | Kickoff: deferring browser-tab tracking and real X API posting | An interface placed at a boundary so a deferred implementation can drop in later without changing callers. |
| Acceptance criterion | Spec session: every v1 behaviour needed one | An observable pass/fail statement for a behaviour, written so it can become a test name before any code exists. |
| Non-goal | Spec session: writing the OUT lists per surface | Something deliberately excluded and recorded as excluded, so it cannot be quietly re-added mid-slice. |
| Idle threshold | Spec session: deciding what counts as time at the machine | A period of no input after which time stops being attributed to the foreground application — subtraction, so the day's numbers are not inflated. |
| Account linking | Spec session: adding Google OAuth alongside email signup | Resolving the same person arriving by two sign-in routes to one account rather than two, usually keyed on a verified email address. |
| Idempotency | Spec session: the duplicate-submit and offline-backlog edge cases | The property that doing the same operation twice leaves the same result as doing it once — what stops a double-click or a replayed backlog from double-counting. |
| ORM | Stack session: choosing Prisma | A library that lets you read and write database rows as objects in your code, instead of writing SQL by hand. |
| Migration | Stack session: how the database changes shape over time | A versioned script that alters the database's structure, so the schema and the code stay in step across every machine. |
| Container | Stack session: choosing Docker Compose | An app packaged together with its dependencies so it runs identically on any machine. |
| Reverse proxy | Stack session: choosing nginx | The program in front of your app that accepts requests from the internet, handles HTTPS, and passes them through. |
| TLS certificate renewal | Stack session: nginx has no automatic renewal, so Certbot is now our job | HTTPS certificates expire every ~90 days; something must renew them automatically, and the renewal must be tested, not assumed. |
