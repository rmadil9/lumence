# ADR 0013 — Resend as the outbound email relay

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-11

## Context
[ADR 0005](0005-full-email-auth-plus-google-oauth.md) put email verification and password reset
in v1, which makes working outbound email a hard dependency: without it, signup cannot complete
and a forgotten password cannot be recovered (spec A2, A5).

[ADR 0002](0002-self-host-on-a-single-vps.md) already predicted the outcome despite the
self-hosting stance: *"a fresh VPS IP has no sending reputation, so a third-party SMTP relay is
the likely outcome."* Both ADRs list email deliverability among the operational costs that can
eat a day and appear on no feature list.

A **relay** here means a third-party service that accepts our email and delivers it, carrying
the sending reputation we do not have.

## Options considered
1. **Send directly from the VPS** — fully self-hosted, consistent with ADR 0002's stance, and
   zero cost. Rejected: a fresh server IP has no sending reputation, so verification links land
   in spam or are dropped outright, and building reputation is slow work that has nothing to do
   with this product. ADR 0002 anticipated exactly this.
2. **Resend — chosen by Adil.** Developer-facing, simple to wire up, and its free tier covers a
   personal-scale product comfortably.
3. Postmark — strong deliverability reputation, particularly for transactional mail. Not chosen.
4. Amazon SES — cheapest at volume, more setup, and new accounts start in a sandbox that only
   sends to verified addresses until a review is passed. Not chosen.

## Decision
**Resend** is the outbound email relay for verification and password-reset messages. It is wired
in behind Better Auth's email hook, so the relay is named in one place.

This is a third-party dependency adoption, which `CLAUDE.md` places on the human veto list.
Adil approved it explicitly on 2026-09-11.

## Consequences
- **The self-hosting stance has one deliberate exception**, and this is it. ADR 0002 said
  "everything self-hosted"; email leaves the VPS. That was foreseen in ADR 0002's own
  consequences rather than discovered here.
- **DNS records are now setup work, not a feature.** Sending from a domain requires SPF and DKIM
  records — entries in DNS that let a receiving server check the mail genuinely came from us —
  and getting them wrong means mail silently going to spam. **TODO(adil):** the domain Lumence
  will send from. Nothing else in the project is blocked by it.
- **A live account is needed before the auth iteration can be finished end to end.** Signup cannot be
  tested to completion without it.
- **Swapping relays later is cheap** — it is configuration behind one hook, not a code change
  spread through the app.
- **Deliverability is now someone else's problem**, which is the entire point. If verification
  mail still fails, the cause is DNS or content, not server reputation.

## What would make us revisit
Outgoing volume outgrowing the free tier, or Resend's deliverability proving poor for this
domain. The answer is a different relay behind the same hook, not a redesign.
