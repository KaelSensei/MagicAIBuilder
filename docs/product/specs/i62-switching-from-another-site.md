# I-62: Switching From Another Site In One Step

> **Initiative:** I-62, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 11 and 18; slices 12 to 14 follow I-37 and I-08; Later for collections (slice 15), want lists (slice 16) and the owner view's migration metric (slice 17), which wait for I-26, I-56 and I-39's event store (slice 17 marked Later 2026-11-10); any API route (slice 19) is blocked on a written permission. Never paid · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10 on the export features, file formats, APIs, terms and robots.txt of eleven sources. It is not committed, so every external fact links its own entry in [Sources](#sources). Moxfield, Deckstats and MTGGoldfish refused automated reads; their rows rest on third-party pages or search summaries and say so. Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the guided move from another site: the per-source guide, multi-file and zip upload, source detection, the migration preview across all decks, the loss table, the category-to-zone mapping per source, deck idempotency and re-import, the server commit of many decks, the report, and the migration's measurement. **Does not own:** single-deck paste and URL import and their parsers ([I-10](../roadmap.md#i-10-interoperability-and-integrations)); the collection pipeline and printing-level ownership ([I-26](i26-collections-arriving-from-elsewhere.md), [I-06](../roadmap.md#i-06-collection-and-purchase-planning)); the choice of printing ([I-57](i57-printing-preferences-everywhere.md)); custom categories, tags, finish and language on deck cards ([I-37](i37-editor-depth.md)); the primer length limit ([I-08](../roadmap.md#i-08-share-compare-and-learn)); the wanted list ([I-56](i56-wishlists-friends-can-buy-from.md)); storage places ([I-43](i43-physical-collection-storage-and-pull-lists.md)); other players' public decks ([I-29](i29-cross-site-deck-index.md)); the event contract ([I-39](i39-first-run-activation-and-measurement.md)); the full export out ([I-38](i38-trust-safety-and-user-rights.md#7-full-data-export)).
> **Proposed changes to neighbours:** I-39 gains one event and one deck origin (requirement 12.1). I-10's Moxfield profile panel points to the Moxfield guide while Moxfield refuses honest requests (requirement 2.3).

## Overview

A player who keeps 20 decks, a collection, folders, primers and a want list on another site will not retype them. Today they would open the import dialog 20 times. Each run creates or fills one deck, keeps card names only, and writes one request per card from the browser. Printings, finishes, categories and folders are lost without a word. Moxfield, the site this lever aims at, refuses the app's honest requests, and Moxfield itself exports one deck at a time [1].

I-62 turns the switch into one guided step. The player downloads their files from the other site with that site's own export, drops them here at once, sees every deck and what each will lose, confirms, and gets a report. A second run with the same files changes nothing. The product never logs in to the other site, never holds its credentials, never scrapes a page and never sends a header that pretends to come from that site.

This is the growth lever against Moxfield: the cost of leaving a site is the work of moving. It is measured as decks imported per new account through I-39's first-party events, and it is free for good (requirement 13).

## What the market does

Read on 2026-11-10 unless dated otherwise. "Search summary" marks a fact read in a search result, not on the page itself.

| Source            | Export per deck                                                                                                                                                                                                                                                                     | Export per account                                                                                                                                                                                                                                                                                                 | Public API and terms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield**      | Text, one deck at a time; the line syntax is `1 Name (SET) number *F* #tag` ([I-37 7.5](i37-editor-depth.md#7-text-bulk-edit-in-place)). Not re-verified: Moxfield answered 403                                                                                                     | None. "Export all decks at once", asking for "a zip file", has been open since 2023-09-30 [1]. Collection CSV with `Count, Tradelist Count, Name, Edition, Condition, Language, Foil, Alter, Proxy, Purchase Price, Collector Number` [3], plus `Tags` and `Last Modified` (search summary of Moxfield's help) [2] | No public API; its API and pages answer 403 to automated clients ([I-10](../roadmap.md#i-10-interoperability-and-integrations), [I-29](i29-cross-site-deck-index.md)). Tools that fetch Moxfield decks in bulk reach public decks only [23]                                                                                                                                                                                                                                                                   |
| **Archidekt**     | The FAQ describes only sending a deck to a vendor cart [6]; a text export with category headers is described by a third party (search summary) [24]                                                                                                                                 | No bulk deck export found. The collection importer has presets, matches by Scryfall ID or set and collector number, and lets ambiguous rows be skipped or tagged "Unsure"; its new importer "always adds cards already in your collection as new entries" [7]                                                      | Open, undocumented JSON. `/api/decks/v3/?ownerUsername=` lists a user's public decks with folder, `hasPrimer` and bracket; a deck carries Scryfall `uid`, `collectorNumber`, finish `modifier`, categories with `includedInDeck`, card `notes` and the deck's `description`, and no language [9]. Terms (2018-09-07) forbid "automated searches, requests, or queries" and access "to build a similar or competitive website" [5]. robots.txt disallows only login, compare, playtester and sandbox paths [8] |
| **TappedOut**     | Text at `?fmt=txt` (read by the importer on `dev`); a CSV with board, quantity, name, set code, foil, alter, signed, condition and language, without collector numbers (search summary) [11]. In a 2025 thread, two users disagree on whether a CSV download is a site feature [10] | Inventory CSV upload since 2017 (search summary) [11]                                                                                                                                                                                                                                                              | No API found. robots.txt blocks only named crawlers [10]                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Deckstats**     | Text with `SB:` sideboard lines, in a third-party sample (search summary) [25]; collection `amount, card_name, is_foil, is_pinned, set_id, set_code` [3]                                                                                                                            | Not verified                                                                                                                                                                                                                                                                                                       | None found. robots.txt answered 403 [12]                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **MTGGoldfish**   | "Export to Arena" page per deck (search summary) [13]                                                                                                                                                                                                                               | Collection CSV; two third parties disagree on its header: `Card, Set ID, Set Name, Quantity, Foil, Variation, Collector Number, Scryfall ID` with `FOIL_ETCHED` [3] against `Quantity, Card, Expansion, Price, Condition, Language, Foil` [4]                                                                      | No public API found; the import help answered 403 [13]                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **ManaBox**       | A re-importable text file [14]                                                                                                                                                                                                                                                      | Collection CSV, whole or per binder or list, with "all card properties as well as the binder/list name"; failed rows come back with reasons and line numbers [14]                                                                                                                                                  | None: an app. It imports deck URLs from Archidekt, Deckstats, Moxfield, Scryfall and others [14]                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Deckbox**       | Not verified                                                                                                                                                                                                                                                                        | Inventory CSV through View, Export, with extra columns (search summary, 2015) [15]: `Count, Tradelist Count, Name, Edition` (full set name), `Card Number, Condition, Language, Foil, Signed`, alter and misprint flags, price [3][4]                                                                              | None found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Delver Lens**   | —                                                                                                                                                                                                                                                                                   | CSV with chosen columns, Scryfall ID among them, and presets [16]; a `.dlens` backup is a SQLite database (search summary) [17]. Its `//` names fail Moxfield's import (2024-05-12) [1]                                                                                                                            | None: an app                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Dragon Shield** | —                                                                                                                                                                                                                                                                                   | CSV that opens with a `sep=` line; `Folder Name, Quantity, Trade Quantity, Card Name, Set Code, Set Name, Card Number, Condition` (`NearMint`), `Printing` (foil, etched), `Language`, prices, and a junk last row [3][18]                                                                                         | None: an app                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **EDHREC**        | Average decks only, not a player's own                                                                                                                                                                                                                                              | No personal deck storage found; an account adds price filters, salt scores and dark mode [19]                                                                                                                                                                                                                      | Terms forbid automated queries ([I-29](i29-cross-site-deck-index.md)). Nothing to migrate                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Scryfall**      | Not verified                                                                                                                                                                                                                                                                        | A deckbuilder: 1,200 lines per deck, 99 copies per line, 100 decks per free account [20]                                                                                                                                                                                                                           | The API reference documents no deck endpoint; robots.txt disallows only admin and error pages [20]                                                                                                                                                                                                                                                                                                                                                                                                            |

**Reconciliation is weak everywhere.** Archidekt's new importer duplicates on re-import [7]. Moxfield closed two issues in 2026 about collection imports and moves that failed to merge identical rows [1]. MTG Stand asks the player to choose between "Overwrite entire collection" and "Update Quantities & Add new cards" [16]. ManaBox imports the rows that resolve and hands back a CSV of failures [14], which is the model for requirement 3.3.

**The gap.** No product read moves many decks from another site in one step, shows what each will lose before writing, or makes a second run a no-op. Moxfield's own users have asked for a bulk export since 2023 [1]. Third-party tools fill the gap by fetching public decks only [23], which this product will not do.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10 by reading the code; nothing was run.

- **One deck per import, into the open deck.** `ImportDialog.tsx` has two tabs, `"text" | "url"` (line 24), and refuses without an active deck (line 244). From the header, `handleImportFromHome` first creates a deck named "Imported deck" with the date (`Header.tsx` lines 65–77). No file input, CSV import or zip exists for decks; the collection page exports CSV only (`CollectionPageClient.tsx` lines 112–118).
- **Seven URL sources, names only.** `ImportSource` lists Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, AetherHub and EDHREC (`src/lib/import/url-import.ts` lines 16–23). `UrlImportCard` holds name, quantity, command flags and zone, and no printing, finish, category or note (lines 25–32). Moxfield rows read `card.name` (lines 112–115, 172); Archidekt rows read `oracleCard.name` and map categories to zones only (lines 219–288). MTGTop8 falls back to parsing an HTML page (lines 334–342).
- **Moxfield refusal is typed.** `fetchMoxfieldJson` treats 403, 429 and an HTML body as a refusal (`moxfield-client.ts` lines 20, 50–56). `MoxfieldProfileImport`, mounted in the URL tab (`ImportFromUrlTab.tsx` line 231), lists a username's public decks through `search-sfw` (`moxfield-user.ts` lines 93–106) and imports one at a time.
- **The text parser drops printings.** `parsePlainTextDecklist` strips `(SET) number` and the `*F*` foil marker (`src/lib/import/decklist-parse.ts` lines 74–110); its headings are commander, partner, companion, sideboard, considering, maybeboard and main-deck names (lines 114–129). `SET_CODE_PATTERN` does the same for pasted text (`src/lib/deck/import.ts` line 37).
- **One request per card.** Both tabs call the store's `addCard` row by row (`forEachSequential`), which posts each card to `POST /api/decks/[id]/cards` (route lines 36–37, `deckApi.addCard` in `store.ts`). A 100-card deck is about 100 requests and no transaction. `/api/import/url` is public and allows 10 requests per minute per IP (route lines 9–21).
- **What the schema can hold.** `Deck.description`, the primer, is capped at 2,000 characters and `Deck.tags` at 20 of 50 characters (`src/lib/validation/deck.ts` lines 30–31). `DeckFolder` is unique per account and name (`prisma/schema.prisma` line 168). `DeckCard` has one `category`, `notes` and `zone` (lines 289–294) and no finish or language. `CollectionCard` has a foil boolean and a condition, no language or etched finish, and is unique by printing, foil and account (lines 390–407). `Deck` records no origin and no source.
- **No robots.txt check.** `src/lib/http.ts` sets an honest User-Agent (line 8); nothing under `src/lib` reads robots.txt.

**Overlaps, verified and resolved.** Roadmap lines cite `roadmap.md` at commit `77885e4`.

| Initiative | Where                                                                                                                                                                                 | Resolution                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-10       | Roadmap lines 1079–1139: shipped imports (1088), "Offer opt-in integrations only when authentication, rate limits and ownership are clear" (1135), the Moxfield owner decision (1139) | I-10 keeps single-deck paste and URL import. I-62 reuses its text parser, adds file adapters and many-deck orchestration, and calls no source over the network                                                                     |
| I-26       | Spec lines 32–37 (requirements), 48 (no sync), 67 (ManaBox preset); roadmap lines 1669–1673                                                                                           | I-26 owns collection import. I-62 routes collection files into I-26's pipeline inside the same flow and report; it adds no collection logic                                                                                        |
| I-29       | Spec line 5 (does not own importing), lines 53–57 (no circumvention, no accounts, no text authored elsewhere), line 78 (user-authorized decks)                                        | I-29 indexes other people's public decks; I-62 moves the player's own. I-62 applies 1.1 and 1.2 to itself. Imported decks stay private and reach the index only through 2.2. Rule 1.5 governs the index, not a player's own primer |
| I-39       | Spec line 5 (does not own importers), lines 86–89 (import as a first step), 131–139 (events), 164 (activation), 203 (`Deck.origin`)                                                   | I-39 owns the event contract. I-62 proposes one event and one origin value, and adds "Moving from another site?" to 2.1's empty states                                                                                             |
| I-57       | Spec line 63 (precedence), 73 (import keeps the source printing), 76 (summary), 154 (slice 6), 171 (Moxfield printings)                                                               | I-57 chooses; I-62 supplies the source printing as step 2 and shows I-57's summary. The text-line tokens I-62 needs are those I-57 slice 6 needs: one parser change serves both                                                    |

## Functional requirements

### 1. Source policy (non-negotiable)

1.1 **Files first.** A migration reads files the player downloaded with the other site's own export. It sends no request to that site.
1.2 **No credentials.** The product never asks for another site's password, cookie, token or API key, never logs in there, and ships no browser extension that reads another site's pages ([I-29 1.2](i29-cross-site-deck-index.md#1-source-policy-non-negotiable)).
1.3 **No scraping, no impersonation.** No HTML page is parsed for a migration, and no request carries another site's `Origin` or `Referer`. Modules under `src/lib/migration/` import no HTTP client; a test enforces it.
1.4 **An API only with permission.** A source's API is used only when its terms allow the use or the source grants it in writing, recorded with its date in the source register (slice 0). On 2026-11-10 none qualifies: Archidekt's terms forbid automated requests [5], Moxfield refuses automated clients, and Scryfall documents no deck API [20]. Any API route also checks robots.txt and the opt-out signals of [I-29 1.3](i29-cross-site-deck-index.md#1-source-policy-non-negotiable).
1.5 **The player's own data.** The upload asks the player to confirm the files hold their own decks and collection. Everything imported is private.
1.6 **Files stay with the player.** The browser parses the files; the server receives only the normalized bundle (see [Data model / API](#data-model--api)). Raw files are never uploaded or stored. An unconfirmed bundle is deleted after 24 hours.

### 2. A guide per source

2.1 `/[locale]/move` lists the sources. Each guide says, in words, what to download on that site, from which menu, and what each file will carry here, with the loss table of section 4 filled in for that source.
2.2 Each guide shows the date its steps were last checked. After 90 days it says the steps may have changed.
2.3 The Moxfield guide says that Moxfield exports one deck at a time [1] and gives a checklist the player ticks deck by deck. While Moxfield refuses honest requests, I-10's Moxfield profile panel links to this guide instead of offering a picker that fails.
2.4 EDHREC's guide says there is nothing personal to move and links to I-10's single-deck import [19].
2.5 Guides exist in English and French. Migration needs an account, because it creates many decks; a guest sees the guides and can import one deck through I-10.

### 3. Upload and detection

3.1 The player drops many files or one zip. Limits: 1,000 files, 500 decks, 50,000 collection rows, 50 MB uncompressed. Zip entries with absolute paths or `..` are refused, nested archives are not opened, and an expansion ratio above 100 stops the read.
3.2 Each file is detected by extension and header row and labelled, for example "Archidekt deck text" or "ManaBox collection CSV". The player can change any label. Nothing is guessed silently, as [I-26](i26-collections-arriving-from-elsewhere.md)'s first open question recommends.
3.3 A file or line that cannot be read is listed with its reason and line number, never dropped [14].
3.4 Collection and want-list files are recognised and routed (section 10). Until their slices ship, they are listed as "recognised, not imported yet".

### 4. The preview

4.1 One row per deck: name, source, commander and partner, cards per zone, folder, rows with a source printing, unresolved names, duplicates, and an include switch, on by default.
4.2 **The loss table.** For each field, whether the files carried it and whether the product keeps it, with counts: "Language: 312 cards carried, not stored yet". The fields are those of the table below.
4.3 Nothing is written before Confirm. The same files give the same preview.
4.4 A deck imported before shows "unchanged", "changed since last import" or "also edited here" (section 7).
4.5 Totals: decks to create, update and skip; unresolved cards; folders to create.
4.6 The table works by keyboard, its summary is announced in a polite live region, and no status relies on colour alone ([I-49](i49-colour-vision-and-low-vision-display.md)).

| Field                       | Files that carry it                                                                                        | Kept on `dev`                                | Kept once                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| Printing                    | Moxfield, Archidekt, ManaBox, Deckbox, Delver Lens, Dragon Shield, MTGGoldfish; TappedOut gives a set only | `DeckCard.scryfallId`, but importers drop it | Slice 11, through I-57's resolver             |
| Finish                      | Moxfield `*F*` and Foil, Archidekt `modifier` (API), MTGGoldfish `FOIL_ETCHED`, Dragon Shield `Printing`   | Collection foil only; decks none             | I-37 slice 12                                 |
| Language                    | Collection CSVs of Moxfield, ManaBox, Deckbox, Dragon Shield, Delver Lens, TappedOut                       | None                                         | I-37 slice 12 for decks; I-26 for collections |
| Condition                   | Collection CSVs                                                                                            | `CollectionCard.condition`                   | Mapping only                                  |
| Categories                  | Archidekt, with the in-deck flag; TappedOut's board column                                                 | 16 built-in categories and three zones       | I-37 slice 13                                 |
| Tags                        | Moxfield `#tag` and `#!globaltag`; Moxfield and Archidekt CSV tags                                         | Deck-level tags only                         | I-37 slices 13 and 14                         |
| Sideboard, maybeboard       | Moxfield boards, Archidekt categories, TappedOut board, Deckstats `SB:`                                    | `DeckCard.zone`                              | Now                                           |
| Primer                      | No export read; Archidekt's API carries `description` [9]                                                  | 2,000 characters                             | I-08's limit decision                         |
| Folders, binders            | Zip directories; ManaBox binder; Dragon Shield `Folder Name`; Archidekt `parentFolder` (API)               | `DeckFolder` for decks                       | I-43 slice 1 for physical places              |
| Card notes                  | Archidekt `notes` (API)                                                                                    | Column exists; saving waits for I-01         | I-01                                          |
| Trade counts, alter, signed | Moxfield, Deckbox, Dragon Shield, TappedOut                                                                | None                                         | I-44, and I-06's proxy state                  |

### 5. Categories to zones

5.1 Each source has a mapping table in code, versioned and shown in the preview: Moxfield boards `commanders`, `mainboard`, `companions`, `sideboard`, `maybeboard`; Archidekt's premier "Commander" category and its categories; TappedOut's board column; Deckstats' `SB:` prefix; the heading names I-10's parser accepts.
5.2 A category the source marks as outside the deck, such as Archidekt's `includedInDeck: false`, goes to Considering, or to Sideboard when it is named so. This matches `archidektZone` today.
5.3 Any other category sends its cards to the main deck. Its name becomes a custom category once I-37 slice 13 ships; before that, the loss table counts it. A category never creates a zone.
5.4 The player can remap a category for the batch, for example "Maybe" to Considering. The mapping is saved per account and source for the next run.
5.5 A deck with no command zone and no "Commander" category imports without a commander and is flagged in the preview and the report.

### 6. Printings, finish and language

6.1 The source printing is step 2 of [I-57 requirement 2.1](i57-printing-preferences-everywhere.md#2-precedence-and-fallback): a Scryfall ID first, then set and collector number. A set code alone lets the player's rule choose within that set, with a notice.
6.2 A printing that does not resolve falls back to I-57's rule and is counted in the report. A set code that Scryfall does not know is reported, never mapped by guess.
6.3 Owned-first never replaces a source printing.
6.4 Finish and language are stored once I-37 slice 12 ships. Until then the loss table counts them. Neither is ever guessed.

### 7. Idempotency and re-import

7.1 Each imported deck keeps a link: account, source, source key, deck, content hash and last batch.
7.2 The source key is the source's deck ID where the file holds one, else a fingerprint of the normalized file name, deck name and commander. The preview says how each deck was matched. A deck renamed on the source is offered as new, with the closest earlier import named so the player can match it by hand.
7.3 A deck whose content hash is unchanged is skipped as "unchanged".
7.4 A deck changed on the source but not here is offered as an update: a diff of additions, removals, quantities, zones and printings, applied in one transaction against the deck version previewed. A deck changed since gets 409 and a fresh preview.
7.5 A deck changed on both sides is a conflict. The choices are keep mine, take theirs after an automatic snapshot, or import as a copy. The default is keep mine.
7.6 The commit takes an idempotency key, so a double click or a retry writes nothing twice.
7.7 Deleting an imported deck removes its link; the next run offers it as new.

### 8. The commit

8.1 The server writes each deck, with all its rows, in one transaction. No migration writes card by card from the browser.
8.2 One deck failing leaves the others written. The report names it with its reason, and "Retry failed decks" re-runs only those.
8.3 Progress is shown. Closing the tab does not stop the commit, and the report waits on `/decks`.
8.4 Every new deck is private, has origin `migration`, and gets an automatic snapshot "Imported from Archidekt on 2026-11-10".
8.5 Folders are created by name or reused, since `DeckFolder` is unique per account and name.
8.6 Nothing is published. Publishing follows I-08, and the index follows [I-29 requirement 2.2](i29-cross-site-deck-index.md#2-sources-phased-by-verdict).

### 9. Primers and notes

9.1 A primer arrives only from a file or a per-deck field the player fills in the preview. It is the player's own text and stays private.
9.2 A primer over I-08's limit is never cut. The deck imports without it, and the report holds the full text with a copy action.
9.3 Primers render through the existing safe Markdown path; raw HTML is stripped.
9.4 Card notes are kept once I-01 can save them; until then the loss table counts them.

### 10. Collections and want lists

10.1 Collection files go through I-26's mapping, printing resolution, ambiguity report, atomic commit and reconciliation. I-62 adds only routing, the shared preview and the shared report.
10.2 Binder and folder names from ManaBox, Dragon Shield and Moxfield travel with the rows. Once I-43 slice 1 ships, the preview offers to create storage places from them.
10.3 Want lists go to I-56's wanted list, through its paste path, once I-56 slice 1 ships.

### 11. The report

11.1 After the commit: decks created, updated, skipped and failed; cards per printing source as in [I-57 requirement 3.5](i57-printing-preferences-everywhere.md#3-every-entry-point); unresolved names per deck; the loss table with final counts; folders created; a link to each deck.
11.2 It downloads as CSV and JSON. CSV cells are escaped like the existing exports.
11.3 It is kept for 30 days, then deleted, and appears in I-38's export while it exists.
11.4 It suggests the next fixes, such as decks without a commander and unresolved names. It carries no upsell.
11.5 _Added 2026-11-11:_ for an imported deck with open slots or cards the player does not own, the report links [I-76](i76-complete-this-deck-from-my-collection.md)'s proposal route and slice 10's owned substitute. No new slice here.

### 12. Measurement through I-39

12.1 **Amendments proposed to I-39.** `Deck.origin` gains `migration`. One event joins the allowlist of [requirement 8.2](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation): `migration_finished`, written at commit or when a staged batch expires, with `source` (enum), `outcome` (committed, partial, abandoned, failed) and integers `decks_found`, `decks_created`, `decks_updated`, `decks_skipped`, `cards_unresolved`. A `DailyCounter` name, `migration_guide_opened`, counts guide views without an identifier (I-39 8.5). No file, deck or card name is recorded (I-39 8.3).
12.2 **Primary metric: decks imported per new account.** For accounts created in an ISO week, the number of decks with origin `migration`, `import_text` or `import_url` created in the first 7 days. Reported as the share with at least one, the share with at least five, and the median among importers, with n and 95% intervals ([I-39 11.9](i39-first-run-activation-and-measurement.md#11-metrics-defined-to-be-computed)).
12.3 **Funnel by source:** guide opened (the counter of 12.1), batch staged, committed, abandoned.
12.4 **Activation stays honest.** A migrated deck is often full-size on arrival, so the owner view reports [activation](i39-first-run-activation-and-measurement.md#11-metrics-defined-to-be-computed) separately for accounts whose first full-size deck came from a migration. Such a deck counts as game-ready only after a playtest, export or publish here.
12.5 Week-4 retention of migrating accounts sits beside other new accounts, labelled as a correlation. A claim that migration causes retention goes through I-39's experiment rules.

### 13. Free, never paid

13.1 Every part of I-62 is free on every plan, with no cap on decks, files or re-runs beyond the abuse limits of 3.1.
13.2 **Why.** [I-30 requirement 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line) keeps importing free, and 1.2 says the player's own data is never the paid lever. A switch is decided at the moment of moving; a price there rebuilds the cost I-62 exists to remove. I-38 makes the export out free ([requirement 7.3](i38-trust-safety-and-user-rights.md#7-full-data-export)); the way in follows the same rule. GDPR Art. 20 treats portability as the data subject's right [21] (research, not legal advice). Neither ManaBox's nor Archidekt's import page mentions a charge [7][14].
13.3 **What it does for I-30.** It fills the decks and collection that paid tools work on, such as I-31's Deck Lab and I-16's cross-deck planning. Conversion happens there, never at the door.

## Data model / API

```
ImportBatch       id, userId → User (cascade), status (staged|committing|done|partial|failed|expired),
                  sources String[], bundle Json, mapping Json, idempotencyKey @unique,
                  createdAt, expiresAt, committedAt?, report Json?, reportExpiresAt?
ImportedDeckLink  id, userId → User (cascade), deckId → Deck (cascade), source, sourceKey,
                  matchedBy (source_id|fingerprint), contentHash, firstBatchId, lastBatchId, importedAt
                  @@unique([userId, source, sourceKey])
ImportMapping     userId → User (cascade), source, category, target   @@id([userId, source, category])
Deck            + origin value `migration` (I-39's column)
```

- `src/lib/migration/bundle.ts` holds the Zod schema of the normalized bundle: decks with rows (name, quantity, zone, command flags, source printing, finish, language, category, tags, note), folders, primers, and collection and want rows.
- `src/lib/migration/sources/<source>.ts` holds one pure adapter per source, `detect(fileName, head)` and `parse(text)`, with no I/O. `zone-map.ts`, `fingerprint.ts` and `losses.ts` are pure too.
- `POST /api/migrations` validates the bundle, resolves names and printings through the server's Scryfall cache, stores the staged batch and returns the preview. It is limited per account.
- `GET /api/migrations/[id]` returns the preview or the report. `PATCH` sets include switches, mappings and conflict choices.
- `POST /api/migrations/[id]/commit` takes an `Idempotency-Key`; `POST /api/migrations/[id]/retry` re-runs failed decks.

## Non-goals

- Scraping, logging in to another site, holding its credentials, or a browser extension that reads its pages.
- Continuous sync or scheduled re-import. Every run is started by the player, as I-26 requires.
- Writing to, or deleting from, the other site.
- Importing other players' public decks in bulk; I-29 decides link-outs.
- Comments, likes, views, followers, playtest history or price history from another site.
- Reading binary backups such as `.dlens` files in the first release (open question 5).
- MTG Arena or Magic Online collections.
- A paid migration, a concierge fee or a plan-based cap.

## Testing strategy

- **Fixtures per source.** Real exports from accounts the owner controls, anonymized and committed under `src/lib/migration/__fixtures__/<source>/<date>/`, each with its expected bundle. A fixture older than 180 days raises a reminder to re-export.
- **Solitary:** each adapter's detection and parsing; Dragon Shield's `sep=` line and junk last row; both MTGGoldfish headers; Deckbox's full set names; Delver Lens `//` names; the zone map; fingerprint stability; a content hash independent of row order; the loss counts.
- **Source policy:** a test fails when a module under `src/lib/migration/` imports `@/lib/http` or calls `fetch`; adapter tests run with the network disabled.
- **Sociable API:** stage, preview and commit 20 decks in 20 transactions; the same key commits nothing twice; an unchanged re-run writes nothing; a changed deck yields a diff; a conflict follows 7.5; one failing deck leaves the others.
- **Security:** a zip with `..` paths, a high expansion ratio, 1,001 files and an oversized CSV are refused with reasons; primer HTML is stripped.
- **Events:** `migration_finished` accepts its enums and integers and rejects names and URLs.
- **E2E:** 20 Archidekt text files in a zip with two directories become 20 private decks in two folders, with a report of losses; a second run reports "20 unchanged".

## Delivery slices

| #   | Slice                                                                                                           | Depends on                                                   |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 0   | Source register: one dated row per source (files, terms, robots.txt, verdict); guide text in English and French | — (the owner sends the letters of open questions 1, 2 and 6) |
| 1   | Bundle schema and the text adapter: many `.txt` files at once, keeping `(SET) number`, `*F*` and `#tag` as data | — (coordinate the parser change with I-57 slice 6)           |
| 2   | Server write of one deck with all its rows in one transaction                                                   | —                                                            |
| 3   | `ImportBatch`, `ImportedDeckLink`, staging route, fingerprints, content hashes, 24-hour expiry                  | 1                                                            |
| 4   | Preview: every deck, include switches, zones, commanders, unresolved names, loss table                          | 3                                                            |
| 5   | Commit, retry, report page and download; origin `migration`; automatic snapshot                                 | 2, 4                                                         |
| 6   | Re-import: unchanged, update diff, conflict choices, 409                                                        | 5                                                            |
| 7   | Archidekt files and the mapping editor, saved per source                                                        | 4                                                            |
| 8   | Moxfield files: boards and tags; the profile panel links to the guide                                           | 4                                                            |
| 9   | TappedOut, Deckstats, MTGGoldfish and Scryfall deck files                                                       | 4                                                            |
| 10  | Zip upload, with folders from its directories                                                                   | 1                                                            |
| 11  | Source printings through I-57's resolver                                                                        | 5; I-57 slice 3                                              |
| 12  | Finish and language kept                                                                                        | 11; I-37 slice 12                                            |
| 13  | Categories as custom categories; tags as deck and global tags                                                   | 7; I-37 slices 13 and 14                                     |
| 14  | Primer field per deck, within I-08's limit                                                                      | 4; I-08's limit for longer primers                           |
| 15  | Collection files in the same flow                                                                               | 4; I-26 slices 3 and 4                                       |
| 16  | Want lists into the wanted list                                                                                 | 4; I-56 slice 1                                              |
| 17  | `migration_finished`, the origin split and the primary metric in the owner view                                 | 5; I-39 slices 10 and 12                                     |
| 18  | Entry points: empty `/decks`, I-39's first-run panel, settings                                                  | 5; I-39 slice 5 for the panel                                |
| 19  | API route for a source that grants written permission                                                           | **Blocked** on open question 1 or 2                          |

Slices 0, 1 and 2 can start now and in parallel. Slices 1 to 5 make a working move-in. The move-in is not announced until slice 11 keeps printings, because losing them is what a collector notices first.

## Open questions

1. **Archidekt.** Its API carries everything a migration needs [9], and its terms forbid automated requests and access "to build a similar or competitive website" [5]. Should the owner ask Archidekt LLC, the party its terms name, in writing whether a player-triggered read of the player's own decks is allowed? Archidekt sits under Space Cow Media ([competitive landscape](../competitive-landscape.md#how-the-references-grew)), so the letter can go to both. The same letter covers I-10's single-deck Archidekt fetch and I-29's partnership track. Until an answer, files only.
2. **Moxfield.** It has no bulk export [1] and refuses honest requests. Should the owner ask Moxfield for a bulk export or an authorised read, alongside I-10's open decision (roadmap line 1139 at `77885e4`)? Separately, before slice 8, an export from the owner's own account must confirm that Moxfield's text carries `(SET) number`, `*F*`, `#tag` and its boards; this was not verifiable on 2026-11-10.
3. **For the lawyer (research, not legal advice; add to I-30 requirement 7.2).** (a) Does accepting a file the player exported from a site whose terms forbid copying, or access "to build a similar or competitive website" [5], expose the product, given that such terms bind the account holder ([Ryanair, C-30/14](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62014CJ0030) [22])? (b) Does GDPR Art. 20 [21] support the player's move, and does it cover a primer that quotes others? (c) May guides name competitors and describe their export menus?
4. **Primers over 2,000 characters.** Decide with I-08's open limit.
5. **Binary backups.** Accept Delver Lens `.dlens` files, which means parsing an untrusted SQLite file in the browser [17], or CSV only?
6. **Scryfall decks.** What does its deck export carry, and would Scryfall document a read of a player's own decks? Its API reference has no deck section [20].
7. **Activation.** Should a migrated deck count toward I-39's activation at all, or only once played or exported here (12.4)?

## Sources

1. Moxfield public issue tracker on GitHub, read 2026-11-10: [#54](https://github.com/moxfield/moxfield-public/issues/54) "Export all decks at once", opened 2023-09-30, open; [#60](https://github.com/moxfield/moxfield-public/issues/60), Delver Lens names, 2024-05-12, open; [#96](https://github.com/moxfield/moxfield-public/issues/96), 2025-05-08, closed 2026-06-30; [#142](https://github.com/moxfield/moxfield-public/issues/142), 2025-10-21, closed 2026-08-06.
2. Codidact, [post 294785](https://software.codidact.com/posts/294785), quoting Moxfield's help on the collection CSV header; search summary, 2026-11-10. Moxfield's help answered automated requests with 403 (I-29).
3. transmute-mtg, [1.0.0 on PyPI](https://pypi.org/project/transmute-mtg/), released 2026-01-29: headers of 16 collection formats.
4. Scrytics, [How to Import and Export Your Magic Collection](https://scrytics.com/blog/mtg-collection-import-export), shown as 2026-05-17 and last updated 2026-04-19, read 2026-11-10.
5. Archidekt, [Terms of Service](https://archidekt.com/terms), effective 2018-09-07, read 2026-11-10.
6. Archidekt, [FAQ](https://archidekt.com/faq), undated, read 2026-11-10.
7. Archidekt, [Development Update – Collection Importer](https://archidekt.com/news/5891613), shown as two years old on 2026-11-10.
8. Archidekt, [robots.txt](https://archidekt.com/robots.txt), read 2026-11-10.
9. Archidekt public API, [`/api/decks/v3/?ownerUsername=Archidekt&pageSize=2`](https://archidekt.com/api/decks/v3/?ownerUsername=Archidekt&pageSize=2) and [deck 28130431](https://archidekt.com/api/decks/28130431/), one request each on 2026-11-10 with an honest User-Agent, read for field names only.
10. TappedOut, [robots.txt](https://tappedout.net/robots.txt), read 2026-11-10; forum thread [CSV](https://tappedout.net/mtg-forum/tappedout/csv), 2025-04-27 to 2025-04-29.
11. TappedOut forum, [Importing to TappedOut via CSV](https://tappedout.net/mtg-forum/tappedout/importing-to-tappedout-via-csv); search summary, 2026-11-10.
12. Deckstats, [robots.txt](https://deckstats.net/robots.txt), answered HTTP 403 on 2026-11-10.
13. MTGGoldfish, [import help](https://www.mtggoldfish.com/help/import), answered HTTP 403 on 2026-11-10; Draftsim, [MTG Arena import guide](https://draftsim.com/mtg-arena-import-deck), updated 2025-12-31, search summary.
14. ManaBox, [Import and export decks](https://manabox.app/guides/decks/import-export/) and [collection import and export](https://manabox.app/guides/collection/import-export/), undated, read 2026-11-10.
15. Deckbox forum, [Exporting Inventory List](https://deckbox.org/forum/viewtopic.php?id=13731), 2015; search summary, 2026-11-10.
16. MTG Stand, [collection import guide](https://mtgstand.com/collection-import-guide), undated (footer © 2020–2026), read 2026-11-10.
17. delverlens-tools, [README](https://gh.r-mj.com/StudioEtrange/delverlens-tools), a GitHub mirror; search summary, 2026-11-10.
18. KarmaKamikaze, [DragonShield-to-Moxfield](https://github.com/KarmaKamikaze/DragonShield-to-Moxfield) `convert.py`, last push 2023-09-14, read through the GitHub API on 2026-11-10.
19. EDHREC, [How to use EDHREC](https://edhrec.com/guides/how-to-use-edhrec), 2025-06-03, read for I-39 on 2026-11-09; a search on 2026-11-10 found no personal deck storage.
20. Scryfall, [About Scryfall deck limits](https://scryfall.com/docs/faqs/about-scryfall-deck-limits-15), [API reference](https://scryfall.com/docs/api) and [robots.txt](https://scryfall.com/robots.txt), read 2026-11-10.
21. Regulation (EU) 2016/679 (GDPR), [Art. 20](https://eur-lex.europa.eu/eli/reg/2016/679/oj), right to data portability.
22. CJEU, [Ryanair, C-30/14](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62014CJ0030), 2015-01-15.
23. Architrice, [on PyPI](https://pypi.org/project/architrice): "only your public decks can be seen and downloaded"; search summary, 2026-11-10.
24. TableCommander, [Import MTG Decks](https://tablecommander.com/import-mtg-decks): says Archidekt's text export includes category headers; search summary, 2026-11-10.
25. dylan, [Pile](https://github.com/dylan/Pile), a sample labelled as a Deckstats TXT export with `SB:` lines; search summary, 2026-11-10.
