# I-57: Printing Preferences Applied Everywhere

> **Initiative:** I-57, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next · **Written 2026-11-10**
> **Research:** dated notes of 2026-11-10 on how competitors choose a printing, Scryfall's search keywords, and a sample of 150 Commander staples resolved through Scryfall's API. The notes are not committed, so every external fact cites a numbered entry in [Sources](#sources).
> **Owns:** the player's printing rule, its per-deck override, per-card pins, the order in which a printing is chosen when a card enters a deck by any path, the reason recorded with each choice, and the reviewed diff that applies the rule to an existing deck. **Does not own:** printing-level ownership and the acquisition plan ([I-06](../roadmap.md#i-06-collection-and-purchase-planning)); free copies and the commitment index ([I-16](i16-decks-buildable-from-a-collection.md)); the market choice and dated prices ([I-32](i32-seller-handoff-and-affiliate-carts.md)); finish, language, the printing selector's controls, the line syntax and change history ([I-37](i37-editor-depth.md)); export formats ([I-50](i50-play-this-deck-online.md), [I-10](../roadmap.md#i-10-interoperability-and-integrations)); colour signals ([I-49](i49-colour-vision-and-low-vision-display.md)); what the copilot generates ([I-02](i02-checkable-ai-copilot.md)).

## Overview

A card enters a deck here by at least ten paths: search, drag from search, the printing selector, text import, URL import, bulk edit, the AI wizard, an AI suggestion, a card package and a fork. Each picks a printing its own way. Most ask Scryfall for a card by name and receive Scryfall's newest edition. On 2026-11-10 that edition was a Universes Beyond printing for 87 of the 150 most-played Commander cards, 67 of them from two Star Trek sets released on 2026-11-13, three days later [11]. A player who wants the original art, the cheapest copy in euros or no crossover printings changes each card by hand.

I-57 gives each player one printing rule. The rule runs wherever a card enters a deck, can be applied to a whole deck as a reviewed diff, can be overridden per deck, and decides the printing that prices, exports, proxies and the acquisition plan then use. The copilot never chooses a printing; the rule does.

Gap-mining rated this partly covered (I-06's outcome "which printing to use", I-37's finish) and effort S–M. Archidekt, TappedOut and Moxfield offer printing defaults free, so nothing here is a paid-tier candidate. It is Next because the entry points disagree today and two defects found while writing this spec make choices and prices wrong now.

## What the market does

Read on 2026-11-10 unless dated otherwise.

| Product                | Default and rule                                                                                                                                                                                                                                              | Whole deck, exclusions, owned                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archidekt**          | Since 2019, "the most recent nonfoil, non-gold-bordered version" when none is given [2]. "Preferred Printing": Cheapest, Most expensive, Fanciest, Newest, Oldest; "Fanciest" follows a hierarchy and "your mileage may vary" [1]                             | "Optimize printings" on selected cards shows a preview; each line can be unchecked before "Overwrite # Cards". Exclusions exist, none checked by default. Foil-only and UB or Secret Lair exclusions were requested; owned-first "not on the immediate horizon" [1] |
| **TappedOut**          | Newest by default; a deck-editor dropdown "Default Printings" offers Newest, Oldest, Lowest Price, Highest Price (2025-09-14) [4]. A cheapest default was first asked for in 2016 [5]                                                                         | Set codes per line for anything finer. A user asked on 2025-12-09 for a saved default art per card across decks, which the site does not appear to offer [4]                                                                                                        |
| **Moxfield** (weak)    | An account "Default Scryfall Query" accepts `prefer:oldest`, `prefer:default` or `not:ub`; users report it does not apply to imported lists [6]. Its 2020 wiki: any printing can be chosen, with its price [7]                                                | An "Update to Oldest" action was requested and reported merged into the More menu; a UB toggle request was completed, then reopened [6]. Search summaries only: the board and help pages refused automated requests                                                 |
| **Cockatrice**         | One printing per card can be pinned; it is used "whenever the printing isn't explicitly specified" (3.2.0-beta.2, 2026-11-08) [8]                                                                                                                             | Per card, not per deck                                                                                                                                                                                                                                              |
| **Deckstats**          | Not verified. A 2021 forum request, read as a search summary, says it sometimes picks the cheapest printing and sometimes not; the forum refused automated access [15]                                                                                        | —                                                                                                                                                                                                                                                                   |
| **Scryfall** (the API) | `prefer:oldest`, `newest`, `usd-low`, `usd-high`, `eur-low`, `eur-high`, `promo`, `default`, `atypical`, `ub`, `notub`; filters `not:universesbeyond`, `is:default`, `is:atypical`, `border:`, `frame:`, `is:full`, `is:foil`, `is:digital`, `game:paper` [9] | `/cards/collection` by name "Finds the newest edition of a card"; search and collection are limited to 2 requests per second and a query to 1,000 characters [10]                                                                                                   |

**What the newest edition is, computed 2026-11-10** [11]. The 150 most-played Commander-legal non-basic cards (Scryfall, `order:edhrec`) were resolved by name. 87 resolved to a Universes Beyond printing; search returned the same printing for 149. Lotus Petal resolved to Tempest Remastered, a Magic Online-only printing with no price. Three of the 150 had no USD price. One copy of each priced card cost 1,885.19 USD at the newest edition and 1,748.41 USD at the cheapest (145 cards, −7.3%); in euros, 1,634.60 against 1,455.74 (133 cards, −10.9%). Dark Ritual costs 8.54 USD in its newest printing and 0.25 USD in its cheapest. The cheapest USD printing was itself Universes Beyond for 50 cards, so "cheapest" and "no Universes Beyond" conflict. The One Ring and Delighted Halfling have only Universes Beyond printings: a hard filter removes them, as Moxfield users report of `not:ub` [6]. Secret Lair spans five set codes of three set types, and The List (`plst`) is typed `masters` in Scryfall's set list, so exclusions need code lists, not set types [11].

**Demand.** Four web searches aimed at Reddit, standard and extended, found no thread. Demand appears instead on Moxfield's board [6], TappedOut's forum [4][5] and Archidekt's [1][3], in another product's issue (opened 2026-10-14) where imports lost their printing and defaulted to Secret Lair or promo art, fixed by ranking set types [12], and in EDHMat's import guide: "crossover reprints take over the table"; its Command Tower appeared in its Marvel printing [13].

**The gap.** No product found applies one rule at every entry point, import and AI included, records why each printing was chosen, or puts an owned copy first. Archidekt's preview-and-uncheck is the model for the whole-deck diff.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10 by reading the code; nothing was run.

- **Name lookups return Scryfall's newest edition.** `src/lib/scryfall/client.ts` exposes `getCardByName` and `getCardByNameFuzzy` (`/cards/named`), `getCardCollection` (`/cards/collection`) and `searchCards` (default `unique`, `order=edhrec`). They serve text and URL import (`ImportDialog.tsx`, `ImportFromUrlTab.tsx`, through `fetchInBatches` in `src/lib/deck/batch-fetch.ts`), the AI wizard (`importCardsInBatches` and the commander lookup in `DeckWizard.tsx`), AI suggestions (`addNamedCardToZone` in `src/lib/deck/ai-add-card.ts`), suggestion evidence (`src/app/api/ai/suggest/route.ts`) and the server check of generated decks (`src/lib/ai/generated-deck-legality.ts`). The AI returns names only (`src/app/api/ai/build/types.ts`).
- **Imports drop the printing their source gives.** `SET_CODE_PATTERN` in `src/lib/deck/import.ts` strips `(SET) 123`. `src/lib/import/url-import.ts` reads Moxfield's `card.name` and Archidekt's `oracleCard.name` only, although Archidekt's public payload carries the Scryfall `uid`, `collectorNumber`, `edition.editioncode` and a `modifier` such as `Normal` [14].
- **Owned-first is implicit and partial.** `getOwnedPrinting` in `src/lib/deck/store.ts` takes the first collection row with the same name, a positive quantity and a different Scryfall ID, from the collection the browser loaded (`CollectionProvider.tsx`, signed-in only). `addCard`, `addDeckCard` and `applyBulkEdit` call it; `setCommander`, `setPartner`, `setCompanion` and `addToMaybeboard` do not. No notice tells the player. The roadmap's I-06 line says import matching remains open; main-deck import rows already pass through `addCard`.
- **Defect 1: an explicit pick can be replaced.** `handlePrintingSelect` in `src/app/[locale]/builder/[deckId]/page.tsx` passes the printing chosen in the selector to `addCard`. When the player owns any other printing of that name, `addCard` adds that one instead. Because the lookup skips the chosen ID, this happens even when the player owns the chosen printing too.
- **Defect 2: a printing swap keeps the old price.** `swapCardPrinting` sends `scryfallId`, `imageUri` and `artCropUri` to `PATCH /api/decks/[id]/cards/[cardId]`, never `price`. Deck totals (`PricingShoppingListModal.tsx`, `ShoppingListModal.tsx`) and the acquisition plan (`src/lib/collection/acquisition-plan.ts`) read `DeckCard.price`.
- **Name lookups do not filter paper.** `searchCardPrintings` adds `game:paper`; the name lookups do not, hence the digital-only Lotus Petal above.
- **Packages, forks and duplicates copy printings.** `src/app/api/community/card-packages/[packageId]/apply/route.ts` writes the package author's `scryfallId`; `src/app/api/decks/[id]/fork/route.ts` and `duplicate/route.ts` copy rows.
- **The printing selector** (`PrintingSelectorModal.tsx`, `useCardPrintings.ts`) lists paper printings newest first, owned first, with an owned-only filter (#978). It shows the set code, not the collector number or a price per printing.
- **No preference storage.** `User` in `prisma/schema.prisma` has no preference fields; `NotificationPreference` is the one-to-one precedent. `src/app/[locale]/settings/` holds `api-keys` and `notifications` only. `Deck` has no printing override. `DeckCard` stores `scryfallId` and a USD `price`, with no reason, finish or collector number. `ScryfallCard` (`src/lib/scryfall/types.ts`) lacks `released_at`, `set_type`, `collector_number`, `frame`, `frame_effects`, `border_color`, `full_art`, `promo`, `finishes` and `digital`. Prices are USD only (`makeDeckCard` in `src/lib/deck/store-card-faces.ts`).

## Functional requirements

### 1. The rule

1.1 A signed-in player has one rule with an **order** (newest; original, meaning oldest; cheapest in the player's market; a preferred frame: default, classic 1993 or 1997, borderless, full art; or bling: atypical treatments first), **exclusions** (Universes Beyond, Secret Lair, The List, promos) and **owned first** on or off.
1.2 Digital-only printings are never chosen for a paper deck, whatever the rule.
1.3 Cheapest uses the market chosen under [I-32 requirement 2](i32-seller-handoff-and-affiliate-carts.md#2-market-and-prices) and Scryfall's daily price, never a converted one. Until I-32 slice 3 ships, cheapest means USD and says so. A printing with no price in the market is never the cheapest.
1.4 Bling prefers atypical treatments, such as borderless, showcase and extended art, over the default frame, through Scryfall's `prefer:atypical` [9]. Once [I-37 slice 12](i37-editor-depth.md#13-finish-language-and-date-added-on-deck-cards) records finish, bling also prefers foil, then etched, where the printing exists in that finish.
1.5 Secret Lair and The List are code lists reviewed in a pull request and dated: on 2026-11-10, `sld`, `slu`, `slc`, `slp`, `pssc` and `plst`, `ulst` [11]. Universes Beyond uses Scryfall's `not:universesbeyond`. A weekly check reports any Scryfall set named "Secret Lair" or "The List" missing from the lists.
1.6 Until a player saves a rule, the product default applies (open question 1). Changing the default never changes an existing row.
1.7 The settings page states the rule as a sentence ("Newest printing, no Universes Beyond, Secret Lair or The List, my copies first") and links the Scryfall query that resolves it, so the player can check it on scryfall.com.
1.8 The rule lives at `/[locale]/settings/printings`. Guests use the product default.

### 2. Precedence and fallback

2.1 One pure function decides, first match wins: (1) a printing the player chose in this action; (2) a printing the source names; (3) the player's pin for the card; (4) an owned printing, when owned first is on; (5) the rule's result; (6) the fallback.
2.2 Among owned printings, copies not committed to another deck come first once [I-16 slice 4](i16-decks-buildable-from-a-collection.md) ships, then the rule's order. Ownership matches by Oracle identity once I-37 slice 12 stores it, by name before.
2.3 When exclusions remove every printing, the fallback keeps the order and ignores the exclusions, with a notice naming the card ("The One Ring: no printing outside your exclusions; LTR used"). A card is ranked down, never dropped.
2.4 Every deck row records its `printingSource`: explicit, source, pin, owned, rule, fallback or legacy. Existing rows are legacy.
2.5 The same rule, Scryfall data and price date give the same printing. Ties go to release date, newest first, then set code, then collector number.
2.6 A printing in a deck never changes on its own. Price moves, new sets and rule changes affect new entries and the reviewed diff only.

### 3. Every entry point

3.1 The rule runs for search, drag from search, quick add and clipboard entries without a printing (I-37), text and URL import, bulk-edit additions, the AI wizard's cards and commander, AI suggestions and their alternatives, recommendations, card packages, commander, partner and companion slots, and the maybeboard. A test enumerates the store actions that create deck rows and fails when one bypasses the resolver.
3.2 Import keeps a printing its source names: a text line's `(SET) collector-number` through Scryfall's set-and-number identifier, an Archidekt row through its `uid`. A printing that does not resolve falls back to the rule with a notice. The dialog offers "Use my printing rule for every card".
3.3 A fork keeps the source's printings by default; a package applies the player's rule by default, because its printings are another player's choice. Both dialogs offer the other option. Duplicating one's own deck keeps printings.
3.4 The AI never picks a printing. Prompts carry names only, and a set code in a model reply is ignored. Budget checks in the wizard and the copilot price the printing the rule will pick, in the player's market ([I-02 requirement 5](i02-checkable-ai-copilot.md#5-card-data-checks-before-a-generated-deck-is-saved)).
3.5 After an import, a build or a package, a summary counts the cards per source in 2.1 and lists fallbacks and unresolved printings, announced in a polite live region. A single add shows its reason in the card panel, not in a toast.
3.6 A 100-card import resolves in at most 8 Scryfall search requests, fallbacks included, batching names with `or` under the 1,000-character limit, at 2 requests per second [10], through the existing server cache.

### 4. Applying the rule to an existing deck

4.1 "Apply my printing rule" computes a diff: for each line, the current and proposed printing with set, collector number, treatment and price in the market, and the deck total before and after.
4.2 Lines whose source is explicit, pin or owned are listed unchecked; the others are checked. The player may uncheck any line.
4.3 Apply writes only the checked lines, in one transaction, against the deck version previewed; a deck changed since then gets 409 and a reload prompt. It changes printing, image URIs, price and `printingSource`, and nothing else.
4.4 Apply is one undo entry, and one history batch with an automatic snapshot once [I-37 slice 10](i37-editor-depth.md) ships.
4.5 The diff runs on the whole deck or on an I-37 multi-select.

### 5. Per-deck override and pins

5.1 A deck may override the rule, for example bling for a showcase deck and cheapest for a budget build. The deck header names the rule in force.
5.2 A player may pin a printing for a card from the printing selector. The pin wins over the rule in every deck, as in Cockatrice [8] and as a TappedOut user asked [4]. Pins are listed and removable in settings.
5.3 Removing an override or a pin changes no existing row.

### 6. Where the chosen printing travels

6.1 **Price.** A printing change updates the row's price in the same write (defect 2). Once I-32's dated snapshot ships, totals read it by Scryfall ID and finish instead of a copied value.
6.2 **Exports.** The stored Scryfall ID is the source of set code and collector number for every export ([I-50 requirement 2](i50-play-this-deck-online.md#2-card-identity-across-platforms)). Text export writes `(SET) collector-number`, so a printing round-trips ([I-37 requirement 7](i37-editor-depth.md#7-text-bulk-edit-in-place)).
6.3 **Proxies** print the stored printing, as `src/lib/deck/proxy.ts` does today.
6.4 **Acquisition plan.** Each line shows its `printingSource`. I-32's exact-or-any choice defaults to "any" for rows chosen by a cheapest rule and to "exact" for explicit and pinned rows.

### 7. Display and accessibility

7.1 Treatments and finishes are named in text: Foil, Etched, Borderless, Showcase, Extended art, Universes Beyond, Secret Lair, The List. No shimmer, colour or icon carries one alone ([I-49 requirement 2](i49-colour-vision-and-low-vision-display.md#2-a-second-channel-for-every-colour-signal-141)).
7.2 The settings page previews three cards under the current rule; each image's alt text names the set and treatment.
7.3 The printing selector adds each printing's collector number and price in the market and marks the printing the rule would pick.

### 8. Free and paid

8.1 Everything here is free. Archidekt, TappedOut and Moxfield offer printing defaults at no charge [1][4][6], and printing data is card data, which the strategic boundaries keep free. There is no paid-tier candidate for [I-30](i30-business-model-and-paid-tier.md).

## Data model / API

```
PrintingPreference  userId (unique, cascade), order (newest|oldest|cheapest|frame|bling), frame?, excludeUniversesBeyond,
                    excludeSecretLair, excludeTheList, excludePromo, ownedFirst, updatedAt
Deck              + printingRule Json?        -- null: the player's rule; same fields as PrintingPreference
PrintingPin         userId, cardName, oracleId?, scryfallId, createdAt   @@unique([userId, cardName])
DeckCard          + printingSource (explicit|source|pin|owned|rule|fallback|legacy, default legacy)
ScryfallCard      + released_at, set_type, collector_number, frame, frame_effects, border_color, full_art, promo, finishes, digital
```

- `src/lib/printing/choose-printing.ts` holds the pure precedence function; `rule-query.ts` compiles a rule into its Scryfall query.
- `GET` and `PUT /api/user/printing-preference`; `PUT` and `DELETE /api/user/printing-pins/[cardName]`.
- `POST /api/printings/resolve` takes names or parsed lines and an optional deck ID, and returns per line `{ scryfallId, source, notice? }` with the query used. It is read-only and runs on the server.
- `POST /api/decks/[id]/printings/preview` returns the diff; `POST /api/decks/[id]/printings/apply` takes `{ baseUpdatedAt, lines[] }` and answers 409 when the deck has moved.

## Non-goals

- A cross-seller cheapest split or listing-level prices ([I-32 requirement 6.2](i32-seller-handoff-and-affiliate-carts.md#6-splitting-and-the-price-watch)).
- Condition preferences, which belong to I-32's `AcquisitionLinePref`.
- Re-choosing printings automatically when prices move or a set is released.
- Letting a language model choose or suggest a printing.
- Platform printings for Arena or Magic Online exports, which I-50 requirement 2.3 chooses at export time.
- A rule for guests; they get the product default.

## Testing strategy

- **Solitary:** the precedence table in 2.1, tie-breaks, the all-excluded fallback, digital-only rejection, unpriced printings under cheapest, and uncommitted owned copies first.
- **Query compiler:** one snapshot per rule shape; every keyword it emits appears in a stored copy of Scryfall's syntax page.
- **Contract fixtures:** recorded Scryfall responses from 2026-11-10 for Sol Ring, Command Tower, Dark Ritual, The One Ring and Lotus Petal, with the expected printing under each rule.
- **Sociable store:** the entry-point enumeration (3.1); an explicit pick survives owning another printing (defect 1); a swap updates the price (defect 2).
- **API:** apply changes only checked lines and only printing fields, in one transaction; a stale base gets 409.
- **Import:** `(SET) 123` and Archidekt `uid` are kept; an unresolvable printing falls back with a notice.
- **E2E:** with "no Universes Beyond", importing Sol Ring does not yield `trc`; applying the rule to a deck changes its total as previewed.

## Delivery slices

| #   | Slice                                                                                                                                                                                                     | Depends on                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Defects 1 and 2: an explicit pick is never replaced; a printing swap updates the row's price                                                                                                              | —                                 |
| 2   | `choosePrinting` with precedence and fallback; `printingSource` column; added `ScryfallCard` fields                                                                                                       | —                                 |
| 3   | Rule-to-query compiler, batched server resolver with cache, exclusion code lists and the weekly set check _(2026-11-10: I-67 slices 9 and 10 later switch the source to local tables; no new dependency)_ | 2                                 |
| 4   | `PrintingPreference`, its API, the settings page with sentence, query link and preview; the product default                                                                                               | 3                                 |
| 5   | Every entry point in 3.1 through the resolver, with the enumeration test and the add summary                                                                                                              | 3 (product default until 4 ships) |
| 6   | Import keeps source printings: Archidekt `uid` first, text `(SET) number` next; "use my rule" option                                                                                                      | 5; I-37 slice 16 for text lines   |
| 7   | AI wizard and copilot: the rule picks printings and budget checks price them                                                                                                                              | 5                                 |
| 8   | Fork and package dialogs: keep source printings or use my rule                                                                                                                                            | 5                                 |
| 9   | Apply the rule to a deck: preview, uncheck, one transaction, 409, one undo                                                                                                                                | 3                                 |
| 10  | Per-deck override                                                                                                                                                                                         | 4, 9                              |
| 11  | Per-card pins                                                                                                                                                                                             | 2, 4                              |
| 12  | Selector shows collector number, price in market and the rule's pick                                                                                                                                      | 3                                 |
| 13  | Cheapest in the EUR market                                                                                                                                                                                | 4; I-32 slice 3                   |
| 14  | Bling with finish                                                                                                                                                                                         | 4; I-37 slice 12                  |
| 15  | Owned first by uncommitted copies                                                                                                                                                                         | 5; I-16 slice 4                   |

Slice 1 fixes what players hit today and needs no product decision. Slices 2 to 5 are the core; the Archidekt part of slice 6 can ship without I-37.

## Open questions

1. **The product default.** Keep Scryfall's newest edition, or default to the newest regular printing, excluding Universes Beyond, Secret Lair, The List and promos with the fallback in 2.3? 87 of 150 staples resolve to Universes Beyond today [11]; EDHMat and another product rank such printings down [12][13], while Archidekt checks no exclusion by default [1]. This spec recommends the regular printing; the owner decides.
2. **Language.** Should the rule also prefer French printings for French players? I-37 records the language played and Scryfall filters by `lang:`, but `prefer:` has no language option [9], so the resolver would need a second query per batch. Decide with I-11 before slice 4.
3. **Moxfield printings.** Does Moxfield's import payload carry a Scryfall ID or set and number? Moxfield refused automated requests, so this was not checked (I-10). Pasted text with `(SET) number` covers it once slice 6 ships.
4. **Owned first by default.** It is on, silently, for signed-in players today. Keep it on and make it visible, or off until the player opts in? This spec recommends on.
5. **The bling order.** Scryfall's `prefer:atypical` does not rank borderless against showcase or extended art, and Archidekt calls its own order subjective [1]. Accept Scryfall's choice in v1, or rank treatments locally from `frame_effects` and `border_color`?

## Sources

1. Archidekt, [Development Update – Printing Optimization](https://archidekt.com/news/3289648), read 2026-11-10; the only absolute date on the page is a moderator reply edited 2022-09-22.
2. Archidekt, [Changelog 0.7.0](https://archidekt.com/news/11650), edited 2019-04-04.
3. Archidekt forum, [Cheapest card version available](https://archidekt.com/forum/thread/19355/1), posts five to seven years old, read 2026-11-10.
4. TappedOut forum, [How do I avoid alternate art when deckbuilding?](https://tappedout.net/mtg-forum/tappedout/how-do-i-avoid-alternate-art-when-deckbuilding/), 2025-09-14 to 2025-12-09.
5. TappedOut forum, [Default card version](https://tappedout.net/mtg-forum/tappedout/default-card-version/), 2016-06-08.
6. Moxfield feedback board, [#48](https://moxfield.nolt.io/48), [#910](https://moxfield.nolt.io/910), [#1066](https://moxfield.nolt.io/1066), [#2417](https://moxfield.nolt.io/2417), read as search summaries on 2026-11-10; the board answered automated requests with HTTP 403.
7. Moxfield, [Features wiki](https://github.com/moxfield/moxfield-public/wiki/Features), last edited 2020-10-14.
8. Cockatrice, [Editing decks: printings](https://cockatrice.github.io/docs/d7/d64/editing_decks_printings.html), version 3.2.0-beta.2 of 2026-11-08.
9. Scryfall, [Search syntax reference](https://scryfall.com/docs/syntax), read 2026-11-10.
10. Scryfall API documentation, [`/cards/collection`](https://scryfall.com/docs/api/cards/collection), [`/cards/search`](https://scryfall.com/docs/api/cards/search) and [`/cards/named`](https://scryfall.com/docs/api/cards/named), read 2026-11-10.
11. Computed for this spec on 2026-11-10 from the [Scryfall API](https://scryfall.com/docs/api): the first 150 results of `f:commander -t:basic game:paper` ordered by `edhrec`; each resolved through `/cards/collection` by name and `/cards/named`; compared with `prefer:usd-low` and `prefer:eur-low` searches and with `is:ub unique:prints`; set codes from [`/sets`](https://api.scryfall.com/sets). Prices are Scryfall's daily figures of that date.
12. GitHub, krakenhavoc/cmd_and_ctrl, [issue #3605](https://github.com/krakenhavoc/cmd_and_ctrl/issues/3605), opened 2026-10-14, closed as completed.
13. EDHMat, [How to import a decklist from Moxfield or Archidekt](https://edhmat.com/guides/import-deck-moxfield-archidekt), updated 2026-09-24.
14. Archidekt public deck API, [deck 28130431](https://archidekt.com/api/decks/28130431/), one request on 2026-11-10, read for field names only.
15. Deckstats forum, [topic 5353](https://deckstats.net/forum/index.php/topic,5353.0/prev_next,next.html), 2021, read as a search summary on 2026-11-10; the page answered an automated request with HTTP 402.
