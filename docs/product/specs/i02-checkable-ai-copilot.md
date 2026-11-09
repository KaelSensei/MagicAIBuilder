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
- A golden evaluation set for structure and evidence contracts.
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
- Qualitative provider-backed evaluation of usefulness, until a stable review rubric exists — that remains the open golden-set item.
- Replacing I-09's source-and-freshness labelling with a second vocabulary. Reuse it.

## Testing strategy

- **Contract:** every claim in a copilot response carries a type; an untyped claim fails the test.
- **Contract:** a checked claim carries a source and an observation time; a reasoned claim carries neither.
- **Sociable:** a brief that provokes an illegal suggestion renders it as rejected with its rule, and the deck is unchanged.
- **Accessibility:** the checked/reasoned distinction survives greyscale and a screen reader.
- **Regression:** the existing golden set passes unchanged — this spec must not alter validator behaviour.

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

5.1 The server resolves every generated card against Scryfall and checks existence, colour identity, Commander legality and the Game Changer count for the chosen bracket.
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
7.3 A change of model is judged on the golden set before it ships.

**Prices.** Both routes call `claude-haiku-4-5`. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), read 2026-11-09, lists per million tokens: Haiku 4.5 at 1 USD input and 5 USD output; Haiku 5.5 at 0.10 and 0.50 USD for prompts up to 100,000 tokens; Sonnet 5.5 at 2 and 10 USD. The Batch API halves input and output. Haiku 5.5 and later models use a tokenizer that produces about 30% more tokens for the same text. Haiku 4.5 caches no prompt shorter than 4,096 tokens, and today's prompts are shorter.

**Cost per active user (estimate).** One build costs about 0.008 USD and one suggestion about 0.012 USD on Haiku 4.5; output is about 92% of a build's cost. With three suggestion calls per build, a month costs about 0.22, 0.88 and 4.39 USD for 5, 20 and 100 builds on Haiku 4.5; 0.03, 0.12 and 0.60 USD on Haiku 5.5; and 0.60, 2.39 and 11.94 USD on Sonnet 5.5. A 100-build user on Haiku 4.5 costs more than a 3 EUR plan earns. The estimates come from rendered prompt templates and synthetic outputs, not from `count_tokens` or usage logs.

**Truncation (to verify).** The default suggestion task asks for 8 additions with up to 3 alternatives each, 4 removals and an analysis. Its estimated output, about 2,200 tokens, sits at or above the route's 2,048-token cap. The route parses the text as JSON without checking `stop_reason`, so a truncated answer would surface as a failure. Measure before changing the cap.

**Techniques to evaluate against the golden set** (design estimates, not measured here):

- Retrieve a legal candidate pool from Scryfall before calling the model: colour identity inside the commander's, `legal:commander`, Game Changers by bracket, a price cap. Off-identity and illegal cards then become impossible rather than detected.
- Ask the model for numbered picks from that pool, grouped by role, instead of full JSON objects. This could cut build output from about 1,500 tokens to 200–400.
- Repair instead of reject (requirement 5.2), so one bad card does not cost a second full build.
- Precompute plans per commander, strategy, bracket and budget band with the Batch API, and serve repeats from the database.
- Put static instructions and bracket rules first, in a system block, so caching can apply once retrieval makes prompts long enough.

### Added delivery slices

| #   | Slice                                                                      | Depends on |
| --- | -------------------------------------------------------------------------- | ---------- |
| 6   | Record `stop_reason` and token usage per route; report truncation          | —          |
| 7   | Per-user monthly metering and quota (with I-05)                            | 6          |
| 8   | Server-side card-data check of generated decks, unresolved names shown     | —          |
| 9   | Repair from a legal candidate pool, corrections shown in the verdict panel | 3, 8       |
| 10  | Public AI-use disclosure page and per-surface labels                       | —          |

## Open questions

- Does showing rejected suggestions undermine confidence, or build it? The argument for showing them is that the product's whole claim is that the check is real — and an invisible check is indistinguishable from no check. Worth watching once it ships.
- Should the verdict be exportable with the deck, so a player can show their pod that the list was validated? That edges into I-15's Rule 0 sheet and may belong there instead.
