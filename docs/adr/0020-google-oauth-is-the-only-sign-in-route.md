# ADR 0020 — Google OAuth is the only way in; all email authentication is cut

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-10-26
- **Supersedes:** [ADR 0005](0005-full-email-auth-plus-google-oauth.md) (full email auth plus
  Google) and [ADR 0011](0011-account-linking-requires-a-verified-email.md) (account linking),
  which becomes moot. **Voids [ADR 0013](0013-resend-as-the-email-relay.md)** — there is no
  outbound email left to send.
- **Amends:** signed-off `02-spec.md` section A.

## Context
[ADR 0005](0005-full-email-auth-plus-google-oauth.md) put the complete, conventional account
experience in v1: sign up with email and password, verify by emailed link, sign in, sign out,
password reset, **and** Google OAuth on top. I advised cutting everything that needed outbound
email and was overruled; that ADR records the exchange.

Both [ADR 0002](0002-self-host-on-a-single-vps.md) and ADR 0005 then listed email deliverability
among the costs that "can eat a day" and appear on no feature list. `00-process.md` repeated it
as a known process risk. [ADR 0013](0013-resend-as-the-email-relay.md) picked Resend to contain
it, and the sending domain plus its SPF and DKIM records had been deferred twice.

While wireframing the auth screens (`06-ux.md` Phase 2), Adil cut the lot: **there are no auth
screens. There is a home page with a Google sign-in, and that is the whole surface.**

## Options considered
1. **Keep ADR 0005's full email stack.** The conventional experience, and the one Adil originally
   wanted. Rejected now: four spec behaviours, four screens, a third-party relay, DNS records and
   a deliverability risk — all to support a route that Google already provides.
2. **Google only — chosen.**
3. **Google only, restricted to an allowlist.** Would have bounded the OpenAI spend that
   [ADR 0010](0010-llm-provider-openai-behind-an-adapter.md) left unbounded, by bounding users.
   Rejected: it contradicts `01-problem.md`'s "v1 is built for real users, not an audience of
   one", and it would make contingency ladder rung 2 meaningless.

## Decision
- **Google OAuth is the only way to sign in.** There is no password anywhere in the product.
- **Signup is still open.** Anyone with a Google account signs in and gets an account; there is
  no allowlist and no invitation.
- **There are no auth screens.** A home page carries a sign-in button; after Google, the user
  lands on the main screen.
- **The unverified state does not exist.** Google has already verified the address, so an account
  is usable from the moment it exists.
- Sign out (spec A4) and per-user isolation (spec A7) are unchanged.

## Consequences
- **Four spec behaviours disappear:** A1 (email signup), A2 (verification by link), A3 (password
  sign-in), A5 (password reset). Section A shrinks from seven behaviours to two.
- **Outbound email stops being a v1 dependency at all.** This is the headline. ADR 0002 and
  ADR 0005 both warned it could eat a day; `00-process.md` listed it as a process risk. It is now
  not a risk, not a cost, and not a dependency. **ADR 0013 is void** and Resend is not used.
- **The sending domain, SPF and DKIM TODOs are deleted, not deferred.** Iteration 1 is no longer
  blocked on anything outside the repository.
- **[ADR 0011](0011-account-linking-requires-a-verified-email.md) becomes moot.** With one route
  in, there is nothing to link and no takeover route to close. Its rule — *one email address, one
  user* — survives trivially, because Google supplies the only identity there is.
- **Iteration 1 shrinks sharply.** It was a meaningful slice competing with activity capture
  (ADR 0005's own words); it is now an OAuth client registration and a callback.
- **Contingency ladder rung 2 — "open signup → a single account" — is now a much smaller cut**
  than when ADR 0005 was written, because much less has been built to abandon.
- **A hard dependency on Google.** No Google account, no Lumence. For the one persona this is
  nothing; for a hypothetical user without one it is a closed door. Accepted deliberately.
- **Nothing to recover.** There is no password, so there is nothing to forget and no reset flow.
  Account recovery is Google's problem, which is where it is best handled.
- **Reversible, additively.** Better Auth still supports email and password; adding it later is
  new work on an unchanged user table rather than a migration.

## What would make us revisit
A real user turning up without a Google account, or Google OAuth terms becoming a problem for a
self-hosted application. Adding the email route back is additive — but it brings the relay, the
DNS records and the deliverability risk back with it.
