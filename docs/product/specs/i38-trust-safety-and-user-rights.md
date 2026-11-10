# I-38: Trust, Safety And User Rights

> **Status:** Proposed · **Priority:** Next. A launch gate for [I-30](i30-business-model-and-paid-tier.md)'s paid tier (its slice 7 changes account deletion, and a paid plan needs terms and a privacy policy) and for any public growth · **Written 2026-11-09**
> **Research:** a dated note on EU and French platform law, GDPR practice and five competitors' public pages. The note is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each one is routed to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** reporting and moderation of every kind of user content, statements of reasons and appeals, blocking and comment controls, the legal pages (legal notice, terms, privacy policy, DSA contact page), account deletion and its cascade, the full data export, retention jobs, the age statement and the defaults that protect minors. **Does not own:** the social features themselves ([I-08](../roadmap.md#i-08-share-compare-and-learn)); the public projection of a deck ([I-36](i36-creator-and-embed-toolkit.md) slice 1); the API rate limit ([I-05](../roadmap.md#i-05-production-safety)); billing and the subscription lifecycle (I-30); the deck-index takedown form ([I-29](i29-cross-site-deck-index.md) 1.7), which should reuse the notice form here; game-log deletion rules ([I-35](i35-pod-game-log.md) 6.2), which extend the cascade here.

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

| #   | Slice                                                                                                               | Depends on                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0   | Written answers to the lawyer questions below, added to I-30's slice 0                                              | — (owner and counsel; no code)               |
| 1   | Legal notice (identity fields supplied by the owner) and DSA contact page in French and English, footer links       | —                                            |
| 2   | Deletion defect: end the session on delete and add the tombstone; regression test with a live JWT                   | —                                            |
| 3   | Deletion cascade rules of 6.4: replies survive, fork label, anonymised reports                                      | 2                                            |
| 4   | Full JSON export endpoint with its schema and the guard test                                                        | —                                            |
| 5   | Settings → Account page: download export, delete account with re-authentication                                     | 3, 4                                         |
| 6   | Privacy policy v1 rendered from the retention constants, processor list, versioned legal documents                  | — (final wording after 0)                    |
| 7   | Terms v1 with moderation rules and minimum age; acceptance and age declaration recorded at signup                   | 6 (final wording after 0)                    |
| 8   | Generic `Report` replacing `DeckReport`, report buttons on every item type, signed-out notice form, acknowledgement | 1                                            |
| 9   | Moderation actions: `moderationState`, hide and restore, posting restriction, filtering on every public surface     | 8                                            |
| 10  | Decisions and statements of reasons, in-app notices to author and notifier, police-referral action                  | 9; I-63 slices 1 to 3 for the in-app notices |
| 11  | Appeals within six months                                                                                           | 10                                           |
| 12  | Block, per-deck comment switch, comment and review rate limits                                                      | —                                            |
| 13  | Transactional email sender with an exit path (reused by I-30 6.5 and 6.7)                                           | Moved to I-63 slice 7                        |
| 14  | Retention job with dry run, inactive-account warning and deletion                                                   | 0, 3; I-63 slices 5 and 7                    |
| 15  | Email copies of statements of reasons and notice outcomes                                                           | 10; I-63 slice 7                             |

Slices 1 to 5 and 12 ship whatever counsel says, and slice 2 should go first: it fixes a defect a user can hit today. Slices 6 and 7 can ship a reviewed draft before slice 0 and update their wording after it. Scheduled agents must not pick slice 14 before slice 0's answers are committed, because the retention periods are decisions, not code. The email sender, slice 13, is now [I-63](i63-one-notification-system.md) slice 7, which waits for the owner's choice of provider, so scheduled agents must not pick slice 15 before that choice is committed (added 2026-11-10).

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
