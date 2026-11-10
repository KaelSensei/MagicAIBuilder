# I-45: Selling Spare Cards: Collection Value, Buylists And Seller Exports

> **Initiative:** I-45, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed 2026-11-09 · **Priority:** Later, with a no-regret first part (slices 0 to 3) that may be pulled forward · Written 2026-11-09
> **Mirrors:** [I-32](i32-seller-handoff-and-affiliate-carts.md), which covers the buy side only. I-45 reuses its [market and price rules](i32-seller-handoff-and-affiliate-carts.md#2-market-and-prices) and its [disclosure rules](i32-seller-handoff-and-affiliate-carts.md#1-disclosure-and-ordering) unchanged.
> **Owns:** the spare-copy computation and keep marks, seller and buylist export adapters, the free valuation of spare copies and of the collection total, the inventory report, and three paid-tier candidates (value history, snapshot archive, buylist comparison). **Does not own:** the market choice and the dated price snapshot (I-32 slices 2 and 3), ownership and printing identity ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)), the commitment index ([I-16](i16-decks-buildable-from-a-collection.md)), collection imports ([I-26](i26-collections-arriving-from-elsewhere.md)), the free/paid line and billing ([I-30](i30-business-model-and-paid-tier.md)), the marketplace decision ([I-33](i33-marketplace-ladder.md)), have and want lists between players ([I-44](i44-trade-lists-within-the-pod.md)), moderation ([I-38](i38-trust-safety-and-user-rights.md)).
> **Research:** fetches made on 2026-11-09, starting from a dated feature-gap note. The notes are not committed, so every external fact cites its own source. Legal points are research, not legal advice.
> **Why Later:** the demand is real but adjacent to deckbuilding. The free valuation must reuse I-32's price snapshot rather than build a second one, and every paid part waits for I-30's legal gate and a feed contract. Slices 0 to 3 need neither and can be scheduled once their dependencies ship.

## Overview

Commander players own more copies than their decks use. A trade binder, a box of upgrades taken out of precons, a stack of cards from a cut deck: the player wants to know what that pile is worth and to sell it without typing every card again on a buyer's site. Today MagicAIBuilder can say what a deck still needs (I-06's acquisition plan) and I-32 will send that plan to a seller's cart. Nothing goes the other way.

I-45 is the mirror of I-32. It computes the **spare copies**: copies owned beyond those the player's decks use, minus copies the player marks to keep. It values them for free with Scryfall's prices shown as they are: dated, with currency and source. It exports them in the format a buyer or marketplace accepts, so the player uploads the file on that site. **MagicAIBuilder never handles a sale, money or shipping.** The roadmap's [marketplace non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark) stays in force.

What a deckbuilder adds that a price app does not is the deck-aware spare list. Bulkwise, Card Kingdom's tool and Archidekt's export start from a list the player already made [1] [8] [10]. MagicAIBuilder knows which copies sit in which deck, so it never offers to sell a card the player is playing.

## What the market does

All pages were read on 2026-11-09 unless another date is given. Reddit posts were read through the Arctic Shift archive, because Reddit blocks automated reads; scores are as archived.

**Sell-side tools.**

| Product                        | What it does for a seller                                                                                                                                                                                                                                              | Free or paid                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Bulkwise** (2026-09-20)      | Imports a ManaBox, Moxfield, Archidekt or Deckbox CSV; prices each card with Scryfall's daily data; shows "what Card Kingdom's buylist would pay vs. market"; builds a sell list; "exports a file you can upload straight into Card Kingdom's sell tool"; USD only [1] | "Free, no account, no ads"; also free price history and a trade calculator. 41 points, 27 comments [1] |
| **Archidekt** (Jan 2026)       | "The old "Buy" button on the deck page has become "Buy/Sell" … as we now allow exports to Card Kingdom's buylist", also per category [8]. Staff: "Cardmarket does not have a way of accepting a bulk export of cards" [9]                                              | Free                                                                                                   |
| **EchoMTG** (2026-09-15)       | Bulk Analyzer, "a new Pro-tier tool for traders and LGS owners", builds an offer sheet on someone else's collection file. The insurance report is "open to all logged-in users"; "The gate moved to the export actions (Print / CSV / JSON)" [7]                       | Bulk Analyzer and report export paid; tiers Basic, Collector, Financer, Pro, LGS [7]                   |
| **A French tool** (2026-01-19) | "Marre de lister mes cartes une par une sur MKM": photograph a binder page, get Cardmarket trend prices, sell locally. The pain: searching each card and checking "les vendeurs de la même langue et version" [2]                                                      | Beta; 18 points, 22 comments [2]                                                                       |

**Player signals.** A Moxfield user with "a trade binder of ~400 cards as a Collection" copies prices by hand to compare TCGplayer, Card Conduit and an LGS buylist (2026-09-03) [3]. A stolen trade binder thread drew 113 comments; the owners had "a list of all of the cards" but proof of ownership for only a few (2025-03-01) [4]. A French binder worth "quelques milliers d'euros" appeared for 400 € on Leboncoin (2026-07-12) [5]. French sellers ask about Cardmarket's 30-sale and 2,000 € reporting thresholds (2025-11-17) [6].

**Buyers and marketplaces: what they accept.**

| Buyer                              | Kind                       | What a seller can send                                                                                                                                                                                                                                                                                                                    | Price data and terms                                                                                                                                                                                                            |
| ---------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Card Kingdom**                   | Retailer buylist (US, USD) | CSV upload, paste or a public URL. First four columns: `"Title"` (in quotes), Edition, Foil (`1/true/yes` or `0/false/no`), Quantity; "All other data will be unused". At most 500 unique titles or 5,000 cards; cannot add to an existing sell cart; desktop Chrome or Firefox only [10]. Cards not on the buylist are not imported [11] | An unauthenticated JSON price list with `price_buy`, `qty_buying`, edition, foil and `scryfall_id` per row, created 2026-11-09 [12]. No terms of use found: `/terms` redirects to the home page                                 |
| **TCGplayer**                      | Marketplace                | Its Trade-in/Buylist program was sunset on 2024-07-17 (search summary) [13]                                                                                                                                                                                                                                                               | API closed to new developers ([I-32](i32-seller-handoff-and-affiliate-carts.md))                                                                                                                                                |
| **ChannelFireball**                | —                          | `channelfireball.com` redirects (301) to a TCGplayer content page [14]. No store or buylist                                                                                                                                                                                                                                               | —                                                                                                                                                                                                                               |
| **Star City Games**                | Retailer buylist (US)      | "CSV Upload" on the Sell List after login; formats from TCGplayer, MTGStocks, MTGGoldfish, Deckbox and SCG's own download; up to 2,500 lines; unmatched rows flagged (search summary) [15]                                                                                                                                                | Not researched                                                                                                                                                                                                                  |
| **Cardmarket**                     | Marketplace (EU, EUR)      | **No documented CSV stock upload.** Sellers enter offers on a bulk listing page [17]. TCGPowerTools, described as a Cardmarket API partner, imports CSV files keyed by Cardmarket or Scryfall ID (vendor guide, 2026-10-21) [17]. The API takes no new applications and credentials must not be shared with third-party apps [16]         | A daily price guide file (`trend`, `avg1`, `avg7`, `avg30`, `low`, foil variants, per product ID) has been "available to all users" since 2024-10-28 [18] [19]. Its terms of use were not found; the download page returned 403 |
| **CardTrader**                     | Marketplace (EU)           | Not verified: its seller documentation returned 403                                                                                                                                                                                                                                                                                       | Not verified                                                                                                                                                                                                                    |
| **Parkage** (France)               | Shop buylist               | An online buylist shows "leur prix de rachat unitaire ainsi que la quantité reprise". The seller fills a proposal card by card with quantity and language, then ships sorted in the printed order; +10% in store credit; over 1,000 € contact first [20]. No file upload                                                                  | Not published as data                                                                                                                                                                                                           |
| **Playin by Magic Bazar** (France) | Shop buylist               | A "hotlist"; price depends on edition, condition and language; cheque, cash in store under 1,000 €, or store credit +10% (search summary) [21]. No file format found                                                                                                                                                                      | Not published as data                                                                                                                                                                                                           |

**Two corrections to the research note this spec started from.** First, Cardmarket offers no documented stock CSV, so the first export slice targets Card Kingdom, whose format is public. The Cardmarket deliverable becomes a listing sheet for its bulk listing page or for a tool that takes Cardmarket IDs. Second, "Cardmarket has no public API" holds for the API [16], but Cardmarket publishes a daily price guide file to every user [18] [19]. That file could become an EUR source once its terms are known.

**Price data.** Scryfall's terms say: "You may not "paywall" access to Scryfall data", including requiring "subscriptions … in exchange for access to Scryfall data" [22]. Its bulk-data page says prices are "dangerously stale after 24 hours", to be used only "to track trends or provide a general estimate of card value", and "not updated frequently enough to power a storefront or sales system" [23]. USD is TCGplayer's market price; EUR is Cardmarket's trend price or an average, "whichever is available" [24]. A card object carries `usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil`, `eur_etched` and `cardmarket_id`, which is Cardmarket's product ID [25]. A licensed feed is one alternative for paid features. JustTCG, for example, sells plans from 19 USD a month whose terms allow displaying "historical trends" and "aggregate valuations" and storing history while subscribed. Its licence to stored data ends with the subscription, and its free tier is non-commercial [26] [27]. Which markets JustTCG covers was not checked.

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `61792c1`):

- **Collection rows.** `CollectionCard` (`prisma/schema.prisma`) has `scryfallId`, `quantity`, `foil` (a boolean, so no etched finish), `condition` (`NM`, `LP`, `MP`, `HP`, `DMG`), `acquiredAt` and `price`. It is unique on `(scryfallId, foil, userId)`, so one printing and finish holds one condition: two NM and one LP copy cannot be recorded. There is no language column (language is implied only by which Scryfall printing was chosen), no location, no for-trade flag and no purchase price.
- **The stored price is Scryfall's USD at the time of adding.** `AddToCollectionDialog.tsx`, `QuickAddCollectionButton.tsx` and the printing swap in `CollectionPageClient.tsx` copy `prices.usd`, even for a foil copy. Nothing records the date.
- **The collection total.** `CollectionPageClient.tsx` shows "Total Value" as the sum of `price × quantity`, formatted in USD. Unpriced copies count as zero and no date is shown.
- **Exports.** `formatCollectionText` writes `N× Name [Foil]`; `formatCollectionCsv` writes `Name,Quantity,Foil,Condition,Price (USD)`; `formatCollectionPrintingCsv` (`src/lib/collection/printing-csv.ts`) adds the Scryfall ID. No buyer or marketplace format exists, and a search of `src/` and `prisma/` for buylist, cardkingdom and cardmarket finds no sell-side code.
- **Purchase planning is USD.** `DeckCard.price` and I-06's acquisition-plan CSV (`src/lib/collection/acquisition-csv.ts`, header `Price (USD)`) come from `prices.usd`; `src/lib/deck/pricing.ts` states that "every ingest path reads Scryfall's `prices.usd`".
- **Deck usage per printing exists, one printing at a time.** `GET /api/collection/usage?scryfallId=` returns the player's deck rows for one printing. `buildAcquisitionPlan` (`src/lib/collection/acquisition-plan.ts`) sums commander, partner and main-zone copies across decks, the inverse of a spare count. No route returns spares.
- **Scryfall types are partial.** `ScryfallCard.prices` declares `usd`, `usd_foil` and `eur` only (`src/lib/scryfall/types.ts`); `collector_number`, `cardmarket_id`, `finishes` and `eur_foil` are not declared on the card type.
- **The card cache is client-written.** `POST /api/cache/cards` stores whatever Scryfall JSON a signed-in client posts for an ID. Seller files must therefore not take identifiers from `CardCache`.
- **No market, history or snapshot.** `User` has no market or currency field, and no price-history or value-snapshot table exists. A public `GET /api/v1/collection` (scope `collection:read`) already exposes the collection to the owner's API keys.

## Functional requirements

### 1. Spare copies

1.1 For each printing and finish, **spare = owned − committed − kept**, never below zero. Committed copies are those of the same printing in the player's decks: commander, partner and main zones always; the sideboard by default, under a setting; the maybeboard never.
1.2 When a deck lists a printing the player does not own and the player owns **another printing** of the same Oracle card, that copy is flagged "may be the copy you play in <deck>" and is excluded by default. Oracle identity comes from server-side Scryfall data.
1.3 The player can mark copies to keep: a quantity per printing and finish, private, stored on the server. A keep mark survives re-imports.
1.4 If I-16's commitment index ships first, the spare count reads it. Otherwise I-16 slice 4 adopts or replaces this computation, so the product never keeps two.
1.5 The spare list is private. No suggestion, bracket estimate or copilot answer reads it ([I-33 1.4](i33-marketplace-ladder.md#1-the-decision-and-its-boundaries)).
1.6 Viewing or exporting never changes ownership. "Remove sold copies" is a separate action that lists each line and decrements the collection only after the player confirms.

### 2. Free valuation (Scryfall prices as they are)

2.1 Values use I-32's market choice and dated snapshot, under its rules 2.1 to 2.7: currency, source and date on every figure; a stale label after 24 hours; **no currency conversion**; unpriced copies counted apart.
2.2 The price follows the finish: `usd_foil` or `eur_foil` for foil, `usd_etched` or `eur_etched` for etched.
2.3 The collection "Total Value" adopts the same rules. It shows the chosen market's currency, the price date and the unpriced count, and stops pricing foil copies at the nonfoil price.
2.4 Spare copies can be filtered by price band, set, rarity and a "bulk" threshold the player sets in their market's currency. Totals are shown per filter.
2.5 Interface text says "estimated value", "Scryfall daily price, from Cardmarket" (or "from TCGplayer market price") and never "worth", "offer", "you will get" or "sell now". Scryfall itself calls its prices "daily estimates" with "absolutely no guarantee" [22].
2.6 Valuation is free for every signed-in player, with no quota (Scryfall's paywall clause [22]).
2.7 **No listing price is prefilled from Scryfall.** Its prices are "not updated frequently enough to power a storefront or sales system" [23]. A seller file carries no price, or a price the player typed.

### 3. Seller and buylist exports

3.1 Export targets live in a code registry reviewed in a pull request, like I-32's seller registry. Each entry declares the kind (buylist, marketplace or shop), market, method (file upload, paste or printable list), columns, limits, what the target keeps, terms URL, and the date a person verified the format in a browser.
3.2 **Card Kingdom sell file.** A CSV whose first four columns are the title (quoted), edition, foil (`true` or `false`) and quantity [10]. The browser check in the testing strategy settles whether a header row is kept. A list beyond 500 lines or 5,000 cards splits into numbered parts [10]. The download notes that Card Kingdom's tool needs a desktop browser, cannot add to an existing sell cart, and imports only cards it is buying [10] [11].
3.3 Edition names map from Scryfall set names to Card Kingdom's through a reviewed table with fixtures (for example Scryfall's "Fourth Edition" is Card Kingdom's "4th Edition" [12]). Unmapped rows are listed by name, never dropped. Card Kingdom's tool lets the player correct unmatched names [10].
3.4 **Cardmarket listing sheet.** CSV sorted by expansion, then collector number: Cardmarket product ID (Scryfall `cardmarket_id`), name, expansion, collector number, language, finish, condition as recorded here, quantity, and an empty price column. The download says plainly that Cardmarket documents no CSV upload, and that the sheet is for its bulk listing page or a tool that accepts Cardmarket or Scryfall IDs [17]. Condition is not mapped to Cardmarket's grades; the player sets the grade on Cardmarket.
3.5 **Generic file.** CSV with Scryfall ID, set code, collector number, language, finish, condition and quantity, for any other tool.
3.6 **Star City Games** is offered only after a person verifies one of its accepted upload formats in a browser [15]. Until then it is not listed.
3.7 **Shops without an upload** (Parkage, Playin): a printable list grouped by expansion and language, with quantities, to speed manual entry [20] [21]. We never fill their forms.
3.8 Identifiers (set, collector number, language, finish, Cardmarket ID) come from server-side Scryfall data: I-32's snapshot, I-29's bulk job, or a server call to Scryfall's collection endpoint. Never from `CardCache`.
3.9 Before the download, a summary states what the target keeps and what the player must set again, for example: "Card Kingdom ignores condition and language."
3.10 An export makes no outbound request. The player uploads the file. We never automate a buyer's site, never ask for a seller's credentials and never ship a browser extension (Cardmarket forbids sharing API credentials with third-party apps [16]).
3.11 A link to a buyer that carries our referral code follows I-32's rules 1.1 to 1.8: visible label, public disclosure page, opt-out, `rel="sponsored"`. Targets are ordered by the player's market, then alphabetically, never by commission.

### 4. Inventory report (free)

4.1 A dated export of the whole collection or of the spare list. Each line carries printing, set, collector number, language, finish, condition, quantity, `acquiredAt`, and the unit price with currency, source and date. Totals are given per currency. The file states when it was generated.
4.2 The report shows the file's SHA-256. The server keeps only `{userId, generatedAt, sha256}`, so the player can later show that a file with that hash was generated on that date for their account.
4.3 The report says it is "a record of what you entered, not proof of ownership or an appraisal", and suggests keeping receipts. The stolen-binder thread shows a card list alone convinced no one [4].
4.4 The report is free. It is the player's own data plus Scryfall prices shown as they are.

### 5. Paid-tier candidates (for I-30)

None ships before [I-30's legal gate](i30-business-model-and-paid-tier.md#7-the-legal-gate) answers and, for 5.1 and 5.2, a feed contract is signed.

| Candidate                                                                                                                       | Data it needs                                                                                                                | Why a player might pay                                                                  | What a free competitor offers                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 5.1 **Value history**: daily totals for the collection and the spare list in the player's market                                | A licensed feed whose terms allow showing history and derived valuations [27]; Scryfall only if its written answer allows it | MTGGoldfish sells price-history downloads ([I-30](i30-business-model-and-paid-tier.md)) | Bulkwise shows free price history from Scryfall [1], which caps the price |
| 5.2 **Snapshot archive for insurance**: an automatic monthly inventory report, kept with its hash, valued on the licensed feed  | 5.1's feed; the player's own rows                                                                                            | A dated series answers "what did I own in March?" after a theft [4] [5]                 | EchoMTG lets players view the report free and gates its export [7]        |
| 5.3 **Buylist comparison**: Card Kingdom's buy price against market price for each spare copy, with a threshold the player sets | Card Kingdom's written permission to use its price list [12]                                                                 | Saves the spreadsheet work Bulkwise was built to remove [1]                             | Bulkwise and Archidekt are free [1] [8]; recommended as free if permitted |

5.4 If a feed contract ends, paid history built on it is hidden or deleted as that feed's terms require, and players are told in advance. JustTCG's licence to stored data, for example, ends with the subscription [27].
5.5 No paid candidate sends "sell now" alerts or ranks cards by value change. The product informs a decision to sell; it never pushes one.

### 6. Place on the marketplace ladder

[I-33's ladder](i33-marketplace-ladder.md#2-the-ladder) is written from the buy side. I-45 is its sell-side mirror of stages 1 to 3: a file or a link that the player takes to the buyer's own site, with no money through MagicAIBuilder. Buylist comparison (5.3) is the mirror of stage 4: it needs a data grant from the buyer. Hosting listings or relaying offers would bring hosting-service duties under the DSA ([I-38](i38-trust-safety-and-user-rights.md)); card-for-card trade lists sit in [I-44](i44-trade-lists-within-the-pod.md). Taking payment is stage 5, which reverses the non-goal. I-45 does none of these.

### 7. Legal points (research, not legal advice)

Each point joins the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).

- **L1. Scryfall.** Is a paid value history or snapshot archive built on Scryfall prices "paywalling" Scryfall data when the same prices stay free on every page [22]? Does a buylist threshold or a listing sheet count as powering "a storefront or sales system" [23]? Ask Scryfall in writing as well.
- **L2. Buyer data.** May a free feature, and a paid one, use Card Kingdom's public price list, which publishes no terms [12], or Cardmarket's price guide file, whose terms were not found [18]? Does the EU database right protect Cardmarket's guide? That right was not researched.
- **L3. Portability.** Can any export of a player's own collection be paid, given the GDPR's portability right? That right was not re-read in this research; requirement 4.4 assumes no.
- **L4. Report wording.** Is "estimated value" in an inventory report safe from being read as an appraisal under French law, and is 4.3's disclaimer enough?
- **L5. Intermediary status and tax.** Does a seller file make MagicAIBuilder an intermediary under the DSA or L111-7, or bring DAC7 duties? Research inference: no, because the sale happens on the buyer's platform, which reports its sellers [6].
- **L6. Referral disclosure.** On the sell side, does I-32's disclosure wording (its Q1) apply unchanged?

## Data model / API

```
SpareSetting     userId, countSideboard (default true), updatedAt
CollectionKeep   userId, scryfallId, finish (nonfoil|foil|etched), keepQuantity
ExportTarget     (code registry) id, kind (buylist|marketplace|shop|generic), market, method (fileUpload|paste|printableList), columns[], limits {lines?, cards?}, keeps {condition, language, finish}, termsUrl, formatVerifiedAt, formatVerifiedBy
ExportDailyCount day, targetId, lineBucket, count                 -- no user, deck or IP column
InventoryReportHash userId, generatedAt, sha256                   -- the file itself is never stored
CollectionValueSnapshot (paid, blocked) userId, day, market, currency, totalMinor, pricedCopies, unpricedCopies, feedId
```

- Per-copy condition and an etched finish need `CollectionCard` to be unique on `(userId, scryfallId, finish, condition)`. That change belongs to I-06 and is listed as slice 5.
- `GET /api/collection/spares?market=eu&minPrice=…` returns each line with `owned`, `committed`, `kept`, `spare`, `otherPrintingInUse`, identifiers, and `price`, `currency`, `priceDate`, `source` when I-32's snapshot exists.
- `POST /api/collection/spares/export/{targetId}` takes the selected lines. It returns `{ parts: [{ fileName, text }], unmapped[], kept[], toSetAgain[] }` and makes no outbound request.
- `POST /api/collection/report` returns the file and records its hash.

## Non-goals

- Handling a sale, payment, shipping, escrow or a sell cart; hosting listings or relaying offers between players.
- Automating any buyer's site, storing a seller's credentials, or shipping a browser extension.
- Scraping buyers' sites or using a price source against its terms.
- Currency conversion, and listing prices prefilled from Scryfall.
- A paywall on Scryfall prices, the spare list, exports or the inventory report.
- Player-to-player trade lists and matching: [I-44](i44-trade-lists-within-the-pod.md) owns them.
- Card scanning ([I-40](i40-installable-app-and-card-scanning.md) holds that decision).
- "Sell now" alerts, and selling advice written by the language model.

## Testing strategy

- **Spare computation (solitary, property-based):** spare equals owned minus committed minus kept, clamped at zero; a copy committed to a deck never appears; maybeboard copies never count as committed; the sideboard setting flips the count; an owned copy of another printing is flagged when a deck lacks its own printing.
- **Adapters (golden fixtures):** one spare list holding a double-faced card, a split card, a name with quotes, a foil-only printing, an etched printing, a Secret Lair collector number, a set whose name differs at Card Kingdom, a card without a `cardmarket_id`, and a non-English printing. The Card Kingdom fixture splits at 501 lines and at 5,001 cards. Unmapped rows are listed.
- **No outbound calls:** an HTTP mock asserts that the export and report routes make zero requests.
- **Identifier source:** a test seeds a tampered `CardCache` entry and asserts the export ignores it.
- **Prices (reusing I-32's tests):** the EU market never shows a USD figure; foil and etched prices apply; unpriced copies are counted apart; a 25-hour-old price shows the stale label; no seller file contains a Scryfall price.
- **Free access:** with I-30's entitlement layer, a free-plan player sees every value, export and report (I-30's free-access guard).
- **Privacy:** schema guards assert that `ExportDailyCount` has no user, deck or IP column and that no report file is stored.
- **Ownership:** exporting leaves `CollectionCard` unchanged; "Remove sold copies" changes only the confirmed lines.
- **Browser check:** a person uploads the Card Kingdom fixture in Card Kingdom's tool and records the date in the registry before slice 2 ships.

## Delivery slices

| #   | Slice                                                                                                                 | Depends on                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0   | Spare computation (pure function and `GET /api/collection/spares`), sideboard setting, other-printing flag; no prices | —                                                                                                  |
| 1   | Spare view on the collection page with keep marks (`CollectionKeep`) and set and rarity filters                       | 0                                                                                                  |
| 2   | Card Kingdom sell CSV with edition mapping, part splitting and the "kept / set again / unmapped" summary              | 0; a browser check of the fixture                                                                  |
| 3   | Cardmarket listing sheet and the generic CSV, with server-side identifiers                                            | 0                                                                                                  |
| 4   | Free valuation: spare values and the corrected "Total Value", per market, finish-aware, dated                         | 1; I-32 slices 2 and 3                                                                             |
| 5   | Per-copy condition and etched finish on collection rows (I-06 data change, with migration)                            | — (coordinate with I-26 slice 1)                                                                   |
| 6   | Inventory report with its hash                                                                                        | 4                                                                                                  |
| 7   | Printable list for shops without upload; Star City Games adapter once a person verifies its format                    | 3                                                                                                  |
| 8   | "Remove sold copies" with per-line confirmation                                                                       | 1                                                                                                  |
| 9   | Export counts per day, target and line bucket                                                                         | 2                                                                                                  |
| 10  | Switch the spare count to I-16's commitment index                                                                     | 0; I-16 slice 4                                                                                    |
| 11  | Buylist comparison against Card Kingdom (5.3)                                                                         | 2, 4; **Blocked** on Card Kingdom's written permission and L2                                      |
| 12  | Value history (5.1)                                                                                                   | Moved to I-59 slice 7                                                                              |
| 13  | Snapshot archive (5.2)                                                                                                | 6; I-59 slice 7; **Blocked** on I-30 slice 0, L1, and a feed contract covering the player's market |

Slices 0 to 3 ship without any price, contract or legal answer: they give players a deck-aware spare list and files that Card Kingdom and Cardmarket's tools accept. Slice 4 adds honest values once I-32's snapshot exists. Slices 11 to 13 are where any revenue would come from, and each waits for a human decision.

## Open questions

- **Will Card Kingdom allow its price list in a comparison, and does it pay a referral on sell orders?** The list is public but publishes no terms [12]. Without a written yes, slice 11 does not start.
- **What are the terms of Cardmarket's price guide file?** It is the only EUR source found besides Scryfall [18] [19]. Would Cardmarket document a listing format, as Archidekt's staff hoped [9]?
- **Which licensed feed covers the EU market for slices 12 and 13**, and at what cost? JustTCG's markets were not checked, and its stored-data licence ends with the subscription [27].
- **Does the sideboard count as committed by default?** The proposal says yes, so a card in a deck box is never offered for sale. The owner confirms.
- **Should I-44's have list be filled from this spare list, keep marks included?** Both specs exclude copies committed to decks through I-16 slice 4. One spare computation should serve both.
- **Lawyer list:** L1 to L6 in requirement 7, added to I-30's list.

## Sources

Read on 2026-11-09 unless another date is given. "Search summary" means the official page refused automated access and a search engine's summary was read. Reddit posts were read through the [Arctic Shift](https://arctic-shift.photon-reddit.com/) archive API.

1. r/mtgfinance, [I built a free app that shows what Cardkingdom would pay for your Bulk](https://www.reddit.com/r/mtgfinance/comments/1wlmh4o/) (Bulkwise), 2026-09-20.
2. r/magicfrance, [Marre de lister mes cartes une par une sur MKM](https://www.reddit.com/r/magicfrance/comments/1qh2zmi/), 2026-01-19.
3. r/Moxfield, [Export Price Data](https://www.reddit.com/r/Moxfield/comments/1w6di2y/), 2026-09-03.
4. r/mtgfinance, [Trade Binder stolen, how should I proceed legally?](https://www.reddit.com/r/mtgfinance/comments/1j0vhpu/), 2025-03-01.
5. r/magicfrance, [Vol de classeur ?](https://www.reddit.com/r/magicfrance/comments/1uugdw2/), 2026-07-12.
6. r/magicfrance, [Cardmarket et les exigences fiscales](https://www.reddit.com/r/magicfrance/comments/1ozhx5b/), 2025-11-17, quoting Cardmarket's [tax requirements page](https://help.cardmarket.com/fr/TaxRequirements).
7. EchoMTG, [Soft caps, new tools and smoother upgrades](https://www.echomtg.com/blog/1172/soft-caps-new-tools-and-smoother-upgrades/), 2026-09-15.
8. Archidekt, [Development Update - Odds and Ends](https://archidekt.com/news/19248512), edited 2026-01-21.
9. Archidekt forum, [Add Buying option Cardmarket](https://archidekt.com/forum/thread/2106969/1), staff reply (page shows "4 years ago").
10. Card Kingdom, [Sell to CK / CSV Import](https://www.cardkingdom.com/static/csvImport) and its FAQ.
11. Card Kingdom, [CSV Import Tool](https://blog.cardkingdom.com/card-kingdom-csv-import-tool/), 2018-06-07.
12. Card Kingdom, [price list JSON](https://api.cardkingdom.com/api/v2/pricelist), `created_at` 2026-11-09 15:10:48.
13. TCGplayer, [Trade-in/Buylist update (July 17, 2024)](https://help.tcgplayer.com/hc/en-us/articles/24925325925783-TRADE-IN-BUYLIST-UPDATE-JULY-17-2024) (search summary).
14. [channelfireball.com](https://www.channelfireball.com), HTTP 301 to `tcgplayer.com/content/magic-the-gathering/channelfireball`.
15. Star City Games, [Use a CSV file to add to your Sell Cart](https://help.starcitygames.com/en-US/use-a-csv-file-to-add-to-your-sell-cart-1056948) (search summary).
16. Cardmarket, [Cardmarket API](https://help.cardmarket.com/en/cardmarket-api).
17. NeoSatoshi (a seller-tool vendor), [Cardmarket bulk upload and CSV import](https://neosatoshi.com/guides/cardmarket-bulk-upload-csv-import), 2026-10-21.
18. Cardmarket, [Adding Non-Singles and Accessories to the Price Guide](https://news.cardmarket.com/en/FoW/adding-non-singles-and-accessories-to-the-price-guide), 2024-10-28.
19. Cardmarket, [price guide file](https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_1.json), `createdAt` 2026-11-09.
20. Parkage, [Conditions générales de rachat](https://www.parkage.com/fr/conditions-generales-de-rachat).
21. Playin by Magic Bazar, [Rachat : conditions et FAQ](https://www.play-in.com/en/article/20-rachat_-_conditions_et_faq) (search summary).
22. Scryfall, [API documentation](https://scryfall.com/docs/api): use guidelines and price footer.
23. Scryfall, [Bulk data](https://scryfall.com/docs/api/bulk-data).
24. Scryfall, [Where do Scryfall prices come from?](https://scryfall.com/docs/faqs/where-do-scryfall-prices-come-from-7)
25. Scryfall, [Card objects](https://scryfall.com/docs/api/cards).
26. JustTCG, [Pricing](https://justtcg.com/pricing).
27. JustTCG, [Terms of Service](https://justtcg.com/terms), last updated 2026-11-04.

[1]: https://www.reddit.com/r/mtgfinance/comments/1wlmh4o/
[2]: https://www.reddit.com/r/magicfrance/comments/1qh2zmi/
[3]: https://www.reddit.com/r/Moxfield/comments/1w6di2y/
[4]: https://www.reddit.com/r/mtgfinance/comments/1j0vhpu/
[5]: https://www.reddit.com/r/magicfrance/comments/1uugdw2/
[6]: https://www.reddit.com/r/magicfrance/comments/1ozhx5b/
[7]: https://www.echomtg.com/blog/1172/soft-caps-new-tools-and-smoother-upgrades/
[8]: https://archidekt.com/news/19248512
[9]: https://archidekt.com/forum/thread/2106969/1
[10]: https://www.cardkingdom.com/static/csvImport
[11]: https://blog.cardkingdom.com/card-kingdom-csv-import-tool/
[12]: https://api.cardkingdom.com/api/v2/pricelist
[13]: https://help.tcgplayer.com/hc/en-us/articles/24925325925783-TRADE-IN-BUYLIST-UPDATE-JULY-17-2024
[14]: https://www.channelfireball.com
[15]: https://help.starcitygames.com/en-US/use-a-csv-file-to-add-to-your-sell-cart-1056948
[16]: https://help.cardmarket.com/en/cardmarket-api
[17]: https://neosatoshi.com/guides/cardmarket-bulk-upload-csv-import
[18]: https://news.cardmarket.com/en/FoW/adding-non-singles-and-accessories-to-the-price-guide
[19]: https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_1.json
[20]: https://www.parkage.com/fr/conditions-generales-de-rachat
[21]: https://www.play-in.com/en/article/20-rachat_-_conditions_et_faq
[22]: https://scryfall.com/docs/api
[23]: https://scryfall.com/docs/api/bulk-data
[24]: https://scryfall.com/docs/faqs/where-do-scryfall-prices-come-from-7
[25]: https://scryfall.com/docs/api/cards
[26]: https://justtcg.com/pricing
[27]: https://justtcg.com/terms
