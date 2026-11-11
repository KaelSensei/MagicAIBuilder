# I-86: A Data-As-Of Line On Every Deck

**Status:** Next  
**Priority:** Next  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can see, on the deck, the date of the rules file, the date each price was stored, and whether card data came from the daily file, without a new network call.

### Goals

- A public deck shows the rules date that matches the file the server loaded, shows no price date the database does not store, and the rendered line makes no request of its own.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-86-01

As a player looking at a deck, I want the date of the rules and of the prices, so that I know what the numbers were true for.

#### US-86-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-86-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-86-01 Happy path

Given a signed-in player and the English locale
When the rules date matches the file the server loaded.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-86-02 Happy path

Given a signed-in player and the English locale
When a price with no stored date does not show an invented date.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-86-03 Happy path

Given a signed-in player and the English locale
When the line makes no network request of its own.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-86-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-86-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-86-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for guests and signed-in players, public and private. No flag. It does not jump the backup or the copilot.

#### AC-86-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-86-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-86-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

One line on the builder and on the public deck. Placeholders are sentences, not zeros.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Reads the rules file's effective date and the price stored on the card. Later it reads I-67's load time and I-59's series. No new table in the first slice.

### Analytics and telemetry

`data_as_of_rendered {rules_dated: yes, prices_dated: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for guests and signed-in players, public and private. No flag. It does not jump the backup or the copilot.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None that block the first line. The later timestamps simply replace the placeholder sentences.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-86: A Data-As-Of Line On Every Deck

**Outcome:** a player can see, on the deck, the date of the rules file, the date each price was stored, and whether card data came from the daily file, without a new network call.

**Status:** Next
**Priority:** Next, after the current Next band. It is small and it does not jump the backup or the copilot.
**Impact / effort:** Medium / small
**Risk:** Low. The failure is a date the product did not record. The line must omit a date it does not have.
**Depends on:** nothing. I-67 replaces "not loaded from the daily file" with a load timestamp when that load exists. I-59 replaces "stored when the card was added" when a series exists.

I-09 labels external recommendations with a source. The deck itself does not say how old its rules file or its prices are. The app ships the Comprehensive Rules effective 2026-08-07 (`src/lib/rules/data/MagicCompRules-20260807.txt`). Prices are the USD amount stored with the card (`src/lib/deck/pricing.ts`).

### Scope

- [ ] One line on the builder and on the public deck: the rules file's effective date, "Prices: USD stored with each card", and "Card data: not loaded from the daily file" until I-67 records a load.
- [ ] A missing date is absent, not guessed. The line does not fetch Scryfall, EDHREC or a price.
- [ ] When I-67 and I-59 have timestamps, the same line reads those timestamps and drops the placeholder sentences.

### Enrichment (2026-11-11)

**User story.** As a player looking at a deck, I want the date of the rules and of the prices, so that I know what the numbers were true for.

**Acceptance.**
- The rules date matches the file the server loaded.
- A price with no stored date does not show an invented date.
- The line makes no network request of its own.

**UX.** One line on the builder and on the public deck. Placeholders are sentences, not zeros.

**Data and API.** Reads the rules file's effective date and the price stored on the card. Later it reads I-67's load time and I-59's series. No new table in the first slice.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `data_as_of_rendered {rules_dated: yes, prices_dated: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for guests and signed-in players, public and private. No flag. It does not jump the backup or the copilot.

**Open questions.** None that block the first line. The later timestamps simply replace the placeholder sentences.

### Definition of done

A public deck shows the rules date that matches the file the server loaded, shows no price date the database does not store, and the rendered line makes no request of its own.

---

