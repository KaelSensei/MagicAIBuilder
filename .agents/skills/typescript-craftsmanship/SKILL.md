---
name: typescript-craftsmanship
description: >
  Professional TypeScript + React + Next.js coding standards enforcer.
  Use this skill whenever writing, reviewing, or refactoring TypeScript code
  in any project — whether it's a new feature, a bug fix, a refactoring pass,
  or a code review. Trigger on: any TypeScript or TSX file creation/editing,
  "clean up this code", "refactor", "optimize", "review my code", "best practice",
  "design pattern", "architecture", "performance", "type safety", "how should I
  structure this", "is this the right pattern", or any request involving writing
  production-quality TypeScript. Also trigger when the user pastes code and asks
  for improvements, when implementing a feature from scratch, or when discussing
  how to organize a React/Next.js codebase. Even if the user just says "write this
  function" — use this skill to ensure the output meets professional standards.
  Do NOT trigger for non-TypeScript languages (Python, Rust, Solidity have their
  own skills) unless the user explicitly asks for TS patterns applied elsewhere.
---

# TypeScript Craftsmanship

This skill enforces professional-grade TypeScript, React 19, and Next.js 15
coding standards. Every piece of code you write or review must pass these rules.

The philosophy: **make invalid states unrepresentable, make expensive operations
obvious, and make the code read like well-written prose.**

When writing complex logic, refactoring, or doing architecture work, load the
appropriate reference file for deeper patterns:

- `references/design-patterns.md` — SOLID principles, GoF patterns adapted to
  TS/React, anti-patterns to avoid. **Read this before any refactoring session
  or when designing new modules/components.**
- `references/algorithms.md` — Complexity analysis, data structure choices,
  performance patterns. **Read this when optimizing, writing data transforms,
  or working with collections/arrays.**
- `references/react-architecture.md` — React 19, Next.js 15 App Router, Zustand,
  TanStack Query, state management patterns. **Read this when creating components,
  hooks, stores, or page layouts.**

---

## Core Rules — Always Active

These rules apply to every line of TypeScript you write. No exceptions.

### 1. Type Safety is Non-Negotiable

**Zero `any`.** Use `unknown` + type guards. If you think you need `any`, you
need a generic or a discriminated union.

```typescript
// ❌ Lazy typing
function process(data: any) {
  return data.name;
}

// ✅ Safe typing
function process(data: unknown): string {
  if (isUser(data)) return data.name;
  throw new TypeError("Expected User object");
}
```

**Zero type assertions (`as`).** They lie to the compiler. Use type guards,
discriminated unions, or Zod parsing instead.

```typescript
// ❌ Assertion — compiles but crashes if wrong
const user = response.data as User;

// ✅ Runtime validation
const user = UserSchema.parse(response.data); // Zod: throws if invalid
```

**Zero non-null assertions (`!`).** Use optional chaining + nullish coalescing.

```typescript
// ❌ Crashes at runtime if null
const name = user!.name;

// ✅ Safe access
const name = user?.name ?? "Anonymous";
```

### 2. Make Invalid States Unrepresentable

Use discriminated unions to ensure only valid states exist at the type level.
If a bad combination of flags is possible, the types are wrong.

```typescript
// ❌ Boolean soup — allows { loading: true, error: true, data: User }
interface State {
  loading: boolean;
  error: boolean;
  data: User | null;
}

// ✅ Only valid states exist
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: User };
```

Every `switch` on a discriminated union MUST have an exhaustive check:

```typescript
function render(state: State) {
  switch (state.status) {
    case "idle": return <Empty />;
    case "loading": return <Spinner />;
    case "error": return <ErrorPanel error={state.error} />;
    case "success": return <UserCard user={state.data} />;
  }
  const _exhaustive: never = state;
  return _exhaustive;
}
```

### 2b. Parse Once, at the Boundary

Zod parses untrusted input once: in the route handler, the page or the
provider adapter. The result is a domain type, and the code inside trusts it.
`domain/` code never imports Zod and never re-validates
(`docs/adr/0003-domain-as-readonly-data-and-pure-functions.md`).

Where two kinds of ID or quantity can be mixed up, brand them so the compiler
tells them apart. The brand is created only by the parser:

```typescript
// ❌ Any string can be passed where a deck id is expected
function loadDeck(deckId: string, userId: string) {
  /* ... */
}

// ✅ Swapping the two arguments no longer compiles
const DeckId = z.string().min(1).brand<"DeckId">();
type DeckId = z.infer<typeof DeckId>;
function loadDeck(deckId: DeckId, userId: UserId) {
  /* ... */
}
```

### 3. Immutability by Default

Return `readonly` arrays and objects from functions. Use `as const` for literals.
Mutate only inside store actions or explicitly scoped builders.

```typescript
// ✅ Caller can't accidentally mutate
function getItems(): readonly Item[] {
  /* ... */
}

// ✅ Literal types preserved
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number]; // "admin" | "editor" | "viewer"
```

### 4. Single-Pass Algorithms

Never iterate a collection multiple times when one pass suffices. This is the
#1 performance mistake in TypeScript codebases.

```typescript
// ❌ O(n) × 4 categories = O(4n) — iterates array 4 times
const lands = cards.filter((c) => c.type === "land").length;
const creatures = cards.filter((c) => c.type === "creature").length;
const instants = cards.filter((c) => c.type === "instant").length;
const sorceries = cards.filter((c) => c.type === "sorcery").length;

// ✅ O(n) — single pass with accumulator
const counts = new Map<string, number>();
for (const card of cards) {
  counts.set(card.type, (counts.get(card.type) ?? 0) + 1);
}
```

### 5. Right Data Structure for the Job

- **Lookup by key** → `Map<K, V>` (not `array.find()`)
- **Membership test** → `Set<T>` (not `array.includes()`)
- **Ordered unique items** → `Map` (preserves insertion order)
- **Frequency counting** → `Map<T, number>`
- **Grouping** → `Map<K, T[]>` built in a single pass

If you call `.find()` or `.includes()` on the same array more than once,
convert to `Map`/`Set` first.

### 6. Pre-compute Expensive Transforms

`.toLowerCase()`, `.normalize()`, JSON.parse, regex compilation — do them
once, cache the result. Never inside a nested loop.

```typescript
// ❌ Recomputes toLowerCase() on every comparison
items.forEach((item) => {
  if (item.name.toLowerCase().includes(query.toLowerCase())) {
    /* ... */
  }
});

// ✅ Compute once
const lowerQuery = query.toLowerCase();
const matches = items.filter((item) =>
  item.name.toLowerCase().includes(lowerQuery)
);
```

### 7. Explicit Operator Precedence

Always use parentheses when mixing `&&` and `||`. The precedence rules are
correct but the code should express intent, not rely on language trivia.

<!-- prettier-ignore -->
```typescript
// ❌ Requires knowing that && binds tighter than ||
return isAdmin && hasPermission || isSuperUser && isActive;

// ✅ Intent is immediately clear
return (isAdmin && hasPermission) || (isSuperUser && isActive);
```

### 8. No Magic Values

Every literal number or string that isn't self-evident must be a named constant
with a comment that explains it and, for an external limit, gives its source:

```typescript
/** Scryfall enforces max 10 requests/second */
const SCRYFALL_RATE_LIMIT_MS = 100;

/** Maximum cards per Scryfall batch lookup request */
const SCRYFALL_BATCH_SIZE = 75;

/** Debounce delay for search input to avoid excessive API calls */
const SEARCH_DEBOUNCE_MS = 400;
```

### 9. Error Handling is Architecture

- **API routes**: Always try/catch, return proper HTTP status codes
- **External calls** (fetch, DB): Always handle failure explicitly
- **User-facing operations**: Use Result types, never let exceptions propagate silently
- **Never catch and ignore**: `catch (e) {}` is a bug

```typescript
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

// Forces caller to handle both paths
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, value: await res.json() };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
```

### 10. Async Discipline

- **Serialize shared state mutations** — use Promise chains, not bare globals
- **Cancel in-flight requests** — use AbortController on component unmount
- **Never fire-and-forget** — every Promise must be awaited or explicitly voided

```typescript
// ❌ Race condition — multiple concurrent calls share lastTime
let lastTime = 0;
async function rateLimited(url: string) {
  await delay(Math.max(0, 100 - (Date.now() - lastTime)));
  lastTime = Date.now();
  return fetch(url);
}

// ✅ Serialized — each call waits for the previous one
let queue = Promise.resolve<unknown>(undefined);
function rateLimited(url: string) {
  return (queue = queue.then(async () => {
    await delay(Math.max(0, 100 - (Date.now() - lastTime)));
    lastTime = Date.now();
    return fetch(url);
  }));
}
```

---

## Code Organization Rules

### File Size Limits

- **Components**: max 200 lines. Extract sub-components or custom hooks.
- **Store slices**: max 300 lines. Split into focused slices per domain.
- **Utility files**: max 300 lines. Group by domain, not by type.

Comments and blank lines do not count, so the limits never penalise
documentation. A file already over its limit must not grow. ESLint enforcement
with bulk suppressions as a ratchet is planned
(`docs/adr/0007-architecture-enforcement-in-stages.md`).

### Naming Conventions

- Names of domain concepts come from the glossary in `CONTEXT.md`
- Files: `kebab-case.ts` for utils/lib, `PascalCase.tsx` for components
- Types/Interfaces: `PascalCase` with domain prefix (`DeckCard`, not `Card`)
- Constants: `SCREAMING_SNAKE_CASE` in dedicated `constants/` files
- Hooks: `use` prefix, descriptive name (`useDeckStats`, not `useData`)
- Event handlers: `handle` prefix (`handleAddCard`, `handleSubmit`)

### Documentation: contracts and reasons, not paraphrase

The standard is `docs/adr/0006-comment-and-documentation-standard.md`; the
templates are in `docs/engineering/code-documentation.md`.

- Every **module** opens with a header: its purpose, its context and its main
  collaborators, and what it is not responsible for when that is not obvious.
- Every **export** has a TSDoc comment that states its contract: what it does,
  the input constraints, the errors and edge cases, and why it exists. Write
  `@param` and `@returns` only when they add something the name and the type do
  not say.
- Every **game rule** cites its Comprehensive Rules number
  (`// CR 103.5c: the first multiplayer mulligan is free`). Every **external
  limit** cites a URL and the date it was read.
- **Complex algorithms** explain the approach and the complexity.
- A comment that restates the code is a defect: delete it. When you change
  code, fix every comment it made false, in the same commit.
- No `console.log` in production code. Use `src/lib/logger.ts` or remove it.

```typescript
// ❌ Restates the signature, says nothing new
/**
 * Gets the cards to bottom.
 * @param mulligans - the mulligans
 * @returns the number of cards
 */
export function cardsToBottom(mulligans: number, multiplayer: boolean): number {
  /* ... */
}

// ✅ States the contract and the source
/**
 * How many cards a player puts on the bottom of their library after taking
 * `mulligans` mulligans: one per mulligan (CR 103.5, the London mulligan),
 * except that the first mulligan of a multiplayer game is free (CR 103.5c).
 * Returns 0 when no mulligan was taken; never negative.
 */
export function cardsToBottom(mulligans: number, multiplayer: boolean): number {
  /* ... */
}
```

### No eslint-disable Without Justification

Every `eslint-disable` MUST have:

1. A comment explaining WHY the rule is being bypassed
2. A reference to an issue/ticket that will properly fix it

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps -- #42: ref is stable, not state
```

---

## Pre-Commit Mental Checklist

Before considering any code complete, verify:

1. `npx tsc --noEmit` — zero errors
2. `pnpm lint` — zero warnings
3. `pnpm test` — all passing
4. Zero `any`, zero `as`, zero `!`
5. Zero `eslint-disable` without justification
6. Zero `console.log`
7. No file exceeds size limits (200/300 lines), and no oversized file grew
8. Module header on every touched module; TSDoc contract on every export you
   added or changed; game rules cite their CR number; no restating comment
9. Derived state is memoized in components
10. Error cases are explicitly handled
11. Input parsed once at the boundary; no Zod inside `domain/`

---

## When to Load References

| You're doing...                      | Load this reference                |
| ------------------------------------ | ---------------------------------- |
| Refactoring, restructuring modules   | `references/design-patterns.md`    |
| Optimizing perf, working with data   | `references/algorithms.md`         |
| Building UI, components, state mgmt  | `references/react-architecture.md` |
| Architecture decisions, new features | All three                          |
