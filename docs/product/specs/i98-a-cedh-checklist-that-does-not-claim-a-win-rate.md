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

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-98-101

As a player, I want the product to show: legality report, last updated date, whether a public viewer needs an account, whether a primer exists and how long it is, and combo lines already on the deck., so that a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

#### AC-98-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Show: legality report, last updated date, whether a public viewer needs an account, whether a primer exists and how long it is, and combo lines already on the deck. Each row says "met" or "not met" against the quoted requirement.

#### AC-98-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-98-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-98-102

As a player, I want the product to a fixed row: "The database requires the list to be on Moxfield., so that a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

#### AC-98-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A fixed row: "The database requires the list to be on Moxfield. This product does not put it there."

#### AC-98-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-98-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-98-103

As a player, I want the product to no win rate, no "expected 25%", and no "accepted" or "rejected"., so that a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

#### AC-98-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: No win rate, no "expected 25%", and no "accepted" or "rejected". The page links to the submit page for the requirements this product does not check, including staples and the win-rate sentence.

#### AC-98-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-98-108 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: a player who wants to submit a competitive list can see which of the database's published requirements this deck already meets, which this product cannot meet, and no win rate.

| State            | What the player sees                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | A sentence that names what is missing and the next action. No invented row, author, price or score.                                                   |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                                        |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                                       |
| Partial          | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished.                                                 |
| Stale            | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed.                                             |
| Guest            | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401.               |
| Signed-in        | Writes go to that account only. Another player's notes, budget and collection are not in the response.                                                |
| English          | New controls use the `en` catalogue.                                                                                                                  |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                                         |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard         | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes.                         |
| Screen reader    | Each new control has an accessible name. A status change is announced in words, not only by colour.                                                   |
| Colour           | A warning and an error differ by text or icon as well as hue, in both themes.                                                                         |
| Success          | The completed action is confirmed in words. A second identical action does not duplicate the write.                                                   |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

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

### Fourteenth pass (2026-11-14)

Two r/CompetitiveEDH posts were read from Arctic Shift on 2026-11-14. `reddit.com` returned HTTP 403, so only the post bodies Arctic Shift returned were read.

"B4 to Fringe cEDH to cEDH" (76 points, 149 comments, 2026-11-12) is an argument about whether a deck built as strong and fast as its owner can make it, without aiming at a tournament, is Bracket 4 or already cEDH ([thread](https://www.reddit.com/r/CompetitiveEDH/comments/1xu3orb/b4_to_fringe_cedh_to_cedh/)). The two sides do not agree. This checklist does not settle it.

"How needed are the reserved list mana rocks/lands for a CEDH deck?" (33 points, 76 comments, 2026-11-09) asks whether a K'rrik list will perform without the zero-mana and one-mana rocks a linked Moxfield list runs ([thread](https://www.reddit.com/r/CompetitiveEDH/comments/1xs48i9/how_needed_are_the_reserved_list_mana_rockslands/)). The checklist may name a fast-mana card the list does not contain, as a row that is not met against a quoted staple list. It may not answer the question the title asks.

#### US-98-14-01

As a player arguing with a friend about Bracket 4 and cEDH, I want the page to say what it checked, so that it does not pick a side of that argument.

#### US-98-14-02

As a player pricing a cEDH mana base, I want a missing fast-mana card listed as absent, so that I am not told the deck will perform without it.

**Passing.** The page has no row whose text is "this is cEDH", "this is fringe" or "this is Bracket 4". A fast-mana card that a cited staple list contains and the deck does not is a row marked not met, with the list's name and the date the list was read. The row's verb is "absent", not "needed" and not "performs".

**Non-passing.** Any sentence that says the deck will win, place or perform with or without a reserved-list card. Any sentence that draws the line between Bracket 4 and Bracket 5. The 76-point thread is evidence the line is disputed. It is not a rule.

**Acceptance.** The existing ban on a win rate and on "accepted" gains three more banned phrases in the template test: "fringe", "will perform" and "you need". A staple row quotes its source. It does not compute a result.

**Open question.** Which staple list, if any, may be quoted for fast mana? The cEDH database's licence is already open question 7 on I-77 and L-25. Until that answer, the row says the staple list is not loaded, which is `notChecked`, not "you do not need the card".

### Definition of done

The checklist for a legal public deck with a primer shows those rows as met, shows the Moxfield row as not something this product does, and the page contains no win rate and no acceptance verdict.

---
