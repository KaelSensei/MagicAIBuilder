# Spec: Verifiable Natural-Language Search (I-14)

> **Initiative:** [I-14 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Owns:** turning a description into a readable Scryfall query. **Does not own:** building or changing a deck — that stays in I-02.

## Overview

A player describes a card function in English or French. The product writes **one Scryfall query**, shows it before running it, lets the player edit it, and returns only what that query returns. The query is the contract: what the player reads is what the search executes.

## What the market does

Natural-language card search is a crowded space as of 2026-11-08. Every row below was read from the product's own public pages; treat each as a claim to confirm before it justifies scope.

| Product                                           | What it does                                                                            | What it does not state                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **OffMeta** (offmeta.app)                         | Plain-English card search, and the player can **inspect and edit the generated search** | No deck context; English only                         |
| **Farseek** (farseek.ai)                          | Writes the Scryfall query from a description and returns real cards                     | Query editing is not advertised; English only         |
| **DeckCheck** Smart Search (deckcheck.co)         | Plain English to a Scryfall query, inside the deck editor                               | Does not state that the query is shown before it runs |
| **Imskir** (Chrome extension, updated 2026-03-30) | Translates descriptions into Scryfall syntax in the browser                             | Not deck-aware; a separate surface from any builder   |
| **CardMystic**, **Find That Card**                | Describe-and-find engines; Find That Card adds Scryfall Tagger art and function tags    | No deck context; English only                         |

**The honest conclusion.** "Show the query" is **not** a differentiator — OffMeta already does it. Two things remain genuinely unoccupied:

1. **Deck context survives the translation.** None of these tools states that the active format, colour identity and legality of the open deck constrain both the generated query and the player's edited version.
2. **French.** Every tool above is English-only. The product already ships a reviewed French catalogue, and Commander is large in France.

Scope the initiative around those two, not around the translation itself.

## Current state in this codebase

- `src/lib/scryfall/client.ts` — `searchCards(query, page)` sends raw Scryfall syntax, caches results for 1 h in the DB, and serialises calls behind a 100 ms mutex.
- `src/components/search/SearchBar.tsx`, `SearchFilters.tsx`, `SetAutocomplete.tsx` — syntax and filter driven search.
- There is **no** natural-language layer anywhere, and no place where a query string is surfaced to the player as an editable artifact.

## Functional requirements

### 1. One query, shown before it runs

1.1 A description in English or French produces exactly **one** Scryfall query string.
1.2 The query is displayed in full, in a monospace field, **before** any request to Scryfall.
1.3 Running the search is an explicit action. Nothing is fetched while the player is still typing the description.
1.4 If the model cannot produce a query, say so and leave the syntax search untouched. Never fall back to a guessed query.

### 2. The query is editable, and the edit wins

2.1 The player can edit the query text freely.
2.2 An edited query runs verbatim. The description is not re-translated behind the player's back.
2.3 Editing the description after an edit discards the edited query only after an explicit confirmation.

### 3. Deck context is preserved on both paths

3.1 When a deck is open, the generated query carries its format legality and the commander's colour identity.
3.2 The same context is re-applied to an **edited** query. An edit that would widen beyond the deck's colour identity is shown as a warning, not silently corrected.
3.3 A player can disable the context for one search; the field states that results may be illegal in the open deck.

### 4. Results come only from Scryfall

4.1 Every returned card comes from the executed query's response. No card name is ever produced by the model.
4.2 A query returning nothing shows the empty state and the query that produced it, so the player can edit rather than retry blindly.

### 5. Both languages, and a way back

5.1 French and English descriptions are supported, with regression coverage per language.
5.2 A visible control returns to syntax-only search and keeps the current results.

## Data and API

- New route `POST /api/search/translate` → `{ query: string, context: { format, colorIdentity } }`. Server-side only; the provider key never reaches the browser.
- The route returns the query **only**. It never returns cards: card data comes from the existing Scryfall path, so the cache, the rate limiter and the headers stay in one place.
- Rate limit per account, reusing the existing AI rate-limit middleware.

## Non-goals

- Generating or modifying a deck. That is I-02.
- Teaching Scryfall syntax. The query is shown to be verified and edited, not as a tutorial.
- Supporting languages beyond English and French before I-11 activates a third locale.
- Caching translations across accounts: a description can carry private deck context.

## Testing strategy

- **Solitary:** a fixed description with a fixed provider response produces a stable query string, per language.
- **Contract:** the translate route never returns card names; a response containing them fails the test.
- **Sociable:** with a deck open, the generated query carries its colour identity; an edited query that drops it raises the warning and still runs.
- **Regression:** a French description and its English equivalent produce queries that return the same card set for a fixed corpus.

## Delivery slices

| #   | Slice                                                                   | Depends on |
| --- | ----------------------------------------------------------------------- | ---------- |
| 1   | Translate route + query display, English, no deck context               | —          |
| 2   | Editable query, explicit run, empty-state with the query visible        | 1          |
| 3   | Deck context on generated and edited queries, with the widening warning | 2          |
| 4   | French support and per-language regression set                          | 1          |
| 5   | Return-to-syntax control and the disable-context escape hatch           | 3          |

Slices 1-2-3 are one chain; slice 4 is independent of 2 and 3 and can run in parallel.

## Open questions

- Which provider writes the query? Reusing I-02's Claude path keeps one key and one rate limiter, but a smaller model may be enough and cheaper for a one-line translation.
- Should a generated query be stored on the deck as a saved search? That would make it a shareable artifact, which is appealing but adds a persistence surface this initiative does not currently need.

## Fourteenth pass (2026-11-14)

Mana Grove's Grover page, updated 2026-11-11 and read 2026-11-14, describes Scry as a search that ranks cards by what they do when the player does not know the name ([page](https://themanagrove.com/ai-deck-builder)). The page does not say the player sees the query. Its pricing page says that when the monthly Scry allowance is used up, "search keeps working with keyword results" ([pricing](https://themanagrove.com/pricing)). This initiative's rule is the opposite of a hidden ranking: the player sees one Scryfall query, can edit it, and the results are what that query returns.

#### US-14-14-01

As a player who described a card in a sentence, I want the Scryfall query on screen before any search runs, so that a ranked list I cannot read is not the answer.

#### US-14-14-02

As a player who has used a monthly allowance, I want the syntax search to keep working, so that a cap on a model does not turn search off.

**Passing.** The description "instants that destroy artifacts" produces one query the player can read and edit. Nothing is fetched until the player runs that query. The cards on screen are the query's cards. If a model allowance is exhausted, the query box and the syntax search still work, and the page says the ranked wording is paused.

**Non-passing.** A list of cards with no query. A search that runs before the player has seen the query. A keyword fallback that is a second, hidden ranking. A monthly cap on the syntax search itself. Mana Grove meters Scry and then falls back to keywords. The metered part, if this product ever has one, is the model that writes the query, and I-30 owns that allowance. The search the player runs is free.

**Acceptance.** Slices 1 and 2 already require the query on screen and an explicit run. This pass adds the exhausted-allowance case to the acceptance of slice 2: the query display and the syntax run do not call the model.

**Open question.** Mana Grove's page does not show a worked Scry query, so it is not evidence that they hide one. It is evidence that a ranked plain-language search is being sold beside a deck builder. The question of which model writes our query stays the open question above.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

### Goals

- For a fixed description and deck context, the player sees one Scryfall query, can change it, and receives only cards that query returns, with the legality context unchanged.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-14-01

As a player who can describe a card but not Scryfall's syntax, I want to read and edit the query before it runs, so that the search cannot invent a card.

#### US-14-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-14-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-14-01 Happy path

Given a signed-in player and the English locale
When an English or French description becomes one query the player sees before any search.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-14-02 Happy path

Given a signed-in player and the English locale
When editing the query and running it returns only cards that query returns.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-14-03 Happy path

Given a signed-in player and the English locale
When the deck's format and colour identity stay on the query unless the player removes them.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-14-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-14-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-14-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Signed-out and signed-in. The translator is behind a flag defaulting to off until the query-visible test is green. Guests can run it. It does not call the deck model.

#### AC-14-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-14-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-14-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The query is a text field, not a hidden step. A control returns to syntax-only search. #1369 is the open implementation and is not on `dev`.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

The search route gains a translate step that returns the query string and does not add cards. No deck write.

### Analytics and telemetry

`search_query_run {origin: typed or translated, edited: yes or no, locale: en or fr}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Signed-out and signed-in. The translator is behind a flag defaulting to off until the query-visible test is green. Guests can run it. It does not call the deck model.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether tag lists may be shown is the same licence question as I-37, I-54 and I-65.

### Sources

- https://www.reddit.com/r/EDH/comments/1k0ih2q/
- https://www.reddit.com/r/EDH/comments/1lc7cu9/
- https://www.reddit.com/r/EDH/comments/1wxxui2/
- https://www.reddit.com/r/EDH/comments/1q8czkc/
- https://edhrec.com/articles/changelog-big-performance-upgrades

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-14-101

As a player, I want the product to translate an English or French description into one Scryfall query the player can read before any search runs., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Translate an English or French description into one Scryfall query the player can read before any search runs.

#### AC-14-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-102 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-14-102

As a player, I want the product to let the player edit that query, and run the edited text., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Let the player edit that query, and run the edited text.

#### AC-14-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-14-103

As a player, I want the product to return only cards the executed Scryfall query produces., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Return only cards the executed Scryfall query produces. Invent no card names.

#### AC-14-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-14-104

As a player, I want the product to preserve the active format, color-identity and legality context on the generated query and on the edited query., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Preserve the active format, color-identity and legality context on the generated query and on the edited query.

#### AC-14-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-14-105

As a player, I want the product to cover both languages with regression tests, and offer an explicit return to syntax-only search., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Cover both languages with regression tests, and offer an explicit return to syntax-only search.

#### AC-14-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-14-106

As a player, I want the product to leave the current deck unchanged., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Leave the current deck unchanged. This flow does not add or cut cards.

#### AC-14-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-14-107

As a player, I want the product to show a card's Scryfall Tagger function tags in the builder as clickable search facets, and offer "find similar cards" as a visible, editable otag: query built from those tags., so that a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

#### AC-14-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Show a card's Scryfall Tagger function tags in the builder as clickable search facets, and offer "find similar cards" as a visible, editable otag: query built from those tags. No model is involved. Before building, confirm how a card's tag list can be read under Scryfall's terms: otag: works in Scryfall search, but whether tag lists are exposed in the API or bulk data was not verified.

#### AC-14-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-14-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

| State            | What the player sees                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty            | A sentence that names what is missing and the next action. No invented row, author, price or score.                                                   |
| Loading          | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready.                                        |
| Error            | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there.                                                       |
| Partial          | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished.                                                 |
| Stale            | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed.                                             |
| Guest            | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401.               |
| Signed-in        | Writes go to that account only. Another player's notes, budget and collection are not in the response.                                                |
| English          | New controls use the `en` catalogue.                                                                                                                  |
| French           | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control.                                                         |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard         | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes.                         |
| Screen reader    | Each new control has an accessible name. A status change is announced in words, not only by colour.                                                   |
| Colour           | A warning and an error differ by text or icon as well as hue, in both themes.                                                                         |
| Success          | The completed action is confirmed in words. A second identical action does not duplicate the write.                                                   |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-14: Verifiable Natural-Language Search

**Spec:** [`specs/i14-verifiable-natural-language-search.md`](i14-verifiable-natural-language-search.md)

**Outcome:** a player can describe a card function in English or French, read the Scryfall query that search will run, edit it, and get the cards that query returns.

**Status:** Next
**Priority:** Next
**Impact / effort:** High / medium

This is search, not a new deck generator. DeckCheck Smart Search and Farseek are the references. I-02 still owns constrained deck plans.

### Scope

- [ ] Translate an English or French description into one Scryfall query the player can read before any search runs.
- [ ] Let the player edit that query, and run the edited text.
- [ ] Return only cards the executed Scryfall query produces. Invent no card names.
- [ ] Preserve the active format, color-identity and legality context on the generated query and on the edited query.
- [ ] Cover both languages with regression tests, and offer an explicit return to syntax-only search.
- [ ] Leave the current deck unchanged. This flow does not add or cut cards.
- [ ] Show a card's Scryfall Tagger function tags in the builder as clickable search facets, and offer "find similar cards" as a visible, editable `otag:` query built from those tags. No model is involved. Before building, confirm how a card's tag list can be read under Scryfall's terms: `otag:` works in Scryfall search, but whether tag lists are exposed in the API or bulk data was not verified.
  - Answered 2026-11-10: Scryfall's bulk data carries an Oracle Tags file from Tagger, 4,617 tags on 36,453 Oracle IDs (status note, seventh pass). Whether the product may show them is the licence question shared by I-37, I-54 and [I-65](i65-how-this-deck-wins.md).

**Demand evidence (2026-11-09):** search by function rather than popularity is a loud, recurring request on r/EDH, and no initiative named Tagger before this. ["Scryfall cheat sheet or: How I Learned to Stop Using EDHRec"](https://www.reddit.com/r/EDH/comments/1k0ih2q/) reached 909 points (April 2025), ["PSA: Check the scryfall tagger"](https://www.reddit.com/r/EDH/comments/1lc7cu9/) 425 (June 2025) and ["PSA: Viewing Scryfall Tags to Find Similar Cards"](https://www.reddit.com/r/EDH/comments/1wxxui2/) 246 (October 2026). A browser extension, MoxTags, adds Scryfall tags to Moxfield, and Archidekt has applied Oracle tags as categories since July 2026. Players reject AI search tools that hide their query; under OffMeta, a commenter asked for each part of the generated query to be shown as an editable assumption ([January 2026](https://www.reddit.com/r/EDH/comments/1q8czkc/)), which is this initiative's design.

**Twelfth pass, 2026-11-11:** #1369 implements this initiative and is open, not merged. EDHREC's 6 November 2026 changelog added colour-identity filters on card pages and said narrowing the identity makes Lift more specific ([changelog](https://edhrec.com/articles/changelog-big-performance-upgrades)). The scope item that keeps the deck's colour identity on the generated query is the same job. Done still means the player sees the query before it runs.

### Enrichment (2026-11-11)

**User story.** As a player who can describe a card but not Scryfall's syntax, I want to read and edit the query before it runs, so that the search cannot invent a card.

**Acceptance.**

- An English or French description becomes one query the player sees before any search.
- Editing the query and running it returns only cards that query returns.
- The deck's format and colour identity stay on the query unless the player removes them.

**UX.** The query is a text field, not a hidden step. A control returns to syntax-only search. #1369 is the open implementation and is not on `dev`.

**Data and API.** The search route gains a translate step that returns the query string and does not add cards. No deck write.

**i18n and access.** The description may be English or French. The query itself stays Scryfall's syntax, which is not translated. Failures use a message-catalogue code.

**Telemetry.** `search_query_run {origin: typed or translated, edited: yes or no, locale: en or fr}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Signed-out and signed-in. The translator is behind a flag defaulting to off until the query-visible test is green. Guests can run it. It does not call the deck model.

**Open questions.** Whether tag lists may be shown is the same licence question as I-37, I-54 and I-65.

### Definition of done

For a fixed description and deck context, the player sees one Scryfall query, can change it, and receives only cards that query returns, with the legality context unchanged.

---
