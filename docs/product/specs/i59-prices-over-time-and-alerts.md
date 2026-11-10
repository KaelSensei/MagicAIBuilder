# I-59: Prices Over Time And Alerts

> **Initiative:** I-59, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later; slices 0 to 2 can ship now · **Written 2026-11-10**
> **Research:** dated notes of 2026-11-10 on price sources and their terms, price history and alerts in nine player tools, the effect of reprints, and a measurement of Scryfall's daily bulk file. The notes are not committed, so every external fact cites a numbered entry in [Sources](#sources).
> **Owns:** the dated price series per printing in EUR and USD, its retention and archive; deck and collection value over time; the "price moved" marks on a player's lists; the reprint watch; alert rules, their evaluation, the in-app inbox and the email digest; the neutral wording rules for prices. **Does not own:** the daily Scryfall job ([I-29](i29-cross-site-deck-index.md) slice 1); the market choice and today's dated price ([I-32](i32-seller-handoff-and-affiliate-carts.md) slices 2 and 3); today's collection valuation, spare copies and the holdings archive ([I-45](i45-selling-spare-cards.md)); the lists themselves: the acquisition plan ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)), the wanted list ([I-56](i56-wishlists-friends-can-buy-from.md)), want lists ([I-44](i44-trade-lists-within-the-pod.md)) and upgrade bundles ([I-17](i17-precon-path-and-tiered-upgrades.md)); the printing choice and the swap-price defect ([I-57](i57-printing-preferences-everywhere.md)); the set corpus ([I-18](i18-per-deck-radar-of-new-cards.md)); finish and date added on deck rows ([I-37](i37-editor-depth.md)); the email sender, retention and defaults for minors ([I-38](i38-trust-safety-and-user-rights.md)); the paid line and billing ([I-30](i30-business-model-and-paid-tier.md)); the marketplace decision ([I-33](i33-marketplace-ladder.md)).
> **Proposed reassignment, for the integrator:** I-32's price watch (requirements 6.3 and 6.4, slice 12), I-45's value history (5.1, slice 12) and I-56's wanted items in the price watch (slice 18) move here, so that one series and one alert engine serve every list.

## Overview

Today a deck row holds one USD price, sent by the browser when the card was added and never refreshed. Nothing records its date. The collection's "Total Value" sums the same kind of number. No price is kept over time, so a player cannot see what a deck cost when it was built, what it costs now, or when a card they want got cheaper.

I-59 keeps one dated price per printing per day, in euros from Cardmarket and in dollars from TCGplayer, both as Scryfall relays them. From that series it draws a printing's chart, a deck's value over time and a collection's value over time. It marks the cards on a player's own lists whose price moved, and it watches for announced reprints of those cards. Alerts deliver the same facts to an inbox or an email digest, and only when the player asked.

**The decision this spec argues: price history is card data.** It stays free, with no quota (requirement 1). What a player could pay for is the tool that watches lists and delivers alerts (requirement 9). Price sites already sell alerts: MTGStocks at 12.71 USD a month billed yearly, EchoMTG watchlists from 4 USD a month [13][14]. Moxfield and Archidekt have none [19][20]. The finance tools speak the language of trading: "Penny Stocks", "Rapid Riches", "Robinhood for your collection", "Buy/Sell Advisor" [13][14]. This product says what moved, by how much, from which source and between which dates, and nothing more.

## What the market does

Read on 2026-11-10 unless dated otherwise.

**Where prices come from.**

| Source         | What it provides                                                                                                                                                                                                                                                                            | History                                                                                                                                                  | Terms that matter here                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scryfall**   | `usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil`, `eur_etched` and `tix` per printing [4], synced "every 24 hours". USD is TCGplayer's market price; EUR is Cardmarket's "Trend Price, one-day average, seven-day average, average price, or suggested price, whichever is available" [2] | None: today's value only. Bulk prices are "dangerously stale after 24 hours"; use them "to track trends or provide a general estimate of card value" [3] | "You may not “paywall” access to Scryfall data", nor require "subscriptions … in exchange for access". "You may not simply repackage, republish, or proxy Scryfall data" [1]                              |
| **MTGJSON**    | AllPrices by card UUID; AllPricesToday for one day [5]                                                                                                                                                                                                                                      | "the past 90 days" [5]: 147.8 MB compressed, against 5.6 MB for one day, files of 2026-11-09 [6]                                                         | MIT licence for the project [7]; the pages read state no terms for the third-party prices inside                                                                                                          |
| **Cardmarket** | A daily price guide: average sell, low, trend, 1-, 7- and 30-day averages, foil variants. Trend is "as shown at the website"; the suggested price's algorithm "will not be made public" [8]                                                                                                 | Not in the file                                                                                                                                          | "Not accepting applications" for its API [10]. The API price guide was deprecated on 2024-06-05 when the guide moved to the website [8][9]; that page refused automated requests, so its terms are unread |
| **TCGplayer**  | —                                                                                                                                                                                                                                                                                           | —                                                                                                                                                        | "We are no longer granting new API access at this time" (API v1.39.0) [11]                                                                                                                                |

**History, value and alerts in player tools.**

| Product                         | History and value                                                                                                                                                           | Alerts                                                                                                                                                | Paid                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **MTGGoldfish**                 | Public price-history pages per set and index (search summary) [12]                                                                                                          | Listed among free tools; "unlimited" in Premium                                                                                                       | Premium 59.88 USD a year, with CSV price-history downloads (search summary; the page answered 403) [12]                       |
| **MTGStocks**                   | Collection value over time in Mythic: "Track your collection's historical value over time"                                                                                  | Free: a watch list of up to 50 cards. Mythic: "Price Alerts — Email, SMS, Telegram" and "Minute Movers"                                               | Mythic 12.71 USD a month, billed 152.49 a year; it also sells "Penny Stocks", "Underpriced Cards" and "CK: Rapid Riches" [13] |
| **EchoMTG**                     | Portfolio Dashboard from 8 USD a month                                                                                                                                      | A watchlist of 125 cards at 4 USD a month, 300 at 8 USD; a "Buy/Sell Advisor"                                                                         | Free plan capped at 500 cards; the 8 USD plan is "Robinhood for your collection" [14]                                         |
| **Deckbox**                     | Collection History restores earlier versions of an inventory, not prices                                                                                                    | None on the premium page                                                                                                                              | 3.99 USD or EUR a month billed yearly, 5.99 monthly; "Your collection stays free" [15]                                        |
| **ManaBox**                     | Six price sources, "updated every few hours" [16]; no history found                                                                                                         | None found                                                                                                                                            | PRO 2.49 USD a month or 22.99 a year [17]                                                                                     |
| **Dragon Shield** (MTG Scanner) | "30-day price history for any Magic card"; collection value over time; "top card winners and losers"; weekly emails                                                         | None found                                                                                                                                            | Free with in-app purchases from 1.99 to 39.99 USD [18]                                                                        |
| **Grimoria**                    | Price history on card pages                                                                                                                                                 | Wishlist target: "When the market price drops to or below your target, you'll receive a notification"; checked daily in USD and EUR; email and in-app | "Requires account"; paid status not stated [21]                                                                               |
| **Moxfield**                    | None found; a feedback-board request asks for "price spike indicators" in decklists (search summary) [19]                                                                   | None found                                                                                                                                            | —                                                                                                                             |
| **Archidekt**                   | None found. Staff, about seven years ago: "just saving prices daily so you could see the value of a deck changing over time … We'd need to store the extra data first" [20] | None found                                                                                                                                            | —                                                                                                                             |

**Reprints move prices, unevenly.** An MTGStocks analysis of 2024-01-24 found that shockland reprints lowered the average price, "but with some interesting caveats". Breeding Pool fell from 30 to as low as 15 USD around Return to Ravnica's release and to about 20 USD when Guilds of Ravnica was announced; around Ravnica Remastered its "downward trend in price actually slowed" [22]. Other reports found were anecdotal; no systematic study was found. **Computed** from Scryfall's bulk file of 2026-11-09 [23]: 410 paper reprint printings of 241 cards had a release date after 2026-11-10, 329 of them in Star Trek Commander and Star Trek, out on 2026-11-13. 286 already carried a price, and 5 had a preview date. A reprint is visible in Scryfall's data before it is released. **The gap:** alerts are sold; history is mostly given away. No product found scopes an alert to the missing cards of several decks net of owned copies, or tells a player that a card on their wanted list was just reprinted. Every finance tool read frames prices as trading.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10 by reading the code; nothing was run.

- **Price fields.** `DeckCard.price`, `CollectionCard.price` and `CardFavorite.price` in `prisma/schema.prisma` are `Float?`, with no currency, date, finish or source. There is no `Card` model; Scryfall bodies live as JSON in `CardCache`. The TypeScript `DeckCard` and `CollectionCard` types carry `price: number | null`. `ScryfallCard.prices` (`src/lib/scryfall/types.ts`) declares `usd`, `usd_foil` and `eur` only.
- **The browser sets the price.** `makeDeckCard` (`src/lib/deck/store-card-faces.ts`) reads `prices.usd`. The client posts it, `addCardSchema` (`src/lib/validation/card.ts`) accepts 0 to 100,000, and the server stores it unchecked. The collection route takes `price` from the request body the same way.
- **Nothing refreshes it.** `patchCardSchema` has no price field. `swapCardPrinting` (`src/lib/deck/store.ts`) patches `scryfallId`, `imageUri` and `artCropUri`, so a swapped printing keeps the old price (I-57 defect 2). Deck snapshots copy every row as JSON (`snapshotContent` in `src/lib/deck/deck-version.ts`), price included, but that is the price read when each card was added, not the deck's value on the snapshot date.
- **The cache keeps no history.** Since #1322 only the server writes `CardCache` (24 hours, at most 2,000 rows) and `ScryfallSearchCache` (1 hour, 200 rows), through `src/lib/scryfall/shared-cache.ts` and `server-fetch.ts`; each write prunes expired rows. Only `getCardById` reads through the card cache; name lookups and `/cards/collection` go from the browser to Scryfall. History accrued from traffic, as `MetaSnapshot` does for EDHREC data (one row per commander per UTC day, kept 365 days, "no cron job", `src/lib/meta/snapshots.ts`), would therefore be sparse and biased towards cards opened by ID. A search of `src/` and `prisma/` for price history, price snapshots and price dates finds nothing.
- **Three deck totals disagree.** `useDeckPrice` (`src/hooks/useDeckPrice.ts`), shown by `DeckPriceDisplay` in the stats panel, sums every row of `deck.cards` (main, sideboard and maybeboard) plus commander and partner. `computeDeckStats` (`src/lib/deck/stats.ts`) sums the main zone, commander and partner, and feeds the analysis diff. `buildExportMetadata` (`src/lib/export/stats-export.ts`) sums `deck.cards` without the command zone. None counts the companion. All are USD, as is the collection's total in `CollectionPageClient.tsx`, which sums stored price times quantity.
- **No job, no sender.** `.github/workflows` holds CI, Lighthouse and Sonar only; no cron route or mail library exists. `NotificationPreference` stores four toggles that nothing delivers.
- **The database is small.** `src/lib/cache-limits.ts` sizes the caches for "the 512 MB free-tier database", but Supabase's free tier holds 500 MB ([pricing](https://supabase.com/pricing); corrected 2026-11-10 from the [I-66](i66-running-costs-and-margin.md) spec). Hosting is Vercel with Supabase (`docs/engineering/infrastructure.md`).

## Functional requirements

### 1. Price history is card data

1.1 A printing's dated prices, in both currencies, are card data under the roadmap's [strategic boundaries](../roadmap.md#strategic-boundaries) and [I-30 requirement 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line). Every chart, value series and "moved" mark in requirements 3 to 5 is free, with no quota and no depth limit inside the stored window.
1.2 The argument. Each point is a Scryfall price the product already shows for free; the series only adds its date. Scryfall forbids requiring subscriptions "in exchange for access to Scryfall data" [1], and a stored chart of its prices is that access (research, not legal advice). MTGGoldfish publishes public history pages (search summary) [12] and Dragon Shield shows 30 days [18]. The series costs the same for one player or ten thousand, because it is shared. What grows with each player is a watch that runs and delivers, which [I-30 requirement 1.3](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line) allows to be paid. I-30 requirement 1.4 says nothing free becomes paid, so the owner confirms this line before slice 5 ships (open question 2).
1.3 History appears beside a player's own cards: deck rows, the collection, their lists and the printing selector. There is no public page per printing and no download or API of the series. The product therefore does not "simply republish" Scryfall's prices [1] and does not become a card database.

### 2. The series

2.1 Prices come only from Scryfall's daily data, read by the single daily job of I-29 slice 1 or I-32 slice 2 ([I-32 requirement 2.6](i32-seller-handoff-and-affiliate-carts.md#2-market-and-prices)). Never two jobs, never scraping, never TCGplayer's or Cardmarket's APIs, which are closed [10][11]. No currency conversion.
2.2 One point per printing per UTC day holds `usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil` and `eur_etched` in minor units, with the source and Scryfall's file timestamp. I-32's `PriceSnapshot` is the latest point, not a second table.
2.3 The database keeps points for **tracked printings**: those on a deck, in a collection, on a wanted list, a want list or a bundle, or named by an alert rule. Points are daily for 90 days, then one per ISO week (estimate under Data model).
2.4 A compressed daily file of every paper printing is archived outside the database with its hash. A printing that becomes tracked is backfilled from the archive on the next run.
2.5 A day the job missed is a gap. Charts draw gaps and never interpolate, and no alert fires on a missing or stale day. Totals and changes read the series; a row's stored `price` is shown only as "price when added" until its printing has points.

### 3. Value over time

3.1 One function defines a deck's value: the command zone and main deck in the total, the sideboard and maybeboard shown apart, unpriced cards counted, in one market. The stats panel, analysis diff, stats export, budget checks and charts all use it.
3.2 **Current list at past prices:** the deck's present rows priced on each past day, shown wherever the deck's total is shown, public deck pages included. Finish is nonfoil until I-37 slice 12 records it.
3.3 **As built:** each saved snapshot priced on its own date from its printing IDs, shown as named points. I-37's change history adds points when it ships.
3.4 **Collection:** the present collection at past prices, under [I-45 requirement 2](i45-selling-spare-cards.md#2-free-valuation-scryfall-prices-as-they-are). What the player owned on a past date stays I-45's archive (5.2). Ranges are 30 days, 90 days, one year and everything stored. Each point shows its priced and unpriced counts. Nothing is stored per player to draw these.

### 4. "Moved" marks on the player's lists

4.1 Deck rows, the acquisition plan, the wanted list, want lists and bundles show each card's change over a window the player picks (7, 30 or 90 days) in their market, computed when the list is opened. "Since added" becomes a window once I-37 slice 12 records when a card was added.
4.2 A mark appears only past a threshold set as both a percentage and an amount, so a 0.02 EUR card does not show +50%. The defaults are a design choice (open question 5). Marks never reorder a list; the player may sort by change, and the default order stays.
4.3 For "any printing" lines the reference is the cheapest paper printing in the market on each day ([I-44 requirement 2.2](i44-trade-lists-within-the-pod.md#2-lists)).

### 5. Reprint watch

5.1 Each run compares today's printings per Oracle ID with the day before. A new paper printing of a card on any tracked list is a reprint event, with its set, release date and the day it appeared.
5.2 Lists show, for example, "New printing: Star Trek Commander (TRC), out 2026-11-13; listed by Scryfall on 2026-11-09". A price Scryfall gives before release is labelled "before release". The watch states facts and links the card's chart; it never predicts what a reprint will do to a price.
5.3 I-18 stays the per-deck radar of new cards from released sets. This watch covers new printings, released or announced, of cards already on a list.

### 6. Alerts

6.1 A rule has a scope (one card or printing, the wanted list, a want list, a bundle, one deck's missing cards, or the whole acquisition plan), a market, a printing policy (exact or any) and one condition: at or below a target price; moved by at least a percentage and an amount in a chosen direction; or a reprint event.
6.2 Missing-card scopes read I-06's plan net of owned copies, and of committed copies once I-16 slice 4 ships. A card the player acquires leaves the scope by itself.
6.3 Rules run once a day after a successful job. A target rule fires when the price crosses to or below the target, and re-arms only after it rises above it again. A move rule fires once, then takes the new price as its reference.
6.4 An event records the printing, both prices with their dates, the change, the currency and the source. Rules can be paused, edited and deleted; deleting a list deletes its rules.

### 7. Delivery, consent and unsubscribe

7.1 No rule exists until the player creates one, and the in-app inbox is the default channel. Nothing is sent to bring a player back: no reminders, no streaks, no "you have not checked your prices". No alert concerns a card the player did not put on a list.
7.2 Email needs its own opt-in, off by default and recorded with its date, as [I-38 requirement 9.1](i38-trust-safety-and-user-rights.md#9-minors) keeps engagement notifications off by default. It uses I-38 slice 13's sender.
7.3 Email is a digest: at most one a day, grouped by list ([I-32 requirement 6.4](i32-seller-handoff-and-affiliate-carts.md#6-splitting-and-the-price-watch)). Each email carries a one-click unsubscribe that works without signing in, an HTTPS `List-Unsubscribe` with `List-Unsubscribe-Post: List-Unsubscribe=One-Click` [24], and a link to the rules.
7.4 An alert links to the card in the player's list, never to a seller. The seller handoff stays one step further, under I-32's disclosure rules. Rules and events are in the [I-38 export](i38-trust-safety-and-user-rights.md#7-full-data-export) and are deleted with the account. Event retention is I-38's call; this spec proposes 365 days.

### 8. Neutral display

8.1 Every figure shows its currency, its source ("Scryfall daily price, from Cardmarket" or "…from TCGplayer market price"), its date and the word "estimate" ([I-32 requirement 2.3](i32-seller-handoff-and-affiliate-carts.md#2-market-and-prices)).
8.2 A change shows both ends: "12.40 EUR on 2026-10-11 → 9.80 EUR on 2026-11-10 (−2.60 EUR, −21%)".
8.3 Up and down share one neutral colour; sign, arrow and words carry the direction ([I-49 requirement 2](i49-colour-vision-and-low-vision-display.md#2-a-second-channel-for-every-colour-signal-141)). A rise is not good news to a buyer, nor a fall to an owner.
8.4 Price and alert text never uses the words of trading or advice. English: buy, sell, deal, bargain, invest, portfolio, profit, loss, gain, spike, crash, hot, trending, opportunity, undervalued, underpriced. French: acheter, vendre, bonne affaire, investir, placement, portefeuille, bénéfice, perte, plus-value, flambée, effondrement, opportunité, sous-évalué. A CI check scans those message namespaces.
8.5 No forecast, trend line, moving average or catalogue-wide list of movers. Every chart says "Daily estimates. Past prices do not predict future prices." Each chart has a table view, keyboard access and a text summary: first, last, lowest and highest point, with dates.

### 9. Free and paid

9.1 Free, without quota: requirements 1 to 5 and 8, and the in-app inbox for alert rules up to an allowance the owner sets under I-30.
9.2 **Paid candidate for I-30:** rules above the allowance, list-wide scopes (the whole plan, every bundle) and the email digest. Players pay for alerts elsewhere [12][13][14]. Moxfield and Archidekt offer none [19][20]. No product found alerts on missing cards net of owned copies across decks, or on the reprint of a wanted card.
9.3 A paid alert carries the same free prices. Whether that still "paywalls" Scryfall data is I-32's question Q3 and I-30's legal gate; slice 13 waits for both. Nothing here is a "sell now" alert, a speculation feed or a ranking by spend ([I-45 requirement 5.5](i45-selling-spare-cards.md#5-paid-tier-candidates-for-i-30)).

## Data model / API

```
PrintingKey      key Int @id, scryfallId (unique), oracleId, paper, releasedAt, firstSeenOn
PricePoint       printingKey, day Date, usd?, usdFoil?, usdEtched?, eur?, eurFoil?, eurEtched? (Int, minor units),
                 source ("scryfall"), sourceUpdatedAt                                  @@id([printingKey, day])
PriceArchiveDay  day @id, objectKey, printings, values, bytes, sha256, sourceUpdatedAt
ReprintEvent     printingKey @unique, oracleId, setCode, releasedAt, seenOn
AlertRule        id, userId (cascade), scope (card|wanted|wantList|bundle|deckMissing|plan), scopeRef?, printingPolicy (exact|any),
                 market (eu|us), condition (atOrBelow|moved|reprint), targetMinor?, movePercent?, moveMinor?,
                 direction (down|up|either), armed, referenceMinor?, referenceDay?, pausedAt?, createdAt
AlertEvent       id, ruleId (cascade), printingKey, day, kind, fromMinor?, toMinor?, fromDay?, toDay?, currency, readAt?,
                 emailedAt?                                                            @@unique([ruleId, printingKey, day])
NotificationPreference + priceAlertEmail Boolean @default(false), priceAlertEmailConsentAt DateTime?
```

- `GET /api/prices/[scryfallId]/history?market=&range=` returns points, gaps and the source; signed in, rate-limited, one printing per call. `GET /api/decks/[id]/value-history?market=&range=&snapshots=1` and `GET /api/collection/value-history?market=&range=` return series.
- `GET`, `POST`, `PATCH`, `DELETE /api/alerts`; `GET /api/alerts/events`; `POST /api/alerts/unsubscribe?token=`, with a signed single-purpose token and no session.
- After the daily price read, the job writes the archive and the points for tracked printings, downsamples, diffs printings for reprints, evaluates rules and sends digests. Each run reports printings written, values per field, the share changed since the day before, and database and archive bytes.

**Storage, an estimate.** T, the number of tracked printings, is unknown until slice 0 measures it. Inputs measured in Scryfall's Default Cards file of 2026-11-09 [23]: 110,879 paper printings, 104,561 with a price, and 299,407 non-null values (`usd` 88,217, `usd_foil` 60,138, `usd_etched` 1,218, `eur` 89,776, `eur_foil` 60,058, `eur_etched` 0), so 2.86 values per priced printing. A PostgreSQL row has a 23-byte header plus a null bitmap, a 4-byte line pointer, and data aligned to 8 bytes [25]: 24 + 24 (key 4, day 4, 2.86 × 4) + 4 = 52 bytes. A primary-key entry adds about 20 bytes; with page overhead, about 76 bytes a point. For comparison, MTGJSON's 90-day file, with more providers, is 147.8 MB [6]; 90 days of the archive below is 71 MB.

| Layout                                        | Arithmetic                                                      | Result                                                                         |
| --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Every priced printing, daily, in PostgreSQL   | 104,561 × 76 B a day; × 365 a year                              | 7.9 MB a day, 2.9 GB a year; a 500 MB database is full in about nine weeks     |
| Tracked printings: 90 days daily, then weekly | T × (90 + 40) × 76 B in year one; T × 52 × 76 B each later year | 10,000 printings: 99 MB, then 40 MB a year. 50,000: 494 MB, then 198 MB a year |
| Daily archive file: integer keys, cents, gzip | 787,576 B measured × 365                                        | 287 MB a year, outside the database                                            |

## Non-goals

- A public page, download, feed or API of price history; a card price database.
- Catalogue-wide movers, "penny stocks" or "underpriced" lists; forecasts and trend lines.
- Advice to buy or sell, "sell now" alerts, or alert text written by a language model.
- Prices from seller APIs or scraping, MTGJSON's third-party prices before their terms are known, MTGO `tix` prices, and currency conversion.
- SMS, Telegram or webhook delivery (push waits for [I-40](i40-installable-app-and-card-scanning.md)); listing, checkout or any other marketplace step ([I-33](i33-marketplace-ladder.md)).

## Testing strategy

- **Solitary:** the deck value function by zone, companion, quantity and unpriced cards; downsampling keeps one point per ISO week; change text and rounding in EUR and USD; any-printing references; the reprint diff over two fixture days; rule crossing, re-arming and the stale-day guard.
- **Job (sociable, on contract fixtures):** two recorded excerpts of Scryfall's bulk file produce the expected points, gaps and events; rerunning a day writes nothing new; a failed day leaves a gap and sends nothing; a printing that becomes tracked is backfilled.
- **Wording and access:** the word list over English and French namespaces; one colour for up and down; every chart shows currency, source, date and the forecast note; a chart's table view and summary work with a screen reader; the history route refuses signed-out and bulk calls.
- **Consent:** no email without opt-in; one-click unsubscribe without a session; deleting the account deletes rules and events; the export holds them.
- **E2E:** a deck's chart in EUR and in USD; a target rule fires once in the inbox.

## Delivery slices

| #   | Slice                                                                                                                            | Depends on                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 0   | Measure tracked printings (distinct Scryfall IDs in decks, collections and favourites) and free database space; record both      | —                                                        |
| 1   | One deck value function for the panel, analysis diff, stats export and budget checks; label "USD, read when each card was added" | —                                                        |
| 2   | Neutral wording and colour checks in CI (8.3, 8.4)                                                                               | —                                                        |
| 3   | `PrintingKey`, `PricePoint`, the writer for tracked printings, downsampling and the run report                                   | 0; I-32 slice 2 or I-29 slice 1 (one job)                |
| 4   | Daily archive with its hash; backfill of newly tracked printings                                                                 | 3; open question 1                                       |
| 5   | Printing chart in the printing selector, then in the card panel                                                                  | 2, 3; I-37 slice 4 for the panel                         |
| 6   | Deck value over time: current list and snapshot points; totals read the series                                                   | 1, 2, 3; I-32 slice 3                                    |
| 7   | Collection value over time                                                                                                       | 2, 3; I-45 slice 4                                       |
| 8   | "Moved" marks on deck rows and the acquisition plan                                                                              | 2, 3                                                     |
| 9   | Marks on the wanted list, want lists and bundles                                                                                 | 8; I-56 slice 1, I-44 slice 1, I-17 slice 3              |
| 10  | Reprint watch and its marks                                                                                                      | 3                                                        |
| 11  | Alert rules and the in-app inbox                                                                                                 | 8, 10                                                    |
| 12  | Email digest with opt-in and one-click unsubscribe                                                                               | 11; I-38 slice 13                                        |
| 13  | Paid entitlement above the free allowance                                                                                        | 11; I-30 slices 0 and 11; **Blocked** on open question 3 |
| 14  | "Since added" window                                                                                                             | 8; I-37 slice 12                                         |

Slices 0 to 2 fix what players see today and need no decision. Slice 3 is the core and waits for the daily job.

## Open questions

1. **Storage.** How many printings are tracked, does the database stay on its free tier, and where does the archive live? A storage bucket is a new external service, which the boundaries allow only with an exit path. Slice 0 answers the first part.
2. **The free line.** Does the owner accept that price history is card data and free for good (requirement 1)? I-30 requirement 1.4 makes the choice permanent. It also reverses I-45's paid "value history" and I-32's paid "price history of one's own plan", which is why the header proposes moving them, with I-32's price watch and I-56 slice 18, into this spec.
3. **Lawyer and Scryfall** (research, not legal advice; for I-30's list). Is a paid alert carrying free Scryfall prices "paywalling" them (I-32 Q3)? Does a stored chart shown only beside the player's own cards stay clear of "simply repackage, republish, or proxy" [1]? Are price-alert emails a service the player asked for, or prospecting that needs another consent, including for minors (I-38 9.3)?
4. **MTGJSON seed.** May the first 90 days come from MTGJSON's AllPrices [5], or does its MIT licence not reach the provider prices inside [7]? Until answered, history starts on slice 3's first run.
5. **Defaults.** Which mark threshold, as percentage and amount, and which free alert allowance? Both are hypotheses to set with I-30 and test with players.

## Sources

1. Scryfall, [API documentation: Use of Scryfall Data](https://scryfall.com/docs/api), read 2026-11-10.
2. Scryfall, [Where do Scryfall prices come from?](https://scryfall.com/docs/faqs/where-do-scryfall-prices-come-from-7), read 2026-11-10.
3. Scryfall, [Bulk Data Files](https://scryfall.com/docs/api/bulk-data), read 2026-11-10; files updated 2026-11-09.
4. Scryfall, [Card Objects](https://scryfall.com/docs/api/cards), read 2026-11-10.
5. MTGJSON, [All Files](https://mtgjson.com/downloads/all-files/), read 2026-11-10.
6. MTGJSON, [AllPrices.json.gz](https://mtgjson.com/api/v5/AllPrices.json.gz) and [AllPricesToday.json.gz](https://mtgjson.com/api/v5/AllPricesToday.json.gz): HTTP headers only, last modified 2026-11-09, read 2026-11-10.
7. MTGJSON, [License](https://mtgjson.com/license/) (MIT, 2018 to present) and [FAQ](https://mtgjson.com/faq/), read 2026-11-10.
8. Cardmarket, [API 2.0 documentation: Price Guide](https://apiv2.cardmarket.com/ws/documentation/API_2.0:PriceGuide), deprecated 2024-06-05, read 2026-11-10.
9. Cardmarket, [Adding Non-Singles and Accessories to the Price Guide](https://news.cardmarket.com/en/FoW/adding-non-singles-and-accessories-to-the-price-guide), 2024-10-28. The [price guide page](https://www.cardmarket.com/en/Magic/Data/Price-Guide) answered HTTP 403.
10. Cardmarket, [Cardmarket API](https://help.cardmarket.com/en/cardmarket-api), read 2026-11-10.
11. TCGplayer, [Getting Started](https://docs.tcgplayer.com/docs/getting-started), API v1.39.0, read 2026-11-10.
12. MTGGoldfish, [Premium](https://www.mtggoldfish.com/premium) and [home page](https://www.mtggoldfish.com/), search summaries of 2026-11-10; the premium page answered HTTP 403.
13. MTGStocks, [Go Premium](https://www.mtgstocks.com/go-premium), read 2026-11-10.
14. EchoMTG, [Plans](https://www.echomtg.com/plans/), read 2026-11-10.
15. Deckbox, [Premium](https://deckbox.org/premium), read 2026-11-10.
16. ManaBox, [Card prices](https://manabox.app/guides/general/prices-in-the-app/), undated, and [Subscriptions](https://manabox.app/guides/general/subscriptions/), read 2026-11-10.
17. ManaBox, [App Store listing](https://apps.apple.com/us/app/manabox-mtg/id1460407674), version 4.3.0, read 2026-11-10.
18. Dragon Shield, [MTG Scanner on the App Store](https://apps.apple.com/app/id1460657155), version 8.2.1, read 2026-11-10.
19. Moxfield feedback board, [#2655](https://moxfield.nolt.io/2655), search summary of 2026-11-10.
20. Archidekt forum, [Suggestions, Big and Small](https://archidekt.com/forum/thread/16865), posts about seven years old, read 2026-11-10.
21. Grimoria, [Price alerts](https://grimoria.app/help/wishlists/price-alerts), build 2.3.49 (2026110901), read 2026-11-10.
22. Corey Williams, [Shocklands and the Ramifications of Staple Reprints in Magic](https://www.mtgstocks.com/news/10732-shocklands-and-the-ramifications-of-staple-reprints-in-magic), MTGStocks, 2024-01-24.
23. Computed for this spec on 2026-11-10 from Scryfall's Default Cards file updated 2026-11-09 22:06 UTC (81,070,372 bytes compressed), listed by the [bulk-data endpoint](https://api.scryfall.com/bulk-data). The archive figure is that day's prices as a CSV with integer keys and cents, compressed with gzip at level 9.
24. IETF, [RFC 8058: Signaling One-Click Functionality for List Email Headers](https://datatracker.ietf.org/doc/html/rfc8058), January 2017.
25. PostgreSQL 18, [Database Page Layout](https://www.postgresql.org/docs/current/storage-page-layout.html), read 2026-11-10.
