# I-107: The Turn A Goldfish Completes Its Route

> **Initiative:** I-107, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-19 (promoted from the seventeenth pass's speed-variant line on [I-31](i31-deck-lab.md)) · **Priority:** Later for every slice, behind [I-31](i31-deck-lab.md)'s engine, [I-65](i65-how-this-deck-wins.md)'s route map and owner decision D-103 · **Paid:** the headline figure never; the full distribution and history are candidates for [I-30](i30-business-model-and-paid-tier.md) · **Written 2026-11-19**
> **Placement:** the simulated counterpart of [I-65](i65-how-this-deck-wins.md)'s static turn estimates. I-65 owns the route model, the route map and two estimates computed without a shuffle (the mana-only floor, 6.1, and Spellbook's speed band, 6.2). I-31 owns the seeded goldfish engine, its colour model and its limits. I-107 owns one question neither answers: on which turn does this list, shuffled and goldfished, complete the one route its owner declares, with a seed, a sample size and an interval. It never names a bracket and never models opponents.
> **Research:** the seventeenth pass's line on I-31 (2026-11-19) and one fetch of EDHcheck's pricing page on 2026-11-19, not committed, so every external fact links its entry in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** the route-completion predicate per route kind, the route clock run (distribution of the completion turn with seed, n, interval and engine version), its limits line, the Deck Lab panel that shows it, and the free and paid split of those outputs. **Does not own:** the route kinds and the route map (I-65); the seeded shuffler, intervals and two-snapshot verdicts (I-21); the goldfish engine and its colour model (I-31); the interactive playtest (I-07); bracket rules and turn expectations (I-28, I-77); pricing (I-30).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-31       | The seventeenth pass's speed-variant line becomes a pointer here. I-31's engine exposes the per-turn game state that I-107's predicates read; I-31 adds no speed figure of its own. |
| I-65       | A non-goal line: the simulated turn on which a route completes belongs to I-107. I-65 keeps its two static estimates and the route map, which I-107 reads.                          |
| I-21       | No change. I-107 consumes slices 1, 3 and 5 (shuffler, intervals, two-snapshot verdict).                                                                                            |
| I-28, I-77 | No change. A route clock never feeds the bracket estimate and never sits beside a bracket's turn expectation.                                                                       |

## Overview

"How fast does my deck win?" is a question players already pay to answer. EDHcheck's Premium sells a "Full Turn Clock: we play your deck 1,500 times: the turn-by-turn win curve, how it wins and which combos close games, a typical game card by card, the cards that make it faster" [1], and its free tier keeps the headline turn [1][2]. Its note of 2026-10-27 adds drains, life gain and Kaalia's attacks "one card family at a time" [2]: a damage model written by hand, not a rules engine. The seventeenth pass recorded the price, "$5.83/month, billed $35 every 6 months", as the first anchor for probability analytics that this roadmap had [2].

The product's planned answers stop short of the question. I-65 computes, for each route, a mana-only floor "assuming every piece is in hand, one land drop each turn and no interaction", and Spellbook's speed band from `manaValueNeeded` (I-65 6.1 and 6.2). Both say how fast a route could go, not how often a shuffled list gets there. I-31 simulates the list with a seed and an interval, but reports land drops, colours, the keep table and the commander's cast turn, not a route.

This initiative joins the two: the owner declares one route from I-65's map; I-31's engine goldfishes the list n times; for each game, the route's completion predicate reports the first turn it holds; the panel shows the distribution of that turn with its seed, n, interval, engine version and a limits line that names everything the model leaves out. The figure never names a bracket, because a speed read as a power verdict is the risk this file is written around.

**Why a new initiative.** The seventeenth pass wrote this as an "optional speed variant" on I-31. On review it is a distinct deliverable: it needs a completion predicate per route kind that neither I-31 nor I-65 owns, it answers a question with its own surface and its own competitor, and it carries a risk (speed read as power) that the lab's other outputs do not. **Why Later.** It reads I-31's engine (slices 1 to 5) and I-65's route map (slice 3), both Next and unbuilt, and D-103 decides whether the figure shows at all.

## What the market does

All rows were read on 2026-11-19 unless dated otherwise.

| Product or source                 | What it does or says                                                                                                                                                                                                                                                                            | Source |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **EDHcheck Premium**              | "Full Turn Clock: we play your deck 1,500 times: the turn-by-turn win curve, how it wins and which combos close games, a typical game card by card, the cards that make it faster, and Deep Draw" (verified); the free tier lists the bracket, a 1–10 power score and the Turn Clock's headline | [1]    |
| **EDHcheck updates** (2026-10-27) | Drains, life gain and Kaalia's attacks added one card family at a time                                                                                                                                                                                                                          | [2]    |
| **Commander Spellbook**           | A speed band per combo from `manaValueNeeded`, with no shuffle (read by I-65 on 2026-11-10)                                                                                                                                                                                                     | [3]    |
| **mtg-mcp-server**                | A greedy five-turn goldfish of spendable mana per turn; no route (read by I-31 on 2026-11-09)                                                                                                                                                                                                   | [4]    |
| **This product**                  | `scoreWinSpeed` (`src/lib/deck/bracket.ts`, line 64) counts single-label `winCondition` cards and text such as "win the game"; the solo playtest goldfishes by hand (`src/lib/playtest/`); no simulated route completion                                                                        | code   |

**The gap.** One competitor sells a simulated kill turn and hand-writes its damage model per card family; no tool found reports the completion turn of a route the owner declares, with its seed, n, interval and a limits line, and without a power score beside it.

## Current state in this codebase

Verified on `dev` at `045f4992` (#1578) on 2026-11-19:

- **No simulation engine.** `src/lib/deck-lab/` does not exist; I-31 slice 1 creates it. I-21's seeded shuffler is unbuilt.
- **Speed in the bracket score.** `scoreWinSpeed` (`src/lib/deck/bracket.ts`, line 64) reads card labels and Oracle phrases. I-65 open question 4 asks whether it moves to route data; I-107 does not touch it.
- **Goldfish by hand.** The playtest engine (`src/lib/playtest/engine.ts`) runs one game the player drives, with draw evidence (`src/lib/playtest/draw-progress-evidence.ts`); it simulates nothing on its own.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `deck-analysis` for the predicates and the run report, reading I-31's engine and I-65's route map through their entry points; `playtest` stays the interactive table.

## Functional requirements

### 1. Principles

1.1 The figure answers one declared route, never "the deck". The owner picks the route from I-65's map; the product never picks the fastest one for them.
1.2 Every figure carries its seed, n, interval, engine version and route definition version, and a link replays it (I-21).
1.3 No bracket, power score or comparison with other decks appears beside the figure, and the figure feeds no estimate.
1.4 The limits line names what the model leaves out: opponents' interaction, blockers and life gain, cards whose effects the engine does not model, and the mulligan policy used.

### 2. Route kinds, version 1

2.1 **Combo assembled.** The route completes on the first turn on which every piece of one of its variants is in hand or on the battlefield and the engine's mana model can pay what Spellbook lists as needed (`manaValueNeeded`), tutors resolved only as I-65's finders allow.
2.2 **Commander damage.** The commander is cast on its engine turn and attacks each later turn with its printed power and double strike if it has it, plus enhancers from I-65's roles the owner confirms; the route completes when one opponent has taken 21 (CR 903.10a). The report also gives the turn three opponents would have taken 21 each, attacking one opponent per turn.
2.3 **Counted drain (Later, slice 5).** The owner declares, per payoff, the amount per trigger and the triggers per turn; the route completes when the total reaches 40 per opponent. The limits line says the triggers are declared, not simulated.
2.4 Other route kinds (combat, mill, poison, alternative win, lock) say "not modelled" with the reason; nothing is guessed.

### 3. The run and the report

3.1 A run goldfishes n games (default 2,000; the ladder of I-31 slice 3) to a horizon of 15 turns, under I-31's default mulligan policy, recorded with the run.
3.2 The report: the median completion turn with its interval, the 25th and 75th percentiles, the share of games completed by turns 6, 8 and 10, and the share not completed by turn 15.
3.3 A run on a later snapshot can be compared with an earlier one through I-21 slice 5's two-snapshot verdict.

### 4. Visibility

4.1 Private to the owner by default. Whether a route clock can appear on the public page, and with what wording, is D-103.

### 5. Free and paid

| Part                                                                    | Free | Paid candidate  | Why                                                                                                                                                            |
| ----------------------------------------------------------------------- | ---- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The headline: median turn with its interval for one declared route      | Yes  | —               | The competitor keeps its headline free, and the figure is a check on one's own list ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) |
| The full distribution, several routes per run, history across snapshots | —    | Yes, after I-30 | The competitor sells it at $5.83 a month; heavier compute and storage, as I-31's paid line says                                                                |

## Data model / API

```
RouteClockKind   comboAssembled | commanderDamage | countedDrain                 -- discriminated union
RouteClockInput  deckVersionId, routeId, routeDefinitionVersion, kind, declared{enhancers[]? , drainPayoffs[]?}, n, horizon, seed
RouteClockRun    id, input, engineVersion, mulliganPolicy, distribution[]{turn, completed}, median, interval, p25, p75,
                 shareBy{6, 8, 10}, notCompleted, limits[], createdAt
```

- `routeCompleted(state, route): boolean` is a pure predicate per `RouteClockKind`, with an exhaustive `never` guard, in `src/modules/deck-analysis/domain/route-clock.ts`.
- `RouteClockRun` is stored with I-31's `DeckLabRun` (slice 7) as a run kind, so replay links and engine-version handling are shared. No new table before I-31 slice 7.
- Route: `POST /api/decks/[id]/lab/route-clock` runs it on the server runner (I-31 slice 9) or in the worker (I-31 slice 3); the result is the same for the same seed.

## Non-goals

- A general damage simulator or a rules engine: [I-21](i21-reproducible-probability-bench.md)'s non-goal stands, and only the route kinds of section 2 are modelled.
- Opponents, blockers, removal or any interaction.
- A bracket, a power score, a win rate, or "faster than N% of decks" beside the figure; the figure never feeds [I-77](i77-a-bracket-estimate-players-can-audit.md)'s estimate.
- The static mana-only floor and speed band: those stay [I-65](i65-how-this-deck-wins.md)'s.
- Choosing the route for the player, or a "fastest route" ranking.

## Testing strategy

- **Predicates (solitary):** a hand-built state with both pieces of a two-card combo and enough mana completes on that turn; one piece missing does not; a commander with power 7 and double strike completes 21 on its second attack; an unmodelled route kind fails to compile without its "not modelled" branch.
- **Run (sociable, with I-31's engine and a seeded shuffler):** the same seed gives the same distribution; doubling n narrows the interval; a list with no piece of the declared combo reports 100% not completed by turn 15.
- **Report:** every figure carries seed, n, interval, engine version and route version; the limits line lists the four omissions of 1.4; no output field names a bracket.
- **Accessibility and layout:** the distribution is a table with a caption and a chart with a text equivalent; at 360 px the table scrolls inside its own region.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: a state holding Thassa's Oracle and Demonic Consultation with four mana available returns `routeCompleted: true` for that combo route.

## Delivery slices

| #   | Slice                                                                                                                                    | Depends on                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0   | Owner: show a route clock at all; private only or a public wording; the free headline and the paid line; which route kinds first (D-103) | — (owner)                           |
| 1   | `routeCompleted` for combo assembled and commander damage over a hand-built game state; solitary tests                                   | I-31 slice 1; I-65 slice 1          |
| 2   | The run: n seeded games through I-31's engine, the distribution, interval, percentiles and the limits line; no UI                        | 1; I-31 slices 2 to 5; I-65 slice 3 |
| 3   | The Deck Lab panel "Route clock": declare one route, run, read the table and chart; English and French                                   | 2; I-31 slice 6; D-103              |
| 4   | Stored runs with replay links, as a `DeckLabRun` kind; two-snapshot comparison through I-21 slice 5                                      | 3; I-31 slice 7; I-21 slice 5       |
| 5   | Counted drain with declared payoffs, and its limits line                                                                                 | 2                                   |
| 6   | Paid gating of the full distribution, several routes per run and history                                                                 | 4; I-30's decision                  |

No slice can start now. Scheduled agents must not pick slice 0 (the owner's), or slice 3 before D-103 is committed.

## Open questions

1. **D-103.** Show a route clock at all; private only or also on the public page; is the headline free and the distribution paid; which route kinds first? Recommended: build it private, with combo assembled and commander damage first, the median with its interval free, the distribution and history as I-30 candidates, and no public display until an owner-approved wording exists.
2. **The horizon and the default n.** Recommended: 15 turns and 2,000 games as starting values, kept as data; slice 2 measures the interval they give on fixture decks, and the defaults change if it is wider than half a turn.
3. **Tutors.** Should a tutor fetch a missing combo piece in the goldfish? Recommended: yes, only for finders I-65's map says can reach that piece, paying their cost, and the limits line says so.

## Sources

Read on 2026-11-19 unless stated otherwise.

1. EDHcheck, pricing; "Full Turn Clock: we play your deck 1,500 times …" verified on 2026-11-19 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://edhcheck.com/pricing>
2. EDHcheck, updates, including the note of 2026-10-27, as recorded by the seventeenth pass on [I-31](i31-deck-lab.md). <https://edhcheck.com/updates/>
3. Commander Spellbook backend (MIT), `estimate_bracket`, speed from `mana_value_needed`, as cited in [I-65](i65-how-this-deck-wins.md) source 7 (read 2026-11-10). <https://github.com/SpaceCowMedia/commander-spellbook-backend>
4. mtg-mcp-server, as cited in [I-31](i31-deck-lab.md) (read 2026-11-09).
5. Wizards of the Coast, Comprehensive Rules effective 2026-08-07, as served by the product: rule 903.10a (21 combat damage from one commander). <https://magic.wizards.com/en/rules>

## Feature contract (Full, 2026-11-19)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player who wants to know how fast their deck gets to its win can read a static floor (every piece in hand, one land a turn) or pay a competitor for a simulated kill turn whose model is written per card family. Nothing reports, for the one route the player declares, the turn on which the shuffled list completes it, with a seed, a sample size, an interval and a list of what the model leaves out.

### Goals

- The owner of a Thassa's Oracle deck declares the Consultation combo route from the map, runs the route clock, and reads the median completion turn with its interval, the shares completed by turns 6, 8 and 10 and the share not completed by turn 15, with the seed, the 2,000 games, the engine version and "no interaction modelled", and finds no bracket anywhere on the panel.

### Non-goals

- A rules engine, opponents or interaction; a bracket, power score, win rate or percentile against other decks; choosing the route for the player.

### Personas

The cEDH player checking how consistently a line assembles; the bracket-focused player who wants a number to bring to the pre-game talk without it becoming a score; the casual pod player curious about a commander-damage deck. See the roadmap persona table.

### User stories

#### US-107-01

As a deck owner, I want the turn my shuffled list completes the route I declared, with its interval, so that I know how consistent the deck is, not only how fast it could be.

#### US-107-02

As a deck owner, I want the panel to say what the model leaves out, so that I never read the figure as a game against real opponents.

#### US-107-03

As a deck owner, I want to compare the clock before and after a change, so that I see whether a swap made the route faster beyond chance.

#### US-107-04

As a signed-out player trying the lab on a pasted list, I want the rollout's guest rule to be true, so that I am not shown a control that fails without an account.

#### US-107-05

As a player using a keyboard or a screen reader, I want the distribution as a table with a caption, so that the chart is not the only way to read it.

### Acceptance criteria

#### AC-107-01 Happy path

Given a deck with a declared two-card combo route and a seed
When the owner runs the route clock with 2,000 games
Then the panel shows the median turn with its interval, the 25th and 75th percentiles, the shares by turns 6, 8 and 10 and the share not completed, with seed, n, engine version and the limits line, and no bracket or score

#### AC-107-02 Error and failure

Given the run is cancelled or the runner fails
When the owner retries
Then no partial figure is shown, the last completed run stays, and the message is a catalogue string

#### AC-107-03 Edge cases

Given a route kind that version 1 does not model (mill)
When the owner opens the route clock
Then that route is listed as "not modelled" with the reason, and cannot be run

#### AC-107-04 Guest and signed-in

Given the rollout
When a guest runs the lab on a pasted list and a signed-in owner runs it on a saved deck
Then both see the headline; only the signed-in owner's run is stored with a replay link

#### AC-107-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-107-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the owner declares a route, runs it and reads the result without a pointer
Then every control has a name, focus is visible, progress is announced, and the distribution is a captioned table as well as a chart

#### AC-107-07 Replay

Given a stored run with its seed and engine version
When anyone with the replay link opens it on the same engine version
Then the same distribution is reproduced exactly

### UX flow and states

Deck Lab gains a "Route clock" panel. The owner picks one route from I-65's map; the panel shows the assumptions (mulligan policy, horizon, n), a Run button with progress and cancel, then the result table, the chart and the limits line.

- Empty: "Declare a route from How this deck wins to run a clock".
- Loading: progress with games done and a cancel control.
- Error: the catalogue message and a retry, with the last run kept.
- Partial: a cancelled run shows nothing, not a partial distribution.

### Data model and API

The types in [Data model / API](#data-model--api). Stored as an I-31 run kind; one route.

### Analytics and telemetry

`route_clock_run {kind, n, completedShareBucket}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list or URL.

### Rollout and feature flags

Slices 1 and 2 are invisible. Slice 3 ships behind an I-69 switch, `lab.routeClock`, off until D-103 is committed, then on for guests on a pasted list and for signed-in owners.

### Dependencies

[I-31](i31-deck-lab.md) slices 1 to 7 and 9 (engine, colour model, default run, page, run record, server runner); [I-65](i65-how-this-deck-wins.md) slices 1 and 3 (route kinds and the map); [I-21](i21-reproducible-probability-bench.md) slices 1, 3 and 5 (shuffler, intervals, two-snapshot verdict); [I-30](i30-business-model-and-paid-tier.md) for slice 6; D-103.

### Risks and mitigations

- **Speed read as power.** A fast median becomes a bracket claim at the table. Mitigation: no bracket on the panel, private by default, D-103 decides any public wording, and the figure feeds no estimate.
- **A rules engine by another name.** Each new route kind invites another card family. Mitigation: route kinds are a closed union; a new kind is a spec change, not a slice.
- **False precision.** A goldfish ignores opponents. Mitigation: the interval, the limits line and "goldfish" in the panel's title.

### Kill criteria

None. This initiative is not in the Now band. Stop it if the owner answers D-103 with "no route clock".

### Open questions

See [Open questions](#open-questions) above: D-103, the horizon and n, and tutors.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-107-101 A swap that should make the combo faster

As a deck owner, I want to see whether adding a tutor made my combo route faster, so that I keep the swap only if the change is real.

#### AC-107-100 Happy path

Given two snapshots, before and after adding one tutor that I-65 lists as a finder for a piece
When the owner compares their route clocks with the same seed
Then I-21's verdict says whether the median moved beyond the interval, with both runs' figures

#### AC-107-101 Failure

Given the two snapshots were run on different engine versions
When the owner compares them
Then the comparison is refused with "re-run both on the current engine", and nothing is guessed

#### AC-107-102 Edge

Given the tutor cannot reach the missing piece (wrong card type)
When the clock runs
Then the tutor fetches nothing for that route, and the limits line says which finders were used

#### US-107-102 A commander-damage deck

As the owner of a Voltron deck, I want the turn my commander deals 21 to one opponent, so that I see how much my equipment speeds it up.

#### AC-107-103 Happy path

Given a commander with power 5 and double strike, cast on turn 3 on average
When the clock runs
Then the report gives the turn one opponent reaches 21 and the turn three opponents would, citing CR 903.10a

#### AC-107-104 Failure

Given a commander that is not a creature
When the owner opens the clock
Then commander damage is "not modelled" for that deck, with the reason

#### AC-107-105 Edge

Given an equipment the owner confirms as an enhancer
When the clock runs
Then its power bonus applies only from the turn the engine can cast and equip it, and the limits line names it

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "Declare a route from How this deck wins to run a clock".                                               |
| Loading          | Games done, a cancel control, the layout still.                                                         |
| Error            | The catalogue message, a retry, the last completed run kept.                                            |
| Partial          | Nothing from a cancelled run.                                                                           |
| Stale            | A run on an older deck version or engine says so and offers a re-run.                                   |
| Guest            | Runs on a pasted list; nothing stored.                                                                  |
| Signed-in        | Runs stored with replay links on the owner's deck.                                                      |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Route choice, run, cancel and the table can be reached without a pointer.                               |
| Screen reader    | Progress, the median, the interval and the limits are announced in words.                               |
| Colour           | The chart's bars have a pattern and the table carries every value.                                      |
| Success          | A completed run shows its replay link.                                                                  |

### Alternate paths

- The owner declares a different route. The previous run stays in history under its own route.
- The deck changes after a run. The run is marked stale; nothing re-runs on its own.
- The player switches locale mid-flow. Chrome switches; card names stay the printing's language.

### Roadmap record (2026-11-19)

This file is the record from the start. The seventeenth pass's line on I-31 ("an optional speed variant", 2026-11-19) is replaced there by a pointer to this file, and the seventeenth pass's table row for I-31 stays as it was written; the eighteenth pass's table records the promotion.

## I-107: The Turn A Goldfish Completes Its Route

**Outcome:** a deck owner declares one route from I-65's map and reads, from I-31's seeded goldfish, the turn on which the shuffled list completes it: the median with its interval, percentiles, shares by turns 6, 8 and 10, the seed, n, engine version and a limits line, with no bracket or score beside it.

**Status:** Later
**Priority:** Later for every slice, behind I-31's engine, I-65's map and D-103. The headline is never paid; the full distribution and history are I-30 candidates.
**Impact / effort:** Medium / medium
**Risk:** High. A speed figure read as a power verdict; a slide into a rules engine. Private by default, a closed set of route kinds and D-103 answer it.
**Depends on:** I-31 slice 1 and I-65 slice 1 for slice 1; I-31 slices 2 to 5 and I-65 slice 3 for slice 2; I-31 slice 6 and D-103 for slice 3; I-31 slice 7 and I-21 slice 5 for slice 4; I-30 for slice 6.

EDHcheck's Premium sells a "Full Turn Clock" that plays a deck "1,500 times" for the turn-by-turn win curve, keeps the headline free, and adds damage sources one card family at a time. I-65 plans static estimates that assume every piece in hand; I-31 plans a seeded goldfish with no route. The seventeenth pass wrote the join as a variant of I-31; the eighteenth pass gives it its own file.

### Scope

- [ ] `routeCompleted` for combo assembled and commander damage (slice 1).
- [ ] The seeded run, its distribution, interval and limits line (slice 2); the Deck Lab panel (slice 3, after D-103).
- [ ] Later: stored runs and two-snapshot comparison (slice 4); counted drain (slice 5); the paid line (slice 6).

### Engineering enablers

- `RouteClockKind` is a closed discriminated union with an exhaustive `never` guard; each predicate is pure and solitary-tested.
- Runs share I-31's run record, seed handling and engine-version rules.

**Paid-tier angle:** the headline stays free; the full distribution, several routes per run and history are candidates after I-30.

### Enrichment (2026-11-19)

**User story.** As a deck owner, I want the turn my shuffled list completes the route I declared, with its interval, so that I know how consistent the deck is.

**Acceptance.**

- A run shows the median with its interval, percentiles and shares, with seed, n, engine version and limits.
- An unmodelled route says "not modelled" and cannot run.
- No bracket, power score or percentile against other decks appears.
- The same seed reproduces the same distribution.

**UX.** A "Route clock" panel in Deck Lab: declare a route, run with progress and cancel, read a table and a chart.

**Data and API.** A `DeckLabRun` kind; one route on the server runner or the worker.

**i18n and access.** English and French chrome; a captioned table beside the chart.

**Telemetry.** `route_clock_run {kind, n, completedShareBucket}`. Reserved for I-39.

**Rollout.** `lab.routeClock`, off until D-103.

**Open questions.** D-103; horizon and n; tutors.

### Definition of done

The owner of a two-card combo deck declares the combo route, runs 2,000 seeded games, reads the median turn with its interval, the percentiles, the shares by turns 6, 8 and 10 and the share not completed, sees the seed, engine version and limits line, finds no bracket on the panel, and reproduces the same figures from the replay link.

---
