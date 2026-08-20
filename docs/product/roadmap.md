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

Top candidates right now (reviewed 2026-08-19):

- ~~**Finish i18n string extraction**~~ _(done — 2026-08-20, #497 and #498)_. **Correction: this was marked done at #455 on 2026-08-19 and was not.** The builder page — the app's main screen — never called `useTranslations` at all, and `ui/Modal` and `ui/Toast` shipped English Close / Dismiss labels shared by every modal and every toast in the app. Fifteen hardcoded accessible attributes remained across nine components. The gap survived a review because nothing fails when a string is hardcoded: it renders, in English, silently. `src/i18n/catalog.test.ts` now guards the catalogs, but **no test can see a string that was never extracted** — the remaining defence is the grep in #498's description
- ~~**Diagnose the intermittent e2e failure**~~ _(diagnosed and mitigated — 2026-08-20, #495)_: the mechanism was in the **harness**, not the app. `openBuilder` returned the moment `waitForURL` saw the address change, before the route was usable, so a click could land while React was mid-hydration — the listener has attached and calls `preventDefault`, but the router cannot act yet, and the navigation is simply lost. Load-sensitive by construction, which is why hypothesis 3 kept half-fitting: compile timing was a _trigger_, never the mechanism. Still **not a captured failure** — do not run other Docker builds or repo-wide greps during the gate. The production-build question is no longer blocking
- ~~**Localized card data via Scryfall `lang`**~~ _(done — 2026-08-20, #480 deck rows, #481 tooltip, #482 playtest zones, #484 proxies, on top of #415 / #456)_
- **UptimeRobot** — Weight **4** (early production safety net, now that a database exists again)
- **Migrate `setRequestLocale` to `next/root-params`** — Weight **2**. next-intl deprecates it, but the replacement ships `unstable_rootParams` and a stub `.d.ts` in Next 15.5.22. The three SonarCloud warnings are marked accepted with that reason. Revisit when it stabilises
- ~~**Structured logging (Pino)**~~ _(done — 2026-08-19, #458)_
- **Visual redesign** — Weight **3** (big surface area, schedule when stable)
- **Local AI model via MageZero** — Weight **1** (very high effort / research)

# Part 1 — Technical Roadmap

## Tech Stack Decisions

Preferred technology choices for new infrastructure. Based on cost, DX, and reliability.

### Database

- [x] **Use Neon (PostgreSQL)** _(done — 2026-08-16)_ — provisioned via the Vercel Marketplace and connected to production, preview and development. Migrated off Supabase, whose project had been deleted or auto-paused: `/api/health` returned `503 ENOTFOUND tenant/user not found`, every sign-in failed, and **all prior production data was lost with it**. Neon also ends the Supabase pooler gymnastics — direct connections were IPv4-only and unreachable from Vercel's IPv6, the session pooler hit `MaxClientsInSessionMode`, and only the transaction pooler on 6543 worked.
  - **Migrations must use `DATABASE_URL_UNPOOLED`.** The pooled URL routes through PgBouncer in transaction mode and breaks Prisma Migrate with errors that never mention pooling.
- **Current**: Prisma 6.x (7.x upgrade pending) + Neon Postgres (prod), Docker Postgres 16 on 5432 (dev).

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

- [x] **Enhance Scryfall API usage** _(done — PR #289)_: server-side search cache (1h TTL), serialized rate limiter, name-based card cache, TanStack Query gcTime fix, shared fetchAllPages utility

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

---

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center
- [x] **Health check endpoint** _(done)_: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [x] **Error reporting wired end to end** _(done — PR #392)_: `src/instrumentation.ts` with `register()` + `onRequestError`, `instrumentation-client.ts` replacing the deprecated root config, `logger.error` forwarding to `Sentry.captureException`, and `error.tsx` / `global-error.tsx` boundaries. Before this, **no server-side error reached Sentry at all** — the routes catch into a JSON 500, so automatic instrumentation never saw them
- [ ] **UptimeRobot** (once deployed): monitor `https://<your-domain>/api/health` every 5 minutes with email/Discord alerts — free plan includes 50 monitors
- [x] **Bundle analyzer** (`@next/bundle-analyzer`) _(already in place)_: wired in `next.config.ts`, run with `pnpm analyze`
- [x] **Dependabot** (GitHub native) _(already in place)_: `.github/dependabot.yml`, weekly, two groups, majors ignored

### Level 2: When you have real users

- [ ] **Vercel Analytics**: real-world performance metrics per page and device: LCP, CLS, INP (Core Web Vitals); free on the hobby plan if deploying to Vercel

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions -> UX problem"); free up to 1M events/month — **recommended second: understand how people actually use the tool**

- [ ] **Plausible**: simple, privacy-friendly traffic analytics (GDPR compliant, no cookies); good alternative to PostHog if you only need page views and referrers, not event tracking

- [ ] **LogRocket**: session replay — watch exactly what users did before an error occurred; useful for understanding UX issues in the deck builder; free tier available

- [ ] **Lighthouse CI**: add to GitHub Actions to score performance/accessibility/SEO on every PR; catches regressions before they ship; pairs well with Next.js; **recommended** to keep Next.js perf under control

- [ ] **Chromatic**: visual regression testing — takes screenshots of shadcn/ui components on every PR and diffs them; catches unintended UI changes; free for open-source

- [x] **Structured logging** _(done — 2026-08-19, #458)_: Pino behind the existing `logger` API, zero call-site changes. The production server emits one JSON line per event — `level`, ISO `time`, `msg`, `context` (route/function), `meta`, serialised `err` stack; development and the browser keep the readable console form, and `logger.error` still forwards to Sentry in both modes. `requestId` was deliberately dropped from the first cut: it needs `AsyncLocalStorage` plumbing through every route, and `context` already answers "where"

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

- [x] **Multi-language support**: next-intl v4, `[locale]` App Router segment, composed middleware (next-intl + NextAuth) _(done — PR #320)_
- [x] **Two locales served, eight dormant** _(done — PR #398)_: `en` and `fr` are routed; `de, it, es, ja, zh, ko, ru, pt` keep their catalogs in `DORMANT_LOCALES` but are not served. They were machine-seeded English copies, and translating the interface around card text that is itself still English would ship a half-translated product in eight languages instead of a coherent one in two. Re-activating one is a single-line move once a speaker has translated it
- [x] **Language switcher** _(already in place)_: `src/components/layout/LocaleSwitcher.tsx`, mounted in the header
- [x] **Key-parity guard** _(done — PR #397)_: `messages.test.ts` fails the unit suite when any locale's key set diverges from `en`. A key present only in `en` renders as its raw dotted path everywhere else
- [x] **String extraction** _(done — 2026-08-19, #455)_: 77 of 125 components held hardcoded English. Slices: search panel (#397), playtest zones (#406), card and collection (#409), deck stats panels (#428), budget and shopping list (#433), bracket and buy list (#439), proxy export (#445), templates / bulk edit / URL import (#455). The final slice also wired the `deck.import.description` catalog key that had been shipped and never rendered, and found two more live defects: a ninth hand-built plural, and the URL-import footer claiming 2 supported sources while its own intro listed 6.

  Every slice found a defect the hardcoded strings were hiding, which is why this is done in slices rather than one pass: **eight hand-built English plurals** (`card${n === 1 ? "" : "s"}` — invisible while the UI is English, unfixable once it is not); the considering zone named _"Maybeboard"_ in a panel and _"Considering"_ on its tab; `ColorDistribution` duplicating a colour-name table `stats.color.*` already held; a French string in the English UI; and a euro sign on figures that were always USD

- [x] **Localized card data** _(done — 2026-08-20; PRs #415, #456, #480, #481, #482, #484)_: card name, type line and rules text read from a printing in the viewer's language, with **per-field** English fallback (Scryfall fills `printed_name` / `printed_type_line` / `printed_text` independently, so an all-or-nothing fallback would blank a card's rules whenever one field was missing). Wired into the printing selector (#415), then the Game Changers page and the wizard's commander preview (#456). The Game Changers list merges a localized search **over** the English one — a `lang:` search alone only returns cards printed in that language, so using it as the list would silently drop the rest. **Remaining**: the `DeckCard` surfaces (deck rows, tooltips, playtest zones, proxies) — those hold only the English snapshot written at add time, so localizing them needed a lang-aware batch fetch path first — built in #480 (`buildLocalizedNamesQueries` chunks names into `lang:xx unique:cards (!"A" or !"B" …)` searches, 20 per request, 24 h cached, indexed by oracle name and shared through one provider per surface; `/cards/collection` has no language parameter, so it could not serve). Card names stay English in search, storage, import and export — a translated name written into `DeckCard` rows would denormalise a translation into every deck holding the card

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
- [x] **Ikoria Companion (sideboard slot)** _(done — #283)_: dedicated companion zone (not the same as Sideboard pile), **Companion** search mode (`keyword:companion`), rule summaries + warnings (Lurrus / Gyruda / color / Lutri), bracket + `validateDeck` integration — full design & rules notes in [`docs/product/companion-implementation.md`](./companion-implementation.md)

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
- [x] **Text-only proxy sheets** _(already shipped)_: `includeCardArt: false` in `src/lib/deck/proxy.ts` renders art-free card boxes with name, mana cost, type line, oracle text and P/T; covered by unit and e2e tests. _(If the intent was a literal plain-text list rather than art-free card boxes, that is a separate render mode and still open.)_
- [x] **Richer export formats** _(done — 2026-08-19, #467)_: MTGGoldfish (main deck, blank line, commander as the sideboard slot — the MTGO convention their import reads as the command zone), EDHRec deck-check list (command zone first, no marker syntax), and category tags on the Archidekt export (`[Commander{top}]` pins the command zone) so the categorisation survives the round trip

---

## Statistics

- [x] **Deck statistics** _(done)_: mana curve, colour distribution (0.5 pip hybrid), category breakdown, average CMC excluding lands, Game Changers, price and budget checks, theme detection

> **Correction (2026-08-16).** This entry previously claimed _turn 1 playability_, a _mana alignment panel with warnings_ and _per-color land recommendations_ as done. **No code implemented any of the three.** They were reopened below, then built the same day.

- [x] **Turn 1 playability** _(done — PR #412)_: exact hypergeometric odds that the opening seven holds a land and a one-drop, plus a stricter per-colour read requiring a matching source. Computed by inclusion–exclusion rather than sampled, so the figures do not wobble between visits. The two figures are never summed: one hand can satisfy two colours at once, and a hybrid one-drop counts for each colour that casts it
- [x] **Mana alignment panel** _(done — PR #410)_: pips the spells ask for against sources the lands produce, flagged past 15 points of deviation. Scryfall's `produced_mana` is stored nowhere in this codebase, so land production is derived from printed text — subtypes after the em dash, then the land's own "Add …" clauses, then colour identity
- [x] **Per-colour land recommendations** _(done — PR #410)_: each colour's suggested source count, proportional to its share of pips. Same panel as the alignment read — they share the pip distribution, so splitting them would have computed it twice

---

## Playtesting

- [x] **Hand draw & goldfishing** _(done)_: Fisher-Yates shuffle, London mulligan rules, fullscreen modal, fan hand display, library counter
- [x] **Enhanced Playtest Mode** _(done — PR #394)_: turn phases (Untap → End), life tracking with history and 10-step undo, battlefield / graveyard / exile zones with tap and counters, London mulligan, starting life from `FormatConfig`. The engine, store and five zone components already existed and were unit-tested — nothing outside their own tests imported them, and the modal still ran a hand-only hook
- [x] **Playtest session analytics** _(done — PRs #418, #421)_: `PlaytestSession` model, route, recording bar and history panel. `analytics.ts` had held win rate, mulligan distribution, matchup splits and daily trend since US-AG Phase 1, written and tested but reachable from nothing. The result is **user-declared**: the playtest is a solitaire goldfish with no opponent, so turns and mulligans come off the engine but only the player can say how a run went — and skipping records nothing, since an abandoned run is not a loss. Records are private to the account, not the deck
- [x] **Difficulty on recorded sessions** _(done — #425)_: the recording bar asks for opponent strength (`budget` / `mid-range` / `cedh`, "not saying" allowed) and the matchup breakdown shows the split. This entry survived one roadmap review after the feature shipped — verified against the code on 2026-08-19

---

## Formats

- [x] **Multiple format support** _(done — PR #299)_: 9 formats (Commander, Brawl, Oathbreaker, Standard, Pioneer, Modern, Legacy, Vintage, Pauper) with centralized `FORMAT_CONFIG`, format-aware search queries, banlists, validation (deck size, singleton, max copies), and conditional bracket scoring
- [x] **Format-specific statistics** _(done — PR #395)_: curve, threat density and interaction ratio per format, benchmarked against bands in `FORMAT_CONFIG`. Ratios are taken against non-land cards so a 60-card and a 100-card list are comparable. Also fixed two Commander assumptions leaking into other formats: the card count read `60/100`, and bracket targets were labelled "target for B3" in formats that have no brackets. **The bands are heuristic starting points, not tournament data** — tune them as evidence arrives

---

## User Accounts & Auth

- [x] **User account system** _(done)_: NextAuth.js v5 with Google OAuth + credentials, public profiles, deck ownership, private/public decks
- [ ] **Evaluate Better-Auth**: simpler DX than Clerk; future replacement/complement consideration

---

## Community

- [x] **Ratings, reviews and follows** _(done — PR #389)_: 1–5 stars with written reviews, quality badges, directed user follows
- [x] **Community deck discovery** _(done — PR #396)_: public `/commanders/[slug]/decks`, up/down votes, "Community Favourite" badge. Before this **nothing listed public decks at all** — `/api/decks` never filtered on `isPublic`, so a shared deck was reachable only by its direct link. Votes are deliberately separate from stars: stars answer "how good is this deck", a vote answers "should this deck rank near the top", and only the vote score orders the listing
- [x] **Integration in Meta panel** _(done — PR #396)_: the panel links through to the commander's community decks
- [x] **Deck comments** _(done — 2026-08-19, #459 API, #460 UI)_: threaded stream on the public deck page. `parentId` self-relation with database-level cascade; GET is anonymous-readable, the deck owner may post (unlike rating and voting — a stream where the author cannot answer questions is half a conversation) and may delete any comment as the minimal moderation surface. The API resolves `isDeckOwner` and `isAuthor` per comment; the raw `userId` never leaves it. Orphaned replies are promoted to top level rather than dropped
- [x] **Denormalise the commander on `Deck`** _(done — 2026-08-19, #465)_: `Deck.commanderName`, written wherever `commanderId` is written and backfilled from the `isCommander` card in the repository's first data migration. The slug stays derived, never stored — `commanderToSlug` is shared with the EDHRec URL builder, so a stored slug could silently desync; the discovery route matches it in SQL via an expression index instead of fetching every public deck and slugging in memory

---

## UI / UX

- [x] **Footer layout** _(done)_: Shortcuts button aligned inline with copyright
- [x] **Mobile-responsive layout** _(done)_: hamburger menu, tab navigation, responsive grid
- [x] **3D Spellbook landing page** _(done — PR #300)_: Three.js/R3F immersive scene for unauthenticated visitors; procedural book on altar, glowing glyphs, mana particles, cinematic camera zoom, bloom/vignette; mobile/a11y static fallback
- [x] **Collection tracking enhancements** _(done — PR #290)_: basic lands owned by default, mark all/reset buttons, quick-add from search, full collection CSV/text export
- [ ] **Visual redesign**: modernize interface, improve card hover interactions, enhance drag-and-drop UX

---

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing

---

## Tournament Decks & Meta Analysis

### URL Import Sources (✅ all complete)

- [x] **MTGTop8**, **MTGDecks.net**, **Moxfield**, **Archidekt**, **TappedOut** _(done — #204; Archidekt zones and partner commanders fixed in #462, live-contract `@external` e2e added in #463)_
- [x] **EDHRec** _(meta panel done — #205)_
- [ ] **Goldfish** (`https://mtggoldfish.com`) — **blocked (checked 2026-08-19)**: the deck download endpoint sits behind a Cloudflare managed JS challenge, so the server-side `httpGet` the other parsers use receives the "Just a moment…" page, not the decklist. Shipping the parser would ship a source that fails in production. Revisit only if Goldfish exposes an API or drops the challenge

### Implementation (✅ all complete)

- [x] "Import from URL" with auto-detection and parser per domain (#204)
- [x] Rate-limited requests (10/min/IP), respects `robots.txt`
- [x] "Tournament Deck" badge on imported decks
- [x] Commander meta panel — top 20 EDHRec cards + 5 latest tournament decks _(#205)_
- [x] **Event context from tournament sources** _(done — 2026-08-20, #487)_: player, event, ISO date, placement and event level (1–4 stars) on every MTGTop8 row, plus the source's format label — its EDH section is overwhelmingly **Duel Commander (1v1)**, so the label is shown rather than assumed. This also fixed the source: since #205 it had matched **nothing**, its regex expecting quoted `/event?e=…&d=…` links on the format listing, which lists events. The panel read "no tournament decks" for every commander. Searching is now by commander archetype (`archetype_sel[EDH]` id from the search form, cached 24 h) with a card-content fallback, and the site's Latin-1 is decoded. An `@external` spec guards the markup
- [ ] Show **win rate** from tournament sources — **not available**: MTGTop8 publishes standings, not match records, so a rate cannot be derived from a deck page. Would need a different source (Melee, EDHTop16) or nothing at all
- [ ] Track meta shifts over time (future)
