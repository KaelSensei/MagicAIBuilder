# I-30: Business Model And The Paid Tier

> **Status:** Proposed · **Priority:** Next, behind a decision gate: slice 0 (legal answers and the owner's pricing decision) comes before any billing code · **Written 2026-11-09**
> **Research:** dated notes on monetization, AI product economics and player demand, plus the I-29 legal research. The notes are not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** the line between free and paid, plans and prices, entitlements, AI usage metering and monthly quotas, the billing provider, the subscription lifecycle (checkout, renewal, cancellation, withdrawal, refunds, invoices) and the business metrics. **Does not own:** the paid features themselves — Deck Lab ([I-31](i31-deck-lab.md)), the copilot ([I-02](i02-checkable-ai-copilot.md)), price alerts and carts ([I-32](i32-seller-handoff-and-affiliate-carts.md)), the game log ([I-35](i35-pod-game-log.md)), collection tools ([I-06](../roadmap.md#i-06-collection-and-purchase-planning), [I-16](i16-decks-buildable-from-a-collection.md)), the deck radar ([I-18](i18-per-deck-radar-of-new-cards.md)); affiliate links (I-32); the marketplace decision ([I-33](i33-marketplace-ladder.md)); free data reports ([I-34](i34-commander-data-reports.md)); the choice of an analytics product ([I-05](../roadmap.md#i-05-production-safety)).

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

| Candidate                                                            | Free                                                  | Paid (hypothesis)                                                                    | Evidence players pay for this                                                                | Why free incumbents skip it                                                                                           | Case           |
| -------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- |
| AI above the free allowance (I-02)                                   | Monthly allowance on the cheapest adequate model      | Larger monthly allowance; a metered deeper mode                                      | DeckCheck credits, Farseek allowance plus plans, ManaTap 10 → 500 chats a day [8][10][11]    | Each call costs money; Moxfield, Archidekt and EDHREC show no generative builder (competitors' pages)                 | Strong         |
| Price alerts, price history per deck, cheapest path to finish (I-32) | Prices on every deck, missing-card list, seller links | Alerts on watched cards and decks, deck cost history, cart optimizer                 | TopDecked "Pricing Professional", MTGGoldfish unlimited alerts, the 2023 review [13][14][19] | Needs scheduled per-user jobs and stored price history                                                                | Strong         |
| Watching one's decks (I-18)                                          | On-demand radar for one deck                          | Automatic watch: new sets, ban changes, price spikes                                 | DeckCheck "Deckhand reports" in every paid tier [8]                                          | A per-user scheduled job                                                                                              | Medium–strong  |
| History across snapshots (I-07, I-21)                                | Snapshots kept, two compared at a time                | Trends across all snapshots: curve, bracket signals, cost, playtest results          | Untapped history depth, Deckbox collection history [7][15]                                   | Per-user storage and compute; Fetch gives "track a deck over time" free with an account [27]                          | Medium         |
| Collection-scale tools (I-06, I-16)                                  | Collection tracking, ownership, buildable list        | Buildable ranking across a corpus, building from one's collection with AI            | Deckbox "Build decks from your real inventory", SuperBrew in MTGGoldfish Premium [15][19]    | Corpus-wide computation per player                                                                                    | Medium         |
| Deck Lab variants and larger samples (I-31)                          | One seeded run per snapshot, interval shown           | Custom swaps and more than two variants, large server-side samples, full run history | None found charging for probability analysis; DeckFlow and Fetch are free [27][28]           | Castability, replays and land-count tests are already free; I-31 argues its variant verdicts are not offered anywhere | Unproven       |
| Personal game-log statistics (I-35)                                  | Logging games and basic win counts                    | Trends across deck versions, whole-history analysis                                  | Untapped personal stats, Rhystic premium stats [7][47]                                       | Playgroup, Lifetap and Pod Companion give stats free [20][48]; none ties results to deck versions                     | Weak           |
| Early access                                                         | —                                                     | Preview flags before general release                                                 | Untapped, DeckCheck's Workshop, ManaTap, EDHREC Rare, Moxfield [5][7][8][11][23]             | The Fan Content Policy is silent on it                                                                                | Medium         |
| Ad-free                                                              | No ads today                                          | Only if ads ever exist                                                               | The 2 USD tier everywhere [3][4][6]                                                          | —                                                                                                                     | Donation-grade |

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

4.1 Every model call goes through one server module. It records an `AiUsage` row: user, route, provider, model, input, output and cache tokens from `usage`, `stop_reason`, outcome, and a cost computed from a dated price table. The OpenAI fallback and the placeholder deck are recorded too, the placeholder at zero cost.
4.2 Outcomes are `ok`, `truncated` (`stop_reason: max_tokens`), `refused`, `parseFailed`, `rejectedByValidator` and `providerError`. A truncated reply is never parsed as a success.
4.3 A monthly allowance per user and route, checked and incremented atomically in PostgreSQL before the call, so it holds across instances. The hypothesis: free 10 builds and 30 suggestion calls a month; paid 100 and 300. **Computed** at the estimated cost per call on Haiku 5.5, a fully used allowance costs about $0.06 and $0.59 a month.
4.4 Calls that fail on our side (truncated, parse failure, validator rejection, provider error) do not consume the allowance; they are still recorded as our cost.
4.5 Before an AI action the UI shows the remaining allowance and its reset date. An exhausted allowance returns HTTP 429 with `code: "allowance_exhausted"` and `resetsAt`, and the core flow continues without AI (1.5).
4.6 A global monthly spend ceiling. Crossing it switches off free AI first, then paid AI above its allowance, and alerts the owner.
4.7 **Model per task.** Deterministic rules never call a model. Builds, suggestions and short explanations move to Claude Haiku 5.5 once the golden set passes, with thinking at low effort and a raised `max_tokens`, because Haiku 5.5 thinks by default, counts about 30% more tokens and has no server-side refusal fallback. A paid "deep review" may use Sonnet 5.5, metered per call. Commander-level plans can be precomputed with the Batch API at half price [29].
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

| #   | Slice                                                                                                                                                         | Depends on                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 0   | Decision gate: written lawyer and accountant answers to 7.2; owner picks provider, legal structure, price hypothesis, withdrawal flow, Wizards license or not | — (owner and counsel; no code) |
| 1   | Metered model client: one module for both routes, `AiUsage`, outcomes, `stop_reason` handling, dated price table                                              | —                              |
| 2   | Monthly allowance for every user in PostgreSQL, remaining allowance in the UI, global spend ceiling                                                           | 1                              |
| 3   | Model per task: build and suggest on Haiku 5.5 behind the golden set, low-effort thinking, raised `max_tokens`                                                | 1; I-02 golden set             |
| 4   | Entitlement layer with the free plan only, `GET /api/me/entitlements`, free-access guard test                                                                 | 2                              |
| 5   | Public AI-use disclosure page                                                                                                                                 | 1                              |
| 6   | Public "free and paid" page                                                                                                                                   | 0                              |
| 7   | Billing in test mode: checkout, webhooks, `Subscription`, `BillingEvent`, portal, cancellation, account deletion                                              | 0, 4                           |
| 8   | Consumer-law flows: withdrawal function and chosen flow, renewal reminder, termination function                                                               | 0, 7                           |
| 9   | First paid entitlements: larger AI allowance and early access                                                                                                 | 5, 8                           |
| 10  | Owner metrics page (8.1)                                                                                                                                      | 1, 7                           |
| 11  | Further paid entitlements, each when its feature ships: I-59 alerts, I-18 watch, I-07/I-21 history, I-16 collection tools, I-31 variants, I-35 statistics     | 9; that initiative's slice     |
| 12  | Fallback if slice 0 says no: supporter page, sponsor disclosure, uniform AI allowance                                                                         | 0; replaces 6–11               |

Slices 1 to 5 are production safety and honesty work; they ship whatever the legal answer. Slice 0 is a human decision, so scheduled agents must not pick slices 6 to 12 before its answers are committed.

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
