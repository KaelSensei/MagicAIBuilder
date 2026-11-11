# Spec: Decks Buildable From A Collection (I-16)

> **Initiative:** [I-16 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Depends on:** I-06 printing-level ownership. Do not rank lists while cost still depends on a printing the model cannot name.

## Overview

Today the product answers "what does this deck cost me?". This initiative answers the reverse: "what can I build with what I own?" — ranked by coverage, honest about what is missing, and without touching ownership or the open deck.

## What the market does

This is the most contested space of the eight initiatives. Four products already answer the question.

| Product                           | What it does                                                                                                                                 | Price                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **SuperBrew** (MTGGoldfish)       | Finds decks to build from your collection                                                                                                    | Premium only, $6/month |
| **DeckFinder** (deck-finder.com)  | Collection to deck coverage for Commander, constructed formats and Arena; shows which decks you are closest to finishing and what is missing | —                      |
| **ManaBuilder** (manabuilder.com) | Upload a collection, AI generates a complete legal list from owned cards                                                                     | —                      |
| **MTG Agents**                    | An Insights tab with "Which decks can I build?" and "Missing for a deck" panels                                                              | —                      |
| **ManaForge**                     | Build-from-stock generation from paper or Arena collections, including wildcard awareness                                                    | from ~EUR 9.99/month   |

**What none of them states.** Three things, each of which the product can already do or nearly do:

1. **Free copies.** No competitor states that a copy already committed to another of your decks is excluded from a candidate list. A player with one Sol Ring and six decks is told six times that they own it.
2. **Printing-level cost.** Coverage computed on Oracle identity makes a cheap and an expensive printing interchangeable. The product's I-06 model distinguishes them.
3. **Provenance of the candidate.** Where did the suggested list come from — a community deck, a precon, a generated list? Only a sourced candidate can be judged.

Rank the initiative on those three, not on coverage percentage, which is table stakes.

## Current state in this codebase

- `src/lib/collection/acquisition-plan.ts` — aggregates required copies across owned decks and subtracts collection quantities. This is the one-deck direction.
- `src/lib/collection/acquisition-intent.ts`, `acquisition-csv.ts`, `printing-csv.ts` — buy-now/buy-later state and exports.
- `src/lib/deck/bracket.ts`, colour-identity and legality validation — reusable for candidate legality.
- **Missing:** any reverse index from a collection to candidate lists, and any notion of a copy being committed to a deck.

## Functional requirements

### 1. Ranking

1.1 Given a collection, return candidate commanders or lists ranked by the share of the candidate the collection already covers.
1.2 Coverage counts **copies**, not distinct rows — four basics owned once is not four cards.
1.3 Ranking never mutates the collection, a deck, or acquisition state.
1.4 The ranking request is bounded and paginated; a 20 000-card collection must not produce an unbounded scan.

### 2. Two identities, used for two different jobs

2.1 **Oracle identity** decides colour identity, legality and singleton — a card is the card, whatever the printing.
2.2 **Printing identity** decides price and ownership — the cost of what is missing depends on which printing is owned or needed.
2.3 A candidate whose missing cards have no known price shows those rows separately, never folded into a subtotal of zero.

### 3. Free-cards mode

3.1 A mode treats copies already allocated to the player's other decks as unavailable.
3.2 The mode is an explicit toggle with its effect stated: "excludes copies used in your other decks".
3.3 Switching the mode re-ranks without changing any stored data.

### 4. Provenance

4.1 Every candidate shows where it came from: a public deck, a precon catalogue entry, or a generated skeleton.
4.2 A generated candidate is labelled as generated and is never ranked above a sourced list at equal coverage.

## Data and API

- `GET /api/collection/buildable?mode=all|free&cursor=` → ranked candidates with `{ source, coverage: { owned, total }, missing: { count, knownPriceSubtotal, unpricedCount } }`.
- Read-only. The route must be incapable of writing: no ownership, deck or intent mutation in its code path.
- A commitment index (printing → decks using it) is required for free-cards mode. Derive it from existing deck rows; do not introduce a second source of truth for ownership.
- Added 2026-11-11 ([I-76](i76-complete-this-deck-from-my-collection.md)): copies in a deck's main and command zones commit a card; Considering and sideboard copies do not. The index reads deck rows and collection rows, as `GET /api/collection/usage` already does, so it needs no other slice.

## Non-goals

- Generating a full 100-card list from the collection. That is I-02 with a collection constraint, not this initiative.
  - Noted 2026-11-11: completing an existing partial deck slot by slot is [I-76](i76-complete-this-deck-from-my-collection.md) and is not this non-goal; generating a list from nothing stays I-02.
- Arena wildcard optimisation. Explicitly out, per the roadmap's non-goals.
- Buying. The acquisition plan in I-06 owns that, and this initiative hands off to it.
- Ranking against Oracle identity alone — blocked until I-06's printing-level ownership lands.

## Testing strategy

- **Solitary:** coverage arithmetic over quantities, including the four-basics case and the duplicate-printing case.
- **Boundary:** free-cards mode with one copy shared by three decks returns the copy as available in none of them but leaves ownership untouched.
- **Contract:** the buildable route, called with every mode, produces zero writes — asserted against the Prisma client, not by inspection.
- **Performance:** a synthetic 20 000-card collection returns the first page within the route's deadline.

## Delivery slices

| #   | Slice                                                                      | Depends on |
| --- | -------------------------------------------------------------------------- | ---------- |
| 0   | **I-06 printing-level ownership** — blocking, not part of this initiative  | —          |
| 1   | Coverage computation over a fixed candidate corpus, Oracle legality, no UI | 0          |
| 2   | Read-only ranked route with pagination and unpriced disclosure             | 1          |
| 3   | Collection-page surface showing rank, coverage and missing cost            | 2          |
| 4   | Commitment index from deck and collection rows (re-pointed 2026-11-11)     | —          |
| 5   | Provenance labels and the generated-candidate rule                         | 3          |
| 6   | Owned copies shown as free or committed in search and on deck rows         | 4          |
| 7   | Free-cards ranking mode (moved from slice 4 on 2026-11-11)                 | 2, 4       |

Slice 0 is the whole risk of this initiative. Slices 4 and 6 need only deck and collection rows, so they may go ahead of slice 0; slice 6 is the roadmap's scope item, added to this table on 2026-11-11 to keep the numbering. Validate demand before starting slice 1: the roadmap already marks this effort as medium-to-large.

## Open questions

- Where does the candidate corpus come from? Public community decks are free but uneven; precons are dated and trustworthy but few. Starting with precons would make this initiative share its catalogue with I-17.
- Does coverage weight cards by role? A collection covering 95 % of a list but missing its commander covers nothing useful. A hard floor on the command zone is probably required before any percentage is shown.
