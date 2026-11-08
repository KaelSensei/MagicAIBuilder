# Spec: Learning While Building (I-27)

> **Initiative:** [I-27 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Owns:** authored explanations attached to warnings. **Does not own:** the warnings themselves, which stay in I-03.

## Overview

The product tells a new player their deck breaks colour identity. It does not tell them what colour identity _is_. This initiative attaches a short, authored, sourced explanation to every warning class, reachable in one action, without leaving the deck.

## What the market does

The beginner audience is the largest in Commander and the worst served by tooling. The sweep found two separate worlds that never meet:

- **Tools assume the vocabulary.** EDHREC, Moxfield, Archidekt, the bracket calculators and every AI builder present inclusion rates, Lift, brackets and salt to someone presumed to already know what they mean. DeckCheck's DTI and PowerTune are proprietary scales explained in a support page, not at the point of use.
- **Teaching lives in media.** Tolarian Community College and Commanders Quarters built large audiences explaining this in video; the competitive-landscape document already identifies them as the beginner-influence channel. Written guidance lives in articles on Draftsim, RateMyDecks and PreconForge.

**The gap is the join, again.** Nobody explains the rule _at the moment the rule fires_. A player who has just been told their deck is illegal is the most motivated learner in Magic, and every tool sends them to a search engine.

This product is unusually well placed, and not because of ambition: the assets already exist.

## Current state in this codebase

- `.agents/skills/mtg-rules` and `.agents/skills/mtg-learn` — rules and learning skills already in the repository.
- `docs/rules/` — the comprehensive rules reference, with its dated version.
- I-03 already ships: explanations and next actions for legality warnings, the rule or calculation behind a legality warning shown on demand, and hard errors separated from strategic suggestions.
- `docs/product/user-guide.md` exists.

So I-03 already explains **what the product computed**. This initiative explains **the rule of the game behind it** — a different question, and the one a beginner is actually asking.

## Functional requirements

1. **One explanation per warning class**, not per card: colour identity, singleton, format legality, banlist, Game Changers, companion rules, bracket inputs, deck size.
2. **One action away.** Reachable from the warning itself, inline, without navigation that loses the deck state.
3. **Authored and deterministic.** Written by a person, stored as content, reviewed. **The model never generates rules text** — this is the same boundary I-02 draws around legality, applied to teaching.
4. **Sourced and versioned.** Where an explanation quotes the comprehensive rules, it cites the rule number and the rules version it was written against.
5. **Never a gate.** No lesson blocks a build, no tutorial interrupts, nothing must be dismissed before continuing. The existing onboarding modal — which currently covers the landing page and breaks an e2e test — is the anti-pattern to avoid repeating.
6. **Both locales**, following I-11's rule: an explanation that is not reviewed in a locale is not shown in it.

## Non-goals

- A course, a curriculum, or progress tracking.
- Generating rules explanations with the LLM.
- Replacing the comprehensive rules reference. This links to it; it does not restate it.
- Teaching deckbuilding strategy. The rules are objective; strategy is the copilot's job and is labelled as reasoning.
- Any interruption of an experienced player's flow.

## Testing strategy

- **Coverage:** every warning class the product can raise has an explanation; a class without one fails the test. This is what stops the content drifting behind the code.
- **Determinism:** explanations come from stored content; no provider call occurs on this path.
- **Citation:** an explanation quoting a rule carries a rule number and a rules version.
- **Non-blocking:** with explanations present, every build flow completes without opening one.
- **Locale:** an unreviewed locale shows no explanation rather than an English one.

## Delivery slices

| #   | Slice                                                                                     | Depends on |
| --- | ----------------------------------------------------------------------------------------- | ---------- |
| 1   | Content model, with the coverage test over warning classes                                | —          |
| 2   | Authored explanations for the hard legality classes — colour identity, singleton, banlist | 1          |
| 3   | In-place reveal from the warning, non-blocking                                            | 2          |
| 4   | Rule citations with the rules version                                                     | 2          |
| 5   | Bracket and Game Changers explanations                                                    | 3          |
| 6   | French review and locale gating                                                           | 2          |

Slice 1 is deliberately first: a coverage test that fails when a new warning class ships without an explanation is what keeps this initiative from decaying into half-written help text.

## Open questions

- Who writes them? This is content work with a refresh cadence, and content without an owner dates — `design-system.md` is the cautionary example already in this repository. If nobody owns it, do not start it.
- Does the comprehensive rules version need to be surfaced to the player, or only recorded? Recording it is the minimum; surfacing it may be noise for the beginner this initiative is for.
- Is there an audience overlap with I-15's Rule 0 sheets? A player learning what "extra turns" means and a pod declaring it are the same vocabulary, and sharing the content would keep one definition rather than two.
