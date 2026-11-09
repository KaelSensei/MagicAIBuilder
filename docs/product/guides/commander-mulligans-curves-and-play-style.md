# Opening Hands, Mana Curves and Play Style in Multiplayer Commander

> **Initiative:** [I-28](../roadmap.md) · **Companion of:** [Building a Commander Deck, Bracket by Bracket](commander-deckbuilding-by-bracket.md) · **Specs:** [I-28 guide](../specs/i28-commander-deckbuilding-guide-by-bracket.md), [I-21 probability bench](../specs/i21-reproducible-probability-bench.md)
>
> **Researched:** 2026-11-09
>
> **Rules state:** Comprehensive Rules effective 2026-11-06 (rules 103.5, 103.5c, 800.6, 800.7, 903.12g); bracket text of 2025-10-21.
>
> **Review:** re-check after every Comprehensive Rules update that touches rule 103.5 or 800.6, after every bracket announcement, and whenever the model in [`scripts/research/commander-opening-hands`](../../../scripts/research/commander-opening-hands/README.md) changes. Refresh the curve and trend tables once a year.

The main guide says what a deck for each bracket should contain. This companion covers what decides whether that deck works once the cards are shuffled: which opening hands to keep, how the free multiplayer mulligan changes that decision, what mana curves real decks use, and how the play style of the deck and of the table changes both. The main guide treats the free mulligan in a few lines ([The free mulligan](commander-deckbuilding-by-bracket.md#the-free-mulligan)); here it is the centre.

Three kinds of evidence meet here. The rules and their history fix what a player may do. Game logs and decklist datasets show what players actually do. This document's own model computes, for eight archetypal deck shells, which hands are worth keeping when the first mulligan is free. No published Commander analysis had solved that last question; the model solves it over coarse hand classes and states its limits.

## How to read this document

Every claim carries one of four evidence labels, in bold, at the start of the sentence or table column it governs. The first three are the main guide's labels; **Computed** is new.

| Label         | Means                                                                                                                 | Always carries                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Official**  | Wizards of the Coast (WotC) text, the Comprehensive Rules, or a Rules Committee (RC) decision while it ran the format | The source, quoted where the wording matters                                                                                    |
| **Data**      | A number someone measured, including figures this research computed from a third-party dataset                        | Who measured it, the sample size and the date                                                                                   |
| **Community** | The opinion of a named writer, creator, deck author or forum                                                          | One qualifier: _consensus_ (several independent sources agree), _contested_, or _single source_                                 |
| **Computed**  | This document's own opening-hand model [73], or an exact probability calculated for it [74]                           | The deck profile, the development horizon (the turn through which mana spent is counted) and the sample size, where they matter |

**Recommended** marks this document's synthesis, used in the [checklist](#a-mulligan-checklist-per-bracket). Each item names the evidence it rests on, so it can be re-derived when the evidence moves.

Shorthands used throughout:

- **B1–B5**: the official brackets 1 Exhibition, 2 Core, 3 Upgraded, 4 Optimized, 5 cEDH.
- **Cheap ramp**: a mana source costing 2 or less (Sol Ring, Arcane Signet, a one-mana creature, Rampant Growth, a Mox). Cultivate-style three-mana ramp does not count.
- **First seven**: the first hand drawn. **Free seven**: the hand drawn after the free mulligan. **Six**: the hand after the second mulligan, which bottoms one card.
- **Margin**: how much better keeping a hand is than mulliganing it, in percent of the value of mulliganing. Positive means keep.
- **Shell**: one of the model's eight archetypal deck profiles. It is not a real decklist.

**Research limits.** Read these before trusting any single number:

- **The model is a goldfish.** It has no opponents, no colours and no card roles beyond mana; its limits are listed under [Limits](#limits).
- **Moxfield refused the research tools (HTTP 403)**, so no Moxfield primer was read. Most cEDH and Bracket 4 primers live there. Opening-hand guidance comes from about 60 Archidekt primers found by archetype keyword and sorted by views (the API rate-limited the research; this is not a census), the cEDH Decklist Database, and articles.
- **Reddit, MTGGoldfish and several other pages refused or were blocked.** A claim seen only in a search-engine summary is marked _snippet_.
- **Podcast quotes come from local automatic transcriptions**, as in the main guide. They are close paraphrases that may carry recognition errors.
- **Playgroup.gg is the only large source of real mulligan data.** It mixes self-reported paper games with its online client, and none of its mulligan figures is split by bracket.
- **Curves are EDHREC aggregates** for the 100 most popular commanders, with brackets declared by deck owners. They are averages, not decklists.

## Ten findings

1. **The free mulligan is worth almost as much as the whole one-on-one mulligan system, and it requires a pickier first seven.** **Computed** (eight shells, horizons of turn 4 to turn 8, 150,000–250,000 simulated hands per hand size): played well, it adds 0.54–0.98 mana spent by the horizon (+2.4% to +3.9%) and supplies 33–49% of everything mulligans are worth. The optimal player keeps the first seven only 32–51% of the time and treats the free seven as a real second draw; judging the first seven as leniently as the second throws away 1–25% of the total gain.
2. **Cheap ramp, not land count alone, decides keeps.** **Computed**: a first seven with 2 lands and no cheap ramp is a mulligan in every shell (2.8% to 20.9% below the value of mulliganing), while 1 land with two cheap ramp pieces is a keep in every shell (+1.5% to +9.3%), and 2 lands with one cheap ramp piece is a keep everywhere except cEDH. Rules that count only lands ("keep 2–5 lands", "3–5 lands on the first seven") capture less than half of the free mulligan's value.
3. **The right keep rule depends on the deck and on game speed.** A hand is judged against a fresh seven of the same deck. **Computed**: 3 lands with no cheap ramp is a coin flip on the first seven in the B1 and B2 shells (+0.2%, −0.9%) but a clear mulligan in B4 (−8.3%) and cEDH (−17.0%), whose decks find ramp often and whose games are short. In one-on-one play the optimal keep rate climbs from about 40% when only the first 3–4 turns matter to 84% when the first 9–10 matter.
4. **Play style sets what the hand must contain, and the model cannot see it.** **Community** (_consensus_ across about 25 primers and guides): voltron hands need ramp to the commander and protection, aristocrats a sac outlet and fodder, spellslingers card draw before payoffs, cEDH hands a named reason to keep. The model counts only mana; the primers name the roles. A hand has to pass both tests.
5. **Real players are less picky than the optimum.** **Data** (Playgroup.gg, 1,608,359 games and 189,535 kept hands): 64% keep the first seven, against 32–51% for the optimal rule, and two-land hands make up 27% of kept hands against 29.7% of sevens dealt from a 36-land deck: players keep them about as often as they are dealt.
6. **The free mulligan costs nothing measurable; the second one does.** **Data** (Playgroup.gg): the last seat of a four-player pod wins 21.5% keeping seven, 22.4% after one mulligan and 19.1% after two (257,261 games). Across all seats in September 2026: 22.9%, 23.6% and 22.3% (40,897 games).
7. **Mulligans flatten the land-count curve, and the curve sets the plateau.** **Computed**: in the B2 shell, going from 32 to 40 lands adds 0.77 mana spent by turn 8 (2%) with multiplayer mulligans, against 2.45 (7%) with none. The B2 shell with 32 lands and the free mulligan (36.11) out-develops the same shell with 40 lands in one-on-one play (36.00). Plateaus run from 24–30 lands for cEDH to 40–42 for big mana.
8. **Brackets 1–4 share one curve shape; Bracket 5 differs.** **Data** (EDHREC averages for the top 100 commanders, about 636,000 bracket-tagged decks): B1–B4 peak at mana value 2 (about 17 cards) with mana value 3 close behind (about 16), and hold 40–46% of nonland cards at mana value 2 or less. B5 peaks at mana value 1, with 60–65% at 2 or less and 27–30 lands. Inside B1–B4 the commander and the archetype move the curve more than the bracket does.
9. **The casual skeleton is stable, the cards got cheaper, and cEDH draws more.** **Data**: casual decks have run about 36 lands since 2019 and an average mana value of 3.1–3.2 since 2022, and casual games lasted 8.6–8.9 rounds through 2026. But three-mana land ramp is giving way to one- and two-mana ramp (Cultivate in 48.8% → 41.5% of decks, Birds of Paradise 25.4% → 28.3%). In cEDH the share of player-games recorded as draws rose from 11.5% (first half of 2023) to 25–27% (2025–2026), and top decks lost about 1.5 fast-mana pieces after the September 2024 bans.
10. **MagicAIBuilder's playtest engine captures only 37–47% of the value of correct multiplayer mulligans.** **Computed**: it has no free mulligan and deals `7 − N` random cards instead of letting the player choose what to bottom, and its land-light and land-heavy hints are wrong in both directions for the first seven ([Implications](#implications-for-magicaibuilder)).

## The rules

### The free mulligan and the London mulligan

**Official** (Comprehensive Rules effective 2026-11-06) [1]:

- **103.5** sets the procedure: "First, the starting player declares whether they will take a mulligan. Then each other player in turn order does the same. Once each player has made a declaration, all players who decided to take mulligans do so at the same time." The player who keeps "puts a number of those cards equal to the number of times that player has taken a mulligan on the bottom of their library in any order", and may continue "until their opening hand would be zero cards". This is the London mulligan: always draw seven, then bottom one card per mulligan.
- **103.5c**: "In a multiplayer game and in any Brawl game, the first mulligan a player takes doesn't count toward the number of cards that player will put on the bottom of their library or the number of mulligans that player may take." Rule 800.6 repeats it for multiplayer games and 903.12g for Brawl.
- **800.7**: "In a multiplayer game other than a Two-Headed Giant game, the starting player doesn't skip the draw step of their first turn." Only the starting player of a two-player game skips it.

What follows from the text:

- Hands go 7, 7, 6, 5 and so on. Because the free mulligan does not count, a multiplayer player may take up to eight mulligans.
- Declarations are public and in turn order, so later seats know who has mulliganed before they decide.
- A one-on-one Commander game that is not Brawl has **no** free mulligan. Duel Commander has followed the general rules since 2019 and so has none [11]. The RC nonetheless advised in 2016 that one-on-one games "should still use the free multiplayer mulligan" [10].
- The Commander section of the rules (903) holds no Commander-specific mulligan rule. The Wizards Commander page and the eight bracket and panel announcements from 2024-09-23 to 2026-02-09 never mention mulligans [4].

**Community** (_single source_): EDHREC's 2026 mulligan guide cites the free mulligan as "rule 103.5e" [37]. It is 103.5c; there is no 103.5e.

### History

The free mulligan was not invented for Commander. It came from the general multiplayer rules in 2007, and Commander dropped its own mulligan rule in 2016 to keep only that one concession.

| Date                 | Change                                                                                                                                                           | Label and source                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1994                 | First DCI rule: a player with zero or seven lands could reveal the hand and draw a new seven, once per game. It is the ancestor of the "0 or 7 lands" house rule | **Community** (wiki history) [61]                        |
| 1997                 | Paris mulligan: redraw one card fewer each time                                                                                                                  | **Community** (wiki history) [61]                        |
| By October 2006      | Two-Headed Giant: "The first time a player takes a mulligan, he or she draws a new hand of seven cards"                                                          | **Official** [5]                                         |
| July 2007            | Tenth Edition rules (101.4a): the free first mulligan extends to every multiplayer game                                                                          | **Official** [6]                                         |
| Before February 2011 | The EDH variant has its own "Partial Paris" rule: exile any number of cards, draw one fewer, shuffle the exiled cards back once you keep                         | **Official** [7]                                         |
| September 2015       | Vancouver scry added to the general rule                                                                                                                         | **Official** [8]                                         |
| January 2016         | The RC deletes Partial Paris; Commander uses the standard Vancouver mulligan "with the standard first-one-free in multiplayer"                                   | **Official** [9][10]                                     |
| June–July 2019       | London mulligan, effective for tabletop from 2019-07-05. The RC adopts it "with the standard first-mulligan-is-free for games with more than two players"        | **Official** [3]; RC statement quoted in [38]            |
| June 2019            | Duel Commander (one-on-one) moves to the general rules, so it has no free mulligan                                                                               | **Official** for Duel Commander [11]                     |
| By July 2022         | Brawl gets the free mulligan even one-on-one ("and in any Brawl game")                                                                                           | **Official** as quoted in [21]; today's rule 903.12g [1] |

**Official** (the RC's January 2016 decision, explained by member Sheldon Menery) [10]: "the goal of mulligans in Commander is to ensure that you start the game with enough lands to be a participant." The RC "ran computer simulations" (no sample size given): with 37 lands, Partial Paris reached a fourth land on turn 4 in 89% of games against 86% for the multiplayer Vancouver rule, "but it came at a cost of about a fifth of a card on average", and "Nothing provided a clear enough upgrade to justify having additional rules". Without the free mulligan, one-on-one success fell to "about 80%". The 2019 London announcement aimed to make games after a mulligan "more competitive" and to reduce "non-games"; it does not mention multiplayer, Commander or the free mulligan [3].

Gaps: no Wizards rationale for the 2007 rule was found, and the rules version that added Brawl (between 2018 and 2022) is unconfirmed.

### House rules and table practice

**Community.** House rules have existed since at least 2015. No poll or dataset measures how common any of them is.

| House rule               | How it works                                                                                                                                                                                    | Sources      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Gis mulligan             | Set the hand aside and draw seven until the hand is playable; set-aside cards are shuffled back. The RC used and recommended it in 2016 but said it is "not something that can go in the rules" | [10][44][64] |
| Three-land Gis           | Draw seven until the hand has at least three lands; "you have to keep a 3-lander"                                                                                                               | [10]         |
| Gis in exile             | Set-aside cards stay exiled, which hurts graveyard and combo decks                                                                                                                              | [44]         |
| "0, 1, 6, 7"             | Reveal a hand with 0, 1, 6 or 7 lands and draw a new seven                                                                                                                                      | [44]         |
| Draw 10, keep 7          | "Gabriel Special Surprise" shuffles 3 back; the "Houston mulligan" bottoms 3. Decks that use the library bottom must shuffle                                                                    | [61]         |
| Partial Paris holdover   | Now rare; it "can favor combo decks"                                                                                                                                                            | [39][64]     |
| "Two free", or unlimited | Agreed at the table before the game                                                                                                                                                             | [41][64][69] |

What creators report about tables:

- **Community** (The Command Zone #745, 2026): "It's so casual that a lot of play groups don't even play with Mulligan rules. They'll let you Mulligan as many times as you want to get a playable hand." [69]
- **Community** (_consensus_ among creators, not measured; The Command Zone #731, 2026): "a lot of bracket three tables will let you take infinite hands… four and five tend to really follow the london Mulligan. So the more powerful your decks are the more strict or at least accurate your mulligan needs" [68]. The same split appears in #504 (2022) [64].
- **Community** (_single source_, #504): after lenient mulligans, players "self sabotage their super explosive hand", for example by bottoming a Sol Ring: "they've given you flexibility… and you're giving flexibility back" [64].
- **Community** (_single source_, Cas Hinds, 2025): "I'm not letting someone craft their perfect hand, but I want them to have a playable seven." Strict rules expose deck problems such as too few early plays or too many lands [42].

**Lenient mulligans are a hidden deckbuilding input.** **Community** (_consensus_): independent sources tie generous mulligans to low land counts: 31–32 lands in the Partial Paris era [64], 32–33 in Mike Carrozza's old group [41], and "Running low land counts but expecting infinite free mulligans" [43]. The Command Zone keeps its template at 38 lands, "not quite that extreme" compared with Frank Karsten's figure, "because we do have a free mulligan and commander is like pretty casual" [65]. **Everything this document computes assumes the official rule.** A deck that only works with free redraws is weaker than it looks at a table that plays by the book.

Events: cEDH tournaments run under Competitive rules enforcement, which include the free multiplayer mulligan (one event page, _snippet_); a December 2025 Competitive Brawl event reportedly ran without it (_snippet_, unverified) [63]. No written mulligan policy was found for MagicCon or CommandFest Commander pods, and no French source on local practice.

## How players actually mulligan

**Data** (Playgroup.gg, "How Many Lands", updated 2026-11-08) [12]: across 1,608,359 tracked games, 64% of players kept the first seven, 24% took one mulligan, 9% two and 3% three or more. The table compares the lands in 189,535 kept Playgroup Live hands with the lands in a seven dealt from a 36-land deck (**Computed**, hypergeometric [74]):

| Lands in hand                                  | 0    | 1     | 2      | 3      | 4      | 5     | 6     |
| ---------------------------------------------- | ---- | ----- | ------ | ------ | ------ | ----- | ----- |
| Share of kept hands (**Data**)                 | 0%   | 5%    | 27%    | 41%    | 21%    | 5%    | 1%    |
| Share of dealt sevens, 36 lands (**Computed**) | 3.7% | 16.4% | 29.7%  | 28.6%  | 15.7%  | 4.9%  | 0.8%  |
| Win rate in 4–6-player pods (**Data**)         | 17%  | 25%   | 28%    | 28%    | 29%    | 28%   | 25%   |
| Kept hands behind that win rate                | 502  | 8,903 | 51,815 | 76,790 | 40,414 | 9,730 | 1,177 |

Seven-land hands were 0% of kept hands and won 25% of the time over 204 hands. The average kept hand held 2.96 lands.

Reading:

- Players ship most one-landers (kept about a third as often as dealt) but keep two-landers at about the rate they are dealt. **Computed**: the optimal first-seven rule ships every two-lander without cheap ramp ([By bracket](#by-bracket)). The largest gap between practice and the optimum is in two- and three-land sevens with nothing cheap to cast.
- Win rate is flat from 2 to 5 lands. Playgroup calls it "directional, not a verdict", and the kept hands were already filtered by the players' own mulligans, so the flat line does not show that two-landers are safe keeps. **Community** (Playgroup's own advice): "below 40 lands, a two-land keep is usually a mulligan" [12].
- Kept hands include hands kept after a mulligan, and land counts vary by deck, so the comparison with one 36-land deck is indicative.

**Data** on what a mulligan costs:

| Source                                                                                | Sample        | Kept seven | One mulligan | Two    | Three or more |
| ------------------------------------------------------------------------------------- | ------------- | ---------- | ------------ | ------ | ------------- |
| Playgroup.gg monthly report, September 2026; win rate normalised to four players [17] | 40,897 games  | 22.9%      | 23.6%        | 22.3%  | 19.3%         |
| Playgroup.gg, last seat of four-player pods [13][14]                                  | 257,261 games | 21.53%     | 22.37%       | 19.07% | —             |

Playgroup's own reading [13]: "The first London mulligan is free, and slightly better than free: you looked at a bad hand, dug for a better one, and put your worst card on the bottom. The second one costs about 3.3 points." Its rule of thumb, "One card in your opening hand is worth roughly 3 percentage points of win rate", comes with its own caveat: it "comes from mulligan data, and players choose when to mulligan." Selection bias runs through all of these figures: players who mulligan held bad sevens, so "one free mulligan is as good as keeping" means the redraw repairs a bad hand on average, not that every hand is as good as a mulliganed one. A starting player who mulligans still wins about 30% of four-player games [15].

**Data** (Playgroup.gg, Playgroup Live games through 2026-09-07) [16]: "Nearly half of all turn-1 Sol Rings, 47.9%, are found after a mulligan." In duels, a Sol Ring in the first seven won 64.9% against 59.0% for one found after a mulligan; "In three and four-player games that difference is inside the noise."

**Other simulations all use fixed land rules.** The RC in 2016 [10], Frank Karsten in 2022 [21], teryror (2020, updated 2026) [23] and ScrollVault (2026, 3.75 million games; it claims the free mulligan "improves hand quality by 1–3%") [24] simulate the free mulligan with keep rules based on land count. None optimises the rule and none measures human decisions. The only published two-tier rule is Karsten's [21]:

> "The first seven-card hand is kept if it has three, four or five lands and no more than five combined lands and Signets. Any hand with [Sol Ring] and one, two, three, four or five lands is kept as well. All other hands are mulliganed." "The second seven-card hand is kept under the same conditions, with one difference: two-land hands are now kept as well."

He adds: "This mulligan policy was manually defined by me based on what seemed most reasonable and realistic. It need not be optimal." **Community** (expert, cEDH): Matt Sperling states the same two-tier idea in words: a hand may be a mulligan "on the first 7, but … probably a keep still on 2nd 7" [36].

**Computed** [74]: at 38 lands, a first seven holds 3 or more lands 54.8% of the time, the figure The Command Zone quotes [65]. Two independent looks give 1 − 0.452² ≈ 0.80, more than the "closer to say 75%" said on air.

## The model

### What it simulates

**The idea, without statistics.** A mulligan decision is a stopping problem: you are shown a hand and either stop (keep it) or continue (draw a new one, which after the free mulligan costs a card). The best rule keeps a hand whenever it is worth at least as much as continuing would be worth on average, assuming you also decide well on every later hand. That is solved backwards, which is why it is called backward induction. The smallest hand the model deals (four cards) is always kept, which fixes the average value of going to four. That shows which five-card hands beat going to four, which fixes the value of going to five, and so on up to the free seven and finally the first seven. Because the first mulligan is free, the alternative to a first seven is a whole fresh seven with its own fallbacks, not a six. That is why the first seven deserves a higher bar. "Optimal stopping" is the general name for this kind of rule.

Frank Karsten, 2022: "Optimizing a mulligan policy for every possible deck can be done via stochastic dynamic programming … outside the computational scope of this work" [21]. As far as this research found, no published Commander analysis has done it. This model does, over coarse hand classes, for archetypal shells, against a goldfish.

**Computed** [73]. How it works:

- **Deck.** 99 cards plus the commander in the command zone, always available and cast as soon as affordable. Card kinds: untapped land; tapped land; mana rock, usable the turn it lands (Sol Ring makes 2 for 1, Moxen 1 for 0, Signets net 1 for 2); mana creature, usable the next turn; land ramp (Rampant Growth fetches a tapped land, Nature's Lore an untapped one, Cultivate a tapped one plus one to hand; fetched lands leave the library); burst draw; draw engine (one extra card per later draw step); and plan spells by mana value.
- **Rules.** London mulligan. In multiplayer the first mulligan is free, so hands go 7, free 7, 6, 5, 4. One-on-one Commander without rule 103.5c goes 7, 6, 5, 4. The starting player draws on turn 1.
- **What to bottom.** Going to six, keep 3 of the 7 lands (2 or 3 going to five, depending on cheap ramp), untapped lands first. Keep nonland cards in this order: mana-positive rocks, ramp costing 2 or less, key cards, draw costing 3 or less, other ramp, then the cheapest spells. Bottomed cards are never drawn within ten turns.
- **Play.** Each turn: draw, play a land (a tapped one when the extra mana would go unused), cast mana-positive rocks, cast the commander when affordable, cast other ramp cheapest first, then cast the set of remaining spells that spends the most mana. Draw effects resolve first and the turn is re-planned. No opponents, no interaction, no colours.
- **Value of a game.** Total mana spent through a horizon turn H, counting the commander: Karsten's goldfish metric [21]. H is set per bracket from measured game length: B1 8, B2 8, B3 7, B4 6, B5 4. In the only per-bracket game log, first knockouts come around turns 9, 8.5, 8 and 7.7 in B1–B4 [20]; cEDH is described as "a five-turn format on average (with a standard deviation of two turns)" [48], with games that "end by turn five" [65].
- **Hand classes.** Lands (L); ramp costing 2 or less (R: 0, 1, 2+); other plays costing 3 or less (E: 0–3+). For each hand size, 150,000–250,000 simulated kept hands give the mean value of each class. Backward induction then gives the exact optimal keep rule restricted to these features. Heuristic rules are scored the same way.
- **Reproducibility.** Every random draw comes from a seeded mulberry32 generator, so rerunning the scripts with the same sample size reproduces every table here [73].

The eight shells. **Computed**; the five bracket shells are tuned to the 2026 per-bracket medians [25][26]; the three Bracket 3 variants are archetypal shells, not medians. None is a real decklist.

| Profile                                             | Lands | Ramp (of which ≤2 MV) | Draw | Avg MV, nonland | Curve, MV 0/1/2/3/4/5/6/7+ | Commander MV | Horizon |
| --------------------------------------------------- | ----- | --------------------- | ---- | --------------- | -------------------------- | ------------ | ------- |
| B1 Exhibition: theme-first                          | 37    | 10 (6)                | 8    | 3.21            | 0/5/16/17/15/5/2/2         | 5            | T8      |
| B2 Core: midrange                                   | 36    | 13 (9)                | 10   | 3.16            | 0/6/17/17/12/7/3/1         | 4            | T8      |
| B3 Upgraded: midrange                               | 36    | 13 (11)               | 10   | 3.13            | 0/8/18/14/12/5/4/2         | 4            | T7      |
| B3 aggro / voltron: low curve, commander cast early | 33    | 10 (10)               | 9    | 2.73            | 0/11/24/14/10/4/2/1        | 3            | T7      |
| B3 big mana / battlecruiser                         | 38    | 16 (11)               | 10   | 3.64            | 0/5/12/14/11/10/6/3        | 6            | T7      |
| B3 spellslinger: cantrips and rocks                 | 35    | 10 (8)                | 16   | 2.56            | 0/15/21/15/7/3/2/1         | 4            | T7      |
| B4 Optimized: efficient midrange                    | 34    | 15 (14)               | 10   | 2.85            | 2/11/19/13/10/5/3/2        | 3            | T6      |
| B5 cEDH: fast mana                                  | 28    | 21 (21)               | 9    | 2.00            | 8/21/20/13/5/2/2/0         | 2            | T4      |

### Validation

- **Computed**: a 36-land deck with no ramp that keeps every seven has at least 3 lands on the battlefield at the end of turn 3 in 0.7795 of games (exact hypergeometric: 0.780), at least 4 by turn 4 in 0.6202 (0.621), and 2–4 lands in the seven in 0.7411 (0.740).
- The shells match the measured decks. **Computed** against **Data** (EDHREC, top 100 commanders, per bracket) [27]:

| Bracket | Measured curve, MV 0/1/2/3/4/5/6/7+ | Measured lands / avg MV | Shell curve         | Shell lands / avg MV |
| ------- | ----------------------------------- | ----------------------- | ------------------- | -------------------- |
| B1      | 0.4/8.1/17.9/16.1/8.8/5.5/2.6/3.1   | 36.4 / 3.12             | 0/5/16/17/15/5/2/2  | 37 / 3.21            |
| B2      | 0.3/7.5/18.3/16.0/9.2/5.6/2.8/3.5   | 35.9 / 3.19             | 0/6/17/17/12/7/3/1  | 36 / 3.16            |
| B3      | 0.4/8.7/17.9/15.8/9.1/5.2/2.6/3.8   | 35.4 / 3.16             | 0/8/18/14/12/5/4/2  | 36 / 3.13            |
| B4      | 0.9/11.1/18.0/15.9/8.5/4.5/2.3/3.4  | 34.4 / 2.99             | 2/11/19/13/10/5/3/2 | 34 / 2.85            |
| B5      | 5.0/20.2/18.0/14.2/6.4/2.6/0.9/1.7  | 29.9 / 2.27             | 8/21/20/13/5/2/2/0  | 28 / 2.00            |

The shells match lands and average mana value within about 0.1–0.3 and peak at the same mana value. They carry a few more 4-drops and fewer 7+ drops than measured decks in B1–B3, and the cEDH shell is slightly cheaper than measured. These differences move absolute values a little, not the comparisons between mulligan systems. The "measured" curve here is the mana-value distribution of EDHREC's synthesized average-deck lists; the curves in [Mana curves](#the-shape-by-bracket) use EDHREC's own curve panel, which differs by up to about one card per slot (see [Open questions](#open-questions-and-research-limits)).

- The land plateaus agree with Karsten's independent regression ([Land count](#land-count-once-mulligans-are-played-well)).

### Limits

The model answers one question well: does this hand develop mana as fast as a fresh hand of the same deck would? It does not answer the others.

- **Goldfish.** No opponents, interaction, board wipes or politics. Card advantage beyond using mana is undervalued, so the optimal rules lean strict, and real keep rates (64% of first sevens) should be higher than the model's.
- **Value is mana spent.** Every mana counts the same; a hand of expensive cards can score like a hand of efficient ones. Specific cards (combo pieces, protection, sac outlets) are invisible except through a cEDH "key card" count. This is why play-style requirements have to be layered on top ([Play style](#play-style)).
- **No colours.** Colour screw is not modelled; use Karsten's source counts in the [main guide](commander-deckbuilding-by-bracket.md#land-count-karstens-math).
- **Coarse classes.** Hands are classed by lands, cheap ramp and early plays; quality inside a class is averaged.
- **Shells, not decklists.** Absolute numbers matter less than the differences between systems, rules and shells.
- **The bottom rule is a fixed heuristic**, not optimised.
- **The horizon is a choice.** It rests on one creator's game log for B1–B4 and on creators' descriptions for cEDH. [Horizon sensitivity](#the-first-seven-versus-the-free-seven) is reported.
- **No seat, no table, no house rules.** The commander is never removed and pays no tax. The model stops at four cards, so it never takes the deep cEDH mulligans some players accept.
- **"App today" is a model of the app's engine** (no free mulligan, random `7 − N` cards), not a run of the engine itself.

## What the free mulligan is worth

**Computed** [73]: mana spent by the horizon turn, eight shells, best keep rule for each system. "App today" models MagicAIBuilder's playtest engine as of 2026-11-09: no free mulligan, and the hand after a mulligan is `7 − N` random cards with no bottom choice. "Same rule on both sevens" takes the free mulligan but judges the first seven as leniently as the second.

| Profile         | No mulligan | App today | 1v1 London | Multiplayer, same rule on both sevens | Multiplayer, optimal | Free mulligan gain over 1v1 | Gain lost by judging both sevens alike | Share of the gain the app captures |
| --------------- | ----------- | --------- | ---------- | ------------------------------------- | -------------------- | --------------------------- | -------------------------------------- | ---------------------------------- |
| B1              | 33.12       | 34.06     | 34.27      | 34.73                                 | 35.17                | +0.90 (+2.6%)               | 22%                                    | 46%                                |
| B2              | 34.62       | 35.50     | 35.72      | 36.36                                 | 36.69                | +0.98 (+2.7%)               | 16%                                    | 43%                                |
| B3 midrange     | 28.50       | 29.28     | 29.69      | 30.36                                 | 30.58                | +0.88 (+3.0%)               | 10%                                    | 37%                                |
| B3 aggro        | 25.36       | 26.18     | 26.38      | 26.84                                 | 27.12                | +0.75 (+2.8%)               | 16%                                    | 47%                                |
| B3 big mana     | 30.16       | 31.25     | 32.13      | 33.03                                 | 33.10                | +0.97 (+3.0%)               | 2%                                     | 37%                                |
| B3 spellslinger | 28.26       | 28.83     | 28.98      | 29.31                                 | 29.67                | +0.69 (+2.4%)               | 25%                                    | 41%                                |
| B4              | 22.16       | 22.90     | 23.23      | 24.00                                 | 24.01                | +0.78 (+3.4%)               | 1%                                     | 40%                                |
| B5              | 13.09       | 13.58     | 13.76      | 14.23                                 | 14.30                | +0.54 (+3.9%)               | 6%                                     | 41%                                |

Reading:

- Mulligans played well add 1.2–2.9 mana spent by the horizon over never mulliganing, about 5–10%.
- The free mulligan alone supplies 33% (big mana) to 49% (spellslinger) of that gain. In most shells it is worth nearly as much as the whole one-on-one London system; for big mana, whose one-on-one mulligans are already worth 1.97, it is worth about half as much.
- Judging the first seven as leniently as the second wastes up to a quarter of the gain. The loss is small for B4, big mana and cEDH, whose optimal rule is already strict without the free mulligan.
- The app's engine captures 37–47% of the value of correct multiplayer mulligans. Its random `7 − N` hand costs most in fast games: in the B3 shell at a turn-3 horizon, 6.6 mana spent against 7.1 with London (−7%).

What correct mulligans buy in play. **Computed**; each cell is multiplayer optimal / app today / no mulligan, in percent of games:

| Profile         | ≥4 lands in play end of T4 | ≤2 lands end of T4 (two+ missed drops) | ≥4 mana sources end of T3 | Commander cast by its MV + 1 | ≥4 mana sources end of T2 | Key card in kept hand |
| --------------- | -------------------------- | -------------------------------------- | ------------------------- | ---------------------------- | ------------------------- | --------------------- |
| B1              | 85 / 82 / 76               | 4 / 6 / 11                             | 70 / 61 / 57              | 95 / 92 / 88                 | 12 / 9 / 9                | —                     |
| B2              | 81 / 79 / 75               | 5 / 6 / 11                             | 82 / 71 / 67              | 97 / 95 / 91                 | 18 / 13 / 12              | —                     |
| B3 midrange     | 84 / 83 / 78               | 4 / 5 / 9                              | 88 / 75 / 69              | 98 / 97 / 93                 | 25 / 18 / 16              | —                     |
| B3 aggro        | 74 / 72 / 64               | 7 / 8 / 16                             | 66 / 53 / 48              | 99 / 97 / 91                 | 12 / 9 / 9                | —                     |
| B3 big mana     | 90 / 89 / 85               | 3 / 4 / 7                              | 94 / 84 / 75              | 98 / 96 / 94                 | 29 / 21 / 18              | —                     |
| B3 spellslinger | 76 / 76 / 72               | 7 / 8 / 11                             | 77 / 66 / 62              | 97 / 96 / 93                 | 13 / 10 / 9               | —                     |
| B4              | 76 / 77 / 71               | 7 / 7 / 12                             | 85 / 71 / 62              | 99 / 98 / 94                 | 19 / 14 / 13              | 44 / 44 / 50          |
| B5              | 51 / 53 / 52               | 20 / 20 / 23                           | 93 / 89 / 80              | 99 / 99 / 96                 | 60 / 49 / 41              | 58 / 56 / 64          |

Correct mulligans roughly halve the games with two or more missed land drops in B1–B3 (about 9–11% down to 4–5%) and raise "4 mana sources by turn 3" by 13–23 points. They barely raise land drops beyond what any mulligan rule gives: the optimal multiplayer rule hunts for cheap ramp and early plays, not extra lands. In B4 and cEDH the mana-optimal rule slightly lowers the chance of holding a key card (58% against 64% when never mulliganing in cEDH), which is why competitive keep rules also name the plan card ([By play style](#by-play-style)).

## How picky to be: keep rules by hand

The tables below give the **margin** for each hand class: the value of keeping it minus the value of mulliganing, in percent of the latter. Each cell reads _first seven / free seven_. The free-seven figure is also the first seven of a one-on-one game, since both are followed by a six. Beyond ±2% the decision is clear; within ±2% it is a judgment call that card quality, colours and the table decide. "—" marks classes that occur in fewer than 1% of hands. "Ramp" here always means ramp costing 2 or less. **Computed** [73], horizons as in the shell table.

### The first seven versus the free seven

The value a hand must beat, in mana spent by the horizon. **Computed**:

| Profile         | First seven | Free seven | Six   | Five  |
| --------------- | ----------- | ---------- | ----- | ----- |
| B1              | 34.27       | 32.09      | 29.66 | 26.30 |
| B2              | 35.72       | 33.34      | 30.84 | 27.55 |
| B3 midrange     | 29.70       | 27.88      | 25.90 | 23.14 |
| B3 aggro        | 26.38       | 24.53      | 22.64 | 20.22 |
| B3 big mana     | 32.14       | 30.28      | 27.94 | 24.77 |
| B3 spellslinger | 28.97       | 27.16      | 25.35 | 22.95 |
| B4              | 23.23       | 21.58      | 19.79 | 17.43 |
| B5              | 13.76       | 12.48      | 11.29 | 9.75  |

The gap between the first two columns is the free mulligan: a first seven must beat a whole fresh seven, a free seven only a six.

How often the optimal player keeps, against the land-only rules. **Computed** (percent of games; the last two columns are first-seven keep rates under multiplayer rules):

| Profile         | Multiplayer optimal: kept at 7 / 1 / 2 / 3+ mulligans | Average kept size | 1v1 optimal: kept at 7 / 1 / 2 / 3+ | "2–5 lands" rule: first seven kept | Karsten rule: first seven kept |
| --------------- | ----------------------------------------------------- | ----------------- | ----------------------------------- | ---------------------------------- | ------------------------------ |
| B1              | 47 / 42 / 10 / 1                                      | 6.87              | 79 / 19 / 2 / 0                     | 80                                 | 51                             |
| B2              | 37 / 46 / 15 / 2                                      | 6.81              | 73 / 23 / 3 / 0                     | 79                                 | 49                             |
| B3 midrange     | 45 / 34 / 16 / 5                                      | 6.75              | 63 / 29 / 8 / 1                     | 79                                 | 49                             |
| B3 aggro        | 45 / 41 / 11 / 3                                      | 6.83              | 75 / 20 / 5 / 1                     | 74                                 | 42                             |
| B3 big mana     | 45 / 28 / 17 / 10                                     | 6.61              | 51 / 30 / 16 / 3                    | 82                                 | 54                             |
| B3 spellslinger | 32 / 56 / 10 / 2                                      | 6.86              | 82 / 15 / 2 / 0                     | 77                                 | 47                             |
| B4              | 51 / 26 / 16 / 6                                      | 6.71              | 54 / 33 / 12 / 1                    | 76                                 | 45                             |
| B5              | 39 / 39 / 17 / 6                                      | 6.71              | 64 / 27 / 9 / 1                     | 64                                 | 31                             |

Value of each rule under multiplayer rules, in mana spent by the horizon. **Computed**:

| Rule                                                                                                       | B1    | B2    | B3 midrange | B3 aggro | B3 big mana | B3 spellslinger | B4    | B5    |
| ---------------------------------------------------------------------------------------------------------- | ----- | ----- | ----------- | -------- | ----------- | --------------- | ----- | ----- |
| Optimal                                                                                                    | 35.17 | 36.69 | 30.58       | 27.12    | 33.10       | 29.67           | 24.01 | 14.30 |
| "Keep 2–5 lands" (2–4 on six, 1–4 below)                                                                   | 34.50 | 35.99 | 29.57       | 26.65    | 31.23       | 29.14           | 23.06 | 13.32 |
| Karsten's two-tier rule, lands only (3–5 on the first seven, 2–5 on the free seven, 2–4 on six, 1–4 below) | 34.45 | 35.79 | 29.43       | 26.47    | 31.12       | 28.79           | 22.83 | 12.95 |

The model's version of Karsten's rule leaves out his Sol Ring and Signet clauses [21][73].

Reading:

- The optimal player keeps the first seven 32–51% of the time (37–51% in the five bracket shells) and, having reached the free seven, keeps it 51% (big mana) to 82% (spellslinger) of the time. Players keep 64% of first sevens [12].
- Land-only rules keep far more first sevens than the optimum and capture less than half of the free mulligan's value, because they ignore ramp. In several shells ("2–5 lands" in B3 midrange, big mana, B4 and cEDH) they score below optimal one-on-one London despite the free mulligan.
- The optimal keep rate is sensitive to small value differences, because many hands sit near the threshold; the optimal value is not.

**Game speed changes how picky to be.** **Computed**, first-seven keep rate under the optimal rule, multiplayer / one-on-one, as the horizon moves:

| Horizon           | T3      | T4      | T5      | T6      | T7      | T8      | T9      | T10     |
| ----------------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| B2 shell          | 36 / 40 | 35 / 40 | 37 / 40 | 39 / 42 | 39 / 62 | 37 / 73 | 51 / 84 | 48 / 84 |
| B3 midrange shell | 29 / 42 | 34 / 47 | 41 / 47 | 45 / 47 | 45 / 63 | 43 / 73 | 49 / 83 | 54 / 84 |
| B4 shell          | 24 / 32 | 31 / 52 | 45 / 54 | 51 / 54 | 51 / 71 | 51 / 83 | 51 / 85 | 60 / 85 |

In one-on-one play, slow games forgive weak starts and punish lost cards, so the keep rate climbs from about 40% to 84%. With the free mulligan the first-seven keep rate stays around 25–60% at every horizon, because the redraw costs nothing. The average kept hand grows from 6.26 cards (B2, horizon T3) to 6.91 (T10), and from 6.13 to 6.94 in B4.

### By bracket

**Computed**, the five bracket shells (first seven / free seven):

| Lands, ramp      | B1            | B2            | B3            | B4            | B5            |
| ---------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| 0 lands, 0 ramp  | −55.2 / −52.2 | −54.4 / −51.1 | —             | —             | —             |
| 0 lands, 1 ramp  | −35.3 / −30.9 | −39.0 / −34.7 | −43.6 / −40.0 | −48.9 / −44.9 | −51.2 / −46.2 |
| 0 lands, 2+ ramp | —             | —             | −29.1 / −24.5 | −29.9 / −24.5 | −20.7 / −12.5 |
| 1 land, 0 ramp   | −27.9 / −23.0 | −27.8 / −22.7 | −30.4 / −25.8 | −35.7 / −30.8 | −35.8 / −29.2 |
| 1 land, 1 ramp   | −6.0 / +0.4   | −8.6 / −2.1   | −12.2 / −6.5  | −14.9 / −8.4  | −14.3 / −5.5  |
| 1 land, 2+ ramp  | +6.9 / +14.2  | +2.2 / +9.5   | +2.4 / +9.1   | +4.2 / +12.2  | +9.3 / +20.6  |
| 2 lands, 0 ramp  | −7.3 / −1.0   | −8.0 / −1.5   | −11.6 / −5.8  | −15.4 / −8.9  | −20.9 / −12.8 |
| 2 lands, 1 ramp  | +9.4 / +16.8  | +7.1 / +14.8  | +4.8 / +11.7  | +2.0 / +9.9   | −1.4 / +8.7   |
| 2 lands, 2+ ramp | +15.3 / +23.2 | +11.5 / +19.5 | +12.8 / +20.1 | +14.3 / +23.1 | +13.2 / +24.8 |
| 3 lands, 0 ramp  | +0.2 / +7.0   | −0.9 / +6.1   | −5.2 / +1.0   | −8.3 / −1.2   | −17.0 / −8.5  |
| 3 lands, 1 ramp  | +10.0 / +17.5 | +8.3 / +16.0  | +7.2 / +14.2  | +5.3 / +13.4  | −1.5 / +8.6   |
| 3 lands, 2+ ramp | +9.9 / +17.4  | +8.5 / +16.3  | +10.9 / +18.2 | +11.7 / +20.3 | +6.3 / +17.2  |
| 4 lands, 0 ramp  | −0.9 / +5.8   | −2.3 / +4.7   | −6.1 / +0.0   | −9.0 / −2.0   | −20.1 / −11.9 |
| 4 lands, 1 ramp  | +4.7 / +11.8  | +3.0 / +10.4  | +3.5 / +10.3  | +1.5 / +9.3   | −8.7 / +0.7   |
| 4 lands, 2+ ramp | —             | —             | +3.3 / +10.1  | +3.8 / +11.8  | −6.6 / +3.0   |
| 5 lands, 0 ramp  | −6.6 / −0.2   | −7.7 / −1.1   | −10.8 / −4.9  | −13.6 / −7.0  | —             |
| 5 lands, 1 ramp  | —             | −5.8 / +0.9   | −6.0 / +0.2   | −7.5 / −0.4   | —             |

In plain words, for the first seven (the free seven is always more lenient):

- **Everywhere.** Zero lands: mulligan. One land: mulligan unless it comes with two cheap ramp pieces. Two lands and no cheap ramp: mulligan the first seven. Two lands with cheap ramp: keep (cEDH needs two pieces).
- **B1 and B2.** Three lands with nothing cheap is a coin flip (+0.2%, −0.9%); four is a coin flip in B1 and leans mulligan in B2 (−2.3%). On the free seven, any 2–4-lander is a keep or a coin flip. Five lands without ramp: mulligan the first seven, coin flip on the second.
- **B3.** Ship every no-ramp first seven: 3 lands −5.2%, 4 lands −6.1%. On the free seven, 3–4 lands without ramp become coin flips; two lands without ramp is still a mulligan (−5.8%).
- **B4.** Every no-ramp hand is a mulligan on the first seven (−8.3% to −15.4%), and two lands with one ramp piece is only just a keep (+2.0%). On the free seven, 3 lands without ramp is a coin flip (−1.2%), 4 lands leans mulligan (−2.0%).
- **B5.** Mulligan is the default. Keep 1 land with two fast-mana pieces (+9.3%) or 2–3 lands with two (+13.2%, +6.3%). Two or three lands with one piece are coin flips (−1.4%, −1.5%); four lands is a mulligan even with ramp. On the free seven, one cheap ramp piece with 2–3 lands is enough (+8.7%, +8.6%).

Why the bar rises with the bracket: a hand is judged against a fresh seven of the same deck. A deck with 14–21 pieces of cheap ramp finds ramp often, so a hand without it is below average for that deck, and the shorter horizon leaves less time to recover.

What creators add per bracket (**Community**):

- **B1–B2**: keep functional hands with "enough lands and… card draw", not the hand with "access to six mana on turn two" [65]; casual games are won "on turn seven through eleven", so card draw ranks above ramp in the opener [64].
- **B3**: tables are often lax, but decks should work under the official rule [43][68]; add an interaction piece to the keep when a known-fast deck is at the table [37].
- **B4**: "Keeping the right hand to either a disrupt or try to go off"; the opener needs "some sort of way to speed up your clock"; "turn two and three are huge in bracket four" [68].
- **B5**: "Do I have a valid reason to keep this hand?" Ranked reasons: truly broken cards (a turn-1 or turn-2 Mystic Remora or Rhystic Study), then development (mana first); interaction is "rarely a reason to keep alone", and card advantage without development is "mostly a trap" [36]. Fast decks see "frequent mulligans to five or below" [47].

### By play style

**Computed**, the four Bracket 3 shells (first seven / free seven):

| Lands, ramp      | B3 midrange   | B3 aggro / voltron | B3 big mana   | B3 spellslinger |
| ---------------- | ------------- | ------------------ | ------------- | --------------- |
| 0 lands, 0 ramp  | —             | −56.8 / −53.5      | —             | −47.5 / −44.0   |
| 0 lands, 1 ramp  | −43.6 / −40.0 | −44.7 / −40.5      | −46.0 / −42.6 | −34.8 / −30.5   |
| 0 lands, 2+ ramp | −29.1 / −24.5 | −29.3 / −24.0      | −30.7 / −26.5 | —               |
| 1 land, 0 ramp   | −30.4 / −25.8 | −27.4 / −21.9      | −39.6 / −35.8 | −17.7 / −12.3   |
| 1 land, 1 ramp   | −12.2 / −6.5  | −11.5 / −4.8       | −15.1 / −9.9  | −4.1 / +2.3     |
| 1 land, 2+ ramp  | +2.4 / +9.1   | +3.6 / +11.4       | +1.5 / +7.7   | +4.3 / +11.3    |
| 2 lands, 0 ramp  | −11.6 / −5.8  | −7.1 / −0.1        | −18.4 / −13.4 | −2.8 / +3.7     |
| 2 lands, 1 ramp  | +4.8 / +11.7  | +5.6 / +13.6       | +3.0 / +9.4   | +8.7 / +15.9    |
| 2 lands, 2+ ramp | +12.8 / +20.1 | +13.5 / +22.1      | +14.0 / +21.0 | +11.8 / +19.3   |
| 3 lands, 0 ramp  | −5.2 / +1.0   | −0.6 / +6.9        | −11.0 / −5.5  | −0.7 / +5.9     |
| 3 lands, 1 ramp  | +7.2 / +14.2  | +8.0 / +16.1       | +6.3 / +12.8  | +6.6 / +13.7    |
| 3 lands, 2+ ramp | +10.9 / +18.2 | +10.6 / +18.9      | +13.4 / +20.4 | +6.7 / +13.8    |
| 4 lands, 0 ramp  | −6.1 / +0.0   | −1.5 / +5.9        | −11.1 / −5.6  | −4.2 / +2.2     |
| 4 lands, 1 ramp  | +3.5 / +10.3  | +2.9 / +10.6       | +3.7 / +10.1  | −0.4 / +6.2     |
| 4 lands, 2+ ramp | +3.3 / +10.1  | —                  | +8.2 / +14.8  | —               |
| 5 lands, 0 ramp  | −10.8 / −4.9  | −7.6 / −0.6        | −15.1 / −9.9  | −10.4 / −4.5    |
| 5 lands, 1 ramp  | −6.0 / +0.2   | —                  | −3.1 / +2.9   | —               |

In plain words:

- **Aggro and voltron** (low curve, cheap commander) judge mana like a B2 deck: 3–4 lands without ramp are coin flips on the first seven (−0.6%, −1.5%) and keeps on the free seven.
- **Big mana** is the strictest casual shell. Every no-ramp hand is a mulligan on both sevens, even with 3 or 4 lands (−11.0% / −5.5%, −11.1% / −5.6%), and hands with two ramp pieces are its best keeps.
- **Spellslinger** is the most lenient: cheap cantrips make thin hands work. It is the only shell where a free seven with 2 lands and no ramp is a keep (+3.7%), and 1 land with one ramp piece is a keep on the free seven (+2.3%). Four lands with nothing cheap is a mulligan on the first seven (−4.2%): too much mana, too little to do.

**What the model cannot see, the primers can.** The margins say whether a hand develops mana as well as a fresh seven. They cannot see whether the hand does what the deck is for. **Community** (_consensus_): primers set a role requirement on top of mana, by archetype ([What each archetype needs](#what-each-archetype-needs-from-its-opening-hand)): voltron needs ramp to the commander and protection, aristocrats a sac outlet and fodder, spellslingers card draw first, reanimator a discard or self-mill outlet, cEDH a named reason to keep. Where primers state a mana rule, it agrees with the model: a B3 voltron primer says to consider a mulligan with "2 or less lands · No draw or ramp · A ≥5 MV spell" [71]; a B4 goblins primer avoids "Slow hands with 4+ lands" (model: 4 lands and no ramp, −9.0% in B4) [71]. A hand must pass both tests: mana from the margins, role from the primer. In cEDH, the mana-optimal rule keeps a key card less often than never mulliganing (58% against 64%), so a cEDH keep rule must name the card ([What the free mulligan is worth](#what-the-free-mulligan-is-worth)).

### What to put on the bottom

- **Computed** (the model's rule [73]): going to six, keep three lands, untapped ones first; then mana-positive rocks, ramp costing 2 or less, key cards, draw costing 3 or less, other ramp, then the cheapest spells.
- **Community** (_consensus_; Karsten, The Command Zone #504, Geeky Domain): bottom surplus mana rocks, then lands above three, then the most expensive, uncastable or non-self-sufficient cards, then redundant copies of an effect. Keep a card-draw source [21][40][64]. In #504's exercise of downgrading a hand card by card, "we never removed the lands" [64].
- **Community** (primers): bottom win conditions and finishers first: "Mulligan your win cons and find them later" (Vivi, B5); "Avoid hands filled with finishers" (Katara, B2). Then 5+ mana cards, then late-game value cards: a Thrasios and Tymna pilot calls Seedborn Muse in the opener "a dead card" [71].
- Rule 103.5 lets bottomed cards go "in any order" [1]. Decks that use the bottom of the library (Grenzo) can bottom chosen creatures to use it "like a second hand" [38]. **Community** (Paulo Vitor Damo da Rosa, 60-card formats): what to bottom matters nearly as much as whether to keep [46].
- **Community** (_consensus_): Sol Ring does not make a one-land hand a keep [39], and ramp does not replace a land: "arcane signet does not replace the land in your opening hand" [64]. The model agrees: 1 land with one cheap ramp piece is a first-seven mulligan in every shell.

## Mana curves

### The shape by bracket

**Data** (EDHREC per-commander, per-bracket average decks for the 100 most popular commanders, fetched 2026-11-09; curve from EDHREC's curve panel, equal weight per commander, nonland cards in the 99, commander excluded) [27]:

| Bracket                        | Lists / decks | MV 0 | 1    | 2    | 3    | 4   | 5   | 6   | 7+  | Lands | Avg MV | % at MV ≤2 | % at MV ≥5 | Peak |
| ------------------------------ | ------------- | ---- | ---- | ---- | ---- | --- | --- | --- | --- | ----- | ------ | ---------- | ---------- | ---- |
| B1                             | 97 / 7,772    | 0.5  | 8.3  | 17.2 | 15.8 | 9.4 | 5.6 | 2.9 | 3.1 | 36.4  | 3.12   | 41%        | 18%        | MV 2 |
| B2                             | 100 / 189,183 | 0.3  | 7.8  | 17.3 | 15.9 | 9.6 | 5.7 | 3.0 | 3.6 | 35.9  | 3.19   | 40%        | 19%        | MV 2 |
| B3                             | 100 / 267,002 | 0.4  | 9.0  | 17.3 | 15.8 | 9.3 | 5.3 | 2.8 | 3.8 | 35.4  | 3.16   | 42%        | 19%        | MV 2 |
| B4                             | 100 / 127,755 | 1.2  | 11.3 | 17.0 | 15.5 | 8.9 | 4.7 | 2.5 | 3.4 | 34.4  | 2.99   | 46%        | 16%        | MV 2 |
| B5, EDHREC-tagged              | 91 / 44,166   | 4.5  | 19.1 | 17.9 | 14.6 | 6.8 | 2.9 | 1.2 | 2.1 | 29.9  | 2.27   | 60%        | 9%         | MV 1 |
| B5, EDHTop16 top-30 commanders | 30 / 52,148   | 5.9  | 22.2 | 18.5 | 15.2 | 5.5 | 2.5 | 0.7 | 1.2 | 27.0  | 2.11   | 65%        | 6%         | MV 1 |
| No bracket filter              | 100 / 2.65M   | 0.8  | 9.5  | 17.2 | 15.8 | 9.2 | 5.3 | 2.7 | 3.6 | 35.1  | 3.12   | 43%        | 18%        | MV 2 |

The same commander, moved between brackets (**Data**, mean of per-commander differences) [27]:

| Change  | n   | MV 0  | MV 1  | MV 2  | MV 3  | MV 4  | MV 5  | MV 6  | MV 7+ | Lands | Avg MV |
| ------- | --- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ------ |
| B2 − B1 | 97  | −0.19 | −0.43 | +0.16 | +0.26 | +0.23 | +0.16 | +0.13 | +0.21 | −0.53 | +0.04  |
| B3 − B2 | 100 | +0.10 | +1.12 | −0.04 | −0.18 | −0.23 | −0.36 | −0.20 | +0.20 | −0.45 | −0.03  |
| B4 − B2 | 100 | +0.88 | +3.49 | −0.25 | −0.45 | −0.64 | −0.96 | −0.54 | −0.13 | −1.45 | −0.20  |
| B5 − B4 | 91  | +3.23 | +7.60 | +0.95 | −0.82 | −1.91 | −1.76 | −1.27 | −1.49 | −4.56 | −0.72  |

Reading:

- **B1–B4 share one skeleton**: a peak at mana value 2, mana value 3 close behind, about 9–9.5 cards at 4, with 34–36 lands. Moving up shifts 3–4 cards from mana value 4–6 into 0–1 and removes 1–2 lands; it does not move the peak. **Data** (ScrollVault, 6,532 Archidekt decks, 2026-09-07) agrees: median average mana value 3.17, 3.16, 3.11, 3.04 and 2.20 for B1–B5; "Brackets 1 to 4 are built on the same skeleton"; "cEDH decks are a different shape" [25].
- **The commander matters more than the bracket in B1–B4.** Within one bracket, average mana value varies across commanders with a standard deviation of 0.51–0.60 (B2 ranges from 2.24 to 5.32), against a mean B2 → B4 shift of −0.20; land counts vary by 1.4–2.3 against a shift of −1.45 [27].
- **B5 is a different deck.** About 24–28 cards sit at mana value 0–1, 27–30 lands, almost nothing above 5. The B5 tag on popular casual commanders (29.9 lands) is less extreme than lists for the commanders that actually win tournaments (27.0) [27].
- **Precons are not the B2 curve.** **Data** (35 Commander precons released 2025-02-14 to 2026-11-13, MTGJSON) [33]: 0.3/4.6/14.8/15.6/11.0/7.1/3.9/3.5 with 38.1 lands and average mana value 3.47. Against user-built B2 decks that is about 3.3 fewer one-drops, 2.5 fewer two-drops, 3.8 more cards at mana value 4–6, 2.2 more lands and +0.28 average mana value [27][33]. **Official**: "Core is still a great landing point for people, but that doesn't have to be tied to precons." [2]

What it means for mulligans: the higher the bracket, the more of the deck sits at mana value 2 or less, so a fresh seven more often holds cheap ramp and early plays, and the bar for keeping rises ([By bracket](#by-bracket)).

Interaction gets cheaper and moves to the stack as the bracket rises. **Data** (synthesized EDHREC lists classified with Scryfall Tagger, mean per list) [27][34]:

| Bracket             | Spot interaction ≤1 MV | 2 MV | 3+ MV | Share at ≤2 MV | Counterspells | Sweepers | Draw |
| ------------------- | ---------------------- | ---- | ----- | -------------- | ------------- | -------- | ---- |
| B1                  | 2.0                    | 2.8  | 5.9   | 45%            | 1.6           | 2.3      | 11.4 |
| B2                  | 1.9                    | 2.9  | 5.9   | 45%            | 1.5           | 2.5      | 11.4 |
| B3                  | 2.2                    | 2.9  | 5.5   | 48%            | 2.0           | 2.6      | 10.7 |
| B4                  | 2.3                    | 2.4  | 5.2   | 47%            | 2.75          | 2.8      | 9.9  |
| B5, EDHREC-tagged   | 4.6                    | 1.9  | 4.6   | 59%            | 5.7           | 1.45     | 8.7  |
| B5, EDHTop16 top-30 | 6.5                    | 1.7  | 4.9   | 63%            | 7.2           | 0.5      | 8.8  |
| Precons 2025–2026   | 1.1                    | 2.6  | 5.9   | 39%            | 0.6           | 3.6      | 13.0 |

### The shape by archetype

**Data** (EDHREC tag pages, top 10 commanders per tag, commander-and-tag average decks, not bracket-filtered; equal weight per commander) [27][34]. Core ramp = rocks, dorks costing 2 or less, land ramp and rituals, split by cost 0–1 / 2 / 3+.

| Archetype (example commanders)                                           | Decks  | Curve, MV 0/1/2/3/4/5/6/7+         | Lands | Avg MV | ≤2  | ≥5  | Core ramp (0–1/2/3+) | Counters | Draw |
| ------------------------------------------------------------------------ | ------ | ---------------------------------- | ----- | ------ | --- | --- | -------------------- | -------- | ---- |
| Tokens (Krenko, Edgar Markov, Chatterfang, Lathril)                      | 24,018 | 0.1/9.6/18.0/19.6/10.0/4.3/1.4/1.5 | 34.4  | 2.88   | 43% | 11% | 8.1 (2.6/4.3/1.2)    | 0.7      | 9.2  |
| Go-wide (Trostani, Isshin, Krenko, Thorin)                               | 638    | 0.0/8.8/18.2/17.2/10.5/5.1/1.7/2.1 | 35.4  | 2.99   | 43% | 14% | 7.9 (2.1/5.0/0.8)    | 1.1      | 10.8 |
| Voltron (Light-Paws, Skullbriar, Ardenn/Rograkh, Wolverine)              | 9,338  | 0.2/14.0/20.6/15.9/6.8/3.1/1.9/1.5 | 35.0  | 2.56   | 54% | 10% | 8.0 (2.1/4.6/1.3)    | 1.0      | 7.5  |
| Aristocrats (Teysa Karlov, Meren, Yawgmoth, Wilhelt)                     | 15,710 | 0.2/11.2/18.2/17.7/8.9/4.9/1.9/1.8 | 34.2  | 2.83   | 46% | 13% | 7.8 (2.9/3.2/1.7)    | 0.3      | 9.0  |
| Spellslinger (Veyran, Niv-Mizzet Parun, Feather, Vivi)                   | 18,283 | 0.6/14.7/21.7/14.2/8.2/2.9/1.8/1.1 | 33.8  | 2.55   | 57% | 9%  | 10.5 (4.0/5.1/1.4)   | 4.2      | 18.4 |
| Storm (Ral, Vivi, Veyran, Stella Lee)                                    | 6,761  | 3.4/17.3/21.7/13.3/6.8/2.6/1.3/1.0 | 31.8  | 2.23   | 63% | 7%  | 14.6 (9.1/4.7/0.8)   | 4.9      | 17.2 |
| Landfall (Aesi, Omnath, Hearthhull)                                      | 7,892  | 0.6/7.5/14.3/17.5/8.1/5.5/4.0/2.8  | 38.7  | 3.25   | 37% | 20% | 16.3 (1.2/9.0/6.1)   | 1.1      | 7.6  |
| Ramp (Omnath Locus of Mana, The Ur-Dragon, Gishath, Pantlaza)            | 6,948  | 0.2/7.5/13.0/15.6/7.0/6.7/5.0/6.8  | 37.2  | 3.62   | 34% | 30% | 15.3 (2.0/7.8/5.5)   | 1.0      | 7.7  |
| Big mana (Omnath Locus of Mana, Zhulodok, Ulalek, Jodah)                 | 3,652  | 0.1/6.3/10.1/10.2/8.3/5.1/5.9/17.9 | 35.1  | 4.68   | 26% | 45% | 14.8 (3.7/5.3/5.8)   | 2.2      | 11.4 |
| Reanimator (Meren, Muldrotha, Sefris, Teval)                             | 16,620 | 0.3/10.9/18.8/14.1/7.8/5.7/2.6/4.5 | 34.4  | 3.03   | 46% | 20% | 10.1 (2.5/6.1/1.5)   | 2.4      | 13.0 |
| Control (Grand Arbiter Augustin IV, Zur, Shorikai, Alela)                | 9,650  | 0.8/11.4/19.4/16.9/9.2/3.7/1.4/2.6 | 33.6  | 2.77   | 48% | 12% | 10.9 (2.5/7.4/1.0)   | 7.5      | 13.7 |
| Stax (Grand Arbiter, Urza, Winota, Lavinia)                              | 4,791  | 2.0/13.4/19.6/18.0/6.8/3.0/1.5/1.6 | 33.1  | 2.45   | 53% | 9%  | 9.8 (3.7/5.5/0.6)    | 5.8      | 7.3  |
| Combo (Kinnan, Sisay, Rograkh/Silas, Breya)                              | 9,348  | 4.4/17.2/19.7/14.6/6.8/3.0/1.2/1.8 | 30.2  | 2.33   | 60% | 9%  | 16.2 (10.7/4.5/1.0)  | 7.9      | 10.7 |
| Group hug (Phelddagrif, Kynaios and Tiro, Zedruu, Kenrith)               | 8,866  | 0.1/8.8/17.3/20.2/9.5/4.5/2.2/1.5  | 35.2  | 2.90   | 41% | 13% | 11.5 (2.7/5.8/3.0)   | 3.3      | 22.4 |
| "Midrange" tag (mostly cEDH: Kraum/Tymna, Thrasios/Tymna, Kinnan, Sisay) | 3,997  | 3.8/18.5/18.8/14.2/7.6/3.0/0.8/1.5 | 30.5  | 2.21   | 60% | 8%  | 17.4 (10.2/6.1/1.1)  | 8.5      | 9.4  |
| +1/+1 counters (Atraxa, Hakbal, Marchesa)                                | 22,946 | 0.7/8.9/18.1/16.9/9.9/4.6/2.4/2.0  | 35.6  | 2.93   | 44% | 14% | 10.3 (1.6/6.9/1.8)   | 1.8      | 11.8 |
| Artifacts (Urza, Breya, Shorikai, Mishra)                                | 20,750 | 1.4/8.7/18.0/16.4/10.6/3.6/2.9/3.7 | 33.7  | 3.03   | 43% | 16% | 11.3 (1.5/7.0/2.8)   | 2.8      | 12.7 |
| Enchantress (Sythis, Tuvasa, Anikthea, Go-Shintai)                       | 18,863 | 0.3/7.6/16.9/15.2/8.9/7.7/3.2/4.0  | 35.3  | 3.31   | 39% | 23% | 9.0 (1.3/5.7/2.0)    | 0.8      | 11.3 |
| Burn (Nekusar, Ojer Axonil, Judith, Imodane)                             | 13,461 | 0.5/12.6/21.0/15.1/8.5/3.9/1.8/1.5 | 34.1  | 2.77   | 53% | 11% | 8.5 (3.1/4.7/0.7)    | 3.3      | 13.7 |
| Blink (Brago, Roon, Abdel Adrian, Elesh Norn)                            | 8,646  | 0.2/9.4/16.7/14.7/11.5/6.1/2.9/3.0 | 34.4  | 3.17   | 41% | 19% | 9.6 (1.8/6.5/1.3)    | 2.7      | 11.4 |
| cEDH tag (Kinnan, Kraum/Tymna, Rograkh/Silas, Sisay)                     | 31,817 | 6.1/22.2/17.9/14.5/5.8/3.0/0.7/2.0 | 26.3  | 2.20   | 64% | 8%  | 17.5 (12.6/4.1/0.8)  | 8.8      | 9.2  |

Reading:

- **Three signatures.** Low curves (average 2.2–2.8; 53–63% at mana value 2 or less; 30–35 lands): spellslinger, storm, voltron, stax, burn, combo. Middle curves (2.8–3.3): tokens, go-wide, aristocrats, counters, reanimator, blink, group hug, artifacts, enchantress, and control at 2.77. High curves: landfall (38.7 lands, peak at 3), ramp (37.2 lands, 3.62) and big mana (4.68, with 17.9 cards at 7+ and the 2–3 slots hollowed out).
- **Lands track the archetype more than the bracket.** The spread between archetypes is about 12 lands, several times the B2 → B4 change of −1.45.
- **Ramp type tracks the curve.** Landfall and ramp decks take 87–92% of core ramp from pieces costing 2 or more, mostly land ramp; combo and storm take 60–66% from 0–1-mana fast mana and rituals.
- **Control is cheap in Commander.** **Community** (Karsten, 2022): "aggro decks should have lower curves and control decks require higher curves" [21]. The 2026 data contradicts the second half: control-tagged decks average 2.77 with 48% at mana value 2 or less, because their interaction is cheap.
- **The "midrange" and "combo" tags are dominated by cEDH commanders.** For casual midrange, counters, reanimator or blink are better proxies (2.93–3.17, 34.4–35.6 lands).
- Limits: archetype and bracket could not be crossed (EDHREC's tag-plus-bracket pages returned 403), so the stax and combo rows include many B4–B5 decks; go-wide has only 638 decks behind it.

### The commander's mana value

**Data** (Karsten, goldfish optimisation, 2022) [21]: "If your Commander costs N mana, then the optimal deck in my simplified model contains zero N-drops." His optimal decks:

| Commander MV | 1-drops | 2-drops | 3-drops | 4-drops | 5-drops | 6-drops | Rocks                | Lands |
| ------------ | ------- | ------- | ------- | ------- | ------- | ------- | -------------------- | ----- |
| 2            | 9       | 0       | 20      | 14      | 9       | 4       | Sol Ring + 0 Signets | 42    |
| 3            | 8       | 19      | 0       | 16      | 10      | 3       | Sol Ring + 0 Signets | 42    |
| 4            | 6       | 12      | 13      | 0       | 13      | 8       | Sol Ring + 7 Signets | 39    |
| 5            | 6       | 12      | 10      | 13      | 0       | 10      | Sol Ring + 8 Signets | 39    |
| 6            | 6       | 12      | 10      | 14      | 9       | 0       | Sol Ring + 9 Signets | 38    |

He qualifies it himself: "most realistic decks with an N-mana Commander shouldn't go down to exactly zero N-drops". For 2–3-mana commanders the optimiser preferred to curve out ("Fiddling around with mana ramp was worse"); for 4–6-mana commanders, to lead with a rock on turn 2.

**Data** (EDHREC, top 100 commanders, no bracket filter, computed by this research) [27]: real decks do not follow the zero rule. Cards at the commander's own mana value, against decks whose commander costs something else: MV 2, 18.1 against 17.1 (9 commanders); MV 3, 15.5 against 15.9 (25); MV 4, 9.8 against 8.8 (38); MV 5, 4.9 against 5.3 (17); MV 6, 3.3 against 2.7 (6). EDHREC found the same in 2022: "do EDH deckbuilders actually follow this recommendation? It looks like the answer is no." [30]

The commander's cost does shift the rest of the curve [27]:

| Commander MV | n   | Curve, MV 0/1/2/3/4/5/6/7+         | Lands | Avg MV | ≤2  | ≥5  | Core ramp (0–1/2/3+) |
| ------------ | --- | ---------------------------------- | ----- | ------ | --- | --- | -------------------- |
| ≤2           | 9   | 1.3/12.3/18.1/15.6/8.1/4.1/2.1/3.6 | 33.8  | 2.89   | 49% | 15% | 11.1 (3.5/6.0/1.7)   |
| 3            | 25  | 1.2/10.4/16.4/15.5/9.6/5.4/2.6/3.3 | 34.6  | 3.06   | 44% | 18% | 11.7 (3.3/6.3/2.0)   |
| 4            | 38  | 0.5/8.6/18.1/16.4/9.8/5.1/2.5/2.6  | 35.5  | 3.06   | 43% | 16% | 11.0 (2.3/6.3/2.4)   |
| 5            | 17  | 0.7/9.4/17.4/16.4/8.7/4.9/2.8/3.5  | 35.6  | 3.08   | 43% | 18% | 12.9 (3.4/6.7/2.9)   |
| 6            | 6   | 0.3/8.3/15.2/14.3/8.3/6.8/3.3/6.5  | 35.8  | 3.60   | 38% | 26% | 9.7 (2.0/4.7/3.0)    |
| ≥7           | 5   | 0.6/8.2/13.6/12.4/6.8/7.4/5.8/9.0  | 35.2  | 3.79   | 35% | 35% | 12.8 (4.8/4.6/3.4)   |

**Data** (share of decks by commander mana value, partners counted at the higher cost) [27][35]: in B1–B4, commanders cluster at mana value 4 (34.1%, 41.6%, 40.6% and 38.7% of decks), and the mean rises from 3.93 in B1 to 4.20 in B4 as 6+-mana commanders double (8.1% to 16.2%). In cEDH, 63% of EDHTop16 entries play a commander (or a higher-cost partner) at mana value 3 or less, and 29.2% at mana value 2.

Reading: a real deck keeps a full band of 2- and 3-drops whatever the commander costs, runs far fewer 5-drops than Karsten's optimum (about 5 against 9–13), and 3.5 to 8 fewer lands. Treat "zero N-drops" as a model artefact and "do not overload the commander's slot" as the usable advice. Expensive commanders add expensive cards (26–35% of the nonland cards at mana value 5+) but not lands (about 35). **Community** (Brian Cain, EDHREC, 2025): "you probably want to cast your commander as soon as you get to that point in the curve", and "Concentrate the majority of your cards between 2-4 mana" [58]. **Community** (The Command Zone #658): "you probably want a little more two mana ramp when your commander… costs four… if you have a two drop commander you probably want less two mana ramp because you know what you're doing on turn two… which is playing your commander" [65].

### Ramp by bracket

**Data** (synthesized EDHREC lists classified with Scryfall Tagger; mean per list) [27][33][34]:

| Bracket             | Core ramp | MV 0–1 (incl. Sol Ring) | MV 2      | MV 3+     | Fast mana and rituals beyond Sol Ring | 1-MV dorks | 2-MV dorks | 2-MV rocks | 3-MV rocks | Land ramp ≤2 MV | Land ramp 3 MV |
| ------------------- | --------- | ----------------------- | --------- | --------- | ------------------------------------- | ---------- | ---------- | ---------- | ---------- | --------------- | -------------- |
| B1                  | 10.7      | 2.2 (20%)               | 5.9 (55%) | 2.6 (25%) | 0.39                                  | 0.78       | 1.25       | 3.06       | 1.06       | 1.61            | 0.99           |
| B2                  | 11.0      | 2.0 (18%)               | 6.3 (58%) | 2.7 (24%) | 0.21                                  | 0.77       | 1.44       | 3.16       | 0.95       | 1.74            | 1.03           |
| B3                  | 11.3      | 2.6 (23%)               | 6.2 (55%) | 2.5 (22%) | 0.50                                  | 1.06       | 1.45       | 2.96       | 0.82       | 1.83            | 0.94           |
| B4                  | 11.6      | 3.7 (32%)               | 5.9 (51%) | 2.0 (17%) | 1.28                                  | 1.44       | 1.38       | 2.82       | 0.90       | 1.65            | 0.56           |
| B5, EDHREC-tagged   | 16.9      | 11.8 (69%)              | 4.2 (25%) | 1.0 (6%)  | 7.68                                  | 3.07       | 1.40       | 2.40       | 0.52       | 0.35            | 0.33           |
| B5, EDHTop16 top 30 | 18.6      | 13.6 (73%)              | 4.0 (21%) | 1.0 (6%)  | 9.94                                  | 2.67       | 1.70       | 2.20       | 0.47       | 0.10            | 0.40           |
| Precons 2025–2026   | 9.2       | 1.4 (16%)               | 5.0 (55%) | 2.7 (30%) | 0.14                                  | 0.29       | 1.06       | 3.14       | 1.29       | 0.83            | 0.51           |

- **B1–B3**: about 11 pieces, more than half at mana value 2 (Arcane Signet in 97–99% of lists, Fellwar Stone about 35%, Talismans, Signets, Farseek, Nature's Lore, Rampant Growth, Three Visits); Sol Ring is the only fast mana.
- **B4** adds 0–1-mana acceleration (Lotus Petal 20%, Dark Ritual 26%, Jeska's Will 24%, Birds of Paradise 41%) and sheds three-mana land ramp.
- **B5** is a different economy: 69–73% of ramp at mana value 0–1. Chrome Mox, Lotus Petal, Mox Diamond and Mana Vault appear in 87–97% of lists; rituals and Spirit Guides supply the burst that Mana Crypt and Jeweled Lotus gave before their September 2024 ban. **Community** (Harvey McGuinness): the average cEDH deck runs "somewhere around 10-12 rocks"; dorks are restrictive because they die easily and only produce mana the turn after they are cast; and Gemstone Caverns is a seat-dependent opener: "if Gemstone Caverns is in your opening hand and you aren't going first, you can exile another card from your hand" [53].
- Counting conventions differ: ScrollVault's medians are 10, 13, 13, 14 and 21 ramp pieces for B1–B5, with fast mana and rituals included [25]. Precons ramp the slowest way: fewest pieces (9.2), most of them at 3+.

**Why this matters for the opening hand.** **Computed**: cheap ramp is the feature that most often turns a hand into a keep ([By bracket](#by-bracket)). The shells carry 6 (B1), 9 (B2), 11 (B3), 14 (B4) and 21 (B5) ramp pieces at mana value 2 or less. **Community** (The Command Zone #658, using a hypergeometric calculator): 10 ramp pieces give a 54% chance of one in the opening hand and 63% by turn 2; with 12, "it's 70.4% to have one two mana rock by turn two"; always casting a four-mana commander on turn 3 would take "14 or 15 two mana ramp spells" [65]. A three-mana Cultivate is better read, in Karsten's words, "as a combination of a mana rock and a three-drop" [21]: it does not make a hand keepable the way a two-mana piece does.

### Land count once mulligans are played well

**Computed** [73]: value (mana spent by the horizon) under optimal multiplayer mulligans, by land count, everything else in the shell unchanged. Blank cells were not tested.

| Lands | B1    | B2    | B3 midrange | B3 aggro | B3 big mana | B3 spellslinger | B4    | B5    |
| ----- | ----- | ----- | ----------- | -------- | ----------- | --------------- | ----- | ----- |
| 22    |       |       |             |          |             |                 |       | 14.10 |
| 23    |       |       |             |          |             |                 |       | 14.18 |
| 24    |       |       |             |          |             |                 |       | 14.23 |
| 25    |       |       |             |          |             |                 |       | 14.24 |
| 26    |       |       |             |          |             |                 |       | 14.30 |
| 27    |       |       |             | 26.30    |             |                 |       | 14.29 |
| 28    |       |       |             | 26.50    |             |                 | 23.23 | 14.29 |
| 29    |       |       |             | 26.71    |             | 29.15           | 23.43 | 14.29 |
| 30    |       | 35.59 | 29.54       | 26.82    |             | 29.31           | 23.57 | 14.26 |
| 31    | 34.21 | 35.80 | 29.79       | 26.97    |             | 29.44           | 23.69 | 14.20 |
| 32    | 34.43 | 36.11 | 29.97       | 27.03    | 31.82       | 29.49           | 23.83 | 14.17 |
| 33    | 34.66 | 36.27 | 30.16       | 27.10    | 32.07       | 29.58           | 23.92 |       |
| 34    | 34.84 | 36.47 | 30.35       | 27.24    | 32.32       | 29.62           | 23.99 |       |
| 35    | 34.98 | 36.60 | 30.45       | 27.23    | 32.56       | 29.67           | 24.07 |       |
| 36    | 35.05 | 36.70 | 30.56       | 27.26    | 32.79       | 29.69           | 24.10 |       |
| 37    | 35.20 | 36.80 | 30.69       | 27.22    | 32.97       | 29.59           | 24.15 |       |
| 38    | 35.27 | 36.80 | 30.71       |          | 33.13       | 29.54           | 24.13 |       |
| 39    | 35.32 | 36.85 | 30.78       |          | 33.22       | 29.39           |       |       |
| 40    | 35.37 | 36.88 | 30.79       |          | 33.38       |                 |       |       |
| 41    | 35.36 |       |             |          | 33.44       |                 |       |       |
| 42    |       |       |             |          | 33.51       |                 |       |       |

The plateau is every land count within 0.5% of the best tested value. **Computed**:

| Shell              | Shell's lands | Tested | Plateau | Note                                                                 |
| ------------------ | ------------- | ------ | ------- | -------------------------------------------------------------------- |
| B1                 | 37            | 31–41  | 37–41   |                                                                      |
| B2                 | 36            | 30–40  | 36–40   | Best value at the top of the tested range; the optimum may be higher |
| B3 midrange        | 36            | 30–40  | 37–40   | Best value at the top of the tested range; the optimum may be higher |
| B3 aggro / voltron | 33            | 27–37  | 34–37   |                                                                      |
| B3 big mana        | 38            | 32–42  | 40–42   | Best value at the top of the tested range; the optimum may be higher |
| B3 spellslinger    | 35            | 29–39  | 33–37   | Peaks at 36                                                          |
| B4                 | 34            | 28–38  | 35–38   |                                                                      |
| B5                 | 28            | 22–32  | 24–30   | Flat 26–29, declines past 30                                         |

The B2 shell in full, with and without mulligans. **Computed**:

| Lands | Multiplayer | 1v1   | No mulligan | ≥4 lands end of T4 (multiplayer) | ≤2 lands end of T4 |
| ----- | ----------- | ----- | ----------- | -------------------------------- | ------------------ |
| 30    | 35.59       | 34.52 | 31.68       | 75%                              | 7%                 |
| 31    | 35.80       | 34.75 | 32.27       | 78%                              | 6%                 |
| 32    | 36.11       | 35.07 | 32.92       | 78%                              | 6%                 |
| 33    | 36.27       | 35.27 | 33.44       | 78%                              | 6%                 |
| 34    | 36.47       | 35.47 | 33.91       | 80%                              | 5%                 |
| 35    | 36.60       | 35.61 | 34.26       | 81%                              | 4%                 |
| 36    | 36.70       | 35.72 | 34.59       | 82%                              | 5%                 |
| 37    | 36.80       | 35.84 | 34.89       | 83%                              | 4%                 |
| 38    | 36.80       | 35.87 | 35.05       | 83%                              | 4%                 |
| 39    | 36.85       | 35.94 | 35.22       | 85%                              | 4%                 |
| 40    | 36.88       | 36.00 | 35.37       | 85%                              | 4%                 |

Reading:

- **With mulligans the land curve is flat.** In B2, going from 32 to 40 lands adds 0.77 mana spent by turn 8 (2%) with multiplayer mulligans, against 2.45 (7%) with none. Each land matters about three times less once mulligans are played well.
- **The free mulligan outweighs any realistic land change.** The B2 shell with 32 lands and the free mulligan (36.11) beats the same shell with 40 lands in one-on-one play (36.00).
- **It does not replace lands for land drops.** At equal land count, "4 lands by turn 4" is the same with and without the free mulligan (B2 at 36: 82% both ways). Lands still decide missed drops: at 30 lands the B2 shell misses two drops by turn 4 in 7% of games, at 40 in 4%.
- **The curve sets the plateau.** Spellslinger (average 2.56, 16 draw) peaks at 36 and is flat from 32 to 36; aggro (2.73) peaks around 34–36; B3 midrange (3.13) still gains slightly to 40; big mana (3.64) keeps gaining to 42 (32 → 38 lands: +1.31, 4%); cEDH (2.00, 21 ramp) is flat from 26 to 29 and declines past 30, matching the measured cEDH median of 28.
- **An independent cross-check agrees.** **Data** (Karsten's regression, lands = 31.42 + 3.13 × average mana value − 0.28 × cheap draw or ramp; read from a search excerpt because the page returns 404 [22]) predicts about 35.8 lands for the aggro shell, 34.4 for spellslinger, 39.7 for big mana and 30.4 for cEDH, consistent with the plateaus. The main guide works the formula through for typical decks ([Land count: Karsten's math](commander-deckbuilding-by-bracket.md#land-count-karstens-math)).
- **Measured decks sit at or just below the plateau.** Median lands are 37 / 36 / 36 / 35 / 28 for B1–B5 on Archidekt [25] and 36 / 35 / 33 / 28 on Moxfield (B1–B2 combined) [26]. The B2 and B3 shells' plateaus start at 36 and 37.

## Play style

### What each archetype needs from its opening hand

**Community** (deck primers on Archidekt, updated 2025–2026 unless noted, and strategy guides; each line rests on two or more sources unless marked _single source_) [71]:

| Archetype             | The hand must contain                                                                                                                                             | Ship                                                                                  | Sources                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Aggro, go-wide tokens | 2–3 lands, a 1-drop, a second cheap creature or ramp, an early engine                                                                                             | Hands of finishers; slow do-nothing keeps that undercut "the whole point of the deck" | Breena (B3), Katara (B2), Giada (B3), Krenko (B4) [71]; [40]                                                                 |
| Voltron               | 3 lands, ramp toward the commander's turn, at least one protection piece before casting it ("Never cast Licia without at least 1 instant-speed protection piece") | "2 or less lands · No draw or ramp · A ≥5 MV spell"                                   | Sigarda (B3), Licia (B2), Shu Yun [71]                                                                                       |
| Aristocrats           | 2–3 lands, a cheap sac outlet, fodder or a token maker; the commander and payoffs can come later                                                                  | "hands with only high-CMC cards… without ramp or early plays"                         | Dina (B3), Wilhelt (B4) [71]; [65]. Thin evidence: two primers and a template episode                                        |
| Spellslinger, storm   | Card draw first, ramp second, protection third: "Turn 1 Vivi with no draw engine will lose the game"                                                              | Payoffs only: "Mulligan your win cons and find them later"                            | Vivi (B5) [71]; [37]                                                                                                         |
| Big mana, landfall    | 3–5 lands that make the colours, land-based ramp; keeps land-heavy hands other decks ship                                                                         | Hands without an early ramp piece: "Mulligan hard for an early ramp piece"            | Halfling big mana (B3, 48 lands), Zacama (B3) [71]; [40]. No landfall-specific guidance found                                |
| Reanimator            | A discard or self-mill outlet plus one cheap reanimation piece                                                                                                    | "only expensive reanimation targets without ways to mill or ramp"                     | Teval (B2), Obeka (B3) [71]                                                                                                  |
| Control               | 2–3 lands, 2–3 draw effects, some interaction; ramp is secondary                                                                                                  | Removal-only hands                                                                    | Minn (B3), Uyo (B4) [71]; control is "the most forgiving" [40]                                                               |
| Group hug, pillowfort | Three lands, ramp, a card-advantage or value engine, and a political or defensive piece                                                                           | "hands that contain only removal and board wipes"                                     | Kynaios and Tiro (B3), Queen Marchesa (B3), Rocco (B2) [71]. Three of these share one author's template                      |
| Typal                 | 2–3 lands plus an early creature of the type; a sac outlet or haste enabler where the commander needs one                                                         | Hands of high-cost payoffs without acceleration                                       | Wilhelt, Lathril, Katara, Krenko [71]                                                                                        |
| cEDH midrange         | An early draw engine, or a tutor for one, plus the mana for the commander                                                                                         | Late-game cards: Seedborn Muse is "a dead card"                                       | Thrasios/Tymna, Blue Farm, Kinnan (B5) [71]; [49]                                                                            |
| cEDH turbo            | Fast mana plus a tutor or the engine; interaction is a bonus                                                                                                      | Interaction-only hands; card advantage without development                            | [36][47][50]; Kenrith (B5): "mulligans make or break this deck" [72]                                                         |
| Stax                  | A turn 1–2 lock piece and the mana to cast it                                                                                                                     | —                                                                                     | _Single source_ for the keep: cEDH Decklist Database entries [62]; the EDHREC stax guide gives no opening-hand guidance [52] |

Two things the primers agree on beyond the table. The commander is a card that is always in hand: do not ship a hand with lands and ramp just because it lacks a threat [37][40]. And bottoming goes finishers first, then cards of mana value 5+, then late-game value cards, then lands above three or four, except in land-matters decks [71].

What the model adds to each style (**Computed**, [By play style](#by-play-style)): aggro and voltron can keep 3–4-land hands without ramp more often than midrange; big mana must find a ramp piece; spellslinger can keep thinner hands than any other casual shell.

Gaps: no sourced opening-hand guidance was found for landfall, +1/+1 counters or casual (non-storm) spellslinger, and the templated "Mulligan Guide" blocks of one prolific author (three lands, ramp, an engine; avoid payoff-only) are close to MagicAIBuilder's own primer template. Primers by other authors name exact cards, turn targets and seat-dependent choices, which is what a good mulligan section adds.

### The commander's role

**Community** (primers [71] and cEDH guides [51]): creators sort commanders by when they must resolve, and that sets what the opener needs.

| Role                      | Examples and the turn they are cast                                                                                                                             | What the opening hand needs                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Engine, cast on turns 1–3 | Kinnan (turn 2 into 8+ mana by turn 3), Vivi (turn 1), Urza in a B2 build ("within turn 3"), Breena, Lathril and Minn (turn 3), Ral ("as early as turn 1 or 2") | Mana aimed at the commander's cost, plus what the engine feeds on; protection or a cheap recast |
| Payoff, cast late         | Dina ("best cast as a mid-to-late-game enabler"), Sigarda ("Turn 5 guaranteed"), Niv-Mizzet Reborn (turn 4 or 5), Licia (turns 5–7)                             | Setup and card draw; protection before casting                                                  |
| Optional                  | Tatsunari in B5 control ("we do not often play Tatsunari"); Tymna in Thrasios/Tymna ("worst case play Tymna to get a card draw engine online")                  | The seven judged on its own merits                                                              |

- **Computed**: under optimal multiplayer mulligans the commander is cast by turn (its mana value + 1) in 95–99% of games across the shells, against 88–96% when never mulliganing.
- **Community** (The Command Zone #658, ramp math): a four-mana commander wants "a little more two mana ramp"; a two-mana commander less, since turn 2 is spent casting it; a three-mana commander pushes "towards more one mana dorks" [65].
- **Community** (protection): engine and voltron primers keep protection in the opener or refuse to cast the commander without it (Licia, Urza, Krenko holding Deflecting Swat). Payoff commanders defer it; optional commanders skip it [71]. "not all protection needs its own dedicated slot": modal spells such as Boros Charm can cover it [60].

### Fast starts are worth less in multiplayer

**Data** (Playgroup.gg, 26,712 Playgroup Live games with Sol Ring, through 2026-09-07) [16]: a player who cast Sol Ring on turn 1 won 62.2% of duels (against 49.5% otherwise), 41.1% of three-player games (33.2%) and 28.7% of four-player games (25.0%; 95% interval 26.6–30.9; 1,658 games): about +12.7 points in a duel against about +3.7 in a four-player pod. Two other methods gave +3.96 and, randomised, +2.24 (interval −0.1 to +4.7). "The gap shrinks with every extra player." Playgroup attributes the shrinkage to arithmetic (a 25% fair share leaves less room than 50%), so it does not separate an "archenemy" effect from simple dilution.

**Data** (Playgroup.gg, September 2026, 40,897 games) [17]: combat ended 54.5% of games, combo 8.0%. Combo was the fastest win condition (7.2 rounds on average), combat the slowest (8.9). Over all tracked games, combat holds 55.07% of wins and combo 7.36% [18]. The main guide covers win conditions in full ([How games are actually won](commander-deckbuilding-by-bracket.md#how-games-are-actually-won)).

What follows for keeps and play:

- **Prefer resilient hands to explosive ones in B1–B3.** **Community** (The Command Zone #658): don't keep the hand that "got access to six mana on turn two… The thing gets removed and you don't do anything else for the rest of the game" [65]. **Computed**: the model points the same way in its own terms: the longer the game, the more hands the one-on-one optimum keeps, because slow games forgive weak starts ([horizon sensitivity](#the-first-seven-versus-the-free-seven)).
- **Manage perceived threat by style.** **Community** (_consensus_ across primers [71]): aggro should not let the commander "appear as both an engine and a threat" (Breena); aristocrats cast Dina late because pods "will cooperate to keep her removed"; group hug holds counters until "Turn 5ish: they notice you" (Kynaios and Tiro); big mana downplays Zacama so opponents "don't hang up on me early on"; cEDH midrange plans to "Stop the first 2 opponents from winning as needed… Then silence the table" (Blue Farm). A hand that threatens lethal before the others have cast their commanders invites the whole table: "it is always the correct move for your opponents to be trying to disrupt you" [67].
- **Deploy around the turns wipes come.** **Community** (#658): wipes are likeliest on turns 5–6, so "I would much rather play a four drop and hold a [Heroic] intervention" than a lone 5–6-drop [65]. **Community** (A.L. Walser): "you should generally let somebody else play the first big threat or develop their board the furthest" [57].

### Reading the table

- **Seat.** **Data** (Playgroup.gg, 257,261 four-player games) [13]: seat 1 wins 29.2%, seat 2 25.7%, seat 3 23.6%, seat 4 21.5%. A starting player who mulligans still wins about 30% [15]. Because declarations go in turn order (rule 103.5), later seats know who mulliganed before they decide [1].
- **Seat-aware keeps in cEDH.** **Community** (expert, Sperling) [36]: a turn-1 or turn-2 Mystic Remora in seats 1–2 can justify a weak first seven, but going 4th a lone Remora "may not be broken enough"; going 3rd or 4th, a mediocre hand is a mulligan on the first seven and "probably a keep still on 2nd 7". **Data** (EDHTop16, 50+-player events) [35]: seat 4's win rate fell from 15.9% (first half of 2024) to 12.2% (first half of 2026) while seat 1 held near 25%.
- **Pod speed.** **Community**: at a high-powered table you "either need to interact with them or race them"; a deck weaker than the table may have to "keep the thing that might be on the edge" [64]; facing a stronger deck, "I'm going to have to adjust my expectations and adjust my mulligan" [66]; "Look around the table and decide if the hand needs to be proactive or reactive" [37]. In B4, players must be "hyperaware of everyone else's board states" [68].
- **Pod composition.** **Community** (primers [71]): a B4 control pilot sculpts interaction per opponent, one answer for each fast deck and none for the slow combo player (Uyo); a B3 tokens primer sets "Lands: 2–4 depending on ramp, card draw, and seating" (Giada); a B3 reanimator chooses its first target against "a strong late-game deck at the table" (Obeka).
- **Recommended** reading (Sperling plus Playgroup, not tested directly): seat 1's edge survives a mulligan, so it can afford to ship a mediocre seven; seat 4 has less margin and benefits more from a functional keep.

## Trends 2019–2026

### Casual brackets

**Data**. Land counts have not moved since 2019 once early data problems are set aside:

| Date               | Figure                                                | Source                                                                                 |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2019-02-20         | "just over 29 lands"                                  | EDHREC database; an editor's note says the data was re-filtered after publication [31] |
| 2019-06-12         | 36.35 lands (decks added or updated since 2019-01-01) | EDHREC [32]                                                                            |
| 2022-07-05         | 35.9 mean, 36 median                                  | EDHREC data science team [29]                                                          |
| 2026-09-07         | Medians B1 37, B2 36, B3 36, B4 35, B5 28             | ScrollVault, 6,532 Archidekt decks [25]                                                |
| July–November 2026 | Medians B1–B2 36, B3 35, B4 33, cEDH 28               | EDHTuner, 18,414 Moxfield decks [26]                                                   |

Average mana value implied by the 2022 curve is about 3.23 (computed by this research from [29]; 8+ treated as 8, X spells excluded); in 2026 B1–B3 sit at 3.11–3.17 [25] and 3.14–3.18 [26].

What changed is which cards fill the slots. **Data** (EDHREC "Top Cards", rolling two-year window, rebuilt from archived snapshots; share of decks that can play the card) [28]:

| Card                         | 2021-07 | 2022-10 | 2023-11 | 2024-12 | 2025-12 | 2026-10 |
| ---------------------------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Arcane Signet                | 42.1    | 64.0    | 70.4    | 71.7    | 72.2    | 71.7    |
| Cultivate                    | 48.8    | 48.9    | 50.6    | 46.3    | 43.0    | 41.5    |
| Nature's Lore                | 14.5    | 22.4    | 30.3    | 32.0    | 31.5    | 31.9    |
| Birds of Paradise            | 25.4    | 24.2    | 26.0    | 27.0    | 27.6    | 28.3    |
| Dark Ritual                  | 14.7    | 18.1    | 21.0    | 22.3    | 24.2    | 25.9    |
| Talisman of Dominance        | 19.7    | 25.4    | 29.1    | 31.3    | 32.8    | 32.3    |
| Izzet Signet                 | 38.3    | 35.3    | 32.6    | 28.4    | 24.6    | 21.9    |
| Path to Exile                | 30.8    | 34.9    | 40.5    | 45.6    | 47.1    | 47.8    |
| An Offer You Can't Refuse    | –       | –       | 15.7    | 19.9    | 24.1    | 26.6    |
| Cyclonic Rift (Game Changer) | 38.3    | 33.7    | 30.9    | 27.8    | 23.2    | 20.1    |

In the month to 2026-11-08 the shift continued: Cultivate 35.8%, Rampant Growth 26.1% (from 31.4% over two years), Birds of Paradise 32.2%, Talisman of Progress 31.3% [28].

Precons got cheaper, not bigger. **Data** (all 161 MTGJSON Commander decks 2017–2026, Collector's Editions excluded) [33]: from 2019 (4 decks) to 2026 (25 decks), lands went from 39.8 to 37.9, nonland average mana value from 3.84 to 3.47, and nonland cards at mana value 2 or less from 15.0 to 20.0; ramp stayed between 9.0 and 10.5 pieces from 2021 on, and Game Changers at 0.00 per deck in 2026.

Game length and the bracket mix (**Data**):

- Playgroup's 2026 monthly reports (23,000–41,000 games a month) put the average casual game at 8.6–8.9 rounds; combo's share of wins rose from 6.4% to 8.0% between January and September; the small dip to 8.6 coincides with two-player pods rising from about 25% to 35% [17]. One creator's log: 9.4 → 9.8 → 9.4 turns from 2023 to 2025 [20].
- Of decks with an owner-set bracket on EDHREC, B3 holds 47.1% of the past month against 37.4% of older decks; B2 fell from 38.8% to 28.9% [28]. In Playgroup's games a declared bracket "explains only about 2-3% of the spread in results" [19].
- Game Changers fell faster than other staples once listed: over the window that is mostly after the list existed, a median relative drop of 20% against 4% for other top-100 cards, while Deflecting Swat, removed from the list, rose 10% [28].

Narratives against the data:

| Narrative                                   | Verdict                      | Evidence                                                                                                                           |
| ------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| "Decks run fewer lands than they used to"   | Not supported                | 36.35 (2019) → 36 (2022) → 35–37 (2026, B1–B3) [25][29][32]                                                                        |
| "Casual games end sooner than they used to" | Not supported                | 8.6–8.9 rounds in 2026; no multi-year decline in any series [17][20]                                                               |
| "Cards are cheaper and more efficient"      | Supported                    | Two-mana ramp and cheap removal rising, three-mana ramp falling [28]; precons from 15.0 to 20.0 cards at mana value 2 or less [33] |
| "Precons are packed with Game Changers"     | Not supported                | 0.00 per deck in 2026 [33]                                                                                                         |
| "Bracket 3 is crowded"                      | Supported                    | 47% of recently bracketed decks [28]                                                                                               |
| "Players are cutting Game Changers"         | Supported, as an association | −20% against −4% [28]                                                                                                              |

**Community** (dated narratives): "Commander has gotten faster" (Kristen Gregory, 2021) [59]; Sheldon Menery (2022) separated "speed creep" from "power creep", admitted "we can't be 100% sure that things have sped up so significantly", and said games "actually last more turns than most folks think" [45].

### cEDH

**Data** (EDHTop16, tournaments of 50+ players, computed by this research from the site's own queries; draw share = draws over all recorded player-games, intentional draws included) [35]:

| Period                    | Entries | Draw share | Seat 1 / seat 4 win % | Most-played (share of known entries)               |
| ------------------------- | ------- | ---------- | --------------------- | -------------------------------------------------- |
| 2023 H1                   | 2,823   | 11.5%      | n/a                   | Kraum/Tymna 8.8, Najeela 5.2, Kinnan 4.1           |
| 2024 H1                   | 8,311   | 18.8%      | 24.7 / 15.9           | Kraum/Tymna 11.3, Kinnan 7.2, Sisay 5.8            |
| 2024 Q3 (before the bans) | 4,244   | 18.2%      | 25.4 / 15.9           | Kraum/Tymna 11.3, Sisay 6.9, RogSi 6.6, Nadu 5.2   |
| 2024 Q4 (after the bans)  | 3,820   | 22.6%      | 24.9 / 15.5           | Thrasios/Tymna 8.2, Kraum/Tymna 8.2, Kinnan 7.4    |
| 2025 H1                   | 10,084  | 23.4%      | 25.2 / 14.4           | Kraum/Tymna 9.1, Kinnan 7.4, Thrasios/Tymna 7.1    |
| 2025 H2                   | 12,460  | 24.7%      | 24.7 / 13.9           | Kraum/Tymna 11.9, Kinnan 7.4, Rograkh/Thrasios 5.5 |
| 2026 H1                   | 17,544  | 27.3%      | 24.7 / 12.2           | Kraum/Tymna 9.9, Kinnan 8.4, Rograkh/Thrasios 6.6  |
| 2026 H2 (to 11-07)        | 12,056  | 25.0%      | 25.0 / 12.7           | Kraum/Tymna 8.5, Kinnan 7.6, Rograkh/Thrasios 5.8  |

In the three months either side of the September 2024 bans, Nadu went from 5.9% of entries to 0, Kinnan from 3.7% to 7.7%, Thrasios/Tymna from under 2% to 7.9%; RogSi barely moved (6.5% to 6.2%), and the draw share rose from 18.4% to 22.4% [35].

Top-4 decklists (**Data**, 45 random lists per period at 64+-player events, 405 lists pooled; computed by this research) [35]:

| Measure                    | Before the bans (2023 H1–2024 Q3) | After (2024 Q4–2026 H2) |
| -------------------------- | --------------------------------- | ----------------------- |
| Lands, mean (median)       | 26.7 (27)                         | 26.1 (26)               |
| Nonland average mana value | 2.01                              | 2.14                    |
| Fast-mana pieces           | 13.2                              | 11.6                    |
| Cheap dorks and rocks      | 13.1                              | 11.6                    |
| Tutors / counterspells     | 8.2 / 8.1                         | 7.5 / 7.3               |
| Free spells                | 6.1                               | 6.2                     |

**Community** (Harvey McGuinness): post-ban games are "more than one turn longer", "everyone is slower now, so – in a weird, equalizing way – no one is" [54]; the bans were "the largest single blow to cEDH's acceleration suite the format had ever seen" [55]. 2025 was "the year of Cradle Farm" and stax "an endangered species" [56].

Reading: "cEDH got slower after the bans" is supported indirectly. The draw share jumped within a quarter and kept rising, slower value engines doubled and turbo-adjacent Nadu vanished. But the draw rise began before the bans, and tournament structure (more Swiss rounds, intentional draws) contributes, so the draw share is a mixed signal, not a pure speed measure. Decks did not add lands to replace the lost fast mana; their curve rose by 0.1–0.15 instead.

### What the trends mean for building today

**Recommended**, each resting on the evidence above:

- **Keep the casual skeleton; upgrade the cost of each role.** Land counts and curves have been stable since 2019–2022; what moved is one- and two-mana ramp and interaction replacing three- and four-mana versions [25][28]. For the opening hand this is the same lever the model finds: every Cultivate swapped for a two-mana rock or Nature's Lore raises the share of keepable sevens ([By bracket](#by-bracket)).
- **Do not cut lands because cards got cheaper.** The model's plateaus for the B2 and B3 shells start at 36–37 lands, and the measured medians have not fallen [25][73].
- **Build B3 decks for the official rule.** B3 is now the most common declared bracket and the most varied [28]; its tables are often lax about mulligans [68]. A deck that relies on free redraws misreads its own power [43].
- **cEDH games are longer than they were.** The model uses a turn-4 horizon for B5. If post-ban games run "more than one turn longer" [54], the optimal first-seven bar is slightly lower than the B5 tables show ([horizon sensitivity](#the-first-seven-versus-the-free-seven)). This is an inference, not a computed B5 result.

## A mulligan checklist per bracket

**Recommended.** Each line names the evidence it rests on. "First seven" assumes a multiplayer game. In a one-on-one game that is not Brawl there is no free mulligan: use the free-seven line for the first seven. Margins are from the bracket's shell ([By bracket](#by-bracket)); adjust for play style with [By play style](#by-play-style).

**Bracket 1: Exhibition** (shell: 37 lands, 6 cheap ramp, five-mana commander, horizon turn 8)

- First seven: keep 2–4 lands with at least one cheap ramp piece; 3 lands without ramp is a coin flip, decided by whether the hand casts something by turn 3. Ship 2-landers without ramp and 5+ lands without ramp. **Computed** (2L0R −7.3%, 3L0R +0.2%, 5L0R −6.6%).
- Free seven: keep any 2–4-lander; 1 land with one ramp piece is a coin flip. **Computed** (2L0R −1.0%, 1L1R +0.4%).
- Six: keep any hand with 2–4 lands after bottoming; the second mulligan is the first that costs. **Data** [13][17]; **Community** (Karsten's six-card rule) [21].
- The hand must start the theme or draw cards: "Do you have enough lands and do you have card draw?" **Community** [65].
- Bottom finishers and the most expensive cards; keep three lands. **Community** (_consensus_) [21][64][71].
- Build: 37–41 lands is the shell's plateau. The shell carries 6 ramp pieces at mana value 2 or less, and hands holding one are the ones worth keeping. **Computed**; measured B1 decks run 36.4 lands and 10.7 core ramp, 2.2 of it at mana value 0–1 and 5.9 at 2. **Data** [27].
- Agree the table's mulligan rule before the game, and return the favour after lenient redraws. **Community** [64].

**Bracket 2: Core** (shell: 36 lands, 9 cheap ramp, four-mana commander, horizon turn 8)

- First seven: keep 2–4 lands with a cheap ramp piece. Ship 2 lands without ramp and 1 land with only one ramp piece; 3 lands without ramp is a coin flip; 4 lands without ramp leans mulligan. **Computed** (2L1R +7.1%, 2L0R −8.0%, 1L1R −8.6%, 3L0R −0.9%, 4L0R −2.3%).
- Free seven: keep 3–4 lands even without ramp; 2 lands without ramp is a coin flip. **Computed** (+6.1%, +4.7%, −1.5%).
- Six: keep a functional 2–4-lander. **Data** [13][17]; **Community** [21].
- The hand needs a path to the commander's plan by turn 3–4 and a source of cards; avoid hands of finishers. **Community** (Katara, Teval, Urza primers) [71][65].
- A four-mana commander on turn 3 needs about 12 two-mana ramp pieces for roughly 70%, 14–15 for reliability. **Community** [65].
- Build: 36–40 lands is the shell's plateau, possibly higher; the shell carries 9 ramp pieces at mana value 2 or less. **Computed**; measured B2: 35.9 lands, 11.0 core ramp with 6.3 at mana value 2. **Data** [27].
- Do not build on a precon's curve: precons carry about 6 fewer cards at mana value 2 or less than user B2 decks. **Data** [27][33].

**Bracket 3: Upgraded** (shell: 36 lands, 11 cheap ramp, four-mana commander, horizon turn 7)

- First seven: ship every hand without cheap ramp, whatever its lands; keep 2–4 lands with ramp, or 1 land with two pieces. **Computed** (3L0R −5.2%, 4L0R −6.1%, 2L1R +4.8%, 1L2R +2.4%).
- Free seven: 3–4 lands without ramp become coin flips; 2 lands without ramp stays a mulligan. **Computed** (+1.0%, 0.0%, −5.8%).
- By style: aggro and voltron judge mana like B2; big mana ships every no-ramp hand on both sevens; spellslinger may keep a 2-land free seven without ramp. **Computed** ([By play style](#by-play-style)).
- Add the archetype's role card: protection for voltron, a sac outlet for aristocrats, card draw for spellslinger; one interaction piece when a known-fast deck sits at the table. **Community** [37][71].
- Six: keep a functional hand; tables here are often lax, but the deck should not depend on it. **Community** [43][68].
- Build: 37–40 lands for the midrange shell (possibly higher), 34–37 for aggro, 33–37 for spellslinger, 40–42 for big mana (possibly higher); the midrange shell carries 11 ramp pieces at mana value 2 or less. **Computed**; measured B3: 35.4 lands, 11.3 core ramp. **Data** [27].

**Bracket 4: Optimized** (shell: 34 lands, 14 cheap ramp, three-mana commander, horizon turn 6)

- First seven: no hand without cheap ramp is a keep; 2 lands with one piece is only just a keep; 1 land with two pieces is a keep. **Computed** (no-ramp −8.3% to −15.4%; 2L1R +2.0%; 1L2R +4.2%).
- Free seven: 3 lands without ramp is a coin flip, 4 lands without ramp leans mulligan, 2 lands without ramp is still a mulligan. **Computed** (−1.2%, −2.0%, −8.9%).
- The hand must either disrupt or threaten to go off, with "some sort of way to speed up your clock". **Community** [68].
- Name the plan card in the keep rule: the mana-optimal rule holds a key card in only 44% of kept hands, against 50% when never mulliganing. **Computed**.
- Expect strict London at the table. **Community** [68].
- Build: 35–38 lands is the shell's plateau; the shell carries 14 ramp pieces at mana value 2 or less, including 0–1-mana acceleration. **Computed**; measured B4: 34.4 lands, 11.6 core ramp with 3.7 at mana value 0–1; ScrollVault's median counts 14 ramp pieces. **Data** [25][27].

**Bracket 5: cEDH** (shell: 28 lands, 21 cheap ramp, two-mana commander, horizon turn 4)

- Default to mulligan: "Do I have a valid reason to keep this hand?" **Community** (expert) [36].
- First seven: keep 1 land with two fast-mana pieces, or 2–3 lands with two or more; one piece with 2–3 lands is a coin flip; every no-ramp hand and every 4-lander is a mulligan. **Computed** (+9.3%, +13.2%, +6.3%; −1.4%, −1.5%; −17.0% to −20.9%; −8.7%, −6.6%).
- Free seven: 2–3 lands with one fast-mana piece is a keep. **Computed** (+8.7%, +8.6%).
- Five and below are normal for fast decks; an early Rhystic Study "is what you mulligan for" even after deep mulligans. **Community** [47][70].
- The reason to keep must be named: a broken engine on turns 1–2, development plus a payoff, or a tutor for the engine; interaction alone is never a keep. **Community** [36][50]. The mana-optimal rule holds a key card in only 58% of kept hands, so the name matters. **Computed**.
- Seats 3–4: ship a mediocre first seven, keep it on the free seven. **Community** [36].
- Bottom late-game value and win conditions first. **Community** [71].
- Build: 24–30 lands is the shell's plateau; post-ban top-4 lists run a median of 26, with 11–12 fast-mana pieces. **Computed** [73]; **Data** [35].

## Implications for MagicAIBuilder

Short and factual; product decisions belong to the specs ([I-28](../specs/i28-commander-deckbuilding-guide-by-bracket.md), [I-21](../specs/i21-reproducible-probability-bench.md)) and the roadmap's [I-07 entry](../roadmap.md). Each row was checked against the code on 2026-11-09.

| #   | File (line)                                                                                                                                                                                                                                                 | What it does today                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | What the evidence says                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Owner                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | [`src/lib/playtest/engine.ts`](../../../src/lib/playtest/engine.ts) (178–201, `applyMulligan`); [`engine.test.ts`](../../../src/lib/playtest/engine.test.ts) (444)                                                                                          | Hand size is `OPENING_HAND_SIZE - mulliganCount`, so the first mulligan goes to six even in multiplayer Commander. The new hand is `7 − N` random cards; the comment (183–185) says this "is the same distribution" as London's draw-seven-and-bottom. The test "draws one fewer card per mulligan (London)" asserts a six-card hand after the first mulligan. The roadmap lists "Opening hand, London mulligan and goldfishing" as shipped under I-07, with a 2026-11-09 correction noting the gap | **Official**: rule 103.5c requires a free first mulligan in multiplayer games and in any Brawl game [1]. Keeping `7 − N` random cards is not the London distribution: the choice of what to bottom is the point of the rule. The engine has per-format configuration (`FORMAT_CONFIG` in [`src/lib/deck/formats.ts`](../../../src/lib/deck/formats.ts), covering commander, brawl, oathbreaker, modern, pauper and others), so a fix must give the free mulligan to multiplayer games and to Brawl, not to one-on-one duels. **Computed**: the engine captures 37–47% of the value of correct multiplayer mulligans, and loses most in fast games | I-07 (engine correctness)        |
| 2   | [`src/lib/playtest/opening-hand-evidence.ts`](../../../src/lib/playtest/opening-hand-evidence.ts) (24, 27); [`src/messages/en/builder.json`](../../../src/messages/en/builder.json) (85, 87) and the same English text in de, es, it, ja, ko, pt, ru and zh | `LAND_LIGHT_MAX = 1` and `LAND_HEAVY_MIN = 5` for every deck, hand size and mulligan stage, ignoring ramp; copy "Land-light: consider a mulligan." and "Land-heavy: consider a mulligan."                                                                                                                                                                                                                                                                                                           | **Computed**: a first seven with 2 lands and no cheap ramp is a mulligan in every shell, and goes unflagged; 1 land with two cheap ramp pieces is a keep in every shell, and is flagged as land-light. The advice is wrong in both directions for the first seven, and the right threshold depends on the deck, the hand size and the stage ([By bracket](#by-bracket))                                                                                                                                                                                                                                                                           | I-07 (evidence copy)             |
| 3   | [`src/lib/deck/turn-one.ts`](../../../src/lib/deck/turn-one.ts); [`src/messages/en/deck.json`](../../../src/messages/en/deck.json) (275)                                                                                                                    | Turn-one odds are computed over the opening seven only; the copy says "Opening seven only — no mulligans, no cantrips."                                                                                                                                                                                                                                                                                                                                                                             | **Computed**: the free mulligan roughly doubles the chance of seeing a given card before keeping: for one specific card in a 99-card library, 7/99 ≈ 7.1% in one seven against 1 − (92/99)² ≈ 13.6% over two [74]                                                                                                                                                                                                                                                                                                                                                                                                                                 | I-07 (evidence copy)             |
| 4   | [I-21 spec](../specs/i21-reproducible-probability-bench.md), requirement 3.1                                                                                                                                                                                | Named policies such as "keep 2 to 5 lands" and "London to 6 then keep"; the free mulligan is not mentioned                                                                                                                                                                                                                                                                                                                                                                                          | **Computed**: land-only rules capture less than half of the free mulligan's value, and in four shells "keep 2–5 lands" under multiplayer rules scores below optimal one-on-one London. A policy set without the free mulligan and without a ramp feature measures the wrong game ([The first seven versus the free seven](#the-first-seven-versus-the-free-seven))                                                                                                                                                                                                                                                                                | I-21 (policies)                  |
| 5   | [`src/messages/en/deck.json`](../../../src/messages/en/deck.json) (816)                                                                                                                                                                                     | The primer template already has a "Mulligan guide" section ("Explain what an opening hand needs.")                                                                                                                                                                                                                                                                                                                                                                                                  | The I-28 deck check could pre-fill it from the deck's own numbers (lands, ramp at mana value 2 or less, commander cost) and the matching bracket and style rules in this document                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | I-28 (guide content, deck check) |

This document is itself I-28 guide content: the in-app guide's mulligan pages should be built from it, and its checklist is the natural input to the "Check my deck against bracket N" requirement of the I-28 spec.

## Open questions and research limits

**Numbers that disagree between sources or notes:**

- **Two per-bracket curves.** The curve tables use EDHREC's curve panel; the model's validation table uses the mana-value distribution of EDHREC's synthesized average-deck lists. Averaged over 100 commanders they differ by up to about one card per slot (B2 at mana value 2: 17.3 against 18.3). EDHREC does not document how the panel is computed; per commander the two disagree far more.
- **The cost of the second mulligan.** Playgroup's last-seat figure is 3.3 points; its all-seat September 2026 report shows 1.3 points between one and two mulligans and 0.6 between keeping and two. Both are reported above; neither is split by bracket.
- **The optimal keep rate.** The model's own summary gave "37–51%"; that is the range of the five bracket shells. Across all eight shells it is 32–51% (spellslinger keeps 32%).
- **Sol Ring sample.** The same Playgroup page is reported as 26,712 games with Sol Ring and as 27,329 games from 8,235 players; the figures used here come with the 26,712 count.

**Gaps:**

- No dataset gives mulligan rates, mulligan depth or win rate by keep, by bracket. Playgroup's figures mix brackets, and EDHTop16 does not record mulligans.
- No measured cEDH game length was found beyond creators' descriptions; the B5 horizon is a judgment.
- No primer could be read from Moxfield; no sourced keep guidance was found for landfall, +1/+1 counters or casual spellslinger; aristocrats rest on two primers.
- No source publishes win rate by archetype for casual Commander; claims that one style "wins more" at B2–B3 would be unsupported.
- No written mulligan policy was found for MagicCon, CommandFest or French tables, and no poll measures house-rule use.

**Next questions for the model:**

- Colour-aware hand classes, so the three-to-five-colour decks the main guide discusses can be judged properly.
- Seat order and a simple opponent clock, so the seat-aware keeps creators describe can be tested.
- Key-card classes per archetype (protection, sac outlet, engine), turning the primers' role requirements into computed margins.
- A deck-specific run: the optimal rule depends on the deck, so the most useful product output is a keep table for the user's own list. Whether that runs in the client or the server is the same question the I-21 spec leaves open.

## Sources

Access notes say when a page was not read directly. Dates are publication dates unless stated.

**Official**

1. Wizards of the Coast, Magic: The Gathering Comprehensive Rules, effective 2026-11-06. https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt
2. Wizards of the Coast, "Commander Brackets Beta Update – October 21, 2025", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
3. Wizards of the Coast (Ian Duke), "The London Mulligan", 2019-06-03. https://magic.wizards.com/en/news/announcements/london-mulligan-2019-06-03
4. Wizards of the Coast, Commander format page, fetched 2026-11-09; searched for "mulligan" together with the eight Commander announcements from 2024-09-23 to 2026-02-09 listed in the main guide's sources, with no hits. https://magic.wizards.com/en/formats/commander
5. Yawgatog, Comprehensive Rules changes, Coldsnap to Time Spiral (2006). https://yawgatog.com/resources/rules-changes/csp-tsp/
6. Yawgatog, Comprehensive Rules changes, Future Sight to Tenth Edition (2007). https://yawgatog.com/resources/rules-changes/fut-10e/
7. Yawgatog, Comprehensive Rules changes, Scars of Mirrodin to Mirrodin Besieged (2011). https://yawgatog.com/resources/rules-changes/som-mbs/
8. Yawgatog, Comprehensive Rules changes, Magic Origins to Battle for Zendikar (2015). https://yawgatog.com/resources/rules-changes/ori-bfz/
9. Yawgatog, Comprehensive Rules changes, Commander 2015 to Oath of the Gatewatch (2016). https://yawgatog.com/resources/rules-changes/c15-ogw/
10. Sheldon Menery (Commander Rules Committee), Star City Games, "Commander Updates For January", 2016-01-21; the RC's decision and reasoning; the original forum post could not be fetched. https://articles.starcitygames.com/articles/commander-updates-for-january/
11. Duel Commander committee, "June 2019 rules and banned/restricted update". https://sites.google.com/view/mtgdc/announcements/2019/june-2019-rules-bannedrestricted-update

**Data**

12. Playgroup.gg, "How Many Lands Should a Commander Deck Run?", updated 2026-11-08 (mulligan counts over 1,608,359 games; 189,535 kept Playgroup Live hands). https://playgroup.gg/commander/how-many-lands
13. Playgroup.gg (Maran), "Playgroup Experiments: testing a fix for going first", 2026-09-09 (257,261 four-player games). https://playgroup.gg/posts/100-playgroup-experiments-testing-a-fix-for-going-first
14. Playgroup.gg, turn-order experiment page, updated 2026-11-09; interim experiment figures are not a result. https://playgroup.gg/commander/turn-order/experiment
15. Playgroup.gg, "Does Going First Matter in Commander?", fetched 2026-11-09; tables not in cache at fetch time. https://playgroup.gg/commander/turn-order
16. Playgroup.gg, "Turn-1 Sol Ring", data through 2026-09-07. https://playgroup.gg/commander/turn-1-sol-ring
17. Playgroup.gg, monthly metagame report for September 2026 (40,897 games), with the January–September 2026 reports in its archive. https://playgroup.gg/metagame/2026/september
18. Playgroup.gg, global game statistics, retrieved 2026-11-09; the mulligan chart did not load. https://playgroup.gg/stats
19. Playgroup.gg, "Commander & EDH Power Level", updated 2026-11-08. https://playgroup.gg/commander/power-level
20. EDHRECast (Joey Schultz), episode 397, "500+ Games of Data! Bracket Accuracy, Format Speed", 2026-01-05; figures from the host's own log, read from a local automatic transcription. https://rss.art19.com/edhrecast
21. Frank Karsten, TCGplayer, "What's an Optimal Mana Curve and Land/Ramp Count for Commander?", 2022-07-15; read through TCGplayer's content API. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
22. Frank Karsten, ChannelFireball, "How Many Lands Do You Need in Your Deck? An Updated Analysis", about July 2022; page returns 404, formula from a search-engine excerpt (as in the main guide). https://strategy.channelfireball.com/home/how-many-lands-do-you-need-in-your-deck-an-updated-analysis
23. teryror, "Mulligans and Mana Bases", GitHub gist, 2020-09-29, updated 2026-09-27. https://gist.github.com/teryror/881d60e08480a56043895d3bbb83c374
24. ScrollVault, Commander land-count study, 2026-03-28 (3.75 million simulated games; commercial, single source). https://scrollvault.net/guides/commander-land-count-data.html
25. ScrollVault, "Commander Deck Ratios by Bracket", data collected 2026-09-07 (6,532 Archidekt decks). https://scrollvault.net/guides/commander-deck-ratios.html
26. EDHTuner, "How many lands in a Commander deck?", data collected July and November 2026 (18,414 Moxfield decks). https://edhtuner.com/how-many-lands-commander-deck
27. EDHREC JSON: commander list (past two years), per-commander and per-bracket average decks, and tag pages, fetched 2026-11-09; curves, ramp and interaction computed by this research for the top 100 commanders (636,055 bracket-tagged decks), with card data from [34]. https://json.edhrec.com/pages/commanders/year.json
28. EDHREC "Top Cards" JSON (past two years, past month, past week; bracket counts), live 2026-11-08, plus 14 Wayback Machine snapshots from 2021-07 to 2026-10; series computed by this research. https://json.edhrec.com/pages/top/year.json
29. EDHREC (MtGDS), "The Deck of Many Things: Card Frequencies by Type and Function Across EDH", 2022-07-05. https://edhrec.com/articles/the-deck-of-many-things-card-frequencies-by-type-and-function-across-edh
30. EDHREC (MtGDS), "Paradigm Shift: How Your Commander's Mana Value Alters Your Curve", 2022-04-14. https://edhrec.com/articles/paradigm-shift-how-your-commanders-mana-value-alters-your-curve
31. EDHREC (Donald Miner), "Superior Numbers – Land Counts", 2019-02-20; data later re-filtered per its editor's note. https://edhrec.com/articles/superior-numbers-land-counts
32. EDHREC, "Superior Numbers – War of the Stats", 2019-06-12. https://edhrec.com/articles/superior-numbers-war-of-the-stats
33. MTGJSON, DeckList (all "Commander Deck" products 2017–2026, Collector's Editions excluded); composition computed by this research. https://mtgjson.com/api/v5/DeckList.json
34. Scryfall API (card data and Tagger oracle tags such as `mana-rock`, `mana-dork`, `land-ramp`, `ritual`, `removal`, `counterspell`, `sweeper`), fetched 2026-11-09. https://api.scryfall.com/cards/search?q=otag%3Aramp+f%3Acommander
35. EDHTop16, tournaments, standings and decklists through 2026-11-07 (read through the site's own persisted queries) and home-page commander statistics, read 2026-11-09; computed by this research. https://edhtop16.com/

**Community press**

36. Matt Sperling, TopDeck.gg, "Can I Keep This? – How to Mulligan in cEDH", 2023-01-06. https://topdeck.gg/articles/can-i-keep-this-how-to-mulligan-cedh
37. John Sherwood, EDHREC, "The EDHREC Guide to Mulligans in Commander", 2026-01-12. https://edhrec.com/guides/the-edhrec-guide-to-mulligans-in-commander
38. Benjamin Nicol, EDHREC, "Solve the Equation – Maybe You Should Mulligan More", 2022-05-24; quotes the RC's 2019 London adoption. https://edhrec.com/articles/solve-the-equation-maybe-you-should-mulligan-more
39. Herko Kerghans, Draftsim, Commander mulligan rules, 2026-03-09. https://draftsim.com/mtg-commander-mulligan-rules/
40. Geeky Domain, Commander mulligan guide, 2026-05-28; no author named; single commercial source. https://geekydomain.com/blogs/guides/mtg-commander-mulligan-guide
41. Mike Carrozza, EDHREC, "Am I The Bolas? – Enforcing the Mulligan Rules", 2025-04-03. https://edhrec.com/articles/am-i-the-bolas-enforcing-the-mulligan-rules
42. Cas Hinds, EDHREC, "Should We Be Strict About Mulligans in Commander?", 2025-07-14. https://edhrec.com/articles/should-we-be-strict-about-mulligans-in-commander
43. Cas Hinds, EDHREC, "Is Your Local Meta Making You a Worse Commander Player?", 2026-09-07. https://edhrec.com/articles/is-your-local-meta-making-you-a-worse-commander-player
44. Sheldon Menery, Star City Games, "Let's Talk Mulligans", 2015-10-08. https://articles.starcitygames.com/articles/lets-talk-mulligans/
45. Sheldon Menery, Star City Games, "Commander Speed Creep: Can We Solve It?", 2022-03-17. https://articles.starcitygames.com/magic-the-gathering/commander-speed-creep-can-we-solve-it/
46. Paulo Vitor Damo da Rosa, Star City Games, "The Mulligan Decision Nobody Talks About", 2022-01-06; 60-card formats. https://articles.starcitygames.com/magic-the-gathering/select/the-mulligan-decision-nobody-talks-about/
47. Drake Sasser, Commander's Herald, "An Introduction to RogSi in cEDH", 2023-11-23. https://commandersherald.com/an-introduction-to-rogsi-in-cedh/
48. Ken Baumann, Commander's Herald, "A cEDH Field Guide", 2023-08-09. https://commandersherald.com/a-cedh-field-guide/
49. Ken Baumann, Commander's Herald, "Escaping Midrange Hell in cEDH", 2024-01-16. https://commandersherald.com/escaping-midrange-hell-in-cedh/
50. Harvey McGuinness, EDHREC, "EDHREC Guide to cEDH Turbo", 2025-08-05. https://edhrec.com/guides/edhrec-guide-to-cedh-turbo
51. Harvey McGuinness, EDHREC, "EDHREC Guide to cEDH Midrange", 2025-07-08. https://edhrec.com/guides/cedh-midrange
52. Harvey McGuinness, EDHREC, "EDHREC Guide to cEDH Stax", 2025-09-02. https://edhrec.com/guides/edhrec-guide-to-cedh-stax
53. Harvey McGuinness, EDHREC, "EDHREC Guide to Mana in cEDH", 2025-10-28. https://edhrec.com/guides/edhrec-guide-to-mana-in-cedh
54. Harvey McGuinness, Commander's Herald, "Five Post-Ban cEDH Lessons", 2024-10-12. https://commandersherald.com/five-post-ban-cedh-lessons/
55. Harvey McGuinness, EDHREC, "The Biggest Meta Changes in the History of cEDH", 2026-03-31. https://edhrec.com/articles/the-biggest-meta-changes-in-the-history-of-cedh
56. DougY, EDHREC, "The Top 10 cEDH Decks of 2025", 2025-12-19. https://edhrec.com/articles/the-top-10-cedh-decks-of-2025
57. A.L. Walser, Draftsim, "The Ultimate Guide to Threat Assessment in Commander", 2025-06-16. https://draftsim.com/mtg-commander-threat-assessment/
58. Brian Cain, EDHREC, "Commander Mana Curves for Beginners", 2025-01-06. https://edhrec.com/articles/commander-mana-curves-for-beginners
59. Kristen Gregory, Card Kingdom, "How to Spot Power Creep in Commander", 2021-08-02. https://blog.cardkingdom.com/how-to-spot-power-creep-in-commander/
60. Scott Cullen, Card Kingdom, "Choosing the Right Protection for Your Commander", 2022-04-19. https://blog.cardkingdom.com/choosing-the-right-protection-for-your-commander/
61. MTG Wiki, "Mulligan", fetched through the mtg.fandom.com API on 2026-11-09 (mtg.wiki returned 403). https://mtg.fandom.com/wiki/Mulligan
62. cEDH Decklist Database, deck descriptions, retrieved 2026-11-09. https://cedh-decklist-database.com/
63. Card Kingdom blog, on the December 2025 Competitive Brawl event; search snippet only, unverified. https://blog.cardkingdom.com/competitive-brawl-debuts-as-closest-thing-to-officially-sanctioned-cedh/

**Creators**

64. The Command Zone (Jimmy Wong and co-host "DJ"), episode 504, "How to Mulligan", 2022-12-14; quotes from a local automatic transcription. https://youtu.be/aWoEzXLUppM
65. The Command Zone (Rachel Weeks with Josh Lee Kwai), episode 658, "Commander Deckbuilding Template for the New Era", 2025-02-18; quotes from a local automatic transcription. https://www.youtube.com/watch?v=9m6LEdczgWY
66. The Command Zone (Rachel Weeks and Jimmy Wong), episode 671, "What's Wrong with the Commander Brackets?", 2025-04-30; quotes from a local automatic transcription. https://edhrec.com/articles/the-command-zone-whats-wrong-with-the-commander-brackets-the-command-zone-671-mtg-edh-magic-gathering
67. The Command Zone, episode 690, "When Your Deck is Too Good (But Also Too Bad)", 2025-08-01; quotes from a local automatic transcription. https://youtu.be/I6kd3ggg81w
68. The Command Zone (Rachel Weeks with Joe Johnson), episode 731, "What's Up w/ Bracket 4?", 2026-03-17; quotes from a local automatic transcription. https://www.youtube.com/watch?v=jzeTz9clIC8
69. The Command Zone (Rachel Weeks and Jimmy Wong), episode 745, "How to Play Commander", 2026-06-03; quotes from a local automatic transcription of the podcast audio. https://feeds.megaphone.fm/STU7163382979
70. Play to Win Podcast (Cam and Dylan), cEDH episode on Rhystic Study and mulligans; attributed to "A cEDH Perspective on the Commander Bracket Update" (2025-10-31) from the transcript file name, date not verified; quotes from a local automatic transcription. https://redcircle.com/shows/b30bfbce-8d24-4f58-b823-7083cb16f3ce/episodes/1149be62-5022-4500-a3f3-9bea4b05431d
71. Archidekt deck primers, read through the public deck API on 2026-11-09 (field `description`); bracket as declared by the author, date of last update unless "created" is stated:
    - Aggro, tokens and typal: Breena, the Demagogue (B3, D_What, 2026-08-15) https://archidekt.com/decks/8053913 · Katara go-wide Allies (B2, JDGhost, 2026-08-11) https://archidekt.com/decks/21726687 · Giada tokens (B3, iFrosty_U, 2026-10-03) https://archidekt.com/decks/20546497 · Lathril elves (B3, xStingrayx, 2026-11-07) https://archidekt.com/decks/1656813 · Krenko goblins (B4, AngelBeatz, created 2026-05-31) https://archidekt.com/decks/23098415
    - Voltron: Sigarda enchantress voltron (B3, BlakeWSP, 2026-10-16) https://archidekt.com/decks/345518 · Licia (B2, MythicGoose, 2026-09-25) https://archidekt.com/decks/2637484 · Shu Yun (unbracketed, Amorph0us, 2026-07-09) https://archidekt.com/decks/877309
    - Aristocrats: Dina (B3, Camshaft, 2026-10-02) https://archidekt.com/decks/1941994 · Wilhelt zombies (B4, Wertos, 2026-11-08) https://archidekt.com/decks/5072301
    - Spellslinger and artifacts: Vivi Ornitier storm (B5, alexmorris092, 2026-10-01) https://archidekt.com/decks/13764494 · Urza, Lord High Artificer "but it's Bracket 2" (B2, \_HaP, 2026-10-20) https://archidekt.com/decks/16889459
    - Big mana and reanimator: "Little Halfling, Big Mana" (B3, Market_Gnome, created 2025-12-31) https://archidekt.com/decks/18575118 · Zacama (B3, Mohses, 2026-09-26) https://archidekt.com/decks/8930589 · Teval big-mana reanimator (B2, nevanda, 2026-10-21) https://archidekt.com/decks/13432781 · Obeka reanimator (B3, bmccartn, created 2025-11-22) https://archidekt.com/decks/17638606
    - Control: Minn illusions (B3, HiImSmee, 2026-11-07) https://archidekt.com/decks/5949101 · Uyo, Silent Prophet (B4, CultofWoe, 2026-11-08) https://archidekt.com/decks/13532115 · Tatsunari (B5, Neo_Ender_Man, 2026-10-27) https://archidekt.com/decks/2379181
    - Group hug and pillowfort: Kynaios and Tiro (B3, raz0rb0t, created 2026-06-20) https://archidekt.com/decks/23677420 · Queen Marchesa (B3, nevanda, 2026-11-06) https://archidekt.com/decks/9253386 · Rocco (B2, nevanda, 2026-11-02) https://archidekt.com/decks/12017718
    - cEDH: Thrasios/Tymna midrange (B5, Clutchness, 2026-10-25) https://archidekt.com/decks/1727139 · Kraum/Tymna "Blue Farm" (B5, Clutchness, 2026-09-28) https://archidekt.com/decks/3384924 · Kinnan (B5, IsaBaguette, 2026-11-08) https://archidekt.com/decks/26554156
72. mcapra, "B5 Kenrith" deck notes, updated 2025-09-13. https://mcapra.github.io/posts/mtg_decklists/b5-kenrith

**Computed**

73. This document's opening-hand model: `model.mjs`, `profiles.mjs`, `validate.mjs`, `analyze.mjs`, `margins.mjs` and `sweep-styles.mjs`, run on 2026-11-09 with seeded mulberry32 draws (150,000–250,000 hands per hand size and shell). [`scripts/research/commander-opening-hands/README.md`](../../../scripts/research/commander-opening-hands/README.md)
74. Exact hypergeometric probabilities for a 99-card library and seven-card hands, calculated for this document on 2026-11-09.
