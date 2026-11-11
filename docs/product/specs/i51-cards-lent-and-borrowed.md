# I-51: Cards Lent And Borrowed Within The Pod

> **Initiative:** I-51, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later. Slices 1 to 6 are private records that involve no second account and depend on no other initiative, so they could be promoted alone · **Written 2026-11-10**
> **Research:** one dated note on player posts, collection apps and the GDPR household exemption. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** loans of collection copies and of whole decks, borrowed copies and how they count in a deck, due dates and opt-in reminders, return history, what the borrower sees, and the household: accounts that share one physical collection while each keeps its own ownership. **Does not own:** ownership quantities, printings, proxies and the acquisition plan ([I-06](i06-collection-and-purchase-planning.md)); free copies and the commitment index ([I-16](i16-decks-buildable-from-a-collection.md)); storage places and pull lists ([I-43](i43-physical-collection-storage-and-pull-lists.md)); have and want lists and trade proposals ([I-44](i44-trade-lists-within-the-pod.md)); spare copies ([I-45](i45-selling-spare-cards.md)); pods ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)) and their chat surfaces ([I-23](i23-the-pods-own-surface.md), [I-46](i46-discord-and-chat-integrations.md)); blocking, export and account deletion ([I-38](i38-trust-safety-and-user-rights.md)); plans and billing ([I-30](i30-business-model-and-paid-tier.md)); collection import ([I-26](i26-collections-arriving-from-elsewhere.md)).

## Overview

Commander players lend cards and whole decks to the people they play with. A friend forgets his decks and borrows one for the night [3]. A player keeps a loaner deck for newcomers [4]. Another borrows 38 cards to build an Urza deck and asks how to tell them apart from his own [1]. The answers are slips of paper in sleeves, photos sent by text, and a ManaBox binder or a Moxfield sideboard named after the lender [1]. One player wrote his loans on a whiteboard by the door. It was rubbed off, and the friends he had lent to "didn't remember couldn't find them" [1].

The deckbuilder is the right place for this record, because the loan changes what the player can build. A copy lent to Alex is owned but not in the house: it should not count as available for a new deck. A copy borrowed from Alex can sit in a deck tonight, but it is not owned: it should not hide a purchase. One reply in [1] keeps borrowed cards as an "incomplete deck" in ManaBox for exactly that reason.

This spec adds a loan record on a collection copy or a whole deck, with a date, an expected return and a return history. The borrower is a friend's account, who sees and accepts the loan, or a private label for someone off the platform. Borrowed copies count toward a deck and are flagged. A household lets two to six accounts see one physical collection while each copy keeps its owner. Reminders are opt-in. No money, messages or ratings are involved.

## What the market does

Read on 2026-11-10 unless dated otherwise. Reddit threads were read through the [Arctic Shift archive](https://arctic-shift.photon-reddit.com/), because Reddit refuses automated reads; scores are as archived. App Store data comes from Apple's iTunes lookup API and the store pages.

| Product                                   | Loans                                                                                                                                                                              | Other people                                                                     | Price                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **MTG Trades** (iOS, since 2013) [7]      | "Track cards you have lent out or borrowed from other people"                                                                                                                      | Not described                                                                    | Free app; Premium $0.99/month or $6.99/year, which the page attaches to other features, not to loans |
| **Deckhowler** (iOS, since 2025-01) [8]   | "A Loans hub with due-date reminders for cards you've lent or borrowed". Loaned copies are split off into their own collection entries                                             | Not described                                                                    | Loans are listed under Premium: $1.99/month or $17.99/year. 0 US ratings                             |
| **EchoMTG** [9]                           | None on the plans page                                                                                                                                                             | "Multi-user access" only on the Local Game Store plan                            | LGS plan $25/month                                                                                   |
| **Dragon Shield** 8.2.1 (2026-11-05) [10] | None                                                                                                                                                                               | "View your friends' collection, decks, wish and trade list"                      | —                                                                                                    |
| **Decksmith** 1.7 (2026-11-08) [12]       | None                                                                                                                                                                               | "Search your friends' collections for your wishlist and see who owns which card" | —                                                                                                    |
| **ManaBox** 4.3.0 (2026-11-03) [11]       | None. Players make a binder named "borrowed from xy" [1]                                                                                                                           | Shares decks and cards with friends                                              | —                                                                                                    |
| **Moxfield**, **Archidekt**               | None found. Players put borrowed cards in a sideboard, a custom group or a category [1]. Archidekt's feature-voting page lists no lending request among those shown [14]           | —                                                                                | Their own collection pages were not read                                                             |
| **Deckbox** [6]                           | None. A 2010 request for loans got no staff answer. A community admin tracked loans by "creating new decks with who I loaned what cards to", which "comes up short in a few areas" | —                                                                                | —                                                                                                    |
| **TCGplayer** 5.5.0, **Delver** 1.25 [13] | None in the store descriptions                                                                                                                                                     | —                                                                                | —                                                                                                    |

**What players do.** In the thread on borrowed cards [1] (2025-12-31, 18 points, 43 comments), the top reply (125 points) puts a scrap of paper in each sleeve or keeps a checklist in the deck box. Others photograph the cards and text the photo to the lender (38 points), make an app binder or deck named after the lender (27 points), or mark inner sleeves. One reply says the two players "wound up combining collections". The loans outlive memory: one player received, for his 40th birthday, 169 cards he had lent his brother 25 years earlier (r/mtgfinance, 114 points) [5]. Lending a whole deck is ordinary: the premise of an r/EDH post with 795 points is a friend who forgot his decks [3], and players discuss loaner decks for new players [4] and the wear lent decks suffer [2].

**Demand evidence: weak to medium.** Many independent workarounds and a 15-year-old request [6] show a real habit. No post asking for a better method scored above 18 points, and the one loss story found scored 1 point [1]. Nothing measured how often loans go wrong.

**The gap.** Two small iOS apps record loans [7][8], and one sells them [8]. Neither describes a borrower who sees the loan, a whole deck lent with a return checklist, or a shared household collection. No deckbuilder read lets a loan change what a deck counts as owned.

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Ownership has no possession state.** `CollectionCard` in `prisma/schema.prisma` holds `scryfallId`, `name`, `quantity`, `foil`, `condition`, `acquiredAt`, `price` and `imageUri`, unique on `(scryfallId, foil, userId)`, and cascades with its user. Nothing records that a copy is out of the house or held by someone else.
- **Three routes change quantities.** `POST /api/collection` adds to a row or creates it. `PATCH /api/collection/[id]` accepts a quantity down to 0, deletes the row at 0, and merges two rows on a printing swap (`handlePrintingSwap`). `DELETE /api/collection/[id]` removes a row. None of them could protect a lent copy. `GET /api/collection/usage` and `PrintingDeckUsage.tsx` list the decks that use one printing; "Lent" and "Borrowed" belong beside them.
- **Every deck sees every copy.** `getDeckCardStatuses` in `src/lib/collection/shopping-list.ts` resolves each deck card as `owned`, `proxy` or `missing` against a map of quantities. Its only caller, `summarizeDeckCollection`, is used by `CollectionStatsPanel.tsx`, which passes no proxy map. A borrowed or lent state has no place in it.
- **A loan can only be a note today.** `DeckCard.notes` is free text private to the owner. The repository's own fixtures use `"borrowed from Alex — give back"` as an owner-only note that the share view must not leak (`src/app/api/share/route.test.ts`, `src/app/api/deck/[id]/route.test.ts`). Such a note has no date or counterpart, is not tied to a collection row, and changes no count.
- **No second person exists in the model.** There is no `Pod`, `Household`, friend or block model. `UserFollow` stores directed follows, so a mutual follow can be derived but is never computed. `UserBlock` is I-38 slice 12, not yet built.
- **A snapshot dies with its deck.** `DeckSnapshot` stores `cardList` as JSON and cascades when the deck is deleted. A whole-deck loan therefore needs its own frozen copy of the list.
- **A safe projection exists.** `SHARED_DECK_SELECT` in `src/lib/deck/shared-deck-select.ts` lists the deck and card columns a share-link holder may read; owner notes, folder, tags and the owner's identity are left out. It is the model for what a borrower sees.
- **Nothing delivers a reminder.** `NotificationPreference` stores four toggles, read only by its settings route and panel. `package.json` has no email library, and no scheduled route exists.

## Functional requirements

### 1. Lending copies

1.1 A player marks _n_ copies of one or more collection rows as lent to one borrower. The loan records the lent date (today by default) and an optional expected return date. The borrower is a linked account (group 4) or a private label.
1.2 Lent copies stay owned. `CollectionCard.quantity` does not change. For each row, the copies out on open loans never exceed the quantity; one write module enforces this with the row locked, in the same transaction as each loan change.
1.3 A quantity decrease or a row deletion that would leave fewer copies than are out is refused with the open loans named. The page offers to close those copies first (requirement 6.2). A printing-swap merge moves loan items to the surviving row.
1.4 **Where is it?** Each owned printing shows, beside "Used in decks", every open loan: count, borrower, lent date and due date. A list of lent cards can be filtered by borrower, so "what does Alex have?" is one view.
1.5 A label holds at most 40 characters, with the hint "a first name or nickname", and no contact fields. Only its author sees it; labels are never matched across accounts. Labels can be reused, renamed or cleared ("someone"). A private note of at most 200 characters is never shown to the borrower.

### 2. Lending a whole deck

2.1 **Lend this deck** creates one loan holding a frozen copy of the deck's list (main zone, commander, partner, in the `DeckSnapshot.cardList` shape) and a loan item for each copy the lender's collection covers, counted as `getDeckCardStatuses` counts. A preview shows the cards that are proxies or missing; they are in the frozen list but are not collection items.
2.2 A card the lender only borrowed, or a household copy owned by someone else, is not lent onward. The preview lists it with its owner so the lender can say so.
2.3 A deck has at most one open whole-deck loan. Its page shows "Lent to … since …, due …". Editing stays allowed; a banner says the return checklist uses the list as lent. Deleting the deck keeps the loan and its frozen list.
2.4 **Return checklist:** every card of the frozen list, grouped as in the deck. "All back" closes the loan in one action; unticked cards stay open on it.
2.5 _Added 2026-11-11:_ **Lend this set** creates one whole-deck loan (2.1) per chosen seat of an [I-79](i79-table-sets.md) table set in one action, with one combined return checklist. Lent copies are unavailable to the set's copy check (I-79 slice 3).

### 3. Borrowed copies

3.1 A player records cards borrowed from a private label: card and printing (or pasted text in the deck text format), quantity, date and expected return. Loans that a linked lender records and the player accepts (group 4) appear in the same list. The borrower may assign a loan to one of their decks; only the borrower sees that.
3.2 Borrowed copies never enter `CollectionCard`. They never change ownership, collection value, the acquisition plan's owned count, I-44 have lists or I-45 spare copies.
3.3 **In a deck, borrowed counts and is flagged.** Each card resolves in this order: own copies not lent; household copies (group 7); borrowed copies assigned to this deck, then unassigned ones; proxies; missing. A borrowed copy shows the status "borrowed" with the lender and due date, and an overdue one says so. The deck's completion shows owned, household, borrowed and proxy copies separately.
3.4 The acquisition plan does not count borrowed copies as owned. A printing covered only by a borrowed copy shows "borrowed until …", so the player decides whether to buy it, proxy it or give it back.

### 4. Loans between two accounts

4.1 A linked borrower must be a mutual follow (I-44's "friends"), a member of the same household or, once I-15 pods have members, of the same pod. The picker searches only those. Blocked pairs ([I-38 5.1](i38-trust-safety-and-user-rights.md#5-blocking-and-comment-controls)) never appear. Only the lender records a loan between two accounts, because the lender owns the copies; a borrower whose lender has not recorded it uses a private label.
4.2 The borrower first sees a pending loan: the lender's username, the cards or the deck name, and the dates. Accept or decline. A pending loan expires after 14 days (proposed). Declining or expiry removes the link; the lender's record stays, and the lender is asked for a label.
4.3 After acceptance only the lender changes items, dates or status. The borrower can record "I gave these back" with a date, assign the loan to a deck, set their own reminders, and detach.
4.4 **Disputes are shown, not settled.** A return claim the lender has not confirmed shows on both sides as "returned on … according to @borrower; not confirmed by @lender". No one else sees it, and it never becomes a rating.
4.5 Either side can detach at any time. The borrower's view disappears; the lender's record stays with a label. Blocking detaches every loan between the two in the same transaction.
4.6 No typed text crosses accounts. The borrower sees card data, usernames, dates and states; labels and notes stay with their author. This keeps I-38's "no private messages" default and I-44's rule 2.5.

### 5. What the borrower sees

5.1 A **Borrowed** list: lender, cards and quantities, lent and due dates, state, and any return claim.
5.2 For a whole-deck loan, a read-only view of the frozen list through the columns of `SHARED_DECK_SELECT`: no owner notes, folder, tags, prices, collection data or other decks. Access ends when the loan closes or either side detaches. The borrower cannot copy a lent private deck into their own decks; public decks keep their fork button.

### 6. Returns and history

6.1 The lender records a return, partial or full. Each return is a dated row: which copies came back and who recorded it.
6.2 A loan closes as **returned**, **given** or **lost**. "Given" and "lost" offer to reduce the lender's quantity; nothing changes until the lender confirms.
6.3 Closed loans stay in the lender's history, filterable by borrower and by card, until the lender deletes them; deleting a loan entered by mistake removes its history. A linked borrower keeps the history of accepted loans until either side detaches.

### 7. Household

7.1 A household groups two to six accounts that share one physical collection. One account creates it and invites mutual follows; each joins by explicit acceptance, and leaving takes effect at once. An account belongs to at most one household. Blocked pairs cannot invite each other.
7.2 Each member's collection rows stay theirs. The household view lists every member's rows with the owner of each copy, never the purchase `price` or `acquiredAt`, and never decks a member has not shared. In a member's deck, household copies count after the member's own copies, with the status "household" and the owner's username (3.3).
7.3 Members may record loans between themselves to mark a copy as in someone's deck box. These need no acceptance; all other rules of group 4 apply. After a member leaves, their rows leave the view on the next read, and open loans with them stay as ordinary linked loans.

### 8. Reminders

8.1 Reminders are off by default ([I-38 9.1](i38-trust-safety-and-user-rights.md#9-minors)). Each party turns them on for themselves, per loan or as a default. A **Due** view lists loans due within 7 days and overdue loans. It is computed when the player opens it, against the player's local date. A count appears on the collection page only for a player who turned reminders on.
8.2 Email reminders wait for [I-63](i63-one-notification-system.md) slice 9 (the sender was I-38 slice 13): at most two per loan (the due date and 7 days after), sent only to a party who opted in. A lender cannot nudge the borrower, and there are no streaks or leaderboards.

### 9. With the neighbouring initiatives

9.1 **I-06:** the acquisition plan counts lent copies as owned, flagged "lent to … until …", so a lent card is never bought twice by accident. **I-16:** free-cards mode treats lent copies as unavailable, and a coverage rank never counts borrowed copies as owned.
9.2 **I-43:** lending takes copies out of their place (Unplaced first, else the player picks) with a move reason `lent`; a return proposes the place they came from. The invariant becomes placed copies plus copies out ≤ quantity, in I-43's single write module. Pull lists show lent copies as "lent to …" and never pull them.
9.3 **I-44 and I-45:** have lists and spare copies exclude lent copies. "Apply to my collection" refuses to give away a copy that is out.
9.4 **I-38:** loans, labels and household membership are in the full export and are deleted with the account. A deleted borrower's link becomes the label "deleted account" on the lender's record. No I-23 or I-46 chat command reads loans.

### 10. Free and paid

| Part                                                                                                                                                 | Free                                  | Paid hypothesis (I-30 decides) | Why                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lent and borrowed records, whole-deck loans, the checklist, history, linked loans, the borrower view, the in-app Due view                            | Yes                                   | —                              | The player's own data is never the lever ([I-30 1.2](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)); MTG Trades gives loan tracking away [7]; consent and blocking stay free (I-38 10.1); the Due view is computed on read at no running cost |
| The household and its view                                                                                                                           | Yes                                   | Pricing only                   | Sharing one's own cards is own data. A subscription covering every member is a plan question for I-30; EchoMTG sells multi-user access only at $25/month [9]                                                                                                  |
| Email reminders                                                                                                                                      | —                                     | Paid                           | A scheduled per-user job with a sender to pay for ([I-30 1.3](i30-business-model-and-paid-tier.md#1-the-free-and-paid-line)). Deckhowler sells due-date reminders in Premium [8]; weak evidence, 0 US ratings                                                 |
| **Borrow plan** in I-43's game-night planner: for the night's decks, which copies come from household members and which lent copies are not back yet | Per-deck "household" and "lent" marks | Paid                           | It computes across decks, members and loans (I-30 1.3), and extends a tool I-43 already proposes as paid. No product read offers it                                                                                                                           |

10.1 Why free incumbents skip loans: their collections hold one state, owned or not, with binders as the only container, so players fake a loan with a binder or deck named after the borrower [1][6]. Possession beside ownership, with a counterpart, is a second model they have not built. This is an inference from their pages, not their stated reason. I-30 should not plan revenue on this initiative: its value is moving the record players keep on paper to where they build.

## Data model / API

```
CardLoan        id, recorderId (User, Cascade), direction (lent | borrowed),
                counterpartUserId? (User, SetNull), counterpartLabel? (≤ 40, recorder only),
                linkState (none | pending | accepted), linkExpiresAt?, borrowerDeckId? (Deck, SetNull; set by the borrower only),
                kind (cards | deck), deckId? (Deck, SetNull), deckName?, deckList Json?,
                lentOn (date), dueOn? (date), note? (≤ 200, recorder only),
                remindRecorder, remindCounterpart, returnClaimedOn?,
                status (open | closed), closeReason? (returned | given | lost), closedOn?, householdId? (SetNull),
                createdAt, updatedAt — index (recorderId, status); index (counterpartUserId, linkState)
CardLoanItem    id, loanId (Cascade), collectionCardId? (CollectionCard, SetNull; lent only; 1.3 refuses deletion while out),
                scryfallId, name, foil, quantity (> 0), returnedQuantity (0 … quantity) — index (collectionCardId)
CardLoanReturn  id, loanId (Cascade), itemId (Cascade), quantity, returnedOn, recordedById?, createdAt
Household       id, createdAt
HouseholdMember householdId (Cascade), userId (unique; Cascade), state (invited | active), invitedById?, joinedAt? — key (householdId, userId)
```

A borrower's copies are the loans they recorded as `borrowed` plus the `lent` loans naming them with `linkState = accepted`, so no loan is stored twice. A schema test fails if a column another account can read holds typed text. `GET /api/collection/usage` also returns open loans for the printing. `PATCH` and `DELETE /api/collection/[id]` answer 409 when copies out would exceed the new quantity.

| Area      | Routes                                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loans     | `GET`/`POST /api/loans`; `GET /api/loans/due`; `PATCH`/`DELETE /api/loans/[id]`; `POST /api/loans/[id]/returns`; `POST /api/loans/[id]/close`; `POST /api/loans/[id]/respond` (accept, decline, detach, claim, deck) |
| Decks     | `POST /api/decks/[id]/lend` (`preview` or `commit`); `GET /api/loans/[id]/deck` (borrower, allowlisted)                                                                                                              |
| Household | `POST /api/households`; `POST /api/households/[id]/invitations`; `POST /api/households/invitations/[id]/respond`; `DELETE /api/households/[id]/members/me`; `GET /api/households/[id]/collection?cursor=`            |

## Non-goals

- Money in any form: deposits, rental or late fees, collateral or insurance claims. A fee turns a loan into a transaction, which is a change for [I-33's decision log](i33-marketplace-ladder.md#6-decision-log).
- Messages, free text between accounts, nudges from the lender, ratings of borrowers, badges or public lists of who owes whom.
- Lending to strangers, stores or nearby players, and broadcast requests to borrow. Wants belong to I-44.
- Photos of lent cards, serial numbers or any identity per physical copy. Hosting uploads would add moderation (I-38).
- Treating the record as proof. The product records what the players entered and says so; it never arbitrates.
- Store loaner decks ([I-41](i41-store-commander-nights.md)) and places shared between accounts (still an I-43 non-goal).

## Testing strategy

Write the failing test first, as the [TDD contract](../../engineering/tdd-with-ai.md) requires.

- **Status order (solitary):** the resolution order of 3.3 in the extended `getDeckCardStatuses`, with lent copies removed from the owner's count and assigned borrowed copies used before unassigned ones.
- **Invariant (sociable, PostgreSQL):** two concurrent loans of a row's last copy let exactly one through; a quantity decrease or deletion under the copies out answers 409; a printing merge moves loan items.
- **Consent:** a pending loan shows the borrower nothing beyond 4.2; decline and expiry remove the link; a blocked pair cannot be linked; blocking detaches.
- **Allowlist:** the borrower's deck payload passes the share route's secret list (owner id, folder, notes such as `"borrowed from Alex"`); labels and lender notes never appear in a response to another account.
- **Household:** no row is visible before acceptance; `price` and `acquiredAt` never appear; leaving removes rows on the next read.
- **Deletion and export:** account deletion turns a counterpart link into "deleted account" in one transaction; the export holds loans, returns and membership.
- **Due view, locales and phone:** boundaries at 7 days and at the due date, and no count for a player with reminders off; every string in English and French; the lend and return journeys at phone width.

## Delivery slices

| #   | Slice                                                                                                                                                        | Depends on                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | Schema and migration for `CardLoan`, `CardLoanItem` and `CardLoanReturn`; one write module with the invariant; 409 and merge in the collection routes. No UI | —                                               |
| 2   | Lend copies to a label: create, list, filter by borrower, due date, returns, close, history; "Lent" beside "Used in decks"                                   | 1                                               |
| 3   | Lent copies unavailable in the lender's deck status; "lent" flag in the acquisition plan                                                                     | 2                                               |
| 4   | Borrowed from a label: record, assign to a deck, "borrowed" status and completion split, acquisition-plan flag                                               | 1                                               |
| 5   | Whole-deck loan: frozen list, preview, banner, return checklist                                                                                              | 2                                               |
| 6   | Due view with opt-in reminders, computed on read                                                                                                             | 2                                               |
| 7   | Linked loans between mutual follows: pending, accept, decline, expiry, detach, return claim, the Borrowed list, "deleted account" label                      | 2, 4; I-38 slice 12                             |
| 8   | Borrower's read-only view of a lent deck through `SHARED_DECK_SELECT`                                                                                        | 5, 7                                            |
| 9   | Household schema, invitations, membership, household view, "household" status in decks                                                                       | 4; I-38 slice 12                                |
| 10  | Loans between household members without acceptance                                                                                                           | 7, 9                                            |
| 11  | Pod members as borrowers                                                                                                                                     | 7; I-15 slice 3 and the pod-membership decision |
| 12  | Loans and returns in the full export; household membership once slice 9 ships                                                                                | 2; I-38 slice 4                                 |
| 13  | I-16 free-cards mode excludes lent copies                                                                                                                    | 3; I-16 slice 4                                 |
| 14  | I-43 integration: `lent` and `returned` moves, the joint invariant, pull lists                                                                               | 3; I-43 slice 5                                 |
| 15  | I-44 have lists exclude lent copies; "apply to my collection" refuses a copy that is out                                                                     | 3; I-44 slice 2                                 |
| 16  | I-45 spare copies exclude lent copies                                                                                                                        | 3; I-45 slice 1                                 |
| 17  | Email reminders                                                                                                                                              | 6; I-63 slice 9; I-30 slices 0 and 11 if paid   |
| 18  | Paid candidate: the borrow plan in I-43's game-night planner                                                                                                 | 10, 14; I-43 slice 13; I-30 slices 0 and 11     |

Slices 1 to 6 involve no other account and could ship alone. Slice 1 carries the loan schema; slice 9 adds the household tables. Scheduled agents must not pick slice 7 before I-38's block exists, or slices 17 and 18 before I-30's slice 0 answers are committed.

## Open questions

1. **Lawyer questions** (research, not legal advice), for [I-30 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate): Recital 18 exempts processing by a person "in the course of a purely personal or household activity", but "this Regulation applies to controllers or processors which provide the means for processing personal data" [15]. Does a private 40-character label for an off-platform borrower make MagicAIBuilder a controller of that person's data, owing them information? [I-35](i35-pod-game-log.md) refuses names of non-users for the same reason. Is the hint in 1.5 enough, should labels on closed loans expire, or should only "someone" plus a private note be allowed?
2. **Is the demand enough?** The evidence is weak to medium. The proposal: ship slices 1 to 4 when collection features are next touched, and measure through [I-39](i39-first-run-activation-and-measurement.md)'s events the share of active collection users who record a loan within 60 days before building slices 7 and later.
3. **Who decides a return?** This spec lets the lender's record decide and shows the borrower's claim beside it (4.4). Is one-sided authority acceptable, or should a linked loan close only when both agree?
4. **Is the household the right unit?** One household per account and six members are guesses. A player who shares with a partner and lends to a sibling is covered by loans; one who shares two collections is not. The household also reopens I-43's non-goal of places shared between accounts. Should borrowed copies also sit behind a "count borrowed copies" toggle, so a player can see what a deck needs once the loans end?

## Sources

Read on 2026-11-10 unless stated otherwise. Reddit scores and comment counts are as archived by [Arctic Shift](https://arctic-shift.photon-reddit.com/). App Store versions and dates come from the iTunes lookup API. Legal sources are research, not legal advice.

1. r/EDH, "How do you differentiate borrowed cards?", 2025-12-31, 18 points, 43 comments, including the replies quoted (2025-12-31 to 2026-01-01). <https://www.reddit.com/r/EDH/comments/1q0c3oc/>
2. r/EDH, "How do you deal with lending decks to other people?", 2026-03-26, 0 points, 24 comments. <https://www.reddit.com/r/EDH/comments/1s4jdbr/>
3. r/EDH, "I let someone borrow my favorite deck and realized I've been lying to myself about how simple it is", 2026-10-21, 795 points, 200 comments. <https://www.reddit.com/r/EDH/comments/1xbwv2g/>
4. r/EDH, "Here's the deck I loan out to friends who have never played before", 2026-06-18, 0 points, 22 comments <https://www.reddit.com/r/EDH/comments/1u99aza/>; "Teaching A Friend, Which Deck Do I Loan?", 2025-08-13, 0 points, 14 comments <https://www.reddit.com/r/EDH/comments/1mp8cc7/>
5. r/mtgfinance, "For my 40th, my brother gifted me decks I lent him 25 years ago", 2025-06-09, 114 points, 9 comments. <https://www.reddit.com/r/mtgfinance/comments/1l6st35/>
6. Deckbox forum, "[Request] Loan\Lent", posts of 2010-12-21 and 2010-12-25. <https://deckbox.org/forum/viewtopic.php?id=516>
7. MTG Trades, App Store listing: first release 2013-11-10, version 3.3 of 2026-11-06, 1,146 ratings; Premium $0.99/month or $6.99/year. <https://apps.apple.com/us/app/mtg-trades/id736701892>
8. Deckhowler, App Store listing: first release 2025-01-28, version 2.4.4 of 2026-09-26, 0 US ratings; Premium $1.99/month or $17.99/year. <https://apps.apple.com/us/app/deckhowler/id6740892169>
9. EchoMTG, plans page. <https://www.echomtg.com/plans/>
10. MTG Scanner – Dragon Shield, App Store listing, version 8.2.1 of 2026-11-05. <https://apps.apple.com/us/app/id1460657155>
11. ManaBox, App Store listing, version 4.3.0 of 2026-11-03. <https://apps.apple.com/us/app/id1460407674>
12. Decksmith, App Store listing, version 1.7 of 2026-11-08. <https://apps.apple.com/us/app/decksmith/id6756268708>
13. TCGplayer, App Store listing, version 5.5.0 of 2026-11-04 <https://apps.apple.com/us/app/id1247645833>; MTG Delver TCG Scanner, version 1.25 of 2026-10-16 <https://apps.apple.com/app/id6504142186>
14. Archidekt, feature voting page. <https://archidekt.com/features>
15. GDPR Recital 18, "Non-application to personal or household activities". <https://gdpr-info.eu/recitals/no-18/>

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

### Goals

- A player lends a deck to a friend, sees the lent copies drop out of what a new deck can use and ticks the cards off as they come back, and the friend sees the loan and its due date; a borrowed card fills a deck without ever counting as owned, and no typed text crosses accounts.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-51-01

As a player, I want a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner., so that this initiative's definition of done is met.

#### US-51-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-51-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-51-01 Happy path

Given a signed-in player and the English locale
When a player lends a deck to a friend, sees the lent copies drop out of what a new deck can use and ticks the cards off as they come back, and the friend sees the loan and its due date; a borrowed card fills a deck without ever counting as owned, and no typed text crosses accounts.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-51-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-51-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-51-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-51-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-51-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-51-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- https://www.reddit.com/r/EDH/comments/1q0c3oc/
- https://apps.apple.com/us/app/mtg-trades/id736701892
- https://apps.apple.com/us/app/deckhowler/id6740892169
- https://deckbox.org/forum/viewtopic.php?id=516

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-51-101

As a player, I want the product to a loan schema (CardLoan, CardLoanItem, CardLoanReturn) and one write module that keeps the copies out on open loans at or below a row's quantity, under a row lock (slice 1)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A loan schema (CardLoan, CardLoanItem, CardLoanReturn) and one write module that keeps the copies out on open loans at or below a row's quantity, under a row lock (slice 1). The collection routes answer 409 when a decrease or a deletion would leave fewer copies than are out, and a printing-swap merge moves the loan items. Today CollectionCard (prisma/schema.prisma) has no possession state, and POST /api/collection, PATCH /api/collection/[id] and DELETE /api/collection/[id] change quantities with nothing to protect. A loan can only be an owner-only card note, with no date or counterpart, that changes no count.

#### AC-51-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-102 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-51-102

As a player, I want the product to lend copies to a private label, with due dates, returns, closing as returned, given or lost, a history, and "Lent" beside "Used in decks" (slice 2)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Lend copies to a private label, with due dates, returns, closing as returned, given or lost, a history, and "Lent" beside "Used in decks" (slice 2).

#### AC-51-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-51-103

As a player, I want the product to lent copies unavailable in the lender's deck status and flagged in the acquisition plan; borrowed copies recorded from a label, assigned to a deck, shown as "borrowed" and never counted as owned (slices 3–4)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Lent copies unavailable in the lender's deck status and flagged in the acquisition plan; borrowed copies recorded from a label, assigned to a deck, shown as "borrowed" and never counted as owned (slices 3–4). Today getDeckCardStatuses (src/lib/collection/shopping-list.ts) knows only owned, proxy and missing.

#### AC-51-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-108 Edge

Given a card the player marked as a proxy
When ownership and the deck total are shown
Then the card is labelled proxy and is not counted as a physical copy the player owns

#### US-51-104

As a player, I want the product to lend a whole deck: a frozen list that survives the deck's deletion, a preview of proxies and missing cards, a banner and a return checklist (slice 5)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Lend a whole deck: a frozen list that survives the deck's deletion, a preview of proxies and missing cards, a banner and a return checklist (slice 5). DeckSnapshot cascades with its deck, so the loan keeps its own copy of the list.

#### AC-51-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-51-105

As a player, I want the product to a Due view computed on read, with reminders off by default (slice 6)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A Due view computed on read, with reminders off by default (slice 6).

#### AC-51-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-51-106

As a player, I want the product to loans between mutual follows: pending, accept, decline, a 14-day expiry, detach, and a return claim shown on both sides until the lender confirms it; then the borrower's read-only view of a lent deck through SHARED_DECK_SELECT (slices 7–8)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Loans between mutual follows: pending, accept, decline, a 14-day expiry, detach, and a return claim shown on both sides until the lender confirms it; then the borrower's read-only view of a lent deck through SHARED_DECK_SELECT (slices 7–8). No typed text crosses accounts.

#### AC-51-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-51-107

As a player, I want the product to a household of two to six accounts that see one physical collection, with each copy's owner and never its purchase price; loans inside it need no acceptance; then pod members as borrowers (slices 9–11)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A household of two to six accounts that see one physical collection, with each copy's owner and never its purchase price; loans inside it need no acceptance; then pod members as borrowers (slices 9–11).

#### AC-51-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-120 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-51-108

As a player, I want the product to loans in the full export, and lent copies excluded from I-16's free cards, I-43's pull lists, I-44's have lists and I-45's spare copies (slices 12–16)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Loans in the full export, and lent copies excluded from I-16's free cards, I-43's pull lists, I-44's have lists and I-45's spare copies (slices 12–16).

#### AC-51-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-51-109

As a player, I want the product to after I-63's email (slice 9) and I-30's decision: e-mail reminders, and the borrow plan in I-43's game-night planner (slices 17–18)., so that a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

#### AC-51-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After I-63's email (slice 9) and I-30's decision: e-mail reminders, and the borrow plan in I-43's game-night planner (slices 17–18).

#### AC-51-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-51-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

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

## I-51: Cards Lent And Borrowed Within The Pod

**Spec:** [`specs/i51-cards-lent-and-borrowed.md`](i51-cards-lent-and-borrowed.md)

**Outcome:** a player records the cards and whole decks lent to or borrowed from friends, with dates, a return checklist and a history. A lent copy stays owned but is not available to a new deck, and a borrowed copy fills a deck tonight without hiding a purchase. A household shares one physical collection while each copy keeps its owner.

**Status:** Later
**Priority:** Later. Slices 1 to 6 are private records that involve no second account and depend on no other initiative, so they could be promoted alone
**Impact / effort:** Low to medium / medium
**Depends on:** nothing for slices 1–6; I-38 slice 12's block before loans between accounts (slice 7) and the household (slice 9); I-38 slice 4 for the export; I-15 slice 3 for pod borrowers; I-16, I-43, I-44 and I-45 for their integrations; I-63 slice 9 (the sender was I-38 slice 13) and I-30 for e-mail reminders, and I-30 for the borrow plan.

Commander players lend cards and whole decks to the people they play with. They record it on a slip of paper in each sleeve, in a photo sent by text, or in a ManaBox binder or a Moxfield sideboard named after the lender ([r/EDH, 2025-12-31](https://www.reddit.com/r/EDH/comments/1q0c3oc/)). The deckbuilder is the right place for that record, because a loan changes what a deck counts as owned. Two small iOS apps record loans: MTG Trades gives it away ([App Store](https://apps.apple.com/us/app/mtg-trades/id736701892)), and Deckhowler sells due-date reminders in its Premium plan ([App Store](https://apps.apple.com/us/app/deckhowler/id6740892169)). Neither describes a borrower who sees the loan, a whole deck lent with a return checklist, or a shared household collection, and no deckbuilder read lets a loan change what a deck counts as owned. The demand evidence is weak to medium: many independent workarounds and a 2010 request on Deckbox that got no staff answer ([forum](https://deckbox.org/forum/viewtopic.php?id=516)), but no post asking for a better method scored above 18 points. No money, messages or ratings are involved.

### Scope

- [ ] A loan schema (`CardLoan`, `CardLoanItem`, `CardLoanReturn`) and one write module that keeps the copies out on open loans at or below a row's quantity, under a row lock (slice 1). The collection routes answer 409 when a decrease or a deletion would leave fewer copies than are out, and a printing-swap merge moves the loan items. Today `CollectionCard` (`prisma/schema.prisma`) has no possession state, and `POST /api/collection`, `PATCH /api/collection/[id]` and `DELETE /api/collection/[id]` change quantities with nothing to protect. A loan can only be an owner-only card note, with no date or counterpart, that changes no count.
- [ ] Lend copies to a private label, with due dates, returns, closing as returned, given or lost, a history, and "Lent" beside "Used in decks" (slice 2).
- [ ] Lent copies unavailable in the lender's deck status and flagged in the acquisition plan; borrowed copies recorded from a label, assigned to a deck, shown as "borrowed" and never counted as owned (slices 3–4). Today `getDeckCardStatuses` (`src/lib/collection/shopping-list.ts`) knows only owned, proxy and missing.
- [ ] Lend a whole deck: a frozen list that survives the deck's deletion, a preview of proxies and missing cards, a banner and a return checklist (slice 5). `DeckSnapshot` cascades with its deck, so the loan keeps its own copy of the list.
- [ ] A Due view computed on read, with reminders off by default (slice 6).
- [ ] Loans between mutual follows: pending, accept, decline, a 14-day expiry, detach, and a return claim shown on both sides until the lender confirms it; then the borrower's read-only view of a lent deck through `SHARED_DECK_SELECT` (slices 7–8). No typed text crosses accounts.
- [ ] A household of two to six accounts that see one physical collection, with each copy's owner and never its purchase price; loans inside it need no acceptance; then pod members as borrowers (slices 9–11).
- [ ] Loans in the full export, and lent copies excluded from I-16's free cards, I-43's pull lists, I-44's have lists and I-45's spare copies (slices 12–16).
- [ ] After I-63's email (slice 9) and I-30's decision: e-mail reminders, and the borrow plan in I-43's game-night planner (slices 17–18).
  - Reminders reach players through [I-63](i63-one-notification-system.md)'s "Loans" category, off by default. I-63 proposes that email delivery is never paid, against this spec's paid hypothesis for e-mail reminders; I-30 decides (status note).

### Engineering enablers

- Two concurrent loans of a row's last copy let exactly one through, on PostgreSQL.
- A schema test fails when a column another account can read holds typed text, and labels and lender notes never appear in a response to another account.
- The borrower's deck payload passes the share route's secret list, owner notes such as "borrowed from Alex" included.
- Blocking detaches every loan between two accounts in the same transaction, and deleting an account turns its counterpart link into "deleted account".

**Paid-tier angle:** lent and borrowed records, whole-deck loans, the checklist, the history, loans between accounts, the borrower's view, the household and the in-app Due view stay free, because the player's own data is never the lever (I-30 requirement 1.2). The candidates are e-mail reminders, a scheduled job with a sender to pay for, and the borrow plan inside I-43's game-night planner. The spec advises I-30 not to plan revenue on this initiative: its value is moving a record players keep on paper to the place where they build.

### Definition of done

A player lends a deck to a friend, sees the lent copies drop out of what a new deck can use and ticks the cards off as they come back, and the friend sees the loan and its due date; a borrowed card fills a deck without ever counting as owned, and no typed text crosses accounts.

---

