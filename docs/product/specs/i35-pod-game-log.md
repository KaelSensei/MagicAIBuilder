# I-35: Pod Game Log And Casual Results

> **Initiative:** I-35, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-09 · **Priority:** Later · **Written:** 2026-11-09
> **Research:** one dated note on casual game trackers, published results, data protection and cEDH match data (2026-11-09). It is not committed, so every external fact cites its own source in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** logging real games after they end, personal game statistics, opt-in contribution and the publication thresholds of casual aggregates. **Does not own:** pods, sheets and consent ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); goldfish sessions ([I-07](i07-playtest-and-iteration.md)); bracket scoring ([I-03](i03-trustworthy-deck-feedback.md), [I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the statistical verdict ([I-21](i21-reproducible-probability-bench.md)); data pages ([I-34](i34-commander-data-reports.md)); billing ([I-30](i30-business-model-and-paid-tier.md)); Discord ([I-23](i23-the-pods-own-surface.md)).

## Overview

Casual Commander results are already tracked at scale, by apps built around a life counter. What nobody publishes is a result tied to the exact deck version played and to what the pod agreed before the game. MagicAIBuilder holds both: deck snapshots today, and the I-15 Rule 0 sheet once it ships.

This initiative lets a player log a game after it ends, in under a minute, from the deck page or the pod's page. Each record freezes the deck version, the declared bracket, the computed bracket and the seat order. The player gets a private history per deck and per version. Players who opt in feed aggregates that answer questions nobody publishes: how decks fare by declared against computed bracket, by bracket mismatch, by mulligans taken, by turn of win and by seat.

Every figure is labelled as what it is: a self-selected casual signal. It is never a tournament win rate. Opponents are consenting linked accounts or unnamed labels, so the product stores no identity of a person who has no account.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise. "Search summary" marks a page the research could not open.

| Product                                         | What it records                                                                                                                                                                                                            | What it publishes                                                                                                                                       | Price                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Playgroup.gg** [1][2]                         | After a paper game: members or "guests added by name", commander or deck, winner, win condition; optional turn count, length, fun and salt. Seat comes from its live tracker; mulligans and cards from its online tabletop | 770,000+ games; daily commander pages, a tier list, monthly reports, experiments. "No page exposes an individual player's games, decks, or results" [1] | Free; supporter tiers Basic 4, Premium 5, Ultimate 15 a month, currency not shown (search summary) [3] |
| **Lifetap** [11]                                | Turn-by-turn game log, win rates by deck, wins, draws and losses; CSV and JSON export                                                                                                                                      | Nothing. Its store privacy label reads "Data Not Linked to You"                                                                                         | Free                                                                                                   |
| **MTG Tracker**, **The Pod Companion** [12][13] | Win rates per deck, commander and player; turn order (MTG Tracker)                                                                                                                                                         | Private statistics only                                                                                                                                 | Free (search summaries)                                                                                |
| **Rhystic** [14]                                | Life counter                                                                                                                                                                                                               | Private statistics                                                                                                                                      | "Player and deck performance stats and game history are Premium features" (search summary)             |
| **Castlog**, **Podium** [15]                    | Import decks from Moxfield and Archidekt, then track win rates and matchups                                                                                                                                                | Private statistics                                                                                                                                      | Not found (search summaries)                                                                           |
| **Nerd Leagues** [16]                           | Pod league games; players and decks start at 1000 Elo; a Discord webhook posts each game                                                                                                                                   | League tables                                                                                                                                           | Not stated (updated 2026-08-02)                                                                        |
| **Archidekt** [17], **Moxfield**                | Archidekt logs playtester card moves; neither logs game results                                                                                                                                                            | —                                                                                                                                                       | —                                                                                                      |

**What is published.** One casual finding is robust: first-seat advantage. Across 598,437 Playgroup games, counting single-winner games only, the first seat wins 39.0% of 3-player games (fair share 33.3%), 29.1% of 4-player games (25%) and 22.6% of 5-player games (20%), with 95% intervals of ±0.16 to ±0.41 points [4]. Playgroup states the limit: "Players sit where they sit; we only record who went first." In 257,261 four-player games the gap between first and last seat was 7.7 points, and Playgroup is testing a pre-registered fix [5]. Its tier list ranks a commander only with at least 40 games and at least 10 distinct registered pilots in 30 days, normalised to a 4-player baseline [6]. Mulligan splits come from its online tabletop and are small: on one commander page, 20.86% wins after no mulligan (n=163) and 100% after five (n=1) [7].

**Data quality.** Playgroup's own pages disagree on its size: 770,000+ games on About [1], and 1,608,359 "tracked games" on How Many Lands, cited in our [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md) [9]. The counting unit is not stated. One commander page reportedly showed an average damage of 20,455,407 per game (search summary) [30]. Input bounds matter.

**What nobody publishes.** The research found no product, casual or competitive, publishing outcomes by bracket mismatch, turn-of-win distributions beyond per-commander averages, or results tied to an exact decklist version. Playgroup now feeds tracked games into "phantom opponents for solo playtesting" [8], which overlaps I-07.

**The ranking risk.** A reader of Commander's Herald describes a two-year Friday group where, once the host tracked individual win rates, "targeted play" started and the game turned "into one based on who is the best" [18]. It is a single letter, but it is the failure mode this spec designs against.

**Data protection (research, not legal advice).** The household exemption covers the player, not the platform: the GDPR "applies to controllers or processors which provide the means for processing personal data for such personal or household activities" [19]. A service storing a non-user's name owes that person information within one month (Art. 14) [20]. Pseudonymised data remains personal data under the EDPB's 2025 draft guidelines [24]. The CNIL tests anonymisation by three criteria — singling out, linkability, inference — and gives **no numeric threshold** [23]. A consultancy's claim that "k < 5" is insufficient "according to CNIL" has no official text behind it [25]. Playgroup's policy (2026-11-03) anonymises games on account deletion and does not address guests named in games [10].

**Correction for the roadmap.** The roadmap's [ruled-out list](../roadmap.md#what-the-sweep-ruled-out-for-2027) and the same list in [`README.md`](README.md) say EDHTop16 publishes "no win rates, no match-level results and no public API". On 2026-11-09 that is partly wrong. EDHTop16 defines a win rate as `wins / (wins + losses + draws)` [28] and shows win, loss and draw records per entry [31]. Its GraphQL endpoint answers, but rejects ad-hoc queries: "Only persisted queries are allowed in production" [29]. Match-level seat data sits upstream at TopDeck.gg [27], whose terms (effective 2026-10-27) forbid to "commercialize API Data" (§7) and allow displaying public event data with attribution (§8.3) [26]. Suggested wording: "Tournament win rates remain blocked by licence, not by missing data: EDHTop16 computes win rates but offers no open API, and the match data behind it is TopDeck.gg's, whose terms forbid commercialising it." The block stands. Casual logs do not lift it: different population, self-selected, no randomised seating.

## Current state in this codebase

Verified on `dev` (commit `49983a9`) on 2026-11-09:

- **Goldfish sessions exist; real games do not.** `PlaytestSession` (`prisma/schema.prisma`) stores `result` (win, loss or draw as a string), `turns`, `mulliganCount`, an optional opponent label `difficulty` (budget, mid-range, cedh), `notes`, `proposedChange`, `snapshotId`, `cardsSeen` and `additionalCardsSeen`. It has no seat, pod size, opponent, bracket or date of play. It cascades on deck and user deletion.
- **The route is owner-scoped.** `src/app/api/decks/[id]/playtest-sessions/route.ts` serves GET and POST for the deck's owner only, caps reads at 500 rows, checks that a snapshot belongs to the deck, and compares two snapshots through `beforeSnapshotId` and `afterSnapshotId`.
- **Validation and statistics are reusable.** `src/lib/playtest/session-input.ts` bounds mulligans with `maxMulligans({ firstMulliganFree: true })` from `engine.ts` (CR 103.5c). Its summary counts draws in the win-rate denominator and averages turns over wins only. `comparison.ts` returns deltas without intervals.
- **The UI never links a session to a snapshot.** `src/components/playtest/RecordResultBar.tsx` posts no `snapshotId`, and `PlaytestComparisonPanel.tsx` skips sessions without one. Sessions recorded in the product therefore never reach the snapshot comparison. This is an I-07 defect; requirement 3.1's helper can fix it.
- **Snapshots are manual.** `DeckSnapshot` copies `deck.cards` into `cardList` (`src/app/api/decks/[id]/snapshots/route.ts`). There is no content hash, no automatic snapshot and no origin field.
- **The computed bracket is never stored.** `scoreBracket` (`src/lib/deck/bracket.ts`) computes it on read. `Deck.targetBracket` defaults to 3, and `Deck.manualBracket` is null when the computed score applies. A default of 3 cannot tell a declared Bracket 3 from no answer.
- **No pod exists.** The schema has no `Pod`, `PodSheet` or `PodShare`, and no code under `src/` models a pod. I-15 has not started. There is no Discord integration.
- **Deletion exists; export does not.** `DELETE /api/user/profile` deletes the user, and the schema's cascades remove decks and sessions. No route exports a user's data. No privacy notice page was found under `src/app` or in the EN and FR messages.

## Functional requirements

### 1. Logging a game after it ends

1.1 A game is logged after it ends, from the deck page ("Log a game") or, once pods exist, from the pod's page. There is no in-game screen.
1.2 Required: date played (default today), number of players (2 to 6), turn order, the logger's own seat and deck, and the outcome (one winning seat, or a draw). The logger always has a seat.
1.3 Optional: the turn the game ended (1 to 50), mulligans the logger took (free mulligan included, bounded as in `session-input.ts`), how it ended (combat, commander damage, combo, alternate win, concession, other) and the logger's fun rating from 1 to 5.
1.4 The form remembers the last pod size and seat layout. A repeat game with the same table needs at most four inputs.
1.5 Logging needs no pod, no other account and no sheet; a game with only labelled opponents is complete. The logger can edit or delete a game at any time. Out-of-range values are refused at input, never cleaned later.

### 2. Who sat at the table

2.1 Every seat other than the logger's is a **linked player** or a **label**.
2.2 A linked player is an account in the same I-15 pod. The game appears in their history only after they confirm their seat; until then it counts in no statistic and no aggregate.
2.3 A linked player can detach from a game at any time. Their seat becomes a label, and their deck, sheet values and brackets leave the record.
2.4 A label is generated from the seat number and, optionally, a commander picked from card data: "Seat 3, Atraxa, Praetors' Voice". There is no name field, and the API rejects one.
2.5 A label lives in one game. Nothing links "Seat 3" in one game to any seat in another, so the product builds no history of a person without an account. A persistent guest label would be the pseudonymised data the EDPB draft still treats as personal [24].
2.6 Notes are private to the logger. They never appear in a pod view, another player's export, an aggregate or an AI prompt. The field reads "Do not name people who are not on MagicAIBuilder."

### 3. The deck version and the agreement, frozen at log time

3.1 The logger's seat records the deck version played: the latest snapshot when its card-list hash matches the current list, otherwise a new snapshot marked as created by a game log.
3.2 The seat records the computed bracket from `scoreBracket` and the scorer version, so later rule changes (I-28 slice 2) do not rewrite history.
3.3 The seat records the declared bracket: the I-15 sheet shared with this pod, else a value picked on the form, else "not declared". `Deck.targetBracket` is never read as a declaration.
3.4 A game logged from a pod freezes the pod's agreed bracket and the consented sheets' field values. A later edit or revocation of a sheet does not change past games.
3.5 Mismatch is computed minus declared, per seat. Pod spread is the highest minus the lowest declared bracket. Either is empty when a term is missing; nothing is imputed.

### 4. Personal statistics

4.1 Per deck: games, wins, draws, **win share against fair share** (wins compared with the sum of 1 ÷ players over the games), average winning turn over games with a recorded turn, mulligans taken and results by seat.
4.2 The same figures split by deck version, by pod, and by declared bracket, computed bracket and mismatch.
4.3 Every percentage shows its game count and a 95% Wilson interval. **Computed**: for a 25% win share, the interval is 11.2–46.9% at 20 games, 14.2–40.2% at 40 and 17.5–34.3% at 100.
4.4 A group under 10 games shows its game list, not a percentage (**computed** interval at 10 games: 8.1–55.8%).
4.5 Comparing two versions uses I-21's verdict once it ships. Until then the two intervals sit side by side with no verdict.
4.6 Goldfish sessions and real games appear in separate, labelled sections and are never pooled into one figure.

### 5. Contribution and published aggregates

5.1 Contribution is off by default and switched on per account after a plain explanation. Switching it off is one action: "It shall be as easy to withdraw as to give consent" (Art. 7(3)) [22].
5.2 A game enters aggregates only when its logger and every confirmed linked player contribute. Labelled seats contribute seat, commander and outcome only.
5.3 Aggregates hold no user id, pod id, notes, fun rating or date finer than the month.
5.4 A cell (for example: 4 players, computed Bracket 3, declared Bracket 2) is published only with **at least 40 games from at least 10 distinct accounts**, Playgroup's tier-list rule [6], **and at least 5 distinct pods, none supplying more than a third of the games**. The pod rules answer the CNIL inference test: a cell must not reveal one pod's results to its members. They are a design choice; no official number exists [23]. A game without a pod counts its logger as its own pod.
5.5 A suppressed cell reads "fewer than 40 games" and shows no count. Each published figure carries "self-reported casual games", the game count, distinct accounts, window, computation date and method version, in the format of I-29 requirement 6.2.
5.6 Win figures are shown against the fair share for the pod size, with the seat split beside them.
5.7 Aggregates are recomputed weekly. Withdrawing contribution or deleting a game removes it from the next run.
5.8 Aggregates are published only through I-34's data pages and stay free.

### 6. Deletion and export

6.1 Deleting a game removes it from every view at once and from aggregates at the next run.
6.2 Deleting an account deletes the games it logged and turns its seats in other players' games into labels, extending the cascade `DELETE /api/user/profile` performs.
6.3 Export gives JSON and CSV of every game the account logged or confirmed, with seats, deck versions, brackets and notes. Other accounts appear as "linked player" with their commander only, because the right "shall not adversely affect the rights and freedoms of others" (Art. 20(4)) [21].
6.4 Logging, history, export, deletion and contribution are never gated by a subscription.
6.5 The privacy notice (first created by I-29 slice 0) states what a game stores, that opponents are never named, the opt-in and the thresholds.

### 7. Honesty

7.1 Every results screen reads: "Self-reported casual games. Not tournament results, not a random sample."
7.2 No figure is called a commander's or a bracket's "win rate" without that label, and "tournament" never appears beside it.
7.3 Pod views show history per deck and per pod, never players sorted by results.
7.4 Mismatch views follow I-15 requirement 3.2: a prompt for a conversation, never a verdict about a player.

### 8. Paid-tier candidates (I-30 decides)

8.1 Free for everyone: everything in 6.4, per-deck figures with intervals over the last 12 months, and every published aggregate. Nothing paid changes what another player sees: no paid ranking or visibility.
8.2 Candidates: real-game trends across deck versions, the mismatch view across all of a player's decks, cross-deck comparison, and analysis over the whole history. The raw list and export always cover everything.
8.3 Why it could sell: Playgroup, Lifetap and The Pod Companion give statistics away; Rhystic charges for them (search summary) [14]. None found in competitive or casual Magic multiplayer ties a result to a deck version or to declared against computed bracket. Only a deckbuilder holds the versions. _Corrected 2026-11-11:_ this said "None found ties a result to a deck version" without the Magic qualifier. Arkham Cards groups decks into campaigns, tracks scenario results and upgrades decks between scenarios; that is co-op, and whether each result is frozen to a deck version was not verified [32].

## Data model / API

```
PodGame          id, loggedById, podId?, playedOn (date), playerCount (2–6), endedOnTurn?, endedBy?, isDraw,
                 agreedBracket?, frozenSheets Json?, notes?, funRating?, createdAt, updatedAt
PodGameSeat      id, gameId, seat (1 = went first), kind (self | linked | label), userId?, confirmedAt?,
                 deckId?, snapshotId?, commanderScryfallIds[], won, mulligans?,
                 declaredBracket?, declaredSource (sheet | form | none), computedBracket?, bracketMethod?, mismatch?
GameContribution userId, enabledAt, disabledAt?
AggregateCell    id, metric, dimensions Json, games, accounts, pods, value, low, high,
                 windowStart, windowEnd, methodVersion, computedAt, published, suppressedReason?
DeckSnapshot     + origin (manual | game), + cardListHash
```

`PodGameSeat` has no name or free-text label column; a schema test guards the absence. `@@unique([gameId, seat])`, one `self` seat per game. Account deletion converts linked seats to labels in one transaction, since a cascade cannot change `kind`.

Routes, all scoped to the caller as `playtest-sessions` is: `POST|GET /api/games`, `PATCH|DELETE /api/games/[id]`, `POST /api/games/[id]/seats/[seat]/confirm` and `/detach`, `GET /api/decks/[id]/games/summary`, `GET /api/user/games/export?format=json|csv`, `PUT /api/user/game-contribution`. Aggregates are computed by an offline job and read by I-34.

## Non-goals

- A life counter, commander damage, timers or any in-game screen. The roadmap ruled out a table companion.
- Public per-player pages, leaderboards, Elo or any rating ladder, by default or as a pod option in this initiative [18].
- Claiming or implying tournament win rates, or ingesting TopDeck.gg, EDHTop16 or derived data.
- Guest accounts, "claim later" guests or any stored name of a non-user.
- Logging from Discord. I-23 has no write path, and this initiative does not give it one.
- Card-level game data (what was cast). It needs a table app.
- Streaks, achievements or reminders to log.
- Merging goldfish sessions into game statistics.

## Testing strategy

- **Solitary:** fair share over mixed pod sizes; Wilson intervals against reference values; mismatch and spread with missing terms; the threshold function at 39/40 games, 9/10 accounts, 4/5 pods and a pod at exactly a third.
- **Schema guard:** no seat column accepts a name; a POST carrying `name` on a label seat is refused.
- **Frozen record:** a deck with `targetBracket` 3 and no sheet logs "not declared"; editing a sheet, revoking a share or changing the bracket scorer leaves a logged game unchanged.
- **Consent (sociable):** an unconfirmed linked seat is absent from that player's statistics and from aggregates; a detached seat becomes a label.
- **Privacy:** pod B cannot read pod A's games; unauthenticated requests get 401; notes appear in no pod view, other player's export, aggregate or AI prompt.
- **Deletion:** game deletion and account deletion behave as 6.1 and 6.2; the next aggregate run excludes them.
- **Honesty:** every results surface renders 7.1's label and the game count, in EN and FR.

## Delivery slices

| #   | Slice                                                                                                                                                                             | Depends on                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `PodGame` and `PodGameSeat`; "Log a game" from the deck page with labelled opponents, seats and outcome                                                                           | —                                                                   |
| 2   | Deck version at log time: card-list hash, snapshot reuse or game snapshot (reusable by I-07's record bar) _(the canonical list is I-29 slice 2's; one owner, decided 2026-11-10)_ | 1; I-29 slice 2                                                     |
| 3   | Edit, delete, JSON and CSV export, account-deletion conversion, privacy-notice text                                                                                               | 1; I-29 slice 0 for the notice page                                 |
| 4   | Personal per-deck figures: fair share, intervals, 10-game floor, goldfish kept apart                                                                                              | 1                                                                   |
| 5   | Declared and computed bracket frozen with scorer version; mismatch and spread                                                                                                     | 2; I-15 slice 1 for sheet values (the form picker works without it) |
| 6   | Logging from a pod: linked players, confirm and detach, frozen sheets, pod history                                                                                                | 5; I-15 slice 3                                                     |
| 7   | Version trends, mismatch view, whole-history analysis                                                                                                                             | 4, 5; I-21 slice 5 for the verdict; I-30 decision before any gating |
| 8   | Contribution opt-in and the weekly aggregate job with thresholds; nothing published                                                                                               | 3, 5                                                                |
| 9   | Publish passing cells on I-34 data pages                                                                                                                                          | 8; I-34 page slices; legal answers to open question 2               |
| 10  | Import from a life-counter export such as Lifetap's                                                                                                                               | **Blocked** until the export format is verified; 1                  |

Slices 1 to 4 ship alone as a private game log. Slice 8 runs before slice 9 so the thresholds can be checked on real data before anything is public.

## Open questions

1. **Will anyone log?** Playgroup's turn-order games are "mostly logged through the Playgroup life counter" [4], and this product ruled one out. Measure games logged per active deck per month after slice 4, and set the level that justifies slices 8 and 9 before starting them. **Computed**: resolving a 25% share to ±2 points needs about 1,800 games in one cell; 40 games is a disclosure floor, not precision.
2. **For the lawyer-questions list (research, not legal advice):** does a per-game unnamed label keep the product outside Art. 14 for non-users? Is a hint enough for free-text notes, or should notes go? Is consent the right basis for contribution? Do 40 games, 10 accounts, 5 pods and the one-third cap answer the CNIL criteria? Must a published figure be recalled after withdrawal?
3. **Durable pods.** I-15 leaves open whether a pod is reused weekly or thrown away after one night. Pod history and linked confirmation need durable pods.
4. **Paid analysis of a player's own logs.** Is it compatible with the Fan Content Policy and the free-data boundary? I-30 decides.

## Sources

Read 2026-11-09 unless dated. [4], [6], [21], [22], [28] and [29] were re-checked directly on 2026-11-09.

1. Playgroup.gg, About, updated 2026-11-09. https://playgroup.gg/about
2. Playgroup.gg, Log games. https://playgroup.gg/tracker/log-games
3. Playgroup.gg, Premium (search summary). https://playgroup.gg/premium
4. Playgroup.gg, Turn Order, computed 2026-11-09. https://playgroup.gg/commander/turn-order
5. Playgroup.gg, "Testing a fix for going first", 2026-09-09. https://playgroup.gg/posts/100-playgroup-experiments-testing-a-fix-for-going-first
6. Playgroup.gg, Commander tier list. https://playgroup.gg/commanders/tier-list
7. Playgroup.gg, Muddle, the Ever-Changing, refreshed 2026-11-09. https://playgroup.gg/commanders/3838-muddle-the-ever-changing/playtest
8. Playgroup.gg, Research index. https://playgroup.gg/research
9. Playgroup.gg, How Many Lands, updated 2026-11-08. https://playgroup.gg/commander/how-many-lands
10. Playgroup.gg, Privacy, updated 2026-11-03. https://playgroup.gg/privacy
11. Lifetap, App Store listing. https://apps.apple.com/app/id1508241754
12. MTG Tracker, App Store listing (search summary). https://apps.apple.com/us/app/mtg-tracker-commander-stats/id6759520548
13. The Pod Companion (search summary). https://thepodcompanion.com/commander-game-tracker/
14. Rhystic (search summary). https://rhystictracker.com/
15. Castlog and Podium listings (search summaries). https://chrome-stats.com/d/id6761730758 · https://chrome-stats.com/d/id6762168750
16. Nerd Leagues, commander pod league, updated 2026-08-02. https://nerdleagues.com/how-it-works/commander-pod-league
17. Archidekt, "Playtester Logs" dev update. https://archidekt.com/news/13186079
18. Commander's Herald, "Am I The Bolas? Stat tracking in a casual game" (about 600 days old). https://commandersherald.com/am-i-the-bolas-stat-tracking-in-a-casual-game/
19. GDPR Recital 18. https://gdpr-info.eu/recitals/no-18/
20. GDPR Art. 14. https://gdpr-info.eu/art-14-gdpr/
21. GDPR Art. 20. https://gdpr-info.eu/art-20-gdpr/
22. GDPR Art. 7. https://gdpr-info.eu/art-7-gdpr/
23. CNIL, "L'anonymisation de données personnelles", 2020-05-19. https://www.cnil.fr/fr/technologies/lanonymisation-de-donnees-personnelles
24. EDPB Guidelines 01/2025 on pseudonymisation, draft adopted 2025-01-16; final adoption unconfirmed. https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-012025-pseudonymisation_en
25. Ayinedjimi Consultants, anonymisation guide (claim not backed by a CNIL text). https://ayinedjimi-consultants.fr/articles/data-masking-anonymisation-guide-rgpd
26. TopDeck.gg Developer Terms, effective 2026-10-27. https://topdeck.gg/developer-terms
27. TopDeck.gg API v2 documentation. https://topdeck.gg/docs/tournaments-v2
28. EDHTop16, llms.txt, last updated 2025-01-03. https://edhtop16.com/llms.txt
29. EDHTop16 GraphQL endpoint, plain query sent 2026-11-09. https://edhtop16.com/api/graphql
30. Playgroup.gg, Hugh, First of Many (search summary). https://playgroup.gg/commanders/5200-hugh-first-of-many
31. EDHTop16, Narset, Enlightened Master (events Nov 2025–Oct 2026). https://edhtop16.com/commander/Narset%2C%20Enlightened%20Master
32. Arkham Cards on the App Store, v6.3.7, seen 2026-11-10; added 2026-11-11. https://apps.apple.com/us/app/arkham-cards/id1424000351

## Feature contract (Light, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.


This file is light because the initiative is Later or Parked and is not in I-80 to I-98. The scenarios below are the bar for when it is promoted. They are not a promise to build it next.

### Summary and problem

a player logs a real game in under a minute after it ends, tied to the deck version played and to what the pod declared, and reads honest personal statistics; players who opt in feed casual aggregates nobody publishes.

### Goals

- A player logs a game in under a minute, sees it against the deck version and the brackets declared and computed, can export or delete it, and no stored record names a person who has no account.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-35-01

As a player, I want the outcome of I-35, so that the work in this file is the reason to build it.

#### US-35-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-35-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-35-01 Happy path

Given a signed-in player and the English locale
When a player logs a game in under a minute, sees it against the deck version and the brackets declared and computed, can export or delete it, and no stored record names a person who has no account.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-35-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-35-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-35-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-35-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-35-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-35-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- https://playgroup.gg/about
- https://playgroup.gg/commander/turn-order
- https://commandersherald.com/am-i-the-bolas-stat-tracking-in-a-casual-game/
- https://gdpr-info.eu/recitals/no-18/
- https://rules.fabtcg.com/en/trp/09-special-formats/
- https://playgroup.gg/commander/power-level

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-35: Pod Game Log And Casual Results

**Spec:** [`specs/i35-pod-game-log.md`](i35-pod-game-log.md)

**Outcome:** a player logs a real game in under a minute after it ends, tied to the deck version played and to what the pod declared, and reads honest personal statistics; players who opt in feed casual aggregates nobody publishes.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / medium
**Depends on:** nothing for slices 1 and 4 of the private log; I-29 slice 2's canonical list for slice 2; I-29 slice 0's notice page for slice 3 (corrected 2026-11-10); I-15 for pods and declared brackets; I-21 slice 5 for version verdicts; I-34's data pages and a legal answer before any aggregate is published.

Casual results are already tracked at scale by life-counter apps. [Playgroup.gg](https://playgroup.gg/about) reports more than 770,000 games and publishes a robust first-seat advantage: 29.1% of single-winner four-player games against a fair 25% ([turn order](https://playgroup.gg/commander/turn-order)). No tracker found ties a result to the exact deck version played, or publishes outcomes by declared against computed bracket. MagicAIBuilder holds deck snapshots today, and the I-15 Rule 0 sheet once it ships. Two risks shape the design: a reader's letter describes tracked win rates turning a casual group to "targeted play" ([Commander's Herald](https://commandersherald.com/am-i-the-bolas-stat-tracking-in-a-casual-game/)), and the GDPR household exemption does not cover a platform that stores a non-user's name ([Recital 18](https://gdpr-info.eu/recitals/no-18/)). This is a post-game log, not the table companion the 2027 sweep ruled out, and casual logs do not unblock tournament win rates (I-09).

### Scope

- [ ] "Log a game" from the deck page: date, pod size, seat order, the logger's seat and deck, the outcome, and optional turn, mulligans, how it ended and fun (slice 1).
- [ ] Freeze the deck version played, by card-list hash or a new game snapshot (slice 2). The same helper can tie I-07's recorded sessions to a snapshot.
- [ ] Edit, delete, JSON and CSV export, and seats turned into labels when an account is deleted (slice 3).
- [ ] Personal figures per deck: wins against the fair share for the pod size, 95% Wilson intervals, a game list instead of a percentage under 10 games, goldfish sessions kept apart (slice 4).
- [ ] Declared and computed brackets frozen with the scorer version, and mismatch and pod spread with nothing imputed (slice 5).
- [ ] Logging from an I-15 pod, with linked players who confirm or detach their seat (slice 6).
- [ ] Opt-in contribution and a weekly aggregate job that publishes a cell only at 40 games from 10 accounts and 5 pods, none supplying more than a third (slices 8–9).
- [ ] Optional elimination order per seat, with the turn when known, so a log shows placements as well as the winner. Flesh and Blood's Ultimate Pit Fight "may also track the order in which players lost" ([TRP §9](https://rules.fabtcg.com/en/trp/09-special-formats/), seen 2026-11-10). Added 2026-11-11.
- [ ] On slice 7: after about twenty logged games of one deck version, the owner privately sees whether it plays above or below its declared bracket, with the interval. It is never shared unless the owner shares it, and never ranks a player. A deck's own record predicts its later games "roughly 15-20 times better" than its declared bracket ([Playgroup](https://playgroup.gg/commander/power-level), updated 2026-11-10). Added 2026-11-11.

### Engineering enablers

- No seat column accepts a name, and the API refuses one: opponents are linked accounts or per-game labels such as "Seat 3, Atraxa, Praetors' Voice".
- A logged game does not change when a sheet is edited, a share is revoked or the bracket scorer changes.
- Every results screen reads "Self-reported casual games. Not tournament results, not a random sample." in English and French.

**Paid-tier angle:** logging, history, export, deletion, per-deck figures over 12 months and every published aggregate stay free. Candidates are trends across deck versions, the mismatch view across all of a player's decks, and whole-history analysis; I-30 rates them weak, because Playgroup and Lifetap give statistics away.

### Definition of done

A player logs a game in under a minute, sees it against the deck version and the brackets declared and computed, can export or delete it, and no stored record names a person who has no account.

---

