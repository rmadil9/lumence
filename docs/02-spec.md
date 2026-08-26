# 02 — V1 Scope

> Status: **draft for sign-off.** Written from the scope interview of 2026-08-26.
> Every line below is a behaviour Adil can *see happen*, with an acceptance criterion
> concrete enough to become a test name.

v1 has **five surfaces**: auth, todos, lock-in timer, notepad (+ LLM chat + X link), and
day analytics. Per-todo time tracking was in the kickoff seed list and has been **cut** —
see [ADR 0004](adr/0004-drop-per-todo-time-tracking.md).

---

## A — Authentication

Open signup, real users. Not an audience of one.

| # | Behaviour | Acceptance criterion |
|---|---|---|
| A1 | Sign up with email + password | Account is created in an unverified state and cannot read or write any app data |
| A2 | Verify email via an emailed link | Unverified → verified; the link works exactly once; an expired link is refused and offers a resend |
| A3 | Sign in | Correct credentials grant a session; a wrong password is refused without revealing whether the email exists |
| A4 | Sign out | The session ends; a protected page reached afterwards redirects to sign-in |
| A5 | Forgot password → reset via an emailed link | The link works once and expires; after reset the old password no longer signs in |
| A6 | Sign up / sign in with Google | A Google account produces a signed-in session; the same email arriving by both routes resolves to one account, not two |
| A7 | Every user sees only their own data | User B cannot read or write any todo, notepad, chat, or activity record belonging to user A |

**Out:** magic links, 2FA, any OAuth provider other than Google, account deletion,
profile editing, changing email address.

---

## T — Todos

| # | Behaviour | Acceptance criterion |
|---|---|---|
| T1 | Create a todo with a title | It appears in the list immediately and survives a reload |
| T2 | Edit a todo's title | The change persists |
| T3 | Set a todo's status: `pending`, `in-progress`, `completed`, `delayed` | The status persists and the list reflects it |
| T4 | A todo not completed by end of its due day becomes `delayed` automatically | At the next day boundary an incomplete todo shows `delayed` — correctly, whether or not the app was open at midnight |
| T5 | Delete a todo | It is gone permanently, along with everything attached to it. No undo, no archive |
| T6 | Todos default to creation order | A newly created todo appears at the end of the list |
| T7 | Reorder todos by drag and drop | The new order persists across reload and across devices |

**Notes**
- Todos are **due the day they are created**. There is no date picker in v1.
- `delayed` is set automatically at the day boundary and can also be set manually.

**Out:** due dates other than today, sub-tasks, tags, projects, priorities, recurring
todos, search, filtering, notes attached to a todo, bulk actions.

---

## L — Lock-in session

A countdown timer, behaving like the Google timer.

| # | Behaviour | Acceptance criterion |
|---|---|---|
| L1 | Enter a duration and start | The clock counts down from the entered value. No minimum, no maximum |
| L2 | The session survives a page reload | Reopening shows the correct remaining time, not a restarted clock |
| L3 | Pause | The countdown **freezes**. Remaining time does not decrease while paused |
| L4 | Resume | The countdown continues from exactly where it froze. A 2-hour session may span any amount of wall-clock time |
| L5 | Reset | The session is **discarded entirely**. Nothing is stored and it does not appear in any review or day view |
| L6 | The clock reaches 00:00:00 | The session ends and is stored as completed, with its start time, end time, and duration |
| L7 | Review a completed session | Shows time per application and time per browser domain **within that session's window only** |
| L8 | Only one session at a time | Starting a session while one is active is refused; the same account in two tabs shows the same single session |

**Notes**
- There is **no "focused vs unfocused" classification.** Lumence shows the raw breakdown;
  Adil judges it. No app whitelist, no scoring, no productivity grade.
- There is **no "end early"**. The only exits are running to zero or resetting.
- Paused stretches are still real time on the machine and still appear in the day view;
  whether they fall inside the session window follows from the session's start and end times.

**Out:** scheduled or recurring sessions, session goals or labels, breaks, session history
list, streaks, notifications when a session ends.

---

## N — Notepad

| # | Behaviour | Acceptance criterion |
|---|---|---|
| N1 | Write text that saves without an explicit save action | A reload shows the latest text |
| N2 | One single scratchpad per user | There is exactly one notepad. No create, no rename, no delete, no list |
| N3 | Plain text only | No bold, headings, lists, or any formatting |

**Out:** multiple notes, folders, rich text, markdown rendering, version history, export,
attachments, search.

---

## M — LLM chat

A separate chat area. It does not read from or write to the notepad automatically.

| # | Behaviour | Acceptance criterion |
|---|---|---|
| M1 | Paste text into the chat and get a reply | The reply appears in the conversation |
| M2 | Multi-turn conversation | A third message is answered with turns 1 and 2 in context |
| M3 | Copy a reply | A copy button on each reply puts that reply on the clipboard |
| M4 | Chat is not persisted | Closing the browser clears the conversation. Reopening shows an empty chat |
| M5 | Per-day turn cap of 20 | The 21st turn in a calendar day is refused with a clear message; the count resets at the next day boundary |
| M6 | A reply that fails partway | No half-written reply is left on screen; the failure is stated and the turn can be retried |

**Notes**
- The cap is **20 turns per user per day**. It is a cost control, not a plan tier —
  tiers are v2 and use Paddle.
- Copy-paste between notepad and chat is the user's job in both directions. Deliberate.

**Out:** persisted chat history, multiple conversations, applying a reply back into the
notepad automatically, streaming niceties, prompt templates, model selection, file uploads.

---

## X — Post on X

| # | Behaviour | Acceptance criterion |
|---|---|---|
| X1 | A "Post on X" button on the notepad | Clicking it opens X in a new browser tab |

**That is the entire surface.** No prefilled compose window, no drafts, no character
counting, no posted state. Lumence stores nothing about X and never knows whether anything
was posted. The user copies whatever text they want, whenever they want.

**Out:** everything else — the X API, drafts, threads, scheduling, character limits,
post history, any other platform.

---

## D — Day analytics

| # | Behaviour | Acceptance criterion |
|---|---|---|
| D1 | See time per application for a chosen day | Per-app totals are shown and are consistent with the underlying activity records |
| D2 | See time per browser domain for the same day | Per-domain totals are shown alongside the per-app view |
| D3 | Choose a different day | Yesterday and older days load correctly; a day with no data shows an empty state, not an error |
| D4 | See completed lock-in sessions on the day | Sessions appear positioned on the day, so intention can be compared against where attention went |
| D5 | Idle time is excluded | After 5 minutes with no keyboard or mouse input, that time is discarded — it is not attributed to the app in front and is not shown as its own category |
| D6 | One day at a time | The view covers a single day. No weekly, monthly, or trend views |

**Notes on idle — the rule in full**
- Device in use → time counts against the app in the foreground.
- Device on, user away past the 5-minute threshold → that time is **discarded**.
- Device asleep or shut down → there is no data at all.
- Daily totals will therefore be **less than the wall-clock day**. That gap is away time and
  is intentionally never displayed.

**Out:** weekly/monthly trends, comparisons between days, goals, exports, per-todo time,
categorising apps as productive or unproductive, any dimension other than time.

---

## Explicitly OUT of v1 — whole product

- Billing, payments, subscription tiers — v2, via Paddle
- Hard enforcement or blocking of apps and sites during a lock-in session
- The real X API; posting on the user's behalf
- LinkedIn or any other platform
- Mobile app, offline-first sync, media attachments
- Per-todo time tracking ([ADR 0004](adr/0004-drop-per-todo-time-tracking.md))
- Any analytics dimension other than time

---

## Edge cases — decided, not discovered

**IN** = built and tested in v1. **LOG** = written down here, deliberately not built.

| # | Edge case | Where it bites | Call |
|---|---|---|---|
| E1 | Empty / one / many | Todo list; a day view with no data; a day view with a very long app list | **IN** |
| E2 | Concurrent sessions | Two lock-in timers; the same account open in two tabs | **IN** — one active session per user |
| E3 | Duplicate submit | Double-clicking create-todo or start-session | **IN** |
| E4 | Partial failure | An LLM reply dying halfway | **IN** — no half-message left on screen |
| E5 | Expired session (auth) | Being signed out while a lock-in timer runs | **IN** — the running session must not be lost |
| E6 | Unicode | Emoji and non-Latin text in todos and the notepad | **IN** |
| E7 | Timezone + DST | The "today" boundary; a session crossing midnight; the DST shift | **IN for one fixed timezone.** Multi-timezone users: **LOG** |
| E8 | Permission denied | User B requesting user A's todos, notepad, or activity | **IN** — this is A7; a security property, not an edge case |
| E9 | Network mid-flight | The connection dropping during a notepad autosave | **IN** — typing must not be silently lost |
| E10 | Capture client offline, then reconnecting with a backlog | Laptop shut or VPS unreachable, then hours of buffered activity arriving at once | **IN** — late data must land in the correct day and must not double-count |
| E11 | Auto-delay across midnight | The machine asleep at midnight; todos flipping to `delayed` only when next opened | **IN** — the flip must be correct regardless of whether the app was running |
| E12 | LLM cap hit mid-conversation | The 20-turn cap reached on turn 7 of a conversation | **IN** — clear message, resets next day |
| E13 | Idle boundary | Exactly-5-minute gaps; machine sleep and wake; sleep is absence of data, not idle | **IN** — this is what makes the numbers trustworthy |
| E14 | Very long notepad | One scratchpad growing to thousands of lines over months | **LOG** |

**E10 is the riskiest line in this document** and the only one whose cost is unproven
(`00-process.md`). If it slips, contingency ladder rung 1 fires. It stays IN.

---

## Open, and owned by Adil

- TODO(adil): **non-negotiables** — what must never be traded away when the contingency
  ladder is descended. Still unanswered; belongs in `docs/preferences.md`.
