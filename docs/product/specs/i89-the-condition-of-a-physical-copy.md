# I-89: The Condition Of A Physical Copy

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can record that a physical copy is near mint, lightly played, moderately played, heavily played or damaged, or leave it unrecorded, and nothing guesses.

### Goals

- A copy saved as LP reloads as LP, a copy the player never graded shows "not recorded", and no code path writes NM on its own.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-89-01

As a player tracking a physical copy, I want to record its condition or leave it unrecorded, so that the product does not call a card near mint that I never graded.

#### US-89-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-89-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-89-01 Happy path

Given a signed-in player and the English locale
When the grades are NM, LP, MP, HP, Damaged, or not recorded.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-89-02 Happy path

Given a signed-in player and the English locale
When a new copy is not recorded.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-89-03 Happy path

Given a signed-in player and the English locale
When no code path writes NM by itself.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-89-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-89-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-89-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. No guest collection. Flag off until the LP-survives-reload test passes.

#### AC-89-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-89-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-89-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The grade is on the collection copy, not on the public deck. Signed and serialized notes stay off until the player sets them.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A field on the collection copy, which waits on I-06's printing-level copy. It is not sent to a public projection.

### Analytics and telemetry

`condition_set {grade: recorded or not_recorded}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. No guest collection. Flag off until the LP-survives-reload test passes.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Seller files may include the grade once I-45 exists. They do not invent one.

### Sources

- https://www.cardsphere.com/static/cardsphere-import-sample.csv
- https://www.reddit.com/r/ManaBoxApp/comments/1wjmzzi/
- https://archidekt.com/features

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-89: The Condition Of A Physical Copy

**Outcome:** a player can record that a physical copy is near mint, lightly played, moderately played, heavily played or damaged, or leave it unrecorded, and nothing guesses.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / small
**Risk:** Low. The risk is a default of "near mint" on a card the player never graded. There is no default grade.
**Depends on:** I-06's printing-level copy. I-43 says where the copy sits and does not grade it. I-90 reads the grade once it exists.

Cardsphere's sample import file has a Conditions column ([sample](https://www.cardsphere.com/static/cardsphere-import-sample.csv), read 2026-11-11). ManaBox 4.2.0 added signed cards as their own flag ([r/ManaBoxApp](https://www.reddit.com/r/ManaBoxApp/comments/1wjmzzi/), 2026-09-18). Archidekt's board has an open request for a serialization field; the row showed no point total when read on 2026-11-11 ([features](https://archidekt.com/features)). The collection here stores a printing and a quantity, not a grade.

### Scope

- [ ] On a collection copy: one of NM, LP, MP, HP, Damaged, or "not recorded". New copies are "not recorded".
- [ ] Later, and off unless the player sets them: a signed flag, and a serialization note of at most 40 characters. Neither changes the price.
- [ ] The grade is not sent to a public deck page. I-45's seller file may include it when that file exists.

### Enrichment (2026-11-11)

**User story.** As a player tracking a physical copy, I want to record its condition or leave it unrecorded, so that the product does not call a card near mint that I never graded.

**Acceptance.**
- The grades are NM, LP, MP, HP, Damaged, or not recorded.
- A new copy is not recorded.
- No code path writes NM by itself.

**UX.** The grade is on the collection copy, not on the public deck. Signed and serialized notes stay off until the player sets them.

**Data and API.** A field on the collection copy, which waits on I-06's printing-level copy. It is not sent to a public projection.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `condition_set {grade: recorded or not_recorded}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. No guest collection. Flag off until the LP-survives-reload test passes.

**Open questions.** Seller files may include the grade once I-45 exists. They do not invent one.

### Definition of done

A copy saved as LP reloads as LP, a copy the player never graded shows "not recorded", and no code path writes NM on its own.

---

