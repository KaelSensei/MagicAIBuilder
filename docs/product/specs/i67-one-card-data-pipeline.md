# I-67: One Card Data Pipeline

> **Initiative:** I-67, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next. Slices 1, 2 and 4 need nothing outside the initiative and can start today; slice 3 waits for the runner chosen in slice 0 and, on Vercel, for [I-63](i63-one-notification-system.md) slice 5; slices 14 and 15 are Later; slice 16 is Parked. Never paid · **Written 2026-11-10**
> **Research:** one dated note on Scryfall's bulk files, API rules, terms, tags, migrations and image change; MTGJSON's files, licence, decks and sealed products; Vercel, GitHub Actions and Supabase limits; and measurements made for this spec on Scryfall's files of 2026-11-09. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** every scheduled read of Scryfall's bulk files, sets and migrations and of MTGJSON; the local card, printing, set, related-card, today's-price, rulings and Oracle-tag tables, their keys and versions; the run report; change detection and the typed change log; the fallback and conformance checks; moving per-request card reads onto those tables; the User-Agent and attribution rules for card data; the exit path. **Does not own:** what a consumer does with a change; the job route, lease and stale-job alert (I-63 slice 5); player notices (I-63's `notify()`); price history, alerts and the archive ([I-59](i59-prices-over-time-and-alerts.md)); markets and price labels ([I-32](i32-seller-handoff-and-affiliate-carts.md)); rules versions and their publishing ([I-48](i48-official-changes-reach-every-deck.md)); variant legality ([I-42](i42-commander-variants-duel-cedh-pauper.md)); rulings display ([I-47](i47-rules-answers-for-this-deck.md)); the precon catalogue model ([I-17](i17-precon-path-and-tiered-upgrades.md)); the Tagger licence answer ([I-54](i54-find-your-next-commander.md) open question 1); migrating stored image URLs to WebP ([I-05](../roadmap.md#i-05-production-safety)); free-text search ([I-14](i14-verifiable-natural-language-search.md)).
> **For the integrator:** place I-67 right after I-63 in the order. [Re-pointed ownership](#re-pointed-ownership) lists each sentence to change, including "I-29 slice 1 or I-32 slice 2".

## Overview

Sixteen specs hold at least seventeen slices or items that assume a daily Scryfall job or a local card table, and their owner is ambiguous: I-59 waits for "the single daily job of I-29 slice 1 or I-32 slice 2". Six plan to fetch Scryfall data on a schedule themselves.

| Spec and slice                                                                                                     | Priority            | What it plans                                                    | What it waits for today                                                          |
| ------------------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [I-29](i29-cross-site-deck-index.md) slice 1                                                                       | Ships alone         | Daily bulk job, `CardKey` dictionary, dated prices               | Owns a job                                                                       |
| I-32 slice 2                                                                                                       | Next                | Dated price snapshot                                             | "reads I-29 slice 1's prices instead if that has shipped; never two jobs"        |
| I-59 slice 3                                                                                                       | Later (core)        | `PrintingKey`, `PricePoint`                                      | "I-32 slice 2 or I-29 slice 1 (one job)"                                         |
| I-47 slice 3                                                                                                       | Next                | Rulings bulk import, weekly                                      | Owns a job                                                                       |
| I-48 slices 6, 9                                                                                                   | Next (6), Later (9) | Drafts compared with Scryfall; "under review"                    | Live searches; I-42's drift check                                                |
| I-54 slices 1, 2                                                                                                   | Next                | Commander catalogue from bulk; Oracle Tags join                  | "I-29 slice 1 (build that slice here if it has not shipped; never a second job)" |
| [I-65](i65-how-this-deck-wins.md) slice 8                                                                          | Next                | Route roles from Oracle Tags                                     | "I-29 slice 1 and I-54 slice 2 (build the join there, never twice)"              |
| [I-58](i58-mana-base-builder.md) slice 5                                                                           | Next                | Land catalogue, weekly refresh                                   | Its open question 5: "bulk data or batched searches?"                            |
| [I-19](i19-offline-game-night-viewing.md) token item                                                               | Next                | Tokens from `all_parts`                                          | No source named                                                                  |
| [I-57](i57-printing-preferences-everywhere.md) slice 3; I-42 slice 2; [I-50](i50-play-this-deck-online.md) slice 1 | Next                | Printing resolver; legality per load; platform data per printing | Scryfall per batch or per load                                                   |
| I-17 slice 1                                                                                                       | Next                | Dated precon lists                                               | No source named; I-29 rates MTGJSON precons "Now"                                |
| [I-18](i18-per-deck-radar-of-new-cards.md) slice 1; [I-40](i40-installable-app-and-card-scanning.md) slice 8       | Later               | Dated set corpus; recognition index from bulk data               | The Scryfall cache; its own script                                               |
| [I-66](i66-running-costs-and-margin.md) moves 2, 11                                                                | —                   | One CDN-cached list; local card lookups                          | "I-29 slice 1's daily job"                                                       |

Built one by one, this gives several schedules (daily, weekly, per load), four key schemes (I-29's `CardKey`, I-59's `PrintingKey`, I-50's `CardPlatformInfo`, I-58's `LandFacts`) and no shared answer when Scryfall changes a format, as it did on 2026-07-20 [11]. I-67 builds the shared part once: one scheduled ingest, one set of versioned tables keyed by stable integers, one change log that consumers read through cursors, one fallback, one conformance check, and one exit path. It is Next because most rows are Next-priority work, and seven slices cannot run at all without a bulk file or MTGJSON: I-32 slice 2, I-47 slice 3, I-54 slices 1 and 2, I-58 slice 5, I-19's token item and I-17 slice 1. I-48's draft check (slice 6) also wants Game Changer and legality changes as data before the Commander announcement Wizards expects by the end of 2026.

## What the market does

Read 2026-11-10. How Moxfield, Archidekt or EDHREC load card data is not stated on any page read, so this section compares sources and runners, not competitors.

**Scryfall's bulk files** [1][2][12]. The index lists seven files, each a gzipped JSONL file. Uncompressed sizes and counts are **computed** from the files of 2026-11-09.

| File                     | Compressed             | Uncompressed | Objects                                                   | Updated (UTC)           | I-67 use                             |
| ------------------------ | ---------------------- | ------------ | --------------------------------------------------------- | ----------------------- | ------------------------------------ |
| Oracle Cards             | 25,444,300             | 211 MB       | 39,288 Oracle IDs; 53 Game Changers; 12,608 related cards | 2026-11-09 22:02        | Daily: cards, legality, relations    |
| Default Cards            | 81,070,372             | 656 MB       | 120,053 printings, 110,879 paper; 1,066 sets              | 2026-11-09 22:06        | Daily: printings, prices, images     |
| Rulings                  | 5,422,271              | 26 MB        | 79,706 rulings, 34,142 distinct texts                     | 2026-11-09 22:00        | Daily                                |
| Oracle Tags              | 6,104,530              | 19 MB        | 4,617 tags, 240,148 taggings                              | 2026-11-09 22:00        | Daily; display waits for the licence |
| All Cards                | 403,879,112            | —            | Every language                                            | 2026-11-09 22:24        | Not now; slice 14 (French names)     |
| Unique Artwork, Art Tags | 39,253,603; 13,385,707 | —            | Artworks and art tags                                     | 2026-11-09 22:03; 22:01 | Not ingested; no consumer            |

At 08:30 UTC on 2026-11-10 the index still listed the files of 22:00–22:25 the night before: one build a day [2]. Scryfall calls them "daily exports", "collected once every 12-24 hours", warns that prices are "dangerously stale after 24 hours", and says weekly or post-release downloads suffice for gameplay data [1]. Its rate-limit page is stricter about names: "If you need to rapidly look up card names, prices, or resolve a large number of card images, you must use the bulk data files"; search, named, random and collection calls allow 2 a second, `/cards/manifest` 10 a minute, a 429 limits a client for 30 seconds, and `*.scryfall.io` file origins "do not have rate limits" [4]. Migrations announce a merged or deleted Scryfall ID [7]; the manifest lists cards with their image dates, 15,000 a page [8]. Tags "are subject to change", slugs are not permanent identifiers, and "Downstream applications are strongly recomended to implement a way to temporarily disable display of individual tags"; no licence is stated [6].

**Scryfall changes formats on short notice.** On 2026-07-01 it announced JSONL files, with the old format gone on 2026-07-20 [11]. On 2026-10-14 it retired four JPEG sizes from 2027-01-01, ended PNG hotlinking, added `image_updated_at`, announced strict User-Agent enforcement for API and scripted image requests, and said its documentation will ask "large/popular applications" to re-serve their own copy of the images, "not currently a hard requirement" [10]. Its terms let it "change, terminate, or restrict access to any aspect of Scryfall, at any time, without notice", with notice before material changes to the terms themselves [5].

**MTGJSON** [14]–[20]. MIT-licensed, notice required [14]. Version `5.3.0+20261109`; the nine files checked were last modified on 2026-11-09 near 06:11 UTC, while the FAQ says builds "go live at 9:00AM EST" [16][20]. AllPrintings is 184 MB compressed, AllDeckFiles 263 MB, AtomicCards 52 MB [16]. DeckList holds 3,144 decks, 206 of them "Commander Deck", including the Star Trek decks due on 2026-11-13; each deck card carries its Scryfall ID and Oracle ID, Cardmarket and Card Kingdom IDs, and a deck links its sealed products [17]. Sealed products sit on each set with `contents` since v5.2.2 [18]; cards carry `foreignData` with translated names [19]. Every file has a `.sha256`. MTGJSON lists Scryfall among its sources, so it is not independent of Scryfall [20].

**Where an ingest can run.** A Vercel Hobby function runs at most 300 seconds with 2 GB and one vCPU, in `iad1` unless set [21]. GitHub-hosted runners are free in public repositories, and this repository is public; scheduled runs use the default branch only, "can be delayed during periods of high loads", and are disabled after 60 days without repository activity [22][23]. Supabase Free caps one stored file at 50 MB [24] and, per I-66, the database at 500 MB and storage at 1 GB.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **No ingest.** No file reads `api.scryfall.com/bulk-data`, `data.scryfall.io` or MTGJSON; no `vercel.json` exists; the three workflows in `.github/workflows` have no schedule; `src/lib/meta/snapshots.ts` records "no cron job". `LEGAL.md` credits Scryfall for prices; nothing uses or credits MTGJSON.
- **The shared cache (#1322, `9ff37837`).** `CardCache` (24 hours, 2,000 rows, 50 KB a body) and `ScryfallSearchCache` (1 hour, 200 rows, 500 KB a page) are bounded in `src/lib/cache-limits.ts`, whose comment says "the 512 MB free-tier database"; I-66 found 500 MB. Only `src/lib/scryfall/shared-cache.ts` writes them, from `server-fetch.ts`. `/api/cache/cards` allows 120 fills a minute per IP and instance, `/api/cache/search` 60.
- **User-Agents.** `src/lib/http.ts` sends `MagicAIBuilder/1.0 (+https://magicaibuilder.com)`, a domain I-66 found unregistered. `src/lib/scryfall/client.ts`, which the browser also runs, sets `User-Agent: MagicAIBuilder/1.0` on its own fetches; Scryfall asks browser JavaScript to "keep the browser's User-Agent intact" [3]. `request-queue.ts` spaces requests 100 ms apart, five times faster than the 2-a-second search limit (I-05's open item).
- **Per-request reads.** Name lookups, `/cards/collection` (`batch-fetch.ts`, `commander-pairing.ts`, `verified-package-cards.ts`, `DeckWizard.tsx`, `ai/suggest`), printings (`useCardPrintings.ts`), French names (`useLocalizedDeckIndex.ts`), rulings (`rulings.ts`) and `/sets` (`SetAutocomplete.tsx`) call Scryfall directly, from the browser or a server route. `fetchAllPages` stops at 20 pages.
- **Game Changer and banned flags are frozen.** `useGameChangers.ts` and `useBanlist.ts` fetch `is:gamechanger` and `banned:<key>` in the browser, cached 24 hours. `store.ts` sets `isGameChanger` and `isBanned` from those name sets when a card is added; `POST /api/decks/[id]/cards` stores the client's values; `stats.ts` and `bracket.ts` count the stored flags; nothing recomputes them. This is I-48's defect. Oracle Cards of 2026-11-09 marks 53 Game Changers, matching I-48's current version [12].
- **Card facts are copied, not referenced.** `DeckCard` copies mana cost, mana value, type line, Oracle text, colour identity, both flags, price and two image URLs, with no Oracle ID; `CollectionCard`, `CardFavorite` and `CardPackageCard` copy names, prices and images; `DeckSnapshot.cardList` is JSON. No card, printing, set, ruling or tag table exists. `ScryfallCard` (`types.ts`) lacks `game_changer`, `all_parts`, `released_at`, `produced_mana`, `image_updated_at` and every price but `usd`, `usd_foil` and `eur`.
- **Images.** `images.ts` builds JPEG paths for every size. The unmerged branch `fix/scryfall-webp-images` (`4ffb922a`, `b4ef7ad0`) uses `thumb`, `grid`, `display`, `crop` and `art`, maps stored JPEG-era URLs through `normalizeScryfallImageUrl`, and builds `/<size>/<side>/<a>/<b>/<id>.webp` from a printing ID. Scryfall's own URLs add `?<image_updated_at as epoch seconds>` [12].

## Functional requirements

### 1. Ground rules

1.1 **One pipeline.** Only I-67 downloads a bulk file, calls `/sets` or `/migrations` on a schedule, or reads MTGJSON. Consumers read I-67's tables and change log.
1.2 **A computation index, not a card database.** No public card page, card download, card API or offline card database comes from these tables ([strategic boundaries](../roadmap.md#strategic-boundaries); Scryfall forbids simply repackaging or proxying its data [3]).
1.3 **Free and anonymous; never paid.** No read of card data needs a plan or a sign-in [3], and I-30 keeps card data free ([I-30 1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). No part of I-67 justifies the paid tier: lower costs make paid tools such as I-59's alerts above the allowance cheaper to run, and those stay with their specs and I-30.
1.4 **Deterministic and dated.** No model writes these tables or decides a value read from them. Every value carries the run that wrote it and the source file's `updated_at`; a surface showing legality, Game Changers or prices can say "card data of 9 November 2026".

### 2. Sources and cadence

2.1 Daily: Oracle Cards, Default Cards, Rulings and Oracle Tags, each only when its `updated_at` is newer than the last loaded; Scryfall's `/sets` and `/migrations`; MTGJSON's `Meta.json`. On `set.added` and weekly: MTGJSON's `DeckList.json`, then only new deck and set files. Not read: Unique Artwork, Art Tags, All Cards (until slice 14), MTGJSON prices (I-59 open question 4).
2.2 The run starts at 23:00 UTC, after Scryfall's build; on Vercel Hobby the minute varies within the hour, as I-63's notes on Vercel scheduling say. The owner can start a run or a dry run by hand, for example on an announcement day.
2.3 Files are streamed, unzipped and parsed line by line, never held whole in memory or stored in the database. **Measured:** Node 22 parsed and hashed Default Cards in 6.8 s with 139 MB of memory on one core [12]. Each file's SHA-256, bytes, object count and `updated_at` are recorded; a file already loaded is skipped. MTGJSON files are checked against their `.sha256` [20].

### 3. Tables, keys and versions

3.1 **Tables:** `CardOracle` (one row per Oracle ID, with the Commander-family legalities, Game Changer flag and gameplay fields), `CardPrinting` (every Default Cards object, with `games`), `CardSet`, `CardRelation` (from `all_parts`: tokens, meld parts, combo pieces), `CardPrice` (today's price per printing), `CardRuling` with deduplicated `RulingText`, `CardTag` and `CardTagging`.
3.2 **Keys.** Oracle cards and printings get `int4` keys, assigned once and never reused; Scryfall IDs are columns. `int2` cannot hold them: it stops at 32,767, the file holds 39,288 Oracle IDs, and 32,643 are Commander-legal [12].
3.3 **Atomic load.** A file loads into staging, passes the gates of 5.1, and its diff applies in one transaction. Readers never see half a file. Files load independently. A row absent from a file is marked `missingSince`, not deleted; it goes after seven absent runs (proposal) or a migration (6.3).
3.4 **Run report:** per file, the source date, bytes, hash, objects, rows added, changed, unchanged and missing, events by kind, duration, each table's size, gate results and warnings. Owners see it on an admin page.

### 4. Change detection and events

4.1 Each row keeps a hash of the fields consumers read, so a changed URI or rank emits nothing. The diff emits typed events into `CardDataChange`:

| Event                 | Payload (keys, codes and dates only) | Emitted when                                                       | Read by                                       |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------- |
| `oracle.added`        | oracleKey                            | A new Oracle ID                                                    | I-54 catalogue, I-58 lands, I-65 roles        |
| `oracle.changed`      | oracleKey, fields[]                  | Name, cost, type, text, identity, keywords or mana produced change | I-47 notes review, I-54, I-58, I-65           |
| `legality.changed`    | oracleKey, format, from, to          | A legality changes                                                 | I-42 2.6, I-48 1.6, I-58 4.4, I-73            |
| `gameChanger.changed` | oracleKey, from, to                  | `game_changer` flips                                               | I-48 1.5–1.6, I-54, I-58 4.5                  |
| `printing.added`      | printingKey, oracleKey, set, reprint | A new printing                                                     | I-18, I-57, I-59 reprint watch, I-40, I-73    |
| `set.added`           | setKey, type, releasedAt             | A new set                                                          | I-18, I-17 (slice 13), I-57's set check, I-73 |
| `printing.migrated`   | old ID, new ID or none, strategy     | A Scryfall migration                                               | 6.3, I-59, I-17                               |
| `image.updated`       | printingKey, imageVersion            | `image_updated_at` changes                                         | I-19 offline copies, I-40 index               |
| `prices.published`    | fileDate, printings, values          | Default Cards prices applied                                       | I-59 slice 3, I-32, I-45                      |
| `rulings.changed`     | oracleKey, added/changed/removed     | The rulings diff                                                   | I-47 2.8                                      |
| `tags.changed`        | tagKey, kind                         | A tag or its taggings change                                       | I-54 slice 2, I-65 slice 8, I-37 slice 18     |
| `conformance.failed`  | check, expected, found               | A check in 6 fails                                                 | I-48 1.6, I-42 2.4, the owner                 |

4.2 One catalogue entry per event type holds its payload schema, dedupe key and readers, following I-63's catalogue ([I-63 2](i63-one-notification-system.md#2-event-model-and-catalogue)). A contract test rejects payloads with free text or URLs.
4.3 After a file commits, the run passes each registered consumer the events after its cursor. Handlers are idempotent; a failing one is retried next run and never rolls back the load.
4.4 I-67 notifies no player. A consumer that should tell a player calls I-63's `notify()`.
4.5 Prices produce one `prices.published` per run, never one event per printing; moves and alerts are I-59's.
4.6 The first load emits only `dataset.initialised`. Events are kept 180 days, purged on write (proposal). A Game Changer or legality event is evidence: it never changes a rules version, which I-48's moderator publishes (I-48 1.4).

### 5. Failure and fallback

5.1 **Gates.** A line missing a required field fails its file. Before applying, the file's object count is within 3% of the last one unless new sets explain it; every printing's Oracle ID exists; more than 20 legality or Game Changer events hold the file for an owner's confirmation. A held or failed file leaves the previous data live and reports to Sentry. An unknown top-level field is a warning, so a format change surfaces on its first day. The thresholds are proposals for the owner to confirm. Added 2026-11-10: a `not_legal` to `legal` event that [I-73](i73-every-set-release-ready-on-day-one.md#7-operational-readiness) slice 4 classifies as a set's release-day switch (`isReleaseLegalitySwitch`) is reported on its own line of the run report and not counted toward the threshold of 20, so a set turning legal does not hold the file.
5.2 A printing absent from the tables, such as a card spoiled after the last file, is read through the shared cache (#1322) and labelled "live from Scryfall"; the run report counts these misses. If Scryfall is down, reads stay local and nothing a player sees changes.
5.3 A file not loaded for 36 hours alerts the owner, on I-63 10.3's mechanism. After 72 hours, surfaces showing legality, Game Changers or prices name the data date as stale. Prices keep I-32 2.3's 24-hour label.

### 6. Conformance and migrations

6.1 **Daily sample.** 25 random printings and every Game Changer are compared with `/cards/:id`, spaced 100 ms apart [4], on Oracle text, legalities, `game_changer`, set and collector number. A difference the file's age does not explain is reported.
6.2 **Counts.** The totals of `is:gamechanger` and `banned:commander` searches must match the local counts; a mismatch emits `conformance.failed`, which I-48 1.6 and I-42 2.4 turn into "under review". In CI the checks run on recorded fixtures; the live checks run only on schedule, so the network never fails a build.
6.3 **Migrations.** A merge rewrites the old Scryfall ID in `DeckCard`, `CollectionCard`, `CardFavorite`, `CardInFavoriteList`, `CardPackageCard` and I-67's tables in one transaction, and snapshots map it at read. A delete flags affected rows for their owners and removes nothing. Both appear in the run report [7].

### 7. Local reads instead of per-request calls

7.1 Local first, the API only for a miss:

| Today                                                                      | Becomes                                                                                                   | Slice |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----- |
| `getCardById` through `/api/cache/cards`                                   | Printing and Oracle rows by key; shared cache for misses only                                             | 9     |
| `useGameChangers`, `useBanlist` in the browser                             | One CDN-cached list from local data until I-48 slice 1 serves its version; other formats' lists stay here | 9     |
| `SetAutocomplete` calling `/sets`                                          | `CardSet`                                                                                                 | 9     |
| `/cards/collection` and exact names (imports, wizard, packages, AI checks) | A local name index with front-face names [4]; fuzzy matching stays on the API                             | 10    |
| `searchCardPrintings` in the printing selector                             | Local printings of the Oracle card with today's prices                                                    | 10    |
| `rulings.ts` per card                                                      | Local rulings in one deck response (I-47 2.6)                                                             | 6     |
| Free-text search, autocomplete, `lang:` printings, random                  | Stay on Scryfall: its syntax is its engine, and I-14 shows the query                                      | —     |

7.2 New code reads card facts by key from the tables, not from the copies on `DeckCard`; I-67 rewrites copies only for migrations (6.3). Once slice 9 ships, `MAX_CARD_CACHE_ROWS` falls from 2,000 to 200 and the comment in `cache-limits.ts` says 500 MB.

### 8. Terms, User-Agent and images

8.1 Every server request to Scryfall or MTGJSON sends `MagicAIBuilder/<semver> (+<contact URL>)` and an `Accept` header, the version raised on notable changes [3][10]. The contact URL is a domain the owner holds (I-66 5.4) or, until then, the repository's URL. Code that runs in the browser sets no User-Agent [3].
8.2 After a 429, the run stops calling the API for at least 30 seconds and the rest of the day's checks are skipped [4].
8.3 Images stay on `cards.scryfall.io`. A printing stores `imageVersion` and `imageStatus`, not URLs; URLs are derived through the WebP helper with `?<imageVersion>`, and a placeholder or low-resolution image says so [9][10].
8.4 `LEGAL.md` and I-29's source page credit Scryfall and carry MTGJSON's MIT notice [14]. A weekly check hashes Scryfall's terms and API rules pages and alerts the owner on a change.

### 9. Storage

9.1 **Estimate**, from the measured row counts and field bytes [12], with 28 bytes of row overhead and one index per lookup:

| Tables                                      | Rows                                   | Estimate                          |
| ------------------------------------------- | -------------------------------------- | --------------------------------- |
| `CardOracle`                                | 39,288 (317 bytes of fields each)      | 17 MB                             |
| `CardPrinting`                              | 120,053 (115 bytes each)               | 29 MB                             |
| `CardPrice`                                 | 104,561 priced paper printings         | 8 MB; up to 16 MB between vacuums |
| `CardRuling`, `RulingText`                  | 79,706 links; 34,142 texts, 6.7 MB     | 15 MB                             |
| `CardTag`, `CardTagging`                    | 4,617; 240,148                         | 22 MB                             |
| `CardSet`, `CardRelation`, runs, change log | 1,066; 12,608; one run a day; 180 days | 7 MB                              |
| **Total**                                   |                                        | **about 100 MB**                  |

9.2 I-66 kept 100 MB of Supabase's 500 MB for caches and other tables and reached 1,100 stored accounts. I-67 alone fills that margin. With the search cache's 100 MB worst case and a 200-row card cache (10 MB), about 290 MB remain: about 800 stored accounts at I-66's 0.36 MB each (computed). Shrinking the search cache or moving to Pro is I-66's decision. The run report records each table's size for I-66 7.4's database alert.
9.3 Outside the database: the raw files, streamed and discarded; I-59's price archive, whose daily file of about 0.8 MB fits Supabase's 50 MB file limit [24]; MTGJSON archives, never kept. A mirrored image library would hold about 6.7 GB of `grid` WebP for paper printings alone (110,879 × I-66's 60.6 KB average), beyond the 1 GB free storage, so slice 16 stays Parked.

### 10. MTGJSON as a secondary source

10.1 New "Commander Deck" lists become I-17 catalogue versions, each card matched to `CardPrinting` by its Scryfall ID; an unmatched card is reported, never guessed [17].
10.2 Sealed contents come from the new set's file, for I-17's "what is in the box" [18]. MTGJSON never overrides Scryfall data. Its prices are not read until I-59 open question 4 is answered.

### 11. Exit path

11.1 Every source sits behind one `CardSource` adapter (list files, read Oracle cards, printings, sets, rulings, tags). Tables use our names and keys; Scryfall IDs are columns.
11.2 If Scryfall's terms close bulk use, an MTGJSON adapter rebuilds cards, printings, rulings and legalities with the same keys, since MTGJSON carries Scryfall IDs [17]. It does not replace prices, Oracle Tags or images: MTGJSON draws on Scryfall [20], and no other image source was researched. Without images the product shows text and links out (open question 3). A quarterly exit drill builds `CardOracle` from MTGJSON in CI and reports differences from the Scryfall-built table (slice 15).

## Data model / API

```
CardOracle     key Int @id, oracleId @unique, name, nameKey, manaCost, manaValue, typeLine, oracleText, faces Json?,
               colors[], colorIdentity[], keywords[], producedMana[], power?, toughness?, loyalty?, layout,
               legal Json {commander, duel, paupercommander, ...}, gameChanger, reserved, contentHash, changedRunId, missingSince?
CardPrinting   key Int @id, scryfallId @unique, oracleKey, setKey, collectorNumber, lang, releasedAt, rarity, games[],
               finishes[], frame, borderColor, frameEffects[], promoTypes[], fullArt, promo, digital, artist?,
               arenaId?, mtgoId?, cardmarketId?, tcgplayerId?, imageVersion Int, imageStatus, contentHash, missingSince?
CardSet        key Int @id, code @unique, name, setType, releasedAt?, arenaCode?, mtgoCode?, cardCount, digital
CardRelation   oracleKey, relatedScryfallId, relatedOracleKey?, component (token|meld_part|meld_result|combo_piece), name, typeLine
CardPrice      printingKey @id, day, usd?, usdFoil?, usdEtched?, eur?, eurFoil?, eurEtched? (Int, minor units), sourceUpdatedAt
RulingText     key Int @id, sha256 @unique, comment            CardRuling  oracleKey, textKey, source (wotc|scryfall), publishedAt
CardTag        key Int @id, tagId @unique, slug, label, parentKeys[], hidden Boolean   -- hidden is the kill switch of [6]
CardTagging    tagKey, oracleKey, weight (very_strong|strong|median|weak)  @@id([tagKey, oracleKey])
CardDataRun    id, job, file, sourceUpdatedAt, sha256, bytes, objects, status (loaded|skipped|held|failed), counts Json, startedAt, finishedAt
CardDataChange id, runId, kind, payload Json, createdAt         CardDataCursor  consumer @id, lastChangeId
```

Readers: `getOracle(key)`, `getPrinting(scryfallId)`, `printingsOf(oracleKey)`, `resolveNames(names[])`, `cardDataAsOf()` in `src/lib/card-data/`; `src/lib/card-data/testing.ts` gives consumers fixtures and `expectCardDataChange`. Job: `card-data` on I-63's `/api/jobs/[job]`, or the same entry point from a scheduled workflow (slice 0). Route: `GET /api/card-data/lists?format=` (CDN-cached).

## Non-goals

- Public card pages, a card search engine over these tables, a card download or API, an offline card database.
- Mirroring Scryfall's images now (slice 16, Parked), or storing raw bulk files.
- Reading prices from anyone but Scryfall's daily data, or converting currencies.
- Notifying players, publishing rules versions automatically, rewriting the copies on `DeckCard` beyond migrations (7.2), or replacing Scryfall search.

## Testing strategy

- **Reader (solitary):** recorded excerpts of each file parse; a missing required field fails the file; an unknown field warns; the hash skips a reloaded file.
- **Loader (sociable, test database):** two consecutive excerpts produce the expected rows and events; a reload changes nothing; a held file leaves the previous rows; a half-applied load is impossible; an absent printing is marked, not deleted.
- **Events:** the catalogue contract test; a failing consumer is retried and the load stays; the first load emits only `dataset.initialised`.
- **Migrations:** a merge rewrites every table of 6.3 and nothing else; a delete removes nothing.
- **Reads:** each row of 7.1 serves the same answer as the recorded API response for a fixture deck; a miss falls back and is labelled; no browser module sets a User-Agent.
- **Keys and scale:** a test fails if a key column is `int2` or a key is reused; slice 0 records one Default Cards load in production conditions: duration, memory, bytes and table sizes.

## Delivery slices

| #   | Slice                                                                                                                                                                      | Depends on                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 0   | Spike and decisions: one Default Cards load on a Hobby function against Supabase in Ireland, measured; runner chosen; contact URL; free database space (with I-59 slice 0) | — (owner; spike code is thrown away)                                     |
| 1   | Bulk reader: index read, streamed download and parse, line guards, hashes, `CardSource` interface, fixtures; no writes                                                     | —                                                                        |
| 2   | `CardOracle`, `CardPrinting`, `CardSet` (with `/sets`), `CardRelation`; staging, gates, atomic diff, run report, owner page                                                | 1                                                                        |
| 3   | Scheduled run: `card-data` job with lease, catch-up, dry run, 36-hour alert                                                                                                | 0, 2; I-63 slice 5 if the runner is the job route                        |
| 4   | `CardDataChange`, catalogue and contract test, cursors, consumer harness, retention                                                                                        | 2                                                                        |
| 5   | `CardPrice` for every printing, `prices.published`                                                                                                                         | 2, 4                                                                     |
| 6   | Rulings: `CardRuling`, `RulingText`, `rulings.changed`                                                                                                                     | 1, 4                                                                     |
| 7   | Oracle Tags: `CardTag`, `CardTagging`, the kill switch, `tags.changed`; no display                                                                                         | 1, 4                                                                     |
| 8   | Migrations: daily read, merges rewritten, deletes flagged, report                                                                                                          | 2, 4                                                                     |
| 9   | Local reads, first wave: cards by key, the CDN-cached lists, sets; card cache cut to 200 rows                                                                              | 2                                                                        |
| 10  | Local name index and printing lists for imports, the wizard, packages, AI checks and the selector                                                                          | 2, 5                                                                     |
| 11  | Conformance: daily sample, count checks, `conformance.failed`, weekly terms hash                                                                                           | 3, 4                                                                     |
| 12  | `imageVersion`, `imageStatus`, derived WebP URLs, `image.updated`                                                                                                          | 2; the I-05 WebP item merged                                             |
| 13  | MTGJSON: Meta, DeckList, new Commander decks into I-17's catalogue, sealed contents, MIT notice                                                                            | 2, 4; I-17 slice 1's model                                               |
| 14  | French names per Oracle card from All Cards, weekly (Later)                                                                                                                | 2; open question 5                                                       |
| 15  | Exit drill: MTGJSON adapter in CI with a difference report (Later)                                                                                                         | 2, 13                                                                    |
| 16  | Image mirror through `/cards/manifest` (Parked)                                                                                                                            | 12; **Blocked** on Scryfall requiring it or the owner's storage decision |

Slices 1, 2 and 4 can start today in sequence; 5 to 10 follow in parallel. Scheduled agents must not pick slice 3 before slice 0's runner choice is committed.

**What each slice unblocks.** The integrator copies these edges into the consumers' tables.

| I-67 slice | Unblocks                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2          | I-29 slice 1 (keys), I-54 slice 1, I-58 slice 5, I-19's token item, I-18 slice 1, I-40 slice 8; the `DeckCard.oracleId` backfill for I-37 slice 12 with no API call |
| 4          | I-48 slices 6 and 9's evidence, I-42 slice 6, I-57 slice 3's set check, I-59 slice 10, recompute on change for I-54, I-58 and I-65                                  |
| 5          | I-32 slice 2, I-59 slice 3, I-57 slice 13, I-58 slice 10, I-29 slice 9, I-53's price rules, I-44's balance view                                                     |
| 6, 7       | I-47 slices 3 and 4; I-54 slice 2's Tagger clauses, I-65 slice 8 and I-37 slice 18, still blocked for display on the licence                                        |
| 9, 10      | I-66 moves 2 and 11; I-57 slice 3 and I-62's imports resolved locally; I-02 slice 8's card check without the 2-a-second limit                                       |
| 11, 12, 13 | I-48 1.6 and I-42 2.4; I-05's "derive from `scryfallId`" and I-19's image freshness; I-17 slice 1's import and I-29 slice 6's precons                               |

### Re-pointed ownership

| Where                                                                     | Today                                                                                                | Change to                                                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| I-29 slice 1; data model                                                  | "Daily Scryfall bulk job: `CardKey` dictionary … and dated prices"; `cardId (int2 …)`                | "Index keys from I-67's `CardOracle.key`"; depends on I-67 slice 2; `int4`, or a stated ceiling (3.2) |
| I-32 slice 2; `PriceSnapshot`                                             | "reads I-29 slice 1's prices instead if that has shipped"                                            | Labels and stale rules on I-67's `CardPrice`; depends on I-67 slice 5                                 |
| I-59 2.1, 2.2; slice 3; `PrintingKey`                                     | "the single daily job of I-29 slice 1 or I-32 slice 2"; "I-32's `PriceSnapshot` is the latest point" | I-67 slice 5; the latest point is `CardPrice`; `PrintingKey` is `CardPrinting.key`                    |
| I-63 10.1; its unblocks row for slice 5; roadmap I-63 item and order note | "the single daily price job (I-29 slice 1 or I-32 slice 2)"                                          | "I-67's `card-data` job (I-67 slice 3)"                                                               |
| Roadmap I-59 "Depends on" and series item                                 | "I-29 slice 1 or I-32 slice 2 for the one daily job"                                                 | I-67 slice 5                                                                                          |
| I-47 2.1; slices 3 and 7                                                  | Its own weekly import; its own freshness check                                                       | I-67 slice 6 loads daily; slice 3 keeps the reading side; slice 7 becomes I-67 slice 11               |
| I-54 7.1; slice 1                                                         | "the bulk card dictionary that I-29 slice 1 introduces"                                              | I-67 slices 2 and 7                                                                                   |
| I-65 slice 8                                                              | "I-29 slice 1 and I-54 slice 2 (build the join there, never twice)"                                  | I-67 slice 7 and I-54 slice 2                                                                         |
| I-58 slice 5; open question 5                                             | "weekly refresh"; "bulk data or batched searches?"                                                   | Built from `CardOracle`, rebuilt on I-67 events; depends on I-67 slices 2 and 4; question closed      |
| I-48 1.5; slices 6 and 9                                                  | Live `is:gamechanger` and `banned:commander` comparison                                              | I-67's events and slice 11's count check                                                              |
| I-42 slice 2; I-50 slice 1; I-57 slice 3                                  | Scryfall per load or per batch                                                                       | No new dependency; I-67 slices 9 and 10 switch the source                                             |
| Roadmap I-19 token item; I-18 slice 1; I-40 slice 8                       | `all_parts`, set corpus and index from Scryfall                                                      | I-67 slice 2 (and 4 for I-18)                                                                         |
| I-17 slice 1; I-29 slice 6                                                | Source unnamed; "MTGJSON precons through I-17's catalog"                                             | I-67 slice 13                                                                                         |
| I-37 slice 12 and I-47 slice 3                                            | Both add `DeckCard.oracleId`                                                                         | I-37 slice 12 adds it, backfilled from `CardPrinting`; I-47 slice 3 drops it                          |
| I-66 moves 2 and 11                                                       | "I-29 slice 1's daily job"                                                                           | I-67 slice 9                                                                                          |

## Open questions

1. **Runner.** A Hobby function has 300 seconds and runs in `iad1` by default [21], while the documented database pooler is `aws-0-eu-west-1` (`docs/engineering/infrastructure.md`); a scheduled workflow is free on this public repository but can be delayed, runs only from `main`, stops after 60 idle days and holds the database secret in Actions [22][23]. Slice 0 measures; the owner chooses.
2. **Tagger tags.** Loading them for computation is slice 7; showing anything derived from them waits for Scryfall's written answer ([I-54 open question 1](i54-find-your-next-commander.md#open-questions)), with the kill switch either way [6].
3. **For the lawyer and Scryfall** (research, not legal advice): does storing Scryfall data and serving derived values stay clear of "simply repackage, republish, or proxy" [3]? Does a 180-day change log, or I-48's public "what changed" page built from it, count as republishing? With no researched image alternative, what does the exit path owe players?
4. **Image mirror.** If Scryfall's documentation makes re-serving a requirement for "large/popular applications" [10], about 6.7 GB of storage is needed (9.3). At what traffic does the owner accept that cost?
5. **French names.** All Cards (404 MB compressed) weekly, MTGJSON's `foreignData`, or today's per-deck `lang:fr` searches? Scryfall finds a French printing for 31,393 cards [13]. Decide with [I-11](../roadmap.md#i-11-localization-and-regional-experience) before slice 14.

## Sources

1. Scryfall, [Bulk Data Files](https://scryfall.com/docs/api/bulk-data), read 2026-11-10.
2. Scryfall, [bulk-data index](https://api.scryfall.com/bulk-data), read 2026-11-10 at 08:30 UTC.
3. Scryfall, [API documentation: required headers and use of Scryfall data](https://scryfall.com/docs/api), read 2026-11-10.
4. Scryfall, [Rate Limits](https://scryfall.com/docs/api/rate-limits), read 2026-11-10.
5. Scryfall, [Terms of Service](https://scryfall.com/docs/terms), read 2026-11-10.
6. Scryfall, [Tags](https://scryfall.com/docs/api/tags), read 2026-11-10.
7. Scryfall, [Card Migrations](https://scryfall.com/docs/api/migrations), read 2026-11-10.
8. Scryfall, [`/cards/manifest`](https://scryfall.com/docs/api/cards/manifest), read 2026-11-10.
9. Scryfall, [Cards](https://scryfall.com/docs/api/cards) and [Card Imagery](https://scryfall.com/docs/api/images), read 2026-11-10.
10. Scryfall blog, [New WebP images + JPEG Deprecations](https://scryfall.com/blog/new-webp-images-jpeg-deprecations-237), 2026-10-14.
11. Scryfall blog, "Two New Ways to Sync Scryfall Data", 2026-07-01, on the [API & Data category page](https://scryfall.com/blog/category/api), read 2026-11-10.
12. Computed for this spec on 2026-11-10 from Scryfall's files of 2026-11-09: [Oracle Cards](https://data.scryfall.io/oracle-cards/oracle-cards-20261109220204.jsonl.gz), [Default Cards](https://data.scryfall.io/default-cards/default-cards-20261109220647.jsonl.gz), [Rulings](https://data.scryfall.io/rulings/rulings-20261109220032.jsonl.gz) and [Oracle Tags](https://data.scryfall.io/oracle-tags/oracle-tags-20261109220034.jsonl.gz). Field bytes count the columns of the data model above; timings on one AMD EPYC core with Node 22.23.4.
13. Scryfall API, [`lang:fr` search](https://api.scryfall.com/cards/search?q=lang%3Afr&include_multilingual=true): 31,393 cards with `unique=cards`, 60,395 printings with `unique=prints`, 2026-11-10.
14. MTGJSON, [License](https://mtgjson.com/license/), read 2026-11-10.
15. MTGJSON, [All Files](https://mtgjson.com/downloads/all-files/), read 2026-11-10.
16. MTGJSON, [`Meta.json`](https://mtgjson.com/api/v5/Meta.json) and the `Content-Length` and `Last-Modified` headers of [`AllPrintings.json.gz`](https://mtgjson.com/api/v5/AllPrintings.json.gz), `AllDeckFiles.tar.gz` and `AtomicCards.json.gz`, 2026-11-10.
17. MTGJSON, [`DeckList.json`](https://mtgjson.com/api/v5/DeckList.json) and [`WeAreTheBorg_TRC.json`](https://mtgjson.com/api/v5/decks/WeAreTheBorg_TRC.json), counted 2026-11-10.
18. MTGJSON, [Sealed Product data model](https://mtgjson.com/data-models/sealed-product/), read 2026-11-10.
19. MTGJSON, [Foreign Data data model](https://mtgjson.com/data-models/foreign-data/), read 2026-11-10.
20. MTGJSON, [FAQ](https://mtgjson.com/faq/), read 2026-11-10.
21. Vercel, [Vercel Functions Limits](https://vercel.com/docs/functions/limitations), last updated 2026-08-24.
22. GitHub Docs, [Events that trigger workflows: `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), read 2026-11-10.
23. GitHub Docs, [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), read 2026-11-10; the repository's visibility read with `gh repo view` the same day.
24. Supabase, [File limits](https://supabase.com/docs/guides/storage/uploads/file-limits), read 2026-11-10.
