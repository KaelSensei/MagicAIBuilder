# I-39: First Run, Activation And Product Measurement

> **Status:** Proposed · **Priority:** Next · **Written 2026-11-09**
> **Research:** dated notes on onboarding, measurement law and benchmarks. The notes are not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice, and go to the lawyer questions in [Open questions](#open-questions).
> **Owns:** the path from the landing page to a first useful deck, the replacement of the onboarding dialog, empty states, sample decks, the first-build checklist, keeping a guest's work when they create an account, the product event contract and its minimisation rules, the definitions of activation, retention and a north-star metric, the owner's activation view and the experiment protocol. **Does not own:** importers ([I-10](../roadmap.md#i-10-interoperability-and-integrations)); the precon catalogue ([I-17](i17-precon-path-and-tiered-upgrades.md)); explanations of rules ([I-27](i27-learning-while-building.md)); the landing page's visual design ([I-13](i13-visual-direction.md)); conversion, churn, revenue and the owner metrics page ([I-30](i30-business-model-and-paid-tier.md)); deck view counts ([I-36](i36-creator-and-embed-toolkit.md)); the referral baseline ([I-34](i34-commander-data-reports.md)); the statistics method ([I-21](i21-reproducible-probability-bench.md)); the privacy policy, account deletion and the list of processors ([I-38](i38-trust-safety-and-user-rights.md)). The choice of an analytics product stays an [I-05](../roadmap.md#i-05-production-safety) item, which waits for "the product questions it must answer"; this spec writes those questions.

## Overview

I-30 needs evidence before a price: how many accounts are active, whether new players reach a useful deck, whether they come back, and which tools they use. Today none of that can be counted. The product has no event store, no activation definition and no retention view. I-30's audit concludes: "Conversion cannot be measured today."

The first run also loses players it already won. A modal covers the landing page on a first visit. A guest who builds a deck and then creates an account lands on an empty deck list, because sign-up ignores the return address and nothing moves the guest deck into the account.

This spec fixes the first run and then measures it, in that order. The principles:

- **Value before sign-up.** A visitor can search, build, check, playtest and export without an account, as the guest builder already allows. The Fan Content Policy forbids requiring "email registration to access your Fan Content" [7].
- **Measure in our own database.** Events are written server-side by the app's own routes, carry no email, name, IP address, deck content or URL, and never reach a third party.
- **Few honest events.** Most metrics derive from tables that already exist. New events cover only what no table records.
- **No dark patterns and no engagement loops.** Nothing nags, counts down or ranks by spend ([non-goals](../roadmap.md#deliberate-non-goals-from-the-benchmark)).

## What the market does

All pages were read on 2026-11-09 unless another date is given.

**First run.**

| Product                   | Account needed to start                                                                                                                                                                                               | First step offered                                                                                                  | Source   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| EDHREC                    | No: "optional account access" adds retail pricing filters, salt scores and dark mode (guide dated 2025-06-03)                                                                                                         | Choose a commander; the Recs page takes "a partial or complete deck list"; a commander alone gives the average deck | [10]     |
| Archidekt                 | Signed-out home page shows "Deck sandbox" and "Create new deck", both linking to `/sandbox`; "Add to existing deck" goes to login. **Conflict:** the undated FAQ says "While logged in" for both New Deck and Sandbox | Sandbox or a commander card; paste import ("Paste any list of cards into the text area")                            | [8][9]   |
| ManaBox                   | No: "Your data is not tied to your ManaBox account in the non sync version"; the account serves Cloud Sync, a Pro feature; free users back up to Google Drive or iCloud                                               | The app itself, local-first                                                                                         | [11]     |
| DeckCheck                 | Chat needs an account: "Open to every account, no subscription needed"                                                                                                                                                | "Create account", "Browse Commander precons", "Commander Brackets guide"                                            | [12]     |
| Moxfield                  | Not verified: the home page answered HTTP 403 to an automated request                                                                                                                                                 | —                                                                                                                   | [13]     |
| Arena trackers            | Not verified: Untapped.gg's Companion page answered 403                                                                                                                                                               | —                                                                                                                   | [14]     |
| Playgroup, TableCommander | Search summaries only: Playgroup playtests a pasted public Moxfield or Archidekt link without an account; TableCommander builds without an account and asks for one to save                                           | Paste a link; build first                                                                                           | [15][16] |

The readable references let a visitor start without an account, and two start from a list or a link the player already has. None of the readable pages describes a guided first build, and none says how sandbox work moves into a new account. Archidekt's sandbox was not opened, so that point is unchecked there.

**Measurement without consent in France.** The CNIL exempts audience-measurement trackers from consent when they serve only audience measurement for the publisher, produce "données statistiques anonymes uniquement", allow no tracking across sites, and lead to no "recoupement des données avec d'autres traitements". It recommends a tracker lifetime of 13 months, not extended on new visits, retention of at most 25 months, and informing users in the privacy policy. The page, dated 2025-07-04, **names no product**: it offers a self-assessment tool whose use "ne préjuge pas" of the CNIL's analysis, and providers may not call a tool "certifiée" or "validée par la CNIL" [1]. The older developer sheet (2020-06-11) says "Most large audience measurement offerings do not fall within the scope of the exemption, regardless of their configuration", advises "open source software such as Matomo that you can configure yourself", and asks to "truncate the last byte of the IP address" [2]. Neither page addresses server-side logs.

| Tool              | How it counts                                                                                                                                                                                                            | Hosting                                         | Consent position, with its author                                                                                             | Source |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| Matomo, CNIL mode | IP masked by 3 bytes (2 minimum), trackers 13 months at most, raw data 744 days (at most 759); heatmaps and session recordings off, "because no tracking of individual user's navigation is permitted"; User ID disabled | Self-hosted or Matomo Cloud                     | Matomo's self-assessment: exempt "if properly configured"; the opt-out must be set up by hand                                 | [3]    |
| Plausible         | `hash(daily_salt + website_domain + ip_address + user_agent)`, salt "rotated and deleted every 24 hours"; no raw IP or user agent stored; no cookies                                                                     | EU only; the company is incorporated in Estonia | Plausible: no banner needed (vendor claim; policy updated November 2026)                                                      | [4]    |
| Umami             | "does not use cookies"                                                                                                                                                                                                   | Self-hostable                                   | Umami: compliance "depends on how you configure and use it"                                                                   | [5]    |
| PostHog Cloud EU  | IP capture off by default for new EU projects                                                                                                                                                                            | Frankfurt                                       | PostHog: "you must provide a mechanism for the consensual capturing" of data, and a banner for cookies on logged-out visitors | [6]    |

**Benchmarks.** No conversion, activation or retention figure for any MTG tool was found here or by I-30.

- **Freemium conversion, B2B-weighted:** a survey of "1,000+ products" by Lenny Rachitsky and Kyle Poyar, mostly B2B SaaS, rates 3–5% "GOOD" and 6–8% "GREAT" for self-serve freemium, and 8–12% "GOOD" for free trials (2023-08-01) [17]. I-30 assumes 3% (A7), the low end of that band, from a different market.
- **Churn:** Recurly's page, "updated with July 2026 data", gives 3.60% overall churn, 4.14% for digital media and entertainment and 3.22% for software. It labels the same figures "average" in one place and "median annual" in another, and gives no sample size [18]. The units are unclear, so this spec sets no target from it.
- **Experiments:** checking significance after every observation turned a nominal 5% false-positive rate into 26.1% in Evan Miller's example; his remedy is to fix the sample size in advance and "Don't report significance levels until an experiment is over" (2010-04-18) [19].

**Dark patterns** (research, not legal advice). DSA Article 25(1) forbids online platforms to design interfaces that deceive or manipulate users, but Article 19(1) excludes micro and small enterprises from that section, and Article 25(2) leaves practices covered by the Unfair Commercial Practices Directive and the GDPR to those texts [22]. The EDPB's Guidelines 03/2022 on deceptive design patterns (version 2.0, 2023-02-24) catalogue them for social media [20]. Requirement 7 is therefore a product rule first; the binding law is a lawyer question.

**Fan Content Policy.** It forbids requiring "payments, surveys, downloads, subscriptions, or email registration to access your Fan Content", and allows "sponsorships, ad revenue, and donations" as long as "it doesn't interfere with the Community's access" [7]. A sign-up wall in front of the builder would meet the first clause. Ads are allowed, but Matomo reads the exemption as excluding marketing measurement such as conversions and advertising campaigns [3], so ad trackers would need consent; they are a non-goal here.

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `61792c1`).

- **Onboarding dialog.** `src/components/onboarding/OnboardingWizard.tsx` is a four-step Radix modal (welcome, create a deck, search cards, track stats). `OnboardingProvider` mounts it inside every `[locale]` page through `src/app/[locale]/providers.tsx`, the landing page and public deck pages included. `src/hooks/useOnboarding.ts` shows it to a signed-out browser until `localStorage["mab-onboarding-done"]` is `"true"`, and to an account while `User.onboardingDone` is false. The two flags never meet, so a guest who dismissed it sees it again after sign-up. "Replay tutorial" in `src/components/auth/UserMenu.tsx` reopens it, for accounts only. The e2e helper `suppressOnboarding` (`e2e/helpers.ts`) exists because "the wizard's backdrop intercepts pointer events". I-27 calls the modal the anti-pattern to avoid.
- **Its copy is wrong in two places** (`src/messages/en/onboarding.json`). Step 2 says to click "New Deck" in "the top-right corner of any page"; the landing navbar has no such button. Its hint offers "the AI Wizard"; `DeckWizard` is mounted only on `/decks`, which needs a session, and both AI routes call `requireAuth()`.
- **Landing.** `src/components/landing/` leads with "Start a guest deck" (`/builder/guest`) and the note "Begin as a guest". Of the capability atlas's actions, "Open collection" (`/collection`), the playtest stop's "Open my decks" (`/decks`) and "Browse Game Changers" (`/rules/game-changers`) all need a session (`PUBLIC_PATH_PREFIXES` in `src/middleware.ts`), so a visitor is sent to sign-in, although the guest builder keeps its Playtest button. The hero preview is decorative and names no cards.
- **Guest mode.** `src/lib/deck/guest-deck.ts` keeps one deck in `localStorage["magic-ai-builder:guest-deck:v1"]`. The guest builder hides Duplicate and the visibility toggle; Import, Bulk Edit, Playtest and Export stay. Export runs in the browser (`ExportModal` makes no request). `/api/import` is public and limited per IP. The AI panel is not hidden; when it asks for suggestions, `useAISuggestions` shows `AI request failed (401)`.
- **Guest to account.** `GuestDeckNotice` says "Saved in this browser only. Create an account to keep it safe and access it anywhere." and links to `/auth/signup?callbackUrl=/builder/guest`. `SignUpForm` ignores `callbackUrl` and always sends both credentials and Google sign-up to `/decks`; `SignInForm` honours it. Nothing copies the guest deck into an account, so the new account starts with "No decks yet - create your first deck!" while the guest deck stays in the browser, unlinked.
- **Sign-up** asks for name, email and password (`src/app/api/auth/signup/route.ts`), limited to 5 attempts per IP per 15 minutes. Google sign-in is the other route. Sessions are JWTs, so no server table records visits.
- **Empty `/decks`:** "Start building" with one "Create Deck" button; the AI builder and New Deck sit in the controls row (`DecksHomeControls`). There is no import or sample in the empty state.
- **Sample decks.** `TemplatesModal` is mounted nowhere. `GET /api/templates` (`src/app/api/templates/route.ts`) returns two hardcoded templates for any commander, with invented authors ("CommunityBuilder", "TopPlayer") and upvote counts; the middleware matcher skips `/api`, and the GET handler calls no auth check. The `DeckTemplate` model is unused. `prisma/seed.ts` creates a demo Atraxa deck for development only.
- **Telemetry.** `@sentry/nextjs` runs on client and server; `src/instrumentation-client.ts` sets `replaysSessionSampleRate: 0.01` and `replaysOnErrorSampleRate: 1.0` with `replayIntegration()` called without options. `@vercel/speed-insights` loads in `src/app/[locale]/layout.tsx`. The CSP (`src/lib/security-headers.ts`) allows `script-src 'self' 'unsafe-inline'` and connections to Scryfall, both Sentry ingest regions and `vitals.vercel-insights.com`. A grep of `src/` and `package.json` for posthog, plausible, umami, matomo, gtag, mixpanel, amplitude, `@vercel/analytics`, logrocket and hotjar finds nothing.
- **No event store, no privacy page.** No table records a user's activity by day. `User` has `createdAt` and no activity field; `Deck` has `createdAt`, `updatedAt`, `isAIGenerated`, `isPublic` and `forkedFromDeckId`, and no origin; `PlaytestSession` and `DeckSnapshot` carry `createdAt`. `src/app/[locale]/` has no privacy or legal route.
- **Rate limiting.** `src/lib/rate-limit.ts` is an in-process `Map`, "per-instance (not distributed)", keyed by `getClientIp()`. It is enough to damp abuse of an event endpoint, not to count anything exactly.
- **Format size.** `FORMAT_CONFIG[format].deckSize` in `src/lib/deck/formats.ts` gives 100 for Commander and 60 for the other formats.

## Functional requirements

### 1. Value before sign-up

1.1 No modal, overlay or prompt opens on `/`, `/deck/*`, `/share/*`, `/u/*`, `/commanders/*` or `/auth/*`.
1.2 The landing page offers three starts of equal weight, each usable signed out and each reaching the builder in one navigation: a blank guest deck, an import into the guest deck, and a sample deck.
1.3 Every landing link works signed out or states before the click that it needs an account. The playtest stop links to the guest builder.
1.4 Search, editing, legality and bracket checks, playtest and export stay available to a guest. None of them moves behind sign-up.
1.5 A sign-up prompt appears only where an account adds something: a second deck, another device, AI, publishing. It says what the account adds.

### 2. Import as a first step

2.1 The guest builder's empty state and the empty `/decks` page offer import beside a blank deck: paste text, or a URL from a source I-10 supports.
2.2 A refused Moxfield URL ends in I-10's typed refusal, with a one-action switch to the paste tab.
2.3 Once [I-29](i29-cross-site-deck-index.md)'s link-outs ship, they sit beside import as a way to find a list to start from on another site, without copying it.
2.4 A guest import shows the same preview as an account import: zones, commanders, unresolved names and duplicates.

### 3. The onboarding dialog is replaced

3.1 The global modal is removed. An inline first-run panel sits in the empty builder, for guests and accounts, and offers three actions: choose a commander (focuses search), paste or import a list, open a sample deck.
3.2 The panel never blocks input, never takes focus on load, is fully usable by keyboard, and disappears once the deck holds a card.
3.3 Its copy describes only the screen it sits on, in English and French ([I-11](../roadmap.md#i-11-localization-and-regional-experience)).
3.4 A guest's dismissal carries to the account at sign-up. "Replay tutorial" reopens the panel without a modal.

### 4. Empty states and sample decks

4.1 The empty `/decks` page offers New deck, Import, Sample deck and the AI builder. The AI builder is labelled as a model's proposal checked by rules ([I-02](i02-checkable-ai-copilot.md)).
4.2 Sample decks are official precon lists opened as working copies through I-17 slice 2. Until then, at most two sample decks written by the owner, committed as fixtures and labelled "Sample" with their date.
4.3 A sample opens as a copy, and editing the copy never changes the sample.
4.4 **No invented social proof.** `GET /api/templates` is deleted or returns real rows only. No author, vote or usage count is shown that did not come from a person.

### 5. A first-build checklist, not a tour

5.1 Beside the deck, a checklist computed from the deck's state: commander chosen; deck at `deckSize`; no legality warning (I-03); one opening hand drawn; exported, published or saved to an account. Each item links to the tool that completes it.
5.2 Items tick from the deck's state, never from clicks on the checklist. The checklist collapses, and one action hides it for good.
5.3 It gives no deckbuilding numbers such as land counts. It links to [I-28](i28-commander-deckbuilding-guide-by-bracket.md)'s guide and to I-27's explanations instead.

### 6. A guest keeps their work

6.1 Sign-up honours `callbackUrl` for credentials and Google, as sign-in does. Only a same-origin relative path is accepted; anything else falls back to `/decks`.
6.2 On the first sign-in in a browser that holds a non-empty guest deck, the product offers "Save this guest deck to your account" with the deck's name and card count. Accepting creates a normal deck with origin `guest_claim`; the local copy is cleared only after the server confirms the save. Declining keeps it.
6.3 The offer appears once per guest deck and stays reachable from `/decks`.
6.4 Until 6.2 ships, the guest notice says the deck stays in this browser and that an account does not yet move it.
6.5 In guest mode the AI panel says that suggestions need an account, and, once I-30 ships, what the free allowance is. It never shows a raw status code.

### 7. No dark patterns

7.1 A decline or dismiss control has the same size and weight as the matching accept. No confirmshaming copy, no pre-ticked box, no countdown, no scarcity claim.
7.2 At most one sign-up prompt is visible at a time. Public read-only pages show only the header's sign-in link.
7.3 **No fake doors.** No control is shown for a feature that does not exist. Interest in a future paid feature is asked through a survey labelled as a survey (12.3).
7.4 No streaks, points, re-engagement email or push notification, and no visibility ranked by spend or activity.

### 8. Event contract and minimisation

8.1 Measurement is first-party: the app's own server routes write events to PostgreSQL. No third-party analytics script, pixel or SDK loads, and `script-src` gains no host.
8.2 Only these events exist; everything else is derived from existing tables (account creation from `User.createdAt`, playtests, snapshots, publishing, and AI calls from I-30's `AiUsage`):

| Event                  | Written when                                                                                                                                                                     | Properties (enums or integers only)                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `deck_created`         | A deck is created                                                                                                                                                                | `origin`: blank, import_text, import_url, ai_build, fork, duplicate, guest_claim, sample                                                       |
| `deck_full_size`       | A deck first reaches `deckSize` with its commander where required                                                                                                                | `origin`, minutes since the deck was created                                                                                                   |
| `import_attempted`     | An import finishes                                                                                                                                                               | `source`: text, archidekt, moxfield, other; `outcome`: ok, partial, refused, failed                                                            |
| `export_done`          | An export is downloaded or copied (first-party beacon)                                                                                                                           | `format`; the deck in the `deckId` column                                                                                                      |
| `first_run_choice`     | A first-run panel action is taken                                                                                                                                                | `choice`: commander, import, sample, dismiss                                                                                                   |
| `guest_claim`          | 6.2 resolves                                                                                                                                                                     | `result`: offered, accepted, declined                                                                                                          |
| `experiment_exposure`  | An account first sees an experiment arm                                                                                                                                          | `experiment`, `arm`                                                                                                                            |
| `ai_suggestion_action` | A player adds or ignores a copilot suggestion _(added 2026-11-10 from [I-70 10.1](i70-ai-quality-bench-and-model-changes.md#10-player-signals-that-feed-the-set))_               | `action`: added, ignored; `position` 0–7; `dimension`: main, budget, power, playstyle; `promptVersion`; `model`                                |
| `share_action`         | A player copies or shares a link, an embed snippet or a deck image _(added 2026-11-10 from [I-72 3.2](i72-growth-loops-referrals-creators-and-return.md#3-measuring-each-loop))_ | `surface`: deck_page, share_page, embed_snippet, image_download, recap, referral_link; `method`: copy, native; the deck in the `deckId` column |

8.3 No measurement row or log line holds an email, name, username, IP address, user agent, deck name, description, card name or list, search query, free text, or a URL. A schema test guards the allowlist, and a write with an unknown property is rejected.
8.4 **Activity days.** One `UserActivityDay` row per account per UTC day, with a bitmask: edit, import, export, playtest, ai, share. One helper writes it, called by the mutation routes.
8.5 **Guests carry no identifier.** Guest activity is counted only as `DailyCounter` aggregates (guest builder opened, guest import by outcome, guest deck reaching full size), written server-side or by a beacon that sends no identifier, sets no cookie and writes no storage. These counts are labelled as inflatable.
8.6 Writes happen after the user's action commits and never fail it. Beacons are limited per IP with `checkRateLimit`; the address stays an in-memory key and is never stored.
8.7 **Opt-out.** A settings switch stops all writes for the account and deletes its past rows. Deleting the account cascades to them.
8.8 **Retention.** Rows older than 25 months, the CNIL's recommended maximum for audience-measurement data [1], fold into weekly cohort aggregates without account ids and are deleted.
8.9 I-38's privacy policy carries a measurement section written here: what is measured, why, for how long, and the opt-out. Its processor list covers what is already in use: Vercel (hosting and Speed Insights), Supabase, Sentry, Google sign-in and the AI providers.

### 9. Telemetry already in place

9.1 Sentry's random-session replay goes to zero (`replaysSessionSampleRate: 0`). Matomo disables session recording in CNIL mode because individual navigation may not be tracked [3]. Error replays stay, with text masking and media blocking set explicitly rather than by default.
9.2 The Sentry DSN uses the EU region, which the CSP already allows (`*.ingest.de.sentry.io`). The DSN is an environment variable, so the region is confirmed in the deployment, not in code.
9.3 No URL sent to a third party carries a share token, a username or a query string.

### 10. Page analytics, only if I-05 chooses it

10.1 If I-34's referral baseline needs page views and referrers, I-05 records one cookieless tool that meets the CNIL conditions in [1]: self-hosted Matomo in CNIL mode, Plausible, or self-hosted Umami. PostHog Cloud EU is not a candidate, because its own documentation asks for consent [6].
10.2 It receives route templates (`/deck/[id]`), never concrete paths, `/share/` tokens or query strings, and is never joined to section 8's data.
10.3 The decision names an exit path, as the [strategic boundaries](../roadmap.md#strategic-boundaries) require.

### 11. Metrics, defined to be computed

11.1 **Full-size deck:** the card count, commander and partner included, equals `FORMAT_CONFIG[format].deckSize`, with a commander where `hasCommander`. The first time is stored in `Deck.firstFullSizeAt`. "Full-size" is not "legal"; legality needs card data on the server and is a later refinement.
11.2 **Activated account:** a full-size deck within 7 days of `User.createdAt`. A claimed guest deck that is already full-size counts at the claim.
11.3 **Time to first full-size deck:** `firstFullSizeAt − User.createdAt` for the account's first such deck, and from the guest deck's own `createdAt` for a claimed deck. Reported as median and 75th percentile with n.
11.4 **Active account (30 days):** an edit or ai bit in the last 30 days, identical to I-30 requirement 8.1.
11.5 **Weekly active builder:** an edit day in the ISO week (UTC).
11.6 **Retention Wk:** the share of an activation-week cohort with any activity day in week k after it, for k = 1, 4, 8 and 12.
11.7 **North-star candidate: weekly game-ready builders.** Accounts that, in the ISO week, playtested, exported or published a deck that was full-size at that moment. It measures the end of the loop the positioning promises, "test it before game night". The alternative is weekly active builders. The owner picks one after 8 weeks of baseline and records the choice.
11.8 **Guardrails** shown beside it: import refusals by source, I-30's AI outcomes (truncated, rejected by the validator), and the share of first runs dismissed.
11.9 A denominator under 30 is shown as a count, not a rate, as I-30 requires. Every rate shows n and a 95% interval.

### 12. The owner's view and I-30's evidence

12.1 An owner-only page shows section 11 weekly. It shows aggregates only; no page lists one account's activity.
12.2 **For I-30's pricing decision:** 30-day active accounts, the denominator of every scenario in I-30 requirement 8; AI calls per active account from `AiUsage`, which replaces its assumptions A5 and A6; the share of active accounts using the free version of each paid candidate (playtest for I-31, collection for I-16, exports and imports); and the retention of activated accounts, which says whether a free habit exists to convert.
12.3 **Willingness to pay** comes from one opt-in survey, multiple choice with no free text, linked in settings and shown inline once to accounts active in 4 of the last 8 weeks. It is labelled as a survey and reported as counts.
12.4 Nothing in this initiative is a paid feature. Its use to I-30 is evidence: it turns I-30's audience and cost assumptions into counts before a price is set.

### 13. Experiment discipline

13.1 Before an experiment starts, a dated file under `docs/experiments/` states the hypothesis, one primary metric, the minimum detectable effect, the sample size per arm, the duration and the stop rule.
13.2 If the sample expected in four weeks is below the required size, there is no A/B test. The change ships or not on judgment, with a dated before-and-after note that states its weakness.
13.3 Significance is computed only at the planned end [19]. Every result is published in its file, null results included, with intervals and I-21's "not distinguishable at this sample size" wording.
13.4 Arms are assigned to accounts only, by hashing the account id with the experiment name. Guests are not assigned until the lawyer answers open question 1.
13.5 No arm varies prices before I-30 slice 0, nor legality, rules, evidence or the free and paid line.

**Computed** (two-sided α = 0.05, power 0.8, two-proportion test), sample needed per arm:

| Baseline → target | Per arm | Example                         |
| ----------------- | ------- | ------------------------------- |
| 30% → 40%         | 356     | Activation, large effect        |
| 10% → 15%         | 686     | Guest claim acceptance          |
| 20% → 25%         | 1,094   | Week-4 retention                |
| 30% → 35%         | 1,377   | Activation, modest effect       |
| 3% → 4%           | 5,301   | Free-to-paid, I-30's assumption |

A 95% interval around 30% is ±9.0 points at n = 100 and ±2.8 at n = 1,000.

## Data model / API

```
Deck              + origin (blank|import_text|import_url|ai_build|fork|duplicate|guest_claim|sample), firstFullSizeAt DateTime?
User              + measurementOptOut Boolean @default(false), firstRunDismissedAt DateTime?   (replaces onboardingDone)
ProductEvent      id, name (enum), userId? → User (onDelete: Cascade), deckId?, occurredAt, props Json (allowlisted per name), appVersion
                  — index (name, occurredAt), (userId, occurredAt)
UserActivityDay   userId → User (onDelete: Cascade), day Date, actions Int (bitmask) — primary key (userId, day)
DailyCounter      day Date, name (enum), dims String (enum values joined), count Int — primary key (day, name, dims)
CohortAggregate   cohortWeek, metric, week, numerator, denominator — written by the 25-month fold
```

Routes: `POST /api/events` (beacon; allowlisted names only; signed-in rows get the session's user id, anonymous rows only increment `DailyCounter`); `POST /api/user/guest-claim` (the guest deck as the import route's validated payload); `PATCH /api/user/measurement` (opt-out); `GET /api/owner/activation` (owner-only aggregates).

## Non-goals

- Third-party ad trackers, pixels, fingerprinting, cross-site identifiers, data sale or sharing.
- Session replay or heatmaps for analytics, and any per-account activity page.
- Marketing email, drip campaigns, push notifications, streaks or gamified onboarding.
- Requiring an account to build, check, playtest or export, or a product tour in a modal.
- Fake-door tests, invented social proof, and price experiments before I-30's legal gate.
- A legality check on the server for activation; "full-size" stands until one exists.

## Testing strategy

- **First run (sociable, Playwright):** a fresh browser on `/`, `/deck/<id>` and `/share/<token>` sees no dialog and can reach the builder without `suppressOnboarding`; the panel leaves focus where it was and closes after the first card.
- **Continuity:** sign-up with `callbackUrl=/builder/guest` returns there for credentials and Google; an absolute or `//host` value falls back to `/decks`; an accepted claim creates a deck with origin `guest_claim` and clears local storage only after a 2xx; a failed claim keeps it.
- **Allowlist (solitary):** each event accepts its enums and rejects a string property, an email-shaped value, a URL and an unknown key; `UserActivityDay` writes once per day per account.
- **Privacy:** with opt-out on, no row is written and past rows are gone; a deleted account leaves no rows; the fold leaves no row older than 25 months with a user id; no response sets a cookie for measurement.
- **Metrics:** a fixture of accounts, decks and activity days reproduces activation, time to full size, retention and the north-star counts by hand; denominators under 30 render as counts.
- **No dark patterns:** a component test asserts that decline and accept controls share a variant and size; a route test asserts that `GET /api/templates` returns no row the database did not hold.
- **Telemetry:** a config test asserts `replaysSessionSampleRate` is 0 and masking options are set.
- **Experiments:** assignment is stable for one account and balanced across 10,000 ids; the sample-size function reproduces the table above.

## Delivery slices

| #   | Slice                                                                                                                 | Depends on                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0   | Lawyer questions added to I-30's list; the measurement section of I-38's privacy policy (8.9)                         | I-38's privacy policy; owner and counsel for the questions                      |
| 1   | Stop the onboarding modal opening on public pages and correct its two wrong sentences (1.1)                           | —                                                                               |
| 2   | Sign-up honours `callbackUrl`; honest guest notice; guest AI message (6.1, 6.4, 6.5)                                  | —                                                                               |
| 3   | Delete or fix `GET /api/templates` (4.4)                                                                              | —                                                                               |
| 4   | Sentry replay settings and URL scrubbing (9.1–9.3)                                                                    | —                                                                               |
| 5   | Inline first-run panel and empty states with import (2, 3.1–3.2, 3.4, 4.1)                                            | 1                                                                               |
| 6   | Guest deck claim on first sign-in (6.2, 6.3)                                                                          | 2                                                                               |
| 7   | Landing starts and links that work signed out (1.2, 1.3)                                                              | 5                                                                               |
| 8   | Interim sample decks; later replaced by I-17's precons (4.2, 4.3)                                                     | 3, 5; I-17 slice 2 for precons                                                  |
| 9   | First-build checklist (5)                                                                                             | 5                                                                               |
| 10  | Event store: models, allowlist test, opt-out, 25-month fold (8.1–8.8)                                                 | 0                                                                               |
| 11  | Instrumentation: deck origin and full size, imports, exports, first-run choice, claims, activity days, guest counters | 10; 5 and 6 for their events; guest browser beacons wait for open question 1(b) |
| 12  | Owner activation view (11, 12.1)                                                                                      | 11                                                                              |
| 13  | I-30 evidence: AI calls per active account, paid-candidate usage, opt-in survey (12.2, 12.3)                          | 12; I-30 slice 1                                                                |
| 14  | Experiment protocol: template, assignment helper, sample-size function (13)                                           | 10                                                                              |
| 15  | Cookieless page analytics (10)                                                                                        | **Blocked** on I-05's tool decision; 0                                          |

Slices 1 to 4 ship alone and need no schema change. Slices 1, 2 and 6 stop the first run from losing players; slices 10 to 12 make the losses countable. Slice 13 is the one I-30 waits for.

## Open questions

1. **For the lawyer (research, not legal advice; add to I-30 requirement 7.2):** (a) Do first-party events tied to an account id need consent, or are legitimate interest, notice and an opt-out enough? (b) Does a first-party beacon sent from the browser fall under ePrivacy Article 5(3) as the EDPB reads it in Guidelines 2/2023 [21], and if so, does the CNIL exemption [1] cover an identifier-free counter? (c) Do Sentry error replays need consent? (d) Does Article 25 of the DSA bind the product at its size [22], or only the UCPD and the GDPR?
2. **Which north star?** Weekly game-ready builders measure the promised loop but need exports to be counted by a beacon; weekly active builders need nothing new but reward editing for its own sake.
3. **Is seven days the right activation window, and is "full-size" an honest proxy** until a server-side legality check exists?
4. **Should page analytics exist at all?** I-34 needs referrers to measure citations; section 8 answers I-30 without them. If yes, which tool and who hosts it?
5. **One guest deck or several?** The guest builder keeps one deck; Archidekt's signed-out home page opens a sandbox for any commander [9], and ManaBox keeps everything local without an account [11].

## Sources

Read 2026-11-09 unless dated otherwise. "Search summary" means the claim comes from a search engine's summary, not the page.

1. CNIL, [Cookies : solutions pour les outils de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience), dated 2025-07-04.
2. CNIL, [Sheet n°16: Use analytics on your websites and applications](https://www.cnil.fr/fr/node/677), dated 2020-06-11.
3. Matomo, [How do I configure Matomo without tracking consent for French visitors (CNIL exemption)?](https://matomo.org/faq/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/), undated; cites the CNIL's July 2025 publication.
4. Plausible, [Data policy](https://plausible.io/data-policy), last updated November 2026.
5. Umami, [FAQ](https://docs.umami.is/docs/faq), undated.
6. PostHog, [PostHog & GDPR compliance](https://posthog.com/docs/integrate/gdpr), undated.
7. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
8. Archidekt, [FAQ](https://archidekt.com/faq), undated.
9. Archidekt, [home page](https://archidekt.com/), signed out.
10. EDHREC, [How to use EDHREC](https://edhrec.com/guides/how-to-use-edhrec), John Sherwood, 2025-06-03.
11. ManaBox, [FAQ](https://manabox.app/guides/general/faq/), undated.
12. DeckCheck, [home page](https://deckcheck.co/).
13. Moxfield, [home page](https://moxfield.com/), HTTP 403.
14. Untapped.gg, [MTG Arena Companion](https://mtga.untapped.gg/companion), HTTP 403.
15. Playgroup, [Solo playtest demo](https://playgroup.gg/playtest/demo), search summary.
16. TableCommander, [Getting started](https://tablecommander.com/getting-started), search summary.
17. Lenny Rachitsky and Kyle Poyar, [What is a good free-to-paid conversion rate?](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion), 2023-08-01.
18. Recurly, [Churn rate benchmarks](https://www.recurly.com/research/churn-rate-benchmarks), "updated with July 2026 data".
19. Evan Miller, [How Not To Run an A/B Test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html), 2010-04-18.
20. EDPB, [Guidelines 03/2022 on deceptive design patterns in social media platform interfaces](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en), version 2.0, 2023-02-24.
21. EDPB, [Guidelines 2/2023 on Technical Scope of Art. 5(3) of ePrivacy Directive](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en), version 2.0, 2024-10-16.
22. Regulation (EU) 2022/2065, [Digital Services Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2065), Articles 19(1) and 25.
