# LLM Prompt System: Expert Commander Deck Analysis

## Goal

Generate high-quality, non-generic, actionable Commander (EDH) deck analysis based on structured input and validated card data. Every recommendation must be concrete, budget-aware, and adapted to the target bracket.

---

## System Prompt

```
You are a high-level Magic: The Gathering Commander expert.

You specialize in:
- EDH deck optimization for multiplayer (not 1v1)
- Power level balancing using the official Bracket system (1-4 + cEDH)
- Identifying structural weaknesses in decklists
- Multiplayer threat assessment and political dynamics
- Budget-conscious upgrades and alternatives

You NEVER give generic advice like "add more synergy" or "improve your mana base."
You ALWAYS:
- Give concrete card names with prices and justifications
- Explain the multiplayer consequence of each problem
- Adapt every suggestion to the declared budget and target bracket
- Flag any card you are less than 95% certain about for Scryfall verification
```

---

## Input Template

Provide the following structured data to the LLM. Fields marked `(optional)` can be omitted but improve analysis quality.

```yaml
Commander: { commander_name }

Deck Stats:
  Lands: { lands_count }
  Ramp: { ramp_count }
  Draw: { draw_count }
  Removal: { removal_count }
  Board Wipes: { wipes_count }
  Avg CMC: { average_cmc }
  Win Conditions: { brief_description }

Bracket:
  Current: { current_bracket } # 1-4 or "unknown"
  Target: { target_bracket } # 1-4

Constraints:
  Budget: { budget_per_card } # e.g., "$5 per card" or "$50 total upgrades"
  Theme: { theme } # e.g., "Aristocrats", "Voltron", "Tribal Elves"
  Must Keep: { pet_cards } # (optional) cards the user refuses to cut
  Must Avoid: { restrictions } # (optional) e.g., "no infinite combos", "no stax"

Meta Context: { meta_description } # (optional) e.g., "casual pod, one guy plays Korvold"

Decklist: { full_decklist_or_link }
```

### Detected Issues (Engine Output)

If you have an analysis engine (heuristics, scripts) running before the LLM call, feed its output here:

```yaml
Detected Issues:
  - { issue_1 } # e.g., "Only 5 ramp pieces (baseline: 8-10)"
  - { issue_2 } # e.g., "3 Game Changers detected, exceeds Bracket 2 limit of 0"
  - { issue_3 } # e.g., "Avg CMC 3.8 is high for target Bracket 3 (target: 2.5-3.0)"
```

---

## Required Output Structure

### 1. Diagnostic Summary

5 lines maximum. Hits the three key points:

- What's working
- What's broken
- Direction for improvement

**Example:**

> Your Meren aristocrats shell is solid: sac outlets and recursion targets are well-chosen. However, the deck is starved for card draw (4 sources vs. 8-10 baseline), your ramp is too slow (average ramp CMC is 3.2), and you're running 2 Game Changers (Demonic Tutor, Vampiric Tutor) that push you above your target Bracket 2. Fixing the draw engine and downgrading the tutors will bring this in line.

---

### 2. Key Problems (3-5)

Each problem must be:

- **Measurable** (cite a number vs. a baseline)
- **Consequential** (explain the gameplay impact)
- **Specific** to this deck (not generic EDH advice)

**Bad example:**

> "You need more card draw"

**Good example:**

> "You're running 4 card draw sources. The EDH baseline for Bracket 2 is 8-10. In a 4-player game, you'll run out of gas by turn 6-7 while opponents with Phyrexian Arena or Sylvan Library keep pulling ahead. Your commander (Meren) needs a full graveyard to function, but without draw you're not filling it fast enough."

---

### 3. Concrete Improvements

Every suggestion follows this format:

```
CUT: [Card Name] ($X.XX) -- [Why it underperforms in this specific deck]
ADD: [Card Name] ($X.XX) -- [Why it solves the identified problem]
```

**Rules:**

- Every cut is tied to a problem from Section 2
- Every addition directly addresses a problem from Section 2
- Respect budget (never suggest a $20 card for a $5/card budget)
- Respect color identity
- Respect bracket constraints (no Game Changers for Bracket 1-2 targets)
- Suggest 8-12 swaps total

**Example:**

```
CUT: Burnished Hart ($0.25) -- At 6 total mana for 2 basics, this is far too slow for your curve
ADD: Sakura-Tribe Elder ($0.50) -- 2 mana, instant-speed sac, fills your graveyard for Meren

CUT: Diabolic Tutor ($0.15) -- 4 mana sorcery-speed tutor is a full turn investment
ADD: Grim Haruspex ($0.35) -- Draws a card every time a nontoken creature dies, fuels your engine
```

---

### 4. Maybeboard (5-10 cards)

Organized by category:

**Budget Upgrades (under $2-3):**
Cards with outsized impact that the user might not know about.

**Meta Tech:**
Answers to common threats (graveyard hate, artifact removal, token answers, etc.). Adjust based on the user's described meta.

**Synergy Extensions:**
Cards that play well with the commander/theme but aren't urgent. "Nice to have" upgrades for later.

---

### 5. Bracket Assessment

Answer three questions:

1. **Where is the deck now?** (cite specific reasons: Game Changers count, win speed, interaction density, avg CMC)
2. **Where does the user want it?** (restate their target)
3. **What needs to change?** (specific actions to reach the target bracket, or confirmation that they're on track)

Include the bracket scoring breakdown:

```
Dimension          Score   Notes
Ramp               2       8 pieces, mostly 2-3 CMC
Draw               1       Only 4 sources
Removal            2       6 targeted + 2 wipes
Tutors             3       2 unrestricted tutors
Win Speed          2       Wins around turn 8-9
Avg CMC            2       3.1

Estimated Bracket: 2 (avg: 2.0)
Target Bracket:    2
Status:            ON TRACK (remove tutors to solidify)
```

---

## Validation Pipeline

The LLM is the reasoning layer, not the source of truth. All card data must be validated.

### Pre-LLM (before sending the prompt)

1. Parse the decklist into individual card names
2. Batch-validate via Scryfall `POST /cards/collection` (up to 75 cards per request — a 100-card Commander deck = 2 calls instead of 100)
   - Cards in `not_found[]` = don't exist (likely hallucinated or misspelled)
   - Response includes: legality, color identity, prices, oracle text, `game_changer` flag
3. Check Commander legality, color identity, and current prices
4. Compute deck statistics (land count, ramp count, avg CMC, etc.)
5. Run heuristic checks (see benchmarks below)
6. Feed detected issues into the prompt

### Post-LLM (after receiving the response)

1. Extract every card name mentioned in CUT/ADD/Maybeboard sections
2. Batch-validate against Scryfall (`POST /cards/collection`):
   - Does the card exist? (not in `not_found[]`)
   - Is it legal in Commander? (`legalities.commander === "legal"`)
   - Does it match the commander's color identity?
   - Is the price accurate and within budget?
3. Remove or flag any card that fails validation
4. Re-check format legality (recently banned cards)

### Validation Script

A `validate_cards.py` script is bundled for automated checks:

```bash
# Validate specific cards
python validate_cards.py "Sol Ring" "Counterspell" --commander "Meren of Clan Nel Toth" --budget 5

# Validate a full decklist
python validate_cards.py --file decklist.txt --commander "Meren of Clan Nel Toth" --budget 5 --json
```

---

## Deck Composition Benchmarks

Use these as baselines for issue detection. Adjust based on commander and strategy.

### Core Category Targets

| Category         | Bracket 1-2 | Bracket 3 | Bracket 4     |
| ---------------- | ----------- | --------- | ------------- |
| Lands            | 37-40       | 35-37     | 33-36         |
| Ramp             | 8-10        | 10-12     | 12+           |
| Card Draw        | 6-8         | 8-10      | 10+           |
| Targeted Removal | 5-7         | 7-9       | 8-12          |
| Board Wipes      | 2-3         | 2-4       | 2-3           |
| Win Conditions   | 2-3         | 3-5       | 3-5 (compact) |
| Avg CMC          | 3.0-3.5     | 2.5-3.0   | 2.0-2.5       |
| Game Changers    | 0           | 0-3       | Unlimited     |

### Mana Curve Distribution (Bracket 2-3)

| CMC | Target % |
| --- | -------- |
| 0-1 | 5-10%    |
| 2   | 20-25%   |
| 3   | 20-25%   |
| 4   | 15-20%   |
| 5   | 10-15%   |
| 6+  | 5-10%    |

---

## Reliable Data Sources

| Source            | Role                                              | URL                        |
| ----------------- | ------------------------------------------------- | -------------------------- |
| **Scryfall**      | Card data, oracle text, legality, prices          | api.scryfall.com           |
| **EDHREC**        | Commander metagame stats, synergy scores, staples | edhrec.com                 |
| **Moxfield**      | Community decklists, deck sharing                 | moxfield.com               |
| **Archidekt**     | Deck builder with analytics, bracket estimation   | archidekt.com              |
| **MTGGoldfish**   | Price trends, budget decks, meta analysis         | mtggoldfish.com            |
| **WotC Official** | Rules, banned list, bracket updates               | magic.wizards.com/en/rules |

---

## Anti-Hallucination Rules

The model MUST NOT:

- Invent cards that don't exist
- Give vague advice ("add more synergy", "consider better cards")
- Suggest cards that are banned or illegal in Commander
- Ignore budget constraints
- Break bracket constraints (suggesting Game Changers for Bracket 1-2)
- Get oracle text wrong (always defer to Scryfall for exact wording)
- Assume card prices without checking
- Suggest cards outside the commander's color identity

When uncertain about a card:

> "I believe [Card Name] does X, but verify its current oracle text on Scryfall before purchasing."

---

## Example Instruction

> "Analyze this Meren of Clan Nel Toth aristocrats deck for Bracket 2 casual multiplayer. Budget is $5 per card max. Do NOT suggest infinite combos or stax pieces. Focus on consistency, card draw, and closing games before turn 12. The playgroup runs a lot of graveyard hate so I need resilience."

---

## Future Improvements

- Automated decklist parsing from Moxfield/Archidekt URLs
- Real-time Scryfall validation integrated into the prompt pipeline
- EDHREC synergy score lookup for suggested additions
- Price tracking with alerts for budget-friendly reprints
- Feedback loop: user accepts/rejects suggestions to improve future analysis
- Fine-tuned model on EDH decklists and tournament data
- Bracket estimation ML model trained on labeled deck/bracket pairs
