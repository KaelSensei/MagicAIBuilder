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

Top candidates right now (reviewed 2026-08-23):

- ~~**Thirty transitive npm advisories, recorded as needing Next 16 / Prisma 7**~~ _(fixed — 2026-08-23, #552 and #554)_: **the precondition was never tested.** `pnpm.overrides` reaches a transitive dependency whatever pins it — fifteen entries took `pnpm audit` from **31 to 1**, production clean at every level including `--audit-level=low`, and the CI gate now blocks at `high`. One advisory stays open because it has **no published fix**: `extract-zip`, dev-only, under `@lhci/cli`
- ~~**Two limiters that enforced nothing**~~ _(fixed — 2026-08-23, #553)_: `rate-limit.ts` shared one store between 15-minute and 60-second callers and pruned on the **caller's** window, so any unrelated 60-second request evicted the login and signup counters — the brute-force budget was effectively two minutes rather than fifteen. And `scryfall/client.ts` chained off its "async mutex" without ever assigning the chain back, so concurrent callers all found the same resolved promise and fired together. **Both files documented the behaviour they lacked**
- ~~**Dates rendered in the platform locale, not the reader's**~~ _(fixed — 2026-08-23, #558)_: eight components used `toLocaleDateString()`; the public profile hardcoded `"en-US"`, so a French page read "August 2026". The rest are `"use client"` components that Next still server-renders, so each date was formatted once in the server's locale and again in the browser's. **Currency has the same split and is left open** — twelve sites hardcode a dollar sign with `toFixed(2)` against three using `format.number`, but the prices really are USD
- ~~**Dependabot opened its first PR against `main` and failed the Sonar gate**~~ _(fixed — 2026-08-23, #562)_: enabling the `github-actions` ecosystem surfaced both within the hour. It targeted the default branch, exempting the bot from `staging` → `dev` → `main`; and **GitHub withholds repository secrets from Dependabot PRs**, so `SONAR_TOKEN` arrived empty and the guard meant to catch a missing secret fired on a case that is not a misconfiguration
- ~~**Track meta shifts over time**~~ _(done — 2026-08-22, #528)_: the mechanism was that `MetaCache` **overwrote** its single row per commander on every refresh, so no earlier distribution survived to be differenced. Retention was the whole feature; the differencing was the easy half. The 20-card truncation forced the interesting decision — a card that leaves the list carries a **bound**, never a fall to zero
- ~~**Public external API**~~ _(done — 2026-08-22, #529)_: all four named requirements. **Built in this repository rather than the "likely separate" one the entry imagined — that split is still an open decision.** `collection:read` shipped gating nothing for two commits, which is now guarded by a test asserting no scope is decorative
- ~~**Evaluate Better-Auth**~~ _(evaluated — 2026-08-22, #531)_: **do not migrate; revisit after Next.js 16.** Decided by Better-Auth's own docs calling its Next 15 middleware pattern _"NOT SECURE"_, against a middleware here that verifies a JWT signature on the Edge
- ~~**The four open SonarCloud issues**~~ _(fixed — 2026-08-22, #530)_: they sat on `staging` outside any feature branch, so **every PR inherited a mandatory gate it could not satisfy**. Two of the four tool suggestions were wrong for this codebase — `structuredClone` would have been a regression, and `.includes()` does not typecheck against a `readonly` tuple
- ~~**The e2e gate keyed on a variable nothing sets**~~ _(fixed — 2026-08-22, #535)_: `playwright.config.ts` read `forbidOnly`, `retries` and `workers` off `process.env.CI`, which is set **nowhere** — not in the e2e container, and no workflow runs Playwright at all. So `forbidOnly` was never enforced and a stray `test.only` could have narrowed the blocking gate to a single test while still reporting green. **Fourth silent-green shape in this repository.** The suite now runs serially, which turned out to be the flake fix rather than padding: each test took 8–13 s under parallel load against ~2.5 s alone
- ~~**`useApiKeys` had no tests**~~ _(fixed — 2026-08-22, #534)_: 0% of 88 statements on the hook that mints and revokes credentials. Coverage 93.69% → **94.89%**
- ~~**Five open SonarCloud issues from the previous batch**~~ _(fixed — 2026-08-22, #536)_: the second batch in a row to leave the mandatory "open issues = 0" gate unsatisfiable for the next PR. One tool suggestion was again wrong to apply literally — the optional chain Sonar wanted would have destroyed the type narrowing the rest of the function depends on
- **Upgrade to Prisma 7** — Weight **3**, **blocked on the local toolchain**: needs Node ≥ 22.12, this workstation is on 22.11. Attempted and reverted rather than pushed unverified
- **UptimeRobot** — Weight **4** (early production safety net, now that a database exists again)
- ~~**Finish i18n string extraction**~~ _(done — 2026-08-20, #497 and #498)_. **Correction: this was marked done at #455 on 2026-08-19 and was not.** The builder page — the app's main screen — never called `useTranslations` at all, and `ui/Modal` and `ui/Toast` shipped English Close / Dismiss labels shared by every modal and every toast in the app. Fifteen hardcoded accessible attributes remained across nine components. The gap survived a review because nothing fails when a string is hardcoded: it renders, in English, silently. `src/i18n/catalog.test.ts` now guards the catalogs, but **no test can see a string that was never extracted** — the remaining defence is the grep in #498's description
- ~~**Diagnose the intermittent e2e failure**~~ _(diagnosed and mitigated — 2026-08-20, #495)_: the mechanism was in the **harness**, not the app. `openBuilder` returned the moment `waitForURL` saw the address change, before the route was usable, so a click could land while React was mid-hydration — the listener has attached and calls `preventDefault`, but the router cannot act yet, and the navigation is simply lost. Load-sensitive by construction, which is why hypothesis 3 kept half-fitting: compile timing was a _trigger_, never the mechanism. Still **not a captured failure**. The production-build question is no longer blocking
  - **2026-08-22 (#535): the load was mostly the suite's own.** Every recurrence had been blamed on a busy host, and the standing advice was to avoid other Docker builds during the gate — advice that only ever addressed **external** load. Under full parallelism each test took 8–13 s against ~2.5 s serially, a fourfold self-inflicted inflation. The gate is now serial. Whether that closes the flake is unknown until a stretch of green runs says so; it has never been reproducible on demand
- ~~**Localized card data via Scryfall `lang`**~~ _(done — 2026-08-20, #480 deck rows, #481 tooltip, #482 playtest zones, #484 proxies, on top of #415 / #456)_
- ~~**Lighthouse CI**~~ _(done — 2026-08-21, #514)_: performance, accessibility, best practices and SEO all assert as errors at 0.9 on every PR. A GitHub runner scores within one point of a workstation, so the desktop preset does normalise the hardware
- ~~**Canonical and hreflang**~~ _(done — 2026-08-21, #517)_. **Correction: the SEO entry has claimed a canonical URL since 2026-03-26 and there was none** — `canonical`, `alternates` and `metadataBase` appeared nowhere in `src`. The third instance of a roadmap line describing code that did not exist
- ~~**No gate ran on the PRs that carry the change**~~ _(fixed — 2026-08-21, #515)_: `ci.yml` and `sonar.yml` were scoped to `branches: [main]` while every feature PR targets `staging`, so nothing was linted, typechecked, tested or analysed until the promotion. Found because Lighthouse was the only check present on #514
- ~~**Split `--accent` into a background token and a text token**~~ _(done — 2026-08-21, #519)_: the requirements had no overlap — white-on-accent needs `L <= 0.183`, accent-on-surface needs `L >= 0.195` — so a second token was the only way. 91 call sites swept across 46 files, each token moved by the **minimum** that crosses 4.5:1 with hue and saturation untouched (`--accent` shifted 0.2% in lightness). Accessibility is now **100 on all three audited pages with no failing audits**, and the a11y, best-practices and SEO ratchets rose from 0.9 to 0.95.
  - **Two defects surfaced that were not on this list.** `--accent-hover` was **2.98:1** under white text in the dark theme — hovering an accent button made its own label harder to read, and no audit can see it because Lighthouse measures the page as rendered, never a hover state. And light `--text-secondary` was 4.28:1 on `--surface-hover`; the first solve targeted `#ffffff`, passed at 5.04 and was wrong, because light-theme text is bound by the **darkest** surface. Same mistake as the `--surface` case in #516, in mirror image
  - **The Lighthouse harness was under-reporting.** `NEXT_PUBLIC_BASE_URL` was unset, so `siteUrl()` fell back to the production domain while the page was served from localhost: every canonical pointed off-origin and SEO read 92 instead of 100. It cleared the 0.9 gate, so nothing complained — and that standing failure would have hidden a real canonical defect behind it
- ~~**Put the public pages in the sitemap**~~ _(done — 2026-08-21, #521)_. **What the fix actually found was the opposite problem.** The sitemap published every `shareEnabled` deck's `/share/<token>` URL — a capability URL. The sharing dialog promises "anyone with this link can view your deck", a promise about who _receives_ the link, and `/api/share/[token]` checks `shareEnabled` and never `isPublic`, so a deck the owner kept private is fully readable at its token. Listing those tokens turned "anyone with this link" into "anyone at all", for decks never marked public — while `isPublic` sits in the same model precisely to mark the ones that were. Live since #153. `robots.ts` carried a matching `allow: "/share/"`; both are gone
  - The pages that _should_ have been listed — public decks, public profiles, commander discovery — now are, each with an hreflang alternate per served locale so the sitemap cannot disagree with the page tags. The bare `catch {}` reports through `logger.error` instead of yielding a one-URL sitemap, and the two `as` casts on `prisma.deck` are gone
  - `buildSitemap` is a pure function; its first test asserts no share token appears whatever it is handed. Nothing about the leak was visible from the sitemap itself, which is why it stood five months
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
- **Current**: Prisma 6.x + Neon Postgres (prod), Docker Postgres 16 on 5432 (dev).
- [ ] **Upgrade to Prisma 7** — **blocked on the local toolchain (checked 2026-08-22)**: `prisma@7.9.1` declares `engines: { node: "^20.19 || ^22.12 || >=24.0" }` and this workstation runs Node 22.11, one version below where Node accepts `require()` of an ESM module. The symptom misleads — `ERR_REQUIRE_ESM` inside `@prisma/dev/dist/state.cjs`, and **`"type": "module"` does not fix it**, because the offending file is Prisma's, not this project's. `prisma generate` fails, so nothing downstream can be verified. Attempted and reverted rather than pushed unverified. CI is already fine (`node-version: 22` resolves to the latest 22.x).
  - Roughly half an hour once Node is current: generator `prisma-client` with a required `output`, a `prisma.config.ts` holding the URL (with the `DATABASE_URL_UNPOOLED` fallback Neon migrations need), `"type": "module"`, and only **three** files importing `@prisma/client`.
  - **One documented contradiction to settle at runtime**: the v7 upgrade guide calls driver adapters _"required for all databases"_, while the config reference says they _"work automatically without additional configuration"_. Observe the behaviour; do not infer it.

### Authentication

- [x] **NextAuth.js v5** _(done — 2026-03-27)_: Google OAuth + credentials auth already implemented.
- [x] **Evaluate Better-Auth** _(evaluated — 2026-08-22, #531; **recommendation: do not migrate, revisit after Next.js 16**)_. Full write-up in [`docs/references/better-auth-evaluation.md`](../references/better-auth-evaluation.md). Better-Auth's own docs call its Next 13–15.1.x middleware pattern _"NOT SECURE"_ — the recommended helper checks only that a cookie exists, and database validation in middleware arrives with Next 16. This app is on 15.5.23, `middleware.ts` is the only guard in front of every protected page, and the current check verifies a JWT signature on the Edge. Clerk stays ruled out.

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

- [x] **Public external API** _(done — 2026-08-22, #529)_: all four named requirements shipped — Bearer API keys, per-key rate limiting, a drift-guarded OpenAPI document at `GET /api/v1/openapi`, and `/api/v1` as the versioning boundary. Endpoints: `/decks`, `/decks/:id`, `/collection`; key management sits behind the browser session with a `/settings/api-keys` screen.
  - **Built in this repository, not a separate one.** The entry said "likely in a separate repository"; `/api/v1` is additive and extractable, but the split is an **open decision**, not a settled one.
  - Only the SHA-256 of a token is stored, and that hash is the unique index, so verification is one indexed read. **SHA-256 and not bcrypt on purpose** — a slow hash makes guessing a _low-entropy_ secret expensive, and a 256-bit random token is not that; bcrypt would only tax every request.
  - **Scopes exist from the first key**, though everything is read-only today: without them, the first write endpoint would silently widen every key already in the wild. **A key cannot mint another key** — otherwise one leak becomes permanent access that revocation can never catch. Revocation stamps `revokedAt` rather than deleting, because the revoked key is exactly the one whose history matters.
  - **`collection:read` gated nothing for two commits.** An advertised permission with no meaning invites a caller to request the narrowest scope that fits and then fail for reasons the docs deny. A test now asserts no scope is decorative.
  - The spec is hand-written because nothing here can derive one from an App Router handler. **The drift guard earned its keep**: `/collection` was written first and `openapi.test.ts` failed with `documents /collection` before a line of spec was touched.

---

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center
- [x] **Health check endpoint** _(done)_: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [x] **Error reporting wired end to end** _(done — PR #392)_: `src/instrumentation.ts` with `register()` + `onRequestError`, `instrumentation-client.ts` replacing the deprecated root config, `logger.error` forwarding to `Sentry.captureException`, and `error.tsx` / `global-error.tsx` boundaries. Before this, **no server-side error reached Sentry at all** — the routes catch into a JSON 500, so automatic instrumentation never saw them
- [ ] **UptimeRobot** (once deployed): monitor `https://<your-domain>/api/health` every 5 minutes with email/Discord alerts — free plan includes 50 monitors
- [x] **Bundle analyzer** (`@next/bundle-analyzer`) _(already in place)_: wired in `next.config.ts`, run with `pnpm analyze`
- [x] **Dependabot** (GitHub native) _(extended — 2026-08-23, #554 and #562)_: `.github/dependabot.yml`, weekly, **two ecosystems** — npm (two groups, majors ignored) and `github-actions` (one group, **majors not ignored**, since an action major is usually a runner bump that CI settles in a one-line diff). Both set `target-branch: staging` so the bot follows the same promotion flow as everyone else. Before this it watched npm only, which is why the Sonar job had been _warning_ about a deprecated Node 20 runtime rather than being offered the upgrade

### Level 2: When you have real users

- [x] **Vercel Analytics** _(already in place — verified against the code 2026-08-21)_: `@vercel/speed-insights@2` is a dependency, `<SpeedInsights />` is mounted in `src/app/[locale]/layout.tsx`, and `security-headers.ts` whitelists its script in the CSP. It reports exactly the metrics this entry describes — LCP, CLS, INP per page and device. **This entry was open while the feature shipped**, the mirror image of the three 2026-08-16 corrections: those claimed done with no implementing code, this had the code and no tick. Found while auditing the roadmap for #514, not by anything failing

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions -> UX problem"); free up to 1M events/month — **recommended second: understand how people actually use the tool**

- [ ] **Plausible**: simple, privacy-friendly traffic analytics (GDPR compliant, no cookies); good alternative to PostHog if you only need page views and referrers, not event tracking

- [ ] **LogRocket**: session replay — watch exactly what users did before an error occurred; useful for understanding UX issues in the deck builder; free tier available

- [x] **Lighthouse CI** _(done — 2026-08-21, #514)_: `lhci autorun` builds the app, serves it with `next start` and audits `/`, `/fr` and `/auth/signin` — median of three runs, desktop preset, no database (every audited URL is public and the session strategy is JWT, so an anonymous visit issues no query). Performance, accessibility, best practices and SEO all assert as **errors** at 0.9; the runner scores 98/98/97 against a workstation's 97/97/98, and the spread across three runs on one URL is a single point, so the preset's simulated throttling normalises the hardware well enough to gate on.
  - **The audited URLs were not deterministic at first.** next-intl negotiates the locale from `Accept-Language`, so on a French Chrome `/` redirected to `/fr` and `/auth/signin` to `/fr/auth/signin` — three requested URLs collapsed into two audited pages and English was never measured. `extraHeaders` pins it.
  - **The first CI run was green with an empty artifact** (#514, second commit). `.lighthouseci` is a dot-directory, `actions/upload-artifact@v4` skips hidden files by default, and `if-no-files-found` defaults to `warn`: nine reports written, none uploaded, silently. The same shape as the three silent-read failures already catalogued. Now `include-hidden-files: true` **and** `if-no-files-found: error`

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

- [x] **SEO optimization** _(done — 2026-03-26, #153)_: `robots.txt` (blocks private routes), dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card), JSON-LD `SoftwareApplication` structured data, dynamic Open Graph image via `/api/og` edge route

  > **Correction (2026-08-21).** This entry claimed a **canonical URL** since 2026-03-26. `canonical`, `alternates` and `metadataBase` appeared nowhere in `src` — the string was in the roadmap and not in the code. Built in #517.

- [x] **Canonical and hreflang on the public pages** _(done — 2026-08-21, #517)_: self-referential canonical per locale plus one `hreflang` per served locale and an `x-default`, on the landing page, public decks, public profiles and commander deck discovery. English is served at the root and French behind `/fr`, so the same page has two addresses and nothing told a crawler they were one page in two languages.
  - **Deliberately not set on the locale layout.** Layout metadata is inherited by every page that does not override it, so a canonical there would declare every deck, profile and commander page to be the homepage — worse than declaring nothing, and the obvious way to write this change. Only `metadataBase` is global, because it is a base URL and not an instruction.
  - `siteUrl()` reads `NEXT_PUBLIC_BASE_URL`, the variable `robots.ts` and `sitemap.ts` already use. A canonical disagreeing with the sitemap hands a crawler two answers for one page.
  - Dormant locales are excluded: advertising a language the middleware does not route sends a crawler to a redirect or a 404.
  - **Remaining**: `sitemap.ts` lists only `/` and `/share/<token>`, so public decks, profiles and commander pages are indexed by canonical but absent from the sitemap; it also swallows a Prisma failure in a bare `catch {}`, which produces a one-URL sitemap that looks intentional

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
- [x] **Evaluate Better-Auth** _(evaluated — 2026-08-22, #531)_: **do not migrate; revisit after Next.js 16.** Only two-factor and passkeys are things it offers that this project lacks, and neither is on this roadmap. Migrating would also mean a hand-written data migration preserving every `User.id`, since eleven tables of application data point at them. See [`docs/references/better-auth-evaluation.md`](../references/better-auth-evaluation.md) for the three conditions that would reopen it.

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
- [x] **Track meta shifts over time** _(done — 2026-08-22, #528)_: `MetaCache` held one row per commander and overwrote it on every refresh, so yesterday's distribution was destroyed the moment today's arrived — nothing in the database could answer _what moved_. `MetaSnapshot` retains one row per commander per day, written from the EDHRec fetch the meta route already performs: no cron, no crawl, no extra upstream request, and the history accrues from ordinary traffic.
  - **The 20-card truncation governs the design.** A card absent from a snapshot is not at 0% inclusion — it is below that snapshot's cut-off, at a value nobody recorded. Reporting a drop-out as a fall from 78% to zero would invent a collapse out of a ranking change, so entering and leaving carry a **bound** (`≥` / `≤`) rather than a delta.
  - **An empty result is never recorded**: `fetchEdhrecData` returns `{ cards: [] }` for both an unknown commander and an upstream 404, and storing it would render an outage as a meta collapse.
  - EDHRec only — the tournament feed is a rolling window of five events, not a distribution.
