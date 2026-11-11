# Spec: Offline Game-Night Viewing (I-19)

> **Initiative:** [I-19 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Owns:** a voluntary, read-only cache of **one** deck. **Does not own:** offline editing, multi-device sync, or local inference (I-12).

## Overview

Game night happens in a shop basement with no signal. The player needs one deck, its primer and its token list — readable, dated, and gone from the device when they sign out. Nothing more.

## What the market does

Offline is a solved problem on mobile, and the bar is set by full card databases, not by single decks.

| Product                       | Offline capability                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ManaBox**                   | Core card database free and fully offline; the usual recommendation for logging cards in a shop with bad wifi |
| **MTGDB** (iOS, Android)      | Over 80 000 cards available offline: search, browse, build, manage collection                                 |
| **MTG Deck Builder AI** (iOS) | Download chosen formats once, then search the pool with no connection                                         |
| **MTG Unofficial** (Android)  | Offline card search plus game utilities                                                                       |

**Read this honestly.** The product cannot and should not match an 80 000-card offline database — that is a native-app capability, and a native mobile app is explicitly out of scope in I-13. The defensible slice is much narrower and still covers the actual game-night need: **the one deck you are about to play**, with the primer and tokens that competitors' offline modes do not carry.

Framing matters here. "Offline deck builder" invites a comparison the product loses. "Your deck, readable at the table" is a claim it can keep.

## Current state in this codebase

- **Nothing.** No service worker, no web app manifest, no `next-pwa`, no cache strategy. Verified by grep across `src/`, `public/` and `next.config.ts` on 2026-11-08.
- Primers exist and render as safe Markdown (I-08). Token checklists exist and export (I-01).
- This is the only one of the eight initiatives that is entirely greenfield, and the roadmap rates it High impact / **large** effort. That rating is correct.

## Functional requirements

### 1. Explicit download

1.1 Downloading is an action on one deck. Nothing is cached in the background, ever.
1.2 The download includes the decklist, card images at a stated resolution, the primer and the required-token list.
1.3 Progress and final size are shown before and during the download; a player on mobile data must be able to judge the cost.
1.4 A second download of the same deck refreshes it and updates its cached date.

### 2. Read-only offline

2.1 Offline, the cached deck opens read-only. Editing controls are absent, not merely disabled.
2.2 The cached copy displays **the date it was cached**, prominently. A stale list at a table is worse than no list.
2.3 Any action requiring the network states that it needs a connection instead of failing silently.

### 3. Privacy on a shared device

3.1 Signing out purges the cache for that account before the session ends.
3.2 One account's cached deck is never readable by the next account on the same device.
3.3 The cache is per-origin and per-account; a cached deck is never exposed to another site or another profile.

### 4. Bounded storage

4.1 Only one deck is cached at a time by default; caching another replaces it unless the player opts into keeping both.
4.2 The player can delete the cache explicitly, without signing out.
4.3 Exceeding the browser's quota is reported as an actionable message, not an exception.

## Technical approach

- A **service worker** with an explicit, versioned cache name. No runtime caching of arbitrary requests — only the deck payload the player asked for.
- Card images cached as a stated-resolution set, not the full-size art, to keep the payload defensible on mobile data.
- A web app manifest is required for installability but **installability is not a goal of this initiative** — do not conflate the two.
- Sign-out purge runs in the auth sign-out path and is covered by a test, because this is the requirement most likely to rot silently.

## Non-goals

- Offline editing, in any form. A read-only cache that cannot diverge needs no conflict resolution — that is the entire reason this slice is affordable.
- Multi-device sync.
- An offline card database or offline search.
- Local model inference. That is I-12 and stays parked.
- Push notifications, background sync, or any other service-worker capability beyond the deck cache.

## Testing strategy

- **Sociable, offline:** Playwright with the context set offline opens the cached deck, shows the cached date, and exposes no editing control.
- **Privacy:** sign out with a cached deck, sign in as another account, assert the first deck is unreachable — this test is the point of the initiative.
- **Boundary:** quota exceeded produces the actionable message; a second deck replaces the first unless opted in.
- **Freshness:** a deck edited online and re-downloaded shows the new cached date and the new contents.

## Delivery slices

| #   | Slice                                                                   | Depends on |
| --- | ----------------------------------------------------------------------- | ---------- |
| 1   | Service worker skeleton with a versioned cache, no deck logic           | —          |
| 2   | Download one deck: list, images, primer, tokens, with size and progress | 1          |
| 3   | Read-only offline rendering with the cached date                        | 2          |
| 4   | Sign-out purge, with its test                                           | 2          |
| 5   | Quota handling, explicit delete, single-deck replacement rule           | 3          |
| 6   | Airplane-mode E2E coverage in the Docker suite                          | 3, 4       |

Slice 4 must not lag slice 2 by more than one PR: shipping a cache without the purge creates a privacy problem on shared devices.

## Open questions

- Which image resolution? `normal` is legible at a table and roughly a fifth of `png`; 100 cards of `normal` is a defensible payload, `png` is not.
- Does a service worker interact badly with the existing Sentry and Vercel Speed Insights setup? Worth a spike before slice 1, because a misconfigured worker can cache a broken shell and lock players out of the live site.
- Is "one deck" too strict for a player bringing three decks to a pod night? Perhaps, but shipping one and measuring is cheaper than guessing three.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can choose one deck and read that deck, its primer and its tokens without a network.

### Goals

- After an explicit download, the chosen deck, primer and tokens remain readable offline and are removed from the device when that account signs out.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-19-01

As a player on the way to a game, I want one deck, its primer and its tokens readable with no network, so that the shop's wifi is not required.

#### US-19-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-19-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-19-01 Happy path

Given a signed-in player and the English locale
When the player chooses the deck. Nothing else is cached.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-19-02 Happy path

Given a signed-in player and the English locale
When the cached copy shows the date it was saved.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-19-03 Happy path

Given a signed-in player and the English locale
When sign-out deletes the cache.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-19-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-19-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-19-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-in to choose a private deck. A public deck can be cached by a guest and is cleared when the browser session ends. Flag off until the airplane-mode test passes.

#### AC-19-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-19-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-19-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The offline view is read-only. A control that would edit the list is absent, not disabled-and-still-working.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A versioned cache in the service worker. The deck payload is the share projection plus tokens. No new server route for the cache itself.

### Analytics and telemetry

`deck_cached {cleared_on_signout: yes}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-in to choose a private deck. A public deck can be cached by a guest and is cleared when the browser session ends. Flag off until the airplane-mode test passes.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

I-87 may goldfish this cache later. I-94 may cache four public projections. Neither raises the one editable deck.

### Sources

- https://archidekt.com/news/3834269
- https://archidekt.com/forum/thread/9348841

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-19-101

As a player, I want the product to let the player download one deck, including its primer and required tokens., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the player download one deck, including its primer and required tokens.

#### AC-19-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-102

As a player, I want the product to open that download read-only while offline., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-103 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Open that download read-only while offline.

#### AC-19-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-103

As a player, I want the product to show the date of the cached copy., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-106 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Show the date of the cached copy.

#### AC-19-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-104

As a player, I want the product to purge the private cache on sign-out, so one account's deck is not left for the next account on the device., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Purge the private cache on sign-out, so one account's deck is not left for the next account on the device.

#### AC-19-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-19-105

As a player, I want the product to cover airplane-mode reading in tests., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-112 Happy path

Given a downloaded deck and no network
When the player uses this behaviour
Then the behaviour holds: Cover airplane-mode reading in tests.

#### AC-19-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-106

As a player, I want the product to build the deck's token list from Scryfall's all_parts instead of the Oracle-text pattern in src/lib/deck/token-library.ts, which misses Treasure, X-sized and two-word tokens and names no emblem (before slice 2)., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Build the deck's token list from Scryfall's all_parts instead of the Oracle-text pattern in src/lib/deck/token-library.ts, which misses Treasure, X-sized and two-word tokens and names no emblem (before slice 2). Checked on origin/dev at 72fbfc1: Smothering Tithe ("a Treasure token" has no power and toughness), Krenko, Mob Boss (X tokens), Bitterblossom (a "Faerie Rogue") and Palace Jailer (the monarch) give an empty list, and Elspeth's emblem comes out as "Emblem". The fix also corrects the playtest's token picker (BattlefieldZone.tsx and PlaytestModal.tsx read the same list), I-24's token reading and I-50's token deck.

#### AC-19-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-107

As a player, I want the product to list the game pieces a deck needs beside its tokens, each with the cards that need it: the monarch, the initiative and Undercity, the Ring, day and night, dungeons, named emblems, and energy, experience and poison counters (before slice 2)., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: List the game pieces a deck needs beside its tokens, each with the cards that need it: the monarch, the initiative and Undercity, the Ring, day and night, dungeons, named emblems, and energy, experience and poison counters (before slice 2).

#### AC-19-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-108

As a player, I want the product to list the counter kinds that the deck's cards put on permanents, such as +1/+1, −1/−1, shield, stun and oil, from a tested list read in Oracle text, since all_parts does not link them (before slice 2)., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: List the counter kinds that the deck's cards put on permanents, such as +1/+1, −1/−1, shield, stun and oil, from a tested list read in Oracle text, since all_parts does not link them (before slice 2).

#### AC-19-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-19-109

As a player, I want the product to a printable one-page checklist in black and white, with a tick box, the count and the source cards for each token and game piece, offered on the deck, share and public pages and inside the offline download (slice 2)., so that a player can choose one deck and read that deck, its primer and its tokens without a network.

#### AC-19-124 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A printable one-page checklist in black and white, with a tick box, the count and the source cards for each token and game piece, offered on the deck, share and public pages and inside the offline download (slice 2).

#### AC-19-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-19-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can choose one deck and read that deck, its primer and its tokens without a network.

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

## I-19: Offline Game-Night Viewing

**Spec:** [`specs/i19-offline-game-night-viewing.md`](i19-offline-game-night-viewing.md)

**Outcome:** a player can choose one deck and read that deck, its primer and its tokens without a network.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / large

ManaBox offline search is the reference. This slice is a voluntary read-only cache. A multi-device offline editor is out of scope. Local inference stays in I-12.

### Scope

- [ ] Let the player download one deck, including its primer and required tokens.
- [ ] Open that download read-only while offline.
- [ ] Show the date of the cached copy.
- [ ] Purge the private cache on sign-out, so one account's deck is not left for the next account on the device.
- [ ] Cover airplane-mode reading in tests.
- [ ] Build the deck's token list from Scryfall's `all_parts` instead of the Oracle-text pattern in `src/lib/deck/token-library.ts`, which misses Treasure, X-sized and two-word tokens and names no emblem (before slice 2). Checked on `origin/dev` at `72fbfc1`: Smothering Tithe ("a Treasure token" has no power and toughness), Krenko, Mob Boss (X tokens), Bitterblossom (a "Faerie Rogue") and Palace Jailer (the monarch) give an empty list, and Elspeth's emblem comes out as "Emblem". The fix also corrects the playtest's token picker (`BattlefieldZone.tsx` and `PlaytestModal.tsx` read the same list), I-24's token reading and I-50's token deck.
  - Re-pointed 2026-11-10 to [I-67](i67-one-card-data-pipeline.md) slice 2: `all_parts` is read from I-67's `CardRelation` table, with no Scryfall call per deck.
- [ ] List the game pieces a deck needs beside its tokens, each with the cards that need it: the monarch, the initiative and Undercity, the Ring, day and night, dungeons, named emblems, and energy, experience and poison counters (before slice 2).
- [ ] List the counter kinds that the deck's cards put on permanents, such as +1/+1, −1/−1, shield, stun and oil, from a tested list read in Oracle text, since `all_parts` does not link them (before slice 2).
- [ ] A printable one-page checklist in black and white, with a tick box, the count and the source cards for each token and game piece, offered on the deck, share and public pages and inside the offline download (slice 2).
  - Archidekt's "Extras" tab shows emblems and dungeons ([news](https://archidekt.com/news/3834269), about three years before 2026-11-10), and its users reported the monarch, the City's Blessing and Mizzix's experience counter missing ([thread 9348841](https://archidekt.com/forum/thread/9348841)). No printable checklist was found anywhere. All four items stay free.

**Twelfth pass, 2026-11-11:** goldfishing that download, without editing it, is [I-87](i87-goldfish-the-deck-you-downloaded.md). Reading up to four other people's public lists for one night is [I-94](i94-four-lists-pinned-for-one-night.md). Neither raises the one-deck limit of the editable cache. The token list this initiative fixes is also the token section of [I-80](i80-print-shop-file.md).

### Enrichment (2026-11-11)

**User story.** As a player on the way to a game, I want one deck, its primer and its tokens readable with no network, so that the shop's wifi is not required.

**Acceptance.**
- The player chooses the deck. Nothing else is cached.
- The cached copy shows the date it was saved.
- Sign-out deletes the cache.

**UX.** The offline view is read-only. A control that would edit the list is absent, not disabled-and-still-working.

**Data and API.** A versioned cache in the service worker. The deck payload is the share projection plus tokens. No new server route for the cache itself.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `deck_cached {cleared_on_signout: yes}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-in to choose a private deck. A public deck can be cached by a guest and is cleared when the browser session ends. Flag off until the airplane-mode test passes.

**Open questions.** I-87 may goldfish this cache later. I-94 may cache four public projections. Neither raises the one editable deck.

### Definition of done

After an explicit download, the chosen deck, primer and tokens remain readable offline and are removed from the device when that account signs out.

---

