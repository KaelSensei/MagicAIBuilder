# I-52: A Feedback Loop Players Can See

> **Initiative:** I-52, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for the status line, the bug report and "What's new" (slices 0 to 8); Later for the request board (slices 9 to 13) · **Written 2026-11-10**
> **Research:** one dated note, not committed. Every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice, and go to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate), through [I-38](i38-trust-safety-and-user-rights.md)'s slice 0.
> **Owns:** player-facing release notes and the in-app "What's new"; the bug report, its context allowlist and its triage states; the public request board, its votes and statuses, and the link from a shipped request to its release note; the public status page and the in-app status line. **Does not own:** the `/api/health` contract and the shared rate-limit store ([I-05](i05-production-safety.md)), although slice 1 closes I-05's monitor item; alerting ([I-71](i71-speed-uptime-and-recovery.md#3-availability-objective-and-alerts), named 2026-11-10 instead of I-05); reporting, moderation decisions, statements of reasons and blocking (I-38); the event store, activity days and retention metrics ([I-39](i39-first-run-activation-and-measurement.md)); plans, entitlements and the supporter badge ([I-30](i30-business-model-and-paid-tier.md)); the notification centre and deck-level "seeking feedback" ([I-08](i08-share-compare-and-learn.md)); Commander rules-change notices ([I-48](i48-official-changes-reach-every-deck.md)); Discord feeds and bots ([I-46](i46-discord-and-chat-integrations.md)); the developer changelog, `docs/project/changelog.md`, which stays as it is.

## Overview

A cheap subscription lives on two things: players trust that the product works, and they see it improve in the direction they asked for. Today neither is visible from inside the product. A player who hits a bug has no form, no address and no link to use. The error page says "The problem has been reported" and shows a reference code, but the player cannot add a word. The only changelog is a developer log, in English, that records merges to `dev` rather than what reached players. No uptime monitor is configured, so nobody outside the team can tell whether the site is down.

This initiative closes that loop in four parts:

1. **A status line**, fed by an external monitor of `/api/health`, with a status page hosted off the production stack.
2. **A bug report** that attaches only safe context (route template, locale, browser, build), adds a deck id only with consent, and never carries an e-mail address or a token.
3. **"What's new"**: short, human-written release notes in English and French, shown once the change is live in production.
4. **A request board** with one vote per account, public statuses and a link from every shipped request to the release note that shipped it.

The first three are cheap and operational, so they are Next. The board publishes user content, so it waits for I-38's reporting and blocking, and for enough players to make votes meaningful.

This is product feedback, not deck feedback. The roadmap's "do not open a second feedback initiative" line is about deck reviews and "seeking feedback", which stay in I-08.

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Product               | Bugs                                                                                     | Requests                                                                                                                                                                                                                                                                                                                                                                                                       | How changes are announced                                                                                                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield** [1][2]   | Public repository `moxfield-public`: 81 open issues, the latest (#150) opened 2026-10-22 | A Nolt board, `moxfield.nolt.io`, cited by [I-34](i34-commander-data-reports.md) and [I-37](i37-editor-depth.md); it answered HTTP 403 here. A Discord server of 15,987 members whose page says "You can suggest features that you want to see added"                                                                                                                                                          | Patreon members got early access to the editor redesign in September 2026 ([I-30](i30-business-model-and-paid-tier.md)). No changelog page found                                                                                                                                 |
| **EDHREC** [3]        | "If you experience a bug please do submit a bug report"                                  | A feedback form and article comments                                                                                                                                                                                                                                                                                                                                                                           | A "changelog" article series; the follow-up of 2026-10-22 says card sizes were reduced after players said they were too large. The [competitive landscape](../competitive-landscape.md) records the redesign (2026-10-13) and a performance pass (2026-11-06) in the same series |
| **Archidekt** [4][26] | A forum; [I-38](i38-trust-safety-and-user-rights.md) found that its FAQ sends bugs there | Feature Voting at `archidekt.com/features`, with points, responses and an "Archived" state: 19 open and 55 archived requests over four pages [26]. Item pages are forum threads opened by a moderator; the page shows no year, so points are cumulative over several years. Also forum sections ("Development", "General MTG") and Discord. _Corrected 2026-11-11:_ this cell named only the forum and Discord | "Development Update" posts tagged changelog: three in the last five months (the page gives relative dates only)                                                                                                                                                                  |
| **ManaBox** [5]       | A `mailto:` link with the subject "ManaBox feedback"                                     | Discord and the r/ManaBoxApp subreddit                                                                                                                                                                                                                                                                                                                                                                         | Nothing on the website                                                                                                                                                                                                                                                           |
| **TappedOut** [6]     | One forum thread, "List of Bugs and Feature Requests", opened 2015-10-05, 38 pages       | Same thread; each new bug or idea gets its own thread                                                                                                                                                                                                                                                                                                                                                          | —                                                                                                                                                                                                                                                                                |
| **Deckstats**         | The forum answered HTTP 402 to an automated read                                         | Not verified                                                                                                                                                                                                                                                                                                                                                                                                   | Not verified                                                                                                                                                                                                                                                                     |

Three findings:

1. **Feedback lives outside the product.** Every product read takes bugs and requests through Discord, a forum, e-mail, GitHub issues or a hosted board. None of the pages read offers a form inside the product that attaches context. Moxfield's own pages refused automated reads, so for Moxfield this is "not found", not "absent".
2. **Announcements are articles.** EDHREC and Archidekt publish changelog articles. EDHREC says in prose that a change came from feedback, but no page read links a shipped change to the request that asked for it.
3. **Paid voice exists as early access.** Moxfield gave Patreon members the editor redesign first. No page read says that votes are weighted by payment.

**Board tools.** Prices were read on each vendor's pricing page.

| Tool                          | Entry price                    | Free plan                                                                                 | Priced by                      | Data location stated                  | Fit here                                                                                                     |
| ----------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Canny** [7]                 | Pro $79/month, billed yearly   | 25 tracked users, 5 managers                                                              | Tracked users                  | Not stated; lists GDPR and SOC 2      | The free plan ends at the 26th player who posts or votes                                                     |
| **Featurebase** [8]           | Growth $29/seat/month          | 1 seat, 1 board, 1 roadmap, unlimited posts and end users                                 | Seats                          | "hosted in the Netherlands & Germany" | Fits on price; its embeddable widget would add a third-party script; removing branding is a $69/month add-on |
| **Fider** [9][10]             | Cloud Pro $25/month            | Cloud: fair use of 250 feedback items. Self-hosted: free, AGPL-3.0, v0.39.0 on 2026-11-03 | Flat                           | Not stated                            | Self-hosting needs a server; the only one is the shared development VPS (I-05)                               |
| **Frill** [11]                | Startup $25/month              | None; 14-day trial                                                                        | Tiers                          | "EU Hosting" listed, plan unclear     | No free plan                                                                                                 |
| **Upvoty** [12]               | Power $15/month                | None; 14-day trial                                                                        | Tiers, unlimited tracked users | Not stated; custom DPA on Enterprise  | No free plan                                                                                                 |
| **GitHub Discussions** [13]   | Free                           | Upvotes on discussions and top-level comments, sorted by Top                              | —                              | GitHub                                | Every voter needs a GitHub account; this repository is public with Discussions turned off                    |
| **Sentry User Feedback** [14] | Part of Sentry, already in use | `captureFeedback` sends feedback without the widget and can link an error event           | Sentry's plan                  | The DSN's region                      | Screenshots on by default; with error replay enabled it buffers up to 30 seconds once the widget opens       |

**Why the board is built in the product.** Canny's free plan stops at 25 tracked users and its next plan costs $79 a month. Featurebase's and Fider Cloud's free plans fit on price, but each adds a processor, a second sign-in or a widget script that the CSP refuses today, and [I-39 requirement 8.1](i39-first-run-activation-and-measurement.md#8-event-contract-and-minimisation) keeps third-party scripts out. GitHub Discussions asks every player for a GitHub account. The parts a board needs already exist here: accounts, one-vote rows, comments, a moderator flag and, once I-38 ships, reporting and blocking. Self-hosted Fider (AGPL-3.0) stays the exit if the in-product board proves too costly to maintain.

**Status tools.**

| Tool                  | Free tier                                                                                                                  | Commercial use                              | Notes                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UptimeRobot** [15]  | 50 monitors, 5-minute interval, 1 basic status page                                                                        | "Good for personal and commercial projects" | Solo €9/month on annual billing: 60-second checks, 3 status pages on your own domain. Already named in `docs/engineering/dx-ci-overview.md`                            |
| **Upptime** [16][17]  | Free on GitHub: Actions run the checks, results are committed to git, Issues record incidents, Pages hosts the status site | MIT                                         | Scheduled workflows run at most every 5 minutes, "can be delayed during periods of high loads", and are disabled in a public repository after 60 days without activity |
| **Uptime Kuma** [18]  | Self-hosted, MIT, 2.5.9 on 2026-10-31                                                                                      | MIT                                         | Needs a host outside production                                                                                                                                        |
| **Better Stack** [19] | 10 monitors and heartbeats, 1 status page, 1,000 subscribers                                                               | "Free for personal projects"                | White-labelling costs $250 per page per month                                                                                                                          |
| **Instatus** [20]     | 15 monitors, 2-minute interval, 200 subscribers, no custom domain                                                          | Not stated                                  | Pro from $20/month                                                                                                                                                     |

**Do public boards help retention? The evidence is weak.** No controlled study was found that ties a public roadmap or voting board to the retention of a product's users. Vendor pages offer testimonials. The academic work found is about participation in idea communities, not retention. In Dell's IdeaStorm, serial contributors were more likely to have an idea implemented but rarely repeated that success, and they then proposed ideas similar to the ones already implemented [21]. A 2012 study of a company-sponsored brainstorming site reports that the speed of the sponsor's response influenced how much members contributed and how long they stayed active [22]; only its abstract was read. Both are reasons to answer quickly and to measure, not proof that a board retains players. Voters are also the most engaged players, so any comparison of voters with non-voters is biased in the board's favour.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Health.** `src/app/api/health/route.ts` runs `SELECT 1` and answers `200 {status:"ok", db:"ok", latencyMs}` or `503 {status:"degraded", db:"unreachable", latencyMs}`, without the driver's error text. It is public (`PUBLIC_API_PATH_PREFIXES` in `src/lib/auth/edge-config.ts`), has no rate limit, and checks only the database. `docs/engineering/dx-ci-overview.md` lists "UptimeRobot · Monitors `/api/health` every 5 minutes · Free", and I-05 records that no monitor is configured.
- **No status page, no bug report, no "What's new".** In `src/`, "feedback" means either the deck-level focused feedback question (`Deck.feedbackQuestion`, `FocusedFeedbackPanel`) or interface messages (import and playtest). No route, model or component collects product feedback.
- **Error pages.** `src/app/[locale]/error.tsx` calls `Sentry.captureException` and shows `error.digest` as a "Reference". Its copy (`common.error.description`) says the problem "has been reported", but the player cannot add anything. `src/app/global-error.tsx` renders without providers and stays in English.
- **Footers and header.** `src/components/layout/Footer.tsx` holds the trademark and Scryfall notices and the keyboard-shortcuts trigger, and renders only on `/decks`. `LandingFooter` renders on the landing page. Neither has a contact, bug or status link. The header links to decks, collection and Game Changers.
- **Telemetry.** `src/instrumentation-client.ts` sets `replaysSessionSampleRate: 0.01` and `replaysOnErrorSampleRate: 1.0` with `replayIntegration`, and no feedback integration. I-39 requirement 9.1 proposes taking random replays to zero.
- **CSP.** `src/lib/security-headers.ts` allows scripts from `'self'` only and connections to Scryfall, Sentry ingest and Vercel Speed Insights. A third-party board widget or status badge would need a new script, frame or connect host.
- **Patterns to reuse.** `DeckVote` keeps one vote per user per deck (`@@unique([userId, deckId])`). `DeckReport` and `DeckReportButton` exist, with a queue at `/moderation/reports` behind `User.isModerator`; I-38 replaces them with a generic `Report`. `NotificationPreference` holds `replies`, `mentions`, `follows` and `watchedDecks` for "future" notices. `checkRateLimit` and `getClientIp` live in `src/lib/rate-limit.ts`, in memory per instance (I-05 M2).
- **Changelog.** `docs/project/changelog.md` follows Keep a Changelog and keeps 199 dated entries under `[Unreleased]` since `0.1.0` (2026-03-20). Recent entries pair a player-facing sentence with a verification paragraph (tests, gates, Sonar). `package.json` says `0.1.0` and there are no tags. It records merges to `dev`: `main` was last promoted on 2026-11-08 (#1291), and `dev` was 37 commits ahead of it on 2026-11-10.
- **Locales.** `SUPPORTED_LOCALES` is `en` and `fr`; eight catalogues are dormant (`src/i18n/routing.ts`).
- **Repository.** `KaelSensei/MagicAIBuilder` is public and MIT-licensed, with issues enabled but never used, and Discussions turned off (GitHub API, 2026-11-10).
- **No legal pages.** No privacy, terms or legal-notice route exists; I-38 slices 1, 6 and 7 add them.

## Functional requirements

### 1. Release notes and "What's new"

1.1 Player-facing release notes are a separate source from `docs/project/changelog.md`. The developer changelog keeps its verification paragraphs, and nothing is generated from it automatically.
1.2 One file per note under `src/content/whats-new/`, validated by a schema: `id`, `kind` (`new`, `improved`, `fixed`), an `area` enum, English and French `title` (at most 80 characters) and `body` (plain text, at most 400 characters), an optional same-origin `href` to the feature, and optional `requestIds` (requirement 4.7).
1.3 A note exists only for a change a player can see or a fix for a problem a player could hit. Tests, refactors, CI and documentation get none. Several pull requests may share one note. A security fix is described by its effect, without exploit detail, and only once it is in production.
1.4 Notes are written in the `chore/docs` pull request that records a merge batch, beside the changelog, so feature branches never touch them, as the project instructions already require for the changelog. Notes added on `dev` reach `main` only with the code they describe, because promotions move the whole branch.
1.5 **Dates are production dates.** The first time production serves a note, the server stores `firstServedAt` once (insert if absent). The page shows that date, never the date the note was written.
1.6 **Both locales, written by a person.** A note missing either locale fails the schema test. No machine translation is published unreviewed. If [I-25](i25-a-third-locale.md) routes a third locale, the test extends to it.
1.7 `/whats-new` is public and works signed out, newest first, filterable by `kind`. An Atom feed per locale (`/whats-new/feed.xml?locale=fr`) lets players and I-46's channel feeds follow it.
1.8 Signed-in players see a dot on the header's "What's new" entry when notes are newer than `User.whatsNewSeenAt`, which opening the page updates. Guests see notes from the last 14 days labelled "recent", computed from dates alone, so nothing is stored in their browser.
1.9 No modal, toast or interstitial announces a release, as [I-39 requirements 1.1 and 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns) require.

### 2. The bug report

2.1 "Report a problem" is reachable from every page: the header menu (desktop and mobile), both footers, and the error boundary.
2.2 From `error.tsx`, the form opens with the digest and the Sentry event id (the value `Sentry.captureException` returns) attached, so the owner can open the stack trace. `global-error.tsx` links to the form with the digest in a query parameter, which the form moves into the report and drops from the address bar.
2.3 Fields: "What went wrong?" (required, at most 2,000 characters), "What did you expect?" (optional, at most 1,000) and a kind: `bug`, `wrong card or rules data`, `suggestion`. Added 2026-11-10: a fourth kind, `ai_output`, opened from the wizard's result and the suggestion panel, attaches the AI context only with the player's consent ([I-70 10.2](i70-ai-quality-bench-and-model-changes.md#10-player-signals-that-feed-the-set)). Added 2026-11-11: a fifth kind, `bracket_rule`, opened by "Contest this" in [I-77](i77-a-bracket-estimate-players-can-audit.md#10-contesting-a-classification)'s audit view, pre-filled with the card, the term, the rule id, the audit link and the method version (I-77 10.1).
2.4 Signed-out players can report. The form says the report is anonymous and that signing in lets them follow it. Signed-in reports are linked to the account by id only.
2.5 Reports are stored first-party in PostgreSQL. No third-party feedback service, widget or script is used, and the CSP gains no host.
2.6 The sender gets a reference, and a signed-in sender sees each report's status under Settings → My reports. When a fix ships, the report links to its release note.
2.7 Rate limits: per account and per IP with `checkRateLimit` (the address is an in-memory key and is never stored), until I-05's shared store replaces it.

### 3. What a report may carry

3.1 **Allowlist, attached automatically:** the route template (`/deck/[id]`, never the concrete path), the locale, the build id (the deployed commit's short SHA), browser family and major version, operating-system family, a viewport bucket (`<640`, `640–1024`, `>1024` pixels), signed in or not, the time, and the error digest and Sentry event id when the form opened from an error page.
3.2 **Shown before sending.** A "What will be sent" panel lists every attached value as it will be stored. A test asserts that the payload equals the panel.
3.3 **Deck id only with consent.** An unticked box, "Let the team open this deck to investigate", attaches the current deck's id. It is offered only for the sender's own deck or a public deck, never for a `/share/[token]` page. The deck's contents are never copied into the report.
3.4 **Never attached:** e-mail address, name, username, cookies, session or API tokens, share tokens, query strings, full URLs, the IP address, the raw user-agent string (parsed on the server, then discarded), deck contents, local storage, screenshots and session replays.
3.5 **Free text is scrubbed.** The form asks players not to paste passwords or personal details. Before storage, the server replaces e-mail-like strings, `Bearer` values, JWT-shaped strings and long hexadecimal or base64 runs with `[removed]`.
3.6 **Retention.** A closed report is deleted after a period the owner sets with I-38's retention constants (12 months is the hypothesis). Deleting an account deletes its reports, and I-38's export includes them.
3.7 **Never public by default.** Promoting a report to a GitHub issue in this public repository copies the allowlisted context and a summary the owner writes. The player's own words are never copied automatically.

### 4. The request board

4.1 The board lives in the product at `/requests` and is readable signed out.
4.2 Posting, voting and commenting need a free account, so that votes can be counted once. Requests are written in the author's language and carry a language tag; the list can be filtered by language.
4.3 One vote per account per request, removable. There are no downvotes. Sorting: Top (all votes), Trending (votes in the last 30 days) and New.
4.4 Before posting, a title search shows similar requests. A moderator can merge duplicates: votes move to the kept request, counted once per account.
4.5 Statuses: Under review, Planned, In progress, Shipped, Not planned and Duplicate. Each change is dated, kept in a history, and may carry a note. Not planned always has a written reason.
4.6 Planned and In progress may link to a roadmap initiative (`I-37`, for example). The board never shows a delivery date.
4.7 Shipped links to the release note that shipped it, and the note shows "Requested on the board" with the vote count. Voters see the change in-app, controlled by a new `NotificationPreference.requestUpdates` (on by default), until [I-63](i63-one-notification-system.md)'s inbox (its slices 1 to 3) exists.
4.8 Suggestions sent through the bug report (2.3) before the board exists are seeded into it as requests written by the owner, without naming their senders.
4.9 A public "How we decide" page states that votes inform decisions but do not dictate them, that each vote counts once, that money never weighs a vote (requirement 5), and that "Not planned" always has a reason.

### 5. Moderation and fairness

5.1 Requests and comments are user content under I-38. They use I-38's `Report`, with two new target types (`featureRequest`, `featureRequestComment`), its statements of reasons and its appeals. No second moderation queue is built.
5.2 I-38's blocking (requirement 5.1) applies: a blocked player cannot comment on or vote for the blocker's requests. I-38's comment rate limits apply to request comments.
5.3 Deleting an account deletes its votes. A request with others' votes or comments keeps its title, while its author is cleared and its body is replaced by a neutral summary the owner writes. This extends I-38's cascade table (6.4).
5.4 **Votes are not weighted by money.** A paying player's vote counts once, like everyone's. The public board shows no breakdown by plan, no paid priority, no pinned or boosted requests and no bounty. This is the roadmap's "no engagement loops ranked by spend" non-goal applied to voice.
5.5 If I-30 ships a supporter badge, it may appear beside a player's name on the board as it does elsewhere. It never changes a count, a sort order or a status.
5.6 The owner's private view may show the share of voters on a paid plan as information, labelled as such. The "How we decide" page says that it exists.
5.7 No leaderboard of top contributors, points or streaks, as [I-39 requirement 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns) forbids.

### 6. Status line and status page

6.1 An external monitor checks `/api/health` at least every 5 minutes from outside Vercel. This closes I-05's monitor item. Slice 0 chooses the tool against the table above: Upptime (free, history in a git repository the owner controls) or UptimeRobot's free plan (commercial use allowed). Better Stack's free plan is for personal projects, and Uptime Kuma would need a production-grade host that does not exist.
6.2 The public status page is hosted off the production stack (GitHub Pages or the monitor's host), so it loads when Vercel or the database is down. It shows the current state, uptime over 30 and 90 days, and incidents with start, end, what players saw and, afterwards, a one-line cause. The hosted page may be English only; the in-app line is localised.
6.3 `GET /api/status` reads the monitor's public status on the server and caches it for 60 seconds. It returns `ok`, `degraded`, `down`, `maintenance` or `unknown`, the time of the last check and the status page URL. If the monitor cannot be read, the answer is `unknown`, never `ok`.
6.4 No browser calls `/api/health`. Only the monitor does, so a page view never costs a database query. A test fails if client code references the path.
6.5 Both footers show one line, "All systems normal · Status", linked to the status page. A banner appears only for `degraded`, `down` or a maintenance notice, in English and French, and can be dismissed for the session.
6.6 The owner can publish a maintenance or incident notice (`StatusNotice`) with a start, an optional end and text in both locales. A notice that cannot be read because the database is down is skipped; the monitor's own state still shows.
6.7 Later, separate lines for card search (Scryfall) and the copilot (the AI provider), derived from the failure rates the server already records (I-05's latency and failure visibility item). `/api/health` keeps its present contract.

### 7. Measuring whether the loop matters

7.1 Measurement reads the board's own tables and I-39's `UserActivityDay`. No new I-39 event is needed, and no identifier leaves the database.
7.2 Owner view: reports per week by kind and status, median time to the first status change, median time from Planned to Shipped, the share of requests shipped, and the top requests.
7.3 **Does shipping a request keep its voters?** Activity in the four weeks after a release, for accounts that voted for the shipped request, beside accounts active in the same weeks that did not. The view states that this comparison is observational and biased towards voters, shows n and a 95% interval, and shows a count instead of a rate under 30, as [I-39 requirement 11.9](i39-first-run-activation-and-measurement.md#11-metrics-defined-to-be-computed) requires.
7.4 No experiment withholds a shipped fix from some players.
7.5 Every incident on the status page appears in the owner view beside the activity of the same day, so the cost of downtime is visible.

### 8. Free and paid

8.1 Everything in this initiative is free for everyone: reporting, voting, reading statuses, release notes and the status page. A player's voice is not a paid feature ([I-30 requirement 1.1](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)).
8.2 It still serves the paid tier in two ways. The board measures demand for a paid candidate before it is built: [I-33](i33-marketplace-ladder.md)'s proposed threshold of "at least 50 distinct players requesting alerts or split carts through feedback" needs exactly this count. And a visible trail from request to release is the argument a cheap subscription makes. Free incumbents keep requests in Discord, a forum or a hosted board, and their changelog articles do not link a change to the request behind it.
8.3 If I-30 ships early access, a release note may say a change is in early access, with its general-release date once known.

## Data model / API

```
src/content/whats-new/<id>.json   id, kind (new|improved|fixed), area, en {title, body}, fr {title, body}, href?, requestIds[]
ReleaseNotePublication  noteId (primary key), firstServedAt          -- written once per environment
User                    + whatsNewSeenAt DateTime?
NotificationPreference  + requestUpdates Boolean @default(true)
BugReport     id, userId? → User (onDelete: Cascade), kind (bug|data|suggestion), description, expected?,
              routeTemplate, locale, buildId, browserFamily, browserMajor, osFamily, viewportBucket, signedIn,
              errorDigest?, sentryEventId?, deckId?, deckConsentAt?, status (new|confirmed|fixed|released|
              notReproducible|duplicate|wontFix|movedToBoard), releaseNoteId?, githubIssueNumber?, createdAt, closedAt?
FeatureRequest  id, authorId? → User (onDelete: SetNull), title, body, locale, status (underReview|planned|inProgress|
                shipped|notPlanned|duplicate), initiative?, duplicateOfId?, releaseNoteId?, moderationState, voteCount,
                createdAt, statusChangedAt
FeatureRequestVote     requestId, userId, createdAt -- primary key (requestId, userId)
FeatureRequestComment  id, requestId, authorId?, parentId?, body, moderationState, createdAt
FeatureRequestStatusChange  id, requestId, from, to, note?, changedById, changedAt
StatusNotice   id, kind (maintenance|incident), en, fr, startsAt, endsAt?, createdById
```

Routes: `/whats-new` and `/whats-new/feed.xml`; `POST /api/user/whats-new-seen`; `POST /api/bug-reports` (signed in or out); `GET /api/user/bug-reports`; `GET` and `PATCH /api/moderation/bug-reports` (moderators); `GET /api/requests` (public); `POST /api/requests`, `POST` and `DELETE /api/requests/[id]/vote`, `POST /api/requests/[id]/comments` (accounts); `PATCH /api/moderation/requests/[id]` (status, merge); `GET /api/status` (public, cached). No public response carries a plan, an entitlement or a voter list.

## Non-goals

- A third-party feedback widget, script or iframe, or any new CSP host for this initiative.
- Screenshots or session replays attached to reports.
- Live chat, a support desk or a promised response time.
- Votes weighted, boosted or sold, paid priority, bounties or delivery dates on the board.
- Downvotes, contributor leaderboards, points or streaks.
- Machine-translated release notes or requests published without review.
- Deck feedback (I-08), Commander rules notices (I-48), a Discord bot (I-46) and an e-mail newsletter.
- Replacing or reformatting `docs/project/changelog.md`.

## Testing strategy

- **Release notes:** schema test over every file (both locales, lengths, same-origin `href`, known `requestIds`); `firstServedAt` written once under concurrent renders; the Atom feed validates; the "recent" label for guests needs no storage.
- **Bug report:** a request with any key outside the allowlist is rejected; the context builder turns `/share/abc123` into `/share/[token]` and drops query strings; the stored row has no user-agent, e-mail or IP column; the scrubber removes e-mails, `Bearer` values, JWT-shaped strings and long hexadecimal and base64 runs (property tests); a deck id is stored only with consent and only for an own or public deck; the payload equals the "What will be sent" panel; signed-out submission works; rate limits apply.
- **Board:** one vote per account; removing a vote; merging moves votes without double counting; a blocked player cannot comment or vote on the blocker's request; report buttons on requests and comments; status history recorded; a guard test that no public response contains plan or entitlement fields; vote counts equal vote rows.
- **Status:** `/api/status` answers `unknown` when the monitor is unreachable; a cache hit touches neither the monitor nor the database; a source test fails if client code references `/api/health`; the banner renders for each non-ok state in both locales.
- **End to end:** footer link, report signed out, reference shown; error page opens the form with the digest attached; `/whats-new` in English and French.
- **Translations:** the existing key-parity test covers the new namespaces.

## Delivery slices

| #   | Slice                                                                                                                           | Depends on                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0   | Decisions: monitor tool and status-page address, bug-report retention; lawyer questions added to I-30 7.2 through I-38 slice 0  | — (owner; no code)                           |
| 1   | Monitor on `/api/health`, external status page live, `docs/engineering` updated (closes I-05's monitor item)                    | 0                                            |
| 2   | `GET /api/status`, footer status line, degraded banner, `StatusNotice`                                                          | 1                                            |
| 3   | Bug report: model, route with allowlist and scrubber, form with "What will be sent", header and footer entries, suggestion kind | —                                            |
| 4   | Error-boundary entry with digest and Sentry event id; `global-error` link                                                       | 3                                            |
| 5   | Moderator triage view, Settings → My reports, GitHub issue promotion with the owner's summary                                   | 3                                            |
| 6   | Release-note schema, first notes for what is on `main`, `/whats-new`, `firstServedAt`, Atom feed                                | —                                            |
| 7   | "New since your last visit" for accounts; the release-note writing rule added to the `chore/docs` checklist                     | 6                                            |
| 8   | A released bug report links to its release note                                                                                 | 5, 6                                         |
| 9   | Board read side: models, public list and detail, statuses, initiative links, "How we decide", suggestions seeded                | 3                                            |
| 10  | Posting, voting, title search and comments                                                                                      | 9; I-38 slices 8 and 12                      |
| 11  | Status workflow: history, merges, Shipped linked to release notes, voter notices with `requestUpdates`                          | 6, 10; I-63 slices 1 to 3 for voter notices  |
| 12  | Owner measurement view (7.2, 7.3, 7.5)                                                                                          | 11; I-39 slice 11                            |
| 13  | Status lines for card search and the copilot                                                                                    | 2; I-05's failure visibility for those paths |

Slices 3 and 6 can start today and need no decision. Slice 1 needs only the owner's choice of monitor. Slice 10 is the first that publishes what players write, so it waits for I-38's report and block slices; scheduled agents must not pick it earlier.

## Open questions

- **Which monitor?** Upptime keeps the history in a repository the owner controls and costs nothing, but GitHub may delay scheduled runs and disables them after 60 days without activity in a public repository; whether Upptime's own commits count as activity needs checking in slice 1. UptimeRobot is simpler and already documented. Both can run together: UptimeRobot for alerts, Upptime for the public history.
- **When does the board open?** With few players, 3 votes against 1 says nothing. One option is to keep the "suggestion" kind private until I-39 shows a stated number of weekly active builders, then open the board with the seeded requests.
- **For the lawyer** (research, not legal advice; add to I-30 7.2 through I-38 slice 0):
  - Does reading browser family, version and viewport when a player submits a report fall under the ePrivacy Art. 5(3) exemption for what is "strictly necessary" for a service the user "explicitly requested" [23], as read in the EDPB's Guidelines 2/2023 [24]?
  - Which lawful basis covers a report linked to an account, and how long may it be kept?
  - If a hosted board were ever used instead, would its cookies need consent? The CNIL excludes from its audience-measurement exemption providers that reuse data or share an identifier across sites [25]. Which transfer basis would cover a US vendor?
  - Is consent enough to copy a player's report text into a public GitHub issue, or should that never happen (3.7 assumes never)?
- **Who writes the French notes?** An agent can draft them in the `chore/docs` pull request, but the owner or a French speaker should approve each one.
- **Should the board show the median time to a first answer?** It is the one number the research ties to continued participation [22], and publishing it is a promise to keep.

## Sources

All read on 2026-11-10 unless stated.

1. Moxfield, [`moxfield-public` issues](https://github.com/moxfield/moxfield-public/issues): 81 open; #150 opened 2026-10-22.
2. Moxfield Discord, [server page](https://discord.com/servers/moxfield-529432261523931143): 15,987 members.
3. EDHREC, [Changelog: redesign follow-up](https://edhrec.com/articles/changelog-redesign-follow-up), 2026-10-22, Garrett Gardner.
4. Archidekt, [News](https://archidekt.com/news): "Development Update" posts tagged changelog, relative dates.
5. ManaBox, [website](https://manabox.app/): footer contact links.
6. TappedOut, [List of Bugs and Feature Requests](https://tappedout.net/mtg-forum/tappedout/list-of-bugs-and-feature-requests/), opened 2015-10-05.
7. Canny, [pricing](https://canny.io/pricing).
8. Featurebase, [pricing](https://www.featurebase.app/pricing).
9. Fider, [pricing](https://fider.io/pricing).
10. Fider, [repository](https://github.com/getfider/fider): AGPL-3.0; release v0.39.0 on 2026-11-03 (GitHub API).
11. Frill, [pricing](https://frill.co/pricing).
12. Upvoty, [pricing](https://upvoty.com/pricing/).
13. GitHub Docs, [Participating in a discussion](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion).
14. Sentry, [User Feedback for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/user-feedback/).
15. UptimeRobot, [pricing](https://uptimerobot.com/pricing/), modified 2026-10-28.
16. Upptime, [repository README](https://github.com/upptime/upptime): MIT.
17. GitHub Docs, [Events that trigger workflows: `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
18. Uptime Kuma, [repository](https://github.com/louislam/uptime-kuma): MIT; release 2.5.9 on 2026-10-31 (GitHub API).
19. Better Stack, [pricing](https://betterstack.com/pricing).
20. Instatus, [pricing](https://instatus.com/pricing).
21. B. L. Bayus, "Crowdsourcing New Product Ideas over Time: An Analysis of the Dell IdeaStorm Community", _Management Science_ 59(1), 2013, 226–244, [abstract](https://econpapers.repec.org/RePEc:inm:ormnsc:v:59:y:2013:i:1:p:226-244).
22. L. Chen, J. R. Marsden, Z. Zhang, "Theory and Analysis of Company-Sponsored Value Co-Creation", _Journal of Management Information Systems_ 29(2), 2012, 141–172, [doi:10.2753/MIS0742-1222290206](https://doi.org/10.2753/MIS0742-1222290206). Abstract read through bibliographic search results only; the full text and the publisher's page were not read.
23. Directive 2002/58/EC, [Art. 5(3), consolidated text of 2009-12-19](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219).
24. EDPB, [Guidelines 2/2023 on the technical scope of Art. 5(3) of the ePrivacy Directive](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en), final version listed on 16 October 2024.
25. CNIL, [Cookies : solutions pour les outils de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience), 2025-07-04.
26. Archidekt, [Feature Voting](https://archidekt.com/features): 19 open and 55 archived requests over four pages, seen 2026-11-10; added 2026-11-11.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player sees whether the site is working, reports a problem from any page with only safe context attached and follows it, reads what changed in production in English or French, and later votes on requests whose status and release note are public.

### Goals

- A player sees the site's status in the footer and on a page that loads while the site is down, sends a report from an error page with only the listed context and follows it to the release note that fixed it, and reads that note in English or French, dated by the day production first served it.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-52-01

As a player who hit a bug, I want to say what happened and see that it was received, so that the error page is not a dead end.

#### US-52-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-52-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-52-01 Happy path

Given a signed-in player and the English locale
When the report takes the player's words and an allowlist of context.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-52-02 Happy path

Given a signed-in player and the English locale
When the player sees a status, not a claim that it was already reported.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-52-03 Happy path

Given a signed-in player and the English locale
When release notes exist in English and French for what reached production.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-52-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-52-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-52-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Guests and signed-in players can report. The public request board stays Later. The monitor choice is the owner's.

#### AC-52-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-52-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-52-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The form is on the error page and in the help path. It does not ask for a password. Release notes are a page, not a modal.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A report row. Context is the route, the locale and the build, not the deck list. Notes ship as authored files.

### Analytics and telemetry

`bug_reported {has_account: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Guests and signed-in players can report. The public request board stays Later. The monitor choice is the owner's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether the browser family on a report needs consent is a lawyer question. The board's opening waits on a stated number of weekly builders, which we do not have yet.

### Sources

- https://edhrec.com/articles/changelog-redesign-follow-up
- https://canny.io/pricing
- https://github.com/upptime/upptime
- https://uptimerobot.com/pricing/

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-52: A Feedback Loop Players Can See

**Spec:** [`specs/i52-feedback-loop-players-can-see.md`](i52-feedback-loop-players-can-see.md)

**Outcome:** a player sees whether the site is working, reports a problem from any page with only safe context attached and follows it, reads what changed in production in English or French, and later votes on requests whose status and release note are public.

**Status:** Next
**Priority:** Next for the status line, the bug report and "What's new" (slices 0 to 8); Later for the request board (slices 9 to 13)
**Impact / effort:** Medium / small for slices 0–8; medium for the board
**Depends on:** the owner's choice of monitor and of the report retention (slice 0); I-38 slices 8 and 12 before players post or vote (slice 10); I-39 slice 11 for the measurement view; I-05's failure visibility for the status lines per service.

A cheap subscription lives on two things: players trust that the product works, and they see it improve in the direction they asked for. Today neither is visible from inside the product. A player who hits a bug has no form, address or link, and the only changelog is a developer log in English that records merges to `dev`, not what reached players; on 2026-11-10 `dev` was 37 commits ahead of `main`. Every product read takes bugs and requests outside the product, through Discord, a forum, e-mail, GitHub issues or a hosted board. EDHREC and Archidekt publish changelog articles ([EDHREC, 2026-10-22](https://edhrec.com/articles/changelog-redesign-follow-up)), and none links a shipped change to the request behind it. Hosted boards either stop being free early, as Canny's does at 25 tracked users ([pricing](https://canny.io/pricing)), or add a processor, a second sign-in or a script the CSP refuses. So the board is built in the product, with self-hosted Fider (AGPL-3.0) as the exit. No controlled study ties a public board to retention, so the spec measures it. Upptime is free on GitHub and UptimeRobot's free plan allows commercial use ([Upptime](https://github.com/upptime/upptime), [UptimeRobot pricing](https://uptimerobot.com/pricing/)). This is product feedback; deck feedback stays in I-08.

### Scope

- [ ] Slice 0, no code: the owner chooses the monitor and the status page's address and sets the bug-report retention; the lawyer questions join I-30 requirement 7.2 through I-38's slice 0.
- [ ] An external monitor that checks `/api/health` at least every 5 minutes, and a status page hosted off the production stack (slice 1). This closes I-05's monitor item. Today no monitor is configured, although `docs/engineering/dx-ci-overview.md` lists UptimeRobot, and `/api/health` (`src/app/api/health/route.ts`) is public, has no rate limit and queries the database on every call.
  - Alert routing, the phone alert for "down" and a page check of `/` beside this monitor, is [I-71](i71-speed-uptime-and-recovery.md) slice 4's, and I-71 owns the availability objective (2026-11-10).
- [ ] `GET /api/status`, cached for 60 seconds, which answers `unknown`, never `ok`, when the monitor cannot be read; a footer status line, a banner only when something is wrong, and owner notices (slice 2). No browser calls `/api/health`, and a test fails if client code references it.
- [ ] A bug report stored first-party and reachable from the header, both footers and the error boundary, with a "What will be sent" panel, an allowlist of context, a deck id only behind an unticked consent box, and free text scrubbed of e-mail addresses and tokens (slices 3–4). Today `src/app/[locale]/error.tsx` says the problem "has been reported" and shows a reference but takes nothing from the player, and `src/app/global-error.tsx` renders in English only.
  - [I-64](i64-help-centre-and-guidance.md) slice 9 adds one field to the allowlist, the help article the player came from, and shows up to three matching articles beside the form without blocking it. No second support channel is added.
  - [I-70](i70-ai-quality-bench-and-model-changes.md) slice 15 adds the kind `ai_output`, opened from the wizard's result and the suggestion panel, with the AI context attached only behind unticked boxes (2026-11-10).
- [ ] A moderator triage view, Settings → My reports, and promotion to a GitHub issue with the owner's summary, never the player's words (slice 5).
  - The triage view uses [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s moderator role and `requireOperator` once its slice 1 exists (2026-11-10).
- [ ] Human-written release notes in English and French, one file per note under `src/content/whats-new/`, written in the `chore/docs` PR and dated by the first day production served them; `/whats-new`, an Atom feed and a header dot for accounts, with no modal or toast (slices 6–7). `docs/project/changelog.md` stays the developer log.
- [ ] A released bug report links to its release note (slice 8).
- [ ] Later: the request board's read side; posting and voting after I-38's report and block slices; a status workflow with merges and links to release notes; the owner's measurement view; and status lines for card search and the copilot (slices 9–13).
  - Voters' notices (slice 11) reach the inbox through [I-63](i63-one-notification-system.md) slices 1 to 3, and the spec's `requestUpdates` column becomes I-63's "Requests I voted for" category.

### Engineering enablers

- A report carrying any key outside the allowlist is rejected, the stored row has no user-agent, e-mail or IP column, and the payload equals the "What will be sent" panel.
- The scrubber removes e-mail addresses, `Bearer` values, JWT-shaped strings and long hexadecimal and base64 runs, under property tests.
- `firstServedAt` is written once under concurrent renders, and a note missing either locale fails the schema test.
- One vote per account per request, and a guard test fails if any public response carries a plan, an entitlement or a voter list.

**Paid-tier angle:** everything here is free: reporting, voting, statuses, release notes and the status page. A paying player's vote counts once, and the board shows no split by plan. Its use to I-30 is evidence and trust. The board counts demand for a paid candidate before it is built, which I-33's threshold of 50 distinct players needs, and a visible trail from request to release is the argument a cheap subscription makes.

### Enrichment (2026-11-11)

**User story.** As a player who hit a bug, I want to say what happened and see that it was received, so that the error page is not a dead end.

**Acceptance.**
- The report takes the player's words and an allowlist of context.
- The player sees a status, not a claim that it was already reported.
- Release notes exist in English and French for what reached production.

**UX.** The form is on the error page and in the help path. It does not ask for a password. Release notes are a page, not a modal.

**Data and API.** A report row. Context is the route, the locale and the build, not the deck list. Notes ship as authored files.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `bug_reported {has_account: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Guests and signed-in players can report. The public request board stays Later. The monitor choice is the owner's.

**Open questions.** Whether the browser family on a report needs consent is a lawyer question. The board's opening waits on a stated number of weekly builders, which we do not have yet.

### Definition of done

A player sees the site's status in the footer and on a page that loads while the site is down, sends a report from an error page with only the listed context and follows it to the release note that fixed it, and reads that note in English or French, dated by the day production first served it.

---

