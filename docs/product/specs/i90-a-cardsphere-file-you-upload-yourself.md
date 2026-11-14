# I-90: A Cardsphere File You Upload Yourself

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

### Goals

- The fixture CSV header matches the sample minus Offer and Limit, a want row has an empty offer because the column is gone, and the page contains the paused-import warning in English and French.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-90-01

As a player who uses Cardsphere, I want a file I can upload there myself, so that this product never sets an offer or sends a card.

#### US-90-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-90-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-90-01 Happy path

Given a signed-in player and the English locale
When the header matches Cardsphere's sample without Offer and without Limit.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-90-02 Happy path

Given a signed-in player and the English locale
When the page tells the player to import wants as paused, in English and French.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-90-03 Happy path

Given a signed-in player and the English locale
When the CSV has no comment line and no offer column.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-90-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-90-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-90-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. It does not start before the plan exists. No flag. Guests have nothing to export.

#### AC-90-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-90-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-90-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Two downloads, haves and wants. The warning is on the download page, not inside the file.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Built from the acquisition plan and, for haves, from I-45's spares or from rows the player selects. No Cardsphere account and no login.

### Analytics and telemetry

`cardsphere_file_downloaded {kind: haves or wants}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. It does not start before the plan exists. No flag. Guests have nothing to export.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A Scryfall id column waits until the header name is read from a current sample. The sample read on 2026-11-11 did not name it.

### Sources

- https://blog.cardsphere.com/how-to-use-csv-files-on-cardsphere/
- https://blog.cardsphere.com/how-to-create-and-manage-a-buylist-on-cardsphere/
- https://www.cardsphere.com/changelog

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-90-101

As a player, I want the product to two downloads, haves and wants., so that a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

#### AC-90-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Two downloads, haves and wants. The header is the sample header without Offer and without Limit. Conditions is empty until I-89. The page tells the player to import wants as paused. The CSV has no comment line.

#### AC-90-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-90-102 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-90-102

As a player, I want the product to no Cardsphere account, no login, no offer, no limit, and no sending of cards., so that a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

#### AC-90-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: No Cardsphere account, no login, no offer, no limit, and no sending of cards. The player uploads the file on Cardsphere's own site.

#### AC-90-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-90-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-90-103

As a player, I want the product to a Scryfall ID column is added only after its header is read from a current Cardsphere sample., so that a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

#### AC-90-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A Scryfall ID column is added only after its header is read from a current Cardsphere sample. Until then it is absent.

#### AC-90-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-90-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

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

## I-90: A Cardsphere File You Upload Yourself

**Outcome:** a player can download a CSV of cards they might trade away and cards they want, in columns Cardsphere already documents, and upload it on Cardsphere's site themselves.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / small
**Risk:** Medium. Cardsphere's own guide says a want list without an offer imports at 100% of index and can cause cards to be sent at a price the player did not intend. The file must not carry an offer, and the page must say to import wants as paused.
**Depends on:** the acquisition plan for wants. I-45's spare list for haves, once it exists; until then the player picks collection rows. I-89's grade when it exists; until then Conditions is empty.

Cardsphere documents CSV import and export of haves and wants ([guide](https://blog.cardsphere.com/how-to-use-csv-files-on-cardsphere/), read 2026-11-11). Its sample header is `Quantity,Name,Sets,Conditions,Languages,Finishes,Paused,Tags,Offer,Limit`. Its buylist guide says wants imported without Offer and Limit come in at 100% of index, and tells the receiver to import as paused ([buylist](https://blog.cardsphere.com/how-to-create-and-manage-a-buylist-on-cardsphere/), read 2026-11-11). The changelog entry of 2025-10-17 says Scryfall IDs are accepted on want import ([changelog](https://www.cardsphere.com/changelog)). The header name for that column was not on the sample file read the same day, so this initiative does not invent one.

### Scope

- [ ] Two downloads, haves and wants. The header is the sample header without `Offer` and without `Limit`. Conditions is empty until I-89. The page tells the player to import wants as paused. The CSV has no comment line.
- [ ] No Cardsphere account, no login, no offer, no limit, and no sending of cards. The player uploads the file on Cardsphere's own site.
- [ ] A Scryfall ID column is added only after its header is read from a current Cardsphere sample. Until then it is absent.

### Enrichment (2026-11-11)

**User story.** As a player who uses Cardsphere, I want a file I can upload there myself, so that this product never sets an offer or sends a card.

**Acceptance.**

- The header matches Cardsphere's sample without Offer and without Limit.
- The page tells the player to import wants as paused, in English and French.
- The CSV has no comment line and no offer column.

**UX.** Two downloads, haves and wants. The warning is on the download page, not inside the file.

**Data and API.** Built from the acquisition plan and, for haves, from I-45's spares or from rows the player selects. No Cardsphere account and no login.

**i18n and access.** The warning is in both catalogues. Card names in the file stay the oracle names Cardsphere's sample uses, not a translated name.

**Telemetry.** `cardsphere_file_downloaded {kind: haves or wants}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. It does not start before the plan exists. No flag. Guests have nothing to export.

**Open questions.** A Scryfall id column waits until the header name is read from a current sample. The sample read on 2026-11-11 did not name it.

### Fourteenth pass (2026-11-14)

Archidekt's update of 2026-11-12 lets a player pick Cardsphere on the buy or sell menu ([news 28409148](https://archidekt.com/news/28409148)). A comment on that update, ShoeWOOBERG at 2026-11-12T23:17:15Z, is the sentence "Hell yeah, Cardsphere price source!" The file this initiative writes is still a file the player uploads on Cardsphere's site. The menu on Archidekt does not change that.

#### US-90-14-01

As a player sending wants to Cardsphere, I want a file I upload myself, so that this product never places the offer.

**Passing.** The downloaded file matches the sample's columns this spec already fixed. The page tells the player to upload it. No request is sent to Cardsphere.

**Non-passing.** A button that submits the file. An offer column filled in because Archidekt's menu has a Cardsphere option. Their menu is not our contract. The warning about an offerless want importing at 100 percent of index stays.

**Open question.** Unchanged. The sample's header is still the source of the columns.

### Definition of done

The fixture CSV header matches the sample minus Offer and Limit, a want row has an empty offer because the column is gone, and the page contains the paused-import warning in English and French.

---
