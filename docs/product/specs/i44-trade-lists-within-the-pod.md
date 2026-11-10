# I-44: Trade Lists Within The Pod And Nearby Players

> **Initiative:** I-44, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later, with a cheap early part: private lists, share links, the balance view and the friends audience (slices 1 to 7) need no [I-38](i38-trust-safety-and-user-rights.md) work and collect no new personal data · **Written 2026-11-09**
> **Research:** one dated note on trade apps, their legal pages, community threads and EU law. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** have and want lists, their audiences and share links, matching, the trade balance view, structured trade proposals, the city opt-in for nearby players, and trade reputation. **Does not own:** collection ownership and the acquisition plan ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)); free copies ([I-16](i16-decks-buildable-from-a-collection.md)); collection import ([I-26](i26-collections-arriving-from-elsewhere.md)); pods ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)) and their Discord surface ([I-23](i23-the-pods-own-surface.md)); stores and check-in ([I-41](i41-store-commander-nights.md)); reporting, moderation, blocking, the age statement and account deletion (I-38); seller hand-off ([I-32](i32-seller-handoff-and-affiliate-carts.md)); plans and billing ([I-30](i30-business-model-and-paid-tier.md)).
> **Touches one non-goal:** the roadmap excludes a "full card-trading marketplace" ([deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)). This spec stays below it; requirement 1 places it on the [I-33](i33-marketplace-ladder.md) ladder.
> **Proposed 2026-11-10: fold into I-56's wanted list (owner question).** [I-56 requirement 1.4](i56-wishlists-friends-can-buy-from.md#1-one-wanted-list) proposes that the want lists of requirements 2.1 to 2.3 become I-56's single wanted list, read here through its "open to trades" switch. I-44 would keep have lists, audiences, matching, proposals and the balance view; its data model would lose the want side, and slices 1 and 2 would cover have lists only. The requirements below stay as written until the owner decides, before slice 1 starts. I-56 slice 0 answers open question 6.

## Overview

Commander players trade cards with the people they play with. Today they ask "do you have this for trade?" at the table, or in the pod's group chat. A deckbuilder already knows two things that question needs: which cards each of the player's decks is still missing, and which owned copies no deck uses.

This initiative turns those two facts into **have** and **want** lists. Lists are private by default. A player can share a list by link, or match it against friends, a pod, a store's players and, opt-in, other adults in the same city. A balance view totals both sides of a swap from free daily price data, shown as-is with its date. A structured proposal names the cards, a store or "our next game", and a time slot.

Three boundaries shape every requirement:

- **No money.** The product never holds money, cards or shipments and never lists a price. It stays below the marketplace line that I-33 records.
- **No chat.** Proposals carry no free text, so I-38's "no private messages" default holds.
- **Coarse location.** Location is opt-in, city-level, adults only, and never a distance or a map.

The evidence also sets the order of work. A free French app that matches nearby players reached 36 points on r/magicfrance, yet its users in Rouen, the Paris region and a town of 50,000 found few or no players near them [1]. Trades happen first between people who already play together. So the pod and friends come first, and nearby players last.

## What the market does

Read 2026-11-09 unless dated otherwise. Reddit blocks automated reads, so threads were read through the Arctic Shift archive; scores are as archived.

| Product                         | Lists and sharing                                                                  | Who is matched                                                              | Contact and meeting                                                                                                                                           | Safety and age                                                                                                                           | Price data and money                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SuperSwap** (FR, 2026-05) [1] | Have and want lists; share by link or QR code, "even with someone without the app" | Nearby players and the player's group; browse mode; nearby-match alerts [2] | In-app chat and proposals; meeting in person [2]                                                                                                              | Adults only; GPS or postcode snapped to an 8 km grid; others see a rounded distance [3][4]; messages read by a person only on report [4] | Cardmarket's public daily price guide, all languages combined [1]; free, funded by affiliate links; "a venue, not a party to any transaction" [3] |
| **Deckerr** (FR, 2026-09) [5]   | Sell, trade and want lists                                                         | The player's store community                                                | Appointments at the store: "no purchase or sale happens in the app" (post, translated); the App Store page says members "buy, sell and trade" with each other | Rated 4+ on the App Store                                                                                                                | Free for players; the developer wants stores to fund it                                                                                           |
| **EchoMTG** (2026-04) [6][7]    | Tradable cards and wants                                                           | Want-list alerts across all users                                           | Proposal, counter, accept; both sides ship by mail with tracking                                                                                              | Value tiers; two open trades until five completed; public ratings; disputes paused for an admin                                          | TCGplayer market price; free up to $50 a trade, paid plan above; "We don't move money or hold cards"                                              |
| **Dragon Shield** (2026-11) [8] | Wish and trade lists                                                               | Friends' collections, wish and trade lists                                  | Not described                                                                                                                                                 | Rated 9+                                                                                                                                 | Trade value of both sides "instantly"; free app; 8.2.1 (2026-11-05) brought "simpler trade quantities"                                            |
| **ManaBox** [9]                 | Not described                                                                      | Not described                                                               | Not described                                                                                                                                                 | Rated 12+                                                                                                                                | A trade tool for "better trades, faster and fairer"; the app sells a subscription, and the page does not say whether the tool is in it            |
| **TappedOut** [10]              | Trade binder (forum)                                                               | Not described on the page read                                              | "initiate trade requests" needs the one-time "Upgrade ($5 minimum donation)"                                                                                  | Not described                                                                                                                            | Not described                                                                                                                                     |
| **CardNexus** (2025-09) [11]    | Free tracker with lists for trades                                                 | Not described                                                               | Not described                                                                                                                                                 | Not described                                                                                                                            | Cardmarket and TCGplayer prices; "our marketplace launches at the end of the year" (translated)                                                   |

Five findings:

1. **Where a price is stated, lists, sharing and a value comparison are free.** TappedOut is the exception: it charges $5 once to start a trade request [10]. EchoMTG charges only above $50 a trade, saying "The free tier is for collecting; the paid tiers are for trading at scale" [7].
2. **Nearby matching has a cold-start problem.** Under the SuperSwap post, one user in Rouen found the nearest players 100 km or more away. Another found few in the Paris region, and a third found nobody in a town of 50,000 [1]. On Deckbox, a long-standing trade site, the top-scoring reply to "do people actually respond?" (2026-08-19) was "Feels less active recently", and a trader with about 230 trades said a third or more were with repeat partners [12].
3. **Meeting strangers is the risk the apps design around.** SuperSwap admits only adults "because trades happen in person, between people who don't necessarily know each other" (developer reply, translated) [1][4]. Its terms advise meeting in public places "such as local game stores" and bringing a friend [3]. Deckerr routes every trade through a store [5]. In San Francisco on 2026-05-28, a seller who had arranged online to meet a buyer of trading cards was pepper-sprayed and robbed in a park [13].
4. **No product read derives a want list from a deck.** No product read builds wants from the cards a deck is still missing, net of copies owned. None builds haves from copies no deck uses. That join is the deckbuilder's own data.
5. **Trade lists lead towards a marketplace.** CardNexus announced its marketplace in the same post as its trade lists [11]. EchoMTG ties trade size to its paid plan [7]. Requirement 1 stops this initiative before either step.

Players ask for it in both languages. A spreadsheet trade calculator scored 28 points on r/mtgfinance (2025-11-10), and an app to search friends' collections "so we stop asking 'Do you have this for trade?'" was posted to r/EDH (2026-02-05, 2 points) [14].

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `61792c1`).

- **The collection is private and per printing.** `CollectionCard` in `prisma/schema.prisma` holds `scryfallId`, `foil`, `condition` (NM to DMG, checked in `src/lib/collection/parse.ts`), `quantity` and `price`, unique per printing, finish and user. It has no language and no Oracle identity; no model in the schema has an `oracleId`. `GET /api/collection` requires a session and returns only the caller's rows. `src/app/robots.ts` disallows `/collection/`. `src/app/api/v1/collection/route.ts` returns the key holder's own collection.
- **Wants exist as a plan, not a list.** `src/lib/collection/acquisition-plan.ts` computes, per printing, the quantity still to acquire across chosen decks. `AcquisitionIntent` stores a private `proxy_now` or `buy_later` choice (`src/lib/collection/acquisition-intent.ts`).
- **A wishlist exists in name only.** The schema has `CardFavorite`, `FavoriteList` and `CardInFavoriteList` under a "Card favorites & wishlists" comment. `GET /api/favorites` returns an empty array. `POST` and `DELETE` persist nothing ("Persistence is intentionally deferred for the MVP favorites route"). `src/components/card/FavoriteButton.tsx` is rendered nowhere outside its own test.
- **No free-copies concept.** `src/app/api/collection/usage/route.ts` lists the caller's deck rows that use a printing. Nothing computes copies that no deck uses; that is I-16 slice 4.
- **No pod, store or friend.** No `Pod` or `Store` model exists. `UserFollow` is a directed edge, served by `src/app/api/community/users/[username]/follow/route.ts`. A mutual follow can be derived but is never computed. Public profiles live at `/u/[username]` and show public decks.
- **Share links exist for decks.** `Deck.shareToken` and `shareEnabled` back `POST /api/decks/[id]/share`, which draws 9 random bytes as base64url. `src/app/robots.ts` disallows `/share/` and calls it a capability URL.
- **No messaging.** No message model exists. "Chat" in `src/` matches only the AI routes' handling of OpenAI chat completions (`src/lib/ai/model-reply.ts`, `src/app/api/ai/build/route.ts`, `src/app/api/ai/suggest/route.ts`).
- **No location.** No column stores one. `src/lib/security-headers.ts` sends `Permissions-Policy: camera=(), microphone=(), geolocation=()`, so the browser location API is off site-wide.
- **Prices are USD only.** `src/lib/deck/pricing.ts` reads Scryfall's `prices.usd`; `src/lib/scryfall/types.ts` declares `eur`, which no code reads.
- **Notifications are preferences only.** `NotificationPreference` stores four toggles. Only `src/app/api/user/notification-preferences/route.ts` reads them, and nothing delivers a notification.
- **Reports cover decks only** (`DeckReport`), as I-38 describes.

## Functional requirements

### 1. Scope and the marketplace line

1.1 **Card for card only.** No list entry, proposal or page carries an asking price, a cash top-up, a "for sale" flag, a payment handle, a shipping address or a tracking number. Players settle any difference off the product; the product records none of it.
1.2 MagicAIBuilder never holds money, cards or shipments, never onboards sellers and never presents a listing as its own. These are the three conditions of [I-33 requirement 1.2](i33-marketplace-ladder.md#1-the-decision-and-its-boundaries).
1.3 **Place on the ladder.** I-33's [six stages](i33-marketplace-ladder.md#2-the-ladder) are buy-side: from affiliate links to a marketplace. This initiative adds no stage. It sits beside stages 1 to 4, in the "buyer money through MagicAIBuilder: No" column. Its listings are the supply an open player-to-player marketplace (stage 6) would need. So any item of 1.1 is a stage-5 change and needs the owner's logged "go" in [I-33's decision log](i33-marketplace-ladder.md#6-decision-log).
1.4 **Individuals only.** A store account (I-41 staff) cannot publish a have list to a store or nearby audience. Stores are meeting places here, not traders. Whether trader rules could still reach an individual who trades often is a lawyer question (open question 1).
1.5 Trade data never changes card suggestions, rankings, bracket estimates or copilot output, extending [I-33 requirement 1.4](i33-marketplace-ladder.md#1-the-decision-and-its-boundaries).

### 2. Lists

2.1 A player keeps any number of lists of two kinds, **have** and **want**, with no cap ([I-30 requirement 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
2.2 An entry holds a card, a quantity and a strictness: any printing, this set, or exact printing with finish and language. SuperSwap added the same three levels on 2026-11-03 after user requests [1]. A have entry may add a condition. Until an Oracle identity exists ([I-37](i37-editor-depth.md) slice 12), "any printing" matches on the English card name.
2.3 A have list can be filled from chosen collection rows. Once I-16 slice 4 ships, a "free copies only" option excludes copies committed to a deck. A want list can be filled from the acquisition plan for chosen decks, net of owned copies. Both refresh only when the player asks, with a preview of changes.
2.4 Lists paste in and export in the existing deck text format. CSV import is I-26's.
2.5 List names are visible to their owner only. Viewers see "Have" or "Want" with the username. No list field holds text another player can read. This keeps lists free of user prose to moderate until I-38 slice 9 ships.
2.6 Lists, audiences and proposals are in the [I-38 export](i38-trust-safety-and-user-rights.md#7-full-data-export) and are deleted with the account.

### 3. Audiences and matching

3.1 Each list is private until the owner grants an audience. Audiences are granted and revoked per list. Revoking takes effect on the next read.

| Audience | Who sees the list                                                                                           | Needs                          |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Link     | Anyone holding the URL                                                                                      | Nothing                        |
| Friends  | Players with a mutual follow                                                                                | Nothing                        |
| Pod      | Members of an I-15 pod the owner belongs to                                                                 | I-15 pods with members         |
| Store    | Adults who opted into the same I-41 store and checked in there at least once in the last 90 days (proposed) | I-41 check-in; requirement 7.2 |
| Nearby   | Adults who opted into the same city (group 6)                                                               | Requirements 6 and 7.2         |

3.2 **Share link.** An unguessable token, as for decks. The page is `noindex`, its path is disallowed in `src/app/robots.ts`, and the owner can rotate or disable it. The page shows the username and the list only: never the city, the collection or other lists. A QR code encodes the same URL. A signed-in viewer can compare the list with their own lists.
3.3 **Match.** A have entry of A matches a want entry of B when it meets B's strictness, for the smaller of the two quantities. A two-way match is one where each player has something the other wants. Matches are computed when the viewer asks and are not stored.
3.4 **Order.** Two-way matches come first, then the number of cards matched, then the audience: friends, pod, store, nearby. Order never depends on activity, login recency, card value or paid status.
3.5 Blocked players ([I-38 requirement 5.1](i38-trust-safety-and-user-rights.md#5-blocking-and-comment-controls)) never appear in each other's matches. They cannot see each other's lists through any audience except a link the owner sends.
3.6 **Trade first, then buy.** The acquisition plan marks each missing printing that a friend or pod member has on a have list visible to the player. The mark is information. It creates no proposal and changes nothing in I-32's cart.

### 4. Trade balance

4.1 The balance view takes two sides, from a match, a proposal or typed in. It totals each side from Scryfall's daily price for the exact printing and finish. The player picks USD or EUR, and amounts are never converted.
4.2 The view shows the price date, the source and Scryfall's own caveat: prices are "daily estimates" with "Absolutely no guarantee" [15]. It also shows the difference, and lists the cards with no price, which are left out of the totals. Scryfall gives one price per printing and finish, so condition and language are not priced; the view says so.
4.3 The view states the difference as a number and gives no "fair" or "unfair" verdict. It never suggests a cash top-up (1.1).
4.4 The view is free and works without an account for typed sides. Scryfall forbids paywalling its data [15].
4.5 Totals are computed per request and are not stored on any shared record.

### 5. Proposals, without messaging

5.1 Players have no private messages, chat or free text, in line with [I-38's non-goals](i38-trust-safety-and-user-rights.md#non-goals) and its default of no private messages ([9.1](i38-trust-safety-and-user-rights.md#9-minors)). A proposal is structured: the cards each side gives, a meeting option and a slot (a date, afternoon or evening).
5.2 The meeting option is "at our next game" between friends or pod members. In the store and nearby audiences it must be an I-41 store where the proposer has checked in, picked from those in the same city. Never a home address and never typed text.
5.3 A proposal is sent, countered, accepted, declined, withdrawn, or expires after 7 days. A counter changes only the cards. A decline needs no reason and shows none.
5.4 On acceptance, both players see the other's username, the meeting option and the slot. The product reveals no email, phone or other contact.
5.5 After the slot, each player may record "the swap happened" or "it did not". The product keeps who confirmed with whom and when. It deletes the cards of a closed proposal 30 days after it closes (open question 1).
5.6 "Apply to my collection" moves the given cards out and the received cards in, for each player separately and privately.

### 6. Location privacy

6.1 Nearby is off by default. A player turns it on in settings, after the adult declaration (7.2) and after reading the safety text (8.1).
6.2 The player picks a city from a list. There is no GPS, browser location, postcode or IP lookup. The site's `Permissions-Policy` already disables the browser location API.
6.3 The product stores the city, its region, the country and the date set. It keeps only the current value, with no history.
6.4 Other players see the city name. When fewer than 5 opted-in players share a city (proposed threshold), they see the region instead. No distance, map or neighbourhood is ever shown. This is coarser than SuperSwap, which shows a distance rounded to the kilometre beyond 8 km [4].
6.5 Only signed-in players who opted into the same area see the nearby audience. Signed-out visitors, search engines and the public API never do. GDPR Art. 25(2) asks that, by default, personal data are not made accessible "to an indefinite number of natural persons" [17].
6.6 Turning nearby off deletes the city row and withdraws every nearby audience in the same transaction. Account deletion does the same.
6.7 A nearby player sees only listings that match their own lists, never a browsable roster of who trades in a city. Requests are rate limited per account.

### 7. Minors

7.1 Lists, share links, the balance view and the friends and pod audiences are open to every account. A teenager trading with their own pod is the common case.
7.2 The store and nearby audiences, and proposals outside friends and pods, need a one-time declaration "I am 18 or older", recorded with its date. It adds to I-38's signup age statement ([9.2](i38-trust-safety-and-user-rights.md#9-minors)) and asks for no birth date and no document. SuperSwap restricts its whole app to adults for the same reason [1][4].
7.3 No push, email or digest about trade activity is on by default for any account ([I-38 9.1](i38-trust-safety-and-user-rights.md#9-minors)).

### 8. Scams and abuse

8.1 Before sending or accepting a proposal outside friends and pods, the product shows a short safety text. It says to meet at the store, inspect every card before swapping, bring someone for a valuable swap, and never pay or ship first. The first three come from SuperSwap's terms [3]; the last is this spec's, since the product offers no shipping.
8.2 The product never vouches for a card's authenticity or condition. I-33 records the counterfeit risk ([group 4](i33-marketplace-ladder.md#4-costs-team-and-risks-by-stage)).
8.3 Outside friends and pods, the proposed limits are: 3 open proposals until two swaps are confirmed, 10 new proposals a day, and nearby only for accounts older than 7 days. EchoMTG allows two open trades until five are completed [7].
8.4 Every list, proposal and match has a report action through I-38's generic report, with new targets `tradeList` and `tradeProposal`. A hidden list leaves every audience in the same transaction ([I-38 3.1](i38-trust-safety-and-user-rights.md#3-decisions-and-statements-of-reasons)).
8.5 A player can block from a proposal, a match or a list.
8.6 No field another player can read accepts typed text (2.5, 5.1). Cards come from card data, so a link, phone number or payment handle cannot be planted in a list.

### 9. Reputation without engagement loops

9.1 There are no stars, ratings, written reviews of players, scores, levels, badges, streaks or leaderboards.
9.2 A match or proposal shows only context the viewer can check: shared friends, pods or stores; the month the account was created; and how many distinct players confirmed a swap with this player, in bands of none, 1 to 4, and 5 or more.
9.3 The band is never sortable, never used for order (3.4) and never shown outside trade screens.
9.4 A bad experience goes to a report that a person decides with a statement of reasons (I-38 group 3), not to a public rating. EchoMTG's public ratings need a support route for wrong or retaliatory ratings [7].
9.5 No notification is designed to bring the player back. A notification fires only when a proposal addressed to the player changes state, and only if the player turned it on.

### 10. Free and paid

10.1 **Free on every plan:** lists, filling them from the collection and the plan, import and export, share links and QR codes, the balance view, matching within friends, pods and stores, on-demand nearby matching, proposals, safety, reporting, blocking and export.
10.2 **Why free.** SuperSwap, Dragon Shield and EchoMTG give lists and a value comparison away, CardNexus gives trade lists away, and SuperSwap shares lists by link or QR code [1][6][8][11]. A paywall on them would lose players for no gain. Scryfall forbids paywalling its prices [15]. I-30 keeps sharing free (1.1) and never charges for the player's own data (1.2). TappedOut charges $5 to start a trade request [10]. This spec rejects that model, because contact and safety are never paid levers ([I-38 10.1](i38-trust-safety-and-user-rights.md#10-the-paid-tier-boundary)).
10.3 **Candidate for I-30, decided there:** a continuous watch. It checks the player's wants against every audience the player can see (several pods, stores and the city) and sends a daily or weekly digest. It is a personal tool that watches over time ([I-30 1.3](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). It also costs background compute and an email sender (I-63 slice 7, formerly I-38 slice 13).
10.4 **The evidence for paying is weak.** SuperSwap alerts on nearby matches for free [2], and EchoMTG alerts on want-list matches for free [6]. I-30 should not plan revenue on 10.3.
10.5 A paid plan never changes who sees a list, the order of matches or the limits in 8.3.

## Data model / API

```
TradeList          id, userId, kind (have | want), name (owner only), shareToken? @unique, shareEnabled, createdAt, updatedAt
TradeListEntry     id, listId, cardName, scryfallId?, strictness (anyPrinting | set | exact), setCode?, finish (any | nonfoil | foil | etched),
                   language?, condition? (have only: NM | LP | MP | HP | DMG), quantity, source (manual | collection | plan), updatedAt
TradeListAudience  listId, scope (friends | pod | store | nearby), scopeId?, grantedAt            @@id([listId, scope, scopeId])
TradeArea          userId @id, cityId, regionId, countryCode, adultDeclaredAt, setAt               -- deleted on opt-out
TradeProposal      id, fromUserId, toUserId, parentId?, give Json, take Json, meeting (nextGame | store), storeId?,
                   slotDate, slotPart (afternoon | evening), status (sent | countered | accepted | declined | withdrawn | expired),
                   createdAt, respondedAt?, itemsPurgedAt?
TradeConfirmation  proposalId, userId, outcome (happened | didNotHappen), confirmedAt              @@id([proposalId, userId])
```

The city list is a static reference file with each city's region. It needs an openly licensed source; the licence is to be checked when slice 12 starts. `give` and `take` become empty when the purge job sets `itemsPurgedAt` (5.5). A schema test fails when a trade model gains a text column another player can read (2.5, 8.6).

Routes: `GET|POST /api/trade-lists`; `PATCH|DELETE /api/trade-lists/[id]`; `POST /api/trade-lists/[id]/fill` (`from: collection | plan`, preview first); `POST /api/trade-lists/[id]/share` (enable, rotate, disable); `GET /api/trade-share/[token]` (public, allowlisted fields); `GET /api/trade-matches?audience=…`; `POST /api/trade-balance` (no session needed); `PUT|DELETE /api/user/trade-area`; `POST /api/trade-proposals`; `PATCH /api/trade-proposals/[id]`; `POST /api/trade-proposals/[id]/confirm`. The public page sits under a path that `src/app/robots.ts` disallows.

## Non-goals

- Money in any form: asking prices, sale listings, cash top-ups, payment, escrow, wallets, store credit, shipping labels or tracking (1.1, I-33).
- Private messages, chat or free-text notes between players (I-38 non-goal).
- GPS, postcodes, distances, maps or heat maps of players.
- Public ratings or reviews of players, trader levels and leaderboards.
- Store stock or buylists in matches. A store is a meeting place here; seller hand-off is I-32's.
- A venue directory. The store picker lists only the I-41 stores in the player's city where the proposer has checked in ([I-41 non-goals](i41-store-commander-nights.md#non-goals)).
- Card scanning, which stays a roadmap non-goal. Lists fill from the collection or from text.
- Authenticating or grading cards.
- Games other than Magic, although SuperSwap and Deckerr cover five or six [2][5].
- Automatic proposals or auto-accept.
- A Discord command that answers "who in my pod has this card". I-23 could add one later.

## Testing strategy

- **Matching (solitary):** a table of strictness × finish × language × quantity cases; two-way detection; a stable order under 3.4; blocked pairs excluded.
- **Filling lists (sociable, PostgreSQL):** a want list filled from the plan equals the plan's quantities to acquire. Once I-16 slice 4 ships, a have list in free-copies mode excludes every committed copy.
- **Share link (sociable):** an allowlist test on the public payload (no email, city, collection or other lists); `noindex` and the robots rule are present; a rotated token returns 404.
- **Balance (solitary):** USD and EUR totals from fixtures; unpriced cards listed and excluded; the price date shown; no exchange rate anywhere in the module.
- **Audience isolation (sociable):** a list shared with pod A is unreachable from pod B, from a signed-out request and from `/api/v1`; a revoked audience disappears on the next read.
- **Location (sociable):** opting out deletes the row; the region fallback switches exactly at the threshold; no route returns another player's city outside a nearby match.
- **Minors (sociable):** without the adult declaration, store and nearby routes return 403, and so do proposals outside friends and pods.
- **Proposals (solitary and sociable):** every state transition; expiry at day 7; each limit at its boundary; the purge job is idempotent and empties `give` and `take` at day 30.
- **Reputation (solitary):** band boundaries at 0, 1, 4 and 5; no sort parameter accepts the band.

## Delivery slices

| #   | Slice                                                                                                           | Depends on                                                        |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Private have and want lists: model, create and edit, strictness levels, text paste and export                   | —                                                                 |
| 2   | Fill a have list from the collection and a want list from the acquisition plan, with a preview                  | 1                                                                 |
| 3   | Share link and QR code: token, allowlisted public page, `noindex`, robots rule, rotate and disable              | 1                                                                 |
| 4   | Balance view: two sides, USD or EUR from Scryfall, dated, unpriced cards listed, no account needed              | —                                                                 |
| 5   | "Compare with mine" on a shared list for a signed-in viewer                                                     | 3                                                                 |
| 6   | Friends audience (mutual follows) and the match view                                                            | 1                                                                 |
| 7   | Trade-first marks on the acquisition plan                                                                       | 2, 6                                                              |
| 8   | Pod audience                                                                                                    | 6; I-15 slice 3 and a pod-membership decision (open question 2)   |
| 9   | Proposals between friends and pod members: structure, states, expiry, confirmation, collection apply, purge job | 6; I-38 slice 12 (block); I-63 slices 1 to 3 for proposal notices |
| 10  | Report targets for lists and proposals; a hidden list leaves every audience                                     | 9; I-38 slices 8 to 10                                            |
| 11  | Free-copies mode for have lists                                                                                 | 2; I-16 slice 4                                                   |
| 12  | Adult declaration and city opt-in: city list, region fallback, deletion on opt-out, export entry                | I-38 slices 6 and 7; lawyer answers (open question 1)             |
| 13  | Store audience and the store meeting option, with limits and safety text                                        | 10, 12; I-41 slice 5                                              |
| 14  | Nearby audience: on-demand matches only, reciprocity, rate limits, account-age delay                            | 13; the cold-start gate (open question 4)                         |
| 15  | Reputation context: shared context and confirmed-partner bands                                                  | 9                                                                 |
| 16  | Continuous match watch with digest                                                                              | **Blocked** on I-30's decision; 14; I-63 slice 10                 |

Slices 1 to 7 need no I-38 work: they show card data only, to the owner, to a link holder or to mutual follows. Slice 4 also serves players who never sign in. Scheduled agents must not pick slice 12 or later before the lawyer answers are committed, because location, age and DAC7 are decisions, not code.

## Open questions

1. **Lawyer questions** (research, not legal advice), to add to [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate):
   - DAC7 makes platforms report sellers' consideration. UK guidance treats barter as consideration valued at the item's value, unless the operator cannot reasonably determine that value [18]. Does matching card-for-card lists make MagicAIBuilder a platform operator? Does deleting the cards and never storing totals (4.5, 5.5) change that?
   - DSA Recital 14 says information shared in a group counts as "dissemination to the public" only when members join "without a human decision or selection of whom to grant access" [16]. Are friends and pod lists therefore outside it, while share links, store and nearby audiences are inside it?
   - Can trader traceability (DSA Art. 30) or seller-status disclosure reach an individual who trades often, when no distance contract is concluded through the product?
   - Is a city with its region, opted in and shown only to opted-in adults, proportionate under GDPR Arts. 5(1)(c) and 25 [17]? Is a feature-level "18 or older" declaration enough next to I-38's signup statement?
2. **What is a pod?** I-15 leaves open whether a pod is durable, with members, or a one-night group. Slice 8 needs accounts as members. I-41's one-night `NightPod` does not give that.
3. **Is chat needed?** SuperSwap pairs proposals with chat [2]. Here, strangers can only agree on a store and a slot, which may not be enough to meet. Adding messages would reverse an I-38 non-goal. That is the owner's call, and moderation would then cover private text.
4. **Will nearby reach density?** SuperSwap's users found few players even around Paris [1]. A proposed gate for slice 14: at least 200 players have shared a list with friends or a pod, measured through [I-39](i39-first-run-activation-and-measurement.md)'s events. The owner confirms or changes the number.
5. **Should the store audience be adults only?** Teenagers play at stores, and a store is a public place. Opening it to minors weakens 7.2, so this spec keeps it closed unless counsel and the owner decide otherwise.
6. **What happens to the unused wishlist?** `CardFavorite` and `FavoriteList` and the non-persisting favorites routes overlap with want lists. Retiring them, or migrating them into want lists, is a separate clean-up decision.

## Sources

Read on 2026-11-09 unless dated otherwise. Reddit threads were read through the [Arctic Shift archive API](https://arctic-shift.photon-reddit.com/), because Reddit refuses automated reads; scores are as archived. App Store data comes from Apple's iTunes lookup API. Legal sources are research, not legal advice.

1. SuperSwap's developer, "J'ai fait une appli gratuite pour échanger ses cartes Magic avec les joueurs autour de soi", r/magicfrance, 2026-10-29, 36 points, 42 comments, including the developer's replies on adults only, prices and printing levels (2026-10-29 to 2026-11-03) and users' replies on Rouen, Paris and a town of 50,000 (2026-10-29 to 2026-10-31). <https://www.reddit.com/r/magicfrance/comments/1xim9wg/>
2. SuperSwap - Échange local, App Store listing: first release 2026-05-12, version 1.0.73 of 2026-11-09, rated 17+, free. <https://apps.apple.com/fr/app/superswap-%C3%A9change-local/id6760420664>
3. SuperSwap, Terms of Service, version 3, effective 2026-09-25. <https://superswap.gg/terms/>
4. SuperSwap, Privacy Policy, version 4, 2026-09-25. <https://superswap.gg/privacy/>
5. Deckerr's developer, r/magicfrance, 2026-09-25, 9 points <https://www.reddit.com/r/magicfrance/comments/1wpxrx2/>; App Store listing, first release 2026-09-21, version 1.4 of 2026-11-06, rated 4+ <https://apps.apple.com/fr/app/deckerr/id6812036688>
6. EchoMTG, "Trading Just Got Better on EchoMTG", 2026-04-27. <https://www.echomtg.com/blog/136/trading-just-got-better-on-echomtg/>
7. EchoMTG, "Trading Safety and Thresholds", 2026-04-29. <https://www.echomtg.com/blog/167/trading-safety-and-thresholds/>
8. MTG Scanner - Dragon Shield, App Store listing, version 8.2.1 of 2026-11-05, rated 9+. <https://apps.apple.com/us/app/id1460657155>
9. ManaBox, home page ("Fair trades", © 2026) <https://manabox.app/>; App Store listing, version 4.3.0 of 2026-11-03, rated 12+, subscriptions at $2.49 a month or $22.99 a year <https://apps.apple.com/us/app/id1460407674>
10. TappedOut, "Level up" help page, © 2026. <https://tappedout.net/help-desk/level-up/>
11. CardNexus, r/magicfrance beta announcement, 2025-09-09, 26 points. <https://www.reddit.com/r/magicfrance/comments/1ncdt9q/>
12. "Does anyone use Deckbox to buy or trade? Do people actually respond to you?", r/mtgfinance, 2026-08-19, 7 points, 15 comments. <https://www.reddit.com/r/mtgfinance/comments/1vs6j7o/>
13. ABC7 News, Pokémon card robbery arrests in San Francisco, 2026-06-12 (robbery on 2026-05-28). <https://abc7news.com/amp/post/pokmon-card-robbery-arrest-caught-camera-thefts-san-francisco-spark-alert-bay-area/19279793/>
14. "Card Database and Trade Calculator", r/mtgfinance, 2025-11-10, 28 points <https://www.reddit.com/r/mtgfinance/comments/1otj4de/>; "I built an app to search my friends' MTG collections…", r/EDH, 2026-02-05, 2 points <https://www.reddit.com/r/EDH/comments/1qwzioh/>
15. Scryfall, API documentation: the no-paywall guideline and the price disclaimer <https://scryfall.com/docs/api>; card objects, the `prices` field ("daily price information") <https://scryfall.com/docs/api/cards>
16. Regulation (EU) 2022/2065 (Digital Services Act) <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065>; Recital 14 read from a transcription site <https://www.eu-digital-services-act.com/Digital_Services_Act_Preamble_11_to_20.html>
17. Regulation (EU) 2016/679 (GDPR), Art. 25. <https://gdpr-info.eu/art-25-gdpr/>
18. HMRC, International Exchange of Information Manual, IEIM901710 "Form of Consideration", the UK rules implementing the OECD model that DAC7 follows, updated 2026-10-15. The EU directive's own text was not read. <https://www.gov.uk/hmrc-internal-manuals/international-exchange-of-information/ieim901710>
