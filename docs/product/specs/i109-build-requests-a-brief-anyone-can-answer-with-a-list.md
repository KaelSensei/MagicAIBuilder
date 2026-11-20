# I-109: Build Requests: A Brief Anyone Can Answer With A List

> **Initiative:** I-109, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-20 · **Priority:** Later, after [I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md) slice 1, [I-38](i38-trust-safety-and-user-rights.md)'s report, hide, block and rate-limit slices (8 to 12) and [D-108](../owner-decisions.md#product-scope-and-non-goals) · **Paid:** never · **Written 2026-11-20**
> **Placement:** a public board of requests for a deck that does not exist yet, answered by volunteers who deliver through I-108's handover. [I-08](i08-share-compare-and-learn.md)'s "seeking feedback" needs an existing deck; [I-53](i53-monthly-deckbuilding-challenges.md) judges entries against a brief and refuses open public challenge creation; [I-02](i02-checkable-ai-copilot.md) owns generation by a model.
> **Research:** one dated note of 2026-11-20 (angle R1), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20. Legal points are research, not legal advice.
> **Owns:** the build request (a structured brief), the board, claims and their cap, the check of each delivery against the brief, the side-by-side choice, and the volunteer's "Decks I built for others" page. **Does not own:** the handover itself ([I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md)); reports, hiding, blocking and rate limits ([I-38](i38-trust-safety-and-user-rights.md)); who moderates ([D-56](../owner-decisions.md#community-and-moderation)); the bracket floor ([I-77](i77-a-bracket-estimate-players-can-audit.md)); prices ([I-32](i32-seller-handoff-and-affiliate-carts.md), [I-96](i96-two-labelled-prices-and-no-conversion.md)); deck comparison ([I-08](i08-share-compare-and-learn.md)); notices ([I-63](i63-one-notification-system.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-08       | A non-goal line: a request for a deck that does not exist yet is I-109's. I-08 keeps "seeking feedback" on an existing deck.                       |
| I-53       | No change to its non-goal "Open public challenge creation by any account": a request has one beneficiary and no judging, so it is not a challenge. |
| I-75       | A "Build requests" preset could later reuse the query contract; not in this file's slices.                                                         |
| I-38       | The board is a new public surface for user content; it ships only after slices 8 to 12 and under D-56.                                             |

## Overview

Volunteers on r/EDH offer to build decks for strangers, and hundreds of requests arrive as comments. "Let Me Build You a Commander Deck? (Back to School Edition)" drew 192 points and 523 comments on 2026-08-15: "If you give me a single card … I'll go through and make a deck all around it for $100 or less. Just comment on this post … and I'll reply with the list" [1]. "Let me build a deck for you!" drew 121 points and 323 comments on 2026-10-27, "let me know what commanders you've been wanting to try out, the theme you want, and what your budget is … No guarantees, and first come first served" [1]. "Let me build your deck idea!" drew 78 points and 237 comments on 2026-06-22, asking for "your deck idea (be that a commander, theme or both) and bracket indication" [1].

Every request carries the same fields: an anchor card or commander, a theme, a budget and a bracket. Nothing records the brief or who took it, and nothing checks whether the list honours the budget and the bracket. Archidekt's "Deck help requests" of 2026-07-27 serve an existing deck, not a brief [2]; paid builds sit on Fiverr [3].

This initiative turns the request into a structured brief on a board. A volunteer claims a request, within a cap on open claims, builds in their own account and delivers through [I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md)'s handover. The requester sees each delivery checked against the brief, side by side, before keeping one.

**Why a separate file from I-108.** I-108 is private between two known accounts and needs no moderation. This board is public content addressed to strangers: it needs I-38's report and hide path, D-56's moderator, a claim cap and rate limits, and it carries a minors question I-108 does not. The research note left the merge to the writer; the jobs, the risk and the placement differ, so they stay two files, and this one depends on I-108's slice 1. **Why Later.** Risk is High until I-38's slices ship.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source           | What it does or says                                                                                                               | Source |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **r/EDH volunteer threads** | 192 points / 523 comments, 121 / 323, 78 / 237 and 32 / 108 in 2026; each request names an anchor, a theme, a budget and a bracket | [1]    |
| **Archidekt deck help**     | Since 2026-07-27, a flagged existing deck asks two questions for seven days; it serves a deck, not a brief                         | [2]    |
| **Fiverr**                  | Paid "custom commander deck" gigs (search summary; HTTP 403)                                                                       | [3]    |
| **TappedOut**               | Feature Tokens buy front-page time for a deck: the counter-example of paid placement                                               | [4]    |

**The gap.** No site found takes a structured brief for a deck that does not exist yet and checks volunteers' lists against it.

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **"Seeking feedback" is a flag and one question on an existing public deck:** `seekingFeedback` and `feedbackQuestion` (`prisma/schema.prisma`, lines 158 and 159), set in `src/components/community/FocusedFeedbackPanel.tsx`.
- **I-75's query contract carries a `seekingFeedback` filter** (`src/lib/community/deck-search-query.ts`).
- **Nothing represents a request for a deck that does not exist yet.** No handover exists ([I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md) is new).

**Owning context:** `community`, beside I-108's handover; checks read the deck-analysis and pricing contexts through their public entry points.

## Functional requirements

### 1. Principles

1.1 A request is structured fields only. No free text in version 1, so no moderation of prose is needed for the brief itself.
1.2 Nothing is paid: no tip, commission, bump or featured request.
1.3 Nothing ranks volunteers: no count, badge or leaderboard (I-72's non-goal).
1.4 A delivery built with the copilot keeps `isAIGenerated`, and the requester can exclude such deliveries.

### 2. The request

2.1 Fields: an anchor card or commander by Oracle identity, up to three style handles ([I-54](i54-find-your-next-commander.md)), a budget with its market, a bracket intent, and the format (I-42's formats only).
2.2 One open request per account (proposed). A request is a private draft until posted, and expires after 14 days (proposed) with no accepted delivery; the requester may reopen it once.

### 3. The board and claims

3.1 The board lists posted requests, `noindex`, ordered by age, filtered by colour, bracket and budget.
3.2 A volunteer claims a request; open claims are capped (3 proposed) and expire. Claiming refuses with a catalogue string when the cap is reached.

### 4. Delivery and choice

4.1 A volunteer delivers through I-108's handover. Each delivery shows its checks against the brief: legality and colour identity, I-77's floor against the requested bracket, the dated total against the budget, and the AI label.
4.2 The requester sees deliveries side by side through I-08's comparison and accepts one. Accepting closes the request; the other volunteers see "not chosen", with no reason.

### 5. Safety

5.1 Report, hide and posting restrictions through I-38; block exclusion; rate limits on posting and claiming.
5.2 Between two accounts where one blocked the other, neither can claim or deliver, and the board omits the request for both.

### 6. Free and paid

| Part                                    | Free | Paid candidate | Why                                                                                       |
| --------------------------------------- | ---- | -------------- | ----------------------------------------------------------------------------------------- |
| Requests, claims, deliveries, the board | Yes  | —              | Community content stays free; charging either side would make it a services market (I-33) |

## Data model / API

```
BuildRequest   id, requesterId, anchorOracleId, styleHandles[] (max 3), budget {amount, market}, bracketIntent, format,
               status: draft | open | closed | expired, reopenedOnce, postedAt?, expiresAt
BuildClaim     id, requestId, volunteerId, status: open | delivered | expired | released, createdAt
Delivery       = I-108 DeckHandover with requestId; briefCheck {legal, identity, floorVsBracket, totalVsBudget, aiBuilt}
```

- `POST /api/build-requests`, `POST /api/build-requests/[id]/claims`, `GET /api/build-requests` (board), `POST /api/build-requests/[id]/accept/[handoverId]`.
- Accept is one transaction: the handover accepted, the request closed, the other claims marked "not chosen".

## Non-goals

- Payment, tips, commissions or featured requests (the paid-placement non-goal; TappedOut's Feature Tokens are the counter-example).
- Private messages or chat (I-38 9.1).
- Model-generated deliveries presented as a volunteer's.
- Ranking, counting or badging volunteers (I-72).
- Links other than the delivered deck in a delivery.
- Requests for formats outside [I-42](i42-commander-variants-duel-cedh-pauper.md)'s.
- A private gift between known accounts: that is [I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md).

## Testing strategy

- **Brief check (solitary):** `checkDeliveryAgainstBrief(deck, brief, prices, floor)` returns "over budget by 12 USD on <date>" and "floor 3 above the requested 2" for the fixture of AC-109-01.
- **Claim cap (sociable):** a fourth claim with three open is refused with a catalogue string.
- **Block (sociable):** a blocked pair cannot claim or deliver, and the board omits the request for both.
- **Accept (sociable):** accepting one delivery closes the request and marks the others "not chosen" in one transaction.
- **Red first:** slice 1's first Red: posting a second open request from the same account is refused.

## Delivery slices

| #   | Slice                                                                                                                   | Depends on                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0   | Owner: D-108 (build the public board at all; the claim cap, expiry and reopening; deliveries public by default or not)  | — (owner)                                    |
| 1   | `BuildRequest` and the requester's form, structured fields only; one open request per account; private draft and expiry | 0                                            |
| 2   | The public board (`noindex`), ordered by age, filtered by colour, bracket and budget; claims, the cap and claim expiry  | 1; I-38 slices 8 to 12; D-56                 |
| 3   | Delivery through I-108's handover with the check against the brief; the side-by-side view; accepting closes the request | 2; I-108 slice 1; I-77 slice 1; I-32 slice 2 |
| 4   | Report, hide and posting restrictions through I-38; block exclusion and rate limits on posting and claiming             | 2; I-38                                      |
| 5   | The volunteer's page "Decks I built for others": accepted deliveries both parties made public; no counts and no badges  | 3                                            |

No slice can start now: slice 1 waits for D-108.

## Open questions

1. **Free text.** Does a "what I like" line ever join the brief, which would add moderation of prose? Recommended: no in version 1.
2. **Limits.** The claim cap (3), the request expiry (14 days) and one reopening are proposals for D-108.
3. **Minors.** May minors post requests, given that strangers answer them? I-38 9.1's defaults apply; the lawyer question is [L-08](../legal-questions.md#l-08-minors-the-stated-minimum-age-and-adult-only-features) (a dated addition of 2026-11-20).
4. **Visibility.** Are accepted deliveries public by default on the requester's profile? Recommended: no.
5. **Reuse.** Should a volunteer's delivered list be offered to later requesters with the same anchor (a fork), or stay one-to-one? Recommended: one-to-one in version 1.

## Sources

Read on 2026-11-20 unless stated otherwise. Reddit scores are Arctic Shift snapshots.

1. r/EDH: "Let Me Build You a Commander Deck? (Back to School Edition)", 2026-08-15, 192 points, 523 comments (verified on 2026-11-20 through Arctic Shift with the product User-Agent), <https://www.reddit.com/r/EDH/comments/1vpcysz/>; "Let me build a deck for you!", 2026-10-27, 121 / 323, <https://www.reddit.com/r/EDH/comments/1xgikli/>; "Let me build your deck idea!", 2026-06-22, 78 / 237, <https://www.reddit.com/r/EDH/comments/1ucfcgw/>; "I will BUILD the top Voted ELDER DRAGON, as edh was meant to be", 2026-02-01, 32 / 108, <https://www.reddit.com/r/EDH/comments/1qsnbhy/>.
2. Archidekt, "Deck help requests", news 24799503, 2026-07-27. <https://archidekt.com/news/24799503>
3. Fiverr, an example gig (search summary; HTTP 403). <https://fiverr.com/chillychill69/craft-your-perfect-edh-magic-the-gathering-commander-deck>
4. TappedOut, "Level up". <https://tappedout.net/help-desk/level-up/>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player who wants a deck built around a card, a commander or a theme posts in a 500-comment thread and waits, "first come first served", for a stranger's link. Nothing records the brief or who took it, and nothing checks the list against the budget and the bracket. Evidence: four 2026 r/EDH volunteer threads at 32 to 192 points, read 2026-11-20 [1].

### Goals

- A requester posts a structured brief once.
- A volunteer claims a few requests at a time and delivers into the requester's account through I-108.
- The requester compares deliveries side by side, each checked against the brief, before keeping one.

### Non-goals

- Payment, featured requests, chat, ranking volunteers, AI deliveries passed off as a person's, outside links, unsupported formats, private gifts (I-108).

### Personas

The casual pod player as requester; the collector and budget player for budget briefs; the content creator as volunteer. See the roadmap persona table.

### User stories

#### US-109-01

As a player who wants to try a commander, I want to post my commander, theme, budget and bracket once and receive lists checked against them, so that I can pick one without auditing each by hand.

#### US-109-02

As a volunteer builder, I want to claim a few requests at a time and deliver into the requester's account, so that my work is used and credited.

#### US-109-03

As a requester, I want deliveries side by side with their checks, so that a list over my budget or above my bracket is obvious before I keep it.

### Acceptance criteria

#### AC-109-01 Happy path

Given a request with a 100 USD budget and Bracket 2
When a volunteer delivers a deck whose dated total is 112 USD and whose floor is 3
Then the delivery shows "over budget by 12 USD on <date>" and "floor 3 above the requested 2", and the requester sees both before accepting

#### AC-109-02 Error and failure

Given an accept cannot finish
When the requester retries
Then the request, the claims and the handover are as they were before the first attempt, or all updated together, and the message is a catalogue string

#### AC-109-03 Claim cap

Given a volunteer already holds three open claims
When they claim another
Then the claim is refused with a catalogue string

#### AC-109-04 Guest and signed-in

Given a signed-out reader
When they open the board
Then they read requests and accepted public deliveries only, with no claim control that fails with a raw 401

#### AC-109-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-109-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When a requester compares deliveries without a pointer
Then the comparison is a table with headers, each check reads as a word ("over budget", "within budget"), and no status is colour alone

#### AC-109-07 Expiry

Given a request reaches 14 days with no accepted delivery
When the daily job runs
Then it leaves the board, the requester may reopen it once, and existing deliveries stay readable to the requester

#### AC-109-08 Block

Given two accounts where one blocked the other
When either opens the other's request
Then neither can claim or deliver (403), and the board omits the request for both

### UX flow and states

"Ask for a deck" opens the brief form. The board lists requests with filters; "Claim" adds one to the volunteer's claims. The requester's request page lists deliveries side by side with their checks and "Keep this one".

- Empty: "No open requests match these filters."
- Loading: a busy state that keeps the list still.
- Error: "This request could not be updated", with a retry.
- Partial: a check that waits for its owner reads "not yet available".

### Data model and API

The types in [Data model / API](#data-model--api).

### Analytics and telemetry

`build_request_posted {format, bracketIntent, hasBudget}`, `build_request_claimed {}`, `build_request_closed {outcome: accepted | expired}`. Reserved for I-39's store. Counts and enums only.

### Rollout and feature flags

Behind an I-69 switch, `community.buildRequests`, off until D-108, D-56 and I-38 slices 8 to 12. Guests read; signed-in players post and claim.

### Dependencies

[I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md) slice 1; [I-38](i38-trust-safety-and-user-rights.md) slices 8 to 12; [D-56](../owner-decisions.md#community-and-moderation); [I-77](i77-a-bracket-estimate-players-can-audit.md) slice 1; [I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2 and [I-96](i96-two-labelled-prices-and-no-conversion.md); [I-08](i08-share-compare-and-learn.md) comparison; [I-63](i63-one-notification-system.md); [I-02](i02-checkable-ai-copilot.md)'s label; [I-75](i75-finding-public-decks.md) later.

### Risks and mitigations

- **Strangers and minors.** Mitigation: structured fields only, no messages, I-38's report and block before launch, L-08's answer before minors may post.
- **Spam and abandoned claims.** Mitigation: one open request per account, a claim cap, claim expiry and rate limits.
- **AI deliveries.** Mitigation: the AI label survives the handover, and the requester may exclude such deliveries.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-109-101 Two deliveries, one kept

As a requester with two deliveries, I want to keep one and let the other volunteer know without a reason, so that nobody waits.

#### AC-109-100 Happy path

Given two deliveries on one request
When the requester keeps one
Then the request closes, the kept deck is in the requester's account, and the other volunteer sees "not chosen"

#### AC-109-101 Failure

Given a volunteer's claim expires before they deliver
When they try to deliver
Then the delivery is refused with "Your claim expired", and they may claim again if the request is still open

#### AC-109-102 Edge

Given a delivery built with the copilot and a requester who excluded AI-built decks
When the volunteer delivers
Then the delivery is refused before it is sent, with a catalogue string naming the rule

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "No open requests match these filters."                                                                 |
| Loading          | A busy state that keeps the list still.                                                                 |
| Error            | "This request could not be updated", with a retry.                                                      |
| Guest            | Requests and accepted public deliveries; no claim control.                                              |
| Signed-in        | Post, claim and deliver.                                                                                |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Filters, claim and "Keep this one" are reachable without a pointer.                                     |
| Screen reader    | Checks are announced as words with their dates.                                                         |
| Colour           | Checks are words and icons as well as hue, in both themes.                                              |
| Success          | "Deck added to your decks", with a link.                                                                |

### Alternate paths

- The requester withdraws a request. Open claims are released; deliveries already sent stay readable to the requester.
- A volunteer releases a claim. The request returns to the board with its age unchanged.

### Roadmap record (2026-11-20)

This file is the record from the start; the roadmap row for I-109 is a link here. The nineteenth pass decided to keep it apart from [I-108](i108-decks-built-for-someone-else-the-brief-and-the-handover.md) (see "Why a separate file").

## I-109: Build Requests: A Brief Anyone Can Answer With A List

**Outcome:** a requester posts a structured brief; volunteers claim it and deliver through I-108's handover; the requester compares deliveries checked against the brief and keeps one.

**Status:** Later
**Priority:** Later, after I-108 slice 1, I-38 slices 8 to 12 and D-108. Never paid.
**Impact / effort:** Medium / medium
**Risk:** High. Strangers interact and requests are user content; answered by structured fields, I-38's safety slices and D-56.
**Depends on:** D-108; I-108 slice 1; I-38 slices 8 to 12; D-56; I-77 slice 1; I-32 slice 2.

Volunteer threads on r/EDH reach 192 points and 523 comments, each request naming an anchor, a theme, a budget and a bracket. No site found takes the brief and checks the lists against it.

### Scope

- [ ] `BuildRequest` and its form (slice 1); the board and claims (slice 2).
- [ ] Delivery through I-108 with the brief check and the side-by-side choice (slice 3).
- [ ] Safety through I-38 (slice 4); the volunteer's page (slice 5).

### Engineering enablers

- `checkDeliveryAgainstBrief` is pure; accept is one transaction.

**Paid-tier angle:** none. Never paid.

### Enrichment (2026-11-20)

**User story.** As a player who wants to try a commander, I want to post a brief once and compare checked lists, so that I keep one without auditing each.

**Acceptance.** Deliveries show budget and bracket checks; the claim cap holds; a blocked pair cannot interact; guests read only.

**UX.** "Ask for a deck", a board with filters, a side-by-side delivery view.

**Data and API.** `BuildRequest`, `BuildClaim`, deliveries as I-108 handovers.

**i18n and access.** English and French; checks as words.

**Telemetry.** `build_request_posted`, `build_request_claimed`, `build_request_closed`. Reserved for I-39.

**Rollout.** `community.buildRequests`, off until D-108, D-56 and I-38.

**Open questions.** Free text; limits; minors; visibility; reuse.

### Definition of done

A requester posts a commander, a theme, a 100 USD budget and Bracket 2; two volunteers claim and deliver; the requester sees one delivery flagged over budget and above the bracket, keeps the other, and the request closes.

---
