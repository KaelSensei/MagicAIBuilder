# Spec: Checkable AI Copilot (I-02)

> **Initiative:** [I-02 in the roadmap](../roadmap.md) · **Status:** In progress · **Priority:** Now · **Researched:** 2026-11-08
> **Owns:** making the deterministic verdict visible. **Does not own:** natural-language search (I-14) or meta evidence (I-09).

## Overview

The copilot already validates its own output deterministically and never lets the model decide legality. The player cannot see that. This spec makes the check visible: every claim in a suggestion is marked as **verified against card data** or as **model reasoning**, and the validator's verdict is shown rather than silently applied.

## What the market does

Conversational Commander building is no longer a gap. Six products sell it, several free. Read on 2026-11-08 from each product's own pages:

| Product           | Validation                                                                                                                                 | Explanation                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **ManaTap**       | States deterministic legality and colour-identity validation; a Deck Checker scores legality, curve, ramp, draw, removal, threats, synergy | Chat and an iterative workshop                                                      |
| **Farseek**       | **States no deterministic legality validation**; performs live Scryfall lookups before each recommendation                                 | Argues why a card fits, reading the whole list                                      |
| **DeckCheck**     | DTI, PowerTune, ManaTune, DeckTrim; its support page documents that **AI results vary between runs**                                       | Deckhand chat                                                                       |
| **MTG Master**    | States it enforces legal commander, colour identity and singleton                                                                          | Bracket and collection-aware generation                                             |
| **ManaForge**     | Re-validates saved decks against live ban lists                                                                                            | Build-from-stock, commander swaps                                                   |
| **CommanderSalt** | —                                                                                                                                          | A May 2026 community thread calls its report detailed but prone to overrating decks |

**The pattern.** Products either validate **or** explain. ManaTap validates and scores but does not publish which claims were checked. Farseek explains persuasively and does not claim validation at all. DeckCheck openly documents that its output is non-deterministic.

**The opening.** Do both, and say which is which. A suggestion where "this is legal in your colour identity" is a checked fact and "this smooths your turn-three" is model reasoning is a different product from one where both arrive in the same sentence at the same confidence. The validator already exists; it is simply invisible.

This is also the cheapest differentiator on the roadmap: it is a presentation change over machinery that already passes its tests.

## Current state in this codebase

Already shipped, per the roadmap:

- Claude and OpenAI providers, server-side keys, rate limiting, prompt-injection protections.
- A **deterministic post-generation validator**; the LLM never decides legality.
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

## Open questions

- Does showing rejected suggestions undermine confidence, or build it? The argument for showing them is that the product's whole claim is that the check is real — and an invisible check is indistinguishable from no check. Worth watching once it ships.
- Should the verdict be exportable with the deck, so a player can show their pod that the list was validated? That edges into I-15's Rule 0 sheet and may belong there instead.
