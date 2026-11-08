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
