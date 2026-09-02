# ADR 0010 — OpenAI as the LLM provider, behind a provider-agnostic adapter

- **Status:** Accepted
- **Decided by:** Adil
- **Date:** 2026-09-02

## Context
Spec surface M is a chat area for refining writing (`02-spec.md` M1–M6). `01-problem.md`
records what it has to beat: today Adil copy-pastes out of LibreOffice into ChatGPT, refines,
and copies back. The bar is *"must not be more steps than copy-paste into ChatGPT already
is"* — so output that feels familiar to him is part of the requirement, not a nicety.

`CLAUDE.md` already committed to a **provider-agnostic adapter** — a single module every LLM
call goes through, so the provider is named in one place. That commitment is what makes this
decision cheap to reverse, and it is why it was not agonised over.

The requirement was settled earlier (ADR 0005 era); only the vendor was open
(`decision-log.md` §4).

## Options considered
1. **OpenAI — chosen.** It is what Adil already uses daily, so the refined output will read
   the way he expects. Familiarity is a real criterion here given the switching test in
   `01-problem.md`.
2. **Anthropic / Claude.** Advised as the default because current pricing and API shape were
   verifiable in-session, so the ADR could carry real numbers. Adil chose OpenAI.
3. **Google Gemini.** Generally cheapest at the low end. Not chosen.

## Decision
- **Provider: OpenAI**, reached through the provider-agnostic adapter. The vendor name and
  the API key appear in that one module and nowhere else in the codebase.
- **TODO(adil): the exact model.** Not pinned here. OpenAI's current line-up spans roughly
  $0.05 to $15 per million input tokens depending on tier, and the choice is a
  quality-versus-cost judgement Adil should make against real output on his own text, not
  from a table. The adapter makes it a one-line change.
- **Cost control is the per-user daily cap and nothing else** — 20 chat turns per user per
  calendar day (spec M5), resetting at the day boundary. Confirmed by Adil on 2026-09-02.
- **No global spend ceiling in v1.** See below.

## Consequences
- **Swapping provider later is a one-module change.** This is the adapter earning its keep,
  and it is why picking on familiarity rather than on price is a defensible call.
- **The instance-wide cost is unbounded, and this is accepted knowingly.** The 20-turn cap
  limits what any one person can spend; it does not limit how many people sign up, and
  ADR 0005 gives the product open signup with no billing (billing is a v2/Paddle concern).
  A hundred users all reaching the cap daily is a real bill on Adil's own card.
  **I raised this once and Adil chose to accept it and watch the bill.** Recorded so the
  reasoning survives if it bites; not to be re-argued. The cheap fix, if it ever is needed,
  is a single global daily counter that makes the chat surface return "unavailable, back
  tomorrow" once the instance has spent a chosen amount — roughly one table and one check,
  and additive, so deferring it costs nothing in rework.
- **The API key is a server-side secret.** Every LLM call is made from Lumence's server, never
  from the browser. A key shipped to the client is a key given away — and ADR 0001 already
  records one credential leak in this repository's history.
- **Spec M6 — a reply that dies partway — is the adapter's problem**, not the chat UI's. The
  adapter either returns a complete reply or an error; no half-written reply reaches the
  screen.
- **Chat is not persisted** (spec M4), so there is no conversation table and no retention
  question. The only thing stored is the per-user daily turn count.

## What would make us revisit
- The bill becoming uncomfortable — the answer is the global daily ceiling described above,
  not a change of provider.
- Output quality failing the switching test in `01-problem.md`. The answer is a different
  model behind the same adapter first, and a different provider only after that.
