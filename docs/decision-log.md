# Lumence — Decision Log

**Owner:** Adil · **Last updated:** 2026-09-15 · **Phase:** understanding (no product code yet)

This is the one-page record of every judgement made on this project so far, who made it,
what was rejected, and what it costs to undo. It exists so the reasoning survives the
project — for me to reflect on, and for anyone reviewing whether these were real decisions
or drift.

**Terms used below, defined once:**
- **ADR** — Architecture Decision Record. One short document per irreversible decision,
  stating the context, the options, the choice, and the consequences. Stored in `docs/adr/`.
- **Contingency ladder** — a pre-agreed, ordered list of features to cut if the deadline
  gets tight. Written down while calm so the choice is never made in a panic.
- **Seam** — a deliberate boundary in the design so a deferred piece can be added later
  without rewriting what calls it.

**How to read the "Decided by" column:** every decision here was made by Adil. Where the
AI advised the opposite and was overruled, it says so explicitly. That distinction is the
point of this document.

---

## 1. The constraint everything else bends around

**Changed 2026-09-11 — [ADR 0012](adr/0012-no-deadline-ladder-kept-checkpoints-dropped.md).**

| | |
|---|---|
| ~~**Deadline**~~ | ~~20 working days at ~10 hours/day. Fixed.~~ **There is no deadline and no time budget.** |
| **The dominant risk now** | The unproven cost of activity capture — the one item in scope never priced, because ADR 0003 cut the spike. |
| **What keeps scope honest** | `02-spec.md` and its explicit **Out** lists. Nothing external forces a cut any more. |
| **Read the decisions below accordingly** | Everything from 2026-08-24 to 2026-09-03 was decided *against a deadline*. Those decisions stand — most were right on their own merits too — but the reason recorded for them is historical. |

---

## 2. Decisions with an ADR

### ADR 0001 — Discard the archived codebase entirely
- **Decided by:** Adil · 2026-08-24
- **Choice:** The earlier, unrelated project sitting in this repo's history is abandoned,
  not extended. Its documents hold no authority over Lumence.
- **Rejected:** resurrect and fix forward (fastest to a live URL); salvage the data model
  and tests selectively.
- **Why:** it is a *different product*, not an earlier version of this one. Inheriting its
  code means inheriting assumptions built for something else.
- **Cost accepted:** re-solving problems it had already solved — auth wiring, todo CRUD,
  keeping one user's data away from another's.
- **Open action:** a credentials file was committed and pushed in that history. Discarding
  the code does not un-leak it. Those keys must be treated as public and rotated.
- **Reversibility:** none needed — already executed.

### ADR 0002 — Self-host everything on a single VPS
- **Decided by:** Adil · 2026-08-24
- **Choice:** every part of the app runs on one owned server. Nothing rented.
- **Rejected:** rented platform hosting (fastest, least to operate — but its free tier bars
  commercial use and it wastes an owned server); a hybrid where auth and email are rented.
- **Why:** the server is already owned, the budget is near zero, and operations is an
  explicit thing Adil wants to learn.
- **Cost accepted:** he now owns TLS certificate renewal, database backups **with a restore
  actually tested**, restart-on-reboot, OS patching, and email deliverability. None of these
  appear on a feature list, and each can eat a day.
- **Known weakness:** one server means no redundancy — a single point of failure for both
  the app and the data. Acceptable for this; would not be for paying users.
- **Reversibility:** moderate. Moving to rented hosting later is real work but not a rewrite.

### ADR 0003 — No spike phase; go straight to building
- **Decided by:** Adil · 2026-08-24 · **AI advised the opposite and was overruled.**
- **Choice:** no throwaway experiment before the design work. Build the real thing, and
  order the risky part first.
- **Rejected:** spending one day up front proving that whole-day activity tracking is even
  feasible, then throwing that code away.
- **Why:** too slow for a deliberately fast-moving project.
- **Cost accepted:** the cost of activity tracking is now discovered *while writing
  production code*, not throwaway code. If the approach is wrong, the loss is a half-built
  feature plus the design decisions that assumed it.
- **What this makes load-bearing:** the day 4 / 9 / 14 checkpoints and the contingency
  ladder are now the *only* early-warning system the project has. Skipping a checkpoint
  removes the safety net entirely.
- **AI's position, recorded:** advised for the spike once, overruled, dropped it.

### ADR 0004 — Drop per-todo time tracking from v1
- **Decided by:** Adil · 2026-08-26
- **Choice:** todos have no timer, no time entries, no totals. A whole surface removed.
- **Rejected:** the full timer; a reduced manual-entry version.
- **Why:** Adil has no existing habit of measuring time per task. It would have been built
  for a behaviour he does not have.
- **Consequence:** v1 has five surfaces, not six. **Nothing in the product connects a todo
  to time spent** — time is reported per application and per website only.
- **Knock-on effect:** the lock-in timer is now the *only* thing linking a stated intention
  to measured reality. The product's central idea is concentrated into one feature.
- **Reversibility:** high. Todo records remain; adding time against them later is additive.

### ADR 0005 — Full email auth, plus Google sign-in, in v1
- **Decided by:** Adil · 2026-08-26 · **AI advised the opposite and was overruled.**
- **Choice:** sign up, email verification, sign in, sign out, password reset, and Google
  sign-in all ship in v1.
- **Rejected:** the AI's recommendation to ship only sign up / sign in / sign out and skip
  anything requiring outgoing email.
- **Why:** v1 is for real users with open signup, and Adil wants the complete, conventional
  account experience rather than a stub.
- **Cost accepted:** working outbound email becomes a v1 dependency. A fresh server has no
  sending reputation, so verification and reset emails landing in spam is a live risk.
  Google sign-in adds a third-party integration and the question of one person arriving by
  two routes resolving to one account, not two.
- **Knock-on effect:** auth is now a real chunk of work competing for days with activity
  tracking, which is the riskier item.
- **AI's position, recorded:** advised cutting email once, overruled, dropped it.

### ADR 0006 — The lock-in timer is a plain countdown and does not judge focus
- **Decided by:** Adil · 2026-08-26
- **Choice:** type any duration, it counts down. Pause, resume, reset. It ends by reaching
  zero. Afterwards it shows raw time per application and per website inside that window —
  and nothing else.
- **Rejected:** a list of "allowed" apps per session; a built-in productive/unproductive
  classification; an adherence score.
- **Why:** classifying apps as productive is subjective, needs configuring every session,
  and is wrong often enough to be distrusted. **The product shows you where your attention
  went and stops. It never tells you that you did badly.**
- **Also decided:** reset **discards the session completely** — nothing stored. All or
  nothing, by choice; Adil does not want half-sessions in his history.
- **Consequence:** no settings screen for categories was ever needed. Smaller build,
  more honest product.
- **Reversibility:** high. Scoring could be layered on later over unchanged records.

### ADR 0007 — X publishing reduced to a link
- **Decided by:** Adil · 2026-08-26
- **Choice:** a "Post on X" button on the notepad that opens X in a new tab. That is the
  entire feature. No stored drafts, no pre-filled text, no character count, no record of
  whether anything was posted.
- **Rejected:** stored drafts with character counting and a pre-filled compose window.
- **Why:** Adil already copies and pastes into X in two actions. Anything Lumence adds here
  is friction, not help.
- **Consequence:** this feature was already the last item on the contingency ladder — the
  thing to cut first in an emergency. Cutting it now means **there is no longer an easy cut
  available later.** The remaining cuts all hurt more.
- **Reversibility:** high, and cheap — a pre-filled link is a small change if wanted.

---

### ADR 0008 — The stack
- **Decided by:** Adil · 2026-08-27 · **AI advised differently on two items and was overruled.**
- **Choice:** one Next.js app (user interface and server code in a single TypeScript
  project, one deploy) · PostgreSQL · Prisma · Better Auth · Docker Compose · nginx with
  Certbot for HTTPS · Python for the laptop capture client.
- **Rejected:** a separate Python API alongside the Next.js UI — it would use both languages
  Adil knows, but means two codebases, two deploys, and every API shape written twice where
  they drift silently. Costed at 1.5–2 days taken straight out of activity capture.
- **Why one app:** on a fixed 20-day budget with the ops burden already owned (ADR 0002),
  one language and one deploy unit is the largest schedule saving available.
- **Overrule 1 — Prisma over Drizzle.** The AI recommended Drizzle because it keeps the SQL
  visible, and learning is a stated goal. Adil chose Prisma for the better documentation and
  gentler landing. Cost accepted: less SQL written by hand, and less SQL learned.
- **Overrule 2 — nginx over Caddy.** Caddy issues and renews HTTPS certificates by itself,
  which would have deleted one of the ops chores ADR 0002 flagged. Adil chose nginx because
  it is the industry default and the configuration is a transferable skill. **Cost accepted:
  Certbot is now our job — installed, wired in, and its renewal actually tested. ~half a day,
  and it belongs in the runbook.**
- **Third-party dependency approved:** Better Auth. It is on the human veto list and Adil
  approved it explicitly. It gives spec A1–A7 — email and password, verification links,
  password reset, Google sign-in, one account per person — without hand-writing the parts
  where security bugs ship.
- **Still open:** the email relay that sends verification and reset links, and where the
  midnight `delayed`-flip job lives (scheduled TypeScript in the same codebase, which the AI
  recommends, versus a separate Python process, which would put the schema in two places).
- **Reversibility:** mixed. Reverse proxy and email relay are cheap to swap. Prisma and
  Better Auth are moderate — both own database tables. Splitting one app into two services
  later is real work but not a rewrite.

---

### ADR 0009 — Activity capture: fixed-window samples, buffered locally, pushed up
- **Decided by:** Adil · 2026-08-29
- **Verified, not assumed:** the laptop runs Wayland and GNOME's window-introspection service
  is access-restricted on it. Checked during the session.
- **Choice — on the laptop:** a background Python program samples every **15 seconds** and
  writes each observation to a **local database file first**. A GNOME Shell extension supplies
  the focused application (the only route available on Wayland); a browser extension supplies
  the active website, reporting to the local program rather than to the server.
- **Choice — getting it up:** a separate uploader ships unsent observations every ~60 seconds,
  oldest first, 500 at a time, and marks them sent **only** when the server confirms. Any
  failure changes nothing and retries.
- **Choice — on the server:** every observation has a **unique key of (device, 15-second box)**
  and the insert says "if it already exists, do nothing". Duplicate protection is enforced by
  the database, not by code. Observations are filed by the time **inside** them, never by
  arrival time, so a backlog lands in the hours it really happened.
- **Choice — identity:** the laptop holds a revocable **device token**, not a password. The
  server decides whose data it is; a user identifier sent by the client is never trusted.
- **Rejected:** variable-length intervals ("VS Code, 10:04 to 10:19"). Fewer rows and exact to
  the second, but a record left open by a crash is lost, and two intervals can partly overlap
  and both save cleanly — double-counting the overlap. Fixed boxes cannot overlap.
- **Adil's correction, recorded:** the AI framed this as one choice ("samples vs intervals").
  Adil split it into two independent ones — *how long a record covers* (which sets crash loss)
  and *whether it has a key* (which is not a trade-off but a requirement). The ADR is written
  his way. He also raised the window from 5 seconds to 15.
- **Why the idle rule lives on the server:** the laptop reports the raw fact "seconds since you
  last touched anything" and discards nothing. Discarded data cannot be recovered, so changing
  the threshold later would be impossible for every past day.
- **Cost accepted:** a GNOME Shell extension is now a build item (~half a day) that can break on
  a GNOME upgrade. ~2,400 rows per day per user. Idle records stored and never displayed.
- **What this protects:** contingency ladder rung 1 stays cheap — the website is one optional
  column, so dropping website tracking means *not building the browser extension*. Nothing else
  changes and no data moves.
- **Escape hatches, agreed while calm:** (1) log in under X11 instead — one dropdown, zero code;
  (2) ladder rung 1; (3) last resort, capture goes and the timer reverts to an honour system.
- **Three follow-up calls, 2026-08-29:**
  - **Desktop time is shown.** Sitting on the bare desktop with nothing open is active time
    and appears as a row called "Desktop". Hiding it would understate the day twice over.
  - **A locked screen counts as idle immediately.** Adil proposed using the screen blanking
    as the idle trigger. Blanking cannot be the rule — its timeout differs per machine, per
    user and per power source, and can be switched off — but the *locked* signal is
    unambiguous, so it overrides the five-minute wait. One extra read per sample.
  - **Passive media is a logged limitation, not a v1 feature.** Watching a long video without
    touching anything reads as idle and gets discarded. The fix is real work and competes
    with the riskiest iteration. Wants a LOG line in the signed-off `02-spec.md` — flagged, not
    added.
- **Documented property, not a bug:** one glance per 15-second box means a box shared by two
  applications goes entirely to whichever held focus at that instant. Over ~2,400 glances a
  day the proportions are right; no single box is. Correct totals, not correct moments.
- **The five-minute idle rule — resolved 2026-09-02. AI recommended Reading A and was
  overruled.** Adil chose **Reading B**: once a stretch of no input reaches five minutes, the
  **whole** stretch is thrown away, including its first five minutes. Walk away for thirty
  minutes and it contributes zero, not five. The AI argued for Reading A — keep the first five
  minutes, since silence is often reading or thinking — and that it is a one-line comparison.
  **Cost accepted:** Reading B cannot be judged one sample at a time; the day view must group
  consecutive no-input samples into stretches and drop whole stretches. Standard SQL, more of
  it. Day totals come out lower, and reading a long document without touching anything counts
  for nothing.
- **Reversibility:** high on the pieces, moderate on the shape. The window length and the idle
  threshold are tunable. Moving away from fixed boxes later would mean reprocessing history.

---

### ADR 0010 — OpenAI as the LLM provider, behind an adapter
- **Decided by:** Adil · 2026-09-02 · **AI recommended a different provider and was overruled.**
- **Choice:** OpenAI, reached through the provider-agnostic adapter already promised in
  `CLAUDE.md` — one module holds the vendor name and the key, nothing else in the codebase
  knows which provider is in use.
- **Rejected:** Anthropic (recommended, because current pricing and API shape were verifiable
  in-session so the ADR could carry real numbers); Google Gemini (cheapest at the low end).
- **Why:** Adil already uses ChatGPT daily. `01-problem.md` sets the bar as "must not be more
  steps than copy-paste into ChatGPT already is", so output that reads the way he expects is
  part of the requirement, not a preference.
- **Still open:** the exact model. Deliberately not pinned — it is a quality-versus-cost
  judgement to make against real output on his own writing, and the adapter makes it a
  one-line change.
- **Cost control is the 20-turn-per-user-per-day cap and nothing else.** Confirmed 2026-09-02.
- **Cost hole, raised once and accepted:** the cap limits what one person spends; it does not
  limit how many people sign up, and ADR 0005 gives open signup with no billing. A hundred
  users at the cap is a real bill on Adil's card. **Adil chose to accept it and watch the
  bill.** The fix, if ever needed, is one global daily counter that switches the chat surface
  off for the rest of the day — additive, so deferring it costs no rework.
- **Reversibility:** high. That is the entire point of the adapter.

---

### ADR 0011 — One account per email; linking requires a verified email
- **Decided by:** Adil · 2026-09-02 · auth rule, put to him explicitly because `CLAUDE.md`
  places auth and permission rules on the human veto list.
- **Choice:** an email address identifies exactly one user. Google links to an existing account
  **only when that account's email is already verified**. Where the existing account is
  unverified, the Google sign-in takes ownership of the address and **the unverified password
  credential is discarded**.
- **Rejected:** linking on an email match alone (one flag, simplest — and it leaves the
  takeover route open); refusing the Google sign-in until the person signs in with their
  password first (safe, but a dead end for someone who forgot they had a password account).
- **Why:** anyone can type anyone's email into a signup form. An attacker signs up with your
  email and their own password, never verifies, and waits. You later sign in with Google. If
  the two are joined purely on the matching address, **their password now works on your
  account.** The unverified account holding no data is not the problem — it holds a *password*,
  and linking hands that password a populated account.
- **Cost accepted:** someone who genuinely starts a password signup, never opens the
  verification email, then signs in with Google will find their chosen password no longer
  works. They lose no data — spec A1 means the unverified account never held any.
- **Free:** Better Auth exposes this as a setting, so the safe rule costs the same as the
  unsafe one. There was no schedule argument for the weaker option.
- **Reversibility:** high as configuration; but the weaker setting is a security regression,
  not a preference.

---

### ADR 0012 — No deadline; the ladder stays, the checkpoints go
- **Decided by:** Adil · 2026-09-11 · **AI recommended a self-imposed budget and was overruled.**
- **Choice:** there is no deadline and no time budget. The **contingency ladder survives**,
  re-framed: it is no longer triggered by running out of time, but by a piece of work turning out
  **harder than it is worth**. The **day 4 / 9 / 14 checkpoints are dropped** — there are no days
  to check against.
- **Rejected:** a self-imposed 20-day budget with the same checkpoints, enforced by Adil rather
  than by an outside date (the AI's recommendation); dropping the ladder as well.
- **The AI's argument, recorded:** the deadline is what produced this project's best decisions —
  ADR 0004 (per-todo timers cut), ADR 0006 (no focus scoring) and ADR 0007 (X reduced to a link)
  were all "this does not fit in the time." With no clock, nothing forces a cut.
- **Cost accepted — this is the real one:** ADR 0003 cut the spike and named the checkpoints as
  *"the only early-warning system the project has."* **That system is now gone.** Risk-ordering
  survives, so activity capture is still built early, but nothing will signal that it is
  overrunning except Adil noticing while building it.
- **Also accepted:** nothing external forces a scope cut. `02-spec.md` and its Out lists are the
  whole defence against sprawl, which makes not reopening the spec more important than before.
- **Not reversed:** every scope cut already made stands. Those decisions had merits beyond time.
- **Reversibility:** high. Adopt a deadline again and the checkpoints come back with it.

### ADR 0013 — Resend as the outbound email relay
- **Decided by:** Adil · 2026-09-11 · third-party dependency, on the veto list, approved explicitly.
- **Choice:** Resend delivers verification and password-reset email, wired in behind Better
  Auth's email hook so the relay is named in one place.
- **Rejected:** sending directly from the VPS (free and fully self-hosted — but a fresh server IP
  has no sending reputation, so verification links land in spam); Postmark; Amazon SES (cheapest
  at volume, but new accounts start in a sandbox that only sends to verified addresses).
- **Why:** ADR 0005 made working email a hard v1 dependency, and ADR 0002 already predicted a
  third-party relay would be the outcome despite the self-hosting stance. This is that prediction
  coming true, not a surprise.
- **Consequence:** **the self-hosting stance has exactly one deliberate exception, and this is
  it.** Email leaves the VPS.
- **Now setup work, not a feature:** SPF and DKIM DNS records for the sending domain. Get them
  wrong and mail silently goes to spam. **TODO(adil): which domain Lumence sends from.**
- **Reversibility:** high — configuration behind one hook.

---

### ADR 0014 — Stateless JWT sign-in instead of database sessions
- **Decided by:** Adil · 2026-09-11 · **AI recommended database sessions and was overruled.**
  Supersedes the session-storage half of ADR 0008; Better Auth itself is unchanged.
- **Choice:** sign-in state is a **stateless JWT** — a signed token the browser holds that asserts
  who the user is, verified by signature with no database lookup.
- **Rejected:** database sessions (a row the server looks up, revocable); and a **hybrid** —
  short-lived JWT plus a refresh token held in the database — which is what most genuinely
  scalable systems do and keeps revocation. The hybrid is the option to revisit first if this bites.
- **Why Adil chose it:** designing toward a scalable shape. He stated explicitly that revocation
  and token theft are not concerns at this stage.
- **The AI's argument, recorded:** JWT's only advantage is skipping a database lookup, which
  matters across many servers — and ADR 0002 puts everything on **one VPS with one Postgres**, so
  there is no second server for it to help. Better Auth is also session-first, so JWT works
  against the library ADR 0008 chose specifically to keep auth off the critical path — meaning
  this is likely **more** build effort, not less.
- **Cost accepted — revocation is gone, not deferred.** Signing out deletes the cookie, so that
  browser is signed out and spec A4 still passes; but a copy of the token taken beforehand keeps
  working until it expires. A password reset (A5) cannot end tokens already issued. There is no
  "sign out everywhere". The only levers are a short expiry and rotating the signing secret, which
  logs everyone out at once.
- **Token lifetime: 15 days** (Adil, 2026-09-14). **AI recommended far shorter and was overruled.** A copied token works for up to 15 days and nothing can shorten that — not sign-out, not a password reset, not a lost laptop. Accepted for a personal tool.
- **Unaffected:** the capture daemon's device token is a separate mechanism — still hashed, still
  individually revocable. Per-user isolation is unchanged; only how identity is carried changed.
- **Reversibility:** moderate. Switching back means adding the session table and changing config.
  No product data migrates, but every signed-in user is signed out on the switch.

---

### ADR 0015 — An idle-inhibitor signal separates watching from away
- **Decided by:** Adil · 2026-09-14 · reached by working three cases from first principles.
  Amends signed-off `04-contracts.md` and `03-domain.md`, and supersedes the "log it, don't build
  it" disposition of the media limitation in ADR 0009.
- **Two premises corrected first:** a **blanked screen does not stop sampling** — blanking only
  turns the display off, and the daemon keeps running; only *sleep* stops it. And **locked is not
  asleep** — a locked machine is awake with a password prompt and still produces samples, while a
  sleeping one produces none at all.
- **The problem those corrections exposed:** a person away with a blanked screen, a person away
  with a lit screen, and a person watching a film **produce identical data** — a run of samples
  with a climbing idle count. The five-minute rule discarded all three, so watched time was
  erased.
- **Choice:** record one more fact per sample — whether an application is asking the desktop to
  stay awake (an **idle inhibitor**, which is exactly why a screen stays lit through a film). Then
  four rules at read time: **locked → discard · under 5 min → count · over 5 min with an inhibitor
  → count · over 5 min without → discard.**
- **Rejected:** leaving the limitation logged and unfixed (the ADR 0009 position); inferring
  presence from the screen not blanking — the blank timeout varies per machine, per user and per
  power source, and can be switched off, which is why the *inhibitor* rather than the *blank* is
  the signal.
- **Notable:** cases 1 and 2 collapse into one rule once the inhibitor is what we look at. Whether
  the screen actually went dark turns out to be irrelevant.
- **AI correction, recorded:** I had advised against fixing this, calling it real work competing
  with the riskiest iteration. **That was over-cautious** — it is one more D-Bus read on a bus the
  daemon already queries for the lock state.
- **Cost accepted:** some applications inhibit idle while compiling or downloading, so those
  stretches count as present when the user is away. Rarer than watching video, and it errs toward
  over-counting rather than under-counting.
- **Reading B still governs** the two threshold rules: the decision is made about a *stretch*, not
  a single sample.
- **Reversibility:** high. Nothing is discarded at write time, so the rules stay changeable — which
  is precisely why this fix was cheap to add after the fact instead of a re-processing job.

---

### ADR 0016 — Split into a Next.js front-end and a separate FastAPI backend
- **Decided by:** Adil · 2026-09-15 · supersedes ADR 0008's "one application, not two". The rest
  of ADR 0008 — Postgres, Prisma, Better Auth, Docker Compose, nginx — stands.
- **Choice:** two deployed services. **Next.js front-end** holds rendering, sign-in state and shaping
  data for the screen. **FastAPI backend** holds the business rules, the domain logic and the
  only connection to Postgres. A **front-end** is a thin server that exists to serve one user
  interface; it is not where product rules live.
- **Rejected:** keeping one application (teaches nothing about service boundaries); a Node
  backend (one language everywhere, but then it is unclear why the two halves are separate
  services at all — paying the cost of a split without most of the benefit).
- **Why this reverses a decision made three weeks ago:** ADR 0008 chose one app explicitly on
  schedule grounds. **The deadline is gone (ADR 0012), and the goal changed** — Adil restated it
  as learning to build software as an engineer rather than a developer. The plumbing ADR 0008
  counted as pure cost is now a substantial part of what is being learned.
- **Cost accepted:** two codebases, two deploys, two sets of logs; the shape of every operation
  written twice in two languages, with nothing to catch drift; an extra network hop on every
  request.
- **The sharpest new risk:** spec A7 — a user seeing only their own data — now has to hold across
  two services. The backend must not trust a user identifier from the front-end unless that is a
  deliberate, documented decision.
- **The standard failure to watch for:** the front-end quietly accumulating business logic. The rule —
  **if it is a rule about the product, it belongs in the backend.**
- **Still open, and Adil's to decide:** how the front-end authenticates to the backend (an auth rule,
  on the veto list); whether to generate the TypeScript side from the backend's schema to stop
  drift.
- **Consequence for the docs:** `04-contracts.md` is signed off and must be revised — **Adil
  drives that**, since he is the backend developer and the first pass was written for him rather
  than by him. `05-architecture.md` must be redrawn.
- **Reversibility:** merging back is real work but not a rewrite — the domain model and database
  are untouched.

---

### ADR 0017 — front-end-to-backend authentication: forwarded user token (amended same day)
- **Decided by:** Adil · 2026-09-15 · auth rule, on the veto list. Closes the question ADR 0016
  left open.
- **The insight:** two separate questions hide in one. *Is this request from our front-end?* and *which
  user is it for?* They have different failure modes, so one credential cannot answer both well.
- **Choice, as amended:** every front-end-to-backend request carries **the user's token,
  forwarded unchanged**, which the backend verifies itself. The service credential originally
  required was **dropped the same day** — see below.
- **The rule that follows:** the backend **never** reads a user identifier from a body, a query
  parameter, or a header the front-end filled in. Identity comes only from the token it verified. **A
  front-end bug therefore cannot leak another user's data, because the front-end is never asked who the user
  is.**
- **Rejected — service credential alone:** the backend would trust the front-end's claim about
  identity, so one mistake in the front-end (a user id read from a query parameter instead of the
  verified session) becomes a **complete authorization bypass**. Exactly the risk ADR 0016 named.
- **Rejected — forwarded token alone:** safe on identity, but says nothing about whether the
  caller is our front-end at all.
- **Amendment, same day — Adil challenged the service credential and was right.** The backend is
  not reachable from the internet: nginx routes the browser to the front-end and the daemon's
  ingest path to the backend, and nothing else. Every other backend route lives only on the
  private network. **The service credential was defending a door that is not open.**
- **What that gives up, knowingly:** network isolation is now the *only* protection for the
  backend, so **the nginx configuration becomes security-critical** — one wrong route later and
  it is public with no second line of defence. And nothing stops something else compromised on
  the VPS reaching the backend sideways. Judged a fair trade for one host with six containers.
- **One category left closed:** Adil also proposed non-user requests carrying no credential.
  There are effectively none in this product — everything is behind sign-in — so only the health
  check qualifies, and that is fine unauthenticated. A standing exemption was not created.
- **Also taken, free:** tokens are signed with an **asymmetric key** — the front-end holds the private
  key and signs, the backend holds only the public key and can verify. The backend can confirm a
  token is genuine **without being able to create one**, so a compromised backend cannot forge a
  login.
- **Cost accepted:** one credential to manage where a single application needed none; the token
  check on every endpoint, which must live in one shared place rather than be copied per route —
  repeated authorization code is where mistakes happen.
- **Unchanged:** the daemon's ingest endpoint keeps its own device token and does not pass
  through the front-end.
- **Key pair, decided 2026-09-15:** generated once at setup. **Private key in the front-end's
  environment, public key in the backend's.** Rotation is manual and rare — it signs everyone out
  at once, and is the only global revocation this design has (ADR 0014).
- **The two services are versioned and deployed separately** (Adil, 2026-09-15). **Consequence:**
  a new front-end will sometimes run against an old backend and vice versa, so **the contract
  between them must stay backward-compatible** — add fields, never remove or repurpose them. A
  breaking change means a new path kept alongside the old one.

---

## 3. Decisions made without a separate ADR

| Decision | Made by | Reasoning |
|---|---|---|
| **Linear process** — one full understanding pass (problem → scope → data → design), then build features one at a time, in order of risk | Adil | Requirements are known and the builder is the user, so there is nothing to discover by iterating. |
| **Work is ordered by descending risk**, never by convenience or by layer | Adil | Activity tracking is the riskiest thing, so it is designed and built early — not left to the end where a surprise has nowhere to go. |
| **Understanding phase time-boxed to 2 days**, no second pass | Adil | Prevents planning from consuming the build. |
| **Checkpoints at day 4, 9 and 14** | Adil | At each: if work left exceeds days left, cut something immediately rather than hoping. With no spike phase, this is the only early warning that exists. |
| **The activity tracker is the spine, not an accessory** | Adil | A focus timer alone is a stopwatch plus an honour system, and a dozen apps ship one. A focus timer whose claim can be checked is a different product. |
| **v1 is for real users, not an audience of one** | Adil | Makes open signup a genuine requirement rather than an exercise. |
| **One single scratchpad, plain text** — not multiple notes, no formatting | Adil | Replaces one LibreOffice document. Anything more is scope. |
| **Chat history is not saved** — closing the browser clears it | Adil | Matches how he uses ChatGPT today: paste, refine, copy out. |
| **Email verification stays a link, not a typed code** | Adil · 2026-09-02 | Confirmed against spec A2. Nothing to change. |
| **LLM capped at 20 chat turns per user per day** | Adil | Cost control on a metered API. Explicitly *not* a paid plan tier — pricing is v2. |
| **A completed todo can be reopened; no todo status is final** | Adil · 2026-09-02 | Spec T3 describes setting status freely. |
| **A chat turn is counted only when it succeeds** | Adil · 2026-09-02 | A reply that dies partway is not charged against the 20 and can be retried. |
| **One device per user in v1** | Adil · 2026-09-02 | Device stays part of the activity key, so more devices later need no migration. |
| **Idle time is discarded, never displayed** — 5 minutes of no keyboard or mouse and that time is thrown away | Adil | Without it, walking away for two hours reads as two hours of browsing, and the day view lies. Daily totals will be less than a full day; that gap is away time and is deliberately not named. |
| **One timezone (Adil's).** Multi-timezone users are written down, not built | Adil | Correct day boundaries for one person is a real problem; for everyone is a bigger one. |
| **10 edge cases in, 4 written down and skipped** | Adil | Decided at spec time so they are never "discovered" mid-build. |
| **Monetisation entirely out of v1** — v2, via Paddle | Adil | Success is defined as shipping a working product, not revenue. |
| **The timer measures, it never blocks** | Adil | Blocking applications is privileged system software and a different project. |
| **The scheduler stays** — a timed job does the day-boundary work, not lazy-on-read | Adil · 2026-09-11 | Lazy would also satisfy T4, but then every read path must remember to resolve stale state; miss one and it shows wrong data. Matches signed-off contracts §1.2. |
| **No uptime alert in v1** | Adil · 2026-09-11 | Drops part of `01-problem.md` success criterion 6. The site going down is noticed next time he opens it. Logs, request ids and health checks stay. |
| **ADR 0001 credential leak downgraded** | Adil · 2026-09-11 | The repository is private, so the keys were never public. Rotation is hygiene, not an emergency — until the repo is shared or made public. |

---

## 4. Deliberately NOT decided yet

Kept open on purpose, so they are decided with full information rather than early and badly:

- ~~**The technology stack**~~ — **decided 2026-08-27, ADR 0008.**
- ~~**How activity tracking actually works**~~ — **decided 2026-08-29, ADR 0009.**
- ~~**How authentication is built**~~ — **decided 2026-08-27, ADR 0008: Better Auth.**
- ~~**Which LLM provider**~~ — **decided 2026-09-02, ADR 0010: OpenAI.** Exact model still open.
- ~~**The data shape and API surface**~~ — **`04-contracts.md` signed off 2026-09-11.** The
  schema, the API surface and the tracker ingest contract are frozen; changes need an ADR.

---

## 5. The cuts already agreed, in order

**Re-framed 2026-09-11 (ADR 0012):** no longer triggered by falling behind — there is no
schedule. These get cut, **in this order**, when a piece of work turns out harder than it is
worth. Most likely trigger: activity capture.

1. **Website-level tracking.** Time per application survives; the per-website breakdown is lost.
2. **Open signup.** Same data structure, one account — no signup page, no email verification,
   no password reset.
3. **The lock-in session review screen.** The whole-day view survives; the per-session
   breakdown is lost.

There was a fourth — cutting X publishing — but that was already spent by ADR 0007.
**Three cuts remain, and all three hurt more than the one already used.**

---

## 6. Still open, owned by Adil

- **Non-negotiables** — what must never be traded away when the cuts above start. Unanswered,
  and **more important now** that no clock forces the question.
- **Sending domain** for Resend + SPF/DKIM records (ADR 0013). **Deferred 2026-09-14.** Iteration 1 cannot send real verification mail until it lands.
- **Where database backups are stored** — off-host, and where?
- **The five-minute idle rule, exact reading** (spec D5) — does the first five minutes of an
  idle stretch still count, or is the whole stretch discarded once it crosses five minutes?
  Deferred 2026-08-29. Changes the day view's numbers; blocks nothing in the schema.
- **Credential rotation** from the leaked file in ADR 0001. Unactioned.

---

*Source of truth for each decision is its ADR in `docs/adr/`. This page is a summary; if the
two ever disagree, the ADR wins.*
