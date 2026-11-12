# I-72: Growth Loops That Respect Players: Referrals, Creators And Coming Back

> **Initiative:** I-72, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 1, 5, 7, 8 and 9, which need no decision; Next once [I-39](i39-first-run-activation-and-measurement.md)'s event store lands (its slice 10, behind I-39's legal slice 0) for slices 2 and 3; Later for slices 4, 6 and 10 to 16, which wait for view counts, the paid tier, I-36's later slices, counsel or the owner · **Paid:** sells nothing itself; the referral credit and the creator seat give months of the paid plan, so they exist only if [I-30](i30-business-model-and-paid-tier.md) sells one · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10, not committed. Every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to [L-43](../legal-questions.md#l-43-referral-and-creator-rewards) or the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the list of growth loops and the entry contract that measures them (`signupEntry`, `via`, `share_action`); the signed-out path from a public surface into sign-up and back; the loop view and the "what it takes" panel in I-39's owner page; the referral credit (rules, codes, ledger, labelling text); the creator programme (kit page, verified links, early-access and complimentary-seat grants); the rules every notice that brings a player back must follow; a recommendation on D-78; the publishing calendar, which says which content ships when. **Does not own:** the release calendar's set dates and milestones ([I-73](i73-every-set-release-ready-on-day-one.md)), which the publishing calendar reads; embeds, deck images, view counts and creator analytics ([I-36](i36-creator-and-embed-toolkit.md)); link previews and the Discord app ([I-46](i46-discord-and-chat-integrations.md)); the event store, activation, retention and experiments (I-39); billing, entitlements, webhooks, prices and the pod pass (I-30); the inbox, email and preferences ([I-63](i63-one-notification-system.md)); report pages, the index policy and the Search Console baseline ([I-34](i34-commander-data-reports.md)); guide content and order ([I-28](i28-commander-deckbuilding-guide-by-bracket.md), [I-68](i68-archetype-guides.md)); rules-change notices ([I-48](i48-official-changes-reach-every-deck.md)), price alerts ([I-59](i59-prices-over-time-and-alerts.md)) and the new-card radar ([I-18](i18-per-deck-radar-of-new-cards.md)); pods ([I-15](i15-rule-zero-sheets-and-pod-profiles.md), [I-23](i23-the-pods-own-surface.md)); challenges ([I-53](i53-monthly-deckbuilding-challenges.md)); the recap ([I-60](i60-player-stats-and-year-in-review.md)); break-even counts ([I-66](i66-running-costs-and-margin.md)); operator roles ([I-69](i69-operator-console-support-moderation-and-kill-switches.md)).
> **Proposed changes to neighbours, for the integrator:** I-30's roadmap item "A referral credit, after slice 9" is delivered by slices 11 and 12 here. I-36's roadmap item "A creator kit" is delivered by slice 13. I-34's roadmap item "A publishing calendar" is delivered by slices 7 and 8, which read [I-73](i73-every-set-release-ready-on-day-one.md)'s release calendar for set dates and milestones. I-60 9.1's `signup_entry` event becomes `User.signupEntry` (slice 2), so I-60 slice 9 depends on I-72 slice 2. I-46 7.1's `?via=discord` becomes one value of the `via` enum. The adult declaration of [I-44 slice 12](i44-trade-lists-within-the-pod.md#7-minors) moves to `User.adultDeclaredAt`, which I-44, I-56, I-63 and I-72 all read. `owner-decisions.md` gains a creator-programme decision ([D-80](../owner-decisions.md#product-scope-and-non-goals)) and this spec's recommendation on D-78. L-43 gains questions (e) to (h).

## Overview

The product has to pay. [I-66 requirement 9](i66-running-costs-and-margin.md#9-break-even-under-i-30s-prices) finds that 22 monthly or 33 yearly payers cover the fixed costs, and about 1,230 monthly or 1,870 yearly payers make a living. At I-30's assumed 3% conversion, that is 733 to 62,000 active accounts. Today nothing counts where an account came from, and a visitor who opens a shared deck cannot fork it without losing the page: the button is disabled when signed out, and sign-up always lands on `/decks`.

A gap audit on 2026-11-10 found four holes. No initiative scopes a referral. I-36's non-goals exclude "community programming" and creator revenue shares. The getting-started email is ruled out by I-39 and I-63 and waits on owner decision D-78. I-34 has a Search Console baseline but no publishing calendar.

This spec closes them with one rule: **a loop is something a player chooses to do.** Nothing fires because a player went quiet, nothing ranks people by spend, referrals or audience, and every reward is time on the plan, never cash. It names the loops that bring Commander players, measures each with I-39's events, specifies a referral credit and a creator programme as owner decisions, sets the rules for bringing a lapsed player back, recommends an answer to D-78, ties publishing to Commander's release calendar, and states the sign-up volume each money goal needs.

## What the market does

Read on 2026-11-10 unless dated otherwise. Moxfield's and EDHREC's Patreon pages answered HTTP 403 [13], and Moxfield's own pages refuse automated reads ([I-36](i36-creator-and-embed-toolkit.md#what-the-market-does)).

**What deck sites offer creators and referrers.**

| Product    | Creators                                                                                                                                                                                                                                                                                                                       | Referral                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Archidekt  | Sponsorship: The Command Zone episode 535 (2023-06-06) carried "Go to www.Archidekt.com/commandzone to get started today!" [2]. A June 2026 r/EDH comment credits Archidekt with "the sponsor race for all the influencers" ([I-36](i36-creator-and-embed-toolkit.md#what-the-market-does)). The FAQ names no creator perk [1] | None found. The $2 Patreon tier links the account and removes ads; footer price links carry `partner=Archidekt` and `utm_campaign=affiliate` [1]                                     |
| EDHREC     | A writer roster by application: pitch "a series of articles built around a central theme"; "Good pitches will contextualize or incorporate EDHREC data". No pay, perk, video or podcast is mentioned [3]                                                                                                                       | None found                                                                                                                                                                           |
| Moxfield   | No public creator programme found (search). Its Patreon members saw an editor redesign preview on 2026-09-28 ([roadmap](../roadmap.md#owner-ambition-and-business-model-2026-11-09))                                                                                                                                           | None found                                                                                                                                                                           |
| CardCastle | —                                                                                                                                                                                                                                                                                                                              | "BOTH receive $9 in credits", "effectively a free month for both of you!", for each friend who signs up and confirms; no payment needed, no cap, credit not cash (2023-08-09) [5][6] |
| TappedOut  | Sells Featured Decks slots for tokens ([I-36](i36-creator-and-embed-toolkit.md#what-the-market-does))                                                                                                                                                                                                                          | —                                                                                                                                                                                    |
| Mana Pool  | Pays 5% of a referred first sale to applicants with "significant presence" ([I-32](i32-seller-handoff-and-affiliate-carts.md#what-the-market-does))                                                                                                                                                                            | —                                                                                                                                                                                    |

No referral programme was found for DeckCheck, ManaTap, Playgroup or TopDecked (search, 2026-11-10). The incumbents pay creators in money or exposure; none found offers a verified link, a disclosed complimentary seat or a referral tied to a real payment.

**How Commander players arrive.** The reference sites grew through creators and gatekeepers, not search ([I-36](i36-creator-and-embed-toolkit.md#what-the-market-does)). Google sends 10–36% of visits and direct visits are 47–79% (Semrush estimates, [I-34](i34-commander-data-reports.md#what-the-market-does)). Release content links decklists to a deckbuilder: EDHREC's review of the Federation Fleet precon went up on 2026-11-02, eleven days before the deck's release, with a "View on Archidekt" link [4]. No survey of how Commander players choose a deck site was found (search, 2026-11-10).

**Release cadence.**

| Date                   | Release                                                                                   | Source  |
| ---------------------- | ----------------------------------------------------------------------------------------- | ------- |
| 2026-11-13             | Star Trek; WPN early access from 2026-11-06; "Commander Decks" and a Collector's Edition  | [7][8]  |
| 2027-02-05             | Nauctis: The Sunken Realm                                                                 | [9]     |
| 2027-04-09             | Marvel: Darkhold Destiny in [9] (2026-10-09); an unannounced Universes Beyond set in [10] | [9][10] |
| 2027-06-04             | Kamigawa: Titanbreach                                                                     | [9]     |
| 2027-08-06, 2027-11-19 | Universes Beyond sets, unannounced                                                        | [9]     |
| 2027-10-01             | Zhalfir                                                                                   | [9]     |

Every 2027 set "will include four Commander decks", 24 in total [10]. Commander announcements follow no schedule: five dated changes from 2024-09-30 to 2026-02-09, and the next "likely" before the end of 2026 ([I-48](i48-official-changes-reach-every-deck.md#what-the-market-does)).

**Law (research, not legal advice).** Loi n° 2023-451, as amended by ordonnance 2024-978, covers people who "à titre onéreux, mobilisent leur notoriété auprès de leur audience" to promote goods or services; commercial intent must be made explicit, for example with "publicité" or "collaboration commerciale", unless clear from context (art. 1, art. 5-2) [11]. The Unfair Commercial Practices Directive blacklists "a direct exhortation to children to buy advertised products or persuade their parents or other adults to buy" them (Annex I point 28) [12]. The Fan Content Policy's "Free means FREE" and the CNIL's view that a free account is not a customer are already [L-16](../legal-questions.md#l-16-does-a-paid-tier-fit-wizards-fan-content-policy) and [L-14](../legal-questions.md#l-14-are-notices-the-player-turned-on-prospection).

## Current state in this codebase

Verified on `dev` at `fee835d8` on 2026-11-10:

- **Sign-up drops the visitor's place.** `src/components/auth/SignUpForm.tsx` sends both credentials and Google sign-up to `callbackUrl: "/decks"` (lines 43 and 59). `src/app/api/auth/signup/route.ts` accepts only `name`, `email` and `password`: no entry, code, age declaration or terms acceptance.
- **A signed-out visitor cannot fork.** `src/components/profile/PublicDeckActions.tsx` disables "Fork" with `disabled={!isSignedIn || forking}` (line 115) and offers no sign-up path. Its share action copies `window.location.href` with no parameter (line 66), which this spec keeps.
- **Nothing records a source.** `git grep` over `src` finds no `via=`, `utm_`, `ref=` or referral parameter. `prisma/schema.prisma` has no entry field, age declaration, `Subscription`, `AiUsage`, `ProductEvent` or pod model. `NotificationPreference` holds four booleans that only the settings page reads; no sender exists.
- **No billing, email or analytics dependency.** `package.json` lists only `@vercel/speed-insights` of that kind.
- **Public surfaces that exist.** 16 pages under `src/app/[locale]`, among them `/deck/[id]`, `/share/[token]`, `/u/[username]`, `/commanders/[slug]/decks`, `/rules/game-changers` and `/rules/comprehensive`. No guide, report, embed, pricing, join or creator page. The deck page's `og:image` is the commander's art crop (`src/app/[locale]/deck/[id]/page.tsx` line 42), and the free-text `src/app/api/og/route.tsx` still exists. `src/app/sitemap.ts` lists public decks, profiles and commander pages.

## Functional requirements

### 1. Ground rules

1.1 **No dark patterns**, as [I-39 requirement 7](i39-first-run-activation-and-measurement.md#7-no-dark-patterns) defines them, on every surface here: no streaks, countdowns, scarcity claims, pre-ticked boxes, sign-up walls or modals on public pages.
1.2 **Nothing ranks people.** No leaderboard, tier or public count of referrals, and no visibility, placement or ordering changed by a referral, a grant or spend ([non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark)).
1.3 **Rewards are plan time, never cash**: no gift cards, transferable credit, store credit or payout.
1.4 **The product never writes to a third party.** No "invite a friend by email" form and no import of contacts. A player shares links themselves.
1.5 **An ordinary share link carries no parameter.** Only links the product places on its own surfaces (2.3) carry a `via` label, and only a referral link the player chooses to copy carries a code. No link carries a user id, username or hash.
1.6 Content stays free and tools stay paid ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). A loop never gates a deck, guide or report.

### 2. The loops and how a visitor enters

2.1 The loops, with the entry value each sign-up records and the initiative that owns the surface:

| Loop                            | What travels                                    | Entry value                                         | Surface owner                                      |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| Shared deck link                | A public or share-token deck URL                | `deck_page`, `share_page`                           | [I-08](i08-share-compare-and-learn.md) |
| Embed and deck image            | An iframe in an article; the preview image      | `deck_page` (via `embed`)                           | I-36                                               |
| Discord                         | A link preview; an app reply                    | `deck_page` (via `discord`)                         | I-46                                               |
| Creator decklist in a video     | A deck URL in a description or pinned comment   | `deck_page`, `creator_page`                         | I-36, group 5                                      |
| Pod invite                      | An invite to a pod's sheets                     | `pod_invite`                                        | I-15, I-23; pod pass in I-30                       |
| Search to data pages and guides | A report, rules-change, guide or commander page | `report`, `rules_change`, `guide`, `commander_page` | I-34, I-48, I-28, I-68                             |
| Recap                           | A shared year in review                         | `recap`                                             | I-60                                               |
| Referral                        | A referral link                                 | `referral`                                          | group 4                                            |

2.2 **Signed-out fork.** On a public deck or share page, "Fork" stays enabled for a signed-out visitor. It opens sign-up with the entry and a return path; after sign-up the fork is created and the builder opens on it (`Deck.origin = fork`, I-39 8.2). A "Build your own" link does the same into I-39's first-run panel.
2.3 **`via` on the product's own links.** The embed's "View on MagicAIBuilder" link, Discord app replies and the recap's call to action append `via` from the fixed enum `embed | discord | recap`. The landing page passes it to its sign-up link.
2.4 Sign-up keeps `entry`, `via` and the return path through credentials and Google, with I-39 slice 2's rules for unsafe return paths.
2.5 **Pod invite** (after [D-40](../owner-decisions.md#product-scope-and-non-goals) says a pod is durable): an invite link opens the pod's comparison (I-15 slice 4) for a signed-out visitor, who can paste a list to compare and needs an account only to save.

### 3. Measuring each loop

3.1 `User.signupEntry` and `User.signupVia` are written once at account creation from allowlisted enums; an unknown value becomes `other`. I-39's opt-out (8.7) nulls them.
3.2 A `share_action` event joins I-39's allowlist: `surface` (deck_page, share_page, embed_snippet, image_download, recap, referral_link) and `method` (copy, native). It carries the deck in I-39's `deckId` column and nothing else.
3.3 **Share-to-signup rate**, weekly: sign-ups with entry `deck_page` or `share_page` per 1,000 public deck page and embed views, split by `via`, from [I-36's counters](i36-creator-and-embed-toolkit.md#8-view-counts-and-privacy). A second line divides by `share_action` counts.
3.4 **Time to first value** by entry: I-39 11.3's time to the first full-size deck (median, 75th percentile, n), and activation (I-39 11.2) by entry.
3.5 Conversion by entry comes from I-30's owner page once it exists. Every figure follows I-39 11.9: counts under 30, rates with n and a 95% interval, labelled "descriptive, not causal". No page lists one account.

### 4. Referral credit (exists only if I-30 sells a plan)

4.1 **Give a month, get a month.** When a referred account's first payment passes the withdrawal window (14 days, [I-30 6.6](i30-business-model-and-paid-tier.md#6-billing-accounts-and-the-subscription-lifecycle)) without a refund, both accounts receive one month of the paid plan. A payer's period is extended; a free referrer gets an entitlement with an end date ([I-30 5.4](i30-business-model-and-paid-tier.md#5-entitlements)).
4.2 **Eligibility.** The referrer has a verified email ([I-61](i61-account-security.md)) and the adult declaration; the referred account was created through the code or entered it at checkout within 30 days of sign-up, and has never held a subscription.
4.3 **Limits (proposal).** One credit per referred account; at most six credited months per referrer per rolling 12 months; codes are random, revocable and never the username. Refunds and chargebacks void a pending credit; a credited month is not clawed back.
4.4 **Labelling.** The referral page shows, in English and French, the counsel-approved text a referrer adds when posting the link publicly ("I get a free month if you subscribe" until L-43 answers) and the full conditions in one place.
4.5 **Minors.** Accounts without the adult declaration see no referral page and cannot create a code. The landing page of a referral link addresses nobody as a child and asks no one to buy (UCPD Annex I point 28 [12]).
4.6 The referrer sees only their own counts: links created, sign-ups, credited and voided months. Nothing is public.
4.7 **Cost (estimate).** A credited referral forgoes at most two months of contribution, 2 × €2.07 = €4.14 on the monthly plan (I-66 9.1), and the cap bounds one referrer's six credits a year at €12.42 for their own months and €24.84 with the referred side (computed).

### 5. Creator programme (owner decision)

5.1 **Within I-36 as written:** the creator kit page (embeds, deck images, brand rules, the Fan Content notice, a named contact, the programme's criteria) and verified links. An operator verifies that a creator controls a linked channel; the profile then shows "Verified link" beside that link, with no badge on decks, no audience threshold and no effect on ordering ([I-36 6.5](i36-creator-and-embed-toolkit.md#6-creator-page-and-attribution)).
5.2 **Needs the owner to amend I-36's non-goal "contests and community programming":** an early-access flag and a complimentary paid seat for 12 months, granted on a published, non-monetary criterion (for example, Commander content published in each of the last three months). The grant never asks for a post, a link or a mention.
5.3 **Disclosure.** A creator holding a grant shows "Complimentary access from MagicAIBuilder" on the creator page. Whether that suffices, or posts must also say "collaboration commerciale" under art. 5-2 [11], is L-43.
5.4 **Never:** money, revenue shares, affiliate splits, tips, paid placement, featuring in discovery or search, or a grant tied to views (I-36 non-goals stay).
5.5 **Cost (estimate).** A seat costs the AI and hosting of a payer, €0.10 to €0.55 a month ([I-30 A5](i30-business-model-and-paid-tier.md#8-metrics-and-what-living-from-it-takes)); a cap of 25 seats costs €2.50 to €13.75 a month (computed).
5.6 **The decision.** (a) 5.1 only; (b) 5.1 plus early access; (c) 5.1, early access and the capped seat. This spec recommends (b) now and (c) after L-16 and L-43: verified links and the kit cost nothing, while the seat is a benefit in kind whose labelling is unsettled.

### 6. Returning players

6.1 **Only events the player set up bring them back:** a ban or Game Changers change on a deck they own (I-48), a price rule on their wanted list (I-59 6.1, "the wanted list" scope), and new cards for a deck whose watch they turned on (I-18 slice 6).
6.2 Each reaches the player through I-63's categories "Rules changes on my decks", "Price alerts I created" and "New cards for my decks", in the app first and by email only if the player turned email on ([I-63 4.2](i63-one-notification-system.md#4-preferences-defaults-and-consent)).
6.3 **No notice is caused by absence**: no "we miss you", inactivity timer, last-seen input, streak or reminder of unchecked prices ([I-63 1.2](i63-one-notification-system.md#1-ground-rules), [I-59 7.1](i59-prices-over-time-and-alerts.md#7-delivery-consent-and-unsubscribe)).
6.4 Each notice opens the page that answers it (I-48's impact report, I-59's alert event, I-18's radar), with no interstitial and no upsell.
6.5 The owner view shows, per category, the share of in-app notices read within 7 days and of recipients active within 7 days, labelled descriptive. Email clicks are not tracked (I-63 1.3).

### 7. D-78: the getting-started email

7.1 **Options.** (a) None, as [I-39 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns) and I-63 1.2 rule today. (b) A reminder the player sets: "Remind me about this deck" in 1, 3 or 7 days, in the app, and by email only if ticked at that moment, sent once. (c) The gap sweep's series: up to three emails in 14 days after an unticked box at sign-up, stopping at the first saved deck.
7.2 **Recommendation: (a) now, and (b) once [D-50](../owner-decisions.md#product-scope-and-non-goals) rules that a notice the player asked for is not re-engagement.** The owner decides it as [D-78](../owner-decisions.md#product-scope-and-non-goals).
7.3 **Why.** The effect of (c) cannot be measured yet: detecting activation moving from 30% to 35% needs 1,377 accounts per arm ([I-39 13](i39-first-run-activation-and-measurement.md#13-experiment-discipline)), about 2,750 sign-ups within the four weeks I-39 13.2 allows, more than ten times the floor's estimated monthly volume (9.1), and more again because only players who tick the box would receive it. (c) rests on the least settled legal answers: whether product email to a free account is prospection (L-14) and whether under-15s need a parent's consent ([L-08](../legal-questions.md#l-08-minors-the-stated-minimum-age-and-adult-only-features)). (b) is the clearest service-message case and works without email. (c) is re-engagement by design and would retract two published promises.
7.4 **What (a) gives up:** week one gets no nudge. I-39's guest claim, first-build checklist and the signed-out fork (2.2) carry week-one value instead.
7.5 **Revisit** when I-39 reports eight weeks of week-1 retention and the sample in 7.3 is reachable within four weeks; (c) then runs as an I-39 experiment, not a default.

### 8. Publishing calendar

8.1 `docs/product/publishing-calendar.md` lists each dated event with its source and read date, its outputs, the slice that builds each output, a due offset and a named owner (the owner or a named reviewer). It is reviewed after each Wizards release announcement. Once [I-73](i73-every-set-release-ready-on-day-one.md) slices 3 and 5 exist, set dates and milestones are read from its release calendar instead of being typed here (wording aligned 2026-11-10: I-73 owns the release calendar, this calendar owns which content ships when).
8.2 **Per set release R:** I-17's precon catalogue entries from official decklists by R (through I-67 slice 13); I-18's corpus for the set at R; the precon pages indexable only if I-34's policy allows that page kind; a check at R+28 of which I-68 guides cite cards the set reprints.
8.3 **Per Commander announcement A:** I-48's `/rules/changes/<date>` page within two days and owner notices the same day; I-68 and I-28 freshness banners at A (I-68 10.1); a dated addendum to any I-34 report the change touches within seven days ([I-34 2.5](i34-commander-data-reports.md#2-dated-reports)).
8.4 **First edition rows:** 2026-11-13 Star Trek; the expected Commander announcement before 2026-12-31; 2026-12-01 the I-60 recap job (D-05); the six 2027 releases of the table above; one "Commander Opening Hands" edition a year, away from late November, when EDHREC publishes its year-end report (I-34's open question).
8.5 **Measured, once I-34 slice 8 exists:** Search Console impressions and clicks per page kind 28 days after each output, beside the output's date. No numeric target before a baseline ([I-34 8.1](i34-commander-data-reports.md#8-measurement)).
8.6 A guide's order stays I-68's demand register ([I-68 8](i68-archetype-guides.md#8-publishing-order-by-measured-demand)); the calendar only dates refreshes and catalogue work.

### 9. What it takes: targets (estimates)

9.1 **Computed** from I-66 9.1's payers and I-30's assumption A7 (3% of 30-day active accounts pay). Sign-ups a month hold the active base steady: active × c ÷ a, where a is activation within 7 days (assumed 30%, I-39's example baseline) and c the monthly share of active accounts that stop (assumed 10%; 5% and 20% in brackets). Every input is an assumption until I-39 measures it.

| Goal (I-66)                    | Payers | Active accounts | Sign-ups a month at c = 10% (5%–20%) |
| ------------------------------ | -----: | --------------: | -----------------------------------: |
| Floor, monthly plan            |     22 |             733 |                        244 (122–489) |
| Floor, yearly plan             |     33 |           1,100 |                        367 (183–733) |
| Living, monthly plan           |  1,230 |          41,000 |                13,667 (6,833–27,333) |
| Living, yearly plan            |  1,870 |          62,333 |               20,778 (10,389–41,556) |
| Living, monthly, 5% conversion |  1,230 |          24,600 |                 8,200 (4,100–16,400) |

9.2 **Reading.** The floor needs a few hundred sign-ups a month, which one creator video or a Discord community could supply. A living needs thousands every month: at 1,000 sign-ups a month, a = 30% and c = 10%, the base settles at 3,000 active accounts and 90 payers (computed). Activation and conversion alone cannot close that gap; the loops of group 2 must bring volume.
9.3 The owner view recomputes 9.1 monthly from measured a, c and conversion, beside the assumptions. Targets are shown to the owner only.

### 10. Free and paid

10.1 Free: every loop, page, link, notice and the creator kit. Nothing here gates content ([I-30 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
10.2 Paid-tier relevant: the referral credit (group 4) and the creator seat (5.2) hand out paid months, so they wait for I-30 slice 9 and L-16. The pod pass (I-30) is the paid side of the pod loop. The watches behind group 6 are I-18's, I-48's and I-59's paid candidates above a free allowance; I-72 adds none.
10.3 Why free rivals skip this: Archidekt pays for creator reach with sponsorship and earns affiliate income [1][2], CardCastle credits a sign-up without a payment [5], and none found ties a reward to a real payment or labels it for the referrer.

## Data model / API

```
User            + signupEntry (enum, 2.1) ?, signupVia (embed|discord|recap) ?, adultDeclaredAt ? (moved from I-44 TradeArea),
                  referredByCodeId ?
ReferralCode    id, userId (cascade), code @unique (random, 10 chars), createdAt, revokedAt?
ReferralCredit  id, codeId, referredUserId @unique, status (pending|credited|void), paymentEventId (I-30 BillingEvent),
                eligibleAt, creditedAt?, voidReason?   @@index([codeId, creditedAt])
CreatorLink     userId, url, verifiedAt?, verifiedById? (operator), method (manual)   -- extends I-36 User.links
CreatorGrant    id, userId, kind (earlyAccess|complimentarySeat), criterionVersion, grantedById, grantedAt, endsAt
                -- each grant writes an I-30 Entitlement with endsAt
PlayerReminder  id, userId (cascade), deckId (cascade), dueAt, channel (inApp|inAppAndEmail), sentAt?   -- slice 10 only
```

Routes: `GET /join/{code}` answers 302 to `/auth/signup?entry=referral&code=…` and sets no cookie. `POST /api/auth/signup` gains optional `entry`, `via`, `code` and a return path. `GET`, `POST` and `DELETE /api/me/referral` (own code and own counts). Credits are applied by I-30's webhook handler through one `applyReferralCredit(event, tx)` function. Creator grants live in I-69's console under `requireOperator`. The calendar is a committed Markdown table, not a table in the database.

## Non-goals

- Cash, gift cards, affiliate splits, revenue shares or tips to players or creators; paid placement or featuring.
- Leaderboards, referral tiers, public referral or follower counts that rank anything, streaks, badges for activity.
- Inviting by email, contact import, SMS, or any message the product sends to someone who did not ask.
- Re-engagement or marketing email, unless the owner picks option (c) in D-78 and runs it as an I-39 experiment.
- Third-party attribution, pixels, fingerprinting or cookies for referrals.
- A content team or a paid SEO programme; generated pages (I-34 4.7) and pages per set or per precon outside I-34's index policy.
- Contests, which stay with I-53.

## Testing strategy

- **Entry (sociable):** a signed-out fork on a public deck goes through credentials and Google sign-up and ends in the builder on a fork with `signupEntry = deck_page`; an unknown entry stores `other`; an absolute or `//host` return path falls back to `/decks`; opt-out nulls both fields.
- **Clean links (solitary):** the deck page's share action and the copy-link button produce the canonical URL with no query string; only the embed back-link, Discord replies and recap links carry `via`, and no generated URL contains a user id, username or code except the referral link.
- **Referral (sociable, PostgreSQL and a mock provider):** a credit stays pending through the withdrawal window and becomes credited once; a refund inside the window voids it; a duplicate webhook credits once; the seventh credit in 12 months is refused with a reason; a self code, an account with a past subscription and an account without the adult declaration are refused; `/join` sets no cookie; no public route returns referral counts.
- **Creator grants:** discovery, community, search and sitemap outputs are byte-identical with and without a grant or a verified link; the disclosure renders on the creator page in English and French; an expired grant removes the entitlement and keeps the user's data.
- **Return loop:** a dependency test fails if a notification producer imports `UserActivityDay`, session tables or a last-seen field; the catalogue contract (I-63 12.2) holds for every returning category with email off by default.
- **Targets:** `whatItTakes` reproduces the table of 9.1 from I-66's payers, and a denominator under 30 renders as a count.
- **Calendar:** a docs check fails when a row lacks a source URL, read date, output slice or owner, and lists rows due within 30 days.

## Delivery slices

| #   | Slice                                                                                                                                  | Depends on                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 0   | Decisions recorded: D-78's option, the creator-programme decision, referral terms (months, cap, eligibility); L-43 (e) to (h) added    | — (owner and counsel; no code)                                                |
| 1   | Signed-out fork and "Build your own" on public deck and share pages, through sign-up and back, for credentials and Google              | I-39 slice 2                                                                  |
| 2   | `signupEntry` and `signupVia` written at account creation; `via` on the product's own links; `share_action` event                      | 1; I-39 slice 10                                                              |
| 3   | Loop view in I-39's owner page: sign-ups, activation and time to first full-size deck by entry, with n and intervals                   | 2; I-39 slice 12                                                              |
| 4   | Share-to-signup rate per 1,000 public deck and embed views                                                                             | 3; I-36 slice 12                                                              |
| 5   | `whatItTakes` pure function reproducing 9.1, with fixture tests                                                                        | —                                                                             |
| 6   | "What it takes" panel with measured activation, churn and conversion beside the assumptions                                            | 3, 5; I-30 slice 10                                                           |
| 7   | Publishing calendar, first edition, in `docs/product/publishing-calendar.md`                                                           | —                                                                             |
| 8   | Calendar check in the docs CI: missing fields fail, rows due within 30 days are listed                                                 | 7                                                                             |
| 9   | Return-loop guard: no producer reads activity or session data; returning categories off by email in I-63's catalogue                   | I-63 slice 1                                                                  |
| 10  | Player-set reminder on a deck, in the app, with email only if ticked                                                                   | 9; I-63 slices 2 and 3; **Blocked** on D-78 and D-50                          |
| 11  | Referral code, `/join/{code}`, code field at sign-up and checkout, referral page with labelling text in English and French             | 0, 2; I-30 slice 9; I-44 slice 12; I-61 slices 10 and 11; **Blocked** on L-43 |
| 12  | Referral credit ledger applied from provider webhooks after the withdrawal window, void on refund, yearly cap                          | 11; I-30 slices 7 and 8                                                       |
| 13  | Creator kit page in English and French (I-36's roadmap item)                                                                           | I-36 slices 2 and 3                                                           |
| 14  | Verified links on the creator page, set by an operator                                                                                 | I-36 slice 10; I-69 slice 1                                                   |
| 15  | Creator grants: early access and the capped complimentary seat as entitlements with end dates, profile disclosure, ordering guard test | 0, 14; I-30 slices 4 and 9; **Blocked** on L-43                               |
| 16  | Pod invite entry: an invite link opens the pod's comparison for a signed-out visitor who pastes a list                                 | 2; I-15 slices 3 and 4; **Blocked** on D-40                                   |

Slices 5 and 7 can start today, and slice 1 follows I-39 slice 2. Slice 1 is the cheapest growth fix: every shared deck becomes a path into an account. Scheduled agents must not pick slices 10, 11, 15 or 16 before slice 0 and the named decisions are committed. Paid-tier relevant: slices 11, 12 and 15, which hand out months of the paid plan; slice 6 reads I-30's conversion. No slice gates a feature behind payment.

## Open questions

1. **For the lawyer (research, not legal advice; additions to [L-43](../legal-questions.md#l-43-referral-and-creator-rewards)).** (e) Is an ordinary player who posts a referral link to a small group "mobilising notoriety with an audience" under art. 1 of loi 2023-451, and is "I get a free month if you subscribe" a sufficient explicit mention under art. 5-2 [11]? (f) Must the referral's conditions be presented as a promotional offer, and where? (g) Does a complimentary seat that requires no post still make a creator's later mention a commercial communication, and does the profile disclosure of 5.3 help? (h) Is a referral page reachable by a minor a "direct exhortation" under UCPD Annex I point 28 [12] when it is hidden from accounts without the adult declaration?
2. **The creator decision ([D-80](../owner-decisions.md#product-scope-and-non-goals)).** Options (a), (b) or (c) of 5.6, and the seat cap and criterion if (c).
3. **Referral terms.** One month each, and six a year? Does the chosen merchant of record support extending a period or a credit balance, and does it expose a payment-method fingerprint to stop self-referral without our storing card data?
4. **D-78.** Option (a), (b) or (c); this spec recommends (a) now and (b) after D-50.
5. **Churn of active accounts** has no source; the targets of 9.1 move by a factor of four between 5% and 20%. I-39's retention view replaces the assumption; until then, which value should the owner plan on?
6. **Precon pages.** Should I-34's index policy list I-17's precon pages as a page kind, given that release-week content (for example EDHREC's precon review [4]) links decklists to a deckbuilder?

## Sources

1. Archidekt, [FAQ](https://archidekt.com/faq), read 2026-11-10: the $2 Patreon tier, ad removal, affiliate parameters on price links.
2. EDHREC, ["The Command Zone – Rachel's Personal Commander Decks | The Command Zone 535"](https://edhrec.com/articles/the-command-zone-rachels-personal-commander-decks-the-command-zone-535-commander-deckbuilding-mtg-edh), 2023-06-06: Archidekt sponsor read.
3. EDHREC, [Write for EDHREC](https://edhrec.com/apply), read 2026-11-10.
4. Kurohitsuki, [Federation Fleet precon guide](https://edhrec.com/guides/federation-fleet-star-trek-precon-guide), EDHREC, 2026-11-02.
5. Travis Kesterson, [Referral Program](https://support.cardcastle.co/articles/2014406-referral-program), CardCastle help centre, 2023-08-09.
6. CardCastle, [home page](https://cardcastle.co/), read 2026-11-10: a Magic collection, scanning, pricing and deckbuilding service with Squire, Knight and Merchant plans.
7. Wizards Play Network, [Star Trek dates and details](https://wpn.wizards.com/news/star-trek-dates-and-details), 2026-10-28.
8. Wizards Play Network, [Magic: The Gathering | Star Trek product page](https://wpn.wizards.com/en/products/star-trek), read 2026-11-10.
9. Nick Miller, [Magic: The Gathering Set Release Schedule For 2027](https://articles.starcitygames.com/magic-the-gathering/magic-the-gathering-set-release-schedule-for-2027/), Star City Games, 2026-10-09.
10. Jules Chin Greene, [report on the 2027 sets and Commander decks announced at MagicCon: Amsterdam](https://www.thepopverse.com/gaming-magic-the-gathering-2027-sets-commander-decks-magiccon-amsterdam), Popverse, 2026-07-18.
11. Légifrance, [Loi n° 2023-451 du 9 juin 2023](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000047663185), consolidated version in force on 2026-11-10: art. 1 as amended by ordonnance 2024-978, art. 5-2, art. 8.
12. Directive 2005/29/EC, [Annex I](https://www.legislation.gov.uk/eudr/2005/29/annex/I/adopted), point 28, legislation.gov.uk copy of the text as adopted; read through a search summary on 2026-11-10 because EUR-Lex returned no content to the fetcher.
13. [Moxfield on Patreon](https://www.patreon.com/moxfield) and [EDHREC on Patreon](https://www.patreon.com/edhrec/about), both HTTP 403 on 2026-11-10.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

### Goals

- A signed-out visitor forks a public deck, signs up with Google and lands in the builder on the fork; the owner sees that sign-up under its entry, with n and an interval; no link a player copies carries a parameter; and no notice reaches a player because they went quiet.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-72-01

As a player who found a deck while signed out, I want to fork it and land back on my copy, so that sign-up is not a dead end.

#### US-72-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-72-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-72-01 Happy path

Given a signed-in player and the English locale
When a signed-out fork goes through sign-up and returns to the new deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-72-02 Happy path

Given a signed-in player and the English locale
When the entry point is recorded without a campaign that ranks people.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-72-03 Happy path

Given a signed-in player and the English locale
When a referral, if one exists later, is plan time, not cash.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-72-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-72-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-72-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: The signed-out fork is on when I-39's guest handoff is on. Referral credit stays Later, behind the lawyer.

#### AC-72-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-72-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-72-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The fork button on a public deck is enabled for a visitor and explains that an account is required. No countdown and no streak.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A field on the account for the entry. Events go through I-39. Rewards, later, are ledger rows, not a balance of money.

### Analytics and telemetry

`signup_entry {via: fork, direct or other}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

The signed-out fork is on when I-39's guest handoff is on. Referral credit stays Later, behind the lawyer.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A getting-started email stays off unless D-78 changes. Creator seats stay behind D-80.

### Sources

- https://support.cardcastle.co/articles/2014406-referral-program

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-72-101

As a player, I want the product to slice 0, no code: the answer to D-78 (this initiative recommends none now, and a reminder the player sets once D-50 is answered), the creator programme (D-80), the referral terms (one month each, at most six credited months a year, proposed), and L-43 (e) to (h) for counsel., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slice 0, no code: the answer to D-78 (this initiative recommends none now, and a reminder the player sets once D-50 is answered), the creator programme (D-80), the referral terms (one month each, at most six credited months a year, proposed), and L-43 (e) to (h) for counsel.

#### AC-72-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-72-102

As a player, I want the product to a signed-out fork and "Build your own" on public deck and share pages, through credentials and Google sign-up and back to the builder on the fork (slice 1); User.signupEntry and User.signupVia written once from allowlisted enums, via only on the product's own links (embed, Discord, recap), and a share_action event in I-39's allowlist (slice 2); a loop view in I-39's owner page with n and intervals (slice 3)., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-103 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A signed-out fork and "Build your own" on public deck and share pages, through credentials and Google sign-up and back to the builder on the fork (slice 1); User.signupEntry and User.signupVia written once from allowlisted enums, via only on the product's own links (embed, Discord, recap), and a share_action event in I-39's allowlist (slice 2); a loop view in I-39's owner page with n and intervals (slice 3).

#### AC-72-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-105 Edge

Given the same inputs as a previous run
When the player runs it again
Then the reported figures match the first run

#### US-72-103

As a player, I want the product to whatItTakes, a pure function that turns I-66's payers into the sign-ups a month each goal needs, with fixture tests (slice 5)., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then whatItTakes, a pure function that turns I-66's payers into the sign-ups a month each goal needs, with fixture tests (slice 5). On the spec's assumptions the floor needs about 244 a month and a living thousands (computed).

#### AC-72-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-72-104

As a player, I want the product to the publishing calendar, which says which content ships when: docs/product/publishing-calendar.md, each row with its source, read date, output slice and named owner, reading set dates and milestones from I-73's release calendar once it exists (slice 7), and a docs check that fails on a missing field and lists rows due within 30 days (slice 8)., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The publishing calendar, which says which content ships when: docs/product/publishing-calendar.md, each row with its source, read date, output slice and named owner, reading set dates and milestones from I-73's release calendar once it exists (slice 7), and a docs check that fails on a missing field and lists rows due within 30 days (slice 8). Moved 2026-11-10 from I-34's "publishing calendar" item.

#### AC-72-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-72-105

As a player, I want the product to returning players: only events the player set up bring them back (a rules change on a deck they own, a price rule on their wanted list, a radar watch they turned on), through I-63's categories, with a guard test that no producer reads activity or session data (slice 9)., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Returning players: only events the player set up bring them back (a rules change on a deck they own, a price rule on their wanted list, a radar watch they turned on), through I-63's categories, with a guard test that no producer reads activity or session data (slice 9).

#### AC-72-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-114 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-72-106

As a player, I want the product to later: a share-to-signup rate per 1,000 public deck and embed views (slice 4) and the "what it takes" panel with measured rates (slice 6); a reminder the player sets on one deck, blocked on D-78 and D-50 (slice 10); the referral code, /join/{code} with no cookie and the labelling text in English and French (slice 11), and the credit ledger, applied after the 14-day withdrawal window, void on refund and capped at six months a year (slice 12), both moved from I-30; the creator kit (slice 13), moved from I-36, and operator-verified links (slice 14); early access and a capped complimentary seat for creators, if D-80 allows (slice 15); a pod invite that opens the pod's comparison signed out, after D-40 (slice 16)., so that every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

#### AC-72-115 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Later: a share-to-signup rate per 1,000 public deck and embed views (slice 4) and the "what it takes" panel with measured rates (slice 6); a reminder the player sets on one deck, blocked on D-78 and D-50 (slice 10); the referral code, /join/{code} with no cookie and the labelling text in English and French (slice 11), and the credit ledger, applied after the 14-day withdrawal window, void on refund and capped at six months a year (slice 12), both moved from I-30; the creator kit (slice 13), moved from I-36, and operator-verified links (slice 14); early access and a capped complimentary seat for creators, if D-80 allows (slice 15); a pod invite that opens the pod's comparison signed out, after D-40 (slice 16).

#### AC-72-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-72-117 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

### UX states for this feature

The player-visible outcome is: every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

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

## I-72: Growth Loops That Respect Players: Referrals, Creators And Coming Back

**Spec:** [`specs/i72-growth-loops-referrals-creators-and-return.md`](i72-growth-loops-referrals-creators-and-return.md)

**Outcome:** every way a Commander player arrives, from a shared deck or a creator's decklist to a pod invite or a referral link, leads into an account without losing the page; the owner sees sign-ups, activation and time to the first full-size deck by entry; rewards are months of the plan, never cash; and nothing brings a player back that the player did not set up.

**Status:** Next
**Priority:** Next for slices 1, 5, 7, 8 and 9, which need no decision, and for slices 2 and 3 once I-39's event store lands (its slice 10, behind its legal slice 0); Later for slices 4, 6 and 10 to 16, which wait for view counts, the paid tier, I-36's later slices, counsel or the owner. Nothing in it is sold: the referral credit and the creator seat hand out months of the paid plan, so they exist only if I-30 sells one
**Impact / effort:** High / medium
**Depends on:** nothing for slices 5 and 7; I-39 slice 2 for the signed-out fork (slice 1); I-39 slice 10 for the entry fields and `share_action` (slice 2); I-39 slice 12 for the loop view (slice 3); I-36 slice 12's view counts for the share-to-signup rate (slice 4); I-30 slice 10 for the "what it takes" panel (slice 6); I-63 slice 1 for the return-loop guard (slice 9); I-63 slices 2 and 3, D-78 and D-50 for a reminder the player sets (slice 10); I-30 slice 9, I-44 slice 12, I-61 slices 10 and 11 and L-43 for the referral code (slice 11), and I-30 slices 7 and 8 for its ledger (slice 12); I-36 slices 2 and 3 for the creator kit (slice 13); I-36 slice 10 and I-69 slice 1 for verified links (slice 14); I-30 slices 4 and 9, D-80 and L-43 for creator grants (slice 15); I-15 slices 3 and 4 and D-40 for the pod invite (slice 16).

The product has to pay, and nothing yet counts where an account comes from. [I-66](i66-running-costs-and-margin.md) finds that 22 monthly or 33 yearly payers cover the fixed costs and about 1,230 to 1,870 make a living; at I-30's assumed 3% conversion that is 733 to 62,000 active accounts. A visitor who opens a shared deck cannot fork it: `PublicDeckActions.tsx` disables "Fork" when signed out (line 115), and `SignUpForm.tsx` sends both sign-up routes to `/decks` (lines 43 and 59), checked on `origin/dev` at `fee835d8`. The reference sites grew through creators and gatekeepers: Archidekt sponsors creators and earns affiliate income, EDHREC recruits writers with no pay mentioned, and CardCastle gives both sides "$9 in credits" for a sign-up that pays nothing ([help centre, 2023-08-09](https://support.cardcastle.co/articles/2014406-referral-program)). None found ties a reward to a real payment or labels it for the referrer. One rule holds the initiative together: a loop is something a player chooses to do. Nothing fires because a player went quiet, nothing ranks people by spend, referrals or audience, and the product never writes to a third party.

### Scope

- [ ] Slice 0, no code: the answer to [D-78](../owner-decisions.md#product-scope-and-non-goals) (this initiative recommends none now, and a reminder the player sets once D-50 is answered), the creator programme ([D-80](../owner-decisions.md#product-scope-and-non-goals)), the referral terms (one month each, at most six credited months a year, proposed), and L-43 (e) to (h) for counsel.
- [ ] A signed-out fork and "Build your own" on public deck and share pages, through credentials and Google sign-up and back to the builder on the fork (slice 1); `User.signupEntry` and `User.signupVia` written once from allowlisted enums, `via` only on the product's own links (embed, Discord, recap), and a `share_action` event in I-39's allowlist (slice 2); a loop view in I-39's owner page with n and intervals (slice 3).
- [ ] `whatItTakes`, a pure function that turns I-66's payers into the sign-ups a month each goal needs, with fixture tests (slice 5). On the spec's assumptions the floor needs about 244 a month and a living thousands (computed).
- [ ] The publishing calendar, which says which content ships when: `docs/product/publishing-calendar.md`, each row with its source, read date, output slice and named owner, reading set dates and milestones from [I-73](i73-every-set-release-ready-on-day-one.md)'s release calendar once it exists (slice 7), and a docs check that fails on a missing field and lists rows due within 30 days (slice 8). Moved 2026-11-10 from I-34's "publishing calendar" item.
- [ ] Returning players: only events the player set up bring them back (a rules change on a deck they own, a price rule on their wanted list, a radar watch they turned on), through I-63's categories, with a guard test that no producer reads activity or session data (slice 9).
- [ ] Later: a share-to-signup rate per 1,000 public deck and embed views (slice 4) and the "what it takes" panel with measured rates (slice 6); a reminder the player sets on one deck, blocked on D-78 and D-50 (slice 10); the referral code, `/join/{code}` with no cookie and the labelling text in English and French (slice 11), and the credit ledger, applied after the 14-day withdrawal window, void on refund and capped at six months a year (slice 12), both moved from I-30; the creator kit (slice 13), moved from I-36, and operator-verified links (slice 14); early access and a capped complimentary seat for creators, if D-80 allows (slice 15); a pod invite that opens the pod's comparison signed out, after D-40 (slice 16).

### Engineering enablers

- A signed-out fork ends in the builder on the fork with `signupEntry = deck_page`; an unknown entry stores `other`; an absolute or `//host` return path falls back to `/decks`.
- The share action and the copy button produce the canonical URL with no query string, and no generated URL carries a user id, username or code except the referral link.
- Discovery, community, search and sitemap outputs are byte-identical with and without a creator grant or a verified link.
- A dependency test fails if a notification producer imports `UserActivityDay`, session tables or a last-seen field.

**Paid-tier angle:** nothing is sold. Every loop, page, link, notice and the creator kit stay free, and no loop gates a deck, guide or report. The referral credit and the creator seat hand out months of the paid plan, so they wait for I-30 slice 9 and L-16. A credited referral forgoes at most two months of contribution, about €4.14 on the monthly plan, and 25 creator seats would cost €2.50 to €13.75 a month (estimates in the spec).

### Enrichment (2026-11-11)

**User story.** As a player who found a deck while signed out, I want to fork it and land back on my copy, so that sign-up is not a dead end.

**Acceptance.**
- A signed-out fork goes through sign-up and returns to the new deck.
- The entry point is recorded without a campaign that ranks people.
- A referral, if one exists later, is plan time, not cash.

**UX.** The fork button on a public deck is enabled for a visitor and explains that an account is required. No countdown and no streak.

**Data and API.** A field on the account for the entry. Events go through I-39. Rewards, later, are ledger rows, not a balance of money.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `signup_entry {via: fork, direct or other}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** The signed-out fork is on when I-39's guest handoff is on. Referral credit stays Later, behind the lawyer.

**Open questions.** A getting-started email stays off unless D-78 changes. Creator seats stay behind D-80.

### Definition of done

A signed-out visitor forks a public deck, signs up with Google and lands in the builder on the fork; the owner sees that sign-up under its entry, with n and an interval; no link a player copies carries a parameter; and no notice reaches a player because they went quiet.

---

