# Combos

Which combos a deck holds, as [Commander Spellbook](https://commanderspellbook.com/) lists them.
This is the pilot context of the modular monolith
([ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md)); its terms are in
[CONTEXT.md](../../../CONTEXT.md#combos).

This README is a stub written with the move into `src/modules/` (CMB-02). The technical
documentation and the functional doc follow in CMB-07.

## Layers

| Folder            | Holds                            | Files                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions | `combo.ts`: the `Combo` a deck holds and `isTwoCardInfiniteCombo`, the policy bracket scoring applies to it. `deck-query.ts`: the card list one lookup is for, its bounds, its schema and its canonical form. `lookup-policy.ts`: the per-client and per-server rate limits                                                                       |
| `infrastructure/` | Server-only adapters             | `spellbook-variant.ts`: the fields of Spellbook's `Variant` this app reads and `toCombo`, the mapper at the anti-corruption boundary. `find-my-combos.ts`: one Spellbook `find-my-combos` call per deck, mapped to the combos the deck holds. `combo-cache.ts`: the per-instance 6-hour cache. `fixtures/find-my-combos-v1.ts`: a recorded answer |
| `client/`         | Browser code                     | `api.ts`: `fetchCombosForDeck`, the client of `POST /api/combos`, which parses the answer as `Combo`. `useCombos.ts`: the TanStack Query hook                                                                                                                                                                                                     |
| `ui/`             | React components                 | `CombosPanel.tsx`                                                                                                                                                                                                                                                                                                                                 |
| `application/`    | Use cases (none yet)             | `src/app/api/combos/route.ts` still sequences the parse, the cache, the Spellbook budget and the call (CMB-04 moves that into a use case)                                                                                                                                                                                                         |

A lookup runs: builder page → `useCombos` → `fetchCombosForDeck` → `POST /api/combos` →
`normalizeDeckComboQuery` → `readCachedCombos` → the Spellbook budget → `requestDeckCombos` →
Commander Spellbook.

## Entry points

Other code reaches the context only through these files, or the panel by its path
([ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md)).

| File             | Exports                                                                                                                              | Used by                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `index.ts`       | The `Combo` type, `isTwoCardInfiniteCombo`, the card-list bounds, `deckComboQuerySchema`, `normalizeDeckComboQuery`, the rate limits | `POST /api/combos`, bracket scoring (`lib/deck/bracket.ts`, `hooks/useBracketScore.ts`) |
| `server.ts`      | `readCachedCombos`, `storeCachedCombos`, `requestDeckCombos` (`import "server-only"`)                                                | `POST /api/combos`                                                                      |
| `client.ts`      | `useCombos`, `fetchCombosForDeck`                                                                                                    | the builder page                                                                        |
| `ui/CombosPanel` | `CombosPanel`, imported by path                                                                                                      | the builder page                                                                        |

`pnpm arch` checks the boundary: `combos-through-entry-points` warns on a deep import from code
outside `src/modules/` until the series closes (CMB-08 raises it to an error), and
`public-api-only` already rejects one from another context.

## Known gaps

- `domain/deck-query.ts` holds the Zod schema of the request body; the target keeps Zod at the
  route and in adapters (ADR 0003, "parse once").
