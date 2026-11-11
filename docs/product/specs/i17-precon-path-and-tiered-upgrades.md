# Spec: Precon Path And Tiered Upgrades (I-17)

> **Initiative:** [I-17 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Owns:** dated official precon lists and editorial swap bundles. **Does not own:** generic budget suggestions, which stay in I-02.

## Overview

A precon is where most Commander players start. This initiative keeps a **dated catalogue** of official lists, shows the diff between the sealed deck and the player's copy, and offers reversible budget bundles applied to a separate working copy — so a player can try an upgrade path without destroying the list they own.

## What the market does

Precon upgrading is a mature editorial category, and the tiers are already standardised across sites.

| Source                     | What it offers                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **EDHREC precon upgrades** | Per-precon upgrade pages driven by their inclusion data                                                                                    |
| **Draftsim**               | A precon database with full decklists, commanders and current singles value; guides naming cards to add, five budget picks and what to cut |
| **The Spark MTG**          | Upgrade kits placing all decks of a set on one page with **budget, mid and full tiers** and a one-click cart per tier                      |
| **RateMyDecks**            | Upgrade paths at **$30, $60 and $100**                                                                                                     |
| **PreconForge**            | "The first 10 cards you should replace" framing                                                                                            |

The market has also converged on a **bracket mapping** worth reusing as editorial guidance, not as a promise: roughly $30 moves a precon from bracket 1 to low bracket 2, $60 reaches mid bracket 2, and $100 can reach bracket 3.

**The gap.** Every source above is an article. None of them is a _reversible operation on your own list_. The player reads a guide and edits by hand, losing the sealed baseline. Owning the diff and the undo is the product's angle.

## Current state in this codebase

- No precon catalogue. The only occurrence of "precon" in `src/` is inside `src/app/api/ai/build/route.ts`, in prompt text.
- `src/lib/deck/` has snapshots and a deterministic comparison engine (I-07) — the diff machinery already exists and should be reused rather than rebuilt.
- Deck duplication and forking exist (I-08) — the working-copy mechanism exists too.

This initiative is therefore mostly **data plus editorial**, not new engine work.

## Functional requirements

### 1. The catalogue

1.1 Each precon is stored as a dated, versioned list with its source URL and the date that source was read.
1.2 A precon entry names its set, its commander, and its release date.
1.3 The catalogue is append-only: correcting a list creates a new version, so a player's existing diff never changes under them.
1.4 Card identity is stored at printing level, because a precon ships specific printings and the price depends on them.

### 2. The diff from sealed

2.1 Opening a precon shows the diff between the sealed list and the player's working copy.
2.2 The commander is preserved until the player changes it explicitly.
2.3 The diff reuses the I-07 comparison engine. No second diff implementation.

### 3. Bundles

3.1 A bundle is an editorial set of swaps — cards in, cards out — tagged with a budget band.
3.2 Bands follow the market convention: roughly $30, $60 and $100, labelled as estimates.
3.3 Applying a bundle creates or updates a **distinct working copy**. The sealed list is never modified.
3.4 Applying a bundle is reversible in one action, restoring the working copy to its pre-bundle state.
3.5 A bundle states which cards it could not apply and why — colour identity, legality, or a card already present.
3.6 _Added 2026-11-11:_ on a working copy, a card the player does not own offers [I-76](i76-complete-this-deck-from-my-collection.md) slice 10's owned substitute, and open slots go to I-76's proposal route. No new slice here.

### 4. Prices are estimates

4.1 Every price shown is labelled an estimate, never a quote.
4.2 Cards with no known price are listed separately and excluded from the subtotal, matching the rule already applied in I-06.

## Data model

```
Precon         id, setCode, name, commanderOracleId, releaseDate, sourceUrl, sourceReadAt, version
PreconCard     preconId, scryfallId, quantity, zone
UpgradeBundle  id, preconId, band (budget|mid|full), estimatedUsd, curatorNote, sourceUrl, sourceReadAt
BundleSwap     bundleId, addScryfallId?, removeScryfallId?, reason
BundleApply    deckId, bundleId, appliedAt, revertedAt?, beforeSnapshotId
```

`beforeSnapshotId` makes the undo exact: reverting restores a snapshot that already exists, rather than replaying inverse operations.

## Non-goals

- Generating bundles with the LLM. Bundles are editorial and sourced; generic AI suggestions stay in I-02.
- A shopping cart or checkout. Handing off to I-06's acquisition plan is the boundary.
- Covering every precon ever printed before the mechanism is proven. Start with one recent set.
- Claiming a bracket outcome. The bracket mapping is guidance, and the computed bracket from I-03 remains the only number shown as calculated.

## Testing strategy

- **Solitary:** applying a bundle to a fixture precon produces the expected list; reverting restores the exact pre-apply snapshot.
- **Boundary:** a swap whose card is already in the deck, or breaks colour identity, is reported as not applied and does not partially mutate the list.
- **Contract:** a precon list is immutable — writing to an existing version fails; a correction creates version n+1.
- **Sociable:** opening a precon, applying the mid bundle and reverting leaves the working copy byte-identical to its starting state.

## Delivery slices

| #   | Slice                                                                                                                                      | Depends on                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 1   | Catalogue model and read-only display _(re-pointed 2026-11-10: the first dated set arrives through I-67 slice 13, which needs this model)_ | —                                  |
| 2   | Open-as-working-copy and the sealed diff via the I-07 engine                                                                               | 1; I-67 slice 13 for the first set |
| 3   | Bundle model and application with the not-applied report                                                                                   | 2                                  |
| 4   | One-action revert via `beforeSnapshotId`                                                                                                   | 3                                  |
| 5   | Budget bands, estimate labelling and unpriced disclosure                                                                                   | 3                                  |
| 6   | Hand-off to the I-06 acquisition plan for the missing cards                                                                                | 5                                  |

Slices 1 and 2 are useful alone: a dated precon catalogue with a diff is shippable value before any bundle exists.

## Open questions

- Who curates the bundles? Editorial content needs an owner and a refresh cadence, or it dates badly — the same failure mode as `design-system.md`.
- Does the catalogue share its storage with I-16's candidate corpus? Precons are the most trustworthy candidate source, so one table serving both is attractive.
- Universes Beyond sets ship four precons at a time (the Star Trek set, 2026-11-13, is the immediate example). Is per-set bulk import a day-one requirement? _Answered 2026-11-10 by [I-73](i73-every-set-release-ready-on-day-one.md#changes-requested-of-other-specs): yes. I-67 slice 13 imports a set's decks when MTGJSON publishes them, and I-73 slice 9 checks it._
