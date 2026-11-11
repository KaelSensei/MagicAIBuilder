# I-01: Deck Editor Workflow

**Status:** Building  
**Priority:** Now  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can build, reorganize and refine a deck without losing cards, context or intent.

### Goals

- A user can move a card between every legal zone, reload the page, change its printing, undo a move and recover from a failed request without a lost or duplicated card.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-01-01

As a player editing a deck, I want a failed save to put the card back where it was, so that a reload never loses or duplicates it.

#### US-01-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-01-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-01-01 Happy path

Given a signed-in player and the English locale
When moving a card between Main, Sideboard and Considering, then reloading, shows the same zone and quantity.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-01-02 Happy path

Given a signed-in player and the English locale
When two overlapping writes of different fields each roll back to the last confirmed value for that field.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-01-03 Happy path

Given a signed-in player and the English locale
When a signed-in card note survives reload, or the editor says it did not save.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-01-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-01-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-01-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in only for persistence. A guest keeps the deck in the session until I-39's sign-up handoff. No flag: this is the editor itself.

#### AC-01-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-01-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-01-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The save indicator stays up until the last write finishes. A failure names the field. Drag, keyboard and touch all land on the same zone.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The saved zone on the deck card is the only source of truth. Notes need a field `patchCardSchema` currently drops. No new public route.

### Analytics and telemetry

`editor_save_failed {field, recovered: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in only for persistence. A guest keeps the deck in the session until I-39's sign-up handoff. No flag: this is the editor itself.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

Stop new editor views, including I-37, if a reload can still lose or duplicate a card.

### Open questions

Whether a 30-day trash is compatible with erasure stays L-52.

### Sources

- https://www.reddit.com/r/Moxfield/comments/1wsnch7/
- https://apps.apple.com/us/app/topdecked-mtg/id1173388234
- https://manabox.app/guides/decks/faq/
- https://apps.apple.com/us/app/manabox-mtg/id1460407674
- https://draftsim.com/mtg-arena-brawl-guide/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-01: Deck Editor Workflow

**Outcome:** a player can build, reorganize and refine a deck without losing cards, context or intent.

**Status:** Building
**Priority:** Now

### Already shipped

- Search by name, set, color and advanced filters.
- Main deck, commander, companion, sideboard and considering zones.
- `Partner—Father & son` commanders are recognized, paired only with the same variant, searchable in the second-command slot and preserved by deck APIs (#1084); other new partner variants remain separate scope.
- List and grid presentations.
- Categories, quantities, notes, tags and bulk actions.
- Card printing selection and card hover previews.
- Explicit keyboard-accessible moves from the main deck to Sideboard or Considering, and between secondary zones.
- Snapshots, undo, import/export and color identity validation.
- Superseded failed renames no longer roll back a newer rename, including when both requested the same title (#1100).
- Failed maybeboard additions now remove their optimistic card while preserving any existing main-deck copy of the same printing (#1104).
- Bracket, Game Changers, banlist and deck warnings.

### Remaining scope

- [x] Persist main, sideboard and maybeboard zones as the single database source of truth. The saved card zone wins over the legacy maybeboard mirror, and that mirror is derived from the zone (#1263, promoted to `main` in #1273).
- [x] Preserve zone and quantity when changing a card printing.
- [x] Restore the previous card printing and notify the player when its save fails.
- [x] Complete cross-zone drag and drop with clear drop targets and no layout jump. Zone targets stay mounted and do not resize, and the smallest target under the pointer wins (#1264, promoted to `main` in #1273).
- [ ] Keep optimistic updates, undo and failed-save recovery consistent.
  - [x] Restore the previous commander, partner and pairing type, with an error, when a commander save or clear fails; keep a newer choice, a partner picked meanwhile, and a commander whose deck record was saved (#1297). Other concurrent writes remain open.
  - [x] Restore the previous tags, with an error, when their save fails (#1326, 2026-11-10).
  - [x] Keep one row per command-zone slot. `setCommander` and `setPartner` (`src/lib/deck/store.ts`) kept the placed card under its printing id, so no later change could delete its row, and a replaced or cleared commander or partner came back on reload. The store now adopts the saved row id and deletes the rows a change takes off screen (#1317). Decks saved before the fix can still hold extra flagged rows, and the server does not yet enforce one row per slot.
  - [x] Keep the save indicator active until overlapping budget writes finish, even if one fails (#1096). Other concurrent writes remain open.
  - [x] Keep save activity visible while an addition and a removal overlap, regardless of completion order (#1094). Other concurrent mutations remain open.
  - [x] Roll back a rejected searched-card addition and show retry feedback without recreating a deleted deck (#1090). Broader overlapping mutation ownership remains open.
  - [x] Suppress failed zone-move feedback after the card itself has been removed, without changing recovery for cards still in the deck (#1027). Broader concurrent mutation ownership remains open.
  - [x] Suppress failed zone-move feedback after its deck has been removed, without changing recovery for existing decks (#1025). Broader concurrent mutation ownership remains open.
  - [x] Ignore bulk removal identifiers absent from the active deck; entirely stale selections preserve the deck and save activity without requests (#943). Cross-batch ownership remains open.
  - [x] Deduplicate card identifiers within bulk removals to avoid duplicate requests and conflicting recovery for one card (#941). Cross-batch ownership remains open.
  - [x] Group rejected bulk removal feedback into one retry notification after the batch finishes, preserving individual recovery and suppressing feedback for deleted decks (#939). Overlapping removal ownership remains open.
  - [x] Restore rejected bulk removals before their next surviving original card, preserving relative order across out-of-order failures and retaining successful removals (#937). Overlapping removal recovery and aggregate failure feedback remain open.
  - [x] Recover rejected bulk card removals independently with original zone and quantity, retry feedback, successful removals preserved and no recreation of deleted decks (#935). Original ordering, overlapping recovery and aggregate failure feedback remain open; bulk undo behavior is unchanged.
  - [x] Restore the previous displayed manual bracket after a rejected override or return to automatic calculation when the attempted value remains current, with retry feedback; preserve a different newer setting and leave deleted decks absent (#931). General write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed budget after a rejected save or clear when the attempted value remains current, with retry feedback; preserve a different newer budget and leave deleted decks absent (#929). General budget-write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed target bracket after a rejected save when the attempted value remains current, with retry feedback; preserve a different newer target and leave deleted decks absent (#927). General target-write serialization, repeated identical values and confirmed-baseline recovery remain open.
  - [x] Restore the previous displayed deck name after a failed rename when the attempted name is still current, with retry feedback; preserve a different newer name and do not recreate deleted decks (#925). General rename serialization, repeated identical names and confirmed-baseline recovery remain open.
  - [x] Ignore save refresh responses after their deck has been deleted, without recreating the deck or announcing success; rejected deletion still permits refresh (#921). Broader stale-response ownership and concurrent edits remain open.
  - [x] Suppress obsolete success feedback when addition/removal undo completes after its deck was deleted, without recreating the deck (#919). Broader unloading, late-response ownership and mutation concurrency remain open.
  - [x] Discard failed in-flight addition/removal undo retries after their deck has been successfully deleted (#917). Successful late responses, unloading races and broader mutation ownership remain open.
  - [x] Remove a successfully deleted deck's undo entries without blocking other decks; rejected deletion preserves the deck and history (#915). Concurrent deletion and in-flight undo remain open.
  - [x] Prioritize the recorded card ID when undoing additions across same-name printings (#905).
  - [x] Preserve cards and undo actions when legacy name-only matching has multiple candidates (#907). Broader undo concurrency remains open.
  - [x] Preserve undo additions/removals when their original deck is unloaded, asking the player to open it before retrying and issuing no mutation (#901). Broader undo concurrency remains open.
  - [x] Discard obsolete removal undo when the same saved card is already present, without duplicating it or changing zone/quantity (#899). Broader concurrency remains open.
  - [x] Use the original printing ID and returned saved row ID when undo restores a removal, keeping subsequent edits/removals usable (#897). Broader undo concurrency remains open.
  - [x] Remove unsaved restored cards and retain retry actions after failed undo removals, without false success notifications (#895). Concurrent undo and mutation ownership remain open.
  - [x] Restore cards and retry actions when undoing an addition fails, without a false success notification (#893). Broader undo concurrency and ordering remain open.
  - [x] Apply undo additions/removals to their recorded deck after a deck switch, preserving the current selection and unrelated deck (#891). Broader undo failure/concurrency remains open.
  - [x] Preserve the relative card order during rejected removal recovery, keeping concurrent successful removals and their undo entries (#889). Broader concurrency coverage remains open.
  - [x] Restore rejected card removals with their zone and quantity and remove the failed operation's undo entry (#887). Wider remove/undo concurrency remains open.
  - [x] Restore the previously displayed category after a failed category edit when it still matches the attempted value, with a retry notification (#880).
  - [x] Serialize category writes per card and restore the last confirmed category after failed rapid edits (#882). Broader mutation recovery remains open.
  - [x] Serialize card-note saves and restore the last confirmed note after a failed latest edit (#872).
  - [x] Recover individual failed bulk zone moves without rolling back successfully saved cards (#871). Broader mutation recovery remains open.
- [ ] Add Docker-backed E2E coverage for add, move, reload and recovery flows.
  - [x] Verify a rejected searched-card addition disappears, remains absent after reload, and can be retried successfully in Docker-backed Playwright (#1090). Other recovery variants remain open.
  - [x] Verify a rejected Sideboard-to-Considering move retains its card and saved zone after reload in Docker-backed Playwright (#1029). Other add-flow and recovery E2E remain open.
  - [x] Verify a searched card is added to Main, persisted through the API and still present after reload in Docker-backed Playwright (#1031). Other add/recovery variants remain open.
  - [x] Verify a Considering card survives reload, a Main-to-Considering move persists, and a rejected move restores the card (#1270). Pointer-drag coverage and further zone combinations remain open.
- [x] Add keyboard and mobile alternatives for every drag action.
  - [x] Provide card-specific Main → Sideboard/Considering controls in grid and list views (#970).
  - [x] Enable keyboard sorting for categorized deck cards using the reorder handle and standard vertical controls (#997).
  - [x] Change a categorized card from a touch-friendly menu in the grouped list, without drag and drop (#999).
  - [x] Move Sideboard and Considering cards to either legal destination from grid or list view with controls that remain visible on touch devices (#1001).
  - [x] Keep Main-grid moves to Sideboard and Considering, plus card removal, visible and reachable on touch devices (#1003).
  - [x] Change Main-card categories directly in grid view with an accessible touch-friendly selector (#1005).
  - [x] Keep category editing available when the Main list is grouped by mana value or color (#1007).
  - [x] Complete mobile alternatives for the remaining drag-only actions. Search results have a keyboard and touch zone menu, and grid cards keep move, remove and category actions without dragging (#1264, promoted to `main` in #1273).
- [x] Add a compact activity indicator instead of blocking the whole editor during saves.
  - [x] Preserve shared activity between bulk removal and manual bracket saves regardless of which action finishes first (#947). Other action combinations and mutation ownership remain open.
  - [x] Retain save activity until all overlapping bulk removal batches finish (#945). Cross-action activity tracking and overlapping recovery ownership remain open.
  - [x] Keep the indicator active until all overlapping manual bracket saves finish, including rejected requests (#933). Cross-action accounting and server write ordering remain open.
  - [x] Keep the existing compact indicator active across concurrent zone writes and overlapping card-note saves (#870, #874). Activity tracking for other mutation types remains open.
  - [x] Preserve pending quantity, note and zone save activity regardless of which write finishes first (#877, #878). Other mutation types remain outside this coverage.
- [x] Organize decks into user-defined folders, with move, filter and bulk-move actions.
- [x] Save reusable card packages such as mana bases, interaction suites or tribal cores and preview their legal additions before applying them.
- [x] Honor existing named capped-copy exceptions in singleton card packages, counting existing copies and quantities across printings (#850).
- [x] Apply existing format copy limits to non-singleton card packages, combining deck and package quantities across printings (#852).
- [x] Honor Oracle-text multiple-copy exceptions in packages using canonical Scryfall data, never stored author metadata (#854). The existing policy ceiling of 99 copies remains unchanged.
- [x] Limit canonically restricted package cards to one copy, including existing deck quantities; a single restricted card remains allowed (#859).
- [x] Add a required-token and emblem summary derived from the current deck, with export support.
- [ ] Save card notes on a signed-in deck. `patchCardSchema` (`src/lib/validation/card.ts`) has no `notes` field, so zod drops it, and `updateCardNotes` (`src/lib/db/deck-api.ts`) reports success while the server saves nothing. Found by the 2026-11-10 security audit. Once notes save, the fork leak under I-08 (L1) becomes medium, so fix that first.
  - [ ] Save card notes again (fix branch `fix/deck-card-notes-saved` queued, 2026-11-11).
- [x] Make bulk edit apply only what changed. Saving in `src/components/deck/BulkEditModal.tsx` called `removeAllCards`, cleared the commander, partner and companion, then re-added every line by name, one request per card, and `exportToText` (`src/lib/deck/import.ts`) writes only `quantity name`. Every save therefore reset printings to Scryfall's default, re-derived categories and dropped notes, unchanged lines included. The requests were not one transaction, so a failure after the delete left a partial deck. Shipped in #1314: the save compares the text with the deck line by line (`src/lib/deck/bulk-edit.ts`), unchanged lines keep their rows, printings, categories and notes, and the change set is applied in one transaction by `PATCH /api/decks/[id]/cards`, which answers 409 on a stale row and writes nothing. A printing typed in the text is still not applied. The full diff-and-apply bulk edit, with printing, finish and tags in the line syntax, is [I-37](i37-editor-depth.md) slice 16.
- [ ] Deleting a deck moves it to a trash the owner can restore it from for N days ([D-92](../owner-decisions.md#community-and-moderation)), then purges it; folders gain bulk delete into the same trash. Moxfield restores deleted decks (`RESTORE_DELETED_DECK`, code, 2026-05-14), and r/Moxfield asked to delete "literally hundreds of old decks" at once ([thread](https://www.reddit.com/r/Moxfield/comments/1wsnch7/), 2026-09-28). `Deck` has no deleted, archived or locked field (`prisma/schema.prisma`). Whether the trash fits erasure is [L-52](../legal-questions.md#l-52-a-deck-trash-and-the-right-to-erasure). Added 2026-11-11.
- [ ] Archive a deck: hidden from the library, pickers and pod lists, never deleted, restored in one action. TopDecked archives and colour-codes decks ([App Store](https://apps.apple.com/us/app/topdecked-mtg/id1173388234), seen 2026-11-10). Added 2026-11-11.
- [ ] Lock a deck's card list until its owner unlocks it, with notes and proxy marks still editable; I-50 slice 10's deck check link freezes the locked list for the pod. ManaBox locks decks ([FAQ](https://manabox.app/guides/decks/faq/), seen 2026-11-10; [4.3.0](https://apps.apple.com/us/app/manabox-mtg/id1460407674), 2026-11-03). Added 2026-11-11.
- [ ] Once a commander is set, builder search defaults to its colour identity, with one visible chip to widen it. `DEFAULT_FILTERS.colors` is empty and nothing sets it from the commander (`src/app/[locale]/builder/[deckId]/page.tsx`). Arena's Brawl builder narrows to the commander's identity ([Draftsim](https://draftsim.com/mtg-arena-brawl-guide/), updated 2025-12-22, search summary). Added 2026-11-11.
- [ ] **Owner decision, 2026-11-10: re-mount the orphaned deck fields.** The deck's tags, description, target bracket, budget, inline card notes and owned/buy badges are to be shown and editable again where the editor lost them ([decided](../owner-decisions.md#decided-on-2026-11-10)). The badges also concern [I-06](i06-collection-and-purchase-planning.md), and the tags [I-37](i37-editor-depth.md).

**2026-11-09:** the editor-depth gaps found against Moxfield and Archidekt are tracked in [I-37](i37-editor-depth.md), not here. They include Stacks, Table and Text views, collapsible and sticky categories, global and Oracle tags, text bulk edit with printing and foil, a cross-deck clipboard, an automatic per-change history, multi-select category assignment and a mobile editing toolbar. I-01 keeps zone integrity, recovery and their E2E coverage. `DeckCard` has no foil, finish or language field (`prisma/schema.prisma`), so a faithful bulk edit or import of those attributes needs a model change first.

**Twelfth pass, 2026-11-11:** Archidekt's feature board, seen that day, still has subcategories at 240 points and non-English printings at 140. Both are already [I-37](i37-editor-depth.md): nesting was added on 2026-11-11, and slice 12 stores language. Custom card art, 207 points, is [I-85](i85-player-supplied-art-that-never-replaces-the-card.md). Cube at 507 points and the separate "Custom cards" item stay non-goals. Concurrent recovery is done when two overlapping writes of different fields each roll back to the last confirmed value for that field.

### Engineering enablers

- One canonical DeckCard.zone model; compatibility mirrors must not become a second source of truth.
- Fine-grained Zustand selectors so card movements do not refresh the whole editor.
- Serialized writes per deck and idempotent zone updates.
- Tests for hydration, duplicate prevention, failed writes and reload persistence.

### Enrichment (2026-11-11)

**User story.** As a player editing a deck, I want a failed save to put the card back where it was, so that a reload never loses or duplicates it.

**Acceptance.**
- Moving a card between Main, Sideboard and Considering, then reloading, shows the same zone and quantity.
- Two overlapping writes of different fields each roll back to the last confirmed value for that field.
- A signed-in card note survives reload, or the editor says it did not save.

**UX.** The save indicator stays up until the last write finishes. A failure names the field. Drag, keyboard and touch all land on the same zone.

**Data and API.** The saved zone on the deck card is the only source of truth. Notes need a field `patchCardSchema` currently drops. No new public route.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `editor_save_failed {field, recovered: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in only for persistence. A guest keeps the deck in the session until I-39's sign-up handoff. No flag: this is the editor itself.

**Open questions.** Whether a 30-day trash is compatible with erasure stays L-52.

**Kill criteria.** Stop new editor views, including I-37, if a reload can still lose or duplicate a card.

### Definition of done

A user can move a card between every legal zone, reload the page, change its printing, undo a move and recover from a failed request without a lost or duplicated card.

---

