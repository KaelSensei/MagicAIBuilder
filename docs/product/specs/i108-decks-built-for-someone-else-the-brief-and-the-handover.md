# I-108: Decks Built For Someone Else: The Recipient's Brief And The Handover

> **Initiative:** I-108, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-20 · **Priority:** Later; slices 1 and 2 are private between two consenting accounts and need no moderation, so the owner may promote them alone; slice 5 waits for [I-53](i53-monthly-deckbuilding-challenges.md) slice 8 · **Paid:** never · **Written 2026-11-20**
> **Placement:** a deck one person builds and gives to another account. [I-08](i08-share-compare-and-learn.md) owns forks of public decks, pulled by the reader; nothing pushes a private deck to a named recipient. [I-109](i109-build-requests-a-brief-anyone-can-answer-with-a-list.md) owns the public board where strangers answer a request, and delivers through this file's handover.
> **Research:** one dated note of 2026-11-20 (angle R1, collaboration, groups and the social graph), not committed, so every external fact links its entry in [Sources](#sources). Reddit scores are Arctic Shift snapshots read 2026-11-20 and can differ from live Reddit. Legal points are research, not legal advice.
> **Owns:** the handover of a finished deck to a named account (offer, accept, decline, expiry), the recipient's brief as structured fields, the owned-card grant for one draft, the reveal date of a gift, and the "Built for you by" credit. **Does not own:** forks of public decks and attribution columns ([I-08](i08-share-compare-and-learn.md)); the public request board ([I-109](i109-build-requests-a-brief-anyone-can-answer-with-a-list.md)); private challenges and their draw ([I-53](i53-monthly-deckbuilding-challenges.md)); wanted lists and gifts of cards or sealed products ([I-56](i56-wishlists-friends-can-buy-from.md)); choosing a precon as a gift ([I-106](i106-choosing-a-precon-one-product-lines-decks-side-by-side.md)); physical loans ([I-51](i51-cards-lent-and-borrowed.md)); patches to someone's existing deck ([I-20](i20-collaborative-review.md)); model-generated decks ([I-02](i02-checkable-ai-copilot.md)); blocking and minors ([I-38](i38-trust-safety-and-user-rights.md)).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-08       | A non-goal line: pushing a private deck to a named account belongs to I-108. I-08 keeps forks of public decks and the attribution columns; I-108's accept step reuses the fork projection.                                          |
| I-53       | Slice 8's private challenge may gain a recipient draw (a seeded derangement any member can replay) and a reveal date; at the reveal each entry becomes an I-108 handover. Recorded as a dated line on I-53, built by I-108 slice 5. |
| I-56       | A non-goal line: building a whole deck for someone is I-108's; I-56 keeps gifts of cards, precons and sealed products.                                                                                                              |
| I-63       | Two notice kinds, "An offer is waiting" and "Your gift is revealed", both opt-in.                                                                                                                                                   |
| I-72       | A signed-out handover link is a sign-up entry (`via=handover`), through slice 1's return path.                                                                                                                                      |

## Overview

Players build whole decks for partners, friends and exchange recipients. Since 2025-01-01, r/EDH has 24 titles containing "for my girlfriend" and 32 containing "for my wife" [1]: "Need help with finding a specific commander for my girlfriend!" (24 points, 63 comments, 2026-07-31), "Help me build a gift deck for my girlfriend" (8 points, 41 comments, 2026-10-22), "Looking to make a Wolf deck for my wife who is brand new to magic" (7 points, 41 comments, 2025-11-09) [1]. Communities run deck exchanges: r/BudgetBrews' 2026 "Secret Santa" asks each member to "brew a complete, ready-to-play Commander deck for a fellow community member" at "a legal value between $30 and $50 USD (excluding basic lands and shipping)" [2]; a playgroup's exchange capped decks at "$50 total deck price excluding commander and basic lands, with the commander being up to 10 dollars" [3]. 31 r/EDH titles have contained "secret santa" since 2024-01-01 [3].

Today the builder pastes a link and the recipient re-imports it. Nothing records who the deck was for, what that person asked for, or which checks the list passed when it was given.

This initiative lets a builder address a draft to a recipient, read the recipient's own brief beside the editor, and hand the finished deck over. Accepting creates the recipient's own private, independent copy with a "Built for you by …" credit and the check report frozen at the offer. A gift can stay hidden until a reveal date. With the recipient's revocable grant, the builder sees which of the draft's cards the recipient already owns, and nothing else of their collection.

**Why a new initiative.** No file owns "a person builds a deck for another person and gives it to them" (ownership re-checked on 2026-11-20 against the glance table and the specs listed in the header). I-08's fork is pulled by a reader from a public deck; I-53's entries stay their entrants'; I-56 gives cards, not decks. **Why Later.** The evidence is player threads and a recurring community exchange, and no shipped competitor feature was found; slices 1 and 2 are small and private, so the owner may promote them.

## What the market does

All rows were read on 2026-11-20 unless dated otherwise.

| Product or source          | What it does or says                                                                                                                                                                   | Source |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **r/EDH**                  | 24 "for my girlfriend" and 32 "for my wife" titles since 2025-01-01, at up to 24 points and 63 comments; a partner asking for help to build her boyfriend a Christmas deck (14 points) | [1]    |
| **r/BudgetBrews exchange** | A recurring Secret Santa: a complete Commander deck for a drawn member, $30 to $50, basics and shipping excluded; the 2024 edition was the "eleventh"                                  | [2]    |
| **A playgroup's exchange** | $50 cap excluding commander and basics, commander up to $10; each member builds for the player they drew                                                                               | [3]    |
| **Archidekt**              | "Clone deck" (a copy) and collaborators who see a deck under "Shared with me"; no transfer of ownership found (search summary)                                                         | [4]    |
| **TableCommander**         | "Friends can be added to a deck as collaborators"                                                                                                                                      | [5]    |
| **Fiverr**                 | Paid "custom commander deck" gigs, "a basic tier at $20" (search summary; the page answered HTTP 403)                                                                                  | [6]    |
| **Moxfield**               | Not fetched, by rule; no transfer feature found by search                                                                                                                              | —      |

**The gap.** No deck site found lets a builder address a deck to a named account, show that person's own brief while building, and hand the result over with the checks it passed. "Not found" is not "absent".

## Current state in this codebase

Verified on `dev` at `c88bdc7d` (#1631) on 2026-11-20:

- **Only a public deck can be copied into another account.** `POST /api/decks/[id]/fork` is documented as "create a private attributed copy of a public deck" (`src/app/api/decks/[id]/fork/route.ts`, line 10) and loads only `where: { id, isPublic: true }` (line 26).
- **Attribution is three denormalised columns:** `forkedFromDeckId`, `forkedFromDeckName` and `forkedFromUserName` (`prisma/schema.prisma`, lines 161 to 163).
- **No recipient, offer, accept step, reveal date or brief owned by another person** exists in the schema or in `src/`.
- **I-53's private challenges (slice 8) are not built.** Blocking (I-38 slice 12) is not built.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `community` for the handover and the brief; the copy reuses the deck context's fork projection; the owned-card read goes through the collection context's public entry point.

## Functional requirements

### 1. Principles

1.1 A handover moves a copy, never ownership of the builder's deck. After acceptance, the two decks are independent.
1.2 The brief is structured fields only. There is no free text and no message between builder and recipient (I-38 9.1: no private messages).
1.3 The builder sees nothing of the recipient's account beyond the brief they shared and, with a separate grant, owned or not owned for the draft's card names.
1.4 A deck built with the copilot keeps `isAIGenerated` through the handover, and the credit says so.

### 2. The handover

2.1 A builder offers a deck to one account. The offer freezes a snapshot and a check report: legality and colour identity, the bracket floor ([I-77](i77-a-bracket-estimate-players-can-audit.md) slice 1, "not yet available" until it ships), and the dated total in the brief's market ([I-96](i96-two-labelled-prices-and-no-conversion.md), [I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2).
2.2 The recipient accepts, declines or lets the offer expire (30 days proposed). Accepting creates a private deck with the same commanders, main deck and side zones, the credit and the frozen report, through the fork projection with no notes and no budget; the primer follows [D-93](../owner-decisions.md#community-and-moderation).
2.3 Declining or expiry creates nothing. The builder sees "declined" or "expired", with no reason. A second identical offer is not duplicated.
2.4 No offer can be sent between two accounts when either has blocked the other (I-38 5.1).

### 3. The recipient's brief

3.1 Owned by the recipient: colour identities liked and avoided, up to three style handles ([I-54](i54-find-your-next-commander.md)), a budget with its market (no conversion), a bracket intent (I-28's names), a new-to-Magic switch, and commanders and cards to avoid, by Oracle identity.
3.2 Shared with one builder for one draft, revocable, shown in a panel beside the editor, never public.

### 4. The owned-card grant

4.1 Per draft and revocable, the recipient may let the builder see owned or not owned for the draft's card names only, read from [I-06](i06-collection-and-purchase-planning.md)'s owned copies.
4.2 A revoke takes effect on the next read.

### 5. Gifts and exchanges

5.1 A reveal date hides the offer from the recipient until that date; at the date the offer appears, with an [I-63](i63-one-notification-system.md) notice if the recipient opted in.
5.2 A recipient without an account reads the list signed out through the share projection; "Keep this deck" goes through [I-72](i72-growth-loops-referrals-creators-and-return.md)'s sign-up and returns to the accept step. Nothing identifying them is stored before they sign up.
5.3 Exchanges reuse I-53 slice 8's private challenge with a recipient draw and a price cap with exclusions (basics, a separate commander cap), as the communities above run them. At the reveal every entry becomes a handover.

### 6. Free and paid

| Part                                        | Free | Paid candidate | Why                                                                                                     |
| ------------------------------------------- | ---- | -------------- | ------------------------------------------------------------------------------------------------------- |
| Offers, the brief, the grant, gifts, guests | Yes  | —              | A gift between players is not a tool to sell; I-53 10.1 keeps private challenges free, and so does this |

## Data model / API

```
DeckHandover   id, builderId, recipientId?, deckId, offeredSnapshotId, checkReport (json, frozen),
               status: pending | accepted | declined | expired, revealAt?, linkToken? (guest), createdAt, decidedAt?
RecipientBrief id, ownerId (the recipient), sharedWith (builderId, draftDeckId)?, colourLikes[], colourAvoids[],
               styleHandles[] (max 3), budget {amount, market}?, bracketIntent?, newToMagic, avoidOracleIds[]
OwnedGrant     id, ownerId, builderId, draftDeckId, revokedAt?
```

- `POST /api/decks/[id]/handovers` (offer), `POST /api/handovers/[id]/accept`, `POST /api/handovers/[id]/decline`; expiry by the daily job.
- Accept is one Prisma transaction: the copy, its cards and zones, and the handover's status change together. A retried accept is idempotent on the handover id.
- `GET /api/handovers/[id]/owned-cards` returns `{name, owned}` pairs for the draft's names only, and 403 without a live grant.

## Non-goals

- Payment, tips, commissions, prices for the build, shipping or physical delivery ([I-33](i33-marketplace-ladder.md)'s ladder; I-44 1.1).
- Messages or free text between builder and recipient (I-38 9.1).
- A model building or completing the deck ([I-02](i02-checkable-ai-copilot.md)).
- Buying cards for the recipient ([I-56](i56-wishlists-friends-can-buy-from.md), [I-32](i32-seller-handoff-and-affiliate-carts.md)).
- A public request board ([I-109](i109-build-requests-a-brief-anyone-can-answer-with-a-list.md)).
- Ranking builders or counting gifts on profiles (I-72's "badges for activity" non-goal).
- Storing the name of a person without an account (I-35's precedent).

## Testing strategy

- **Accept (sociable):** an offer accepted creates a private deck with the same commanders, zones and cards, the credit and the frozen report; the builder's deck is unchanged; a later edit on either side does not reach the other.
- **Block (sociable):** an offer between two accounts where one blocked the other is refused with 403.
- **Grant (sociable):** the owned-cards route returns only the draft's names, and nothing after a revoke.
- **Reveal (solitary):** `isOfferVisible(handover, now)` is false before `revealAt` and true at it.
- **Idempotency:** two accepts of the same handover create one deck.
- **Red first:** each slice starts with one failing test the PR records ([`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md)). Slice 1's first Red: accepting a pending offer of a private deck returns a new deck owned by the recipient with the builder's credit, where today the fork route returns 404 for a private deck.

## Delivery slices

| #   | Slice                                                                                                                                                     | Depends on                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0   | Owner: [D-108](../owner-decisions.md#product-scope-and-non-goals) (who may send an offer; the offer lifetime; the credit's default visibility)            | — (owner)                            |
| 1   | `DeckHandover` with offer, accept, decline and expiry; the frozen check report; accept through the fork projection in one transaction; English and French | 0; I-08's fork projection            |
| 2   | `RecipientBrief`, owned by the recipient, shared per draft and revocable; the panel beside the editor                                                     | 1; I-54 slice 2 for style handles    |
| 3   | The owned-card grant for one draft                                                                                                                        | 2; I-06's owned copies               |
| 4   | Gift mode: a reveal date with the I-63 notice; the signed-out handover link with I-72's return path                                                       | 1; I-63; I-72 slice 1                |
| 5   | Exchanges: I-53 slice 8's private challenge gains a recipient draw and a price cap with exclusions; at the reveal every entry becomes a handover          | 4; I-53 slices 1 and 8; I-32 slice 2 |

No slice can start now: slice 1 waits for D-108.

## Open questions

1. **Who may address a deck to whom** (part of D-108): mutual follows only (I-44's "friends", and TableCommander's rule for collaborators), or any account by username? Recommended: mutual follows, the safer default for an audience that includes teenagers (I-38 9.1).
2. **A live link.** Does the recipient's copy keep a link to the builder's deck, so that later changes arrive as [I-20](i20-collaborative-review.md) patches the recipient accepts? Recommended: no in version 1; the copy is independent.
3. **The credit.** Is "Built for you by" visible on the recipient's public deck by default? Recommended: off by default, on by the recipient's choice.
4. **Lifetimes.** The offer lifetime (30 days proposed) and the guest-link lifetime, which also matter to I-38's retention.
5. **A child recipient.** A child under the minimum age has no account. Should the deck then stay in the builder's account under a private label, as I-51's off-platform label does? Added from the R5 note (SL5); the lawyer question is [L-08](../legal-questions.md).

## Sources

Read on 2026-11-20 unless stated otherwise. Reddit scores are Arctic Shift snapshots and can differ from live Reddit.

1. r/EDH, Arctic Shift title searches `for my girlfriend` and `for my wife`, `after=2025-01-01`: "Need help with finding a specific commander for my girlfriend!", 2026-07-31, 24 points, 63 comments, <https://www.reddit.com/r/EDH/comments/1vbf0h7/>; "Help me build a gift deck for my girlfriend", 2026-10-22, 8 / 41, <https://www.reddit.com/r/EDH/comments/1xck0v3/>; "…dog / wolves tribal deck for my wife", 2025-09-26, 22 / 53, <https://www.reddit.com/r/EDH/comments/1nrfd8w/>; "Looking to make a Wolf deck for my wife who is brand new to magic", 2025-11-09, 7 / 41, <https://www.reddit.com/r/EDH/comments/1ost9gh/>; "PLEASE HELP!! (girlfriend is bad at magic but wants to make her bf a deck)…", 2025-10-25, 14 / 17, <https://www.reddit.com/r/EDH/comments/1off8ir/>.
2. r/BudgetBrews, "The Secrets of Strixhaven Secret Santa: Flashback Edition! ($50 Budget Commander Exchange)", 2026-06-16, 10 points; "brew a complete, ready-to-play Commander deck for a fellow community member" and "between $30 and $50 USD (excluding basi[c lands and shipping])" verified on 2026-11-20 through Arctic Shift with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`. <https://www.reddit.com/r/BudgetBrews/comments/1u72wm4/>; the December 2024 edition, "r/BudgetBrews Secret Santa December 2024", r/EDH, 2024-11-13, 33 points. <https://www.reddit.com/r/EDH/comments/1gqq333/>
3. r/EDH, a playgroup's exchange, 2024-08-25, 26 points, 25 comments, <https://www.reddit.com/r/EDH/comments/1f12dsj/>; Arctic Shift `title=secret santa`, `after=2024-01-01`: 31 titles, all at 33 points or fewer.
4. EDHREC, "How to use Archidekt" guide (search summary). <https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site>
5. TableCommander, social docs. <https://tablecommander.com/docs/social>
6. Fiverr, an example "custom commander deck" gig (search summary; HTTP 403). <https://fiverr.com/chillychill69/craft-your-perfect-edh-magic-the-gathering-commander-deck>

## Feature contract (Full, 2026-11-20)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

Players build decks for partners, friends and exchange recipients. The product cannot say who a deck is for, show what that person likes, or hand the finished list to them with credit, so the builder pastes a link and the recipient re-imports it. Evidence: 56 r/EDH gift titles since 2025-01-01 and a recurring $30–$50 community exchange, read 2026-11-20 [1][2].

### Goals

- A builder starts a deck addressed to a recipient and reads the recipient's own brief beside the editor.
- The recipient receives the finished deck as a handover; accepting creates their own private, independent copy with the builder's credit and the checks it passed.
- A gift stays hidden until its reveal date; an exchange draws recipients and checks a cap with exclusions.
- With a revocable grant, the builder sees which of the draft's cards the recipient owns, and nothing else.

### Non-goals

- Payment, commissions or shipping; messages or free text; a model building the deck; buying cards; a public board (I-109); ranking builders; storing a non-member's name.

### Personas

The casual pod player, as giver and as recipient; the collector and budget player, for exchange caps and owned cards; the content creator, secondarily, for builders who publish their gift builds. See the roadmap persona table.

### User stories

#### US-108-01

As a player building a first deck for my partner who is new to Magic, I want their answers beside my editor, so that I build for them and not for me.

#### US-108-02

As a recipient, I want the finished deck to arrive in my account with the builder's name and the checks it passed, so that I don't retype a list and I know what I was given.

#### US-108-03

As a member of a $50 Secret Santa exchange, I want the deck I build to stay hidden from my recipient until the reveal and to be checked against the cap with basics excluded, so that the surprise and the rule both hold.

#### US-108-04

As a recipient, I want to let the builder see which of the draft's cards I already own, and to take that back, so that the gift does not duplicate my cards and my collection stays private.

### Acceptance criteria

#### AC-108-01 Happy path

Given a builder's deck offered to account R
When R accepts
Then R owns a new private deck with the same commanders, main deck and side zones, a "Built for you by <builder>" credit and the frozen check report; the builder's deck is unchanged, and later edits on either side do not reach the other

#### AC-108-02 Error and failure

Given the accept cannot finish
When R retries
Then exactly one copy exists after the retry, the offer's status matches it, and the message is a catalogue string

#### AC-108-03 Decline and expiry

Given a pending offer
When R declines, or 30 days pass
Then nothing is created for R, the builder sees "declined" or "expired" with no reason, and a second identical offer is not duplicated

#### AC-108-04 Guest and signed-in

Given a recipient without an account opens the handover link
When they read the list and choose "Keep this deck"
Then they read it signed out through the share projection, sign up through I-72's path, return to the accept step, and nothing identifying them was stored before sign-up

#### AC-108-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-108-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the recipient accepts or declines an offer without a pointer
Then each control has a name, the brief panel is a labelled region, and the offer's status is a word, not a colour

#### AC-108-07 Owned-card grant

Given R granted "show which of these cards I own" for one draft
When the builder opens that draft, and again after R revokes
Then each card shows owned or not owned for R, the response holds no other collection row and none of R's budget, notes or private decks, and after the revoke the next read shows nothing

#### AC-108-08 Reveal date

Given a gift with reveal date D
When R opens their offers before D
Then the deck and the offer are absent and no notice names them; at D the offer appears, with an I-63 notice if R opted in

#### AC-108-09 Block

Given either party has blocked the other (I-38 5.1)
When the builder tries to send an offer
Then the offer is refused and the recipient learns nothing

### UX flow and states

The builder chooses "Build for someone" on a new deck, picks a recipient, and sees the brief panel beside the editor once the recipient shares it. "Offer this deck" shows the check report that will be frozen. The recipient sees an "Offers" list (in-product until I-63 ships) with "Accept" and "Decline".

- Empty: "No offers yet."
- Loading: a busy state that keeps the list still.
- Error: "This offer could not be updated" with a retry; the last confirmed state is shown.
- Partial: the bracket floor reads "not yet available" until I-77 slice 1 ships.

### Data model and API

The types in [Data model / API](#data-model--api): three tables, one transaction on accept, the brief and grant private to their owner.

### Analytics and telemetry

`handover_offered {hasRevealDate, guest}`, `handover_decided {outcome: accepted | declined | expired}`, `recipient_brief_shared {}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name or URL.

### Rollout and feature flags

Signed-in only for sending; a guest may read a handover link. Behind an I-69 switch, `community.handover`, off until D-108 is answered.

### Dependencies

[I-08](i08-share-compare-and-learn.md) (fork projection; D-93 for the primer); [I-38](i38-trust-safety-and-user-rights.md) 5.1 and 9.1; [I-63](i63-one-notification-system.md) (notices; an in-product list until it ships); [I-72](i72-growth-loops-referrals-creators-and-return.md) slice 1; [I-06](i06-collection-and-purchase-planning.md); [I-54](i54-find-your-next-commander.md) slice 2; [I-96](i96-two-labelled-prices-and-no-conversion.md) and [I-32](i32-seller-handoff-and-affiliate-carts.md) slice 2; [I-77](i77-a-bracket-estimate-players-can-audit.md) slice 1; [I-53](i53-monthly-deckbuilding-challenges.md) slices 1 and 8 (slice 5 only). [I-109](i109-build-requests-a-brief-anyone-can-answer-with-a-list.md) depends on slice 1.

### Risks and mitigations

- **Unwanted offers.** Strangers send decks. Mitigation: D-108's sender rule (mutual follows recommended), the block rule, and offers that expire.
- **Collection exposure.** The grant reveals more than intended. Mitigation: one draft, card names only, revocable, and a test that the response holds no other row.
- **A gift read as a purchase.** Mitigation: no price for the build and no payment anywhere; the dated total is a check against the brief, not an invoice.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above: who may send, a live link, the credit, lifetimes and a child recipient.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-108-101 An exchange reveal

As the organiser of a pod's Secret Santa, I want every entry handed over at the reveal, so that nobody pastes links on the night.

#### AC-108-100 Happy path

Given a private challenge of six members with a recipient draw and a reveal date
When the reveal date arrives
Then each entry becomes one handover to its drawn member, and every member can replay the draw from its seed

#### AC-108-101 Failure

Given one entry is over the cap on the reveal date
When the reveal runs
Then that entry is still handed over, with "over the cap by X on <date>" in its frozen report; nothing is blocked by price alone

#### AC-108-102 Edge

Given a recipient who deleted their account before the reveal
When the reveal runs
Then that handover is cancelled, the builder keeps their deck, and no other entry is affected

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "No offers yet."                                                                                        |
| Loading          | A busy state that keeps the list still.                                                                 |
| Error            | "This offer could not be updated", with a retry.                                                        |
| Pending          | The offer with its frozen report and "Accept" and "Decline".                                            |
| Hidden gift      | Nothing before the reveal date.                                                                         |
| Guest            | The list read-only and "Keep this deck", which starts sign-up.                                          |
| Signed-in        | The Offers list and the brief editor.                                                                   |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; card names stay the printing's language.                           |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Accept, decline, share and revoke are reachable without a pointer.                                      |
| Screen reader    | The brief panel is a labelled region; owned or not owned is announced as a word.                        |
| Colour           | Status and owned marks are words and icons as well as hue, in both themes.                              |
| Success          | "Deck added to your decks", with a link.                                                                |

### Alternate paths

- The recipient never shares a brief. The builder builds without the panel; the offer works the same way.
- The builder withdraws an offer before it is decided. The offer reads "withdrawn"; nothing is created.
- The recipient switches locale mid-flow. Chrome switches; card names stay the printing's language.

### Roadmap record (2026-11-20)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-108 is a link here. The nineteenth pass's R1 note proposed it with the build-request board as two candidates; they stay two files because this one is private between known accounts and needs no moderation, while [I-109](i109-build-requests-a-brief-anyone-can-answer-with-a-list.md) is public content addressed to strangers.

## I-108: Decks Built For Someone Else: The Recipient's Brief And The Handover

**Outcome:** a builder addresses a deck to a recipient, builds it beside the recipient's own brief, and hands it over; the recipient accepts a private, independent copy with the builder's credit and the checks it passed; a gift stays hidden until its reveal date.

**Status:** Later
**Priority:** Later; slices 1 and 2 may be promoted alone. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Medium. Unwanted offers and collection exposure, answered by D-108's sender rule, the block rule and a one-draft grant.
**Depends on:** D-108 for slice 1; I-08's fork projection; I-54 slice 2 for slice 2; I-06 for slice 3; I-63 and I-72 slice 1 for slice 4; I-53 slices 1 and 8 for slice 5.

Players build gift and exchange decks: 56 r/EDH gift titles since 2025-01-01, and r/BudgetBrews' recurring $30–$50 Secret Santa. No deck site found hands a private deck to a named account with the brief it answered and the checks it passed.

### Scope

- [ ] `DeckHandover`: offer, accept, decline, expiry; a frozen check report; accept in one transaction (slice 1).
- [ ] The recipient's brief beside the editor (slice 2); the owned-card grant (slice 3).
- [ ] Later: gift mode and the signed-out link (slice 4); exchanges through I-53 slice 8 (slice 5).

### Engineering enablers

- Accept reuses the fork projection and is idempotent on the handover id.
- The owned-cards route reads the draft's names only, behind a live grant.

**Paid-tier angle:** none. Never paid.

### Enrichment (2026-11-20)

**User story.** As a player building a first deck for my partner, I want their answers beside my editor and the deck delivered to their account, so that I build for them and they keep it.

**Acceptance.**

- An accepted offer creates the recipient's own private copy with the credit and the frozen report; the builder's deck is unchanged.
- A declined or expired offer creates nothing and gives no reason.
- A gift is invisible before its reveal date.
- The owned-card grant shows only the draft's names and stops on revoke.

**UX.** "Build for someone", a brief panel beside the editor, "Offer this deck", an Offers list.

**Data and API.** `DeckHandover`, `RecipientBrief`, `OwnedGrant`; offer, accept and decline routes.

**i18n and access.** English and French; statuses as words; a labelled brief panel.

**Telemetry.** `handover_offered`, `handover_decided`, `recipient_brief_shared`. Reserved for I-39.

**Rollout.** `community.handover`, off until D-108.

**Open questions.** Who may send; a live link; the credit's default; lifetimes; a child recipient.

### Definition of done

A builder addresses a draft to a mutual follow, reads their shared brief beside the editor, sees which cards they own, and offers the deck; the recipient accepts and finds a private copy credited "Built for you by …" with the frozen checks, while a second recipient sees a gift only on its reveal date.

---
