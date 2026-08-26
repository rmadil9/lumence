# ADR 0005 — Full email auth, plus Google OAuth, in v1

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-08-26

## Context
v1 is for real users with open signup, not an audience of one. The question was how much
authentication belongs inside a fixed 20-day budget.

I advised cutting **email verification and password reset** from v1, keeping only sign up,
sign in, and sign out. The reasoning: both require working outbound email — a provider,
domain records, deliverability — which `00-process.md` already lists among the operational
costs that "can eat a day" and which appear on no feature list. Contingency ladder rung 2
goes further still and contemplates dropping open signup entirely.

Adil rejected that. He wants the complete, conventional account experience in v1, and
added Google OAuth on top.

## Options considered
1. **Sign up / sign in / sign out only.** No outbound email at all. My recommendation.
   Rejected by Adil.
2. **Full email auth: signup, verification, sign in/out, password reset.** Chosen.
3. **Full email auth plus Google OAuth.** Chosen — Adil added OAuth during the interview.

## Decision
v1 ships sign up, email verification, sign in, sign out, password reset, and Google OAuth.
The mechanism — library, provider, session strategy — is not decided here; it belongs to
the architecture phase and gets its own ADR.

## Consequences
- **Outbound email becomes a v1 dependency.** Verification and reset links do not work
  without it. Deliverability problems on a self-hosted VPS are a real and unbudgeted risk.
- **Google OAuth adds a third-party integration** — client registration, redirect URIs,
  and the account-linking question when the same email arrives by both routes. Spec line A6
  requires it to resolve to one account.
- **Auth is now a meaningful slice, not a formality**, and it competes for days with
  activity capture, which is the riskier work.
- **Ladder rung 2 gets more expensive.** Descending it now means abandoning more built work
  than it would have.
- I advised once and was overruled. Recorded so the reasoning survives if email
  deliverability bites; not to be re-argued.

## What would make us revisit
Outbound email consuming more than roughly half a day at a checkpoint. The answer then is
the contingency ladder, not a redesign of auth.
