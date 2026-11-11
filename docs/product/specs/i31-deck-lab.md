# I-31: Deck Lab: Analysis Run On Your Own List

> **Initiative:** I-31, proposed for the [roadmap](../roadmap.md) · **Status:** proposed · **Priority:** Next; Later for slice 11, norms placement, which waits for I-29's corpus statistics (marked 2026-11-10) · **Written 2026-11-09**
> **Paid tier:** a candidate for [I-30](i30-business-model-and-paid-tier.md), rated unproven there: no willingness-to-pay data exists for probability analytics, and free tools already offer castability and paired swaps. Billing waits for I-30's decision gate and legal review.
> **Research:** dated notes, not committed, so every external fact below links its own source. Legal points are research, not legal advice.
> **Owns:** the player-facing lab on one list: card classification for simulation, the colour model, the solved keep table, commander and mana development, variants within one list, norms placement, run history, and the free/paid split of those outputs. **Does not own:** the seeded shuffler, interval maths, named mulligan policies and the two-snapshot verdict ([I-21](i21-reproducible-probability-bench.md)); the interactive playtest and its keep advice ([I-07](i07-playtest-and-iteration.md)); bracket rules and the guide's shell tables ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the deck corpus and its statistics ([I-29](i29-cross-site-deck-index.md)); pricing and billing (I-30).

## Overview

The [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md) solved which hands to keep under the free multiplayer mulligan, but only for eight archetypal shells. Its own open questions say the most useful product output is "a keep table for the user's own list" ([guide](../guides/commander-mulligans-curves-and-play-style.md#open-questions-and-research-limits)). Deck Lab runs that model, extended with colours, on the player's list.

It computes five things no product was found to compute for a given list: an **optimal keep table** for the first seven and the free seven; the **probability the commander is cast by each turn**, with ramp, colours and the free mulligan; **per-turn percentiles** of mana and colours; **variants** ("cut a land", "add a Signet") that re-solve the mulligan policy and report a margin of error; and **percentile placement** among comparable decks with the sample size shown. It also gives the table stakes that free tools already give, such as castability per colour and per card. Everything it reports carries a seed, a sample size, an interval and an engine version, and a link replays it.

**How it differs from I-21.** I-21 is infrastructure: a seeded shuffler, intervals, named policies and a statistical comparison of two snapshots. I-31 is the product a player opens on one list. It consumes I-21's slices 1, 3, 5 and 6, so those slices move ahead of I-21's "Later" priority.

**Why it might carry a paid tier.** Castability on curve is already free elsewhere, so it cannot be sold. What can be sold is decision output that needs per-list solving, heavier compute, storage and history: variants with an honest verdict, large server-side samples, and comparisons across snapshots. The free run stays useful on its own and shows every number's uncertainty.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise. "Not found" means not found among the roughly twenty tools and projects checked. It does not prove absence.

| Product                                              | What it computes on the player's list                                                                                                                                                                                                                                                                        | Method disclosed                                                                                                                                                                                                      | Price                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **DeckFlow** Mana Base Analyzer [1]                  | Castability by Monte Carlo; London mulligan with the free first mulligan, bottoming "lowest-impact first, never lands"; MDFC land backs count as lands; fetches credited to the colours they find; tapped lands handled; "a joint check, not two independent odds" of mana and pips; per-card on-curve share | Built on "Frank Karsten's source-count math, then extended". No iteration count, seed or interval. A commander-importance setting, but no commander-castability figure                                                | Free; Ko-fi                                               |
| **Fetch** analyser [2]                               | Per-spell "cast rate" in the right colours on the wanted turn; verdict against "real decks of its own bracket"                                                                                                                                                                                               | "It is a hypergeometric probability", "calibrated on real decks". Mulligan handling, horizon and comparison sample size not stated                                                                                    | Free, no account; an account saves and tracks a deck      |
| **EDHTuner** [3][4]                                  | Paired swap tests and land counts "at several counts"; a swap must clear "a statistical bar and a practical one"                                                                                                                                                                                             | "The same shuffle seeds with and without the swap", "a few thousand games per swap"; "deterministic: the same deck in gets the same answer out"; runs "entirely on your machine". Mulligans and colours not described | Free, no account, no ads; affiliate buy links to ManaPool |
| **mtg-mcp-server** (open source, v3.0.0 2026-07) [5] | Keep rates under a `free_mulligan` option; mulligans hands that cannot source every commander colour; spendable mana per turn in a greedy five-turn goldfish                                                                                                                                                 | Hand-written keep rules (`playability`, `lands_v1`); 100–100,000 iterations; a `seed` option                                                                                                                          | Free                                                      |
| **Playgroup.gg** deck template [6]                   | Ten category counts against the 25th–75th percentile of decks with the same colour identity                                                                                                                                                                                                                  | 201,607 decks; thin identities "left unpublished rather than guessed at"; no bracket split, no placement of the player's deck, no probability                                                                         | Free, no account                                          |
| **DeckCheck** [7][8]                                 | 0–96 Threat Index in a bracket; twelve benchmarks graded S–F; colour requirements; Draw Odds                                                                                                                                                                                                                 | Tier thresholds not published                                                                                                                                                                                         | 5 free credits a day; plans 48, 96 and 192 USD a year     |
| **Archidekt**, **ScrollVault** [9][10]               | Colour production against cost and a probability table (Archidekt, 2024-09-23); a Monte Carlo mana base calculator "powered by" Karsten's math (ScrollVault)                                                                                                                                                 | No simulation described (Archidekt); no iteration count (ScrollVault)                                                                                                                                                 | Free; Archidekt ad removal on Patreon                     |
| **Deckstats** Premium [11]                           | "First-turn analysis" on Premium                                                                                                                                                                                                                                                                             | Not read: the page answered 403 on 2026-11-09; the row comes from the [competitive landscape](../competitive-landscape.md) of 2026-11-08                                                                              | 4.99 USD a month                                          |
| **Moxfield**                                         | An "on-curve estimator", according to a third-party README [12]                                                                                                                                                                                                                                              | Unverified: Moxfield answered 403 to the research tools                                                                                                                                                               | Unknown                                                   |

**Five analyses not found anywhere.**

1. **An optimal keep table for the player's list, first seven against free seven.** Every simulator found uses a hand-written keep rule. Karsten wrote in 2022 that optimising a mulligan policy per deck "via stochastic dynamic programming" was "outside the computational scope of this work" [14]. The guide's model does it for shells.
2. **P(commander cast by turn T)** with ramp, colours and the free mulligan. DeckFlow weights the commander but gives no figure [1]. An open-source issue proposes it on turns 2–10 and is unbuilt [13].
3. **Per-turn percentiles of mana and colours** for the list. mtg-mcp-server reports spendable mana per turn, not its distribution [5].
4. **Variants that re-solve the mulligan policy and show an interval.** EDHTuner pairs shuffles and applies a bar, but shows no interval or required sample size, and does not describe its mulligan model [3][4].
5. **Percentile placement within bracket × colour identity or commander mana value, with n.** Playgroup publishes identity-only bands and does not place the deck [6]; Fetch compares with a bracket without stating n [2].

**Correction for I-21.** The I-21 spec (read 2026-11-08) says none of five tools offers a published seed, a statistical two-snapshot comparison or intervals, and the specs README summarises "none publishes a seed or an interval". Two tools outside I-21's table contradict part of that. EDHTuner is deterministic, pairs shuffles, applies "a statistical bar" and says "any analysis can be copied as a link that replays the same result for anyone who opens it" [3][4]. mtg-mcp-server exposes a `seed` [5]. What is still not found is a **displayed interval**, a **displayed seed with its sample size**, and an explicit **"not distinguishable at this sample size"** verdict. Proposed wording for I-21 and the README: "Several tools simulate thousands of hands and two are reproducible; none found shows an interval or says when a difference is not distinguishable." EDHTuner's replay link also answers I-21's first open question in part: a quotable result does not need a server. Identical output across devices needs integer-only randomness and a pinned engine version (requirement 8.3).

**The science behind thresholds is thin.** Karsten's 2022 work is the only Commander-specific colour-source science found, with no update since [15][14]. Its partial-source weights (Signet 0.75 per colour, dork 0.5, Treasure 0.25) are fitted to its own assumptions. The MDFC weights in circulation, 0.74 and 0.38, are Karsten's own land-count weights for a mythic and a non-mythic MDFC; for colour sources he counts an MDFC as a full source when mythic and 0.8 otherwise ([I-58 sources 2 and 3](i58-mana-base-builder.md#sources)). **Corrected 2026-11-10:** this spec first credited them to a 60-card section of a secondary guide [16]. Templates such as The Command Zone's 38 lands, 10 ramp and 12 draw (2025-02-18) have no published derivation [17]. Simulating the actual cards removes the need for weights. Templates appear only as labelled reference lines.

**What players pay for.** Subscriptions in this market gate volume and personal data, not reference data. Untapped.gg's Premium (7.99 USD a month) includes on-play and on-draw statistics, deck-version tracking and history "Up to Two Years" against "Last Two Sets" free [18]. Fetch puts tracking behind a free account [2], so tracking alone is not a paid feature. No product was found charging for simulation analytics, except possibly Deckstats' unread "first-turn analysis" [11]. The research notes disagree slightly on that point.

## Current state in this codebase

Verified on `dev` (`origin/dev` at `49983a9`) on 2026-11-09:

- **The research model exists and is not product code.** [`scripts/research/commander-opening-hands/model.mjs`](../../../scripts/research/commander-opening-hands/model.mjs) has a seeded mulberry32 generator, a 99-card deck builder, eight card kinds (`land`, `tland`, `rock`, `dork`, `lramp`, `draw`, `engine`, `spell`), hand classes by lands, cheap ramp and early plays, a fixed London bottom heuristic, a ten-turn goldfish, eleven binary metrics (among them `cmdOnCurve` and `cmdPlus1`) and a backward-induction `solve`. It records sources per turn but accumulates only thresholds, not distributions. It has no colours. The [README](../../../scripts/research/commander-opening-hands/README.md) says nothing in `src/` imports it. The profiles are shells; no code turns a decklist into a profile.
- **Speed. Computed** for this spec on 2026-11-09 (Node 22.23, one core of the 4-vCPU development VPS, colourless model): 36,000–65,000 ten-turn games a second over two runs, the lower one on a busy machine. 100,000 games (20,000 per stage across five stages) took 1.5–2.8 s, and the solve under 4 ms.
- **The playtest follows the official mulligan** since #1301 (merged 2026-11-09). [`src/lib/playtest/engine.ts`](../../../src/lib/playtest/engine.ts) has `mulliganBottomCount`, `keptOpeningHandSize` and `applyMulligan`, and [`src/lib/deck/formats.ts`](../../../src/lib/deck/formats.ts) sets `firstMulliganFree` per format. `createPlaytestState` shuffles deck rows as given, without expanding `quantity`. Shuffles use `randomIntBelow` from [`src/lib/crypto-random.ts`](../../../src/lib/crypto-random.ts) (Web Crypto, chosen for Sonar S2245). No seeded generator exists in `src/`.
- **Merged later on 2026-11-09.** `src/lib/playtest/keep-rules.ts` (stage-aware keep advice from the guide's shell tables) landed in #1303. The quantity and command-zone fix (`fix/playtest-library-quantities-and-command-zone`) was still going through the pre-push gate when this spec was written.
- **Card data has no mana production.** `DeckCard` ([`src/lib/deck/types.ts`](../../../src/lib/deck/types.ts)) stores `manaCost`, `cmc`, `typeLine`, `oracleText`, `colorIdentity`, one `category`, `cardFaces`, `isFlexibleLand` (set when an MDFC's back is a land) and `quantity`. `ScryfallCard` ([`src/lib/scryfall/types.ts`](../../../src/lib/scryfall/types.ts)) omits Scryfall's `produced_mana`. [`src/lib/deck/mana-alignment.ts`](../../../src/lib/deck/mana-alignment.ts) says that field "is not stored anywhere". Its `colorsProducedBy` reads basic subtypes, then "Add" clauses, then colour identity, and counts lands only. Reading the code, a fetch land has no "Add" clause and an empty identity, so it counts as colourless. `extractColorPips` in [`src/lib/mana/parse.ts`](../../../src/lib/mana/parse.ts) covers the cost side.
- **Roles are single labels.** `categorizeCard` ([`src/lib/deck/categories.ts`](../../../src/lib/deck/categories.ts)) gives one `category` per card. It files tutors under `draw` and checks win conditions before ramp. The player can change it.
- **Brackets stop at 4.** `BracketLevel = 1 | 2 | 3 | 4`, and `Deck.targetBracket` defaults to 3. Bracket 5 is I-28 slice 2.
- **Snapshots and comparisons exist for recorded play only.** `DeckSnapshot` stores `cardList` JSON, and `src/lib/playtest/comparison.ts` compares recorded sessions (I-07), not simulations.
- **Workers are allowed but unused.** The CSP in [`src/lib/security-headers.ts`](../../../src/lib/security-headers.ts) already sends `worker-src 'self' blob:`. No `new Worker` exists in `src/`.
- **No billing.** The Prisma schema has no subscription, plan or entitlement field.

## Functional requirements

### 1. Inputs

1.1 Deck Lab runs on a Commander list of 99 cards plus the commander or commanders: a saved deck, a deck snapshot, a public deck the viewer can see, or a pasted list. A list that is not 99 cards runs with a visible warning.
1.2 Quantities are expanded and only the `main` zone is dealt. Commanders start in the command zone. Sideboard and maybeboard rows are never dealt.
1.3 Settings: rules (**multiplayer**: free first mulligan under CR 103.5c, and the starting player draws on turn 1 under CR 800.7 [19]; **duel**: no free mulligan, results on the play and on the draw), horizon turn (defaulting from the target bracket as in the guide: B1 and B2 turn 8, B3 turn 7, B4 turn 6, B5 turn 4), sample size from a fixed ladder, seed, and optional key cards.
1.4 Other formats show "not modelled". The model is 99 cards plus a commander.

### 2. Card classification

2.1 A deterministic classifier maps each card to a lab kind: untapped land, tapped land, fetch land, MDFC, rock, dork, land ramp, burst draw, draw engine or spell. It also records cost, coloured pips, colours produced, mana out, fetchable land types and cards drawn. No LLM is involved.
2.2 Every card shows the rule that classified it. The player can override any field per deck, and the override is stored and hashed into the run key.
2.3 Unknown cards default to a spell at their mana value, and the result counts how many cards fell back.
2.4 Cards whose output depends on opponents (Exotic Orchard, Fellwar Stone) default to any colour of the deck's identity and carry a "depends on opponents" flag.
2.5 Ramp is defined on screen. **Cheap ramp** is a mana source costing 2 or less, as in the guide. The category counts used for norms (group 7) use the deck's single `category`, and the screen says so.

### 3. Colour model (enabler)

3.1 Each turn, untapped sources are assigned to coloured pips by a matching. A spell enters the cast plan only if its pips can be paid together with the rest of the plan, which is DeckFlow's "joint check" [1].
3.2 Fetch lands become one of the land types they can find, chosen by need, and the card found leaves the library. Land ramp chooses its basic the same way.
3.3 An MDFC is a land or a spell, never both. The rule for which (play it as a land when no other land drop is available) is stated. No fractional weights are used.
3.4 Filter rocks such as Signets are one net source of either listed colour, as in the model's "Signets net 1 for 2". "Any colour in your commander's colour identity" resolves to the identity. Hybrid, Phyrexian and X costs follow rules listed in the classification table.
3.5 The land played each turn and the fetch target take colour need into account. Ties break deterministically.
3.6 Hand classes gain a colour class: whether the hand's lands and cheap ramp can produce every colour in the commander's mana cost.
3.7 A mono-coloured deck gives the same results as the colourless model at the same seed. This is the colour model's regression anchor.
3.8 The slice records games per second with and without colours. The guide's colourless tables stay the reference for shells.

### 4. Keep table

4.1 Stages are first seven, free seven, six, five and four in multiplayer, and seven, six, five and four in a duel. London bottoming uses the model's stated heuristic.
4.2 Backward induction over the hand classes (lands × cheap ramp × early plays × colour class, plus key cards when marked) gives the optimal keep rule for this list and each class's margin against mulliganing.
4.3 The table shows, per class and stage, its share of hands, the margin with an interval, and a verdict. A margin within ±2% is a judgment call, following the guide's band. Classes in fewer than 1% of hands are hidden.
4.4 The run reports keep rates per stage, the average kept hand size, and the value of the free mulligan for this list: optimal multiplayer value minus optimal duel value.
4.5 **Optimisation bias.** The policy is solved on one half of the batches and evaluated on the other, and the other way round. Reported values and keep rates are the average of the two halves. The displayed rule comes from the full sample.

### 5. Development outputs

5.1 P(commander cast by turn T), for T = 1 to 10. Multiplayer gives one curve, because every seat draws on turn 1 in a goldfish. Duel gives on-the-play and on-the-draw curves. Partners give each commander and both.
5.2 Per turn, T1 to T8: P10, P50 and P90 of mana available and of distinct colours available, with the share of games at or above each value.
5.3 Per colour: the share of games with at least one, two and three sources of it by each turn. Karsten's 2022 table is shown as a labelled reference line [15].
5.4 Per card: the share of games in which it was castable on curve (table stakes, as in DeckFlow [1]).
5.5 Land drops: at least 3 lands by turn 3, at least 4 by turn 4, and two or more missed drops by turn 4, as in the guide's metrics.

### 6. Variants

6.1 A variant is a swap that keeps 99 cards: a land for a spell, a land for a cheap ramp piece, a basic for a dual, Cultivate for a Signet, or a custom swap. In Commander, "one land fewer" always means "one land for something".
6.2 Variants run on common random numbers: the same seed and batch layout as the baseline, so the hands differ only where the swapped card falls [3].
6.3 The mulligan policy is re-solved for each variant (4.2, 4.5).
6.4 The primary metric is mana spent by the horizon, Karsten's goldfish metric used by the guide. Each variant reports the paired difference with a 95% interval. Other metrics are descriptive and get no verdict.
6.5 Verdicts across one run's variants use a stated multiple-comparison correction (Holm proposed, shared with I-21).
6.6 There are three verdicts. **Better or worse** means distinguishable and beyond the practical bar. **On the plateau** means distinguishable but within the bar. **Not distinguishable at this sample size** means the interval spans zero; it comes with "about N′ games per stage would be needed". The proposed bar is 0.5% of baseline value, the guide's plateau definition.

### 7. Norms placement

7.1 The list's counts (lands, cheap ramp, all ramp, draw, interaction, average nonland mana value, curve slots) are placed at a percentile within bracket × colour identity. The fallbacks are bracket × number of colours, then bracket × commander mana value band. The screen names the cell used and its n.
7.2 Norms come only from I-29's computed statistics (I-29 requirements 6.1 to 6.4), with their corpus version and window. Cells below the minimum sample are withheld, as I-29 6.3 and Playgroup do [6].
7.3 The screen says whether brackets in the cell are declared or estimated.
7.4 Placement is descriptive. "Below the band is a question to ask about your list, never a mistake", in Playgroup's words [6]. No score or grade is computed.

### 8. Reproducibility contract

8.1 A run key holds: the list hash (canonical card names, quantities and commanders), the classification version, an overrides hash, the engine version, a settings hash, the sample size and the seed.
8.2 The same run key produces a byte-identical result in a browser worker and in Node, with one worker or several. This is the acceptance test of the initiative.
8.3 Randomness comes only from I-21's seeded integer generator. Per-batch seeds derive from the run seed and the batch index. The hot path uses integer operations, basic IEEE arithmetic and `Math.sqrt` only, with no `Math.random`, `exp`, `log` or `pow`, because engines may round those differently. The lab's generator is predictable by design and stays inside the lab; IDs and the interactive playtest keep `crypto-random.ts`.
8.4 The default seed is derived from the list hash, so the same list always gives the same default answer, as in EDHTuner [3]. The seed is shown and can be copied or changed.
8.5 Work splits into a fixed number of batches (20 proposed). The batches are the unit of parallelism, the unit of seeding and the unit of uncertainty: intervals are batch means with a t quantile stored as a constant.
8.6 Every share and mean is reported with its 95% interval and n. The result page shows the seed, the sample size and the engine version together, the combination no competitor was found to show.
8.7 A replay link reproduces the run. If the engine version has changed, the link shows the stored result, names its version, and offers a new run.

### 9. Execution

9.1 The default runs in web workers: one per core, capped at 4, using one less than `navigator.hardwareConcurrency`. It reports progress and can be cancelled. A cancelled run records nothing.
9.2 The same `src/lib/deck-lab/` module runs in Node for server runs. It has no DOM and no Node-only dependencies.
9.3 Server runs are queued at concurrency 1 with a per-user daily cap. **Estimate:** a full run with six variants is about 700,000 games, about 15 CPU-seconds colourless. The development VPS has 4 vCPU and about 7.7 GB of RAM and shares them with E2E gates and scheduled agents.
9.4 Results are cached by run key.
9.5 Default sample sizes are set only after 3.8's measurement and a timing on a mid-range phone. Mobile throughput is unmeasured. **Estimate:** a full run is about 4 s across four desktop workers before the colour model.
9.6 WebAssembly is not planned. The one public Monte Carlo comparison found measured about 1.7× over JavaScript in a worker (2024) [20], and data crossing the boundary has a cost.

### 10. Limits and wording

10.1 A limits panel is always visible. Deck Lab is a goldfish: no opponents, removal, board wipes, commander tax or politics. Value is mana spent. Hand classes are coarse. The bottom rule is fixed. The horizon is a choice. Classification and colour rules are heuristics the player can override. _Added 2026-11-11:_ once [I-78](i78-what-this-deck-does-to-the-table.md) slice 1 ships, the limits list names the deck's cards that I-78 classes as group hug or wheel, because the goldfish credits their mana and cards to the player alone. I-78 adds no lab kind, and 2.4's "depends on opponents" flag stays this initiative's.
10.2 Results are not win rates. Playgroup measured win rate flat at 28–29% for openers with 2 to 5 lands in 4–6-player pods (1,608,359 games) [21]. The model's optimal first-seven keep rate (32–51% in the shells) is below what players keep (64%), because the model does not value cards beyond mana ([guide](../guides/commander-mulligans-curves-and-play-style.md#limits)).
10.3 "Not distinguishable at this sample size" is presented as a finding, not as an error.

### 11. Free and paid

| Capability                                                                                                                                       | Free                                                             | Paid (I-30)                 | Why                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default run: keep table, commander by turn, percentiles, colour sources, castability per card, seed, n, intervals, limits, classification review | Yes, with no account, at the default sample size, in the browser | —                           | DeckFlow, Fetch and EDHTuner give castability, swaps and replay free [1][2][3]. A paywall here would lose to them. It is also where the unoffered keep table is first seen |
| Replay link; latest run saved per deck                                                                                                           | Link with no account; saving with a free account                 | —                           | EDHTuner replays free [4], and Fetch tracks with a free account [2]                                                                                                        |
| Land ±1 variant pair                                                                                                                             | Yes                                                              | —                           | EDHTuner offers land-count tests free [3]                                                                                                                                  |
| Custom and colour swaps, more than two variants a run, re-solved policy with Holm-corrected verdicts                                             | —                                                                | Yes                         | Not found elsewhere (gap 4), and the compute is heavier. **Risk:** EDHTuner's free swaps are close enough that the difference must be visible                              |
| Large samples run on the server, stored and identical across devices                                                                             | —                                                                | Yes                         | Server CPU and storage cost money. A sample-size limit in the browser is a default, not a security boundary                                                                |
| Run history across snapshots and a two-snapshot verdict (I-21)                                                                                   | Latest run only                                                  | Full history and comparison | Paid history depth matches Untapped's "Up to Two Years" [18]                                                                                                               |
| Norms placement                                                                                                                                  | Yes                                                              | —                           | I-29 7.3 keeps statistics free, and the placement is a cheap read                                                                                                          |

11.1 No paid check ever gates card data, the default run, statistics or the limits text. This follows Scryfall's no-paywall rule [22] and I-29's working assumption that paid features are computation on the player's own decks.
11.2 Whether paid computation fits the Fan Content Policy ("Free means FREE" [23]) is an open legal question (research, not legal advice). Billing waits for it.

### 12. Links to other initiatives

12.1 I-28 slice 9's opening-hand check uses the deck's default run when one exists for the current list hash, and the shell tables otherwise. This answers I-28's open question "Simulate the player's own list" in favour of I-31.
12.2 The playtest's keep advice (I-07, `keep-rules.ts`, merged in #1303) may read the deck's own keep table when a run matches the list. Otherwise it keeps the shell tables.
12.3 History comparisons call I-21's two-snapshot verdict; they do not reimplement it.

## Data model / API

```
LabCard          name, quantity, kind (land|tland|fetch|mdfc|rock|dork|lramp|draw|engine|spell), cost, pips, produces (colours|identity|any), out, entersTapped, fetchTypes[], drawN, toHand, key, ruleId, overridden
DeckLabOverride  deckId, cardName, field, value, updatedAt
LabSettings      rules (multiplayer|duel), horizon, gamesPerStage (ladder), batches, seed, keyCards[], variants[]
DeckLabRun       id, deckId?, snapshotId?, userId?, listHash, classificationVersion, overridesHash, engineVersion, settingsHash, seed, ranOn (worker|server), status, createdAt, result (JSON), resultHash
LabResult        keepTable[stage][class]{share, marginPct, ci, verdict}, keepRates[], value{mean, ci}, freeMulliganValue, commanderByTurn[], manaPercentiles[], colourPercentiles[], colourSources[colour][turn], cardOnCurve[], landDrops{}, variants[]{swap, diff, ci, verdict, nNeeded}, norms[]{metric, percentile, cell, n, corpusVersion}, limits[], fallbackCards
```

- `src/lib/deck-lab/`: pure functions `classifyDeck(cards, overrides)` and `runLab(deck, settings, { onProgress, signal })`. Both are deterministic and contain no I/O.
- A module worker created with `new URL('./worker.ts', import.meta.url)`. Batches go out in order, and results merge in batch order.
- `POST /api/decks/[id]/lab-runs` (server run, entitled users) and `GET /api/lab-runs/[id]`. A replay route takes the run key or a run id. A free browser run stores a `DeckLabRun` only for a signed-in owner.

## Non-goals

- Opponents, interaction, an AI opponent or a rules engine. The roadmap's I-21 non-goal applies here too.
- Win-rate prediction, a power score or a deck grade.
- An LLM for classification, verdicts or wording of results.
- Karsten's fractional weights or MDFC coefficients as the method. They appear only as labelled reference lines.
- 60-card formats and Brawl in this initiative.
- Optimising the bottom choice or play decisions beyond the stated goldfish policy.
- Replacing the I-07 playtest or the I-21 bench.
- Running the lab over other people's decks to build norms. Norms come from I-29.
- A paywall on card data, the default run or statistics.

## Testing strategy

- **Parity (slice 1):** at the same profile, seed and sample, the TypeScript port reproduces `model.mjs` bucket counts and solved values exactly. It also reproduces the guide's validation figures (0.780, 0.621, 0.740 against exact hypergeometric odds).
- **Reproducibility (the specification):** the same run key gives a byte-identical result across reruns, with one and four workers, and in Node and Chromium (Playwright).
- **Colour model (solitary):** a mono-coloured deck equals the colourless model; a two-colour deck with no source of one colour never casts its spells; a fetch counts for one found type and removes it from the library; an MDFC is never land and spell in one game; a lands-only case matches the exact probability of one source by turn T.
- **Classification (table-driven):** Sol Ring, Arcane Signet, a Signet, Command Tower, Cultivate, Llanowar Elves, a fetch land, Evolving Wilds, a shock land, a tapped dual, an MDFC and Exotic Orchard each map to the documented kind. Overrides change the run key.
- **Statistics:** swapping a basic for an identical basic is not distinguishable. Thirty against forty lands in a B2-like list is distinguishable. Interval coverage on a known proportion is about 95% over repeated seeds. N′ follows its formula. Cross-fitting shows no positive bias on a deck of identical cards.
- **Honesty:** the limits panel and n render on every result. An interval spanning zero renders the "not distinguishable" sentence with N′.
- **Free access:** the default run works signed out, and no free path checks an entitlement.
- **Performance (recorded, not gating):** games per second with and without colours, on a desktop and on a mid-range phone.

## Delivery slices

| #   | Slice                                                                                                                                                                                                                                                      | Depends on                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Engine core: TypeScript port of the research model into `src/lib/deck-lab/` (colourless), batch seeds, parity and hypergeometric tests                                                                                                                     | I-21 slice 1                                              |
| 2   | Card classification: `DeckCard` to `LabCard` with rule trace, quantities expanded, commanders in the command zone, per-deck overrides; colours parsed but not yet used _(owns the card mana facts that I-58 slice 2 reads; one owner, decided 2026-11-10)_ | —                                                         |
| 3   | Worker runtime: pool, batch-order merge, progress, cancel, sample-size ladder _(I-21 slice 6 owns the worker runtime; decided 2026-11-10)_                                                                                                                 | 1; I-21 slice 6                                           |
| 4   | Colour model: pips, matching, fetches, MDFCs, filters, colour-aware land and fetch choice, colour hand class; throughput recorded                                                                                                                          | 1, 2                                                      |
| 5   | Default run results: cross-fitted keep table, commander by turn, percentiles, colour sources, per-card castability, land drops, batch-means intervals, limits list naming I-78's group hug and wheel cards (added 2026-11-11)                              | 3, 4; I-21 slice 3                                        |
| 6   | Deck Lab page: run, classification review and overrides, results, seed and limits panel; signed-out run on a visible or pasted list                                                                                                                        | 5                                                         |
| 7   | Run record (`DeckLabRun`), replay link, engine-version handling                                                                                                                                                                                            | 6                                                         |
| 8   | Variants: presets and custom swaps on common random numbers, re-solved policy, paired intervals, Holm, practical bar, N′                                                                                                                                   | 5; I-21 slice 5                                           |
| 9   | Server runner: same module in Node, queue, daily cap, cache by run key, worker–server parity test                                                                                                                                                          | 7                                                         |
| 10  | History across snapshots and two-snapshot comparison                                                                                                                                                                                                       | 9; I-21 slice 5                                           |
| 11  | Norms placement with cell fallback, n and suppression                                                                                                                                                                                                      | 5; I-29 slices 8 and 11; I-28 slice 2                     |
| 12  | Paid gating of 8 (beyond the free pair), 9 and 10                                                                                                                                                                                                          | 8, 9, 10; **Blocked** on I-30's decision and legal review |
| 13  | Deck-specific keep advice in the playtest and in I-28's opening-hand check                                                                                                                                                                                 | 5; I-28 slice 9                                           |

Slice 2 ships alone, and slice 1 ships as soon as I-21's shuffler exists. Slices 1–7 are the free product. Four I-21 slices gate this work: slice 1 gates slice 1, slice 6 gates slice 3, slice 3 gates slice 5, and slice 5 gates slices 8 and 10. Those I-21 slices therefore need to leave "Later".

## Open questions

- **Is the paid line worth paying for?** EDHTuner gives paired swaps free, with no account [3][4]. The only differences Deck Lab adds to variants are the re-solved mulligan, colours, intervals and N′. No willingness-to-pay data exists for probability analytics. Should one custom swap a run be free, and should the paid tier lead with history and server runs instead?
- **What does the colour model cost?** Matching per turn slows each game by an unmeasured factor, and mobile throughput is unmeasured. The default sample sizes and the free tier depend on slice 4's measurement.
- **Which colour class?** The commander's mana cost (proposed), its full identity, or the colours of the hand's early plays. A five-colour identity would put almost every hand in one class.
- **Practical bars and the correction method** (0.5% of value, Holm) should be decided once, together with I-21's open question on the statistical test.
- **Norms will be thin at first.** I-29's lawful corpus starts with I-08 public decks, the cEDH Decklist Database and precons. Most bracket × identity cells will be withheld. What is the minimum n? I-29 leaves it open too. Playgroup's smallest published identity holds 221 decks [6].
- **Legal (research, not legal advice):** does charging for computation on a player's own decks fit the Fan Content Policy [23] and Scryfall's terms [22]? This is question 9 of the I-29 lawyer list. Billing does not ship before the answer.
- **Engine versions:** should old replay links be able to re-run the old engine, or only show the stored result (8.7)?
- **Scryfall `produced_mana`:** should classification use it once stored? The docs page answered 403 to this session, so the field's exact definition is to be read in slice 2.

## Sources

1. DeckFlow, Mana Base Analyzer, undated, read 2026-11-09. https://www.deckflow.gg/manabase
2. Fetch, deck analyser, © 2026, read 2026-11-09. https://www.fetch-mtg.com/analyse
3. EDHTuner, Methodology, undated, read 2026-11-09. https://edhtuner.com/methodology
4. EDHTuner, FAQ, undated, read 2026-11-09. https://edhtuner.com/faq
5. Glama, `mtg-mcp-server` (Cladios34), `simulate_opening_hands`; v3.0.0 first observed 2026-07-29, read 2026-11-09. https://glama.ai/mcp/servers/Cladios34/mtg-mcp-server/tools/simulate_opening_hands
6. Playgroup.gg, Commander deck template, refreshed weekly, read 2026-11-09. https://playgroup.gg/commander/deck-template
7. DeckCheck, How to use DeckCheck, updated 2026-10-17. https://deckcheck.co/articles/howto
8. DeckCheck, Get More (plans and credits), read 2026-11-09. https://deckcheck.co/get-more
9. Archidekt, Development Update – Deck Stats, last edited 2024-09-23. https://archidekt.com/news/9287631
10. ScrollVault, Free MTG tools, read 2026-11-09. https://scrollvault.net/tools/
11. Deckstats, Premium, read 2026-11-08 (403 on 2026-11-09). https://deckstats.net/premium
12. Azusa on PyPI (third-party README mentioning Moxfield's on-curve estimator), read 2026-11-09. https://pypi.org/project/azusa/
13. commander-playtest-lab, issue #833 (commander castable by turn N), read 2026-11-09. https://github.com/moeendres-png/commander-playtest-lab/issues/833
14. Frank Karsten, "What's an Optimal Mana Curve and Land/Ramp Count for Commander?", TCGplayer, 2022-07-15. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
15. Frank Karsten, "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022 Update", TCGplayer, 2022-08-02. https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
16. ScrollVault, Manabase Guide 2026 (MDFC weights in its Standard section), read 2026-11-09. https://scrollvault.net/guides/mana-bases.html
17. The Command Zone #658, 2025-02-18. https://www.youtube.com/watch?v=9m6LEdczgWY
18. Untapped.gg, MTG Arena Premium, read 2026-11-09. https://mtga.untapped.gg/premium
19. Wizards of the Coast, Comprehensive Rules effective 2026-11-06 (103.5c, 800.7). https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt
20. polyglot-codes, "WebAssembly vs JavaScript: Monte Carlo", 2024-02-18. https://polyglot-codes.pages.dev/posts/webassembly-monte-carlo
21. Playgroup.gg, How many lands, updated 2026-11-08. https://playgroup.gg/commander/how-many-lands
22. Scryfall, API documentation (use of data), read 2026-11-09. https://scryfall.com/docs/api
23. Wizards of the Coast, Fan Content Policy, last updated 2017-11-15, read 2026-11-09. https://company.wizards.com/en/legal/fancontentpolicy

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player opens their own Commander list and gets a seeded, replayable analysis: the best keep rule for the first seven and the free seven, the chance the commander is cast by each turn, per-turn mana and colours, and swaps judged with an interval.

### Goals

- A player runs Deck Lab on their own list without an account and gets a keep table and commander and mana development, each figure with its interval, seed, sample size and engine version; a replay link reproduces the run byte for byte; and a variant's verdict says when the difference is not distinguishable.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-31-01

As a player tuning one list, I want a keep table and a swap result I can rerun, so that a difference that is noise is labelled noise.

#### US-31-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-31-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-31-01 Happy path

Given a signed-in player and the English locale
When the same seed and sample size reproduce the interval.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-31-02 Happy path

Given a signed-in player and the English locale
When a swap that is not distinguishable at that sample says so, and says the sample that would be needed.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-31-03 Happy path

Given a signed-in player and the English locale
When the run does not change the deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-31-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-31-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-31-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. A free allowance is I-30's decision. Guests do not run the lab. Flag off until a fixture reproduces.

#### AC-31-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-31-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-31-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The result is a table: inputs, interval, sample size, seed. A button reruns with the same inputs.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Uses the seeded generator from the I-21 slices that move ahead of Later. Results are stored on the account, private. No public route.

### Analytics and telemetry

`lab_run_finished {kind: keep or swap, distinguishable: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. A free allowance is I-30's decision. Guests do not run the lab. Flag off until a fixture reproduces.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Norms against other decks wait on I-29 and stay Later.

### Sources

- https://www.deckflow.gg/manabase
- https://www.fetch-mtg.com/analyse
- https://edhtuner.com/methodology
- https://archidekt.com/news/9287631
- https://tappedout.net/mtg-forum/site-updates/card-odds-gets-an-update/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-31: Deck Lab: Analysis Run On Your Own List

**Spec:** [`specs/i31-deck-lab.md`](i31-deck-lab.md)

**Outcome:** a player opens their own Commander list and gets a seeded, replayable analysis: the best keep rule for the first seven and the free seven, the chance the commander is cast by each turn, per-turn mana and colours, and swaps judged with an interval.

**Status:** Next
**Priority:** Next; Later for slice 11, norms placement, which waits for I-29's corpus statistics (marked 2026-11-10)
**Impact / effort:** High / large
**Depends on:** I-21 slices 1 (seeded shuffler), 3 (intervals), 5 (two-sample verdict) and 6 (worker runtime), which therefore move ahead of I-21's Later priority. Norms placement needs I-29's computed statistics and I-28 slice 2.

The [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md) solved keep rules for eight archetypal shells and named "a keep table for the user's own list" as the most useful product output. Castability on the player's list is already free at [DeckFlow](https://www.deckflow.gg/manabase) and [Fetch](https://www.fetch-mtg.com/analyse), and [EDHTuner](https://edhtuner.com/methodology) runs paired, replayable swap tests for free. Among the roughly twenty tools checked, none solves the keep table for a given list, gives the commander's cast probability by turn, shows per-turn percentiles of mana and colours, re-solves the mulligan for each variant, or shows an interval and says when a difference is not distinguishable at the sample size. The research model in [`scripts/research/commander-opening-hands/`](../../scripts/research/commander-opening-hands/README.md) ran 36,000–65,000 games a second on one core of the development VPS; it has no colours, and nothing in `src/` imports it.

### Scope

- [ ] Port the research model into `src/lib/deck-lab/`, with parity tests against `model.mjs` and the guide's exact hypergeometric figures (slice 1).
- [ ] Classify each card for the simulation by a deterministic rule the player can see and override per deck. No language model (slice 2).
  - Route roles are a separate layer. `categorizeCard` (`src/lib/deck/categories.ts`) gives each card one label and, on 35 hand-picked route cards, labels no combat, drain, mill, equipment, combo or lock card `winCondition` (I-65 spec, logic re-checked on `origin/dev` at `72fbfc1`). [I-65](i65-how-this-deck-wins.md) adds multi-label route roles that never overwrite `category`; this slice keeps its lab kinds, and the engine supplies I-65's assembly odds (I-65 slice 13).
- [ ] Run in web workers with progress and cancel, and add a colour model: pips matched to sources each turn, fetch lands, MDFCs and filter rocks (slices 3–4).
- [ ] Report a cross-fitted keep table per mulligan stage, P(commander cast by turn), per-turn mana and colour percentiles, colour sources, castability per card and land drops, each with a 95% interval and its sample size (slice 5).
- [ ] A Deck Lab page that runs signed out on a visible or pasted list, with classification review and a limits panel that is always visible (slice 6).
- [ ] Recorded runs and a replay link that names the engine version (slice 7).
- [ ] Variants on common random numbers with the policy re-solved, Holm-corrected verdicts, and "not distinguishable at this sample size" with the sample that would be needed (slice 8). A variant may change several lines at once, so that [I-58](i58-mana-base-builder.md)'s whole proposed land base can be checked as one variant (I-58 slice 13).
- [ ] Server runs, history across snapshots, and percentile placement within bracket × colour identity with n and withheld cells (slices 9–11).
- [ ] Give I-07's playtest advice and I-28's opening-hand check the deck's own keep table when a run matches the list (slice 13).
- [ ] Once a Deck Lab run matches the list, judge keep-drill calls against the deck's own cross-fitted keep table and show the margin of each disagreement (slice 14). The drill itself is I-07's; this needs slices 5 and 13.
- [ ] A free exact-odds panel ahead of slice 1, needing none of I-21's slices ([D-47](../owner-decisions.md#product-scope-and-non-goals)). It gives the chance to see at least one of, or all of, a card, a set of cards, a category or tag, or a Spellbook combo's pieces, by turns 1–10:
  - the population comes from the deck (99, or 98 with a partner);
  - it shows one figure per turn, with the formula named;
  - the opening-seven figure says the free mulligan is not modelled and links I-07's advice.

  It reuses `choose` in `src/lib/deck/turn-one.ts`. Archidekt ([news](https://archidekt.com/news/9287631), edited 2024-09-23), TappedOut ([update](https://tappedout.net/mtg-forum/site-updates/card-odds-gets-an-update/), 2024-01-31), TopDecked (13.0.5, 2025-11-13) and Moxfield (code, 2026-05-14) all offer one. Added 2026-11-11.

- [ ] Neighbour change from [I-78](i78-what-this-deck-does-to-the-table.md), 2026-11-11: no new lab kind; the run's limits list (slice 5) names the cards I-78 classes as group hug or wheel, because the goldfish credits their mana and cards to the player alone.

### Engineering enablers

- The same run key gives a byte-identical result in a browser worker and in Node, with one worker or four. This is the initiative's acceptance test.
- The hot path draws integers from I-21's seeded generator and avoids `Math.random`, `exp`, `log` and `pow`; the interactive playtest keeps `src/lib/crypto-random.ts`.
- A mono-coloured deck gives the colourless model's result at the same seed.
- `DeckCard` stores no mana production, and `src/lib/deck/mana-alignment.ts` says Scryfall's `produced_mana` "is not stored anywhere", so classification reads Oracle text until that field is stored.

**Paid-tier angle:** rated unproven in I-30, because free tools already offer castability, swaps and replay. The default run, the replay link, a land ±1 pair and norms placement stay free. Candidates are custom swaps and more than two variants a run, large server-side samples, and full run history across snapshots (slice 12, blocked on I-30's decision).

### Enrichment (2026-11-11)

**User story.** As a player tuning one list, I want a keep table and a swap result I can rerun, so that a difference that is noise is labelled noise.

**Acceptance.**
- The same seed and sample size reproduce the interval.
- A swap that is not distinguishable at that sample says so, and says the sample that would be needed.
- The run does not change the deck.

**UX.** The result is a table: inputs, interval, sample size, seed. A button reruns with the same inputs.

**Data and API.** Uses the seeded generator from the I-21 slices that move ahead of Later. Results are stored on the account, private. No public route.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `lab_run_finished {kind: keep or swap, distinguishable: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. A free allowance is I-30's decision. Guests do not run the lab. Flag off until a fixture reproduces.

**Open questions.** Norms against other decks wait on I-29 and stay Later.

### Definition of done

A player runs Deck Lab on their own list without an account and gets a keep table and commander and mana development, each figure with its interval, seed, sample size and engine version; a replay link reproduces the run byte for byte; and a variant's verdict says when the difference is not distinguishable.

---

