# I-116: Public Deck Lists: A Curated Set Of Public Decks Anyone Can Read

> **Initiative:** I-116, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-21 · **Priority:** Later; slice 1 is pure and may be built by hand, slice 2 (lists of the owner's own public decks) needs nothing that is not on `dev`, and lists that hold other players' decks wait for owner decision [D-109](../owner-decisions.md#community-and-moderation) · **D-109 decided 2026-11-22:** yes, on the recommended rule ([register](../owner-decisions.md#decided-on-2026-11-22)); slice 4 follows slice 5's reports · **Paid:** never · **Written 2026-11-21**
> **Placement:** a named, ordered, public list of public decks that one player curates and anyone can read at one URL: "Top 8 of Saturday's store night", "my five budget decks", "every deck from the 2026 Worlds Top 8". [I-08](i08-share-compare-and-learn.md) owns the private saved-deck folders; [I-36](i36-creator-and-embed-toolkit.md) owns the creator page with up to six pinned decks of the creator's own; [I-75](i75-finding-public-decks.md) owns search and the author's listing switch; [I-41](i41-store-commander-nights.md) owns a store night and never ranks a player. None owns "a public list of decks, possibly by other players, that I curate and share".
> **Research:** the twentieth pass of 2026-11-21, on the owner's request to match Moxfield's new deck editor. Moxfield blocks automated fetches, so its pages were not read; its public Bluesky posts were read through Bluesky's public API, and every external fact links its entry in [Sources](#sources).
> **Owns:** the `DeckList` and `DeckListEntry` records, the list page at `/lists/{id}`, the rules that decide which decks a list may hold and when an entry disappears, the author's opt-out from other players' lists, and "Publish this folder" from I-08's saved-deck folders. **Does not own:** deck visibility and forks ([I-08](i08-share-compare-and-learn.md)); the public projection of a deck ([I-36](i36-creator-and-embed-toolkit.md) slice 1); the listing switch and search ([I-75](i75-finding-public-decks.md)); reports and moderation ([I-38](i38-trust-safety-and-user-rights.md)); store nights and leagues ([I-41](i41-store-commander-nights.md), [I-104](i104-league-decks-and-the-change-allowance-between-rounds.md)); embeds ([I-36](i36-creator-and-embed-toolkit.md) §2).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-08       | A private saved-deck folder gains "Publish as a list", which creates an I-116 list from its decks; the folder itself stays private and unchanged.                          |
| I-36       | The creator page may show the creator's public lists under the pinned decks; requirement 6.1's six pinned decks are unchanged.                                             |
| I-38       | `Report.targetType` gains `deckList` (its title and description are user text); the list follows requirement 9's `moderationState` like any other public item.             |
| I-75       | An entry for another player's deck is allowed only while that deck is listed in search (`listedInSearch`, requirement 6.2), so the listing switch is also the list switch. |

## Overview

Moxfield publishes event results as lists of decks. On 2026-11-15 its Bluesky account wrote "We have the deck lists live on Moxfield for everyone to check out" and linked `moxfield.com/lists/ZKX3N-top-8-world-championship-32`, and later the same day "You can see all the top 8 decks here", with the same list [1]. Its announcement video of 2026-11-20 shows public deck lists among the new deck editor's deck actions [2][3]. The list is the unit a store, a creator or a player shares when the subject is several decks: a Top 8, a budget series, "the five decks I bring to game night".

MagicAIBuilder has the pieces but not the object. A player can save other players' public decks into private folders (I-08, shipped), a creator page will pin up to six of the creator's own decks (I-36 requirement 6.1), and search will filter public decks (I-75). There is no public, ordered, named set of decks with its own URL, and no rule for when another player's deck may appear in one.

This initiative adds that list: a title, a short plain-text description, up to 100 entries in the curator's order, each with an optional one-line note, at `/lists/{id}`. Only public decks can be entries. An entry shows the deck through I-36's public projection, with its author's current name and a link, and disappears as soon as the deck stops being public, is deleted or leaves search.

**Why a new initiative.** No file owns it (checked on 2026-11-21 against I-08, I-36, I-41, I-72, I-75, I-104 and I-105). I-08's folders are private by design ("without claiming ownership or exposing decks that later become private"); I-36's pinned decks are the creator's own and capped at six; I-75 is search, which a curator cannot order or annotate. **Why Later.** Lists that hold other players' decks touch I-08's attribution rules and I-38's reporting, which is the owner's call (D-109). Lists of the owner's own public decks need neither and may ship first.

## What the market does

All rows were read on 2026-11-21.

| Product or source                     | What it does or says                                                                                                                                          | Source |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Moxfield, Bluesky, 2026-11-15**     | "We have the deck lists live on Moxfield for everyone to check out", linking a list of the 2026 World Championship Top 8 at `moxfield.com/lists/…` (14 likes) | [1]    |
| **Moxfield, Bluesky, 2026-11-15**     | "You can see all the top 8 decks here", linking the same list                                                                                                 | [1]    |
| **Moxfield, announcement 2026-11-20** | The new deck editor, "now live for everyone"; the video shows public deck lists among the editor's deck actions                                               | [2][3] |

Other sites' list features were not researched in this pass; this file claims nothing about them.

**The gap.** Our decks can be saved privately, pinned by their author and found by search, but not gathered into a public, ordered and annotated set that names each author.

## Current state in this codebase

Verified on `dev` at `59208d5c` (#1657) on 2026-11-21:

- **Saved-deck folders are private.** I-08's shipped folders hold other players' public decks for the saver only.
- **The public projection exists.** I-36 slices 1 and 2 are done: one server function lists the fields a public surface may show, and the deck image reads stored data only (`src/lib/deck/social-image.ts`).
- **No list object.** `prisma/schema.prisma` has no model that groups decks across owners; `Deck.folderId` holds the owner's own folder.

**Owning context:** `community`, beside I-08's folders and I-75's search.

## Functional requirements

### 1. Principles

1.1 A list holds references to decks, never copies. It shows what the deck's public projection shows today, not what it showed when it was added.
1.2 Only a public deck can be an entry. A deck that turns private, is deleted, is hidden by moderation or (for another player's deck) leaves search disappears from every list at once, and its author is never named by a list that cannot show the deck.
1.3 Every entry names the deck's author with a link to their profile, as I-36 requirement 6.3 does for forks. A list never presents another player's deck as the curator's.
1.4 A list ranks nothing by itself. The order is the curator's, and the page says so ("Ordered by {curator}"). No vote, like or popularity sort applies to lists (D-83's boundary that popularity is not advice).
1.5 Free, always. No paid list count, no promoted lists.

### 2. The list

2.1 Title (1–80 characters), description (0–500 characters, plain text, no links rendered as HTML), visibility (private, unlisted, public), and up to 100 entries in the curator's order.
2.2 Each entry may carry a note of at most 140 characters, plain text, such as "1st, 5–0" or "the budget build".
2.3 A curator holds at most 50 lists. Both caps are the owner's to change; they bound abuse and page weight.
2.4 A deck appears at most once in a list.

### 3. Whose decks

3.1 **The curator's own public decks** can always be added.
3.2 **Another player's public deck** can be added only after D-109 allows it, and only while that deck is listed in search (I-75 requirement 6.2). Its author may turn on "Do not add my decks to other players' lists" in settings; existing entries then disappear. Decided 2026-11-22: D-109 allows it on this rule. Every entry names and links its author, is a reference and never a copy, and disappears when the deck turns private, leaves search, or its author opts out.
3.3 The author of a deck never needs to act for it to leave a list: 1.2 applies automatically.

### 4. Surfaces

4.1 `/lists/{id}`: title, curator, description, dated "last changed", and the entries as deck rows (name, commander, colour identity, author, the curator's note), each linking to the deck page. A missing, private or hidden list returns the same "not found" page.
4.2 From a public deck page, a signed-in player adds the deck to one of their lists. From an I-08 saved-deck folder, "Publish as a list" creates a list from the folder's public decks.
4.3 Unlisted lists are reachable by URL only and carry `noindex`; public lists may be indexed when they hold at least one entry (I-34's indexing rules apply).

### 5. Free and paid

| Part       | Free | Paid candidate | Why                                                     |
| ---------- | ---- | -------------- | ------------------------------------------------------- |
| Everything | Yes  | —              | A list is sharing; I-36 1.1 keeps sharing surfaces free |

## Data model / API

```
DeckList        id, ownerId (cascade), title (≤ 80), description (≤ 500), visibility: private | unlisted | public,
                moderationState (I-38), createdAt, updatedAt
DeckListEntry   listId (cascade), deckId (cascade), position, note? (≤ 140), addedAt; unique (listId, deckId)
User            + excludeFromOtherLists Boolean @default(false)
```

- `visibleEntries(list, decks, viewer)` is pure: it drops entries whose deck is not public, is hidden, is deleted, or (for another owner's deck) is unlisted from search or opted out, and returns the rest in `position` order. `DeckList.visibility` is a discriminated union with an exhaustive `never` guard.
- `GET /lists/{id}` (page); `POST /api/deck-lists`, `PATCH /api/deck-lists/{id}`, `DELETE /api/deck-lists/{id}` (owner only); `PUT /api/deck-lists/{id}/entries` replaces the ordered entries in one transaction, so a reorder is never half-applied.
- The page reads deck fields through I-36's public projection only. No list route returns a deck field that projection does not list.

## Non-goals

- Likes, votes, follower counts or a "top lists" ranking (D-83; I-75 owns popularity).
- Comments on a list (I-08 owns comments; a list links to the decks, where comments already live).
- Standings, points or a tournament manager (the roadmap's tournament-manager non-goal; I-41 1.1 and D-101).
- Copying another player's deck into a list (that is a fork, I-08's).
- Lists of cards (I-37's clipboard and I-56's wish lists own card lists).
- A collaborative list edited by several accounts (no co-editing; I-20 is a patch the owner accepts).

## Testing strategy

- **Visibility (solitary):** `visibleEntries` over five entries (own public, other's public and listed, other's unlisted from search, other's private, deleted) returns the first two in order.
- **Opt-out (solitary):** an author with `excludeFromOtherLists` loses their entries from another curator's list and keeps them in their own.
- **Projection (sociable, PostgreSQL in Docker):** a snapshot test fails if a list response holds `notes`, `folderId`, `budget`, `shareEnabled`, `manualBracket` or `userId` of any entry, the same guard as I-36's.
- **Reorder (sociable):** a failed `PUT` of entries leaves the previous order intact.
- **Red first:** slice 1's first Red: `visibleEntries` with one private deck returns no entry for it.

## Delivery slices

| #   | Slice                                                                                                                        | Depends on             |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | `visibleEntries`, pure, with solitary tests: visibility, deletion, moderation, search listing, opt-out, order; fixtures only | None (by hand)         |
| 2   | `DeckList` and `DeckListEntry`, owner routes, `/lists/{id}`; the curator's own public decks only; English and French         | 1                      |
| 3   | Add a deck from its public page; "Publish as a list" from an I-08 saved-deck folder                                          | 2                      |
| 4   | Other players' public decks, the listing-switch rule and the author's opt-out                                                | 2; 5; I-75 slice 1 _(D-109 decided 2026-11-22: reports on lists ship first)_ |
| 5   | Report a list and moderation state                                                                                           | 2; I-38 slices 8 and 9 |
| 6   | The curator's public lists on the creator page                                                                               | 2; I-36 slice 10       |

Slice 1 can start now by hand, and slice 2 needs nothing that is not on `dev`. Slice 4 waits for D-109 and I-75 slice 1's `listedInSearch`. Decided 2026-11-22: the owner answered D-109 with the recommended rule, and reports on lists ship first, so slice 4 now waits for slice 5 and I-75 slice 1.

## Open questions

1. **Other players' decks (D-109).** May a list hold another player's public deck, and on which rule: listed in search and not opted out (recommended), any public deck, or the curator's own decks only? Decided 2026-11-22: yes, on the recommended rule ([D-109](../owner-decisions.md#decided-on-2026-11-22)). Only decks listed in search, with an author opt-out; every entry names and links its author, is a reference and never a copy, and disappears when the deck turns private, leaves search, or its author opts out. Reports on lists (slice 5) ship first.
2. **Notify the author?** Should an author be told when their deck joins someone's list? Recommended: no notice in version 1; the author's opt-out and the listing switch are the controls, and I-63 would own any notice.
3. **Caps.** Are 100 entries and 50 lists the right bounds? Recommended: start there and read the distribution after 90 days.
4. **Snapshots.** Should an event's list be able to freeze each deck as it was on the day (a Top 8 "as played")? Recommended: no in version 1; it would copy other players' decks, which 1.1 refuses, and I-104's league decks own a frozen round list.

## Sources

Read on 2026-11-21 unless stated otherwise.

1. Moxfield on Bluesky, posts of 2026-11-15 linking the 2026 World Championship Top 8 list ("We have the deck lists live on Moxfield for everyone to check out", 14 likes; "You can see all the top 8 decks here"), read through Bluesky's public API. <https://bsky.app/profile/moxfield.com>
2. Moxfield on Bluesky, 2026-11-20: "our new Deck Editor is now live for everyone on Moxfield!", with a video. <https://bsky.app/profile/moxfield.com>
3. YouTube, "New Moxfield Deck Editor is now live!" (Moxfield), title read through YouTube's oEmbed endpoint. <https://www.youtube.com/watch?v=7c1O84R6n3o>

## Feature contract (Full, 2026-11-21)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A store owner, a creator or a player who wants to share several decks at once (a Top 8, a budget series, a game-night bag) has to post several links or build a page elsewhere. Our decks can be saved privately, pinned by their own author and found by search, but not gathered into one public, ordered list that names each author [1].

### Goals

- One URL that shows a named, ordered set of public decks with the curator's notes.
- Every entry names and links its author, and disappears when its deck stops being public.
- The curator's own decks first; other players' decks only under D-109's rule and the author's opt-out.

### Non-goals

- Likes, votes or rankings of lists; comments on lists; standings or points; copies of other players' decks; card lists; collaborative editing.

### Personas

The content creator publishing a series; the casual pod player sharing the decks of a night; the store organiser of [I-41](i41-store-commander-nights.md) sharing a night's decks without a standing. See the roadmap persona table.

### User stories

#### US-116-01

As a content creator, I want one public list of my five budget decks with a note on each, so that a video links one page instead of five.

#### US-116-02

As a store organiser, I want a list of the decks played at Saturday's Commander night, each crediting its pilot, so that players can find each other's decks after the night.

#### US-116-03

As an author, I want my deck to leave every other player's list as soon as I make it private or turn off "Show in deck search", so that a list never shows what I took back.

### Acceptance criteria

#### AC-116-01 Happy path

Given a signed-in player with three public decks
When they create the list "Budget series", add the three decks in order and add the note "under $50" to the first
Then `/lists/{id}` shows the title, the curator, the three decks in that order with their commanders and authors, and the note on the first

#### AC-116-02 Error and failure

Given the entries cannot be saved
When the player retries
Then the list keeps its last confirmed order and entries, nothing is half-reordered, and the message is a catalogue string

#### AC-116-03 A deck taken back

Given another player's public deck in a list
When its author makes it private, deletes it or turns off "Show in deck search"
Then the entry disappears from the list page and its API at the next read, and the page never names that author for it

#### AC-116-04 Guest and signed-in

Given a public list and an unlisted list
When a guest opens each URL
Then the guest reads both, the unlisted page carries `noindex`, and only a signed-in curator sees the edit controls on their own list

#### AC-116-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them

#### AC-116-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the curator reorders entries without a pointer
Then each entry has "move up" and "move down" controls with names, the new position is announced, and the order is not shown by colour alone

#### AC-116-07 Opt-out

Given an author who turns on "Do not add my decks to other players' lists"
When a curator opens the add dialog on that author's public deck
Then the deck cannot be added to the curator's list, and the author's existing entries in other players' lists disappear

### UX flow and states

From a public deck page, "Add to a list" opens a dialog listing the player's lists and "New list". The list page shows the entries; the curator sees "Edit", reorder controls and per-entry notes.

- Empty: "This list has no decks yet."
- Loading: a busy state that keeps the rows still.
- Error: the last confirmed list stays; a catalogue message offers a retry.
- Partial: entries whose deck is no longer public are absent, with no placeholder naming them.

### Data model and API

The types and routes in [Data model / API](#data-model--api).

### Analytics and telemetry

`deck_list_created {visibility}`, `deck_list_entries_saved {entries, othersEntries}`. Reserved for I-39's store. Counts and enums only: no list title, deck name, username or URL.

### Rollout and feature flags

Behind an I-69 switch, `community.deckLists`, on with slice 2 for signed-in players. Guests read public and unlisted lists. Slice 4 turns on only after D-109. Decided 2026-11-22: D-109 is answered; slice 4 turns on after slice 5's reports.

### Dependencies

[I-08](i08-share-compare-and-learn.md) (folders); [I-36](i36-creator-and-embed-toolkit.md) slices 1 and 10; [I-75](i75-finding-public-decks.md) slice 1 (slice 4); [I-38](i38-trust-safety-and-user-rights.md) slices 8 and 9 (slice 5); [I-34](i34-commander-data-reports.md)'s index policy; owner decision D-109.

### Risks and mitigations

- **A list used to present someone else's deck as one's own.** Mitigation: the author's name and link on every entry (1.3), and a reference, never a copy (1.1).
- **A list used to target or mock a player.** Mitigation: the author's opt-out (3.2), the listing switch, reports and moderation through I-38 (slice 5); slice 4 does not ship before slice 5.
- **A list read as a ranking.** Mitigation: "Ordered by {curator}" on the page, no votes, no popularity sort (1.4).

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in this file.

### Open questions

See [Open questions](#open-questions) above.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-116-101 A night's decks

As a store organiser, I want to build the list from decks the players already made public, so that I type no decklist.

#### AC-116-100 Happy path

Given eight players' public decks, each listed in search, and D-109 allowing other players' decks
When the organiser adds them to "Commander night, 2026-11-28" with each pilot's note
Then the list shows eight entries, each crediting its author, and no standing, point or rank appears

#### AC-116-101 Failure

Given one of the eight decks turns private between the add and the save
When the organiser saves
Then seven entries are saved, and the dialog names the one deck that could not be added without showing its contents

#### AC-116-102 Edge

Given a folder of 12 saved public decks, two of which have since turned private
When the player uses "Publish as a list"
Then the list holds the 10 decks still public, in the folder's order, and the folder is unchanged

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "This list has no decks yet."                                                                           |
| Loading          | A busy state that keeps the rows still.                                                                 |
| Error            | The last confirmed list; a catalogue message with a retry.                                              |
| Guest            | Public and unlisted lists, read-only.                                                                   |
| Signed-in        | Their own lists with edit, reorder and notes; "Add to a list" on public deck pages.                     |
| English          | New controls use the `en` catalogue.                                                                    |
| French           | New controls use the `fr` catalogue; deck and list titles as their authors wrote them.                  |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Add, reorder, note and remove are reachable without a pointer.                                          |
| Screen reader    | Entries are an ordered list; position changes are announced.                                            |
| Colour           | No meaning rests on colour.                                                                             |
| Success          | "List saved."                                                                                           |

### Alternate paths

- The curator makes a public list private. The URL returns "not found" to everyone else; the entries are kept for the curator.
- The curator deletes a list. Its entries go with it; no deck changes.

### Roadmap record (2026-11-21)

This file is the record from the start; the roadmap row for I-116 is a link here.

## I-116: Public Deck Lists: A Curated Set Of Public Decks Anyone Can Read

**Outcome:** a player publishes a named, ordered list of public decks at one URL, with a note per deck and every author credited, and an entry disappears as soon as its deck stops being public or its author opts out.

**Status:** Later
**Priority:** Later; slices 1 and 2 need nothing that is not on `dev`. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Medium. Other players' decks in a list touch attribution and moderation; D-109 and I-38's reporting bound it.
**Depends on:** nothing for slices 1 and 2; D-109 and I-75 slice 1 for slice 4; I-38 slices 8 and 9 for slice 5; I-36 slice 10 for slice 6. Decided 2026-11-22: D-109 is answered, and slice 4 also waits for slice 5.

Moxfield publishes event results as public lists of decks (the 2026 World Championship Top 8, posted 2026-11-15), and its announcement video of 2026-11-20 shows lists among the new editor's deck actions.

### Scope

- [ ] `visibleEntries`, pure (slice 1); lists of the curator's own public decks (slice 2).
- [ ] Add from a deck page and publish a saved-deck folder (slice 3); other players' decks after D-109 (slice 4); reports (slice 5); lists on the creator page (slice 6).

### Engineering enablers

- `DeckList.visibility` as a discriminated union; one transaction per entries save; deck fields only through I-36's public projection.

**Paid-tier angle:** none.

### Enrichment (2026-11-21)

**User story.** As a store organiser, I want one public list of a night's decks, each crediting its pilot, so that players find each other's decks.

**Acceptance.** Curator's order and notes; authors named and linked; entries vanish when a deck is taken back; no ranking.

**UX.** "Add to a list" on a deck page, "Publish as a list" on a folder, `/lists/{id}`.

**Data and API.** `DeckList`, `DeckListEntry`, `User.excludeFromOtherLists`; owner routes and one public page.

**i18n and access.** English and French; keyboard reorder with announced positions.

**Telemetry.** `deck_list_created`, `deck_list_entries_saved`. Reserved for I-39.

**Rollout.** `community.deckLists`, with slice 2; slice 4 after D-109.

**Open questions.** Other players' decks (D-109, decided 2026-11-22); notifying authors; caps; frozen snapshots.

### Definition of done

A player publishes "Budget series" with three of their own decks and a note on each; a guest reads it; after D-109, a store organiser lists eight players' decks from a night, each credited; one author turns off "Show in deck search" and their entry disappears from the list at the next read.

---
