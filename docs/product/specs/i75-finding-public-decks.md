# I-75: Finding Public Decks

> **Initiative:** I-75, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 7 and 10 (search, popularity and saved searches on data `dev` already stores); Later for slices 8, 9 and 11 to 14, which wait for I-69, I-54, I-63, I-30, I-67 and I-28 · **Paid:** searching is never paid; alerts beyond a free allowance and their email digest are a candidate for [I-30](i30-business-model-and-paid-tier.md) (requirement 10) · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10, not committed. Every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through [I-38](i38-trust-safety-and-user-rights.md)'s slice 0.
> **Owns:** search and browsing over MagicAIBuilder's own public decks: the query contract and its URL, the filters and sorts, the search projection and its indexes, how popularity is measured and its abuse limits, the author's listing switch, public deck themes, the index rule for search URLs, saved searches and their alerts. **Does not own:** deck visibility, forks, votes, comments and the commander discovery page's place in the product ([I-08](i08-share-compare-and-learn.md)); decks from other sites, deduplication, "decks like mine", similarity and statistics ([I-29](i29-cross-site-deck-index.md)); the index policy function and its thresholds ([I-34](i34-commander-data-reports.md#4-index-policy)); view counts ([I-36](i36-creator-and-embed-toolkit.md#8-view-counts-and-privacy)); the play-style vocabulary ([I-54](i54-find-your-next-commander.md#4-one-play-style-vocabulary)); the bracket estimate ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); card keys and dated prices ([I-67](i67-one-card-data-pipeline.md)); delivery of notifications ([I-63](i63-one-notification-system.md)); moderation, blocking, deletion and export (I-38); plans and entitlements (I-30); the shared rate-limit store ([I-05](i05-production-safety.md) M2).
> **Proposed changes to neighbours, for the integrator:** I-29 slice 4 ("Deck search over I-08 decks") is delivered by I-75 slices 2, 4, 5 and 6; I-29 slice 4 becomes "indexed external decks as a second corpus behind I-75's query contract, with the source facet". I-08's L6 item (bound the commander discovery query) is delivered by I-75 slice 2. I-36 8.3 stands: views rank nothing. I-34 gains one page kind, the unfiltered deck browse page. I-63 gains one producer, `deck-search.new-matches`.

## Overview

Today a player finds someone else's deck on MagicAIBuilder in two ways: the commander page, which loads every public deck for one commander, ranks them by votes and shows 50, or the author's profile. Nobody can ask "Atraxa decks without infinite combos, under $150, updated this year" or "decks that play Smothering Tithe but not Rhystic Study". Moxfield and Archidekt both answer part of that, and both offer a sort by views; Moxfield also sorts by likes.

This initiative builds that search over the site's own public decks, on the PostgreSQL database already in production, before any external index exists. It adds what the incumbents do not show: exclusion filters, a price with its basis, declared and estimated bracket kept apart, popularity measured from copies by eligible accounts with the counts on screen, an author switch to stay out of search, and saved searches that can alert on new matches.

**Why a new initiative rather than scope additions.** [I-29 requirement 4](i29-cross-site-deck-index.md#4-deck-search) already describes card, colour, bracket, budget and freshness filters, and covers I-08's decks. But I-29 is Later (2027), its search waits for I-67's card keys and a 10-million-deck benchmark, and it rules popularity out of sorting. Seven parts of this topic have no owner anywhere: popularity and its abuse limits, public tags, the author's choice to be listed, saved searches and alerts, an index rule for search URLs, performance on Supabase Free, and a browse page at all. Spread over five initiatives, the query contract would have no single owner. I-75 owns the contract and the native corpus; I-29 later plugs its corpus in behind the same contract.

| Question                 | I-75 (this spec)                                                         | [I-29](i29-cross-site-deck-index.md)                                   |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Which decks              | MagicAIBuilder public decks the author leaves listed                     | External sources by tier, plus native decks in canonical form          |
| Where it runs            | The production PostgreSQL on Supabase, now                               | I-67 keys, a benchmark, possibly a dedicated server                    |
| Popularity               | Votes and copies by eligible accounts, labelled, never default           | Not stored for other sites (4.8); popularity sorts off for its sources |
| What it adds             | Browse page, URL contract, author switch, themes, saved searches, alerts | Source policy, dedup, near-copies, decks like mine, statistics         |
| Card identity in filters | Card names now, I-67 keys in slice 13                                    | I-67 keys from slice 1                                                 |

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Site          | Filters found                                                                                                                                                                                                               | Sorts and popularity                                                                                                                                                                           | Saved searches or alerts                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Archidekt** | Deck name on the page; "advanced options for looking up decks by name, creator, format Commander, and included cards" [1][2]. Tags from "nearly 200 pregenerated options", searchable since an update edited 2023-03-30 [3] | "Order by": Updated At (default), Alphabetical, Created At, Views, Size, EDH Bracket. Results show "738 views", owner, bracket and some tags; "Results: 1000+" [1]                             | None visible on the search page [1]                                                      |
| **Moxfield**  | Its pages answered 403. An unofficial client (© 2021–2026) sends format, text, deck name, hub, author, commander, partner, companion, a contained card, and minimum and maximum bracket [5]                                 | The same client sorts by likes, views, updated, created, comments, colours, format and bracket [5]. Moxfield tracks "the number of unique views your deck gets" and has likes (2020-10-14) [4] | A feed of new decks from followed users (2020-10-14) [4]; no alert on a search found     |
| **TappedOut** | "The advanced deck search page lets you search by name, color, format, price, and score" [7]                                                                                                                                | Not described [7]                                                                                                                                                                              | "Notify me when ready" ends a long inventory search; it is not an alert (2022-01-20) [8] |
| **EDHREC**    | Deck tables per commander, sourced from Moxfield and Archidekt; card include and exclude only on aggregate pages ([I-29](i29-cross-site-deck-index.md#what-the-market-does), 2026-11-09)                                    | Popularity is the product                                                                                                                                                                      | —                                                                                        |

**What players ask for.** Moxfield's feedback board holds requests for exclusion ("NOT") filters in its deck search (#2632), several hubs at once (#510) and a deck price filter (#777) [6], beside the include, exclude and last-updated requests I-29 cites. Their pages answered 403, so their status is unknown. Archidekt staff answered a price-filter request years ago that it "would require opening every result" to compute; the thread shows only "7 years" as its age [9].

**Evidence gaps.** No first-hand read of Moxfield's search was possible; its row rests on a reverse-engineered client and a 2020 wiki page. No report of view or like manipulation on a deck site was found, so the abuse limits in requirement 5 are design proposals, not answers to an observed attack.

**The gap.** Both incumbents offer a views sort, and Moxfield a likes sort; neither page read states who counts or over what window. None found shows exclusion filters with and/or logic, a price with its basis and date, declared and estimated bracket side by side, or an alert when a saved search gains a new deck.

## Current state in this codebase

Verified on `dev` at `fee835d8` on 2026-11-10:

- **Commander discovery** (`src/app/api/community/commanders/[slug]/decks/route.ts`) matches the slug in raw SQL against `Deck.commanderName`, using the partial expression index `Deck_commanderSlug_public_idx` (`WHERE "isPublic" = true`, migration `20260819210000`). It then loads every matching deck with all its votes and ratings, ranks them in memory by vote score, rating count and recency (`rankDecksByScore`, `src/lib/community/votes.ts`), and returns 50. No rate limit, no `Cache-Control`; its comment calls discovery "a browse surface, not an export".
- **The page** (`src/app/[locale]/commanders/[slug]/decks/page.tsx`) returns 404 for a slug no commander can produce (`isCommanderSlug`, a pattern in `src/lib/meta/fetch.ts`), marks an empty listing `noindex`, and forwards the viewer's cookie, which bypasses the cache for signed-in viewers. Its description reads "ranked by community votes". `src/lib/community/discovery-filter.ts` filters the 50 loaded rows by name in the browser.
- **Profiles** (`src/app/api/users/[username]/route.ts`) list every public deck of one author by `updatedAt` descending, without a limit. `/decks` (`src/app/[locale]/decks/page.tsx`) is the owner's own library and is not public.
- **Nothing else lists public decks across authors.** The other reads of `Deck.isPublic` are single-deck reads, the sitemap, saved-deck folders and the save and fork checks. `/api/v1/decks` serves the key owner's decks only, because "a public API that defaults to everything published is a scraping endpoint with a login on it".
- **Fields.** `Deck` stores `tags String[]` (free text, up to 20 of 50 characters, `src/lib/validation/deck.ts` line 31), `targetBracket`, a private `budget` and `manualBracket`, `seekingFeedback`, `isAIGenerated` and `forkedFromDeckId`; it has no colour identity, price total, view counter or publication date. `DeckCard` stores `name`, `colorIdentity`, `isBanned`, `zone` and `price`, a USD value set from Scryfall when the card is added (`src/lib/deck/store-card-faces.ts` line 94). No scheduled job exists: no `vercel.json` and no cron.
- **Public fields.** `PUBLIC_DECK_SELECT` (`src/lib/deck/public-deck-select.ts`) excludes `tags`, `budget`, `manualBracket` and folders; its comment names "budget, tags, bracket override" as owner data. A tag filter on those tags would leak them.
- **Signals.** `DeckVote` is unique per user and deck, and the vote route refuses a vote on one's own deck with 403; it has no rate limit and no account-age rule. `SavedPublicDeck` is unique per user and deck, and an author may save their own deck. The fork route (`src/app/api/decks/[id]/fork/route.ts`) needs a session and a public source, with no self-fork check and no rate limit; `Deck_forkedFromDeckId_idx` exists. No view counter exists (I-36 slice 12).
- **Indexes.** `DeckCard` is indexed on `deckId` only; `Deck` on `userId`, `folderId`, `forkedFromDeckId` and the commander expression. `SavedPublicDeck`'s unique key leads with `userId`, so counting saves per deck has no index. No GIN or trigram index exists.
- **Routing and crawling.** `src/lib/auth/public-paths.ts` lists the public page prefixes (`/deck`, `/u`, `/commanders`, `/rules`, `/share`, sign-in pages) and matches by segment. `src/app/robots.ts` disallows `/api/`, `/builder/`, `/collection/` and `/share/`; `src/app/sitemap.ts` lists public decks, profiles and commanders with at least one public deck.
- **Limits.** `src/lib/rate-limit.ts` counts in each instance's memory (I-05 M2). `emailVerified` is never set, so every account reads as unverified ([I-61](i61-account-security.md)). The bracket score is computed in the browser (`src/hooks/useBracketScore.ts`, `src/lib/deck/bracket.ts`).

## Functional requirements

### 1. Principles

1.1 **Free and signed out.** Search, filters, sorts, results and the browse page need no account and no payment (requirement 10).
1.2 **Deterministic and visible.** Each result appears because of the filters shown as chips above the list. No model chooses, orders or describes results. Natural-language input to filters waits for [I-14](i14-verifiable-natural-language-search.md)'s translator and returns chips, never results.
1.3 **Public and listed only.** Search reads only decks whose author made them public and left them listed (group 6).
1.4 **No spend in ranking.** No order, placement, badge or count depends on a payment, an entitlement or an advertiser, as the [non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark) require.

### 2. The query contract

2.1 One typed `DeckSearchQuery` holds every filter, the sort and the cursor. A pure function parses it from the URL and another serialises it back. Unknown keys and invalid values are dropped and the cleaned URL replaces the address.
2.2 Serialisation writes keys in one fixed order with sorted, de-duplicated values, so one search has one URL [10] and one CDN cache key.
2.3 Limits: at most 10 cards in each card list, 24 results a page, 20 pages, and a displayed total capped at "1,000+", as Archidekt shows [1].
2.4 The same contract serves the browse page, the commander page as a preset, saved searches and, later, I-29's corpus.
2.5 The browse page lives at `/community/decks`. `/community` joins the public prefixes in `src/lib/auth/public-paths.ts`; `/api/community` is already public, and `/decks` stays the owner's library.

### 3. Filters

| Filter                                                           | Source                                                                          | On `dev` today                       | Slice     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ | --------- |
| Commander, or a commander pair                                   | Command-zone card names                                                         | One commander, on its page           | 2         |
| Colour identity: exactly, within, including                      | Union of the command-zone cards' `colorIdentity`                                | No                                   | 2         |
| Updated within 30, 90, 180 or 365 days; listed since a date      | `updatedAt`, `listedAt`                                                         | Profile order only                   | 2         |
| Author; deck name contains                                       | Username; `Deck.name`                                                           | Profile page; in-browser name filter | 2         |
| Cards: all of, any of, none of                                   | Card names of main deck and command zone                                        | No                                   | 5         |
| Price range (USD)                                                | Sum of stored card prices × quantity, never the owner's `budget`                | No                                   | 6         |
| Declared bracket 1 to 5                                          | `targetBracket`, never the private `manualBracket`                              | Shown on profile cards               | 6         |
| Quality defaults: 100 cards, no banned card                      | Card count; `DeckCard.isBanned`                                                 | No                                   | 6         |
| Has a primer; seeking feedback; originals only; no AI-built deck | `description`; `seekingFeedback`; `forkedFromDeckId`; `isAIGenerated`           | No                                   | 6         |
| Themes chosen by the author                                      | New `publicThemes`, from I-54's vocabulary                                      | No; `Deck.tags` is private           | 9         |
| Estimated bracket; computed styles                               | I-28's scorer; I-54 4.5 applied to the deck                                     | No                                   | 14        |
| Format variant                                                   | `Deck.format`, once [I-42](i42-commander-variants-duel-cedh-pauper.md) ships it | No                                   | With I-42 |

3.1 Card names resolve through the card search the editor already uses before the query runs; a name that resolves to nothing is shown as unresolved, never silently dropped (I-29 4.1).
3.2 The price shows its basis: "estimate in USD from prices stored when each card was added, not refreshed". Slice 13 replaces it with I-67's dated daily price in USD and EUR.
3.3 Declared and estimated bracket are separate, labelled facets, as I-29 4.3 sets.
3.4 Quality defaults are on and can be turned off (I-29 4.7).

### 4. Sorts

4.1 **Recently updated** is the default on the browse page. It is neutral, and a new deck is not buried under old ones.
4.2 Other sorts: newest listed, price low to high and high to low, community votes, most copied in 90 days. Similarity arrives with I-29 slice 10.
4.3 The active sort is named above the list, with a link to "How this order works" (5.8).
4.4 When I-29's sources join a result set, popularity sorts are unavailable, because I-29 stores no popularity from other sites (I-29 4.8).

### 5. Popularity without manipulation

5.1 Signals and their use:

| Signal | What it costs the actor            | Shown on a result        | Sorts by it                                                                          |
| ------ | ---------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Views  | Nothing: no account                | When the author shows it | Never; [I-36 8.3](i36-creator-and-embed-toolkit.md#8-view-counts-and-privacy) stands |
| Saves  | An account; a private bookmark     | Yes                      | No                                                                                   |
| Votes  | An account; a public opinion       | Yes, up and down         | "Community votes"                                                                    |
| Copies | An account and a deck slot; a fork | Yes                      | "Most copied in 90 days"                                                             |

5.2 **Eligible accounts (proposal).** A save, vote or copy counts only when the account is not the deck's author, was at least 7 days old at the action, is not restricted or suspended (once I-38 slice 9 exists), and is not blocked by the author (once I-38 slice 12 exists). Once I-61 slices 10 and 11 make `emailVerified` real, a verified address is also required. An ineligible action still works for the actor; it only does not count.
5.3 **One per account per deck.** A second fork of the same deck by the same account does not count again. Votes and saves are already unique.
5.4 **Daily cap (proposal).** An account's counted actions across all decks stop at 30 per UTC day.
5.5 **Window.** Copies and saves count over the last 90 days. Votes keep their shipped all-time tally, from eligible accounts only.
5.6 **Computed daily** on I-63's job route into `DeckPopularity`. The sort label says when it was last computed.
5.7 **Counts beside every result:** "copied by 12 players in 90 days · 30 saves · +8 (10 up, 2 down)". A count of zero is shown as zero.
5.8 **"How this order works"** lists each sort's signals, eligibility, cap, window and tie-breaks. DSA Art. 27(2) asks platforms for "the criteria which are most significant" and "the reasons for the relative importance of those parameters" [12]; Art. 19(1) exempts micro and small enterprises from that section [13], so this page is voluntary (research, not legal advice).
5.9 **Never the default** on the browse page: the roadmap's [strategic boundaries](../roadmap.md#strategic-boundaries) say popularity is not advice, and I-54 1.3 keeps it out of the default order.
5.10 **Anomalies go to a person.** A deck is flagged to the moderation queue when its counted signals in 24 hours exceed both 10 and five times its 28-day daily mean, and more than half come from accounts younger than 30 days (proposal). The deck keeps its rank until a moderator decides, because [I-38 3.4](i38-trust-safety-and-user-rights.md#3-decisions-and-statements-of-reasons) lets no automatic filter rank content as a moderation step. Excluding signals demotes the deck, a visibility restriction under DSA Art. 17(1)(a) [14], so the author receives a statement of reasons through I-38's decision flow.
5.11 No "trending" notification, author leaderboard, streak or badge for counts.

### 6. Privacy and the author's choice

6.1 **Presence is visibility.** A deck has a search row only while it is public, listed, not hidden by moderation and not deleted. Becoming private, unlisted or hidden deletes the row in the same transaction, as I-29 1.4 requires of its index.
6.2 **Listing switch.** Each public deck gets "Show in deck search", on by default (open question 2). Off removes the deck from search, the browse page, the commander preset, popularity sorts and alerts. The deck stays on the profile and at its URL.
6.3 **Notice before launch.** Fourteen days before the browse page goes live, authors of public decks see a notice in their library and in the visibility setting, with the switch beside it.
6.4 **Public fields only.** The row is built from `PUBLIC_DECK_SELECT` fields and values computed from public card rows. A test fails if `budget`, `manualBracket`, `tags`, folders or card notes reach the row or the response.
6.5 **Themes are a separate public choice.** Free-text `Deck.tags` stay private. An author may publish up to three themes from I-54's vocabulary, which is versioned and translated, as Archidekt restricts deck tags to a predefined list [3].
6.6 **Blocking.** A signed-in viewer's results omit authors they blocked (I-38 5.1), and a blocked account's actions on the blocker's decks never count.
6.7 **Deletion and export.** Saved searches are in I-38's export and are deleted with the account. A deleted account's votes, saves and forks leave the counts at the next daily computation (I-38 6.4).
6.8 **No query log tied to a person.** The search route logs no query text with an account id. Product events follow I-39's contract.
6.9 **Rate limits (proposal):** 30 searches a minute per IP signed out, 60 per account, on I-05 M2's shared store once it exists.

### 7. Indexing

7.1 The unfiltered `/community/decks` page is one new page kind in I-34's policy function, indexable only above a threshold of listed decks (proposal: 50; D-68 decides), otherwise `noindex`.
7.2 Any URL carrying a filter, sort or cursor is `noindex`, has no canonical and never enters the sitemap, the rule I-54 6.1 sets for finder URLs. Links to filtered results carry `rel="nofollow"`, which Google says "may be beneficial" only when every such anchor carries it [10].
7.3 Search URLs are not disallowed in robots.txt, so a crawler reads the `noindex` ([I-34 4.3](i34-commander-data-reports.md#4-index-policy)). If crawl load appears in logs, the owner may revisit, as Google's guidance on faceted navigation suggests [10].
7.4 No landing page per facet combination ("Atraxa decks under $100"). Such pages are I-34 or I-54 page kinds with thresholds, or nothing.
7.5 `/commanders/[slug]/decks` stays I-34's commander page kind; it renders I-75's query with that commander as a preset.

### 8. Performance on Supabase Free

8.1 **Budget.** p95 at most 500 ms per search request, I-71's read budget ([2.7](i71-speed-uptime-and-recovery.md#2-budgets-ci-enforces-without-flakiness)), with at most three SQL statements per request, measured by I-71's query-count test.
8.2 **The machine.** Supabase Free runs on Nano: "up to 0.5 GB" of memory, a shared CPU, a pool of 15 connections by default, a recommended maximum of 500 MB of data, and disks at a 5 MB/s, 250 IOPS baseline; "Compute resources on the Free plan are subject to change" [11]. Every query therefore reads an index, never the whole `DeckCard` table.
8.3 **Bounded queries.** Keyset pagination on (sort key, deck id); `SET LOCAL statement_timeout = '2s'` inside the search transaction; the total counted up to 1,001 rows and shown as "1,000+" beyond.
8.4 **Cache.** Signed-out responses carry `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (proposal). The viewer's own vote, saved state and blocks come from a second small request, so the list stays cacheable, unlike today's commander page.
8.5 **Projection.** One `PublicDeckSearch` row per listed deck, kept in step by every route that writes `Deck` or `DeckCard`: visibility in the same transaction (6.1), content after the write commits. A parity test lists every such route and fails when one does not call the sync. Private decks have no row and cost nothing.
8.6 **Indexes (proposals, each confirmed or dropped by slice 5's measured plans):**

| Index                                                                        | Serves                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| `PublicDeckSearch ("updatedAt" DESC, "deckId")`                              | Default sort and keyset pages             |
| `PublicDeckSearch ("commanderSlug", "updatedAt" DESC)`                       | Commander preset and filter               |
| `PublicDeckSearch USING gin ("cardNames")`                                   | All of (`@>`) and any of (`&&`) [15]      |
| `PublicDeckSearch ("colorIdentity")`                                         | "Within" as `= ANY` over at most 32 masks |
| `DeckPopularity ("copies90d" DESC, "deckId")`, `("votesNet" DESC, "deckId")` | Popularity sorts                          |
| `SavedPublicDeck ("deckId", "createdAt")`                                    | Daily save counts; none exists today      |

8.7 "None of" runs as a filter on rows already selected, never as an index scan. A deck name search uses `ILIKE` on the projection; a trigram index is added only if the benchmark misses 8.1.
8.8 **GIN write cost.** PostgreSQL warns that "Updating a GIN index tends to be slow" and that a large pending list slows searches [15]. Default settings first; if p95 regresses after write bursts, set `fastupdate = off` on that index.
8.9 **Storage (estimate).** With card names, a row and its index entries take about 2 KB: about 2 MB for 1,000 decks, 20 MB for 10,000 (4% of 500 MB) and 100 MB for 50,000. With I-67's four-byte keys, about 0.6 KB, or 30 MB for 50,000. Slice 13 switches to keys when I-67 slice 2 lands or the tables pass 25 MB, whichever comes first. I-66's database-size alerts watch the total.

### 9. Saved searches and alerts

9.1 A signed-in player saves the current search with a name. Up to 25 per account, a write bound in the spirit of I-05, not a paywall.
9.2 Opening a saved search shows "N new since you last opened it". This is computed on opening and sends nothing, like I-54's saved finder profiles.
9.3 **Alerts are opt-in per saved search.** A daily run on I-63's job route finds decks listed after the last check that match now, and emits `deck-search.new-matches` with the search id, a count and up to five deck ids, no free text (I-63 12.2). In the app it is on for an alerting search; email is off by default.
9.4 At most one alert per search per day, and a deck alerts a search once. Edits, votes and copies never trigger an alert.
9.5 An alert pauses itself after 90 days in which the player never opened that search, and says so. A tool the player stopped using sends nothing.
9.6 A deck that left search before delivery shows "no longer available" in the inbox.
9.7 **Cost (estimate):** 1,000 alerting searches at about 50 ms each take about 50 seconds a day, inside the 300-second Hobby function limit the roadmap records for I-67.

### 10. Free and paid

10.1 **Never paid:** groups 1 to 8, saved searches within 9.1, "new since you last opened it", and in-app alerts within the allowance. Card data and fan content stay free ([I-29 7](i29-cross-site-deck-index.md#7-monetization-constraints), I-30).
10.2 **Paid candidate for I-30:** alerts on more saved searches than the free allowance (proposal: 3) and the alert email digest (I-63 slice 10). This mirrors [I-59 9.2](i59-prices-over-time-and-alerts.md#9-free-and-paid) for price alerts. No competitor found alerts on a deck search: Moxfield's feed follows people, not queries [4], and TappedOut's notice ends a single search [8]. Every deck an alert names stays reachable through the free search, so the price buys convenience, not access.
10.3 Paying never changes counts, eligibility, order or placement.
10.4 Whether a paid alert fits the Fan Content Policy goes to the lawyer list (research, not legal advice).

## Data model / API

```
Deck               + listedInSearch Boolean @default(true), publicThemes String[] @default([])  (≤ 3 I-54 style keys)
PublicDeckSearch   deckId @id, ownerId, commanderSlug, pairSlug?, colorIdentity Int (5-bit mask), cardCount Int,
                   cardNames String[] (main deck and command zone, normalised), priceUsdCents Int?, priceBasis
                   (storedAtAdd | dated), declaredBracket Int, estimatedBracket Int?, themes String[], hasPrimer,
                   seekingFeedback, isAiGenerated, isFork, hasBanned Boolean, listedAt, updatedAt, createdAt
DeckPopularity     deckId @id, votesUp, votesDown, votesNet, copies90d, saves90d, computedAt
SavedDeckSearch    id, userId, name (≤ 60), query (canonical URL query, ≤ 1 KB), alert Boolean @default(false),
                   lastOpenedAt?, lastAlertAt?, createdAt          @@index([userId])
PopularityFlag     id, deckId, day, counts Json, decisionId? (I-38 decision), createdAt

GET  /api/community/decks?{DeckSearchQuery}   → { query, chips, total ("1000+" capped), results[], nextCursor?, popularityComputedAt? }
GET  /api/community/decks/viewer?ids=…        → the viewer's votes, saves and blocks for those ids (signed in)
POST/GET/PATCH/DELETE /api/me/deck-searches   → saved searches (signed in)
```

`PublicDeckSearch` has no field for `budget`, `manualBracket`, `tags`, folders or card notes; a schema test guards the absence. A result carries the public card of the deck, its counts and, when the author shows it, I-36's view total.

## Non-goals

- Decks from other sites, deduplication, near-copies, "decks like mine" and statistics: I-29.
- Ranking by views, likes bought, paid boosts, featured slots or sponsored results; "trending" notifications; author leaderboards.
- A public API listing every public deck; the `/api/v1` rule stands, and the search route is rate limited and page-capped.
- Indexable pages per filter combination.
- Free-text tags in public search; a model writing filters or explanations.
- Win rates or "best deck" claims; popularity is never presented as advice.
- A following feed: I-08 keeps it, built only if discovery data shows repeated use.

## Testing strategy

- **Contract (solitary):** parse and serialise round-trip; fixed key order; duplicates and unknown values dropped; limits enforced.
- **Visibility (sociable, PostgreSQL in Docker):** private, share-only, hidden, unlisted and deleted decks never appear; each change removes the row in the same transaction; the parity test covers every `Deck` and `DeckCard` write route.
- **Projection:** a deck with `budget`, `manualBracket`, tags and card notes set produces none of them in the row or the response.
- **Search correctness:** all, any, none, colour "exactly, within, including", price and bracket fixtures match a brute-force reference over the same corpus.
- **Popularity:** author, young, restricted and blocked accounts count zero; a second fork counts once; the 31st action of the day counts zero; the 90-day window drops old copies; an entitlement change leaves every count and order unchanged; a burst fixture creates a flag and leaves the rank alone.
- **Indexing:** the unfiltered page follows the policy function; every filtered URL renders `noindex` without canonical; the sitemap holds no query string.
- **Performance:** synthetic corpora of 10,000 and 50,000 decks with a skewed card distribution; p95 for the default page, a commander, Sol Ring, three included and three excluded cards; committed `EXPLAIN` plans; query count per request.
- **Alerts:** a new listing alerts once; an edit does not; a deck gone private shows "no longer available"; the 90-day pause fires; the payload holds no free text.
- **Free access:** search and the browse page render signed out, and no search route reads an entitlement.

## Delivery slices

| #   | Slice                                                                                                                                                                                                           | Depends on                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 0   | `DeckSearchQuery` with URL parse and serialise, fixed order, limits; solitary tests                                                                                                                             | —                                  |
| 1   | `PublicDeckSearch` projection, migration, sync on every write route with the parity test, backfill script; `listedInSearch` and the owner's switch                                                              | —                                  |
| 2   | `GET /api/community/decks`: commander, pair, colours, recency, author, name; sorts by update, listing date and votes as shipped; keyset pages, timeout, cache, rate limit; commander route re-pointed (I-08 L6) | 0, 1                               |
| 3   | Launch notice to authors of public decks in the library and the visibility setting                                                                                                                              | 1                                  |
| 4   | `/community/decks` signed out: chips, result cards with counts, `noindex` rules, public-path entry, viewer request; public 14 days after slice 3 ships                                                          | 2, 3                               |
| 5   | Card filters all, any and none with name resolution; GIN index; benchmark at 10,000 and 50,000 decks with committed plans                                                                                       | 2                                  |
| 6   | Price, declared bracket, quality defaults, primer, feedback, original and AI filters; price sorts                                                                                                               | 2                                  |
| 7   | Popularity: eligibility, cap, daily `DeckPopularity`, votes from eligible accounts, "Most copied", "How this order works"                                                                                       | 2; I-63 slice 5                    |
| 8   | Anomaly flags into the moderation queue; demotion through I-38's decisions                                                                                                                                      | 7; I-69 slice 11; I-38 slice 10    |
| 9   | Public themes from I-54's vocabulary and the theme filter                                                                                                                                                       | 2; I-54 slice 2                    |
| 10  | Saved searches and "new since you last opened it"                                                                                                                                                               | 4                                  |
| 11  | Alerts: daily run, `deck-search.new-matches`, allowance, 90-day pause                                                                                                                                           | 10; I-63 slices 1 and 5            |
| 12  | Paid entitlement for alerts beyond the allowance and the alert digest                                                                                                                                           | 11; I-30 slice 11; I-63 slice 10   |
| 13  | Card names replaced by I-67 keys; dated price in USD and EUR                                                                                                                                                    | 5, 6; I-67 slices 2 and 5          |
| 14  | Estimated bracket and computed styles as separate facets                                                                                                                                                        | 6, 9; I-28 slice 2; I-54 slice 2   |
| —   | External decks behind the contract, with the source facet                                                                                                                                                       | I-29 slice 4 (re-scoped); tracking |

Slices 0 and 1 start now and in parallel. Slice 2 alone fixes the unbounded commander query. Slice 4 is the first page a player sees, and slice 7 is where the product's popularity differs from the incumbents'.

## Open questions

1. **Default order (owner, [D-83](../owner-decisions.md#product-scope-and-non-goals)).** The browse page defaults to "recently updated". The shipped commander page defaults to community votes, and its metadata says so. Keep votes there, as I-08 decided, or align both pages on recency under the boundary that popularity is not advice?
2. **Existing public decks (owner, [D-84](../owner-decisions.md#product-scope-and-non-goals)).** List them by default after the 14-day notice (6.3), or require each author to opt in? Opting in protects expectations; listing by default makes the search useful on day one.
3. **Eligibility constants (owner, with D-83).** Seven days, 30 counted actions a day, a 90-day window, and the anomaly thresholds are proposals. Should "Most copied" wait for I-61 slices 10 and 11, so that eligible accounts have a verified address?
4. **Free allowance for alerts** (I-30, [D-17](../owner-decisions.md#money-and-plans)): three alerting searches, more, or no paid line at all?
5. **Public themes:** I-54's vocabulary only, or also an author's free-text tags, which bring spam, moderation and translation costs?
6. **I-29's boundary:** does the integrator accept re-scoping I-29 slice 4 to an external corpus behind this contract?
7. **For the lawyer** (via I-38 slice 0): is the voluntary page of 5.8 enough for a micro platform; does excluding manipulated signals need a statement of reasons under Art. 17; does a paid alert fit the Fan Content Policy? Research, not legal advice. Added on 2026-11-10 to [L-37](../legal-questions.md#l-37-platform-status-and-the-micro-enterprise-floor), [L-39](../legal-questions.md#l-39-notice-and-action-design-checks) and [L-16](../legal-questions.md#l-16-does-a-paid-tier-fit-wizards-fan-content-policy).

## Sources

1. Archidekt, [deck search](https://archidekt.com/search/decks), read 2026-11-10.
2. Archidekt, [FAQ](https://archidekt.com/faq), "How do I search for decks?", read 2026-11-10.
3. Archidekt, [Development Update: Deck Tags](https://archidekt.com/news/4256905), edited 2023-03-30, read 2026-11-10.
4. Moxfield, [Features wiki](https://github.com/moxfield/moxfield-public/wiki/Features), last edited 2020-10-14, read 2026-11-10.
5. MarioMH8, [moxfield-api](https://github.com/MarioMH8/moxfield-api), an unofficial TypeScript client of Moxfield's search endpoint, © 2021–2026, read 2026-11-10. Not verified against the live site, which answered 403.
6. Moxfield feedback board, [#2632](https://moxfield.nolt.io/2632), [#510](https://moxfield.nolt.io/510) and [#777](https://moxfield.nolt.io/777), search snippets of 2026-11-10; the pages answered 403.
7. TappedOut, [Help Topic: Searching](https://tappedout.net/help-desk/searching/), © 2026, read 2026-11-10.
8. TappedOut, [Find Decks with Cards Matching Your Inventory](https://tappedout.net/mtg-forum/site-updates/find-decks-with-cards-matching-your-inventory), 2022-01-20, read 2026-11-10.
9. Archidekt forum, [Deck search filters and sorting](https://archidekt.com/forum/thread/18412), posts shown as "7 years" old, read 2026-11-10.
10. Google Search Central, [Managing crawling of faceted navigation URLs](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation), undated page, read 2026-11-10.
11. Supabase, [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk), read 2026-11-10.
12. Regulation (EU) 2022/2065 ([EUR-Lex](https://eur-lex.europa.eu/eli/reg/2022/2065/oj)), [Article 27](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_27.html), read on an unofficial consolidated copy on 2026-11-10 because EUR-Lex returned no content to the fetcher.
13. Regulation (EU) 2022/2065, [Article 19](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_19.html), same copy, read 2026-11-10.
14. Regulation (EU) 2022/2065, [Article 17](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_17.html), same copy, read 2026-11-10.
15. PostgreSQL 18.6 documentation, [GIN Indexes](https://www.postgresql.org/docs/current/gin.html), read 2026-11-10.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

### Goals

- A signed-out player finds Atraxa decks that play Smothering Tithe but not Rhystic Study, under $150 and updated this year, and sees why each result appears and how the order is computed; an author who turns off "Show in deck search" leaves every result and alert at once; and the commander page reads at most 50 decks through an index, never every deck for the commander.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-75-01

As a player looking for a public deck, I want to filter by commander, cards and a price with its basis, so that I can see why a result appeared.

#### US-75-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-75-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-75-01 Happy path

Given a signed-in player and the English locale
When a result says which filters it matched.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-75-02 Happy path

Given a signed-in player and the English locale
When popularity is not the default order.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-75-03 Happy path

Given a signed-in player and the English locale
When an author can keep a public deck out of search.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-75-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-75-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-75-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-out. Alerts on a saved search, later, are signed-in and wait on I-63. No flag that changes the order for some players.

#### AC-75-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-75-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-75-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Filters are chips on a signed-out page. A filtered URL is noindex, through I-34. The commander page reads this query instead of loading every deck.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A search projection, updated in the same transaction as a deck write. Private fields never reach it. The route is rate-limited and cached.

### Analytics and telemetry

`deck_search_run {filters: count, signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-out. Alerts on a saved search, later, are signed-in and wait on I-63. No flag that changes the order for some players.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether existing public decks are listed by default is D-84. An owned-column for the signed-in viewer is a later slice and is never shown to anyone else.

### Sources

- https://www.reddit.com/r/Moxfield/comments/1xl4te2/
- https://riftbound.gg/?p=393

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-75-101

As a player, I want the product to deckSearchQuery, parsed from and written back to one canonical URL with a fixed key order and limits (slice 0); PublicDeckSearch, one row per public listed deck, kept in step by every route that writes a deck, with a parity test, and the author's "Show in deck search" switch (slice 1)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: DeckSearchQuery, parsed from and written back to one canonical URL with a fixed key order and limits (slice 0); PublicDeckSearch, one row per public listed deck, kept in step by every route that writes a deck, with a parity test, and the author's "Show in deck search" switch (slice 1).

#### AC-75-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-75-102

As a player, I want the product to gET /api/community/decks by commander, pair, colours, recency, author and name, sorted by update, listing date or votes, with keyset pages, a 2-second statement timeout, a CDN cache and a rate limit; the commander route reads it, which closes I-08's L6 (slice 2)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: GET /api/community/decks by commander, pair, colours, recency, author and name, sorted by update, listing date or votes, with keyset pages, a 2-second statement timeout, a CDN cache and a rate limit; the commander route reads it, which closes I-08's L6 (slice 2).

#### AC-75-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-75-103

As a player, I want the product to a notice to authors of public decks 14 days before launch (slice 3), and /community/decks, signed out, with filter chips, counts on every result and noindex on every filtered URL (slice 4)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-106 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A notice to authors of public decks 14 days before launch (slice 3), and /community/decks, signed out, with filter chips, counts on every result and noindex on every filtered URL (slice 4). Whether existing public decks are listed by default is D-84.

#### AC-75-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-75-104

As a player, I want the product to cards all of, any of and none of, with names resolved before the query, a GIN index and committed plans at 10,000 and 50,000 decks (slice 5); price with its basis, declared bracket, quality defaults, primer, feedback, original and AI filters, and price sorts (slice 6)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Cards all of, any of and none of, with names resolved before the query, a GIN index and committed plans at 10,000 and 50,000 decks (slice 5); price with its basis, declared bracket, quality defaults, primer, feedback, original and AI filters, and price sorts (slice 6).

#### AC-75-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-111 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-75-105

As a player, I want the product to popularity that resists manipulation: saves, votes and copies count only from eligible accounts (not the author, at least 7 days old, at most 30 counted actions a day), copies over 90 days, computed daily, shown beside every result, explained on "How this order works" and never the default order (slice 7); saved searches with "N new since you last opened it" (slice 10)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Popularity that resists manipulation: saves, votes and copies count only from eligible accounts (not the author, at least 7 days old, at most 30 counted actions a day), copies over 90 days, computed daily, shown beside every result, explained on "How this order works" and never the default order (slice 7); saved searches with "N new since you last opened it" (slice 10).

#### AC-75-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-75-106

As a player, I want the product to later: anomaly flags into I-38's queue through I-69's view (slice 8); public themes from I-54's vocabulary (slice 9); opt-in alerts on new matches through I-63, paused after 90 days unopened (slice 11), and a paid line for alerts above the allowance (slice 12); I-67's card keys and dated prices (slice 13); the estimated bracket and computed styles as separate facets (slice 14)., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: anomaly flags into I-38's queue through I-69's view (slice 8); public themes from I-54's vocabulary (slice 9); opt-in alerts on new matches through I-63, paused after 90 days unopened (slice 11), and a paid line for alerts above the allowance (slice 12); I-67's card keys and dated prices (slice 13); the estimated bracket and computed styles as separate facets (slice 14). I-29 slice 4 adds external decks behind the same contract.

#### AC-75-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-117 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-75-107

As a player, I want the product to for the signed-in viewer only, an "owned" column and sort: the share of each list the viewer owns, with "free copies only" as a toggle, read from I-16 slice 4., so that a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

#### AC-75-118 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: For the signed-in viewer only, an "owned" column and sort: the share of each list the viewer owns, with "free copies only" as a toggle, read from I-16 slice 4. It is never stored on the deck and never shown to others. A reply speaking for Moxfield calls it "something that we get a fair amount of requests for" (r/Moxfield, 2026-11-01). riftbound.gg sorts public decks by "Collection" (guide, updated 2025-07-05). Added 2026-11-11.

#### AC-75-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-75-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

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

## I-75: Finding Public Decks

**Spec:** [`specs/i75-finding-public-decks.md`](i75-finding-public-decks.md)

**Outcome:** a signed-out player searches MagicAIBuilder's own public decks by commander, colours, cards included and excluded, price with its basis, declared bracket and freshness, sees why each result appears and how each order is computed, and can save a search that says when a new deck matches; an author can keep any public deck out of search.

**Status:** Next
**Priority:** Next for slices 0 to 7 and 10, on data `dev` already stores; Later for slices 8, 9 and 11 to 14, which wait for I-69, I-54, I-63, I-30, I-67 and I-28. Searching is never paid; alerts beyond a free allowance are an I-30 candidate
**Impact / effort:** High / medium
**Depends on:** nothing for slices 0 and 1; slices 0 and 1 for the search route (slice 2); slice 1 for the launch notice (slice 3); slices 2 and 3 for the browse page (slice 4); slice 2 for the card filters (slice 5) and the other filters (slice 6); I-63 slice 5 for popularity (slice 7); I-69 slice 11 and I-38 slice 10 for anomaly flags (slice 8); I-54 slice 2 for public themes (slice 9); slice 4 for saved searches (slice 10); I-63 slices 1 and 5 for alerts (slice 11); I-30 slice 11 and I-63 slice 10 for the paid line (slice 12); I-67 slices 2 and 5 for card keys and dated prices (slice 13); I-28 slice 2 and I-54 slice 2 for the estimated bracket and styles (slice 14).

A player finds someone else's deck in two ways today: the author's profile, or the commander page, whose route loads every public deck for the commander with all its votes and ratings, ranks them in memory and returns 50, with no rate limit and no cache (`src/app/api/community/commanders/[slug]/decks/route.ts`, checked on `origin/dev` at `fee835d8`; [I-08](i08-share-compare-and-learn.md)'s L6). Nothing else lists public decks across authors, and `Deck.tags` is owner data that `PUBLIC_DECK_SELECT` keeps private. Archidekt's deck search sorts by views among other orders and shows "1000+" results, and Moxfield, read through an unofficial client because its pages answered 403, sorts by likes and views; neither says who counts or over what window. None found offers exclusion filters with and/or, a price with its basis, declared and estimated bracket apart, or an alert on a saved search. [I-29](i29-cross-site-deck-index.md) already describes most of these filters, but it is a 2027 horizon, waits for I-67's keys and a 10-million-deck benchmark, and rules popularity out of sorting. I-75 owns the query contract and the native corpus now, on the production PostgreSQL, and I-29's external decks join later behind the same contract. On Supabase Free every query must read an index, never the whole `DeckCard` table.

### Scope

- [ ] `DeckSearchQuery`, parsed from and written back to one canonical URL with a fixed key order and limits (slice 0); `PublicDeckSearch`, one row per public listed deck, kept in step by every route that writes a deck, with a parity test, and the author's "Show in deck search" switch (slice 1).
- [ ] `GET /api/community/decks` by commander, pair, colours, recency, author and name, sorted by update, listing date or votes, with keyset pages, a 2-second statement timeout, a CDN cache and a rate limit; the commander route reads it, which closes I-08's L6 (slice 2).
- [ ] A notice to authors of public decks 14 days before launch (slice 3), and `/community/decks`, signed out, with filter chips, counts on every result and `noindex` on every filtered URL (slice 4). Whether existing public decks are listed by default is [D-84](../owner-decisions.md#product-scope-and-non-goals).
- [ ] Cards all of, any of and none of, with names resolved before the query, a GIN index and committed plans at 10,000 and 50,000 decks (slice 5); price with its basis, declared bracket, quality defaults, primer, feedback, original and AI filters, and price sorts (slice 6).
- [ ] Popularity that resists manipulation: saves, votes and copies count only from eligible accounts (not the author, at least 7 days old, at most 30 counted actions a day), copies over 90 days, computed daily, shown beside every result, explained on "How this order works" and never the default order (slice 7); saved searches with "N new since you last opened it" (slice 10).
- [ ] Later: anomaly flags into I-38's queue through I-69's view (slice 8); public themes from I-54's vocabulary (slice 9); opt-in alerts on new matches through I-63, paused after 90 days unopened (slice 11), and a paid line for alerts above the allowance (slice 12); I-67's card keys and dated prices (slice 13); the estimated bracket and computed styles as separate facets (slice 14). I-29 slice 4 adds external decks behind the same contract.
- [ ] For the signed-in viewer only, an "owned" column and sort: the share of each list the viewer owns, with "free copies only" as a toggle, read from I-16 slice 4. It is never stored on the deck and never shown to others. A reply speaking for Moxfield calls it "something that we get a fair amount of requests for" ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1xl4te2/), 2026-11-01). riftbound.gg sorts public decks by "Collection" ([guide](https://riftbound.gg/?p=393), updated 2025-07-05). Added 2026-11-11.

### Engineering enablers

- Private, share-only, hidden, unlisted and deleted decks never appear, each change removes the row in the same transaction, and `budget`, `manualBracket`, tags and card notes never reach the row or the response.
- Card, colour and price filters match a brute-force reference over the same corpus.
- The author, young, restricted and blocked accounts count zero, the 31st action of a day counts zero, and an entitlement change leaves every count and order unchanged.
- At most 500 ms at p95 and three SQL statements per request on 10,000 and 50,000 synthetic decks, with committed `EXPLAIN` plans.

**Paid-tier angle:** search, filters, sorts, results, the browse page and saved searches are free and need no account. One candidate for I-30: alerts on more saved searches than a free allowance, three proposed, and the alert email digest through I-63 slice 10, as I-59 proposes for price alerts. No competitor found alerts on a deck search, and every deck an alert names stays reachable through the free search. Paying never changes a count, eligibility, order or placement.

### Enrichment (2026-11-11)

**User story.** As a player looking for a public deck, I want to filter by commander, cards and a price with its basis, so that I can see why a result appeared.

**Acceptance.**
- A result says which filters it matched.
- Popularity is not the default order.
- An author can keep a public deck out of search.

**UX.** Filters are chips on a signed-out page. A filtered URL is noindex, through I-34. The commander page reads this query instead of loading every deck.

**Data and API.** A search projection, updated in the same transaction as a deck write. Private fields never reach it. The route is rate-limited and cached.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `deck_search_run {filters: count, signed_in: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-out. Alerts on a saved search, later, are signed-in and wait on I-63. No flag that changes the order for some players.

**Open questions.** Whether existing public decks are listed by default is D-84. An owned-column for the signed-in viewer is a later slice and is never shown to anyone else.

### Definition of done

A signed-out player finds Atraxa decks that play Smothering Tithe but not Rhystic Study, under $150 and updated this year, and sees why each result appears and how the order is computed; an author who turns off "Show in deck search" leaves every result and alert at once; and the commander page reads at most 50 decks through an index, never every deck for the commander.

---

