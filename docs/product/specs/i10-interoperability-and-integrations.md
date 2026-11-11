# I-10: Interoperability And Integrations

**Status:** Shipped  
**Priority:** Later  
**Depth:** Light

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Light, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.


This file is light because the initiative is Later or Parked and is not in I-80 to I-98. The scenarios below are the bar for when it is promoted. They are not a promise to build it next.

### Summary and problem

users can bring existing decks in, work on them here, and take the result wherever they play.

### Goals

- A deck can make a round trip through supported tools without silently changing commander, zone, quantity or ownership meaning.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-10-01

As a player, I want the outcome of I-10, so that the work in this file is the reason to build it.

#### US-10-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-10-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-10-01 Happy path

Given a signed-in player and the English locale
When a deck can make a round trip through supported tools without silently changing commander, zone, quantity or ownership meaning.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-10-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-10-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-10-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-10-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-10-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-10-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- https://archidekt.com/terms
- https://edhcheck.com/updates/light-mode-and-deck-builder/
- https://archidekt.com/features
- https://archidekt.com/news/19248512
- https://tappedout.net/mtg-forum/tappedout/import-deck-support-for-spelltable/
- https://edhmat.com/vs/spelltable

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-10: Interoperability And Integrations

**Outcome:** users can bring existing decks in, work on them here, and take the result wherever they play.

**Status:** Shipped
**Priority:** Later

### Already shipped

- Imports from Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks and EDHREC.
- Plain-text exports mark every card-note line with an explicit comment prefix, so multiline notes and reserved section names cannot introduce cards or change zones during reimport. Notes remain readable in the export; note rehydration remains separate scope.
- Text URL imports recognize partner and Main, Sideboard and Considering headers when the source provides them.
- Downloaded text lists also recognize colon-terminated section headings, including counted and commented headings, without losing commander, partner or secondary zones (#844).
- Downloaded text lists recognize `Main Deck` after a secondary-zone heading, returning following cards to the playable main deck (#1082).
- Downloaded text lists treat a bare or commented `99` heading as the main deck, so cards after a Sideboard section return to the correct zone (#1078).
- Downloaded text lists accept uppercase X quantity markers alongside lowercase x without losing command or secondary zones (#867).
- Downloaded text lists accept lowercase and mixed-case trailing edition codes without including them in card names (#869); exact-printing restoration remains open.
- Exports for Moxfield, MTG Arena, MTGO, TappedOut, Archidekt, MTGGoldfish, EDHREC and plain text. **Correction 2026-11-10:** this line also named a ManaBox export. None exists: on `dev` at `72fbfc1`, `src/lib/deck/export.ts` holds these eight exporters, and the only "ManaBox" under `src/` is an import-parser test (`src/lib/import/decklist-parse.test.ts`).
- Goldfish and EDHREC plain-list exports keep Sideboard and Considering cards out of the playable main deck.
- Archidekt exports now count and list only main-zone cards as Mainboard, preserving commander, partner and category tags. Dedicated secondary-zone Archidekt export remains open.
- Arena text exports preserve the selected companion in a dedicated section and include its sideboard copy only when absent, without changing the stored deck. Companion metadata and secondary-zone quantities are covered by local-parser round-trip tests; live Arena client import remains unverified.
- The Moxfield text exporter now retains companion, Sideboard and Considering headings instead of flattening zones. Our text parser round trip preserves roles and quantities; live Moxfield comment-header compatibility remains unverified, so external fidelity is still open.
- Versioned read-only external API under /api/v1.
- The URL import preview now discloses Scryfall-unresolved card names before confirmation, alongside names ignored by the source; front-face names of double-faced cards still resolve.
- Pasted plain-text imports now disclose unresolved names after import instead of implying complete success; resolved cards remain in the deck (#1023).
- Pasted decklists accept uppercase `X` quantity markers without changing card names, commander roles or secondary zones (#1080).
- Pasted lists show commander, zone copy counts and card rows before any deck mutation (#1063). The preview now checks names with Scryfall and discloses unresolved cards before confirmation (#1065); editing or closing the dialog invalidates the validation result.
- Pasted-list previews show both the commander and parsed partner or Background before confirmation, matching what the import will set (#1076).
- When no pasted card resolves, the preview keeps the missing-name warning visible but disables confirmation instead of reporting a successful zero-card import (#1074). Partially resolved lists remain importable.
- Pasted-list previews now disclose repeated card lines and commanders repeated in the main deck before confirmation (#1067), using the same canonical-name duplicate check as URL imports. The player can edit the pasted list; no automatic duplicate removal changes quantities.
- Each pasted-list preview row now labels its destination as Main, Sideboard or Maybeboard before confirmation (#1069). English and French labels are active; this is a visibility improvement, not a change to zone persistence or external round-trip fidelity.
- Missing-name warnings in the URL import preview are grouped across equivalent case, whitespace and apostrophe spellings, preserving the first spelling without merging imported rows or quantities (#848).
- Import duplicate warnings also recognize front-face and full names resolving to the same canonical Scryfall name (#865), preserving first imported spelling, rows, quantities and zones.
- Pasted decklists preserve Unicode names, accept commented or colon-terminated section headings, and recognize uppercase set codes without collector numbers. Scryfall lookup also handles copied smart apostrophes.
- URL imports accept supported addresses without a scheme and preserve zones from count-labelled headings. EDHREC average imports keep distinct cards across categories; previews warn about normalized duplicate lines and commanders repeated in the main list.

### Remaining scope

- [ ] Treat import/export formats as versioned contracts with fixtures.
  - [x] Quote carriage returns in deck CSV fields so card names and metadata stay within their cells (#846); spreadsheet-client import remains unverified.
  - [x] Retain printing-specific Scryfall IDs and application categories in simple and full deck CSV exports (#842). Missing printing IDs remain blank; CSV reimport and external category mapping remain open.
  - [x] Include a trailing Zone column in simple and full deck CSV exports, preserving main, sideboard and maybeboard values without changing existing column positions (#840). CSV reimport and command-zone rows remain separate scope.
  - [I-50](i50-play-this-deck-online.md) slice 0 gives the eight shipped text exports one contract, with typed notices and a `v1` fixture each. I-10 keeps the import side and the round trip.
- [x] Add an import preview that shows zones, commanders, missing cards and duplicate decisions.
- [x] Show both parsed commanders in a pasted-list preview when a partner or Background is present (#1076).
- [x] Validate pasted-list names before confirmation and show unresolved cards in its preview (#1065).
- [x] Prevent confirming a pasted-list preview when none of its cards resolves (#1074).
- [x] Show duplicate decisions in pasted-list previews using the URL preview's matching policy (#1067).
- [x] Preserve partner, companion, sideboard and Considering cards when a deck is exported, bulk-edited and reimported as plain text.
- [x] Export MTGO sideboard quantities as sideboard cards without including Considering cards in the playable list.
- [x] Keep MTGO XML valid and card names intact when names contain XML-reserved characters.
- [ ] Keep Sideboard and Considering cards out of the TappedOut export's main list. `exportTappedOut` (`src/lib/deck/export.ts`) writes every entry of `deck.cards`, so they enter its main list unmarked. [I-50](i50-play-this-deck-online.md) slice 0's fixtures catch it, and that slice fixes it.
- [ ] Improve round-trip fidelity for categories, printings, companions and sideboards across external formats. EDHREC's October and November 2026 fixes for clipboard-to-Archidekt commander assignment and the Archidekt export link are a reminder to keep these fixtures current. They do not add a new integration.
  - [x] Preserve commander, quantities and secondary zones in downloaded plain-text lists using CR, CRLF or LF line endings (#836).
  - Import parsing and preview are more resilient, but exact printing and category round trips remain open; preserving a localized name does not guarantee that Scryfall resolves that language.
  - [I-57](i57-printing-preferences-everywhere.md) slice 6 keeps the printing an import source names, an Archidekt row's Scryfall `uid` first and a text line's `(SET) number` next. Today `SET_CODE_PATTERN` (`src/lib/deck/import.ts`) strips `(SET) 123`, and `src/lib/import/url-import.ts` reads card names only.
- [ ] Offer opt-in integrations only when authentication, rate limits and ownership are clear.
- [ ] **Owner decision: the Archidekt import and Archidekt's terms.** The shipped single-deck Archidekt import fetches `archidekt.com/api/decks/{id}/` (`src/lib/import/url-import.ts`, checked on `origin/dev` at `72fbfc1`). Archidekt's terms, effective 2018-09-07, name Archidekt LLC as the site's owner and forbid "automated searches, requests, or queries" and access "to build a similar or competitive website" ([terms](https://archidekt.com/terms), both clauses read on 2026-11-10). The options are to ask Archidekt LLC in writing whether a read of a player's own deck at the player's request is allowed, or to move Archidekt to file import through [I-62](i62-switching-from-another-site.md). Archidekt sits under Space Cow Media ([landscape](../competitive-landscape.md#how-the-references-grew)), so the letter can also cover I-29's partnership track. No request has been sent.
- [ ] Prefer a stable public API over brittle scraping whenever a partner provides one.
- [x] Treat the Moxfield URL import as a brittle path rather than a stable contract. Moxfield has no public API, now answers programmatic requests behind Cloudflare, and requires authentication headers on its internal endpoints; other tools have moved to paste and CSV as the supported route. Detect the blocked case explicitly and tell the player to paste the list instead of reporting a generic import failure.
  - Shipped in #1304: `fetchMoxfieldJson` (`src/lib/import/moxfield-client.ts`) is the only code that calls Moxfield, and it sends no `Origin` or `Referer` set to moxfield.com. A 403, a 429 or an HTML page becomes a typed refusal (HTTP 422, `moxfield_refused`), logged once as a warning and never retried, and the URL tab and the profile panel tell the player to paste the list in the Plain Text tab; the profile panel hides Retry for a refusal. Moxfield already broke third-party imports once in June 2026 by changing how deck data could be pulled ([EDHcheck, 2026-06-14](https://edhcheck.com/updates/light-mode-and-deck-builder/)).
- [ ] **Owner decision: the supported Moxfield route.** With honest headers, Moxfield answered both of the app's probes on 2026-11-09 with a Cloudflare block page (HTTP 403), so with the fix above Moxfield URL import fails for as long as Moxfield refuses honest requests. The options are to accept paste import as the supported Moxfield route, or to ask Moxfield for API access. No request has been sent to Moxfield. The source policy planned in [I-29](i29-cross-site-deck-index.md) forbids headers that impersonate a source, so restoring the old headers is not an option.

**2026-11-09:** deck embeds for other websites are tracked in [I-36](i36-creator-and-embed-toolkit.md). A "play this deck" link to an online table such as Playgroup.gg or TableCommander would be an export contract here. Neither exists today.

**2026-11-10:** that contract is now [I-50](i50-play-this-deck-online.md)'s. The play-readiness of the MTGO and Arena exports listed above moves there too: commander placement, MTGO Catalog IDs, Arena set codes, availability on each platform and Brawl legality. I-10 keeps import, the other text exports and their round trip.

**2026-11-10, fifth pass:** cards dragged or pasted from another site into the editor are [I-37](i37-editor-depth.md)'s slice 24. I-10 keeps the formats: which link and image shapes from Scryfall, EDHREC, Archidekt and Moxfield resolve to a card, under fixtures like any other import.

**2026-11-10, sixth pass:** moving many decks from another site in one step is [I-62](i62-switching-from-another-site.md)'s, from the files that site exports. I-10 keeps single-deck paste and URL import, and I-62 reuses its text parser. While Moxfield refuses honest requests, the Moxfield profile panel (`MoxfieldProfileImport`) links to I-62's Moxfield guide instead of offering a picker that fails (I-62 requirement 2.3, slice 8).

**Twelfth pass, 2026-11-11:** accept a pasted line that is only a Scryfall card id. No importer under `src/lib` matched a Scryfall id on `a3250bfa`. Archidekt's board lists "Scryfall ID text import" with no point total, seen 2026-11-11 ([features](https://archidekt.com/features)).

- [ ] Resolve a pasted flavor name to the oracle card when the printed name misses. A comment on Archidekt's January 2026 odds-and-ends thread asks for alternate names such as "Balin's Tomb" for Ancient Tomb; staff said a lookup on every import is slow and still called the miss a poor experience ([thread](https://archidekt.com/news/19248512), read 2026-11-11). Try `flavor_name` only after the oracle name fails, and show the oracle name that was chosen. Do not add a second card.

A TappedOut forum post on 2026-07-30 says SpellTable and Convoke import Moxfield and Archidekt ([thread](https://tappedout.net/mtg-forum/tappedout/import-deck-support-for-spelltable/)). An EDHMat page, read as a search result on 2026-11-11, says SpellTable needs no list because the cards are physical ([comparison](https://edhmat.com/vs/spelltable)). The two disagree, neither was confirmed inside the product, and no paste format is specified. The export contract stays [I-50](i50-play-this-deck-online.md).

### Definition of done

A deck can make a round trip through supported tools without silently changing commander, zone, quantity or ownership meaning.

---

