# Spec: The Pod's Own Surface (I-23)

> **Initiative:** [I-23 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-15 pod sheets. Built on I-22's contract if that ships first.

A 2027-horizon spec: scope and intent are firm, interface details are deliberately left open.

## Overview

The Rule 0 conversation does not happen on a deckbuilding site. It happens in a Discord server, thirty seconds before the first turn, or in the thread where the pod organises the evening. This initiative puts the two artifacts that conversation needs — the dated bracket and the consented Rule 0 sheet — where the conversation already is.

## What the market does

Discord is an established Magic surface, and bots already occupy the adjacent space.

| Bot                                 | What it does                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Otterly MTG**                     | Deck analysis explaining a deck's strength against the Commander power brackets, combo detection, Moxfield import, a "Recommander" suggestion tool, and a companion web builder |
| **Scry / Mana Grove**               | Finds cards by effect, and a `/bracket` command that returns a decklist's bracket                                                                                               |
| **MTG Commander bot** (open source) | Life tracking for four players, commander damage, Scryfall card search, dice, session management                                                                                |

The existence of three independent bots answering bracket and card questions is the evidence that the demand is real and that nobody needs convincing to install one.

**What none of them carries:** a pod's _declared_ agreement. Every bot classifies a deck from its list. I-15's sheet records what four people actually said they were bringing — speed, combos, extra turns, denial, proxies, house rules — and that artifact has no home in the place the agreement is made.

## Current state in this codebase

- No Discord integration, no bot, no OAuth link to a third-party identity beyond NextAuth's Google provider.
- `src/lib/deck/bracket.ts` and the Game Changers detection produce exactly the values a `/bracket` reply needs.
- Public deck pages and share tokens exist (I-08), with the rule that private decks and share tokens stay out of search indexes — the same discipline must extend to anything the bot can echo.

## Functional requirements

1. **Dated bracket on request.** A command returns a deck's bracket, its Game Changers, and the date of the data behind both.
2. **Consented sheets only.** The bot renders an I-15 sheet only where consent was given for that pod. An unconsented sheet is not merely hidden — the bot must be unable to fetch it.
3. **Explicit account linking.** A Discord identity is linked to a product account by a deliberate, revocable action. Revoking takes effect immediately.
4. **Read and report only.** No command mutates a deck, a collection, a sheet or ownership. The bot has no write path at all.
5. **The same uncertainty.** A bot reply carries the same source labels and freshness dates the web surface shows. A one-line reply must not sound more certain than the page it summarises.
6. **No private leakage.** A deck that is private stays unreachable through the bot, including by anyone who knows its id.

## Non-goals

- Life tracking, commander damage, dice or turn timers. Three bots already do it, and it is not this product.
- Deck building inside Discord.
- Card search. Scryfall's own bot and Mana Grove serve it.
- A presence in any other chat platform before this one is validated.

## Testing strategy

- **Permission:** every command, invoked for a deck the caller does not own and has no consent for, returns refusal — enumerated per command.
- **Consent:** revoking a pod consent makes the sheet unfetchable on the next call, not merely unrendered.
- **Parity:** a bracket reported by the bot equals the bracket the product shows for the same deck at the same moment.
- **Write isolation:** the bot's credentials are rejected by every mutating route.

## Delivery slices

| #   | Slice                                                      | Depends on      |
| --- | ---------------------------------------------------------- | --------------- |
| 1   | Account linking, revocable, with no command yet            | —               |
| 2   | `/bracket` returning bracket, Game Changers and data dates | 1               |
| 3   | Consented I-15 sheet rendering                             | 1, I-15 slice 3 |
| 4   | Private-deck isolation tests and the write-path assertion  | 2, 3            |

Slice 4 is not a cleanup pass: it is the slice that makes the first three safe to leave running, and it should not trail them by more than one PR.

## Open questions

- Build on I-22's public contract, or on a private internal one? Using I-22 makes this initiative its first real consumer and validates that contract before anyone external depends on it — a strong argument for sequencing I-22 first even though it is the larger piece.
- Does a bot create a support surface the project cannot staff? A bot that is down is a visible failure in someone's server. Worth an explicit decision about what "unmaintained" would look like before shipping.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

### Goals

- A pod reads a consented sheet and a dated bracket in its own server, and nothing the bot can do changes a deck.

**2026-11-09 (evening):** [I-46](i46-discord-and-chat-integrations.md) builds the Discord app these commands would run in and answers the first scope item for public decks without account linking. I-23 keeps linking, consented sheets and `/pod`; whether to merge the two is an owner question in the status note.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-23-01

As a player, I want a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser., so that this initiative's definition of done is met.

#### US-23-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-23-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-23-01 Happy path

Given a signed-in player and the English locale
When a pod reads a consented sheet and a dated bracket in its own server, and nothing the bot can do changes a deck.

**2026-11-09 (evening):** [I-46](i46-discord-and-chat-integrations.md) builds the Discord app these commands would run in and answers the first scope item for public decks without account linking. I-23 keeps linking, consented sheets and `/pod`; whether to merge the two is an owner question in the status note.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-23-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-23-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-23-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-23-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-23-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-23-01 without a pointer
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

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-23-101

As a player, I want the product to a command returning a deck's bracket and Game Changers with their data dates., so that a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

#### AC-23-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A command returning a deck's bracket and Game Changers with their data dates.

#### AC-23-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-23-102 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-23-102

As a player, I want the product to a command rendering a consented Rule 0 sheet; never an unconsented one., so that a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

#### AC-23-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A command rendering a consented Rule 0 sheet; never an unconsented one.

#### AC-23-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-23-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-23-103

As a player, I want the product to explicit, revocable linking between a Discord account and a product account., so that a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

#### AC-23-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Explicit, revocable linking between a Discord account and a product account.

#### AC-23-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-23-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-23-104

As a player, I want the product to no deck mutation from the bot., so that a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

#### AC-23-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: No deck mutation from the bot. Read and report only.

#### AC-23-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-23-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-23-105

As a player, I want the product to state the same uncertainty the product states., so that a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

#### AC-23-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: State the same uncertainty the product states. A bot reply is not permitted to sound more certain than the web surface.

#### AC-23-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-23-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

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

## I-23: The Pod's Own Surface

**Spec:** [`specs/i23-the-pods-own-surface.md`](i23-the-pods-own-surface.md)

**Outcome:** a playgroup can ask for a deck's bracket, Game Changers and Rule 0 sheet inside the Discord server where it already argues about them, without anyone opening a browser.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** Medium / medium
**Depends on:** I-15 pod sheets, and I-22 if the surface is built on the public contract rather than a private one.

Otterly MTG, Mana Grove's `/bracket` command and several Commander companion bots already live in these servers, which is the evidence the demand is real. None of them carries a pod's declared Rule 0 agreement — that is I-15's artifact, and Discord is where the conversation it supports actually happens.

### Scope

- [ ] A command returning a deck's bracket and Game Changers with their data dates.
- [ ] A command rendering a consented Rule 0 sheet; never an unconsented one.
- [ ] Explicit, revocable linking between a Discord account and a product account.
- [ ] No deck mutation from the bot. Read and report only.
- [ ] State the same uncertainty the product states. A bot reply is not permitted to sound more certain than the web surface.

### Definition of done

A pod reads a consented sheet and a dated bracket in its own server, and nothing the bot can do changes a deck.

**2026-11-09 (evening):** [I-46](i46-discord-and-chat-integrations.md) builds the Discord app these commands would run in and answers the first scope item for public decks without account linking. I-23 keeps linking, consented sheets and `/pod`; whether to merge the two is an owner question in the status note.

---

