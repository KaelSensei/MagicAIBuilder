# EDH Deck Building Heuristics

Battle-tested guidelines for Commander deck construction. These are starting points, not rigid rules. A skilled builder adapts them to their commander and strategy.

## The 8x8 Framework (Frank Karsten-inspired)

A 100-card Commander deck typically breaks down as:

| Category           | Count | Purpose                |
| ------------------ | ----- | ---------------------- |
| Commander          | 1     | Your build-around      |
| Lands              | 35-38 | Mana base              |
| Ramp               | 8-12  | Mana acceleration      |
| Card draw          | 8-10  | Card advantage engines |
| Removal (targeted) | 5-8   | Answer threats         |
| Board wipes        | 2-4   | Reset the board        |
| Win conditions     | 3-5   | Close the game         |
| Synergy/theme      | 25-35 | Core strategy cards    |

**Land count adjustments:**

- Avg CMC < 2.5: 33-35 lands
- Avg CMC 2.5-3.0: 35-37 lands
- Avg CMC 3.0-3.5: 37-38 lands
- Avg CMC > 3.5: 38-40 lands
- Each 2-CMC+ ramp piece = -0.5 lands (roughly)

## Mana Base Construction

### Budget Tiers

**Budget ($20-50 total mana base):**

- Command Tower
- Basic lands (heavy)
- Guild gates / gain lands
- Evolving Wilds / Terramorphic Expanse
- Pain lands (Caves of Koilos, etc.)
- Pathways (if 2-color)

**Mid-range ($50-150):**

- All of above +
- Check lands (Glacial Fortress)
- Filter lands (Mystic Gate)
- Tango/Battle lands (Prairie Stream)
- Utility lands (Reliquary Tower, Rogue's Passage)

**Optimized ($150+):**

- Fetch lands (Flooded Strand)
- Shock lands (Hallowed Fountain)
- Original duals (Underground Sea) if budget allows
- Exotic fetches/utility (Ancient Tomb, Strip Mine)

### Color Fixing by Deck Colors

| Colors  | Min colored sources per color | Notes                                                                   |
| ------- | ----------------------------- | ----------------------------------------------------------------------- |
| Mono    | All basic + 3-5 utility       | Easy, focus on utility lands                                            |
| 2-color | 15+ each                      | Prioritize untapped duals                                               |
| 3-color | 12+ each                      | Need all three dual combos                                              |
| 4-color | 10+ each                      | Heavy on rainbow + fetches                                              |
| 5-color | 8+ each                       | Rainbow lands essential (City of Brass, Mana Confluence, Command Tower) |

## Ramp Package Guidelines

### The CMC Rule for Ramp

- **1-2 CMC ramp is premium** - Sol Ring, Arcane Signet, Nature's Lore, Farseek, signets, talismans
- **3 CMC ramp is acceptable** - Cultivate, Kodama's Reach, Chromatic Lantern, Commander's Sphere
- **4+ CMC ramp is usually too slow** unless it also does something else (Smothering Tithe, Thran Dynamo for big mana decks)

### Green vs. Non-Green Ramp

**Green decks:** Land-based ramp preferred (survives board wipes, synergy with landfall)

- Rampant Growth, Nature's Lore, Three Visits, Cultivate, Kodama's Reach
- Sakura-Tribe Elder, Wood Elves, Farhaven Elf (creature-based)

**Non-green decks:** Artifact ramp

- Sol Ring, Arcane Signet (auto-include)
- 2-CMC rocks: Signets (Azorius Signet), Talismans (Talisman of Dominance), Fellwar Stone, Mind Stone
- 3-CMC rocks: Commander's Sphere, Darksteel Ingot (budget)

## Card Draw Benchmarks

Every deck needs ways to refill. By color:

**Blue:** Best card draw - Rhystic Study (Game Changer), Mystic Remora, Fact or Fiction, Pull from Tomorrow, Windfall
**Black:** Second best - Phyrexian Arena, Read the Bones, Sign in Blood, Night's Whisper, Necropotence (Game Changer)
**Green:** Draw through creatures - Beast Whisperer, Guardian Project, Shamanic Revelation, Return of the Wildspeaker
**Red:** Impulse draw - Jeska's Will, Light Up the Stage, Outpost Siege, Reckless Impulse
**White:** Catching up - Esper Sentinel, Mangara the Diplomat, Welcoming Vampire, Tocasia's Welcome

## Removal Guidelines

### Efficient Removal by Color

**White:** Swords to Plowshares, Path to Exile, Generous Gift, Farewell, Wrath of God
**Blue:** Counterspells (Counterspell, Arcane Denial, Swan Song), Cyclonic Rift (Game Changer), Reality Shift
**Black:** Go for the Throat, Infernal Grasp, Toxic Deluge, Damnation, Feed the Swarm
**Red:** Chaos Warp, Blasphemous Act, Vandalblast, Abrade
**Green:** Beast Within, Nature's Claim, Krosan Grip, Bane of Progress

### Interaction Density by Bracket

| Bracket | Targeted removal | Board wipes | Counterspells        |
| ------- | ---------------- | ----------- | -------------------- |
| 1       | 3-5              | 1-2         | 0-2                  |
| 2       | 5-7              | 2-3         | 1-3                  |
| 3       | 7-9              | 2-4         | 2-4                  |
| 4       | 8-12             | 2-3         | 4-8 (including free) |

## Mana Curve Targets

### Average CMC by Bracket

- Bracket 1: 3.5-4.0 (totally fine to be high)
- Bracket 2: 3.0-3.5
- Bracket 3: 2.5-3.0
- Bracket 4: 2.0-2.5

### Curve Distribution (typical Bracket 2-3 deck)

- 0-1 CMC: 5-10% (cheap interaction, enablers)
- 2 CMC: 20-25% (ramp, signets, cheap creatures)
- 3 CMC: 20-25% (workhorse cards)
- 4 CMC: 15-20% (impact cards)
- 5 CMC: 10-15% (high impact)
- 6+ CMC: 5-10% (finishers, bombs)

## Win Condition Checklist

Every deck should answer: "How do I actually win?"

**Combat (most common):**

- Go-wide (tokens + Craterhoof)
- Go-tall (voltron, commander damage)
- Evasive damage (flying, unblockable)

**Combo (bracket 3-4):**

- 2-card combos (strong, bracket 4 territory)
- 3+ card combos (bracket 3 acceptable)
- Infinite mana + outlet
- Infinite damage/mill/drain

**Value/Attrition:**

- Outvalue opponents until you're the last one standing
- Requires very strong card advantage engine

**Alternative wins:**

- Approach of the Second Sun
- Thassa's Oracle (bracket 4+)
- Felidar Sovereign / Test of Endurance (casual)

## Common Deck Problems and Fixes

| Problem                     | Symptom                                    | Fix                                              |
| --------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Not enough lands            | Mulliganing frequently, missing land drops | Add 2-3 lands, cut high CMC cards                |
| Too many lands              | Flooding late game                         | Add card draw, cut 1-2 lands for MDFCs           |
| No ramp                     | Consistently behind on mana                | Cut pet cards for 8-10 ramp pieces               |
| No card draw                | Running out of gas mid-game                | Add 8+ card advantage sources                    |
| No removal                  | Can't deal with opponents' threats         | Minimum 5 targeted removal + 2 board wipes       |
| No win condition            | Games go forever with no end               | Add 3-5 clear paths to victory                   |
| Too high CMC                | Deck is slow and clunky                    | Cut cards above 5 CMC, add more 2-3 CMC cards    |
| Too many "cute" cards       | Inconsistent, cards don't impact the game  | Replace with efficient staples                   |
| No protection for commander | Commander keeps getting killed             | Add boots/greaves, counterspells, indestructible |

---

## Commander Singleton Rule — Card Quantity

Commander is a **singleton format**: max 1 copy of each card except basic lands.

### Exceptions allowed in Commander (multiple copies legal)

**Unlimited copies (treated like basic lands):**

- All basic lands (type line contains "Basic Land")
- Templar Knight
- Tempest Hawk
- Hare Apparent
- Persistent Petitioners
- Shadowborn Apostle
- Rat Colony
- Relentless Rats
- Dragon's Approach
- Slime Against Humanity
- Vazal, the Compleat
- Cid, Timeless Artificer

**Capped copies:**
| Card | Max copies |
|---|---|
| Nazgûl | 9 |
| Seven Dwarves | 7 |

### Implementation in MagicAIBuilder

- `src/lib/deck/multiples.ts` → `maxQuantity(cardName, typeLine)` returns the correct cap
- `+` / `−` quantity buttons in list view, capped by these rules
- `addCard()` auto-increments quantity for eligible cards instead of blocking duplicates
