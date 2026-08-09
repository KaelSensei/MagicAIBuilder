# MagicAIBuilder — Coding Standards

These rules apply to ALL code written in this project. Read `docs/references/typescript-patterns.md` before any refactoring session or when writing complex logic.

## Language & Runtime

- TypeScript strict mode (`"strict": true`). Zero `any` — use `unknown` + type guards instead.
- Target: ES2017+. Use modern syntax: optional chaining, nullish coalescing, `satisfies`, `using` for cleanup.
- Node 20+, Next.js 15 (App Router), React 19.

## Type Safety — Non-Negotiable Rules

### No type assertions (`as`)

Type assertions bypass the compiler. Use type guards or discriminated unions instead:

```typescript
// ❌ NEVER
const cat = value as CardCategory;

// ✅ ALWAYS
function isCardCategory(v: string): v is CardCategory {
  return CARD_CATEGORIES.includes(v as CardCategory);
}
if (isCardCategory(value)) {
  /* value is now CardCategory */
}
```

### No non-null assertions (`!`)

They crash at runtime. Use optional chaining + nullish coalescing or early returns:

```typescript
// ❌ NEVER
const name = card!.name;

// ✅ ALWAYS
const name = card?.name ?? "Unknown";
```

### No `eslint-disable` without a ticket/issue reference

Every disable MUST have a comment explaining WHY and linking to the issue that will fix it:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps -- #42: searchSignal is a ref, not state
```

### Exhaustive switch with `never` guard

Every `switch` on a union type MUST have an exhaustive check:

```typescript
function getPairingLabel(type: CommanderPairingType): string {
  switch (type) {
    case "none":
      return "Aucun";
    case "partner":
      return "Partner";
    // ... all cases
  }
  const _exhaustive: never = type;
  return _exhaustive;
}
```

### Discriminated unions over boolean flags

Prefer `{ role: "commander" }` over `{ isCommander: true, isPartner: false }`:

```typescript
// ❌ Allows invalid states (isCommander && isPartner both true)
interface DeckCard {
  isCommander: boolean;
  isPartner: boolean;
}

// ✅ Only valid states are representable
type CardRole = "commander" | "partner" | "companion" | "main";
interface DeckCard {
  role: CardRole; /* ... */
}
```

### `readonly` by default

Arrays and objects returned from stores or utils should be `readonly`:

```typescript
function getCards(): readonly DeckCard[] {
  /* ... */
}
```

## Algorithm & Performance

### Single-pass over collections

Never iterate the same array multiple times when one pass suffices:

```typescript
// ❌ O(n × categories) — iterates allCards once per category
const lands = allCards
  .filter((c) => c.category === "land")
  .reduce((s, c) => s + c.quantity, 0);
const creatures = allCards
  .filter((c) => c.category === "creature")
  .reduce((s, c) => s + c.quantity, 0);

// ✅ O(n) — single pass
const counts = new Map<CardCategory, number>();
for (const card of allCards) {
  counts.set(card.category, (counts.get(card.category) ?? 0) + card.quantity);
}
```

### Use Map/Set for lookups

If you `.find()` or `.includes()` on an array more than once, convert to Map/Set first:

```typescript
// ❌ O(n) per lookup
const isBanned = bannedCards.find((c) => c.name === name);

// ✅ O(1) per lookup
const bannedSet = new Set(bannedCards.map((c) => c.name));
const isBanned = bannedSet.has(name);
```

### Pre-compute expensive transforms

`.toLowerCase()`, `.normalize()`, JSON parse — do them once, cache the result:

```typescript
// ❌ Recomputes on every theme × every card
themes.forEach((t) =>
  cards.forEach((c) => {
    if (c.oracle_text.toLowerCase().includes(t.keyword.toLowerCase())) {
      /* ... */
    }
  })
);

// ✅ Pre-lowercased
const lowerTexts = cards.map((c) => ({
  ...c,
  lowerOracle: c.oracle_text.toLowerCase(),
}));
const lowerKeywords = themes.map((t) => ({
  ...t,
  lowerKw: t.keyword.toLowerCase(),
}));
```

### Operator precedence — always use parentheses with mixed `&&`/`||`

```typescript
// ❌ Bug-prone: && binds tighter than ||
return (a && b) || (c && d);

// ✅ Intent is clear
return (a && b) || (c && d);
```

## React / Next.js Patterns

### Memoize derived state

Any computation on arrays/objects in a component MUST be wrapped in `useMemo`:

```typescript
const cardsByCategory = useMemo(() => {
  const result: Record<CardCategory, DeckCard[]> = {};
  for (const card of deck.cards) {
    (result[card.category] ??= []).push(card);
  }
  return result;
}, [deck.cards]);
```

### Callbacks passed as props MUST be `useCallback`

```typescript
const handleAddCard = useCallback(
  (card: ScryfallCard) => {
    addCard(card);
  },
  [addCard]
);
```

### Error Boundaries are mandatory

Every route segment and every panel that fetches data MUST have an Error Boundary:

```typescript
// app/builder/[deckId]/error.tsx — Next.js convention
"use client";
export default function BuilderError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorPanel error={error} onRetry={reset} />;
}
```

### Component size limit: 200 lines max

If a component exceeds 200 lines, extract sub-components or custom hooks. God components are forbidden.

### No prop drilling beyond 2 levels

Use React Context or Zustand selectors instead:

```typescript
// ❌ page → Panel → SubPanel → Card (3 levels of cardActions)
// ✅ const { addCard } = useDeckStore(s => ({ addCard: s.addCard }));
```

## Zustand Store Rules

### One store per domain, max 300 lines

Split large stores into focused slices:

- `useDeckStore` — deck CRUD + active deck
- `useCardStore` — card operations, undo/redo
- `useUIStore` — view modes, preferences

### Selectors MUST be fine-grained

Never `const store = useDeckStore()` — always select what you need:

```typescript
// ❌ Re-renders on ANY store change
const store = useDeckStore();

// ✅ Re-renders only when cards change
const cards = useDeckStore((s) => s.activeDeck?.cards ?? []);
```

## Async & Concurrency

### Serialize shared state mutations

Race conditions with global variables are bugs. Use a Promise chain:

```typescript
// ❌ Race condition when multiple calls overlap
let lastTime = 0;
async function rateLimited() {
  const wait = Math.max(0, 100 - (Date.now() - lastTime));
  await delay(wait);
  lastTime = Date.now();
  return fetch(/* ... */);
}

// ✅ Serialized queue — no overlap possible
let queue = Promise.resolve();
function rateLimited(url: string) {
  return (queue = queue.then(async () => {
    const wait = Math.max(0, 100 - (Date.now() - lastTime));
    await delay(wait);
    lastTime = Date.now();
    return fetch(url);
  }));
}
```

### All API route handlers MUST have try/catch

Return proper HTTP error codes, never let exceptions bubble:

```typescript
export async function GET(req: NextRequest) {
  try {
    // ...
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/decks]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

## Naming & Structure

- Files: `kebab-case.ts` for utils, `PascalCase.tsx` for components
- Types/Interfaces: `PascalCase`, prefix interfaces with context (`DeckCard`, not `Card`)
- Constants: `SCREAMING_SNAKE_CASE` in a `constants/` folder
- No magic numbers — extract to named constants with JSDoc:

```typescript
/** Scryfall rate limit: max 10 requests per second */
const SCRYFALL_MIN_DELAY_MS = 100;
```

- No `console.log` in production code. Use a `logger` utility or remove before commit.

## Testing

- Every pure function in `lib/` MUST have unit tests (vitest)
- Test file lives next to source: `validation.ts` → `validation.test.ts`
- Use `describe/it` pattern with descriptive names:

```typescript
describe("validatePartner", () => {
  it("rejects non-Partner cards as partner", () => {
    /* ... */
  });
  it("allows generic Partner keyword pairing", () => {
    /* ... */
  });
  it("validates Partner with specific name match", () => {
    /* ... */
  });
});
```

## Branch Flow — staging → dev → main

Every feature or fix branch is merged into `staging` first. Promotion follows the chain `staging` → `dev` → `main`:

1. `feature/*` / `fix/*` PRs target **`staging`** (never `dev` or `main` directly).
2. Only a dev may request the merge from `staging` into `dev`.
3. Only a dev may request the merge from `dev` into `main`.

## Documentation Discipline

Feature branches must **NOT** modify `docs/project/changelog.md`, `docs/project/progress.md`, or `docs/product/roadmap.md`.
These files are updated in a dedicated `chore/docs` or `docs/changelog-update` PR after each merge batch.
This prevents rebase conflicts when multiple branches touch the same doc files.

## Before Submitting Code

Checklist (run mentally or via script):

1. `npx tsc --noEmit` passes
2. `pnpm lint` passes (zero warnings)
3. `pnpm test` passes
4. No `any`, no `as`, no `!`, no `eslint-disable` without justification
5. No `console.log` left
6. No file > 300 lines
7. All new functions have JSDoc with `@param` and `@returns`
8. Derived state is memoized in components

## Reference

For detailed patterns, anti-pattern examples with before/after code, and the full audit of existing issues to fix, read:
→ `docs/references/typescript-patterns.md`
