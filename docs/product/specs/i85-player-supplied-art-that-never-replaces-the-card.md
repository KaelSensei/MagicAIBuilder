# I-85: Player-Supplied Art That Never Replaces The Card

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

### Goals

- An owner sees their image on the card, a signed-out viewer does not until the opt-in, and a Cockatrice export of that deck contains no player URL.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-85-01

As a player with art I have the right to use, I want it on one card in my deck, so that a public viewer does not see it unless I say so.

#### US-85-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-85-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-85-01 Happy path

Given a signed-in player and the English locale
When the image is labelled player art.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-85-02 Happy path

Given a signed-in player and the English locale
When the oracle card, the text and the legality do not change.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-85-03 Happy path

Given a signed-in player and the English locale
When exports and I-80's file never include the URL.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-85-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-85-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-85-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. The URL path can exist before storage. Public opt-in stays off until I-38's report path includes it. Guests cannot attach art.

#### AC-85-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-85-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-85-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

An attachment on the card, visible to the owner. Public opt-in is a separate switch, default off.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A URL on the deck card, private. An upload waits on I-71's storage. A report uses I-38.

### Analytics and telemetry

`player_art_set {public: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. The URL path can exist before storage. Public opt-in stays off until I-38's report path includes it. Guests cannot attach art.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The product does not review the image in the first slice. Taking it down is deleting the attachment.

### Sources

- https://archidekt.com/features

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-85-101

As a player, I want the product to the owner attaches one https URL, or an upload once storage exists., so that a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

#### AC-85-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The owner attaches one https URL, or an upload once storage exists. The image is labelled "Player art". The oracle name, the text and the legality stay the official card's.

#### AC-85-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-85-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-85-102

As a player, I want the product to public pages, share links and the Open Graph image omit it unless the owner opts in., so that a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

#### AC-85-103 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Public pages, share links and the Open Graph image omit it unless the owner opts in. Exports to clients and to I-80's files omit it always.

#### AC-85-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-85-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-85-103

As a player, I want the product to a report on a public image uses I-38., so that a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

#### AC-85-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A report on a public image uses I-38. The MVP does not review images. Taking the URL down is removing the attachment.

#### AC-85-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-85-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

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

## I-85: Player-Supplied Art That Never Replaces The Card

**Outcome:** a player can attach an image they have the right to use to one deck card, see it themselves, and keep it off the public page and out of every play export unless they opt in.

**Status:** Later
**Priority:** Later, and the upload waits on the owner's storage choice
**Impact / effort:** Medium / medium
**Risk:** High. The image may be someone else's art, or easy to confuse with a real card. The default has to be private, labelled and absent from exports.
**Depends on:** I-38's report path before a public opt-in. I-71's storage choice before an upload. A pasted `https` URL the player hosts needs neither.

Archidekt's feature board, seen 2026-11-11, has "[Builder] Custom card art" at 207 points and a separate open item, "[Builder] Custom cards" ([features](https://archidekt.com/features)). Custom cards and cubes stay non-goals. This initiative is an image beside an official card, not a new card.

### Scope

- [ ] The owner attaches one `https` URL, or an upload once storage exists. The image is labelled "Player art". The oracle name, the text and the legality stay the official card's.
- [ ] Public pages, share links and the Open Graph image omit it unless the owner opts in. Exports to clients and to I-80's files omit it always.
- [ ] A report on a public image uses I-38. The MVP does not review images. Taking the URL down is removing the attachment.

### Enrichment (2026-11-11)

**User story.** As a player with art I have the right to use, I want it on one card in my deck, so that a public viewer does not see it unless I say so.

**Acceptance.**
- The image is labelled player art.
- The oracle card, the text and the legality do not change.
- Exports and I-80's file never include the URL.

**UX.** An attachment on the card, visible to the owner. Public opt-in is a separate switch, default off.

**Data and API.** A URL on the deck card, private. An upload waits on I-71's storage. A report uses I-38.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `player_art_set {public: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. The URL path can exist before storage. Public opt-in stays off until I-38's report path includes it. Guests cannot attach art.

**Open questions.** The product does not review the image in the first slice. Taking it down is deleting the attachment.

### Definition of done

An owner sees their image on the card, a signed-out viewer does not until the opt-in, and a Cockatrice export of that deck contains no player URL.

---

