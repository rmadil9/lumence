# ADR 0017 — The BFF proves itself with a service credential and forwards the user's token

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-15
- **Left open by:** [ADR 0016](0016-split-into-nextjs-bff-and-fastapi-backend.md), which created
  the boundary but deliberately did not decide how it is authenticated.

## Context
[ADR 0016](0016-split-into-nextjs-bff-and-fastapi-backend.md) split the product into a Next.js
BFF and a FastAPI backend, and named the sharpest risk that split introduces: **spec A7 — a user
seeing only their own data — now has to hold across two services.** The backend can no longer
resolve the user from a sign-in cookie, because there is no cookie on that side of the boundary.

`CLAUDE.md` places auth and permission rules on the human veto list, so this was put to Adil
directly.

Two independent questions hide inside one:
- **Is this request from our BFF, or from someone who found the backend's address?**
- **Which user is this request on behalf of?**

They have different answers and different failure modes, which is why a single credential cannot
answer both well.

## Options considered
1. **Forward the user's token only.** The BFF passes the user's JWT through; the backend verifies
   the signature itself. Safe on the second question — the backend never takes the BFF's word for
   who the user is — but answers nothing about the first, so anything that reaches the backend
   with a valid user token is served.
2. **A service credential only.** The BFF holds an API key and sends a `user_id` alongside each
   request. **Rejected, and worth recording why:** the backend would be trusting the BFF's claim
   about identity. A single mistake in the BFF — a `user_id` read from a query parameter rather
   than from the verified session — becomes a complete authorization bypass with nothing
   downstream to catch it. This is precisely the failure ADR 0016 warned about.
3. **Both — chosen.** The service credential answers the first question, the forwarded user token
   answers the second.

## Decision

**Every BFF-to-backend request carries two things:**

1. **A service credential**, proving the caller is our BFF. Requests without it are refused
   outright, whatever else they carry.
2. **The user's JWT, forwarded unchanged.** The backend **verifies the signature itself** and
   takes the user identity from the verified claims.

**The rule that follows, and it is the whole point:** the backend **never** reads a user
identifier from a request body, a query parameter, or a header the BFF filled in. The only
source of user identity is the token it verified. A BFF bug can therefore leak nothing, because
the BFF is never asked who the user is.

**Tokens are signed with an asymmetric key.** The BFF holds the private key and signs; the
backend holds only the public key and can verify. A **private key** signs and a **public key**
checks that signature, so the backend can confirm a token is genuine **without being able to
create one**. A compromised backend cannot forge a login. This costs nothing over a shared
secret and is strictly better, so there is no reason not to take it.

**Machine-to-machine requests carry only the service credential.** The daemon's ingest endpoint
lives on the backend and has its own device token
([ADR 0009](0009-activity-capture-fixed-window-samples.md), `04-contracts.md` part 3), which is
unchanged by this decision — it does not pass through the BFF at all.

## Consequences
- **Spec A7 survives the split**, and survives it structurally rather than by care. Two
  independent facts must both hold before anything is returned.
- **Defence in depth.** Losing the service credential does not expose any user's data, because
  the attacker still has no valid user token. Losing a user's token exposes only that user, and
  only from something that can also present the service credential.
- **Two credentials to manage** — the service credential and the signing key pair — where a
  single application needed neither. That is the operational cost of the boundary.
- **The service credential is an environment variable on the host**, never in an image, never
  sent to the browser. Rotating it means restarting both services together.
- **The 15-day token lifetime ([ADR 0014](0014-jwt-sessions-instead-of-database-sessions.md))
  now applies across the boundary too**, and nothing here changes that. A forwarded token is
  still unrevocable for up to 15 days; this decision limits *who can present it*, not *how long
  it lives*.
- **Every backend endpoint needs both checks**, which is repetitive — and repetitive
  authorization is where mistakes happen. It belongs in one place both services go through, not
  copied per route. The contracts revision should say where that place is.
- **TODO(adil):** where the key pair is generated and stored, and how it is rotated. Rotating it
  signs every user out at once, which is the only global revocation this design has.

## What would make us revisit
Adding a second client — a mobile app or a command-line tool — that talks to the backend without
going through the BFF. The service credential would then need to identify *which* client, not
merely that it is trusted.
