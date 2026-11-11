# I-63: One Notification System: Inbox, Email And Preferences

> **Initiative:** I-63, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next. Slices 1 to 6 and 8 need neither an email provider nor counsel; slice 7 waits for the owner's provider choice; slice 12 is blocked on [I-40](i40-installable-app-and-card-scanning.md) requirement 2.6. Never paid · **Written 2026-11-10**
> **Research:** one dated note on mailbox-provider rules, RFC 8058, French and EU rules on email, five email providers, web push on iOS, Novu and Vercel scheduling. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through [I-38](i38-trust-safety-and-user-rights.md) slice 0.
> **Owns:** the notification event model and its catalogue, the in-app inbox, the delivery channels (in-app, email, and web push later), the preferences page per category and channel, notification consent records, the email transport and its templates in English and French, one-click unsubscribe, the digest, quiet hours, per-user pacing, suppression after bounces and complaints, the scheduled job route, and the test harness producers use. **Does not own:** when an event fires and what it says, which stays with each producer (listed under [Overview](#overview)); sign-in, verification and reset flows ([I-61](i61-account-security.md)); billing and its plans ([I-30](i30-business-model-and-paid-tier.md)); deletion, export, retention periods, blocking and the age declaration (I-38); the shared rate-limit store ([I-05](i05-production-safety.md) M2); Discord feeds ([I-46](i46-discord-and-chat-integrations.md)); installability and the service worker (I-40, [I-19](i19-offline-game-night-viewing.md)); product events ([I-39](i39-first-run-activation-and-measurement.md)).
> **Proposed reassignments, for the integrator:** I-38 slice 13, the transactional email sender, is delivered by I-63 slices 6 and 7. I-59's "in-app inbox and the email digest" move here; [I-59](i59-prices-over-time-and-alerts.md) keeps alert rules, their evaluation and the alert text. The [I-08](i08-share-compare-and-learn.md) item "in-product notifications for replies, mentions, follows and changes to explicitly watched decks" is delivered by slices 1 to 4, with I-08 owning those events. I-48's `rulesChangesEmail`, I-52's `requestUpdates` and I-59's `priceAlertEmail` become categories in I-63's settings instead of new columns.

## Overview

At least fourteen specs plan to tell a player something, and each plans its own preference, sender or inbox. None of that delivery can ship, because `dev` has no notification table, no email sender and no scheduled job.

| Spec                                                                                          | What it plans                                                                    | Blocked today on                                                                             |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| I-08                                                                                          | Replies, mentions, follows and watched decks, with per-event controls            | Preferences are stored; nothing delivers                                                     |
| [I-18](i18-per-deck-radar-of-new-cards.md) slice 6                                            | Opt-in notices of new cards for a deck                                           | "I-08 notifications"                                                                         |
| I-30 6.5, 6.7                                                                                 | Cancellation confirmation; reminder before a yearly renewal                      | "no email sender exists today"                                                               |
| [I-38 2.4, 3.3, 8](i38-trust-safety-and-user-rights.md#3-decisions-and-statements-of-reasons) | Notice outcomes, statements of reasons, the inactive-account warning; the sender | Its slice 0 (counsel)                                                                        |
| [I-44 7.3, 9.5](i44-trade-lists-within-the-pod.md#7-minors), slice 16                         | Opt-in notices when a proposal changes state; a digest watch                     | I-38 slice 13                                                                                |
| I-46 5.3                                                                                      | Tell an owner that a feed was disabled                                           | No channel named                                                                             |
| [I-48 7](i48-official-changes-reach-every-deck.md#7-notices-and-e-mail), slice 11             | An in-app notice; an opt-in email per announcement                               | I-38 slice 13                                                                                |
| [I-51 8](i51-cards-lent-and-borrowed.md#8-reminders), slice 17                                | Opt-in loan reminders                                                            | I-38 slice 13                                                                                |
| [I-52](i52-feedback-loop-players-can-see.md) 4.7, slice 11                                    | Notices to players who voted for a request                                       | "I-08's notification centre or I-38's e-mail sender"                                         |
| [I-53](i53-monthly-deckbuilding-challenges.md) slice 15                                       | Opt-in challenge announcements                                                   | "I-08 notifications"                                                                         |
| [I-56](i56-wishlists-friends-can-buy-from.md) 4.10                                            | Nothing to the owner about reservations; givers' notices off by default          | No channel                                                                                   |
| [I-59 7](i59-prices-over-time-and-alerts.md#7-delivery-consent-and-unsubscribe), slices 11–12 | An alert inbox and a daily digest with RFC 8058 unsubscribe                      | I-38 slice 13                                                                                |
| [I-60](i60-player-stats-and-year-in-review.md) open question 3                                | One email when the recap is ready?                                               | I-38 slice 13 and [I-39 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns) |
| [I-61 9](i61-account-security.md#9-security-notices), slices 11–14                            | Verification, reset, email change and security notices                           | I-38 slice 13                                                                                |

Built one by one, this would give the account a dozen preference columns, several inboxes and several unsubscribe endpoints, each with its own reading of the law. I-63 builds the shared part once: one event model, one inbox, one email channel with transactional mail kept apart from notification mail, one preferences page, one digest and one harness every producer tests against. The house rules hold throughout: nothing brings a player back who did not ask, nothing is ranked by spend, and nothing is paid.

## What the market does

Read 2026-11-10 unless dated otherwise.

**Mailbox providers.** The rules below decide whether our mail reaches an inbox at all.

| Provider                  | Every sender                                                                                     | Bulk sender                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gmail** [1][2]          | From 2024-02-01: SPF or DKIM, valid forward and reverse DNS, TLS, spam rate below 0.3%, RFC 5322 | More than 5,000 a day to personal accounts: SPF, DKIM and DMARC (`p=none` allowed), aligned From; one-click unsubscribe for "marketing messages and subscribed messages" by 2024-06-01. Status is permanent once reached. Unsubscribes honoured within 48 hours. "Transactional messages are excluded from this requirement." "Starting November 2025, Gmail is ramping up its enforcement", with temporary and permanent rejections |
| **Yahoo** [3]             | From February 2024: SPF or DKIM, spam rate below 0.3%, valid reverse DNS, RFC 5321 and 5322      | SPF and DKIM, DMARC at least `p=none`, aligned From; one-click unsubscribe with RFC 8058's POST "highly recommended"; a visible link in the body; honoured within 2 days; no sign-in to unsubscribe                                                                                                                                                                                                                                  |
| **Microsoft Outlook** [4] | —                                                                                                | Post of 2025-04-02, updated 2025-04-30: more than 5,000 a day needs SPF, DKIM and an aligned DMARC record; from 2025-05-05 failing mail goes to Junk, and rejection with `550 5.7.515` comes at a date "to be announced"                                                                                                                                                                                                             |

**RFC 8058** (January 2017) [5]. `List-Unsubscribe` must hold one HTTPS URI and `List-Unsubscribe-Post` the value `List-Unsubscribe=One-Click`. The POST carries no cookies or authorisation, the URI should hold a hard-to-forge identifier, the sender must not answer with a redirect, and a DKIM signature must cover both headers. The RFC exists because mail software that fetched header links had been unsubscribing people by accident.

**French and EU rules (research, not legal advice).** The CNIL page dated 2026-06-10 says email prospection of individuals needs prior consent, with two exceptions: an existing customer offered "produits ou services similaires" by the same company, and non-commercial prospection [6]. It adds that the customer exception "ne peut pas être mobilisée lorsqu'aucune vente ou prestation de service n'a été effectuée, y compris lorsque le client a créé un compte en ligne", and that each message must name its sender and offer a simple way to refuse. It cites article L34-5 of the Code des postes et des communications électroniques. **The sources disagree:** on 2025-11-13 the Court of Justice held in _Inteligo Media_ (C-654/23) that a free account giving limited content can be a "sale" under the ePrivacy Directive's Article 13(2) when it is part of a strategy steering users to paid content, and that the soft opt-in is then a legal basis of its own [7]. Neither matters if the product sends no promotional email, which is this spec's rule (1.2). What remains for counsel is whether service notices the player turned on, such as rules changes, price alerts or a recap, are prospection at all, and whether an opt-in to them is consent in the GDPR sense, which would bring in France's age of 15 (I-38 9.3). The Directive's own text on EUR-Lex did not load for the fetcher [8].

**Email providers, at low volume.** Prices are list prices; nothing below is negotiated.

| Provider                | Free allowance                                         | 10,000 emails a month                                                                                                                                                 | Data location                                                                                                            | DPA                                                                                   |
| ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Amazon SES** [14][15] | No permanent free tier; new-account credits up to $200 | $1.00 à la carte ($0.10 per 1,000); $1.60 on the Essentials plan, the default from 2026-07-21 for accounts with no SES use since 2025-06-01, switchable to à la carte | EU regions include Paris (`eu-west-3`), Frankfurt and Ireland. New accounts start at 200 emails per 24 hours, adjustable | Not checked in this pass                                                              |
| **Resend** [9][10][11]  | 3,000 a month, 100 a day                               | $20 (Pro, 50,000 included; $0.90 per extra 1,000)                                                                                                                     | Sending from Ireland (`eu-west-1`) is offered, but "your Resend account data still resides in the US"                    | Part of the terms, updated 2025-12-31, with SCCs and the EU-US Data Privacy Framework |
| **Postmark** [12][13]   | 100 a month                                            | $15 (Basic), $16.50 (Pro), $18 (Platform); separate streams for broadcast mail                                                                                        | Chicago data centre and AWS; "We currently don't have plans to add servers in the EU"                                    | Part of the terms since 2021-09-27, with SCCs                                         |
| **Brevo** [16]          | Not verified                                           | Not verified: the official page rendered no prices, and third-party pages disagree                                                                                    | Brevo's own pages say EU servers only (search summary; page not opened)                                                  | Not verified                                                                          |
| **Scaleway TEM** [17]   | 300 a month (search summary)                           | About €2.50 at €0.25 per 1,000 (search summary of Scaleway's page; it answered HTTP 403)                                                                              | French provider; region not verified                                                                                     | Not verified                                                                          |

**Web push.** iOS and iPadOS 16.4 let a web app added to the Home Screen ask for push permission "in response to direct user interaction", with the Push, Notifications and Badging APIs and no Apple developer account (2023-02-16) [18]. Declarative Web Push, on iOS 18.4 from 2025-03-27, needs no service worker; WebKit revokes a classic push subscription whose handler shows no notification [19]. Apple planned to remove Home Screen web apps in the EU with iOS 17.4 and reversed that plan on 2024-03-01 [20]. Installed web apps are therefore a convenience a platform can take away, as I-40 1.7 already says.

**Notification layers.** Novu's core is MIT-licensed, with an `enterprise` folder under a commercial licence; it ships an embeddable inbox, a digest engine, a preferences component and email, SMS, push, chat and in-app channels [21]. Novu Cloud's free plan includes 10,000 workflow runs a month with US or EU data residency; Pro starts at $30 a month, and the pricing page lists self-hosting under Enterprise [22]. **What it means here:** the needs fit in a few tables beside data the app already holds, and a hosted layer adds a processor holding every recipient. This spec builds in-house and keeps Novu's concepts (workflow, subscriber preference, digest) so that a move stays possible.

**Scheduling on Vercel.** Cron Jobs run on every plan, 100 per project; on Hobby at most once a day and anywhere within the scheduled hour; on Pro every minute [23]. Vercel sends `CRON_SECRET` as a bearer token, runs crons on production only, does not retry a failed run, and warns that delivery is best effort and can run the same schedule twice, so jobs should take a lock and reconcile [24]. Cron Jobs are marked legacy, to be replaced by Schedules, now in beta: every 15 minutes on Hobby with a 15-minute jitter and 5,000 runs per billing period [23][25].

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10:

- **Preferences without delivery.** `NotificationPreference` (`prisma/schema.prisma` lines 63–74, migration `20261102180000_add_notification_preferences`, commit `acc66d01` of 2026-11-02) holds `replies`, `mentions`, `follows` and `watchedDecks`, all defaulting to `true`. `src/app/api/user/notification-preferences/route.ts` upserts the defaults on `GET` and accepts partial `PATCH`es; `src/components/settings/NotificationPreferencesPanel.tsx` renders them at `src/app/[locale]/settings/notifications/page.tsx`. Nothing else reads the table. The copy in `src/messages/{en,fr}/settings.json` says players can choose events "as they become available". `src/components/auth/UserMenu.tsx` links `/settings/api-keys` only, so the page is not linked.
- **Two of the four events have a source.** Replies exist (`DeckComment.parentId`) and follows exist (`UserFollow`). No code parses mentions, and no deck can be watched.
- **No event table, sender or job.** `package.json` has no mail library. No `vercel.json` exists. `.github/workflows` holds `ci.yml`, `lighthouse.yml` and `sonar.yml`, triggered by pushes to `main` and by pull requests, with no schedule. `src/lib/meta/snapshots.ts` records the house pattern: history "accrues from ordinary traffic", with "no cron job".
- **No locale or time zone on the account.** `User` has `email` and `emailVerified` but neither field. Served locales are `en` and `fr` (`src/i18n/routing.ts`); catalogues live in `src/messages/<locale>/*.json`, with parity tests in `src/i18n/`.
- **Limits are per instance.** `src/lib/rate-limit.ts` keeps a `Map` per serverless instance, I-05's M2.
- **Hosting.** Vercel with Supabase through the `aws-0-eu-west-1` pooler (`docs/engineering/infrastructure.md`). `NotificationPreference` is deleted with its user (`onDelete: Cascade`).

## Functional requirements

### 1. Ground rules

1.1 **One path.** A producer informs a player only by calling `notify()`, which writes a `NotificationEvent`. No producer sends mail, writes its own notice table or adds a preference column. Producers own when an event fires and what it says; I-63 owns whether and how it reaches the player.
1.2 **No marketing and no re-engagement.** The system sends nothing the player did not ask for or cause: no newsletter, no "we miss you", no streak, no product news by email ([I-39 7.4](i39-first-run-activation-and-measurement.md#7-no-dark-patterns)). Product news stays on I-52's `/whats-new`, and incidents stay in its status line.
1.3 **No tracking.** No open pixel, no click-tracking redirect and no provider link rewriting. Links go straight to our pages.
1.4 **Minimal content.** An email or push names the event and links to it. It never quotes another player's free text and never holds an email address, IP address or token other than its own unsubscribe token.
1.5 Nothing in the system is selected, ranked or timed by spend or activity, and wording is not A/B tested for opens.

### 2. Event model and catalogue

2.1 Each event type has one catalogue entry: key, category, class, allowed channels, default per channel, whether the player may turn it off, whether it may wait for the digest, its dedupe window, its payload schema and its renderer in `en` and `fr`.
2.2 **Classes.** _Security_ is I-61's list in 9.2. _Account_ is what law or contract requires: notice outcomes and statements of reasons (I-38 2.4, 3.3), appeal outcomes, the inactive-account warning (I-38 8), cancellation and renewal notices (I-30 6.5, 6.7), and a disabled feed (I-46 5.3). _Activity_ is everything else.
2.3 A payload holds ids and enums only; its schema rejects free text, email-shaped values and URLs. Entries render from current data when read or sent: a subject deleted, hidden by moderation or made private shows "This is no longer available", and its unsent email is cancelled.
2.4 `notify()` runs inside the producer's transaction. A rolled-back cause never notifies, and a failed delivery never rolls back the cause.
2.5 A `dedupeKey` is unique per recipient: following, unfollowing and following again on one day makes one entry. Events of one type on one subject within the window collapse ("3 replies on Atraxa Counters").
2.6 No event is created for an action by the recipient, by an actor the recipient blocked (I-38 slice 12) or by an account that moderation restricted.

### 3. In-app inbox

3.1 `/notifications` (and `/fr/notifications`) lists the signed-in player's entries newest first, grouped by day in the player's time zone, filterable by category; `noindex`.
3.2 The header bell shows an unread count up to "9+". No count appears in the tab title, the favicon or an app badge; there is no sound, and the count refreshes on navigation and window focus only.
3.3 Opening an entry marks it read; "Mark all as read" and "Archive" exist. The count is text in the bell's accessible name, and the list is a list of links usable by keyboard.
3.4 Entries are deleted 180 days after creation, purged on write, so no job is needed. The period is a proposal for I-38's retention table.
3.5 Entries, settings and consent rows are in the [I-38 export](i38-trust-safety-and-user-rights.md#7-full-data-export) and are deleted with the account.

### 4. Preferences, defaults and consent

4.1 **Settings → Notifications** is a matrix: one row per category, one column per channel (In the app, Email, and later Push on this device). An email cell is Off, Immediately or In the digest, where the category allows it. A locked cell says why: "Security notices can't be turned off". The page is linked from the user menu and from every email.
4.2 **Defaults.** In-app is on for events addressed to the player and for the player's own rules; email and push are off for every activity category, for every account. This follows [I-38 9.1](i38-trust-safety-and-user-rights.md#9-minors), I-44 7.3, I-48 7.2, I-51 8.1 and I-59 7.2.

| Category                     | Producer         | In the app | Email       | Player may turn off |
| ---------------------------- | ---------------- | ---------- | ----------- | ------------------- |
| Security                     | I-61             | On         | Immediately | No                  |
| Account and decisions        | I-38, I-30, I-46 | On         | Immediately | No                  |
| Replies; Mentions            | I-08             | On         | Off         | Yes                 |
| Follows                      | I-08             | On         | Off         | Yes                 |
| Watched decks                | I-08             | On         | Off         | Yes                 |
| Trade proposals              | I-44             | On         | Off         | Yes                 |
| Rules changes on my decks    | I-48             | On         | Off         | Yes                 |
| Price alerts I created       | I-59             | On         | Off         | Yes                 |
| Requests I voted for         | I-52             | On         | Off         | Yes                 |
| Loans                        | I-51             | Off        | Off         | Yes                 |
| Gifts I reserved (signed in) | I-56             | Off        | Off         | Yes                 |
| New cards for my decks       | I-18, I-73       | Off        | Off         | Yes                 |
| Saved deck searches          | I-75             | On         | Off         | Yes                 |
| Challenges                   | I-53             | Off        | Off         | Yes                 |
| My year in review            | I-60             | Off        | Off         | Yes                 |

Added 2026-11-10: [I-73](i73-every-set-release-ready-on-day-one.md#5-what-players-get)'s `release.digest`, one event per set per opted-in player, joins "New cards for my decks", and [I-75](i75-finding-public-decks.md#9-saved-searches-and-alerts)'s `deck-search.new-matches` is the producer of "Saved deck searches", on in the app only for a search the player set to alert.

4.3 **Existing rows.** The migration copies the four booleans to the in-app cells of Replies, Mentions, Follows and Watched decks and sets every email cell off. Nothing was ever delivered, so the old `true` defaults never meant consent to email.
4.4 **Consent log.** Turning an email or push cell on or off appends a row with the category, channel, the version of the wording shown, the locale, the source (settings, unsubscribe link, one-click, bounce, complaint, migration) and the time. The latest row is the state, as I-59 7.2 asks.
4.5 Activity email cells stay disabled until the address is verified ([I-61 6](i61-account-security.md#6-email-verification)), with the reason shown, so no notification reaches a mailbox the account never proved.
4.6 **Locale and time.** Email uses the account's locale, set from the interface at sign-up and changeable here. The time zone is read from the browser on the first signed-in visit, never from location, and can be changed. Quiet hours are on by default, 22:00 to 08:00 local. "Pause activity notifications" lasts a day, a week or until turned back on; in-app entries still collect.

### 5. Email channel

5.1 **Two streams.** Transactional mail (security and account classes, and I-61's verification, reset and email-change links) and notification mail (activity and the digest) leave from separate subdomains and separate provider streams or configuration sets, so complaints about a digest cannot harm a reset.
5.2 Both streams publish SPF, DKIM aligned with the From domain and DMARC, from the first send, because Gmail's bulk status is permanent once reached [2] and the records cost nothing. DMARC starts at `p=none` with reports; the move to `quarantine` is the owner's after 30 clean days (proposal).
5.3 **Exit path.** One `EmailTransport` interface with a log transport, a test transport and one provider transport. Templates, consent, suppression and delivery records stay in our database; the provider only transmits. Changing provider means a new transport and new DNS records, not a data migration.
5.4 **Templates.** HTML and plain text come from one source per type. Strings live in `src/messages/{en,fr}/notifications.json` at key parity; dates and numbers use the locale and name the time zone; card names use the French printed name where I-60 5.7's resolver finds one. No remote images.
5.5 **Footer.** Every email names the operator as I-38's legal notice does, says why it was sent ("You turned on email for Trade proposals") and links to the preferences page. Notification mail also carries the unsubscribe link of group 6.
5.6 **Bounces and complaints** arrive by the provider's signed webhook. A hard bounce or a complaint stores the address hash in `EmailSuppression`, turns activity email off with a consent row, and shows the reason in settings. Security and account mail still goes to an address that complained, never to one that hard-bounced.
5.7 **Caps that protect a mailbox.** At most 3 emails a day reach an unverified address, and at most 20 transactional emails a day reach one account; past the cap, security events stay in-app and one summary follows the next day (proposals). This keeps sign-up and reset forms from being used to flood a victim (I-61 8).
5.8 A delivery row is claimed before sending, so a retry cannot send twice. Transactional mail goes out after the response; failures are retried by the job (10).

### 6. One-click unsubscribe

6.1 Every notification email carries `List-Unsubscribe: <https://…/api/notifications/unsubscribe?t=…>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, both signed by DKIM [5]. Transactional mail carries neither, as Gmail excludes it [2], and keeps the preferences link.
6.2 The token is signed and single-purpose (account, category or digest, email). It holds no address, is valid for 12 months, and survives a key rotation for that time.
6.3 `POST` turns that email off at once, appends a consent row and answers 200 with no redirect, cookie or session [5]. Repeating it changes nothing.
6.4 The visible link opens `/unsubscribe?t=` in the email's locale. `GET` changes nothing, because scanners prefetch links; the page offers one confirm button and "Stop all email except security and account notices", with no sign-in [3].

### 7. Digest, quiet hours and pacing

7.1 The digest is one email per day, or per week if chosen, sent at the player's digest hour (default 08:00) only when an undelivered digestible event exists. It groups by category and renders from current data.
7.2 While the job runs only once a day (Vercel Hobby [23]), every digest leaves in one run at a fixed UTC hour and the hour setting stays hidden. It appears once the job runs at least hourly, on Pro or on Schedules [23][25]. Slice 0 records which.
7.3 Immediate activity email is limited to one per category per hour and six a day per player (proposal); further events wait for the digest.
7.4 Quiet hours and the pause delay immediate activity email and push to the end of the window. An event read in the app before its email leaves is not emailed.
7.5 At most ten events a day from one actor to one recipient (proposal); beyond that they collapse into one entry.

### 8. Security and account notices

8.1 Security notices leave at once on the transactional stream, cannot be turned off, ignore quiet hours, the pause and the pacing of group 7 (not the cap in 5.7), carry no unsubscribe header and name the device label, country and time, never the IP address ([I-61 9.3](i61-account-security.md#9-security-notices)).
8.2 Account notices are always in-app and emailed, cannot be turned off and never carry promotion.
8.3 Verification, reset and email-change links are not inbox entries. They use the transactional stream through the same transport and templates.

### 9. Minors

9.1 The defaults of 4.2 are the same for every account and safe for a teenager: no activity email, no push, quiet hours on.
9.2 No email or push quotes another player's words (1.4), and a username appears only for an account moderation has not restricted.
9.3 If counsel finds that an opt-in to notification email is consent-based processing, activity email cells require the adult declaration ([I-44 7.2](i44-trade-lists-within-the-pod.md#7-minors)) or, in France under 15, a parent's joint consent (I-38 9.3). Until then the opt-in is a service setting open to every account ([open question 2](#open-questions)).

### 10. Scheduled jobs

10.1 One route, `/api/jobs/[job]`, checks `Authorization: Bearer` against `CRON_SECRET` [24] and is registered in a new `vercel.json` `crons` array. The first job, `notifications`, sends digests, deferred and retried mail. I-38's retention job and, when it runs on Vercel, I-67's `card-data` job (I-67 slice 3, re-pointed 2026-11-10) register here instead of adding routes.
10.2 Each run takes a lease in `JobRun`, so a duplicate invocation exits. It processes everything due since the last successful run, so a missed run catches up, and every step is idempotent [24].
10.3 A dry run reports counts without sending. Each run records counts and duration, and a job with no success for 26 hours reports an error to Sentry.

### 11. Web push, later

11.1 Push waits until the owner reverses [I-40 requirement 2.6](i40-installable-app-and-card-scanning.md#2-installed-mode-presentation). It extends I-19's service worker (I-40 1.6), is opt-in per device and category, and asks permission only from a button the player taps [18].
11.2 Push carries no more than an email would, sets no badge and is never silent [19]. Every feature works without it [20].

### 12. A harness every producer uses

12.1 `src/lib/notifications/testing.ts` gives producers an in-memory transport and helpers: `expectNotified`, `expectNotNotified` and `deliveredEmails`.
12.2 A catalogue contract test runs over every registered type: subject, HTML and text render in `en` and `fr` with no missing key; the payload schema rejects free text, email-shaped values and URLs; activity defaults have email and push off; security and account entries are locked; notification mail carries both RFC 8058 headers and transactional mail neither.
12.3 A development-only page shows every template in both locales with fixture data.
12.4 A producer slice is reviewable only with its catalogue entry, a fixture and the contract test passing.

### 13. Free and paid

13.1 The system is never paid: the inbox, every channel, the digest, quiet hours, unsubscribe and security notices.
13.2 Paid candidates belong to producers and are decided in I-30: alert rules above a free allowance and list-wide scopes (I-59 9.2), a continuous match watch (I-44 10.3) and a rules watch (I-47 8.2). They reach players through the same free channels.
13.3 **Conflicts for I-30.** I-51's table lists email reminders under "Paid hypothesis", and I-59 9.2 lists "the email digest" as a paid candidate. This spec recommends that delivering a free event by email stays free; what may be sold is how much a player watches. **Estimate** from the list prices above: 2,000 players on a daily digest send about 60,000 emails a month, about $6 on SES à la carte [14], $29 on Resend Pro [9] or $81.50 on Postmark Pro [12].

## Data model / API

```
NotificationEvent   id, userId (cascade), type, category, actorId? (set null), subjectKind, subjectId,
                    payload Json (ids and enums), dedupeKey, createdAt, readAt?, archivedAt?
                    @@unique([userId, dedupeKey]) @@index([userId, archivedAt, createdAt])
NotificationSetting userId (cascade), category, channel (inApp|email|push), mode (off|on|immediate|digest), updatedAt
                    @@id([userId, category, channel])
NotificationConsent id, userId (cascade), category, channel, granted, source, wordingVersion, locale, createdAt  -- append-only
NotificationDelivery id, userId (cascade), eventId?, digestDay?, channel, stream (transactional|notification),
                    status (queued|deferred|claimed|sent|suppressed|failed|bounced|complained), scheduledFor,
                    attempts, providerMessageId?, sentAt?   @@unique([eventId, channel])
EmailSuppression    addressHash (primary key), reason (hardBounce|complaint), createdAt
JobRun              id, job, startedAt, leaseUntil, finishedAt?, status, counts Json, dryRun
NotificationPreference  becomes the profile: locale, timeZone, quietStart?, quietEnd?, digestHour, digestFrequency,
                    pausedUntil?; the four booleans are dropped after the migration of 4.3
```

Routes: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/[id]`, `POST /api/notifications/read-all`; `GET` and `PATCH /api/user/notification-preferences` (new shape); `POST /api/notifications/unsubscribe` (no session); `POST /api/email/events` (provider webhook, signature checked); `GET /api/jobs/[job]` (`CRON_SECRET`). Pages: `/notifications`, `/settings/notifications`, `/unsubscribe`. Producer API: `notify(input, tx)` in `src/lib/notifications/`.

## Non-goals

- Marketing email, newsletters, product announcements by email and re-engagement of any kind (I-39 7.4).
- SMS, Telegram, WhatsApp and Discord direct messages. I-46 keeps no Discord user id; its webhook feeds stay public deck updates.
- Open or click tracking, and wording tests for opens.
- WebSockets, frequent polling and native-app push.
- A hosted notification layer or self-hosted Novu now (see the market section), and reply-by-email.
- Status incidents and release notes in the inbox: I-52's status line and "What's new" own them.

## Testing strategy

- **Rules (solitary):** default resolution per category and class; pacing and overflow to the digest; quiet hours across the Europe/Paris clock changes; dedupe and collapse; token signing, expiry and key rotation.
- **Producers (sociable):** `notify()` in a rolled-back transaction leaves no event; a reply creates one entry for the parent's author and none for the replier; a blocked actor creates none; a deleted subject renders as unavailable and cancels its email.
- **Migration:** the four booleans land in the in-app cells, every email cell is off, and a consent row with source `migration` exists.
- **Routes:** the unsubscribe POST works without a session, never redirects and is idempotent; its GET changes nothing; the job route answers 401 without the secret; a second concurrent run exits on the lease.
- **Email:** the contract test of 12.2 over every type; a staging send to Gmail and Outlook test inboxes shows the one-click control and aligned DKIM, recorded in `docs/engineering/email.md`.
- **End to end and access:** bell count, read and archive, and the settings matrix in English and French at phone width; axe checks on the inbox and settings.

## Delivery slices

| #   | Slice                                                                                                                                            | Depends on                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 0   | Decisions recorded: provider, sending subdomains, job cadence (Hobby, Pro or Schedules); lawyer questions added to I-30 7.2 through I-38 slice 0 | — (owner and counsel; no code)                                                      |
| 1   | Event model, catalogue, `notify()` in the producer's transaction, payload guard, render in `en` and `fr`, the harness and the contract test      | —                                                                                   |
| 2   | Inbox page, header bell, read, read all, archive, purge on write; keyboard, screen reader and phone width                                        | 1                                                                                   |
| 3   | Settings matrix, migration of the four booleans, consent log, locked cells, locale, time zone, quiet hours, pause; user-menu link                | 1                                                                                   |
| 4   | First producers: replies and follows (I-08); blocked actors once I-38 slice 12 exists                                                            | 2, 3                                                                                |
| 5   | Job route with `CRON_SECRET`, `vercel.json`, lease, `JobRun`, catch-up, dry run                                                                  | — (cadence from 0)                                                                  |
| 6   | `EmailTransport` with log and test transports, two streams, templates, footer, caps of 5.7; `docs/engineering/email.md` with SPF, DKIM and DMARC | 1                                                                                   |
| 7   | Provider in production and the transactional stream: transport, DNS, signed bounce and complaint webhook, suppression (this is I-38 slice 13)    | 0, 6; I-38 slice 6 for the processor entry                                          |
| 8   | One-click unsubscribe: tokens, RFC 8058 endpoint, confirmation page, consent rows                                                                | 3, 6                                                                                |
| 9   | Immediate notification email: verified-address rule, quiet hours, pacing and overflow                                                            | 3, 5, 7, 8; I-61 slice 10 (Google accounts) and slice 11 (password accounts)        |
| 10  | Daily and weekly digest                                                                                                                          | 5, 9                                                                                |
| 11  | Deliverability watch: owner page with sends, bounces and complaints per stream; a warning at 0.1% complaints                                     | 7                                                                                   |
| 12  | Web push for installed apps, per device and category                                                                                             | 3; I-19's service worker; I-40 slice 1; **Blocked** on the owner reversing I-40 2.6 |

Slices 1 and 5 can start today in parallel; slices 2, 3 and 6 follow slice 1. Scheduled agents must not pick slice 7 before slice 0's provider choice is committed, nor slice 9 before I-61 slice 10 or 11 has merged. If the owner answers [open question 1](#open-questions) "wait", slice 7 also depends on I-38 slice 0.

**What each slice unblocks.** These edges belong in the producers' tables; the integrator updates them.

| I-63 slice | Unblocks                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–3        | I-59 slice 11 (alerts in the inbox), I-38 slice 10 (in-app statements), I-44 slice 9 (proposal notices), I-52 slice 11, I-53 slice 15, I-18 slice 6 in-app, I-46 slice 5's failure notice, I-48's notice as an inbox entry |
| 4          | The I-08 notifications item, for replies and follows; mentions and watched decks wait for I-08 to build them                                                                                                               |
| 5          | I-38 slice 14 (retention job), I-67 slice 3's `card-data` job (re-pointed 2026-11-10), the timing of I-51 slice 17 and of I-30 6.7's renewal reminder                                                                      |
| 7          | I-61 slices 11 to 14, I-38 slice 15, I-30 6.5 and 6.7                                                                                                                                                                      |
| 9          | I-48 slice 11, I-51 slice 17, trade-proposal email for I-44, and I-60 open question 3 if the owner accepts it                                                                                                              |
| 10         | I-59 slice 12, I-18 slice 6 by email, and I-44 slice 16 and I-47 8.2 after I-30 decides                                                                                                                                    |
| 12         | Nothing committed; I-40 2.6 stands                                                                                                                                                                                         |

## Open questions

1. **Provider, and can transactional mail go first?** Reset, verification and security notices are needed to run an account (I-61 open question 2), while I-38 holds its sender behind slice 0. The owner chooses the provider from the table above: SES in Paris is the cheapest verified option; Resend sends from Ireland but keeps account data in the US; Postmark has no EU servers; Brevo's and Scaleway's terms were not verified. Does slice 7 wait for all of I-38 slice 0, or only for the processor entry?
2. **For the lawyer (research, not legal advice):** are opt-in notices the player chose (rules changes, price alerts, loan reminders, a recap) service messages outside L34-5's prospection [6]? Is the opt-in consent under the GDPR, which would bring in a parent's joint consent under 15 in France (I-38 9.3)? What legal basis covers security notices that cannot be turned off? How long may `EmailSuppression` keep a hash after the account is deleted?
3. **Is any delivery channel ever paid?** This spec says no (13.3); I-51 and I-59 say email may be. The owner decides in I-30.
4. **Does a notice the player asked for count as re-engagement?** I-60's "email me when my recap is ready" is opt-in and one-off. This spec reads I-39 7.4 as forbidding mail about what the player did not ask for, and proposes adding that sentence to I-39.
5. **Job cadence.** Stay on Hobby with one daily run and a fixed digest hour, move to Pro, or adopt Schedules while it is in beta [23][25]?
6. **Defaults to test with players:** quiet hours on at 22:00 to 08:00, follows in-app on, 180-day retention, and the caps of 5.7 and 7.3.

## Sources

1. Google, [Email sender guidelines](https://support.google.com/a/answer/81126), read 2026-11-10; no last-updated date on the page.
2. Google, [Email sender guidelines FAQ](https://support.google.com/a/answer/14229414), read 2026-11-10.
3. Yahoo, [Sender Best Practices](https://senders.yahooinc.com/best-practices/), read 2026-11-10.
4. Microsoft Defender for Office 365 blog, [Strengthening Email Ecosystem: Outlook's New Requirements for High‐Volume Senders](https://techcommunity.microsoft.com/blog/microsoft-defender-for-office-365-blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730), 2025-04-02, updated 2025-04-30.
5. IETF, [RFC 8058: Signaling One-Click Functionality for List Email Headers](https://datatracker.ietf.org/doc/html/rfc8058), January 2017.
6. CNIL, [La prospection commerciale par courrier électronique](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique), page dated 2026-06-10, read 2026-11-10.
7. Matheson, [CJEU clarifies direct marketing rules under ePrivacy Directive](https://www.matheson.com/insights/cjeu-clarifies-direct-marketing-rules-under-eprivacy-directive/), 2025-12-12, on Case C-654/23 _Inteligo Media_, judgment of 2025-11-13.
8. Directive 2002/58/EC, [consolidated text on EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219); the page returned no text to the fetcher on 2026-11-10, so Article 13 is described from [6] and [7].
9. Resend, [Pricing](https://resend.com/pricing), read 2026-11-10.
10. Resend, [Choosing a Region](https://resend.com/docs/dashboard/domains/regions), read 2026-11-10.
11. Resend, [Data Processing Addendum](https://resend.com/legal/dpa), last updated 2025-12-31.
12. Postmark, [Pricing](https://postmarkapp.com/pricing), read 2026-11-10.
13. Postmark, [EU privacy and GDPR](https://postmarkapp.com/eu-privacy), read 2026-11-10.
14. Amazon Web Services, [Amazon SES pricing](https://aws.amazon.com/ses/pricing/), read 2026-11-10.
15. Amazon Web Services, [Amazon SES endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/ses.html), read 2026-11-10.
16. Brevo, [Pricing](https://www.brevo.com/pricing/); the page rendered only its title on 2026-11-10, and the EU-hosting statement comes from a search summary of Brevo's own pages.
17. Scaleway, [Transactional Email](https://www.scaleway.com/en/transactional-email-tem/); HTTP 403 on 2026-11-10, figures from a search summary of Scaleway's pages.
18. WebKit, [Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), 2023-02-16.
19. WebKit, [Meet Declarative Web Push](https://webkit.org/?p=16535), 2025-03-27.
20. MacRumors, [Apple Walks Back Decision to Disable Home Screen Web Apps in the EU](https://www.macrumors.com/2024/03/01/apple-walks-back-decision-to-disable-eu-web-apps/), 2024-03-01.
21. Novu, [novuhq/novu on GitHub](https://github.com/novuhq/novu), read 2026-11-10.
22. Novu, [Pricing](https://novu.co/pricing/), read 2026-11-10.
23. Vercel, [Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing), last updated 2026-07-15.
24. Vercel, [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs), last updated 2026-08-11.
25. Vercel, [Schedules Limits](https://vercel.com/docs/schedules/limits), beta, read 2026-11-10.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player reads every notice in one inbox, chooses per category whether it reaches them in the app, by email or in a digest, and stops any email in one click; security and account notices always arrive and cannot be turned off. Every initiative that tells a player something does it through one call, and nothing is sent that the player did not ask for or cause.

### Goals

- A reply to a player's comment appears once in their inbox, in their language; they turn on email for one category, receive it within the pacing and quiet hours, and stop it in one click from the email without signing in; a password reset still reaches an address that complained about a digest; and no producer sends mail or stores a preference of its own.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-63-01

As a player, I want one inbox and one place to turn notices off, so that every feature does not invent its own email.

#### US-63-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-63-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-63-01 Happy path

Given a signed-in player and the English locale
When every notice the product sends is a catalogue entry with a category the player can switch.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-63-02 Happy path

Given a signed-in player and the English locale
When security notices that cannot be turned off are listed as such.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-63-03 Happy path

Given a signed-in player and the English locale
When no marketing email is sent.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-63-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-63-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-63-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in. Guests get no inbox. Email stays off until the provider and the privacy policy name it. A free notice stays free.

#### AC-63-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-63-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-63-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The inbox is a page. Email uses the same text. Quiet hours are a setting, not a hidden default the player cannot find.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

An event catalogue and `notify()`. The provider waits on the owner's choice. Switches the product already stores and nothing reads are replaced by this catalogue.

### Analytics and telemetry

`notice_sent {category, channel: inbox or email}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in. Guests get no inbox. Email stays off until the provider and the privacy policy name it. A free notice stays free.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Amazon SES, Resend or Postmark is the owner's choice. Whether a notice the player asked for is a service message is a lawyer question.

### Sources

- https://support.google.com/a/answer/81126
- https://support.google.com/a/answer/14229414
- https://datatracker.ietf.org/doc/html/rfc8058
- https://novu.co/pricing/
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://itunes.apple.com/us/rss/customerreviews/page=1/id=1669698500/sortby=mostrecent/json

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-63: One Notification System: Inbox, Email And Preferences

**Spec:** [`specs/i63-one-notification-system.md`](i63-one-notification-system.md)

**Outcome:** a player reads every notice in one inbox, chooses per category whether it reaches them in the app, by email or in a digest, and stops any email in one click; security and account notices always arrive and cannot be turned off. Every initiative that tells a player something does it through one call, and nothing is sent that the player did not ask for or cause.

**Status:** Next
**Priority:** Next. Slices 1 and 5 start now; slices 2, 3 and 6 follow slice 1; slice 7 waits for the owner's provider choice; slice 9 waits for I-61 slice 10 or 11; web push (slice 12) is blocked by I-40 requirement 2.6. Never paid
**Impact / effort:** High / large
**Depends on:** nothing for slices 1 and 5; the owner's choice of provider, sending subdomains and job cadence (slice 0) and I-38 slice 6's processor entry, or all of I-38 slice 0 if the owner says so, for slice 7; I-38 slice 12 for blocked actors (slice 4); I-61 slice 10 for Google accounts or slice 11 for password accounts, which verify the address (slice 9); I-19's service worker, I-40 slice 1 and the owner reversing I-40 requirement 2.6 for web push (slice 12).

At least fourteen specs plan to tell a player something, and each plans its own preference column, sender or inbox: I-08's replies and follows, I-38's statements of reasons, I-44's proposals, I-48's rules changes, I-51's loan reminders, I-52's request updates, I-59's price alerts, I-61's security notices and more. None of it can ship, because `dev` has no notification table, no mail library, no `vercel.json` and no scheduled workflow. Mailbox providers set the floor: since 2024-02-01 Gmail asks every sender for SPF or DKIM and a spam rate below 0.3%, and bulk senders for DMARC and one-click unsubscribe, with enforcement "ramping up" from November 2025 ([guidelines](https://support.google.com/a/answer/81126), [FAQ](https://support.google.com/a/answer/14229414)); [RFC 8058](https://datatracker.ietf.org/doc/html/rfc8058) defines that unsubscribe as a POST with no cookie and no redirect. A hosted layer such as Novu would add a processor holding every recipient ([pricing](https://novu.co/pricing/)), so the system is built in the product, behind one email transport that a provider change replaces. Vercel's Hobby crons run at most once a day, are best effort and may run twice ([docs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)), so every job takes a lease and catches up. It sends no marketing or re-engagement mail, as I-39 requirement 7.4 rules, and tracks no opens or clicks.

### Scope

- [ ] Slice 0, no code: the provider, the sending subdomains and the job cadence; the lawyer questions join I-30 requirement 7.2 through I-38 slice 0.
- [ ] An event model and catalogue: `notify()` inside the producer's transaction, payloads of ids and enums only, entries rendered in English and French from current data, so a deleted or hidden subject shows "This is no longer available", dedupe and collapse, no event for the recipient's own action or from a blocked or restricted actor, and a harness and contract test every producer uses (slice 1).
- [ ] `/notifications` and a header bell counting to "9+", with read, read all and archive, and entries purged 180 days after creation on write; no count in the tab title, favicon or badge, and no sound (slice 2).
- [ ] Settings → Notifications as a matrix of category and channel, linked from the user menu and every email: in the app on for events aimed at the player, email and push off for every activity category, security and account cells locked; a consent log with the wording version; locale, time zone, quiet hours on from 22:00 to 08:00, and a pause (slice 3). It replaces the four switches that nothing reads: `NotificationPreference` (`prisma/schema.prisma`, `acc66d01`, 2026-11-02) holds `replies`, `mentions`, `follows` and `watchedDecks`, all true by default, read only by its route and the `/settings/notifications` page, which no link reaches (`src/components/auth/UserMenu.tsx` links only `/settings/api-keys`). The migration copies them to the in-app cells and turns every email cell off, since nothing was ever delivered.
- [ ] Replies and follows (I-08) as the first producers (slice 4). Only these two of the four switches have a source today; no code parses mentions, and no deck can be watched.
  - Two producers join (2026-11-10): [I-73](i73-every-set-release-ready-on-day-one.md)'s `release.digest`, one event per set in "New cards for my decks", and [I-75](i75-finding-public-decks.md)'s `deck-search.new-matches` in a new category, "Saved deck searches", on in the app only for a search the player set to alert and off by email.
- [ ] One job route, `/api/jobs/[job]`, behind `CRON_SECRET` in a new `vercel.json`, with a lease, catch-up and a dry run (slice 5). I-38's retention job and, when it runs on Vercel, I-67's `card-data` job (I-67 slice 3, re-pointed 2026-11-10) register here.
- [ ] An `EmailTransport` with log and test transports, a transactional and a notification stream on separate subdomains, SPF, DKIM and DMARC from the first send, templates in English and French, and caps that keep sign-up and reset forms from flooding a victim's mailbox (slice 6); the provider in production, with signed bounce and complaint webhooks and suppression (slice 7, which is I-38 slice 13).
- [ ] One-click unsubscribe on every notification email, with a `GET` that changes nothing and a confirmation page that needs no sign-in (slice 8); immediate activity email, to a verified address only, paced and held by quiet hours (slice 9); a daily or weekly digest (slice 10); and a deliverability page for the owner (slice 11).
  - The deliverability page (slice 11) sits behind [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s `requireOperator` once its slice 1 exists (2026-11-10).
- [ ] Taken over on 2026-11-10, each source keeping a pointer: I-38 slice 13's sender (slice 7), I-59's inbox and email digest (slices 2 and 10), and I-08's in-product notifications (slices 1 to 4). I-48's `rulesChangesEmail`, I-52's `requestUpdates` and I-59's `priceAlertEmail` become categories, not columns.
  - What each slice unblocks: slices 1 to 3, inbox entries for I-59, I-38, I-44, I-52, I-53, I-18, I-46 and I-48; slice 5, I-38's retention job, I-67's `card-data` job and the timing of I-51's and I-30's reminders; slice 7, I-61 slices 11 to 14, I-38 slice 15 and I-30's cancellation and renewal emails; slice 9, I-48 slice 11, I-51 slice 17 and I-44's proposal email; slice 10, I-59 slice 12 and I-18's email.
- [ ] Blocked: web push for installed apps, per device and category, until the owner reverses I-40 requirement 2.6 (slice 12).
- [ ] An event "a pod member published or changed a deck": opt-in per pod, chronological, with no counts, streaks or ranking, shown on I-15's pod page. "I'd like an option to 'share' that I built a new deck and be able to see that of my friends as well" ([Mythic Tools reviews](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1669698500/sortby=mostrecent/json), 2026-07-19). Added 2026-11-11.

### Engineering enablers

- `notify()` in a rolled-back transaction leaves no event, and a failed delivery never rolls back its cause.
- A contract test renders every catalogue type in English and French, rejects free text, email-shaped values and URLs in payloads, keeps activity email and push off by default, and locks security and account entries.
- The unsubscribe `POST` works without a session, never redirects and is idempotent; notification mail carries both RFC 8058 headers, and transactional mail carries neither.
- A second concurrent job run exits on the lease, a missed run catches up, and the job route answers 401 without the secret.

**Paid-tier angle:** none. The inbox, every channel, the digest, quiet hours, unsubscribe and security notices are free on every plan. Paid candidates stay with their producers, such as I-59's alerts above an allowance, and reach players through these free channels. The spec's rule that a free event delivered by email stays free conflicts with I-51's email reminders and I-59's email digest as paid candidates; I-30 decides (status note).

### Enrichment (2026-11-11)

**User story.** As a player, I want one inbox and one place to turn notices off, so that every feature does not invent its own email.

**Acceptance.**
- Every notice the product sends is a catalogue entry with a category the player can switch.
- Security notices that cannot be turned off are listed as such.
- No marketing email is sent.

**UX.** The inbox is a page. Email uses the same text. Quiet hours are a setting, not a hidden default the player cannot find.

**Data and API.** An event catalogue and `notify()`. The provider waits on the owner's choice. Switches the product already stores and nothing reads are replaced by this catalogue.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `notice_sent {category, channel: inbox or email}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in. Guests get no inbox. Email stays off until the provider and the privacy policy name it. A free notice stays free.

**Open questions.** Amazon SES, Resend or Postmark is the owner's choice. Whether a notice the player asked for is a service message is a lawyer question.

### Definition of done

A reply to a player's comment appears once in their inbox, in their language; they turn on email for one category, receive it within the pacing and quiet hours, and stop it in one click from the email without signing in; a password reset still reaches an address that complained about a digest; and no producer sends mail or stores a preference of its own.

---

