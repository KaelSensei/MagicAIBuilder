<p align="center">
  <img src="assets/banner.png" alt="MagicAIBuilder — AI-Powered Commander Deck Builder" width="100%"/>
</p>

# MagicAIBuilder

AI-powered Commander (EDH) deck builder and optimization platform.
Desktop-first, bracket-aware, with validated card data.

---

## What Is This

MagicAIBuilder is a deck builder for Commander (EDH) with two distinct modes: a free-form builder for experienced players who know exactly what they want, and an AI-assisted mode that guides you through deck construction step by step.

Unlike chatbot-style AI tools that generate decklists from scratch and hope for the best, MagicAIBuilder validates every card suggestion against Scryfall before it reaches you. Unlike pure builders (Moxfield, Archidekt), it provides contextual analysis, not just data.

**Core idea:** LLM = reasoning layer. Scryfall + EDHREC = source of truth. Never trust the model with card data.

---

## Two Modes

### Mode 1: Free Build

Full-featured deck builder with search, filters, and card browser. Like Moxfield, but with live bracket scoring and Game Changers detection running in the background.

- Scryfall-powered card search with full syntax support
- Drag & drop deck construction
- Real-time stats: mana curve, color distribution, category breakdown
- Live bracket estimation as you build
- Game Changers counter with bracket limit warnings
- Banlist enforcement (cards flagged on add)
- Import from Moxfield / Archidekt URLs or paste a text decklist

### Mode 2: Assisted Build

A guided flow where the AI helps you construct a deck from the ground up.

**Step 1: Define your parameters**
- Choose your commander (or let the AI suggest one)
- Select your colors
- Pick a theme/archetype: Tokens, +1/+1 Counters, Aristocrats, Reanimator, Voltron, Spellslinger, Landfall, Tribal, Enchantress, Mill, Wheels, Blink, Equipment, Treasure, Stax, Combo, Control, Aggro... ([60+ themes available](docs/references/edh-themes.md))
- Set your budget (per card or total deck)
- Declare your target bracket (1-4)
- Specify constraints: no infinite combos, no stax, must include specific pet cards, etc.

**Step 2: AI generates a shell**
- Mana base built to match colors, budget, and bracket
- Ramp, draw, removal, board wipes filled to bracket benchmarks
- Synergy cards selected based on commander + theme + EDHREC lift scores
- Win conditions matched to bracket speed expectations

**Step 3: Refine together**
- Review each category, swap cards in/out
- AI explains every pick: why this card, what it does for the deck
- Live bracket re-scoring as you modify
- Budget tracker updates in real-time

**Step 4: Validate & export**
- Full Scryfall validation pass (legality, color identity, price accuracy)
- Game Changers check against bracket limit
- Banlist enforcement
- Export to Moxfield, Archidekt, MTGO, Arena, or plain text

---

## Features

### Bracket-Aware Intelligence
- Bracket 1-4 + cEDH classification with multi-dimension scoring
- [Game Changers detection](docs/references/game-changers.md) (53 cards, Feb 2026) with bracket limit enforcement
- [Banlist enforcement](docs/references/banlists.md) with per-card explanations
- Per-bracket benchmarks for ramp, draw, removal, interaction density
- "What to change to move up/down" guidance

### Card Validation Pipeline
- Every card verified against Scryfall API: existence, legality, color identity, price
- Post-LLM validation strips hallucinated or banned cards
- Price enforcement against declared budget
- Oracle text cross-check to catch errata mismatches

### Theme & Archetype Engine
- [60+ recognized themes](docs/references/edh-themes.md): mechanic-based (Tokens, Counters, Sacrifice, Blink...), strategy-based (Aggro, Control, Combo, Voltron...), tribal (40+ creature types)
- Theme-aware card suggestions: cards tagged by theme with EDHREC synergy/lift scores
- Synergy pairings: suggests complementary themes (Tokens + Sacrifice, Blink + ETB, Landfall + Extra Lands...)

### Data Integration
- **[Scryfall](https://scryfall.com)**: card data, oracle text, legality, prices, rulings
- **[EDHREC](https://edhrec.com)**: synergy/lift scores, commander staples, metagame stats
- **[Commander Spellbook](https://commanderspellbook.com)**: combo database, combo classification
- **[WotC Official](https://magic.wizards.com/en/rules)**: Comprehensive Rules, [banned list](https://magic.wizards.com/en/banned-restricted-list), bracket updates
- **[Game Changers](https://scryfall.com/search?as=grid&order=color&q=is:gamechanger)**: live Scryfall tag

---

## Architecture

```
         ┌─────────────────────────────────────────┐
         │              MagicAIBuilder              │
         │                                          │
         │  ┌──────────────┐  ┌──────────────────┐ │
         │  │  Free Build   │  │  Assisted Build  │ │
         │  │  (Moxfield-   │  │  (AI-guided      │ │
         │  │   like UX)    │  │   step by step)  │ │
         │  └──────┬───────┘  └────────┬─────────┘ │
         │         │                    │            │
         │         └────────┬───────────┘            │
         │                  │                        │
         │      ┌───────────┴───────────┐            │
         │      │    Validation Layer   │            │
         │      │  Scryfall API (live)  │            │
         │      │  Banlist enforcement  │            │
         │      │  Game Changers check  │            │
         │      │  Color identity       │            │
         │      │  Budget enforcement   │            │
         │      └───────────┬───────────┘            │
         │                  │                        │
         │   ┌──────────────┼──────────────┐         │
         │   │              │              │         │
         │   ▼              ▼              ▼         │
         │ Scryfall      EDHREC     Commander        │
         │ API           Stats      Spellbook        │
         │ (cards,       (synergy,  (combos)         │
         │  prices,      lift,                       │
         │  legality)    staples)                    │
         └─────────────────────────────────────────┘

         Assisted Build also uses:
         ┌──────────────────┐
         │   LLM Analysis   │
         │   (structured     │
         │    prompts with   │
         │    validated data)│
         └──────────────────┘
```

**Desktop-first:** Optimized for browser on desktop screens. Deck building, card browsing, and side-by-side analysis panels need screen real estate. Mobile-responsive views planned for deck viewing and quick edits.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js + Tailwind + shadcn/ui + Framer Motion | Modern React stack, beautiful components, fluid animations |
| Card data | Scryfall API | Most complete, accurate MTG database. Free, well-documented |
| Metagame data | EDHREC | Largest EDH dataset (Archidekt + Moxfield aggregation) |
| Rules engine | Comprehensive Rules (bundled) | Official WotC rules, updated per set release |
| AI analysis | LLM + structured prompts | Reasoning over validated data, not raw generation |
| Validation | Scryfall API (pre/post) | Anti-hallucination pipeline |

---

## Competitive Landscape

### Deck Builders (No AI)

| Tool | Strengths | What's Missing |
|------|-----------|----------------|
| [Moxfield](https://moxfield.com) | Best UX, clean builder, playtester, packages system | No AI analysis, no bracket scoring |
| [Archidekt](https://archidekt.com) | Good analytics, EDHREC integration, deck comparison | Analysis is data display, not actionable advice |
| [TappedOut](https://tappedout.net) | Large legacy community | Dated UI, no modern features |
| [Deckstats](https://deckstats.net) | Stats and probability tools | Minimal Commander-specific features |

### AI Deck Tools

| Tool | Approach | What's Missing |
|------|----------|----------------|
| [MTG Agents / Karn](https://mtg-agents.com) | Chat-based AI deck generation from prompt | No builder UI, no bracket analysis, no post-validation |
| [KrakenTheMeta](https://krakenthemeta.com) | AI-driven competitive deck building | Competitive focus, less Commander/bracket support |
| [EDHGen.AI](https://edhgen.ai) | AI Commander deck generation | Generator only, no analysis of existing decks |
| [ManaTap AI](https://www.manatap.ai) | AI assistant for deck tweaks | Chat-only, no structured analysis output |
| [AI Deck Tutor](https://www.aidecktutor.com) | AI card recommendations | Recommendation layer, not full analysis |

### Power Level Calculators

| Tool | Approach | What's Missing |
|------|----------|----------------|
| [EDH Power Level](https://edhpowerlevel.com) | Data-driven power score | Score only, no actionable fix suggestions |
| [BrackCheck](https://brackcheck.com) | Game Changers + bracket checker | Rule-based, no strategic analysis |
| [Commander Power Meter](https://commanderpowermeter.com) | Formula-based power estimation | Static formula, no context-aware advice |

### Where MagicAIBuilder Fits

Nobody combines a real builder UX with AI analysis that's bracket-aware, budget-conscious, AND validates its own output. The AI tools are chatbots with no data pipeline. The builders show stats but don't tell you what to do. The calculators give a number but no path forward.

MagicAIBuilder: **real builder UX + AI-assisted construction + validated suggestions + bracket intelligence**.

---

## Project Structure

```
MagicAIBuilder/
  README.md
  .claude/
    skills/
      mtg-rules.skill               # Comprehensive Rules reference (Feb 2026)
      mtg-commander-analysis.skill   # Deck analysis engine (Scryfall, brackets, heuristics)
      mtg-learn.skill                # Learning guide (beginner + Commander)
  docs/
    prompt-system/
      MTG_Commander_Deck_Analysis_Prompt.md   # LLM prompt system for analysis
    rules/
      MagicCompRules 20260227.txt    # Official Comprehensive Rules
      MagicCompRules 20260227.pdf
      MagicCompRules 20260227.docx
    references/
      edh-themes.md                  # 60+ themes & archetypes catalog
      game-changers.md               # Game Changers list (53 cards, Feb 2026)
      banlists.md                    # Commander banlist + format legality
      official-sources.md            # Index of all official data URLs
```

---

## Official Sources

| Resource | URL |
|----------|-----|
| Comprehensive Rules | https://magic.wizards.com/en/rules |
| Banned & Restricted List | https://magic.wizards.com/en/banned-restricted-list |
| Game Changers (live) | https://scryfall.com/search?as=grid&order=color&q=is:gamechanger |
| Scryfall API | https://api.scryfall.com |
| EDHREC Themes | https://edhrec.com/tags/themes |
| Commander Spellbook | https://commanderspellbook.com |

---

## Roadmap

### Phase 1: Foundation
- [ ] Next.js project setup with Tailwind + shadcn/ui
- [ ] Scryfall API integration (card search, validation, images)
- [ ] Card browser with instant search, filters, hover zoom
- [ ] Free Build mode: drag & drop deck editor with live stats

### Phase 2: Intelligence
- [ ] Banlist enforcement (Commander + format-aware)
- [ ] Game Changers detection with bracket limit warnings
- [ ] Bracket scoring engine (multi-dimension heuristic)
- [ ] Theme/archetype detection from decklist analysis
- [ ] Heuristic engine: ramp/draw/removal benchmarks by bracket

### Phase 3: Assisted Build
- [ ] Guided flow: commander > colors > theme > budget > bracket
- [ ] LLM analysis integration (structured prompts with validated data)
- [ ] AI deck shell generation with per-card justifications
- [ ] Post-validation layer (strip hallucinated/banned cards)
- [ ] EDHREC synergy/lift score integration

### Phase 4: Polish
- [ ] Deck import (Moxfield URL, Archidekt URL, plain text)
- [ ] Deck export (Moxfield, Archidekt, MTGO, Arena, text)
- [ ] Commander Spellbook integration (combo detection)
- [ ] Collection-aware suggestions (recommend owned cards)
- [ ] Playtest / goldfish mode

### Phase 5: Mobile
- [ ] Mobile-responsive deck viewing
- [ ] Quick card search and add
- [ ] Deck sharing with QR codes

---

## Contributing

This project is in early development. If you're interested in contributing, open an issue to discuss your idea first.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Disclaimer

MagicAIBuilder is unofficial Fan Content permitted under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Not approved/endorsed by Wizards of the Coast. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

Mana symbols and Magic: The Gathering™ are trademarks of Wizards of the Coast LLC.
