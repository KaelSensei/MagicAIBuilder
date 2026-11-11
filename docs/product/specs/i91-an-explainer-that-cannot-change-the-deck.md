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

