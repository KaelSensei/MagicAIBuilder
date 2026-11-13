# Spec: Checkable AI Copilot (I-02)

> **Initiative:** [I-02 in the roadmap](../roadmap.md) · **Status:** In progress · **Priority:** Now · **Researched:** 2026-11-08 · **Revised:** 2026-11-09 (market corrections, validator scope, cost, disclosure)
> **Owns:** making the deterministic verdict visible. **Does not own:** natural-language search (I-14) or meta evidence (I-09).

## Overview

The copilot already validates its own output deterministically and never lets the model decide legality. The player cannot see that. (**Corrected 2026-11-09:** this holds for suggestions, which are checked against Scryfall card data. A generated deck is checked for structure only; see "Revision 2026-11-09".) This spec makes the check visible: every claim in a suggestion is marked as **verified against card data** or as **model reasoning**, and the validator's verdict is shown rather than silently applied.

## What the market does

Conversational Commander building is no longer a gap. Six products sell it, several free. Read on 2026-11-08 from each product's own pages:

| Product                                | Validation                                                                                                                                                                                                                                        | Explanation                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **ManaTap**                            | States deterministic legality and colour-identity validation; a Deck Checker scores legality, curve, ramp, draw, removal, threats, synergy                                                                                                        | Chat and an iterative workshop                                                      |
| **Farseek**                            | Live Scryfall search before each recommendation, colour identity applied to every search. **Corrected 2026-11-09:** its blog, updated 2026-10-11, says Commander legality is read from Scryfall and the deck flags cards over the singleton limit | Argues why a card fits, reading the whole list; the chat runs on Claude Sonnet 5.5  |
| **DeckCheck**                          | DTI, PowerTune, ManaTune, DeckTrim; its support page documents that **AI results vary between runs**                                                                                                                                              | Deckhand chat                                                                       |
| **MTG Master**                         | **Not found on 2026-11-09.** The 2026-11-08 reading said it enforces legal commander, colour identity and singleton; that claim is not re-verified                                                                                                | Bracket and collection-aware generation                                             |
| **mtgcommander.ai** (added 2026-11-09) | Card data from Scryfall, synergy from EDHREC statistics, combos from Commander Spellbook; how legality and colour identity are enforced is not explained                                                                                          | Free conversational builder funded by Patreon; sends the deck to a Mana Pool cart   |
| **ManaForge**                          | Re-validates saved decks against live ban lists                                                                                                                                                                                                   | Build-from-stock, commander swaps                                                   |
| **CommanderSalt**                      | —                                                                                                                                                                                                                                                 | A May 2026 community thread calls its report detailed but prone to overrating decks |

**The pattern.** Products either validate **or** explain. ManaTap validates and scores but does not publish which claims were checked. Farseek explains persuasively, and its blog describes Scryfall legality and singleton checks, but its answers do not mark which statements were checked. DeckCheck openly documents that its output is non-deterministic.

**Sources for the 2026-11-09 corrections:** [Farseek](https://farseek.ai/) and its [blog post on ChatGPT and Commander](https://farseek.ai/blog/chatgpt-fails-commander-deckbuilding) (published 2026-04-02, updated 2026-10-11); [mtgcommander.ai](https://mtgcommander.ai/) and its [Patreon](https://www.patreon.com/MTGCommanderAI); [Mana Pool mass-entry integrations](https://manapool.com/mass-entry-info). All read on 2026-11-09. A search for MTG Master found only a [Product Hunt profile](https://www.producthunt.com/@edlimir) describing deckbuilding tools with no mention of AI.

**The opening.** Do both, and say which is which. A suggestion where "this is legal in your colour identity" is a checked fact and "this smooths your turn-three" is model reasoning is a different product from one where both arrive in the same sentence at the same confidence. The validator already exists; it is simply invisible.

This is also the cheapest differentiator on the roadmap: it is a presentation change over machinery that already passes its tests.

## Current state in this codebase

Already shipped, per the roadmap:

- Claude and OpenAI providers, server-side keys, rate limiting, prompt-injection protections.
- A **deterministic post-generation validator**; the LLM never decides legality. **Corrected 2026-11-09:** for generated decks this validator checks structure only. See "Revision 2026-11-09" below.
- Structured plan before generation; per-card reasoning; alternatives by budget, power and play pattern.
- Diff before applying; "why is this card here?" and "what is the weakest card?".
- Six validator regression cases for structure and evidence contracts (`src/lib/ai/golden-evaluation.test.ts`); no case calls a model. **Corrected 2026-11-10** from "a golden evaluation set": the bench that judges a model is [I-70](i70-ai-quality-bench-and-model-changes.md).
- `ExternalRecommendationFreshness` and AI-suggested labelling (#1052) — the labelling vocabulary already exists for external sources.

Open in the roadmap: _"Keep the deterministic validator's verdict visible in the copilot's output instead of only applying it silently."_ This spec details that item.

## Functional requirements

### 1. Two kinds of claim, never mixed

1.1 Every statement attached to a suggestion is typed as **checked** or **reasoned**.
1.2 A checked claim names what verified it — Scryfall card data, the format banlist, the colour-identity rule, the Game Changers list, the singleton rule — and carries the data's observation time.
1.3 A reasoned claim is labelled as model reasoning, with no source, and is never styled to look checked.
1.4 Checked and reasoned claims are visually distinguishable without relying on colour alone.

### 2. The verdict is shown

2.1 After generation, the validator's result is rendered: what passed, what was corrected, what was rejected.
2.2 A suggestion the validator rejected is shown as rejected with the rule that rejected it, not silently dropped. A player learning that the model proposed an illegal card, and that the product caught it, is the proof the feature exists to give.
2.3 The count of corrections is visible at the top of the result, not buried per card.

### 3. Reproducibility is stated

3.1 The result states whether the same brief would reproduce the same plan, and names the provider and model used.
3.2 Where output is non-deterministic, say so — DeckCheck documents this and the product should not pretend otherwise.

### 4. No regression in the existing contract

4.1 The LLM still never decides legality, colour identity, quantities or bracket rules.
4.2 Making the verdict visible changes presentation only; the validator's behaviour is unchanged and its tests are untouched.

## Non-goals

- Increasing generation volume or speed. Explicitly a non-goal in the roadmap: a wrong deck produced instantly is the failure this product exists to avoid.
- Qualitative provider-backed evaluation of usefulness, until a stable review rubric exists — that remains the open golden-set item, now owned by [I-70](i70-ai-quality-bench-and-model-changes.md#11-prose-if-ever) (2026-11-10).
- Replacing I-09's source-and-freshness labelling with a second vocabulary. Reuse it.

## Testing strategy

- **Contract:** every claim in a copilot response carries a type; an untyped claim fails the test.
- **Contract:** a checked claim carries a source and an observation time; a reasoned claim carries neither.
- **Sociable:** a brief that provokes an illegal suggestion renders it as rejected with its rule, and the deck is unchanged.
- **Accessibility:** the checked/reasoned distinction survives greyscale and a screen reader.
- **Regression:** the six existing validator regression cases (`golden-evaluation.test.ts`) pass unchanged — this spec must not alter validator behaviour.

## Delivery slices

| #   | Slice                                                                      | Depends on |
| --- | -------------------------------------------------------------------------- | ---------- |
| 1   | Type every claim at the API boundary: `checked` with source, or `reasoned` | —          |
| 2   | Render the distinction, non-colour-dependent, in the suggestion panel      | 1          |
| 3   | Validator verdict panel: passed, corrected, rejected with rules            | 1          |
| 4   | Rejected suggestions shown rather than dropped                             | 3          |
| 5   | Provider, model and reproducibility statement on the result                | 1          |

Slice 1 is a contract change and should land with its tests before any UI work; slices 2 and 3 can then proceed in parallel.

## Revision 2026-11-09

A second research pass and a read of `dev` on 2026-11-09 changed three things this spec assumed. Slices 1 to 5 above still change presentation only. The requirements below add behaviour, so they come with their own tests and do not reuse requirement 4.2's promise that the validator is unchanged.

### What the validator actually checks

- **Generated decks.** `validateGeneratedDeck` (`src/lib/ai/generated-deck-validation.ts`) checks the response shape, a non-empty commander, no commander or partner repeated in the list, positive integer quantities, singleton with the capped-multiple exceptions, and a total of 99 (98 with a partner). It does not check that a card exists, colour identity, Commander legality, the banlist or Game Changers. `src/app/api/ai/build/route.ts` asks the model for all of those in the prompt and trusts the answer. Any structural issue rejects the whole build, and the client shows "AI deck build failed".
- **After the build.** `DeckWizard.tsx` resolves the names through Scryfall's collection endpoint and drops names Scryfall does not return without telling the player. The deck store marks Game Changers and banned cards from its name lists, and colour identity appears later among the editor's warnings. No step rejects or repairs an off-identity, banned or excess Game Changer card before it is saved.
- **Suggestions.** `src/app/api/ai/suggest/route.ts` resolves each suggested card through Scryfall and attaches colour-compatibility and Commander-legality evidence (`src/lib/ai/suggestion-evidence.ts`). The "checked" claims of requirement 1 exist for suggestions today, not for generated decks.

### 5. Card-data checks before a generated deck is saved

5.1 The server resolves every generated card against Scryfall and checks existence, colour identity, Commander legality and the Game Changer count for the chosen bracket. Added 2026-11-10: a card whose release status is `preview` is removed with the reason `Preview, legal from <date>`, never "not legal" alone; the wording comes from [I-73](i73-every-set-release-ready-on-day-one.md#3-release-status-of-a-card) slice 2.
5.2 A failing card is repaired from a legal candidate pool where one exists, and every correction is shown under requirement 2. A build is rejected only when it cannot be repaired.
5.3 A name Scryfall does not resolve is shown to the player, never dropped silently.
5.4 Until 5.1 ships, no generated deck carries a "verified" label.

**Interim repair policy (`fix/ai-build-legality-validator`).** The build route resolves every name in batched Scryfall collection requests and checks the list with `checkGeneratedDeckLegality` (`src/lib/ai/generated-deck-legality.ts`), reusing the editor's colour-identity, copy-limit and pairing rules. Until the legal candidate pool of slice 9 exists:

- An unknown, banned, not-legal, off-identity or excess card, or the commander repeated in the list, is removed.
- A short list is filled with basic lands of the command zone's colours (Wastes when colourless). A long list loses basic lands from its largest stack.
- The build is rejected when the commander or partner is unknown, cannot be a commander, is not legal, or cannot pair, and when a long list has too few basic lands to trim.
- Every change travels on the stream's `done` event, and the wizard lists it before it opens the deck.
- The Game Changer count for the chosen bracket is not checked yet, so 5.1, and the "verified" label of 5.4, remain open.

### 6. Disclosure of AI use

6.1 A public page states which surfaces call a language model (deck build, suggestions, card questions) and which do not (legality, colour identity, bracket rules, search syntax, playtest, statistics), and names the provider and model.
6.2 Each AI surface carries a label, reusing the AI-suggested vocabulary from #1052.
6.3 Every deterministic surface stays usable when the copilot is switched off or the provider is unavailable.

Evidence: on r/EDH, ["Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time."](https://www.reddit.com/r/EDH/comments/1q0epg2/) reached 729 points on 31 December 2025. All fourteen r/EDH posts since January 2025 with "ChatGPT" in the title sit at zero points. New builders advertise that they do not use AI ([edhspace, October 2026](https://www.reddit.com/r/EDH/comments/1x7wicf/)). An AI-disclosure question was the top reply under EDHREC's redesign announcement ([r/magicTCG](https://www.reddit.com/r/magicTCG/comments/1x56apg/)), and AI-use questions drew 39 and 38 points under BlueprintMTG's launch ([r/EDH](https://www.reddit.com/r/EDH/comments/1vzwh0m/)). Counts come from the Arctic Shift archive, queried 2026-11-09, and can differ from live Reddit.

### 7. Cost and truncation

7.1 Each AI route records `stop_reason` and `usage.output_tokens`. A response cut off at `max_tokens` is reported as truncated, not as a parse error.
7.2 Usage is metered per user per month, and a monthly quota is enforced before any public launch or paid tier. Today the only limits are 5 builds and 10 suggestions per user per 60 seconds, held in an in-memory store per instance (`src/lib/rate-limit.ts`). In theory one account could send 216,000 builds in 30 days, about 1,776 USD on today's model (estimate). Metering is tracked under I-05.
7.3 A change of model is judged on the golden set before it ships. **Re-pointed 2026-11-10:** that set calls no model, so a change of model or prompt is judged by [I-70](i70-ai-quality-bench-and-model-changes.md#8-the-comparison-report-and-the-model-change-gate)'s comparison report and gate.

**Prices.** Both routes call `claude-haiku-4-5`. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), read 2026-11-09, lists per million tokens: Haiku 4.5 at 1 USD input and 5 USD output; Haiku 5.5 at 0.10 and 0.50 USD for prompts up to 100,000 tokens; Sonnet 5.5 at 2 and 10 USD. The Batch API halves input and output. Haiku 5.5 and later models use a tokenizer that produces about 30% more tokens for the same text. Haiku 4.5 caches no prompt shorter than 4,096 tokens, and today's prompts are shorter.

**Cost per active user (estimate).** One build costs about 0.008 USD and one suggestion about 0.012 USD on Haiku 4.5; output is about 92% of a build's cost. With three suggestion calls per build, a month costs about 0.22, 0.88 and 4.39 USD for 5, 20 and 100 builds on Haiku 4.5; 0.03, 0.12 and 0.60 USD on Haiku 5.5; and 0.60, 2.39 and 11.94 USD on Sonnet 5.5. A 100-build user on Haiku 4.5 costs more than a 3 EUR plan earns. The estimates come from rendered prompt templates and synthetic outputs, not from `count_tokens` or usage logs.

**Truncation (to verify).** The default suggestion task asks for 8 additions with up to 3 alternatives each, 4 removals and an analysis. Its estimated output, about 2,200 tokens, sits at or above the route's 2,048-token cap. The route parses the text as JSON without checking `stop_reason`, so a truncated answer would surface as a failure. Measure before changing the cap.

**Techniques to evaluate on [I-70](i70-ai-quality-bench-and-model-changes.md)'s bench** (design estimates, not measured here; re-pointed 2026-11-10 from "the golden set"):

- Retrieve a legal candidate pool from Scryfall before calling the model: colour identity inside the commander's, `legal:commander`, Game Changers by bracket, a price cap. Off-identity and illegal cards then become impossible rather than detected.
- Ask the model for numbered picks from that pool, grouped by role, instead of full JSON objects. This could cut build output from about 1,500 tokens to 200–400.
- Repair instead of reject (requirement 5.2), so one bad card does not cost a second full build.
- Precompute plans per commander, strategy, bracket and budget band with the Batch API, and serve repeats from the database.
- Put static instructions and bracket rules first, in a system block, so caching can apply once retrieval makes prompts long enough.

### Added delivery slices

| #   | Slice                                                                      | Depends on            |
| --- | -------------------------------------------------------------------------- | --------------------- |
| 6   | Record `stop_reason` and token usage per route; report truncation          | Moved to I-30 slice 1 |
| 7   | Per-user monthly metering and quota (with I-05)                            | Moved to I-30 slice 2 |
| 8   | Server-side card-data check of generated decks, unresolved names shown     | —                     |
| 9   | Repair from a legal candidate pool, corrections shown in the verdict panel | 3, 8; I-76 slice 3    |
| 10  | Public AI-use disclosure page and per-surface labels                       | Moved to I-30 slice 5 |

Added 2026-11-11: slice 9's pool reads [I-76](i76-complete-this-deck-from-my-collection.md) slice 3's `isLegalCandidate`, so the legal-candidate filter has one owner. Completion from the collection is I-76; its AI mode (I-76 slice 20) picks from slice 9's pool and counts against the allowance.

## Open questions

- Does showing rejected suggestions undermine confidence, or build it? The argument for showing them is that the product's whole claim is that the check is real — and an invisible check is indistinguishable from no check. Worth watching once it ships.
- Should the verdict be exportable with the deck, so a player can show their pod that the list was validated? That edges into I-15's Rule 0 sheet and may belong there instead.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can describe what they want and receive a legal, budget-aware and explainable plan.

### Goals

- For a fixed brief and deck, the copilot produces reproducible structured output that passes deterministic Commander validation, stays within constraints, and explains its recommendations well enough for a player to accept or reject them.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-02-01

As a player who asked for a deck, I want to see which sentences were checked against card data and which are the model's, so that I can reject a line without trusting the whole reply.

#### US-02-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-02-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-02-01 Happy path

Given a signed-in player and the English locale
When every sentence in a suggestion is tagged checked or model.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-02-02 Happy path

Given a signed-in player and the English locale
When a test fails if a model's sentence is tagged checked.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-02-03 Happy path

Given a signed-in player and the English locale
When legality, search and the playtest still work with the copilot switched off.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-02-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-02-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-02-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in, behind the existing per-minute limit. Guests do not call the model. The disclosure page is public.

#### AC-02-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-02-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-02-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The tag sits on the sentence, not in a footer. Applying a suggestion still shows the diff first. A truncated reply says it was cut off, not that the deck was illegal.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The build and suggest routes stay the only model callers. `verifyGeneratedDeck` remains the card-data check. Metering and the disclosure page are I-30.

### Analytics and telemetry

`ai_suggestion_action {action: apply, ignore or dismiss, tagged: checked or model}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in, behind the existing per-minute limit. Guests do not call the model. The disclosure page is public.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

Stop adding prompts if a player cannot see which sentences were checked against card data.

### Open questions

Whether the wizard may still ask a model to choose a commander is the open decision with I-54.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-02-101

As a player, I want the product to conversational brief: commander, theme, play pattern, budget, power target and dislikes., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Conversational brief: commander, theme, play pattern, budget, power target and dislikes.

#### AC-02-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-102

As a player, I want the product to structured plan before card generation: gameplan, win conditions, roles and constraints., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Structured plan before card generation: gameplan, win conditions, roles and constraints.

#### AC-02-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-103

As a player, I want the product to explain every suggestion with evidence: role, synergy, curve, color identity, legality and price., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Explain every suggestion with evidence: role, synergy, curve, color identity, legality and price.

#### AC-02-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-108 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-02-104

As a player, I want the product to offer alternatives by budget, power and play pattern instead of one opaque answer., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Offer alternatives by budget, power and play pattern instead of one opaque answer.

#### AC-02-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-105

As a player, I want the product to diff a proposed change against the current deck before applying it., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Diff a proposed change against the current deck before applying it.

#### AC-02-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-106

As a player, I want the product to support "why is this card here?" and "what is the weakest card?" questions., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Support "why is this card here?" and "what is the weakest card?" questions.

#### AC-02-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-107

As a player, I want the product to add a deterministic post-generation validator; the LLM never decides legality., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add a deterministic post-generation validator; the LLM never decides legality. **Correction 2026-11-09:** for the deck build route this validator checks structure only (see below). Suggestions are checked against Scryfall card data; generated decks are not. **2026-11-10:** #1318 checks generated decks against card data too; see the card-data item below.

#### AC-02-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-108

As a player, I want the product to build a small regression set: six validator cases, three generated decks and three suggestion cards (src/lib/ai/golden-evaluation.test.ts); no case calls a model., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Build a small regression set: six validator cases, three generated decks and three suggestion cards (src/lib/ai/golden-evaluation.test.ts); no case calls a model. **Corrected 2026-11-10** from "a golden evaluation set for valid cards, useful explanations", which no case measures (I-70).

#### AC-02-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-109

As a player, I want the product to expand the golden set from deterministic structural and evidence contracts to provider-backed qualitative evaluations only when a stable review rubric exists., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Expand the golden set from deterministic structural and evidence contracts to provider-backed qualitative evaluations only when a stable review rubric exists. Re-pointed 2026-11-10 to I-70: its bench scores recorded model replies by code, and rates prose only on a calibrated rubric that never gates.

#### AC-02-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-110

As a player, I want the product to keep the deterministic validator's verdict visible in the copilot's output instead of only applying it silently., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the deterministic validator's verdict visible in the copilot's output instead of only applying it silently. Competing assistants either validate without explaining or explain without validating; the difference is only a differentiator if the player can see which claims were checked against card data and which are the model's reasoning.

#### AC-02-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-111

As a player, I want the product to check a generated deck against card data on the server before it reaches the player: every card exists, sits inside the commander's colour identity, is legal in Commander, and the Game Changer count fits the chosen bracket., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Check a generated deck against card data on the server before it reaches the player: every card exists, sits inside the commander's colour identity, is legal in Commander, and the Game Changer count fits the chosen bracket. Repair a failing card from a legal candidate pool rather than rejecting the whole build, and show each correction. Until this ships, do not label generated decks as verified.

#### AC-02-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-132 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-02-112

As a player, I want the product to record stop_reason and output token usage per AI route, and stop treating a truncated response as a parse failure., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Record stop_reason and output token usage per AI route, and stop treating a truncated response as a parse failure. Whether the default suggestion task is cut off at its 2,048-token cap is an estimate to verify.

#### AC-02-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-02-113

As a player, I want the product to publish a page that says where the product uses a language model and where it does not, and label each AI surface in the product., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Publish a page that says where the product uses a language model and where it does not, and label each AI surface in the product. Every deterministic surface (legality, colour identity, bracket rules, search syntax, playtest) must stay usable with the copilot switched off.

#### AC-02-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-138 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-02-114

As a player, I want the product to say whether the wizard's budget is a cap per card or a deck total., so that a player can describe what they want and receive a legal, budget-aware and explainable plan.

#### AC-02-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Say whether the wizard's budget is a cap per card or a deck total. DeckWizard (src/components/deck/DeckWizard.tsx) offers "< $50", "$50 – $200" and "$200 – $500" (src/messages/en/deck.json), which read as deck totals, while src/app/api/ai/build/route.ts sends the chosen value to the model as a cap per card: the "$50 – $200" option becomes "$200 max per card". Only the step's subtitle says "per-card". I-54 requirement 5.4 asks for the honest label; its finder passes a deck total.

#### AC-02-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-02-141 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can describe what they want and receive a legal, budget-aware and explainable plan.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-02: AI Deck Copilot

**Spec:** [`specs/i02-checkable-ai-copilot.md`](i02-checkable-ai-copilot.md)

**Outcome:** a player can describe what they want and receive a legal, budget-aware and explainable plan.

**Status:** Building
**Priority:** Now

### Already shipped

- Claude/OpenAI provider support.
- Archetype detection and manual override.
- Ten archetype templates.
- Budget constraints, cuts and additions.
- Per-card reasoning, one-click add and ignore actions.
- Server-side secrets, validation, rate limiting and prompt-injection protections.
- Optional player brief covering theme, desired play pattern and dislikes, combined with the existing commander, budget and power target.
- Six validator regression cases for generated deck structure and recommendation evidence; no case calls a model, and broader usefulness evaluation is [I-70](i70-ai-quality-bench-and-model-changes.md)'s (corrected 2026-11-10).

### Next slice

- [x] Conversational brief: commander, theme, play pattern, budget, power target and dislikes.
- [x] Structured plan before card generation: gameplan, win conditions, roles and constraints.
- [x] Explain every suggestion with evidence: role, synergy, curve, color identity, legality and price.
- [x] Offer alternatives by budget, power and play pattern instead of one opaque answer.
- [x] Diff a proposed change against the current deck before applying it.
- [x] Support "why is this card here?" and "what is the weakest card?" questions.
- [x] Add a deterministic post-generation validator; the LLM never decides legality. **Correction 2026-11-09:** for the deck build route this validator checks structure only (see below). Suggestions are checked against Scryfall card data; generated decks are not. **2026-11-10:** #1318 checks generated decks against card data too; see the card-data item below.
- [x] Build a small regression set: six validator cases, three generated decks and three suggestion cards (`src/lib/ai/golden-evaluation.test.ts`); no case calls a model. **Corrected 2026-11-10** from "a golden evaluation set for valid cards, useful explanations", which no case measures ([I-70](i70-ai-quality-bench-and-model-changes.md)).
- [ ] Expand the golden set from deterministic structural and evidence contracts to provider-backed qualitative evaluations only when a stable review rubric exists. Re-pointed 2026-11-10 to [I-70](i70-ai-quality-bench-and-model-changes.md): its bench scores recorded model replies by code, and rates prose only on a calibrated rubric that never gates.
- [ ] Keep the deterministic validator's verdict visible in the copilot's output instead of only applying it silently. Competing assistants either validate without explaining or explain without validating; the difference is only a differentiator if the player can see which claims were checked against card data and which are the model's reasoning.
- [ ] Check a generated deck against card data on the server before it reaches the player: every card exists, sits inside the commander's colour identity, is legal in Commander, and the Game Changer count fits the chosen bracket. Repair a failing card from a legal candidate pool rather than rejecting the whole build, and show each correction. Until this ships, do not label generated decks as verified.
  - [x] Check each card of a generated deck on the server before it is streamed (`verifyGeneratedDeck` in `src/lib/ai/generated-deck-legality.ts`). Unknown names, banned or not-legal cards, off-identity cards, extra copies and a repeated commander are removed; a short list gets basic lands and a long one loses basics; a commander that is unknown, banned, not legal or not eligible fails the build. The wizard shows each correction before it opens the deck (#1318). The Game Changer count for the chosen bracket and repair from a legal candidate pool remain open, so generated decks are still not labelled verified.
  - A preview card is removed with the reason `Preview, legal from <date>`, never "not legal" alone: today `commanderLegalityProblem` maps every value but `legal` to "not legal". The wording is [I-73](i73-every-set-release-ready-on-day-one.md) slice 2's (recorded 2026-11-10).
- [ ] Record `stop_reason` and output token usage per AI route, and stop treating a truncated response as a parse failure. Whether the default suggestion task is cut off at its 2,048-token cap is an estimate to verify.
  - Verified on `dev` on 2026-11-09: `src/app/api/ai/suggest/route.ts` passed the reply text to `JSON.parse` without reading `stop_reason`, and `src/app/api/ai/build/route.ts` did the same after stripping code fences. Recording usage per call is [I-30](i30-business-model-and-paid-tier.md) slice 1.
  - [x] Report a reply cut off at the token cap as a typed truncation (`ModelOutputTruncatedError` in `src/lib/ai/model-reply.ts`) for Anthropic `stop_reason: "max_tokens"` and OpenAI `finish_reason: "length"`, logged once with the model and cap; the client gets the route's existing error event. The suggestion cap rises from 2,048 to 4,096 tokens (#1305). Token usage per call remains open.
  - One owner, decided 2026-11-10: [I-30](i30-business-model-and-paid-tier.md) slices 1, 2 and 5 build the metering, the monthly quota and the AI-use disclosure page, which moved from I-02 slices 6, 7 and 10.
- [ ] Publish a page that says where the product uses a language model and where it does not, and label each AI surface in the product. Every deterministic surface (legality, colour identity, bracket rules, search syntax, playtest) must stay usable with the copilot switched off.
  - Dated 2026-11-10: the AI Act's Article 50 reaches the copilot. The map of model surfaces, the machine-readable `ai` origin and the public label are scope of [I-30](i30-business-model-and-paid-tier.md) slice 5, the disclosure page's owner. Research, not legal advice; lawyer question [L-40](../legal-questions.md#l-40-the-ai-acts-transparency-duties-art-50).
- [ ] Say whether the wizard's budget is a cap per card or a deck total. `DeckWizard` (`src/components/deck/DeckWizard.tsx`) offers "< $50", "$50 – $200" and "$200 – $500" (`src/messages/en/deck.json`), which read as deck totals, while `src/app/api/ai/build/route.ts` sends the chosen value to the model as a cap per card: the "$50 – $200" option becomes "$200 max per card". Only the step's subtitle says "per-card". [I-54](i54-find-your-next-commander.md) requirement 5.4 asks for the honest label; its finder passes a deck total.
- [ ] Added 2026-11-12 (thirteenth pass): a suggestion whose projected deck would create or widen one of [I-100](i100-cards-that-work-against-each-other.md)'s findings carries a `checked` claim saying so, with the count, through slice 1's claim contract (I-100 slice 7). The copilot never silences a finding.

**2026-11-10:** [I-54](i54-find-your-next-commander.md) proposes removing the wizard's "let the AI choose" commander option. Today, when the player names no commander, `src/app/api/ai/build/route.ts` asks the model to "Choose the best commander" for the chosen colours. I-54 slice 6 replaces the option with "Help me choose", which opens the commander finder and returns a pick, so the build route always receives a commander. Removing the route's prompt branch is this initiative's change, and the owner decides (status note).

**2026-11-10, fifth pass:** two more initiatives reach the copilot. [I-58](i58-mana-base-builder.md) slice 4 splits the basics that `src/lib/ai/generated-deck-size.ts` adds to a short list by colour-source targets instead of evenly in WUBRG order, and its slice 14 would let the builder pick the wizard's lands so the model proposes nonland cards only; slice 14 needs this initiative's owner to agree. [I-57](i57-printing-preferences-everywhere.md) proposes a filter that leaves out cards printed only in Universes Beyond; copilot suggestions read it once it ships, and an explicit request still finds those cards.

**2026-11-10, seventh pass:** the plan's win conditions are never checked. `DeckPlan.winConditions` (`src/lib/ai/deck-plan.ts`) is fixed text from a table of eight strategies, such as voltron's "Deal 21 commander damage", or from a template; it is sent to the model and shown in the wizard (`DeckWizard.tsx`), and nothing checks whether the built deck holds that route (checked on `origin/dev` at `72fbfc1`). [I-65](i65-how-this-deck-wins.md) slice 11 maps each intended win condition to route kinds and shows which the built deck holds, with counts, without blocking the build. This initiative owns the wizard step and signs it off.

**2026-11-11, eleventh pass:** completion from the collection is [I-76](i76-complete-this-deck-from-my-collection.md), not a copilot route. Spec slice 9's legal candidate pool now reads I-76 slice 3's `isLegalCandidate`, so one filter has one owner, and I-76's later AI mode (slice 20) picks numbered cards from that pool and counts against the allowance. The AI bench gains two scorers for it in [I-70](i70-ai-quality-bench-and-model-changes.md) slice 4.

### Findings from the 2026-11-09 pass

Code facts were read on `dev` on 2026-11-09. Figures marked as estimates are calculations from the [2026-11-09 research pass](../competitive-landscape.md#ai-unit-economics), not measurements; a `count_tokens` run or real usage logs should replace them.

- **What the build route checks.** `validateGeneratedDeck` (`src/lib/ai/generated-deck-validation.ts`) checks the response shape, a non-empty commander, no commander or partner repeated in the list, positive integer quantities, singleton with the capped-multiple exceptions, and a total of exactly 99 (98 with a partner). It does not check that cards exist, colour identity, Commander legality, the banlist or Game Changers. The prompt asks the model for all of those, and `src/app/api/ai/build/route.ts` trusts the answer. Any structural issue rejects the whole build with "AI deck build failed", so the provider call is wasted and a retry pays again.
- **What the client does afterwards.** The deck wizard (`src/components/deck/DeckWizard.tsx`) resolves the names through Scryfall's collection endpoint, drops names Scryfall does not return without telling the player, and adds the rest. The deck store marks Game Changers and banned cards from its name lists, and colour-identity problems appear later as the editor's existing warnings. Nothing rejects or repairs an off-identity, banned or excess Game Changer card before it is saved. Suggestions differ: `src/app/api/ai/suggest/route.ts` resolves each suggested card through Scryfall and attaches colour-compatibility and Commander-legality evidence.
- **No monthly quota.** The only limits are per minute and per user: 5 builds and 10 suggestions per 60 seconds, held in an in-memory store that is per instance (`src/lib/rate-limit.ts`). No quota, credit or token metering exists in `src/lib`, `src/app/api` or the Prisma schema. In theory one account could send 216,000 builds in 30 days, about 1,776 USD on today's model (estimate). Metering belongs to I-05.
- **Today's model and prices.** Both routes call `claude-haiku-4-5` with `max_tokens` 4,096 (build) and 2,048 (suggest), with no system prompt and no prompt caching. Anthropic's pricing page, read on 2026-11-09, lists Haiku 4.5 at 1 USD per million input tokens and 5 USD per million output tokens, Haiku 5.5 at 0.10 and 0.50 USD (prompts up to 100,000 tokens), and Sonnet 5.5 at 2 and 10 USD. The Batch API halves both. Haiku 4.5 caches nothing below a 4,096-token prompt, and today's prompts are shorter.
- **Cost per active user (estimate, USD per month).** A build costs about 0.008 USD and a suggestion about 0.012 USD on Haiku 4.5, and output is about 92% of a build's cost. With three suggestions per build:

  | Model      | 5 builds | 20 builds | 100 builds |
  | ---------- | -------: | --------: | ---------: |
  | Haiku 4.5  |     0.22 |      0.88 |       4.39 |
  | Haiku 5.5  |     0.03 |      0.12 |       0.60 |
  | Sonnet 5.5 |     0.60 |      2.39 |      11.94 |

  A 100-build user on Haiku 4.5 costs more than a 3 EUR plan earns. Haiku 5.5 is about seven to eight times cheaper, but it uses about 30% more tokens for the same text, thinks by default, and has no published Magic quality results, so a switch needs a larger `max_tokens`, thinking turned down, refusal handling and a golden-set run first.

- **Possible truncation (to verify).** The default suggestion task asks for 8 additions with up to 3 alternatives each, 4 removals and an analysis. Its estimated output, about 2,200 tokens, sits at or above the 2,048-token cap. The suggest route parses the text as JSON without checking `stop_reason`, so a cut-off answer would fail as a parse error.
- **Cheaper and more trustworthy at once.** The research recommends four techniques, none measured here yet. First, retrieve a legal candidate pool from Scryfall (colour identity, `legal:commander`, Game Changers per bracket, price cap) so off-identity and illegal cards become impossible rather than detected. Second, have the model return numbered picks from that pool instead of full JSON objects, which could cut build output three to five times. Third, repair a failing card from the pool instead of rejecting the build. Fourth, precompute commander-level plans with the Batch API and serve repeats from the database.
- **Market corrections.** The 2026-11-08 [spec](i02-checkable-ai-copilot.md) said Farseek states no deterministic legality validation. Farseek's own blog, updated 2026-10-11, says Commander legality is read from Scryfall and the deck flags cards over the singleton limit. MTG Master, cited as enforcing legality, could not be found on 2026-11-09. ManaTap's Pro tier was £3.99 a month on 2026-11-09, not the "around $12.99" recorded on 2026-11-08.
- **Player hostility to AI.** On r/EDH a December 2025 post, "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time.", reached 729 points; all fourteen 2025–2026 posts with "ChatGPT" in the title sit at zero; builders now advertise that they do not use AI; and AI-use questions are top comments under launches, including EDHREC's redesign. Only checkable AI output is tolerated there, and the community now asks for disclosure. This is why the visible verdict and the disclosure page above matter more than generation quality.

**Twelfth pass, 2026-11-11:** a surface that explains and cannot add a card is [I-91](i91-an-explainer-that-cannot-change-the-deck.md), not a second generator. This initiative keeps proposals. The visible-verdict item above is done when each sentence is tagged "checked" or "model", and a test fails if a model's sentence is tagged "checked". #1369, which shows an editable Scryfall query, is open and is I-14, not this route.

### Enrichment (2026-11-11)

**User story.** As a player who asked for a deck, I want to see which sentences were checked against card data and which are the model's, so that I can reject a line without trusting the whole reply.

**Acceptance.**
- Every sentence in a suggestion is tagged checked or model.
- A test fails if a model's sentence is tagged checked.
- Legality, search and the playtest still work with the copilot switched off.

**UX.** The tag sits on the sentence, not in a footer. Applying a suggestion still shows the diff first. A truncated reply says it was cut off, not that the deck was illegal.

**Data and API.** The build and suggest routes stay the only model callers. `verifyGeneratedDeck` remains the card-data check. Metering and the disclosure page are I-30.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `ai_suggestion_action {action: apply, ignore or dismiss, tagged: checked or model}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in, behind the existing per-minute limit. Guests do not call the model. The disclosure page is public.

**Open questions.** Whether the wizard may still ask a model to choose a commander is the open decision with I-54.

**Kill criteria.** Stop adding prompts if a player cannot see which sentences were checked against card data.

### Definition of done

For a fixed brief and deck, the copilot produces reproducible structured output that passes deterministic Commander validation, stays within constraints, and explains its recommendations well enough for a player to accept or reject them.

---

