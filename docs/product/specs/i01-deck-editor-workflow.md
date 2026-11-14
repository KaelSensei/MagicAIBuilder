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

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-01-101

As a player, I want the product to persist main, sideboard and maybeboard zones as the single database source of truth., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Persist main, sideboard and maybeboard zones as the single database source of truth. The saved card zone wins over the legacy maybeboard mirror, and that mirror is derived from the zone (#1263, promoted to main in #1273).

#### AC-01-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-102

As a player, I want the product to preserve zone and quantity when changing a card printing., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Preserve zone and quantity when changing a card printing.

#### AC-01-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-103

As a player, I want the product to restore the previous card printing and notify the player when its save fails., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Restore the previous card printing and notify the player when its save fails.

#### AC-01-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-104

As a player, I want the product to complete cross-zone drag and drop with clear drop targets and no layout jump., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Complete cross-zone drag and drop with clear drop targets and no layout jump. Zone targets stay mounted and do not resize, and the smallest target under the pointer wins (#1264, promoted to main in #1273).

#### AC-01-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-105

As a player, I want the product to keep optimistic updates, undo and failed-save recovery consistent., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep optimistic updates, undo and failed-save recovery consistent.

#### AC-01-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-106

As a player, I want the product to add Docker-backed E2E coverage for add, move, reload and recovery flows., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add Docker-backed E2E coverage for add, move, reload and recovery flows.

#### AC-01-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-107

As a player, I want the product to add keyboard and mobile alternatives for every drag action., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add keyboard and mobile alternatives for every drag action.

#### AC-01-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-108

As a player, I want the product to add a compact activity indicator instead of blocking the whole editor during saves., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add a compact activity indicator instead of blocking the whole editor during saves.

#### AC-01-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-109

As a player, I want the product to organize decks into user-defined folders, with move, filter and bulk-move actions., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Organize decks into user-defined folders, with move, filter and bulk-move actions.

#### AC-01-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-110

As a player, I want the product to save reusable card packages such as mana bases, interaction suites or tribal cores and preview their legal additions before applying them., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Save reusable card packages such as mana bases, interaction suites or tribal cores and preview their legal additions before applying them.

#### AC-01-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-111

As a player, I want the product to honor existing named capped-copy exceptions in singleton card packages, counting existing copies and quantities across printings (#850)., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Honor existing named capped-copy exceptions in singleton card packages, counting existing copies and quantities across printings (#850).

#### AC-01-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-112

As a player, I want the product to apply existing format copy limits to non-singleton card packages, combining deck and package quantities across printings (#852)., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Apply existing format copy limits to non-singleton card packages, combining deck and package quantities across printings (#852).

#### AC-01-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-113

As a player, I want the product to honor Oracle-text multiple-copy exceptions in packages using canonical Scryfall data, never stored author metadata (#854)., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Honor Oracle-text multiple-copy exceptions in packages using canonical Scryfall data, never stored author metadata (#854). The existing policy ceiling of 99 copies remains unchanged.

#### AC-01-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-138 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-114

As a player, I want the product to limit canonically restricted package cards to one copy, including existing deck quantities; a single restricted card remains allowed (#859)., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Limit canonically restricted package cards to one copy, including existing deck quantities; a single restricted card remains allowed (#859).

#### AC-01-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-141 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-115

As a player, I want the product to add a required-token and emblem summary derived from the current deck, with export support., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add a required-token and emblem summary derived from the current deck, with export support.

#### AC-01-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-144 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-116

As a player, I want the product to save card notes on a signed-in deck., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Save card notes on a signed-in deck. patchCardSchema (src/lib/validation/card.ts) has no notes field, so zod drops it, and updateCardNotes (src/lib/db/deck-api.ts) reports success while the server saves nothing. Found by the 2026-11-10 security audit. Once notes save, the fork leak under I-08 (L1) becomes medium, so fix that first.

#### AC-01-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-147 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-01-117

As a player, I want the product to make bulk edit apply only what changed., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-148 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make bulk edit apply only what changed. Saving in src/components/deck/BulkEditModal.tsx called removeAllCards, cleared the commander, partner and companion, then re-added every line by name, one request per card, and exportToText (src/lib/deck/import.ts) writes only quantity name. Every save therefore reset printings to Scryfall's default, re-derived categories and dropped notes, unchanged lines included. The requests were not one transaction, so a failure after the delete left a partial deck. Shipped in #1314: the save compares the text with the deck line by line (src/lib/deck/bulk-edit.ts), unchanged lines keep their rows, printings, categories and notes, and the change set is applied in one transaction by PATCH /api/decks/[id]/cards, which answers 409 on a stale row and writes nothing. A printing typed in the text is still not applied. The full diff-and-apply bulk edit, with printing, finish and tags in the line syntax, is I-37 slice 16.

#### AC-01-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-150 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-01-118

As a player, I want the product to deleting a deck moves it to a trash the owner can restore it from for N days (D-92), then purges it; folders gain bulk delete into the same trash., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-151 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Deleting a deck moves it to a trash the owner can restore it from for N days (D-92), then purges it; folders gain bulk delete into the same trash. Moxfield restores deleted decks (RESTORE_DELETED_DECK, code, 2026-05-14), and r/Moxfield asked to delete "literally hundreds of old decks" at once (thread, 2026-09-28). Deck has no deleted, archived or locked field (prisma/schema.prisma). Whether the trash fits erasure is L-52. Added 2026-11-11.

#### AC-01-152 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-153 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-01-119

As a player, I want the product to archive a deck: hidden from the library, pickers and pod lists, never deleted, restored in one action., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-154 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Archive a deck: hidden from the library, pickers and pod lists, never deleted, restored in one action. TopDecked archives and colour-codes decks (App Store, seen 2026-11-10). Added 2026-11-11.

#### AC-01-155 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-156 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-01-120

As a player, I want the product to lock a deck's card list until its owner unlocks it, with notes and proxy marks still editable; I-50 slice 10's deck check link freezes the locked list for the pod., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-157 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Lock a deck's card list until its owner unlocks it, with notes and proxy marks still editable; I-50 slice 10's deck check link freezes the locked list for the pod. ManaBox locks decks (FAQ, seen 2026-11-10; 4.3.0, 2026-11-03). Added 2026-11-11.

#### AC-01-158 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-159 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-01-121

As a player, I want the product to once a commander is set, builder search defaults to its colour identity, with one visible chip to widen it., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-160 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Once a commander is set, builder search defaults to its colour identity, with one visible chip to widen it. DEFAULT_FILTERS.colors is empty and nothing sets it from the commander (src/app/[locale]/builder/[deckId]/page.tsx). Arena's Brawl builder narrows to the commander's identity (Draftsim, updated 2025-12-22, search summary). Added 2026-11-11.

#### AC-01-161 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-162 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-01-122

As a player, I want **Owner decision, 2026-11-10: re-mount the orphaned deck fields.** The deck's tags, description, target bracket, budget, inline card notes and owned/buy badges are to be shown and editable again where the editor lost them (decided)., so that a player can build, reorganize and refine a deck without losing cards, context or intent.

#### AC-01-163 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner decision, 2026-11-10: re-mount the orphaned deck fields.** The deck's tags, description, target bracket, budget, inline card notes and owned/buy badges are to be shown and editable again where the editor lost them (decided). The badges also concern I-06, and the tags I-37.

#### AC-01-164 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-01-165 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: a player can build, reorganize and refine a deck without losing cards, context or intent.

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

**Fourteenth pass, 2026-11-14.** Archidekt's update of 2026-11-12 lets a folder name contain a mana symbol typed as `{W}`, `{U}`, `{B}`, `{R}` or `{G}` ([news 28409148](https://archidekt.com/news/28409148)). Folders are this initiative's. The symbol is display, not a colour filter.

- [ ] A folder name may include the five tokens `{W}`, `{U}`, `{B}`, `{R}` and `{G}`. The library renders each as the mana symbol and as the letter, so the name is readable without the symbol. A token the renderer does not know stays as the characters the player typed. The folder's identity is its id, not the name. Added 2026-11-14.

#### US-01-14-01

As a player naming a folder, I want `{U}` to show as a blue mana symbol, so that a folder of blue decks is recognisable in the list.

**Passing.** The stored name is the characters the player typed, including the braces. The library shows the symbol and a text alternative. Search by the folder's words still finds it.

**Non-passing.** The token is the only label, with no text. An unknown token such as `{C}` or `{2}` is deleted. The symbol changes which decks the folder contains. Membership stays an explicit move.

**Open question.** Archidekt names only the five coloured symbols. Hybrid, colourless and numbered symbols are not in their sentence. Recommended: render the five, and leave every other brace pair as text, until a player asks for the rest.

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
