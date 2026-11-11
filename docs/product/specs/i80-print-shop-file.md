# I-80: Print-shop file

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

### Goals

- A deck with Sol Ring and a non-basic creature downloads a text file a person can paste into MPC Autofill's text box, every included card appears once per copy, the file has no `scryfall.io` URL, and the home PDF defaults to text with cut marks.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-80-01

As a player allowed to proxy, I want a file of names and quantities a print shop can paste, so that I am not sending them Scryfall's images.

#### US-80-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-80-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-80-01 Happy path

Given a signed-in player and the English locale
When the text file has one line per included card and no image URL.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-80-02 Happy path

Given a signed-in player and the English locale
When the home sheet defaults to text, with cut marks.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-80-03 Happy path

Given a signed-in player and the English locale
When art is not offered until the lawyer question on I-50 is answered.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-80-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-80-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-80-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in for a private deck. A public deck's name file is available to a viewer, still with art off. No flag for the name file.

#### AC-80-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-80-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-80-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A download on the deck. The proxy count and, once I-15 exists, the sheet's proxy answer are shown and do not block the download.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Generated from the deck rows. No new stored file. No order and no payment.

### Analytics and telemetry

`proxy_file_downloaded {art: off, tokens: complete or incomplete}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in for a private deck. A public deck's name file is available to a viewer, still with art off. No flag for the name file.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Token lines stay marked incomplete until I-19's token list is fixed.

### Sources

- https://mpcfill.com/
- https://github.com/chilli-axe/mpc-autofill/wiki/Overview
- https://proxit-tcg.com/guides/order-proxies-from-mpcfill-proxxied
- https://scryfall.com/docs/faqs/how-do-i-print-cards-11

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-80-101

As a player, I want the product to a text file of the cards the player chose to print: quantity, name, and set code plus collector number when the deck row has them., so that a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

#### AC-80-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A text file of the cards the player chose to print: quantity, name, and set code plus collector number when the deck row has them. Basics follow the same switch the PDF already has. The file contains no image URL.

#### AC-80-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-80-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-80-102

As a player, I want the product to append the deck's token and emblem lines once I-19's list is fixed., so that a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

#### AC-80-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Append the deck's token and emblem lines once I-19's list is fixed. Until then, label the token section "incomplete" and ship the names the current list does return.

#### AC-80-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-80-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-80-103

As a player, I want the product to flip the home sheet's default to text, and add cut marks., so that a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

#### AC-80-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Flip the home sheet's default to text, and add cut marks. Art stays an explicit opt-in, and it does not ship until the lawyer question on I-50 about proxying Scryfall images is answered. The opt-in is not built before that answer.

#### AC-80-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-80-108 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-80-104

As a player, I want the product to on the download, show the count of cards marked proxy and, once I-15's sheet exists, whether that sheet allows proxies., so that a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

#### AC-80-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: On the download, show the count of cards marked proxy and, once I-15's sheet exists, whether that sheet allows proxies. The download is not refused when they disagree. The server still does not block an edit for a house rule.

#### AC-80-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-80-111 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

### UX states for this feature

The player-visible outcome is: a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

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

# Twelfth Pass

Nineteen initiatives from the 11 November 2026 pass. The research is [section 13 of the landscape](../competitive-landscape.md#13-a-twelfth-pass-on-commander-tools-2026-11-11). None of them has a spec yet. They do not move ahead of backups, the copilot or the editor.

## I-80: A Proxy File A Print Shop Can Read

**Outcome:** a player who is allowed to proxy can hand a print shop a list of names, quantities and tokens, with no card image in the file, and can print a cut-marked sheet at home with art turned off until the image question is answered.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Risk:** Medium. A file of names is the same fact as an export. A sheet of Scryfall images is the question already open on I-50. Players may still expect art.
**Depends on:** I-06 for a proxy mark that is card state, not only a shopping-list choice; I-19's token list, which is wrong for several tokens today; I-15 so the sheet can say whether the pod allows proxies. The name file itself needs none of those.

The in-app proxy sheet (`src/lib/deck/proxy.ts`) can include Scryfall art, and `includeCardArt` defaults to true. [MPC Autofill](https://mpcfill.com/) is free, GPL-3 software for ordering playtest cards from MakePlayingCards. Its maintainer describes the web editor as the place a player pastes a list and picks art, and the XML as the order file ([overview](https://github.com/chilli-axe/mpc-autofill/wiki/Overview), read 2026-11-11). A print guide tells the player to paste lines such as `1 Sol Ring` ([Proxit](https://proxit-tcg.com/guides/order-proxies-from-mpcfill-proxxied), read 2026-11-11). Scryfall declines proxy printing of its own ([printing FAQ](https://scryfall.com/docs/faqs/how-do-i-print-cards-11), seen 2026-11-10). This initiative stops at the list. It does not pick art, build an XML of images, take payment or place an order.

### Scope

- [ ] A text file of the cards the player chose to print: quantity, name, and set code plus collector number when the deck row has them. Basics follow the same switch the PDF already has. The file contains no image URL.
- [ ] Append the deck's token and emblem lines once I-19's list is fixed. Until then, label the token section "incomplete" and ship the names the current list does return.
- [ ] Flip the home sheet's default to text, and add cut marks. Art stays an explicit opt-in, and it does not ship until the lawyer question on I-50 about proxying Scryfall images is answered. The opt-in is not built before that answer.
- [ ] On the download, show the count of cards marked proxy and, once I-15's sheet exists, whether that sheet allows proxies. The download is not refused when they disagree. The server still does not block an edit for a house rule.

### Enrichment (2026-11-11)

**User story.** As a player allowed to proxy, I want a file of names and quantities a print shop can paste, so that I am not sending them Scryfall's images.

**Acceptance.**
- The text file has one line per included card and no image URL.
- The home sheet defaults to text, with cut marks.
- Art is not offered until the lawyer question on I-50 is answered.

**UX.** A download on the deck. The proxy count and, once I-15 exists, the sheet's proxy answer are shown and do not block the download.

**Data and API.** Generated from the deck rows. No new stored file. No order and no payment.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `proxy_file_downloaded {art: off, tokens: complete or incomplete}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in for a private deck. A public deck's name file is available to a viewer, still with art off. No flag for the name file.

**Open questions.** Token lines stay marked incomplete until I-19's token list is fixed.

### Definition of done

A deck with Sol Ring and a non-basic creature downloads a text file a person can paste into MPC Autofill's text box, every included card appears once per copy, the file has no `scryfall.io` URL, and the home PDF defaults to text with cut marks.

---

