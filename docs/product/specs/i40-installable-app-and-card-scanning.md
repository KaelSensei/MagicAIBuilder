# I-40: Installable App, Phone-First Use And Card Scanning

> **Status:** Proposed · **Priority:** Later, with a no-regret first part (installability and phone journeys, slices 1 to 5) that can ship now · **Written 2026-11-09**
> **Research:** dated notes on store apps, player reviews, web-app platforms, store rules and card recognition. They are not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** the web app manifest and icons, installed-mode presentation (theme colour, safe areas, launch page, install help), the phone-journey test harness, the distribution decision (web app, store wrapper or native), and camera scanning as a source of staged collection rows. **Does not own:** the service worker and the offline deck cache ([I-19](i19-offline-game-night-viewing.md)); the mobile editing toolbar and its labels ([I-37](i37-editor-depth.md)); printing-level ownership ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)); the staged import, its commit and its provenance ([I-26](i26-collections-arriving-from-elsewhere.md)); plans, prices and billing ([I-30](i30-business-model-and-paid-tier.md)); visual thresholds ([I-13](i13-visual-direction.md)); local model inference ([I-12](../roadmap.md#i-12-local-ai)).
> **Touches a non-goal:** the roadmap excludes camera scanning, and the [2027 sweep](README.md#what-the-sweep-ruled-out-for-2027) says it "stays a non-goal". This spec keeps that in force until the gates in requirement 6 pass and the owner decides.

## Overview

Players build and check decks on their phones: at the table before a game, at the store while buying singles. They also want to scan cards into a collection instead of typing them. Today the product is a responsive website with no manifest, no home-screen icon, no phone-sized tests, and a security header that blocks the camera on every page. The repository's [`CLAUDE.md`](../../../CLAUDE.md) states that "Mobile QA currently means responsive web viewport checks; there is no native mobile/TestFlight build yet."

The research supports a split decision. Installing as a web app is cheap and needs no app store: Safari 26 opens every home-screen site as a web app with "zero requirements for 'installability'" [15], and Chrome needs a manifest but lists no service worker [18]. That part is no-regret and comes first. Scanning is different. The market leader's own reviews are dominated by scanning complaints [13], recognition at printing level is the hard problem, and the product has no printing-level ownership yet (I-06). Scanning therefore stays behind a measured benchmark, a written answer from Scryfall and the owner's decision.

## What the market does

Ratings were read on 2026-11-09 from the US App Store (iTunes Search and Lookup API) and Google Play.

| Product                             | Where                                                                     | Rating (count)                                                     | Scanning                                                                                                                                   | Paid around scanning                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **ManaBox** [1][2][3]               | iOS, Android; offline card search                                         | iOS 4.6 (1,748); Play 4.3 (9,980), 1M+ downloads                   | "Scan cards with the camera"; in the release notes, the only scanner item marked PRO is "collection data for scanned cards in the scanner" | PRO 2.49 USD a month or 22.99 a year, sold only through the app stores                                                       |
| **MTG Scanner – Dragon Shield** [4] | iOS, Android                                                              | iOS 4.6 (3,753)                                                    | "Instantly scan cards in any language"; a 2022 developer reply says the scanner "works only with the art"; a "Pro Scanner" in version 8    | Tiers from 1.99 to 3.99 USD a month and 29.99 to 39.99 a year; reviewers who paid report bulk scan as a premium feature [13] |
| **TCGplayer** [5][12]               | iOS, Android; marketplace app                                             | iOS 4.3 (18,618); Play 4.4 (14,448), 1M+                           | "Blazingly Fast Card Scanning", free. Its seller-side Roca Vision claims "over 98%" accuracy on "over 1 billion cards" (2026-07-28)        | Seller Live Scan is exclusive to TCGplayer Pro                                                                               |
| **Delver Lens** [6]                 | Android; an iOS listing has no US ratings                                 | Play 3.7 (1,882), 100K+                                            | "Recognition scans the full card"; advises a blank background and no glare                                                                 | In-app purchases listed                                                                                                      |
| **DeckCheck** [7][9]                | Web only, installable: its manifest says "Download the DeckCheck app"     | No store app found                                                 | "Add physical cards to your collection with your camera"; with no store app, this runs in the web app (our inference)                      | Subscribers get "a higher card-scan limit"                                                                                   |
| **Deckbox** [10]                    | Web, plus a scanner app; the iPhone app "is waiting for App Store review" | —                                                                  | "Scan cards with your phone and find them in your collection on the web"                                                                   | Premium (3.99 USD a month yearly, 5.99 monthly) adds "unlimited mobile scanner additions"; "Your collection stays free"      |
| **Scrytics** [11]                   | iOS                                                                       | —                                                                  | "Runs entirely on-device", "identifies any Magic card in under a second" (vendor claim, no accuracy figure)                                | Not stated on the scanner page                                                                                               |
| **Archidekt** [7][8]                | Web only                                                                  | No store app found                                                 | None found                                                                                                                                 | — ; serves a manifest (`display: standalone`, icons up to 512 px) and `/service-worker.js`, so it installs as a web app      |
| **Moxfield**, **Cardmarket** [7]    | Web                                                                       | No store app found (Moxfield: US store; Cardmarket: US, FR and DE) | None found. The "CardMarket" iOS listing comes from an unrelated publisher                                                                 | Moxfield answered HTTP 403, so its manifest could not be checked                                                             |

**What players say.** Reddit refused every automated request on 2026-11-09, so no thread was read; the only Reddit evidence in this repository is the Moxfield mobile-ads thread that I-30 already cites. Store reviews were read instead, from the 250 most recent US App Store reviews per app [13]. This is our own count, by keyword, not a survey:

| App           | Window                   | Reviews mentioning "scan" | Reviews at 3 stars or fewer | …of which mention scanning | …of which mention paying |
| ------------- | ------------------------ | ------------------------- | --------------------------- | -------------------------- | ------------------------ |
| ManaBox       | 2024-11-13 to 2026-11-06 | 109                       | 82                          | 57                         | 9                        |
| Dragon Shield | 2020-07-08 to 2026-09-16 | 139                       | 161                         | 88                         | 47                       |
| TCGplayer     | 2026-07-20 to 2026-11-07 | 75                        | 121                         | 47                         | 2                        |

The complaints repeat: sleeved and foil cards ("Sleeved? Don't even think about it", 2025-11-05), the wrong set or printing ("not the correct set", 2026-10-18), and slow confirmation ("At least four clicks to add a single card… Choosing the version every time is exhausting", 2026-10-27). Scanning is not a solved problem that one app owns; it is the main source of dissatisfaction in all three.

**Is scanning free?** Mostly yes at the single-card level: ManaBox and TCGplayer scan free [1][5]. What is sold is quantity or speed: Deckbox sells unlimited scanner additions, DeckCheck a higher scan limit, and Dragon Shield users report bulk scan behind premium [9][10][13].

**Platform options for a Next.js 15 app**, read 2026-11-09:

| Option                    | Install and reach                                                                                                                                                    | Camera, push, storage                                                                                                                                                                                                                                                                      | Fees and review                                                                                                                                                                                        | Fit with this codebase                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Installable web app**   | iOS 26: "every website added to the Home Screen opens as a web app", manifest optional [15]. Chrome: manifest with 192 and 512 px icons, `start_url`, `display` [18] | `getUserMedia` is Baseline since September 2017, secure contexts only, gated by Permissions-Policy `camera` [21]. Web Push on iOS 16.4+ only once installed [14]. With tracking prevention on, Safari deletes script-written data after seven days of browser use without interaction [20] | None from a store. Billing stays with I-30's provider                                                                                                                                                  | Works with the server as it is. Next.js documents `app/manifest.ts` and says install prompts need no offline support [22]                                                                                                                |
| **Android wrapper (TWA)** | Play Store listing that renders the live site in the user's browser; app and site verified through Digital Asset Links [25]                                          | As the web app, in Chrome                                                                                                                                                                                                                                                                  | Play: auto-renewing subscriptions 10% plus a 5% billing fee in the US, EEA and UK since 2026-06-30 [30]                                                                                                | Same codebase; Android only                                                                                                                                                                                                              |
| **Capacitor shell**       | iOS and Android stores                                                                                                                                               | Native plugins                                                                                                                                                                                                                                                                             | Apple: an app must "elevate it beyond a repackaged website" (4.2) and must use in-app purchase to unlock features (3.1.1), except link-outs on the US storefront [26]. Small Business Program 15% [27] | Needs bundled assets with an `index.html`; loading the live site with `server.url` "is not intended for use in production" [24]. A static export drops route handlers that read the request, middleware, headers and server actions [23] |
| **Native app**            | Stores                                                                                                                                                               | Full camera control                                                                                                                                                                                                                                                                        | As Capacitor                                                                                                                                                                                           | A second codebase. I-13 excludes it                                                                                                                                                                                                      |

Three points sharpen the table. **The EU episode:** Apple planned to drop home-screen web apps in the EU with iOS 17.4, then said on 2024-03-01 it would "continue to offer the existing Home Screen web apps capability", built "directly on WebKit" [16]. As of 2026-01-05, no browser vendor had shipped its own engine on iOS in the EU, and the UK CMA had recommended letting other browsers install web apps with their own engines [17]. The capability survived, but a platform owner has tried once to withdraw it. **Store terms move:** in the EU, Apple's terms changed again on 2026-08-18, effective 2026-10-01, with in-app purchase at 26% standard or 15% for most developers, and link-outs at 15% or 10% [28]. In the US, link-outs are allowed, and after the Ninth Circuit's December 2025 ruling the commission on them awaits the district court, with Apple petitioning the Supreme Court [29]. **Storage:** a home-screen web app gets the browser's quota, up to about 60% of disk [19], but nothing found exempts it from eviction [20].

**Recognition in the browser.** No published accuracy figure for a browser-based Magic scanner was found. What exists: a perceptual-hash prototype on about 300 Alpha cards with no accuracy numbers, which fails on overlapping cards, hard lighting and imprecise borders [34]; and a Pokémon scanner that runs CLIP in the browser through ONNX Runtime Web (WebAssembly), with a 9.2 MB index for 17,531 cards at 516 bytes each and no accuracy of its own, and that cannot tell variants apart [35]. That paper cites about one second per query for a cloud API. Server-side text detection costs 1.50 USD per 1,000 images after 1,000 free a month [36]. **Estimates:** Scryfall lists 49,318 unique paper artworks and 99,937 paper printings [32], so an index in that format would weigh about 25 MB, or about 3 MB at one bit per dimension. Reading a 20,000-card collection through server OCR once, one call per card after the free 1,000, would cost about 28.50 USD.

**Rules that bind a scanner.** Scryfall offers its data and images free "for the primary purpose of creating additional Magic software"; forbids paywalling its data and requires it to stay reachable anonymously or with a free account; forbids "simply repackag[ing], republish[ing], or proxy[ing]" it; and requires bulk data files for anyone who must "resolve a large number of card images". Its image hosts have no rate limit. Its image rules govern display: no cropping of the copyright or artist, no distortion, no colour shift [31]. None of them says whether a derived recognition index may be built and shipped to browsers. The Wizards Fan Content Policy forbids requiring payments or subscriptions "to access your Fan Content" and does not mention software [33].

## Current state in this codebase

Verified on `dev` (`61792c1`) on 2026-11-09:

- **No manifest and no install icons.** No `manifest.ts`, `manifest.json` or `rel="manifest"` exists. `src/app/[locale]/layout.tsx` sets `icons.icon` and `icons.shortcut` to `/favicon.svg`; `public/` holds `favicon.svg`, `og-image.svg`, `images/` and `textures/`, with no PNG icon and no `apple-touch-icon`. There is no `viewport` export, no `themeColor` and no `appleWebApp`; Next.js 15.5.28 supplies only `width=device-width, initial-scale=1` (`node_modules/next/dist/lib/metadata/default-metadata.js`).
- **Dotted paths skip the middleware.** The matcher in `src/middleware.ts` excludes any path containing a dot, so `/manifest.webmanifest`, icons and a future `/sw.js` reach signed-out visitors without a redirect.
- **No service worker.** Nothing in `src/`, `public/` or `package.json` registers one or depends on Serwist or `next-pwa`. The only offline piece is `src/lib/scryfall/rulings.ts`, which keeps rulings for the 50 most recently viewed cards in `localStorage`.
- **The camera is blocked everywhere.** `src/lib/security-headers.ts` sends `Permissions-Policy: camera=(), microphone=(), geolocation=()` on every route, and `src/lib/security-headers.test.ts` asserts it; `getUserMedia` would fail with `NotAllowedError` [21]. The production CSP allows `worker-src 'self' blob:` but has no `'wasm-unsafe-eval'`, without which a page with a CSP cannot load WebAssembly [37]; development adds `'unsafe-eval'`, so WebAssembly would work locally and fail in production.
- **Mobile editor.** Below `lg`, `src/app/[locale]/builder/[deckId]/page.tsx` (1,212 lines) switches three panels with a bottom tab bar positioned `absolute bottom-0`, labelled "Search", "Deck" and "Stats" in hard-coded English. No file in `src/` uses `env(safe-area-inset-*)`. I-37 slice 7 owns that toolbar and its labels.
- **Collection.** `CollectionCard` (`prisma/schema.prisma`) is unique on `scryfallId`, `foil` and `userId`, with `condition` and no language or provenance. `POST /api/collection` upserts one card; `AddToCollectionDialog` searches by name, one card at a time. There is no batch write and no import (I-26). `/collection` requires sign-in. I-06 still lists "Track the actual owned printing" and "Consider mobile scanning only after the web data model supports printing-level ownership" as open.
- **No phone in the test gates.** Every project in `playwright.config.ts` uses `devices["Desktop Chrome"]`, no E2E spec sets a phone viewport, and `lighthouserc.yml` audits `/`, `/fr` and `/auth/signin` with `preset: desktop`. `docs/engineering/quality-gate.md` limits QA to responsive viewports, and the PR template marks native validation N/A.
- **No camera or recognition code.** No `getUserMedia`, `BarcodeDetector`, OCR or model runtime appears in `src/` or `package.json`.

## Functional requirements

### 1. Installable web app, without a service worker

1.1 A manifest is served at `/manifest.webmanifest` with `name` "MagicAIBuilder", `short_name`, `description`, a stable `id`, `scope` `/`, `display` `standalone`, `start_url`, and `theme_color` and `background_color` taken from the Lumen tokens (I-13).
1.2 Icons: PNG at 192 and 512 px with `purpose: any`, a 512 px maskable icon, and a 180 px `apple-touch-icon`, generated from `favicon.svg`.
1.3 The root layout exports a `viewport` with `themeColor` for light and dark schemes and `viewportFit: "cover"`, and metadata with `appleWebApp` (title and status-bar style).
1.4 The manifest meets every item on Chrome's install list [18] and is reachable without a session. A test guards the middleware matcher so that a later change cannot redirect it.
1.5 Shortcuts open the deck library, a new deck and the collection, with labels in every shipped locale (English and French today).
1.6 No service worker ships with this requirement. The first one is I-19's; push, if ever accepted, extends that worker.
1.7 Installing is never required. Every feature works in a browser tab, so a platform withdrawing web apps, as Apple planned in 2024 [16], removes a convenience and nothing else.

### 2. Installed-mode presentation

2.1 Fixed and absolute bottom bars, including the builder's mobile tab bar, pad by `env(safe-area-inset-bottom)`; the header pads by the top inset in standalone display.
2.2 Standalone display has no browser toolbar, so every journey screen in requirement 3 offers its own way back.
2.3 Links that leave the origin (Scryfall, seller hand-offs from I-32) open outside the app window.
2.4 Google and email sign-in complete in installed mode on iOS and Android, and the session survives a relaunch.
2.5 An install help page, in English and French and linked from settings, explains installation per platform. No automatic banner, no `beforeinstallprompt` prompt (Next.js advises against it [22]) and no hint that returns after dismissal.
2.6 No push notifications and no badges.

### 3. Phone journeys and their gate

3.1 The phone journeys are: open a deck from the library and read it; open a card's rulings; start a playtest; open the shopping list and the acquisition plan; add a card to the collection; sign in; import a pasted list. Each keeps its owning initiative; this requirement only tests them at phone size.
3.2 Playwright gains a mobile WebKit project and a mobile Chromium project that run specs tagged `@phone` at an iPhone-sized and a Pixel-sized profile, inside the Docker gate.
3.3 Lighthouse CI adds a mobile-preset run on the same public URLs. Accessibility and best practices keep their measured baselines; the performance threshold is set from the first mobile measurement.
3.4 `docs/engineering/quality-gate.md` gains a real-device checklist for staging (one iPhone, one Android): install, launch, sign-in, safe areas and every journey in 3.1.
3.5 Controls on the journey screens meet WCAG 2.2 AA target size.

### 4. Distribution decision

4.1 The product ships as an installable web app. No TWA, Capacitor shell or native app is built until the owner records a decision against 4.2.
4.2 Any one of these reopens the decision: the benchmark in 6.2 shows a gap that only native camera control closes; installed use, measured through I-30's metrics, is material and players ask for a store listing; or I-30 settles billing so that store fees and in-app purchase rules are acceptable.
4.3 If a wrapper is chosen, Android comes first as a TWA over the live site. An iOS shell needs features beyond the website (guideline 4.2) and a static-export or native-plugin plan, because `server.url` is not for production [24][26].

### 5. Scanning principles (apply to every scanning slice)

5.1 A scan creates staged rows. It never writes the collection; commit goes through I-26's transaction with provenance "camera scan" and a date.
5.2 Each staged row shows the Oracle card, the proposed printing, finish and language, and a confidence. An uncertain row shows its alternatives and stays unresolved until the player picks. Nothing picks a printing silently.
5.3 Frames are processed on the device. No image leaves it unless the player consents to server help for that batch (8.2). Staged rows hold Scryfall IDs, never photos, and are saved to the server as they are made, so browser eviction [20] or a closed tab loses nothing.
5.4 Card data shown while scanning (name, printing, price, legality) is free, as everywhere else.
5.5 The scanner's help page publishes the latest benchmark: sample size, top-1 accuracy at Oracle and printing level with intervals, and the devices tested.

### 6. Gates before any scanning code enters `src/`

6.1 I-06 printing-level ownership and I-26's staged commit (its slice 3) have shipped.
6.2 A benchmark under `scripts/research/` measures at least two approaches (art embedding; name and collector-line OCR) on a committed set of at least 300 photos of real cards: sleeved, foil, borderless, old frames, black-bordered and non-English. It reports top-1 and top-3 accuracy at Oracle and printing level with Wilson intervals, latency at the 50th and 95th percentiles in Safari on a named iPhone and Chrome on a named Android, and the index download size. Runs are seeded and reproducible.
6.3 Proposed go threshold, for the owner to confirm: Oracle top-1 of at least 95% with an interval lower bound of at least 90%, and 95th-percentile latency of at most 1.5 s per card in both browsers. Below it, scanning stays a non-goal and the result is recorded.
6.4 Scryfall answers in writing whether a recognition index derived from its images may be built and served to browsers, and the question joins the lawyer list in [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate), together with the art's copyright.

### 7. Single-card scanning, free

7.1 A signed-in route, `/[locale]/collection/scan`, opens the rear camera (`facingMode: "environment"` [21]), captures on a button or when the frame is steady, and falls back to the existing name search.
7.2 Only that route sends `Permissions-Policy: camera=(self)` and `'wasm-unsafe-eval'`; every other route keeps `camera=()` and the current script policy.
7.3 The recognition index is built offline from Scryfall's bulk data, as its rules require for large image sets [31], versioned, served from our origin and cached by the browser. Its size is shown before the first download. Each staged row records the index version.
7.4 On-device single scans are free and unlimited. They cost the server nothing, and a cap with no cost behind it would limit how players enter their own collection, close to what [I-30 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line) rules out.

### 8. Bulk mode and server help: paid-tier candidates

8.1 Bulk mode captures a pile continuously, can lock candidates to one set, and groups the review by confidence so certain rows confirm in one action.
8.2 Server help sends a cropped frame for rows left unresolved on the device, after consent per batch; the image is deleted once recognised, and calls are metered.
8.3 Both are candidates for I-30's paid tier and wait for its gate. They save time or cost money to run, which is what players pay for elsewhere: Deckbox, DeckCheck and Dragon Shield sell scan quantity or bulk, while ManaBox and TCGplayer give single scans away, funded, in our reading, by other subscriptions or by a marketplace [1][5][9][10][13]. Whether a paid tool fits the Fan Content Policy [33] and Scryfall's no-paywall rule [31] is I-30's legal question.

## Data model / API

- **Slices 1 to 5:** no schema change. `src/app/manifest.ts` (or a per-locale route, open question), PNG icons under `public/icons/`, a `viewport` export in `src/app/[locale]/layout.tsx`, two Playwright projects and a second Lighthouse configuration.
- **Security headers:** `buildSecurityHeaders` takes a route-scoped exception for `/:locale/collection/scan` only; its test asserts both the exception and the default.
- **Scanning (slices 9 to 12):** reuses I-26's staged-import tables with `source = "camera"`, plus per row `candidates` (Scryfall ID and score), `confidence`, `status` (pending, accepted, skipped), `recognizerVersion` and `indexVersion`. No image column.
- `GET /recognition/index-v{n}.bin`: a static, versioned asset. `POST /api/collection/scan/assist` (slice 12): accepts one cropped frame, returns candidates, stores nothing.

## Non-goals

- A store wrapper or native app before 4.2's triggers; I-13's exclusion stands.
- A service worker or an offline cache in this initiative; I-19 owns the one deck cache. An offline card database stays out as well.
- Offline scanning queues, barcode scanning of sealed product, hardware sorters, condition grading and price-by-photo.
- Storing or sharing card photos.
- Push notifications, badges, install nags and streaks.
- Any card data behind a paywall.
- Using a language model to recognise cards. Recognition is a deterministic lookup against an index.

## Testing strategy

- **Unit:** the manifest satisfies Chrome's list [18]; every icon it names exists with the stated pixel size (read from the PNG header); security headers deny the camera everywhere except the scan route.
- **E2E, `@phone`:** each journey in 3.1 passes in mobile WebKit and mobile Chromium; the tab bar's computed bottom padding includes the safe-area inset; the manifest answers 200 to a signed-out request.
- **Manual:** the staging checklist in 3.4 is ticked on real devices before a promotion to `main`.
- **Recognition:** the in-browser part of the benchmark in 6.2 runs under the production CSP. An index or model change that lowers printing-level top-1 below the previous interval fails the check.
- **Privacy:** on the scan route, request interception asserts that no request carries image data unless server help was accepted; the assist route leaves nothing on disk.
- **Commit:** I-26's atomicity and idempotence tests run again with `source = "camera"`.

## Delivery slices

| #   | Slice                                                                                                                      | Depends on                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Manifest, PNG and maskable icons, apple-touch-icon, theme colour, `viewportFit`, `appleWebApp`, localized shortcuts; tests | —                                              |
| 2   | Safe-area insets on bottom bars and header, in-app back on journey screens, external links outside the app window          | 1                                              |
| 3   | Install help page in English and French, linked from settings; no automatic prompt                                         | 1                                              |
| 4   | Playwright mobile WebKit and Chromium projects running `@phone` journeys; Lighthouse mobile preset                         | —                                              |
| 5   | Real-device staging checklist in `quality-gate.md`, including sign-in in installed mode                                    | 1, 4                                           |
| 6   | Recognition benchmark under `scripts/research/` with committed photos; go or no-go recorded by the owner                   | — (owner's photos)                             |
| 7   | Written answer from Scryfall and the lawyer question on a derived index; no code                                           | —                                              |
| 8   | Index build script from Scryfall bulk data, versioned asset, size disclosure                                               | 6 (go), 7                                      |
| 9   | Scan route: camera and WebAssembly allowed there only, capture, on-device recognition of Oracle identity, staged rows      | 8; I-06 printing-level ownership; I-26 slice 3 |
| 10  | Printing resolution and review tray; commit through I-26 with "camera scan" provenance; benchmark on the help page         | 9                                              |
| 11  | Bulk mode: continuous capture, set lock, review grouped by confidence                                                      | 10; I-30 slice 0                               |
| 12  | Server help for unresolved rows, with consent and metering                                                                 | 10; I-30 slices 0 and 4                        |

Slices 1 to 5 need no owner decision and can ship now. Slices 6 and 7 are research and correspondence. Scheduled agents must not pick slices 8 to 12 before the owner records the go decision from slice 6 and the answers from slice 7.

## Open questions

- **Does scanning leave the non-goal list, conditionally?** The 2027 sweep called it a native-camera capability that ManaBox owns. DeckCheck sells camera scanning with no store app found [7][9], and most of ManaBox's low reviews are about scanning [13], so both reasons are weaker than they were. The owner decides whether slices 6 to 12 may proceed.
- **Can a recognition index derived from Scryfall images be built, served to browsers and used by a paid bulk mode?** This needs Scryfall in writing and the lawyer in I-30 7.2: Scryfall forbids repackaging and paywalling its data, and the art belongs to Wizards [31][33].
- **What accuracy justifies a web scanner beside free native ones?** The thresholds in 6.3 are a proposal, and the photo set must come from cards the owner can photograph and publish.
- Should `start_url` open the deck library (`/decks`, which sends a signed-out player to sign-in) or the landing page?
- One manifest with English text, or a per-locale manifest so French players see French shortcuts?
- Should scanning a physical deck produce a deck list through I-10's import preview, as well as collection rows?
- Should I-19 request persistent storage once the app is installed? WebKit weighs installation when it grants persistence [19].

## Sources

Read 2026-11-09 unless dated otherwise.

1. Apple App Store, [ManaBox MTG](https://apps.apple.com/us/app/manabox-mtg/id1460407674), and the [iTunes Lookup API](https://itunes.apple.com/lookup?id=1460407674) for the rating count.
2. Google Play, [ManaBox MTG](https://play.google.com/store/apps/details?id=skilldevs.com.manabox), updated 2026-11-02.
3. ManaBox, [Subscriptions guide](https://manabox.app/guides/general/subscriptions/).
4. Apple App Store, [MTG Scanner – Dragon Shield](https://apps.apple.com/us/app/mtg-scanner-dragon-shield/id1460657155).
5. TCGplayer on the [App Store](https://apps.apple.com/us/app/tcgplayer/id1247645833) and [Google Play](https://play.google.com/store/apps/details?id=com.tcgplayer.tcgplayer).
6. Delver Lens on [Google Play](https://play.google.com/store/apps/details?id=delverlab.delverlens), updated 2026-11-07, and [MTG Delver TCG Scanner](https://apps.apple.com/us/app/mtg-delver-tcg-scanner/id6504142186) on the App Store.
7. iTunes Search API queries for [deckcheck](https://itunes.apple.com/search?term=deckcheck&entity=software&country=us), [moxfield](https://itunes.apple.com/search?term=moxfield&entity=software&country=us), [archidekt](https://itunes.apple.com/search?term=archidekt&entity=software&country=us) and cardmarket in the [US](https://itunes.apple.com/search?term=cardmarket&entity=software&country=us), [FR](https://itunes.apple.com/search?term=cardmarket&entity=software&country=fr) and [DE](https://itunes.apple.com/search?term=cardmarket&entity=software&country=de) stores.
8. Archidekt, [web app manifest](https://archidekt.com/manifest.json) and `/service-worker.js` (HTTP 200).
9. DeckCheck, [manifest](https://deckcheck.co/manifest.json) and [support page](https://deckcheck.co/support).
10. Deckbox, [Premium](https://deckbox.org/premium).
11. Scrytics, [Scanner](https://scrytics.com/features/scanner).
12. TCGplayer, [Listing just got faster: Scan & Identify for Level 4 sellers](https://seller.tcgplayer.com/blog/listing-just-got-faster-scan-identify-for-level-4-sellers), 2026-07-28.
13. App Store review feeds, pages 1 to 5 (250 reviews each): [ManaBox](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460407674/sortby=mostrecent/json), [Dragon Shield](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460657155/sortby=mostrecent/json), [TCGplayer](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1247645833/sortby=mostrecent/json). Keyword counts are our own.
14. WebKit, [Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), 2023-02-16.
15. WebKit, [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), 2025-09-15.
16. TechCrunch, [Apple reverses decision about blocking web apps on iPhones in the EU](https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/), 2024-03-01.
17. Open Web Advocacy, [2025 in review](https://open-web-advocacy.org/blog/owa-2025-review/), 2026-01-05.
18. web.dev, [What does it take to be installable?](https://web.dev/articles/install-criteria)
19. WebKit, [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), 2023-08-10.
20. MDN, [Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), modified 2026-01-05.
21. MDN, [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), modified 2025-11-30.
22. Next.js, [Progressive Web Apps guide](https://nextjs.org/docs/app/guides/progressive-web-apps), updated 2026-07-30.
23. Next.js, [Static exports](https://nextjs.org/docs/app/guides/static-exports), updated 2026-08-09.
24. Capacitor v8, [Configuration](https://capacitorjs.com/docs/config).
25. Chrome for Developers, [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity).
26. Apple, [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), guidelines 3.1.1, 3.1.1(a) and 4.2.
27. Apple, [App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/).
28. Apple Newsroom, [Apple announces changes for apps in the European Union](https://www.apple.com/newsroom/2026/08/apple-announces-changes-for-apps-in-the-european-union/), 2026-08-18.
29. MacRumors, [Apple fights back against Epic](https://www.macrumors.com/2026/06/11/apple-fights-back-against-epic/), 2026-06-11.
30. Google, [Play Console service fees](https://support.google.com/googleplay/android-developer/answer/112622).
31. Scryfall, [API documentation](https://scryfall.com/docs/api), [rate limits](https://scryfall.com/docs/api/rate-limits), [bulk data](https://scryfall.com/docs/api/bulk-data) and [terms of service](https://scryfall.com/docs/terms).
32. Scryfall API searches for paper cards by [artwork](https://api.scryfall.com/cards/search?q=game:paper&unique=art) (49,318) and by [printing](https://api.scryfall.com/cards/search?q=game:paper&unique=prints) (99,937).
33. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
34. T. Mikonen, [How to detect and recognize MTG cards with Python?](https://tmikonen.github.io/quantitatively/2020-01-01-magic-card-detector), 2020-01-01.
35. PokVault Rev, [a privacy-preserving, on-device visual search system for trading card identification](https://didierrlopes.github.io/pokemon-card-scanner-paper) (undated).
36. Google Cloud, [Cloud Vision pricing](https://cloud.google.com/vision/pricing).
37. MDN, [CSP: script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src), modified 2026-08-12.
