---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Organise the code as a modular monolith, one module per bounded context

## Context and Problem Statement

MagicAIBuilder is one Next.js 15 application with one PostgreSQL database. Its code is organised
by technical kind, not by business area. Measured on `dev` at `872f08ff` (2026-11-10), counting
non-test `.ts` and `.tsx` files:

| Folder                       | Files |  Lines |
| ---------------------------- | ----: | -----: |
| `src/components/**`          |   190 | 27,455 |
| `src/lib/**`                 |   185 | 26,667 |
| `src/app/api/**/route.ts(x)` |    67 |  7,208 |
| `src/app/**` (other files)   |    39 |  3,177 |
| `src/hooks/*`                |    29 |  2,293 |
| `src/i18n/*` and root files  |     7 |    340 |
| **Total**                    |   517 | 67,140 |

The consequences are visible in daily work:

- **One business area is spread over up to five roots.** Combo detection lives in
  `src/lib/combos/`, `src/hooks/useCombos.ts`, `src/components/deck/CombosPanel.tsx` and
  `src/app/api/combos/route.ts`. Nothing in the tree says these belong together.
- **Folders mix contexts.** `src/lib/deck/` holds 59 production files: format rules, analysis,
  editing, versioning, import and export, and a 2,550-line client store
  (`src/lib/deck/store.ts`). `src/components/deck/` holds 74 files that span about nine business
  areas.
- **There is no server application layer.** 53 of the 67 route handlers import Prisma directly,
  with 155 inline Prisma calls, and the repository contains no port, repository or use case. Logic
  that a server page could reuse is locked inside route handlers.
- **Dependencies run the wrong way.** The architecture audit counted 23 imports from card-catalog
  code into deck-building code, and the global `Header` imports the deck store and the import
  dialog (`src/components/layout/Header.tsx:7,13`), so every page that shows the header ships the
  deck store.

The owner asked for the code to be split by domain, to become smaller and easier to navigate, and
to follow the practices of Robert C. Martin, Michaël Azerhad (WealCome), Eric Evans and Cyrille
Martraire. Most code is written by AI agents, which work best when one feature lives in one folder
and its language is written down.

How should the source tree be organised so that a business area can be found, changed, tested and
reasoned about on its own, inside one deployable Next.js application?

## Decision Drivers

- Navigation by business area: a reader or agent finds all of a context's code in one folder.
- The Next.js App Router constraints: `src/app/**` must hold the routing files, and the boundary
  between Server and Client Components must stay safe.
- Testability: a use case must run in Vitest without Next.js, a session or a database.
- Incremental migration: three scheduled agents and several pending branches land work every day;
  the tree must stay shippable after every pull request.
- Proportion: DDD tactics only where the domain is rich, plain code elsewhere.

## Considered Options

- A modular monolith: one folder per bounded context under `src/modules/<context>/`, layered
  inside.
- Keep `src/lib/<domain>`, `src/components`, `src/hooks` and fix the violations in place.
- Layer-first Clean Architecture across the whole app (the
  [nextjs-clean-architecture](https://github.com/nikolovlazar/nextjs-clean-architecture) layout).
- Feature-Sliced Design.
- Separate packages in a pnpm workspace, or separate services.

## Decision Outcome

Chosen option: "a modular monolith, one module per bounded context", because it is the only option
that puts a context's code in one place while keeping one deployable application and allowing a
context-by-context migration.

The rules:

1. **Where a context lives.** Each bounded context lives in `src/modules/<context>/`. Inside it,
   these layers exist only when the context needs them:

   | Layer             | Holds                                                                                                  |
   | ----------------- | ------------------------------------------------------------------------------------------------------ |
   | `domain/`         | Readonly types and pure functions. No React, Next.js, Prisma, `fetch` or other IO.                     |
   | `application/`    | Use cases. They depend on ports (interfaces) declared in `domain/` or `application/`.                  |
   | `infrastructure/` | Prisma repositories, HTTP clients, anti-corruption adapters. Server-only, except a browser API client. |
   | `client/`         | The typed browser API client, Zustand stores and hooks.                                                |
   | `ui/`             | React components. A page or container composes small presentational components.                        |

2. **The contexts.** Folder names are fixed:

   | Kind       | Context          | Folder             |
   | ---------- | ---------------- | ------------------ |
   | Core       | Format rules     | `format-rules`     |
   | Core       | Deck building    | `deck-building`    |
   | Core       | Deck analysis    | `deck-analysis`    |
   | Core       | Playtest         | `playtest`         |
   | Core       | AI copilot       | `ai-copilot`       |
   | Supporting | Card catalog     | `card-catalog`     |
   | Supporting | Combos (pilot)   | `combos`           |
   | Supporting | Meta insights    | `meta-insights`    |
   | Supporting | Deck interchange | `deck-interchange` |
   | Supporting | Collection       | `collection`       |
   | Supporting | Community        | `community`        |
   | Generic    | Identity         | `identity`         |
   | Generic    | Rules reference  | `rules-reference`  |
   | Generic    | Site             | `site`             |

   What each context covers is described in
   [architecture.md](../engineering/architecture.md#bounded-contexts) and its terms in
   [CONTEXT.md](../../CONTEXT.md).

3. **`src/app/**` is a thin adapter.** It holds Next.js routing and nothing else. A route handler
   or page parses its input with Zod, calls one use case, and maps the result to a response. Route
   handlers stay route handlers; they are not converted to Server Actions.

4. **The shared kernel stays where it is for now:** `src/components/ui/*` and
   `src/components/layout/*` (the app shell), `src/lib/logger.ts`, `src/i18n/*`,
   `src/lib/db/prisma.ts` and `src/lib/auth/*`. Moving them costs 25 to 79 importer rewrites each
   (62 test files mock `@/lib/db/prisma` alone) for no gain. New shared code goes next to them.
   They may move in a final codemod slice if that is still worth it.

5. **Migration is by phases, one context per series of small pull requests** (phase 0 docs and
   tooling, B behaviour fixes, 1 decouple in place, 2 the `combos` pilot, 3+ the other contexts by
   increasing risk, `deck-building` last). Pure moves and logic changes go in separate pull
   requests. Moves are made by a committed, idempotent codemod. See
   [architecture.md](../engineering/architecture.md#migration-approach).

Entry points, the domain style, anti-corruption layers and enforcement are decided in ADRs
[0002](0002-module-entry-points-index-server-client.md),
[0003](0003-domain-as-readonly-data-and-pure-functions.md),
[0004](0004-anti-corruption-layers-for-external-providers.md) and
[0007](0007-architecture-enforcement-in-stages.md).

### Consequences

- Good, because a context's rules, use cases, adapters, client state and components sit in one
  folder, named in domain language ("screaming architecture").
- Good, because each context can be documented, tested and enforced on its own, and agents can load
  one context's language instead of the whole product's.
- Good, because the migration can stop after any context without leaving a half-moved tree.
- Good, because extracting use cases out of route handlers lets server pages reuse logic instead of
  calling their own API over HTTP.
- Bad, because the migration is long: the architecture audit estimates 90 to 110 pull requests,
  almost all under 300 changed lines apart from renames.
- Bad, because 274 `vi.mock` and `vi.doMock` calls in 138 test files are bound to file paths. A move
  that misses one silently un-mocks a module, so every move needs the codemod and a guard test.
- Bad, because two layouts coexist for months. Contributors must read
  [architecture.md](../engineering/architecture.md#how-to-read-the-code-base-today) to find code.
- Bad, because moves conflict with pending branches; files a pending branch edits wait until it
  merges.

### Confirmation

- dependency-cruiser rules check the layer and context boundaries, in stages
  ([ADR 0007](0007-architecture-enforcement-in-stages.md)).
- Each moved context has a `src/modules/<context>/README.md` and a
  `docs/functional/<context>.md` ([ADR 0006](0006-comment-and-documentation-standard.md)).
- Review question: "Is each new piece of logic in the context and layer that owns the knowledge?"

## Pros and Cons of the Options

### Keep `src/lib/<domain>` and fix the violations in place

- Good, because it is far cheaper, and every layer violation can be fixed where it is.
- Good, because nothing moves, so no `vi.mock` path breaks.
- Bad, because a context's code stays spread over five roots, and `src/lib/` keeps mixing browser
  stores, server adapters and pure rules under one name.
- Bad, because nothing in the tree tells an agent where new code goes. The in-place fixes are still
  done first, as phase 1, because they help whatever happens next.

### Layer-first Clean Architecture across the whole app

`src/entities`, `src/application`, `src/infrastructure`, `src/interface-adapters`, with a
dependency-injection container.

- Good, because the dependency rule is explicit and well documented.
- Bad, because one feature is scattered across four or five top-level folders, the opposite of the
  navigation the owner asked for.
- Bad, because a controller layer and a DI token per endpoint add ceremony to 67 route handlers
  that already are the controllers. Its author scopes it to projects expected to grow large.

### Feature-Sliced Design

- Good, because each slice has a public API, and FSD separates a server entry point from the
  browser one, which this decision borrows ([ADR 0002](0002-module-entry-points-index-server-client.md)).
- Bad, because it is front-end-first. This app has a real back end: 67 route handlers, Prisma and
  AI orchestration. Its layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) must be
  renamed to coexist with the App Router.

### Separate packages in a pnpm workspace, or separate services

- Good, because package `exports` maps give compiler-enforced public APIs.
- Bad, because packages add build and versioning cost before any boundary is proven, and services
  add network calls, deployment and data consistency problems to a single-database app.
- Neutral: workspace packages remain possible later for a context whose boundary has proved stable.

## More Information

- [architecture.md](../engineering/architecture.md): the context map, the layers, the current
  state and the migration.
- [CONTEXT.md](../../CONTEXT.md): the ubiquitous language of each context.
- Robert C. Martin, [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html), 2011-09-30.
- Martin Fowler, [BoundedContext](https://martinfowler.com/bliki/BoundedContext.html), 2014-01-15.
- Simon Brown, [Layers, hexagons, features and components](https://www.goodreads.com/author_blog_posts/14401770-layers-hexagons-features-and-components), 2016-04-25.
- Next.js, [Project structure](https://nextjs.org/docs/app/getting-started/project-structure), last updated 2026-07-21.
- Revisit this decision after the `combos` pilot (phase 2): if the template did not hold for a
  small context, amend it before phase 3.
