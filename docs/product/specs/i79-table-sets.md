# I-79: Table Sets: Decks Built To Play Together

> **Initiative:** I-79, proposed for the [roadmap](../roadmap.md) · **Status:** Later · **Priority:** Later, behind two demand gates added to D-52 (requirement 7). Nothing past slice 0 starts before gate A is met and the owner answers D-89 · **Paid:** building, checking, sharing, publishing and exporting a set are free; a balance run across the set is a candidate for [I-30](i30-business-model-and-paid-tier.md) (requirement 8) · **Written 2026-11-11**
> **Research:** one dated note, not committed, so every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the table set (a named group of two to four Commander decks one author builds for one table), its seats, the rules checked across a set, the physical-copy check across a set, the balance view, set sharing, publishing and forking, the table export, and the demand gates for this work. **Does not own:** each deck's legality, bracket estimate, routes or table effects ([I-03](i03-trustworthy-deck-feedback.md), [I-77](i77-a-bracket-estimate-players-can-audit.md), [I-65](i65-how-this-deck-wins.md), [I-78](i78-what-this-deck-does-to-the-table.md)); pods, sheets and consent ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); free copies ([I-16](i16-decks-buildable-from-a-collection.md)); boxes and contention ([I-43](i43-physical-collection-storage-and-pull-lists.md)); loans ([I-51](i51-cards-lent-and-borrowed.md)); per-target exporters ([I-50](i50-play-this-deck-online.md)); rule types ([I-53](i53-monthly-deckbuilding-challenges.md)); simulations ([I-31](i31-deck-lab.md)); events ([I-39](i39-first-run-activation-and-measurement.md)); plans ([I-30](i30-business-model-and-paid-tier.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative       | Change                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-15             | Requirement 1.1 reads "a deck, a pod of up to four decks, or an I-79 table set". The set's balance view reuses slice 4's comparison layout. A set is not a pod (D-40): a pod is people, a set is one author's decks. |
| I-43             | Contention (6.3) and pull lists accept a set as their scope: "Check this set's boxes". The paid game-night planner (slice 13) may take a set as its input.                                                           |
| I-51             | "Lend this set" creates one whole-deck loan (2.1) per chosen seat in one action, with one combined return checklist. Lent copies are unavailable to the set's copy check (slice 3).                                  |
| I-50             | A set-scoped export runs each seat through the export contract (requirement 1). Tabletop Simulator gains a table save with one deck per seat. The panel's I-39 event (5.6) gains `scope`.                            |
| I-39             | A derived metric, "table day" (requirement 7.1), in section 11 and the owner view; `export_done` gains `scope: deck \| set` in its allowlist.                                                                        |
| I-53, I-08, I-07 | I-53 slice 1's rule `scope: set` (G-05) is read here. I-08 decides likes and comments on sets. The four-deck sandbox option under D-35 (G-22) loads a set, one seat per position.                                    |
| I-30             | D-17 gains the balance run as a paid candidate; per D-89, the pod pass covers sets.                                                                                                                                  |

## Overview

In Commander the table, not the deck, is the unit of play. Some players build the whole table: a host keeps decks for guests who own none, a player gives friends decks that work against each other, a pod agrees on a gauntlet. Today that person keeps two to four separate decks, checks each alone, and finds at the table that two of them need the same Cyclonic Rift.

This initiative adds one object for that work. A table set holds two to four of the author's Commander decks. The product checks rules that only exist across decks (no duplicate commander, one physical copy per card), shows the decks' computed facts side by side without grading them, shares or publishes the set as one link, and exports the whole table in one action.

**Why a new initiative.** No initiative owns an authored container of decks. I-15's pod gathers four players' own decks under consent; folders (I-01) are private storage; I-55's builds are versions of one deck; I-43 pairs one deck with one box; I-51 lends. **Why Later.** Commander demand found so far is real but thin (see the player voice below), and the strong evidence comes from co-operative card games. The work starts only when the product's own data shows hosts setting up several decks at once (requirement 7).

## What the market does

All rows were read on 2026-11-11 unless dated otherwise.

| Product                    | Game                  | What it does                                                                                                                                                                                                                                                                                                                                        | Source      |
| -------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **RingsDB fellowships**    | Lord of the Rings LCG | A titled group of decks with one description, likes, favourites and comments, text and OCTGN downloads, Markdown and HTML exports. "We're planning to play them all as a team" (2017-12-04). A 2023-08-15 fellowship holds two decks: "one for players that I'm introducing to the game", "the other one for myself". The listing runs to 120 pages | [1][2][3]   |
| **RingsDB → DragnCards**   | Lord of the Rings LCG | "Play on DragnCards" opens every deck of a fellowship at one online table; the link carries one `decklist/<id>` segment per deck                                                                                                                                                                                                                    | [1]         |
| **Arkham Cards**           | Arkham Horror LCG     | "You can also group together decks into campaigns"; it tracks scenario results and upgrades decks (v6.3.7, "Oct 21", no year; free)                                                                                                                                                                                                                 | [4]         |
| **Decks of KeyForge**      | KeyForge              | "Team Decks" (release 4.18, 2020-04-09): search every teammate's decks and see a table of teammates. "Forming a team is a $5+ a month Patreon benefit, and searching team decks is a $1+ a month benefit"                                                                                                                                           | [5]         |
| **Master Duel; Riftbound** | Yu-Gi-Oh!; Riftbound  | Rules spanning a team's decks: "at most three copies of each card across all of each team's Decks", with up to three "Shared Cards" (2025-07-29); "Allied players cannot repeat battlefields in their decks" and "cannot have the same Champion Legend as their partner" (2025-10-24)                                                               | [6][7]      |
| **Wizards of the Coast**   | Magic                 | Game Night: Free-for-All "includes five 60-card Magic decks—one for each mana color", presented "in the familiar format of a board game" (announced 2022-06-30, released 2022-10-14)                                                                                                                                                                | [8]         |
| **Archidekt; Moxfield**    | Magic                 | Archidekt folders can be made "private or public" (changelog 0.8.2, undated). Moxfield players ask for shareable folders (search summary) and, on 2026-09-16, for "a folder where anyone can submit a deck" (3 points, 4 comments). Folders store decks; neither checks them as a table                                                             | [9][10][11] |
| **TopDecked**              | Magic                 | "Supports up to four decks per simulation on the same device" (version 12.1.0, 2023-11-13). _Correction:_ the wave 11 findings date this line to 13.0.5 (2025-11-13), whose notes carry only the QR line                                                                                                                                            | [12]        |

**Player voice (Commander).** An [Arctic Shift](https://arctic-shift.photon-reddit.com/) title search of r/EDH from 2025-01-01 finds the practice but little volume. A "Beginner Battle Box" of five decks that "work against each other (no hard counters)" (2026-02-19, 3 points, 17 comments) [14]. Five mono-coloured 50-card decks: "I want them to work with each other" (2025-10-27, 1 point) [15]. "Proxy decks for my friends … similar power level and fun" (2026-08-02, 1 point, 11 comments) [16]. Decks brought for a friends' get-together drew 475 comments, about proxies rather than balance (2025-05-30, 235 points) [17]. "Commander recommendations to lend to friends playing for the first time?" (2026-01-13, 14 points, 47 comments) [18]. The best-scored "battle box" post (2026-10-23, 36 points) describes one shared 160-card deck, which is a cube and out of scope [19]. A forum thread on building "all five decks so you can try to balance them against each other" is a search summary only [20].

**The gap.** Among the products read, only co-operative card games treat a group of decks as one object that can be checked, shared and opened at a table together. No Magic deckbuilder read checks a rule across decks or a shared physical copy.

## Current state in this codebase

Verified on `dev` at `2cf792e8` (#1340) on 2026-11-11:

- **No group of decks.** `Deck` has one `folderId`; `DeckFolder` is "A private organizational container for decks owned by one user" (`prisma/schema.prisma`). `PublicDeckFolder` and `SavedPublicDeck` are private bookmarks of other authors' public decks. There is no pod model and no I-39 event table (`ProductEvent` is absent), so the gate in requirement 7 needs I-39 slices 10 to 12 first.
- **Copies across decks, by printing.** `buildAcquisitionPlan` (`src/lib/collection/acquisition-plan.ts`) sums "simultaneous deck requirements" across selected decks against owned quantities, keyed by `scryfallId`; it counts commander, partner and main-zone cards and skips basics. `GET /api/collection/acquisition-plan` runs it over all of the player's decks or one. Two decks listing one printing while the owner holds the card in another printing show as a shortage. `getDeckCardStatuses` (`src/lib/collection/shopping-list.ts`) covers each card with physical copies first, then proxies. `GET /api/collection/usage` lists the decks that use one printing.
- **Comparison is pairwise.** `DeckComparisonPanel` compares two decks' cards and strategic roles (`compareDeckCards`, `compareDeckProfiles` in `src/lib/deck/comparison.ts`) on `/decks` and in public comparison.
- **Facts per deck exist.** `scoreBracket` (`src/lib/deck/bracket.ts`) averages six dimensions, `winSpeed` among them, then applies combo and Game Changer floors; the browser computes it through `useBracketScore`. `Deck.targetBracket` (default 3) and `Deck.manualBracket` hold the owner's declared values. `DeckCard` stores `oracleText`, `colorIdentity` and `isGameChanger`.
- **Export is one deck at a time.** Eight text exporters in `src/lib/deck/export.ts`; `downloadFile` writes one file. `package.json` has no ZIP or QR library.
- **Fork copies one deck.** `buildForkData` (`src/lib/deck/fork.ts`) copies a deck with its description and credit.

**Owning contexts** in the refactor's target layout (`docs/engineering/architecture.md`, not merged yet): `deck-building` owns `TableSet`, `TableSetSeat` and the fork use case; `format-rules` owns `checkTableSet`; `collection` owns `checkSetCopies`; `deck-analysis` owns the balance read model; `deck-interchange` owns `exportTable`; `community` owns the public page and profile listing.

## Functional requirements

### 1. The table set

1.1 A set has a name (1–80 characters), an optional description written by its author, a purpose (gift, loaner, gauntlet, pod set, other) and up to four seats. A private set may hold one seat while it is built; sharing or publishing needs two to four.
1.2 Each seat holds one deck in the `commander` format and an optional label of up to 40 characters, such as "for newcomers".
1.3 **Own decks first (D-89).** Every seat deck belongs to the set's owner. A seat naming another account's deck is refused with the same answer as a missing deck.
1.4 A deck may sit in several sets, and once per set. Deleting a deck empties its seat; a shared or public set left with fewer than two seats is hidden until a seat is filled. Deleting a set deletes no deck. A set reads its decks live. It records no players, no attendance and no game; frozen lists exist only through export and deck check links (I-50 6.3).

### 2. Rules across the set

2.1 `checkTableSet(seats, rules)` is a pure function. Each rule returns `pass`, `fail` or `unknown`, with the cards and seats as evidence.
2.2 **On by default:** no commander, partner or Background appears in two seats, compared by card name until I-67's card keys exist.
2.3 **Off by default:** distinct colour identities across seats; a maximum bracket spread (0, 1 or 2) between the highest and lowest estimate, read from I-77 once it ships and from `scoreBracket` until then.
2.4 **House rules:** once I-53 slice 1 has the `scope: set` rule types (G-05), a set may carry them; each runs per seat and across the set.
2.5 A failure reads "set rule" or "house rule", never "illegal". A seat deck's legality badge and the official verdict never change (D-90). Failures never block saving, sharing or exporting. They appear on the set page and among the export notices.

### 3. The physical-copy check

3.1 For a set built from one collection, the check lists each card the seats need at the same time beyond the copies the owner holds: the card, copies per seat, copies owned, copies short and the seats competing.
3.2 It counts by card, not by printing: any owned printing, foil or not, serves any seat. Each row still shows the printings involved.
3.3 Basic lands are left out, snow-covered basics included. Command-zone cards count. Proxies count apart: a card covered only by proxies shows "proxy", never "owned", with physical copies used first as `getDeckCardStatuses` does.
3.4 **Pools.** "All owned copies" is the default. "Free copies" also excludes copies committed to decks outside the set (I-16 slice 4). Lent copies are unavailable (I-51 slice 3). With I-43, a short row names the box that holds the copy, and a "travelling staple" mark (G-29) turns it into a hand-off instead of a shortage.
3.5 The check reads only, is computed on request and never changes ownership. Short rows link to I-06's acquisition plan scoped to the set.

### 4. The balance view

4.1 One screen shows one column per seat, reusing I-15 slice 4's layout: computed facts in one labelled block, declared facts in another.
4.2 **Computed rows available today:** commanders and colour identity; card count; the bracket estimate with its Game Changers and two-card combos; average mana value; ramp, draw, removal and board-wipe counts; total price with its currency and date; for the owner only, the share of each deck the collection covers.
4.3 **Rows added when their source ships:** I-77's floors and audit link; I-65 slice 4's earliest-turn estimate as "speed"; I-78's table-impact line (what the deck gives to, takes from and provokes in the other players).
4.4 **Declared rows:** each deck's target bracket and manual bracket. An I-15 sheet attached to the set adds its declared speed, and its house rules apply to every seat.
4.5 Spreads are worded as questions, never verdicts: "Seat 3 estimates one bracket above the others. Is that intended?" The prompt cites the same measured cost of a gap as I-15's pod fit (G-02).
4.6 There is no balance score. The view adds, averages or ranks nothing across seats, as I-31's non-goal on power scores requires. Every computed row names its method and version. No model produces any row ([strategic boundaries](../roadmap.md#strategic-boundaries)).

### 5. Sharing, publishing and forking

5.1 Visibility is private (default), link or public. A link uses a random token of at least 128 bits; its page is `noindex` and `robots.ts` disallows its path. Revoking a link or making a set private removes access on the next request.
5.2 A set never exposes a private deck. A link shows each seat through the shared-deck projection (`SHARED_DECK_SELECT`) while the link is on. Public needs every seat deck public; the publish dialog lists the private ones and offers to make them public in the same confirmation.
5.3 Neither the shared nor the public page shows the owner's collection, owned share or copy check (I-15 2.4).
5.4 A public set lists on its author's profile, and each seat deck's page says "Seat in table set <name>". A browse page waits for I-75's query contract.
5.5 **Copy this table** copies every seat deck through `buildForkData` into the viewer's account as a new private set. Each deck keeps its fork credit; the set adds "forked from <set> by <author>". The primer switch (D-93) applies once it exists.

### 6. Exporting the table

6.1 **Export the table** runs I-50's exporter for one chosen destination on every seat. It yields one `ExportResult` per seat and shows the notices, grouped by seat, before the download.
6.2 For desktop clients (Cockatrice, XMage, Forge, Magic Online), it produces one file per seat in one ZIP archive named `<seat>-<deck>.<ext>`. The archive is built in the browser by a bundled library, and the slice checks its licence.
6.3 For Tabletop Simulator, it produces one save whose `ObjectStates` hold each seat's library, command zone and tokens at that seat's position, each with its own `Transform` [13], under I-50 requirement 4's image rules.
6.4 For webcam and browser tables, it produces one table-text block per seat under a seat heading, with "copy all" and a copy button per seat.
6.5 For guests, it gives one deck check link per seat (I-50 6.3), printable on one page with a QR code each once I-50 slice 11 ships.
6.6 The same set and options produce byte-identical output (I-50 1.5). Export is free and needs no account for a public set (I-50 7.1).

### 7. Demand gates

7.1 **Gate A, before slice 1** (a proposal for D-52). A **table day** is a UTC day on which an account exports two or more distinct full-size decks it owns (I-39 11.1) to the same play destination: I-50's targets, or the shipped MTGO and Arena exports before I-50 slice 8. It is derived from `export_done` rows, which already carry the deck id and format, so no new event is needed for gate A. Gate A is met when, over eight consecutive weeks, at least 30 distinct accounts record a table day and they make up at least 3% of the median week's game-ready builders (I-39 11.7). Both numbers are proposals the owner confirms.
7.2 The owner view reports table days as a count, and as a rate with n and a 95% interval once n reaches 30 (I-39 11.9). Supporting signals, never gating alone: pods where one member shares two or more of their own decks (I-15 slice 3), and requests on I-52's board.
7.3 **Gate B, before slices 11 to 14 and 18.** Within 12 weeks of slice 3 shipping, at least 50 accounts hold a set of two or more full-size decks, and at least 30 of those sets had a seat exported or playtested within 30 days of creation. These are proposals too. A missed gate is recorded with its date under D-89, and the gated slices stay unpromoted; nothing that shipped is withdrawn.

### 8. Free and paid

| Part                                                                                                                                                                                                                       | Free                                    | Paid candidate (I-30 decides) | Why                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sets, seats, rules, copy check, balance view, sharing, publishing, forking, every export                                                                                                                                   | Yes                                     | —                             | Building, sharing and exporting are always free, and the player's own data is never the lever ([I-30 1.1–1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line))                          |
| **Balance run:** I-31's run on every seat with one seed on the server, stored, with each pair of seats compared on commander-by-turn and mana development under Holm's correction and I-21's "not distinguishable" wording | Each deck's default I-31 run stays free | Yes                           | Computation over the player's own decks (I-30 1.3). No product read offers a balance check across decks; Decks of KeyForge charges "$5+ a month" to form a team [5]. Per D-89, the pod pass covers it |

## Data model / API

```
TableSet       id, ownerId → User (Cascade), name, description?, purpose (gift | loaner | gauntlet | pod | other),
               visibility (private | link | public), shareToken? @unique, rules Json (TableSetRule[]), rulesVersion Int,
               forkedFromSetId?, forkedFromSetName?, forkedFromUserName?, createdAt, updatedAt
TableSetSeat   id, setId → TableSet (Cascade), deckId → Deck (Cascade), seat Int (1–4), label?
               @@unique([setId, seat]) @@unique([setId, deckId]) @@index([deckId])
```

`TableSetRule` is a discriminated union with an exhaustive `never` guard: `uniqueCommanders`, `physicalCopies {pool: owned | free}`, `distinctColourIdentities`, `bracketSpread {max: 0 | 1 | 2}`, `houseRules {rules: ChallengeRule[]}` (I-53). The seat invariant (`deck.userId === set.ownerId`) lives in one write module.

Routes: `GET|POST /api/table-sets`; `GET|PATCH|DELETE /api/table-sets/[id]`; `PUT /api/table-sets/[id]/seats`; `GET /api/table-sets/[id]/copies?pool=` (owner only, read-only); `GET /api/table-sets/[id]/balance` (collection rows for the owner only); `GET /api/table-sets/[id]/export?target=` (per-seat results); `POST /api/table-sets/[id]/fork`. Pages: `/tables/[id]` and `/share/table/[token]`. The path avoids `/sets/`, which reads as Magic's card sets.

## Non-goals

- A cube, or a battle box where players draw from one shared deck ([cube non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark)). A seat is a complete deck.
- Matchmaking, a lobby, finding players for a set, or ranking sets by power or popularity (I-15's non-goal; the online-play boundary).
- A balance score, a grade, or automatic balancing. The product never edits a seat to even the table, and no model proposes swaps here.
- Another player's deck in a seat before D-89's second stage; co-editing a set (I-20, D-91).
- Store loaner boxes ([I-41](i41-store-commander-nights.md)) and hosting games online (I-50 exports only).

## Testing strategy

- **Rules (solitary):** duplicate commander across partner pairs and Backgrounds; distinct identities with partners; spread at 0, 1 and 2; `unknown` when a seat lacks data; the rule union fails to compile on an unknown kind.
- **Copies (solitary):** one printing in two seats with the card owned in another printing (no shortage); basics and snow-covered basics left out; proxies counted apart; command zone counted; the free pool excludes a deck outside the set; lent copies.
- **Routes (sociable):** writes are owner-only; another account's deck is refused like a missing one; a link shows only the shared projection; publishing refuses while a seat is private; deleting a deck empties its seat; revoking ends access on the next request; a schema test keeps collection fields out of the shared and public projections.
- **Export:** each seat's output equals the single-deck exporter's byte for byte; the ZIP holds one entry per seat with stable names; the Tabletop Simulator save parses and holds one deck object per seat with distinct transforms.
- **Gate metric:** fixture events give the expected table-day count; one deck exported twice counts once; non-play formats are ignored.
- **Wording and layout:** English and French strings; a verdict-word test bans "illegal", "unbalanced" and "unfair" from set results; at 360 px the balance view stacks seats as cards with headers kept.

## Delivery slices

| #   | Slice                                                                                                       | Depends on                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 0   | Gate A measurement: table-day metric, `export_done.scope`, owner view rows (7.1, 7.2)                       | I-39 slices 11 and 12                                                             |
| 1   | Schema, owner-only routes, own-decks invariant, private set page with seats (1)                             | 0; **Blocked** on gate A and D-89                                                 |
| 2   | `checkTableSet`: unique commanders, distinct identities, bracket spread; results on the page (2.1–2.3, 2.5) | 1                                                                                 |
| 3   | Physical-copy check by card across printings, owned pool, proxies, route and panel (3.1–3.3, 3.5)           | 1                                                                                 |
| 4   | Balance view with today's computed and declared rows (4.1, 4.2, 4.4–4.6)                                    | 1                                                                                 |
| 5   | Link sharing: token, shared projection, revoke, `noindex` (5.1; 5.2 and 5.3 for links)                      | 1                                                                                 |
| 6   | Export the table: per-seat ZIP and table text (6.1, 6.2, 6.4, 6.6)                                          | 1; I-50 slices 0, 2 and 8                                                         |
| 7   | Per-seat deck check links and their printable page (6.5)                                                    | 6; I-50 slices 10 and 11                                                          |
| 8   | Free-copies pool and lent copies (3.4)                                                                      | 3; I-16 slice 4; I-51 slice 3                                                     |
| 9   | Bracket floors and speed rows (4.3)                                                                         | 4; I-77 slice 1; I-65 slice 4                                                     |
| 10  | Table-impact row (4.3)                                                                                      | 4; I-78 slice 1                                                                   |
| 11  | Publishing: public visibility, profile listing, seat mention on deck pages (5.2–5.4)                        | 5; gate B                                                                         |
| 12  | Copy this table (5.5)                                                                                       | 11                                                                                |
| 13  | Tabletop Simulator table save (6.3)                                                                         | 6; I-50 slice 7; gate B                                                           |
| 14  | House rules with set scope (2.4)                                                                            | 2; I-53 slice 1 with the set scope; gate B                                        |
| 15  | An I-15 sheet attached to a set (4.4, I-15 row above)                                                       | 1; I-15 slice 1                                                                   |
| 16  | Lend this set (I-51 row above)                                                                              | 1; I-51 slice 5                                                                   |
| 17  | Check this set's boxes (I-43 row above)                                                                     | 3; I-43 slice 7                                                                   |
| 18  | Paid candidate: the balance run (8)                                                                         | 4; I-31 slices 5 and 9; I-21 slice 5; gate B; **Blocked** on I-30 slices 0 and 11 |
| 19  | Second stage of D-89: a consented seat from another player's deck                                           | **Blocked** on D-89's second stage and D-40; I-15 slice 3                         |

Slice 0 is measurement only, and it is the only slice a scheduled agent may pick before the owner records gate A as met. Slice 1 carries every schema change. Slices 2 to 6 make a private set useful on their own: a host can check copies and export the table without publishing anything.

## Open questions

1. **D-89.** Build it at all; own decks only first, or another player's deck with consent; does the pod pass cover sets? Recommended: Later behind gate A; own decks first; the pod pass covers sets.
2. **Gate numbers (D-52).** Are 30 accounts and 3% of game-ready builders the right bar for gate A, and 50 sets with 30 used for gate B? Is a table day a fair proxy when a player may export several decks for their own use?
3. **Naming.** "Set" means a card expansion to Magic players ([I-73](i73-every-set-release-ready-on-day-one.md)). Recommended: "table set" in full in English, never "set" alone; `TableSet` in code; `/tables/` in URLs; "coffret de table" in French, to be checked by a French-speaking player.
4. **Five seats and house deck sizes.** Game Night ships five decks [8], and both r/EDH battle boxes use five 50-card decks [14][15]. Allow a fifth seat ("four of five play") and a house deck size through [I-42](i42-commander-variants-duel-cedh-pauper.md)'s variant configuration? Recommended: four seats and standard Commander until gate B data says otherwise.
5. **For the lawyer (research, not legal advice; add to I-30 requirement 7.2):** at D-89's second stage, may another player's deck appear in someone else's public set with consent given once, and must that consent be revocable per set (GDPR Art. 7(3))? Does showing that player's name as the deck's author need a separate basis ([I-38](i38-trust-safety-and-user-rights.md))?

## Sources

Read on 2026-11-11 unless stated otherwise. Reddit scores and comment counts are as archived by [Arctic Shift](https://arctic-shift.photon-reddit.com/), title searches over r/EDH from 2025-01-01.

1. RingsDB, fellowship "Our Fellowship for Attack on Dol Guldur", 2017-12-04: likes 14, favourites 11, comments 2, downloads, exports and the DragnCards link. <https://ringsdb.com/fellowship/view/3786/our-fellowship-for-attack-on-dol-guldur>
2. RingsDB, fellowship "The Ring-maker", 2023-08-15. <https://ringsdb.com/fellowship/view/10404/thering-maker>
3. RingsDB, fellowships listing (120 pages; threat, heroes and "cards up to" per deck). <https://ringsdb.com/fellowships>
4. Arkham Cards, App Store listing, v6.3.7 "Oct 21" (no year shown), free. <https://apps.apple.com/us/app/arkham-cards/id1424000351>
5. Decks of KeyForge, release notes 4.18 dated 2020-04-09, "Team Decks!", read from the site's current bundle (the file name changes on each deploy). <https://decksofkeyforge.com/static/js/main.b8088841.js>
6. Master Duel Meta, World Championship team rules, 2025-07-29. <https://www.masterduelmeta.com/articles/quick-news/july-29-2025/wcs-rules/>
7. Riftbound, "Core Rules: Patch Notes", 2025-10-24. <https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-patch-notes/>
8. Wizards Play Network, "Game Night: Free-for-All and Pioneer Challenger Decks 2022 release October 14", 2022-06-30. <https://wpn.wizards.com/en/news/game-night-free-for-all-pioneer-challenger-decks-2022-release-october-14>
9. Archidekt, "Changelog 0.8.2 Deck Folders", undated (comments shown as "7 years" old). <https://archidekt.com/news/222434>
10. Moxfield feedback board #383, shareable folders and bookmarks as the interim (search summary; the page refused automated reads). <https://moxfield.nolt.io/383>
11. r/Moxfield, "Community folders", 2026-09-16, 3 points, 4 comments. <https://www.reddit.com/r/Moxfield/comments/1whrc2y/>
12. TopDecked MTG, App Store version history: 12.1.0 (2023-11-13) and 13.0.5 (2025-11-13). <https://apps.apple.com/us/app/topdecked-mtg/id1173388234>
13. Tabletop Simulator Knowledge Base, "Save File Format" (`ObjectStates`, `Transform`). <https://kb.tabletopsimulator.com/custom-content/save-file-format/>
14. r/EDH, "Beginner Battle Box - which commanders? (Mono colored)", 2026-02-19, 3 points, 17 comments. <https://www.reddit.com/r/EDH/comments/1r8sxjc/>
15. r/EDH, "Mini-Monocolor Battle-Box - 5x50-card decks", 2025-10-27, 1 point, 3 comments. <https://www.reddit.com/r/EDH/comments/1ohasmq/>
16. r/EDH, "I am planning on making some proxy decks for my friends but I want help getting them to be similar power level and fun", 2026-08-02, 1 point, 11 comments. <https://www.reddit.com/r/EDH/comments/1vdw4qi/>
17. r/EDH, "I got some commander proxy decks with real cards mixed in for a friends MTG get together…", 2025-05-30, 235 points, 475 comments. <https://www.reddit.com/r/EDH/comments/1kz8hz0/>
18. r/EDH, "Commander recommendations to lend to friends playing for the first time?", 2026-01-13, 14 points, 47 comments. <https://www.reddit.com/r/EDH/comments/1qbmzch/>
19. r/EDH, "You should build an EDH Battle Box for your pod!", 2026-10-23, 36 points, 17 comments. <https://www.reddit.com/r/EDH/comments/1xd68g6/>
20. MTG Nexus, "Commander Challenge Runs" (search summary; the page refused automated reads). <https://www.mtgnexus.com/viewtopic.php?p=200446>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

### Goals

- A host builds a set of four of their own decks for newcomers, sees that two seats need the one Cyclonic Rift they own and that seat 3 estimates a bracket above the others, asked as a question, and exports all four decks to Cockatrice in one ZIP, each file identical to that deck's own export; no slice past 0 started before gate A was recorded as met.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-79-01

As a player, I want a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action., so that this initiative's definition of done is met.

#### US-79-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-79-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-79-01 Happy path

Given a signed-in player and the English locale
When a host builds a set of four of their own decks for newcomers, sees that two seats need the one Cyclonic Rift they own and that seat 3 estimates a bracket above the others, asked as a question, and exports all four decks to Cockatrice in one ZIP, each file identical to that deck's own export; no slice past 0 started before gate A was recorded as met.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-79-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-79-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-79-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-79-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-79-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-79-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- https://ringsdb.com/fellowship/view/3786/our-fellowship-for-attack-on-dol-guldur

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-79-101

As a player, I want the product to gate A's measurement: a "table day", a UTC day on which an account exports two or more distinct full-size decks it owns to the same play destination, derived from export_done with a scope field, and owner-view rows (slice 0)., so that a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

#### AC-79-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Gate A's measurement: a "table day", a UTC day on which an account exports two or more distinct full-size decks it owns to the same play destination, derived from export_done with a scope field, and owner-view rows (slice 0). Gate A is met when 30 accounts, and at least 3% of the median week's game-ready builders, record one over eight weeks; both numbers are proposals for D-52.

#### AC-79-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-79-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-79-102

As a player, I want the product to a set of up to four seats holding the author's own Commander decks only (D-89), private by default, with owner-only routes (slice 1); checkTableSet: no commander, partner or Background in two seats by default, distinct identities and a bracket spread as options, and failures that read "set rule", never "illegal" (slice 2); a physical-copy check by card across printings, with basics left out and proxies counted apart (slice 3); a balance view with computed and declared rows apart, spreads worded as questions and no balance score (slice 4)., so that a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

#### AC-79-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A set of up to four seats holding the author's own Commander decks only (D-89), private by default, with owner-only routes (slice 1); checkTableSet: no commander, partner or Background in two seats by default, distinct identities and a bracket spread as options, and failures that read "set rule", never "illegal" (slice 2); a physical-copy check by card across printings, with basics left out and proxies counted apart (slice 3); a balance view with computed and declared rows apart, spreads worded as questions and no balance score (slice 4).

#### AC-79-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-79-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-79-103

As a player, I want the product to link sharing with a 128-bit token, the shared-deck projection and noindex (slice 5); "Export the table": one ZIP of per-seat files, or table text per seat, each byte-identical to that deck's own export (slice 6); per-seat deck check links on one printable page (slice 7); free and lent copies (slice 8); I-77's floors and I-65's speed (slice 9) and I-78's table line (slice 10) as they ship., so that a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

#### AC-79-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Link sharing with a 128-bit token, the shared-deck projection and noindex (slice 5); "Export the table": one ZIP of per-seat files, or table text per seat, each byte-identical to that deck's own export (slice 6); per-seat deck check links on one printable page (slice 7); free and lent copies (slice 8); I-77's floors and I-65's speed (slice 9) and I-78's table line (slice 10) as they ship.

#### AC-79-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-79-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-79-104

As a player, I want the product to after gate B, 50 accounts with a set of two or more full-size decks within 12 weeks of slice 3 and 30 of those sets used: publishing with a profile listing and a seat mention on deck pages (slice 11), "Copy this table" (slice 12), a Tabletop Simulator table save (slice 13) and house rules with set scope from I-53 (slice 14)., so that a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

#### AC-79-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After gate B, 50 accounts with a set of two or more full-size decks within 12 weeks of slice 3 and 30 of those sets used: publishing with a profile listing and a seat mention on deck pages (slice 11), "Copy this table" (slice 12), a Tabletop Simulator table save (slice 13) and house rules with set scope from I-53 (slice 14). Also an I-15 sheet attached to a set (slice 15), "Lend this set" (slice 16), "Check this set's boxes" (slice 17), the balance run as a paid candidate (slice 18) and, at D-89's second stage, a consented seat from another player's deck (slice 19).

#### AC-79-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-79-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

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

## I-79: Table Sets: Decks Built To Play Together

**Spec:** [`specs/i79-table-sets.md`](i79-table-sets.md)

**Outcome:** a player builds, checks and shares two to four Commander decks meant for one table (gift decks, a gauntlet, a loaner box or a pod's agreed set), sees their brackets, routes and table effects side by side, applies rules across the set (no duplicate commander, one physical copy per card), learns which box lends a contended card, publishes and forks the set as one object, and exports the whole table in one action.

**Status:** Later
**Priority:** Later, behind two demand gates proposed for D-52; nothing past slice 0 starts before gate A is met and the owner answers D-89. Building, checking, sharing, publishing and exporting a set are free; a balance run across the set is an I-30 candidate
**Impact / effort:** Medium / medium
**Depends on:** I-39 slices 11 and 12 for gate A's measurement (slice 0); gate A and D-89 for the schema (slice 1); I-50 slices 0, 2 and 8 for the table export (slice 6); I-50 slices 10 and 11 for per-seat check links (slice 7); I-16 slice 4 and I-51 slice 3 for free and lent copies (slice 8); I-77 slice 1 and I-65 slice 4 for floors and speed (slice 9); I-78 slice 1 for the table line (slice 10); gate B for publishing, the Tabletop Simulator save and house rules (slices 11, 13 and 14), with I-50 slice 7 and I-53 slice 1; I-15 slice 1 (slice 15); I-51 slice 5 (slice 16); I-43 slice 7 (slice 17); I-31 slices 5 and 9, I-21 slice 5, gate B and I-30's decision for the balance run (slice 18); D-89's second stage, D-40 and I-15 slice 3 (slice 19).

In Commander the table, not the deck, is the unit of play, and some players build all of it: a host keeps decks for guests who own none, a player gives friends decks that work against each other, a pod agrees on a gauntlet. Today each deck is checked alone, and two decks that need the one Cyclonic Rift meet at the table. `Deck` has one `folderId`, `buildAcquisitionPlan` sums simultaneous requirements by printing, so one printing in two decks shows a shortage when the card is owned in another printing, comparison is pairwise, and export writes one deck (checked on `dev` at `2cf792e8`). Co-operative card games treat a group of decks as one object: RingsDB's "fellowships" of two to four decks are published, commented and opened together at an online table ([fellowship](https://ringsdb.com/fellowship/view/3786/our-fellowship-for-attack-on-dol-guldur), 2017-12-04; 120 pages of listings), Arkham Cards groups decks into campaigns, and Decks of KeyForge sells "Team Decks" for "$5+ a month" (2020-04-09). Commander demand is real but thin: a few r/EDH battle-box and loaner threads of 1 to 36 points, one r/Moxfield request for a community folder (2026-09-16) and one forum thread seen only as a search summary. Hence Later, behind gates measured on the product's own exports. No initiative owns an authored container of decks: [I-15](i15-rule-zero-sheets-and-pod-profiles.md)'s pod gathers four players' own decks under consent, folders are storage, I-55's builds are versions of one deck, I-43 pairs a deck with a box and I-51 lends. A set is not a cube: every seat is a complete deck.

### Scope

- [ ] Gate A's measurement: a "table day", a UTC day on which an account exports two or more distinct full-size decks it owns to the same play destination, derived from `export_done` with a `scope` field, and owner-view rows (slice 0). Gate A is met when 30 accounts, and at least 3% of the median week's game-ready builders, record one over eight weeks; both numbers are proposals for [D-52](../owner-decisions.md#product-scope-and-non-goals).
- [ ] A set of up to four seats holding the author's own Commander decks only ([D-89](../owner-decisions.md#product-scope-and-non-goals)), private by default, with owner-only routes (slice 1); `checkTableSet`: no commander, partner or Background in two seats by default, distinct identities and a bracket spread as options, and failures that read "set rule", never "illegal" (slice 2); a physical-copy check by card across printings, with basics left out and proxies counted apart (slice 3); a balance view with computed and declared rows apart, spreads worded as questions and no balance score (slice 4).
- [ ] Link sharing with a 128-bit token, the shared-deck projection and `noindex` (slice 5); "Export the table": one ZIP of per-seat files, or table text per seat, each byte-identical to that deck's own export (slice 6); per-seat deck check links on one printable page (slice 7); free and lent copies (slice 8); I-77's floors and I-65's speed (slice 9) and [I-78](i78-what-this-deck-does-to-the-table.md)'s table line (slice 10) as they ship.
- [ ] After gate B, 50 accounts with a set of two or more full-size decks within 12 weeks of slice 3 and 30 of those sets used: publishing with a profile listing and a seat mention on deck pages (slice 11), "Copy this table" (slice 12), a Tabletop Simulator table save (slice 13) and house rules with set scope from I-53 (slice 14). Also an I-15 sheet attached to a set (slice 15), "Lend this set" (slice 16), "Check this set's boxes" (slice 17), the balance run as a paid candidate (slice 18) and, at D-89's second stage, a consented seat from another player's deck (slice 19).

### Engineering enablers

- The rule union has an exhaustive `never` guard, and the seat invariant (`deck.userId === set.ownerId`) lives in one write module; another account's deck is refused like a missing one.
- A schema test keeps collection fields out of the shared and public projections, and publishing refuses while a seat deck is private.
- Each seat's export equals the single-deck exporter's byte for byte, and the gate metric counts a deck exported twice once and ignores formats that are not for play.

**Paid-tier angle:** sets, seats, rules, the copy check, the balance view, sharing, publishing, forking and every export are free. The candidate is the balance run: I-31's run on every seat with one seed, each pair of seats compared under Holm's correction. No product read checks balance across decks, and Decks of KeyForge charges "$5+ a month" to form a team. D-89 recommends that the pod pass covers sets.

### Definition of done

A host builds a set of four of their own decks for newcomers, sees that two seats need the one Cyclonic Rift they own and that seat 3 estimates a bracket above the others, asked as a question, and exports all four decks to Cockatrice in one ZIP, each file identical to that deck's own export; no slice past 0 started before gate A was recorded as met.

---

