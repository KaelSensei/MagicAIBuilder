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

### Definition of done

The fixture CSV header matches the sample minus Offer and Limit, a want row has an empty offer because the column is gone, and the page contains the paused-import warning in English and French.

---

