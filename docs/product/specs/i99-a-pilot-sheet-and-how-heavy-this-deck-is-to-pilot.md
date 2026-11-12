# I-99: A Pilot Sheet, And How Heavy This Deck Is To Pilot

> **Initiative:** I-99, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-12 · **Priority:** Next for slices 0 to 8 (the timing classes, the turn-length drivers, the pilot load with its factors, the builder panel, the printable sheet, the Rule 0 line, the pre-game question and the shared complexity formula); Later for slices 9 to 13, which wait for the owner's labelled fixture, I-34's reports, I-35's game log, an owner decision on public pages and the surfaces of I-19, I-93, I-79 and I-94 · **Paid:** never · **Written 2026-11-12**
> **Placement:** a fourth card taxonomy for one deck, beside [I-65](i65-how-this-deck-wins.md)'s route roles (how the deck ends a game), [I-78](i78-what-this-deck-does-to-the-table.md)'s table effects (what it does to the other players) and [I-31](i31-deck-lab.md)'s lab kinds (mana). This one answers what the deck asks of the person holding it: what to remember at each step of the turn, what to track, and what makes its turns long. [I-54](i54-find-your-next-commander.md) 3.3 scores one card's complexity, the commander's; I-99 reads that formula for every card and aggregates it. [I-19](i19-offline-game-night-viewing.md) owns the tokens and game pieces a deck needs; the sheet prints I-19's list and defines none of its own.
> **Research:** one dated note of 2026-11-12, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public search on 2026-11-12, restricted to Commander-legal cards (`f:commander`, 32,643 cards that day). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the timing classes (when a card asks the pilot to act or remember) and the turn-length drivers (what makes a turn long), their versioned definitions, the per-card matches with their exact and heuristic labels, the deck's pilot profile and its load band with every factor shown, the pilot sheet on screen and on paper, the pilot line offered to I-15's sheet and I-88's script, and the builder panel. **Does not own:** the clause format and the verdict-word list (I-65 slice 1, shared); the extra-turn, monarch and initiative classes (I-78); tokens, counters and game pieces (I-19); the per-card complexity formula's first home (I-54 slice 4, moved to the shared module in slice 8); the Rule 0 sheet and its fields ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); the authored question list ([I-88](i88-a-pre-game-script-that-fills-the-rule-0-sheet.md)); game logs ([I-35](i35-pod-game-log.md)); the methods page and reports ([I-34](i34-commander-data-reports.md)); versioned rule anchors ([I-47](i47-rules-answers-for-this-deck.md) slice 2); the glossary ([I-64](i64-help-centre-and-guidance.md) slice 2).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I-54       | Slice 4's complexity formula ("words of rules text, triggered and activated abilities, choices and modes, extra command-zone pieces, and colours") becomes one `cardComplexity(card)` in the shared deck-analysis module (I-99 slice 8). I-54 reads it for the commander; I-99 reads it for every card. The formula and its fixture stay I-54's. |
| I-78       | No new class. I-99 reads `extraTurn`, `monarch` and `initiative` matches from I-78 slice 1 and defines extra combats itself, since I-78 has no such class.                                                                                                                                                                                       |
| I-65       | No change to slice 1's clause format. I-99 adds its own definition files in that format, with a `timing` attribute on each class.                                                                                                                                                                                                                |
| I-19       | Its game-piece list (the monarch, the initiative, the Ring, day and night, dungeons, emblems, energy, experience and poison) is printed in the sheet's "Things to track" block when it exists. I-19 keeps the list; the sheet shows "not listed yet" until then, never an invented list.                                                         |
| I-15       | The calculated column gains the pilot line beside I-77's estimate, I-65's route line and I-78's table line (I-99 slice 6). It is computed and labelled computed; it never overwrites a declared field.                                                                                                                                           |
| I-88       | One authored question, "How long are your turns, usually?", with the pilot line as its hint, writes I-15's declared speed or a new free-text field the owner names (I-99 slice 7). The owner confirms the wording; the script keeps "no question that is not in the authored list".                                                              |
| I-35       | `PodGame` gains an optional `durationMinutes` (a fold from the thirteenth pass, recorded in I-35). I-99 slice 11 reads it, and nothing else does until then.                                                                                                                                                                                     |
| I-34       | The methods page gains one row per heuristic class with its precision (slice 9), and the reports gain "pilot load by declared bracket" with n and a 95% interval (slice 10).                                                                                                                                                                     |
| I-93       | The reading route gains a "What to remember" tab that shows the timing blocks of the sheet for the card sequence it already reads (slice 13).                                                                                                                                                                                                    |
| I-83       | The primer draft gains one offered section, "How it plays", filled from the sheet's timing blocks and the pilot line; the player copies or discards it as with every other line.                                                                                                                                                                 |
| I-47, I-64 | Each timing class links its CR rule through I-47's anchors (502 untap, 504 draw step, 507 beginning of combat, 508 declare attackers, 513 end step, 603 triggered abilities, 614 replacement effects) and its term through I-64's glossary (upkeep, trigger, replacement effect, optional trigger).                                              |

## Overview

Two complaints recur at Commander tables, and both are about the person holding the deck rather than the deck's power. The first is the forgotten trigger: EDHREC's advice column of 2026-09-09 describes a player who "miss[es] half their triggers, tap[s] things wrong, and fumble[s] through a 10-minute turn" with "a poorly piloted trigger-heavy deck that eats up 80% of time during a game" [3]. The second is the long turn itself. Wizards wrote in October 2025 that "we heard from a lot of people that length of game is an important factor for them", and set a minimum number of turns per bracket [2]; a r/EDH post about a chess clock built after "an 11-hour cEDH match" reached 593 points [5].

Nothing in the product or in the market read tells a player, before the game, what their own deck will ask of them. This initiative computes it from the Oracle text the deck already stores. For one deck it lists, by step of the turn, every card that asks the pilot to act or remember; counts the things that make a turn long (library searches, shuffles, per-object arithmetic, table-wide effects, extra turns and combats, dice and coins, modal choices, optional triggers); and gives the deck a pilot load, light, moderate or demanding, with every factor and its threshold shown. It prints a one-page pilot sheet, and offers one line to the Rule 0 sheet so the table hears "my turns can be long when the token engine is online" before the first shuffle.

**Why a new initiative.** No initiative owns what a deck asks of its pilot. I-54 scores the complexity of one card, the commander. I-78 says what the deck does to the other players. I-65 says how it wins. I-19 lists the tokens and pieces to bring. I-83 drafts a primer from stored fields. None groups the deck's triggers by when they happen, and none measures what makes a turn long. **Why Next.** The definitions, the panel and the sheet need no new data source, no table and no model; they read stored Oracle text and the clause module I-65 slice 1 builds. The line for the Rule 0 sheet is the cheapest answer to a problem Wizards itself wrote into the brackets. **Why some of it is Later.** Precision and the norms need the owner's labelled fixture and I-34's reports; the game-length check needs I-35's log.

## What the market does

All rows were read on 2026-11-12 unless dated otherwise.

| Product or source                                         | What it does or says                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Source       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Wizards, Commander Brackets Beta** (2025-02-11)         | Exhibition: "The games here are likely to go long and end slowly." Core: "generally goes nine or more turns". Upgraded: "games tend to be a little faster as well, ending a turn or two sooner". Optimized: "games have the potential to end quickly." Its Q&A: "extra-turn spells take a ton of time away from other players and their ability to play the game"                                                                                                                                                | [1]          |
| **Wizards, Brackets update** (2025-10-21)                 | "We heard from a lot of people that length of game is an important factor for them." A minimum number of turns per bracket: "at least nine turns" (Exhibition), eight (Core), six (Upgraded), four (Optimized); cEDH "could end on any turn", with "Gameplay to be intricate and advanced, with razor-thin margins for error". The tutor restriction is removed                                                                                                                                                  | [2]          |
| **EDHREC, "Am I the Bolas?"** (2026-09-09)                | The submission: "miss half their triggers, tap things wrong, and fumble through a 10-minute turn"; "a poorly piloted trigger-heavy deck that eats up 80% of time during a game". The verdict: "Everybody tracks the triggers collectively."; "if someone routinely spends over ten minutes a turn or even averages five minutes a turn, a conversation needs to happen"                                                                                                                                          | [3]          |
| **EDHREC, "Am I the Bolas?"** (2025-10-01)                | A reader expects "a ten-turn game, give or take, with Bracket 2 or 3 decks"; the fix is "a chat with everybody about what your expectations are"                                                                                                                                                                                                                                                                                                                                                                 | [4]          |
| **EDHREC, most annoying mechanics to track** (2025-12-22) | "there are so many things in the game we have to keep track of"; "Everyone is checking at upkeep, but still forgetting it."; floating mana, +1/+1 counters, day and night, Scute Swarm, the dungeon and the initiative                                                                                                                                                                                                                                                                                           | [6]          |
| **Commander's Herald** (2023-01-16; 2022-12-10)           | "turns shouldn't take too long so that the rest of the table is able to spend more time playing"; a Level 3 judge: "Every trigger can be missed. Players are simply held to a higher standard at Competitive tournaments."                                                                                                                                                                                                                                                                                       | [7][8]       |
| **Magic Judges, missed-trigger guides** (2026-03-08)      | One guide per set lists the cards whose triggers "upgrade to a Warning when missed". Competitive play keeps a per-card list of what a pilot must not forget                                                                                                                                                                                                                                                                                                                                                      | [9]          |
| **r/EDH**                                                 | "After an 11-hour cEDH match at a live tournament, I built a chess clock for Commander" (2025-05-28, 593 points, 115 comments). "PSA: lifetap has a turn timer built in. Normalize its use to deal with slow players" (2025-03-24, 530 points). "Any suggestions for Commanders that aren't too complex to play" (2025-04-06, 36 points, 98 comments). "Looking for strong B3 commander with steep learning curve and complexity" (2026-08-04, 48 comments). "Rules for a turn timer?" (2025-01-02, 69 comments) | [5]          |
| **TappedOut forum** (2020-08-01)                          | How players track triggers today: "I use a die or a coin on top of my deck to remember triggers."; "placeholder cards to mark some other common stack triggers"                                                                                                                                                                                                                                                                                                                                                  | [10]         |
| **BoardGameGeek, weight**                                 | A five-point, user-voted complexity rating shown on every game page, with the tooltip "difficulty to understand"; the wiki says "Weight isn't clearly defined" (search summary; the page refused automated reads)                                                                                                                                                                                                                                                                                                | [11]         |
| **Decks of KeyForge**                                     | A score written as its own equation, with hoverable terms (cited by I-77 and I-78): the pattern this spec follows for the load band                                                                                                                                                                                                                                                                                                                                                                              | I-77         |
| **Rate My Decks; ScryCheck; EDHTuner** (v0.250.0)         | Free Commander analysers: a power score over 12 factors; five vectors; goldfish speed and swaps. None measures triggers to track, turn length or pilot difficulty; "speed" means how fast the deck wins, not how long its turns take                                                                                                                                                                                                                                                                             | [12][13][14] |
| **Playgroup.gg; Mythic Tools**                            | Game logs that record a game's length or a deck's win rate after the fact ([I-35](i35-pod-game-log.md) [1]; the [product direction](roadmap-context.md#product-direction)). Neither reads a list before the game                                                                                                                                                                                                                                                                                                 | I-35         |
| **This product**                                          | `scoreBracket` averages six dimensions, `winSpeed` among them (`src/lib/deck/bracket.ts`); I-54 3.3 plans a complexity score for the commander's card alone. No code groups triggers by step or counts searches, shuffles or per-object arithmetic                                                                                                                                                                                                                                                               | code         |

**The gap.** Game length is official bracket language, trigger tracking is a judge-policy category and a recurring advice-column topic, and players build chess clocks. Yet every tool read measures the deck's power and none measures what the deck asks of its pilot. The product holds the Oracle text to do it.

## Current state in this codebase

Verified on `dev` at `db3d45fb` (#1404) on 2026-11-12:

- **Oracle text is stored per deck card.** `DeckCard.oracleText`, `typeLine`, `manaCost`, `cmc` and `quantity` (`prisma/schema.prisma`) let the browser compute a profile from the deck it already holds, as I-78 slices 1 to 3 plan. Scryfall's `oracle_text` carries reminder text in parentheses.
- **No timing anywhere.** No file under `src` matches "upkeep", "end step", "triggered abilit" or "replacement effect" except a partner fixture. `detectThemes` (`src/lib/deck/themes.ts`) counts "whenever you cast a spell" and "whenever a creature dies" as theme hits, with no step and no count per 99.
- **Searches and extra turns are power heuristics.** `isTutor` (`src/lib/deck/categories.ts`) and `detectGameChanger` (`src/lib/deck/validation.ts`) match "search your library" and "take an extra turn" to label power, not time. `scoreWinSpeed` (`src/lib/deck/bracket.ts`) feeds the bracket estimate.
- **Phase names exist in French for the playtest.** `src/messages/fr/playtest.json` already translates "Upkeep" as "Entretien"; the other step names the sheet needs are not yet in any catalogue.
- **Printing exists for proxies only.** The only print stylesheet is `ProxyExportModal.tsx`; `src/lib/deck/proxy.ts` builds card-sized slots. No text-only printable page exists.
- **Game logs record turns, not minutes.** `PlaytestSession.turns` is the goldfish's turn count; I-35's planned `PodGame` has `endedOnTurn` and no duration.
- **The commander's complexity is planned, not built.** `complexityScore` and `complexityFactors` are columns of I-54's planned catalogue (I-54 slice 4); nothing computes them yet.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `deck-analysis`. Code goes under `src/modules/deck-analysis/domain/pilot/` as readonly types and pure functions ([ADR 0003](../../adr/0003-domain-as-readonly-data-and-pure-functions.md)), the panel and the sheet under `src/modules/deck-analysis/ui/`, and the printable page under `src/app/[locale]/deck/[id]/pilot-sheet/`. Slices 1 to 8 write nothing to the database.

## Functional requirements

### 1. Principles

1.1 Every class, match, count, factor and band is computed by code from card text, type lines and versioned definitions. No language model chooses, ranks, phrases or hides anything ([strategic boundaries](roadmap-context.md#strategic-boundaries)).
1.2 Every match shows the clause that produced it (an excerpt of at most 140 characters) and the definition version; every factor shows its count, its count per 99 cards and its threshold.
1.3 The profile describes a deck's demands, never a player or a deck's worth. No template contains "slow", "boring", "bad", "annoying", "too long", "lent", "ennuyeux" or "mauvais"; the verdict-word test of [I-65 1.3](i65-how-this-deck-wins.md#1-principles) runs on every template with those words added. "Demanding" describes the load; the sentence beside it always says what to remember, not what to change.
1.4 Each class carries one label, I-78's `Certainty`: **exact** when the clause is a step name, a keyword or a type line; **heuristic** when it is a phrasing pattern whose meaning varies ("for each", "you may"); **notChecked** when a source the class reads is unavailable.
1.5 Reminder text in parentheses is removed before any clause matches.
1.6 The profile is private to the owner by default (requirement 7). It works with the copilot switched off and with Spellbook unavailable.

### 2. Timing classes, definitions version 1

2.1 A timing class answers "when does this card ask something of me?". Six groups: your turn, combat, other players' turns, events, standing effects, costs to pay. Counts are Commander-legal cards whose Oracle text contains the phrase (**computed**, 2026-11-12).

| Group         | Class                   | Clause examples                                                                                              |  Legal cards (computed) | CR  | Certainty |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------: | --- | --------- |
| Your turn     | Your upkeep             | "at the beginning of your upkeep"                                                                            |                     845 | 502 | exact     |
| Your turn     | Every upkeep            | "at the beginning of each upkeep" (70), "at the beginning of each player's upkeep" (83)                      |                     153 | 502 | exact     |
| Your turn     | Your draw step          | "at the beginning of your draw step"                                                                         |                      16 | 504 | exact     |
| Your turn     | Your end step           | "at the beginning of your end step"                                                                          |                     466 | 513 | exact     |
| Your turn     | Every end step          | "at the beginning of each end step"                                                                          |                      94 | 513 | exact     |
| Combat        | Beginning of combat     | "at the beginning of combat on your turn" (314); "at the beginning of combat" (322)                          |                     322 | 507 | exact     |
| Combat        | On attack               | "whenever ~ attacks" (1,165), "whenever you attack" (175), "whenever a creature you control attacks" (46)    |                   1,386 | 508 | exact     |
| Others' turns | On other players' turns | "whenever an opponent" (192), "whenever a player" (195), "during each opponent's" (11)                       |                     398 | 603 | exact     |
| Events        | When you cast           | "whenever you cast"                                                                                          |                     997 | 603 | exact     |
| Events        | When a creature enters  | "whenever a creature you control enters" (46), "whenever another creature enters" (13), "whenever ~ enters"  |  59 and own-card enters | 603 | exact     |
| Events        | When a creature dies    | "whenever a creature dies" (37), "whenever another creature you control dies" (29)                           |                      66 | 603 | exact     |
| Events        | When a land enters      | the landfall keyword                                                                                         |                     201 | 603 | exact     |
| Events        | When you gain life      | "whenever you gain life"                                                                                     |                      96 | 603 | exact     |
| Standing      | Replacement effects     | "instead" in a sentence with "would"                                                                         | 1,009 mention "instead" | 614 | heuristic |
| Costs         | Costs to pay            | cumulative upkeep (86), echo (50), "at the beginning of your upkeep, sacrifice" (114), "unless you pay" (94) |                     344 | 702 | exact     |
| Any           | Optional triggers       | "you may" inside a sentence that starts with "whenever", "when" or "at the beginning of"                     | 1,839 hold both phrases | 603 | heuristic |

2.2 Each definition holds an id, a version, its group, its timing (the step it fires in, or `event` or `standing`), its certainty, English and French names and one-line definitions, its clauses in [I-65 slice 1](i65-how-this-deck-wins.md#delivery-slices)'s format, and its CR rule as numbered in the Comprehensive Rules the product serves (effective 2026-08-07, `src/lib/rules/data/MagicCompRules-20260807.txt`), linked through I-47 slice 2's anchors once they exist.
2.3 A card may match several classes; it is listed once per class. "Optional" is a flag on a match, not a class of its own on the sheet: the card appears in its timing block with the optional mark ◇.
2.4 Things to track (the monarch, the initiative, the Ring, day and night, dungeons, emblems, energy, experience and poison) are I-19's game pieces. The sheet prints I-19's list and adds none.

### 3. Turn-length drivers, definitions version 1

3.1 A driver is a count of cards whose resolution takes table time. Counts per 99 cards use the main deck plus the command zone, quantities expanded; the Considering and Sideboard boards count for nothing.

| Driver                 | Clause examples                                                                                          | Legal cards (computed) | Certainty |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------: | --------- |
| Library searches       | "search your library"                                                                                    |                    877 | exact     |
| Shuffles               | "shuffle"                                                                                                |                  1,213 | exact     |
| Per-object arithmetic  | "for each"                                                                                               |                  1,681 | heuristic |
| Table-wide effects     | "each opponent" (996), "each player" (756)                                                               |                  1,752 | heuristic |
| Extra turns            | I-78's `extraTurn` class (51 by "take(s) an extra turn"; 57 mention "extra turn")                        |                 I-78's | exact     |
| Extra combats          | "additional combat phase"                                                                                |                     46 | exact     |
| Randomness             | "flip a coin", "roll a d", "roll a six-sided die"                                                        |                    141 | exact     |
| Modal choices          | "choose one", "choose two"                                                                               |     727 ("choose one") | exact     |
| Copies and storm       | the storm keyword (33), "copy that spell" (75)                                                           |                    108 | heuristic |
| Multipliers            | "twice that many"                                                                                        |                     28 | heuristic |
| Untap effects          | "untap all"                                                                                              |                     91 | heuristic |
| Repeatable activations | an activated ability whose cost has no `{T}` and no sacrifice, from the cost grammar                     |                    n/a | heuristic |
| Reading load           | words of rules text per card, from I-54's `cardComplexity` (slice 8); the average and the top five cards |                    n/a | exact     |
| Planeswalkers          | the type line                                                                                            |                    n/a | exact     |

3.2 Each driver shows its cards by name on expand. The same card may count for several drivers (a fetch land is a search and a shuffle).
3.3 Drivers are counts, never minutes. The product does not predict a game's length; Wizards' "at least N turns" lines are quoted as the official expectation per bracket, beside the deck's declared bracket, and never recomputed.

### 4. The pilot load

4.1 `computePilotLoad(profile, thresholds)` returns a band, `light`, `moderate` or `demanding`, and every factor with its per-99 count, its low and high thresholds and whether it is above the high one.
4.2 Factors, version 1: timed triggers (your upkeep, your end step, beginning of combat, every upkeep, every end step); event triggers (the events group); library searches plus shuffles; table-wide effects plus per-object arithmetic; extra turns plus extra combats; randomness; optional triggers; reading load (average words of rules text).
4.3 **Band rule:** `demanding` when two or more factors are above their high threshold; `light` when every factor is below its low threshold; `moderate` otherwise. The rule and the thresholds are data, versioned, and shown in the panel.
4.4 **Starting thresholds, per 99 cards**, proposals for [D-96](../owner-decisions.md#product-scope-and-non-goals) until slice 9's fixture and slice 10's norms replace them: timed triggers low 4, high 12; event triggers low 6, high 18; searches and shuffles low 3, high 10; table-wide and per-object low 5, high 14; extra turns and combats low 0, high 3; randomness low 0, high 3; optional triggers low 3, high 10; reading load low 25 words, high 45 words. Each is a proposal, labelled so in the panel.
4.5 The band is never shown alone. The sentence beside it names the two largest factors: "Demanding: 14 timed triggers and 11 library searches per 99 cards."
4.6 The **pilot line** is one sentence for I-15 and I-88: "Pilot load: {band}. {n} timed triggers, {s} library searches, {x} extra turns or combats per 99 cards." In French: "Charge de pilotage : {band}. {n} déclencheurs à heure fixe, {s} recherches dans la bibliothèque, {x} tours ou combats supplémentaires pour 99 cartes."

### 5. The pilot sheet

5.1 The sheet is the profile laid out in turn order, on screen and on one printed page (A4 and Letter), with a second page only when the lines overflow. Blocks: Untap and upkeep; Draw step; Beginning of combat; Attacks; End step; On other players' turns; When you cast, when a creature enters, when a creature dies, when a land enters, when you gain life; Standing effects to remember; Costs to pay; Things to track (I-19's list, or "not listed yet"); Turn-length drivers (counts only); the pilot line.
5.2 Each line is the card's name, its quantity when above one, the matched clause excerpt (at most 140 characters), the optional mark ◇ where it applies, and "command zone" where it applies. No card image. No Oracle text beyond the matched clause: the full text stays on screen through the card catalogue.
5.3 The footer names the deck, the snapshot or the deck version it was printed from, the definitions version and the date, in the form I-86 uses, so a sheet left in a deck box can be told from the current list.
5.4 Print: black on a white page, at least 11 pt, no colour-only marker (I-49), the optional mark a glyph with a legend. Screen: the same blocks, each foldable, in both themes.
5.5 The sheet is reachable from the builder panel and the owner's deck page. For a public deck it is reachable only after slice 12's switch.

### 6. The Rule 0 line and the pre-game question

6.1 I-15's calculated column shows the pilot line beside I-77's estimate, I-65's route line and I-78's table line (slice 6). It is computed, labelled computed, and never overwrites a declared field. "Copy into my sheet" puts the sentence in the declared speed note for the player to edit.
6.2 I-88's script gains one authored question, "How long are your turns, usually?", whose hint is the pilot line and whose answer writes the field I-15 names for it (slice 7). The owner confirms the wording before it joins the authored list.

### 7. Where the profile shows

7.1 **Builder panel** "Piloting this deck", beside the combos panel, private to the editor: the band with its two largest factors, then the timing blocks, then the drivers, each line expanding to its clause.
7.2 **Owner's deck page:** the same panel read-only, and the link to the sheet.
7.3 **Public deck page (slice 12):** off by default; the owner's switch shows the sheet and the line; the shared and public projections exclude them while the switch is off.
7.4 **Offline download (I-19 slice 2), the reading mode (I-93), table sets (I-79) and pinned lists (I-94):** the sheet or the line where each surface shows a deck, in slice 13, each following that surface's own visibility rule.

### 8. Evidence, precision and norms

8.1 Card fixtures name a card for each clause of each class and for each known near-miss (Testing strategy).
8.2 The owner labels about 30 decks, the Commander preconstructed decks of 2025 and 2026 among them, with the classes each card belongs to and the band a careful player would give the deck. Precision and recall per heuristic class go on I-34's methods page (slice 9). A heuristic class below the owner's floor (D-96) leaves the sheet and the line and stays in the panel marked "low precision", as I-78 7.3 does.
8.3 **Norms** (slice 10): the distribution of pilot load by declared bracket over the product's public decks from eligible accounts ([I-75](i75-finding-public-decks.md) slice 1), with n and a 95% interval, as an I-34 report, suppressed below I-34's minimum sample. Nothing read publishes such a figure.
8.4 **Game length** (slice 11): once I-35 logs `durationMinutes`, the association between a deck's band and the length of the games it was played in, with n and an interval, on the methods page. The report states that the pilot, the table and the other three decks are not controlled for, and makes no causal claim.

### 9. Wording and locales

9.1 Every sentence comes from a template with typed slots (class, step, counts, card names, threshold, rule). Templates, class names and definitions exist in English and French at launch, and pass the verdict-word test (1.3).
9.2 French step names follow the official French rules vocabulary: entretien, étape de pioche, début du combat, déclaration des attaquants, étape de fin, capacité déclenchée, effet de remplacement. The playtest's existing "Entretien" is reused, not duplicated.
9.3 Each class has an info button to I-64's glossary and, where a CR rule applies, to I-47's versioned anchor.

### 10. Free and paid

| Part                                                                              | Free | Paid candidate | Why                                                                                                                                                                    |
| --------------------------------------------------------------------------------- | ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definitions, the profile, the panel, the sheet, the line, the question, the norms | Yes  | —              | Evidence about the player's own list stays free ([I-30 1.1 and 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)), and the norms are I-34's free data |

## Data model / API

```
PilotGroup       yourTurn | combat | othersTurns | events | standing | costs
Timing           untap | upkeep | draw | main | beginningOfCombat | declareAttackers | endStep | othersTurns | event | standing
TimingClassId    yourUpkeep | everyUpkeep | yourDrawStep | yourEndStep | everyEndStep | beginningOfCombat | onAttack
                 | othersTurns | onCast | onEnters | onDies | onLandfall | onLifeGain | replacementEffect | costToPay
DriverId         librarySearch | shuffle | perObjectMath | tableWide | extraTurn | extraCombat | randomness | modalChoice
                 | copiesAndStorm | multipliers | untapEffects | repeatableActivation | readingLoad | planeswalkers
Certainty        exact | heuristic | notChecked                        -- I-78's type, shared
Clause           from I-65 slice 1: oracleText{pattern, scope} | keywordAction{name, crRule} | officialFlag{field}
                 | spellbook{cardCount} | tagger{tag}
PilotClassDef    id, version, group, timing, certainty, nameEn, nameFr, definitionEn, definitionFr, crRule?, clauses[]
DriverDef        id, version, certainty, nameEn, nameFr, definitionEn, definitionFr, clauses[] | from: I-78 classId | derived
CardPilotMatch   cardName, quantity, commandZone, classId, clauseId, excerpt (≤ 140 chars), optional, certainty
DriverCount      driverId, count, per99, certainty, cards[]
LoadBand         light | moderate | demanding
LoadFactor       id, per99, low, high, aboveHigh, certainty
PilotLoad        band, factors[], rule: "two-or-more-high", thresholdsVersion
PilotProfile     inputHash, definitionsVersion, librarySize (99 | 98), timings[]{classId, matches[]}, drivers[], load, line
PilotSheet       deckName, versionLabel, dataAsOf, definitionsVersion, blocks[]{timing, lines[]}, pieces?: from I-19, driversSummary, line
```

- `classifyPilotCard`, `countDrivers`, `computePilotLoad`, `computePilotProfile` and `renderPilotLine` are pure functions in `src/modules/deck-analysis/domain/pilot/`. `TimingClassId` and `DriverId` are unions with exhaustive `never` guards. The thresholds are a versioned data file beside the definitions.
- Slices 1 to 8 add no table and no route: the builder computes on the client from the deck it holds, and I-15 computes the line from the deck it already reads.
- Slice 12 adds `GET /api/decks/[id]/pilot`, which applies the owner's visibility and caches by `inputHash`, and the sheet page for public decks.

## Non-goals

- A turn timer, a chess clock, a life counter or any live table companion: the table companion is a different product ([the 2027 sweep](README.md#what-the-sweep-ruled-out-for-2027)), and I-93 has no life total.
- A verdict on a deck or a player: no "slow deck", no pilot skill rating, no ranking by load. The band describes demands and always comes with its factors.
- A prediction of game length in minutes. Counts and Wizards' quoted expectations only, until slice 11 reports a measured association with its limits.
- A model that writes the sheet or picks what to remember. Templates only.
- Tokens, counters and game pieces: I-19 owns the list. Rulings and rules text: I-47. The route line: I-65. Table effects: I-78.
- Reading other players' lists for their load before I-94 and I-15 say how, and never for a deck the other player kept private.

## Testing strategy

- **Classes (solitary):** one fixture card per clause and per near-miss: "at the beginning of your upkeep" against "at the beginning of each opponent's upkeep"; "search your library" against "search your graveyard"; a fetch land counted as a search and a shuffle; "for each" inside reminder text ignored after stripping; "you may" in an activated ability not flagged optional; a card with two triggers listed in both blocks once each. An unknown class or driver id fails to compile.
- **Counts (solitary):** quantities expanded; the commander and a partner marked "command zone" and counted; library size 99 or 98 with a partner; Considering and Sideboard ignored; per-99 values to one decimal.
- **Load (solitary):** a fixture at each band; the band rule with exactly two factors above high; a threshold change by data changes the band without a code change; every factor present in the output, zeros included.
- **Templates and wording:** English and French templates fill the right numbers; the verdict-word scan passes and fails on a template with "slow" or "lent"; the pilot line is one sentence in both languages.
- **Sheet:** a snapshot test of the printed layout at A4 and Letter with a 45-line deck and a 70-line deck (second page); no image URL in the sheet's markup; the footer carries the version label and the date; contrast and glyph legend checked.
- **Determinism:** two shuffled inputs give one profile byte for byte (I-78 4.2).
- **Projections (sociable):** the shared and public responses contain no profile, line or sheet while the switch is off (schema test); I-15's calculated column shows the line labelled computed and leaves the declared speed untouched.
- **Accessibility and layout:** every block and control has a name and a keyboard path; the band is a word and an icon, not a colour; at 360 px the blocks stack with their headers kept.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: a deck holding Phyrexian Arena yields one `yourUpkeep` match whose excerpt starts with "At the beginning of your upkeep".

## Delivery slices

| #   | Slice                                                                                                                                                            | Depends on                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 0   | Owner: the band words, the starting thresholds, the precision floor, and whether the line shows on the Rule 0 sheet by default (D-96)                            | — (owner)                                                |
| 1   | Timing classes v1 as versioned data in I-65's clause format; `classifyPilotCard`; reminder-text stripping; the optional flag; card fixtures                      | I-65 slice 1                                             |
| 2   | Turn-length drivers v1 with per-99 counts, reading I-78's `extraTurn`; `countDrivers`; fixtures                                                                  | 1; I-78 slice 1                                          |
| 3   | The pilot load: thresholds as data, `computePilotLoad`, the factors, `renderPilotLine`; English and French templates; verdict-word test                          | 2; D-96                                                  |
| 4   | Builder panel "Piloting this deck", private, and the owner's deck page                                                                                           | 3                                                        |
| 5   | The pilot sheet: on-screen view and the printable page; I-19's game pieces when present; the version footer                                                      | 4                                                        |
| 6   | Rule 0 sheet: the pilot line in the calculated column; "copy into my sheet"                                                                                      | 3; I-15 slice 2                                          |
| 7   | Pre-game script: the authored question with the line as its hint                                                                                                 | 6; the owner's wording; I-88's script                    |
| 8   | `cardComplexity` in the shared module, read by I-54 for the commander and by I-99 for the reading-load driver                                                    | 2; coordinate with I-54 slice 4                          |
| 9   | Owner-labelled fixture of about 30 decks, the 2025 and 2026 precons included; precision and recall per heuristic class on the methods page; the floor rule (8.2) | 3; I-34 slice 3; the owner's labels                      |
| 10  | Norms: pilot load by declared bracket, with n and a 95% interval, as an I-34 report                                                                              | 9; I-34 slice 4; I-75 slice 1                            |
| 11  | Logged game length against pilot load: association with n and an interval, no causal claim                                                                       | 10; I-35 slice 1 with `durationMinutes`                  |
| 12  | Public deck page: the owner's switch, `GET /api/decks/[id]/pilot` and the public sheet page                                                                      | 5; owner decision (D-96)                                 |
| 13  | The sheet or the line on I-19's download, I-93's reading route, I-79's seats and I-94's pinned lists                                                             | 5; I-19 slice 2; I-93's route; I-79 slice 4; I-94's view |

Slices 1 to 8 need no new data source and no stored state. Slice 1 cannot start before I-65 slice 1 publishes the clause module, and slice 2 before I-78 slice 1 fills the extra-turn class; both are listed as able to start now on the [dependency page](dependency-graph.md). Scheduled agents must not pick slice 0 (the owner's), slice 7 before the owner's wording is committed, or slice 12 before D-96 is committed.

## Open questions

1. **D-96.** The band words ("light, moderate, demanding" in English; "légère, modérée, exigeante" in French, to be checked by a French-speaking player); the starting thresholds of 4.4; the precision floor for heuristic classes (recommended 0.8 on the fixture, as I-78 proposes); whether the pilot line shows on the Rule 0 sheet by default (recommended yes, since the sheet's purpose is the pregame conversation Wizards describes [1][2]) and on the public page (recommended off, as I-78 7.1 has it).
2. **The authored question.** Does "How long are your turns, usually?" join I-88's list, and does its answer write I-15's declared speed or a new field? Recommended: the declared speed, so no field is added.
3. **Reading load.** Is the average words of rules text a fair factor when a deck's longest cards are the commander and a few engines? Recommended: show the average and the top five cards, and let slice 9's fixture decide whether the average stays a band factor.
4. **Repeatable activations.** The cost grammar ("{1}:", "{U}, {T}:") is heuristic. Recommended: version 1 counts activated abilities without `{T}` and without a sacrifice in the cost, labelled heuristic, and slice 9 measures it.
5. **For the lawyer (research, not legal advice; add to [L-18](../legal-questions.md#l-18-the-comprehensive-rules-and-wizards-rulings)):** a printed sheet quotes, for the player's own use, the triggering clause of each card (at most 140 characters) beside the card's name, with no image and no full Oracle text. Does that stay within the Fan Content Policy and Scryfall's terms, as the proxy sheet's names already do? Recommended until answered: ship the on-screen sheet, and ship the printed page with clause excerpts only after the answer, or with names and step headings alone if the answer is no.

## Sources

Read on 2026-11-12 unless stated otherwise. Reddit scores and comment counts are as archived by [Arctic Shift](https://arctic-shift.photon-reddit.com/), title searches over r/EDH from 2025-01-01.

1. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11: "The games here are likely to go long and end slowly." (Exhibition); "generally goes nine or more turns" (Core); "ending a turn or two sooner" (Upgraded); "games have the potential to end quickly" (Optimized); "extra-turn spells take a ton of time away from other players". <https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta>
2. Wizards of the Coast, "Commander Brackets Beta Update – October 21, 2025": "We heard from a lot of people that length of game is an important factor for them."; "at least nine turns", eight, six, four; "These games could end on any turn."; "Gameplay to be intricate and advanced, with razor-thin margins for error". <https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025>
3. EDHREC, Mike Carrozza, "Am I the Bolas? – Big Turn for Me, but Not for Thee", 2026-09-09. <https://edhrec.com/articles/am-i-the-bolas-big-turn-for-me-but-not-for-thee/>
4. EDHREC, Mike Carrozza, "Am I the Bolas? – Slowing Games Down", 2025-10-01. <https://edhrec.com/articles/am-i-the-bolas-slowing-games-down>
5. r/EDH: "After an 11-hour cEDH match at a live tournament, I built a chess clock for Commander. It's free", 2025-05-28, 593 points, 115 comments, <https://www.reddit.com/r/EDH/comments/1kxnwe4/>; "PSA: lifetap has a turn timer built in. Normalize its use to deal with slow players", 2025-03-24, 530 points, 85 comments, <https://www.reddit.com/r/EDH/comments/1jikepx/>; "Any suggestions for Commanders that aren't too complex to play, but somewhat unique in playstyle", 2025-04-06, 36 points, 98 comments, <https://www.reddit.com/r/EDH/comments/1jss7qe/>; "Looking for strong B3 commander with steep learning curve and complexity", 2026-08-04, 0 points, 48 comments, <https://www.reddit.com/r/EDH/comments/1vfcl01/>; "Rules for a turn timer?", 2025-01-02, 0 points, 69 comments, <https://www.reddit.com/r/EDH/comments/1hrt48t/>; "Precon Complexity/Fun: Quandrix Unlimited Vs Counter Blitz?", 2026-09-03, 1 point, <https://www.reddit.com/r/EDH/comments/1w69p38/>. Searches for "slow turns", "long turns" and "forget triggers" could not be completed: the archive answered with a timeout on 2026-11-12.
6. EDHREC, Cas Hinds, "The Top 5 Most Annoying Cards/Mechanics to Track in Commander", 2025-12-22. <https://edhrec.com/articles/the-top-5-most-annoying-cards-mechanics-to-track-in-commander>
7. Commander's Herald, Amanda Stevens, "Beyond Rule Zero: You're Not Going to Like Every Game of Commander", 2023-01-16. <https://commandersherald.com/beyond-rule-zero-youre-not-going-to-like-every-game-of-commander/>
8. Commander's Herald, Elliot Raff, "The Trouble With Triggers", 2022-12-10. <https://commandersherald.com/the-trouble-with-triggers/>
9. Magic Judges, "Teenage Mutant Ninja Turtles Missed Triggers Guide", 2026-03-08: "Five cards have one or more triggers that upgrade to a Warning when missed". <https://blogs.magicjudges.org/rules/2026/03/08/magic-the-gathering-teenage-mutant-ninja-turtles-missed-triggers-guide/>
10. TappedOut forum, "Keeping track of the stack", 2020-08-01: "I use a die or a coin on top of my deck to remember triggers."; "placeholder cards to mark some other common stack triggers". <https://tappedout.net/mtg-forum/commander/keeping-track-of-the-stack>
11. BoardGameGeek wiki, "Weight" (search summary; the page answered 403 to automated reads on 2026-11-12). <https://boardgamegeek.com/wiki/page/weight>
12. Rate My Decks, home page: 12 factors, "generated by deterministic heuristic rules, not AI", "Speed: Fast."; © 2025. <https://ratemydecks.com/en>
13. ScryCheck, home page: five vectors, "Every point is traceable"; © 2026. <https://scrycheck.com/>
14. EDHTuner, home page, "Last updated November 11, 2026 (v0.250.0)": the playtests "measure how fast and how consistently your deck does its thing". <https://edhtuner.com/>
15. Scryfall, card search, read with a named User-Agent on 2026-11-12. Each count in sections 2 and 3 is the `total_cards` of one query over `f:commander`, for example `o:"at the beginning of your upkeep" f:commander` (845) and `o:"search your library" f:commander` (877). <https://scryfall.com/docs/api/cards/search>

## Feature contract (Full, 2026-11-12)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player learns what their deck asks of them at the table: the upkeep trigger they forgot, the shuffle that took a minute, the modal spell they had to reread. Wizards made game length part of the bracket conversation, judges keep per-set lists of triggers that must not be missed, and advice columns answer letters about ten-minute turns. Nothing shows a player, before the game, what their own list will ask of them.

### Goals

- A player opens a token deck and sees "Demanding: 14 timed triggers and 11 library searches per 99 cards", the eight cards that trigger at their upkeep with the clause of each, the nine that trigger at their end step, the four optional triggers marked ◇, and prints a one-page sheet whose footer names the deck version and the date; the Rule 0 sheet shows the same line in its calculated column.

### Non-goals

- Do not reverse a non-goal already named in this file or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, a game length in minutes, or a score this file does not already cite from a named source.

### Personas

The casual pod player (what to remember), the bracket-focused player (the line for the pregame talk), the cEDH player (the missed-trigger list of competitive play) and the content creator (the "How it plays" section of a primer). See the roadmap persona table.

### User stories

#### US-99-01

As a player piloting a trigger-heavy deck, I want every card that asks something of me listed by the step of the turn it fires in, so that I check one block at my upkeep and one at my end step instead of rereading 99 cards.

#### US-99-02

As a player sitting down with strangers, I want one honest sentence about how long my turns tend to be and why, so that the table hears it before the first shuffle.

#### US-99-03

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-99-04

As a player using a keyboard or a screen reader, I want each block and control to have a name and a visible focus, and the band to be a word, so that colour is not the only signal.

### Acceptance criteria

#### AC-99-01 Happy path

Given a signed-in player, the English locale and a deck holding Phyrexian Arena, Smothering Tithe and Rhystic Study
When the builder panel opens
Then Phyrexian Arena is listed under "Your upkeep" with its clause excerpt, Smothering Tithe and Rhystic Study under "On other players' turns", each labelled exact, and the French locale shows the French catalogue string for every control

#### AC-99-02 Error and failure

Given the definitions fail to load, or I-78's matches are unavailable
When the panel renders
Then the classes that read the missing source show "not checked" with the reason, the others still show, no count is invented, and the message is a catalogue string rather than a stack trace

#### AC-99-03 Edge cases

Given an empty deck, or a deck of 99 basic lands and a commander
When the panel renders
Then the band is "light" with every factor at zero shown, the sheet prints the commander's block and the footer, and no block is padded to look full

#### AC-99-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then both see the panel and the on-screen sheet for the deck in their session; the public switch and the Rule 0 line need an account and say so instead of failing with a raw 401

#### AC-99-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, the other eight keep key parity with `en` and may reuse the English text until a person reviews them, and no routed locale shows a hard-coded English control

#### AC-99-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player completes US-99-01 without a pointer
Then every block and control has an accessible name, focus returns to the block after it folds, the band is announced as a word, and the optional glyph has a text legend

### UX flow and states

The panel sits beside the combos panel in the builder. It opens on the band and its two largest factors. Below, the timing blocks in turn order, each foldable and each line expanding to its clause; then the drivers; then "Print the pilot sheet". The sheet page is the same blocks laid out for paper, with its footer.

- Empty: "No card in this list asks anything at a fixed step, by the version 1 definitions." The definitions version is shown.
- Loading: a busy state that keeps the layout still while the deck loads; the computation is synchronous on the client.
- Error: the catalogue message and a retry; the last confirmed deck stays on screen.
- Partial: a class whose source is unavailable shows "not checked", never zero; I-19's pieces show "not listed yet" until I-19 ships them.

### Data model and API

The types in [Data model / API](#data-model--api). Slices 1 to 8 store nothing. Slice 12 adds the read route behind the owner's switch and the public sheet page.

### Analytics and telemetry

`pilot_opened {surface: builder | deckPage | sheet}`, `pilot_sheet_printed {pages: 1 | 2}` and `pilot_line_copied {}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Slices 1 to 5 are on for guests and signed-in players, since they compute from the deck in the session and store nothing. Slices 6, 7 and 12 are behind an I-69 switch, `pilot.surfaces`, off until D-96 is committed.

### Dependencies

Hard waits are in the roadmap dependency table: I-65 slice 1 for slice 1, I-78 slice 1 for slice 2, I-15 slice 2 for slice 6. Slice edges stay in the table above and in `dependency-graph.md`.

### Risks and mitigations

- The band read as a verdict on the deck or the player: the words are chosen by D-96, the factors always show, the verdict-word test bans the pejoratives, and the public page is off by default.
- A heuristic class that misfires: the certainty label, the owner-labelled fixture, the precision floor and the "low precision" mark.
- A printed sheet that outlives the list: the footer names the version and the date, as I-86 requires of every dated line.
- Quoting card text on paper: clause excerpts only, no image, and the lawyer question in open question 5 before the printed excerpts ship.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-96, the authored question, the reading-load factor, repeatable activations, and the lawyer question on printed excerpts.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

Each scope line of the roadmap record below, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-99-101 Triggers by step of the turn

As a player, I want every card that triggers at a fixed step listed under that step with its clause, so that my upkeep is one block to read.

#### AC-99-100 Happy path

Given a signed-in player, the English locale and a deck with eight "at the beginning of your upkeep" cards
When the builder panel opens
Then "Your upkeep" lists the eight cards with their excerpts, labelled exact, with quantities where above one and "command zone" where it applies

#### AC-99-101 Failure

Given the same deck and the definitions file fails to load
When the panel renders
Then it shows the catalogue message for the definitions, computes nothing and invents no count

#### AC-99-102 Edge

Given a card whose upkeep trigger sits in reminder text only
When the panel recomputes
Then the card is not listed, because reminder text is stripped before matching

#### US-99-102 Turn-length drivers and the pilot load

As a player, I want the things that make my turns long counted per 99 cards with their thresholds, so that "demanding" always comes with the two reasons behind it.

#### AC-99-103 Happy path

Given a deck with 14 timed triggers and 11 library searches per 99 cards
When the panel opens
Then the band is "demanding", the sentence names those two factors, and every factor shows its count, its thresholds and whether it is above the high one

#### AC-99-104 Failure

Given the same deck and I-78's extra-turn matches unavailable
When the panel renders
Then the extra-turn driver shows "not checked", the band is computed from the factors that are available and says so, and nothing shows zero for the unchecked driver

#### AC-99-105 Edge

Given the thresholds data file changes a high threshold
When the panel recomputes
Then the band follows the new data without a code change, and the thresholds version shown changes with it

#### US-99-103 The sheet, the line and the question

As a player, I want to print one page I can leave in the deck box and copy one sentence into the Rule 0 sheet, so that both the table and I know what this deck asks.

#### AC-99-106 Happy path

Given the owner of a deck with 45 pilot lines
When they print the sheet and copy the line
Then the sheet is one page with its version footer and no image, and the Rule 0 sheet's calculated column shows the line labelled computed with the declared speed untouched

#### AC-99-107 Failure

Given the public switch write fails
When the owner retries
Then the switch keeps its last confirmed state, the public response still contains no sheet, and the message is a catalogue string

#### AC-99-108 Edge

Given a deck with 70 pilot lines
When the sheet prints
Then it runs to two pages, the second page repeats the footer, and no block is cut mid-line

### UX states for this feature

| State            | What the player sees                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | "No card in this list asks anything at a fixed step, by the version 1 definitions." No invented row, author, price or score.            |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                          |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                         |
| Partial          | Classes with an unavailable source are labelled "not checked"; I-19's pieces say "not listed yet". A short list is not padded.          |
| Stale            | The sheet's footer shows the deck version, the definitions version and the date it was computed; a missing date is absent, not guessed. |
| Guest            | The panel and the on-screen sheet work for the deck in the session. The public switch explains that it needs an account.                |
| Signed-in        | The switch and the Rule 0 line go to that account's deck only. Another player's notes are never in the response.                        |
| English          | New controls use the `en` catalogue.                                                                                                    |
| French           | New controls use the `fr` catalogue, with the official French step names. A French URL shows no hard-coded English control.             |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them.        |
| Keyboard         | Every block, line and control can be reached without a pointer. Focus is visible and returns when a block folds.                        |
| Screen reader    | Each block has an accessible name; the band, the counts and the optional mark are announced in words.                                   |
| Colour           | The band and the certainty differ by text and icon as well as hue, in both themes; the printed page is black on white.                  |
| Success          | "Copy into my sheet" and the public switch are confirmed in words. A second identical action does not duplicate the write.              |

### Alternate paths

- The player cancels the public switch before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. Chrome strings and step names switch. Card names and clauses stay the printing's language.
- The player prints from a browser with no print dialog. The sheet page offers "Save as text", which produces the same blocks as plain text.

### Roadmap record (2026-11-12)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-99 is a link here.

## I-99: A Pilot Sheet, And How Heavy This Deck Is To Pilot

**Outcome:** a player sees, for their own list, every card that asks something of them grouped by the step of the turn it fires in, with the clause behind each; the things that make a turn long counted per 99 cards; a pilot load (light, moderate or demanding) that always shows its factors and thresholds; a one-page printable pilot sheet with a version footer; and one computed line for the Rule 0 sheet and the pre-game script.

**Status:** Next
**Priority:** Next for slices 0 to 8; Later for slices 9 to 13, behind the owner's fixture, I-34's reports, I-35's duration, D-96 and the surfaces of I-19, I-93, I-79 and I-94. Never paid.
**Impact / effort:** High / medium
**Risk:** Medium. The band can be read as a verdict and a heuristic class can misfire. The words of D-96, the factors shown beside the band, the verdict-word test, the labelled fixture and the private default are the mitigations.
**Depends on:** I-65 slice 1 (the clause module) for slice 1; I-78 slice 1 (extra turns) for slice 2; D-96 for slice 3; I-15 slice 2 for slice 6; the owner's wording and I-88's script for slice 7; I-54 slice 4 (coordinate) for slice 8; I-34 slice 3 for slice 9; I-34 slice 4 and I-75 slice 1 for slice 10; I-35 slice 1 with `durationMinutes` for slice 11; D-96 for slice 12; I-19 slice 2, I-93, I-79 slice 4 and I-94 for slice 13.

Wizards made game length part of the brackets: Exhibition games "are likely to go long and end slowly", and the October 2025 update sets "at least nine turns" to "at least four" by bracket because "length of game is an important factor" to players [1][2]. Judges publish per-set lists of triggers that "upgrade to a Warning when missed" [9], EDHREC's advice column answers letters about "a poorly piloted trigger-heavy deck that eats up 80% of time during a game" [3], and a r/EDH chess clock built after an eleven-hour match reached 593 points [5]. Every analyser read measures a deck's power; none measures what the deck asks of its pilot [12][13][14]. The product stores Oracle text on every deck card and plans the clause module (I-65) and the symmetric scopes (I-78) this initiative reads; I-54 plans a complexity score for the commander's card alone. The profile is computed by code, labelled exact or heuristic, worded without a verdict, and private by default.

### Scope

- [ ] Sixteen timing classes as versioned data in I-65's clause format, each with its step, its CR rule and its certainty; `classifyPilotCard` with reminder text stripped and optional triggers flagged; card fixtures (slice 1).
- [ ] Fourteen turn-length drivers with counts per 99 cards, reading I-78's extra-turn class; `countDrivers`; fixtures (slice 2).
- [ ] The pilot load: thresholds as versioned data, the two-or-more-high band rule, every factor shown with its thresholds, `renderPilotLine` in English and French; the verdict-word test with "slow", "boring", "lent" and "ennuyeux" banned (slice 3).
- [ ] The builder panel "Piloting this deck" and the owner's deck page (slice 4); the pilot sheet on screen and on one printed page with its version footer, I-19's pieces when present, no image (slice 5).
- [ ] The pilot line in I-15's calculated column with "copy into my sheet" (slice 6); the authored question in I-88's script with the line as its hint (slice 7); `cardComplexity` shared with I-54 (slice 8).
- [ ] After the owner's decisions: the labelled fixture and the methods-page rows with the floor rule (slice 9); the norms by declared bracket with n and an interval (slice 10); logged game length against the band, no causal claim (slice 11); the public switch, the read route and the public sheet page (slice 12); the sheet or the line on I-19, I-93, I-79 and I-94 (slice 13).

### Engineering enablers

- `TimingClassId` and `DriverId` are discriminated unions with exhaustive `never` guards; the definitions and thresholds files are validated at build time, and an unknown class or driver fails the build.
- The printable page is server-rendered text with a print stylesheet and no image URL, so it works offline through I-19's cache and needs no image policy answer.
- The schema test over `SHARED_DECK_SELECT` and the public projection gains the profile, the line and the switch, so nothing leaks through a projection change.

**Paid-tier angle:** none. Evidence about the player's own list stays free under I-30 1.1 and 1.2, and the norms are I-34's free data.

### Enrichment (2026-11-12)

**User story.** As a player piloting a trigger-heavy deck, I want every card that asks something of me listed by the step it fires in, and one honest sentence about how long my turns tend to be, so that I forget less and the table hears it before the first shuffle.

**Acceptance.**

- A deck with Phyrexian Arena lists it under "Your upkeep" with its clause, labelled exact.
- A deck with 14 timed triggers and 11 library searches per 99 cards shows "demanding" with those two factors named, and every factor with its thresholds.
- The sheet prints on one page with a footer naming the deck version and the date; a 70-line deck runs to two pages with the footer repeated.
- The Rule 0 sheet's calculated column shows the pilot line labelled computed; the declared speed is untouched.
- Nothing about the profile appears in the shared or public projection while the owner's switch is off.

**UX.** A panel beside the combos panel: the band and its two largest factors, the timing blocks in turn order, the drivers, "Print the pilot sheet". A printable page in black on white, at least 11 pt, with a glyph legend.

**Data and API.** Pure functions over the deck in the browser for slices 1 to 8; thresholds and definitions as versioned data. One read route and one public page behind the owner's switch in slice 12.

**i18n and access.** English and French chrome and templates through the message catalogues, with the official French step names; card names and clauses stay the printing's language. Every block and control has an accessible name and a keyboard path; the band and the optional mark are words and glyphs, not colours.

**Telemetry.** `pilot_opened {surface}`, `pilot_sheet_printed {pages}`, `pilot_line_copied {}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Slices 1 to 5 on for everyone. Slices 6, 7 and 12 behind `pilot.surfaces`, off until D-96.

**Open questions.** D-96; the authored question's field; the reading-load factor; repeatable activations; the lawyer question on printed clause excerpts (L-18).

### Definition of done

A player opens a token deck and sees "Demanding: 14 timed triggers and 11 library searches per 99 cards", eight cards under "Your upkeep" and nine under "Your end step" each with its clause, four optional triggers marked ◇, and prints a one-page sheet whose footer names the deck version, the definitions version and the date; the Rule 0 sheet shows the same line in its calculated column with the declared speed untouched; opening the same deck again gives the same profile byte for byte; no profile, line or sheet appears in the public response while the owner's switch is off.

---
