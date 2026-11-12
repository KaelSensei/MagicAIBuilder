# I-42: Commander Variants: Duel Commander, cEDH, Pauper Commander And Others

> **Initiative:** I-42, proposed for the [roadmap](../roadmap.md) · **Status:** proposed · **Priority:** Next for the format picker, legality and Duel Commander (slices 1 to 6); Later for the other variants · **Written** 2026-11-09
> **Research:** one dated note, not committed. Every external fact below links its own source in [Sources](#sources). Points on licences and terms are research, not legal advice.
> **Owns:** the rules of each Commander variant as data, the legality check per variant and the dated lists behind it, the format picker, and the variant's life total and mulligan in the playtest. **Does not own:** bracket 5 and bracket rules ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)), tournament data and the meta panel's sources ([I-09](i09-meta-and-evidence.md)), the deck index ([I-29](i29-cross-site-deck-index.md)), the playtest engine beyond its format inputs ([I-07](i07-playtest-and-iteration.md)), import parsers ([I-10](i10-interoperability-and-integrations.md)), the per-deck watch ([I-18](i18-per-deck-radar-of-new-cards.md)), the paid tier ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

Commander is one game with several rule sets. Duel Commander is a 1v1 variant at 20 life with its own committee and its own banned list, including cards banned only as a commander. It has a weekly tournament scene: MTGTop8's 20 latest events, over five days, came from ten countries and online play, France included [7]. The owner is French and the product is bilingual, yet Duel Commander appears in this repository only in a tournament label and an import check.

The code is further from the variants than the roadmap says. The roadmap lists nine formats as a completed foundation, but no screen lets a player choose one: every deck created in the app is a Commander deck. Duel Commander data already reaches those Commander decks, through the MTGTop8 meta panel and the Moxfield import, and is then checked against the multiplayer banned list, at 40 life and with a free mulligan.

This initiative encodes each variant's rules as deterministic data, takes every banned list from a dated source that can be refreshed and compared, and ships Duel Commander first. Its priority is **Next** for slices 1 to 6, because the data already arrives and the fix is small. Pauper Commander, Oathbreaker, the Brawl split, cEDH link-outs, Canadian Highlander and Tiny Leaders are **Later**.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise.

### Rules, maintainers and lists

| Variant                                 | Maintainer and source                                                                                                | Deck, life, commander                                                                                                      | Mulligan                                                                                                 | List and last change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Duel Commander**                      | Duel Commander Rules Committee, volunteers, at duelcommander.org [1][6]                                              | 100 cards with the commander; 20 life; partner, friends forever and backgrounds allowed; no commander damage loss [2]      | "London Mulligan as defined in MTG Comprehensive Rules section 103.4"; no free mulligan is mentioned [2] | 80 cards banned in the deck and 27 banned as commander only, last updated 2026-07-27 [3]. No fixed schedule, often after a set [6]                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **cEDH**                                | No separate rules: Commander at bracket 5. EDHTop16 and the cEDH Decklist Database track the metagame [16][17]       | As Commander: 100 cards, 40 life                                                                                           | Free first mulligan in multiplayer (CR 103.5c) [12]                                                      | Commander's list. The DDB labels lists Competitive, Brew or Outdated; latest visible entry 2026-08-19 [17]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Pauper Commander (PDH)**              | pdhhomebase.com; its rules page names no committee [10]                                                              | Commander: an uncommon creature, Vehicle or Spacecraft, legendary or not; 99 commons; 30 life; commander damage 16 [10]    | Not stated [10]                                                                                          | Mystic Remora, Rhystic Study and three categories; no date shown. Rarity counts paper and MTGO printings, not Arena [10]                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Oathbreaker**                         | oathbreakermtg.org; created by weirdcards.org [11]                                                                   | 60 cards including a planeswalker Oathbreaker and an instant or sorcery Signature Spell; 20 life; {2} tax on each [11]     | Not stated [11]                                                                                          | Separate banned list; latest update February 2026 [11]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Brawl (tabletop)**                    | Wizards, Comprehensive Rules 903.12 [12]                                                                             | 60 cards; 25 life two-player, 30 multiplayer; creature, planeswalker, Vehicle or Spacecraft commander; no commander damage | Free first mulligan in any Brawl game (903.12g) [12]                                                     | Usually built from Standard [12]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Brawl on Arena** (was Historic Brawl) | Wizards; renamed in late 2023 [13]                                                                                   | 100 cards from the Arena pool; 25 life; planeswalker commanders allowed [13]                                               | One free mulligan [13]. "There is no free mulligan in Competitive Brawl" [26]                            | Its own list. A separate Competitive Brawl list bans Lutri and bans several cards as commander [13]; Wizards says the Competitive Brawl list bans "only ten commanders", and that "deck composition is not a factor for matchmaking" [26]. _Corrected 2026-11-11:_ this cell said "Ranked play since June 2023". Wizards' "Introducing Ranked Brawl" (2026-06-08) announces a Ranked Brawl event "From June 2–15" and says "Competitive Brawl will be released on June 23!"; it never mentions 2023 [26]. No source for a 2023 ranked Brawl was found, which does not prove there was none |
| **Canadian Highlander**                 | canadianhighlander.ca; the footer reads "2024 Back Pocket Labs" [14]                                                 | At least 100 cards, singleton, no commander; at most 10 points among 46 pointed cards; Ancestral Recall costs 8 [14]       | Not stated                                                                                               | Vintage's banned list plus structural bans; the points list shows no date [14]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Tiny Leaders**                        | Tiny Leaders Reborn Core Committee, which called its blog "the new Official Home of Tiny Leaders" in April 2026 [15] | Original format: 50 cards, mana value 3 at most; Reborn dropped the colour identity rule [15]                              | Not checked                                                                                              | Ban and watchlist posts from September 2025 to April 2026 [15]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Duel Commander's governance split.** The committee's former site, mtgdc.info, now says "As of March 3, 2026, Duel Commander is replaced with a more advanced game system called AeonShift" [5]. The committee's own account says a former Technical Coordinator took control of its accounts, that mtgdc.info is "No longer official", and that "Only announcements from the collegial Committee are official" [4]. AeonShift is a separate points-based singleton game [6]. The committee posted a 2026-07-27 banned-list update and a 2026-09-28 "No change" announcement on duelcommander.org [1][3]. A product that names a source must therefore name the right one.

**Scryfall already encodes most of this.** Card objects carry legalities for `duel`, `paupercommander`, `predh`, `oathbreaker`, `brawl`, `standardbrawl`, `competitivebrawl` and `tlr` [9]. Three findings decide the design:

1. Scryfall uses `restricted` for "banned as commander" in `duel`. Its 27 `restricted:duel` cards match the committee's list exactly, including Lumra, Spider-Man 2099 and The Fantasticar from 2026-07-27 [3][9]. `competitivebrawl` and `tlr` hold 12 restricted cards each [9]. In Vintage, `restricted` means one copy. The same word needs a meaning per format.
2. `paupercommander` covers only the 99. Tatyova, Benthic Druid, an uncommon creature, is `not_legal` there [9], although PDH's rules allow it as a commander [10].
3. `brawl` is Arena's 100-card Brawl. Najeela is `brawl: legal` but `standardbrawl: not_legal` [9].

Scryfall returns 250 cards for `banned:duel` [9], against 80 named cards plus structural categories on the committee's page [3]. That gap was not reconciled here.

### Audience signals

| Signal                                        | Reading                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MTGTop8 Duel Commander                        | Its "EDH" format is Duel Commander, with a separate cEDH filter. The 20 latest events ran from 2026-11-04 to 2026-11-08: five in the Philippines, two each in France, the Czech Republic and Spain, one each in China, Québec, Italy, Switzerland, Sweden and Mexico, and three online, one of them an MTGO league. Two Relic Fest events at Labège, France, on 2026-10-31 and 2026-11-01 appear elsewhere on the page. Stars only, no player counts [7] |
| French Duel Commander Metagame Project        | Started in Rennes. Players submit results by form and organisers export Eventlink data. Publishes a matchup matrix, win rates with 95% intervals and meta share, updated each evening. English interface. Code GPL-3.0; data licence not stated [8]                                                                                                                                                                                                      |
| TopDeck.gg                                    | Its site menu lists Duel Commander, Pauper EDH, Canadian Highlander and 7pt Highlander next to EDH [18]                                                                                                                                                                                                                                                                                                                                                  |
| Reddit, **estimates** from a third party      | r/CompetitiveEDH about 120,000 members (page updated 2026-11-04); r/PauperEDH about 24,000 (page updated 2026-10-15) [23]. No figure found for a Duel Commander or Oathbreaker subreddit; Reddit refused automated reads                                                                                                                                                                                                                                 |
| Deck share by format on Moxfield or Archidekt | Not public. Not found                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Competitors

| Product          | Variant support found                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Moxfield**     | Formats include Brawl, Canadian Highlander, Oathbreaker and Duel Commander; legality is shown "and where it failed", with points for Highlander formats. No Pauper EDH in this list, which was last edited 2020-10-14 [19]. Its site refuses automated reads |
| **Archidekt**    | Deck pages titled "Duel Commander deck" and "1v1 Commander deck" (search results) [20]. Legality behaviour not verified; its terms forbid automated queries                                                                                                  |
| **EDHREC**       | Commander only. A search found no Duel Commander or Pauper Commander section                                                                                                                                                                                 |
| **TappedOut**    | Card legality tables list Duel Commander, Pauper EDH and Canadian Highlander (search result) [21]                                                                                                                                                            |
| **MTGTop8**      | Duel Commander event results and metagame, plus a cEDH filter [7]                                                                                                                                                                                            |
| **MTGGoldfish**  | A Duel Commander metagame page and an article on deck support for Duel Commander and Canadian Highlander with automatic points checking (search results; both pages answered 403) [22]                                                                       |
| **mtgdecks.net** | Duel Commander decklists from events, French ones included (search results) [24]                                                                                                                                                                             |
| **ManaBox**      | Not verified. Its App Store notes mention Timeless and PreDH legalities (search result) [25]                                                                                                                                                                 |

**What French players use, and the gap.** The Duel Commander resources found, MTGTop8, mtgdecks.net and the Rennes metagame project, all have English interfaces [7][8][24]. The research found no French-language deckbuilder that checks Duel Commander legality, banned-as-commander included. None of the competitor pages read states which version or date of a list its legality check applies. The gap a bilingual tool can fill is narrow and concrete: a French and English Duel Commander builder that names its banned list and its date, plays at 20 life without a free mulligan, and keeps Duel Commander results apart from multiplayer Commander.

## Current state in this codebase

Verified on `dev` (`61792c1`) on 2026-11-09.

- **Formats are data.** `src/lib/deck/formats.ts` defines `DeckFormat` as nine formats and `FORMAT_CONFIG` with deck size, singleton, commander slot, bracket scoring, colour identity, `scryfallLegality`, `startingLife` and `firstMulliganFree` (#1301). `getFormatConfig` returns Commander for any unknown string. `ALL_FORMATS` feeds the Zod enums in `src/lib/validation/deck.ts` and `src/app/api/decks/route.ts`.
- **No format picker is reachable.** `src/components/deck/FormatSelector.tsx` exists since #299 but is never rendered; `git log -S "<FormatSelector"` finds no use. `createDeck` in `src/lib/deck/store.ts` sends no format, and the wizard and header create Commander decks. `POST /api/decks` and `PATCH /api/decks/[id]` accept `format`, so the eight other formats exist only through the API.
- **Banned flags drift silently.** `src/hooks/useBanlist.ts` fetches `banned:<key>` from Scryfall and caches it for 24 hours. The builder page passes the deck's format to it. The store sets `isBanned` when a card is added, the client sends it to `POST /api/decks/[id]/cards`, and the server stores it unchecked. Nothing recomputes it on load or when a list changes. `src/lib/deck/validation.ts` reads the stored flag. `restricted` is never read there; `src/lib/community/verified-package-cards.ts` treats it as allowed.
- **The commander search ignores the format.** `buildCommanderSearchQuery` in `src/lib/scryfall/search.ts` sends `is:commander` with no `legal:` filter. Scryfall's `is:commander` returns 45 planeswalkers, against 310 legal in Oathbreaker and every legendary planeswalker allowed in Brawl [9][12]. It never excludes a banned-as-commander card.
- **Brawl mixes two formats.** `FORMAT_CONFIG.brawl` checks Arena Brawl's card pool (`brawl`) against a 60-card deck at 30 life, the tabletop size and multiplayer life [9][12][13].
- **Imports never set a format.** `src/lib/import/url-import.ts` adds cards to the open deck. Its Moxfield check accepts `duel` as Commander-like without a warning; Archidekt warns for any `deckFormat` other than 3.
- **Duel Commander data is shown in Commander decks.** `src/lib/meta/mtgtop8.ts` notes that MTGTop8's "EDH" is "overwhelmingly Duel Commander", and `src/components/deck/MetaPanel.tsx` shows the source's format label beside each result.
- **The playtest reads the format.** `src/lib/playtest/store.ts` takes `startingLife` and `firstMulliganFree` from `FORMAT_CONFIG`. The engine models no commander tax, no commander damage and no limit on commander casts. I-07 records a follow-up for a per-session multiplayer choice.
- **Brackets stop at 4.** `BracketLevel` in `src/lib/constants/brackets.ts` and `src/lib/deck/types.ts` is `1 | 2 | 3 | 4`; `src/lib/playtest/keep-rules.ts` already uses 5 for cEDH. Bracket scoring runs only where `hasBracketScoring` is set, but `setCommander` shows the Game Changer toast in every format.
- **Labels are English.** Format labels live in `FORMAT_CONFIG`, and the banned and singleton messages in `validation.ts` are English strings, not catalogue entries.

| Variant             | Today                                          | Why                                                                                                                                                                |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commander           | Works                                          | Config, `banned:commander`, 40 life, free mulligan                                                                                                                 |
| cEDH                | Works as Commander; bracket 5 missing          | Same rules. Bracket 5 is I-28 slice 2                                                                                                                              |
| Duel Commander      | Missing, and its data lands in Commander decks | No `duel` format, so a Duel Commander list is a Commander deck: 40 life, free mulligan, Commander's list. Sol Ring is legal there and banned in Duel Commander [9] |
| Pauper Commander    | Missing                                        | No config; Scryfall's key covers only the 99                                                                                                                       |
| Oathbreaker         | Half-works, not reachable from the UI          | Config and list are right; no planeswalker search and no Signature Spell slot                                                                                      |
| Brawl               | Half-works, not reachable from the UI          | Arena pool, tabletop size, multiplayer life                                                                                                                        |
| Standard Brawl      | Missing                                        | `standardbrawl` unused                                                                                                                                             |
| Canadian Highlander | Missing                                        | No points model                                                                                                                                                    |
| Tiny Leaders        | Missing                                        | `tlr` unused                                                                                                                                                       |

## Functional requirements

### 1. Variants as deterministic data

1.1 Each variant is one `FORMAT_CONFIG` entry: deck size, life for two players and for more, commander eligibility rule, number of commanders, free mulligan by player count, commander damage threshold or none, command-zone cast limit, Scryfall key, rules source URL and rules version date.
1.2 Legality is computed from card data and this config only. No model call decides or explains a verdict ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.3 An unknown stored format is reported as unsupported. It is never validated as Commander.
1.4 Format names and every legality message come from the English and French catalogues. "Duel Commander" keeps its English name in French until a native reviewer decides otherwise.

### 2. Dated, refreshable lists with no silent drift

2.1 The server computes each card's status from Scryfall `legalities`: legal, not legal, banned, or restricted with its per-format meaning. In `duel`, `competitivebrawl` and `tlr`, restricted means "banned as commander"; in `vintage` it means one copy.
2.2 Legality is recomputed when a deck loads and when its format changes. A client-sent `isBanned` is never trusted.
2.3 Each verdict shows its list: the maintainer's page, the maintainer's last change date, and the date the card data was fetched.
2.4 A scheduled check compares Scryfall's list with the maintainer's page for each variant that has one. Duel Commander comes first: 27 banned as commander, 80 banned in the deck. A mismatch marks the list "under review" in the UI and opens an issue. The product never silently picks one side.
2.5 A source register records each maintainer, with the date read. For Duel Commander it names duelcommander.org and records mtgdc.info as no longer maintaining the format [4][5].
2.6 When a list version changes, saved decks in that format show the new ban or unban with its date.

### 3. Duel Commander

3.1 A deck has 100 cards including its commander or commanders, is singleton, and follows colour identity. Partner, friends forever and backgrounds follow CR 903 [2].
3.2 The playtest starts at 20 life with no free mulligan. Duel Commander's rules cite only the London mulligan [2], and CR 103.5c makes the first mulligan free only in multiplayer and Brawl games [12]. This is an inference until open question 1 is answered.
3.3 The commander picker excludes cards banned as commander. Those cards stay legal in the 99.
3.4 With two commanders, the playtest allows only one of them to be cast from the command zone per game, the first one cast, per the committee's rule 404.1 [2]. No commander damage is tracked or warned about.
3.5 Bracket scoring, Game Changer counts and Game Changer toasts do not run in Duel Commander.
3.6 A Moxfield, Archidekt or MTGTop8 import identified as Duel Commander offers to create a Duel Commander deck. It never adds those cards silently to a Commander deck.
3.7 In a Duel Commander deck, MTGTop8 results count as same-format evidence. In a Commander deck they carry the label "Duel Commander (1v1), different banned list".

### 4. Choosing and switching a format

4.1 A player chooses the format when creating a deck and can change it in deck settings. Commander variants are grouped apart from constructed formats.
4.2 Switching re-validates at once and lists what breaks. No card is removed.
4.3 Where a format is played both ways (Commander, Brawl, Oathbreaker), the playtest asks for the player count. The count sets life and the free mulligan. This closes I-07's follow-up from #1301. _Noted 2026-11-11:_ the player count cannot model Arena's Competitive Brawl. Both Arena modes are two-player, with a free mulligan in normal Brawl and none in Competitive Brawl [26].

### 5. Pauper Commander (Later)

5.1 A commander is eligible if it is a creature, Vehicle or Spacecraft printed at uncommon in at least one paper or MTGO printing; Arena-only printings do not count [10]. Eligibility is computed from Scryfall printings, not from `paupercommander`, which marks such commanders not legal [9].
5.2 The 99 use `paupercommander` legality. Life is 30.

### 6. Oathbreaker and Brawl (Later)

6.1 An Oathbreaker deck has a planeswalker Oathbreaker and a Signature Spell slot: one instant or sorcery inside the Oathbreaker's identity, counted in the 60 cards [11].
6.2 Brawl splits in two. `brawl` is Arena Brawl: 100 cards, 25 life, Scryfall `brawl`. `standardbrawl` is the tabletop format: 60 cards, 25 life for two players and 30 for more [12][13]. Both accept any legendary planeswalker as commander and ignore commander damage (903.12h). Existing Brawl decks keep their cards and are asked which one they are.

### 7. cEDH

7.1 cEDH is Commander at bracket 5, not a separate format. It uses Commander's list and rules. Bracket 5 belongs to [I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 2.
7.2 A deck at bracket 5 links out to the commander's EDHTop16 page and to a cEDH Decklist Database search. Nothing is copied.
7.3 TopDeck.gg data appears in no paid feature: its terms forbid commercialising API data (§7) [18]. Tournament win rates stay blocked as I-09 records.

### 8. Points and small formats

8.1 Canadian Highlander (Later): the points list is dated data with its cap, and the check shows points used against 10 [14]. The page shows no date, so the source register records the date it was read.
8.2 Tiny Leaders Reborn (Parked): Scryfall's `tlr` key would support it [9]. It ships only with evidence of demand.

### 9. What is free and what could be paid

9.1 Free, per I-30 1.1: every legality verdict and its list date, the format picker, variant life and mulligan in the playtest, and banned-list pages.
9.2 Paid candidate: an automatic watch on a player's saved decks in every variant, flagging bans, unbans and banned-as-commander changes. I-30 already lists "watching one's decks" (I-18) for the same reason: it is a scheduled job per player.
9.3 Paid candidate: personal Duel Commander matchup statistics from games the player logs ([I-35](i35-pod-game-log.md)), never from TopDeck.gg or another site's data.

## Data model / API

```text
FormatConfig   + lifeTwoPlayer, lifeMultiplayer, defaultPlayers (2|4)
               + commanderRule: commander | brawl | oathbreaker | pauperCommander | none
               + restrictedMeans: oneCopy | notAsCommander | none
               + commandZoneCasts: each | firstOnly
               + commanderDamage: number | null
               + rulesSource { url, version }
DeckFormat     + duel (slice 3); paupercommander, standardbrawl (Later); canadianhighlander, tlr (Later or Parked)
FormatList     format, maintainerUrl, maintainerChangedAt, scryfallFetchedAt,
               bannedCount, notAsCommanderCount, status (ok|underReview), checkedAt
CardLegality   computed per deck load: status, reason, listId; not persisted on DeckCard
```

`PATCH /api/decks/[id]` with `format` returns the validation result for the new format. The `isBanned` field on `DeckCard` becomes derived; a migration keeps the column until every reader uses the computed status.

## Non-goals

- AeonShift. It is a separate points-based game, not a Commander variant [6].
- An LLM in legality, eligibility or banned-list parsing.
- Tournament win rates for any variant (I-09's licence block).
- A table companion: life tracking and commander damage during a real game.
- Every casual variant. Planechase, Archenemy and Commander Draft stay out.
- Scraping maintainers' pages beyond one scheduled read of each banned list for the drift check.

## Testing strategy

- **Golden legality fixtures per variant.** Lumra as a Duel Commander commander is an error; Lumra in the 99 is legal; Sol Ring is banned in Duel Commander and legal in Commander. Tatyova leads a PDH deck but cannot sit in its 99. A planeswalker Oathbreaker is accepted.
- **Restricted semantics.** One table-driven test per format maps `restricted` to its meaning, and fails if a new Scryfall key appears without a mapping.
- **Drift.** The scheduled check runs against recorded fixtures in CI and against the live pages only on schedule, so the network never fails a build.
- **Playtest.** Duel Commander starts at 20 with no free mulligan; once one partner has been cast from the command zone, the other cannot be.
- **Switching.** Changing a 100-card Commander deck to Duel Commander removes no card and lists every violation.
- **Catalogues.** Every format label and legality message exists in English and French.

## Delivery slices

| #   | Slice                                                                                                                                                                                                               | Depends on              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Format picker at creation and in deck settings; switching re-validates and removes nothing; labels from catalogues                                                                                                  | —                       |
| 2   | Server-computed legality from Scryfall per deck load, with per-format `restricted` meaning and the fetch date shown _(2026-11-10: I-67 slices 9 and 10 later switch the source to local tables; no new dependency)_ | —                       |
| 3   | Duel Commander format and the new `FormatConfig` fields: `duel` key, 100 cards, 20 life, no free mulligan, no bracket scoring, banned-as-commander excluded                                                         | 1, 2                    |
| 4   | Duel Commander playtest: one commander cast from the command zone per game                                                                                                                                          | 3                       |
| 5   | Duel Commander imports and meta labels: Moxfield, Archidekt and MTGTop8 decks offer a Duel Commander deck                                                                                                           | 3                       |
| 6   | Source register and drift check, Duel Commander first; "under review" state                                                                                                                                         | 2                       |
| 7   | Player-count choice in the playtest for Commander, Brawl and Oathbreaker                                                                                                                                            | 3                       |
| 8   | Brawl split into Arena Brawl and Standard Brawl, legendary planeswalker commanders, migration of existing decks                                                                                                     | 3                       |
| 9   | Oathbreaker: planeswalker search and Signature Spell slot                                                                                                                                                           | 3                       |
| 10  | Pauper Commander: commander eligibility from printings, 30 life                                                                                                                                                     | 3                       |
| 11  | Ban and unban notices on saved decks when a list version changes                                                                                                                                                    | 6                       |
| 12  | cEDH link-outs to EDHTop16 and the cEDH Decklist Database on bracket 5 decks                                                                                                                                        | I-28 slice 2            |
| 13  | Canadian Highlander points                                                                                                                                                                                          | 3, 6                    |
| 14  | Tiny Leaders Reborn through `tlr`                                                                                                                                                                                   | **Parked** on demand; 3 |

Slices 1 and 2 ship alone: they make the nine existing formats reachable and their banned flags current. Slice 3 is the first a Duel Commander player can use, and it fixes the shape of `FormatConfig`, so the later variant slices wait for it rather than collide on the same file. Slice 11 is the free notice; the automatic watch across all decks is I-18's paid candidate.

## Open questions

1. **Is the first mulligan free in Duel Commander?** The committee cites only the London mulligan, and CR 103.5c excludes two-player games outside Brawl, so this spec assumes no. Ask the committee to confirm before slice 3 ships.
2. **Which Duel Commander list is canonical when sources disagree?** Scryfall matches duelcommander.org on the 27 banned-as-commander cards, but returns 250 banned cards against 80 named ones. Reconcile the gap, and check whether MTGO's Duel Commander list matches.
3. **Can Duel Commander metagame data be shown at all?** MTGTop8's terms were not reviewed, although I-09 already reads it. The Rennes project's code is GPL-3.0 and its data licence is not stated; ask its author. TopDeck.gg forbids commercial use. These go to the lawyer questions in I-30.
4. **How is "printed at uncommon" computed for PDH?** Downshifted reprints, The List, Secret Lair and MTGO-only printings need rules, and PDH Home Base publishes no committee or list date.
5. **Should "1v1 Commander" be its own variant?** Archidekt lists it beside Duel Commander [20]. It would use Commander's list at a two-player life total that no fetched source states.
6. **Canadian Highlander's list date.** The points page shows no date. Can the maintainers publish one, or must the register rely on the date read?

## Sources

1. Duel Commander Rules Committee, home page; latest announcement dated 2026-09-28. https://www.duelcommander.org/ (read 2026-11-09)
2. Duel Commander Comprehensive Rules, version 2025.09.29, rules 301.1, 302.2, 304.2, 401.1, 401.2, 403.1, 404.1. https://www.duelcommander.org/rules/duelcommander_comprehensiverules/ (read 2026-11-09)
3. Duel Commander banned list, last updated 2026-07-27. https://www.duelcommander.org/banlist/ (read 2026-11-09)
4. Duel Commander Rules Committee, situation statement (undated). https://www.duelcommander.org/situation (read 2026-11-09)
5. mtgdc.info, home and announcements; the AeonShift notice dated 2026-03-03. https://www.mtgdc.info/ and https://www.mtgdc.info/announcements (read 2026-11-09)
6. Draftsim, "Duel Commander banlist", last updated 2026-07-27. https://draftsim.com/mtg-duel-commander-banlist/ (read 2026-11-09)
7. MTGTop8, Duel Commander format page, last 20 events. https://www.mtgtop8.com/format?f=EDH (read 2026-11-09)
8. French Duel Commander Metagame Project, https://mwapl.github.io/dc-metagame/, and its repository, GPL-3.0, last push 2026-11-09, https://github.com/mwapl/dc-metagame (read 2026-11-09)
9. Scryfall API, card objects and searches, for example https://api.scryfall.com/cards/named?exact=Lumra,%20Bellow%20of%20the%20Woods and https://api.scryfall.com/cards/search?q=restricted%3Aduel (queried 2026-11-09)
10. PDH Home Base, rules. https://www.pdhhomebase.com/rules (read 2026-11-09)
11. Oathbreaker rules and banned list. https://oathbreakermtg.org/rules/ (read 2026-11-09)
12. Magic: The Gathering Comprehensive Rules, 2026-02-27, rules 103.5c, 903.7 and 903.12, in this repository: [`docs/rules/magic-comp-rules-20260227.txt`](../../rules/magic-comp-rules-20260227.txt)
13. Draftsim, "MTG Arena Historic Brawl", last updated 2026-08-17. https://draftsim.com/mtg-arena-historic-brawl/ (read 2026-11-09)
14. Canadian Highlander, points list. https://www.canadianhighlander.ca/points-list/ (read 2026-11-09)
15. Tiny Leaders Reborn, "The Next Chapter: Welcome to the new Official Home of Tiny Leaders", April 2026, and its 2025 recap. https://tiny-leaders-reborn.blogspot.com/2026/04/the-next-chapter-welcome-to-new.html, https://tiny-leaders-reborn.blogspot.com/2025/12/tlr-2025-recap.html (search results, 2026-11-09; not fetched)
16. EDHTop16, `llms.txt`, last updated 2025-01-03. https://edhtop16.com/llms.txt (read 2026-11-09)
17. cEDH Decklist Database, https://cedh-decklist-database.com/, and its repository, MIT, last push 2026-08-23, https://github.com/cEDH-Decklist-Database/cEDH-Decklist-Database (read 2026-11-09)
18. TopDeck.gg Developer Terms, effective 2026-10-27, §6.1, §7, §8.2, §8.3. https://topdeck.gg/developer-terms (read 2026-11-09)
19. Moxfield public wiki, "Features", last edited 2020-10-14. https://github.com/moxfield/moxfield-public/wiki/Features (read 2026-11-09)
20. Archidekt deck pages titled "Duel Commander deck" and "1v1 Commander deck". https://archidekt.com/decks/10507578/dual_duel, https://archidekt.com/decks/11198546/edh_duel_commander (search results, 2026-11-09)
21. TappedOut, card legality page. https://tappedout.net/mtg-card/woodland-druid (search result, 2026-11-09)
22. MTGGoldfish, Duel Commander metagame, https://www.mtggoldfish.com/metagame/duel_commander, and "New deck support: Penny Dreadful, Duel Commander, Canadian Highlander", https://www.mtggoldfish.com/articles/new-deck-support-penny-dreadful-duel-commander-canadian-highlander (search results, 2026-11-09; both answered 403)
23. GummySearch, r/CompetitiveEDH (page updated 2026-11-04), https://gummysearch.com/r/CompetitiveEDH, and r/PauperEDH (page updated 2026-10-15), https://gummysearch.com/r/PauperEDH/ (read 2026-11-09). Third-party estimates.
24. mtgdecks.net, Duel Commander decklists. https://mtgdecks.net/Duel-Commander/decklists/page:11/sort:rank/direction:asc (search result, 2026-11-09)
25. ManaBox on the App Store. https://apps.apple.com/us/app/manabox/id1460407674 (search result, 2026-11-09)
26. Wizards of the Coast, "Introducing Ranked Brawl", 2026-06-08; added 2026-11-11. https://magic.wizards.com/en/news/mtg-arena/introducing-ranked-brawl

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

### Goals

- A player creates a Duel Commander deck, sees each verdict with its list and date, cannot put a banned-as-commander card in the command zone, and playtests at 20 life with no free mulligan; no Duel Commander list lands in a Commander deck unless the player chooses it.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-42-01

As a player building a format other than Commander, I want to pick the format and see a dated ban list, so that a Duel Commander list is not saved as Commander.

#### US-42-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-42-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-42-01 Happy path

Given a signed-in player and the English locale
When creation and deck settings offer a format.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-42-02 Happy path

Given a signed-in player and the English locale
When legality is computed on the server from a dated list.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-42-03 Happy path

Given a signed-in player and the English locale
When an unknown format is rejected, not treated as Commander.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-42-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-42-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-42-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in to change a deck. A guest's session deck can pick a format locally and the choice is saved with the deck at sign-up. Commander remains the default.

#### AC-42-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-42-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-42-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The format is in the deck header. Switching format shows the cards that would become illegal before it saves.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The format is a column on the deck. Banned flags come from the rules version, not from the browser. Duel Commander's mulligan waits on the committee's answer.

### Analytics and telemetry

`format_selected {format}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in to change a deck. A guest's session deck can pick a format locally and the choice is saved with the deck at sign-up. Commander remains the default.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether the first mulligan is free in Duel Commander is unanswered. Pauper Commander and the other variants stay Later.

### Sources

- https://magic.wizards.com/en/news/mtg-arena/introducing-ranked-brawl

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-42-101

As a player, I want the product to a format picker at creation and in deck settings; switching re-validates and removes no card (slice 1)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A format picker at creation and in deck settings; switching re-validates and removes no card (slice 1). Today src/components/deck/FormatSelector.tsx is never rendered and createDeck sends no format, so every deck created in the app is a Commander deck. Duel Commander lists from the MTGTop8 meta panel (src/lib/meta/mtgtop8.ts, src/components/deck/MetaPanel.tsx) and Moxfield duel imports (src/lib/import/url-import.ts) land in those decks, with the multiplayer banned list, 40 life and the free mulligan.

#### AC-42-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-102 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-42-102

As a player, I want the product to legality computed on the server from Scryfall at each deck load, with a per-format meaning for restricted and the fetch date shown; a client-sent isBanned is never trusted (slice 2)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Legality computed on the server from Scryfall at each deck load, with a per-format meaning for restricted and the fetch date shown; a client-sent isBanned is never trusted (slice 2).

#### AC-42-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-42-103

As a player, I want the product to a Duel Commander format: 100 cards, 20 life, no free mulligan, no bracket scoring or Game Changer toast, and banned-as-commander cards excluded from the commander picker (slice 3)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A Duel Commander format: 100 cards, 20 life, no free mulligan, no bracket scoring or Game Changer toast, and banned-as-commander cards excluded from the commander picker (slice 3).

#### AC-42-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-108 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-42-104

As a player, I want the product to one commander cast from the command zone per game with two commanders, and imports and meta labels that offer a Duel Commander deck instead of adding its cards silently to a Commander deck (slices 4–5)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: One commander cast from the command zone per game with two commanders, and imports and meta labels that offer a Duel Commander deck instead of adding its cards silently to a Commander deck (slices 4–5).

#### AC-42-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-111 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-42-105

As a player, I want the product to a source register that names duelcommander.org, and a scheduled drift check against Scryfall that marks a list "under review" on a mismatch (slice 6)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A source register that names duelcommander.org, and a scheduled drift check against Scryfall that marks a list "under review" on a mismatch (slice 6).

#### AC-42-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-42-106

As a player, I want the product to later: a player-count choice in the playtest, which closes I-07's follow-up from #1301; the Brawl split; Oathbreaker; Pauper Commander; ban notices on saved decks; cEDH link-outs; Canadian Highlander; and Tiny Leaders, parked on demand (slices 7–14)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: a player-count choice in the playtest, which closes I-07's follow-up from #1301; the Brawl split; Oathbreaker; Pauper Commander; ban notices on saved decks; cEDH link-outs; Canadian Highlander; and Tiny Leaders, parked on demand (slices 7–14).

#### AC-42-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-42-107

As a player, I want the product to correct the Brawl row (2026-11-11) and record Arena's Competitive Brawl: ten banned commanders, deck composition "not a factor for matchmaking", and "There is no free mulligan in Competitive Brawl" (Wizards, 2026-06-08)., so that a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

#### AC-42-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Correct the Brawl row (2026-11-11) and record Arena's Competitive Brawl: ten banned commanders, deck composition "not a factor for matchmaking", and "There is no free mulligan in Competitive Brawl" (Wizards, 2026-06-08). Wizards' own article dates Ranked Brawl to an event "From June 2–15" and Competitive Brawl to "June 23"; it never mentions 2023, and no source for a 2023 ranked Brawl was found. Requirement 4.3 sets the free mulligan by player count, which cannot model Arena's two-player Competitive Brawl. Added 2026-11-11.

#### AC-42-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-42-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

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

## I-42: Commander Variants: Duel Commander, cEDH, Pauper Commander And Others

**Spec:** [`specs/i42-commander-variants-duel-cedh-pauper.md`](i42-commander-variants-duel-cedh-pauper.md)

**Outcome:** a player chooses a deck's format, sees each legality verdict with its named, dated list, and builds and playtests a Duel Commander deck at 20 life with no free mulligan and no banned-as-commander card in the command zone.

**Status:** Next
**Priority:** Next for the format picker, legality and Duel Commander (slices 1 to 6); Later for the other variants
**Impact / effort:** High / medium
**Depends on:** the Duel Commander Rules Committee's answer on the mulligan before slice 3 ships; I-28 slice 2 for bracket 5 and the cEDH link-outs.

The roadmap lists nine formats as a completed foundation, but no screen lets a player choose one, and Duel Commander data already reaches Commander decks. Duel Commander is a 1v1 variant at 20 life, with its own committee and a banned list of 80 cards in the deck and 27 as commander only, last updated 2026-07-27. MTGTop8's 20 latest Duel Commander events came from ten countries and online play, France included. Scryfall already encodes most variants, but it uses `restricted` for "banned as commander" in `duel` and for one copy in Vintage. The committee's former site, mtgdc.info, now announces AeonShift, and the committee says that site is no longer official, so a product must name the right source. No French-language deckbuilder found checks Duel Commander legality, and no competitor page read states the date of the list it applies.

### Scope

- [ ] A format picker at creation and in deck settings; switching re-validates and removes no card (slice 1). Today `src/components/deck/FormatSelector.tsx` is never rendered and `createDeck` sends no format, so every deck created in the app is a Commander deck. Duel Commander lists from the MTGTop8 meta panel (`src/lib/meta/mtgtop8.ts`, `src/components/deck/MetaPanel.tsx`) and Moxfield `duel` imports (`src/lib/import/url-import.ts`) land in those decks, with the multiplayer banned list, 40 life and the free mulligan.
- [ ] Legality computed on the server from Scryfall at each deck load, with a per-format meaning for `restricted` and the fetch date shown; a client-sent `isBanned` is never trusted (slice 2).
  - [x] Build the legality verdict on the server from Scryfall card data, never from the browser's stored flag, and answer `unsupported_format` for an unknown format (#1330, 2026-11-10): slice 2, server side only, by its own message.
- [ ] A Duel Commander format: 100 cards, 20 life, no free mulligan, no bracket scoring or Game Changer toast, and banned-as-commander cards excluded from the commander picker (slice 3).
- [ ] One commander cast from the command zone per game with two commanders, and imports and meta labels that offer a Duel Commander deck instead of adding its cards silently to a Commander deck (slices 4–5).
- [ ] A source register that names duelcommander.org, and a scheduled drift check against Scryfall that marks a list "under review" on a mismatch (slice 6).
- [ ] Later: a player-count choice in the playtest, which closes I-07's follow-up from #1301; the Brawl split; Oathbreaker; Pauper Commander; ban notices on saved decks; cEDH link-outs; Canadian Highlander; and Tiny Leaders, parked on demand (slices 7–14).
  - The ban notices on saved decks (slice 11) should reuse [I-48](i48-official-changes-reach-every-deck.md) slice 5's notice and dated report rather than build a second notice.
  - #1334 shipped the per-session multiplayer choice in the playtest (2026-11-10), part of 4.3.
- [ ] Correct the Brawl row (2026-11-11) and record Arena's Competitive Brawl: ten banned commanders, deck composition "not a factor for matchmaking", and "There is no free mulligan in Competitive Brawl" ([Wizards](https://magic.wizards.com/en/news/mtg-arena/introducing-ranked-brawl), 2026-06-08). Wizards' own article dates Ranked Brawl to an event "From June 2–15" and Competitive Brawl to "June 23"; it never mentions 2023, and no source for a 2023 ranked Brawl was found. Requirement 4.3 sets the free mulligan by player count, which cannot model Arena's two-player Competitive Brawl. Added 2026-11-11.

### Engineering enablers

- Golden legality fixtures per variant: Lumra as a Duel Commander commander is an error and is legal in the 99; Sol Ring is banned in Duel Commander and legal in Commander.
- A table-driven test maps `restricted` for each format and fails when a new Scryfall key appears without a mapping.
- The drift check runs on recorded fixtures in CI and against the live pages only on schedule.
- Every format label and legality message exists in English and French, and no model decides or explains a verdict.

**Paid-tier angle:** every verdict and its list date, the picker, variant life and mulligan, and banned-list pages stay free. Candidates are an automatic watch over a player's saved decks for bans and unbans, which joins I-18's candidate, and personal Duel Commander matchup statistics from the player's own I-35 logs, never from TopDeck.gg data.

### Enrichment (2026-11-11)

**User story.** As a player building a format other than Commander, I want to pick the format and see a dated ban list, so that a Duel Commander list is not saved as Commander.

**Acceptance.**
- Creation and deck settings offer a format.
- Legality is computed on the server from a dated list.
- An unknown format is rejected, not treated as Commander.

**UX.** The format is in the deck header. Switching format shows the cards that would become illegal before it saves.

**Data and API.** The format is a column on the deck. Banned flags come from the rules version, not from the browser. Duel Commander's mulligan waits on the committee's answer.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `format_selected {format}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in to change a deck. A guest's session deck can pick a format locally and the choice is saved with the deck at sign-up. Commander remains the default.

**Open questions.** Whether the first mulligan is free in Duel Commander is unanswered. Pauper Commander and the other variants stay Later.

### Definition of done

A player creates a Duel Commander deck, sees each verdict with its list and date, cannot put a banned-as-commander card in the command zone, and playtests at 20 life with no free mulligan; no Duel Commander list lands in a Commander deck unless the player chooses it.

---

