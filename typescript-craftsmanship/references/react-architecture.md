# React + Next.js Architecture Patterns

This reference covers React 19, Next.js 15 App Router, Zustand, and TanStack
Query patterns for professional applications. Load this file when building
components, hooks, stores, or page layouts.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [State Management with Zustand](#state-management-with-zustand)
3. [Data Fetching with TanStack Query](#data-fetching-with-tanstack-query)
4. [Next.js App Router Patterns](#nextjs-app-router-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Error and Loading States](#error-and-loading-states)
7. [Testing Patterns](#testing-patterns)

---

## Component Architecture

### Component Categories

Organize components by their role, not by feature alone:

| Category | Responsibility | State? | Side effects? | Example |
|----------|---------------|--------|---------------|---------|
| **Page** | Layout + data orchestration | Minimal | Data fetching | `BuilderPage` |
| **Container** | Business logic + state wiring | Yes | Via hooks | `DeckEditorContainer` |
| **Presentational** | Pure rendering | Props only | None | `CardImage`, `ManaCurve` |
| **Headless** | Logic without UI | Yes | Yes | `useCardSearch`, `useDeck` |

### Component Template

Every component should follow this structure:

```typescript
"use client"; // only if needed (state, effects, browser APIs)

import { memo, useCallback, useMemo } from "react";
import type { DeckCard } from "@/lib/deck/types";

/** Props for the CardListItem component */
interface CardListItemProps {
  /** The card to display */
  readonly card: DeckCard;
  /** Called when the user clicks the remove button */
  readonly onRemove: (cardId: string) => void;
  /** Whether the card is currently selected */
  readonly isSelected?: boolean;
}

/**
 * Displays a single card in list view with name, mana cost, and actions.
 * Used inside DeckEditor category sections.
 */
export const CardListItem = memo(function CardListItem({
  card,
  onRemove,
  isSelected = false,
}: CardListItemProps) {
  const handleRemove = useCallback(() => {
    onRemove(card.id);
  }, [onRemove, card.id]);

  return (
    <div
      className={cn("flex items-center gap-2 p-2 rounded", {
        "ring-2 ring-indigo-500": isSelected,
      })}
    >
      <span className="flex-1 truncate">{card.name}</span>
      <span className="text-muted">{card.manaCost}</span>
      <button onClick={handleRemove} aria-label={`Remove ${card.name}`}>
        <X size={14} />
      </button>
    </div>
  );
});
```

Key patterns in this template:
- **`memo()`** wraps the component — prevents re-render when props haven't changed
- **Named function** inside memo — better debugging in React DevTools
- **`useCallback`** for event handlers passed as props
- **JSDoc** on props and component
- **`readonly`** on prop types
- **Default values** in destructuring
- **Accessibility** attributes (`aria-label`)

### Extracting Sub-Components

When a component exceeds 200 lines, extract by identifying render boundaries:

```typescript
// ❌ 400-line monolith
function DeckEditor({ deck }: { deck: Deck }) {
  // ... 50 lines of hooks
  return (
    <div>
      {/* 100 lines of commander zone */}
      {/* 100 lines of category sections */}
      {/* 100 lines of stats sidebar */}
      {/* 50 lines of action buttons */}
    </div>
  );
}

// ✅ Composed from focused pieces
function DeckEditor({ deck }: { deck: Deck }) {
  return (
    <div className="flex">
      <CommanderZone deck={deck} />
      <CategorySections cards={deck.cards} />
      <StatsSidebar deck={deck} />
      <DeckActions deckId={deck.id} />
    </div>
  );
}
```

### Custom Hooks — The Missing Architecture Layer

Extract business logic into hooks. This is the most underused pattern:

```typescript
// ✅ All deck mutation logic in one place
function useDeckActions(deckId: string) {
  const addCard = useDeckStore(s => s.addCard);
  const removeCard = useDeckStore(s => s.removeCard);
  const updateQuantity = useDeckStore(s => s.updateCardQuantity);

  return useMemo(() => ({
    add: (card: ScryfallCard) => addCard(deckId, card),
    remove: (cardId: string) => removeCard(deckId, cardId),
    updateQty: (cardId: string, qty: number) => updateQuantity(deckId, cardId, qty),
  }), [deckId, addCard, removeCard, updateQuantity]);
}

// Component is now pure UI
function CardActions({ card, deckId }: Props) {
  const { add, remove, updateQty } = useDeckActions(deckId);
  // ...
}
```

---

## State Management with Zustand

### Store Slicing Pattern

One store per domain, max 300 lines. Slices compose into a single store:

```typescript
// types.ts — shared types
interface DeckSlice {
  decks: Deck[];
  activeDeckId: string | null;
  createDeck: (name: string, commander: DeckCard) => string;
  deleteDeck: (id: string) => void;
  setActiveDeck: (id: string) => void;
}

interface CardSlice {
  addCard: (deckId: string, card: ScryfallCard) => void;
  removeCard: (deckId: string, cardId: string) => void;
  updateQuantity: (deckId: string, cardId: string, qty: number) => void;
}

interface UISlice {
  searchViewMode: "grid" | "list";
  deckViewMode: "category" | "type" | "cmc";
  setSearchViewMode: (mode: "grid" | "list") => void;
  setDeckViewMode: (mode: "category" | "type" | "cmc") => void;
}

type AppStore = DeckSlice & CardSlice & UISlice;

// deck-slice.ts
const createDeckSlice: StateCreator<AppStore, [], [], DeckSlice> = (set, get) => ({
  decks: [],
  activeDeckId: null,
  createDeck: (name, commander) => {
    const id = crypto.randomUUID();
    set(state => ({
      decks: [...state.decks, { id, name, commander, cards: [] }],
      activeDeckId: id,
    }));
    return id;
  },
  // ...
});

// store.ts — composition point (~20 lines)
export const useAppStore = create<AppStore>()((...a) => ({
  ...createDeckSlice(...a),
  ...createCardSlice(...a),
  ...createUISlice(...a),
}));
```

### Selector Patterns

Never subscribe to the entire store. Fine-grained selectors prevent wasted renders:

```typescript
// ❌ Re-renders on ANY state change
const { decks, addCard, searchViewMode } = useAppStore();

// ✅ Only re-renders when activeDeck changes
const activeDeck = useAppStore(s =>
  s.decks.find(d => d.id === s.activeDeckId) ?? null
);

// ✅ Multiple values with shallow equality
import { useShallow } from "zustand/react/shallow";

const { cards, addCard } = useAppStore(
  useShallow(s => ({
    cards: s.decks.find(d => d.id === s.activeDeckId)?.cards ?? [],
    addCard: s.addCard,
  }))
);

// ✅ Derived computation — memoized selector
const cardCount = useAppStore(s => {
  const deck = s.decks.find(d => d.id === s.activeDeckId);
  return deck?.cards.reduce((sum, c) => sum + c.quantity, 0) ?? 0;
});
```

### Middleware Stack

Recommended middleware for production:

```typescript
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const useAppStore = create<AppStore>()(
  devtools(           // Redux DevTools integration (dev only)
    subscribeWithSelector( // Fine-grained subscriptions
      immer(          // Immutable updates with mutable syntax
        persist(      // localStorage persistence
          (...a) => ({
            ...createDeckSlice(...a),
            ...createCardSlice(...a),
          }),
          {
            name: "deck-store",
            partialize: (state) => ({
              decks: state.decks,    // persist decks
              // don't persist UI state
            }),
          }
        )
      )
    ),
    { name: "MagicAIBuilder" }
  )
);
```

---

## Data Fetching with TanStack Query

### Query Key Convention

Structured keys enable targeted invalidation:

```typescript
const queryKeys = {
  cards: {
    all: ["cards"] as const,
    search: (query: string) => ["cards", "search", query] as const,
    detail: (id: string) => ["cards", "detail", id] as const,
    batch: (names: string[]) => ["cards", "batch", names.join(",")] as const,
  },
  decks: {
    all: ["decks"] as const,
    detail: (id: string) => ["decks", id] as const,
    stats: (id: string) => ["decks", id, "stats"] as const,
  },
} as const;

// Usage
useQuery({ queryKey: queryKeys.cards.search(query), queryFn: /* ... */ });

// Invalidate all card searches
queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
```

### Hook Patterns for API Calls

```typescript
/**
 * Searches Scryfall for cards matching a query.
 * Debounced — only fires after 400ms of no typing.
 */
function useCardSearch(query: string) {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);

  return useQuery({
    queryKey: queryKeys.cards.search(debouncedQuery),
    queryFn: ({ signal }) => searchCards(debouncedQuery, { signal }),
    enabled: debouncedQuery.length >= 2, // don't search for "a"
    staleTime: 5 * 60 * 1000, // cache results for 5 minutes
    placeholderData: keepPreviousData, // show old results while loading
  });
}

/**
 * Fetches a single card by exact name.
 * Uses Scryfall's /cards/named endpoint.
 */
function useCardByName(name: string | null) {
  return useQuery({
    queryKey: queryKeys.cards.detail(name ?? ""),
    queryFn: () => getCardByName(name!),
    enabled: name !== null && name.length > 0,
    staleTime: 30 * 60 * 1000, // card data doesn't change often
  });
}
```

### Mutation with Optimistic Updates

```typescript
function useAddCardMutation(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (card: ScryfallCard) =>
      fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify({ scryfallId: card.id }),
      }).then(r => r.json()),

    // Optimistic update — UI responds instantly
    onMutate: async (card) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.decks.detail(deckId) });
      const previous = queryClient.getQueryData(queryKeys.decks.detail(deckId));

      queryClient.setQueryData(queryKeys.decks.detail(deckId), (old: Deck) => ({
        ...old,
        cards: [...old.cards, adaptScryfallCard(card)],
      }));

      return { previous };
    },

    // Rollback on error
    onError: (_err, _card, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.decks.detail(deckId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decks.detail(deckId) });
    },
  });
}
```

---

## Next.js App Router Patterns

### Server vs Client Component Decision Tree

```
Does it need state (useState, useReducer)?        → Client
Does it use effects (useEffect)?                   → Client
Does it use browser APIs (window, document)?       → Client
Does it use event handlers (onClick, onChange)?     → Client
Does it use custom hooks with state?               → Client
Everything else?                                   → Server (default)
```

### Layout Pattern — Shared UI Shell

```typescript
// app/builder/layout.tsx — Server Component (no "use client")
export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />      {/* Server component */}
      <main className="flex-1 overflow-auto">
        {children}     {/* Page content */}
      </main>
    </div>
  );
}
```

### Error Boundary Pattern

Every route segment should have an error boundary:

```typescript
// app/builder/[deckId]/error.tsx
"use client";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BuilderError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log to error reporting service
    reportError(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
```

### Loading States

```typescript
// app/builder/[deckId]/loading.tsx
export default function BuilderLoading() {
  return (
    <div className="flex h-screen">
      <div className="w-[300px] animate-pulse bg-surface" />
      <div className="flex-1 animate-pulse bg-surface-alt" />
      <div className="w-[280px] animate-pulse bg-surface" />
    </div>
  );
}
```

### API Route Pattern

```typescript
// app/api/decks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateDeckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params; // Next.js 15: params is a Promise
    const body = UpdateDeckSchema.safeParse(await req.json());

    if (!body.success) {
      return NextResponse.json(
        { error: body.error.flatten() },
        { status: 400 },
      );
    }

    const deck = await updateDeck(id, body.data);
    return NextResponse.json(deck);
  } catch (error) {
    console.error("[PATCH /api/decks/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
```

---

## Performance Optimization

### Memoization Rules

| What | How | When |
|------|-----|------|
| Derived data from arrays/objects | `useMemo` | Always |
| Event handlers passed as props | `useCallback` | Always |
| Components receiving non-primitive props | `memo()` | When parent re-renders often |
| Expensive computations (sort, filter, reduce) | `useMemo` | Always |
| Stable references (debounced functions, etc.) | `useRef` | When identity matters |

### Lazy Loading Heavy Components

```typescript
import { lazy, Suspense } from "react";

// Only loaded when user opens the modal
const PlaytestModal = lazy(() => import("@/components/playtest/PlaytestModal"));
const AISuggestionsPanel = lazy(() => import("@/components/deck/AISuggestionsPanel"));

function BuilderPage() {
  const [showPlaytest, setShowPlaytest] = useState(false);

  return (
    <>
      <DeckEditor />
      {showPlaytest && (
        <Suspense fallback={<ModalSkeleton />}>
          <PlaytestModal onClose={() => setShowPlaytest(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### Image Optimization

```typescript
// ✅ Use next/image for automatic optimization
import Image from "next/image";

function CardImage({ card }: { card: DeckCard }) {
  return (
    <Image
      src={card.imageUrl}
      alt={card.name}
      width={244}
      height={340}
      loading="lazy"           // below-the-fold images
      placeholder="blur"
      blurDataURL={CARD_BACK_BLUR} // low-res card back as placeholder
      className="rounded-lg"
    />
  );
}
```

---

## Testing Patterns

### Component Testing with Testing Library

```typescript
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

describe("CardListItem", () => {
  const mockCard: DeckCard = {
    id: "test-1",
    name: "Sol Ring",
    category: "ramp",
    quantity: 1,
    cmc: 1,
    // ...
  };

  it("displays card name and mana cost", () => {
    render(<CardListItem card={mockCard} onRemove={vi.fn()} />);
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
  });

  it("calls onRemove with card ID when remove button is clicked", async () => {
    const onRemove = vi.fn();
    render(<CardListItem card={mockCard} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("test-1");
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("useDeckStats", () => {
  it("computes correct mana curve for a mixed deck", () => {
    const cards = [
      mockCard({ cmc: 1, quantity: 4 }),
      mockCard({ cmc: 2, quantity: 8 }),
      mockCard({ cmc: 3, quantity: 6 }),
      mockCard({ category: "land", quantity: 36 }),
    ];

    const { result } = renderHook(() => useDeckStats(cards));

    expect(result.current.avgCmc).toBeCloseTo(2.11, 2);
    expect(result.current.totalCards).toBe(54);
    expect(result.current.categoryCounts.get("land")).toBe(36);
  });
});
```

### Store Testing

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("useDeckStore", () => {
  beforeEach(() => {
    // Reset store between tests
    useDeckStore.setState({ decks: [], activeDeckId: null });
  });

  it("creates a deck with a commander", () => {
    const id = useDeckStore.getState().createDeck("Test", mockCommander);

    const deck = useDeckStore.getState().decks.find(d => d.id === id);
    expect(deck).toBeDefined();
    expect(deck!.name).toBe("Test");
    expect(deck!.commander?.name).toBe(mockCommander.name);
  });

  it("prevents adding cards that violate color identity", () => {
    // Setup: Mono-white commander
    const deckId = useDeckStore.getState().createDeck("Mono W", monoWhiteCommander);

    // Act: Try to add a blue card
    useDeckStore.getState().addCard(deckId, blueCard);

    // Assert: Card should not be added (or flagged)
    const deck = useDeckStore.getState().decks.find(d => d.id === deckId);
    expect(deck!.cards).toHaveLength(0);
  });
});
```
