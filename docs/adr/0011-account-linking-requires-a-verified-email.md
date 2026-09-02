# ADR 0011 — One account per email; linking requires a verified email

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-02

## Context
Spec A6 requires that *"the same email arriving by both routes resolves to one account, not
two."* [ADR 0005](0005-full-email-auth-plus-google-oauth.md) settled that both routes ship;
[ADR 0008](0008-stack-single-nextjs-app-on-docker.md) settled that Better Auth implements
them. Neither decided **when** the two routes are allowed to be joined.

Joining on a matching email address alone has a known failure. Anyone can type anyone's email
into a signup form. So:

1. An attacker signs up with the victim's email and a password of their choosing. The account
   is unverified, and spec A1 already ensures it can read and write nothing.
2. The real owner later signs in with Google using that same email.
3. If the two are joined purely because the addresses match, the attacker's password is now a
   working credential on the real owner's account.

The unverified account holding no data is not the problem. The problem is that it holds a
**password**, and linking hands that password a populated account.

`CLAUDE.md` places auth and permission rules on the human veto list, so this was put to Adil
explicitly rather than decided in passing.

## Options considered
1. **Link only when the existing account's email is verified — chosen.** Google has already
   verified the address on its side, so a verified-to-verified join proves ownership from both
   directions. Where the existing account is **unverified**, the Google sign-in takes ownership
   of the email and the unverified password credential is discarded.
2. **Link on email match, always.** One flag, simplest rule, and it leaves the takeover route
   above wide open. Rejected.
3. **Refuse the Google sign-in until the person signs in with their password first.** Safe, but
   a dead end for a genuine user who has forgotten they ever made a password account. Rejected.

## Decision
- **An email address identifies exactly one user.** There is never a second account for the
  same address.
- **A verified account links.** When Google presents an email that matches an existing account
  whose email is verified, the Google identity is attached to that existing user. Both
  credentials then work and lead to the same data.
- **An unverified account yields.** When the matching account's email is unverified, the Google
  sign-in takes ownership of the address and **the unverified password credential is
  discarded.** The person signing in with Google gets the account; whoever created the
  unverified record gets nothing.
- Google's own `email_verified` signal must be true for the address to be treated as verified
  on its side. An OAuth provider asserting an unverified address is not proof of ownership.

## Consequences
- **The account-takeover route is closed**, and closed by a rule rather than by vigilance.
- **A real user can lose an unverified password signup.** If someone genuinely starts a
  password signup, never opens the verification email, and then signs in with Google, their
  chosen password stops working and they will use Google from then on. They lose nothing —
  spec A1 means the unverified account never held any data — but it is a real behaviour to
  keep in mind if it ever produces a support question.
- **This is configuration, not custom code.** Better Auth exposes it as a setting, so the safe
  rule costs the same as the unsafe one. There is no schedule argument for the weaker option.
- **It becomes a domain invariant**, recorded in `03-domain.md`: *one email address, one user.*
- **Password reset (spec A5) is unaffected** and remains the recovery path for someone who
  verified their email and then forgot their password.

## What would make us revisit
Adding a second OAuth provider — out of scope for v1 (spec A section, **Out**) — would need
the same question answered for that provider, not a different answer for this one.
