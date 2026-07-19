# Lumence — Design Handoff (V1)

Framework-independent. Store tokens however your stack prefers (CSS variables, Tailwind config, theme object) — the values are what matter.

---

## 1. Principles

1. The scratchpad is the product. Everything else recedes.
2. Appeal comes from typography and whitespace, not decoration or motion.
3. The accent color is scarce by design. Scarcity is what makes it read as intentional.
4. No feature exists in the UI that isn't in the schema.

---

## 2. Tokens

### Color (light)

| Token | Value | Use |
|---|---|---|
| `bg` | `#FAF9F6` | Page background |
| `surface` | `#FFFFFF` | Panels |
| `border` | `rgba(0,0,0,0.08)` | Hairlines only |
| `text-primary` | `#1A1A18` | Body, titles |
| `text-secondary` | `#6B6A65` | Labels |
| `text-muted` | `#9C9A93` | Metadata, placeholders, empty states |
| `accent` | `#B5522F` | See restriction below |
| `warning` | `#B58A2F` | Over-limit counter only |
| `hover-bg` | `#F5F4F0` | Row hover |

**Accent restriction — the accent appears in exactly three places:**
1. Checked checkboxes
2. Focus rings
3. The primary post button

Anywhere else is a bug. Dark mode is an inversion of these values, not a separate design.

### Type

- One sans-serif family throughout. Weights **400 and 500 only** — no bold headings.

| Element | Size | Line height | Weight |
|---|---|---|---|
| Scratchpad | 17px | 1.7 | 400 |
| Task title | 15px | 1.4 | 400 |
| Section label | 13px | 1.4 | 500 |
| Metadata (age, counter, quota) | 12px | 1.4 | 400 |

The scratchpad is intentionally larger than standard UI text. It is a writing surface, not a form field.

### Spacing & shape

- Base unit 4px. Row height 44px (also the minimum touch target).
- Column gap 32px · Panel padding 24px · **Scratchpad inner padding 32px**
- Radius: 6px controls, 10px panels. No shadows, no gradients.

### Motion

120ms opacity and background transitions on hover only. Nothing enters, slides, or bounces.

---

## 3. Layout

**Desktop** — single screen, no navigation.

```
Header    wordmark · streak · AI quota · account
Left ~35% Tasks: date, add input, open tasks, Done group
Right ~65% Scratchpad (Chat button bottom-right) + publish bar beneath
Overlay   Chat sidebar, slides from right
```

**Mobile (390px)** — same components restacked.

```
Sticky header (wordmark · streak · quota · account icon)
Tabs: [ Tasks ] [ Write ]
One panel at a time, full width
Publish bar pinned above the tab switcher on Write
Chat opens as a full-height sheet
```

No bottom nav, no hamburger, no FAB. Mobile introduces no control that desktop lacks.

---

## 4. Components & states

### Task row

Schema: `title`, `description`, `status` (todo ↔ done). Nothing else.

- **Controls:** chevron · checkbox · title · description marker · age badge · trash icon
- **Gestures:** chevron expands/collapses · title click enters inline edit · checkbox toggles status only
- **States:** default · hover (bg `hover-bg`, trash fades in) · title editing (inline input, focus ring; Enter/blur saves, Escape reverts) · expanded (borderless description textarea, no save button) · completed (strikethrough, text muted) · delete confirm (row contents replaced in place with "Delete this task?" + Cancel/Delete)
- Trash is hover-revealed on desktop, always visible at reduced opacity on mobile.
- Completed tasks keep every control.
- Description marker: small muted icon after the title when a collapsed row has description text.
- Age badge (`2d`, `5d`) appears only on rolled-forward tasks.

### Scratchpad

One endless rolling text area. Silent local autosave — **no save button, no spinner, no history, no per-day separation.** User clears it manually. Empty state: muted placeholder "Start writing".

### Chat sidebar

Context-free. Nothing is sent automatically; the user pastes in what they want reworked.

- Message list (user right-aligned, AI left, copy button on AI messages) · multi-line input · submit · quota line · close
- **States:** empty (blank list, focused input, "10 of 10 left today") · in use · exhausted (input disabled, muted, "0 of 10 left today, resets tomorrow")
- No model selector, no context chips, no attachments, no suggested prompts.

### Publish bar

- X and LinkedIn toggles. Post buttons render **only** for enabled platforms — no disabled-but-visible buttons.
- Character counter appears only when X is on (`n / 280`). Both platforms on: counter still tracks X.
- Over limit: counter turns `warning`; the button stays enabled. The user decides in X's compose window.
- "Post to X" opens a prefilled compose window. LinkedIn copies the text and opens LinkedIn. **Lumence never posts anything.**
- "Mark as published" is separate, once per day, idempotent — it records the day and advances the streak. Afterward it becomes a quiet "Published today" label until midnight.

### Empty states

Muted text only. No illustrations. "No tasks yet" above a focused input; "Start writing" in the scratchpad.

---

## 5. Behavioral rules

- **Rollover:** unfinished tasks carry to the next day with an age badge. Completed tasks clear at midnight — the app shows today only.
- **No history view** in V1. Task history exists in the database but is never displayed.
- **Streak** counts days marked published, not days with completed tasks.
- **Quota** is a fixed daily AI-call cap, visible in the header. Exhaustion disables the chat input with one line of explanation. No upsell, no modal.

---

## 6. Rejected — do not re-add without a reason

| Rejected | Why |
|---|---|
| Selection-based AI polish | Added interaction cost; user pastes instead |
| Divider shortcut in scratchpad | Structure the scratchpad doesn't want |
| Server-side scratchpad sync | Deferred; local-only accepted for V1 |
| Draft history / multi-entry notepad | Contradicts the scratchpad model |
| Model selector in chat | One user, one model; complicates quota |
| Status badges next to checkboxes | The checkbox is the status |
| Due dates, priority, tags | Not in the schema |
| FAB, bottom nav, hamburger on mobile | Would create desktop/mobile divergence |
| Past-days view | Out of V1 scope |

---

## 7. Known gaps

- **Local-only scratchpad is per-device.** Desktop and phone will not share text. Accepted for V1; revisit if it bites.
- **Context-free chat** shifts copy-paste work onto the user, which is heaviest on mobile — the opposite of the product's friction-reduction pitch. Accepted as the simplest correct V1; revisit if it becomes annoying.
- **OAuth with X/LinkedIn grants identity, not posting rights.** Sign-in buttons must not imply Lumence will post on the user's behalf.
