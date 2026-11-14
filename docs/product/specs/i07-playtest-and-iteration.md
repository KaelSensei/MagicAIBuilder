# I-07: Playtest And Iteration

**Status:** Building  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

testing a deck teaches the player what to change.

### Goals

- A player can test two versions of a deck and see evidence that helps choose between them.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-07-01

As a player goldfishing a deck, I want the session to use the deck I built and to be tied to that version, so that two runs can be compared.

#### US-07-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-07-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-07-01 Happy path

Given a signed-in player and the English locale
When the library is the main deck plus the command zone, not Sideboard or Considering.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-07-02 Happy path

Given a signed-in player and the English locale
When a recorded session names the snapshot it was played from.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-07-03 Happy path

Given a signed-in player and the English locale
When commander damage and the named designations are set by the player and never inferred by a rules engine.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-07-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-07-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-07-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in to record. A guest may goldfish the session deck and the log is discarded at sign-out unless they save the deck first. Scripted opponents stay behind D-35.

#### AC-07-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-07-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-07-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The solitaire limit stays on screen. Hotkeys are listed in a cheat sheet and do not fire while typing. Saving a session to resume is explicit.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Sessions stay on `POST /api/decks/[id]/playtest-sessions`. Designations are session state, not deck rows.

### Analytics and telemetry

`playtest_recorded {snapshot: new or reused, mulligan: free or london}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in to record. A guest may goldfish the session deck and the log is discarded at sign-out unless they save the deck first. Scripted opponents stay behind D-35.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether a hot-seat of four decks is in scope stays D-35. I-81 reads logs only after they exist.

### Sources

- https://magic.wizards.com/en/news/mtg-arena/introducing-ranked-brawl
- https://krakenthemeta.com/mtg-odds
- https://apps.apple.com/us/app/topdecked-mtg/id1173388234
- https://playgroup.gg/playgroup-live/how-sparring-works

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-07-101

As a player, I want the product to present playtest comparison between deck snapshots in the product UI., so that testing a deck teaches the player what to change.

#### AC-07-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Present playtest comparison between deck snapshots in the product UI.

#### AC-07-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-102

As a player, I want the product to surface missing-color and dead-opening-hand evidence alongside persisted mulligan and draw-progression signals., so that testing a deck teaches the player what to change.

#### AC-07-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Surface missing-color and dead-opening-hand evidence alongside persisted mulligan and draw-progression signals.

#### AC-07-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-103

As a player, I want the product to let the player attach a short evidence note to a result., so that testing a deck teaches the player what to change.

#### AC-07-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the player attach a short evidence note to a result.

#### AC-07-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-104

As a player, I want the product to associate a note with a proposed deck change., so that testing a deck teaches the player what to change.

#### AC-07-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Associate a note with a proposed deck change.

#### AC-07-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-105

As a player, I want the product to feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data., so that testing a deck teaches the player what to change.

#### AC-07-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data.

#### AC-07-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-106

As a player, I want the product to keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates., so that testing a deck teaches the player what to change.

#### AC-07-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates.

#### AC-07-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-117 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-07-107

As a player, I want the product to record a chronological, editable action log for zone moves, draws, casts, mana production, counters and life changes., so that testing a deck teaches the player what to change.

#### AC-07-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Record a chronological, editable action log for zone moves, draws, casts, mana production, counters and life changes.

#### AC-07-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-108

As a player, I want the product to summarize playtest logs into turn-by-turn draw, mana and cards-seen evidence, then export the human-readable log and structured data., so that testing a deck teaches the player what to change.

#### AC-07-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Summarize playtest logs into turn-by-turn draw, mana and cards-seen evidence, then export the human-readable log and structured data.

#### AC-07-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-109

As a player, I want the product to let players add required tokens, counters, dice and card copies during a goldfish session without mutating the decklist., so that testing a deck teaches the player what to change.

#### AC-07-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let players add required tokens, counters, dice and card copies during a goldfish session without mutating the decklist.

#### AC-07-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-126 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-07-110

As a player, I want the product to follow the official mulligan in the playtest., so that testing a deck teaches the player what to change.

#### AC-07-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Follow the official mulligan in the playtest. The first mulligan is free in multiplayer and Brawl games (CR 103.5c) and not in duels, and a London mulligan draws seven and lets the player choose the cards to put on the bottom. See the opening-hands guide. Shipped in #1301: the playtest draws seven on every mulligan, the player picks the cards to bottom and their order, and Commander, Brawl and Oathbreaker get the free first mulligan; the E2E spec checks the free seven and the bottom choice.

#### AC-07-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-111

As a player, I want the product to base opening-hand advice on the mulligan stage (first seven, free seven, six), the deck's cheap ramp and its land count, instead of fixed land thresholds (#1303)., so that testing a deck teaches the player what to change.

#### AC-07-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Base opening-hand advice on the mulligan stage (first seven, free seven, six), the deck's cheap ramp and its land count, instead of fixed land thresholds (#1303).

#### AC-07-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-112

As a player, I want the product to deal the deck that was built., so that testing a deck teaches the player what to change.

#### AC-07-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Deal the deck that was built. The playtest dealt each deck row once whatever its quantity, shuffled the commander into the library, and dealt Sideboard and Considering rows. Measured on a 36-land Commander list: a 79-card library and hand with 19% lands, 59.8% of opening hands with 0–1 land, and the commander in the opening hand 8.7% of the time. Shipped in #1307: 99 cards, 36.4% lands, 20.3% and 0%. The fix deals each copy, adds a command zone that the commander starts in (CR 903.6) and returns to (CR 903.9a), and stops counting a cast commander as a card seen. Sessions recorded before the fix were dealt from the wrong library, so a comparison that mixes sessions from before and after it compares two different libraries.

#### AC-07-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-135 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-07-113

As a player, I want the product to tie recorded sessions to the deck version played., so that testing a deck teaches the player what to change.

#### AC-07-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Tie recorded sessions to the deck version played. src/components/playtest/RecordResultBar.tsx never sent a snapshotId, and PlaytestComparisonPanel.tsx skipped sessions without one, so the in-product snapshot comparison checked above never received a session recorded in the playtest. Shipped in #1315: POST /api/decks/[id]/playtest-sessions files a run without a snapshotId under the most recent snapshot that holds the deck as saved, or creates a Playtest · <UTC time> snapshot, in one transaction. Repeated runs on an unchanged deck share one snapshot, and the history panel no longer crashes on a session with a snapshot. I-35 slice 2 needs the same card-list hash to freeze the version of a real game.

#### AC-07-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-138 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-07-114

As a player, I want the product to add playtest hotkeys and a cheat sheet: draw, shuffle, next turn and moves to graveyard, exile and battlefield., so that testing a deck teaches the player what to change.

#### AC-07-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add playtest hotkeys and a cheat sheet: draw, shuffle, next turn and moves to graveyard, exile and battlefield. Moxfield documents D, S, N, G, E and B, and Archidekt lists its keys with Shift+/. Today only the life tracker and the action log read the keyboard (src/components/playtest).

#### AC-07-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-141 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-115

As a player, I want the product to select several battlefield cards at once and act on them together, as Archidekt does with drag and Ctrl-click., so that testing a deck teaches the player what to change.

#### AC-07-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Select several battlefield cards at once and act on them together, as Archidekt does with drag and Ctrl-click.

#### AC-07-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-144 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-116

As a player, I want the product to offer a popout view that hides the hand, for streaming and screen sharing., so that testing a deck teaches the player what to change.

#### AC-07-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Offer a popout view that hides the hand, for streaming and screen sharing. Archidekt offers one.

#### AC-07-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-147 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-117

As a player, I want the product to save a playtest and resume it later., so that testing a deck teaches the player what to change.

#### AC-07-148 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Save a playtest and resume it later. Closing the playtest discards the game today.

#### AC-07-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-150 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-118

As a player, I want the product to let a player force chosen cards into the opening hand to test new cards., so that testing a deck teaches the player what to change.

#### AC-07-151 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let a player force chosen cards into the opening hand to test new cards. BlueprintMTG ships this as "New Card Trial", and a Moxfield feedback request asks for it.

#### AC-07-152 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-153 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-119

As a player, I want the product to a keep drill in the playtest deals opening hands from the deck with the free multiplayer mulligan, takes the player's keep or mulligan call before it shows any advice, then reveals the keep-rule verdict and its margin., so that testing a deck teaches the player what to change.

#### AC-07-154 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A keep drill in the playtest deals opening hands from the deck with the free multiplayer mulligan, takes the player's keep or mulligan call before it shows any advice, then reveals the keep-rule verdict and its margin.

#### AC-07-155 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-156 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-120

As a player, I want the product to each drill ends with the share of calls that matched the verdict, counting judgment calls (margins within 2%) and hands without a rule separately, and drill hands are never filed as playtest sessions., so that testing a deck teaches the player what to change.

#### AC-07-157 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Each drill ends with the share of calls that matched the verdict, counting judgment calls (margins within 2%) and hands without a rule separately, and drill hands are never filed as playtest sessions.

#### AC-07-158 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-159 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-07-121

As a player, I want **Owner decision:** scripted opponent interaction., so that testing a deck teaches the player what to change.

#### AC-07-160 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner decision:** scripted opponent interaction. Archidekt's interaction simulator (about September 2026) rolls configurable removal, counterspells and attacks against the board after a chosen turn, with archetype presets and a log, and never acts on its own. BlueprintMTG's "Resistance Mode" bots cast scripted interaction during playtests, and its two r/EDH launch posts reached 742 and 585 points in July and August 2026. Playgroup.gg offers "phantom opponents" for solo playtesting, built from its tracked games. These are scripted or random events, not an AI opponent and not a rules engine. The roadmap's non-goal "Do not add an AI opponent or a full Magic rules engine under I-21" therefore does not clearly cover them. The owner should confirm whether scripted interaction is in scope for I-07 or I-21.

#### AC-07-161 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-162 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-122

As a player, I want the product to under the owner decision on scripted interaction (D-35), an added option: a hot-seat sandbox of up to four decks (the player's and three from I-15 shares, public links or an I-79 set), each seat with its opening hand under the free mulligan, every seat moved by the player, no rules engine and no model., so that testing a deck teaches the player what to change.

#### AC-07-163 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Under the owner decision on scripted interaction (D-35), an added option: a hot-seat sandbox of up to four decks (the player's and three from I-15 shares, public links or an I-79 set), each seat with its opening hand under the free mulligan, every seat moved by the player, no rules engine and no model. TopDecked "Supports up to four decks per simulation on the same device" (version 12.1.0, 2023-11-13, App Store; corrected 2026-11-11 from 13.0.5, which carries only the QR line). Added 2026-11-11.

#### AC-07-164 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-165 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-123

As a player, I want the product to track, by the player's own taps, commander damage dealt to up to three imagined opponents, kept separate per commander (CR 903.10a, and the loss at 21 in CR 104.3j and CR 704.6c)., so that testing a deck teaches the player what to change.

#### AC-07-166 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Track, by the player's own taps, commander damage dealt to up to three imagined opponents, kept separate per commander (CR 903.10a, and the loss at 21 in CR 104.3j and CR 704.6c). The goldfish has a life total and no commander-damage tally. No opponent acts.

#### AC-07-167 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-168 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-07-124

As a player, I want the product to let the player set the designations the checklist in I-19 names and the playtest does not track: the monarch, the initiative, the Ring, day and night, the City's Blessing, and experience, energy and poison counters., so that testing a deck teaches the player what to change.

#### AC-07-169 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the player set the designations the checklist in I-19 names and the playtest does not track: the monarch, the initiative, the Ring, day and night, the City's Blessing, and experience, energy and poison counters. The player sets them. The engine does not infer them from Oracle text.

#### AC-07-170 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-07-171 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: testing a deck teaches the player what to change.

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

## I-07: Playtest And Iteration

**Outcome:** testing a deck teaches the player what to change.

**Status:** Building
**Priority:** Next

### Already shipped

- Opening hand, London mulligan and goldfishing. **Correction 2026-11-09:** before #1301 the mulligan drew one card fewer with no bottom choice and gave no free first mulligan. #1301 fixed both; see the checked scope below.
- Turn phases, life tracking, undo, battlefield, graveyard and exile.
- Session recording, result history, mulligan data and opponent-strength labels.
- Player-authored evidence notes and explicit self-reported methodology.
- Snapshot-linked sessions, a deterministic comparison engine, a private comparison API and an in-product snapshot evidence comparison with cohort-size disclosure and early-signal guidance.
- Recorded sessions now persist deterministic cards-seen and additional-draw evidence from the goldfish engine for later version analysis.
- Opening-hand evidence now distinguishes land balance from immediate castability, exposing missing mana colors and dead hands before the mulligan decision.
- Playtest results can link a separate proposed deck change to the player-authored evidence note, keeping observation and next experiment distinct in history.
- AI deck suggestions can use the latest private, user-owned playtest observations as bounded anecdotal context, scoped server-side by deck and account.

### Remaining scope

- [x] Present playtest comparison between deck snapshots in the product UI.
- [x] Surface missing-color and dead-opening-hand evidence alongside persisted mulligan and draw-progression signals.
- [x] Let the player attach a short evidence note to a result.
- [x] Associate a note with a proposed deck change.
- [x] Feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data.
- [x] Keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates.
- [x] Record a chronological, editable action log for zone moves, draws, casts, mana production, counters and life changes.
  - [x] Let players cancel an action-log edit with Escape without saving its draft (#1043).
  - [x] Filter visible actions and turn evidence by turn without truncating copied or downloaded logs (#1045).
  - [x] Filter visible actions by phase within the selected turn while keeping full-session exports (#1050).
- [x] Summarize playtest logs into turn-by-turn draw, mana and cards-seen evidence, then export the human-readable log and structured data.
  - [x] Let players copy the human-readable action log directly, with success and clipboard-error feedback (#1040).
- [x] Let players add required tokens, counters, dice and card copies during a goldfish session without mutating the decklist.
- [x] Follow the official mulligan in the playtest. The first mulligan is free in multiplayer and Brawl games (CR 103.5c) and not in duels, and a London mulligan draws seven and lets the player choose the cards to put on the bottom. See the [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md#implications-for-magicaibuilder). Shipped in #1301: the playtest draws seven on every mulligan, the player picks the cards to bottom and their order, and Commander, Brawl and Oathbreaker get the free first mulligan; the E2E spec checks the free seven and the bottom choice.
  - Follow-ups from #1301: a per-session "multiplayer game" choice, since the rule is set by format and a 1v1 Commander or Oathbreaker game should not get the free mulligan; and disabling the record-result bar while a bottom choice is pending, because a result recorded then counts the cards still to bottom as extra cards seen.
  - [x] Block result recording while a bottom choice is pending, and make the free mulligan a per-session multiplayer choice (#1334, 2026-11-10). Both follow-ups are done; the player-count choice of I-42 4.3 builds on it.
  - **Corrected 2026-11-11:** "free in multiplayer and Brawl games" holds for the Comprehensive Rules and for Arena's normal Brawl. Arena's Competitive Brawl, released 2026-06-23, has no free mulligan ([Wizards](https://magic.wizards.com/en/news/mtg-arena/introducing-ranked-brawl), 2026-06-08).
- [x] Base opening-hand advice on the mulligan stage (first seven, free seven, six), the deck's cheap ramp and its land count, instead of fixed land thresholds (#1303).
  - Shipped in #1303: `keep-rules.ts` holds the guide's keep table as data, classes a hand by lands and ramp at mana value 2 or less, treats margins within 2% as judgment calls, and says when the guide has no computed rule. Commander only; other formats keep the land-balance hint.
- [x] Deal the deck that was built. The playtest dealt each deck row once whatever its quantity, shuffled the commander into the library, and dealt Sideboard and Considering rows. Measured on a 36-land Commander list: a 79-card library and hand with 19% lands, 59.8% of opening hands with 0–1 land, and the commander in the opening hand 8.7% of the time. Shipped in #1307: 99 cards, 36.4% lands, 20.3% and 0%. The fix deals each copy, adds a command zone that the commander starts in (CR 903.6) and returns to (CR 903.9a), and stops counting a cast commander as a card seen. Sessions recorded before the fix were dealt from the wrong library, so a comparison that mixes sessions from before and after it compares two different libraries.
- [x] Tie recorded sessions to the deck version played. `src/components/playtest/RecordResultBar.tsx` never sent a `snapshotId`, and `PlaytestComparisonPanel.tsx` skipped sessions without one, so the in-product snapshot comparison checked above never received a session recorded in the playtest. Shipped in #1315: `POST /api/decks/[id]/playtest-sessions` files a run without a `snapshotId` under the most recent snapshot that holds the deck as saved, or creates a `Playtest · <UTC time>` snapshot, in one transaction. Repeated runs on an unchanged deck share one snapshot, and the history panel no longer crashes on a session with a snapshot. [I-35](i35-pod-game-log.md) slice 2 needs the same card-list hash to freeze the version of a real game.
- [ ] Add playtest hotkeys and a cheat sheet: draw, shuffle, next turn and moves to graveyard, exile and battlefield. Moxfield documents D, S, N, G, E and B, and Archidekt lists its keys with Shift+/. Today only the life tracker and the action log read the keyboard (`src/components/playtest`).
- [ ] Select several battlefield cards at once and act on them together, as Archidekt does with drag and Ctrl-click.
- [ ] Offer a popout view that hides the hand, for streaming and screen sharing. Archidekt offers one.
- [ ] Save a playtest and resume it later. Closing the playtest discards the game today.
- [ ] Let a player force chosen cards into the opening hand to test new cards. BlueprintMTG ships this as "New Card Trial", and a Moxfield feedback request asks for it.
- [ ] A keep drill in the playtest deals opening hands from the deck with the free multiplayer mulligan, takes the player's keep or mulligan call before it shows any advice, then reveals the keep-rule verdict and its margin.
- [ ] Each drill ends with the share of calls that matched the verdict, counting judgment calls (margins within 2%) and hands without a rule separately, and drill hands are never filed as playtest sessions.
  - Both drill items need only #1301 and #1303, and cover Commander and the first and free sevens, as `src/lib/playtest/keep-rules.ts` does; a 1v1 drill needs the per-session "multiplayer game" choice above. [KrakenTheMeta](https://krakenthemeta.com/mtg-odds) (© 2026, undated) deals sevens from a pasted list with the free first mulligan but compares no verdict with the player's call, and StarCityGames' and MTGAzone's "Keep or Mulligan" columns ask readers to vote on the author's 60-card hands. None scores the player's calls on their own deck, where the [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md) finds the largest gap between practice and the optimum: two- and three-land sevens with nothing cheap to cast. [I-31](i31-deck-lab.md) slice 14 later judges the calls against the deck's own keep table.
- [ ] **Owner decision:** scripted opponent interaction. Archidekt's interaction simulator (about September 2026) rolls configurable removal, counterspells and attacks against the board after a chosen turn, with archetype presets and a log, and never acts on its own. BlueprintMTG's "Resistance Mode" bots cast scripted interaction during playtests, and its two r/EDH launch posts reached 742 and 585 points in July and August 2026. Playgroup.gg offers "phantom opponents" for solo playtesting, built from its tracked games. These are scripted or random events, not an AI opponent and not a rules engine. The roadmap's non-goal "Do not add an AI opponent or a full Magic rules engine under I-21" therefore does not clearly cover them. The owner should confirm whether scripted interaction is in scope for I-07 or I-21.
- [ ] Under the owner decision on scripted interaction ([D-35](../owner-decisions.md#product-scope-and-non-goals)), an added option: a hot-seat sandbox of up to four decks (the player's and three from I-15 shares, public links or an [I-79](i79-table-sets.md) set), each seat with its opening hand under the free mulligan, every seat moved by the player, no rules engine and no model. TopDecked "Supports up to four decks per simulation on the same device" (version 12.1.0, 2023-11-13, [App Store](https://apps.apple.com/us/app/topdecked-mtg/id1173388234); corrected 2026-11-11 from 13.0.5, which carries only the QR line). Added 2026-11-11.
- [ ] Track, by the player's own taps, commander damage dealt to up to three imagined opponents, kept separate per commander (CR 903.10a, and the loss at 21 in CR 104.3j and CR 704.6c). The goldfish has a life total and no commander-damage tally. No opponent acts.
- [ ] Let the player set the designations the checklist in I-19 names and the playtest does not track: the monarch, the initiative, the Ring, day and night, the City's Blessing, and experience, energy and poison counters. The player sets them. The engine does not infer them from Oracle text.
      **Twelfth pass, 2026-11-11:** [Playgroup's Sparring page](https://playgroup.gg/playgroup-live/how-sparring-works), updated 2026-11-06, says its phantom opponents use 21,480 interaction spells from 6,934 of Playgroup's games. Those counts are theirs. They are further evidence for the scripted-interaction decision above. They are not a log this product can replay, and [I-81](i81-a-review-of-the-goldfish-sessions-you-recorded.md) reads only sessions recorded here.

**Fourteenth pass, 2026-11-14.** Archidekt's update of 2026-11-12 describes three playtester behaviours this list did not name ([news 28409148](https://archidekt.com/news/28409148)). Moxfield's feedback board, the same day this pass was read, listed an undo of the last zone change. The page printed no vote total ([board](https://moxfield.nolt.io/)).

- [ ] **Play card and shuffle** opens an alphabetical list of the deck still in the library, with cards that have a basic land type in their own section at the top. The player picks one card, or several by the multi-select already required above, and those cards move to the battlefield. The rest of the library is not reordered on screen. Added 2026-11-14.
- [ ] **A snapshot opens in the playtester.** The library dealt is the snapshot's list, and the session record names that snapshot, which #1315 already does for the current deck. Closing the playtester does not write the snapshot back onto the deck. Added 2026-11-14.
- [ ] **Undo the last zone change.** One action returns the cards moved by the last play, draw or shuffle to the zones they left, and says what it restored. It does not undo a note, a life total or a designation the player set by hand. A second undo restores the change. Added 2026-11-14.
- [ ] **Mobile controls** for those three actions are named buttons of at least 40 px, in English and French. Archidekt's note says the old phone layout was fiddly and that they moved controls to be easier to press. It does not list the new positions, so this spec does not copy a layout. Added 2026-11-14.

#### US-07-14-01

As a player goldfishing a tutor, I want the library listed in order with basic lands set apart, so that I can put one card onto the battlefield without scrolling a shuffled pile.

#### US-07-14-02

As a player looking at an old version of a deck, I want to goldfish that version, so that the current list is not what I am testing.

**Passing.** The library list is alphabetical. Basics are a separate section. Choosing one card moves only that card, then the playtester returns to the table. Opening a snapshot deals that snapshot's cards. The deck's current rows are unchanged when the playtester closes. Undo restores the last zone change and names the cards.

**Non-passing.** The library list is the shuffled order. Choosing a card shuffles the library as a side effect the player did not ask for. Goldfishing a snapshot writes those cards onto the deck. Undo reverts a life total or a monarch the player set. A control that exists only as an icon with no name.

**Open question.** Archidekt's "Play card & shuffle" puts the chosen card onto the battlefield and, by the menu's name, shuffles. This spec's item shuffles only when the player asks, after the card has moved. Whether the default should shuffle, as their menu name implies, is open. Recommended: do not shuffle unless the player confirms, because an accidental shuffle is the failure the undo item exists to repair.

### Enrichment (2026-11-11)

**User story.** As a player goldfishing a deck, I want the session to use the deck I built and to be tied to that version, so that two runs can be compared.

**Acceptance.**

- The library is the main deck plus the command zone, not Sideboard or Considering.
- A recorded session names the snapshot it was played from.
- Commander damage and the named designations are set by the player and never inferred by a rules engine.

**UX.** The solitaire limit stays on screen. Hotkeys are listed in a cheat sheet and do not fire while typing. Saving a session to resume is explicit.

**Data and API.** Sessions stay on `POST /api/decks/[id]/playtest-sessions`. Designations are session state, not deck rows.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `playtest_recorded {snapshot: new or reused, mulligan: free or london}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in to record. A guest may goldfish the session deck and the log is discarded at sign-out unless they save the deck first. Scripted opponents stay behind D-35.

**Open questions.** Whether a hot-seat of four decks is in scope stays D-35. I-81 reads logs only after they exist.

### Definition of done

A player can test two versions of a deck and see evidence that helps choose between them.

---
