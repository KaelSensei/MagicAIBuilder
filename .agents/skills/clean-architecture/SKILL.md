---
name: clean-architecture
description:
  Clean / Hexagonal Architecture adapted to this Next.js 15 App Router + Prisma + React 19
  project. Use when designing a new feature, adding a module, debating where code should live,
  reviewing a PR that crosses layers, or when the domain logic starts leaking into UI / routes.
---

# Clean Architecture Skill

Practical layering rules for this repo. Based on Robert C. Martin's _Clean Architecture_ and
Alistair Cockburn's _Hexagonal Architecture_, translated to the concrete directory layout we
actually use.

## When to use this skill

- Designing a new feature (commander deck feature, AI suggestion flow, pricing integration, etc.).
- Deciding where a new file goes (`lib/`, `components/`, `app/api/`, `server/`, `hooks/`, ...).
- Reviewing a PR that adds Prisma calls inside a React component or Scryfall fetches inside an
  API route that should delegate.
- During a `/refactor` that moves code across layers.

## Core principle

**Dependencies point inward, toward the domain.** Outer layers know about inner layers; inner
layers do NOT know about outer ones. Concretely in this repo:

```
    UI (React components, pages)            <-- depends on hooks + lib
         |
    Hooks + server actions + route handlers <-- depends on lib + domain
         |
    Lib (pure domain + use-cases)           <-- depends on domain types only
         |
    Domain types (entities, value objects)  <-- depends on nothing
         |
    Infrastructure (Prisma, Scryfall, Auth) <-- implements ports defined by domain/lib
```

## Layers in this repo

### 1. Domain (innermost)

- Lives in `src/types/`, `src/lib/<domain>/types.ts`, `src/lib/<domain>/constants.ts`.
- Pure TypeScript. No imports from `next`, `react`, `@prisma/client`, or `@auth/*`.
- Represents the MTG / Commander business concepts: `DeckCard`, `CommanderPairingType`,
  `CardCategory`, `BracketScore`, etc.

### 2. Use cases / application logic

- Lives in `src/lib/<domain>/*.ts` (e.g. `src/lib/deck/validate.ts`).
- Pure functions taking domain types in and returning domain types out.
- MUST be unit-tested (vitest) — these are the highest-value tests.
- Must NOT import from `src/app/**`, `src/components/**`, or directly from Prisma / Scryfall
  clients.

### 3. Infrastructure adapters

- Prisma access: `src/lib/db/<domain>.ts` — wraps Prisma queries behind domain-shaped return
  types. Components never import `@prisma/client` directly.
- External APIs: `src/lib/scryfall.ts`, `src/lib/moxfield.ts` — single entry point per provider,
  with rate limiting and retries. Components never `fetch("api.scryfall.com/...")`.
- Auth: `src/lib/auth.ts` wraps `next-auth` calls; session shape is typed in domain.

### 4. Interface layer

- **Server Components** (`src/app/**/page.tsx`, `layout.tsx`): compose use cases + infrastructure
  to produce data, render JSX. No business rules inline.
- **Route handlers** (`src/app/api/**/route.ts`): thin — parse input with Zod → call a use case →
  shape a `NextResponse`. No Prisma or Scryfall calls inline; delegate.
- **Server actions**: same thinness rule as route handlers.
- **Client Components** (`"use client"`): rendering + local interaction only. Call hooks; don't
  reach into `lib/db/**`.

## Dependency rules (enforced by convention + Sonar)

| From \ To            | Domain types | Use cases | DB / External | UI  |
| -------------------- | :----------: | :-------: | :-----------: | :-: |
| Domain types         |      ✅      |    ❌     |      ❌       | ❌  |
| Use cases            |      ✅      |    ✅     |      ❌       | ❌  |
| DB / External        |      ✅      |    ✅     |      ✅       | ❌  |
| Server components    |      ✅      |    ✅     |      ✅       | ✅  |
| Client components    |      ✅      |    ✅     |     ❌\*      | ✅  |
| API routes / actions |      ✅      |    ✅     |      ✅       | ❌  |

\* Client components reach infrastructure only through server actions, API routes, or a typed
fetch wrapper — never via direct Prisma imports.

## Hexagonal ports and adapters

When the domain needs to talk to the outside world (e.g. fetch a card, send an email, persist a
deck), define a **port** (a TypeScript interface or function type) in the domain / use-case
layer, and implement one or more **adapters** in infrastructure.

Example:

```ts
// src/lib/deck/ports.ts
export interface CardLookupPort {
  findByName(name: string): Promise<ScryfallCard | null>;
}

// src/lib/scryfall.ts — adapter
export const scryfallCardLookup: CardLookupPort = {
  async findByName(name) {
    /* ... */
  },
};

// src/lib/deck/build-deck.ts — use case
export async function buildDeck(
  input: DeckInput,
  lookup: CardLookupPort
): Promise<Deck> {
  /* ... only touches CardLookupPort, never Scryfall directly ... */
}
```

Benefits: tests mock the port (no network), swapping providers becomes localized, the use case
stays pure.

## Decision guide — "where does this code go?"

1. Does it compute something from domain data with no I/O? → `src/lib/<domain>/`.
2. Does it persist, read, or call an external service? → `src/lib/db/` or
   `src/lib/<provider>.ts`.
3. Does it render UI? → `src/components/` (reusable) or `src/app/**` (route-scoped).
4. Does it manage client-side state or effects? → `src/hooks/` or a Zustand store under
   `src/stores/`.
5. Does it translate HTTP → domain? → `src/app/api/**/route.ts` (thin handler) + delegate to
   `src/lib/`.

## Anti-patterns to reject

- `import { prisma } from "@/lib/prisma"` inside a React component. Move to a server action or
  route handler; pass the result down.
- `fetch("https://api.scryfall.com/...")` directly inside a component or route handler. Use
  `src/lib/scryfall.ts`.
- Business logic inside JSX (`if (deck.cards.length > 99 && deck.commander?.colorIdentity...)`
  directly in a component). Extract to `src/lib/deck/validate.ts`.
- Zustand stores containing domain rules. Stores are plain state + thin actions; domain rules
  live in `src/lib/`.
- Circular imports between layers — if it happens, one of the modules is in the wrong layer.

## Workflow when refactoring across layers

1. Draw (or imagine) which layer each chunk belongs to.
2. Move the **innermost** code first (domain types, then use cases). Outer layers will follow
   naturally.
3. Introduce a **port** before splitting an adapter from a use case.
4. Keep each move as a small commit; the diff should read like a chain of "extract", "move",
   "rename", not a big rewrite.
5. Add or move unit tests together with the code they cover.

## Sources

- _Clean Architecture_ — Robert C. Martin
- _Hexagonal Architecture_ — Alistair Cockburn
- _Domain-Driven Design_ — Eric Evans (bounded contexts, ubiquitous language)
- Next.js App Router docs — Server Components, server actions, route handlers
