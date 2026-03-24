# MagicAIBuilder: Roadmap & TODO

Tracked features and improvements for future development.

---

## Card Type Support

- [ ] **MDFC (Modal Double-Faced Cards)**: full support for MDFCs (e.g. Shatterskull Smashing // Shatterskull, the Hammer Pass): display both faces, let the player choose which face to show in the deck list and grid, count CMC correctly (front face only), and flag them in mana curve/statistics as flexible land-or-spell cards

- [ ] **Double-faced cards (DFC): flip/transform**: cards with two faces where only one is playable at a given time (e.g. Delver of Secrets // Insectile Aberration, werewolves): show the front face by default, allow flipping the preview, and correctly handle image fetching for both faces via Scryfall (`card_faces`)

- [ ] **Hybrid cards**: cards with hybrid mana costs (e.g. {W/U}, {2/W}) where the caster can pay either color: correctly parse hybrid symbols in mana cost display, attribute both colors to the color identity, and account for hybrid pips in mana symbol proportion statistics (each hybrid pip counts as 0.5 toward each color, or as the chosen color)

## Deck Editor

- [ ] **Bulk edit on Sideboard & Considering**: select multiple cards at once and move/remove them in bulk; currently only one card at a time can be managed in the Sideboard and Considering zones

## API & Data

- [ ] **Enhance Scryfall API usage**: smarter caching, request batching, better error recovery, and rate-limit handling to reduce redundant calls and improve load times

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

## Search & Filtering

- [ ] **Enhanced deck-building filters**: filter cards by subtype, keyword, power/toughness, price range, set legality, and interaction type while building; add saved filter presets

## AI

- [ ] **Enhance AI deck builder**: improve card suggestion quality, add archetype templates (stax, combo, voltron…), support budget constraints, and explain each suggestion with a rationale

- [ ] **Local AI model for deck building via MageZero**: use [MageZero](https://github.com/WillWroble/MageZero) — a reinforcement-learning engine that plays Magic — to generate training data (game states, card evaluations, winning lines) and fine-tune a local model (Ollama or equivalent) specialized in Commander deck building; the local model would power card suggestions, synergy detection, and archetype recommendations without relying on a cloud API

## Export / Print / Proxy

- [ ] **Enhance export, print & proxy support**: add print-ready proxy sheets (configurable layout: 3×3, A4…), PDF export, image-only export, and richer format options (EDHRec, Goldfish, Archidekt import/export)

## Statistics

- [ ] **Enhanced deck statistics** including:
  - Cards playable on turn 1 (based on CMC and mana production)
  - Corrected CMC split: with lands vs. without lands (non-land average)
  - Mana production vs. mana curve alignment: flag color imbalances (e.g. 48% blue symbols but only 30% blue mana production on lands)
  - Proportion of each mana symbol in card costs vs. proportion of that mana produced by lands
  - Mana base recommendations based on color requirements

## Playtesting

- [ ] **Hand draw & goldfishing**: draw opening hands with mulligan simulation (Vancouver / London rules), track mana available per turn, simulate solo turns (goldfish), similar to Moxfield or TappedOut playtester

## Formats

- [ ] **Support all MTG formats**: not only Commander/Multiplayer; add Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker, etc. with correct deck size and banlist enforcement per format

- [ ] **Per-format deck statistics**: bracket scoring is Commander-specific; provide relevant stats for each format (curve quality, threat density, interaction ratio, etc.)

## User Accounts

- [ ] **User account system**: registration, login, profile management (CRUD), secure authentication (OAuth2 / JWT), deck ownership and private/public visibility, GDPR compliance

## Community

- [ ] **Deck suggestions from other players**: for a given commander, show community-submitted decks; filter by bracket, strategy, budget; upvote/comment system

## UI / UX

- [ ] **Visual redesign**: modernize the interface; improve mobile responsiveness, card hover interactions, drag-and-drop UX, and overall polish

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [ ] **Sentry** (`@sentry/nextjs`): automatic error capture on frontend and backend; free for side projects; install takes ~5 minutes; the single most impactful observability tool to add first

- [x] **Health check endpoint**: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [ ] **UptimeRobot** (once deployed): go to uptimerobot.com, create a free account, add a new HTTP(s) monitor pointing to `https://<your-domain>/api/health`, set interval to 5 minutes, and add an alert contact (email or Discord webhook) — free plan includes 50 monitors

- [ ] **Bundle analyzer** (`@next/bundle-analyzer`): visual map of JS bundle size per dependency; run once a month to catch bloat before it impacts load times

### Level 2: When you have real users

- [ ] **Vercel Analytics**: real-world performance metrics per page and device: LCP, CLS, INP (Core Web Vitals); free on the hobby plan if deploying to Vercel

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions → UX problem"); free up to 1M events/month

- [ ] **Structured logging**: replace `console.error("[GET /api/decks]", error)` with a structured JSON logger (Pino is the Node standard); emit `level`, `timestamp`, `requestId`, `route`, and `error` fields so logs are searchable after the fact

### Level 3: When it's serious

- [ ] **Grafana + Prometheus**: custom monitoring dashboards: Scryfall requests per minute, API route response times, decks created per day; self-hosted, powerful, significant setup cost

- [ ] **OpenTelemetry**: distributed tracing across the full request path (click → API route → Prisma query → Scryfall call → response); pinpoints exactly where latency comes from; Next.js 15 has experimental native support

- [ ] **PagerDuty / OpsGenie**: serious alerting with on-call rotation and escalation policies; relevant for teams, not needed as a solo developer

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing
