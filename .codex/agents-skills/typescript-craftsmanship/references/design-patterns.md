# Design Patterns for TypeScript + React

This reference covers SOLID principles and Gang of Four patterns adapted to
modern TypeScript and React. Load this file before refactoring sessions or
when designing new modules.

## Table of Contents

1. [SOLID in TypeScript](#solid-in-typescript)
2. [Creational Patterns](#creational-patterns)
3. [Structural Patterns](#structural-patterns)
4. [Behavioral Patterns](#behavioral-patterns)
5. [React-Specific Patterns](#react-specific-patterns)
6. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## SOLID in TypeScript

### S — Single Responsibility Principle

Every module, class, or function should have exactly one reason to change.
In React terms: every component renders one thing, every hook manages one concern.

```typescript
// ❌ God hook — fetches, transforms, validates, caches, and manages UI state
function useDeck(deckId: string) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [validationErrors, setErrors] = useState<string[]>([]);
  // ... 200 lines of mixed concerns
}

// ✅ Focused hooks — one concern each
function useDeckData(deckId: string) {
  /* fetch + cache deck */
}
function useDeckValidation(deck: Deck) {
  /* validate + return errors */
}
function useCardSearch(query: string) {
  /* search Scryfall */
}
function useDeckViewPrefs() {
  /* UI preferences */
}
```

**Test:** If you can't describe what a module does in one sentence without
"and", it has too many responsibilities.

### O — Open/Closed Principle

Modules should be open for extension, closed for modification. In TS: use
generics, interfaces, and composition instead of modifying existing code.

```typescript
// ❌ Adding a new export format requires modifying the function
function exportDeck(deck: Deck, format: string): string {
  if (format === "text") return exportAsText(deck);
  if (format === "csv") return exportAsCsv(deck);
  if (format === "moxfield") return exportAsMoxfield(deck);
  // Every new format = modify this function
}

// ✅ Strategy pattern — add formats without touching existing code
interface DeckExporter {
  readonly format: string;
  export(deck: Deck): string;
}

const exporters: readonly DeckExporter[] = [
  { format: "text", export: exportAsText },
  { format: "csv", export: exportAsCsv },
  { format: "moxfield", export: exportAsMoxfield },
];

function exportDeck(deck: Deck, format: string): string {
  const exporter = exporters.find((e) => e.format === format);
  if (!exporter) throw new Error(`Unknown format: ${format}`);
  return exporter.export(deck);
}
// Adding a new format = add one entry to the array
```

### L — Liskov Substitution Principle

Subtypes must be usable wherever their base type is expected. In TS: if a
function accepts `Animal`, passing `Cat` must not break anything.

This is especially relevant for discriminated unions — each variant must
satisfy the same contract:

```typescript
type Notification =
  | { type: "success"; message: string }
  | { type: "error"; message: string; retryable: boolean }
  | { type: "warning"; message: string };

// ✅ Every variant has `message` — consumer code works uniformly
function getLabel(n: Notification): string {
  return n.message; // safe for all variants
}
```

### I — Interface Segregation Principle

Don't force consumers to depend on methods they don't use. Prefer small,
focused interfaces over large ones.

```typescript
// ❌ Fat interface — most consumers only need read access
interface DeckStore {
  decks: Deck[];
  addCard(id: string, card: Card): void;
  removeCard(id: string, cardId: string): void;
  renameDeck(id: string, name: string): void;
  deleteDeck(id: string): void;
  setViewMode(mode: ViewMode): void;
  exportDeck(id: string, format: string): string;
}

// ✅ Segregated — consumers pick what they need
interface DeckReader {
  decks: readonly Deck[];
}
interface DeckWriter {
  addCard(id: string, card: Card): void;
  removeCard(id: string, cardId: string): void;
}
interface DeckManager {
  renameDeck(id: string, name: string): void;
  deleteDeck(id: string): void;
}
```

In React, this means component props should be minimal — only pass what
the component actually uses.

### D — Dependency Inversion Principle

High-level modules should not depend on low-level modules. Both should
depend on abstractions.

```typescript
// ❌ Component directly imports Scryfall client
import { searchCards } from "@/lib/scryfall/client";
function SearchPanel() {
  const results = await searchCards(query);
}

// ✅ Component depends on an abstraction (hook)
function SearchPanel() {
  const { results, search } = useCardSearch();
  // The hook can be backed by Scryfall, a mock, or a cache — component doesn't know
}

// ✅ The hook is the abstraction boundary
function useCardSearch() {
  return useQuery({
    queryKey: ["cards", query],
    queryFn: () => searchCards(query), // implementation detail
  });
}
```

---

## Creational Patterns

### Builder Pattern — Complex Object Construction

When an object has many optional parameters, use a builder instead of a
constructor with 15 arguments.

```typescript
class DeckBuilder {
  private deck: Partial<Deck> = { cards: [], format: "commander" };

  withName(name: string): this {
    this.deck.name = name;
    return this;
  }
  withCommander(card: DeckCard): this {
    this.deck.commander = card;
    return this;
  }
  withPartner(card: DeckCard): this {
    this.deck.partner = card;
    return this;
  }
  withBudget(max: number, type: "per_card" | "total"): this {
    this.deck.budgetMax = max;
    this.deck.budgetType = type;
    return this;
  }

  build(): Deck {
    if (!this.deck.name) throw new Error("Deck name is required");
    if (!this.deck.commander) throw new Error("Commander is required");
    return this.deck as Deck; // validated above
  }
}

const deck = new DeckBuilder()
  .withName("Atraxa Superfriends")
  .withCommander(atraxa)
  .withBudget(500, "total")
  .build();
```

### Factory Pattern — Conditional Object Creation

```typescript
// Create the right validator based on format
function createValidator(format: DeckFormat): DeckValidator {
  switch (format) {
    case "commander":
      return new CommanderValidator();
    case "standard":
      return new StandardValidator();
    case "modern":
      return new ModernValidator();
  }
  const _exhaustive: never = format;
  return _exhaustive;
}
```

---

## Structural Patterns

### Adapter Pattern — Normalize External Data

Scryfall, Moxfield, Archidekt all return different shapes. Adapt at the
boundary, use your own types internally.

```typescript
// Adapter at the API boundary
function adaptScryfallCard(raw: ScryfallRawCard): AppCard {
  const face = raw.card_faces?.[0]; // DFC support
  return {
    id: raw.id,
    name: raw.name,
    manaCost: face?.mana_cost ?? raw.mana_cost ?? "",
    oracleText: face?.oracle_text ?? raw.oracle_text ?? "",
    cmc: raw.cmc,
    colorIdentity: raw.color_identity,
    imageUrl: raw.image_uris?.normal ?? face?.image_uris?.normal ?? "",
    price: parseFloat(raw.prices?.usd ?? "0"),
  };
}
```

### Composite Pattern — Recursive Structures

For tree-like data (nested categories, folder structures):

```typescript
type FilterNode =
  | {
      type: "condition";
      field: string;
      operator: "eq" | "gt" | "lt";
      value: string;
    }
  | { type: "group"; operator: "and" | "or"; children: FilterNode[] };

function evaluateFilter(node: FilterNode, card: Card): boolean {
  switch (node.type) {
    case "condition":
      return evaluateCondition(node, card);
    case "group":
      return node.operator === "and"
        ? node.children.every((c) => evaluateFilter(c, card))
        : node.children.some((c) => evaluateFilter(c, card));
  }
}
```

---

## Behavioral Patterns

### Strategy Pattern — Swappable Algorithms

Already shown in Open/Closed section. Key insight: in TS, strategies are
usually just functions or objects with a common interface, not full classes.

```typescript
type SortStrategy<T> = (a: T, b: T) => number;

const CARD_SORTS: Record<string, SortStrategy<DeckCard>> = {
  name: (a, b) => a.name.localeCompare(b.name),
  cmc: (a, b) => a.cmc - b.cmc,
  price: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  color: (a, b) =>
    a.colorIdentity.join("").localeCompare(b.colorIdentity.join("")),
};

function sortCards(cards: readonly DeckCard[], strategy: string): DeckCard[] {
  const sort = CARD_SORTS[strategy] ?? CARD_SORTS.name;
  return [...cards].sort(sort);
}
```

### Observer Pattern — Event-Driven Updates

In React/Zustand, this is built-in via subscriptions:

```typescript
// Zustand subscribe = observer pattern
useDeckStore.subscribe(
  (state) => state.activeDeck?.cards.length,
  (count) => {
    if (count !== undefined && count > 100) {
      toast.warning("Deck exceeds 100 cards");
    }
  }
);
```

### Command Pattern — Undo/Redo

Model operations as reversible command objects:

```typescript
interface Command {
  execute(): void;
  undo(): void;
  describe(): string;
}

class AddCardCommand implements Command {
  constructor(
    private readonly store: DeckStore,
    private readonly deckId: string,
    private readonly card: DeckCard
  ) {}

  execute() {
    this.store.addCard(this.deckId, this.card);
  }
  undo() {
    this.store.removeCard(this.deckId, this.card.id);
  }
  describe() {
    return `Add ${this.card.name}`;
  }
}

class CommandHistory {
  private past: Command[] = [];
  private future: Command[] = [];

  execute(cmd: Command) {
    cmd.execute();
    this.past.push(cmd);
    this.future = []; // clear redo stack
  }

  undo() {
    const cmd = this.past.pop();
    if (!cmd) return;
    cmd.undo();
    this.future.push(cmd);
  }

  redo() {
    const cmd = this.future.pop();
    if (!cmd) return;
    cmd.execute();
    this.past.push(cmd);
  }
}
```

---

## React-Specific Patterns

### Compound Components

For components that work together as a unit:

```typescript
// Usage: <Card><Card.Image /><Card.Title /><Card.Stats /></Card>
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card-container">{children}</div>;
}

Card.Image = function CardImage({ src }: { src: string }) {
  return <img className="card-image" src={src} alt="" />;
};

Card.Title = function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="card-title">{children}</h3>;
};
```

### Render Props / Headless Components

Separate logic from presentation:

```typescript
// Headless hook — provides logic, zero UI
function useDropZone<T>(options: {
  accept: string[];
  onDrop: (item: T) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const handlers = useMemo(
    () => ({
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setIsOver(true);
      },
      onDragLeave: () => setIsOver(false),
      onDrop: (e: DragEvent) => {
        setIsOver(false);
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        options.onDrop(data);
      },
    }),
    [options]
  );

  return { isOver, handlers };
}
```

---

## Anti-Patterns to Avoid

### 1. God Component

A single component that does everything. **Max 200 lines per component.**

### 2. Prop Drilling

Passing props through 3+ levels. Use Context or Zustand selectors instead.

### 3. useEffect for Derived State

```typescript
// ❌ Effect to compute derived data
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, i) => sum + i.price, 0));
}, [items]);

// ✅ useMemo — synchronous, no extra render
const total = useMemo(
  () => items.reduce((sum, i) => sum + i.price, 0),
  [items]
);
```

### 4. String-Typed Enums

```typescript
// ❌ Any string is accepted
function setView(mode: string) {
  /* ... */
}

// ✅ Only valid values compile
type ViewMode = "grid" | "list" | "compact";
function setView(mode: ViewMode) {
  /* ... */
}
```

### 5. Barrel Export Hell

Avoid `index.ts` files that re-export everything — they break tree-shaking
and create circular dependency risks. Import directly from source files.

### 6. Boolean Blindness

```typescript
// ❌ What does `true, false, true` mean at the call site?
createDeck("My Deck", true, false, true);

// ✅ Options object — self-documenting
createDeck({
  name: "My Deck",
  isPublic: true,
  allowPartner: false,
  autoSave: true,
});
```
