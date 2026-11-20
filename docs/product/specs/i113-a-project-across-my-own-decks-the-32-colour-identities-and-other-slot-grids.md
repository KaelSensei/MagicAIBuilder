# I-113: A Project Across My Own Decks: The 32 Colour Identities And Other Slot Grids

> **Initiative:** I-113, proposed for the [roadmap](../roadmap.md) · **Status:** Next — proposed 2026-11-20 · **Priority:** Next for slices 1 to 3 (the pure fill, the project page, the printable checklist), after the numbered Next band; Later for slices 4 to 8 · **Paid:** never · **Written 2026-11-20**
> **Placement:** a goal the player sets over many of their own decks. [I-60](i60-player-stats-and-year-in-review.md) counts decks per colour identity, but a count has no target and no slot a player can pin, skip or share. [I-53](i53-monthly-deckbuilding-challenges.md) owns challenges between players, and its open question 6 hands "A personal '32 deck challenge' tracker" to "I-08 or I-27", neither of which took it. [I-101](i101-collecting-goals-beyond-a-set.md) owns collecting goals over cards, never decks. [I-01](i01-deck-editor-workflow.md) owns folders, where a deck sits in at most one.
> **Research:** two dated notes of 2026-11-20 that proposed the same subject independently (angle R4, homebrew and creative constraints, candidate N1; angle R5, money, time and deck lifecycles, candidate N1), merged here into one file. Neither is committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the project (a named list of slots from a template or written by the owner), the deterministic fill of slots from the owner's decks with pins and skips, each slot's fit and optional slot rules, overlap between the project's decks, the printable checklist, the seeded draw among built slots, and the project's share link. **Does not own:** the identity rule ([I-60](i60-player-stats-and-year-in-review.md)'s counting module and [I-03](i03-trustworthy-deck-feedback.md)'s rulebreaker table); rule types ([I-53](i53-monthly-deckbuilding-challenges.md)); theme handles ([I-102](i102-a-theme-you-can-measure.md)); the commander finder and play styles ([I-54](i54-find-your-next-commander.md)); folders ([I-01](i01-deck-editor-workflow.md)); the seeded generator ([I-21](i21-reproducible-probability-bench.md)); share tokens ([I-08](i08-share-compare-and-learn.md)); a deck's stage in the roster ([I-114](i114-a-decks-place-in-the-roster-keep-rest-retire-or-take-apart.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-53       | Open question 6 points here: the personal 32-deck tracker is I-113's. I-53 keeps briefs, frozen entries and judging between players. Recorded as a dated non-goal line. |
| I-60       | A non-goal line: a target with slots the player pins, skips and shares is I-113's; I-60 keeps passive counts, and its counting module gives I-113 the identity rule.    |
| I-54       | An empty slot opens the finder with the slot's exact identity and the project's decks ticked in "not like my decks"; no change to I-54's scope.                         |
| I-114      | Slice 8 here reads I-114's stages ("a retired deck still fills its slot or not, by the owner's choice").                                                                |

## Overview

The 32-deck challenge, one Commander deck in each of the 32 colour identities, is the largest self-imposed challenge on r/EDH. Arctic Shift returned 74 r/EDH titles containing "32 deck" since 2025-01-01, and 68 containing "32 deck challenge" [1]. The largest: "As a new player, I took on the 32 deck challenge with deck building restrictions. A year later, I just finished…" (338 points, 100 comments, 2026-07-09); "32 Deck Challenge was actually more fun than I expected!" (84 points, 2025-01-19); "32 deck challenge quitters: Where did you stop?" (77 points, 191 comments, 2025-01-12), whose poster is "right around halfway" and finds "narrowing down to just the six I want to bring with me is a rough time" [1].

Players build the tracker themselves. "32 Deck Challenge & Deck Theme Tracker" (8 points, 2025-12-02): "When I started looking for tools to track my progress, the only thing I could find was a simple PDF's you could type over … So I built my own" [2]. An Archidekt list titled "32 Deck Challenge" (2,111 views, updated 2026-03-12) uses one category per identity and colour labels as stages: a deck used as a tracker of decks [3]. A TappedOut folder adds a second condition per slot: "My goal is to make all 32 decks and win a 4 player pod with each one" [3]. Variants share the job: a "Lore accurate 32 deck Challenge" with a rule per slot (35 points, 2026-10-03), a Ravnica ten-guild challenge rolled on a die before each game (7 points, 17 comments, 2026-02-03) [4]. I-53's own research counted 31 of the 100 most recent r/EDH "challenge" titles as the 32-deck challenge, two of them asking for "a blank 32 challenge" [5].

Burn-out is part of the evidence. In "I have too many decks" (50 points, 85 comments, 2026-05-28) the poster stopped at 28: "the last four color combos haven't been inspiring"; a comment at 16 points calls the challenge one "so many people get burnt out on" [6]. A project must let a player skip a slot or stop, and must never push.

This initiative turns the spreadsheet into one grid: slots filled from the player's own decks by a stated rule, pins and skips, each slot's fit checked, overlap between the project's decks named, a printable checklist, and from an empty slot the commander finder with the identity preset.

**Why one file for two notes.** R4 and R5 proposed the same subject from two angles (a creative grid of slots; a goal over the shelf of decks). The coordinator merged them; this file takes R5's computed fill, pins and skips and R4's templates, slot rules, overlap and draw. **Why Next.** Slice 1 is a pure function over I-60's shipped identity rule (#1551, #1629) and needs no migration; the player voice is strong and repeated.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source          | What it does or says                                                                                             | Source |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| **r/EDH**                  | 74 "32 deck" titles since 2025-01-01, up to 338 points; quitters, completions, variants with a rule per slot     | [1][4] |
| **A player's spreadsheet** | "the only thing I could find was a simple PDF's you could type over … So I built my own"                         | [2]    |
| **Archidekt**              | A deck named "32 Deck Challenge" used as a tracker, one category per identity, colour labels as stages           | [3]    |
| **TappedOut**              | A "32 Deck Challenge" folder; "win a 4 player pod with each one"                                                 | [3]    |
| **Competitors**            | No app that tracks which identities a player's decks cover was found (search summary): "not found", not "absent" | [6]    |

**The gap.** No deck site shows which slots are built, planned or empty, whether each deck still fits its slot, or which decks repeat each other.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **Folders.** A deck sits in at most one folder: `Deck.folderId` (`prisma/schema.prisma`, lines 166 and 167). One deck cannot sit in both a "32" project and a "Ravnica guilds" project.
- **Statistics.** I-60's counting module computes `colorIdentities` (`src/lib/deck/player-stats.ts`, line 81, computed at line 171; #1551), shown on the private `/stats` page (#1629). It shows no empty identity, no goal and no plan.
- **Nothing else.** No object holds slots across decks.

**Owning context:** `deck-analysis` for the pure fill and fit; the deck context for the project aggregate.

## Functional requirements

### 1. Principles

1.1 Progress is computed, never declared: "19 of 32 built, 6 planned, 7 empty" with its denominator.
1.2 No streak, badge, point, level, completion reward, leaderboard or reminder (I-39 7.4; I-60 7; the engagement-loop non-goal).
1.3 Nothing changes a deck: no deck is moved between folders, edited or deleted by a project.

### 2. Projects and slots

2.1 Templates: the 32 colour identities, the 10 colour pairs, the 5 shards, the 5 wedges and the 5 four-colour identities; or slots the owner writes.
2.2 A slot holds one of the owner's decks, a plan (a commander by Oracle ID and a note), or nothing; it may be skipped.
2.3 The fill: each slot takes, by default, the earliest created deck whose identity matches exactly (I-60's rule, I-03's rulebreaker table); other matching decks are listed under it as "also fits"; a pin overrides the default.
2.4 One deck may sit in several projects; its folder is unchanged.

### 3. Fit and slot rules

3.1 Exact colour identity first. A slot whose deck no longer fits says why ("No longer fits: identity BG") and still shows the deck.
3.2 Optional slot rules from I-53's rule types and I-102's handles ("a guild's legend", "plane Ravnica", "under 50 EUR"), each failure worded "slot rule", never "illegal".

### 4. Overlap, finder, checklist, draw and sharing

4.1 Overlap between the project's decks, as counts with the cards and play styles named: shared non-basic cards from I-60's counting module, and the same main play style from I-54.
4.2 From an empty slot, "Find a commander for this slot" opens I-54's finder with the exact identity and the project's decks ticked in "not like my decks".
4.3 A printable and CSV checklist, blank or filled ("a blank 32 challenge").
4.4 A seeded draw among built slots, replayable from a seed shown on screen (I-21's generator).
4.5 A revocable, `noindex` share link that shows only what the owner chose; a private deck in a slot shows "filled" without its name or list unless the owner shows it.

### 5. Free and paid

| Part            | Free | Paid candidate | Why                                                                             |
| --------------- | ---- | -------------- | ------------------------------------------------------------------------------- |
| Everything here | Yes  | —              | It organises the player's own decks; I-30 1.2: own data is never the paid lever |

## Data model / API

```
DeckProject   id, ownerId, name, template: identities32 | pairs10 | shards5 | wedges5 | fourColour5 | custom, shareToken?, createdAt
ProjectSlot   projectId, key (identity or owner label), position, pinnedDeckId?, plan {commanderOracleId?, note?}?, skipped, rules[]?
SlotFill      slotKey, deckId?, alsoFits[], state: built | planned | empty | skipped, fit: fits | noLongerFits {reason}
```

- `fillProject(slots, decks, pins, skips)` is pure and reads I-60's identity rule; `SlotFill.state` is a discriminated union with an exhaustive `never` guard.
- Owner-only routes: `POST /api/projects`, `PATCH /api/projects/[id]/slots/[key]`, `GET /api/projects/[id]`; the share route reads a projection only.

## Non-goals

- Streaks, badges, points, completion rewards, levels, leaderboards or any ranking of projects or players.
- Reminders or re-engagement messages ([I-63](i63-one-notification-system.md) 1.2).
- A model choosing a slot's commander, or a generated deck for a slot.
- Frozen entries, judging or a deadline ([I-53](i53-monthly-deckbuilding-challenges.md)).
- Counting owned cards ([I-101](i101-collecting-goals-beyond-a-set.md)).
- Moving decks between folders.
- A public directory of projects, and indexing.
- A paid limit on projects or slots.
- A deck's stage in the roster, rest or retirement ([I-114](i114-a-decks-place-in-the-roster-keep-rest-retire-or-take-apart.md)).

## Testing strategy

- **Fill (solitary):** decks of identity WU, WU and colourless in a 32-slot project fill Azorius with the earliest WU deck, list the other as "also fits", fill colourless, and read "2 of 32".
- **Pin and skip (solitary):** pinning the second WU deck and skipping the four four-colour slots reads "2 of 28, 4 skipped".
- **Partners (solitary):** a partner pair's identity is the union I-60's module gives; a rulebreaker follows I-03's table.
- **Tone (CI):** "streak", "rank", "top %", "série" and "classement" appear in no project string (I-60 7.6's test, reused).
- **Red first:** slice 1's first Red: a mono-green deck placed in the GW slot is refused with "Identity G does not match slot GW".

## Delivery slices

| #   | Slice                                                                                                                                                         | Depends on                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | Templates as data and a pure `fillProject` with fit, pins and skips, over fixtures, reading I-60's identity rule; no schema, no route                         | None (I-60 slice 1 done)                |
| 2   | `DeckProject` and `ProjectSlot`, owner routes, the project page in `en` and `fr` with identities in words as well as symbols (I-49); deletion changes no deck | 1                                       |
| 3   | A printable and CSV checklist, blank or filled                                                                                                                | 2                                       |
| 4   | "Find a commander for this slot": I-54's finder with exact identity and "not like my decks"                                                                   | 2; I-54 slices 3 and 7                  |
| 5   | Overlap between the project's decks: shared non-basic cards and shared main play style, named                                                                 | 2; I-60's counting module; I-54 slice 2 |
| 6   | Slot rules from I-53's rule types and I-102's handles, worded "slot rule"                                                                                     | 2; I-53 slice 1; I-102 slice 1 (done)   |
| 7   | A seeded draw among built slots, and the revocable `noindex` share link                                                                                       | 2; I-21 slice 1; I-08's share token     |
| 8   | Later: a slot condition from I-35's confirmed games ("logged a game with it"), labelled "self-reported casual games"; stages from I-114                       | 2; I-35 slice 6; I-114 slice 2          |

Slice 1 can start now: it is pure and reads a shipped module.

## Open questions

1. **Its own object or a folder kind?** A folder holds a deck at most once (`Deck.folderId`), and a project must allow one deck in several projects. Recommended: its own object.
2. **Templates first.** Recommended: 32 identities and 10 pairs.
3. **Sharing default.** Recommended: private, with a revocable `noindex` link and no profile listing.
4. **A finished project.** Should it show anything beyond its count? Recommended: no, under I-60's and I-53's refusal of badges.
5. **Formats.** Does a slot accept a deck of another format, such as Oathbreaker? Recommended: Commander only in version 1.
6. **Game conditions.** Slice 8 turns a list into a scoreboard; should it exist at all?
7. **Its own page or a section of `/stats`?** Recommended: its own page, linked from `/stats`'s identity table.

## Sources

Read on 2026-11-20 unless stated otherwise. Reddit scores are Arctic Shift snapshots.

1. r/EDH, Arctic Shift `title=32 deck` (74) and `title=32 deck challenge` (68), `after=2025-01-01`: "As a new player, I took on the 32 deck challenge with deck building restrictions. A year later, I just finished…", 2026-07-09, 338 points, 100 comments (verified on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`), <https://www.reddit.com/r/EDH/comments/1urgi9u/>; "32 Deck Challenge was actually more fun than I expected!", 2025-01-19, 84 / 20, <https://www.reddit.com/r/EDH/comments/1i556mn/>; "32 deck challenge quitters: Where did you stop?", 2025-01-12, 77 / 191, <https://www.reddit.com/r/EDH/comments/1hzph5l/>; "On December 31st, 2024, I completed the 32 deck challenge!", 2025-01-03, 60 / 41, <https://www.reddit.com/r/EDH/comments/1hse99i/>; "For folks who did the 32 deck challenge, did you end up keeping all those decks?", 2025-10-01, 23 / 87, <https://www.reddit.com/r/EDH/comments/1nvefj0/>.
2. r/EDH, "32 Deck Challenge & Deck Theme Tracker", 2025-12-02, 8 points. <https://www.reddit.com/r/EDH/comments/1pcbqia/>
3. Archidekt, deck 5244386 "32 Deck Challenge" (created 2023-08-27, updated 2026-03-12, 2,111 views). <https://archidekt.com/decks/5244386/32_deck_challenge>; TappedOut folder "32 Deck Challenge" (search summary). <https://tappedout.net/mtg-deck-folders/02-10-21-32-deck-challenge>
4. r/EDH, "Lore accurate 32 deck Challenge", 2026-10-03, 35 points, <https://www.reddit.com/r/EDH/comments/1wwciny/> (Archidekt folder <https://archidekt.com/folders/968440>); "Ravnica guild-colored 10-deck challenge commander recommendations", 2026-02-03, 7 / 17, <https://www.reddit.com/r/EDH/comments/1qut0og/>.
5. [I-53](i53-monthly-deckbuilding-challenges.md), "What players do on their own" and open question 6.
6. r/EDH, "I have too many decks", 2026-05-28, 50 points, 85 comments. <https://www.reddit.com/r/EDH/comments/1tptwzq/>; a search for a tracker app found none (search summary, 2026-11-20).

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player working through the 32-deck challenge, or another set of decks (ten guilds, five shards), tracks it in a spreadsheet, a PDF, a deck folder or a fake deck beside the deckbuilder. No deck site knows which of their decks fills which slot, whether each still fits, or which decks repeat each other [1][2][3].

### Goals

- A project of slots from a template, filled from the player's own decks by a stated rule, with pins and skips.
- Each slot's fit checked, with optional slot rules worded as the player's own.
- Overlap between the project's decks named; an empty slot opens the commander finder.
- A printable checklist, a seeded draw, and a private share link.

### Non-goals

- Streaks, badges, rankings, reminders; a model choosing commanders; judging; card collecting; moving decks; a directory; a paid limit; a deck's stage (I-114).

### Personas

The casual pod player with many decks; the new player who uses the challenge to learn; the content creator who documents a series; the collector and budget player. See the roadmap persona table.

### User stories

#### US-113-01

As a player halfway through the 32-deck challenge, I want my existing decks placed in their colour-identity slots, so that I see which identities are left without a spreadsheet.

#### US-113-02

As a player who stopped at 28 decks, I want to skip the four slots I will not build, so that the project reads finished on my terms.

#### US-113-03

As a player choosing what to build next, I want an empty slot to open the commander finder filtered to its identity, with my project's play styles marked, so that the new deck does not repeat an old one.

#### US-113-04

As a pod that rolls a guild die before a game, I want a draw among my project's built slots with a seed I can show, so that the table sees the pick was not chosen.

### Acceptance criteria

#### AC-113-01 Happy path

Given a player with decks of identity WU, WU and colourless, and a project from the "32 colour identities" template
When the project opens
Then the Azorius slot holds the earliest created WU deck, the other WU deck is listed under it as "also fits", the colourless slot is filled, and progress reads "2 of 32"

#### AC-113-02 Error and failure

Given a pin cannot be saved
When the player retries
Then the slot keeps its last confirmed deck, and the message is a catalogue string

#### AC-113-03 Pin and skip

Given the same project
When the player pins the second WU deck and marks the four four-colour slots skipped
Then the Azorius slot shows the pinned deck, progress reads "2 of 28, 4 skipped", and no deck changes

#### AC-113-04 Guest and signed-in

Given a project shared by link with one private deck in a slot
When a signed-out visitor opens the link
Then the slot shows "filled" without the deck's name or list unless the owner chose to show that deck, and the page sends `noindex`

#### AC-113-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-113-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player reads the grid without a pointer
Then each slot is named by its identity in words ("Azorius, white and blue") as well as symbols, its state is a word, and no state is colour alone

#### AC-113-07 No longer fits

Given a slot holding a deck whose commander is later changed to a black-green pair
When the project loads
Then the slot reads "No longer fits: identity BG" and still shows the deck; nothing is moved

#### AC-113-08 Several projects

Given one deck placed in both a "32" project and a "Ravnica guilds" project
When either project loads
Then both show it, and the deck's folder is unchanged

#### AC-113-09 Tone

Given the project catalogue in `en` and `fr`
When the deny-list test runs
Then "streak", "rank", "top %", "série" and "classement" appear in no string

### UX flow and states

"New project" offers templates. The project page is a grid of slots, each "built", "planned", "empty" or "skipped", with a progress line, an overlap panel and actions: pin, skip, plan, find a commander, print, draw, share.

- Empty: a template with every slot empty and "Fill from my decks".
- Loading: a busy state that keeps the grid still.
- Error: a slot change that fails keeps its last confirmed state.
- Partial: overlap's play styles read "not yet available" until I-54 slice 2 ships.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`project_created {template, slots}`, `project_slot_changed {action: pin | skip | plan}`, `project_checklist_printed {}`. Reserved for I-39's store. Counts and enums only: no deck or card name.

### Rollout and feature flags

Signed-in only for projects; guests read share links. Behind an I-69 switch, `decks.projects`, on when slice 2 ships.

### Dependencies

[I-60](i60-player-stats-and-year-in-review.md) slices 1 and 2 (done); [I-03](i03-trustworthy-deck-feedback.md)'s rulebreaker table; [I-54](i54-find-your-next-commander.md); [I-53](i53-monthly-deckbuilding-challenges.md) slice 1; [I-102](i102-a-theme-you-can-measure.md) slice 1; [I-21](i21-reproducible-probability-bench.md) slice 1; [I-08](i08-share-compare-and-learn.md); [I-49](i49-colour-vision-and-low-vision-display.md); [I-35](i35-pod-game-log.md) slice 6 and [I-114](i114-a-decks-place-in-the-roster-keep-rest-retire-or-take-apart.md) slice 2 (slice 8 only).

### Risks and mitigations

- **An engagement loop.** A grid of empty slots pushes. Mitigation: skips and stop, no reminders, no rewards, a tone test.
- **A wrong identity.** Mitigation: one identity rule, I-60's, with I-03's rulebreakers.
- **Exposure of private decks.** Mitigation: the share link shows "filled" only, unless the owner chooses.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-113-101 A blank checklist

As a player starting the challenge, I want a blank printable list of the 32 identities with their names, so that I can plan with friends.

#### AC-113-100 Happy path

Given a new 32-identity project
When the player prints the checklist
Then a black-and-white page lists the 32 identities in words and symbols with empty boxes

#### AC-113-101 Failure

Given the draw is requested with no built slot
When the player draws
Then nothing is drawn and the message says there is no built slot

#### AC-113-102 Edge

Given an empty UR slot
When the owner chooses "Find a commander for this slot"
Then I-54's finder opens with identity UR exact, the project's decks ticked in "not like my decks", and the visible query shown

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | Every slot empty and "Fill from my decks".                                                              |
| Loading          | A busy state that keeps the grid still.                                                                 |
| Error            | The slot keeps its last confirmed state; a catalogue message.                                           |
| Guest            | A shared project with private decks as "filled".                                                        |
| Signed-in        | The full grid and every action.                                                                         |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; guild and shard names in French where the catalogue has them.      |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Every slot action is reachable without a pointer.                                                       |
| Screen reader    | Slots are announced by identity in words and state.                                                     |
| Colour           | Identities in words and symbols; states as words.                                                       |
| Success          | "Pinned", "Skipped", "Plan saved".                                                                      |

### Alternate paths

- The player deletes a project. No deck changes.
- The player writes custom slots ("one deck per Tarkir khan"). Fit uses slot rules only.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-113 is a link here. It merges R4's N1 and R5's N1 of the nineteenth pass, which proposed the same subject; I-53's open question 6 now points here.

## I-113: A Project Across My Own Decks: The 32 Colour Identities And Other Slot Grids

**Outcome:** a player's own decks fill a grid of slots (the 32 colour identities, ten pairs, shards, wedges, or slots they write) by a stated rule, with pins, skips, fit, overlap, a printable checklist, a seeded draw and a private share link, and nothing pushes.

**Status:** Next
**Priority:** Next for slices 1 to 3; Later for slices 4 to 8. Never paid.
**Impact / effort:** Medium / small for slices 1 to 3 (the identity rule ships in I-60's module)
**Risk:** Medium. A goal can become the engagement loop the roadmap refuses; answered by skips, no reminders and a tone test.
**Depends on:** nothing for slice 1; I-54 for slices 4 and 5; I-53 slice 1 for slice 6; I-21 slice 1 for slice 7; I-35 slice 6 and I-114 slice 2 for slice 8.

74 r/EDH titles about the 32-deck challenge since 2025-01-01, up to 338 points; players track it in spreadsheets, PDFs and fake decks; I-53's open question 6 left the tracker without an owner.

### Scope

- [ ] Templates and the pure `fillProject` (slice 1); the project page (slice 2); the checklist (slice 3).
- [ ] Later: the finder handoff (slice 4); overlap (slice 5); slot rules (slice 6); draw and share (slice 7); game conditions and stages (slice 8).

### Engineering enablers

- One identity rule (I-60's); `SlotFill` as a discriminated union; a tone deny-list test.

**Paid-tier angle:** none.

### Enrichment (2026-11-20)

**User story.** As a player halfway through the 32-deck challenge, I want my decks in their slots, so that I see what is left.

**Acceptance.** Exact-identity fill with "also fits"; pins and skips; "no longer fits" without moving; one deck in several projects; private decks hidden on share links.

**UX.** A grid of slots with states, progress, overlap and actions.

**Data and API.** `DeckProject`, `ProjectSlot`; owner-only routes.

**i18n and access.** English and French; identities in words.

**Telemetry.** `project_created`, `project_slot_changed`, `project_checklist_printed`. Reserved for I-39.

**Rollout.** `decks.projects`, with slice 2.

**Open questions.** Own object; templates; sharing; finished projects; formats; game conditions; page placement.

### Definition of done

A player opens a 32-identity project, sees 19 slots filled from their decks with "also fits" lines, pins one deck, skips the four four-colour slots, sees a slot whose commander changed read "No longer fits", prints the checklist, and shares a link where a private deck reads only "filled".

---
