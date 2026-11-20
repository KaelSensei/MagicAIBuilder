# I-115: Cards To Get Signed: An Event's Artists Against Your Copies

> **Initiative:** I-115, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-20 · **Priority:** Later; slice 1 runs on fixtures and may be built by hand, and the panel waits for [I-67](i67-one-card-data-pipeline.md) slice 2's printings carrying `artist` · **Paid:** never · **Written 2026-11-20**
> **Placement:** a player's preparation for a signing: which of their own copies, or the cards in their decks, are by the artists attending an event, where those copies sit, and a printable list for the queue. [I-102](i102-a-theme-you-can-measure.md) owns an artist as a theme handle of one deck; [I-101](i101-collecting-goals-beyond-a-set.md) owns an artist as a collecting goal (what the collector lacks); [I-89](i89-the-condition-of-a-physical-copy.md) owns the signed flag on a copy; [I-43](i43-physical-collection-storage-and-pull-lists.md) owns places and pull lists. None owns "these artists will be at this event: which copies that I own, or play, are theirs, and where are they".
> **Research:** one dated note of 2026-11-20 (angle R6, regional markets, real-world events and physical play), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Figures marked "computed" were derived from Scryfall's public API on 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the artist matcher over a player's decks and collection (`matchArtists`), the two match kinds ("your printing" and "another printing"), the per-event signing list with the player's own notes, its print and offline copy, and "mark as signed" as a batch. **Does not own:** printings and their artist field ([I-67](i67-one-card-data-pipeline.md) slice 2); ownership by printing ([I-06](i06-collection-and-purchase-planning.md)); which printing a deck card holds ([I-57](i57-printing-preferences-everywhere.md)); places and pull order ([I-43](i43-physical-collection-storage-and-pull-lists.md)); the signed flag ([I-89](i89-the-condition-of-a-physical-copy.md)); the offline cache ([I-19](i19-offline-game-night-viewing.md)); public projections ([I-36](i36-creator-and-embed-toolkit.md)); artist themes ([I-102](i102-a-theme-you-can-measure.md)) and artist goals ([I-101](i101-collecting-goals-beyond-a-set.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-101      | A non-goal line: matching an event's artists against copies the player already owns or plays is I-115's; I-101 keeps artist goals (what the collector lacks). |
| I-89       | Slice 9's signed flag may be written in a batch from I-115's list; no change to I-89's rule that a signature changes no price.                                |
| I-43       | A third pull-list scope: "the copies on an I-115 signing list", ordered by place as I-43's pull list is.                                                      |
| I-19       | One more file in the same offline cache: the printed signing list.                                                                                            |

## Overview

The organiser's own advice is a manual version of this job. MTG Festivals' "Meet the Artists of Magic": "First, know which artists you want to visit! Check the artist directory … and make a list of who you'd like to see. There will be more than forty artists in attendance … Doing a little research ahead of time will also give you a chance to pack any cards you want to get signed"; and "have your cards pulled and ready for signatures before getting up to the table!" [1]. MagicCon Vegas 2026 had "a whopping 62 artists", MagicCon Atlanta 2025 had 63, and Amsterdam 2026 "more than 50" [2]. "Most CommandFests will have guest Magic artists", across 16 CommandFests in 2026 [3].

Two competitors ship this job. Archidekt has run an "Artist Finder" for four MagicCons since June 2025: "choose your deck from the drop-down menu or import a text list, and the site will tell you instantly which cards in your deck were illustrated by artists who'll be attending"; its co-founder said it "has been requested here and there over the years" and that he "was pleased with how frequently it was used" [4]. MTG Burrow, free, has an Artist Search over an imported collection, and its v2.3.0 of 2026-10-26 added "Binder and deck tags in Artist Search. Turn on tags to see which binder or deck holds each card" [5]. Players point each other to it: "you can use https://mtgburrow.com to search your collection to see which cards you own by the artists that will be at MagicCon Amsterdam" (r/EDH, 2026-07-05) [6]. An artist's own reminder about signing time slots drew 143 points on 2026-11-12 [6].

Scale matters for honesty: Scryfall's artist catalogue holds 2,483 names, and `a:"Mark Tedin" f:commander` returns 786 Commander-legal printings (computed) [7]. A match by card name alone is far wider than a match by the printing the player holds.

This initiative takes a list of artist names the player types or picks, and shows the cards in their decks and collection whose printing is by one of them, grouped by artist, with "another printing is by this artist" kept apart as a hint. The list is printable, readable offline, says where each copy sits, holds the player's own notes per artist, and after the event marks the signed copies in one action.

**Why a new initiative.** No file owns it (re-checked on 2026-11-20 against I-102, I-101, I-89, I-43, I-14 and I-41). The fallback, a view on I-101's artist kind, would put a deck-first, seasonal job behind I-101's gate C (300-row collections), while Archidekt serves it from decks alone. **Why Later.** It needs I-67 slice 2's printings with `artist`.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source           | What it does or says                                                                                                | Source |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| **MTG Festivals**           | "make a list of who you'd like to see … pack any cards you want to get signed"; "have your cards pulled and ready"  | [1]    |
| **MagicCon, CommandFest**   | 62, 63 and "more than 50" artists at three MagicCons; "Most CommandFests will have guest Magic artists", 16 in 2026 | [2][3] |
| **Archidekt Artist Finder** | Four MagicCons since June 2025; a deck or a pasted list against attending artists; free, signed out                 | [4]    |
| **MTG Burrow**              | Artist Search over an imported collection; binder and deck tags since 2026-10-26                                    | [5]    |
| **r/EDH, r/magicTCG**       | A player preparing gifts for a playgroup; an artist's time-slot reminder at 143 points                              | [6]    |
| **Moonshot Games**          | Signature fees set per artist, $2 to $10, "may be subject to change during the event"                               | [8]    |

**The gap.** Archidekt reads decks, MTG Burrow a collection; neither was found to keep "your printing" apart from "another printing", say where a copy sits across both, and mark the signed copies afterwards.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **No artist data is kept.** `src/lib/scryfall/catalog-card.ts` (header, line 12) leaves artist out of the catalog card ("Scryfall fields nobody reads (colours, rarity, artist, flavour …)").
- **"Only cards I own"** exists in card search, counting any printing (user guide, "In Search Results").
- **No storage place, pull list or signed flag** exists (I-43 and I-89 are unbuilt).

**Owning context:** `collection` for the matcher's read model; the matcher itself is a pure function in `card-data`.

## Functional requirements

### 1. Principles

1.1 The matcher compares Scryfall's `artist` field; a printing credited to two artists matches either name. No model.
1.2 Two kinds of match stay apart: "your printing is by this artist" (the deck card's or collection row's Scryfall id) and "another printing of this card is by this artist" (a hint, labelled as one, naming that printing).
1.3 The product supplies no fee, no ranking of artists and no "worth more signed" figure; I-89 already says a signature changes no price.

### 2. The list

2.1 Artist names typed or picked from Scryfall's artist names (cached once a day); an unknown name reads "not found in Scryfall's artist names" with its closest spellings, and matches nothing.
2.2 Inputs: one deck, all of the player's decks, the collection when there is one, and later friends' public decks through public projections.
2.3 Grouped by artist, then name, then set, with counts.

### 3. Print, offline and afterwards

3.1 A black-and-white print view (I-19's checklist style, with I-86's footer), ordered by I-43 place when places exist, each row naming its place and the deck that uses it.
3.2 Per-artist notes (fee, time slot) the player writes, kept on the device.
3.3 The offline copy through I-19's cache.
3.4 "Mark as signed" writes I-89's flag on the ticked collection rows only.

### 4. Free and paid

| Part       | Free | Paid candidate | Why                                                                      |
| ---------- | ---- | -------------- | ------------------------------------------------------------------------ |
| Everything | Yes  | —              | Archidekt and MTG Burrow give it away; a paid version would lose to both |

## Data model / API

```
ArtistMatch    artist, kind: yourPrinting | anotherPrinting, oracleId, scryfallId (the printing named), source: deck | collection,
               deckIds[], collectionRowId?, place?
SigningList    names[], unknownNames[]{name, closest[]}, matches[] grouped by artist
```

- `matchArtists(names, cards, printings)` is pure; `ArtistMatch.kind` is a discriminated union with an exhaustive `never` guard.
- `POST /api/signing-list` (owner-only; names in the body, not the URL); `POST /api/collection/signed` (batch, one transaction, collection rows only).

## Non-goals

- An event directory, an event calendar, an artist page or an artist database (the venue-directory non-goal; I-73's refused public calendar; I-102's "no artist or plane page").
- Fee data, a ranking of artists, or "worth more signed".
- A buy, sell or hold verb.
- Scraping an organiser's artist directory, contacting artists, or booking time slots.
- A list of who else is going, a meet-up or messaging.
- A model.

## Testing strategy

- **Matcher (solitary):** a deck holding Sol Ring in a Mark Tedin printing and Swords to Plowshares in another artist's printing, with names "Mark Tedin" and "Jeff A. Menges", lists Sol Ring under Mark Tedin as "your printing" and Swords to Plowshares under Jeff A. Menges as "another printing", naming it.
- **Two artists (solitary):** "David Martin & Franz Vohwinkel" (in the repository's fixtures) matches either name.
- **Unknown name (solitary):** a name outside the catalogue matches nothing and lists its closest spellings.
- **Signed (sociable):** ticking 9 of 12 sets I-89's flag on those 9 rows only; no price, value or deck changes.
- **Red first:** slice 1's first Red: `matchArtists(["Mark Tedin"], [solRingTedin], printings)` returns one `yourPrinting` match.

## Delivery slices

| #   | Slice                                                                                                                                               | Depends on            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | `matchArtists`, pure, with solitary tests: exact versus another printing, two-artist credits, unknown names, stable order; fixtures only            | None (by hand)        |
| 2   | The panel over one deck or all of the player's decks; names typed or picked from Scryfall's catalogue; two labelled match kinds; English and French | 1; I-67 slice 2; I-57 |
| 3   | Collection rows and I-43 places; the print view; per-artist notes on the device                                                                     | 2; I-06; I-43 slice 4 |
| 4   | The offline copy through I-19's cache                                                                                                               | 3; I-19               |
| 5   | "Mark as signed", writing I-89's flag                                                                                                               | 3; I-89 slice 9       |
| 6   | Friends' and pod decks as input, through public projections only                                                                                    | 2; I-36 slice 1       |

Slice 1 can start now by hand; slice 2 waits for I-67 slice 2.

## Open questions

1. **A curated event list.** Should the operator ever publish a versioned per-event artist list (MagicCon, CommandFest), or should names stay typed or pasted by the player? Curation is recurring work and brushes the event-directory non-goal. Recommended: player-supplied in version 1.
2. **Cards not owned.** Should the list offer "a printing by this artist exists" for cards the player does not own, with I-96's labelled prices, as the 2026-07-05 thread asks for gifts? Recommended: a hint with no price in version 1.
3. **"Your copy".** Does the deck's printing count as "your copy" when I-06 has no matching collection row? Recommended: label it "the printing in this deck", not "your copy".

## Sources

Read on 2026-11-20 unless stated otherwise.

1. MTG Festivals, "Meet the Artists of Magic" (undated; names MagicCon: Las Vegas). <https://www.mtgfestivals.com/global/en-us/magiccon-news/meet-the-artists-of-magic.html>
2. EDHREC, "MagicCon Vegas 2026's Artist Alley Revealed", 2026-03-10. <https://edhrec.com/articles/magiccon-vegas-2026s-artist-alley-revealed>; EDHREC on Atlanta 2025 (2025-09-12) and Amsterdam 2026 (2026-07-08), in [4].
3. magic.gg, "Announcing 2026's CommandFest lineup", 2026-03-10. <https://magic.gg/news/announcing-2026s-commandfest-lineup>
4. EDHREC, "Archidekt announces new MagicCon feature for searching artists", 2025-06-06, <https://edhrec.com/articles/archidekt-announces-new-magiccon-feature-for-searching-artists>; "Archidekt Art Finder returns for MagicCon Atlanta", 2025-09-12, <https://edhrec.com/articles/archidekt-art-finder-returns-for-magiccon-atlanta>; "… for MagicCon Amsterdam", 2026-07-08, <https://edhrec.com/articles/archidekt-art-finder-returns-for-magiccon-amsterdam>; Archidekt, <https://archidekt.com/magiccon> (fetched once, by name).
5. MTG Burrow, changelog, v2.3.0 of 2026-10-26: "Binder and deck tags in Artist Search." verified on 2026-11-20 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://mtgburrow.com/changelog>; home page <https://mtgburrow.com/>.
6. r/EDH, "Need help finding cards to get signed", 2026-07-05, 2 points, 7 comments, <https://www.reddit.com/r/EDH/comments/1uoem97/>; r/magicTCG, "Reminder: Alayna Danner and other artists will have a time slot system for MagicCon Atlanta card signatures!", 2026-11-12, 143 points, <https://www.reddit.com/r/magicTCG/comments/1xus2pr/>.
7. Scryfall, `/catalog/artist-names` (2,483 names) and `/cards/search?q=a:"Mark Tedin" f:commander&unique=prints` (786), computed 2026-11-20.
8. Moonshot Games, "Moonshot the Gathering: artist signatures" (undated). <https://moonshotgamestore.com/pages/moonshot-the-gathering-artist-signatures>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player going to MagicCon, a CommandFest or a store's artist day has to find, among their decks and collection, the physical copies illustrated by the artists who will attend, pull them from boxes and binders, and budget fees and queue time. Today that means searching each artist on Scryfall and cross-referencing every deck by hand [1][4].

### Goals

- From a list of artist names, the cards in the player's decks and collection whose printing is by one of them, grouped by artist.
- "Your printing" kept apart from "another printing", labelled.
- One printable, offline-readable list with places, decks and the player's own notes.
- After the event, the signed copies marked in one action.

### Non-goals

- An event or artist directory; fee data; artist rankings; buy or sell verbs; scraping; contacting artists; meet-ups; a model.

### Personas

The collector and budget player bringing their own copies; the casual pod player bringing a gift for the playgroup. See the roadmap persona table.

### User stories

#### US-115-01

As a player going to MagicCon, I want to paste the attending artists and see which cards in my decks and collection have a printing by them, so that I pack the right copies.

#### US-115-02

As a player standing in an artist's line, I want the list grouped by artist, with my fee and time-slot notes and readable without signal, so that I hand over the right cards at the right time.

#### US-115-03

As a player bringing a gift for my playgroup, I want the same check run on my friends' public decks, so that I can pick a card they play by an attending artist.

### Acceptance criteria

#### AC-115-01 Happy path

Given a deck holding Sol Ring in a printing credited to Mark Tedin, and Swords to Plowshares in a printing by another artist
When the player enters "Mark Tedin" and "Jeff A. Menges"
Then Sol Ring is listed under Mark Tedin as "your printing", and Swords to Plowshares is listed under Jeff A. Menges only as "another printing is by this artist", naming that printing

#### AC-115-02 Error and failure

Given Scryfall's artist names cannot be read
When the player builds the list
Then typed names are matched exactly, the list says the catalogue is unavailable for suggestions, and nothing else changes

#### AC-115-03 Unknown name

Given a typed name that is not in Scryfall's artist catalogue
When the list is built
Then that name is shown as "not found in Scryfall's artist names" with its closest spellings, and no card is matched to it

#### AC-115-04 Guest and signed-in

Given the rollout
When a guest pastes a text list and a signed-in player picks their decks
Then the guest gets the matches for the pasted list only, and the signed-in player's list reads their own decks and collection; a list built from private decks carries no share link

#### AC-115-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-115-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player builds and ticks the list without a pointer
Then each group is a labelled list, the match kind is a word, and tick boxes have names

#### AC-115-07 Where it is

Given I-43 places
When a matched copy sits in a binder and another copy of the same card sits in a deck box
Then both rows show their place, and the printed list is ordered by place

#### AC-115-08 Signed afterwards

Given a list of 12 copies
When the player ticks 9 and confirms "mark as signed"
Then I-89's flag is set on those 9 collection rows only, and no price, value or deck changes

### UX flow and states

"Cards to get signed" asks for artist names (typed, picked or pasted) and the inputs (a deck, all decks, the collection). The result groups by artist with counts; "Print", "Save for offline" and, after the event, "Mark as signed".

- Empty: "None of your cards have a printing by these artists."
- Loading: a busy state that keeps the list still.
- Error: typed names still match; suggestions are unavailable.
- Partial: places read "not recorded" until I-43 ships.

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`signing_list_built {artists, matchesYourPrinting, matchesAnother}`, `signing_list_marked_signed {rows}`. Reserved for I-39's store. Counts and enums only: no artist, card or deck name.

### Rollout and feature flags

Behind an I-69 switch, `collection.signingList`, on with slice 2. Guests may paste a text list.

### Dependencies

[I-67](i67-one-card-data-pipeline.md) slice 2; [I-06](i06-collection-and-purchase-planning.md); [I-43](i43-physical-collection-storage-and-pull-lists.md); [I-89](i89-the-condition-of-a-physical-copy.md) slice 9; [I-19](i19-offline-game-night-viewing.md); [I-57](i57-printing-preferences-everywhere.md); [I-26](i26-collections-arriving-from-elsewhere.md) (optional); [I-36](i36-creator-and-embed-toolkit.md) slice 1 (slice 6).

### Risks and mitigations

- **An artist or event directory by another name.** Mitigation: names come from the player; no curated list in version 1 (open question 1).
- **"Another printing" read as "your copy".** Mitigation: two labelled kinds and a test.
- **Fees or value creeping in.** Mitigation: notes are the player's own, on the device; no price on hint rows in version 1.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-115-101 Several decks, one bag

As a player bringing four decks to a CommandFest, I want one list across them, so that I pack once.

#### AC-115-100 Happy path

Given four decks and ten artist names
When the list is built
Then each match names the deck that uses it, and a card used by two decks appears once with both decks named

#### AC-115-101 Failure

Given the offline save fails
When the player retries
Then the printed list is still available to print, and the message is a catalogue string

#### AC-115-102 Edge

Given a printing credited to "David Martin & Franz Vohwinkel"
When the player enters "Franz Vohwinkel"
Then the card is listed under Franz Vohwinkel as "your printing"

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "None of your cards have a printing by these artists."                                                  |
| Loading          | A busy state that keeps the list still.                                                                 |
| Error            | Exact matches only; "suggestions unavailable".                                                          |
| Guest            | Matches for a pasted list.                                                                              |
| Signed-in        | Decks, collection, places, print, offline and mark as signed.                                           |
| Offline          | The saved list, read-only, with its date.                                                               |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; artist names as Scryfall writes them.                              |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Names, inputs, ticks and actions are reachable without a pointer.                                       |
| Screen reader    | Groups are labelled lists; match kinds are words.                                                       |
| Colour           | No meaning rests on colour; the print view is black and white.                                          |
| Success          | "9 copies marked as signed."                                                                            |

### Alternate paths

- The player pastes a text list instead of choosing decks. The matcher runs on its names and the printings it names, if any.
- The player removes an artist after building. The group disappears; ticks on other groups stay.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-115 is a link here. I-101 carries a non-goal line that points here.

## I-115: Cards To Get Signed: An Event's Artists Against Your Copies

**Outcome:** from a list of attending artists, a player sees which copies in their decks and collection are by them, kept apart from cards whose other printings are, prints an offline list ordered by place with their own notes, and after the event marks the signed copies in one action.

**Status:** Later
**Priority:** Later; slice 1 by hand now. Never paid.
**Impact / effort:** Medium / small to medium (seasonal: three MagicCons and 16 CommandFests in 2026)
**Risk:** Low. The risk is a directory by another name, which the non-goals forbid.
**Depends on:** nothing for slice 1; I-67 slice 2 and I-57 for slice 2; I-06 and I-43 slice 4 for slice 3; I-19 for slice 4; I-89 slice 9 for slice 5; I-36 slice 1 for slice 6.

The organiser tells players to "make a list" and "have your cards pulled"; Archidekt's Artist Finder (four MagicCons) and MTG Burrow's Artist Search with binder and deck tags (2026-10-26) ship the job free.

### Scope

- [ ] `matchArtists`, pure (slice 1); the deck panel (slice 2).
- [ ] Collection and places, print and notes (slice 3); offline (slice 4); mark as signed (slice 5); friends' decks (slice 6).

### Engineering enablers

- `ArtistMatch.kind` as a discriminated union; names in a request body, never a URL.

**Paid-tier angle:** none.

### Enrichment (2026-11-20)

**User story.** As a player going to MagicCon, I want my copies by the attending artists listed, so that I pack the right ones.

**Acceptance.** "Your printing" apart from "another printing"; unknown names flagged; places and decks named; signed flags on ticked rows only.

**UX.** Names in, a grouped list out, print, offline and mark as signed.

**Data and API.** `ArtistMatch`, `SigningList`; two owner routes.

**i18n and access.** English and French; match kinds as words; a black-and-white print view.

**Telemetry.** `signing_list_built`, `signing_list_marked_signed`. Reserved for I-39.

**Rollout.** `collection.signingList`, with slice 2.

**Open questions.** A curated event list; cards not owned; "your copy".

### Definition of done

A player enters ten artists for MagicCon, sees their Sol Ring listed under Mark Tedin as "your printing" with its binder, sees a Swords to Plowshares hint naming another printing, prints the list ordered by place, opens it offline, and after the event marks 9 copies as signed.

---
