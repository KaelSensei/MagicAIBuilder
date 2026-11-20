# I-102: A Theme You Can Measure, For Exhibition And Every Flavour Deck

> **Initiative:** I-102, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-15 · **Priority:** Next for slices 0 to 5 (the handles on stored card fields, the coverage, the builder panel, on-theme alternatives for a role, the Rule 0 line); Later for slices 6 to 10, which wait for [I-67](i67-one-card-data-pipeline.md)'s card tables, [I-76](i76-complete-this-deck-from-my-collection.md)'s candidates, [L-22](../legal-questions.md#l-22-scryfalls-tagger-tags) and an owner decision on public pages · **Paid:** never · **Written 2026-11-15**
> **Placement:** the flavour counterpart of [I-54](i54-find-your-next-commander.md)'s play styles. A play style says what a deck does (tokens, spellslinger); a theme says what a deck is about (dragons, Ravnica's Orzhov, cards by one artist, every card starting with "S", the Phyrexian invasion). I-54 keeps styles and their vocabulary, typal included as a style; I-102 reads a creature type only as one theme handle among others and never defines a second typal style. [I-28](i28-commander-deckbuilding-guide-by-bracket.md) owns the bracket guide, whose Exhibition section this initiative gives a tool; the bracket estimate ([I-77](i77-a-bracket-estimate-players-can-audit.md)) never reads a theme.
> **Research:** one dated note of 2026-11-15, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public search on 2026-11-15, restricted to Commander-legal cards (`f:commander`, 32,643 cards that day). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the theme as an object on a deck (one to three handles chosen by the owner), the handle kinds and their matching rules, each card's on-theme verdict with the field that matched, the deck's theme coverage, on-theme alternatives for a role, the theme line offered to [I-15](i15-rule-zero-sheets-and-pod-profiles.md)'s sheet, and the builder panel. **Does not own:** play styles and their vocabulary (I-54); roles and their targets ([I-76](i76-complete-this-deck-from-my-collection.md), [I-65](i65-how-this-deck-wins.md)); bracket rules and the estimate (I-28, I-77); card data (I-67); Tagger's art tags ([I-67](i67-one-card-data-pipeline.md) slice 7, blocked for display on L-22); challenge rules ([I-53](i53-monthly-deckbuilding-challenges.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-28       | The Exhibition section of the bracket guide links the theme panel as the way to check "theme over function" on the player's own list. The guide's text, which already quotes "Prioritizing the theme over mechanics", is unchanged. |
| I-54       | No change to the style vocabulary. The finder may later filter commanders by a theme handle (an artist, a plane), read from I-102's handle kinds, as one more filter with its evidence line.                                        |
| I-76       | Completion candidates may be sorted by "on theme first" when the deck has a theme (I-102 slice 7); the default order does not change.                                                                                               |
| I-53       | I-102's handle kinds (name starts with a letter, artist, set or plane, creature type, word in the name) become rule types a challenge may require, so "all cards start with S" is checked by the same matcher.                      |
| I-15       | The calculated column gains the theme line ("Theme: dragons and Ravnica; 71 of 99 cards on theme"), labelled declared-and-computed: the handles are the owner's, the count is the product's.                                        |
| I-67       | Slice 2's printings carry `artist`, `flavor_text`, `watermark` and `set`; I-102 slice 6 reads them. No new field in I-67.                                                                                                           |
| I-77       | Nothing. A theme never changes a bracket estimate; the Exhibition label stays the player's declaration.                                                                                                                             |
| I-64       | Glossary terms: theme, handle, on theme. The theme panel's info button links them.                                                                                                                                                  |

## Overview

Wizards rewrote Bracket 1 around one idea. The October 2025 update says the panel wants "to double down on Exhibition's intent being all about theme over function", that players expect "Decks to prioritize a goal, theme, or idea over power" and "Win conditions to be highly thematic or substandard", and that "An Exhibition deck should generally have fairly constrained and unique deck building" [1]. The first announcement put it as "showing off something unusual you've made" [2]. Players ask the same question outside Bracket 1: "Is it really that bad not to build your deck around a theme?" drew 171 points and 173 comments on r/EDH, and "How much do you care about a deck's theme or aesthetic?" 157 comments [6].

Every tool read measures a deck's function. None measures its theme. EDHREC lists themes, but they are "manually implemented", ordered by popularity, and their pages rank the cards most used by other decks of the theme [4]: the opposite of a self-chosen constraint. A player building an all-artist deck, a "cards from one plane" deck or an every-card-starts-with-S deck checks each card by hand.

This initiative lets the owner name the theme of a deck as one to three handles (a creature type, a word in the card name, a name's first letter, an artist, a plane or set, a watermark, a word in the flavour text) and computes, card by card, whether each card is on theme and which field says so. The panel shows the coverage, lists the off-theme cards with the role each one fills, and, for a role such as ramp or removal, offers legal on-theme alternatives, because the bracket guide already advises "Ramp 8–12, on theme" and "On-theme answers" [5]. Nothing grades the deck; the count is the owner's own measure of their own constraint.

**Why a new initiative.** No initiative owns flavour. I-54's styles are mechanical; `detectThemes` (`src/lib/deck/themes.ts`) detects 17 mechanical themes and "Tribal" from Oracle phrases; I-53's challenge rules check constraints for a contest, not for a deck the owner keeps. **Why Next.** Slices 1 to 5 read fields every deck card already stores (name, type line, Oracle text), need no new data source and no model, and serve the bracket Wizards most recently redefined. **Why some of it is Later.** Artist, flavour text, watermark and set need I-67's card tables; art tags need L-22's answer.

## What the market does

All rows were read on 2026-11-15 unless dated otherwise.

| Product or source                                        | What it does or says                                                                                                                                                                                                                                                                                         | Source |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| **Wizards, Brackets update** (2025-10-21)                | "we really want to double down on Exhibition's intent being all about theme over function"; players expect "Decks to prioritize a goal, theme, or idea over power", "Win conditions to be highly thematic or substandard" and "Gameplay to be an opportunity to show off your creations"                     | [1]    |
| **Wizards, Brackets beta** (2025-02-11)                  | Exhibition: "Winning is not the primary goal here, as it's more about showing off something unusual you've made"; "with a focus on decks built around a theme"; a commander chosen to retell "the story of the Brothers' War"                                                                                | [2]    |
| **EDHREC, Exhibition articles** (2025-05-12; 2025-08-27) | "choices in deckbuilding are made to prioritize the theme or function first and foremost". Five Bracket 1 ideas: same first letter, one artist, an alternate win condition, one time or place, a secret commander; "I play cards for flavor purposes, and I play for power within the other numbers"         | [3]    |
| **EDHREC, themes** (2017-09-10)                          | "Each themes is manually implemented"; themes listed in order of popularity with deck counts; theme pages rank "cards that have the highest percentage of usage across our theme". A catalogue of what others build, not a measure of the player's list                                                      | [4]    |
| **MagicAIBuilder bracket guide**                         | Bracket 1 ↔ 2 boundary: "Prioritizing the theme over mechanics", where theme means narrative, art or story; ramp "8–12, on theme"; draw from "On-theme engines"; "On-theme answers"                                                                                                                          | [5]    |
| **r/EDH**                                                | "Is it really that bad not to build your deck around a theme?" (2026-01-21, 171 points, 173 comments); "How much do you care about a deck's theme or aesthetic?" (2026-09-01, 72 points, 157 comments); "Card ideas needed for Bracket 1/2 deck around an insult theme" (2026-10-29, 30 points, 83 comments) | [6]    |
| **Scryfall search**                                      | Every handle is a search operator: `t:` (427 Commander-legal Dragons), `o:` (155 cards name Dragon in their text without being one), `ft:` (112 mention Ravnica in flavour text), `wm:` (100 Orzhov watermarks), `a:` (163 cards by Rebecca Guay), `art:` (1,112 Tagger art tags "dragon") (**computed**)    | [7]    |
| **Analysers read** (Rate My Decks, ScryCheck, EDHTuner)  | Power, speed, bracket and swaps; nothing on theme or flavour (read 2026-11-12)                                                                                                                                                                                                                               | I-99   |

**The gap.** Bracket 1 is now officially about theme, players argue about themes in threads with hundreds of comments, and Scryfall can already express every handle as a query. No deckbuilder read lets a player state a deck's theme and see which of their own cards hold it, which do not, and what on-theme card could fill the role an off-theme card fills.

## Current state in this codebase

Verified on `dev` at `d3f27c0d` (#1511) on 2026-11-15:

- **Mechanical themes only.** `ThemeName` (`src/lib/deck/themes.ts`) lists 17 themes: Tokens, Sacrifice, Reanimator, Voltron, Stax, Combo, Control, Aggro, Spellslinger, Landfall, Tribal, +1/+1 Counters, Blink/ETB, Wheels, Aristocrats, Equipment and Treasure. Each is a phrase count over Oracle text. Nothing names a flavour, a plane, an artist or a letter, and nothing lets the owner declare a theme.
- **Three theme fields are stored per deck card.** `DeckCard.name`, `typeLine` and `oracleText` (`prisma/schema.prisma`). Artist, flavour text, watermark and set code are not stored; they arrive from Scryfall when a card is searched and are dropped at add time. Slices 1 to 5 use the three stored fields; slice 6 reads the rest from I-67's tables.
- **Deck tags exist.** `Deck.tags` is a string array the owner edits ([I-37](i37-editor-depth.md) and the owner decision of 2026-11-10 re-mount it). A theme is not a tag: a tag is a label, a theme handle is a matching rule with a count.
- **Search can express every handle.** `src/lib/scryfall/search.ts` builds Scryfall queries for the builder; adding `t:`, `o:`, `ft:`, `a:` or `wm:` to the visible query is how slice 5 finds on-theme alternatives, inside the deck's colour identity and `legal:commander`.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `deck-analysis` for the matcher and the coverage (readonly types and pure functions under `src/modules/deck-analysis/domain/theme/`, [ADR 0003](../../adr/0003-domain-as-readonly-data-and-pure-functions.md)); `deck-building` for the stored theme on the deck, written through one repository behind a port.

## Functional requirements

### 1. Principles

1.1 The owner chooses the theme. The product never infers it, never suggests one from popularity and never calls a model to name it.
1.2 Every on-theme verdict names the handle and the field that matched (type line, name, Oracle text, flavour text, artist, watermark, set) and the matched text. An off-theme card is listed with nothing invented about it.
1.3 Coverage is a count, not a grade: "71 of 99 cards on theme". No template says "good", "weak", "not thematic enough" or "pas assez thématique"; the verdict-word test of [I-65 1.3](i65-how-this-deck-wins.md#1-principles) runs on every template with those words added.
1.4 A theme never changes legality, the bracket estimate or any other initiative's output. It is the owner's own measure of their own constraint.
1.5 The theme and its coverage are private to the owner by default (requirement 7).

### 2. Handles, version 1

2.1 A deck's theme is one to three handles. A card is on theme when it matches any handle (the default, "any") or every handle (the owner's switch, "all").

| Handle kind   | Matches                                                                                               | Field (slice)     | Example                    | Legal cards (computed)            |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------- | -------------------------- | --------------------------------- |
| Creature type | The type line's subtypes, changelings included, per CR 205.3m                                         | `typeLine` (1)    | Dragon                     | 427 Dragons                       |
| Word in name  | A whole word in the card's name, case-insensitive, both faces                                         | `name` (1)        | "Dragon", "Angel", "Night" | n/a                               |
| First letter  | The first letter of the card's English name, ignoring "The" if the owner ticks it                     | `name` (1)        | S                          | n/a                               |
| Word in text  | A whole word in the Oracle text, reminder text stripped                                               | `oracleText` (1)  | "Dragon" in text           | 155 name Dragon without being one |
| Card type     | A card type or supertype (Legendary, Snow, Artifact, Saga…)                                           | `typeLine` (1)    | Legendary                  | n/a                               |
| Artist        | The artist credit of the printing in the deck, or of any printing when the owner ticks "any printing" | `artist` (6)      | Rebecca Guay               | 163 cards                         |
| Plane or set  | The set code of the printing in the deck, or a plane as a set list from versioned data                | `set` (6)         | Ravnica sets               | n/a                               |
| Watermark     | The printed watermark                                                                                 | `watermark` (6)   | Orzhov                     | 100 cards                         |
| Flavour text  | A whole word in the flavour text                                                                      | `flavor_text` (6) | "Ravnica"                  | 112 cards                         |
| Art tag       | A Tagger art tag                                                                                      | Tagger (10)       | dragon                     | 1,112 cards; **Blocked** on L-22  |

2.2 A plane is versioned data: the set codes whose cards are set on that plane, each with its source (the set's announcement). Version 1 ships the planes of the Ravnica, Dominaria, Innistrad, Kamigawa, Zendikar, Theros and Phyrexia sets, and the list grows by pull request.
2.3 Basic lands are excluded from coverage by default ("71 of 85 non-basic cards"), with a switch to count them, because a basic matches no handle except a first letter and would swamp the count.
2.4 The commander and a partner are shown first and counted; the Considering and Sideboard boards are not counted.

### 3. Coverage and the panel

3.1 `matchTheme(card, handles)` is a pure function returning `onTheme`, the matched handle, the field and the matched excerpt. `themeCoverage(deck, theme)` returns the on-theme count, the denominator, the off-theme cards and, per off-theme card, the role it fills when [I-76](i76-complete-this-deck-from-my-collection.md)'s slot roles exist, or the card category the deck already stores until then.
3.2 The builder panel "Theme" shows the handles, the coverage, the on-theme cards grouped by handle and the off-theme cards grouped by role. Each card expands to the field and the excerpt that matched, or to "no handle matches".
3.3 The same input gives the same coverage byte for byte, whatever the input order.

### 4. On-theme alternatives for a role

4.1 For an off-theme card, "Find on-theme alternatives" builds a visible Scryfall query: the handle as an operator, the role's clause from I-76 or I-65 (ramp: `o:"add {"`; removal: `o:"destroy target"`; and so on, as versioned data), the deck's colour identity and `legal:commander`. The query is shown before it runs, as the [strategic boundaries](roadmap-context.md#strategic-boundaries) require of every generated query.
4.2 Results are ordered by mana value, then name. No popularity order, no model ranking. Each result says which handle and which role clause it matched.
4.3 "Add" goes through the editor's normal add path; nothing is replaced automatically. A swap is the owner's two actions, cut and add, and each is undoable as any edit is.

### 5. The Rule 0 line

5.1 I-15's calculated column shows "Theme: {handles}; {n} of {d} cards on theme", in English and French, labelled as the owner's theme with the product's count. It never appears without the owner's handles.
5.2 The bracket guide's Exhibition section links the panel. The estimate does not read it.

### 6. Card fields from I-67

6.1 Once I-67 slice 2 ships, the matcher reads artist, flavour text, watermark and set from the deck card's printing (`scryfallId`), so a deck that switches a printing (I-57) may change its artist coverage, and the panel says which printing matched.
6.2 Until then, the four handle kinds are shown greyed with "needs card details not stored yet", never as zero.

### 7. Visibility

7.1 The theme and its coverage are private by default. The owner may show the theme handles on the public deck page; the count joins them only if the owner ticks it, since a 40% coverage on a public page reads as a judgement the owner did not ask for.
7.2 The shared and public projections exclude the theme unless the switch is on; a schema test guards them.

### 8. Free and paid

| Part                                                                 | Free | Paid candidate | Why                                                                                                                                |
| -------------------------------------------------------------------- | ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Handles, coverage, the panel, alternatives, the Rule 0 line, sharing | Yes  | —              | Evidence about the player's own list stays free ([I-30 1.1 and 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) |

## Data model / API

```
HandleKind      creatureType | nameWord | firstLetter | textWord | cardType | artist | planeOrSet | watermark | flavorWord | artTag
ThemeHandle     kind: HandleKind, value (1–40 chars), anyPrinting?: boolean, ignoreLeadingThe?: boolean
DeckTheme       handles: ThemeHandle[1..3], match: any | all, countBasics: boolean, showOnPublicPage: boolean, showCount: boolean
ThemeMatch      cardName, quantity, commandZone, onTheme: boolean, handleIndex?, field?, excerpt? (≤ 120 chars), printingId?
ThemeCoverage   inputHash, handlesVersion, onTheme, denominator, matches: ThemeMatch[], offTheme[]{cardName, role}
PlaneDef        id, version, nameEn, nameFr, setCodes[], source (URL)
Deck            + theme Json? (DeckTheme)                         -- one nullable column, slice 2
```

- `matchTheme`, `themeCoverage` and `alternativesQuery` are pure functions in `src/modules/deck-analysis/domain/theme/`. `HandleKind` is a discriminated union with an exhaustive `never` guard; the plane list is a versioned data file validated at build time.
- Slice 2 adds `Deck.theme` (a nullable JSON column, one migration) and `PUT /api/decks/[id]/theme`, owner-only, validated by a `zod` schema mirroring `DeckTheme`. Slice 1 runs on a theme held in the editor's state, so the panel can be tried before anything is stored.

## Non-goals

- A theme inferred by the product, suggested from popularity, or named by a model.
- A theme score, a grade, or a "how thematic is this deck" ranking of decks or players.
- A bracket rule. Exhibition stays a declaration; the estimate never reads the theme (I-77).
- A second typal style: typal as a play style stays I-54's.
- A card database by artist or plane: the panel searches Scryfall through the visible query and publishes no artist or plane page ([strategic boundaries](roadmap-context.md#strategic-boundaries)).
- Art tags before L-22 is answered.

## Testing strategy

- **Matcher (solitary):** one fixture per handle kind and per near-miss: a changeling matches every creature type; "Dragon" as a word does not match "Dragonlord" when the owner chose whole words; the first letter of "The Ur-Dragon" is U with "ignore The" ticked and T without; reminder text containing "Dragon" does not match; a modal double-faced card matches on either face's name.
- **Coverage (solitary):** basics excluded and included; quantities counted; the commander counted and marked; "any" and "all" with two handles; the same input in two orders gives one result.
- **Alternatives (solitary):** the query for "ramp, on theme Dragon, identity RG" contains the handle, the role clause, the identity and `legal:commander`, and no other operator.
- **Wording:** English and French templates; the verdict-word scan fails on "not thematic enough" and "pas assez thématique".
- **Routes and projections (sociable):** the theme route is owner-only and validated; the public projection carries the handles only when the switch is on and the count only when its own switch is on (schema test).
- **Accessibility and layout:** every control has a name and a keyboard path; on and off theme differ by a word and an icon; at 360 px the groups stack.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: with the handle "creature type Dragon", Shivan Dragon is on theme by its type line and Sol Ring is off theme.

## Delivery slices

| #   | Slice                                                                                                                                                        | Depends on                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| 0   | Owner: the public defaults, the first plane list, and whether art tags are ever used (D-99)                                                                  | — (owner)                            |
| 1   | `HandleKind` v1 on stored fields (creature type, word in name, first letter, word in text, card type); `matchTheme`; `themeCoverage`; fixtures Done (#1539). | —                                    |
| 2   | `Deck.theme`, the owner-only route and its schema; the theme editor in the deck settings                                                                     | 1 (migration)                        |
| 3   | Builder panel "Theme": coverage, on-theme by handle, off-theme by stored category; English and French templates; verdict-word test                           | 1                                    |
| 4   | On-theme alternatives for a role: the visible query, mana-value order, add through the editor                                                                | 3                                    |
| 5   | The theme line in I-15's calculated column; the guide's Exhibition link                                                                                      | 2; I-15 slice 2                      |
| 6   | Artist, plane or set, watermark and flavour text from I-67's printings; the printing that matched                                                            | 1; I-67 slice 2                      |
| 7   | Roles from I-76 for off-theme cards and "on theme first" in completion                                                                                       | 3; I-76 slice 5                      |
| 8   | Public page: the handles switch and the count switch; projection schema test                                                                                 | 2; D-99                              |
| 9   | I-53 rule types from the handle kinds                                                                                                                        | 1; I-53 slice 1                      |
| 10  | Art tags through I-67 slice 7                                                                                                                                | 6; I-67 slice 7; **Blocked** on L-22 |

Slices 1, 3 and 4 need no stored state and no new data source, and slice 1 can start now. Scheduled agents must not pick slice 0 (the owner's), slice 8 before D-99 is committed, or slice 10 before L-22 is answered.

## Open questions

1. **D-99.** Do handles show on the public page by default, and the count? Which planes ship in version 1? Are art tags ever used, after L-22? Recommended: handles off by default, count off by default with its own switch; the seven planes of 2.2; art tags only after L-22, and never as the only handle.
2. **Whole words or substrings.** Is "Dragon" a match for "Dragonlord Atarka"? Recommended: whole words by default, with a switch per handle for "part of a word", shown in the handle's sentence.
3. **French names.** A French player may build "every card starts with S" in French. Recommended: version 1 matches English names, as the rules do for deck construction; a French name match waits for I-67's French names (I-11).
4. **For the integrator.** Does `detectThemes` keep "Tribal" once I-54 maps its vocabulary? I-102 reads it nowhere and does not decide.

## Sources

Read on 2026-11-15 unless stated otherwise.

1. Wizards of the Coast, Gavin Verhey, "Commander Brackets Beta Update – October 21, 2025". <https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025>
2. Wizards of the Coast, Gavin Verhey, "Introducing Commander Brackets Beta", 2025-02-11. <https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta>
3. EDHREC, Jeff Girten, "Adapting Your Decks to the Exhibition Bracket (1)", 2025-05-12, <https://edhrec.com/articles/adapting-your-decks-to-the-exhibition-bracket-1>; Nicholas Lucchesi, "5 Fun Ideas for Building a Bracket 1 Deck", 2025-08-27, <https://edhrec.com/articles/5-fun-ideas-for-building-a-bracket-1-deck>.
4. EDHREC, Christopher Russell, "NEWS — New EDHREC Feature! Themes!", 2017-09-10. <https://edhrec.com/articles/news-new-edhrec-feature-themes>
5. MagicAIBuilder, [Commander deckbuilding guide by bracket](../guides/commander-deckbuilding-by-bracket.md), lines on the 1 ↔ 2 boundary, ramp, draw and removal.
6. r/EDH, via [Arctic Shift](https://arctic-shift.photon-reddit.com/) title search since 2025-01-01: "Is it really that bad not to build your deck around a theme?", 2026-01-21, 171 points, 173 comments, <https://www.reddit.com/r/EDH/comments/1qj2tim/>; "How much do you care about a deck's theme or aesthetic?", 2026-09-01, 72 points, 157 comments, <https://www.reddit.com/r/EDH/comments/1w4u0yd/>; "Card ideas needed for Bracket 1/2 deck around an insult theme", 2026-10-29, 30 points, 83 comments, <https://www.reddit.com/r/EDH/comments/1xikh9f/>. A search for "bracket 1" timed out.
7. Scryfall, card search, read with a named User-Agent on 2026-11-15: `t:dragon f:commander` 427; `o:dragon -t:dragon f:commander` 155; `ft:ravnica f:commander` 112; `wm:orzhov f:commander` 100; `a:"rebecca guay" f:commander` 163; `art:dragon f:commander` 1,112. <https://scryfall.com/docs/syntax>

## Feature contract (Full, 2026-11-15)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

Wizards made Bracket 1 "all about theme over function", and players argue about themes in threads of a hundred comments, yet a player who builds around a creature type, an artist, a plane or a letter checks each card by hand, and no tool tells them which cards hold the theme or what on-theme card could fill a role.

### Goals

- A player names the theme "Dragon (creature type) or Dragon (word in name)", sees "71 of 85 non-basic cards on theme", the fourteen off-theme cards grouped by role, and for the off-theme Sol Ring a visible query that returns on-theme mana sources in the deck's identity; the Rule 0 sheet shows the theme line; nothing changes the bracket estimate.

### Non-goals

- Do not reverse a non-goal already named in this file or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score this file does not already cite from a named source.

### Personas

The casual pod player and the bracket-focused player building for Exhibition; the content creator who publishes a flavour deck. See the roadmap persona table.

### User stories

#### US-102-01

As a player building a flavour deck, I want to name my theme and see which of my cards hold it and which do not, with the field that decided, so that I stop checking 99 cards by hand.

#### US-102-02

As a player with an off-theme staple, I want on-theme alternatives for the role it fills, from a query I can read, so that I keep the deck working without breaking the theme.

#### US-102-03

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-102-04

As a player using a keyboard or a screen reader, I want each control to have a name and on and off theme to be words, so that colour is not the only signal.

### Acceptance criteria

#### AC-102-01 Happy path

Given a signed-in player, the English locale and the handle "creature type Dragon"
When the theme panel opens on a deck with Shivan Dragon and Sol Ring
Then Shivan Dragon is on theme by its type line with the excerpt, Sol Ring is off theme under "ramp", and the French locale shows the French catalogue string for every control

#### AC-102-02 Error and failure

Given the theme write cannot finish
When the player retries or leaves the screen
Then the last confirmed theme is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-102-03 Edge cases

Given a deck with no theme, or a handle whose field is not stored yet
When the panel renders
Then it invites the owner to name a theme, or greys the handle with "needs card details not stored yet", and never shows zero for an unknown

#### AC-102-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the guest can try a theme on the deck in the session without saving it, and the signed-in owner can save it

#### AC-102-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-102-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player completes US-102-01 without a pointer
Then every control has an accessible name, focus returns to the card after a group folds, and on and off theme are announced as words

### UX flow and states

Deck settings gain "Theme": up to three handles, each a kind and a value, with "any" or "all". The builder panel "Theme" sits beside the combos panel: the coverage, on-theme cards by handle, off-theme cards by role, and "Find on-theme alternatives" on each off-theme card.

- Empty: "Name a theme to see which cards hold it." with the handle kinds listed.
- Loading: a busy state that keeps the layout still.
- Error: the catalogue message and a retry, with the last confirmed theme kept.
- Partial: handle kinds that need unstored fields are greyed with the reason.

### Data model and API

The types and the route in [Data model / API](#data-model--api). One nullable column on `Deck`; nothing in any projection unless the owner's switches are on.

### Analytics and telemetry

`theme_set {handles: 1 | 2 | 3, kinds: HandleKind[]}` and `theme_alternatives_opened {}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, search text, handle value or URL.

### Rollout and feature flags

Slices 1, 3 and 4 are on for guests and signed-in players on the deck in the session. Saving needs an account. Slices 5 and 8 are behind an I-69 switch, `theme.surfaces`, off until D-99 is committed.

### Dependencies

Hard waits are in the roadmap dependency table: nothing for slice 1; I-15 slice 2 for slice 5; I-67 slice 2 for slice 6. Slice edges stay in the table above and in `dependency-graph.md`.

### Risks and mitigations

- A coverage read as a grade: counts only, no verdict words, the count off the public page by default.
- A matcher that misses a card the player sees as on theme: every off-theme card says "no handle matches", and the owner can add a second handle; the fixture covers the known near-misses.
- A slide into an artist or plane database: the panel runs a visible Scryfall query and publishes no page per artist or plane.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-99, whole words, French names, and `detectThemes`.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-102-101 Handles on stored fields

As a player, I want handles that read the name, the type line and the Oracle text the deck already stores, so that the panel works today for typal, name-word and letter decks.

#### AC-102-100 Happy path

Given the handle "first letter S, ignore The"
When the panel opens on a deck with Sol Ring, Sakura-Tribe Elder and The Scarab God
Then all three are on theme, The Scarab God by its name after "The", each with the field shown

#### AC-102-101 Failure

Given the handle data cannot be validated (an empty value)
When the owner saves
Then the save is refused with a catalogue message naming the handle, and the last confirmed theme stays

#### AC-102-102 Edge

Given a changeling such as Mirror Entity and the handle "creature type Dragon"
When the panel recomputes
Then Mirror Entity is on theme by CR 205.3m, and the excerpt says "Changeling"

#### US-102-102 Alternatives for a role

As a player, I want the alternatives for an off-theme card to come from a query I can read, so that I trust what I add.

#### AC-102-103 Happy path

Given an off-theme Arcane Signet in a Gruul Dragon deck
When the player opens "Find on-theme alternatives"
Then the visible query contains the Dragon handle, the ramp clause, `id<=rg` and `legal:commander`, and the results are ordered by mana value then name

#### AC-102-104 Failure

Given Scryfall does not answer
When the player retries
Then the query stays shown, the result says "search unavailable", and nothing in the deck changes

#### AC-102-105 Edge

Given the query returns no card
When the results render
Then the panel says "no on-theme card fills this role in this identity" and offers to widen the handle, never an off-theme card

#### US-102-103 The line and the public page

As a player, I want my theme on the Rule 0 sheet and, if I choose, on my public deck, so that the table and readers know what the deck is about.

#### AC-102-106 Happy path

Given an owner who ticked "show handles" and not "show count"
When a visitor opens the public deck
Then the handles appear and no count appears anywhere in the response

#### AC-102-107 Failure

Given the switch write fails
When the owner retries
Then the switch keeps its last confirmed state and the public response is unchanged

#### AC-102-108 Edge

Given an owner who removes the theme
When the Rule 0 sheet renders
Then the theme line is absent, not "0 of 99"

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "Name a theme to see which cards hold it." No invented theme, author, price or score.                   |
| Loading          | A busy state that keeps the layout still.                                                               |
| Error            | The catalogue message, what was not saved, and a retry.                                                 |
| Partial          | Handle kinds that need unstored fields are greyed with the reason.                                      |
| Stale            | The handles version is shown; a coverage computed on an older deck version says so.                     |
| Guest            | A theme can be tried on the deck in the session; saving explains that it needs an account.              |
| Signed-in        | The theme is written to that account's deck only.                                                       |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Every handle, group and control can be reached without a pointer.                                       |
| Screen reader    | On and off theme, the field and the count are announced in words.                                       |
| Colour           | On and off theme differ by a word and an icon as well as hue, in both themes.                           |
| Success          | Saving a theme is confirmed in words; a second identical save does not write twice.                     |

### Alternate paths

- The owner cancels the theme editor. Nothing is written.
- The save fails and the owner retries. The retry uses the last confirmed theme.
- The owner switches locale mid-edit. The handles typed are kept; chrome switches.

### Roadmap record (2026-11-15)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-102 is a link here.

## I-102: A Theme You Can Measure, For Exhibition And Every Flavour Deck

**Outcome:** a player names a deck's theme as one to three handles (a creature type, a word in the name, a first letter, a word in the text, a card type; later an artist, a plane or set, a watermark, a word in the flavour text), sees which of their own cards hold it with the field that decided, the coverage as a count, the off-theme cards by role, and on-theme alternatives for a role from a visible query; the Rule 0 sheet gets one theme line; nothing grades the deck or changes its bracket.

**Status:** Next
**Priority:** Next for slices 0 to 5; Later for slices 6 to 10, behind I-67 slice 2, I-76 slice 5, D-99, I-53 slice 1 and L-22. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Low. The product counts a constraint the owner chose and changes no verdict. The risks are a count read as a grade, which the wording and the private default answer, and an artist or plane database by another name, which the non-goals forbid.
**Depends on:** nothing for slice 1; I-15 slice 2 for slice 5; I-67 slice 2 for slice 6; I-76 slice 5 for slice 7; D-99 for slice 8; I-53 slice 1 for slice 9; I-67 slice 7 and L-22 for slice 10.

Wizards' update of 2025-10-21 made Bracket 1 "all about theme over function" [1]; EDHREC's Bracket 1 ideas are themes by letter, artist, era and story [3]; r/EDH argues about themes in threads of 157 and 173 comments [6]. EDHREC's themes are curated and ordered by popularity [4], and the analysers read measure function only. The product stores each deck card's name, type line and Oracle text, which is enough for typal, name-word, letter and text handles today; artist, flavour, watermark and set wait for I-67.

### Scope

- [ ] Handles v1 on stored fields, `matchTheme` and `themeCoverage`, deterministic, with fixtures for changelings, "The", reminder text and both faces (slice 1).
- [ ] `Deck.theme` and its owner-only route (slice 2); the builder panel with coverage, on-theme by handle and off-theme by category, English and French, verdict-word test (slice 3).
- [ ] On-theme alternatives for a role from a visible Scryfall query, ordered by mana value (slice 4); the theme line on the Rule 0 sheet and the guide's Exhibition link (slice 5).
- [ ] Later: artist, plane or set, watermark and flavour from I-67 (slice 6); I-76's roles and "on theme first" (slice 7); the public switches (slice 8); I-53 rule types (slice 9); art tags after L-22 (slice 10).
- [ ] Added 2026-11-16 (sixteenth pass): under a rulebreaker commander, the alternatives query reads [I-03](i03-trustworthy-deck-feedback.md)'s exception table, so a Seluma, Light of Aysen deck themed on Angels searches Angels of every colour identity, and Valko Indorian's deck Phyrexians of every identity (CR 903.5e, whose own example is Seluma's Angels). The theme stays the owner's handle; the rulebreaker only widens the identity the query uses. An r/EDH thread, "Thoughts on Rulebreaker vs '5 color mush'?", quotes a creator who prefers rulebreakers because they let decks be thematic while "staying committed to the bit" (38 points, 63 comments, 2026-09-16, [thread](https://www.reddit.com/r/EDH/comments/1whzaex/)).

### Engineering enablers

- `HandleKind` is a discriminated union with an exhaustive `never` guard; the plane list is versioned data validated at build time.
- The alternatives query is built by one pure function shared with I-53's rule types, so a challenge and a theme check one matcher.
- The public and shared projections gain a schema test for the theme and its two switches.

**Paid-tier angle:** none. Evidence about the player's own list stays free under I-30 1.1 and 1.2.

### Enrichment (2026-11-15)

**User story.** As a player building a flavour deck, I want to name my theme and see which of my cards hold it, with the field that decided, so that I stop checking 99 cards by hand and keep the deck working with on-theme alternatives.

**Acceptance.**

- "Creature type Dragon" marks Shivan Dragon on theme by its type line and Sol Ring off theme under ramp.
- A changeling counts for every creature type; reminder text never matches.
- The alternatives query for an off-theme ramp card shows the handle, the ramp clause, the identity and `legal:commander` before it runs.
- The public response carries the handles only with the owner's switch, and the count only with its own switch.

**UX.** Deck settings gain "Theme"; the builder gains a "Theme" panel beside the combos panel.

**Data and API.** Pure functions for slices 1, 3 and 4; one nullable `Deck.theme` column and one owner-only route in slice 2.

**i18n and access.** English and French chrome; card names stay the printing's language. Every control has a name and a keyboard path; on and off theme are words and icons.

**Telemetry.** `theme_set {handles, kinds}`, `theme_alternatives_opened {}`. Reserved for I-39.

**Rollout.** Slices 1, 3 and 4 on for everyone on the session's deck; saving needs an account; slices 5 and 8 behind `theme.surfaces`.

**Open questions.** D-99; whole words; French names; `detectThemes`.

### Definition of done

A player names the theme "creature type Dragon or word in name Dragon", sees "71 of 85 non-basic cards on theme" with the field and excerpt for each on-theme card, the fourteen off-theme cards grouped by role, and for Sol Ring a visible query returning on-theme mana sources in the deck's identity ordered by mana value; the Rule 0 sheet shows the theme line; the bracket estimate is unchanged; opening the deck again gives the same coverage byte for byte.

---
