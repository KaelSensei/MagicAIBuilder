# Combos

Which combos a deck holds, as [Commander Spellbook](https://commanderspellbook.com/) lists them.
This is the pilot context of the modular monolith
([ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md)); its terms are in
[CONTEXT.md](../../../CONTEXT.md#combos).

This README is a stub written with the move into `src/modules/` (CMB-02). The technical
documentation and the functional doc follow in CMB-07.

## Layers

| Folder            | Holds                            | Files                                                                                                                                                                                                       |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions | `deck-query.ts`: the card list one lookup is for, its bounds, its schema and its canonical form. `lookup-policy.ts`: the per-client and per-server rate limits                                              |
| `infrastructure/` | Server-only adapters             | `find-my-combos.ts`: one Spellbook `find-my-combos` call per deck, mapped to the combos the deck holds. `combo-cache.ts`: the per-instance 6-hour cache. `fixtures/find-my-combos-v1.ts`: a recorded answer |
| `client/`         | Browser code                     | `api.ts`: `fetchCombosForDeck`, the client of `POST /api/combos`, and the `SpellbookVariant` combo shape. `useCombos.ts`: the TanStack Query hook                                                           |
| `ui/`             | React components                 | `CombosPanel.tsx`                                                                                                                                                                                           |
| `application/`    | Use cases (none yet)             | `src/app/api/combos/route.ts` still sequences the parse, the cache, the Spellbook budget and the call (CMB-04 moves that into a use case)                                                                   |

A lookup runs: builder page → `useCombos` → `fetchCombosForDeck` → `POST /api/combos` →
`normalizeDeckComboQuery` → `readCachedCombos` → the Spellbook budget → `requestDeckCombos` →
Commander Spellbook.

## Entry points

Other code reaches the context only through these files, or the panel by its path
([ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md)).

| File             | Exports                                                                                  | Used by                                      |
| ---------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| `index.ts`       | The card-list bounds, `deckComboQuerySchema`, `normalizeDeckComboQuery`, the rate limits | `POST /api/combos`                           |
| `server.ts`      | `readCachedCombos`, `storeCachedCombos`, `requestDeckCombos` (`import "server-only"`)    | `POST /api/combos`                           |
| `client.ts`      | `useCombos`, `fetchCombosForDeck`, the `SpellbookVariant` type                           | the builder page, bracket scoring, the route |
| `ui/CombosPanel` | `CombosPanel`, imported by path                                                          | the builder page                             |

`pnpm arch` checks the boundary: `combos-through-entry-points` warns on a deep import from code
outside `src/modules/` until the series closes (CMB-08 raises it to an error), and
`public-api-only` already rejects one from another context.

## Known gaps

- `SpellbookVariant` is declared in `client/api.ts`, so `infrastructure/` and bracket scoring take
  a type from the client side. CMB-03 publishes a `Combo` type in `domain/`.
- `domain/deck-query.ts` holds the Zod schema of the request body; the target keeps Zod at the
  route and in adapters (ADR 0003, "parse once").
