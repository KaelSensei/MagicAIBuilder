# I-53: Monthly Deckbuilding Challenges

> **Initiative:** I-53, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later. The rule checker, the brief page and private challenges between friends (slices 1, 5 to 8) need no vote, no prize and no legal answer, and could be promoted first · **Written 2026-11-10**
> **Research:** one dated note on deckbuilding contests, players' own challenges, vote fairness and prize law. It is not committed, so every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** challenge briefs and their checkable rules, entries frozen at submission, judging, the community vote on finalists, results, the archive, recognition awards, private challenges between friends, and the sponsor and prize policy for challenges. **Does not own:** deck visibility, votes and comments on decks, and notifications ([I-08](../roadmap.md#i-08-share-compare-and-learn)); the public projection of a deck and the creator page ([I-36](i36-creator-and-embed-toolkit.md)); dated prices ([I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2); the bracket check ([I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 7); rarity from printings ([I-42](i42-commander-variants-duel-cedh-pauper.md) slice 10); reports, decisions and appeals ([I-38](i38-trust-safety-and-user-rights.md)); stores and their nights ([I-41](i41-store-commander-nights.md)); the index policy ([I-34](i34-commander-data-reports.md) slice 1); product events ([I-39](i39-first-run-activation-and-measurement.md)); Discord feeds ([I-46](i46-discord-and-chat-integrations.md)); plans and prices ([I-30](i30-business-model-and-paid-tier.md)).
> **Answers two non-goals elsewhere:** I-36 leaves out "contests and community programming", and I-34 leaves out community voting events as "a separate decision". This spec is that decision for deck challenges. It does not cover salt-style card votes.

## Overview

A challenge is a public brief, such as "Bracket 2 under 50 euros", "a commander from the newest set", "no rares" or "one deck per colour pair", with a deadline. Players enter one of their own decks. The product checks each entry against the brief's rules with its deterministic tools: legality, bracket rules, Game Changers, colour identity and a price with its date. People judge what tools cannot: creativity, flavour and the primer. The results page and the archive keep every brief, finalist and check report.

The 2026-11-10 gap-mining rated it new, with effort from S (a process and a tag) to M (submission and judging screens), no direct paid potential, and its value in habit, content and sponsorship. The research supports the habit claim. Archidekt has run deckbuilding contests since at least 2023, monthly with EDHREC since at least March 2025, and one month's finalists came "from among the nearly thousand decks entered" [3]–[5]. Players on r/EDH also set themselves constraints and check them by hand [9]–[13].

The design keeps three rules. Entering, checking, viewing and voting are free and need no purchase. No model decides eligibility, a shortlist or a winner. Recognition comes first, and prizes wait for a lawyer.

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Organiser                                               | Brief and checks                                                                                                                                                                                                                                                                      | Judging and voting                                                                                 | Prizes and terms                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archidekt × EDHREC**, monthly [1]–[4]                 | A prompt on the first Wednesday and one week to build; November 2026: "Build around a deep-cut commander". Commander-legal, built on Archidekt; spoiled cards allowed; "Strictly one deck submitted per user"; a description is required. The archive lists contests since March 2025 | Staff pick three finalists for "creativity and originality"; placement by "Like" count over a week | Cardsphere credit of $250, $150 and $100. Sponsor "EDHREC, LLC, dba Space Cow Media"; 18 or the age of majority; "Void where prohibited"; "No purchase or payment of any kind is necessary"; New York courts. No clause on second accounts or vote solicitation beyond "tampers with the Entry process" |
| **Archidekt**, June 2023 [5]                            | "$100 (USD) or less using Card Kingdom pricing (basic lands not included)"; "Prices can fluctuate over the course of a week, so we'll afford decks a little bit of wiggle room"                                                                                                       | Staff shortlist, then a two-day Twitter poll                                                       | "Card Kingdom-sponsored": $50, $30 and $20 in store credit. Residents of the United States and Canada, Quebec excluded                                                                                                                                                                                  |
| **Magic's official Discord**, Deck Doctor Challenge [6] | "build the most on-flavor Commander deck you can around the holiday festivities", 8–14 December 2023                                                                                                                                                                                  | "Our server members will vote on their favorite deck"                                              | None stated                                                                                                                                                                                                                                                                                             |
| **EDHREC salt vote** [7]                                | A card vote, not a deck contest: 2.2 million votes over five days in 2026                                                                                                                                                                                                             | Ranked "by average saltiness, not raw vote count"                                                  | No safeguard against manipulation is described                                                                                                                                                                                                                                                          |

Searches on 2026-11-10 found no Moxfield contest, no cEDH brew contest, no Command Zone or Commander's Quarters community challenge and no French-language challenge. That is absence of evidence, not proof.

**What players do on their own.** Of the 100 most recent r/EDH posts with "challenge" in the title, from 2025-12-03 to 2026-10-31, 31 concern the "32 deck challenge", one deck per colour identity, and two ask for "a blank 32 challenge" to download [14]. The top post (338 points, 100 comments, 2026-07-09) finishes it after a year [9]. Another recommends a "deck of the month" challenge (66 points) [10]. Pods write their own briefs: "bracket 3, $20 max budget (not counting basic lands) using TCGPlayer as benchmark", where a player was "only 16 cents over" [11]; "None of us can use any game changers" with no card "over 30$(CAD)" [12]; "Max $50 budget using market pricing, no game changers", with colours "randomly given" [13].

**Fairness.** The large contest puts staff between entries and the vote: popularity chooses among three finalists, not among a thousand entries [1][3]. Its rules name no defence against second accounts [2]. A PC-building contest's organisers removed votes from "known Russian voting farms" after reviewing vote logs, and the entrant called the contest a "scam" (undated; about 2019) [8].

**Legal frame (research, not legal advice).** In France, the Code de la sécurité intérieure bans lotteries. Since 2014 a lottery is a public offer that raises a hope of gain, depends even partly on chance and demands a financial sacrifice. Article L322-2-1 extends the ban to games that rely on the player's skill when a payment is demanded, even a refundable one [16]. In the United States, a lottery is a prize, chance and consideration. Under the "any chance" doctrine, popularity voting can turn a skill contest into a game of chance; "Unrestricted voting is more likely to be considered chance"; some states require "a bona fide judge"; and New York and Florida require registration and bonding for games of chance with prizes over $5,000 [17]. The Fan Content Policy allows sponsors who are shown "acting as a sponsor only" and never associated with Wizards; it says nothing about contests [15].

**The gap.** Organisers check briefs by hand and forgive price drift; pods check budgets against a seller's site by hand. No contest found publishes a per-entry check report, with legality, bracket rules and a dated price, or freezes the list at entry. No host tools were found for a store, a creator or a group of friends.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **An orphan challenge module exists.** `src/lib/challenges/challenges.ts` arrived on 2026-03-30 inside the deck-branching pull request (#246). Nothing imports it, and no schema backs it. It validates format, a mono colour, a removal count and a `bracketScore`. It multiplies an uncomputed `score` by type (`creativity: 1.5`, `speed: 0.8`), ranks entries by that score and grants a badge to the top 25% and a `"golden-frame"` cosmetic to the top 10%. Requirement 5.2 and slice 1 replace it.
- **Tags are private.** `Deck.tags` exists, but `PUBLIC_DECK_SELECT` (`src/lib/deck/public-deck-select.ts`) leaves it out, and its comment lists tags among the owner's fields. A challenge cannot be a public tag without changing that rule.
- **Votes, ratings, comments and follows exist** (I-08). `DeckVote` stores +1 or −1, one row per user and deck; `POST /api/community/decks/[id]/vote` refuses a vote on one's own deck and has no rate limit. Commander discovery (`/commanders/[slug]/decks`) orders decks by vote score through `rankDecksByScore` (`src/lib/community/votes.ts`). `DeckRating` holds stars and reviews; `DeckComment` is threaded. `getPlayerBadges` (`src/lib/social/follow.ts`) gives `community_builder` at 10 public decks, `highly_rated` at an average of 4.5 and `trending` at 5 recently rated decks. No featured-deck slot exists.
- **Deterministic checks exist.** `validateDeck` (`src/lib/deck/validation.ts`) checks Commander legality. `scoreBracket` (`src/lib/deck/bracket.ts`) computes on read and stores nothing; `BracketLevel` stops at 4 (`src/lib/constants/brackets.ts`).
- **Prices are undated USD.** `DeckCard.price` is Scryfall's `usd`, with no date; `src/lib/deck/pricing.ts` says so. No EUR price exists.
- **Snapshots exist but die with the deck.** `DeckSnapshot.cardList` is JSON, created through `src/app/api/decks/[id]/snapshots/route.ts`, and deleting a deck cascades to it.
- **Narrow moderation, no delivery, no scheduler.** `User.isModerator` gates `/moderation/reports`, which reviews `DeckReport` only. `NotificationPreference` stores four switches, but no notification is delivered. No cron route or `vercel.json` exists. `src/lib/rate-limit.ts` keeps counts in process memory. No code under `src/` outside tests reads `User.emailVerified`.

## Functional requirements

### 1. Ground rules

1.1 **Free and no purchase.** Reading a brief, checking a deck, entering, voting, results and the archive need at most a free account and never a plan, a payment or ownership of the cards. An entry is a list, not a collection.
1.2 **Weight one.** Every eligible ballot counts once. No plan, badge, rating, follower count or spend changes a vote, an entry's order or an award.
1.3 **No model decides.** Eligibility comes from deterministic rules; shortlists, awards and judges' notes come from people. No challenge route calls a model ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.4 **No engagement loop, recognition first.** No streaks, points, levels or leaderboards across challenges, and no reminder on by default ([I-38 9.1](i38-trust-safety-and-user-rights.md#9-minors)). Awards carry no prize until group 9's gate opens.

### 2. The brief and its checkable rules

2.1 A brief has a title, a text, a schedule (entries, judging, voting, results), judging criteria written for people, and typed rules. Anything tools cannot check, such as "on-flavour", is a criterion, never a rule. Default schedule, a hypothesis: 14 days of entries, 7 of judging, 7 of voting.
2.2 Rule types: `legal` (always on); `bracketRules {bracket}` from I-28's hard rules; `maxGameChangers {n}`; `colorIdentity {exact | within, colors}`; `slots {identities}` for "one deck per colour pair"; `commanderIn {cards, query, frozenOn}`; `maxRarity {common | uncommon}`; `maxTotalPrice {market, amount, excludeBasics, unpriced}`; `maxCardPrice {market, amount}`; `bannedCards`; `aiGenerated {allowed}`.
2.3 The brief page renders each rule as a plain sentence in English and French, beside the rule's machine form.
2.4 A `commanderIn` rule built from a Scryfall query shows that query and the date the list was frozen ([strategic boundaries](../roadmap.md#strategic-boundaries): no hidden query). The list does not change after the brief opens.
2.5 The brief says whether cards spoiled but not yet released count, and whether AI-generated decks may enter; an allowed AI deck keeps its label everywhere ([I-36 1.5](i36-creator-and-embed-toolkit.md#1-ground-rules-for-every-public-creator-surface)).

### 3. Checks

3.1 `checkDeckAgainstRules(cards, rules, context)` is a pure function. Each rule returns `pass`, `fail` or `unknown` with its evidence: the failing cards, the total and its date, the Game Changers named. "Check my deck" runs it on any of the player's decks and stores nothing.
3.2 Price rules read I-32's dated snapshot in the brief's market, EUR or USD, with no conversion. The report states amount, currency, source and date, for example "47.80 EUR, Scryfall daily price from Cardmarket, 2026-11-10, basic lands excluded".
3.3 An unpriced card is `unknown`. The brief chooses whether `unknown` blocks the entry or is ignored; the default blocks and lists the cards.
3.4 Price basis is the day of entry by default, or a fixed date the brief states. A passing entry stays eligible when prices move later, which removes the "wiggle room" judgment [5].
3.5 `bracketRules` uses I-28 slice 7's hard rules; the bracket estimate appears as information and never decides. Until slice 7 ships, only `maxGameChangers` is offered.
3.6 `maxRarity` uses I-42 slice 10's printing rule and inherits its open question on downshifted and special printings.

### 4. Entries

4.1 An entry needs a public deck (I-08) in a public challenge. Submission freezes the main deck and commanders through I-36's public projection, with no notes, budget or tags, and stores the check report with the checker version and price date.
4.2 Only an entry whose report passes is accepted. One entry per account per challenge, or per slot in a slotted brief. The entrant may withdraw and resubmit before entries close.
4.3 The entry page shows the frozen list. When the live deck differs, it says "changed since entry" and links to it.
4.4 A deck made private or deleted, or an account deleted, withdraws the entry from every surface and clears its frozen list. An award keeps a "withdrawn entry" line without a name ([I-38 group 6](i38-trust-safety-and-user-rights.md#6-account-deletion)).
4.5 The gallery orders entries by a hash of challenge, entry and day: the same order for every visitor that day, never by votes, views, ratings or time of entry. Filters cover colour identity, commander and slot.

### 5. Judging, results and recognition

5.1 Judges are the host and up to three guest judges, each with a public conflict-of-interest line. A judge cannot enter or vote.
5.2 Judges shortlist three to five finalists against the published criteria and write a note for each. Awards: finalist, judges' choice, community choice (group 6) and, in a slotted brief, one judges' choice per slot. No award derives from a score multiplier, a percentile or a count of entries, so the orphan module is deleted.
5.3 The results page shows each finalist's list, check report, judges' note and award, with vote counts after the vote closes. It computes statistics over eligible entries: count, colour identities, commanders, the most included non-land cards with count and share, and the median price with its date. Below 10 entries, a hypothesis, statistics are withheld and the page says "not enough entries".
5.4 `/challenges` lists open and past challenges. Past results are permanent pages, registered as a page kind in I-34's index policy.
5.5 A profile lists the player's awards as dated links to results, with no total, rank or level, and a deck page shows its award. Each award type has a published, non-monetary criterion ([I-36 6.5](i36-creator-and-embed-toolkit.md#6-creator-page-and-attribution)).

### 6. Community vote and moderation

6.1 After shortlisting, any account created before entries opened may vote for one finalist and change that vote until the close. An entrant cannot vote for their own entry. Counts stay hidden until the close, and voters are never shown.
6.2 The tally counts eligible, unvoided ballots, weight one each (1.2), and reads no plan, badge or account field beyond creation date. Ballot writes are rate limited per account on the shared limiter that I-36 slice 11 requires.
6.3 Community choice is labelled a popularity result and never carries a prize (9.2).
6.4 Each challenge links to its conduct rules: one entry, no second accounts, no buying or trading votes; sharing an entry's link is welcome. Briefs, entries, judges' notes and comments can be reported through I-38's notice form.
6.5 Disqualifying an entry, voiding ballots or cancelling a challenge each takes an I-38 decision with a statement of reasons; results state how many ballots were voided, and a cancelled challenge keeps its brief and a public reason. No IP address, fingerprint or cookie is stored for voting, the line [I-36 group 8](i36-creator-and-embed-toolkit.md#8-view-counts-and-privacy) keeps for views.

### 7. Hosts

7.1 **Product challenges** are authored by moderators or the owner; they are the monthly public challenge. **Creator challenges** wait for the owner (open question 6).
7.2 **Private challenges** can be opened by any account for up to 12 members through an invite link. Members' entries, private decks included, are visible only to members, through the public projection. The host may draw slots, such as colour pairs, with a seeded draw that shows its seed, so any member can replay it. No vote is required.
7.3 **Store challenges** belong to a verified [I-41](i41-store-commander-nights.md) store and appear on its store page. The store may announce results at a night; the product records no game result.

### 8. Measurement

8.1 I-39 product events count briefs viewed, checks run, entries, withdrawals, ballots, private challenges opened and repeat entrants, with no deck content. The first public product challenge opens once open question 1's threshold is met.

### 9. Prizes and sponsors (gated)

9.1 No prize, credit or gift is awarded through the product until the owner records the lawyer's answers (slice 0). A challenge with a prize then publishes a rules page with eligibility, age, territories and the prize's provider before it opens.
9.2 Only judges' awards may carry a prize. Community choice never does [17].
9.3 A sponsor appears as a text credit, "Sponsor: name", with a link marked `rel="sponsored noopener"`. It carries no pixel, script or tracking parameter, and says that the sponsor acts "as a sponsor only", with no association with Wizards [15]. The credit follows [I-32 group 1](i32-seller-handoff-and-affiliate-carts.md#1-disclosure-and-ordering).
9.4 A sponsor never judges, shortlists, sees ballots or receives entrants' data. A brief never requires buying from the sponsor or using its stock.
9.5 A store or sponsor that offers a prize delivers it itself. The product shows its prize note, as I-41 1.3 does, and handles no money, credit or shipping.

### 10. What could be paid (I-30 decides)

10.1 **Never paid:** everything in 1.1, private challenges and recognition. A paid entry could also be the financial sacrifice that turns a French skill contest with a prize into a lottery [16] (research, not legal advice).
10.2 **Candidate:** store challenges inside I-41's store plan, such as recurring templates and an entry export; a store already pays there for organiser tools. No reviewed contest offers host tools to stores, creators or friends, and Archidekt runs one contest for the whole site [4]. The paid value is small, as the gap-mining found.
10.3 **Sponsorship** by a store or a creator can fund prizes without breaching the boundaries if 9.2 to 9.5 hold: it buys a labelled credit on one challenge, never an entry's place, a vote or a judge. No public sponsorship rate was found, so no revenue is estimated.

## Data model / API

```
Challenge       id, slug @unique, hostKind (product | private | store | creator), hostUserId, storeId?, title, brief,
                criteria, rules Json (ChallengeRule[]), rulesVersion, priceMarket (eur | usd)?, priceBasis (entry | fixed),
                priceDate?, spoiledAllowed, prizeNote?, sponsorId?, inviteToken? @unique,
                status (draft | open | judging | voting | closed | cancelled), opensAt, entriesCloseAt,
                votingOpensAt?, votingClosesAt?, resultsAt?, cancelReason?
ChallengeJudge  challengeId, userId, role (host | guest), conflictNote?                   @@id([challengeId, userId])
ChallengeEntry  id, challengeId, userId?, deckId?, slot ("" if none), frozenCards Json?, checkReport Json, checkerVersion,
                priceDate?, status (eligible | withdrawn | disqualified), decisionId?, submittedAt, withdrawnAt?
                                                                                           @@unique([challengeId, userId, slot])
ChallengeBallot challengeId, voterId, entryId, castAt, voidedAt?, voidDecisionId?        @@id([challengeId, voterId])
ChallengeAward  challengeId, entryId, kind (finalist | judgesChoice | communityChoice | slotChoice), slot?, note?, votes?
Sponsor         id, name, url, kind (store | creator | other), agreementRef (owner only)
```

`ChallengeRule` is a discriminated union with an exhaustive `never` guard. `frozenCards` holds the public projection only, and a schema test guards that. Routes: `GET /api/challenges`; `GET /api/challenges/[slug]`; `POST /api/challenges/[slug]/check` (no write); `POST|DELETE /api/challenges/[slug]/entries`; `PUT|DELETE /api/challenges/[slug]/ballot`; host routes to create, edit, shortlist and award; `GET /api/challenges/join/[token]`. Pages: `/challenges`, `/challenges/[slug]`, `/challenges/[slug]/results`.

## Non-goals

- Entry fees, paid entries, paid or weighted votes, paid placement or a "featured entry" ([deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)); random prize draws, cash prizes, and prize delivery, tax forms or shipping by the product.
- Points, streaks, levels or leaderboards across challenges.
- Game results or tournament play; I-35 and I-41 own the table.
- A model that checks rules, shortlists, judges, writes judges' notes or summarises results; requiring card ownership or a purchase, or reading the collection.
- Open public challenge creation by any account; salt-style card votes.

## Testing strategy

- **Rules (solitary):** each rule type on fixtures: partner colour identity, basic lands excluded, an unpriced card under both policies, a frozen commander list, rarity from printings, Game Changers named. An unknown rule type fails to compile.
- **Reproducibility:** rerunning the check on a frozen list with its recorded price date and checker version gives an identical report.
- **Boundaries:** no challenge module imports the AI client; no challenge route reads a plan or entitlement; the tally function takes ballots and creation dates only.
- **Entries (sociable):** a failing report is refused; a second entry is refused; a deck made private disappears from the gallery and results; `frozenCards` never holds notes, budget or tags.
- **Ballots:** an account created after `opensAt`, a judge and a self-vote are refused; responses hold no counts before the close; a void needs a decision id.
- **Order and privacy:** the gallery order is stable within a day, changes the next day, and ignores votes, views and ratings; no public response holds a private challenge's entries; the slot draw replays from its seed.
- **Honesty:** price lines show currency, source and date; withheld statistics show "not enough entries"; labels render in EN and FR.

## Delivery slices

| #   | Slice                                                                                                                            | Depends on                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0   | Lawyer questions added to I-30 7.2 (open question 2)                                                                             | — (owner and counsel; no code)                                 |
| 1   | `checkDeckAgainstRules`: legality, Game Changers, colour identity, slots, commander list, banned cards, AI label; orphan deleted | —                                                              |
| 2   | Price rules on dated prices                                                                                                      | 1; I-32 slice 2, or I-29 slice 1 if it ships first             |
| 3   | `bracketRules` from the bracket check                                                                                            | 1; I-28 slice 7                                                |
| 4   | `maxRarity` from printings                                                                                                       | 1; I-42 slice 10                                               |
| 5   | Challenge model, host authoring, brief page with plain-language rules, archive list                                              | 1                                                              |
| 6   | "Check my deck" on the brief page                                                                                                | 5                                                              |
| 7   | Entries: frozen list, one per account or slot, withdraw, "changed since entry", daily gallery order                              | 6; I-36 slice 1                                                |
| 8   | Private challenges: invite link, member-only gallery, seeded slot draw                                                           | 7; I-21 slice 1 for the seeded draw                            |
| 9   | Judges, shortlist, notes, awards, results page                                                                                   | 7                                                              |
| 10  | Reports, withdrawal, disqualification and cancellation with decisions                                                            | 7; I-38 slices 8 to 10                                         |
| 11  | Community vote on finalists                                                                                                      | 9, 10; I-36 slice 11's shared limiter                          |
| 12  | Results statistics with the withholding threshold; awards on profiles and deck pages; index policy page kind                     | 9; I-34 slice 1                                                |
| 13  | Product events and the demand threshold                                                                                          | 7; I-39 slice 10                                               |
| 14  | Store challenges on store pages                                                                                                  | 9; I-41 slices 3 and 11                                        |
| 15  | Announcements: opt-in notice and a Discord webhook feed                                                                          | 5; I-08 notifications; I-46 slice 5                            |
| 16  | Sponsor credit                                                                                                                   | 5; **Blocked** on slice 0 and the owner's answer to question 3 |
| 17  | Prize-bearing challenges: rules page, eligibility, judges-only prizes                                                            | 9; **Blocked** on slice 0                                      |

Slices 1 and 5 to 8 ship without votes, prizes or legal answers, and serve the pods of [11]–[13]. The first public monthly challenge needs slices 9 to 11 and 13.

## Open questions

1. **Is there enough demand for a public monthly challenge?** Archidekt drew close to a thousand entries in June 2026 [3], on a site the [roadmap](../roadmap.md#owner-ambition-and-business-model-2026-11-09) puts at about 8.3 million visits in September 2026 (Semrush estimate). A thin public challenge reads as an empty product. Set the threshold from slice 13's events, for example 20 expected eligible entries (a hypothesis), and start with private challenges.
2. **For the lawyer (research, not legal advice):** Is a recognition-only challenge outside lottery and contest law? With a prize, does a free account count as no financial sacrifice while a paid tier exists (L322-2-1) [16]? Which territories and minimum age apply? Archidekt requires 18 [2] and excluded Quebec in 2023 [5]. May a community vote decide any prize [17]? How must a sponsor credit be labelled under French advertising law, as I-32 asks? Who owes tax on store credit?
3. **Does I-38's "no ads" default allow a sponsor credit?** I-38 9.1 lists "no ads" among defaults safe for minors. A text credit without tracking may still count as advertising. The owner decides.
4. **Price basis:** day of entry, as here, or one fixed date for everyone? The fixed date treats entrants equally but cannot price cards spoiled after it.
5. **Spoiled cards and AI decks:** Archidekt allows spoiled cards [1]. Should AI-generated decks enter, given r/EDH's hostility to AI ([roadmap](../roadmap.md#owner-ambition-and-business-model-2026-11-09))?
6. **Creator challenges:** let I-36 creators host, and under what review? A personal "32 deck challenge" tracker, which players ask for [14], is a related idea for I-08 or I-27.

## Sources

Read 2026-11-10 unless dated otherwise.

1. EDHREC, Dana Roach, "Archidekt Deckbuilding Contest — September 2026", 2026-09-02. https://edhrec.com/articles/archidekt-deckbuilding-contest-september-2026
2. Archidekt, official contest rules, footer "Space Cow Media ©2026". https://archidekt.com/contestRules
3. EDHREC, Dana Roach, "Archidekt Deckbuilding Contest Finalists - June 2026", 2026-06-17. https://edhrec.com/articles/archidekt-deckbuilding-contest-finalists-june-2026
4. Archidekt, contest page, with the November 2026 prompt and contests listed since March 2025. https://archidekt.com/contest
5. Archidekt, "Deckbuilding Contest - June 2023", entries due 2023-06-30, edited 2023-07-04. https://archidekt.com/news/4773772
6. Wizards of the Coast, "What's Coming up on Magic's Discord Server – December 2023", 2023-12-01. https://magic.wizards.com/en/news/announcements/whats-coming-up-on-magics-discord-server-december-2023
7. EDHREC, Nick Wolf, "Salt Vote Results 2026", 2026-10-16. https://edhrec.com/articles/salt-vote-results-2026
8. builds.gg, "10K Challenge - Addressing the Drama", undated; an image timestamp suggests about March 2019. https://builds.gg/news/10k-challenge-addressing-the-drama-13
9. r/EDH, "As a new player, I took on the 32 deck challenge…", 2026-07-09; score from the Arctic Shift archive. https://www.reddit.com/r/EDH/comments/1urgi9u/
10. r/EDH, "Deck of the Month Challenge made me happier with my decks", 2025-12-26; Arctic Shift. https://www.reddit.com/r/EDH/comments/1pw44ce/
11. r/EDH, "Drew Dimir in a $20 Deck Building Challenge", 2026-03-19; Arctic Shift. https://www.reddit.com/r/EDH/comments/1ryag1n/
12. r/EDH, "Me and my friends are trying a randomized themes deckbuilding challenge…", 2026-02-28; Arctic Shift. https://www.reddit.com/r/EDH/comments/1rhgok6/
13. r/EDH, "$50 deck challenge", 2026-01-31; Arctic Shift. https://www.reddit.com/r/EDH/comments/1qrmwj5/
14. Arctic Shift, the 100 most recent r/EDH posts with "challenge" in the title (2025-12-03 to 2026-10-31), titles counted by the research. https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=challenge&after=2025-01-01&limit=100
15. Wizards of the Coast, Fan Content Policy, last updated 2017-11-15. https://company.wizards.com/en/legal/fancontentpolicy
16. Squire Patton Boggs, "Notion de loterie : nouvelle définition introduite par la loi Hamon", La Revue, 2014-04-14. Article numbers as of 2014; check the current text. https://larevue.squirepattonboggs.com/notion-de-loterie-nouvelle-definition-introduite-par-la-loi-hamon_a2309.html
17. Olshan Frome Wolosky, "Are 'Popularity' Contests Where Consumers Vote for Winners Skill Contests?", undated (© 2026). https://www.olshanlaw.com/newsroom/publications/Popularity-Contests-Consumer-Vote
