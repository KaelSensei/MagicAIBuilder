# I-12: Local AI

**Status:** Parked  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

explore private or offline deck assistance without compromising the core product.

### Goals

- A local model is only promoted if it matches the required quality for a clearly defined workflow at an acceptable cost and latency.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-12-01

As a player, I want the product to explore private or offline deck assistance without compromising the core product, so that this initiative's definition of done is met.

#### US-12-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-12-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-12-01 Happy path

Given a signed-in player and the English locale
When a local model is only promoted if it matches the required quality for a clearly defined workflow at an acceptable cost and latency.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-12-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-12-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-12-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-12-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-12-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-12-01 without a pointer
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

#### US-12-101

As a player, I want the product to define a real user need first: privacy, offline use, cost or latency., so that explore private or offline deck assistance without compromising the core product.

#### AC-12-100 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Define a real user need first: privacy, offline use, cost or latency.

#### AC-12-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-12-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-12-102

As a player, I want the product to benchmark local models on I-70's bench (its slice 18), not on the "golden set" from I-02, which calls no model (re-pointed 2026-11-10)., so that explore private or offline deck assistance without compromising the core product.

#### AC-12-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Benchmark local models on I-70's bench (its slice 18), not on the "golden set" from I-02, which calls no model (re-pointed 2026-11-10).

#### AC-12-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-12-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-12-103

As a player, I want the product to keep deterministic card data and legality services outside the model., so that explore private or offline deck assistance without compromising the core product.

#### AC-12-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep deterministic card data and legality services outside the model.

#### AC-12-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-12-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-12-104

As a player, I want the product to make model choice and data retention explicit., so that explore private or offline deck assistance without compromising the core product.

#### AC-12-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Make model choice and data retention explicit.

#### AC-12-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-12-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-12-105

As a player, I want the product to do not add local inference infrastructure before cloud AI usage and quality are measured., so that explore private or offline deck assistance without compromising the core product.

#### AC-12-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Do not add local inference infrastructure before cloud AI usage and quality are measured.

#### AC-12-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-12-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: explore private or offline deck assistance without compromising the core product.

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

## I-12: Local AI

**Outcome:** explore private or offline deck assistance without compromising the core product.

**Status:** Parked
**Priority:** Later

### Guardrails

- [ ] Define a real user need first: privacy, offline use, cost or latency.
- [ ] Benchmark local models on [I-70](i70-ai-quality-bench-and-model-changes.md)'s bench (its slice 18), not on the "golden set" from I-02, which calls no model (re-pointed 2026-11-10).
- [ ] Keep deterministic card data and legality services outside the model.
- [ ] Make model choice and data retention explicit.
- [ ] Do not add local inference infrastructure before cloud AI usage and quality are measured.

### Definition of done

A local model is only promoted if it matches the required quality for a clearly defined workflow at an acceptable cost and latency.

---

