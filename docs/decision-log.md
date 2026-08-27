# Lumence — Decision Log

**Owner:** Adil · **Last updated:** 2026-08-27 · **Phase:** understanding (no product code yet)

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
- **How activity tracking actually works** — how the app in front of you and the website in
  front of you get observed, and how that reaches the server. The riskiest unknown in the
  project.
- ~~**How authentication is built**~~ — **decided 2026-08-27, ADR 0008: Better Auth.**
- **Which LLM provider** — the requirement is decided, the vendor is not.
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
- **Credential rotation** from the leaked file in ADR 0001. Unactioned.

---

*Source of truth for each decision is its ADR in `docs/adr/`. This page is a summary; if the
two ever disagree, the ADR wins.*
