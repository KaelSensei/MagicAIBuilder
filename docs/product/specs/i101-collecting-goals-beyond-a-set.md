# I-101: Collecting Goals Beyond A Set

> **Initiative:** I-101, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-12 · **Priority:** Later (2027 horizon), behind [I-26](i26-collections-arriving-from-elsewhere.md)'s import, [I-67](i67-one-card-data-pipeline.md)'s printing tables and a demand gate proposed for [D-98](../owner-decisions.md#product-scope-and-non-goals); slice 1 can be built by hand once I-67 slice 2 lands, and nothing past it starts before gate C is met and the owner decides · **Paid:** never · **Written 2026-11-12**
> **Placement:** a collector's object over the collection that [I-06](i06-collection-and-purchase-planning.md) owns. Every collection tool read tracks the completion of a set; none lets a collector name the thing they are actually collecting when it is not a set: a cycle, every printing of one card, an artist, a list of their own. The goal reads owned rows, never changes them, and hands its missing cards to the wanted list ([I-56](i56-wishlists-friends-can-buy-from.md)) and the acquisition plan (I-06). It is not a set gallery ([D-82](../owner-decisions.md#product-scope-and-non-goals) stands) and not a registry that ranks collectors.
> **Research:** one dated note of 2026-11-12, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public API on 2026-11-12. Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the collecting goal (its kinds, its counting rule and its scope), `goalProgress`, the missing list, the goals page, the cost to complete, the printable checklist, suggested goals, progress over time, the read-only share link and the household view. **Does not own:** owned rows, proxies and the acquisition plan (I-06); import ([I-26](i26-collections-arriving-from-elsewhere.md)); sets, printings and prices as data (I-67 slices 2, 5 and 13); two labelled prices and no conversion ([I-96](i96-two-labelled-prices-and-no-conversion.md)); the wanted list (I-56); reprint lines ([I-84](i84-a-reprint-watch-for-cards-you-own.md)); value over time ([I-59](i59-prices-over-time-and-alerts.md)); condition and signed copies ([I-89](i89-the-condition-of-a-physical-copy.md)); storage ([I-43](i43-physical-collection-storage-and-pull-lists.md)); loans and the household ([I-51](i51-cards-lent-and-borrowed.md)); the precon catalogue ([I-17](i17-precon-path-and-tiered-upgrades.md)); the index policy ([I-34](i34-commander-data-reports.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-06       | Collection rows gain nothing for goals. The acquisition plan accepts a goal as a scope ("Plan this goal"), the way I-79 proposes a table set as a scope for I-43's lists.                       |
| I-26       | Nothing. A goal reads rows that import created. The ManaBox preset of I-26 slice 4 is the main source of the rows a collector's goal counts.                                                    |
| I-56       | "Add the missing cards to my wanted list" writes `WantedItem` rows with `source: goal` and the goal id, through I-56 slice 2's preview. I-56's blind gift reservations apply unchanged.         |
| I-67       | Slice 2's `CardSet` and `CardPrinting` are read for set and printing goals; slice 13's MTGJSON set files feed the "one of each Commander precon" product goal (slice 11). No new table in I-67. |
| I-84       | Reprint lines appear on a goal's missing printings (slice 5) with I-84's wording, which carries no buy verb.                                                                                    |
| I-59       | One dated progress row per goal per day joins I-59's daily cadence (slice 6); the goal's owned value is I-59's deck-value function over the goal's owned copies.                                |
| I-51       | The household view (slice 10) counts a goal across household copies and shows each copy's owner, under I-51's rule that a household never shows a purchase price.                               |
| I-34       | The share link's page is `noindex` and never a page kind of the index policy. No goal page is ever indexable; a public set page remains D-82's question, which this initiative does not reopen. |
| I-39       | Gate C reads a count of accounts by collection size (counts only, no event). `collecting_goal_created {kind}` and `collecting_goal_completed {kind}` are reserved event names.                  |

## Overview

Collectors collect things that are not sets. One finished "One of Every Printing of Lightning Bolt" after four years; another completed every regularly printed version of a card; others chase the ten fetch lands, every card by one artist, every Commander precon, or the three versions a modern set prints of each card [7][8][9]. The tools they use track one thing: a set's completion percentage. ManaBox's Collector mode "shows all the cards available in a set and its subsets (promos and alternate frames)" and sorts by "Percentage of completion" [1]; Pokémon trackers add a "master set" of every variant [4]; none read lets a collector name a goal that is not a set, and none says what completing it would cost from the cards the collector already owns.

This initiative adds one object: a collecting goal. A goal names what is collected (a set with or without its subsets, a named cycle, every printing of one card, an artist, a list the collector writes) and how a copy counts (one of each name, or every printing, foil and non-foil apart or together). The product computes progress from the collection's owned rows, lists what is missing, prices the missing cards in the collector's market with no buy verb, prints a checklist, and hands the missing list to the wanted list and the acquisition plan. It never ranks collectors and never publishes a set.

**Why a new initiative.** No initiative owns an authored container of cards to collect. I-06 owns rows and plans for decks; I-56 owns a wanted list, which is a goal's output, not a goal; I-84 watches reprints of owned cards; I-59 values what is owned. A goal is the thing a collector is working toward, which none of them names. **Why Later.** The product's collection is deck-centric, camera scanning is a non-goal, and most collectors' rows will arrive through I-26's import, which is itself Later. The demand found is real but thin in Magic and strong in adjacent hobbies, so the work waits for the product's own numbers (requirement 8).

## What the market does

All rows were read on 2026-11-12 unless dated otherwise.

| Product or source                              | What it does or says                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Source    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **ManaBox, Collector mode**                    | "By default the collector mode shows all the cards available in a set and its subsets (promos and alternate frames)." Grouping by card type, colour, rarity and set; sorts by "Total cards, Collected cards, and Percentage of completion"; "group all the cards with the same name in a single entry". Nothing for cycles, artists, all printings of one card or a goal the collector names                                                                         | [1]       |
| **ManaBox, import columns**                    | "Purchase price", "Purchase currency", "Misprint", "Altered", "Language", "Condition" and "Scryfall ID" are accepted on import: the fields a collector's rows carry when they arrive through I-26                                                                                                                                                                                                                                                                    | [2]       |
| **Moxfield; Archidekt**                        | Collection features beside deckbuilding (I-26). No set-completion view could be confirmed for either on 2026-11-12 (search summaries only). Archidekt's feature board, read on 2026-11-11, scores "prefer owned printings" at 367 points, "import into owned editions" at 217 and "non-English printings" at 140: players care which edition they own                                                                                                                | [3]       |
| **Pokémon trackers**                           | Pokex "tracks regular set completion and master set completion separately, including reverse holos, full arts, alternate arts, and secret rares"; TCG Collector offers set breakdowns and custom lists (search summaries; neither page was read in full). A "master set" is every card and every variant of a set: the counting rule this spec makes explicit                                                                                                        | [4]       |
| **PSA Set Registry**                           | Graded cards registered by certificate, one owner per certificate, sets ranked and a leaderboard app (search summaries). The ranking is what this initiative declines: a goal is private, and no collector is ranked against another                                                                                                                                                                                                                                 | [5]       |
| **Casual Planeswalker, most reprinted (2026)** | A list "sorted by number of unique set printings": Lightning Bolt "38 printings · 1993–2026", Sol Ring "69 printings · 1993–2026", Mountain 220. Scryfall's `unique:prints` returns 71 for Lightning Bolt and 140 for Sol Ring the same day (**computed**). Two honest counts, two definitions: a goal must say which one it uses                                                                                                                                    | [6]       |
| **Collectors, in their own words**             | mtg.wiki's collector page cites the r/magicTCG thread "After four years, it is finally over. Behold: One of Every Printing of Lightning Bolt" and threads on collecting Jace (search summary; the page answered 403). A r/magicTCG post of 2025-01-16: "This guy completed every single regularly printed…" (mirror; title truncated). A February 2026 comment: completing a set "is now very hard" because sets print three versions of each card (mirror snapshot) | [7][8][9] |
| **Scryfall**                                   | 1,067 sets in `/sets`; `is:fetchland` and `is:shockland` each return 10 cards (**computed**): the cycles Scryfall already names can be goal definitions with a source, and the others are curated data                                                                                                                                                                                                                                                               | [10]      |
| **This product**                               | `CollectionCard` rows are keyed by `scryfallId`, `foil` and `userId`, with `condition`, `acquiredAt` and an undated `price`; `completionRatio` in `src/lib/collection/shopping-list.ts` is a deck's coverage, not a collection's. No goal, set or cycle object exists                                                                                                                                                                                                | code      |

**The gap.** Set completion is table stakes in collection apps and absent here, which this initiative does not treat as a reason on its own: ManaBox owns scanning and mobile collection management, and the roadmap does not chase it. The gap this initiative fills is the goal that is not a set, with a stated counting rule, a cost to complete from owned cards first, and a hand-off to the lists the product already plans. Nothing read offers that for Magic.

## Current state in this codebase

Verified on `dev` at `db3d45fb` (#1404) on 2026-11-12:

- **Rows exist, goals do not.** `CollectionCard` (`prisma/schema.prisma`) holds `scryfallId`, `name`, `quantity`, `foil`, `condition`, `acquiredAt`, `price`, `imageUri` and `userId`, unique on `(scryfallId, foil, userId)`. No table names a set, a cycle, a goal or an artist. Grep finds "completion" only as a deck's `completionRatio`.
- **No set or printing table.** Printings come from Scryfall per request through `src/lib/scryfall/`; I-67 slice 2 plans `CardSet` and `CardPrinting`, and nothing on `dev` reads a bulk file. A goal over a set cannot be computed until those tables exist.
- **Import is export-oriented.** `src/lib/collection/parse.ts`, `printing-csv.ts` and `acquisition-csv.ts` write CSV; I-26 plans the importer and its ManaBox preset. A collector's rows mostly do not exist yet.
- **Wanted list and reprints are planned, not built.** The favorites routes answer 201 for data they discard (I-56 slice 0 retires them); I-84 has no code.
- **Prices are undated per row.** `CollectionCard.price` is the browser's value at add time; I-67 slice 5 and I-59 plan the dated series a cost to complete needs.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `collection` ("owned cards and quantities, acquisition intents, acquisition plans, shopping lists"). Code goes under `src/modules/collection/domain/goals/` as readonly types and pure functions ([ADR 0003](../../adr/0003-domain-as-readonly-data-and-pure-functions.md)), with a catalogue port to I-67's tables, the goals page under `src/modules/collection/ui/`, and the repository under `infrastructure/`.

## Functional requirements

### 1. The goal

1.1 A goal has a name (1–80 characters), a kind, a scope and a counting rule. Kinds, version 1: **set** (a set code, with or without its subsets), **cycle** (a named list from versioned data: fetch lands, shock lands, the Swords, the Titans, the Praetors, and others, each with its source), **every printing** (one Oracle identity), **artist** (one artist name as Scryfall spells it), **list** (card names or printings the collector pastes or picks). **Product** (one of each Commander precon) is slice 11, from I-17's catalogue.
1.2 The counting rule says what "collected" means: `oneOfEachName` (any printing of the name counts), `everyPrinting` (each printing counts on its own, by Scryfall id), and a finish option (`anyFinish`, or foil and non-foil as separate slots). A set goal says whether subsets, promos and alternate frames are in or out; the default is out, and the panel says that ManaBox's default is in [1].
1.3 A goal reads the collection's owned rows and never changes them. Proxies never count ([I-06](i06-collection-and-purchase-planning.md)'s proxy state). A lent copy still counts as owned and is marked "lent" ([I-51](i51-cards-lent-and-borrowed.md)). A copy committed to a deck counts: a goal is about owning, not about a free copy.
1.4 Goals are private. A collector may hold any number; no limit is sold or imposed, since limits on counts draw the one-star reviews the [product direction](roadmap-context.md#owner-ambition-and-business-model-2026-11-09) records.

### 2. Progress

2.1 `goalProgress(goal, ownedRows, catalogue)` is a pure function returning the total slots, the collected slots, the missing slots (each with its printing or name), the percentage, the counting rule and the catalogue version it was computed from.
2.2 Totals come from I-67's tables: `CardSet` and `CardPrinting` for sets and printings, the Oracle identity's printings for every-printing goals, the artist field for artist goals. A goal's total therefore changes when the catalogue gains a printing, and the page says so with the date: "71 printings as of 2026-11-12".
2.3 Two collectors can disagree on what "every printing" means [6]. The goal shows its rule beside its total, and offers the alternatives: paper only, digital included, promos and oversized included or not.
2.4 Order is fixed: by set release date, then collector number, then name. The same input gives the same progress byte for byte.

### 3. Cost to complete

3.1 For each missing slot, the lowest listed price among the printings that would fill it, in the collector's market, from I-67 slice 5's daily `CardPrice`, with the price's date. For `oneOfEachName`, the cheapest printing of the name. For `everyPrinting`, that printing alone.
3.2 Two labelled prices and no conversion, as [I-96](i96-two-labelled-prices-and-no-conversion.md) requires. A slot with no price shows "no estimate" and is left out of the total, which says how many slots it leaves out.
3.3 No verb about buying, selling or holding. The total is "Listed prices of the missing cards", never "cost to buy" or "worth", under [I-59 8.4](i59-prices-over-time-and-alerts.md#8-neutral-display)'s deny-list.

### 4. Hand-offs

4.1 **Wanted list:** "Add the missing cards to my wanted list" writes I-56's `WantedItem` rows through its preview, tagged with the goal, and skips what is already wanted.
4.2 **Acquisition plan:** "Plan this goal" opens I-06's plan scoped to the goal's missing printings, with owned copies of other printings shown when the rule is `oneOfEachName`.
4.3 **Reprint lines:** I-84's line on a missing printing when a newer paper printing exists, with I-84's wording.
4.4 **Checklist:** a printable page of the goal's slots (name, set, collector number, finish, a mark for collected), no image, with the footer I-86 uses (goal version, catalogue version, date).

### 5. Suggested goals

5.1 A deterministic list of sets the collection already covers above a threshold (starting value 40% of the set's main cards), each with its percentage, dismissable. No model, no popularity, no "trending set".
5.2 Suggestions never create a goal; the collector does.

### 6. Progress over time and sharing

6.1 One dated row per goal per day, written by I-59's daily job, with collected and total; a line over time on the goal page, labelled with the catalogue version at each point.
6.2 A goal may be shared by link: a random token of at least 128 bits, a `noindex` page, `robots.ts` disallowing its path, revocable on the next request. The page shows the name, the rule, the progress and, only when the owner ticks it, the missing list. It never shows prices, purchase prices, condition or storage.
6.3 No listing of goals, no public profile section, no ranking of collectors by completion, no badge. A collector who wants a leaderboard has PSA's [5]; this product does not build one.

### 7. The household

7.1 With I-51's household (slices 9 to 11), a goal may count copies owned by any household member, each slot naming the owner. Purchase prices are never shown in a household view, as I-51 requires.

### 8. Demand gate and the owner's decision

8.1 **Gate C, before slice 2** (a proposal for D-98). I-26 slice 4, the ManaBox preset, has shipped, and a one-off count shows at least 50 accounts holding 300 or more collection rows, or at least 10% of accounts with any collection row holding 300 or more. The count reads row counts only, no card, no name, no price.
8.2 A missed gate is recorded with its date under D-98, and slices 2 and later stay unpromoted; slice 1's pure functions and cycle data stay in the repository for the day the gate is met.

### 9. Free and paid

| Part                                                                         | Free | Paid candidate | Why                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------- | ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goals, progress, missing lists, listed prices, hand-offs, checklist, sharing | Yes  | —              | The collector's own rows and card data stay free ([I-30 1.1 and 1.4](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)); a limit on the number of goals is the kind of paywall that draws one-star reviews, so none is proposed |

## Data model / API

```
GoalKind         set{code, includeSubsets} | cycle{cycleId} | everyPrinting{oracleId} | artist{name} | list{entries[]} | product{productId}
CountingRule     identity: oneOfEachName | everyPrinting; finish: anyFinish | foilAndNonFoilApart; paperOnly: boolean
CycleDef         id, version, nameEn, nameFr, source (scryfall is: filter | curated with URL), oracleIds[]
GoalSlot         slotId, oracleId, printingId?, finish?, collected: boolean, ownedQuantity, lent: boolean, owner? (household)
GoalProgress     goalId, catalogueVersion, computedAt, total, collected, percent, missing: GoalSlot[], rule: CountingRule
MissingPrice     slotId, market, amountMinor?, currency, priceDate?, cheapestPrintingId?, status: priced | noEstimate
CollectingGoal   id, ownerId → User (Cascade), name, kind Json (GoalKind), rule Json (CountingRule), shareToken? @unique,
                 shareMissingList: boolean, createdAt, updatedAt
GoalProgressDay  goalId → CollectingGoal (Cascade), day (date), total, collected, catalogueVersion  @@unique([goalId, day])
```

- `goalProgress`, `missingPrices`, `suggestGoals` and the cycle definitions are pure in `src/modules/collection/domain/goals/`; `GoalKind` and `CountingRule` are discriminated unions with exhaustive `never` guards. The catalogue is a port, filled from I-67's tables.
- Routes: `GET|POST /api/collection/goals`; `GET|PATCH|DELETE /api/collection/goals/[id]`; `GET /api/collection/goals/[id]/progress`; `GET /api/collection/goals/[id]/prices?market=`; `POST /api/collection/goals/[id]/wanted`; `GET /share/goal/[token]`. All owner-only except the share page. Pages: `/collection/goals` and `/collection/goals/[id]`.

## Non-goals

- A public set page, a set gallery or a card database: [D-82](../owner-decisions.md#product-scope-and-non-goals) stands, and the [strategic boundaries](roadmap-context.md#strategic-boundaries) forbid a second Scryfall. A goal is a private view over the collector's own rows.
- A registry, a leaderboard, a rank or a badge for collectors. Progress is the collector's, shared by link if they choose, never listed.
- Camera scanning, barcode scanning of sealed product, or any way to populate the collection other than I-06's editing and I-26's import.
- A paid limit on goals, or a paid "cost to complete".
- Buying: no cart, no checkout, no price forecast. The hand-off is to I-56's list and I-06's plan, and I-32's seller handoff from there.
- Grading, slabs and condition goals: condition is I-89's field; a goal counts ownership.

## Testing strategy

- **Counting rules (solitary):** one name owned in two printings under `oneOfEachName` (one slot collected) and under `everyPrinting` (one of two collected); foil and non-foil apart; a proxy row never counts; a lent copy counts and is marked; subsets in and out; a digital-only printing excluded by `paperOnly`.
- **Cycles (solitary):** the fetch-land definition yields ten slots that match Scryfall's `is:fetchland` at the pinned catalogue version; an unknown cycle id fails to compile.
- **Every printing (solitary):** Lightning Bolt yields 71 slots at the catalogue version pinned in the fixture (Scryfall, 2026-11-12), and the test names the version so a catalogue change is a fixture update, not a failure.
- **Prices (solitary):** the cheapest printing per name; two labelled prices, no conversion; a slot without a price counts as "no estimate" and the total says how many it leaves out; the deny-list scan finds no buy verb.
- **Determinism:** two shuffled inputs give one progress byte for byte.
- **Routes (sociable):** owner-only writes; the share page shows the missing list only when ticked and never a price or a condition; revoking ends access on the next request; a schema test keeps goals out of every public and shared deck projection.
- **Gate metric:** a fixture of accounts and row counts gives the expected gate C result, with no card data read.
- **Accessibility and layout:** the goals page and the checklist have names and a keyboard path; collected and missing differ by a glyph and a word, not a colour; at 360 px the slot grid becomes a list.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: ten fetch-land slots, two owned, give `collected: 2, total: 10, percent: 20`.

## Delivery slices

| #   | Slice                                                                                                                   | Depends on                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 0   | Owner: build it at all, the gate C numbers and the first goal kinds (D-98); the one-off row-count by account            | — (owner)                                       |
| 1   | Goal kinds and counting rules as data; cycle definitions with sources; `goalProgress` over fixtures; the catalogue port | I-67 slice 2                                    |
| 2   | `CollectingGoal`, owner-only routes, the goals page with progress and the missing list                                  | 1; **Blocked** on gate C and D-98; I-26 slice 4 |
| 3   | Listed prices of the missing cards in the collector's market, cheapest printing per slot, "no estimate" rows            | 2; I-67 slice 5; I-96                           |
| 4   | Hand-offs: the wanted list through I-56's preview; the acquisition plan scoped to the goal                              | 2; I-56 slice 2; I-06's plan scope              |
| 5   | Reprint lines on missing printings                                                                                      | 2; I-84's reprint lines                         |
| 6   | Progress over time: `GoalProgressDay` on I-59's daily job; the goal's owned value                                       | 3; I-59 slice 3                                 |
| 7   | Printable checklist with the version footer, no image                                                                   | 2                                               |
| 8   | Suggested goals from the collection's coverage, deterministic, dismissable                                              | 2                                               |
| 9   | Share a goal by link: token, `noindex`, revoke, the optional missing list, no prices                                    | 2; I-08's share-token pattern                   |
| 10  | Household view: one goal across household copies, each slot naming the owner, no purchase price                         | 2; I-51 slices 9 to 11                          |
| 11  | Product goals: one of each Commander precon, from I-17's catalogue and I-67 slice 13                                    | 2; I-17 slice 1; I-67 slice 13                  |

Slice 1 is pure functions and data; a person may build it by hand once I-67 slice 2 ships, and it serves nothing until slice 2. Slice 2 carries the schema change and every route; slices 3 to 7 make a private goal useful on their own. Scheduled agents must not pick any slice before the owner records gate C as met and answers D-98, the roadmap's rule for I-79 applied here.

## Open questions

1. **D-98.** Build collecting goals at all; are 50 accounts with 300 or more rows, or 10% of collecting accounts, the right bar for gate C; which kinds ship first? Recommended: Later behind gate C; set, cycle and every-printing goals first; artist and list goals in the same slice since they add no table; products in slice 11.
2. **Counting defaults.** Does a set goal exclude subsets by default (this spec) or include them, as ManaBox does [1]? Does `everyPrinting` exclude digital printings by default? Recommended: subsets out, paper only, both shown as switches on the goal.
3. **Cycle data.** Who curates the cycle list, and how is a disputed membership handled (is a Battlebond land a "dual"; is a slow fetch a fetch land)? Recommended: Scryfall's `is:` filters where they exist, with the filter named as the source; curated lists otherwise, each with a URL and a version, and a disputed card shown as "optional" in the goal.
4. **For the lawyer (research, not legal advice; add to [L-21](../legal-questions.md#l-21-proxying-repackaging-and-our-own-api-terms-scryfall) as (g)):** a private checklist of a set's or a card's printings, built from I-67's copy of Scryfall's bulk data and shown only to the collector who owns the rows, and the same list on a `noindex` share page when the owner ticks it. Does either "simply repackage, republish, or proxy" Scryfall data? Recommended until answered: private pages only; the share page shows progress numbers and withholds the missing list.
5. **For the integrator.** Should `GoalProgressDay` ride I-59's `PriceDay` job or I-63's job route? Recommended: I-59's daily run, since both read the same catalogue version.

## Sources

Read on 2026-11-12 unless stated otherwise.

1. ManaBox, "Collector mode" guide (undated): "By default the collector mode shows all the cards available in a set and its subsets (promos and alternate frames)."; sorts by "Total cards, Collected cards, and Percentage of completion"; "group all the cards with the same name in a single entry". <https://manabox.app/guides/collection/collector-mode/>
2. ManaBox, "Import and export the collection" guide (undated): supported import columns include "Purchase price", "Purchase currency / Purchase price currency", "Misprint", "Altered", "Language", "Condition" and "Scryfall ID". <https://manabox.app/guides/collection/import-export/>
3. Archidekt, feature board, read 2026-11-11 by the twelfth pass ([landscape §13](../competitive-landscape.md#13-a-twelfth-pass-on-commander-tools-2026-11-11)): "prefer owned printings 367, … import into owned editions 217, … non-English printings 140". <https://archidekt.com/features>
4. Pokex and TCG Collector, master-set and set tracking (search summaries, 2026-11-12; the pages were not read in full). <https://tcgcollector.com/>
5. PSA Set Registry, registry rules and collector forum threads on registering sets and leaderboards (search summaries, 2026-11-12). <https://www.psacard.com/dnasetregistry/rules>
6. The Casual Planeswalker, "Top 200 Most Reprinted MTG Cards (2026)": "sorted by number of unique set printings"; Lightning Bolt "38 printings · 1993–2026"; Sol Ring "69 printings · 1993–2026"; Mountain 220 (the page was read to about a third of its length). <https://casualplaneswalker.com/reprints/most-reprinted/>
7. mtg.wiki, "Collector", citing the r/magicTCG thread "After four years, it is finally over. Behold: One of Every Printing of Lightning Bolt" and threads on collecting Jace (search summary; the page answered 403 to automated reads on 2026-11-12). <https://mtg.wiki/page/Collector>
8. r/magicTCG, "This guy completed every single regularly printed…", 2025-01-16 (mirror; title truncated in the listing). <https://www.reddit.com/r/magicTCG/comments/1i2ql3h/>
9. r/magicTCG, a comment of February 2026 that completing a set is "now very hard" for completionists because many sets print three versions of each card (mirror snapshot, search summary, 2026-11-12). <https://reddit.sentinel-team.org/posts/1r270dt/snapshots/2026-02-11T22%3A51%3A55.624387Z>
10. Scryfall API, read with a named User-Agent on 2026-11-12: `/sets` lists 1,067 sets; `!"Lightning Bolt" unique:prints` returns 71 cards and `!"Sol Ring" unique:prints` 140; `is:fetchland` and `is:shockland` return 10 each. <https://scryfall.com/docs/api>

## Feature contract (Full, 2026-11-12)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A collector working toward something that is not a set, or toward a set counted their own way, keeps the list on paper or in a spreadsheet. Collection apps track a set's percentage and nothing else, and none says what the missing cards would cost from what the collector already owns.

### Goals

- A collector who owns two fetch lands creates the goal "the ten fetch lands", sees 2 of 10 with the eight missing by name and set, the lowest listed price of each in their market with its date and no buy verb, adds the eight to their wanted list in one action, and prints a checklist whose footer names the catalogue version and the date; no slice past 1 started before gate C was recorded as met.

### Non-goals

- Do not reverse a non-goal already named in this file or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score this file does not already cite from a named source.

### Personas

The collector and budget player. See the roadmap persona table.

### User stories

#### US-101-01

As a collector, I want to name what I am collecting and how a copy counts, so that the product counts my progress the way I do and not the way a set page does.

#### US-101-02

As a collector, I want the missing cards priced from the cheapest printing that fills each slot, in my market, with no advice, so that I know the listed prices and decide for myself.

#### US-101-03

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-101-04

As a player using a keyboard or a screen reader, I want each slot and control to have a name and a visible focus, and collected and missing to be words, so that colour is not the only signal.

### Acceptance criteria

#### AC-101-01 Happy path

Given a signed-in collector, the English locale, two owned fetch lands and the goal "the ten fetch lands"
When the goal page opens
Then it shows 2 of 10, the eight missing by name and set in release order, the rule "one of each name, any finish, paper only" and the catalogue version; the French locale shows the French catalogue string for every control

#### AC-101-02 Error and failure

Given the goal write cannot finish
When the collector retries or leaves the screen
Then the last confirmed goal is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-101-03 Edge cases

Given a goal whose slots have no listed price, or an empty collection
When the page renders
Then "no estimate" rows and "0 of N" are shown, the total says how many slots it leaves out, and no zero stands in for an unknown price

#### AC-101-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in collector open the surface
Then the guest sees the cycle definitions and a sentence that goals need an account and a collection, and does not meet a raw 401; the signed-in collector sees their goals only

#### AC-101-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, the other eight keep key parity with `en` and may reuse the English text until a person reviews them, and no routed locale shows a hard-coded English control

#### AC-101-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the collector completes US-101-01 without a pointer
Then every slot and control has an accessible name, focus returns on close, and collected and missing are announced as words with a glyph beside them

### UX flow and states

A goals page under the collection: a list of goals with progress, "New goal" with the kind, the scope and the counting rule shown as plain sentences, and each goal's page with the slot grid, the missing list, the listed prices, the hand-offs and the checklist.

- Empty: "No goal yet. A goal is a set, a cycle, every printing of one card, an artist, or a list of your own." The cycle definitions are browsable before any goal exists.
- Loading: a busy state that keeps the layout still.
- Error: the catalogue message and a retry, with the last confirmed goal still there.
- Partial: a slot the catalogue cannot resolve is labelled "unknown printing", never counted as missing or collected.

### Data model and API

The types and routes in [Data model / API](#data-model--api). Owner-only except the share page. No goal appears in any deck projection.

### Analytics and telemetry

`collecting_goal_created {kind}` and `collecting_goal_completed {kind}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in only, since a goal needs an account's collection. Behind an I-69 switch, `collection.goals`, off until gate C is recorded as met and D-98 is committed.

### Dependencies

Hard waits are in the roadmap dependency table: I-67 slice 2 for slice 1; gate C, D-98 and I-26 slice 4 for slice 2. Slice edges stay in the table above and in `dependency-graph.md`.

### Risks and mitigations

- Building a set gallery by another name: no listing, no public page, no index; D-82 stands.
- A count that contradicts the collector's own: the rule is shown beside every total, with the alternatives one switch away.
- A price read as advice: two labelled prices, no conversion, no verb, I-59's deny-list scan in CI.
- Thin demand: gate C before any schema, and slice 1 kept small.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-98, counting defaults, cycle data, the lawyer question on private checklists (L-21), and the daily job.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

Each scope line of the roadmap record below, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-101-101 A goal with its counting rule

As a collector, I want a goal that is a set, a cycle, every printing of one card, an artist or my own list, with the counting rule stated, so that "every printing of Lightning Bolt" means what I say it means.

#### AC-101-100 Happy path

Given a signed-in collector, the English locale and the goal "every printing of Lightning Bolt, paper only"
When the goal page opens
Then it shows the total at the pinned catalogue version with its date, the collected count, the missing printings by set and collector number, and the rule in a sentence

#### AC-101-101 Failure

Given the same goal and the catalogue unavailable
When the page renders
Then it shows the last computed progress with its date and "catalogue unavailable", computes nothing new and invents no total

#### AC-101-102 Edge

Given the catalogue gains a new Lightning Bolt printing
When the page recomputes
Then the total rises by one, the date changes, and the new printing is a missing slot; the collector's rows are untouched

#### US-101-102 Listed prices and hand-offs

As a collector, I want the missing cards priced from the cheapest fitting printing in my market and handed to my wanted list and my plan, so that the next step is one action and the words are mine.

#### AC-101-103 Happy path

Given a goal with eight missing slots, six of them priced
When the collector opens the prices and adds the missing cards to the wanted list
Then six rows show a price with its date and two show "no estimate", the total says it leaves two out, and the wanted list gains eight rows tagged with the goal, skipping any already wanted

#### AC-101-104 Failure

Given the wanted-list write fails after four rows
When the collector retries
Then the retry writes the remaining four only, and no card is wanted twice

#### AC-101-105 Edge

Given a `oneOfEachName` goal and a missing name whose cheapest printing is a digital-only card
When the prices compute with `paperOnly` on
Then the digital printing is skipped and the cheapest paper printing is priced

#### US-101-103 Sharing, time and the household

As a collector, I want to share progress by a link I can revoke, see progress over time, and count my household's copies, so that the goal is mine to show and never a ranking.

#### AC-101-106 Happy path

Given a shared goal with the missing list ticked
When a visitor opens the link
Then they see the name, the rule, the progress and the missing names, and no price, condition, storage or purchase price

#### AC-101-107 Failure

Given the owner revokes the link
When the visitor reloads
Then the page is gone on the next request, and no cached copy is served

#### AC-101-108 Edge

Given a household of two accounts and a goal counted across the household
When the goal page renders for either member
Then each slot names the owner of the copy that fills it, and no purchase price appears anywhere on the page

### UX states for this feature

| State            | What the player sees                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | "No goal yet…" with the browsable cycle definitions. No invented row, author, price or score.                                    |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                   |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed goal is still there.                                  |
| Partial          | Unresolved slots are labelled "unknown printing"; unpriced slots say "no estimate". A short list is not padded to look finished. |
| Stale            | Progress carries the catalogue version and the date it was computed; a missing date is absent, not guessed.                      |
| Guest            | A sentence that goals need an account and a collection; the cycle definitions are readable. No raw 401.                          |
| Signed-in        | Goals, rows and hand-offs go to that account only. Another collector's goals are never in the response.                          |
| English          | New controls use the `en` catalogue.                                                                                             |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                    |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Every slot and control can be reached without a pointer. Focus is visible and returns when a dialog closes.                      |
| Screen reader    | Each slot has an accessible name; collected, missing and lent are announced in words.                                            |
| Colour           | Collected and missing differ by a glyph and a word as well as hue, in both themes; the checklist prints black on white.          |
| Success          | Creating a goal and adding to the wanted list are confirmed in words. A second identical action does not duplicate the write.    |

### Alternate paths

- The collector cancels a goal before saving. Nothing is written.
- The collector confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The collector switches locale in the middle of the flow. Chrome strings switch. Card names stay the printing's language; set names follow the catalogue's language field where I-67 stores one.
- Two edits of the counting rule overlap. Each field rolls back to its own last confirmed value.

### Roadmap record (2026-11-12)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-101 is a link here.

## I-101: Collecting Goals Beyond A Set

**Outcome:** a collector names what they are collecting (a set with or without its subsets, a named cycle, every printing of one card, an artist, a list of their own, later one of each Commander precon) and how a copy counts, sees progress and the missing cards computed from their own rows, the lowest listed price of each missing card in their market with no buy verb, hands the missing list to the wanted list and the acquisition plan, prints a checklist, and may share progress by a revocable link that ranks no one.

**Status:** Later
**Priority:** Later (2027 horizon), behind I-26's import, I-67's tables and gate C; slice 1 may be built by hand after I-67 slice 2, and nothing else starts before the owner records gate C as met and answers D-98. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Low. The product reads rows it already holds and changes none. The risks are a set gallery by another name, which the non-goals forbid, and thin demand, which the gate measures.
**Depends on:** I-67 slice 2 for slice 1; gate C, D-98 and I-26 slice 4 for slice 2; I-67 slice 5 and I-96 for slice 3; I-56 slice 2 and I-06's plan scope for slice 4; I-84 for slice 5; I-59 slice 3 for slice 6; I-08's share pattern for slice 9; I-51 slices 9 to 11 for slice 10; I-17 slice 1 and I-67 slice 13 for slice 11.

Collection apps track a set's completion percentage and nothing else: ManaBox's Collector mode shows "all the cards available in a set and its subsets" sorted by "Percentage of completion" [1], and no equivalent could be confirmed for Moxfield or Archidekt [3]. Collectors collect other things: one of every printing of Lightning Bolt, every regularly printed version of a card, the ten fetch lands, an artist, every precon [7][8]. Two honest sites count Lightning Bolt's printings at 38 and 71 [6][10], so a goal must say which count it uses. Adjacent hobbies name the pattern ("master set") and build registries that rank collectors [4][5]; this product takes the goal and declines the ranking. The collection on `dev` has rows and no goal, set, cycle or artist object, and its import is Later (I-26), so the initiative is Later behind a gate on the product's own numbers.

### Scope

- [ ] Gate C and D-98: I-26 slice 4 shipped, and a one-off row-count showing 50 accounts with 300 or more collection rows, or 10% of collecting accounts; counts only (slice 0). Both numbers are proposals.
- [ ] Goal kinds (set, cycle, every printing, artist, list) and counting rules as data; cycle definitions with sources; `goalProgress` over fixtures with proxies excluded and lent copies marked; the catalogue port to I-67 (slice 1).
- [ ] After the gate: `CollectingGoal`, owner-only routes and the goals page with progress and the missing list in a fixed order (slice 2); listed prices of the missing cards with two labelled prices, no conversion and no verb (slice 3); the wanted list and the acquisition plan as hand-offs (slice 4); reprint lines (slice 5); progress over time on I-59's job (slice 6); the printable checklist (slice 7); suggested goals (slice 8).
- [ ] Sharing by a revocable `noindex` link that shows progress and, if ticked, the missing names, never a price (slice 9); the household view with each copy's owner and no purchase price (slice 10); one of each Commander precon from I-17's catalogue (slice 11).

### Engineering enablers

- `GoalKind` and `CountingRule` are discriminated unions with exhaustive `never` guards; the cycle definitions are validated at build time against the pinned catalogue fixture.
- The catalogue is a port, so slice 1's tests run on fixtures with no database and no network, and the day I-67's tables land only the adapter changes.
- A schema test keeps goals, progress and share tokens out of every deck projection, and the share page's response has its own allowlist.

**Paid-tier angle:** none. The collector's own rows and card data stay free under I-30 1.1 and 1.4, and a limit on goals is the paywall players punish.

### Enrichment (2026-11-12)

**User story.** As a collector, I want to name what I am collecting and how a copy counts, see my progress and the missing cards from my own rows, and hand the missing list to my wanted list, so that the product counts the way I do and the next step is one action.

**Acceptance.**

- Two owned fetch lands under the goal "the ten fetch lands" show 2 of 10 and the eight missing by name and set, in release order.
- The rule is shown beside every total; switching to "every printing" changes the total and the date without touching the rows.
- Six priced and two unpriced missing slots show six dated prices, two "no estimate" and a total that says it leaves two out, with no buy verb.
- "Add to my wanted list" writes eight rows tagged with the goal and skips what is already wanted.
- The share page shows no price, condition, storage or purchase price, and is gone on the request after it is revoked.

**UX.** A goals page under the collection; a goal page with the slot grid, the missing list, the listed prices, the hand-offs and "Print the checklist".

**Data and API.** `CollectingGoal` and `GoalProgressDay`, owner-only routes, one share page; pure functions over a catalogue port.

**i18n and access.** English and French chrome through the message catalogues; card names stay the printing's language. Every slot and control has an accessible name and a keyboard path; collected and missing are words and glyphs, not colours.

**Telemetry.** `collecting_goal_created {kind}`, `collecting_goal_completed {kind}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in only, behind `collection.goals`, off until gate C and D-98.

**Open questions.** D-98 and the gate numbers; counting defaults; cycle curation; the lawyer question on private checklists (L-21 (g)); the daily job.

### Definition of done

A collector who owns two fetch lands creates "the ten fetch lands", sees 2 of 10 with the eight missing by name and set, the lowest listed price of each in their market with its date and no buy verb, adds the eight to their wanted list in one action, prints a checklist whose footer names the catalogue version and the date, and shares a link that shows progress and no price; opening the goal again gives the same progress byte for byte; no slice past 1 started before gate C was recorded as met.

---
