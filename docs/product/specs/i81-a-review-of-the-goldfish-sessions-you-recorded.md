# I-81: A Review Of The Goldfish Sessions You Recorded

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

after several recorded goldfish sessions of one deck version, the player sees what those sessions did — when the commander was first cast, how many lands were played by turn, which cards were drawn and never cast — with the session count, and with no win rate.

### Goals

- A fixture of two logs produces the committed counts, a panel with four sessions shows no percentage, and the words "win rate" do not appear.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-81-01

As a player who goldfished a deck several times, I want the turns and the cards that never left my hand, so that I do not mistake a solitaire session for a result.

#### US-81-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-81-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-81-01 Happy path

Given a signed-in player and the English locale
When the panel names the snapshot and the session count.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-81-02 Happy path

Given a signed-in player and the English locale
When under five sessions it shows the count and no percentage.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-81-03 Happy path

Given a signed-in player and the English locale
When the words win rate do not appear.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-81-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-81-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-81-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests have no stored logs. No flag. It does not ship before the under-five test is green.

#### AC-81-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-81-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-81-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A private panel on the deck. The solitaire sentence is on the panel, not behind a help icon.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads stored playtest logs. Writes nothing to the deck. Ignores sessions from before the library fix.

### Analytics and telemetry

`goldfish_review_opened {sessions_bucket: under_5 or five_plus}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests have no stored logs. No flag. It does not ship before the under-five test is green.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Outside demand was not found. The panel stays Later until players record sessions at all.

### Sources

- https://playgroup.gg/playgroup-live/how-sparring-works

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-81: A Review Of The Goldfish Sessions You Recorded

**Outcome:** after several recorded goldfish sessions of one deck version, the player sees what those sessions did — when the commander was first cast, how many lands were played by turn, which cards were drawn and never cast — with the session count, and with no win rate.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Risk:** Medium. A percentage on a goldfish is easy to read as a result. The panel has to say what it is not.
**Depends on:** the action log and the snapshot link I-07 already stores (#1315). No new capture.

I-07 compares snapshots and keeps a log. I-21 and I-31 simulate hands. Neither reads the player's own sessions as a distribution. [Playgroup's Sparring page](https://playgroup.gg/playgroup-live/how-sparring-works), updated 2026-11-06, says its phantom opponents draw on 21,480 interaction spells across 6,934 of Playgroup's games. Those are Playgroup's counts. This product does not have that log, and this initiative does not add an opponent. The owner decision on scripted interaction stays on I-07.

### Scope

- [ ] For one snapshot, aggregate recorded sessions: count, the turn the commander was first cast, lands played on turns 1 to 5, and cards drawn and never cast. Ignore sessions recorded before #1307, which dealt the wrong library.
- [ ] Below five sessions, show the count and the sentence "Not enough sessions", and no percentage.
- [ ] Label the panel "Goldfish. No opponents. Not a win rate." Do not rank cards. Do not send the panel to a model.

### Enrichment (2026-11-11)

**User story.** As a player who goldfished a deck several times, I want the turns and the cards that never left my hand, so that I do not mistake a solitaire session for a result.

**Acceptance.**
- The panel names the snapshot and the session count.
- Under five sessions it shows the count and no percentage.
- The words win rate do not appear.

**UX.** A private panel on the deck. The solitaire sentence is on the panel, not behind a help icon.

**Data and API.** Reads stored playtest logs. Writes nothing to the deck. Ignores sessions from before the library fix.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `goldfish_review_opened {sessions_bucket: under_5 or five_plus}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests have no stored logs. No flag. It does not ship before the under-five test is green.

**Open questions.** Outside demand was not found. The panel stays Later until players record sessions at all.

### Definition of done

A fixture of two logs produces the committed counts, a panel with four sessions shows no percentage, and the words "win rate" do not appear.

---

