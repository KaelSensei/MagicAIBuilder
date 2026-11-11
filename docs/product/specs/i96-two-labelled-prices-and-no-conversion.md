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

### Definition of done

A card ingested with both amounts shows both labels, a card with only dollars shows "no EUR from Scryfall", and no screen contains a converted figure.

---

