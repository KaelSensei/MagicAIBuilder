# Algorithm Patterns for TypeScript

This reference covers complexity analysis, data structure selection, and
performance patterns for TypeScript applications. Load this file when
optimizing code, writing data transforms, or working with collections.

## Table of Contents

1. [Complexity Cheat Sheet](#complexity-cheat-sheet)
2. [Data Structure Selection Guide](#data-structure-selection-guide)
3. [Collection Processing Patterns](#collection-processing-patterns)
4. [Search and Filter Patterns](#search-and-filter-patterns)
5. [Caching and Memoization](#caching-and-memoization)
6. [Async Performance Patterns](#async-performance-patterns)
7. [Common Traps](#common-traps)

---

## Complexity Cheat Sheet

Always think about complexity before writing a loop. For a 100-card deck
these differences are small, but for search results (1000+), catalogs
(30,000+ Scryfall cards), or user collections, they matter.

| Operation       | Array          | Map      | Set      | Sorted Array          |
| --------------- | -------------- | -------- | -------- | --------------------- |
| Access by index | O(1)           | —        | —        | O(1)                  |
| Lookup by key   | O(n)           | **O(1)** | **O(1)** | O(log n)              |
| Insert          | O(1) amortized | **O(1)** | **O(1)** | O(n)                  |
| Delete by value | O(n)           | **O(1)** | **O(1)** | O(n)                  |
| Iterate all     | O(n)           | O(n)     | O(n)     | O(n)                  |
| Sort            | O(n log n)     | —        | —        | O(1) (already sorted) |
| Membership test | O(n)           | **O(1)** | **O(1)** | O(log n)              |

**Rule of thumb**: If you do more than 1 lookup on the same data, convert
to Map/Set first.

---

## Data Structure Selection Guide

### When to Use Map<K, V>

```typescript
// ✅ Lookup card by ID — O(1) per access
const cardMap = new Map(cards.map((c) => [c.id, c]));
const card = cardMap.get(targetId); // O(1)

// vs ❌ array.find() — O(n) per access
const card = cards.find((c) => c.id === targetId); // O(n)
```

Use Map when:

- You need key → value lookups
- Keys are strings, numbers, or objects
- You need insertion order preserved
- You need `.size` without counting

### When to Use Set<T>

```typescript
// ✅ Membership check — O(1) per test
const bannedSet = new Set(bannedCards.map((c) => c.name));
const isBanned = bannedSet.has(cardName); // O(1)

// ✅ Deduplication — O(n)
const uniqueColors = [...new Set(cards.flatMap((c) => c.color_identity))];

// ✅ Set operations
const inDeck = new Set(deckCards.map((c) => c.name));
const inWishlist = new Set(wishlistCards.map((c) => c.name));
const overlap = new Set([...inDeck].filter((name) => inWishlist.has(name)));
```

### When to Use Array

Arrays are the right choice when:

- Order matters and you iterate sequentially
- You primarily map/filter/reduce
- You don't do random lookups by key
- Data is small (< 50 items) and simplicity wins

---

## Collection Processing Patterns

### Single-Pass Grouping

The most common pattern in UI code: grouping items by a property.

```typescript
// ✅ Generic single-pass groupBy — O(n)
function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

// Usage
const cardsByCategory = groupBy(deck.cards, (c) => c.category);
const cardsByColor = groupBy(deck.cards, (c) => c.color_identity.join(""));
const cardsByCmc = groupBy(deck.cards, (c) => c.cmc);
```

### Single-Pass Multi-Aggregate

When you need multiple stats from the same array:

```typescript
// ✅ One pass, all stats — O(n)
interface DeckAggregates {
  totalCards: number;
  totalPrice: number;
  avgCmc: number;
  categoryCounts: Map<CardCategory, number>;
  colorDistribution: Map<string, number>;
}

function aggregateDeck(cards: readonly DeckCard[]): DeckAggregates {
  let totalCards = 0;
  let totalPrice = 0;
  let totalCmc = 0;
  let nonLandCount = 0;
  const categoryCounts = new Map<CardCategory, number>();
  const colorDistribution = new Map<string, number>();

  for (const card of cards) {
    const qty = card.quantity;
    totalCards += qty;
    totalPrice += (card.price ?? 0) * qty;

    if (card.category !== "land") {
      totalCmc += card.cmc * qty;
      nonLandCount += qty;
    }

    categoryCounts.set(
      card.category,
      (categoryCounts.get(card.category) ?? 0) + qty
    );

    for (const color of card.colorIdentity) {
      colorDistribution.set(color, (colorDistribution.get(color) ?? 0) + qty);
    }
  }

  return {
    totalCards,
    totalPrice,
    avgCmc: nonLandCount > 0 ? totalCmc / nonLandCount : 0,
    categoryCounts,
    colorDistribution,
  };
}
```

### Efficient Frequency Counting

```typescript
// ✅ Generic counter — like Python's Counter
function countBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K
): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// Usage
const cmcCurve = countBy(nonLandCards, (c) => c.cmc);
const typeBreakdown = countBy(cards, (c) => c.type_line.split(" ")[0]);
```

### Chunk Processing for Batch APIs

```typescript
// ✅ Generic chunker — reusable for any batch API
function* chunks<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
  }
}

// Usage with Scryfall batch (max 75 per request)
async function batchLookup(names: readonly string[]): Promise<Card[]> {
  const results: Card[] = [];
  for (const chunk of chunks(names, 75)) {
    const response = await rateLimitedFetch("/cards/collection", {
      method: "POST",
      body: JSON.stringify({ identifiers: chunk.map((name) => ({ name })) }),
    });
    const data = await response.json();
    results.push(...data.data);
  }
  return results;
}
```

---

## Search and Filter Patterns

### Pre-Computed Search Index

For client-side search over a fixed dataset:

```typescript
interface SearchableCard {
  card: DeckCard;
  searchText: string; // pre-lowered concatenation of searchable fields
}

// Build index once — O(n)
function buildSearchIndex(cards: readonly DeckCard[]): SearchableCard[] {
  return cards.map((card) => ({
    card,
    searchText: [
      card.name,
      card.type_line,
      card.oracle_text ?? "",
      card.set_name ?? "",
    ]
      .join(" ")
      .toLowerCase(),
  }));
}

// Search is O(n) but with no per-item toLowerCase()
function searchIndex(
  index: readonly SearchableCard[],
  query: string
): DeckCard[] {
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);
  return index
    .filter((entry) => terms.every((term) => entry.searchText.includes(term)))
    .map((entry) => entry.card);
}
```

### Multi-Criteria Filtering with Early Exit

```typescript
type FilterFn<T> = (item: T) => boolean;

// ✅ Combine filters — short-circuits on first failure
function composeFilters<T>(...filters: FilterFn<T>[]): FilterFn<T> {
  return (item: T) => {
    for (const filter of filters) {
      if (!filter(item)) return false; // early exit
    }
    return true;
  };
}

// Build active filters dynamically
const activeFilters: FilterFn<DeckCard>[] = [];
if (colorFilter)
  activeFilters.push((c) => c.colorIdentity.includes(colorFilter));
if (cmcMax !== undefined) activeFilters.push((c) => c.cmc <= cmcMax);
if (typeFilter) activeFilters.push((c) => c.type_line.includes(typeFilter));

const filtered = cards.filter(composeFilters(...activeFilters));
```

### Regex for Multi-Keyword Matching

When checking multiple keywords against text (e.g., theme detection):

```typescript
// ❌ O(keywords × text.length) — nested includes()
keywords.some((kw) => text.includes(kw));

// ✅ O(text.length) — single regex pass
const regex = new RegExp(keywords.map((kw) => escapeRegex(kw)).join("|"), "i");
const matches = regex.test(text);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

---

## Caching and Memoization

### LRU Cache for Expensive Computations

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Usage: cache bracket scores to avoid recomputing on every render
const bracketCache = new LRUCache<string, BracketScore>(50);
```

### Stable Serialization for Cache Keys

When cache keys are objects, serialize consistently:

```typescript
// ✅ Stable key — same input always produces same string
function stableCacheKey(filters: SearchFilters): string {
  return JSON.stringify(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
```

---

## Async Performance Patterns

### Promise.allSettled for Parallel Requests

When failures shouldn't block other results:

```typescript
// ✅ Fetch all card images in parallel — failures don't block successes
async function preloadImages(
  urls: readonly string[]
): Promise<Map<string, boolean>> {
  const results = await Promise.allSettled(
    urls.map(
      (url) =>
        new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => reject(url);
          img.src = url;
        })
    )
  );

  const loaded = new Map<string, boolean>();
  for (const result of results) {
    if (result.status === "fulfilled") loaded.set(result.value, true);
    else loaded.set(result.reason, false);
  }
  return loaded;
}
```

### Throttled Parallel Execution

Limit concurrent requests while still executing in parallel:

```typescript
async function parallelThrottled<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = fn(item).then((result) => {
      results.push(result);
    });
    executing.add(
      p.then(() => {
        executing.delete(p);
      })
    );

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// Usage: fetch 100 card prices, max 5 concurrent
const prices = await parallelThrottled(cards, fetchPrice, 5);
```

---

## Common Traps

### 1. Array.sort() Mutates In-Place

```typescript
// ❌ Mutates the original array
const sorted = cards.sort((a, b) => a.cmc - b.cmc);
// `cards` is now sorted too — they're the same reference

// ✅ Copy first
const sorted = [...cards].sort((a, b) => a.cmc - b.cmc);
// or
const sorted = cards.toSorted((a, b) => a.cmc - b.cmc); // ES2023
```

### 2. Object.keys() Returns string[], Not keyof T

```typescript
// ❌ Type says string, not keyof Deck
Object.keys(deck).forEach((key) => {
  console.log(deck[key]); // TS error: no index signature
});

// ✅ Use a typed helper
function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
```

### 3. Floating Point Comparison

```typescript
// ❌ Floating point imprecision
0.1 + 0.2 === 0.3; // false

// ✅ For money (card prices), use integer cents
const priceInCents = Math.round(price * 100);

// ✅ For comparisons, use epsilon
function floatEquals(a: number, b: number, epsilon = 1e-10): boolean {
  return Math.abs(a - b) < epsilon;
}
```

### 4. forEach Can't Break

```typescript
// ❌ Can't break out of forEach
cards.forEach((card) => {
  if (card.isBanned) return; // this only skips one iteration, doesn't break
});

// ✅ Use for...of for early exit
for (const card of cards) {
  if (card.isBanned) break; // actually stops
}

// ✅ Or use .find() / .some() for search-then-stop
const firstBanned = cards.find((c) => c.isBanned);
const hasBanned = cards.some((c) => c.isBanned);
```

### 5. Spread Operator Is O(n)

```typescript
// ❌ O(n²) — rebuilds array on each iteration
let result: Card[] = [];
for (const chunk of chunks) {
  result = [...result, ...chunk]; // copies entire result + chunk each time
}

// ✅ O(n) — push mutates in place
const result: Card[] = [];
for (const chunk of chunks) {
  result.push(...chunk); // appends without copying
}
```
