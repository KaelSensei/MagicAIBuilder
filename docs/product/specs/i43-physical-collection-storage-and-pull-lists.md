# I-43: Physical Collection: Storage Places, Deck Boxes And Pull Lists

> **Status:** Proposed · **Priority:** Later. The deck-box path (slices 1 to 5) needs no collection import and can be promoted on its own; binders and boxes at scale wait for [I-26](i26-collections-arriving-from-elsewhere.md) slice 3 · **Written 2026-11-09**
> **Research:** a dated note on competitors' storage features and player posts. It is not committed, so every external fact links its own source in [Sources](#sources).
> **Owns:** storage places and their nesting, how many copies of a collection row sit in each place, deck-box pairing, pull and put-back lists, the misplaced-card and contention warnings, the cross-deck card view, and deck-box labels. **Does not own:** ownership quantities, printing identity, proxies and the acquisition plan ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)); which deck a copy is committed to, and the free-cards ranking ([I-16](i16-decks-buildable-from-a-collection.md)); the service worker and offline cache ([I-19](i19-offline-game-night-viewing.md)); collection import and its column mapping ([I-26](i26-collections-arriving-from-elsewhere.md)); scanning and the phone-journey harness ([I-40](i40-installable-app-and-card-scanning.md)); plans and entitlements ([I-30](i30-business-model-and-paid-tier.md)); the full data export, account deletion and retention ([I-38](i38-trust-safety-and-user-rights.md)); have lists and share links ([I-44](i44-trade-lists-within-the-pod.md)); buying ([I-32](i32-seller-handoff-and-affiliate-carts.md)).

## Overview

I-16 answers which deck a copy belongs to. This spec answers where the physical copy is: in a binder, a storage box, or the deck box of a built deck. Today a player with twenty decks and a few binders finds a card from memory. Building a new deck means opening every box, and dismantling one means guessing where each card came from.

The spec adds storage places that nest and a deck paired to its box. It adds a pull list that says which binder or box holds each card a deck needs, a put-back list for dismantling, and a warning when a card is in the wrong place. A cross-deck view shows the cards used most, the overlap between decks and the copies needed to keep every built deck assembled at once. A printed QR label on a deck box opens that deck.

It is a personal tool with no card data behind it, so the paid tier can sell part of it. Requirement 9 states exactly which parts stay free: everything one deck needs, nesting included.

## What the market does

All rows were read on 2026-11-09.

| Product                                           | What ships                                                                                                                                                                                                                                                                                                                                                                          | Free or paid                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EchoMTG** Locations, 2026-06-17 [1]             | Places can be binders, deck boxes, storage boxes, shelves or drawers, each showing its count and value. A deck can be paired to its box: "Echo knows that deck literally lives in that box". Also: a "Cards stored wrong" warning, "Find in collection", and "I bought these cards", which adds missing cards to the paired location. CSV import and export carry a location column | Locations come with every plan [1]. Nesting, the multi-location filter, bulk tagging and photos start at Collector ($4/month). The move history ("pin history") is Pro ($12/month), and shared locations are LGS ($25/month) [1][3]. Basic holds 500 cards; cards past the cap are hidden [2] |
| **Grimoria** [4][5][6]                            | "Every card lives in exactly one place at a time": a binder, a deck box or Unassigned. A deck idea links to its deck box, a coloured icon shows drift between them, and a mismatch sheet reconciles the two. A locked box keeps its copies "badged unavailable rather than treated as free stock"                                                                                   | Requires an account. No paid tier seen. Pages undated                                                                                                                                                                                                                                         |
| **ManaBox** [7]                                   | Binders hold owned cards. The app shows "the name of the binder where they are stored" and tracks "physical decks alongside your binders"                                                                                                                                                                                                                                           | No nesting or pull list found                                                                                                                                                                                                                                                                 |
| **Dragon Shield** [8]                             | Custom folders with value tracking, and trade lists. Version 8.2.1 (2026-11-05): "faster folders"                                                                                                                                                                                                                                                                                   | In-app purchases from $1.99/month; what each tier includes is not listed                                                                                                                                                                                                                      |
| **Moxfield** (as its users describe it) [10]–[15] | Binders, with each copy in one binder. A deck can be added to the collection into a binder. A shared collection hides binder names, and nothing marks a card as sitting in a deck                                                                                                                                                                                                   | Its own pages were not read                                                                                                                                                                                                                                                                   |
| **Deckbox** [9]                                   | No locations. Users asked for them between 2016-10-15 and 2018-02-11 (24 posts, no staff reply) and fell back on "a virtual deck for each location"                                                                                                                                                                                                                                 | —                                                                                                                                                                                                                                                                                             |
| **Archidekt** [17]                                | A moderator proposed "sub-collections or collection folders". The thread is archived with no answer on whether it shipped. No location feature was found                                                                                                                                                                                                                            | —                                                                                                                                                                                                                                                                                             |

**What players ask for.** Posts on r/Moxfield ask for:

- "a quick way to see what binder all the cards are in" while building a deck, and a way to see that a card "isn't in a binder but in a different deck" (2025-12-28) [10];
- an "In Use" mark, and a way to "Hide cards currently in decks" from a collection shared with friends (2026-01-01) [11];
- an owned copy that counts once, not in every deck (2025-05-25). The poster works around it with one binder per deck [13];
- a view of which other decks use a card (2025-04-05) [14];
- "what cards you play the most across decks", from someone with 50+ decks (2026-11-05) [16].

On r/EDH, one player wants storage "that works with storage and swapping what I take to games" (2026-09-09) [18], and another asks about a case for 32 decks (89 points, 2025-12-03) [19]. Every software request scored under 10 points. The evidence is many independent requests, not one loud one.

**The gap.** EchoMTG and Grimoria link a deck to its box and flag when the two drift apart. None found builds a pull list ordered by where the cards are, a put-back list after dismantling, or a plan across several decks for one night. EchoMTG charges for nesting and history; this spec keeps nesting free.

## Current state in this codebase

Verified on `dev` (`61792c1`) on 2026-11-09:

- **Ownership is one row per printing and finish.** `CollectionCard` in `prisma/schema.prisma` holds `scryfallId`, `foil`, `quantity`, one `condition`, `acquiredAt` and `price`. It is unique on `(scryfallId, foil, userId)`, is deleted with its user, and has no field for a place, container, tag or note.
- **Two routes change quantities.** `POST /api/collection` adds to an existing row or creates one. `PATCH /api/collection/[id]` accepts quantities down to 0 and can swap the printing; swapping onto a printing the player already owns merges the two rows and deletes the old one (`handlePrintingSwap`). Requirements 2.4 and 2.5 keep placements consistent through both.
- **The app reads the collection unpaginated.** `GET /api/collection` returns every row, and `CollectionPageClient.tsx` filters by name in memory. `GET /api/v1/collection` paginates, for API keys with `collection:read`.
- **It shows which deck uses a printing, not where the copy is.** `GET /api/collection/usage?scryfallId=` lists the player's deck rows that use that exact printing, and `PrintingDeckUsage.tsx` displays them.
- **Every deck sees every copy.** `getDeckCardStatuses` (`src/lib/collection/shopping-list.ts`) matches a deck against the whole collection by exact Scryfall ID, so one Sol Ring counts as owned in six decks at once, which is I-16's gap. Its only caller, `CollectionStatsPanel.tsx`, never passes the proxy parameter; its "mark all owned" action adds a deck's missing copies through `bulkAddToCollection`.
- **The acquisition plan reads every deck.** `buildAcquisitionPlan` (`acquisition-plan.ts`) adds up the main zone, commander and partner across all the player's decks, excluding basics. Nothing records which decks are physically built. `AcquisitionIntent` stores `proxy_now` or `buy_later` for each deck and printing.
- **Only decks have containers.** `DeckFolder` groups decks, and `Deck.tags` labels them. A search of `src/` for binder, deck box, pull list and storage terms finds nothing.
- **No Oracle ID is stored** on `DeckCard` or `CollectionCard`, so "same card, other printing" can only be matched by name today.
- **Other gaps.** There is no collection import (`src/lib/import/` handles decks only), no QR library in `package.json`, and no web manifest or service worker. `src/app/robots.ts` disallows `/api/`, `/builder/`, `/collection/` and `/share/`.
- **The word "location" is taken.** `src/lib/collection/quantity-update.ts` already declares `CollectionCardLocation`, which says whether a row sits in the foil or the regular map. This spec says "place" throughout to avoid the clash.

## Functional requirements

### 1. Storage places

1.1 A player creates places with a name and a kind: binder, box, deck box, shelf or drawer, or other. Their number is unlimited ([I-30 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
1.2 A place may sit inside another, up to five levels deep (a deck box in a case on a shelf). A move that would create a cycle is refused. Counts and known-price values roll up to every ancestor, with unpriced copies counted separately, as I-06 does.
1.3 Places that share a parent have distinct names. Every place shows its path, for example "Shelf A › Case 2 › Atraxa box".
1.4 Deleting a place asks where its copies and child places go: to its parent or to Unplaced. It never deletes a collection row.
1.5 A place may declare a sort order: none; name; colour, then name; or set and collector number. Pull and put-back lists follow it, so the player goes through a binder once.
1.6 Unplaced is computed, never stored. It holds each row's copies that are not in any place.

### 2. Placing copies

2.1 A placement records that _n_ copies of one collection row sit in one place. A row's placed copies never exceed its quantity; the rest are Unplaced.
2.2 The player places or moves copies from the collection page or a place page, one row at a time or in bulk. Each confirmation is one atomic batch.
2.3 **Where is it?** Next to "Used in decks", every owned printing shows "Stored in": the path and count for each place, plus Unplaced.
2.4 A quantity decrease never fails because of placements. It takes Unplaced copies first, then copies from the most recently changed placements. The response names every placement it reduced.
2.5 A printing swap that merges two rows also merges their placements, place by place.
2.6 Placing copies never changes `CollectionCard.quantity`, a deck or an `AcquisitionIntent`.

### 3. Deck boxes

3.1 A deck box may be paired with one deck, and a deck with one box. Pairing declares the deck physically built.
3.2 The deck page shows the box path and its state: complete, _n_ cards to pull, or _m_ cards to put back.
3.3 **Put this deck in its box** records a deck the player already holds. A preview sorts each card into four groups: already in the box; owned and Unplaced, to place here; owned in another place, to move here or leave; not owned, to add to the collection here. Nothing is written before the player confirms, and a copy already owned is never added twice [15].
3.4 Unpairing keeps the copies in the box. Deleting the deck unpairs the box and marks all its copies to put back.

### 4. Pull list

4.1 For a deck and a target place (its box by default), the list shows every card the deck needs, with the copies already in the target and the copies to pull. It uses I-06's counting rules: the main zone, commander and partner count; sideboard and maybeboard do not; basics sit behind a toggle.
4.2 Each printing lists its sources in this order: (1) places not paired to a deck; (2) other deck boxes, each labelled "breaks _deck_"; (3) Unplaced, labelled "place unknown"; (4) the same card in another printing, labelled as such and matched by name until I-06 stores Oracle IDs.
4.3 Rows are grouped by place path and sorted by each place's sort order.
4.4 A card with no source is listed as missing, with its I-06 intent (proxy now or buy later) and a link to the shopping list. The pull list never buys anything.
4.5 Ticking rows, or "pulled everything from this place", records the moves into the target as one atomic batch. Partial pulls are allowed, and the last batch can be undone.
4.6 Computing the list writes nothing. It can be copied as text or CSV, and it works at phone width.

### 5. Put-back list

5.1 For a deck box, the list shows the copies its paired deck no longer needs. These are the cards removed in the editor, or every copy when the deck is dismantled, unpaired or deleted.
5.2 Each copy's proposed destination is the place it was last pulled from. If there is none, it is the place holding other copies of that printing, then the player's default return place, then Unplaced. The player can change any destination.
5.3 Rows are grouped by destination and follow its sort order. Each confirmation, per row or per destination, is one atomic batch.
5.4 **Dismantle** shows the put-back list for the whole box, then offers to unpair it. The decklist and ownership stay as they are.

### 6. Misplaced cards and contention

6.1 For a paired deck, a card is misplaced in two cases: the deck needs it, the box lacks it and a copy sits elsewhere (to pull); or the box holds a copy the deck no longer lists (to put back).
6.2 The deck page and the box page show both counts and link to the two lists. "Check my deck boxes" lists every paired box with its state, computed when asked. There is no background job and no notification.
6.3 **Contention.** When the paired decks together need more copies of a printing than the player owns, the printing is listed with the decks competing for it and the number of copies short.
6.4 Warnings never block editing a deck or the collection.

### 7. Cards across all decks

7.1 A list shows every card in the player's decks: how many decks use it, the copies they need in total, the copies owned, and how many of those decks are built. The most-used cards come first. Each row links to I-06's printing selector, so a preferred printing can be set where it matters most [16].
7.2 Any two decks can be compared: the cards they share, with counts.
7.3 The I-06 acquisition plan gains a "built decks only" scope, which reads only the paired decks. It gives the copies needed to keep every built deck assembled at once.
7.4 These views only read data; they write nothing.

### 8. Deck-box labels

8.1 A deck box can print a label showing the deck's name, commander and colours, and a QR code for `/b/<token>`. The token is random, at least 128 bits, and contains no deck ID or name.
8.2 Any phone camera opens the label. The owner, signed in, sees the box page. Anyone else sees the deck's share view only if the owner has turned on "label opens the shared deck"; otherwise they see a page that reveals nothing about the deck.
8.3 The label follows the box: if the box is paired with another deck, the label opens that deck. Regenerating the token revokes every printed label.
8.4 When I-19 has cached the paired deck on that device, `/b/<token>` opens the cached copy offline. Otherwise the page says it needs a connection.
8.5 The QR code is drawn in the browser by a bundled library; the MIT-licensed `qrcode` package [21] is one candidate. No third-party QR service sees the URL.
8.6 `robots.ts` disallows `/b/`, and the page is sent with `noindex`.

### 9. The free and paid line

| Part                                                                                                                                                                                                                       | Free                                                                                      | Paid hypothesis (I-30 decides) | Why                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Places, nesting, kinds, sort orders, bulk moves                                                                                                                                                                            | Yes, unlimited                                                                            | —                              | The player's own data is never the lever (I-30 1.2). EchoMTG charges for nesting [1], so free nesting is a visible difference |
| Pairing a box, putting a deck in its box, the pull and put-back lists for one deck, undoing the last batch                                                                                                                 | Yes                                                                                       | —                              | These keep one deck honest. Grimoria links decks to boxes with no paid tier seen [4][6]                                       |
| Misplaced and contention warnings, "check my deck boxes"                                                                                                                                                                   | Yes                                                                                       | —                              | Cheap reads of data the player entered                                                                                        |
| Cards across decks, two-deck overlap, the built-decks plan                                                                                                                                                                 | Yes                                                                                       | —                              | I-06's cross-deck plan already ships free, and nothing free becomes paid (I-30 1.4)                                           |
| Labels and QR codes; placements in the CSV export and in I-38's full export                                                                                                                                                | Yes                                                                                       | —                              | A link to the player's own deck; data portability                                                                             |
| **Game-night planner:** pick several decks for one night. One pull list settles contention between them (which box lends which card, the fewest moves, the proxies still needed), with a matching put-back plan afterwards | Single-deck lists do the same job by hand                                                 | Paid                           | It computes over the player's own data across decks (I-30 1.3). None of the products read offers it; demand: [18]             |
| **Move history:** a timeline for each copy and each place, "where was it on date X", and undo of any past batch                                                                                                            | Moves are stored for everyone and exported free, and the put-back list reads the last one | Paid                           | It watches the player's own data over time (I-30 1.3). EchoMTG sells it on Pro at $12/month [1][3]                            |

9.1 Entitlements gate only those two tools ([I-30 5.1](i30-business-model-and-paid-tier.md#5-entitlements)). Losing them deletes nothing, and every move stays in the export.

## Data model / API

```
StoragePlace   id, userId, name, kind (binder|box|deckBox|shelf|other), parentId?, sortOrder (none|name|colorName|setNumber),
               pairedDeckId? (unique; deckBox only; SetNull when the deck is deleted), labelToken? (unique), labelOpensShare,
               isDefaultReturn (at most one per user), createdAt, updatedAt — index (userId, parentId)
CardPlacement  id, userId, collectionCardId (Cascade), placeId (Restrict), quantity (> 0), updatedAt
               — unique (collectionCardId, placeId); index (userId, placeId)
PlacementMove  id, userId, batchId, collectionCardId? (SetNull), scryfallId, foil, fromPlaceId?, toPlaceId?, quantity,
               reason (manual|bulk|pull|putBack|deckToBox|quantityDecrease|merge|placeDeleted), createdAt
               — index (userId, createdAt); index (collectionCardId, createdAt)
```

All three tables cascade from `User`. One module owns every write to them. It enforces Σ `CardPlacement.quantity` ≤ `CollectionCard.quantity` in the same transaction as each move or quantity change, with the collection row locked (`SELECT … FOR UPDATE`).

Every route is private to its owner:

| Area            | Routes                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Places          | `GET`/`POST /api/places`; `PATCH`/`DELETE /api/places/[id]` (delete takes `moveContentsTo`); `GET /api/places/[id]/cards?cursor=` |
| Moves           | `POST /api/placements/moves` (one batch); `POST /api/placements/moves/[batchId]/undo`                                             |
| Deck boxes      | `PUT`/`DELETE /api/decks/[id]/box`; `POST /api/decks/[id]/box/fill` (`preview` or `commit`)                                       |
| Lists and views | `GET /api/decks/[id]/pull-list?target=&basics=`; `GET /api/places/[id]/put-back`; `GET /api/collection/across-decks?cursor=`      |
| Labels          | the page `/b/[token]`                                                                                                             |

The existing usage route also returns places, for "Stored in".

## Non-goals

- Changing ownership quantities, the printing chosen or proxies (I-06); committing copies to decks for ranking (I-16); buying (I-06, I-32).
- Binder page and pocket positions. No request for them was found.
- Photos of places, places shared between accounts, and store inventory. Photos would add uploads to host and moderate (I-38).
- Scanning straight into a place. I-40 may later stage scanned rows with a target place.
- Writing NFC tags. Web NFC is experimental and not Baseline [20]. A player can write the label URL with any NFC app; Delver added tag writing to its own app on 2026-10-16 [22].
- A public view that hides cards in use from a shared collection [11]. That belongs with the have lists of [I-44](i44-trade-lists-within-the-pod.md), which can read placements.
- Offline pull lists, background checks and notifications.
- Identity for each physical copy, such as a serial number per card.

## Testing strategy

Write the failing test first, as the [TDD contract](../../engineering/tdd-with-ai.md) requires.

- **Pure planner (solitary):** the source order in 4.2, the other-printing fallback and the basics toggle; counting identical to `buildAcquisitionPlan`, through one shared helper tested once.
- **Put-back rule (solitary):** the fallback chain in 5.2, including a pulled copy whose original place has been deleted.
- **Place tree (solitary):** cycles refused, the depth limit, and roll-up of counts and values with unpriced copies kept apart.
- **Invariant (sociable, PostgreSQL):** two concurrent moves of a row's last Unplaced copy let exactly one through; a quantity decrease reduces placements in the order of 2.4 and reports them; a printing-swap merge merges placements; deleting a row cascades to its placements; deleting a place without a destination is refused.
- **Batches:** a batch that fails midway writes nothing, and undo restores the previous placements exactly.
- **Read-only routes:** the pull list, put-back list, warnings and cross-deck view produce zero writes, asserted against the Prisma client as I-16 does for its route.
- **Ownership untouched:** nothing changes `CollectionCard.quantity` except the confirmed commit in 3.3.
- **Authorization:** another user's row, place, deck or batch answers 404. `/b/<token>` reveals no deck name to a stranger, or to a signed-in user who is not the owner, unless the switch in 8.2 is on. A regenerated token answers 404.
- **Scale:** with 20,000 rows, 60 decks and 80 places, the pull list returns within the route's deadline, and place pages paginate.
- **Free access:** a guard test lists the only modules here allowed to call `can()` (I-30).
- **Phone and locales:** the pull and put-back journeys run at phone width through I-40's harness, and every string exists in English and French.

## Delivery slices

| #   | Slice                                                                                                                                             | Depends on                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Schema and migration for `StoragePlace`, `CardPlacement` and `PlacementMove`, plus the single write module with the invariant and row lock. No UI | —                          |
| 2   | Places: routes and page; create, nest, rename, sort order, delete with a destination; Unplaced                                                    | 1                          |
| 3   | Placing copies: single and bulk moves; 2.4 and 2.5 in the existing collection routes; "Stored in"                                                 | 2                          |
| 4   | Deck-box pairing, the box state on the deck page, "put this deck in its box"                                                                      | 3                          |
| 5   | Pull list: a read-only planner and route, then confirming as moves, with undo                                                                     | 4                          |
| 6   | Put-back list and dismantling                                                                                                                     | 5                          |
| 7   | Misplaced and contention warnings; "check my deck boxes"                                                                                          | 5                          |
| 8   | Cards across decks, two-deck overlap, the "built decks only" plan scope                                                                           | 4                          |
| 9   | Labels: printable label, QR code, `/b/[token]`, regeneration, robots rule                                                                         | 4                          |
| 10  | The label opens I-19's cached deck offline                                                                                                        | 9; I-19 slices 3 and 4     |
| 11  | A place column in the collection CSV export                                                                                                       | 3                          |
| 12  | A place column in collection import, creating unknown places after confirmation                                                                   | 11; I-26 slice 3           |
| 13  | Paid candidate: the game-night planner                                                                                                            | 5, 7; I-30 slices 0 and 11 |
| 14  | Paid candidate: the move-history timeline and undo of any batch                                                                                   | 5; I-30 slices 0 and 11    |

Slice 1 carries every schema change in this spec; no later slice migrates. Slices 1 to 5 are the deck-box path. A player who records their built decks gets pull lists that name the other deck boxes holding a card, with no import needed. Binders and boxes become worth filling at scale once slice 12 lets an import carry places. Scheduled agents must not pick slices 13 or 14 before I-30's slice 0 answers are committed.

## Open questions

- **Should the deck-box path be promoted?** Slices 1 to 5 need neither I-26 nor I-30. The evidence is medium: two products have shipped it, and the requests are many but small. Is that enough to make them Next, alongside I-16, which serves the same players?
- **Rows or copies?** A placement counts copies of one row, and a row has a single condition. If I-06 makes proxies, condition or language a property of each copy, placements must follow. Decide before slice 1.
- **Should I-16 read placements?** A copy in a paired box is physically committed. I-16 derives commitment from decklists and forbids a second source of truth. This spec shows any disagreement as a warning (6.1) instead of changing I-16. Confirm that choice.
- **Is move history a fair paid lever?** The moves are the player's own data and stay free to keep and export; only the timeline tool would be paid. Is that inside I-30 1.2? How long are moves kept? Retention belongs to I-38.
- **The label default.** Should the label on a shared deck open the share view by default, or only after the opt-in in 8.2? This spec chooses the opt-in.

## Sources

Read on 2026-11-09 unless stated otherwise. Reddit scores and comment counts come from the [Arctic Shift](https://arctic-shift.photon-reddit.com/) archive, as archived on that date.

1. EchoMTG, "Locations: Know exactly where every card lives", 2026-06-17. <https://www.echomtg.com/blog/895/locations-know-exactly-where-every-card-lives/>
2. EchoMTG, "Soft caps, new tools and smoother upgrades", 2026-09-15. <https://www.echomtg.com/blog/1172/soft-caps-new-tools-and-smoother-upgrades/>
3. EchoMTG, plans page: Basic free (500 cards); Collector $4/month; "Finance Guru" $8/month, which the blog calls "Financer"; Pro $12/month; LGS $25/month. <https://www.echomtg.com/plans/>
4. Grimoria help, "Card locations" (undated; site build v2.3.49 (2026110901)). <https://grimoria.app/help/collection/binder-locations>
5. Grimoria help, "Deck boxes vs binders" (undated). <https://grimoria.app/help/collection/decks-vs-binders>
6. Grimoria help, "Deck box sync" (undated). <https://grimoria.app/help/deckbuilder/deckbox-sync>
7. ManaBox guide, "Getting started" with the collection (undated). <https://manabox.app/guides/collection/getting-started>
8. MTG Scanner – Dragon Shield, App Store listing; version 8.2.1 released 2026-11-05 according to the iTunes Search API. <https://apps.apple.com/us/app/id1460657155>
9. Deckbox forum, "Feature Request - Location Tags", 2016-10-15 to 2018-02-11. <https://deckbox.org/forum/posts/118639>
10. r/Moxfield, "Binder help", 2025-12-28, 3 points. <https://www.reddit.com/r/Moxfield/comments/1pxd7aq/>
11. r/Moxfield, "Visual indicator for cards currently 'In Use' in the Collection view", 2026-01-01, 7 points. <https://www.reddit.com/r/Moxfield/comments/1q1dlio/>
12. r/Moxfield, "Is there a way to display binder information on a shared collection", 2025-09-08, 2 points. <https://www.reddit.com/r/Moxfield/comments/1nbyymp/>
13. r/Moxfield, "Collection Feature question/suggestion", 2025-05-25, 1 point. <https://www.reddit.com/r/Moxfield/comments/1kuvy2j/>
14. r/Moxfield, "Collection features that might already exist?", 2025-04-05, 3 points. <https://www.reddit.com/r/Moxfield/comments/1js3a2p/>
15. r/Moxfield, "From Decks > Add to Collection", 2025-07-21, 1 point; and "Collection (binders) -> Deck/Pack mass assign", 2026-03-26, 1 point. <https://www.reddit.com/r/Moxfield/comments/1m5x46a/>, <https://www.reddit.com/r/Moxfield/comments/1s445wo/>
16. r/Moxfield, "Is there a way to see what cards you play the most across decks", 2026-11-05, 3 points. <https://www.reddit.com/r/Moxfield/comments/1xo89pf/>
17. Archidekt forum, "[Collection] Collection folders" (archived; edited 2024-04-01). <https://www.archidekt.com/forum/thread/2377545/1>
18. r/EDH, "Looking for storage for commander decks that works with storage and swapping what I take to games", 2026-09-09, 7 points. <https://www.reddit.com/r/EDH/comments/1wbysm6/>
19. r/EDH, "Portable Storage for 32 Decks?", 2025-12-03, 89 points. <https://www.reddit.com/r/EDH/comments/1pdig47/>
20. MDN, "Web NFC API", last modified 2024-07-26. <https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API>
21. npm registry, `qrcode` 1.5.4, licence MIT. <https://registry.npmjs.org/qrcode/latest>
22. MTG Delver TCG Scanner 1.25 for iOS, 2026-10-16: "New option to write NFC tags", from the iTunes Search API. <https://apps.apple.com/app/id6504142186>
