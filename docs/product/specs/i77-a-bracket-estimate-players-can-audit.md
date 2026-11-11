# I-77: A Bracket Estimate Players Can Audit

> **Initiative:** I-77, proposed for the [roadmap](../roadmap.md) · **Status:** Next · **Priority:** Next, directly after [I-03](i03-trustworthy-deck-feedback.md) in the roadmap and after [I-48](i48-official-changes-reach-every-deck.md) in the Portfolio View. Slices 1 to 12 are Next; slices 13 to 16 are Later · **Paid:** never; it is evidence ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) · **Written 2026-11-11**
> **Research:** one dated note of 2026-11-11, not committed. Every external fact links its entry in [Sources](#sources). Legal points are research, not legal advice; each goes to [`legal-questions.md`](../legal-questions.md).
> **Owns:** the decomposition of the estimate (official floors, heuristic terms, the cards behind each, a certainty badge per count, blind spots); the "to reach bracket N" list; the frozen audit; the labelled sets, the benchmark report and its constant-guess baseline; the method version and the method-change gate; the public process for contesting a classification. **Does not own:** the official bracket rules ([I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 2) and their dated versions, rules-version selection and `compareAssessments` ([I-48](i48-official-changes-reach-every-deck.md)); the bracket check and the guide (I-28); the methods-page framework ([I-34](i34-commander-data-reports.md)); snapshots and the deck check link ([I-50](i50-play-this-deck-online.md)); the report form and the board ([I-52](i52-feedback-loop-players-can-see.md)); declared brackets and the pod comparison ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); logged games ([I-35](i35-pod-game-log.md)); routes and win speed ([I-65](i65-how-this-deck-wins.md)); statistics method ([I-21](i21-reproducible-probability-bench.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative                                                                                   | Change                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [I-03](i03-trustworthy-deck-feedback.md)                                         | Add a remaining-scope item: "Every bracket estimate shows its floors, terms, cards and certainty, links a frozen audit, and states its accuracy against a constant guess (I-77)." I-77 answers "Why is it flagged?" for the estimate. The shipped line "Bracket scoring across six dimensions" becomes "five" once I-28 slice 2 merges. |
| [I-15](i15-rule-zero-sheets-and-pod-profiles.md)                                             | Line 22: replace "That is the realistic accuracy ceiling…" with "A published calculator matched 77.1%, against 73.9% for always answering Bracket 3 [1]". 1.4 and 3.3: the computed column shows I-77's estimate with its method version and audit link. Slice 2 depends on I-77 slice 1.                                               |
| [I-34](i34-commander-data-reports.md#6-methods-page-and-open-data)                           | 6.1 gains the anchor `bracket-estimate`: I-77's report, its sets, baseline and method change log. Slice 3 reserves the anchor; I-77 slice 9 fills it.                                                                                                                                                                                   |
| [I-41](i41-store-commander-nights.md#6-declared-and-estimated-brackets)                      | 6.2: drop "A gap of one is shown without a flag" and its 99.5% basis. A one-bracket gap gets a soft prompt, worded as a question, citing Playgroup's measured cost [11] and I-77's per-bracket figure (8.5). Slice 5 freezes the method version and the audit link with the estimate.                                                   |
| [I-48](i48-official-changes-reach-every-deck.md#2-assessing-a-deck-against-a-version)        | 2.1: `assessDeck` returns I-77's `explainBracket` output for floors, terms and reasons, and adds the version. 2.5's method version is I-77's `BRACKET_METHOD_VERSION`. Slice 2 depends on I-77 slice 1.                                                                                                                                 |
| [I-50](i50-play-this-deck-online.md#6-webcam-play-table-view-printable-list-and-deck-check)  | 6.3: the deck check page shows I-77's stored audit. Slice 10 stores the assessment.                                                                                                                                                                                                                                                     |
| [I-52](i52-feedback-loop-players-can-see.md#2-the-bug-report)                                | 2.3 gains a kind, `bracket_rule`, opened from the audit view.                                                                                                                                                                                                                                                                           |
| [I-28](i28-commander-deckbuilding-guide-by-bracket.md#4-from-the-deck-to-the-guide-and-back) | Slice 7's check reads I-77 slice 4's `pathToBracket` for its hard rules.                                                                                                                                                                                                                                                                |

## Overview

Every Commander tool now shows a bracket number. Players argue about those numbers before game night ("Nuh Uh! Manabox Says It's A 3!", 797 points on r/EDH [18]). Wizards says "any estimate is just an estimate" [5].

This initiative makes our estimate something a pod can check. It does not add a score. It shows the existing estimate as a sum: first the floors the official rules set, then the heuristic terms, each with the cards behind it. Each count says whether it is exact, taken from a dated source, or estimated by our own text rules. A fixed line says what the estimate cannot see. A frozen link always shows the same verdict. A public report says how often the estimate matches labelled decks, against the score of always answering the most common label. A published rule decides every change to the scoring tables, and anyone can contest one card's classification.

No model takes part. The estimate stops at Bracket 4; Bracket 5 stays a declaration.

## What the market does

Read on 2026-11-11.

| Product                                   | What a player sees                                                                                                                                                                                                                       | What it publishes about accuracy                                                                                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ScrollVault** [1][2]                    | Bracket = the higher of its floors and a soft score; `?debug=1` prints "the full decision trace"                                                                                                                                         | "77.1% exact and 99.5% within one bracket" on 1,229 organiser-labelled lists. FAQ: always answering Bracket 3 scores 73.9%; averaged per bracket, 73.5% "against 25% for that guess"; Bracket 4 "53.3% exact, 45 decks" |
| **SpellRack** [3]                         | One scorer behind deck pages, the public API and a coming copilot                                                                                                                                                                        | "83.4%", 131 of 157 precons; all 26 misses over-predicted (21 to Bracket 3, 5 to Bracket 4); "not as a general accuracy rate". Labels every precon Bracket 2: "every precon ships at Core (Bracket 2) by definition"    |
| **Nerd Leagues** [8]                      | Land count, curve, price, legality, Game Changers, fast mana and wipes marked exact; ramp, draw, tutors and interaction carry an "estimate" badge; a "How to move down a bracket" panel; unidentified cards "listed rather than dropped" | None. The same list "returns the same URL", but "Improved classifiers update existing links when they're next opened"                                                                                                   |
| **TableCommander** [9]                    | Each reason with "the rule behind it, the threshold that applies, and the actual cards"; about 3,800 Spellbook combos, refreshed weekly; "B4 as the estimator ceiling", Bracket 5 self-declared                                          | None. "guidance for rule zero conversations, not a verdict"                                                                                                                                                             |
| **DeckCheck** [10]                        | An index that "starts from the official rules … and can only move a deck up from there, never down"; "AI grades the twelve benchmarks"                                                                                                   | None                                                                                                                                                                                                                    |
| **Commander Spellbook** [14]              | An `/estimate-bracket` endpoint and a bracket tag per combo (Ruthless, Spicy, Powerful, Oddball, Core, Exhibition, Banned)                                                                                                               | None found                                                                                                                                                                                                              |
| **Playgroup** [11]                        | Outcomes: the declared bracket "explains only about 2-3% of the spread in results"; one bracket above wins "about five percentage points more often"                                                                                     | Win-rate deltas by Game Changer count with 95% intervals, on 447,668 games                                                                                                                                              |
| **Decks of KeyForge** (KeyForge) [12][13] | The score as written arithmetic: base AERC, synergies and antisynergies make SAS (its example: 60 + 5 − 2 = 63); "won't be right about every deck"                                                                                       | No accuracy figure. Rating changes go through public GitHub issues under a rule headed "Do No Harm": "It is more important to prevent falsely overrated decks and cards than to accurately capture all value"           |
| **MTG Arena, unranked Brawl** [16]        | Nothing: a hidden deck weight (cards mostly 0–45, commanders −360 to 1,800), found through an error message in May 2024                                                                                                                  | Kept "under wraps to prevent players from exploiting it"                                                                                                                                                                |

**What the figures mean.** ScrollVault beats a constant guess by about three points on exact matches; its per-bracket average shows a larger margin. "Within one" says little: in a sample of Brackets 2 to 4, Bracket 3 is within one of everything. SpellRack's set has one label, so always answering Bracket 2 would score 157 of 157 (our arithmetic). Its label is also weaker than "by definition" suggests. Wizards wrote on 2025-02-11 that "the average current preconstructed deck is at a Core (Bracket 2) level" [4]. On 2025-10-21 it untied Core from precons, because "some precons … didn't necessarily follow the model" [6]. Planeswalker Party (Commander Masters, 2023) contains Narset, Parter of Veils [2], one of the 53 Game Changers [15]. Bracket 2 excludes Game Changers [7], so a Bracket 2 label contradicts the official rules for that deck. SpellRack attributes "88.9%" to ScrollVault [3]; ScrollVault's own page states 77.1% [1]. We do not reconcile the two.

**The gap.** Each product holds one piece: a trace, badges, a stable link, a reason list, a dated figure, a governed rating table. None freezes a verdict with its method version. None publishes a figure beside its constant-guess baseline per labelled set, with the direction of each error, and changes its tables under a written rule.

## Current state in this codebase

Verified on `dev` at `2cf792e8` on 2026-11-11.

- **The score.** `scoreBracket` (`src/lib/deck/bracket.ts`) averages six terms scored 1–4: ramp with average mana value, draw, removal with wipes counted 1.5 times, tutors read from Oracle text, win speed and average mana value. It rounds, sets 4 for any two-card infinite combo "(RC rule)", raises to 3 for any Game Changer and to 4 above three, and clamps with `as 1 | 2 | 3 | 4`. Mass land denial and extra turns are never checked.
- **Hidden weights.** Average mana value enters three of the six terms (ramp, win speed and its own). Win speed counts every colourless card of mana value 2 or less as a "fast win" once the deck has one win-condition card (line 70).
- **Counts depend on the editor.** `computeDeckStats` (`src/lib/deck/stats.ts`) counts ramp, draw, removal and wipes from `DeckCard.category`. `categorizeCard` (`src/lib/deck/categories.ts`) gives each card one category, the first Oracle-text rule that matches. The owner can drag a card to another category (`updateCardCategory`). Two copies of the same list can therefore score differently.
- **Combos.** `find-my-combos.ts` reads "infinite" from Spellbook effect names and counts a combo as two-card when it uses two named cards, ignoring required templates. That is the error players mock: 262 points for "two card infinites when clearly a third card is needed" [18]. Spellbook's `bracketTag` is dropped. When the lookup fails, the builder passes `[]` (`useBracketScore`) and nothing says the combo floor went unchecked.
- **Game Changers** come from Scryfall's `is:gamechanger`, cached for 24 hours (`src/hooks/useGameChangers.ts`). `detectGameChanger` in `src/lib/deck/validation.ts` is an Oracle-text guess that only its test calls.
- **Where it shows.** The estimate is computed in the browser and shown only in the builder's `BracketIndicator`; it is never stored. `PublicDeckView` and `ShareDeckView` show the declared `targetBracket` as "Bracket N". `HomeDeckCard` shows `manualBracket ?? targetBracket` with the title "Auto bracket", so a declared value is labelled as computed. `getBracketMismatchWarning` compares the target with the unfloored average, which can differ from the number shown.
- **Copy disagrees with itself.** `deck.json` says "→ Bracket 4 (RC rule)", while the wizard's Bracket 3 text says "no two-card combos before turn 6".
- **No accuracy.** `bracket.test.ts` tests thresholds on synthetic stats. No labelled real deck, report or method version exists. `Deck.manualBracket` holds the owner's override ("1-4" in `prisma/schema.prisma`).
- **In flight.** Branch `fix/official-bracket-definitions` (I-28 slice 2, `f1e63b52`, unmerged and with no PR at 2026-11-11 00:20 UTC) adds Bracket 5 and the official restrictions to `BRACKET_DEFINITIONS`. It adds `minimumBracket` over Game Changers and two-card combos only, drops the tutor term, sets the combo floor to 3 with the turn-6 caveat and caps the estimate at 4 (`ESTIMATE_CEILING`). This spec builds on that branch.
- **Owners after the refactor** (`docs/engineering/architecture.md`, not merged): floors and bracket rules in `format-rules/domain`; `explainBracket`, `pathToBracket` and the bench scorers in `deck-analysis/domain`; the stored audit with the I-50 snapshot in `deck-building/infrastructure`; dated combo data from `combos`; challenges in `community`.

## Functional requirements

### 1. Ground rules

1.1 One pure function, `explainBracket`, computes the estimate and its explanation. The builder, the server and every surface in section 11 read it. No model is called anywhere in this initiative ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 The estimate is always labelled "estimated", never "your bracket". Declared and target brackets keep their own labels and are never filled from the estimate.
1.3 The estimate stops at Bracket 4. Bracket 5 is shown only as a declaration, with a line saying that a list cannot show what Wizards describes as decks "meticulously designed to battle in the cEDH metagame" [6].
1.4 Every verdict shows "beta" while Wizards labels the brackets beta [7] ([D-70](../owner-decisions.md#content-and-naming)).
1.5 The same list, rules version, method version and combo data give the same output, whatever the card order.
1.6 The owner's manual override stays beside the estimate and never hides the audit.

### 2. The estimate as a visible sum

2.1 The audit has two blocks. **Official floors** has one row per official restriction: Game Changers, two-card combos, mass land denial and extra turns. Each row shows the rule, its source and date, the count, the cards and the floor it sets.
2.2 **Heuristic part** lists each term with its input count, its thresholds, its score and the cards behind it. It shows the sum as written arithmetic, for example "(3 + 2 + 3 + 2 + 2) ÷ 5 = 2.4 → 2".
2.3 The result line reads "Estimate = the higher of the floor (3) and the heuristic (2) = 3", and names the block that decided.
2.4 An input used by several terms is marked in each of them. Today that is average mana value.
2.5 Each card in a term shows the rule that classified it, or "placed by you" when the owner moved it.
2.6 A list under 60 main-deck cards shows floors only, with "too few cards for the heuristic part". Nerd Leagues uses the same cut [8].
2.7 The audit opens from the bracket badge in one action and works on a phone at 360 px.

### 3. Exact, sourced and estimated

3.1 Every count carries one badge. **Exact** is read from a dated official list or printed card data: Game Changers, banned cards, card count, land count by type line, average mana value. **Sourced** is taken from a named dataset on a date: Spellbook combos, with "found in Commander Spellbook on DATE". **Estimated** is matched by our Oracle-text rules: ramp, draw, removal, wipes, win conditions, the "infinite" and "two-card" readings, mass land denial and extra turns.
3.2 "Placed by you" overrides the badge of a card the owner moved, and the count says how many cards it covers.
3.3 Each badge's tooltip names its source, its date and, for Estimated, the rule ids.
3.4 A test fails when a count has no badge.

### 4. What it cannot see

4.1 A fixed line lists the blind spots: combos Spellbook does not list or that need three or more cards; how early a combo comes up (Bracket 3's turn-6 rule); whether extra turns are chained; thematic exceptions a table agrees; pilot skill, politics and the pod; the cEDH intent that separates Bracket 5.
4.2 Cards no rule classifies are listed by name, never dropped.
4.3 When combo data is unavailable, the floor row says "not checked", the estimate reads "estimate without combo data", and the audit is marked incomplete. It is never shown as complete.

### 5. To reach bracket N

5.1 For a target below the estimate, `pathToBracket(assessment, target)` lists what stands in the way. Floors come first, with their cards: "Bracket 2 allows no Game Changers. This list has 2: Rhystic Study, Smothering Tithe."
5.2 Heuristic terms follow, computed by re-running the function: "The ramp term reads 4 from 14 cards; at 8 or fewer it would read 2."
5.3 The list names no replacement card and uses no verdict word ("illegal", "too strong", "must cut"). A copy test checks English and French. I-28's check (slice 7) and I-76's completion read this function.
5.4 For a target above the estimate, the list says only "no official rule stops this deck at Bracket N".

### 6. The frozen audit

6.1 The owner creates an audit link from the audit view. It is I-50's deck check link (slice 10), whose page gains the audit. The link stores: the canonical list hash (I-29 slice 2), the rules version (I-48), the method version, the Spellbook data date and variant ids, the category placements and the full output of `explainBracket`.
6.2 Opening the link always shows the stored verdict. When the current method or rules version differs, a second line reads "Under the current method vN and the rules of DATE: Bracket M", with the changes listed by I-48's `compareAssessments`.
6.3 Asking again for an unchanged list under the same versions and combo data returns the existing unrevoked link. Any difference creates a new link; the old one keeps its verdict.
6.4 The page is read-only, `noindex`, readable without an account and revocable. It shows no collection, budget, notes or override. It shows the declared bracket only if the owner shared an I-15 sheet, as I-50 6.3 does.
6.5 The link preview names the estimate as "estimated", with its method version and date.

### 7. Labelled sets

7.1 Each set is a versioned file of lists. Each list has its label, label source, label strength, date, source URL and licence. Sets live in the repository and change only by reviewed commit.
7.2 **Precons**, from I-17's catalogue. When the precon holds a Game Changer, the label is the official floor and its strength is **Official**. Otherwise it is **Reference** (Bracket 2, from Wizards' 2025-02-11 sentence, withdrawn on 2025-10-21 [4][6]). The two strengths are reported apart.
7.3 **Owner-reviewed decks.** The owner and at least one other reviewer label each deck independently, from the I-28 guide, before seeing the estimate, with a written reason. Their agreement is published; decks they disagree on stay out of the headline figure. Lists come from the owner's decks or from public decks whose author consented.
7.4 **cEDH lists** from the cEDH Decklist Database's competitive section (I-29 slice 6) [17], labelled 5 by curation. Because the estimate caps at 4, this set reports the share that reaches the ceiling, not accuracy.
7.5 A self-declared bracket is never an accuracy label: Playgroup finds it explains 2–3% of results [11]. Consented I-35 logs (slice 16) report agreement with the declaration and outcomes, never accuracy.
7.6 Another calculator's output is never a label.

### 8. The accuracy report

8.1 Each run records the rules version, the method version and the combo data snapshot. CI replays recorded Spellbook responses without network, as I-70 does.
8.2 Per set and per label strength, the report gives exact matches, balanced accuracy (the mean of per-label recall), a confusion matrix, and the counts estimated above and below the label.
8.3 Beside each figure it gives the constant guess: the set's most common label, scored the same way. "Within one" appears only beside the constant guess's own "within one".
8.4 Each share has an interval and its sample size, by I-21's method once it ships; until then a Wilson interval, and an exact McNemar test on the decks where the estimate and the constant guess disagree. A difference inside the noise reads "not distinguishable at this sample size".
8.5 The audit view shows one line for the estimate's own bracket: "Of N labelled decks this estimator put at Bracket 3, a carried that label, b were lower and c higher (set, date)". Below the [D-68](../owner-decisions.md#content-and-naming) minimum it reads "not enough labelled decks".
8.6 The report is published on I-34's methods page, dated, even when the estimate does not beat the constant guess. It then says so in one sentence (D-94).
8.7 Other calculators appear only through their own published figures, dated and linked, with no ranking (L-51).

### 9. Changing the method

9.1 Thresholds, terms, classifier rules and floor rules are versioned with `BRACKET_METHOD_VERSION`. CI fails when they change without a new version and a committed before-and-after report on every set.
9.2 **Do no harm.** A change is accepted only if, on every set, the count of decks estimated below their label does not rise, and no deck moves from at or above its label to below it. The report names any deck that moves. An under-estimate is the harmful error here: it seats a stronger deck with weaker ones, and a deck one bracket above its table wins about five points more often [11]. An over-estimate costs a conversation. Decks of KeyForge guards against the opposite error, overrating [12]; our estimate exists to protect a table, so the harm runs the other way.
9.3 A change must improve exact matches or balanced accuracy on one set, or fix a named classification error. Minor tweaks are declined, as Decks of KeyForge declines them [12].
9.4 The floors must still match the rules version exactly. A rules change from Wizards is not a method change, and a report never attributes one to the other (I-48 2.5).
9.5 The methods page keeps a change log: version, date, what changed, the before-and-after figures and the challenge that prompted it.

### 10. Contesting a classification

10.1 Each card row and term in the audit has "Contest this". It opens I-52's report with the kind `bracket_rule`, pre-filled with the card, the term, the rule id, the audit link and the method version.
10.2 Signed-out players can contest, as I-52 2.4 allows. The text field is optional.
10.3 Challenges are public: listed on the methods page until I-52's board exists, then on the board. Each gets an answer: accepted with the before-and-after report, or declined with a reason.
10.4 Moving a card in one's own deck stays a per-deck choice ("placed by you"). It changes the rule for everyone only through 9.2.
10.5 No model triages, ranks or answers a challenge.

### 11. One estimate everywhere

11.1 I-15's computed column, I-41's organiser view, I-35's frozen log (slice 5), I-75's estimated-bracket facet (slice 14) and I-29's indexed decks all show the same estimate. Each shows the method version and the audit link.
11.2 The home card stops calling the declared target "Auto bracket" and labels it "Target".
11.3 The mismatch warning compares the target with the estimate shown, not the unfloored average.
11.4 The server computes the same assessment as the browser, so a stored estimate and a shown one never differ.

### 12. Free and paid

12.1 All of it is free and readable without an account where the deck is public. I-30 1.1 already lists "bracket rules and the bracket check" as always free.
12.2 Nothing here is sold, previewed early or ranked by spend. Many products already publish an estimator [1][3][8][9][10], so the estimator is never the product. What it buys is trust in the free surfaces that lead to the paid ones: I-15's pod comparison, I-41's store nights and the I-30 pod pass.

## Data model / API

```text
BracketAssessment (value, pure)  methodVersion, rulesVersionId, comboSource {provider, fetchedAt, variantIds[]} | {unavailable},
                                 floors[] {rule: gameChangers|twoCardCombos|massLandDenial|extraTurns, count, cards[],
                                 floor: 1..4 | null, certainty, ruleRef}, terms[] {key, inputs[] {name, count, certainty},
                                 thresholds[], score, cards[] {oracleId, name, by: rule|owner, ruleId}}, heuristic,
                                 estimate: 1..4, decidedBy: floor|heuristic, unclassified[], blindSpots[], complete
certainty                        exact | sourced | estimated
DeckCheckLink (I-50) +           assessment Json, methodVersion, rulesVersionId, comboFetchedAt, auditKey (hash of the
                                 snapshot's list hash, both versions and the combo date; one unrevoked link per key)
bench/bracket/sets/<set>.vN.json  {id, label, labelSource, labelStrength: official|reference|reviewed|curated, list[], url, licence}
bench/bracket/reports/<method>.json  per set: exact, balanced, confusion, above, below, baseline, intervals, n
```

- `GET /api/decks/[id]/bracket-audit`: owner only; the live assessment, computed on the server.
- I-50's `POST /api/decks/[id]/checks` stores the assessment and returns an existing link for a matching `auditKey`; its `/check/[token]` page renders the audit (`noindex`).
- Slice 15 reuses I-48's `POST /api/rules/check` for pasted lists.

## Non-goals

- A new number: no power score, deck grade or 1–10 scale ([I-31](i31-deck-lab.md)'s non-goal stands).
- Estimating Bracket 5 from a list, or inferring intent or thematic exceptions.
- A model anywhere: estimate, reasons, "to reach" list, challenge triage.
- Hidden weights, paid early access to method changes, or selling the estimator.
- Ranking decks or players by estimate, matchmaking, or filling a declared field.
- Using other calculators' outputs, or lists we have no licence to store, as labels.
- Replacement suggestions in the "to reach" list (I-28 slice 7, I-76).

## Testing strategy

- **Assessment (solitary).** Golden decks give fixed floors, terms, cards and estimate. Card order changes nothing. Every count has a badge. `scoreBracket` equals the projection of `explainBracket` on every existing test.
- **Floors (solitary).** One fixture per official restriction and bracket, read from `BRACKET_DEFINITIONS`. A precon with one Game Changer floors at 3.
- **Blind spots.** With combo data unavailable, the audit is incomplete and the floor row reads "not checked".
- **Audit link (sociable).** The same list, versions and combo data return the same link. After a method bump the old link shows its stored verdict plus the current line. A revoked link answers 410. No private field reaches the page.
- **Bench.** CI replays recorded responses with the network stubbed. Reports are byte-identical on rerun. The gate fails a fixture change that adds an under-estimate. Changing a threshold without a version bump fails.
- **Copy.** The "to reach" strings contain no verdict word in English or French.
- **One function.** An import test fails if a surface computes a bracket without `explainBracket`.

## Delivery slices

| #   | Slice                                                                                                                                                                                                               | Depends on                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 0   | Decisions: D-94 (publish, first sets, naming others), the precon label policy (7.2), the harm direction (9.2)                                                                                                       | — (owner; no code)                                                                         |
| 1   | `explainBracket` with floors, terms, cards, rule ids, owner placements, badges, blind spots and completeness; `scoreBracket` as its projection with unchanged numbers; method version 1; remove `detectGameChanger` | I-28 slice 2                                                                               |
| 2   | Audit view: the sum, floor block, badges, blind spots, "not checked" state, beta label; home card "Target"; mismatch warning on the shown estimate                                                                  | 1                                                                                          |
| 3   | Mass land denial and extra-turn rows in the floor block, Estimated, number unchanged                                                                                                                                | 1                                                                                          |
| 4   | `pathToBracket` and the "To reach bracket N" list, with the copy test                                                                                                                                               | 1                                                                                          |
| 5   | Frozen audit link on I-50's deck check, current-method line, revocation                                                                                                                                             | 2; I-50 slice 10; I-48 slice 1                                                             |
| 6   | Bench harness: set schema, recorded Spellbook responses, offline CI run, report with baseline and intervals                                                                                                         | 1                                                                                          |
| 7   | Precon set under slice 0's label policy                                                                                                                                                                             | 0, 6; I-17 slice 1; I-67 slice 13                                                          |
| 8   | Method-change gate: version check, before-and-after report, do-no-harm check                                                                                                                                        | 6                                                                                          |
| 9   | Publication on the methods page, change log, the per-bracket line in the audit view                                                                                                                                 | 0, 7, 8; I-34 slice 3                                                                      |
| 10  | Method v2: the mass land denial floor through the gate                                                                                                                                                              | 3, 8                                                                                       |
| 11  | "Contest this" with the `bracket_rule` kind; public challenge log                                                                                                                                                   | 2, 8; I-52 slice 3 (slice 9 for the board)                                                 |
| 12  | Owner-reviewed set with blind double review and its agreement figure                                                                                                                                                | 0, 6                                                                                       |
| 13  | cEDH set, reported as the ceiling share                                                                                                                                                                             | 6; I-29 slice 6                                                                            |
| 14  | Surfaces read the audit (section 11), with the one-function test                                                                                                                                                    | 5; I-15 slice 2, I-41 slice 5, I-35 slice 5, I-75 slice 14, I-29 slice 6, each as it lands |
| 15  | Signed-out audit of a pasted list, with an optional frozen link                                                                                                                                                     | 5; I-48 slice 4                                                                            |
| 16  | Outcomes from consented I-35 logs: agreement with the declaration, win share by estimate gap with intervals                                                                                                         | 9; I-35 slice 8; D-68                                                                      |

Slice 1 can start once I-28 slice 2 merges; slices 2 to 4 and 6 follow it, and slice 8 follows slice 6. Slice 1 must land before I-48 slice 2, so that two agents do not edit `bracket.ts` at once. Slices 7 and 9 give the first public figure. The precon set alone has one Reference label for most decks, so the report must show its baseline from day one. Slice 10 is the first method change through the gate, on purpose.

## Open questions

1. **Precon labels.** After Wizards untied Core from precons [6], is a Reference label worth reporting at all, or only Official floors? Recommended: report both, apart; headline the owner-reviewed set once it passes D-68's minimum (D-94).
2. **Owner-reviewed set.** Who reviews, how many decks before publishing, and may consenting authors' public decks join? The consent wording goes to L-12's review.
3. **Publishing and naming.** Publish when the estimate barely beats the constant guess, and quote ScrollVault's and SpellRack's figures by name? Recommended: publish with the baseline and the error direction, and quote others only by their own dated figures after L-51 (D-94).
4. **Combo speed.** May the estimator read Spellbook's `bracketTag` or mana needed to separate early combos (Bracket 4) from late ones (Bracket 3), as TableCommander does with "within five mana, or … Ruthless" [9]? This waits on L-23 and D-25, and goes through the gate.
5. **Thresholds.** Should the heuristic terms move to I-28's measured medians, and should win speed move to I-65's routes (I-65 open question 4)? Each is a method change judged by 9.2.
6. **Harm direction.** Does the owner confirm that under-estimates are the harm (9.2)?
7. **cEDH list licence.** The cEDH Decklist Database shows no licence on its page [17]; storing its lists as fixtures goes to L-25.
8. **Tournament labels.** Is there a licensed source of organiser-labelled lists like ScrollVault's 1,229 [1]?

## Sources

1. ScrollVault, "How the ScrollVault bracket calculator works", 2026-04-07; FAQ cites "engine v389, October 2026"; read 2026-11-11. <https://scrollvault.net/posts/how-scrollvault-bracket-calculator-works.html>
2. ScrollVault, Planeswalker Party (CMM) precon page, "Analyzed … on 2026-11-07"; read 2026-11-11. <https://scrollvault.net/tools/commander-bracket/precons/planeswalkerparty-cmm.html>
3. SpellRack, accuracy page, "Public benchmark · 2026-11-10"; read 2026-11-11. <https://spellrack.com/accuracy>
4. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11. <https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta>
5. Wizards of the Coast, "Commander Brackets Beta Update", 2025-04-22. <https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-april-22-2025>
6. Wizards of the Coast, "Commander Brackets Beta Update", 2025-10-21. <https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025>
7. Wizards of the Coast, Commander format page, undated, read 2026-11-11: Game Changer limits per bracket, "currently in beta". <https://magic.wizards.com/en/formats/commander>
8. Nerd Leagues, Commander bracket calculator, updated 2026-08-10. <https://www.nerdleagues.com/how-it-works/commander-bracket-calculator>
9. TableCommander, "Bracket estimates rebuilt", 2026-06-11. <https://tablecommander.com/blog/bracket-estimates-rebuilt>
10. DeckCheck, introduction, 2026-10-09, updated 2026-10-17. <https://deckcheck.co/blog/intro>
11. Playgroup, Commander power level, updated 2026-11-10. <https://playgroup.gg/commander/power-level>
12. Decks of KeyForge, repository README, "SAS Change request guidelines", last push 2026-10-31. <https://github.com/CorayThan/decks-of-keyforge>
13. Decks of KeyForge, "About SAS and AERC", text read from the site's bundle on 2026-11-11. <https://decksofkeyforge.com/about/sas>
14. Commander Spellbook, API schema (`/estimate-bracket`, `BracketTagEnum`), read 2026-11-11. <https://backend.commanderspellbook.com/schema/>
15. Scryfall, `is:gamechanger` search: 53 cards, read 2026-11-11. <https://api.scryfall.com/cards/search?q=is%3Agamechanger>
16. Draftsim, "MTG Arena Brawl weight", 2024-10-24, updated 2025-10-11. <https://draftsim.com/mtg-arena-brawl-weight/>
17. cEDH Decklist Database, home page, read 2026-11-11. <https://cedh-decklist-database.com/>
18. r/EDH through Arctic Shift, read 2026-11-11: "Nuh Uh! Manabox Says It's A 3!", 797 points, 2025-03-05 <https://www.reddit.com/r/EDH/comments/1j3r30v/>; "Why does EDHrec title some combos as two card infinites when clearly a third card is needed?", 262 points, 2025-11-15 <https://www.reddit.com/r/EDH/comments/1oxuhqy/>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

### Goals

- A pod member opens a frozen audit link and sees why a deck reads Bracket 3: the Game Changer floor with its two cards, the heuristic sum, which counts are exact and which estimated, and what the estimate cannot see; the methods page states how often the estimate matched labelled precons, beside the score of always answering the most common label, in which direction it erred, and which method version produced the figure.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-77-01

As a player told a bracket, I want the floors and the cards that tripped them, so that the number is an explanation I can audit.

#### US-77-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-77-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-77-01 Happy path

Given a signed-in player and the English locale
When official floors are listed apart from heuristic terms.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-77-02 Happy path

Given a signed-in player and the English locale
When each term names the cards.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-77-03 Happy path

Given a signed-in player and the English locale
When a method change does not ship without the benchmark the spec requires.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-77-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-77-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-77-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in on private decks. A public audit stays off until the owner says so. Never paid.

#### AC-77-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-77-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-77-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The audit is a panel on the deck and a link that freezes the explanation. It does not say the deck is fair or unfair.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

`explainBracket` is the one function I-48 and I-15 read. It returns the method version. No model.

### Analytics and telemetry

`bracket_audit_opened {method_version}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in on private decks. A public audit stays off until the owner says so. Never paid.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether to publish a benchmark that barely beats always saying Bracket 3 is D-94.

### Sources

- https://scrollvault.net/posts/how-scrollvault-bracket-calculator-works.html
- https://spellrack.com/accuracy
- https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-77-101

As a player, I want the product to owner decisions: publish even when the estimate barely beats the baseline, which labelled sets come first, and whether other calculators are named (D-94); the precon label policy; and whether under-estimates are the harm the method gate guards against (slice 0)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Owner decisions: publish even when the estimate barely beats the baseline, which labelled sets come first, and whether other calculators are named (D-94); the precon label policy; and whether under-estimates are the harm the method gate guards against (slice 0).

#### AC-77-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-77-102

As a player, I want the product to explainBracket, one pure function every surface reads: the official floors (Game Changers, two-card combos, mass land denial, extra turns) apart from the heuristic terms, each with its cards, rule ids, owner placements, an Exact, Sourced or Estimated badge, the blind spots and a completeness flag; scoreBracket becomes its projection with unchanged numbers, and detectGameChanger is removed (slice 1)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then explainBracket, one pure function every surface reads: the official floors (Game Changers, two-card combos, mass land denial, extra turns) apart from the heuristic terms, each with its cards, rule ids, owner placements, an Exact, Sourced or Estimated badge, the blind spots and a completeness flag; scoreBracket becomes its projection with unchanged numbers, and detectGameChanger is removed (slice 1).

#### AC-77-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-105 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-77-103

As a player, I want the product to the audit view: the sum as written arithmetic, the floor block, badges, blind spots, "not checked" when combo data is missing and the beta label; the home card says "Target", not "Auto bracket"; the mismatch warning compares the target with the estimate shown (slice 2)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The audit view: the sum as written arithmetic, the floor block, badges, blind spots, "not checked" when combo data is missing and the beta label; the home card says "Target", not "Auto bracket"; the mismatch warning compares the target with the estimate shown (slice 2). Mass-land-denial and extra-turn rows, Estimated, with the number unchanged (slice 3).

#### AC-77-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-108 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-77-104

As a player, I want "To reach bracket N" through pathToBracket, floors first, naming no replacement card and using no verdict word, read by I-28 slice 7 and I-76 (slice 4); a frozen audit on I-50's deck check link that always shows its stored verdict, with a line for the current method (slice 5)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then "To reach bracket N" through pathToBracket, floors first, naming no replacement card and using no verdict word, read by I-28 slice 7 and I-76 (slice 4); a frozen audit on I-50's deck check link that always shows its stored verdict, with a line for the current method (slice 5).

#### AC-77-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-111 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-77-105

As a player, I want the product to a bench of labelled sets replayed offline in CI, reporting exact matches, balanced accuracy, a confusion matrix, errors above and below, and the constant-guess baseline with intervals (slice 6); precons first, Official where a Game Changer sets the floor and Reference otherwise, reported apart (slice 7); a method-change gate that refuses a change raising under-estimates (slice 8); publication on I-34's methods page with a change log and the per-bracket line in the audit view (slice 9); method v2, the mass-land-denial floor, as the first change through the gate (slice 10); "Contest this" with I-52's bracket_rule kind and a public challenge log (slice 11); an owner-reviewed set with blind double review (slice 12)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-112 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: A bench of labelled sets replayed offline in CI, reporting exact matches, balanced accuracy, a confusion matrix, errors above and below, and the constant-guess baseline with intervals (slice 6); precons first, Official where a Game Changer sets the floor and Reference otherwise, reported apart (slice 7); a method-change gate that refuses a change raising under-estimates (slice 8); publication on I-34's methods page with a change log and the per-bracket line in the audit view (slice 9); method v2, the mass-land-denial floor, as the first change through the gate (slice 10); "Contest this" with I-52's bracket_rule kind and a public challenge log (slice 11); an owner-reviewed set with blind double review (slice 12).

#### AC-77-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-114 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-77-106

As a player, I want the product to later: the cEDH set, reported as the share that reaches the ceiling (slice 13); every surface reads the audit, with a one-function test (slice 14); a signed-out audit of a pasted list (slice 15); outcomes from consented I-35 logs (slice 16)., so that every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

#### AC-77-115 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later: the cEDH set, reported as the share that reaches the ceiling (slice 13); every surface reads the audit, with a one-function test (slice 14); a signed-out audit of a pasted list (slice 15); outcomes from consented I-35 logs (slice 16).

#### AC-77-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-77-117 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

### UX states for this feature

The player-visible outcome is: every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

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

## I-77: A Bracket Estimate Players Can Audit

**Spec:** [`specs/i77-a-bracket-estimate-players-can-audit.md`](i77-a-bracket-estimate-players-can-audit.md)

**Outcome:** every bracket estimate shows the floor each official rule sets apart from the heuristic average, the terms and the cards behind each, which counts are exact and which estimated, and what it cannot see. It links to a frozen audit of that deck version, states on the methods page how often it matches labelled decks against a constant-guess baseline, per bracket and in which direction it errs, and takes challenges to a scoring rule through a published process.

**Status:** Next
**Priority:** Next for slices 0 to 12, directly after I-48 in the Portfolio View; Later for slices 13 to 16 (the cEDH set, every surface as it lands, signed-out audits and outcomes from logged games). Never paid: it is evidence
**Impact / effort:** High / medium
**Depends on:** the owner for slice 0 (D-94, the precon label policy, the harm direction); I-28 slice 2 for `explainBracket` (slice 1); I-50 slice 10, the deck check link, and I-48 slice 1 for the frozen audit link (slice 5), which therefore waits for that Later I-50 slice unless the owner moves it ahead; I-17 slice 1 and I-67 slice 13 for the precon set (slice 7); I-34 slice 3 for publication (slice 9); I-52 slice 3 for "Contest this" (slice 11); I-29 slice 6 for the cEDH set (slice 13); I-15 slice 2, I-41 slice 5, I-35 slice 5, I-75 slice 14 and I-29 slice 6 as each lands (slice 14); I-48 slice 4 for pasted lists (slice 15); I-35 slice 8 and D-68 for outcomes (slice 16).

`scoreBracket` (`src/lib/deck/bracket.ts`) averages six heuristic terms scored 1 to 4, then raises the result to 4 for any two-card infinite combo ("RC rule"), to 3 for any Game Changer and to 4 above three, and clamps it. The official signals already act as floors, but nothing on screen separates them from the average. Average mana value enters three of the six terms, the counts follow the category the owner drags a card to, a failed combo lookup passes an empty list without saying so, and the estimate is computed in the browser only and never stored; `HomeDeckCard` labels the declared target "Auto bracket" (checked on `dev` at `2cf792e8`). Five initiatives hold a piece and none owns the result: [I-03](i03-trustworthy-deck-feedback.md) the score, [I-48](i48-official-changes-reach-every-deck.md) `assessDeck` and the method version, [I-28](i28-commander-deckbuilding-guide-by-bracket.md) the rules, [I-34](i34-commander-data-reports.md) the methods page, and [I-70](i70-ai-quality-bench-and-model-changes.md) benchmarks only the AI routes. Published figures need their baseline. ScrollVault states 77.1% exact on 1,229 organiser-labelled lists, and its FAQ says that always answering Bracket 3 scores 73.9% ([post](https://scrollvault.net/posts/how-scrollvault-bracket-calculator-works.html), 2026-04-07). SpellRack publishes 83.4% on 157 precons, all 26 misses over-predicted ([accuracy](https://spellrack.com/accuracy), 2026-11-10), on a set with one label, Bracket 2. Wizards wrote on 2025-02-11 that "the average current preconstructed deck is at a Core (Bracket 2) level", and on 2025-10-21 untied Bracket 2 from precons, because "some precons … didn't necessarily follow the model" ([update](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025)). Decks of KeyForge shows its score as an equation and changes it through public issues under "Do No Harm". I-77 judges I-03's output the way I-70 judges I-02's. No model takes part, and Bracket 5 stays a declaration.

### Scope

- [ ] Owner decisions: publish even when the estimate barely beats the baseline, which labelled sets come first, and whether other calculators are named ([D-94](../owner-decisions.md#content-and-naming)); the precon label policy; and whether under-estimates are the harm the method gate guards against (slice 0).
- [ ] `explainBracket`, one pure function every surface reads: the official floors (Game Changers, two-card combos, mass land denial, extra turns) apart from the heuristic terms, each with its cards, rule ids, owner placements, an Exact, Sourced or Estimated badge, the blind spots and a completeness flag; `scoreBracket` becomes its projection with unchanged numbers, and `detectGameChanger` is removed (slice 1).
- [ ] The audit view: the sum as written arithmetic, the floor block, badges, blind spots, "not checked" when combo data is missing and the beta label; the home card says "Target", not "Auto bracket"; the mismatch warning compares the target with the estimate shown (slice 2). Mass-land-denial and extra-turn rows, Estimated, with the number unchanged (slice 3).
- [ ] "To reach bracket N" through `pathToBracket`, floors first, naming no replacement card and using no verdict word, read by I-28 slice 7 and [I-76](i76-complete-this-deck-from-my-collection.md) (slice 4); a frozen audit on I-50's deck check link that always shows its stored verdict, with a line for the current method (slice 5).
- [ ] A bench of labelled sets replayed offline in CI, reporting exact matches, balanced accuracy, a confusion matrix, errors above and below, and the constant-guess baseline with intervals (slice 6); precons first, Official where a Game Changer sets the floor and Reference otherwise, reported apart (slice 7); a method-change gate that refuses a change raising under-estimates (slice 8); publication on I-34's methods page with a change log and the per-bracket line in the audit view (slice 9); method v2, the mass-land-denial floor, as the first change through the gate (slice 10); "Contest this" with I-52's `bracket_rule` kind and a public challenge log (slice 11); an owner-reviewed set with blind double review (slice 12).
- [ ] Later: the cEDH set, reported as the share that reaches the ceiling (slice 13); every surface reads the audit, with a one-function test (slice 14); a signed-out audit of a pasted list (slice 15); outcomes from consented I-35 logs (slice 16).

### Engineering enablers

- Golden decks give fixed floors, terms, cards and estimate; card order changes nothing; every count has a badge; `scoreBracket` equals the projection of `explainBracket` on every existing test.
- CI replays recorded Spellbook responses with the network stubbed, reports are byte-identical on rerun, and a threshold changed without a version bump fails.
- The same list, versions and combo data return the same audit link, a revoked link answers 410, and no private field reaches the page.
- Slice 1 merges before I-48 slice 2, so that two runs do not edit `bracket.ts` at once.

**Paid-tier angle:** none. ScrollVault, SpellRack, Nerd Leagues, TableCommander and DeckCheck all publish an estimator, so the estimator is never the product. What I-77 buys is trust in the free surfaces that lead to paid ones: I-15's pod comparison, I-41's store nights and I-30's pod pass. Nothing is sold, previewed early or ranked by spend.

### Enrichment (2026-11-11)

**User story.** As a player told a bracket, I want the floors and the cards that tripped them, so that the number is an explanation I can audit.

**Acceptance.**
- Official floors are listed apart from heuristic terms.
- Each term names the cards.
- A method change does not ship without the benchmark the spec requires.

**UX.** The audit is a panel on the deck and a link that freezes the explanation. It does not say the deck is fair or unfair.

**Data and API.** `explainBracket` is the one function I-48 and I-15 read. It returns the method version. No model.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `bracket_audit_opened {method_version}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in on private decks. A public audit stays off until the owner says so. Never paid.

**Open questions.** Whether to publish a benchmark that barely beats always saying Bracket 3 is D-94.

### Definition of done

A pod member opens a frozen audit link and sees why a deck reads Bracket 3: the Game Changer floor with its two cards, the heuristic sum, which counts are exact and which estimated, and what the estimate cannot see; the methods page states how often the estimate matched labelled precons, beside the score of always answering the most common label, in which direction it erred, and which method version produced the figure.

---

