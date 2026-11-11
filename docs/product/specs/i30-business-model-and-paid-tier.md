# I-30: Business Model And The Paid Tier

> **Status:** Proposed · **Priority:** Next, behind a decision gate: slice 0 (legal answers and the owner's pricing decision) comes before any billing code · **Written 2026-11-09**
> **Research:** dated notes on monetization, AI product economics and player demand, plus the I-29 legal research. The notes are not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** the line between free and paid, plans and prices, entitlements, AI usage metering and monthly quotas, the billing provider, the subscription lifecycle (checkout, renewal, cancellation, withdrawal, refunds, invoices) and the business metrics. **Does not own:** the paid features themselves — Deck Lab ([I-31](i31-deck-lab.md)), the copilot ([I-02](i02-checkable-ai-copilot.md)), price alerts and carts ([I-32](i32-seller-handoff-and-affiliate-carts.md)), the game log ([I-35](i35-pod-game-log.md)), collection tools ([I-06](i06-collection-and-purchase-planning.md), [I-16](i16-decks-buildable-from-a-collection.md)), the deck radar ([I-18](i18-per-deck-radar-of-new-cards.md)); affiliate links (I-32); the marketplace decision ([I-33](i33-marketplace-ladder.md)); free data reports ([I-34](i34-commander-data-reports.md)); the choice of an analytics product ([I-05](i05-production-safety.md)).

## Overview

The owner's goal (2026-11-09, translated): turn MagicAIBuilder into "a SaaS, even a very cheap one, that lets me live decently", because "the competition is almost free; you can pay premium for a few extra features but it's nothing crazy."

The research gives that goal a shape. The free reference sites sell ad removal and small perks for about 2 USD a month, which is a donation, not a product [3][4][6]. Real subscriptions, at 3–8 USD a month or 30–50 USD a year, sell usage and personal tools: AI quotas, price tooling, personal history, collection-aware building and early access [7]–[17]. None of them charges for card data, and two texts forbid it: the Wizards Fan Content Policy [1] and Scryfall's API terms [2].

The principle is therefore **content free, tools paid**. Everything a player reads, builds or shares stays free. What can be paid is usage above a free allowance, where each use costs money, and personal tools that compute over the player's own data or watch it over time.

Two parts ship whatever the legal answer: per-user AI metering with a monthly quota, which today's code lacks (a production-safety gap), and an entitlement layer with a single free plan. Billing waits for the lawyer. The calculation in requirement 8 is the honest part: on stated assumptions, a living wage needs about 1,200–1,800 paying subscribers and 30,000–60,000 active accounts, about 5,000 if the free AI allowance is generous, and never if it is generous and the model stays on today's price.

## What the market does

All pages were read on 2026-11-09 unless another date is given. Prices are in each page's currency.

| Product                                                   | Price                                                                                         | What the paid tier gates                                                                                                                                                                        | Source       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Archidekt, EDHREC, Draftsim                               | Patreon 2 USD (EDHREC also 5 USD)                                                             | Ad removal; EDHREC 5 USD adds art choice, "Load More" and experimental access                                                                                                                   | [3][4][5][6] |
| Moxfield                                                  | Patreon from 1 USD (2026-11-08)                                                               | Benefits not verifiable (403); Patreon members got early access to the editor redesign (Sep 2026)                                                                                               | [21][23]     |
| Untapped.gg (Arena)                                       | 7.99 USD/month                                                                                | Personal statistics, history "Up to Two Years" vs "Last Two Sets", deck versions, early access, no ads                                                                                          | [7]          |
| DeckCheck                                                 | 4 / 8 / 16 USD a month, billed yearly (48 / 96 / 192 USD)                                     | 150 / 300 / 600 AI credits a month; every account gets 5 free credits a day; "Deckhand reports" watch your decks for new cards; 5 USD for 100 credits that never expire                         | [8][9]       |
| Farseek                                                   | From 9.99 USD/month, 7.99 billed quarterly; top-ups from 1.99 USD                             | AI chat above a free weekly allowance; storage, search, commander finder, precons and bracket calculator are "free and unmetered"; chat runs on Claude Sonnet 5.5                               | [10]         |
| ManaTap                                                   | £3.99/month or £29.99/year                                                                    | AI chat 10 vs 500 a day, deck checks 3 vs 200 a day, saved decks 15 vs unlimited, "support a solo developer!" **Conflict:** the landscape (2026-11-08) recorded about 12.99 USD a month         | [11]         |
| ManaForge                                                 | From 9.99 EUR/month                                                                           | AI analysis and collection-aware upgrades                                                                                                                                                       | [12]         |
| TopDecked                                                 | 2.99 / 4.99 / 8.49 USD a month or 29.99 / 49.99 / 84.99 a year                                | Decks (3 to unlimited), tracked cards (375 to 6,000), "Pricing Professional" price trends                                                                                                       | [13][14]     |
| Deckbox                                                   | 3.99 EUR/month billed yearly, 5.99 monthly                                                    | "Your collection stays free"; paid: build decks from your inventory, full collection history, unlimited scans and tags                                                                          | [15]         |
| ManaBox                                                   | 2.49 USD/month or 22.99/year, app stores only                                                 | New binders and Pro features; on expiry "no data will be deleted"                                                                                                                               | [16][17]     |
| MTGGoldfish                                               | 5.99 USD/month or 59.88/year                                                                  | Unlimited price alerts (free users get a few), price history downloads, SuperBrew (search summary; page 403)                                                                                    | [19]         |
| Game trackers: Playgroup, Rhystic, Lifetap, Pod Companion | Playgroup supporter tiers 4 / 5 / 15 a month; Rhystic premium; Lifetap and Pod Companion free | Playgroup: no ads, themes, unlimited leagues, "supporter revenue is what keeps Playgroup free"; Rhystic: stats and history (search summaries); Lifetap: free game history and win rates by deck | [20][47][48] |

**What players say.** No conversion rate, churn figure or subscriber count was found for any MTG tool. The signals are qualitative:

- Paying for price information and early access: "I paid for the subscription … having the market prices of certain cards … Now I can really optimize what cards are needed before I actually spend the money" (TopDecked review, 2023-12-14) [13]; Moxfield gave Patreon members the editor redesign first (Sep 2026) [23].
- Ads drive players away: Moxfield mobile ads "blocking vital buttons" (Aug 2026), with ad blockers and Patreon "no ads" as the workarounds [24].
- **Capacity paywalls are resented.** Of the 82 ManaBox App Store reviews at three stars or less among the latest 250, 9 mention the paywall or subscription; reviewers wrote "you can't have more than 5 binders without paying us forever" (Feb 2025) and "monthly paywall to add more decks. I'm switching over to mythic tools" (Jul 2026) [18].
- **Undisclosed AI is punished.** "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time." reached 729 points on r/EDH (2025-12-31) [25]; all 14 r/EDH posts with "ChatGPT" in the title since January 2025 sit at 0 points [26]. A quieter group pays DeckCheck, Farseek and ManaTap [8][10][11].
- Scale anchors: Moxfield's Patreon showed about 3,175–3,270 paid members in an undated snippet [21], and in 2022 Moxfield had "two employees, both of which have other full-time jobs" [22].

**Constraints.** The Fan Content Policy (last updated 2017-11-15): "You can't require payments, surveys, downloads, subscriptions, or email registration to access your Fan Content", and "You can't sell or license your Fan Content". It allows "sponsorships, ad revenue, and donations" and does not mention tools, premium features, early access or affiliate links [1]. Scryfall: "You may not 'paywall' access to Scryfall data … end-users should be able to access card data anonymously or with free accounts" [2]. Paid apps such as ManaBox and TopDecked state they are not affiliated with Wizards and do not invoke the policy [13][16]. No Wizards statement on paid tool tiers was found.

**Billing for a solo founder in France.**

| Option                                       | Fee                                                                                      | Who files VAT                                                                                                                                               | Source           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Paddle or Lemon Squeezy (merchant of record) | 5% + 50¢ per transaction                                                                 | The provider is the seller and handles tax, chargebacks and buyer support                                                                                   | [30][31]         |
| Stripe + Stripe Tax                          | Card processing 1.5% + €0.25 for standard EEA cards, plus 0.5% "where you're registered" | The founder registers and files the EU One-Stop Shop return every quarter, a nil return included; a €10,000 EU threshold applies to cross-border e-services | [32][33][35][36] |
| Stripe Managed Payments                      | Reported 3.5% on top of Stripe fees; GA status disputed (Feb 2026)                       | Stripe as merchant of record (vendor-biased secondary sources)                                                                                              | [34]             |

**Consumer rules for an online subscription in France** (research, not legal advice):

- 14 days to withdraw from a distance contract (Code de la consommation L221-18) [38]; for services the period runs from the day the contract is agreed [37]. Since 2026-06-19, a contract concluded through an online interface must offer "une fonctionnalité" to withdraw free of charge (L221-21, as amended by ordonnance 2026-2 of 5 January 2026) [39].
- No withdrawal for digital content not on a tangible medium once performance has begun, only if the consumer gave prior express consent, acknowledged losing the right, and the trader confirmed that agreement (L221-28 13°, in force since 2022-05-28) [40][37].
- Fixed-term service contracts with tacit renewal: written notice "au plus tôt trois mois et au plus tard un mois" before the deadline to refuse renewal; without it, the consumer may terminate free at any time from the renewal date, and payments after the last renewal are refunded within 30 days minus the service provided (L215-1, in force since 2022-08-18) [41].
- A contract concluded online must be terminable online through a free, "facile, direct et permanent" function (L215-1-1; its content is fixed by D215-2, in force since 2023-06-01) [42][43].
- France's electronic invoicing reform is "effective depuis le 1er septembre 2026"; the obligations of the owner's legal structure need an accountant [44].

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `49983a9`).

- **No billing.** A case-insensitive grep of `src/` and `prisma/schema.prisma` for stripe, paddle, lemon squeezy, subscription, entitlement, premium, patreon, billing, checkout and paywall finds two unrelated comments: "subscriptions" in the event-listener sense in `src/hooks/useKeyboardShortcuts.ts`, and "Premium mana curve bar chart" in `src/components/deck/ManaCurve.tsx`. The only "plan" in the schema is `AcquisitionIntent`, "a private, reversible plan for how a missing printing will be acquired". `User` has no plan field. `package.json` has no payment or email SDK.
- **Two routes call a model.** `src/app/api/ai/build/route.ts` sends `claude-haiku-4-5` with `max_tokens: 4096`, falls back to OpenAI `gpt-4o-mini`, and returns a placeholder deck when no key is set. `src/app/api/ai/suggest/route.ts` sends `claude-haiku-4-5` with `max_tokens: 2048`. Both use raw `fetch`, require a session through `requireAuth()`, and never read the response's `usage`.
- **Per-minute limits only.** Build allows 5 calls and suggest 10 calls per 60 seconds per user, through `checkRateLimit` in `src/lib/rate-limit.ts`. That store is an in-process `Map`, "per-instance (not distributed)" by its own comment, and the documented production deployment is Vercel with Supabase ([infrastructure](../../engineering/infrastructure.md)). Nothing counts usage per month. **Estimate** from the research: 5 builds a minute for 30 days is 216,000 builds, about 1,776 USD on Haiku 4.5, for one account. A precedent to reuse: `src/lib/api/authenticate.ts` keys its limit on the API key because "the quota belongs to the credential".
- **Wasted calls.** Suggest parses the reply with `JSON.parse` and never checks `stop_reason`; its default task is estimated at about 2,200 output tokens against the 2,048 cap (**estimate**). Build strips code fences but does not check `stop_reason` either. `validateGeneratedDeck` (`src/lib/ai/generated-deck-validation.ts`) rejects a whole build on any structural issue, so the user pays a retry.
- **Accounts.** NextAuth with Google and credentials providers (`src/lib/auth/config.ts`). `DELETE /api/user/profile` deletes the user and cascades; with a subscription it would orphan the provider's record.
- **No ads, no affiliate links, no product analytics.** None of these appears in `src/` or `package.json`; I-05 parks the choice of an analytics tool. Conversion cannot be measured today. The footer notice (`footer.notAffiliated` in `src/messages/en/common.json`) cites Wizards' "Fan Site Policy", not the Fan Content Policy (also noted by I-29).

## Functional requirements

### 1. The free and paid line

1.1 **Always free, without an account where the content is public:** card data and images, card search, deck pages, building, editing, importing, exporting and sharing decks, guides and data reports (I-28, I-34), bracket rules and the bracket check, the deck index and link-outs (I-29), and the evidence any result shows (legality verdicts, sources, sample sizes, seeds).
1.2 **The player's own data is never the paid lever.** No limit on decks, folders, collection cards, packages or snapshots kept. Capacity paywalls draw one-star reviews [18].
1.3 **Paid means one of:** use above a free allowance where each use costs money (AI calls, large simulations); a personal tool that computes over the player's own data or watches it over time; early access; a supporter badge.
1.4 **Nothing free becomes paid.** A feature that shipped free stays free. A paid feature is new or sits above an allowance.
1.5 **The free product stands without AI.** Every core flow works with AI unavailable or the allowance spent. AI never gates legality, bracket rules or card data, which stay deterministic ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.6 **Disclosure before charging for AI.** A public page states which features call a model, which model and provider, what is checked deterministically, and the free allowance. Paid AI output keeps I-02's "checked versus model reasoning" labels. A second public page explains the free and paid line and why: the Fan Content Policy and Scryfall's terms.

### 2. Candidate paid features

Each row becomes a paid entitlement only when its initiative ships and slice 0 allows it. "Why free incumbents skip it" is an inference from their published models.

| Candidate                                                                    | Free                                                                                                        | Paid (hypothesis)                                                                                       | Evidence players pay for this                                                                                                                                                                                                                           | Why free incumbents skip it                                                                                           | Case           |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- |
| AI above the free allowance (I-02)                                           | Monthly allowance on the cheapest adequate model                                                            | Larger monthly allowance; a metered deeper mode                                                         | DeckCheck credits, Farseek allowance plus plans, ManaTap 10 → 500 chats a day [8][10][11]                                                                                                                                                               | Each call costs money; Moxfield, Archidekt and EDHREC show no generative builder (competitors' pages)                 | Strong         |
| Price alerts, price history per deck, cheapest path to finish (I-32)         | Prices on every deck, missing-card list, seller links                                                       | Alerts on watched cards and decks, deck cost history, cart optimizer                                    | TopDecked "Pricing Professional", MTGGoldfish unlimited alerts, the 2023 review [13][14][19]                                                                                                                                                            | Needs scheduled per-user jobs and stored price history                                                                | Strong         |
| Watching one's decks (I-18)                                                  | On-demand radar for one deck                                                                                | Automatic watch: new sets, ban changes, price spikes                                                    | DeckCheck "Deckhand reports" in every paid tier [8]                                                                                                                                                                                                     | A per-user scheduled job                                                                                              | Medium–strong  |
| History across snapshots (I-07, I-21)                                        | Snapshots kept, two compared at a time                                                                      | Trends across all snapshots: curve, bracket signals, cost, playtest results                             | Untapped history depth, Deckbox collection history [7][15]                                                                                                                                                                                              | Per-user storage and compute; Fetch gives "track a deck over time" free with an account [27]                          | Medium         |
| Collection-scale tools (I-06, I-16)                                          | Collection tracking, ownership, buildable list                                                              | Buildable ranking across a corpus, building from one's collection with AI                               | Deckbox "Build decks from your real inventory", SuperBrew in MTGGoldfish Premium [15][19]                                                                                                                                                               | Corpus-wide computation per player                                                                                    | Medium         |
| Deck Lab variants and larger samples (I-31)                                  | One seeded run per snapshot, interval shown                                                                 | Custom swaps and more than two variants, large server-side samples, full run history                    | Inkborn Forge's paid "curve probability" and "Brickability" (Lorcana) [49] and Deckstats' Premium first-turn analysis [50]; DeckFlow and Fetch are free [27][28]. _Corrected 2026-11-11:_ this cell said "None found charging for probability analysis" | Castability, replays and land-count tests are already free; I-31 argues its variant verdicts are not offered anywhere | Unproven       |
| Personal game-log statistics (I-35)                                          | Logging games and basic win counts                                                                          | Trends across deck versions, whole-history analysis                                                     | Untapped personal stats, Rhystic premium stats [7][47]                                                                                                                                                                                                  | Playgroup, Lifetap and Pod Companion give stats free [20][48]; none ties results to deck versions                     | Weak           |
| Collection-wide allocation across decks (I-76 slice 21) _(added 2026-11-11)_ | Completing one deck from the collection, owned substitutes, review, apply and revert                        | Give each owned copy to one deck across all decks, then the cheapest purchase that completes every deck | Deckbox "Build decks from your real inventory" [15]; Untap AI sells completion in its Pro plan ([I-76 15](i76-complete-this-deck-from-my-collection.md#15-free-and-paid))                                                                               | No tool read allocates copies across decks (I-76)                                                                     | Unproven       |
| Table-set balance run (I-79) _(added 2026-11-11)_                            | Sets, seats, rules, copy check, balance view, sharing, publishing and exports; each deck's default I-31 run | I-31's run on every seat with one seed, stored, each pair of seats compared under Holm's correction     | Decks of KeyForge charges "$5+ a month" to form a team ([I-79 8](i79-table-sets.md#8-free-and-paid))                                                                                                                                                    | No product read offers a balance check across decks (I-79)                                                            | Unproven       |
| Early access                                                                 | —                                                                                                           | Preview flags before general release                                                                    | Untapped, DeckCheck's Workshop, ManaTap, EDHREC Rare, Moxfield [5][7][8][11][23]                                                                                                                                                                        | The Fan Content Policy is silent on it                                                                                | Medium         |
| Ad-free                                                                      | No ads today                                                                                                | Only if ads ever exist                                                                                  | The 2 USD tier everywhere [3][4][6]                                                                                                                                                                                                                     | —                                                                                                                     | Donation-grade |

_Added 2026-11-11:_ D-17 ([owner decisions](../owner-decisions.md#money-and-plans)) gains the two rows above as paid candidates: [I-79](i79-table-sets.md)'s balance run and [I-76](i76-complete-this-deck-from-my-collection.md) slice 21's collection-wide allocation. Per D-89 (recommended), the pod pass covers table sets.

### 3. Plans, prices and unit economics

3.1 Two plans at launch: Free and one paid plan. No tier ladder, team plan or lifetime deal until metrics justify one.
3.2 **Price hypothesis H1:** €3.99 a month or €29.99 a year, the ratio ManaTap uses [11]. **H2** for a later test: €4.99 or €39.99. Both sit in the 3–8 a month, 30–50 a year band [8][11][13][15].
3.3 The yearly plan is preselected: the fixed fee takes a larger share of a small monthly charge, and a year of commitment lowers churn exposure. Prices are shown in euros, VAT included, with the renewal date and the way to cancel next to the price.
3.4 One-off AI top-ups (DeckCheck sells 100 credits for 5 USD [8]) wait for metering data. At 5% + 50¢, a pack under €5 loses at least 15% of its price to fees (**computed**).

**Net per plan (computed; assumptions: French VAT 20% applied to every sale, the fee charged on the VAT-inclusive price, 50¢ counted as €0.50).**

| Plan          | Ex-VAT | Merchant of record fee | Net         | Net a month | With Stripe + Stripe Tax instead |
| ------------- | ------ | ---------------------- | ----------- | ----------- | -------------------------------- |
| €3.99 a month | €3.33  | €0.70                  | €2.63 (66%) | €2.63       | €2.99 (75%), founder files OSS   |
| €29.99 a year | €24.99 | €2.00                  | €23.0 (77%) | €1.92       | €24.14 (80%), founder files OSS  |

**AI cost per active user per month (USD, estimates from rendered prompts; each build followed by three suggestion calls; Anthropic prices read 2026-11-09 [29]).**

| Model                         | Price per MTok in / out | 20 builds | 100 builds |
| ----------------------------- | ----------------------- | --------- | ---------- |
| Claude Haiku 4.5 (used today) | $1 / $5                 | $0.88     | $4.39      |
| Claude Haiku 5.5              | $0.10 / $0.50           | $0.12     | $0.60      |
| Claude Sonnet 5.5             | $2 / $10                | $2.39     | $11.94     |
| Claude Opus 5.5               | $4 / $20                | $7.17     | $35.87     |

On today's model a heavy user costs more than a €3.99 plan nets. Haiku 5.5 makes both plans and a free allowance affordable; Sonnet 5.5 is affordable only as a metered action; Opus 5.5 is out.

### 4. AI metering and quotas (production safety; ships before billing)

4.1 Every model call goes through one server module. It records an `AiUsage` row: user, route, provider, model, input, output and cache tokens from `usage`, `stop_reason`, outcome, and a cost computed from a dated price table. The OpenAI fallback and the placeholder deck are recorded too, the placeholder at zero cost. Added 2026-11-10: the row also records `promptVersion`, `resolvedModel` and `latencyMs` ([I-70 9.3](i70-ai-quality-bench-and-model-changes.md#9-provenance-on-stored-builds-and-suggestions)).
4.2 Outcomes are `ok`, `truncated` (`stop_reason: max_tokens`), `refused`, `parseFailed`, `rejectedByValidator` and `providerError`. A truncated reply is never parsed as a success.
4.3 A monthly allowance per user and route, checked and incremented atomically in PostgreSQL before the call, so it holds across instances. The hypothesis: free 10 builds and 30 suggestion calls a month; paid 100 and 300. **Computed** at the estimated cost per call on Haiku 5.5, a fully used allowance costs about $0.06 and $0.59 a month.
4.4 Calls that fail on our side (truncated, parse failure, validator rejection, provider error) do not consume the allowance; they are still recorded as our cost.
4.5 Before an AI action the UI shows the remaining allowance and its reset date. An exhausted allowance returns HTTP 429 with `code: "allowance_exhausted"` and `resetsAt`, and the core flow continues without AI (1.5).
4.6 A global monthly spend ceiling. Crossing it switches off free AI first, then paid AI above its allowance, and alerts the owner. Since 2026-11-10 the switch-off writes through [I-69](i69-operator-console-support-moderation-and-kill-switches.md#5-the-switches-this-spec-ships)'s switch store (its slice 6), so the owner can lower the ceiling or switch AI off without a deploy.
4.7 **Model per task.** Deterministic rules never call a model. Builds, suggestions and short explanations move to Claude Haiku 5.5 once [I-70](i70-ai-quality-bench-and-model-changes.md#8-the-comparison-report-and-the-model-change-gate)'s comparison report passes (re-pointed 2026-11-10: the "golden set" holds six validator cases and calls no model), with thinking at low effort and a raised `max_tokens`, because Haiku 5.5 thinks by default, counts about 30% more tokens and has no server-side refusal fallback. A paid "deep review" may use Sonnet 5.5, metered per call. Commander-level plans can be precomputed with the Batch API at half price [29].
4.8 Usage rows are personal data: the privacy notice names them, and rows older than 13 months are aggregated without the user id (retention to be confirmed in slice 0).

### 5. Entitlements

5.1 Code asks for capabilities, never plan names: `can(user, "deckLab.variants")`, `allowance(user, "ai.build")`. One table maps plans to entitlements. Every user without a subscription resolves to the free plan.
5.2 Entitlements are enforced on the server. The client only adapts what it shows.
5.3 Expiry or downgrade deletes nothing. Data and results produced while paid stay readable and exportable; only new paid computations stop.
5.4 A failed renewal payment keeps the paid entitlements for a short grace period (7 days, a hypothesis) while the provider retries. Early-access flags are entitlements with an end date.

### 6. Billing, accounts and the subscription lifecycle

6.1 **Provider.** A merchant of record at launch, chosen in slice 0. **Computed:** it costs €0.36 a month per monthly subscriber and €1.14 a year per yearly subscriber more than Stripe + Stripe Tax, and removes VAT registration, quarterly OSS returns and chargeback handling. Revisit when the owner's accountant states the break-even.
6.2 **Exit path** ([boundary](../roadmap.md#strategic-boundaries)): entitlements never read provider fields; `Subscription` stores the provider name; customer and subscription lists export in a provider-neutral format.
6.3 Checkout is hosted by the provider; MagicAIBuilder stores no card data. Provider webhooks are the source of truth. Each is signature-verified, stored once by event id, and applied idempotently; events arriving out of order are resolved by provider timestamps.
6.4 Subscribing needs an account, which AI use already requires; card data never does. Deleting an account with an active subscription cancels it at the provider first, then deletes the user.
6.5 **Cancel online in a few steps.** A "cancel subscription" action in settings opens the provider's portal or cancels through its API, takes effect at the end of the period, and is confirmed by email (L215-1-1, D215-2 [42][43]).
6.6 **Withdrawal.** The checkout offers the withdrawal function required since 2026-06-19 [39]. Slice 0 picks one of two flows: (a) a 14-day full refund on a first purchase, no questions, which costs at most the AI usage; or (b) an unticked consent box with the acknowledgement of losing the right, confirmed on a durable medium (L221-28 13° [40]). Flow (a) is recommended because it does not depend on whether the plan is "digital content" or a service.
6.7 **Renewal transparency.** Price, period, renewal date and cancellation path appear before purchase and in settings. A yearly plan sends a written reminder between three months and one month before renewal (L215-1 [41]), sent by the provider or by us; no email sender exists today.
6.8 **Invoices.** The merchant of record issues receipts to buyers; the owner invoices the merchant of record. The owner's e-invoicing duties go to the accountant [44].

### 7. The legal gate

7.1 No plan, price page, checkout or paid entitlement ships until the owner records written answers to 7.2 in `docs/`. Requirements 1, 4 and 5 with a single free plan may ship before.
7.2 **Questions for a French IP/IT and consumer lawyer**, extending the twelve from I-29 (its question 9 is the first here):

- **Fan Content Policy:** does a paid tier that gates only computation, AI usage and personal tools require "subscriptions … to access your Fan Content"? Is paid early access compatible? Should a direct Wizards license come before charging?
- **Scryfall:** are price alerts, deck cost history and a cart optimizer built on Scryfall prices "paywalling Scryfall data" when the prices stay visible free? Ask Scryfall in writing as well.
- **Scryfall's Tagger tags (added 2026-11-10):** may card roles and play styles shown in the product be derived from Scryfall's Oracle Tags file, with attribution, when no licence for the tags was found? The answer is shared by [I-37](i37-editor-depth.md) slice 18, [I-54](i54-find-your-next-commander.md#open-questions) open question 1 and [I-65](i65-how-this-deck-wins.md#open-questions) slice 8. Ask Scryfall in writing as well.
- **The product's name (added 2026-11-10):** may a paid product carry the name "MagicAIBuilder", and a domain built on "Magic", a Wizards of the Coast trademark, under the Fan Content Policy and trademark law? No spec raised it; the [legal questions brief](../legal-questions.md#not-placed-and-gaps-this-brief-noticed) lists it, and the [owner register](../owner-decisions.md#content-and-naming) holds the decision as D-77.
- **Affiliate links (I-32):** are they "ad revenue" under the policy, and what disclosure do French and EU law require?
- **Withdrawal:** is the plan "digital content" (L221-28 13°) or a service? With a merchant of record, who owes the withdrawal function (L221-21) and the termination function (L215-1-1)?
- **Renewal notice:** does L215-1 apply to monthly plans, and to plans sold by a merchant of record?
- **Data:** the lawful basis and retention for `AiUsage`; confirmation that non-commercial sources (I-29 7.4) never feed a paid feature.
- **For an accountant:** micro-enterprise or company, VAT franchise, social contributions, and e-invoicing when the only customer is a merchant of record.

7.3 **Fallback if the answer is no.** No paid feature. Revenue comes from what the policy names: a supporter page for donations with a badge and nothing gated; sponsorships labeled as such ("acting as a sponsor only" [1]); affiliate links through I-32 if 7.2 allows them. AI keeps one uniform allowance for everyone, sized to that income. In parallel, the owner may ask Wizards for a license. Reference point: EDHREC's 2017 Card Kingdom affiliate deal funded more hours for "one paid part time developer" [46]; Mana Pool pays 5% of a referred first sale [45].

### 8. Metrics and what living from it takes

8.1 Computed from our own database and provider webhooks, without a third-party tracker: active accounts (an edit or AI action in 30 days), free-to-paid conversion, monthly churn, yearly renewal rate, refunds, AI cost per paying and per free user, net revenue per month after fees and VAT, and the share of yearly plans. The page is visible to the owner only and reports any figure under 30 subscribers as a count, not a rate.

**What it takes (computed; every input is an assumption).** A1: the owner needs €2,500 a month before social contributions and income tax; the owner has not stated a figure, so replace it. A2: fixed costs €150 a month; [I-29](i29-cross-site-deck-index.md#8-search-architecture-and-cost) priced a dedicated server at €79–99 a month excluding VAT. Since 2026-11-10, A2 cites [I-66 requirement 5](i66-running-costs-and-margin.md#5-fixed-costs-and-the-plan-upgrade-line), which prices the fixed costs at about €40–44 a month before VAT, or €62–67 with Sentry Team; €150 holds only once I-29's server exists. A3: the net per plan from requirement 3. A4: €1 ≈ $1.10–1.20. A5: average AI cost per paying user €0.10 (typical, Haiku 5.5) or €0.55 (heavy). A6: average AI cost per free user €0.01 (about a fifth of a fully used 4.3 allowance) or €0.04 (the research's $0.05 budget). A7: 3% of active accounts pay; no MTG conversion rate was found. The required contribution is A1 + A2 = €2,650 a month.

| Scenario                                                      | Contribution per payer a month    | Payers needed | Active accounts implied |
| ------------------------------------------------------------- | --------------------------------- | ------------- | ----------------------- |
| Yearly €29.99, typical AI, lean free tier                     | 1.92 − 0.10 − 32.3 × 0.01 = €1.50 | ≈ 1,770       | ≈ 59,000                |
| Monthly €3.99, typical AI, lean free tier                     | 2.63 − 0.10 − 0.32 = €2.21        | ≈ 1,200       | ≈ 40,000                |
| Yearly, lean free tier, 5% conversion                         | 1.92 − 0.10 − 19 × 0.01 = €1.63   | ≈ 1,630       | ≈ 32,500                |
| Yearly, typical AI, generous free tier (€0.04)                | 1.92 − 0.10 − 32.3 × 0.04 = €0.53 | ≈ 5,000       | ≈ 167,000               |
| Yearly, today's Haiku 4.5 ($0.88 ≈ €0.77), generous free tier | 1.92 − 0.77 − 1.29 = −€0.14       | Never         | —                       |

Beside these figures, not replacing them: [I-66 requirement 9](i66-running-costs-and-margin.md#9-break-even-under-i-30s-prices) (2026-11-10) subtracts hosting for each payer and the free players each payer carries, and finds that 22 monthly or 33 yearly payers cover a floor of €44, and that a living, A1 plus €44, takes about 1,230 monthly or 1,870 yearly payers, against 1,200 and 1,770 above.

The lean yearly case needs about half of Moxfield's Patreon membership in an undated snippet [21], from a product with no traffic figures yet. Three conclusions follow: the free AI allowance must stay small and on the cheapest adequate model (the roadmap already refuses to compete on free-tier generosity, [non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)); metering (slice 1) must replace assumptions A5 and A6 before a price is set; and affiliate income (I-32) is a complement worth measuring, not a substitute.

## Data model / API

```
Plan          id (free|pro), name, active
PlanPrice     id, planId, interval (month|year), amountCents, currency, provider, providerPriceId, validFrom, validTo?
Entitlement   planId, key (e.g. ai.build.monthly, deckLab.variants), limit? (null = unlimited), endsAt?
Subscription  id, userId, planId, provider, providerCustomerId, providerSubscriptionId (unique), status (active|pastDue|canceled|expired),
              currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, withdrawalFlow (refund|waiver), consentAt?, renewalNoticeSentAt?
BillingEvent  id, provider, providerEventId (unique), type, occurredAt, receivedAt, processedAt?, payload (minimized)
AiUsage       id, userId, route, provider, model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, stopReason,
              outcome, costMicroUsd, priceTableVersion, countsAgainstAllowance, createdAt — index (userId, createdAt)
UsageCounter  userId, key, periodStart, used — primary key (userId, key, periodStart)
```

The allowance check is a single conditional `UPDATE … SET used = used + 1 WHERE used < limit`; zero rows updated means exhausted. Routes: `GET /api/me/entitlements` (plan, entitlements, remaining allowances, reset dates); `POST /api/billing/checkout`; `POST /api/billing/portal`; `POST /api/billing/webhook/[provider]`.

## Non-goals

- A paywall on card data, images, search, deck pages, sharing, guides, data reports, bracket rules, the index or any evidence; selling or licensing content, which the Fan Content Policy forbids [1].
- Limits on decks, folders, collection cards or snapshots kept.
- Paid deck promotion or visibility ranked by spend (existing non-goal), and ads added in order to sell their removal.
- "Unlimited AI", an Opus-tier plan, or an LLM deciding any deterministic rule.
- App-store billing (there is no native app), affiliate links (I-32), a marketplace (I-33), or turning a free feature into a paid one.

## Testing strategy

- **Free access (sociable):** every surface in 1.1 renders signed out or on the free plan; a guard test lists the only modules allowed to call `can()` or `allowance()`.
- **Allowance (sociable, PostgreSQL):** concurrent calls at `limit − 1` let exactly one through; the period rolls over in UTC; a failed provider call does not consume.
- **Metering:** each call path (Anthropic, OpenAI fallback, placeholder) writes one `AiUsage` row; a test fails if any file outside the metered module calls a model endpoint. Fixtures with `stop_reason: max_tokens` and `refusal` produce those outcomes and no parsed result.
- **Entitlements (solitary):** plan resolution, grace period, expiry keeping data readable, early-access end date; a pure function reproduces the net-per-plan table from price, VAT and fee inputs.
- **Webhooks and lifecycle:** bad signature rejected; duplicate event applied once; out-of-order events converge; cancellation and payment failure change status; account deletion cancels at a mock provider first; the cancel action is reachable from settings; the yearly reminder is scheduled inside the L215-1 window.

## Delivery slices

| #   | Slice                                                                                                                                                                                           | Depends on                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 0   | Decision gate: written lawyer and accountant answers to 7.2; owner picks provider, legal structure, price hypothesis, withdrawal flow, Wizards license or not                                   | — (owner and counsel; no code) |
| 1   | Metered model client: one module for both routes, `AiUsage`, outcomes, `stop_reason` handling, dated price table                                                                                | —                              |
| 2   | Monthly allowance for every user in PostgreSQL, remaining allowance in the UI, global spend ceiling                                                                                             | 1                              |
| 3   | Model per task: build and suggest on Haiku 5.5 behind I-70's comparison report, low-effort thinking, raised `max_tokens` _(re-pointed 2026-11-10 from "I-02 golden set", which calls no model)_ | 1; I-70 slices 10 and 11       |
| 4   | Entitlement layer with the free plan only, `GET /api/me/entitlements`, free-access guard test                                                                                                   | 2                              |
| 5   | Public AI-use disclosure page                                                                                                                                                                   | 1                              |
| 6   | Public "free and paid" page                                                                                                                                                                     | 0                              |
| 7   | Billing in test mode: checkout, webhooks, `Subscription`, `BillingEvent`, portal, cancellation, account deletion                                                                                | 0, 4                           |
| 8   | Consumer-law flows: withdrawal function and chosen flow, renewal reminder, termination function                                                                                                 | 0, 7                           |
| 9   | First paid entitlements: larger AI allowance and early access _(I-71's readiness check added 2026-11-10)_                                                                                       | 5, 8; I-71 slice 12            |
| 10  | Owner metrics page (8.1)                                                                                                                                                                        | 1, 7                           |
| 11  | Further paid entitlements, each when its feature ships: I-59 alerts, I-18 watch, I-07/I-21 history, I-16 collection tools, I-31 variants, I-35 statistics                                       | 9; that initiative's slice     |
| 12  | Fallback if slice 0 says no: supporter page, sponsor disclosure, uniform AI allowance                                                                                                           | 0; replaces 6–11               |

Slices 1 to 5 are production safety and honesty work; they ship whatever the legal answer. Slice 3 waits for I-70 slices 10 and 11 (re-pointed 2026-11-10). Slice 0 is a human decision, so scheduled agents must not pick slices 6 to 12 before its answers are committed.

## Open questions

- **The legal answers in 7.2**, above all whether a paid tool tier fits the Fan Content Policy or needs a Wizards license, and whether price tools on Scryfall prices count as paywalling Scryfall data. Charging may also change the footer notice, which still cites the "Fan Site Policy".
- **Is the audience there?** The lean case needs 30,000–60,000 active accounts and no traffic figure exists. Should I-05 choose an analytics tool, or should the owner's own counts (8.1) come first?
- **How small can the free AI allowance be** before the copilot stops being a reason to sign up, given r/EDH's hostility to AI [25][26] and the paid AI market that exists anyway [8][10][11]?
- Merchant of record or Stripe, and which one? Lemon Squeezy now belongs to Stripe and its 2026 update was not read [31].
- H1 or H2, euros only or a USD price too (I-11), and should prices differ by region? ManaTap's price conflict (12.99 USD recorded on 2026-11-08, £3.99 on 2026-11-09) is unresolved [11].

## Sources

Read 2026-11-09 unless dated otherwise. "Search summary" means the page itself returned 403 and the claim comes from a search engine's summary.

1. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
2. Scryfall, [API documentation](https://scryfall.com/docs/api).
3. Archidekt, [FAQ](https://archidekt.com/faq).
4. EDHREC, [Terms](https://edhrec.com/terms), effective 2024-08-06 (Patreon banner and affiliate clause).
5. EDHREC, [How to use EDHREC](https://edhrec.com/guides/how-to-use-edhrec), read 2026-11-08.
6. Draftsim, [Premium](https://draftsim.com/?p=269684), 2026-02-19.
7. Untapped.gg, [Premium](https://mtga.untapped.gg/premium).
8. DeckCheck, [Get More](https://deckcheck.co/get-more).
9. DeckCheck, [Support](https://deckcheck.co/support).
10. Farseek, [home page and FAQ](https://farseek.ai/).
11. ManaTap, [Pricing](https://www.manatap.ai/pricing), served in GBP.
12. ManaForge, [comparison](https://manaforge.tools/en/blog/manaforge-vs-moxfield-vs-archidekt).
13. TopDecked, [App Store listing](https://apps.apple.com/us/app/topdecked/id1173388234), review dated 2023-12-14.
14. TopDecked, [Powered features](https://topdecked.com/articles/powered-features).
15. Deckbox, [Premium](https://deckbox.org/premium).
16. ManaBox, [App Store listing](https://apps.apple.com/us/app/manabox-mtg/id1460407674).
17. ManaBox, [Subscriptions guide](https://manabox.app/guides/general/subscriptions/).
18. Apple, [ManaBox customer-review feed](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460407674/sortby=mostrecent/json), 250 reviews from 2024-11-13 to 2026-11-06.
19. MTGGoldfish, [Premium](https://www.mtggoldfish.com/premium), search summary.
20. Playgroup, [Premium](https://playgroup.gg/premium), search summary.
21. Moxfield, [Patreon about page](https://www.patreon.com/moxfield/about), undated search snippet.
22. StarCityGames, [Moxfield announces social media platform](https://articles.starcitygames.com/magic-the-gathering/moxfield-announces-social-media-platform-dedicated-to-magic-the-gathering/), 2022-11-14.
23. r/Moxfield, [editor redesign preview](https://www.reddit.com/r/Moxfield/comments/1wsnch7/), 2026-09-28.
24. r/EDH, [How to get rid of ads on Moxfield? (mobile)](https://www.reddit.com/r/EDH/comments/1vhlzqj/), Aug 2026.
25. r/EDH, [Do not use AI to make deck suggestions](https://www.reddit.com/r/EDH/comments/1q0epg2/), 2025-12-31.
26. Arctic Shift, [r/EDH title search API](https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=EDH&title=moxfield&after=2025-01-01), queried 2026-11-09.
27. Fetch, [deck analyser](https://www.fetch-mtg.com/analyse).
28. DeckFlow, [Mana Base Analyzer](https://www.deckflow.gg/manabase).
29. Anthropic, [API pricing](https://platform.claude.com/docs/en/about-claude/pricing) (Batch API 50% off).
30. Paddle, [Pricing](https://www.paddle.com/pricing).
31. Lemon Squeezy, [Pricing](https://www.lemonsqueezy.com/pricing) and [2026 update](https://www.lemonsqueezy.com/blog/2026-update) (not read).
32. Stripe, [Stripe Tax pricing](https://stripe.com/tax/pricing).
33. Stripe, [Connect pricing, France](https://stripe.com/fr/connect/pricing) (standard EEA card processing).
34. Dodo Payments, [Stripe Managed Payments fees](https://dodopayments.com/blogs/stripe-managed-payments-fees-explained), vendor-biased secondary source.
35. European Commission, [OSS: declare and pay](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en).
36. Your Europe, [Cross-border VAT](https://europa.eu/youreurope/business/taxation/vat/cross-border-vat/index_en.htm), last checked 2026-07-13.
37. Your Europe, [Guarantees and returns](https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm), last checked 2026-04-28.
38. Légifrance, [Code de la consommation L221-18](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842), in force since 2016-07-01.
39. Légifrance, [Code de la consommation L221-21](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226834), in force since 2026-06-19.
40. Légifrance, [Code de la consommation L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170), in force since 2022-05-28.
41. Légifrance, [Code de la consommation L215-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000034072591/), in force since 2022-08-18.
42. Légifrance, [Code de la consommation D215-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047615001), in force since 2023-06-01.
43. Institut national de la consommation, [La résiliation des abonnements en trois clics](https://www.inc-conso.fr/content/la-resiliation-des-abonnements-et-contrats-renouvelables-en-trois-clics), 2024-02-26.
44. impots.gouv.fr, [Je passe à la facturation électronique](https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique), modified 2026-09-01.
45. Mana Pool, [Affiliates](https://manapool.com/affiliates).
46. EDHREC, [Announcing EDHREC and Card Kingdom partnership](https://edhrec.com/articles/announcing-edhrec-and-card-kingdom-partnership), 2017-05-05.
47. Rhystic, [home page](https://rhystictracker.com/), search summary.
48. Lifetap, [App Store listing](https://apps.apple.com/app/id1508241754); The Pod Companion, [Commander game tracker](https://thepodcompanion.com/commander-game-tracker/), search summary.
49. Inkborn Forge, [supporter-only Deck Insights](https://inkbornforge.substack.com/p/supporter-feature-deck-insights) for Lorcana, 2026-08-13; added 2026-11-11.
50. Deckstats, [Premium](https://deckstats.net/premium): first-turn analysis on Premium, as recorded in the [competitive landscape](../competitive-landscape.md) §1; added 2026-11-11.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

the owner knows what is free, what is paid, at what price and after which written legal answers, and no player's model calls can cost more than the plan that pays for them.

### Goals

- Every model call is metered and capped per month; the free and paid line is public and was answered in writing by a lawyer before the first charge; card data, deck pages and evidence stay free signed out; and a player can subscribe, cancel online and withdraw as French law requires.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-30-01

As a player who might pay, I want to know what is free, what is a usage limit, and what I am paying for, so that card data is not behind the charge.

#### US-30-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-30-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-30-01 Happy path

Given a signed-in player and the English locale
When card data, exports, legality and the evidence on a deck stay reachable without paying.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-30-02 Happy path

Given a signed-in player and the English locale
When aI calls are metered per account before any charge exists.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-30-03 Happy path

Given a signed-in player and the English locale
When no billing code runs before the written legal answers are committed.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-30-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-30-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-30-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Metering is signed-in and on. The charge is a flag defaulting to off, and off means the product stays free. Guests do not get a billable action.

#### AC-30-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-30-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-30-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The disclosure page lists where a model is used. A quota warning appears before the call is refused, in both languages.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Usage rows are I-30's. The charge, later, is a merchant of record, not a card charge we store. Webhooks do not carry a deck.

### Analytics and telemetry

`ai_quota_hit {surface: build or suggest}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Metering is signed-in and on. The charge is a flag defaulting to off, and off means the product stays free. Guests do not get a billable action.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Price, the legal entity, and whether a plan may be sold outside the EU stay the owner's and the lawyer's.

### Sources

- https://company.wizards.com/en/legal/fancontentpolicy
- https://scryfall.com/docs/api
- https://archidekt.com/faq
- https://edhrec.com/terms
- https://deckcheck.co/get-more
- https://www.manatap.ai/pricing
- https://mtga.untapped.gg/premium
- https://entreprendre.service-public.gouv.fr/vosdroits/F33338
- https://www.lettredesreseaux.com/?p=23453
- https://cms.law/en/deu/legal-updates/the-odr-platform-is-closing-what-businesses-need-to-know
- https://www.heuking.de/en/news-events/newsletter-articles/detail/digital-fairness-act-implementation-obligations-companies-need-to-prepare-for.html
- https://www.vatcalc.com/uk/uk-vat-on-foreign-digital-services/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

# Business, Reference And Depth

The eight initiatives below were added on 2026-11-09 from a dated research pass on the owner's goals, summarised under [Product Direction](#owner-ambition-and-business-model-2026-11-09). Unlike the 2027 horizon above, they mix priorities: I-30, I-31, I-32 and I-37 are Next, I-34 is Next for the slices that need no deck index, I-35 and I-36 are Later, and I-33 is a decision record parked for the owner. Each has a spec. The research notes are not committed, so every spec links its own sources. Legal points in them are research, not legal advice.

I-55 and I-57 joined this part on 2026-11-10, from a fourth research pass, after I-37: several builds of one deck, and the printing each card gets, are editor depth. I-57 is Next, and I-55 is Next for slices 1 to 7 and 9.

I-58 followed the same day, from a fifth pass, after I-57: a land base is deckbuilding depth, and its apply follows I-57's diff-and-apply pattern. It is Next for slices 1 to 9.

I-65 joined from a seventh pass that day, after I-58: a map of how the deck wins is analysis of the player's own list, beside I-31's lab and I-58's land check. It is Next for slices 1 to 11, with slice 8 blocked for release on the Tagger licence, and its single-deck map stays free.

I-76 and I-78 joined this part on 2026-11-11, from an eleventh pass. I-76 sits directly after I-58, because it applies a completion through I-58's reviewed change set, and I-78 directly after I-65, because table effects reuse I-65's definition format. I-76 is Next for slices 0 to 16 and I-78 for slices 1 to 3; one deck's completion and one deck's table profile stay free.

Two rules hold across all eight. Card data, fan content and the evidence the product shows stay free, under the [Wizards Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) and [Scryfall's API terms](https://scryfall.com/docs/api): a paid tier sells usage and personal tools, and only after I-30's legal gate. Each initiative names its paid-tier candidate and leaves the decision to I-30. The marketplace non-goal stays in force: I-32 builds the rungs that fit it, and I-33 names the one that would reverse it.

---

## I-30: Business Model And The Paid Tier

**Spec:** [`specs/i30-business-model-and-paid-tier.md`](i30-business-model-and-paid-tier.md)

**Outcome:** the owner knows what is free, what is paid, at what price and after which written legal answers, and no player's model calls can cost more than the plan that pays for them.

**Status:** Next
**Priority:** Next, behind a decision gate: slice 0 (written legal answers and the owner's pricing decision) comes before any billing code
**Impact / effort:** High / large
**Depends on:** a French IP/IT and consumer lawyer and an accountant for slice 0; I-70 slices 10 and 11 for the model change (slice 3), which wait for the owner's caps on live runs (re-pointed 2026-11-10 from I-02's golden set, which calls no model); I-71 slice 12's readiness check for the first paid entitlements (slice 9), which therefore wait for Later work (added 2026-11-10).

The owner wants a cheap SaaS that pays a decent living while the competition is almost free. Free reference sites sell ad removal for about 2 USD a month through Patreon ([Archidekt](https://archidekt.com/faq), [EDHREC](https://edhrec.com/terms)), which is a donation, not a product. Subscriptions at 3–8 USD a month or 30–50 USD a year sell AI usage, price tooling and personal history ([DeckCheck](https://deckcheck.co/get-more), [ManaTap](https://www.manatap.ai/pricing), [Untapped.gg](https://mtga.untapped.gg/premium)), and paywalls on how many decks or binders a player keeps draw one-star reviews. The Fan Content Policy forbids requiring payment to access fan content and Scryfall forbids paywalling its data, so the line is **content free, tools paid**, and a lawyer confirms it before anyone is charged. No billing, entitlement or monthly quota exists today; the only AI limits are per minute, in a per-instance memory store (`src/lib/rate-limit.ts`). The spec's computed case: on stated assumptions, a living wage needs about 1,200–1,800 paying subscribers and 30,000–60,000 active accounts, and is never reached if the free AI allowance is generous and the model stays on today's price.

**Never paid:** card data and images, search, deck pages, building, importing, exporting and sharing, guides, data reports, the bracket check, the index, the evidence behind any result, and how many decks, folders, collection cards or snapshots a player keeps. **Candidates**, each decided when its initiative ships: AI above a free allowance (I-02), price alerts above a free allowance (I-59, which took over I-32's price watch), automatic deck watch (I-18), history across snapshots (I-07, I-21), collection-scale tools (I-06, I-16), Deck Lab variants (I-31), game-log trends (I-35), creator analytics (I-36), longer editor history (I-37) and early access.

### Scope

- [ ] Slice 0, no code: commit written answers from a lawyer and an accountant to the spec's legal questions, then the owner's choice of provider, legal structure, price hypothesis (€3.99 a month or €29.99 a year first), withdrawal flow, and whether to ask Wizards for a licence.
  - Running costs come from [I-66](i66-running-costs-and-margin.md), proposed 2026-11-10. The spec's assumption A2, €150 a month of fixed costs, now cites I-66 requirement 5: about €40–44 a month before VAT for Vercel Pro, Supabase Pro and a domain, or €62–67 with Sentry Team; €150 holds only once I-29's index server exists. With hosting counted, 22 monthly or 33 yearly payers cover that floor, and a living takes about 1,230 monthly or 1,870 yearly payers, beside this spec's own 1,200 and 1,770. Vercel's Hobby plan forbids commercial use, so hosting moves to Pro before the first paid plan (slice 9) or any ad.
  - The lawyer questions of every initiative are collected in [`legal-questions.md`](../legal-questions.md) (2026-11-10), research for counsel and not legal advice. The product's name, built on "Magic", a Wizards of the Coast trademark, joined the spec's list that day.
  - [ ] **Terms of sale for a consumer subscription (gap sweep, 2026-11-10).** Every French professional selling to consumers must offer free mediation (Code de la consommation L612-1) and say so (L616-1) ([Service-Public](https://entreprendre.service-public.gouv.fr/vosdroits/F33338), search summary); a secondary source adds that the mediator must be contracted beforehand and listed by the CECMC ([Lettre des réseaux](https://www.lettredesreseaux.com/?p=23453), search summary). The EU ODR link duty ended on 2025-07-20 ([CMS](https://cms.law/en/deu/legal-updates/the-odr-platform-is-closing-what-businesses-need-to-know), search summary), and the planned Digital Fairness Act targets cancellation, auto-renewal and trial conversion ([Heuking](https://www.heuking.de/en/news-events/newsletter-articles/detail/digital-fairness-act-implementation-obligations-companies-need-to-prepare-for.html), 2026-05-08, search summary). Lawyer questions [L-41](../legal-questions.md#l-41-consumer-mediation) and [L-42](../legal-questions.md#l-42-conformity-guarantee-price-rises-and-feature-removals).
    - [ ] Slice 0: decide who the seller of record is. If the owner sells directly, contract with a listed consumer mediator before the first sale. Done means: the contract or the merchant of record's written position is committed under `docs/legal/`, and the mediator's name and website appear in the terms of sale and the footer.
    - [ ] A versioned `LegalDocument` slug `sale` (I-38 table 1.5) covering price, renewal, cancellation, withdrawal, the legal conformity guarantee for a digital service, and how a price rise or a feature removal is notified. Done means: signup and checkout record the accepted version, and a test proves that a price change cannot take effect before its notice date has passed.
    - [ ] No ODR link anywhere, and a dated note here to re-check the subscription flow once the Digital Fairness Act proposal is published. Done means: the note carries the publication date and a verdict.
  - [ ] **Selling outside the EU (gap sweep, 2026-11-10).** Add the non-EU tax position to the merchant-of-record versus Stripe comparison: secondary sources say a business with no UK establishment must register for UK VAT from its first digital sale to a UK consumer, with no threshold ([VATCalc](https://www.vatcalc.com/uk/uk-vat-on-foreign-digital-services/), search summary; confirm on GOV.UK). Done means: the accountant's answer to [L-46](../legal-questions.md#l-46-selling-outside-the-eu-and-invoicing-business-buyers-accountant) is committed, and if Stripe is chosen, checkout refuses countries where no registration exists.
- [ ] Meter every model call through one module: an `AiUsage` row with tokens, `stop_reason`, outcome and a cost from a dated price table. A truncated reply is never parsed as a success (slice 1).
- [ ] Enforce a monthly allowance per user and route, atomic in PostgreSQL across instances, show what remains before an AI action, and set a global monthly spend ceiling. Calls that fail on our side consume nothing (slice 2). This closes I-05's quota scope.
  - Since 2026-11-10 the ceiling's switch-off writes through [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s switch store (its slice 6), so the owner can lower the ceiling or switch AI off without a deploy, never raise it.
- [ ] Move builds and suggestions to the cheapest adequate model once [I-70](i70-ai-quality-bench-and-model-changes.md)'s comparison report passes on it (slice 3; re-pointed 2026-11-10 from I-02's golden set, which calls no model).
- [ ] An entitlement layer with a single free plan, enforced on the server, that asks for capabilities rather than plan names (slice 4).
- [ ] Publish the AI-use disclosure page from I-02's scope (slice 5) and, after slice 0, a public page that explains the free and paid line (slice 6).
  - [ ] **Dated 2026-11-10, the AI Act (Art. 50).** Sources read that day agree that Article 50 applies from 2026-08-02 and that the AI Omnibus gave generative systems already on the market before that date until 2026-12-02 for machine-readable marking (Art. 50(2)); they disagree on whether the Omnibus text is formally adopted ([Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force), 2026-08-03; [FEDIL](https://fedil.lu/en/publications/ai-act-update-enforcement-begins-as-the-digital-omnibus-reshapes-the-timeline/), search summary). Research, not legal advice: check the Official Journal text, and ask [L-40](../legal-questions.md#l-40-the-ai-acts-transparency-duties-art-50). The copilot labels its output "AI Suggestions" (`src/messages/en/deck.json`), and no disclosure page exists (gap sweep).
    - [ ] Map each model surface (build, suggest, card questions, I-47's later retrieval) to the Art. 50 paragraph it falls under, and publish that map on the disclosure page. Done means: the page is live in English and French, names the provider and model, cites Art. 50, and a test fails when a route under `src/app/api/ai/` has no row in the map.
    - [ ] Store an origin of `ai` on every saved item a model produced (deck proposal, suggestion text), and carry it into the JSON export and `/api/v1` as a machine-readable field. Done means: contract tests over every export format, shipped before 2026-12-02 unless counsel answers L-40 otherwise.
    - [ ] Keep the label on an AI-built deck after it is saved and made public, until the owner edits it past a stated threshold. Done means: the public deck page shows "Built with AI help" with a link to the disclosure page.
- [ ] After slice 0: billing in test mode through the chosen provider, webhooks, cancellation online, account deletion that cancels first, and the French withdrawal, renewal-reminder and termination flows (slices 7–8).
  - The cancellation and renewal emails go through [I-63](i63-one-notification-system.md)'s transactional stream (its slice 7), and the renewal reminder is timed by its job route (slice 5). [I-64](i64-help-centre-and-guidance.md) slice 13's subscription articles ship in the same release, so cancellation and withdrawal are explained the day a player can pay.
- [ ] **Decide in slice 0: is any delivery channel ever paid?** [I-63](i63-one-notification-system.md) requirement 13.3 says no: a free event delivered by email stays free, and what may be sold is how much a player watches. [I-51](i51-cards-lent-and-borrowed.md) lists email reminders as a paid hypothesis, and [I-59](i59-prices-over-time-and-alerts.md) requirement 9.2 lists the email digest as a paid candidate. The three disagree until this is decided. On I-63's estimate from list prices, 2,000 players on a daily digest send about 60,000 emails a month, about $6 on Amazon SES.
- [ ] First paid entitlements, a larger AI allowance and early access, then one entitlement per initiative as it ships (slices 9 and 11).
  - Slice 9 waits for [I-71](i71-speed-uptime-and-recovery.md) slice 12's readiness check: a restore drill passed in the last 90 days, the status page and the 99.5% history public, and a player's own data export (added 2026-11-10).
- [ ] After slice 0, a pod pass: one member's plan unlocks the paid tools for the whole pod. On 2025-12-02 Playgroup.gg gave every playgroup one free league and said that "only _one_ member in a playgroup needs a Supporter Pack" to unlock unlimited leagues ([post](https://playgroup.gg/posts/96-rewind-2025-playgroup-leagues-and-more)). This initiative has no group plan, while pods are already a unit in I-15, I-35, I-41, I-44 and I-51, and one subscriber in a pod of four spreads one price across four players. The pass sells computation and capacity only, such as Deck Lab runs on the pod's decks, pod history beyond a free window and game-night aids, never card data or evidence.
- Moved 2026-11-10: the referral credit, still after slice 9 and [L-43](../legal-questions.md#l-43-referral-and-creator-rewards), is now [I-72](i72-growth-loops-referrals-creators-and-return.md)'s slices 11 and 12: the code, the ledger applied from the provider webhook after the withdrawal window, the yearly cap, the exclusion of accounts without the adult declaration and the labelling text in English and French.
- [ ] An owner-only metrics page computed from our own database: active accounts, conversion, churn, AI cost per user and net revenue (slice 10).
  - Its cost section is [I-66](i66-running-costs-and-margin.md)'s: stored monthly costs per provider, cost per active player, per stored account and per payer, and the plan limits with the least headroom (I-66 slice 9).
  - The page sits behind [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s `requireOperator` once its slice 1 exists, in I-69's console at `/ops` (2026-11-10).
- [ ] If slice 0 says no: a supporter page with nothing gated, labelled sponsorships, affiliate income through I-32, and one AI allowance for everyone (slice 12).
- [ ] Pod pass: add a second dated precedent. Decks of KeyForge has sold "Team Decks" for "$5+ a month" since release 4.18 (2020-04-09, [bundle](https://decksofkeyforge.com/static/js/main.b8088841.js)). Added 2026-11-11.
- [ ] Price band evidence, 2026:
  - Untap AI sells a Claude-powered Commander coach at 4.99 USD a month or 49.99 a year ([App Store](https://apps.apple.com/app/id6768833564), 2026-05-26).
  - Kraken Pro costs $4.99 a month ([site](https://krakenthemeta.com/), seen 2026-11-10).
  - Commander Bracket Pro costs $5.99 or $54.99.
  - Mythic Tools' Mythic+ costs 9.99 USD a month, and reviewers call it "bonkers" ([reviews](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1669698500/sortby=mostrecent/json), 2026-06-16). Added 2026-11-11.
- [ ] Two paid candidates join [D-17](../owner-decisions.md#money-and-plans) (2026-11-11): [I-76](i76-complete-this-deck-from-my-collection.md) slice 21's collection-wide allocation and [I-79](i79-table-sets.md)'s balance run. [D-89](../owner-decisions.md#product-scope-and-non-goals) recommends that the pod pass covers table sets, and [D-95](../owner-decisions.md#money-and-plans) that a pod's first comparison stays free, leaving history across versions as the pod-pass candidate.

### Engineering enablers

- A test fails when any file outside the metered module calls a model endpoint.
- Concurrent calls at `limit − 1` let exactly one through, and the period rolls over in UTC.
- A guard test lists the only modules allowed to check an entitlement, and every always-free surface renders signed out.
- Expiry or downgrade deletes nothing. Webhooks are signature-verified, stored once and applied idempotently.

### Enrichment (2026-11-11)

**User story.** As a player who might pay, I want to know what is free, what is a usage limit, and what I am paying for, so that card data is not behind the charge.

**Acceptance.**
- Card data, exports, legality and the evidence on a deck stay reachable without paying.
- AI calls are metered per account before any charge exists.
- No billing code runs before the written legal answers are committed.

**UX.** The disclosure page lists where a model is used. A quota warning appears before the call is refused, in both languages.

**Data and API.** Usage rows are I-30's. The charge, later, is a merchant of record, not a card charge we store. Webhooks do not carry a deck.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `ai_quota_hit {surface: build or suggest}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Metering is signed-in and on. The charge is a flag defaulting to off, and off means the product stays free. Guests do not get a billable action.

**Open questions.** Price, the legal entity, and whether a plan may be sold outside the EU stay the owner's and the lawyer's.

### Definition of done

Every model call is metered and capped per month; the free and paid line is public and was answered in writing by a lawyer before the first charge; card data, deck pages and evidence stay free signed out; and a player can subscribe, cancel online and withdraw as French law requires.

---

