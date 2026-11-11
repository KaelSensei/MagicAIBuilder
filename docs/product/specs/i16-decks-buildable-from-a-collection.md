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

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can start from owned cards and see which commanders or lists those cards can build, including free copies and the cost of what is missing.

### Goals

- A collection produces a ranked, sourced view of buildable lists that shows free copies and unknown prices, without changing ownership.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-16-01

As a player starting from a box of cards, I want commanders ranked by what I already own, so that a copy committed to another deck is not treated as free.

#### US-16-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-16-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-16-01 Happy path

Given a signed-in player and the English locale
When oracle identity is used for colour and legality. Printing identity is used for price.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-16-02 Happy path

Given a signed-in player and the English locale
When a free-cards mode treats copies in other decks as unavailable.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-16-03 Happy path

Given a signed-in player and the English locale
When an unknown price is marked unknown, not zero.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-16-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-16-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-16-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in, because it reads the collection. No guest ranking. Flag off until the commitment index matches a hand-checked fixture.

#### AC-16-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-16-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-16-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The ranking does not change the open deck or the collection. Each candidate names where the list came from.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the commitment index and the collection. No write. Public decks, when used as candidates, go through I-75's query.

### Analytics and telemetry

`buildable_ranked {mode: all_owned or free_copies, unpriced: zero or some}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in, because it reads the collection. No guest ranking. Flag off until the commitment index matches a hand-checked fixture.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The candidate corpus is public decks first. A generated 100-card list from the collection stays out of scope.

### Sources

- https://moxfield.nolt.io/2554
- https://archidekt.com/forum/thread/15420664
- https://github.com/arkham-build/arkham.build/releases/tag/v3.5.0
- https://github.com/arkham-build/arkham.build/releases/tag/v4.1.0
- https://www.reddit.com/r/Moxfield/comments/1xl4te2/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-16: Decks Buildable From A Collection

**Spec:** [`specs/i16-decks-buildable-from-a-collection.md`](i16-decks-buildable-from-a-collection.md)

**Outcome:** a player can start from owned cards and see which commanders or lists those cards can build, including free copies and the cost of what is missing.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium to large
**Depends on:** I-06 printing-level ownership. Do not rank lists against oracle identity alone while cost still depends on the printing.

MTGGoldfish SuperBrew and Mana For Cards Discover are the references. This initiative ranks candidates from the collection. I-06 still reconciles a deck the player has already chosen. Validate demand before a large build.

### Scope

- [ ] Rank candidate lists or commanders by how much of the collection they cover.
- [ ] Use Oracle identity for color identity and legality, and printing identity for price.
- [ ] Offer a free-cards mode that treats copies already allocated to other decks as unavailable.
- [ ] Show where each candidate list came from, and mark unknown prices on their own.
- [ ] Leave collection ownership and the open deck unchanged while ranking.
- [ ] Show owned copies as free or committed, such as "1 of 3 free, 2 in other decks", in card search and on the deck's rows, reading slice 4's commitment index (slice 6; I-37 slice 17 places the search marker). The index needs only deck rows, as `GET /api/collection/usage` already reads them, so slice 6 may go ahead of slice 0. A Moxfield feedback request asks for "1 of 3 available (2 in other decks)" ([nolt 2554](https://moxfield.nolt.io/2554), search summary, undated), and Archidekt staff called an in-use banner hard to build ([thread 15420664](https://archidekt.com/forum/thread/15420664), about 14 months before 2026-11-10).
- [ ] A per-deck card pool, shown as a tag on the deck: owned only, free copies only, my collection on a date, or printed up to a set. Search, [I-76](i76-complete-this-deck-from-my-collection.md)'s completion and I-02's suggestions respect it, extending the owner-decided "Collection only" toggle. arkham.build's deck "environment" restricts search and validation ([v3.5.0](https://github.com/arkham-build/arkham.build/releases/tag/v3.5.0), 2025-08-22; [v4.1.0](https://github.com/arkham-build/arkham.build/releases/tag/v4.1.0), 2026-08-26). Added 2026-11-11.
- [ ] Answer open question 1 (the candidate corpus) with "public decks first, through I-75's query contract": players ask for public decks sorted by what they own ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1xl4te2/), 2026-11-01). Added 2026-11-11.
- [ ] Neighbour changes from [I-76](i76-complete-this-deck-from-my-collection.md), 2026-11-11: spec slice 4's commitment index needs nothing, since it reads deck rows and collection rows as `GET /api/collection/usage` already does; the free-cards ranking moves to a new slice 7 (after slices 2 and 4); copies in the main and command zones commit, Considering and sideboard copies do not. The non-goal "Generating a full 100-card list from the collection" stands as written: I-76 fills an existing partial deck slot by slot, which is not that non-goal.

**Twelfth pass, 2026-11-11:** a reprint of a card the player owns is [I-84](i84-a-reprint-watch-for-cards-you-own.md), not a candidate list. A Cardsphere file is [I-90](i90-a-cardsphere-file-you-upload-yourself.md). Neither ranks commanders.

### Enrichment (2026-11-11)

**User story.** As a player starting from a box of cards, I want commanders ranked by what I already own, so that a copy committed to another deck is not treated as free.

**Acceptance.**
- Oracle identity is used for colour and legality. Printing identity is used for price.
- A free-cards mode treats copies in other decks as unavailable.
- An unknown price is marked unknown, not zero.

**UX.** The ranking does not change the open deck or the collection. Each candidate names where the list came from.

**Data and API.** Reads the commitment index and the collection. No write. Public decks, when used as candidates, go through I-75's query.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `buildable_ranked {mode: all_owned or free_copies, unpriced: zero or some}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in, because it reads the collection. No guest ranking. Flag off until the commitment index matches a hand-checked fixture.

**Open questions.** The candidate corpus is public decks first. A generated 100-card list from the collection stays out of scope.

### Definition of done

A collection produces a ranked, sourced view of buildable lists that shows free copies and unknown prices, without changing ownership.

---

