# I-84: A Reprint Watch For Cards You Own

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

### Goals

- A fixture oracle identity with an older owned printing and a newer paper printing shows the newer set and date, omits a digital-only printing, and the page contains none of the words "sell", "buy" or "hold".

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-84-01

As a player who owns a card, I want to know when a newer paper printing exists, so that I am not told to sell it.

#### US-84-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-84-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-84-01 Happy path

Given a signed-in player and the English locale
When the line names the set and the date.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-84-02 Happy path

Given a signed-in player and the English locale
When a digital-only printing is omitted.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-84-03 Happy path

Given a signed-in player and the English locale
When the words sell, buy and hold do not appear on the line.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-84-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-84-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-84-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. No guest collection. Flag off until the fixture with two printings passes. It does not start before I-67.

#### AC-84-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-84-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-84-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A row on the collection card. The player can turn the watch off for that card. Off stays off.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads I-67's printings by oracle id. Writes a per-card preference. No price forecast.

### Analytics and telemetry

`reprint_shown {dismissed: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. No guest collection. Flag off until the fixture with two printings passes. It does not start before I-67.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether a reprint line next to a price is still read as advice is the risk. The wording test is the mitigation.

### Sources

- https://scryfall.com/docs/api/cards
- https://scryfall.com/docs/api/sets

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-84-101

As a player, I want the product to for each owned printing, list newer paper printings of the same oracle identity., so that when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

#### AC-84-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: For each owned printing, list newer paper printings of the same oracle identity. Digital-only printings are omitted. The line is "Reprinted in {set} on {date}."

#### AC-84-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-84-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-84-102

As a player, I want the product to no verb about selling, buying or holding., so that when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

#### AC-84-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: No verb about selling, buying or holding. No predicted price. The labelled price, if shown, stays I-59's or the stored USD amount.

#### AC-84-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-84-105 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-84-103

As a player, I want the product to the player can turn the watch off for a card., so that when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

#### AC-84-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The player can turn the watch off for a card. Off is the stored state, not a hidden filter.

#### AC-84-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-84-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

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

## I-84: A Reprint Watch For Cards You Own

**Outcome:** when a card the player owns gets a newer paper printing, the collection says which set and which date, without telling the player to sell and without a price forecast.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Risk:** Medium. A reprint line next to a price is easy to read as advice to sell. The words have to stay descriptive.
**Depends on:** I-67's printings, which carry the set and the release date. I-06's owned printings. I-18 stays the radar of new cards for a deck. I-59 stays the price series.

Scryfall's card object exposes `prints_search_uri` for every printing and `released_at` on the set ([cards](https://scryfall.com/docs/api/cards), [sets](https://scryfall.com/docs/api/sets), read 2026-11-11). The product does not tell an owner that a card they hold was printed again. A price alert that fires because a reprint moved the market is I-59, and it does not name the set.

### Scope

- [ ] For each owned printing, list newer paper printings of the same oracle identity. Digital-only printings are omitted. The line is "Reprinted in {set} on {date}."
- [ ] No verb about selling, buying or holding. No predicted price. The labelled price, if shown, stays I-59's or the stored USD amount.
- [ ] The player can turn the watch off for a card. Off is the stored state, not a hidden filter.
- [ ] Added 2026-11-12 (thirteenth pass): the reprint line also appears on the missing printings of an [I-101](i101-collecting-goals-beyond-a-set.md) goal, with this initiative's wording and no buy verb (I-101 slice 5).

### Enrichment (2026-11-11)

**User story.** As a player who owns a card, I want to know when a newer paper printing exists, so that I am not told to sell it.

**Acceptance.**
- The line names the set and the date.
- A digital-only printing is omitted.
- The words sell, buy and hold do not appear on the line.

**UX.** A row on the collection card. The player can turn the watch off for that card. Off stays off.

**Data and API.** Reads I-67's printings by oracle id. Writes a per-card preference. No price forecast.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `reprint_shown {dismissed: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. No guest collection. Flag off until the fixture with two printings passes. It does not start before I-67.

**Open questions.** Whether a reprint line next to a price is still read as advice is the risk. The wording test is the mitigation.

### Definition of done

A fixture oracle identity with an older owned printing and a newer paper printing shows the newer set and date, omits a digital-only printing, and the page contains none of the words "sell", "buy" or "hold".

---

