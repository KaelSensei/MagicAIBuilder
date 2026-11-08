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
