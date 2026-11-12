---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Model the domain as readonly data and pure functions

## Context and Problem Statement

Domain-Driven Design books usually show aggregates and value objects as classes with private state
and methods. This code base runs on React Server Components, where that style meets a hard limit:
props passed from a Server Component to a Client Component must be serialisable, so a class
instance does not survive the boundary without a mapper on every crossing.

What the code shows on `dev` at `872f08ff` (2026-11-10):

- **The best domain code is already functional.** `src/lib/playtest/engine.ts` (901 lines) is a
  state machine where every transition takes a state and returns a new one. It has no framework
  dependency, cites the Comprehensive Rules, and is the easiest module in the repository to test.
- **The only classes in `src/lib` are three error types** (`HttpStatusError`,
  `MoxfieldRefusedError`, `ModelOutputTruncatedError`).
- **Illegal states are representable.** A few examples:
  - `Deck` (`src/lib/deck/types.ts`) holds `commander`, `partner` and `companion` as independent
    nullable fields next to a `pairingType`, so "a partner without a commander" type-checks.
  - The zone is stored three times: `DeckCard.zone`, the derived flag `DeckCard.isMaybeboard` and the
    derived list `Deck.maybeboard`, kept in sync by hand.
  - `DeckCard.id` is a database id once saved and a Scryfall id before that
    (`src/lib/deck/store-card-faces.ts`, `makeDeckCard`), with the same `string` type.
  - `BracketLevel` is `1 | 2 | 3 | 4` in two places while the Zod schemas accept 1 to 5.
- **Parsing happens more than once.** Zod schemas exist at the API boundary
  (`src/lib/validation/*.ts`), but the architecture audit estimated about 51 `as` casts in
  production code, 13 of them in route handlers, and 9 non-null assertions.
- **No dependency-injection framework is used.** `effect` 4.1.2 is a dependency, but no file under
  `src/` or `scripts/` imports it.

How should domain concepts, rules and dependencies be expressed so that they are safe across the
server/client boundary, testable without infrastructure, and hard to misuse?

## Decision Drivers

- Values cross the Server/Client Component boundary and must be serialisable.
- The same rule must run on the server (authoritative) and in the browser (preview) without being
  written twice ([ADR 0009](0009-legality-is-a-report-and-the-server-owns-rules.md)).
- Tests should exercise rules without mocks.
- The type system should reject the mistakes reviewers keep finding: mixed-up IDs, impossible
  combinations, unchecked casts.

## Considered Options

- Readonly data plus pure functions, with discriminated unions, branded IDs, parsing at the
  boundary and plain factory functions for wiring.
- Class-based aggregates and value objects.
- A dependency-injection container.

## Decision Outcome

Chosen option: "readonly data plus pure functions", because it is the only option whose values
cross the React Server Component boundary unchanged and whose rules run identically on the server
and in the browser.

The rules:

1. **Data, not objects.** A domain concept is a `readonly` type. Behaviour is a pure function that
   takes values and returns new values, for example `applyMulligan(state) → state`. A command that
   can fail returns a discriminated union such as
   `{ kind: "saved"; deck } | { kind: "rejected"; reason }`, not a thrown exception.
2. **Make illegal states unrepresentable.** Use discriminated unions for alternatives (for example
   the command zone's pairing shapes), exhaustive `switch` statements with a `never` guard, and
   branded types for IDs that can be mixed up (`DeckId`, `DeckCardId`, `ScryfallId`, `OracleId`).
   A branded value is created only by a parsing function.
3. **Parse once.** Zod parses input at the boundary only: the route handler, the server page, the
   provider adapter. Inside `domain/` and `application/` the types are trusted; there is no
   defensive re-checking and no `as`.
4. **No DI container.** A use case is built by a plain factory that receives its ports,
   `makeSaveDeck({ decks, cards })`. Production wiring happens once, in the context's `server.ts`
   ([ADR 0002](0002-module-entry-points-index-server-client.md)). Per-request reads are memoised
   with React's `cache()`. Tests pass in-memory fakes
   ([ADR 0005](0005-testing-strategy-fakes-contracts-and-characterization.md)).
5. **Errors as values inside, exceptions at the edge.** Domain and application code return typed
   results. Only infrastructure throws (network, database), and the adapter or route maps those
   failures to a result or an HTTP status.

### Consequences

- Good, because values pass from Server Components to Client Components and to JSON without
  mappers.
- Good, because one pure function serves the server check and the browser preview.
- Good, because rules are tested with plain inputs and outputs, the style of today's playtest
  engine tests.
- Good, because branded IDs and unions move whole classes of review findings to the compiler.
- Bad, because there is no private state: an invariant is protected by the type and by the
  functions that create values, not by encapsulation. A careless spread can still build a bad value
  inside a module, so domain modules keep their constructors few and tested.
- Bad, because branded types need a parse function per ID, and existing code that passes plain
  strings must be migrated context by context.
- Bad, because readers who learned DDD from class-based books must map "aggregate" to "a readonly
  type plus the functions that change it".

### Confirmation

- dependency-cruiser and ESLint forbid React, Next.js, Prisma, Zustand and `fetch` in `domain/`
  ([ADR 0007](0007-architecture-enforcement-in-stages.md)).
- The house TypeScript rules already ban `any`, `as` and `!`; review checks that new IDs that can
  be confused are branded and that new alternatives are unions with a `never` guard.

## Pros and Cons of the Options

### Class-based aggregates and value objects

- Good, because encapsulation protects invariants and the style matches most DDD literature.
- Bad, because class instances cannot be passed to Client Components, so every boundary needs a
  mapper, and the browser preview would need the class too.
- Bad, because the codebase has no class-based domain today; adopting one means rewriting the
  cleanest modules, such as the playtest engine, for no behavioural gain.

### A dependency-injection container

Options examined: ioctopus, InversifyJS, tsyringe.

- Good, because wiring is declared in one place, with scopes such as singleton and per request.
- Bad, because InversifyJS and tsyringe rely on decorators and reflection metadata, which the
  Next.js compiler and Vitest's esbuild do not emit reliably.
- Bad, because token registries must be kept in sync with types by hand, an indirection agents get
  wrong, with no type-safety gain over a factory call. The module system already provides
  singletons and React provides `cache()` for request scope.

## More Information

- Scott Wlaschin, [Designing with types: making illegal states unrepresentable](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/), 2013-01-14.
- Alexis King, [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/), 2019-11-05.
- Mark Seemann, [Impureim sandwich](https://blog.ploeh.dk/2020/03/02/impureim-sandwich/), 2020-03-02.
- Khalil Stemmler, [Coding without a DI container](https://khalilstemmler.com/articles/software-design-architecture/coding-without-di-container).
- Next.js, [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), last updated 2026-10-05.
