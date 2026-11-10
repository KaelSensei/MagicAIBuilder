# I-58: Mana Base Builder

> **Initiative:** I-58, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 1–9; Later for slices 10–15 · **Written 2026-11-10**
> **Research:** dated notes of 2026-11-10, not committed, so every external fact cites a numbered entry in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** the land base proposed for one deck: the land-count target and its formula, the source target per colour and its table, the land catalogue with each land's mana facts, the deterministic proposal, the reason shown on every line, and the reviewed change set that applies and reverts it. **Does not own:** simulation, castability by Monte Carlo and swap verdicts ([I-31](i31-deck-lab.md)); the seeded shuffler and intervals ([I-21](i21-reproducible-probability-bench.md)); bracket rules and the guide's land-count text ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); dated Game Changer lists ([I-48](i48-official-changes-reach-every-deck.md)); the printing chosen ([I-57](i57-printing-preferences-everywhere.md)); ownership and the acquisition plan ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)); copies committed to other decks ([I-16](i16-decks-buildable-from-a-collection.md)); markets and prices ([I-32](i32-seller-handoff-and-affiliate-carts.md)); the change log ([I-37](i37-editor-depth.md)); what the copilot generates ([I-02](i02-checkable-ai-copilot.md)).
> **Paid tier:** the land count, the source check and a one-deck proposal within a budget stay free. A cross-deck optimiser over the player's collection is a candidate for [I-30](i30-business-model-and-paid-tier.md), rated unproven. Billing waits for I-30's legal gate.

## Overview

A Commander player asks two questions about lands: how many, and which. The product answers neither today. The deck page shows "Mana Alignment", each colour's share of land slots against its share of pips. It counts lands only, ignores mana value, MDFCs, rocks and tapped lands, and recommends sources in proportion to pips. The AI wizard asks a language model for "approximately 36-38 lands" and, when a list comes back short, adds basics split evenly across the colours. Neither the count nor the split follows a published method, and the model chooses the lands, a deterministic job the [strategic boundaries](../roadmap.md#strategic-boundaries) keep away from an LLM.

I-58 proposes a land base for the open deck and applies it as a reviewed change set. The count comes from Frank Karsten's published 99-card formula [2]. The target for each colour comes from his 2022 table for 99-card decks, keyed to the spell that demands that colour most [3]. Candidates are Commander-legal lands, filtered by colour identity, bracket, budget in euros or dollars, the player's collection, the printing rule and the utility slots the player sets. Every line says why it is there: the target it serves, its cost, whether and when it enters tapped, and what a utility land replaces. Nothing changes until the player reviews the diff. Apply takes a snapshot first, and one action reverts it.

**The split with I-31.** I-31 analyses a list by simulation. I-58 proposes and applies. I-58's free check uses Karsten's published tables and runs no simulation. Once I-31's colour model ships, a proposal can also be checked as an I-31 variant on common random numbers, with intervals. **No LLM chooses a land or states a probability.** Every probability shown comes from a cited published table or from the seeded I-21 engine that I-31 runs.

**Why Next.** The wizard's lands are a model decision today. The shipped alignment advice is proportional and counts lands only. Free generators exist, but none found reads the player's own list, collection and bracket together, explains each land and applies a diff that can be reverted. Slices 1 to 4 depend on nothing else on the roadmap.

## What the market does

Read on 2026-11-10 unless dated otherwise. "Not found" means not found among the tools read; it does not prove absence.

### Published method

| Source                                                        | What it says                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Limits                                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Karsten, Commander curve and land count, 2022-07-15 [1]       | "Start with 42 lands plus a Sol Ring, then cut a land for every two or three additional mana rocks", and one for every three or four cheap cantrips or mana dorks; "try not to go below 37 lands" for medium-power midrange decks. The model counts the free mulligan, the starting player's draw and the commander as an extra spell in hand, with no interaction, and measures mana spent over seven turns                                                                                                                                                                                                  | "My model won't be useful for cEDH." "Color requirements ... are abstracted away." No formula                                                                                                       |
| Karsten, land count, 2022-07-29, updated 2025-02-13 [2]       | For 99 cards: 31.42 + 3.13 × average mana value of spells − 0.28 × cheap card draw or mana ramp. Cheap means mana value 2 or less that draws cards, adds mana or searches for lands. A land/spell MDFC counts 0.38 land (non-mythic) or 0.74 (mythic). At an average of 3, about 40–41 lands                                                                                                                                                                                                                                                                                                                  | Fitted on 95,143 winning 60-card decks (2020-07-01 to 2022-07-01), then scaled by 99/60 minus 1.35 for the free mulligan and draw. The author calls it "an imprecise back-of-the-envelope estimate" |
| Karsten, coloured sources, 2022-08-02, updated 2025-02-13 [3] | A 99-card column (below). "Consistent" means at least (89 + M)% on the play to hold the sources by turn M, given M lands. Partial sources: a fetch land is a full source of each colour it finds (about two-thirds for Fabled Passage-type fetches in heavy three-plus-colour decks); Signets 0.75 for spells of mana value 3+; dorks 0.5; two-mana land ramp 0.75 for 3+; Treasure 0.25; Exotic Orchard 0.75 and Fellwar Stone 0.5 when opponents' colours are unknown; a land/spell MDFC "0.8 source" (non-mythic) or a full source (mythic); tapped lands count from turn 2; gold cards add one per colour | Assumes 41 lands and that "we mulligan any free seven-card hand in Commander with zero, one, two, six or seven lands". Tapped-land limits are given for 60-card decks only                          |
| The Command Zone #658, 2025-02-18 [4]                         | The 2025 template has a "Lands" chapter; its transcript gives 38 lands, as quoted in the [bracket guide](../guides/commander-deckbuilding-by-bracket.md#the-command-zone-template-and-how-real-decks-deviate). The show notes link Karsten's land-count article, "Salubrious Snail's calculators and manabase tool" and episode 455, "The Ultimate Guide to Lands"                                                                                                                                                                                                                                            | No derivation published (I-31). The Salubrious Snail tool could not be found                                                                                                                        |
| EDHREC, Bennie Smith, 2024-11-29 [5]                          | 39 lands; mono-colour decks 32 coloured lands and 7 colourless utility lands; two-colour decks no more than four colourless utility lands                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | No method to split colours, no source counts, no tool                                                                                                                                               |
| EDHREC, Tyler Bucks, 2025-08-19 [6]                           | Dual lands under $1 each, labelled by cycle; entering untapped was "paramount"; gain lands and Guildgates excluded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | No tapped-land limit, no price date, no bracket                                                                                                                                                     |

Karsten's 99-card column [3], the table this initiative encodes (1CCCC is 36):

| Cost | Sources | Cost | Sources | Cost | Sources |
| ---- | ------- | ---- | ------- | ---- | ------- |
| C    | 19      | CC   | 30      | CCC  | 36      |
| 1C   | 19      | 1CC  | 28      | 1CCC | 33      |
| 2C   | 18      | 2CC  | 26      | 2CCC | 30      |
| 3C   | 16      | 3CC  | 23      | 3CCC | 28      |
| 4C   | 15      | 4CC  | 22      | 4CCC | 26      |
| 5C   | 14      | 5CC  | 20      | CCCC | 39      |

**Computed for this spec.** At an average mana value of 3.0 with 10 cheap ramp or draw pieces, the formula gives 38.0 lands [2]. Measured medians for Brackets 1–3 are 35–37 lands ([guide](../guides/commander-deckbuilding-by-bracket.md#what-decks-look-like-per-bracket)). The formula and real decks disagree by one to three lands, which open question 1 has to settle.

### Tools

| Tool                                      | Reads the player's list | Names lands  | Budget                         | Collection    | Bracket and Game Changers                                                   | Explains each land  | Applies to a deck |
| ----------------------------------------- | ----------------------- | ------------ | ------------------------------ | ------------- | --------------------------------------------------------------------------- | ------------------- | ----------------- |
| EDHREC commander pages [7]                | No                      | By inclusion | Budget and expensive pages     | No            | Bracket counts per commander                                                | No                  | No                |
| mtg.land [8][9]                           | No; commander only      | Yes          | Tiers $25, $100, unlimited     | No            | Lists Gaea's Cradle and Ancient Tomb as "pricey adds", with no bracket note | No                  | No export found   |
| ScrollVault manabase calculator [10]      | Yes, paste or import    | Yes          | Tiers from "Budget (<$3/card)" | Not mentioned | A "power level" field                                                       | Not stated          | No                |
| DeckFlow Mana Base Analyzer [11]          | Yes                     | No           | No                             | No            | B2–B5 setting, effect not explained                                         | Findings per colour | No                |
| EDHTuner [12]                             | Yes                     | No           | —                              | —             | Swaps "respect the bracket you pick"                                        | Bar not published   | No                |
| Draftsim land calculator, 2026-06-12 [13] | Pips typed by hand      | Basics only  | No                             | No            | No                                                                          | No                  | No                |
| Archidekt deck stats, 2024-09-23 [14]     | Yes                     | No           | —                              | —             | —                                                                           | —                   | —                 |

Notes. EDHREC's JSON for Omnath, Locus of Mana gives an average of 36 lands (30 basic, 6 nonbasic), a "Utility Lands" list by inclusion, and 991 budget, 7,933 middle and 991 expensive decks [7]. mtg.land ranks picks "by how often real EDHREC decks actually run it"; its Omnath page proposes 36 lands for $72.09 against $100, with no price date, and shows 34 green and 3 colourless sources, 37 for a 36-land base [9]. ScrollVault "reads Karsten's published source tables directly" and returns land picks and a basic split; it showed "Land database failed to load" when read [10]. DeckFlow takes its land count from Karsten's regression and checks castability by Monte Carlo, but recommends no lands and no swaps [11]. Draftsim splits basics "in proportion to your colored pips", with early drops weighted, and defaults to 38 lands [13]. Archidekt compares production with cost per colour and offers a probability table [14]. **Moxfield** was not verified: its pages answered 403 to research tools on 2026-11-09 (I-31), and no official description of a mana base feature was found on 2026-11-10.

**The gap.** Free generators name lands within a budget tier. None found reads the player's own list and curve, takes owned copies first, respects the deck's bracket for Game Changer lands, prices in euros as well as dollars, explains each land against a cited table, and applies the result as a change the player reviews and can revert.

### Bracket rules as they bear on lands

- Wizards' criteria name cards that "easily and dramatically warp Commander games, allowing players to run away with resources", and Bracket 4 expects "Game Changers that are likely to be fast mana" [15].
- Scryfall served 53 Game Changers on 2026-11-10, seven of them lands: Ancient Tomb, Field of the Dead, Gaea's Cradle, Glacial Chasm, Mishra's Workshop, Serra's Sanctum and The Tabernacle at Pendrell Vale [16]. Prices that day, on the printing the search returned: Gaea's Cradle 1,654.93 USD and 1,195.55 EUR, Serra's Sanctum 521.73 and 399.94, Ancient Tomb 124.96 and 108.94, Field of the Dead 26.94 and 29.24; the other three had none [16].
- Brackets 1 and 2 allow no Game Changers, Bracket 3 up to three, Brackets 4 and 5 any number ([guide](../guides/commander-deckbuilding-by-bracket.md#the-official-table)).
- **No other land is restricted.** "Fast lands", the cycle that enters untapped with two or fewer other lands, appear in no bracket rule found, and neither do fetch lands, shock lands or the original duals. They change a deck's price, not its bracket. The only official land restriction is the Game Changer count.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Alignment is proportional and counts lands only.** `buildManaAlignment` in [`src/lib/deck/mana-alignment.ts`](../../../src/lib/deck/mana-alignment.ts) counts rows with `category === "land"` and sets `recommendedSources` to the colour's pip share times the land count. Pips are counted without mana value. `colorsProducedBy` reads basic subtypes, then "Add" clauses, then colour identity, and its header says Scryfall's `produced_mana` "is not stored anywhere". Scryfall returns no `produced_mana` for Polluted Delta or Evolving Wilds [17], so fetch lands need their own rule either way. `DeckStats.tsx` shows the result with the hint "Suggested sources mirror each colour's share of pips. A colour needed on turn one wants more than that."
- **Two definitions of a land.** Stats and alignment count `category === "land"`. An MDFC takes its front face's category through `categorizeDfcCard` (`src/lib/deck/store-card-faces.ts`) and is counted in `flexibleLands` instead. `isOpeningHandLand` in `src/lib/playtest/opening-hand-evidence.ts` counts any type line containing "Land", MDFCs included, and `keep-rules.ts` uses it. The same MDFC is a land in the playtest and not in the stats panel.
- **Land-count advice is scattered and unsourced.** `FORMAT_CONFIG.commander.recommendedLands` is `[33, 38]` in `src/lib/deck/formats.ts`, and nothing outside that file reads it. `src/lib/deck/bracket.ts` warns "Low land count (N) — recommend 33–38" below 33. `src/lib/ai/deck-plan.ts` tells the model "Lands 36-38".
- **The model picks the wizard's lands.** `src/app/api/ai/build/route.ts` asks for "approximately 36-38 lands" and "basic lands matching your color identity only", with the budget as "$N max per card". `src/lib/ai/generated-deck-size.ts` fills a short list with basics "spread over the colours in WUBRG order", evenly, whatever the pips, and trims the largest basic stack first.
- **Opening-hand maths.** `src/lib/deck/turn-one.ts` computes the exact chance of a land and a one-drop in the opening seven, with colour sources from lands only and no mulligan. `src/lib/playtest/keep-rules.ts` copies the guide's computed keep tables as data. `src/lib/playtest/engine.ts` deals the London mulligan with the free first mulligan and shuffles with `randomIntBelow` from `src/lib/crypto-random.ts`. No seeded generator exists in `src/`, so no simulation can back a land change yet.
- **Prices are dollars, budgets are per card.** `Deck.budget` is one `Float`, sent to the model as "max per card" and compared with each card's price in `computeDeckStats`. Deck rows read `prices.usd` only. Scryfall also returns `prices.eur`, null for some printings, such as the Evolving Wilds printing Scryfall returned on 2026-11-10 [17].
- **A dead budget heuristic.** `suggestBudgetReductions` in `src/lib/deck/pricing.ts` proposes "Basic Land" at a fixed 0.1 for any land and a "(budget alternative)" at 30% of the price for other cards. `BudgetOptimizationModal.tsx` displays it, but only tests import either. It is not a base for this initiative.
- **A change set already applies atomically.** `PATCH /api/decks/[id]/cards` applies removals, quantity changes and additions in one transaction and answers 409 when the deck changed (`StaleDeckCardsError`). The store's `applyBulkEdit` calls it, takes an owned printing by name for additions (`getOwnedPrinting`), and then clears the deck's undo stack, so a bulk change has no undo today. `POST /api/decks/[id]/snapshots` and a snapshot restore route exist. No deck edit takes a snapshot first; the only automatic snapshot is the one `POST /api/decks/[id]/playtest-sessions` creates to file a recorded run (#1315).
- **Game Changer and EDHREC data.** Rows store `isGameChanger` when a card is added, frozen since (I-48). Scryfall exposes a `game_changer` field [17]. `src/lib/meta/fetch.ts` reads EDHREC's commander JSON but keeps the top 20 cards across all lists, so the "Utility Lands" list is not kept.
- **No land catalogue.** Nothing stores Commander-legal lands with what they produce, whether they enter tapped or what they can fetch.

## Functional requirements

### 1. Inputs

1.1 The builder runs on a Commander deck with its commander or commanders: a saved deck, an [I-55](i55-one-deck-several-builds.md) build once builds exist, or a pasted list (proposal only, no apply). Other formats show "not modelled". A Duel Commander deck under [I-42](i42-commander-variants-duel-cedh-pauper.md) shows that Karsten's numbers assume the free multiplayer mulligan [1][3].
1.2 From the deck: colour identity from the command zone; coloured pips per spell with its mana value; the curve; cheap ramp and cheap draw (mana value 2 or less, Karsten's definition [2]); MDFCs with a land back; current lands; the target bracket; Game Changers already in the deck.
1.3 Player settings: budget per card and in total for lands to acquire; market (EU in EUR or US in USD); owned first on or off; number of utility slots; preference order (fewest tapped, cheapest, owned); locked lands, kept whatever happens; excluded lands.
1.4 Each classification shows its rule and can be overridden per deck, in the same override store as [I-31 requirement 2.2](i31-deck-lab.md#2-card-classification). No LLM is involved.

### 2. Land count

2.1 The target is Karsten's 99-card formula with the deck's numbers on screen: 31.42 + 3.13 × average mana value − 0.28 × cheap ramp and draw [2]. The average covers the 99's nonland cards, commander excluded, as `computeDeckStats` computes it, and the screen says so.
2.2 MDFCs with a land back count 0.38 land, or 0.74 when mythic [2].
2.3 Reference lines, each labelled with its source: Karsten's rule of thumb (42 plus Sol Ring, minus the cuts, not below 37) [1]; The Command Zone's 38, from the episode's transcript as the guide quotes it [4]; and the measured median for the target bracket with its n, from the I-28 guide. When they differ from the formula by more than two lands, the screen says so rather than choosing silently.
2.4 At Bracket 5 the screen quotes Karsten: his model "won't be useful for cEDH" [1]. The formula still runs and is labelled.
2.5 By default the proposal keeps the deck's current land count (open question 1). The player can choose the formula's count or any number.
2.6 A count change shows as slots needed or freed. The player resolves needed slots in the review by choosing nonland cards to move to Considering. Freed slots stay empty, and the deck shows its existing size warning. The builder never adds or cuts a nonland card on its own.

### 3. Source target per colour

3.1 For each colour, the target is Karsten's 99-card value for the deck's most demanding spell in that colour, its driver [3]. A cost maps by mana value and that colour's pips, for example {1}{G}{G} to 1CC, 28 sources. A cost outside the table uses the published entry with the same pips and the nearest lower mana value, and says so; nothing is extrapolated.
3.2 A gold spell adds one to the target of each of its colours [3].
3.3 The commander's cost is always a candidate driver. The player may exclude any card from driving ("not needed on curve"); the screen then names the next driver.
3.4 A demand table lists, per colour, the cards by mana value and pips, so the player sees whether one card or twenty set the target.
3.5 Current sources count lands and Karsten's partial sources at his published weights, each on its own line: fetch lands, Signets, dorks, two-mana land ramp, Treasure makers, Exotic Orchard and Fellwar Stone (flagged "depends on opponents"), and MDFCs [3].
3.6 Tapped lands count from turn 2 [3]. A one-mana driver counts untapped sources only.
3.7 Every figure names its entry, for example "White: 26 sources for {2}{W}{W} (Karsten 2022, 99-card column), driven by Wrath of God; 24.5 now". It explains "consistent" in Karsten's terms [3]. The check states no other probability.

### 4. The land catalogue

4.1 The catalogue holds Commander-legal lands with Oracle ID, name, colours produced (Scryfall `produced_mana`, plus the land types a fetch land can find, read from its text), enters-tapped behaviour, cycle label, Game Changer flag and rarity.
4.2 Enters-tapped behaviour is one of four classes, stated in words: untapped; always tapped; untapped on a condition (fast lands with two or fewer other lands, slow lands with two or more, check lands with a matching basic type, reveal lands with a matching card in hand, battle lands with two or more basics, bond lands with two or more opponents); untapped at a cost (shock lands for 2 life, pain lands, pathways fixed to one colour). A code table keyed by Scryfall's land-cycle keywords sets the class; 21 keywords returned results on 2026-11-10 [18]. An Oracle-text rule covers lands outside a cycle. The table is reviewed in a pull request and dated, like I-57's set lists.
4.3 The catalogue is a computation index, not a browsable database. It has no public pages; card pages stay on Scryfall (roadmap boundary).
4.4 Candidates exclude lands outside the identity, banned lands, lands above the per-card budget and lands the player excluded.
4.5 Game Changer lands are never candidates at Brackets 1–2, nor at Bracket 3 when one would take the deck above three. At Brackets 4–5 they are never added by default: the player opts in per land, and the line says "Game Changer". After I-48 slice 2 the flag comes from the deck's rules version.
4.6 No other land carries a bracket warning, because no official rule names one.

### 5. The proposal

5.1 A pure function returns the land lines and their reasons. The same inputs give the same output. Ties break by owned, then price in the market, then name, then Oracle ID.
5.2 Locked lands and utility slots are placed first. Remaining slots meet every colour's target with the fewest lands that can enter tapped on turns 1 to 3, then the lowest cost to acquire, unless the preference order says otherwise. Basics fill the rest, so that each colour's surplus over its target is as even as possible.
5.3 When targets cannot all be met, as Karsten warns for three to five colours [3], the proposal names each colour that falls short and by how much. It adds no rocks or ramp: nonland changes belong to the player, I-31's variants and the copilot.
5.4 With owned first on, owned copies cost nothing against the budget and rank before unowned ones. Until I-16 slice 4, the line says "owned (may be in another deck)".
5.5 The printing of each added land comes from I-57's resolver. The builder never picks a printing.
5.6 Copies to acquire are priced in the chosen market from Scryfall's daily price. A card with no price there is listed as unpriced, never as free and never as zero, as I-06 requires. Totals are labelled estimates with their price date.

### 6. Reasons on every line

6.1 Each added or kept nonbasic shows the colours it counts toward and by how much, the target it serves, its enters-tapped behaviour, its cost to acquire or "owned", and its cycle.
6.2 Each removed land shows why: off-colour, a tapped land replaced by an untapped one for the same colours, over budget, or excluded.
6.3 Each tapped land shows its cost as a fact: "enters tapped while you control fewer than two other lands", "always tapped". A probability cost appears only from an I-31 run (group 8). Until then the summary gives the number of lands that can enter tapped on turns 1, 2 and 3, and Karsten's rule that they are not turn-1 sources [3].
6.4 Each utility land shows what it replaces: "Rogue's Passage replaces a Forest; green sources 21 → 20 against 19, still met", or "one short".
6.5 Reasons are templated strings per locale. The copilot may link to the builder; it never writes or rewrites a reason.
6.6 Colour figures carry the colour's name and symbol, never colour alone ([I-49](i49-colour-vision-and-low-vision-display.md)).

### 7. Review, apply and revert

7.1 The review is a diff of land lines only: removed, added and quantity changed. It shows, before and after, sources against target per colour, the land count, lands that can enter tapped on turns 1 to 3, the Game Changer count and the cost to acquire.
7.2 Any line can be unchecked, and the summary recomputes.
7.3 Apply is one server transaction against the deck version reviewed: a snapshot named "Before mana base · <UTC time>", then the checked lines through the row changes `PATCH /api/decks/[id]/cards` already applies. A deck changed since the review gets 409 and a reload prompt, and nothing is written.
7.4 Apply records the before-snapshot, the change set and the inputs hash.
7.5 Revert is one action. If the deck is unchanged since apply, it restores the snapshot. Otherwise it applies the inverse of the recorded land lines under the same 409 rule and lists any line it could not invert. Once I-37 slices 10 and 11 ship, apply is one history batch and revert uses I-37's revert.
7.6 Apply touches no nonland card except those the player moved to Considering under 2.6.

### 8. Check by simulation (after I-31)

8.1 "Check by simulation" runs the current and the proposed lists as one I-31 variant on common random numbers ([I-31 6.2](i31-deck-lab.md#6-variants)) and reports the paired difference in mana spent and colours available, with interval, n, seed and the "not distinguishable at this sample size" verdict.
8.2 The check never edits the proposal. The player may build a second proposal with another preference order and check it the same way.

### 9. The AI wizard

9.1 The size repair splits added basics by the source targets of group 3, not evenly in WUBRG order.
9.2 With the I-02 owner's agreement, the wizard asks the model for nonland cards only, and group 5 picks the lands. The preview labels them "Mana base: computed, not chosen by the model", with group 2's count.

### 10. Free and paid

| Capability                                                                                                                                 | Free                                         | Paid (I-30) | Why                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Count and formula, source targets, current-source check, tapped-land facts, reasons                                                        | Yes, signed out, on a visible or pasted list | —           | DeckFlow, ScrollVault and Draftsim give counts and splits free [10][11][13]; I-30 1.1 keeps the evidence free                                                                                                                    |
| One-deck proposal with budget in EUR or USD, owned first, printing rule, review, apply and revert                                          | Yes; applying needs the deck's owner         | —           | mtg.land and ScrollVault name lands within a budget free [8][10]; I-30 1.1 keeps building and editing free, and I-57 keeps owned first free                                                                                      |
| Check by simulation                                                                                                                        | Within I-31's free run                       | I-31's line | I-31 owns the compute                                                                                                                                                                                                            |
| Cross-deck allocation: share owned lands across all the player's decks and find the cheapest purchase plan that meets every deck's targets | —                                            | Candidate   | A personal tool computing over the player's own data (I-30 1.3). Not found in any tool read. I-30 lists collection-aware building as paid elsewhere (Deckbox, ManaForge); nothing shows players pay for mana bases. **Unproven** |

10.1 No paid check gates the formula, the tables, the check or any reason.
10.2 Whether paid computation fits the Fan Content Policy and Scryfall's terms is I-30's lawyer question (research, not legal advice). Billing waits for the answer.

### 11. Boundaries with other initiatives

11.1 **I-31 analyses; I-58 proposes and applies.** I-31 owns the simulation classifier ([line 74](i31-deck-lab.md#2-card-classification), 2.1), per-colour sources by turn with Karsten's table as a reference line (line 103, 5.3), and swap variants including "a basic for a dual" (line 109, 6.1). I-58 shares I-31 slice 2's classifier rather than writing a second one. Karsten's weights stay out of I-31's simulation (line 188); they are I-58's table check, which is a different method and is labelled as such. I-31 slice 8 must accept a multi-line variant, so a whole proposal can be checked at once; the integrator should add this to I-31.
11.2 **I-21** owns the seeded generator (line 52, 1.4) and colour availability by turn (line 56, 2.1). I-58 reports neither until I-31 runs on them.
11.3 **I-28** explains land counts in prose and places the deck's count against the plateau (line 74, 4.5), with official rules from shared constants (lines 63–64, 3.1–3.2). I-58 slice 1 owns Karsten's numbers as data; I-28's check reads them, and I-58's screens link to the [guide's section](../guides/commander-deckbuilding-by-bracket.md#land-count-karstens-math) for the reasoning.
11.4 **I-06, I-16, I-17 and I-57.** I-58 adds no ownership state: it reads I-06's collection ([roadmap lines 896–900](../roadmap.md#i-06-collection-and-purchase-planning)), I-16's commitment index once built ([I-16 line 67](i16-decks-buildable-from-a-collection.md#data-and-api)) and I-57's resolver ([I-57 line 63](i57-printing-preferences-everywhere.md#2-precedence-and-fallback), 2.1). It follows I-57's diff-and-apply pattern (lines 81–84, 4.1–4.4) and joins I-57's enumeration of entry points (line 72, 3.1). An I-17 bundle stays editorial and applies to a working copy (lines 53–54); I-58 can run on that copy, never on the sealed list. Missing lands go to I-06's acquisition plan and I-32's handoff.

## Data model / API

```
LandFacts         oracleId, name, produces[] (W|U|B|R|G|C), fetchTypes[], fetchesAnyBasic, entry (untapped|tapped|conditional|paid), condition?, cycle?, isGameChanger, rarity, catalogueVersion
SourceTarget      colour, driverCardName, costPattern ("1CC"), target, tableRef ("karsten-2022-99"), goldBonus
ManaBaseSettings  deckId, market (EU|US), budgetPerCard?, budgetTotal?, ownedFirst, utilitySlots, preference[], lockedOracleIds[], excludedOracleIds[], landCountMode (current|formula|fixed)
ManaBaseProposal  inputsHash, catalogueVersion, count{current, formula, references[]}, targets[], lines[]{action, oracleId, quantity, printingId?, reasons[], price?, owned}, summary{before, after}
ManaBaseApply     id, deckId, appliedAt, beforeSnapshotId, changeSet (JSON), inputsHash, revertedAt?
```

- `src/lib/mana-base/`: pure `landCountTarget`, `sourceTargets`, `currentSources` and `proposeManaBase`. No I/O and no AI client import.
- `POST /api/decks/[id]/mana-base/proposal` computes; a sibling route takes a pasted list signed out. `POST /api/decks/[id]/mana-base/apply` is owner-only and writes the snapshot and the rows in one transaction. `POST /api/mana-base-applies/[id]/revert` reverts.
- `ScryfallCard` gains `produced_mana`, `game_changer`, `rarity` and `prices.eur`, shared with I-31 slice 2 and I-57 slice 2.

## Non-goals

- An LLM choosing a land, a count or a split, or stating a probability.
- Changing nonland cards: adding rocks, cutting spells. Those stay with the player, I-31 and I-02.
- A public land database or land pages. Scryfall owns that job.
- Ordering lands by popularity. EDHREC inclusion may appear as a labelled data column with its n, never as the order.
- A bracket restriction on a land that Wizards does not restrict.
- Running simulations inside this initiative. It calls I-31.
- 60-card formats and Brawl, though Karsten publishes a 60-card formula [2].
- Buying. The handoff stays with I-32.

## Testing strategy

- **Tables (solitary):** every cost in the encoded column returns Karsten's value; the formula gives 40.81 at an average of 3.0 with no cheap pieces and 38.01 with ten; MDFC weights apply by rarity [2][3].
- **Classification (table-driven):** Command Tower, Exotic Orchard (flagged), Polluted Delta (fetch, no `produced_mana`), Evolving Wilds, Fabled Passage, Watery Grave, Blackcleave Cliffs, Drowned Catacomb, Dimir Guildgate, Underground River, a slow land, a bond land, a pathway, Sea Gate Restoration (MDFC) and Gaea's Cradle (Game Changer) each map to the documented facts, from a recorded Scryfall fixture; the network never runs in CI.
- **Proposal (solitary, property-based):** identical inputs give identical output; no land is outside the identity, banned, over the per-card budget or a Game Changer above the bracket limit; the land count equals the chosen count; owned copies cost nothing; an unpriced card never counts as zero.
- **Bracket:** a Bracket 2 deck never receives a Game Changer land; a Bracket 3 deck with three receives none; a Bracket 4 deck receives one only after opting in.
- **Apply (sociable, API and store):** the snapshot exists before rows change; a failure mid-apply leaves the deck and its snapshots unchanged; a stale version gets 409; revert restores exactly when the deck is unchanged and inverts land lines otherwise.
- **No AI:** an import test fails if `src/lib/mana-base/` can reach an AI client; after 9.2, the wizard's prompt contains no land instruction.
- **Wizard fill:** a two-colour short list with three times more pips in one colour gets basics split by targets, not one to one.
- **Accessibility:** the diff and the per-colour table are readable by a screen reader with text labels.

## Delivery slices

| #   | Slice                                                                                                                                                                                     | Depends on                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Karsten's tables as data: 99-card column, partial weights, land formula, MDFC weights, rule of thumb; pure functions with golden tests                                                    | —                                                   |
| 2   | Land classifier (produces, fetch types, entry class) with the dated cycle table, on I-31 slice 2's card mana facts _(one owner, decided 2026-11-10)_                                      | I-31 slice 2                                        |
| 3   | Read-only "Mana base check" replacing the proportional advice: count against formula, drivers, targets against sources, tapped facts; one land definition for MDFCs in stats and playtest | 1, 2                                                |
| 4   | Wizard fill split by source targets (9.1)                                                                                                                                                 | 1                                                   |
| 5   | Land catalogue built from I-67's `CardOracle`, rebuilt on I-67's change events, versioned _(re-pointed 2026-11-10 to I-67 slices 2 and 4)_                                                | 2; I-67 slices 2 and 4                              |
| 6   | Proposal engine: constraints, preference order, reasons, shortfall report; Bracket 5 limits arrive with I-28 slice 2                                                                      | 3, 5                                                |
| 7   | Review and apply: diff, snapshot-then-apply route, 409, apply record, revert                                                                                                              | 6                                                   |
| 8   | Utility slots with the replacement reason; a dated, reviewed list of utility lands by function                                                                                            | 6                                                   |
| 9   | Owned first by name; printings through I-57's resolver                                                                                                                                    | 6; I-57 slice 2                                     |
| 10  | Budget in the EUR market                                                                                                                                                                  | 6; I-32 slices 2 and 3                              |
| 11  | Game Changer status from the deck's rules version                                                                                                                                         | 6; I-48 slice 2                                     |
| 12  | Owned first by uncommitted copies                                                                                                                                                         | 9; I-16 slice 4                                     |
| 13  | Check by simulation through a multi-line I-31 variant                                                                                                                                     | 7; I-31 slices 4, 5 and 8                           |
| 14  | The builder picks the wizard's lands (9.2)                                                                                                                                                | 6; the I-02 owner's agreement                       |
| 15  | Cross-deck allocation optimiser (paid candidate)                                                                                                                                          | 12; **Blocked** on I-30's decision and legal review |

Slices 1, 2 and 4 ship alone. Slice 3 corrects advice players see today. Slices 1–9 are the free product and need nothing outside this table except I-57 slice 2 for slice 9; slices 10–15 wait on other initiatives.

## Open questions

1. **Which count leads?** The formula is scaled from 60-card tournament decks and its author calls it imprecise [2]; it gives about 38 at an average of 3.0 with ten cheap pieces, against measured medians of 35–37, and the guide's [computed plateau](../guides/commander-mulligans-curves-and-play-style.md#land-count-once-mulligans-are-played-well) says the count matters little once mulligans are played well. Keeping the current count by default (2.5) is proposed. Should the formula lead instead?
2. **Where do utility candidates come from?** A reviewed list by function needs an owner. EDHREC's "Utility Lands" list per commander [7] needs I-29's terms review and risks presenting popularity as advice.
3. **Is exact combinatorics a "probability" this initiative may show?** `turn-one.ts` already computes an exact hypergeometric chance. The rule for this initiative allows only cited tables and I-21's seeded simulation, so 6.3 shows facts until I-31. Should an exact calculation of "an untapped source of colour X on turn 1" be allowed earlier?
4. **Default preference order:** fewest tapped, cheapest or owned first?
5. **Catalogue source and refresh:** Scryfall bulk data or batched searches? This research was rate-limited by Scryfall after about twenty searches in quick succession. _Closed 2026-11-10:_ the catalogue is built from [I-67](i67-one-card-data-pipeline.md)'s `CardOracle` and rebuilt on its change events.
6. **Fetch lands in three-plus-colour decks:** apply Karsten's "about two-thirds" always, or only when requirements are heavy [3]?
7. **Should `Deck.budget` become structured** (per card, total, market)? It is one per-card USD number today, and I-17's bands and I-54's deck budget read budgets too.
8. **Paid line:** is cross-deck allocation worth paying for, and does it pass I-30's legal gate (research, not legal advice)?
9. **Corrections for the integrator.** The bracket guide's source 99 says Karsten's land-count page returns 404 and the formula came from a search excerpt; TCGplayer's content API serves it, dated 2022-07-29 [2]. I-31 says the MDFC weights 0.74 and 0.38 come from a secondary guide with no primary link; they are Karsten's land-count weights [2], and his source-count weights for MDFCs are 0.8 and 1 [3].

## Sources

1. Frank Karsten, "What's an Optimal Mana Curve and Land/Ramp Count for Commander?", TCGplayer, 2022-07-15; read through TCGplayer's content API on 2026-11-10. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
2. Frank Karsten, "How Many Lands Do You Need in Your Deck? An Updated Analysis", TCGplayer, 2022-07-29, updated 2025-02-13; read through TCGplayer's content API on 2026-11-10. https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/
3. Frank Karsten, "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022 Update", TCGplayer, 2022-08-02, updated 2025-02-13; read through TCGplayer's content API on 2026-11-10. https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
4. EDHREC, "The Command Zone – Commander Deckbuilding Template for the New Era | The Command Zone 658", 2025-02-18 (chapters and show notes). https://edhrec.com/articles/the-command-zone-commander-deckbuilding-template-for-the-new-era-the-command-zone-658-mtg-edh-magic-gathering
5. Bennie Smith, "Foundations: How to Build Mana Bases", EDHREC, 2024-11-29. https://edhrec.com/articles/foundations-how-to-build-mana-bases/
6. Tyler Bucks, "The Big List of Budget Dual Lands in Commander", EDHREC, 2025-08-19. https://edhrec.com/articles/the-big-list-of-budget-dual-lands-in-commander
7. EDHREC, commander page JSON for Omnath, Locus of Mana, read 2026-11-10. https://json.edhrec.com/pages/commanders/omnath-locus-of-mana.json
8. mtg.land, "The Land Database & Manabase Toolkit", undated, read 2026-11-10. https://mtgland.pages.dev/
9. mtg.land, "Best Manabase for Omnath, Locus of Mana", undated, read 2026-11-10. https://mtgland.pages.dev/commanders/omnath-locus-of-mana
10. ScrollVault, MTG Mana Base Calculator, undated, read 2026-11-10. https://scrollvault.net/tools/manabase/
11. DeckFlow, Mana Base Analyzer, undated, read 2026-11-10. https://www.deckflow.gg/manabase
12. EDHTuner, Methodology, undated, read 2026-11-10. https://edhtuner.com/methodology
13. Draftsim, MTG Land Calculator, updated 2026-06-12, read 2026-11-10. https://draftsim.com/mtg-land-calculator
14. Archidekt, "Development Update – Deck Stats", edited 2024-09-23, read 2026-11-10. https://archidekt.com/news/9287631
15. Wizards of the Coast, "Commander Brackets Beta Update – October 21, 2025", 2025-10-21, read 2026-11-10. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
16. Scryfall API, search `is:gamechanger` (53 cards) and `is:gamechanger t:land` (7 cards) with USD and EUR prices, retrieved 2026-11-10. https://scryfall.com/search?q=is%3Agamechanger+t%3Aland
17. Scryfall API, card objects for Command Tower, Polluted Delta, Watery Grave, Exotic Orchard, Evolving Wilds, Sea Gate Restoration, Blackcleave Cliffs, Drowned Catacomb, Dimir Guildgate and Underground River (`produced_mana`, `game_changer`, `prices`), retrieved 2026-11-10. https://api.scryfall.com/cards/collection
18. Scryfall search keywords for land cycles (`is:dual`, `is:fetchland`, `is:shockland`, `is:fastland`, `is:checkland`, `is:slowland`, `is:painland`, `is:bounceland`, `is:gainland`, `is:pathway`, `is:triland`, `is:bikeland`, `is:filterland`, `is:battleland`, `is:scryland`, `is:bondland`, `is:canopyland`, `is:creatureland`, `is:surveilland`, `is:shadowland`, `is:snarl`), each returning cards on 2026-11-10. https://scryfall.com/search?q=is%3Afastland
