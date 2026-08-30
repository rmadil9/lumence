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
| Daemon | Capture session: something has to watch the desktop | A program that runs quietly in the background with no window — nothing tells it anything, it goes and looks. |
| Wayland vs X11 | Capture session: my laptop is Wayland, so reading the focused window is restricted | The two ways a Linux desktop draws the screen; X11 lets any program see other windows, Wayland forbids it on purpose as a security feature. |
| GNOME Shell extension | Capture session: the only way to see the focused app on Wayland | Code that runs inside the desktop itself, so it can see what an outside program is not allowed to. |
| Offline backlog | Capture session: spec E10 | Observations piled up locally because the machine was awake and working but could not reach the server. |
| Double-counting | Capture session: why a re-send is dangerous | The same stretch of time saved twice, because the server's confirmation was lost and the client sent it again. |
| Unique key | Capture session: (device, 15-second box) on every activity sample | A column combination the database refuses to store twice — duplicate protection enforced by Postgres, not by code I can get wrong. |
| Local buffer | Capture session: the SQLite file on my laptop | Writing data to disk before sending it, so a network failure delays delivery instead of destroying data. |
| Device token | Capture session: how the daemon proves who it is | A long random string standing in for a password, scoped to one machine and revocable on its own. |
| Trust boundary | Capture session: the daemon runs outside my server | The line past which you stop believing what a client tells you — the server decides whose data it is, never the client. |
| Statistical sampling | Capture session: a 15-second box holding two different apps | Glancing at regular intervals instead of watching continuously — wrong about any single moment, right about the proportions over a day. |
| Policy at query time | Capture session: where the 5-minute idle rule lives | Storing raw facts and applying the rule when you read, not when you write — so changing the rule later fixes all your history instead of being impossible. |
