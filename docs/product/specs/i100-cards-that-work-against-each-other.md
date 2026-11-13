# I-100: Cards In This Deck That Work Against Each Other

> **Initiative:** I-100, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-12 · **Priority:** Next for slices 0 to 4 (the definitions, the findings, the builder panel and the per-deck dismissals); Later for slices 5 to 10, which wait for the owner's labelled fixture, I-34 slice 3, I-02's validator, I-76's candidate list, an owner decision on public pages and L-22 (Tagger) · **Paid:** never for one deck's findings · **Written 2026-11-12**
> **Placement:** the inverse of the combo panel. Commander Spellbook says which of a deck's cards win together; nothing in the product says which of them pull against each other. It sits beside [I-78](i78-what-this-deck-does-to-the-table.md), which classifies what a deck does to the other players, and reads I-78's symmetric matches instead of defining them twice. [I-03](i03-trustworthy-deck-feedback.md) keeps the deterministic rules check it shipped in #1328 (a card whose rules text cannot work under this commander); I-100 covers cards that work, and work against the deck's own plan.
> **Research:** one dated note of 2026-11-12, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public search on 2026-11-12, restricted to Commander-legal cards (`f:commander`, 32,643 cards that day). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the conflict classes and their versioned definitions (symmetric effects that hit the deck's own plan; payoffs with too few enablers), the counterpart each class counts in the player's own list, the findings and their exact and heuristic labels, the questions they are worded as, the per-deck dismissals, and the builder panel. **Does not own:** the clause format and the verdict-word list ([I-65](i65-how-this-deck-wins.md) slice 1, shared); the symmetric-effect clauses I-78 already defines (mass removal, taxes, wheels, mass land denial); the "cannot work with this commander" rules check (I-03, #1328); play styles and the style vocabulary ([I-54](i54-find-your-next-commander.md) slice 2); the copilot's validator ([I-02](i02-checkable-ai-copilot.md)); completion candidates ([I-76](i76-complete-this-deck-from-my-collection.md)); the methods page ([I-34](i34-commander-data-reports.md)); the Oracle Tags join ([I-67](i67-one-card-data-pipeline.md) slice 7).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I-78       | Its `CardTableMatch` with `scope: eachPlayer` is read by I-100 slice 1 for the classes both care about (`massRemoval`, `taxes`, `wheel`, `massLandDenial`). I-78 keeps the definitions; I-100 adds what each match hits in the owner's own list. No new class in I-78.                           |
| I-65       | No change to slice 1's clause format. I-100 adds its own definition files in that format and a `Counterpart` type of its own; it does not ask for a new clause kind.                                                                                                                             |
| I-03       | Slice 6 shows findings as a labelled warning class, "coherence", beside legality and the #1328 rules check, each naming its rule and its certainty, after D-97. I-03's own rules-text item is untouched: "cannot work" stays I-03, "works against your plan" is I-100.                           |
| I-02       | Slice 7: the suggestion validator reads `findSelfHits` on the projected deck, so a suggestion that would create a finding says so in its `checked` claims. The copilot never silences a finding.                                                                                                 |
| I-76       | Slice 8: each completion candidate carries the findings it would create, as a labelled column, never as a filter the player did not ask for.                                                                                                                                                     |
| I-54       | The payoff-and-enabler pairs of slice 2 reuse I-54 slice 2's style vocabulary where a style exists (Tokens, Spellslinger, Landfall, Lifegain, Counters, Aristocrats, Equipment, Auras, Artifacts, typal). `detectThemes` (`src/lib/deck/themes.ts`) is read, not duplicated, until I-54 maps it. |
| I-34       | The methods page gains one row per heuristic class with its precision on the owner-labelled fixture (slice 5), the same table I-78 slice 4 fills.                                                                                                                                                |
| I-15       | Nothing. Findings never reach the Rule 0 sheet, the pod comparison or a public page by default: they describe the deck's weak points, which EDHREC's own writer warns players against sharing [8].                                                                                               |
| I-64       | Three glossary terms: symmetric effect, payoff, enabler. Each finding's info button links to them.                                                                                                                                                                                               |

## Overview

A deck is built one card at a time, and some cards undo each other. A player adds Rest in Peace against the graveyard decks in their pod and forgets that their own eleven "whenever a creature dies" triggers now never see a graveyard. Another runs Blood Moon in a three-colour list with twenty-two nonbasic lands. A third has nine "whenever you cast an instant or sorcery" payoffs and fourteen instants and sorceries to cast. Players call the first two a "nonbo"; the third has no name, and it is the most common.

This initiative computes, for one deck, the places where the list pulls against itself. For each conflict class it names the card, the rule behind the conflict, how many of the deck's own cards it hits or how few enablers a payoff has, and a certainty label. It asks a question, never gives an order: "Rest in Peace exiles the 23 cards your graveyard plan depends on. Is that intended?" Many such pairs are intended, so a player can answer "I mean it" once per finding and the panel stays quiet until the count changes.

**Why a new initiative.** No initiative owns conflicts inside one list. I-03 flags a card whose rules text cannot work under the commander (#1328: Arcane Signet under a colourless commander), which is a rules fact, not a plan conflict. I-78 classifies what a deck does to the other players and records that a clause is symmetric, but does not count what the symmetric clause does to its owner. I-65 maps how a deck wins; I-09's combo lookup finds cards that win together. The inverse question, which cards lose together, has no home. **Why Next for the definitions and the panel.** They need no new data source, no table and no model, and they reuse the shared clause module I-65 slice 1 builds and I-78 slice 1 fills. **Why Later for the rest.** Precision needs the owner's labelled fixture, and the copilot, completion and public-page slices wait for their hosts.

## What the market does

All rows were read on 2026-11-12 unless dated otherwise.

| Product                             | What it does                                                                                                                                                                                                                                                                                                                                                                             | Source |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **MTG EDH, Card Synergies**         | "Flag anti-synergy where cards fight your commander, your packages, or your own win condition." The home page: "highlights cards that fight your commander or shut off your own engine." Neither page says whether code or a model produces a flag, names the rule behind one, shows a certainty, or gives a price. Posts on the site are dated up to 2026-11-10. Input is a pasted list | [1][2] |
| **Decks of KeyForge**               | SAS is written as "base AERC + synergy − antisynergy" with hoverable terms; antisynergy is a curated per-card trait, for KeyForge only                                                                                                                                                                                                                                                   | [3]    |
| **EDHREC, Lift**                    | Lift replaced synergy on 2025-12-15: "how often two cards are run together, relative to what random chance expects". A score below 1 means the cards "co-occur less often than random". It is a statistic over other players' decks, not a rule, and EDHREC does not show low-Lift pairs as a warning                                                                                    | [4]    |
| **Rate My Decks**                   | Free; a 1 to 10 power score over 12 factors "generated by deterministic heuristic rules, not AI". Its "deck doctor flags cards that push your bracket higher". Nothing on cards that hurt their own deck                                                                                                                                                                                 | [5]    |
| **ScryCheck**                       | Free; five vectors (speed, consistency, interaction, mana base, threats) and a bracket estimate; "Every point is traceable". Nothing on conflicts inside the list                                                                                                                                                                                                                        | [6]    |
| **EDHTuner** (v0.250.0, 2026-11-11) | Free goldfish runs and swaps: "each add fills something your plan is short on, swapped against the piece your deck can best spare"; "Cards you could cut". It fills shortages; it does not name a card that undoes another                                                                                                                                                               | [7]    |
| **AI analysers**                    | mtgsynergy.app and DeckStir advertise AI synergy analysis (search summaries only; neither page was read). Undisclosed methods are what r/EDH rejects, as the roadmap's [product direction](roadmap-context.md#owner-ambition-and-business-model-2026-11-09) records                                                                                                                      | —      |
| **Scryfall Tagger**                 | The community tag `symmetrical` covers 891 Commander-legal cards (**computed** by I-78 on 2026-11-11). Display waits on [L-22](../legal-questions.md#l-22-scryfalls-tagger-tags)                                                                                                                                                                                                         | I-78   |
| **This product**                    | `getCommanderRuleIssues` (`src/lib/deck/commander-rules-check.ts`, #1328) flags one rule, `colorless-identity-mana`, with its CR citations. It is the shipped precedent for a deterministic, labelled check                                                                                                                                                                              | code   |

**Player voice.** A title search of r/EDH for "nonbo", "non-bo" and "anti-synergy" since 2025-01-01 could not be completed on 2026-11-12: the archive answered every attempt with a timeout, and the two hits one attempt returned were about the card Anti-Venom, not the concept. The demand evidence this spec stands on is therefore the competitor that advertises the feature [1][2], the shipped #1328 check that players asked for ([I-03](i03-trustworthy-deck-feedback.md) cites the examples players gave), and the owner's own statement that deckbuilding advice must come from play experience, where "does this card hurt me" is the first question a pilot asks after a loss. The player-voice row is marked low evidence, and the impact table in the roadmap says so.

**The gap.** One product claims anti-synergy flags and shows neither method nor rule nor certainty. Nothing read counts what a symmetric card does to its owner's own list, and nothing read counts a payoff against its enablers. The product already has the pieces: stored Oracle text per deck card, I-78's symmetric scopes and I-65's clause module.

## Current state in this codebase

Verified on `dev` at `db3d45fb` (#1404) on 2026-11-12:

- **A rules check exists for one case.** `getCommanderRuleIssues` (`src/lib/deck/commander-rules-check.ts`) returns `CommanderRuleIssue` rows for one `CommanderRuleId`, `colorless-identity-mana`, with `COMMANDER_RULE_CITATIONS` (CR 903.4 and 106.5). It is the shape I-100 reuses: a typed id, a citation, a labelled issue.
- **Themes are phrase counts.** `detectThemes` (`src/lib/deck/themes.ts`) counts Oracle phrase hits per `ThemeName` (Tokens, Sacrifice, Reanimator, Voltron, Stax, Combo, Control, Aggro and others). It knows that a deck is "Sacrifice" from phrases such as "whenever you sacrifice"; it does not know how many sacrifice outlets the deck holds against how many death payoffs.
- **One label per card.** `categorizeCard` (`src/lib/deck/categories.ts`) gives a card one `CardCategory`; `isBoardWipe` matches "destroy all", "exile all" and "deals N damage to each", with no scope: Vandalblast's overload ("each artifact you don't control") and Shatterstorm ("destroy all artifacts") are the same to it.
- **Game Changer heuristics name three symmetric phrasings.** `detectGameChanger` (`src/lib/deck/validation.ts`) matches "search your library … put", "take an extra turn", "each opponent loses" and "win the game". It is a power heuristic, not a conflict check, and I-48 replaces the stored flag with the official list.
- **Oracle text is on every deck card.** `DeckCard.oracleText`, `typeLine`, `cmc` and `colorIdentity` are stored (`prisma/schema.prisma`), so the findings can be computed in the browser from the deck the builder already holds, as I-78 slices 1 to 3 do. Reminder text in parentheses is part of `oracle_text` as Scryfall serves it.
- **Nothing counts a payoff against its enablers**, and no file under `src` mentions a symmetric effect's cost to its owner. The combo panel (`src/modules/combos/`, the pilot context of the modular monolith) shows only what wins together.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `deck-analysis` ("read-only evaluation of a decklist"). Code goes under `src/modules/deck-analysis/domain/coherence/` as readonly types and pure functions ([ADR 0003](../../adr/0003-domain-as-readonly-data-and-pure-functions.md)), with the panel under `src/modules/deck-analysis/ui/`. The per-deck dismissal of slice 4 is the only write, in `infrastructure/` behind a port.

## Functional requirements

### 1. Principles

1.1 Every class, counterpart, count and label is computed by code from card text, type lines, the official Game Changer flag and versioned definitions. No language model chooses, ranks, phrases or hides a finding ([strategic boundaries](roadmap-context.md#strategic-boundaries)).
1.2 Every finding shows the clause that produced it, the rule or definition version behind it, and the cards it counts on the other side.
1.3 A finding is a question. Its text never contains a verdict ("cut", "bad", "mistake", "you should", a score or a grade). The verdict-word test of [I-65 1.3](i65-how-this-deck-wins.md#1-principles) runs on every template, in English and French, with "nonbo" added to the banned list: the product does not label a player's choice with slang.
1.4 Each finding carries one certainty label, I-78's `Certainty`: **exact** when both the clause and the counterpart follow a rules term, a keyword or a type line; **heuristic** when either side is a phrasing pattern or a threshold; **notChecked** when a source the class needs is unavailable.
1.5 Findings are private to the owner by default (requirement 7). They work with the copilot switched off and with Spellbook unavailable.
1.6 Reminder text in parentheses is removed before any clause matches, so "(This creature can't be blocked …)" never produces a finding.

### 2. Classes, definitions version 1

2.1 Two groups. **Group A, symmetric effects that hit the deck's own plan:** a card whose effect reaches the owner as well as the opponents, counted against the owner's own cards of the kind it reaches. **Group B, payoffs with too few enablers:** a card that rewards an action, counted against the owner's own cards that perform the action.

2.2 Group A classes. Clauses are examples; the definition file holds the full list. Counts are Commander-legal cards whose Oracle text contains the phrase (**computed**, 2026-11-12); the deck-side counterpart is what the class counts in the owner's list.

| Class                                | Clause examples                                                                                                                                                                     |     Legal cards (computed) | Counterpart in the owner's list                                                                                                             | Certainty |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Mass creature removal                | "destroy all creatures" (99), "exile all creatures", "each player sacrifices" a creature (69), "destroy all nonland permanents" (12); I-78's `massRemoval` with `scope: eachPlayer` |               99 / 69 / 12 | creatures in the main deck; the commander apart, since it returns to the command zone                                                       | exact     |
| Mass artifact or enchantment removal | "destroy all artifacts" (32), "destroy all enchantments"; never a clause with "you don't control" or "your opponents control"                                                       |                         32 | artifacts, enchantments; mana rocks counted and named                                                                                       | exact     |
| Nonbasic land denial                 | "nonbasic lands are Mountains" (3), "destroy all nonbasic lands", I-78's `massLandDenial`                                                                                           | 71 mention "nonbasic land" | nonbasic lands in the main deck                                                                                                             | exact     |
| Graveyard exile                      | "exile all cards from all graveyards" (2), "put into a graveyard from anywhere, exile it instead" (27) without "opponent"                                                           |                     2 / 27 | cards with "from your graveyard", "return … from your graveyard", "whenever … dies" (37), "whenever another creature you control dies" (29) | heuristic |
| Enters suppression                   | "don't cause abilities to trigger" (6)                                                                                                                                              |                          6 | cards with an "enters" trigger of their own                                                                                                 | exact     |
| Cast limits                          | "can't cast more than one spell each turn" (9) without "opponent"                                                                                                                   |                          9 | storm cards (33), "whenever you cast" payoffs (997 legal), instants and sorceries                                                           | exact     |
| Draw limits                          | "can't draw more than one card each turn" (2) without "opponent"                                                                                                                    |                          2 | cards that draw more than one card, "whenever you draw" payoffs                                                                             | exact     |
| Attack restrictions                  | "creatures can't attack" (31) without "you" or "planeswalkers you control" as the protected party                                                                                   |                         31 | creatures, "whenever ~ attacks" payoffs (1,165 legal)                                                                                       | heuristic |
| Life-gain denial                     | "players can't gain life" (11) without "opponents"                                                                                                                                  |                         11 | "whenever you gain life" payoffs (96), life-gain sources, lifelink                                                                          | exact     |
| Symmetric taxes                      | I-78's `taxes` with `scope: eachPlayer`                                                                                                                                             |                     I-78's | the deck's spell count by mana value                                                                                                        | heuristic |
| Wheels                               | I-78's `wheel`                                                                                                                                                                      |                     I-78's | cards that care about hand size or about keeping cards in hand                                                                              | heuristic |

2.3 Group B classes. The enabler counterpart is a count in the owner's list; a finding appears when the count is below the class threshold (2.5).

| Class                  | Payoff clause examples                                                                          | Legal payoffs (computed) | Enabler counterpart                                                       | Certainty |
| ---------------------- | ----------------------------------------------------------------------------------------------- | -----------------------: | ------------------------------------------------------------------------- | --------- |
| Instants and sorceries | "whenever you cast an instant or sorcery"                                                       |                      144 | instants and sorceries in the main deck (type line)                       | heuristic |
| Landfall               | the landfall keyword                                                                            |                      201 | lands, extra land drops, "put a land … onto the battlefield", fetch lands | heuristic |
| Life gain              | "whenever you gain life"                                                                        |                       96 | lifelink, "you gain N life" (1,741 legal cards mention gaining life)      | heuristic |
| Counters               | payoffs that read "+1/+1 counter" as a condition                                                |            part of 2,688 | "put a +1/+1 counter" sources (1,652 legal)                               | heuristic |
| Deaths and sacrifice   | "whenever a creature dies" (37), "whenever another creature you control dies" (29)              |                       66 | "sacrifice a creature" outlets (329 legal), creatures and token makers    | heuristic |
| Enters                 | "whenever a creature you control enters" (46), "whenever another creature enters" (13)          |                       59 | creatures, blink and flicker effects                                      | heuristic |
| Equipment              | payoffs on "equipped creature" that are not Equipment themselves, "whenever you attach"         |              part of 665 | Equipment in the main deck (type line)                                    | heuristic |
| Auras                  | payoffs on "enchanted creature" that are not Auras, "whenever you cast an Aura spell"           |            part of 1,056 | Auras in the main deck (type line)                                        | heuristic |
| Artifacts              | "whenever an artifact enters" (5), affinity-style counts of artifacts you control               |             5 and others | artifacts in the main deck (type line)                                    | heuristic |
| Creature types         | "other Elves you control", "Elf creatures you control", from Scryfall's creature-type catalogue |                 per type | creatures of that type (type line), changelings counted                   | heuristic |
| Storm and copies       | the storm keyword (33), "copy that spell" (75)                                                  |                      108 | instants and sorceries with mana value 2 or less, free spells             | heuristic |
| Tokens                 | "creature tokens you control", "whenever you create a token"                                    |               per clause | cards that create tokens                                                  | heuristic |

2.4 Each definition holds an id, a version, its group and label, English and French names and one-line definitions, its clauses in [I-65 slice 1](i65-how-this-deck-wins.md#delivery-slices)'s format, its `Counterpart` (which deck-side selector it counts), its threshold for group B, and the CR rule or official source when there is one. Where I-78 already defines the clause, the definition says `from: I-78 <classId>` and holds no clause of its own.
2.5 Group B thresholds are data, versioned with the definitions. Starting values are proposals for [D-97](../owner-decisions.md#product-scope-and-non-goals): fewer than 20 instants and sorceries for a spell payoff; fewer than 4 sacrifice outlets for a death payoff; fewer than 6 Equipment for an Equipment payoff; fewer than 8 creatures of the type for a typal payoff; fewer than 6 life-gain sources for a life-gain payoff. Slice 5's fixture revises them, and the panel shows the threshold beside the count.
2.6 A scope word decides exactness. "Each player", "all", "players" without "opponent" are symmetric; "each opponent", "you don't control", "your opponents control", "target opponent" are one-sided and never produce a group A finding. Vandalblast and Shatterstorm, Narset, Parter of Veils and Spirit of the Labyrinth, Leyline of the Void and Rest in Peace are fixture pairs.

### 3. Findings for one deck

3.1 `findSelfHits(deck, defs)` returns, per group A class, each matching card with the counterpart count, the counterpart cards by name, the clause, the scope and the certainty. `findUnsupportedPayoffs(deck, defs)` returns, per group B class, the payoff cards, the enabler count, the enabler cards and the threshold. `computeCoherenceProfile` combines both.
3.2 Quantities are expanded. The commander and a partner are counted in the counterparts that reach the command zone (a mass creature removal does hit the commander on the battlefield) and marked "command zone"; the Considering and Sideboard boards count for nothing.
3.3 Order is fixed: groups, then classes in table order, then cards by name. The same input gives the same profile byte for byte, whatever the input order ([I-78 4.2](i78-what-this-deck-does-to-the-table.md#4-the-table-profile)).
3.4 A group A finding appears whenever a symmetric card is present and the counterpart count is above zero. The question is worded with the count: "Shatterstorm destroys the 14 artifacts in this deck, your 9 mana rocks among them. Is that intended?" A count of zero produces no finding: the card is one-sided in this list, and the panel says so under "show all classes".
3.5 A group B finding appears when the enabler count is below the threshold: "Nine cards reward casting an instant or sorcery; the deck holds 14 instants and sorceries (threshold 20). Is that intended?"
3.6 Nothing is stored for slices 1 to 3. The builder computes on the client from the deck it holds. Slice 4 adds the dismissal row; slice 9 adds a read route for public pages.

### 4. "I mean it"

4.1 The owner may dismiss one finding (one class, one card) with a single action. The dismissal is stored on the deck (`DeckCoherenceNote`), owner-only, and the panel moves the finding to a folded "answered" list.
4.2 A dismissed finding returns to the open list when its count changes by more than one card in either direction, with the old and new counts shown, so an "I mean it" given at 3 artifacts does not silence the same Shatterstorm at 15.
4.3 Dismissals never copy on fork, never appear in the shared or public projection, and never affect legality, the bracket estimate or any other initiative's output. A schema test guards the projections.

### 5. Where findings show

5.1 **Builder panel** "Cards that pull against each other", beside the combos panel and the I-78 panel, private to the editor. It opens on the count of open findings; each finding expands to its cards, its clause, its counterpart and its "I mean it" control.
5.2 **Deck page, owner's view:** the same panel, read-only.
5.3 **I-03's warnings (slice 6):** each open finding appears as a warning of class "coherence", labelled heuristic or exact, with its rule, after D-97. It never changes the legality verdict and is sorted after legality and after the #1328 rules check.
5.4 **Copilot (slice 7):** a suggestion whose projected deck would create or widen a finding carries a `checked` claim saying so, with the count. The copilot cannot remove a finding from view.
5.5 **Completion (slice 8):** I-76's candidate list shows, per candidate, the findings it would create, as a column the player may sort by and never as a hidden filter.
5.6 **Public deck page (slice 9):** off by default. The owner may switch the panel on for the public page; the shared-deck projection and the public projection exclude findings while the switch is off.

### 6. Evidence and precision

6.1 Card fixtures name a card for each clause of each class and for each known near-miss (Testing strategy).
6.2 The owner labels about 30 decks with the findings a careful player would raise, as [I-78 7.2](i78-what-this-deck-does-to-the-table.md#7-evidence-and-precision) does for table effects; the same decks serve both. Precision and recall per class go on I-34's methods page (slice 5).
6.3 A heuristic class whose precision falls below the owner's floor (D-97) leaves I-03's warnings, the copilot claims and the public page, and stays in the builder panel marked "low precision".

### 7. Visibility and wording

7.1 Findings are private by default. EDHREC's own writer warned that sharing how a deck wins tells opponents "precisely what your weaknesses are" [8]; a list of a deck's conflicts is the same information. Nothing reaches the Rule 0 sheet, the pod comparison or a public page unless the owner switches it on (5.6).
7.2 Every sentence comes from a template with typed slots (class, counts, card names, threshold, rule). Templates, class names and definitions exist in English and French at launch, and pass the verdict-word test (1.3).
7.3 French names follow the official French card vocabulary where one exists (destruction de masse, cimetière, entrée sur le champ de bataille) and keep the English community term with a French gloss where none does (storm, landfall), as I-78 8.3 does.
7.4 Each class has an info button to I-64's glossary (symmetric effect, payoff, enabler) and, where a CR rule applies, to I-47's versioned rule anchor.

### 8. Free and paid

| Part                                                                 | Free | Paid candidate | Why                                                                                                                                                                                |
| -------------------------------------------------------------------- | ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definitions, findings, the panel, dismissals, the I-03 warning class | Yes  | —              | Evidence about the player's own list stays free ([I-30 1.1 and 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). No part of this initiative is a paid candidate |

## Data model / API

```
CoherenceGroup     selfHit | unsupportedPayoff
Certainty          exact | heuristic | notChecked                      -- I-78's type, shared
CoherenceClassId   massCreatureRemoval | massArtifactRemoval | nonbasicLandDenial | graveyardExile | entersSuppression
                   | castLimit | drawLimit | attackRestriction | lifeGainDenial | symmetricTaxes | wheel
                   | spellsPayoff | landfallPayoff | lifeGainPayoff | countersPayoff | deathPayoff | entersPayoff
                   | equipmentPayoff | auraPayoff | artifactPayoff | typalPayoff | stormPayoff | tokensPayoff
Clause             from I-65 slice 1: oracleText{pattern, scope} | keywordAction{name, crRule} | officialFlag{field}
                   | spellbook{cardCount} | tagger{tag}                 -- tagger in slice 10 only
Counterpart        typeLine{types[]} | oracleText{pattern} | keyword{name} | nonbasicLands | manaRocks | creatureType{type}
CoherenceClassDef  id, version, group, certainty, nameEn, nameFr, definitionEn, definitionFr, crRule?, source?,
                   clauses[] | from: I-78 classId, counterpart: Counterpart, threshold? (group B)
CoherenceFinding   classId, cardName, quantity, commandZone, clauseId, certainty, count, counterpartCards[], threshold?,
                   question: TemplateId
CoherenceProfile   inputHash, definitionsVersion, thresholdsVersion, findings[], silent[]{classId, cardName, reason}
DeckCoherenceNote  id, deckId → Deck (Cascade), classId, cardName, countAtDismissal, dismissedAt
                   @@unique([deckId, classId, cardName])
```

- `findSelfHits`, `findUnsupportedPayoffs` and `computeCoherenceProfile` are pure functions in `src/modules/deck-analysis/domain/coherence/`. `CoherenceClassId` and `Counterpart` are discriminated unions with exhaustive `never` guards. Slices 1 to 3 add no table and no route: the builder computes on the client from the deck it holds.
- Slice 4 adds `DeckCoherenceNote` with `PUT|DELETE /api/decks/[id]/coherence/notes`, owner-only, and the schema test that keeps it out of `SHARED_DECK_SELECT` and the public projection.
- Slice 9 adds `GET /api/decks/[id]/coherence`, which applies the owner's visibility and caches by `inputHash`.

## Non-goals

- A synergy score, a coherence score, a grade, or a ranking of decks or players by it. The product counts and asks; it never grades (I-31's non-goal on power scores applies).
- An order to cut a card, an automatic cut, or a model proposing a replacement from a finding. A replacement is I-02's job, inside its allowance, and it must show the finding it answers.
- Positive synergy: combos stay Spellbook's through I-09, routes stay I-65's, co-occurrence stays EDHREC's. No second combo database.
- A rules engine. A finding is a count of cards that match a clause, not a simulation of the interaction.
- Cards that cannot work under the commander: that is I-03's rules check (#1328), which stays where it is.
- Reading other players' decks for conflicts: findings exist for the owner's own list only. I-94's pinned lists and I-15's pod comparison show none.

## Testing strategy

- **Classes (solitary):** one fixture card per clause and per near-miss, named in the definition file: Shatterstorm against Vandalblast; Rest in Peace against Leyline of the Void; Spirit of the Labyrinth against Narset, Parter of Veils; Rule of Law against Deafening Silence (noncreature only, still symmetric); Blood Moon with 0, 3 and 22 own nonbasics; Torpor Orb with and without own "enters" triggers. Reminder text is stripped before matching. An unknown class id fails to compile.
- **Counterparts (solitary):** type-line counts with quantities expanded; the commander counted and marked; Considering and Sideboard ignored; changelings counted for every creature type; a mana rock defined as an artifact whose Oracle text adds mana.
- **Thresholds and questions (solitary):** a payoff with enablers at, below and above the threshold; the template fills the right numbers; the verdict-word scan passes in English and French and fails on a template that contains "cut", "bad" or "nonbo".
- **Determinism:** two shuffled inputs give one profile byte for byte.
- **Dismissals (sociable):** owner-only writes; a count change of two re-opens the finding with both counts; a fork copies no note; the shared and public projections contain no note (schema test).
- **I-03 and copilot (sociable):** a finding shows as a "coherence" warning after legality; a projected suggestion that adds Rest in Peace to a reanimator fixture carries the claim; the panel is unchanged with the copilot switched off.
- **Accessibility and layout:** every control has a name and a keyboard path; a finding's certainty is a word and an icon, not a colour; at 360 px the panel stacks.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: a deck holding Shatterstorm and nine artifacts yields one `massArtifactRemoval` finding with `count: 9`.

## Delivery slices

| #   | Slice                                                                                                                                                                   | Depends on                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 0   | Owner: the public-page default, the precision floor, whether findings join I-03's warnings before the fixture, and the starting thresholds (D-97)                       | — (owner)                                      |
| 1   | Group A classes as versioned data in I-65's clause format, reading I-78's `eachPlayer` matches where they exist; `findSelfHits`; reminder-text stripping; card fixtures | I-65 slice 1; I-78 slice 1                     |
| 2   | Group B pairs with thresholds as data; `findUnsupportedPayoffs`; `computeCoherenceProfile`; fixtures                                                                    | 1; coordinate the vocabulary with I-54 slice 2 |
| 3   | Builder panel "Cards that pull against each other": questions, counts, clauses, certainty; the owner's deck page; English and French templates; verdict-word test       | 2                                              |
| 4   | "I mean it": `DeckCoherenceNote`, its routes, re-open on a count change, the projection schema test                                                                     | 3 (migration)                                  |
| 5   | Owner-labelled fixture of about 30 decks (shared with I-78 slice 4); precision and recall per class on the methods page; the floor rule (6.3)                           | 2; I-34 slice 3; the owner's labels            |
| 6   | I-03: the "coherence" warning class beside legality, each naming its rule and certainty                                                                                 | 3; D-97                                        |
| 7   | Copilot: `checked` claims on suggestions that create or widen a finding                                                                                                 | 3; I-02 slice 1's claim contract               |
| 8   | Completion: the findings column on I-76's candidates                                                                                                                    | 3; I-76 slice 5                                |
| 9   | Public deck page: the owner's switch and `GET /api/decks/[id]/coherence`                                                                                                | 3; owner decision (D-97)                       |
| 10  | Tagger `symmetrical` as a clause source, each match naming its source                                                                                                   | 1; I-67 slice 7; **Blocked** on L-22           |

Slices 1 to 3 need no new data source and no stored state. Slice 1 cannot start before I-65 slice 1 publishes the clause module and I-78 slice 1 fills the symmetric scopes; both are listed as able to start now on the [dependency page](dependency-graph.md). Scheduled agents must not pick slice 0 (the owner's), slice 6 or slice 9 before D-97 is committed, or slice 10 before L-22 is answered.

## Open questions

1. **D-97.** Does the public page ever show findings, and what is the default? Does a heuristic finding join I-03's warnings before the fixture measures it, or only after? What precision floor applies? Are the starting thresholds of 2.5 acceptable until slice 5 revises them? Recommended: private by default with an owner switch; warnings only for exact classes until slice 5; a floor of 0.8 precision on the fixture, as I-78 proposes; the 2.5 values as data.
2. **Shared fixture.** I-78 7.2 and this spec both ask the owner to label about 30 decks. Recommended: one labelling pass, one fixture file with both label sets, so the owner reads each deck once.
3. **Naming.** "Nonbo" is the community word and is banned from the product's own sentences (1.3). The panel is "Cards that pull against each other" in English; the French title needs a French-speaking player's check, with "Cartes qui se gênent" as the first proposal.
4. **Group B thresholds by bracket.** Should a spell payoff's threshold differ between a Bracket 2 and a Bracket 4 list? Recommended: one threshold per class in version 1; bracket-specific values only if slice 5's fixture shows the single value misfires by bracket.
5. **For the integrator.** Does `detectThemes` retire when I-54 slice 2 maps its vocabulary, or does it stay as the builder's theme chip? I-100 reads it and does not decide.

## Sources

Read on 2026-11-12 unless stated otherwise.

1. MTG EDH, "Card Synergies": "Flag anti-synergy where cards fight your commander, your packages, or your own win condition." <https://mtgedh.com/card-synergies/>
2. MTG EDH, home page: "Anti-synergy warnings: highlights cards that fight your commander or shut off your own engine." Posts dated up to 2026-11-10. <https://mtgedh.com/>
3. Decks of KeyForge, "About SAS": base AERC + synergy − antisynergy, with the warning that it "won't be right about every deck" (read by the eleventh pass, 2026-11-11, and cited in I-77). <https://decksofkeyforge.com/about/sas>
4. EDHREC, Julia Maddalena, "From Synergy to Lift: The Math Behind EDHREC's New Era of Recommendations", 2025-12-15: Lift as co-occurrence against chance; "if the lift score is less than one, then the events co-occur less often than random". <https://edhrec.com/articles/from-synergy-to-lift-the-math-behind-edhrecs-new-era>
5. Rate My Decks, home page: 12 factors, "generated by deterministic heuristic rules, not AI", "The deck doctor flags cards that push your bracket higher"; © 2025. <https://ratemydecks.com/en>
6. ScryCheck, home page: five vectors, "Every point is traceable", free; © 2026. <https://scrycheck.com/>
7. EDHTuner, home page, "Last updated November 11, 2026 (v0.250.0)": swaps "against the piece your deck can best spare", "Cards you could cut". <https://edhtuner.com/>
8. EDHREC, "How Much Information Should Be Shared During Rule Zero", 2026-06-11, as cited by [I-65 open question 2](i65-how-this-deck-wins.md#open-questions). <https://edhrec.com/articles/how-much-information-should-be-shared-during-rule-zero>
9. Scryfall, card search, read with a named User-Agent on 2026-11-12. Each count in section 2 is the `total_cards` of one query over `f:commander`, for example `o:"destroy all artifacts" f:commander` (32) and `o:"don't cause abilities to trigger" f:commander` (6). <https://scryfall.com/docs/api/cards/search>
10. Arctic Shift, r/EDH title search since 2025-01-01 for "nonbo", "non-bo" and "anti-synergy", attempted on 2026-11-12; every attempt returned a timeout, and one returned two posts about the card Anti-Venom. <https://arctic-shift.photon-reddit.com/>

## Feature contract (Full, 2026-11-12)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player who adds a symmetric card, or a payoff whose enablers are thin, finds out at the table. Nothing in the product, and nothing read in the market that shows its method, tells them before the game which of their own cards pull against each other, with the rule and the count behind the claim.

### Goals

- A player opens a reanimator list that holds Rest in Peace and sees one finding: the card, the 23 cards of their graveyard plan it exiles, the clause, the certainty "heuristic" and the question "Is that intended?". They answer "I mean it", the panel folds the finding, and it returns only when the count changes by more than one.

### Non-goals

- Do not reverse a non-goal already named in this file or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score this file does not already cite from a named source.

### Personas

The casual pod player and the bracket-focused player, who build by hand and meet their conflicts at the table. See the roadmap persona table.

### User stories

#### US-100-01

As a player building by hand, I want to see which of my cards hit my own board and which payoffs have too few enablers, so that I decide before the game, with the rule in front of me, rather than after a loss.

#### US-100-02

As a player who knows what I am doing, I want to answer "I mean it" once per finding, so that an intended symmetric card stops being raised until the deck around it changes.

#### US-100-03

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-100-04

As a player using a keyboard or a screen reader, I want each finding to have a name, a visible focus and a certainty in words, so that colour is not the only signal.

### Acceptance criteria

#### AC-100-01 Happy path

Given a signed-in player, the English locale and a deck holding Shatterstorm and nine artifacts
When the builder panel opens
Then it shows one mass-artifact-removal finding with count 9, the nine artifacts by name, the clause "destroy all artifacts", the label "exact" and a question; the French locale shows the French catalogue string for every control

#### AC-100-02 Error and failure

Given the dismissal write cannot finish
When the player retries or leaves the screen
Then the finding is still open, nothing is half-written, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-100-03 Edge cases

Given a deck whose only symmetric card is Vandalblast, or an empty deck
When the panel renders
Then it shows no finding, and under "show all classes" it says the card is one-sided in this list; it does not show a zero in place of an unknown value

#### AC-100-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the guest sees the panel for the deck in their session but no "I mean it" control, with a sentence saying an account keeps dismissals; the signed-in owner sees both

#### AC-100-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, the other eight keep key parity with `en` and may reuse the English text until a person reviews them, and no routed locale shows a hard-coded English control

#### AC-100-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player completes US-100-01 and US-100-02 without a pointer
Then every finding and control has an accessible name, focus returns to the finding after "I mean it", and the certainty is announced as a word

### UX flow and states

The panel sits beside the combos panel in the builder. It opens on the number of open findings. Each finding is one card: a sentence with the count, the cards on the other side on expand, the clause and the certainty, and "I mean it".

- Empty: "No card in this list pulls against another, by the version 1 definitions." The definitions version is shown.
- Loading: a busy state that keeps the layout still while the deck loads; the computation itself is synchronous on the client.
- Error: a dismissal that fails shows the catalogue message and a retry, with the finding still open.
- Partial: a class whose source is unavailable (I-78's matches not yet computed) shows "not checked" for that class, never zero.

### Data model and API

The types in [Data model / API](#data-model--api). Slices 1 to 3 store nothing. Slice 4 adds `DeckCoherenceNote`, owner-only, excluded from every projection. Slice 9 adds the read route behind the owner's switch.

### Analytics and telemetry

`coherence_opened {findings: 0 | 1 | 2-5 | 6+}` and `coherence_dismissed {classId}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Slices 1 to 3 are on for guests and signed-in players, since they compute from the deck in the session and store nothing. Slice 4's dismissals need an account. Slices 6 to 9 are behind an I-69 switch, `coherence.surfaces`, off until D-97 is committed and slice 5's floor is met.

### Dependencies

Hard waits are in the roadmap dependency table: I-65 slice 1 and I-78 slice 1 for slice 1. Slice edges stay in the table above and in `dependency-graph.md`.

### Risks and mitigations

- A finding read as an order to cut: the templates ask a question, the verdict-word test bans the imperative, and "I mean it" exists from slice 4.
- A heuristic class that misfires: the certainty label, the owner-labelled fixture, the precision floor and the "low precision" mark in the panel.
- A deck's weak points leaking: private by default; dismissals and findings excluded from every projection by a schema test; nothing on the Rule 0 sheet.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-97, the shared fixture, the French title, thresholds by bracket, and `detectThemes`'s future.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

Each scope line of the roadmap record below, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-100-101 Symmetric cards counted against the owner's list

As a player, I want each symmetric card in my deck shown with the number of my own cards it reaches and the rule behind it, so that I know what Blood Moon does to my 22 nonbasic lands before an opponent does.

#### AC-100-100 Happy path

Given a signed-in player, the English locale and a three-colour deck holding Blood Moon and 22 nonbasic lands
When the builder panel opens
Then it shows one nonbasic-land-denial finding with count 22, the lands by name, the clause and the label "exact", worded as a question

#### AC-100-101 Failure

Given the same deck and I-78's matches unavailable
When the panel renders
Then the classes that read I-78 show "not checked" with the reason, the classes I-100 defines itself still show their findings, and nothing shows a zero for an unchecked class

#### AC-100-102 Edge

Given a mono-red deck holding Blood Moon and three nonbasic lands
When the panel renders
Then the finding shows count 3 and names the three lands; the player can answer "I mean it" once slice 4 ships

#### US-100-102 Payoffs with too few enablers

As a player, I want a payoff whose enablers are below the threshold shown with both counts, so that I see "9 payoffs, 14 instants and sorceries, threshold 20" rather than discover a dead card in hand.

#### AC-100-103 Happy path

Given a deck with nine "whenever you cast an instant or sorcery" payoffs and 14 instants and sorceries
When the panel opens
Then it shows one spells-payoff finding with the two counts and the threshold, labelled "heuristic", as a question

#### AC-100-104 Failure

Given the same deck and the definitions fail to load
When the panel renders
Then it shows the catalogue message for the definitions, computes nothing, and invents no count

#### AC-100-105 Edge

Given the same deck after the player adds seven instants
When the panel recomputes
Then the finding closes, since 21 is above the threshold, and a dismissed finding on the same class stays folded with its old and new counts recorded

#### US-100-103 "I mean it" and the places findings may show

As a player, I want my dismissals kept on my deck and my findings kept private unless I switch them on, so that an intended choice is not raised every session and my deck's weak points stay mine.

#### AC-100-106 Happy path

Given an owner who dismissed a finding at count 3
When the count becomes 5
Then the finding re-opens with "3 → 5" shown, and the fork of the deck carries no dismissal

#### AC-100-107 Failure

Given the dismissal route answers 409 because another tab changed the deck
When the player retries
Then the retry uses the last confirmed deck version, and no second note is written for the same class and card

#### AC-100-108 Edge

Given the public page of the deck with the owner's switch off
When a visitor loads it and its API responses
Then no finding, no note and no class name appears in the response body, which a schema test asserts

### UX states for this feature

| State            | What the player sees                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | "No card in this list pulls against another, by the version 1 definitions." No invented row, author, price or score.                     |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                           |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                          |
| Partial          | Classes with an unavailable source are labelled "not checked". A short list is not padded to look finished.                              |
| Stale            | The definitions version and the deck version the findings were computed from are shown; a missing version is absent, not guessed.        |
| Guest            | The panel computes for the deck in the session. "I mean it" explains that an account keeps dismissals, and does not fail with a raw 401. |
| Signed-in        | Dismissals go to that account's deck only. Another player's notes are never in the response.                                             |
| English          | New controls use the `en` catalogue.                                                                                                     |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                            |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them.         |
| Keyboard         | Every finding and control can be reached without a pointer. Focus is visible and returns to the finding after an action.                 |
| Screen reader    | Each finding has an accessible name; certainty and counts are announced in words.                                                        |
| Colour           | Exact and heuristic differ by text and icon as well as hue, in both themes.                                                              |
| Success          | "I mean it" is confirmed in words. A second identical action does not write a second note.                                               |

### Alternate paths

- The player cancels a dismissal before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. Chrome strings switch. Card names and clauses stay the printing's language.
- Two dismissals overlap. Each rolls back to its own last confirmed value. One failure does not undo the other's success.

### Roadmap record (2026-11-12)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-100 is a link here.

## I-100: Cards In This Deck That Work Against Each Other

**Outcome:** a player sees, for their own list, which cards reach their own board as well as the opponents' (with the count of their own cards hit) and which payoffs have too few enablers (with both counts and the threshold), each with its clause, its rule and its certainty, worded as a question, dismissable once per finding, and private by default.

**Status:** Next
**Priority:** Next for slices 0 to 4; Later for slices 5 to 10, behind the owner's fixture, I-34 slice 3, I-02's claims, I-76's candidates, D-97 and L-22. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Medium. A heuristic finding can misfire, and a finding can read as an order. The label, the fixture, the question wording and "I mean it" are the mitigations.
**Depends on:** I-65 slice 1 (the clause module) and I-78 slice 1 (symmetric scopes) for slice 1; I-54 slice 2 for the shared vocabulary of slice 2 (coordinate, not a hard wait); I-34 slice 3 for slice 5; D-97 for slices 6 and 9; I-02 slice 1 for slice 7; I-76 slice 5 for slice 8; I-67 slice 7 and L-22 for slice 10.

Commander Spellbook says which cards win together; nothing in the product says which cards lose together. One competitor advertises "anti-synergy warnings" without showing its method, rule or certainty [1][2]; EDHREC's Lift is a co-occurrence statistic over other people's decks, not a rule [4]; the free power calculators read measure speed and bracket, not conflicts [5][6][7]. The product already stores Oracle text on every deck card, shipped a deterministic rules check for one case (#1328), and plans the symmetric scopes (I-78) and the clause module (I-65) this initiative reads. The two groups are symmetric effects counted against the owner's own cards (exact where the clause and the type line decide, as for Shatterstorm and 14 artifacts) and payoffs counted against their enablers (heuristic, with thresholds as data). Everything is a question, never a verdict, and private by default.

### Scope

- [ ] Group A, symmetric effects that hit the owner's own list: eleven classes as versioned data in I-65's clause format, four of them reading I-78's `eachPlayer` matches; `findSelfHits` with the counterpart count and cards; reminder text stripped; the scope words that make a clause one-sided (slice 1).
- [ ] Group B, payoffs with too few enablers: twelve pairs with thresholds as data; `findUnsupportedPayoffs`; `computeCoherenceProfile`, deterministic byte for byte (slice 2).
- [ ] The builder panel "Cards that pull against each other" and the owner's deck page: questions, counts, clauses, certainty; English and French templates; the verdict-word test with "nonbo" banned (slice 3).
- [ ] "I mean it": `DeckCoherenceNote`, owner-only routes, re-open on a count change of more than one, excluded from every projection by a schema test (slice 4).
- [ ] After the owner's decisions: the labelled fixture and the methods-page rows with the precision floor (slice 5); the "coherence" warning class in I-03 (slice 6); `checked` claims on copilot suggestions (slice 7); the findings column on I-76's candidates (slice 8); the public-page switch and read route (slice 9); Tagger's `symmetrical` after L-22 (slice 10).

### Engineering enablers

- `CoherenceClassId` and `Counterpart` are discriminated unions with exhaustive `never` guards; the definitions file is validated at build time, and a definition with an unknown class fails the build.
- The same owner-labelled fixture serves I-78 slice 4 and I-100 slice 5, so the owner labels each deck once.
- The schema test over `SHARED_DECK_SELECT` and the public projection gains the note table, so a finding or a dismissal can never leak through a projection change.

**Paid-tier angle:** none. Evidence about the player's own list stays free under I-30 1.1 and 1.2.

### Enrichment (2026-11-12)

**User story.** As a player building by hand, I want to see which of my cards hit my own board and which payoffs have too few enablers, with the rule and the counts, so that I decide before the game rather than after a loss.

**Acceptance.**

- A deck with Shatterstorm and nine artifacts shows one finding with count 9, the clause and the label "exact", as a question.
- A deck with nine spell payoffs and 14 instants and sorceries shows one finding with both counts and the threshold, labelled "heuristic".
- "I mean it" folds a finding, and the finding returns when its count changes by more than one.
- Nothing about findings appears in the shared or public projection while the owner's switch is off.

**UX.** A panel beside the combos panel, private to the editor and the owner's deck page. One finding per card, expanding to its cards, clause and certainty, with "I mean it".

**Data and API.** Pure functions over the deck in the browser for slices 1 to 3. One table, `DeckCoherenceNote`, for dismissals. One read route for public pages behind the owner's switch.

**i18n and access.** English and French chrome and templates through the message catalogues; card names and clauses stay the printing's language. Every control has an accessible name and a keyboard path, and certainty is a word and an icon, not a colour.

**Telemetry.** `coherence_opened {findings}` and `coherence_dismissed {classId}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Slices 1 to 3 on for everyone. Dismissals need an account. Slices 6 to 9 behind `coherence.surfaces`, off until D-97 and the precision floor.

**Open questions.** D-97; the shared fixture with I-78; the French title; thresholds by bracket; `detectThemes` after I-54 slice 2.

### Definition of done

A player opens a reanimator list that holds Rest in Peace and sees one finding naming the 23 cards of their graveyard plan it exiles, the clause, the certainty and the question; they answer "I mean it", the finding folds, and it returns only when the count changes by more than one; opening the same deck again shows the same findings in the same order; no finding or note appears in the public response while the owner's switch is off.

---
