# I-60: Player Stats And A Commander Year In Review

> **Initiative:** I-60, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for the private stats page and the private recap (slices 0 to 5 and 13); Later for sharing, images, measurement, game statistics and embeds (slices 6 to 12, 14 and 15), which wait for I-36, I-38, I-39 and I-35. A private 2026 recap is possible only if slices 1, 2 and 4 ship before 1 December 2026; the first shareable edition is realistic in December 2027 · **Written 2026-11-10**
> **Research:** one dated note on year-in-review features in hobby and game apps, EDHREC's yearly look at Commander, evidence on how recaps spread, what makes them feel creepy or pushy, and GDPR on profiling and public sharing. It is not committed, so every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the player's statistics across their own decks, the counting rules behind them, the yearly recap (opt-in, cut-off, frozen snapshot, sections, English and French text), its visibility levels and public projection, the recap image and embed routes, the recap's tone rules and its growth-loop measurement. **Does not own:** per-deck statistics and the bracket scorer (`src/lib/deck/stats.ts`, `bracket.ts`; [I-03](i03-trustworthy-deck-feedback.md), [I-28](i28-commander-deckbuilding-guide-by-bracket.md)); logging games and per-deck game figures ([I-35](i35-pod-game-log.md)); builds and their resolution ([I-55](i55-one-deck-several-builds.md)); the change log ([I-37](i37-editor-depth.md)); dated prices ([I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2); the deck image, the public projection and embeds as a surface ([I-36](i36-creator-and-embed-toolkit.md)); link-preview tags ([I-46](i46-discord-and-chat-integrations.md)); the event contract and first run ([I-39](i39-first-run-activation-and-measurement.md)); profiles, follows and reviews ([I-08](i08-share-compare-and-learn.md)); reporting, export, deletion and minors ([I-38](i38-trust-safety-and-user-rights.md)); the index policy and site-wide yearly reports ([I-34](i34-commander-data-reports.md)); plans and prices ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

A player with a dozen Commander decks cannot see them as a whole today. The profile lists public decks one by one, and no page answers "which colours do I build", "which cards are in all my decks" or "what did I build this year". A cross-deck statistics module exists in the code, but nothing calls it.

This initiative adds two things. First, a private **stats page** across the player's own decks: colours, commanders, the cards used most, brackets, deck value, cards shared across decks, decks built and changed, and, once I-35 ships, games logged, each with its denominator. Second, a **Commander year in review**: an opt-in recap, frozen at a stated cut-off, published each December in English and French, which the player may keep private, share by link or show on their profile.

The recap is a growth loop. Spotify counted over 500 million shares of Wrapped 2025, screenshots included [1], and Playgroup already ships a December "Rewind" for Commander games [9]. No deckbuilder found in this research offers a recap of the decks themselves. The loop works only if the recap stays free, counts honestly and never pushes: no streaks, no ranking against other players, no opponents named, no private deck made public without the owner's say.

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Product                               | What the recap or stats page shows                                                                                                                                                                                                                        | Access and threshold                                                                                                                                           | Take or avoid                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Spotify Wrapped** [1]               | Story cards of the year's listening. The 2024 edition was criticised for thin statistics and an AI podcast                                                                                                                                                | Free. Over 200 million engaged users in 24 hours (an engaged user viewed one story), and over 500 million shares, counting screenshots                         | Take: statistics first. Avoid: novelty that replaces the numbers                               |
| **Strava Year in Sport** [4][5]       | Personalised yearly recap and monthly stat cards                                                                                                                                                                                                          | Free from 2016; subscribers only ($80 a year) from December 2025. Strava: "we wanted to clarify the core benefits"; users objected publicly                    | Avoid: paywalling a recap that was free                                                        |
| **Letterboxd** [6]                    | Year-end "wrap" email with selected statistics                                                                                                                                                                                                            | Email for members who logged at least 10 films and opted in to the newsletter; "Pro and Patron members have access to their personalized stats all-year round" | Take: a minimum before a recap exists. Note: year-round stats are a paid tier                  |
| **Goodreads Year in Books** [7]       | Yearly page and email; sharing through a hashtag                                                                                                                                                                                                          | Email for members with at least three books read in the year; books kept private on Kindle are excluded                                                        | Take: private items stay out                                                                   |
| **Duolingo** [8] (2024)               | XP, longest streak, minutes learning, "where you rank among the community in a percentage format", "Duo's hit list"                                                                                                                                       | Free                                                                                                                                                           | Avoid: streaks, percentile rank, mascot pressure                                               |
| **Playgroup Rewind** [9][10][11]      | "Every December", a "shareable year in review": most played commanders, rivalries, longest games. A sample 2026 page shows "top 2.51% of active players", "-127 games from 2025", a named "nemesis", "EXTREMELY salty" and a win-rate change with no base | Free account to save stats; paid tiers (€4, €5, €15 a month) sell cosmetics and leagues, and do not list Rewind                                                | Take: December, Commander. Avoid: unnamed denominators, ranks, named opponents                 |
| **Moxfield** [12], **Archidekt** [13] | Moxfield's wiki lists per-deck statistics, a follow feed and unique deck views; Archidekt's news lists no profile statistics or yearly summary                                                                                                            | —                                                                                                                                                              | The opening this spec takes                                                                    |
| **Untapped.gg**, **17lands**          | Personal statistics for MTG Arena; Untapped sells longer history [14]. No yearly recap found by search                                                                                                                                                    | Paid history depth (Untapped)                                                                                                                                  | Evidence that personal history can sell                                                        |
| **EDHREC** [15] (2025-11-26)          | "A Statistical Look at (Almost) a Year in Commander": most-built commanders (Y'shtola, 23,582 decks), 47 of the top 100 commanders from precons, lists sharing at least 50% of a precon excluded                                                          | Free article; aggregates only, no per-player data; EDHREC keeps two years of data. No 2026 edition found on 2026-11-10                                         | Site-wide reports stay with [I-34](i34-commander-data-reports.md); this is the personal mirror |

**How recaps spread, and what they bring back.** Spotify's launch-day figures are its own [1]. Sensor Tower estimated that Spotify's daily active users rose 14% on the day Wrapped launched in 2023, with downloads up 35% (23% in 2022) [2]; a later Sensor Tower post gives about 90% for 2022 and 60% for 2023 [3]. The two posts disagree, neither states a method, and **neither says how long the effect lasts**. No published evidence found shows that a recap improves retention after its launch week. This spec therefore treats a recap as a sharing and acquisition event, and measures return visits without assuming them (requirement 9).

**What feels creepy or pushy.** In 2017 Netflix tweeted "To the 53 people who've watched A Christmas Prince every day for the past 18 days: Who hurt you?"; readers called it creepy because it used viewing data publicly, even unnamed [16]. Workshops with students found pleasure in Wrapped alongside "critique of data capture" and "the limits of the 'Wrapped self'": a label that claims to say who someone is [17]. The patterns to avoid are visible in the rows above: ranks against other players without a denominator, negative year-over-year framing, named opponents, streaks and rewards for sharing, and a free feature moved behind a paywall.

**Law (research, not legal advice).** Statistics that evaluate a person's "personal preferences, interests" or "behaviour" fit the GDPR's definition of profiling [18]; the Article 29 Working Party's guidelines on profiling are the reference reading [20]. A recap takes no decision about the player, but whether it is profiling, and on which lawful basis it runs, is a lawyer question. Article 25(2) requires that, by default, personal data are not made accessible "without the individual's intervention to an indefinite number of natural persons" [19]: a public recap therefore needs the player's own action, and a private deck needs a second one. In France a child under 15 needs a parent's joint consent where consent is the basis [22], which [I-38 requirement 9.3](i38-trust-safety-and-user-rights.md#9-minors) avoids by not relying on consent for accounts. The EDPB's guidelines on deceptive design patterns (version 2.0, 2023-02-24) [21] are the reference for the sharing dialog; this spec did not extract their text.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Profile page.** `src/app/[locale]/u/[username]/page.tsx` renders `src/components/profile/PublicProfileView.tsx` from `GET /api/users/[username]` (`src/app/api/users/[username]/route.ts`). It shows the avatar, name, "member since" month, follower and following counts, badges from `getPlayerBadges` in `src/lib/social/follow.ts` (10 or more public decks, an average rating of 4.5 or more, 5 trending decks), and a grid of public decks with commander art, `B{targetBracket}`, format and an AI tag. It shows no statistics. The response also carries the user's `id` and `createdAt`. Metadata sets a title, a description and hreflang alternates but no image, so the layout's `/og-image.svg` applies, which Discord ignores (I-46).
- **Profile routing.** Every page under `/u` is public (`PUBLIC_PAGE_PREFIXES` in `src/lib/auth/public-paths.ts`), and `src/app/sitemap.ts` lists every user with a username. A recap page under `/u` must check its own visibility and stay out of the sitemap.
- **Deck statistics.** `computeDeckStats` (`src/lib/deck/stats.ts`) works on one deck: curve, colour pips, themes, colour-identity violations and format measures (`format-stats.ts`). `scoreBracket` is in `src/lib/deck/bracket.ts`. `src/lib/export/stats-export.ts` exports one deck as CSV.
- **Unused cross-deck module.** `src/lib/deck/analytics.ts` ("Aggregated statistics across all user decks") has `aggregateDeckStats`, format, archetype and budget distributions, and is imported only by its own test. Its budget tiers are labelled in euros while `DeckCard.price` comes from Scryfall's `prices.usd`, and it names a price tier "cEDH", conflating cost with power.
- **Prices, history and origin.** `DeckCard.price` has no date. History is `Deck.createdAt`, `Deck.updatedAt` and `DeckSnapshot.createdAt`; no per-change record exists until I-37 slice 10 adds `DeckChange`. Nothing records whether a deck was built or imported; only `forkedFromDeckId` and `isAIGenerated` mark an origin.
- **Games.** No game log exists. `PlaytestSession` stores goldfish runs whose result the player declares. [I-35](i35-pod-game-log.md) proposes `PodGame` and `PodGameSeat`.
- **Follows and reviews (I-08 shipped).** `UserFollow` with `POST|DELETE /api/community/users/[username]/follow` and `FollowButton`; `DeckRating`, where a title marks a review, with `ReviewForm`, `ReviewList` and a helpful count; `DeckVote`; threaded `DeckComment`. `NotificationPreference` is stored, but no notification model or follow feed exists; both remain unchecked in I-08.
- **Images.** `dev` has only the free-text `src/app/api/og/route.tsx`; `src/lib/seo/` holds `alternates.ts` and `sitemap.ts`. The branch `feat/deck-og-image-from-stored-data` (`9c02f300`, two commits on 2026-11-09 and 2026-11-10; local, not pushed, no pull request found on 2026-11-10), which implements I-36 slice 2, adds `/og/deck/[id]` on Node.js, `src/lib/seo/deck-image.ts` (a version token from what the image prints), `src/lib/deck/social-image.ts` (one select, public decks only) and `src/components/og/DeckSocialImage.tsx`. It returns the same generic image for private and missing decks, caches for 60 seconds, excludes `og/` from the middleware matcher, and prints text **in the default locale only**. The recap image reuses this pattern but needs the locale in its path.
- **Locales.** `SUPPORTED_LOCALES` is `en` and `fr` (`src/i18n/routing.ts`). `src/lib/scryfall/localized.ts` reads a printing's French name where Scryfall has one.

## Functional requirements

### 1. Ground rules

1.1 Everything here computes over the player's own decks and games, on the server, deterministically. No language model writes, chooses or summarises any figure or sentence ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 Every figure shows its denominator ("in 7 of your 12 decks", "4 wins in 18 games"). A figure without a denominator is not shown.
1.3 **Each statistic counts a deck once.** A card counts once per deck whatever its quantity; a deck with builds counts through its main build ([I-55 requirement 8.4](i55-one-deck-several-builds.md#8-counting-copies)); snapshots are versions, not decks.
1.4 Nothing ranks the player against other players, and nothing is ranked or compared by money ([deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)).
1.5 Everything is private by default. Nothing becomes visible to others without the player's action, and a private deck needs a second, separate action (requirement 6.4) [19].
1.6 All of it is free (requirement 11).

### 2. The stats page

2.1 `/stats` is visible to the signed-in owner only, computed on request, for the current year by default, with a year picker back to the account's first year.
2.2 Sections: **colours** (decks per colour identity, and "green in 7 of 12 decks"); **commanders** (commanders and partner pairs, with those new this year); **cards used most** (the ten non-basic cards in the most decks, ties broken by name); **brackets** (computed bracket per deck from `scoreBracket` with its scorer version, the player's target beside it); **value** (requirement 3.6); **cards shared across decks** (how many distinct cards sit in two or more decks, and the five most shared); **decks built and changed** (3.4, 3.5); **games** (requirement 4).
2.3 Each row links to the decks behind it, so a count can be checked.
2.4 Charts carry text labels and do not rely on hue alone ([I-49](i49-colour-vision-and-low-vision-display.md)); each chart has a table equivalent.
2.5 It replaces `src/lib/deck/analytics.ts`, which is deleted with its test.

### 3. Counting rules

3.1 **Active decks** of a window are the decks that exist at the cut-off and were created, changed or played in a logged game within it. Statistics in a recap cover active decks only; the stats page offers "all decks" as well.
3.2 Commander statistics cover Commander-family formats ([I-42](i42-commander-variants-duel-cedh-pauper.md)); other formats appear as a count only.
3.3 Cards are identified by Oracle name (`DeckCard.name`), not printing; basic lands are excluded from "used most" and "shared". Colour identity comes from the commanders, else from the main deck, as `src/lib/deck/social-image.ts` does on the branch.
3.4 **Built** counts decks created in the window with origin "created" or "AI"; **imported**, **forked** and **duplicated** are counted apart once `Deck.origin` exists (slice 13). Until then a deck is counted as "added".
3.5 **Changed** counts decks with a snapshot or an `updatedAt` in the window, labelled "at least", because `updatedAt` keeps only the last change. Once I-37's `DeckChange` exists, it counts decks changed and cards added and removed exactly.
3.6 **Value** is the sum of `quantity × price` per deck at stored USD prices, shown only with a price date ([I-36 requirement 2.5](i36-creator-and-embed-toolkit.md#2-deck-embeds)), so it waits for I-32 slice 2. It shows the median and the highest deck value, never "spent" or "invested", and states how many cards have no price.
3.7 A deleted deck leaves every statistic and recap at the next render.

### 4. Game statistics (from I-35)

4.1 Games come only from [I-35](i35-pod-game-log.md) records the player logged or confirmed. Goldfish sessions never pool with real games.
4.2 Per deck and in total: games, wins, draws, and win share against fair share with a 95% Wilson interval, exactly as [I-35 requirement 4](i35-pod-game-log.md#4-personal-statistics) computes them.
4.3 A group under 10 games shows its count only, never a rate. Under 10 games in total, the games section shows "N games logged" and nothing else.
4.4 Opponents, linked players, pods, notes and fun ratings never appear in a recap. Seat labels never appear.
4.5 Every games figure carries "self-reported casual games" ([I-35 requirement 7.1](i35-pod-game-log.md#7-honesty)).

### 5. The year in review

5.1 **Opt-in.** The recap does not exist until the player switches it on for a year, or for every year until switched off (default off). Switching off deletes that year's recap.
5.2 **Invitation.** From 1 to 31 December, one dismissible card on `/decks` and `/stats` offers the recap to accounts with an active deck, with "Not now" the same size and weight as "Turn on" ([I-39 requirement 7.1](i39-first-run-activation-and-measurement.md#7-no-dark-patterns)). No email, push notification or modal.
5.3 **Cut-off and publication.** The recap for year Y covers 1 January to 30 November of Y (UTC) and is computed at 00:00 UTC on 1 December. A later opt-in computes with the same cut-off. Every card and image prints the window.
5.4 **Frozen rows.** The job stores one row per active deck ([Data model / API](#data-model--api)). Totals are recomputed from rows at render, so a deleted or hidden deck drops out of every total.
5.5 **Minimum data.** A recap needs one active Commander-family deck. "Cards used most" and "shared cards" need two; games follow 4.3. A section below its floor is left out, not shown empty.
5.6 **Format.** A sequence of six to nine cards, each one counted fact with its denominator, readable as one HTML page. No card auto-advances, motion respects `prefers-reduced-motion`, and the sequence is keyboard operable.
5.7 **Languages.** Every string lives in a `recap` catalogue in `en` and `fr`, held at key parity. Numbers, dates and plurals use the locale. Card and commander names use the French printed name where `src/lib/scryfall/localized.ts` finds one, resolved once at the cut-off and stored with the row; otherwise the English name.
5.8 Past recaps stay on `/stats` until the player deletes them.

### 6. Sharing and the public recap

6.1 **Levels:** private (default), link (an unguessable token, revocable by regeneration) and profile (a card on `/u/{username}` and the page `/u/{username}/recap/{year}`).
6.2 **Preview.** Before any level other than private is saved, the player sees exactly what others will see, section by section and deck by deck, beside what stays private.
6.3 Each section can be hidden. Value and games are hidden by default on link and profile levels.
6.4 **Decks.** Public decks are shown by default and can be excluded. A private deck is excluded unless the player picks, for that deck, "count in totals without its name" or "show this deck". No bulk action switches every private deck at once.
6.5 The public view reads the current visibility of every deck at render. Within 60 seconds of a deck turning private, a recap turning private or a deletion, every surface reflects it ([I-36 requirement 1.3](i36-creator-and-embed-toolkit.md#1-ground-rules-for-every-public-creator-surface)).
6.6 The public projection holds the username, display name, year, window, enabled sections and chosen decks, never the user id, email, follower counts or notes.
6.7 Recap pages send `noindex`, stay out of the sitemap, and are a page kind under [I-34](i34-commander-data-reports.md)'s index policy. `robots.txt` disallows `/recap/` and `/fr/recap/` (the I-08 item on French share paths applies).
6.8 A public recap can be reported through [I-38](i38-trust-safety-and-user-rights.md)'s generic report, because deck names are user text.

### 7. Tone: what the recap never says

7.1 Each sentence comes from a reviewed template holding one counted fact; no trait or personality label is inferred ("you are a Spike", "salty") [17].
7.2 No percentile, rank, leaderboard or "most active" claim about the player [8][10].
7.3 No year-over-year framing on a shared recap. On the owner's page, two years appear side by side only when both exist, without "less" or "down".
7.4 No streaks, time spent, login days or activity days ([I-39 requirement 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns)).
7.5 No reward, countdown or social proof for sharing ("your friends shared").
7.6 A catalogue test fails on a deny-list in both languages (for example "streak", "top %", "rank", "nemesis", "spent", "salty"; "série", "classement", "dépensé", "rageux").

### 8. Images, embeds and the growth loop

8.1 **Owner download.** `GET /api/user/recaps/{year}/image` returns a PNG, landscape 1200×630 or portrait 1080×1920, in `en` or `fr`, from the frozen rows and the current deck choices; it works at every level, private included.
8.2 **Public image.** `/og/recap/{username}/{year}/{locale}`, outside `/api/`, built only from stored data, for profile-level recaps; `locale` must be a served locale. Anything else returns the generic site image, with the same bytes for private, missing and malformed. It caches for 60 seconds and uses the deck image's components, middleware exclusion and art rules ([I-36 requirement 3](i36-creator-and-embed-toolkit.md#3-shareable-deck-images)).
8.3 Link-level recaps use the generic image, because no image URL carries a token (I-36 1.3). Profile recaps get full preview tags under [I-46](i46-discord-and-chat-integrations.md)'s contract; the alt text lists the figures shown.
8.4 **Visitor call to action.** A signed-out visitor sees one plain link, "See your own Commander year", leading to sign-up with `entry=recap`, then to I-39's first-run panel opened on import, so a new player's imported decks fill a stats page at once. No modal ([I-39 requirement 1.1](i39-first-run-activation-and-measurement.md#1-value-before-sign-up)).
8.5 **Embed.** `/embed/recap/{username}/{year}` renders the public recap under I-36's embed rules: server-rendered, no cookie or storage, `frame-ancestors *` on `/embed/*` only, and the "unavailable" state within 60 seconds.
8.6 Nothing is posted for the player: no follow feed entry, Discord message or email.

### 9. Measurement (through I-39)

9.1 This spec asks [I-39](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation) to add four events, enums and integers only: `recap_opt_in` (year, on or off), `recap_viewed` (year), `recap_visibility` (year; private, link or profile) and `recap_shared` (year; image size, link copy or native share; locale), plus `signup_entry` (recap, recap embed, other) written once at account creation. Changed 2026-11-10: the entry is the account field `User.signupEntry`, with `recap` among its values, written by [I-72](i72-growth-loops-referrals-creators-and-return.md#3-measuring-each-loop) slice 2 instead of an event.
9.2 Anonymous daily counters, server-side, without cookie or identifier: public recap views by level, public images served, embed loads and call-to-action clicks.
9.3 The owner view reports: opt-in rate among accounts active in the window, share rate among opted-in accounts, public views per shared recap, sign-ups with `User.signupEntry = recap` and their activation as I-39 defines it, and week-4 retention of recap viewers beside non-viewers, labelled "descriptive, not causal". Figures under 30 show as counts.
9.4 A causal claim needs I-39's experiment protocol, for example an invitation staggered by a week between two random halves (slice 15). The recap itself is never withheld.

### 10. Privacy, minors, export and deletion

10.1 The privacy policy ([I-38](i38-trust-safety-and-user-rights.md) slice 6) describes the stats page, the recap, the cut-off, the levels and the deletion path.
10.2 I-38's full export includes every recap, its rows and deck choices; deleting the account deletes them.
10.3 Rows hold deck ids, commanders, colour identity, brackets, distinct card names, change flags, value and game counts. They hold no notes, opponents or descriptions.
10.4 Until the lawyer answers open question 1, the profile level is available only to accounts whose age declaration (I-38 slice 7) is recorded.

### 11. What is free and what could be paid (I-30 decides)

11.1 **Free for everyone:** the stats page for every year, the recap with all its sections, images in both sizes and languages, every sharing level, embeds and the export. The player's own data is never the paid lever, and nothing free becomes paid ([I-30 requirements 1.2 and 1.4](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
11.2 **Why free:** the recap is an acquisition loop, and a paywall shrinks the audience that shares it. Spotify, Goodreads and Playgroup give recaps away [1][7][9]; Strava's move to subscribers in 2025 drew public complaints [4][5].
11.3 **Candidate:** statistics over any date range and trends across several years (colour mix per year, decks built per year), a personal tool over the player's history like I-30's "History across snapshots" row. Letterboxd sells year-round personal statistics [6] and Untapped sells longer history [14]; free deckbuilders show per-deck statistics only [12][13]. **Case: weak**, since no Commander player evidence of paying for this was found.
11.4 **Never paid:** the recap, its images, its sections, public pages, embeds, or the product's name on the image.

## Data model / API

```
YearRecap       id, userId → User (onDelete: Cascade), year, optedInAt, computedAt?, windowStart, windowEnd,
                methodVersion, visibility (private | link | profile), shareToken? @unique, hiddenSections String[],
                rows Json?        -- one entry per active deck, frozen at the cut-off
                @@unique([userId, year])
YearRecapDeck   recapId → YearRecap (onDelete: Cascade), deckId, level (excluded | totals | shown)
                @@id([recapId, deckId])
User            + recapEveryYear Boolean @default(false)
Deck            + origin? (created | imported | forked | duplicated | ai | sample)   -- null before slice 13
```

A row holds: `deckId`, `format`, commander Oracle names with French printed names, colour identity, computed bracket and scorer version, target bracket, distinct non-basic card names, `createdInWindow`, `changedInWindow` with its source (snapshot, `updatedAt` or history), value with price date, and I-35 game counts. Totals are a pure function of rows, deck choices and current deck visibility, so one function serves the owner page, the public page, the image and the embed.

- `GET /api/user/stats?year=` (owner; computed on request).
- `PUT|GET|PATCH|DELETE /api/user/recaps/{year}`: opt in, read with the public preview, change level, sections and deck choices, delete. `GET /api/user/recaps/{year}/image?size=landscape|portrait&locale=en|fr`.
- `GET /api/recaps/{username}/{year}` and `GET /api/recaps/link/{token}`: the public projection, the same `not_found` for private, missing and wrong token.
- Pages: `/stats`, `/stats/{year}`, `/u/{username}/recap/{year}`, `/recap/{token}`, `/og/recap/{username}/{year}/{locale}`, `/embed/recap/{username}/{year}`.
- A scheduled job at 00:00 UTC on 1 December computes rows for opted-in accounts; it is idempotent per user and year.

## Non-goals

- Streaks, badges, points, levels, rewards for sharing, re-engagement email or push notifications.
- Ranking or comparing players: percentiles, leaderboards, "top builder", or any ordering by deck value or spend.
- Naming opponents, pod members or rivals; recapping another person's games.
- A model-written recap, personality types or inferred traits.
- Site-wide yearly reports; they stay with [I-34](i34-commander-data-reports.md), which may reuse the counting module.
- Indexing recaps, adding them to the sitemap, or posting them anywhere on the player's behalf.
- Time spent in the product, sessions or activity days as statistics.
- A paid recap.

## Testing strategy

- **Solitary (pure):** fixtures for every counting rule: a deck with three builds counts once; a card with quantity 20 counts once in that deck; basics excluded; partner pairs; colourless decks; a deck created in December falls outside the window; a deleted deck leaves totals; floors of 5.5 and 4.3; Wilson intervals equal to I-35's computed values (25% at 20 games: 11.2–46.9%).
- **Projection:** a private deck never reaches the public projection without its `YearRecapDeck` level; "totals" adds to counts without name, commander or cards; hidden sections are absent from the JSON, not only from the page.
- **Sociable (API):** owner scoping on every `/api/user/*` route; the same `not_found` bytes for private, missing and wrong-token recaps; 60-second revocation; account deletion removes recaps; the I-38 export contains them.
- **Images:** the public image route returns the generic image for link-level, private, malformed locale and missing users; it reads no query parameter; French and English snapshots of each card.
- **Tone:** the deny-list test over the `recap` catalogue in both languages; catalogue key parity.
- **Crawlers and privacy:** `noindex` on recap pages, `robots.txt` disallows `/recap/` and `/fr/recap/`, absence from the sitemap, no cookie or storage write on public recap, image and embed responses.
- **Accessibility and end to end:** opt in, preview, publish to profile, view signed out in both locales, revoke; axe checks, keyboard path through the cards, reduced motion.

## Delivery slices

| #   | Slice                                                                                                                                                    | Depends on                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0   | Lawyer questions added to I-30's list; the stats and recap paragraph for I-38's privacy policy                                                           | — (owner and counsel; no code)          |
| 1   | Pure counting module: active decks, colours, commanders, cards used most, shared cards, brackets, built and changed; `src/lib/deck/analytics.ts` deleted | —                                       |
| 2   | `/stats` page and `GET /api/user/stats`, English and French, accessible charts with tables                                                               | 1                                       |
| 3   | Value section with dated prices                                                                                                                          | 2; I-32 slice 2                         |
| 4   | Opt-in, the 1 December job, `YearRecap` rows, the owner recap page, the December invitation, deletion, tone deny-list test                               | 2                                       |
| 5   | Owner image download, landscape and portrait, in both languages                                                                                          | 4; I-36 slice 2 (the deck image branch) |
| 6   | Levels, preview, deck choices, `/u/{username}/recap/{year}`, `/recap/{token}`, `noindex` and robots, 60-second revocation, report button                 | 4; I-36 slice 1; I-38 slices 7 and 8    |
| 7   | Public recap image and preview tags                                                                                                                      | 5, 6; I-46 slice 1                      |
| 8   | Events, counters and the owner growth view                                                                                                               | 4, 6; I-39 slices 10 and 12             |
| 9   | Visitor call to action into an import-first first run, with `User.signupEntry` _(re-pointed 2026-11-10 to I-72 slice 2)_                                 | 6, 8; I-39 slice 5; I-72 slice 2        |
| 10  | Games section on the stats page and in the recap                                                                                                         | 2, 4; I-35 slices 4 and 5               |
| 11  | Recap embed                                                                                                                                              | 6; I-36 slice 3                         |
| 12  | Exact change counts from the change log                                                                                                                  | 1; I-37 slice 10                        |
| 13  | `Deck.origin` written by the create, import, fork, duplicate and AI routes; built and imported counted apart                                             | 1                                       |
| 14  | Paid candidate: date ranges and multi-year trends                                                                                                        | 2; I-30 slice 0                         |
| 15  | Staggered-invitation experiment                                                                                                                          | 8; I-39 slice 14                        |

Slices 1, 2 and 4 give a player their own statistics and a private December recap with no dependency outside this spec. Slices 5 to 9 make it a growth loop and wait for the deck image, the public projection, I-38's report and age steps, and I-39's event store. Slices 10 and 12 deepen it as I-35 and I-37 land.

## Open questions

1. **Lawyer (route to [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate)):** Is the stats page or the recap profiling under Article 4(4) [18], and on which basis does each run: performance of the service the player asked for, legitimate interest, or consent? If the recap opt-in is consent, does a player under 15 in France need a parent's joint consent [22], and is a profile-level recap compatible with I-38's defaults for minors? Does the public level meet Article 25(2) [19] as designed?
2. **Cut-off:** 30 November with a 1 December release (this spec), or the full year with a January release, as Letterboxd's 2 January wrap does? A December release misses December's decks; a January one misses the season.
3. **Notice by email:** should a player who asks be able to receive one email when their recap is ready? It needs [I-63](i63-one-notification-system.md) slice 9 (the sender was I-38 slice 13), and I-39 7.4 forbids re-engagement email as written.
4. **Community comparison:** should a private recap set the player's colour mix beside I-34's published community figures with their n? It must not become a rank (7.2).
5. **Social figures:** should forks of the player's public decks (public under I-36 6.2) appear as an optional section? Follower counts stay out.

## Sources

All read on 2026-11-10 unless stated.

1. TechCrunch, Sarah Perez, "Spotify says Wrapped 2025 is its biggest yet, with 200M users in its first day", 2025-12-04. https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day
2. Sensor Tower, "Spotify Wrapped drives app usage; ski resort apps propelled by winter", December 2023 (estimates; method not stated). https://sensortower.com/blog/mmm-spotify-wrapped-drives-app-usage-ski-resort-apps-propelled-by-winter
3. Sensor Tower, "Spotify Wrapped is on a roll", September 2024 (estimates; disagrees with [2] on download changes). https://sensortower.com/blog/spotify-wrapped-is-on-a-roll
4. Ars Technica, Cyrus Farivar, "Strava puts popular 'Year in Sport' recap behind an $80 paywall", 2025-12-19, read through the Pipedot mirror https://pipedot.org/729NT. https://arstechnica.com/culture/2025/12/strava-puts-popular-year-in-sport-recap-behind-an-80-paywall/
5. road.cc, "Strava Year in Sport now only for subscribers", 2025-12-23. https://road.cc/content/news/strava-year-sport-now-only-subscribers-317425
6. Uproxx, "How to see your Letterboxd Wrapped", 2024-01-03, quoting Letterboxd's note on the 2023 wrap (Letterboxd's own help page answered 403). https://uproxx.com/tv/how-to-see-your-letterboxd-wrapped-2024
7. Goodreads, "Get Ready for Year in Books 2025", 2025-12-06. https://www.goodreads.com/blog/show/3064
8. Gamereactor, "Duolingo's Year in Review is here to tell you if you're safe from Duo's rage", 2024-12-03. https://www.gamereactor.eu/duolingos-year-in-review-is-here-to-tell-you-if-youre-safe-from-duos-rage-1462493/
9. Playgroup.gg, life counter page, "Every December" section. https://playgroup.gg/tracker
10. Playgroup.gg, a player's "2026 Rewind" page, as served on 2026-11-10. https://playgroup.gg/profiles/46552-eatman/rewind
11. Playgroup.gg, Premium. https://playgroup.gg/premium
12. Moxfield public wiki, "Features", last edited 2020-10-14. https://github.com/moxfield/moxfield-public/wiki/Features
13. Archidekt, News. https://archidekt.com/news
14. Untapped.gg, Premium, as cited by I-30 (read 2026-11-09; answered 403 on 2026-11-10). https://mtga.untapped.gg/premium
15. EDHREC, Arnaud Gompertz (data by Julia Maddalena), "A Statistical Look at (Almost) a Year in Commander - 2025", 2025-11-26. https://edhrec.com/articles/a-statistical-look-at-almost-a-year-in-commander-2025
16. The Washington Post, Hayley Tsukayama, on Netflix's "A Christmas Prince" tweet, republished by The Philadelphia Inquirer, 2017-12-12. https://www.inquirer.com/philly/business/technology/analysis-netflixs-creepy-tweet-reminds-us-all-how-closely-its-watching-us-20171212.html
17. T. Annabell and N. Rasmussen, "An algorithmic event: the celebration and critique of Spotify Wrapped", New Media & Society, 2025, doi:10.1177/14614448251391301 (record and abstract). https://researchonline.lse.ac.uk/id/eprint/129812
18. GDPR, Article 4(4), definition of profiling. https://gdpr-info.eu/art-4-gdpr/
19. GDPR, Article 25(2), data protection by default. https://gdpr-info.eu/art-25-gdpr/
20. Article 29 Working Party, "Guidelines on Automated individual decision-making and Profiling for the purposes of Regulation 2016/679", wp251rev.01, page dated 2018-08-22 (text not extracted). https://ec.europa.eu/newsroom/article29/items/612053
21. EDPB, "Guidelines 03/2022 on deceptive design patterns in social media platform interfaces", version 2.0, 2023-02-24 (title and date only). https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en
22. CNIL, "Recommandation 4 : rechercher le consentement d'un parent pour les mineurs de moins de 15 ans", 2021-06-09, as cited by I-38. https://www.cnil.fr/fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player sees statistics across their own decks on a private page: colours, commanders, the cards used most, brackets, deck value, cards shared across decks, and decks built and changed, each with its denominator. Each December, if they opted in, they get a Commander year in review in English or French, frozen at a stated cut-off, which they may keep private, share by link or show on their profile.

### Goals

- A player with ten decks opens `/stats` and sees colours, commanders, shared cards and brackets, each with its denominator; on 1 December an opted-in player gets a private recap in their language that names no other player and ranks them against no one; and a recap shared by link stops working within a minute of revocation and never reaches a search engine.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-60-01

As a player looking back at a year, I want counts of what I built, so that the recap is mine and not a ranking.

#### US-60-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-60-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-60-01 Happy path

Given a signed-in player and the English locale
When each statistic shows its denominator.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-60-02 Happy path

Given a signed-in player and the English locale
When the recap has no streak, no rank and no named opponent.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-60-03 Happy path

Given a signed-in player and the English locale
When the recap is private unless the player later opts into a share, which is Later.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-60-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-60-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-60-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests have no stats. The recap email, if the player asks for one, waits on I-63 and on the lawyer.

#### AC-60-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-60-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-60-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The stats page is a list of counts. The recap is a page in December, not a modal.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Pure counts over the player's decks. The dead analytics module is deleted. No public aggregate in this slice.

### Analytics and telemetry

`stats_opened {surface: page or recap}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests have no stats. The recap email, if the player asks for one, waits on I-63 and on the lawyer.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether the first recap cuts off at 30 November is open. A player under 15 and the lawful basis are lawyer questions.

### Sources

- https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day
- https://playgroup.gg/tracker
- https://playgroup.gg/profiles/46552-eatman/rewind
- https://road.cc/content/news/strava-year-sport-now-only-subscribers-317425

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-60: Player Stats And A Commander Year In Review

**Spec:** [`specs/i60-player-stats-and-year-in-review.md`](i60-player-stats-and-year-in-review.md)

**Outcome:** a player sees statistics across their own decks on a private page: colours, commanders, the cards used most, brackets, deck value, cards shared across decks, and decks built and changed, each with its denominator. Each December, if they opted in, they get a Commander year in review in English or French, frozen at a stated cut-off, which they may keep private, share by link or show on their profile.

**Status:** Next
**Priority:** Next for the private stats page and the private recap (slices 0 to 5 and 13); Later for sharing, images, measurement, game statistics and embeds (slices 6 to 12, 14 and 15). A private 2026 recap needs slices 1, 2 and 4 before 1 December 2026; the first shareable edition is realistic in December 2027
**Impact / effort:** Medium / medium
**Depends on:** nothing outside this initiative for slices 1, 2, 4 and 13; counsel for slice 0; I-32 slice 2 for dated prices (slice 3); I-36 slices 1 to 3 for the deck image, the public projection and embeds (slices 5, 6 and 11); I-38 slices 7 and 8 for age steps and reports (slice 6); I-46 slice 1 for preview tags (slice 7); I-39 slices 5, 10, 12 and 14 for measurement (slices 8, 9 and 15); I-72 slice 2's `User.signupEntry` for the sign-up entry (slice 9, added 2026-11-10); I-35 slices 4 and 5 for games (slice 10); I-37 slice 10 for exact change counts (slice 12); I-30 slice 0 for slice 14.

A player with a dozen decks cannot see them as a whole: the profile lists public decks one by one and shows no statistics. Recaps spread: Spotify counted over 500 million shares of Wrapped 2025, screenshots included ([TechCrunch, 2025-12-04](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day)), and Playgroup.gg ships a December "Rewind" for Commander games ([page](https://playgroup.gg/tracker)). No deckbuilder found offers a recap of the decks themselves. Recaps can also push and rank. Playgroup's sample 2026 page shows "top 2.51% of active players" and names a "nemesis" ([page](https://playgroup.gg/profiles/46552-eatman/rewind)), and Strava moved its recap to subscribers in December 2025, to public complaints ([road.cc, 2025-12-23](https://road.cc/content/news/strava-year-sport-now-only-subscribers-317425)). This recap is free, counts honestly, names its denominators and never pushes: no streaks, no ranking against other players, no opponents named, and no private deck made public without the owner's say. EDHREC's yearly article stays the site-wide view, under I-34.

### Scope

- [ ] Lawyer questions added to I-30's list, and the stats and recap paragraph for I-38's privacy policy (slice 0, no code).
- [ ] A pure counting module: active decks, colours, commanders, the cards used most, shared cards, brackets, and decks built and changed. A deck counts once, its builds through the main build, and a card once per deck (slice 1). It replaces `src/lib/deck/analytics.ts`, which only its own test imports, labels Scryfall's USD prices as euros and names a price tier "cEDH", conflating cost with power; slice 1 deletes it.
- [ ] A `/stats` page and `GET /api/user/stats` in English and French, with accessible charts and tables (slice 2), and a value section with dated prices (slice 3).
- [ ] The recap: an opt-in, a job on 1 December over 1 January to 30 November, frozen `YearRecap` rows, an owner page, the December invitation, deletion and a tone deny-list test (slice 4), and an image download in both orientations and languages (slice 5).
- [ ] `Deck.origin` written by the create, import, fork, duplicate and AI routes, so that built and imported decks are counted apart (slice 13). Today only `forkedFromDeckId` and `isAIGenerated` mark an origin.
- [ ] Later: sharing levels, a preview, `/u/{username}/recap/{year}` and `/recap/{token}`, `noindex` and robots rules, revocation within 60 seconds and a report button (slice 6). Every path under `/u` is public by prefix (`PUBLIC_PAGE_PREFIXES` in `src/lib/auth/public-paths.ts`), and `src/app/sitemap.ts` lists every user with a username, so the recap page checks its own visibility and stays out of the sitemap.
- [ ] Later: the public recap image and preview tags (slice 7), events and the owner's growth view (slice 8), a visitor call to action into an import-first first run (slice 9), games from I-35 (slice 10), a recap embed (slice 11), exact change counts from I-37's change log (slice 12), and a staggered-invitation experiment (slice 15).
  - Slice 9's sign-up entry is `User.signupEntry = recap`, written by [I-72](i72-growth-loops-referrals-creators-and-return.md) slice 2, instead of a `signup_entry` event (2026-11-10).
- [ ] After I-30's decision: statistics over any date range and trends across several years (slice 14).

### Engineering enablers

- One module counts decks, builds and cards by stated rules, and every figure on the page and in the recap names its denominator.
- A tone test fails on any streak, rank, percentile, named opponent or share reward in the English and French recap text.
- A private or link-only recap is absent from the sitemap and returns nothing at its public path, a public recap is `noindex`, and a revoked link stops working within 60 seconds.
- Deleting the account deletes its recaps, and I-38's export holds them.

**Paid-tier angle:** the stats page for every year, the recap with all its sections, images, sharing levels, embeds and the export stay free. The recap is an acquisition loop, Spotify, Goodreads and Playgroup give theirs away, and Strava's move to subscribers drew public complaints. The one candidate is statistics over any date range and trends across several years, a personal tool over the player's history; the spec rates the case weak.

### Enrichment (2026-11-11)

**User story.** As a player looking back at a year, I want counts of what I built, so that the recap is mine and not a ranking.

**Acceptance.**
- Each statistic shows its denominator.
- The recap has no streak, no rank and no named opponent.
- The recap is private unless the player later opts into a share, which is Later.

**UX.** The stats page is a list of counts. The recap is a page in December, not a modal.

**Data and API.** Pure counts over the player's decks. The dead analytics module is deleted. No public aggregate in this slice.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `stats_opened {surface: page or recap}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests have no stats. The recap email, if the player asks for one, waits on I-63 and on the lawyer.

**Open questions.** Whether the first recap cuts off at 30 November is open. A player under 15 and the lawful basis are lawyer questions.

### Definition of done

A player with ten decks opens `/stats` and sees colours, commanders, shared cards and brackets, each with its denominator; on 1 December an opted-in player gets a private recap in their language that names no other player and ranks them against no one; and a recap shared by link stops working within a minute of revocation and never reaches a search engine.

---

