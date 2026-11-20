# I-112: Singles Or Packs: The Chance A Booster Holds What This Deck Lacks

> **Initiative:** I-112, proposed for the [roadmap](../roadmap.md) · **Status:** Blocked on D-106 — proposed 2026-11-20 · **Priority:** Later; nothing starts before the owner answers [D-106](../owner-decisions.md#product-scope-and-non-goals) and the lawyer answers [L-54](../legal-questions.md#l-54-booster-weights-redistributed-from-an-unlicensed-upstream) · **Paid:** never, and no affiliate link to sealed product · **Written 2026-11-20**
> **Placement:** this file re-opens a seventeenth-pass rejection ("matching decks with boosters … a collector's job outside Commander deckbuilding") with new evidence, and asks to reverse one line of [I-17](i17-precon-path-and-tiered-upgrades.md): "Products with random contents, such as boosters, stay out". It starts from a deck's missing cards ([I-06](i06-collection-and-purchase-planning.md)'s acquisition plan), which makes it a purchase decision about a deck, not a collector's ledger. I-17 keeps the fixed-content counterpart (slice 8, the products that hold missing cards).
> **Research:** one dated note of 2026-11-20 (angle R2), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Figures marked "computed" were derived by the researcher from MTGJSON 5.3.0+20261120 on 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the per-pack chance that a random-content product holds at least one of a deck's missing cards, the expected packs to see a card, "where this printing comes from" for random products, the panel's wording rules, and the "odds not published" state. **Does not own:** booster data ingestion ([I-67](i67-one-card-data-pipeline.md) slice 13); fixed-content products ([I-17](i17-precon-path-and-tiered-upgrades.md) slice 8); the missing list ([I-06](i06-collection-and-purchase-planning.md)); prices ([I-96](i96-two-labelled-prices-and-no-conversion.md), [I-32](i32-seller-handoff-and-affiliate-carts.md)); the price wording deny-list ([I-59](i59-prices-over-time-and-alerts.md) 8.4).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-17       | A dated line: the random-content exclusion is pending D-106; if D-106 says yes, the chance a pack holds a missing card is I-112's, and I-17 keeps fixed-content products and the single-precon cost line. |
| I-59       | I-59 8.4's deny-list gains "EV", "expected value", "worth opening", "chase" and "profit" for I-112's strings (the test is I-112 slice 4's).                                                               |
| I-67       | Slice 13's MTGJSON ingest carries booster configurations and sheets, versioned, once D-106 and L-54 allow.                                                                                                |

## Overview

Players asked for this. r/EDH "I made a website to match Decks with Boosters" drew 300 points and 35 comments on 2025-03-09; its top comment, at 141 points: "you should add a feature that show %chance of finding a card and how many packs youd need to open to probably find it" [1]. A reply at 50 points warned that "That would be really tough since each card has a different print run" [1]. That tool, `deckbooster.online`, did not answer on 2026-11-20.

Wizards publishes slot rates. "Collecting Magic: The Gathering | Star Trek" (2026-10-20) gives per-slot percentages for Play and Collector Boosters ("A rare (80.1%) or mythic rare (12.4%) card from the main set") and MSRPs (Play Booster $6.99, Collector Booster $37.99) [2]. Per-card weights exist as open data: MTGJSON's booster sheets give "cards … where the key is the card uuid and value is its weight" [3], read by MTGJSON from `taw/magic-sealed-data`, a repository that declares no licence; the weights are community-derived, not Wizards' figures [4].

Computed examples, per pack and weighted over configurations (each sheet treated as independent draws, an approximation): Jeweled Lotus, any printing, is 0.89% per Commander Masters Draft Booster, 1.06% per Set Booster and 3.30% per Collector Booster; Scryfall lists its cheapest printing at 37.18 USD [4]. In a Mystery Booster Commander pack, one named new commander is one in 60; Scryfall marks that printing `booster: false` while MTGJSON puts it on the `newCommander` sheet, so the sources disagree and the panel must name its source [4].

Competitors stop at the set: Grimoria's "Booster Pull Rates" invites players to "Decide whether to buy singles or sealed packs" per set [5]; MTGStocks and MTGGoldfish show a set's expected value (search summaries) [5]. None found starts from a deck's missing cards.

This initiative answers "should I crack packs for this deck?" honestly: the single's listed price first, then "about 1 in 94 Set Boosters", with the source and its version on every figure. Most players will read that and buy the single.

**Why a new initiative.** No file owns it: I-17 keeps random contents out; a grep for "pull rate", "drop rate", "booster odds", "pack odds" and "per pack" across specs and the roadmap finds nothing. **Why blocked.** It reverses a written line and a rejection, could read as a nudge to buy packs, rests on community estimates, and its upstream data has no declared licence.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source                 | What it does or says                                                                                           | Source |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| **r/EDH**                         | A deck-to-booster tool at 300 points; the top comment (141) asks for the chance per pack and the packs needed  | [1]    |
| **Wizards, Collecting Star Trek** | Per-slot percentages and MSRPs; borderless Star Trek Commander cards "can only be found in Collector Boosters" | [2]    |
| **MTGJSON**                       | Booster configurations with weights and per-card sheet weights, from an upstream with no declared licence      | [3][4] |
| **Grimoria**                      | Per-set "Booster Pull Rates" from Wizards' press releases; "Calculate expected value"                          | [5]    |
| **MTGStocks, MTGGoldfish**        | A set's expected value (search summaries; both refused tools)                                                  | [5]    |

**The gap.** The per-set pages answer what a box is worth. Nothing starts from a deck's missing cards and puts the single's price first.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **The precon catalogue** (I-17 slice 1, #1618) is `src/lib/precon/catalogue.ts`: dated precon versions at printing level; it does not price the list.
- **No booster data** is ingested; I-67 slice 13 plans MTGJSON deck lists and sealed contents only.
- **A deck row's price** is Scryfall's undated USD (I-59).

**Owning context:** `pricing` for the panel's read model; the odds are a pure function in `card-data` over versioned booster data.

## Functional requirements

### 1. Principles

1.1 The single's listed price is always the first line, with I-96's two labelled prices.
1.2 Every figure carries its data source, version and date. Wizards' own slot percentages are shown where an article publishes them; MTGJSON's per-card weights are labelled as community estimates.
1.3 No money figure for a pack or a box, no "worth it", no buy verb and no link to sealed product.

### 2. The odds

2.1 For each random-content product whose booster sheets hold a printing of a missing card: the chance one pack holds at least one of the deck's missing cards, and the expected packs to see each card.
2.2 A product with no booster configuration reads "odds not published" and shows no number.
2.3 A printing found only in fixed-content products (a precon) is listed with I-17 slice 8's fixed products and never under packs.

### 3. Free and paid

| Part      | Free | Paid candidate | Why                                                                                   |
| --------- | ---- | -------------- | ------------------------------------------------------------------------------------- |
| The panel | Yes  | —              | Consumer information sold or monetised through pack sales would contradict its reason |

## Data model / API

```
BoosterConfig   setCode, kind: draft | set | collector | play, configurations[]{weight, sheets{sheet: count}}, source, version, readAt
BoosterSheet    setCode, kind, sheet, cards{scryfallId: weight}
PackOdds        product {setCode, kind}, anyMissing: probability, perCard[]{oracleId, perPack, expectedPacks}, source, version
```

- `packOdds(config, sheets, printings)` is pure; a fixture is cross-checked against Wizards' Star Trek slot percentages.
- `GET /api/decks/[id]/singles-or-packs` reads I-06's missing list, I-96's prices and the versioned booster data.

## Non-goals

- A box's expected value in money, "open or keep sealed", "chase" language or a profit figure.
- A pack opener or simulator (the draft non-goal).
- A link to buy sealed product, or a sealed price (no licensed source; I-32).
- Print-run or rarity speculation beyond the data.
- Products without booster data.

## Testing strategy

- **Odds (solitary):** the Jeweled Lotus fixture yields about 1.06% per CMM Set Booster and "about 1 in 94"; a product with no configuration yields "odds not published".
- **Fixed versus random (solitary):** a printing found only in a precon is never listed under packs.
- **Wording (CI):** the English and French catalogues contain none of "EV", "expected value", "worth opening", "chase" or "profit".
- **Red first:** slice 1's first Red: `packOdds` on the Star Trek fixture returns 12.4% for a mythic rare in the slot Wizards publishes.

## Delivery slices

| #   | Slice                                                                                                                                      | Depends on           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 0   | Owner: D-106 (build at all; reverse I-17's random-content line and the seventeenth-pass reject; the wording list); lawyer: L-54            | — (owner, legal)     |
| 1   | Ingest MTGJSON booster configurations with I-67 slice 13, versioned; pure `packOdds`; a fixture cross-checked against Wizards' percentages | 0; I-67 slice 13     |
| 2   | "Where this printing comes from" for random products, next to I-17 slice 8                                                                 | 1; I-17 slice 8      |
| 3   | The deck panel: missing cards from I-06's plan, singles first (I-96), then per-product chances and expected packs, with source and date    | 2; I-06's plan; I-96 |
| 4   | The wording deny-list in CI and the "odds not published" state                                                                             | 3; I-59 slice 2      |

No slice can start now: every slice waits for D-106 and L-54.

## Open questions

1. **D-106: build it at all?** Recommended: yes, free, singles first, no money figure and no sealed purchase link.
2. **Expected packs.** Is "expected packs" too close to encouragement? The alternative is the per-pack chance only.
3. **L-54 (for the lawyer; research, not legal advice):** MTGJSON is MIT-licensed, but its booster weights come from a repository with no declared licence. May the product compute and show odds from them?
4. **Two sources.** Show Wizards' own slot percentages where an article publishes them, and MTGJSON's per-card weights only where Wizards is silent? Recommended: yes, each labelled.

## Sources

Read on 2026-11-20 unless stated otherwise.

1. r/EDH, "I made a website to match Decks with Boosters", 2025-03-09, 300 points, 35 comments (Arctic Shift). <https://www.reddit.com/r/EDH/comments/1j7cnol/>
2. Wizards of the Coast, "Collecting Magic: The Gathering | Star Trek", 2026-10-20; "mythic rare (12.4%)" and "Collector Booster: $37.99" verified on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://magic.wizards.com/en/news/feature/collecting-star-trek>
3. MTGJSON, Booster Sheet data model. <https://mtgjson.com/data-models/booster/booster-sheet/>
4. MTGJSON 5.3.0+20261120 set files (computed); `mtgjson5/providers/github/provider.py`; `taw/magic-sealed-data` (GitHub API `license: null`, last pushed 2026-11-18); Scryfall card prices read 2026-11-20.
5. Grimoria, "Booster Pull Rates", version 2.5.8 of 2026-11-20. <https://grimoria.app/help/discovery/pull-rates>; MTGStocks and MTGGoldfish expected-value pages (search summaries).

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player whose deck lacks cards printed in a booster product (Commander Masters, Mystery Booster Commander Edition, a new set at a "buy a pack" Commander night) cannot see the chance a pack holds any of them next to what the singles cost. Per-set pull-rate pages and expected-value calculators answer a different question, what a box is worth [1][5].

### Goals

- For a deck's missing cards: each random product whose sheets hold a printing of them, the chance one pack holds at least one, and the expected packs to see each card, with source, version and date.
- The single's listed price first, always.
- Random products listed beside I-17's fixed products, so a deck-only printing is never shown as a pack pull.
- Wording that cannot read as a reason to buy packs.

### Non-goals

- A money expected value, "keep sealed", chase language; a pack opener; sealed prices or purchase links; speculation; products without data.

### Personas

The collector and budget player; the casual pod player at a store's "buy a pack" Commander night. See the roadmap persona table.

### User stories

#### US-112-01

As a budget player missing Jeweled Lotus, I want to see its single price next to the chance per Commander Masters pack, so that I do not spend more on packs than on the card.

#### US-112-02

As a player at a store whose Commander night includes a pack, I want to know which of tonight's products holds any card my deck lacks, so that my pack is not a blind pick.

#### US-112-03

As a player who reads the odds, I want the source and its version on every figure, so that I know they are estimates and not Wizards' print run.

### Acceptance criteria

#### AC-112-01 Happy path

Given a deck missing Jeweled Lotus
When the player opens "Singles or packs"
Then the first line is the single's listed price with its source and date, the next reads "about 1 in 94 Commander Masters Set Boosters", and the panel names MTGJSON's version and shows no money total

#### AC-112-02 Error and failure

Given the booster data cannot be read
When the panel opens
Then it shows the singles' prices and "pack odds not available right now" with a retry, and no stale figure without its date

#### AC-112-03 No published odds

Given a product with no booster configuration (the Star Trek Commander set)
When the panel renders
Then that product reads "odds not published" and shows no number

#### AC-112-04 Guest and signed-in

Given the rollout
When a guest opens a public deck's panel and a signed-in owner opens their own
Then the guest sees the odds for the deck's cards without ownership, and the owner sees them for the cards they lack

#### AC-112-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-112-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player reads the panel without a pointer
Then it is a table with headers, each chance reads as "about 1 in N" in words as well as a percentage, and no meaning rests on colour

#### AC-112-07 Fixed versus random

Given a card printed only inside a Commander precon
When the panel lists products
Then it appears under fixed-content products (I-17 slice 8) and never under packs

#### AC-112-08 Wording

Given the English and French message catalogues
When the deny-list check runs
Then no string contains "EV", "expected value", "worth opening", "chase" or "profit"

#### AC-112-09 Disagreeing sources

Given Scryfall and MTGJSON disagree on whether a printing is in boosters
When the panel shows that printing
Then it states which source it used

### UX flow and states

From the acquisition plan, "Singles or packs" opens a panel: the single's prices first, then a table of products with "about 1 in N" per pack, and a sources line.

- Empty: "Nothing in this deck is missing."
- Loading: a busy state that keeps the table still.
- Error: singles shown, odds "not available right now".
- Partial: "odds not published" per product without data.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`singles_or_packs_viewed {missingCards, productsWithOdds}`. Reserved for I-39's store. Counts and enums only.

### Rollout and feature flags

Nothing ships before D-106 and L-54. Then behind an I-69 switch, `pricing.packOdds`, off by default; the switch also hides it at once if a source objects.

### Dependencies

[D-106](../owner-decisions.md#product-scope-and-non-goals); [L-54](../legal-questions.md#l-54-booster-weights-redistributed-from-an-unlicensed-upstream); [I-67](i67-one-card-data-pipeline.md) slice 13; [I-17](i17-precon-path-and-tiered-upgrades.md) slice 8; [I-06](i06-collection-and-purchase-planning.md); [I-96](i96-two-labelled-prices-and-no-conversion.md); [I-59](i59-prices-over-time-and-alerts.md) 8.4. [I-41](i41-store-commander-nights.md) (a night's product) is optional.

### Risks and mitigations

- **A nudge to buy packs.** Mitigation: singles first, no money total, a deny-list in CI, no sealed link.
- **Community estimates read as print runs.** Mitigation: source, version and date on every figure; Wizards' percentages preferred where published.
- **Unclear upstream licence.** Mitigation: L-54 before slice 1, and an I-69 switch.

### Kill criteria

None. This initiative is not in the Now band. If D-106 says no, the file is withdrawn and I-17's line stands.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-112-101 Several missing cards

As a player missing three cards from Commander Masters, I want the chance a pack holds any one of them, so that I see the combined figure and each card's.

#### AC-112-100 Happy path

Given a deck missing Jeweled Lotus, Smothering Tithe and Fierce Guardianship
When the panel opens
Then it shows the chance one Set Booster holds at least one of them (about 4.01%, computed) and each card's own line

#### AC-112-101 Failure

Given a new data version changes a weight
When the panel is opened again
Then the figures show the new version and date, and no old figure is shown without its version

#### AC-112-102 Edge

Given a card whose only booster printing is in a Collector Booster
When the panel renders
Then only the Collector Booster line shows it, with its own chance, and the single's price stays first

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "Nothing in this deck is missing."                                                                      |
| Loading          | A busy state that keeps the table still.                                                                |
| Error            | Singles shown; "pack odds not available right now".                                                     |
| No data          | "Odds not published" per product.                                                                       |
| Guest            | Odds for a public deck's cards.                                                                         |
| Signed-in        | Odds for the cards the owner lacks.                                                                     |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | The table and its source links are reachable without a pointer.                                         |
| Screen reader    | "About 1 in N" is read as words.                                                                        |
| Colour           | No colour carries meaning.                                                                              |

### Alternate paths

- The player opens the panel from a store night's product (I-41). The table is filtered to that product.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-112 is a link here. It re-opens the seventeenth pass's rejection of "matching decks with boosters" with new evidence, and is blocked until the owner and the lawyer answer.

## I-112: Singles Or Packs: The Chance A Booster Holds What This Deck Lacks

**Outcome:** for a deck's missing cards, the player sees the single's listed price first, then the chance a pack of each random product holds them, with the source and version of every figure, and no money total.

**Status:** Blocked on D-106
**Priority:** Later, after D-106 and L-54. Never paid.
**Impact / effort:** Medium / medium
**Risk:** High. A nudge to buy packs, community estimates and an unlicensed upstream.
**Depends on:** D-106; L-54; I-67 slice 13; I-17 slice 8; I-06; I-96; I-59 slice 2.

A 300-point r/EDH thread asked for "%chance of finding a card"; Wizards publishes slot rates and MTGJSON per-card weights; competitors stop at a set's value.

### Scope

- [ ] Booster data and `packOdds` (slice 1); "where this printing comes from" (slice 2).
- [ ] The deck panel, singles first (slice 3); the deny-list and "odds not published" (slice 4).

### Engineering enablers

- Versioned booster data; `packOdds` pure, cross-checked against Wizards' published percentages.

**Paid-tier angle:** none, and no sealed affiliate link.

### Enrichment (2026-11-20)

**User story.** As a budget player missing a card, I want its price next to the chance per pack, so that I do not overspend on packs.

**Acceptance.** Singles first; "about 1 in N" with source and version; "odds not published"; fixed products never shown as packs; the deny-list holds.

**UX.** A panel from the acquisition plan.

**Data and API.** `BoosterConfig`, `BoosterSheet`, `PackOdds`; one read route.

**i18n and access.** English and French; chances in words.

**Telemetry.** `singles_or_packs_viewed`. Reserved for I-39.

**Rollout.** `pricing.packOdds`, after D-106 and L-54.

**Open questions.** D-106; expected packs; L-54; two sources.

### Definition of done

After D-106 and L-54 allow it, a player missing Jeweled Lotus sees its single price and date first, then "about 1 in 94 Commander Masters Set Boosters" with MTGJSON's version, sees "odds not published" for a product without data, and finds no money total or buy wording anywhere.

---
