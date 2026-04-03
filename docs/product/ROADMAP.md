# MagicAIBuilder: Roadmap

Tracked features and improvements for future development, split into **Technical** (infrastructure, tooling, stack) and **Functional** (user-facing features, gameplay).

---

## Rough weighting (quick prioritization)

This is a **rough** first-pass weighting using a lightweight RICE/MoSCoW hybrid:

- **Weight 5**: Must-have / unblocks core product / high leverage
- **Weight 4**: High value soon, but not blocking
- **Weight 3**: Useful improvement, can wait
- **Weight 2**: Nice-to-have / polish
- **Weight 1**: Experimental / long-term / speculative

Top candidates right now (subject to change):

- **Dependabot** — Weight **5** (low effort, high security value)
- **Enhance Scryfall API usage (caching/batching/error recovery)** — Weight **5** (core perf + UX)
- **UptimeRobot** — Weight **4** (early production safety net)
- **Structured logging (Pino)** — Weight **4** (debuggability once real users arrive)
- **Bundle analyzer (monthly)** — Weight **3**
- **Visual redesign** — Weight **3** (big surface area, schedule when stable)
- **Multi-language support (i18n)** — Weight **2** (valuable, but big effort; after MVP traction)
- **Local AI model via MageZero** — Weight **1** (very high effort / research)

# Part 1 — Technical Roadmap

## Tech Stack Decisions

Preferred technology choices for new infrastructure. Based on cost, DX, and reliability.

### Database

- [x] **Use Neon (PostgreSQL)** _(recommended)_ — serverless Postgres, generous free tier, branches for preview environments. Avoid Supabase (vendor lock-in) and MongoDB (poor fit for relational data).
- **Current**: Prisma 6.x (7.x upgrade pending) + PostgreSQL (prod), SQLite (dev). Neon recommended for hosting.

### Authentication

- [x] **NextAuth.js v5** _(done — 2026-03-27)_: Google OAuth + credentials auth already implemented.
- [ ] **Evaluate Better-Auth** as a future replacement or complement — simpler API, better DX than Clerk or Auth0. Clerk is explicitly not recommended (pricing, complexity, lock-in).

### File Storage

- [ ] **Cloudflare R2** for file/image storage — S3-compatible API, zero egress fees, cheapest option available. Avoid AWS S3 (egress costs) and Supabase Storage (tied to Supabase ecosystem).
- Use cases: deck thumbnails, user avatars, exported deck images, proxy sheet PDFs.

### Domain & DNS

- [ ] **Porkbun or Cloudflare** for domain registration and DNS — better UX, cheaper, faster than Namecheap. Cloudflare also provides free CDN, DDoS protection, and R2 integration.

### Hosting

- Current: Vercel (Next.js native). No change planned.

---

## API & Data

- [ ] **Enhance Scryfall API usage**: smarter caching, request batching, better error recovery, and rate-limit handling to reduce redundant calls and improve load times

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

---

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center
- [x] **Health check endpoint** _(done)_: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [ ] **UptimeRobot** (once deployed): monitor `https://<your-domain>/api/health` every 5 minutes with email/Discord alerts — free plan includes 50 monitors
- [ ] **Bundle analyzer** (`@next/bundle-analyzer`): run monthly to catch JS bloat early
- [ ] **Dependabot** (GitHub native): auto-PRs for CVEs in npm dependencies; **recommended first**

### Level 2: When you have real users

- [ ] **Vercel Analytics**: real-world performance metrics per page and device: LCP, CLS, INP (Core Web Vitals); free on the hobby plan if deploying to Vercel

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions -> UX problem"); free up to 1M events/month — **recommended second: understand how people actually use the tool**

- [ ] **Plausible**: simple, privacy-friendly traffic analytics (GDPR compliant, no cookies); good alternative to PostHog if you only need page views and referrers, not event tracking

- [ ] **LogRocket**: session replay — watch exactly what users did before an error occurred; useful for understanding UX issues in the deck builder; free tier available

- [ ] **Lighthouse CI**: add to GitHub Actions to score performance/accessibility/SEO on every PR; catches regressions before they ship; pairs well with Next.js; **recommended** to keep Next.js perf under control

- [ ] **Chromatic**: visual regression testing — takes screenshots of shadcn/ui components on every PR and diffs them; catches unintended UI changes; free for open-source

- [ ] **Structured logging**: replace `console.error("[GET /api/decks]", error)` with a structured JSON logger (Pino is the Node standard); emit `level`, `timestamp`, `requestId`, `route`, and `error` fields so logs are searchable after the fact

### Level 3: When it's serious

- [ ] **Datadog or Better Uptime**: full-stack monitoring with dashboards, anomaly detection, and SLA tracking; more powerful than UptimeRobot but paid

- [ ] **Snyk**: deeper dependency vulnerability scanning than Dependabot; scans container images and IaC configs too; useful if the project grows beyond a solo hobby

- [ ] **Grafana + Prometheus**: custom monitoring dashboards: Scryfall requests per minute, API route response times, decks created per day; self-hosted, powerful, significant setup cost

- [ ] **OpenTelemetry**: distributed tracing across the full request path (click -> API route -> Prisma query -> Scryfall call -> response); pinpoints exactly where latency comes from; Next.js 15 has experimental native support

- [ ] **PagerDuty / OpsGenie**: serious alerting with on-call rotation and escalation policies; relevant for teams, not needed as a solo developer

---

## SEO & Discoverability

- [x] **SEO optimization** _(done — 2026-03-26, #153)_: `robots.txt` (blocks private routes), dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card, canonical URL), JSON-LD `SoftwareApplication` structured data, dynamic Open Graph image via `/api/og` edge route

---

## Internationalization (i18n)

- [ ] **Multi-language support**: add i18n support (next-intl or next-i18next) covering the languages Magic: The Gathering is officially printed in; base set: English, Japanese, Simplified Chinese, French, Italian, German, Spanish, Portuguese; to be added later: Russian, Korean
- [ ] **Localized card data**: fetch and display card names, oracle text, and type lines in the user's language via Scryfall's `lang` parameter
- [ ] **UI translations**: translate all interface labels, tooltips, error messages, and navigation using a locale file system; keep English as the fallback

---

---

# Part 2 — Functional Roadmap

## Card Type Support

- [x] **MDFC (Modal Double-Faced Cards)** _(done)_: display both faces, player chooses which to show, correct CMC (front face), flexible land-or-spell flagging
- [x] **Double-faced cards (DFC) / Flip / Transform** _(done)_: front face default, flip preview, correct image fetching via Scryfall `card_faces`
- [x] **Hybrid cards** _(done — #200)_: correct color identity parsing, symbol display, 0.5 pip distribution per color

---

## Deck Editor

- [x] **Deck Snapshots** _(done)_: save/restore/diff versioned decks with card count tracking
- [x] **Maybeboard & Sideboard** _(done)_: track cards outside the 99/100, excluded from stats
- [x] **Deck annotations** _(done)_: description (markdown), card notes, tags with home-page filtering
- [x] **Bulk edit** _(done — #199)_: multi-select with bulk move/delete and color identity validation

---

## Search & Filtering

- [x] **Advanced filters** _(done)_: color (OR/AND/EXACT), colorless, lands, CMC (exact/min/max/range), price, subtype, keyword, P/T, interaction archetype, saved presets
- [x] **Search By Type tab** _(done)_: Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, DFC with OR-joined Scryfall queries

---

## AI

- [x] **Enhanced AI deck builder** _(done — #201)_: 10 archetype templates (Stax, Combo, Voltron, Aristocrats, Tokens, Spellslinger, Reanimator, Ramp, Control, Goodstuff), budget constraints, per-card reasoning
- [ ] **Local AI model via MageZero** _(experimental)_: fine-tune local model for deck building without cloud API dependency

---

## Export / Print / Proxy

- [x] **Proxy sheet PDF export** _(done — #202)_: configurable layout (3×3 A4/Letter, 2×2), client-side generation, 63×88mm cards, optional basic lands/commander
- [ ] **Text-only proxy sheets** _(in progress)_: plain-text card list with art-free format
- [ ] **Richer export formats**: EDHRec, Goldfish (import only), extended Archidekt

---

## Statistics

- [x] **Enhanced deck statistics** _(done)_: turn 1 playability, corrected CMC (with/without lands), mana alignment panel with warnings, per-color land recommendations, 0.5 pip hybrid distribution

---

## Playtesting

- [x] **Hand draw & goldfishing** _(done)_: Fisher-Yates shuffle, London mulligan rules, fullscreen modal, fan hand display, library counter
- 🔄 **Enhanced Playtest Mode** _(Sprint 5 planned)_: turn phases, step tracking, life total management

---

## Formats

- [ ] **Multiple format support** _(Sprint 4 — US-H)_: Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker with correct deck size and banlists per format
- [ ] **Format-specific statistics**: bracket scoring is Commander-only; provide curve quality, threat density, interaction ratio for other formats

---

## User Accounts & Auth

- [x] **User account system** _(done)_: NextAuth.js v5 with Google OAuth + credentials, public profiles, deck ownership, private/public decks
- [ ] **Evaluate Better-Auth**: simpler DX than Clerk; future replacement/complement consideration

---

## Community

- [ ] **Community deck suggestions** _(Sprint 4 — US-I)_: public `/commanders/[slug]/decks`, upvote/downvote, comments, "Community Favorite" badge
- [ ] **Integration in Meta panel**: show community decks alongside tournament decks

---

## UI / UX

- [x] **Footer layout** _(done)_: Shortcuts button aligned inline with copyright
- [x] **Mobile-responsive layout** _(done)_: hamburger menu, tab navigation, responsive grid
- [ ] **Visual redesign**: modernize interface, improve card hover interactions, enhance drag-and-drop UX

---

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing

---

## Tournament Decks & Meta Analysis

### URL Import Sources (✅ all complete)

- [x] **MTGTop8**, **MTGDecks.net**, **Moxfield**, **Archidekt**, **TappedOut** _(done — #204)_
- [x] **EDHRec** _(meta panel done — #205)_
- [ ] **Goldfish** (`https://mtggoldfish.com`) — future import source

### Implementation (✅ all complete)

- [x] "Import from URL" with auto-detection and parser per domain (#204)
- [x] Rate-limited requests (10/min/IP), respects `robots.txt`
- [x] "Tournament Deck" badge on imported decks
- [x] Commander meta panel — top 20 EDHRec cards + 5 latest tournament decks _(#205)_
- [ ] Show win rate / event context from tournament sources (future)
- [ ] Track meta shifts over time (future)
