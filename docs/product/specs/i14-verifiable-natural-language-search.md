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
