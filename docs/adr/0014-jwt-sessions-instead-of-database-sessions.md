# ADR 0014 — Stateless JWT sign-in instead of database sessions

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-11
- **Supersedes:** the session-storage half of [ADR 0008](0008-stack-single-nextjs-app-on-docker.md).
  Better Auth remains the auth library; only how sign-in state is held changes.

## Context
[ADR 0008](0008-stack-single-nextjs-app-on-docker.md) chose Better Auth with **sessions stored
in our own Postgres**, and `05-architecture.md` §1.1 wrote down the reasoning. Adil asked to
reverse it in favour of **JWT**, on the grounds that he wants to design toward a scalable
approach, and stated explicitly that revocation and token theft are not concerns at this stage.

**Terms, defined once:**
- **Database session** — the server keeps a row saying "this cookie belongs to this user". The
  browser holds a meaningless random string. Identifying the user means one indexed lookup.
- **JWT** (JSON Web Token) — a signed token the browser holds which *asserts* who the user is.
  The server verifies the signature and needs no lookup. It cannot be withdrawn once issued: it
  is valid until it expires.

## Options considered
1. **Database sessions.** **Recommended, and overruled.** The argument, recorded:
   - JWT's single advantage is avoiding a database lookup, which matters when many servers share
     load. [ADR 0002](0002-self-host-on-a-single-vps.md) puts everything on **one VPS with one
     Postgres and no redundancy**, so there is no second server for the saved lookup to help, and
     the lookup is an indexed read on the same host.
   - JWT's cost is that **it cannot be revoked**. The usual workaround is a revocation list,
     which is a database lookup — paying the cost and losing the benefit.
   - Better Auth is session-first. Database sessions are its default; JWT is a plugin on top.
2. **A hybrid: short-lived JWT plus a refresh token held in the database.** Named here because it
   is what most genuinely scalable systems do — the JWT is stateless and expires in minutes, and
   the long-lived half stays revocable. Not chosen, and worth reconsidering if revocation ever
   becomes a concern, because it is the option that keeps both properties.
3. **Stateless JWT — chosen by Adil.**

## Decision
Sign-in state is carried by a **stateless JWT**. No session row is consulted on a request; the
signature is verified and the claims are trusted.

- **Token lifetime is 15 days** (Adil, 2026-09-14). **AI recommended far shorter and was
  overruled.** Expiry is the only thing that ends a token's life, so this number is the security
  control. The argument recorded: a copied token works for up to 15 days, and nothing — not
  sign-out, not a password reset, not losing the laptop — can shorten that. The only lever left
  is rotating the signing secret, which logs every user out at once. Adil accepted this for a
  personal tool with a small user base.
- **The signing secret is an environment variable on the host**, never in an image, never sent to
  the browser. If it leaks, every token ever issued is forgeable and the secret must be rotated —
  which does, usefully, invalidate everything at once.
- **Device tokens are unaffected.** The capture daemon's credential is a separate mechanism, still
  stored hashed and still individually revocable (`04-contracts.md` §1.5). Nothing in ADR 0009 or
  the ingest contract changes.

## Consequences
- **Sign-out no longer ends a token's validity.** Spec A4's acceptance criterion — *"a protected
  page reached afterwards redirects to sign-in"* — is still met, because signing out deletes the
  cookie and that browser no longer holds a token. But a **copy** of the token taken before
  sign-out keeps working until it expires. Sign-out becomes "this browser forgets", not "this
  credential dies".
- **Password reset no longer ends existing sessions.** Spec A5 is met as written — the old
  password stops working — but tokens issued before the reset remain valid until expiry. On a
  session model, resetting a password can end every active session immediately. Here it cannot.
- **This is more work than the option it replaces, not less.** ADR 0008 chose Better Auth
  specifically to keep auth off the critical path, and its default path is the one being left.
  Configuring it for stateless JWT is deliberate effort spent against the library's grain.
- **The scalability it buys does not apply to the current deployment** and is an investment in a
  shape the project has not adopted. ADR 0002 is explicitly one host. **Adil accepted this
  knowingly**; it is recorded so the reasoning survives if it ever bites.
- **Revocation is genuinely gone, not merely deferred.** Not for sign-out, not for password reset,
  not for "sign out everywhere". The only lever is shortening expiry, and rotating the signing
  secret as a blunt instrument that logs everyone out at once.
- **Per-user isolation is unchanged.** The user identity still comes from the credential and never
  from the request body (`04-contracts.md` §2.0, invariant 2). Only *how* that identity is carried
  has changed.
- **Reversible, at a cost.** Moving to database sessions later means adding the session table and
  changing the auth configuration. No product data migrates — but every signed-in user is signed
  out on the switch.

## What would make us revisit
- Needing to sign a user out for real — a lost laptop, a shared machine, a password reset that
  must take effect immediately. The answer then is option 2, the hybrid, not a full return to
  sessions.
- Configuring Better Auth for stateless JWT costing materially more than the database-session path
  it replaced.
