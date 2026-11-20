# I-103: Planar, Scheme And Attraction Decks Beside The Commander Deck

> **Initiative:** I-103, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-15 · **Priority:** Next for slices 0 to 5 (the three side-deck kinds as zones, their search path, their construction checks, the editor board and the text export); Later for slices 6 to 10, which wait for [I-17](i17-precon-path-and-tiered-upgrades.md)'s catalogue, [I-50](i50-play-this-deck-online.md)'s export contract, [I-42](i42-commander-variants-duel-cedh-pauper.md)'s variant configuration, [I-15](i15-rule-zero-sheets-and-pod-profiles.md)'s sheet and an owner decision · **Paid:** never · **Written 2026-11-15**
> **Placement:** an editor-depth initiative beside [I-37](i37-editor-depth.md). A side deck is not a variant of the Commander deck (that is [I-42](i42-commander-variants-duel-cedh-pauper.md)) and not a second deck (that is [I-79](i79-table-sets.md)'s table set): it is a supplementary deck the same player brings to the same game, which the Comprehensive Rules define on their own terms (CR 901.3 for a planar deck, 904.3 for a scheme deck, 717.2a for an Attraction deck). I-42 keeps life totals and variant rules, Archenemy Commander's 60 life included; I-103 owns the side decks and their construction checks.
> **Research:** one dated note of 2026-11-15, not committed, so every external fact links its entry in [Sources](#sources). Counts marked **computed** come from Scryfall's public API on 2026-11-15. Rules are quoted from the Comprehensive Rules the product serves (effective 2026-08-07, `src/modules/rules-reference/infrastructure/data/MagicCompRules-20260807.txt`). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the planar, scheme and Attraction zones of a deck, the search path for cards that no format calls legal, the construction check of each side deck with its CR citation, the side-deck board in the editor, the side decks in text export and import, and the "what came in this precon" side lists. **Does not own:** the Commander deck's legality (I-03); variant life totals and the Archenemy Commander option (I-42); per-target exporters (I-50); the precon catalogue (I-17); the sheet (I-15); a planar die, a scheme turn or any game simulation (non-goal).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I-42       | The variant configuration gains the Archenemy Commander option (CR 904.13: the archenemy at 60 life, the opposing team sharing 60 life, poison counted per player) as a declared option, with no game engine. I-103 checks the scheme deck; I-42 states the life totals. |
| I-17       | The precon catalogue records the planes and phenomena of the four March of the Machine Commander decks and Doctor Who's, and the schemes of the four Duskmourn Commander decks, as side lists of each precon, read by I-103 slice 6.                                     |
| I-50       | The export contract gains a side-deck section per target that supports one, and a typed notice "this target has no planar deck" where it does not.                                                                                                                       |
| I-15       | The sheet's declared fields gain "we play Planechase", "we play Archenemy (Commander option)" and "Attractions allowed", each read by the pre-game script (I-88) when it exists.                                                                                         |
| I-37       | The editor's views gain the side-deck board; Attractions, which Archidekt already moves out of the deck automatically [3], follow the same board.                                                                                                                        |
| I-19, I-99 | The offline download carries the side decks; the pilot sheet lists Attraction "visit" triggers in its timing blocks once I-99 slice 1 exists. Planes and schemes add no pilot class in version 1.                                                                        |
| I-03, I-77 | Nothing. A side deck never counts toward the 100 cards, the bracket estimate or the Commander deck's legality (CR 717.2 says Attractions "do not count toward maximum or minimum deck sizes").                                                                           |

## Overview

Since 2023 Wizards has put supplementary cards inside Commander products. The four March of the Machine Commander decks contain fifty plane and phenomenon cards between them, Doctor Who's Commander decks forty, and the four Duskmourn Commander decks forty Archenemy schemes; a Secret Lair of planes followed in 2025 (**computed** from Scryfall's printings). The Comprehensive Rules give each a construction rule: a planar deck of "at least ten plane and/or phenomenon cards", with "No more than two" phenomena and every card with "a different English name" (CR 901.3); a scheme deck of "at least twenty scheme cards" with "no more than two of any card with a particular English name" (CR 904.3); an Attraction deck of "at least ten Attraction cards", each with "a different English name" (CR 717.2a). CR 904.13, "Archenemy Commander Option", makes Archenemy an official way to play Commander.

A player who opens one of those precons, or who brings planes to a Commander night ("Would it be weird to bring planechase cards to a casual commander meeting?", r/EDH, 2026-08-15), cannot record those cards beside the deck in this product. The builder's search adds `legal:commander` to every query, so a plane or a scheme, legal in no format, never appears; `DeckZone` accepts only `main`, `sideboard` and `maybeboard`. Archidekt's answer is a workaround: add the planes, then "edit the category that they're in to no longer be "In Deck"" by hand [3]. Moxfield users keep "custom" planar decks as separate lists [4]. A r/EDH post asks the exact question this initiative answers: "What planes/phenomena and schemes would you recommend for my deck when playing Planechase/…" [5].

This initiative adds three side decks to a Commander deck, each with its own zone, its own search path that does not filter by format, and its own construction check that cites its rule. It exports and imports them as named sections, shows a precon's side cards beside its main list, and never simulates a planar die or a scheme turn.

**Why a new initiative.** No initiative owns a supplementary deck. I-42's variants change the main deck's rules, I-79's table sets hold several main decks, and I-37's views reorganise one deck. **Why Next for slices 0 to 5.** They need no migration (`DeckCard.zone` is a string column; the change is the `DeckZone` union and its validators), no new data source and no decision beyond D-100, and they unlock cards Wizards itself sells inside Commander precons. **Why Later for the rest.** Precon side lists wait for I-17, per-target exports for I-50, the declared option for I-42.

## What the market does

All rows were read on 2026-11-15 unless dated otherwise.

| Product or source                              | What it does or says                                                                                                                                                                                                                                                                                                                        | Source |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Comprehensive Rules** (effective 2026-08-07) | CR 901.3 planar deck; 901.15a single communal planar deck ("at least forty or at least ten times the number of players"); 904.3 scheme deck; 904.12 Supervillain Rumble ("each player has their own scheme deck"); 904.13 Archenemy Commander Option (60 life, shared 60 for the team); 717.2a Attraction deck                              | [1]    |
| **Wizards products** (2009–2025)               | Planes and phenomena: Planechase (2009, 40), Planechase 2012 (40), Planechase Anthology (2016, 86), March of the Machine Commander (2023, 50), Doctor Who (2023, 40), Secret Lair Showcase Planes (2025, 10). Schemes: Archenemy (2010, 45), Archenemy: Nicol Bolas (2017, 20), Duskmourn Commander (2024, 40) (**computed**, printings)    | [2]    |
| **Scryfall**                                   | 185 planes, 21 phenomena, 102 schemes (21 ongoing), 50 Attractions of which 22 are Commander-legal (**computed**). Planes and schemes are legal in no format, so a `legal:commander` filter hides them                                                                                                                                      | [2]    |
| **Archidekt**                                  | A moderator: planes "can already be added"; set the format to "All Formats" if they don't appear, then "edit the category … to no longer be "In Deck""; "Attractions already do this by default as you add them, but Planes and Contraptions will need to be done manually". No construction check is described                             | [3]    |
| **Moxfield**                                   | Public "custom" planar decks kept as their own lists, such as a 40-card planar deck "used in Commander games" and an Eternities Map variant deck (search summaries)                                                                                                                                                                         | [4]    |
| **r/EDH**                                      | "Why is planechase so overpriced" (2025-06-12, 110 points, 92 comments); "Would it be weird to bring planechase cards to a casual commander meeting?" (2026-08-15, 13 points, 22 comments); "What planes/phenomena and schemes would you recommend for my deck when playing Planechase/…" (2026-03-14). Twelve Planechase titles since 2025 | [5]    |
| **This product**                               | `DeckZone = "main" \| "sideboard" \| "maybeboard"` (`src/lib/deck/types.ts`); every builder search appends `legal:<format>` (`src/lib/scryfall/search.ts`); no file under `src` handles planes, phenomena, schemes or Attractions                                                                                                           | code   |

**The gap.** Wizards ships side cards in Commander precons and writes an official Archenemy Commander option; the deckbuilders read either hide the cards behind a legality filter or let a player move them out of the deck by hand, and none checks a side deck against its rule.

## Current state in this codebase

Verified on `dev` at `d3f27c0d` (#1511) on 2026-11-15:

- **Three zones, typed in five places.** `DeckZone` (`src/lib/deck/types.ts`), the URL importer's `zone` (`src/lib/import/url-import.ts`), `DecklistSection` (`src/lib/import/decklist-parse.ts`), the import preview's `zoneCounts` (`src/lib/import/import-preview.ts`) and the browser client's `zone?` (`src/lib/db/deck-api.ts`) all spell `"main" | "sideboard" | "maybeboard"`. `DeckCard.zone` itself is a `String` column with that list as a comment (`prisma/schema.prisma`), so new values need no migration, only the union and its validators.
- **Search hides side cards.** `buildSearchQuery` appends `legal:${getFormatConfig(format).scryfallLegality}` (`src/lib/scryfall/search.ts`, line 204), and the natural-language context does the same (`src/lib/search/natural-language-context.ts`). A plane or a scheme is `not_legal` everywhere, so no search returns one.
- **No side-card handling anywhere.** A search of `src` for plane, phenomenon, scheme, Planechase, Archenemy and Attraction finds only unrelated words (URL schemes, colour themes).
- **Counts and legality read every main card.** The deck's 100-card count, the bracket estimate and the legality check read the main zone; a side zone must stay out of all three, as the sideboard and Considering already do.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `deck-building` for the zones and the board, `format-rules` for the construction checks (pure functions citing their CR rule, [ADR 0009](../../adr/0009-legality-is-a-report-and-the-server-owns-rules.md): legality is a report and the server owns rules), `card-catalog` for the side-card search path, `deck-interchange` for export and import.

## Functional requirements

### 1. Side decks

1.1 A Commander deck may hold a planar deck, a scheme deck and an Attraction deck, each a zone: `planar`, `scheme`, `attraction`.
1.2 A card enters a side zone only if its type line fits: plane or phenomenon for `planar`, scheme for `scheme`, Attraction for `attraction`. A plane added to `main` is refused with a message that names the planar deck.
1.3 Side zones never count toward the deck's size, its mana curve, its price total (shown apart, labelled), its bracket estimate or its legality report. CR 717.2 says Attractions "do not count toward maximum or minimum deck sizes"; planes and schemes "remain in the command zone throughout the game" (CR 901.4, 904.4).
1.4 Side decks are optional and off by default: the editor shows the side-deck board only after the owner adds one.

### 2. Finding side cards

2.1 The search gains a "side cards" mode, chosen explicitly, that sends `t:plane`, `t:phenomenon`, `t:scheme` or `t:attraction` with no `legal:` filter. The mode is shown in the visible query.
2.2 Attractions in the side-card mode keep the Commander legality marker: 22 of 50 are Commander-legal, and an Attraction deck built for a Commander game is checked against it (requirement 3.4).

### 3. Construction checks

3.1 `checkSideDeck(kind, cards, option)` is a pure function in `format-rules`, returning `pass`, `fail` or `unknown` per rule, each with its CR citation and the cards concerned.
3.2 **Planar deck (CR 901.3):** at least ten cards; plane and phenomenon cards only; at most two phenomena; no two cards with the same English name. **Single communal planar deck (CR 901.15a),** when the owner ticks it and gives a player count: at least forty or ten times the players, whichever is smaller; at most twice the players in phenomena.
3.3 **Scheme deck (CR 904.3):** at least twenty scheme cards; at most two of a card with the same English name. The Supervillain Rumble (904.12) and Archenemy Commander (904.13) options use the same construction rule; the check says which option the owner declared.
3.4 **Attraction deck (CR 717.2a):** at least ten Attraction cards, each with a different English name; each card's Commander legality from Scryfall, since 28 Attractions are not Commander-legal.
3.5 A failed check reads "planar deck: 8 of at least 10 cards (CR 901.3)", never "illegal deck": the Commander deck's legality badge does not change ([D-90](../owner-decisions.md#product-scope-and-non-goals)).

### 4. The editor board

4.1 The side-deck board lists each side deck with its count, its check and its cards, foldable, below Sideboard and Considering, in every view I-37 ships.
4.2 Moving a card between a side zone and Considering is allowed; between a side zone and `main` is refused (1.2).
4.3 Side cards show their oversized images through the same image path as other cards, at the size Scryfall serves.

### 5. Export and import

5.1 Text export writes each side deck as a named section after the main list: `// Planar deck`, `// Scheme deck`, `// Attraction deck`, one card per line with its count, under I-50's export contract when it exists and the shipped text exporter until then.
5.2 Text import reads the same headings, and the headings Moxfield and Archidekt users write by hand ("Planes", "Planar Deck", "Schemes"), into the side zones, with the preview showing each side count before anything is written.
5.3 A target without side decks gets a typed notice per side deck, never a silent drop (slice 9, with I-50).

### 6. Precon side lists

6.1 Once I-17's catalogue holds a precon, its side cards are listed beside its main list: the ten planes of each March of the Machine Commander deck and the ten schemes of each Duskmourn Commander deck, with "Copy the side decks" into the player's copy.
6.2 The diff between the sealed precon and the player's copy covers the side decks as well as the main list.

### 7. Sheet and visibility

7.1 Side decks are shown on the public deck page with the main list, as the sideboard is, unless the owner hides them; their check shows only to the owner.
7.2 The Rule 0 sheet's declared fields "we play Planechase", "we play Archenemy" and "Attractions allowed" (slice 8, with I-15) are the players' declarations; the side decks never set them.

### 8. Free and paid

| Part                                                       | Free | Paid candidate | Why                                                                                                                                                       |
| ---------------------------------------------------------- | ---- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Side zones, search, checks, board, export, import, precons | Yes  | —              | Building and exporting a deck is always free, and card data stays free ([I-30 1.1 and 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) |

## Data model / API

```
DeckZone        main | sideboard | maybeboard | planar | scheme | attraction          -- DeckCard.zone stays a String column
SideDeckKind    planar | scheme | attraction
SideDeckOption  none | singleCommunal{players: 2..8} | supervillainRumble | archenemyCommander
SideRuleId      planarMinTen | planarPhenomenaMaxTwo | planarDistinctNames | planarTypeOnly
                | communalMinSize | communalPhenomenaMax | schemeMinTwenty | schemeMaxTwoCopies | schemeTypeOnly
                | attractionMinTen | attractionDistinctNames | attractionCommanderLegal
SideRuleResult  ruleId, crRule, verdict: pass | fail | unknown, cards[], detail (template id with counts)
Deck            + sideDeckOptions Json?                                              -- slice 3, one nullable column
```

- `checkSideDeck` is a pure function in `src/modules/format-rules/domain/side-decks.ts`; `SideDeckKind`, `SideDeckOption` and `SideRuleId` are discriminated unions with exhaustive `never` guards. The server runs it as the legality report does (ADR 0009); the browser shows the server's report.
- Slice 1 widens `DeckZone` and its four sibling unions to one shared type, so the five places stop drifting; a type test fails if a new spelling appears.
- Routes: the existing card routes accept the three zones; `GET /api/decks/[id]/side-decks/check` returns the reports. No new table.

## Non-goals

- A planar die, a scheme turn, a game state or any simulation of Planechase or Archenemy in the playtest (the [benchmark non-goals](roadmap-context.md#deliberate-non-goals-from-the-benchmark) exclude a rules engine).
- Contraptions: none is Commander-legal (**computed**: `t:contraption f:commander` returns 0), and Unstable is silver-bordered.
- Dungeons, the Ring, the initiative and other cards from outside the game that a card brings in: those are I-19's game pieces, not decks the player builds.
- Custom planes or schemes: the custom-card creator stays a non-goal.
- A Planechase or Archenemy "format" page, ranking or statistics.

## Testing strategy

- **Checks (solitary):** a nine-card planar deck fails 901.3 with "9 of at least 10"; three phenomena fail; two copies of one plane fail; a communal deck for four players needs forty, for three needs thirty; a scheme deck with three copies of one scheme fails 904.3; an Attraction deck with a non-Commander-legal Attraction reports that card; an unknown kind fails to compile.
- **Zones (sociable):** a plane added to `main` is refused with the message; a side card never changes the deck count, the curve, the bracket estimate or the legality report; moving a scheme to Considering and back keeps it.
- **Search:** the side-card mode's query has no `legal:` term and shows its type filter; the normal mode is unchanged.
- **Export and import:** the text export writes the three sections in order and re-imports to the same zones; "Planes" and "Schemes" headings from a pasted Moxfield list land in the side zones; the preview shows each count.
- **Accessibility and layout:** the side-deck board and each check have names and a keyboard path; pass and fail are words and icons; at 360 px the board stacks.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 2's first Red: a planar deck of nine distinct planes returns `planarMinTen: fail` citing CR 901.3.

## Delivery slices

| #   | Slice                                                                                                                                          | Depends on                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 0   | Owner: build side decks at all, the public default, and which kinds ship first (D-100)                                                         | — (owner)                     |
| 1   | One shared `DeckZone` with the three side zones; the five unions replaced; side zones out of counts, curve, price total, estimate and legality | —                             |
| 2   | `checkSideDeck` with every rule of section 3 and its CR citation; fixtures Done (#1540).                                                       | —                             |
| 3   | Side-card search mode with the visible query; the type gate of 1.2; `Deck.sideDeckOptions`                                                     | 1 (one nullable column)       |
| 4   | The editor's side-deck board with counts and checks; English and French                                                                        | 1, 2, 3                       |
| 5   | Text export and import of the three sections, with the preview counts                                                                          | 1                             |
| 6   | Precon side lists and "Copy the side decks"                                                                                                    | 4; I-17 slice 1               |
| 7   | Archenemy Commander and Supervillain Rumble as declared options in I-42's variant configuration                                                | 2; I-42 slice 1               |
| 8   | Sheet fields "we play Planechase", "we play Archenemy", "Attractions allowed"                                                                  | I-15 slice 1                  |
| 9   | Per-target exports and the typed notices                                                                                                       | 5; I-50 slices 0 and 2        |
| 10  | Offline download of the side decks; Attraction "visit" triggers in the pilot sheet                                                             | 4; I-19 slice 2; I-99 slice 1 |

Slices 1, 2 and 5 need nothing outside the initiative and can start now; slice 3 adds one nullable column. Scheduled agents must not pick slice 0 (the owner's), or slice 4 before D-100 is committed, since the board is the first surface players see.

## Open questions

1. **D-100.** Build side decks at all; which kinds first (planar and scheme, or all three); are side decks shown on the public page by default? Recommended: build all three in slices 1 to 5, since Wizards sells planes and schemes inside Commander precons; show them on the public page as the sideboard is, with a switch to hide them.
2. **Hand-written headings.** Which headings does import accept? Recommended: the three of 5.1 and "Planes", "Planar Deck", "Schemes", "Scheme Deck", "Attractions", case-insensitive; anything else stays in its current section, as today.
3. **A shared planar deck across a table.** I-79's table set could hold one communal planar deck for the whole table (CR 901.15). Recommended: not in version 1; record it as an I-79 question if gate B is met.
4. **For the integrator.** Do I-37's Stacks and Table views show side decks as columns or below? Recommended: below, folded, as Considering is.

## Sources

Read on 2026-11-15 unless stated otherwise.

1. Wizards of the Coast, Comprehensive Rules effective 2026-08-07, as served by the product: rules 717.2, 717.2a, 901.3, 901.4, 901.15a, 904.3, 904.4, 904.12, 904.13. <https://magic.wizards.com/en/rules>
2. Scryfall API, read with a named User-Agent on 2026-11-15: `t:plane` 185, `t:phenomenon` 21, `t:scheme` 102, `t:scheme t:ongoing` 21, `t:attraction` 50, `t:attraction f:commander` 22, `t:contraption f:commander` 0; printings of `(t:plane or t:phenomenon)` and `t:scheme` grouped by set (`unique=prints`). <https://scryfall.com/docs/api>
3. Archidekt forum, "Planechase Deck Option", a moderator's reply (the thread is marked "3 years" old). <https://archidekt.com/forum/thread/4264342>
4. Moxfield, public planar decks (search summaries, 2026-11-15): <https://moxfield.com/decks/83V1aPoY602YgyE0Mp-F7A>, <https://moxfield.com/decks/ZtPgc8poZEC52JfHnOp9EA>.
5. r/EDH, via [Arctic Shift](https://arctic-shift.photon-reddit.com/) title search for "planechase" since 2025-01-01 (12 posts, 136 points): "Why is planechase so overpriced", 2025-06-12, 110 points, 92 comments, <https://www.reddit.com/r/EDH/comments/1l9zs13/>; "Would it be weird to bring planechase cards to a casual commander meeting?", 2026-08-15, 13 points, 22 comments, <https://www.reddit.com/r/EDH/comments/1vp8xt3/>; "What planes/phenomena and schemes would you recommend for my deck when playing Planechase/…", 2026-03-14, <https://www.reddit.com/r/EDH/comments/1rt4beu/>.
6. Sportskeeda, March of the Machine Commander decks "contain 10 Planechase cards, five new and five classic reprints" (search summary). <https://sportskeeda.com/esports/news-magic-the-gathering-s-march-machine-commander-decks-contain-new-classic-planechase-cards>

## Feature contract (Full, 2026-11-15)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

Wizards sells planes and Archenemy schemes inside Commander precons and writes an official Archenemy Commander option, but a player cannot find those cards in the builder's search, cannot keep them beside the deck, and no tool checks a planar or scheme deck against its rule.

### Goals

- A player who owns a March of the Machine Commander deck adds its ten planes to the deck's planar deck from a side-card search, sees "Planar deck: 10 cards, 1 phenomenon, all names distinct (CR 901.3)" pass, exports the deck with a `// Planar deck` section, re-imports it to the same zones, and sees the deck's count, curve, price total and bracket estimate unchanged.

### Non-goals

- Do not reverse a non-goal already named in this file or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score this file does not already cite from a named source.

### Personas

The casual pod player who plays Planechase or Archenemy at Commander nights; the collector who opened a precon with side cards. See the roadmap persona table.

### User stories

#### US-103-01

As a player who brings planes or schemes to Commander night, I want them kept beside my deck and checked against their rule, so that I stop keeping a second list somewhere else.

#### US-103-02

As a player who opened a precon with side cards, I want those cards listed with the precon and copied into my deck, so that the product knows the whole box.

#### US-103-03

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-103-04

As a player using a keyboard or a screen reader, I want the side-deck board and its checks to have names, and pass and fail to be words, so that colour is not the only signal.

### Acceptance criteria

#### AC-103-01 Happy path

Given a signed-in player, the English locale and a Commander deck
When they add ten distinct planes from the side-card search
Then the planar deck shows 10 cards and "pass (CR 901.3)", the deck count stays 100, and the French locale shows the French catalogue string for every control

#### AC-103-02 Error and failure

Given a card write to a side zone fails
When the player retries or leaves the screen
Then the side deck is unchanged, nothing is half-written, and the message is a catalogue string

#### AC-103-03 Edge cases

Given a plane dropped onto the main deck
When the editor handles the drop
Then it refuses with "Planes go in the planar deck", and the main deck is unchanged

#### AC-103-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then both can build side decks on the deck in the session, as with the main deck, and saving follows the main deck's rule

#### AC-103-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-103-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player completes US-103-01 without a pointer
Then the board, each check and each card have accessible names, and pass and fail are announced as words

### UX flow and states

The editor gains "Add a side deck" (planar, scheme, Attraction). Each side deck is a foldable group below Considering with its count and check. Search gains a "Side cards" mode whose visible query shows the type filter and no legality filter.

- Empty: no side-deck board until the owner adds one.
- Loading: a busy state that keeps the layout still.
- Error: the catalogue message and a retry, with the last confirmed side deck kept.
- Partial: a check that needs a player count (the communal option) says so and shows "unknown" until it is given.

### Data model and API

The types in [Data model / API](#data-model--api). No new table; `DeckCard.zone` gains three values and `Deck` one nullable options column.

### Analytics and telemetry

`side_deck_added {kind}` and `side_deck_check {kind, verdict}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Slices 1, 2 and 5 are invisible until slice 4's board. Slice 4 ships behind an I-69 switch, `deck.sideDecks`, off until D-100 is committed, then on for guests and signed-in players alike.

### Dependencies

Hard waits are in the roadmap dependency table: nothing for slices 1, 2 and 5; I-17 slice 1 for slice 6; I-42 slice 1 for slice 7; I-15 slice 1 for slice 8; I-50 slices 0 and 2 for slice 9.

### Risks and mitigations

- A side card leaking into the main deck's count, curve or bracket: one shared zone type, and sociable tests on every reader of the main zone.
- A slide into a game engine: no die, no turn, no state; the non-goals name them.
- Images of oversized cards: the same image path and credit as every card; no new image source.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-100, headings, a communal deck across a table, and the views.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-103-101 Zones that never touch the main deck

As a player, I want side decks that never change my deck's count, curve, price total or bracket, so that adding planes cannot break my Commander deck.

#### AC-103-100 Happy path

Given a 100-card deck with ten planes and twenty schemes added
When the deck stats and the bracket estimate compute
Then the count is 100, the curve and the estimate are unchanged, and the price shows the side decks apart, labelled

#### AC-103-101 Failure

Given the zone union rejects an unknown spelling
When an old client sends `zone: "planes"`
Then the write is refused with a catalogue message, and nothing is stored under an unknown zone

#### AC-103-102 Edge

Given an Attraction that is not Commander-legal in the Attraction deck
When the check runs
Then `attractionCommanderLegal` fails naming that card, and the Commander deck's legality badge is unchanged

#### US-103-102 Checks that cite their rule

As a player, I want each side deck checked against its rule with the rule number, so that I know my scheme deck is ready before Archenemy night.

#### AC-103-103 Happy path

Given a scheme deck of twenty schemes with one scheme three times
When the check runs
Then `schemeMaxTwoCopies` fails naming that scheme and citing CR 904.3, and every other rule passes

#### AC-103-104 Failure

Given the check route fails
When the board renders
Then each rule shows "unknown" with a retry, never "pass"

#### AC-103-105 Edge

Given the communal planar option for four players and 36 planes
When the check runs
Then `communalMinSize` fails with "36 of at least 40 (CR 901.15a)"

#### US-103-103 Export, import and precons

As a player, I want my side decks to survive export and import and a precon's side cards to come with it, so that the whole box moves with me.

#### AC-103-106 Happy path

Given a deck with a planar deck and a scheme deck
When it is exported to text and re-imported
Then both side decks land in their zones with the same counts, shown in the preview first

#### AC-103-107 Failure

Given an export target with no planar deck
When the player exports
Then a typed notice names the planar deck as left out, before the download

#### AC-103-108 Edge

Given a pasted Moxfield list with a "Planes" heading
When the preview opens
Then the planes are counted under "Planar deck", and the main count excludes them

### UX states for this feature

| State            | What the player sees                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Empty            | No side-deck board until one is added; "Add a side deck" names the three kinds.                               |
| Loading          | A busy state that keeps the layout still.                                                                     |
| Error            | The catalogue message, what was not saved, and a retry.                                                       |
| Partial          | A rule that needs an input says "unknown" with the input it needs.                                            |
| Stale            | A check computed on an older deck version says so.                                                            |
| Guest            | Side decks work on the session's deck as the main deck does.                                                  |
| Signed-in        | Side cards are written to that account's deck only.                                                           |
| English          | New controls use the `en` catalogue.                                                                          |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                                 |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them.       |
| Keyboard         | The board, each check and each card can be reached without a pointer.                                         |
| Screen reader    | Counts, pass, fail and the rule number are announced in words.                                                |
| Colour           | Pass and fail differ by a word and an icon as well as hue, in both themes.                                    |
| Success          | Adding a side card is confirmed as any card add is; a second identical add follows the side deck's copy rule. |

### Alternate paths

- The player removes a side deck. Its cards move to Considering, and an undo restores the side deck.
- The add fails and the player retries. The retry uses the last confirmed state.
- The player switches locale mid-flow. Chrome switches; card names stay the printing's language.

### Roadmap record (2026-11-15)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-103 is a link here.

## I-103: Planar, Scheme And Attraction Decks Beside The Commander Deck

**Outcome:** a player keeps a planar deck, a scheme deck and an Attraction deck beside a Commander deck, finds their cards through a side-card search with no legality filter, sees each checked against its rule with the CR number (901.3, 904.3, 717.2a, and the communal and Archenemy Commander options), exports and imports them as named sections, and gets a precon's side cards with the precon; the main deck's count, curve, price total, bracket estimate and legality never change.

**Status:** Next
**Priority:** Next for slices 0 to 5; Later for slices 6 to 10, behind I-17 slice 1, I-42 slice 1, I-15 slice 1, I-50 slices 0 and 2, I-19 slice 2 and I-99 slice 1. Never paid.
**Impact / effort:** Medium / small for slices 1 to 5 (no migration for the zones; one nullable column for the options)
**Risk:** Low. The risk is a side card leaking into the main deck's numbers, which one shared zone type and sociable tests answer.
**Depends on:** nothing for slices 1, 2 and 5; D-100 for slice 4; I-17 slice 1 for slice 6; I-42 slice 1 for slice 7; I-15 slice 1 for slice 8; I-50 slices 0 and 2 for slice 9; I-19 slice 2 and I-99 slice 1 for slice 10.

Wizards put fifty planes in March of the Machine Commander (2023), forty in Doctor Who (2023) and forty schemes in Duskmourn Commander (2024), and the Comprehensive Rules carry an "Archenemy Commander Option" (CR 904.13). The product's search appends `legal:commander` to every query, which hides every plane and scheme, and `DeckZone` has no place for them; Archidekt's moderator describes moving planes out of the deck by hand, with no check. A r/EDH post asks which planes and schemes to bring "for my deck". The work needs no migration for the zones, because `DeckCard.zone` is a string column.

### Scope

- [ ] One shared `DeckZone` with `planar`, `scheme` and `attraction`, replacing five drifting unions; side zones out of count, curve, price total, estimate and legality (slice 1).
- [ ] `checkSideDeck` for CR 901.3, 901.15a, 904.3 and 717.2a, each result citing its rule, never "illegal" (slice 2).
- [ ] The side-card search mode with a visible query and no legality filter, the type gate, and the options column (slice 3); the editor's side-deck board (slice 4, after D-100); text export and import of the three sections (slice 5).
- [ ] Later: precon side lists (slice 6); Archenemy Commander and Supervillain Rumble as declared options in I-42 (slice 7); sheet fields (slice 8); per-target exports (slice 9); offline download and Attraction triggers in the pilot sheet (slice 10).

### Engineering enablers

- One `DeckZone` type replaces five string unions, with a type test that fails on a new spelling.
- `SideDeckKind`, `SideDeckOption` and `SideRuleId` are discriminated unions with exhaustive `never` guards; checks live in `format-rules` and run on the server (ADR 0009).
- Every reader of the main zone (count, curve, price, estimate, legality) gets a sociable test with side cards present.

**Paid-tier angle:** none. Building and exporting a deck stays free under I-30 1.1 and 1.2.

### Enrichment (2026-11-15)

**User story.** As a player who brings planes or schemes to Commander night, I want them kept beside my deck and checked against their rule, so that the whole box lives in one place.

**Acceptance.**

- Ten distinct planes from the side-card search pass CR 901.3, and the deck count stays 100.
- A scheme three times fails CR 904.3, naming the card; the Commander deck's legality badge is unchanged.
- A plane dropped on the main deck is refused with a message naming the planar deck.
- Export and re-import keep the three side decks in their zones.

**UX.** "Add a side deck" in the editor; a foldable side-deck board below Considering; a "Side cards" search mode.

**Data and API.** No new table; three zone values; one nullable `Deck.sideDeckOptions`; one check route.

**i18n and access.** English and French chrome; card names stay the printing's language. The board and checks have names and a keyboard path; pass and fail are words and icons.

**Telemetry.** `side_deck_added {kind}`, `side_deck_check {kind, verdict}`. Reserved for I-39.

**Rollout.** Slice 4 behind `deck.sideDecks`, off until D-100.

**Open questions.** D-100; import headings; a communal deck across a table set; the views.

### Definition of done

A player adds the ten planes of a March of the Machine Commander deck to its planar deck from the side-card search, sees "pass (CR 901.3)", adds twenty Duskmourn schemes to a scheme deck and sees "pass (CR 904.3)", exports the deck with `// Planar deck` and `// Scheme deck` sections and re-imports it to the same zones, and sees the main deck's count, curve, price total, bracket estimate and legality unchanged.

---
