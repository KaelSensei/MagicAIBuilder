# MagicAIBuilder - Technical Specification (Phase 1: Foundation)

## Objective

Build the Free Build mode: a desktop-first Commander deck builder with Scryfall-powered card search, drag & drop deck editor, live stats, bracket scoring, Game Changers detection, and banlist enforcement.

Phase 1 does NOT include AI-assisted build. That's Phase 3. This phase is the Moxfield-like experience with bracket intelligence baked in.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui (Radix primitives) | latest |
| Animations | Framer Motion | 11.x |
| State | Zustand | 5.x |
| Data fetching | TanStack Query (React Query) | 5.x |
| Drag & Drop | dnd-kit | 6.x |
| Icons | Lucide React | latest |
| Linting | ESLint + Prettier | latest |
| Package manager | pnpm | latest |

### Why These Choices

- **Zustand** over Redux: less boilerplate, simpler for a single-page builder app. Deck state is the core and Zustand handles it cleanly.
- **TanStack Query** for Scryfall API calls: handles caching, deduplication, retry, and stale data. Scryfall has rate limits (10 req/s), TanStack Query prevents duplicate requests naturally.
- **dnd-kit** over react-beautiful-dnd: actively maintained, better performance, more flexible for card grid drag & drop.
- **Framer Motion**: card hover zoom, panel transitions, smooth drag animations. This is core to the "beautiful" requirement.

---

## Project Structure

```
magic-ai-builder/
  src/
    app/
      layout.tsx                  # Root layout (dark theme, fonts)
      page.tsx                    # Home / deck list
      builder/
        [deckId]/
          page.tsx                # Main builder view
    components/
      ui/                         # shadcn/ui components (button, dialog, input, etc.)
      layout/
        Header.tsx                # App header with nav
        Sidebar.tsx               # Left sidebar (deck categories, stats)
      card/
        CardImage.tsx             # Card image with hover zoom (Scryfall images)
        CardTooltip.tsx           # Hover tooltip with card details
        CardGrid.tsx              # Grid display for search results
        CardListItem.tsx          # Compact list view for deck cards
      search/
        SearchBar.tsx             # Scryfall search input with autocomplete
        SearchFilters.tsx         # Color identity, type, CMC, price filters
        SearchResults.tsx         # Search results panel (grid or list)
      deck/
        DeckEditor.tsx            # Main deck editor (drag & drop zones)
        DeckCategory.tsx          # Category group (Creatures, Ramp, Draw, etc.)
        DeckStats.tsx             # Live stats panel (mana curve, color pie, counts)
        ManaCurve.tsx             # Mana curve bar chart
        ColorDistribution.tsx     # Color pie chart
        BracketIndicator.tsx      # Current bracket score with breakdown
        GameChangersBadge.tsx     # Game Changers count with warning
        BanlistAlert.tsx          # Alert when a banned card is added
      commander/
        CommanderPicker.tsx       # Commander selection with search
        CommanderCard.tsx         # Commander display card (prominent)
    lib/
      scryfall/
        client.ts                 # Scryfall API client (rate-limited, cached)
        types.ts                  # Scryfall card types
        search.ts                 # Search query builder
        images.ts                 # Card image URL helpers
      deck/
        types.ts                  # Deck, Card, Category types
        store.ts                  # Zustand deck store
        categories.ts             # Auto-categorize cards (ramp, draw, removal, etc.)
        stats.ts                  # Deck stats computation
        bracket.ts                # Bracket scoring engine
        validation.ts             # Banlist + Game Changers + color identity checks
        import.ts                 # Import from text/Moxfield/Archidekt
        export.ts                 # Export to text/Moxfield/Archidekt
      constants/
        brackets.ts               # Bracket definitions and thresholds
        benchmarks.ts             # EDH heuristic benchmarks by bracket
    hooks/
      useCardSearch.ts            # TanStack Query hook for Scryfall search
      useCardLookup.ts            # TanStack Query hook for single card lookup
      useDeck.ts                  # Zustand hook for deck state
      useBracketScore.ts          # Computed bracket score from deck state
      useGameChangers.ts          # Game Changers detection hook
    styles/
      globals.css                 # Tailwind base + custom dark theme
  public/
    fonts/                        # Custom fonts (Geist or Inter)
```

---

## Core Data Types

```typescript
// lib/deck/types.ts

interface DeckCard {
  id: string;                    // Scryfall card ID
  name: string;
  manaCost: string;              // e.g., "{2}{U}{U}"
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];       // ["W", "U", "B", "R", "G"]
  isGameChanger: boolean;
  isBanned: boolean;
  price: number | null;          // USD
  imageUri: string;              // Scryfall image URL (normal)
  artCropUri: string;            // Art crop for backgrounds
  category: CardCategory;        // Auto-assigned or manual
  quantity: number;              // Always 1 in Commander (except basics)
}

type CardCategory =
  | "commander"
  | "creature"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "planeswalker"
  | "land"
  | "ramp"
  | "draw"
  | "removal"
  | "boardWipe"
  | "winCondition"
  | "protection"
  | "other";

interface Deck {
  id: string;
  name: string;
  commander: DeckCard | null;
  partner: DeckCard | null;      // For partner commanders
  cards: DeckCard[];             // The 99 (or 98 with partner)
  format: "commander" | "brawl";
  targetBracket: 1 | 2 | 3 | 4;
  budget: number | null;         // Max price per card in USD
  createdAt: Date;
  updatedAt: Date;
}

interface DeckStats {
  totalCards: number;            // Should be 100
  lands: number;
  creatures: number;
  ramp: number;
  draw: number;
  removal: number;
  boardWipes: number;
  avgCmc: number;
  manaCurve: Record<number, number>;  // CMC -> count
  colorDistribution: Record<string, number>; // Color -> count
  gameChangersCount: number;
  gameChangersList: string[];    // Card names
  totalPrice: number;
  overBudgetCards: string[];     // Cards exceeding budget
  bannedCards: string[];         // Banned cards in deck
  colorIdentityViolations: string[]; // Cards outside commander identity
}

interface BracketScore {
  overall: 1 | 2 | 3 | 4;
  dimensions: {
    ramp: number;
    draw: number;
    removal: number;
    tutors: number;
    winSpeed: number;
    avgCmc: number;
  };
  gameChangers: number;
  warnings: string[];            // Human-readable bracket warnings
}
```

---

## Scryfall API Integration

### Rate Limiting
Scryfall allows 10 requests/second. Implement a request queue with 100ms minimum delay between requests.

```typescript
// lib/scryfall/client.ts
// Use a simple queue + TanStack Query's built-in caching

const SCRYFALL_BASE = "https://api.scryfall.com";
const MIN_DELAY_MS = 100;

// Headers required by Scryfall
const headers = {
  "User-Agent": "MagicAIBuilder/1.0",
  "Accept": "application/json",
};
```

### Key Endpoints Used

| Endpoint | Usage | Cache TTL |
|----------|-------|-----------|
| `GET /cards/search?q={query}` | Card search | 5 min |
| `GET /cards/named?exact={name}` | Single card lookup | 24h |
| `GET /cards/named?fuzzy={name}` | Fuzzy card lookup | 24h |
| `POST /cards/collection` | Batch lookup (up to 75) | 24h |
| `GET /cards/autocomplete?q={partial}` | Search autocomplete | 5 min |
| `GET /catalog/card-names` | Full card name list | 24h |
| `GET /cards/search?q=is:gamechanger` | Game Changers list | 24h |
| `GET /cards/search?q=banned:commander` | Banlist | 24h |

### Card Images

Scryfall provides multiple image sizes:
```
https://cards.scryfall.io/normal/front/{a}/{b}/{uuid}.jpg    // 488x680
https://cards.scryfall.io/large/front/{a}/{b}/{uuid}.jpg     // 672x936
https://cards.scryfall.io/art_crop/front/{a}/{b}/{uuid}.jpg  // Art only
https://cards.scryfall.io/border_crop/front/{a}/{b}/{uuid}.jpg
https://cards.scryfall.io/png/front/{a}/{b}/{uuid}.png       // Highest quality
```

Use `normal` for grid display, `large` for hover zoom, `art_crop` for backgrounds.

---

## Card Auto-Categorization

Cards are auto-categorized by analyzing their type line and oracle text:

```typescript
// lib/deck/categories.ts

function categorizeCard(card: ScryfallCard): CardCategory {
  const type = card.type_line.toLowerCase();
  const text = (card.oracle_text || "").toLowerCase();

  // Explicit type matches first
  if (type.includes("land")) return "land";
  if (type.includes("planeswalker")) return "planeswalker";

  // Functional categories (override type)
  if (isRamp(card)) return "ramp";
  if (isBoardWipe(card)) return "boardWipe";
  if (isRemoval(card)) return "removal";
  if (isCardDraw(card)) return "draw";

  // Fall back to card type
  if (type.includes("creature")) return "creature";
  if (type.includes("instant")) return "instant";
  if (type.includes("sorcery")) return "sorcery";
  if (type.includes("artifact")) return "artifact";
  if (type.includes("enchantment")) return "enchantment";

  return "other";
}
```

Ramp detection: oracle text contains "add {", "search your library for a land", "put a land", "mana of any color" + low CMC.
Removal detection: "destroy target", "exile target", "deals X damage to target", "-X/-X".
Board wipe detection: "destroy all", "exile all", "deals X damage to each".
Card draw detection: "draw a card", "draw cards", "draw X cards".

Users can always manually recategorize cards by dragging between categories.

---

## Bracket Scoring Engine

```typescript
// lib/deck/bracket.ts

function scoreBracket(deck: Deck, stats: DeckStats): BracketScore {
  const dimensions = {
    ramp: scoreRamp(stats.ramp, stats.avgCmc),
    draw: scoreDraw(stats.draw),
    removal: scoreRemoval(stats.removal, stats.boardWipes),
    tutors: scoreTutors(deck.cards),
    winSpeed: scoreWinSpeed(deck.cards, stats.avgCmc),
    avgCmc: scoreCmc(stats.avgCmc),
  };

  // Average dimensions, then adjust for Game Changers
  let overall = Math.round(average(Object.values(dimensions)));

  // Game Changers force minimum bracket
  if (stats.gameChangersCount > 3) overall = Math.max(overall, 4);
  else if (stats.gameChangersCount > 0) overall = Math.max(overall, 3);

  return {
    overall: clamp(overall, 1, 4) as 1 | 2 | 3 | 4,
    dimensions,
    gameChangers: stats.gameChangersCount,
    warnings: generateWarnings(deck, stats, dimensions),
  };
}
```

---

## UI Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: [Logo] MagicAIBuilder    [My Decks] [New Deck] [Import]│
├──────────┬─────────────────────────────┬────────────────────────┤
│          │                             │                        │
│  Search  │      Deck Editor            │    Stats Panel         │
│  Panel   │                             │                        │
│  (300px) │  ┌─Commander Zone──────┐    │  ┌─Bracket Score─────┐ │
│          │  │  [Commander Card]   │    │  │  Bracket: 2       │ │
│  [Search]│  └─────────────────────┘    │  │  ████░░░░ 2.3     │ │
│  [Filter]│                             │  │  GC: 0/0 allowed  │ │
│          │  ┌─Creatures (24)──────┐    │  └───────────────────┘ │
│  Results │  │  [card] [card] [card]│    │                        │
│  Grid    │  │  [card] [card] [card]│    │  ┌─Mana Curve──────┐ │
│  or List │  └─────────────────────┘    │  │  ▁▃█▆▃▂▁         │ │
│          │                             │  └───────────────────┘ │
│  Click   │  ┌─Ramp (8)───────────┐    │                        │
│  or drag │  │  [card] [card]      │    │  ┌─Color Pie────────┐ │
│  to add  │  └─────────────────────┘    │  │   W:12 U:18 B:8  │ │
│          │                             │  └───────────────────┘ │
│          │  ┌─Card Draw (7)───────┐    │                        │
│          │  │  [card] [card]      │    │  ┌─Deck Checks──────┐ │
│          │  └─────────────────────┘    │  │  ✓ 100 cards      │ │
│          │                             │  │  ✓ Color identity  │ │
│          │  ┌─Removal (6)─────────┐    │  │  ✓ Banlist clean   │ │
│          │  │  [card] [card]      │    │  │  ⚠ Low ramp (5)   │ │
│          │  └─────────────────────┘    │  └───────────────────┘ │
│          │                             │                        │
│          │  [+ more categories...]     │  ┌─Budget─────────────┐│
│          │                             │  │  Total: $87.50     ││
│          │                             │  │  Over budget: 0    ││
│          │                             │  └────────────────────┘│
├──────────┴─────────────────────────────┴────────────────────────┤
│  Footer: [Export] [Save] [Bracket: 2] [Cards: 97/100] [$87.50] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Theme & Design Tokens

Dark theme by default. MTG players overwhelmingly prefer dark mode.

```css
/* Color palette */
--background: #0a0a0f;        /* Near-black with slight blue */
--surface: #12121a;            /* Card/panel backgrounds */
--surface-hover: #1a1a25;      /* Hover state */
--border: #2a2a35;             /* Subtle borders */
--text-primary: #e8e8ec;       /* Main text */
--text-secondary: #8888a0;     /* Muted text */
--accent: #6366f1;             /* Primary accent (indigo) */
--accent-hover: #818cf8;

/* MTG mana colors */
--mana-white: #f9faf4;
--mana-blue: #0e68ab;
--mana-black: #150b00;
--mana-red: #d3202a;
--mana-green: #00733e;
--mana-colorless: #ccc2c0;

/* Bracket colors */
--bracket-1: #22c55e;         /* Green - casual */
--bracket-2: #3b82f6;         /* Blue - core */
--bracket-3: #f59e0b;         /* Amber - upgraded */
--bracket-4: #ef4444;         /* Red - optimized */

/* Animations */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms ease;
```

Card hover: scale(1.05) with elevation shadow. Hover zoom: on long hover (300ms), show large card image in a floating panel.

---

## Phase 1 User Stories

### P0 (Must Have)

1. **As a user, I can search for cards** using Scryfall syntax (name, type, color, CMC, oracle text). Results appear in a grid with card images.

2. **As a user, I can pick a commander** from search results. The commander appears in a prominent zone above the deck. Color identity is locked from this choice.

3. **As a user, I can add cards to my deck** by clicking or dragging from search results. Cards are auto-categorized into groups (Creatures, Ramp, Draw, Removal, etc.).

4. **As a user, I can see live deck stats** as I add/remove cards: card count, mana curve, color distribution, avg CMC, category counts.

5. **As a user, I see bracket score update live** as I modify the deck. The bracket indicator shows which bracket my deck falls into with per-dimension breakdown.

6. **As a user, I get warned about banned cards** when I try to add one. The card is flagged with a red indicator and explanation.

7. **As a user, I get warned about Game Changers** with a counter showing how many I have vs. my target bracket allows.

8. **As a user, I get warned about color identity violations** when I try to add a card outside my commander's colors.

### P1 (Should Have)

9. **As a user, I can set a budget** (per card or total) and cards exceeding it are flagged.

10. **As a user, I can manually recategorize cards** by dragging between category groups.

11. **As a user, I can import a decklist** from plain text (1 Card Name format) or Moxfield/Archidekt URL.

12. **As a user, I can export my deck** to plain text, Moxfield, or Archidekt format.

13. **As a user, I can toggle between grid and list view** for both search results and deck cards.

### P2 (Nice to Have)

14. **As a user, I can hover a card to see it full-size** with oracle text, price, and legality info.

15. **As a user, I can filter search by color identity, type, CMC range, and price range** using UI controls (not just raw Scryfall syntax).

16. **As a user, I can save multiple decks** locally (localStorage or IndexedDB).
