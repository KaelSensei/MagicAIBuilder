# I-37: Editor Depth Against Moxfield And Archidekt

> **Initiative:** I-37, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next; Later for slice 24, card-link completion, which waits for I-36's card links (split 2026-11-10) · **Written 2026-11-09**
> **Owns:** editor views (Stacks, Table, Text), collapsible and sticky groups, custom categories, deck, global and function tags, main-deck multi-select, in-place text bulk edit, quick add, the cross-deck clipboard, automatic change history, the card panel, statistics that filter the deck, the mobile editing toolbar, the shortcut registry, the primer editor's layout, and finish, language and date added on deck cards.
> **Does not own:** zones, persistence and failed-save recovery ([I-01](../roadmap.md#i-01-deck-editor-workflow)); tokens, registers and acceptance thresholds ([I-13](i13-visual-direction.md)); format grammars and round-trip fixtures ([I-10](i10-interoperability-and-integrations.md)); printing-level ownership and vendor prices ([I-06](i06-collection-and-purchase-planning.md), [I-32](i32-seller-handoff-and-affiliate-carts.md)); share pages, comparison and primers ([I-08](i08-share-compare-and-learn.md)); the playtester ([I-07](i07-playtest-and-iteration.md)); embeds ([I-36](i36-creator-and-embed-toolkit.md)); patches ([I-20](i20-collaborative-review.md)); new analyses ([I-03](i03-trustworthy-deck-feedback.md), [I-31](i31-deck-lab.md)); the paid tier ([I-30](i30-business-model-and-paid-tier.md)).
> **Research:** dated notes of 2026-11-09 on editor feature depth and player demand. They are not committed, so every external fact cites a numbered entry in **Sources**. Moxfield's rows rest on weak sources; see the warning below the table. _Corrected 2026-11-11:_ Moxfield's production JavaScript, referenced by the 2026-05-14 Wayback capture of its packages help page, is a primary source [29][30]. It shows co-authors, packages, a hypergeometric calculator, pinned decks, deleted-deck restore, notification preferences, Signature Spell slots, and Attraction, Sticker and Contraption boards. It proves a feature was built by May 2026, not where it appears today.

## Overview

The owner's goal, stated on 2026-11-09 and translated from French: "software more beautiful and more complete than Moxfield". I-01 made editing safe: zones, recovery and undo across failures. I-13 chose the visual direction and its thresholds. Neither specifies the editing depth players compare between sites: views, categories and tags, text bulk editing, history, a mobile toolbar.

The incumbents keep moving. Archidekt's news posts show editor changes in January, March, May and July 2026 and a playtester change around September [1–5]. Moxfield previewed an editor redesign to Patreon members on 2026-09-28 [14].

This spec lists each gap, who has it, where the code stands and which slice closes it. It defines "beautiful" in measured terms so a slice can be accepted or refused. The order puts cheap visual wins with no schema change first, then the model changes (history, finish and language, tags) that unlock bulk edit, I-06, I-10, I-20 and I-32.

## What the market does

Read on 2026-11-09. Archidekt's news posts show relative dates, so each row cites the post's "edited" timestamp.

| Capability                 | Moxfield                                                                                                                                       | Archidekt                                                                                                                                                  | Others                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Views                      | Text or images [10]; Table View, Visual Grid and Visual Stack named in 2021 [11]                                                               | Stacks (default), Text, Grid, Table, with image size and margin settings [9]                                                                               | EDHREC galleries: Stats, Table, Text, Images (2026-10-13) [21]                         |
| Collapsible, sticky groups | Not established                                                                                                                                | Per-category collapse, collapse-all for the session, sticky headings "especially on mobile" (2026-01-21) [1]                                               | —                                                                                      |
| Pinned card panel          | Not established                                                                                                                                | "Static card", desktop only: a large preview that follows hover, with printing, category and colour-tag controls, in every view (2026-03-06) [2]           | —                                                                                      |
| Card element toggles       | Not established                                                                                                                                | Each card UI element can be hidden; images can be replaced by a text card (2026-03-06) [2]                                                                 | —                                                                                      |
| Categories and tags        | Deck tags and global tags that follow a card into every deck, `#tag` and `#!globaltag` [10][11]; tag renaming and batch tagging requested [13] | Primary and secondary categories, colour tags [2]                                                                                                          | Paid "advanced tagging" (TopDecked) and "unlimited inventory tags" (Deckbox) [24]      |
| Function tags              | Not established                                                                                                                                | A Scryfall Tagger tag applied as a main or secondary category; tags shown on each card and clickable (2026-07-27) [4]                                      | BlueprintMTG: full Tagger hierarchy [16]; MoxTags extension adds tags to Moxfield [17] |
| Multi-select, bulk         | Batch selection requested [13]                                                                                                                 | Ctrl-click or long-press, Ctrl+A (2024-09-23) [7][8]                                                                                                       | —                                                                                      |
| Text bulk edit             | Whole-deck text editor: `1 Name (SET) number *F* *A* #tag #!globaltag`; tags cannot be removed there [10][11]                                  | Edit as text in the import screen; "Syntax Add" [8][9]                                                                                                     | —                                                                                      |
| Quick add                  | Search, then Enter [11]                                                                                                                        | Typed "Quick add" lines with a keep-open toggle, also in the mobile toolbar (2026-05-15) [3][8]                                                            | —                                                                                      |
| Cross-deck clipboard       | Not established                                                                                                                                | Up to 150 pinned cards on every device, with notes, filters, drag into a deck, "create deck from pins" (2025-11-20) [6]                                    | EDHREC clipboard exports to Archidekt or text [21]                                     |
| Change history             | Automatic History page, "all card changes are tracked", free [10]; a history compare view (search snippet) [12]                                | Records changes so a user can return to earlier versions [9]                                                                                               | TappedOut sells revision tracking [15]; BlueprintMTG reverts individual changes [16]   |
| Interactive statistics     | Not established                                                                                                                                | Clicking a statistic focuses those cards, Ctrl-click selects them, stats can be pinned beside the deck (2024-09-23) [7]                                    | —                                                                                      |
| Mobile editing             | Browser and installable web app (vendor) [20]                                                                                                  | Bottom toolbar: Search, Quick add, Layout, Undo, More; Layout drawer holds view, group, sort, price sources and filter; empty-deck prompt (2026-05-15) [3] | —                                                                                      |
| Shortcuts                  | `/` then ↓ and Enter [11]; quantity and sideboard keys on a help page (search snippet) [12]                                                    | Ctrl+Enter, Esc, Ctrl+', Ctrl+., Ctrl+A [8]; W pins the hovered card [6]; Shift+/ lists keys [2]                                                           | —                                                                                      |
| Finish on a deck card      | `*F*` foil and `*A*` alter flags in bulk edit [11]                                                                                             | Price overlay optimizes printings "by cost, foiling and fanciness" (2026-07-27) [4]                                                                        | —                                                                                      |
| In-deck marker in search   | Not established                                                                                                                                | "Already in deck" and "in deck with another printing" (2026-03-06) [2]                                                                                     | —                                                                                      |

**Sourcing warning.** moxfield.com answered HTTP 403 to automated reads. Moxfield's rows come from its GitHub wiki (last edited 2020-10-14), a 2021 community primer, search-engine snippets of its help pages and an undated feedback board. Its 2026-09-28 editor redesign [14] was not read. A person checks moxfield.com in a normal browser before any slice whose only reference is Moxfield starts. Vendor reviews [20] are written by competitors.

**What players say.** Speed and readability decide between the two incumbents: "Archidekt for deckbuilding, moxfield for a list of cards in a deck" (44 points, June 2026) and "I find Archidekt so hard to read when opening it and a bit overwhelming / disorganized" (30, October 2026) [18]. Redesigns that bury power-user controls are punished: under EDHREC's October 2026 redesign, "I think its trash and is worse for building decks" (394) and "the new UI makes all of that more of a pain to get to" about filtering and sorting (70) [19]. Function tags are asked for by name: Tagger tips reached 425 points (June 2025) and 246 (October 2026), and the MoxTags extension 50 and 84 (2026) [17]. BlueprintMTG's launch posts, whose features include tagging and per-change history with individual revert, reached 742 and 585 points in July and August 2026 [16]. Archidekt's founder wanted "the feel of laying out your cards on a playmat" [22].

**Where MagicAIBuilder is level or ahead** (do not reopen; `/api/og` is not on this list because [I-36](i36-creator-and-embed-toolkit.md) found it unreferenced and willing to render any text): cross-zone drag with keyboard and touch alternatives (#1264); zone and undo recovery (I-01); packages with a legality preview; owned and public comparison with explanations (I-08); export breadth and the import preview (I-10); six-axis bracket reasoning (I-03); the checked AI copilot (I-02); playtest evidence and, since #1301, the official London and free multiplayer mulligan (I-07); the cross-deck acquisition plan (I-06); `/api/v1`; and no advertising (no ad code in `src`), where Archidekt sells ad removal on Patreon [8] and Moxfield's mobile ads drew complaints in August 2026 [18].

## Current state in this codebase

Verified on `dev` on 2026-11-09, at commit `49983a9`:

- **Views.** `deckViewMode` is `"grid" | "list"` in `src/lib/deck/store.ts`, defaulting to an ungrouped grid of six columns (`MainZoneContent.tsx`). View and density reset on reload; only sort and group persist, in `localStorage`. No Stacks, Table or Text view.
- **Group and sort.** `src/lib/deck/sort.ts` has five sort fields and four groupings; "type" groups by category.
- **Categories.** One per card, from a closed set of 16 (`CardCategory` in `src/lib/deck/types.ts`), assigned by Oracle-text heuristics (`src/lib/deck/categories.ts`). No custom category. List headings collapse through component-local state: lost on reload, no collapse-all, not sticky (the only `sticky` under `src/components/deck` is a shopping-list table header).
- **Tags.** `Deck.tags` holds deck-level labels (`DeckTagsEditor.tsx`). `DeckCard` has no tags; no global tags; `otag` appears nowhere in `src`.
- **Selection.** `BulkSelectBar.tsx` serves only `SecondaryZoneContent.tsx` (Sideboard and Considering): select all, move, delete. The main deck has no selection and no bulk category.
- **Bulk edit exists; it was lossy until #1314.** `BulkEditModal.tsx` edits the deck as text. `exportToText` writes `quantity name` only. When this spec was written, saving called `removeAllCards`, reset the commander, then re-added every line by name, one request per card, so every save reset printings to Scryfall's default, re-derived categories and dropped notes, and a failure after the delete left a partial deck. **Corrected 2026-11-10:** #1314, merged into `dev` on 2026-11-09, compares the text with the deck line by line (`src/lib/deck/bulk-edit.ts`); unchanged lines keep their rows, printings, categories and notes, and the change set is applied in one transaction by `PATCH /api/decks/[id]/cards`. A printing typed in the text is still not applied, which slice 16 covers. The user guide does not mention the dialog.
- **Undo.** An in-memory `undoStack` of `ADD_CARD`, `REMOVE_CARD` and `MOVE_ZONE` (`store.ts`). No redo, no persistence; quantity, category, note and printing changes are not undoable.
- **Snapshots.** Manual and named (`SnapshotsPanel.tsx`, `src/lib/db/snapshot-api.ts`). Restore replaces the cards in one transaction without snapshotting the current state first. `DeckCard` has no timestamp, so no change history exists.
- **Preview.** `CardTooltip.tsx` opens a portal after 300 ms of mouse hover: image and price, no controls, no keyboard or touch trigger. Its price uses `--accent` as text colour, which I-13 token requirement 3 forbids.
- **Statistics.** `DeckStats.tsx`, `ManaCurve.tsx` and `ColorDistribution.tsx` have no click handlers; `DeckStats` holds counts, not card lists. The editor has no in-deck filter.
- **Mobile.** Below `lg`, the builder page shows three tabs (Search, Deck, Stats) whose labels are hard-coded English strings in `src/app/[locale]/builder/[deckId]/page.tsx`. No undo, quick add or layout control.
- **Shortcuts.** `useKeyboardShortcuts.ts` handles `/`, `?`, Esc, ↑, ↓, Enter and Ctrl/Cmd+Z, S, E, I; `KeyboardShortcutsModal.tsx` lists the same nine entries. The user guide (dated 2026-04-06) lists three rows, none of them a key. Modifier keys fire inside text fields by tested design, so Ctrl+Z in a note triggers deck undo. `/` and `?` are single-character shortcuts that cannot be turned off, remapped or limited to a focused control; WCAG 2.1.4 (Level A) requires one of the three [26].
- **Finish and language.** `DeckCard` in `prisma/schema.prisma` has no finish, foil, language, Oracle ID or timestamp. `CollectionCard.foil` is a boolean with no etched value. `ScryfallCard` types `usd_foil` and `lang`, not etched prices or finishes.
- **Clipboard and search.** No clipboard. Search shows "In Collection ×N"; no in-deck marker.
- **Primer editor.** `DeckDescriptionEditor.tsx` is a four-row textarea in a collapsed panel. It saves on blur and has no live preview; the server caps descriptions at 2,000 characters (`src/lib/validation/deck.ts`).
- **Measurement.** Lighthouse CI audits `/`, `/fr` and `/auth/signin` only (`lighthouserc.yml`); the editor is never measured. `e2e/deck-editor-visual.spec.ts` compares bounding boxes; there is no screenshot regression.
- **I-13 spec slice 1 has not shipped:** `--border` is still `#443a5e` and `#e4dcf2` in `src/styles/globals.css`.

## Functional requirements

### 1. "Beautiful", measured

1.1 Every I-37 surface meets I-13's [acceptance thresholds](i13-visual-direction.md#acceptance-thresholds-per-slice): contrast, no status by colour alone, visible focus, three theme states, no body scroll at 390 px, visual regression, Lighthouse not regressing.
1.2 **Latency.** On a 100-card Commander fixture, switching view, collapsing a group, applying a statistic filter, changing a quantity, opening the card panel and opening bulk edit each have an Interaction to Next Paint of 200 ms or less at the 75th percentile, web.dev's "good" threshold [25]. Lab measure: Playwright with Chrome Event Timing entries, 20 runs, 4× CPU slowdown (our choice, stated with each result).
1.3 **Stability.** Cumulative Layout Shift is 0.1 or less on editor load [25]. Hovering a card or focusing it moves no card row, as #1270's bounding-box test asserts.
1.4 **Density (proposed targets for the I-13 review).** At 1440×900, Stacks shows every group heading of the fixture within two viewport heights; Table shows at least 25 rows; Text prints the deck on two A4 pages.
1.5 **Click depth.** Slice 1 counts interactions for a fixed task list: change view, group and sort; filter to a category; change a card's category, printing and quantity; move to Sideboard; undo; open statistics on mobile. No slice may raise a count. View, group and sort each take two interactions or fewer on desktop and mobile.
1.6 **Targets.** Every pointer target is at least 24×24 CSS px (WCAG 2.5.8, Level AA) [26]; primary touch actions use the 40 px that #1058 already uses.
1.7 **Images.** Switching views reuses loaded images; a printing's image is fetched once per session.
1.8 **Side-by-side.** Before the validation slice closes, a person captures the fixture list in Moxfield, Archidekt and MagicAIBuilder at 1440 and 390 px in a normal browser, for an owner review. No automated runs against those sites ([I-29](i29-cross-site-deck-index.md) requirement 1.1).

### 2. Views

2.1 Five views of the same cards: Grid, List, Stacks, Table, Text. Each honours the current group, sort and filter.
2.2 The view, grid density and element toggles persist across reloads, in the browser.
2.3 Grid shows group headings, as List does.
2.4 **Stacks:** one column per group; cards overlap so each title band stays readable; hover or focus raises a card without moving others; a quantity badge shows copies.
2.5 **Table:** sortable columns for quantity, name, mana cost, mana value, type, category, tags, set and collector number, finish, price and ownership; quantity, category, tags and finish editable in place; arrow keys move between cells; a sticky header row.
2.6 **Text:** a read-only list grouped as the deck is, with optional mana cost and price, a copy action and a print stylesheet.
2.7 Below 768 px, Stacks and Table fall back to List unless the player chooses them; wide content scrolls inside its own container.
2.8 Stacks and Text are also available read-only on public and share pages.

### 3. Groups and categories

3.1 Each group heading collapses and expands; one control collapses or expands all. Collapse state persists per deck in the browser.
3.2 Group headings stay visible while their cards scroll, in every grouped view and on mobile. A heading shows its card count by quantity.
3.3 **Custom categories:** the player creates, renames, reorders and deletes deck categories. The 16 built-ins stay as defaults and the categorizer still assigns one on add. Deleting a category returns its cards to their assigned built-in, after confirmation.
3.4 New group keys: tag, rarity, set, date added. New sort keys: date added, set, rarity, quantity. Rows created before the migration have no date added and sort last.

### 4. Tags

4.1 A deck card carries any number of deck tags beside its one category.
4.2 **Global tags** belong to the player and follow a card by Oracle identity into every deck the player owns. A printing change keeps them.
4.3 Deck and global tags differ by a glyph or text, not by colour alone.
4.4 Renaming or merging a tag applies across the deck (deck tags) or all decks (global tags) in one recorded operation.
4.5 Group and filter by tag.
4.6 **Function tags:** a card shows its Scryfall Tagger function tags with source and retrieval date, and the player can apply one as a category or a deck tag. They come from Scryfall data only, never from a language model. Blocked on open question 1.

### 5. Selection and bulk actions

5.1 Main-deck cards are selectable by Ctrl/Cmd-click, Shift-click for a range, long-press on touch, Ctrl/Cmd+A with focus in the deck, and a checkbox mode for keyboard and screen-reader users.
5.2 Bulk actions: set category, add or remove tags, move zone, remove, add to the clipboard. They reuse I-01's per-card recovery (#935–#947), and each is one undo entry and one history batch.

### 6. Card panel

6.1 On desktop widths, a toggle opens a card panel beside the deck, in every view. It shows the card under the pointer, under keyboard focus, or the last one selected. Opening it is the only action that resizes the deck column.
6.2 It shows both faces, Oracle text, price for the chosen finish, ownership, and links to rulings, Scryfall and EDHREC. Moxfield users asked for those links under its redesign preview, noting "Archidekt has them" [14].
6.3 Controls: quantity, zone, category, tags, printing, finish, language, note. Each calls the existing store action, so recovery is shared.
6.4 Keyboard focus on a card updates the panel. Today the preview is mouse-only.
6.5 In Grid and Stacks, toggles hide or show price, quantity badge, ownership marker and tags. A text-only render replaces card images, for low bandwidth and for [I-24](i24-decks-a-screen-reader-can-play-from.md).

### 7. Text bulk edit in place

7.1 Bulk Edit keeps its place, but saving computes a diff against the current deck and applies only the diff.
7.2 Unchanged lines keep their row, printing, category, note and tags.
7.3 A preview lists additions, removals and changes to quantity, zone, printing, finish and tags, plus unparsed or unresolved lines. Apply stays disabled while an unresolved line remains.
7.4 The diff applies in one server transaction against the deck version previewed. A failed write leaves the deck unchanged; a deck changed since the preview is refused with a reload prompt.
7.5 Line syntax: `quantity Name (SET) collector-number *F* *E* #tag #!globaltag`, with the zone and commander headings the importer accepts today. `*F*`, `#tag` and `#!globaltag` follow Moxfield's documented syntax [11]; `*E*` for etched is our proposal.
7.6 An unsupported token is reported in the preview, never dropped. Removing a tag in the text removes it.
7.7 Export writes the same syntax, so export, edit and apply round-trip printing, finish and tags. One parser serves this dialog and I-10's import, with shared fixtures.
7.8 Apply takes an automatic snapshot first and is one history batch and one undo entry. The user guide documents the syntax.

### 8. Cross-deck clipboard

8.1 A signed-in player's clipboard is available on every deck page and device; a guest's stays in the browser. Its capacity is a fixed cap the owner sets.
8.2 Cards are added from search, deck cards, the card panel, public decks and recommendations. An entry keeps printing and finish and may carry a note.
8.3 From the clipboard, a player drags or keyboard-adds entries to a zone, creates a deck from selected entries, or exports them as text.
8.4 Entries and search results mark cards already in the open deck, and the same card in another printing.

### 9. Automatic change history

9.1 Every persisted card mutation writes a change record in the same transaction: add, remove, quantity, zone, printing, finish, language, category, tags, note, and commander, partner or companion. A failed mutation writes none.
9.2 A record holds time, actor, kind, card, before, after and a batch. Bulk actions, bulk edit, imports, package applies, snapshot restores and AI applies are one batch each, with the source named.
9.3 An automatic snapshot precedes a snapshot restore, a bulk edit apply and an import into an existing deck.
9.4 The history view lists batches newest first, grouped by day, filtered by kind or card, and compares any point with the current deck through `src/lib/deck/comparison.ts`.
9.5 The owner can revert one change or restore a point. Both create a new batch; nothing is erased. Undo gains redo and covers every mutation kind this spec adds.
9.6 History is private. A public deck may opt in to show its changelog.
9.7 I-20 patches write into the same history with the proposer as actor. I-20 owns the patch model.

### 10. Statistics that filter the deck

10.1 An in-deck filter bar: text over name, type and Oracle text, plus category, tag, mana value, colour, type, finish, ownership and Game Changer.
10.2 Clicking a curve bar, colour segment, category or type count, or the Game Changer count sets that filter; Ctrl/Cmd-click selects those cards instead.
10.3 A clickable figure is computed from the same predicate as its filter, so the filtered count equals the figure.
10.4 Active filters show as removable chips, with "showing 14 of 100" and one control to clear all.
10.5 New analyses belong to I-03 and I-31 and become clickable through this model.

### 11. Mobile toolbar and quick add

11.1 Below `lg`, a bottom toolbar replaces the three tabs: Search, Quick add, Layout, Undo, More. An empty deck offers to set a commander, search or paste a list.
11.2 Layout opens a drawer with view, group, sort and filter. More holds Statistics, Playtest, Share, Compare, Export, History and Clipboard.
11.3 Labels come from the message catalogues; targets are 40 px or more; the toolbar respects the safe area and never hides the last card row.
11.4 Quick add, on mobile and desktop, takes lines such as `2 Sol Ring` with name completion, adds to the current zone and can stay open. Scryfall-syntax add stays in [I-14](i14-verifiable-natural-language-search.md).

### 12. Keyboard shortcuts

12.1 One registry declares each shortcut's keys, scope and description. The help modal reads it, and a test fails when the user guide's table differs.
12.2 New keys: quantity up and down, move to Sideboard or Considering, toggle the card panel, add to the clipboard, select all, collapse all, switch view, focus quick add.
12.3 Single-character shortcuts can be turned off in settings and never fire in a text field (WCAG 2.1.4) [26].
12.4 Inside a text field, Ctrl/Cmd+Z is the field's own undo. This reverses a tested behaviour on purpose.

### 13. Finish, language and date added on deck cards

13.1 A deck card records its finish (nonfoil, foil, etched), the language of the printing played, its date added and its Oracle identity, backfilled from [I-67](i67-one-card-data-pipeline.md)'s `CardPrinting` with no API call (re-pointed 2026-11-10 from I-29's `CardKey`). This initiative adds `DeckCard.oracleId` once; I-47 slice 3 no longer does.
13.2 Existing rows default to nonfoil, with language and date added unknown. Nothing is guessed.
13.3 The printing selector offers only the finishes that printing exists in; the price shown follows the finish.
13.4 Text and CSV exports and `/api/v1` add finish and language additively. I-10 maps formats, I-06 matches ownership by finish, I-32 carries finish into seller carts.

### 14. Primer editor layout

14.1 The primer editor shows the Markdown source beside the rendered primer at a working height, and keeps I-08's template insert. Moxfield's primer editor has syntax highlighting, a split preview and an automatic table of contents [10].
14.2 I-37 owns the editor's layout and where card-link completion appears. [I-36](i36-creator-and-embed-toolkit.md) owns the card-link syntax, its rendering and video; I-08 owns the template and the length limit.

### 15. Paid-tier boundary (input to I-30)

15.1 Free: every view, category, tag, filter, bulk edit, the clipboard, history within the free window, and shortcuts. Moxfield documents free history and global tags [10] and Archidekt a free 150-card clipboard [6]. ManaBox reviewers complain about paywalls on capacity [23]. Card data stays free under Scryfall's terms [27] and the Fan Content Policy [28] (research, not legal advice).
15.2 Candidates where free competitors stop: history kept beyond the free window (TappedOut sells revision tracking [15], Untapped sells longer personal history [24]); early access to new views (Moxfield gave Patreon members its redesign first [14]; the Fan Content Policy is silent on early access [28]); presentation themes for public decks [15]. None gates editing a player's own deck.

## Data model / API

```
DeckCard        + finish (nonfoil|foil|etched, default nonfoil), lang?, oracleId?, addedAt?
DeckCategory    id, deckId, name, position        -- DeckCard.category holds a built-in key or a DeckCategory id
DeckCardTag     deckCardId, tag                   -- deck tags
GlobalCardTag   userId, oracleId, tag             -- applied to every deck card with that oracleId
DeckChange      id, deckId, batchId, actorId?, at, kind, source, scryfallId?, oracleId?, cardName, before?, after?
DeckSnapshot    + kind (manual|auto), reason?
ClipboardEntry  id, userId, scryfallId, oracleId, name, finish, note?, addedAt
```

- `POST /api/decks/[id]/cards/apply` takes a diff and the `Deck.updatedAt` it was computed from. It answers 409 when the deck has moved and applies everything in one transaction otherwise.
- Every mutation route under `src/app/api/decks/[id]/cards/` and the snapshot restore route write `DeckChange` inside their transaction.
- `GET /api/decks/[id]/history?cursor=` and `POST /api/decks/[id]/history/[changeId]/revert`; `/api/clipboard` for the clipboard.
- View, density, collapse state and element toggles stay in the browser, as sort and group do today.

## Non-goals

- **Live co-editing.** Archidekt collaborators edit in real time [8]; the roadmap keeps [I-20](i20-collaborative-review.md) as propose and accept.
- **A custom-card creator or uploaded card images.** Archidekt offers free custom cards with generated images and moderated uploads [6]; the roadmap's [deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark) exclude them.
- **Vendor prices and carts.** Archidekt's overlay breaks cost down by vendor and category [4]; that work stays in I-06 and I-32.
- **Playtester gaps go to I-07:** hotkeys (Moxfield draw, shuffle and zone keys [12]), battlefield multiselect and grouping, Archidekt's opponent-interaction simulator of about September 2026 [5], a stream popout hiding the hand, save and resume, log charts, and forcing a card into the opening hand.
- **Embeds, view counts, notifications and deck tag suggestions:** I-36 and I-08.
- **New analyses** (probability table, curves by colour or category): I-03 and I-31.
- Categories or tags produced by a language model.
- Copying another product's layout, artwork or interaction details, and a native app (I-13).
- Paid limits on decks, tags, categories or clipboard size.

## Testing strategy

Each slice opens with its focused Red test, per [`tdd-with-ai.md`](../../engineering/tdd-with-ai.md).

- **Bulk edit (sociable, API and store):** unchanged lines keep row id, printing, category, note and tags; an injected failure mid-apply leaves the deck identical; a stale base returns 409; one undo entry and one history batch.
- **Parser (solitary):** fixtures for `(SET) number`, `*F*`, `*E*`, `#tag`, `#!tag` and unknown tokens; export then parse is the identity; fixtures shared with I-10.
- **History (sociable):** each mutation route writes exactly one change in its transaction and none on failure; restore and bulk apply snapshot first; revert creates a new batch.
- **Filters (solitary):** for every clickable figure, the filtered count equals the figure, on fixtures with double-faced cards and quantities above one.
- **Shortcuts:** registry, help modal and guide table agree; disabled or in-field single-character keys stay silent; Ctrl+Z in a textarea leaves the deck undo stack untouched.
- **E2E (Docker-backed Playwright):** collapse survives reload; a sticky heading stays in view while its group scrolls; panel and hover move no row; the mobile toolbar at 390×844 in French shows French labels; a keyboard-only path adds, tags, moves and undoes a card.
- **Performance:** slice 1's harness asserts requirement 1.2 and 1.3 on the fixture and records results per slice.
- **Visual and accessibility:** a screenshot per view, theme state and width (390, 1024, 1440); axe on each view; panel, Table and Stacks operable by keyboard.

## Delivery slices

| #   | Slice                                                                                                                                                                                                          | Depends on                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Measurement baseline: 100-card fixture, latency and layout-shift harness, click-depth counts, screenshots at three widths and three theme states                                                               | —                                                |
| 2   | Persisted view and density; collapsible headings with collapse-all, persisted per deck; sticky headings in List                                                                                                | 1; I-13 spec slice 1                             |
| 3   | Shortcut registry, generated help, guide table under test, off switch for single-character keys, native undo in text fields                                                                                    | —                                                |
| 4   | Read-only card panel following pointer, focus and selection; element toggles; text-only render                                                                                                                 | 2                                                |
| 5   | Grouped Grid and the Stacks view                                                                                                                                                                               | 2                                                |
| 6   | In-deck filter bar and clickable statistics                                                                                                                                                                    | 1                                                |
| 7   | Mobile toolbar with localized labels, Layout and More drawers, empty-deck prompt, quick add                                                                                                                    | 2                                                |
| 8   | Text view and Table view, with quantity and category editable                                                                                                                                                  | 2                                                |
| 9   | Main-deck multi-select: bulk category, zone and removal                                                                                                                                                        | 3                                                |
| 10  | Change log in each mutation transaction, automatic snapshots, history view with compare                                                                                                                        | —                                                |
| 11  | Revert a change, restore a point, redo                                                                                                                                                                         | 10                                               |
| 12  | Finish, language, date added and Oracle identity on deck cards; finish-aware printing selector and price _(`DeckCard.oracleId` added once here, backfilled from I-67's `CardPrinting`; re-pointed 2026-11-10)_ | I-67 slice 2 for the backfill                    |
| 13  | Custom categories and deck tags, with bulk tagging, rename and merge                                                                                                                                           | 9, 10                                            |
| 14  | Global tags                                                                                                                                                                                                    | 12, 13                                           |
| 15  | Card panel controls: quantity, zone, category, tags, printing, finish, language, note                                                                                                                          | 4, 12, 13                                        |
| 16  | Bulk edit as one diff-and-apply transaction, with the line syntax and preview                                                                                                                                  | 10, 12, 13                                       |
| 17  | Cross-deck clipboard and in-deck markers in search                                                                                                                                                             | 12                                               |
| 18  | Function tags from the Oracle Tags that I-67 slice 7 loads _(re-pointed 2026-11-10)_                                                                                                                           | 13; I-67 slice 7; **Blocked** on open question 1 |
| 19  | Read-only Stacks and Text on public and share pages                                                                                                                                                            | 5, 8; I-13 spec slice 7                          |
| 20  | Validation: I-13 matrix, latency budgets, click depth and the side-by-side review across the visual slices                                                                                                     | 2, 4, 5, 6, 7, 8                                 |
| 21  | Primer editor split view _(card-link completion split off to slice 24 on 2026-11-10)_                                                                                                                          | —                                                |
| 22  | Command palette opened by Ctrl/Cmd+K or a toolbar button, listing every command the slice 3 registry declares for the page, with its key                                                                       | 3                                                |
| 23  | From the palette, open any of the player's decks by name and add a card to the current zone through slice 7's quick add                                                                                        | 7, 22                                            |
| 24  | Card-link completion in the primer editor's split view, once I-36 ships card links _(split from slice 21 on 2026-11-10)_                                                                                       | 21; I-36 slice 6                                 |

Slices 22 and 23, the command palette that the roadmap added on 2026-11-10, join this table, and slice 24 is split from slice 21 so that the split view ships without I-36. Slices 1 to 9 are the cheap visual and ergonomic wins and change no schema. Slice 10 underpins bulk edit and I-20. Slice 12 unblocks I-06's printing-level ownership, I-10's round trip and I-32's carts. Slices 14 and 16 rest on Moxfield-only references and wait for the browser check in the sourcing warning.

## Open questions

- **Where do function tags come from?** It was not established whether Scryfall's API or bulk data carries Tagger tags per card; scryfall.com answered 403 to this research. Options are bounded, cached `otag:` searches through the public API, or asking Scryfall. Tagger's internal endpoints are excluded by I-29 requirement 1.1. This research did not find how Archidekt sources them [4]. **Answered 2026-11-10:** Scryfall's bulk data lists an "Oracle Tags" file "sourced from Tagger", with 4,617 tags on 36,453 Oracle IDs in the file of 2026-11-09 ([I-65](i65-how-this-deck-wins.md) research; [I-54](i54-find-your-next-commander.md) found the file first). Whether the product may show the tags stays open and goes to [I-30's lawyer list](i30-business-model-and-paid-tier.md#7-the-legal-gate).
- **How long does free history last, and where is the paid line?** Moxfield's retention is unknown. The owner sets the free window with I-30, knowing Moxfield's history is free [10] and TappedOut's is paid [15].
- **What did Moxfield's 2026-09-28 redesign ship** [14], and should the bulk syntax match Moxfield exactly for paste compatibility or only where documented?
- **Which view opens a new deck?** Today an ungrouped six-column grid; Archidekt opens Stacks [9]. Decide from slice 1's baseline and slice 5.
- **Clipboard cap and alter flag.** Archidekt's cap is 150 [6]. Store Moxfield's `*A*` as a boolean for round trips, or report it as unsupported? Either stays inside the custom-card non-goal.
- **Language in the line syntax**, and whether reversing Ctrl+Z in text fields (12.4) needs owner sign-off.
- **Sequencing with I-13 spec slice 6.** Should I-13 restyle the editor after slices 2, 5 and 8, so it is restyled once?

## Sources

Read on 2026-11-09 unless dated otherwise. "Snippet" means the page refused automated access and a search engine's summary was read.

1. Archidekt, [news 19248512](https://archidekt.com/news/19248512), edited 2026-01-21: collapsible and sticky categories.
2. Archidekt, [news 20605672](https://archidekt.com/news/20605672), edited 2026-03-06: static card view, element toggles, text cards, in-deck markers, Shift+/.
3. Archidekt, [news 22633051](https://archidekt.com/news/22633051), edited 2026-05-15: mobile toolbar and drawers.
4. Archidekt, [news 24799503](https://archidekt.com/news/24799503), edited 2026-07-27: Oracle-tag categories, price overlay by vendor and category.
5. Archidekt, [news 26104256](https://archidekt.com/news/26104256), about September 2026: playtest interaction simulator.
6. Archidekt, [news 17621845](https://archidekt.com/news/17621845), edited 2025-11-20: custom cards, 150 pinned cards, W key.
7. Archidekt, [news 9287631](https://archidekt.com/news/9287631), edited 2024-09-23: interactive statistics, multi-select.
8. Archidekt, [FAQ](https://archidekt.com/faq): shortcuts, collaborators, Patreon ad removal.
9. EDHREC, [How to use Archidekt](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site), 2025-12-17: views, sorts, history.
10. Moxfield, [Features wiki](https://github.com/moxfield/moxfield-public/wiki/Features), last edited 2020-10-14.
11. Community primer on Moxfield, [gist](https://gist.github.com/Jerakin/24be913c6106546136c45d1d028f9af9), 2021-08-01.
12. Moxfield help, [shortcuts](https://moxfield.com/help/help-articles/shortcuts) and an [example history page](https://moxfield.com/decks/htJG57r4e0SNkPNs65swyQ/history) (snippets).
13. Moxfield feedback board, [#1279](https://moxfield.nolt.io/1279), [#956](https://moxfield.nolt.io/956), [#1910](https://moxfield.nolt.io/1910) (snippets, undated).
14. r/Moxfield, [deck editor redesign preview](https://www.reddit.com/r/Moxfield/comments/1wsnch7/), 2026-09-28.
15. TappedOut, [Level Up](https://tappedout.net/help-desk/level-up/) (©2026): paid revision tracking, custom styles (search summary).
16. BlueprintMTG launch posts on r/EDH, [July 2026](https://www.reddit.com/r/EDH/comments/1uqynon/) and [August 2026](https://www.reddit.com/r/EDH/comments/1vzwh0m/).
17. r/EDH, Tagger tips [June 2025](https://www.reddit.com/r/EDH/comments/1lc7cu9/) and [October 2026](https://www.reddit.com/r/EDH/comments/1wxxui2/); MoxTags [March 2026](https://www.reddit.com/r/EDH/comments/1s7rysy/) and [June 2026](https://www.reddit.com/r/EDH/comments/1tvuwhe/).
18. r/EDH, which site to use, [June 2026](https://www.reddit.com/r/EDH/comments/1uav2g2/) and [October 2026](https://www.reddit.com/r/EDH/comments/1wv8mf7/); Moxfield mobile ads, [August 2026](https://www.reddit.com/r/EDH/comments/1vhlzqj/).
19. EDHREC redesign threads, [r/EDH](https://www.reddit.com/r/EDH/comments/1x7v653/) and [r/magicTCG](https://www.reddit.com/r/magicTCG/comments/1x56apg/), October 2026.
20. Vendor reviews: [GrimDeck](https://grimdeck.com/blog/best-mtg-deck-builder-sites), 2026-03-02; [ManaForge](https://manaforge.tools/en/blog/manaforge-vs-moxfield-vs-archidekt), August 2026; [DeckCheck](https://deckcheck.co/blog/deckcheck-vs-moxfield-vs-archidekt-vs-manabox), 2026-10-09.
21. EDHREC, [redesign changelog](https://edhrec.com/articles/changelog-edhrec-redesign), 2026-10-13, and [how to use EDHREC](https://edhrec.com/guides/how-to-use-edhrec) (snippet).
22. EDHREC, [interview with Archidekt's founder](https://edhrec.com/articles/archidekt-founder-and-gamemaker-andy-grimm-cassidy-atl), 2025-09-23.
23. ManaBox, [App Store reviews feed](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460407674/sortby=mostrecent/json), 250 reviews to 2026-11-06.
24. [Untapped.gg Premium](https://mtga.untapped.gg/premium); [TopDecked Powered](https://topdecked.com/articles/powered-features); [Deckbox Premium](https://deckbox.org/premium).
25. web.dev, [Interaction to Next Paint](https://web.dev/articles/inp), updated 2025-09-02, and [Cumulative Layout Shift](https://web.dev/articles/cls).
26. W3C, WCAG 2.2 Understanding [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [2.1.4 Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html).
27. Scryfall, [API documentation](https://scryfall.com/docs/api): the no-paywall clause.
28. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
29. Moxfield, [production JavaScript bundle](https://assets.moxfield.net/assets/assets/moxfield.cef6c321948dbc3a893f.js), as referenced by the capture in [30]; added 2026-11-11.
30. Internet Archive, [Wayback capture of Moxfield's "What are packages" help page](https://web.archive.org/web/20260514164209/https://moxfield.com/help/help-articles/what-are-packages), 2026-05-14; added 2026-11-11.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player edits a deck with the views, groups, tags, text bulk edit, history and mobile toolbar they expect from Moxfield and Archidekt, and the editor stays measurably fast and stable while they do.

### Goals

- On the 100-card fixture, a player switches among five views, collapses groups, tags and filters cards, bulk-edits as text without losing printings or notes, and reverts a change from history, on desktop and at 390 px, within the latency and stability budgets.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-37-01

As a player coming from Moxfield or Archidekt, I want views, tags and a history that do not reset my printings, so that the editor is as deep without being a copy.

#### US-37-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-37-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-37-01 Happy path

Given a signed-in player and the English locale
When a bulk edit changes only the lines that differ, and keeps printings on the lines that do not.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-37-02 Happy path

Given a signed-in player and the English locale
When the previous view remains selectable after a default changes.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-37-03 Happy path

Given a signed-in player and the English locale
When a 100-card fixture stays inside the latency and layout-shift bars named on this initiative.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-37-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-37-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-37-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests keep today's editor. Views ship one at a time, each behind the measurement slice. No flag that hides a view the player already chose.

#### AC-37-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-37-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-37-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Stacks, table and text are views, not separate decks. A category can nest one level. Multi-select tags a group.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

History is a row written in the same transaction as the mutation. Oracle id arrives once, from I-67, on the deck card. No second card database.

### Analytics and telemetry

`editor_view_changed {view}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests keep today's editor. Views ship one at a time, each behind the measurement slice. No flag that hides a view the player already chose.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Tagger tags stay blocked until Scryfall answers. Foil and language are this initiative's slice 12.

### Sources

- https://archidekt.com/news/19248512
- https://archidekt.com/news/22633051
- https://www.reddit.com/r/Moxfield/comments/1wsnch7/
- https://www.reddit.com/r/EDH/comments/1x7v653/
- https://www.youtube.com/shorts/Opd_rrdE2S4
- https://api.scryfall.com/bulk-data
- https://www.youtube.com/shorts/bfXJIfZw2Cg
- https://archidekt.com/faq
- https://archidekt.com/news/2981306
- https://archidekt.com/features
- https://www.reddit.com/r/Moxfield/comments/1udcr1n/
- https://mtgarena-support.wizards.com/hc/en-us/articles/47748861568916-Patch-Notes-2026-57-50

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-37: Editor Depth Against Moxfield And Archidekt

**Spec:** [`specs/i37-editor-depth.md`](i37-editor-depth.md)

**Outcome:** a player edits a deck with the views, groups, tags, text bulk edit, history and mobile toolbar they expect from Moxfield and Archidekt, and the editor stays measurably fast and stable while they do.

**Status:** Next
**Priority:** Next; Later for slice 24, card-link completion, which waits for I-36's card links (split 2026-11-10)
**Impact / effort:** High / large
**Depends on:** I-13 spec slice 1 for the visual slices; I-67 slice 2 for the Oracle ID backfill (slice 12); I-36 slice 6 for card-link completion (slice 24). I-01 keeps zones and failed-save recovery, which every slice here reuses.

The owner wants an editor "more beautiful and more complete than Moxfield". Archidekt shipped visible editor changes in January, March, May and July 2026: collapsible and sticky categories ([January](https://archidekt.com/news/19248512)), a static card panel, a mobile bottom toolbar ([May](https://archidekt.com/news/22633051)) and Oracle tags as categories. Moxfield previewed a redesign to Patreon members on 28 September 2026 ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1wsnch7/)). MagicAIBuilder's editor has two views, one closed set of 16 categories, deck-level tags only, selection only in Sideboard and Considering, an in-memory undo and no change history. Players choose between the incumbents on speed and readability, and punish redesigns that bury filters and sorts ([r/EDH](https://www.reddit.com/r/EDH/comments/1x7v653/)), so "beautiful" is measured here: on a 100-card fixture, Interaction to Next Paint of 200 ms or less, layout shift of 0.1 or less, and no task taking more clicks than before.

### Scope

- [ ] A measurement baseline: a 100-card fixture, a latency and layout-shift harness, click-depth counts, and screenshots at three widths and three theme states (slice 1).
- [ ] Persisted view and density, collapsible headings with collapse-all, and sticky headings (slice 2).
- [ ] A shortcut registry that generates the help modal, an off switch for single-character keys, and native undo inside text fields (slice 3). See I-04. The off switch (#1320) and native undo (#1309) shipped under I-04; the registry and remapping remain.
- [ ] Delete `src/lib/shortcuts/shortcuts.ts` when the registry lands. Only its own test imports it, and it binds Ctrl+T and Ctrl+L while listing both as reserved by the browser (slice 3). It also declares Ctrl+K "Focus search field", which nothing wires.
- [ ] A card panel that follows pointer, focus and selection, with element toggles and a text-only render; grouped Grid and a Stacks view (slices 4–5).
- [ ] An in-deck filter bar, and statistics that filter the deck when clicked (slice 6).
  - The bar also accepts a Scryfall query, which the product's search already parses and I-14 builds from English or French, and offers a highlight-and-dim mode in every view with a match count, so "highlight my ramp" becomes a checkable query. Moxfield's highlighter, published on 2026-03-10, "lets you use search commands at the deck level to display cards that match your search term" ([video](https://www.youtube.com/shorts/Opd_rrdE2S4)); spec 10.1's bar searches plain text and facets only, and filters instead of highlighting.
- [ ] A mobile bottom toolbar with localized labels, Layout and More drawers and quick add, replacing today's three English-only tabs (slice 7). See I-11.
- [ ] Text and Table views, and main-deck multi-select with bulk category, zone and removal (slices 8–9).
- [ ] A change record written in each mutation's transaction, automatic snapshots before restores and bulk edits, a history view, revert and redo (slices 10–11).
- [ ] Restore the commander fields with the cards. `src/app/api/decks/[id]/snapshots/[snapshotId]/restore/route.ts` deletes and re-creates the deck's `DeckCard` rows in one transaction but leaves `Deck.commanderId`, `commanderName` and `partnerId` as they were. A snapshot taken under another commander therefore restores its cards while the deck keeps the old `commanderName`, which community discovery matches in SQL. Found by the I-55 spec, whose requirement 5.6 writes the three fields in the same transaction.
- [ ] Finish, language, date added and Oracle identity on deck cards (slice 12). `DeckCard` has none of them today (`prisma/schema.prisma`), and I-06, I-10 and I-32 depend on them.
  - One owner, 2026-11-10: this slice adds `DeckCard.oracleId`, backfilled from [I-67](i67-one-card-data-pipeline.md)'s `CardPrinting` with no API call, and I-47 slice 3 no longer adds it.
- [ ] Custom categories, deck and global tags, card-panel controls, bulk edit as one diff-and-apply transaction, a cross-deck clipboard and Scryfall function tags (slices 13–18). The I-01 bulk-edit fix, #1314, stopped the data loss first.
  - The spec's open question on where function tags come from is answered (2026-11-10): Scryfall's bulk-data index lists an "Oracle Tags" file "sourced from Tagger", and the file of 2026-11-09 holds 4,617 tags on 36,453 Oracle IDs ([bulk data](https://api.scryfall.com/bulk-data), counted by the I-65 spec; the I-54 spec found the file first). Slice 18 reads the tags that I-67 slice 7 loads (re-pointed 2026-11-10). Whether the product may show the tags is the licence question shared with I-54 and [I-65](i65-how-this-deck-wins.md), which joins I-30's lawyer list; slice 18 stays blocked until Scryfall answers.
- [ ] Read-only Stacks and Text on public pages, the validation pass with a side-by-side review, and a split primer editor (slices 19–21).
  - Split on 2026-11-10: card-link completion in the primer editor is slice 24, which waits for I-36 slice 6, so the split view (slice 21) ships without it. The command palette below is slices 22 and 23 of the spec's table.
- [ ] A command palette opened by Ctrl/Cmd+K or a toolbar button, listing every command that the slice 3 registry declares for the current page, each with its key (slice 22).
- [ ] From the palette, open any of the player's decks by name, and add a card to the current zone through slice 7's quick add (slice 23).
  - The palette is a dialog that holds a combobox, with labels from the message catalogues. It needs no single-character key, so WCAG 2.1.4 does not apply, and on touch it opens from slice 7's More drawer. A palette outside the editor needs a mount in the layout, because `useKeyboardShortcuts` is mounted only in the builder page (`src/app/[locale]/builder/[deckId]/page.tsx`). Mythic Hub's palette "opens with Ctrl+K on Windows or Cmd+K on Mac" (search summary of its help page, undated); none was found on Moxfield, Archidekt, EDHREC or Scryfall. Whether browsers claim Ctrl+K on Windows and Linux is unverified; if they do, the palette calls `preventDefault`.
- [ ] Accept a card dragged or pasted from Scryfall, EDHREC, Archidekt or Moxfield, as a link or an image: resolve it by Scryfall ID or name, apply I-57's printing rule, and land it in the zone under the pointer, with undo and keyboard and touch equivalents (slice 24). Moxfield said on 2026-10-29 that "there are now three sites you can drag and drop cards from directly in to your decks" ([video](https://www.youtube.com/shorts/bfXJIfZw2Cg)); every drag in this roadmap stays inside the app today. [I-10](i10-interoperability-and-integrations.md) keeps the link and image formats under fixtures.
- [ ] Category templates in account settings, chosen at deck creation and editable later (with slice 13). Archidekt keeps them in account settings ([FAQ](https://archidekt.com/faq), seen 2026-11-10; [dev update](https://archidekt.com/news/2981306), about 2022). Added 2026-11-11.
- [ ] One level of nesting for custom categories, for example ramp into rocks and dorks. Archidekt "[Builder] Subcategories", 240 points, open ([features](https://archidekt.com/features), seen 2026-11-10). Added 2026-11-11.
- [ ] A fixed set of about ten icon flags per deck card (cut candidate, pet card, proxy, table talk), shown in every view without regrouping and exported as tags. "Small visual tags that don't require sorting" ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1udcr1n/), 2026-06-23). Added 2026-11-11.
- [ ] Slice 17's search markers gain "would break" chips naming the rule a result breaks before it is added: off-identity, already in the deck, banned, a Game Changer over the target bracket, over the per-card budget, or the companion's condition. Arena shows incompatible cards "in red instead of removing them" ([Patch Notes 2026.57.50](https://mtgarena-support.wizards.com/hc/en-us/articles/47748861568916-Patch-Notes-2026-57-50), search-index text, date not read). The owner-decided "Collection only" toggle (I-06) sits beside them. Added 2026-11-11.
- [ ] Add to the open deck from card, rules and public-deck pages, not only from the editor's search. Scryfall's "Add to Deck" tray works across its site ([FAQ](https://scryfall.com/docs/faqs/where-did-the-deck-tray-or-add-to-deck-button-go-19), seen 2026-11-10). Added 2026-11-11.
- [ ] Low: a custom mana value per card for the curve (X spells, cost reducers), as ManaBox ([FAQ](https://manabox.app/guides/decks/faq/), seen 2026-11-10) and Archidekt (about 2022) offer. Added 2026-11-11.
- [ ] **Owner decision, 2026-11-10:** the deck's tags are among the orphaned deck fields to re-mount (see I-01).

### Engineering enablers

- Every slice meets I-13's acceptance thresholds and the 24 px minimum target size (WCAG 2.5.8).
- A mutation route writes exactly one change record inside its transaction, and none on failure.
- For every clickable statistic, the filtered count equals the figure.
- A person checks moxfield.com in a normal browser before any slice whose only reference is Moxfield. No automated runs against competitor sites.

**Paid-tier angle:** every view, category, tag, filter, bulk edit, the clipboard and shortcuts stay free, as they are at Moxfield and Archidekt, and no slice limits decks, tags or clipboard size. Candidates are history kept beyond a free window, early access to new views, and presentation themes for public decks.

### Enrichment (2026-11-11)

**User story.** As a player coming from Moxfield or Archidekt, I want views, tags and a history that do not reset my printings, so that the editor is as deep without being a copy.

**Acceptance.**
- A bulk edit changes only the lines that differ, and keeps printings on the lines that do not.
- The previous view remains selectable after a default changes.
- A 100-card fixture stays inside the latency and layout-shift bars named on this initiative.

**UX.** Stacks, table and text are views, not separate decks. A category can nest one level. Multi-select tags a group.

**Data and API.** History is a row written in the same transaction as the mutation. Oracle id arrives once, from I-67, on the deck card. No second card database.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `editor_view_changed {view}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests keep today's editor. Views ship one at a time, each behind the measurement slice. No flag that hides a view the player already chose.

**Open questions.** Tagger tags stay blocked until Scryfall answers. Foil and language are this initiative's slice 12.

### Definition of done

On the 100-card fixture, a player switches among five views, collapses groups, tags and filters cards, bulk-edits as text without losing printings or notes, and reverts a change from history, on desktop and at 390 px, within the latency and stability budgets.

---

