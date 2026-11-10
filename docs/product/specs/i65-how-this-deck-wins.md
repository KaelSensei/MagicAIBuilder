# I-65: How This Deck Wins

> **Initiative:** I-65, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for the route model, the map for one deck and its uses in I-15, I-02 and the primer (slices 1 to 11); Later for model phrasing, assembly odds and comparisons (slices 12 to 15), which wait for I-30, I-31, I-55 and I-15; slice 16 waits for I-30's decision gate · **Written 2026-11-10**
> **Placement:** the evidence does not support folding this into [I-31](i31-deck-lab.md) or [I-15](i15-rule-zero-sheets-and-pod-profiles.md). I-31 classifies cards for mana simulation, not for winning, and I-15 records only what a player states (I-15 requirement 1.3). The closest home is [I-03](../roadmap.md#i-03-trustworthy-deck-feedback), as computed feedback. This spec stays separate because it owns the route model that I-15, I-28, I-02, I-31 and I-54 read.
> **Research:** one dated note on the official bracket texts, Commander Spellbook's API and bracket code, Scryfall's Oracle Tags file, five deck tools and pregame conversations. It is not committed, so every external fact links its own entry in [Sources](#sources). Moxfield and Reddit refused automated reads; rows that rest on search summaries say so. Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the route model (route kinds, the rule that ends the game, the roles each route needs, the answer classes), the route roles computed per card, the map for one deck (cards, redundancy, finders, protection, turn estimate, common answers), its sentence templates, the computed "how it wins" line offered to I-15 and the primer, the wizard's plan-versus-result check, and route comparisons. **Does not own:** the Spellbook lookup, its cache and rate limits ([I-09](../roadmap.md#i-09-meta-and-evidence), shipped in #1324); the player's single category and the display of function tags ([I-37](i37-editor-depth.md)); the play-style vocabulary and its definition format ([I-54](i54-find-your-next-commander.md)); bracket rules and the bracket check ([I-28](i28-commander-deckbuilding-guide-by-bracket.md), I-03); declared sheets (I-15); simulation ([I-21](i21-reproducible-probability-bench.md), I-31); rule text and citations ([I-47](i47-rules-answers-for-this-deck.md)); pricing (I-30).

## Overview

Players ask "how does your deck win?" before games with strangers [24][26]. The product answers part of it today: a list of Commander Spellbook combos. Combos ended 8.1% of 399,857 recorded multiplayer games [22]. The routes that ended the other 92% or so (**computed**) are not shown.

This initiative computes a **route map** for one deck. A route is a way the game can end: a combo, an alternative-win card, commander damage, combat (often with tokens), drain, mill, poison, or a lock that stops opponents while another route finishes. For each route the map shows the cards by role, how many cards fill each role, the tutors that can find the pieces, the protection that can defend them, an earliest-turn estimate labelled as an estimate, and the classes of cards that commonly stop the route.

Everything is computed from card data, Spellbook's data and versioned definitions. No model decides a route. A model may only reword a templated sentence, and a check rejects any wording that changes a fact. The map never grades the deck: no "weak", no "should", no score.

**Example (illustration, not computed).** An aristocrats list shows: _Drain: 3 payoffs (Blood Artist, Zulaport Cutthroat, Cruel Celebrant), 4 sacrifice outlets, 14 fodder makers; 2 tutors can find a creature; 1 protection piece; estimate: payoff and outlet castable by turn 3 on mana alone. Commonly stopped by: creature removal, effects that exile instead of dying (Rest in Peace), graveyard exile for the recursion pieces._

## What the market does

Read on 2026-11-10 unless dated otherwise. "Not found" means not found in the pages read, not proof of absence.

| Product                           | What it shows for a deck                                                                                                                                                                                                                     | How                                                                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commander Spellbook** [5][6][7] | Combos the list holds, plus combos it "almost" holds by adding colours or changing commanders; per combo: cards, results, prerequisites, mana needed, mana value needed, a bracket tag (E, C, O, P, S, R, B), popularity in EDHREC decklists | A curated combo database. Its bracket estimator gives each combo a speed of 1 to 5 from the mana value it needs, and flags lock, extra turns and mass land denial. Rule-based; code is MIT-licensed |
| **EDHREC** [13][14]               | For a commander, not a list: theme tags with deck counts (Krenko, Mob Boss: Goblins 4.22K, Tokens 2.67K, Combo 741 of 45,195 decks); a Combos tab with results and inclusion percentages                                                     | Aggregates partner decks; the combos come from Spellbook ([competitive landscape](../competitive-landscape.md)), though the combo page does not say so. No win-condition section                    |
| **Archidekt** [15][16]            | A Combos tab finding "complete and partial combos in your deck" (2025-12-17); cards grouped by their "primary assigned category"                                                                                                             | Spellbook; given the 2025 combo-vote data to estimate brackets                                                                                                                                      |
| **Moxfield** [21]                 | An estimated bracket marked "Est."                                                                                                                                                                                                           | Search summaries only: a combo signal reportedly from Spellbook's bracket API. Not verified; Moxfield answered 403                                                                                  |
| **DeckCheck** [17]                | A written synopsis with "a primer on how it wins, its weaknesses, and its key cards" (updated 2026-10-17); combos through Spellbook                                                                                                          | "AI grades the twelve benchmarks, and fixed rules do all the math after that"; the page does not say who writes the synopsis                                                                        |
| **Playgroup** calculator [18]     | Two-card combos "tagged for locks, skipped turns, mass land denial, and extra turns", as bracket evidence                                                                                                                                    | Spellbook; no win conditions, no speed                                                                                                                                                              |
| **TableCommander** [19]           | A bracket estimate; flags "alternate win conditions"; an "early" combo is "cheap enough to assemble and fire in the first few turns"                                                                                                         | Rule-based; ignores "Overall strategy"                                                                                                                                                              |
| **Grimoria** [20]                 | Active combos and combos missing one piece, each with result, "power score" and prices                                                                                                                                                       | Spellbook                                                                                                                                                                                           |

**The gap.** Every tool found shows combos, and most read them from Spellbook. None maps the routes that are not combos, counts how many cards fill each role, matches tutors and protection to the pieces they can reach, or lists what commonly stops a route. The only "how it wins" text found is DeckCheck's written synopsis, produced by a scan whose benchmarks are AI-graded and whose form asks for "context for the AI"; the page does not say who writes the synopsis [17]. Spellbook already publishes a deterministic speed method, which this spec reuses rather than inventing one [7].

**Why it matters.**

- **Wizards defines brackets by how decks win and how fast.** The current text (2025-10-21) gives each bracket its win conditions: "highly thematic or substandard" (1), "incremental, telegraphed on the board, and disruptable" (2), "can be deployed in one big turn from hand" (3), "efficient and instantaneous" (4), "optimized for efficiency and consistency" (5). It gives turn expectations: at least nine, eight, six and four turns for brackets 1 to 4, and "any turn" for 5. It wants "no game-ending combos at the lower brackets", and "If a combo could frequently come up, it's not the best fit for that bracket" [1]. The 2025-02-11 launch said "No intentional early-game two-card infinite combos" for bracket 3; its only "game plans" are those "that mess with several of people's lands" [2]. On 2026-02-09 Wizards called the brackets "a tool to guide pregame conversations" and kept the beta label [3][4].
- **The pregame question is "how does it win, and when".** MagicCon Chicago's Commander play area, named The Command Zone, printed "How does your deck win?" and "What turn does your deck usually win on?" as pregame prompts (2025-02-21 to 23) [24]. On r/EDH a player calls "how many turns does your deck on average present a win" the best question for strangers (2024-06-11, search summary) [26]. No Command Zone podcast episode on this question was found. EDHREC (2026-06-11) notes that disclosure has a cost: "now your opponents know precisely what your weaknesses are", and not sharing is the player's choice [25]. The map is therefore private by default.
- **How games end.** Playgroup's logs: combat damage 53.3%, non-combat damage 20.9%, combo 8.1%, commander damage 8.0%, alternative win 6.6%, mill 1.8%, poison 1.2% (399,857 multiplayer games, updated 2026-11-04) [22]. In September 2026, combo games averaged 7.2 rounds and combat games 8.9 (40,897 games) [23]. The bracket guide already carries these figures ([How games are actually won](../guides/commander-deckbuilding-by-bracket.md#how-games-are-actually-won)).

**Scryfall Tagger as a source of card function.** Scryfall's bulk data lists an "Oracle Tags" file, "sourced from Tagger, the Scryfall community tagging project", updated 2026-11-09 [9]. That file holds 4,617 tags on 36,453 Oracle IDs, in a hierarchy with parent and child tags (**computed** from the file [10]). It names route functions directly: `alternate-win-condition` (87 Oracle cards), `overrun` (96), `blood-artist-ability` (40), `mill-opponent` (482 with children), `poison-mechanics` (198), and answer classes such as `hate-graveyard` (449), `removal-artifact` (1,256) and `platinum-angel-effect` (12). Spellbook searches the same tags with its `otag` and `function` keys [5]. This resolves [I-37](i37-editor-depth.md)'s open question on whether bulk data carries tags (line 259): it does, as [I-54](i54-find-your-next-commander.md) source 34 also found. No licence for the tags was found, and scryfall.com answered 403 on 2026-11-10 [12]; [I-54 open question 1](i54-find-your-next-commander.md#open-questions) already asks Scryfall in writing.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **One label per card.** `categorizeCard` ([`src/lib/deck/categories.ts`](../../../src/lib/deck/categories.ts), lines 77–94) returns one `CardCategory`, checking `winCondition` before ramp. `isWinCondition` (lines 57–65) matches "win the game", "infinite", infect, "poison counter", "combat damage" with "each opponent", and "storm count". Tutors become `draw` (line 86). Hexproof and indestructible count as protection only at mana value 3 or less (lines 70–74). `DeckCard.category` is one string in [`prisma/schema.prisma`](../../../prisma/schema.prisma) (line 289); `Deck.tags` (line 119) is deck-level only, and `otag` appears nowhere in `src`.
- **Measured on 35 hand-picked route cards (computed, not a random sample).** Run with Node 22.23.4 on Scryfall data fetched 2026-11-10 [11], `categorizeCard` labels 9 as `winCondition`: the 5 alternative-win cards and the 4 poison cards. It labels 0 of 6 combat finishers (Craterhoof Behemoth: `creature`), 0 of 7 drain finishers (Blood Artist: `creature`; Aetherflux Reservoir: `artifact`), 0 of 4 mill cards, 0 of 3 equipment, 0 of 4 combo pieces and 0 of 2 lock pieces. Sword of Fire and Ice becomes `draw`, Deflecting Swat `instant`. In the Oracle Tags file, 28 of the 29 single-card finishers carry a tag naming their route function; Blackblade Reforged does not. Akroma's Will carries both `gives-double-strike` and `protects-all`: one card, two roles.
- **Combos are found and partly read.** `requestDeckCombos` (`src/lib/combos/find-my-combos.ts`, added by #1324) makes one Spellbook call per card list, cached 6 hours (`combo-cache.ts` line 14) and capped at 60 calls a minute per instance (`lookup-policy.ts` line 21). Its schema (lines 21–31) reads `id`, `uses`, `requires`, `produces`, texts, prerequisites and `manaNeeded`, and only the `included` bucket (lines 111–117). `isInfinite` comes from a keyword list over effect names (lines 39–54). It does not read `manaValueNeeded`, `bracketTag`, `popularity`, a feature's `status` or a card's `zoneLocations`, all in Spellbook's schema [6]. [`CombosPanel.tsx`](../../../src/components/deck/CombosPanel.tsx) shows cards, effects and prerequisites.
- **Win speed in the bracket score.** `scoreWinSpeed` ([`src/lib/deck/bracket.ts`](../../../src/lib/deck/bracket.ts), lines 62–81) counts single-label `winCondition` cards and text containing "win the game", "storm" or "infinite". Lines 200–204 set any deck with a two-card infinite to bracket 4, labelled "(RC rule)" at line 117; [I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 2 replaces that override with the official rule (I-28 line 40).
- **Themes are not routes.** `detectThemes` ([`src/lib/deck/themes.ts`](../../../src/lib/deck/themes.ts)) scores 17 themes by keyword hits, with confidence `min(1, hits / 10)` (line 301, **computed** from the formula). Its "Combo" theme matches "search your library", "copy" and "each time" (lines 99–111). [`stats.ts`](../../../src/lib/deck/stats.ts) line 96 calls it. I-54 requirement 4.1 replaces these names.
- **The AI plan's win conditions are fixed text.** `DeckPlan.winConditions` ([`src/lib/ai/deck-plan.ts`](../../../src/lib/ai/deck-plan.ts), lines 8–13) comes from a table of eight strategies (lines 40–120), for example voltron's "Deal 21 commander damage", or from a template (lines 205–211). It is sent to the model (lines 234–243) and shown in [`DeckWizard.tsx`](../../../src/components/deck/DeckWizard.tsx) (lines 496–503). Nothing checks whether the built deck contains that route.
- **The primer asks for routes by hand.** The primer template in [`src/messages/en/deck.json`](../../../src/messages/en/deck.json) line 837 has "## Win conditions … List the primary and backup paths to win."
- **The end rules are in the repository.** The Comprehensive Rules file of 2026-08-07 ([`MagicCompRules-20260807.txt`](../../../src/lib/rules/data/MagicCompRules-20260807.txt)) holds 104.2b (an effect says a player wins), 104.3b (life 0), 104.3c (drawing from an empty library), 104.3d (ten poison counters), 104.3e (an effect says a player loses), 903.10a (21 combat damage from one commander) and 700.4 ("dies").

**Overlaps resolved.**

| Initiative                                             | What it says                                                                                                                                                                                               | Resolution                                                                                                                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [I-31](i31-deck-lab.md)                                | "Roles are single labels" (line 57); norms use the single `category` (2.5, line 78); its classifier serves mana simulation (2.1)                                                                           | I-31 keeps its lab kinds. Route roles are a separate, multi-label layer that never overwrites `category`. I-31's engine supplies assembly odds (slice 13)                                                             |
| [I-03](../roadmap.md#i-03-trustworthy-deck-feedback)   | Outcome: "the player understands what is wrong with a deck"; combo detection shipped; "Keep warning calculations deterministic"                                                                            | The map is computed feedback in I-03's sense, but states facts and no faults. Whether `scoreWinSpeed` reads route data is for I-03 and the power meter (open question 4)                                              |
| [I-15](i15-rule-zero-sheets-and-pod-profiles.md)       | Records "how the deck wins" (1.2, line 37), player-stated only (1.3); shows the computed bracket beside it (1.4); non-goal: inferring intent (line 79)                                                     | The declared field stays declared. The route summary appears in the calculated column, the way 1.4 shows the bracket. The owner may copy it into the declared field; the product never does                           |
| [I-28](i28-commander-deckbuilding-guide-by-bracket.md) | The guide's sections "win conditions and combos" and "how games are actually won" (1.1, 1.2, lines 50–51); rule constants shared with the check (3.1); one shared vocabulary with I-15 and I-27 (line 141) | I-28 owns the official turn expectations and the combo rule; the map displays them from the same constants. I-65 owns the route names, and I-28, I-15 and [I-64](i64-help-centre-and-guidance.md)'s glossary use them |
| [I-48](i48-official-changes-reach-every-deck.md)       | Maps each `categorizeCard` role to a Scryfall tag (4.3, line 95)                                                                                                                                           | I-48 may use route roles for replacement candidates once slice 3 ships; its table stays valid until then                                                                                                              |
| [I-54](i54-find-your-next-commander.md)                | Owns one play-style vocabulary and "a versioned definition of Tagger tags, Oracle text patterns, keywords and types" (4.1–4.2, lines 100–101), applied to a deck's cards (4.5)                             | A style says how a deck plays; a route says how a game ends. Route definitions reuse I-54's format and compilers; each style may link the routes it usually uses                                                      |
| [I-02](i02-checkable-ai-copilot.md)                    | "Structured plan before generation" (line 38); the plan's win conditions are fixed text                                                                                                                    | The wizard compares the plan's intended routes with the routes found in the built deck (slice 11). I-02 owns the wizard; I-65 supplies the check                                                                      |

## Functional requirements

### 1. Ground rules

1.1 Every route, role, count, estimate and answer class is computed by code from card data, Spellbook's data and versioned definitions. No language model chooses, ranks or describes a route's facts ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 Every fact shows its source: Spellbook (with its variant link and lookup time), a Tagger tag (with the file date), or an Oracle text rule (with the definition version).
1.3 The map states facts and counts. Its text never contains a verdict about the deck ("weak", "bad", "you should", a score or a grade). A test scans every template for a fixed list of verdict words in English and French.
1.4 The map is private to the owner by default (requirement 8.2).
1.5 The map works with the copilot switched off and with Spellbook unavailable. A failed lookup shows "combos not checked", never "no combos", as `fetchCombosForDeck` already does.

### 2. The route model

2.1 There are eight route kinds. Each names the rule that ends the game:

| Route kind            | Ends the game by                                      | Roles the route needs                                                | Main detection source                                                                                                                |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Combo                 | Its result: a win, damage, life loss, mill or control | The variant's cards and templates                                    | Spellbook `included` variants with a Standalone result [6][8]                                                                        |
| Alternative win       | CR 104.2b or 104.3e                                   | The win card; its enablers                                           | `alternate-win-condition`; Oracle "you win the game" / "loses the game"                                                              |
| Commander damage      | CR 903.10a                                            | A creature commander; enhancers (power, double strike, evasion)      | Commander's type and power; `gives-double-strike`, equipment and aura boosts, evasion                                                |
| Combat                | CR 104.3b, through combat damage                      | Finishers (overrun, anthem, extra combat); creature and token makers | `overrun`, `anthem`, `power-boost-to-all`, `repeatable-creature-tokens`                                                              |
| Drain and aristocrats | CR 104.3b, by life loss or non-combat damage          | Payoffs; for aristocrats, sacrifice outlets and fodder               | `blood-artist-ability`, `drain-life`, `lifegain-to-damage`, `sacrifice-outlet`                                                       |
| Mill                  | CR 104.3c                                             | Opponent mill; mill multipliers                                      | `mill-opponent`, `mill-any`, `mill-each`                                                                                             |
| Poison and infect     | CR 104.3d                                             | Poison sources; proliferate                                          | Keywords infect, toxic, poisonous; `poison-mechanics`, `gives-infect`                                                                |
| Lock                  | Does not end the game; stops opponents acting         | Lock pieces; a link to the route that then finishes                  | Spellbook results containing "lock", skipped turns or control of opponents [7]; `prevent-cast` (94 cards), `prevent-activation` (91) |

2.2 Rule numbers come from the repository's dated Comprehensive Rules and render through I-47's citation contract.
2.3 Each route kind has a versioned definition in I-54's format: Tagger tags, Oracle text patterns, keywords and types, compiled to a local predicate and to a readable Scryfall query fragment. A definition change bumps its version, and the map shows the version it used.
2.4 Spellbook's Standalone results map to route kinds through a tested table of name patterns ("win the game" and "lose the game" to alternative win; "damage" to combat when it says combat and to drain otherwise; "lifeloss" to drain; "mill" without "self-mill" to mill; "lock", "skip" and "control" to lock; "turns" to an extra-turn result). An unmapped result shows as "combo: other result" with its Spellbook name. The Spellbook result decides the route kind; the variant's own text is never rewritten.
2.5 A variant with no Standalone result (for example infinite mana alone) is listed as an engine, not a route, under the routes that consume its output when Spellbook lists such a variant.

### 3. Route roles per card

3.1 Each main-deck card and each commander gets zero or more route roles. Roles never overwrite the player's `category` and are not stored on `DeckCard`.
3.2 Each role shows the clause that produced it (the tag, the pattern or the keyword) on demand.
3.3 Without the Oracle Tags file (open question 1), roles come from Oracle patterns and keywords alone, and the map says "function tags unavailable: fewer cards recognised".
3.4 The owner can add or remove a route role for a card in their deck. The change is stored per deck, marked "set by you", and included in the map's input hash.

### 4. Listing routes

4.1 A combo route is listed for each `included` variant with a Standalone result. Variants with the same cards and result kind group under one heading.
4.2 A single-card route kind is listed when the deck holds at least one card in each required role of its definition. The required roles are part of the versioned definition and shown on screen.
4.3 Combat is listed for any deck with creatures, because Playgroup's logs show it ends most games [22]. Its heading then shows the counts of finishers and creature or token makers; it makes no claim that the deck is built for combat.
4.4 Each route lists its cards by role with a count per role. The count is the redundancy; no threshold turns it into a judgment.
4.5 A card in several routes appears in each, with a shared-card marker, so the player sees which single card several routes rely on.

### 5. Finders and protection

5.1 **Tutors.** A tutor is listed under a route when its reach covers at least one piece: an unrestricted tutor, or a tutor whose Tagger child tag (`tutor-artifact`, `tutor-creature`, `tutor-enchantment` and others) or Oracle pattern matches the piece's type. Each listed tutor names the pieces it can reach. Land search is never a route finder.
5.2 **Card draw.** Repeatable draw (`draw-engine`) and burst draw are counted once per deck as general card flow and shown beside every route, not split across routes.
5.3 **Protection.** Counterspells, hexproof, indestructible, shroud and protection grants, phasing and "silence" effects are listed under a route when they can cover a piece: a spell on the stack for counterspells, a permanent of a matching type for grants, the combo turn for silence. Each names what it covers. Mana value never limits protection here, unlike `isProtection`.
5.4 Each route shows the counts of tutors and protection pieces with their names. No count is labelled enough or too few.

### 6. Turn estimate (always labelled "estimate")

6.1 **Mana-only floor.** For each route the map computes the earliest turn on which its cheapest complete set could be cast and activated, assuming every piece is in hand, one land drop each turn and no interaction. It shows two values: with no ramp, and with one cheap ramp piece (mana value 2 or less, the guide's definition) on turn 2 when the deck holds any. The assumptions are printed beside the number.
6.2 **Combo speed band.** Each combo also shows Spellbook's speed band from its `manaValueNeeded`: 0 gives 5, up to 4 gives 4, up to 6 gives 3, up to 8 gives 2, more gives 1, one higher when the mana listed is not an accurate minimum. The method links Spellbook's code [7].
6.3 **Commander damage.** The map shows the combat hits needed for 21 damage at the commander's printed power, then with each listed enhancer (for example 21 at power 5 needs 5 hits; with double strike, 3). This is arithmetic, labelled as such.
6.4 Beside the estimate, the map shows the deck's target bracket and Wizards' turn expectation for it, from I-28's constants with their date [1]. An estimate earlier than the expectation is stated as a fact ("earlier than the at least six turns bracket 3 describes"), never as a ruling. I-28's check owns any finding.
6.5 No damage clock is simulated for combat or drain. Assembly odds come only from I-31's seeded engine (slice 13), with seed, sample size and interval.

### 7. Common answers

7.1 Each route lists the classes of cards that commonly stop it, as a fixed, versioned table of answer classes. Each class has a plain one-line definition, its Tagger tags or Oracle patterns, and the number of Commander-legal cards in it at the file date.
7.2 A class attaches only when the route's pieces match it: graveyard exile (`hate-graveyard`, `graveyard-seal`) when a piece starts in the graveyard, by Spellbook's `zoneLocations`, or the route uses recursion; artifact removal (`removal-artifact`) when a piece is an artifact; ability counters (`counterspell-ability`) when a step is an activated or triggered ability; "can't win" effects (`platinum-angel-effect`) for alternative wins, mill and poison; sweepers and fogs (`sweeper`, `fog`) for combat; effects that exile instead of dying for drain routes that need "dies" triggers (CR 700.4); graveyard reshuffles (`restock-all`, `titan-immortality`) for mill.
7.3 Answers are classes, never the opponents' cards. The map never says a route will fail or that the deck lacks a backup.

### 8. Surfaces

8.1 **Builder panel** "How this deck wins", beside the combos panel, which it absorbs: combos become one route kind. English and French at launch.
8.2 **Public deck page.** The owner chooses: off (default), route kinds only, or the full map. Route kinds only shows names and counts, not cards, so a player can share "how it wins" without the weaknesses that worried EDHREC's writer [25].
8.3 **Rule 0 sheet.** I-15's calculated column shows one generated line per route kind, for example "Combo (2 lines), drain; earliest estimate turn 5". The declared "how the deck wins" field is never filled by the product (I-15 1.3); a "copy into my sheet" action lets the owner do it.
8.4 **Primer.** The template's "Win conditions" section can be pre-filled from the map, then edited by the owner, as I-28 4.7 does for mulligans.
8.5 **Wizard plan check.** After a build, each intended win condition in the plan maps to route kinds through a fixed table (voltron's "Deal 21 commander damage" to commander damage, and so on). The wizard shows which intended routes were found, with their counts, and which were not. It is information and never blocks the build.

### 9. Sentences and wording

9.1 Every sentence comes from a template with typed slots (route kind, counts, card names, turn, rule number). Templates exist in English and French and pass the verdict-word test (1.3).
9.2 An optional model rewording (slice 12) receives only the template output. Its result is accepted only if it contains exactly the same card names, numbers and rule numbers, no others, and no verdict word; otherwise the template text is shown. A reworded sentence carries a "worded by a model" label and counts against I-30's allowance.

### 10. Freshness and reproducibility

10.1 The map records its input hash (card list, overrides), the definitions version, the Oracle Tags file date, the Spellbook lookup time and the rules date, and shows them in a details row.
10.2 The same inputs give the same map, byte for byte, including order: routes by kind order, then cards by name and ID.

### 11. Comparisons (paid candidate; I-30 decides)

11.1 **Across versions.** Routes of two builds ([I-55](i55-one-deck-several-builds.md)) or two snapshots side by side: routes gained or lost, role counts, finders, protection and estimates.
11.2 **Across the pod.** For decks shared with a pod under I-15's consent, the route kinds of every deck and the answer classes each deck holds, listed per route kind. Only what each owner shared is read.
11.3 **Why it could sell, under [I-30](i30-business-model-and-paid-tier.md) 1.3:** it is a personal tool that computes over the player's own decks over time and over consented pod data. The free tools found show combos for one list [13][15][17][18][20]; none keeps routes across versions, and none has a consented pod to compare against. The single-deck map stays free under I-30 1.1 and 1.4: it is feedback and evidence. Case: **unproven**. No product was found charging for route analysis; DeckCheck's credits and plans ([I-31](i31-deck-lab.md) source 8, read 2026-11-09) pay for its AI-graded scans, not for routes.

## Data model / API

```
RouteKind        combo | alternativeWin | commanderDamage | combat | drain | mill | poison | lock
RouteDefinition  id, version, kind, endRule (CR number), roles[]{id, clauses[]}, requiredRoles[], answerClassIds[]
AnswerClass      id, version, label (en, fr), definition (en, fr), clauses[], appliesWhen
CardRouteRole    oracleId, roleId, clause, source (tagger | oracle | keyword | owner), fileDate?
RouteOverride    deckId, oracleId, roleId, action (add | remove), createdAt          -- Prisma model, per deck
RouteInstance    kind, source (spellbook | definition), spellbookId?, resultName?, cardsByRole{roleId: oracleId[]},
                 finders[]{oracleId, reaches[]}, protection[]{oracleId, covers[]}, estimate{noRamp, withRamp,
                 speedBand?, commanderHits?, assumptions[]}, answers[]{answerClassId, reason}
DeckRouteMap     deckId, inputHash, definitionsVersion, tagsFileDate, spellbookObservedAt, rulesDate,
                 routes[], engines[], sharedCards[]
```

- `computeRouteMap(deck, cardRoles, combos, definitions)` is a pure function in `src/lib/routes/`, tested with fixtures. The panel computes on the client; the public page and I-15 read `GET /api/decks/[id]/routes`, which applies visibility (8.2) and caches by `inputHash`.
- `SpellbookVariant` gains `manaValueNeeded`, `bracketTag`, a status per result and `zoneLocations` per card. The Spellbook call stays the one #1324 introduced.
- Card roles join on Oracle ID to the Oracle Tags file, read by the daily bulk job of I-29 slice 1, joined as I-54 requirement 7.1 does. There is never a second job.

## Non-goals

- A power score, a grade, or any judgment that a deck or route is good or bad.
- A rules engine or a game simulation; combat and drain clocks are not simulated (I-21, I-31).
- Inferring a player's intent. The map reports what the list can do; I-15 records what the player means to do.
- Naming the opponents' cards that beat a deck, or advice to "add a backup win".
- A second combo database, or scraping Spellbook; the per-deck call and its terms stay as #1324 built them.
- A model deciding or summarising routes. Rewording is optional, checked and labelled (9.2).
- Paywalling the single-deck map, its sources or its evidence ([strategic boundaries](../roadmap.md#strategic-boundaries)).

## Testing strategy

- **Solitary, definitions:** each route and answer definition against a fixture of named Oracle cards, including the 35-card sample above: Craterhoof Behemoth is a combat finisher, Blood Artist a drain payoff, Akroma's Will both a combat finisher and protection, and Blackblade Reforged recognised only through its Oracle pattern.
- **Solitary, Spellbook mapping:** each Standalone result name in a recorded fixture maps to one route kind or to "other"; a new name never throws.
- **Solitary, estimates:** the mana-only floor and the speed band against hand-computed cases, including `manaValueNeeded` 0 and a missing accurate minimum; commander hits for power 0, 5 and double strike.
- **Sociable:** `computeRouteMap` on three fixture decks (aristocrats, voltron, a two-card combo deck) gives the expected routes, counts, finders, protection and answers, identical across two runs and across shuffled input order.
- **Wording:** every English and French template passes the verdict-word scan; a model output that adds a card or changes a number falls back to the template.
- **Privacy:** route kinds only never exposes card names in the API response; an off map returns 404 to everyone but the owner.
- **Degradation:** a Spellbook timeout shows "combos not checked" while the other routes still render.

## Delivery slices

| #   | Slice                                                                                                                                   | Depends on                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Route kinds, role and answer-class definitions as versioned data with Oracle-pattern and keyword clauses, end rules, fixtures and tests | —                                                                                                                |
| 2   | Read `manaValueNeeded`, `bracketTag`, result status and `zoneLocations` from Spellbook; the tested result-to-route table                | —                                                                                                                |
| 3   | `computeRouteMap`: combo and single-card routes, multi-label roles, redundancy, shared cards, finders by reach, protection by coverage  | 1, 2                                                                                                             |
| 4   | Turn estimates: mana-only floor, Spellbook speed band, commander hits; the bracket's turn expectation beside them                       | 3; the bracket line waits for I-28 slice 2 and stays hidden until then                                           |
| 5   | Common answers attached by the 7.2 conditions, with counts at the file date                                                             | 3                                                                                                                |
| 6   | Builder panel "How this deck wins", absorbing the combos panel; English and French templates; verdict-word test                         | 3, 4, 5                                                                                                          |
| 7   | Owner overrides of route roles, stored per deck and hashed into the map                                                                 | 6                                                                                                                |
| 8   | Tagger clauses: route roles read the Oracle Tags join; daily conformance check of each fragment against a Scryfall `otag:` query        | 1; I-29 slice 1 and I-54 slice 2 (build the join there, never twice); **Blocked** for release on open question 1 |
| 9   | Public deck page visibility (off, kinds only, full) and `GET /api/decks/[id]/routes`                                                    | 6                                                                                                                |
| 10  | I-15 calculated line with "copy into my sheet"; primer pre-fill                                                                         | 9; I-15 slice 2                                                                                                  |
| 11  | Wizard plan-versus-result check                                                                                                         | 3; I-02 owner sign-off on the wizard step                                                                        |
| 12  | Optional model rewording with the 9.2 post-check and label                                                                              | 6; I-30 slices 1 and 2                                                                                           |
| 13  | Assembly odds: probability every piece of a route is in hand or reachable by a listed tutor by turn T, with seed and interval           | 3; I-31 slices 1 and 5                                                                                           |
| 14  | Route comparison across builds and snapshots                                                                                            | 6; I-55 slice 4                                                                                                  |
| 15  | Route comparison across a pod's consented decks                                                                                         | 14; I-15 slice 3                                                                                                 |
| 16  | Paid entitlement for 14 and 15, if I-30 decides so                                                                                      | 14, 15; **Blocked** on I-30's decision gate (slice 0) and I-30 slice 11                                          |

Slices 1 to 7 give a working, private map with no new data source: Spellbook data already flows, and Oracle patterns cover the rest at lower recall. Slice 8 is where most single-card recognition comes from: in the sample, Tagger tags named the route function of 28 of 29 single-card finishers, while today's labels name 9 of 35 route cards. Open question 1 therefore decides how good the map gets.

## Open questions

1. **May the product depend on Tagger tags?** The answer is shared with [I-54 open question 1](i54-find-your-next-commander.md#open-questions) and I-37 slice 18: ask Scryfall in writing whether the Oracle Tags file may feed derived, displayed roles, with attribution. Research, not legal advice; it goes to [I-30's lawyer list](i30-business-model-and-paid-tier.md#7-the-legal-gate).
2. **Which required roles make a route "listed"?** Slice 1 proposes one card per required role (4.2). An owner-labelled fixture of about 30 decks, with precision and recall per route kind published on the methods page ([I-34](i34-commander-data-reports.md) slice 3), would show whether that floor lists too many routes.
3. **Should "route kinds only" be the public default instead of off?** Off protects the owner's weaknesses [25]; kinds only would make more public decks answer the pregame question. The owner decides; [I-38](i38-trust-safety-and-user-rights.md)'s privacy defaults apply.
4. **Does the bracket score's `scoreWinSpeed` move to route data?** It counts single-label `winCondition` cards today. Replacing it changes bracket estimates for existing decks, so I-03, I-28 and the power-meter spec decide, with a before-and-after report on fixture decks.
5. **Spellbook's terms for derived display.** Its API asks for "sparse, unauthenticated requests", credit and a link back [6]. Does grouping its variants into routes and showing its speed band need more than that credit? Ask Space Cow Media with I-29's partner questions. Research, not legal advice; the terms question also goes to I-30's lawyer list.

## Sources

Read 2026-11-10 unless dated otherwise.

1. Wizards of the Coast (Gavin Verhey for the Commander Format Panel), "Commander Brackets Beta Update – October 21, 2025", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
2. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11. https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
3. Wizards of the Coast, "Commander Brackets Beta Update – February 9, 2026", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-february-9-2026
4. Wizards of the Coast, Commander format page: "In your pregame conversation, you can ask what bracket people's decks are"; "Commander Brackets are currently in beta". https://magic.wizards.com/en/formats/commander
5. Commander Spellbook, syntax guide: `otag`/`function` keys, results, `is:winning`, `is:lock`, `is:mld`, bracket tags, popularity from EDHREC decklists; "unofficial Fan Content permitted under the Fan Content Policy". https://commanderspellbook.com/syntax-guide/
6. Commander Spellbook, API schema version 7.3.6: `Variant`, `FindMyCombosResponse`, `CardInVariant.zoneLocations`, `Feature.status`, `EstimateBracketResult`; usage notes ("a few HTTP calls per user interaction", 80 requests a minute, "Please credit us, and link back"). https://backend.commanderspellbook.com/schema/
7. Commander Spellbook backend (MIT), `estimate_bracket` in `backend/spellbook/models/variant.py`: speed from `mana_value_needed`, lock from result names, relevance from Standalone results; master branch as of 2026-11-10. https://github.com/SpaceCowMedia/commander-spellbook-backend/blob/master/backend/spellbook/models/variant.py
8. Commander Spellbook, features endpoint: 1,347 features, of which 323 Standalone, 283 Contextual, 583 Helper and 158 Public Utility (**computed** from the paged responses). https://backend.commanderspellbook.com/features/
9. Scryfall, bulk data index: the "Oracle Tags" entry, "sourced from Tagger, the Scryfall community tagging project", updated 2026-11-09T22:00:34Z. https://api.scryfall.com/bulk-data
10. Scryfall, Oracle Tags file of 2026-11-09 (4,617 tags; 36,453 Oracle IDs; tag counts in this spec **computed** from it, children included). https://data.scryfall.io/oracle-tags/oracle-tags-20261109220034.jsonl.gz
11. Scryfall API, card collection lookups for the 35-card sample and 10 answer cards, 2026-11-10. https://api.scryfall.com/cards/collection
12. Scryfall, API documentation and terms: HTTP 403 to automated reads on 2026-11-10; the terms on paywalls and repackaging are quoted in [I-29 requirement 7.1](i29-cross-site-deck-index.md#7-monetization-constraints), read 2026-11-09. https://scryfall.com/docs/api
13. EDHREC, Krenko, Mob Boss commander page: tags with deck counts, sub-navigation, no win-condition section. https://edhrec.com/commanders/krenko-mob-boss
14. EDHREC, Krenko, Mob Boss combos page: result lines, inclusion percentages, bracket filter; no source named on the page. https://edhrec.com/combos/krenko-mob-boss
15. John Sherwood, "How to Use Archidekt", EDHREC, 2025-12-17. https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site
16. Nick Wolf, "Introducing the Commander Bracket Combo Vote", EDHREC, 2025-03-19. https://edhrec.com/articles/introducing-the-commander-bracket-combo-vote
17. DeckCheck, "How to use DeckCheck", published 2026-10-09, updated 2026-10-17. https://deckcheck.co/articles/howto
18. Playgroup.gg, Commander bracket calculator (no date on page). https://playgroup.gg/commander/bracket-calculator
19. TableCommander, "Bracket estimates" documentation (no date; mentions the October 2025 update). https://tablecommander.com/docs/decks/brackets
20. Grimoria, "Combo detection" help page (version string 2026110901). https://www.grimoria.app/help/deckbuilder/combo-detection
21. Moxfield, Commander brackets page: HTTP 403 on 2026-11-10. The row rests on search summaries of an r/magicTCG thread of 2025-02-13 on Moxfield's bracket identifier. https://moxfield.com/commanderbrackets and https://www.reddit.com/r/magicTCG/comments/1iolvus/
22. Playgroup.gg, "How to Play Commander": how games ended, 399,857 multiplayer and 103,454 duel games; median 9 rounds; updated 2026-11-04. https://playgroup.gg/commander/how-to-play
23. Playgroup.gg, September 2026 metagame report (40,897 games), published 2026-10-09. https://playgroup.gg/metagame/2026/september
24. MagicCon: Chicago 2025 (2025-02-21 to 23), The Command Zone play area page with pregame prompts. https://mcchicago.mtgfestivals.com/en-us/event-play/the-command-zone.html
25. Alex Wicker, "How Much Information Should Be Shared During Rule Zero?", EDHREC, 2026-06-11. https://edhrec.com/articles/how-much-information-should-be-shared-during-rule-zero
26. r/EDH, "Am I wrong?", 2024-06-11; search summary only, as Reddit refused automated reads. https://www.reddit.com/r/EDH/comments/1dd50uy/
