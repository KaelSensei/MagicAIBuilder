# I-95: A Changelog For The Public Read API

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a developer can read, in one page, what changed in the public read API since the previous deploy, and a breaking change cannot merge without a dated line.

### Goals

- The page lists the three data routes and the OpenAPI route, a pull request that changes the document without a changelog line fails the check, and the page renders signed out.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-95-01

As a developer using the public read API, I want a page that says what changed, so that a breaking change is not silent.

#### US-95-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-95-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-95-01 Happy path

Given a signed-in player and the English locale
When the page lists the deck routes, the collection route and the OpenAPI route.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-95-02 Happy path

Given a signed-in player and the English locale
When a change to the OpenAPI document without a dated changelog line fails CI, unless the change is labelled compatible.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-95-03 Happy path

Given a signed-in player and the English locale
When the page renders signed out and embeds no deck.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-95-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-95-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-95-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Public. No account. No flag. It does not document routes outside `/api/v1`.

#### AC-95-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-95-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-95-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

A public documentation page. Compatible and breaking are the only labels.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The document already exists at `GET /api/v1/openapi`. This initiative adds a changelog page and a CI check. No new data route.

### Analytics and telemetry

`api_changelog_viewed`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Public. No account. No flag. It does not document routes outside `/api/v1`.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

I-22's verdict, when it exists, adds its own lines. It does not replace this page.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-95: A Changelog For The Public Read API

**Outcome:** a developer can read, in one page, what changed in the public read API since the previous deploy, and a breaking change cannot merge without a dated line.

**Status:** Next
**Priority:** Next. The API is already public.
**Impact / effort:** Medium / small
**Risk:** Low. The page describes routes that exist. It does not add a route.
**Depends on:** nothing. I-22's versioned verdict is a later contract and will add its own lines when it ships.

`GET /api/v1/openapi` already returns a document with no credential (`src/app/api/v1/openapi/route.ts`). The routes under `src/app/api/v1/` are decks, one deck, and the collection. I-52's release notes are for players. They are not a contract for these routes.

### Scope

- [ ] A public page, in English, listing dated changes to `/api/v1/decks`, `/api/v1/decks/{id}`, `/api/v1/collection` and `/api/v1/openapi`. A compatible change is labelled compatible. A breaking change names the field and the date.
- [ ] A CI check fails when the OpenAPI document changes and the changelog has no new dated line and no "compatible" label for that change.
- [ ] The page does not document routes outside `/api/v1`. It does not embed a deck.

### Enrichment (2026-11-11)

**User story.** As a developer using the public read API, I want a page that says what changed, so that a breaking change is not silent.

**Acceptance.**
- The page lists the deck routes, the collection route and the OpenAPI route.
- A change to the OpenAPI document without a dated changelog line fails CI, unless the change is labelled compatible.
- The page renders signed out and embeds no deck.

**UX.** A public documentation page. Compatible and breaking are the only labels.

**Data and API.** The document already exists at `GET /api/v1/openapi`. This initiative adds a changelog page and a CI check. No new data route.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `api_changelog_viewed`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Public. No account. No flag. It does not document routes outside `/api/v1`.

**Open questions.** I-22's verdict, when it exists, adds its own lines. It does not replace this page.

### Definition of done

The page lists the three data routes and the OpenAPI route, a pull request that changes the document without a changelog line fails the check, and the page renders signed out.

---

