# Target structure — hexagonal modules on the Next.js App Router

Status: proposal, for the owner to approve before any production refactor.
Measured context: [audit-2026-11.md](audit-2026-11.md), `dev` at
`95b5197fd45cd716f72e6e2f4f6fc0d49d15060f`.
Decisions it builds on: [ADR 0001](../adr/0001-modular-monolith-by-bounded-context.md)
to [ADR 0005](../adr/0005-testing-strategy-fakes-contracts-and-characterization.md) and
[ADR 0009](../adr/0009-legality-is-a-report-and-the-server-owns-rules.md).

## The decision this plan asks the owner to confirm

The folder root stays **`src/modules/<context>/`**. The shape described as
`src/contexts/<context>/{domain,application,infrastructure,ui}` is the same shape. The
name `modules` is already the one in ADR 0001, in `eslint.config.mjs`, in
`.dependency-cruiser.cjs` and in the move codemod. Renaming it to `contexts` would be a
new ADR and a mechanical rewrite of those gates, with no change to dependencies.

Two additions sit on top of the ADRs, because the audit found gaps the ADRs name but do
not yet specify:

1. **One database transaction per use case that changes an aggregate, and a `version`
   integer on `Deck`.** That is the unit of work and the optimistic lock. There is no
   unit-of-work framework and no new dependency.
2. **A dependency-cruiser rule that `application/` cannot import Prisma, `fetch` or
   `infrastructure/`.** The current rules forbid that for `domain/` and for browser
   layers. They allow it for `application/`, and today the application code is the route
   handler, which imports Prisma freely (52 of 67 API routes).

This plan does **not** supersede ADR 0003. Aggregates, entities and value objects are
readonly data and pure functions, not classes. A class instance does not survive the
React Server Component boundary. The five classes in `src/` are error types. `effect` is
installed and imported by zero files; it is not the composition root.

If the owner wants class-based aggregates, that is a separate ADR. This series does not
start until that choice is explicit, and the recommendation is to keep ADR 0003.

## Tree

```text
src/
  app/                          driving adapters: pages, layouts, route handlers
  middleware.ts
  modules/
    <context>/
      domain/                   entities, value objects, pure rules, domain events as data
      application/              use cases and the ports they require
      infrastructure/           Prisma repositories, provider adapters, mappers
      client/                   browser API client, Zustand stores, TanStack Query hooks
      ui/                       React components
      testing/                  in-memory fakes, builders, contract suites (tests only)
      index.ts                  pure domain surface (server, browser, Edge)
      server.ts                 composition root: import "server-only", wired use cases
      client.ts                 client-safe hooks, stores, API client
      README.md
  components/ui/                shared kernel: visual primitives
  components/layout/            shared kernel: app shell
  lib/logger.ts                 shared kernel
  lib/db/prisma.ts              shared kernel: the client instance only
  lib/auth/                     shared kernel: session helpers, until identity absorbs them
  i18n/                         shared kernel
  test/                         shared test kit (intl, MSW, seeded random)
```

A context creates only the layers it needs. Format rules need `domain/` and `index.ts`.
Combos need all of them. `testing/` is imported by tests only; the existing ESLint ban on
`@/test` and `testing/` already says so.

The fourteen context names stay the ones in ADR 0001: `format-rules`, `deck-building`,
`deck-analysis`, `playtest`, `ai-copilot`, `card-catalog`, `combos`, `meta-insights`,
`deck-interchange`, `collection`, `community`, `identity`, `rules-reference`, `site`.

Search stays inside `card-catalog`. Deck price stays inside `deck-analysis`. Shopping
stays inside `collection`. Public pages split the way they already do: the share token
and the deck write belong to `deck-building`, discovery and moderation to `community`,
sitemap and Open Graph to `site`.

## How the DDD vocabulary lands

| Term                | In this codebase                                                                                                                                                                                                                                                                                                                 | Home                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Bounded context     | One folder under `src/modules/`, one glossary in `CONTEXT.md`.                                                                                                                                                                                                                                                                   | the folder                                                             |
| Entity              | A `readonly` type with an identity, plus pure functions that return a new value. `DeckCard` is an entity inside the deck aggregate.                                                                                                                                                                                              | `domain/`                                                              |
| Value object        | A `readonly` object compared by value, built only by a parser. `Quantity` is `{ readonly value: number }`. `DeckId` and `PrintingId` stay distinct types because `DeckCard.id` is a database id after save and a Scryfall id before it. A branded primitive needs a cast, which the type-escape ratchet forbids, so brands wait. | `domain/`                                                              |
| Aggregate           | The consistency boundary. `Deck` plus its `DeckCard`s plus the command zone. One use case loads it, one pure function decides, one repository method saves it in one transaction and bumps `version`.                                                                                                                            | `domain/` type, `application/` use case, `infrastructure/` transaction |
| Domain service      | A pure function that does not belong to one type. Bracket estimation, colour identity of a card list.                                                                                                                                                                                                                            | `domain/`                                                              |
| Invariant vs report | A deck under construction may be illegal (ADR 0009). The use case saves it and returns a legality report. The browser keeps its current feedback checks.                                                                                                                                                                         | `format-rules/domain/`                                                 |
| Port                | An interface in domain language. `DeckRepository`, `CardCatalog`. Never `PrismaDeck` or `ScryfallPort` in the signature.                                                                                                                                                                                                         | `application/ports.ts`                                                 |
| Use case            | `makeAddCards(deps) → (command) => Promise<AddCardsResult>`. Load, decide, save.                                                                                                                                                                                                                                                 | `application/`                                                         |
| Driving adapter     | A route handler or a Server Component: parse with Zod, call one use case, map the result. Route handlers stay route handlers.                                                                                                                                                                                                    | `src/app/**`                                                           |
| Driven adapter      | Prisma repository, Scryfall client, Spellbook client, model client, EDHREC client, one deck-site client per site.                                                                                                                                                                                                                | `infrastructure/`                                                      |
| Mapper              | Wire shape ↔ domain, at the edge only. Zod output is already the command type. Prisma rows and Scryfall JSON get a function each.                                                                                                                                                                                                | `infrastructure/` and the route file                                   |
| DTO                 | The Zod input and the JSON output of a route. Neither is a domain type's secret twin; the mapper is the only place both are visible.                                                                                                                                                                                             | route file, `infrastructure/`                                          |
| Unit of work        | The repository method's `prisma.$transaction`. One use case, one transaction, one aggregate.                                                                                                                                                                                                                                     | `infrastructure/`                                                      |
| Optimistic lock     | `Deck.version Int`. `updateMany` where `id` and `version` match, then the new version. Zero rows → a `stale` result, which the route maps to 409. This generalises `StaleDeckCardsError`.                                                                                                                                        | schema + repository                                                    |
| Composition root    | Plain factories in `server.ts`. React `cache()` for a per-request read. No container.                                                                                                                                                                                                                                            | `server.ts`                                                            |

Illegal states become unrepresentable in the types the use case sees: the command zone is
a discriminated union on `pairingType`, not three independent nullables. The Prisma row
can stay wider during a transition; the mapper is what refuses to emit an impossible
`Deck`. Changing the columns (`isCommander` / `isPartner` dropped in favour of the union)
is a later migration, after the mapper is the only reader.

## Dependency rules

Dependencies point inward.

```text
src/app  →  server.ts | index.ts | client.ts | ui/<Component>
ui, client  →  domain, other contexts' index.ts and client.ts
application  →  domain, ports, other contexts' index.ts and server.ts
infrastructure  →  domain, application ports, shared kernel (prisma client, logger, http)
domain  →  its own domain, other contexts' index.ts
```

`domain/` imports none of: `react`, `next`, `next-auth`, `zustand`, `@tanstack/*`,
`@prisma/client`, `@/lib/db`, `zod`, `server-only`, or another layer of any context.
`client/` and `ui/` import none of: Prisma, `server-only`, `server.ts`, `application/`,
`infrastructure/`.

Another context is reached only through `index.ts`, `server.ts`, `client.ts`, or a
component path under `ui/`. Deep imports are a violation. Entry files use named
re-exports, never `export *`. UI components are not re-exported through a barrel.

`src/lib/db/prisma.ts` stays the shared kernel. Repositories import that one module.
Nobody else in a context imports it. Route handlers stop importing it once the use case
exists; until then, a new route is not an excuse to add another inline query.

## Enforcement, aligned with `pnpm arch`

> Dated 2026-11-10. The live rule list is `.dependency-cruiser.cjs`; since CMB-08 (2026-11-12) it
> adds six boundary rules per context, at `error` for the contexts in `CLOSED_CONTEXTS` and at
> `warn` for the others. The checklist the next contexts copy is
> [architecture.md, the context template](../engineering/architecture.md#the-context-template).

The rules already shipped do the following, and a new module has to satisfy them on its
first commit because they match `src/modules/` today and match nothing only because the
folder is empty:

| Rule                                                       | Config                                     | What it rejects                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `no-circular`                                              | `.dependency-cruiser.cjs`                  | Any cycle, including type-only. Runtime cycles are also checked by `.dependency-cruiser.runtime.cjs`.             |
| `domain-is-pure`                                           | both depcruise and ESLint `domainImpurity` | Framework, Prisma, Zustand, TanStack Query or an outer layer imported by `domain/` or `index.ts`.                 |
| `browser-layers-not-server`                                | both                                       | `client/`, `ui/` or `client.ts` reaching Prisma, `server-only`, `server.ts`, `application/` or `infrastructure/`. |
| `public-api-only`                                          | depcruise                                  | A deep import into another context.                                                                               |
| `lib-not-outer-layers`, `ui-not-routes`, `ui-not-database` | both                                       | Today's tree: `src/lib` importing components, hooks or routes; components or hooks importing `src/app` or Prisma. |
| Size, complexity, parameters, `as`, `!`                    | `eslint.config.mjs`                        | The ratchets in `eslint-suppressions.json`. The baseline may only shrink.                                         |

`pnpm arch` on this commit exits 0 with 21 known violations ignored. A PR that adds a
baseline entry has to say why (`docs/engineering/quality-gate.md`). After a violation is
fixed, the baseline is regenerated with `--baseline-mode shrink-only`.

The rule to add in the same PR as the first module, so the pilot cannot cheat:

```text
application-is-not-an-adapter
  from: src/modules/*/application/
  to:   infrastructure/, @prisma/client, @/lib/db/prisma, the fetch identifier's module,
        next/server, zod
```

`zod` stays at the route and inside provider adapters. The use case receives an
already-parsed command. `fetch` stays inside `infrastructure/` and `src/lib/http.ts`.

ESLint `no-restricted-imports` gets the same ban on specifier strings, which is what it
can see. Dependency-cruiser sees the resolved path, including a re-export that hides
Prisma behind a barrel. Both stay, because they already disagree usefully: ESLint catches
the import a human wrote, depcruise catches the cycle.

No new lint limit on function length. The gate remains 80 lines, complexity 15, 3
parameters. New functions extracted by this series aim at 10–15 lines and one or two
parameters, with a parameter object past that, and they must not push a file that is
already over its limit any higher.

## Composition root

`server.ts` is the only wiring file:

```ts
import "server-only";

import { prisma } from "@/lib/db/prisma";
import { makeAddCards } from "@/modules/deck-building/application/add-cards";
import { prismaDeckRepository } from "@/modules/deck-building/infrastructure/prisma-deck-repository";

export const addCards = makeAddCards({
  decks: prismaDeckRepository(prisma),
});
```

A route does three things and contains no rule:

```ts
const parsed = addCardsCommand.safeParse(json);
if (!parsed.success) return jsonError(400, parsed.error);

const result = await addCards(parsed.data);

switch (result.kind) {
  case "saved":
    return NextResponse.json(toDeckJson(result.deck));
  case "stale":
    return NextResponse.json(
      { error: "The deck changed. Reload it and try again." },
      { status: 409 }
    );
  case "not-found":
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  default: {
    const _exhaustive: never = result;
    return _exhaustive;
  }
}
```

The browser never calls `addCards`. It calls the context's `client.ts` API client, which
`fetch`es the route. The Zustand store holds the optimistic copy and the view state. It
does not decide whether a partner is legal; it calls the pure function from
`format-rules` and shows the result, which is the feedback ADR 0009 already allows.

## Example slice

Illustrative only. These files do not exist. They show the deck aggregate's "add cards"
use case, which is the audit's torn write (`POST` then a separate `deck.update`) redrawn
as one transaction with a version check. Snippets are shortened on purpose.

### Entity and transition — `domain/deck.ts`

```ts
export interface Deck {
  readonly id: DeckId;
  readonly version: number;
  readonly cards: readonly DeckCard[];
  readonly commandZone: CommandZone;
}

export type AddCardsDecision =
  | { readonly kind: "accepted"; readonly deck: Deck }
  | { readonly kind: "rejected"; readonly reason: "duplicate-commander" };

/** Returns the next deck. Does not touch a database. */
export function addCards(
  deck: Deck,
  cards: readonly DeckCard[]
): AddCardsDecision {
  const commander = cards.find((card) => card.role === "commander");
  if (commander && deck.commandZone.kind !== "empty") {
    return { kind: "rejected", reason: "duplicate-commander" };
  }
  return {
    kind: "accepted",
    deck: { ...deck, cards: [...deck.cards, ...cards] },
  };
}
```

`CommandZone` is the discriminated union (`empty`, `single`, `partner`, `background`, …).
The snippet leaves it out. The Prisma booleans `isCommander` and `isPartner` do not
appear on this type.

### Value object — `domain/quantity.ts`

```ts
/** A card count in a deck or a collection. Zero is allowed. Negative is not. */
export interface Quantity {
  readonly value: number;
}

export function quantity(value: number): Quantity | undefined {
  // 100 is a stand-in for the format's copy cap. The real cap comes from format-rules.
  if (!Number.isInteger(value) || value < 0 || value > 100) return undefined;
  return { value };
}
```

A branded `number` would need a cast to construct, and the type-escape ratchet forbids
`as`. A one-field readonly object needs no cast, survives the Server Component boundary,
and is still compared by value. `DeckId` and `PrintingId` can be brands later, inside one
parser, if the owner accepts a single suppression on that parser. This series does not
require brands to start.

### Port — `application/ports.ts`

```ts
export interface DeckRepository {
  readonly getById: (id: DeckId) => Promise<Deck | undefined>;
  readonly save: (deck: Deck, expectedVersion: number) => Promise<SaveResult>;
}

export type SaveResult =
  | { readonly kind: "saved"; readonly deck: Deck }
  | { readonly kind: "stale" }
  | { readonly kind: "not-found" };
```

### Use case — `application/add-cards.ts`

```ts
export function makeAddCards(deps: { readonly decks: DeckRepository }) {
  return async function addCardsToDeck(
    command: AddCardsCommand
  ): Promise<AddCardsResult> {
    const current = await deps.decks.getById(command.deckId);
    if (!current) return { kind: "not-found" };

    const decision = decideAddCards(current, command.cards);
    if (decision.kind === "rejected") return decision;

    return deps.decks.save(decision.deck, current.version);
  };
}
```

The use case has one dependency object. It does not import Prisma, Zod or `ScryfallCard`.
Card identity arrives already parsed, as `PrintingId` values the catalog context's
`index.ts` exported.

### Mapper and adapter — `infrastructure/`

```ts
export function toDomainDeck(
  row: DeckRow,
  cards: readonly DeckCardRow[]
): Deck {
  return {
    id: deckId(row.id),
    version: row.version,
    cards: cards.map(toDomainCard),
    commandZone: toCommandZone(row, cards),
  };
}

export function prismaDeckRepository(prisma: PrismaClient): DeckRepository {
  return {
    getById: async (id) => {
      const row = await prisma.deck.findUnique({
        where: { id },
        include: { cards: true },
      });
      return row ? toDomainDeck(row, row.cards) : undefined;
    },
    save: async (deck, expectedVersion) =>
      prisma.$transaction(async (tx) => {
        const updated = await tx.deck.updateMany({
          where: { id: deck.id, version: expectedVersion },
          data: { version: { increment: 1 } },
        });
        if (updated.count !== 1) return { kind: "stale" };
        await replaceCards(tx, deck);
        const saved = await tx.deck.findUniqueOrThrow({
          where: { id: deck.id },
          include: { cards: true },
        });
        return { kind: "saved", deck: toDomainDeck(saved, saved.cards) };
      }),
  };
}
```

`replaceCards` is the card insert, delete and quantity changes, on `tx`, in the same
transaction as the version bump. The four torn `updatedAt` writes from the audit disappear
because the deck row and its cards commit together. `findUniqueOrThrow` is the one throw;
the use case still returns a union for the cases it understands (`stale`, `not-found`).

### Test — in-memory fake, no `vi.mock`

```ts
export function inMemoryDecks(seed: readonly Deck[] = []): DeckRepository {
  const rows = new Map(seed.map((deck) => [deck.id, deck]));
  return {
    getById: async (id) => rows.get(id),
    save: async (deck, expectedVersion) => {
      const current = rows.get(deck.id);
      if (!current) return { kind: "not-found" };
      if (current.version !== expectedVersion) return { kind: "stale" };
      const saved = { ...deck, version: expectedVersion + 1 };
      rows.set(deck.id, saved);
      return { kind: "saved", deck: saved };
    },
  };
}
```

```ts
it("rejects a second writer that did not see the latest version", async () => {
  const addCards = makeAddCards({ decks: inMemoryDecks([openDeck]) });
  const first = await addCards({ deckId: openDeck.id, cards: [island] });
  const second = await addCards({ deckId: openDeck.id, cards: [forest] });
  expect(first.kind).toBe("saved");
  expect(second.kind).toBe("stale");
});
```

The same assertions, with the Prisma repository against a database, are the contract
suite ADR 0005 asks for. They land when the adapter lands, not in the first
characterisation PR. The fake and the adapter both implement `DeckRepository`, so the
suite is one function called twice.

## Step 3 preview — refactoring sequence

Work proceeds from the domain outward. Each row is one pull request, or a named series of
them. A move PR changes no behaviour. A behaviour change found on the way becomes its own
`fix/` PR with a Red test. The tree stays shippable after every merge. The series can
stop after any row.

The codemod (`pnpm refactor:apply-moves`, map in `scripts/refactor/moves.json`) is the
only way a file changes directory. It rewrites imports and `vi.mock` paths in the same
change. `vi.mock` count today is 389 across 175 files, which is why a hand move is not
acceptable past a handful of importers.

| #   | PR                                                                      | Scope                                                                                                                                                                                                                                                                                                                                                                                              | Risk                                                                                                                                                                            | Tests first                                                                                                                                      | Metric that should move                                                                                                                      |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Characterise the uncovered screens                                      | Tests only. Render `DeckEditor.tsx` (0/238 statements, cyclomatic 23) and the builder page (0/1,202 statements, cyclomatic 56) enough to pin the commands they send to the store. Direct tests for `suggestion-stream.ts` (64.6%) and `usage/route-gate.ts` (76.3%). The store, engine, guest-claim, pairing and shared cache are already at 96–100% through existing tests; do not rewrite those. | Low                                                                                                                                                                             | New tests fail before the component is rendered with the fixture, then pass. No production edit.                                                 | Builder page statements 0/1,202 → above 0 on the command paths. `DeckEditor` 0/238 → above 0.                                                |
| 2   | One colour-identity function                                            | `validation.ts` stops carrying its own predicate (`checkCardColorIdentity`, `checkColorIdentityViolations`) and calls `color-identity.ts`. The exported `checkColorIdentity` and `detectGameChanger`, which have no production caller, are deleted or kept only if a test still describes a wanted rule. If the two predicates disagree on a fixture, stop and open a `fix/` PR.                   | Low, unless the predicates disagree                                                                                                                                             | One fixture list run through both predicates before the deletion.                                                                                | Colour-identity predicate lives in one file. `validation.ts` does not import a second copy.                                                  |
| 3   | `setPartner` calls a pure decision                                      | Extract the partner decision inside `store.ts` into a pure function the store calls. No file move. The store keeps HTTP, toasts and `set`.                                                                                                                                                                                                                                                         | Medium. The function is cyclomatic 29 inside a 2,551-line client module.                                                                                                        | `store-pairing.test.ts` and a new pure-function test written against current results before the extract.                                         | `setPartner` cyclomatic 29 → under 15. Store file does not grow.                                                                             |
| 4   | Transaction around the four torn card writes                            | Still in the current route files. `deckCard` write and `deck.updatedAt` share one `$transaction`. No version column yet.                                                                                                                                                                                                                                                                           | Medium. Failure semantics change: a failed timestamp update rolls the card write back.                                                                                          | Red test: a thrown update leaves the card row uncommitted. Then the transaction.                                                                 | Torn deck-card handlers: 4 → 0. `$transaction` sites: 7 → 11.                                                                                |
| 5   | `Deck.version` and a repository port, still under `src/lib/deck/`       | Schema migration adding `version Int @default(0)` on `Deck`. One module, `deck-repository.ts`, owns the transaction and the compare-and-swap. Routes that already have a transaction call it. The port interface lives next to it so the later move is a `git mv`.                                                                                                                                 | High. It is a migration, and every deck write has to go through it or the version lies. Do this only for the card routes in this PR; other deck writes follow in their own PRs. | Contract suite: fake and a database test that two saves with the same `expectedVersion` yield one `saved` and one `stale`.                       | Models with `version`: 0 → 1. Card routes no longer call `prisma.deckCard` themselves.                                                       |
| 6   | Pilot move: `combos`                                                    | Codemod move into `src/modules/combos/` with `domain/`, `application/`, `infrastructure/`, `client/`, `ui/`, the three entry points. Add the `application-is-not-an-adapter` rule in this PR.                                                                                                                                                                                                      | Low. 8 production files, 642 code lines, the Spellbook adapter and a fixture already exist.                                                                                     | Existing combo tests must stay green with rewritten `vi.mock` paths. Add the in-memory fake and run the contract suite against fake and fixture. | `src/modules/` exists. Baseline does not grow. Combos panel cyclomatic 26 is unchanged in this PR (a later split).                           |
| 7   | Move `format-rules`                                                     | Pure files only, after step 2. `index.ts` exports the rules. No `server.ts`.                                                                                                                                                                                                                                                                                                                       | Low. 14 files, no React. Importers are many, which is why the codemod does it.                                                                                                  | Existing rule tests. No new behaviour.                                                                                                           | Format-rule files under `src/lib/deck`: 0.                                                                                                   |
| 8   | Move `card-catalog` and introduce `CatalogCard`                         | Mapper from Scryfall JSON to `CatalogCard` inside `infrastructure/`. `index.ts` exports `CatalogCard` and does not export `ScryfallCard`. Call sites change in follow-up PRs, one context at a time, each behaviour-preserving.                                                                                                                                                                    | High. 31 production files outside `src/lib/scryfall` mention `ScryfallCard`. The move itself changes paths; the type swap is a series.                                          | Shared-cache characterisation from step 1. Contract test: fixture JSON → `CatalogCard`.                                                          | After the series: `ScryfallCard` mentioned outside `card-catalog/infrastructure`: 31 → 0.                                                    |
| 9   | Move `playtest`, then `collection`, `deck-interchange`, `meta-insights` | One context per series, domain files first, then adapters, then UI. `OPENING_HAND_SIZE` moves to `format-rules` or `playtest` `index.ts` before the playtest move, so deck analysis stops importing the engine file.                                                                                                                                                                               | Medium. Playtest engine is 866 code lines and pure; the risk is the import cycle, not the rules.                                                                                | Engine tests, collection fakes that already exist (`collection-db-fake.ts`).                                                                     | `turn-one.ts` no longer imports `playtest/engine.ts`. Baseline cycle entries shrink.                                                         |
| 10  | Move `community`, `identity`, `site`, `rules-reference`                 | Same pattern. Identity absorbs session helpers only when `src/lib/auth/*` importers can be rewritten; until then auth stays in the shared kernel, as ADR 0001 already says.                                                                                                                                                                                                                        | Medium for community (74 files). Low for site and rules reference.                                                                                                              | Route tests that already hit those handlers.                                                                                                     | `src/app` pages in those areas call `server.ts` and do not import Prisma. Sitemap and the moderation page are the two server files to drain. |
| 11  | AI copilot use cases, then the move                                     | Extract `suggest` and `build` out of the 619- and 365-line routes into `application/` functions that take a `ModelPort` and a `CardCatalog`. The route parses and maps. Move `build/types.ts` first (audit quick win).                                                                                                                                                                             | High. The routes call Prisma, Scryfall and the model, and metering must keep the conditional allowance update.                                                                  | Golden tests that already exist, plus characterisation of `model-reply.ts` from step 1. Metering tests stay on `ai-usage-db.ts`.                 | `suggest/route.ts` under 80 code lines. `build/types.ts` no longer lives under `src/app`. Baseline layer entries for AI: 7 → 0.              |
| 12  | Deck building, last                                                     | Split `store.ts` into `client/` view state and HTTP, after the repository and the format rules exist. The builder page becomes a container that composes panels. `deck-api.ts` becomes `client/api.ts`.                                                                                                                                                                                            | Highest. 95 files, 14,315 code lines, 49 client modules, every editor feature imports the store.                                                                                | The store characterisation suite (`store-*.test.ts`) must pass on both sides of each extract. One action per PR.                                 | `store.ts` code lines 2,551 → a client store under 300. `BuilderPage` cyclomatic 56 → under 15. Known violations 21 → 0.                     |

Steps 1–5 do not create `src/modules/`. They make the later `git mv` honest: the behaviour
is pinned, the torn writes are gone, and the port exists. Step 6 is the first time the
tree matches this document. Stopping after step 6 still leaves a working application and
a template for the next context.

### Expected end state

These are the numbers from the audit, and what the full series is for. No single PR is
asked to land all of them.

| Metric today                                                             | After the series                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `src/modules/` files: 0                                                  | 14 contexts, each with the layers it needs                                   |
| Known architecture violations: 21                                        | 0, and the new application rule has no baseline entries                      |
| Functions with cyclomatic complexity above 15: 40                        | 0, so the suppression block for `complexity` is empty                        |
| Files over the line limit: 39                                            | 0                                                                            |
| `ScryfallCard` outside `src/lib/scryfall`: 31 production files           | 0 outside `card-catalog/infrastructure`                                      |
| Prisma models with `version`: 0 of 33                                    | `Deck` has one; other aggregates only if a concurrent write appears          |
| API routes importing Prisma: 52 of 67                                    | 0. Routes call `server.ts`                                                   |
| Builder page statement coverage: 0/1,202                                 | The command paths are covered before the page is split                       |
| `DeckEditor.tsx` statement coverage: 0/238                               | Covered before it moves                                                      |
| Overall statements: 83.09% (40,848/49,160)                               | The gain comes from the 50 zero-coverage files, not from retesting `src/lib` |
| `$transaction` used for every deck-card mutation that also writes `Deck` | yes, inside `DeckRepository.save`                                            |

Out of scope for the whole series, unless the owner opens it: deleting the four orphan
modules, removing the `effect` dependency, replacing the Game Changer oracle-text
heuristic (that is a behaviour change), and any new browser legality check beyond the
ones ADR 0009 freezes.
