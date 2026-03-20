# Reliable MTG Data Sources

This document lists all trustworthy, up-to-date sources for Magic: The Gathering data. Each source has a specific role in the analysis pipeline.

## Tier 1: Source of Truth

### Scryfall (scryfall.com)
- **Role:** Card data, oracle text, legality, prices, rulings
- **API:** `https://api.scryfall.com` (see scryfall-api.md for full reference)
- **Why it's authoritative:** Scryfall maintains the most complete, accurate, and up-to-date card database. Oracle text is synced with Gatherer/Wizards official errata. Prices aggregated from TCGPlayer and CardMarket.
- **Use for:** Card validation, oracle text lookup, legality checks, price checks, format legality
- **Update frequency:** Near real-time for new sets, prices updated multiple times daily

### Wizards of the Coast Official Rules
- **Role:** Game rules, format rules, banned/restricted lists
- **URL:** `https://magic.wizards.com/en/rules`
- **Why it's authoritative:** This IS the rules. The Comprehensive Rules document is the definitive source for all game mechanics.
- **Use for:** Rules questions, format legality definitions, Commander-specific rules (section 903)
- **Bundled:** See the `mtg-rules` skill for the full Comprehensive Rules

### MTG Commander Official (mtgcommander.net / WotC announcements)
- **Role:** Commander format rules, banned list, bracket system updates
- **URL:** `https://magic.wizards.com/en/news/announcements/` (filter for Commander)
- **Use for:** Banned list, Game Changers list, bracket definitions

## Tier 2: Community Data (Reliable, Data-Driven)

### EDHREC (edhrec.com)
- **Role:** Commander metagame statistics, deck archetypes, card popularity
- **Data source:** Aggregates decklists from Archidekt, Moxfield, and Scryfall
- **Why it's reliable:** Largest EDH dataset. Statistics-driven, not opinion-based. Updated daily.
- **Use for:**
  - Commander popularity rankings
  - "Staples" for a given commander (most-played cards)
  - Synergy scores (how much more a card appears in a commander's decks vs. all decks)
  - Average deck composition by commander
  - Salt scores (community frustration rating)
  - Theme/tribal detection
  - Budget alternatives
- **Key pages:**
  - `/commanders/{name}` - Commander page with top cards, themes, budget
  - `/top` - Most popular commanders
  - `/themes` - Popular deck themes
  - `/rec` - Card recommendations for a decklist
- **Limitations:** No public API documented. Data is best accessed via the website.

### Moxfield (moxfield.com)
- **Role:** Deck building platform with community decklists
- **Why it's reliable:** Most active deck builder for Commander. High-quality decklists.
- **Use for:** Finding well-built example decklists for a commander, community deck stats
- **API:** Has a public API for deck data

### Archidekt (archidekt.com)
- **Role:** Deck building platform with analytics
- **Why it's reliable:** Strong analytics tools, bracket estimation features
- **Use for:** Deck building, mana curve visualization, color distribution, bracket self-assessment

## Tier 3: Analysis and Content (Expert Opinions)

### MTGGoldfish (mtggoldfish.com)
- **Role:** Price tracking, metagame analysis, deck techs, budget builds
- **Use for:** Price trends, budget deck ideas, metagame snapshots
- **Reliability:** Very reliable for prices and meta. Articles are opinion but well-informed.

### Commander's Herald / CommandZone content
- **Role:** Strategy articles, deck techs
- **Use for:** Strategy insights, play pattern analysis
- **Reliability:** Good strategy content, but opinions not data

### EDH Power Level (edhpowerlevel.com)
- **Role:** Automated power level estimation
- **Use for:** Quick bracket/power estimation for a decklist
- **Reliability:** Useful heuristic but not authoritative

## Data Pipeline Priority

When analyzing a deck, query sources in this order:

1. **Scryfall** - Validate every card name, check legality, get oracle text and prices
2. **Comprehensive Rules** (bundled) - Resolve rules questions about interactions
3. **EDHREC** - Get statistical context: how does this deck compare to average builds for this commander?
4. **Commander bracket data** (bundled) - Assess bracket placement

## Anti-Hallucination Protocol

This is critical for MTG analysis. The LLM layer is the reasoning engine, NOT the source of truth.

**Before suggesting any card:**
1. Verify the card exists (Scryfall exact name search)
2. Verify it's legal in Commander
3. Verify it fits the color identity
4. Check the current price against budget constraints
5. Verify the oracle text says what you think it says

**Common LLM failure modes for MTG:**
- Inventing cards that don't exist (mixing up similar card names)
- Getting oracle text wrong (especially for cards with errata)
- Not knowing about recent bans
- Suggesting cards outside color identity
- Getting mana costs wrong
- Confusing similar cards (e.g., Path to Exile vs Swords to Plowshares details)

**When in doubt:** Always recommend the user verify on Scryfall. It's better to say "I believe X but verify on Scryfall" than to state something incorrect with confidence.
