# Combos

> **Kind:** supporting. **Functional doc:** [docs/functional/combos.md](../../../docs/functional/combos.md).
> **Glossary:** [CONTEXT.md, Combos](../../../CONTEXT.md#combos).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md) (modular monolith; this is the pilot context),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md) (entry points),
> [ADR 0003](../../../docs/adr/0003-domain-as-readonly-data-and-pure-functions.md) (readonly domain),
> [ADR 0004](../../../docs/adr/0004-anti-corruption-layers-for-external-providers.md) (anti-corruption layer),
> [ADR 0005](../../../docs/adr/0005-testing-strategy-fakes-contracts-and-characterization.md) (fakes, contracts, characterization).

Which combos a deck holds, as [Commander Spellbook](https://commanderspellbook.com/) lists them.
A **combo** is a set of cards that produce a notable result together; only the combos the deck
fully contains count. The context answers one question for the builder page and for bracket
scoring: "which Spellbook combos can this list assemble, and which of them are two-card infinite
lines?"

## Responsibilities

- Turn a deck's card list into one Spellbook `find-my-combos` call, and that call's answer into
  `Combo` values the rest of the app can show and count.
- Keep that call cheap and rare: a canonical form of the list, a server cache, a per-server
  Spellbook budget and a per-client lookup limit.
- Decide which combos read as infinite, and which count as a two-card combo for the bracket
  estimate.
- Show the result in the builder's combo panel, with Spellbook credited.

Not owned here: the bracket estimate itself (`lib/deck/bracket.ts`, deck-analysis context) and
the official bracket table it applies (`lib/constants/brackets.ts`, format-rules context). The
combos context only tells them which combos count.

## Layers

| Folder            | Holds                                | Files                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions     | `combo.ts`: the `Combo` a deck holds and `isTwoCardInfiniteCombo`, the policy bracket scoring applies to it. `deck-query.ts`: the card list one lookup is for, its bounds, its schema and its canonical form. `lookup-policy.ts`: the per-client and per-server rate limits.                                                                                                             |
| `application/`    | The use case and its ports           | `ports.ts`: `ComboCache`, `ComboSourceBudget` and `ComboSource`, with `DeckCombosResult`, what one source call came to. `lookup-deck-combos.ts`: `makeLookupDeckCombos(ports)`, the lookup: canonical form, cache, budget, source, cache write.                                                                                                                                          |
| `infrastructure/` | Server-only adapters                 | `spellbook-variant.ts`: the fields of Spellbook's `Variant` this app reads and `toCombo`, the mapper at the anti-corruption boundary. `find-my-combos.ts`: one `find-my-combos` call per deck; `spellbookComboSource` is it as the `ComboSource` port. `combo-cache.ts`: the per-instance 6-hour cache as `ComboCache`. `spellbook-budget.ts`: `spellbookBudget` as `ComboSourceBudget`. |
| `client/`         | Browser code                         | `api.ts`: `fetchCombosForDeck`, the typed client of `POST /api/combos`. `useCombos.ts`: the TanStack Query hook, which holds the ten-card minimum and builds the list from the deck.                                                                                                                                                                                                     |
| `ui/`             | React components                     | `CombosPanel.tsx`: the panel the builder page renders.                                                                                                                                                                                                                                                                                                                                   |
| `testing/`        | Test support, imported by tests only | `in-memory-combo-source.ts`: the `ComboSource` fake. `combo-source-contract.ts`: the port's contract suite. `spellbook-msw.ts`: the MSW handlers that stand in for Spellbook.                                                                                                                                                                                                            |

The recorded Spellbook exchange lives in `infrastructure/fixtures/find-my-combos-v1.ts`.

## Public API

Other code reaches the context only through three entry points, or the panel by its path
([ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md)).
`entry-points.test.ts` pins the runtime export list of each file.

| Entry            | Exports                                                                                                                                                                                                                                                    | May be imported by                                                                      | Used today by                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `index.ts`       | `Combo`, `ComboPrerequisites`, `isTwoCardInfiniteCombo`, `MAX_MAIN_CARDS`, `MAX_QUERY_BODY_BYTES`, `deckComboQuerySchema`, `normalizeDeckComboQuery`, `DeckComboQuery`, `COMBO_LOOKUPS_PER_CLIENT`, `COMBO_LOOKUP_WINDOW_MS`, `SPELLBOOK_CALLS_PER_WINDOW` | Anything: server, browser and Edge middleware. Pure data and functions only             | `POST /api/combos`, bracket scoring (`lib/deck/bracket.ts`, `hooks/useBracketScore.ts`) |
| `server.ts`      | `lookupDeckCombos`, wired with the real adapters; the types `LookupDeckCombos`, `LookupDeckCombosResult`, `DeckCombosFailure`                                                                                                                              | Server code only (`import "server-only"`): route handlers, Server Components, use cases | `POST /api/combos`                                                                      |
| `client.ts`      | `useCombos`, `fetchCombosForDeck`                                                                                                                                                                                                                          | Client Components and hooks                                                             | the builder page                                                                        |
| `ui/CombosPanel` | `CombosPanel`                                                                                                                                                                                                                                              | Client Components, by path `@/modules/combos/ui/CombosPanel`                            | the builder page                                                                        |

Inside the context, layers import downwards only: `ui/` and `client/` read `domain/`;
`application/` reads `domain/`; `infrastructure/` reads `domain/` and the port types in
`application/`; nothing reads `infrastructure/` except `server.ts`. `pnpm arch` checks the
boundary: `combos-through-entry-points` warns on a deep import from code outside `src/modules/`
until CMB-08 raises it to an error, and `public-api-only` already rejects one from another
context.

## Data flow

One lookup, from the builder page to Commander Spellbook and back:

```mermaid
sequenceDiagram
  participant Page as builder page
  participant Hook as useCombos (client)
  participant Route as POST /api/combos
  participant UseCase as lookupDeckCombos (application)
  participant Cache as ComboCache
  participant Budget as ComboSourceBudget
  participant Source as ComboSource (find-my-combos)
  participant SB as Commander Spellbook

  Page->>Hook: deck
  Note over Hook: fewer than 10 names: no request
  Hook->>Route: { commanders, main } (15 s timeout)
  Note over Route: per-client limit (429), body size (413), Zod (400)
  Route->>UseCase: validated list
  Note over UseCase: canonical form; empty list answers []
  UseCase->>Cache: read
  alt fresh entry
    Cache-->>UseCase: combos
  else miss or expired
    UseCase->>Budget: take
    alt budget spent
      Budget-->>UseCase: retryAfterMs
      UseCase-->>Route: budget-exhausted (503 + Retry-After)
    else
      UseCase->>Source: findCombos(list)
      Source->>SB: POST /find-my-combos (10 s timeout)
      SB-->>Source: { results: { included: Variant[] } }
      Note over Source: validate, toCombo, infinite first
      Source-->>UseCase: found | timeout | unexpected-body | failed
      UseCase->>Cache: store (found only)
      UseCase-->>Route: ok | upstream-failed (504 or 502)
    end
  end
  Route-->>Hook: { combos } or { error }
  Hook-->>Page: data, isLoading, isError, dataUpdatedAt
  Page->>Page: CombosPanel and useBracketScore(deck, combos)
```

The route maps the use-case result to HTTP: `ok` → 200 `{ combos }`; `budget-exhausted` → 503
with `Retry-After`; `upstream-failed` → 504 on a Spellbook timeout, 502 for an error status or a
body of another shape. The hook treats any non-200 as an error and never retries. The panel then
says the check did not run, which is not the same as "no known combos".

## Ports and adapters

The use case depends on three ports, all taking a list already in canonical form
(`application/ports.ts` states each contract):

| Port                | Guarantees                                                                                                                                                                | Production adapter                                                                                  | Test double                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ComboCache`        | `read` is `null` for an unknown or expired list; only successes are stored; commanders and main deck are kept apart in the key                                            | `comboCache` (`combo-cache.ts`): per-instance `Map`, 6 h, 500 entries, SHA-256 of the canonical key | in-memory fake in `lookup-deck-combos.test.ts` (never expires)                       |
| `ComboSourceBudget` | `take` counts one call and says whether it fits; a refused take spends nothing and tells how long to wait; cache hits never reach it                                      | `spellbookBudget` (`spellbook-budget.ts`): 60 per minute per instance over `lib/rate-limit.ts`      | in-memory fake in `lookup-deck-combos.test.ts` (refuses for a fixed 30 s)            |
| `ComboSource`       | One call per list; `found` holds only the combos the deck fully contains; every failure is a value, never a throw; a failure is not remembered; the list is sent as given | `spellbookComboSource` (`find-my-combos.ts`)                                                        | `inMemoryComboSource()` (`testing/`), both run through `describeComboSourceContract` |

`server.ts` is the composition root: it wires the three production adapters into
`lookupDeckCombos` once per server process.

## Invariants

| Invariant                                                                                                           | Source                                                                                                                                                                      | Pinned by                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Spellbook's wire shape never leaves `infrastructure/`; the app reads `Combo`                                        | ADR 0004                                                                                                                                                                    | `spellbook-variant.test.ts`, `entry-points.test.ts`                                                            |
| Two lists with the same cards in the same roles share one cache entry and one Spellbook call                        | Product: Spellbook matches names case-insensitively                                                                                                                         | `deck-query.test.ts`, `lookup-deck-combos.test.ts`, `route.test.ts` "serves the same card list from the cache" |
| A lookup that failed is reported as a failure, never as "no combos"; failures are not cached                        | Product: "no known combos" is a finding                                                                                                                                     | `api.test.ts`, `useCombos.test.ts`, `CombosPanel.test.tsx`, `lookup-deck-combos.test.ts`                       |
| Only `included` combos are shown; the "almost included" buckets are dropped                                         | Product                                                                                                                                                                     | `find-my-combos.test.ts`, `find-my-combos.replay.test.ts`                                                      |
| A two-card combo for bracket scoring is an infinite combo with exactly two named cards; it floors the estimate at 3 | Wizards' bracket text of 2025-10-21 ([source](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025)); a list cannot show the turn | `combo.test.ts`, `lib/deck/bracket-two-card-combos.test.ts`                                                    |
| The server never spends more than 60 Spellbook calls per minute per instance                                        | Spellbook API root: 80 per minute "should be a safe rate" ([source](https://backend.commanderspellbook.com/), read 2026-11-12)                                              | `route.test.ts` "stops calling Spellbook once this server's shared budget is spent"                            |

## Persistence and providers

No table. The cache is a per-instance `Map` (`combo-cache.ts`); a cold instance asks Spellbook
again, and two instances hold two caches and two budgets.

Commander Spellbook, `POST https://backend.commanderspellbook.com/find-my-combos`
(schema at <https://backend.commanderspellbook.com/schema/>, API 7.3.6, read 2026-11-09):

- Limits: no hard published limit; the API root calls 80 requests per minute a safe rate, asks for
  sparse use and for clients to handle 429 (<https://backend.commanderspellbook.com/>, read
  2026-11-12). The context spends at most 60 per minute per instance.
- Timeout: 10 s on the server (`SPELLBOOK_TIMEOUT_MS`), under the browser's 15 s
  (`COMBO_FETCH_TIMEOUT_MS`) so the route always answers first.
- Failure behaviour: an error status, a timeout and a body of another shape each come back as a
  `DeckCombosResult` value; the route logs one warning and answers 502 or 504; nothing is cached.
- Recorded fixture: `infrastructure/fixtures/find-my-combos-v1.ts`, a verbatim answer recorded on
  2026-11-09 for a Kenrith list with three `included` variants (a generic extra piece, a notable
  prerequisite, mana needed) and one `almostIncluded` variant kept.

## Testing

The strategy follows [ADR 0005](../../../docs/adr/0005-testing-strategy-fakes-contracts-and-characterization.md):

- **Characterization (CMB-01).** `client/useCombos.replay.test.tsx` replays the recorded lookup end
  to end from the hook through the real route handler to an MSW Spellbook, with no module mocked.
  Tests named "currently …(pinned; see B2-43)" pin today's behaviour that a later slice will flip:
  the ten-card minimum counts rows, not copies, and leaves the companion out.
  `infrastructure/find-my-combos.replay.test.ts` pins the request shape, the "sends names as given"
  rule, the dropped `almostIncluded` bucket and each failure path.
- **Contract suite (CMB-05).** `testing/combo-source-contract.ts` runs twice:
  `testing/in-memory-combo-source.test.ts` against the fake and
  `infrastructure/find-my-combos.contract.test.ts` against `spellbookComboSource` behind MSW. It
  does not pin what the two honestly differ on: a combo's `description` (the adapter's wording
  rule) and the order of the combos (the adapter sorts infinite first, then fewer cards), both
  pinned in `infrastructure/find-my-combos.test.ts`.
- **Solitary tests** on the pure policies: `domain/combo.test.ts`, `domain/deck-query.test.ts`,
  `infrastructure/spellbook-variant.test.ts`, `infrastructure/combo-cache.test.ts`.
- **Sociable tests** at the stable boundaries: `application/lookup-deck-combos.test.ts` with the
  three fakes, `src/app/api/combos/route.test.ts` with MSW, `ui/CombosPanel.test.tsx` with the real
  message catalogs.
- **Replay fixtures.** All Spellbook traffic in tests is the recording or a variation of it, served
  by `testing/spellbook-msw.ts`. No `fetch` stub.
- **Mutation testing (CMB-06).** A nightly, advisory Stryker run over the domain folders; its
  configuration and summary script arrive with CMB-06.
- **No E2E spec** exercises the panel; `useCombos.replay.test.tsx` is the end-to-end check short
  of a browser.

## Known gaps

- Two ten-card thresholds: `client/useCombos.ts` counts commander, partner and main-deck names;
  the builder page gates the panel on `deck.cards.length`, which counts every zone. A deck of ten
  rows with some in the maybeboard shows "No known combos detected" while no lookup ran. B2-43
  unifies them (OD-07: one threshold, names in main deck and command zone).
- The companion is not sent and not counted toward the ten cards (`client/useCombos.ts`); OD-07
  decided to include it, B2-43 does it.
- `isTwoCardInfiniteCombo` counts named cards only: Hullbreaker Horror + Sol Ring counts as two
  cards though Spellbook lists a third generic piece. Roadmap I-77 reviews the reading.
- Infinity is a keyword heuristic over Spellbook's effect names (`spellbook-variant.ts`): "Each
  opponent loses the game" is missed, "You can't lose the game …" is counted. Both pinned, no B2
  row.
- `domain/deck-query.ts` holds the Zod schema of the request body; the target keeps Zod at the
  route and in adapters (ADR 0003, "parse once").
- `ComboCache` and `ComboSourceBudget` have in-memory fakes in
  `application/lookup-deck-combos.test.ts` only, with no contract suite against `comboCache` and
  `spellbookBudget`.
- `docs/engineering/architecture.md` still sketches this folder with its planned file names
  (`find-deck-combos.ts`, `spellbook-client.ts`, `use-combos.ts`); K-09 refreshes it.
