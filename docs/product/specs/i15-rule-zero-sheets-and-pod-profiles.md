# Spec: Rule 0 Sheets And Pod Profiles (I-15)

> **Initiative:** [I-15 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Owns:** stating and comparing playgroup intentions. **Does not own:** official bracket scoring, which stays in I-03.

## Overview

Before a game, a pod needs thirty seconds of shared context: how fast each deck wants to end, how it wins, whether it runs combos, extra turns or resource denial, how many proxies are in it, and which house rules apply. The sheet records that, keeps it private until the owner shares it, and never pretends to be the official rules.

## What the market does

Wizards shipped **Commander Brackets** in 2025 as the official vocabulary: five tiers — Exhibition, Core, Upgraded, Optimized, cEDH. The informal 1-to-10 scale it replaced meant something different in every playgroup. Brackets anchor the conversation to how quickly a deck expects to end a game.

| Product                                    | What it does                                                            | Limit                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **EDHREC salt**                            | Community survey scoring how much players dislike facing a card, 0 to 4 | A card-level opinion poll, not a deck agreement                                              |
| **ScrollVault**, **EDHcheck**, **castlog** | Read a list and return one of the five official tiers                   | They classify a deck; they do not record what a pod agreed                                   |
| **CommanderSalt**                          | Explains bracket, power, salt and synergies for an imported list        | A community thread from May 2026 calls the report entertaining but prone to overrating decks |
| **commandermatchup.online**                | Positions itself as a Rule 0 matchmaking hub                            | Matchmaking is a different product from a pod's own sheet                                    |
| **DeckCheck DTI**                          | A deck-tendency index inside the editor                                 | Proprietary scale, not the official brackets                                                 |

One number worth keeping: tested against **1,229 tournament decklists, a published calculator matched 77.1 %, against 73.9 % for always answering Bracket 3** ([ScrollVault](https://scrollvault.net/posts/how-scrollvault-bracket-calculator-works.html), FAQ citing engine v389, October 2026). Corrected 2026-11-11: this line called 77.1 % exact and 99.5 % within one bracket "the realistic accuracy ceiling for automatic classification". 77.1 % is about 3 points above that constant guess, and "within one" is nearly automatic in a sample of Brackets 2 to 4. An estimate this close to a constant guess is the reason this initiative records stated intentions rather than inferring them.

**The gap.** Every tool classifies a deck. None records an agreement between four people, keeps it private by default, and keeps preference apart from rule.

## Current state in this codebase

- `src/lib/deck/bracket.ts` — bracket scoring across six dimensions, with the Game Changers list and banlist detection. This is the official-rules side and must not be mixed into the sheet.
- No salt data, no pod concept, no per-deck declaration of intent.
- Sharing today is public-or-private at deck level (I-08). There is no consented, scoped share.

## Functional requirements

### 1. The sheet

1.1 A sheet attaches to a deck, a pod of up to four decks, or an [I-79](i79-table-sets.md) table set _(added 2026-11-11)_. A set is not a pod (D-40): a pod is people, a set is one author's decks.
1.2 Recorded fields: intended speed, how the deck wins, combos present, extra turns, resource denial (land destruction, stax), proxy count, and free-text house rules.
1.3 Every field is **player-stated**. Nothing on the sheet is inferred from the decklist.
1.4 The sheet shows the deck's computed bracket **beside** the stated intent, visibly separated, with the label that one is calculated and the other declared. _Added 2026-11-11:_ the calculated column shows [I-77](i77-a-bracket-estimate-players-can-audit.md)'s estimate with its method version and audit link, and [I-78](i78-what-this-deck-does-to-the-table.md)'s table line. Beside the declared combos, extra turns and resource denial fields (1.2), it shows the computed counts with their cards and a "copy into my sheet" action. 1.3 stands: no declared field is filled.

### 2. Privacy and consent

2.1 A sheet is private by default. Nobody sees it until the owner shares it.
2.2 Sharing is an explicit action scoped to one pod, and is revocable.
2.3 Revoking removes the sheet from the pod view immediately; it does not retroactively delete what other players already read.
2.4 A shared sheet never exposes the deck's collection or ownership data.

### 3. Comparison

3.1 Up to four consented sheets compare side by side on one screen.
3.2 The comparison highlights declared mismatches — a deck stating "ends on turn 5" in a pod stating "long games" — as a conversation prompt, never as a verdict.
3.3 Official data (bracket, Game Changers, banlist) renders in a separate column from declared preferences, with distinct styling. _Added 2026-11-11:_ that column shows I-77's estimate with its method version and audit link, and each deck's I-78 table line (I-78 slice 5). An I-79 table set's balance view reuses this comparison layout.

### 4. Honesty

4.1 The sheet states, on screen, that it does not guarantee a balanced game.
4.2 Any salt-style score is labelled as community opinion with its source and date, never as a rule.

## Data model

```
PodSheet      id, ownerId, deckId?, podId?, createdAt, updatedAt
  speed              enum  (exhibition | core | upgraded | optimized | cedh | custom)
  winConditions      text[]
  hasCombos          bool + text
  hasExtraTurns      bool + text
  hasResourceDenial  bool + text
  proxyCount         int
  houseRules         text
Pod           id, name, ownerId, createdAt
PodShare      podSheetId, podId, consentedAt, revokedAt?
```

`PodShare` carries the consent, so revoking is a row update and never a delete of the player's own sheet.

## Non-goals

- Matchmaking, ranking or pairing players. That is a different product.
- Inferring intent from a decklist. Automatic classification stays in I-03, where it is already labelled as calculated.
- A public directory of sheets.
- Replacing the official bracket. The sheet sits beside it.

## Testing strategy

- **Solitary:** a sheet with declared fields renders them unchanged; no field is derived.
- **Boundary:** a revoked share disappears from the pod comparison on the next read; the owner's sheet survives.
- **Sociable:** four consented sheets compare, and the official column is present and visually distinct in both themes.
- **Privacy:** a sheet shared to pod A is unreachable from pod B, and from an unauthenticated request.

## Delivery slices

| #   | Slice                                                                | Depends on      |
| --- | -------------------------------------------------------------------- | --------------- |
| 1   | Sheet model, per-deck create and edit, private only                  | —               |
| 2   | The computed bracket shown beside declared intent, visibly separated | 1; I-77 slice 1 |
| 3   | Pod creation, explicit consent share, revoke                         | 1               |
| 4   | Four-way comparison with the mismatch prompts                        | 2, 3            |
| 5   | Salt-style score as a labelled, dated community signal               | 4               |

Slice 5 depends on I-09's source-and-freshness disclosure already being applied to EDHREC data; do not start it before that is true.

## Open questions

- Is the pod a durable object players reuse weekly, or a throwaway for one night? Durable implies membership and invitations, which is noticeably more product.
- Should the proxy count feed the acquisition plan in I-06? Tempting, but it couples a social declaration to a financial calculation; keep them apart until a player asks.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

### Goals

- Four players can compare consented profiles and see house preferences distinguished from official rules.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-15-01

As a player about to sit down, I want a sheet of what we agreed, separate from the official rules, so that a house rule is not mistaken for a ban.

#### US-15-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-15-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-15-01 Happy path

Given a signed-in player and the English locale
When intent, combos, extra turns, mass land denial, proxies and house rules are fields, not one blob of text.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-15-02 Happy path

Given a signed-in player and the English locale
When the sheet is private until an explicit share.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-15-03 Happy path

Given a signed-in player and the English locale
When a computed column is labelled computed and never overwrites a declared field.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-15-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-15-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-15-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in to edit. A shared sheet is readable by the link without an account. Guests do not create a pod.

#### AC-15-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-15-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-15-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Four decks compare in one view. A violation of a house rule says house rule, not illegal. A calendar file downloads for one night, with no external account.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A new sheet record per deck or pod. Official legality stays the existing report. The calendar file is generated, not stored at a third party.

### Analytics and telemetry

`rule0_shared {audience: pod or link, fields_filled: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in to edit. A shared sheet is readable by the link without an account. Guests do not create a pod.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether the first comparison is free stays D-95. I-88 only writes fields this sheet already has.

### Sources

- https://github.com/dekkerglen/CubeCobra/pull/3118
- https://playgroup.gg/posts/101-the-new-playgroup-app-and-everything-else-since-july
- https://west-games.com/mtg-power-level-calculator/
- https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=my%20playgroup&after=2025-01-01&limit=100
- https://playgroup.gg/commander/power-level
- https://archidekt.com/features
- https://piltoverarchive.com/news/piltover-archive-update-whats-new
- https://www.reddit.com/r/EDH/comments/1xsscfl/
- https://rule0.carrd.co/
- https://edhrec.com/articles/digital-deckbuilding-archidekt-deck-comparison-and-edhrec-salt-scores
- https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-15-101

As a player, I want the product to record intentions, combos, extra turns, resource denial, proxies and house rules on a per-deck or per-pod sheet., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Record intentions, combos, extra turns, resource denial, proxies and house rules on a per-deck or per-pod sheet.

#### AC-15-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-102

As a player, I want the product to keep the profile private by default, and share it only with an explicit consent action., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the profile private by default, and share it only with an explicit consent action.

#### AC-15-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-103

As a player, I want the product to compare up to four decks on the same sheet., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Compare up to four decks on the same sheet.

#### AC-15-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-104

As a player, I want the product to keep preference and salt-style scores separate from official rules, bracket and ban data., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep preference and salt-style scores separate from official rules, bracket and ban data.

#### AC-15-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-111 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-15-105

As a player, I want the product to state on the sheet that it does not guarantee a balanced game., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: State on the sheet that it does not guarantee a balanced game.

#### AC-15-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-106

As a player, I want the product to a structured house rule "no cards printed only in Universes Beyond" on the sheet, checked against each deck through I-57's card-level flag instead of free text., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A structured house rule "no cards printed only in Universes Beyond" on the sheet, checked against each deck through I-57's card-level flag instead of free text. Cube Cobra merged a preference that hides such cards from search and suggestions on 2026-11-02 (PR #3118).

#### AC-15-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-107

As a player, I want the product to a pod game-night planner, after the pods of spec slice 3: a recurring night with an RSVP that names the deck version and the declared bracket each player brings, the pod's sheet attached, tables formed by I-41's pairing policy, and I-35's log prompted after the game; I-46 may post the reminder to Discord., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A pod game-night planner, after the pods of spec slice 3: a recurring night with an RSVP that names the deck version and the declared bracket each player brings, the pod's sheet attached, tables formed by I-41's pairing policy, and I-35's log prompted after the game; I-46 may post the reminder to Discord. It works before the table and needs no chat. It is free, with a possible pod-pass perk under I-30. Playgroup.gg added "a calendar tool, recurring game nights" to its playgroups on 2026-11-04 (post). It sits here rather than in I-23, because the RSVP carries the deck and declared bracket this sheet already holds, while I-23 is a Discord surface planned for 2027.

#### AC-15-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-120 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-15-108

As a player, I want the product to pod fit (spec slice 4)., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Pod fit (spec slice 4). The comparison adds a computed column per deck: I-77's estimate with its floors, I-65's route line and earliest-turn estimate, interaction by answer class, tutors and fast mana, and I-78's table-effect line. Each is labelled Computed, and mismatch prompts are questions, never verdicts. West Games compares "your score to the pod you expect" (page, 2026-07-28). r/EDH has 76 "my playgroup" titles with 2,548 points since 2025-01-01 (Arctic Shift, read 2026-11-10). Whether this first comparison is free is D-95. Added 2026-11-11.

#### AC-15-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-123 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-15-109

As a player, I want the product to beside a mismatch prompt, cite the measured cost of a gap with its date: "one bracket above … about five percentage points"; "two brackets above wins roughly 30% of four-player games, against an expected 25%" (Playgroup, updated 2026-11-10)., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Beside a mismatch prompt, cite the measured cost of a gap with its date: "one bracket above … about five percentage points"; "two brackets above wins roughly 30% of four-player games, against an expected 25%" (Playgroup, updated 2026-11-10). Added 2026-11-11.

#### AC-15-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-126 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-15-110

As a player, I want the product to house rules become rule objects checked by I-53's checkDeckAgainstRules:, so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: House rules become rule objects checked by I-53's checkDeckAgainstRules:

#### AC-15-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-111

As a player, I want the product to declared exceptions: a deck lists the exceptions its pod agreed (an unbanned card, proxies), and the editor shows them as declared., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Declared exceptions: a deck lists the exceptions its pod agreed (an unbanned card, proxies), and the editor shows them as declared. The official verdict stays one line away, and public views say "declared exceptions" (D-90). Piltover Archive sets a Competitive or Casual ruleset per deck (update, 2025-06-22). Added 2026-11-11.

#### AC-15-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-112

As a player, I want the product to sheet fields: the time available for the evening; each player's limits ("boundaries"); and a one-screen card with a QR code (I-50 slice 11) for a player who arrives late., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Sheet fields: the time available for the evening; each player's limits ("boundaries"); and a one-screen card with a QR code (I-50 slice 11) for a player who arrives late. r/EDH: "What time does everyone need to leave?", 30 points, 40 comments (thread, 2026-11-10). rule0.carrd.co lists "boundaries" (page, seen 2026-11-10). Added 2026-11-11.

#### AC-15-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-15-113

As a player, I want the product to the official column gains "table attention flags" from I-78: Game Changers, mass land denial, extra turns, early two-card combos, and the theft and stax classes., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The official column gains "table attention flags" from I-78: Game Changers, mass land denial, extra turns, early two-card combos, and the theft and stax classes. They are labelled as categories; salt stays slice 5 behind D-25. Archidekt shows a deck's Salt Sum against a distribution (EDHREC, 2024-03-27). Added 2026-11-11.

#### AC-15-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-138 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-15-114

As a player, I want the product to neighbour changes, 2026-11-11: the computed column shows I-77's estimate with its method version and audit link, so spec slice 2 waits for I-77 slice 1; it also shows I-78's table line and, beside the declared combos, extra turns and resource denial fields, the computed counts with "copy into my sheet", and no declared field is ever filled (1.3)., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Neighbour changes, 2026-11-11: the computed column shows I-77's estimate with its method version and audit link, so spec slice 2 waits for I-77 slice 1; it also shows I-78's table line and, beside the declared combos, extra turns and resource denial fields, the computed counts with "copy into my sheet", and no declared field is ever filled (1.3). Requirement 1.1 accepts an I-79 table set, whose balance view reuses slice 4's layout; a set is one author's decks, not a pod (D-40).

#### AC-15-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-141 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-15-115

As a player, I want the product to download one .ics file for a planned night: the date, the pod's name and a link to the sheet., so that a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

#### AC-15-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Download one .ics file for a planned night: the date, the pod's name and a link to the sheet. No Google account and no mail. Recurrence is a later line in the same file, still with no external calendar service.

#### AC-15-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-15-144 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

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

## I-15: Rule 0 Sheets And Pod Profiles

**Spec:** [`specs/i15-rule-zero-sheets-and-pod-profiles.md`](i15-rule-zero-sheets-and-pod-profiles.md)

**Outcome:** a playgroup can share intentions and house rules before a game, and can tell those preferences apart from official rules.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

CommanderSalt, DeckCheck DTI and EDHREC salt are the references for describing how a deck feels. None of them is a matchmaking authority.

### Scope

- [ ] Record intentions, combos, extra turns, resource denial, proxies and house rules on a per-deck or per-pod sheet.
  - The sheet's calculated column shows [I-65](i65-how-this-deck-wins.md)'s route line, such as "Combo (2 lines), drain; earliest estimate turn 5", the way it shows the computed bracket (I-65 slice 10). The declared "how the deck wins" field stays the player's: the product never fills it, and a "copy into my sheet" action lets the owner do it.
- [ ] Keep the profile private by default, and share it only with an explicit consent action.
- [ ] Compare up to four decks on the same sheet.
- [ ] Keep preference and salt-style scores separate from official rules, bracket and ban data.
- [ ] State on the sheet that it does not guarantee a balanced game.
- [ ] A structured house rule "no cards printed only in Universes Beyond" on the sheet, checked against each deck through [I-57](i57-printing-preferences-everywhere.md)'s card-level flag instead of free text. Cube Cobra merged a preference that hides such cards from search and suggestions on 2026-11-02 ([PR #3118](https://github.com/dekkerglen/CubeCobra/pull/3118)).
- [ ] A pod game-night planner, after the pods of spec slice 3: a recurring night with an RSVP that names the deck version and the declared bracket each player brings, the pod's sheet attached, tables formed by [I-41](i41-store-commander-nights.md)'s pairing policy, and [I-35](i35-pod-game-log.md)'s log prompted after the game; [I-46](i46-discord-and-chat-integrations.md) may post the reminder to Discord. It works before the table and needs no chat. It is free, with a possible pod-pass perk under I-30. Playgroup.gg added "a calendar tool, recurring game nights" to its playgroups on 2026-11-04 ([post](https://playgroup.gg/posts/101-the-new-playgroup-app-and-everything-else-since-july)). It sits here rather than in I-23, because the RSVP carries the deck and declared bracket this sheet already holds, while I-23 is a Discord surface planned for 2027.
- [ ] Pod fit (spec slice 4). The comparison adds a computed column per deck: [I-77](i77-a-bracket-estimate-players-can-audit.md)'s estimate with its floors, I-65's route line and earliest-turn estimate, interaction by answer class, tutors and fast mana, and [I-78](i78-what-this-deck-does-to-the-table.md)'s table-effect line. Each is labelled Computed, and mismatch prompts are questions, never verdicts. West Games compares "your score to the pod you expect" ([page](https://west-games.com/mtg-power-level-calculator/), 2026-07-28). r/EDH has 76 "my playgroup" titles with 2,548 points since 2025-01-01 ([Arctic Shift](https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=my%20playgroup&after=2025-01-01&limit=100), read 2026-11-10). Whether this first comparison is free is [D-95](../owner-decisions.md#money-and-plans). Added 2026-11-11.
- [ ] Beside a mismatch prompt, cite the measured cost of a gap with its date: "one bracket above … about five percentage points"; "two brackets above wins roughly 30% of four-player games, against an expected 25%" ([Playgroup](https://playgroup.gg/commander/power-level), updated 2026-11-10). Added 2026-11-11.
- [ ] House rules become rule objects checked by I-53's `checkDeckAgainstRules`:
  - banned cards;
  - banned mechanics from I-28's hard-rule classes;
  - a Game Changer cap, or a pod points list with its cap;
  - a Scryfall query, shown verbatim.

  A violation reads "house rule", never "illegal". Archidekt "Custom format legality options" (56) and "Custom banlists" (29) are both open ([features](https://archidekt.com/features), seen 2026-11-10). Added 2026-11-11.

- [ ] Declared exceptions: a deck lists the exceptions its pod agreed (an unbanned card, proxies), and the editor shows them as declared. The official verdict stays one line away, and public views say "declared exceptions" ([D-90](../owner-decisions.md#product-scope-and-non-goals)). Piltover Archive sets a Competitive or Casual ruleset per deck ([update](https://piltoverarchive.com/news/piltover-archive-update-whats-new), 2025-06-22). Added 2026-11-11.
- [ ] Sheet fields: the time available for the evening; each player's limits ("boundaries"); and a one-screen card with a QR code (I-50 slice 11) for a player who arrives late. r/EDH: "What time does everyone need to leave?", 30 points, 40 comments ([thread](https://www.reddit.com/r/EDH/comments/1xsscfl/), 2026-11-10). rule0.carrd.co lists "boundaries" ([page](https://rule0.carrd.co/), seen 2026-11-10). Added 2026-11-11.
- [ ] The official column gains "table attention flags" from [I-78](i78-what-this-deck-does-to-the-table.md): Game Changers, mass land denial, extra turns, early two-card combos, and the theft and stax classes. They are labelled as categories; salt stays slice 5 behind [D-25](../owner-decisions.md#data-sources-and-partners). Archidekt shows a deck's Salt Sum against a distribution ([EDHREC](https://edhrec.com/articles/digital-deckbuilding-archidekt-deck-comparison-and-edhrec-salt-scores), 2024-03-27). Added 2026-11-11.
- [ ] Neighbour changes, 2026-11-11: the computed column shows [I-77](i77-a-bracket-estimate-players-can-audit.md)'s estimate with its method version and audit link, so spec slice 2 waits for I-77 slice 1; it also shows [I-78](i78-what-this-deck-does-to-the-table.md)'s table line and, beside the declared combos, extra turns and resource denial fields, the computed counts with "copy into my sheet", and no declared field is ever filled (1.3). Requirement 1.1 accepts an [I-79](i79-table-sets.md) table set, whose balance view reuses slice 4's layout; a set is one author's decks, not a pod ([D-40](../owner-decisions.md#product-scope-and-non-goals)).

- [ ] Download one `.ics` file for a planned night: the date, the pod's name and a link to the sheet. No Google account and no mail. Recurrence is a later line in the same file, still with no external calendar service.
**Twelfth pass, 2026-11-11:** the walkthrough that asks the questions one at a time is [I-88](i88-a-pre-game-script-that-fills-the-rule-0-sheet.md). It writes these fields and adds none. Wizards' 21 October 2025 update calls more pregame conversations "the real goal" ([update](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025)).

### Enrichment (2026-11-11)

**User story.** As a player about to sit down, I want a sheet of what we agreed, separate from the official rules, so that a house rule is not mistaken for a ban.

**Acceptance.**
- Intent, combos, extra turns, mass land denial, proxies and house rules are fields, not one blob of text.
- The sheet is private until an explicit share.
- A computed column is labelled computed and never overwrites a declared field.

**UX.** Four decks compare in one view. A violation of a house rule says house rule, not illegal. A calendar file downloads for one night, with no external account.

**Data and API.** A new sheet record per deck or pod. Official legality stays the existing report. The calendar file is generated, not stored at a third party.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `rule0_shared {audience: pod or link, fields_filled: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in to edit. A shared sheet is readable by the link without an account. Guests do not create a pod.

**Open questions.** Whether the first comparison is free stays D-95. I-88 only writes fields this sheet already has.

### Definition of done

Four players can compare consented profiles and see house preferences distinguished from official rules.

---

