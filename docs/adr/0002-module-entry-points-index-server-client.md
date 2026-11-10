---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Give each module three entry points: `index.ts`, `server.ts`, `client.ts`

## Context and Problem Statement

[ADR 0001](0001-modular-monolith-by-bounded-context.md) groups code into
`src/modules/<context>/`. Other contexts and `src/app/**` need a way in. In the Next.js App Router
the way in also decides which code reaches the browser, so it is a safety question as much as a
style question.

The facts on `dev` at `872f08ff` (2026-11-10):

- 228 of 517 production modules start with `"use client"` (44 %). None uses `"use server"`.
- No file imports the `server-only` package, and the package is not a dependency. Nothing at build
  time stops a client component from importing a server module.
- Today no client module reaches `@prisma/client`, `src/lib/db/prisma.ts` or
  `src/lib/auth/config.ts`, even transitively. That holds by convention alone.
- Five client modules import the browser HTTP clients that sit in `src/lib/db/` next to Prisma
  (`src/lib/deck/store.ts`, `ShareDeckView.tsx`, `DeckComparisonPanel.tsx`, `SnapshotsPanel.tsx`,
  `PublicDeckActions.tsx`). The folder name suggests database code; the files are `fetch` clients.
- The logger is isomorphic: `src/lib/logger.ts:21` imports `pino` at module scope, and the
  architecture audit traced about 70 client modules that reach it.
- The repository has no `index.ts` barrel today.

A single `index.ts` per module, re-exporting everything, is the classic App Router trap: a client
component that imports `@/modules/deck-building` would pull repositories and Prisma into the
browser graph, or fail the build once `server-only` exists. Barrels of components also slow the
development compiler and defeat tree-shaking, because `optimizePackageImports` targets packages,
not local paths.

How do other parts of the code import a context, so that the public API is explicit and a server
module can never reach the browser?

## Decision Drivers

- Server code (Prisma, secrets, provider clients) must never reach a client bundle, and the build
  should say so, not a reviewer.
- A context's public API must be small, explicit and greppable.
- Pure domain functions must be usable on the server, in the browser and in the Edge middleware.
- Component imports must stay cheap for the compiler.

## Considered Options

- Three entry points per module: `index.ts` (isomorphic), `server.ts` (server-only), `client.ts`
  (browser); components imported by path.
- One `index.ts` barrel per module.
- No entry points: deep imports anywhere.
- Workspace packages with `exports` maps.

## Decision Outcome

Chosen option: "three entry points per module", because it is the only option that keeps the
server boundary checkable at build time while giving each context a small public API.

The rules:

1. **`index.ts`** exports pure domain types and functions only. It is safe on the server, in the
   browser and in the Edge middleware. It never imports `application/`, `infrastructure/`,
   `client/` or `ui/`.
2. **`server.ts`** starts with `import "server-only"`. It wires the use cases to their production
   adapters (the composition root) and exports the wired use cases for route handlers and server
   pages.
3. **`client.ts`** exports client-safe hooks, stores and the typed API client. It never imports
   `server.ts`, `application/` or `infrastructure/`.
4. **UI components are imported by path,** for example
   `@/modules/deck-building/ui/DeckEditor`, never through a barrel.
5. **Other contexts import only these entry points, or a component path under `ui/`.** A deep
   import of another context's `domain/`, `application/`, `infrastructure/` or `client/` is a
   violation.
6. **Entry files use explicit named re-exports,** never `export *`, so they stay small and an
   unused export is visible.
7. **Identity may add an `edge.ts`** entry for the middleware, which must never reach Prisma or a
   Node.js built-in. `src/lib/auth/edge-config.ts` already plays this role
   (`src/middleware.ts:5`).
8. **`src/app/**` may import** any context's `server.ts`, `index.ts`, `client.ts` and `ui/*`. A
   route handler imports its own context's `server.ts` plus the shared HTTP helpers.

### Consequences

- Good, because `import "server-only"` turns a client import of server code into a build error,
  which is the only check that sees the client/server boundary transitively.
- Good, because each context's public surface is three short files that a reader can scan.
- Good, because pure rules can be shared by the server (authoritative) and the browser (instant
  preview) without duplication ([ADR 0009](0009-legality-is-a-report-and-the-server-owns-rules.md)).
- Bad, because a context has up to three entry files to keep in sync with its internals.
- Bad, because Vitest does not set the `react-server` condition, so the real `server-only` module
  throws on import. `vitest.config.ts` needs an alias to an empty stub before the first
  `server.ts` exists ([ADR 0007](0007-architecture-enforcement-in-stages.md), stage 2).
- Bad, because the isomorphic logger has to be split into a server logger and a browser facade
  before logging code can sit behind `server.ts`.

### Confirmation

- `server-only` in every `server.ts`, `application/` and `infrastructure/` file; the build fails on
  a client import.
- dependency-cruiser rules (`public-api-only`, `client-not-server`) and ESLint
  `no-restricted-imports` in `ui/` and `client/` folders
  ([ADR 0007](0007-architecture-enforcement-in-stages.md)).

## Pros and Cons of the Options

### One `index.ts` barrel per module

- Good, because it is the most familiar convention and gives one import path per context.
- Bad, because a barrel mixing server and client exports pulls server code into the client graph,
  or fails the build once `server-only` is in place.
- Bad, because component barrels make the development compiler load every component of a context
  for one import.

### No entry points: deep imports anywhere

- Good, because it costs nothing and matches today's code.
- Bad, because every internal file becomes public API, so no internal file can move without
  touching other contexts. This is the situation the 274 path-bound `vi.mock` calls show.

### Workspace packages with `exports` maps

- Good, because the package manager and the compiler enforce the public API.
- Bad, because it adds build configuration, package versioning and slower moves before the
  boundaries are proven. It remains an option for a context whose boundary has stabilised.

## More Information

- Next.js, [Data Security](https://nextjs.org/docs/app/guides/data-security) (Data Access Layer,
  `server-only`), last updated 2026-10-06.
- Next.js, [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
  (serialisable props, environment poisoning), last updated 2026-10-05.
- Feature-Sliced Design, [Usage with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)
  (a separate server entry point per slice).
- [architecture.md](../engineering/architecture.md#entry-points).
