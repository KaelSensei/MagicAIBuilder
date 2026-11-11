# I-93: A Reading Mode For The Table

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

at the table, a player can read one card at a time — name, cost, type, oracle text — in large type, with next and previous, and without a life total or a hover.

### Goals

- A keyboard user moves from the commander through the 99 without a pointer, the view has no life control, and the card name is readable at arm's length in both themes.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-93-01

As a player at the table, I want one card at a time in large type, so that I can read it at arm's length without a life counter getting in the way.

#### US-93-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-93-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-93-01 Happy path

Given a signed-in player and the English locale
When next and previous work from the screen and from the keyboard.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-93-02 Happy path

Given a signed-in player and the English locale
When the view has no life total, no commander-damage tally and no timer.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-93-03 Happy path

Given a signed-in player and the English locale
When the card name is readable in both themes without a hover.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-93-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-93-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-93-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Whoever can already open the deck, including a guest on a public deck. No flag. It does not include a life total even if players ask.

#### AC-93-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-93-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-93-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A reading route from the deck. Add and edit are absent. The command zone is in the sequence.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the deck. Stores nothing. Printed language waits on I-37's language field. Until then the oracle text is shown.

### Analytics and telemetry

`reading_mode_opened {cards_stepped: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Whoever can already open the deck, including a guest on a public deck. No flag. It does not include a life total even if players ask.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

I-19 may cache this view with the deck. That is one more file in the same cache, not a second cache.

### Sources

- https://edhrec.com/articles/changelog-big-performance-upgrades

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-93: A Reading Mode For The Table

**Outcome:** at the table, a player can read one card at a time — name, cost, type, oracle text — in large type, with next and previous, and without a life total or a hover.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Risk:** Low, as long as it does not grow a life counter. A life counter is a different product, already ruled out.
**Depends on:** nothing. I-49's contrast tokens replace the theme colours when they exist. I-24 remains the screen-reader path. I-19 can cache this view with the deck; that is a one-line addition there, not a second cache.

EDHREC's 6 November 2026 changelog put card names over images on mobile "so they can be much more easily clicked" ([changelog](https://edhrec.com/articles/changelog-big-performance-upgrades)). That is a gallery fix. This is a reading view for someone holding a phone across a table. I-49 is already moving 7 px text onto the `rem` scale. This view starts at a size meant to be read at arm's length.

### Scope

- [ ] One card, the command zone included, with next and previous on screen and on the keyboard. No drag, no hover preview, no add button.
- [ ] No life total, no commander-damage tally and no timer. Those stay out.
- [ ] English and French chrome. Card text follows the printing's language when I-37 slice 12 has stored it, and the oracle text until then.

### Enrichment (2026-11-11)

**User story.** As a player at the table, I want one card at a time in large type, so that I can read it at arm's length without a life counter getting in the way.

**Acceptance.**
- Next and previous work from the screen and from the keyboard.
- The view has no life total, no commander-damage tally and no timer.
- The card name is readable in both themes without a hover.

**UX.** A reading route from the deck. Add and edit are absent. The command zone is in the sequence.

**Data and API.** Reads the deck. Stores nothing. Printed language waits on I-37's language field. Until then the oracle text is shown.

**i18n and access.** Chrome in English and French. Oracle text until the printing's language is stored. No life-total words, because there is no life total.

**Telemetry.** `reading_mode_opened {cards_stepped: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Whoever can already open the deck, including a guest on a public deck. No flag. It does not include a life total even if players ask.

**Open questions.** I-19 may cache this view with the deck. That is one more file in the same cache, not a second cache.

### Definition of done

A keyboard user moves from the commander through the 99 without a pointer, the view has no life control, and the card name is readable at arm's length in both themes.

---

