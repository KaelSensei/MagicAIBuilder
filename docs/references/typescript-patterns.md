# TypeScript & React Patterns Reference

Read this file before any refactoring session or when writing complex logic.
The CLAUDE.md at project root contains the mandatory rules — this file provides
the detailed reasoning, examples, and known issues to fix.

---

## Table of Contents

1. [Known Issues to Fix](#known-issues-to-fix)
2. [Type System Patterns](#type-system-patterns)
3. [Algorithm Patterns](#algorithm-patterns)
4. [React Performance Patterns](#react-performance-patterns)
5. [Zustand Architecture Patterns](#zustand-architecture-patterns)
6. [Async Patterns](#async-patterns)
7. [Error Handling Patterns](#error-handling-patterns)

---

## Known Issues to Fix

These are concrete bugs and code smells found in the codebase audit (March 2026).
Fix them when touching the relevant files. Each has a severity and location.

### CRITICAL: Operator Precedence Bug in detectGameChanger()

**File:** `src/lib/deck/validation.ts` (~line 164)

```typescript
// ❌ CURRENT — && binds tighter than ||, so the grouping is:
// ((A && B && !C) || D || E || F) — this is correct by accident here
// but the INTENT is ambiguous and fragile
return (
  text.includes("search your library") && text.includes("put") && !text.includes("land") ||
  text.includes("take an extra turn") ||
  text.includes("each opponent loses") ||
  text.includes("win the game")
);

// ✅ FIX — explicit parentheses make intent clear and prevent future bugs
return (
  (text.includes("search your library") && text.includes("put") && !text.includes("land")) ||
  text.includes("take an extra turn") ||
  text.includes("each opponent loses") ||
  text.includes("win the game")
);
```

**Why this matters:** Even though JS operator precedence makes this work correctly
today, adding a new condition later (e.g., `|| text.includes("X") && text.includes("Y")`)
would silently break the logic. Explicit grouping is self-documenting.

### MODERATE: Race Condition in Scryfall Rate Limiter

**File:** `src/lib/scryfall/client.ts` (~line 13-34)

The global `lastRequestTime` variable is read and written without serialization.
When multiple React components trigger searches simultaneously (e.g., search bar +
autocomplete + card preview), they can all read the same timestamp and fire concurrently,
violating Scryfall's 10 req/s limit and risking a 429 ban.

```typescript
// ❌ CURRENT — race condition window between read and write
let lastRequestTime = 0;
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now(); // another caller may have already slipped through
  return fetch(url);
}

// ✅ FIX — Promise chain serializes all requests
let lastRequestTime = 0;
let requestQueue = Promise.resolve<Response>(new Response());

function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const p = requestQueue.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_DELAY_MS) {
      await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
    }
    lastRequestTime = Date.now();
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });
  });
  requestQueue = p.catch(() => {}); // don't let one failure block the queue
  return p;
}
```

### MODERATE: Type Assertions in Builder Page

**File:** `src/app/builder/[deckId]/page.tsx` (~lines 213-226)

Multiple `as` casts on drag-and-drop data bypass type safety:

```typescript
// ❌ CURRENT
const searchCard = active.data.current?.card as ScryfallCard | undefined;
const cardId = active.data.current?.cardId as string | undefined;
updateCardCategory(cardId, newCategory as CardCategory);

// ✅ FIX — type guards for DnD data
interface DragCardData {
  type: "search-card";
  card: ScryfallCard;
}

interface DragDeckCardData {
  type: "deck-card";
  cardId: string;
}

type DragData = DragCardData | DragDeckCardData;

function isDragCardData(data: unknown): data is DragCardData {
  return typeof data === "object" && data !== null && "type" in data && data.type === "search-card";
}
```

### MODERATE: God Module — store.ts (1033 lines)

**File:** `src/lib/deck/store.ts`

Split into focused modules. Suggested architecture:

```
src/lib/deck/
├── store.ts          // Re-export combined store (< 50 lines)
├── store/
│   ├── deck-slice.ts     // Deck CRUD: createDeck, deleteDeck, renameDeck, loadDecks
│   ├── card-slice.ts     // Card ops: addCard, removeCard, updateQuantity, swapPrinting
│   ├── commander-slice.ts // Commander/Partner/Companion management
│   ├── undo-slice.ts     // Undo/redo history
│   ├── enrichment-slice.ts // Game Changer & banlist enrichment
│   └── ui-slice.ts       // View modes, preferences
├── types.ts
├── validation.ts
└── stats.ts
```

Use Zustand's slice pattern:
```typescript
// store/card-slice.ts
export interface CardSlice {
  addCard: (deckId: string, card: ScryfallCard) => void;
  removeCard: (deckId: string, cardId: string) => void;
  // ...
}

export const createCardSlice: StateCreator<
  DeckStore,
  [],
  [],
  CardSlice
> = (set, get) => ({
  addCard: (deckId, card) => { /* ... */ },
  removeCard: (deckId, cardId) => { /* ... */ },
});

// store.ts — combine slices
export const useDeckStore = create<DeckStore>()((...a) => ({
  ...createDeckSlice(...a),
  ...createCardSlice(...a),
  ...createCommanderSlice(...a),
  ...createUndoSlice(...a),
  ...createEnrichmentSlice(...a),
  ...createUISlice(...a),
}));
```

### MODERATE: Stale Closures in SearchBar

**File:** `src/components/search/SearchBar.tsx` (~lines 41, 51)

The `eslint-disable react-hooks/exhaustive-deps` suppresses real bugs:

```typescript
// ❌ CURRENT — searchFocusSignal changes but effect doesn't re-run
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  inputRef.current?.focus();
}, [searchFocusSignal]);

// ✅ FIX — either include in deps or use useRef for the signal
useEffect(() => {
  if (searchFocusSignal > 0) {
    inputRef.current?.focus();
  }
}, [searchFocusSignal]); // no eslint-disable needed
```

### MINOR: Missing Error Boundaries

No `error.tsx` files found in any route segment. Create at minimum:

```
src/app/error.tsx                          // Global fallback
src/app/builder/[deckId]/error.tsx         // Builder crashes
src/app/collection/error.tsx               // Collection crashes
```

### MINOR: O(themes × cards × keywords) in Theme Detection

**File:** `src/lib/deck/themes.ts` (~line 263)

```typescript
// ❌ CURRENT — nested loops with repeated toLowerCase
for (const theme of themes) {
  for (const card of cards) {
    for (const keyword of theme.keywords) {
      if (card.oracle_text.toLowerCase().includes(keyword.toLowerCase())) {
        // ...
      }
    }
  }
}

// ✅ FIX — pre-compute + flatten keywords into a single regex per theme
const themeMatchers = themes.map(theme => ({
  ...theme,
  regex: new RegExp(
    theme.keywords.map(k => k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "i"
  ),
}));

const cardsWithLowerText = cards.map(c => ({
  card: c,
  lowerOracle: (c.oracle_text ?? "").toLowerCase(),
  lowerType: (c.type_line ?? "").toLowerCase(),
}));

for (const theme of themeMatchers) {
  for (const { card, lowerOracle, lowerType } of cardsWithLowerText) {
    if (theme.regex.test(lowerOracle) || theme.regex.test(lowerType)) {
      // match found — O(n × m) where m = themes, not m × k × n
    }
  }
}
```

### MINOR: Multiple .find() in Store for Same Data

**File:** `src/lib/deck/store.ts` (~lines 231-237)

```typescript
// ❌ CURRENT — two separate .find() scans
const commanderCard = allCards.find(c => c.isCommander && !c.isPartner);
const rawPartnerCard = allCards.find(c => c.isPartner);

// ✅ FIX — single pass
let commanderCard: DeckCard | undefined;
let partnerCard: DeckCard | undefined;
for (const card of allCards) {
  if (card.isCommander && !card.isPartner) commanderCard = card;
  if (card.isPartner) partnerCard = card;
  if (commanderCard && partnerCard) break; // early exit
}
```

---

## Type System Patterns

### Branded Types for IDs

Prevent mixing up deck IDs, card IDs, and Scryfall IDs:

```typescript
type Brand<T, B extends string> = T & { __brand: B };

type DeckId = Brand<string, "DeckId">;
type CardId = Brand<string, "CardId">;
type ScryfallId = Brand<string, "ScryfallId">;

// Compiler prevents: removeCard(deckId, scryfallId) — type mismatch
function removeCard(deckId: DeckId, cardId: CardId): void { /* ... */ }
```

### `satisfies` for Config Objects

Ensures the object matches a type while keeping the literal type:

```typescript
const BRACKET_THRESHOLDS = {
  1: { maxGameChangers: 0, maxTutors: 0 },
  2: { maxGameChangers: 0, maxTutors: 2 },
  3: { maxGameChangers: 3, maxTutors: 5 },
  4: { maxGameChangers: Infinity, maxTutors: Infinity },
} satisfies Record<1 | 2 | 3 | 4, { maxGameChangers: number; maxTutors: number }>;
// Type is preserved as literal, but validated against the constraint
```

### Const Assertions for Enum-like Values

```typescript
const CARD_CATEGORIES = [
  "commander", "creature", "instant", "sorcery",
  "artifact", "enchantment", "planeswalker", "land", "ramp", "other"
] as const;

type CardCategory = typeof CARD_CATEGORIES[number];
// Now CARD_CATEGORIES.includes() works as a type guard
```

### Zod for Runtime Validation

API inputs MUST be validated with Zod before use:

```typescript
import { z } from "zod";

const CreateDeckSchema = z.object({
  name: z.string().min(1).max(100),
  format: z.literal("commander"),
  commanderName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = CreateDeckSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  // body.data is fully typed
}
```

---

## Algorithm Patterns

### Frequency Maps with Map

```typescript
// Count mana value distribution in O(n)
function manaCurve(cards: readonly DeckCard[]): Map<number, number> {
  const curve = new Map<number, number>();
  for (const card of cards) {
    if (card.category === "land") continue;
    const mv = card.cmc ?? 0;
    curve.set(mv, (curve.get(mv) ?? 0) + card.quantity);
  }
  return curve;
}
```

### Batch Processing with Chunking

For Scryfall's `POST /cards/collection` (max 75 per request):

```typescript
async function batchLookup(names: string[]): Promise<ScryfallCard[]> {
  const CHUNK_SIZE = 75;
  const results: ScryfallCard[] = [];
  const notFound: string[] = [];

  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    const chunk = names.slice(i, i + CHUNK_SIZE);
    const identifiers = chunk.map(name => ({ name }));
    const response = await rateLimitedFetch("/cards/collection", {
      method: "POST",
      body: JSON.stringify({ identifiers }),
    });
    const data = await response.json();
    results.push(...data.data);
    notFound.push(...(data.not_found?.map((nf: { name: string }) => nf.name) ?? []));
  }

  if (notFound.length > 0) {
    console.warn(`[batchLookup] ${notFound.length} cards not found:`, notFound);
  }
  return results;
}
```

### Debounce with AbortController

Better than simple debounce — cancels in-flight requests:

```typescript
function useDebouncedSearch(query: string, delay = 400) {
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort(); // cancel previous
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await searchCards(query, { signal: controller.signal });
        if (!controller.signal.aborted) setResults(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        throw e;
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay]);

  return results;
}
```

---

## React Performance Patterns

### Zustand Selector Equality

When selecting objects, use `shallow` to prevent unnecessary re-renders:

```typescript
import { useShallow } from "zustand/react/shallow";

const { cards, addCard, removeCard } = useDeckStore(
  useShallow(s => ({
    cards: s.activeDeck?.cards ?? [],
    addCard: s.addCard,
    removeCard: s.removeCard,
  }))
);
```

### Virtualized Lists for Large Card Collections

For search results (can be 100+ cards), use virtualization:

```typescript
// Use @tanstack/react-virtual or react-window
import { useVirtualizer } from "@tanstack/react-virtual";

function CardList({ cards }: { cards: ScryfallCard[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // row height
  });

  return (
    <div ref={parentRef} style={{ overflow: "auto", height: "100%" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map(item => (
          <CardListItem key={cards[item.index].id} card={cards[item.index]} style={{
            position: "absolute",
            top: 0,
            transform: `translateY(${item.start}px)`,
          }} />
        ))}
      </div>
    </div>
  );
}
```

### Lazy Loading Heavy Components

```typescript
const PlaytestModal = lazy(() => import("@/components/playtest/PlaytestModal"));
const AISuggestionsPanel = lazy(() => import("@/components/deck/AISuggestionsPanel"));

// In parent:
<Suspense fallback={<Skeleton />}>
  {showPlaytest && <PlaytestModal />}
</Suspense>
```

---

## Zustand Architecture Patterns

### Immer for Complex State Updates

When updating nested objects, use Immer to avoid spread hell:

```typescript
import { immer } from "zustand/middleware/immer";

const useDeckStore = create<DeckStore>()(
  immer((set) => ({
    updateCardQuantity: (deckId, cardId, qty) => {
      set(state => {
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck) return;
        const card = deck.cards.find(c => c.id === cardId);
        if (!card) return;
        card.quantity = qty;
      });
    },
  }))
);
```

### Computed Values with `subscribeWithSelector`

Avoid recomputing on every render:

```typescript
import { subscribeWithSelector } from "zustand/middleware";

const useDeckStore = create<DeckStore>()(
  subscribeWithSelector((set, get) => ({
    // ...
  }))
);

// Subscribe to derived data
useDeckStore.subscribe(
  s => s.activeDeck?.cards,
  (cards) => {
    if (cards) {
      const stats = computeDeckStats(cards);
      useDeckStore.setState({ cachedStats: stats });
    }
  },
  { equalityFn: shallow }
);
```

---

## Error Handling Patterns

### Result Type for Operations That Can Fail

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function importDeck(text: string): Promise<Result<Deck, string>> {
  const lines = text.trim().split("\n");
  if (lines.length === 0) {
    return { ok: false, error: "Empty deck list" };
  }
  // ...
  return { ok: true, value: deck };
}

// Usage — forces caller to handle error
const result = await importDeck(text);
if (!result.ok) {
  toast.error(result.error);
  return;
}
const deck = result.value; // fully typed as Deck
```

### Scryfall Error Handling

```typescript
class ScryfallError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly scryfallDetails?: string,
  ) {
    super(message);
    this.name = "ScryfallError";
  }
}

async function handleScryfallResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ScryfallError(
      body.details ?? `Scryfall API error: ${response.status}`,
      response.status,
      body.details,
    );
  }
  return response.json();
}
```
