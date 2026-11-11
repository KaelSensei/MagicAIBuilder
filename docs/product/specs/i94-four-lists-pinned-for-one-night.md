# I-94: Four Lists Pinned For One Night

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

### Goals

- A host pins four public decks, a fifth is refused, a private deck they do not own is refused, and sign-out leaves none of the four on the device.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-94-01

As a host, I want up to four lists the table is allowed to see, saved for the evening, so that I am not editing anyone else's deck.

#### US-94-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-94-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-94-01 Happy path

Given a signed-in player and the English locale
When a fifth pin is refused.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-94-02 Happy path

Given a signed-in player and the English locale
When a private deck the host does not own is refused.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-94-03 Happy path

Given a signed-in player and the English locale
When sign-out deletes the downloads.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-94-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-94-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-94-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in to pin. The downloaded projections are readable offline by that browser until sign-out. Flag off until the purge test includes four projections.

#### AC-94-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-94-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-94-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A night page with four slots. Download is explicit. The cached view includes I-93 when that exists, and has no editor.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Stores the public projection only. The download uses I-19's purge rules. It does not raise I-19's one editable deck.

### Analytics and telemetry

`night_pins_set {count: 1 to 4}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in to pin. The downloaded projections are readable offline by that browser until sign-out. Flag off until the purge test includes four projections.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Linking a pin to I-15's calendar night is optional and does not block the pin.

### Sources

- https://playgroup.gg/posts/101-the-new-playgroup-app-and-everything-else-since-july

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-94-101

As a player, I want the product to pin up to four decks from public pages or from share links the host holds., so that a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

#### AC-94-100 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Pin up to four decks from public pages or from share links the host holds. A fifth pin is refused. A private deck the host does not own is refused.

#### AC-94-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-94-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-94-102

As a player, I want the product to the pin stores the public projection only., so that a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

#### AC-94-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The pin stores the public projection only. An explicit download caches those projections for reading, including I-93's view. It does not raise I-19's limit of one editable deck, because these are not editable.

#### AC-94-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-94-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-94-103

As a player, I want the product to sign-out deletes the downloads., so that a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

#### AC-94-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Sign-out deletes the downloads. The host can clear the night in one action.

#### AC-94-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-94-108 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

### UX states for this feature

The player-visible outcome is: a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

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

## I-94: Four Lists Pinned For One Night

**Outcome:** a host can pin up to four decks the table is allowed to see, download those public projections for the evening, and drop them when the night is over.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Risk:** Medium. Pinning someone else's private list, or keeping four decks after sign-out, would break I-19's purge and I-08's projection.
**Depends on:** the public and share projections. I-19's cache rules for the download. I-15's night planner can link a pin to a date once that planner exists; the pin works without it.

I-19 caches one deck the player chose, and its non-goal is a multi-deck offline editor. I-79 is a set of the author's own decks, behind a demand gate. A host on the night needs to read other people's lists, not edit them. Playgroup added a calendar for recurring nights on 2026-11-04 ([post](https://playgroup.gg/posts/101-the-new-playgroup-app-and-everything-else-since-july)); scheduling stays on I-15.

### Scope

- [ ] Pin up to four decks from public pages or from share links the host holds. A fifth pin is refused. A private deck the host does not own is refused.
- [ ] The pin stores the public projection only. An explicit download caches those projections for reading, including I-93's view. It does not raise I-19's limit of one editable deck, because these are not editable.
- [ ] Sign-out deletes the downloads. The host can clear the night in one action.

### Enrichment (2026-11-11)

**User story.** As a host, I want up to four lists the table is allowed to see, saved for the evening, so that I am not editing anyone else's deck.

**Acceptance.**
- A fifth pin is refused.
- A private deck the host does not own is refused.
- Sign-out deletes the downloads.

**UX.** A night page with four slots. Download is explicit. The cached view includes I-93 when that exists, and has no editor.

**Data and API.** Stores the public projection only. The download uses I-19's purge rules. It does not raise I-19's one editable deck.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `night_pins_set {count: 1 to 4}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in to pin. The downloaded projections are readable offline by that browser until sign-out. Flag off until the purge test includes four projections.

**Open questions.** Linking a pin to I-15's calendar night is optional and does not block the pin.

### Definition of done

A host pins four public decks, a fifth is refused, a private deck they do not own is refused, and sign-out leaves none of the four on the device.

---

