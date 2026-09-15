# 03 — Domain Model & Ubiquitous Language

> Status: **draft for Adil to correct.** Written 2026-09-02 from the signed-off `02-spec.md`
> and ADRs 0004–0011. Everything here traces to a spec line or an ADR — nothing is invented.
> Where the spec is silent, it says `TODO(adil):` rather than guessing.

This document answers three questions and nothing else:
- **What things does the product have?** (entities)
- **What states do they move through?** (lifecycle)
- **What rules must never break?** (invariants)

It does not decide table names, column types, or routes. Those are `04-contracts.md`.

---

## 1. Ubiquitous language

One word per concept, used everywhere — code, database, user interface, and these documents.
The point is that "the thing you start when you want to focus" has exactly one name, so a
conversation about it can never be ambiguous.

| Word | Means | Never call it |
|---|---|---|
| **User** | One person with one account | Member, profile |
| **Auth session** | Being signed in on a browser | *Session* on its own — that word is taken |
| **Lock-in** | One deep-work countdown | Focus block, pomodoro, timer session, *session* |
| **Todo** | One item on the day's list | Task, item, ticket |
| **Notepad** | The single scratchpad a user owns | Note, document, notes (plural) |
| **Chat turn** | One message sent to the LLM and its reply | Message, prompt, request |
| **Device** | One machine registered to report activity | Client, agent, tracker |
| **Activity sample** | One 15-second observation of what had focus | Event, heartbeat, tick, record |
| **Application** | The desktop program that had focus | App name, process, window |
| **Domain** | The website that had focus inside the browser | Site, URL, host, tab |
| **Day** | A calendar day in the one fixed timezone | Date, period |

**The collision worth naming out loud:** "session" means two unrelated things in this product —
being signed in, and a block of deep work. The word is therefore **banned on its own.** Say
**auth session** or **lock-in**, always.

---

## 2. Entities

### User
The person. Created by signing up; one per email address.

- Owns everything else in the product. Nothing exists without a user.
- Identified for linking purposes by **email address**, which is unique across all users
  ([ADR 0011](adr/0011-account-linking-requires-a-verified-email.md)).
- May sign in by **password**, by **Google**, or by both — these are two routes to one user,
  not two users (spec A6).
- **Out of v1:** deleting an account, editing a profile, changing an email address
  (spec A, *Out*).

### Todo
One line on today's list.

- Has a **title** (spec T1, T2) and a **status** (T3).
- Has a **due day**, which is **the day it was created**. There is no date picker in v1
  (spec T, *Notes*).
- Has a **position** in the list, which the user can drag to change (T6, T7).
- Deleting is **permanent** — no undo, no archive, and everything attached goes with it (T5).
- Has **no time attached to it, ever** ([ADR 0004](adr/0004-drop-per-todo-time-tracking.md)).
  Nothing in this product connects a todo to hours spent.

### Lock-in
One countdown, behaving like the Google timer ([ADR 0006](adr/0006-lock-in-is-a-plain-countdown.md)).

- Has a **planned duration**, entered by the user. No minimum, no maximum (spec L1).
- Has a **start time**, an **end time**, and **remaining time** while it runs.
- **Only exists as a stored record if it ran to 00:00:00** (L6). A lock-in that is reset is
  discarded entirely and appears nowhere (L5).
- Carries **no goal, label, or category.** Nothing describes what the lock-in was *for*
  (spec L, *Out*).
- Is **not** judged. There is no score, no adherence figure, no productive/unproductive
  split (ADR 0006).

### Notepad
The single scratchpad.

- **Exactly one per user.** Not zero, not many. It is not created, named, listed, or deleted
  (spec N2).
- Holds **plain text only** — no formatting of any kind (N3).
- Saves without the user asking (N1).
- It has no relationship to the chat. Copy-paste between them is the user's job, in both
  directions, deliberately (spec M, *Notes*).

### Chat turn
One exchange with the LLM.

- **Not persisted.** Closing the browser clears the conversation; reopening shows an empty
  chat (spec M4). There is no stored conversation and no history.
- The **only** thing kept about chat is **how many turns a user has spent today**, because of
  the cap (M5).
- **A turn is counted only when it succeeds** (Adil, 2026-09-02). A reply that dies partway
  is not charged against the cap and can be retried — which is what makes spec M6 and E4
  humane rather than punishing.

### Device
One machine registered to report activity.

- Belongs to exactly one user.
- Holds a **device token** — a long random string, not the user's password, revocable on its
  own ([ADR 0009](adr/0009-activity-capture-fixed-window-samples.md)).
- Exists so that two machines reporting the same moment are two real observations rather than
  a collision.
- **One device per user in v1** (Adil, 2026-09-02). The device is still part of the activity
  sample's key, so the design supports more later with no migration — v1 simply refuses to
  register a second one.

### Activity sample
One 15-second observation. The highest-volume thing in the product, ~2,400 per user per
working day.

Each one records:
- the **device** it came from,
- the **box** it belongs to — a 15-second slot, timestamps rounded down onto a fixed grid,
- the **application** that had focus,
- the **domain**, if the focused application was a browser and the browser extension is
  installed — **optional, and empty is normal** (this is the seam that keeps contingency
  ladder rung 1 cheap),
- **seconds since the last keyboard or mouse input**,
- **whether the screen was locked** — awake but absent, which is not the same as asleep,
- **whether an application was asking the desktop to stay awake** — the signal that separates
  watching something from having walked away
  ([ADR 0015](adr/0015-idle-inhibitor-distinguishes-watching-from-away.md)).

It records **facts only**. No rule has been applied to it — in particular the five-minute
idle rule is applied when the day view is read, never when the sample is written (ADR 0009).

---

## 3. Lifecycle states

### User

```
    signs up (email + password)                signs up with Google
              │                                          │
              ▼                                          ▼
       ┌─────────────┐   clicks the emailed link   ┌──────────┐
       │ unverified  │ ──────────────────────────► │ verified │
       └─────────────┘                             └──────────┘
              │                                          ▲
              └──────────────────────────────────────────┘
                 Google arrives with the same email:
                 Google takes the address, the unverified
                 password credential is discarded (ADR 0011)
```

- **unverified** — the account exists and **can read and write no app data whatsoever**
  (spec A1). It is an account in name only.
- **verified** — full access to that user's own data, and only their own (A7).
- Google signup arrives **already verified** — Google has done the verifying, provided Google
  itself reports the address as verified (ADR 0011).
- The verification link **works exactly once** and expires; an expired one is refused and
  offers a resend (A2).

### Todo

```
   created ──► pending ⇄ in-progress ⇄ completed
                  │           │            │
                  └─────┬─────┴────────────┘
                        ▼
                     delayed          (set automatically at the day boundary,
                                       and also settable by hand)

   every arrow runs both ways — no status is final, completed included
```

- All four states are set by the user (spec T3).
- **`delayed` is also set automatically:** a todo not `completed` by the end of its due day
  becomes `delayed` at the day boundary (T4).
- That flip must be **correct whether or not the app was open at midnight** (T4, E11). It is
  therefore a property of time passing, not of anyone looking.
- **A completed todo can be reopened** (Adil, 2026-09-02). `completed` is not final — status
  moves freely in any direction, consistent with spec T3.
- Deletion is available from **any** state and is permanent (T5).

### Lock-in

```
   started ──► running ⇄ paused
                  │
      reaches 00:00:00 │              reset (from running or paused)
                  ▼                            │
             completed                         ▼
          (stored, reviewable)          discarded — nothing is
                                        ever stored (ADR 0006)
```

- **running** — counting down.
- **paused** — **frozen.** Remaining time does not decrease (spec L3). Resume continues from
  exactly where it froze, so a two-hour lock-in may span any amount of wall-clock time (L4).
- **completed** — reached zero. Stored with its start time, end time and duration (L6). This
  is the **only** way a lock-in becomes a record.
- **discarded** — reset. Not a stored state; the record never existed (L5).
- There is **no "end early"**. The only two exits are zero and reset (ADR 0006).
- A running lock-in **survives a page reload** (L2) and **survives being signed out** (E5).
  It therefore lives on the server, not in the browser tab.

### Activity sample
No lifecycle. A sample is written once and never changes. It is a fact about a moment that
has already passed.

---

## 4. Invariants — the rules that must never break

**Ownership and access**
1. Every todo, notepad, chat turn, device and activity sample belongs to **exactly one user**.
2. **No query ever crosses users.** User B cannot read or write anything belonging to user A
   (spec A7, E8). This is a security property, not a feature.
3. An **unverified** user can read and write **no app data at all** (A1).
4. An activity sample's owner is decided **by the server, from the device token**. A user
   identifier sent by a client is never trusted (ADR 0009).

**Identity**
5. **One email address, one user.** Never two accounts for the same address (A6, ADR 0011).
6. A password credential and a Google identity may both point at one user; they never point at
   two.
7. Linking the two requires the existing account's email to be **verified**. Where it is not,
   the Google sign-in takes the address and the unverified password credential is discarded
   (ADR 0011).

**Todos**
8. A todo's **due day is the day it was created** and never changes (spec T, *Notes*).
9. A todo that is not `completed` at the end of its due day **is** `delayed` — regardless of
   whether anyone opened the app (T4, E11).
10. Every todo has a position, and positions within one user's list are unambiguous, so the
    order is identical on every device (T7).

**Lock-ins**
11. **At most one lock-in is `running` or `paused` per user at any moment** (L8, E2). Starting
    a second is refused. The same account in two browser tabs shows the same single lock-in.
12. **A lock-in exists as a record only if it reached 00:00:00.** A reset lock-in leaves no
    trace anywhere — not in the day view, not in any review (L5, ADR 0006).
13. While `paused`, remaining time **does not decrease** (L3).

**Notepad**
14. **Every user has exactly one notepad, always** — created with the user, never deleted
    (N2).

**Chat**
15. A user's chat turns in one day **never exceed 20** (M5). The 21st is refused with a clear
    message.
15a. **Only a successful turn is counted.** A failed reply costs the user nothing.
16. The count resets at the day boundary (M5).
17. **No chat conversation is ever stored** (M4).
18. A failed reply leaves **no half-written message** anywhere (M6, E4).

**Activity**
18a. **A user has at most one device in v1.** Registering a second is refused.
19. **At most one activity sample per (device, box).** A second one for the same pair is
    silently ignored, not an error — this is what makes a replayed backlog safe (E10,
    ADR 0009).
20. A sample is filed by **the time inside it**, never by the time it arrived (E10).
21. A sample is **never modified after it is written.**
22. **No rule is applied at write time.** The five-minute idle rule is applied when the day
    view is read (ADR 0009).
22a. **Idle is all-or-nothing per stretch (Reading B, Adil 2026-09-02).** A continuous run of
    samples with no keyboard or mouse input is one *stretch*. If a stretch ever reaches five
    minutes, **the entire stretch is discarded — including its first five minutes.** Walking
    away for thirty minutes contributes zero, not five minutes. A stretch that ends before
    five minutes counts in full.
22b. **A locked screen is discarded immediately**, however short the stretch — locking is
    unambiguous absence and needs no waiting period (ADR 0009).
22c. **A stretch during which an application held the desktop awake is counted in full**, however
    long, and is exempt from 22a (ADR 0015). That inhibitor is the evidence separating a person
    watching something from a person who has left. Without it, both look identical in the data.
22d. **A locked machine still produces samples; a sleeping one produces none.** Locked means
    awake and absent. Asleep means no data exists at all (E13). The two are never conflated.

**Time**
23. **All timestamps are stored in UTC.** Days are worked out in **one fixed timezone** —
    Adil's. Multi-timezone users are written down and not built (E7).
24. **The day's displayed total is less than the wall-clock day, always.** Idle time was
    discarded and away time never existed. That gap is deliberately never shown as a category
    (D5, spec D *Notes*).
25. **Absence of samples means the machine was off or asleep. It does not mean idle.** The two
    are different in the data and must never be conflated (E13).

---

## 5. Deliberately not in this model

Named here so they are never quietly reintroduced:

- **No time on a todo.** No timer, no entries, no totals (ADR 0004).
- **No focus classification.** No whitelist, no productive/unproductive flag, no score
  (ADR 0006).
- **No X entity of any kind.** No draft, no post, no posted state. Lumence stores nothing
  about X and never learns whether anything was posted (ADR 0007).
- **No chat history.** Not a conversation, not a message, not a thread (M4).
- **No "away" or "idle" category.** Idle time is subtracted, never displayed (D5).
- **No subtasks, tags, projects, priorities, or recurrence** on todos (spec T, *Out*).
- **No billing, plan, tier, or subscription entity.** v2, via Paddle.

---

## 6. Open — for Adil

**Nothing. All four questions were resolved on 2026-09-02:**

- Chat turns count **on success only** — a failed reply costs nothing.
- A completed todo **can be reopened**; no status is final.
- **One device per user** in v1.
- The five-minute idle rule takes **Reading B** — see invariant 22a.

This document is **signed off**. Changes from here need an ADR.
