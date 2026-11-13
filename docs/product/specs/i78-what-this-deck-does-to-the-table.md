# I-78: What This Deck Does To The Table

> **Initiative:** I-78, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-11 · **Priority:** Next for slices 1 to 3 (definitions and the profile, the builder panel, the Rule 0 sheet line); Later for slices 4 to 9, which wait for the owner's labelled fixture, I-34 slice 3, I-15 slice 4, I-65 slices 3 and 4, an owner decision on public pages, L-22 (Tagger) and D-25 (salt) · **Paid:** never for one deck's profile · **Written 2026-11-11**
> **Placement:** a third card taxonomy, beside [I-65](i65-how-this-deck-wins.md)'s route roles (how a deck ends a game) and [I-31](i31-deck-lab.md)'s lab kinds (mana). Hosting it in I-65 would change that initiative's outcome from "how it wins" to "how it plays at the table". [I-15](i15-rule-zero-sheets-and-pod-profiles.md) records only what players state (1.3), and [I-54](i54-find-your-next-commander.md) owns play styles.
> **Research:** one dated note of 2026-11-11, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public search on 2026-11-11. Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the table-effect classes and their versioned definitions, the per-card matches, the deck's table profile and its exact and heuristic labels, the table line offered to I-15 and the pod fit check, and the builder panel. **Does not own:** the clause format and the verdict-word list (I-65 slice 1, shared); route kinds, roles and answer classes (I-65); bracket rules, `BracketRule` and the bracket check ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the dated Game Changers list ([I-48](i48-official-changes-reach-every-deck.md)); the Spellbook lookup ([I-09](i09-meta-and-evidence.md)); sheets, pods and consent (I-15); the Oracle Tags join ([I-67](i67-one-card-data-pipeline.md) slice 7); the methods page ([I-34](i34-commander-data-reports.md)); salt data and partnerships ([I-29](i29-cross-site-deck-index.md) slice 13, D-25).

**Proposed changes to neighbours, for the integrator:**

| Neighbour | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-65      | Table effects are I-78's, not a new I-65 section. I-65 slice 1 publishes its clause and definition format, and its verdict-word list (1.3), as a shared deck-analysis module rather than route-only code, so I-78 slice 1 reuses both. I-78 slice 6 reads I-65 slices 3 and 4. I-65's outcome, routes and answer classes do not change.                                                                                                                          |
| I-15      | The calculated column (1.4, slice 2) gains the table line and, beside the declared combos, extra turns and resource denial fields (1.2), the computed counts with their cards and a "copy into my sheet" action. 1.3 stands: no declared field is filled. Slice 4's comparison shows each deck's line (I-78 slice 5, G-02). Slice 5 (salt) is unchanged and stays behind D-25.                                                                                   |
| I-28      | The extra-turn and mass-land-denial card classes are defined once, in I-78 slice 1; I-28 slice 7 reads them for its hard-rule findings and adds "I-78 slice 1" to its Depends on. `BracketRule` stays the source of what each bracket allows. Slice 7's per-opponent interaction count (G-19) reads each match's scope, so a sweeper that reaches every opponent counts once per opponent. This answers I-28's "shared vocabulary" question for these two terms. |
| I-31      | No new lab kind. The run's limits list (slice 5) names the cards I-78 classes as group hug or wheel, because the goldfish credits their mana and cards to the player alone. I-31 2.4's "depends on opponents" flag stays I-31's.                                                                                                                                                                                                                                 |

## Overview

In a four-player game a deck acts on three other people. Some of what it does is shared: Howling Mine draws every player an extra card. Some is taken: Armageddon destroys every land. Some shapes the fight: a goaded creature must attack someone else, and the monarch passes to whoever deals combat damage to its holder (CR 725.2). Players discuss these effects before a game, and Wizards' bracket rules name four of them: Game Changers, mass land denial, extra turns and two-card combos [1]. No tool found lists them for the player's own list.

This initiative computes a **table profile** for one deck. For each class of effect on the other players it gives a count and the cards, grouped by what the deck gives, takes, makes fight over, shares, scales with the number of opponents, and what the bracket rules name. Each class is labelled **exact** (a rules term, a keyword action or an official list) or **heuristic** (an Oracle-text pattern that can miss cards or match the wrong ones). Each card shows the clause that matched it. The Rule 0 sheet and the pod fit check read one line from the profile.

Everything is computed by code from Oracle text, the official Game Changer flag, Commander Spellbook's data and versioned definitions. No model decides a class. The profile describes effects, never the deck or its owner: no score, no "threat", no "salt".

**Example (illustration, not computed).** A Phelddagrif deck shows: _Gives 5: group hug 3 (Howling Mine, Heartbeat of Spring, Rites of Flourishing), selective gift 1 (Phelddagrif), wheel 1 (Windfall). Takes 3: mass removal 2 (Wrath of God, each player; Cyclonic Rift, opponents only), theft 1 (Control Magic). Combat 2: attack deterrent 2 (Ghostly Prison, Propaganda). Shared 1: monarch (Palace Sentinels). Bracket rules: 0 Game Changers, 0 extra turns, 0 mass land denial, 0 two-card combos (Spellbook, checked)._

## What the market does

Read on 2026-11-11 unless dated otherwise. "Not found" means not found in the pages read.

| Product                            | What it shows                                                                                                                                                                                                                                                                                                                                                 | Unit and method                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scryfall Tagger** [3][4][5]      | Community tags per card. Commander-legal counts (**computed**): `symmetrical` 891, `group-slug` 849, `theft` 690, `per-opponent` 480, `group-hug` 414, `selective-group-hug` 217, `forces-attack` 158, `punisher` 156, `mass-land-denial` 106, `pillowfort` 63, `extra-turn` 54, `monarch-matters` 44, `tax-attack` 41, `donate` 32, `take-the-initiative` 23 | Card level. The Oracle Tags file is "sourced from Tagger, the Scryfall community tagging project" (updated 2026-11-10) [3]; no licence found, and the tags page refused automated reads [5] |
| **Playgroup.gg** archetypes [6][7] | A group "How you deal with the table": Politics, Group hug, Stax and control, Group slug. Per commander, "cards per deck against the average deck in its colors" and percentiles such as "Group hug top 1% and Politics top 2%"                                                                                                                               | Per commander, from players' decklists. "Card tags come from Scryfall's community tagger". No pillowfort or theft class; the pages read show commanders, not one player's list              |
| **EDHREC** [8]                     | Theme pages per commander, for example Gluntch, the Bestower "Pillow Fort" (129 decks) with card lists                                                                                                                                                                                                                                                        | Commander level; nothing about an individual deck                                                                                                                                           |
| **Archidekt** with EDHREC salt [9] | A Salt Sum at the top of the deck page; a click shows the deck's sum "compared to Commander decks on Archidekt"                                                                                                                                                                                                                                               | EDHREC's yearly survey, 0 to 4 per card, with "no fixed criteria" (2024-03-27)                                                                                                              |
| **ScrollVault** salt [10]          | A deck salt sum and its five saltiest cards; "It never changes your bracket verdict", "because salt measures play pattern, not strength"                                                                                                                                                                                                                      | Sum of EDHREC survey values for 158 cards (updated 2026-07-16)                                                                                                                              |
| **Commander Spellbook** [11]       | A salt score "for combos and locks"                                                                                                                                                                                                                                                                                                                           | Votes from 0 to 4 over "the previous 12 months" (2026-10-09)                                                                                                                                |

**The gap.** No product found lists, for the player's own list, which cards give to, take from or shape the other three players, with the rule behind each class and its certainty. Tools count tags per commander (Playgroup), list theme cards per commander (EDHREC) or sum or show opinion votes (Archidekt, ScrollVault, Spellbook). Moxfield was not checked: it refuses automated reads, as I-65 found.

**Why it matters.**

- **The official text names table effects.** Mass land denial is cards that "regularly destroy, exile, and bounce other lands, keep lands tapped, or change what mana is produced by four or more lands per player without replacing them", with Armageddon, Ruination, Sunder, Winter Orb and Blood Moon as examples. Extra-turn cards "are not intended to be chained in succession or looped" in Bracket 2 (2025-02-11) [1]. Bracket 2 wins are "telegraphed on the board", Bracket 3 wins "can be deployed in one big turn from hand", and Game Changers can "block people from playing" (2025-10-21) [2].
- **Players ask.** "What are your threat assessment tips and rules of thumb?" drew 99 points and 130 comments (2025-11-08) [12]; "why tables kill the visible threat and miss the real one", 80 points (2026-04-16) [13]; a third thread, 45 points and 66 comments (2025-09-28) [14]. 69 r/EDH titles since 2025-01-01 contain "archenemy", with 1,635 points (some mean the Archenemy format), including "Almost all of the commanders I want to build will make me the archenemy, what should I do?", 137 points, 125 comments (2026-10-17) [15].
- **The product's own guide teaches it.** The game is "a series of 3v1's" ([bracket guide](../guides/commander-deckbuilding-by-bracket.md)).

## Current state in this codebase

Verified on `dev` at `2cf792e8` on 2026-11-11.

- **No table classification.** No file under `src` classifies monarch, initiative, goad, group hug, pillowfort, theft or donation.
- **A theme score, not a class.** `detectThemes`'s Stax rule ([`src/lib/deck/themes.ts`](../../../src/lib/deck/themes.ts), lines 85–97) counts phrase hits such as "each opponent", "tax" and "opponents can't" into one theme confidence. Drain cards hit "each opponent" too, and no card list per effect comes out. I-54 4.1 replaces it.
- **Game Changers.** The official signal is `DeckCard.isGameChanger` ([`prisma/schema.prisma`](../../../prisma/schema.prisma), line 288), checked against Scryfall's `is:gamechanger` list ([`src/hooks/useGameChangers.ts`](../../../src/hooks/useGameChangers.ts), lines 15–23) and counted in [`stats.ts`](../../../src/lib/deck/stats.ts) (lines 74–76). A separate text guess, `detectGameChanger` ([`validation.ts`](../../../src/lib/deck/validation.ts), lines 231–241), calls "take an extra turn" and "each opponent loses" Game Changers; only its tests call it.
- **No mass-land-denial or extra-turn detection.** The phrases appear only as copilot prompt rules ([`src/lib/ai/deck-plan.ts`](../../../src/lib/ai/deck-plan.ts), lines 142–163). `scoreBracket` raises any two-card infinite to bracket 4 "(RC rule)" ([`bracket.ts`](../../../src/lib/deck/bracket.ts), line 117); I-28 slice 2 replaces that override.
- **Combos and salt.** `requestDeckCombos` ([`src/lib/combos/find-my-combos.ts`](../../../src/lib/combos/find-my-combos.ts), line 144) reads Spellbook's included variants; its schema (lines 21–37) does not read `salt`, although the recorded fixture `find-my-combos-v1.ts` carries `salt` and `saltVoteCount` per variant. Nothing shows salt.
- **Card input.** `DeckCard` ([`src/lib/deck/types.ts`](../../../src/lib/deck/types.ts), lines 30–56) carries `oracleText`, `typeLine`, `isGameChanger` and optional `cardFaces` with their text, but no Oracle ID and no keyword list. The stored row keeps the Oracle text copied when the card was added (schema lines 275–300). Version 1 definitions therefore match text; Oracle IDs and keywords arrive with I-67.
- **Where a panel goes.** The builder's right column mounts `BracketIndicator`, `CombosPanel`, `MetaPanel` and `DeckStats` ([`src/app/[locale]/builder/[deckId]/page.tsx`](../../../src/app/[locale]/builder/[deckId]/page.tsx), lines 1057–1127).
- **No sheet yet.** No `PodSheet` or `Pod` model exists; I-15 is unbuilt.
- **The rules are in the repository.** [`MagicCompRules-20260807.txt`](../../../src/lib/rules/data/MagicCompRules-20260807.txt) holds 500.7 (extra turns), 701.15 (goad), 701.38 (vote), 725 (the monarch) and 726 (the initiative).

**Owning context and module shape.** The refactor's architecture note (branch `docs/architecture-foundation`, not merged) gives "read-only evaluation of a decklist" to the **deck-analysis** context, which owns no tables. I-78 lives there. Until deck-analysis moves, the code sits beside its siblings in `src/lib/deck/table-effects/` and `src/components/deck/TableEffectsPanel.tsx`, shaped as the target layers; nobody creates `src/modules/` by hand.

```text
src/modules/deck-analysis/
  domain/definitions/        clause.ts, verdict-words.ts: shared with I-65, written by I-65 slice 1
  domain/table-effects/
    model.ts                 readonly types: TableGroup, TableClassId, Certainty, Scope, TableClassDef, CardTableMatch, TableProfile
    definitions.ts           TABLE_CLASS_DEFINITIONS (versioned data), TABLE_DEFINITIONS_VERSION
    classify-card.ts         classifyCard(card, defs) → readonly CardTableMatch[]
    profile.ts               computeTableProfile(input, defs) → TableProfile
    table-line.ts            toTableLine(profile) → TableLine (typed slots, no prose)
    fixtures/                cards.ts (one card per phrasing and near-miss); decks/ (owner-labelled, slice 4)
  ui/TableEffectsPanel.tsx
  index.ts                   export { classifyCard, computeTableProfile, toTableLine } and the types
```

The domain imports the `combos` context's `index.ts` for the `Combo` type and nothing from React, Prisma, `fetch` or the AI client.

## Functional requirements

### 1. Ground rules

1.1 Every class, match, count and label is computed by code from card text, the official Game Changer flag, Spellbook's data and versioned definitions. No language model chooses, ranks, phrases or reviews a class ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 The profile describes effects, never the deck or its owner. I-65's verdict-word test ([I-65 1.3](i65-how-this-deck-wins.md#1-ground-rules)) runs on every template, with these additions in English and French: "salty", "unfun", "toxic", "hated", "archenemy", "threat", "rude", "polite", "fair", "unfair", "too many".
1.3 Each class carries one label. **Exact:** membership follows a rules term, a keyword action or an official list; a card is in the class when its Oracle text uses one of the class's listed phrasings or the list names it, and a missed phrasing is a defect fixed in a new definition version. **Heuristic:** membership follows Oracle-text patterns that can miss cards and match cards that do not belong; group 7 publishes its precision and recall.
1.4 Each match shows, on demand, the clause that produced it and the definitions version.
1.5 The profile works with the copilot off and with Spellbook unreachable. A failed lookup shows "two-card combos not checked", never "none".
1.6 No Tagger tag feeds a displayed class until [L-22](../legal-questions.md#l-22-scryfalls-tagger-tags) is answered, as [I-65 slice 8](i65-how-this-deck-wins.md#delivery-slices) is blocked for release on the same question. The tag counts in this spec are research.

### 2. Classes, definitions version 1

2.1 Twenty classes in six groups. Clauses are examples; the definition file holds the full list.

| Group         | Class                  | Covers                                                         | Version 1 clauses (examples)                                                                                          | Label                 | Rule or source                | Tagger tag, count [4]                  |
| ------------- | ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------- | -------------------------------------- |
| Gives         | Group hug              | Every player draws more, makes more mana or plays more lands   | "each player draws", "that player draws an additional card", "whenever a player taps a land for mana"                 | Heuristic             | —                             | `group-hug` 414                        |
| Gives         | Selective gift         | One chosen opponent draws, gains life or gets a token          | "target opponent draws", "target opponent gains", "target opponent creates"                                           | Heuristic             | —                             | `selective-group-hug` 217              |
| Gives         | Wheel                  | Every player replaces their hand                               | "each player discards their hand, then draws", "shuffles their hand … then draws seven"                               | Heuristic             | —                             | `wheel-symmetrical` 47                 |
| Gives         | Donate                 | An opponent gains control of something the owner owns          | "target opponent gains control of"                                                                                    | Heuristic             | —                             | `donate` 32                            |
| Takes         | Group slug             | Damage or life loss to each opponent or each player            | "each opponent loses", "damage to each opponent", "damage to each player"                                             | Heuristic             | —                             | `group-slug` 849                       |
| Takes         | Mass removal           | Many permanents leave at once: all of them, or opponents' only | "destroy all", "exile all", "return all … to their owners' hands", overload with "you don't control"                  | Heuristic             | —                             | `sweeper` 919, `sweeper-one-sided` 230 |
| Takes         | Theft                  | The owner controls or casts opponents' cards                   | "gain control of target", "you control enchanted creature", "you may cast that card for as long as it remains exiled" | Heuristic             | —                             | `theft` 690                            |
| Takes         | Taxes and restrictions | Players or opponents pay more or may do less                   | "cost {1} more", "can't search libraries", "can't cast more than one spell"                                           | Heuristic             | —                             | `tax` 452                              |
| Takes         | Punisher               | Opponents choose between two losses                            | none in version 1 (2.4)                                                                                               | Not checked           | —                             | `punisher` 156                         |
| Combat        | Goad                   | Opponents' creatures must attack someone other than the owner  | keyword action "goad"                                                                                                 | Exact                 | CR 701.15                     | `forces-attack` 158                    |
| Combat        | Forced attack          | Creatures must attack, without goad                            | "attacks each combat if able"                                                                                         | Heuristic             | —                             | `forces-attack` 158                    |
| Combat        | Attack deterrent       | Attacking the owner costs or risks more                        | "can't attack you unless", "whenever a creature attacks you"                                                          | Heuristic             | —                             | `pillowfort` 63, `tax-attack` 41       |
| Shared        | Monarch                | Brings the monarch into the game                               | "become the monarch", "becomes the monarch"                                                                           | Exact                 | CR 725                        | `monarch-matters` 44                   |
| Shared        | Initiative             | Brings the initiative into the game                            | "take the initiative", "takes the initiative"                                                                         | Exact                 | CR 726                        | `take-the-initiative` 23               |
| Shared        | Vote                   | Every player votes                                             | keyword action "vote" (will of the council, council's dilemma)                                                        | Exact                 | CR 701.38                     | `synergy-vote` 8                       |
| Per opponent  | Scales per opponent    | The effect grows with the number of opponents                  | "for each opponent"                                                                                                   | Heuristic             | —                             | `per-opponent` 480                     |
| Bracket rules | Game Changers          | Cards on the official list                                     | `isGameChanger`                                                                                                       | Exact                 | Wizards' list [1][2]          | —                                      |
| Bracket rules | Extra turns            | A player takes one or more extra turns                         | "take an extra turn", "takes two extra turns", "Gift an extra turn"                                                   | Exact                 | CR 500.7; [1]                 | `extra-turn` 54                        |
| Bracket rules | Mass land denial       | Wizards' definition (2.5)                                      | "destroy all lands", "can't untap more than one land", "nonbasic lands are"                                           | Heuristic             | [1]                           | `mass-land-denial` 106                 |
| Bracket rules | Two-card combos        | Spellbook combos with two cards                                | Spellbook `included` variants of two cards                                                                            | Exact, Spellbook data | [1]; I-28 slice 2 for "early" | —                                      |

2.2 Each definition holds an ID, a version, its group and label, English and French names and one-line definitions, its clauses, a scope rule, and the CR rule or official source when there is one.
2.3 Each match records a **scope**: each player (symmetric, the owner included), each opponent, one opponent, or a player the owner chooses. The clause sets it ("each player", "each opponent", "target opponent", "target player"). The panel shows symmetric and one-sided effects apart.
2.4 Punisher has no Oracle-text clause in version 1. The phrasing that finds it ("unless that player pays") also matches taxes and counterspells, and Rhystic Study and Smothering Tithe word the choice differently. It appears only with Tagger clauses (slice 8) and is listed as "not checked" until then.
2.5 Mass land denial follows Wizards' definition [1]. Its clauses cover "all lands", untap limits on lands and changes to land types. The five cards Wizards names are fixture cases. The label stays heuristic: "destroy all lands" matches 11 Commander-legal cards where Tagger's `mass-land-denial` holds 106 (**computed** [4]).
2.6 Extra turns list every phrasing. "Take(s) an extra turn" alone finds 51 Commander-legal cards, all inside Tagger's 54; the other three are Time Stretch and Teferi, Master of Time ("two extra turns") and Perch Protection (gift) (**computed** [4]). Text that stops extra turns, as on Stranglehold, is not in the class.
2.7 Monarch means bringing the designation into the game (CR 725.1): "become(s) the monarch" matches 61 Commander-legal cards (**computed** [4]). A card that only cares whether its controller is the monarch, such as Throne Warden, is not in the class. Initiative matches 23, the same count as Tagger's tag.
2.8 Two-card combos come from the existing Spellbook lookup. Whether a combo is "early" uses I-28 slice 2's turn-6 rule and stays hidden until that slice ships, as I-65 slice 4 does for its bracket line. Combos absent from Spellbook are a stated blind spot.

### 3. Classifying one card

3.1 A card gets zero or more classes. Classes never overwrite the player's `category` and are not stored.
3.2 The input is the card's Oracle text and the text of each face, its type line and its Game Changer flag. Reminder text in parentheses is removed before matching.
3.3 The commander and any partner are classified and marked "command zone". Main-deck cards count; the maybeboard and sideboard do not.
3.4 A card counts once per class, whatever its quantity.

### 4. The deck's table profile

4.1 `computeTableProfile` returns, per group and class, the count and the cards, each with its clause, scope and label.
4.2 Order is fixed: groups and classes in table order, cards by name. The same input gives the same profile byte for byte, whatever the input order.
4.3 The profile records an input hash (card names and texts), the definitions version and the Spellbook lookup state with its time.
4.4 The bracket-rule group always lists its four classes, zeros included. Other empty classes are hidden behind "show all classes".
4.5 A **table line** is a typed summary for templates: counts per group, the four bracket-rule counts, and each count's label. Example (illustration): "Gives 5 · Takes 3 (mass removal 2: 1 each player, 1 opponents only) · Combat 2 · Shared 1 · Bracket rules: 0 Game Changers, 0 extra turns, 0 mass land denial, two-card combos not checked".

### 5. Surfaces

5.1 **Builder panel** "What this deck does to the table", beside the combos panel and private to the editor. It opens on the table line; each class expands to its cards, each card shows its clause, and "Exact" and "Heuristic" badges carry one-line definitions. A details row shows the definitions version and the lookup state.
5.2 **Rule 0 sheet.** I-15's calculated column (1.4) shows the table line. Beside the declared combos, extra turns and resource denial fields (I-15 1.2) it shows the computed counts with their cards: two-card combos; extra turns; mass land denial with taxes and restrictions. The product never fills a declared field (I-15 1.3); "copy into my sheet" lets the owner do it, as I-65 8.3 does.
5.3 **Pod fit check** (G-02, I-15 slice 4). Each consented deck's line and bracket-rule counts appear in the four-way comparison, labelled Computed. When a declared field and its computed counterpart differ, the prompt is a question that names the cards: "The sheet says no resource denial. The list holds Winter Orb (mass land denial, heuristic). Talk about it before the game?" It never says which is right, and reads only decks their owners shared.
5.4 **Public deck page** (slice 7): the owner chooses off, line only, or the full panel. The default is open question 2.
5.5 **Readers.** I-68's "Your deck and this guide" panel for the politics and group hug guides, I-75 slice 14's computed facets, I-77's list of what an estimate cannot see and I-79's side-by-side sets read the profile through the deck-analysis entry point. This spec changes none of them.

### 6. Built on the board, or from hand (Later, estimate)

6.1 For each route I-65 lists, the profile states whether the route's cheapest complete set (I-65 6.1) needs a permanent on the battlefield before the turn the route ends, or can be cast from hand in one turn on the mana I-65's floor assumes.
6.2 The sentence quotes its source, Wizards' "telegraphed on the board" and "deployed in one big turn from hand" [2], and is labelled estimate. It never names a bracket for the deck; I-28's check owns any finding.

### 7. Measurement

7.1 Card fixtures name a card for each phrasing of each class and for each known near-miss (Testing strategy).
7.2 The owner labels about 30 decks with the classes each card belongs to, as [I-65 open question 2](i65-how-this-deck-wins.md#open-questions) and [I-54 4.4](i54-find-your-next-commander.md#4-one-play-style-vocabulary) propose. Precision and recall per class are published on I-34 slice 3's methods page with the definitions version and date.
7.3 A heuristic class whose precision falls below the owner's floor (open question 3) leaves the sheet, the pod check and public pages, and stays in the builder panel marked "low precision".

### 8. Wording and French

8.1 Every sentence comes from a template with typed slots. Templates, class names and definitions exist in English and French at launch.
8.2 Group names describe direction, not intent: "Gives to opponents", "Takes from opponents", "Shapes combat", "Shared designations", "Grows with the number of opponents", "Named in the bracket rules".
8.3 French names reuse I-54's French vocabulary where a class matches a style. Community terms without an established French form (goad, group hug, pillowfort) keep the English term with a French definition until a French reviewer decides (open question 6).

### 9. Tagger and salt (Later, gated)

9.1 Tagger clauses join through I-67 slice 7 once L-22 allows display, as I-65 slice 8 does. They add the punisher class and widen heuristic classes, and each match then names its source: an Oracle pattern with the definitions version, or a tag with the file date.
9.2 Community salt appears only under licence: EDHREC card salt through D-25 and I-29 slice 13 ([L-24](../legal-questions.md#l-24-edhrec-the-cross-site-index-and-the-database-right)), Spellbook combo salt through D-25 ([L-23](../legal-questions.md#l-23-commander-spellbooks-combo-data)). It sits beside the profile, never inside it, labelled as community opinion with its source and date (I-15 4.2). [I-29 6.1](i29-cross-site-deck-index.md#6-statistics-computed-from-the-index) forbids copying EDHREC's salt.
9.3 Until then, the bracket-rule group and the theft and taxes classes stand in for salt on the sheet.

### 10. Free and paid

10.1 One deck's profile, in the builder, on the sheet, in a pod's first comparison and on a public page, is free under [I-30 1.1 and 1.4](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line): it is evidence about the player's own list. D-95 recommends that the first pod comparison stays free.
10.2 A deck's profile across versions, or a pod's across weeks, belongs to the pod pass candidate (I-30, D-95, I-65 11.3), not to a paid line here. Free competitors describe commanders, not a player's list over time, so the history is the part a subscriber could value. The case is unproven: no product found charges for it.

## Data model / API

```
TableGroup     gives | takes | combat | shared | perOpponent | bracketRules
Certainty      exact | heuristic | notChecked
Scope          eachPlayer | eachOpponent | oneOpponent | chosenPlayer
TableClassId   groupHug | selectiveGift | wheel | donate | groupSlug | massRemoval | theft | taxes | punisher
               | goad | forcedAttack | attackDeterrent | monarch | initiative | vote | perOpponent
               | gameChanger | extraTurn | massLandDenial | twoCardCombo
Clause         from I-65 slice 1: oracleText{pattern, scope} | keywordAction{name, crRule}
               | officialFlag{field} | spellbook{cardCount} | tagger{tag}            -- tagger in slice 8 only
TableClassDef  id, version, group, certainty, nameEn, nameFr, definitionEn, definitionFr, crRule?, source?, clauses[]
CardTableMatch cardName, commandZone, classId, clauseId, scope, certainty
ComboState     checked{observedAt, twoCard[]} | notChecked{reason}
TableProfile   inputHash, definitionsVersion, combos: ComboState, classes[]{classId, count, matches[]}, line: TableLine
```

- `classifyCard` and `computeTableProfile` are pure functions in `deck-analysis/domain/table-effects/`. Slices 1 to 3 add no table and no route: the builder computes on the client from the deck it holds, and I-15 computes the line from the deck version it already loads for a consented share.
- Slice 7 adds `GET /api/decks/[id]/table-effects`, which applies the owner's visibility and caches by `inputHash`.

## Non-goals

- A threat, salt, "archenemy" or manners score; ranking decks by how they treat the table; any verdict on a deck or a player.
- Predicting what opponents will do or how a table will react; simulating games (I-21, I-31).
- Naming the opponents' cards that beat a deck ([I-65](i65-how-this-deck-wins.md#non-goals)'s non-goal).
- Copying EDHREC salt or showing Tagger tags before their licences (I-29 6.1, L-22).
- A model choosing, ranking or rewording a class.
- Per-deck overrides of a class. A pod reads the line, and an override would let a list hide what it does; a wrong match is fixed in the definitions, with a fixture case.
- Filling I-15's declared fields, or inferring intent from a list (I-15's non-goal).
- Blocking a build, a save or a share.

## Testing strategy

- **Solitary, card fixtures** (Oracle text read 2026-11-11 [16]): Howling Mine and Heartbeat of Spring are group hug, each player; Phelddagrif is a selective gift, one opponent; Windfall is a wheel; Zedruu the Greathearted is donate; Wrath of God is mass removal, each player; Cyclonic Rift is one-sided mass removal through its overload only; Hostage Taker and Control Magic are theft; Thalia, Guardian of Thraben is a tax on each player; Ghostly Prison and Propaganda are attack deterrents; Disrupt Decorum is goad; Palace Sentinels is monarch and Throne Warden has no class; Time Stretch and Perch Protection (one opponent) are extra turns; Stranglehold is a restriction and not an extra turn; Armageddon, Winter Orb and Blood Moon are mass land denial; Council's Judgment is a vote; Blood Artist ("target player loses") has no class; Rhystic Study and Smothering Tithe have no class in version 1.
- **Solitary, labels:** an exact class never holds a pattern clause; every match carries its clause's scope; reminder text never matches.
- **Sociable:** `computeTableProfile` on three recorded fixture decks (group hug, taxes, goad) gives the expected counts and cards, identical across two runs and shuffled input.
- **Degradation:** a Spellbook timeout shows "two-card combos not checked" while every other group renders.
- **Wording:** every English and French template passes the verdict-word scan.
- **Boundaries:** no table-effects file imports the AI client, React, Prisma or Tagger data.
- **I-15:** the line never writes into a declared field; a revoked share removes the line from the pod view.

## Delivery slices

| #   | Slice                                                                                                                                                                        | Depends on                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Twenty classes as versioned data in I-65's clause format, with scope and label; `classifyCard`, `computeTableProfile`, the table line; card fixtures                         | I-65 slice 1                                                              |
| 2   | Builder panel "What this deck does to the table": groups, cards, clauses, badges, the bracket-rule group with "not checked"; English and French templates; verdict-word test | 1                                                                         |
| 3   | Rule 0 sheet: the table line in the calculated column; computed counts beside the declared combos, extra turns and resource denial fields; "copy into my sheet"              | 2; I-15 slice 2                                                           |
| 4   | Owner-labelled fixture of about 30 decks; precision and recall per class on the methods page; the floor rule (7.3)                                                           | 1; I-34 slice 3; the owner labels the decks                               |
| 5   | Pod fit check: line and counts per consented deck in the four-way comparison; declared-versus-computed questions                                                             | 3; I-15 slice 4                                                           |
| 6   | Built on the board or from hand, per route, labelled estimate                                                                                                                | 2; I-65 slices 3 and 4                                                    |
| 7   | Public deck page: the owner's switch and `GET /api/decks/[id]/table-effects`                                                                                                 | 2; owner decision (open question 2)                                       |
| 8   | Tagger clauses through the Oracle Tags join; the punisher class; a source per match                                                                                          | 1; I-67 slice 7; **Blocked** for release on L-22                          |
| 9   | Community salt beside the profile, labelled as opinion and dated                                                                                                             | 2; I-29 slice 13; **Blocked** on D-25, L-24 (EDHREC) and L-23 (Spellbook) |

Slices 1 to 3 need no new data source and no stored state. Slice 2's "early" qualifier on two-card combos stays hidden until I-28 slice 2 ships, so slice 2 does not wait for it. I-28 slice 7 gains "I-78 slice 1" as a dependency (neighbour table).

## Open questions

1. **Heuristic classes before measurement.** Slices 2 and 3 ship heuristic classes before slice 4 measures them. Show them on the sheet with their label (proposed), or keep them in the builder panel until slice 4? The owner decides.
2. **Public default.** Off, line only, or full panel? Line only is proposed: unlike I-65's routes, which can expose weaknesses, every fact here derives from a list that is already public. Decide with [D-48](../owner-decisions.md#product-scope-and-non-goals), I-65's route default.
3. **The precision floor** for 7.3, and whether recall needs one. I-54 4.4 uses a floor without a number; one owner number could serve both specs.
4. **Theft and taxes on the sheet.** Wizards' text names only Game Changers, mass land denial, extra turns and two-card combos [1]. The theft and taxes classes go on the sheet as product classes, labelled so, never in the "named in the bracket rules" group. Is that the right line?
5. **Salt and Tagger letters.** Add to [D-25](../owner-decisions.md#data-sources-and-partners)'s letter whether EDHREC card salt and Spellbook combo salt may be shown, credited, on a deck page and in the pod check, and whether either must stay out of every paid feature (L-24). Add I-78's classes to the Tagger request (L-22). Research, not legal advice; both go to I-30's lawyer list.
6. **French names.** Keep goad, group hug and pillowfort in English with a French definition, or translate them? A named French reviewer decides, as I-68 also needs.

## Sources

Read 2026-11-11 unless dated otherwise.

1. Wizards of the Coast (Gavin Verhey for the Commander Format Panel), "Introducing Commander Brackets Beta", 2025-02-11. https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
2. Wizards of the Coast (Gavin Verhey for the Commander Format Panel), "Commander Brackets Beta Update – October 21, 2025", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
3. Scryfall, bulk data index: the "Oracle Tags" entry, updated 2026-11-10T22:00:35Z. https://api.scryfall.com/bulk-data
4. Scryfall search API, Commander-legal counts for each `otag:` and Oracle-text query in this spec (**computed** 2026-11-11), for example https://api.scryfall.com/cards/search?q=otag%3Agroup-hug%20f%3Acommander and https://api.scryfall.com/cards/search?q=o%3A%2Fbecomes%3F%20the%20monarch%2F%20f%3Acommander
5. Scryfall, Tagger tags documentation: HTTP 403 to automated reads on 2026-11-11. https://scryfall.com/docs/tagger-tags
6. Playgroup.gg, Commander archetypes (no date on page), seen 2026-11-11. https://playgroup.gg/commander/archetypes
7. Playgroup.gg, Group hug commanders (no date on page), seen 2026-11-11. https://playgroup.gg/commander/archetypes/group-hug
8. EDHREC, Gluntch, the Bestower, Pillow Fort theme page (no date on page), seen 2026-11-11. https://edhrec.com/commanders/gluntch-the-bestower/pillow-fort
9. John Sherwood, "Digital Deckbuilding – Archidekt Deck Comparison and EDHREC Salt Scores", EDHREC, 2024-03-27. https://edhrec.com/articles/digital-deckbuilding-archidekt-deck-comparison-and-edhrec-salt-scores
10. ScrollVault, "How the Salt Score Works", last updated 2026-07-16. https://scrollvault.net/methodology/salt-score.html
11. Ethan Coover, "Introducing Commander Spellbook's Salt Score", EDHREC, 2026-10-09. https://edhrec.com/articles/introducing-commander-spellbooks-salt-score
12. r/EDH, "What are your threat assessment tips and rules of thumb?", 2025-11-08 (score and comments from the Arctic Shift archive). https://www.reddit.com/r/EDH/comments/1orb6cd/
13. r/EDH, "Commander threat assessment: why tables kill the visible threat and miss the real one", 2026-04-16 (Arctic Shift). https://www.reddit.com/r/EDH/comments/1sn7uf0/
14. r/EDH, "Cards, decks and Commanders that ARE the correct threat assessment", 2025-09-28 (Arctic Shift). https://www.reddit.com/r/EDH/comments/1nsltai/
15. Arctic Shift, r/EDH titles containing "archenemy" since 2025-01-01 (**computed**: 69 titles, 1,635 points). https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=archenemy&after=2025-01-01&limit=100 ; the quoted thread, 2026-10-17: https://www.reddit.com/r/EDH/comments/1x8guim/
16. Scryfall API, card collection lookups for the fixture cards named in the testing strategy, 2026-11-11. https://api.scryfall.com/cards/collection

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

### Goals

- A group-hug player opens the panel and reads one line of counts per group and the four bracket-rule counts, expands each class to its cards and the clause that matched, and sees which classes are exact and which heuristic; the pod's Rule 0 sheet shows the same line beside the declared fields without filling any of them, and a Spellbook timeout reads "two-card combos not checked".

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-78-01

As a player sitting down, I want to see what this deck does to the other three players, so that the sheet can mention extra turns or land denial without calling the deck rude.

#### US-78-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-78-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-78-01 Happy path

Given a signed-in player and the English locale
When each class names its definition and the cards.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-78-02 Happy path

Given a signed-in player and the English locale
When the words salty, unfair and threat do not appear.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-78-03 Happy path

Given a signed-in player and the English locale
When a declared field on the Rule 0 sheet is not overwritten.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-78-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-78-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-78-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in for the private panel. No flag for the private panel once the definitions pass. Salt stays behind D-25.

#### AC-78-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-78-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-78-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A line on the builder and, when I-15's comparison exists, a computed column. Public pages stay off until the owner decides.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Classes are versioned definitions over oracle text, Game Changers and Spellbook. No new feed. No stored score.

### Analytics and telemetry

`table_line_shown {classes: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in for the private panel. No flag for the private panel once the definitions pass. Salt stays behind D-25.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether heuristic classes reach the sheet before they are measured is open. Tagger clauses wait on the licence.

### Sources

- https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
- https://www.reddit.com/r/EDH/comments/1orb6cd/

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-78-101

As a player, I want the product to twenty classes in six groups as versioned data in I-65 slice 1's clause format, each match with a scope (each player, each opponent, one opponent, a chosen player) and an Exact or Heuristic label: mass land denial follows Wizards' definition, extra turns list every phrasing, and the monarch means bringing it into the game., so that the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

#### AC-78-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Twenty classes in six groups as versioned data in I-65 slice 1's clause format, each match with a scope (each player, each opponent, one opponent, a chosen player) and an Exact or Heuristic label: mass land denial follows Wizards' definition, extra turns list every phrasing, and the monarch means bringing it into the game. classifyCard, computeTableProfile and a typed table line; punisher stays "not checked" until Tagger clauses (slice 1).

#### AC-78-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-78-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-78-102

As a player, I want the product to the builder panel "What this deck does to the table": the table line, each class with its cards and the clause that matched, Exact and Heuristic badges, the bracket-rule group with its zeros, "two-card combos not checked" when Spellbook is down, and English and French templates that pass I-65's verdict-word test with "salty", "archenemy", "threat" and "unfair" added (slice 2)., so that the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

#### AC-78-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The builder panel "What this deck does to the table": the table line, each class with its cards and the clause that matched, Exact and Heuristic badges, the bracket-rule group with its zeros, "two-card combos not checked" when Spellbook is down, and English and French templates that pass I-65's verdict-word test with "salty", "archenemy", "threat" and "unfair" added (slice 2).

#### AC-78-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-78-105 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-78-103

As a player, I want the product to the Rule 0 sheet: the table line in I-15's calculated column, and computed counts with their cards beside the declared combos, extra turns and resource denial fields, with "copy into my sheet"; no declared field is ever filled (slice 3)., so that the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

#### AC-78-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The Rule 0 sheet: the table line in I-15's calculated column, and computed counts with their cards beside the declared combos, extra turns and resource denial fields, with "copy into my sheet"; no declared field is ever filled (slice 3).

#### AC-78-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-78-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-78-104

As a player, I want the product to later: about 30 owner-labelled decks and precision and recall per class on the methods page, with a floor that takes a weak class off the sheet (slice 4); each consented deck's line in I-15's pod fit check, with mismatches worded as questions that name the cards (slice 5); "built on the board or from hand" per route, labelled estimate (slice 6); the owner's switch for public pages (slice 7); Tagger clauses and the punisher class after L-22 (slice 8); community salt beside the profile, labelled as opinion, after D-25 (slice 9)., so that the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

#### AC-78-109 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later: about 30 owner-labelled decks and precision and recall per class on the methods page, with a floor that takes a weak class off the sheet (slice 4); each consented deck's line in I-15's pod fit check, with mismatches worded as questions that name the cards (slice 5); "built on the board or from hand" per route, labelled estimate (slice 6); the owner's switch for public pages (slice 7); Tagger clauses and the punisher class after L-22 (slice 8); community salt beside the profile, labelled as opinion, after D-25 (slice 9).

#### AC-78-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-78-111 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

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

## I-78: What This Deck Does To The Table

**Spec:** [`specs/i78-what-this-deck-does-to-the-table.md`](i78-what-this-deck-does-to-the-table.md)

**Outcome:** the deck page lists, with counts and the cards, what the deck gives to, takes from and provokes in the other three players: group hug, gifts, wheels and donation; group slug, mass removal, theft and taxes; goad, forced attacks and attack deterrents; the monarch, the initiative and votes; effects that grow per opponent; and the four categories the bracket rules name (Game Changers, mass land denial, extra turns, two-card combos). Each class is labelled exact or heuristic, never as an opinion, and the Rule 0 sheet and the pod fit check read one line from it.

**Status:** Next
**Priority:** Next for slices 1 to 3 (the definitions and the profile, the builder panel, the Rule 0 sheet line), directly after I-65; Later for slices 4 to 9, which wait for the owner's labelled decks, I-34 slice 3, I-15 slice 4, I-65 slices 3 and 4, a decision on public pages, L-22 (Tagger) and D-25 (salt). One deck's profile is never paid
**Impact / effort:** Medium / medium
**Depends on:** I-65 slice 1 for the classes (slice 1); I-15 slice 2 for the sheet line (slice 3); I-34 slice 3 and the owner's labelled decks for precision and recall (slice 4); I-15 slice 4 for the pod fit check (slice 5); I-65 slices 3 and 4 for "built on the board or from hand" (slice 6); an owner decision for public pages (slice 7); I-67 slice 7, blocked for release on L-22, for Tagger clauses (slice 8); I-29 slice 13, blocked on D-25, L-24 and L-23, for salt (slice 9).

No file under `src` classifies the monarch, the initiative, goad, group hug, pillowfort, theft or donation. `detectThemes`'s Stax rule (`src/lib/deck/themes.ts`) folds phrases such as "each opponent" into one theme confidence, mass land denial and extra turns appear only as rules in the copilot's prompt, and the Spellbook schema drops `salt` (checked on `dev` at `2cf792e8`). Wizards' bracket text names four table effects and describes Bracket 2 wins as "telegraphed on the board" ([update](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025), 2025-10-21). Players ask: "What are your threat assessment tips and rules of thumb?" drew 99 points and 130 comments on r/EDH ([thread](https://www.reddit.com/r/EDH/comments/1orb6cd/), 2025-11-08), and 69 r/EDH titles since 2025-01-01 contain "archenemy". Scryfall Tagger already classifies these behaviours per card (on 2026-11-10, `symmetrical` 891, `group-slug` 849 and `per-opponent` 480 Commander-legal cards), but its tags wait for [L-22](../legal-questions.md#l-22-scryfalls-tagger-tags), so version 1 matches Oracle text. The tools found score power or sum opinion salt (Archidekt, ScrollVault); none lists what a player's own list does to the table. [I-65](i65-how-this-deck-wins.md) maps how a deck ends a game and grades nothing, so hosting table effects there would change its outcome; I-78 is a third card taxonomy beside I-65's route roles and I-31's lab kinds, and reuses I-65's definition format.

### Scope

- [ ] Twenty classes in six groups as versioned data in I-65 slice 1's clause format, each match with a scope (each player, each opponent, one opponent, a chosen player) and an Exact or Heuristic label: mass land denial follows Wizards' definition, extra turns list every phrasing, and the monarch means bringing it into the game. `classifyCard`, `computeTableProfile` and a typed table line; punisher stays "not checked" until Tagger clauses (slice 1).
- [ ] The builder panel "What this deck does to the table": the table line, each class with its cards and the clause that matched, Exact and Heuristic badges, the bracket-rule group with its zeros, "two-card combos not checked" when Spellbook is down, and English and French templates that pass I-65's verdict-word test with "salty", "archenemy", "threat" and "unfair" added (slice 2).
- [ ] The Rule 0 sheet: the table line in [I-15](i15-rule-zero-sheets-and-pod-profiles.md)'s calculated column, and computed counts with their cards beside the declared combos, extra turns and resource denial fields, with "copy into my sheet"; no declared field is ever filled (slice 3).
- [ ] Later: about 30 owner-labelled decks and precision and recall per class on the methods page, with a floor that takes a weak class off the sheet (slice 4); each consented deck's line in I-15's pod fit check, with mismatches worded as questions that name the cards (slice 5); "built on the board or from hand" per route, labelled estimate (slice 6); the owner's switch for public pages (slice 7); Tagger clauses and the punisher class after L-22 (slice 8); community salt beside the profile, labelled as opinion, after D-25 (slice 9).
- [ ] Added 2026-11-12 (thirteenth pass): two readers of slice 1's matches. [I-99](i99-a-pilot-sheet-and-how-heavy-this-deck-is-to-pilot.md) reads `extraTurn`, `monarch` and `initiative` for its turn-length drivers and tracked pieces; [I-100](i100-cards-that-work-against-each-other.md) reads every match with `scope: eachPlayer` and adds what it hits in the owner's own list. Neither adds a class here, and the owner-labelled fixture of slice 4 serves all three.

### Engineering enablers

- Card fixtures name one card per phrasing and per known near-miss: Throne Warden and Blood Artist have no class, Stranglehold is not an extra turn, and Cyclonic Rift is one-sided mass removal only through its overload.
- The same input gives the same profile byte for byte, whatever the order; an exact class never holds a pattern clause; reminder text never matches.
- No table-effects file imports the AI client, React, Prisma or Tagger data, and slices 1 to 3 add no table and no route.

**Paid-tier angle:** one deck's profile, in the builder, on the sheet, in a pod's first comparison and on a public page, is free: it is evidence about the player's own list. A profile across versions or weeks belongs to I-30's pod-pass candidate, not to a paid line here, and no product found charges for it.

### Enrichment (2026-11-11)

**User story.** As a player sitting down, I want to see what this deck does to the other three players, so that the sheet can mention extra turns or land denial without calling the deck rude.

**Acceptance.**
- Each class names its definition and the cards.
- The words salty, unfair and threat do not appear.
- A declared field on the Rule 0 sheet is not overwritten.

**UX.** A line on the builder and, when I-15's comparison exists, a computed column. Public pages stay off until the owner decides.

**Data and API.** Classes are versioned definitions over oracle text, Game Changers and Spellbook. No new feed. No stored score.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `table_line_shown {classes: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in for the private panel. No flag for the private panel once the definitions pass. Salt stays behind D-25.

**Open questions.** Whether heuristic classes reach the sheet before they are measured is open. Tagger clauses wait on the licence.

### Definition of done

A group-hug player opens the panel and reads one line of counts per group and the four bracket-rule counts, expands each class to its cards and the clause that matched, and sees which classes are exact and which heuristic; the pod's Rule 0 sheet shows the same line beside the declared fields without filling any of them, and a Spellbook timeout reads "two-card combos not checked".

---

