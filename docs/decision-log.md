# Lumence — Decision Log

**Owner:** Adil · **Last updated:** 2026-09-02 · **Phase:** understanding (no product code yet)

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

## 1. The fixed constraint everything else bends around

| | |
|---|---|
| **Deadline** | 20 working days at ~10 hours/day. Fixed. |
| **The rule** | The deadline does not move. **Scope is the variable.** |
| **Consequence** | Every decision below is really a decision about what fits. |

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
    with the riskiest slice. Wants a LOG line in the signed-off `02-spec.md` — flagged, not
    added.
- **Documented property, not a bug:** one glance per 15-second box means a box shared by two
  applications goes entirely to whichever held focus at that instant. Over ~2,400 glances a
  day the proportions are right; no single box is. Correct totals, not correct moments.
- **Still open:** the exact reading of the five-minute idle rule (spec D5). Deferred by Adil.
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
| **Idle time is discarded, never displayed** — 5 minutes of no keyboard or mouse and that time is thrown away | Adil | Without it, walking away for two hours reads as two hours of browsing, and the day view lies. Daily totals will be less than a full day; that gap is away time and is deliberately not named. |
| **One timezone (Adil's).** Multi-timezone users are written down, not built | Adil | Correct day boundaries for one person is a real problem; for everyone is a bigger one. |
| **10 edge cases in, 4 written down and skipped** | Adil | Decided at spec time so they are never "discovered" mid-build. |
| **Monetisation entirely out of v1** — v2, via Paddle | Adil | Success is defined as shipping a working product, not revenue. |
| **The timer measures, it never blocks** | Adil | Blocking applications is privileged system software and a different project. |

---

## 4. Deliberately NOT decided yet

Kept open on purpose, so they are decided with full information rather than early and badly:

- ~~**The technology stack**~~ — **decided 2026-08-27, ADR 0008.**
- ~~**How activity tracking actually works**~~ — **decided 2026-08-29, ADR 0009.**
- ~~**How authentication is built**~~ — **decided 2026-08-27, ADR 0008: Better Auth.**
- ~~**Which LLM provider**~~ — **decided 2026-09-02, ADR 0010: OpenAI.** Exact model still open.
- **The data shape and API surface** — the hardest thing to change after the fact, so it is
  deliberately last.

---

## 5. The cuts already agreed, in order

If the project falls behind, these get cut **in this order**, top first:

1. **Website-level tracking.** Time per application survives; the per-website breakdown is lost.
2. **Open signup.** Same data structure, one account — no signup page, no email verification,
   no password reset.
3. **The lock-in session review screen.** The whole-day view survives; the per-session
   breakdown is lost.

There was a fourth — cutting X publishing — but that was already spent by ADR 0007.
**Three cuts remain, and all three hurt more than the one already used.**

---

## 6. Still open, owned by Adil

- **Non-negotiables** — what must never be traded away when the cuts above start. Unanswered.
- **The five-minute idle rule, exact reading** (spec D5) — does the first five minutes of an
  idle stretch still count, or is the whole stretch discarded once it crosses five minutes?
  Deferred 2026-08-29. Changes the day view's numbers; blocks nothing in the schema.
- **Credential rotation** from the leaked file in ADR 0001. Unactioned.

---

*Source of truth for each decision is its ADR in `docs/adr/`. This page is a summary; if the
two ever disagree, the ADR wins.*
