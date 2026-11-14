# I-71: Speed, Uptime And Recovery

> **Initiative:** I-71, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 8 (decisions, the guard, the export, the first restore drill, alerts, the runbook and the CI budgets); Later for slices 9 to 12 (field data per route, the collection budget, degraded modes, paid-tier readiness) · **Paid:** nothing here is a paid feature; the paid tier's promises rest on it (requirement 8) · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10, not committed. Every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through [I-38](i38-trust-safety-and-user-rights.md)'s slice 0.
> **Owns:** speed budgets (field Core Web Vitals per route, bundle bytes, query counts, server response times, the large-collection interaction budget) and how CI enforces them; the availability objective and its error budget; alert routing to the owner's phone; the off-site database export, its encryption and retention; the restore drill and the recovery targets; the incident runbook and incident records; the degraded-mode matrix. **Does not own:** the `/api/health` contract and the shared rate-limit store ([I-05](i05-production-safety.md)); the monitor tool and the public status page ([I-52](i52-feedback-loop-players-can-see.md#6-status-line-and-status-page), D-20); plans, prices, the Speed Insights sample rate and budget alerts ([I-66](i66-running-costs-and-margin.md#7-budget-alerts), D-04); the editor's lab latency budget on a 100-card deck ([I-37 1.2 and 1.3](i37-editor-depth.md#1-beautiful-measured)); the mobile Lighthouse run ([I-40 3.3](i40-installable-app-and-card-scanning.md#3-phone-journeys-and-their-gate)); Scryfall fallback ([I-67 §5](i67-one-card-data-pipeline.md#5-failure-and-fallback)); the copilot-off rule ([I-02 6.3](i02-checkable-ai-copilot.md#6-disclosure-of-ai-use)); the job route and its stale-job alert ([I-63 §10](i63-one-notification-system.md#10-scheduled-jobs)); the offline deck cache ([I-19](i19-offline-game-night-viewing.md)).
> **Proposed changes to neighbours, for the integrator:** I-05 gains one line pointing here for budgets, alerts, backups and the runbook. I-52's "Does not own" names I-71, not I-05, for alerting. I-30 slice 9, the first paid entitlements, depends on I-71 slice 12. D-04 gains an option (f): point-in-time recovery yes or no. `legal-questions.md` gains the retention question in open question 4.

## Overview

Three questions have no answer today. Is the site fast for real players, route by route? Would the owner know within minutes that it is down? If the database were lost tonight, what would come back, and how long would it take?

The code has parts of the answer. Speed Insights collects field data, Sentry reports errors, `/api/health` checks the database, and Lighthouse CI scores three public pages. Nothing turns them into budgets, alerts or a recovery plan. Production runs on Supabase Free, which keeps no backups [14]. No export, no restore drill, no monitor and no runbook exist. `docs/engineering/infrastructure.md` documents `npx prisma db push --force-reset` against production, so one mistyped command would erase every deck with no way back.

**Why a new initiative rather than I-05 scope.** I-05 is the "Now" list of production defects and gates. Of the scope asked for here, it covers the health route, Sentry, the Lighthouse workflow and, through I-52, the monitor and status page. It has no item on field Core Web Vitals, bundle or response budgets, an availability target, alert routing, backups, recovery targets, a runbook or degraded modes. Those are more than two thirds of the topic and need their own slices so scheduled agents can pick them. I-71 links I-05, I-52, I-66 and I-37 for what they already own and repeats none of it.

Order: recovery first, because data loss is the only failure here that cannot be undone. Alerts come second, then budgets that CI can enforce, then field data.

## What the market does

All rows read on 2026-11-10.

**Incumbents publish no status page.** A DNS lookup found no `status.` host for Moxfield, Scryfall, Archidekt, EDHREC or Commander Spellbook [24]. The home pages of EDHREC, Archidekt and Commander Spellbook served HTML with no link containing "status"; Moxfield answered 403 to an automated read, so for Moxfield this is "not found", not "absent" [24]. Scryfall's documentation footer links Bluesky, GitHub, Patreon and its bots, and no status page [23]. Web searches for outages at Moxfield, Scryfall and Archidekt returned only third-party "is it down" pages, which are not used here. The infrastructure under this product does publish status pages: Vercel, Supabase, Anthropic and OpenAI each answered HTTP 200 [25].

**Speed is discussed in prose.** EDHREC's changelog of 2026-11-06 says that after its redesign "some users were experiencing slower load times and lag across the site", that Firefox users with hardware acceleration off saw lag, and that card images "were sometimes slow to load as they were being deferred until they were on-screen". It lists fixes but gives no load time or Core Web Vital, and it mentions no outage [22].

**Google's thresholds.** "Good" means LCP within 2.5 s, INP of 200 ms or less and CLS of 0.1 or less, at the 75th percentile of page loads, "segmented across mobile and desktop devices" [1]. TTFB is not a Core Web Vital; good is 0.8 s or less, poor above 1.8 s [2]. Vercel uses the same targets and adds FCP at 1.8 s [4].

**Field-data options.**

| Option                                     | Cost                                                                           | What it shows                                                                                                                  | Limits                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Speed Insights, free (installed) [3][4]    | $0 on every plan; 10,000 events over a rolling 30 days, shared across the team | "Real Experience Score (RES) only"; path and route counts "with Great and Needs Improvement entries only"; 24 hours and 7 days | Pauses collection for at least 14 days at the limit; data only on hard navigations, in Next.js "the first-page view in a session" |
| Speed Insights Plus [3]                    | Pro only: $10 per project a month and $0.65 per 10,000 events                  | Every Core Web Vital, Poor entries, countries, element selectors, 30 days, Drains                                              | Needs Vercel Pro, which D-04 has not decided                                                                                      |
| Self-reported: `useReportWebVitals` [5][6] | $0 in licences; one function call per beacon and a few rows a day              | TTFB, FCP, LCP, INP and CLS with a `rating`; the metric object carries a `soft-navigation` type and the navigation's URL       | The product builds the store and the p75 view; a browser beacon is legal question L-13 (b)                                        |
| CrUX / PageSpeed Insights field data [7]   | $0                                                                             | Google's own field data                                                                                                        | Only for pages that are publicly discoverable and "sufficiently popular"; the threshold is not disclosed                          |

The `web-vitals` library is about 3 KB brotli, Apache 2.0, and recommends `navigator.sendBeacon` on `visibilitychange` [5].

**Uptime checks and alerts to a phone.**

| Tool                   | Free                                                                                                                                                | Paid                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| UptimeRobot [9]        | 50 monitors at 5 minutes; iOS and Android app included; Discord and Pushover among five integrations; no SMS or voice credits included              | Solo €9 a month billed yearly: 60-second checks, 10–20 SMS or voice credits      |
| Sentry uptime [10][11] | One uptime monitor on the free Developer plan; intervals from 1 minute to 1 hour; regions in turn; an issue after 3 consecutive failures by default | $1.00 per additional uptime alert; alerts by email, Slack and other integrations |
| Healthchecks.io [12]   | 20 jobs, 100 log entries each (heartbeats for scheduled jobs)                                                                                       | Business $20 a month with 50 SMS and 20 phone-call credits                       |

Status-page tools and their prices are in [I-52's table](i52-feedback-loop-players-can-see.md#what-the-market-does) and are not repeated.

**Recovery on the current providers.**

| Provider and plan         | Backups                                                                                                                                                                                                     | Point-in-time recovery and logs                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase Free [14][15]    | "Not included". Supabase recommends that free projects "regularly export their data" with `db dump` and "maintain off-site backups"                                                                         | Not available. Projects pause after a week of inactivity                                                                                                                 |
| Supabase Pro [14][15][16] | From $25 a month: daily backups kept 7 days (Team 14, Enterprise 30)                                                                                                                                        | Add-on: about $100 a month for 7 days, $200 for 14, $400 for 28; worst-case RPO of two minutes; billed hourly and outside the spend cap; enabling it stops daily backups |
| Supabase, any plan [15]   | Backups exclude Storage objects. Deleting a project also deletes its backups. The project "is inaccessible" during a restore                                                                                | —                                                                                                                                                                        |
| Vercel [18][19]           | Hobby can roll back to the immediately previous deployment, Pro to any earlier production one; rollback turns off automatic production assignment until undone and leaves environment variables as they are | Runtime logs are kept 1 hour on Hobby and 1 day on Pro                                                                                                                   |

Neither provider sells an uptime SLA below Enterprise: Vercel's pricing page mentions "platform SLAs" only for Enterprise, with no percentage [13], and Supabase lists uptime SLAs as Enterprise only [14]. Off-site storage is cheap: Cloudflare R2 gives 10 GB-month free, then $0.015 per GB-month, with free egress [20]. GitHub artifacts are downloadable by anyone with read access to the repository [21]; this repository is public ([I-52](i52-feedback-loop-players-can-see.md#current-state-in-this-codebase)).

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Field data.** `package.json` has `@vercel/speed-insights` `^2.0.0`; `<SpeedInsights />` sits in `src/app/[locale]/layout.tsx` with no `sampleRate`, and `src/lib/security-headers.ts` allows its endpoint. No `web-vitals` dependency and no `useReportWebVitals` call exist. On the free tier the dashboard cannot show a per-metric p75 or a Poor entry [3], so no Core Web Vital can be checked against a threshold today. No budget is written anywhere in `docs/`.
- **Sentry.** `@sentry/nextjs` `^10.78.0`; `tracesSampleRate: 0.1` in `sentry.server.config.ts`, `sentry.edge.config.ts` and `src/instrumentation-client.ts`; replays at 1% and on every error; `onRequestError` in `src/instrumentation.ts`; `automaticVercelMonitors: true` in `next.config.ts`. No alert rule is recorded in the repository or the docs.
- **Lighthouse CI.** `.github/workflows/lighthouse.yml` (job "Performance, a11y and SEO audit") builds without a database and runs `lhci autorun`. `lighthouserc.yml` audits `/`, `/fr` and `/auth/signin` with the desktop preset, three runs each, and asserts category scores only: performance at least 0.9, accessibility, best practices and SEO at least 0.95, against a baseline of 97/97/98 measured on 2026-08-21. It has no metric assertion (LCP, CLS, TBT), no resource budget and no `aggregationMethod`. Its comment says "Median of three", but LHCI documents `optimistic` as the default when no options are set and does not say which applies when only `minScore` is set [8]. The last 30 runs all passed. Only `main` is protected, requiring "Lint, Typecheck, Test, Build"; `dev` and `staging` have no protection, so Lighthouse blocks no merge [26].
- **Bundle.** `@next/bundle-analyzer` runs only with `ANALYZE=true` (`pnpm analyze`). `ci.yml` builds but asserts no size. The landing page loads its Three.js scene by dynamic import, on desktop only (`docs/engineering/technical.md`).
- **Server.** No `vercel.json`, so the function region is the dashboard's (I-05's owner question). `/api/ai/build` sets `maxDuration = 60` and a 45-second provider timeout. Duration logging exists for `GET /api/decks`, profile writes and the search cache (I-05). No route has a response budget or a query-count check.
- **Large collections.** `GET /api/collection` (`src/app/api/collection/route.ts`) returns every row, with no `take`. `CollectionPageClient.tsx` filters the whole array and renders it twice with `filtered.map`, with no virtualisation. I-62 accepts imports of up to 50,000 collection rows; I-43 tests at 20,000.
- **Health and monitoring.** `src/app/api/health/route.ts` runs `SELECT 1` and answers 200 or 503; its comment says it is "Used by uptime monitors". No monitor is configured (I-05, I-52), although `docs/engineering/dx-ci-overview.md` lists UptimeRobot every 5 minutes.
- **Backups.** `scripts/` holds no export, dump or restore script, and `.github/workflows/` no scheduled workflow (only Dependabot has a schedule). `dx-ci-overview.md` puts production on Supabase's free tier. `docs/engineering/infrastructure.md` says production may have no migration history, uses `db push` for schema changes, and gives `npx prisma db push --force-reset` under "Production (Supabase / Neon)". The schema has 30 models; `CardCache`, `ScryfallSearchCache` and `MetaCache` are caches. `src/` uses no Supabase SDK or Storage, so the Postgres database is the only state.
- **Degraded behaviour.** Scryfall: `src/lib/scryfall/client.ts` throws `Scryfall API error <status>`. Commander Spellbook: `/api/combos` answers 504 on timeout and 502 otherwise with `{"error":"Combo lookup unavailable"}`; its cache (`src/lib/combos/combo-cache.ts`) lives in each instance's memory for 6 hours and deletes expired entries, so nothing stale is served on failure. AI: `/api/ai/build` picks Anthropic when its key is set, else OpenAI, else a demo deck; a provider error ends in "AI deck build failed", with no switch to the other provider. Database: no read-only mode; pages that read Prisma fall to `src/app/[locale]/error.tsx`; signed-in edits roll back with a retry ([I-01](../roadmap.md#i-01-deck-editor-workflow)); the guest deck is held in `localStorage` (`src/lib/deck/guest-deck.ts`) and needs no database.
- **Runbook.** No runbook, incident record, recovery time or data-loss target exists in `docs/`.

## Functional requirements

### 1. Speed budgets from real players

1.1 **Thresholds.** A route meets its budget when its p75 over the last 28 days, for mobile and for desktop separately, is "good" under Google's thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 [1]. TTFB (0.8 s) and FCP (1.8 s) are shown as diagnostics, not budgets [2][4].
1.2 **Key routes.** `/` and `/fr` (LCP; first visit), `/deck/[id]` and `/share/[token]` (LCP and CLS; shared links), `/commanders/[slug]/decks` (LCP; public listing), `/builder/[deckId]` (INP; the editor), `/decks` and `/collection` (INP), `/auth/signin` (LCP). The list lives in one constant used by the beacon, the owner view and the tests.
1.3 **Field source.** While production is on Vercel Hobby, the free Speed Insights stays for its Real Experience Score and a first-party beacon supplies per-metric p75 (slice 9). Speed Insights Plus is reconsidered only if D-04 moves to Pro and the owner prefers paying $10 a month to keeping the beacon [3].
1.4 **The beacon.** A client component calls `useReportWebVitals` [6] and sends, with `sendBeacon`, only: metric name, value, rating, route template (never the concrete path), navigation type, a device class from a viewport bucket (below 768 px is mobile; proposal), and the build id. No user id, cookie, storage, query string or IP address is kept, as [I-39 8.5](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation) requires of guest beacons.
1.5 **Storage without raw rows.** `POST /api/vitals` adds each value to a daily histogram per route, metric and device class, and stores nothing per visit. The p75 is computed from the histogram.
1.6 **Consent first.** The beacon stays off in production until legal question [L-13 (b)](../legal-questions.md#l-13-audience-measurement-error-replay-and-device-reads) is answered (research, not legal advice).
1.7 **Owner view.** p75 per route, metric and device class, with the sample count. Below 100 samples a cell shows the count and "too few", in the spirit of [I-39 11.9](i39-first-run-activation-and-measurement.md#11-metrics-defined-to-be-computed).
1.8 A route over budget for 7 consecutive days sends one email to the owner (requirement 3.5) and lists the route in the monthly review (requirement 7).

### 2. Budgets CI enforces without flakiness

2.1 **Deterministic budgets block every PR.** Measures that do not depend on timing (compressed JavaScript per route, Prisma queries per request) fail the required CI job when over budget. They cannot flake, so they need no retry.
2.2 **Bundle budget.** After `next build`, a script sums the compressed JavaScript each key route loads first and compares it with `perf-budgets.json`. Slice 7 records today's values; each budget starts at the measured value plus 10 KB (proposal). Raising a budget means editing that file, so the change and its reason appear in review.
2.3 **Query budget.** On a seeded PostgreSQL fixture (a 100-card public deck, a 20,000-row collection, ten public decks for one commander), a sociable test counts Prisma queries per request for `GET /api/decks`, `GET /api/deck/[id]`, `GET /api/collection` and the server render of `/deck/[id]`, and fails above the budget slice 8 records.
2.4 **Lighthouse, explicit and wider.** `lighthouserc.yml` sets `aggregationMethod: median-run` [8], so the comment and the behaviour agree. An `assertMatrix` adds LCP ≤ 2,500 ms and CLS ≤ 0.1 per URL [1][8]. A PostgreSQL service with the slice 8 seed lets the job audit `/deck/[id]` and `/commanders/[slug]/decks`. I-40 3.3 adds the mobile preset.
2.5 **Timing budgets.** Lighthouse metrics and Playwright INP runs (I-37 1.2 on the editor, 2.6 here on the collection) use the median of several runs and a fixed CPU slowdown, as I-37 states. A failure is re-run once inside the job; only a second failure fails it. Every run's numbers are kept as an artifact, so a drift is visible before it fails.
2.6 **Large collection.** On the 20,000-row fixture, typing in the filter, changing a quantity and opening a card each have an INP of 200 ms or less at p75 under I-37's harness settings, and the first rows appear within 2.5 s. This needs a paginated `GET /api/collection` and a virtualised list; the row caps stay I-05 M3's.
2.7 **Server response budgets, measured in production.** Over 7 days, p95 per API route from the logged durations and Sentry's 10% traces: reads at most 500 ms, writes at most 1,000 ms, `/api/health` at most 300 ms; document TTFB at p75 within 0.8 s on the key routes [2]. The AI routes are excluded (streamed, `maxDuration` 60). The numbers are proposals, confirmed or changed once [I-66 slice 6](i66-running-costs-and-margin.md#delivery-slices) has measured durations by route; a breach on every database route points first to I-05's region question. CI never times a live service: it enforces query counts (2.3) instead.
2.8 **Which checks block.** The owner decides in slice 0 whether the Lighthouse job becomes a required check on promotion PRs into `staging` and `main` (open question 5).

### 3. Availability objective and alerts

3.1 **Objective.** 99.5% of each calendar month, which allows 216 minutes of downtime in a 30-day month (computed). It is an internal objective with a public history, not an SLA: no credits, no contract.
3.2 **How it is measured.** Two external checks at least every 5 minutes: `/api/health` (database path), owned by [I-52 slice 1](i52-feedback-loop-players-can-see.md#delivery-slices), and `/` with an expected keyword (CDN and render path), added here. A check interval counts as down when either check fails.
3.3 **Error budget.** When a month exceeds 216 minutes, the next merge batch into `dev` carries only reliability fixes, and the monthly review records why.
3.4 **Phone alert for "down".** An alert reaches the owner's phone within 15 minutes of an outage's start and never on a single failed check (two consecutive failures at 5-minute checks: 5 to 10 minutes, computed). The free path is the monitor's mobile app or a Pushover or Discord integration [9]; SMS and voice need purchased credits [9].
3.5 **Everything else is email.** New Sentry issues in production above a rate set in slice 4, I-66's budget alerts ([I-66 §7](i66-running-costs-and-margin.md#7-budget-alerts)), stale card data ([I-67 5.3](i67-one-card-data-pipeline.md#5-failure-and-fallback)), a failed export (4.6) and speed budgets (1.8) arrive by email, at most one per alert per day. Only "site down" and "export missing" may wake the owner.
3.6 Each alert's text names its runbook section (requirement 5.1).
3.7 **Test.** Once a quarter, during the restore drill, a test alert is sent and its arrival on the phone is recorded.

### 4. Backups, export and restore

4.1 **Targets.** Data loss (RPO) at most 24 hours; time to restore service (RTO) at most 4 hours, measured in each drill. Point-in-time recovery (worst-case RPO of two minutes, about $100 a month [15][16]) is an owner decision under D-04, not a requirement.
4.2 **Daily off-site export.** Once a day, a job outside Vercel and Supabase dumps the `public` schema: all structure, and all data except the three cache tables. Supabase's own guide gives the commands [17]. Slice 0 chooses the runner: a scheduled GitHub workflow or a cron job on the VPS.
4.3 **Encrypted before it leaves the runner.** The dump holds emails, password hashes, OAuth tokens in `Account` and API-key records. It is encrypted with the owner's public key; the private key is kept offline and is never a CI secret.
4.4 **Never in the repository or its artifacts.** The repository is public and artifacts are downloadable with read access [21]. A test fails if the workflow uploads an artifact.
4.5 **Destination and retention.** Object storage under an account separate from Vercel and Supabase, such as Cloudflare R2 (10 GB-month free [20]). Keep 14 daily, 8 weekly and 12 monthly exports (proposal). At the 500 MB database limit, about 4.3 GB if a dump compresses 4 to 1 (estimate). The store is a processor listed in [I-38](i38-trust-safety-and-user-rights.md) slice 6's privacy policy.
4.6 **Manifest and heartbeat.** Each export writes a manifest: time, size, SHA-256, row counts per table, and the newest migration name. A missing export after 26 hours, a size drop above 20%, or a non-cache table falling to zero rows alerts the owner. The heartbeat lives outside the database it watches (Healthchecks.io [12] or a Sentry cron monitor [11]).
4.7 **Supabase backups are extra.** If D-04 moves to Pro, its 7-day daily backups add to the export and do not replace it: deleting a project deletes its backups [15].
4.8 **Guard destructive commands.** A `pnpm` script for production schema changes takes an export first and refuses `--force-reset` and `migrate reset` when the host is production. The "Production" reset section of `docs/engineering/infrastructure.md` is removed.
4.9 **Additive migrations.** Hobby can roll back only to the previous deployment, and Vercel's rollback dialog warns that databases may have changed since [18]. A column or table is dropped or renamed only in a promotion after the one that stops reading it, so the previous deployment still runs.
4.10 **Restore drill, quarterly.** Restore the newest export into a scratch database (local Docker PostgreSQL or a throwaway Supabase project), compare row counts with the manifest, diff the schema against `prisma/schema.prisma`, start the app against it and pass a smoke script: sign in with a test account, open a deck, open the collection. Record the date, the export used, the time taken and any problem in `docs/engineering/restore-drills.md`. A failed drill opens a "Now" item in I-05.
4.11 **Accounts are part of recovery.** Supabase, Vercel, the storage account, the registrar (D-02) and GitHub have two-step sign-in, with recovery codes kept offline beside the decryption key. Each drill checks that the recovery codes and the decryption key still work.
4.12 **Erasure survives a restore.** Once [I-38](i38-trust-safety-and-user-rights.md) slice 2's deletion tombstone exists, a restore re-applies every account deletion recorded after the export's time before the database serves players, and the drill checks it with a test account deleted after the export.

### 5. Incident runbook for one person

5.1 `docs/engineering/runbook.md` has one section per scenario: site down; database unreachable; database paused; bad deployment; data lost or corrupted; Scryfall down; Commander Spellbook down; AI provider down or over its ceiling; leaked secret; Vercel usage limit or paused deployment ([I-66 7.3](i66-running-costs-and-margin.md#7-budget-alerts)). Each section gives symptoms, the first three checks, the action, what players are told, and when it is over.
5.2 **First checks.** The upstream status pages (Vercel, Supabase, Anthropic, OpenAI [25]), Sentry, then Vercel's runtime logs, which Hobby keeps for one hour [19], so evidence is copied before it expires.
5.3 **Bad deployment.** Instant Rollback first, then fix forward. The runbook states that rollback turns off automatic production assignment until a deployment is promoted again, and that it does not restore environment variables [18].
5.4 **Telling players.** A `StatusNotice` ([I-52 6.6](i52-feedback-loop-players-can-see.md#6-status-line-and-status-page)) is published within 30 minutes of an outage that players can see.
5.5 **Incident record.** Any incident with more than 10 minutes of player impact gets a short record in `docs/engineering/incidents/`: start, detection, end, impact, cause, follow-ups. The status page shows its one-line cause (I-52 6.2).
5.6 **Away from the keyboard.** Before three or more days away, the owner freezes promotions to `main` and confirms that a test alert reaches the phone.

### 6. Degraded modes

6.1 Each dependency has a stated degraded mode and a test that mocks it down.

| Dependency          | Today on `dev`                                | Required degraded mode                                                                                                             | Owner                                                                                                                                                                           |
| ------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scryfall            | Errors from the client                        | Reads from local tables; stale data labelled after 72 hours                                                                        | [I-67 §5](i67-one-card-data-pipeline.md#5-failure-and-fallback)                                                                                                                 |
| Commander Spellbook | 502 or 504, "Combo lookup unavailable"        | The last good result, up to 7 days old, served with its date and a retry; never an empty "no combos"                               | I-71 slice 11, inside [I-09](i09-meta-and-evidence.md)'s integration                                                                                                            |
| AI provider         | "AI deck build failed"; no switch of provider | An "unavailable" state linking to the status page; deterministic surfaces untouched; no allowance consumed                         | [I-02 6.3](i02-checkable-ai-copilot.md#6-disclosure-of-ai-use), [I-30 4.4](i30-business-model-and-paid-tier.md#4-ai-metering-and-quotas-production-safety-ships-before-billing) |
| Database            | Error page; edits roll back                   | Static pages keep serving; the editor shows "Saving paused" and disables writes; the guest deck and I-19's cached deck stay usable | I-71 slice 11; [I-19](i19-offline-game-night-viewing.md)                                                                                                                        |
| Vercel              | Nothing                                       | The status page stays up off the production stack                                                                                  | [I-52 6.2](i52-feedback-loop-players-can-see.md#6-status-line-and-status-page)                                                                                                  |
| Sentry              | Logging never throws (`src/lib/logger.ts`)    | Unchanged                                                                                                                          | —                                                                                                                                                                               |

6.2 The Spellbook result store is shared across instances (a database cache like #1322's), not per-instance memory.
6.3 Whether the copilot fails over to the second provider when both keys exist is an owner decision (open question 6). A failover must not double-charge the allowance.

### 7. Monthly review

7.1 One page a month, kept with I-66's monthly cost report: availability against 99.5%, incidents, p75 per key route, budgets changed and why, export health and the last drill's date.

### 8. Free and paid

8.1 Every player gets the same uptime, speed and backups. Nothing here is a paid feature, and no budget is relaxed for free players.
8.2 **What a paid tier implies.** A charge creates an expectation of continuity. Before [I-30](i30-business-model-and-paid-tier.md) slice 9 takes a first payment: a restore drill has passed in the last 90 days; the status page and its 90-day history are live (I-52); the 99.5% objective and its monthly history are published; incident records exist for every qualifying incident; players can export their own data ([I-38 §7](i38-trust-safety-and-user-rights.md#7-full-data-export)).
8.3 **No promise beyond the providers.** Vercel and Supabase offer uptime SLAs only on Enterprise [13][14], so the product promises an objective and transparency, never credits.
8.4 **Why it can sell.** None of the incumbents read publishes a status page or a speed figure (market section). A public uptime history, "backed up daily off-site, restore tested every quarter", and per-route speed figures are trust signals a cheap subscription can show and free competitors do not. Paid features such as [I-31](i31-deck-lab.md)'s Deck Lab meet the same budgets.

## Data model / API

```
WebVitalDaily  day Date, route String (template from the key-route list), metric (LCP|INP|CLS|TTFB|FCP),
               device (mobile|desktop), buckets Int[] (fixed edges per metric), count Int
               -- unique (day, route, metric, device); rows older than 400 days deleted
```

Routes: `POST /api/vitals` (beacon; allowlisted routes and metrics; no identifiers; limited per IP in memory until I-05 M2's store; answers 204); `GET /api/owner/vitals` (owner only; p75 and counts). Export runs and drills are not stored in the database they protect: the manifest sits beside each export, and drills are recorded in `docs/engineering/restore-drills.md`. Files: `perf-budgets.json`, `lighthouserc.yml`, `scripts/check-bundle-budget.mjs`, `scripts/db-export.sh`, `scripts/db-restore-drill.sh`, `docs/engineering/runbook.md`, `docs/engineering/incidents/`.

## Non-goals

- A contractual SLA, service credits or a promised response time.
- PagerDuty, Datadog, Grafana, OpenTelemetry or Better Uptime, which I-05 parks until usage justifies them.
- Multi-region hosting, a standby database or automatic database failover.
- An offline write queue for the editor; I-19 stays read-only.
- Any third-party RUM script beyond the Speed Insights already installed ([I-39 8.1](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation)), and any per-visit or identifying vitals row.
- Choosing the monitor or building the status page (I-52); choosing plans or their timing (I-66, D-04).
- Load tests beyond the fixtures; they wait for measured traffic.

## Testing strategy

- **Beacon (sociable):** unknown routes, metrics or extra fields are rejected; a concrete path never reaches the table; no stored column can hold an identifier; histogram p75 matches a sorted-array p75 within one bucket (property test); "too few" below 100 samples.
- **Bundle budget (solitary):** the script fails one byte over a budget and passes at it, on fixture manifests; no network.
- **Query budget (sociable, PostgreSQL in Docker):** query counts per route on the seed; an injected N+1 fails.
- **Lighthouse config:** a test parses `lighthouserc.yml` and fails unless `aggregationMethod` is set and every URL has LCP and CLS assertions.
- **Collection budget:** Playwright on the 20,000-row fixture with I-37's harness.
- **Export:** against local PostgreSQL, export, encrypt, decrypt and restore into a fresh database; row counts equal the manifest; cache tables are empty; the job refuses to write an unencrypted file; the workflow contains no artifact upload.
- **Guard:** the production schema script refuses `--force-reset` and `migrate reset` for a production host.
- **Degraded modes:** each dependency mocked down; the UI state of 6.1 is asserted; Spellbook serves a dated stale result.
- **Drills and alerts:** manual, recorded in `restore-drills.md` with the phone-alert check.

## Delivery slices

| #   | Slice                                                                                                                                        | Depends on                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0   | Owner decisions: objective, RPO and RTO, export runner and storage account, phone channel, field-data option, Lighthouse as a required check | — (owner; no code)                  |
| 1   | Destructive-command guard, the production reset section removed, an on-demand export documented                                              | —                                   |
| 2   | Daily encrypted off-site export with manifest, retention, heartbeat and size-drop alert                                                      | 0                                   |
| 3   | First restore drill, `restore-drills.md`, RTO measured                                                                                       | 2                                   |
| 4   | Alert routing: phone alert for "down", page check of `/`, Sentry issue alerts by email                                                       | 0; I-52 slice 1                     |
| 5   | Runbook, incident record template, additive-migration rule in `infrastructure.md`                                                            | 3, 4                                |
| 6   | Lighthouse: explicit aggregation, LCP and CLS per URL, the retry-once rule                                                                   | —                                   |
| 7   | Bundle budget script, `perf-budgets.json`, CI step                                                                                           | —                                   |
| 8   | Seeded fixture, query budgets, Lighthouse audits of `/deck/[id]` and `/commanders/[slug]/decks`                                              | 6                                   |
| 9   | First-party vitals beacon, `WebVitalDaily`, owner p75 view, over-budget email                                                                | L-13 (b) answered (I-38 slice 0); 4 |
| 10  | Paginated collection API, virtualised list, 20,000-row INP budget                                                                            | 8; I-37 slice 1                     |
| 11  | Degraded modes: dated Spellbook fallback, "Saving paused" on database failure, copilot "unavailable" state                                   | —; I-52 slice 2 for the status link |
| 12  | Paid-tier readiness check (8.2), consumed by I-30 slice 9                                                                                    | 3, 4, 5; I-52 slice 2               |

Slices 1, 6 and 7 need nothing and can start today. Slice 2 needs only the owner's choice of runner and storage. Slice 9 must not ship before the legal answer; scheduled agents must not pick it earlier.

## Open questions

1. **Point-in-time recovery, and when to leave Free.** Is a 24-hour RPO acceptable for players' decks, or does the first paid plan bring Pro's daily backups and PITR at about $100 a month [15][16]? This joins [D-04](../owner-decisions.md#d-04-hosting-plans-region-and-budget). Recommendation: the export now, Pro at the first payment as I-66 already proposes, PITR only when revenue covers it.
2. **Export runner.** A scheduled GitHub workflow runs off the owner's machine, but I-52 found that scheduled workflows in a public repository are disabled after 60 days without activity, and whether the runner reaches Supabase's direct connection or needs the session pooler [17] must be tested. The VPS cron avoids both but shares a machine already short of memory (I-05). Which one?
3. **Objective.** Is 99.5% right for the free period, and does the paid tier publish 99.5% or aim for 99.9% (43 minutes a month, computed) on providers that promise nothing below Enterprise?
4. **For the lawyer (research, not legal advice; [L-48](../legal-questions.md#l-48-erased-accounts-in-encrypted-exports), through I-38 slice 0):** an erased account survives in encrypted exports for up to 12 months under 4.5. Is that compatible with the right to erasure when every restore re-applies later deletions (4.12), and must the privacy policy state the export's retention?
5. **Blocking checks.** Should the Lighthouse job become required on promotion PRs into `staging` and `main`, where a flaky timing check costs least?
6. **AI failover.** Should the copilot switch to the second provider on a provider error, given I-02's per-model evaluation and I-30's per-call metering?

## Sources

All read on 2026-11-10 unless stated.

1. web.dev, [Web Vitals](https://web.dev/articles/vitals), last updated 2024-10-31.
2. web.dev, [Time to First Byte](https://web.dev/articles/ttfb), last updated 2025-11-18.
3. Vercel, [Limits and Pricing for Speed Insights](https://vercel.com/docs/speed-insights/limits-and-pricing), last updated 2026-09-23.
4. Vercel, [Speed Insights Metrics](https://vercel.com/docs/speed-insights/metrics), last updated 2026-09-01.
5. Google Chrome, [`web-vitals` README](https://github.com/GoogleChrome/web-vitals).
6. Next.js, [`useReportWebVitals`](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals), last updated 2026-10-05.
7. Chrome for Developers, [CrUX methodology](https://developer.chrome.com/docs/crux/methodology).
8. Lighthouse CI, [Configuration: assert](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md).
9. UptimeRobot, [pricing (markdown version, EUR prices)](https://uptimerobot.com/pricing.md).
10. Sentry, [Uptime Monitoring](https://docs.sentry.io/product/uptime-monitoring/).
11. Sentry, [Pricing](https://sentry.io/pricing/).
12. Healthchecks.io, [Pricing](https://healthchecks.io/pricing/).
13. Vercel, [Pricing](https://vercel.com/pricing).
14. Supabase, [Pricing](https://supabase.com/pricing).
15. Supabase, [Database Backups](https://supabase.com/docs/guides/platform/backups).
16. Supabase, [Manage Point-in-Time Recovery usage](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery).
17. Supabase, [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
18. Vercel, [Performing an Instant Rollback](https://vercel.com/docs/instant-rollback), last updated 2026-07-07.
19. Vercel, [Runtime Logs](https://vercel.com/docs/logs/runtime), last updated 2026-08-28.
20. Cloudflare, [R2 pricing](https://developers.cloudflare.com/r2/pricing/), last updated 2026-10-30.
21. GitHub Docs, [Downloading workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).
22. EDHREC, [Changelog: Big Performance Upgrades](https://edhrec.com/articles/changelog-big-performance-upgrades), 2026-11-06, Garrett Gardner.
23. Scryfall, [API documentation: Errors](https://scryfall.com/docs/api/errors), page footer.
24. DNS lookups made for this spec on 2026-11-10 found no record for `status.moxfield.com`, `status.scryfall.com`, `status.archidekt.com`, `status.edhrec.com` or `status.commanderspellbook.com`. The home pages [edhrec.com](https://edhrec.com/), [archidekt.com](https://archidekt.com/) and [commanderspellbook.com](https://commanderspellbook.com/) answered HTTP 200 with no link containing "status"; [moxfield.com](https://moxfield.com/) answered 403.
25. Upstream status pages, each answering HTTP 200: [Vercel](https://www.vercel-status.com/), [Supabase](https://status.supabase.com/), [Anthropic](https://status.claude.com/) (redirected from `status.anthropic.com`), [OpenAI](https://status.openai.com/).
26. GitHub REST API for `KaelSensei/MagicAIBuilder`: branch protection of `dev`, `staging` and `main`, and the last 30 runs of `lighthouse.yml`.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

### Goals

- A restore from the newest off-site export into a scratch database passes the smoke script within four hours and is recorded; a test alert reaches the owner's phone; no documented command can reset production; and a pull request that pushes a key route's JavaScript or queries past its budget fails CI.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-71-01

As a player, I want the deck to survive a database mistake, so that a bad command cannot empty production.

#### US-71-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-71-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-71-01 Happy path

Given a signed-in player and the English locale
When the documented reset command refuses to run against production.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-71-02 Happy path

Given a signed-in player and the English locale
When a daily encrypted export exists, or the owner has not yet chosen the store and the slice says so.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-71-03 Happy path

Given a signed-in player and the English locale
When a restore drill has been run on a copy, not only described.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-71-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-71-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-71-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Internal. No player flag. The guard ships before new product surface that writes decks.

#### AC-71-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-71-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-71-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Players see a maintenance banner when the site is read-only. They do not see the backup.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

An encrypted dump. The store is the owner's choice. Alerts go to the owner, not to a player's inbox.

### Analytics and telemetry

`backup_finished {restored_in_drill: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Internal. No player flag. The guard ships before new product surface that writes decks.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

A 24-hour loss target, and whether point-in-time recovery waits for revenue, are owner questions.

### Sources

- https://supabase.com/pricing
- https://vercel.com/docs/speed-insights/limits-and-pricing

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-71-101

As a player, I want the product to slice 0, no code: the 99.5% objective, a 24-hour data-loss target and a 4-hour restore target, the export runner (a scheduled GitHub workflow or the VPS) and its storage account, the phone channel, the field-data option, and whether Lighthouse becomes a required check on promotion PRs., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slice 0, no code: the 99.5% objective, a 24-hour data-loss target and a 4-hour restore target, the export runner (a scheduled GitHub workflow or the VPS) and its storage account, the phone channel, the field-data option, and whether Lighthouse becomes a required check on promotion PRs. Point-in-time recovery is option (f) of D-04.

#### AC-71-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-71-102

As a player, I want **Owner awareness, now: a production reset with no backup.** docs/engineering/infrastructure.md lines 348 to 364 give npx prisma db push --force-reset against the production DATABASE_URL, while production on Supabase Free keeps no backups and no export exists (verified on origin/dev at 72fbfc1)., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner awareness, now: a production reset with no backup.** docs/engineering/infrastructure.md lines 348 to 364 give npx prisma db push --force-reset against the production DATABASE_URL, while production on Supabase Free keeps no backups and no export exists (verified on origin/dev at 72fbfc1). Slice 1 guards it: a pnpm script for production schema changes takes an export first and refuses --force-reset and migrate reset for a production host, and the "Production" reset section is removed.

#### AC-71-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-71-103

As a player, I want the product to a daily export of the public schema, all data except the three cache tables, encrypted with the owner's public key before it leaves the runner and never uploaded as a workflow artifact of this public repository, kept 14 daily, 8 weekly and 12 monthly in object storage outside Vercel and Supabase, with a manifest and a heartbeat that alerts on a missing export, a 20% size drop or an empty table (slice 2)., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A daily export of the public schema, all data except the three cache tables, encrypted with the owner's public key before it leaves the runner and never uploaded as a workflow artifact of this public repository, kept 14 daily, 8 weekly and 12 monthly in object storage outside Vercel and Supabase, with a manifest and a heartbeat that alerts on a missing export, a 20% size drop or an empty table (slice 2).

#### AC-71-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-71-104

As a player, I want the product to a quarterly restore drill into a scratch database: row counts against the manifest, the schema against prisma/schema.prisma, a smoke script, and the restore time recorded in docs/engineering/restore-drills.md., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A quarterly restore drill into a scratch database: row counts against the manifest, the schema against prisma/schema.prisma, a smoke script, and the restore time recorded in docs/engineering/restore-drills.md. Once I-38's deletion tombstone exists, every deletion recorded after the export is re-applied before the database serves players (slice 3).

#### AC-71-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-71-105

As a player, I want the product to alerts: "down" reaches the owner's phone within 15 minutes and never on one failed check, with a page check of / beside I-52's /api/health monitor, and everything else arrives by email at most once a day (slice 4); a runbook with one section per scenario, an incident record template and the additive-migration rule (slice 5)., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Alerts: "down" reaches the owner's phone within 15 minutes and never on one failed check, with a page check of / beside I-52's /api/health monitor, and everything else arrives by email at most once a day (slice 4); a runbook with one section per scenario, an incident record template and the additive-migration rule (slice 5).

#### AC-71-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-71-106

As a player, I want the product to cI budgets that cannot flake: Lighthouse with explicit median-run aggregation and LCP and CLS per URL (slice 6), compressed JavaScript per key route against perf-budgets.json (slice 7), and Prisma queries per request on a seeded fixture, which also lets Lighthouse audit a deck page and a commander listing (slice 8)., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: CI budgets that cannot flake: Lighthouse with explicit median-run aggregation and LCP and CLS per URL (slice 6), compressed JavaScript per key route against perf-budgets.json (slice 7), and Prisma queries per request on a seeded fixture, which also lets Lighthouse audit a deck page and a commander listing (slice 8).

#### AC-71-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-117 Edge

Given the same inputs as a previous run
When the player runs it again
Then the reported figures match the first run

#### US-71-107

As a player, I want the product to later: a first-party vitals beacon that stores daily histograms only, off until L-13 (b) is answered (slice 9); a paginated collection API and a virtualised list within 200 ms of INP on 20,000 rows (slice 10); degraded modes, a dated Spellbook fallback, "Saving paused" and a copilot "unavailable" state (slice 11); the readiness check that I-30 slice 9 waits for (slice 12)., so that if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

#### AC-71-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: a first-party vitals beacon that stores daily histograms only, off until L-13 (b) is answered (slice 9); a paginated collection API and a virtualised list within 200 ms of INP on 20,000 rows (slice 10); degraded modes, a dated Spellbook fallback, "Saving paused" and a copilot "unavailable" state (slice 11); the readiness check that I-30 slice 9 waits for (slice 12).

#### AC-71-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-71-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

| State            | What the player sees                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | A sentence that names what is missing and the next action. No invented row, author, price or score.                                                   |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                                        |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                                       |
| Partial          | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished.                                                 |
| Stale            | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed.                                             |
| Guest            | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401.               |
| Signed-in        | Writes go to that account only. Another player's notes, budget and collection are not in the response.                                                |
| English          | New controls use the `en` catalogue.                                                                                                                  |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                                         |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard         | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes.                         |
| Screen reader    | Each new control has an accessible name. A status change is announced in words, not only by colour.                                                   |
| Colour           | A warning and an error differ by text or icon as well as hue, in both themes.                                                                         |
| Success          | The completed action is confirmed in words. A second identical action does not duplicate the write.                                                   |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-71: Speed, Uptime And Recovery

**Spec:** [`specs/i71-speed-uptime-and-recovery.md`](i71-speed-uptime-and-recovery.md)

**Outcome:** if the database were lost tonight, yesterday's decks come back within four hours from an encrypted copy kept off the production stack, by a procedure tested every quarter; the owner's phone rings within 15 minutes of an outage; and each key route has a speed budget, measured on real players or enforced in CI.

**Status:** Next
**Priority:** Next for slices 0 to 8: the decisions, the guard on destructive commands, the daily export, the first restore drill, alert routing, the runbook and the CI budgets; Later for slices 9 to 12: field data per route, the large-collection budget, degraded modes and the paid-tier readiness check. Nothing in it is paid
**Impact / effort:** High / medium
**Depends on:** nothing for slices 1, 6 and 7; the owner's choice of export runner, storage account, objective and phone channel (slice 0) for the export (slice 2); slice 2 for the first drill (slice 3); I-52 slice 1's monitor for alert routing (slice 4), which waits for the owner's choice of monitor; slice 6 for the seeded fixture and query budgets (slice 8); the answer to L-13 (b) and slice 4 for the vitals beacon (slice 9); slice 8 and I-37 slice 1 for the collection budget (slice 10); I-52 slice 2 for the status link (slices 11 and 12).

Production runs on Supabase Free, which keeps no backups ([pricing](https://supabase.com/pricing), read 2026-11-10), and `scripts/` holds no export or restore script. `docs/engineering/infrastructure.md` (lines 348 to 364) gives `npx prisma db push --force-reset` under "Production (Supabase / Neon)", a command that "drops all tables", so one mistyped line would erase every deck with no way back (checked on `origin/dev` at `72fbfc1`). The parts of an answer exist but are not joined: free Speed Insights shows no p75 per metric ([limits](https://vercel.com/docs/speed-insights/limits-and-pricing)), Lighthouse CI asserts category scores on three public pages and blocks no merge into `dev`, `/api/health` says it is "Used by uptime monitors" while none is configured, and no alert rule, recovery target or runbook is written anywhere. Neither Vercel nor Supabase sells an uptime SLA below Enterprise, and Moxfield, Scryfall, Archidekt, EDHREC and Commander Spellbook have no `status.` host. I-05 keeps `/api/health` and the shared rate-limit store, and I-52 the monitor and the status page. Recovery goes first, because data loss is the only failure here that cannot be undone.

### Scope

- [ ] Slice 0, no code: the 99.5% objective, a 24-hour data-loss target and a 4-hour restore target, the export runner (a scheduled GitHub workflow or the VPS) and its storage account, the phone channel, the field-data option, and whether Lighthouse becomes a required check on promotion PRs. Point-in-time recovery is option (f) of [D-04](../owner-decisions.md#d-04-hosting-plans-region-and-budget).
- [x] **Owner awareness, now: a production reset with no backup.** `docs/engineering/infrastructure.md` used to give `npx prisma db push --force-reset` against the production `DATABASE_URL`, while production on Supabase Free keeps no backups (verified on `origin/dev` at `72fbfc1`). Slice 1 guards it: `pnpm db:production-schema` takes an on-demand export first and refuses a reset for a production host, and the production reset section is removed. The encrypted daily export is still slice 2.
- [ ] A daily export of the `public` schema, all data except the three cache tables, encrypted with the owner's public key before it leaves the runner and never uploaded as a workflow artifact of this public repository, kept 14 daily, 8 weekly and 12 monthly in object storage outside Vercel and Supabase, with a manifest and a heartbeat that alerts on a missing export, a 20% size drop or an empty table (slice 2).
- [ ] A quarterly restore drill into a scratch database: row counts against the manifest, the schema against `prisma/schema.prisma`, a smoke script, and the restore time recorded in `docs/engineering/restore-drills.md`. Once I-38's deletion tombstone exists, every deletion recorded after the export is re-applied before the database serves players (slice 3).
- [ ] Alerts: "down" reaches the owner's phone within 15 minutes and never on one failed check, with a page check of `/` beside I-52's `/api/health` monitor, and everything else arrives by email at most once a day (slice 4); a runbook with one section per scenario, an incident record template and the additive-migration rule (slice 5).
- [ ] CI budgets that cannot flake: Lighthouse with explicit `median-run` aggregation and LCP and CLS per URL (slice 6), compressed JavaScript per key route against `perf-budgets.json` (slice 7), and Prisma queries per request on a seeded fixture, which also lets Lighthouse audit a deck page and a commander listing (slice 8).
- [ ] Later: a first-party vitals beacon that stores daily histograms only, off until L-13 (b) is answered (slice 9); a paginated collection API and a virtualised list within 200 ms of INP on 20,000 rows (slice 10); degraded modes, a dated Spellbook fallback, "Saving paused" and a copilot "unavailable" state (slice 11); the readiness check that I-30 slice 9 waits for (slice 12).

### Engineering enablers

- Against local PostgreSQL, export, encrypt, decrypt and restore give row counts equal to the manifest and empty cache tables; the job refuses to write an unencrypted file, and the workflow uploads no artifact.
- The production schema script refuses `--force-reset` and `migrate reset` for a production host.
- The bundle script fails one byte over a budget and passes at it, with no network, and an injected N+1 fails the query budget.
- A test parses `lighthouserc.yml` and fails unless `aggregationMethod` is set and every URL asserts LCP and CLS.

**Paid-tier angle:** none. Every player gets the same uptime, speed and backups, and no budget is relaxed for free players. Its value to I-30 is slice 12's precondition for a first payment: a restore drill passed in the last 90 days, a public status page and 99.5% history, and an export of the player's own data. None of the incumbents read publishes a status page or a speed figure.

### Enrichment (2026-11-11)

**User story.** As a player, I want the deck to survive a database mistake, so that a bad command cannot empty production.

**Acceptance.**

- The documented reset command refuses to run against production.
- A daily encrypted export exists, or the owner has not yet chosen the store and the slice says so.
- A restore drill has been run on a copy, not only described.

**UX.** Players see a maintenance banner when the site is read-only. They do not see the backup.

**Data and API.** An encrypted dump. The store is the owner's choice. Alerts go to the owner, not to a player's inbox.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `backup_finished {restored_in_drill: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Internal. No player flag. The guard ships before new product surface that writes decks.

**Open questions.** A 24-hour loss target, and whether point-in-time recovery waits for revenue, are owner questions.

### Definition of done

A restore from the newest off-site export into a scratch database passes the smoke script within four hours and is recorded; a test alert reaches the owner's phone; no documented command can reset production; and a pull request that pushes a key route's JavaScript or queries past its budget fails CI.

---
