# I-110: A Commander Cube The Product Can Check

> **Initiative:** I-110, proposed for the [roadmap](../roadmap.md) · **Status:** Blocked on D-104 — proposed 2026-11-20 · **Priority:** Later; nothing starts before the owner answers [D-104](../owner-decisions.md#product-scope-and-non-goals) · **Paid:** the list, import, export and counts never; the pool-wide floor audit is an [I-30](i30-business-model-and-paid-tier.md) candidate only · **Written 2026-11-20**
> **Placement:** a written non-goal stands in the way. `roadmap-context.md` says: "Do not build a draft simulator, cube platform (Commander cubes included, added 2026-11-10), venue directory or full card-trading marketplace in the current roadmap"; [I-79](i79-table-sets.md) and [I-85](i85-player-supplied-art-that-never-replaces-the-card.md) repeat it. This file proposes to narrow that non-goal for one job only, a cube **list** with Commander checks and an export, and keeps refusing drafting, pack generation, bots, hosting, event records and a cube directory. If the owner keeps the non-goal as written, this file is withdrawn and its evidence stays here as a record.
> **Research:** one dated note of 2026-11-20 (angle R2, cube, draft and sealed product), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the cube list (a large singleton pool), its import and export, and the Commander checks over the pool: commanders per colour identity and pair under a declared partner option, playables and fixing per colour, seats a declared per-player pool supports, and the pool's floor facts with no bracket number. **Does not own:** drafting or anything after the draft ([I-111](i111-a-commander-deck-from-a-drafted-or-opened-pool.md) builds a deck from a drafted pool); the paste parser ([I-10](i10-interoperability-and-integrations.md)); ownership marks ([I-06](i06-collection-and-purchase-planning.md)); combos ([I-09](i09-meta-and-evidence.md)); floor inputs ([I-77](i77-a-bracket-estimate-players-can-audit.md)); the latency harness ([I-37](i37-editor-depth.md)); share tokens ([I-08](i08-share-compare-and-learn.md)); a battle box ([I-79](i79-table-sets.md)'s non-goal).

**Proposed changes to neighbours, for the integrator:**

| Initiative      | Change                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| roadmap-context | Only if D-104 narrows it: the cube non-goal reads "no draft simulator, no draft hosting, no pack generation, no cube directory"; a checked Commander cube list is allowed under I-110. |
| I-79            | A non-goal line pointing here: a cube list is I-110's, if D-104 allows it; I-79 keeps "a battle box where players draw from one shared deck" out.                                      |
| I-37            | Slice 1's harness gains a 900-entry fixture for this file (separate from the nineteenth pass's 300-entry deck fixture on I-37 itself).                                                 |

## Overview

Archidekt's most-voted open feature is large lists: "[Builder] Cube/large deck support", 507 points, created 2022-02-16, still open and first on its board: "Save card lists in a way designed for 200+ entries!" [1]. The 507 points cover large lists in general, cubes being one use, so they are not a pure count of cube demand. CubeCobra's search for `category:Commander` returned 2,201 public cubes, 645 of them between 360 and 540 cards; the most-followed, "Easy-To-Understand Commander Cube (480 + 90 Commanders)", has 214 likes [2]. Playgroup.gg now runs Commander cubes in the browser for free: "everyone builds a 60-card Commander deck from what they got, and you play those decks on Playgroup Live" [3]. Its Classic Commander cube page shows how a curator checked the list by hand: "There is no Sol Ring and there are no Game Changers. We ran the whole list through Commander Spellbook and cut the combos that win on the spot", and "Every color pair gets two commanders of its own" [3]. Wizards ran an 810-card "Commander Cube" league on MTGO in May 2025 (search summary) [4]. On r/mtgcube, 93 titles in 2026 mention "commander", up to 50 points [5].

CubeCobra's deckbuilder works to "23 and 17" spell and land counts and names no commander slot and no colour-identity check [6]. No list tool computes the checks a Commander curator makes by hand: enough commanders in every colour pair, no Game Changer or two-card win at the table's bracket, and enough playables for every seat.

**Why a new initiative.** The job is refused, not owned: a grep of the glance table and every spec for "cube", "CubeCobra", "Draftmancer" and "large list" finds only the non-goal lines and Mana Pool's integration list. **Why blocked.** It reverses a written non-goal, competes with two free and mature tools, and could creep into a draft simulator. The owner decides first.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source           | What it does or says                                                                                                                                      | Source |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Archidekt feature board** | "[Builder] Cube/large deck support", 507 points, open since 2022-02-16; "I had to go elsewhere for my lists of my cubes" (2026-04-14)                     | [1]    |
| **CubeCobra**               | 2,201 public Commander-category cubes; analysis by colour × type, asfans, purchase totals; deckbuilder at 23 and 17, no commander slot                    | [2][6] |
| **Playgroup.gg**            | Free Commander cube draft and sealed with play; Classic Commander cube of 831 cards with curated rules (identity, partners, no Game Changers, combos cut) | [3]    |
| **MTGO**                    | "Commander Cube" league, 810 cards, May 2025 (search summary)                                                                                             | [4]    |
| **r/mtgcube**               | 93 "commander" titles in 2026, up to 50 points                                                                                                            | [5]    |
| **Archidekt formats API**   | 27 formats, none cube, draft or limited                                                                                                                   | [7]    |

**The gap.** The list tools stop at counts by colour and type; the Commander checks are done by hand.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **No cube or list object.** A deck is a `Deck` with `format String @default("commander")` (`prisma/schema.prisma`, line 146).
- **`CardPackage`** is a reusable group of cards, not a pool.
- **The editor's performance baseline** uses a 100-card fixture (I-37 slice 1).

**Owning context:** a new `cube` area inside `deck-analysis` for the checks (pure), with its own aggregate so that no deck projection, statistic or public deck page counts a 540-card list as a deck.

## Functional requirements

### 1. Principles

1.1 A cube is its own object, not a deck with a new format.
1.2 No drafting, no pack generation, no bots, no hosting, no records and no directory.
1.3 The pool's floor facts are shown as "what this cube allows". No bracket number is given for a cube.

### 2. The list

2.1 Up to about 1,000 singleton entries, imported from a pasted list or a CubeCobra or Draftmancer text export through I-10's parser with its preview; nothing is saved until every unresolved line is resolved or skipped.
2.2 The list stays responsive: I-37's latency budget holds on a 900-entry fixture.

### 3. Commander checks

3.1 Eligible commanders per colour identity and per colour pair, under a declared partner option: none; "mono-coloured legends partner" (the Commander Masters rule, CR 903.13f(3), used as a house rule by Playgroup and EDHREC); or a custom note. A pair under the declared minimum is flagged.
3.2 Playables and fixing per colour, and the seats a declared per-player pool size supports.
3.3 The pool's floor facts through I-77 and I-09: Game Changers, mass land denial, extra turns and two-card combos from Commander Spellbook, each named with its source and date.

### 4. Export

4.1 Export to CubeCobra and Draftmancer text; a re-import yields identical names and counts.
4.2 Owned and not-owned marks from I-06.

### 5. Free and paid

| Part                            | Free         | Paid candidate | Why                                                                 |
| ------------------------------- | ------------ | -------------- | ------------------------------------------------------------------- |
| List, import, export, counts    | Yes          | —              | Playgroup and CubeCobra give them away; I-30's "content free"       |
| Pool-wide floor audit (slice 3) | Yes at first | Candidate      | The one tool-shaped computation over 500 to 900 cards; I-30 decides |

## Data model / API

```
CubeList     id, ownerId, name, partnerOption: none | monoLegendsPartner | customNote, minCommandersPerPair,
             perPlayerPoolSize?, createdAt, updatedAt
CubeEntry    cubeId, oracleId, scryfallId?, position
CubeCheck    commandersByIdentity{}, commandersByPair{}, playablesByColour{}, fixingByColour{}, seatsSupported,
             floorFacts[]{kind, cardNames[], source, asOf}
```

- `checkCommanderCube(entries, options)` is pure; `FloorFact.kind` is a discriminated union with an exhaustive `never` guard.
- Routes: `POST /api/cubes`, `POST /api/cubes/[id]/import` (preview then commit), `GET /api/cubes/[id]/check`, `GET /api/cubes/[id]/export?format=cubecobra|draftmancer`.

## Non-goals

- Drafting, pack generation or bots, a draft simulator, hosting a draft, pick or win-rate analytics, event records.
- A public cube directory, likes or ranking.
- A battle box ([I-79](i79-table-sets.md)'s non-goal).
- Jumpstart-style packet cubes in version 1.
- Printing proxies for a cube ([I-80](i80-print-shop-file.md) stays per deck).
- A bracket number for a cube.
- Reading a CubeCobra list by link: paste or file only, so no I-29 source record is needed.

## Testing strategy

- **Checks (solitary):** a 540-entry fixture with 90 eligible commanders and partner option "none" yields ten pair counts with the cards counted; a pair under the minimum is flagged.
- **Floor (solitary):** a list with a Game Changer and both halves of a Spellbook combo lists both with the list's date and the combo's id, and the output type has no bracket field.
- **Round trip (sociable):** export to CubeCobra text and re-import yields identical names and counts.
- **Performance:** the 900-entry fixture holds I-37's budget.
- **Red first:** slice 1's first Red: a pasted CubeCobra export with one unresolved name returns a preview listing that line and writes nothing.

## Delivery slices

| #   | Slice                                                                                                                                                        | Depends on                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 0   | Owner: D-104 (narrow the non-goal or keep it); the default partner option and the minimum commanders per pair                                                | — (owner)                          |
| 1   | `CubeList` and its import from pasted, CubeCobra and Draftmancer text through I-10's parser with preview; singleton and legality checks; a 900-entry fixture | 0; I-10                            |
| 2   | `checkCommanderCube` (pure): commanders per identity and pair under a partner option, playables and fixing per colour, seats per pool size                   | 1                                  |
| 3   | The pool floor block: I-77 inputs and I-09's Spellbook combos over the pool, no score                                                                        | 2; I-77 slice 1; I-09's combo read |
| 4   | Export to CubeCobra and Draftmancer text; owned and not-owned marks from I-06                                                                                | 1; I-06                            |
| 5   | A read-only share link (`noindex`, revocable) and fork                                                                                                       | 1; I-08's share-token pattern      |

No slice can start now: every slice waits for D-104.

## Open questions

1. **D-104.** Narrow the non-goal to "no draft simulator, no draft hosting, no pack generation, no cube directory", or keep it? Recommended: narrow it for a checked list only, because the Commander checks are the part no free tool computes.
2. **Partner options.** Which ship: none; "mono-coloured legends partner"; or a note? Recommended: the first two.
3. **Reading by link.** Recommended: paste or file only, as I-10 and I-62 do for other sites.
4. **Its own object.** Recommended: yes, so no deck statistic counts a cube.

## Sources

Read on 2026-11-20 unless stated otherwise.

1. Archidekt, feature board and thread 2377567 ("[Builder] Cube/large deck support", 507 points). <https://archidekt.com/features>, <https://archidekt.com/forum/thread/2377567>
2. CubeCobra, search `category:Commander` ordered by popularity, 2,201 results over 40 pages; robots file `Content-Signal: search=yes,ai-train=no,use=reference`. <https://cubecobra.com/search?q=category%3ACommander&order=pop>
3. Playgroup.gg, "Cube draft": "everyone builds a 60-card Commander deck from what they got, and you play those decks on Playgroup Live. Drafting, build[ing and playing all happen in the browser]" (verified on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`), <https://playgroup.gg/cube-draft>; "Classic Commander" cube page, <https://playgroup.gg/cubes/classic-commander>. Neither page is dated.
4. MTGO, "Introducing Commander Cube", May 2025 (search summary; the site did not resolve on 2026-11-20). <https://www.mtgo.com/news/introducing-commander-cube>
5. r/mtgcube, Arctic Shift, 2026 titles with "commander": "I built my first commander cube!!!!", 2026-05-20, 50 points, <https://www.reddit.com/r/mtgcube/comments/1tj2uaw/>; "My Commander Cube lets me to play more often", 2026-11-12, 25 points, <https://www.reddit.com/r/mtgcube/comments/1xubzkk/>.
6. CubeCobra wiki, cube page (GitHub, Apache-2.0, last committed 2026-11-15). <https://github.com/dekkerglen/CubeCobra/tree/master/packages/server/content/wiki/cube-page>
7. Archidekt, formats API. <https://archidekt.com/api/decks/formats/>
8. EDHREC, "Jumpstart Commander Cube: Final Fantasy", 2025-06-24. <https://edhrec.com/articles/jumpstart-commander-cube-final-fantasy>; Lucky Paper, "Building a Cube from a Collection", 2023-04-13. <https://luckypaper.co/articles/building-a-cube-from-a-collection/>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A Commander cube curator keeps a 360–900-card list on CubeCobra and checks by hand what only matters for Commander: enough commanders in every colour pair, no Game Changer or two-card win at the table's bracket, and enough playables for every seat. No list tool computes those checks; Playgroup's curators describe doing them manually [3].

### Goals

- A cube list of up to about 1,000 singleton entries, imported and exported in CubeCobra and Draftmancer text, that stays responsive.
- Commander checks on the pool, and the pool's floor facts with no bracket number.
- Owned and not-owned marks for building the cube from a collection.

### Non-goals

- Drafting and everything a draft platform does; a directory; a battle box; packet cubes; proxies; a bracket number for a cube.

### Personas

The casual pod player who hosts a cube; the bracket-focused player who aims a cube at a bracket; the content creator who publishes cube lists. See the roadmap persona table.

### User stories

#### US-110-01

As a host building a 540-card Commander cube for my pod, I want to see how many eligible commanders each colour pair has, so that no drafter ends up without a commander in their colours.

#### US-110-02

As a curator aiming at a Bracket 2 table, I want every Game Changer and every two-card combo in my list named with its source, so that I cut them before the cube is printed or bought.

#### US-110-03

As a player who drafts on Draftmancer, I want to export my checked list in a format Draftmancer and CubeCobra read, so that the draft happens where my group already drafts.

### Acceptance criteria

#### AC-110-01 Happy path

Given a 540-card list with 90 eligible commanders and the partner option "none"
When the checks run
Then each of the ten colour pairs shows its commander count with the cards counted, and a pair under the declared minimum is flagged

#### AC-110-02 Error and failure

Given a pasted CubeCobra export with one name that does not resolve
When the preview opens
Then that line is listed as unresolved and nothing is saved until the owner resolves or skips it

#### AC-110-03 Floor without a bracket

Given a list that contains a Game Changer and both halves of a Commander Spellbook two-card combo
When the floor block renders
Then both are listed with the list's date and the combo's id, and no bracket number is shown for the cube

#### AC-110-04 Guest and signed-in

Given the rollout
When a guest opens a shared cube link and a signed-in owner opens their cube
Then the guest reads the list and its checks read-only, and only the owner can edit, import or export

#### AC-110-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-110-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the owner reads the pair table without a pointer
Then it is a table with headers, a flagged pair reads "below your minimum" as words, and colour pairs are named in words as well as symbols ([I-49](i49-colour-vision-and-low-vision-display.md))

#### AC-110-07 Round trip and scale

Given a saved 900-entry cube
When it is exported to CubeCobra text and imported again, and when the owner adds a card
Then names and counts are identical, and I-37's latency budget holds

### UX flow and states

"New cube" opens an import with preview. The cube page has three tabs: the list, the Commander checks and the floor facts. Export and share sit in the header.

- Empty: "Paste a list or import a CubeCobra or Draftmancer file."
- Loading: a busy state that keeps the list still.
- Error: the import preview lists failing lines; a failed save keeps the last saved list.
- Partial: the floor block reads "not yet available" until I-77 slice 1 ships.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`cube_imported {entries, unresolved}`, `cube_checked {pairsFlagged}`, `cube_exported {format}`. Reserved for I-39's store. Counts and enums only.

### Rollout and feature flags

Nothing ships before D-104. Then behind an I-69 switch, `decks.cube`, signed-in only for creating; guests read shared links.

### Dependencies

[D-104](../owner-decisions.md#product-scope-and-non-goals); [I-10](i10-interoperability-and-integrations.md) (paste parser); [I-06](i06-collection-and-purchase-planning.md); [I-09](i09-meta-and-evidence.md); [I-77](i77-a-bracket-estimate-players-can-audit.md) slice 1; [I-37](i37-editor-depth.md) (latency harness); [I-08](i08-share-compare-and-learn.md) (share token); [I-42](i42-commander-variants-duel-cedh-pauper.md) (legality as data). [I-111](i111-a-commander-deck-from-a-drafted-or-opened-pool.md) reads a pool after the draft.

### Risks and mitigations

- **Scope creep into a draft platform.** Mitigation: the non-goals above are restated in D-104's wording, and no slice generates a pack.
- **Two free, mature competitors.** Mitigation: build only the Commander checks they lack, and export to them.
- **A cube floor read as a bracket.** Mitigation: no bracket field in the output type, and a test that refuses one.

### Kill criteria

None. This initiative is not in the Now band. If D-104 keeps the non-goal, the file is withdrawn.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-110-101 A cube from a collection

As a host building a cube from cards I own, I want each entry marked owned or not owned, so that I know what to proxy or buy.

#### AC-110-100 Happy path

Given a 360-entry cube and a collection that owns 300 of its names
When the owner opens the list with marks on
Then 300 entries read "owned" and 60 "not owned", each as a word

#### AC-110-101 Failure

Given an export request that times out
When the owner retries
Then the same file is produced, and no state changed

#### AC-110-102 Edge

Given the partner option "mono-coloured legends partner"
When the pair counts are computed
Then each pair counts its two-colour legends plus the pairs of mono-coloured legends that make it, labelled "with your partner rule"

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "Paste a list or import a CubeCobra or Draftmancer file."                                               |
| Loading          | A busy state that keeps the list still.                                                                 |
| Error            | Failing import lines, or "Not saved" with a retry.                                                      |
| Guest            | A shared cube, read-only.                                                                               |
| Signed-in        | Edit, import, check, export and share.                                                                  |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Tabs, import, export and filters are reachable without a pointer.                                       |
| Screen reader    | Tables have headers; flags are words.                                                                   |
| Colour           | Pairs are named in words; flags are words and icons as well as hue.                                     |
| Success          | "Exported" with the file name.                                                                          |

### Alternate paths

- The owner changes the partner option. Pair counts recompute; nothing else changes.
- The owner forks a shared cube. A private copy is created; the original is unchanged.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-110 is a link here. It is blocked on D-104 and does not reverse the cube non-goal by itself.

## I-110: A Commander Cube The Product Can Check

**Outcome:** a curator imports a Commander cube list, sees commanders per colour pair under a declared partner rule, playables and seats, and the pool's floor facts with no bracket number, then exports it to where the group drafts.

**Status:** Blocked on D-104
**Priority:** Later. The list and counts never paid; the floor audit an I-30 candidate.
**Impact / effort:** Medium / medium
**Risk:** High. It narrows a written non-goal, competes with free tools, and could creep into drafting.
**Depends on:** D-104; I-10; I-37's harness; I-77 slice 1 and I-09 for slice 3; I-06 for slice 4; I-08 for slice 5.

Archidekt's top open request is large-list support (507 points); CubeCobra holds 2,201 public Commander cubes; Playgroup runs Commander cubes free and its curators check commanders per pair, Game Changers and combos by hand.

### Scope

- [ ] `CubeList` and import with preview (slice 1); `checkCommanderCube` (slice 2).
- [ ] The pool floor block (slice 3); export with owned marks (slice 4); share and fork (slice 5).

### Engineering enablers

- A cube is its own aggregate; `checkCommanderCube` is pure; a 900-entry latency fixture.

**Paid-tier angle:** the floor audit over a large pool is the only candidate.

### Enrichment (2026-11-20)

**User story.** As a host building a 540-card Commander cube, I want commanders counted per colour pair, so that no drafter lacks one.

**Acceptance.** Pair counts with the cards counted; flagged pairs; floor facts with no bracket; a lossless CubeCobra round trip; latency on 900 entries.

**UX.** A cube page with list, checks and floor tabs; import with preview; export.

**Data and API.** `CubeList`, `CubeEntry`; check and export routes.

**i18n and access.** English and French; pairs in words; tables with headers.

**Telemetry.** `cube_imported`, `cube_checked`, `cube_exported`. Reserved for I-39.

**Rollout.** `decks.cube`, after D-104.

**Open questions.** D-104; partner options; reading by link; its own object.

### Definition of done

After D-104 narrows the non-goal, a host pastes a 540-card CubeCobra export, resolves one unknown line, sees each colour pair's commander count and the Game Changers and combos the cube allows, and exports a file CubeCobra reads back unchanged.

---
