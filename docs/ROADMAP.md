# MagicAIBuilder — Roadmap & TODO

Tracked features and improvements for future development.

---

## Deck Editor

- [ ] **Bulk edit on Sideboard & Considering** — select multiple cards at once and move/remove them in bulk; currently only one card at a time can be managed in the Sideboard and Considering zones

## API & Data

- [ ] **Enhance Scryfall API usage** — smarter caching, request batching, better error recovery, and rate-limit handling to reduce redundant calls and improve load times

## Search & Filtering

- [ ] **Enhanced deck-building filters** — filter cards by subtype, keyword, power/toughness, price range, set legality, and interaction type while building; add saved filter presets

## AI

- [ ] **Enhance AI deck builder** — improve card suggestion quality, add archetype templates (stax, combo, voltron…), support budget constraints, and explain each suggestion with a rationale

## Export / Print / Proxy

- [ ] **Enhance export, print & proxy support** — add print-ready proxy sheets (configurable layout: 3×3, A4…), PDF export, image-only export, and richer format options (EDHRec, Goldfish, Archidekt import/export)

## Statistics

- [ ] **Enhanced deck statistics** including:
  - Cards playable on turn 1 (based on CMC and mana production)
  - Corrected CMC split: with lands vs. without lands (non-land average)
  - Mana production vs. mana curve alignment — flag color imbalances (e.g. 48% blue symbols but only 30% blue mana production on lands)
  - Proportion of each mana symbol in card costs vs. proportion of that mana produced by lands
  - Mana base recommendations based on color requirements

## Playtesting

- [ ] **Hand draw & goldfishing** — draw opening hands with mulligan simulation (Vancouver / London rules), track mana available per turn, simulate solo turns (goldfish), similar to Moxfield or TappedOut playtester

## Formats

- [ ] **Support all MTG formats** — not only Commander/Multiplayer; add Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker, etc. with correct deck size and banlist enforcement per format

- [ ] **Per-format deck statistics** — bracket scoring is Commander-specific; provide relevant stats for each format (curve quality, threat density, interaction ratio, etc.)

## User Accounts

- [ ] **User account system** — registration, login, profile management (CRUD), secure authentication (OAuth2 / JWT), deck ownership and private/public visibility, GDPR compliance

## Community

- [ ] **Deck suggestions from other players** — for a given commander, show community-submitted decks; filter by bracket, strategy, budget; upvote/comment system

## UI / UX

- [ ] **Visual redesign** — modernize the interface; improve mobile responsiveness, card hover interactions, drag-and-drop UX, and overall polish

## Partnerships & Integrations

- [ ] **Tool integrations** — explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing
