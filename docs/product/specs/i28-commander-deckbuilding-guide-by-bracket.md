# Spec: Commander Deckbuilding Guide By Bracket (I-28)

> **Initiative:** [I-28 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Content:** [Building a Commander deck, bracket by bracket](../guides/commander-deckbuilding-by-bracket.md) — the sourced guide this initiative publishes — and its companion, [Opening hands, mana curves and play style in multiplayer Commander](../guides/commander-mulligans-curves-and-play-style.md) (researched 2026-11-09), with the project's own opening-hand simulation ([`scripts/research/commander-opening-hands/`](../../../scripts/research/commander-opening-hands/README.md)).
> **Owns:** authored deckbuilding guidance per bracket, and the bracket vocabulary shown to players. **Does not own:** rules explanations at the moment a warning fires (I-27), the bracket score itself (I-03 and [`commander-power-meter.md`](../commander-power-meter.md)), pod agreements (I-15), precon bundles (I-17).

## Overview

A player who picks a target bracket today gets a label and a Game Changers count. Nothing tells them what a bracket 2 deck should _contain_, how a bracket 3 game actually unfolds, or why their "bracket 3" deck keeps winning on turn five. This initiative publishes an authored, sourced guide that answers "how do I build for bracket N?" for all five official brackets, and connects it to the deck the player has open.

Building for a bracket takes knowledge of the format, of thousands of cards and of how games really play out. That knowledge exists, but it is scattered across official articles, data sites, the strategy press, video creators and forums, and much of it contradicts itself. The guide's job is to gather it, label every claim by the strength of its evidence, and keep it current.

## What the market does

The full research, with every source and date, is in the [guide's sources section](../guides/commander-deckbuilding-by-bracket.md). The sweep covered official Wizards of the Coast texts, EDHREC, the strategy press, creators, forums, cEDH resources, card-level data, gameplay datasets and mana-base math. In summary:

| Source                                                     | What it offers                                                                                                                                         | What it lacks                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Wizards of the Coast** (bracket articles, 2025–2026)     | The five brackets, the Game Changers list, turn expectations, the intent-over-checklist principle, official French names                               | No deckbuilding guidance per bracket, no official bracket on any precon, no checker. The system is still beta |
| **EDHREC**                                                 | One commander built at all five brackets; a per-bracket "Bracketology" series; bracket-filtered average decks                                          | No per-bracket composition numbers; filtered pages rely on self-declared brackets and can be thin             |
| **CoolStuffInc**                                           | The only one-article-per-bracket series in the press (Dec 2025), plus one budget deck per bracket (Mar 2026)                                           | Articles, not a tool; no link to the reader's own deck                                                        |
| **Card Kingdom, Draftsim, Commander's Herald**             | Levers for moving up or down a bracket, budget replacements, table-talk advice                                                                         | No numeric templates; sources disagree on Sol Ring, precons and what separates bracket 4 from 5               |
| **Bracket estimators** (Moxfield, Archidekt, Spellbook, …) | A floor from the official checklist signals; Commander Spellbook tags each combo with a bracket                                                        | Most cannot output bracket 1 or 5; they miss speed, synergy and consistency                                   |
| **Composition datasets** (EDHTuner, an Archidekt sample)   | Medians by declared bracket: ~36 lands at brackets 1–3, ~33–35 at 4, ~28 at cEDH; average mana value ~3.1 → ~2.1                                       | Self-declared labels, commercial authors, automated role counting                                             |
| **Playgroup.gg game logs**                                 | Hundreds of thousands of tracked games: how games are won, and how poorly a declared bracket predicts results (about one deck in four plays elsewhere) | Brackets mixed in the length data; no per-bracket game length published anywhere                              |
| **French community**                                       | Reaction videos in French; players say "bracket" and "Game Changers" in English                                                                        | No step-by-step French guide found; official French names ("catégorie", "Cartes à impact") unused in practice |

**The gap.** Every source above is either a rule without guidance, guidance without evidence labels, or data without explanation. None publishes a per-bracket guide that separates official rules from measured data from community opinion, and none links that guidance to the reader's own list. In French, the guide does not exist at all.

**What the data says about estimators.** The bracket a player declares explains only about 2–3% of game results in the Playgroup.gg sample, and players "rank their own decks in the correct order about 60% of the time, versus 50% for a coin flip". Corrected 2026-11-11: that figure is a pairwise ordering of one player's decks, not accuracy in placing a deck in its bracket ([Playgroup.gg](https://playgroup.gg/commander/power-level), updated 2026-11-10); this line said "owners place their own decks correctly about 60% of the time". A guide that only teaches the checklist reproduces the error. It must teach speed and consistency — the earliest realistic win turn, tutors, a commander that is the engine — alongside the counts.

## Current state in this codebase

Verified on `dev` on 2026-11-08:

- **No guide surface.** Routes under `src/app/[locale]/` include `rules/game-changers` and `rules/comprehensive`, both reference pages. Nothing teaches deckbuilding. The onboarding wizard (`src/components/onboarding/OnboardingWizard.tsx`) explains the interface, not the format.
- **Bracket model stops at 4.** `src/lib/constants/brackets.ts` declares `BracketLevel = 1 | 2 | 3 | 4`. Bracket 1 is named "Casual" (official: Exhibition) and has `allowsTutors: false`, a restriction Wizards removed on 2025-10-21. Adopting the 1–5 scale is already an open item in [`commander-power-meter.md`](../commander-power-meter.md).
- **The target-bracket picker shows wrong labels to players.** `src/components/deck/DeckWizard.tsx` (`BRACKET_OPTIONS`) renders `bracketNSub` and `bracketNDesc` from `src/messages/{locale}/deck.json`. In English: bracket 2 "Casual" with "0–1 game changers" (official: Core, zero Game Changers), bracket 3 "Powered" (official: Upgraded), bracket 4 "cEDH" (official: Optimized; cEDH is bracket 5). In French: bracket 2 "Casual", bracket 3 "Optimisé", bracket 4 "cEDH" (official: Basique, Amélioré, Optimisé). The same keys exist in the other eight locales.
- **The AI copilot is grounded on wrong bracket rules.** `src/lib/ai/deck-plan.ts` tells the model that bracket 1 allows "no tutors" and bracket 2 "at most 1 game changer". The official limits are no tutor restriction since 2025-10-21 and zero Game Changers at bracket 2. Every generated deck plan inherits the error.
- **Two-card combos force bracket 4.** `src/lib/deck/bracket.ts` sets any deck with a two-card infinite to bracket 4, labelled "(RC rule)". Officially, bracket 3 allows two-card combos that do not come up before turn 6, and the Rules Committee stopped managing the format on 2024-09-30. [`commander-power-meter.md`](../commander-power-meter.md) carries the same rule, and a fast-mana floor that still names the banned Mana Crypt.
- **Benchmarks do not match measured decks.** `src/lib/constants/benchmarks.ts` holds one set of ranges, imported only by its own test. The scorer in `src/lib/deck/bracket.ts` has its own thresholds: a median bracket 2 deck's ramp count scores as bracket 4, and the "low land count (<33)" warning fires on the median cEDH deck. The guide's per-bracket composition table records the measured medians; aligning or replacing the thresholds is an open question below, not a silent edit.
- **The playtest mulligan does not follow multiplayer rules** (verified 2026-11-09; owned by I-07, recorded here because I-28's research found it). `applyMulligan` in `src/lib/playtest/engine.ts` sends the first mulligan to six cards even in Commander. It also keeps `7 − N` random cards instead of drawing seven and bottoming N chosen ones, and `engine.test.ts` asserts that behaviour. Under CR 103.5c the first mulligan is free in multiplayer and Brawl games. The [companion](../guides/commander-mulligans-curves-and-play-style.md#what-the-free-mulligan-is-worth) computes that the engine captures 37–47% of the value of correct mulligans.
- **Opening-hand advice ignores ramp and the mulligan stage.** `src/lib/playtest/opening-hand-evidence.ts` flags 0–1 lands as land-light and 5+ as land-heavy for every deck and every hand. The companion's keep tables show that a 2-land first seven without cheap ramp is a mulligan in every bracket, and that 1 land with two cheap ramp pieces is a keep.
- **Reference docs corrected with this spec.** `docs/references/game-changers.md` (no bracket 5, a wrong February 2026 history, misdated unbans) and the bracket table in `.agents/skills/mtg-learn/references/commander-guide.md` (four brackets, pre-October 2025 turn numbers, Mana Crypt as a Game Changer) were corrected in the same change. `docs/rules/` holds the comprehensive rules of 2026-02-27.

## Functional requirements

### 1. The guide

1.1 One guide page per locale, with one section per official bracket 1 to 5, all sharing the same sub-sections: intent and feel, official rules, target composition, card choices by role, win conditions and combos, what to avoid, common mistakes, "you are probably in the wrong bracket if…", reference decks, budget, and a sample pregame line.
1.2 Shared sections before the brackets: how the bracket system works (intent over checklist, the checklist as a floor), deck roles and mana-base foundations, and how games are actually won.
1.3 After the brackets: moving a deck between brackets, assessing your own deck, and the open debates.
1.4 The page is static, indexable and readable without an account. No model call occurs on this path.

### 2. Evidence labels

2.1 Every claim carries one of three labels: **Official** (Wizards text or list), **Data** (measured, with its sample size and author), **Community** (opinion, with consensus, contested or single source).
2.2 Every label links to a dated source in the guide's sources list.
2.3 Where sources disagree, the guide shows both positions. It never resolves a community debate by presenting one side as a rule.

### 3. Consistency with the product

3.1 The official rules shown in the guide — bracket names, Game Changer limits, combo, land-denial and extra-turn rules, turn expectations — come from the same constants the bracket analysis uses. A test fails when they diverge.
3.2 The Game Changers and banned lists are never copied into guide prose as a complete list. The guide links to the existing `rules/game-changers` page, which reads live data.
3.3 The guide states the rules date it was written against, and shows it to the player.
3.4 The target-bracket picker and the bracket indicator use the official names in every locale where the guide is published. In French: "Catégorie N — Nom (bracket N)", because the official term is "catégorie" while players say "bracket".

### 4. From the deck to the guide, and back

4.1 The bracket badge and the bracket step of the deck wizard link to the matching bracket section, in one action, without losing the deck state.
4.2 "Check my deck against bracket N" evaluates the open deck against that bracket's checklist and composition ranges. It separates **hard rules** (official limits the deck breaks) from **soft targets** (ranges the deck falls outside), and names the cards behind each finding.
4.3 The check is deterministic and runs on the client's deck data; it does not call the copilot.
4.4 The check never blocks saving or building. It reports; it does not gate.
4.5 **Opening hands.** The check also reports the deck's own opening-hand profile under the multiplayer rules: a free second seven, then London mulligans. It covers the share of first sevens and second sevens that are keeps under the target bracket's keep rule, and the deck's count of cheap ramp (mana value 2 or less). It also places the deck's land count against the plateau for its curve. Every figure names its method (exact combinatorics over hand classes, or a seeded simulation sharing I-21's shuffler) and the [companion's limits](../guides/commander-mulligans-curves-and-play-style.md#limits).
4.6 The keep rules shown to players come from the companion's computed tables, adjusted by play-style requirements the model cannot see (protection for voltron, a sac outlet for aristocrats, a key card in cEDH). "Coin flip" zones, within ±2% of the value of mulliganing, are shown as judgment calls, not rules.
4.7 The primer template's "Mulligan guide" section can be pre-filled from 4.5: the deck's numbers and the bracket's keep rule, which the owner then edits.

### 5. Locales

5.1 English and French are authored and reviewed. A section that has not been reviewed in a locale is not shown in that locale.
5.2 Other locales link to the English guide with a visible "English" marker, following I-11's rule against unreviewed translations.

### 6. Freshness

6.1 The guide records its review date and the rules state it reflects (bracket text, Game Changers list date, banned-list announcement date).
6.2 A Wizards announcement touching brackets, Game Changers or the banned list opens a review task for the guide. Until the review lands, the guide shows that a newer announcement exists.

## Data model

```
GuideSection   id, bracket (1..5 | null for shared sections), slug, locale, reviewedAt, rulesState
GuideClaim     sectionId, label (official|data|community), consensus? (consensus|contested|single), sourceIds[]
GuideSource    id, outlet, author?, title, publishedAt, url, accessNote?
BracketRule    bracket, name, nameFr, maxGameChangers, massLandDenial, extraTurns, twoCardCombos, minTurns
KeepRule       bracket, style? (midrange|aggro|bigMana|spellslinger|cedh), stage (firstSeven|freeSeven|six|five), lands, cheapRamp, minEarlyPlays?, verdict (keep|mulligan|judgment), marginPct, sourceRun (script, seed, sample size)
```

`BracketRule` is the existing `BRACKET_DEFINITIONS` extended to bracket 5 and to the official restrictions. It is the single source for the guide, the wizard, the indicator and the check. Authored prose can live as MDX or JSON per locale; the source list stays structured so the label-to-source test can run.

## Non-goals

- Generating guide content with the LLM. The guide is authored and reviewed, like I-27's explanations. The copilot may link to a section; it never writes one.
- Declaring a deck's bracket. The computed bracket stays with I-03 and the power meter, and the check in requirement 4 only compares a list against a chosen target.
- A course, lessons or progress tracking.
- Ranking commanders or archetypes by strength, or presenting popularity as advice.
- Copying competitors' articles, decklists or images. Reference decks are linked, not reproduced.
- Matchmaking or pod agreements, which belong to I-15.

## Testing strategy

- **Rule consistency:** for each bracket, the guide's official-rules block renders from `BracketRule`; changing a constant without updating the guide's reviewed state fails the build.
- **Evidence coverage:** every guide claim has a label and at least one source; every source has a date and a URL. A claim without either fails.
- **Locale gating:** an unreviewed French section is absent, not shown in English under a French URL.
- **Deck check (solitary):** fixture decks for each bracket produce the expected hard-rule and soft-target findings, including a deck with zero Game Changers but a two-card combo, and a deck with four Game Changers at a bracket 3 target.
- **Deck check (sociable):** from the builder, opening the bracket section and running the check leaves the deck unchanged and saved.
- **Opening hands (solitary):** the keep-rule lookup returns a different verdict for the same hand as a first seven and as a second seven where the companion's tables say so (for example, three lands and no ramp in the Bracket 2 shell). A 1v1 Commander game gets no free seven. The deck's keep share computed from hand classes matches a seeded simulation within its interval.
- **Labels:** the deck wizard shows the official bracket names in English and French; a snapshot of `deck.json` keys guards against regressions.
- **Accessibility:** the guide page passes the existing Lighthouse and axe budgets, with headings in order and tables readable by screen readers.

## Delivery slices

| #   | Slice                                                                                                                                                                                           | Depends on                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | Correct the bracket names and descriptions in `deck.json` for English and French, and the bracket rules in the copilot prompt (`deck-plan.ts`); mark other locales                              | —                                      |
| 2   | Extend `BRACKET_DEFINITIONS` to bracket 5 and the official restrictions; drop the outdated tutor rule; replace the "(RC rule)" two-card-combo override with the official turn-6 rule            | —                                      |
| 3   | Content model with the evidence-coverage and rule-consistency tests, on I-64 slice 1's MDX pipeline _(single owner decided 2026-11-10, coordinator call, the owner may override: I-64 slice 1)_ | 2; I-64 slice 1                        |
| 4   | English guide page from the researched document, static and indexable                                                                                                                           | 3                                      |
| 5   | Links from the bracket badge and the wizard's bracket step to the matching section                                                                                                              | 4                                      |
| 6   | French review, official French names with the "bracket" alias, and locale gating                                                                                                                | 4                                      |
| 7   | "Check my deck against bracket N" with hard rules and soft targets                                                                                                                              | 2, 4; I-78 slice 1                     |
| 8   | Freshness: rules-state banner and a review task on each Wizards announcement                                                                                                                    | 4                                      |
| 9   | Opening-hand section of the check (4.5–4.7): keep shares under the multiplayer rules, cheap ramp, land plateau, primer pre-fill                                                                 | 7; I-21 slice 1 or exact combinatorics |

Slice 1 corrects copy players already see and rules the copilot already applies; it ships alone and should go first. Slice 2 overlaps the bracket 5 item in `commander-power-meter.md`; slice 2 owns the Bracket 5 definitions and the power meter reuses them (one owner, decided 2026-11-10).

Added 2026-11-11: slice 7 reads shared sources instead of keeping its own copies. Its soft targets read [I-76](i76-complete-this-deck-from-my-collection.md) slice 2's `RoleTarget`, so the guide's ranges exist once as data. Its hard rules read [I-77](i77-a-bracket-estimate-players-can-audit.md) slice 4's `pathToBracket`. Its extra-turn and mass-land-denial findings read the card classes defined once in [I-78](i78-what-this-deck-does-to-the-table.md) slice 1; `BracketRule` stays the source of what each bracket allows. Its per-opponent interaction count reads each match's scope, so a sweeper that reaches every opponent counts once per opponent.

## Open questions

- **Who owns the content?** The guide is editorial work with a refresh cadence. Wizards still calls the system a beta and promised an update in 2026 that has not arrived. Without a named owner, the guide will date, like `design-system.md`.
- **Does scoring move to 1–5 at the same time?** The guide must cover bracket 5 regardless. Showing bracket 5 in the wizard before the score can output it may confuse players; the power-meter spec should decide the order.
- **Per-bracket benchmarks.** The datasets suggest brackets 1–3 are built almost identically on paper, while bracket 4 and cEDH differ sharply. Should `BENCHMARKS` become per-bracket, or is one range plus speed signals more honest?
- **Shared vocabulary with I-15 and I-27.** "Extra turns", "mass land denial" and "two-card combo" should have one definition, used by the guide, the Rule 0 sheet and the warning explanations. Answered 2026-11-11 for "extra turns" and "mass land denial": their card classes are defined once in [I-78](i78-what-this-deck-does-to-the-table.md) slice 1. "Two-card combo" stays open.
- **Goldfish keep rules as product copy.** The companion's rules come from a model with no opponents, no colours and a mana-spent metric. Its optimum keeps fewer first sevens (32–51%) than players do (64%). Should the product show the computed rule with its margin, or a softened rule? The research supports showing the margin and calling the ±2% zone a judgment call.
- **Simulate the player's own list.** The tables use deck shells tuned to bracket medians. Running the same model on the open decklist is the step EDHREC and Moxfield do not take. Does it belong in slice 9 or in I-21?
- **Reference decks.** Linking third-party decklists ages quickly. Should reference decks become I-17 catalogue entries for bracket 2 and dated snapshots for the others?
