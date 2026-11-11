# I-48: Official Changes Reach Every Saved Deck

> **Initiative:** I-48, proposed for the [roadmap](../roadmap.md) · **Status:** proposed · **Priority:** Next for slices 1 to 8, with slices 1 to 6 before the Commander announcement Wizards expects by the end of 2026; Later for slices 9 to 11; slice 12 waits for I-30 · **Impact / effort:** High / medium · **Written** 2026-11-10
> **Research:** one dated note, not committed. Every external fact below links its own source in [Sources](#sources). Points on e-mail consent are research, not legal advice.
> **Owns:** the Commander rules as dated versions (the open item in [I-03](i03-trustworthy-deck-feedback.md)), the announcement record, the assessment of a deck against a rules version, the owner's dated impact report, deterministic replacement candidates for violations a rules change causes, the public "what changed" pages, and the notice and opt-in e-mail for a rules change. **Does not own:** bracket names, descriptions and the guide ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); variant lists, server legality per load and the drift check ([I-42](i42-commander-variants-duel-cedh-pauper.md)); the general notification centre ([I-08](i08-share-compare-and-learn.md)); new-card suggestions ([I-18](i18-per-deck-radar-of-new-cards.md)); the report framework and the index policy ([I-34](i34-commander-data-reports.md)); the e-mail sender ([I-38](i38-trust-safety-and-user-rights.md)); the paid tier ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

Wizards of the Coast now runs the Commander format. It changes three lists without a fixed schedule: the banned list, the Game Changers list and the bracket definitions. Each change can move a saved deck's legality or its bracket. Today this product does not notice. A deck keeps the Game Changer and banned flags it had on the day each card was added, so its bracket estimate and its warnings drift from the official rules.

This initiative turns each announcement into a dated rules version. When a version is published, the product compares every saved Commander deck under the old version and the new one. The owner sees a dated report: which cards are now banned or Game Changers, how the bracket estimate moved and why, and replacement candidates chosen by a visible rule, never by a model. Anyone, without an account, can read what each announcement changed and check a list against it.

On WeeklyMTG, as reported on 2026-10-13, Wizards said a Commander announcement is "likely" before the end of 2026 [10]. Slices 1 to 6 should ship before it.

## What the market does

**What Wizards changed, and when.** Read on 2026-11-10 from the official articles.

| Date       | Banned list                                                                                                                     | Game Changers                                     | Bracket definitions                                                                                        | Source |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| 2024-09-30 | Wizards takes over from the Rules Committee and reviews the list; "We will not ban additional cards as part of this evaluation" | —                                                 | —                                                                                                          | [1]    |
| 2025-02-11 | —                                                                                                                               | First list: 40 cards                              | Five brackets; brackets 1–2 allow no Game Changers, bracket 3 up to three                                  | [2]    |
| 2025-04-22 | Five cards unbanned, each moved to the Game Changers                                                                            | +18, −2, +5 unbanned: 61                          | Unchanged                                                                                                  | [3]    |
| 2025-10-21 | No change; no bans or unbans for the rest of 2025                                                                               | −10: 51                                           | Tutor restriction removed; turn expectations added; bracket 2 no longer tied to precons; no effective date | [4]    |
| 2026-02-09 | Biorhythm unbanned; Lutri unbanned but "banned as a companion", a new category; effective that day                              | Farewell and Biorhythm added: 53; Lutri not added | Unchanged; "cool it on bracket-level changes"                                                              | [5][6] |

- **The timing is not predictable.** The February 2026 update expected the next one "likely in May or June" [5][6]. On 2026-08-13 Popverse reported a video in which Gavin Verhey said the whole panel would come to Wizards the next month, and that he was "not expecting any changes" until after that meeting [9]. On 2026-10-13 MTG Rocks reported WeeklyMTG's account: the panel had met at Wizards' Renton office, was not ready for the 12 October date, and an announcement was "likely" before the end of the calendar year [10]. A third-party tracker dated 2026-10-18 records no change since 2026-02-09 [11]. Wizards also says Commander "gets to operate on its own schedule" and is not limited to one window a year [6]. A product cannot poll a calendar. It must react on the day.
- **The official pages carry no date.** The Commander format page still says "Commander Brackets are currently in beta" and shows no update date [7]. The Banned and Restricted page lists 42 named Commander cards, marks Lutri "only banned as a companion", and shows no effective date either [8]. In October 2025 Wizards warned that its pages "may not reflect the latest changes" yet [4]. The dated record is the announcement article.
- **The channel is one article per change,** written by Gavin Verhey for the Commander Format Panel on magic.wizards.com, with feedback on the official Magic Discord [3][4][5][6]. Previews come on WeeklyMTG and in videos [9][10].
- **Unbans become Game Changers by stated policy, with exceptions.** Wizards calls it "what we do when a card comes off the banned list", and Lutri is the named exception [5][6]. The rule is a default, so each version must list its cards explicitly.
- **Scryfall holds the current state only.** On 2026-11-10 `is:gamechanger` returned 53 cards and `banned:commander` 83, category bans included [13]. A card object has a `game_changer` flag and `legalities`, but no date of change. Lutri shows `commander: legal`, so "banned as a companion" is not in Scryfall's data [14].

**What the deck sites do after a change.**

| Product                                        | After an announcement                                                                                                                                                 | Source |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| EDHREC                                         | Published an explainer the next day (2025-10-22). It says nothing about updating its own bracket data or telling users which decks the change touched.                | [12]   |
| Moxfield                                       | Not verified: its brackets page answered 403 on 2026-11-10.                                                                                                           | [16]   |
| Archidekt                                      | Not verified: the first page of its news lists updates on the playtester, deck help, mobile UI and card view. Its brackets post is not on that page and was not read. | [17]   |
| Commander Spellbook, MTGGoldfish and DeckCheck | Not verified: no page found, or the page answered 403.                                                                                                                | —      |

No page read shows a deckbuilder telling an owner that a saved deck changed status, or dating the list its verdict uses. I-42 likewise found no competitor page that dates the variant list its legality check applies. That absence is a claim about the pages read on 2026-11-10, not proof. Revalidate it before it justifies marketing copy. _Corrected 2026-11-11:_ this holds for the Magic pages read, not for deckbuilders in general. NetrunnerDB's decklist page lists every ban-list version, marks the active one and says "This decklist is not legal for tournament play currently, due to Card Errata, Rotation or Legality" [18], and arkham.build pins a taboo version per deck, with "Latest" as a default [19]. Marketing copy built on this initiative should say "among Magic deckbuilders".

**The opening.** The verdict itself is common: any site that reads Scryfall shows today's status. What nobody was found doing is the dated difference: "on 2026-02-09 Farewell became a Game Changer; your deck now sits above the bracket you declared; here are cards that fill the same role". The same difference, published per announcement and readable without an account, gives the "what changed" page original content to rank on.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **The lists are live reads with no date.** `src/hooks/useGameChangers.ts` fetches `is:gamechanger` from Scryfall in the browser, and `src/hooks/useBanlist.ts` fetches `banned:<key>`, each cached for 24 hours. No copy is stored, so the product has no history and no effective date. `/rules/game-changers` renders both lists client-side through `src/components/rules/GameChangersPageClient.tsx`, with no date.
- **The flags are frozen when a card is added.** `src/lib/deck/store.ts` sets `isGameChanger` and `isBanned` from those name sets when a card is added, a commander is set or a bulk edit applies. `POST /api/decks/[id]/cards` stores the client's values. `computeDeckStats` in `src/lib/deck/stats.ts` counts the stored flags, and `scoreBracket` in `src/lib/deck/bracket.ts` raises the floor from that count. Nothing recomputes them later. A deck saved before 2026-02-09 with Farewell therefore counts no Game Changer today, and a deck that took Food Chain between 2025-04-22 and 2025-10-21 still counts one. `useGameChangers` combines stored flags with live names, but the bracket score does not use it.
- **Stale flags spread.** Fork (`src/lib/deck/fork.ts`), duplicate, snapshot restore (`src/lib/deck/snapshot-restore.ts`) and the public and share views (`PUBLIC_DECK_SELECT`, `SHARED_DECK_SELECT`, `ShareDeckView.tsx`, `PublicDeckCards.tsx`) copy or show the stored flags. I-42 records the same defect for `isBanned`.
- **The bracket rules are code.** `BRACKET_DEFINITIONS` in `src/lib/constants/brackets.ts` stops at bracket 4, and I-28 records its wrong labels. `bracket.ts` hard-codes the floors: more than three Game Changers gives 4, one to three gives 3, and a two-card infinite combo gives 4 "(RC rule)". The estimate carries no method version, so a change in our estimator and a change by Wizards look the same to a player.
- **Lutri is code.** `src/lib/deck/companion.ts` hard-codes "Lutri is banned as a companion in Commander".
- **One reference doc is wrong.** `docs/references/game-changers.md`, corrected on 2026-11-08, matches the announcements [2]–[6]. `docs/references/banlists.md` lists Sway of the Stars as banned, although it was unbanned on 2025-04-22 [3]. It omits Channel, Erayo, Fastbond and Recurring Nightmare, which the official list names [8], and it dates the Gifts Ungiven and Panoptic Mirror unbans to February 2026.
- **Preferences exist; notices do not.** `NotificationPreference` holds `replies`, `mentions`, `follows` and `watchedDecks`, all defaulting to true, with an API since 2026-11-02 (`acc66d01`) and a settings page since 2026-11-03 (`13f8a35f`). No notification table, delivery code or e-mail SDK exists, and `package.json` has no mail dependency.
- **No scheduled jobs.** The repository has no cron configuration. `src/lib/meta/snapshots.ts` records the house pattern: history "accrues from ordinary traffic", with "no cron job".
- **What can be reused:** `compareDeckAnalysis` (`src/lib/deck/analysis-change-diff.ts`) for before and after, `categorizeCard` (`src/lib/deck/categories.ts`) for a card's role, the reviewed package diff from I-08, `CollectionCard` for owned copies, and `User.isModerator` to gate publishing.

## Functional requirements

### 1. The rules as dated versions

1.1 A `CommanderRulesVersion` holds, explicitly: its effective date, the announcement date, the source URLs, the banned cards by Oracle ID and name, the cards banned as a companion, the category bans by reference, the Game Changers by Oracle ID and name, and each bracket's structured rules: Game Changer limit, mass land denial, extra turns, two-card combos and turn expectation.
1.2 The history is seeded from the announcements: the banned list before 2025-02-11, then 2025-02-11, 2025-04-22, 2025-10-21 and 2026-02-09. The four dated versions hold 40, 61, 51 and 53 Game Changers.
1.3 One function returns the version in force on a date. The builder, the stats, the bracket score, the companion check and the public pages read it. No other module holds a list or a limit.
1.4 A version is published only from a reviewed draft by a moderator. Publishing records who published it and when.
1.5 A draft is compared with Scryfall's `is:gamechanger` and `banned:commander` before it is published. A difference is shown to the publisher and is not resolved silently. Categories Scryfall does not encode, such as banned as a companion, are listed as expected differences. _Re-pointed 2026-11-10:_ the comparison reads [I-67](i67-one-card-data-pipeline.md)'s `legality.changed` and `gameChanger.changed` events (its slice 4), and the "under review" state its count check (its slice 11), instead of live searches.
1.6 When Scryfall's lists drift from the published version, through I-42's check, the product marks the rules "under review" on every surface that shows a verdict, until a moderator publishes or dismisses.
1.7 Every verdict, notice and page names the version it used and its effective date.

### 2. Assessing a deck against a version

2.1 `assessDeck(deck, version)` is a pure function. It returns the banned cards, a companion banned as a companion, the Game Changers, the floor each official rule sets, the heuristic score, the estimate and a reason for each floor. _Added 2026-11-11:_ the floors, terms and reasons are [I-77](i77-a-bracket-estimate-players-can-audit.md)'s `explainBracket` output, and the assessment adds the rules version.
2.2 Stored `isGameChanger` and `isBanned` are no longer trusted by any reader. Status is derived from the version. `isGameChanger` follows the path I-42 sets for `isBanned`: the column stays until every reader uses derived status.
2.3 Fork, duplicate, snapshot restore, public pages and the share view show derived status.
2.4 `compareAssessments(before, after)` lists each change with its cause: card banned, card unbanned, card banned as a companion, Game Changer added or removed, or a bracket limit changed. Order is by cause, then card name, then Oracle ID, whatever the deck order.
2.5 The bracket estimate carries a method version, which is I-77's `BRACKET_METHOD_VERSION` (added 2026-11-11). A report never attributes a movement caused by our estimator to Wizards, and the reverse.
2.6 The comparison covers floors that depend on the lists and the bracket definitions. The two-card combo floor needs Commander Spellbook and is re-checked only when the deck is opened; the report says so.

### 3. The owner's impact report

3.1 When a version newer than the one a deck was last assessed under exists, the product computes that deck's impact on the owner's next deck-list load or deck open. No scheduled job is needed.
3.2 The first run after slice 2 ships compares each deck's stored flags with the current version. Each difference is reported with the announcement that explains it, for example "Farewell has been a Game Changer since 2026-02-09; this deck's estimate did not count it until today."
3.3 The deck list shows a dated notice on each affected deck. The editor shows the same notice above the warnings. The owner can dismiss it per announcement; a hard legality error stays in the warnings until it is fixed.
3.4 The report shows, per deck: the announcement date and link, each changed card and its cause, the estimate before and after with the floor that moved, and the declared bracket (`targetBracket` or `manualBracket`) against the new estimate.
3.5 A deck the rules change does not touch gets no notice.
3.6 Guest decks are assessed in the browser on load and show the same notice. Nothing is stored server-side.
3.7 Only Commander decks, cEDH included, are assessed. Variant lists use the same notice through I-42's slice 11.

### 4. Replacement candidates

4.1 Candidates are offered for each card that is newly banned, or a new Game Changer that puts the deck above its declared bracket's limit. A companion that becomes banned as a companion gets no candidates; the report says it may stay in the deck but not in the companion slot.
4.2 Candidates come from a Scryfall query the player can read: the replaced card's role, the deck's colour identity, `legal:commander`, `-is:gamechanger` where the limit requires it, and mana value within one of the replaced card. For Farewell in a mono-white deck, `otag:board-wipe id<=w legal:commander -is:gamechanger mv>=5 mv<=7` returned 90 cards on 2026-11-10 [15].
4.3 A tested table maps each `categorizeCard` role to its Scryfall tag. Tags are Scryfall's community data and are labelled as such.
4.4 The order is fixed: closest mana value, then copies the player owns, then lower price, shown with its date, then name. A rerun on the same card data returns the same list. The player may re-sort; popularity is offered only as a labelled sort, never as the default.
4.5 Each candidate is re-checked with `assessDeck`. A candidate that would create a new violation is dropped.
4.6 Nothing changes the deck automatically. "Replace" opens the reviewed diff and the before and after analysis from `compareDeckAnalysis`.
4.7 No AI client is imported by the assessment, the report or the candidate code. A test enforces it.

### 5. Public "what changed" pages

5.1 `/rules/changes` lists every announcement, newest first. `/rules/changes/[date]` shows one: the date, the official links, a table of card changes built from the version difference, and bracket rule changes as before and after.
5.2 Sentences come from reviewed templates. Wizards' text is linked and quoted only briefly.
5.3 The pages need no account, no e-mail and no payment, as I-34 requires for its pages.
5.4 "Is my deck affected?" accepts a pasted list or a saved deck and shows the assessment under the version before and after, without an account.
5.5 `/rules/game-changers` shows the version in force and its effective date, and links to the history.
5.6 English ships first. A French page stays `noindex` until a reviewer approves it, as in I-34.
5.7 The pages for the four past announcements ship with slice 3, so the pipeline is proven before the next one.

### 6. Impact counts per commander

6.1 An announcement page may show, per commander, how many public MagicAIBuilder decks contain a card the announcement changed, with the deck count, the date and a methods anchor.
6.2 Private decks are never counted. Counts below the I-34 threshold read "not enough decks". Until I-34 decides, 20 public decks is the starting value, a placeholder rather than a researched figure.
6.3 Counts from the I-29 index replace site-only counts only after I-29 slices 8 and 11.

### 7. Notices and e-mail

7.1 The in-app notice in 3.3 is free and on for everyone. If I-08 ships a notification centre, the rules notice becomes one of its event types.
7.2 E-mail is opt-in, off by default, and stored as a new preference `rulesChangesEmail`. This follows the safe defaults of I-38 9.1, which keep engagement notifications off unless the player turns them on.
7.3 One e-mail per announcement per account, sent only if a deck changed. It lists the affected decks and links to each report and to the public page. It carries an unsubscribe link and no tracking pixel.
7.4 E-mail waits for [I-63](i63-one-notification-system.md) slice 9, which sends through the transactional sender that was I-38 slice 13.
7.5 Whether this e-mail is a service message or needs consent under French law is a lawyer question (research, not legal advice). Opt-in is the default either way.

### 8. What is free and what could be paid

8.1 Free, per I-30 1.1: every verdict and its version date, the impact report, replacement candidates, the in-app notice, the e-mail, the public pages and the per-commander counts. A legality change on the player's own deck is evidence the product shows, so it cannot sit behind a paywall ([strategic boundaries](../roadmap.md#strategic-boundaries)).
8.2 Paid candidate, medium: a planner that fixes all affected decks at once against the player's collection, and sends the missing cards to I-06's acquisition plan and I-32's cart. It is a personal tool that computes over the player's own data, which I-30 1.3 allows. No competitor read offers even the single-deck notice.
8.3 Paid candidate, weak: rules notices for decks the player saved but does not own (I-08's watched decks) and for a pod's decks (I-23). It joins I-18's "watching one's decks" row in I-30.

## Data model / API

```text
CommanderRulesVersion  id, effectiveOn, announcedOn, sourceUrls[], status (draft|published|underReview),
                       banned[] {oracleId, name}, bannedAsCompanion[] {oracleId, name}, categoryBans[],
                       gameChangers[] {oracleId, name}, brackets[] {level 1..5, maxGameChangers,
                       massLandDenial, extraTurns, twoCardCombos, turnExpectation}, publishedById, publishedAt
RulesAnnouncement      id, versionId (unique), slug (YYYY-MM-DD), title, url, publishedAt
RuleChange             derived from two versions, not stored: kind (banned|unbanned|bannedAsCompanion|
                       gameChangerAdded|gameChangerRemoved|bracketRuleChanged), card or {level, field, before, after}
DeckRulesImpact        id, deckId, fromVersionId, toVersionId, changes Json, estimateBefore, estimateAfter,
                       declaredBracket, exceedsDeclared, methodVersion, computedAt, dismissedAt?
                       @@unique([deckId, toVersionId])
Deck                   + assessedVersionId?
NotificationPreference + rulesChangesEmail Boolean @default(false)
```

- `GET /api/rules/commander/versions` and `GET /api/rules/commander/versions/[id]`: public, cacheable.
- `POST /api/rules/commander/versions` (draft) and `POST /api/rules/commander/versions/[id]/publish`: moderators only; publishing returns the Scryfall comparison.
- `GET /api/decks/[id]/rules-impact`: owner only; computes missing impacts, then returns them.
- `POST /api/rules/check`: public, rate-limited; takes a list, returns the assessment under two versions.

## Non-goals

- An LLM in the assessment, the reasons or the candidates ([strategic boundaries](../roadmap.md#strategic-boundaries)).
- Changing a deck automatically, even to remove a banned card.
- Predicting bans, or a "watchlist" of cards Wizards has not named.
- Scraping magic.wizards.com. A moderator enters each version from the article.
- A notification centre, push notifications or a re-engagement e-mail. I-08 owns notifications, and I-39 rules out re-engagement mail.
- Suggesting newly unbanned cards to add. That is a new-card question for I-18.
- Variant lists. I-42 owns them and reuses the notice.

## Testing strategy

- **Golden versions (solitary).** Each seeded version has its count: 40, 61, 51, 53. Food Chain is a Game Changer from 2025-04-22 to 2025-10-21 only. Farewell is one from 2026-02-09. Biorhythm is banned before 2026-02-09 and a Game Changer after. Sway of the Stars is banned, then a Game Changer from 2025-04-22, then neither from 2025-10-21. Lutri is banned before 2026-02-09 and banned as a companion after.
- **Assessment (solitary).** The same deck in any card order gives the same result and reasons. A bracket 2 deck with Farewell exceeds its declared bracket under 2026-02-09 and not under 2025-10-21.
- **Derived flags (sociable).** A deck saved with a stale `isGameChanger` shows the current status in the editor, the share view, a fork and a restored snapshot.
- **Impact (sociable).** A deck-list load computes each missing impact once; a second load writes nothing; an untouched deck gets no row; another user's deck is never read.
- **Drift.** A recorded Scryfall fixture with 53 Game Changers matches the 2026-02-09 version; a fixture with a 54th card marks the rules "under review". The network never runs in CI.
- **Candidates.** Same card data, same list. No candidate is banned, a Game Changer above the limit, outside the identity or already in the deck. An import test fails if an AI client is reachable from these modules.
- **Public pages.** Signed out, each past announcement page answers 200 with its table. An unreviewed French page is `noindex`. Counts below the threshold render as "not enough decks".
- **E-mail.** Nothing is sent without opt-in; one mail per announcement per account; unsubscribe turns the preference off.

## Delivery slices

| #   | Slice                                                                                                                                                                       | Depends on                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `CommanderRulesVersion` seeded with the history; one "version in force" reader for brackets, stats, the companion check and `/rules/game-changers`. Closes I-03's open item | I-28 slice 2                                   |
| 2   | `assessDeck` and `compareAssessments`; derived Game Changer and banned status for every reader; method version on the estimate                                              | 1; I-42 slice 2; I-77 slice 1                  |
| 3   | Announcement records and the public `/rules/changes` pages in English, backfilled for the four past announcements                                                           | 1                                              |
| 4   | "Is my deck affected?" on the public page, without an account                                                                                                               | 2, 3                                           |
| 5   | Owner impact: lazy computation, the first catch-up run, the notice on the deck list and in the editor, and the dated report                                                 | 2, 3                                           |
| 6   | Publishing workflow: moderator draft, comparison with I-67's change events, publish _(re-pointed 2026-11-10 to I-67 slice 4)_                                               | 1; I-67 slice 4                                |
| 7   | Replacement candidates with the visible query, fixed order and reviewed diff                                                                                                | 5                                              |
| 8   | French catalogues and review of the public pages, with locale gating                                                                                                        | 3                                              |
| 9   | "Under review" state from I-42's drift check and I-67's count check, extended to Commander _(re-pointed 2026-11-10 to I-67 slice 11)_                                       | 6; I-42 slice 6; I-67 slice 11                 |
| 10  | Impact counts per commander on announcement pages, public decks only                                                                                                        | 2, 3; I-34 slices 1 and 3                      |
| 11  | Opt-in e-mail per announcement                                                                                                                                              | 5; I-63 slice 9                                |
| 12  | Paid candidate: the cross-deck fix planner                                                                                                                                  | **Blocked** on the I-30 decision; 7; I-06 plan |

Slices 1, 3 and 6 make the next announcement a data change rather than a release. Slices 2 and 5 are what an owner sees, and slice 4 is what a visitor sees. Slice 1 waits for I-28 slice 2, which corrects `BRACKET_DEFINITIONS` and adds bracket 5, so the seeded data starts from correct rules. Slice 2 waits for I-42 slice 2 because both change who reads `isBanned`; landing them in order avoids two agents editing the same readers. I-28 slice 8, its guide's freshness banner, can read `RulesAnnouncement` once slice 3 exists. I-42 slice 11 should reuse slice 5's notice rather than build its own.

## Open questions

1. **Where does a version live, and how fast must it reach players?** This spec stores versions in the database and publishes them through a moderator action, because a code change takes a full `dev` → `staging` → `main` promotion to reach players. A reviewed JSON file in the repository gives a better audit trail but a slower release. The owner chooses.
2. **Which source is canonical for Commander?** This spec makes the published version the source and Scryfall the check. I-42 2.1 computes legality from Scryfall. The two meet in slice 2; both specs should say the Commander branch reads the version.
3. **Is the e-mail free?** This spec keeps it free, because a legality change is evidence and announcements are rare: four changes in the 21 months since 2025-02-11. A digest was earlier rated a possible paid feature. The owner decides in I-30.
4. **Is a rules-change e-mail a service message?** Add to the lawyer questions in [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) and I-38 (research, not legal advice).
5. **Who enters a version on the day?** The spec assumes one moderator does. If that person is unavailable, Scryfall's drift is the only signal. Is a second publisher needed?
6. **What threshold applies to per-commander counts?** 20 public decks is a starting value until I-34 decides.
7. **Does the beta label matter?** Wizards may "drop the beta tag" [5]. Should the product show "beta" beside every bracket verdict until it does?

## Sources

1. Wizards of the Coast, "On the Future of Commander", 2024-09-30. https://magic.wizards.com/en/news/announcements/on-the-future-of-commander (read 2026-11-10)
2. Wizards of the Coast, "Introducing Commander Brackets Beta", 2025-02-11. https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta (read 2026-11-10)
3. Gavin Verhey for the Commander Format Panel, "Commander Brackets Beta Update", 2025-04-22. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-april-22-2025 (read 2026-11-10)
4. Gavin Verhey for the Commander Format Panel, "Commander Brackets Beta Update", 2025-10-21. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025 (read 2026-11-10)
5. Commander Format Panel, "Commander Brackets Beta Update", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-february-9-2026 (read 2026-11-10)
6. Gavin Verhey for the Commander Format Panel, "Commander Banned and Restricted Announcement", 2026-02-09. https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026 (read 2026-11-10)
7. Wizards of the Coast, Commander format page, undated. https://magic.wizards.com/en/formats/commander (read 2026-11-10)
8. Wizards of the Coast, Banned and Restricted List, Commander section, undated. https://magic.wizards.com/en/banned-restricted-list (read 2026-11-10)
9. Popverse, report on Gavin Verhey's video before the 2026-08-10 announcement, 2026-08-13. https://www.thepopverse.com/gaming-magic-the-gathering-commander-format-changes-banned-restricted (read 2026-11-10)
10. MTG Rocks, report on WeeklyMTG's Commander comments, 2026-10-13. https://mtgrocks.com/mtg-commander-announcement-2026-tease/ (read 2026-11-10)
11. Tabletop Meta, "MTG Game Changers List and Commander Brackets", byline 2026-10-18; secondary. https://www.tabletopmeta.com/blog/mtg-game-changers-list-commander-brackets (read 2026-11-10)
12. EDHREC, Matt Morgan, "Wizards of the Coast Commander Brackets Update for October 2025", 2025-10-22. https://edhrec.com/articles/wizards-of-the-coast-commander-brackets-update-for-october-2025 (read 2026-11-10)
13. Scryfall API, searches `is:gamechanger` (53 cards) and `banned:commander` (83 cards). https://api.scryfall.com/cards/search?q=is%3Agamechanger and https://api.scryfall.com/cards/search?q=banned%3Acommander (read 2026-11-10)
14. Scryfall API, card objects for Biorhythm (`game_changer: true`, Commander legal) and Lutri, the Spellchaser (Commander legal). https://api.scryfall.com/cards/named?exact=Biorhythm and https://api.scryfall.com/cards/named?exact=Lutri,%20the%20Spellchaser (read 2026-11-10)
15. Scryfall API, search `otag:board-wipe id<=w legal:commander -is:gamechanger mv>=5 mv<=7` (90 cards). https://api.scryfall.com/cards/search?q=otag%3Aboard-wipe+id%3C%3Dw+legal%3Acommander+-is%3Agamechanger+mv%3E%3D5+mv%3C%3D7 (read 2026-11-10)
16. Moxfield, Commander brackets page; answered HTTP 403. https://moxfield.com/commanderbrackets (tried 2026-11-10)
17. Archidekt, news, first page. https://archidekt.com/news (read 2026-11-10)
18. NetrunnerDB, a decklist page, published 2018-07-05, seen 2026-11-10; added 2026-11-11. https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657
19. arkham.build, release v2.20.0, 2025-04-22; added 2026-11-11. https://github.com/arkham-build/arkham.build/releases/tag/v2.20.0

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

### Goals

- When a moderator publishes the next announcement, every saved Commander deck it touches shows a dated notice that names each changed card and its cause, the estimate before and after and the declared bracket, with candidates from a visible query; a visitor checks a pasted list against the announcement's page without an account; and no reader trusts a stored flag.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-48-01

As a player with saved decks, I want to know which of them a Commander announcement changed, so that a stored flag from last year is not the ban list.

#### US-48-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-48-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-48-01 Happy path

Given a signed-in player and the English locale
When an announcement is a dated rules version.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-48-02 Happy path

Given a signed-in player and the English locale
When each affected deck lists the cards and the cause.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-48-03 Happy path

Given a signed-in player and the English locale
When a visitor can check a pasted list against that page without an account.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-48-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-48-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-48-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: The public page is signed-out. The owner's impact list is signed-in. Email, if any, waits on I-63 and on the lawyer's answer about consent.

#### AC-48-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-48-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-48-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The notice is on the deck and on a public page for the announcement. The estimate before and after is I-77's when that exists.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Rules versions are records. Assessment reads current card data, not the flag copied onto the deck card at add time.

### Analytics and telemetry

`rules_change_seen {decks_affected: zero or some}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

The public page is signed-out. The owner's impact list is signed-in. Email, if any, waits on I-63 and on the lawyer's answer about consent.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Where the version is published from, the database or a reviewed file, is an owner question.

### Sources

- https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026
- https://mtgrocks.com/mtg-commander-announcement-2026-tease/
- https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657
- https://github.com/arkham-build/arkham.build/releases/tag/v2.20.0

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-48-101

As a player, I want the product to commanderRulesVersion, seeded with the history from the list before 2025-02-11 to 2026-02-09 (40, 61, 51 and 53 Game Changers in the four dated versions), and one "version in force" reader for the bracket score, the stats, the companion check and /rules/game-changers (slice 1)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: CommanderRulesVersion, seeded with the history from the list before 2025-02-11 to 2026-02-09 (40, 61, 51 and 53 Game Changers in the four dated versions), and one "version in force" reader for the bracket score, the stats, the companion check and /rules/game-changers (slice 1). This closes I-03's open item. Today src/hooks/useGameChangers.ts and src/hooks/useBanlist.ts read Scryfall live in the browser, with no date; BRACKET_DEFINITIONS (src/lib/constants/brackets.ts) and the floors in src/lib/deck/bracket.ts are code; and Lutri's companion ban is hard-coded in src/lib/deck/companion.ts.

#### AC-48-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-102 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-48-102

As a player, I want the product to assessDeck and compareAssessments, Game Changer and banned status derived for every reader, and a method version on the bracket estimate (slice 2)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then assessDeck and compareAssessments, Game Changer and banned status derived for every reader, and a method version on the bracket estimate (slice 2). Today src/lib/deck/store.ts sets isGameChanger and isBanned when a card is added, POST /api/decks/[id]/cards stores the client's values, and computeDeckStats (src/lib/deck/stats.ts) and scoreBracket count the stored flags. Nothing recomputes them, so a deck saved before 2026-02-09 with Farewell counts no Game Changer today. Fork (src/lib/deck/fork.ts), duplicate, snapshot restore (src/lib/deck/snapshot-restore.ts) and the public and share views copy or show the stale flags; I-42 records the same defect for isBanned.

#### AC-48-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-48-103

As a player, I want the product to announcement records and public /rules/changes pages in English, backfilled for the four past announcements, then "Is my deck affected?" without an account (slices 3–4)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Announcement records and public /rules/changes pages in English, backfilled for the four past announcements, then "Is my deck affected?" without an account (slices 3–4).

#### AC-48-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-108 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-48-104

As a player, I want the product to the owner's impact, computed on the next deck-list load or deck open with no scheduled job: a first catch-up run, a dated notice on the deck list and in the editor, and a report that sets the declared bracket against the new estimate (slice 5)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The owner's impact, computed on the next deck-list load or deck open with no scheduled job: a first catch-up run, a dated notice on the deck list and in the editor, and a report that sets the declared bracket against the new estimate (slice 5).

#### AC-48-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-111 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-48-105

As a player, I want the product to a publishing workflow: a moderator's draft, a comparison with Scryfall's lists, then publication (slice 6)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-112 Happy path

Given a signed-in operator
When the player uses this behaviour
Then the behaviour holds: A publishing workflow: a moderator's draft, a comparison with Scryfall's lists, then publication (slice 6).

#### AC-48-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-48-106

As a player, I want the product to replacement candidates from a Scryfall query the player can read, in a fixed order, through the reviewed diff and never applied automatically (slice 7); the French pages, noindex until reviewed (slice 8)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Replacement candidates from a Scryfall query the player can read, in a fixed order, through the reviewed diff and never applied automatically (slice 7); the French pages, noindex until reviewed (slice 8).

#### AC-48-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-117 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-48-107

As a player, I want the product to later: an "under review" state from I-42's drift check, counts per commander from public decks only, and an opt-in e-mail per announcement (slices 9–11); the cross-deck fix planner after I-30's decision (slice 12)., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-118 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later: an "under review" state from I-42's drift check, counts per commander from public decks only, and an opt-in e-mail per announcement (slices 9–11); the cross-deck fix planner after I-30's decision (slice 12).

#### AC-48-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-48-108

As a player, I want the product to neighbour change from I-77, 2026-11-11: assessDeck (2.1) returns I-77's explainBracket output for floors, terms and reasons, and 2.5's method version is I-77's BRACKET_METHOD_VERSION, so slice 2 also waits for I-77 slice 1., so that when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

#### AC-48-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Neighbour change from I-77, 2026-11-11: assessDeck (2.1) returns I-77's explainBracket output for floors, terms and reasons, and 2.5's method version is I-77's BRACKET_METHOD_VERSION, so slice 2 also waits for I-77 slice 1. **Corrected 2026-11-11:** the claim that no deckbuilder tells an owner a saved deck changed status holds among Magic deckbuilders only; NetrunnerDB's decklist pages say a list "is not legal for tournament play currently" (decklist, 2018-07-05), and arkham.build pins a taboo version per deck (v2.20.0, 2025-04-22).

#### AC-48-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-48-123 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

### UX states for this feature

The player-visible outcome is: when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

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

## I-48: Official Changes Reach Every Saved Deck

**Spec:** [`specs/i48-official-changes-reach-every-deck.md`](i48-official-changes-reach-every-deck.md)

**Outcome:** when Wizards changes the Commander banned list, the Game Changers or the brackets, every saved deck is assessed against the dated version in force. The owner sees which decks changed, why, and replacement candidates chosen by a visible rule; anyone, without an account, can read what each announcement changed and check a list against it.

**Status:** Next
**Priority:** Next for slices 1 to 8, with slices 1 to 6 before the Commander announcement Wizards expects by the end of 2026; Later for slices 9 to 11; slice 12 waits for I-30
**Impact / effort:** High / medium
**Depends on:** I-28 slice 2 before slice 1; I-42 slice 2 and I-77 slice 1 before slice 2 (I-77 added 2026-11-11); I-42 slice 6 for the drift check; I-67 slice 4 for the draft comparison (slice 6) and I-67 slice 11 for the "under review" state (slice 9), both re-pointed 2026-11-10 from live searches; I-34 slices 1 and 3 for counts per commander; I-63 slice 9 for the e-mail (the sender was I-38 slice 13); I-30's decision and I-06's plan for the cross-deck fix planner.

Wizards now runs the Commander format and changes three lists without a fixed schedule: the banned list, the Game Changers and the bracket definitions. Each change can move a saved deck's legality or bracket. Five cards were unbanned on 2025-04-22, ten Game Changers removed on 2025-10-21, and Biorhythm and Lutri unbanned on 2026-02-09, Lutri staying "banned as a companion" in a new category ([announcement](https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026)). The February update expected the next one "likely in May or June". None came, and on 2026-10-13 MTG Rocks reported WeeklyMTG's account that an announcement is "likely" before the end of the calendar year ([MTG Rocks](https://mtgrocks.com/mtg-commander-announcement-2026-tease/)). The official pages carry no date, and Scryfall holds only the current state, without Lutri's companion ban. No deckbuilder page read tells an owner that a saved deck changed status, or dates the list its verdict uses. The opening is the dated difference: "Farewell has been a Game Changer since 2026-02-09; your deck now sits above the bracket you declared; here are cards that fill the same role". The spec also found three errors in `docs/references/banlists.md`, corrected on 2026-11-10 (status note).

### Scope

- [ ] `CommanderRulesVersion`, seeded with the history from the list before 2025-02-11 to 2026-02-09 (40, 61, 51 and 53 Game Changers in the four dated versions), and one "version in force" reader for the bracket score, the stats, the companion check and `/rules/game-changers` (slice 1). This closes I-03's open item. Today `src/hooks/useGameChangers.ts` and `src/hooks/useBanlist.ts` read Scryfall live in the browser, with no date; `BRACKET_DEFINITIONS` (`src/lib/constants/brackets.ts`) and the floors in `src/lib/deck/bracket.ts` are code; and Lutri's companion ban is hard-coded in `src/lib/deck/companion.ts`.
- [ ] `assessDeck` and `compareAssessments`, Game Changer and banned status derived for every reader, and a method version on the bracket estimate (slice 2). Today `src/lib/deck/store.ts` sets `isGameChanger` and `isBanned` when a card is added, `POST /api/decks/[id]/cards` stores the client's values, and `computeDeckStats` (`src/lib/deck/stats.ts`) and `scoreBracket` count the stored flags. Nothing recomputes them, so a deck saved before 2026-02-09 with Farewell counts no Game Changer today. Fork (`src/lib/deck/fork.ts`), duplicate, snapshot restore (`src/lib/deck/snapshot-restore.ts`) and the public and share views copy or show the stale flags; I-42 records the same defect for `isBanned`.
- [ ] Announcement records and public `/rules/changes` pages in English, backfilled for the four past announcements, then "Is my deck affected?" without an account (slices 3–4).
- [ ] The owner's impact, computed on the next deck-list load or deck open with no scheduled job: a first catch-up run, a dated notice on the deck list and in the editor, and a report that sets the declared bracket against the new estimate (slice 5).
- [ ] A publishing workflow: a moderator's draft, a comparison with Scryfall's lists, then publication (slice 6).
  - Re-pointed 2026-11-10 to [I-67](i67-one-card-data-pipeline.md): the comparison reads I-67's `legality.changed` and `gameChanger.changed` events (its slice 4) instead of live searches, and slice 9's "under review" state reads I-67's count check (its slice 11).
  - The moderator's publishing page uses [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s `requireOperator` once its slice 1 exists (2026-11-10).
- [ ] Replacement candidates from a Scryfall query the player can read, in a fixed order, through the reviewed diff and never applied automatically (slice 7); the French pages, `noindex` until reviewed (slice 8).
- [ ] Later: an "under review" state from I-42's drift check, counts per commander from public decks only, and an opt-in e-mail per announcement (slices 9–11); the cross-deck fix planner after I-30's decision (slice 12).
  - The in-app notice is an [I-63](i63-one-notification-system.md) inbox entry, and the e-mail opt-in is I-63's "Rules changes on my decks" category, not the spec's `rulesChangesEmail` column.
- [ ] Neighbour change from [I-77](i77-a-bracket-estimate-players-can-audit.md), 2026-11-11: `assessDeck` (2.1) returns I-77's `explainBracket` output for floors, terms and reasons, and 2.5's method version is I-77's `BRACKET_METHOD_VERSION`, so slice 2 also waits for I-77 slice 1. **Corrected 2026-11-11:** the claim that no deckbuilder tells an owner a saved deck changed status holds among Magic deckbuilders only; NetrunnerDB's decklist pages say a list "is not legal for tournament play currently" ([decklist](https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657), 2018-07-05), and arkham.build pins a taboo version per deck ([v2.20.0](https://github.com/arkham-build/arkham.build/releases/tag/v2.20.0), 2025-04-22).

### Engineering enablers

- Golden versions: Food Chain is a Game Changer only from 2025-04-22 to 2025-10-21, Farewell from 2026-02-09; Biorhythm is banned before 2026-02-09 and a Game Changer after; Lutri is banned before that date and banned as a companion after.
- The same deck in any card order gives the same assessment and the same reasons.
- A recorded Scryfall fixture with a 54th Game Changer marks the rules "under review", and the network never runs in CI.
- An import test fails if an AI client is reachable from the assessment, the report or the candidates.

**Paid-tier angle:** every verdict and its version date, the impact report, replacement candidates, the in-app notice, the e-mail, the public pages and the counts per commander stay free: a legality change on a player's own deck is evidence the product shows. The candidates are a planner that fixes every affected deck at once against the collection and hands the missing cards to I-06 and I-32 (medium), and notices for watched or pod decks, which join I-18's row in I-30 (weak).

### Enrichment (2026-11-11)

**User story.** As a player with saved decks, I want to know which of them a Commander announcement changed, so that a stored flag from last year is not the ban list.

**Acceptance.**
- An announcement is a dated rules version.
- Each affected deck lists the cards and the cause.
- A visitor can check a pasted list against that page without an account.

**UX.** The notice is on the deck and on a public page for the announcement. The estimate before and after is I-77's when that exists.

**Data and API.** Rules versions are records. Assessment reads current card data, not the flag copied onto the deck card at add time.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `rules_change_seen {decks_affected: zero or some}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** The public page is signed-out. The owner's impact list is signed-in. Email, if any, waits on I-63 and on the lawyer's answer about consent.

**Open questions.** Where the version is published from, the database or a reviewed file, is an owner question.

### Definition of done

When a moderator publishes the next announcement, every saved Commander deck it touches shows a dated notice that names each changed card and its cause, the estimate before and after and the declared bracket, with candidates from a visible query; a visitor checks a pasted list against the announcement's page without an account; and no reader trusts a stored flag.

---

