# Spec: Cross-Site Commander Deck Index (I-29)

> **Initiative:** I-29, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-09 · **Researched:** 2026-11-09
> **Research:** three dated notes (source access and terms, EU and French law, scale and architecture). They are not committed, so every external fact below links its own source. They are research, not legal advice.
> **Owns:** the deck index and its source policy, cross-site deck search, link-outs to other deckbuilding sites, deduplication, "decks like mine", and statistics computed from indexed decks. **Does not own:** importing decks ([I-10](../roadmap.md#i-10-interoperability-and-integrations)) or collections ([I-26](i26-collections-arriving-from-elsewhere.md)), sync included; card search and query generation ([I-14](i14-verifiable-natural-language-search.md)); public-deck visibility, profiles and moderation ([I-08](../roadmap.md#i-08-share-compare-and-learn)); hand simulation ([I-21](i21-reproducible-probability-bench.md)); bracket names and rules ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the precon catalog ([I-17](i17-precon-path-and-tiered-upgrades.md)); the EDHREC feed ([I-09](../roadmap.md#i-09-meta-and-evidence)); prices and the seller handoff (I-06).

## Overview

The owner's goal (2026-11-09): from MagicAIBuilder, a player should easily find decks and information from EDHREC, Moxfield, Archidekt and every other viable source, and the product should become a deckbuilding reference that one day supports a cheap subscription.

The research changes how that goal is reached. Moxfield and Archidekt, the largest deck sources, and EDHREC, the largest aggregator, either block automated access or forbid it in their terms. EDHREC's 10.5 million decks come from **partnerships** with Moxfield and Archidekt, not from crawling. This spec therefore builds the index on the sources that allow it, links into every other site without copying it, and treats partnerships as the only route to EDHREC's scale.

What it can deliver before any partnership is the search the incumbents do not offer: card include and exclude across decks, freshness, near-copies collapsed, declared versus estimated bracket and "decks like mine". It runs over every deck MagicAIBuilder may lawfully hold and is designed for 10 million or more decks, so a partnership changes the data, not the architecture.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise.

| Source                                                                       | Decks and access                                                                                                                                                                                                                                                                                                                                                                       | Terms and research verdict                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EDHREC** ([about](https://edhrec.com/about-us))                            | 10 million unique decks from the past two years ([2026-09-14](https://edhrec.com/articles/edhrec-hits-10-million-unique-decks-from-past-two-years)), 10.5 million on the homepage ([2026-11-06](https://edhrec.com/articles/changelog-big-performance-upgrades)). "EDHREC pulls decklists from: Archidekt, Moxfield". Card include and exclude exist only on aggregate commander pages | [Terms](https://edhrec.com/terms) (Space Cow Media, effective 2024-08-06): "personal, noncommercial use"; no "automated searches, requests, or queries"; no access "to build a similar or competitive website". **Link-only**; data needs a partnership                                                                                                                                                                                                   |
| **Moxfield**                                                                 | No published total. Its API and every page, terms included, answered HTTP 403 (Cloudflare) to automated requests. [robots.txt](https://moxfield.com/robots.txt) allows `/decks/` and disallows `/search/*`                                                                                                                                                                             | **Community**: its terms prohibit scraping ([mtg-parser](https://pypi.org/project/mtg-parser/)); access for "legitimate tools" is granted by email to support@moxfield.com ([mpc-autofill, 2024-12](https://github.com/chilli-axe/mpc-autofill/issues/265)). Its wiki (2020-10-14) says "all of our Commander data is sent daily to EDHREC" ([Features](https://github.com/moxfield/moxfield-public/wiki/Features)). **Partnership**; link-only meanwhile |
| **Archidekt**                                                                | Open but undocumented JSON API. **Computed** from sequential IDs: about 32,000 new deck IDs a day across all formats, July to November 2026, private and deleted decks included ([API](https://archidekt.com/api/decks/v3/?pageSize=1&orderBy=-createdAt)). Search totals are capped at 1,000                                                                                          | [Terms](https://archidekt.com/terms) (effective 2018-09-07) share EDHREC's template; the footer reads "Space Cow Media ©2026". **Partnership**; link-only                                                                                                                                                                                                                                                                                                 |
| **Commander Spellbook** ([backend](https://backend.commanderspellbook.com/)) | Open endpoints, among them `find-my-combos`, `estimate-bracket` and `card-list-from-url`                                                                                                                                                                                                                                                                                               | [MIT code](https://github.com/SpaceCowMedia/commander-spellbook-backend) under the SpaceCowMedia GitHub organization; no data license found; the backend's robots.txt is `Disallow: /`. **Likely allowed**, cached and attributed, once the data terms are confirmed                                                                                                                                                                                      |
| **TopDeck.gg**                                                               | Free API keys and documented limits for tournament data                                                                                                                                                                                                                                                                                                                                | [Developer terms](https://topdeck.gg/developer-terms) (2026-10-27): attribution required; do not "commercialize API Data". **Partnership** for any commercial use                                                                                                                                                                                                                                                                                         |
| **cEDH Decklist Database**, **MTGJSON**                                      | Curated cEDH lists on [GitHub](https://github.com/cEDH-Decklist-Database/cEDH-Decklist-Database); official precon deck files                                                                                                                                                                                                                                                           | Both MIT ([MTGJSON license](https://mtgjson.com/license/)). **Allowed**, with the notice kept                                                                                                                                                                                                                                                                                                                                                             |
| **Recommander.cards** ([search](https://recommander.cards/search))           | Commander deck search by commander, color identity, cards and tags                                                                                                                                                                                                                                                                                                                     | Sources not stated; it answered 403                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **One-deck tools and resellers**                                             | mtg-parser and mpc-autofill import one public deck from a pasted URL; vendors sell EDHREC and Moxfield scrapers ([Apify](https://apify.com/parseforge/edhrec-mtg-commander-scraper))                                                                                                                                                                                                   | Evidence of demand, not of permission                                                                                                                                                                                                                                                                                                                                                                                                                     |

**What players ask for.** On Moxfield's feedback board, players ask to "include multiple cards, or sometimes exclude certain cards, to find decks with a particular package or archetype" with and/or logic ([#1766](https://moxfield.nolt.io/1766), [#361](https://moxfield.nolt.io/361)), and to filter by last-updated date ([#1763](https://moxfield.nolt.io/1763)). The posts are undated and their vote counts were unavailable. **Data**: only 22.1% of the 46,174 Atraxa decks in EDHREC's [deck table](https://json.edhrec.com/pages/decks/atraxa-praetors-voice.json) carry a declared bracket, and the table holds no card lists.

**The gap and the constraint.** No product found offers deck-level search across sources with card include and exclude, freshness and near-copies collapsed. The data that would fill it at scale sits with Moxfield and with Space Cow Media, which owns Archidekt, EDHREC and Commander Spellbook and runs the aggregator this index would compete with.

## Current state in this codebase

Verified at commit `545da1c` on 2026-11-09:

- **Deck import from URL exists and fetches server-side** (I-10). `src/lib/import/url-import.ts` reads Moxfield (`api2.moxfield.com/v3/decks/all/<id>`), Archidekt (`archidekt.com/api/decks/<id>/`), TappedOut, MTGTop8, MTGDecks, AetherHub and EDHREC average decks (`json.edhrec.com`). Its Moxfield request sends `Origin` and `Referer` headers set to `https://moxfield.com`. `src/lib/import/moxfield-user.ts` lists any Moxfield username's public decks through `api2.moxfield.com/v2/decks/search-sfw` with the same headers. These are single, player-triggered fetches, not an index, but they are automated requests, and Archidekt's and EDHREC's terms forbid automated queries while Moxfield's are reported to.
- **Blocks are already respected.** `src/lib/http.ts` sends `MagicAIBuilder/1.0 (+https://magicaibuilder.com)`, detects a Cloudflare challenge and tells the player to paste the list instead. Requirement 1 makes that behavior the rule.
- **Pasted text needs no network.** `src/lib/deck/import.ts` parses pasted lists, including Archidekt category tags.
- **External feeds** (I-09): `src/lib/meta/fetch.ts` reads EDHREC commander pages from `json.edhrec.com` into `MetaCache` and `MetaSnapshot`; `src/lib/meta/mtgtop8.ts` reads MTGTop8 search; `src/lib/combos/spellbook.ts` calls `backend.commanderspellbook.com/variants`.
- **No Scryfall bulk-data job and no MTGJSON.** Card data comes from the Scryfall API through `CardCache` and `ScryfallSearchCache`.
- **Card identity is printing-level.** `DeckCard` stores `scryfallId` and `name`. The Oracle ID is never persisted; `src/lib/deck/commander-pairing.ts` reads it only in passing.
- **No deck search infrastructure.** Community discovery matches a commander slug against the denormalized `Deck.commanderName` in raw SQL (`src/app/api/community/commanders/[slug]/decks/route.ts`), and `src/lib/community/discovery-filter.ts` filters loaded rows by name in memory. No migration adds a GIN, trigram, full-text or bitmap index.
- **Visibility rules exist.** `Deck.isPublic` governs discovery, `src/app/robots.ts` disallows `/share/`, and `/api/v1/decks` returns only the key owner's decks because "a public API that defaults to everything published is a scraping endpoint with a login on it".
- **No import provenance.** `Deck` records forks (`forkedFromDeckId`) but not that a deck was imported, or from where.
- **Legal notice.** The footer (`src/messages/en/common.json`) cites Wizards' "Fan Site Policy", not the Fan Content Policy wording quoted in requirement 7.

## Functional requirements

### 1. Source policy (non-negotiable)

1.1 **No circumvention.** Never bypass a block, CAPTCHA, Cloudflare challenge, rate limit or login. Use no rotating proxies, no challenge-solving browser, and no request headers that impersonate a source's own front end. A 403 or challenge ends the run, is logged, and is not retried by another route. French courts convicted for staying in a system after learning it was protected ([Bluetouff, Cass. crim. 2015-05-20](https://next.ink/18233/95165-affaire-bluetouff-cour-cassation-consacre-vol-fichiers-informatiques/)).
1.2 **No accounts.** Ingestion never logs in, never creates an account on a source and never holds a player's password for another site. Accepted terms bind the account holder ([Ryanair, C-30/14](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62014CJ0030)). Only an OAuth flow or API the platform itself offers is acceptable.
1.3 **Opt-out signals.** Before any automated fetch, check robots.txt for our user agent and `*`, TDMRep (`tdm-reservation: 1`), ai.txt, `noai` meta tags and Cloudflare `Content-Signal`. Any of them reserving the use counts as a refusal ([DSM Directive, Art. 4(3)](https://eur-lex.europa.eu/eli/dir/2019/790/oj)). The evidence is stored with the run.
1.4 **Visibility.** Never index a private or unlisted deck, even when its URL is known. An I-08 deck leaves the index in the same transaction that makes it private; an external deck leaves on the next ingest that sees it gone or hidden. The CNIL fined KASPR €240,000 for collecting data whose visibility users had restricted ([2024-12-05](https://cnil.fr/fr/aspiration-de-donnees-sanction-de-240-000-euros-lencontre-de-la-societe-kaspr)).
1.5 **No text authored elsewhere.** Never store descriptions, primers, comments or tags written on another site. Link to them. A card list and structural metadata are the most an external deck contributes; a title is stored only where the source's license grants it.
1.6 **Minimal personal data.** Store no author handle for an external deck unless its license requires attribution, and build no page grouping one person's decks across sites. The CNIL's [scraping guidance](https://www.cnil.fr/en/node/165783) (2025-06-19) asks for per-content rather than per-person grouping. A privacy notice lists every source (GDPR Art. 14(5)(b)).
1.7 **Takedown and opt-out.** A public form for sites, authors and deck owners; a push-back list checked at every ingest; erasure and objection handled under GDPR Arts. 17 and 21; answers within days. A linker acting for profit is presumed to know what it links to ([GS Media, C-160/15, para 51](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62015CJ0160)).
1.8 **Disclosure.** An honest User-Agent with a role contact address, and a public page listing each source, its tier and what is stored.
1.9 **Attribution.** Every indexed deck shows its source, the source's license notice and a link back. No source logo is used without permission.

### 2. Sources, phased by verdict

| Tier                | Sources                                                                                           | What enters the index                                                  | Condition                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Now**             | [Scryfall bulk data](https://scryfall.com/docs/api/bulk-data)                                     | The card dictionary and daily prices; no decks                         | An accurate User-Agent and Accept header, caching of at least 24 hours, bulk files for heavy use ([rate limits](https://scryfall.com/docs/api/rate-limits)), and requirement 7 |
| **Now**             | MTGJSON precon decks                                                                              | Official precon lists, through I-17's catalog                          | MIT notice kept                                                                                                                                                                |
| **Now**             | Commander Spellbook                                                                               | Combo IDs and a second bracket estimate per deck, cached per card list | Its data license confirmed with the maintainers first                                                                                                                          |
| **Now**             | cEDH Decklist Database                                                                            | Curated cEDH lists, read from the GitHub repository, not the website   | MIT notice kept; each deck links to its source. Whether the repository holds the lists themselves was not checked                                                              |
| **Now**             | MagicAIBuilder public decks (I-08)                                                                | `isPublic` decks only; never share-token or private decks              | The owner withdraws a deck by making it private                                                                                                                                |
| **User-authorized** | Moxfield, Archidekt and others, through I-10 and I-26                                             | A deck the player imported and then publishes as their own             | Requirement 2.2                                                                                                                                                                |
| **Link-out**        | Moxfield, Archidekt, EDHREC, TappedOut, Deckstats, MTGGoldfish, Aetherhub, MTGTop8, EDHTop16      | Nothing: deep links only                                               | Requirement 3                                                                                                                                                                  |
| **Partnership**     | Moxfield; Space Cow Media (EDHREC, Archidekt, Commander Spellbook); TopDeck.gg for commercial use | What a signed agreement allows                                         | Written terms covering commercial use, caching, retention, attribution and GDPR roles                                                                                          |
| **Out**             | Bulk collection from Moxfield, Archidekt and EDHREC; republishing their decklists                 | —                                                                      | Non-goals                                                                                                                                                                      |

2.1 **Scale, stated plainly.** No Now source holds user decks at scale. Until a partnership lands, the index is MagicAIBuilder's public decks plus official and curated lists, far below EDHREC's 10.5 million. Every surface shows the corpus size.
2.2 **User-authorized decks.** Importing stays I-10's for decks and I-26's for collections; I-29 builds no importer and no sync, which I-26 excludes anyway. The legal research rates this design low risk when the player triggers one fetch of a deck they own, no credentials are collected, and the player warrants ownership ([GDPR Art. 20](https://eur-lex.europa.eu/eli/reg/2016/679/oj) supports exporting one's own data). An imported deck enters the index only when its owner publishes it under I-08 and confirms it is their own work.
2.3 **Partnership track.** The owner contacts Moxfield, Space Cow Media and TopDeck.gg; this research sent no email. Each agreement is recorded in the source register before any of its data is fetched.

### 3. Link-out search

3.1 For a commander or card, show deep links into each link-out site's own commander, card or search page, built from stored URL templates.
3.2 Neither our servers nor the player's browser send any request to those sites to build the row: no live query, no result counts, no previews. A meta-search engine that "translates" queries into a database site's search "in real time" and shows its results re-utilizes that whole database, and links back do not cure it ([Innoweb, C-202/12, 2013-12-19, paras 44–45](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62012CJ0202)).
3.3 Links open in a new tab. Nothing is framed ([VG Bild-Kunst, C-392/19](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62019CJ0392)); Archidekt's API answered with `x-frame-options: DENY` on 2026-11-09.
3.4 A person verifies each template in a browser and dates it. The research could not verify these URL formats, so an unverified template is not shown.

### 4. Deck search

4.1 **Cards:** include and exclude, combined with and/or, plus "at least N of these M cards". Names resolve to Oracle IDs before the query runs, and unresolved names are disclosed as I-10's import preview does.
4.2 **Commander and colors:** commander, partner or background pair, and color identity (exact, within, or including).
4.3 **Bracket:** declared and estimated are separate facets, each labeled. The estimate comes from the product's own scorer once it covers brackets 1 to 5 (I-28 slice 2), with Commander Spellbook's estimate beside it when available, and names its method.
4.4 **Budget:** total deck price and the per-commander price decile, from Scryfall's daily bulk prices, labeled as estimates with their date. Scryfall says bulk prices "should be considered dangerously stale after 24 hours".
4.5 **Freshness:** updated within 30, 90 or 180 days, and last seen at the source.
4.6 **Source:** a facet showing each source and its tier.
4.7 **Quality defaults:** legal, 100 cards, not a stub; the player can turn them off. **Data** (2026-11-09): Archidekt's two newest Commander decks had 92 and 49 cards.
4.8 Sorting is by freshness, price or similarity. View and like counts from other sites are not stored, and popularity is not presented as advice.
4.9 Search, results and indexed deck pages are readable without an account (requirement 7).

### 5. Deduplication and "decks like mine"

5.1 **Canonical form:** sorted commander Oracle IDs, the companion, and the main deck as a multiset of (Oracle ID, quantity), with basic lands as counts. Sideboard and maybeboard are excluded. A 64-bit hash of it collapses exact copies; reordering or changing printings does not change it.
5.2 **Precon copies:** a deck at Jaccard 0.9 or more to an I-17 precon with the same commander is labeled as a copy of that precon.
5.3 **Near-duplicates:** exact Jaccard within each commander's bucket, confirmed before clustering; MinHash-LSH only where a bucket is too large. **Computed**: a 46,174-deck bucket is about 1.07 billion pairs, a 10,000-deck bucket 50 million. The freshest deck represents its cluster, and "show variants" reveals the rest.
5.4 **Decks like mine:** from the open deck or a pasted list, the nearest indexed decks by Jaccard for the same commander, each with its similarity. A pasted list is neither stored nor indexed.
5.5 **Diff:** cards the similar decks play that yours does not, each with its share of that cohort and the cohort size, and the reverse. It is not Lift and not a win rate.

### 6. Statistics computed from the index

6.1 Statistics are computed only from decks the index may hold under their tier and license. EDHREC's published percentages, Lift, average decks and salt are never copied.
6.2 Each statistic carries the **Computed** label, the count of decks per source, the date window and the computation date, as the guides label evidence. The format is "**Computed**: _n_ decks (_a_ MagicAIBuilder, _b_ cEDH Decklist Database), updated _start_ to _end_".
6.3 Below a minimum sample the statistic is withheld and the sample size is shown instead.
6.4 Each statistic records the corpus version it came from, so it can be recomputed.
6.5 Published aggregates never reproduce an individual external deck, and inclusion is never presented as a win rate.

### 7. Monetization constraints

7.1 **Scryfall:** "You may not 'paywall' access to Scryfall data … If you have an account system, end-users should be able to access card data anonymously or with free accounts." And: "You may not simply repackage, republish, or proxy Scryfall data. Your software must create additional value" ([API docs](https://scryfall.com/docs/api)).
7.2 **Wizards [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy):** "Free means FREE: You can't require payments, surveys, downloads, subscriptions, or email registration to access your Fan Content". Fan content may be subsidized by "sponsorships, ad revenue, and donations", and Wizards may "stop or restrict your use of Wizards' IP at any time—for any reason or no reason".
7.3 **Working assumption, pending legal review:** card data, deck pages, the index, link-outs and statistics stay free and need no account. Paid features are tools and computation on the player's own decks. The text does not settle whether such features count as a "subscription … to access your Fan Content", and a direct Wizards license is the robust path for a paid product.
7.4 Data under a non-commercial term (TopDeck's §7, the "personal, noncommercial use" of Archidekt and EDHREC) appears in no paid feature.
7.5 **Context:** in the [price table](../competitive-landscape.md#2-prices-found-on-8-november-2026) (read 2026-11-08), Moxfield, Archidekt and EDHREC are free with advertising or Patreon tiers from 1 to 5 USD a month, while DeckCheck and Farseek charge for AI use. This is consistent with the assumption; it does not prove it.
7.6 **Affiliate and price links:** the policy's text names sponsorships, ad revenue and donations, not affiliate links. EDHREC, which carries the Fan Content notice, discloses affiliate links in its [terms](https://edhrec.com/terms) (effective 2024-08-06), TCGplayer runs an [affiliate program](https://docs.tcgplayer.com/docs/tcgplayer-affiliate-program) through Impact (3.5% in its [v1.38.0 docs](https://docs.tcgplayer.com/v1.38.0/docs/tcgplayer-affiliate-program)), and Cardmarket offers only a [user-referral bonus](https://help.cardmarket.com/en/AffiliateProgram). The research therefore shows an FCP site using affiliate links; it does not show that the policy treats them as advertising. I-29 adds no price or purchase links, and the roadmap's [marketplace non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark) is unchanged.

### 8. Search architecture and cost

8.1 PostgreSQL stays the source of truth. Each deck's cards are an `int2[]` of dense card IDs under a GIN index, with facets in B-trees.
8.2 A card-to-decks roaring-bitmap index ([pg_roaringbitmap](https://pgxn.org/dist/pg_roaringbitmap/README.html) or in-process) is added only after a benchmark shows GIN too slow on very common cards such as Sol Ring. No public GIN benchmark at 10 million rows was found, so this is measured, not assumed.
8.3 No external search engine before that measurement. Deck names use PostgreSQL text search first. Embeddings are unnecessary: Jaccard on card sets is cheaper and easier to explain.

**Computed** sizes, from the research's model of a 90-card deck (2026-11-09):

| Option                                                                                              | 1M decks     | 10M decks      | 50M decks       |
| --------------------------------------------------------------------------------------------------- | ------------ | -------------- | --------------- |
| PostgreSQL only (`int2[]`, GIN, five B-trees)                                                       | 0.7–0.9 GB   | 7.4–8.8 GB     | 37–44 GB        |
| Added roaring card index                                                                            | 0.12–0.15 GB | 1.2–1.4 GB     | 5.8–7.2 GB      |
| [Typesense](https://typesense.org/docs/guide/system-requirements.html) (2–3× indexed data in RAM)   | 2–3 GB RAM   | 20–30 GB RAM   | 100–150 GB RAM  |
| [Algolia](https://www.usagepricing.com/blueprint/algolia), records only (third-party price figures) | ≈ $360/month | ≈ $3,960/month | ≈ $19,960/month |

One [Hetzner AX42](https://www.hetzner.com/dedicated-rootserver/matrix-ax/) (64 GB RAM, 2 × 1.92 TB NVMe) cost €79–99 a month plus €49 setup, excluding VAT, on 2026-11-09. By the research's estimate it holds PostgreSQL, the application and a roaring index up to about 50 million decks. Hetzner raised prices twice in 2026 ([report](https://hostingjournalist.com/news/hetzner-to-significantly-raise-cloud-and-server-prices-in-2026)); check the live list before ordering.

## Data model

```
SourcePolicy  id, name, tier (now|userAuthorized|linkOut|partnership|out), license, licenseUrl, termsReadAt, commercialUse (allowed|forbidden|unknown), attribution, storedFields[]
IngestRun     id, sourceId, startedAt, endedAt, userAgent, robotsTxt, optOutSignals[], stoppedBy? (block|challenge|optOut|takedown), added, updated, removed
OptOut        id, scope (site|author|deck), sourceId, externalRef, receivedAt, honoredAt
CardKey       cardId (int2, assigned by popularity rank), oracleId, name, bulkFileDate
IndexedDeck   id, sourceId, deckId? | externalId?, sourceUrl, title?, commanderCardIds[], companionCardId?, colorIdentity (5 bits), size, legal, declaredBracket?, estimatedBracket, estimateMethod, priceCents?, priceDate?, sourceUpdatedAt, lastSeenAt, cards int2[], canonicalHash int8, clusterId, isRepresentative, preconId?
CorpusStat    id, scope, metric, value, sampleSize, decksPerSource, windowStart, windowEnd, corpusVersion, computedAt
LinkTemplate  sourceId, kind (commander|card|search), template, verifiedAt, verifiedBy
```

`IndexedDeck` has no field for descriptions, primers, comments, tags or external author handles. The absence is the policy, and a test guards it. An I-08 deck references `Deck` through `deckId` and shows its author through I-08's profile, as today. **Computed**: a row is about 442 bytes. `CardKey` uses Scryfall's Oracle ID, which MTGJSON describes as "consistent across reprints and unique among same-named cards" ([identifiers](https://mtgjson.com/data-models/identifiers/)), resolved from the printing IDs `DeckCard` already stores. Raw source payloads, where a license allows keeping them, are stored compressed outside PostgreSQL with a retention date.

## Non-goals

- Bulk collection from Moxfield, Archidekt or EDHREC by crawling, through their internal APIs or `json.edhrec.com`, without a signed agreement.
- Republishing decklists from those sites, or from any site whose terms do not grant it.
- Copying EDHREC's statistics, Lift, average decks or salt scores.
- A metadata index of unlicensed sources. MTGGoldfish and Aetherhub publish `Content-Signal: search=yes` ([robots.txt](https://www.mtggoldfish.com/robots.txt)), but their terms were unreadable (403); revisit only after reading them and a legal review.
- Live meta-search of other sites (requirement 3.2), and framing their pages.
- Pages grouping one person's decks across sites.
- A deck importer, a collection importer or account sync. Those stay in I-10 and I-26.
- Price comparison, purchase links or a card-trading marketplace.
- A paywall on the index, deck pages, card data or statistics.
- Tournament win rates; the roadmap's block stands.

## Testing strategy

- **Policy (solitary):** a source whose robots.txt disallows our agent, or that returns `tdm-reservation: 1`, a reserving `Content-Signal`, a 403 or a challenge, ingests nothing, records the evidence and is not retried. No ingest code sets `Origin`, `Referer` or a cookie for a source.
- **Schema guard:** `IndexedDeck` has no description, primer, comment, tag or author field; an ingest fixture carrying them persists none.
- **Visibility (sociable):** making an I-08 deck private removes it from search in the same transaction; share-token and private decks never appear.
- **Opt-out:** a push-back entry for a site, author or deck excludes it on the next ingest and removes what is already indexed.
- **Canonical hash:** reordered lines, other printings and a re-save keep the hash; double-faced cards resolve to one Oracle ID.
- **Deduplication:** fixtures for a precon copy at Jaccard 0.9, a near-duplicate pair, and an LSH candidate that exact Jaccard rejects.
- **Search correctness:** include, exclude, and/or and "N of M" queries on a fixture corpus match a brute-force reference.
- **Performance:** a synthetic corpus of 1 million and 10 million decks with a skewed card distribution, measuring p95 latency for queries on the most common cards. The result decides 8.2 and is recorded.
- **Link-out:** each template has a fixture, and a test asserts that rendering the row makes no outbound request.
- **Statistics:** below the threshold the figure is withheld; every figure renders its label, sources, sample and window; a recomputation from the same corpus version matches.
- **Free access:** search, deck pages and statistics render signed out, and no index route checks a subscription.

## Delivery slices

| #   | Slice                                                                                                                                                               | Depends on                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0   | Source register with one `SourcePolicy` per researched source, including the paths I-09 and I-10 already call; public source page, privacy notice and takedown form | —                                       |
| 1   | Daily Scryfall bulk job: `CardKey` dictionary from Oracle IDs, and dated prices                                                                                     | —                                       |
| 2   | Canonical form and hash for I-08 public decks, kept in step with visibility                                                                                         | 1                                       |
| 3   | Synthetic benchmark at 1M and 10M decks: GIN against a roaring index                                                                                                | 2                                       |
| 4   | Deck search over I-08 decks: commander, color identity, card include and exclude with and/or, freshness, quality defaults; signed-out access                        | 2                                       |
| 5   | Link-out row from verified templates, with the no-request test                                                                                                      | 0                                       |
| 6   | Licensed sources: cEDH Decklist Database, then MTGJSON precons through I-17's catalog; push-back list enforced                                                      | 0, 2; I-17 slice 1 for precons          |
| 7   | Deduplication: exact hash, precon-copy label, near-duplicate clusters                                                                                               | 4, 6                                    |
| 8   | Bracket facet, declared and estimated; Commander Spellbook combos once its data license is confirmed                                                                | 4; I-28 slice 2                         |
| 9   | Budget facet from bulk prices: total and per-commander decile                                                                                                       | 1, 4                                    |
| 10  | "Decks like mine" and the cohort diff                                                                                                                               | 7                                       |
| 11  | Computed statistics with labels, thresholds and corpus versions                                                                                                     | 6                                       |
| 12  | Roaring card index                                                                                                                                                  | 3, only if its result requires it       |
| 13  | Partner-fed sources: Moxfield, Space Cow Media, TopDeck.gg                                                                                                          | **Blocked** on a signed agreement; 0, 3 |

Slices 0, 1 and 5 ship alone: a published source policy, a card dictionary other initiatives can reuse, and links into every other site. Slice 4 is the first search a player can use, and slice 13 is where "largest" becomes possible.

## Open questions

- **What do we offer partners?** Possible terms: referral traffic measured and reported to them, attribution and a link on every result, their data kept free of any paywall, and a defined GDPR controller arrangement. Space Cow Media runs the aggregator this index would compete with, and Moxfield said in 2020 that it sends EDHREC its Commander data daily. Whether either has a reason to agree is unknown.
- **Do the shipped fetches meet requirement 1?** I-10's Moxfield import and profile listing send `Origin` and `Referer` headers set to `https://moxfield.com`, and I-09 reads `json.edhrec.com` server-side whenever its cache for a commander expires (`src/app/api/meta/[commanderSlug]/route.ts`). Those initiatives own the answer, but a published source policy that shipped code contradicts is worse than none. Decide before slice 0 goes public.
- **Is a paid tier for tools compatible with the Fan Content Policy and Scryfall's rules?** This is the research's question 9 for a French IP/IT lawyer, alongside the eleven others (database-right status of each source, opt-out machine-readability, GDPR basis for handles). Should a direct Wizards license come first?
- **Commander Spellbook's data license.** The code is MIT; the combo data's terms were not found. Ask the maintainers before slice 8.
- **Ownership of imported decks.** A checkbox warranty is cheap; a code placed in the source deck's description proves ownership but adds friction. Which one gates indexing under 2.2?
- **Minimum sample for statistics,** and how long an external deck stays after it was last seen.
- **Does "largest" mean keeping decks beyond two years?** EDHREC keeps a rolling two-year window. Keeping older decks is the only way to exceed its count, and it only matters once partner data exists.
