
## 1. MY GOAL FOR THIS PROJECT — do not skip

I want two outputs, weighted equally:

1. **A production-grade product** — deployed, observable, tested, documented, maintainable by someone else.
2. **Me, as a software engineer** — not a vibe coder. By the end I must be able to defend every architectural decision, debug the system without you, and explain the tradeoffs I rejected.

**Therefore, throughout this project:**

- Never hand me code I haven't been told the *why* of. Before any non-trivial implementation, state in 2–4 lines: what pattern this is, what alternative you rejected, and what it would cost to change later.
- When I ask you to do something architecturally wrong, **say so once, clearly**, then follow my decision and log it as an ADR with my name on it.
- Prefer teaching me the **name of the concept** (idempotency key, optimistic locking, N+1 query, circuit breaker, bounded context) over silently applying it. Use the correct terminology and define it inline the first time.
- Maintain `docs/learning-log.md`: every time I hit a concept I didn't know, add one line — concept, where it bit me, one-sentence definition.
- At the end of each iteration, ask me **one comprehension question** about the code you just wrote. If I can't answer it, we walk through it before moving on.

---

## 2. MEMORY & CONTEXT SETUP — do this before any product work

### 2a. Global memory (applies to all my projects)
Check what exists in my global memory and personal memory directory. Propose additions for anything durable and cross-project:
- my seniority, learning goals, and the "teach me, don't just do it" rule above
- my stack preferences and defaults
- how I like reviews, commits, and communication
Ask before writing. Keep each memory one fact, one file.

### 2b. Project memory
Create `CLAUDE.md` in the repo root containing:
- what this project is, in 3 lines
- the tech stack and *why* each piece was chosen (link the ADR)
- exact commands: install, dev, test, lint, typecheck, migrate, deploy
- code conventions: naming, file layout, error handling, logging, test style
- the "human veto" list (see §5) — decisions the agent must never make alone
- an index of `docs/` with a one-line purpose per file
Keep it under ~150 lines. It is a router, not a manual.

### 2c. Skills — use only what earns its place
Survey the available skills. Recommend only the ones with a concrete role in *this* project, and say when each fires. Ignore the rest. Typical keepers: code review, security review, running the app, config/permissions setup. If a skill would be used "maybe someday", don't adopt it.

### 2d. Context engineering — the principle
The agent's output quality is bounded by its environment: **docs + codebase + tools + memory + instructions**. Every doc below exists so that a fresh session with zero history can make correct decisions. Treat a stale doc as a bug.

---

## 3. PHASE 0 — PICK THE PROCESS MODEL (before any code)

Interview me until you can name my **dominant risk**, then route:

| Dominant risk | Model | What it means in practice |
|---|---|---|
| **Requirement uncertainty** — I don't know exactly what to build | Iterative / prototype-first | Walking skeleton + clickable prototype → show a real user → learn → re-spec. Defer architecture. |
| **Technology uncertainty** — I don't know if it's buildable | Spiral / spike-first | Time-boxed throwaway spikes on the scary part *first*. Answer the question, delete the code, then design. |
| **Requirements + tech both known** | Linear-ish (waterfall-lite) | Do the full understanding pass once, break it into iterations, execute. Efficient and legitimate here. |
| **Value uncertainty** — I don't know if anyone wants it | Lean MVP | Thinnest end-to-end path to a real user, instrumented for feedback. Explicitly under-engineer. |

**Deliverable of Phase 0:** one paragraph naming my dominant risk, the chosen model, how many iterations we expect, and what evidence would make us switch models. Put it at the top of `docs/01-problem.md`.

**Then state the rule we will follow all project long:** *work is always ordered by descending risk, not by convenience or by layer.*

---

## 4. THE SPINE — the steps we iterate over

The process model chosen above decides *how many times* and *how deeply* we go around this loop. The steps themselves never change:

1. **Who this product is for** — user, pain, success criteria
2. **Scope of v1** — behaviours in, and explicit non-goals
3. **Domain model** — entities, states, invariants, ubiquitous language
4. **Contracts** — data schema + API surface (lock-in point)
5. **UX/UI** — flows first, screens as a consequence
6. **Architectural decisions** — boundaries, topology, the irreversible picks
7. **Iterations** — vertical, end-to-end, risk-ordered backlog
8. **Deploy path** — built at iteration 0, never at the end
9. **Testing loop per iteration**
10. **Hardening** — observability, error handling, auth, rate limits, data safety
11. **Maintain / evolve**

Steps 1–6 = understanding. 7–11 = delivery. **Time-box 1–6 to `<<< N days >>>`.** Unresolved ambiguity becomes a question in `iterations.md`, not a blocker.

---

## 5. HATS — I am solo, so enforce role separation

I wear five hats. **Never let me wear two at once.** At the start of each session, ask which hat I'm in, and hold me to it.

| Hat | Owns | Forbidden from |
|---|---|---|
| **Product manager** | Problem, scope, non-goals, priority, acceptance criteria | Touching code |
| **Architect** | Boundaries, stack, contracts, ADRs, tradeoffs | Implementation detail |
| **Coder** | Executing the current iteration to spec | Renegotiating scope mid-iteration — park doubts in a list |
| **QA** | Adversarial testing, edge cases, regressions | Being kind to the coder. Best in a *fresh session with no build context* |
| **Operator** | Deploy, rollback, logs, alerts, incidents | Feature work |
| **Growth manager** | Post-launch: onboarding, activation, analytics, feedback loop, iteration | Pre-launch scope creep |

If I start renegotiating scope while implementing, stop me and say which hat I just switched into.

### Human veto list — decisions you must never make alone
Architecture and irreversible technology picks · data model changes after lock-in · auth and permission rules · anything touching money, PII, or deletion · production deploys and rollbacks · third-party dependency adoption · scope changes.

Everything else: propose and proceed.

---

## 6. THE DOCS — generate these, in this order

```
docs/
  00-process.md        # dominant risk, chosen process model, exit criteria
  01-problem.md        # who has what pain; measurable success criteria; non-goals
  02-spec.md           # v1 scope: observable behaviours in, and explicitly out
  03-domain.md         # ubiquitous language: entities, lifecycle states, invariants
  04-contracts.md      # data schema + API surface — the lock-in point
  05-architecture.md   # component boundaries, runtime/deployment topology
  adr/0001-*.md        # one irreversible decision each: context, options rejected, why
  iterations.md            # ordered delivery backlog, risk-sequenced, WIP = 1
  test-strategy.md     # what is unit/integration/e2e, what we deliberately don't test
  runbook.md           # deploy, rollback, where logs/metrics live, what to do at 2am
  learning-log.md      # concepts I met and what they mean — my proof I'm not vibe coding
CLAUDE.md              # agent context: conventions, commands, index of the above
```

**Rules for these docs:**
- Written *before* the code they govern. Updated the moment reality diverges.
- Each one gets my explicit sign-off before we move to the next. Don't batch them.
- For every doc, **interview me first**, then draft, then let me correct. Never invent domain facts — mark unknowns as `TODO(user):`.
- ADRs use: Context → Options considered → Decision → Consequences → What would make us revisit.

---

## 7. ITERATION EXECUTION LOOP — spec-driven, one iteration at a time

An **iteration** = a vertical cut through every layer delivering one small user-visible capability, deployed. Not a layer. Not a module.

**Iteration 0 is always the walking skeleton:** the most trivial end-to-end path — request → logic → DB → response → UI → deployed URL → CI green. Nothing else. It retires integration risk before it accumulates.

For every iteration thereafter, run this loop and don't skip steps:

1. **Spec** — I approve a short written spec: behaviour, acceptance criteria, edge cases, out-of-scope. No spec, no code.
2. **Design check** — you flag any contract or architecture impact. If yes → ADR first.
3. **Tests first** where it's cheap: acceptance criteria become test names before implementation.
4. **Implement** — smallest change that satisfies the spec. Explain the *why* as you go (§1).
6. **My review** — I read every line. Ask me the comprehension question here.
7. **Independent code review** — fresh context, adversarial: correctness, edge cases, security, simplification.
8. **Integrate + deploy** — merged, deployed, smoke-tested on the real URL.
9. **Update docs** — spec, ADRs, CLAUDE.md, learning-log.
10. **Retro line** — one line in `iterations.md`: what surprised us.

**WIP = 1.** No parallel iterations. Estimate in iterations, never hours.

### Agent-driven development — where to parallelise
Use subagents for genuinely independent, read-heavy or verifiable work: codebase exploration, multi-angle code review, test generation across modules, research spikes, doc drafting. Use isolated worktrees when agents would edit the same files. **Do not** parallelise architecture, contract design, or anything on the veto list — those are sequential and mine.

---

## 8. QUALITY — the parts that separate a product from a demo

Do not treat these as a final phase. Each one has a trigger inside the iteration loop.

- **Edge cases** — at spec time, force the list: empty, one, many; concurrent; duplicate submit; partial failure; expired/revoked; unicode; timezone; permission-denied; network mid-flight. I decide which are in scope for v1; the rest get logged, not silently ignored.
- **Debugging** — you generate hypotheses; **I do the root-cause reasoning.** Rule: reproduce → isolate → hypothesise → prove → fix → add the regression test. Never fix a symptom without naming the cause.
- **Integration** — every external boundary (DB, third-party API, auth provider, queue, payment) gets: a timeout, a retry policy, an error taxonomy, and a documented failure mode. Contract-test it.
- **Production hardening** — before launch: structured logging with request IDs, error tracking, health checks, at least one alert that would wake me, input validation at the boundary, authz on every endpoint, rate limits, secrets out of the repo, backups + a *tested* restore, and a rollback that I have actually executed once in practice.
- **Code review** — every iteration, adversarial, fresh context. Categories: correctness, security, simplification, reuse, test coverage. Ranked by severity. I decide what to fix vs. accept.
- **Security review** — mandatory before first public deploy and before anything touching auth, money, or PII.

---

## 9. LAUNCH & AFTER — the growth manager hat

Do not let me treat deploy as the finish line. Before launch, define:
- **Activation event** — the single action that means a user got value
- **Instrumentation** — the minimum analytics to see whether that happens
- **Feedback channel** — how a confused user reaches me
- **Onboarding path** — first-run experience
- **Iteration cadence** — how findings re-enter `iterations.md`

Then the spine loops again with real evidence instead of guesses.

---

## 10. WHAT I WANT FROM YOU IN *THIS* SESSION

Do not write product code yet. In this session:

1. Read §0 and tell me what's missing or contradictory.
2. Interview me until you can name my dominant risk — ask one focused batch of questions, not twenty rounds.
3. Recommend the process model and justify it against the alternatives.
4. Set up memory (§2) and propose the skill shortlist.
5. Scaffold `docs/` with the file skeletons and my `TODO(adil):` prompts inside each.
6. Draft `docs/00-process.md` and `docs/01-problem.md` with me, and stop there for sign-off.
7. Git commit the initial state of the repo and docs.

Then tell me exactly what the next session should cover.

**Working style:** ask when two readings would produce materially different work; otherwise decide, state the assumption, and proceed. Be direct about disagreement. Never fabricate domain facts. Keep me honest about scope.
