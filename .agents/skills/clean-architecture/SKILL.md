---
name: clean-architecture
description:
  Modular monolith by bounded context, hexagonal inside each module, adapted to this Next.js 15
  App Router + Prisma + React 19 project. Use when designing a feature, deciding where a file goes,
  adding a port or an adapter, moving code between contexts, or reviewing a PR that crosses layers
  or contexts.
---

# Clean Architecture Skill

The code is organised as a modular monolith: one module per bounded context, hexagonal (ports and
adapters) inside each module. This skill gives the rules and the examples. The decisions behind
them are ADRs 0001 to 0004, 0007 and 0009 (see [References](#references)); the context map and the
migration plan are in `docs/engineering/architecture.md`.

## When to use this skill

- Designing a feature, or deciding where a new file goes.
- Adding a port, an adapter, a repository or a use case.
- Moving code from `src/lib/`, `src/components/` or `src/hooks/` into `src/modules/`.
- Reviewing a PR that imports across layers or across contexts.

## Core principle

**Dependencies point inward, toward the domain.** Inner code never knows about outer code.

```
ui/ and client/          React components, stores, hooks, browser API client
      |
src/app/** adapters      route handlers and pages: parse → call one use case → map
      |
application/             use cases; depend on ports, never on adapters
      |
domain/                  readonly types and pure functions; depend on nothing outside
      ^
infrastructure/          Prisma repositories, HTTP clients, anti-corruption adapters;
                         implement the ports
```

## The contexts

| Kind       | Context          | Folder             | Covers                                                                    |
| ---------- | ---------------- | ------------------ | ------------------------------------------------------------------------- |
| Core       | Format rules     | `format-rules`     | Commander rules shared by server and browser: colour identity, copy limits, pairing, companion, banlist, Game Changers, brackets |
| Core       | Deck building    | `deck-building`    | Decks, cards in decks, zones, categories, snapshots and versions, the editor, the wizard |
| Core       | Deck analysis    | `deck-analysis`    | Stats, mana, bracket scoring, curve, feedback, probability                |
| Core       | Playtest         | `playtest`         | Game simulation in the browser, mulligans, session records                |
| Core       | AI copilot       | `ai-copilot`       | Suggest and build use cases, prompts, the model port, post-model validation |
| Supporting | Card catalog     | `card-catalog`     | The Scryfall anti-corruption layer: `CatalogCard`, search, printings, images |
| Supporting | Combos           | `combos`           | The Commander Spellbook adapter; the pilot context                        |
| Supporting | Meta insights    | `meta-insights`    | EDHREC, MTGTop8, meta history                                             |
| Supporting | Deck interchange | `deck-interchange` | Import and export: one adapter per site, text parsers, formats            |
| Supporting | Collection       | `collection`       | Owned cards, quantities, shopping and acquisition plans                   |
| Supporting | Community        | `community`        | Public decks, profiles, follows, likes, sharing, moderation               |
| Generic    | Identity         | `identity`         | Accounts, sessions, API keys, settings                                    |
| Generic    | Rules reference  | `rules-reference`  | Comprehensive Rules pages, Game Changers and banlist pages                |
| Generic    | Site             | `site`             | SEO, sitemap, robots, Open Graph images, landing                          |

The terms of each context are defined in `CONTEXT.md`.

## Layers inside a module

`src/modules/<context>/` holds only the layers the context needs:

| Layer             | Holds                                                                                  | May import                                             |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `domain/`         | Readonly types and pure functions. No React, Next.js, Prisma, `fetch`, Zod or other I/O. | its own `domain/`, other contexts' `index.ts`          |
| `application/`    | Use cases and the ports they need.                                                     | `domain/`, other contexts' entry points                |
| `infrastructure/` | Prisma repositories, HTTP clients, anti-corruption adapters. Server-only, except a browser API client. | `domain/`, `application/` ports, other contexts' entry points, the shared kernel |
| `client/`         | The typed browser API client, Zustand stores, hooks.                                   | `domain/`, other contexts' `index.ts` and `client.ts`  |
| `ui/`             | React components: containers compose small presentational components.                 | `domain/`, `client/`, other contexts' `index.ts`, `client.ts` and `ui/*` by path |
| `testing/`        | The context's test kit: in-memory fakes, builders, contract suites. Imported by tests only. | anything in the context                         |

## Entry points

Three files form a module's public API (`docs/adr/0002-module-entry-points-index-server-client.md`):

- **`index.ts`** exports pure domain types and functions. It is safe on the server, in the browser
  and in the Edge middleware, and never imports `application/`, `infrastructure/`, `client/` or
  `ui/`.
- **`server.ts`** starts with `import "server-only"`, wires the use cases to their production
  adapters (the composition root) and exports the wired use cases.
- **`client.ts`** exports client-safe hooks, stores and the API client. It never imports
  `server.ts`, `application/` or `infrastructure/`.

Rules:

- Other contexts import only these three files, or a component by path
  (`@/modules/deck-building/ui/DeckEditor`). Never a deep import into another context.
- Entry files use explicit named re-exports, never `export *`.
- UI components are never re-exported through a barrel.

## `src/app/**`: thin adapters

A route handler or a page does three things:

1. parse its input with Zod into domain types;
2. call one use case from a `server.ts`;
3. map the result to a response, with an exhaustive `switch` over the result's cases.

Route handlers stay route handlers; do not convert them to Server Actions. Authentication helpers
and the shared HTTP helpers are the only other imports a handler needs.

## Shared kernel

These stay where they are for now, because moving them rewrites dozens of importers and `vi.mock`
paths for no gain: `src/components/ui/*`, `src/components/layout/*` (the app shell),
`src/lib/logger.ts`, `src/i18n/*`, `src/lib/db/prisma.ts`, `src/lib/auth/*`. New shared code goes
next to them. The shared test kit stays in `src/test/`.

## Domain modelling

From `docs/adr/0003-domain-as-readonly-data-and-pure-functions.md`:

- **Readonly data and pure functions, not classes.** Values cross the Server/Client Component
  boundary, so they must be serialisable.
- **Make illegal states unrepresentable:** discriminated unions, exhaustive `never` guards, branded
  IDs where two kinds of ID can be mixed up.
- **Parse once.** Zod runs at the boundary only. `domain/` never imports Zod and never re-validates.
- **No DI container.** Plain factory functions, React `cache()` for per-request reads, ports passed
  explicitly.
- **Legality is a report, not an invariant.** A deck under construction may be illegal (97 cards,
  an off-colour card, a banned card); the app reports it and never blocks the edit. The server
  computes legality and re-validates every command; the browser may preview it with the same pure
  `format-rules` functions (`docs/adr/0009-legality-is-a-report-and-the-server-owns-rules.md`).
- **Gather, decide, act.** A use case loads what it needs, calls a pure function to decide, then
  persists or returns. The decision is testable with plain values.

## Ports and adapters

A use case that needs I/O declares a **port** in domain language. Adapters implement it. Name the
port by intent or by a domain noun (`DeckRepository`, `CardCatalog`), never by vendor
(`ScryfallPort`), and keep vendor types out of its signature.

```ts
// src/modules/deck-interchange/application/ports.ts
/**
 * Resolves card names from an imported list to catalog cards.
 * Names are exact English card names; unknown names are absent from the result, never an error.
 */
export interface CardCatalog {
  readonly findByNames: (
    names: readonly string[]
  ) => Promise<ReadonlyMap<string, CatalogCard>>;
}

// src/modules/deck-interchange/application/import-deck-list.ts (use case)
export async function importDeckList(
  list: ParsedDeckList,
  deps: { readonly catalog: CardCatalog; readonly decks: DeckRepository }
): Promise<ImportOutcome> {
  /* touches the ports only, never Scryfall or Prisma */
}
```

- The production adapter, for example
  `src/modules/card-catalog/infrastructure/scryfall-card-catalog.ts`, translates Scryfall JSON
  into `CatalogCard` (an anti-corruption layer,
  `docs/adr/0004-anti-corruption-layers-for-external-providers.md`).
- The test double is a hand-written in-memory fake in the context's `testing/` folder.
- One shared contract suite runs against the fake and the real adapter, so the fake cannot drift
  from reality. The `tdd` skill shows the pattern.

## Where does this code go?

1. A rule computed from domain data, no I/O → `domain/` of the context that owns the rule.
2. An operation a user or a route triggers → a use case in `application/`.
3. A database query or a provider call → an adapter in `infrastructure/`, behind a port.
4. Client state, a hook or the browser API client → `client/`.
5. Rendering → `ui/`, with logic pushed into a hook or the domain.
6. HTTP or routing → a thin route handler or page in `src/app/**`.
7. Generic code with no domain knowledge → next to the shared kernel.

**Until a context has moved** to `src/modules/<context>/`, its code stays in `src/lib/<area>/`,
`src/components/<area>/` and `src/hooks/`. Apply the same split in place (pure rules in their own
file with no Prisma, `fetch` or React import) so the later move is mechanical. Never move a file
in a behaviour PR.

## Anti-patterns to reject

- A Prisma import in a component, hook, store or `domain/` file.
- A `fetch` to a provider outside its adapter, or a provider type (`ScryfallCard`) in a domain or
  use-case signature.
- A rule re-implemented in a component or store instead of imported from the pure function that
  owns it.
- A route handler with business logic or inline Prisma queries in it.
- A deep import into another context, or an `index.ts` that re-exports server code.
- An import cycle: one of the two modules is in the wrong layer or context.

## Enforcement

Enforcement lands in stages (`docs/adr/0007-architecture-enforcement-in-stages.md`):

1. ESLint flat config (prerequisite);
2. the `server-only` package, with a Vitest stub;
3. dependency-cruiser: cycles fail now; layer and context rules start from a recorded baseline
   that may only shrink; it also generates the Mermaid graphs;
4. ESLint size and complexity limits, with bulk suppressions as a ratchet;
5. Knip as an advisory report;
6. `pnpm arch` joins the pre-PR gate in `CLAUDE.md` once it exists.

Until a stage exists, review checks the rule. SonarCloud does not check layering.

## Moving code into a module

1. Pin the behaviour first: characterization tests for anything without a test at its public
   surface.
2. Move the innermost code first: domain types, then pure rules, then use cases, then adapters,
   then UI.
3. Introduce the port before you split an adapter from a use case.
4. A move PR changes no logic. It rewrites every import and `vi.mock` path in the same commit.
   Logic changes come in a separate PR.
5. One context per series of small PRs. Temporary re-export shims are removed at the end of the
   series.

## References

- `docs/engineering/architecture.md`
- `docs/adr/0001-modular-monolith-by-bounded-context.md`
- `docs/adr/0002-module-entry-points-index-server-client.md`
- `docs/adr/0003-domain-as-readonly-data-and-pure-functions.md`
- `docs/adr/0004-anti-corruption-layers-for-external-providers.md`
- `docs/adr/0007-architecture-enforcement-in-stages.md`
- `docs/adr/0009-legality-is-a-report-and-the-server-owns-rules.md`
- _Clean Architecture_, Robert C. Martin; "Screaming Architecture" (2011)
- _Hexagonal Architecture_, Alistair Cockburn (2005)
- _Domain-Driven Design_, Eric Evans (bounded contexts, ubiquitous language)
- "Parse, don't validate", Alexis King (2019)
