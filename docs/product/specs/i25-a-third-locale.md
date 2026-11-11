# Spec: A Third Locale, Chosen On Evidence (I-25)

> **Initiative:** [I-25 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-11's activation rule, which already forbids routing a dormant catalogue.

## Overview

Nine catalogues sit dormant. I-11 already states the rule for activating one: navigation, warnings, dates, prices and card surfaces translated and tested as a single experience. This spec adds the part I-11 leaves open — **which** locale, and on what evidence.

## What the market does

The clearest finding of the 2026-11-08 sweep, and the one nobody seems to have acted on: **every AI deckbuilder found is English-only.** ManaTap, Farseek, DeckCheck, MTG Master, ManaForge, OffMeta, CardMystic, Find That Card, Imskir — not one advertises a second language.

The incumbents are barely better. Moxfield, Archidekt and EDHREC are English-first; ManaBox is the notable exception, advertising multiple languages alongside its offline database.

Meanwhile Scryfall already publishes localised card names, type lines and Oracle text for the major printing languages, so the card layer is not the obstacle — the interface and the review are.

**The read.** A non-English Commander market is the least contested expansion available to this product, and it already ships two reviewed locales while competitors ship one. The risk is not translation; it is activating a locale whose card data or prices cannot be represented honestly.

## Current state in this codebase

- English and French routed; a locale switcher and a catalogue parity guard exist.
- Localised card names, type lines, rules text and images where Scryfall provides them.
- Nine dormant catalogues — `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru`, `pt` — deliberately unrouted. A dormant prefix returns a 404 in English, which is already tested.
- Prices are USD throughout, formatted per locale, explicitly **not** relabelled as a local-market quote (#980, #1015).

The infrastructure is complete. What is missing is a decision and a review.

## Functional requirements

1. **Choose on stated evidence.** The selection records three things: the size of the Commander population in that language, the completeness of Scryfall's card data for it, and whether prices for that market can be shown without implying a quote. The record lives in this spec when the decision is made.
2. **Human review before routing.** No locale is routed on machine translation alone. I-11's rule stands.
3. **Test the locale as one experience** — dates, numbers, pluralisation, mana symbols and card text together, not field by field.
4. **State the limits.** Where Scryfall carries no card text in that language, say so on the surface rather than falling back silently to English mid-list.
5. **Prices stay honest.** Either represent the local market properly, or keep USD with its existing disclosure. Do not invent a conversion.

## Non-goals

- Activating several locales at once. The parity guard makes adding a catalogue cheap and reviewing it expensive; the review is the work.
- Right-to-left layout support, unless the chosen locale needs it — in which case it is a separate, larger initiative and must be said so before the choice is made.
- Localising player-authored content: primers, notes and comments stay in the language their author wrote them.

## Testing strategy

- **Parity:** the catalogue guard passes for the new locale with no missing keys.
- **Routing:** the locale resolves, and the previously dormant prefix stops returning the English 404.
- **Combined:** one test exercises a date, a number, a plural, a mana symbol and a card name together on one page in the new locale.
- **Fallback disclosure:** a card Scryfall does not carry in that language renders with its stated fallback, not a silent English substitution.

## Delivery slices

| #   | Slice                                                        | Depends on |
| --- | ------------------------------------------------------------ | ---------- |
| 1   | Record the choice and its evidence in this spec              | —          |
| 2   | Complete the catalogue and obtain human review               | 1          |
| 3   | Card-data coverage audit and the fallback disclosure surface | 1          |
| 4   | Route the locale and run the combined experience test        | 2, 3       |
| 5   | Price representation decision for that market                | 3          |

Slice 1 is a decision, not code, and it blocks everything. It is also the slice most likely to be skipped — which is how a half-translated locale reaches production.

## Open questions

- Which locale? The honest answer is that this spec cannot decide it from a competitive sweep alone; it needs the product's own traffic and the card-data audit from slice 3. Deciding from catalogue convenience — "Spanish is nearly done" — is exactly the failure I-11 was written to prevent.
- Does a third locale increase the review burden on every future feature? Yes, and permanently. That cost belongs in the slice-1 decision rather than being discovered in 2028.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

### Goals

- One additional locale is routed, reviewed and covered end to end, and the surfaces it cannot localise say so.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-25-01

As a player, I want a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience., so that this initiative's definition of done is met.

#### US-25-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-25-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-25-01 Happy path

Given a signed-in player and the English locale
When one additional locale is routed, reviewed and covered end to end, and the surfaces it cannot localise say so.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-25-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-25-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-25-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-25-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-25-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-25-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-25-101

As a player, I want the product to choose the locale from stated evidence: player population, Scryfall card-data coverage, and whether prices in that market are representable without implying a quote., so that a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

#### AC-25-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Choose the locale from stated evidence: player population, Scryfall card-data coverage, and whether prices in that market are representable without implying a quote.

#### AC-25-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-25-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-25-102

As a player, I want the product to complete and human-review the catalogue before routing it., so that a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

#### AC-25-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Complete and human-review the catalogue before routing it.

#### AC-25-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-25-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-25-103

As a player, I want the product to test dates, numbers, pluralisation, mana symbols and card text together, as I-11 requires., so that a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

#### AC-25-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Test dates, numbers, pluralisation, mana symbols and card text together, as I-11 requires.

#### AC-25-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-25-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-25-104

As a player, I want the product to state what is not localised — card data Scryfall does not carry in that language — rather than falling back silently., so that a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

#### AC-25-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: State what is not localised — card data Scryfall does not carry in that language — rather than falling back silently.

#### AC-25-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-25-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

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

## I-25: A Third Locale, Chosen On Evidence

**Spec:** [`specs/i25-a-third-locale.md`](i25-a-third-locale.md)

**Outcome:** a third language is activated with its navigation, warnings, dates, prices and card surfaces translated and tested as one experience.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium
**Depends on:** I-11's activation rule, which already forbids routing a dormant catalogue.

Nine catalogues are dormant. Every AI deckbuilder found in the sweep is English-only, which makes a non-English market the least contested expansion available — but the choice must come from evidence rather than from catalogue convenience. Scryfall already supplies localised card data for the candidates.

### Scope

- [ ] Choose the locale from stated evidence: player population, Scryfall card-data coverage, and whether prices in that market are representable without implying a quote.
- [ ] Complete and human-review the catalogue before routing it.
- [ ] Test dates, numbers, pluralisation, mana symbols and card text together, as I-11 requires.
- [ ] State what is not localised — card data Scryfall does not carry in that language — rather than falling back silently.

### Definition of done

One additional locale is routed, reviewed and covered end to end, and the surfaces it cannot localise say so.

---

