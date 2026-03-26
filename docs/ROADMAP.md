# MagicAIBuilder: Roadmap & TODO

Tracked features and improvements for future development.

---

## Card Type Support

- [x] **MDFC (Modal Double-Faced Cards)**: full support for MDFCs (e.g. Shatterskull Smashing // Shatterskull, the Hammer Pass): display both faces, let the player choose which face to show in the deck list and grid, count CMC correctly (front face only), and flag them in mana curve/statistics as flexible land-or-spell cards

- [x] **Double-faced cards (DFC): flip/transform**: cards with two faces where only one is playable at a given time (e.g. Delver of Secrets // Insectile Aberration, werewolves): show the front face by default, allow flipping the preview, and correctly handle image fetching for both faces via Scryfall (`card_faces`)

- [ ] **Hybrid cards**: cards with hybrid mana costs (e.g. {W/U}, {2/W}) where the caster can pay either color: correctly parse hybrid symbols in mana cost display, attribute both colors to the color identity, and account for hybrid pips in mana symbol proportion statistics (each hybrid pip counts as 0.5 toward each color, or as the chosen color)

## Deck Editor

- [x] **Deck Snapshots** _(done — 2026-03-26)_: save named versions of a deck with full card list; restore any snapshot transactionally; diff badge shows +/- cards vs. current deck

- [x] **Maybeboard** _(done — 2026-03-26)_: track considered cards outside the 99; move cards between Maybeboard and Main; excluded from all stats and export totals

- [x] **Deck annotations** _(done — 2026-03-26)_: deck description (collapsible textarea), card notes (inline popover, exported as comments), deck tags (pill UI, home-page filter bar)

- [ ] **Bulk edit on Sideboard & Considering**: select multiple cards at once and move/remove them in bulk; currently only one card at a time can be managed in the Sideboard and Considering zones

## API & Data

- [ ] **Enhance Scryfall API usage**: smarter caching, request batching, better error recovery, and rate-limit handling to reduce redundant calls and improve load times

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

## Search & Filtering

- [x] **Enhanced deck-building filters**: filter cards by subtype, keyword, power/toughness, price range, set legality, and interaction type while building; add saved filter presets _(done — color OR/AND/EXACT modes, colorless filter, lands toggle, CMC exact/min/max/range modes, price range, subtype, keyword, power/toughness, interaction archetypes, localStorage presets)_

## AI

- [ ] **Enhance AI deck builder**: improve card suggestion quality, add archetype templates (stax, combo, voltron…), support budget constraints, and explain each suggestion with a rationale

- [ ] **Local AI model for deck building via MageZero**: use [MageZero](https://github.com/WillWroble/MageZero) — a reinforcement-learning engine that plays Magic — to generate training data (game states, card evaluations, winning lines) and fine-tune a local model (Ollama or equivalent) specialized in Commander deck building; the local model would power card suggestions, synergy detection, and archetype recommendations without relying on a cloud API

## Export / Print / Proxy

- [ ] **Enhance export, print & proxy support**: add print-ready proxy sheets (configurable layout: 3×3, A4…), PDF export, image-only export, and richer format options (EDHRec, Goldfish, Archidekt import/export)

## Statistics

- [x] **Enhanced deck statistics** _(done — 2026-03-26)_:
  - Cards playable on turn 1 (`turn1Playable` stat)
  - Corrected CMC split: `avgCmcWithLands` and `avgCmcWithoutLands`
  - Mana Alignment panel: per-colour symbol ratio vs. land production ratio with imbalance warnings
  - `recommendedLandsByColor` per-colour land recommendations
  - Hybrid pips counted as 0.5 toward each colour

## Playtesting

- [x] **Hand draw & goldfishing** _(done — 2026-03-26)_: `usePlaytest` hook with Fisher-Yates shuffle, London mulligan, `drawCard`, `nextTurn`; `PlaytestModal` fullscreen with fan hand display, hover card preview, library pile counter

## Formats

- [ ] **Support all MTG formats**: not only Commander/Multiplayer; add Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker, etc. with correct deck size and banlist enforcement per format

- [ ] **Per-format deck statistics**: bracket scoring is Commander-specific; provide relevant stats for each format (curve quality, threat density, interaction ratio, etc.)

## User Accounts

- [ ] **User account system**: registration, login, profile management (CRUD), secure authentication (OAuth2 / JWT), deck ownership and private/public visibility, GDPR compliance

## Community

- [ ] **Deck suggestions from other players**: for a given commander, show community-submitted decks; filter by bracket, strategy, budget; upvote/comment system

## SEO & Discoverability

- [x] **SEO optimization** _(done — 2026-03-26, #153)_: `robots.txt` (blocks private routes), dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card, canonical URL), JSON-LD `SoftwareApplication` structured data, dynamic Open Graph image via `/api/og` edge route

## UI / UX

- [x] **Footer layout** _(done — 2026-03-26, #166)_: Shortcuts button aligned inline with copyright line in footer

- [ ] **Visual redesign**: modernize the interface; improve mobile responsiveness, card hover interactions, drag-and-drop UX, and overall polish

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center

- [x] **Health check endpoint**: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [ ] **UptimeRobot** (once deployed): go to uptimerobot.com, create a free account, add a new HTTP(s) monitor pointing to `https://<your-domain>/api/health`, set interval to 5 minutes, and add an alert contact (email or Discord webhook) — free plan includes 50 monitors

- [ ] **Bundle analyzer** (`@next/bundle-analyzer`): visual map of JS bundle size per dependency; run once a month to catch bloat before it impacts load times

- [ ] **Dependabot** (GitHub native, zero config): add `.github/dependabot.yml` to get automatic PRs when npm dependencies have security vulnerabilities; free, catches CVEs before they become problems — **recommended first for a solo project**

### Level 2: When you have real users

- [ ] **Vercel Analytics**: real-world performance metrics per page and device: LCP, CLS, INP (Core Web Vitals); free on the hobby plan if deploying to Vercel

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions → UX problem"); free up to 1M events/month — **recommended second: understand how people actually use the tool**

- [ ] **Plausible**: simple, privacy-friendly traffic analytics (GDPR compliant, no cookies); good alternative to PostHog if you only need page views and referrers, not event tracking

- [ ] **LogRocket**: session replay — watch exactly what users did before an error occurred; useful for understanding UX issues in the deck builder; free tier available

- [ ] **Lighthouse CI**: add to GitHub Actions to score performance/accessibility/SEO on every PR; catches regressions before they ship; pairs well with Next.js; **recommended** to keep Next.js perf under control

- [ ] **Chromatic**: visual regression testing — takes screenshots of shadcn/ui components on every PR and diffs them; catches unintended UI changes; free for open-source

- [ ] **Structured logging**: replace `console.error("[GET /api/decks]", error)` with a structured JSON logger (Pino is the Node standard); emit `level`, `timestamp`, `requestId`, `route`, and `error` fields so logs are searchable after the fact

### Level 3: When it's serious

- [ ] **Datadog or Better Uptime**: full-stack monitoring with dashboards, anomaly detection, and SLA tracking; more powerful than UptimeRobot but paid

- [ ] **Snyk**: deeper dependency vulnerability scanning than Dependabot; scans container images and IaC configs too; useful if the project grows beyond a solo hobby

- [ ] **Grafana + Prometheus**: custom monitoring dashboards: Scryfall requests per minute, API route response times, decks created per day; self-hosted, powerful, significant setup cost

- [ ] **OpenTelemetry**: distributed tracing across the full request path (click → API route → Prisma query → Scryfall call → response); pinpoints exactly where latency comes from; Next.js 15 has experimental native support

- [ ] **PagerDuty / OpsGenie**: serious alerting with on-call rotation and escalation policies; relevant for teams, not needed as a solo developer

## Internationalization (i18n)

- [ ] **Multi-language support**: add i18n support (next-intl or next-i18next) covering the languages Magic: The Gathering is officially printed in; base set: English, Japanese, Simplified Chinese, French, Italian, German, Spanish, Portuguese; to be added later: Russian, Korean
- [ ] **Localized card data**: fetch and display card names, oracle text, and type lines in the user's language via Scryfall's `lang` parameter
- [ ] **UI translations**: translate all interface labels, tooltips, error messages, and navigation using a locale file system; keep English as the fallback

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing


---

## Tournament Decks Import

Import competitive decklists directly from tournament databases to use as references, inspiration, or starting points for deck building.

### Sources to support

- [ ] **MTGTop8** (`https://www.mtgtop8.com`) — one of the largest tournament deck databases; supports Commander, Legacy, Modern, Vintage, etc.; fetch top decks by format/archetype
- [ ] **MTGDecks.net** (`https://mtgdecks.net`) — tournament results aggregator with Commander support
- [ ] **Moxfield** (`https://www.moxfield.com`) — popular deck builder with public API; import deck by URL
- [ ] **EDHRec** (`https://edhrec.com`) — Commander-specific; top commanders, popular cards, theme-based recommendations
- [ ] **Archidekt** (`https://archidekt.com`) — deck builder with public deck sharing; import by URL
- [ ] **TappedOut** (`https://tappedout.net`) — community deck builder; import via their export format

### Implementation approach

- Add an "Import from URL" field in the import dialog alongside the existing plain text import
- Detect source from URL (regex match per domain) and use the appropriate parser/fetcher
- Rate-limit requests, respect `robots.txt`
- Show a "Tournament Deck" badge on imported decks
- Optionally show win rate / event context if available from the source

### Tournament meta analysis (future)

- For a given commander, fetch and aggregate top tournament decks from MTGTop8/MTGDecks
- Show most popular cards across meta decks as AI suggestions complement
- Track meta shifts over time (card frequency in/out)
