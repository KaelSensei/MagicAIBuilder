# I-98: A cEDH Checklist That Does Not Claim A Win Rate

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

### Goals

- The checklist for a legal public deck with a primer shows those rows as met, shows the Moxfield row as not something this product does, and the page contains no win rate and no acceptance verdict.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-98-01

As a player who might submit a competitive list, I want a checklist of the requirements this product can see, so that I am not shown a win rate or told I would be accepted.

#### US-98-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-98-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-98-01 Happy path

Given a signed-in player and the English locale
When legality, the public date, the primer's presence and the combo lines are rows marked met or not met.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-98-02 Happy path

Given a signed-in player and the English locale
When a fixed row says the database requires Moxfield and this product does not put the list there.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-98-03 Happy path

Given a signed-in player and the English locale
When the page contains no win rate and no acceptance verdict.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-98-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-98-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-98-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in on private decks. A public deck shows it only to the owner. No flag. It stays Later because the risk of a false verdict is the whole point of the wording.

#### AC-98-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-98-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-98-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A panel on the deck with a link to the database's submit page for the requirements we do not check.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the legality report, the deck's update time, the primer's length and the combo lookup. Writes nothing. No win-rate field exists to hide. It is absent.

### Analytics and telemetry

`cedh_checklist_opened {rows_unmet: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in on private decks. A public deck shows it only to the owner. No flag. It stays Later because the risk of a false verdict is the whole point of the wording.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The database's 25 percent sentence is their requirement. We link to it and do not compute it.

### Sources

- https://cedh-decklist-database.com/submit

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-98: A cEDH Checklist That Does Not Claim A Win Rate

**Outcome:** a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

**Status:** Later
**Priority:** Later
**Impact / effort:** Low / small
**Risk:** High if the checklist says or implies that the list would be accepted, or if it prints a win rate. The copy has to refuse both.
**Depends on:** the legality report, the deck's updated date, and whether a primer exists. I-09's combo list and I-65's route line appear when they exist. I-42 keeps format link-outs.

The cEDH Decklist Database's submit page, read 2026-11-11, requires a commander-legal list, a Moxfield URL, a visible "last updated", no account to view the list, and a description of at most 600 characters. It also asks for a strategy with an expected win rate of around 25% in a competitive environment ([submit](https://cedh-decklist-database.com/submit)). I-09 is blocked from showing match win rates by TopDeck's terms. This checklist does not estimate that 25%.

### Scope

- [ ] Show: legality report, last updated date, whether a public viewer needs an account, whether a primer exists and how long it is, and combo lines already on the deck. Each row says "met" or "not met" against the quoted requirement.
- [ ] A fixed row: "The database requires the list to be on Moxfield. This product does not put it there."
- [ ] No win rate, no "expected 25%", and no "accepted" or "rejected". The page links to the submit page for the requirements this product does not check, including staples and the win-rate sentence.

### Enrichment (2026-11-11)

**User story.** As a player who might submit a competitive list, I want a checklist of the requirements this product can see, so that I am not shown a win rate or told I would be accepted.

**Acceptance.**
- Legality, the public date, the primer's presence and the combo lines are rows marked met or not met.
- A fixed row says the database requires Moxfield and this product does not put the list there.
- The page contains no win rate and no acceptance verdict.

**UX.** A panel on the deck with a link to the database's submit page for the requirements we do not check.

**Data and API.** Reads the legality report, the deck's update time, the primer's length and the combo lookup. Writes nothing. No win-rate field exists to hide. It is absent.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `cedh_checklist_opened {rows_unmet: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in on private decks. A public deck shows it only to the owner. No flag. It stays Later because the risk of a false verdict is the whole point of the wording.

**Open questions.** The database's 25 percent sentence is their requirement. We link to it and do not compute it.

### Definition of done

The checklist for a legal public deck with a primer shows those rows as met, shows the Moxfield row as not something this product does, and the page contains no win rate and no acceptance verdict.

---

