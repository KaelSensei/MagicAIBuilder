# I-66: Running Costs And Margin Per Active Player

> **Initiative:** I-66, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 8, before [I-30](i30-business-model-and-paid-tier.md)'s pricing decision; Later for slices 9 to 12, which wait for I-30's owner page, [I-63](i63-one-notification-system.md)'s job route or a Pro plan · **Paid:** not applicable; an internal tool for the owner, never shown to players · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10 on Vercel, Supabase, Sentry, Anthropic, domain and Prisma pages, plus three measurements made for this spec (Scryfall's bulk files, card image sizes, a domain lookup). It is not committed, so every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** the dated price book of every provider except AI and payments; the cost model per active player; the table of plan limits and the usage at which each one hits; the fixed-cost floor and the plan-upgrade triggers; the monthly cost report; budget alerts and their thresholds; the list of cost-cutting engineering moves with their estimated savings; break-even subscriber counts for running costs. **Does not own:** AI prices, metering, allowances and the AI spend ceiling (I-30 slices 1 to 3, [I-02](i02-checkable-ai-copilot.md)); plans, prices, payment fees and the owner metrics page (I-30); the email provider and the job route (I-63); the price archive and its retention ([I-59](i59-prices-over-time-and-alerts.md)); the shared rate-limit store, the WebP migration and user-write bounds ([I-05](../roadmap.md#i-05-production-safety)); the rules version reader ([I-48](i48-official-changes-reach-every-deck.md)); the definition of an active account ([I-39](i39-first-run-activation-and-measurement.md)); the uptime monitor ([I-52](i52-feedback-loop-players-can-see.md)); the index server ([I-29](i29-cross-site-deck-index.md)).
> **Proposed changes to neighbours, for the integrator:** I-30's assumption A2 cites requirement 5 here instead of a guessed €150. I-05 M3 and `src/lib/cache-limits.ts` say 500 MB, not 512 MB. I-05 gains one item: the code's fallback domain is unregistered (requirement 5.4).

## Overview

The owner wants a cheap SaaS that pays a living. [I-30](i30-business-model-and-paid-tier.md#8-metrics-and-what-living-from-it-takes) prices the AI per user and computes how many subscribers a living takes, but it guesses the rest: "A2: fixed costs €150 a month" (I-30 line 173). Nobody has measured hosting, the database, image bandwidth, Scryfall use, error tracking, email, storage or the domain, and nobody knows which free-tier limit breaks first.

This spec gives the owner four things. A **cost model per active player per month**, where every input is a dated price or a labelled assumption. A **table of plan limits** with the usage at which each one hits. A **monthly report** built from provider exports and the database's own aggregates, with no new tracking of players. **Budget alerts**, and a short list of **engineering moves** that cut cost, each with its estimated saving.

The estimates below lead to three findings, to be confirmed by measurement (slice 2):

1. **Vercel's Hobby plan forbids commercial use** [3]. Any paid plan, ad or payment request moves hosting to Pro first, whatever the traffic. The commercial floor is about €40–44 a month before VAT.
2. **Hosting is cheap per player; AI is not.** On Pro, hosting costs about $0.002–0.005 per active player per month beyond the included credit (estimate). A free player who uses the whole AI allowance on today's model costs $0.44 (I-30 4.3 with I-02's per-call estimates), about 90 times more.
3. **On free tiers, data limits hit first.** Speed Insights stops collecting at about 250 active players and Sentry's 50 replays run out at about 625. The first limit that can stop the product is the 500 MB database, at about 1,100 stored accounts. Fast Origin Transfer comes next, at about 1,300 active players.

### Overlaps with other initiatives

| Initiative                                                                             | What it already says (line numbers as read on 2026-11-10)                                                                                                                                                                                                  | Resolution                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [I-30](i30-business-model-and-paid-tier.md)                                            | AI cost table (lines 114–123), allowance cost (4.3, line 129), global AI ceiling (4.6, line 132), merchant-of-record cost (6.1, line 145), owner metrics page (8.1, line 171; slice 10, line 231), assumption A2 and the living-wage table (lines 173–183) | I-30 keeps AI, fees and the page. I-66 replaces A2 with requirement 5, adds hosting to the cost per payer (9.1) and feeds the page's cost section |
| [I-02](i02-checkable-ai-copilot.md)                                                    | Cost per call and per month on Haiku 4.5, Haiku 5.5 and Sonnet 5.5 (lines 121–129)                                                                                                                                                                         | Read, not owned. The unmerged branch `feat/ai-usage-metering-and-monthly-quota` adds the ledger I-66 reads (requirement 6.4)                      |
| [I-05](../roadmap.md#i-05-production-safety)                                           | At roadmap `4f803bb`: WebP move (line 898), uptime monitor (901), AI metering (909), M2 shared rate-limit store (921), M3 "can fill the 512 MB database" (923), advanced observability parked (948)                                                        | I-05 owns all six. I-66 corrects M3 to 500 MB, prices the WebP move (8.1) and adds no observability vendor                                        |
| [I-59](i59-prices-over-time-and-alerts.md)                                             | "512 MB free-tier database" (line 55), a 512 MB database full in nine weeks of daily prices (144), a 287 MB-a-year archive (146), storage as open question 1 (188)                                                                                         | I-59 decides what to store. I-66 prices it (5.1) and alerts on database size (7.4)                                                                |
| [I-63](i63-one-notification-system.md)                                                 | Email prices (lines 49–55), Vercel cron on Hobby once a day (61, 149), the job route (10.1, line 168), job cadence as open question 5 (266)                                                                                                                | I-63 chooses the provider and owns the route. I-66's daily checks run on that route, and its alerts use I-63's transport                          |
| [I-39](i39-first-run-activation-and-measurement.md)                                    | Active account (30 days) defined in 11.4 (line 166)                                                                                                                                                                                                        | I-66 uses that definition as its denominator and counts it from existing rows (6.6)                                                               |
| [I-48](i48-official-changes-reach-every-deck.md), [I-29](i29-cross-site-deck-index.md) | I-48 slice 1 (line 178) replaces the live banlist and Game Changer reads; I-29 section 8 (line 125) sizes the index and its server                                                                                                                         | I-66 asks that I-48's reader be CDN-cacheable (move 2) and counts I-29's server as a fixed cost once it exists                                    |

## What the market does

Provider pages read on 2026-11-10. Prices are list prices in USD, excluding VAT, unless stated.

**Vercel.** Hobby is free and cannot buy usage beyond its allotments [1]. Hobby teams "are restricted to non-commercial personal use only", and "all commercial usage of the platform requires either a Pro or Enterprise plan". The examples are "any method of requesting or processing payment from visitors of the site", advertising the sale of a product or service, affiliate linking as the site's primary purpose, and advertisements; asking for donations "does not" count [3]. Pro costs $20 a seat a month and includes $20 of usage credit [1]. Vercel's help page says sustained use past the allotments can lead to a paused deployment [14].

| Resource (monthly)    | Hobby included [1][3]              | Pro included [1] | Pro rate in Dublin (`dub1`) [4][5][6]         |
| --------------------- | ---------------------------------- | ---------------- | --------------------------------------------- |
| Function invocations  | 1,000,000                          | Usage-based      | $0.60 per million                             |
| Active CPU            | 4 hours                            | Usage-based      | $0.168 an hour ($0.128 in `iad1`)             |
| Provisioned memory    | 360 GB-hours                       | Usage-based      | $0.0139 a GB-hour ($0.0106 in `iad1`)         |
| Fast Origin Transfer  | 10 GB                              | Usage-based      | $0.06 per GB                                  |
| Fast Data Transfer    | 100 GB                             | 1 TB             | $0.15 per GB                                  |
| CDN requests          | 1,000,000                          | 10,000,000       | $2.40 per million                             |
| Speed Insights events | 10,000 over a rolling 30 days [10] | 10,000 free tier | Plus: $10 a project and $0.65 per 10,000 [10] |

Three billing rules matter here. Active CPU is billed only while code runs, but provisioned memory is billed for the instance's whole lifetime, "even during I/O operations" [6]. A function response is cached by the CDN only with `s-maxage` or a `CDN-Cache-Control` header, never with `max-age` alone [9]. Fast Origin Transfer counts the bytes between the CDN and functions in both directions [8]. New projects run functions in Washington, D.C. (`iad1`) unless a region is set [7]. When collection reaches the Speed Insights free limit, Vercel "pauses collection for those projects for at least 14 days" without charging [10].

Pro's spend management sets an on-demand budget. It notifies by web and email at 50%, 75% and 100%, and by SMS at 100%. It can send a signed `budget.reached` webhook and can pause every production deployment, which then answers 503 until each project is resumed by hand. It checks spend "every few minutes", so it acts late [11]. Costs are readable through `GET /v1/billing/charges`, FOCUS v1.3 JSONL by day with the project in `Tags` and a `RegionId` [12], and through `vercel billing usage --json --group-by project|region` [13]. Neither page says whether Hobby teams can use them.

**Supabase** [15][16][17]. Free: $0, a 500 MB database, 5 GB egress, 1 GB file storage, no backups, two active projects, and a project paused after a week of inactivity. Pro: from $25 a month with $10 of compute credit, which covers the Micro instance; it includes 8 GB of disk ($0.125 a GB above), 250 GB of egress ($0.09 a GB above), 100 GB of storage and daily backups kept 7 days, with a spend cap on by default. Free and Micro allow 60 direct connections and 200 pooler clients; Small allows 90 and 400 at $15 a month. On Free, going over 500 MB does not make the database read-only. It brings an organisation-wide fair-use restriction (HTTP 402) based on the average daily size over the billing period [17]. A search found no official Management API endpoint for usage or cost [27].

**Sentry** [18]. Developer: free, 1 user, 5,000 errors, 5 million spans, 50 session replays, 1 cron monitor (+$0.78 each) and 1 uptime monitor. Team: $26 a month billed yearly or $29 monthly, unlimited users, 50,000 errors, same spans and replays. The page shows no price for extra errors or replays and does not say what happens at the quota.

**Anthropic** [19]. Re-read on 2026-11-10, unchanged from I-30's reading of 2026-11-09: per million tokens, Haiku 4.5 $1 in and $5 out, Haiku 5.5 $0.10 and $0.50 for prompts up to 100,000 tokens, Sonnet 5.5 $2 and $10, Opus 5.5 $4 and $20; the Batch API halves both.

**Email, storage and payments**, from earlier specs. Amazon SES costs $0.10 per 1,000 emails, Resend gives 3,000 a month free (100 a day), and Postmark costs $15 for 10,000 ([I-63](i63-one-notification-system.md) lines 49–55). A merchant of record takes 5% + 50¢ a sale; Stripe takes 1.5% + €0.25 for standard EEA cards, plus 0.5% for Stripe Tax, and the founder then files the EU One-Stop Shop return ([I-30](i30-business-model-and-paid-tier.md) lines 48–52). Vercel Blob storage costs $0.023 a GB-month in Dublin [5].

**Domains.** On 2026-11-10, Verisign's registry lookup for `magicaibuilder.com` answered "not found" [20]. Gandi charges €11.65 for the first year of a `.com` and €31.98 a year to renew; for `.fr` it charges €6.00 and €23.98, all before 20% VAT [21][22]. Third-party comparisons put Cloudflare's at-cost `.com` at about $10.44–10.46 a year (search summary; not verified on Cloudflare) [26].

**Scryfall** charges nothing. Its rate limits and daily bulk files are in [I-05](../roadmap.md#i-05-production-safety)'s Scryfall item. Measured on 2026-11-10 [24]: the Oracle Cards file of 2026-11-09 is 25.4 MB compressed and 211 MB of JSON for 39,288 cards. Keeping 17 fields (six Commander-family legalities and one image URL) gives 32.5 MB, or 828 bytes a card. Twenty random Commander-legal card images [25] averaged 110.6 KB as the `normal` JPEG, 60.6 KB as the `grid` WebP at the same 488 × 680, and 91.1 KB as the `display` WebP at 672 × 936.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **No cost data anywhere.** No module reads Vercel, Supabase or Sentry usage. There is no `vercel.json`, so the function region is whatever the dashboard holds; new projects default to `iad1` [7]. `docs/engineering/infrastructure.md` places the database behind `aws-0-eu-west-1.pooler.supabase.com`, which is in Ireland.
- **The database size is stated wrongly.** `src/lib/cache-limits.ts` says the caches fit "the 512 MB free-tier database", and I-05 M3 and I-59 repeat 512 MB. Supabase's pages say 500 MB [15][17].
- **Images bypass Vercel.** All 16 `<Image>` elements in 14 files under `src/components` set `unoptimized`, so Image Optimization is unused, and card images load from `cards.scryfall.io`. Only `/api/proxy-card-image` (`src/app/api/proxy-card-image/route.ts`) moves image bytes through a function, for print export (`ProxyExportModal.tsx`, one call per unique image). It requires no sign-in and no rate limit, buffers up to 5 MB, and answers `Cache-Control: public, max-age=86400`, which the CDN does not cache [9]. Its input is the stored `imageUri`, the `normal` JPEG.
- **Shared Scryfall cache (#1322).** `src/lib/scryfall/client.ts` reads search pages and cards by id through `GET /api/cache/search` (1 hour) and `GET /api/cache/cards` (24 hours). Each lookup, hit or miss, costs one invocation and at least one database query. `read-through-response.ts` sets no `Cache-Control`. Fills are limited to 60 a minute per IP and per instance. Name, autocomplete, collection and printings calls go from the browser to `api.scryfall.com` and cost the product nothing. `useBanlist.ts` and `useGameChangers.ts` fetch two lists that are the same for every player, cached for 24 hours in the browser.
- **Caching headers.** Besides the proxy, only `/api/v1/openapi` (`public, max-age=300, must-revalidate`) and the AI routes (`no-cache`) set one. `next.config.ts` adds security headers to every path.
- **Static or dynamic, by reading the code.** The locale layout calls `generateStaticParams` and `setRequestLocale`. Of 16 pages, five read `auth()`, `headers()`, Prisma or `searchParams` at request time: `deck/[id]`, `u/[username]`, `commanders/[slug]/decks`, `moderation/reports` and `rules/comprehensive`. `share/[token]` and `builder/[deckId]` sit under dynamic segments without static params. The other nine read nothing at request time. The middleware wraps every page request in `auth()` (matcher in `src/middleware.ts` excludes `api`, `_next/static`, `_next/image` and files). A `next build` route table confirms this in slice 2.
- **Sentry.** `tracesSampleRate: 0.1` on server, edge and client; `replaysSessionSampleRate: 0.01` and `replaysOnErrorSampleRate: 1.0` (`src/instrumentation-client.ts`); `automaticVercelMonitors: true` in `next.config.ts`, so the Vercel crons I-63 adds may each become a Sentry cron monitor; Developer includes one, then $0.78 each [18]. Slice 2 checks.
- **Speed Insights.** `<SpeedInsights />` in `src/app/[locale]/layout.tsx` with no `sampleRate`.
- **Prisma.** `src/lib/db/prisma.ts` creates the client with no pool options, and the schema has a `url` and no `directUrl`. The documented production URL uses the transaction pooler on port 6543 with `?pgbouncer=true` and no `connection_limit`. On Prisma 6 (`^6.19.3`) each function instance therefore opens up to physical CPUs × 2 + 1 connections [23].
- **AI.** On `dev`, two routes call a model with no metering (I-30). The unmerged branch `feat/ai-usage-metering-and-monthly-quota` (`5879b6d`) adds `AiUsage`, `UsageCounter`, `AiMonthlySpend`, a price table dated 2026-11-09 (`src/lib/ai/usage/prices.ts`) and a global ceiling of $20 a month by default (`AI_MONTHLY_SPEND_CEILING_USD`, `src/lib/ai/usage/policy.ts`). It is held for the owner's numbers.
- **Health and domain.** `/api/health` runs `SELECT 1`; a five-minute monitor (I-52) costs 8,640 invocations a month, 0.9% of Hobby's allotment (computed). `src/lib/seo/alternates.ts` falls back to `https://magicaibuilder.com` when `NEXT_PUBLIC_BASE_URL` is unset. That domain is unregistered [20], and the repository's homepage is `magic-ai-builder.vercel.app`.

## Functional requirements

### 1. Ground rules

1.1 The report and the model are for the owner only. No page, route or export shown to players carries a cost figure. This is not a paid feature: it tells the owner what one more player, free or paying, costs, which I-30 needs before slice 0's price decision.
1.2 No new tracking of players: no event, column, cookie or beacon is added for this initiative. Counts come from provider exports and from aggregates over rows that already exist (6.6).
1.3 Every figure is labelled **measured** (from an export or the database), **computed** (from stated inputs) or **assumed** (a U-value in 3.2), with its source and date.
1.4 No new external service. FinOps tools that read the same APIs are out of scope ([strategic boundaries](../roadmap.md#strategic-boundaries)).

### 2. The price book

2.1 One committed module holds each provider price used here: provider, plan, resource, unit, rate, included quantity, region, source URL and the date it was read. AI prices stay in I-30's table and are read from it.
2.2 A changed price is a new dated entry; the old one stays, so a past month is recomputed with the prices of that month. The report flags any price read more than 180 days earlier.

### 3. Cost model per active player

3.1 **Active player** means I-39's 30-day active account (11.4): an edit or an AI action in the last 30 days. **Stored account** means a user with at least one deck; storage grows with stored accounts, not active ones.
3.2 The model is a pure function of the price book, the plan and these inputs. Until slice 2 measures them, they are assumptions:

| Input                                   | Assumed value                                                     | Replaced by (6.7)                          |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| U1 sessions per active player a month   | 8                                                                 | Invocations ÷ active players, with U3      |
| U2 page views per session               | 5                                                                 | Speed Insights or CDN request counts       |
| U3 function calls per session           | 40                                                                | Vercel invocations                         |
| U4 wall time per call                   | 250 ms                                                            | `durationMs` already logged by most routes |
| U5 active CPU per call                  | 25 ms                                                             | Vercel Active CPU ÷ invocations            |
| U6 memory per instance                  | 2 GB, the default [2]                                             | Project setting                            |
| U7 response size per call               | 15 KB                                                             | Fast Origin Transfer ÷ invocations         |
| U8 static transfer per session          | 0.5 MB                                                            | Fast Data Transfer                         |
| U9 static requests per session          | 25                                                                | CDN requests                               |
| U10 Speed Insights events per page view | 1                                                                 | Speed Insights usage                       |
| U11 print exports per active player     | 0.25 a month, 100 images each                                     | Proxy log lines                            |
| U12 database bytes per stored account   | 0.36 MB: 4 decks of 100 rows at about 680 B, 6 snapshots of 15 KB | `pg_total_relation_size` ÷ stored accounts |
| U13 database bytes read per call        | 5 KB                                                              | Supabase egress ÷ invocations              |

3.3 **Result with these assumptions (computed).** A month per active player: 345 invocations, 8.6 s of active CPU, at most 0.048 GB-hours of memory (no sharing between requests), 7.6 MB of Fast Origin Transfer, 11.6 MB of Fast Data Transfer, 545 CDN requests and 40 Speed Insights events. At Dublin's Pro rates this is $0.0017 for functions and origin transfer, or $0.0048 if transfer and requests were billed beyond Pro's inclusions. So 1,000 active players cost $1.7–4.8 a month, and the $20 credit covers about 4,200–11,500 active players.
3.4 The AI cost per active player comes from I-30's ledger once merged (6.4). Until then the model uses I-30's A5 and A6, labelled assumed.

### 4. Plan limits and when they hit

4.1 The report keeps this table, recomputed each month from measured inputs. "Hits at" divides the plan figure by the per-player usage of 3.3 (computed, before measurement):

| Limit                        | Plan figure                     | Per player a month             | Hits at about                                                     | What happens                                           |
| ---------------------------- | ------------------------------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Speed Insights events        | 10,000 per rolling 30 days [10] | 40                             | 250 active players                                                | Collection paused for at least 14 days; no charge [10] |
| Sentry session replays       | 50 a month, Developer [18]      | 0.08, plus every error session | 625 active players, sooner with errors                            | Not stated [18]                                        |
| Database size, Supabase Free | 500 MB [15]                     | 0.36 MB per stored account     | 1,100 stored accounts, keeping 100 MB for caches and other tables | Organisation-wide HTTP 402 restriction [17]            |
| Fast Origin Transfer, Hobby  | 10 GB [1]                       | 7.6 MB                         | 1,300 active players                                              | Deployment may be paused [14]                          |
| Active CPU, Hobby            | 4 hours [1]                     | 8.6 s                          | 1,700                                                             | Same                                                   |
| CDN requests, Hobby          | 1,000,000 [1]                   | 545                            | 1,800                                                             | Same                                                   |
| Function invocations, Hobby  | 1,000,000 [1]                   | 345                            | 2,900                                                             | Same                                                   |
| Supabase egress, Free        | 5 GB [15]                       | 1.7 MB                         | 2,900                                                             | Not stated                                             |
| Provisioned memory, Hobby    | 360 GB-hours [1]                | ≤ 0.048 GB-hours               | 7,500 or more                                                     | Deployment may be paused [14]                          |
| Fast Data Transfer, Hobby    | 100 GB [1]                      | 11.6 MB                        | 8,600                                                             | Same                                                   |
| Pooler clients               | 200 on Free and Micro [16]      | Concurrency, not per player    | Not estimated; measured in slice 7                                | New connections refused                                |
| Commercial use, Hobby        | Not allowed [3]                 | —                              | The first paid plan, ad or payment request                        | Pro required                                           |

4.2 Hobby runs crons once a day, which binds the first job that needs more (I-63 line 61, 7.2). On Pro and Supabase Pro the same arithmetic gives: 10 million CDN requests at about 18,000 active players; 1 TB of transfer at about 86,000; 8 GB of disk at about 20,000 stored accounts; 250 GB of egress at about 145,000 active players (computed).
4.3 The report lists the three limits with the least headroom first, each with the month it would hit at the last three months' growth.

### 5. Fixed costs and the plan-upgrade line

5.1 **The floor.** The report lists fixed monthly costs, before VAT:

| Item                   | Today (the code assumes free tiers) | Commercial minimum                                                                 | Source        |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- | ------------- |
| Hosting                | Vercel Hobby, $0                    | Vercel Pro, $20 a seat with $20 of usage credit                                    | [1]           |
| Database               | Supabase Free, $0                   | Supabase Pro, $25 with Micro compute and daily backups                             | [15]          |
| Error tracking         | Sentry Developer, $0                | $0 for one user; Team $26–29 for a second user or more errors                      | [18]          |
| Domain                 | None (`vercel.app`)                 | `.com` €2.67 a month at Gandi's renewal price; `.fr` €2.00                         | [21][22]      |
| Email (I-63)           | None                                | Under $1 for 10,000 emails on SES; $0 within Resend's free tier                    | I-63          |
| Price archive (I-59)   | None                                | 287 MB a year: inside Supabase Pro's 100 GB, or under $0.01 a month on Vercel Blob | I-59, [5]     |
| Index server (I-29)    | None                                | €79–99 a month, only if I-29 ships                                                 | I-30 line 173 |
| VPS for agents and E2E | The owner's figure                  | The owner's figure                                                                 | I-05          |

At I-30's exchange rate (€1 ≈ $1.10–1.20) the commercial minimum is **€40–44 a month** before VAT, the VPS and I-29's server, or €62–67 with Sentry Team (computed). I-30's A2 of €150 holds only once I-29's server exists.
5.2 **Vercel Pro comes before money.** Vercel Pro is required before the first paid plan goes live (I-30 slice 9), before any ad, and before [I-32](i32-seller-handoff-and-affiliate-carts.md)'s affiliate links if Vercel counts them as the site's primary purpose [3]. A donations-only fallback (I-30 7.3) fits Hobby's wording. Research, not legal advice: the owner asks Vercel in writing (slice 0) and adds the question to I-30 7.2.
5.3 **Supabase Pro for safety.** Supabase Free keeps no backups and pauses a project after a week without activity [15]. The owner decides in slice 0 whether production moves to Pro before public launch, whatever the traffic, and I-05 records the decision.
5.4 **The fallback domain.** Either the owner registers `magicaibuilder.com`, or the fallback changes and a production build fails when `NEXT_PUBLIC_BASE_URL` is unset. Without either, canonicals, `robots.txt` and the sitemap can point at a domain anyone may register [20]. Proposed as an I-05 item.

### 6. The monthly cost report

6.1 Once a month, for the previous UTC month, one report lists every provider and service with quantity, unit, cost, source (`api`, `cli`, `manual` or `computed`) and the date read.
6.2 **Vercel**, from `GET /v1/billing/charges` [12], filtered to the production project and grouped by service and region; or from `vercel billing usage --json --group-by project` [13] where the API is not available. The region rows also show where functions really run (open question 1).
6.3 **Supabase**, from SQL: `pg_database_size` and `pg_total_relation_size` per table [17]. The plan charge and egress come from the invoice, entered by hand, because no usage endpoint was found [27].
6.4 **AI**, from `AiMonthlySpend` and `AiUsage` once I-30 slice 1 merges: cost by route, model and outcome. Calls that failed on our side count as our cost (I-30 4.4).
6.5 **Sentry, email, domain and other costs**: Sentry errors, spans and replays against the plan quota, entered by hand until a usage API is verified (open question 5); email sends counted from I-63's own records, the provider invoice, the domain prorated by month, and the VPS and any other owner cost entered by hand.
6.6 **Denominators, from existing rows only.** Active players: distinct users with `Deck.updatedAt` or, once I-30 slice 1 merges, `AiUsage.createdAt` in the 30 days before the month's end, until I-39's event store replaces this. Stored accounts: users with at least one deck. Payers: active subscriptions once I-30 bills.
6.7 **Output.** Cost per active player, per stored account and per payer; the measured U-values beside the assumed ones of 3.2; the limit table of 4.1; and the break-even of 9 recomputed. Each figure carries its label (1.3).
6.8 A missing input shows "not available" and is left out of the totals it would change, which are marked incomplete. It never counts as zero.
6.9 The first form is a script that prints the report for the owner and stores nothing. The stored form is a cost section on I-30's owner metrics page (slice 10). Business figures are never committed.

### 7. Budget alerts

7.1 **Vercel, on Pro.** An on-demand budget at the owner's amount (slice 0), with web and email notices at 50%, 75% and 100% and SMS at 100% [11]. Supabase Pro's spend cap stays on [15].
7.2 A webhook route receives `budget.reached`, checks `x-vercel-signature` (HMAC-SHA1 of the body) [11], stores each event once, and alerts the owner through Sentry and, once I-63's transport exists, by email.
7.3 "Pause production deployments" stays off unless the owner turns it on in slice 0. It takes the whole site down until each project is resumed by hand, and it acts several minutes late [11]. The AI ceiling (I-30 4.6) already stops the largest variable cost.
7.4 **Daily checks** on I-63's job route alert at: database size at 70%, 85% and 95% of the plan quota; each Hobby allotment at 70% while on Hobby; AI spend at 50% and 80% of I-30's ceiling (I-30 4.6 owns 100% and the switch-off); a Speed Insights pause.
7.5 Each alert names the resource, the figure, the limit, the date and its row in 4.1, and fires once per threshold per month.

### 8. Engineering moves that cut cost

8.1 Each move ships as its own slice or stays with its owner. Savings are **estimates** from 3.3 until slice 2 measures before and after.

| #   | Move                                                                                                                                          | Estimated saving                                                                                                                                                                                                                    | Owner                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `s-maxage` with `stale-while-revalidate` on 200 answers from `/api/cache/search` (1 h) and `/api/cache/cards` (24 h); none on 400, 429 or 502 | A repeat lookup costs one CDN request instead of an invocation, CPU, memory, origin transfer and a database read. If a quarter of U3 is shared repeats (assumed), about 25% of invocations                                          | I-66                                                              |
| 2   | Serve I-48's rules version in force (banlist and Game Changers) as one CDN-cached response                                                    | At least 2 calls per session, about 16 invocations per player a month (5%)                                                                                                                                                          | I-48 builds; I-66 asks                                            |
| 3   | Image proxy: `Vercel-CDN-Cache-Control` with a long lifetime (Scryfall URLs carry a version stamp), then WebP                                 | `grid` WebP cuts each image from 110.6 to 60.6 KB (−45%) at the same size, a 100-card export from 11.1 to 6.1 MB, and moves the Fast Origin Transfer limit from about 1,300 to 1,600 players; `display` WebP: −18% at a larger size | I-66 header; I-05 WebP move                                       |
| 4   | Rate-limit the proxy                                                                                                                          | Bounds abuse: one script spends Hobby's 10 GB of origin transfer in about 90,000 requests                                                                                                                                           | I-05 M2                                                           |
| 5   | Run functions in `dub1`, next to the database in Ireland                                                                                      | CPU and memory both cost about 31% more in `dub1` than in `iad1` [6]. Memory cost falls only if wall time per call drops by more than 24%; CPU cost rises regardless. The move is for latency first; measure before deciding        | I-66                                                              |
| 6   | Speed Insights `sampleRate`                                                                                                                   | $0 on Hobby; keeps data flowing past about 250 players; avoids Plus at $10 and $0.65 per 10,000 [10]                                                                                                                                | I-66                                                              |
| 7   | `replaysOnErrorSampleRate` below 1.0                                                                                                          | Keeps within 50 replays; avoids Sentry Team ($26–29) for quota alone                                                                                                                                                                | I-66                                                              |
| 8   | Static pages with timed and on-demand revalidation (ISR) for public deck, profile and commander pages                                         | One invocation per revalidation instead of per view, crawlers included. Hobby includes 1 million ISR reads and 200,000 writes [1]                                                                                                   | [I-08](../roadmap.md#i-08-share-compare-and-learn); I-66 measures |
| 9   | An explicit Prisma `connection_limit` in the documented production URL                                                                        | $0; postpones the 200-client pooler ceiling                                                                                                                                                                                         | I-66                                                              |
| 10  | AI: Haiku 5.5, the Batch API, prompt caching                                                                                                  | $0.88 to $0.12 for a 20-build month (I-02 line 129); the Batch API halves the rest [19]                                                                                                                                             | I-30 slice 3, I-02                                                |
| 11  | Card lookups from Scryfall's daily Oracle Cards file instead of server fills                                                                  | No fee saved, since Scryfall charges nothing; fewer server calls to Scryfall; costs about 32.5 MB of JSON in the database [24]                                                                                                      | I-29 slice 1's daily job                                          |

### 9. Break-even under I-30's prices

9.1 The report recomputes, with measured inputs, the number of payers who cover the floor (5.1) and a living. It uses I-30's contribution per payer (I-30 lines 177–178: €2.21 monthly, €1.50 yearly, with typical AI and a lean free tier). From that it subtracts hosting for the payer and the 32.3 free players each payer carries at 3% conversion: 33.3 × $0.0048 = $0.16, about €0.14 (computed).

| Target                                | Monthly €3.99 (contribution €2.07) | Yearly €29.99 (contribution €1.36) |
| ------------------------------------- | ---------------------------------- | ---------------------------------- |
| Floor of €44                          | 22 payers                          | 33 payers                          |
| Floor of €67, with Sentry Team        | 33 payers                          | 50 payers                          |
| Living: I-30's A1 of €2,500, plus €44 | about 1,230 payers                 | about 1,870 payers                 |

9.2 For comparison, I-30's own table needs 1,200 and 1,770 (lines 177–178). The priced floor is under a third of A2, and hosting moves the living-wage count by 2–6%. The figures that decide it remain conversion (A7) and AI per user (A5, A6), which I-30 and I-39 measure.

## Data model / API

```
CostPrice      (committed module, not a table) provider, plan, resource, unit, rate, includedQty?, region?, sourceUrl, readOn
CostMonth      month @id, activePlayers, storedAccounts, payers?, eurPerUsd, complete (bool), generatedAt
CostLine       id, month, provider, service, region?, quantity, unit, costMicroUsd, source (api|cli|manual|computed),
               readOn, note? — unique (month, provider, service, region)
BudgetEvent    id, provider, providerEventId @unique, thresholdPercent, budgetUsd, spendUsd, receivedAt
```

Routes and jobs: `pnpm costs:report --month YYYY-MM` (slice 8, prints only); the job `costs` on I-63's `/api/jobs/[job]`, monthly and daily (slices 9 and 11); `POST /api/webhooks/vercel-budget` (slice 10). Secrets: a read-only Vercel token with the Billing role [12], the team id and the webhook secret. The owner page reuses I-30 slice 10's owner guard.

## Non-goals

- Cost per named player, or any new per-player event, column, cookie or beacon. `AiUsage` stays I-30's.
- A third-party cost or FinOps service, or a new observability vendor (I-05 keeps those parked).
- Leaving Vercel or Supabase. Exit paths are a separate decision; this spec only prices staying.
- Changing AI models, allowances or the AI ceiling (I-30, I-02), choosing the email provider (I-63), deciding what I-59 stores, or adding ads or any other revenue line (I-30 owns revenue).
- Turning features off automatically to save money, apart from I-30's AI ceiling.

## Testing strategy

- **Model (solitary).** Pure functions reproduce the tables in 3.3, 4.1, 5.1 and 9.1 from the price book and the U-values, to the cent. A dated price change recomputes an older month with that month's prices.
- **Report.** FOCUS JSONL fixtures [12] are parsed, filtered to one project and grouped by region. A missing provider yields "not available" and an incomplete total, never zero. The 180-day flag fires.
- **Denominators (sociable, PostgreSQL).** Fixture users with edits, AI rows or neither give the expected active and stored counts. A guard test fails if the report's queries touch a table outside an allowlist of existing ones (`User`, `Deck`, `AiUsage`, `AiMonthlySpend`) and its own cost tables.
- **Headers.** The cache routes send `s-maxage` on hits and fills only; 400, 429 and 502 carry no caching header. The proxy sends the CDN header only with a 200 image.
- **Webhook.** A bad signature is rejected, a duplicate event is stored once, and each threshold alerts once a month.
- **Daily checks.** Fixtures at 69%, 70% and 95% of a quota alert exactly at the thresholds of 7.4.

## Delivery slices

| #   | Slice                                                                                                                                                                   | Depends on                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0   | Owner decisions: today's plans and function region, Pro timing (5.2, 5.3), domain, budget amounts, pause on budget or not; written question to Vercel on commercial use | — (owner; no code)                   |
| 1   | Price book and cost model as pure functions; tests reproduce this spec's tables                                                                                         | —                                    |
| 2   | Measurement script: Vercel usage by project and region, database and table sizes, active and stored accounts, the `next build` route table; prints measured U-values    | 1                                    |
| 3   | CDN caching headers on the two shared-cache routes                                                                                                                      | —                                    |
| 4   | Image proxy: CDN caching header and response bytes in its log line                                                                                                      | —                                    |
| 5   | Speed Insights sample rate and Sentry on-error replay rate, set from slice 2's counts                                                                                   | 2                                    |
| 6   | Function region: compare `durationMs` by route, then set it (dashboard or `vercel.json`, coordinated with I-63 slice 5, which creates the file)                         | 0, 2                                 |
| 7   | Explicit Prisma `connection_limit` in the documented URL; infrastructure doc corrected (500 MB); pooler peak in the report                                              | 2                                    |
| 8   | Monthly report script: all providers, manual entries, denominators, limit table and break-even recomputed                                                               | 1, 2                                 |
| 9   | Stored months (`CostMonth`, `CostLine`) and the cost section of the owner page                                                                                          | 8; I-30 slice 10; I-63 slice 5       |
| 10  | Vercel budget webhook with signature check and `BudgetEvent`                                                                                                            | 0 (Pro chosen)                       |
| 11  | Daily threshold checks: database size, Hobby allotments, early AI thresholds, Speed Insights pause                                                                      | 8; I-63 slice 5; I-30 slice 2 for AI |
| 12  | ISR for public deck, profile and commander pages, with the saving measured                                                                                              | 2; I-08 agrees on its pages          |

Slices 1, 3 and 4 need no decision and no other initiative. Slice 0 is a human decision. Scheduled agents must not pick slices 6 or 10 before its answers are committed.

## Open questions

1. **Which plans does production run on today, and where?** The code assumes Supabase Free (`cache-limits.ts`). The Vercel plan and function region are not in the repository, and new projects default to `iad1` in Washington, D.C., while the database is in Ireland [7].
2. **When to move to Pro.** Vercel Pro is needed at the first payment request or ad (5.2). Supabase Pro is needed for backups (5.3). Does the owner move both before public launch, at about €40–44 a month, or wait for the first paid plan?
3. **Budget amounts.** What on-demand budget for Vercel, and should reaching it pause the site (7.3)? What should the AI ceiling be (I-30 4.6; $20 by default on the unmerged branch)?
4. **Commercial use** (research, not legal advice): does Vercel count I-32's affiliate links or a supporter page as commercial on Hobby? Ask Vercel in writing; add it to I-30 7.2.
5. **Usage APIs.** The pages read do not say whether a Hobby team can call `/v1/billing/charges` or `vercel billing usage`. Supabase and Sentry usage endpoints were not verified.
6. **Domain.** `.com` or `.fr`, and which registrar: Gandi renews a `.com` at €31.98 a year, while at-cost registrars are reported near $10.50 [21][26].
7. **VAT.** Provider prices exclude VAT. Can the owner's legal structure recover it? This is an accountant's question for I-30 7.2.

## Sources

Read 2026-11-10 unless dated otherwise. Vercel's pages carry their own "last updated" date, given here.

1. Vercel, [Pricing](https://vercel.com/pricing), undated.
2. Vercel, [Limits](https://vercel.com/docs/limits), last updated 2026-09-16.
3. Vercel, [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines), last updated 2026-09-14 ("Commercial usage").
4. Vercel, [Regional Pricing](https://vercel.com/docs/pricing/regional-pricing), last updated 2026-09-14.
5. Vercel, [Dublin, Ireland (dub1) pricing](https://vercel.com/docs/pricing/regional-pricing/dub1), last updated 2026-09-14.
6. Vercel, [Fluid compute pricing](https://vercel.com/docs/functions/usage-and-pricing), last updated 2026-06-16.
7. Vercel, [Configuring regions for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/region), last updated 2026-08-11.
8. Vercel, [CDN pricing and usage](https://vercel.com/docs/manage-cdn-usage), last updated 2026-09-14.
9. Vercel, [Vercel CDN Cache](https://vercel.com/docs/caching/cdn-cache), last updated 2026-09-14.
10. Vercel, [Limits and Pricing for Speed Insights](https://vercel.com/docs/speed-insights/limits-and-pricing), last updated 2026-09-23.
11. Vercel, [Spend Management](https://vercel.com/docs/spend-management), last updated 2026-09-18.
12. Vercel, [List FOCUS billing charges](https://vercel.com/docs/rest-api/billing/list-focus-billing-charges), last updated 2026-11-10.
13. Vercel, [vercel billing usage](https://vercel.com/docs/cli/usage), last updated 2026-10-30.
14. Vercel, [Why has my account or deployment been paused?](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked), last updated 2026-10-02.
15. Supabase, [Pricing](https://supabase.com/pricing), undated; the page says "Pricing may change in the future".
16. Supabase, [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk), undated.
17. Supabase, [Database size](https://supabase.com/docs/guides/platform/database-size), undated.
18. Sentry, [Pricing](https://sentry.io/pricing/), undated.
19. Anthropic, [API pricing](https://platform.claude.com/docs/en/about-claude/pricing), re-read 2026-11-10; same figures as I-30's reading of 2026-11-09.
20. Verisign, [RDAP lookup for magicaibuilder.com](https://rdap.verisign.com/com/v1/domain/magicaibuilder.com), HTTP 404 (not registered) on 2026-11-10.
21. Gandi, [.com domain](https://www.gandi.net/en/domain/tld/com), prices before VAT.
22. Gandi, [.fr domain](https://www.gandi.net/en/domain/tld/fr), prices before VAT.
23. Prisma, [Connection pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool), modified 2026-08-25 (the Prisma 6 default).
24. Computed for this spec on 2026-11-10 from Scryfall's [bulk-data endpoint](https://api.scryfall.com/bulk-data) and its Oracle Cards file updated 2026-11-09 22:02 UTC (25,444,300 bytes compressed). The DeckCard row estimate of U12 uses the same file: 32,643 Commander-legal cards, 164 bytes of rules text on average.
25. Measured for this spec on 2026-11-10: 20 random Commander-legal paper cards from [24] (seed 20261110), each downloaded from `cards.scryfall.io` as `normal` JPEG, `grid` WebP and `display` WebP.
26. Third-party comparisons of Cloudflare Registrar prices, for example [CostGoat](https://costgoat.com/pricing/cloudflare-domains), from a search summary; not verified on Cloudflare.
27. Supabase, [Management API reference](https://supabase.com/docs/reference/api/introduction); a search on 2026-11-10 found no organisation usage or cost endpoint.
