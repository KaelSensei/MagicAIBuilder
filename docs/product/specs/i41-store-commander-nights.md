# I-41: Store Commander Nights And Organiser Tools

> **Initiative:** I-41, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later, with a cheap early part: the pairing policy and an account-free pod planner (slices 1 and 2) need no schema and store no personal data · **Written 2026-11-09**
> **Research:** one dated note on store tools, Wizards Play Network (WPN) guidance, store pages and community threads. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** stores and their staff, store Commander nights and their house rules, check-in by QR code, guest entries, pod pairing by bracket at a night, the night and store pages, and the store-plan candidates. **Does not own:** Rule 0 sheets, pods between friends and consent ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); bracket scoring ([I-03](../roadmap.md#i-03-trustworthy-deck-feedback)); bracket names and rules ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); the game log ([I-35](i35-pod-game-log.md)); Discord ([I-23](i23-the-pods-own-surface.md)); the public projection of a deck ([I-36](i36-creator-and-embed-toolkit.md) slice 1); legal pages, the privacy policy and retention jobs ([I-38](i38-trust-safety-and-user-rights.md)); product events ([I-39](i39-first-run-activation-and-measurement.md)); plans, prices and billing ([I-30](i30-business-model-and-paid-tier.md)).
> **Touches three non-goals:** the roadmap excludes a tournament manager and a venue directory ([deliberate non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)), and I-15 excludes pairing players. This spec builds neither of the first two (requirement 1) and owns the store pairing that I-15 leaves out.

## Overview

Stores run weekly casual Commander nights. Wizards' own tool records who came and little else: for Commander, "no pairings or match results are required" [1], and Player List Only events "do not generate pairings" [2]. Forming pods of similar power is left to the store, which Wizards tells to "use the Commander Bracket system or your own methods" [1]. Stores do it by hand, in WhatsApp, with a browser extension or with a paid tool.

MagicAIBuilder already holds what pod forming needs: the deck, a deterministic bracket estimate from its list (I-03), and soon the player's declared intent (I-15) and a game log (I-35). This initiative lets an organiser open a night, print a QR code, check players in with or without an account, form pods of three to five by declared and estimated bracket, and show the night's pods on a page. A guest leaves a nickname that is deleted 24 hours after the night, the rule EventLink applies to its own guests [2].

Organisers may pay where players will not: TopDeck.gg sells Commander pods, check-in and a store page for $12 a month [6]. A store plan is therefore an I-30 candidate, limited to tools over the store's own nights. Players never pay to check in or to see their pod. The first two slices need no account and no schema, and they measure whether stores want this before anything else is built.

## What the market does

All rows were read on 2026-11-09. "Search summary" marks a page the research could not open.

| Tool                                           | What it does for a casual Commander night                                                                                                                                                               | Organiser price                                                                                                                                        | Limit                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wizards EventLink** and **Companion** [1][2] | "Casual, Player List Only" events; players register by QR code in Companion; staff can "Add Guest" by first and last name, which "will be deleted after 24 hours"; attendance counts toward WPN metrics | Not stated on the pages read                                                                                                                           | No pod pairing. Requested in 2021; Wizards answered that "each Commander community defines a 'Commander Event' differently, making pairing difficult" [3] |
| **Playerlist Podder** [14]                     | Chrome extension that builds Commander pods from the EventLink player list, pods of four first (search summary)                                                                                         | Not found                                                                                                                                              | Its existence shows that EventLink leaves pods to the store                                                                                               |
| **TopDeck.gg** [6]                             | "Swiss, top cut, Commander pods and leagues"; "Tournament registration, check-in and decklists"; "Your own page players can follow"; exports players to EventLink for sanctioned Magic                  | $12 a month or $120 a year, 14-day trial, players free. Events of a game whose publisher approved the store are free; the page does not name the games | The page does not say that pods use brackets                                                                                                              |
| **DeckCheck for stores** [7]                   | Gives each submitted list a bracket and "compares the live deck against the list that passed": Verified, Changed since check, Outside bracket. Printable QR code per event page                         | Store account "free to open"                                                                                                                           | No pod pairing or check-in described                                                                                                                      |
| **SpellRack** [8]                              | Pods, game log, Swiss hosting (4 tournaments a month free), unlimited events for a claimed store, bracket and power scoring                                                                             | No store plan. Its player Premium ($8.99 a month or $89 a year) lists a "Pod Power Rebalancer", not described                                          | Pairing by bracket is a player feature, not a store's                                                                                                     |
| **Spicerack** [9]                              | Platform for organisers and stores; imports events from EventLink, RK9 and CSV                                                                                                                          | Paid tiers (Starter to Enterprise), prices not on the page; 14-day trial                                                                               | Formats listed are Swiss, elimination and round robin; pods not mentioned                                                                                 |
| **Melee.gg** [11]                              | Tournament registration and pairings                                                                                                                                                                    | Free up to 128 players; 3.49% + 5% + $0.49 on each paid US entry under its 2023 policy (search summary)                                                | Built for tournaments                                                                                                                                     |
| **Playgroup Live** [10]                        | Online community pods of 2 to 6 with "Bracket and power level labels" in lobbies; one free league per group                                                                                             | More leagues need a subscription, price not shown                                                                                                      | Online play; no pairing by bracket described                                                                                                              |
| **Carde.io** [12], **Unity League** [13]       | Carde.io names UVS Games, Renegade and Sorcery as partners. Unity League ranks competitive events across Europe, where French stores list Duel Commander tournaments (search summary)                   | Unity League: free "Regular" events                                                                                                                    | Carde.io does not mention Magic; Unity League is competitive                                                                                              |
| **French venues without a tool** [17][18]      | La Bonne Excuse organises games "sur notre WhatsApp et Instagram"; Gaming & Caux staff help each player "trouver une table adaptée"                                                                     | —                                                                                                                                                      | Manual                                                                                                                                                    |

**How stores use brackets.** Wizards' store guide (2025-11-18) says "Players self-assess their deck's power level or use store guidance to categorize it", and promises "fewer disputes about deck strength" [1]. Some nights restrict brackets: La Bonne Excuse runs a weekly "Bracket 3" night, "Jusqu'à 3 Game Changers", no mass land destruction, 20 places [18]. Others make declaring optional: the Gaming & Caux club (2026-03-22) writes "Si vous ne connaissez pas le bracket de votre deck, ce n'est pas grave", plays mostly at brackets 2 and 3, and puts brackets 4 and 5 "plutôt sur des tables dédiées" [17]. DeckCheck verifies the list against a bracket [7]. No store found pairs by declared and estimated bracket together. Estimates have a ceiling: a calculator matched organisers' brackets exactly 77.1% of the time and within one bracket 99.5% of the time ([I-15](i15-rule-zero-sheets-and-pod-profiles.md#what-the-market-does)).

**Pain points.**

- **Mismatched pods.** A player warned that "the LGS rando pods are on average bad to worse compared to playing with people I know", and another asked, "for the sake of the whole pod, bracket your deck correctly" (r/mtg, about 2025-10-28) [15]. A first visit found a group that "didn't really understand the bracket system" (r/mtg, about 2025-12-01) [16].
- **Rule 0 at the table.** "Expliquez rapidement votre deck avant de commencer"; it "évite énormément de frustrations" [17].
- **Pod sizes and latecomers.** Pods of "three to five players (four is the sweet spot)" [1]; groups "drop in or out of a pod" and "re-form pods and play again" [4]; the extension above puts pods of four first [14].
- **Prizes.** Flat prizing is "Great for casual events and unstructured play like Commander"; WPN promos follow set rules (Legal and policy, below) [5].

**Evidence gaps.** reddit.com could not be fetched; the two threads above were read through a dated mirror. No r/mtgLGS thread and no French forum thread was found, so the French evidence is two venue pages.

**Legal and policy (research, not legal advice).** WPN: "Promo Packs cannot be sold or used as sales incentives"; program promos "must be distributed in a prescribed way"; for store credit, "Legal restrictions vary by region, so always check with legal counsel" [5]. GDPR: information is owed "at the time when personal data are obtained" (Art. 13) [19]. In France, for processing based on consent in online services, a parent must agree jointly with a child under 15 (Loi Informatique et Libertés art. 45, CNIL 2021-06-09) [20]. Each point is an open question below.

**The gap.** EventLink records attendance; DeckCheck checks lists but forms no pods; TopDeck forms pods for a fee without stated bracket use. Nobody found pairs a night's pods by declared and estimated bracket, carries the pod's consented Rule 0 sheets, and keeps the night's results tied to deck versions.

## Current state in this codebase

Verified on `dev` (commit `61792c1`) on 2026-11-09:

- **No store, night, pod or check-in model.** `prisma/schema.prisma` has none; no code under `src/` models a pod. The only role is `User.isModerator`. I-15 has not started.
- **Brackets are a target and an override, not a declaration.** `Deck.targetBracket` defaults to 3 and `Deck.manualBracket` holds 1 to 4 or null. `src/lib/constants/brackets.ts` declares `BracketLevel = 1 | 2 | 3 | 4`, with bracket 1 named "Casual". `scoreBracket` in `src/lib/deck/bracket.ts` computes on read and nothing stores it. I-28 slice 2 adds bracket 5.
- **Share links expose whole rows.** `POST /api/decks/[id]/share` makes a 12-character token from 9 random bytes. `GET /api/share/[token]` returns the deck row and its cards minus `shareToken`, with no field allowlist, so `userId`, `budget` and `manualBracket` leave too. `src/app/robots.ts` disallows `/share/`. A night page must use I-36's public projection instead.
- **Public profiles exist.** `/u/[username]` (`src/app/[locale]/u/[username]/page.tsx`) lists public decks with their `targetBracket`.
- **No QR code, no scheduler, no mail.** `package.json` has no QR or mail library, `src/` has no QR code, and there is no cron route and no `vercel.json`, so a 24-hour purge needs a job (I-38 slice 14 or its own).
- **Rate limits are per instance.** `src/lib/rate-limit.ts` keeps counts in process memory (I-30), too weak for a public check-in endpoint.
- **Rules pages exist.** `src/app/[locale]/rules/game-changers/` can be linked from a night's house rules.

## Functional requirements

### 1. Scope: a casual night, not a tournament

1.1 A night forms pods. It has no Swiss rounds, standings, points, match results, byes or top cut.
1.2 The tool works beside EventLink. The organiser screen states that WPN store metrics count the attendance recorded in EventLink [1][2]; nothing suggests skipping it.
1.3 No entry fees, tickets, payments, prize tracking, store credit or random prize draws. A night may show a prize note the store writes.
1.4 Turn order is not assigned; the table decides it as usual.

### 2. Pod pairing

2.1 `formPods(entries, policy, priorPods)` is a pure function. An entry has an effective bracket from 1 to 5 and an optional play-together group. The policy holds allowed pod sizes (default 3, 4, 5; 2 optional), whether uneven counts make pods of 3 or of 5, the maximum bracket spread in a pod (default 1), dedicated brackets that never mix, and the pairing basis.
2.2 Sizes come first: the most pods of four, then the store's preferred uneven size. An entry that fits no allowed size, or no pod within the maximum spread, goes to a waiting list with its reason.
2.3 Within those sizes, pods minimise total bracket spread, then pairs who already shared a pod that night. Play-together groups are never split.
2.4 The same input gives the same pods. Ties break on a stable hash of night, round and entry ids; `Math.random()` is never used.
2.5 The pairing basis is `declared` (default) or the higher of declared and estimated. The night page states which.
2.6 **Account-free planner.** An organiser types labels and brackets, sets the policy and prints the pods. Labels stay in the browser; no request carries them. One I-39 product event counts each run, with no label.

### 3. Stores and staff

3.1 Creating a store needs an account: slug, name, city, country, optional website. Roles are owner and staff; only the owner manages staff or deletes the store.
3.2 A store page reads "not verified" until verified (open question 5). It can be reported through I-38's notice form.
3.3 The product lists, searches and ranks no stores. A store page is reached by its link or QR code and stays `noindex` until verified.

### 4. Nights and house rules

4.1 A night records date, start and end, check-in window, capacity, allowed brackets, dedicated-bracket tables, the pod policy (2.1), a latecomer rule (seat into an open pod, wait for the next round, or no entry after a time), house rules and a prize note.
4.2 House rules link to I-28's guide and the Game Changers page. A store's additions, such as "no mass land destruction", are labelled as the store's rule, not an official one.
4.3 A new round pairs every entry that is checked in, not dropped and not in a pod still playing. It never moves a seated player.

### 5. Check-in by QR code

5.1 Each night has a check-in token in its URL and a printable QR code. Staff can close check-in and rotate the token, which rejects the old one.
5.2 **Account check-in.** The player picks a deck. The entry freezes the commanders, the deck version (as [I-35 3.1](i35-pod-game-log.md#3-the-deck-version-and-the-agreement-frozen-at-log-time)), the declared bracket, and the estimated bracket with its method version.
5.3 The declared bracket comes from the player's I-15 sheet, else from the form. "I don't know" is allowed and staff assign one. `Deck.targetBracket` is never read as a declaration.
5.4 **Guest check-in** asks for a display name, a declared bracket and, optionally, a commander picked from card data (requirement 8).
5.5 Staff add walk-ins from the organiser screen, with or without a name. A player or staff member can drop an entry, which leaves later rounds.
5.6 The public check-in endpoint enforces capacity and the window, and is rate-limited per night and per network address across instances.

### 6. Declared and estimated brackets

6.1 Organiser and pod views show both, labelled "declared" and "estimated from the list", as [I-15 1.4](i15-rule-zero-sheets-and-pod-profiles.md#1-the-sheet) requires. The estimate is deterministic (I-03); no model is called.
6.2 An estimate two or more brackets from the declaration shows the organiser "talk before the game". A gap of one is shown without a flag: a published calculator matched organisers exactly only 77.1% of the time, but within one bracket 99.5% of the time (I-15).
6.3 A declared bracket outside the night's allowed range is refused at check-in, citing the store's rule. An estimate outside it is a prompt, never a refusal.
6.4 Until I-28 slice 2 ships, the label says the estimate stops at bracket 4.

### 7. At the table

7.1 When pods form, a player with an account can share their I-15 sheet with that pod in one action, scoped and revocable as [I-15 2.2](i15-rule-zero-sheets-and-pod-profiles.md#2-privacy-and-consent) requires. Pod members see consented sheets in I-15's comparison.
7.2 After a game, a pod member can log it through I-35 with the pod prefilled. Guests appear as I-35 labels.
7.3 The public night page shows tables, seats, display names, commanders and declared brackets. Estimates and prompts are visible only to staff and to the pod's own members.
7.4 A deck list appears only for a public deck, through I-36's public projection. A night creates no share link and returns no raw `Deck` row.

### 8. Guest data and retention (research, not legal advice)

8.1 A guest gives a display name (up to 24 characters, hint "a first name or a nickname"), a declared bracket and optionally a commander. The API refuses email, phone, age and any other field.
8.2 Staff can add an unnamed "Guest 7" for anyone who prefers it, minors included.
8.3 The check-in form shows the Art. 13 information when the name is collected [19]: controller, purpose, 24-hour retention, rights, and a link to I-38's privacy policy.
8.4 Guest names are deleted 24 hours after the night ends, as EventLink does [2]; pages hide them from that moment even if the job is late. Account entries then show "Player" and the commander, unless the player keeps the night in their own history.
8.5 No cookie or identifier links a guest across nights, as [I-35 2.5](i35-pod-game-log.md#2-who-sat-at-the-table) requires. A past night's public page shows counts only: players, pods, bracket spread.

### 9. Store-plan candidates (I-30 decides)

9.1 **Always free:** everything a player does; the account-free planner; a store page; and running a night with check-in, pairing, sheets and logging.
9.2 **Candidates:** recurring nights from a template; the store's history across nights; a store-private pod-health report (share of pods within one bracket, prompts raised, latecomer waiting time, pod sizes); extra staff seats; branded QR posters; CSV export of the store's nights without guest names.
9.3 **Why a store might pay:** TopDeck charges $12 a month or $120 a year for pods, check-in and a store page [6], and Spicerack sells paid tiers [9]. DeckCheck checks lists free but forms no pods [7], and EventLink forms none [2]. None found pairs by declared and estimated bracket with the pod's sheets.
9.4 **Price, an estimate:** €8 to €12 a month, anchored on TopDeck's price, the only public comparable found. I-30 slice 0 decides. Nothing paid changes what players see, and no store, deck or player is placed or ranked for money.

## Data model / API

```
Store        id, slug @unique, name, city, countryCode, websiteUrl?, verifiedAt?, createdById, createdAt, updatedAt
StoreMember  storeId, userId, role (owner | staff), addedAt            @@id([storeId, userId])
StoreNight   id, storeId, startsAt, endsAt, checkInOpensAt, capacity, checkInToken @unique, status (draft | open | closed),
             allowedBrackets Int[], dedicatedBrackets Int[], podPolicy Json, pairingBasis (declared | higherOfBoth),
             latecomerRule, houseRules, prizeNote, namesPurgedAt?
NightEntry   id, nightId, kind (account | guest), userId?, deckId?, snapshotId?, displayName?, commanderScryfallIds[],
             declaredBracket?, declaredSource (sheet | form | staff | none), estimatedBracket?, bracketMethod?,
             playWithGroup?, keepInHistory, checkedInAt, droppedAt?
NightPod     id, nightId, round, tableNumber, method (auto | manual), createdAt   @@unique([nightId, round, tableNumber])
NightPodSeat podId, entryId                                                      @@id([podId, entryId])
```

`NightEntry.displayName` is the only column holding a guest's name; the purge sets it to null and records `namesPurgedAt`. A schema test guards against any contact column. Deleting an account turns its entries into unnamed guests, extending I-38's cascade. A `NightPod` is the one-night pod that I-15's open question describes; whether I-15's `PodShare` points at it directly is open question 3.

Organiser routes check `StoreMember`: `POST /api/stores`, `PATCH /api/stores/[slug]`, `POST|DELETE /api/stores/[slug]/members`, `POST /api/stores/[slug]/nights`, `PATCH /api/nights/[id]`, `POST /api/nights/[id]/token`, `POST /api/nights/[id]/entries`, `POST /api/nights/[id]/rounds` (runs `formPods`), `PATCH /api/nights/[id]/pods/[podId]` (a manual move, recorded). Public: `GET|POST /api/check-in/[token]`. Pages: `/s/[slug]` and `/n/[token]`.

## Non-goals

- A tournament manager: Swiss, standings, points, results, top cut, penalties or judge tools.
- A venue directory or store locator; Wizards' Store and Event Locator does that [1].
- Entry fees, tickets, payments, prize payouts, store credit or random prize draws.
- Replacing EventLink or writing to it.
- Guest accounts, stored contact details, or a guest identity across nights.
- Rankings, Elo, win counts or leaderboards on store and night pages ([I-35 non-goals](i35-pod-game-log.md#non-goals)).
- Life counters and timers, the table companion the roadmap rules out.
- Checking the deck played against a submitted list; DeckCheck offers it free [7].
- AI in pairing, estimates or check-in.

## Testing strategy

- **Solitary, `formPods`:** every active entry is seated once or waiting with a reason; sizes stay in the allowed set; total spread equals a brute-force optimum on generated fixtures up to 12 entries; play-together groups stay whole; dedicated brackets never mix; round two minimises repeat pairs; counts 0 to 7 behave as the policy says; the same input gives the same output.
- **Planner:** a network assertion shows that no request URL or body contains a typed label.
- **Check-in (sociable):** a sheet's declaration beats the form; `targetBracket` is never read; the estimate is frozen with its method; an out-of-range declaration is refused and an out-of-range estimate only prompts; capacity, a closed window and a rotated token are refused.
- **Privacy:** with the clock past the purge time, no response holds a guest's name; the public night page holds no estimate or prompt; a field snapshot test runs night responses through I-36's projection; a guest POST carrying `email` is refused.
- **Permissions:** non-members get 403 on organiser routes; staff cannot manage members.
- **Honesty:** "declared", "estimated from the list" and "not verified" render in EN and FR.

## Delivery slices

| #   | Slice                                                                                                        | Depends on                                                               |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | `formPods` with its policy, deterministic tie-break and brute-force tests                                    | —                                                                        |
| 2   | Account-free pod planner page, printable, with the no-network test and one I-39 product event                | 1                                                                        |
| 3   | Store, staff roles, store page with house rules, "not verified" label, `noindex`                             | —                                                                        |
| 4   | Nights: policy, check-in window, token rotation, printable QR code                                           | 3                                                                        |
| 5   | Account check-in: deck pick, declared and estimated brackets frozen, drop                                    | 4; I-15 slice 1 for sheet values (the form works without it)             |
| 6   | Guest check-in and staff walk-ins, Art. 13 notice, 24-hour name purge                                        | 4; I-38 slice 6 for the policy link; lawyer answers before public launch |
| 7   | Organiser screen: rounds from `formPods`, manual moves, latecomers, waiting list, mismatch prompts           | 1, 5                                                                     |
| 8   | Night page: tables, seats, declared brackets, public decks through I-36's projection, counts after the night | 7; I-36 slice 1                                                          |
| 9   | Consented I-15 sheets per night pod                                                                          | 7; I-15 slices 3 and 4                                                   |
| 10  | Log a game from a night pod                                                                                  | 8; I-35 slice 6                                                          |
| 11  | Store verification by a link from the store's website; reports through I-38                                  | 3; I-38 slice 8                                                          |
| 12  | Store-private history across nights and the pod-health report                                                | 8                                                                        |
| 13  | Store-plan entitlements: templates, history, report, staff seats, export                                     | **Blocked** on I-30 slice 0; 12; I-30 slice 4                            |

Slices 1 and 2 ship alone and are the cheap early part. Slices 3 to 8 wait for open question 1's demand threshold. Slice 6 puts the purge-time guard in the entry serialiser, so every later page inherits it.

## Open questions

1. **Do stores want it?** Set the level of planner use (slice 2's product event) that justifies slices 3 to 8, and ask two stores, one French, before slice 3.
2. **For the lawyer list in I-30 7.2 (research, not legal advice):** Is the store the controller of guest data and MagicAIBuilder its processor, or are they joint controllers? Which lawful basis covers a guest's nickname, and does art. 45 apply to a guest under 15 if it is consent [20]? Is 24 hours enough, or too long? Does a store plan, sold to a business, change the Fan Content Policy answer or the consumer-law flows of I-30? Would a random prize draw among paying entrants be a lottery under French law, which is why requirement 1.3 excludes draws?
3. **One-night pods.** I-15 leaves open whether a pod lasts. Should `PodShare` reference a `NightPod`, or should each night pod create an I-15 pod?
4. **Wizards could ship pod pairing.** It has been on EventLink's backlog since 2021 [3]. Does that risk justify the store plan, or only the free planner?
5. **How is a store verified?** A link back from its website, a staff email at its domain, or nothing beyond the label and reports?
6. **Attendance export to EventLink.** EventLink imports invite lists only for emails tied to a Wizards account [2], and guests leave no email here. Is there an export worth offering?

## Sources

Read 2026-11-09 unless dated.

1. WPN, "How to run successful Commander events and grow your community", 2025-11-18. https://wpn.wizards.com/en/news/how-to-run-successful-commander-events-and-grow-your-community
2. WPN, "The definitive guide to Wizards EventLink", 2024-03-25, revised since. https://wpn.wizards.com/en/news/definitive-guide-wizards-eventlink
3. Wizards Companion feedback, "Commander tournaments", 2021-09-18; Wizards reply 2021-10-04. https://feedback.wizards.com/forums/929932-companion-feedback/suggestions/44168565-commander-tournaments
4. WPN, "3 strategies to make the most of Commander nights", 2021-10-26. https://wpn.wizards.com/en/news/3-strategies-make-most-commander-nights
5. WPN, "How to prize your Magic events for maximum impact", 2025-08-27. https://wpn.wizards.com/en/news/how-to-prize-your-magic-events-for-maximum-impact
6. TopDeck.gg, plans for organisers (undated page). https://topdeck.gg/subscribe
7. DeckCheck, for stores (© 2025). https://deckcheck.co/stores
8. SpellRack, upgrade (© 2026). https://spellrack.com/upgrade
9. Spicerack documentation, FAQ (undated); spicerack.gg refused the connection. https://docs.spicerack.gg/troubleshooting/faqs
10. Playgroup Live, for communities (figures for October 2026). https://playgroup.gg/playgroup-live/for-communities
11. Melee.gg, entry fee and payment policies, 2023 (search summary; the page returned 403). https://app.prod.melee.gg/Policy/Payments
12. Carde.io, home page. https://carde.io
13. Unity League, organiser information (search summary). https://unityleague.gg/info/organizer
14. Playerlist Podder, Chrome Web Store (search summary). https://chromewebstore.google.com/detail/eepopffhopkaeoooicgfpdkfiipjpidl
15. r/mtg, "What should I know before going to LGS for EDH for the first time?", about 2025-10-28, post 1t3sft0; read through a mirror snapshot of 2026-05-05. https://reddit.sentinel-team.org/posts/1t3sft0/snapshots/2026-05-05T01%3A30%3A00.555862Z
16. r/mtg, "I went to my LGS for EDH for the first time - This is how it went.", about 2025-12-01, post 1tjnz4z; read through a mirror snapshot of 2026-05-22. https://reddit.sentinel-team.org/posts/1tjnz4z/snapshots/2026-05-22T02%3A28%3A34.531031Z
17. Gaming & Caux, "MTG Débuter à Gaming & Caux : brackets Commander et bonne table", 2026-03-22, updated 2026-08-17. https://gamingcaux.fr/mtg-debuter-gaming-caux-brackets-commander-conseils
18. La Bonne Excuse, "Soirée Commander / EDH", weekly listing. https://la-bonne-excuse.fr/evenements/soiree-commander-edh-magic-the-gathering
19. GDPR Art. 13. https://gdpr-info.eu/art-13-gdpr/
20. CNIL, "Recommandation 4 : rechercher le consentement d'un parent pour les mineurs de moins de 15 ans", 2021-06-09. https://cnil.fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans
