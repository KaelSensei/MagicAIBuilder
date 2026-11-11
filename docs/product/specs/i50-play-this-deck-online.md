# I-50: Play This Deck Online

> **Initiative:** I-50, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0–8; Later for slices 9–11; slice 12 blocked on a partner agreement · **Written 2026-11-10**
> **Research:** dated notes of 2026-11-10 on each client's import format, read in the client's own source code where it is public, on platform availability in Scryfall's data, on competitor export menus and on Scryfall's image rules. They are not committed, so every external fact below cites a numbered entry in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** exports aimed at places where Commander is played online (Tabletop Simulator, Cockatrice, XMage, Forge, Magic Online, MTG Arena Brawl, and browser and webcam tables that take pasted text); the play-readiness of the shipped MTGO and Arena exporters; per-platform card availability and naming; the "Play online" panel; export by viewers of a public deck; the table view, the printable decklist and the deck check link. **Does not own:** import and the other text exports and their round trip ([I-10](i10-interoperability-and-integrations.md)); the offline cache ([I-19](i19-offline-game-night-viewing.md)); the screen-reader export ([I-24](i24-decks-a-screen-reader-can-play-from.md)); the public projection of a deck and embeds ([I-36](i36-creator-and-embed-toolkit.md) slice 1); the playtester (I-07); Rule 0 sheets (I-15); the game log ([I-35](i35-pod-game-log.md)); store check-in ([I-41](i41-store-commander-nights.md)); Discord ([I-46](i46-discord-and-chat-integrations.md)); the full account export ([I-38](i38-trust-safety-and-user-rights.md)); the canonical deck hash ([I-29](i29-cross-site-deck-index.md) requirement 5.1); prices and gating ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

A deck built here is usually played somewhere else. On a weeknight that place is often online: a desktop client such as Cockatrice or XMage, a Tabletop Simulator table, a browser table such as Untap.in, a Wizards client, or a webcam call where four people play paper cards.

Each of those places reads a different file and has its own rules for the commander, the companion and the sideboard. A wrong guess fails late, in someone else's software. The shipped MTGO export, for example, puts the commander in the main deck and writes `CatID="0"` for every card. XMage, which reads that file, rejects such a Commander deck.

This initiative makes "play this deck online" a deterministic, tested contract per destination. Before the player copies or downloads, it states what the destination lacks or will refuse. Exports stay free. Webcam play needs no file, so it gets a readable table view, a printable list and a frozen "deck check" link that opponents can open.

## What the market does

**Where Commander is played online** (read 2026-11-10 unless dated otherwise):

| Destination        | Kind                             | Cost and seats [20]              | How a deck gets in                                                                                                                                                                                                                            |
| ------------------ | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabletop Simulator | Steam sandbox                    | About 20 USD; up to 10           | A JSON saved object: `ObjectStates`, a `Deck` with `CustomDeck` entries holding `FaceURL` and `BackURL`, cards in `ContainedObjects` [6][7]. Converters write one Scryfall image URL per card [9]. The scripted in-game loader is removed [8] |
| Cockatrice         | Desktop client, open source      | Not in [20]                      | `.cod` XML or pasted text. URL import from Archidekt, Deckstats, ManaBox, Moxfield and TappedOut in the 2026-11-08 development build [11]. Release 3.1.2 shipped 2026-10-31 [10]                                                              |
| XMage              | Desktop client with rules engine | Free; up to 10                   | `.dck`, `.dek`, Arena text and others. Commander validation requires the commander or commanders and at most one companion in the sideboard, and nothing else there [12]                                                                      |
| Forge              | Desktop client with rules engine | Not in [20]                      | `.dck` with `[metadata]`, `[Commander]`, `[Main]` and `[Sideboard]` sections; the set code on a card line is optional [13]                                                                                                                    |
| Magic Online       | Wizards client                   | Paid economy; 4                  | `.dek` XML, one `Cards` element per card with `CatID`, `Quantity`, `Sideboard` and `Name`. Scryfall's `mtgo_id` is that Catalog ID [3][12]                                                                                                    |
| MTG Arena, Brawl   | Wizards client                   | Not in [20]                      | Text with `Commander`, `Companion`, `Deck` and `Sideboard` headings [15]. Brawl: 100 cards, 2 players, 25 life, no sideboard, commander "from a set currently on Arena" [14]                                                                  |
| Untap.in           | Browser table                    | Free; about 5 USD a month for 6  | "import a list from plain text or by URL" [18]; formats not documented on the page                                                                                                                                                            |
| TableCommander     | Browser table                    | Free plus a paid tier; 6 if paid | Archidekt URLs; pasted Moxfield, Archidekt, MTGO and TappedOut text with `Commander`, `Deck`, `Sideboard`, `Companion` headings and optional `(SET) 123`. Moxfield links do not work [17]                                                     |
| SpellTable         | Webcam, run by Wizards           | Free; 4                          | Paper cards. No decklist import [21]                                                                                                                                                                                                          |
| Convoke            | Webcam                           | Free; up to 8                    | Decklist import, "share deck with other player(s)", the Commander bracket shown in game [21]. Imports DeckCheck decks as a partner [22]                                                                                                       |

**What deckbuilders export for online play.** Moxfield's own wiki lists "exporting to Arena and MTGO formats" (2020-10-14); its help pages refused an automated request on 2026-11-10, so the current menu was not read [23]. Archidekt's FAQ documents a cart export, deck images and a playtester on any deck, "including those you don't own", and lists no client format [24]. TappedOut copies an Arena list with set codes (forum, 2024-02-19) [26], and its FAQ answers "Can I play with others?" with "check out MTGO" [25]. mtg.wtf offers MTGO `.dek`, XMage `.dck`, Cockatrice `.cod`, two Arena-style text variants and CSV [27]. Deckstats refused the request [28]. EDHREC was not read: [I-29](i29-cross-site-deck-index.md) records that its terms forbid automated queries. No site read offers a Tabletop Simulator export. Third-party converters fill that gap [9], and Draftsim's guide (updated 2026-01-06) still routes Tabletop Simulator players through Frogtown [19].

**Platform coverage, computed from Scryfall on 2026-11-10** [5]: of 32,643 Commander-legal cards, 15,668 (48%) have an Arena printing and 31,312 (96%) a Magic Online one. Arena also has 855 Alchemy cards, which are legal in Brawl and not in Commander. An Arena export that does not flag missing cards is therefore likely to fail for many Commander decks (an inference, not a measurement).

**Demand.** Reddit refused automated access on 2026-11-10 [28], so posts on r/EDH, r/Cockatrice and r/magicTCG could not be read or dated for this spec. The evidence found is on the supply side: ten online tables in one comparison [20], Cockatrice adding URL import for five deckbuilders [11], TableCommander documenting a Moxfield workaround [17], several Tabletop Simulator converters [9], and Convoke importing DeckCheck decks [22]. I-36 quotes an r/EDH comment (October 2026) choosing a deckbuilder because it is "easier to frame in OBS for Spelltable" ([I-36](i36-creator-and-embed-toolkit.md)). This is evidence of competitor investment, not measured demand. Requirement 5.6 measures it.

**The gap.** No deckbuilder read builds a Tabletop Simulator object, places the command zone where each client's own validator expects it, or tells the player before export which cards the platform lacks. MagicAIBuilder's MTGO and Arena exports do none of these.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **Eight text exporters** live in `src/lib/deck/export.ts` (238 lines): plain text, Moxfield, Arena, MTGO, TappedOut, Archidekt, MTGGoldfish and EDHREC. Every card line comes from one helper, `cardLine`, which writes `quantity name` and nothing else.
- **Arena** (`exportArena`): its comment promises "set/number if available"; it writes neither. Commander and partner go under `Commander`, and the companion is copied into `Sideboard` when absent (`export-arena-zones.test.ts`). It checks neither Arena availability nor Brawl legality.
- **MTGO** (`exportMTGO`): every card has `CatID="0"`. Commander and partner are written with `Sideboard="false"`, the companion with `Sideboard="true"`, and Considering is skipped. Names are written as stored (`Fire // Ice`). XMage's `.dek` reader ignores `CatID`, converts MTGO's single-slash split names (`Refuse/Cooperate`), and then rejects a Commander deck whose sideboard does not hold its commanders. Without a companion that sideboard is empty, and with one, XMage takes the companion as the commander [12].
- **TappedOut** (`exportTappedOut`) writes every entry of `deck.cards`, so sideboard and Considering cards enter its main list unmarked. This is an I-10 defect; slice 0's fixtures catch it.
- **Only the owner can export.** `ExportModal.tsx` opens from the builder. `PublicDeckView` and `ShareDeckView` offer copy-link and fork, not export. No ManaBox exporter exists, although I-10's "Already shipped" list names ManaBox; the roadmap entry needs correcting.
- **No printing data at export time.** `DeckCard` (`prisma/schema.prisma`, `src/lib/deck/types.ts`) stores `scryfallId`, Scryfall's full `name` (`src/lib/deck/store-card-faces.ts` splits it on `//`), `imageUri`, `layout` and `cardFaces`. It has no set code, collector number, Oracle ID or artist. `ScryfallCard` (`src/lib/scryfall/types.ts`) types `set`, `artist`, `oracle_id` and `legalities.brawl`, but not `collector_number`, `games`, `arena_id` or `mtgo_id`. No code reads Scryfall set objects, which carry `arena_code` and `mtgo_code` [4].
- **Images.** `src/app/api/proxy-card-image/route.ts` streams `cards.scryfall.io` images to the browser for print and PDF, because the CDN blocks cross-origin `fetch`. A Tabletop Simulator export does not need it.
- **Contracts.** `src/lib/deck/fixtures/` holds `moxfield-v1`, `plain-text-v1` and `plain-text-roundtrip-v1`, each with a version string. That is the pattern slice 0 extends to every target.
- **Webcam play.** `DeckSnapshot` stores `cardList`, `commander` and `cardCount`, with no hash. Share links (`Deck.shareToken`, `/share/[token]`, `noindex`) show the live deck. There is no table view, printable decklist or check page, and `package.json` has no QR library.

## Functional requirements

### 1. The export contract

1.1 Each exporter is a pure function of an `ExportDeck` and options. It returns the content, a file name, a MIME type and a list of typed notices. Exporters make no network request; card data is resolved before they run (requirement 2).
1.2 **Nothing silent.** A card dropped, moved, renamed, given another printing or left without one produces a notice. Notices are shown before the copy or download. The exported command-zone and main-deck counts equal the deck's counts minus the dropped cards the notices list.
1.3 Considering cards never enter a playable zone in any target. Sideboard cards enter only where the target's sideboard does not double as the command zone (table in requirement 3).
1.4 Each target has a versioned fixture, `<target>/v1`, with an input deck and the exact expected output. Its header records the client version and date on which a person last imported it successfully. An unverified target is labelled so in the panel (5.5), as I-29 requirement 3.4 does for link templates.
1.5 The same deck and options produce byte-identical output. XML is escaped with the existing `escapeXmlAttribute`, JSON is valid, and text is UTF-8.
1.6 _Added 2026-11-11:_ an export scoped to an [I-79](i79-table-sets.md) table set runs each seat's deck through this contract, with each seat's notices shown before the download.

### 2. Card identity across platforms

2.1 For each card, the export context holds, from the Scryfall card object of its stored `scryfallId`: set code, collector number, `games`, `arena_id`, `mtgo_id`, `oracle_id`, `layout`, face names, face image URIs, `image_status`, `artist` and `legalities.brawl` [3]. Set objects supply `arena_code` and `mtgo_code`; Dominaria is `dom` on Scryfall and `dar` on both Arena and Magic Online [4].
2.2 The context is filled on the server from the existing card cache and Scryfall's API, with the honest User-Agent and Accept headers Scryfall requires [1], and never from client-written data (I-05 H3). Set codes are cached for at least 24 hours.
2.3 **Platform printing.** For Arena and Magic Online, the stored printing is used when that platform lists it in `games`. Otherwise the newest printing the platform has is used, with a `printingSubstituted` notice. With none, the card gets a `notOnPlatform` notice and is left out unless the player opts to keep the line.
2.4 **No substitution of a different card.** A missing card is never replaced by an Alchemy version, a similar card or a guess, and no LLM resolves names or legality ([strategic boundaries](../roadmap.md#strategic-boundaries)).
2.5 **Names.** A name rule per target maps Scryfall's full name by layout: split, adventure, flip, transform, modal double-faced and meld. Rules taken from a client's source code are marked verified. The rest are verified by importing the layout fixture into that client (testing strategy).

### 3. Destinations

| Target             | File              | Commander, partner or Background                              | Companion                | Sideboard; Considering                                                       | Printing                                                | Basis                                 |
| ------------------ | ----------------- | ------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------- |
| Cockatrice         | `.cod` XML        | In `main`; the first commander also as `bannerCard`           | `side`                   | `side`; `maybeboard` only if ticked                                          | `setShortName`, `collectorNumber`, `uuid` = Scryfall ID | Cockatrice's own Moxfield import [10] |
| XMage              | `.dck`            | `SB:` lines                                                   | `SB:` line, at most one  | Both dropped with a notice                                                   | `[SET:NUM]`; XMage falls back to the name               | Validator and importer [12]           |
| Forge              | `.dck`            | `[Commander]`                                                 | `[Sideboard]`, to verify | `[Sideboard]`; Considering dropped                                           | Names only until edition codes are checked              | Serializer and card parser [13]       |
| Magic Online       | `.dek` XML        | Decided by open question 1; XMage requires `Sideboard="true"` | `Sideboard="true"`       | Sideboard dropped with a notice if commanders sit there; Considering dropped | `CatID` = `mtgo_id` of an MTGO printing                 | Format [12]; client unverified        |
| MTG Arena Brawl    | Text, clipboard   | `Commander` section                                           | `Companion`, to verify   | Both dropped: Brawl has no sideboard [14]                                    | `(CODE) NUM` with `arena_code`, or neither              | [14][15][16]                          |
| Table text         | Text, clipboard   | `Commander` section, both commanders                          | `Companion` section      | Sideboard only if ticked; Considering never                                  | Optional `(SET) NUM`                                    | TableCommander's headings [17]        |
| Tabletop Simulator | JSON saved object | Separate face-up object                                       | Separate object          | Separate face-down piles only if ticked                                      | Image of the stored printing                            | [6][7][9]                             |

3.1 **Cockatrice.** The file follows `cockatrice_deck` version 1 with `deckname`, `comments` (empty unless the owner includes the description), `bannerCard` and zones. Set codes are Scryfall's, uppercased as Cockatrice's own importer does [10].
3.2 **XMage.** `NAME:` carries the deck name. The sideboard holds only the commander, partner or Background and the companion, so XMage's validator sees 1 to 3 cards [12]. Other sideboard and Considering cards are dropped with a notice.
3.3 **Forge.** `[metadata]` holds `Name=`. Card lines are `N Name`. `|SET` is added only after a fixture shows Forge accepts Scryfall's codes for the deck's sets [13].
3.4 **Magic Online.** `CatID` carries the `mtgo_id` of the chosen printing; MTGO split cards are written `A/B`, as XMage's reader expects [12]. Command-zone placement waits for open question 1. Until it is answered, the MTGO fixture is labelled unverified (1.4).
3.5 **Arena Brawl.** Card lines carry both the Arena set code and the collector number without leading zeros, or neither: one guide says set lines need both, another that both are optional [15][16]. The export lists cards with no Arena printing and cards not legal in Brawl (`legalities.brawl`, a deterministic check). It shows the share of the deck available on Arena before export.
3.6 **Table text** is the variant for Untap.in, TableCommander and other paste boxes. Both commanders go under `Commander` because TableCommander names no `Partner` heading [17]. Untap.in's format is unverified [18], so its row shows as untested.
3.7 The existing Moxfield, Archidekt, TappedOut, MTGGoldfish, EDHREC and plain-text exports stay I-10's. Slice 0 only moves them under the contract in requirement 1.

### 4. Tabletop Simulator and card images

4.1 Each card face's `FaceURL` is the Scryfall image URI of the deck's stored printing, exactly as Scryfall returns it: `large` JPG (672 × 936) by default, `png` (744 × 1040) as an option [2]. Images are never downloaded, re-encoded, assembled into sheets, uploaded to another host or routed through `/api/proxy-card-image`.
4.2 Only full card images are used, never `art_crop`, so the artist and copyright lines stay visible, uncropped, undistorted and unmarked, as Scryfall requires [1].
4.3 Each card's `Description` carries the artist's name from Scryfall and the product's Fan Content notice. The `Nickname` is the card name.
4.4 Two-faced cards (transform, modal double-faced, meld) use the object's second state for the back face, as tts-deckconverter does for transform and meld cards [9]. Split, adventure and flip cards have one image.
4.5 **Card back.** `BackURL` points to a neutral back drawn for the product and served from its own domain, or to a URL the player supplies. The Magic card back is not used unless open question 3 clears it.
4.6 The saved object holds a command-zone object, the library as one face-down deck, and a token deck built from the deck's token checklist (I-01). Sideboard and Considering piles are added only when ticked.
4.7 A card whose `image_status` is `missing` or `placeholder` gets an `imageMissing` notice [2].
4.8 The panel tells the player where the file goes: the Tabletop Simulator `Saves/Saved Objects` folder [9].
4.9 _Added 2026-11-11:_ for an I-79 table set, Tabletop Simulator also gets a table save with one deck per seat, each built as in 4.1 to 4.6.

### 5. The "Play online" panel

5.1 The builder, the public deck page and the share page show a "Play online" panel with four groups: webcam tables, browser tables, desktop clients and Wizards clients. Each destination shows one dated how-to line, the notices from requirements 2 and 3, and copy or download.
5.2 A viewer of a public or shared deck can export it without forking or signing in. The export is built from I-36 slice 1's public projection, so owner notes and private fields never leave; card notes are left out of viewer exports.
5.3 Rendering the panel sends no request to any destination. Destinations appear as plain names, with no logos (open question 3).
5.4 On phones, copy uses the share sheet where the browser offers one.
5.5 A destination whose fixture is unverified shows "Not yet tested with <client>", not a success promise.
5.6 Choosing a destination records one first-party I-39 product event with the target name and `scope` (deck or set; added 2026-11-11 for I-79) and nothing else, so demand is measured rather than guessed.

### 6. Webcam play: table view, printable list and deck check

6.1 **Table view.** `/deck/[id]/table` and `/share/[token]/table` show the deck read-only for a second screen or a phone beside the webcam: commanders with their images, the main deck grouped by type with counts, a search box, and a full Scryfall image on tap. No editing control is rendered. Once I-19 ships, its cached copy opens in this view.
6.2 **Printable list.** One A4 or Letter page in black and white: deck name, commanders, companion, the main deck grouped with counts, the date, the computed bracket with its method and the declared bracket from a shared I-15 sheet, labelled apart, and a QR code with a short URL to the deck check. It has no card images. [I-24](i24-decks-a-screen-reader-can-play-from.md) slice 3 owns the screen-reader export; this page shares its grouping.
6.3 **Deck check link.** The owner creates a link that freezes the current list as a `DeckSnapshot` and shows a short list code. Its page is read-only and `noindex`, and shows the frozen list, its date, the legality verdict, Game Changers, the computed bracket with its scorer version, and the declared bracket if a sheet is shared. _Added 2026-11-11:_ the page shows [I-77](i77-a-bracket-estimate-players-can-audit.md#6-the-frozen-audit)'s stored audit of that estimate; slice 10 stores the assessment with the snapshot.
6.4 **Changed since this check.** The page compares the frozen list with the live deck and shows "Unchanged" or "Changed since this check" with counts. It lists the changed cards only when the owner turned that on, because the comparison reveals the live list.
6.5 The owner can revoke a link, after which it answers "This check was withdrawn". Deleting the deck deletes its links.
6.6 The list code derives from the canonical form in I-29 requirement 5.1: Oracle IDs, command zone, companion and main deck, sideboard excluded. Reprints and reordering therefore do not change it. Whichever of I-29 slice 2, I-35 slice 2 and slice 10 here ships first builds the shared helper, and the others reuse it.
6.7 Nothing about a game is recorded here; logging a result stays in I-35, and store check-in in I-41.

### 7. Free, and what could be paid

7.1 Every export, the panel, the table view, the printable list and deck check links are free, and need no account where the deck is public. I-30 requirement 1.1 lists exporting as always free, I-38 requirement 10.1 keeps export off every paid lever, and Scryfall forbids paywalling its data [1].
7.2 No export carries an advertisement, a referral code or a tracking parameter.
7.3 **Adjacent paid candidate, rated weak:** a recurring online pod's check board, with four players' deck checks side by side and their history across sessions. It belongs with I-15's pods and I-35's history, and I-30 decides. Competitors give the equivalent away: Convoke shows the bracket in game for free [21], and Archidekt opens its playtester on any deck [24]. Nothing in this initiative should be gated.

## Data model and API

```
ExportTarget       "cockatrice" | "xmage" | "forge" | "mtgo" | "arenaBrawl" | "tableText" | "tts" | the eight shipped text targets
CardPlatformInfo   scryfallId, oracleId, setCode, collectorNumber, games[], arenaId?, mtgoId?, arenaSetCode?, mtgoSetCode?,
                   layout, faceNames[], faceImageUris[], imageStatus, artist?, brawlLegal
ExportNotice       notOnPlatform | notLegalOnPlatform | zoneDropped | printingSubstituted | printingMissing | imageMissing | nameRewritten
                   (a discriminated union; each variant carries its cards or counts)
ExportResult       content, fileName, mimeType, notices[]
DeckCheckLink      id, deckId → Deck (cascade), snapshotId → DeckSnapshot, token (unique, ≥ 128 random bits), listCode,
                   showChanges (default false), createdAt, revokedAt?
```

Routes: a read-only route returning `CardPlatformInfo` for up to 250 Scryfall IDs, filled on the server; `POST /api/decks/[id]/checks` and `DELETE /api/decks/[id]/checks/[checkId]` for the owner; pages `/check/[token]`, `/deck/[id]/table`, `/share/[token]/table` and `/deck/[id]/print`. `src/app/robots.ts` disallows `/check/`. Exporters move to `src/lib/deck/exports/<target>.ts`, and `export.ts` re-exports them so existing imports keep working.

## Non-goals

- Hosting a table, video, matchmaking or a rules engine.
- Writing into a client's folders, uploading to the Steam Workshop, or linking an MTGO or Arena account.
- Rehosting card images, building image sheets or uploading to an image host, as converters' template modes do [9].
- Arena collection or wildcard planning ([deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)).
- Importing from these clients. Reading `.cod`, `.dck` or `.dek` is I-10's.
- Any partner integration without a signed agreement or an accepted upstream change.
- Wizards' or any platform's logos, and the Magic card back unless open question 3 clears it.

## Testing strategy

- **Fixtures (solitary):** each target's `v1` fixture matches byte for byte. One deck covers commander plus partner, commander plus Background, a companion, sideboard and Considering cards, an XML-reserved character, and one card of each layout.
- **Zone invariants (property):** for random decks, exported command plus main counts equal the deck's minus the notices' dropped counts, and no Considering card reaches a playable zone in any target.
- **Validator mirrors:** an XMage fixture has 1 to 3 sideboard entries, all from the command zone or the companion [12]. The Arena Brawl fixture has no `Sideboard` section [14]. The MTGO fixture has no `CatID="0"`.
- **Availability:** a deck with a paper-only card yields `notOnPlatform` for Arena and keeps the line only when the option is set; Dominaria cards carry `DAR` in Arena lines [4].
- **Image rule guard:** every `FaceURL` and image URL in a TTS export is on `cards.scryfall.io` and equals the stored URI; no export contains `data:`, `art_crop` or `/api/proxy-card-image`.
- **Client acceptance (manual, dated):** a person imports each fixture into the named client version and records the version and date in the fixture header (1.4). Clients without a free account, such as MTGO, stay labelled unverified until someone can do this.
- **Viewer export (sociable):** a signed-out viewer exports a public deck; the output has no owner notes; a private deck returns 404.
- **Deck check:** the snapshot does not change after the deck is edited; changed-since counts are right; card names appear only with `showChanges`; a revoked token shows the withdrawn message; the page sends `noindex`.
- **Free access:** no export, table, print or check route reads a subscription.

## Delivery slices

| #   | Slice                                                                                                                                                                                                                                           | Depends on                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 0   | Export contract: `ExportResult` with typed notices, exporters split per target, `v1` fixtures for the eight shipped formats, TappedOut Considering fix                                                                                          | —                                                                   |
| 1   | `CardPlatformInfo`: Scryfall type fields, set `arena_code` and `mtgo_code`, read-only route filled on the server, 24-hour set cache _(2026-11-10: I-67 slices 9 and 10 later switch the source to local tables; no new dependency)_             | —                                                                   |
| 2   | Name rules per target and layout, with a layout fixture per target                                                                                                                                                                              | 0                                                                   |
| 3   | Arena Brawl: Arena codes and numbers or none, not-on-Arena and Brawl-illegal notices, coverage share, no sideboard                                                                                                                              | 0, 1, 2                                                             |
| 4   | Cockatrice `.cod` and XMage `.dck`                                                                                                                                                                                                              | 0, 1, 2                                                             |
| 5   | Forge `.dck`, names only                                                                                                                                                                                                                        | 0, 2                                                                |
| 6   | MTGO `.dek` for Commander: `CatID` from `mtgo_id`, single-slash split names, command-zone placement                                                                                                                                             | 0, 1, 2; open question 1 for placement                              |
| 7   | Tabletop Simulator saved object: Scryfall URLs, two-state faces, command and token objects, own card back, image-rule guard                                                                                                                     | 0, 1, 2                                                             |
| 8   | "Play online" panel on the builder, public and share pages; table-text variant; viewer export; I-39 event                                                                                                                                       | 0; I-36 slice 1 for viewer export                                   |
| 9   | Table view for webcam play                                                                                                                                                                                                                      | —; I-19 slice 3 to open the cached copy                             |
| 10  | Deck check link: frozen snapshot, list code, `noindex` page, changed-since status, revocation, the stored bracket assessment for I-77's audit (added 2026-11-11) _(the canonical-list helper is I-29 slice 2's; one owner, decided 2026-11-10)_ | I-29 slice 2                                                        |
| 11  | Printable decklist with a QR code to the deck check                                                                                                                                                                                             | 10; QR generator shared with I-41 slice 4                           |
| 12  | Partner import into a webcam table (Convoke first) or a client's URL import (Cockatrice)                                                                                                                                                        | **Blocked** on a signed agreement or an accepted upstream change; 8 |

Slice 0 alone makes the shipped exports testable contracts, and slices 3 and 6 fix what players hit today. Slice 4 is the cheapest new destination, because both clients publish their parsers.

## Open questions

- **1. Where does Magic Online want the commander?** XMage reads `.dek` files and requires the commander in the sideboard [12]. No official Wizards page confirming this was found, and the research could not check whether MTGO resolves a card by `Name` when `CatID` is 0. Someone with an MTGO account should import both variants and record the result.
- **2. Partnerships and upstream work.** Convoke imports DeckCheck decks [22], and Cockatrice parses five deckbuilders' URLs in open-source code [10][11]. Should the owner ask Convoke for the same import, or offer Cockatrice a parser for MagicAIBuilder's public deck JSON (I-36's endpoints)? This research contacted no one.
- **3. Legal, for I-30's lawyer:** may a free export use the Magic card back, and how may platform names appear in the interface? Does Scryfall's "may not … proxy Scryfall data" [1] reach the existing `/api/proxy-card-image` route? This is research, not legal advice.
- **4. Image formats.** Scryfall now lists WEBP sizes that "replace" `normal` and `large` [2]. If the JPG URIs are retired, do Tabletop Simulator and the clients load WEBP?
- **5. Alchemy names.** On 2026-11-10 Scryfall returned no rebalanced `A-` card names [5]. How Arena names rebalanced cards in its own exports matters to I-10's Arena import, not to Commander exports.
- **6. Arena coverage threshold.** Should the panel hide Arena Brawl when coverage is low, or always show it with the share? Showing the share is the honest default.
- **7. Demand.** Reddit could not be read. Requirement 5.6 counts which destinations players choose. Review the counts before promoting slices 9 to 11.

## Sources

All read on 2026-11-10 unless dated otherwise. Scryfall pages were read with an honest User-Agent after a generic fetcher received HTTP 403.

1. Scryfall, API documentation: required headers and "Use of Scryfall Data and Images". https://scryfall.com/docs/api
2. Scryfall, Card Imagery: sizes, WEBP replacements, image statuses. https://scryfall.com/docs/api/images
3. Scryfall, Card objects: `arena_id`, `mtgo_id` ("also known as the Catalog ID"), `games`. https://scryfall.com/docs/api/cards
4. Scryfall, Set objects (`arena_code`, `mtgo_code`), and the Dominaria set object. https://scryfall.com/docs/api/sets and https://api.scryfall.com/sets/dom
5. Scryfall search API, counts for `legal:commander`, `legal:commander game:arena`, `legal:commander game:mtgo`, `is:alchemy` and `name:/^A-/`. https://api.scryfall.com/cards/search?q=legal%3Acommander+game%3Aarena&unique=cards
6. Tabletop Simulator Knowledge Base, Save File Format (undated). https://kb.tabletopsimulator.com/custom-content/save-file-format/
7. Tabletop Simulator Knowledge Base, Custom Deck (undated). https://kb.tabletopsimulator.com/custom-content/custom-deck/
8. Steam Workshop, "MTG Deck Loader / Importer (scripted)", changelog; the page reports the item removed. https://steamcommunity.com/sharedfiles/filedetails/changelog/2163084841
9. jeandeaual, tts-deckconverter, README. https://github.com/jeandeaual/tts-deckconverter
10. Cockatrice source, `libcockatrice_deck_list` (`deck_list.cpp`, `inner_deck_list_node.h`, `abstract_deck_list_card_node.cpp`) and `interface_json_deck_parser.h`, master as of 2026-11-10; release 3.1.2 published 2026-10-31. https://github.com/Cockatrice/Cockatrice
11. Cockatrice documentation, Importing decks, build 2026-11-08 (3.2.0-beta.2). https://cockatrice.github.io/docs/db/d91/importing_decks.html
12. XMage source, `DckDeckImporter.java`, `DekDeckImporter.java`, `MtgaImporter.java` and `AbstractCommander.java`, master as of 2026-11-09. https://github.com/magefree/mage
13. Forge source, `DeckSerializer.java`, `DeckSection.java` and `CardDb.java` (`CardRequest.fromString`), master as of 2026-11-10. https://github.com/Card-Forge/forge
14. Wizards of the Coast, Brawl format page. https://magic.wizards.com/en/formats/brawl
15. Draftsim, "How to Import and Copy Decks into MTG Arena", updated 2025-12-31. https://draftsim.com/mtg-arena-import-deck
16. MTG Arena Zone, "Importing and Copying Decks into MTG Arena", 2022-08-24. https://mtgazone.com/import/
17. TableCommander, Importing Decks. https://tablecommander.com/docs/decks/importing
18. Untap.in, home page. https://untap.in/
19. Draftsim, "How to Play Commander Online", updated 2026-01-06. https://draftsim.com/how-to-play-commander-online/
20. Playgroup.gg, "Play Commander online", published 2026-06-15, updated 2026-07-16. https://playgroup.gg/playgroup-live/play-commander-online
21. Convoke, "Convoke vs SpellTable". https://convoke.games/en/convoke-vs-spelltable
22. Convoke, partner page for DeckCheck (undated). https://new.convoke.games/en/partners/deckcheck
23. Moxfield public wiki, Features, last edited 2020-10-14; Moxfield's FAQ answered HTTP 403 on 2026-11-10. https://github.com/moxfield/moxfield-public/wiki/Features and https://moxfield.com/help/faq
24. Archidekt, FAQ. https://archidekt.com/faq
25. TappedOut, FAQ. https://tappedout.net/faq/
26. TappedOut forum, "Deck Export with Set Codes", 2024-02-19. https://tappedout.net/mtg-forum/tappedout/deck-export-with-set-codes
27. mtg.wtf, Settings (export formats). https://mtg.wtf/settings
28. Refusals recorded on 2026-11-10: Deckstats answered HTTP 403 (https://deckstats.net/decks/); Reddit's search JSON answered HTTP 403 (https://www.reddit.com/r/EDH/search.json), and the search tool blocks reddit.com.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player, or any viewer of a public deck, takes the deck to Tabletop Simulator, Cockatrice, XMage, Forge, Magic Online, MTG Arena Brawl or a browser table in a file each destination accepts, and is told before copying what that destination lacks or will refuse. Webcam players get a table view, a printable list and a frozen deck check link.

### Goals

- A player exports a Commander deck with a partner and a companion to Cockatrice, XMage and Tabletop Simulator, each file imports in the client version its fixture names, and every dropped or substituted card was listed before the download; a viewer of a public deck does the same without signing in; and an Arena Brawl export states the deck's Arena coverage.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-50-01

As a player taking a deck to another table, I want a file that program accepts, and a list of the cards it will drop, so that the failure is not a surprise inside the other program.

#### US-50-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-50-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-50-01 Happy path

Given a signed-in player and the English locale
When each export is a fixture that matches byte for byte.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-50-02 Happy path

Given a signed-in player and the English locale
When sideboard and Considering cards do not enter a playable zone by accident.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-50-03 Happy path

Given a signed-in player and the English locale
When a destination that has not been imported in the real client says it has not been tested.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-50-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-50-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-50-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-out for a public deck. Signed-in for a private deck. Webcam aids stay Later. No flag per destination: an untested one is labelled, not hidden.

#### AC-50-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-50-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-50-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The Play online panel lists destinations. Notices appear before the download. A public viewer can export without an account.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

One module per target under the export contract. Platform ids come from card data, not from the browser. No image is rehosted.

### Analytics and telemetry

`export_done {target, dropped: zero or some, scope: deck or table}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-out for a public deck. Signed-in for a private deck. Webcam aids stay Later. No flag per destination: an untested one is labelled, not hidden.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Where Magic Online wants the commander, and whether SpellTable or Convoke accept a paste, are unconfirmed. No paste format is specified until someone records it.

### Sources

- https://github.com/magefree/mage
- https://magic.wizards.com/en/formats/brawl
- https://mtg.wtf/settings
- https://cockatrice.github.io/docs/db/d91/importing_decks.html
- https://apps.apple.com/us/app/topdecked-mtg/id1173388234

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-50: Play This Deck Online

**Spec:** [`specs/i50-play-this-deck-online.md`](i50-play-this-deck-online.md)

**Outcome:** a player, or any viewer of a public deck, takes the deck to Tabletop Simulator, Cockatrice, XMage, Forge, Magic Online, MTG Arena Brawl or a browser table in a file each destination accepts, and is told before copying what that destination lacks or will refuse. Webcam players get a table view, a printable list and a frozen deck check link.

**Status:** Next
**Priority:** Next for slices 0 to 8; Later for the webcam aids (slices 9 to 11); slice 12 is blocked on a partner agreement
**Impact / effort:** Medium / medium
**Depends on:** nothing for slices 0 to 7, except a test on an MTGO account for slice 6's command-zone placement; I-36 slice 1 for viewer export (slice 8); I-19 slice 3 for the cached table view; I-41 slice 4's QR generator; a signed agreement or an accepted upstream change for slice 12.

A deck built here is usually played somewhere else, and on a weeknight that place is often online: a desktop client, a Tabletop Simulator table, a browser table, or a webcam call with paper cards. Each reads a different file and has its own rules for the commander, the companion and the sideboard, and a wrong guess fails late, in someone else's software. XMage requires the commander and at most one companion in the sideboard and nothing else there ([source](https://github.com/magefree/mage)). Arena Brawl has no sideboard and needs a commander "from a set currently on Arena" ([format page](https://magic.wizards.com/en/formats/brawl)). Of 32,643 Commander-legal cards, 48% have an Arena printing and 96% a Magic Online one (Scryfall, 2026-11-10). No deckbuilder read builds a Tabletop Simulator object, places the command zone where each client's validator expects it, or warns before export which cards a platform lacks. mtg.wtf offers several client formats ([settings](https://mtg.wtf/settings)), and Cockatrice's development build of 2026-11-08 imports deck links from five deckbuilders ([docs](https://cockatrice.github.io/docs/db/d91/importing_decks.html)). Reddit refused automated reads, so the evidence is competitors' investment, not measured demand; the panel counts which destinations players choose. Tabletop Simulator files link Scryfall's full card images as Scryfall serves them, never rehosted or cropped, with the artist credited.

### Scope

- [ ] An export contract: `ExportResult` with typed notices, one module per target, `v1` fixtures for the eight shipped formats, and the TappedOut fix (slice 0). Today `src/lib/deck/export.ts` writes every card line through one `cardLine` helper as `quantity name`, and `exportTappedOut` puts Sideboard and Considering cards in the main list (an I-10 item).
- [ ] `CardPlatformInfo`, filled on the server: set codes and collector numbers, `games`, `arena_id`, `mtgo_id`, Brawl legality and each set's Arena and MTGO codes; then name rules per target and card layout (slices 1–2). Today `DeckCard` (`prisma/schema.prisma`) stores no set code, collector number, Oracle ID or artist, and `ScryfallCard` (`src/lib/scryfall/types.ts`) does not type `games`, `arena_id` or `mtgo_id`.
- [ ] An Arena Brawl export with Arena set codes and numbers or neither, notices for cards not on Arena or not legal in Brawl, the deck's Arena coverage, and no sideboard (slice 3). Today `exportArena` promises set and number "if available", writes neither, and checks neither availability nor Brawl legality.
- [ ] Cockatrice `.cod` and XMage `.dck`, then Forge `.dck` with names only (slices 4–5).
- [ ] A Magic Online `.dek` for Commander with `CatID` from `mtgo_id` and single-slash split names (slice 6). Today `exportMTGO` writes `CatID="0"` for every card and the commander with `Sideboard="false"`, so XMage, which reads `.dek`, rejects the deck. Where MTGO itself wants the commander is an owner question.
- [ ] A Tabletop Simulator saved object that links Scryfall's full images, uses a second state for two-faced cards, holds command-zone and token objects and a neutral card back drawn for the product, under an image-rule guard (slice 7).
- [ ] A "Play online" panel on the builder, public and share pages, with the table-text variant, export by any viewer without forking, and one I-39 event per destination chosen (slice 8). Today only the owner can export: `ExportModal.tsx` opens from the builder, and `PublicDeckView` and `ShareDeckView` offer copy-link and fork.
- [ ] Later: a read-only table view for webcam play, a revocable `noindex` deck check link that freezes the list and says "Changed since this check", and a printable list with a QR code (slices 9–11). Slice 12, a partner import into Convoke or Cockatrice, is blocked on an agreement or an accepted upstream change.
- [ ] Show slice 11's QR code full screen on the deck and share pages, for opponents at a physical table; scanning needs no account, and the code only opens the list. TopDecked shares decks and binders by QR code ([13.0.5](https://apps.apple.com/us/app/topdecked-mtg/id1173388234), 2025-11-13). Added 2026-11-11.
- [ ] Neighbour changes, 2026-11-11: the deck check page (6.3) shows [I-77](i77-a-bracket-estimate-players-can-audit.md)'s stored audit, and slice 10 stores the assessment; an [I-79](i79-table-sets.md) set-scoped export runs each seat through the export contract, Tabletop Simulator gains a table save with one deck per seat, and the panel's I-39 event gains `scope`.

### Engineering enablers

- Each target's `v1` fixture matches byte for byte. For random decks, the exported command and main counts equal the deck's minus the dropped cards the notices list, and no Considering card reaches a playable zone.
- The XMage fixture has 1 to 3 sideboard entries, the Arena Brawl fixture has no `Sideboard` section, and the MTGO fixture has no `CatID="0"`.
- Every image URL in a Tabletop Simulator export is on `cards.scryfall.io` and equals the stored URI; no export contains `data:`, `art_crop` or `/api/proxy-card-image`.
- A person imports each fixture into the named client and records the client version and the date in its header; a destination never tested says "Not yet tested".

**Paid-tier angle:** every export, the panel, the table view, the printable list and deck check links stay free, with no account for a public deck: I-30 lists exporting as always free, and Scryfall forbids paywalling its data. No export carries an advertisement, a referral code or a tracking parameter. The one adjacent candidate, a check board for a recurring online pod, is rated weak, belongs with I-15 and I-35, and is I-30's to decide.

### Enrichment (2026-11-11)

**User story.** As a player taking a deck to another table, I want a file that program accepts, and a list of the cards it will drop, so that the failure is not a surprise inside the other program.

**Acceptance.**
- Each export is a fixture that matches byte for byte.
- Sideboard and Considering cards do not enter a playable zone by accident.
- A destination that has not been imported in the real client says it has not been tested.

**UX.** The Play online panel lists destinations. Notices appear before the download. A public viewer can export without an account.

**Data and API.** One module per target under the export contract. Platform ids come from card data, not from the browser. No image is rehosted.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `export_done {target, dropped: zero or some, scope: deck or table}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-out for a public deck. Signed-in for a private deck. Webcam aids stay Later. No flag per destination: an untested one is labelled, not hidden.

**Open questions.** Where Magic Online wants the commander, and whether SpellTable or Convoke accept a paste, are unconfirmed. No paste format is specified until someone records it.

### Definition of done

A player exports a Commander deck with a partner and a companion to Cockatrice, XMage and Tabletop Simulator, each file imports in the client version its fixture names, and every dropped or substituted card was listed before the download; a viewer of a public deck does the same without signing in; and an Arena Brawl export states the deck's Arena coverage.

---

