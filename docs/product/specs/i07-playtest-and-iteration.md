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

