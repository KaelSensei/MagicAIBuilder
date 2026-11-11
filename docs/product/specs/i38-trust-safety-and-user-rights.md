# I-38: Trust, Safety And User Rights

> **Status:** Proposed · **Priority:** Next. A launch gate for [I-30](i30-business-model-and-paid-tier.md)'s paid tier (its slice 7 changes account deletion, and a paid plan needs terms and a privacy policy) and for any public growth · **Written 2026-11-09**
> **Research:** a dated note on EU and French platform law, GDPR practice and five competitors' public pages. The note is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each one is routed to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** reporting and moderation of every kind of user content, statements of reasons and appeals, blocking and comment controls, the legal pages (legal notice, terms, privacy policy, DSA contact page), account deletion and its cascade, the full data export, retention jobs, the age statement and the defaults that protect minors. **Does not own:** the social features themselves ([I-08](i08-share-compare-and-learn.md)); the public projection of a deck ([I-36](i36-creator-and-embed-toolkit.md) slice 1); the API rate limit ([I-05](i05-production-safety.md)); billing and the subscription lifecycle (I-30); the deck-index takedown form ([I-29](i29-cross-site-deck-index.md) 1.7), which should reuse the notice form here; game-log deletion rules ([I-35](i35-pod-game-log.md) 6.2), which extend the cascade here.

## Overview

MagicAIBuilder hosts what its users write: public decks with primers and card notes, threaded comments, star ratings and written reviews, public profiles, community card packages and share links. It also stores accounts, and under I-30 it will bill. In EU terms it is a hosting service, and because it shows that content to the public at the user's request, an online platform (DSA Art. 3) [1].

The law sets a small floor for an operator of this size. A micro enterprise has fewer than 10 staff and at most €2 million of turnover or balance sheet [4]. For such a platform the DSA's platform section (Arts. 20–28) does not apply, except the duty to give user numbers on request (Art. 24(3), kept by Art. 19) [1]. Annual transparency reports do not apply either (Art. 15(2)) [1], and the Commission's 2025 guidelines on minors exclude micro and small enterprises [2]. What remains applies to every host: points of contact (Arts. 11–12), terms that describe moderation (Art. 14), a notice-and-action mechanism (Art. 16), a statement of reasons for every restriction (Art. 17) and reporting threats to life to the police (Art. 18) [1]. France adds the LCEN legal notice and a duty for hosts to keep data that identifies contributors [6], with Arcom as the supervising coordinator since the SREN law of May 2024 [5]. The GDPR adds access, portability and erasure, answered free within one month [8].

The code covers part of this. Public decks can be reported and a moderator can mark a report reviewed. Nothing else exists: no legal page, no export, no deletion button, no block, no statement of reasons. One defect is serious: deleting an account today does not end the session, and the next request re-creates the account.

This spec builds the floor and adds the cheap good practice the guidelines describe: block, appeal and safe defaults. **None of it is a paid feature.** A clean export, a working deletion, a report button and a block are table stakes; a product that wants subscribers has to show them first.

## What the market does

Read 2026-11-09. Moxfield, the Moxfield-hosted Sorcery policy and Cardmarket's policy pages returned HTTP 403, and Archidekt's privacy link redirects to a page that rendered no text, so those rows rely on secondary pages and say so.

| Product                            | Report content                                                  | Block or mute                                                                                                           | Self-serve deletion                             | Data export                              | Privacy page                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield** [12][13]              | Not found                                                       | Not found; owners can turn off comments on their decks (wiki, last edited 2020-10-14)                                   | Not found                                       | Not found                                | 403; a search summary gives "effective December 31, 2021"                                                                              |
| **Archidekt** [14]                 | Not in the FAQ; bugs go to a forum                              | Not found                                                                                                               | Not found                                       | Not found                                | Redirects to Space Cow Media's policy, which rendered no text                                                                          |
| **EDHREC** [15]                    | Not found                                                       | —                                                                                                                       | No account deletion described                   | Not described                            | No date, no operator named; covers ad data (IP, device, browser, hashed email) shared with Mediavine; no GDPR rights, retention or age |
| **TappedOut** [16][17][18]         | No formal feature; users told to contact an admin (forum, 2013) | "You can block users from their profile pages"; removing comments on one's own decks for "Upgraded users" (forum, 2013) | "a delete account button in your user settings" | Not described; questions by contact form | GDPR statement (2018): trade address removed after 90 days without login; private chat deleted after 90 days                           |
| **Cardmarket** [19]                | Not found on the help page read                                 | Not found                                                                                                               | Not found                                       | Not found                                | 403; help page: "In extreme cases, we will terminate the account"                                                                      |
| **Discourse** (good practice) [20] | —                                                               | —                                                                                                                       | —                                               | —                                        | A DSA page naming one contact for authorities and users, `dsa@`, in English or Dutch, with 2024 and 2025 transparency reports          |

Three findings:

1. **No deckbuilder read publishes a DSA contact, a notice form or a statement of reasons.** The pages that could be read say nothing about Arts. 11–17, and Moxfield, Archidekt and Cardmarket blocked automated reads of their policies, so this is "not found", not "absent".
2. **Nobody documents a full export of one's account.** Deck-by-deck export is common; an export of comments, reviews, follows, collection and history together was not found on any site read.
3. **TappedOut sold a safety control.** In 2013, removing comments from one's own deck was for upgraded accounts [18]. This spec takes the opposite line: every safety and rights control is free.

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `61792c1`).

- **Reports, deck only.** `DeckReport` in `prisma/schema.prisma` holds one report per user per deck with a reason from `spam`, `harassment`, `illegal_content` or `other`, and no free text. `POST /api/community/decks/[id]/reports` requires a session, returns 404 for non-public decks and 403 for one's own deck, and upserts, so a repeat report resets the status to `pending`. The UI is `src/components/community/DeckReportButton.tsx`.
- **A queue with no action.** `GET /api/moderation/deck-reports` returns the 50 oldest pending reports to users with `User.isModerator`, checked by `src/lib/auth/require-moderator.ts`. `PATCH /api/moderation/deck-reports/[reportId]` accepts only `reviewed` or `dismissed`; it neither hides the deck nor tells the owner or the reporter anything. The page is `src/app/[locale]/moderation/reports/page.tsx`. `isModerator` can only be set in the database.
- **The audit trail is not durable.** `DeckReport` cascades when the reporter's account or the deck is deleted, so deleting either erases the report and its decision.
- **Comments, reviews, profiles and packages cannot be reported.** A comment can be deleted by its author or by the deck owner (`src/app/api/community/decks/[id]/comments/[commentId]/route.ts`); a moderator cannot remove it. `POST` on comments has no rate limit. No block, mute or per-deck comment switch exists.
- **Deletion exists only as an API.** `DELETE /api/user/profile` calls `prisma.user.delete`; no component calls it, and no `/settings` root page exists (only `settings/api-keys` and `settings/notifications`).
- **Deleted accounts come back.** Sessions are JWTs valid for 7 days (`src/lib/auth/edge-config.ts`), and the delete route does not sign out. On the next authenticated request, `resolveAuthenticatedUser` in `src/lib/auth/helpers.ts` misses the id and upserts a user from the token's email, name and image, by design, to heal sessions after a database rebuild. A deleted account is therefore re-created, empty, by any device still signed in.
- **The cascade deletes other people's words.** `DeckComment.parent` cascades, so deleting an account deletes every reply other players wrote under its comments. Forks keep `forkedFromUserName`, copied from the author's display name in `src/app/api/decks/[id]/fork/route.ts`, after the author is gone.
- **No full export.** Per-deck exports exist (`src/lib/deck/export.ts`), the public API returns decks and the collection to a key holder (`src/app/api/v1/`), and the acquisition plan downloads as CSV. Nothing exports comments, reviews, votes, follows, playtests or the profile.
- **No legal pages.** No route under `src/app/[locale]` holds a legal notice, terms, privacy policy or DSA contact. The footer (`src/components/layout/Footer.tsx`) shows only the Wizards and Scryfall notices. A grep of `src/` for privacy, terms of use or service, legal notice, consent, GDPR, RGPD and CNIL finds nothing.
- **Undisclosed processors.** `src/instrumentation-client.ts` enables Sentry Session Replay for 1% of sessions and every session with an error; `src/app/[locale]/layout.tsx` loads Vercel Speed Insights. Prompts go to `api.anthropic.com` and fall back to `api.openai.com` (`src/app/api/ai/build/route.ts`, `src/app/api/ai/suggest/route.ts`). Hosting is Vercel with Supabase, region suggested "Europe West" (`docs/engineering/infrastructure.md`). Sign-in uses Google. Error logs carry `userId`. No email sender exists. None of this is disclosed, because no privacy page exists, and there is no cookie banner.
- **No age statement.** Signup (`src/app/api/auth/signup/route.ts`) asks for name, email and password, and records no acceptance of terms.
- **One retention rule.** `MetaSnapshot` keeps 365 days (`src/lib/meta/snapshots.ts`). Nothing expires inactive accounts, old reports or verification tokens.

## Functional requirements

### 1. Legal pages and points of contact

1.1 A **legal notice** page names the publisher, address, phone, director of publication and the host's name, address and phone (LCEN Art. 1-1 [6]), in French and English, linked from every footer.
1.2 A **DSA contact page** names one electronic point of contact for authorities and one for users, states the languages accepted (French and English), and says that users reach a person, not only a bot (Arts. 11–12 [1]). Discourse's page is the model [20].
1.3 **Terms** state what content is not allowed, the moderation steps and who takes them, that no decision is automated, the appeal route (requirement 4), the minimum age (requirement 9) and the licence the user grants for public content, in plain language (Art. 14 [1]).
1.4 A **privacy policy** lists each purpose, its legal basis, each processor with its purpose and location (Vercel, Supabase, Sentry including Session Replay, Speed Insights, Google sign-in, Anthropic, OpenAI, and later the email sender and the billing provider), the retention table of requirement 8, the rights in requirements 6 and 7 and the CNIL as the authority to complain to.
1.5 Legal documents are versioned with a publication date. Signup records the terms version accepted; a material change is announced in-app before it applies.

### 2. Notice and action

2.1 Every public item can be reported: deck, primer, card note on a public deck, comment, review, profile, card package and share link.
2.2 Anyone can send a notice, signed in or not; Art. 16(1) opens the mechanism to any individual or entity [1]. Signed-out notices go through a form linked from the DSA contact page and from each report button.
2.3 A notice carries the fields of Art. 16(2): an explanation, the exact URL (filled in by the report button), name and email (prefilled when signed in), and a good-faith statement [1]. The category separates "illegal content" (with the law invoked, free text) from "breaks the terms".
2.4 The sender receives an acknowledgement with a reference, and later the decision and the redress available (Art. 16(4)–(5) [1]).
2.5 Duplicate notices on one item join one case. Notices are rate limited per sender and per IP. A sender of repeated, manifestly unfounded notices can be ignored for a stated period after a warning, as Art. 23(2) describes [1].
2.6 A notice that reveals a threat to someone's life or safety goes straight to the police (Art. 18 [1]); the queue offers that action and records when it was taken.

### 3. Decisions and statements of reasons

3.1 Moderators can hide an item, restore it, restrict an account from posting for a set period, or suspend it. A hidden item disappears from every public surface and API in the same transaction; its author still sees it, marked hidden.
3.2 Every restriction writes a decision with the fields of Art. 17(3): the action and its scope and duration, the facts, whether it followed a notice or the moderator's own review, that no automated means were used, and the legal ground or the terms clause [1].
3.3 The author receives the statement of reasons in-app at once, and by email once an email sender exists. The notifier receives the outcome (2.4).
3.4 Decisions are made by people. No model and no automatic filter hides, restricts or ranks content as a moderation step.
3.5 Reports and decisions survive the deletion of the reporter, the author or the item: personal links become null, and the decision keeps the category, action, ground and dates.
3.6 The owner can compute the average monthly active recipients on request (Art. 24(3), which still applies to a micro platform [1]); [I-30](i30-business-model-and-paid-tier.md) requirement 8.1 should add it to the owner's metrics.

### 4. Appeal

4.1 An author or notifier can contest a decision once, within six months, from the statement itself. A free internal complaint system is Art. 20 [1]; it does not bind a micro platform, and it is cheap and fair.
4.2 The appeal is decided with reasons and can reverse the decision. The outcome says that the courts remain open whatever the internal result (Art. 21(1) [1]).

### 5. Blocking and comment controls

5.1 Any user can block another. The blocked user cannot comment on, reply to, review or vote on the blocker's decks, or follow them; neither sees the other's comments. Blocking is silent and reversible.
5.2 A deck owner can turn comments off per deck, as Moxfield allows [12].
5.3 Comment and review creation is rate limited per user.
5.4 Blocking, comment controls, reporting and appeals are free for every account, always. TappedOut's 2013 paid comment removal [18] is the counter-example.

### 6. Account deletion

6.1 **Settings → Account** offers deletion after re-authentication and a prompt to download the export first. It completes at once, well inside the one month of GDPR Art. 12(3) [8].
6.2 Deletion ends the current session, and a tombstone holding a hash of the email, kept for the 7-day session lifetime, stops `resolveAuthenticatedUser` from re-creating the account from another device's token. A new signup with the same email after that window creates a new, empty account.
6.3 With an active subscription, deletion cancels it at the provider first (I-30 6.4).
6.4 The cascade follows this table:

| Data                                                                                                                                                                     | Today                                            | Required                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Own decks (public and private), cards, snapshots, folders, playtests, acquisition intents, collection, favourites, packages, follows, saved decks, API keys, OAuth links | Cascade                                          | Delete (unchanged)                                                              |
| Ratings, reviews and votes on others' decks                                                                                                                              | Cascade                                          | Delete; deck aggregates reflect it on the next read                             |
| Own comments with replies from others                                                                                                                                    | Cascade, deleting the others' replies            | Keep the row with its body and author cleared, shown as "deleted"; replies stay |
| Others' forks of own decks                                                                                                                                               | `forkedFromUserName` keeps the display name      | Replace with a neutral "deleted player" label                                   |
| Reports filed, and decisions about own content                                                                                                                           | Cascade                                          | Keep anonymised (3.5) for the retention period in 8                             |
| Session                                                                                                                                                                  | Valid up to 7 days; next request re-creates user | Ended; tombstone (6.2)                                                          |
| Pod game seats ([I-35](i35-pod-game-log.md))                                                                                                                             | —                                                | Turn into labels (I-35 6.2)                                                     |

6.5 Data that a legal duty requires to be kept, such as contributor identification (LCEN Art. 6 V A [6][7]) or billing records, moves to a restricted store with its own expiry instead of staying on the account. Which data and how long is a lawyer and accountant question (open question 1).

### 7. Full data export

7.1 **Settings → Account → Download my data** returns one JSON archive with everything tied to the account: profile, decks with cards, notes, snapshots and folders, collection, favourites and lists, packages, ratings and reviews, votes, comments, playtests, follows and followers, saved decks, acquisition intents, notification preferences, API key names and dates (never hashes), reports filed, and decisions about one's own content.
7.2 The archive has a versioned, documented schema and includes each deck in the existing text export formats, so another deckbuilder can import it (GDPR Art. 20 [8]).
7.3 The export is free, needs no request to a person, and is rate limited only against abuse (for example once an hour).
7.4 The same archive answers an access request (Art. 15); the privacy page explains how to ask for anything it does not cover.

### 8. Retention

8.1 A daily job applies this table, idempotently, with a dry-run mode that reports counts:

| Data                                       | Kept                                                                                       | Basis                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| Account with no sign-in                    | 2 years, then deleted as in 6; warned by email 30 days before (a hypothesis for the delay) | CNIL's view of inactive accounts [11]   |
| Signed-out notices with no decision linked | 6 months after closing                                                                     | Hypothesis; matches the appeal window   |
| Decisions and anonymised reports           | 3 years after the decision                                                                 | Hypothesis; lawyer question             |
| Deletion tombstones                        | 7 days                                                                                     | Session lifetime                        |
| Expired verification tokens                | Deleted daily                                                                              | No use after expiry                     |
| Contributor identification data            | As the decree requires, in the restricted store                                            | LCEN Art. 6 V A [6][7]; lawyer question |
| Logs, Sentry events and replays            | The provider's retention, stated in the privacy policy                                     | Provider settings                       |
| `MetaSnapshot`                             | 365 days (exists)                                                                          | `src/lib/meta/snapshots.ts`             |

8.2 Each row's period lives in one constant, and the privacy policy is rendered from the same table, so the two cannot drift.

### 9. Minors

9.1 Magic players include teenagers, so the defaults are safe for everyone instead of depending on knowing an age: no private messages, no ads, no profiling, no location, no streaks or engagement notifications on by default, and a public profile showing only a username, an optional avatar and public decks. They follow the direction of the Commission's recommended measures [2], which the operator adopts voluntarily.
9.2 Signup states a minimum age and records a single declaration, with no birth date. Art. 28(3) asks for no extra data to find out who is a minor [1]. The Commission finds self-declaration too weak for the platforms its guidelines cover [3], but those guidelines exclude a micro platform [2]; the safe defaults in 9.1 carry the protection instead.
9.3 Any feature that relies on consent (for example, analytics beyond the CNIL exemption [10]) needs a parent's consent jointly with a child under 15 in France [9]; the product therefore avoids consent-based processing for accounts. Which minimum age the terms state is a lawyer question.

### 10. The paid tier boundary

10.1 Export, deletion, reporting, blocking, comment controls and appeals are free on every plan and are never a paid lever, extending I-30 requirement 1.2. Expiry or downgrade never limits them.
10.2 Nothing in this spec is a paid candidate. Its value to I-30 is trust: a cheap subscription is easier to sell when leaving is easy and documented, which no competitor read here documents.

## Data model / API

```
Report       id, targetType (deck|primer|cardNote|comment|review|profile|package|shareLink), targetId, targetUrl,
             reporterId?, reporterName?, reporterEmail?, category (illegal|terms), lawInvoked?, explanation, goodFaith,
             caseId, status (open|decided|ignored), createdAt, closedAt?        -- replaces DeckReport (migration)
Decision     id, caseId?, targetType, targetId, authorId?, action (hide|restore|restrictPosting|suspend|none),
             scopeAndDuration, facts, origin (notice|ownReview), automated (always false), ground (legal|terms), groundText,
             moderatorId?, policeNotifiedAt?, decidedAt, authorNotifiedAt?, notifierNotifiedAt?
Appeal       id, decisionId (unique), appellantId?, appellantEmail?, text, outcome (upheld|reversed)?, decidedAt?
UserBlock    blockerId, blockedId, createdAt -- primary key (blockerId, blockedId)
Tombstone    emailHash (primary key), expiresAt
LegalDocument slug (legal|terms|privacy|dsa), version, locale, publishedAt
Deck, DeckComment, DeckRating, CardPackage, User: + moderationState (visible|hidden), Deck: + commentsEnabled
User: + termsVersion, termsAcceptedAt, ageDeclaredAt, lastSignInAt
```

Routes: `POST /api/reports` (signed in or out); `GET /api/moderation/cases`, `POST /api/moderation/decisions`; `POST /api/appeals`; `POST` and `DELETE /api/user/blocks/[userId]`; `GET /api/user/export`; `DELETE /api/user/profile` (fixed per 6.2); a protected scheduled route for the retention job.

## Non-goals

- Automated or AI moderation, keyword filters that hide content, or a model ranking reports (3.4).
- Age verification by identity document or face estimation. The Commission's measures do not bind a micro platform [2], and a document check would collect what Art. 28(3) says not to [1].
- Private messages, groups or chat.
- A legal representative (Art. 13 is for providers outside the EU [1]), a trusted-flagger programme, out-of-court dispute bodies and Commission database submissions, until the operator stops being a micro or small enterprise.
- Any paid safety or rights feature (10.1).
- A cookie banner for its own sake. If every tracker fits the CNIL's exemption [10], none is needed; the open question decides.

## Testing strategy

- **Deletion (sociable, PostgreSQL):** a seeded user with every relation is deleted; each row of the 6.4 table is asserted, including another user's reply surviving and a fork showing the neutral label. A request with the deleted user's still-valid JWT returns 401 and creates no user (the regression test for today's defect).
- **Export (sociable):** the same seed exports an archive that validates against the published schema and contains one entry per seeded row; a guard test fails when a new Prisma model with a `userId` is neither exported nor listed as excluded.
- **Notice and action (sociable):** a signed-out notice without a good-faith statement or URL is rejected; duplicates join one case; the reporter's and author's notifications carry every Art. 17(3) field.
- **Visibility (sociable):** a hidden item is absent from the public deck page, profile, community lists, share link and `/api/v1`; its author still sees it.
- **Blocking (sociable):** each blocked action returns 403 and each list omits the other party.
- **Retention (solitary and sociable):** the job is idempotent, honours each constant at its boundary day, and the dry run writes nothing; the privacy-policy table renders from the same constants.

## Delivery slices

| #   | Slice                                                                                                                                                                                                                                                          | Depends on                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0   | Written answers to the lawyer questions below, added to I-30's slice 0                                                                                                                                                                                         | — (owner and counsel; no code)               |
| 1   | Legal notice (identity fields supplied by the owner) and DSA contact page in French and English, footer links                                                                                                                                                  | —                                            |
| 2   | Deletion defect: end the session on delete and add the tombstone; regression test with a live JWT                                                                                                                                                              | —                                            |
| 3   | Deletion cascade rules of 6.4: replies survive, fork label, anonymised reports                                                                                                                                                                                 | 2                                            |
| 4   | Full JSON export endpoint with its schema and the guard test                                                                                                                                                                                                   | —                                            |
| 5   | Settings → Account page: download export, delete account with re-authentication                                                                                                                                                                                | 3, 4                                         |
| 6   | Privacy policy v1 rendered from the retention constants, processor list, versioned legal documents                                                                                                                                                             | — (final wording after 0)                    |
| 7   | Terms v1 with moderation rules and minimum age; acceptance and age declaration recorded at signup                                                                                                                                                              | 6 (final wording after 0)                    |
| 8   | Generic `Report` replacing `DeckReport`, report buttons on every item type, signed-out notice form, acknowledgement                                                                                                                                            | 1                                            |
| 9   | Moderation actions: `moderationState`, hide and restore, posting restriction, filtering on every public surface                                                                                                                                                | 8                                            |
| 10  | Decisions and statements of reasons, in-app notices to author and notifier, police-referral action                                                                                                                                                             | 9; I-63 slices 1 to 3 for the in-app notices |
| 11  | Appeals within six months                                                                                                                                                                                                                                      | 10                                           |
| 12  | Block, per-deck comment switch, comment and review rate limits                                                                                                                                                                                                 | —                                            |
| 13  | Transactional email sender with an exit path (reused by I-30 6.5 and 6.7)                                                                                                                                                                                      | Moved to I-63 slice 7                        |
| 14  | Retention job with dry run, inactive-account warning and deletion                                                                                                                                                                                              | 0, 3; I-63 slices 5 and 7                    |
| 15  | Email copies of statements of reasons and notice outcomes                                                                                                                                                                                                      | 10; I-63 slice 7                             |
| 16  | Record of processing (`docs/legal/processing-register.md`) checked by the model guard test, and a breach procedure (`docs/legal/breach-procedure.md`) with one tabletop drill _(added 2026-11-10 from the ninth pass's gap sweep; wording refined after L-44)_ | 4, 6                                         |

Slices 1 to 5 and 12 ship whatever counsel says, and slice 2 should go first: it fixes a defect a user can hit today. Slices 6 and 7 can ship a reviewed draft before slice 0 and update their wording after it. Scheduled agents must not pick slice 14 before slice 0's answers are committed, because the retention periods are decisions, not code. The email sender, slice 13, is now [I-63](i63-one-notification-system.md) slice 7, which waits for the owner's choice of provider, so scheduled agents must not pick slice 15 before that choice is committed (added 2026-11-10). Slice 16 lists each purpose, basis, data set, retention period and processor, read from slice 6's retention constants, and its guard test fails when a model with a `userId` is missing from the register; the breach procedure holds the 72-hour clock, the CNIL route, a breach log and a player notice template (GDPR Arts. 30, 33 and 34; lawyer question [L-44](../legal-questions.md#l-44-the-record-of-processing-and-a-breach-procedure), added 2026-11-10).

## Open questions

- **The lawyer questions**, to add to [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) (research, not legal advice):
  - Is MagicAIBuilder an "online platform" or only a hosting service under DSA Art. 3, and does it qualify as a micro enterprise while the owner is a sole operator, including the 12-month tail of Art. 19?
  - What must the legal notice show when the operator is an individual, and does running a paid tier make him a professional publisher under LCEN Art. 1-1?
  - Which identification data must a host keep under LCEN Art. 6 V A and décret 2021-1362, for how long, and how does that coexist with erasure on account deletion?
  - Do Sentry Session Replay and Vercel Speed Insights fit the CNIL audience-measurement exemption, or do they need consent and therefore a banner, or removal?
  - What transfer basis covers prompts sent to Anthropic and OpenAI and errors sent to Sentry, and must the privacy policy name each one?
  - Which minimum age should the terms state, given that the account is contract-based and France sets 15 for consent-based processing?
  - How long may decisions, anonymised reports and billing records be kept?
- **Deletion: immediate or with a grace period?** Immediate is simplest and meets 6.1. A 14-day window lets a hacked or regretted deletion be undone, but holds data longer and needs the content unpublished during it.
- **Who moderates, and how fast?** Today one owner would read every notice. A stated target (for example a first answer within 72 hours) belongs in the terms only if it can be kept on holiday weeks; Art. 16(6) asks for "timely" handling, not a number [1].
- Should signed-out notices need an email confirmation before they reach the queue? It filters spam without adding a captcha service, which the strategic boundaries discourage.
- Should public content stay after its author leaves, under a licence in the terms, as forums often do? This spec deletes it, which is the safer default for a product with teenage users.

## Sources

Read 2026-11-09 unless dated otherwise. Legal sources are research, not legal advice.

1. Regulation (EU) 2022/2065 (Digital Services Act), Arts. 3, 11–24 and 28. <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065>
2. European Commission, "Commission publishes guidelines on the protection of minors", published 2025-07-14, page updated 2026-04-22; scope excludes micro and small enterprises. <https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors>; full text OJ C/2025/5519: <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:C_202505519>
3. DSA Observatory, on the guidelines' view that self-declaration of age is not robust enough, 2025-07-30 (search summary; page not opened). <https://dsa-observatory.eu/2025/07/30/do-the-dsa-guidelines-on-protecting-minors-online-strike-the-right-balance/>
4. European Commission, SME definition (Recommendation 2003/361/EC thresholds). <https://single-market-economy.ec.europa.eu/smes/sme-fundamentals/sme-definition_en>
5. Arcom, press release on the promulgation of the SREN law designating Arcom as France's digital services coordinator, 2024-05-22. <https://www.arcom.fr/en/press/arcom-delighted-promulgation-law-aimed-securing-and-regulating-digital-space-which-designates-it-coordinator-digital-services-france>
6. Loi n° 2004-575 (LCEN), consolidated text, Arts. 1-1 and 6. <https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164>
7. Décret n° 2021-1362 du 20 octobre 2021 on the retention of data identifying contributors, Dalloz Actualité listing (title and object read; retention periods not read). <https://www.dalloz-actualite.fr/document/decr-n-2021-1362-20-oct-2021-jo-21-oct>
8. Regulation (EU) 2016/679 (GDPR), Arts. 12, 15, 17 and 20. <https://gdpr-info.eu/art-12-gdpr/>; <https://eur-lex.europa.eu/eli/reg/2016/679/oj>
9. CNIL, "Recommandation 4 : rechercher le consentement d'un parent pour les mineurs de moins de 15 ans", 2021-06-09. <https://www.cnil.fr/fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans>
10. CNIL, "Cookies : solutions pour les outils de mesure d'audience", 2025-07-04 (exemption conditions; trackers about 13 months, data 25 months at most). <https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience>
11. CNIL, "Achat de contenus numériques : quelle durée de conservation des comptes inactifs ?", 2025-09-18 (two years without action; warn before). <https://cnil.fr/fr/achat-de-contenus-numeriques-quelle-duree-de-conservation-des-comptes-inactifs>
12. Moxfield public wiki, Features, last edited 2020-10-14. <https://github.com/moxfield/moxfield-public/wiki/Features>
13. Moxfield privacy policy, HTTP 403; "effective December 31, 2021" is a search summary of <https://sorcery.moxfield.com/help/privacy>, also 403. <https://moxfield.com/privacy>
14. Archidekt, FAQ <https://archidekt.com/faq>; privacy link <https://archidekt.com/privacy> redirects to <https://spacecowmedia.com/privacy-policy>, which rendered no policy text.
15. EDHREC, privacy policy, undated. <https://edhrec.com/privacy>
16. TappedOut, help desk. <https://tappedout.net/help-desk/>
17. TappedOut, GDPR Statement 2018. <https://tappedout.net/gdpr-statement/>
18. TappedOut forum, "Disable or Delete Comments on Decks", 2013-10-07 (replies by users, one described as an admin). <https://tappedout.net/mtg-forum/tappedout/disable-or-delete-comments-on-decks>
19. Cardmarket, help page on usernames <https://help.cardmarket.com/en/NetiquetteUsernamesPasswords>; privacy policy HTTP 403 <https://www.cardmarket.com/en/Magic/Policies/PrivacyPolicy>
20. Discourse, Digital Services Act page. <https://discourse.org/dsa>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

### Goals

- A deleted account stays deleted on every device after its owner could download all of it, and other players' replies survive; every public item can be reported signed in or out, and every restriction reaches its author with a statement of reasons and a route to appeal; the legal notice, DSA contact, terms and privacy policy are public, versioned and name every processor.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-38-01

As a player who wants to leave, I want deletion, export and a way to report someone, so that the account is mine.

#### US-38-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-38-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-38-01 Happy path

Given a signed-in player and the English locale
When deletion expires the session and does not recreate the account on the next request.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-38-02 Happy path

Given a signed-in player and the English locale
When an export contains the player's decks and collection and not another player's reports.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-38-03 Happy path

Given a signed-in player and the English locale
When a report can be filed on a deck, a comment, a review, a profile or a package, and the reporter sees a status.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-38-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-38-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-38-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for every account before public growth or a charge. Guests can report a public deck only if the form stores no free-text identity beyond what I-38 already allows.

#### AC-38-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-38-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-38-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Legal pages are linked from the footer. A block hides that person's content. The statement of reasons is a page the affected player can open.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

New tables for reports, blocks and the export job. The export is the player's JSON, signed-in only. No public feed of reports.

### Analytics and telemetry

`report_filed {target: deck, comment, review, profile or package}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for every account before public growth or a charge. Guests can report a public deck only if the form stores no free-text identity beyond what I-38 already allows.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Who moderates, and how fast, is an owner question. The lawyer questions are already in the legal register.

### Sources

- https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065
- https://company.wizards.com/en/legal/fancontentpolicy
- https://eur-lex.europa.eu/eli/reg/2016/679/oj

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-38-101

As a player, I want the product to slice 0, no code: counsel's written answers to the spec's lawyer questions, added to I-30's slice 0., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slice 0, no code: counsel's written answers to the spec's lawyer questions, added to I-30's slice 0.

#### AC-38-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-102

As a player, I want the product to a legal notice and a DSA contact page in French and English, linked from every footer (slice 1)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A legal notice and a DSA contact page in French and English, linked from every footer (slice 1).

#### AC-38-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-105 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-38-103

As a player, I want the product to end the session when an account is deleted, with a 7-day tombstone and a regression test that replays a still-valid JWT (slice 2, first)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: End the session when an account is deleted, with a 7-day tombstone and a regression test that replays a still-valid JWT (slice 2, first). Today DELETE /api/user/profile (src/app/api/user/profile/route.ts) does not sign out. Until #1319, resolveAuthenticatedUser (src/lib/auth/helpers.ts) re-created the deleted user from the token's email on the next request. I-05 records the same defect.

#### AC-38-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-108 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-38-104

As a player, I want the product to apply the deletion cascade of the spec's table 6.4 (slice 3)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Apply the deletion cascade of the spec's table 6.4 (slice 3). Today DeckComment.parent cascades (prisma/schema.prisma), so deleting an account deletes every reply other players wrote under its comments, and DeckReport cascades from its reporter, so the reports the user filed disappear with their decisions. Replies must survive under a cleared comment, forks must show a neutral label, and reports and decisions must stay, anonymised.

#### AC-38-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-38-105

As a player, I want the product to a full JSON export with a versioned schema and a guard test, then a Settings → Account page that downloads it and deletes the account after re-authentication (slices 4–5)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A full JSON export with a versioned schema and a guard test, then a Settings → Account page that downloads it and deletes the account after re-authentication (slices 4–5).

#### AC-38-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-114 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-38-106

As a player, I want the product to a privacy policy rendered from the retention constants and listing every processor, and terms with moderation rules and a minimum age, accepted and recorded at signup (slices 6–7)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A privacy policy rendered from the retention constants and listing every processor, and terms with moderation rules and a minimum age, accepted and recorded at signup (slices 6–7). Today src/instrumentation-client.ts records Sentry Session Replay for 1% of all sessions and every session with an error, and prompts go to Anthropic with OpenAI as fallback (src/app/api/ai/build/route.ts, src/app/api/ai/suggest/route.ts); none of this is disclosed, because no privacy page exists. I-39 slice 4 sets random-session replay to zero.

#### AC-38-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-117 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-38-107

As a player, I want the product to return only the fields the share view needs from GET /api/share/[token]., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Return only the fields the share view needs from GET /api/share/[token]. src/app/api/share/[token]/route.ts returned the whole deck row minus the token, userId, budget and manualBracket included. Shipped in #1325 through the SHARED_DECK_SELECT allowlist; I-08 records the same item.

#### AC-38-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-120 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-38-108

As a player, I want the product to a generic Report for every public item with a signed-out notice form and an acknowledgement, then hide, restore and posting restrictions filtered from every public surface (slices 8–9)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-121 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A generic Report for every public item with a signed-out notice form and an acknowledgement, then hide, restore and posting restrictions filtered from every public surface (slices 8–9).

#### AC-38-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-109

As a player, I want the product to statements of reasons to the author and the notifier, a police-referral action and appeals within six months (slices 10–11)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Statements of reasons to the author and the notifier, a police-referral action and appeals within six months (slices 10–11).

#### AC-38-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-110

As a player, I want the product to block, a per-deck comment switch, and rate limits on comments and reviews (slice 12)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Block, a per-deck comment switch, and rate limits on comments and reviews (slice 12).

#### AC-38-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-111

As a player, I want **L4, low (security audit, 2026-11-10):** stop a repeated report reopening a closed deck report., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **L4, low (security audit, 2026-11-10):** stop a repeated report reopening a closed deck report. src/app/api/community/decks/[id]/reports/route.ts upserts with status: "pending", so a reporter can send a dismissed report back to the queue after every decision. Fix branch in flight: fix/api-small-hardening, no PR yet.

#### AC-38-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-112

As a player, I want the product to after slice 0: a transactional email sender with an exit path, a daily retention job with a dry run, and email copies of statements of reasons (slices 13–15)., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After slice 0: a transactional email sender with an exit path, a daily retention job with a dry run, and email copies of statements of reasons (slices 13–15).

#### AC-38-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-38-113

As a player, I want **A record of processing and a breach procedure (slice 16, added 2026-11-10 from the gap sweep).** GDPR Art., so that a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

#### AC-38-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **A record of processing and a breach procedure (slice 16, added 2026-11-10 from the gap sweep).** GDPR Art. 30 asks for records, and its exemption below 250 people does not cover processing that is "not occasional"; Art. 33 asks for notice to the CNIL within 72 hours, and Art. 34 to the people affected (GDPR, standard text, not fetched this pass). Neither appears in docs/. Lawyer question L-44.

#### AC-38-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-38-138 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

### UX states for this feature

The player-visible outcome is: a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

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

## I-38: Trust, Safety And User Rights

**Spec:** [`specs/i38-trust-safety-and-user-rights.md`](i38-trust-safety-and-user-rights.md)

**Outcome:** a player can report anything public, learn why something was hidden and contest it, block another player, read who runs the site and how their data is used, download everything tied to their account and delete it for good.

**Status:** Next
**Priority:** Next. A launch gate for I-30's paid tier (its slice 7 changes account deletion, and a paid plan needs terms and a privacy policy) and for any public growth
**Impact / effort:** High / large
**Depends on:** the owner's identity fields for the legal notice; counsel's written answers, added to I-30's slice 0, for the final wording of the terms and privacy policy and before the email sender and the retention job.

MagicAIBuilder shows public decks, primers, comments, reviews, profiles, packages and share links at its users' request, so in EU terms it is an online platform ([DSA Art. 3](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065)). As a micro enterprise it escapes most of the platform section, but every host owes points of contact, terms that describe moderation, a notice-and-action mechanism, a statement of reasons for each restriction and reports of threats to life to the police (Arts. 11–18). France adds the LCEN legal notice and Arcom as supervisor since May 2024, and the GDPR adds access, portability and erasure within a month. Today a public deck can be reported and a moderator can mark the report reviewed. Nothing else exists: no legal page, no export, no deletion button, no block and no statement of reasons. No deckbuilder read publishes a DSA contact, a notice form or a statement of reasons, and none documents a full account export. TappedOut sold the removal of comments from one's own decks in 2013; here every safety and rights control is free.

### Scope

- [ ] Slice 0, no code: counsel's written answers to the spec's lawyer questions, added to I-30's slice 0.
- [ ] A legal notice and a DSA contact page in French and English, linked from every footer (slice 1).
  - **Footer notice (gap sweep, 2026-11-10).** `LEGAL.md` and the footer text `notAffiliated` (`src/messages/*/common.json`, line 24) in all ten message catalogues cite "Wizards' Fan Site Policy", the fan-site-kit text (checked on `origin/dev` at `72fbfc1`). The [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15, gives its own notice: "MagicAIBuilder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC." Which notice the footer must carry is lawyer question [L-45](../legal-questions.md#l-45-the-products-name-and-the-fan-content-notice), asked with the product's name ([D-77](../owner-decisions.md#content-and-naming)); this slice changes the text after the answer. Done means: a test asserts the chosen notice in every locale's footer and in `LEGAL.md`.
- [ ] End the session when an account is deleted, with a 7-day tombstone and a regression test that replays a still-valid JWT (slice 2, first). Today `DELETE /api/user/profile` (`src/app/api/user/profile/route.ts`) does not sign out. Until #1319, `resolveAuthenticatedUser` (`src/lib/auth/helpers.ts`) re-created the deleted user from the token's email on the next request. I-05 records the same defect.
  - [x] Stop re-creating the deleted user, and replay a still-valid JWT in a regression test (`src/app/api/user/profile/account-lifecycle.test.ts`): after `DELETE`, the same token gets 401 and no user is created (#1319). The session cookie is not yet ended; the PR suggests the deletion UI call `signOut()` (slice 5). It also argues that spec 6.2's tombstone is no longer needed, since nothing re-creates a user per request.
  - [I-61](i61-account-security.md) supplies the rest: its slice 2 revokes every server-side session when the account is deleted, on every device, and its slice 3 the re-authentication that deletion needs. Once slice 2 ships, I-61 proposes dropping the 7-day tombstone; this slice decides with it.
- [ ] Apply the deletion cascade of the spec's table 6.4 (slice 3). Today `DeckComment.parent` cascades (`prisma/schema.prisma`), so deleting an account deletes every reply other players wrote under its comments, and `DeckReport` cascades from its reporter, so the reports the user filed disappear with their decisions. Replies must survive under a cleared comment, forks must show a neutral label, and reports and decisions must stay, anonymised.
- [ ] A full JSON export with a versioned schema and a guard test, then a Settings → Account page that downloads it and deletes the account after re-authentication (slices 4–5).
- [ ] A privacy policy rendered from the retention constants and listing every processor, and terms with moderation rules and a minimum age, accepted and recorded at signup (slices 6–7). Today `src/instrumentation-client.ts` records Sentry Session Replay for 1% of all sessions and every session with an error, and prompts go to Anthropic with OpenAI as fallback (`src/app/api/ai/build/route.ts`, `src/app/api/ai/suggest/route.ts`); none of this is disclosed, because no privacy page exists. [I-39](i39-first-run-activation-and-measurement.md) slice 4 sets random-session replay to zero.
  - The terms of sale, `LegalDocument` slug `sale`, are scoped under [I-30](i30-business-model-and-paid-tier.md) slice 0 with the gap sweep's consumer-law items (2026-11-10).
- [x] Return only the fields the share view needs from `GET /api/share/[token]`. `src/app/api/share/[token]/route.ts` returned the whole deck row minus the token, `userId`, `budget` and `manualBracket` included. Shipped in #1325 through the `SHARED_DECK_SELECT` allowlist; I-08 records the same item.
- [ ] A generic `Report` for every public item with a signed-out notice form and an acknowledgement, then hide, restore and posting restrictions filtered from every public surface (slices 8–9).
- [ ] Statements of reasons to the author and the notifier, a police-referral action and appeals within six months (slices 10–11).
  - The operator side, recorded 2026-11-10: slices 9 to 11 use [I-69](i69-operator-console-support-moderation-and-kill-switches.md)'s moderator role and `requireOperator`, and I-69 slice 11 builds the queue's operator view (tabs, the case view, a decision form that preselects nothing, appeals and the referral record) on this initiative's notices, decisions and appeals.
- [ ] Block, a per-deck comment switch, and rate limits on comments and reviews (slice 12).
  - [ ] **L5, low (security audit, 2026-11-10):** no community write calls `checkRateLimit` today: comments, ratings, votes, follows and card packages (`src/app/api/community/`). Per-user limits need the shared store of I-05's M2 first.
- [ ] **L4, low (security audit, 2026-11-10):** stop a repeated report reopening a closed deck report. `src/app/api/community/decks/[id]/reports/route.ts` upserts with `status: "pending"`, so a reporter can send a dismissed report back to the queue after every decision. Fix branch in flight: `fix/api-small-hardening`, no PR yet.
- [ ] After slice 0: a transactional email sender with an exit path, a daily retention job with a dry run, and email copies of statements of reasons (slices 13–15).
  - [I-61](i61-account-security.md) slices 11 to 14 wait for this sender: email verification, password reset, security notices and email change. Whether security email may ship before counsel answers is an owner question in the status note.
  - Moved 2026-11-10: the sender (slice 13) is [I-63](i63-one-notification-system.md) slice 7, built on its slice 6's transport and templates, so every initiative sends through one transactional stream. The retention job (slice 14) registers on I-63 slice 5's job route, and statements of reasons reach the inbox through I-63 slices 1 to 3 (slice 10). Whether slice 7 waits for all of slice 0 or only for the privacy policy's processor entry is an owner question.
- [ ] **A record of processing and a breach procedure (slice 16, added 2026-11-10 from the gap sweep).** GDPR Art. 30 asks for records, and its exemption below 250 people does not cover processing that is "not occasional"; Art. 33 asks for notice to the CNIL within 72 hours, and Art. 34 to the people affected ([GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), standard text, not fetched this pass). Neither appears in `docs/`. Lawyer question [L-44](../legal-questions.md#l-44-the-record-of-processing-and-a-breach-procedure).
  - [ ] `docs/legal/processing-register.md` lists each purpose, basis, data set, retention period (read from the retention constants) and processor. Done means: the guard test that already lists every Prisma model with a `userId` also fails when a model is missing from the register.
  - [ ] `docs/legal/breach-procedure.md`: the 72-hour clock, the CNIL route, a breach log, and a player notice template on I-63's transactional stream. Done means: one recorded tabletop drill, with each processor's breach-notice clause checked.

### Engineering enablers

- A deletion test seeds a user with every relation and asserts each row of the cascade table; a request with the deleted user's valid JWT returns 401 and creates no user.
- A guard test fails when a Prisma model with a `userId` is neither exported nor listed as excluded.
- A hidden item is absent from the public deck page, the profile, community lists, the share link and `/api/v1`, and its author still sees it.
- Each retention period lives in one constant that the job and the privacy policy both read.

**Paid-tier angle:** none. Export, deletion, reporting, blocking, comment controls and appeals are free on every plan, and expiry or downgrade never limits them, extending I-30 requirement 1.2. Its value to I-30 is trust: a cheap subscription is easier to sell when leaving is easy and documented.

### Enrichment (2026-11-11)

**User story.** As a player who wants to leave, I want deletion, export and a way to report someone, so that the account is mine.

**Acceptance.**
- Deletion expires the session and does not recreate the account on the next request.
- An export contains the player's decks and collection and not another player's reports.
- A report can be filed on a deck, a comment, a review, a profile or a package, and the reporter sees a status.

**UX.** Legal pages are linked from the footer. A block hides that person's content. The statement of reasons is a page the affected player can open.

**Data and API.** New tables for reports, blocks and the export job. The export is the player's JSON, signed-in only. No public feed of reports.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `report_filed {target: deck, comment, review, profile or package}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for every account before public growth or a charge. Guests can report a public deck only if the form stores no free-text identity beyond what I-38 already allows.

**Open questions.** Who moderates, and how fast, is an owner question. The lawyer questions are already in the legal register.

### Definition of done

A deleted account stays deleted on every device after its owner could download all of it, and other players' replies survive; every public item can be reported signed in or out, and every restriction reaches its author with a statement of reasons and a route to appeal; the legal notice, DSA contact, terms and privacy policy are public, versioned and name every processor.

---

