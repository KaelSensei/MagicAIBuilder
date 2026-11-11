# I-97: The Chance One Card Is In Your Hand

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

### Goals

- The panel for a 99-card deck with 36 lands and an opening seven shows the chance of three or more lands, shows the inputs, and a second open of the same deck shows the same digits.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-97-01

As a player counting lands, I want the chance of three or more in an opening seven, so that I see the formula and not a simulated game.

#### US-97-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-97-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-97-01 Happy path

Given a signed-in player and the English locale
When the panel shows the inputs and the probability.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-97-02 Happy path

Given a signed-in player and the English locale
When opening the same deck again shows the same digits.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-97-03 Happy path

Given a signed-in player and the English locale
When the panel says it is a count of equally likely hands, not a recorded game.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-97-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-97-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-97-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for guests and signed-in players. No flag. It is not I-21 and does not wait on it.

#### AC-97-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-97-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-97-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A small panel on the deck. Lands use the land count. Any other card uses its quantity in the library. Considering and Sideboard are excluded.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A pure function. No seed, no `Math.random`, no stored result. Library size is 99, or 98 with a partner.

### Analytics and telemetry

`odds_opened {kind: lands or card}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for guests and signed-in players. No flag. It is not I-21 and does not wait on it.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None. The committed fraction in the test is the contract.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-97-101

As a player, I want the product to inputs: the deck's library size (99, or 98 with a partner, command zone excluded), the number of matching cards, the hand or the turn's draw count, and the minimum count., so that a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

#### AC-97-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Inputs: the deck's library size (99, or 98 with a partner, command zone excluded), the number of matching cards, the hand or the turn's draw count, and the minimum count. Output: the probability, the fraction's inputs, and the sentence "This is a count of equally likely hands, not a recorded game."

#### AC-97-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-97-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-97-102

As a player, I want the product to lands use the deck's land count., so that a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

#### AC-97-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Lands use the deck's land count. Any other card uses its quantity in the library. Considering and Sideboard are excluded.

#### AC-97-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-97-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-97-103

As a player, I want the product to no Math.random, no seed, no model., so that a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

#### AC-97-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: No Math.random, no seed, no model. A committed example in the test matches the formula to four decimal places.

#### AC-97-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-97-108 Edge

Given the same inputs as a previous run
When the player runs it again
Then the reported figures match the first run

### UX states for this feature

The player-visible outcome is: a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

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

## I-97: The Chance One Card Is In Your Hand

**Outcome:** a player can ask the chance of drawing at least one copy of a chosen card, or at least K lands, in an opening seven or by a chosen turn, and see the inputs of the formula.

**Status:** Next
**Priority:** Next. It is one formula, not a simulation.
**Impact / effort:** Medium / small
**Risk:** Low. The risk is presenting the formula as a goldfish result. The panel says it is a count, not a session.
**Depends on:** nothing. I-21 remains the seeded comparison of two snapshots. I-31 remains the keep table for the player's list. Neither is this widget.

Moxfield's production JavaScript, captured on 14 May 2026, includes a hypergeometric calculator (landscape section 1). I-21's scope is thousands of simulated hands across two snapshots, with a seed and an interval. A player who wants "three or more lands in seven cards" does not need that run.

### Scope

- [ ] Inputs: the deck's library size (99, or 98 with a partner, command zone excluded), the number of matching cards, the hand or the turn's draw count, and the minimum count. Output: the probability, the fraction's inputs, and the sentence "This is a count of equally likely hands, not a recorded game."
- [ ] Lands use the deck's land count. Any other card uses its quantity in the library. Considering and Sideboard are excluded.
- [ ] No `Math.random`, no seed, no model. A committed example in the test matches the formula to four decimal places.

### Enrichment (2026-11-11)

**User story.** As a player counting lands, I want the chance of three or more in an opening seven, so that I see the formula and not a simulated game.

**Acceptance.**
- The panel shows the inputs and the probability.
- Opening the same deck again shows the same digits.
- The panel says it is a count of equally likely hands, not a recorded game.

**UX.** A small panel on the deck. Lands use the land count. Any other card uses its quantity in the library. Considering and Sideboard are excluded.

**Data and API.** A pure function. No seed, no `Math.random`, no stored result. Library size is 99, or 98 with a partner.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `odds_opened {kind: lands or card}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for guests and signed-in players. No flag. It is not I-21 and does not wait on it.

**Open questions.** None. The committed fraction in the test is the contract.

### Definition of done

The panel for a 99-card deck with 36 lands and an opening seven shows the chance of three or more lands, shows the inputs, and a second open of the same deck shows the same digits.

---

