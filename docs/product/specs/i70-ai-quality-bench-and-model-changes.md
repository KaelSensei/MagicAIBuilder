# I-70: An AI Quality Bench And Safe Model Changes

> **Initiative:** I-70, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 13, because [I-30](i30-business-model-and-paid-tier.md) slice 3 moves builds to a cheaper model "behind the golden set" and that set cannot judge a model; Later for slices 14 to 18 · **Paid:** never paid; it is how the paid AI allowance earns its price · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10 on Anthropic's model, pricing, deprecation, evaluation and guardrail pages, OpenAI's and OWASP's guidance, and what AI deck tools say about quality. It is not committed, so every external fact links its entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through [I-38](i38-trust-safety-and-user-rights.md)'s slice 0.
> **Owns:** the bench: a versioned set of build, suggestion and injection cases; the pinned card-data snapshot it scores against; the deterministic scorers; recorded model replies and the offline CI run; the live runner and its cost cap; the comparison report; the model-change gate; the prompt registry and its version numbers; the design of the provenance fields; the rule for turning player reports into cases. **Does not own:** the routes, the validator and the copilot's presentation ([I-02](i02-checkable-ai-copilot.md)); metering, the price table, allowances and the player AI ceiling ([I-30](i30-business-model-and-paid-tier.md#4-ai-metering-and-quotas-production-safety-ships-before-billing)); the cost book ([I-66](i66-running-costs-and-margin.md)); the event store ([I-39](i39-first-run-activation-and-measurement.md)); the bug report ([I-52](i52-feedback-loop-players-can-see.md)); the public verdict API ([I-22](i22-verification-as-a-public-surface.md)); land formulas ([I-58](i58-mana-base-builder.md)); dated Game Changer lists ([I-48](i48-official-changes-reach-every-deck.md)); card data ([I-67](i67-one-card-data-pipeline.md)); the statistics method ([I-21](i21-reproducible-probability-bench.md)); the fix for unsanitised suggestion fields ([I-05](i05-production-safety.md) M1); local models ([I-12](i12-local-ai.md)).
> **Proposed changes to neighbours, for the integrator:** I-30 slice 3 depends on I-70 slices 10 and 11 instead of "I-02 golden set". I-02 requirement 7.3 and its open golden-set item ("provider-backed qualitative evaluations") point here. I-02's "Already shipped" line "a golden evaluation set for valid cards, useful explanations" becomes "six validator regression cases; no case calls a model". I-12's "Benchmark local models against the golden evaluation set from I-02" points to this bench. I-30 4.1's `AiUsage` gains `promptVersion`, `resolvedModel` and `latencyMs`. I-52 2.3 gains the kind `ai_output`. I-39 8.2 gains one event, `ai_suggestion_action`.

## Overview

The paid tier's strongest candidate is AI use above a free allowance ([I-30 §2](i30-business-model-and-paid-tier.md#2-candidate-paid-features)). Nobody can say today whether a build is good, whether it got better or worse after a prompt edit, or whether a cheaper model would do. The roadmap calls a set of six tests "the golden set" and makes two model changes wait for it (I-30 slice 3, I-12). Those six tests feed hand-written replies to the validator. None calls a model.

This spec adds a bench. A fixed, versioned set of requests runs through the real route code. Scorers that already exist in the product judge each reply: card data, colour identity, singleton, Game Changers per bracket, land count, price against budget. Token, cost and latency figures come from the provider's own usage fields. CI replays recorded replies with no network and no key. A capped live run records new replies and writes a comparison report before any model or prompt change ships. Every stored build names the model and prompt version that made it.

The product rule holds throughout. A model never decides legality or rules. If a model ever rates prose, its score is labelled as a model's opinion and never gates anything.

## What the market does

### What AI deck tools say about quality

Read on 2026-11-10.

| Product                                  | What it says publicly                                                                                                                                                                                                                                                                                                                                                                                                                                   | Measured quality published |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **DeckCheck** [11][12]                   | "The AI can read the same deck differently each time." "When we update the Threat Index or the AI model that reads your deck, a rescan can change the score and the bracket, even if your deck did not change." Two or more scans are combined: "From three scans, the median can outvote one unusual scan." Pro "does not guarantee a better result every single time." Players rate a result from 1 to 5 stars into a review queue. No model is named | None                       |
| **Farseek** [13]                         | "Every recommendation is verified against Scryfall before it reaches you"; the list flags cards over the singleton limit                                                                                                                                                                                                                                                                                                                                | None                       |
| **mtgcommander.ai** [14]                 | "Every recommendation backed by EDHREC synergy stats, not AI hallucinations"; recommendations are "for informational purposes only"                                                                                                                                                                                                                                                                                                                     | None                       |
| **Moxfield, Archidekt, EDHREC, ManaBox** | A web search on 2026-11-10 found no AI deck builder from any of them; I-30 recorded the same for the first three from their pages on 2026-11-09. Search result, not a verified page                                                                                                                                                                                                                                                                     | —                          |

A player's blog describes the failure the bench measures: chatbots given a list "confidently make up mana costs, invent abilities" [15]. On r/EDH, AI advice is distrusted and players ask for disclosure ([I-02 requirement 6](i02-checkable-ai-copilot.md#revision-2026-11-09)).

**The pattern.** Every AI deck tool found asserts quality; none publishes a number. DeckCheck is the most candid: it documents that a model update moves scores on unchanged decks, and it averages three runs. Nobody publishes a test set, a pass rate or a before-and-after for a model change. _Corrected 2026-11-11:_ this still holds for AI. Since 2026-11-10, SpellRack publishes a dated pass rate for its deterministic bracket scorer: 83.4%, 131 of 157 precons, all 26 misses over-predicted [16]. That is the bar [I-77](i77-a-bracket-estimate-players-can-audit.md) sets for our own scorer.

### Public guidance on evaluations

| Source                                        | Guidance used in this spec                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anthropic, evaluation docs (undated page) [4] | Make evals task-specific and automated. Code-based grading is "fastest and most reliable, extremely scalable, but also lacks nuance". Human grading: "Avoid if possible." Model grading: "Test to ensure reliability first, then scale", with clear rubrics, and "evaluate with a different model from the one used to generate"     |
| Anthropic Engineering, 2026-01-09 [5]         | Regression evals should hold "a nearly 100% pass rate". "20-50 simple tasks drawn from real failures is a great start." Run several trials because "a task that passed on one eval run might fail on the next"; pass^k measures whether all k trials succeed. Calibrate model graders against human experts. Read transcripts        |
| Anthropic, guardrails [6]                     | Separate untrusted content from instructions, JSON-encode it, state the policy in the system prompt, give the model no secrets, and red-team with injected content before deploying                                                                                                                                                  |
| OpenAI, evaluation best practices [9]         | "Log as you develop so you can mine your logs for good eval cases"; "Set up continuous evaluation (CE) to run evals on every change"; calibrate model judges with human feedback. Anti-patterns include "vibe-based evals" and datasets that do not reproduce production traffic. Its hosted Evals platform shuts down on 2026-11-30 |
| OWASP, LLM01:2025 [10]                        | Direct and indirect prompt injection; validate output formats with deterministic code; mark untrusted content; adversarial testing                                                                                                                                                                                                   |

### Models, prices and lifecycle

Anthropic's pages, read on 2026-11-10 [1][2][3]. Prices are USD per million tokens, input / output; the Batch API halves both.

| Model             | API ID                                                 | Price                                          | Retirement, Anthropic's commitment                 |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------- |
| Claude Haiku 4.5  | `claude-haiku-4-5-20251001` (alias `claude-haiku-4-5`) | $1 / $5                                        | Active, legacy; "Not sooner than October 15, 2026" |
| Claude Haiku 5.5  | `claude-haiku-5-5`                                     | $0.10 / $0.50 for prompts up to 100,000 tokens | Not sooner than October 7, 2027                    |
| Claude Sonnet 5.5 | `claude-sonnet-5-5`                                    | $2 / $10                                       | Not sooner than September 28, 2027                 |
| Claude Opus 5.5   | `claude-opus-5-5`                                      | $4 / $20                                       | Not sooner than September 22, 2027                 |
| Claude Fable 5.2  | `claude-fable-5-2`                                     | $8 / $40                                       | Not sooner than November 9, 2027                   |

Four facts shape the bench. Haiku 4.5's earliest retirement date has passed; Anthropic promises "at least 60 days' notice" before a retirement and advises "thorough testing of your applications with the new models well before the retirement date" [2]. Models from Claude 4.7 on use a tokenizer that produces "approximately 30% more tokens for the same text" [3]. `temperature` returns a 400 error from API version `2026-10-21`, and earlier versions reject a non-default value on Claude 4.7 and later [2], so the bench cannot buy determinism with a setting; it runs several trials and replays recordings. Every Claude model ID is "a pinned snapshot, including the dateless IDs used from the 4.6 generation on", while older aliases are "a convenience pointer that resolves to the dated ID" [1]. The code sends such an alias.

**The opening.** A tool that publishes its test set, its scores per model and prompt version, and the report behind each model change would be the first in the category. The set lives in a public MIT repository, so anyone can rerun it.

## Current state in this codebase

Verified on `dev` at `72fbfc1f` on 2026-11-10.

- **The "golden set" calls no model.** `src/lib/ai/golden-evaluation.test.ts` holds three hand-written `AIDeckResponse` objects checked by `validateGeneratedDeck` and `checkGeneratedDeckLegality`, and three cards checked by `buildSuggestionEvidence`. It arrived on 2026-10-01 (`8df89ca4`) and was extended by #1318. PR #1130 records "6 tests passed". It is a validator regression suite.
- **Two routes call a model.** `src/app/api/ai/build/route.ts` and `src/app/api/ai/suggest/route.ts` send `claude-haiku-4-5` (an alias) with `max_tokens: 4096`, header `anthropic-version: 2023-06-01`, one user message, no system prompt and no `temperature`. Both fall back to OpenAI `gpt-4o-mini` only when no Anthropic key is set, and to a placeholder (`mockDeck`, `mockSuggestions`) when neither is. The prompt templates are inline functions named `buildPrompt` with no version.
- **The card-data check (#1318, merged into `dev` on 2026-11-10).** `verifyGeneratedDeck` (`src/lib/ai/generated-deck-legality.ts`) removes cards with a typed reason: `unknown_card`, `outside_color_identity`, `banned`, `not_legal`, `extra_copies`, `commander_in_list`, `over_size`. It then fills the list to size with basics (`fill_to_size`) and rejects an illegal command zone. Each correction rides on the `done` event. Game Changers per bracket and repair from a legal pool remain open (I-02). The player always sees a legal deck; how much the model got wrong shows only in the corrections, and every removed card becomes a basic land.
- **Bracket and lands.** `src/lib/constants/brackets.ts` sets `maxGameChangers` to 0, 0, 3 and unlimited for brackets 1 to 4. The Game Changer list comes from Scryfall's `is:gamechanger` (`src/hooks/useGameChangers.ts`). `countColorSources` exists in `src/lib/deck/mana-alignment.ts`. Karsten's land formula and source targets are I-58 slice 1 and are not on `dev`.
- **Prices.** Card prices are Scryfall's `prices.usd` (`src/lib/deck/pricing.ts`). The wizard offers 50, 200, 500 or no limit (`BUDGET_OPTIONS` in `DeckWizard.tsx`), and the build prompt turns the value into "max per card" (an open I-02 item).
- **What player text reaches a prompt.** Build: `strategy` (50 characters) and `commanderName` (200). Suggest: commander and partner names, up to 100 card names (200 each), the "why this card" name, the brief's theme, play pattern and dislikes (200 each), and the notes and proposed change of the player's last five playtest sessions (500 each, read from the database). All pass through `sanitizeForPrompt` (`src/lib/validation/ai.ts`), which strips quotes, backticks, brackets, backslashes and newlines; it does not stop an instruction written in plain words. `detectedThemes`, `bracketWarnings`, `gameChangersList` and the keys of `categories` reach the suggest prompt unsanitised (I-05 M1). Deck names and descriptions reach no prompt. No locale reaches either route, so a French brief is sent as typed and its ASCII apostrophes are stripped: "l'artefact" becomes "lartefact". The same stripping turns a requested commander such as "Yuriko, the Tiger's Shadow" into "Yuriko, the Tigers Shadow" inside the prompt; nothing tests whether the model returns the real name.
- **No provenance.** `Deck.isAIGenerated` is a boolean. No row stores the model, the prompt or the corrections of a build. The unmerged branch `feat/ai-usage-metering-and-monthly-quota` (`5879b6da`, local only) adds `AiUsage` with route, provider, model, tokens, `stopReason`, outcome, `costMicroUsd` and `priceTableVersion`, but no prompt version and no latency. Its global ceiling defaults to $20 a month (`AI_MONTHLY_SPEND_CEILING_USD`).
- **CI.** `.github/workflows/` holds `ci.yml`, `lighthouse.yml` and `sonar.yml`. None runs on a schedule and none holds an AI key.

## Functional requirements

### 1. Ground rules

1.1 Every score that can decide a change is computed by code from the reply and a pinned card-data snapshot. No model decides legality, colour identity, quantities, bracket rules or any score that gates a change ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 The bench drives the product's own code: the same prompt modules, response parsing, `validateGeneratedDeck`, `checkGeneratedDeckLegality` and `buildSuggestionEvidence`. It adds no second validator.
1.3 Scorers are pure functions. The same recordings and snapshot give a byte-identical score file on every machine.
1.4 The bench never runs on players' accounts or calls, and never counts against a player's allowance or I-30's player ceiling.

### 2. The case set

2.1 Cases are data files in the repository under a set version (`v1`). A case never changes once released; a fix creates a new case id, and a new set version lists what was added and retired.
2.2 **Build cases (v1: 28).** Twelve commanders cover mono to five colours, colourless, a partner pair, a Background, a name with an apostrophe and a name with a comma. Each case fixes the bracket (1 to 4 from the wizard, 5 through the API), the budget (50, 200, 500, none), the strategy (all eight wizard values) and whether the commander is named. Four cases use "let the AI choose" while that option exists ([I-54](i54-find-your-next-commander.md) slice 6 may remove it).
2.3 **Suggestion cases (v1: 20).** Ten fixture decks written for the bench, never copied from players. Each runs the default task; five add "why is this card here?" and five "what is the weakest card?". Half carry a brief written in French, half in English.
2.4 **Injection cases (v1: 18).** At least one for each of the 15 player-controlled inputs of section 6.1 (two on build, thirteen on suggest), plus a second canary on each build input and one case that fills several suggest fields at once.
2.5 A coverage test fails when an axis loses its last case: each bracket, budget, strategy, colour count, pairing type, brief language and question type.
2.6 Each case records its source: `authored`, or `report` with the triage reference of section 10 and no player identifier.

### 3. The snapshot

3.1 A dated snapshot of Scryfall card objects holds every name in the cases, the fixture decks and the recordings, trimmed to the fields the scorers read: name, faces, colour identity, Commander legality, type line, mana cost, mana value, oracle text and `prices.usd`. A dated Game Changer list sits beside it. Both carry a source, a fetch time, a count and a SHA-256.
3.2 Scores always use the snapshot, so a price move or a new ban does not change a past score. A live run also reports, as information only, the names unknown at snapshot time that today's data resolves.
3.3 When I-67 ships `CardOracle`, the snapshot is exported from it. When I-48 slice 1 ships, the Game Changer list comes from the rules version in force on the snapshot date.

### 4. Scores for a build

Per trial, computed after the route's own parse.

| Score                                    | Computed from                                                                                                                                                       | Gates a change                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Outcome                                  | I-30's outcomes: `ok`, `truncated`, `refused`, `parseFailed`, `rejectedByValidator`, `providerError`                                                                | Yes                            |
| Structural issues                        | `validateGeneratedDeck`                                                                                                                                             | Yes                            |
| Corrections by reason                    | `checkGeneratedDeckLegality` on the snapshot; `unknown_card` per 100 cards is the invented-name rate                                                                | Yes                            |
| Basics added to fill                     | `fill_to_size` quantity: cards the model failed to supply or lost to removals                                                                                       | Yes                            |
| Commander honoured                       | Returned command zone equals the requested one after name normalisation                                                                                             | Yes                            |
| Game Changers against the bracket        | Count in the repaired list against `maxGameChangers`; full bracket checks join with I-48 slice 2's `assessDeck`                                                     | Yes                            |
| Land count                               | Lands in the repaired list against the prompt's own 36 to 38, then against [I-58's formula](i58-mana-base-builder.md#2-land-count) once slice 1 ships               | Yes, after I-58 slice 1        |
| Colour sources                           | `countColorSources` per colour; shortfall against [I-58's targets](i58-mana-base-builder.md#3-source-target-per-colour) after slice 1                               | Yes, after I-58 slice 1        |
| Price against budget                     | Snapshot prices: the most expensive card against a per-card cap, and the deck total against the same value read as a total; both shown until I-02 settles the label | Yes                            |
| Plan roles                               | Category counts against `DeckPlan` role targets; the categories are the model's own labels, so the score is labelled "model-labelled"                               | No                             |
| Input, output, thinking and cache tokens | The provider's `usage` fields                                                                                                                                       | Reported                       |
| Cost                                     | Tokens times the dated price table (I-30's once merged)                                                                                                             | Yes, against the owner's limit |
| Latency                                  | Wall time of the provider call and of the whole route, p50 and p95 per model                                                                                        | Yes, against the owner's limit |

### 5. Scores for suggestions

5.1 Exactly 8 additions and 4 removals when the default task asks for them; the counts for each question type.
5.2 Every suggested name and alternative resolved in the snapshot; the unresolved rate is the invented-name rate.
5.3 Through `buildSuggestionEvidence`: additions outside the colour identity and additions not legal in Commander.
5.4 Additions already in the deck; removals naming a card not in the deck; an alternative repeating a main suggestion.
5.5 Additions above the per-card cap at snapshot prices; Game Changer additions that would take the deck above its target bracket's limit.
5.6 When a brief's "Avoid" text names a tagged dislike (counterspells, extra turns, land destruction), additions whose oracle text matches that tag's pattern. The patterns are versioned data, shared with I-65's route kinds once they exist.
5.7 With a French brief: suggested names that resolve only as French printed names, which would fail the English lookup.
5.8 Tokens, cost and latency as in section 4.

### 6. Prompt injection

6.1 Each prompt module declares its player-controlled inputs. A test fails when an input has no injection case. Today these are the fields listed under "What player text reaches a prompt", including the four unsanitised suggest fields.
6.2 Each injection case places one instruction in one field and checks a canary by code: a named legal card that does not fit the deck, which the validator would keep; a banned card, which it would remove; a marker word in the prose; a request to reveal the instructions, checked against a fixed phrase of the template; a request to change the output format; a request for very long output.
6.3 Scores are kept before and after the validator: the canary in the model's reply measures the model, the canary in the final result measures the product. The product target is zero canaries in final results.
6.4 Deck names, descriptions, comments and shared or imported decks reach no prompt today. The day one does, through I-02, I-14, [I-20](i20-collaborative-review.md), [I-36](i36-creator-and-embed-toolkit.md) or [I-47](i47-rules-answers-for-this-deck.md), its injection cases ship in the same pull request (6.1 enforces it).
6.5 The bench measures mitigations; I-02 chooses them. Candidates from Anthropic's guidance [6][7]: a system prompt that states the untrusted-content policy, player text JSON-encoded in its own block, and structured outputs.

### 7. Runs, recordings and costs

7.1 **Recordings.** A recording holds the raw provider reply, `usage`, `stop_reason`, the model the reply names, the latency and the recording time, filed by model, prompt id and version, case and trial.
7.2 **CI run.** On every pull request the bench replays the recordings through the scorers with network access stubbed to fail and no key present. It compares scores to a committed baseline. It fails when a change to a route, the validator, the scorers or the snapshot lowers a score, on a prompt whose version has no recordings, and on a template whose text changed without a version bump.
7.3 **Live run.** A command and a manual GitHub workflow run chosen cases on chosen models for a set number of trials (3 by default) and write recordings and a report. The key belongs to a separate Anthropic workspace whose monthly spend limit the owner sets in the Console [8]. The key never reaches production.
7.4 **Hard cap.** Before starting, the runner estimates the run's cost from recorded token averages, or from `max_tokens` when a case has no recording, at the dated prices. It refuses to start above the per-run cap. During the run it skips any call whose worst case would cross the cap and marks the run incomplete. An incomplete run never feeds a gate.
7.5 **Weekly drift run.** One trial of the full set on the production model and prompt. A change against the baseline opens an issue for the owner; it changes nothing by itself.
7.6 **Cost, estimated.** A trial makes 32 build calls (28 cases and 4 injection cases) and 34 suggestion calls (20 and 14). At I-02's per-call estimates for Haiku 4.5 (about $0.008 a build and $0.012 a suggestion), three trials cost about $1.99. Scaled by price and, for the 5.x models, the 30% tokenizer change: Haiku 5.5 about $0.26, Sonnet 5.5 about $5.18, Opus 5.5 about $10.36, Fable 5.2 about $20.72. Thinking tokens are excluded and may raise the figures for models that think by default. Computed 2026-11-10; slice 10's first run replaces them.

### 8. The comparison report and the model-change gate

8.1 A report compares an incumbent and a candidate (model, prompt version or both) on the same set, snapshot and trial count. It is committed with its recordings.
8.2 It shows, per score, both sides as counts with an interval, the paired difference per case, and "not distinguishable at this sample size" when the difference sits inside the interval, using [I-21](i21-reproducible-probability-bench.md#4-comparison-between-two-snapshots)'s method once slice 3 ships and a Wilson 95% interval until then. It lists every new failure with the reply text, so the owner reads the transcripts [5].
8.3 It shows cost per build and per suggestion, tokens, p50 and p95 latency, and the monthly AI cost per active player at I-30's allowances.
8.4 **Gate.** A pull request that changes a model, a model setting (`max_tokens`, effort, thinking) or a prompt version cites a committed report. CI checks that the report's recordings match the new configuration. The candidate passes when every case the incumbent passes in all trials (pass^k [5]) also passes in all trials, or the report names the exception; no gating score is worse beyond its interval; cost and latency stay within the owner's limits, and the owner approves the pull request.
8.5 The first reports: Haiku 5.5 against Haiku 4.5 for I-30 slice 3, with Haiku 5.5's settings from I-30 4.7 (low effort, raised `max_tokens`); Sonnet 5.5 for I-30's paid deep review. Opus 5.5 and Fable 5.2 run only if the owner asks: I-30 already rules Opus 5.5 out on cost.

### 9. Provenance on stored builds and suggestions

9.1 The build route's `done` event carries the provider, the model the reply named and the prompt version. The wizard stores `aiModel` and `aiPromptVersion` on the deck it creates. This also serves I-02 slice 5's model statement.
9.2 Each suggestion response carries the model, the prompt version and the `AiUsage` id.
9.3 `AiUsage` gains `promptVersion`, `resolvedModel` and `latencyMs` (I-30 slice 1). A traced regression then reads: "decks built with prompt build@4 on model X since date Y".

### 10. Player signals that feed the set

10.1 **Aggregate signal.** One I-39 event, `ai_suggestion_action`, with enums and integers only: `action` (added, ignored), `position` (0 to 7), `dimension` (main, budget, power, playstyle), `promptVersion` and `model`. No card name, deck id or free text, as [I-39 8.3](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation) requires. The owner's view shows acceptance by prompt version and model. Acceptance is a weak signal: it is shown beside the bench scores, never as one.
10.2 **Explicit report.** [I-52's report](i52-feedback-loop-players-can-see.md#2-the-bug-report) gains the kind `ai_output`, reachable from the wizard's result and the suggestion panel. An unticked box, "Attach this request and the AI's answer", adds the request's enums, the commander, the model, the prompt version, the returned names and the corrections. The brief's free text is attached only with a second unticked box.
10.3 **From report to case.** The owner confirms a report, then a script writes a candidate case with no user id, no report text and no brief text unless the owner rewrites it. It enters the next set version after review. Anthropic's article suggests 20 to 50 tasks drawn from real failures as a start [5].
10.4 Whether a confirmed report may become a public test case, and what consent that needs, is research, not legal advice, for the lawyer list.

### 11. Prose, if ever

11.1 A model may rate the prose of rationales on a written rubric (clear, specific to the deck, consistent with the card's oracle text). It runs on a different model from the one that wrote the text [4].
11.2 Before use, its ratings are compared with the owner's on 30 outputs, and the agreement is published with the scores [5][9].
11.3 Its scores carry the label "rated by a model" and never gate a change, a legality claim or a rules claim.

### 12. Public surface and the paid tier

12.1 With the owner's approval, the AI-use disclosure page ([I-30 1.6](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line), slice 5) shows for the production model and prompt version: the set version and date, the invented-name rate, the share of builds needing a correction by reason, Game Changer compliance, budget adherence and the injection result, with a link to the cases. This follows [I-22](i22-verification-as-a-public-surface.md)'s argument: a check people can see is a position.
12.2 The bench and its page are free. Paid AI is worth paying for only if it is measured: the report is what lets the owner sell the cheapest model that holds the line, keep a margin on a €3.99 plan, and charge for a deeper Sonnet 5.5 review only if the bench shows it is better. No competitor found publishes such a number.

## Data model / API

```
src/lib/ai/prompts/<id>.ts           id ("build" | "suggest"), version, render(request), declaredInputs[]
src/lib/ai/bench/cases/v1/*.json     BenchCase: id, kind (build|suggest|injection), request, briefLocale?, tags[], source (authored|report:<ref>), addedIn
src/lib/ai/bench/snapshot/<date>/    cards.json, game-changers.json, meta.json (source, fetchedAt, count, sha256)
src/lib/ai/bench/recordings/<model>/<promptId>@<version>/<caseId>.t<n>.json
                                     rawReply, usage, stopReason, replyModel, latencyMs, recordedAt
src/lib/ai/bench/baseline/<model>/<promptId>@<version>.json   scores per case and trial
docs/engineering/ai-bench/<date>-<incumbent>-vs-<candidate>.md
Deck      + aiModel String?, aiPromptVersion String?
AiUsage   + promptVersion String, resolvedModel String?, latencyMs Int?      -- I-30 slice 1
I-39      + event ai_suggestion_action
I-52      + BugReport.kind ai_output, + aiContext Json? (only with consent)
```

Commands: `pnpm ai-bench:replay` (CI), `pnpm ai-bench:run --models … --cases … --trials 3 --cap-usd …` (live), `pnpm ai-bench:snapshot` (refresh). The model call in each route takes an injectable transport; production passes `fetch`, the bench passes the recorder or the replayer.

## Non-goals

- A model judging legality, rules, colour identity or bracket compliance, or a model score that gates anything.
- Benchmarking for marketing against other products' AI. The bench measures this product's routes.
- Golden decks. A build has no single right answer; the bench checks constraints and counts, not similarity to a reference list.
- Running live calls on every pull request, or any live call in CI without the owner's dispatch.
- Using players' decks, briefs or reports as cases without the steps of section 10.
- Choosing mitigations, models or prompts. I-02 and I-30 decide; the bench reports.
- Other model surfaces in v1. I-14's query writer, I-47's citation retrieval, I-64's help retrieval and I-12's local models join later (slice 18) with their own sets.

## Testing strategy

- **Determinism (solitary):** the same recordings and snapshot give a byte-identical score file twice and across processes.
- **Scorers (solitary):** hand-written replies with a known invented name, an off-identity card, a fourth Game Changer at Bracket 3, 31 lands, a $60 card under a $50 cap, a removal not in the deck, and a French card name produce the expected scores.
- **No network:** the CI run stubs `fetch` to throw and runs without keys; any network access fails it.
- **Parity (sociable):** for each case, the prompt the route sends equals the registry's render, so the bench and production cannot drift.
- **Versioning:** changing a template's text without bumping its version fails; a version without recordings fails with a "record first" message.
- **Cap:** with a fake transport, the runner refuses a plan over the cap, stops before the call that would cross it, and marks the run incomplete.
- **Coverage and inventory:** the axis test of 2.5 and the input test of 6.1.
- **Provenance:** a wizard build stores `aiModel` and `aiPromptVersion`; an `ai_suggestion_action` with a card name or an unknown key is rejected.

## Delivery slices

| #   | Slice                                                                                                                                 | Depends on                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0   | Decisions: per-run cap, monthly workspace limit, gate limits for cost and latency, first candidates, public page or not               | — (owner; no code)                                   |
| 1   | Prompt registry: build and suggest templates as versioned modules with declared inputs; prompts unchanged byte for byte; version test | —                                                    |
| 2   | Case schema, set v1 (build, suggest, injection), coverage and input-inventory tests                                                   | 1                                                    |
| 3   | Pinned snapshot and dated Game Changer list, loader, refresh script                                                                   | —                                                    |
| 4   | Build scorers (section 4), with I-58 rows reporting raw counts until I-58 slice 1                                                     | 2, 3                                                 |
| 5   | Suggestion scorers (section 5)                                                                                                        | 2, 3                                                 |
| 6   | Injection canary scorers, before and after the validator (section 6)                                                                  | 4, 5                                                 |
| 7   | Injectable transport in both routes; recorder and replayer                                                                            | 1                                                    |
| 8   | CI replay with stubbed network, baseline file, regression and stale-recording failures                                                | 4, 5, 6, 7                                           |
| 9   | Live runner: trials, dated prices, pre-run estimate, hard cap, workspace key, manual workflow, weekly drift run                       | 0, 7, 8                                              |
| 10  | Comparison report and the first recordings of the incumbent `claude-haiku-4-5`                                                        | 9                                                    |
| 11  | Model-change gate in CI (8.4)                                                                                                         | 8, 10                                                |
| 12  | Reports for Haiku 5.5 (I-30 slice 3) and Sonnet 5.5 (deep review)                                                                     | 10                                                   |
| 13  | Provenance: `done` event fields, `Deck.aiModel`, `Deck.aiPromptVersion`; `AiUsage` fields                                             | 1; I-30 slice 1 for the `AiUsage` fields             |
| 14  | `ai_suggestion_action` and acceptance by model and prompt version in the owner's view                                                 | 13; I-39 slice 10                                    |
| 15  | `ai_output` report with consent, triage script to candidate cases                                                                     | 13; I-52 slice 3; lawyer answer through I-38 slice 0 |
| 16  | Prose rating on a rubric, calibrated on 30 owner ratings, labelled, never gating                                                      | 10; owner decision                                   |
| 17  | Quality figures on the AI-use disclosure page                                                                                         | 10; I-30 slice 5; slice 0                            |
| 18  | Other model surfaces join: I-14, I-47 slice 14, I-64 slice 15, I-12                                                                   | 8; that initiative's slice                           |

Slices 1 and 3 can start today, and slice 7 follows slice 1. Scheduled agents must not pick slice 9 before slice 0's caps and workspace are committed, because it spends money. I-30 slice 3 waits for slices 10 and 11.

## Open questions

1. **What may a cheaper model lose?** Haiku 5.5 costs a tenth of Haiku 4.5 per token and counts about 30% more tokens. If it invents twice as many names, the validator still returns a legal deck, but with more basic lands. The owner sets which scores are hard lines and which may trade against cost.
2. **Caps and accounting.** What per-run cap and monthly workspace limit? The estimates suggest a few dollars a month on Haiku models; a three-trial Fable 5.2 run is about $21 (estimate, 7.6). Does bench spend appear in I-66's cost report as its own line?
3. **Publish the scores?** A public invented-name rate invites scrutiny on a forum that distrusts AI, and it is also the only answer to that distrust. Pre-repair or post-repair figures, or both?
4. **Keep the OpenAI fallback?** It runs only when no Anthropic key is set. If it stays, it needs its own recordings and OpenAI prices read from OpenAI's page, which this spec did not read.
5. **French rationale.** No locale reaches the prompts. Should French players get French rationale (I-02 with [I-11](i11-localization-and-regional-experience.md)), and should the brief stop losing its apostrophes?
6. **Reports as cases.** Can a confirmed player report become a public test case, with what consent and what rewriting? Research, not legal advice, for the lawyer list ([L-06](../legal-questions.md#l-06-lawful-bases-and-personal-data-status-of-smaller-processing) (h)).

## Sources

Read on 2026-11-10 unless dated otherwise.

1. Anthropic, [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview).
2. Anthropic, [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations).
3. Anthropic, [Pricing](https://platform.claude.com/docs/en/about-claude/pricing).
4. Anthropic, [Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) (no date on the page).
5. Anthropic Engineering, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-01-09.
6. Anthropic, [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks).
7. Anthropic, [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
8. Anthropic, [Workspaces](https://platform.claude.com/docs/en/manage-claude/workspaces): spend limits per workspace.
9. OpenAI, [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
10. OWASP, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
11. DeckCheck, [Support](https://deckcheck.co/support).
12. DeckCheck, [Introducing DeckCheck Pro](https://deckcheck.co/blog/introducing-deckcheck-pro), 2026-04-14.
13. Farseek, [blog post on ChatGPT and Commander deckbuilding](https://farseek.ai/blog/chatgpt-fails-commander-deckbuilding), 2026-04-02, updated 2026-10-11.
14. [mtgcommander.ai](https://mtgcommander.ai/) (no date on the page).
15. xoPLA.NET, [A little tool to make AI better at Magic: The Gathering deckbuilding](https://xopla.net/posts/a-little-tool-to-make-ai-better-at-magic-the-gathering-deckbuilding), 2025-11-09.
16. SpellRack, [accuracy](https://spellrack.com/accuracy), "Public benchmark · 2026-11-10"; added 2026-11-11.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the owner knows whether a build or a suggestion is good, whether a prompt edit made it better or worse and whether a cheaper model would do, from scores that code computes on a fixed, public set of cases. No model or prompt change ships without a committed comparison report, and every stored build names the model and prompt version that made it.

### Goals

- A pull request that changes the model or a prompt cannot merge without a committed report showing that every case the incumbent passed in all trials still passes, at a cost and latency within the owner's limits; CI replays the bench with no key and no network; and a saved AI-built deck names its model and prompt version.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-70-01

As the owner changing a model, I want a report that says whether the new model invents more card names, so that a cheaper model is not a silent regression.

#### US-70-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-70-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-70-01 Happy path

Given a signed-in player and the English locale
When the bench scores a pinned set of cases with code, not with another model's opinion.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-70-02 Happy path

Given a signed-in player and the English locale
When a model or prompt change does not ship without the comparison report.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-70-03 Happy path

Given a signed-in player and the English locale
When the cases replay in CI with no API key.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-70-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-70-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-70-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Owner only for the report. The live runner stays off until the owner's caps are committed. Players are unaffected until a passing report changes the model.

#### AC-70-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-70-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-70-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The report is an owner page. A player never sees another player's prompt. A live run is capped.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A prompt registry and a pinned card snapshot. Recorded replies are the bench's, not the player's decks.

### Analytics and telemetry

`bench_report_recorded {gate: pass or fail}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Owner only for the report. The live runner stays off until the owner's caps are committed. Players are unaffected until a passing report changes the model.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Which scores are hard lines, and whether French players get French rationale, are open.

### Sources

- https://platform.claude.com/docs/en/about-claude/model-deprecations
- https://deckcheck.co/support
- https://tappedout.net/mtg-forum/commander/a-challenge-extended-to-ai-deckbuilders
- https://spellrack.com/accuracy

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-70: An AI Quality Bench And Safe Model Changes

**Spec:** [`specs/i70-ai-quality-bench-and-model-changes.md`](i70-ai-quality-bench-and-model-changes.md)

**Outcome:** the owner knows whether a build or a suggestion is good, whether a prompt edit made it better or worse and whether a cheaper model would do, from scores that code computes on a fixed, public set of cases. No model or prompt change ships without a committed comparison report, and every stored build names the model and prompt version that made it.

**Status:** Next
**Priority:** Next for slices 0 to 13, because I-30 slice 3 moves builds to a cheaper model behind this bench; Later for slices 14 to 18: player signals, reports as cases, prose rating, public figures and other model surfaces. Never paid
**Impact / effort:** High / medium
**Depends on:** nothing for slices 1 and 3; slice 1 for the injectable transport (slice 7); the owner's per-run cap, workspace limit and gate limits (slice 0) for the live runner (slice 9) and so for the first report (slice 10); I-30 slice 1 for the `AiUsage` fields (slice 13); I-39 slice 10 for acceptance by model (slice 14); I-52 slice 3 and a lawyer's answer for reports as cases (slice 15); I-30 slice 5 for the public figures (slice 17).

The paid tier's strongest candidate is AI use above a free allowance, and nobody can say today whether a build is good. The roadmap called six tests "the golden set" and made two model changes wait for it (I-30 slice 3, I-12); they feed hand-written replies to the validator, and none calls a model (`src/lib/ai/golden-evaluation.test.ts`, checked on `origin/dev` at `72fbfc1`). Both routes send the alias `claude-haiku-4-5` with no system prompt, from inline templates with no version, and no stored deck records the model or prompt that built it. Anthropic lists Haiku 4.5 as legacy, retiring "not sooner than October 15, 2026", a date already passed, with "at least 60 days' notice" ([deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations), read 2026-11-10). Haiku 5.5 costs a tenth as much per token but counts about 30% more tokens, and API version `2026-10-21` refuses `temperature`, so determinism comes from recorded replies and several trials, not a setting. DeckCheck says a model update can move the score of an unchanged deck and combines three scans ([support](https://deckcheck.co/support)); no AI deck tool found publishes a test set, a pass rate or a before-and-after. A model never decides legality, and a model's opinion of prose never gates anything.

### Scope

- [ ] Slice 0, no code: the per-run cap, the monthly limit of a separate Anthropic workspace, the cost and latency limits of the gate, the first candidates, and whether the scores are public.
- [ ] A prompt registry: the build and suggest templates as versioned modules that declare their player inputs, with today's prompts unchanged byte for byte (slice 1); case set v1 with 28 build, 20 suggestion and 18 injection cases, and coverage and input-inventory tests (slice 2); a pinned, hashed card snapshot and a dated Game Changer list (slice 3).
- [ ] Scorers computed by code: outcome, structural issues, corrections by reason and the invented-name rate, basics added, commander honoured, Game Changers against the bracket, land count and colour sources (on I-58's formula once its slice 1 ships), price against budget, tokens, cost and latency (slice 4); suggestion counts, unresolved names, colour identity, legality, duplicates, dislikes and French names (slice 5); injection canaries before and after the validator (slice 6).
- [ ] An injectable transport in both routes, a recorder and a replayer (slice 7); a CI run that replays the recordings with the network stubbed to fail and no key, against a committed baseline, and fails on a lower score, a missing recording or a template changed without a version bump (slice 8).
- [ ] A live runner with three trials by default, dated prices, a pre-run estimate and a hard cap, on a workspace key that never reaches production, and a weekly drift run that opens an issue (slice 9); a comparison report with intervals and every new failure's reply text, and the first recordings of `claude-haiku-4-5` (slice 10); the gate in CI, so a model, a model setting or a prompt version changes only with a committed report whose recordings match (slice 11); reports for Haiku 5.5 and Sonnet 5.5 (slice 12).
- [ ] Provenance: the model and prompt version on the build's `done` event, `Deck.aiModel` and `Deck.aiPromptVersion`, and `AiUsage.promptVersion`, `resolvedModel` and `latencyMs` (slice 13).
- [ ] Later: acceptance by model and prompt version from one event with enums and integers only (slice 14); an `ai_output` report with consent and a script that turns a confirmed report into a candidate case (slice 15); prose rated on a rubric by a different model, calibrated on 30 owner ratings and never gating (slice 16); quality figures on the AI-use disclosure page (slice 17); I-14, I-47, I-64 and I-12 join with their own sets (slice 18).
- [ ] Two build scorers in slice 4:
  - "theme honoured": cards matching the brief's theme by I-54's definitions and I-65 slice 1's clauses, against a minimum the owner sets;
  - "pair valid": the returned command zone passes I-03's pairing check.

  A Temur goad request once returned "a Temur goodstuff deck with no goad cards" ([TappedOut forum](https://tappedout.net/mtg-forum/commander/a-challenge-extended-to-ai-deckbuilders), 2025-05-09 to 21). Added 2026-11-11.

- [ ] **Corrected 2026-11-11:** the spec's claim that nobody publishes a test set, a pass rate or a before-and-after for a model change still holds for AI. Since 2026-11-10 SpellRack publishes a dated pass rate for its deterministic bracket scorer: 83.4%, 131 of 157 precons, all 26 misses over-predicted ([accuracy](https://spellrack.com/accuracy)). That is the bar [I-77](i77-a-bracket-estimate-players-can-audit.md) sets for our own scorer.

### Engineering enablers

- The same recordings and snapshot give a byte-identical score file on every machine.
- The CI run stubs `fetch` to throw and runs without keys, so any network access fails it.
- For every case, the prompt the route sends equals the registry's render.
- With a fake transport, the runner refuses a plan over the cap and stops before the call that would cross it.

**Paid-tier angle:** none. The bench and its page are free. Its value to I-30 is the price: the report lets the owner sell the cheapest model that holds the line, keep a margin on a €3.99 plan, and charge for a deeper Sonnet 5.5 review only if the bench shows it is better.

### Enrichment (2026-11-11)

**User story.** As the owner changing a model, I want a report that says whether the new model invents more card names, so that a cheaper model is not a silent regression.

**Acceptance.**
- The bench scores a pinned set of cases with code, not with another model's opinion.
- A model or prompt change does not ship without the comparison report.
- The cases replay in CI with no API key.

**UX.** The report is an owner page. A player never sees another player's prompt. A live run is capped.

**Data and API.** A prompt registry and a pinned card snapshot. Recorded replies are the bench's, not the player's decks.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `bench_report_recorded {gate: pass or fail}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Owner only for the report. The live runner stays off until the owner's caps are committed. Players are unaffected until a passing report changes the model.

**Open questions.** Which scores are hard lines, and whether French players get French rationale, are open.

### Definition of done

A pull request that changes the model or a prompt cannot merge without a committed report showing that every case the incumbent passed in all trials still passes, at a cost and latency within the owner's limits; CI replays the bench with no key and no network; and a saved AI-built deck names its model and prompt version.

---

