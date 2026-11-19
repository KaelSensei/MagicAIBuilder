# I-104: League Decks And The Change Allowance Between Rounds

> **Initiative:** I-104, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-19 · **Priority:** Later for every slice. Slice 1 is a pure function with no schema and needs nothing; slices 2 to 6 wait for [I-53](i53-monthly-deckbuilding-challenges.md) slice 1's rule types, [I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2's dated prices, [I-29](i29-cross-site-deck-index.md) slice 2's canonical list, [I-17](i17-precon-path-and-tiered-upgrades.md) slice 1's catalogue and owner decision D-101 · **Paid:** never for checking one's own list; a store-size league is a candidate for [I-30](i30-business-model-and-paid-tier.md) · **Written 2026-11-19**
> **Placement:** a group initiative beside [I-53](i53-monthly-deckbuilding-challenges.md) and [I-41](i41-store-commander-nights.md). I-53 owns one-shot challenges: one brief, one entry frozen for good, judged. I-41 owns one store night's pods. I-104 owns the time dimension neither has: a season of rounds, one registered list per member per round, and a check that measures each list against the member's previous registered list. It reuses I-53's rule types and never ranks players.
> **Research:** one dated note of 2026-11-19 (angle R1, with R3's budget block), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-19 and can differ from live Reddit. Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the league as an object (a host, members, a season of dated rounds), each round's allowance (swaps, money in one market, a declared pool, rules that relax from a round on), the registered list per member per round, the allowance check and its stored report, the change ledger per member, and the members-only league page with its export. **Does not own:** static deck rules and `checkDeckAgainstRules` (I-53); dated prices (I-32); the precon catalogue and one player's private upgrade ledger (I-17); pods and house rules (I-15); store nights (I-41); the game log (I-35); standings, points, Elo or prizes (non-goal).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-53       | A non-goal line: rounds, re-registration and an allowance measured from a previous entry belong to I-104. I-53 slice 1's rule types gain an optional `fromRound` that only I-104 reads, and a `stockPrecon {catalogueVersion, maxChanges}` rule type that both read. |
| I-17       | The seventeenth-pass ledger stays one player's private record. A league allowance on that ledger is I-104's; I-17 gives I-104 the catalogue version that starts a precon league (round 0).                                                                           |
| I-41       | Requirement 1.1 is unchanged: a night has no standings. A store-size league is I-104 slice 6, inside I-41's store plan once I-30 decides.                                                                                                                            |
| I-15       | A league may name the pod it belongs to (D-40); the pod's house rules stay on the sheet and are never checked by I-104.                                                                                                                                              |
| I-35       | No change. A logged game may name a league round in a later slice of I-35; I-104 reads no game result.                                                                                                                                                               |

## Overview

Leagues where the deck changes by round are a common way to play Commander at a store or in a group. The formats share one mechanic: everyone starts from a defined list (a stock precon, a budget cap, an open deck), and each round allows a limited change. Commander's Herald describes the classic precon league: "After each week's match … each player earns $5 in upgrades and may swap up to 5 different cards in their deck (although basic-for-basic land swaps … do not count against this limit). Any money not invested into upgrades that week can be rolled over to the next week, provided the amounts are tracked on the Miro board by Monday" [6]. On r/EDH, a 2026-11-09 thread lists budget leagues, precon leagues, a "Modified Pre-Con League" where "you could swap out a certain number of cards and they had to be under a certain dollar value", and sealed leagues where "each week you got to rip a pack and add cards from that to your deck" [3]. One reply names the cost of keeping it by hand: "it was difficult if you missed a week because you wouldn't get the swaps" [3].

Players keep these rules in a shared document and price each other's upgrades by hand. No deckbuilder read on 2026-11-19 records a season's rounds, checks a list against the change since the member's previous registered list, or shows the league that every deck complied. The one competitor that sells deck rules for leagues, Castlog's Liga-Builder, sells them beside ELO and points standings [8]; Playgroup's leagues group games and check no deck rule [9].

This initiative adds the league as a deck object: a host defines the rounds and their allowances, each member registers one list per round, the product checks it against the round's rules and the member's previous list, freezes it with its price date, and shows every member's lists, reports and ledger inside the league only. It never ranks anyone.

**Why a new initiative.** No file owns a list that changes by round under a shared rule. I-53's entries are one per brief and freeze for good; I-17's ledger is one player's and nobody else sees it; I-41 forms one night's pods; I-35 logs games. **Why Later.** Slice 1 needs nothing, but the league object needs I-53's rule types, I-32's dated prices and an owner answer on whether a league is a pod (D-40) and whether it ever shows standings (D-101). The evidence is a competitor's own page and r/EDH threads of 3 to 149 points.

## What the market does

All rows were read on 2026-11-19 unless dated otherwise.

| Product or source                    | What it does or says                                                                                                                                                                                                                                                                                                                                                                                       | Source        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Commander's Herald** (2024-01-15)  | A precon league: $5 of upgrades and up to 5 swaps a week, basic-for-basic swaps exempt, unspent money rolled over if tracked "on the Miro board by Monday", seasons of "10 – 12 weeks"                                                                                                                                                                                                                     | [6]           |
| **r/EDH, league threads**            | Four kinds of league in one thread (budget, precon, modified precon with a swap count and a price cap, sealed) [3]; a precon league with "$10 upgrade each week" carried over, priced on "TCGPlayer Listed Median value" [2]; a sealed league with "2 packs each week … Max you can buy each week is 4" [1]; players asking which precon to enter (62 points, 64 comments) [4]                             | [1]–[4], [11] |
| **r/EDH, scoring backlash**          | "Was excited to try out the upcoming commander league at my LGS...until I saw the scoring system", 149 points, 167 comments: "You'd spend more time bookkeeping than playing commander"                                                                                                                                                                                                                    | [5]           |
| **TopDeck.gg**                       | "Commander Precon League Week 9", 2026-06-01, 28 players, 2 Swiss rounds (through a cedhstats mirror)                                                                                                                                                                                                                                                                                                      | [7]           |
| **Castlog Liga-Builder**             | "Build MTG leagues for Commander and any format. Start free with ELO or points, then add skill trees, quests and budget rules. 8 optional modules" (page metadata, verified). Reported by the R1 reading: "live Cardmarket price validation", restrictions on "lands, mana rocks, tutors, free spells, and combo pieces", and a skill tree that relaxes restrictions. Free tier: one playgroup, one league | [8]           |
| **Playgroup Leagues** (2025-12-02)   | A league with "its own leaderboard, ELO, and detailed stats"; "one league for free". No deck rule is checked                                                                                                                                                                                                                                                                                               | [9]           |
| **Wizards, Commander Nights** (2023) | "a weekly Commander league with rotating special rules and achievement-based prizes": rules that change by week are an official pattern                                                                                                                                                                                                                                                                    | [10]          |
| **This product**                     | No league, season, round or game model in `prisma/schema.prisma`; a `DeckSnapshot` stores a `cardList` JSON; one budget per card in USD per deck; nothing compares two lists against an allowance                                                                                                                                                                                                          | code          |

**The gap.** Leagues with a change allowance run at stores and in groups, and the only tool that checks their deck rules sells them inside a standings product. No tool checks a member's list against the change since that member's previous registered list and shows the result to the league without ranking anyone.

## Current state in this codebase

Verified on `dev` at `045f4992` (#1578) on 2026-11-19:

- **No league or round model.** `prisma/schema.prisma` declares `Deck`, `DeckSnapshot` (line 265, with a `cardList` JSON), `PlaytestSession` (line 487) and the collection, rating, vote and AI models. A search of `src` for "league" finds only MTGTop8 event names in a `meta-insights` test fixture.
- **No list comparison under a rule.** The snapshot use cases (#1578) store and restore versions of one deck; nothing counts swaps between two lists or prices the cards added.
- **Budget.** One "Budget per card" in USD per deck and an over-budget count (`docs/product/user-guide.md`, "Deck Details").
- **No challenge checker yet.** I-53 slice 1's `checkDeckAgainstRules` is planned; the orphan `src/lib/challenges/challenges.ts` it replaces was deleted on 2026-11-12.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `format-rules` for the pure allowance check ([ADR 0009](../../adr/0009-legality-is-a-report-and-the-server-owns-rules.md): a check is a report and the server owns rules), `community` for the league, its members and its page, `deck-building` for reading a registered list from a deck version.

## Functional requirements

### 1. Principles

1.1 A league checks decks. It never ranks, scores or pairs players, and it reads no game result (I-41 1.1, I-35's non-goals, I-39 7.4).
1.2 Every verdict is a report with its evidence: the cards out, the cards in, the money spent with its price date and source, and the rule that failed. No model decides compliance.
1.3 A registered list is frozen. A later edit of the deck never changes a registration; the league page shows "changed since registration" instead.

### 2. Season and rounds

2.1 A host creates a league with a name, a season of rounds (each with a start date and a registration deadline) and a starting rule: a stock precon from [I-17](i17-precon-path-and-tiered-upgrades.md)'s catalogue (round 0), a budget cap on the whole list, or open.
2.2 Each round has an allowance, a list of typed parts: `swaps {max, basicsExempt, commanderCounts}`; `money {amount, market, priceSource, carryOver}`; `pool {declaredOnly}` for sealed and booster leagues, where added cards must come from the pool the member declares as opened that round; and I-53 static rules with an optional `fromRound`, so a rule can relax or tighten from round N.
2.3 The host sets the missed-round rule: "missed allowance is lost" or "missed allowance carries".
2.4 The host may edit a round that has not started. A started round is frozen; the page says when a rule changed and who changed it.

### 3. Registration and the check

3.1 A member registers one list per round from one of their decks. The product takes the deck's current version, computes its canonical list ([I-29](i29-cross-site-deck-index.md) slice 2) and freezes it.
3.2 `checkRoundAllowance(previous, next, allowance, prices)` compares the list with the member's previous registered list (or the starting list in round 1): swaps counted as pairs out and in, basic-for-basic swaps exempt when the host says so, the money delta priced in the league's one market at the registration date, carry-over applied, the pool rule applied.
3.3 A failing check registers nothing. The report names the failing part ("6 of 5 swaps") and the cards, and the member can fix the deck and register again before the deadline.
3.4 A passing check stores the report with the price date and source. A card with no price on that date is "unpriced" and the check is `unknown` for money, never `pass`.

### 4. The league page

4.1 Members see each member's registered lists per round, each report and the change ledger (money left, swaps used). A guest or a signed-in non-member sees nothing about the league, not even that it exists.
4.2 The host exports the season as CSV and JSON: rounds, allowances, registered lists and reports.
4.3 A member who leaves keeps their own lists; the league keeps their registrations under "former member" unless they ask for removal.

### 5. Free and paid

| Part                                                | Free | Paid candidate  | Why                                                                                                      |
| --------------------------------------------------- | ---- | --------------- | -------------------------------------------------------------------------------------------------------- |
| Checking one's own list against a league's round    | Yes  | —               | Checking a deck is never paid ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) |
| One league per pod, its page and export             | Yes  | —               | Playgroup and Castlog give one league free; the player's own data stays free (I-30 1.2)                  |
| More concurrent leagues per pod; store-size leagues | —    | Yes, after I-30 | A pod-pass or store-plan convenience, inside I-41's store plan (slice 6)                                 |

## Data model / API

```
League          id, name, hostUserId, podId?, startingRule, missedRoundRule (lost | carries), createdAt
LeagueRound     id, leagueId, index, startsAt, deadlineAt, allowance Json, frozenAt?
LeagueMember    leagueId, userId, joinedAt, leftAt?
LeagueEntry     id, leagueId, roundIndex, userId, deckId, deckVersionId, canonicalHash, cardList Json, registeredAt
AllowancePart   swaps{max, basicsExempt, commanderCounts} | money{amount, market, priceSource, carryOver}
                | pool{declaredOnly} | staticRule{ruleType, fromRound?}          -- discriminated union
AllowanceReport entryId, parts[]{part, verdict: pass | fail | unknown, detail}, priceDate, priceSource, carryOut
```

- `checkRoundAllowance` is a pure function in `src/modules/format-rules/domain/league-allowance.ts`; `AllowancePart` is a discriminated union with an exhaustive `never` guard. The server runs it at registration (ADR 0009); the browser shows the server's report.
- Registration writes the entry and its report in one Prisma transaction, and it is idempotent on `(leagueId, roundIndex, userId, canonicalHash)`, so a retried registration never creates a second entry.
- Routes: `POST /api/leagues`, `POST /api/leagues/[id]/rounds/[index]/entries` (register), `GET /api/leagues/[id]` (members only), `GET /api/leagues/[id]/export`. Every route checks membership on the server.

## Non-goals

- Standings, points, Elo, achievements, quests, prizes, pairings or match results (I-41 1.1, I-35's non-goals, I-39 7.4 and the roadmap's tournament-manager non-goal). Whether a league ever shows standings is D-101, not a slice.
- One-shot challenges with a brief, a frozen entry and judging: those stay [I-53](i53-monthly-deckbuilding-challenges.md)'s.
- One player's private upgrade ledger outside a league: [I-17](i17-precon-path-and-tiered-upgrades.md)'s.
- Selling boosters or recording purchases ([I-32](i32-seller-handoff-and-affiliate-carts.md), [I-33](i33-marketplace-ladder.md)); simulating packs (the draft non-goal). The opened pool is typed by the member.
- A public league directory or a store finder (the venue-directory non-goal).
- Any model deciding whether a list complies.

## Testing strategy

- **Allowance check (solitary):** 6 swaps against a cap of 5 fail with the six pairs named; a basic-for-basic swap is not counted when `basicsExempt`; a commander change counts as a swap only when `commanderCounts`; $13.50 of additions against $10 plus $4 carried passes with $0.50 carried out; an unpriced added card makes money `unknown`; a card added outside the declared pool fails `pool`; an unknown part kind fails to compile.
- **Round 0 (solitary):** a round-1 list one card away from the I-17 catalogue version fails "round 1 is the stock precon" and names the card.
- **Registration (sociable, with an in-memory league repository and its contract suite):** a failing check stores nothing; a retried registration with the same hash returns the same entry; an edit after registration shows "changed since registration" and leaves the entry unchanged.
- **Privacy (sociable):** a non-member and a guest get the same not-found answer for a league and for an entry.
- **Accessibility and layout:** the report table has headers and pass, fail and unknown are words; at 360 px the per-member ledger stacks.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 1's first Red: a round-3 list with six cards out and six in, against a cap of 5, returns `swaps: fail` with "6 of 5".

## Delivery slices

| #   | Slice                                                                                                                                                                                                       | Depends on                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 0   | Owner: may a league ever show standings; is a league a pod, a challenge with rounds, or its own object; the default price source and market; does a commander change count as a swap; the free line (D-101) | — (owner)                        |
| 1   | `checkRoundAllowance`: swap counting with the basics exemption, the money delta in one market, carry-over, the pool rule; solitary tests, no schema                                                         | —                                |
| 2   | `League`, `LeagueRound`, `LeagueMember` with an invite link, a host and season dates; static rules as I-53 rule types with `fromRound`                                                                      | 1; I-53 slice 1; D-101           |
| 3   | Registration: freeze the canonical list, run the check with I-32's dated price, store the report, "changed since registration"                                                                              | 2; I-29 slice 2; I-32 slice 2    |
| 4   | The members-only league page: lists, reports and ledger per member and round; CSV and JSON export; English and French                                                                                       | 3                                |
| 5   | Starting rules: an I-17 catalogue precon as round 0, the `stockPrecon` rule type, and "added cards come from this round's declared pool"                                                                    | 3; I-17 slice 1                  |
| 6   | Several leagues per pod and store-size leagues inside I-41's store plan                                                                                                                                     | 4; I-30's decision; I-41 slice 1 |

Slice 1 needs nothing and may be built at any time, but it is Later work: scheduled agents must not pick slice 0 (the owner's) or any slice from 2 on before D-101 is committed.

## Open questions

1. **D-101.** May a league ever show standings or points? That would reverse I-41 1.1 and I-35's non-goals; every competitor read pairs leagues with standings, and the 149-point thread shows players dislike heavy scoring [5]. Recommended: never in this initiative; a host who wants standings keeps them elsewhere.
2. **D-40 and D-101.** Is a league an I-15 pod, an I-53 private challenge with rounds, or its own object? Recommended: its own object that may name a pod, because a league is re-registered every round and a challenge freezes once.
3. **Prices.** Which price source and market by default, and what happens when a card has no price on the registration day? Recommended: the market the host picks from I-32's labelled prices, with "unknown" for an unpriced card and a host override recorded in the report.
4. **Swaps.** Does a commander change count as a swap, and do basic lands count? Recommended: both as host switches, defaulting to Commander's Herald's rule (basics exempt) [6].
5. **The free line.** One league per pod free, with store size in the store plan? Recommended: yes, as Playgroup and Castlog do [8][9].

## Sources

Read on 2026-11-19 unless stated otherwise. Reddit scores are Arctic Shift snapshots.

1. r/EDH, "What booster packs to upgrade Sultai Arisen? 'Anything in stock' sealed league", 2025-04-13, 103 points, 53 comments. <https://www.reddit.com/r/EDH/comments/1jy8cmo/>
2. r/EDH, "Precon Upgrade League Advice", 2025-02-03, 3 points. <https://www.reddit.com/r/EDH/comments/1ignn57/>
3. r/EDH, "Has your LGS / group done any kind of league? What was it?", 2026-11-09, 9 points, 13 comments. <https://www.reddit.com/r/EDH/comments/1xs6vj5/>
4. r/EDH, "I am joining a Precon League … What Precon to go with?", 2026-09-07, 62 points, 64 comments. <https://www.reddit.com/r/EDH/comments/1wa54gu/>
5. r/EDH, "Was excited to try out the upcoming commander league at my LGS...until I saw the scoring system", 2026-01-06, 149 points, 167 comments. <https://www.reddit.com/r/EDH/comments/1q59xa3/>
6. Commander's Herald, "Why You Should Consider Starting A Precon League", 2024-01-15. <https://commandersherald.com/why-you-should-consider-starting-a-precon-league/>
7. cedhstats, mirror of TopDeck.gg's "Commander Precon League Week 9", 2026-06-01. <https://cedhstats.org/tournaments/commander-precon-league-week-9>
8. Castlog, Liga-Builder; page metadata verified on 2026-11-19 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://castlog.gg/features/liga-builder>; home FAQ <https://castlog.gg/>
9. Playgroup, "Rewind 2025, Playgroup Leagues and more", 2025-12-02. <https://playgroup.gg/posts/96-rewind-2025-playgroup-leagues-and-more>
10. Wizards Play Network, "Commander Nights: The Lord of the Rings: Tales of Middle-earth" (2023 event page). <https://wpn.wizards.com/en/event/commander-nights-the-lord-of-the-rings-tales-of-middle-earth>
11. r/EDH, "Budget EDH League Invite!", 2026-05-25, 22 points, 34 comments; "Does anyone have experience with budget leagues in your pod?", 2026-10-22, 31 points, 38 comments (Arctic Shift title search for "league" and "budget").

## Feature contract (Full, 2026-11-19)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

Players in precon, budget, sealed and escalation leagues must keep a deck inside a per-round allowance that the league writes in a shared document, and they price each other's upgrades by hand. No deckbuilder records the rounds, checks a list against the change since the member's previous registered list, or shows the league that every deck complied, without also ranking the players.

### Goals

- A host sets a ten-round precon league once: round 0 is the stock precon, each later round allows 5 swaps and $5 in one named market with carry-over, basics exempt.
- A member registers a list before game night, sees "4 of 5 swaps, $3.20 of $7.00, prices of 2026-11-19 from <source>", and knows the list is inside the allowance.
- Every member reads every member's registered lists, reports and ledger inside the league, and the host exports the season.

### Non-goals

- Standings, points, Elo, achievements, prizes, pairings or results (D-101 decides whether that ever changes).
- Judged one-shot challenges (I-53) and one player's private ledger (I-17).
- A public league directory, pack simulation, or a model deciding compliance.

### Personas

The casual pod player in a precon or budget league; the collector and budget player for whom the allowance is the point; the bracket-focused player in a league that unlocks Game Changers late. The organiser, whom I-41 calls "organiser", is not one of the five personas. See the roadmap persona table.

### User stories

#### US-104-01

As a league host, I want to set each round's allowance once, so that every member's list is checked the same way and I never price anyone's upgrades.

#### US-104-02

As a member of a precon league, I want to see the swaps and money left this round and register my list before game night, so that I arrive knowing it is inside the allowance.

#### US-104-03

As a member, I want to read the other members' registered lists and their reports, so that I trust the league is fair without asking.

#### US-104-04

As a signed-out visitor or a signed-in non-member, I want a league link to reveal nothing, so that a private group's decks stay private.

#### US-104-05

As a member using a keyboard or a screen reader, I want the report to name each part and its verdict in words, so that colour is not the only signal.

### Acceptance criteria

#### AC-104-01 Happy path

Given a round that allows 5 swaps and $10 with carry-over, $4 unspent from round 2, and prices of the registration day in the league's market
When the member registers a round-3 list with 4 cards out and 4 in, the additions priced at $13.50
Then the check passes, shows "4 of 5 swaps" and "$13.50 of $14.00" with the price date and source, freezes the list, and the ledger carries $0.50

#### AC-104-02 Error and failure

Given a round that allows 5 swaps
When the member registers a list with 6 cards out and 6 in
Then the check fails with "6 of 5 swaps", names the six pairs, freezes nothing, and the previous registration is unchanged

#### AC-104-03 Edge cases

Given a host rule "missed allowance is lost" and a member who registered nothing in round 3
When the member registers in round 4
Then only round 4's allowance applies, and the report says why

#### AC-104-04 Guest and signed-in

Given a league and one of its registered lists
When a guest or a signed-in non-member opens either URL
Then the page reveals nothing about the league, and a member who leaves keeps their own lists

#### AC-104-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-104-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When a member registers a list and reads the report without a pointer
Then every control has a name, focus is visible, and pass, fail and unknown are announced as words, never as colour alone

#### AC-104-07 Stock precon

Given a season that starts from an I-17 catalogue version
When a round-1 list differs from it by one card
Then the check fails with "round 1 is the stock precon" and names the card

#### AC-104-08 Unpriced card

Given an added card with no price in the league's market on the registration day
When the check runs
Then the money part is "unknown", the card is named, and the list is not registered until the host records an override

### UX flow and states

A host creates a league from a pod or from scratch, adds rounds and allowances, and shares an invite link. A member opens the league, picks a deck for the round and sees the check before registering. The league page has one tab per round and one row per member.

- Empty: a new league shows its rounds and "No list registered yet".
- Loading: a busy state that keeps the table still.
- Error: the catalogue message and a retry, with the last registration kept.
- Partial: a money part with an unpriced card says "unknown" and names it.

### Data model and API

The types in [Data model / API](#data-model--api). Four tables and one report shape; every route checks membership on the server.

### Analytics and telemetry

`league_created {rounds, parts}`, `league_entry_checked {verdict, failingPart}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, list, league name or URL.

### Rollout and feature flags

Slice 1 is invisible. Slices 2 to 4 ship behind an I-69 switch, `community.leagues`, off until D-101 is committed, then on for signed-in players. Guests cannot host or join; a league needs accounts.

### Dependencies

[I-53](i53-monthly-deckbuilding-challenges.md) slice 1 (rule types and `checkDeckAgainstRules`); [I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2 (dated prices with market and source); [I-29](i29-cross-site-deck-index.md) slice 2 (the canonical list, which I-35 slice 2 also reads); [I-17](i17-precon-path-and-tiered-upgrades.md) slice 1 (the catalogue, for slice 5); D-40 and D-101; [I-41](i41-store-commander-nights.md) and [I-30](i30-business-model-and-paid-tier.md) for the store-size plan. Slice 1 needs nothing.

### Risks and mitigations

- **A slide into a tournament manager.** Standings creep in through "just a points column". Mitigation: the non-goal, D-101, and no field for a game result in the data model.
- **Price disputes.** Two members see two prices. Mitigation: one market and one source per league, the price date in every report, and "unknown" rather than a guess.
- **Privacy across members.** A league exposes lists to people the member did not choose. Mitigation: members only, the not-found answer for everyone else, and a leaving member's right to remove their registrations.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: D-101, what a league is, prices, swaps and the free line.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-104-101 A season the host writes once

As a host, I want the season's rounds and allowances fixed before they start, so that nobody argues about a rule mid-round.

#### AC-104-100 Happy path

Given a league with ten rounds
When the host edits round 5 before it starts
Then the change is saved and the page records the date and the host's name beside the rule

#### AC-104-101 Failure

Given round 3 has started
When the host tries to change its allowance
Then the edit is refused with a catalogue message, and the round is unchanged

#### AC-104-102 Edge

Given a static rule "no Game Changers" with `fromRound` 6
When a member registers a round-6 list with one Game Changer
Then the rule passes from round 6 and the report says the rule relaxed in that round

#### US-104-102 A ledger the league can read

As a member, I want my ledger of swaps and money across the season, so that I plan the next round's upgrades.

#### AC-104-103 Happy path

Given three registered rounds
When the member opens the ledger
Then each round shows swaps used, money spent, carry-over and the price date

#### AC-104-104 Failure

Given the price read fails at registration
When the member retries
Then nothing is registered until a price is read, and the previous entry stands

#### AC-104-105 Edge

Given a registered deck edited after registration
When any member opens the league page
Then the entry shows "changed since registration", and the registered list is unchanged

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | Rounds with "No list registered yet".                                                                   |
| Loading          | A busy state that keeps the table still.                                                                |
| Error            | The catalogue message, what was not registered, and a retry.                                            |
| Partial          | A part that cannot be checked says "unknown" with the reason.                                           |
| Stale            | "Changed since registration" on an entry whose deck moved on.                                           |
| Guest            | Nothing about the league; a sign-in prompt only from an invite link.                                    |
| Signed-in        | A non-member sees not-found; a member sees the league.                                                  |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Registration, the report and the ledger can be reached without a pointer.                               |
| Screen reader    | Each part, its verdict and its numbers are announced in words.                                          |
| Colour           | Pass, fail and unknown differ by a word and an icon as well as hue, in both themes.                     |
| Success          | A registration is confirmed with the round, the time and the report link.                               |

### Alternate paths

- The member registers twice in one round before the deadline. The later passing registration replaces the earlier one; the report history keeps both.
- The host ends the league early. The page freezes and stays readable to members; the export still works.
- The member switches locale mid-flow. Chrome switches; card names stay the printing's language.

### Roadmap record (2026-11-19)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-104 is a link here. The eighteenth pass's R3 note proposed the same job as a scope line on I-17's ledger; it is recorded here instead, and I-17 carries a one-line pointer.

## I-104: League Decks And The Change Allowance Between Rounds

**Outcome:** a league host sets a season of rounds and each round's allowance once; each member registers one list per round, which the product checks against the round's rules and the member's previous registered list, freezes with its price date and shows to every member, with a change ledger and an export; nobody is ranked.

**Status:** Later
**Priority:** Later for every slice; slice 1 needs nothing. Never paid for one's own check; store-size leagues are an I-30 candidate.
**Impact / effort:** Medium / medium
**Risk:** Medium. The risk is a slide into standings and price disputes, which D-101, one market per league and "unknown" for unpriced cards answer.
**Depends on:** nothing for slice 1; I-53 slice 1 and D-101 for slice 2; I-29 slice 2 and I-32 slice 2 for slice 3; I-17 slice 1 for slice 5; I-30, I-41 slice 1 for slice 6.

Precon, budget and sealed leagues allow a fixed change each round: Commander's Herald's classic is "$5 in upgrades and … up to 5 different cards" a week, basics exempt, money "rolled over" if tracked on a shared board. r/EDH threads describe four kinds of league and the work of keeping them by hand; a 149-point thread rejects a league's heavy scoring. Castlog sells league budget rules beside ELO standings, and Playgroup's leagues check no deck. The product has no league, round or list comparison.

### Scope

- [ ] `checkRoundAllowance`, pure: swaps with the basics exemption, the money delta in one market with carry-over, the declared pool (slice 1).
- [ ] The league, its rounds and members, with static rules from I-53 and `fromRound` (slice 2, after D-101).
- [ ] Registration that freezes the canonical list and stores the report with its price date (slice 3); the members-only league page and export (slice 4).
- [ ] Later: a stock precon as round 0 and the declared-pool rule (slice 5); several leagues per pod and store-size leagues (slice 6).

### Engineering enablers

- `AllowancePart` is a discriminated union with an exhaustive `never` guard; the check lives in `format-rules` and runs on the server (ADR 0009).
- Registration is one transaction and idempotent on the canonical hash.
- League repositories get a hand-written in-memory fake and one shared contract suite (ADR 0005).

**Paid-tier angle:** checking one's own list stays free; several leagues per pod and store-size leagues are candidates under I-30 and I-41's store plan.

### Enrichment (2026-11-19)

**User story.** As a member of a precon league, I want my list checked against this round's allowance before game night, so that nobody prices my upgrades by hand.

**Acceptance.**

- 6 swaps against a cap of 5 fail and name the pairs; nothing is registered.
- $13.50 of additions against $10 plus $4 carried pass, with the price date and $0.50 carried.
- A round-1 list one card away from the stock precon fails and names the card.
- A non-member and a guest see nothing about the league.

**UX.** A league page with a tab per round and a row per member; a registration panel with the check before "Register".

**Data and API.** Four tables (`League`, `LeagueRound`, `LeagueMember`, `LeagueEntry`) and a stored report; membership checked on every route.

**i18n and access.** English and French chrome; card names stay the printing's language. Parts and verdicts are words.

**Telemetry.** `league_created {rounds, parts}`, `league_entry_checked {verdict, failingPart}`. Reserved for I-39.

**Rollout.** `community.leagues`, off until D-101.

**Open questions.** D-101; what a league is (D-40); price source; swaps; the free line.

### Definition of done

A host creates a ten-round precon league from an I-17 catalogue precon with 5 swaps and $5 a week, basics exempt and carry-over; a member registers a round-1 stock list and a round-2 list with 4 swaps and $3.20 of additions, sees both pass with the price date and $1.80 carried; a list with 6 swaps fails and names the pairs; every member reads every report; a guest opening the league link sees nothing.

---
