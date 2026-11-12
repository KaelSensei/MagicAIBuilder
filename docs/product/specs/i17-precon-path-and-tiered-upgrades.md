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

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

### Goals

- A player can open a dated precon, preview a budget bundle, apply it to a working copy, and reverse it without altering the source list.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-17-01

As a player who bought a precon, I want the sealed list dated and a budget bundle I can undo, so that the product is not rewriting the deck I own.

#### US-17-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-17-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-17-01 Happy path

Given a signed-in player and the English locale
When the sealed list names its source and date.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-17-02 Happy path

Given a signed-in player and the English locale
When a bundle applies to a working copy and reverses in one action.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-17-03 Happy path

Given a signed-in player and the English locale
When every price on the bundle is labelled an estimate.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-17-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-17-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-17-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: The catalogue is readable signed-out. Applying a bundle is signed-in. Guests may open a precon in the playtest only after that slice says so.

#### AC-17-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-17-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-17-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The commander stays until the player changes it. The diff is the list of swaps, shown before apply.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Catalogue rows come from I-67's import of MTGJSON deck lists. Applying a bundle uses the deck write path, one transaction.

### Analytics and telemetry

`precon_bundle_applied {reversed_within_session: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

The catalogue is readable signed-out. Applying a bundle is signed-in. Guests may open a precon in the playtest only after that slice says so.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Who writes the editorial bundles, and when a sealed price may appear, wait on I-32 and a named editor.

### Sources

- https://draftsim.com/commander-precons/
- https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460657155/sortby=mostrecent/json
- https://github.com/arkham-build/arkham.build/releases/tag/v2.10.2
- https://github.com/arkham-build/arkham.build/releases/tag/v3.6.0
- https://draftsim.com/mtg-arena-brawl-precon/
- https://hearthstone.blizzard.com/en-us/news/24198086

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-17-101

As a player, I want the product to keep a versioned catalog of official precon lists, each with a dated source., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep a versioned catalog of official precon lists, each with a dated source.

#### AC-17-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-102

As a player, I want the product to show the diff from the sealed list, and keep the commander until the player changes it., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Show the diff from the sealed list, and keep the commander until the player changes it.

#### AC-17-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-103

As a player, I want the product to offer editorial swap bundles by budget band, separate from I-02 suggestions., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Offer editorial swap bundles by budget band, separate from I-02 suggestions.

#### AC-17-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-104

As a player, I want the product to apply each bundle to a distinct working copy, and make the bundle reversible., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Apply each bundle to a distinct working copy, and make the bundle reversible.

#### AC-17-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-105

As a player, I want the product to label every price as an estimate, not a guaranteed quote., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Label every price as an estimate, not a guaranteed quote.

#### AC-17-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-114 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-17-106

As a player, I want the product to import Secret Lair drops into the catalogue from MTGJSON's deck files, which list each drop's cards by Scryfall ID under the MIT licence, dated and versioned like precons (slice 7)., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Import Secret Lair drops into the catalogue from MTGJSON's deck files, which list each drop's cards by Scryfall ID under the MIT licence, dated and versioned like precons (slice 7). MTGJSON 5.3.0+20261109 lists 782 "Secret Lair Drop" decks and 206 "Commander Deck" decks; refreshes reach the product through a reviewed pull request.

#### AC-17-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-117 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-17-107

As a player, I want the product to for the missing cards in I-06's plan or in one deck's shopping list, list the fixed-content products that hold them, precons and Secret Lair drops, ranked by missing copies covered and showing the singles value of those copies (slice 8)., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: For the missing cards in I-06's plan or in one deck's shopping list, list the fixed-content products that hold them, precons and Secret Lair drops, ranked by missing copies covered and showing the singles value of those copies (slice 8).

#### AC-17-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-108

As a player, I want the product to name, in the printing selector, the precon or Secret Lair drop that each printing came from (slice 8)., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Name, in the printing selector, the precon or Secret Lair drop that each printing came from (slice 8).

#### AC-17-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-109

As a player, I want "I bought this precon" adds a catalogue version's cards to the collection with its printings, through I-06's model, and one undo; the working copy then starts as owned., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then "I bought this precon" adds a catalogue version's cards to the collection with its printings, through I-06's model, and one undo; the working copy then starts as owned. "Also a function to auto add precons to your inventory" (Dragon Shield reviews, 2025-09-18). Added 2026-11-11.

#### AC-17-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-110

As a player, I want the product to upgrade ledger., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Upgrade ledger. Each applied bundle or manual upgrade step is a linked version recording:

#### AC-17-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-17-111

As a player, I want "This precon would cost you X": the singles value of the cards the player lacks, set against the sealed price once I-32 has one (extends slice 8)., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-130 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then "This precon would cost you X": the singles value of the cards the player lacks, set against the sealed price once I-32 has one (extends slice 8). Arena prices a Brawl precon down by the cards owned (Draftsim, updated 2025-05-19, search summary). Added 2026-11-11.

#### AC-17-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-132 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-17-112

As a player, I want the product to open a catalogue precon in the playtest, signed out, before "Copy this deck" (slice 2 with I-07)., so that a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

#### AC-17-133 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Open a catalogue precon in the playtest, signed out, before "Copy this deck" (slice 2 with I-07). Hearthstone lends six decks for seven days, then the player keeps one (32.2, 2025-04-24). Added 2026-11-11.

#### AC-17-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-17-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

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

## I-17: Precon Path And Tiered Upgrades

**Spec:** [`specs/i17-precon-path-and-tiered-upgrades.md`](i17-precon-path-and-tiered-upgrades.md)

**Outcome:** a player can open a dated official precon, see the diff from that list, and apply a reversible budget bundle on a separate working copy.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

EDHREC precon upgrades, DeckCheck and Farseek are the references. Generic budget suggestions stay in I-02.

### Scope

- [ ] Keep a versioned catalog of official precon lists, each with a dated source.
  - Re-pointed 2026-11-10 to [I-67](i67-one-card-data-pipeline.md) slice 13: MTGJSON's deck lists, precons and Secret Lair drops alike, reach the catalogue through I-67's one ingest, matched to its printings by Scryfall ID. Slice 1 keeps the catalogue model, and the first imported set follows I-67 slice 13.
  - Answered 2026-11-10 by [I-73](i73-every-set-release-ready-on-day-one.md): per-set import is a day-one need. I-67 slice 13 imports a set's decks when MTGJSON publishes them, and I-73 slice 9 links each to a catalogue version labelled as a decklist from a product not yet released.
- [ ] Show the diff from the sealed list, and keep the commander until the player changes it.
- [ ] Offer editorial swap bundles by budget band, separate from I-02 suggestions.
- [ ] Apply each bundle to a distinct working copy, and make the bundle reversible.
- [ ] Label every price as an estimate, not a guaranteed quote.
- [ ] Import Secret Lair drops into the catalogue from MTGJSON's deck files, which list each drop's cards by Scryfall ID under the MIT licence, dated and versioned like precons (slice 7). MTGJSON 5.3.0+20261109 lists 782 "Secret Lair Drop" decks and 206 "Commander Deck" decks; refreshes reach the product through a reviewed pull request.
- [ ] For the missing cards in I-06's plan or in one deck's shopping list, list the fixed-content products that hold them, precons and Secret Lair drops, ranked by missing copies covered and showing the singles value of those copies (slice 8).
- [ ] Name, in the printing selector, the precon or Secret Lair drop that each printing came from (slice 8).
  - The three items above stay free, and match by name until I-37 slice 12 stores Oracle identity. Products with random contents, such as boosters, stay out, and no sealed price is shown until I-32 provides a source. [Draftsim's precon database](https://draftsim.com/commander-precons/) (prices updated 2026-11-06) sorts precons by singles value against sealed price, but no tool found looks up the products that hold a card or a list of cards.
- [ ] "I bought this precon" adds a catalogue version's cards to the collection with its printings, through I-06's model, and one undo; the working copy then starts as owned. "Also a function to auto add precons to your inventory" ([Dragon Shield reviews](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1460657155/sortby=mostrecent/json), 2025-09-18). Added 2026-11-11.
- [ ] Upgrade ledger. Each applied bundle or manual upgrade step is a linked version recording:
  - its dated estimated cost;
  - the cards taken from the collection;
  - a running total.

  The ledger has "Jump to latest version" and a filter by cost left. arkham.build does this for campaign upgrades, with XP spent per step ([v2.10.2](https://github.com/arkham-build/arkham.build/releases/tag/v2.10.2), 2025-01-19; [v3.6.0](https://github.com/arkham-build/arkham.build/releases/tag/v3.6.0), 2025-10-21). Added 2026-11-11.

- [ ] "This precon would cost you X": the singles value of the cards the player lacks, set against the sealed price once I-32 has one (extends slice 8). Arena prices a Brawl precon down by the cards owned ([Draftsim](https://draftsim.com/mtg-arena-brawl-precon/), updated 2025-05-19, search summary). Added 2026-11-11.
- [ ] Open a catalogue precon in the playtest, signed out, before "Copy this deck" (slice 2 with I-07). Hearthstone lends six decks for seven days, then the player keeps one ([32.2](https://hearthstone.blizzard.com/en-us/news/24198086), 2025-04-24). Added 2026-11-11.

**Twelfth pass, 2026-11-11:** Archidekt's board has "Deck import defaults to editions owned" at 217 points, seen that day. That job is [I-57](i57-printing-preferences-everywhere.md) and I-06, not a second precon path.

### Enrichment (2026-11-11)

**User story.** As a player who bought a precon, I want the sealed list dated and a budget bundle I can undo, so that the product is not rewriting the deck I own.

**Acceptance.**
- The sealed list names its source and date.
- A bundle applies to a working copy and reverses in one action.
- Every price on the bundle is labelled an estimate.

**UX.** The commander stays until the player changes it. The diff is the list of swaps, shown before apply.

**Data and API.** Catalogue rows come from I-67's import of MTGJSON deck lists. Applying a bundle uses the deck write path, one transaction.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `precon_bundle_applied {reversed_within_session: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** The catalogue is readable signed-out. Applying a bundle is signed-in. Guests may open a precon in the playtest only after that slice says so.

**Open questions.** Who writes the editorial bundles, and when a sealed price may appear, wait on I-32 and a named editor.

### Definition of done

A player can open a dated precon, preview a budget bundle, apply it to a working copy, and reverse it without altering the source list.

---

