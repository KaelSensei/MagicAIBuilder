# I-88: A Pre-Game Script That Fills The Rule 0 Sheet

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

four players can walk through a fixed list of questions on one phone and land in the same Rule 0 sheet they could have filled by hand.

### Goals

- Two players finish the script, the sheet shows the answers they gave and blanks where they skipped, and the script has no score and no question that is not in the authored list.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-88-01

As four players with one phone, I want the questions one at a time, so that the sheet ends up filled with what we said and nothing we skipped.

#### US-88-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-88-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-88-01 Happy path

Given a signed-in player and the English locale
When the questions are the authored list, in English and French.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-88-02 Happy path

Given a signed-in player and the English locale
When skip leaves the field empty.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-88-03 Happy path

Given a signed-in player and the English locale
When the sheet still says it does not balance the game. There is no score at the end.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-88-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-88-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-88-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in, after I-15 can store a sheet. The shared result follows I-15's consent. Guests do not start a script. No flag beyond I-15's own.

#### AC-88-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-88-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-88-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

One question, four answers, then the sheet. A question whose field does not exist yet is hidden.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Writes I-15's fields only. No new table. No model.

### Analytics and telemetry

`rule0_script_finished {skipped: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in, after I-15 can store a sheet. The shared result follows I-15's consent. Guests do not start a script. No flag beyond I-15's own.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond I-15's open questions. This script adds no fields.

### Sources

- https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
- https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-88: A Pre-Game Script That Fills The Rule 0 Sheet

**Outcome:** four players can walk through a fixed list of questions on one phone and land in the same Rule 0 sheet they could have filled by hand.

**Status:** Next
**Priority:** Next, after I-15 can store a sheet. The script adds no fields of its own.
**Impact / effort:** High / medium
**Risk:** Low if the questions stay authored and the sheet still says it does not balance the game. High if a model writes the questions or a score appears at the end.
**Depends on:** I-15's sheet. A question whose field does not exist yet is hidden, not invented.

Wizards describes brackets as a pregame conversation: ask what bracket people are on, and Rule 0 still allows an exception ([introducing brackets](https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta), 2025-02-11). The 21 October 2025 update says the system "has created more pregame conversations than we've ever seen, which is the real goal" ([update](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025)). I-15 stores the answers. It does not walk anyone through the questions.

### Scope

- [ ] An authored sequence, in English and French: bracket, intent, combos, extra turns, mass land denial, proxies, and anything the pod wants to allow that the bracket would not. No model. No new sheet field.
- [ ] Each answer writes the matching I-15 field. Skip leaves the field empty. The sheet's existing sentence, that it does not guarantee a balanced game, stays on screen.
- [ ] One phone can collect four players. The sheet is still private until I-15's consent action.

### Enrichment (2026-11-11)

**User story.** As four players with one phone, I want the questions one at a time, so that the sheet ends up filled with what we said and nothing we skipped.

**Acceptance.**
- The questions are the authored list, in English and French.
- Skip leaves the field empty.
- The sheet still says it does not balance the game. There is no score at the end.

**UX.** One question, four answers, then the sheet. A question whose field does not exist yet is hidden.

**Data and API.** Writes I-15's fields only. No new table. No model.

**i18n and access.** The question list is authored in English and French. A missing translation hides the script in that locale rather than showing English under a French UI.

**Telemetry.** `rule0_script_finished {skipped: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in, after I-15 can store a sheet. The shared result follows I-15's consent. Guests do not start a script. No flag beyond I-15's own.

**Open questions.** None beyond I-15's open questions. This script adds no fields.

### Definition of done

Two players finish the script, the sheet shows the answers they gave and blanks where they skipped, and the script has no score and no question that is not in the authored list.

---

