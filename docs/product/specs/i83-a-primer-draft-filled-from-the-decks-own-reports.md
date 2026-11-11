# I-83: A Primer Draft Filled From The Deck's Own Reports

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the player gets a primer outline whose lines come from fields the product already stores or computes, copies the lines they want, and edits them before anything is published.

### Goals

- A deck with a declared bracket and a price produces a draft that quotes both, names the source of each line, inserts nothing until the player asks, and refuses an insert that would break the cap.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-83-01

As a player writing a primer, I want a draft whose lines come from the deck's own reports, so that I can edit them before they are published.

#### US-83-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-83-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-83-01 Happy path

Given a signed-in player and the English locale
When each line names its source.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-83-02 Happy path

Given a signed-in player and the English locale
When a card name in the draft that is not in the deck fails a test.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-83-03 Happy path

Given a signed-in player and the English locale
When nothing writes the primer until the player inserts, and an insert that would pass the cap is refused.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-83-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-83-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-83-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. The panel can ship before the cap is raised. The insert stays off until I-08's length decision. Guests do not get a draft.

#### AC-83-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-83-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-83-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A private panel. Insert is a separate control from copy. Missing sources omit the line.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Templates over stored fields and, when they exist, I-65, I-77, I-78 and I-58. No model call.

### Analytics and telemetry

`primer_draft_inserted {refused_for_cap: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. The panel can ship before the cap is raised. The insert stays off until I-08's length decision. Guests do not get a draft.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The cEDH database still requires Moxfield. This draft does not submit anywhere.

### Sources

- https://cedh-decklist-database.com/submit

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-83: A Primer Draft Filled From The Deck's Own Reports

**Outcome:** the player gets a primer outline whose lines come from fields the product already stores or computes, copies the lines they want, and edits them before anything is published.

**Status:** Later
**Priority:** Later, behind the primer length decision on I-08
**Impact / effort:** Medium / medium
**Risk:** Medium. A draft that reads like an essay will be taken for a model. Every line has to be a template.
**Depends on:** nothing for the lines that use the commander, the colours, the declared bracket and the labelled price. I-65, I-77, I-78 and I-58 add lines as they ship. I-08's 2,000-character cap on `Deck.description` stays in force.

The cEDH Decklist Database's submit page, read 2026-11-11, requires a description of the main plan, the backup plan, strengths and weaknesses, and still requires the list to be on Moxfield ([submit](https://cedh-decklist-database.com/submit)). I-08 already ships a primer template the player fills by hand. This initiative fills a draft from reports. It does not write the primer, and it does not submit anywhere.

### Scope

- [ ] A private draft panel. Each line names its source, such as "declared bracket" or "route line, I-65". A missing source omits the line. No model is called.
- [ ] The player copies chosen lines. Nothing writes `Deck.description` until they paste or press a separate "Insert into primer" control that shows the result first.
- [ ] If the insert would pass 2,000 characters, the control refuses and names the cap. Raising the cap stays I-08's decision.
- [ ] A test fails if the draft contains a card name that is not in the deck.

### Enrichment (2026-11-11)

**User story.** As a player writing a primer, I want a draft whose lines come from the deck's own reports, so that I can edit them before they are published.

**Acceptance.**
- Each line names its source.
- A card name in the draft that is not in the deck fails a test.
- Nothing writes the primer until the player inserts, and an insert that would pass the cap is refused.

**UX.** A private panel. Insert is a separate control from copy. Missing sources omit the line.

**Data and API.** Templates over stored fields and, when they exist, I-65, I-77, I-78 and I-58. No model call.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `primer_draft_inserted {refused_for_cap: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. The panel can ship before the cap is raised. The insert stays off until I-08's length decision. Guests do not get a draft.

**Open questions.** The cEDH database still requires Moxfield. This draft does not submit anywhere.

### Definition of done

A deck with a declared bracket and a price produces a draft that quotes both, names the source of each line, inserts nothing until the player asks, and refuses an insert that would break the cap.

---

