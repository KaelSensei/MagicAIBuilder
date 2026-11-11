# Building a Commander Deck, Bracket by Bracket

> **Initiative:** [I-28](../roadmap.md) · **Spec:** [Commander deckbuilding guide by bracket](../specs/i28-commander-deckbuilding-guide-by-bracket.md)
>
> **Companion:** [Opening hands, mana curves and play style in multiplayer Commander](commander-mulligans-curves-and-play-style.md): the free mulligan, keep rules, curves and trends in depth, with this guide's own simulation
>
> **Researched:** 2026-11-08; mulligan and curve sections extended 2026-11-09
>
> **Rules state:** bracket text of 2025-10-21; Game Changers list of 2026-02-09 (53 cards); banned list unchanged at the 2026-10-12 announcement; next announcement 2026-11-30.
>
> **Review:** re-check after every WotC bracket, Game Changers or banned-list announcement.

This guide explains how to build a Commander deck for each of the five official brackets: what the rules require, what the table expects, which cards fill each role at that power level, and how to tell when a deck has drifted into a different bracket. It is written for three readers at once: the in-app guide (I-28), the AI copilot and bracket analysis code, which need precise and traceable numbers, and the team, when a rules update lands.

## How to read this guide

Every claim carries one of three evidence labels, in bold, at the start of the sentence or table column it governs:

| Label         | Means                                                                                                                                        | Always carries                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Official**  | Wizards of the Coast (WotC) text, the official Game Changers list, the official banned list, or the Comprehensive Rules                      | The source, quoted where the wording matters                                                                                                       |
| **Data**      | A number someone measured or computed                                                                                                        | Who measured it, the sample size and the date                                                                                                      |
| **Community** | The opinion of a named writer, creator, forum or panel member writing in a personal capacity                                                 | One qualifier: _consensus_ (several independent sources agree), _contested_, or _single source_                                                    |
| **Computed**  | This project's own simulation of opening hands and goldfished turns ([scripts](../../../scripts/research/commander-opening-hands/README.md)) | The deck shell, the horizon turn and the sample size; method and limits in the [companion](commander-mulligans-curves-and-play-style.md#the-model) |

Ranges marked **Recommended** in the _Target composition_ tables are this guide's synthesis, not evidence. Each row names the evidence it rests on, so it can be re-derived when the data moves.

Bracket sections share the same sub-headings so the in-app guide can map them one to one. Brackets 1–4 carry an _Opening hand and mulligans_ sub-heading; Bracket 5 replaces it with _Mulligans, draws and proxies_ and adds _Archetypes and the current field_, because competitive play needs them.

**Research limits.** Read these before trusting any single number:

- **Reddit was largely inaccessible.** Direct access, the JSON API, the archives and most mirrors refused. Two threads were read in full through a snapshot archive; everything else from Reddit comes from search-engine snippets, without vote counts.
- **Video content comes through podcast audio.** YouTube watch pages and transcript services were blocked. The research pulled the creators' podcast feeds and transcribed the key episodes locally with automatic speech recognition (faster-whisper `base.en`; a multilingual model for French). Quotes marked "transcript" are close paraphrases that may carry recognition errors; card names in them were checked against card data. YouTube-only channels (Commander's Quarters, Tolarian Community College, Jumbo Commander, MTGMuddstah, Game Knights videos) appear only by title, if at all.
- **Several outlets refused the research tools:** MTGGoldfish, Wargamer and Moxfield's help pages (HTTP 403), turnzerohq (403), the cEDH wiki (402). TCGplayer pages render client-side and were seen only as search summaries.
- **Every dataset uses self-reported brackets.** Archidekt and Moxfield decks carry the bracket their owner chose (or a tool estimated); nobody audited the labels. The medians describe how players label decks, not a verified power ladder.
- **Role counts are automated.** Ramp, draw, removal, tutor and counterspell counts come from Scryfall oracle tags or rules-text matching. Spot removal in particular is undercounted (counterspells, bounce and edicts fall outside the heuristic).
- **The three large datasets come from commercial tool sites** (Playgroup.gg, ScrollVault, EDHTuner) with self-declared methods. They agree with each other often enough to be useful; none is peer-reviewed.
- **Game length by bracket rests on one creator's log.** No large dataset splits game length by bracket. The only per-bracket figures are a podcast host's own record of a few hundred games [69]; everything else about pacing comes from official expectations and experienced players.

Prices are Scryfall's default printing in USD, retrieved 2026-11-08 [101]. **Prices move;** treat every figure as dated.

## The bracket system in one page

### The official table

| Bracket | Name       | Game Changers | Mass land denial | Extra turns    | Two-card combos    | Expect to play at least |
| ------- | ---------- | ------------- | ---------------- | -------------- | ------------------ | ----------------------- |
| 1       | Exhibition | None\*        | None             | None\*         | None\*             | 9 turns                 |
| 2       | Core       | None          | None             | No chaining    | None               | 8 turns                 |
| 3       | Upgraded   | Up to 3       | None             | No chaining    | None before turn 6 | 6 turns                 |
| 4       | Optimized  | Unlimited     | No restriction   | No restriction | No restriction     | 4 turns                 |
| 5       | cEDH       | Unlimited     | No restriction   | No restriction | No restriction     | Any turn                |

**Official.** \*"Exceptions can be made for highly thematic cards." "Two-card combos" means "game-enders, lockouts or infinites", not only infinites [2]. The restriction lines exist officially only as a graphic by Commander Format Panel (CFP) member Rachel Weeks, linked from the October 2025 article [1][2]; the format page states the Game Changer counts in text and still calls the system "beta" [9]. Brackets 4 and 5 are restricted only by the banned list.

**Official.** Mass land denial means cards that "regularly destroy, exile, and bounce other lands, keep lands tapped, or change what mana is produced by four or more lands per player without replacing them", for example Armageddon, Ruination, Sunder, Winter Orb and Blood Moon [3].

**Official.** The turn numbers are floors, not averages: "when Bracket 3 says 'you should expect to be able to play at least six turns before you win or lose,' that means that someone's seventh turn is when you would be satisfied if the game ended." They are soft: one early game does not throw a deck out of its bracket [1].

**Community** (_consensus_ among creators). The numbers are widely misread. "At least six turns" does not mean Bracket 3 games end on turn 6; losses start around turn 7, which sits one turn apart from "no two-card combos before turn six": "those two phrases are not the same thing" (EDHRECast, transcript) [68]. Rachel Weeks, who drew the official graphic, frames the number as "a turn you expect to still be playing at… I don't know when my decks can win a game… But I know when I'd be upset if I died" (transcript) [65].

### Intent over checklist

**Official.** The checklist is the least important layer. In WotC's own order:

1. **Intent.** "Intent is the most important part of the bracket system" [4]. The per-bracket "Players expect" text is the "North Star" [1].
2. **The turn floor** [1].
3. **The hard restrictions and the Game Changer count** [2][9].

**Official.** The checklist is a floor, not a ceiling. "You can always 'bracket decks up'… If you make a fully tricked-out Goblin deck that uses no Game Changers, it's probably not a Core deck despite technically meeting the deck-building rules" [4]. Building "technically in bounds… but substantially stronger than what other people are doing at that bracket so you can stomp them" makes you "a bad actor" [4]. And "the bracket system is emphatically not just 'put your deck into a calculator, get assigned a rank, and be ready to play'… any estimate is just an estimate" [4].

**Official.** One bracket apart is usually fine: "you can usually wiggle within one bracket away from you safely. Bracket 2s playing against Bracket 3s can work fine—but what this system is really trying to avoid is Bracket 2s playing against Bracket 4s" [3], reaffirmed in 2026 for 2 against 3 and 3 against 4 [6].

**Official.** The brackets are "a tool to guide pregame conversations—not an ultimate arbiter of who can play against whom" [6]. Rule zero, "the ability to allow things with a pregame discussion", is "always active for people at all bracket levels (other than cEDH)" [1].

The CFP graphic labels what separates each pair of brackets, which is the most useful single summary of the system [2]. Its author, Rachel Weeks, explained each arrow on The Command Zone the day after the update (**Community**, _single source_ but from the panel member who drew it; transcript) [65]:

| Step  | **Official** arrow [2] | What it means, in Rachel Weeks' words [65]                                                                                                                                                              |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 ↔ 2 | THEME                  | "Prioritizing the theme over mechanics", where theme means narrative, art or story: "a cycling theme deck doesn't mean it's a one"                                                                      |
| 2 ↔ 3 | STAPLES                | "If your deck is full of cards that get played a ton… Skullclamps, really powerful top end, you're probably a three; if you're really focused on synergy or budget, that might put you down into a two" |
| 3 ↔ 4 | SPEED                  | "A lot of fast mana, rituals, every one-mana dork… free disruption"; Bracket 3 decks "do powerful or over-the-top stuff but are not focused on getting that done as fast as possible"                   |
| 4 ↔ 5 | METAGAME               | "If you haven't considered the metagame of cEDH at large when you built your deck, you're four"                                                                                                         |

**Official.** The graphic colours Brackets 1–3 "Casual Mindset" and Brackets 4–5 "Competitive Mindset" [2].

### Two changes everyone still gets wrong

- **Tutors are no longer restricted.** **Official.** On 2025-10-21 WotC chose to "remove the tutor restrictions from Commander Brackets entirely and rely on Game Changers to catch the most efficient tutors", because "with no game-ending combos at the lower brackets and turn restrictions listed in each bracket's intent, it helps curb those issues" [1][24]. The February 2025 "Tutors should be sparse" line for Brackets 1–2 is superseded [3]. **Community** (_consensus_): "few" was undefinable (is a fetchland a tutor? Expedition Map?), and "tutors are only as powerful as the thing they are tutoring for" (The Command Zone, transcript) [65][68]. The flip side: Bracket 2 can now host non-Game Changer tutor toolboxes for a "hidden commander", so judge what a tutor finds, not how many tutors there are [68].
- **Precons are no longer anchored to Bracket 2.** **Official.** Launch text said "the average current preconstructed deck is at a Core (Bracket 2) level" [3]. Since 2025-10-21: "Core is still a great landing point for people, but that doesn't have to be tied to precons" [1]. WotC prints no bracket on precon decklist pages [15] and still puts Game Changers in precons: "many precons have included Farewell… they definitely will!" [6].

### The Game Changers list (53 cards, 2026-02-09)

**Official** list, confirmed through Scryfall's `game_changer` flag on 2026-11-08 [16][101]. Grouped as WotC groups it:

| Colour          | Cards                                                                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| White (7)       | Drannith Magistrate, Enlightened Tutor, Farewell, Humility, Serra's Sanctum, Smothering Tithe, Teferi's Protection                                                                                        |
| Blue (10)       | Consecrated Sphinx, Cyclonic Rift, Fierce Guardianship, Force of Will, Gifts Ungiven, Intuition, Mystical Tutor, Narset, Parter of Veils, Rhystic Study, Thassa's Oracle                                  |
| Black (10)      | Ad Nauseam, Bolas's Citadel, Braids, Cabal Minion, Demonic Tutor, Imperial Seal, Necropotence, Opposition Agent, Orcish Bowmasters, Tergrid, God of Fright, Vampiric Tutor                                |
| Red (3)         | Gamble, Jeska's Will, Underworld Breach                                                                                                                                                                   |
| Green (7)       | Biorhythm, Crop Rotation, Gaea's Cradle, Natural Order, Seedborn Muse, Survival of the Fittest, Worldly Tutor                                                                                             |
| Multicolour (4) | Aura Shards, Coalition Victory, Grand Arbiter Augustin IV, Notion Thief                                                                                                                                   |
| Colourless (12) | Ancient Tomb, Chrome Mox, Field of the Dead, Glacial Chasm, Grim Monolith, Lion's Eye Diamond, Mana Vault, Mishra's Workshop, Mox Diamond, Panoptic Mirror, The One Ring, The Tabernacle at Pendrell Vale |

**Official.** The criteria: cards that "easily and dramatically warp Commander games, allowing players to run away with resources, shift games in ways that many players find unpleasant, block people from playing, efficiently search for any of their strongest cards without downside, or have commanders that are highly unfun in casual games" [1]. Since October 2025 the panel is moving away from "High-mana value cards" and "Legends that are just powerful commanders" [1]. Unbanned cards go straight onto the list (Lutri, the Spellchaser is the single exception) [5][7], and future bans "are likely to come from this list" [3].

**Official.** Sol Ring is deliberately not a Game Changer: "Every deck gets exactly one Sol Ring" [3]. Nor are Mystic Remora, Mana Drain, Craterhoof Behemoth, The Great Henge, Green Sun's Zenith or Chord of Calling, all considered and explicitly not added in April 2025 [4].

### Official French names (for the French UI)

**Official.** WotC's French articles call the brackets **catégories** and the Game Changers **Cartes à impact** [119][120].

| Bracket | English    | Official French |
| ------- | ---------- | --------------- |
| 1       | Exhibition | Exhibition      |
| 2       | Core       | Basique         |
| 3       | Upgraded   | Amélioré        |
| 4       | Optimized  | Optimisé        |
| 5       | cEDH       | cEDH            |

Other official terms: mass land denial "refus de terrains massif", two-card infinite combos "combos infinis à deux cartes", extra turns "tours supplémentaires", tutors "tuteurs", Rule 0 "règle zéro", precon "deck préconstruit" [119].

**Community** (_consensus_). French creators and at least one Geneva store say "bracket" and "Game Changers" in English, even while linking the official French page [121][122][123][124]. A label such as "Catégorie 3 — Amélioré (bracket 3)" matches both. Brackets were written for multiplayer Commander, not Duel Commander, which still runs separate tournaments in France.

**Official.** The French-speaking community has a seat on the panel: WotC lists "Bandit (@BanditMTG1), France" among the founding members [11], and he signed the February 2026 update [6]. His channel explains the system (an FAQ video, title only) [126] but, like every French creator found, publishes no per-bracket build guide. **Community** (_single source_, launch-era rules): Magic C'est Chic !, who runs a monthly Commander night in Lille, called the brackets "très très bonne initiative" while insisting "la Rule 0 reste le critère le plus important"; his line between 4 and 5 is "en cEDH, tu joues la win à tout prix… le bracket 4 cherche à optimiser un deck sans vouloir obtenir la victoire absolument" (French transcript, approximate) [125].

### Timeline

| Date       | What changed                                                                                                                                                                                                            | Source    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 2024-09-23 | Rules Committee bans Mana Crypt, Jeweled Lotus, Dockside Extortionist and Nadu, Winged Wisdom. All four are still banned; none is a Game Changer.                                                                       | [13][101] |
| 2024-09-30 | WotC takes over management of Commander from the Rules Committee.                                                                                                                                                       | [10]      |
| 2024-10-22 | Commander Format Panel announced; the bracket beta is postponed so the panel can iterate.                                                                                                                               | [11]      |
| 2025-02-11 | Beta launch: five brackets, 40 Game Changers, Bracket 2 anchored to precons, "Tutors should be sparse" in Brackets 1–2.                                                                                                 | [3]       |
| 2025-04-22 | Game Changers 40 → 61: 18 new, 5 unbanned (Gifts Ungiven, Sway of the Stars, Braids, Cabal Minion, Coalition Victory, Panoptic Mirror), 2 removed (Trouble in Pairs, Trinisphere). "Intent is the most important part." | [4][5]    |
| 2025-10-21 | Current definitions: "Players expect" text, turn floors 9/8/6/4/any, tutor restriction removed, precon anchor removed, Game Changers 61 → 51.                                                                           | [1][2]    |
| 2025-12-11 | First CFP rotation; no format change.                                                                                                                                                                                   | [12]      |
| 2026-02-09 | Game Changers 51 → 53 (Farewell; Biorhythm on its unban). Lutri, the Spellchaser unbanned but banned as a companion. "We really want to cool it on bracket-level changes."                                              | [6][7]    |
| 2026-10-12 | General banned-and-restricted announcement with no Commander section. Next announcement 2026-11-30.                                                                                                                     | [8]       |

**Official.** The ten October 2025 removals were Expropriate, Jin-Gitaxias, Core Augur, Sway of the Stars and Vorinclex, Voice of Hunger (high mana value); Kinnan, Bonder Prodigy, Urza, Lord High Artificer, Winota, Joiner of Forces and Yuriko, the Tiger's Shadow ("power alone isn't a reason to list it"); Deflecting Swat ("a notch below the free countermagic"); and Food Chain (a combo card the combo rules already cover) [1]. Sixty-five cards have been on the list at some point; twelve have come off and none has returned.

The February 2026 article promised a check-in "likely in May or June" and a possible end to the beta "later this year" [6]. Neither was found by 2026-11-08, so treat the current state as stable but still officially beta.

## Foundations that apply to every bracket

### The roles of a Commander deck

Every deck fills the same jobs; brackets change the _quality_ and _speed_ of the cards in each job far more than the number of slots.

- **Lands** and **ramp**: mana now and mana sooner. Ramp includes land search, mana rocks, mana creatures ("dorks"), rituals and cost reducers.
- **Card advantage**: draw, impulse draw, card-generating engines.
- **Targeted interaction**: removal, counterspells, bounce, edicts.
- **Mass interaction**: board wipes.
- **Protection**: for your commander, your board or your winning turn.
- **Tutors**: cards that search for a specific card. Land search is a tutor in tag databases but plays as ramp.
- **Win conditions**: how the deck actually ends a game.
- **Plan cards**: the synergy pieces that make this deck this deck.

### The Command Zone template and how real decks deviate

**Community** (_consensus_, the most cited template). The Command Zone's episode 658 (2025-02-18, Rachel Weeks with Josh Lee Kwai) states it as "every deck needs 10 pieces of ramp, 12 pieces of card advantage, 12 pieces of targeted disruption, six mass disruption, 38 lands and 30 plan cards", with overlap expected (transcript) [58]. What each slot means, per the episode:

| Slot                | Count        | What counts, and why                                                                                                                                                                                                                    |
| ------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lands               | 38           | Modal double-faced cards and one-mana landcyclers count. With 38 you are only 54.8% to hold 3+ lands in your opening seven; "the natural inclination of almost everybody is to cut lands." Rachel's own average is 37 (35 plus 2 MDFCs) |
| Ramp                | 10, up to 12 | "Pretty low actually": 10 gives 54% to have one in the opener, 12 gives 70.4% to have a two-mana rock by turn 2. More with a 4-mana commander, fewer with a 2-mana one                                                                  |
| Card advantage      | 12           | One card that becomes more; impulse draw counts, cantrips and looting do not. Many players run 15–20+                                                                                                                                   |
| Targeted disruption | 12           | Removal, counterspells, bounce, graveyard hate; protecting your own plan does not count                                                                                                                                                 |
| Mass disruption     | 6            | Up from the old 2–3 wipes: wipes, one-sided mass effects (Bane of Progress), mass bounce, Cyclonic Rift; a suggested mix of a couple of creature wipes, one artifact or enchantment sweeper, one graveyard answer                       |
| Plan                | About 30     | Enablers, payoffs and enhancers in proportions set by the commander's role                                                                                                                                                              |

The curve is approximate: the transcript gives about 9 one-drops, 18 two-drops, 15 three, 10 four, 5 five and 5 six-plus, while a secondary summary gives 14 / 10 / 4 / 3–4 for three to six-plus [58]. Two is the biggest slot either way. The episode's own caveat matters most: "it's a recommendation for the average deck and in commander there just is no average deck; there's no average power level" (transcript) [58]. The only power adjustment it makes is for cEDH, which plays "zero and one mana ramp, rituals" because games "end by turn five", against casual games that "go to turn nine, ten" [58]. The follow-up episode called templates "over-simplified… you can't expect to paint-by-numbers" (chapter list only) [59], and no newer template had been published by 2026-11-08 [58]. **No creator found publishes per-bracket slot counts.**

**Community** (_single source_). EDHREC's 2025 upgrade guide uses lighter targets: about 10 ramp (7 as a floor, 15–20 for big-mana decks), about 10 removal (5–7 for aggro, 15+ for control), 12+ card advantage, at least 2 wipes, at least 1 graveyard hate, with 34-land sample lists [21].

**Data.** Neither template is bracket-specific, and real decks deviate in the same direction everywhere below cEDH: fewer lands than 38 (medians 35–37), more ramp than 10 (medians 10–14), less draw than 12 (medians 8–10) [95][97]. The gap between 6 mass disruption and a median of 2 wipes is mostly definitional: the template counts one-sided effects and mass bounce too. The template fits Brackets 2–3 best; Bracket 1 trades efficiency for theme, Bracket 4 cuts lands as the curve drops, and Bracket 5 is a different shape.

### Land count: Karsten's math

**Data** (Frank Karsten, Monte Carlo simulation of 99-card decks against a goldfish, 2022) [98]:

- "Start with 42 lands plus a [Sol Ring], then cut a land for every two or three additional mana rocks you add. You could also cut a land for every three or four cheap cantrips… and cut a land for every three or four mana dorks… But in general, for medium-power midrange Commander decks, try not to go below 37 lands."
- The model counts the free mulligan, the starting player's draw and the commander as a free spell. It is explicitly not for cEDH: "my model won't be useful for cEDH where players win on turn three."
- Small deviations from the optimum cost almost nothing (99.96% of optimal for one alternative build); cutting six lands for six three-drops drops to about 98%.
- "If your Commander costs N mana, then the optimal deck in my simplified model contains zero N-drops."

**Data** (Karsten, regression over more than 95,000 winning 60-card tournament decks, scaled to 99 cards) [99]: lands = 31.42 + 3.13 × average mana value of spells − 0.28 × number of cheap card draw or ramp spells. **Source corrected 2026-11-10:** the ChannelFireball page returns 404, but TCGplayer serves the article, dated 2022-07-29 and updated 2025-02-13, with the same formula. It is a scaling of 60-card data, not a fit to Commander decks. Worked through by the research for this guide:

| Average mana value | Cheap draw or ramp | Lands |
| ------------------ | ------------------ | ----- |
| 3.3                | 8                  | 39.5  |
| 3.0                | 10                 | 38.0  |
| 2.8                | 18                 | 35.1  |
| 2.1                | 30                 | 29.6  |

The formula alone reproduces most of the spread from precon-shaped decks down to cEDH, provided fast mana and cantrips count as "cheap draw or ramp".

**Data** (Karsten, coloured sources for a 99-card deck assuming 41 lands, free mulligan and turn-1 draw, 2022) [100]. "Consistent" means at least (89 + M)% to have the sources by turn M:

| Cost | Sources | Cost | Sources | Cost | Sources |
| ---- | ------- | ---- | ------- | ---- | ------- |
| C    | 19      | CC   | 30      | CCC  | 36      |
| 1C   | 19      | 1CC  | 28      | 1CCC | 33      |
| 2C   | 18      | 2CC  | 26      | 2CCC | 30      |
| 3C   | 16      | 3CC  | 23      | 3CCC | 28      |

Partial sources [100]: a fetchland counts fully for each colour it can find; a Signet or Talisman counts 0.75 per colour for spells of mana value 3+; a dork 0.5 for spells of mana value 2+; two-mana land ramp 0.75 for mana value 3+; a Treasure 0.25; Exotic Orchard 0.75 of any colour; Fellwar Stone 0.5; tapped lands count from turn 2. Add one source per colour for gold cards. These counts are hard to reach in three-to-five-colour decks, which is why fixing ramp matters more as colours rise.

**Data** (Playgroup.gg, 189,535 opening hands and 1,608,359 logged games, updated 2026-11-08) [92]: 89% of kept hands held 2–4 lands; 64% of players kept their first seven, 24% took one mulligan, 9% two, 3% three or more. In four-to-six-player pods, win rate is flat at 28–29% for openers with 2 to 5 lands, and drops to 25% with 1 or 6 lands and 17% with none. Playgroup itself recommends 38–42 lands for a typical casual deck ("directional, not a verdict").

**Data** (EDHTuner, solo goldfish of 10,794 Moxfield decks, 1,500 games each, collected July and November 2026) [97]:

| Lands | Miss a land drop by turn 4 | Miss two or more |
| ----- | -------------------------- | ---------------- |
| ≤31   | 39%                        | 12%              |
| 34–35 | 26%                        | 6%               |
| 36–37 | 23%                        | 5%               |
| 38–39 | 20%                        | 4%               |
| ≥40   | 16%                        | 3%               |

Read together: one land more or less is a small effect, mana screw in multiplayer mostly costs tempo rather than games, and real decks below cEDH run one to three lands fewer than Karsten's math suggests. **Community** (_single source_): low land counts plus lenient mulligans make a deck look more explosive than it is and hide how often it stumbles [35].

### The free mulligan

**Official** (Comprehensive Rules effective 2026-11-06) [14]:

- **103.5c:** "In a multiplayer game and in any Brawl game, the first mulligan a player takes doesn't count toward the number of cards that player will put on the bottom of their library or the number of mulligans that player may take." Rule 800.6 repeats it for multiplayer.
- **800.7:** "In a multiplayer game other than a Two-Headed Giant game, the starting player doesn't skip the draw step of their first turn."

A one-on-one Commander game that is not Brawl gets no free mulligan under 103.5c. The rule has been in the multiplayer rules since 2007 and survived the 2019 London mulligan unchanged ([history](commander-mulligans-curves-and-play-style.md#history)).

**The free mulligan is the most important single fact about opening hands in Commander**, and it changes how decks should be built and how hands should be kept. The [companion document](commander-mulligans-curves-and-play-style.md) treats it in depth. The short version:

- **Computed** (eight deck shells tuned to the 2026 bracket medians; 150,000–250,000 simulated games per hand size): played well, mulligans add 5–10% more mana spent by the turns that decide the game, and the free mulligan supplies a third to a half of that. Capturing it means **judging the first seven against a fresh seven of the same deck, not against a six**. The goldfish-optimal player keeps the first seven only 32–51% of the time, and keeps the second seven 51–82% of the time.
- **Computed:** cheap ramp (mana value 2 or less) decides keeps more than land count does. Below cEDH:
  - a 2–4-land first seven with one cheap ramp piece is a keep, or at worst a coin flip (a spellslinger shell with four lands);
  - a 2-land first seven without ramp is a mulligan;
  - 1 land with two cheap ramp pieces is a keep.

  Where the line falls depends on the deck and the game's speed: a hand is compared with a fresh seven from the same list. [Keep rules by hand](commander-mulligans-curves-and-play-style.md#how-picky-to-be-keep-rules-by-hand).

- **Data** (Playgroup.gg, 257,261 four-player games; [details](commander-mulligans-curves-and-play-style.md#how-players-actually-mulligan)): the fourth seat wins 21.5% after keeping seven, 22.4% after the free mulligan and 19.1% after two mulligans. The free mulligan costs nothing measurable; the second one does.
- **Data:** players keep the first seven 64% of the time [92], and keep two-land hands about as often as they are dealt them. The model sends most two-landers without ramp back on the first seven.
- **Computed:** once mulligans are played well, the land-count curve is flat. In the Bracket 2 shell, going from 32 to 40 lands adds 2% more mana spent by turn 8, against 7% with no mulligans. With the free mulligan, 32 lands outperform 40 lands without it. Lands still decide missed land drops: at 30 lands, 7% of games miss two drops by turn 4; at 40 lands, 4% do. [Land count](commander-mulligans-curves-and-play-style.md#land-count-once-mulligans-are-played-well).
- **Data:** Karsten's colour tables assume keeping a free seven only with 3–5 lands [100]. His 2022 rule was the only published two-tier keep rule: a first seven needs 3–5 lands or Sol Ring; the second seven also keeps two-landers.

### What decks look like, per bracket

**Data.** Two independent snapshots, both using owner-declared brackets:

- **Archidekt** (ScrollVault, 6,532 complete decks, about 1,300 per bracket, collected 2026-09-07; medians with interquartile range) [95].
- **Moxfield** (EDHTuner, 18,414 decks skewed toward most-viewed, collected July and November 2026; Bracket 1 had only 80 decks and is merged with Bracket 2) [97].

| Bracket | Lands (Archidekt) | Lands (Moxfield) | Ramp       | Draw      | Avg mana value (Archidekt / Moxfield) | Counterspells | Tutors   | Game Changers |
| ------- | ----------------- | ---------------- | ---------- | --------- | ------------------------------------- | ------------- | -------- | ------------- |
| 1       | 37 (35–38)        | 36 (34–37)\*     | 10 (6–15)  | 8 (5–12)  | 3.17 / 3.18\*                         | 0 (0–2)       | 3 (1–5)  | 0             |
| 2       | 36 (35–37)        | 36 (34–37)\*     | 13 (9–17)  | 10 (7–13) | 3.16 / 3.18\*                         | 0 (0–2)       | 3 (2–6)  | 0             |
| 3       | 36 (34–37)        | 35 (33–36)       | 13 (10–18) | 10 (7–13) | 3.11 / 3.14                           | 1 (0–3)       | 4 (2–7)  | 2 (0–3)       |
| 4       | 35 (33–37)        | 33 (30–35)       | 14 (10–19) | 9 (7–12)  | 3.04 / 2.80                           | 2 (0–5)       | 5 (3–8)  | 3 (1–7)       |
| 5       | 28 (26–30)        | 28 (26–29)       | 21 (17–25) | 9 (6–11)  | 2.20 / 2.10                           | 8 (2–11)      | 9 (6–12) | 13 (10–18)    |

\*Moxfield Brackets 1 and 2 combined. Ramp, draw, counterspell, tutor and Game Changer columns are Archidekt only. Spot removal sits at a median of 4–5 and wipes at 1–2 in every bracket [95], which is an undercount (see research limits).

Caveats that change how to read the table:

- **Brackets 1–3 are nearly the same shape.** About 36 lands, 10–13 ramp, about 10 draw, average mana value 3.1–3.2. What separates them is card quality and intent: Game Changers go from 0 to a median of 2, counterspells from 0 to 1, tutors from 3 to 4. This is the data behind the panel's "STAPLES" label for the 2 ↔ 3 step.
- **Bracket 4 is where the shape starts to change**, and the two sources disagree there: 35 lands and 3.04 on Archidekt, 33 lands and 2.80 on Moxfield, whose sample leans toward tuned decks. Inside Moxfield's Bracket 4, decks under 2.5 average mana value run a median of 29 lands, decks at 3.5+ run 35 [97].
- **Bracket 5 is a different structure:** about 8 fewer lands, twice the ramp, a curve near 2.
- **Tutor medians at Brackets 1–2 probably include land search.** Scryfall's tutor tag is dominated by land tutors such as Cultivate and Farseek [101]; a median of 3 "tutors" in a Bracket 1 deck is mostly ramp.

### How games are actually won

**Data** (Playgroup.gg, 399,857 multiplayer games with a recorded win condition, all brackets mixed, updated 2026-11-04) [91]:

| Win condition     | Share |
| ----------------- | ----- |
| Combat damage     | 53.3% |
| Non-combat damage | 20.9% |
| Combo             | 8.1%  |
| Commander damage  | 8.0%  |
| Alternative win   | 6.6%  |
| Mill              | 1.8%  |
| Poison            | 1.2%  |

**Data** (same source): multiplayer games last a median of 9 rounds and 58 minutes (n = 574,716); four-player pods a median of 64 minutes (n = 309,868); the first seat "wins clearly more than its fair share" [91]. Across 1,608,359 finished games the average is 8.75 rounds [92]. Colour shifts the mix: Izzet wins by combo 33.5% of the time, colourless decks by combat 67.1% (search summary only) [91].

**Data** (Joey Schultz, EDHRECast episode 397, 2026-01-05: his own log of 332 games played in 2025, read from a transcript) [69]. This is the only per-bracket game-length data found:

| Bracket | Games logged | Average turn the game ended | Average turn of the first knockout |
| ------- | ------------ | --------------------------- | ---------------------------------- |
| 1       | 6            | 10.7                        | 9                                  |
| 2       | 60           | 9.4                         | 8.5                                |
| 3       | 93           | 9.0                         | 8.0                                |
| 4       | 16           | 8.7                         | 7.7                                |

Limits: one player's pods, self-labelled brackets, no cEDH, a Bracket 1 sample of six games and a Bracket 4 sample of sixteen. The per-bracket counts as transcribed sum to 175 of the 332 games; the transcript does not say how the rest were labelled. Within those limits the pattern is clear: speed rises gradually, only about two turns separate Bracket 1 from Bracket 4, and **every bracket's real games end well after its official floor**, so the floors are minimums, not targets. His overall averages barely moved from 2023 to 2025 (game end 9.4 → 9.8 → 9.4; first knockout 8.1 → 8.3 → 8.2); players overestimate game length by one to two turns; and in his Bracket 2–3 games turn order mattered little (first seat about 26.7%, then 24.6%, 24% and 25%) [69], unlike Playgroup's much larger sample, where the first seat wins clearly more [91].

What this implies for building:

- **Most games are won in combat, so most interaction should answer creatures.** Combat plus commander damage is about 61% of wins and burn or drain another 21%. Below Bracket 4, blockers, lifelink, spot removal and wipes protect you more than combo hate does. **Community** (_single source_): Kristen Gregory recommends high-toughness early blockers, more wraths and spot removal, and lifelink, which "really does buy you an extra turn" [39].
- **Combo answers matter from upper Bracket 3 upward** and against blue-red decks, where combo is about a third of wins.
- **Real games run longer than the floors.** A median of 9 rounds in a population dominated by casual decks [91], and per-bracket averages of 8.7–10.7 turns in the one creator log [69], mean the official 8, 6 and 4 are minimums that real games usually pass.

## Bracket 1: Exhibition

### Intent and feel

**Official.** Players expect "decks to prioritize a goal, theme, or idea over power", "win conditions to be highly thematic or substandard" and "gameplay to be an opportunity to show off your creations"; "you should expect to be able to play at least nine turns before you win or lose" [1]. "A deck is not Bracket 1 based on power level alone" [1].

**Community** (_consensus_). The restriction is the point of the deck [51][43]. Charlotte Sable's Muxus, Goblin Grandee deck plays only nonbasic cards with "Goblin" in the name, which deliberately rules out Krenko, Mob Boss, Siege-Gang Commander and Conspicuous Snoop [51]. Mark Wischkaemper puts it plainly: "the point of the deck isn't to win"; once you have shown off your cards, "you've already won" [43]. Good restrictions from the press: an Archelos, Lagoon Mystic deck built around one artist's art, Mayael the Anima with only 5+ power creatures, a different creature type for every creature [43]; cards printed before 2011, every meld pair, an art motif [34]; every card a Bear, a bear in its art, or the word "bear" [16].

**Community** (_single source_). In Bracket 1, "Removal or aggressive play is typically frowned upon", and mixed-bracket games "can lead to frustrating experiences" [50]. A full Bracket 1 pod can take a long wait to find, even at MagicCon (search summary only) [50].

**Community** (_consensus_ among creators). The Command Zone's Bracket 1 episode, with panel member Olivia Gobert-Hicks, calls it "a playground", a "respite from the hyper-competitive win-at-all-costs mindset", and its defining trait "commitment to the bit" (transcript) [67]. Bracket 1 is not "theme" in the loose sense: "My theme is elves is not Bracket one… that is just good mechanical synergy", and even a strict restriction can land in Bracket 2 if "a lot of these cards are just good" (JoeyDH, transcript) [70]. His test: "whether or not it's going to make other people smile at the table" [70].

The feel: long games ("land, pass is a valid turn"; "I don't expect to die until after turn nine" [67]), decks visibly doing their quirky thing, light interaction, and laughter at board states. Brackets 1 and 2 share "the shape of the game", slow and incremental, so they "can play together just fine" [67].

**Community** (_contested_): does a Bracket 1 deck need a way to win? Yes, say the press: Bracket 1 decks "don't need to be piles of non-synergistic cards" [20], and "the deck still needs a way to end the game" [48]. The creators reframe it: aim for a **success condition**, "I have done the thing I set out to do", rather than a win condition [67]; "once I start asking how might this deck win the game, I feel as though I'm exiting the Bracket one area" [70]. Both camps agree the deck must _do_ something visible.

**Data** (EDHREC user-selected brackets, as reported by JoeyDH, 2026-03-30): only **1.59%** of decks with a user-chosen bracket are Bracket 1, down from 5.2% in early Archidekt data [70]. Bracket 1 pods rarely form, so these decks usually sit in Bracket 2 pods; the panel even debated whether Bracket 1 should exist, and Rachel Weeks argued to keep it as "a space for these kind of creative decks" (transcript) [63].

### Official rules

- **Official.** No Game Changers, no extra turns and no two-card combos, each with an exception for "highly thematic cards" [2], such as "Bolas's Citadel in a Bolas-themed deck" [1]. Agree exceptions in the pregame conversation.
- **Official.** No mass land denial, with no thematic exception [2].
- **Official.** Card legality itself may stretch: "Bracket 1 is meant to be a place where stretching the rules of card legality is okay… 'My deck is using something that wouldn't normally be legal in Commander'" [6].
- **Community** (_consensus_ among creators): bend a rule only with a reason. Un-cards, playtest cards or an illegal partner pair are fine if they fit the theme and "add to the enjoyment of the table at large and not add to the power level of your deck". Examples from the episode: a coin-flip extra turn in a coin-flip deck; Cyclonic Rift in a tornado deck, where "maybe you just play Cyclonic Rift and don't overload it"; "one extra turn, I'm not gonna chain it" (transcript) [67].
- **Official.** Tutors are not restricted since 2025-10-21 [1].

### Target composition

| Slot               | **Recommended**        | Evidence                                                                                                                        |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Lands              | 37–40                  | **Data** median 37 (35–38) [95]; Karsten's 37 floor, higher for curve-dependent decks [98]; example lists run 36–46 [16][48]    |
| Ramp               | 8–12, on theme         | **Data** median 10 (6–15) [95]                                                                                                  |
| Card draw          | 8+ if the theme allows | **Data** median 8 (5–12), the lowest of any bracket [95]; **Community**: the Bears list's near-absent draw is "suboptimal" [16] |
| Interaction        | 4–8, light             | **Data** spot removal 5, wipes 2 [95]                                                                                           |
| Average mana value | about 3.2              | **Data** 3.17 [95]                                                                                                              |
| Game Changers      | 0                      | **Official**, thematic exceptions by agreement [2]                                                                              |

Bracket 1 is the thinnest bracket in every dataset (80 decks on Moxfield [97]; about 100–150 per commander on EDHREC [16]). Theme restrictions lower card quality and draw density, which is exactly when Karsten's math says to lean on lands.

### Opening hand and mulligans

**Computed** (a Bracket 1 shell: 37 lands, 10 ramp of which 6 cost 2 or less, average mana value 3.21, a 5-mana commander; mana spent through turn 8; [method](commander-mulligans-curves-and-play-style.md#the-model)):

- **First seven:**
  - Two lands without cheap ramp is a mulligan (−7.3% against a fresh seven).
  - Three lands without ramp is a coin flip (+0.2%).
  - Any 2–4 lands with one cheap ramp piece is a clear keep (+4.7% to +10.0%).
- **Second seven:**
  - Three or four lands without ramp become keeps (+7.0%, +5.8%).
  - Two lands without ramp is a coin flip (−1.0%).
- **What correct mulligans buy:**
  - The commander is cast by turn 6 in 95% of games, against 88% when every seven is kept.
  - Games with two missed land drops by turn 4 fall from 11% to 4%.
- **Lands:** the plateau for this shell is 37–41 lands, and the median of 37 sits at its lower edge.
- **Community** (_consensus_): Bracket 1–2 tables are lenient, and "a lot of play groups don't even play with Mulligan rules" (The Command Zone, June 2026). Agree on the table's mulligan rule before shuffling ([table practice](commander-mulligans-curves-and-play-style.md#house-rules-and-table-practice)).

### Card choices by role

| Role       | What to play                                                                                                                         | Status and notes                                                                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ramp       | Whatever fits the theme: Werebear in a Bears deck [16]; 3–4-mana ramp over 2-mana                                                    | **Community** (_single source_): skip Sol Ring, Arcane Signet and Mind Stone; "The point isn't to ramp, it's to fit the theme!" [43]. **Official**: Sol Ring is legal everywhere [3]                                                                                |
| Card draw  | On-theme engines and board-dependent draw                                                                                            | Don't skip it entirely; the clunkiness of draw-light lists is admitted [20]                                                                                                                                                                                         |
| Removal    | On-theme answers: Predatory Urge in the Bears list [16]                                                                              | **Community** (_contested_): light by convention [50], and Girten accepts skipping it [20]; but creators keep removal "to participate", because a Bracket 1 deck with none turns a pod into "two players and a ham sandwich" while the archenemy runs away [67][70] |
| Wipes      | One or two, if the theme supplies them                                                                                               | **Data** median 2 [95]. Olivia Gobert-Hicks and Rachel Weeks still run wipes in their Bracket 1 decks [67]                                                                                                                                                          |
| Protection | Rarely needed                                                                                                                        | Nobody is racing you                                                                                                                                                                                                                                                |
| Tutors     | Usually none                                                                                                                         | Legal by rule [1], but the published examples cut them (a Wild Pair list removed its tutors; the Bears list runs none) [20][16]                                                                                                                                     |
| Win        | Whatever the theme does at scale                                                                                                     | A theme with no ending drags the pod [48]                                                                                                                                                                                                                           |
| Mana base  | Basics and theme-consistent lands: 44 Snow-Covered Forests in the Bears list [16]; a Reaper King "colourless" list on 37 Wastes [20] | **Community**: avoid utility lands that break the concept [20]; if you can, keep even the lands inside the restriction (lands with moons in a moon deck) [67]                                                                                                       |

**Community** (_consensus_ among creators): "start with the restriction before you start looking at cards", because cutting later is painful. Start from a joke, band, artist, animal or character more often than from a commander. Expect it to be harder than it looks: deckbuilding tools optimize for power, not flavour [67]. The numbers are heuristics: "when you decide that you're going to play 30 lands, you at least know why" (Rachel Weeks, transcript) [67].

### Win conditions and combos

**Official.** No two-card combos unless highly thematic [2]. **Community**: Commander Spellbook's **Exhibition (E)** tag means "For any deck" [102], but tags are automatic and editable, and some E-tagged lines are two-card infinites: Gravecrawler + Phyrexian Altar, Hullbreaker Horror + Sol Ring [102]. An E tag is not a Bracket 1 pass; read the combo yourself.

Good Bracket 1 endings are slow and on display: a typal swarm, a themed drain engine, an alternate win that fits the story. Bracket 1 decks win against other Bracket 1 decks [16]; that is the whole design.

### What to avoid

- **Official.** Game Changers, extra turns and two-card combos you did not clear as thematic; any mass land denial [2].
- **Community** (_single source_): decks themed in name only. Wischkaemper's bad example is a "themed" equipment deck running Quietus Spike, Stoneforge Mystic and Sol Ring, "not in spirit"; a deck built only to shrink life totals fast doesn't fit even with a theme [43].
- **Community** (_single source_): chaos cards such as Scrambleverse without asking the pod first [43].

### Common mistakes

- **Treating Bracket 1 as "a weak Bracket 2."** It needs a deliberate quirk or theme [51][82].
- **A pile that cannot function.** The restriction excuses lower card quality, not a deck that never does anything [20].
- **No way to end the game** [48].
- **Claiming Bracket 1 for power reasons.** Officially, power alone never makes a deck Bracket 1 [1]. The early worry was "decks de forain" (carnival decks) claimed as Bracket 1 because they hold no Game Changer [125].
- **Mistaking a mechanical theme for an Exhibition restriction.** Elves, cycling or tokens are synergy, not a bit [65][70].

### You are probably in the wrong bracket if…

- You cannot state the restriction in one sentence [20].
- Your "theme" is a mechanic that makes the deck better [70].
- You chose the cards for strength and found a theme afterwards.
- You would be just as happy with the restriction removed. Then it is a Bracket 2 deck with flavour.
- It routinely finishes games well before turn 9 against other Bracket 1 decks.

### Reference decks

- **Lumra, Bellow of the Woods, "Bears"** (EDHREC, 2025-09-22): 46 lands (44 Snow-Covered Forests), 37 creatures, no Game Changers, almost no card draw [16]. [List on Archidekt](https://archidekt.com/articles/edhrec/edhrec-guide-to-commander-brackets/bracket1).
- **"Brims" Barone, Midway Mobster, "The Mad Hatter"** (CoolStuffInc, 2026-03-26): every card shows a hat (Boggart Harbinger, Merchant of Many Hats, Jester's Cap); 36 lands, 42 creatures [48].
- **Hylda of the Icy Crown, "Let It Go"**: every card is something Elsa would use, cast or live in; snow lands; built for the author's young daughter [49].
- **Girten's Bracket 1 conversions**: a Wild Pair deck of 61 three-mana 3/3 creatures and 37 Forests, and a Reaper King "colourless" five-colour deck on 37 Wastes that cut Birthing Pod as "too good" [20].
- **Creator examples** (described on air, no lists): a deck built to put its whole library into the command zone with Leadership Vacuum; a deck restricted to female creatures; a cards-from-2011-or-earlier deck [67]; a Marina Vendrell "haunted house" deck with Defenestrate and Room enchantments [70].

### Budget

**Data** (one sample build): the hats deck cost **$14.79** on 2026-03-26 [48]. Bracket 1 asks for imagination, not money; prices move, but the cards a theme needs are usually cheap.

### Say it at the table

> "This is an Exhibition deck: every card shows a hat. No Game Changers, no combos. It wins slowly, if it wins at all; I'm here to show it off. Is that the game everyone wants?"

If you want a thematic exception, ask before shuffling: "My Bolas deck runs Bolas's Citadel for flavour. Is that okay?" [1]. **Community** (_consensus_ among creators): Bracket 1 "is a great place to play rule zero", but "you have to have a reason" [67]. Because Bracket 1 decks usually land in Bracket 2 pods, read the table first; Bracket 2 players who say yes to a goof deck are accepting a different game [70]. Know when your deck is the "player character" of the night and when to tone it down [67].

## Bracket 2: Core

### Intent and feel

**Official.** Players expect "decks to be unoptimized and straightforward, with some cards chosen to maximize creativity and/or entertainment", "win conditions to be incremental, telegraphed on the board, and disruptable", "gameplay to be low pressure with an emphasis on social interaction" and "proactive and considerate, letting each deck showcase its plan"; "at least eight turns before you win or lose" [1].

**Community** (_consensus_). Bracket 2 is the deliberately fair bracket. Kristen Gregory: wins are "often telegraphed or incremental", and "plentiful removal and interaction isn't the hallmark of Bracket 2"; her goal is to win "without making folks across the table panic about you winning before they've gotten to really set up" [38]. Wischkaemper calls it "the hardest to build" because the builder must choose to be suboptimal, "choosing to prioritize fun over victory" [44]. EDHREC's guide adds the counterweight: "we're actually trying to win some games here", so a pure stall deck fits poorly (search summary) [16]. The Command Zone draws the line with Bracket 1 the same way: "Bracket 2 is like, I'm here to build a deck that does a thing to win the game", with "intentional resilience" where Bracket 1 has "commitment to the bit" (transcript) [67]; and "as long as I want to play about eight turns, then I'm a bracket two" [65].

**Community** (_consensus_ among creators). Bracket 2 is bigger than people admit. "I think most commander players play decks at bracket two, but many think they're actually playing bracket three decks" (Rachel Weeks and Jimmy Wong, transcript) [63]. Zero Game Changers means a deck "_qualifies_ to be a bracket 2", not that it is one (EDHRECast, transcript) [68].

**Community** (_single source_). One playgroup's Bracket 2 games average about 10.5 turns, with some ending around turn 5 [80]. Gregory sees Brackets 2 and 3 running "at least seven to eight turns of the game if not more", roughly 90 minutes to 2 hours [39]. Wipes are normal and healthy here: static-engine creature decks are "weaker to boardwipes, which is a super healthy balancing point" [38].

### Official rules

- **Official.** No Game Changers; no mass land denial; no chaining extra turns; no two-card combos, whether "game-enders, lockouts or infinites" [2].
- **Official.** A single extra-turn spell is fine; "your Edric deck about chaining all of them together? Keep that for the higher brackets, please" [3].
- **Official.** If you accidentally find a two-card combo, "hopefully that's a good laugh for everyone and you now know to take it out for next time" [3].
- **Official.** Tutors are not restricted [1]. Precons are no longer the benchmark [1].
- **Official.** Zero Game Changers does not make a deck Core: the "fully tricked-out Goblin deck" belongs higher [4].

### Target composition

| Slot               | **Recommended** | Evidence                                                                                             |
| ------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| Lands              | 36–38           | **Data** median 36 [95][97]; stock 2025–2026 precons run 37–40 [94]; Karsten's 37 floor [98]         |
| Ramp               | 9–13            | **Data** median 13 (9–17) [95]; **Community** about 10 [21][58]                                      |
| Card draw          | 10–12           | **Data** median 10 [95]; **Community** 12 [58], 12+ [21]                                             |
| Interaction        | 8–10            | **Community** about 10 removal [21], 12 targeted [58]; **Data** spot removal 5 is an undercount [95] |
| Wipes              | 2–3             | **Data** median 2 [95]; **Community** at least 2 [21]                                                |
| Protection         | 1–3             | **Community**: "only a couple of protection spells" [38]                                             |
| Average mana value | 3.1–3.3         | **Data** 3.16 / 3.18 [95][97]                                                                        |
| Game Changers      | 0               | **Official** [2]                                                                                     |

**Data** (research computation from EDHREC precon lists and Scryfall): ten stock 2025–2026 precons run 37–40 lands, average mana value 3.0–4.1, 2–13 rocks and 0–1 Game Changers [94]. They are the textbook Bracket 2 shape, except that two of them carry a Game Changer (see _Common mistakes_).

### Opening hand and mulligans

**Computed** (a Bracket 2 shell: 36 lands, 13 ramp of which 9 cost 2 or less, average mana value 3.16, a 4-mana commander; mana spent through turn 8):

- **First seven:**
  - Without cheap ramp: two lands is a mulligan (−8.0%), three lands is a coin flip (−0.9%), four lands leans mulligan (−2.3%), five lands is a mulligan (−7.7%).
  - Any 2–4 lands with one cheap ramp piece is a keep (+3.0% to +8.3%).
- **Second seven:**
  - Three or four lands without ramp are keeps (+6.1%, +4.7%).
  - Two lands without ramp is a coin flip (−1.5%).
- **What the free mulligan is worth here:** about one more mana spent by turn 8 (36.69 against 35.72 under one-on-one rules). That is more than the 0.77 gained by going from 32 to 40 lands with the free mulligan.
- **Lands:** the plateau for this shell is 36–40, the top of the tested range. Cutting from 36 to 32 costs 1.6% of mana spent by turn 8, and two-missed-drop games go from 5% to 6%.
- **Data:** 2025–2026 precons run about 38 lands and average mana value 3.47, higher than user Bracket 2 decks (35.9 and 3.19) ([curves](commander-mulligans-curves-and-play-style.md#the-shape-by-bracket)).

### Card choices by role

| Role       | What to play                                                                                                                                                                                      | Status and notes                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ramp       | Cultivate, Kodama's Reach, Arcane Signet, Commander's Sphere, Signets and Talismans, Solemn Simulacrum, Burnished Hart                                                                            | **Community** (_single source_): prefer 3-mana ramp (Cultivate, Peregrination) to 2-mana (Rampant Growth); Ur-Golem's Eye and Hedron Archive are fine [44]. Sol Ring: see _Open debates_                                                                                                                                                                                 |
| Card draw  | Harmonize, Night's Whisper, Read the Bones, Mulldrifter, Phyrexian Arena, Guardian Project, Beast Whisperer, Return of the Wildspeaker                                                            | Telegraphed, board-dependent draw matches the official "incremental" text. Rhystic Study is a Game Changer                                                                                                                                                                                                                                                               |
| Removal    | Swords to Plowshares, Path to Exile, Beast Within, Chaos Warp, Infernal Grasp; Counterspell, Arcane Denial, Negate                                                                                | **Community** (_contested_): "Don't skimp on interaction" [80] against "plentiful removal… isn't the hallmark" [38]. Wischkaemper prefers slower, selective answers such as Casualties of War around turns 5–7 to Vraska's Contempt [44]                                                                                                                                 |
| Wipes      | Blasphemous Act, Austere Command, Wrath of God, Damn; budget Sunfall, Vanquish the Horde, Merciless Eviction                                                                                      | Cyclonic Rift and Farewell are Game Changers                                                                                                                                                                                                                                                                                                                             |
| Protection | Lightning Greaves, Swiftfoot Boots, one or two protection spells                                                                                                                                  | Teferi's Protection is a Game Changer. Its budget stand-ins (Flare of Fortitude, Dawn's Truce, Brave the Elements, Unbreakable Formation) also keep the deck at zero [37]                                                                                                                                                                                                |
| Tutors     | Land search; narrow tutors such as Idyllic Tutor, Steelshaper's Gift, Moonsilver Key, transmute effects; slow unconditional tutors such as Grim Tutor or Diabolic Tutor for engines and pet cards | **Community** (_consensus_): "Tutoring for efficient wincons isn't really in keeping with Bracket 2" [38]; no face-down tutors, no searching every turn [44]; tutors should fetch engines, pet cards or a "hidden commander", not win conditions, and "I don't want to just drag in Vampiric Tutor and Imperial Seal" (Gemstone Mine, pre-October 2025, transcript) [73] |
| Win        | Overwhelming Stampede, End-Raze Forerunners, Exsanguinate, Blood Artist and Zulaport Cutthroat drain, Impact Tremors                                                                              | **Community** (_consensus_): avoid Craterhoof Behemoth (not a Game Changer, $25.73) [18][38]; Wischkaemper swaps it for Giant Adephage [44]                                                                                                                                                                                                                              |
| Mana base  | Basics, Command Tower ($0.43), Exotic Orchard, Path of Ancestry, Evolving Wilds, Myriad Landscape, Guildgates, Temples                                                                            | **Community**: "De-optimize your manabase" with basics and taplands [18]                                                                                                                                                                                                                                                                                                 |

### Win conditions and combos

**Official.** No two-card combos of any kind [2]. **Community** (_consensus_): 3–4-card "pocket combos" are fine if slow and removable [44]; Gregory's line is four or more cards, none of them the commander [38]. Telegraphed board wins are the bracket's identity: Overwhelming Stampede rather than Craterhoof, Exsanguinate rather than a two-card drain loop.

Commander Spellbook's **Core (C)** tag reads "For unoptimized decks in bracket 2+" [102]. Treat it with care: Blasphemous Act + Repercussion, Spellbook's most popular Core combo, deals near-infinite damage to every player with two cards [102], which the official "no two-card game-enders" line excludes from Bracket 2. Spellbook's tags are a community tool, not a ruling.

### What to avoid

- **Official.** Every Game Changer, including the ones that hide in precons and upgrades: Cyclonic Rift, Smothering Tithe, Rhystic Study, Teferi's Protection, Farewell, Demonic Tutor [101]. The Command Zone asked, when Farewell joined the list, "which of your decks will have to say Farewell to Bracket 2?" (episode description) [75].
- **Community** (_consensus_): mana or card advantage in the command zone. Kassandra, Eagle Bearer with Spear of Leonidas "could kill as early as Turn 5, and possibly Turn 3", and "would likely still fall into Bracket 3" with zero Game Changers [38].
- **Community** (_single source_): generic staples that push a deck toward Bracket 3, such as Academy Manufactor, Bennie Bracks and Clever Concealment [38]; best-in-slot equipment such as Puresteel Paladin and Excalibur [38].
- **Community** (_single source_): commanders that are too strong for the bracket, such as Vivi Ornitier; The Ur-Dragon, Edgar Markov and Korvold, Fae-Cursed King "belong in Bracket 3 or higher" [82].
- **Community** (_single source_): threat-doubling and oppressive board control [44].

### Common mistakes

- **Assuming any precon is Bracket 2.** Abzan Armor ships Seedborn Muse and Counter Blitz ships Farewell, so both stock lists sit at Bracket 3 by the letter of the rules [94][6]. Some players still bring Cyclonic Rift to Bracket 2 without realising it is a Game Changer [26].
- **An optimized mana base, a dense protection package and an inevitable finisher** on a "zero Game Changers" deck [18].
- **Calling a lightly upgraded precon "Bracket 3".** The Command Zone's own $50, ten-in-ten-out upgrades avoid Game Changers, and its hosts say such a deck "never leaves bracket two… maybe it edges close to three"; a real Bracket 3 "would require taking out sometimes 20 to 25 cards… really optimizing… solid draw engines" (transcript) [63].
- **Leaving power outliers in**, which makes game quality swingy [80].
- **No real way to win.** Telegraphed is not the same as absent [16].

### You are probably in the wrong bracket if…

- Gregory's test fails: the commander would "steamroll this pod if nobody has removal" [38].
- The deck is too consistent: it finds the same engine every game.
- You keep winning more than a third of your games against other Core decks [25].
- It kills before turn 8 on a normal draw, not a lucky one [1].

### Reference decks

- **Recent precons with measured strength** (Playgroup.gg, 28,634 stock-list games, normalized to a 25% four-player baseline, 2026-11-08) [94]: strongest Temur Roar 30.21% (120 games), Lorehold Spirit 27.22%, Multiverse Reforged 26.82%, The Fantastic Four 26.04%; weakest Wretched Ranks 12.66%, Klingon Fury 12.74% (53 games), Keen Engineering 14.40%, Witherbloom Pestilence 17.03%. Several samples are small.
- **Girten's Core conversions** (EDHREC, 2025-04-14): a Gandalf and Keruga deck brought to roughly precon level with 20+ changes and 33 lands; a Marchesa wizards deck that moved seven lands to basics or taplands, swapped Urza's Incubator for Izzet Signet, and dropped from about $400 to under $150 [18].
- **Lumra, Bellow of the Woods, Bracket 2** (EDHREC): about 20 cards swapped from the Bears list, "a few second-rate tutors" such as Vivien, Monsters' Advocate, still 46 lands [16]. [List on Archidekt](https://archidekt.com/articles/edhrec/edhrec-guide-to-commander-brackets/bracket2).
- **Golem typal, Ich-Tekik, Salvage Splicer and Silas Renn, Seeker Adept** (CoolStuffInc): "roughly matches a precon but may lose to stronger recent ones" [48].
- **Game Knights Live decks**: no Game Changers, "designed explicitly to win incrementally… no spells that win the game on the spot"; their builders call them "upper end of two", though viewers would call them threes (transcript) [63].
- **A tutor deck that moved down**: after the October 2025 change, a Helix Pinnacle deck dropped from Bracket 3 to Bracket 2 because "I can still run four or five mediocre tutors" (EDHRECast, transcript) [69].

### Budget

**Data** (one sample build): the golem deck cost **$49.38** on 2026-03-26 [48]. **Community**: build from what you already own [44]. Bracket 2 is where cheap substitutes do double duty: Monologue Tax ($1.60) for Smothering Tithe ($60.15), Mystic Remora ($12.42) for Rhystic Study ($67.49), Profane Tutor ($4.08) for Demonic Tutor ($65.28) each cut cost _and_ remove a Game Changer [37] (prices 2026-11-08 [101]).

### Say it at the table

**Official.** WotC's launch article gave the model line: "Hey, I'm in Bracket 2—except for this one thing. Is that okay with everybody?" [3]. The official French version reads « Hé, je suis en catégorie 2, sauf pour ce truc. Ça convient à tout le monde ? » [119].

> "Core, no Game Changers, no combos. Golem typal; it wins by attacking over several turns, so you'll see it coming. Anyone want to avoid anything?"

**Community** (_single source_): "if you're just saying 'my deck is bracket 2' you're doing the bracket conversation wrong"; add the strategy, the finish and how much interaction you run (Play to Win, transcript) [72].

## Bracket 3: Upgraded

### Intent and feel

**Official.** Players expect "decks to be powered up with strong synergy and high card quality; they can effectively disrupt opponents", "Game Changers that are likely to be value engines and game-ending spells", "win conditions that can be deployed in one big turn from hand, usually because of steadily accrued resources" and "gameplay to feature many proactive and reactive plays"; "at least six turns before you win or lose" [1]. **Official**: "Bracket 3 is meant to be a pretty wide space; we only want to slice so thin" [6].

**Community** (_consensus_). This is the bracket where theme gives way to function. Cooper Gottfried calls the 2 → 3 jump "the most significant change" because the mindset shifts from theme to the best engine [16]. Wischkaemper sees it as the de facto default where most decks land: "you want to build in ramp, interaction, and card draw" and "once you get to Bracket 3, the gloves are off" [45].

**Community** (_consensus_). It is also the bracket with the most friction. "Bracket 3 sees more accusations of pub stomping than any other Bracket" [50]; games usually go about 6–9 turns, but voltron can "likely take out at least one player before turn eight if they aren't interacted with" [26], and one reader took 38 commander damage before their fifth turn [80]. A Bracket 3 playgroup reports eliminations around turns 7–9 [28]. Card Kingdom reads the six-turn line as describing the average Bracket 3 game, with aggro or voltron sometimes winning earlier (search summary only) [42]. What counts as acceptable interaction "is going to be _extremely_ different" between groups [26].

**Community** (_consensus_ among creators). On paper Bracket 3 differs from 4 by its limits; at the table it differs by mindset. Bracket 3 tables are "trying to cultivate a good game state together", are salt-aware, and allow looser mulligans and take-backs (Rachel Weeks, transcript) [66]. Its Game Changers work as a "signal flare: when someone says bracket 3, I know what to expect", Consecrated Sphinx being the example (EDHRECast, transcript) [68].

### Official rules

- **Official.** Up to three Game Changers [9]; no mass land denial; no chaining extra turns; no two-card combos before turn 6 [2].
- **Official.** On combos: the turn floor tells you "what kind of combos could be allowed: not ones that tend to happen in the first six turns. That doesn't mean you should just wait and hold your two-card infinite until later either. If a combo could frequently come up, it's not the best fit for that bracket" [1].
- **Official.** Land-denial loops are out: "if you're planning to repeatedly loop or blink Sundering Titan regularly, that kind of land-denial strategy is not something welcome in Bracket 3" (Sundering Titan itself is banned) [7].
- **Official.** No exact boundary for "before turn 6" is published; the closest gloss is "someone's seventh turn" [1].

### Target composition

| Slot               | **Recommended**                  | Evidence                                                                                        |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lands              | 35–37                            | **Data** 36 (34–37) [95], 35 (33–36) [97]; Karsten's 37 floor [98]; sample lists 32–36 [52][48] |
| Ramp               | 10–14                            | **Data** 13 (10–18) [95]; **Community** "10 one-mana ramp spells" in a sample build [48]        |
| Card draw          | 10–12+                           | **Data** 10 [95]; **Community** 12 engines in the same build [48]; 12 [58]                      |
| Interaction        | 10–12, 1–3 counterspells if blue | **Community** [21][58]; **Data** counterspells 1 (0–3) [95]                                     |
| Wipes              | 2–3                              | **Data** 2 (1–4) [95]                                                                           |
| Tutors             | 2–5                              | **Data** 4 (2–7), probably including land search [95]                                           |
| Game Changers      | 0–3, chosen on purpose           | **Official** cap 3 [9]; **Data** median 2 (0–3) [95]                                            |
| Average mana value | 3.0–3.2                          | **Data** 3.11 / 3.14 [95][97]                                                                   |

**Data.** Composition barely moves from Bracket 2 (about one land fewer, the same curve). The difference is which cards fill the slots, not how many.

### Opening hand and mulligans

**Computed** (a Bracket 3 midrange shell: 36 lands, 13 ramp of which 11 cost 2 or less, average mana value 3.13, a 4-mana commander; mana spent through turn 7):

- **First seven:**
  - Hands without cheap ramp are mulligans: two lands −11.6%, three lands −5.2%, four lands −6.1%.
  - Hands with one cheap ramp piece are keeps: two lands +4.8%, three +7.2%, four +3.5%.
- **Second seven:**
  - Three or four lands without ramp are coin flips (+1.0%, 0.0%).
  - Two lands without ramp is still a mulligan (−5.8%).
- **Play style moves the line inside the bracket** ([by play style](commander-mulligans-curves-and-play-style.md#by-play-style)):
  - A spellslinger shell (cantrips, 16 draw) keeps two-landers without ramp on the second seven (+3.7%).
  - A big-mana shell with a 6-mana commander mulligans 3–4-landers without ramp even on the second seven (−5.5%, −5.6%).
- **Lands by style** (plateaus): aggro 34–37, spellslinger 33–37, midrange 37–40, big mana 40–42 (the last two at the top of the tested range).
- **Community:** Bracket 3 tables are often lenient; they "will let you take infinite hands" (The Command Zone, March 2026). These numbers assume the official rule.

### Card choices by role

| Role                 | What to play                                                                                                                                                                                                                       | Status and notes                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ramp                 | Nature's Lore ($4.19), Three Visits ($5.11), Farseek, Rampant Growth; Birds of Paradise, Llanowar Elves, Elvish Mystic; Sol Ring, Arcane Signet, Fellwar Stone, Talisman of Dominance                                              | Smothering Tithe ($60.15) is a Game Changer slot. Skip expensive fast mana such as Ancient Tomb [45]. Mox Opal and Mox Amber: _contested_ [17][56]                                                                      |
| Card draw            | Mystic Remora, Esper Sentinel, Black Market Connections, Sylvan Library, The Great Henge (not a Game Changer, $62.96)                                                                                                              | Rhystic Study, The One Ring, Necropotence and Bolas's Citadel each spend one of the three slots. "Cut draw that sits uncast in hand" [28]                                                                               |
| Removal and counters | Swords to Plowshares, Path to Exile, Infernal Grasp, Go for the Throat, Hero's Downfall, Generous Gift, Anguished Unmaking, Assassin's Trophy; Counterspell, Swan Song, An Offer You Can't Refuse, Mana Drain (not a Game Changer) | **Community**: "tried-and-true, efficient removal" over weak on-theme answers [45]; "Toss in a Doom Blade instead of a value piece" [28]. Boseiju, Who Endures and Otawara, Soaring City add interaction without a slot |
| Wipes                | Toxic Deluge, Damn, Blasphemous Act, Vandalblast, Damnation, Aetherize                                                                                                                                                             | Cyclonic Rift and Farewell are Game Changers; at most one is a sensible spend [45]                                                                                                                                      |
| Protection           | Heroic Intervention, Flawless Maneuver, Swiftfoot Boots                                                                                                                                                                            | Teferi's Protection is a Game Changer                                                                                                                                                                                   |
| Tutors               | One to three slow, non-Game Changer tutors: Diabolic Tutor, Grim Tutor, Finale of Devastation, Chord of Calling; or one Game Changer tutor                                                                                         | **Community**: a single tutor "fits the bracket" [29]. The EDHREC Lumra list spends its three slots on Worldly Tutor, Crop Rotation and Ancient Tomb [16]                                                               |
| Win                  | A reliable closer: Aetherflux Reservoir, Craterhoof Behemoth [17]; Avenger of Zendikar and End-Raze Forerunners [48]; one big turn from hand                                                                                       | See _Win conditions and combos_                                                                                                                                                                                         |
| Mana base            | Untapped duals: check, pain, battle and shadow lands ($0.55–1.23), pathways and bond lands ($4.69–7.43), surveil lands, Triomes ($21.11)                                                                                           | **Community**: reliable coloured mana is one of the most effective upgrades; swap taplands for untapped duals [17]                                                                                                      |

**Community** (_consensus_). "You don't need three" Game Changers: they are a resource that defines the deck's power, so spend them deliberately [17]. One Bracket 3 upgrade rejected Smothering Tithe because the deck wanted cards, not mana [17]. Rachel Weeks puts none in a frog deck and "three to five game changers" in a deck built to compete at the top of her office pod, which at four or five is a Bracket 4 deck by rule [63]; EDHRECast built a whole episode around "You can only play 3 in Bracket 3, so which do you pick?" (title and description only) [76].

### Win conditions and combos

**Official.** Two-card combos are allowed only if they do not tend to come up before turn 6 [1][2]. In practice:

- **Community** (_consensus_): a combo should be judged on whether it effectively ends the game and how cheaply. Sanguine Bond + Exquisite Blood (two five-mana cards, late and telegraphed) is generally accepted; swapping in the two-mana Starscape Cleric "generally not okay" [82]. Late two-card infinites are permitted, though "a bummer no matter when the game comes together"; three-card loops such as Scurry Oak + Rosie Cotton + Peregrin Took are judged in-bracket [29].
- **Data** (Commander Spellbook tags, retrieved 2026-11-08) [102]: **Spicy (S)** "Probably 3 or 4" and **Powerful (P)** "For strong decks in bracket 3+". Spicy examples: Sanguine Bond + Exquisite Blood, Dramatic Reversal + Isochron Scepter, Heliod, Sun-Crowned + Walking Ballista, Niv-Mizzet, Parun + Curiosity, Mikaeus, the Unhallowed + Triskelion.
- **Community** (_contested_): Dramatic Reversal + Isochron Scepter. Spellbook tags it Spicy because it needs untappable mana [102], and forum users call it "at a minimum… a 4 card combo" (search summary) [102]; Nigel Kurtz says it "needs to be reserved for Bracket 4 play and above" [46].
- **Official** (via the Game Changer list): Thassa's Oracle is a Game Changer, and its partners Demonic Consultation and Tainted Pact are Spellbook-**Ruthless** [101][102]. Treat Oracle lines as a Bracket 4 marker.
- **Community** (_consensus_ among creators): the "late combo" loophole does not work. "People look at Demonic Consultation combo and say, well, I could play this in bracket three as long as I do it after turn six", but it "can happen super reliably in those first six turns, and the players at bracket three do not expect to have the level of disruption to answer that kind of combo" (Rachel Weeks, transcript) [66]. A tutorable two-card win is a Bracket 4 feature even if you promise to wait.
- **Community** (_single source_): if you play extra turns, prefer self-exiling ones such as Alrund's Epiphany and Karn's Temporal Sundering [17].

### What to avoid

- **Official.** Mass land denial (Armageddon, Blood Moon, Winter Orb) [3]. **Community**: Citadel of Pain applies pressure without denying land [17].
- **Official.** Chained extra turns; early two-card combos [2].
- **Community** (_consensus_): cEDH-grade combos without a pregame heads-up. In a 531-point Reddit thread about an Iroh deck running Underworld Breach + Thassa's Oracle + Lotus Petal, comments called Breach and Oracle lines "lame" below Bracket 4 "especially without a heads-up beforehand" [83].
- **Community** (_contested_): non-Game Changer fast mana and free spells in quantity (Mox Opal, Lotus Petal, Pact of Negation, Force of Negation, Deflecting Swat). Legal, but the result plays like Bracket 4 [56][17].

### Common mistakes

- **"Strong 3."** Running exactly three Game Changers in a deck whose synergy already plays at Bracket 4 misrepresents it [79].
- **Too little interaction.** "Don't skimp on interaction" [80]; an underdeveloped deck can "end up pub-stomping themselves" [26].
- **No deliberate closer.** Games can end around turn 6; know how yours does [17].
- **Cheap two-card combos dressed up as late ones** [82].
- **Assuming one store's Bracket 3 matches another's.** Levi Perry keeps different Bracket 3 decks for different stores in his city [26].
- **Voltron that removes a player before turn 5** at a "Bracket 3" table [80].

### You are probably in the wrong bracket if…

- The deck can reliably present a win before turn 6. That is the Bracket 4 profile [1]. Rachel Weeks puts the line a turn later in practice: "if I can put together a reasonable win by turn six or seven then I typically feel like my deck is a little too fast for bracket three", while "I can win on turn seven" can still be a strong Bracket 3 (transcript) [66].
- Her diagnostic questions say yes: "look at how fast it can win, look at how fast it can disrupt: can you prevent a deck from winning the game before turn five, before turn six?" and "do you have all the tutors to make that happen?" [66].
- It "plays like Bracket 2 sometimes but plays like Bracket 4 other times" [80]. Pick a lane.
- It wins more than a third of its Bracket 3 games [25]. A roughly $50 Kiora, Sovereign of the Deep deck won 9 of 10 and now plays only at Bracket 4 tables: "I always win in Bracket 3 but always lose in Bracket 4" [25].
- Gregory's "Bracket 3.5" describes it: stronger than Bracket 3, too slow for Bracket 4. Say so out loud [40][41]. The Command Zone defines that zone by disruption: "how capable are you at disrupting super efficient combos, how easy are you to disrupt, and what kind of disruption is required" (transcript) [64]. Play to Win's example: an Aesi, Tyrant of Gyre Strait lands deck with three Game Changers and two extra-turn spells that combo-finishes around turns 5–6 but carries little protection or interaction sits "in between bracket three and bracket four" (transcript) [72].

### Reference decks

- **Lumra, Bellow of the Woods, Bracket 3** (EDHREC): self-mill and land recursion with Wasteland, Azusa and Ancient Greenwarden; Game Changers Worldly Tutor, Crop Rotation, Ancient Tomb; 46 lands because lands are the engine [16]. [List on Archidekt](https://archidekt.com/articles/edhrec/edhrec-guide-to-commander-brackets/bracket3).
- **Volo, Guide to Monsters, "Monster Mash"** (CoolStuffInc, 2026-03-26): 34 lands, 45 creatures, about 10 one-mana ramp spells, 12 engines, Volo on curve to copy a five-drop by turn 4; "You're not trying to win as fast as possible" [48].
- **Omnath's Petting Zoo** (CoolStuffInc): Rhystic Study as the Game Changer, a late-game two-card mana combo [49].
- **Draftsim's Bracket 3 commanders** (2026-03-12): a Rashmi list using "the full three Game Changers" (32 lands), Otharri (32), Shalai and Hallar (36) [52].
- **Gregory's clear Bracket 3s** (2025-12-09): Henzie "Toolbox" Torre with no Game Changers, no combos and no early dorks, yet too strong for Bracket 2; Hofri Ghostforge, part C of an A+B+C combo but a five-mana commander that neither draws nor ramps [40].
- **EDHREC "upgraded" average decks** (computed): Edgar Markov 35 lands and average mana value 2.89; Atraxa, Praetors' Voice 35 and 3.05; The Ur-Dragon 36 and 4.21 [32].

### Budget

**Data** (one sample build): Volo cost **$49.97** on 2026-03-26, its finishers "just over a dollar combined" [48]. **Community** (_consensus_): price does not set the bracket; Bracket 3 is fully buildable under $100 [48][46]. The expensive part is optional: the Game Changers you choose (Rhystic Study $67.49, Smothering Tithe $60.15, The One Ring $106.56 on 2026-11-08 [101]). Budget untapped duals cost under $2 each [101].

### Say it at the table

> "Upgraded, low end: Henzie, no Game Changers, no infinite combos. It attacks; I'd expect to win around turn 8 if nobody stops me. Fine for everyone?"

> "Upgraded, high end: three Game Changers, Rhystic Study, Smothering Tithe and Cyclonic Rift, and a late Sanguine Bond plus Exquisite Blood finish. If that's too spicy, I have a lower deck."

Naming where you sit inside Bracket 3, and the Game Changers by name, is the community fix for its width [86][41]. Creators add two disclosures: whether you hold a two-card finish and when it realistically comes together, and how much interaction you run [72], since an underdeveloped deck can "end up pub-stomping themselves" by letting someone else run away [26].

## Bracket 4: Optimized

### Intent and feel

**Official.** Players expect "decks not to adhere to the cEDH metagame reserved for Bracket 5", "decks to be lethal, consistent, and fast, designed to take people down as fast as possible", "Game Changers that are likely to be fast mana, snowballing resource engines, free disruption, and tutors", "win conditions to vary but be efficient and instantaneous" and "gameplay to be explosive and powerful, featuring huge threats and efficient disruption to match"; "at least four turns before you win or lose" [1].

**Community** (_consensus_). "What differentiates B3 from B4 is acceleration, but what separates B4 from B5 is metagame." A deck that isn't "dropping a win out of nowhere on turn 4-5" doesn't fit [40]. B4 decks deploy combos "while Bracket 3 decks are still gathering resources" [40]. "Just about any commander can be taken to its extreme and end up in the Optimized Bracket (4)" [19]. "Mistakes are punished far more often than in lower Brackets" [50].

**Community** (_consensus_). It is also wide. One end is "stronger versions of Bracket 3", the other near-cEDH, and they "do not always match well" [50]; B4 is the hardest bracket to fill with an even pod because "Both of these decks have prepared for a very different kind of fight" [26]. Social norms still mean most decks "take some time to get their threats going" [22].

**Community** (_consensus_ among creators). The Command Zone's Bracket 4 episode (Rachel Weeks with Joe Johnson) is the most detailed creator account of the bracket (transcript) [66]:

- **Mindset:** "Most bracket four players are looking for pushback… the tension between how fast can I go and how fast can you stop me." Pub-stomping is "the primary misconception".
- **The floor:** four turns means "four setup turns where you do not expect to die yet… I don't expect to die to something I can't see in your hand".
- **Game shape:** few board wipes ("by the time you could cast a board wipe you'd rather advance your board"), early spot removal on key pieces ("you must bolt the bird"), games of 45 minutes to 1.5 hours with wins mostly on turns 5–7. Joe Johnson estimates about half of his Bracket 4 games end by combo, against 8% of wins in all-bracket data [91]; cEDH-style Thassa's Oracle or Breach lines show up "once every 20 games".
- **Play tighter:** Bracket 4 and 5 tables "really follow the London mulligan", and the pod should agree up front on take-backs, missed triggers and priority.

### Official rules

- **Official.** No deck restrictions beyond the banned list [2][3]. Unlimited Game Changers [9].
- **Official.** The banned list still holds the fastest mana: Mana Crypt, Jeweled Lotus, Dockside Extortionist (banned 2024-09-23, Jeweled Lotus explicitly kept banned in February 2026), plus Black Lotus and the Moxen, Fastbond, Channel, Rofellos, Llanowar Emissary, Tolarian Academy and Library of Alexandria [101][7]. Other notable bans: Nadu, Winged Wisdom, Hullbreacher, Paradox Engine, Flash, Tinker, Primeval Titan, Golos, Tireless Pilgrim, Leovold, Emissary of Trest, Iona, Shield of Emeria, Griselbrand, Sundering Titan [101].
- **Official.** "Decks not to adhere to the cEDH metagame" is the only line between Brackets 4 and 5 [1].

### Target composition

| Slot               | **Recommended**                                        | Evidence                                                                                                     |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Lands              | 32–35, tracking the curve                              | **Data** 35 (33–37) [95], 33 (30–35) [97]; 29 under 2.5 average mana value [97]; sample lists 24–36 [19][48] |
| Ramp               | 12–18, including fast mana                             | **Data** 14 (10–19) [95]                                                                                     |
| Card draw          | 9–12 premium engines                                   | **Data** 9 (7–12) [95]                                                                                       |
| Interaction        | 8–12, including free spells; 2–5 counterspells if blue | **Data** counterspells 2 (0–5) [95]; **Community** "can't expect to tap out late in the game" [19]           |
| Wipes              | 1–2                                                    | **Data** 2 (1–3) [95]                                                                                        |
| Tutors             | 4–8                                                    | **Data** 5 (3–8) [95]                                                                                        |
| Game Changers      | Unlimited; median 3                                    | **Data** 3 (1–7) [95]                                                                                        |
| Average mana value | 2.6–3.0                                                | **Data** 3.04 / 2.80 [95][97]                                                                                |

**Data.** This is where Karsten's "cut a land for every two or three rocks or three or four cantrips" actually gets used: decks shed two to four lands as they add 0–1-mana acceleration [98][97]. Curve-heavy builds still sit at 34–36: Atraxa's Optimized average deck runs 36 lands [32], Kalamax 36 [19].

**Community** (_single source_). Creators give Bracket 4 a tempo benchmark instead of slot counts: a dork or Sol Ring on turns 1–2, a tutor or Sylvan Library on turn 2, a board established by turns 3–4, and "seven, eight permanents out on the field other than your lands" by turns 4–5 (Joe Johnson, transcript) [66]. He runs "only 30 lands" with many mana dorks [66].

### Opening hand and mulligans

**Computed** (a Bracket 4 shell: 34 lands, 15 ramp of which 14 cost 2 or less, average mana value 2.85, a 3-mana commander; mana spent through turn 6):

- **First seven:**
  - Any hand without cheap ramp is a mulligan: two lands −15.4%, three −8.3%, four −9.0%.
  - Two lands with one cheap ramp piece is a keep (+2.0%).
- **Second seven:**
  - Without ramp, two lands is still a mulligan (−8.9%); three and four lands lean mulligan (−1.2%, −2.0%).
  - Two lands with one cheap ramp piece is a keep (+9.9%).
- **The one-on-one rule is already strict here.** Its optimum keeps 54% of sevens, so applying the same rule to both sevens loses almost nothing (24.00 against 24.01).
- **Lands:** the plateau for this shell is 35–38. The measured Bracket 4 median (33–35) sits just below it, and 33 lands cost about 1% of mana spent by turn 6 against 37.
- **Community** (_consensus_): Bracket 4 tables follow the London rule strictly. Keep a hand that can either disrupt or develop ([by bracket](commander-mulligans-curves-and-play-style.md#by-bracket)).

### Card choices by role

| Role        | What to play                                                                                                                                                                                                                                                                              | Status and notes                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ramp        | Game Changer fast mana: Mana Vault ($111.47), Chrome Mox ($162.93), Mox Diamond, Grim Monolith ($475.65), Ancient Tomb ($125.70). Non-Game Changer: Mox Opal ($222.62), Mox Amber ($84.60), Lotus Petal, Elvish Spirit Guide, Simian Spirit Guide, Dark Ritual                            | **Community**: games are "frequently defined by which deck gets off to the most explosive start" [19]. Mana dorks for a turn-2 commander are a Bracket 4 marker [40]                                                                                                                                                                                                                              |
| Card draw   | Rhystic Study, Necropotence, Esper Sentinel, Mystic Remora, The One Ring ("suits most decks" [19]), Wheel of Fortune, Windfall                                                                                                                                                            | **Community**: cut low-impact draw such as Wheel of Misfortune and Dig Through Time [19]                                                                                                                                                                                                                                                                                                          |
| Interaction | Free: Force of Will ($55.22), Fierce Guardianship ($63.76), Force of Negation ($46.92), Pact of Negation ($16.58), Deflecting Swat ($73.92), Force of Vigor; cheap: Veil of Summer, Snakeskin Veil, Beast Within, Swords to Plowshares                                                    | Force of Will and Fierce Guardianship are Game Changers; the other free spells are not                                                                                                                                                                                                                                                                                                            |
| Wipes       | Fewer; cheap spot removal and counters take the slots                                                                                                                                                                                                                                     | A sorcery-speed wrath on turn 5 is late in a turn-4 format                                                                                                                                                                                                                                                                                                                                        |
| Protection  | Teferi's Protection, Veil of Summer, Snakeskin Veil; Silence, Orim's Chant, Grand Abolisher, Mother of Runes, Giver of Runes                                                                                                                                                              | Protect the winning turn, not only the commander                                                                                                                                                                                                                                                                                                                                                  |
| Tutors      | Vampiric Tutor ($49.45), Demonic Tutor ($65.28), Imperial Seal, Mystical Tutor, Enlightened Tutor, Worldly Tutor, Gamble, Crop Rotation, Natural Order; non-Game Changer Diabolic Intent, Wishclaw Talisman, Green Sun's Zenith, Chord of Calling, Eldritch Evolution, Imperial Recruiter | **Community**: "Should you always tutor in B4? the answer is probably"; tutor for consistency, not occasional spikes, because spikes draw "too much aggression" [40]                                                                                                                                                                                                                              |
| Win         | Compact combos with redundancy, or an A+B commander                                                                                                                                                                                                                                       | See _Win conditions and combos_                                                                                                                                                                                                                                                                                                                                                                   |
| Mana base   | Shocks ($4.65–5.21), fetches ($12.30–36.39), Urborg, Tomb of Yawgmoth, Cabal Coffers, Urza's Saga, Cavern of Souls, Boseiju, Who Endures, Otawara, Soaring City; Game Changer lands where they fit                                                                                        | **Community**: utility and fast lands such as Ancient Tomb and Emergence Zone [19]. "You can't really be playing tapped lands on turn one, two and three"; Joe Johnson builds the land base first (about six basics in a three-colour deck, then duals, shocks, fetches and utility lands), then pet cards, synergy, protection and backup plans [66]. Fetch basics early against Blood Moon [66] |

### Win conditions and combos

**Official.** Win conditions "efficient and instantaneous" [1]; no combo limit.

- **Data** (Commander Spellbook **Ruthless (R)** tag, "For competitive decks at brackets 4+": "Relevant two-card combo that is probably very fast or results in infinite turns or mass land denial") [102]: Thassa's Oracle + Demonic Consultation ($22.25 for the pair) or + Tainted Pact; Kiki-Jiki, Mirror Breaker + Zealous Conscripts; Splinter Twin + Pestermite; Basalt Monolith + Rings of Brighthearth or + Forsaken Monument; Food Chain + Eternal Scourge or Squee, the Immortal; Isochron Scepter + Narset's Reversal (infinite turns); Worldgorger Dragon + Animate Dead; Scurry Oak + Ivy Lane Denizen; Bruvac the Grandiloquent + Maddening Cacophony.
- **Community** (_consensus_): the commander should carry part of the win. An A+B commander such as Dina, Soul Steeper with Exquisite Blood needs few tutors; value commanders such as Tymna the Weaver need tutors to find their pieces; a commander that isn't part of a combo and doesn't carry the win "is bound to be less consistent" [40].
- **Community** (_single source_): "Thassa's Oracle, Demonic Consultation, Underworld Breach, Rhystic Study and Mystic Remora" are "not banned from Bracket 4" [46]. Running them does not make a deck cEDH (see Bracket 5).
- **Official.** Thassa's Oracle stays legal: "The case seems mostly closed" [7]; Oracle with Consultation or Pact is "pervasive in the highest brackets" [1].
- **Community** (_contested_): should it be in a Bracket 4 deck at all? Play to Win: "technically nothing stopping you… but it is the cEDH meta combo, so it probably shouldn't be in your bracket four deck" (transcript) [71]. Kurtz says it is "not banned from Bracket 4" [46].
- **Community** (_single source_): typical Bracket 4 finishes seen on The Command Zone are Heliod, Sun-Crowned + Walking Ballista, Titania, Protector of Argoth with Strip Mine loops, Orvar, the All-Form storm, and big combat (transcript) [66].

### What to avoid

- **Community** (_single source_): one-threat voltron plans that "quickly become the threat"; developing too slowly; incidental card advantage over efficient cards [19].
- **Community** (_consensus_): the grey zone between 3 and 4, which ends "over or underpowered depending on the composition of the rest of the pod" [19].
- **Community** (_consensus_): tuning against the cEDH field. That is what makes a deck Bracket 5, and Bracket 4 decks are explicitly not meant to [1][22].

### Common mistakes

- **Judging power by speed alone**, or calling any fast combo deck "cEDH" [23][82].
- **Assuming an off-meta commander makes a deck Bracket 4**, or that it makes it cEDH [23].
- **"Winning at any cost"** at a Bracket 4 table. That is the cEDH mindset [23].
- **Counting Game Changers to decide.** A deck with one Game Changer (Ancient Tomb) and one tutor (Chord of Calling) can play as Optimized; Sable's Xyris, the Writhing Storm does [51]. The reverse holds too: a deck called Bracket 4 "because they've thrown money at their deck or there's seven or eight game changers" that "is still severely under-optimized and wins by like turn 10" is a bad Bracket 4 deck at best (Play to Win listener question, transcript) [72]. "Il y a des decks de niveau 4 qui n'auront absolument aucun Game Changer" [125].
- **Reading "as fast as possible" literally.** Control and stax decks that "win on turn 12 but do powerful things on turn two, three, four" belong here too [72][26].

### You are probably in the wrong bracket if…

- It cannot realistically present a win on turns 4–5. Gregory calls slow but resilient decks "higher power 3" [40].
- Every slot is chosen against the current cEDH field, the commander is an engine rather than the payoff, and you would bring it to a 50-player tournament. That is Bracket 5 [22][23]. Rachel Weeks' test: "Did you use cEDH tools to build this deck? Did you look at the cEDH database? Watch cEDH games? Use a cEDH deck as a template? Look at tournament decklists? Think about cEDH opponents specifically?" If yes, it is likely Bracket 5; Bracket 4 decks are "built in more of a vacuum", and "if you look at the database and there's none, you're probably fine" (transcript) [66].
- You are asking whether it is 4 or 5. "If you need to ask how… 4 [differs] from 5, your deck likely belongs in… 4" [51].

### Reference decks

- **Yeva, Nature's Herald, mono-green flash stompy** (EDHREC, 2025-04-28): 33 lands, 43 creatures; 22 swaps from the original, 8 of them in the mana base; added Ancient Tomb, Chrome Mox, Mana Vault, Sol Ring, The One Ring and Crop Rotation, Eldritch Evolution, Shared Summons, Worldly Tutor [19]. [Optimized list](https://archidekt.com/decks/12597006/bracketology_mono_green_flash_stompy_yeva_natures_herald).
- **Kalamax, the Stormsire spellslinger** (same article): 36 lands, 35 instants; 36 cards changed, adding Force of Will, Fierce Guardianship, The One Ring and Mystic Remora [19]. [Optimized list](https://archidekt.com/decks/12458995/bracketology_one_punch_kalamax_the_stormsire).
- **Lumra, Bellow of the Woods, Bracket 4** (EDHREC): the Bracket 3 list "trimmed, supercharged" with Gaea's Cradle, Natural Order, Chord of Calling, Force of Vigor and Mox Diamond; 21 combos per Commander Spellbook; 51 lands [16]. [List on Archidekt](https://archidekt.com/articles/edhrec/edhrec-guide-to-commander-brackets/bracket4).
- **Yuriko, the Tiger's Shadow ninjas** (CoolStuffInc, 2026-03-26): 24 lands, 23 instants, Doomsday as the win, good tutors but no fast mana; "Not cEDH" [48].
- **Glarb, Calamity's Augur** (Draftsim, 2026-07-17): "a straight combo deck with multiple lines to win the game on the spot" with Bolas's Citadel, Thassa's Oracle and Devoted Druid, five Game Changer tutors and fast mana [53].
- **EDHREC "optimized" average decks** (computed): Yuriko 30 lands, average mana value 2.85; Kinnan, Bonder Prodigy 30 and 2.74; Krenko, Mob Boss 33 and 2.60; Atraxa 36 and 2.92 [32].

### Budget

**Data** (one sample build): the Yuriko deck cost **$99.78** on 2026-03-26 [48]. **Community** (_consensus_): "Budget can impact a deck's overall performance, but it doesn't perfectly set it into a bracket"; Swords to Plowshares is cheap and cEDH-grade, and a deck around $100 can hold a Bracket 4 combo [46]. The expensive pieces are fast mana and fetches (prices above, 2026-11-08 [101]); there is no true budget equivalent for either. Prices move, and Reserved List pieces such as Mox Diamond and Lion's Eye Diamond had no Scryfall default price at all. **Community** (_contested_): "the biggest downside of this bracket is the price", but it is "a very playtest friendly type of bracket" [66]; Play to Win see casual groups as less accepting of proxies than cEDH, which is one reason Bracket 4 exists at all: "you're not playing a Mox Diamond because you don't have a Mox Diamond" (transcript) [72]. Ask your pod.

### Say it at the table

> "Optimized, not cEDH. Kalamax spellslinger: fast mana, Force of Will, a few tutors. It can win out of nowhere around turn 5, and it has free counterspells. Is everyone on a 4?"

**Community** (_single source_): when unsure between 3 and 4 with strangers, Gregory edges "on the side of caution" and recalibrates for game 2 [40]. The Command Zone calls the Bracket 4 talk "relatively simple": "it's not a cEDH deck, but I built it to be as good as I possibly can make it using the archetype I am building around". Still state your combos and your kill turn, because "my deck could win on turn four" lands badly on someone "expecting turn 10, turn 11" (transcript) [66].

## Bracket 5: cEDH

### Intent and feel

**Official.** Players expect "decks that are meticulously designed to battle in the cEDH metagame, with the ability to win quickly or generate overwhelming resources; often built using existing cEDH knowledge, tools, and/or decklists", "win conditions to be optimized for efficiency and consistency" and "gameplay to be intricate and advanced, with razor-thin margins for error; players prioritize victory over all else". "These games could end on any turn" [1]. Rule zero does not apply: it is active "at all bracket levels (other than cEDH)" [1].

**Community** (_consensus_). Bracket 5 is defined by the metagame, not the card pool: Brackets 4 and 5 are "strictly speaking, indistinguishable" in rules [22]. Bracket 4 asks "How strong can I make this deck?"; cEDH asks "How often can I win against the strongest decks available?" [23]. Cards must be strong in a vacuum: "No pet cards, no cut corners, no extra allowances" [22]. The commander serves the deck, as a win outlet (Thrasios, Triton Hero) or an engine (Rograkh, Son of Rohgahh), rather than being its payoff [22].

**Community** (_consensus_ among cEDH creators). Play to Win read the official "built using existing cEDH knowledge, tools, and/or decklists" as: "just because your deck is very strong doesn't mean it's a cEDH deck. It has to be built based around what the other decks are" (transcript) [71]. Their tells are meta tech: clone and Copy Enchantment counts sized to what everyone else plays, Praetor's Grasp for expected win conditions, Mindbreak Trap. Their own example, "you run way more clones because you know every single deck is playing Dockside", is historical: Dockside Extortionist has been banned since 2024-09-23 [101]. "If you bring a cEDH deck into a pod of fours, it should be clear there is a cEDH deck at the table" [71]. The Command Zone's version: "a turn three is a generous thing; you may not even get to turn three", and "if something is happening and there's nothing in my deck that was ready for it, that's how you can tell you're in a different space" (transcript) [66].

**Community** (_consensus_). The "turn 3 format" reputation is a misconception: some decks threaten turn-3 wins, but the others are built to answer them, so most games end around turns 5–6 (cEDH wiki, search summary only) [117]. Ken Baumann's estimate is "a five-turn format on average (with a standard deviation of two turns)", without a stated dataset [112].

### Official rules

- **Official.** No restrictions beyond the banned list; unlimited Game Changers [2][9]. Rule zero is not active [1].
- **Official** (launch text, superseded but never contradicted): "special care and attention paid to behavior and tableside negotiation (such as not making spite plays or concessions)" [3].

### Target composition

| Slot               | **Recommended** | Evidence                                                                                                                                                                              |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lands              | 24–29           | **Data** 28 (26–30) [95], 28 (26–29) on 2,758 decks [97]; three winning lists in autumn 2026 ran 24–26 [107][108][109]; **Community** Sam Black "my decks typically have 27-30" [113] |
| Mana sources total | 40–50           | **Community** "40-50 cards that make mana", about half of them lands [113]                                                                                                            |
| Ramp               | 20+             | **Data** 21 (17–25) [95]                                                                                                                                                              |
| Counterspells      | 8–11            | **Data** 8 (2–11) [95]; 9–11 in the winning lists (heuristic count) [107][108][109]                                                                                                   |
| Tutors             | 8–10            | **Data** 9 (6–12) [95]; 8–10 in the winning lists [107][108][109]                                                                                                                     |
| Game Changers      | 10–21           | **Data** 13 (10–18) [95]; 10–21 in the winning lists [107][108][109]                                                                                                                  |
| Average mana value | 1.8–2.4         | **Data** 2.20 / 2.10 [95][97]; 1.75–2.36 in the winning lists [107][108][109]                                                                                                         |

**Why so few lands.** **Community** (_consensus_), with numbers from Sam Black (2024-03-19, before the September 2024 bans) [113]: cEDH decks run "40-50 cards that make mana", so lands are only half the mana. With 30 lands, a land on each of turns 1–3 comes "64% of the time"; mulliganing 0–1-land hands, a 2-land hand by five cards comes in "around 97%" of games; with 25 lands only "~57%" of sevens have 2+ lands, "82%" with the free mulligan. The Command Zone's template makes the same exception: cEDH ramp is "zero and one mana ramp… rituals" because the game "is going to end by turn five" (transcript) [58]. Karsten's model explicitly does not apply here [98], but his regression formula, fed an average mana value near 2 and 30+ cheap draw and ramp spells, lands at 27–30 [99]. The exception proves the rule: EDHREC's Lumra cEDH list, borrowed from the cEDH Decklist Database, runs 47 lands because the lands are the engine [16].

### Card choices by role

**Data** (EDHTop16 "Staples", last-year window, retrieved 2026-11-08; the denominator, all decks or colour-eligible decks, is not stated, and Sol Ring's displayed 40.7% looks like an extraction artefact) [106]:

| Role                       | Cards and play rates                                                                                                                                                                                                                 | Status and notes                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Fast mana                  | Dark Ritual 79.3%, Elvish Spirit Guide 70.2%, Cabal Ritual 57.8%, Lotus Petal 36.6%, Chrome Mox 36.1%, Mana Vault 34.9%, Mox Diamond 34.2%, Mox Amber 25.7%, Mox Opal 24.6%, Lion's Eye Diamond 20.2%, Grim Monolith 13.8%           | Mana Crypt, Jeweled Lotus and Dockside Extortionist are banned [101]                                  |
| Dorks                      | Birds of Paradise 87.7%, Noble Hierarch 77.2%, Ignoble Hierarch 71.4%, Delighted Halfling 64.8%, Tinder Wall 42.3%                                                                                                                   | Percentages are relative to the green decks that can play them, if the denominator is colour-eligible |
| Engines                    | Mystic Remora 91.4%, Rhystic Study 87.7%, Smothering Tithe 70.1%, Necropotence 53.3%, Ad Nauseam 46.0%                                                                                                                               | Mystic Remora is not a Game Changer                                                                   |
| Free and cheap interaction | Flusterstorm 87.6%, Mental Misstep 87.5%, Force of Will 86.0%, Fierce Guardianship 85.5%, Silence 85.1%, Pact of Negation 84.9%, Deflecting Swat 83.7%, Mindbreak Trap 81.8%, Swan Song 73.8%, Force of Negation 63.4%               | Only Force of Will and Fierce Guardianship are Game Changers                                          |
| Removal                    | Swords to Plowshares 43.5%, Cyclonic Rift 25.4%, Path to Exile 13.9%                                                                                                                                                                 | Interaction lives on the stack, not on the battlefield                                                |
| Tutors                     | Vampiric Tutor 90.9%, Demonic Tutor 89.6%, Enlightened Tutor 81.7%, Imperial Seal 72.4%, Wishclaw Talisman 59.0%, Chord of Calling 58.5%, Mystical Tutor 55.8%, Diabolic Intent 52.8%, Green Sun's Zenith 45.4%, Worldly Tutor 42.3% | Four of these ten are not Game Changers                                                               |
| Lands                      | Underground Sea 90.4%, Tropical Island 89.6%, Tundra 88.6%, Volcanic Island 87.5%, Scrubland 87.1%, Boseiju, Who Endures 86.3%, Otawara, Soaring City 78.9%, Gaea's Cradle 68.8%                                                     | Original duals have basic land types, so fetches and Nature's Lore-style effects find them            |

**Community** (_consensus_). Turbo decks prefer "Silence" effects (Silence, Defense Grid, Grand Abolisher, Mandate of Peace) to "prevent a stack war from breaking out rather than selectively engaging in it" [114]. Baumann: "1 mana should stop a win", and "expect at least one disruptive spell or ability to be put on the stack" [112].

### Win conditions and combos

**Data** (EDHTop16 play rates, last year) [106]: Underworld Breach 67.2%, Thassa's Oracle 47.4%, Ad Nauseam 46.0%, Kinnan, Bonder Prodigy 37.6%, Hullbreaker Horror 20.8%, Displacer Kitten 12.1%, Consecrated Sphinx 11.0%.

The compact, tutorable wins [114][115][102]:

- **Thassa's Oracle + Demonic Consultation** (or + Tainted Pact): two cards, blue-black, Spellbook Ruthless, the most popular cEDH line on Spellbook (popularity 151,010). **Community** (_single source_): Thassa's Oracle being legal makes non-blue commanders uncompetitive [79].
- **Underworld Breach + Brain Freeze** with Lion's Eye Diamond or Lotus Petal: Spellbook tags it only **Powerful (P)**, which shows Spellbook tags are not a power ranking [102].
- **Ad Nauseam**, drawing about 25 cards on average in a turbo shell [114], and **Necropotence** with flash enablers; **Peer into the Abyss** [114][115].
- **Infinite-mana commanders**: Kinnan, Bonder Prodigy + Basalt Monolith (Ruthless) [102].

**Community** (_consensus_). Baumann's core lessons: "trying to win first usually makes you lose… Your chance of winning will be higher if you attempt to win second or third", and "the best way to win is to resolve the fewest spells at the lowest cost" [112]. A cEDH commander typically generates cards, generates mana, or supplies or finds part of a game-ending combo; Kinnan, Tymna and Sisay do, and meeting the checklist on paper is not enough [47].

### Archetypes and the current field

**Community** (_consensus_), from the EDHREC cEDH guides [114][115] and community wiki (search summary) [117]:

| Archetype | Plan                                                                                                                                                                                                        | Weakness                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Turbo     | End the game "just as the other strategies are setting up", with win attempts "on turn two, if not turn one" [114]                                                                                          | Resilience comes second; recovery after a failed attempt is hard [114]                                            |
| Midrange  | Use the first turns to build resources (Mystic Remora, Rhystic Study), then win with a compact combo in the mid to late game [114][115]                                                                     | Must interact well enough to survive the turbo decks' early attempts                                              |
| Stax      | The "final check": lock pieces such as Rule of Law, Thorn of Amethyst and Root Maze; silver bullets such as Grafdigger's Cage, Cursed Totem and Null Rod; a commander-based or classic combo to close [115] | **Community** (_single source_, search summary): turbo and midrange "historically win more often than stax" [118] |

**Community** (_single source_, pre-bracket, 2024-11-13): community data shows about 75–80 near-mandatory cards and 20–25 flex slots that tilt a deck toward turbo, midrange, stax or tempo; "locking yourself out of certain colors, especially blue, is risky" [55].

**Data** (EDHTop16, last six months, events with 50+ players, commanders with 20+ entries, retrieved 2026-11-08) [105]. Pair names as EDHTop16 displays them:

| Commander            | Meta share | Entries |
| -------------------- | ---------- | ------- |
| Kraum / Tymna        | 7.39%      | 1,319   |
| Kinnan               | 6.66%      | 1,189   |
| Rograkh / Thrasios   | 5.08%      | 907     |
| Rograkh / Silas Renn | 4.38%      | 782     |
| Sisay                | 3.79%      | 677     |
| Thrasios / Tymna     | 2.94%      |         |
| Ishai / Rograkh      | 2.03%      |         |
| Dargo / Tymna        | 2.02%      |         |
| Ral, Monsoon Mage    | 2.00%      |         |
| Vivi Ornitier        | 1.79%      |         |

**Data.** Over a one-year window, Kraum / Tymna converts to top cut at 24.14% (2,780 entries) and Kinnan at 19.40% (2,315 entries) [105]. "No deck taking up more than about 9%" of the field; the best conversion rates sit in tiny niches, such as Oswald Fiddlebender at "nearly 50%" on 0.11% of the meta [111]. **Community** (_single source_): cEDH commanders tend to be partner pairs or five-colour piles (Tymna and Kraum, Rograkh and Silas Renn, Thrasios, Sisay) or specific combo commanders (Kinnan, Magda) (Rachel Weeks, transcript) [66]. Read together: the field is blue-black midrange with a compact combo (Kraum / Tymna, Thrasios / Tymna, Sisay), then Rograkh-based turbo and storm, then infinite-mana combo (Kinnan, Magda). Dedicated stax is rare. The cEDH Decklist Database curates the competitive lists; its latest "Competitive" additions are dated 2026-02-16, and many older entries have not been refreshed since 2023 [110].

### Mulligans, draws and proxies

- **Mulligan aggressively.** **Community** (_consensus_): mulligan toward hands that feel "wildly impressive" [112]; with 28–30 lands and the free mulligan, throwing back 0–1-landers still finds a 2-land hand by five cards about 97% of the time [113]. A key fast-mana or engine card shows up in 75% of openers in Sam Black's model [113].
- **Mana first, then the plan.** **Computed** (a cEDH shell: 28 lands, 21 ramp all costing 2 or less, average mana value 2.00, a 2-mana commander; mana spent through turn 4):
  - The first seven needs two cheap mana pieces. With one: two lands is −1.4%, three lands −1.5%. With two: two lands is +13.2%, one land +9.3%.
  - On the second seven one piece is enough (+8.7%).
  - Correct mulligans raise "four mana sources by the end of turn 2" from 41% to 60%.
  - The land curve is flat from 24 to 30 and falls past 30, which matches the measured median of 28.
  - The mana-optimal rule holds a key card (tutor, combo piece or engine) slightly less often, 58% against 64% when every seven is kept. That is why cEDH keep rules also name the plan card ([companion](commander-mulligans-curves-and-play-style.md#what-each-archetype-needs-from-its-opening-hand)).
- **Expect draws in big events.** **Data** (FourthSeat.gg, reported by EDHREC, 2026-09-11; game counts not given): draw rates of 27.15–36.57% at large 2026 events (TopDeck Invitational 35.59%, The Boil 36.57%, The Quest for a Cause 31.91%), and 9.89% at the 429-player Breach the Bay 2. Seats 1–2 win "at a much higher rate" than seats 3–4 [116]. The table routinely stops every win attempt; Pact of Negation is a "go-to king-maker-prevention-tool" [116].
- **Politics are part of the game.** The game is "a series of 3v1's"; "it is better to over-communicate than be silent"; "your opponents should fear you the least and like you the most" [112]. Don't counter a win just to delay one you cannot stop [47].
- **Proxies.** **Community** (_consensus_): cEDH is "proxy friendly" [47][55]. At events, ask the organizer, not the pod [88]. A Geneva store's casual bracket night allows proxies outright [124].
- **Play cEDH only against people who asked for it** [47]. A cEDH deck can pubstomp, but "not every deck that pubstomps is a cEDH deck"; and a cEDH deck built to beat other cEDH decks can lose to a table of precons [82].

### What to avoid

- **Community** (_consensus_): pet cards; building around the commander instead of letting it serve the deck; ignoring the metagame [22].
- **Community** (_single source_): a turbo deck that cannot recover after a failed early attempt [114].
- **Community** (_single source_, pre-bracket): locking yourself out of blue [55].

### Common mistakes

- **Calling a deck Bracket 5 because it holds strong cards** rather than because it follows the current field (search summary) [82].
- **Judging by speed.** cEDH aims to be relevant on turns 2–3, not to win every game that early [87].
- **Assuming fast mana, free spells or tutors make a deck cEDH.** Girten's Bracket 4 upgrades already add Force of Will, Mana Vault and Ancient Tomb [19].

### You are probably in the wrong bracket if…

A practical test from the forums [22][23][79]; if any answer is no, the deck is Bracket 4, however strong:

1. Is every slot chosen against the current field, or for your commander's theme?
2. Is the commander an engine or win outlet rather than the payoff?
3. Is the deck at about 24–30 lands with average mana value about 2.3 or lower?
4. Does it run a dense fast-mana package plus several free or one-mana interaction pieces?
5. Does it run a compact, tutorable win?
6. Would you register it at a 50-player event without apologising for a single card?

Play to Win's one-question shortcut: "do you play Copy Enchantment in it?", that is, did the field set your clone count (transcript) [72]. And from the other side: "if you're intending to play it against other cEDH decks, I can't say your deck is not cEDH" [71].

### Reference decks

- **Kraum, Ludevic's Opus / Tymna the Weaver**, Gary Lowther, 1st of 65 at Road to the Coliseum, 2026-10-31: 26 lands, average mana value 1.85, 9 rocks, 10 tutors, 9 counterspells, 21 Game Changers (computed by the research, heuristic counts) [107].
- **Kraum / Tymna**, Duncan Gilchrist, 1st of 150 at MBG Commanderpalooza #3, 2026-10-24: 25 lands, 1.75, 20 Game Changers [108].
- **Kinnan, Bonder Prodigy**, Jude Apcher, 1st of 51 at the cEDH Taunton Euro Qualifier, 2026-11-07: 24 lands plus a modal double-faced land, 2.36, 13 rocks, 7 dorks, 10 Game Changers [109].
- **cEDH Decklist Database** competitive entries such as Kinnan Infinite Mana, Sisay Midrange Tutors, Thrasios/Tymna Midrange and Magda Clock Combo [110].
- **Lumra, Bellow of the Woods, Bracket 5** (EDHREC, from the cEDH Decklist Database): turbo a win on turns 2–3 or stax out to a win on turns 5–6; 29 combos, about 15 tutors, 47 lands [16]. [List on Archidekt](https://archidekt.com/articles/edhrec/edhrec-guide-to-commander-brackets/bracket5).

### Budget

**Data** (one sample build): a mono-red Magda, Brazen Outlaw list cost **$522.99** on 2026-03-26 and "will struggle through more games than it wins". Its author's answer to "cEDH on a budget" is "Short answer, you can't", and "The most expensive aspect of Bracket 5 decks is Lands" [48]. On 2026-11-08: Gaea's Cradle $1,654.93, Grim Monolith $475.65, Mox Opal $222.62, Chrome Mox $162.93, Ancient Tomb $125.70 [101]; Scryfall gave no default price for the original duals, Mox Diamond or Lion's Eye Diamond. Prices move. Proxies are how much of the community closes the gap [47].

### Say it at the table

> "cEDH: Kinnan, current list, full fast mana and free interaction. I'm here to win; no rule zero changes. Are we all on cEDH?"

Say it even when nobody asks. Creators agree a cEDH deck at a Bracket 4 table should be announced, not discovered [71], and that the line between the two is "mostly emotional rather than card-wise", so intent is the only thing you can declare [66].

## Moving a deck between brackets

**Official.** Each step changes one thing: THEME (1 ↔ 2), STAPLES (2 ↔ 3), SPEED (3 ↔ 4), METAGAME (4 ↔ 5) [2]. Use the arrow as the question to ask before touching a card (**Community**, Rachel Weeks' reading of her own graphic [65]):

- **1 ↔ 2, theme.** Is the restriction the point of the deck, chosen before the cards? Then 1. Is the deck trying to win with its theme? Then 2.
- **2 ↔ 3, staples.** Is the deck full of cards "that get played a ton"? Then 3. Held back by synergy or budget? Then 2.
- **3 ↔ 4, speed.** Is the deck built to get there "as fast as possible", with fast mana, rituals, every one-mana dork and free disruption? Then 4.
- **4 ↔ 5, metagame.** Did you build against the cEDH field? If not, "you're four".

The levers writers and creators actually name:

| Step  | Levers up                                                                                                                                                                                                                  | Levers down                                                                                                                                                                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 ↔ 2 | Drop the restriction; fill the roles with functional cards                                                                                                                                                                 | Adopt a restriction and make it the point of the deck [51][43]                                                                                                                                                                                               |
| 2 ↔ 3 | Sol Ring and 2-mana ramp instead of 3-mana; efficient removal (Vraska's Contempt over Casualties of War); untapped duals; one to three Game Changers; a reliable closer; real interaction [44][17]                         | Themed cards over best-in-slot; a weaker commander ("a reliable way to reduce power"); cut generic staples; Giant Adephage for Craterhoof Behemoth; combos only at 4+ cards without the commander; fewer protection spells; basics and taplands [38][44][18] |
| 3 ↔ 4 | Fast mana (Game Changer or not); tutors for combo pieces; an A+B commander; free interaction; Thassa's Oracle and two-card combos; mana dorks for a turn-2 commander [40][52][19]                                          | Remove the fourth and later Game Changers; swap Ruthless combos for slower lines; cut fast mana and free spells                                                                                                                                              |
| 4 ↔ 5 | Tune against the field; meta-facing hate and stax such as Aven Mindcensor, Grand Abolisher, Pyroblast, Gilded Drake, Opposition Agent, Orcish Bowmasters [53]; cut every pet card; lower lands toward 24–30 with fast mana | Keep the commander as the payoff; ignore the field; play to your own strategy [22]                                                                                                                                                                           |

**Community** (_consensus_): one card does not move a bracket. "Changing one card from a precon doesn't suddenly make it Upgraded (3)" [51]; moving Hofri Ghostforge from 3 to 4 would need "a major overhaul" [40]. Girten's conversions changed 10 cards (into Bracket 3) [17], 20–36 cards (into Bracket 4) [19] and 20+ cards (down to Bracket 2) [18]. Older commanders need more: "For older designs to keep up with the new-school Commanders (and their tools!), they have to equip themselves to the nines" [41].

**Community** (_consensus_ among creators). What creators add to the levers (transcripts):

- **Down, from 4:** "You want to play with everybody? Then don't be a four… take some game changers out, make your deck a little bit slower, don't put in free counterspells… now you can play with the vast majority of people" (Josh Lee Kwai) [65].
- **Up, when the deck refuses to be slow:** some commanders, Orvar, the All-Form and Lord Windgrace among them, "just can't chill out"; removing combo pieces still "goes nuts". Then "push it: put all of the fast mana in, put all the free disruption in, maximize the tutors and the combos rather than try and hinder them", and find a Bracket 4 group (Rachel Weeks) [66].
- **Tutors follow the deck's real power,** in both directions. Rachel Weeks added tutors to a storm deck "to match the power level of what the deck was actually doing, instead of 'I'm not going to play any tutors because it's a casual deck'" [64]; a Helix Pinnacle deck moved down to Bracket 2 on mediocre non-Game Changer tutors [69].
- **3 → 4 costs theme:** "you sacrifice a little bit of your theme in bracket four for optimization" (Play to Win) [72].
- **Ramp quality, not ramp count:** casual decks use two-mana rocks; at higher power "it's a lot of zero and one mana stuff" [58].
- **4 → 5 is meta tech, not money:** clones, Praetor's Grasp, Mindbreak Trap, lists built from the cEDH database [71][66]. Adding Game Changers or spending more does not make a deck Bracket 4 by itself [72].

### Cards that push a deck to Bracket 4 without being Game Changers

Counting Game Changers alone misses three groups:

1. **The ten cards removed in October 2025** [1]. The high-mana-value ones (Expropriate, Jin-Gitaxias, Core Augur, Sway of the Stars, Vorinclex, Voice of Hunger) are big spells, not speed tells. The rest are cEDH-grade: Kinnan, Bonder Prodigy (6.66% of the cEDH field [105]), Urza, Lord High Artificer, Winota, Joiner of Forces, Yuriko, the Tiger's Shadow, Food Chain, and Deflecting Swat (83.7% cEDH play rate [106]).
2. **Pieces of Spellbook-Ruthless two-card combos** [102]: Demonic Consultation, Tainted Pact, Basalt Monolith, Rings of Brighthearth, Forsaken Monument, Kiki-Jiki, Mirror Breaker, Zealous Conscripts, Splinter Twin, Pestermite, Eternal Scourge, Squee, the Immortal, Isochron Scepter, Narset's Reversal, Worldgorger Dragon, Animate Dead, Scurry Oak, Ivy Lane Denizen, Bruvac the Grandiloquent, Maddening Cacophony.
3. **Non-Game Changer fast mana, free spells and tutors with cEDH play rates** [106]: Mystic Remora 91.4%, Flusterstorm 87.6%, Mental Misstep 87.5%, Silence 85.1%, Pact of Negation 84.9%, Mindbreak Trap 81.8%, Dark Ritual 79.3%, Elvish Spirit Guide 70.2%, Force of Negation 63.4%, Wishclaw Talisman 59.0%, Chord of Calling 58.5%, Cabal Ritual 57.8%, Diabolic Intent 52.8%, Green Sun's Zenith 45.4%, Lotus Petal 36.6%, Mox Amber 25.7%, Mox Opal 24.6%; and Esper Sentinel [56].

Mass land denial and extra-turn cards are not Game Changers either, yet both are restricted below Bracket 4 [2]. **Community** (_single source_): Esper Sentinel, Mystic Remora, Mox Opal, Sol Ring and Craterhoof Behemoth have all been argued to deserve Game Changer status [56].

## Assessing your own deck and the pregame conversation

### Self-assessment heuristics

- **Track win rate.** **Community** (_single source_): "a balanced ecosystem of play means you should win about 25-30% of the time"; consistently winning "more than 33%" means the deck is probably in the wrong bracket. The article gives both thresholds without reconciling them [25].
- **Log about 20 games.** **Data** (Playgroup.gg): around 20 recorded games is where results start "saying more than the label" [93].
- **"If you need to ask how Bracket 1 differs from 2, or 4 from 5, your deck likely belongs in 2 or 4"** [51].
- **Say the name, not the number.** "The name of each bracket is more important than the number by far": "You said your deck was core…" lands differently from "You said your deck was a 2…" [51].
- **When unsure between 3 and 4 with strangers, say 3 and adjust for game 2** [40].
- **Hold a rule zero talk after the game too:** "was that typical or lucky?" Switch to a weaker deck if yours outclasses the pod [25].
- **Use the turn floor as a kill-speed ceiling.** "My deck should not usually win, or knock someone out, before turn N" is the most bracket-relevant question you can ask of a list [1].
- **Start from the description, not the count.** Pick the bracket whose expectation sentences you "identify with", then "cross-reference with the actual details on the bottom" and adjust, either your label or your list; a site's Game Changer count gives only "the lowest bracket you can operate in" (The Command Zone, transcript) [63].
- **Compare boards on turn 4.** **Community** (_contested_ against the win-rate heuristics above): "Set win percentage aside… how many things you have on your board on turn four versus how many things they have on turn four, that is a much clearer indicator of speed and consistency." Other tells: consistently killing players before they have cast their commander; "if the whole table has to gang up on you anytime you play that deck, it's probably more powerful than is appropriate"; people's faces when you pull it out. "Stay inside a box or get explicit permission to go outside the box" (The Command Zone, transcript) [64].

### What the data says about self-labelling

**Data** (Playgroup.gg, 37,967 decks with full lists and 5+ logged games, 442,680 games, updated 2026-11-08; correlations from an engaged-player sample) [93]:

- The declared bracket "explains about 2-3% of the spread in results", and **about one deck in four performs like a different bracket**.
- Owners ordered their own decks correctly **about 60%** of the time, against 50% for chance.
- A deck's past record predicts its later games about 15–20 times better than its declared bracket.
- A deck one bracket above its table wins about 5 percentage points more often; two brackets above, about 30% of four-player games against 25% expected.
- Win rate against average by Game Changer count: 0 Game Changers −5.0% (217,446 games), 1–3 +2.5% (163,074), 4+ +9.5% (62,160). The page's introduction contradicts its own table ("about 12-15% more often"); cite the table only.

**Community** (_consensus_). Players reach the same conclusion without the data. The top answer to a Reddit thread asking "Do brackets generally equal deck strength?" was "Other way around. Deck strength equals bracket." [84]. Videos on mislabelled decks draw large audiences: "I Audited More Commander Decks (They Still Lied)" (297,043 views) and "The Real Problem With Bracket 2 & 3 (It's Not Your Deck)" (118,220 views), titles only [62][61].

The causes behind mismatches, by how often sources cite them: kill speed and consistency above the bracket's clock (commanders that are engines, tutors, A+B commanders, fast mana); voltron or aggro removing one player early in Brackets 2–3, which the official text does not cover; a Game Changer count used as the only yardstick; too little interaction in a slow deck [40][26][38][51].

### What automated estimators can and cannot see

**Community** (_consensus_). Every estimator reads only the hard signals (Game Changers, mass land denial, extra turns, early two-card combos, sometimes fast mana or free counterspells) and outputs a floor [51][103]. TableCommander documents its rules: it outputs only Brackets 2–4, ignores card quality, tutor count, interaction density and mana base, and warns that "a strong deck without flagged cards can still estimate at Bracket 2" [103]. Moxfield's own position, as quoted: "We don't want people to take us as gospel" [57]. Commander Spellbook warns its brackets "are automatically generated, and may not be entirely accurate" [102]. Bracket 1 and Bracket 5 depend on intent and must be set by hand [103]. **Community** (_contested_, launch-era): when the system launched, players ran decks they knew were 3s through Moxfield and got Bracket 1 or 2 labels; one Commander Clash host called the "very definitive-looking chart" a source of "confusion and… misinformation", while Tomer Abramovici (MTGGoldfish's Budget Commander, who joined the panel in December 2025 [12]) answered that "it's not a power ranking… it's a matchmaking system" and that "you're not supposed to plug in a number and say Moxfield told me it's two" (transcript) [74].

### The pregame conversation

**Community** (_consensus_). The script that community guides converge on [89][90][88]:

1. Bracket **name** and commander.
2. The plan in one sentence, and how it wins.
3. The realistic fastest win turn.
4. Flags: Game Changers by name, combos, stax, extra turns, land denial, proxies.
5. One question to the table: "Does anyone want to avoid something?"

If someone objects, change the deck or the game [89]. Brackets work best with strangers; trusted groups already self-select [40][27]: "once you've… made friends with people, the rules don't have to matter" (Olivia Gobert-Hicks, transcript) [67].

**Community** (_consensus_ among creators). Disclose more than the number. Name _which_ Game Changers you run and why, for example a flavourful Demonic Tutor in a demon deck; say how the deck finishes and how much interaction it holds; and admit uncertainty: "I just built this, I think it's B3 but it might feel too powerful" is a fine pregame line (Play to Win, transcript) [72]. At Bracket 4, agree on take-backs, missed triggers and priority, and warn the table about your social style if you talk a lot [66]. **Community** (_single source_, pre-bracket, 2015): misrepresenting your deck's intent is "a clear violation of the spirit", and "all styles are equally valid" as long as players are "on the same page or close to it" [54].

## Open debates

These are unresolved. The guide presents both sides; the product should not pick one silently.

**Sol Ring at Brackets 1–2.**
**Official:** "Every deck gets exactly one Sol Ring"; it is deliberately not a Game Changer [3]. It is the most played card in Commander (8,762,227 decks over two years on EDHREC) [33].
**Community** (_contested_): Wischkaemper excludes it at Brackets 1 and 2 ("most decks shouldn't run it") and admits it at 3 [43][44][45]; WitchPHD drops it in Bracket 2 because it "creates a power outlier" [80]; MTGRocks argued it should be a Game Changer [56].

**Precons and Bracket 2.**
**Official:** decoupled since 2025-10-21; the decoupling produced "a meaningful shift of people assigning more decks the Bracket 2 (Core) label" [1][6].
**Community** (_contested_): Sable and Gregory still describe Core as modern-precon power [51][38]; Wischkaemper treats precons as a threat at the table [44]; Kurtz notes some precons now carry Game Changers [48].
**Data** (tool ratings, not play): ScrollVault rates 148 of 178 precon lists Bracket 2, 29 Bracket 3 and 1 Bracket 4 [96]; commanderbracket.app rates 128 of 169 Bracket 2 and 41 Bracket 3 (search summary) [104]. Trackers disagree on individual decks. Many players still follow the original rule [26].

**Game Changers in Bracket 1 themes.**
**Official:** thematic exceptions by pod agreement since October 2025 [1][2].
**Community** (_contested_): Wischkaemper allows Rhystic Study in a deck about people reading [43]; Gregory's launch explainer described Game Changers as excluded from Exhibition and Core [36], which matched the February 2025 text. The current official text sides with the exception, but only for "highly thematic" cards and only with the pod's agreement.

**"Bracket 3 is too wide" and Bracket 3.5.**
**Official:** "a pretty wide space; we only want to slice so thin"; an extra bracket "might really fray understanding" [6].
**Community** (_contested_): Gregory: "We need a Bracket 3.5 – or whatever you want to call it – today" [41]; Perry proposes a tier with 5–7 Game Changers and Bracket 3's clock [26]; No Salt EDH notes players already say "3-" and "3+" [86]; WitchPHD says most Bracket 3 players would be happier choosing Bracket 2 or 4 [80]; a late-2026 video titled "Bracket 3 is the new 'My Deck is a 7'" drew 68,260 views [60]. Against: a bell curve with most decks in Bracket 3 is expected [77]. Panel members on The Command Zone defend the width: "We had 10 and at 10… everything was a seven. Then we went down to five and… everything's a three… guaranteed you make six, everyone's a four"; clustering is "a feature, not a bug", and "something like 70%" of decks can play together (Josh Lee Kwai, transcript) [65]. Part of the crowding is psychology: "it feels kind of poopy when five exists", so "way more people think their decks are three and that's a two" [63].
**Data:** composition barely separates Brackets 2 and 3 (36 vs 35 lands, 3.18 vs 3.14 average mana value on Moxfield) [97].

**What separates Bracket 4 from Bracket 5.**
**Official:** whether the deck adheres to the cEDH metagame [1].
**Community** (_contested_ on emphasis): metagame (Gregory) [40]; player intent (Kurtz) [46]; meta-hate and stax cards (Royale) [53]; the commander's role (McGuinness) [22]; "nearly nonexistent", mostly "vibes" (one TappedOut poster) [79]; low Bracket 4 and high Bracket 4 "feel completely different" (r/CompetitiveEDH, search summary) [85]; "mostly emotional rather than card-wise" (The Command Zone) [66].
**Community** (_contested_): is Bracket 4 a coherent bracket at all? Commander Clash asked at launch "How's it different from cEDH?" [74]. Play to Win's Dylan, from the cEDH side: "I don't really get the point of bracket 4… you should make your deck into a cEDH deck… fringe cEDH", since "optimized casual deck… sounds like two things that can't be true"; his co-host answers that "there can just be good bracket four decks and bad bracket four decks and I think that's okay" (transcript) [72]. Creators with panel seats defend Bracket 4 as the home for decks built to the maximum around their own commander, "in more of a vacuum" [66].

**Does a lone cEDH combo make a deck Bracket 4?**
**Community** (_contested_). In the Iroh thread (531 points), the top comment (414 points) said "I will not build a deck under bracket 5 that uses Breach or Thassa's lines"; the next (355 points) said "No, that alone doesn't make it bracket 4" but that such a win condition rarely appears without a Bracket 4 deck around it [83]. **Official:** Thassa's Oracle and Underworld Breach are Game Changers a Bracket 3 deck may run, but a two-card win that "could frequently come up" before turn 6 is "not the best fit" [1]. Creators lean toward the stricter reading: a tutorable Consultation line "can happen super reliably in those first six turns" [66], and Play to Win would keep it out of Bracket 4 decks too, as "the cEDH meta combo" [71].

**Is the Game Changer list the right measure?**
**Official:** it catches cards that "easily and dramatically warp Commander games" and is not meant as a power scale; intent decides [1][4].
**Community** (_contested_): "kind of weird that we have like a Highlander point system in casual now in addition to a ban list" (Play to Win) [72]; "trying to put rules and exact specifications on to what mostly boils down to vibes" (EDHRECast) [68]; for a Grand Arbiter Augustin IV or Korvold, Fae-Cursed King deck "the game changer is the commander", and "can the game changers list even deal with [commanders] effectively? I'm not sure it can" (The Command Zone) [63]; a points system would weigh Jeska's Will and Rhystic Study differently [81]; at launch, one forum poster judged that only about 7 of the original 40 "can arguably end the game" [78]; the list mixes powerful cards with merely unpleasant ones [26]; Sol Ring's absence beside Ancient Tomb, Chrome Mox, Mox Diamond and Mana Vault is hard to defend (Magic C'est Chic !) [125]. The October 2025 removal of command-zone legends gives "more freedom" but "more responsibility for the players" [68].

**Are the turn numbers useful?**
**Official:** added in October 2025 because "length of game is an important factor" [1].
**Community** (_contested_): EDHRECast calls them "one of the biggest wins", since mismatched expectations of game length cause most bad games [68]; Josh Lee Kwai doubts "most people really know what that number is" [65]; players overestimate their game length by one to two turns [69]; one writer reports the new Bracket 2 wording was "universally criticized" online [82]; EDHREC's own report called six turns "optimistic" for Bracket 3 and four turns close to too fast for Bracket 4 [24]. Framing the number as "the turn I'd be upset to die before" is the creators' workaround [65].

**Should Bracket 1 exist?**
**Community** (_contested_): the panel itself debated it; Rachel Weeks argued to keep it as "a space for these kind of creative decks" [63]. JoeyDH defends it but notes only 1.59% of user-labelled decks on EDHREC are Bracket 1, so its decks mostly play in Bracket 2 pods [70]. A French podcaster called it "quelque chose de très américain… j'en ai jamais vu" [125].

**When is a Bracket 3 combo "late"?**
**Official:** not before turn 6, glossed as "someone's seventh turn" [1].
**Community** (_contested_): one guide reads it as after turn 7, another discourages combos that work in the first five turns (both search summaries) [102]; EDHRECast notes the one-turn gap between "at least six turns" and "no two-card combos before turn six" [68]; panel members asked on air "Can I play Thassa's Oracle/Consult on turn seven?" before the October 2025 rewrite [63]; WitchPHD argues no combo can be built to be unable to win before turn 6 [80]; EDHREC's combo vote produced ratings one author called "absurd", such as Gravecrawler + Phyrexian Altar as an early combo playable only at Bracket 4+ [82][30]. The vote was rerun in April 2026, after Commander Spellbook passed 80,000 combos [31].

**Karsten versus real land counts.**
**Data:** Karsten's model wants 42 lands plus Sol Ring, cutting toward a 37 floor [98]; Playgroup recommends 38–42 [92]; real decks below cEDH sit at 35–37 [95][97], and Karsten himself called EDHREC's typical 36 too low [98].
**Data** on the other side: win rate is flat for 2–5-land openers [92], and one land changes the miss-a-drop rate by a few points [97]. Low-bracket decks are under-landed relative to the math, not over; whether that matters in multiplayer is unproven.

**Bracket 4 land counts.**
**Data:** Archidekt 35 (33–37) with average mana value 3.04 [95]; Moxfield 33 (30–35) with 2.80 [97]. The Moxfield sample leans toward most-viewed, tuned decks. Bracket 4 should be taught as a range that tracks the curve.

**Non-Game Changer fast mana in Bracket 3.**
**Community** (_contested_): Girten added Mox Opal and Mox Amber to a Bracket 3 artifact deck "for early, fast mana" [17]; Fink argued Mox Opal belongs on the Game Changer list [56].

## Implications for MagicAIBuilder

Short and factual; product decisions belong to the [I-28 spec](../specs/i28-commander-deckbuilding-guide-by-bracket.md).

1. **A checklist-only estimate misclassifies roughly one deck in four** [93]. The in-app guide has to teach speed and consistency (fastest realistic win, tutor and fast-mana density, commander as engine, interaction density), not only counts. A bracket estimate should be presented as a floor from checklist signals plus a separate reading of speed, as every estimator's own documentation already concedes [103][4]. Creators name measurable speed signals: 0–1-mana mana sources, free interaction, what the tutors can find, the earliest turn a two-card combo can be assembled with the deck's tutors, and board size on turn 4, which The Command Zone prefers to win rate [64][66]. None of these comes with a published threshold; any cut-off the product uses is its own and should say so.
2. **The pregame line is a product surface.** The community script above maps onto [I-15 Rule 0 sheets](../specs/i15-rule-zero-sheets-and-pod-profiles.md); the precon-to-Bracket-3 levers map onto [I-17 tiered upgrades](../specs/i17-precon-path-and-tiered-upgrades.md); the per-warning explanations belong with [I-27](../specs/i27-learning-while-building.md).
3. **House rules differ on Sol Ring, precons and Bracket 1 Game Changers.** Those are better exposed as explicit pod settings than hard-coded.
4. **The playtest does not yet follow the multiplayer mulligan.** **Computed:** the engine as it stands captures only 37–47% of the value of correct multiplayer mulligans. The first mulligan goes to six cards instead of a free seven. After a mulligan, the hand is N random cards rather than seven cards with N chosen ones put on the bottom. The opening-hand advice uses fixed land thresholds that ignore ramp and the mulligan stage. The rows below cite the lines; the [companion](commander-mulligans-curves-and-play-style.md#implications-for-magicaibuilder) maps each to I-07, I-21 or I-28.
5. **Repository discrepancies.** Each was checked against the file on 2026-11-08, and the playtest rows on 2026-11-09. Bracket code rows are open and tracked by I-28, and playtest rows by I-07. The two documentation references were corrected in the same change as this guide (last two rows).

| File (line)                                                                                                                                               | What it says                                                                                                                                                                                                                                                                                                          | Current state                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`src/lib/constants/brackets.ts`](../../../src/lib/constants/brackets.ts) (2); `src/lib/deck/types.ts` (21, 80, 81, 121); `src/lib/deck/bracket.ts` (218) | `BracketLevel = 1 \| 2 \| 3 \| 4`; scores clamped to 1–4                                                                                                                                                                                                                                                              | **Official** five brackets [1]. `src/app/api/ai/build/types.ts` (11) and `src/lib/ai/deck-plan.ts` (127) already accept 5                                                                                                                                          |
| `src/lib/constants/brackets.ts` (17, 19)                                                                                                                  | Bracket 1 named "Casual", described as "Pre-cons and casual home brews"                                                                                                                                                                                                                                               | **Official** name "Exhibition", theme-first; precons decoupled from any bracket [1]                                                                                                                                                                                |
| `src/lib/constants/brackets.ts` (23)                                                                                                                      | `allowsTutors: false` for Bracket 1                                                                                                                                                                                                                                                                                   | **Official** tutor restriction removed 2025-10-21 [1]                                                                                                                                                                                                              |
| `src/lib/ai/deck-plan.ts` (123, 124)                                                                                                                      | Bracket 1 "no tutors"; Bracket 2 "at most 1 game changer"                                                                                                                                                                                                                                                             | **Official** tutors unrestricted; Bracket 2 allows zero Game Changers [1][2]. This string grounds the AI copilot                                                                                                                                                   |
| [`src/lib/constants/benchmarks.ts`](../../../src/lib/constants/benchmarks.ts) (14, 18)                                                                    | Ramp "high" 12 scores Bracket 4; average mana value "low" 3.5, "high" 2.2                                                                                                                                                                                                                                             | **Data** median ramp is 13 at Bracket 2 and 14 at Bracket 4 [95]; every bracket's median mana value is below 3.5, and 2.2 is the cEDH median [95][97]                                                                                                              |
| `src/lib/deck/bracket.ts` (37, 144)                                                                                                                       | Ramp thresholds `[5, 8, 12]`; "Low land count (<33) — recommend 33–38"                                                                                                                                                                                                                                                | **Data** a median Bracket 2 deck (13 ramp) scores 4 on ramp; the land warning fires on the Bracket 5 median (28) and Bracket 4's lower quartile (30) [95][97]                                                                                                      |
| `src/lib/deck/bracket.ts` (117, 200–204)                                                                                                                  | Any two-card infinite sets the deck to Bracket 4, labelled "(RC rule)"                                                                                                                                                                                                                                                | **Official** Bracket 3 allows two-card combos that do not come up before turn 6 [1][2]; the Rules Committee stopped managing the format on 2024-09-30 [10]                                                                                                         |
| [`src/lib/playtest/engine.ts`](../../../src/lib/playtest/engine.ts) (178–201); `src/lib/playtest/engine.test.ts` (444)                                    | `applyMulligan` keeps `7 − N` random cards, with a comment saying this "is the same distribution" as London; the test expects six cards after the first mulligan                                                                                                                                                      | **Official** the first mulligan is free in multiplayer games and in any Brawl game (CR 103.5c), and London draws seven and bottoms N chosen cards [14]. **Computed:** choosing what to bottom is worth measurable mana; random cards are not the same distribution |
| [`src/lib/playtest/opening-hand-evidence.ts`](../../../src/lib/playtest/opening-hand-evidence.ts) (24, 27); `src/messages/en/builder.json` (85, 87)       | 0–1 lands "Land-light: consider a mulligan"; 5+ lands "Land-heavy"; the same for every deck, hand size and mulligan stage                                                                                                                                                                                             | **Computed:** a 2-land first seven without cheap ramp is a mulligan in every shell, and 1 land with two cheap ramp pieces is a keep. The advice is wrong in both directions on the first seven                                                                     |
| `src/messages/en/deck.json` (275); `src/lib/deck/turn-one.ts` (17)                                                                                        | Turn-one odds cover "Opening seven only — no mulligans"                                                                                                                                                                                                                                                               | **Official** two free sevens in multiplayer [14]; the odds understate what a player sees before keeping                                                                                                                                                            |
| [`docs/product/commander-power-meter.md`](../commander-power-meter.md) (160)                                                                              | "any 2-card infinite combo → min Bracket 4"                                                                                                                                                                                                                                                                           | Stricter than **Official** "no two-card combos before turn 6" at Bracket 3 [2]                                                                                                                                                                                     |
| `docs/product/commander-power-meter.md` (162)                                                                                                             | Fast-mana floor names "Mana Crypt + Mana Vault + LED + Sol Ring"                                                                                                                                                                                                                                                      | **Official** Mana Crypt banned since 2024-09-23 [13][101]                                                                                                                                                                                                          |
| `docs/product/commander-power-meter.md` (62, 170)                                                                                                         | Extra turns as a soft signal                                                                                                                                                                                                                                                                                          | **Official** none in Bracket 1, no chaining in Brackets 2–3 [2]                                                                                                                                                                                                    |
| [`docs/references/game-changers.md`](../../references/game-changers.md)                                                                                   | Bracket limits listed 1–4 only; "February 9, 2026 (+5 added)" with Gifts Ungiven, Panoptic Mirror and a Fierce Guardianship re-add; Gifts Ungiven and Panoptic Mirror "unbanned Feb 2026"; October 2025 "−11" with wrong reasons and Sway of the Stars "remains banned"; April 2025 "+18" with the tutor-rule removal | **Corrected 2026-11-08:** Bracket 5 unlimited [9]; February 2026 +2 (Farewell, Biorhythm) [6]; unbans dated 2025-04-22 [5]; October 2025 −10 with the official reasons [1]; April 2025 +23 (18 new, 5 unbanned) [4]; tutor restriction removed 2025-10-21 [1]      |
| [`.agents/skills/mtg-learn/references/commander-guide.md`](../../../.agents/skills/mtg-learn/references/commander-guide.md)                               | "Official since 2024"; no Bracket 5; Bracket 1 "Precons… 10+ turns", Bracket 2 "6+ turns", Bracket 3 "4+ turns"; Mana Crypt as a Game Changer example                                                                                                                                                                 | **Corrected 2026-11-08:** beta since 2025-02-11; five brackets with the official restrictions; floors 9/8/6/4; Mana Crypt noted as banned [3][1][101]                                                                                                              |

## Sources

Access notes say when a page was not read directly. Dates are publication dates unless stated.

### Official

1. Wizards of the Coast (Gavin Verhey for the Commander Format Panel), "Commander Brackets Beta Update – October 21, 2025", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
2. Rachel Weeks (Commander Format Panel), "Commander Brackets beta OCT 25" graphic, Bluesky, 2025-10-21, linked from [1]; image viewed directly. https://bsky.app/profile/wachelreeks.com/post/3m3ptspaivs27
3. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11. https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta
4. Wizards of the Coast, "Commander Brackets Beta Update – April 22, 2025", 2025-04-22. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-april-22-2025
5. Wizards of the Coast, "Commander Bans and Restrictions – April 22, 2025", 2025-04-22. https://magic.wizards.com/en/news/announcements/commander-bans-and-restrictions-april-22-2025
6. Wizards of the Coast, "Commander Brackets Beta Update – February 9, 2026", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-february-9-2026
7. Wizards of the Coast, "Commander Banned and Restricted Announcement – February 9, 2026", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026
8. Wizards of the Coast, "Banned and Restricted Announcement – October 12, 2026", 2026-10-12. https://magic.wizards.com/en/news/announcements/banned-and-restricted-october-12-2026
9. Wizards of the Coast, Commander format page, fetched 2026-11-08. https://magic.wizards.com/en/formats/commander
10. Wizards of the Coast, "On the Future of Commander", 2024-09-30. https://magic.wizards.com/en/news/announcements/on-the-future-of-commander
11. Wizards of the Coast, "Introducing the Commander Format Panel", 2024-10-22; read in part. https://magic.wizards.com/en/news/announcements/introducing-the-commander-format-panel
12. Wizards of the Coast, "Commander Format Panel Update – December 11, 2025", 2025-12-11; read through a summarising fetch. https://magic.wizards.com/en/news/announcements/commander-format-panel-update-december-11-2025
13. Commander Rules Committee (WotC mirror), "Commander Banned and Restricted Announcement – September 23, 2024", 2024-09-23; URL from search, not fetched; bans confirmed on Scryfall [101]. https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-announcement-september-23-2024
14. Wizards of the Coast, Magic: The Gathering Comprehensive Rules, effective 2026-11-06. https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt
15. Wizards of the Coast, "Star Trek Commander Decklists", 2026-10-29; one of six official decklist articles (July 2025 to October 2026) searched for "bracket" with no hits. https://magic.wizards.com/en/news/announcements/star-trek-commander-decklists

### EDHREC

16. Cooper Gottfried, "EDHREC Guide to Commander Brackets", 2025-09-22, revised after 2025-10-22; Lumra lists on Archidekt for Brackets 1–5. https://edhrec.com/guides/edhrec-guide-to-commander-brackets
17. Jeff Girten, "Bracketology: Tweaking Your Decks for the Upgraded Bracket (3)", Commander's Herald (EDHREC sister site), 2025-03-03. https://commandersherald.com/bracketology-tweaking-your-decks-for-the-upgraded-bracket-3/
18. Jeff Girten, "Adapting Your Decks to Core Bracket 2", 2025-04-14. https://edhrec.com/articles/adapting-your-decks-to-core-bracket-2
19. Jeff Girten, "Adapting Your Decks to the Optimized Bracket 4", 2025-04-28. https://edhrec.com/articles/adapting-your-decks-to-the-optimized-bracket-4
20. Jeff Girten, "Adapting Your Decks to the Exhibition Bracket (1)", 2025-05-12. https://edhrec.com/articles/adapting-your-decks-to-the-exhibition-bracket-1
21. Cooper Gottfried, "EDHREC Guide to Upgrading Your Commander Deck", 2025-10-13. https://edhrec.com/guides/edhrec-guide-to-upgrading-your-commander-deck
22. Harvey McGuinness, "What's the Difference Between Commander Brackets 4 and 5?", 2025-09-30. https://edhrec.com/articles/whats-the-difference-between-commander-brackets-4-and-5
23. Cas Hinds, "The Difference Between Bracket 4 and cEDH", 2026-06-22. https://edhrec.com/articles/the-difference-between-bracket-4-and-cedh
24. Matt Morgan, "Wizards of the Coast Commander Brackets Update for October 2025", 2025-10-22. https://edhrec.com/articles/wizards-of-the-coast-commander-brackets-update-for-october-2025
25. Cas Hinds, "Are We Misrepresenting Power In Our Commander Decks?", 2026-05-04. https://edhrec.com/articles/are-we-misrepresenting-power-in-our-commander-decks
26. Levi Perry, "Should the Bracket System Move Out of Beta?", 2026-09-03. https://edhrec.com/articles/should-the-bracket-system-move-out-of-beta
27. Alex Wicker, "Why Are the Brackets Telling Me How To Play Commander?", 2026-01-22. https://edhrec.com/articles/why-are-the-brackets-telling-me-how-to-play-commander
28. Mike Carrozza, "Am I the Bolas? The Bracket 3 Spectrum", 2026-02-04. https://edhrec.com/articles/am-i-the-bolas-the-bracket-3-spectrum
29. Mike Carrozza, "Am I the Bolas?" column on Bracket 3 decks, 2025-06-11; exact title not captured. https://edhrec.com/articles/am-i-the-bolas-bracket-3-fun-decks
30. Nick Wolf, "Introducing the Commander Bracket Combo Vote", 2025-03-19. https://edhrec.com/articles/introducing-the-commander-bracket-combo-vote
31. EDHREC, "Commander Bracket Combo Voting Returns", 2026-04-08; Commander Spellbook then held more than 80,000 combos. https://edhrec.com/articles/commander-bracket-combo-voting-returns
32. EDHREC, average decks by bracket (Atraxa, Praetors' Voice shown; also Edgar Markov, The Ur-Dragon, Krenko, Mob Boss, Yuriko, Kinnan), fetched 2026-11-08; land and mana-value figures computed by the research. https://edhrec.com/average-decks/atraxa-praetors-voice/optimized
33. EDHREC, "Top Cards — Past 2 Years", retrieved 2026-11-08. https://edhrec.com/top/year
34. EDHREC, "5 Fun Ideas for Building a Bracket 1 Deck", undated. https://edhrec.com/articles/5-fun-ideas-for-building-a-bracket-1-deck/
35. Cas Hinds, EDHREC, 2026-09-07, on local metas and land counts; title from the URL. https://edhrec.com/articles/is-your-local-meta-making-you-a-worse-commander-player

### Strategy press

36. Kristen Gregory, Card Kingdom, "What Is the New Commander Bracket Beta System?", 2025-02-11. https://blog.cardkingdom.com/what-is-the-new-commander-bracket-beta-system/
37. Kristen Gregory, Card Kingdom, "Actually Good Budget Alternatives to Commander Staples", 2025-02-21; prices re-checked on Scryfall [101]. https://blog.cardkingdom.com/actually-good-budget-alternatives-to-commander-staples/
38. Kristen Gregory, Card Kingdom, "5 Tips for Building a Bracket 2 Commander Deck", 2025-06-27. https://blog.cardkingdom.com/5-tips-for-building-a-bracket-2-commander-deck/
39. Kristen Gregory, Card Kingdom, "Commander Games Feel Fast These Days, and Here's Why", 2025-08-22. https://blog.cardkingdom.com/commander-games-feel-fast-these-days-and-heres-why/
40. Kristen Gregory, Card Kingdom, "Should You Always Tutor in Bracket 4?", 2025-12-09. https://blog.cardkingdom.com/should-you-always-tutor-in-bracket-4/
41. Kristen Gregory, Card Kingdom, "How Well Do Older Commanders Fit into the Bracket System?", 2026-10-16. https://blog.cardkingdom.com/how-well-do-older-commanders-fit-into-the-bracket-system/
42. Kristen Gregory, Card Kingdom, "Commander Brackets & Game Changers Update", 2025-10-24; search summary only. https://blog.cardkingdom.com/commander-brackets-game-changers-update/
43. Mark Wischkaemper, CoolStuffInc, "Building Commander Decks for Bracket 1", 2025-12-12. https://www.coolstuffinc.com/a/markwischkaemper-seo-12122025-building-commander-decks-for-bracket-1
44. Mark Wischkaemper, CoolStuffInc, "Building a Commander Deck for Bracket 2", 2025-12-15. https://www.coolstuffinc.com/a/markwischkaemper-seo-12152025-building-a-commander-deck-for-bracket-2
45. Mark Wischkaemper, CoolStuffInc, "Building a Commander Deck for Bracket 3", 2025-12-17. https://www.coolstuffinc.com/a/markwischkaemper-seo-12172025-building-a-commander-deck-for-bracket-3
46. Nigel Kurtz, CoolStuffInc, "Building to Bracket 4 in Commander", 2025-11-26. https://www.coolstuffinc.com/a/nigelkurtz-seo-11262025-building-to-bracket-4-in-commander
47. Nigel Kurtz, CoolStuffInc, "Building to Bracket 5 in Commander", 2025-11-27. https://www.coolstuffinc.com/a/nigelkurtz-seo-11272025-building-to-bracket-5-in-commander
48. Nigel Kurtz, CoolStuffInc, "Budget Commander Decks for Every Bracket", 2026-03-26. https://www.coolstuffinc.com/a/nigelkurtz-seo-03262026-budget-commander-decks-for-every-bracket-builders-series
49. Mark Wischkaemper, CoolStuffInc, deck examples for the Commander brackets, 2025-02-17; title from the URL. https://www.coolstuffinc.com/a/markwischkaemper-seo-02172025-deck-examples-for-the-commander-brackets
50. Levi Perry, CoolStuffInc, "The Ultimate Commander Bracket Breakdown", 2026-03-30; one quote seen only in a search summary, marked where used. https://www.coolstuffinc.com/a/leviperry-seo-03302026-the-ultimate-commander-bracket-breakdown
51. Charlotte Sable, Commander's Herald, "Commander Brackets: Your Deck Is More Than a Number", 2025-02-16. https://commandersherald.com/commander-brackets-your-deck-is-more-than-a-number/
52. A.L. Walser, Draftsim, "4 Excellent Bracket 3 Commanders to Try Out Next", 2026-03-12; page truncated. https://draftsim.com/mtg-bracket-3-commanders/
53. David Royale, Draftsim, "6 Excellent Bracket 4 Commanders to Try Out Next", 2026-07-17; page truncated. https://draftsim.com/mtg-bracket-4-commander/
54. Sheldon Menery, Star City Games, "The Social Contract", 2015-04-08. https://articles.starcitygames.com/articles/the-social-contract/
55. Corey Williams, Commander's Herald, "A Beginner's Guide to cEDH", 2024-11-13. https://commandersherald.com/a-beginners-guide-to-cedh/
56. Zachary Fink, MTGRocks, "The MTG Commander Game Changers List Features Glaring Omissions", 2025-02-12. https://mtgrocks.com/the-mtg-commander-game-changers-list-features-glaring-omissions/
57. Cas Hinds, CoolStuffInc, pros and cons of the beta Commander bracket, 2025-02-25; title from the URL; quotes as captured by one researcher, not re-read. https://www.coolstuffinc.com/a/cashinds-seo-02252025-pros-and-cons-of-the-beta-commander-bracket

### Creators

58. The Command Zone (Rachel Weeks with Josh Lee Kwai), episode 658, "Commander Deckbuilding Template for the New Era", 2025-02-18; quotes from a local automatic transcription of the episode audio, cross-checked against a secondary summary (note.com, 2025-08-04); no newer template appears in the show's feed through 2026-11-08. https://www.youtube.com/watch?v=9m6LEdczgWY
59. The Command Zone, episode 659, "The Problem with Deckbuilding Templates", 2025-02-26; chapter list only. https://edhrec.com/articles/the-command-zone-the-problem-with-deckbuilding-templates-the-command-zone-659-mtg-edh-magic-gathering
60. PleasantKenobi, "Bracket 3 is the new 'My Deck is a 7'", YouTube, late October 2026; title and view count only. https://www.youtube.com/watch?v=8UUK6dZL8Do
61. DefCat MTG, "The Real Problem With Bracket 2 & 3 (It's Not Your Deck)", YouTube, mid-October 2026; title and view count only. https://www.youtube.com/watch?v=cZtg5QjRQBI
62. Lloyd Meng TCG, "I Audited More Commander Decks (They Still Lied)", YouTube, about October 2026; title and view count only. https://www.youtube.com/watch?v=R6LiJdufZbE
63. The Command Zone (Rachel Weeks and Jimmy Wong), episode 671, "What's Wrong with the Commander Brackets?", 2025-04-30; quotes from a local automatic transcription; pre-October-2025 rules. https://edhrec.com/articles/the-command-zone-whats-wrong-with-the-commander-brackets-the-command-zone-671-mtg-edh-magic-gathering
64. The Command Zone, episode 690, "When Your Deck is Too Good (But Also Too Bad)", 2025-08-01; quotes from a local automatic transcription. https://youtu.be/I6kd3ggg81w
65. The Command Zone (Rachel Weeks and Josh Lee Kwai, both panel members), episode 705, "The New, NEW Commander Brackets", 2025-10-22; quotes from a local automatic transcription. https://podcasts.apple.com/au/podcast/the-new-new-commander-brackets-705/id898023861?i=1000733030012
66. The Command Zone (Rachel Weeks with Joe Johnson), episode 731, "What's Up w/ Bracket 4?", 2026-03-17; quotes from a local automatic transcription. https://www.youtube.com/watch?v=jzeTz9clIC8
67. The Command Zone (Rachel Weeks with Olivia Gobert-Hicks, a panel member), episode 732, "Trade Power for Joy with Bracket 1 Commander", 2026-03-23; quotes from a local automatic transcription of the podcast audio. https://feeds.megaphone.fm/STU7163382979
68. EDHRECast (Joey Schultz, Dana Roach, Matt Morgan), episode 389, "What the Brackets Reveal about Commander", 2025-10-27; quotes from a local automatic transcription. https://www.podchaser.com/podcasts/edhrecast-659804/episodes/what-the-brackets-reveal-about-270659813
69. EDHRECast (Joey Schultz), episode 397, "500+ Games of Data! Bracket Accuracy, Format Speed", 2026-01-05; figures are the host's own game log, read from a local automatic transcription. https://rss.art19.com/edhrecast
70. JoeyDH (EDHREC'd), "The Bracket 1 Problem", 2026-03-30; quotes and the 1.59% figure from a local automatic transcription. https://rss.art19.com/edhrecast
71. Play to Win Podcast (Cam and Dylan), "A cEDH Perspective on the Commander Bracket Update", 2025-10-31; quotes from a local automatic transcription. https://redcircle.com/shows/b30bfbce-8d24-4f58-b823-7083cb16f3ce/episodes/1149be62-5022-4500-a3f3-9bea4b05431d
72. Play to Win Podcast (Cam and Dylan), "EDH from the Perspective of cEDH Players", 2026-07-17; quotes from a local automatic transcription. https://redcircle.com/shows/b30bfbce-8d24-4f58-b823-7083cb16f3ce/episodes/2adf0805-345d-4502-985a-b3ee1ee42cf2
73. Gemstone Mine cEDH Podcast, "Being Sneaky in EDH – How Can We Use Tutors in Brackets 1–3?", 2025-03-07; quotes from a local automatic transcription; pre-October-2025 rules. https://www.spreaker.com/episode/being-sneaky-in-edh-how-can-we-use-tutors-in-brackets-1-3--64749617
74. MTGGoldfish Commander Clash Podcast, "We React to the Bracket System", 2025-02-18; quotes from a local automatic transcription; launch-era rules. https://www.mtggoldfish.com/podcasts/feed_commander_clash.rss
75. The Command Zone, episode 726, "Are Commander Unbans the New Normal?", 2026-02-10; episode description only. https://feeds.megaphone.fm/STU7163382979
76. EDHRECast, episode 372, "Ranking EVERY Game Changer", 2025-06-27; title and description only. https://rss.art19.com/edhrecast

### Forums and community

77. TappedOut forum, "The New Commander Brackets Beta", 2025-02-12 to 2025-04-13. https://tappedout.net/mtg-forum/commander/the-new-commander-brackets-beta
78. TappedOut forum, "Game Changers & Brackets", 2025-03-03 to 2025-03-06. https://tappedout.net/mtg-forum/commander/game-changers-brackets/
79. TappedOut forum, "When does Bracket 4 move to cEDH?", 2026-02-18 to 2026-02-19. https://tappedout.net/mtg-forum/commander/when-does-bracket-4-move-to-cedh/
80. WitchPHD, "Stop Playing [Bracket 3]", Substack, 2025-11-07, with reader comments. https://witchphd.substack.com/p/stop-playing-bracket-3
81. Jake Browne, Mana Club newsletter, 2025-02-12; title not captured. https://manaclub.substack.com/p/25-brackets
82. Michael Basus, EDHLAB blog, "Bracket System Controversies and Hot Takes", 2026-03-20. https://blog.edhlab.gg/bracket-system-controversies-and-hot-takes/
83. u/CrimsonLotus79, "Was told my Iroh is br 4", Reddit, about 2026-02-06, 531 points and 428 comments at snapshot; read through the Reddit Sentinel snapshot archive. https://reddit.sentinel-team.org/posts/1qxh7no/snapshots/2026-02-06T23%3A41%3A24.264777Z
84. u/N1ghtsky_Crusade, "Do brackets generally equal deck strength?", Reddit, about 2026-02-22; read through the Reddit Sentinel snapshot archive. https://reddit.sentinel-team.org/posts/1rbrqy9/snapshots/2026-02-23T07%3A35%3A18.841538Z
85. r/CompetitiveEDH, "What's the difference between cEDH and bracket 4?", 2025-08-13; search snippets of a mirror only. https://libreddit.winscloud.net/r/CompetitiveEDH/comments/1mpc3nf/whats_the_difference_between_cedh_and_bracket_4
86. "The Forgotten Bracket" (pseudonymous), No Salt EDH, "Do We Need a 'Bracket 3.5'?", 2025-06-27. https://no-salt-edh.beehiiv.com/p/do-we-need-a-bracket-3-5
87. MTG Salvation, "cEDH Forum: Philosophy & Etiquette", February 2019. https://www.mtgsalvation.com/forums/the-game/commander-edh/competitive-commander-cedh/805064-cedh-forum-philosophy-etiquette
88. Gamertag Mythras, "Commander at Gen Con 2026", 2026-08-01, updated 2026-11-01. https://gamertagmythras.com/blog/magic-the-gathering/commander-at-gen-con-2026
89. MTG EDH, "Rule 0 in Commander: The Pregame Talk That Saves Games", undated. https://mtgedh.com/rule-0-in-commander-mtg-the-pregame-talk-that-saves-games/
90. Prism News, "Commander brackets and Game Changers explained", undated. https://www.prismnews.com/hobbies/magic-commander/commander-brackets-and-game-changers-explained-from-casual

### Data

91. Playgroup.gg, "How to Play Commander" (game length and win conditions from app logs), updated 2026-11-04; colour-identity figures from search summaries of its commander pages. https://playgroup.gg/commander/how-to-play
92. Playgroup.gg, "How Many Lands Should a Commander Deck Run? (2026)", updated 2026-11-08. https://playgroup.gg/commander/how-many-lands
93. Playgroup.gg, "Commander & EDH Power Level: What 439k Real Games Say", updated 2026-11-08. https://playgroup.gg/commander/power-level
94. Playgroup.gg, precon tier list, 2026-11-08; precon composition computed by the research from EDHREC precon lists and Scryfall. https://playgroup.gg/commander/precons
95. ScrollVault, "Commander Deck Ratios by Bracket", data collected 2026-09-07 (6,532 Archidekt decks). https://scrollvault.net/guides/commander-deck-ratios.html
96. ScrollVault, "Commander Brackets" guide and precon library, updated 2026-10-23. https://scrollvault.net/guides/commander-brackets.html
97. EDHTuner, "How many lands in a Commander deck?", data collected July and November 2026 (18,414 Moxfield decks). https://edhtuner.com/how-many-lands-commander-deck
98. Frank Karsten, TCGplayer, "What's an Optimal Mana Curve and Land/Ramp Count for Commander?", 2022-07-15; read through TCGplayer's content API. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
99. Frank Karsten, TCGplayer, "How Many Lands Do You Need in Your Deck? An Updated Analysis", 2022-07-29, updated 2025-02-13; read through TCGplayer's content API on 2026-11-10. https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/ (first cited at its ChannelFireball address, which returns 404: https://strategy.channelfireball.com/home/how-many-lands-do-you-need-in-your-deck-an-updated-analysis)
100.  Frank Karsten, TCGplayer, "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022 Update", 2022-08-02. https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
101.  Scryfall, `is:gamechanger` (53 cards), `banned:commander` (83 entries) and card API (prices, EDHREC rank, flags), retrieved 2026-11-08 21:38 UTC. https://scryfall.com/search?q=is%3Agamechanger
102.  Commander Spellbook, syntax guide (bracket tags) and combo search, retrieved 2026-11-08; third-party bracket readings of combo timing from search summaries (Scrytics, TCG Protectors) and a TappedOut thread summary are grouped here. https://commanderspellbook.com/syntax-guide/
103.  TableCommander, bracket estimator documentation, undated (© 2026). https://tablecommander.com/docs/decks/brackets
104.  commanderbracket.app, "Are Commander precons Bracket 2?"; search summary only. https://commanderbracket.app/blog/are-commander-precons-bracket-2

### cEDH

105. EDHTop16, home page meta share (last six months, 50+ player events) and commander pages (one-year conversion), retrieved 2026-11-08. https://edhtop16.com/
106. EDHTop16, "Staples" (last year), retrieved 2026-11-08; denominator not stated. https://edhtop16.com/staples
107. Gary Lowther, Kraum / Tymna decklist, Road to the Coliseum Halloween Party, 1st of 65, 2026-10-31; composition computed by the research. https://edhtop16.com/tournament/road-to-the-coliseum-halloween-party-up-to-7k/decklist/QmO2gpBfFbMjXuZeO29tBZCURAK2
108. Duncan Gilchrist, Kraum / Tymna decklist, MBG Commanderpalooza #3, 1st of 150, 2026-10-24; composition computed by the research. https://edhtop16.com/tournament/mbg-commanderpalooza-3-timetwister-event/decklist/0Z2on9TmixR3f8ZTlxniHSHyq3Y2
109. Jude Apcher, Kinnan decklist, cEDH Taunton Euro Qualifier, 1st of 51, 2026-11-07; composition computed by the research. https://edhtop16.com/tournament/cedh-taunton-euro-qualifier-7th-november/decklist/iR6MgCNk16UZ2QVwDmP8PSr5L1h1
110. cEDH Decklist Database, retrieved 2026-11-08. https://cedh-decklist-database.com/
111. jegpeg, EDHMeta, "cEDH Metagame State: The BEST cEDH Decks of 2026", 2026-09-05. https://edhmeta.com/cedh-metagame-state-the-best-cedh-decks-of-2026/
112. Ken Baumann, Commander's Herald, "A cEDH Field Guide", 2023-08-09. https://commandersherald.com/a-cedh-field-guide/
113. Sam Black, Commander's Herald, "How Many Lands Should You Play in cEDH?", 2024-03-19. https://commandersherald.com/how-many-lands-should-you-play-in-cedh
114. EDHREC, "EDHREC Guide to cEDH Turbo", 2025-08-05. https://edhrec.com/guides/edhrec-guide-to-cedh-turbo
115. EDHREC, "EDHREC Guide to cEDH Stax", 2025-09-02. https://edhrec.com/guides/edhrec-guide-to-cedh-stax
116. EDHREC, "FourthSeat.gg Takes on the cEDH Draw Meta", 2026-09-11. https://edhrec.com/articles/fourthseat-gg-takes-on-the-cedh-draw-meta
117. cEDH Wiki, "Introduction to cEDH", undated; search summary only (the page returned HTTP 402). https://cedh.fandom.com/wiki/Introduction_to_cEDH
118. Commander's Herald, "Why Stax is Ineffective in cEDH", about 2023–2024; search summary only. https://commandersherald.com/why-stax-is-ineffective-in-cedh/

### French

119. Wizards of the Coast (French), "Découvrez la bêta des catégories Commander", 2025-02-11. https://magic.wizards.com/fr/news/announcements/introducing-commander-brackets-beta
120. Wizards of the Coast (French), "Mise à jour de la bêta des catégories Commander - 21 octobre 2025", 2025-10-21. https://magic.wizards.com/fr/news/announcements/commander-brackets-beta-update-october-21-2025
121. Le Monarque - MTG, "Il faut qu'on parle des BRACKETS en Commander", YouTube, about late 2025; title and view count only. https://www.youtube.com/watch?v=HSnUXzzRLj8
122. Yoonns MTG, "Il faut qu'on parle des "GAME CHANGERS"", YouTube, about late 2025; title and view count only. https://www.youtube.com/watch?v=STlmq72qLnY
123. Plus de Bandit, "Comment améliorer les brackets en commander ? (PMU)", YouTube, about September 2026; title and view count only. https://www.youtube.com/watch?v=9YI7m6_Uw0M
124. L'Épée à 2 Nains (Geneva), "Commander Multi – Commander Party: The Hobbit – Bracket 3", event page; year not shown, dated 2026 by the search engine. https://2nains.ch/event/commander-multi-commander-party-the-hobbit-bracket-3/
125. Magic C'est Chic !, "Wizards va-t-il trop loin avec son nouveau système de brackets en Commander ??!", podcast, feed date 2025-04-22, recorded February 2025 under launch-era rules; quotes from a local French automatic transcription, approximate. https://podcast.ausha.co/magic-c-est-chic/wizards-va-t-il-trop-loin-avec-son-nouveau-systeme-de-brackets-en-commander-magic-the-gathering
126. Bandit (Plus de Bandit), "Comment comprendre les Commander Brackets (FAQ)", YouTube, undated; title only. https://www.youtube.com/watch?v=NjwpRxbrpOc
