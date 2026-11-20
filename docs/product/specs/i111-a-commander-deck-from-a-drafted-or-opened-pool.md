# I-111: A Commander Deck From A Drafted Or Opened Pool

> **Initiative:** I-111, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-20 · **Priority:** Later; slice 1 is a pure, CR-cited check a person may build by hand; slices 2 and after wait for [D-105](../owner-decisions.md#product-scope-and-non-goals) · **Paid:** never · **Written 2026-11-20**
> **Placement:** promoted from [I-42](i42-commander-variants-duel-cedh-pauper.md)'s sixteenth-pass open question on Commander Sealed, under the eighteenth pass's I-107 precedent: a deliverable with its own surface (a pool and a deck bound to it), its own competitor gap and its own rules risk. I-42 keeps Commander Limited's construction rules as data; [I-16](i16-decks-buildable-from-a-collection.md) gains a declared-list pool kind; drafting stays a non-goal. Nothing here generates a pack.
> **Research:** one dated note of 2026-11-20 (angle R2), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the deck bound to a declared pool, the Commander Limited construction check (`checkLimitedDeck`), the pool board in the editor, and "add this pool to my collection" as an import with provenance. **Does not own:** variant rules as data and the format picker ([I-42](i42-commander-variants-duel-cedh-pauper.md)); pool tags ([I-16](i16-decks-buildable-from-a-collection.md)); the paste parser ([I-10](i10-interoperability-and-integrations.md)); the commander finder ([I-54](i54-find-your-next-commander.md)); basics to a land count ([I-58](i58-mana-base-builder.md)); collection import ([I-26](i26-collections-arriving-from-elsewhere.md)); exports ([I-50](i50-play-this-deck-online.md)); house rules ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); a cube list ([I-110](i110-a-commander-cube-the-product-can-check.md)); events, pods and standings ([I-41](i41-store-commander-nights.md), [I-104](i104-league-decks-and-the-change-allowance-between-rounds.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-42       | Widen the sixteenth-pass open question from Commander Sealed to Commander Limited (Draft per CR 903.13e–f, Box League per Wizards' page) as construction data; narrow the non-goal "Commander Draft" to "drafting". Recorded as a dated line. |
| I-16       | A fifth pool kind, "a declared list" (pasted or imported), restricting search, adds and I-76's completion to that list plus basic lands; one type shared with I-104's declared pool. Recorded as a dated line.                                |
| I-104      | No change. Its `pool {declaredOnly}` check is a sibling and may share the pool type.                                                                                                                                                          |
| I-26       | Provenance may name the product the cards came from, including "a pool" from this file (the R2 note's S9, recorded on I-26).                                                                                                                  |

## Overview

Commander has official limited formats. CR 903.13f, in the Comprehensive Rules of 2026-11-06, sets three exceptions for Commander Draft: "(1) A player's deck must contain at least 60 cards. There is no maximum deck size. (2) A player's deck may include any number of cards from that player's card pool with the same name. (3) If the draft contained draft boosters from Commander Masters, any card which can be a player's commander by itself and whose color identity includes one or fewer colors is considered to have the partner ability for the purposes of deckbuilding" [1]. CR 903.13e lets drafters add The Prismatic Piper or Faceless One "only if those cards are used as the player's commander(s)" [1]. Wizards' Commander Box League page asks players to "construct a 60-card Commander deck" from a Play Booster box, ignores colour identity except where a card refers to it ("for example, with Arcane Signet"), excludes Buy-a-Box and Commander promos, and lets players adjust decks between games [2]. Mystery Booster Commander Edition, "a Commander Draft set" released on 2026-11-13, has no partner rule in that edition of the rules [1][3].

The drafting tools stop at the deck. Draftmancer added Mystery Booster Commander on 2026-09-19 and mentions The Prismatic Piper only in pack generation; CubeCobra's deckbuilder builds to "23 and 17" with no commander slot; Archidekt's 27 formats include no Commander Draft; Playgroup's builder enforces identity and partners only for its own cubes [4][5][6][7]. None checks a paper pool, a Box League box or a Draftmancer pool against CR 903.13f.

Players are few but present: r/EDH Commander Draft posts are under 10 points, while a 360-card cube on r/mtgcube was built because "the group has been excited about the Baldur's Gate Commander drafts we've done" (18 points, 2026-10-17) [8].

This initiative lets a player declare a pool (pasted, or imported from a Draftmancer or CubeCobra export), bind a deck to it, and build a 60-card deck checked under the right Commander Limited variant, then add the opened cards to the collection.

**Why a new initiative.** I-42 holds the question and a non-goal naming Commander Draft; I-16 owns pool tags; I-104 owns a declared pool inside a league round. No file owns the deck-from-a-pool surface. **Why Later.** The surface waits for D-105; the rules check is official and can be built first.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source        | What it does or says                                                                                                    | Source |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| **Comprehensive Rules**  | CR 903.13e–f, edition of 2026-11-06: 60-card minimum, duplicates from the pool, Commander Masters partners; no MBC rule | [1]    |
| **Wizards format pages** | Commander Limited and Commander Box League: 60 cards from the box, identity ignored except where a card refers to it    | [2]    |
| **Draftmancer** (MIT)    | MBC drafts since 2026-09-19; no Commander deck-construction check found in its code                                     | [4]    |
| **CubeCobra**            | Deckbuilder at 23 and 17, no commander slot                                                                             | [5]    |
| **Archidekt**            | 27 formats, no Commander Draft or limited                                                                               | [6]    |
| **Playgroup.gg**         | Enforces identity and partners in its own cubes; "You build only from what you got, plus free basic lands"              | [7]    |

**The gap.** No tool checks a player's own drafted or opened pool against Commander Limited's construction rules.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **Nine formats, none limited** ("Format Rules" in `docs/product/user-guide.md`); Commander is checked as 100-card singleton.
- **`src/modules/format-rules/domain/rulebreakers.ts`** models deck-construction exceptions for one commander (I-03).
- **No pool.** A deck cannot be restricted to a list of opened cards. I-16's per-deck pool tag is planned, not built. I-104 slice 1's league check lives in `src/modules/format-rules/domain/league-allowance.ts` (#1611), inside a league.
- **The rules file served** is `src/modules/rules-reference/infrastructure/data/MagicCompRules-20260807.txt`, whose 903.13 reads the same as the 2026-11-06 edition for these exceptions.

**Owning context:** `format-rules` for `checkLimitedDeck` (pure, beside `rulebreakers.ts`); the deck context for the pool binding; the collection context for the import.

## Functional requirements

### 1. Principles

1.1 Every construction rule cites its CR number or Wizards' page with its read date.
1.2 The pool is the player's declaration, as in I-104. The product does not verify that a pool was opened.
1.3 A rule the CR does not write (MBC partners) is shown as unwritten, and the table's choice is recorded as a house rule through I-15, never as official.

### 2. The check

2.1 `checkLimitedDeck(deck, pool, variant)` for: Commander Draft per CR 903.13e–f with per-set additions (The Prismatic Piper for CMR and CMM, Faceless One for CLB) and the CMM partner rule; Box League per Wizards' page; a cube's declared house rules.
2.2 A card not in the pool is named "not in your pool"; the deck stays saved with the finding visible.

### 3. The pool and the editor

3.1 A declared pool on a deck (I-16's declared-list kind), pasted or imported through I-10's preview; search and adds restricted to the pool plus unlimited basic lands.
3.2 The pool as a board beside the deck; "commanders in this pool" through I-54's catalogue; basics to a recommended count through I-58 slice 4's split by source targets (done, #1533).

### 4. After the event

4.1 "Add this pool to my collection" through I-26's import with the product and date as provenance, and its change report.
4.2 Exports through I-50's contract, and a printable 60-card list for the store.

### 5. Free and paid

| Part                            | Free | Paid candidate | Why                                                               |
| ------------------------------- | ---- | -------------- | ----------------------------------------------------------------- |
| The check, the pool, the import | Yes  | —              | A legality check on the player's own cards, which I-30 keeps free |

## Data model / API

```
LimitedVariant  commanderDraft {set: CMR | CLB | CMM | MBC} | boxLeague | cubeHouseRules {partnerOption}
DeckPool        deckId, kind: declaredList, entries[]{oracleId, scryfallId?, quantity}, source: paste | draftmancer | cubecobra, declaredAt
LimitedFinding  notInPool | belowMinimum | identity | promoNotAllowed | commanderNotEligible, cardNames[], rule (CR or page ref)
```

- `checkLimitedDeck` is pure and returns `LimitedFinding[]`; `LimitedVariant` and `LimitedFinding` are discriminated unions with exhaustive `never` guards.
- Routes: `PUT /api/decks/[id]/pool` (preview then commit); the existing legality route gains the limited variant once D-105 puts it in I-42's picker.

## Non-goals

- Drafting, pack generation or a pack simulator.
- A cube list ([I-110](i110-a-commander-cube-the-product-can-check.md)).
- Pod pairing, standings, timers or prizes ([I-41](i41-store-commander-nights.md), [I-104](i104-league-decks-and-the-change-allowance-between-rounds.md), D-101).
- Validating that a pool was really opened.
- Counting a limited deck in [I-60](i60-player-stats-and-year-in-review.md)'s statistics or [I-34](i34-commander-data-reports.md)'s aggregates, unless D-105 says otherwise.

## Testing strategy

- **Check (solitary), per set fixture (CMR, CLB, CMM, MBC):** a CMM pool with two copies of a card and a mono-white and a mono-blue legend passes at 60 cards with both copies and both legends as commanders, citing CR 903.13f(2) and (3).
- **Box League (solitary):** a red-white commander with green cards reports no identity violation; Arcane Signet's line notes that it still follows the commander's identity.
- **Pool (sociable):** a card added outside the pool is named "not in your pool", and the deck stays saved.
- **Red first:** slice 1's first Red: a 60-card CMM deck with two copies of one common is reported legal under `commanderDraft {CMM}`, where the Commander check reports a singleton violation.

## Delivery slices

| #   | Slice                                                                                                                                                 | Depends on                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0   | Owner: D-105 (Commander Limited in I-42's picker or a flag; Box League's 60 as a minimum; MBC partner default; counting in statistics)                | — (owner)                            |
| 1   | `checkLimitedDeck(deck, pool, variant)`, pure: 903.13e additions, 903.13f's three exceptions, Box League's identity and promo rules; fixtures per set | None (by hand)                       |
| 2   | A declared pool on a deck (I-16's declared-list kind) with paste and import preview; search and adds restricted to the pool plus basics               | 0; 1; I-10; I-16's line              |
| 3   | The editor: the pool as a board; "commanders in this pool"; basics to a recommended count                                                             | 2; I-54 slice 1; I-58 slice 4 (done) |
| 4   | "Add this pool to my collection" through I-26's import with product and date as provenance                                                            | 2; I-26 slices 1 to 3                |
| 5   | Exports through I-50's contract, and a printable 60-card list                                                                                         | 2; I-50                              |

Slice 1 can start now by hand: it is a pure function with CR citations and no schema, as I-104 slice 1 was.

## Open questions

1. **Picker or flag** (D-105). Recommended: one Commander Limited variant in I-42's picker with three sub-rules (Draft, Box League, cube house rules).
2. **Box League's "60-card Commander deck".** Exactly 60 or at least 60? Recommended: at least 60, labelled as the reading taken.
3. **MBC drafts.** No partner rule (the CR is silent), or the Commander Masters rule as a default house rule? Recommended: none by default, with the house rule one click away through I-15.
4. **Statistics.** Does a limited deck count in I-60 and I-34? Recommended: no, as Playgroup's "Cube games never count toward the public stats".

## Sources

Read on 2026-11-20 unless stated otherwise.

1. Wizards of the Coast, Magic: The Gathering Comprehensive Rules, 2026-11-06, rules 903.13e to 903.13g; 903.13f verified verbatim on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt>
2. Wizards of the Coast, "Commander Limited" and "Commander Box League". <https://magic.wizards.com/en/formats/commander-limited>, <https://magic.wizards.com/en/play-events/commander-box-league>
3. Draftsim, "Mystery Booster Commander Edition", last updated 2026-08-29: "a Commander Draft set … Each pack will have 20 cards", paper release 2026-11-13. <https://draftsim.com/mtg-mystery-booster-commander-edition/>
4. Draftmancer (MIT), `client/src/components/News.vue` and `src/BoosterFactory.ts`; GitHub code search 2026-11-20.
5. CubeCobra wiki, cube page. <https://github.com/dekkerglen/CubeCobra/tree/master/packages/server/content/wiki/cube-page>
6. Archidekt, formats API. <https://archidekt.com/api/decks/formats/>
7. Playgroup.gg, "Cube draft". <https://playgroup.gg/cube-draft>
8. r/mtgcube, "Comments and critique for a 360-card Commander Bar Cube", 2026-10-17, 18 points, 12 comments. <https://www.reddit.com/r/mtgcube/comments/1x88mzz/>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player who opened a Box League box, or drafted Commander Masters, Mystery Booster Commander Edition or a Commander cube, must build a 60-card deck under modified rules (duplicates as opened, 60 minimum, partners by pack, colour identity ignored in Box League). Their deckbuilder checks 100-card singleton Commander, and the draft sites build 40-card decks with no commander check [1][2][4][5].

### Goals

- A declared pool and a deck bound to it, where only pool cards and unlimited basic lands can be added.
- Construction checked per Commander Limited variant from I-42's data, each rule cited.
- Commanders available in the pool, and basics to a recommended land count.
- After the event, the opened cards go to the collection with the product and date as provenance.

### Non-goals

- Drafting, pack generation; a cube list (I-110); events and standings; validating that a pool was opened; statistics counting by default.

### Personas

The casual pod player at a draft night; the collector and budget player who buys a Box League box; the bracket-focused player drafting Commander Masters at the table's level. See the roadmap persona table.

### User stories

#### US-111-01

As a Box League player, I want to paste the cards from my Play Booster box and build a 60-card deck with colour identity ignored except where a card refers to it, so that the deck is legal for the week's games.

#### US-111-02

As a Commander Masters drafter, I want two mono-coloured legends from my pool accepted as partners, so that the deck I drafted is not flagged as illegal.

#### US-111-03

As a player after a draft night, I want to add my pool to my collection in one reviewed import, so that the cards I opened show as owned in my other decks.

### Acceptance criteria

#### AC-111-01 Happy path

Given a Commander Masters pool holding two copies of a card plus a mono-white and a mono-blue legend
When the player builds 60 cards with both copies and both legends as commanders
Then the check passes, citing CR 903.13f(2) and (3)

#### AC-111-02 Error and failure

Given a pool paste with an unresolvable line
When the preview opens
Then the line is listed, and nothing is written until it is resolved or skipped

#### AC-111-03 Box League identity

Given a Box League pool with a red-white commander and green cards
When the deck is checked as Box League
Then no colour-identity violation is reported, and Arcane Signet's line notes that it still follows the commander's identity

#### AC-111-04 Guest and signed-in

Given the rollout
When a guest and a signed-in player open the pool flow
Then the guest may paste a pool and see the check without saving, and only the signed-in player can bind it to a saved deck

#### AC-111-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-111-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player moves a card from the pool board to the deck without a pointer
Then the move has a named control, the finding "not in your pool" is announced, and no state is colour alone

#### AC-111-07 Not in the pool

Given a card added that is not in the pool
When the check runs
Then it names the card as "not in your pool", and the deck stays saved with the finding visible

#### AC-111-08 Unwritten rule

Given a Mystery Booster Commander Edition pool
When the partner rule is shown
Then it reads that the Comprehensive Rules of 2026-11-06 name no rule for this set, and the table's choice is recorded as a house rule through I-15

### UX flow and states

"New deck from a pool" asks for the variant and the pool, shows the import preview, then opens the editor with the pool board beside the deck and the check panel.

- Empty: "Paste or import your pool."
- Loading: a busy state that keeps the boards still.
- Error: failing pool lines in the preview; a failed save keeps the last saved deck.
- Partial: "commanders in this pool" reads "not yet available" until I-54 slice 1 ships.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`limited_pool_declared {variant, entries, unresolved}`, `limited_check_run {variant, findings}`, `limited_pool_added_to_collection {}`. Reserved for I-39's store. Counts and enums only.

### Rollout and feature flags

Slice 1 is invisible. Slice 2 ships behind an I-69 switch, `decks.commanderLimited`, after D-105.

### Dependencies

[I-42](i42-commander-variants-duel-cedh-pauper.md) (variant data and picker); [I-16](i16-decks-buildable-from-a-collection.md) (pool kind); [I-10](i10-interoperability-and-integrations.md); [I-54](i54-find-your-next-commander.md); [I-58](i58-mana-base-builder.md); [I-26](i26-collections-arriving-from-elsewhere.md); [I-50](i50-play-this-deck-online.md); [I-15](i15-rule-zero-sheets-and-pod-profiles.md); [I-03](i03-trustworthy-deck-feedback.md). [I-104](i104-league-decks-and-the-change-allowance-between-rounds.md)'s declared pool is a sibling.

### Risks and mitigations

- **A wrong reading of an official rule.** Mitigation: every finding cites its rule; the Box League reading is labelled; fixtures per set.
- **An unwritten rule shown as official.** Mitigation: MBC partners are a house rule through I-15, never a default rule.
- **A limited deck polluting statistics.** Mitigation: excluded by default (D-105).

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-111-101 A Box League week

As a Box League player, I want to swap cards between games from my box, so that my deck changes as the league allows.

#### AC-111-100 Happy path

Given a Box League deck bound to its box
When the player swaps a pool card in between games
Then the check reruns and passes, and the swap is an ordinary deck edit

#### AC-111-101 Failure

Given a Buy-a-Box promo in the pool
When the deck includes it
Then the check names it "not allowed in Box League", citing Wizards' page with its read date

#### AC-111-102 Edge

Given a CMM pool and a deck of 75 cards
When the check runs
Then it passes, since CR 903.13f(1) sets no maximum

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "Paste or import your pool."                                                                            |
| Loading          | A busy state that keeps the boards still.                                                               |
| Error            | Failing pool lines, or "Not saved" with a retry.                                                        |
| Guest            | Paste and check without saving.                                                                         |
| Signed-in        | Bind, save, add to collection and export.                                                               |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Moving cards between boards is reachable without a pointer.                                             |
| Screen reader    | Findings are announced with their rule.                                                                 |
| Colour           | Findings are words and icons as well as hue, in both themes.                                            |
| Success          | "Pool added to your collection", with the change report.                                                |

### Alternate paths

- The player imports a Draftmancer pool export. It goes through the same preview.
- The player changes the variant. The check reruns under the new rules; the pool is unchanged.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-111 is a link here. It promotes I-42's sixteenth-pass open question, which now points here; I-42 keeps the rules as data and I-16 gains the pool kind.

## I-111: A Commander Deck From A Drafted Or Opened Pool

**Outcome:** after a Box League box, a Commander Masters or Mystery Booster Commander draft, or a Commander cube night, the player declares the pool, builds a 60-card deck checked under the right Commander Limited rules, and adds the opened cards to the collection.

**Status:** Later
**Priority:** Later; slice 1 by hand now. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Low. The rules are official; MBC's partner question is the one unknown.
**Depends on:** nothing for slice 1; D-105, I-10 and I-16's line for slice 2; I-54 slice 1 for slice 3; I-26 for slice 4; I-50 for slice 5.

CR 903.13f sets three construction exceptions for Commander Draft, and Wizards' Box League page sets its own; the drafting tools build 40-card decks with no commander check, and no tool checks a player's own pool.

### Scope

- [ ] `checkLimitedDeck`, pure, with fixtures per set (slice 1).
- [ ] A declared pool on a deck (slice 2); the pool board and commanders in the pool (slice 3).
- [ ] Later: add the pool to the collection (slice 4); exports and a printable list (slice 5).

### Engineering enablers

- `LimitedVariant` and `LimitedFinding` are discriminated unions; every finding carries its rule reference.

**Paid-tier angle:** none.

### Enrichment (2026-11-20)

**User story.** As a Box League player, I want to build from my box under Box League's rules, so that my deck is legal for the week.

**Acceptance.** CMM partners and duplicates pass; Box League ignores identity except Arcane Signet-style cards; cards outside the pool are named; MBC partners read as unwritten.

**UX.** "New deck from a pool", a pool board, a check panel.

**Data and API.** `DeckPool`; `checkLimitedDeck`.

**i18n and access.** English and French; findings announced with their rule.

**Telemetry.** `limited_pool_declared`, `limited_check_run`, `limited_pool_added_to_collection`. Reserved for I-39.

**Rollout.** `decks.commanderLimited`, after D-105.

**Open questions.** Picker or flag; 60 as a minimum; MBC partners; statistics.

### Definition of done

A player pastes a Commander Masters pool, builds 60 cards with duplicates and two mono-coloured legends as partners, sees the check pass with CR 903.13f cited, sees a card outside the pool named, and adds the pool to the collection with its product and date.

---
