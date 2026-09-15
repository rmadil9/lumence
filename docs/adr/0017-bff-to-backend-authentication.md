# ADR 0017 — The front-end forwards the user's token; the backend verifies it itself

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-15 · **amended the same day** — the service credential was dropped after
  Adil challenged it. See *Amendment* at the foot of this document.
- **Left open by:** [ADR 0016](0016-split-into-nextjs-bff-and-fastapi-backend.md), which created
  the boundary but deliberately did not decide how it is authenticated.

## Context
[ADR 0016](0016-split-into-nextjs-bff-and-fastapi-backend.md) split the product into a Next.js
front-end and a FastAPI backend, and named the sharpest risk that split introduces: **spec A7 — a user
seeing only their own data — now has to hold across two services.** The backend can no longer
resolve the user from a sign-in cookie, because there is no cookie on that side of the boundary.

`CLAUDE.md` places auth and permission rules on the human veto list, so this was put to Adil
directly.

Two independent questions hide inside one:
- **Is this request from our front-end, or from someone who found the backend's address?**
- **Which user is this request on behalf of?**

They have different answers and different failure modes, which is why a single credential cannot
answer both well.

## Options considered
1. **Forward the user's token only.** The front-end passes the user's JWT through; the backend verifies
   the signature itself. Safe on the second question — the backend never takes the front-end's word for
   who the user is — but answers nothing about the first, so anything that reaches the backend
   with a valid user token is served.
2. **A service credential only.** The front-end holds an API key and sends a `user_id` alongside each
   request. **Rejected, and worth recording why:** the backend would be trusting the front-end's claim
   about identity. A single mistake in the front-end — a `user_id` read from a query parameter rather
   than from the verified session — becomes a complete authorization bypass with nothing
   downstream to catch it. This is precisely the failure ADR 0016 warned about.
3. **Both — chosen.** The service credential answers the first question, the forwarded user token
   answers the second.

## Decision *(as amended)*

**Every front-end-to-backend request carries one thing: the user's JWT, forwarded unchanged.**
The backend **verifies the signature itself** and takes the user identity from the verified
claims.

> The original decision also required a service credential. It was dropped the same day — the
> reasoning is in the *Amendment* below, and the rejected option 2 remains rejected for the same
> reason it always was.

**The rule that follows, and it is the whole point:** the backend **never** reads a user
identifier from a request body, a query parameter, or a header the front-end filled in. The only
source of user identity is the token it verified. A front-end bug can therefore leak nothing, because
the front-end is never asked who the user is.

**Tokens are signed with an asymmetric key.** The front-end holds the private key and signs; the
backend holds only the public key and can verify. A **private key** signs and a **public key**
checks that signature, so the backend can confirm a token is genuine **without being able to
create one**. A compromised backend cannot forge a login. This costs nothing over a shared
secret and is strictly better, so there is no reason not to take it.

**The daemon's ingest endpoint is unaffected.** It lives on the backend, carries its own device
token ([ADR 0009](0009-activity-capture-fixed-window-samples.md), `04-contracts.md` part 3), and
does not pass through the front-end at all.

**The health check needs no credential.** It is the only backend route with no user behind it.

## Consequences
- **Spec A7 survives the split**, and survives it structurally rather than by care. Two
  independent facts must both hold before anything is returned.
- **One credential to manage** — the signing key pair — where a single application needed none.
- **The 15-day token lifetime ([ADR 0014](0014-jwt-sessions-instead-of-database-sessions.md))
  now applies across the boundary too**, and nothing here changes that. A forwarded token is
  still unrevocable for up to 15 days; this decision limits *who can present it*, not *how long
  it lives*.
- **Every backend endpoint needs both checks**, which is repetitive — and repetitive
  authorization is where mistakes happen. It belongs in one place both services go through, not
  copied per route. The contracts revision should say where that place is.
- **TODO(adil):** where the key pair is generated and stored, and how it is rotated. Rotating it
  signs every user out at once, which is the only global revocation this design has.

---

## Amendment, 2026-09-15 — the service credential is dropped

**Adil's argument, and it is correct for this topology:** the backend is not reachable from the
internet. nginx routes browser traffic to the front-end and the daemon's ingest path to the
backend, and nothing else. Every other backend route exists only on the private container
network. The service credential was defending a door that is not open.

**What is kept, and it is the half that mattered:** the forwarded user token, verified by the
backend itself. The rule stands unchanged — *the backend never reads a user identifier from a
body, a query parameter, or a header the front-end filled in.* Spec A7 still holds
structurally across the boundary, and a front-end bug still cannot leak another user's data.

**What is given up, recorded so it is a decision rather than a gap:**
- **Network isolation is now the only thing protecting the backend.** The nginx configuration
  becomes security-critical: one wrong route added later and the backend is public with no
  second line of defence.
- **No protection against lateral movement.** Anything else compromised on the VPS can reach the
  backend over the internal network unchallenged.

Judged a fair trade for one host running six containers.

**One category deliberately not opened.** Adil proposed that non-user requests carry no
credential at all. In this product there are effectively none — every surface sits behind
sign-in — so the only such route is the health check, which is fine unauthenticated. If a
genuinely non-user endpoint appears later, it gets its own decision then rather than a standing
exemption now.

## What would make us revisit
- A second client — a mobile app or a command-line tool — talking to the backend without going
  through the front-end. A credential identifying *which* client would then be needed.
- The backend becoming reachable from the internet for any reason. That removes the entire basis
  of this amendment, and the service credential comes straight back.
