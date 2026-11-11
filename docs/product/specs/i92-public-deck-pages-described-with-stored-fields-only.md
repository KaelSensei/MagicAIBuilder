# I-92: Public Deck Pages Described With Stored Fields Only

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

### Goals

- An indexable public deck's structured data parses and contains only visible fields, and a noindex deck response contains no JSON-LD script.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-92-01

As a player sharing a public deck, I want the page's structured data to match the page, so that a search result is not a paragraph we invented.

#### US-92-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-92-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-92-01 Happy path

Given a signed-in player and the English locale
When jSON-LD contains only the name, the commander and the update date, and only when those strings are visible.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-92-02 Happy path

Given a signed-in player and the English locale
When a noindex page, a share page and a private page emit none.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-92-03 Happy path

Given a signed-in player and the English locale
When budget, notes and folder names are absent.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-92-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-92-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-92-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Public indexable decks only. It does not ship before I-34's policy. No flag that adds a FAQ later without a new decision.

#### AC-92-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-92-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-92-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

No FAQ block. No generated sentence. The visible title and the structured name are the same string.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the public projection and I-34's index decision. Writes nothing.

### Analytics and telemetry

`structured_data_emitted {yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Public indexable decks only. It does not ship before I-34's policy. No flag that adds a FAQ later without a new decision.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A rating in the structured data waits until the same rating is visible in the HTML. That slice is not this one.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-92-101

As a player, I want the product to on an indexable public deck, JSON-LD for the name, the commander and the date the deck was updated, and only when those strings are also visible on the page., so that a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

#### AC-92-100 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: On an indexable public deck, JSON-LD for the name, the commander and the date the deck was updated, and only when those strings are also visible on the page. No FAQ. No generated paragraph. No rating until a later slice shows the same rating in the HTML and in the data.

#### AC-92-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-92-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-92-102

As a player, I want the product to a noindex deck page, a share page and a private page emit no JSON-LD., so that a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

#### AC-92-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A noindex deck page, a share page and a private page emit no JSON-LD.

#### AC-92-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-92-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-92-103

As a player, I want the product to the strings come from the public projection., so that a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

#### AC-92-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The strings come from the public projection. budget, notes and folder names never appear.

#### AC-92-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-92-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

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

## I-92: Public Deck Pages Described With Stored Fields Only

**Outcome:** a public deck page that search engines may index carries structured data built only from fields the page already shows, and a page we tell robots to skip carries none.

**Status:** Next
**Priority:** Next, after I-34's index policy. It does not invent pages.
**Impact / effort:** Medium / small
**Risk:** Medium. Generated FAQ text would be the spam pattern the roadmap already cites. This initiative forbids that text.
**Depends on:** I-34 slice 1, so a `noindex` page is decided in one place. I-36's deck image stays the image.

Google's spam policy, already cited under I-34, names scaled AI-written pages as abuse. The site has JSON-LD for the product (`src/components/JsonLd.tsx`). A public deck page does not describe itself with the same discipline.

### Scope

- [ ] On an indexable public deck, JSON-LD for the name, the commander and the date the deck was updated, and only when those strings are also visible on the page. No FAQ. No generated paragraph. No rating until a later slice shows the same rating in the HTML and in the data.
- [ ] A `noindex` deck page, a share page and a private page emit no JSON-LD.
- [ ] The strings come from the public projection. `budget`, notes and folder names never appear.

### Enrichment (2026-11-11)

**User story.** As a player sharing a public deck, I want the page's structured data to match the page, so that a search result is not a paragraph we invented.

**Acceptance.**
- JSON-LD contains only the name, the commander and the update date, and only when those strings are visible.
- A noindex page, a share page and a private page emit none.
- Budget, notes and folder names are absent.

**UX.** No FAQ block. No generated sentence. The visible title and the structured name are the same string.

**Data and API.** Reads the public projection and I-34's index decision. Writes nothing.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `structured_data_emitted {yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Public indexable decks only. It does not ship before I-34's policy. No flag that adds a FAQ later without a new decision.

**Open questions.** A rating in the structured data waits until the same rating is visible in the HTML. That slice is not this one.

### Definition of done

An indexable public deck's structured data parses and contains only visible fields, and a noindex deck response contains no JSON-LD script.

---

