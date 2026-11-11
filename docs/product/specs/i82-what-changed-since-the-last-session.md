# I-82: What Changed Since The Last Session

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

### Goals

- A fixture deck that gained one card, lost one and changed a quantity shows those three lines and no others, and names the session or the game it compared against.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-82-01

As a player returning to a deck, I want the cards that changed since I last played it, so that the pod can see the diff and not a story about whether the change was good.

#### US-82-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-82-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-82-01 Happy path

Given a signed-in player and the English locale
When added, cut and quantity changes are the only lines.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-82-02 Happy path

Given a signed-in player and the English locale
When the anchor is named: a playtest snapshot, or a pod game once I-35 exists.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-82-03 Happy path

Given a signed-in player and the English locale
When considering and Sideboard are not in the diff.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-82-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-82-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-82-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. A shared diff is visible to the people who can already see the deck. No flag.

#### AC-82-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-82-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-82-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The diff is on the deck, and on a share only when that deck is already shared. No commentary control.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Compares the current main deck and command zone to the snapshot. No new card table.

### Analytics and telemetry

`deck_diff_opened {anchor: playtest or game, changes: zero or some}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. A shared diff is visible to the people who can already see the deck. No flag.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Demand beyond the existence of the logs was not found. That is why it stays Later.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-82-101

As a player, I want the product to compare the current main deck and command zone with the snapshot of the latest recorded playtest session., so that before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

#### AC-82-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Compare the current main deck and command zone with the snapshot of the latest recorded playtest session. Show added, cut and quantity changes. Considering and Sideboard stay out of the diff.

#### AC-82-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-82-102 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-82-102

As a player, I want the product to when I-35 has a game for this deck, prefer that game's frozen list over the goldfish snapshot, and say which anchor was used., so that before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

#### AC-82-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: When I-35 has a game for this deck, prefer that game's frozen list over the goldfish snapshot, and say which anchor was used.

#### AC-82-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-82-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-82-103

As a player, I want the product to offer the diff to a pod only when the deck is already shared with that pod., so that before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

#### AC-82-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Offer the diff to a pod only when the deck is already shared with that pod. No commentary, no model.

#### AC-82-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-82-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

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

## I-82: What Changed Since The Last Session

**Outcome:** before the next sitting, the player sees which cards were added, cut or changed in quantity since the list they last goldfished or, later, last logged with the pod.

**Status:** Later
**Priority:** Later. The playtest snapshot is enough to start; the pod game is not.
**Impact / effort:** Medium / small
**Risk:** Low. The diff is the cards. A sentence about whether the change was good would be a different product.
**Depends on:** #1315's snapshot on the session. I-35's pod game replaces the anchor when it exists. I-37's history is the edit log, not this comparison.

Moxfield and Archidekt keep a deck's history. They do not anchor it to "the list we played". I-35 will freeze the list of a real game and does not, in its current scope, open with the diff the next time the deck is opened.

### Scope

- [ ] Compare the current main deck and command zone with the snapshot of the latest recorded playtest session. Show added, cut and quantity changes. Considering and Sideboard stay out of the diff.
- [ ] When I-35 has a game for this deck, prefer that game's frozen list over the goldfish snapshot, and say which anchor was used.
- [ ] Offer the diff to a pod only when the deck is already shared with that pod. No commentary, no model.

### Enrichment (2026-11-11)

**User story.** As a player returning to a deck, I want the cards that changed since I last played it, so that the pod can see the diff and not a story about whether the change was good.

**Acceptance.**
- Added, cut and quantity changes are the only lines.
- The anchor is named: a playtest snapshot, or a pod game once I-35 exists.
- Considering and Sideboard are not in the diff.

**UX.** The diff is on the deck, and on a share only when that deck is already shared. No commentary control.

**Data and API.** Compares the current main deck and command zone to the snapshot. No new card table.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `deck_diff_opened {anchor: playtest or game, changes: zero or some}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. A shared diff is visible to the people who can already see the deck. No flag.

**Open questions.** Demand beyond the existence of the logs was not found. That is why it stays Later.

### Definition of done

A fixture deck that gained one card, lost one and changed a quantity shows those three lines and no others, and names the session or the game it compared against.

---

