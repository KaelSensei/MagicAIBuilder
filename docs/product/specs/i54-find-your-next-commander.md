# I-54: Find Your Next Commander

> **Initiative:** I-54, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for the finder on card data, the wizard's commander step, the first-run entry and free text (slices 1 to 7, 9, 10 and 15); Later for signals computed from decks, indexable pages and the collection path (slices 8, 11 to 14 and 16), which wait for I-29, I-34 and I-16 · **Written 2026-11-10**
> **Research:** one dated note on commander finders, quizzes, random pickers, EDHREC and Scryfall browsing, and r/EDH requests. It is not committed, so every external fact links its own entry in [Sources](#sources). Points on terms are research, not legal advice.
> **Owns:** the commander catalogue and the signals computed for each commander, the play-style vocabulary and its definitions, the finder's filters and their visible query, the ranking and its "why it matches" lines, "not like my decks", the seeded random pick, the wizard's commander step, and the public finder pages with their page kind for the index policy. **Does not own:** turning a description into a query ([I-14](i14-verifiable-natural-language-search.md)); owned coverage and free copies ([I-16](i16-decks-buildable-from-a-collection.md)); the precon catalogue ([I-17](i17-precon-path-and-tiered-upgrades.md)); explanations of rules and terms ([I-27](i27-learning-while-building.md)); bracket names, rules and the bracket check ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the deck corpus and statistics computed from it ([I-29](i29-cross-site-deck-index.md)); the index policy and its thresholds ([I-34](i34-commander-data-reports.md)); the first-run panel and product events ([I-39](i39-first-run-activation-and-measurement.md)); the build route's prompt ([I-02](i02-checkable-ai-copilot.md)); dated regional prices ([I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2); public deck pages by commander ([I-08](i08-share-compare-and-learn.md)); Commander variants ([I-42](i42-commander-variants-duel-cedh-pauper.md)); plans and prices ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

"Which commander should I build next?" is a recurring r/EDH post. Titles containing "what commander" alone produced 22 distinct requests in 83 days, from 2026-08-19 to 2026-11-09 [22]. The players say what they want: a play style, colours, a bracket, what their other decks already do, how complicated a deck they can enjoy, and sometimes a budget for the whole deck, such as "I dont wanna spend more than 250€ and want a bracket 4 deck" [27]. The most discussed, "Looking for a Rakdos commander that doesn't tell me what to do", drew 255 comments [23]. The answers come from strangers in comment threads.

The tools found answer a narrower question. EDHREC ranks commanders by how many decks they lead and explains nothing beyond the count [1]. Its random button ignores every filter [4]. A quiz maps story questions to a commander by a method it calls "not scientific, but it's fun" [13]. MagicAIBuilder's own deck wizard, when the player skips the commander, asks a language model to "Choose the best commander".

This initiative narrows the 3,754 Commander-legal cards that Scryfall says "can be your commander" [9][11] with the filters the player sets. Every result says why it matches, one line per filter, each naming its signal and source: Scryfall card data, Scryfall's Tagger tags, MagicAIBuilder's public decks, licensed data, or the player's own decks and collection. No model chooses, orders or describes a commander. A model may only turn free text into the same visible filters, through I-14.

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Product                                                 | What the player tells it                                                                                    | How it ranks                                                                                                                          | What it explains                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **EDHREC** Top Commanders [1]                           | Colour identity; "2 Years", "Month" or "Week"; bracket 1–5 with a deck count each                           | "Most played commanders overall" (#1 Y'shtola, Night's Blessed, 59.3K decks); other sorts include price, salt and release date        | Rank and deck count only. No theme or budget filter on this page                                                      |
| **EDHREC** theme tags [2][3]                            | A theme (Tokens, 208,646 decks; Group Hug among many); colour; budget "$" or "$$$"                          | A tag page lists "Top Commanders" with no number or stated basis                                                                      | Recommendations come from "decks that are tagged with Group Hug"; who tags a deck, and how, is not stated             |
| **EDHREC** random [4]; article [5]                      | Nothing: `/random` opened a 102-deck commander page                                                         | —                                                                                                                                     | The 2024-11-26 article lists criteria: gameplay, colours, cards or combos, mana value, protection, and personal taste |
| **Scryfall** [9][10][11]                                | Any query: `is:commander`, colour identity, Oracle text, Tagger tags (`otag:`), prices; random with a query | By the sort chosen. `edhrec_rank` is "This card's overall rank/popularity on EDHREC", a card's rank, not a commander's                | The query is the explanation                                                                                          |
| **Grimoria** [12]                                       | Colour identity, type, theme (tribal, combo, voltron); a dice button; its generator takes a target bracket  | EDHREC "popularity ranking"                                                                                                           | No stated reason per commander. Its generator can prefer printings the player owns                                    |
| **Loreweaver** quiz, 2025-06-05 [13]                    | "story-driven questions"                                                                                    | A bracket, a play style and a suggested commander                                                                                     | The mapping is not described: "not scientific, but it's fun"                                                          |
| **Cards Realm** [14]                                    | A deck list, in the other direction                                                                         | "Best Commanders are", by a method not stated                                                                                         | Nothing shown                                                                                                         |
| **CommanderCrafter** [15][16], **Recommander** [17][18] | A commander or a deck link; Recommander also takes a collection as a source or a disallow list              | Cards for a deck: functional matches, or collaborative filtering "based on data from millions of other decks"                         | CommanderCrafter: "see why each card fits". Both recommend cards, not commanders                                      |
| **Archidekt** [19], **Moxfield**, **MTGGoldfish** [20]  | Archidekt orders decks by views, size or "EDH Bracket" and links a "Random commander"                       | Moxfield's browse answered HTTP 403. MTGGoldfish answered with a challenge page; a search snippet shows a meta share and a deck price | No commander browse on Archidekt                                                                                      |
| **Wizards** [21]                                        | —                                                                                                           | —                                                                                                                                     | "The Commander format is all about picking your hero and building a deck around them." No guidance on choosing found  |

**Data behind popularity.** EDHREC's Ms. Bumbleflower page counts 38,009 decks, and its bracket filter counts 9,636 of them across the five brackets [6]. **Computed:** 25.4% declare a bracket. Its average deck page shows per-card prices in euros and dollars but no total, and a budget switch with two levels, "Inexpensive" and "Expensive" [7]. A fan analysis on EDHREC measured commander similarity from the overlap of inclusion rates [8].

**What players ask for.** Our classification of the 18 requests that still have their text, out of the 22 found [22] (four were removed by moderators):

| Players state…                                                | Requests | Example                                                                               |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| A play style, theme or mechanic, wanted or excluded           | 17       | "No tutors", "No infinites", "No extra turns", "Creature heavy" [26]                  |
| Their other decks, as something to differ from or to resemble | 11       | "What kind of deck have I not made that I might enjoy?" [29]                          |
| A bracket or power level                                      | 10       | "Shooting for high 3 to high bracket 4" [31]                                          |
| Colours                                                       | 9        | "2 or 3 colors" [26]                                                                  |
| A budget: a limit or "cheap" (4), or "no limit" (3)           | 7        | "I dont wanna spend more than 250€" [27]                                              |
| Cards they own and want to reuse                              | 4        | A binder of cards bought "purely for the aesthetic" [24]                              |
| How complicated a deck they can enjoy                         | 2        | "Decks with endless triggers, complicated interactions … aren't really my thing" [25] |
| A commander nobody else plays                                 | 1        | "I also dont wanna be a player that plays a commander everyone is playing" [27]       |

Two more ask which precon to buy, and one asks how to decide at all (32 points, 95 comments) [30]. An earlier post, outside the window, lists the same kinds of criteria, down to "Distinct gameplan from my other decks" [28]. The search matched one phrasing of the title, so these counts are a lower bound. An r/EDHrecs subreddit was not found in the Arctic Shift index; only r/edhrec, with 2,140 subscribers, appeared [32].

**The gap.** No finder found combines a budget for the whole deck, a complexity preference and "not like my decks", and none explains each result against each filter. Popularity is the default order wherever an order is stated, while the roadmap's [boundaries](../roadmap.md#strategic-boundaries) say popularity is not advice. Random pickers ignore filters, except Scryfall's random endpoint with a query [11]. No finder reviewed ranks commanders by how much of a deck the player already owns, and none works in French. Scryfall's terms also bound what a page may be: "You may not simply repackage, republish, or proxy Scryfall data. Your software must create additional value for end-users" [33].

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **Commander search is a name search.** `buildCommanderSearchQuery` (`src/lib/scryfall/search.ts`) builds `is:commander`, a name regex and `id<=` colours. It has no theme, keyword, price or bracket input. `isCommanderEligible` (`src/lib/deck/commander-eligibility.ts`) applies CR 903.3 of 2026-08-07.
- **The full commander list cannot be paged in.** `fetchAllPages` (`src/lib/scryfall/client.ts`) stops at `PAGE_SAFETY_CAP = 20` pages. **Computed:** 20 × 175 = 3,500 cards, fewer than the 3,754 commanders [11]. Requests share one queue with `MIN_DELAY_MS = 100` (`request-queue.ts`). No job reads Scryfall bulk data; [I-67](i67-one-card-data-pipeline.md) builds the one job (re-pointed 2026-11-10 from I-29 slice 1).
- **The deck wizard lets a model pick the commander.** `DeckWizard` (`src/components/deck/DeckWizard.tsx`) asks budget, colours, strategy, bracket, then "Search for a specific commander, or let the AI choose." With no name, `src/app/api/ai/build/route.ts` sends "Choose the best commander whose color identity is EXACTLY {…}". The budget is per card: "$50 max per card" in the prompt and "Set a per-card spending limit for your deck." on the step, while the options read "< $50" and "$50 – $200". The wizard is mounted only on `/decks`, which needs a session.
- **Three play-style vocabularies.** The wizard offers 8 strategies, `ARCHETYPES` (`src/lib/ai/archetypes.ts`) lists 11 detected from card names, and `detectThemes` (`src/lib/deck/themes.ts`) finds 17 themes from keywords in a deck's text. Its Tokens rule counts "put a", which also matches counters.
- **Commander pages list decks only.** `/commanders/[slug]/decks` ranks public decks by votes. Since #1313 an empty listing carries `noindex` and no canonical, and a slug no commander can produce returns 404. The sitemap lists a commander once one public deck names it. There is no `/commanders` index or commander summary page; `/commanders` is a public prefix in `src/lib/auth/public-paths.ts`.
- **External data.** `fetchEdhrecData` (`src/lib/meta/fetch.ts`) reads EDHREC's top cards for one commander. I-29 rates EDHREC link-only under its terms, so the finder reads none of it.
- **Collection and prices.** `CollectionCard` stores `scryfallId` and quantity; I-16 is not built. `DeckCard.price` is Scryfall's undated `usd`. No Oracle ID is persisted.
- **Brackets.** `BracketLevel` stops at 4 (`src/lib/constants/brackets.ts`); I-28 slice 2 adds bracket 5.
- **First run.** `OnboardingWizard` is a four-step modal with no commander step. I-39 replaces it with an inline panel whose first action is "choose a commander (focuses search)". No natural-language search route exists; I-14 is not built.

## Functional requirements

### 1. Ground rules

1.1 **Deterministic.** Which commanders appear, their order and every explanation line come from the filters and the signals in groups 2 and 3. No finder route imports the AI client. Explanations are templates filled with values.
1.2 **Free and open.** The finder, its results, explanations, the random pick and the public pages work signed out and never need a plan [33]. Only inputs that read the player's own decks or collection need an account, and a free one is enough (group 9).
1.3 **Popularity is not advice.** The default order is never popularity. A popularity signal appears only from MagicAIBuilder's own corpus or licensed data, with its source, date and denominator. Scryfall's `edhrec_rank` is never shown as a commander's popularity [10].
1.4 **No hidden query.** The Scryfall part of the filters is shown as one query the player can open on Scryfall. Filters Scryfall cannot express are listed as chips, each linking its definition.
1.5 **Legal candidates only.** Every result passes `isCommanderEligible` and Commander legality, or the chosen variant's rules once I-42 ships.

### 2. Filters the player sets

2.1 **Colours:** exactly these, at most these, including these, excluding these, and a number of colours. They compile to Scryfall's identity syntax.
2.2 **Play style,** wanted or excluded: one shared vocabulary (group 4), such as combat, voltron, tokens, counters, spellslinger, combo, control, ramp, aristocrats, graveyard, group hug, politics, lands, artifacts, enchantments, blink, lifegain and kindred.
2.3 **Mechanics and creature types:** a keyword, a creature type in the type line or the text, or an Oracle text fragment.
2.4 **Complexity:** simple, medium or involved, from the score in 3.3.
2.5 **Bracket target.** A commander has no bracket; a deck does. The filter excludes commanders that are themselves Game Changers below bracket 3; three commanders are today [11][21]. Once slice 8 ships, it also shows how public decks led by the commander declare and score, per I-28's names.
2.6 **Budget for the whole deck,** as a total in euros or dollars. Only a commander with a full-deck cost estimate (3.4) can pass or fail it. Commanders without one appear in a separate "no estimate yet" group, never silently kept or dropped. The commander card's own price is shown apart, with its date.
2.7 **Cards I own:** after slice 12, the share of a reference list the collection covers, computed by I-16 with its free-copies mode.
2.8 **Not like my decks:** the player ticks some of their decks. A candidate sharing a ticked deck's exact colour identity or its main play style is marked, and the player chooses whether to exclude or only flag it.
2.9 **Like a commander I enjoy:** the player names commanders; candidates sharing their styles, keywords and colours rank higher, each shared trait listed.
2.10 **Pairs:** a partner, "Friends forever" or Background commander appears alone, marked with its pairing rule. Listing pairs whose combined identity meets the colour filter is a toggle, capped, and uses `commander-pairing.ts`.
2.11 **Previews** (added 2026-11-10 from [I-73](i73-every-set-release-ready-on-day-one.md#3-release-status-of-a-card)): an "Include previews" filter, off by default, widens the catalogue's `is:commander legal:commander` through I-73's `previewQuery`, and each preview commander shows its release date.

### 3. Signals, ranking and explanations

3.1 **Hard filters, soft preferences.** Each filter is either required or preferred, as the player sets it. Results are ordered by the number of preferences matched, then by the sort the player picks: newest, simplest, cheapest estimate, name, or seeded random.
3.2 **Why it matches.** Each result lists one line per filter: the evidence and its source, such as "Tokens: its text creates tokens (definition v3, Scryfall data of 2026-11-10)" or "Not like your decks: none of the 4 you ticked is Azorius". Unmet preferences are listed as "Doesn't match".
3.3 **Complexity score.** A published formula over the commander's own card: words of rules text, triggered and activated abilities, choices and modes, extra command-zone pieces, and colours. It shows its factors and band. It is labelled a product heuristic, versioned, and checked against an owner-labelled fixture.
3.4 **Full-deck cost estimate.** The median total of public decks led by the commander, from I-29's per-commander price statistics, in the market the player picks, with deck count and price date. It is withheld below I-29's minimum sample (I-29 6.3). It is never an average-deck price copied from another site.
3.5 **Funnel.** The page shows how many commanders remain after each filter. With zero results, it names the filter that removed the most and offers to relax it.
3.6 **Surprise me.** A random pick within the current filters, from a visible seed kept in the URL, so the same link gives the same pick.
3.7 **Next steps** on each result: the Scryfall card page; MagicAIBuilder's public decks for it, when any; the EDHREC commander page as a plain outbound link (I-29 3.2); the precon that contains it once I-17 knows; "Start a deck", which opens the guest builder with it in the command zone; and "Build with the wizard".

### 4. One play-style vocabulary

4.1 One list, in English and French, replaces the wizard's 8 strategies, `ARCHETYPES` and the `detectThemes` names. Each entry links an I-27 explanation when one exists.
4.2 Each style is a versioned definition of Tagger tags, Oracle text patterns, keywords and types. It compiles both to a Scryfall query fragment, for display, and to a local predicate over the bulk Oracle Cards and Oracle Tags files [34].
4.3 A daily conformance check runs each fragment on Scryfall and compares the count with the local predicate; a mismatch blocks the refresh and alerts the owner.
4.4 The owner labels a fixture of commanders per style. The precision and recall of each definition against it are published on the methods page (I-34 slice 3), and a definition whose precision falls below its floor is not offered.
4.5 Applied to a deck's cards, the same definitions give the deck's main styles, used by 2.8.

### 5. Free text, the wizard and the first run

5.1 **Free text.** A "Describe what you want" box calls I-14's translator with a finder target. It returns filters, never a result. Filters appear as chips before anything runs, and the player edits or confirms them.
5.2 The translator may return a commander name only when the player's text contains it (2.9), resolved to an exact Scryfall name. Text it cannot map is listed as "not understood", never dropped silently.
5.3 **Wizard.** "Help me choose" replaces "let the AI choose". It opens the finder with the wizard's colours, strategy, bracket and budget, and returns the pick to the wizard. The build route then always receives a commander; removing the prompt branch is I-02's change.
5.4 The wizard's budget step says whether its value is a per-card cap or a deck total. The finder passes a deck total.
5.5 **First run.** I-39's inline panel offers "Help me choose a commander" next to "choose a commander". I-39 owns the panel and its events.

### 6. Public pages and the index

6.1 Any filter set has a shareable URL under `/commanders/find`. It is always `noindex`, carries no canonical and never enters the sitemap.
6.2 Curated pages, `/commanders/find/[identity]/[style]` and, after slice 8, a budget band under them, are a new page kind in I-34's index policy. **Computed:** 32 identities (with colourless) times about 20 styles gives about 640 pages before budget bands.
6.3 A curated page is indexable only when the policy says so: enough results, each with a deck-based signal above I-29's minimum sample. Below that it renders for visitors with `noindex`, outside the sitemap, and is never blocked in robots.txt (I-34 4.3). A page built only from Scryfall card data is not indexable [33].
6.4 An empty page carries `noindex`, as #1313 did for commander pages. An identity or style slug that names nothing returns 404. No commander slug may equal a reserved segment such as `find`.
6.5 Pages carry no model-written text. A French page is indexable only after its style names and templates are reviewed (I-34 5.3).
6.6 **Example.** "Blue-black commanders for tokens under 100 euros" is `/commanders/find/dimir/tokens` with a budget band. Today Scryfall finds 17 exactly blue-black commanders with "token" in their text and 13 that "create" one [11]. The page shows which definition it used.

### 7. Data and freshness

7.1 The catalogue is keyed by Oracle ID and rebuilt daily from [I-67](i67-one-card-data-pipeline.md)'s card tables, joined to I-67's Oracle Tags by Oracle ID [34] (re-pointed 2026-11-10 to I-67 slices 2 and 7). It never pages through search. Because `/commanders` is already a public prefix, the finder's pages need no new public-path entry.
7.2 Each catalogue row records the bulk file's date. Prices show their date and are treated as stale after 24 hours, as Scryfall warns [34].
7.3 Deck-based signals come from I-29's statistics, with their corpus version. A deck made private leaves them at the next recompute.

### 8. Measurement

8.1 Through I-39's event contract: finder opened, filters used by kind (not their values), "Start a deck" from a result, and the wizard's "Help me choose". These answer one question: does the finder lead to a started deck?

### 9. What could be paid (I-30 decides)

9.1 **Never paid:** groups 1 to 7, popularity and price signals, public pages and saved finder profiles. Card data cannot be paywalled [33], and fan content cannot need a subscription (I-30).
9.2 **Candidate:** collection-aware ranking (slice 12): commanders ranked by how much of a reference list the player already owns, excluding copies committed to other decks, with the missing cost in their market. It is a computation on the player's own collection, the kind of tool [I-30](i30-business-model-and-paid-tier.md#2-candidate-paid-features) says players pay for.
9.3 **Why free tools skip it.** No finder reviewed ranks commanders by a collection. EDHREC's commander list and Scryfall search take none [1][9], Grimoria uses one only to prefer owned printings when it generates a deck [12], and Recommander filters card suggestions, not commanders [17]. The feature needs per-player storage and a computation over every commander's reference list.
9.4 **Weak case:** the value depends on I-16's demand test and on reference lists existing for enough commanders, which needs I-29. The owner should not price it before both.

## Data model / API

```
CommanderCatalog  oracleId @id, name, scryfallId, colorIdentity, typeLine, keywords[], pairingKind, gameChanger,
                  styleIds[], complexityScore, complexityFactors Json, releasedAt, cardPriceEur?, cardPriceUsd?,
                  priceDate?, bulkDate, styleVersion
CommanderStyle    id (slug), nameEn, nameFr, definition Json, scryfallFragment, version, precision?, recall?,
                  fixtureSize?, reviewedAt?
FinderProfile     id, userId, filters Json, styleVersion, createdAt, lastViewedAt
```

Routes: `GET /api/commanders/find?…` returns `{ query, chips, funnel, results: [{ commander, matched, missed, signals }], seed?, bulkDate, styleVersion }`, read-only and cacheable for signed-out requests. A request reading the player's decks or collection is not cached across accounts. `POST /api/search/translate` (I-14) gains `target: "commanderFinder"` and returns filters. Pages: `/commanders/find`, `/commanders/find/[identity]/[style]`.

## Non-goals

- A model that picks, ranks or describes commanders, or a "let the AI choose" path.
- Reading EDHREC, Moxfield or Archidekt data for signals without a licence (I-29); copying a popularity ranking, salt score or average-deck price.
- A tier list, a power ranking, or saying a commander "is bracket N".
- A quiz whose mapping from answers to commanders is hidden. A guided mode may ask questions only if each answer sets a visible filter.
- Generic card search (I-14), deck generation (I-02), owned coverage (I-16), the precon catalogue (I-17), commander summary or statistics pages (I-34, I-29).
- Sponsored or affiliate-weighted order, streaks, or notifications about new commanders; saved profiles show "new since your last visit" only when opened.

## Testing strategy

- **Solitary:** each filter compiles to the expected Scryfall fragment; style predicates on fixture cards; the complexity score on fixtures; the budget filter with known and unknown estimates; "not like my decks" on fixture decks.
- **Conformance:** for each style, the local predicate and Scryfall's count agree on a recorded response; a mismatch fails the refresh.
- **Boundaries:** no finder module imports the AI client; every result line carries a source; the translator's output names no commander absent from the input; no response sorts by `edhrec_rank`.
- **Sociable:** over a fixture catalogue of a few hundred commanders, filters give the expected sets, funnel counts add up, and a seed replays the same pick.
- **Index:** a curated page below threshold renders `noindex` and is absent from the sitemap; an empty page is `noindex`; an unknown slug is 404; query-string pages are `noindex` without a canonical; no commander slug equals a reserved segment.
- **Wizard and E2E:** the build request always carries a commander; a guest opens the finder from the first-run panel, filters, and starts a deck with the pick.
- **i18n:** style names and templates in English and French; French pages `noindex` until reviewed.

## Delivery slices

| #   | Slice                                                                                                                                                                                              | Depends on                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Commander catalogue by Oracle ID: identity, type line, keywords, pairing kind, Game Changer flag, release date, the card's dated price, bulk date _(re-pointed 2026-11-10 to I-67 slices 2 and 7)_ | I-67 slices 2 and 7                                    |
| 2   | Style vocabulary with versioned definitions, both compilers, daily conformance check, owner fixture and precision report; wizard strategies, `ARCHETYPES` and `detectThemes` mapped to it          | 1                                                      |
| 3   | Finder page and route, signed out: colours, styles in and out, keywords and types, Game Changer rule; query, chips, funnel, explanations, next steps                                               | 2                                                      |
| 4   | Complexity score with factors and bands                                                                                                                                                            | 1                                                      |
| 5   | Seeded "Surprise me" within the filters                                                                                                                                                            | 3                                                      |
| 6   | Wizard: "Help me choose" replaces "let the AI choose"; honest budget label                                                                                                                         | 3; I-02 for the route's prompt branch                  |
| 7   | "Not like my decks" and "like a commander I enjoy"                                                                                                                                                 | 3                                                      |
| 8   | Deck signals: full-deck cost estimate and bracket distribution, with n and date                                                                                                                    | 3; I-29 slices 8, 9 and 11                             |
| 9   | "Help me choose a commander" in the first-run panel                                                                                                                                                | 3; I-39 slice 5                                        |
| 10  | Free text to filters, English first                                                                                                                                                                | 3; I-14 slices 1 and 2; I-14 slice 4 for French        |
| 11  | Curated pages under I-34's policy; indexable only once deck signals pass the thresholds                                                                                                            | 3; I-34 slice 1; 8 for any page to become indexable    |
| 12  | Collection-aware ranking: owned coverage of a reference list, free-copies mode                                                                                                                     | 3; I-16 slices 2 and 4                                 |
| 13  | Corpus similarity and popularity bands, each with its denominator                                                                                                                                  | 8                                                      |
| 14  | Paid entitlement for slice 12, if I-30 decides so                                                                                                                                                  | 12; **Blocked** on I-30's decision gate; I-30 slice 11 |
| 15  | Saved finder profiles with "new since your last visit"                                                                                                                                             | 3                                                      |
| 16  | French review of style names, templates and curated pages                                                                                                                                          | 2, 11                                                  |

Slices 1 to 7 give a useful finder with no deck corpus. Slice 6 removes the only place where a model chooses a commander today. Slice 11 can ship early, but its pages stay `noindex` until slice 8 has data, which on today's corpus will be rare (I-29 2.1).

## Open questions

1. **Can the product depend on Tagger tags?** Scryfall calls them "community-maintained" [34]; their licence and stability were not found. Ask Scryfall in writing, with [I-30's questions](i30-business-model-and-paid-tier.md#7-the-legal-gate) (research, not legal advice). Without them, definitions fall back to Oracle text patterns, which are less precise.
2. **Where do full-deck cost estimates come from for most commanders?** I-29 says its corpus stays small until a partnership (I-29 2.1). Options: precon lists through I-17, a licensed price per commander from a partner, or showing "no estimate yet" for most. Budget is the filter players state in money [27], so this decides whether the budget pages ever reach the index.
3. **Does "let the AI choose" go entirely?** This spec removes it (5.3), so that no model chooses a commander anywhere in the product. The AI build belongs to I-02, so the owner decides with I-02. Keeping it would need at least a label saying the commander is a model's choice, and the finder's results beside it.
4. **How is the complexity heuristic validated?** An owner-labelled fixture is a start. An opt-in rating through I-39 would test whether players agree.
5. **Pairs.** 223 partner-kind commanders and 30 Backgrounds [11] can form many pairs. Is a capped toggle enough?
6. **Thresholds for curated pages:** how many results, each with which deck-based signal, before a page is indexable? I-34's open question on thresholds should cover this page kind.

## Sources

Read 2026-11-10 unless dated otherwise.

1. EDHREC, "Top Commanders". https://edhrec.com/commanders
2. EDHREC, "Theme Tags". https://edhrec.com/themes
3. EDHREC, Group Hug tag page. https://edhrec.com/tags/group-hug
4. EDHREC, random commander; the request opened the Opal-Eye, Konda's Yojimbo page. https://edhrec.com/random
5. EDHREC, Brian Cain, "How to Choose Your Commander", 2024-11-26. https://edhrec.com/articles/how-to-choose-your-commander
6. EDHREC, Ms. Bumbleflower commander page: 38,009 decks and the bracket filter's counts. https://edhrec.com/commanders/ms-bumbleflower
7. EDHREC, Ms. Bumbleflower average deck. https://edhrec.com/average-decks/ms-bumbleflower
8. EDHREC, MtGDS, "Unified Front: Using Data to Find Swappable Commanders", 2022-10-04. https://edhrec.com/articles/unified-front-using-data-to-find-swappable-commanders
9. Scryfall, search reference: `is:commander`, Tagger tags (`otag:`), `edhrecrank`. https://scryfall.com/docs/syntax
10. Scryfall, card objects: `edhrec_rank`, `game_changer`, `prices`. https://scryfall.com/docs/api/cards
11. Scryfall API searches run 2026-11-10 with `unique=cards`: `is:commander legal:commander` (3,754), with `is:gamechanger` (3), `is:partner` (223), `t:background` (30), `id=ub o:token` (17), `id=ub o:/create.*token/` (13); and `/cards/random` with a query. https://api.scryfall.com/cards/search?q=is%3Acommander+legal%3Acommander&unique=cards
12. Grimoria, "Commander Search & Generator" help page, version 2.3.49 (2026110901). https://grimoria.app/help/discovery/commander-search
13. Loreweaver, "The Commander Quiz + Narrative Deckbuilder Are Live", 2025-06-05. https://loreweavermtg.pages.dev/DeckbuilderQuiz-Announce
14. Cards Realm, "Which Commander is best for my deck". https://mtg.cardsrealm.com/en-us/tools/which-commander-is-best-for-my-deck
15. CommanderCrafter. https://commandercrafter.com
16. r/EDH, "feedback on commander recommendation website", 2026-03-23; Arctic Shift archive. https://www.reddit.com/r/EDH/comments/1s1jzwc/
17. r/EDH, "My EDH recommendation site, Recommander, now lets you pick recommendations from cards you own!", 2026-07-14; Arctic Shift. The site answered HTTP 403. https://www.reddit.com/r/EDH/comments/1uwjmjy/
18. r/EDH, "How I made my commander recommendations super duper fast", 2026-10-14, 171 points; Arctic Shift. https://www.reddit.com/r/EDH/comments/1x5w4u9/
19. Archidekt, Commander deck search. https://archidekt.com/search/decks?formats=3
20. MTGGoldfish, Commander metagame. The page answered with a challenge; only a search-result snippet was read. Moxfield's public deck browse answered HTTP 403. https://www.mtggoldfish.com/metagame/commander/full
21. Wizards of the Coast, Commander format page, undated (© 1993–2026). https://magic.wizards.com/en/formats/commander
22. Arctic Shift, the 100 most recent r/EDH posts with "what commander" in the title (2026-08-19 to 2026-11-09); requests classified by the research. https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=what%20commander&after=2025-11-10&limit=100
23. r/EDH, "Looking for a Rakdos commander that doesn't tell me what to do", 2026-11-04, 171 points, 255 comments; Arctic Shift. https://www.reddit.com/r/EDH/comments/1xnsvaz/
24. r/EDH, "What commander would you use for a deck that does everything!", 2026-09-11; Arctic Shift. https://www.reddit.com/r/EDH/comments/1wdhsz9/
25. r/EDH, "What commander deck am I missing from my collection?", 2026-10-22; Arctic Shift. https://www.reddit.com/r/EDH/comments/1xcb4v2/
26. r/EDH, "what kind of commander/deck could you recommend me?", 2026-10-01; Arctic Shift. https://www.reddit.com/r/EDH/comments/1wuvqe0/
27. r/EDH, "What commander should i play?", 2026-08-23; Arctic Shift. https://www.reddit.com/r/EDH/comments/1vwdrw2/
28. r/EDH, "Looking for a commander recommendation with a few criteria", 2026-06-06; Arctic Shift. https://www.reddit.com/r/EDH/comments/1ty22ld/
29. r/EDH, "What is a commander or archetype I would enjoy based on my current roster?", 2026-10-03; Arctic Shift. https://www.reddit.com/r/EDH/comments/1wwphn1/
30. r/EDH, "How do you decide what commander you want to build next?", 2026-09-02, 32 points, 95 comments; Arctic Shift. https://www.reddit.com/r/EDH/comments/1w4ya96/
31. r/EDH, "What commander should I build? I like Ashling, the Limitless, Teval, the Balanced Scale, and Zurgo, Stormrender!", 2026-10-17; Arctic Shift. https://www.reddit.com/r/EDH/comments/1x8mut4/
32. Arctic Shift, subreddit index searched for the prefix "edhrec". https://arctic-shift.photon-reddit.com/api/subreddits/search?subreddit_prefix=edhrec
33. Scryfall, API documentation, use of Scryfall data. https://scryfall.com/docs/api
34. Scryfall, bulk data: the Oracle Cards file (one object per Oracle ID), the Oracle Tags file from Tagger, and "prices should be considered dangerously stale after 24 hours"; files dated 2026-11-09. https://scryfall.com/docs/api/bulk-data

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

### Goals

- A guest filters commanders by colours, style, complexity and budget, sees the query and one line of evidence per filter on each result, takes a replayable random pick and starts a deck with it; every build request carries a commander; and no page built only from Scryfall data enters the index.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-54-01

As a player who has not picked a commander, I want filters I set and a reason on each result, so that a model is not choosing for me.

#### US-54-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-54-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-54-01 Happy path

Given a signed-in player and the English locale
When every active filter is visible and removable.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-54-02 Happy path

Given a signed-in player and the English locale
When each result has one line that cites the filter it matched.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-54-03 Happy path

Given a signed-in player and the English locale
When results are not ordered by popularity.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-54-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-54-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-54-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-out to browse. Saving the choice needs an account or a guest deck. The flag for any model wording stays off.

#### AC-54-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-54-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-54-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The finder is a page the wizard can open. A seeded shuffle is labelled as random, not as best.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads I-67's card table. Writes the chosen commander through the existing commander save. No model call in the default path.

### Analytics and telemetry

`commander_chosen {source: finder or typed, filters: count}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-out to browse. Saving the choice needs an account or a guest deck. The flag for any model wording stays off.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether budget pages can show a full-deck estimate depends on a price source we do not have for most commanders.

### Sources

- https://www.reddit.com/r/EDH/comments/1vwdrw2/
- https://edhrec.com/commanders
- https://loreweavermtg.pages.dev/DeckbuilderQuiz-Announce
- https://scryfall.com/docs/api
- https://serebii.net/tcgpocket/themedecks.shtml

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-54-101

As a player, I want the product to a commander catalogue keyed by Oracle ID, rebuilt daily from I-67's card and Oracle Tags tables (re-pointed 2026-11-10 to I-67 slices 2 and 7) and never paged through search (slice 1)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A commander catalogue keyed by Oracle ID, rebuilt daily from I-67's card and Oracle Tags tables (re-pointed 2026-11-10 to I-67 slices 2 and 7) and never paged through search (slice 1). fetchAllPages (src/lib/scryfall/client.ts) stops after PAGE_SAFETY_CAP = 20 pages, 3,500 cards at 175 a page, fewer than the 3,754 commanders, and returns the partial list without an error; its callers today read the banned list and the Game Changers, far below the cap. buildCommanderSearchQuery (src/lib/scryfall/search.ts) searches by name and colours only.

#### AC-54-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-54-102

As a player, I want the product to one play-style vocabulary with versioned definitions, compiled both to a Scryfall query fragment and to a local predicate, with a daily conformance check and an owner-labelled fixture (slice 2)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: One play-style vocabulary with versioned definitions, compiled both to a Scryfall query fragment and to a local predicate, with a daily conformance check and an owner-labelled fixture (slice 2). It replaces three lists: the wizard's 8 strategies, the 11 ARCHETYPES (src/lib/ai/archetypes.ts) and the 17 themes of detectThemes (src/lib/deck/themes.ts), whose Tokens rule counts "put a", which also matches counters.

#### AC-54-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-54-103

As a player, I want the product to the finder page and route, signed out: colours, styles in and out, keywords and types, the Game Changer rule, the visible query, a funnel and one "why it matches" line per filter (slice 3); a complexity score with its factors (slice 4); and a seeded "Surprise me" (slice 5)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-106 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: The finder page and route, signed out: colours, styles in and out, keywords and types, the Game Changer rule, the visible query, a funnel and one "why it matches" line per filter (slice 3); a complexity score with its factors (slice 4); and a seeded "Surprise me" (slice 5).

#### AC-54-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-108 Edge

Given the same inputs as a previous run
When the player runs it again
Then the reported figures match the first run

#### US-54-104

As a player, I want "Help me choose" in the wizard instead of "let the AI choose", and an honest budget label (slice 6)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then "Help me choose" in the wizard instead of "let the AI choose", and an honest budget label (slice 6). The budget label defect is recorded under I-02, and removing the prompt branch is I-02's change and the owner's decision.

#### AC-54-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-54-105

As a player, I want "Not like my decks" and "like a commander I enjoy" (slice 7), "Help me choose a commander" in I-39's first-run panel (slice 9), free text turned into the same visible filters through I-14 (slice 10), and saved finder profiles (slice 15)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then "Not like my decks" and "like a commander I enjoy" (slice 7), "Help me choose a commander" in I-39's first-run panel (slice 9), free text turned into the same visible filters through I-14 (slice 10), and saved finder profiles (slice 15).

#### AC-54-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-54-106

As a player, I want the product to later: a full-deck cost estimate and a bracket distribution from public decks, with n and date (slice 8); curated pages under I-34's policy, noindex until deck signals pass its thresholds (slice 11); collection-aware ranking (slice 12); similarity and popularity bands with their denominators (slice 13); and the French review (slice 16)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-115 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later: a full-deck cost estimate and a bracket distribution from public decks, with n and date (slice 8); curated pages under I-34's policy, noindex until deck signals pass its thresholds (slice 11); collection-aware ranking (slice 12); similarity and popularity bands with their denominators (slice 13); and the French review (slice 16).

#### AC-54-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-117 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-54-107

As a player, I want the product to after I-30's decision: a paid entitlement for slice 12 (slice 14)., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After I-30's decision: a paid entitlement for slice 12 (slice 14).

#### AC-54-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-54-108

As a player, I want the product to a filter "can include card X": colour identity contains X's, X is legal, and X's Game Changer status fits the chosen bracket., so that a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

#### AC-54-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A filter "can include card X": colour identity contains X's, X is legal, and X's Game Changer status fits the chosen bracket. Pokémon TCG Pocket builds theme decks around a "highlight card" (Serebii, seen 2026-11-10). Added 2026-11-11.

#### AC-54-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-54-123 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

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

## I-54: Find Your Next Commander

**Spec:** [`specs/i54-find-your-next-commander.md`](i54-find-your-next-commander.md)

**Outcome:** a player narrows the commanders Scryfall says can lead a deck with filters for colours, play style, mechanics, complexity, bracket target, a budget for the whole deck and "not like my decks", and every result says why it matches, one line per filter with its source. The finder works signed out, and no model chooses, orders or describes a commander.

**Status:** Next
**Priority:** Next for the finder on card data, the wizard's commander step, the first-run entry and free text (slices 1 to 7, 9, 10 and 15); Later for signals computed from decks, indexable pages and the collection path (slices 8, 11 to 14 and 16), which wait for I-29, I-34 and I-16
**Impact / effort:** Medium / medium
**Depends on:** I-67 slices 2 and 7 for the card and Oracle Tags tables (slice 1), re-pointed 2026-11-10; I-02 and the owner for the build route's prompt branch (slice 6); I-39 slice 5 for the first-run panel; I-14 slices 1, 2 and 4 for free text; I-29 slices 8, 9 and 11 for deck signals; I-34 slice 1 for curated pages; I-16 slices 2 and 4 for the collection path; I-30's decision for slice 14.

"Which commander should I build next?" is a recurring r/EDH post: titles containing "what commander" alone gave 22 requests in 83 days. Players state a play style, their other decks, a bracket, colours and sometimes a budget for the whole deck, such as "I dont wanna spend more than 250€" ([r/EDH, 2026-08-23](https://www.reddit.com/r/EDH/comments/1vwdrw2/)). EDHREC ranks commanders by how many decks they lead and explains nothing beyond the count ([Top Commanders](https://edhrec.com/commanders)), and its random button ignores every filter. A quiz maps answers to a commander by a method it calls "not scientific, but it's fun" ([Loreweaver, 2025-06-05](https://loreweavermtg.pages.dev/DeckbuilderQuiz-Announce)). No finder found combines a budget for the whole deck, a complexity preference and "not like my decks", explains each result against each filter, ranks by owned coverage or works in French. Scryfall's terms bound what a page may be: "You may not simply repackage, republish, or proxy Scryfall data" ([API terms](https://scryfall.com/docs/api)), so a page built only from card data is not indexable. MagicAIBuilder's own wizard asks a model to "Choose the best commander" when the player skips the step.

### Scope

- [ ] A commander catalogue keyed by Oracle ID, rebuilt daily from I-67's card and Oracle Tags tables (re-pointed 2026-11-10 to I-67 slices 2 and 7) and never paged through search (slice 1). `fetchAllPages` (`src/lib/scryfall/client.ts`) stops after `PAGE_SAFETY_CAP = 20` pages, 3,500 cards at 175 a page, fewer than the 3,754 commanders, and returns the partial list without an error; its callers today read the banned list and the Game Changers, far below the cap. `buildCommanderSearchQuery` (`src/lib/scryfall/search.ts`) searches by name and colours only.
  - An "Include previews" filter, off by default, adds preview commanders through [I-73](i73-every-set-release-ready-on-day-one.md)'s `previewQuery`, each labelled with its release date (2026-11-10). The spec's catalogue query, `is:commander legal:commander`, misses them.
- [ ] One play-style vocabulary with versioned definitions, compiled both to a Scryfall query fragment and to a local predicate, with a daily conformance check and an owner-labelled fixture (slice 2). It replaces three lists: the wizard's 8 strategies, the 11 `ARCHETYPES` (`src/lib/ai/archetypes.ts`) and the 17 themes of `detectThemes` (`src/lib/deck/themes.ts`), whose Tokens rule counts "put a", which also matches counters.
  - [I-65](i65-how-this-deck-wins.md)'s route definitions reuse this format and its compilers. A style says how a deck plays and a route how a game ends, and each style may link the routes it usually uses. I-67 slice 7 loads the Oracle Tags once (re-pointed 2026-11-10); slice 2 builds the style clauses on them, and I-65 slice 8 reads both.
- [ ] The finder page and route, signed out: colours, styles in and out, keywords and types, the Game Changer rule, the visible query, a funnel and one "why it matches" line per filter (slice 3); a complexity score with its factors (slice 4); and a seeded "Surprise me" (slice 5).
- [ ] "Help me choose" in the wizard instead of "let the AI choose", and an honest budget label (slice 6). The budget label defect is recorded under I-02, and removing the prompt branch is I-02's change and the owner's decision.
- [ ] "Not like my decks" and "like a commander I enjoy" (slice 7), "Help me choose a commander" in I-39's first-run panel (slice 9), free text turned into the same visible filters through I-14 (slice 10), and saved finder profiles (slice 15).
- [ ] Later: a full-deck cost estimate and a bracket distribution from public decks, with n and date (slice 8); curated pages under I-34's policy, `noindex` until deck signals pass its thresholds (slice 11); collection-aware ranking (slice 12); similarity and popularity bands with their denominators (slice 13); and the French review (slice 16).
- [ ] After I-30's decision: a paid entitlement for slice 12 (slice 14).
- [ ] A filter "can include card X": colour identity contains X's, X is legal, and X's Game Changer status fits the chosen bracket. Pokémon TCG Pocket builds theme decks around a "highlight card" ([Serebii](https://serebii.net/tcgpocket/themedecks.shtml), seen 2026-11-10). Added 2026-11-11.

### Engineering enablers

- No finder module imports the AI client, every result line carries a source, and no response sorts by `edhrec_rank`, which ranks a card, not a commander's popularity.
- For each style, the local predicate and Scryfall's count agree on a recorded response, and a mismatch fails the refresh.
- A curated page below threshold is `noindex` and absent from the sitemap, a query-string page is `noindex` without a canonical, and no commander slug equals a reserved segment such as `find`.
- Once slice 6 ships, every build request carries a commander.

**Paid-tier angle:** the finder, its explanations, the random pick, popularity and price signals, public pages and saved profiles stay free: card data cannot be paywalled, and fan content cannot need a subscription. The one candidate is collection-aware ranking, which orders commanders by how much of a reference list the player owns, net of copies committed elsewhere. The spec rates the case weak until I-16's demand test and I-29's reference lists exist.

### Enrichment (2026-11-11)

**User story.** As a player who has not picked a commander, I want filters I set and a reason on each result, so that a model is not choosing for me.

**Acceptance.**
- Every active filter is visible and removable.
- Each result has one line that cites the filter it matched.
- Results are not ordered by popularity.

**UX.** The finder is a page the wizard can open. A seeded shuffle is labelled as random, not as best.

**Data and API.** Reads I-67's card table. Writes the chosen commander through the existing commander save. No model call in the default path.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `commander_chosen {source: finder or typed, filters: count}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-out to browse. Saving the choice needs an account or a guest deck. The flag for any model wording stays off.

**Open questions.** Whether budget pages can show a full-deck estimate depends on a price source we do not have for most commanders.

### Definition of done

A guest filters commanders by colours, style, complexity and budget, sees the query and one line of evidence per filter on each result, takes a replayable random pick and starts a deck with it; every build request carries a commander; and no page built only from Scryfall data enters the index.

---

