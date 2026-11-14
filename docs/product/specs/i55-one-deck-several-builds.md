# I-55: One Deck, Several Builds

> **Initiative:** I-55, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 1 to 7 and 9; Later for slices 8 and 10 to 15, each behind the initiative it extends; slice 16 waits for I-30 · **Impact / effort:** High / medium · **Written 2026-11-10**
> **Research:** one dated note, not committed. Every external fact below links its own source in [Sources](#sources). Reddit refused automated reads on 2026-11-10, so no claim here rests on a Reddit thread.
> **Owns:** builds of one deck (named sets of differences from the main build), how a build resolves and when a change conflicts, the build switcher and editing inside a build, the differences panel and swap lists, promoting changes and re-basing, legality, bracket estimate and price per build, the swap kit and switch lists, the rule for counting copies across builds, and which builds public pages and share links show. **Does not own:** snapshots, the change log and history ([I-37](i37-editor-depth.md), [I-07](i07-playtest-and-iteration.md)); the comparison engine, packages, forks and public pages ([I-08](i08-share-compare-and-learn.md)); bracket names and rules ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); rules versions and the impact report ([I-48](i48-official-changes-reach-every-deck.md)); Rule 0 sheets ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); the offline cache ([I-19](i19-offline-game-night-viewing.md)); the game log ([I-35](i35-pod-game-log.md)); the commitment index ([I-16](i16-decks-buildable-from-a-collection.md)); places and pull lists ([I-43](i43-physical-collection-storage-and-pull-lists.md)); export formats ([I-10](i10-interoperability-and-integrations.md), [I-50](i50-play-this-deck-online.md)); the public projection and embeds ([I-36](i36-creator-and-embed-toolkit.md)); precon tiers ([I-17](i17-precon-path-and-tiered-upgrades.md)); patches ([I-20](i20-collaborative-review.md)); the paid tier ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

Players keep several versions of one deck at the same time: a Bracket 2 and a Bracket 3 build, so they can match the table after the Rule 0 talk; a budget and a "bling" build; a paper and an online build; a testing build before they commit a change. Today the only way to do that here, as on Moxfield and Archidekt, is to duplicate the deck. The copies then drift: a card added to one is missing from the other, and nothing shows how far apart they are.

This initiative adds **builds**. A deck has one main build, its own rows as today, and any number of named builds. A build stores only its differences from the main build: cards in, cards out, quantity, printing and command-zone changes. It resolves to a full list by a pure, deterministic function. The player switches builds on the deck page, sees and edits the difference, promotes changes back to the main build, and sees legality and a bracket estimate for each build. When the main build changes, each build follows it, and a change that no longer fits is held and shown, never applied silently. At game night, the Rule 0 sheet, the offline copy and the game log name the build that was played.

Wizards' own bracket announcement asks players to "try and bring decks of a few different brackets" [1]. Builds let one deck box do that with a small swap kit instead of four decks.

**Terms.** "Build" is used on purpose. In [I-31](i31-deck-lab.md) a variant is a simulated swap, and in [I-42](i42-commander-variants-duel-cedh-pauper.md) a variant is a Commander format. A **snapshot** is a point in a deck's past ([I-37](i37-editor-depth.md)); a build lives at the same time as the main build. A **fork** is another owner's copy ([I-08](i08-share-compare-and-learn.md)), and a **duplicate** is an independent deck.

## What the market does

Read on 2026-11-10 unless dated otherwise.

| Product             | Versions of one deck                                                                                                                                                                                                                                                                                       | Bracket per deck                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archidekt**       | "New Deck Version" stores "an archived version of the current state of your deck", named, in date order; a version can be compared with "the current iteration of the deck" or copied into a new deck. No restore and no public view are described (edited 2022-08-02) [2]                                 | One bracket: set by hand in deck settings, or estimated as "1 or 2", "3" or "4 or 5", from Game Changers only (edited 2025-02-14) [3]                 |
| **Moxfield**        | "All card changes to your decks are tracked in your deck's History page"; any deck can be duplicated "to begin brewing your own version"; mainboard, sideboard and maybeboard (wiki, last edited 2020-10-14) [8]. moxfield.com and its feedback board answered HTTP 403                                    | Not readable. Feedback titles seen only in search results ask to exclude the sideboard from the bracket and to auto-optimize for a target bracket [9] |
| **TappedOut**       | Revisions created on every change, which a user can "track/compare"; tracking requires supporter status (2019-06-17) [11]                                                                                                                                                                                  | —                                                                                                                                                     |
| **Deckbox**         | A user keeps owned cards that are not in the 100 in the sideboard and reports that "the bracket calculator seems to include the sideboard" (2025-03-29); no staff answer [10]                                                                                                                              | Yes, with a calculator [10]                                                                                                                           |
| **Table Commander** | Nothing on versions or variants in its deck docs (© 2026) [12]                                                                                                                                                                                                                                             | Estimate for 2–4, manual 1 and 5; "Your manual bracket takes priority over the estimate" [12]                                                         |
| **EDHREC articles** | One commander built for all five brackets as five separate Archidekt lists; Bracket 2 "cut about 20 cards" (2025-09-22) [6]. One precon adapted with a 25-card sideboard and side-in and side-out lists per bracket: Core 11 in, 10 out; Upgraded 10 in, 8 out, a commander swap included (2025-07-07) [7] | —                                                                                                                                                     |

**What players ask for.** On Archidekt's forum, about sixteen months before 2026-11-10, a player described a deck that measures Bracket 3 while the pod plans Bracket 2, and asked to "switch between the variant brackets", with an "Auto Suggest" of cards. The only answer, from a user rather than staff, was "Just use snapshots (under deck history) for this" [5]. Moxfield's board carries titles asking to leave the sideboard out of the bracket calculation and to optimize a deck for a target bracket [9]; their dates and votes could not be read.

**Did anyone ship bracket-specific builds after February 2025?** Not among the pages read. Archidekt's bracket update describes one bracket per deck [3], and its news index from February 2025 to November 2026 lists no versions or variants feature [4]. Table Commander has one bracket per deck [12]. Moxfield could not be read, which is a gap in this research, not evidence of absence.

**The gap.** Players reach parallel builds through four workarounds: duplicate decks, archived versions, sideboard swap lists and separate lists per bracket. Each loses something. Duplicates drift. Archived versions are history, not something to play. Sideboard swap lists collide with bracket calculators that count the sideboard [9][10]. Separate lists say nothing about which cards differ. No product read keeps a shared core, records only the differences, and checks legality and bracket for each build.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **The deck is the only unit.** `Deck` in `prisma/schema.prisma` holds one `targetBracket` (default 3) and one `manualBracket`. No model groups decks or stores a difference between two lists.
- **Duplicate makes an unlinked copy.** `POST /api/decks/[id]/duplicate` creates "`<name> (Copy)`" with the cards but without their notes, the description or the tags, and stores no link to the source. Two builds kept this way drift by construction.
- **Forks record attribution only.** `forkedFromDeckId`, `forkedFromDeckName` and `forkedFromUserName` are set by `src/lib/deck/fork.ts`; the fork route requires a public deck. Nothing follows the source afterwards.
- **Snapshots are points in time.** `DeckSnapshot` stores `name`, `cardList` (the full rows as JSON), `commander` and `cardCount`. `src/app/api/decks/[id]/snapshots/` lists, creates, deletes and restores. Restore replaces the `DeckCard` rows in one transaction and does not touch `Deck.commanderId`, `commanderName` or `partnerId`. `SnapshotsPanel.tsx` shows a card-count badge ("+3 cards"), not which cards differ.
- **A version identity exists.** `src/lib/deck/deck-version.ts` (#1315) treats two lists as the same version when names, quantities, zones and the commander and partner flags match; printing, category, notes and price are presentation. `findSnapshotOfVersion` files each recorded playtest under a snapshot of the list played.
- **A change set exists.** `src/lib/deck/bulk-edit.ts` (#1314) diffs an edited list against the deck by card name and zone into removals, quantity changes, additions and a command-zone edit. `PATCH /api/decks/[id]/cards` applies that set in one `prisma.$transaction` and answers 409 when a row to change is gone. [I-37](i37-editor-depth.md)'s spec, written the day before, still describes bulk edit as lossy.
- **Comparison ignores zones.** `compareDeckCards` in `src/lib/deck/comparison.ts` matches cards by normalised name and has no zone field, so a sideboard copy and a main-deck copy count as one card. `DeckComparisonPanel.tsx` on `/decks` and `PublicDeckComparison.tsx` compare two whole decks in the browser.
- **Packages only add.** The apply route under `src/app/api/community/card-packages/[packageId]/apply/` adds reviewed, still-legal rows. A package cannot remove a card, so a swap package cannot be expressed.
- **Bracket and legality are pure functions on a list.** `scoreBracket(deck, stats, combos)` in `src/lib/deck/bracket.ts`, run in the browser by `useBracketScore`, scores the main zone only; `validateDeck` in `src/lib/deck/validation.ts` checks a whole deck. Both can run on any resolved list.
- **Copies are summed across decks.** `buildAcquisitionPlan` in `src/lib/collection/acquisition-plan.ts` "aggregate[s] simultaneous deck requirements": two duplicated builds of one deck count each shared card twice.
- **Public surfaces use allowlists.** `PUBLIC_DECK_SELECT` and `SHARED_DECK_SELECT` (`src/lib/deck/`) decide what `/deck/[id]` and `/share/[token]` receive.
- **No Oracle identity on deck cards.** `DeckCard` stores `scryfallId` and `name`; [I-37](i37-editor-depth.md) slice 12 adds `oracleId`.

## Functional requirements

### 1. Builds and their change set

1.1 A deck has one **main build**, its own rows as today, and zero or more named builds. A build stores only its differences from the main build.
1.2 A change is one of: add a line (card, zone, quantity, printing), remove a line, change a line's quantity, change a line's printing, or change a command-zone slot (commander, partner, companion). Each change records the main-build value it was made against and the value it sets.
1.3 A line is identified by its zone and its card: the normalised name today, as `deck-version.ts`, `bulk-edit.ts` and `comparison.ts` already use, then the Oracle ID once I-37 slice 12 stores it. A build holds at most one change per line.
1.4 `resolveBuild(main, changes)` is a pure function. It returns the resolved list and a status for every change. The same inputs give the same output, in a stable order: command-zone changes first, then lines by position, then by line key.
1.5 Command-zone changes resolve before lines, so colour identity and legality are checked against the build's own commander. EDHREC's precon example swaps the commander between brackets [7].
1.6 A build shares the deck's format, owner, folder and primer. It has its own name (unique in the deck, 60 characters at most), a short public description, a target bracket, an optional manual bracket, a visibility and a position. A different format is a different deck ([I-42](i42-commander-variants-duel-cedh-pauper.md)).
1.7 Every build is relative to the main build. A build of a build is not supported.
1.8 The number of builds is not a plan limit ([I-30 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). A technical guard of 50 builds per deck and 150 changes per build applies to every account; above it the product suggests a separate deck.

### 2. Creating a build

2.1 From the main build: an empty change set and a name.
2.2 From a snapshot: the difference between the main build and that snapshot.
2.3 From another of the owner's decks with the same format: the difference between the two lists. The source deck is not changed; its snapshots, playtests, comments and ratings stay with it, and the owner may archive it afterwards.
2.4 On request, the deck list finds pairs of the owner's decks with the same commander and format that share at least 80% of their main-deck cards, and offers 2.3. Nothing runs in the background.
2.5 From a pasted or imported list, through I-10's parser, "as a build of this deck".
2.6 By applying an I-08 package to a build instead of the main build: its accepted rows become additions.
2.7 By duplicating a build.

### 3. Seeing and editing a build

3.1 The deck page and the builder show a build switcher: Main first, then each build with its name, estimated bracket, a legality mark and its change count ("6 out, 6 in"). The URL carries `?build=<slug>`. The last build viewed is remembered per deck in the browser, as sort and group are.
3.2 In a build, the editor shows the resolved list. Each changed row carries a text marker (added, quantity, printing, commander), not colour alone. Removed lines sit in a collapsed "Out of this build" group, never hidden.
3.3 While a build is selected, every edit changes that build only. A persistent banner names the build and says so. Editing the main build is a separate, explicit choice.
3.4 Saving a build edit stores the difference between the main build and the list the player now wants, in one transaction, through the change-set code of `bulk-edit.ts`. A change that brings a line back to its main value disappears.
3.5 Bulk edit works on a build: the text is the resolved list, and saving recomputes the build's change set.
3.6 A differences panel groups the changes as Out, In, Quantity, Printing and Command zone, with counts, the dated price difference labelled as an estimate, the Game Changers among the cards in and out, and legality and the bracket estimate before and after.
3.7 The difference can be copied as a swap list (`OUT 1 Rhystic Study` / `IN 1 Mystic Remora`) and downloaded as CSV. The parser in 2.5 reads the same text back.
3.8 Any two builds, or a build and a snapshot, can be compared through I-08's engine. This slice makes the comparison zone-aware, so a card moved to the sideboard is reported as moved.

### 4. Following the main build

4.1 When the main build changes, each build re-resolves on its next read. No job runs.
4.2 Each change gets one status: **applied** when the main build still holds the value the change was made against; **absorbed** when the main build now holds the value the change sets, so it is redundant and is dropped on the build's next save; **held** when the main build holds a third value. A held change is not applied, and its line shows the main value.
4.3 A build with held changes shows "needs review" in the switcher and before any game-night action: a sheet, an offline download, a game log or an export. Its legality and bracket are computed on what it resolves to, and the held lines are named.
4.4 Review offers three choices per held change: keep mine (record it again against the current main value), take main (drop it), or edit. Each review is one transaction. A build edit is refused with 409 while it has held changes, so no save drops a held change silently.
4.5 After a main-build edit, a notice names each build whose legality, bracket estimate or held count moved: "'Table B2' now includes Cyclonic Rift, a Game Changer: estimate 2 → 3."
4.6 Each build records the main version it was last reviewed against, as a snapshot reused through `findSnapshotOfVersion`. "Main changed since your last review" lists those changes through the comparison engine; marking the build reviewed moves the pointer.
4.7 When a build's estimate rises above its target bracket after a main change, the build is flagged. A change to the main build never silently pushes the Bracket 2 build over 2.
4.8 A build write sends the fingerprint of the main build it was computed against: a hash of every main row's zone, roles, name, quantity and printing. A different fingerprint is refused with 409 and a reload prompt.

### 5. Promoting and re-basing

5.1 **Promote** applies selected changes of a build to the main build, through the same transaction code as `PATCH /api/decks/[id]/cards`, and removes them from the build. The build's resolved list does not change.
5.2 Before promotion is confirmed, a preview shows each other build: the lines that change for it, its new estimate and legality, and any change that becomes absorbed or held.
5.3 **Make this the main build** takes an automatic snapshot of the main build, writes the build's resolved list as the main rows, and records the old main as a build named "Previous main". Every other build's changes are recomputed so that its resolved list is identical before and after.
5.4 Restoring a snapshot into the main build shows the preview of 5.2 first.
5.5 Deleting a build deletes its changes only. Archiving hides it from the switcher and keeps it. "Copy to a new deck" makes an independent deck from the resolved list.
5.6 Promotion, make-main and snapshot restore write `Deck.commanderId`, `commanderName` and `partnerId` from the main build's command zone in the same transaction. Build edits never touch them.

### 6. Legality, bracket and price per build

6.1 Each build shows legality (`validateDeck`) and a bracket estimate (`scoreBracket`, then I-48's `assessDeck` once it ships) computed on its resolved list.
6.2 Each build has its own target bracket and manual bracket. The main build keeps `Deck.targetBracket` and `Deck.manualBracket`. Labels and values follow [I-28](i28-commander-deckbuilding-guide-by-bracket.md).
6.3 Sideboard and maybeboard lines never count towards a build's bracket or legality, as `scoreBracket` already ensures for the main zone. A player can keep a swap pool in the sideboard without changing the estimate, which Deckbox and Moxfield users ask for [9][10].
6.4 Each build shows its dated price as an estimate and its difference from the main build.
6.5 The deck list shows a deck once, with its build count and the range of estimated brackets ("3 builds, B2–B4").
6.6 [I-48](i48-official-changes-reach-every-deck.md)'s impact report lists each build separately. Its replacement candidates can be applied into the build that needs them.

### 7. Game night

7.1 A Rule 0 sheet ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)) attaches to a deck and a build. The computed bracket shown beside the declared intent is that build's. A pod sees only the build shared with it.
7.2 The offline download ([I-19](i19-offline-game-night-viewing.md)) takes one build. The cached copy names the build, shows its resolved list and the cached date, and can include the swap kit of 7.4.
7.3 A game seat in [I-35](i35-pod-game-log.md) records the build played, its name at log time and a snapshot of its resolved list, so results split by build.
7.4 The **swap kit** for chosen builds lists the cards to carry beside the main build to play any of them, and a swap sheet per build (out, in) that prints and reads at 390 px width.
7.5 A **switch list** from build A to build B lists the cards to take out and to put in. [I-43](i43-physical-collection-storage-and-pull-lists.md) turns it into pull and put-back lists by place.
7.6 The playtest ([I-07](i07-playtest-and-iteration.md)) deals a build's resolved list, and its sessions are filed under snapshots of that build.
7.7 Exports ([I-10](i10-interoperability-and-integrations.md), [I-50](i50-play-this-deck-online.md)) and `/api/v1/decks/[id]` take a build and export its resolved list.

### 8. Counting copies

8.1 A deck needs, per printing, the largest quantity any of its builds needs, not the sum: one build is assembled at a time. `buildAcquisitionPlan`, I-16's commitment index and I-43's contention count a deck with builds this way. A card in two builds of one deck is one physical copy.
8.2 A build can be marked "assembled separately", for a paper and an online build or two physical decks. Its needs then add to the deck's.
8.3 The swap kit follows 8.1: per card, the largest number of extra copies any chosen build needs.
8.4 Every aggregate counts a deck once, through its main build: community discovery, the sitemap, [I-29](i29-cross-site-deck-index.md)'s index, [I-34](i34-commander-data-reports.md)'s reports and I-35's aggregates. A build is never a separate deck in a statistic.

### 9. Public pages, share links and forks

9.1 A build is private by default, even on a public deck. The owner can show it with the deck.
9.2 A public deck shows its shown builds as tabs on `/deck/[id]?build=<slug>`. The canonical URL stays the deck page, so builds are not separate search pages.
9.3 A share link shows the main build and the shown builds, with the same parameter.
9.4 A shown build exposes its name, description, target bracket, the resolved list through the fields `PUBLIC_DECK_SELECT` allows, and the change markers. It goes through [I-36](i36-creator-and-embed-toolkit.md)'s public projection. Held changes, review state and private notes are never public.
9.5 Forking a public deck forks the build being viewed: its resolved list becomes the fork's main build, and the attribution names the deck and the build.
9.6 Shown builds can be picked in I-08's public comparison.

### 10. What is free and what could be paid

| Part                                                                                                                                                                                   | Free | Paid hypothesis (I-30 decides) | Why                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Builds without a plan limit; creating, editing, differences, swap lists, promotion, review                                                                                             | Yes  | —                              | The player's own data is never the lever (I-30 1.2). A cap sends players back to duplicating decks, which Moxfield and Archidekt allow [2][8], and brings back the drift this initiative removes |
| Legality and bracket estimate per build, the target-bracket flag                                                                                                                       | Yes  | —                              | The bracket check is free under I-30 1.1                                                                                                                                                         |
| Public builds, swap kit, switch lists, game-night hooks                                                                                                                                | Yes  | —                              | Sharing and reading stay free                                                                                                                                                                    |
| **Fit to a bracket:** for a build above its target, deterministic swap candidates for each card that sets the floor, same role, owned copies first, accepted one by one into the build | —    | Paid                           | It computes over the player's deck and collection (I-30 1.3). Asked for on Archidekt's forum [5] and in a Moxfield title [9]. Case unproven: no willingness-to-pay data                          |
| Results by build (I-35), Deck Lab between builds (I-31), the game-night planner with swap kits (I-43)                                                                                  | —    | Within those rows              | Each already has a paid hypothesis; builds add a dimension, not a plan line                                                                                                                      |

10.1 **Is more than one or two builds a credible paid feature? No.** It is a capacity limit on the player's own data, which I-30 1.2 rules out for snapshots and packages, and builds are the same kind of data. It would also make the better workflow cost money while the drifting one, duplication, stays free everywhere.
10.2 **Why free competitors do not offer builds** (inference from their pages, not something they have said): on Moxfield and Archidekt the deck is the unit everything else hangs on, from its history and its one bracket to the decklists EDHREC "pulls" from both sites [3][8][13], so a second list per deck touches each of them; Archidekt's archived versions already answer part of the need, and its forum points players to them [2][5]; and an editor where an edit can land in two places is costly to make clear.
10.3 The fit-to-bracket proposer never uses a language model to choose a card or decide a bracket. It reuses I-48's replacement-candidate rule and shows the query it ran.

## Data model / API

```
DeckBuild        id, deckId, slug, name, description?, position, targetBracket?, manualBracket?,
                 visibility (private | withDeck), assembledSeparately (default false), archivedAt?,
                 reviewedSnapshotId?, createdAt, updatedAt
                 @@unique([deckId, slug]), @@unique([deckId, name]), onDelete Cascade from Deck
DeckBuildChange  id, buildId, position, kind (add | remove | quantity | printing | commandSlot),
                 lineKey, zone?, slot?, cardName, expected Json?, value Json?, createdAt
                 @@unique([buildId, lineKey]), onDelete Cascade from DeckBuild
DeckSnapshot     + buildId?   -- null: the main build
```

- An `add` change stores the card row in `value`, read back through the same validator as `restoredDeckCards`, so a build resolves without a Scryfall call.
- `GET|POST /api/decks/[id]/builds`; `GET|PATCH|DELETE /api/decks/[id]/builds/[buildId]`. PATCH takes the change-set shape of `PATCH /api/decks/[id]/cards` and the main fingerprint (4.8).
- `POST /api/decks/[id]/builds/[buildId]/review`, `/promote` (with `preview: true` for 5.2) and `/make-main`.
- `GET /api/decks/[id]/builds/[buildId]/swap-list?format=text|csv`; `GET /api/decks/[id]/swap-kit?builds=a,b`.
- `GET /api/deck/[id]?build=`, `GET /api/share/[token]?build=` and `GET /api/v1/decks/[id]?build=` return a shown build's resolved list through the existing allowlists.
- All routes are owner-scoped like `snapshots`, except the public reads of shown builds.

## Non-goals

- **Keeping separate decks in sync.** Duplicates stay independent; builds are the answer to drift.
- **Builds of builds and merging two builds.** One level, always relative to the main build.
- **A build in another format.** That is a separate deck under I-42.
- **History of builds.** Build edits go into I-37's change log with the build named; I-37 owns history.
- **Live co-editing of a build.** An I-20 patch may later target a build; I-20 owns patches.
- **Builds for guest decks.** A guest has one local deck; builds need an account.
- **A language model choosing swaps or a bracket** ([strategic boundaries](../roadmap.md#strategic-boundaries)).
- **Indexable pages per build, or builds counted in any statistic as decks.**
- **Swap packages in the community library.** Packages stay add-only under I-08 until that initiative decides otherwise.

## Testing strategy

Each slice opens with its focused Red test, per [`tdd-with-ai.md`](../../engineering/tdd-with-ai.md).

- **Resolver (solitary):** table-driven fixtures for each change kind and each status; command zone before lines; colour identity against a swapped commander; the same inputs give byte-identical output; diff then resolve returns the wanted list; a seeded sequence of 1,000 random main and build edits keeps every invariant, with no new dependency.
- **Re-base invariant (solitary):** after make-main and after promotion, every build's resolved list is unchanged.
- **Routes (sociable, PostgreSQL):** each write is one transaction and an injected failure leaves deck and builds unchanged; a stale fingerprint returns 409; an edit with held changes returns 409; another user's deck returns 404; snapshot restore and promotion update `commanderName`.
- **Counting (solitary):** `buildAcquisitionPlan` with a deck of three builds counts the maximum, and the sum when a build is assembled separately; a shared card is one copy.
- **Public surfaces (sociable):** private builds, held changes and notes never appear in `/api/deck/[id]` or `/api/share/[token]`; the field snapshot test of I-36 covers builds; the canonical link points at the deck.
- **Aggregates:** discovery and the sitemap list a deck with builds once.
- **E2E (Docker-backed Playwright):** create a Bracket 2 build from a Bracket 3 deck, swap two Game Changers, see both estimates; add a Game Changer to main and see the Bracket 2 build flagged; promote one change; switch builds at 390 px; keyboard-only path through the switcher and the review.

## Delivery slices

| #   | Slice                                                                                                                         | Depends on                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `resolveBuild` and the diff to a normalised change set, as pure modules with fixtures; statuses; command zone first           | —                                              |
| 2   | Schema and owner routes; create from main, snapshot or pasted list; main fingerprint and 409                                  | 1                                              |
| 3   | Build switcher, editing in a build, change markers, "Out of this build", bulk edit on a build                                 | 2                                              |
| 4   | Differences panel, swap list as text and CSV, zone-aware comparison of builds and snapshots                                   | 2                                              |
| 5   | Legality, bracket estimate, target and manual bracket and price per build; build count and bracket range in the deck list     | 3                                              |
| 6   | Held and absorbed in the interface, review route, the 409 on edits with held changes, the after-save notice, reviewed pointer | 3, 5                                           |
| 7   | Promotion with the preview of other builds; make-main with its invariant; the preview before snapshot restore                 | 6                                              |
| 8   | Create a build from another owned deck; the near-duplicate suggestion                                                         | 2, 4                                           |
| 9   | Copies counted as the maximum over builds in `buildAcquisitionPlan`; "assembled separately"                                   | 2; I-16 slice 4 and I-43 slice 7 read the rule |
| 10  | Playtest a build; sessions filed under that build's snapshots                                                                 | 2                                              |
| 11  | Shown builds on public and share pages, the canonical link, forking a build, builds in the public comparison                  | 5; I-36 slice 1                                |
| 12  | Swap kit, swap sheets and switch lists                                                                                        | 4; I-43 slice 5 for lists by place             |
| 13  | Rule 0 sheet per build, offline download of a build, build on a game seat                                                     | 5; I-15 slice 2, I-19 slice 2, I-35 slice 2    |
| 14  | I-48 report per build; replacement candidates applied into a build                                                            | 5; I-48 slices 5 and 7                         |
| 15  | Package applied into a build; an I-17 upgrade tier applied as a build                                                         | 3; I-17 slice 3 for tiers                      |
| 16  | Paid candidate: fit to a bracket                                                                                              | 5; I-48 slice 7; I-30 slice 0                  |

Slices 1 to 7 deliver the core: builds that share a core, an honest difference, and a bracket per build. Slice 9 keeps the shipped acquisition plan right once builds exist. The other slices each wait for the initiative they extend.

## Open questions

- **Does a held change default to the main build or to the build?** Proposed: the main build wins and the build is marked for review, so a bracket check never relies on a change that no longer fits. The other choice keeps a build closer to what the player last saw but can apply a change to a card the main build no longer has.
- **May a build change the commander?** Proposed yes, as EDHREC's precon example does [7], with the deck still counted under the main build's commander in every aggregate. The other choice says a different commander is a different deck.
- **The French word.** "Variante" collides with I-42's Commander variants. "Version" collides with snapshots. The translator and the owner choose, for example "configuration".
- **The technical guard (1.8).** Are 50 builds and 150 changes per build acceptable under I-30 1.2, or should the guard be higher?
- **The near-duplicate threshold (2.4).** Is 80% of main-deck cards the right line? Measure on real decks once slice 8 ships.
- **Moxfield's current behaviour.** Its site and feedback board refused automated reads. A person should check in a normal browser whether Moxfield now offers anything like builds, including in the editor redesign [I-37](i37-editor-depth.md) records, before slice 3 starts.

## Sources

Read on 2026-11-10 unless stated otherwise.

1. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11: "Rule Zero still exists", "try and bring decks of a few different brackets". https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
2. Archidekt, "Development Update - Deck Versions and Comparisons", last edited 2022-08-02. https://archidekt.com/news/3047466
3. Archidekt, "Development Update - Commander Brackets", edited 2025-02-14. https://archidekt.com/news/11356226
4. Archidekt, news index, pages 1 to 3, covering October 2023 to November 2026. https://archidekt.com/news, https://archidekt.com/news?page=2, https://archidekt.com/news?page=3
5. Archidekt forum, "Bracket Variant Feature", shown as about 16 months old on 2026-11-10, with one user reply. https://archidekt.com/forum/thread/14634208
6. Cooper Gottfried, "EDHREC Guide to Commander Brackets", EDHREC, 2025-09-22. https://edhrec.com/articles/edhrec-guide-to-commander-brackets
7. John Sherwood, "Adapting the Abzan Armor Precon for Different Commander Brackets", EDHREC, 2025-07-07. https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets
8. Moxfield, Features wiki, last edited 2020-10-14. https://github.com/moxfield/moxfield-public/wiki/Features
9. Moxfield feedback board, titles seen in search results only; each page answered HTTP 403, so dates and votes are unknown: "Add option to exclude sideboard from 'Commander Brackets' calculation" (https://moxfield.nolt.io/1846), "Auto-Optimize Deck for Target Bracket" (https://moxfield.nolt.io/1847).
10. Deckbox forum, "Commander Brackets, new filter: Tutors, Land Denial, card Archetypes", post of 2025-03-29. https://deckbox.org/forum/viewtopic.php?id=32350
11. TappedOut forum, "Track Deck Changes / Versioning", 2019-06-17. https://tappedout.net/mtg-forum/tappedout/track-deck-changes-versioning/
12. Table Commander, "Bracket Estimates" documentation, © 2026. https://tablecommander.com/docs/decks/brackets
13. EDHREC, About us, undated: "EDHREC pulls decklists from:" Archidekt and Moxfield. https://edhrec.com/about-us

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

### Goals

- A player creates a Bracket 2 build from a Bracket 3 deck, swaps two Game Changers and sees both estimates; adding a Game Changer to the main list flags the Bracket 2 build instead of changing it silently; promoting one change leaves every build's list as it was; and the acquisition plan counts a card shared by the builds once.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-55-01

As a player with a Bracket 2 night and a Bracket 3 night, I want both lists on one deck, so that I am not maintaining two decks that drifted.

#### US-55-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-55-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-55-01 Happy path

Given a signed-in player and the English locale
When a build is a diff from the main list.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-55-02 Happy path

Given a signed-in player and the English locale
When each build has its own legality and bracket estimate.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-55-03 Happy path

Given a signed-in player and the English locale
When copies are counted once across builds in the acquisition plan.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-55-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-55-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-55-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests have one list. No flag. Public builds, if any, wait on the same projection rules as I-08.

#### AC-55-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-55-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-55-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The build switcher is in the deck header. Promoting a build to main shows the diff and can be undone. A Considering card can be marked as the intended replacement for a main-deck card. That link is the open question below, not a second versioning system.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Builds store added and removed printings against the main list. Restore writes the commander fields in the same transaction as the cards.

### Analytics and telemetry

`build_promoted {cards_changed: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests have one list. No flag. Public builds, if any, wait on the same projection rules as I-08.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A comment on Moxfield feedback 1440, read 2026-11-11, asks to keep a card and name its replacement. Whether that is a field on a build or only a Considering note is open. It does not become a new initiative.

### Sources

- https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
- https://archidekt.com/news/3047466
- https://edhrec.com/articles/edhrec-guide-to-commander-brackets
- https://archidekt.com/forum/thread/14634208

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-55-101

As a player, I want the product to resolveBuild and the diff to a normalised change set, as pure modules with fixtures, command zone first (slice 1)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then resolveBuild and the diff to a normalised change set, as pure modules with fixtures, command zone first (slice 1). The pieces exist: src/lib/deck/bulk-edit.ts (#1314) diffs a list into a change set that PATCH /api/decks/[id]/cards applies in one transaction, and src/lib/deck/deck-version.ts (#1315) says when two lists are the same version.

#### AC-55-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-102

As a player, I want the product to deckBuild and DeckBuildChange with owner routes; a build created from the main list, a snapshot or a pasted list; and a fingerprint of the main list, with 409 on a stale write (slice 2)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: DeckBuild and DeckBuildChange with owner routes; a build created from the main list, a snapshot or a pasted list; and a fingerprint of the main list, with 409 on a stale write (slice 2). Today POST /api/decks/[id]/duplicate makes an unlinked copy, and Deck holds one targetBracket and one manualBracket (prisma/schema.prisma).

#### AC-55-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-55-103

As a player, I want the product to a build switcher, editing inside a build with text markers on changed rows, an "Out of this build" group, and bulk edit on a build (slice 3)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A build switcher, editing inside a build with text markers on changed rows, an "Out of this build" group, and bulk edit on a build (slice 3).

#### AC-55-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-104

As a player, I want the product to a differences panel, a swap list as text and CSV, and a zone-aware comparison of builds and snapshots (slice 4)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A differences panel, a swap list as text and CSV, and a zone-aware comparison of builds and snapshots (slice 4). Today compareDeckCards (src/lib/deck/comparison.ts) matches cards by name with no zone, so a sideboard copy and a main-deck copy count as one card.

#### AC-55-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-105

As a player, I want the product to legality, a bracket estimate, a target bracket and a price per build, and the build count and bracket range in the deck list (slice 5)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Legality, a bracket estimate, a target bracket and a price per build, and the build count and bracket range in the deck list (slice 5).

#### AC-55-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-114 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-55-106

As a player, I want the product to changes held or absorbed when the main list moves, a review with three choices, a 409 on edits while changes are held, and a notice naming each build whose legality or estimate moved (slice 6)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Changes held or absorbed when the main list moves, a review with three choices, a 409 on edits while changes are held, and a notice naming each build whose legality or estimate moved (slice 6).

#### AC-55-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-107

As a player, I want the product to promotion to the main build with a preview of every other build, "Make this the main build" with its invariant, and the same preview before a snapshot restore (slice 7)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Promotion to the main build with a preview of every other build, "Make this the main build" with its invariant, and the same preview before a snapshot restore (slice 7). Snapshot restore today leaves the deck's commander fields as they were; the item is under I-37.

#### AC-55-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-108

As a player, I want the product to copies counted as the largest need across a deck's builds, not their sum, in buildAcquisitionPlan (src/lib/collection/acquisition-plan.ts), with an "assembled separately" switch (slice 9)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Copies counted as the largest need across a deck's builds, not their sum, in buildAcquisitionPlan (src/lib/collection/acquisition-plan.ts), with an "assembled separately" switch (slice 9). Today the plan sums decks, so two duplicated builds count each shared card twice.

#### AC-55-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-109

As a player, I want **Make this deck cheaper (gap sweep, 2026-11-10),** with I-14 and I-59., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Make this deck cheaper (gap sweep, 2026-11-10),** with I-14 and I-59. EDHREC publishes budget and expensive average-deck variants per commander (URL pattern …/average-decks/<commander>/…/expensive, seen in search results on 2026-11-10).

#### AC-55-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-126 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-55-110

As a player, I want the product to later: a build from another owned deck and a near-duplicate suggestion (slice 8); a playtest of a build (slice 10); shown builds on public and share pages, forks of a build and builds in the public comparison (slice 11); the swap kit and switch lists (slice 12); a Rule 0 sheet, an offline download and a game seat per build (slice 13); I-48's report per build (slice 14); and packages and I-17 upgrade tiers applied as a build (slice 15)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-127 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Later: a build from another owned deck and a near-duplicate suggestion (slice 8); a playtest of a build (slice 10); shown builds on public and share pages, forks of a build and builds in the public comparison (slice 11); the swap kit and switch lists (slice 12); a Rule 0 sheet, an offline download and a game seat per build (slice 13); I-48's report per build (slice 14); and packages and I-17 upgrade tiers applied as a build (slice 15).

#### AC-55-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-55-111

As a player, I want the product to after I-30's decision: fit a build to its target bracket with deterministic swap candidates (slice 16)., so that a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

#### AC-55-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After I-30's decision: fit a build to its target bracket with deterministic swap candidates (slice 16).

#### AC-55-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-55-132 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

| State            | What the player sees                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | A sentence that names what is missing and the next action. No invented row, author, price or score.                                                   |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                                        |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                                       |
| Partial          | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished.                                                 |
| Stale            | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed.                                             |
| Guest            | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401.               |
| Signed-in        | Writes go to that account only. Another player's notes, budget and collection are not in the response.                                                |
| English          | New controls use the `en` catalogue.                                                                                                                  |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                                         |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard         | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes.                         |
| Screen reader    | Each new control has an accessible name. A status change is announced in words, not only by colour.                                                   |
| Colour           | A warning and an error differ by text or icon as well as hue, in both themes.                                                                         |
| Success          | The completed action is confirmed in words. A second identical action does not duplicate the write.                                                   |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-55: One Deck, Several Builds

**Spec:** [`specs/i55-one-deck-several-builds.md`](i55-one-deck-several-builds.md)

**Outcome:** a player keeps several builds of one deck, such as a Bracket 2 and a Bracket 3 version or a budget and a "bling" version, as named differences from one main list. Each build shows its legality, bracket estimate and price; a change to the main list never lands silently in a build; and a swap kit says which cards to carry to play any of them.

**Status:** Next
**Priority:** Next for slices 1 to 7 and 9; Later for slices 8 and 10 to 15, each behind the initiative it extends; slice 16 waits for I-30
**Impact / effort:** High / medium
**Depends on:** nothing outside this initiative for slices 1–7 and 9; I-36 slice 1 for public builds; I-43 slice 5 for switch lists by place; I-15 slice 2, I-19 slice 2 and I-35 slice 2 for game night; I-48 slices 5 and 7 for the report per build; I-17 slice 3 for upgrade tiers; I-30 slice 0 for the fit-to-bracket candidate.

Players keep several versions of one deck at the same time, and Wizards' bracket announcement asks them to "try and bring decks of a few different brackets" ([2025-02-11](https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta)). Here, as on Moxfield and Archidekt, the only way today is to duplicate the deck, and the copies drift. Players reach parallel builds through four workarounds, and each loses something. Duplicates drift. Archidekt's archived versions are history, not something to play ([2022-08-02](https://archidekt.com/news/3047466)). Sideboard swap lists collide with bracket calculators that count the sideboard. Separate lists per bracket, as in EDHREC's guide that builds one commander five times ([2025-09-22](https://edhrec.com/articles/edhrec-guide-to-commander-brackets)), say nothing about which cards differ. On Archidekt's forum a player asked to "switch between the variant brackets" and was told to use snapshots ([thread](https://archidekt.com/forum/thread/14634208)). No product read keeps a shared core, records only the differences, and checks legality and bracket for each build; Moxfield could not be read. "Build" is chosen on purpose: a variant is a simulated swap in I-31 and a Commander format in I-42, and a snapshot is a point in a deck's past.

### Scope

- [ ] `resolveBuild` and the diff to a normalised change set, as pure modules with fixtures, command zone first (slice 1). The pieces exist: `src/lib/deck/bulk-edit.ts` (#1314) diffs a list into a change set that `PATCH /api/decks/[id]/cards` applies in one transaction, and `src/lib/deck/deck-version.ts` (#1315) says when two lists are the same version.
- [ ] `DeckBuild` and `DeckBuildChange` with owner routes; a build created from the main list, a snapshot or a pasted list; and a fingerprint of the main list, with 409 on a stale write (slice 2). Today `POST /api/decks/[id]/duplicate` makes an unlinked copy, and `Deck` holds one `targetBracket` and one `manualBracket` (`prisma/schema.prisma`).
- [ ] A build switcher, editing inside a build with text markers on changed rows, an "Out of this build" group, and bulk edit on a build (slice 3).
- [ ] A differences panel, a swap list as text and CSV, and a zone-aware comparison of builds and snapshots (slice 4). Today `compareDeckCards` (`src/lib/deck/comparison.ts`) matches cards by name with no zone, so a sideboard copy and a main-deck copy count as one card.
- [ ] Legality, a bracket estimate, a target bracket and a price per build, and the build count and bracket range in the deck list (slice 5).
- [ ] Changes held or absorbed when the main list moves, a review with three choices, a 409 on edits while changes are held, and a notice naming each build whose legality or estimate moved (slice 6).
- [ ] Promotion to the main build with a preview of every other build, "Make this the main build" with its invariant, and the same preview before a snapshot restore (slice 7). Snapshot restore today leaves the deck's commander fields as they were; the item is under I-37.
- [ ] Copies counted as the largest need across a deck's builds, not their sum, in `buildAcquisitionPlan` (`src/lib/collection/acquisition-plan.ts`), with an "assembled separately" switch (slice 9). Today the plan sums decks, so two duplicated builds count each shared card twice.
- [ ] **Make this deck cheaper (gap sweep, 2026-11-10),** with [I-14](i14-verifiable-natural-language-search.md) and [I-59](i59-prices-over-time-and-alerts.md). EDHREC publishes budget and expensive average-deck variants per commander (URL pattern `…/average-decks/<commander>/…/expensive`, seen in search results on 2026-11-10).
  - [ ] For a target total, list each card above a per-card threshold with I-14's visible `otag:` similar-card query, filtered to cheaper cards with dated prices. No model chooses. Done means: every swap row shows its query, price date and legality.
  - [ ] Apply the chosen swaps into a new build. Done means: the build's diff against the main list is reversible, and its bracket estimate is shown beside the main list's.
- [ ] Later: a build from another owned deck and a near-duplicate suggestion (slice 8); a playtest of a build (slice 10); shown builds on public and share pages, forks of a build and builds in the public comparison (slice 11); the swap kit and switch lists (slice 12); a Rule 0 sheet, an offline download and a game seat per build (slice 13); I-48's report per build (slice 14); and packages and I-17 upgrade tiers applied as a build (slice 15).
- [ ] After I-30's decision: fit a build to its target bracket with deterministic swap candidates (slice 16).

### Engineering enablers

- A seeded sequence of 1,000 random main and build edits keeps every invariant, and the same inputs give byte-identical resolved lists.
- After a promotion or "Make this the main build", every build's resolved list is unchanged.
- Private builds, held changes and notes never appear in `/api/deck/[id]` or `/api/share/[token]`, and a deck with builds appears once in discovery and in the sitemap.
- Each write is one transaction, and an injected failure leaves the deck and its builds unchanged.

**Paid-tier angle:** builds without a plan limit, every way of creating, editing, comparing, promoting and reviewing them, legality and bracket per build, public builds and the game-night aids stay free. A limit on builds would be a capacity limit on the player's own data, which I-30 requirement 1.2 rules out, and it would make duplication, which every rival allows free, the cheaper workflow. The one candidate is a deterministic proposer that fits a build to its target bracket, reusing I-48's replacement rule. Players have asked for it, but no willingness-to-pay data exists.

### Enrichment (2026-11-11)

**User story.** As a player with a Bracket 2 night and a Bracket 3 night, I want both lists on one deck, so that I am not maintaining two decks that drifted.

**Acceptance.**

- A build is a diff from the main list.
- Each build has its own legality and bracket estimate.
- Copies are counted once across builds in the acquisition plan.

**UX.** The build switcher is in the deck header. Promoting a build to main shows the diff and can be undone. A Considering card can be marked as the intended replacement for a main-deck card. That link is the open question below, not a second versioning system.

**Data and API.** Builds store added and removed printings against the main list. Restore writes the commander fields in the same transaction as the cards.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `build_promoted {cards_changed: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests have one list. No flag. Public builds, if any, wait on the same projection rules as I-08.

**Open questions.** A comment on Moxfield feedback 1440, read 2026-11-11, asks to keep a card and name its replacement. Whether that is a field on a build or only a Considering note is open. It does not become a new initiative.

### Fourteenth pass (2026-11-14)

EDHcheck's Budget Alternatives, 8 November 2026, read 2026-11-14, finds up to six cheaper cards that share Scryfall Tagger tags, stay inside the original card's colour identity and Commander legality, and cost at most 40 percent of the original, at least 2 USD less and no more than 10 USD. Prices are the cheapest paper printing, refreshed every week. Searching one card priced at 3 USD or more is free. Pasting a deck and summing the cheapest swap is Pro ([article](https://edhcheck.com/updates/budget-alternatives/)). The cheaper-card scope line above already requires I-14's visible `otag:` query, a dated price and legality, and forbids a model. This pass adds the failure cases. It does not adopt the 40 percent, 2 USD or 10 USD caps.

#### US-55-14-01

As a player who wants a cheaper build, I want each suggested swap to show the tag query, the price, the price date and the legality, so that I can see why the card was offered and refuse it.

#### US-55-14-02

As a player, I want the swaps I accept to become a build, so that the main list does not change until I promote that build.

**Passing.** A card above the player's threshold produces rows. Each row shows the `otag:` query, the amount, the currency, the date and whether the card is legal in the commander's identity. The player accepts two rows. A new build's diff is those two swaps. The main list is unchanged. The build's bracket estimate sits beside the main list's. The whole list for one deck is free, because building is free under I-30 requirement 1.1. EDHcheck charges Pro for the deck paste. That is their line.

**Non-passing.** A row with a price and no query. A row whose price has no date. A sum labelled "you save" that hides the rows. A swap applied to the main list instead of a build. A model choosing the card. Copying 40 percent, 2 USD or 10 USD into the code without the owner writing them down as this product's rule. Treating EDHcheck's weekly refresh as our price date. I-59 owns the date.

**Acceptance.** The scope line's "done means" stays: every swap row shows its query, price date and legality. The sum, if shown, is the sum of the rows the player ticked, and it says how many rows have no price. An unticked row changes nothing.

**Open question.** Should the panel offer EDHcheck's three caps as optional filters the player can turn on, still showing every row that the query returned, or show the query's full cheaper list and let the player sort by price? Recommended: no hidden cap. A filter the player sets may hide rows, and the hidden count is on screen.

### Definition of done

A player creates a Bracket 2 build from a Bracket 3 deck, swaps two Game Changers and sees both estimates; adding a Game Changer to the main list flags the Bracket 2 build instead of changing it silently; promoting one change leaves every build's list as it was; and the acquisition plan counts a card shared by the builds once.

---
