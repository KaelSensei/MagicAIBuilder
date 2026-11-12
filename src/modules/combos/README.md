# Combos

Which combos a deck holds, as [Commander Spellbook](https://commanderspellbook.com/) lists them.
This is the pilot context of the modular monolith
([ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md)); its terms are in
[CONTEXT.md](../../../CONTEXT.md#combos).

This README is a stub written with the move into `src/modules/` (CMB-02). The technical
documentation and the functional doc follow in CMB-07.

## Layers

| Folder            | Holds                                | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions     | `combo.ts`: the `Combo` a deck holds and `isTwoCardInfiniteCombo`, the policy bracket scoring applies to it. `deck-query.ts`: the card list one lookup is for, its bounds, its schema and its canonical form. `lookup-policy.ts`: the per-client and per-server rate limits                                                                                                                                                                                                                                                                                 |
| `infrastructure/` | Server-only adapters                 | `spellbook-variant.ts`: the fields of Spellbook's `Variant` this app reads and `toCombo`, the mapper at the anti-corruption boundary. `find-my-combos.ts`: one Spellbook `find-my-combos` call per deck, mapped to the combos the deck holds; `spellbookComboSource` is it as the `ComboSource` port. `combo-cache.ts`: the per-instance 6-hour cache; `comboCache` is it as the `ComboCache` port. `spellbook-budget.ts`: `spellbookBudget`, the `ComboSourceBudget` port over the shared rate limiter. `fixtures/find-my-combos-v1.ts`: a recorded answer |
| `client/`         | Browser code                         | `api.ts`: `fetchCombosForDeck`, the client of `POST /api/combos`, which parses the answer as `Combo`. `useCombos.ts`: the TanStack Query hook                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ui/`             | React components                     | `CombosPanel.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `application/`    | Use cases and ports                  | `ports.ts`: `ComboCache`, `ComboSourceBudget` and `ComboSource`, with `DeckCombosResult`, what one source call came to. `lookup-deck-combos.ts`: `makeLookupDeckCombos(ports)`, the lookup: canonical form, cache, budget, source, cache write; its result is `ok`, `budget-exhausted` or `upstream-failed`                                                                                                                                                                                                                                                 |
| `testing/`        | Test support, imported by tests only | `in-memory-combo-source.ts`: `inMemoryComboSource()`, the `ComboSource` fake. `combo-source-contract.ts`: `describeComboSourceContract(makeHarness)`, the port's contract suite, with the recorded deck and the combos it maps to. `spellbook-msw.ts`: the MSW handlers that stand in for Spellbook's `find-my-combos`                                                                                                                                                                                                                                      |

A lookup runs: builder page → `useCombos` → `fetchCombosForDeck` → `POST /api/combos` (rate
limit, body size, Zod) → `lookupDeckCombos` → `normalizeDeckComboQuery` → `ComboCache.read` →
`ComboSourceBudget.take` → `ComboSource.findCombos` → Commander Spellbook → `ComboCache.store`. The
route maps the result to a response: `ok` → 200 `{ combos }`, `budget-exhausted` → 503 with
`Retry-After`, `upstream-failed` → 504 on a timeout and 502 otherwise.

## Entry points

Other code reaches the context only through these files, or the panel by its path
([ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md)).

| File             | Exports                                                                                                                                                             | Used by                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `index.ts`       | The `Combo` type, `isTwoCardInfiniteCombo`, the card-list bounds, `deckComboQuerySchema`, `normalizeDeckComboQuery`, the rate limits                                | `POST /api/combos`, bracket scoring (`lib/deck/bracket.ts`, `hooks/useBracketScore.ts`) |
| `server.ts`      | `lookupDeckCombos`, the use case wired with the real adapters (`import "server-only"`); the types `LookupDeckCombos`, `LookupDeckCombosResult`, `DeckCombosFailure` | `POST /api/combos`                                                                      |
| `client.ts`      | `useCombos`, `fetchCombosForDeck`                                                                                                                                   | the builder page                                                                        |
| `ui/CombosPanel` | `CombosPanel`, imported by path                                                                                                                                     | the builder page                                                                        |

`pnpm arch` checks the boundary: `combos-through-entry-points` warns on a deep import from code
outside `src/modules/` until the series closes (CMB-08 raises it to an error), and
`public-api-only` already rejects one from another context.

## Testing

The port tests follow [ADR 0005](../../../docs/adr/0005-testing-strategy-fakes-contracts-and-characterization.md):
an in-memory fake per owned port, one shared contract suite run against the fake and the real
adapter, and MSW in place of the network.

- `ComboSource` has both. `testing/in-memory-combo-source.ts` is the fake: a test seeds it with
  `knows(list, combos)` or `fails(failure)` and reads `queries`, the lists it was asked for.
  `application/lookup-deck-combos.test.ts` drives the use case with it.
  `testing/combo-source-contract.ts` pins what every source must do: the recorded deck comes back
  `found` with its three combos mapped (id, cards, effects, infinity, prerequisites); a deck without
  combos comes back `found` with none; each `DeckCombosFailure` comes back as a value, never a
  throw; a failure is not remembered once the upstream recovers. It runs twice:
  `testing/in-memory-combo-source.test.ts` against the fake, and
  `infrastructure/find-my-combos.contract.test.ts` against `spellbookComboSource` with MSW serving
  the recording, an HTTP error, a network error, a body of another shape and a request never
  answered.
- The contract does not pin what the fake and the adapter honestly do differently: a combo's
  `description` (the adapter's wording rule) and the order of the combos (the adapter sorts
  infinite ones first, then fewer cards), both pinned in `infrastructure/find-my-combos.test.ts`;
  nor canonical form, which the use case applies before the call. The adapter's request shape and
  its "sends names as given" rule stay in `infrastructure/find-my-combos.replay.test.ts`.
- A 200 answer that is not JSON is reported as `failed` with no status, like a network error. The
  replay test pins this; the contract reproduces `failed` with no status by a network error only.

## Known gaps

- `domain/deck-query.ts` holds the Zod schema of the request body; the target keeps Zod at the
  route and in adapters (ADR 0003, "parse once").
- `ComboCache` and `ComboSourceBudget` have in-memory fakes in
  `application/lookup-deck-combos.test.ts` only, with no contract suite against `comboCache` and
  `spellbookBudget`; the fake cache never expires and the fake budget refuses for a fixed 30 s.
- The cache, the budget and the client rate limit are each per server instance (`combo-cache.ts`,
  `spellbook-budget.ts`, `lib/rate-limit.ts`): a second instance has its own cache and its own 60
  Spellbook calls.
