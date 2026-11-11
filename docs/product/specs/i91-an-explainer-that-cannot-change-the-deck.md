# I-91: An Explainer That Cannot Change The Deck

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

### Goals

- In this mode, asking about a card and about a session leaves the deck byte-for-byte unchanged, every card name in the answer is in the deck, and a rules question produces a refusal rather than a ruling.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-91-01

As a player who wants an explanation, I want an answer that quotes the deck and cannot change it, so that asking why is not the same as asking for a new list.

#### US-91-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-91-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-91-01 Happy path

Given a signed-in player and the English locale
When after either deterministic answer, the deck rows are unchanged.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-91-02 Happy path

Given a signed-in player and the English locale
When every card name in the answer is in the deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-91-03 Happy path

Given a signed-in player and the English locale
When a rules question is a refusal plus a link, not a ruling.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-91-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-91-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-91-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Deterministic mode can ship without I-70. Model wording stays off until I-70 scores it. Guests do not get the mode.

#### AC-91-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-91-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-91-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A mode with no apply button. The two answers are where a card sits, and what one recorded session counted.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the deck and one playtest log. The deterministic mode calls no model. A later rephrase is labelled, cannot add a card name, and counts against I-02's allowance.

### Analytics and telemetry

`explainer_asked {kind: card, session or refused_rules}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Deterministic mode can ship without I-70. Model wording stays off until I-70 scores it. Guests do not get the mode.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether French rationale is required is the same question as I-70. The default is the deterministic text in the active locale.

### Sources

- https://deckcheck.co/support

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-91-101

As a player, I want the product to a mode with two deterministic answers: where a named card sits and which of its stored fields the deck is using (zone, quantity, commander, price date), and a summary of one recorded session that quotes the log's counts., so that a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

#### AC-91-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A mode with two deterministic answers: where a named card sits and which of its stored fields the deck is using (zone, quantity, commander, price date), and a summary of one recorded session that quotes the log's counts. No model.

#### AC-91-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-91-102 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-91-102

As a player, I want the product to the mode has no add, cut, swap or apply control., so that a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

#### AC-91-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The mode has no add, cut, swap or apply control. A test loads the deck, asks both questions, and asserts the card rows are unchanged.

#### AC-91-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-91-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-91-103

As a player, I want the product to a rules question gets a refusal and a link to the card's rulings when I-47 has them, and to the rules file until then., so that a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

#### AC-91-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A rules question gets a refusal and a link to the card's rulings when I-47 has them, and to the rules file until then. The mode does not quote a rule it did not look up.

#### AC-91-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-91-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-91-104

As a player, I want the product to later, a model may rephrase a deterministic answer., so that a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

#### AC-91-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later, a model may rephrase a deterministic answer. The rephrase is labelled as a model's wording, it may not add a card name that was not in the deterministic answer, and it counts against I-02's allowance. I-70 scores it before it is the default.

#### AC-91-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-91-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

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

## I-91: An Explainer That Cannot Change The Deck

**Outcome:** a player can ask why a card is in the deck, or what a recorded goldfish showed, and get an answer that quotes the deck and the log, without any path that adds or cuts a card.

**Status:** Next
**Priority:** Next for the deterministic answers. A model wording mode is Later, inside I-02's allowance, and only after I-70 can score it.
**Impact / effort:** High / medium
**Risk:** High if it is another chatbot. The mode has no tool that writes a deck, and it refuses questions about the rules.
**Depends on:** stored oracle text and the playtest log. I-02 keeps generation. I-47 keeps rules answers. I-70 scores the later wording mode.

I-02 already answers "why is this card here?" inside a copilot that also proposes cards. On r/EDH, a December 2025 post telling players not to use AI for suggestions or rules reached 729 points (I-02's findings). DeckCheck sells analysis tools beside its chat ([support](https://deckcheck.co/support), seen 2026-11-08). The gap is a surface whose only output is an explanation.

### Scope

- [ ] A mode with two deterministic answers: where a named card sits and which of its stored fields the deck is using (zone, quantity, commander, price date), and a summary of one recorded session that quotes the log's counts. No model.
- [ ] The mode has no add, cut, swap or apply control. A test loads the deck, asks both questions, and asserts the card rows are unchanged.
- [ ] A rules question gets a refusal and a link to the card's rulings when I-47 has them, and to the rules file until then. The mode does not quote a rule it did not look up.
- [ ] Later, a model may rephrase a deterministic answer. The rephrase is labelled as a model's wording, it may not add a card name that was not in the deterministic answer, and it counts against I-02's allowance. I-70 scores it before it is the default.

### Enrichment (2026-11-11)

**User story.** As a player who wants an explanation, I want an answer that quotes the deck and cannot change it, so that asking why is not the same as asking for a new list.

**Acceptance.**
- After either deterministic answer, the deck rows are unchanged.
- Every card name in the answer is in the deck.
- A rules question is a refusal plus a link, not a ruling.

**UX.** A mode with no apply button. The two answers are where a card sits, and what one recorded session counted.

**Data and API.** Reads the deck and one playtest log. The deterministic mode calls no model. A later rephrase is labelled, cannot add a card name, and counts against I-02's allowance.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `explainer_asked {kind: card, session or refused_rules}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Deterministic mode can ship without I-70. Model wording stays off until I-70 scores it. Guests do not get the mode.

**Open questions.** Whether French rationale is required is the same question as I-70. The default is the deterministic text in the active locale.

### Definition of done

In this mode, asking about a card and about a session leaves the deck byte-for-byte unchanged, every card name in the answer is in the deck, and a rules question produces a refusal rather than a ruling.

---

