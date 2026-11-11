# Spec: Verification As A Public Surface (I-22)

> **Initiative:** [I-22 in the roadmap](../roadmap.md) · **Status:** Later — 2027 · **Researched:** 2026-11-08
> **Depends on:** I-02's claim typing. **Owns:** the external verdict contract. **Does not own:** recommendations, which never travel through this surface.

A 2027-horizon spec. Its requirements are deliberately less detailed than a Next-horizon spec: committing to interface details eighteen months early produces precision that ages rather than guides.

## Overview

The product's differentiator is a deterministic verdict nobody else publishes. Inside the product it is a feature. Exposed as a contract other tools depend on, it becomes a position: a Discord bot, a tournament organiser or a competing builder can ask "is this list legal, and by which rule" and get an answer with its rule and its data date attached.

## What the market does

The sweep of 2026-11-08 found six products generating Commander decks — ManaTap, Farseek, DeckCheck, MTG Master, ManaForge, CommanderSalt — and **none publishing a verification API**. Several validate internally; DeckCheck documents that its AI output varies between runs.

Related surfaces that do exist:

- **Scryfall** publishes card data as free infrastructure every competitor consumes. It is the proof that an openly consumed contract becomes the category's reference point.
- **Commander Spellbook** publishes combo data openly and is consumed by this product already.
- **Moxfield** went the other way: no public API, Cloudflare in front of programmatic requests. The sweep recorded third-party tools moving to paste and CSV as a result.

The opening is the unclaimed middle: nobody is the place you send a list to find out whether it is legal and why.

## Current state in this codebase

- A **versioned read-only external API under `/api/v1`** already exists — the surface is an extension, not a new system.
- `src/lib/deck/bracket.ts`, colour-identity and legality validation, banlist and Game Changers detection are already deterministic and already tested.
- The verdict is currently **applied**, not **described**: there is no internal shape carrying "this judgement, by this rule, from data dated X". I-02 slice 1 creates it, which is why this initiative depends on it.

## Functional requirements

1. **Submit a list, receive a verdict.** Decklist plus format in; legality, colour identity, singleton, banlist, Game Changers and bracket inputs out.
2. **Never a bare boolean.** Every judgement carries the rule that produced it and the date of the data behind it. A verdict a consumer cannot explain to their own user is not worth exposing.
3. **Versioned, with an overlap.** A new contract version does not retire the previous one on the same day; consumers need a window.
4. **Authenticated and quotaed**, per consumer, with the quota documented rather than discovered by hitting it.
5. **Verification only.** No card suggestions, no generated text, no AI output of any kind crosses this boundary. The surface is valuable precisely because it is deterministic.
6. **Identical to what players see.** The same list submitted to the API and opened in the product produces the same verdict. A divergence is a defect, and a test must be able to catch it.

## Non-goals

- Recommendations, generation or any model output.
- Write access of any kind. Nothing outside the product mutates a deck.
- A free unlimited tier. Scryfall can absorb anonymous load; this product cannot, and pretending otherwise ends in an outage.
- Becoming a card-data source. Scryfall owns that, and the existing strategic boundary says so.

## Testing strategy

- **Parity:** a fixture corpus of lists produces identical verdicts through the API and through the internal path. This test is the point of the initiative.
- **Contract:** every judgement in a response carries a rule and a data date; one that does not fails.
- **Versioning:** a request pinned to version n keeps its shape after n+1 ships.
- **Isolation:** no route in this surface can write — asserted against the Prisma client, as I-16's read-only route requires.

## Delivery slices

| #   | Slice                                                                 | Depends on |
| --- | --------------------------------------------------------------------- | ---------- |
| 0   | **I-02 slice 1** — claims typed internally with rule and date         | blocking   |
| 1   | Verdict shape, internal, with the parity test against the player path | 0          |
| 2   | `/api/v1` endpoint, single version, authenticated                     | 1          |
| 3   | Quota, documentation, and the read-only assertion                     | 2          |
| 4   | Version negotiation and an overlap window                             | 2          |

## Open questions

- Who are the first consumers? Building a public contract before one real consumer exists is how APIs acquire the wrong shape. I-23's Discord surface is the natural first client, and building it _on_ this contract would validate the shape before anyone external depends on it.
- Does publishing the verdict invite competitors to consume the differentiator rather than buy it? Probably — and that is also how Scryfall became indispensable. Worth deciding deliberately rather than by default.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.



### Summary and problem

another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

### Goals

- A third party submits a list and receives a versioned, dated, rule-level verdict that matches what the product shows its own players for the same list.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-22-01

As a player, I want another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates., so that this initiative's definition of done is met.

#### US-22-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-22-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-22-01 Happy path

Given a signed-in player and the English locale
When a third party submits a list and receives a versioned, dated, rule-level verdict that matches what the product shows its own players for the same list.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-22-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-22-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-22-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-22-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-22-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-22-01 without a pointer
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

- https://xopla.net/posts/a-little-tool-to-make-ai-better-at-magic-the-gathering-deckbuilding

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-22-101

As a player, I want the product to accept a decklist and a format, and return the deterministic verdict: legality, colour identity, singleton, banlist, Game Changers, bracket inputs., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Accept a decklist and a format, and return the deterministic verdict: legality, colour identity, singleton, banlist, Game Changers, bracket inputs.

#### AC-22-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-102 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-22-102

As a player, I want the product to return the rule and the data date behind every judgement, never a bare boolean., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Return the rule and the data date behind every judgement, never a bare boolean.

#### AC-22-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-22-103

As a player, I want the product to version the contract, and keep an older version answering while a newer one exists., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Version the contract, and keep an older version answering while a newer one exists.

#### AC-22-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-22-104

As a player, I want the product to rate-limit and authenticate per consumer, with a documented quota., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Rate-limit and authenticate per consumer, with a documented quota.

#### AC-22-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-22-105

As a player, I want the product to publish no recommendation through this surface., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Publish no recommendation through this surface. Verification only.

#### AC-22-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-22-106

As a player, I want the product to state in every verdict that no language model produced it, and link the AI-use disclosure page planned in I-02., so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: State in every verdict that no language model produced it, and link the AI-use disclosure page planned in I-02. On r/EDH undisclosed AI is now a reason to dismiss a tool (I-02's 2026-11-09 findings), so a verdict that is visibly model-free is the form of the product that community accepts.

#### AC-22-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-22-107

As a player, I want the product to after slice 3, an MCP adapter under the same key and quota exposes verification tools only:, so that another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

#### AC-22-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: After slice 3, an MCP adapter under the same key and quota exposes verification tools only:

#### AC-22-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-22-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

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

# 2027 Horizon

The initiatives above carry the work already committed. The six below extend the pipeline into 2027. Each comes from a **verified gap** in the 2026-11-08 market sweep, not from a brainstorm, and each names the evidence that produced it.

Read them as hypotheses with a stated basis, not as commitments. A 2027 initiative is promoted to Next only when its spec's open questions are answered and its dependency has shipped.

**I-29 was added on 2026-11-09**, after the sweep and at the owner's request, from its own dated research. It is the seventh initiative in this horizon. I-30 to I-37, added the same day from a research pass on the owner's goals, are not part of this horizon: four of them are Next and one is Next in part, so they sit in their own section, [Business, Reference And Depth](#business-reference-and-depth), after the list of what the sweep ruled out. I-38 to I-46, added that evening, follow in [Trust, Growth And The Physical Table](#trust-growth-and-the-physical-table). I-47 to I-53, added on 2026-11-10, end that part (I-51 to I-53) and open [Rules, Access And The Online Table](#rules-access-and-the-online-table) (I-47 to I-50). I-54 to I-57, added later that day, join Business, Reference And Depth (I-55, I-57) and Trust, Growth And The Physical Table (I-54, I-56). I-58 to I-61, from a fifth pass, join Business, Reference And Depth (I-58) and Trust, Growth And The Physical Table (I-59 to I-61). I-62 to I-64, from a sixth pass, join Trust, Growth And The Physical Table. I-65 and I-66, from a seventh pass, join Business, Reference And Depth (I-65) and Trust, Growth And The Physical Table (I-66). I-67 and I-68, from an eighth pass, join Trust, Growth And The Physical Table (I-67) and the guides after I-28 (I-68).

**Why six and not twenty.** Beyond these, the sweep stopped producing gaps the product is positioned to fill. Adding further initiatives would mean inventing them, which fills a roadmap without filling a pipeline. The honest way to extend 2027 further is another dated sweep, not a longer list. The 2026-11-09 pass on the owner's goals was such a sweep, and it produced I-30 to I-37.

---

## I-22: Verification As A Public Surface

**Spec:** [`specs/i22-verification-as-a-public-surface.md`](i22-verification-as-a-public-surface.md)

**Outcome:** another tool, a Discord bot or a tournament organiser can submit a decklist and receive the same deterministic verdict a player sees in the product, with its rules and its data dates.

**Status:** Later
**Priority:** Later — 2027
**Impact / effort:** High / medium
**Depends on:** I-02's claim typing. Do not expose a verdict whose provenance is not yet modelled internally.

The sweep found six products generating decks and none publishing what was checked. The product's validator is its differentiator, and a differentiator nobody can call is a feature; a differentiator other tools depend on is a position. A read-only `/api/v1` already exists, so the surface is an extension rather than a new system.

### Scope

- [ ] Accept a decklist and a format, and return the deterministic verdict: legality, colour identity, singleton, banlist, Game Changers, bracket inputs.
- [ ] Return the rule and the data date behind every judgement, never a bare boolean.
- [ ] Version the contract, and keep an older version answering while a newer one exists.
- [ ] Rate-limit and authenticate per consumer, with a documented quota.
- [ ] Publish no recommendation through this surface. Verification only.
- [ ] State in every verdict that no language model produced it, and link the AI-use disclosure page planned in I-02. On r/EDH undisclosed AI is now a reason to dismiss a tool (I-02's 2026-11-09 findings), so a verdict that is visibly model-free is the form of the product that community accepts.
- [ ] After slice 3, an MCP adapter under the same key and quota exposes verification tools only:
  - legality;
  - colour identity;
  - singleton;
  - the Game Changer count;
  - bracket inputs;
  - Spellbook combos with data dates.

  Every answer states that no model produced it ([D-54](../owner-decisions.md#product-scope-and-non-goals)). Players paste lists into assistants that "confidently make up mana costs" ([xoPLA.NET](https://xopla.net/posts/a-little-tool-to-make-ai-better-at-magic-the-gathering-deckbuilding), 2025-11-09). Whether such answers count as proxying Scryfall data is [L-21](../legal-questions.md#l-21-proxying-repackaging-and-our-own-api-terms-scryfall). Added 2026-11-11.

### Definition of done

A third party submits a list and receives a versioned, dated, rule-level verdict that matches what the product shows its own players for the same list.

---

