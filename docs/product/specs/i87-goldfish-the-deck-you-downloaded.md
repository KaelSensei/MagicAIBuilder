# I-87: Goldfish The Deck You Downloaded

**Status:** Later  
**Priority:** Later  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

after the player downloads one deck for game night, they can goldfish that cached deck with no network, and the session is not an edit of the list.

### Goals

- Airplane mode opens a goldfish of the downloaded deck, an attempt to add a card does nothing, and signing out leaves no deck and no session on the device.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-87-01

As a player offline with a downloaded deck, I want to goldfish it, so that the train ride is useful and the list does not change.

#### US-87-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-87-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-87-01 Happy path

Given a signed-in player and the English locale
When airplane mode opens the playtest of the cached deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-87-02 Happy path

Given a signed-in player and the English locale
When an add or a cut does nothing.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-87-03 Happy path

Given a signed-in player and the English locale
When sign-out deletes the session with the deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-87-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-87-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-87-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Whoever was allowed to cache the deck. Flag off until I-19's purge test covers the session. It does not start before I-19.

#### AC-87-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-87-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-87-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The playtest chrome, without the editor's add button. A banner says the list is the cached copy and its date.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Session state in the cache I-19 owns. An upload on reconnect uses I-07's snapshot rules. No new server route for the offline session.

### Analytics and telemetry

`offline_goldfish_played {uploaded_later: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Whoever was allowed to cache the deck. Flag off until I-19's purge test covers the session. It does not start before I-19.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

ManaBox does not say its simulator works offline. This stays Later for that reason and because the cache is large.

### Sources

- https://apps.apple.com/us/app/manabox-mtg/id1460407674

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-87: Goldfish The Deck You Downloaded

**Outcome:** after the player downloads one deck for game night, they can goldfish that cached deck with no network, and the session is not an edit of the list.

**Status:** Later
**Priority:** Later
**Impact / effort:** High / large
**Risk:** High. A service worker that can write is the offline editor I-19 refuses. This slice is read-only on the list and local on the session.
**Depends on:** I-19's download and its sign-out purge. I-07's engine, pointed at the cache.

ManaBox's App Store text says card search works offline and that the app includes a deck simulator ([listing](https://apps.apple.com/us/app/manabox-mtg/id1460407674), seen 2026-11-11). It does not say the simulator works offline. I-19 is explicit that the cache is read-only and that an offline editor is out of scope. A goldfish does not change the list.

### Scope

- [ ] With the device offline, open the downloaded deck in the playtest: draw, mulligan, cast, undo. Refuse any control that would add, cut or save a card.
- [ ] Keep the session on the device. On reconnect, offer to upload it under I-07's snapshot rules. If the player signs out, I-19's purge deletes the session with the deck.
- [ ] Do not cache a second deck, and do not cache search.

### Enrichment (2026-11-11)

**User story.** As a player offline with a downloaded deck, I want to goldfish it, so that the train ride is useful and the list does not change.

**Acceptance.**
- Airplane mode opens the playtest of the cached deck.
- An add or a cut does nothing.
- Sign-out deletes the session with the deck.

**UX.** The playtest chrome, without the editor's add button. A banner says the list is the cached copy and its date.

**Data and API.** Session state in the cache I-19 owns. An upload on reconnect uses I-07's snapshot rules. No new server route for the offline session.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `offline_goldfish_played {uploaded_later: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Whoever was allowed to cache the deck. Flag off until I-19's purge test covers the session. It does not start before I-19.

**Open questions.** ManaBox does not say its simulator works offline. This stays Later for that reason and because the cache is large.

### Definition of done

Airplane mode opens a goldfish of the downloaded deck, an attempt to add a card does nothing, and signing out leaves no deck and no session on the device.

---

