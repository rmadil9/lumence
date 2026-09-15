# ADR 0009 — Activity capture: fixed-window samples, buffered locally, pushed to the server

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-29

## Context
Whole-day activity capture is the spine of the product (`01-problem.md`) and the one item
in scope whose cost is unknown ([ADR 0003](0003-no-spike-phase.md) removed the spike that
would have priced it). It must deliver spec D1 (time per application), D2 (time per browser
domain), D5 (the five-minute idle rule), L7 (the same breakdown inside a lock-in session
window), and E10 — hours of buffered activity arriving at once after the client has been
offline, landing in the correct day and **not double-counting**. E10 is named in `02-spec.md`
as the riskiest line in the document.

`05-architecture.md` already states the trust boundary: whatever captures activity runs on
Adil's laptop, outside the server perimeter, holds a credential, and is treated as an
untrusted client.

**Terms, defined once:**
- **Daemon** — a program that runs quietly in the background with no window.
- **Wayland / X11** — the two ways a Linux desktop can draw the screen. X11 lets any program
  ask which window has focus. Wayland deliberately forbids it, as a security feature.
- **D-Bus** — the message bus Linux desktop programs use to talk to each other.
- **SQLite** — a database that is just a file on disk, with no server to install.
- **Offline backlog** — observations that piled up locally because the laptop was awake and
  working but could not reach the server.
- **Double-counting** — the same stretch of time being saved twice, because a confirmation
  was lost and the client re-sent data the server had already stored.

## Options considered

### Getting the focused application on Ubuntu
Adil's laptop runs **Wayland**, and the `org.gnome.Shell.Introspect` D-Bus method is
access-restricted on his GNOME version — verified during this session, not assumed.

1. Query the desktop directly over D-Bus. **Ruled out by the check above.**
2. Log in under X11 instead ("Ubuntu on Xorg" at the login screen). Zero code, but changes
   how Adil's own machine runs day to day. **Kept as an escape hatch, not the plan.**
3. **A small GNOME Shell extension that publishes the focused window. Chosen.** A GNOME
   Shell extension runs inside the desktop itself, so it can see what an outside program
   cannot. Estimated at roughly half a day; it is a well-trodden path — every Linux activity
   tracker solves it this way.

### What one record represents
The choice was originally framed as "samples versus intervals". Adil correctly split it into
two independent decisions: **how much time one record covers** (which decides how much is
lost in a crash) and **whether records carry a key** (which decides whether a re-send
double-counts). The key is not a trade-off — it is a requirement.

1. **Variable-length intervals** — one record says "VS Code, 10:04 to 10:19". Fewer rows and
   exact to the second. Rejected: a record left open by a crash is lost or must be guessed,
   and a key only catches an *exact* duplicate — two variable intervals can partly overlap
   and both save cleanly, double-counting the overlap.
2. **Fixed-length windows on a fixed grid — chosen.** The day is divided into fixed
   15-second boxes. Each record says "this device, this box, this app had focus". Records
   cannot overlap, because they either land on the same box (the key rejects the second) or
   on different boxes. Worst-case loss in a crash is 15 seconds.

**Window length: 15 seconds**, chosen by Adil over the 5 seconds originally proposed.
~2,400 records per ten-hour day rather than ~7,200. The cost is that an application held for
under 15 seconds may not appear at all; nothing in `02-spec.md` requires that resolution.

### Where the browser extension sends its data
1. **To the local daemon over localhost — chosen.** The extension tells the daemon the
   active tab's domain; the daemon stamps it onto its own records. One buffer, one clock,
   one credential, one retry path, one ingest endpoint.
2. Straight to the VPS. Rejected: two credentials, two offline stories, two ingest paths to
   keep consistent — and it would break the seam described under Consequences.

### Where the five-minute idle rule is applied
1. **On the server, when the day view is built — chosen.** Each record carries the raw fact
   "seconds since the last keyboard or mouse input". The daemon applies no policy and
   discards nothing.
2. On the laptop, by not recording idle time at all. Rejected: discarded data cannot be
   recovered, so changing the threshold later would be impossible for every past day; and it
   puts policy on the far side of the trust boundary.

### What counts as the idle signal
Adil proposed using the screen blanking as the trigger for idle rather than a fixed
threshold. The instinct is right — the desktop already forms its own opinion about whether
you are there — but blanking cannot be *the rule*: its timeout varies by machine, by user,
and by whether the laptop is on battery or mains, so identical behaviour would produce
different numbers on different days, and it can be switched off entirely.

**Chosen: keep the five-minute no-input threshold as the rule, and add a screen-locked flag
as an immediate override.** A locked screen means the user is away with no ambiguity and no
waiting — it removes the five minutes of counted time that lock-and-walk-away would
otherwise burn. It costs one extra D-Bus read per sample.

## Decision

**On the laptop**
- A Python daemon starts at login. Every 15 seconds it records one **`ActivitySample`**:
  the focused application, the active browser domain if known, the seconds since the last
  keyboard or mouse input, and **whether the screen is locked**. Its timestamp is rounded
  down to the start of its 15-second box, so records from different daemon runs land on the
  same grid.
- **Time on the bare desktop with no window open is recorded like any other application**
  and displayed as **"Desktop"**. The user is active — input is happening — so the idle rule
  does not apply to it. Hiding it would make the day total understate genuinely active time
  on top of the idle time already removed. Recording it and displaying it are separate
  choices; the display half can be flipped later at no cost.
- The focused application is read from a **GNOME Shell extension** exposing it to the daemon.
- The active browser domain comes from a **browser extension** which reports to the daemon
  over localhost. JavaScript, because a browser extension has no other option.
- Every sample is written to a **local SQLite file first**. Sampling never depends on the
  network.

**Getting it to the server**
- A **separate uploader**, running alongside the sampler, sends unsent samples every ~60
  seconds: oldest first, in batches of up to 500, to `POST /api/ingest/activity` over HTTPS.
- Samples are marked sent **only** on a success response. Any failure changes nothing and is
  retried with increasing backoff. A failure can therefore never silently lose data — the
  worst it can do is send something twice.

**On the server**
- The `activity_sample` table has a **unique key of (device, box start time)** and the
  insert is `ON CONFLICT DO NOTHING`. Duplicate protection is enforced by the database, not
  by application logic. Re-sending a batch any number of times has the same effect as
  sending it once.
- The device is part of the key because two machines may legitimately report the same
  moment; a key of time alone would silently discard one machine's data.
- Every sample is filed by **the timestamp inside it, never by arrival time**, so a backlog
  lands in the hours it actually happened.
- The batch also carries the time the laptop believed it was when sending; the server
  records its own receive time and logs the difference, so a wrong laptop clock is visible
  rather than silently corrupting a day. Samples timestamped materially in the future are
  refused. No attempt is made to correct clock skew in v1.

**Authentication**
- The daemon holds a **device token** — a long random string generated once in the web UI
  and pasted into its config. Not the user's password, and revocable on its own.
- The server resolves the token to a user and stamps that user onto every sample. **A user
  identifier sent by the client is never trusted.** This is spec A7 at the ingest boundary.

## Consequences
- **E10 stops being a merge problem.** The riskiest line in the spec is answered by a unique
  key and one clause of SQL, rather than by logic that detects and reconciles overlapping
  time ranges. This is the main reason the fixed-window shape was chosen.
- **Sleep and idle are distinguishable in the data for free**, satisfying E13: a sleeping
  laptop produces no records at all, while an idle one produces records with a large
  "seconds since input" value. They cannot be confused.
- **Contingency ladder rung 1 stays cheap.** The browser domain is one nullable column on
  `activity_sample`. Dropping browser tracking means *not building the browser extension* —
  the daemon, the ingest contract, the table and the day view are untouched, the column is
  simply always empty, and no data migrates. This is the seam `04-contracts.md` promised.
- **A GNOME Shell extension is now a build item**, roughly half a day, and it is a component
  that can break on a GNOME upgrade. That is an ongoing maintenance cost on Adil's own
  machine, not on the server.
- **Sampling gives correct totals, not correct moments.** The daemon glances once per
  15-second box, and whatever holds focus at that instant is credited with the whole box. A
  box containing seven seconds of one application and eight of another goes entirely to one
  of them. Across ~2,400 glances a day the proportions come out right — an application used
  for 40% of the day catches roughly 40% of the glances — but no individual box should be
  trusted. The failure mode is an application touched for only a few seconds, which may never
  be caught at all. Accepted: the alternative is variable-length intervals, which reopens both
  the crash-loss and the double-counting problems this ADR exists to close.
- **Known limitation, logged and deliberately not built: passive media reads as idle.**
  Watching a forty-minute video without touching the keyboard or mouse trips the five-minute
  threshold, and thirty-five minutes of genuinely engaged time is discarded. The real fix is
  to ask the system whether an application is actively preventing the screen from sleeping —
  which video players do — and treat that as active. Decided by Adil on 2026-08-29 to log it
  rather than build it, because it competes with the riskiest iteration in the project. **This
  wants a `LOG` line in the edge-case table of `02-spec.md`, which is signed off — flagged
  for Adil, not added.**
- **Storage grows steadily** — ~2,400 rows per user per ten-hour day, roughly 0.9M rows a
  year for one user. Trivial for Postgres, but the day view and session review must
  aggregate rather than fetch rows, and the table will need an index on (user, sample time).
- **Idle records are stored and never shown.** Deliberate: it is what makes the threshold
  changeable later without destroying history.
- **The capture client is a second deployable thing** with its own install and update story
  on Adil's laptop. It is not covered by the VPS deploy.

## Escape hatches, cheapest first
Agreed now, while calm, so capture never presents a cliff:
1. **Log in under X11** — one dropdown at the Ubuntu login screen, zero code. Removes the
   Wayland problem entirely at the cost of Wayland on Adil's own machine.
2. **Contingency ladder rung 1** — drop browser domains, keep applications.
3. **Last resort** — capture goes, and the lock-in timer reverts to an honour system. That
   is the product losing its spine, and it is what the rungs above exist to avoid.

## The five-minute idle rule — resolved 2026-09-02
Decided by Adil. **AI recommended Reading A and was overruled.**

- **Reading A (recommended, rejected)** — the first five minutes of a no-input stretch still
  count; only the time past five minutes is discarded. One comparison per sample
  (`idle_seconds <= 300`), no backward reasoning. Argued on the grounds that five minutes of
  silence is often reading, thinking, or a phone call — real work at the machine.
- **Reading B (chosen)** — once a stretch reaches five minutes, **the whole stretch is
  discarded, including its first five minutes.** Walking away for thirty minutes contributes
  zero. A stretch that ends before five minutes counts in full.

**What Reading B costs.** It cannot be evaluated one sample at a time. The aggregation must
first group consecutive no-input samples into *stretches*, take each stretch's maximum
idle value, and drop every sample in any stretch that reached the threshold. That is a
standard gaps-and-islands window query — well-trodden SQL, but not the single `WHERE` clause
Reading A would have been. `04-contracts.md` carries it.

**Consequences.** Day totals will be lower than under Reading A, and reading a long document
without touching anything contributes nothing at all. That is the honest version of the
number Adil wants. The threshold remains changeable, because the raw facts are still stored
and nothing is discarded at write time — which is the whole reason the rule lives at query
time.

## What would make us revisit
- The GNOME Shell extension route failing or costing materially more than half a day. The
  answer is escape hatch 1, not a redesign.
- Capture overrunning its estimate by 50% or more, which ADR 0003 already ties to the
  contingency ladder.
