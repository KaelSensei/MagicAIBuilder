# I-56: Wishlists Friends Can Buy From

> **Initiative:** I-56, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 4 (one wanted list, filled from the acquisition plan, shared by link, with reservations hidden from the owner); Later for the rest · **Written 2026-11-10**
> **Research:** one dated note on MTG collection tools, gift registries and player threads. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the player's one wanted list and its items, filling it from the plan, by hand, from precons and from sealed products, the gift audiences and gift page, reservations and the surprise rule, received gifts, the owner's gift-window notice, and the giver's store view. **Does not own:** ownership, printings and the acquisition plan ([I-06](i06-collection-and-purchase-planning.md)); prices, markets, seller adapters, affiliate rules and the price watch ([I-32](i32-seller-handoff-and-affiliate-carts.md)); have lists, trade audiences, matching and proposals ([I-44](i44-trade-lists-within-the-pod.md)); spare copies and keep marks ([I-45](i45-selling-spare-cards.md)); loans and households ([I-51](i51-cards-lent-and-borrowed.md)); the player's printing rule ([I-57](i57-printing-preferences-everywhere.md)); the precon catalogue ([I-17](i17-precon-path-and-tiered-upgrades.md)); reporting, blocking, export, deletion and the defaults for minors ([I-38](i38-trust-safety-and-user-rights.md)); plans and billing ([I-30](i30-business-model-and-paid-tier.md)).
> **Changes one neighbour:** I-44's want lists become the wanted list defined here (requirement 1.4). I-44 keeps everything else.

## Overview

Players already keep a list of cards they want: the cards their decks still miss, plus a few they would love to own. Around a birthday or the holidays, a partner, a parent or a friend asks what to buy. The person asking often does not play. They do not know which version of a card the player wants, or what the player already owns. Two relatives can also buy the same card.

This initiative gives each player **one wanted list**. It fills from I-06's acquisition plan, net of owned copies, and by hand. Each item says how much it matters, which printing or "any printing", the finish, the language and the minimum condition. Precons and other sealed products can be on it too.

The player can share the list for gifts. A friend opens a link, picks an item and marks "I'm buying this". Other givers see it as taken, so two people do not buy the same card. The owner never sees what was reserved. The giver can take a printable list to a local store, or send the reserved cards to a seller's cart through I-32, with I-32's affiliate labels.

The same list feeds I-44's trade matching, so a player never keeps two want lists that drift apart.

Four boundaries hold throughout:

- **No money and no addresses.** The product never takes payment, pools money, stores a shipping address or ships anything. It stays below the marketplace line that [I-33](i33-marketplace-ladder.md) records.
- **No typed text between people.** Items come from card data, so I-38's "no private messages" default and I-44's rule [2.5](i44-trade-lists-within-the-pod.md#2-lists) hold.
- **No identity on the page by default.** A gift page shows no name, avatar, age, birthday or location. A minor's list exposes nothing about them.
- **No engagement loops.** No view counts, top givers or spending totals. Givers' spending is never recorded.

## What the market does

Read on 2026-11-10 unless dated otherwise. Evidence strength: **strong** means the vendor's own help page or documentation, read directly; **medium** means a store listing, marketing page or public issue tracker; **weak** means player threads, or a search engine's summary of a page that refused automated reads.

**MTG tools**

| Product                                  | Where wishes come from                                                                                                             | Sharing                                                                                           | Printing, condition, language                                                           | Buying                                                         | Evidence |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
| **TappedOut** [1]                        | Trade binder and "aquireboard"; "need" syntax in a deck ("1x Demonic Tutor _Need: 2_")                                             | Not described                                                                                     | Not described                                                                           | "Click the checkout button then pick TCGPlayer or CardKingdom" | Strong   |
| **Deckbox** [2]                          | A Wishlist created at sign-up; paste import; missing deck cards "quickly add them to your wishlist"                                | Trade list "just a link away"; automatic trade matches                                            | Not described on the pages read                                                         | Not described                                                  | Medium   |
| **Moxfield** [3]                         | "Add to Wish List" for a whole deck; it skips cards that match the collection exactly, which a user reported as a bug (2025-05-08) | A shared wish list shows an image in embeds; "The Wish List is a modified deck list" (2025-05-21) | Not found                                                                               | Not found                                                      | Medium   |
| **Dragon Shield** 8.2.1 (2026-11-05) [4] | Wish and trade lists                                                                                                               | "View your friends' collection, decks, wish and trade list"; "Share your own lists"               | Not described                                                                           | Not described                                                  | Medium   |
| **Grimoria** v2.3.49 [5]                 | Want lists                                                                                                                         | On the public profile and in shared trade deals                                                   | "Priority and condition preferences per card"                                           | Not described                                                  | Strong   |
| **Cardmarket** [6]                       | Wants lists: up to 100 per game, 150 entries each                                                                                  | No native sharing found                                                                           | Expansion, languages, min. condition, foil, signed, altered, buy price; one email alarm | Shopping Wizard on its own marketplace                         | Strong   |
| **TCGplayer** app 5.5.0 [7]              | Lists of scanned cards                                                                                                             | Shared with friends; saving needs sign-in                                                         | Not described                                                                           | Its marketplace                                                | Weak     |
| **ManaBox** 4.3.0 [8]                    | "Binders and lists"                                                                                                                | Deck links "opened in any browser"; a single card with "a link to the marketplace of your choice" | Not described                                                                           | Marketplace link per card                                      | Medium   |
| **Archidekt** [9]                        | No wishlist found on its FAQ                                                                                                       | —                                                                                                 | —                                                                                       | —                                                              | Weak     |

**Gift registries**

| Product                              | Hidden from the owner                                                                                                                                                            | Who can reserve, and undo                                                                                                      | Children                                                                     | Evidence                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------- |
| **Amazon** Wish Lists [10]           | "You won't see which items have been bought unless you try to buy one someone already purchased"; its help page warns a signed-out view "may reveal a surprise" (search summary) | Buying is the reservation; purchased items leave the list; the owner may add a shipping address                                | Not read                                                                     | Strong; help page weak (503) |
| **Giftster** 6.2.7 (2026-11-06) [11] | "The person who made the list never sees what's been claimed"                                                                                                                    | Group members; lists shared by link or QR code                                                                                 | "Create and manage lists for children"; the app is rated 17+                 | Medium (help pages refused)  |
| **Elfster** [12]                     | "The Wishlist owner won't be notified or see that the wish has been marked as purchased"                                                                                         | Signed-in givers; a count for multiple quantities; "Undo Mark as Purchased"                                                    | A parent managing a child's account "cannot mark items as purchased" from it | Strong                       |
| **Wishpicks** [13]                   | Hidden by default; the list "looks the same whether or not anything's reserved"                                                                                                  | By default anyone with the link, without an account; "Only signed-in people" is an option; lasts until cancelled; one per wish | Not read                                                                     | Strong                       |

Six findings:

1. **Every MTG collection tool read keeps a wishlist, and none read lets a friend mark an item as being bought.** TappedOut, Deckbox, Moxfield, Dragon Shield, Grimoria and Cardmarket have one; Dragon Shield, Grimoria and Moxfield show it to others [1]–[6]. Strong for existence, medium for sharing.
2. **Wishes come from decks one deck at a time.** TappedOut's need syntax, Deckbox's missing cards and Moxfield's whole-deck add all start from one deck [1][2][3]. None read nets several decks against owned printings, which I-06's plan already does. Players disagree on owned copies: one Moxfield issue asks to add only cards not in the collection, to export to Cardmarket (2024-04-22); another reports the exact-match skip as a bug (2025-05-08) [3]. Medium.
3. **Gift registries agree on the surprise rule.** All four hide reservations from the owner [10]–[13]. Elfster and Wishpicks let a giver undo [12][13]. Wishpicks lets guests reserve without an account by default [13]. Amazon's own warning, known here only from a search summary, shows the rule is a courtesy, not a lock [10]. Strong for Elfster and Wishpicks; medium for Giftster; weak for Amazon's warning.
4. **Children's lists are run by a parent.** Giftster and Elfster both have them, and Elfster stops a parent from marking purchases from the child's account [11][12]. Medium.
5. **Givers who do not play do not know what to buy.** A wife asks what to get a husband who "plays commander" (r/EDH, 27 points); one reply (15 points) asks whether she knows his playgroup, who "could recommend single card upgrades" [14]. A mother of a 16-year-old (r/magicTCG, 96 points) is told "Ask him what format he plays" (49 points) [15]. A father's partner looks for a gift under 50 USD for his son, who turns 14 (24 points) [16]. Under another thread: "If you can figure out a single they want, that is the best gift you can get a magic player" [17]. Two of the threads concern teenagers. Weak: anecdotes, scores as archived.
6. **Wrong printings and duplicates are an inference, not an observed complaint.** The search found no thread where a relative bought the wrong printing or a duplicate; the archive's comment search timed out. A player who buys himself "this beautiful foil" printing each birthday shows that the exact printing can matter [18]. The registries' reservation design exists to stop duplicates [10]–[13]. Weak.

**Prices.** Scryfall forbids paywalling its data, asks that card data stay reachable "anonymously or with free accounts", and calls its prices "daily estimates" with "Absolutely no guarantee" [19].

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **A wishlist exists in name only.** `prisma/schema.prisma` declares `CardFavorite`, `FavoriteList` and `CardInFavoriteList` under the comment "Card favorites & wishlists"; migration `20260402140815_add_deckcard_power_toughness` creates them. `GET /api/favorites` returns `[]`. `POST /api/favorites` checks no session and answers 201 for data it discards ("Persistence is intentionally deferred for the MVP favorites route"); `DELETE /api/favorites/[scryfallId]` does the same. `src/lib/favorites/favorites.ts` is imported only by its test, and `src/components/card/FavoriteButton.tsx` is rendered nowhere outside its own test. [`api-route-inventory.md`](../../engineering/api-route-inventory.md) lists both routes as stubs. This is I-44's open question 6.
- **No want, gift, reservation, precon or sealed-product concept** appears in `src/` or the schema.
- **The plan is printing-level and private.** `src/app/api/collection/acquisition-plan/route.ts` requires a session, reads all the caller's decks or one `deckId`, and sums owned `CollectionCard` quantities per Scryfall ID. `buildAcquisitionPlan` (`src/lib/collection/acquisition-plan.ts`) counts commander, partner and main-zone printings and skips basic lands. The route does not read `AcquisitionIntent` (`proxy_now`, `buy_later`).
- **Collection rows** hold `scryfallId`, `foil`, `condition` (NM to DMG), `quantity` and `price`, unique per printing, finish and user. They have no language and no Oracle identity.
- **Share links exist for decks.** `POST /api/decks/[id]/share` draws 9 random bytes as base64url. `src/app/[locale]/share/[token]/page.tsx` sets `index: false`. `src/app/robots.ts` disallows `/share/`, but English is served without a prefix and French under `/fr/` (`localePrefix: "as-needed"` in `src/i18n/routing.ts`), so `/fr/share/` relies on its `noindex` tag alone.
- **Public profiles show real names.** `GET /api/users/[username]` selects `name`, `username` and `image`, and `/u/[username]` titles the page with `name` before `username`. Google is a configured sign-in provider, so a display name stored at sign-in can be public today.
- **No age field.** `User` has no age declaration or birth date. No pod or friend model exists; `UserFollow` is a directed edge. `Permissions-Policy` disables geolocation (`src/lib/security-headers.ts`).
- **No QR code library** and no notification delivery exist.

## Functional requirements

### 1. One wanted list

1.1 Each player has exactly one wanted list. It is private until the player grants an audience. It has no item cap ([I-30 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
1.2 A **card item** holds a card, a quantity, a strictness (any printing, this set, or exact printing, as in I-44 2.2), a finish (any, nonfoil, foil, etched), a language (any, or one), a minimum condition (any, NM, LP, MP, HP), a priority (most wanted, would like, nice to have) and the owner's order. A **sealed item** holds a precon or a sealed product, a quantity and a priority.
1.3 Each item has two independent switches: **open to gifts** (default on) and **open to trades** (default off). The gift page reads the first. I-44's matching reads the second.
1.4 **One list, two uses.** I-44's want lists become this list. I-44 keeps have lists, audiences, matching, proposals and the balance view; its want side reads the items open to trades. The integrator amends I-44 requirements 2.1 to 2.3, its data model, slice 1 (have lists only) and slice 2 (its want half becomes slice 2 here). Two want lists would drift: a card received as a gift would stay wanted for trade. TappedOut, Deckbox and Moxfield each keep one wishlist [1][2][3].
1.5 No field another person can read accepts typed text. Items come from card data, the I-17 catalogue or the sealed reference file (2.6). The source deck of an item stays visible to its owner only.
1.6 The list pastes in and exports in the existing deck text format.
1.7 **"Any printing" honours the owner's exclusions.** Once [I-57](i57-printing-preferences-everywhere.md) slice 4 stores a printing rule, an any-printing item excludes what the rule excludes (Universes Beyond, Secret Lair, The List, promos), and the gift page says so in words: "any version except Universes Beyond crossovers". Its image is the printing the rule would pick. This closes the likeliest wrong-printing gift: a crossover version of a card bought for a player who avoids them.

### 2. Filling the list

2.1 **From the acquisition plan**, for all decks or chosen decks, net of owned copies as I-06 computes them. A preview lists each line with its quantity, contributing decks, owned copies and the deck's intent (`proxy_now`, `buy_later`) where one exists. Every line can be unticked; nothing is added until the player confirms.
2.2 A plan line keeps the deck's printing and starts as "exact printing"; the player may loosen it. Refresh happens only on request, with a preview of changes, and never overwrites an item the player edited.
2.3 Copies borrowed under I-51 do not count as owned ([I-51 3.4](i51-cards-lent-and-borrowed.md#3-borrowed-copies)); the preview marks such lines "borrowed until …".
2.4 **By hand**, from card search and card views, with the printing selector that lists owned editions first (#978).
2.5 **Precons** from the I-17 catalogue: name, set, release date and commander.
2.6 **Other sealed products** from a dated reference file built from MTGJSON's sealed-product data (MIT licence): name, category, set and release date [20]. The file is refreshed by a reviewed pull request. Its purchase links are not used.

### 3. Sharing for gifts

3.1 The owner grants one gift audience at a time. Revoking takes effect on the next read.

| Audience | Who sees the gift page                             | Needs                                            |
| -------- | -------------------------------------------------- | ------------------------------------------------ |
| Private  | The owner only (default)                           | —                                                |
| Link     | Anyone holding the URL                             | —                                                |
| Friends  | Signed-in mutual follows, from the owner's profile | I-44's mutual-follow helper                      |
| Profile  | Anyone, from `/u/[username]`                       | The owner's "18 or older" declaration (I-44 7.2) |

3.2 The page lists items open to gifts, by the owner's priority, then the owner's order. A viewer may filter by type and by a price band in their market. The page is never ordered by price, popularity or commission.
3.3 Each card item reads in plain words, in English and French: the exact printing's image with set name, collector number and finish, or "any version of this card"; "English only" or "any language"; the minimum condition in words; the copies still open.
3.4 **No identity by default.** The page shows no name, avatar, email, deck, collection, city, age or occasion. Its heading reads "A Commander player's wishlist". The owner may show the username only if the owner has the adult declaration.
3.5 **Link.** An unguessable token, as for decks; the owner can rotate or disable it, and reservations survive a rotation. The page is `noindex`, and `src/app/robots.ts` disallows its path under both `/` and `/fr/`. A QR code encodes the same URL.
3.6 **Prices** follow I-32 [group 2](i32-seller-handoff-and-affiliate-carts.md#2-market-and-prices): estimate label, source, date, stale label and the viewer's market, never converted. USD only until I-32 slice 3. Sealed items show no price, because the price source in use prices cards only. The owner may hide prices from the gift page.

### 4. Reservations and the surprise

4.1 A viewer of the gift page may reserve open copies of an item: "I'm buying this". If two viewers take the last copy at once, one succeeds and the other sees "Someone just took this", as on Wishpicks [13].
4.2 On the Link audience, reserving needs no account unless the owner requires sign-in, a choice Wishpicks offers [13]. Friends and Profile audiences need sign-in.
4.3 A signed-out reserver receives a private manage link once, also kept in the browser. The server stores only its hash. A reservation stores no name, email or IP address.
4.4 The reserver can mark it **bought**, **release** it or **renew** it. Other viewers see "Reserved", with no name; the reserver sees "Reserved by you".
4.5 Expiry is computed on read, with no scheduled job. An active reservation lapses 30 days after it was made, or 7 days after the owner's gift date if one is set (proposed). A bought reservation does not lapse; it ends when the owner marks the item received or removes it. Elfster and Wishpicks let a giver undo; Wishpicks keeps a reservation until someone cancels it [12][13].
4.6 **The owner never sees reservation state** while signed in: not on the wishlist, the gift page, the plan, a cart, the export or any API. The owner's responses are identical whether or not anything is reserved. On the gift page, reservation marks appear only after a viewer confirms "I'm shopping for this person".
4.7 The share screen tells the owner that the surprise is a courtesy, not a lock: opening the link signed out may spoil it. Amazon warns its owners of the same [10].
4.8 When the owner removes an item or marks it received, its reservations become **void** or **fulfilled**. The reserver's manage link then says "No longer on the list" or "They have this now". The owner is told nothing.
4.9 **Blind reset.** For a leaked link, the owner can clear every reservation without seeing any. Givers then see "Reservations were reset on …".
4.10 No notification tells the owner about reservations. No notification to givers is on by default ([I-38 9.1](i38-trust-safety-and-user-rights.md#9-minors)).
4.11 A signed-out browser holds at most 10 active reservations per list, and reservation requests are rate limited (proposed).

### 5. Received gifts and the owner's own buying

5.1 **Received.** The owner marks an item received and may add the copies to the collection with printing, finish and condition. Language is not stored until collection rows carry one. The item's quantity drops, or the item leaves.
5.2 A received card gets I-45's keep mark ([I-45 1.3](i45-selling-spare-cards.md#1-spare-copies)) by default, so I-45 never proposes it for sale. The owner can remove the mark. One player wrote: "My most cherished cards are ones bought for me by friends" [17].
5.3 Adding a matching card to the collection anywhere else offers "Remove from wishlist" in the same dialog. The owner's wishlist flags items the collection already covers: "You may already have this". It counts the exact printing first, and other printings once I-32 slice 5 adds Oracle identity.
5.4 **Gift window.** The owner may set a gift date. Givers never see it. Until that date, the plan, the shopping list and I-32's handoff show one notice for **all** items open to gifts: "On your shared wishlist until …: friends may be buying these", with a switch to leave them out of the cart. The notice and the switch are the same whether or not anything is reserved.
5.5 The plan marks each line that is on the wishlist and whether it is open to gifts, never its reservations.

### 6. Buying: store view and seller handoff

6.1 **Take this to a store.** A giver can open a printable, phone-sized list of their own reservations: name, set name and code, collector number, finish, language, minimum condition and image. It carries no affiliate link. The top reply to a wife's gift question pointed her to the local game store [14].
6.2 **Seller handoff.** A giver can send their reservations, or one item, to a seller through I-32's adapters, with I-32's "kept / pick again / unmapped" summary ([I-32 3.5](i32-seller-handoff-and-affiliate-carts.md#3-the-cart-handoff)). Cardmarket's paste format keeps no condition or language, so those are picked again on Cardmarket.
6.3 I-32's [disclosure rules](i32-seller-handoff-and-affiliate-carts.md#1-disclosure-and-ordering) apply unchanged: a visible label, the disclosure page, no ordering by commission, an opt-out, and placement labels only (`surface:wishlist`), never a list, owner or giver ID. A signed-out giver's opt-out is a page switch kept in the browser.
6.4 A list whose owner has no adult declaration carries no MagicAIBuilder affiliate code (proposed; lawyer question 1).
6.5 Precons and sealed products hand off as "copy the product name, open the seller", because I-32's adapters map cards only.
6.6 Handoffs are counted under [I-32 7.1](i32-seller-handoff-and-affiliate-carts.md#7-measurement-for-the-i-33-gates) with surface `wishlist`.

### 7. Privacy, minors and safety

7.1 The list, its filling, the Link and Friends audiences and reservations are open to every account. The Profile audience and the username need the adult declaration. I-38's defaults for minors apply ([9.1](i38-trust-safety-and-user-rights.md#9-minors)).
7.2 No field stores a birth date, an age, an occasion type, an address or a location. The product never asks for a shipping address; Amazon offers one [10], and here the giver hands over or ships the gift themselves.
7.3 Search engines never index a gift page, and `/api/v1` never returns wishlists or reservations.
7.4 The gift page has a report action (I-38's generic report, target `wishlist`). A blocked account cannot open the owner's page through Friends or Profile, and cannot reserve. A link is not tied to an account, so rotation is the remedy.
7.5 The owner's items and settings are in the [I-38 export](i38-trust-safety-and-user-rights.md#7-full-data-export). A giver's export lists their reservations by card and date, without the owner's identity. Deleting the owner deletes items and reservations. Deleting a giver removes the link to their account; the reservation runs to its expiry.
7.6 No view counts, "people looked at your list", streaks, badges, top givers or totals. "Bought" stores no price.

### 8. Free and paid

8.1 **Free on every plan:** the list, every way of filling it, all audiences, reservations, prices, the store view and the handoff. The TappedOut and Deckbox pages read name no charge for the wishlist, and Giftster calls itself "free" [1][2][11]. Scryfall forbids paywalling prices [19], and I-30 never charges for the player's own data.
8.2 **One candidate for I-30:** wanted items in I-32's [price watch](i32-seller-handoff-and-affiliate-carts.md#6-splitting-and-the-price-watch), a daily or weekly digest when a wanted printing drops. It moved to [I-59](i59-prices-over-time-and-alerts.md) slice 11 with the price watch (formerly I-32 slice 12); I-30 and I-32's question Q3 decide it. Demand evidence is weak: one r/EDH thread asked for "Wishlist price alerts?" (2023-02-21, 2 points) [21].
8.3 **Why free competitors lack gift reservations** (inference): their wishlist is a deck-like list with one state; Moxfield's issue tracker calls it "a modified deck list" [3]. A reservation hidden from the owner needs a second person and a second state. That gap is a reason to choose the product, not to charge for it.
8.4 **Affiliate income is small.** A relative buying for a player may be a new buyer, and Mana Pool pays "5% of the first sale when you refer someone" [22]. Computed example, not a forecast: a 40 USD gift order earns 2 USD. No volume estimate exists, so I-30 plans no revenue on this initiative.

## Data model / API

```
WantedItem        id, userId, kind (card | precon | sealed), cardName?, scryfallId?, strictness (anyPrinting | set | exact), setCode?,
                  finish (any | nonfoil | foil | etched), language?, minCondition (any | NM | LP | MP | HP), quantity,
                  priority (high | normal | low), position, preconId?, sealedUuid?, source (manual | plan | precon | sealed),
                  sourceDeckId? (owner only), forGifts, forTrade, createdAt, updatedAt
WishlistSettings  userId @id, giftAudience (private | link | friends | profile), shareToken? @unique, showUsername, showPrices,
                  reserveNeedsSignIn, giftDate?, updatedAt
GiftReservation   id, wantedItemId (Cascade), quantity, reserverUserId? (SetNull), manageKeyHash?, state (active | bought | released |
                  void | fulfilled), createdAt, renewedAt?, closedAt?          -- "expired" is computed on read (4.5)
```

`WantedItem` replaces I-44's want-side `TradeListEntry` rows (1.4); an Oracle identity column follows [I-37](i37-editor-depth.md) slice 12. A schema test fails when one of these models gains a free-text column that another person can read. A response-shape test fails when an owner response contains a reservation field.

Routes: `GET|POST /api/wishlist/items`; `PATCH|DELETE /api/wishlist/items/[id]`; `POST /api/wishlist/fill` (`preview` or `apply`); `PUT /api/wishlist/settings` (audience, rotate, disable, reset reservations); `GET /api/wishlist-share/[token]` (public, allowlisted fields); `POST /api/wishlist-share/[token]/reservations`; `PATCH /api/wishlist-reservations/[id]` (bought, release, renew; session or manage key); `POST /api/wishlist/items/[id]/received`. Pages: `/wishlist` (owner) and `/wishlist/[token]` with its `/fr/` twin.

## Non-goals

- Payment, money pooling, group gifts, gift cards, a shipping address, delivery tracking or any sale through the product (I-33).
- Messages or notes between owner and givers, including a "message with your reservation" as Wishpicks suggests [13].
- Telling the owner who reserved what, or how many items are reserved.
- A birthday, an age or an occasion shown on any page.
- Gift suggestions written by the language model, or "people like you wished for" recommendations.
- Lists of what is most wished across players. Aggregate data belongs to [I-34](i34-commander-data-reports.md), with its own method.
- Several named wishlists. One wanted list with filters and two switches covers trades and gifts (1.3).
- Accessories, sleeves and other non-Magic products, which givers often buy [14] but which no card data describes.
- Store stock or availability. I-32 hands off; it does not list stock.

## Testing strategy

- **Surprise (property and sociable):** for random lists and reservation sets, every owner response (wishlist, gift page with the owner's session, plan, shopping list, handoff, export) is byte-identical with and without reservations. The gift-window notice (5.4) is identical too.
- **Reservations (solitary):** state transitions; quantity never above open copies; concurrent last copy (two transactions, one wins); expiry at day 30 and at gift date plus 7 at their boundaries; a bought reservation never lapses; void and fulfilled on removal and receipt; blind reset.
- **Anonymous keys (sociable):** the plain manage key never reaches the database or logs; a wrong key returns 404; the per-browser limit holds at 10.
- **Fill (sociable, PostgreSQL):** filling from the plan equals the plan's quantities to acquire; unticked lines are absent; a refresh never overwrites a hand-edited item; borrowed lines carry the flag.
- **Public payload (sociable):** an allowlist test on the gift page payload (no name, image, email, deck, collection or settings); `noindex` present; robots rules for `/wishlist/` and `/fr/wishlist/`; a rotated token returns 404; the username appears only with the switch and the adult declaration.
- **Audiences (sociable):** Friends needs a mutual follow; a blocked account gets 403; Profile needs the declaration; `/api/v1` returns no wishlist data.
- **Affiliate (sociable):** with I-32 slice 6 live, gift-page links carry the label and `surface:wishlist` only; a list without the adult declaration carries no code; the opt-out switch removes codes.
- **Plain language (snapshot):** each strictness, finish, language and condition renders a fixed sentence in English and French.
- **I-44 contract:** I-44's matching reads only items open to trades; turning the switch off removes an item from matches on the next read.

## Delivery slices

| #   | Slice                                                                                                                                                         | Depends on                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0   | Retire the favorites stubs: both routes, `src/lib/favorites`, `FavoriteButton`, and the three models, with a migration that refuses to drop a non-empty table | —                                                          |
| 1   | One wanted list: `WantedItem`, owner page, add by hand with the printing selector, all item fields, the two switches, paste and export                        | —                                                          |
| 2   | Fill from the acquisition plan: preview with owned copies, intents and borrowed flags; refresh on request                                                     | 1                                                          |
| 3   | Gift link: settings, token, allowlisted page, plain-language items, `noindex` and robots rules for both locales, rotate and disable, dated USD prices         | 1                                                          |
| 4   | Reservations: anonymous and signed in, manage key, quantities, states, expiry on read, spoiler gate, owner-blind responses, blind reset, limits               | 3                                                          |
| 5   | Received gifts and collection matches: receive into the collection, "you may already have this", the prompt in the collection add dialog                      | 4                                                          |
| 6   | Gift-window notice in the plan and shopping list; in I-32's handoff once it exists                                                                            | 3                                                          |
| 7   | "Take this to a store" view and QR code                                                                                                                       | 4                                                          |
| 8   | Seller handoff of a giver's reservations; affiliate codes only after I-32 slice 6, never on lists without the adult declaration                               | 4; I-32 slice 1                                            |
| 9   | I-44's want side reads items open to trades                                                                                                                   | 1; I-44 slice 1 (have lists only, after the 1.4 amendment) |
| 10  | Friends audience                                                                                                                                              | 4; I-44 slice 6 (one mutual-follow helper, built once)     |
| 11  | Precons on the wishlist                                                                                                                                       | 1; I-17 slice 1                                            |
| 12  | Sealed reference file and sealed items                                                                                                                        | 1                                                          |
| 13  | Profile audience and username display                                                                                                                         | 4; the adult declaration (I-44 slice 12)                   |
| 14  | Report target, blocking on gift audiences, export entries                                                                                                     | 4; I-38 slices 4, 8 and 12                                 |
| 15  | Keep mark on received gifts                                                                                                                                   | 5; I-45 slice 1                                            |
| 16  | Market prices on the gift page                                                                                                                                | 3; I-32 slice 3                                            |
| 17  | Any-printing items follow the owner's printing-rule exclusions, in words and image (1.7)                                                                      | 3; I-57 slice 4                                            |
| 18  | Wanted items in the price watch                                                                                                                               | Moved to I-59 slice 11                                     |

Slices 0 to 4 need no I-38 work and no lawyer answer: they show card data to the owner and to link holders, store no personal data about givers and no typed text, and depend on nothing outside this spec. Slice 0 also closes I-44's open question 6. The I-44 amendment in 1.4 must be merged before either I-44 slice 1 or slice 9 here starts, or the two initiatives will build two want tables.

## Open questions

1. **Lawyer questions** (research, not legal advice), to add to [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate):
   - Is an affiliate-coded seller link on a gift page whose owner may be a minor, opened by adult relatives, advertising aimed at minors? Is requirement 6.4's blanket rule needed, or too strict?
   - Does I-32's per-link label (its Q1) suffice on a page read by people who have no account and never accepted our terms?
   - Is a link-only gift page that shows card names and no identity personal data of the owner under GDPR, and does showing the username change that?
2. **One list, or several?** This spec gives each player one wanted list and asks I-44 to drop its separate want lists (1.4). Cardmarket allows 100 wants lists per game [6]. The owner confirms the amendment before slice 9.
3. **Anonymous reservations.** Relatives rarely have accounts, so the Link audience lets them reserve without one (4.2), as Wishpicks does by default [13]. A stranger holding a leaked link could then reserve everything. The blind reset, the per-browser limit and the owner's sign-in switch are the proposed answer. Is that enough, or should sign-in be the default?
4. **Expiry periods.** 30 days, or 7 days after the gift date, are proposals. Wishpicks sets no expiry at all [13]; baby and wedding registries were reported to hold for days, but only through search summaries, so they are not cited here.
5. **Is a sealed reference file worth keeping up?** Gift Bundles dominate r/mtgfinance's "gift" threads [23], which suggests sealed gifts are common. The file needs a person to refresh it with each release. Precons through I-17 may be enough.
6. **Should the owner be able to hide prices from givers by default?** Some owners may not want relatives to see what a card costs; others want givers to pick within a budget.

## Sources

Read on 2026-11-10 unless dated otherwise. Reddit refuses automated reads, so threads were read through the [Arctic Shift archive API](https://arctic-shift.photon-reddit.com/); scores are as archived. App Store data comes from Apple's iTunes lookup API. "Search summary" means the page refused automated fetching and the fact comes from a search engine's summary of it.

1. TappedOut, help desk, "Ownership" (© 2026). <https://tappedout.net/help-desk/ownership>
2. Deckbox, "Getting started" <https://deckbox.org/help/start>; home page <https://deckbox.org>
3. Moxfield public issue tracker: #58, "(tiny) Feature proposal: add cards to Wish list only if they are NOT in your collection", 2024-04-22 <https://github.com/moxfield/moxfield-public/issues/58>; #90, "Add to Wish List Fails to Add Cards in User's Collection", 2025-05-08 <https://github.com/moxfield/moxfield-public/issues/90>; #112, "Wish List's Deck Image is Hidden", 2025-05-21 <https://github.com/moxfield/moxfield-public/issues/112>
4. MTG Scanner - Dragon Shield, App Store listing, version 8.2.1 of 2026-11-05, rated 9+. <https://apps.apple.com/us/app/id1460657155>
5. Grimoria, help, "Want lists", footer version v2.3.49 (2026110901). <https://grimoria.app/help/trading/want-lists>
6. Cardmarket help, "Add Cards to Wants List" <https://help.cardmarket.com/en/add-cards-to-wants>; "Wants List" <https://help.cardmarket.com/en/wants-list> (both © 2026, undated)
7. TCGplayer, App Store listing, version 5.5.0 of 2026-11-04 <https://apps.apple.com/us/app/id1247645833>; help, "Saving and Sharing Lists" (HTTP 403; search summary) <https://help.tcgplayer.com/hc/en-us/articles/115009506287-Saving-and-Sharing-Lists>
8. ManaBox MTG, App Store listing, version 4.3.0 of 2026-11-03, rated 12+. <https://apps.apple.com/us/app/id1460407674>
9. Archidekt, FAQ. <https://archidekt.com/faq>
10. Amazon, "How to create and share Amazon Wish Lists", published 2023-07-10, updated 2025-07-12 <https://www.aboutamazon.com/news/retail/amazon-wish-list>; help page on surprise settings (HTTP 503; search summary) <https://www.amazon.com/gp/help/customer/display.html?nodeId=G9PJNRV76JRAXDJZ>
11. Giftster: The Family Wish List, App Store listing, version 6.2.7 of 2026-11-06, rated 17+, 20,153 ratings <https://apps.apple.com/us/app/id478126039>; help, "Will the list owner see if I mark an item reserved or purchased?" (HTTP 403) <https://help.giftster.com/article/72-will-list-maker-see-reserved-purchased>
12. Elfster help, "How do I mark that I bought an item on another Elfster wishlist" <https://help.elfster.com/en/articles/11517983-how-do-i-mark-that-i-bought-an-item-on-another-elfster-wishlist>; "How do I manage an Elfster Family Manager account's wishlists" <https://help.elfster.com/en/articles/11518334-how-do-i-manage-an-elfster-family-manager-account-s-wishlists>
13. Wishpicks docs, "Can I hide reserved gifts from myself?" <https://docs.wishpicks.com/en/articles/16189884-can-i-hide-reserved-gifts-from-myself>; "How does gift reservation work?" <https://docs.wishpicks.com/en/articles/16189859-how-does-gift-reservation-work>
14. "MAGIC THE GATHERING CHRISTMAS GIFT HELP!", r/EDH, 2025-12-18, 27 points, 56 comments; replies at 49 and 15 points. <https://www.reddit.com/r/EDH/comments/1ppz3mm/>
15. "Magic the gathering gift", r/magicTCG, 2026-09-03, 96 points, 48 comments; reply "Ask him what format he plays", 49 points. <https://www.reddit.com/r/magicTCG/comments/1w5vd9u/>
16. "Gift for MTG player", r/magicTCG, 2026-08-19, 24 points, 28 comments. <https://www.reddit.com/r/magicTCG/comments/1vsvbnw/>
17. "Getting a gift for my friend, would someone who's played for a while enjoy getting this?", r/magicTCG, 2025-12-29, 132 points, 52 comments; the quoted reply has 7 points. <https://www.reddit.com/r/magicTCG/comments/1py8c2l/>
18. "Help me choose a birthday gift (for myself)", r/EDH, 2026-11-01, 3 points. <https://www.reddit.com/r/EDH/comments/1xl298v/>
19. Scryfall, API documentation: use guidelines and the price notice. <https://scryfall.com/docs/api>
20. MTGJSON, "Sealed Product" data model <https://mtgjson.com/data-models/sealed-product/>; licence (MIT) <https://mtgjson.com/license/>
21. "Wishlist price alerts?", r/EDH, 2023-02-21, 2 points, 12 comments. <https://www.reddit.com/r/EDH/comments/1181l57/>
22. Mana Pool, "Affiliates" (undated). <https://manapool.com/affiliates>
23. For example "FYI - Looks like the Gift Bundles are going to have one less booster in them", r/mtgfinance, 2026-10-10, 132 points. <https://www.reddit.com/r/mtgfinance/comments/1x21xoj/>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

### Goals

- A player fills the wanted list from the acquisition plan and shares it by link; two relatives open it, one reserves a card and the other sees it taken; the owner's pages look the same whether or not anything is reserved; and the gift page shows no name, age or location and is never indexed.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-56-01

As a player with a birthday coming, I want one list of cards I want, so that a friend can reserve a gift without me seeing which one.

#### US-56-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-56-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-56-01 Happy path

Given a signed-in player and the English locale
When the wanted list can be filled from the acquisition plan.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-56-02 Happy path

Given a signed-in player and the English locale
When a reservation is hidden from the owner.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-56-03 Happy path

Given a signed-in player and the English locale
When the favorites routes that answer success and store nothing are gone.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-56-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-56-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-56-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: The owner is signed-in. The friend may reserve without an account if that option is on, with the limits the spec names. Default is the spec's recommendation until the owner confirms it.

#### AC-56-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-56-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-56-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The owner sees the list and the count reserved, not the names of who reserved what. The friend opens a link.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

One want table, private. The gift link is a token. Prices on it are labelled estimates. No address is stored.

### Analytics and telemetry

`wishlist_reserved {signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

The owner is signed-in. The friend may reserve without an account if that option is on, with the limits the spec names. Default is the spec's recommendation until the owner confirms it.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether one wanted list replaces I-44's want lists is the amendment the owner must confirm before either slice that writes the table.

### Sources

- https://www.reddit.com/r/magicTCG/comments/1w5vd9u/
- https://help.elfster.com/en/articles/11517983-how-do-i-mark-that-i-bought-an-item-on-another-elfster-wishlist
- https://docs.wishpicks.com/en/articles/16189859-how-does-gift-reservation-work

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-56-101

As a player, I want the product to retire the favorites stubs: both routes, src/lib/favorites, FavoriteButton and the three models, with a migration that refuses to drop a non-empty table (slice 0)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Retire the favorites stubs: both routes, src/lib/favorites, FavoriteButton and the three models, with a migration that refuses to drop a non-empty table (slice 0). Today POST /api/favorites (src/app/api/favorites/route.ts) checks no session and answers 201 for data it discards, DELETE /api/favorites/[scryfallId] answers 200 the same way, and GET returns []. This answers I-44's open question 6.

#### AC-56-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-102 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-56-102

As a player, I want the product to one wanted list: WantedItem, an owner page, items added by hand with the printing selector, every item field, the "open to gifts" and "open to trades" switches, paste and export (slice 1)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-103 Happy path

Given a signed-in operator
When the player uses this behaviour
Then the behaviour holds: One wanted list: WantedItem, an owner page, items added by hand with the printing selector, every item field, the "open to gifts" and "open to trades" switches, paste and export (slice 1).

#### AC-56-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-105 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-56-103

As a player, I want the product to fill from the acquisition plan, with a preview of owned copies, intents and borrowed flags, and a refresh on request that never overwrites an item the player edited (slice 2)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Fill from the acquisition plan, with a preview of owned copies, intents and borrowed flags, and a refresh on request that never overwrites an item the player edited (slice 2).

#### AC-56-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-56-104

As a player, I want the product to a gift link: an unguessable token, an allowlisted page with plain-language items and dated USD prices, noindex, robots rules under both / and /fr/, and rotate and disable (slice 3)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A gift link: an unguessable token, an allowlisted page with plain-language items and dated USD prices, noindex, robots rules under both / and /fr/, and rotate and disable (slice 3). Today src/app/robots.ts disallows /share/ but not /fr/share/; that item is under I-08.

#### AC-56-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-111 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-56-105

As a player, I want the product to reservations, anonymous or signed in: a manage key stored only as a hash, quantities, states, expiry computed on read, a spoiler gate, owner responses identical whether or not anything is reserved, a blind reset and per-browser limits (slice 4)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Reservations, anonymous or signed in: a manage key stored only as a hash, quantities, states, expiry computed on read, a spoiler gate, owner responses identical whether or not anything is reserved, a blind reset and per-browser limits (slice 4).

#### AC-56-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-56-106

As a player, I want the product to later: received gifts into the collection, the gift-window notice in the plan, a store view with a QR code, and the seller handoff of a giver's reservations, with affiliate codes only after I-32 slice 6 and never on a list without the adult declaration (slices 5–8)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: received gifts into the collection, the gift-window notice in the plan, a store view with a QR code, and the seller handoff of a giver's reservations, with affiliate codes only after I-32 slice 6 and never on a list without the adult declaration (slices 5–8).

#### AC-56-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-56-107

As a player, I want the product to later: I-44's want side reading the items open to trades, once the owner confirms the amendment (slice 9); the friends and profile audiences, precons and sealed products, reports, blocking and export, the keep mark, market prices, and any-printing items that follow I-57's exclusions (slices 10–17)., so that a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

#### AC-56-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: I-44's want side reading the items open to trades, once the owner confirms the amendment (slice 9); the friends and profile audiences, precons and sealed products, reports, blocking and export, the keep mark, market prices, and any-printing items that follow I-57's exclusions (slices 10–17).

#### AC-56-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-56-120 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

### UX states for this feature

The player-visible outcome is: a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

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

## I-56: Wishlists Friends Can Buy From

**Spec:** [`specs/i56-wishlists-friends-can-buy-from.md`](i56-wishlists-friends-can-buy-from.md)

**Outcome:** a player keeps one wanted list, filled from the acquisition plan net of owned copies and by hand, with a priority, a printing or "any printing", a finish, a language and a minimum condition per item. They share it for gifts: a friend or relative marks "I'm buying this", so nobody buys the same card twice, and the owner never sees what was reserved. The same list feeds trade matching.

**Status:** Next
**Priority:** Next for slices 0 to 4: one wanted list, filled from the acquisition plan, shared by link, with reservations hidden from the owner; Later for the rest
**Impact / effort:** Medium / medium
**Depends on:** nothing outside this initiative for slices 0–4; the owner's confirmation of the I-44 amendment before slice 9; I-44 slices 1, 6 and 12 for trades, friends and the adult declaration; I-17 slice 1 for precons; I-38 slices 4, 8 and 12 for export, reports and blocking; I-45 slice 1 for the keep mark; I-32 slices 1, 3 and 6 for the handoff, market prices and affiliate codes; I-57 slice 4 for printing exclusions. The price watch moved to I-59.

Players keep a list of cards they want, and around a birthday or the holidays a partner, a parent or a friend asks what to buy. The person asking often does not play: a mother of a 16-year-old is told "Ask him what format he plays" ([r/magicTCG, 2026-09-03](https://www.reddit.com/r/magicTCG/comments/1w5vd9u/)). Every MTG collection tool read keeps a wishlist, and none lets a friend mark an item as being bought. Gift registries agree on the surprise rule: on Elfster, "the Wishlist owner won't be notified or see that the wish has been marked as purchased" ([help](https://help.elfster.com/en/articles/11517983-how-do-i-mark-that-i-bought-an-item-on-another-elfster-wishlist)), and Wishpicks lets anyone with the link reserve without an account by default ([docs](https://docs.wishpicks.com/en/articles/16189859-how-does-gift-reservation-work)). No tool read nets several decks against owned printings, which I-06's plan already does. Wrong printings and duplicate gifts are an inference from the registries' design, not an observed complaint. Four boundaries hold: no money and no addresses, no typed text between people, no identity on the gift page by default, and no engagement loops.

### Scope

- [ ] Retire the favorites stubs: both routes, `src/lib/favorites`, `FavoriteButton` and the three models, with a migration that refuses to drop a non-empty table (slice 0). Today `POST /api/favorites` (`src/app/api/favorites/route.ts`) checks no session and answers 201 for data it discards, `DELETE /api/favorites/[scryfallId]` answers 200 the same way, and `GET` returns `[]`. This answers I-44's open question 6.
- [ ] One wanted list: `WantedItem`, an owner page, items added by hand with the printing selector, every item field, the "open to gifts" and "open to trades" switches, paste and export (slice 1).
- [ ] Fill from the acquisition plan, with a preview of owned copies, intents and borrowed flags, and a refresh on request that never overwrites an item the player edited (slice 2).
- [ ] A gift link: an unguessable token, an allowlisted page with plain-language items and dated USD prices, `noindex`, robots rules under both `/` and `/fr/`, and rotate and disable (slice 3). Today `src/app/robots.ts` disallows `/share/` but not `/fr/share/`; that item is under I-08.
- [ ] Reservations, anonymous or signed in: a manage key stored only as a hash, quantities, states, expiry computed on read, a spoiler gate, owner responses identical whether or not anything is reserved, a blind reset and per-browser limits (slice 4).
- [ ] Later: received gifts into the collection, the gift-window notice in the plan, a store view with a QR code, and the seller handoff of a giver's reservations, with affiliate codes only after I-32 slice 6 and never on a list without the adult declaration (slices 5–8).
- [ ] Later: I-44's want side reading the items open to trades, once the owner confirms the amendment (slice 9); the friends and profile audiences, precons and sealed products, reports, blocking and export, the keep mark, market prices, and any-printing items that follow I-57's exclusions (slices 10–17).
- Moved 2026-11-10: wanted items in the price watch (slice 18) are now [I-59](i59-prices-over-time-and-alerts.md)'s alert rules, which take the wanted list as a scope.
- [ ] Added 2026-11-12 (thirteenth pass): [I-101](i101-collecting-goals-beyond-a-set.md) slice 4 writes `WantedItem` rows with `source: goal` and the goal id through slice 2's preview, skipping what is already wanted; the blind gift reservations apply unchanged.

### Engineering enablers

- For random lists and reservation sets, every owner response, the gift-window notice included, is byte-identical with and without reservations.
- The plain manage key never reaches the database or the logs, and two transactions on the last copy let exactly one through.
- The gift page payload carries no name, image, email, deck, collection or settings, and `/api/v1` returns no wishlist data.
- A schema test fails when one of these models gains a free-text column another person can read.

**Paid-tier angle:** the list, every way of filling it, every audience, reservations, prices, the store view and the handoff stay free: TappedOut and Deckbox charge nothing for a wishlist, Scryfall forbids paywalling prices, and I-30 never charges for the player's own data. The one candidate, wanted items in a price watch, has weak demand evidence and moved to I-59 with the watch. Affiliate income on gift orders is small and not estimated, so I-30 plans no revenue here.

### Enrichment (2026-11-11)

**User story.** As a player with a birthday coming, I want one list of cards I want, so that a friend can reserve a gift without me seeing which one.

**Acceptance.**
- The wanted list can be filled from the acquisition plan.
- A reservation is hidden from the owner.
- The favorites routes that answer success and store nothing are gone.

**UX.** The owner sees the list and the count reserved, not the names of who reserved what. The friend opens a link.

**Data and API.** One want table, private. The gift link is a token. Prices on it are labelled estimates. No address is stored.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `wishlist_reserved {signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** The owner is signed-in. The friend may reserve without an account if that option is on, with the limits the spec names. Default is the spec's recommendation until the owner confirms it.

**Open questions.** Whether one wanted list replaces I-44's want lists is the amendment the owner must confirm before either slice that writes the table.

### Definition of done

A player fills the wanted list from the acquisition plan and shares it by link; two relatives open it, one reserves a card and the other sees it taken; the owner's pages look the same whether or not anything is reserved; and the gift page shows no name, age or location and is never indexed.

---

