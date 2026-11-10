# I-69: An Operator Console: Support, Moderation Queue, Flags And Kill Switches

> **Initiative:** I-69, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 7: the operator role, the audit log, the switch store with the AI and upstream switches, maintenance mode and the console shell. Later for slices 8 to 14, which wait for [I-61](i61-account-security.md), [I-38](i38-trust-safety-and-user-rights.md), [I-63](i63-one-notification-system.md) or [I-30](i30-business-model-and-paid-tier.md) · **Paid:** none sold; it protects margin and trust · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10 on flag and admin-tool pricing, deck-site moderation, the DSA, GDPR access to logs and French consumer law. It is not committed, so every external fact links its own entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through I-38's slice 0.
> **Owns:** who may operate the product (operator roles and step-up), the append-only operator audit log, the switch store (kill switches, upstream switches, read-only maintenance mode, dark launches to named accounts), the console shell at `/ops` that hosts every owner page, account lookup with minimal data, and the support actions on one account. **Does not own:** notices, decisions, appeals and their legal content (I-38); sessions, re-authentication, passkeys, reset and verification (I-61); the AI ledger, allowances, the ceiling's value and entitlements (I-30, [owner decision D-01](../owner-decisions.md#d-01-ai-allowance-numbers)); the cost report and budget alerts ([I-66](i66-running-costs-and-margin.md)); the status page and `StatusNotice` ([I-52](i52-feedback-loop-players-can-see.md)); the deck index's source register and opt-outs ([I-29](i29-cross-site-deck-index.md)); the card-data run report and the Tagger kill switch ([I-67](i67-one-card-data-pipeline.md)); billing and refunds (the payment provider's dashboard).
> **Proposed changes to neighbours, for the integrator:** I-30 slice 10, I-66 slice 9, I-39 slice 12, I-63 slice 11, I-67 slice 2's owner page, I-52 slice 5 and I-48 slice 6 use `requireOperator` from slice 1 here instead of each building a guard. I-38 slices 9 to 11 use the `moderator` role. I-61 1.9's session script becomes support action 6.2. I-30 4.6's switch-off writes through the switch store (slice 6).

## Overview

A gap audit of the roadmap and every spec found no admin, back-office, support-tool or feature-flag work for the product's own operator; "admin" appears only for other sites' and Discord's admins. Yet several specs assume a person can act:

- [I-30 4.6](i30-business-model-and-paid-tier.md#4-ai-metering-and-quotas-production-safety-ships-before-billing): crossing the AI spend ceiling "switches off free AI first … and alerts the owner". On the metering branch the ceiling is an environment variable, and Vercel applies a changed variable "only to new deployments" [9]. The owner's only lever during an incident is a redeploy.
- [I-38 3.1](i38-trust-safety-and-user-rights.md#3-decisions-and-statements-of-reasons): moderators hide, restore, restrict and suspend. Today the moderator flag is a boolean set by hand in SQL, with no record of who set it or what a moderator looked at.
- [I-61 1.9](i61-account-security.md#1-sessions-a-player-can-see-and-end): "The owner can end all sessions of one account with a script".
- [I-66 7.3](i66-running-costs-and-margin.md#7-budget-alerts): Vercel's only global stop pauses the whole site and acts minutes late. Nothing sits between "everything on" and "site down".
- [D-07](../owner-decisions.md#d-07-archidekt): "Every import repeats that exposure" to Archidekt's terms. When the owner decides, stopping one importer takes a code change and a full `dev` → `staging` → `main` promotion.

The product is run by one person, so the console must be small, safe and cheap. It adds no vendor. It shows the least personal data by default. Every view and every action is written to an append-only log in the same transaction as the action. A kill switch is a row in PostgreSQL, read through one module, that takes effect within 15 seconds without a deploy.

**Why Next.** Slices 1 to 5 need no other initiative, no email sender and no counsel. Slice 6 waits for I-30's metering and slice 7 for I-61's session registry and re-authentication, which need nothing else. Together they turn five ad hoc mechanisms (a boolean, an environment variable, a script, a promotion, a site pause) into one audited one before the first payment, the first public report flow or the first AI incident. **None of it is a paid feature** (requirement 10).

## What the market does

Read 2026-11-10 unless dated otherwise.

**Deck sites and user reports.** No deckbuilder read documents an operator workflow, which matches I-38's survey of report buttons.

| Product            | What is public about reports and moderation                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield** [20]  | No report feature found. Its feedback board answered HTTP 403; a search summary shows players asking for "a simple report button" to keep the site family-friendly. Undated, no official reply seen                                                            |
| **Archidekt** [17] | The FAQ mentions reports only for bugs, in the "Development subforum"; the footer links "CONTACT" and "SUPPORT". Its custom-card launch (2025-11-24) said "The Archidekt team will be moderating the images and created cards for inappropriate material" [18] |
| **TappedOut** [19] | 2012-11-06: "It's not a specific 'report' button"; users write to the footer contact. The operator said he acts on harassment but "will not leverage any site policy to make them change the name of their deck"                                               |
| **Discourse** [16] | 2026-06-27: one review queue for flags and queued posts; an "Illegal" flag with a free-text message and an accuracy checkbox; "Yes" and "No" bundles, including ignore. Posts with 3 flags are hidden before a moderator acts                                  |

**Admin tools small teams use.** All prices before VAT.

| Option                          | Cost                                                                                             | Fit here                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase dashboard** [11][12] | Included                                                                                         | Read-Only members can run SELECT as `pg_read_all_data`, so any member reads every table. Platform audit logs are "only available on the Team and Enterprise plans"; Team costs "from $599/month" and Pro does not include them. A stopgap for incidents, not for routine support |
| **Retool** [10]                 | Free up to 5 users; Team €9–11 per builder a month; audit logs from Business, €46–60 per builder | A new processor holding database credentials; audit logs cost more than the whole fixed floor of [I-66 5.1](i66-running-costs-and-margin.md#5-fixed-costs-and-the-plan-upgrade-line)                                                                                             |
| **Prisma Studio** [14]          | Not stated                                                                                       | Already in the repository as `pnpm db:studio`. Local or in Prisma's Console; the page states no access control or audit log                                                                                                                                                      |
| **next-admin** [13]             | Free, MIT; 503 stars, 8.4.2 published 2026-01-02                                                 | Generates a Next.js back office from the Prisma schema. No audit log or permissions mentioned, so both would be built anyway                                                                                                                                                     |
| **A hand-built page**           | Developer time                                                                                   | The repository already has one, `/moderation/reports`                                                                                                                                                                                                                            |

**Feature flags.** Costs are computed at I-66's estimate of 345 function calls per active player a month ([I-66 3.3](i66-running-costs-and-margin.md#3-cost-model-per-active-player)), assuming each call reads the flags once. I-66 puts hosting at $1.7–4.8 per 1,000 active players.

| Option                                        | Price read                                                                                                                                                      | Computed                                                                                           | Fit                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vercel Global Config** (Edge Config) [1][2] | Hobby includes 100,000 reads and 100 writes; then $3 per million reads and $1 per 100 writes. One store on Hobby; writes take "up to 10 seconds" to propagate   | Hobby's reads last about 290 active players; then about $1.04 per 1,000                            | Renamed on 2026-07-29, with a new package. A second source of truth outside the database; the console would hold a Vercel write token; audit stays in Vercel |
| **Vercel Flags** [3]                          | Hobby: at most 10,000 flag requests a month; Pro: $0.03 per 1,000. "Reads of cached flag configuration also count"                                              | Hobby lasts about 29 active players; Pro about $10.35 per 1,000, 2–6 times hosting                 | Too small on Hobby, dear on Pro                                                                                                                              |
| **PostHog** [7][8]                            | "1M flag requests free every month", then $0.000100 a request. Local evaluation polls every 30 s, and it advises against local evaluation on Lambda-style hosts | Free up to about 2,900 active players; then about $34.50 per 1,000                                 | A new processor with per-user identifiers, while the analytics choice is still open (D-21)                                                                   |
| **GrowthBook** [5]                            | Cloud Starter free for 3 users, 1 project, 1M CDN requests; Pro $40 a seat a month; open-source core under MIT                                                  | Depends on SDK caching; not computed                                                               | Flag audit logs on every tier; still a new processor, or a self-hosted server                                                                                |
| **Unleash** [6]                               | Open source free when self-hosted (AGPL-3.0, 1 project, 2 environments); hosted from $75 a seat a month, no free hosted tier                                    | —                                                                                                  | A server and a database to run                                                                                                                               |
| **Flags SDK** [4]                             | "A free, open-source library" (MIT), with custom adapters for "in-house solutions"                                                                              | $0                                                                                                 | A calling convention, not a store; can wrap any of the above                                                                                                 |
| **PostgreSQL table** (this spec)              | Already paid for                                                                                                                                                | One indexed read per warm instance per 15 s: 172,800 reads a month for an instance alive all month | Same transaction as the audit log; no new processor; works on Hobby; the edge middleware cannot read it                                                      |

**Refunds.** Paddle refunds from its dashboard (Transactions → Refund), approves refunds up to 400 USD automatically on a verified account and sends the customer a credit note [15]. I-30 has not chosen a provider (D-11); the console links to whichever it is.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **One role, one boolean.** `prisma/schema.prisma` line 38: `isModerator Boolean @default(false)`. No other role, `isAdmin` or audit model exists. Only migration `20260921124500_add_moderation_review` writes the column; no route sets it.
- **Two guards that repeat each other.** `src/lib/auth/require-moderator.ts` calls `requireAuth` and reads `isModerator` (lines 13–19) for the two API routes. `src/app/[locale]/moderation/reports/page.tsx` repeats the check on `auth()` and answers `notFound()` (lines 10–16).
- **A queue that records almost nothing.** `GET /api/moderation/deck-reports` returns the 50 oldest pending `DeckReport` rows with the deck's name, its owner's username and the reporter's username. `PATCH …/[reportId]` sets `reviewed` or `dismissed`, `reviewedById` and `reviewedAt`. Nothing records who viewed what. `DeckReport` (lines 173–190) cascades on the reporter's or the deck's deletion, and `reviewedById` is set to null when the moderator's account goes.
- **The word "admin" appears once.** `src/app/api/templates/route.ts` line 4 says `POST /api/templates` is for "admin/creator", but the handler requires only `requireAuth` (line 97) and echoes a mock without storing it.
- **No switch except removing a key.** The only environment variables that change behaviour are `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`. Without either, `src/app/api/ai/build/route.ts` (lines 316–330) returns a placeholder deck and `src/app/api/ai/suggest/route.ts` (lines 618–622) mock suggestions; `.env.example` (lines 37–39) documents it. Removing the keys therefore hides an outage behind a demo, and takes a redeploy [9].
- **The metering branch.** `feat/ai-usage-metering-and-monthly-quota` (`5879b6d`, local, not on `origin`) reads `AI_MONTHLY_BUILD_ALLOWANCE`, `AI_MONTHLY_SUGGEST_ALLOWANCE` and `AI_MONTHLY_SPEND_CEILING_USD` (`src/lib/ai/usage/policy.ts` lines 107–112), with defaults of 10, 30 and 20 USD. It adds `UsageCounter` and `AiMonthlySpend`. No per-user grant exists.
- **No generic report model yet.** I-38's `Report`, `Decision` and `Appeal` do not exist; `DeckReport` is the only report model, and it covers public decks only.
- **Upstream calls with no off switch.** Server side: Scryfall (`src/lib/scryfall/client.ts`, `server-fetch.ts`, `rulings.ts`), Commander Spellbook (`src/lib/combos/find-my-combos.ts`, capped at 60 calls a minute per instance by `lookup-policy.ts`), EDHREC (`src/lib/meta/fetch.ts` line 170), MTGTop8 (`src/lib/meta/mtgtop8.ts`), and the importers in `src/lib/import/url-import.ts`: Moxfield (line 197), Archidekt (261), TappedOut (304), MTGTop8 (328), MTGDecks (372), EDHREC average decks (413); `moxfield-user.ts` line 104. In the browser, `SetAutocomplete.tsx` line 44 calls `api.scryfall.com/sets` directly. Rate caps exist; no caller can be stopped without a deploy.
- **Locks are per instance.** Login allows 10 attempts per 15 minutes per email (`src/lib/auth/config.ts` lines 10–11, 40) in a `Map` per serverless instance (`src/lib/rate-limit.ts` line 25). There is no stored lock to lift; I-61 group 8 adds one.
- **Nothing to look up an account with.** The only account reads are public: a profile by username (`src/app/api/users/[username]/route.ts`) and the sitemap's list of claimed usernames (`src/app/sitemap.ts` line 76). No route finds an account by email or id. `emailVerified` (schema line 18) is never set by the app (I-61). The only operator tool documented is Prisma Studio (`docs/engineering/infrastructure.md` line 134).
- **No flag library, no maintenance mode, no `vercel.json`.** The middleware matcher excludes `api`, so API routes enforce their own guards (I-05 L2).

## Functional requirements

### 1. Operator roles

1.1 Three roles, granted per account: **moderator** (I-38's queue and decisions, I-48's rules publishing, I-52's triage), **support** (account lookup and the support actions of group 6), **owner** (switches, grants, the audit log, every owner page, and both other roles). One person may hold all three.
1.2 Grants live in `OperatorGrant` with who granted them and when; revoking keeps the row. The owner grants and revokes moderator and support from the console. The owner role needs a grant row **and** the account id in the `OPERATOR_OWNER_IDS` environment variable, so a database write alone cannot create an owner.
1.3 One server function, `requireOperator(role)`, checks the grant on every request (ASVS 8.2.1, 8.3.1 [26]). It replaces `requireModerator` and the page's inline check. Existing `isModerator` accounts get a moderator grant by migration, and the column is dropped afterwards.
1.4 Console pages answer 404 to anyone without a grant, as `/moderation/reports` does today, and carry `noindex`. Every operator route appears in I-05's L2 inventory with the access class `operator:<role>`.

### 2. Sign-in and step-up

2.1 The console requires I-61's session registry (slice 2): a revoked session or grant takes effect on the next request.
2.2 Entering the console requires a re-authentication (I-61 2.2) within the last 12 hours. Any action that changes data requires one within the last 10 minutes, I-61's window.
2.3 Once I-61 slice 8 ships, an operator account must hold a passkey, and re-authentication for the console uses it. NIST asks verifiers at AAL2 to offer a phishing-resistant option ([I-61](i61-account-security.md#what-the-market-does)); for the accounts that can switch the product off, this spec requires it.
2.4 Operators keep their player identity: the same account plays and operates, and an operator's own content is moderated like anyone's.

### 3. The audit log

3.1 `OperatorAuditEvent` records every operator action and every view of one account, case or audit page: actor, role, action, target, reason, a minimised before and after, request id, session id and time (ASVS 16.2.1 [25]).
3.2 The event is written in the same transaction as the action. If the action fails, no event exists; if the event cannot be written, the action fails.
3.3 Append-only: a database trigger rejects `UPDATE` and `DELETE` on the table, except deletions by the retention function of 3.6 (ASVS 16.4.2 [25]). Each row stores the hash of the previous row, and a verification command reports the first broken link.
3.4 Each event's id and hash also go to the application log, so a database-only change leaves a mismatch. A logically separate store (ASVS 16.4.3 [25]) is [open question 5](#open-questions).
3.5 Every view of a specific account states a purpose from a fixed list (support request, moderation case, security incident, legal request), with free text. The CJEU held that the dates and purposes of consultations of a person's data are information that person may obtain [22]; whether I-38's export must include them is the new legal question in [open question 2](#open-questions).
3.6 Retention: view events one year, other events three years, as hypotheses within the CNIL's recommendation of six months to one year for access logs, and up to three years where justified [23]. A purge is itself an event, with counts and the last purged hash.
3.7 The owner reads the log in the console, filtered by actor, target and action, and can export it as JSON.

### 4. Switches

4.1 A **switch registry in code** declares each switch: key, kind (`kill`, `upstream`, `maintenance`, `dark`), allowed states, default, fail mode, owning initiative, and the message players see. A switch that is not in the registry cannot be set.
4.2 States live in the `Switch` table. One module, `readSwitch(key)`, reads them with a per-instance cache of 15 seconds. The AI routes read their switch on every call without the cache, in the same query as I-30's spend check once it exists.
4.3 **Fail mode.** If the table cannot be read, a switch uses its last value in this instance, then its declared fail mode: `closed` (off) for AI and dark launches, `open` (on) for upstream switches, off for maintenance.
4.4 Setting a switch takes a reason, shows who it affects, asks for confirmation, and may carry an expiry after which it reverts. The command line can set a switch too (`pnpm ops:switch <key> <state> --reason`): same table, same audit event with the actor kind `script`, for when the console is unreachable.
4.5 `GET /api/switches` returns the player-facing states (AI, upstreams, maintenance) with `s-maxage=15`. It never returns a dark launch's account list. The client reads it before calling an upstream from the browser.
4.6 The console lists every switch with its state, last change, actor, reason and expiry, and the switches other specs own (I-67's Tagger kill switch) as read-only links.

### 5. The switches this spec ships

| Key                 | States                       | Effect when not `on`                                                                                                                                                                                                   |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai.free`           | on, off                      | AI routes answer 503 `ai_paused` to free accounts, with the message and an end time if set. Never the placeholder deck. Core flows continue ([I-30 1.5](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)) |
| `ai.paid`           | on, off                      | Same for paid accounts. Needs a reason category (provider outage, security, legal) and shows a dated notice (requirement 10.3)                                                                                         |
| `upstream.<source>` | on, paused, withdrawn        | `paused`: no outbound call, cached data still served with its date, a typed refusal such as "Import from Archidekt is paused; paste the list instead". `withdrawn`: also hides data cached from that source            |
| `maintenance`       | off, readOnly                | Every mutating API route answers 503 `maintenance` with `Retry-After`. Reads, sign-in and `/api/ops` stay open. With I-52 slice 2, a `StatusNotice` of kind `maintenance` shows the banner                             |
| `dark.<feature>`    | off, operators, accounts, on | `operators`: on for operator accounts; `accounts`: on for listed account ids. Expiry required                                                                                                                          |

5.1 **Upstream sources:** Scryfall, Commander Spellbook, EDHREC, MTGTop8, and each importer in `url-import.ts` and `moxfield-user.ts`. Scryfall's images load from Scryfall's CDN and are not switchable here. Where I-67's local card data exists, card reads fall back to it while Scryfall is paused.
5.2 `withdrawn` hides but does not delete. Deleting cached data from a source is a separate audited action owned by that source's initiative (I-29 1.7, I-67).
5.3 **The AI ceiling.** I-30 4.6's automatic switch-off writes `ai.free`, then `ai.paid` above the allowance, through this store with the actor kind `system`, and alerts the owner. `AI_MONTHLY_SPEND_CEILING_USD` stays the hard upper bound; the store holds a runtime ceiling at or below it, so the owner can lower it or switch AI off without a deploy ([open question 3](#open-questions)). [D-01](../owner-decisions.md#d-01-ai-allowance-numbers) still decides the numbers. An owner override of a system switch-off lasts until the month ends. I-66's alerts at 50% and 80% ([I-66 7.4](i66-running-costs-and-margin.md#7-budget-alerts)) show on the Overview.
5.4 **Maintenance coverage.** A guard test lists every route with a mutating method and fails if one does not pass through the maintenance wrapper.
5.5 **Dark launches** are for named testers and the owner. They never gate a paid feature, card data, legality or evidence: early access for subscribers is an entitlement ([I-30 5.4](i30-business-model-and-paid-tier.md#5-entitlements)). No percentage rollout, experiment or attribute targeting.
5.6 No switch turns itself off for cost except through 5.3, as [I-66](i66-running-costs-and-margin.md#non-goals) requires.

### 6. Account lookup and support actions

6.1 **Find an account** by exact email, exact username or account id; no partial or list search. The card shows id, username, creation date, verified or not, sign-in methods, the number of active sessions, decks, public decks and AI calls this month, open restrictions, plan and subscription status. The email is masked (`k***@g***.com`) until "reveal", which writes its own event. No IP address, password data, private deck name or collection content is shown.
6.2 **End all sessions** (I-61 1.9), for a hijack or on request.
6.3 **Grant or reset AI quota.** The allowances themselves are I-30's and D-01's. A grant adds units to one route for the current period only, with a reason (`AiAllowanceGrant`); a reset sets the period's use to zero. Both are capped per month by a constant, and both count toward the global ceiling. Grants are goodwill, never a sale.
6.4 **Clear the password throttle** for an address on I-61's shared store. A password disabled after 100 failures (I-61 8.3) is not re-enabled by a person: the operator sends a reset link (6.5).
6.5 **Resend verification and send a reset link**, through I-61's own flows to the account's address. The operator never sets a password, changes an email or removes a second factor (I-61 7.7).
6.6 **Export and deletion requests** from someone who cannot use Settings: the operator sends I-38's export or deletion confirmation link to the account's address, and the request completes when the mailbox owner confirms. Requests and their completion dates are tracked against the one month of GDPR Art. 12(3) (I-38 6.1).
6.7 **Refunds and billing** link to the provider's dashboard for that customer [15]. The console shows I-30's subscription status read-only.
6.8 A restriction on one account (posting, AI use for abuse) is an I-38 decision with a statement of reasons. The support desk cannot restrict an account outside I-38's flow; DSA Art. 17(1) covers a full or partial suspension of the service [21].

### 7. The moderation queue, operator side

I-38 owns notices, cases, decisions, statements of reasons and appeals. This group adds only how an operator works the queue.

7.1 The queue has I-38's states as tabs: open, decided, ignored, and appealed (a decision with an undecided appeal). Open cases come oldest first, with the item type, category, notice count and age. Duplicate notices already join one case (I-38 2.5).
7.2 Opening a case writes a view event and shows the reported item as the public sees it (deck name and primer, card note, comment, review, profile, card package or share link), the notices' explanations, and the author's previous decisions. Notifier names and emails stay masked unless revealed.
7.3 The decision form starts empty: no action is preselected. Templates per category fill the Art. 17(3) fields of I-38 3.2 for the moderator to edit; the preview shows exactly what the author and the notifier will read.
7.4 DSA Art. 16(6) asks for decisions "in a timely, diligent, non-arbitrary and objective manner" [21]. The queue shows each case's age and highlights cases older than the owner's target ([I-38 open questions](i38-trust-safety-and-user-rights.md#open-questions)). It never decides or hides on its own (I-38 3.4).
7.5 An appeal shows the original decision, the appellant's text and any new facts. When the same person decided both, the outcome says so.
7.6 The police referral of I-38 2.6 records who referred, when and to which service.

### 8. The console shell

8.1 `/ops` in English and French, behind group 1 and 2: Overview (switches not `on`, open cases, the last ten audit events, I-66's alerts), Switches, Accounts, Moderation, Audit log, and the owner pages other initiatives build, each mounted here when it ships.
8.2 Overview loads with one query per panel and no per-player data beyond counts.

### 9. Personal data

9.1 Least data by default (6.1, 7.2). Reveals are events with a purpose.
9.2 I-38's privacy policy names the operator log, its purposes and retention (3.6). The console adds no processor.
9.3 No "sign in as" a player, and no editing of a player's content.

### 10. Free and paid

10.1 Nothing here is sold. Support, export, deletion and appeals stay free on every plan ([I-38 10.1](i38-trust-safety-and-user-rights.md#10-the-paid-tier-boundary)).
10.2 **Margin.** Runtime AI switches and a ceiling the owner can lower without a deploy bound the largest variable cost (I-30 3, I-66 finding 2). Grants replace refunds for a failed build.
10.3 **Trust.** Turning `ai.paid` off shows a dated notice with the reason category and expected end. The terms say when paid AI may pause; [open question 2](#open-questions) asks counsel what they must say. **Inference:** free deckbuilders need no such guarantee because they sell nothing time-bound; a cheap subscription is easier to keep when an outage is announced and goodwill units are a click away.

## Data model / API

```
OperatorGrant      id, userId, role (owner|moderator|support), grantedById?, grantedAt, revokedAt?, revokedById?, note?
OperatorAuditEvent id (bigint, identity), at, actorId?, actorKind (operator|system|script), role?, action, targetType?, targetId?,
                   purpose?, reason?, before? (json), after? (json), requestId, sessionId?, prevHash, hash   -- trigger: no UPDATE/DELETE
Switch             key @id, state, accountIds String[], reason, setById?, setByKind, setAt, expiresAt?, revertTo?
AiAllowanceGrant   id, userId, route, periodStart, units, reason, grantedById, createdAt   -- read by I-30's allowance check
SupportRequest     id, userId?, kind (export|deletion|access|other), receivedAt, channel, linkSentAt?, completedAt?, auditEventId
```

Routes: `GET /api/switches` (public, cached 15 s); under `/api/ops`, owner or support as noted: `PUT /api/ops/switches/[key]`, `GET|POST|DELETE /api/ops/grants`, `GET /api/ops/accounts?email|username|id`, `POST /api/ops/accounts/[id]/reveal`, `POST …/sessions/revoke-all`, `POST …/ai-allowance`, `POST …/throttle/clear`, `POST …/send-verification`, `POST …/send-reset`, `POST …/support-requests`, `GET /api/ops/audit`. Moderation uses I-38's `/api/moderation/*` routes behind `requireOperator("moderator")`. Script: `pnpm ops:switch`, `pnpm ops:audit:verify`.

## Non-goals

- Signing in as a player, editing a player's deck, profile or comment, or reading private decks and collections beyond counts.
- Setting passwords, changing emails or removing second factors by hand (I-61 7.7).
- A third-party flag service, Retool or another admin vendor; percentage rollouts, A/B experiments, attribute targeting (5.5).
- Automatic moderation, auto-hide thresholds such as Discourse's three flags [16] (I-38 3.4).
- A billing or refund interface (the provider's dashboard), a ticketing system or live chat.
- A status page (I-52), cost figures (I-66), pausing the whole deployment (I-66 7.3), or automatic switch-offs other than 5.3.

## Testing strategy

- **Guard (sociable):** every `/ops` page answers 404 and every `/api/ops` route 403 without the right grant; a moderator cannot set a switch; a revoked grant fails on the next request; an owner grant without the environment entry is refused.
- **Step-up:** a data-changing action without a re-authentication in the last 10 minutes returns 401 `reauth_required`; once 2.3 applies, an operator account without a passkey cannot enter.
- **Audit (sociable, PostgreSQL):** each action writes exactly one event in its transaction; a forced failure writes none; `UPDATE` and `DELETE` raise; altering one row makes `ops:audit:verify` name it; an inventory test fails when an `/api/ops` route does not call the audit writer.
- **Switches (solitary and sociable):** registry defaults and fail modes when the table is unreachable; the cache never serves a value older than 15 s; expiry reverts; with `ai.free` off the build route answers 503 `ai_paused` and never the placeholder; with an upstream paused, each caller makes zero outbound requests (asserted on the fetch mock) and returns its typed refusal; `GET /api/switches` carries no account ids.
- **Maintenance:** every mutating route answers 503 with `Retry-After`; reads, sign-in and `/api/ops` succeed; the coverage test of 5.4 fails on an unwrapped route.
- **Account lookup:** the payload snapshot holds no IP, password field, private deck name or unmasked email; reveal writes an event with its purpose.
- **Support actions:** a grant raises the allowance only for the current period and counts toward the ceiling; revoke-all ends every `UserSession`; no `/api/ops` route writes `password`, `email` or a second-factor table (guard test).
- **Dark launches:** on only for listed ids or operators; an expired switch reverts; no module that calls `can()` or `allowance()` reads a `dark.*` switch.

## Delivery slices

| #   | Slice                                                                                                                                                     | Depends on                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 0   | Owner decisions: who holds which role, audit retention, passkey from day one or not, maintenance scope; lawyer question added via I-38 slice 0            | — (owner; no code)                                          |
| 1   | `OperatorGrant`, `requireOperator`, migration from `isModerator`, `OPERATOR_OWNER_IDS`, 404 pages, L2 access classes                                      | —                                                           |
| 2   | `OperatorAuditEvent` with trigger, hash chain, application-log copy and `ops:audit:verify`; the existing review route writes events                       | 1                                                           |
| 3   | Switch registry, `Switch` table, `readSwitch` with cache and fail modes, `pnpm ops:switch`, `GET /api/switches`; `ai.free` and `ai.paid` with `ai_paused` | 2                                                           |
| 4   | Upstream switches for every source, typed refusals, browser Scryfall paths reading `/api/switches`                                                        | 3                                                           |
| 5   | Read-only maintenance mode, the wrapper and its coverage test; `StatusNotice` when I-52 slice 2 exists                                                    | 3                                                           |
| 6   | AI ceiling through the store: system switch-off, runtime ceiling at or below the environment's bound, month-long override                                 | 3; I-30 slice 2                                             |
| 7   | Console shell `/ops`: step-up, Overview, Switches page, Audit log page                                                                                    | 3; I-61 slices 2 and 3                                      |
| 8   | Account lookup with masking and reveal                                                                                                                    | 7                                                           |
| 9   | Support actions without email: end all sessions, AI grant and reset, clear throttle                                                                       | 8; I-30 slice 2 for grants; I-61 slice 1 for the throttle   |
| 10  | Support actions by email: verification, reset link, export and deletion links, `SupportRequest` tracking                                                  | 9; I-61 slices 11 and 12; I-38 slices 4 and 5; I-63 slice 7 |
| 11  | Moderation operator view: queue, case view, decision form with templates and preview, appeal view, referral record                                        | 7; I-38 slices 8 to 11                                      |
| 12  | Dark launches: `operators` and `accounts` states, expiry, the entitlement guard test                                                                      | 3, 7                                                        |
| 13  | Passkey required for operators (2.3)                                                                                                                      | 7; I-61 slice 8                                             |
| 14  | Audit retention purge on the job route; consultations in I-38's export if counsel says so                                                                 | 0, 2; I-63 slice 5; legal answer to open question 2         |

Slices 1 to 5 need nothing outside this spec, and the command line covers slices 3 to 5 before the console exists, so the AI and upstream switches can ship first. Scheduled agents must not pick slice 14 before slice 0's answers and counsel's answer to open question 2 are committed, nor slice 10 before I-63 slice 7 has merged. Slice 11 replaces `/moderation/reports`; slice 13 tightens every operator account.

## Open questions

1. **Who else operates, and who hears appeals?** Today one person reads every notice and decides every appeal against his own decision. Does the owner want a volunteer moderator with the moderator role only, and a second owner for holidays? I-38 asks the same about response times.
2. **New legal question for the [lawyer list](../legal-questions.md#k-the-digital-services-act-and-french-host-law)** (research, not legal advice). L-37 and L-39 already cover platform status and notice-and-action design; this one adds the operator side. Numbered [L-47](../legal-questions.md#l-47-operator-access-its-log-and-global-switches), "Operator access, its log and global switches": (a) After the CJEU's _Pankki S_ judgment (C-579/21, 2023-06-22), must an access request include the dates and purposes of the operator's consultations of the account, and must I-38's export carry them [22]? (b) How long may the operator log be kept, given the CNIL's six months to one year for access logs and up to three years where justified, and may it outlive the account in pseudonymised form [23]? (c) When paid AI is paused for every subscriber (provider outage, security, the spend ceiling, an upstream's demand), is that a lack of conformity or an update under Code de la consommation L224-25-26, which requires a contract clause with "une raison valable", advance notice and no extra cost [24]? What must the terms and the notice say, and is compensation owed? Unblocks slices 10 and 14 and the wording of 10.3.
3. **Runtime ceiling.** Should the store be able to raise the ceiling above the environment's value in an incident, or only lower it (5.3)? This spec proposes "only lower": a stolen operator session then cannot raise spending, and raising stays a deliberate redeploy.
4. **Passkey from day one?** Requirement 2.3 waits for I-61 slice 8. Until then an operator signs in with a password or Google plus re-authentication. Is that acceptable for switches that affect every player?
5. **A separate store for the audit hashes** (ASVS 16.4.3 [25]): the application log may be enough at this size; the provider's log retention was not verified. Is a daily anchor (the latest hash) written outside the database worth a slice?
6. **Maintenance scope.** Should read-only mode also stop sign-ups and new sessions, and should it pause I-63's scheduled jobs?

## Sources

Read 2026-11-10 unless dated otherwise. Legal sources are research, not legal advice. "Computed" figures in the tables are this spec's own arithmetic from the cited prices and I-66's usage estimate.

1. Vercel, [Global Config limits and pricing](https://vercel.com/docs/global-config/global-config-limits), last updated 2026-07-29 (requested as the Edge Config limits page).
2. Vercel changelog, [Edge Config is now Global Config](https://vercel.com/changelog/edge-config-is-now-global-config), 2026-07-29 ("Pricing is unchanged at $3 per 1,000,000 reads and $1 per 100 writes").
3. Vercel, [Limits and Pricing for Vercel Flags](https://vercel.com/docs/flags/vercel-flags/limits-and-pricing), last updated 2026-08-26.
4. Flags SDK, [home page](https://flags-sdk.dev/) and [providers](https://flags-sdk.dev/docs/providers), last updated 2026-10-28; repository [vercel/flags](https://github.com/vercel/flags), MIT, `@flags-sdk/vercel` 1.6.0 published 2026-10-30 (GitHub API).
5. GrowthBook, [Pricing](https://www.growthbook.io/pricing), undated (© 2026); [LICENSE](https://github.com/growthbook/growthbook/blob/main/LICENSE) (MIT outside the enterprise directories).
6. Unleash, [Pricing](https://www.getunleash.io/pricing), undated (© 2026); repository [Unleash/unleash](https://github.com/Unleash/unleash), AGPL-3.0 (GitHub API).
7. PostHog, [Feature flags pricing](https://posthog.com/feature-flags/pricing), undated ("1M flag requests free every month"; first paid bracket $0.000100).
8. PostHog, [Cutting feature flag costs](https://posthog.com/docs/feature-flags/cutting-costs), undated.
9. Vercel, [Environment variables](https://vercel.com/docs/environment-variables), last updated 2026-09-17 ("they only apply to new deployments").
10. Retool, [Pricing](https://retool.com/pricing), undated, EU prices in euros.
11. Supabase, [Access control](https://supabase.com/docs/guides/platform/access-control), undated.
12. Supabase, [Platform Audit Logs](https://supabase.com/docs/guides/security/platform-audit-logs), undated; [Pricing](https://supabase.com/pricing), undated (Team "from $599/month"; Platform Audit Logs not included in Pro).
13. Premier Octet, [next-admin](https://github.com/premieroctet/next-admin), MIT; release 8.4.2 published 2026-01-02 (GitHub API).
14. Prisma, [Studio](https://www.prisma.io/studio), undated (© 2026).
15. Paddle, [Refund or credit a transaction](https://developer.paddle.com/build/transactions/create-transaction-adjustments/), undated (© 2012–2026).
16. Discourse, [Discourse Moderation Guide - Part 3: Managing Content](https://meta.discourse.org/t/discourse-moderation-guide-part-3-managing-content/406266), 2026-06-27 (read through the topic's JSON; the HTML page answered 403).
17. Archidekt, [FAQ](https://archidekt.com/faq), undated (footer "Space Cow Media ©2026").
18. EDHREC, [Archidekt announces custom cards](https://cloudflare.edhrec.com/articles/archidekt-accounces-custom-cards), Dana Roach, 2025-11-24.
19. TappedOut forum, [How to report](https://tappedout.net/mtg-forum/tappedout/how-to-report), 2012-11-06.
20. Moxfield feedback board, [post 429](https://moxfield.nolt.io/429), HTTP 403; content known only from a search summary, undated.
21. Regulation (EU) 2022/2065 (Digital Services Act), [official text](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065); Arts. [16](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_16.html) and [17](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_17.html) read in a transcription.
22. Court of Justice of the EU, [press release 107/23](https://curia.europa.eu/jcms/upload/docs/application/pdf/2023-06/cp230107en.pdf), judgment in C-579/21 _Pankki S_, 2023-06-22.
23. CNIL, [La CNIL publie une recommandation relative aux mesures de journalisation](https://www.cnil.fr/fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation), 2021-11-18.
24. Légifrance, [Code de la consommation, article L224-25-26](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044133275), in force since 2021-10-01, for contracts concluded from 2022-01-01.
25. OWASP ASVS 5.0.0, [V16 Security Logging and Error Handling](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md) (16.2.1, 16.3.2, 16.4.2, 16.4.3), release 2025-05-30.
26. OWASP ASVS 5.0.0, [V8 Authorization](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md) (8.2.1, 8.2.2, 8.3.1, 8.4.2).
