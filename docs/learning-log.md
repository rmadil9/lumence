# Learning Log

One line per concept I met and what it means. My proof I am not vibe coding.

| Concept | Where it bit me | One-sentence definition |
|---|---|---|
| Contingency ladder | Kickoff: chosen scope came to ~18–19 days against a then-15-day deadline | A pre-agreed, ordered list of cuts to make when a fixed deadline meets excess scope, decided while calm rather than on the last day. |
| Spike | Kickoff: choosing the process model | A short, time-boxed experiment whose only output is the answer to one question — the code is thrown away on purpose. |
| Seam | Kickoff: deferring browser-tab tracking and real X API posting | An interface placed at a boundary so a deferred implementation can drop in later without changing callers. |
| Acceptance criterion | Spec session: every v1 behaviour needed one | An observable pass/fail statement for a behaviour, written so it can become a test name before any code exists. |
| Non-goal | Spec session: writing the OUT lists per surface | Something deliberately excluded and recorded as excluded, so it cannot be quietly re-added mid-iteration. |
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
| Provider-agnostic adapter | LLM session: picking OpenAI | One module that every call to an outside service goes through, so swapping the vendor means rewriting one file instead of hunting through the codebase. |
| Account takeover via linking | Auth session: joining a Google sign-in to an existing password account | Letting two sign-in routes join on a matching email alone, so an unverified signup on someone else's address hands its password a real account. |
| Ubiquitous language | Domain session: 'session' meant two different things | Agreeing one word per concept and using it in code, database, UI and docs alike, so a conversation can never be ambiguous. |
| Invariant | Domain session: writing the rules that must never break | A rule that is true at every moment, no matter what happens — the thing you check a design against, not a feature you build. |
| Gaps and islands | Idle Reading B: discarding whole no-input stretches | A standard SQL shape for grouping consecutive rows into runs, so a rule can be applied to the whole run rather than to each row on its own. |
| Poison pill | Ingest contract: one bad sample in a batch | A single malformed item that fails forever and blocks everything queued behind it — avoided by accepting the good items and reporting the bad one instead of rejecting the whole batch. |
| Partial unique constraint | Contracts: one live lock-in per user | A uniqueness rule the database applies only to rows matching a condition — here, only to lock-ins that are running or paused, so completed ones can pile up freely. |
| Natural key vs surrogate key | Contracts: activity samples have no id column | A natural key identifies a row by what it actually is (this device, this box); a surrogate key is an invented id. Adding a surrogate here would let duplicates back in. |
| Backward compatibility | Ingest contract: the daemon on my laptop updates later than the server | Keeping a newer server able to serve older clients, because the two halves are deployed on different schedules and will routinely disagree in version. |
| Bearer token | Ingest contract: how the daemon authenticates | A credential sent in an Authorization header that grants access by itself — so it must be stored hashed, scoped narrowly, and revocable. |
| Idempotent create | Contracts: double-clicking the create-todo button | Letting the client generate the new row's id so a repeated request lands on the same key and creates one row, not two. |
| Email relay | Choosing Resend: a fresh VPS cannot send mail reliably | A third-party service that delivers your email for you, carrying the sending reputation a new server IP does not have. |
| SPF and DKIM | Resend: DNS records needed before verification mail is trusted | DNS entries that let a receiving mail server check a message really came from your domain — get them wrong and mail silently goes to spam. |
| Early-warning system | Dropping the day 4/9/14 checkpoints | A scheduled moment to compare work done against work left, so trouble is noticed before it is a crisis — its absence is only felt late. |
| Session vs JWT | Architecture: how sign-in state is held (chose JWT, ADR 0014) | A session is a row the server looks up, so it can be revoked; a JWT is a signed token the browser holds, needing no lookup but valid until it expires — so nothing can end it early. |
| Token expiry as the security control | Choosing JWT: nothing can revoke a token | When a credential cannot be withdrawn, how long it lives is the only thing limiting the damage if it is copied. |
| Lazy resolution | The scheduler: flipping a todo to delayed | Fixing stale state the next time something reads it, instead of running a job on a timer — simpler, but every read path has to remember to do it. |
| Iteration (industry name: *vertical slice*) | Renamed the project's process word, 2026-09-11 | One small end-to-end piece of working software — through every layer, deployed — rather than a layer or a module. We call it an iteration; most writing calls it a vertical slice. |
| Idle inhibitor | Idle rules: a film and an empty chair looked identical | A request an application makes to the desktop to stay awake — which is why the screen stays lit through a video, and the only cheap evidence that someone is present without touching anything. |
| Blank vs lock vs sleep | Working the idle cases from first principles | Blanked = display off, still recording. Locked = awake but absent, still recording. Asleep = nothing recorded at all. Only the third is absence of data. |
| Choosing the stable signal | Rejecting screen-blanking as the idle rule | When two signals could drive a rule, pick the one that behaves the same on every machine — blanking varies by settings and power source; an inhibitor does not. |
| front-end (also called a front-end, Backend For Frontend) | Splitting the app, ADR 0016 | A thin server that exists only to serve one user interface — it holds sign-in state and shapes data for the screen, and is *not* where product rules live. |
| Service boundary | Choosing two services over one app | The line between two separately deployed programs: they can only talk over a network, so the contract between them has to be written down rather than assumed. |
| HLD vs LLD | Deciding where each fits in the spine | High-level design is components and boundaries — done once, up front. Low-level design is classes, interfaces and responsibilities inside one component — done per iteration, just before coding it. |
| API surface | Asking what step 4 actually contains | The menu: every single thing the outside world can ask your system to do. Not how it works inside — that stays free to change. |
| Defence in depth | front-end-to-backend auth, ADR 0017 | Requiring two independent facts to both hold, so one of them failing does not open the door on its own. |
| Asymmetric keys | Signing tokens across the service boundary | A private key signs, a public key checks the signature — so a service can verify a token is genuine without being able to create one. |
| Confused deputy | Why a service credential alone was rejected | When a trusted middleman is tricked into using its own authority on someone else's behalf — here, a front-end bug making the backend serve the wrong user's data. |
| Backward-compatible contract | Versioning the two services separately | Only ever adding to an interface, never removing or repurposing — so an older caller keeps working when the other side is updated first. |
| Generated types | Stopping the Python and TypeScript descriptions from drifting | Having a tool write the front-end's type definitions from the backend's own API description, so the same thing is defined once instead of twice by hand. |
