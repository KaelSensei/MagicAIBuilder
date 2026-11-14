# I-96: Two Labelled Prices, And No Conversion

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

### Goals

- A card ingested with both amounts shows both labels, a card with only dollars shows "no EUR from Scryfall", and no screen contains a converted figure.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-96-01

As a player looking at a price, I want the dollar amount and the euro amount when Scryfall sent both, so that nobody converts one into the other for me.

#### US-96-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-96-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-96-01 Happy path

Given a signed-in player and the English locale
When both amounts are labelled Scryfall, not a quote.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-96-02 Happy path

Given a signed-in player and the English locale
When a missing amount says it is missing, not zero.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-96-03 Happy path

Given a signed-in player and the English locale
When no screen shows a converted figure.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-96-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-96-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-96-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for guests and signed-in players. No flag. MTGO tickets stay out of this initiative.

#### AC-96-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-96-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-96-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The two amounts sit together on the card and on the deck total. The acquisition plan keeps the one currency I-06 already chose, labelled.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Store the euro amount beside the dollar amount at ingest. `prices.usd` is what the code reads today. No conversion function is added.

### Analytics and telemetry

`price_shown {currencies: one or two}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for guests and signed-in players. No flag. MTGO tickets stay out of this initiative.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Which of the two the acquisition plan uses is unchanged and still I-06 and I-32.

### Sources

- https://scryfall.com/docs/api/cards

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-96-101

As a player, I want the product to on a card and on a deck total, show USD and EUR when both were stored., so that where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

#### AC-96-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: On a card and on a deck total, show USD and EUR when both were stored. Each amount is labelled "Scryfall, not a quote". An amount the source did not send is "no USD from Scryfall" or "no EUR from Scryfall", not a zero.

#### AC-96-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-96-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-96-102

As a player, I want the product to store the euro amount beside the dollar amount when a card is added., so that where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

#### AC-96-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Store the euro amount beside the dollar amount when a card is added. Do not convert. Do not display MTGO tickets in this initiative.

#### AC-96-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-96-105 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-96-103

As a player, I want the product to the acquisition plan keeps one currency, chosen and labelled, under I-06., so that where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

#### AC-96-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The acquisition plan keeps one currency, chosen and labelled, under I-06. This initiative does not change that choice.

#### AC-96-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-96-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

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

## I-96: Two Labelled Prices, And No Conversion

**Outcome:** where Scryfall provides both a dollar amount and a euro amount, the card shows both, each named as Scryfall's figure, and the product never converts one into the other.

**Status:** Next
**Priority:** Next. It is a display of a field the source already sends.
**Impact / effort:** Medium / small
**Risk:** Low if the labels stay. High if a toggle silently converts, which this initiative forbids.
**Depends on:** nothing for the display. I-06 and I-32 still choose the single currency of the acquisition plan. I-59's history, when it exists, is per currency and does not mix them.

`src/lib/deck/pricing.ts` documents that every ingest reads Scryfall's `prices.usd`. I-06 records that nothing reads the euro amount. Scryfall's card object is the source of both ([cards](https://scryfall.com/docs/api/cards), read 2026-11-11). Moxfield shows more than one currency; that was established in the 9 November pass. Showing both without a conversion is the trust line I-11 already asks for and nobody has built.

### Scope

- [ ] On a card and on a deck total, show USD and EUR when both were stored. Each amount is labelled "Scryfall, not a quote". An amount the source did not send is "no USD from Scryfall" or "no EUR from Scryfall", not a zero.
- [ ] Store the euro amount beside the dollar amount when a card is added. Do not convert. Do not display MTGO tickets in this initiative.
- [ ] The acquisition plan keeps one currency, chosen and labelled, under I-06. This initiative does not change that choice.

### Enrichment (2026-11-11)

**User story.** As a player looking at a price, I want the dollar amount and the euro amount when Scryfall sent both, so that nobody converts one into the other for me.

**Acceptance.**

- Both amounts are labelled Scryfall, not a quote.
- A missing amount says it is missing, not zero.
- No screen shows a converted figure.

**UX.** The two amounts sit together on the card and on the deck total. The acquisition plan keeps the one currency I-06 already chose, labelled.

**Data and API.** Store the euro amount beside the dollar amount at ingest. `prices.usd` is what the code reads today. No conversion function is added.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `price_shown {currencies: one or two}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for guests and signed-in players. No flag. MTGO tickets stay out of this initiative.

**Open questions.** Which of the two the acquisition plan uses is unchanged and still I-06 and I-32.

### Fourteenth pass (2026-11-14)

Archidekt's update of 2026-11-12 adds Cardsphere as a price source for decks and collections ([news 28409148](https://archidekt.com/news/28409148)). A third amount is still an amount with a name. It is not a rate into dollars or euros.

#### US-96-14-01

As a player who wants a Cardsphere figure beside Scryfall's, I want each figure's source in the label, so that the two are never added together.

**Passing.** If a later decision allows a Cardsphere amount, the label is "Cardsphere", with the date, and the Scryfall dollar and euro labels are unchanged. No control adds them. A missing Cardsphere amount says it is missing.

**Non-passing.** A single "price" that is the sum or the conversion. A Cardsphere amount shown before the terms are read. I-32's open question records that the terms were not read on 2026-11-14, so the amount is not shown yet. The acceptance is the label rule for the day it is.

**Open question.** Whether to show the third amount at all waits on those terms. This initiative does not fetch Cardsphere.

### Definition of done

A card ingested with both amounts shows both labels, a card with only dollars shows "no EUR from Scryfall", and no screen contains a converted figure.

---
