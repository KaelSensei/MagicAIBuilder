# Spec: Collaborative Review (I-20)

> **Initiative:** [I-20 in the roadmap](../roadmap.md) · **Status:** Later · **Researched:** 2026-11-08
> **Owns:** proposing a deck patch that the owner accepts or rejects. **Does not own:** comments, "seeking feedback" and forks, which stay in I-08.

## Overview

A friend who knows the format should be able to say "cut these three, add these three" **as a change the owner can apply in one action** — not as a paragraph in a comment thread the owner retypes by hand. The owner stays the owner: the collaborator proposes, never publishes.

## What the market does

This is the clearest unoccupied space of the eight initiatives.

**Archidekt collaborators**, the reference named in the roadmap, works the opposite way. A collaborator can **add, remove and edit cards directly, in real time, exactly as the deck's creator can**. They are blocked only from changing the deck's name, format, game type, description and privacy. The owner gets popup notifications after the fact.

That is **shared write access**, not review. It suits two people building together on a call. It does not suit "I asked three people and want to evaluate what each suggested" — the case this initiative addresses.

Nothing found on 2026-11-08 offers a propose-and-accept workflow for Magic decks. Every other product in the space treats feedback as prose: TappedOut's deck-help threads, Moxfield's comments, Reddit's r/EDH deck-help posts. The pattern this initiative borrows is the pull request, and the market has simply not applied it to decklists.

**Consequence for scope:** there is no competitor behaviour to match. The risk is not falling behind; it is building a heavyweight permission system for a workflow nobody has validated. The roadmap rates this Medium impact / large effort and places it in Later. Both are right.

## Current state in this codebase

- `src/lib/deck/` snapshots and the deterministic comparison engine (I-07) — a patch is a diff between two snapshots, and that machinery exists.
- Deck forking with attribution, public/private decks, threaded comments, "seeking feedback" and the moderation queue (I-08).
- Ownership is single-owner throughout: there is no role model, no share-scoped permission, and no second writer anywhere in the deck APIs.

## Functional requirements

### 1. Invitation and role

1.1 An owner invites a specific account as a **reviewer** on one deck.
1.2 The reviewer role can read the deck and submit a patch. It cannot modify the deck, publish it, rename it, change its privacy, or delete it.
1.3 The invitation is revocable at any time; revoking leaves already-submitted patches intact and visible to the owner.
1.4 A reviewer never reaches the owner's collection, acquisition plan or private decks — only the deck they were invited to.

### 2. The patch

2.1 A patch is a set of proposed additions and removals with quantities and zones, plus an optional note.
2.2 A patch is computed and stored as a diff against a **named base snapshot**, so it can be evaluated later even if the deck moved on.
2.3 A patch is immutable once submitted. A reviewer who changes their mind submits another.
2.4 A patch whose base snapshot no longer matches the current deck is shown as **stale**, with what changed underneath it, and requires an explicit re-check before it can be applied.

### 3. Accept or reject

3.1 The owner sees the patch rendered through the I-07 comparison engine — the same diff view used for snapshots, not a second implementation.
3.2 Accepting applies the patch and records who proposed it. Rejecting records the decision and keeps the patch in history.
3.3 Partial acceptance is **out of scope for the first slice**: a patch is accepted or rejected whole. Cherry-picking rows is a second product and should wait for evidence that owners want it.
3.4 Applying a patch creates a new snapshot, so the pre-patch state is always recoverable.

### 4. Attribution and history

4.1 The deck history shows, per patch: who proposed it, when, the base snapshot, the decision, and when it was decided.
4.2 Attribution survives the reviewer's invitation being revoked.
4.3 Accepting a patch never silently overwrites a concurrent owner edit — the stale check in 2.4 is the guard.

## Data model

```
DeckReviewer   deckId, userId, invitedAt, revokedAt?
DeckPatch      id, deckId, proposerId, baseSnapshotId, note, submittedAt,
               decision (pending|accepted|rejected), decidedAt?, resultSnapshotId?
PatchRow       patchId, scryfallId, zone, quantityDelta
```

Storing `baseSnapshotId` rather than a timestamp is what makes staleness computable rather than guessed.

## Non-goals

- Real-time co-editing. Explicitly excluded by the roadmap; Archidekt already serves that need.
- Partial acceptance, in the first slice.
- Organisations, teams or nested permissions. One owner, N reviewers, one deck.
- Turning comments into patches. Comments stay prose in I-08.

## Testing strategy

- **Permission:** a reviewer's token is rejected on every deck mutation route — asserted route by route, not by inspection of middleware.
- **Isolation:** a reviewer on deck A cannot read deck B, the owner's collection, or the owner's acquisition plan.
- **Staleness:** a patch whose base snapshot has been superseded reports stale and refuses to apply before re-check.
- **History:** attribution survives revocation; a rejected patch remains readable with its decision.
- **Sociable:** propose, accept, and confirm the pre-patch snapshot still restores the original list.

## Delivery slices

| #   | Slice                                                        | Depends on |
| --- | ------------------------------------------------------------ | ---------- |
| 1   | Reviewer role and invitation, read-only access, revocation   | —          |
| 2   | Patch submission against a base snapshot, immutable          | 1          |
| 3   | Owner's diff view through the I-07 engine, accept and reject | 2          |
| 4   | Staleness detection and the re-check gate                    | 3          |
| 5   | Attribution history surviving revocation                     | 3          |

Slice 1 is the one carrying real risk: it introduces the first non-owner writer in a codebase whose deck APIs assume single ownership throughout. Audit every deck route before slice 2, not after.

## Open questions

- Is a patch worth it if the reviewer cannot explain it card by card? A note per row costs little and is probably what makes the patch persuasive rather than merely applicable.
- Should a public deck accept patches from anyone, as a pull request does? That is a moderation surface, and I-08's report-and-review queue exists precisely because the project decided moderation needs deliberate design. Start invitation-only.
- Does this initiative need the owner to be able to counter-propose? That is a conversation, and conversations live in I-08.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

### Goals

- A collaborator can propose a change, the owner can accept or reject it, and the deck history shows who proposed what.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-20-01

As a player, I want an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck., so that this initiative's definition of done is met.

#### US-20-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-20-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-20-01 Happy path

Given a signed-in player and the English locale
When a collaborator can propose a change, the owner can accept or reject it, and the deck history shows who proposed what.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-20-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-20-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-20-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-20-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-20-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-20-01 without a pointer
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

- https://www.reddit.com/r/EDH/comments/1uqynon/
- https://www.reddit.com/r/EDH/comments/1vzwh0m/
- https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-20-101

As a player, I want the product to invite a collaborator with a revocable role that can propose a patch and cannot publish it., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Invite a collaborator with a revocable role that can propose a patch and cannot publish it.

#### AC-20-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-20-102

As a player, I want the product to let the owner accept or reject the patch, and keep an attribution log., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the owner accept or reject the patch, and keep an attribution log.

#### AC-20-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-20-103

As a player, I want the product to preserve version history so a patch does not silently overwrite the deck., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Preserve version history so a patch does not silently overwrite the deck.

#### AC-20-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-20-104

As a player, I want the product to keep the owner's private collection inaccessible to the collaborator., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the owner's private collection inaccessible to the collaborator.

#### AC-20-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-20-105

As a player, I want the product to leave real-time co-editing out of this initiative., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Leave real-time co-editing out of this initiative.

#### AC-20-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-20-106

As a player, I want the product to later, behind D-91: a co-author the owner invites by name may edit the card list directly., so that an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

#### AC-20-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later, behind D-91: a co-author the owner invites by name may edit the card list directly. Every change is attributed in I-37's history; the co-author never touches settings, privacy, publishing or deletion, and sees no live presence. Moxfield: "Enable other authors to edit this deck" (code, 2026-05-14). Archidekt collaborators cannot change "the deck's main settings" (EDHREC guide, 2025-12-17). The non-goal "Do not start collaboration with live co-editing" stands as written. Added 2026-11-11.

#### AC-20-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-20-117 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

### UX states for this feature

The player-visible outcome is: an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

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

## I-20: Collaborative Review

**Spec:** [`specs/i20-collaborative-review.md`](i20-collaborative-review.md)

**Outcome:** an owner can invite someone to propose a deck patch, then accept or reject that patch without handing over the deck.

**Status:** Later
**Priority:** Later
**Impact / effort:** Medium / large

Archidekt collaborators are the reference. Comments, "seeking feedback" and forks stay in I-08. Live co-editing is a later product, not this initiative.

**Demand evidence (2026-11-09), for the owner:** the two most-upvoted launches of a new deckbuilder on r/EDH in 2026 led with this job. BlueprintMTG's posts reached 742 points in July and 585 in August 2026, built around feedback links whose suggestions the owner accepts or rejects, and around the observation that "many of the deck feedback requests in the subreddit just don't get any responses" ([July](https://www.reddit.com/r/EDH/comments/1uqynon/), [August](https://www.reddit.com/r/EDH/comments/1vzwh0m/)). MainTable shipped owner-approved suggestions on 2 November 2026. The evidence argues for moving I-20 earlier. Its priority is unchanged here; that is the owner's decision.

### Scope

- [ ] Invite a collaborator with a revocable role that can propose a patch and cannot publish it.
- [ ] Let the owner accept or reject the patch, and keep an attribution log.
- [ ] Preserve version history so a patch does not silently overwrite the deck.
- [ ] Keep the owner's private collection inaccessible to the collaborator.
- [ ] Leave real-time co-editing out of this initiative.
- [ ] Later, behind [D-91](../owner-decisions.md#product-scope-and-non-goals): a co-author the owner invites by name may edit the card list directly. Every change is attributed in I-37's history; the co-author never touches settings, privacy, publishing or deletion, and sees no live presence. Moxfield: "Enable other authors to edit this deck" (code, 2026-05-14). Archidekt collaborators cannot change "the deck's main settings" ([EDHREC guide](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site), 2025-12-17). The non-goal "Do not start collaboration with live co-editing" stands as written. Added 2026-11-11.

**Twelfth pass, 2026-11-11:** no new demand was found beyond the BlueprintMTG and MainTable evidence already on this initiative. Its priority stays the owner's decision.

### Definition of done

A collaborator can propose a change, the owner can accept or reject it, and the deck history shows who proposed what.

---

