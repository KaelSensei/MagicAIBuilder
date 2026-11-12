# I-32: Seller Handoff, Affiliate Links And Buy-This-Deck Carts

> **Initiative:** I-32, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed 2026-11-09 · **Priority:** Next · Written 2026-11-09
> **Extends:** [I-06](i06-collection-and-purchase-planning.md), which already lists "Add region-aware price providers, starting with a clearly selected market" and "Export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices". I-32 is the detailed plan for both, plus the per-vendor breakdown.
> **Owns:** the seller registry, the disclosure page, affiliate links, the market choice and its dated prices, cart handoffs, plan splitting, and the price watch. **Does not own:** ownership and acquire state (I-06), free-copies mode ([I-16](i16-decks-buildable-from-a-collection.md)), budget bundles ([I-17](i17-precon-path-and-tiered-upgrades.md)), currency formatting ([I-11](i11-localization-and-regional-experience.md)), the Scryfall bulk job ([I-29](i29-cross-site-deck-index.md) slice 1), billing ([I-30](i30-business-model-and-paid-tier.md)), and the marketplace decision ([I-33](i33-marketplace-ladder.md)).
> **Research:** two dated notes (marketplace path; monetization), plus fetches made on 2026-11-09. The notes are not committed, so every external fact cites its own source. Legal points are research, not legal advice.

## Overview

I-06 stops one step short of buying. The acquisition plan lists the exact printings still missing across a player's decks, net of owned copies, with USD estimates. The player then exports a CSV and rebuilds the cart by hand on a seller's site. I-32 closes that step. It adds prices for the market the player chooses, labelled as dated estimates. It fills a seller's cart or wants list and keeps printing, finish and condition where the seller allows it. Affiliate links are labelled at the point of click and never change the order sellers are shown in.

A buy button alone does not set the product apart. Mana Pool lists an AI Commander builder, mtgcommander.ai, whose chat "builds or refines Commander decks" and sends "the full list to a Mana Pool cart" in one click [2]. Moxfield, Archidekt, EDHREC and Cube Cobra have buy buttons or buy links too [2] [3] [11] [35]. The differentiator is what goes into the cart:

1. **Exact printings from the acquisition plan**, not a raw deck list.
2. **Owned copies removed across several decks at once.** With I-16, copies already committed to another deck are treated as unavailable. None of the five integrations described on Mana Pool's mass-entry page mentions excluding owned cards [2].
3. **Budget tiers** from I-17 bundles, each as its own cart.
4. **A market the player chooses.** For France and the EU, prices come from Cardmarket figures in euros, never converted from dollars.
5. **Visible honesty.** Affiliate links are labelled, a public page lists every commercial relationship, and players can turn our affiliate codes off.

On the marketplace ladder recorded in I-33, this is stages 1 to 3: affiliate links, region-aware prices and buy-this-deck carts. It also covers the parts of stage 4, cart splitting and alerts, that data terms allow. MagicAIBuilder never takes payment, never holds a cart, and never lists sellers' stock. The roadmap's [marketplace non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark) stays in force.

## What the market does

**Deckbuilders hand off; none of them sells.** All rows were read on 2026-11-09 unless another date is given.

| Product             | Handoff                                                                                                                                                                                                                                 | Commercial relationship                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EDHREC**          | Card prices link to Card Kingdom since 2017-05-05 [6]. Decklist articles show "Buy this decklist from Card Kingdom" and "from TCGplayer" [35]. Cardmarket became a selectable EU price source on 2026-02-10, with no cart described [8] | Card Kingdom pays EDHREC "a portion of the money you spent", which went to more hours for its one part-time developer [6]. Mana Pool partnership 2024-09-05, tagged affiliate [7]. Terms disclose affiliate links [9] |
| **Moxfield**        | Mana Pool button since 2025-05-30, opening Mass Entry with "Exact Printings" or "Any Printings" and a Cart Optimizer [3]                                                                                                                | The post does not say whether Moxfield is paid [3]. Its disclosure page lists Card Kingdom and TCGplayer (search summary; the page returned 403) [10]                                                                 |
| **Archidekt**       | "Buy Cards" button on deck pages [11]; Mana Pool buy button with exact or any printing [2]                                                                                                                                              | Not found                                                                                                                                                                                                             |
| **mtgcommander.ai** | AI chat with live Mana Pool prices; one click sends the full list to a Mana Pool cart [2]                                                                                                                                               | Link carries `ref=manapool` [2]; the project says Patreon pledges cover its API and hosting costs [5]                                                                                                                 |

**Sellers, cart entry and terms.**

| Seller           | Cart entry                                                                                                                                                                                        | Affiliate terms found                                                                                                                                                                            | Data terms                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mana Pool**    | `manapool.com/add-deck`, producing `add-deck?deck=…&ref=YOUR_REFERRAL_CODE`, with `&ref_meta=key:value` labels [1]. The optimizer respects "condition, printings, and foiling" [2]                | 5% of a referred buyer's **first** sale, 7-day first-click window, TapFiliate, paid 45 days after month end, $20 minimum; applicants need a significant presence in the online MTG community [1] | Open seller API with webhooks [4]. Shipping to the EU not verified                                                                                                    |
| **TCGplayer**    | Mass Entry lines such as `1 Lightning Bolt [SLD] 84`; omitting the number accepts any art from that set (search summary; page 403) [14]                                                           | Impact network, first referrer, 48-hour window, whole cart, no rate on the current page [12]. The v1.38.0 docs said 3.5% with last-click attribution: **the two pages conflict** [12]            | "No longer granting new API access"; API terms bar obtaining its pricing data from third parties collected through the API or automated means (search summaries) [13] |
| **Cardmarket**   | Wants list: paste lines such as `4x High Tide (V.1) (Fallen Empires)` [16]. The help page names amount, card name, version and expansion only, and does not mention condition, language or foil   | Help page returned 404. A search summary describes 15% of Cardmarket's own commission, with 50% and 25% tiers; I-29 recorded a user-referral bonus. **Unverified and conflicting** [17]          | "Not accepting applications for access to the Cardmarket API"; existing users may not share credentials with third-party apps [15]                                    |
| **Card Kingdom** | Deck Builder at `cardkingdom.com/builder`: paste the list, then pick edition and condition, then "Add Items to Cart" (2025-02-07, updated 2025-08-21) [18]                                        | Program exists (EDHREC since 2017 [6], Moxfield [10]); rate not published                                                                                                                        | No public API found                                                                                                                                                   |
| **CardTrader**   | Bearer token from the user's own profile; `POST /cart/add` per product, optionally through CardTrader Zero; `POST /cart/purchase` with a card on file or wallet credit (search summary; 403) [20] | Not found (pages 403)                                                                                                                                                                            | One call a second on the products endpoint (search summary) [20]                                                                                                      |

**A correction to the research note.** The note assumed Card Kingdom's CSV import tool would serve a "buy this deck" cart. That tool checks cards against Card Kingdom's **buylist**, so the player can sell to Card Kingdom [19]. Buying a list goes through the Deck Builder [18].

**Price data.** Scryfall syncs prices from its affiliates every 24 hours. USD is TCGplayer's market price; EUR is a Cardmarket trend or average (search summary of its FAQ; page 403) [22]. On 2026-11-09 its API returned `usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil` and `tix` for one Sol Ring printing. It also returned `purchase_uris` carrying Scryfall's own partner codes: `partner.tcgplayer.com/c/4931599/…`, `referrer=scryfall` on Cardmarket and `affiliate_id=scryfall` on Cardhoarder [21]. Scryfall calls bulk prices "dangerously stale after 24 hours" [23] and forbids paywalling its data [24]. **Inference:** a deckbuilder without a partner feed can display only daily, per-printing reference prices. It cannot see sellers' listings. A cross-seller "cheapest split" is therefore out of reach.

**Revenue scale.** **Computed** in the research: a 300 USD order yields 15 USD at Mana Pool's 5%, or 10.50 USD at TCGplayer's historical 3.5%. Mana Pool pays on a referred buyer's first sale only [1]. The only public revenue statement found is EDHREC's 2017 note about one part-time developer [6].

**What players pay for.** Price alerts are sold as paid features: unlimited alerts in MTGGoldfish Premium (search summary) [33] and "Pricing Professional" in TopDecked's paid Powered tier [34]. The research found no alert scoped to the missing printings of a player's own acquisition plan, net of owned copies.

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `49983a9`):

- **No seller links.** A search of `src/` for tcgplayer, cardmarket, cardkingdom, manapool, cardtrader and affiliate finds only the Wizards notice ("not affiliated with…") in `src/messages/*/common.json` and `landing.json`, rendered by `src/components/layout/Footer.tsx`. No `purchase_uris` field, no outbound seller URL, no referral code.
- **One USD price per deck row, undated.** `DeckCard.price` (`prisma/schema.prisma`) is a `Float?` copied from Scryfall's `prices.usd` when the card is added (`src/lib/deck/store-card-faces.ts`, `src/components/deck/DeckWizard.tsx`, the collection dialogs). Nothing records when the price was read. The foil price is never used, even for a foil copy. `ScryfallCard.prices` in `src/lib/scryfall/types.ts` declares `usd_foil` and `eur`, but nothing reads them. The type has no `finishes`, `collector_number` or `purchase_uris`.
- **No market setting.** `User` has no region or currency field. `formatUsdPrice` (`src/i18n/number-format.ts`) formats USD for the active locale "without converting its underlying value".
- **The acquisition plan is printing-level.** `buildAcquisitionPlan` (`src/lib/collection/acquisition-plan.ts`) sums commander, partner and main-zone printings across the selected decks by Scryfall ID. It skips basics and the sideboard and subtracts owned copies. `src/app/api/collection/acquisition-plan/route.ts` sums regular and foil `CollectionCard` quantities **per Scryfall ID**, so a copy of another printing of the same card does not reduce the plan. `AcquisitionPlanPanel.tsx` shows the plan. `src/lib/collection/acquisition-csv.ts` exports `Name,Quantity,Price (USD),Total (USD),Scryfall ID,Deck allocations`.
- **Shopping list.** `src/lib/collection/shopping-list.ts` formats `N× Name | USD x` lines with an "Estimated total" and an unpriced count, plus a CSV. `src/lib/deck/pricing.ts` documents that amounts are USD because "every ingest path reads Scryfall's `prices.usd`".
- **Deferred lines persist on the server.** `AcquisitionIntent` (migration `20261102144500_add_acquisition_intents`) stores `proxy_now` or `buy_later` per user, deck and printing, through `src/app/api/decks/[id]/acquisition-intent/route.ts` and `src/hooks/useAcquisitionIntent.ts`. The roadmap's I-06 text still says this choice persists "only in the same browser"; that sentence is out of date.
- **Finish and condition exist only for owned cards.** `CollectionCard` has `foil` and `condition` (NM, LP, MP, HP, DMG). `DeckCard` has neither, so a cart built today could not carry a wanted finish or condition.
- **Estimate wording exists.** `src/messages/en/collection.json` says "Prices are estimates for the deck printings", and `src/messages/en/deck.json` has "Estimated price". The product direction requires "prices labeled as estimates" ([roadmap](../roadmap.md#product-direction), step 5).
- **Exports.** `src/lib/deck/export.ts` writes Moxfield, Arena, MTGO, TappedOut, Archidekt, MTGGoldfish and EDHREC formats. It has no seller format.
- **No legal page, analytics or alert delivery.** `src/app/[locale]/` has no legal or disclosure route. No product analytics library is installed; Sentry reports errors only. `NotificationPreference` stores four toggles (replies, mentions, follows, watched decks), but no notification table, email sender or scheduled job exists. `src/lib/meta/snapshots.ts` says it deliberately avoids a cron job.

## Functional requirements

### 1. Disclosure and ordering

**Legal frame (research, not legal advice; every point feeds the lawyer list in Open questions):**

- LCEN article 20: any advertising accessible online "doit pouvoir être clairement identifiée comme telle" and must make identifiable the person on whose behalf it is made. This applies on top of the misleading-practice rules of L121-1 [26].
- Code de la consommation L121-4 lists practices deemed misleading. Item 11° covers editorial content promoting a product the professional paid for, "sans l'indiquer clairement". Item 25° covers search results shown "sans l'informer clairement de tout paiement effectué spécifiquement par un tiers pour obtenir un meilleur classement" [27].
- Listing sellers with prices may make the product an online platform operator under L111-7 [29]. If so, D111-6 requires a dedicated section on ranking criteria. Near each result, it requires stating any "relation contractuelle", "lien capitalistique" or "rémunération" that influences the ranking [28].
- Loi 2023-451 covers persons who, for payment, "mobilisent leur notoriété auprès de leur audience". In its original version, article 5 required the label "Publicité" or "Collaboration commerciale" [30]. Ordinance 2024-978 rewrote that article; per a secondary summary, the duty moved to a new article 5-2 [31]. A tool's interface probably falls outside it; creator content ([I-36](i36-creator-and-embed-toolkit.md)) may not.
- The Fan Content Policy names "sponsorships, ad revenue, and donations", not affiliate links [25].

1.1 Every link or button that carries one of our affiliate codes shows a visible label, such as "Affiliate link: we may earn a commission" or "Lien affilié : nous pouvons toucher une commission". The label appears next to the control, not behind a hover or tooltip, at phone width too, in every active locale.
1.2 A public disclosure page, linked from the footer on every page, lists each seller, our relationship (none, applied or active), the network, the commission basis as the seller publishes it, and the date the terms were read. It is generated from the seller registry (requirement 4.1), so a relationship cannot go live undisclosed.
1.3 **Seller order never depends on commission.** The default criterion appears above the seller list: sellers for the player's market first, then the player's pinned seller, then alphabetical order. No commission field is read by the ordering code.
1.4 A player setting, "Open sellers without MagicAIBuilder affiliate codes", removes our codes from every link. The handoff works the same way either way.
1.5 We never rewrite, strip or replace another party's code. When we have no agreement with a seller, the card-level link is Scryfall's `purchase_uris` URL, passed through unchanged and labelled "Scryfall partner link" [21].
1.6 Affiliate parameters carry placement labels only, such as `ref_meta=surface:acquisition_plan`. They never carry a user ID, deck ID, username or email.
1.7 Outbound seller links open in a new tab with `rel="sponsored noopener noreferrer"`. Google asks for `sponsored` on "advertisements or paid placements" [32].
1.8 No third-party affiliate script, pixel or cookie runs on our pages. Attribution happens on the seller's side after the click.
1.9 The copy is factual. It never says "best price", "cheapest" or "deal". The AI copilot never produces or chooses seller links; adapters are deterministic code.

### 2. Market and prices

2.1 The player chooses a market explicitly: **EU (EUR)** or **US (USD)**. Locale never decides it, because a French speaker may live in Québec. Until the player chooses, the current USD behaviour remains, along with a prompt to choose. Signed-out visitors keep the choice in the browser.
2.2 The EU market shows Scryfall's `eur` and `eur_foil`. The US market shows `usd`, `usd_foil` and `usd_etched`. When a line's finish is known, its finish-specific price is used.
2.3 Every price shows its currency, its source ("Scryfall daily price, from Cardmarket" or "…from TCGplayer market price") and its date. Past 24 hours it is labelled stale, following Scryfall's own warning [23].
2.4 **No currency conversion, ever.** A line with no price in the chosen market reads "no EUR price" and is counted apart from the subtotal, as unpriced lines are today.
2.5 The plan breaks its total down by deck, card category and price band for the chosen market. This is I-06's per-vendor breakdown, limited to the one source we may display.
2.6 Prices come only from Scryfall or from a signed partner feed that allows display. We never scrape seller sites and never call TCGplayer's or Cardmarket's APIs.
2.7 Prices, the plan and every handoff are free and need no subscription (Scryfall's paywall clause [24]).

### 3. The cart handoff

3.1 The input is the acquisition plan for one deck, several decks or all decks, after owned copies are removed. Lines marked `buy_later` or `proxy_now` are left out by default and listed separately, with a toggle to include them.
3.2 With I-16's free-copies mode on, copies committed to the player's other decks count as unavailable. The handoff says so: "excludes copies used in your other decks".
3.3 Each line carries a Scryfall printing ID, set code, collector number, finish (nonfoil, foil or etched), minimum condition and an **exact or any printing** choice. Finish defaults to nonfoil, or to the only finish Scryfall lists for that printing.
3.4 Before handing off, the plan flags lines where the player owns **another printing** of the same card ("you own 1 from C20"). Such lines are excluded by default when the line accepts any printing. This needs Oracle identity, which the cached Scryfall data holds but `DeckCard` does not store.
3.5 Before the player leaves, the handoff states what the seller will keep and what must be picked again on the seller's site, for example: "Cardmarket keeps the expansion; choose condition and foil on Cardmarket."
3.6 Lines an adapter cannot map are listed by name and are never dropped silently.
3.7 "One click" is claimed only for sellers that accept a prefilled link. Other sellers get two honest steps: copy the list, then open the seller's page.
3.8 With I-17, a precon's budget, mid and full bundles each become their own handoff. The cart holds only that tier's cards that are still missing.
3.9 A handoff changes nothing. Ownership, intents and the plan stay as they were. Marking lines as ordered belongs to I-06's persistent acquire state.

### 4. Seller adapters

4.1 A seller registry is **code reviewed in a pull request**, not a database table. Each entry declares the seller's markets, handoff method, line format, what it keeps, affiliate status and terms URL, and the date a person verified the format in a browser.
4.2 Starting set, from the market table: **Mana Pool** (prefilled link; keeps printing; condition and finish as optimizer preferences), **TCGplayer** (Mass Entry text with set and collector number), **Cardmarket** (wants-list text with expansion and version), **Card Kingdom** (Deck Builder text; edition and condition chosen on its site). The default for the EU market is Cardmarket.
4.3 TCGplayer, Cardmarket and Card Kingdom start as copy-and-open handoffs. An adapter moves to a prefilled link only after a person verifies the link format with an affiliate code and dates it. The research could not verify such a link for TCGplayer (its docs page returned 404).
4.4 Each adapter maps Scryfall set codes and names to the seller's names, including double-faced, split and Secret Lair printings, and has a golden fixture.
4.5 When a seller publishes a line limit, the handoff splits into several parts and numbers them.

### 5. CardTrader token flow (gated)

5.1 Off until a security review signs it off. It is the only adapter that calls a seller's API on the player's behalf.
5.2 The player pastes their own CardTrader token for one handoff. It is held in memory for that request batch only. It is never stored, logged or sent anywhere but CardTrader.
5.3 Only the product lookup and `cart/add` are called. Every call keeps the one-a-second pace the docs give for the products endpoint [20]. `cart/purchase` is never called. The player completes payment on CardTrader.
5.4 The result lists lines added, lines not found and lines where the matched product differs from the requested printing.

### 6. Splitting and the price watch

6.1 A plan can be split only by rules we can state using data we may display: buy-now against deferred, by deck, by budget tier, and by what each seller keeps exactly.
6.2 We do not compute a cross-seller "cheapest split". It needs listing-level prices that TCGplayer and Cardmarket do not grant to new developers [13] [15]. The handoff points to each seller's own optimizer instead. This stays blocked until a partner feed with display rights exists (an I-33 gate).
6.3 **Price watch (paid-tier candidate for I-30).** A player watches a deck's plan or the whole plan in their market. A daily check notifies them when the buy-now total falls below a threshold, or when a watched printing moves by a set percentage. The prices themselves stay visible to everyone; only the watch and its delivery would be paid.
6.4 An alert repeats the estimate label, source and date. It sends at most one digest a day. It never features sellers, promotions or "deals", and never ranks anything by spend.

### 7. Measurement for the I-33 gates

7.1 Handoffs are counted per day, seller, chosen market, surface (card, deck or plan) and line-count bucket. No user ID, deck ID or IP address is stored with the count.
7.2 **Monthly active buyers**, the number of distinct signed-in players with at least one deck or plan handoff, is counted for I-33. During the month, only a salted hash of each player ID is kept. The month's count is written once, then the hashes and salt are deleted.
7.3 After each deck or plan handoff, a "this cart was wrong" link records the seller and what was wrong (printing, condition, finish, missing line), with no player data. I-33 reads the rate per 100 carts as stage 3's stop signal.
7.4 Conversion figures come only from the affiliate networks' own reports. We never receive buyer data.
7.5 A monthly owner report lists handoffs, buyers, wrong-cart reports, attributed orders and commission per seller. I-30 and I-33 use it for their decisions.

### 8. What could be paid, and why

Free: prices, the market choice, the plan, every handoff and the disclosure page. Gating them would breach Scryfall's paywall clause [24] and cut the click volume that affiliate income depends on. Paid candidates for I-30 are the **price watch** (6.3) and a **price history of one's own plan**. Both are computation and delivery on the player's own data. Players already pay for alerts elsewhere [33] [34]. No product found scopes an alert to the missing printings of a multi-deck plan, net of owned and committed copies.

## Data model / API

```
SellerAdapter     (code registry) id, name, markets[], method (prefilledLink|copyAndOpen|userToken), lineFormat, keeps {printing, finish, condition, language}, affiliate {status: none|applied|active, network?, publishedBasis, termsUrl, termsReadAt}, formatVerifiedAt, formatVerifiedBy
UserMarket        userId, market (eu|us), chosenAt
PriceSnapshot     re-pointed 2026-11-10: read from I-67's CardPrice (printingKey, day, usd?, usdFoil?, usdEtched?, eur?, eurFoil?, sourceUpdatedAt); no table here
AcquisitionLinePref userId, scryfallId, finish (nonfoil|foil|etched), minCondition (NM|LP|MP|HP|any), printing (exact|any)
HandoffDailyCount day, sellerId, market, surface (card|deck|plan), lineBucket, count   -- no user, deck or IP column
BuyerMonth        month, buyerCount                                -- the salted hashes behind it are deleted when written
CartReport        day, sellerId, problem (printing|condition|finish|missingLine)
PriceWatch        userId, scope (plan|deck), deckId?, market, thresholdMinor?, movePercent?, lastCheckedAt, lastNotifiedAt
```

- `GET /api/collection/acquisition-plan?market=eu&deckId=…` adds `price`, `priceDate`, `currency`, `finish` and `otherPrintingOwned` to each line.
- `POST /api/handoff/{sellerId}` takes the plan scope and options. It returns `{ method, url?, clipboardText?, kept[], toRepick[], unmapped[], parts }`. It makes no outbound request, except the gated CardTrader adapter.
- `/[locale]/disclosures` renders the registry.

## Non-goals

- Checkout, payment, holding buyer funds, seller onboarding or listing third-party stock. These are I-33 stage 5, and the non-goal stays.
- Cross-seller price comparison from listing data, and scraping any seller's site or API.
- Currency conversion.
- Ordering, recommending or highlighting sellers by commission; paid placement; "deal" feeds.
- Storing any seller credential or token; calling a seller's purchase endpoint.
- A paywall on prices, links, the plan or the handoff.
- Selling cards to stores (Card Kingdom's buylist import is out of scope).
- Seller links chosen or written by the language model.

## Testing strategy

- **Adapters (solitary):** a golden fixture per seller from one plan holding a double-faced card, a split card, a foil-only printing, an etched printing, a Secret Lair collector number and a card the seller cannot map. Output matches the fixture, and the unmappable card is listed.
- **Disclosure (sociable and E2E):** every rendered affiliate control has its visible label in English and French, at desktop and phone widths. A registry entry with `status: active` and no disclosure text fails the build. The disclosure page matches the registry.
- **Ordering (property):** randomizing commission fields never changes seller order.
- **Privacy:** generated URLs never contain a user ID, deck ID, username or email (property test). A schema guard asserts `HandoffDailyCount` and `CartReport` have no user, deck or IP column. After the monthly write, no player hash remains. No page loads a third-party affiliate script.
- **Prices:** the EU market never shows a USD figure; a line with no EUR price is counted apart; a 25-hour-old price shows the stale label; finish-specific prices apply.
- **Plan:** owned, committed and deferred copies are excluded as stated. A line owned in another printing is flagged. A handoff leaves `CollectionCard` and `AcquisitionIntent` unchanged.
- **Opt-out:** with the setting on, no generated URL carries our code. Scryfall partner links pass through byte for byte.
- **CardTrader:** an HTTP mock asserts `cart/purchase` is never called and the rate stays at or under one call a second. Database and log spies assert the token is never written.
- **Watch:** a threshold crossing sends one digest per day. A signed-out visitor still sees every price.

## Delivery slices

| #   | Slice                                                                                                                                                                                    | Depends on                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 0   | Seller registry with no codes active; public disclosure page; footer link                                                                                                                | —                                                                                                     |
| 1   | Copy-and-open handoffs for Mana Pool, TCGplayer, Cardmarket and Card Kingdom, with the "kept / pick again / unmapped" summary                                                            | 0                                                                                                     |
| 2   | Labels, source, date and stale rules on I-67's daily `CardPrice` (`usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil`) _(re-pointed 2026-11-10 to I-67 slice 5, which writes the prices)_ | I-67 slice 5                                                                                          |
| 3   | Market choice (EU or US), per-market totals and the deck, category and price-band breakdown                                                                                              | 2                                                                                                     |
| 4   | Line finish, minimum condition and exact-or-any printing (`AcquisitionLinePref`), carried by adapters that keep them                                                                     | 1                                                                                                     |
| 5   | "Owned in another printing" flag via Oracle identity                                                                                                                                     | 4                                                                                                     |
| 6   | Mana Pool prefilled link with exact printings; affiliate code, labels and opt-out setting go live                                                                                        | 0, 1, 4; **Blocked** on Mana Pool's affiliate approval and the lawyer's answer on disclosure (Q1, Q2) |
| 7   | Further affiliate activations: TCGplayer through Impact, Card Kingdom, Cardmarket, one per pull request                                                                                  | 6; each **blocked** on approval and a link format verified in a browser                               |
| 8   | Handoff counts, monthly buyers, wrong-cart reports and the monthly owner report                                                                                                          | 0                                                                                                     |
| 9   | Free-copies handoff                                                                                                                                                                      | 1; I-16 slice 4                                                                                       |
| 10  | Budget-tier handoffs                                                                                                                                                                     | 1; I-17 slice 6                                                                                       |
| 11  | CardTrader token add-to-cart                                                                                                                                                             | 1, 4; **Blocked** on a security review                                                                |
| 12  | Price watch (paid-tier candidate)                                                                                                                                                        | Moved to I-59 slice 11                                                                                |

Slices 0 to 3 ship without any commercial relationship. They give the plan honest regional prices and a working handoff. Slice 6 is where revenue starts, and slice 8 measures whether it justifies anything further on the ladder.

## Open questions

- **Lawyer list** (added to the twelve questions from I-29's research):
  - **Q1.** Do LCEN article 20 and L121-4 11° require a label on each affiliate link, and is requirement 1.1's wording enough?
  - **Q2.** Does a seller list with prices make MagicAIBuilder an online platform operator under L111-7, triggering D111-6? Does loi 2023-451 (as amended in 2024) apply to a tool, or only to creator content? Do DSA advertising duties apply to a small hosting service with public decks? The research did not verify the DSA's small-enterprise exemption.
  - **Q3.** Is a paid price watch built on Scryfall prices "paywalling" Scryfall data when the same prices stay free on every page?
  - **Q4.** Do TCGplayer's API terms reach USD figures that Scryfall relays? Are affiliate links compatible with the Fan Content Policy, which names only sponsorships, ads and donations?
- **Which seller first for France?** Cardmarket is the EU market that matters, but its API is closed and its affiliate terms are unverified. Mana Pool has the clearest program, but EU shipping is unverified. Should slice 6 wait for a Cardmarket conversation?
- **Does Mana Pool provide a documented way to create the `deck` parameter programmatically?** The affiliates page says the parameter "gets generated" when cards are added [1]. Its API docs were not read.
- **Is the opt-out setting (1.4) on or off by default?** On by default favours trust; off by default favours revenue. The owner decides.
- **Will Cardmarket, Mana Pool or CardTrader grant a partner price feed?** That feed is the only path to cross-seller splitting (6.2) and is an I-33 gate.

## Sources

All pages were read on 2026-11-09 unless another date is given. "Search summary" means the official page refused automated fetching and the fact comes from a search engine's summary of it.

1. Mana Pool, [Affiliates](https://manapool.com/affiliates) (undated page).
2. Mana Pool, [Mass Entry info](https://manapool.com/mass-entry-info) (undated page).
3. Mana Pool, [Moxfield integration](https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html), 2025-05-30.
4. Mana Pool, [Sell on Mana Pool](https://manapool.com/seller-info) (undated page).
5. [MTG Commander AI on Patreon](https://www.patreon.com/MTGCommanderAI) (search summary).
6. EDHREC, [Announcing EDHREC and Card Kingdom Partnership](https://edhrec.com/articles/announcing-edhrec-and-card-kingdom-partnership), 2017-05-05.
7. EDHREC, [Mana Pool and EDHREC partnership announcement](https://edhrec.com/articles/mana-pool-and-edhrec-partnership-announcement), 2024-09-05.
8. EDHREC, [Introducing the Cardmarket x EDHREC Partnership for EU Users](https://edhrec.com/articles/introducing-the-cardmarket-x-edhrec-partnership-for-eu-users/), 2026-02-10.
9. EDHREC, [Terms](https://edhrec.com/terms), effective 2024-08-06.
10. Moxfield, [Disclosures](https://sorcery.moxfield.com/help/disclosures) (search summary).
11. Archidekt, [FAQ](https://archidekt.com/faq).
12. TCGplayer, [Affiliate Program](https://docs.tcgplayer.com/docs/tcgplayer-affiliate-program) and the [v1.38.0 version](https://docs.tcgplayer.com/v1.38.0/docs/tcgplayer-affiliate-program).
13. TCGplayer, [API docs](https://docs.tcgplayer.com/docs) and [API Terms & Conditions](https://help.tcgplayer.com/hc/en-us/articles/360061115874) (search summaries).
14. TCGplayer, [Getting Started With Mass Entry](https://help.tcgplayer.com/hc/en-us/articles/360055768913-Getting-Started-With-Mass-Entry) (search summary).
15. Cardmarket, [Cardmarket API](https://help.cardmarket.com/en/cardmarket-api).
16. Cardmarket, [How to add a MTG decklist to wants](https://help.cardmarket.com/en/how-to-add-a-mtg-decklist-to-wants) (undated page).
17. Cardmarket, [Affiliate Program](https://help.cardmarket.com/en/AffiliateProgram) (returned 404; search summary).
18. Card Kingdom, [Deck Builder: Craft Your Next Deck](https://blog.cardkingdom.com/deck-builder-craft-your-next-deck/), 2025-02-07, updated 2025-08-21.
19. Card Kingdom, [CSV Import Tool](https://blog.cardkingdom.com/card-kingdom-csv-import-tool/), 2018-06-07.
20. CardTrader, [API: How to buy](https://www.cardtrader.com/docs/api/full/how-to-buy) (search summary).
21. Scryfall API, [Sol Ring (C21) card object](https://api.scryfall.com/cards/named?exact=Sol%20Ring&set=c21), fetched with an honest User-Agent.
22. Scryfall, [Where do Scryfall prices come from?](https://scryfall.com/docs/faqs/where-do-scryfall-prices-come-from-7) (search summary).
23. Scryfall, [Bulk data](https://scryfall.com/docs/api/bulk-data), as quoted in [I-29](i29-cross-site-deck-index.md).
24. Scryfall, [API documentation](https://scryfall.com/docs/api), as quoted in I-29 and the monetization research.
25. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
26. Légifrance, [LCEN, article 20](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180), in force since 2008-01-05.
27. Légifrance, [Code de la consommation, article L121-4](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563107), in force since 2022-05-28.
28. Légifrance, [Code de la consommation, article D111-6](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035732365), version in force since 2024-07-09.
29. INC, [Informations par les plateformes en ligne : ce qui change au 1er janvier 2018](https://www.inc-conso.fr/node/10164) (secondary source on L111-7).
30. Légifrance, [Loi n° 2023-451 du 9 juin 2023](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047663185), original version.
31. Dalloz Actualité, [Ordonnance n° 2024-978 du 6 novembre 2024](https://www.dalloz-actualite.fr/document/ord-n-2024-978-6-nov-2024-jo-7-nov) (search summary; consolidated text not read).
32. Google Search Central, [Qualify your outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).
33. MTGGoldfish, [Premium](https://www.mtggoldfish.com/premium) (search summary).
34. TopDecked, [Powered features](https://topdecked.com/articles/powered-features).
35. EDHREC, [Digital Deckbuilding article](https://edhrec.com/articles/?p=107636), showing buy-decklist buttons.

[1]: https://manapool.com/affiliates
[2]: https://manapool.com/mass-entry-info
[3]: https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html
[4]: https://manapool.com/seller-info
[5]: https://www.patreon.com/MTGCommanderAI
[6]: https://edhrec.com/articles/announcing-edhrec-and-card-kingdom-partnership
[7]: https://edhrec.com/articles/mana-pool-and-edhrec-partnership-announcement
[8]: https://edhrec.com/articles/introducing-the-cardmarket-x-edhrec-partnership-for-eu-users/
[9]: https://edhrec.com/terms
[10]: https://sorcery.moxfield.com/help/disclosures
[11]: https://archidekt.com/faq
[12]: https://docs.tcgplayer.com/docs/tcgplayer-affiliate-program
[13]: https://docs.tcgplayer.com/docs
[14]: https://help.tcgplayer.com/hc/en-us/articles/360055768913-Getting-Started-With-Mass-Entry
[15]: https://help.cardmarket.com/en/cardmarket-api
[16]: https://help.cardmarket.com/en/how-to-add-a-mtg-decklist-to-wants
[17]: https://help.cardmarket.com/en/AffiliateProgram
[18]: https://blog.cardkingdom.com/deck-builder-craft-your-next-deck/
[19]: https://blog.cardkingdom.com/card-kingdom-csv-import-tool/
[20]: https://www.cardtrader.com/docs/api/full/how-to-buy
[21]: https://api.scryfall.com/cards/named?exact=Sol%20Ring&set=c21
[22]: https://scryfall.com/docs/faqs/where-do-scryfall-prices-come-from-7
[23]: https://scryfall.com/docs/api/bulk-data
[24]: https://scryfall.com/docs/api
[25]: https://company.wizards.com/en/legal/fancontentpolicy
[26]: https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180
[27]: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563107
[28]: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035732365
[29]: https://www.inc-conso.fr/node/10164
[30]: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047663185
[31]: https://www.dalloz-actualite.fr/document/ord-n-2024-978-6-nov-2024-jo-7-nov
[32]: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
[33]: https://www.mtggoldfish.com/premium
[34]: https://topdecked.com/articles/powered-features
[35]: https://edhrec.com/articles/?p=107636

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

### Goals

- From the acquisition plan, a player picks a market and a seller and reaches that seller's cart or wants list with every line mapped or listed as unmapped, prices dated in the market's currency, and any affiliate relationship labelled at the click and listed on the disclosure page.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-32-01

As a player ready to buy the missing cards, I want the exact printings sent to a seller's cart in the market I chose, so that an affiliate link is labelled where I click it.

#### US-32-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-32-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-32-01 Happy path

Given a signed-in player and the English locale
When the handoff lists printing, quantity and the market.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-32-02 Happy path

Given a signed-in player and the English locale
When copies owned across decks are already subtracted.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-32-03 Happy path

Given a signed-in player and the English locale
When any affiliate parameter is visible on the link, not only in a footer.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-32-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-32-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-32-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests get no handoff. Affiliate codes stay off until the seller and the lawyer agree.

#### AC-32-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-32-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-32-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The player picks the seller, then leaves for that seller's site. We do not take payment.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the acquisition plan. Writes nothing on the seller. A regional price needs a source with display rights. Until then the stored USD amount is labelled as such.

### Analytics and telemetry

`seller_handoff_clicked {market: us or eu, affiliate: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests get no handoff. Affiliate codes stay off until the seller and the lawyer agree.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Which seller is first, and whether EUR display rights exist, are open. I-96's two labels are not this handoff.

### Sources

- https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html
- https://manapool.com/mass-entry-info
- https://manapool.com/affiliates

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-32-101

As a player, I want the product to a seller registry reviewed in pull requests, with no affiliate code active, and a public disclosure page linked from the footer (slice 0)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A seller registry reviewed in pull requests, with no affiliate code active, and a public disclosure page linked from the footer (slice 0).

#### AC-32-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-32-102

As a player, I want the product to copy-and-open handoffs for Mana Pool, TCGplayer, Cardmarket and Card Kingdom that state what the seller keeps, what must be picked again, and which lines could not be mapped (slice 1)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Copy-and-open handoffs for Mana Pool, TCGplayer, Cardmarket and Card Kingdom that state what the seller keeps, what must be picked again, and which lines could not be mapped (slice 1).

#### AC-32-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-32-103

As a player, I want the product to dated Scryfall prices in USD and EUR, per finish, with source, date and a stale label after 24 hours, from one job shared with I-29 (slice 2)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Dated Scryfall prices in USD and EUR, per finish, with source, date and a stale label after 24 hours, from one job shared with I-29 (slice 2).

#### AC-32-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-108 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-32-104

As a player, I want the product to an explicit EU or US market choice, never inferred from the locale and never converted, with totals by deck, category and price band (slice 3)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: An explicit EU or US market choice, never inferred from the locale and never converted, with totals by deck, category and price band (slice 3). This is I-06's region-aware provider and per-vendor breakdown, limited to the one source we may display.

#### AC-32-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-111 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-32-105

As a player, I want the product to finish, minimum condition and exact-or-any printing on each plan line, and a flag on lines owned in another printing (slices 4–5)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Finish, minimum condition and exact-or-any printing on each plan line, and a flag on lines owned in another printing (slices 4–5).

#### AC-32-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-32-106

As a player, I want the product to mana Pool's prefilled link with our affiliate code, a visible label beside every affiliate control, and a setting that removes our codes (slice 6, blocked on approval and the lawyer)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Mana Pool's prefilled link with our affiliate code, a visible label beside every affiliate control, and a setting that removes our codes (slice 6, blocked on approval and the lawyer). Further sellers follow one per pull request (slice 7).

#### AC-32-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-32-107

As a player, I want the product to count handoffs, monthly buyers and wrong-cart reports with no user, deck or IP column, for I-30 and I-33 (slice 8)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Count handoffs, monthly buyers and wrong-cart reports with no user, deck or IP column, for I-30 and I-33 (slice 8).

#### AC-32-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-32-108

As a player, I want the product to free-copies and budget-tier handoffs and the CardTrader token flow behind a security review (slices 9–11)., so that a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

#### AC-32-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Free-copies and budget-tier handoffs and the CardTrader token flow behind a security review (slices 9–11).

#### AC-32-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-32-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-32: Seller Handoff, Affiliate Links And Buy-This-Deck Carts

**Spec:** [`specs/i32-seller-handoff-and-affiliate-carts.md`](i32-seller-handoff-and-affiliate-carts.md)

**Outcome:** a player sends the exact printings still missing across their decks, net of owned copies, to a seller's cart or wants list, priced for the market they chose, with any affiliate link labelled where they click.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium
**Depends on:** I-06's acquisition plan, which ships. Affiliate activation waits for each seller's approval and the lawyer's answer on disclosure; free-copies and budget-tier carts wait for I-16 slice 4 and I-17 slice 6.

I-06 stops one step short of buying: the plan lists missing printings with undated USD estimates, and the player rebuilds the cart by hand from a CSV. A buy button is no longer rare. Moxfield has opened Mana Pool's mass entry since 30 May 2025 ([announcement](https://manapool.com/library/platform/2025/05/30/moxfield-manapool-integration.html)), and the AI builder mtgcommander.ai sends a generated list to a Mana Pool cart in one click ([Mana Pool](https://manapool.com/mass-entry-info)). What sets this initiative apart is what goes into the cart: exact printings, owned copies removed across several decks, budget tiers, a chosen market priced in its own currency, and a labelled affiliate. The income is small: Mana Pool pays 5% of a referred first sale ([affiliates](https://manapool.com/affiliates)). TCGplayer and Cardmarket grant no new API access, so listing-level prices and a cross-seller "cheapest split" are out of reach. This is stages 1 to 3 of the [I-33](i33-marketplace-ladder.md) ladder: MagicAIBuilder never takes payment, never holds a cart and never lists a seller's stock.

### Scope

- [ ] A seller registry reviewed in pull requests, with no affiliate code active, and a public disclosure page linked from the footer (slice 0).
- [ ] Copy-and-open handoffs for Mana Pool, TCGplayer, Cardmarket and Card Kingdom that state what the seller keeps, what must be picked again, and which lines could not be mapped (slice 1).
- [ ] Dated Scryfall prices in USD and EUR, per finish, with source, date and a stale label after 24 hours, from one job shared with I-29 (slice 2).
  - Re-pointed 2026-11-10 to [I-67](i67-one-card-data-pipeline.md) slice 5, which writes every printing's daily price; this slice keeps the labels, the source, the date and the stale rule.
- [ ] An explicit EU or US market choice, never inferred from the locale and never converted, with totals by deck, category and price band (slice 3). This is I-06's region-aware provider and per-vendor breakdown, limited to the one source we may display.
- [ ] Finish, minimum condition and exact-or-any printing on each plan line, and a flag on lines owned in another printing (slices 4–5).
- [ ] Mana Pool's prefilled link with our affiliate code, a visible label beside every affiliate control, and a setting that removes our codes (slice 6, blocked on approval and the lawyer). Further sellers follow one per pull request (slice 7).
- [ ] Count handoffs, monthly buyers and wrong-cart reports with no user, deck or IP column, for I-30 and I-33 (slice 8).
- [ ] Free-copies and budget-tier handoffs and the CardTrader token flow behind a security review (slices 9–11).
- Moved 2026-11-10: the price watch on the player's own plan (requirements 6.3 and 6.4, slice 12) is now [I-59](i59-prices-over-time-and-alerts.md)'s, so that one price series and one alert engine serve every list.

### Engineering enablers

- Randomizing commission fields never changes seller order, and no ordering code reads them.
- Generated URLs never contain a user ID, deck ID, username or email, and no page loads a third-party affiliate script.
- A golden fixture per seller covers double-faced, split, foil-only, etched, Secret Lair and unmappable cards.
- A handoff leaves `CollectionCard` and `AcquisitionIntent` unchanged.

**Paid-tier angle:** prices, the market choice, the plan and every handoff stay free, by Scryfall's paywall clause and because affiliate income depends on click volume. The candidate was a price watch on the player's own plan, with that plan's price history; both moved to [I-59](i59-prices-over-time-and-alerts.md), which proposes the history free and keeps alerts above a free allowance as the candidate.

### Enrichment (2026-11-11)

**User story.** As a player ready to buy the missing cards, I want the exact printings sent to a seller's cart in the market I chose, so that an affiliate link is labelled where I click it.

**Acceptance.**
- The handoff lists printing, quantity and the market.
- Copies owned across decks are already subtracted.
- Any affiliate parameter is visible on the link, not only in a footer.

**UX.** The player picks the seller, then leaves for that seller's site. We do not take payment.

**Data and API.** Reads the acquisition plan. Writes nothing on the seller. A regional price needs a source with display rights. Until then the stored USD amount is labelled as such.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `seller_handoff_clicked {market: us or eu, affiliate: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests get no handoff. Affiliate codes stay off until the seller and the lawyer agree.

**Open questions.** Which seller is first, and whether EUR display rights exist, are open. I-96's two labels are not this handoff.

### Definition of done

From the acquisition plan, a player picks a market and a seller and reaches that seller's cart or wants list with every line mapped or listed as unmapped, prices dated in the market's currency, and any affiliate relationship labelled at the click and listed on the disclosure page.

---

