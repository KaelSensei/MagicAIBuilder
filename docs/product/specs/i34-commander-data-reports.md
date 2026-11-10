# I-34: Commander Data Reports And Indexable Data Pages

> **Initiative:** I-34, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Written 2026-11-09**
> **Priority:** **Next** for the slices that need no deck index (1–7); **Later** for the slices built on the [I-29 index](i29-cross-site-deck-index.md) (9–12). Slice 8 waits for an owner decision.
> **Research:** dated notes on reference sites, search policy and casual game data (2026-11-09). They are not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** dated reports, indexable data pages, the index policy that decides which public pages search engines see, the public methods page, open data downloads, and the measurement of whether any of it is cited. **Does not own:** the deck corpus and the statistics computed from it ([I-29](i29-cross-site-deck-index.md)); the simulation engine ([I-21](i21-reproducible-probability-bench.md)); guide content and its French review ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the bracket scorer (I-03, I-28 slice 2); locale infrastructure (I-11); public deck and discovery pages (I-08); personal comparisons ([I-31](i31-deck-lab.md)) and their price ([I-30](i30-business-model-and-paid-tier.md)); embeds ([I-36](i36-creator-and-embed-toolkit.md)); game results ([I-35](i35-pod-game-log.md)).

## Overview

The owner's goal (2026-11-09) includes "more information than EDHREC". EDHREC already ranks popularity over 10.5 million decks [11][12], and copying its rankings would break two of the roadmap's [strategic boundaries](../roadmap.md#strategic-boundaries): popularity is not advice, and Lift is meaningless without its denominator. "More information" therefore means **original, dated data with its method stated**: numbers nobody else publishes, each with its sample size, its date and a way to reproduce it.

In the rows below, the data products that get cited share three properties: a recurring dated release, a clear method with denominators, and community participation or open data [9][10][21][23]. None of the large sites grew mainly through search. Direct visits are 47–79% of their traffic and their top keywords are their own names [1]–[7]. Reports are therefore built to be cited by creators and players first, and to rank second.

Four product families:

| Family                | Example                                                                        | Needs the I-29 index?                                                 |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **(a) Dated reports** | "Commander Opening Hands 2027"; "State of the Brackets 2027"                   | No for opening hands (simulation); yes for State of the Brackets      |
| **(b) Data pages**    | Five bracket pages; commander × bracket; card × bracket; in English and French | No for the bracket pages' opening-hand norms; yes for deck statistics |
| **(c) Methods page**  | One anchor per metric, versioned, with a citation format                       | No                                                                    |
| **(d) Open data**     | CSV and JSON of every published table, with a licence and a checksum           | Only for index-based tables                                           |

What ships now, with no index: simulated opening-hand norms from the seeded model behind the [opening-hands guide](../guides/commander-mulligans-curves-and-play-style.md), the five bracket pages, the methods page, and the index policy applied to pages that already exist. French versions of the two guides also need no index; I-28 slice 6 owns them. Everything computed from deck populations waits for I-29 and for minimum samples. Until a partnership lands, that corpus is small (I-29 2.1), so most commander × bracket pages will stay `noindex`. The policy makes that visible instead of filling the gap with thin pages.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise.

| Product                         | What it publishes                                                                                                                                                      | Method and sample on the page                                                                                                                                                                 | Cadence                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **EDHREC Salt Scores** [9]      | Saltiest cards and commanders, with yearly archives                                                                                                                    | 2.2 million votes over five days in 2026; ranked "by average saltiness, not raw vote count"                                                                                                   | Yearly since 2019                |
| **EDHREC year-end report** [10] | Most-built commanders of 2025 (Y'shtola, 23,582 decks), a popularity score per day since reveal, 47 precon commanders in the top 100                                   | Deck counts shown; lists sharing at least 50% of a precon excluded from card analysis                                                                                                         | Yearly (2025-11-26)              |
| **EDHREC data pages** [11][13]  | Programmatic pages: commander × theme × budget × bracket, card × colour identity. Bracket filters on Top Cards, Game Changers, Staples and Mana Rocks since 2026-11-06 | Deck counts; brackets as declared by owners, and only 22.1% of 46,174 Atraxa decks declare one [34]. The changelog mentions no curve or average-deck statistics by bracket                    | Continuous                       |
| **ScrollVault** [14][15]        | Per-bracket medians of lands, ramp, draw, removal, average mana value and Game Changers                                                                                | 6,532 public Archidekt decks with owner-declared brackets, collected 2026-09-07; says brackets are unverified. A land-count simulation claims 3.75 million games; its method was not reviewed | Guide pages, dated by collection |
| **Playgroup.gg** [16]–[20]      | Commander tier list, seat advantage, win rate by mulligan count, kept-hand land counts, monthly metagame reports                                                       | 770,000+ tracked games. Tier list: at least 40 games and 10 distinct pilots, rolling 30 days. Pairings under 25 games are "suggestive rather than statistical". No API or open dataset listed | Monthly reports; live pages      |
| **EDHTop16** [21][22]           | cEDH meta share, entries, top cuts and conversion rate (top cuts / entries)                                                                                            | Tournament data from TopDeck.gg; an API and an `llms.txt` file. EDHREC's own cEDH year-end article quotes its conversion rates                                                                | Continuous                       |
| **17lands** (Limited) [23]      | Game-level CSV datasets on a public bucket                                                                                                                             | One row per game; counts bucketed "to protect the privacy of 17lands users". Reused in strategy articles, tutorials and public datasets                                                       | Per set                          |
| **Commander Spellbook** [24]    | Combo database with a REST API                                                                                                                                         | MIT-licensed code; powers EDHREC's combo pages                                                                                                                                                | Continuous                       |

**Not found in the 2026-11-09 research pass:** the age and freshness of a commander's decks; deck price by bracket; the share of decks with a two-card combo by bracket; the gap between declared and estimated brackets; keep rates or opening-hand land distributions by bracket from simulation; how far upgraded precons drift from the box; and any of this in French. Per-bracket statistics exist in part (EDHREC filters, ScrollVault medians), and Playgroup publishes site-wide mulligan data that is not split by bracket. Players ask Moxfield for a last-updated filter [35].

**Search context.** All traffic figures are modelled **estimates** (Semrush, September 2026). Google sends 10–36% of visits to the seven sites measured, and AI assistants under 0.05% where Semrush reports them (EDHREC: 7,000 visits from ChatGPT, 0.045%) [1]–[7]. Semrush and Similarweb disagree on whether EDHREC or Moxfield is larger [1][2][8]. In Pew's data, users clicked a result on 8% of visits with an AI summary against 15% without; Google disputed the method [31]. Since March 2024 [26], Google's spam policy defines **scaled content abuse** as "many pages … generated for the primary purpose of manipulating search rankings and not helping users". Its examples include generative AI "without adding value" and scraping "through automated transformations like synonymizing, translating" [25]. Google asks that AI-generated content be fact-checked and suggests saying how content was made [27]. Hreflang tags must be reciprocal, and translated pages are not duplicates when their main content is translated [28]. A `noindex` page "must not be blocked by a robots.txt file" [29]. Dataset structured data requires `name` and `description` and recommends `license` and `distribution` [30].

**How these sites grew.** Through their data supply, through community gatekeepers (in 2020 the cEDH Decklist Database and PlayEDH stopped accepting TappedOut links [36]), through creators, and as free infrastructure: Scryfall has an estimated 47.43 million backlinks from 12,700 domains [4].

## Current state in this codebase

Verified on `dev` (commit `49983a9`) on 2026-11-09:

- **Locales.** `src/i18n/routing.ts` serves `en` and `fr` and keeps eight catalogs dormant. `localePrefix: "as-needed"` serves English at the root and French under `/fr`. `src/middleware.ts` composes next-intl with NextAuth.
- **Public routes are declared twice.** `PUBLIC_PATH_PREFIXES` in `src/middleware.ts` and `PUBLIC_API_AND_PAGE_PATHS` in `src/lib/auth/edge-config.ts` both list `/deck`, `/u`, `/commanders`, `/share` and the sign-in pages. The home page and `/builder/guest` are also public. Every other page redirects a signed-out visitor, and a crawler, to sign-in.
- **The rules pages are behind sign-in.** `/rules/game-changers` and `/rules/comprehensive` are in neither list, although the header (`src/components/layout/Header.tsx`) and the landing page (`src/components/landing/CapabilityAtlas.tsx`) link to them. Their metadata is static, without alternates.
- **Canonical and hreflang.** `buildAlternates` in `src/lib/seo/alternates.ts` emits a canonical and `en`, `fr` and `x-default` alternates, `x-default` being the English URL. It is set per page, deliberately not on the layout. The home page, `/deck/[id]`, `/u/[username]` and `/commanders/[slug]/decks` use it. `[locale]/layout.tsx` sets `<html lang>`.
- **Sitemap.** `src/app/sitemap.ts` with `src/lib/seo/sitemap.ts` lists the home page, public decks, claimed profiles, and one page per commander with at least one public deck. Entries carry `en` and `fr` alternates but no `x-default`, which the pages themselves declare.
- **Robots.** `src/app/robots.ts` allows `/` and disallows `/api/`, `/builder/`, `/collection/` and `/share/`. `noindex` is used only on share-token pages and two settings pages.
- **Thin-page exposure today.** `/commanders/[slug]/decks` renders its empty state with HTTP 200 for any unknown slug, with a canonical and no `noindex`. The sitemap lists a commander as soon as one public deck names it. The titles and descriptions of deck and commander pages are hardcoded English in both locales.
- **Structured data.** `src/components/JsonLd.tsx` emits a `SoftwareApplication` object on the home page only. No `Dataset` or `Article` markup, and no `llms.txt`.
- **No report, data, methods or guide route.** The two guides exist as Markdown in `docs/product/guides/`, in English. I-28 slices 4 and 6 publish them.
- **Simulation.** `scripts/research/commander-opening-hands/` draws from a seeded mulberry32 generator and reproduces the guide's tables; nothing in `src/` imports it. The product playtest shuffles with `randomIntBelow` from `src/lib/crypto-random.ts` (Web Crypto) and has no seed; I-21 slice 1 adds one.
- **Bracket model.** `src/lib/constants/brackets.ts` declares `BracketLevel = 1 | 2 | 3 | 4`, and names bracket 1 "Casual" with `allowsTutors: false`. Until I-28 slice 2 lands, no estimated bracket 5 can be computed.
- **Prices.** `src/lib/scryfall/types.ts` declares `prices.usd`, `usd_foil` and `eur`. There is no bulk price job ([I-67](i67-one-card-data-pipeline.md) slice 5, re-pointed 2026-11-10 from I-29 slice 1).
- **Measurement.** `package.json` includes `@vercel/speed-insights`, which measures performance, not traffic. No analytics tool and no Search Console verification tag are in the code; DNS verification cannot be checked from the repository. The roadmap parks PostHog and Plausible "after defining measurable product questions", and parks the custom domain. `siteUrl()` falls back to `https://magicaibuilder.com`.
- **Corpus size** cannot be read from the repository.

## Functional requirements

### 1. What every published figure carries

1.1 Each figure carries one of the guides' evidence labels (**Official**, **Data**, **Community**, **Computed**) with its sample size, data window, computation date and a link to its methods anchor.
1.2 Simulated figures read "**Computed** (simulation)", name the deck shell and the mulligan policy, and state that the model is a goldfish, not observed play ([limits](../guides/commander-mulligans-curves-and-play-style.md#limits)).
1.3 Index-based figures use I-29's format: "**Computed**: _n_ decks (_a_ MagicAIBuilder, _b_ cEDH Decklist Database), updated _start_ to _end_" (I-29 6.2).
1.4 Third-party figures appear only as cited **Data** with source and date, as the guides do. They never enter a download, and EDHREC's percentages, Lift, average decks and salt scores are never copied (I-29 6.1).
1.5 An inclusion share always shows its numerator and denominator, carries "Inclusion is not a recommendation", and is never sorted into a "best cards" list. No co-occurrence ratio is shown without its reference cohort and denominator, and nothing is presented as a win rate.

### 2. Dated reports

2.1 Each edition lives at a permanent URL, `/reports/<slug>-<year>`. A new edition gets a new URL; an old one stays online with a "superseded by" link.
2.2 A simulated report records its seeds, the sample size per cell and the model's commit. An index-based report records its corpus version. Rerunning from those inputs reproduces every table byte for byte, the same criterion as I-21 1.2.
2.3 Every share carries a 95% interval, with the method named on the methods page.
2.4 Corrections are appended with a date. A changed figure shows its old value struck through, not deleted.
2.5 Each report family states its cadence (yearly by default). A Wizards change to the brackets or the Game Changers list, or a Comprehensive Rules change to rule 103.5, triggers a dated addendum.
2.6 **Commander Opening Hands** (no index) reports, per bracket shell: the value of the free mulligan, keep shares for the first seven and the free seven, keep tables by lands and cheap ramp, land-count plateaus, and exact hypergeometric tables. Playgroup's observed keep figures appear beside them as cited **Data**, and the gap between practice and the model is explained ([guide](../guides/commander-mulligans-curves-and-play-style.md#how-players-actually-mulligan)).
2.7 **State of the Brackets** (index) reports: declared against estimated bracket, per-bracket norms with interquartile ranges, deck price by bracket (USD and EUR, with the price date), the share of decks with a two-card combo, and freshness. A cell below its threshold reads "withheld (_n_ decks)".
2.8 Reports are authored pages: prose written by a person around computed tables, rendered statically and readable signed out.

### 3. Indexable data pages

3.1 **Bracket pages** (five, no index needed): a short summary of the official rules with a link to the I-28 guide section, and that bracket shell's opening-hand norms. Deck statistics are added once the index passes its thresholds.
3.2 **Commander × bracket pages** (index): sample size and source mix; declared and estimated brackets; median lands, cheap ramp, draw, interaction, average mana value and Game Changers, each with its interquartile range; median price with its date; combo share; freshness at 30, 90 and 180 days.
3.3 **Card × bracket pages** (index): the share of decks per bracket that include the card, among decks whose colour identity allows it, with numerator and denominator. That is EDHTop16's definition of play rate [21]. The page shows the card's name and links to Scryfall for everything else. It is not a card database page.
3.4 Every sentence on a data page comes from a reviewed template in the locale catalog, filled with computed values. No model call happens on these routes.
3.5 Pages are rendered on the server with the numbers in the HTML, regenerated when the corpus or method version changes. Their `lastModified` is the computation date.
3.6 Each metric links to its methods anchor, and each page links to the matching I-28 guide section.

### 4. Index policy

4.1 One policy function returns `index`, `noindex` or `absent` for every public page kind, from the sample size and the number of metrics above their own threshold. Page metadata and the sitemap both call it.
4.2 Starting thresholds, pending the open question: a commander × bracket page is indexable at 100 or more deduplicated decks with at least five metrics shown; a card × bracket page needs a denominator of 100 or more decks in each bracket shown and at least two brackets. **Computed** (normal approximation): a 95% interval on a share is at most ±9.8 points at 100 decks, ±13.9 at 50 and ±4.9 at 400.
4.3 Below threshold, the page still renders for visitors, with its sample size and "not enough decks yet", but carries `noindex` and is left out of the sitemap. It is never disallowed in robots.txt, because a crawler must see the `noindex` [29].
4.4 A real commander or card with no data renders `noindex`. On the pages this initiative adds, a slug that matches no card returns 404. The existing discovery page keeps its empty state for an unknown slug and gets `noindex`.
4.5 The policy also covers existing pages: commander discovery pages below the threshold of public decks, and profiles with no public deck, become `noindex` and leave the sitemap.
4.6 The methods page shows, per page kind, how many pages are indexable, how many are `noindex`, and the corpus size, updated with each corpus version.
4.7 AI use: a model may help research and structure a report. Every AI-assisted sentence, title, description and alt text is checked against the data by a named reviewer before publication, and the report says how it was made [27]. No page is generated by a model, and no translation is published unreviewed [25].

### 5. English, French and hreflang

5.1 Data pages and reports exist in English and French only. Dormant locales get none (I-25).
5.2 Every page declares a canonical and reciprocal `en`, `fr` and `x-default` alternates through `buildAlternates`. Sitemap entries carry the same set, `x-default` included.
5.3 A French page is indexable only when every template and label on it has been reviewed in French. Otherwise its URL is `noindex` and dropped from the sitemap, and the English page stops declaring it as an alternate.
5.4 Numbers, dates and decimal separators follow the locale. A price names its currency and date. EUR appears where Scryfall's `prices.eur` exists and is never converted from USD.
5.5 Card names appear in French where Scryfall provides them, otherwise in English. Bracket names follow I-28 3.4: "Catégorie N — Nom (bracket N)".
5.6 Titles and descriptions are localized on every page this initiative adds or touches.

### 6. Methods page and open data

6.1 `/methods` has one anchor per metric: definition, numerator, denominator, threshold, sources, and known biases (self-declared brackets, a self-selected corpus, the model's limits).
6.2 The method has a version number and a change log. Each report and data page names the version it used.
6.3 A "how to cite" line gives title, edition, date, URL and method version.
6.4 A corpus section lists the sources, their I-29 tiers, the deck count per source and the last computation date.
6.5 Each report table and each data-page kind has a CSV and a JSON download with a schema, a licence, a SHA-256 checksum, a row count and a generation date. The page carries `Dataset` markup with `name`, `description`, `license` and `distribution` [30].
6.6 Downloads hold only our own computed aggregates. They contain no third-party data, no row describing an external deck, and no cell below its minimum; such a cell is blank and flagged.
6.7 The proposed licence for these aggregates is CC BY 4.0, pending the legal review in [Open questions](#open-questions).

### 7. Free access and the paid tier

7.1 Reports, data pages, the methods page and downloads need no account, no email and no payment. Payers get no early access. This follows the Fan Content Policy's "Free means FREE" [32] and Scryfall's ban on paywalling its data [33].
7.2 The paid candidate is personal: placing the player's own decks inside the published norms. This means a percentile per metric against the bracket, the player's list simulated with a seed against the bracket shell, declared against estimated bracket for that deck, history across snapshots, and a notice when a new edition moves a norm the deck sits outside. It belongs to [I-31](i31-deck-lab.md) and is priced in [I-30](i30-business-model-and-paid-tier.md).
7.3 A paid feature never shows a norm that the free pages do not. It uses the same method version, so a player can cite the norm their comparison rests on.
7.4 **Why it could be worth paying for.** Paid tiers in this market sell personal data and computation: Untapped sells matchup and deck-version history [37], Deckstats sells first-turn analysis [38], and MTGGoldfish sells price-history downloads (search summary) [39]. None of the sources read for this spec places a player's own list inside a dated, published distribution with its sample size. That check was not exhaustive. I-28 4.5 already promises a free opening-hand check of the open deck, so the paid part must offer more: population percentiles, several decks, history and notices.

### 8. Measurement

8.1 "A reference" is measured by the signals below. No numeric target is set until a baseline exists.

| Signal                     | How it is measured                                                                | Incumbent reference (Semrush estimates, September 2026)                                                    | Our baseline on 2026-11-09                      |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Citations**              | A log of external pages that name or link a report or data page with a figure     | EDHREC's year-end cEDH article quotes EDHTop16's conversion rates [22]; 17lands data is reused widely [23] | None: no report exists                          |
| **Referring domains**      | Search Console links report                                                       | EDHREC 4,910; Moxfield 5,200; Archidekt 3,660; EDHTop16 843 [1][2][3][7]                                   | Unknown: no verification is visible in the code |
| **Direct share of visits** | First-party analytics, with absolute direct and returning visits beside the share | 47–79% across seven sites [1]–[7]                                                                          | None: only Speed Insights is installed          |
| **Branded search**         | Search Console queries containing the product's name                              | "edhrec" 246,000 and "moxfield" 201,000 searches a month in the US [1][2]                                  | Unknown                                         |
| **AI-assistant referrals** | Analytics referrers                                                               | Under 0.05% of visits [1][3]                                                                               | None                                            |

8.2 Each citation entry records the URL, the date, the report and figure cited, and whether we solicited it.
8.3 Each report edition records the state of every signal on its publication date, "not measured" included, so the first edition is its own baseline.
8.4 Our first-party numbers are never compared with Semrush or Similarweb figures as if they were the same measure. A small site's direct share is high by default, so it is always read next to absolute visits.
8.5 A report family with no independent citation after two editions is reviewed before a third is produced.

## Data model

```
ReportEdition  id, family, year, slug, locales[], publishedAt, methodVersion, corpusVersion?, seeds[]?, sampleSizes, codeCommit, supersededById?, errata[] (date, field, oldValue, newValue)
DataPage       kind (bracket|commanderBracket|cardBracket), key, locale, sampleSize, metricsShown, decision (index|noindex|absent), computedAt, corpusVersion, methodVersion
IndexPolicy    kind, minSample, minMetrics, minDenominatorPerBracket?, frenchReviewed
MethodVersion  version, publishedAt, changes, metrics[] (anchor, definition, numerator, denominator, threshold)
DatasetFile    id, reportEditionId? | dataPageKind?, format (csv|json), license, sha256, rowCount, minCell, generatedAt, path
CitationEntry  id, url, foundAt, reportEditionId? | dataPageKey?, figure, solicited
```

Index-based figures are read from I-29's `CorpusStat` (scope, metric, value, sample size, decks per source, window, corpus version). This initiative computes no deck statistic itself.

## Non-goals

- Popularity rankings as headline content: no "top cards" or "most popular commanders" lists presented as advice.
- Lift or any co-occurrence ratio without its denominator; win rates of any kind. Tournament win rates stay blocked.
- Model-written page text, and French pages published without human review.
- Pages for every commander or card regardless of data; pages in dormant locales.
- Republishing EDHREC, Playgroup.gg, ScrollVault or TopDeck.gg data, or any data under a non-commercial term, in a page or a download.
- A card page that repeats Scryfall's card data.
- A paywall, account, email gate or paid early access on any report, page, method or download.
- Community voting events on EDHREC's salt-vote model. They need moderation and anti-brigading, and are a separate decision.
- Reports on game outcomes, such as win rate by bracket mismatch. They wait for I-35 and for Playgroup-like thresholds of at least 40 games and 10 pilots [17].

## Testing strategy

- **Index policy (solitary, table-driven):** for every page kind, below the threshold gives `noindex` and no sitemap entry; above it gives `index` and an entry; no page kind is ever disallowed in robots.txt.
- **Hreflang (sociable):** for every sitemap entry, the `en`, `fr` and `x-default` alternates match the page's own metadata and point at each other. An unreviewed French page drops out of both sides.
- **Reproducibility:** a report table regenerated from its recorded seeds, sample sizes and commit is byte-identical. This test is the report's acceptance criterion.
- **Disclosure:** rendering any report or data page without a sample size, date, method version or methods link fails the test.
- **Labels:** an inclusion share renders with its numerator, denominator and the "not a recommendation" line; no data-page component sorts by inclusion.
- **No model on the path:** report and data-page routes import no AI client, checked by a dependency test.
- **Downloads:** the checksum matches the file, no cell is below its minimum, and a schema guard rejects third-party fields and rows describing an external deck.
- **Free access:** every route in this spec renders signed out, and none checks a subscription.
- **Public-route parity:** the two public-path lists contain the same page prefixes.
- **Existing pages:** an unknown commander slug renders `noindex`, and a commander below the threshold is absent from the sitemap.
- **Accessibility:** report pages pass the existing Lighthouse and axe budgets, with tables readable by screen readers.

## Delivery slices

| #   | Slice                                                                                                                                                         | Depends on                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Index policy function; apply it to commander discovery and profile pages; `x-default` in sitemap entries; public-route parity test                            | —                                                                         |
| 2   | Public `/rules/game-changers` with alternates and localized metadata; `/rules/comprehensive` public but `noindex`, since it reproduces Wizards' text verbatim | 1                                                                         |
| 3   | Methods page, version 1, in English, with the citation line and the corpus section                                                                            | 1                                                                         |
| 4   | Report framework: edition model, permanent URLs, errata, `Dataset` markup, CSV and JSON downloads with checksums                                              | 3                                                                         |
| 5   | "Commander Opening Hands" first edition from the seeded model, rerun on the rules in force, with intervals and reproduction steps                             | 4                                                                         |
| 6   | Five bracket pages with opening-hand norms, linked to the I-28 guide sections                                                                                 | 5; I-28 slice 4 for the guide links                                       |
| 7   | French review of slices 3, 5 and 6, with locale gating                                                                                                        | 3, 5, 6; I-28 slice 6 for the French guides                               |
| 8   | Measurement baseline: verified Search Console property, analytics tool, citation log                                                                          | **Blocked** on the owner's domain and analytics decisions                 |
| 9   | Commander × bracket pages from `CorpusStat`, with thresholds and downloads                                                                                    | 1, 4; I-29 slices 8 and 11                                                |
| 10  | Card × bracket pages                                                                                                                                          | 9                                                                         |
| 11  | "State of the Brackets" first edition                                                                                                                         | 9; I-28 slice 2; I-29 slice 9; Spellbook data licence for the combo share |
| 12  | Precon drift in State of the Brackets: distance of upgraded precons from the box, by months since release                                                     | 11; I-29 slice 7; I-17 catalog                                            |

Slices 1–7 are **Next**: they need no deck index, and slice 1 alone removes today's thin-page exposure. Slices 9–12 are **Later**, behind I-29. Slice 8 waits for the owner and blocks nothing else: until it lands, each edition records its signals as "not measured" (8.3).

## Open questions

- **Minimum samples.** Are 100 deduplicated decks and five metrics the right bar for a commander × bracket page? Should distinct owners count, as Playgroup counts distinct pilots [17]? This answer also settles I-29's open question on minimum samples.
- **Domain and analytics.** Citations and backlinks accrue to a domain, and the roadmap parks both the custom domain and the analytics tool. Without them, slice 8 cannot record a baseline. Which comes first?
- **Licence and Fan Content Policy (for the lawyer, research not legal advice).** Can aggregates keyed by card names (Wizards IP) and Scryfall Oracle IDs be released under CC BY 4.0? Does a paid comparison against free norms count as a "subscription … to access your Fan Content" [32]? It joins question 9 of the lawyer list in [I-29's open questions](i29-cross-site-deck-index.md#open-questions).
- **Who reviews French,** and on what cadence? Without a named reviewer, slice 7 blocks every French page.
- **Report timing.** EDHREC published its 2025 report on 2025-11-26 [10]. Should "State of the Brackets" avoid that window, or follow Wizards' bracket announcements?
- **`llms.txt`.** EDHTop16 publishes one [21]. AI referrals are under 0.05% of incumbents' traffic [1]. Is it worth a file before measurement shows demand?
- **The paid line.** I-28 4.5 checks the open deck's opening hands for free. Which comparisons are paid is for I-30 and I-31 to decide.

## Sources

1. Semrush, edhrec.com overview, September 2026 data (updated 2026-10-11 to 14), read 2026-11-09. https://www.semrush.com/website/edhrec.com/overview/
2. Semrush, moxfield.com overview, same dates. https://www.semrush.com/website/moxfield.com/overview/
3. Semrush, archidekt.com overview, same dates. https://www.semrush.com/website/archidekt.com/overview/
4. Semrush, scryfall.com overview, same dates. https://www.semrush.com/website/scryfall.com/overview/
5. Semrush, mtggoldfish.com overview, same dates. https://www.semrush.com/website/mtggoldfish.com/overview/
6. Semrush, tappedout.net overview, same dates. https://www.semrush.com/website/tappedout.net/overview/
7. Semrush, edhtop16.com overview, same dates. https://www.semrush.com/website/edhtop16.com/overview/
8. Similarweb, moxfield.com vs edhrec.com, October 2026, read 2026-11-09. https://www.similarweb.com/website/moxfield.com/vs/edhrec.com
9. EDHREC, Nick Wolf, "Salt Vote Results 2026", 2026-10-16. https://edhrec.com/articles/salt-vote-results-2026
10. EDHREC, Arnaud Gompertz with Julia Maddalena, "A Statistical Look at Almost a Year in Commander (2025)", 2025-11-26. https://edhrec.com/articles/a-statistical-look-at-almost-a-year-in-commander-2025
11. EDHREC changelog, "Big performance upgrades", 2026-11-06. https://edhrec.com/articles/changelog-big-performance-upgrades
12. EDHREC, Morgan Sanchez, "EDHREC hits 10 million unique decks from the past two years", 2026-09-14. https://edhrec.com/articles/edhrec-hits-10-million-unique-decks-from-past-two-years
13. EDHREC page families, examples found in search results on 2026-11-09. https://edhrec.com/commanders/orphan-cocoon-falcie/cedh/expensive and https://edhrec.com/cards/humility/witch-maw
14. ScrollVault, Commander deck ratios by bracket, data collected 2026-09-07, read 2026-11-09. https://scrollvault.net/guides/commander-deck-ratios.html
15. ScrollVault, Commander land-count data, read 2026-11-09. https://scrollvault.net/guides/commander-land-count-data.html
16. Playgroup.gg, home and About, updated 2026-11-09. https://playgroup.gg/ and https://playgroup.gg/about
17. Playgroup.gg, Commander tier list (method), read 2026-11-09. https://playgroup.gg/commanders/tier-list
18. Playgroup.gg, Turn order, computed 2026-11-09. https://playgroup.gg/commander/turn-order
19. Playgroup.gg, Malcolm, Keen-Eyed Navigator page (search snippet, not opened), 2026-11-09. https://playgroup.gg/commanders/1522-malcolm-keen-eyed-navigator
20. Playgroup.gg, Research index, read 2026-11-09. https://playgroup.gg/research
21. EDHTop16, About, read 2026-11-09; `llms.txt`, last updated 2025-01-03 (its play-rate definition via search snippet). https://www.edhtop16.com/about and https://edhtop16.com/llms.txt
22. EDHREC, "The Top 10 cEDH Decks of 2025". https://edhrec.com/articles/the-top-10-cedh-decks-of-2025
23. Joel Nitta, introduction to 17lands data, 2023-12-31. https://joelnitta-home.pages.dev/posts/2023-12-31_17lands-intro
24. Commander Spellbook, About, read 2026-11-09. https://commanderspellbook.com/about/
25. Google Search Central, spam policies, read 2026-11-09 (no last-updated date shown). https://developers.google.com/search/docs/essentials/spam-policies
26. Google Search Central blog, March 2024 core update and spam policies. https://developers.google.com/search/blog/2024/03/core-update-spam-policies
27. Google Search Central, "Using generative AI content", read 2026-11-09. https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
28. Google Search Central, "Localized versions of your pages", read 2026-11-09. https://developers.google.com/search/docs/specialty/international/localized-versions
29. Google Search Central, "Block search indexing with noindex", read 2026-11-09. https://developers.google.com/search/docs/crawling-indexing/block-indexing
30. Google Search Central, Dataset structured data, read 2026-11-09. https://developers.google.com/search/docs/appearance/structured-data/dataset
31. Pew Research Center, "Google users are less likely to click on links when an AI summary appears in the results", 2025-07-22. https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/
32. Wizards of the Coast, Fan Content Policy, last updated 2017-11-15, read 2026-11-09. https://company.wizards.com/en/legal/fancontentpolicy
33. Scryfall, API documentation (use of data), read 2026-11-09. https://scryfall.com/docs/api
34. EDHREC deck table for Atraxa, Praetors' Voice, read 2026-11-09 (via the I-29 spec). https://json.edhrec.com/pages/decks/atraxa-praetors-voice.json
35. Moxfield feedback board, request #1763 (undated). https://moxfield.nolt.io/1763
36. TappedOut forum, "Is TappedOut dying?", 2020-11-19 to 23. https://tappedout.net/mtg-forum/tappedout/is-tappedout-dying
37. Untapped.gg, Premium, read 2026-11-09. https://mtga.untapped.gg/premium
38. Deckstats, Premium (page returned 403; features via the competitive landscape). https://deckstats.net/premium
39. MTGGoldfish, Premium (page returned 403; search summary of 2026-11-09). https://www.mtggoldfish.com/premium
