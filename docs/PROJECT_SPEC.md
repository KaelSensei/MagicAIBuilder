# MagicAIBuilder — Project Specification

## Objective

A desktop-first Commander (EDH) deck builder with:
- Scryfall-powered card search (name, set, color identity)
- Drag & drop deck editor with auto-categorization
- Live deck statistics (mana curve, color distribution, avg CMC)
- Real-time bracket scoring (MTG Commander Brackets 1–4) with 6 dimensions
- Game Changers detection and banlist enforcement
- Combo detection via Commander Spellbook
- Maybeboard (considered cards outside the 99, with move-to-deck / remove)
- AI-assisted deck suggestions (Anthropic Claude / OpenAI fallback)
- Persistent multi-deck storage (PostgreSQL + Prisma)
- Card printing/art selector
- Import/export (plain text, MTGO, Arena)
- **Deck snapshots** — named version history (save/restore/delete + diff badges)
- Light/dark theme with persistence
- **Keyboard shortcuts** for power-user deck building (`/`, `↑↓`, `Enter`, `Esc`, `?`, `Cmd+Z/S/E/I`)
- Undo stack for card add/remove actions
- Legal, accessible, fan-site compliant

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x strict |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui (Radix primitives) | latest |
| Animations | Framer Motion | 11.x |
| State | Zustand | 5.x |
| Data fetching | TanStack Query | 5.x |
| Drag & Drop | dnd-kit | 6.x |
| Database | PostgreSQL 16 | via Docker |
| ORM | Prisma | 6.x |
| Validation | Zod | 3.x |
| Icons | Lucide React | latest |
| Package manager | pnpm | 10.x |
| Testing | Vitest 3 + Playwright | — |

---

## Architecture

```
Browser (React + Zustand)
    ↕ TanStack Query (HTTP)
Next.js App Router (Server + API Routes)
    ↕ Prisma Client
PostgreSQL 16

    ↕ fetch (rate-limited, DB-cached)
Scryfall API

    ↕ fetch
Commander Spellbook API

    ↕ fetch
Anthropic / OpenAI API (AI suggestions)
```

---

## Core Data Types

```typescript
interface DeckCard {
  id: string;                    // DB CUID (from Prisma DeckCard.id)
  scryfallId: string;            // Scryfall card UUID
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];
  isGameChanger: boolean;
  isBanned: boolean;
  price: number | null;
  imageUri: string;
  artCropUri: string;
  category: CardCategory;
  quantity: number;
  keywords: string[];
  cardFaces?: CardFace[];
  layout: string;
}

type CardCategory =
  | "commander" | "creature" | "instant" | "sorcery"
  | "artifact" | "enchantment" | "planeswalker" | "land"
  | "ramp" | "draw" | "removal" | "boardWipe"
  | "winCondition" | "protection" | "other";

type CommanderPairingType =
  | "none" | "partner" | "partner_with"
  | "friends_forever" | "background" | "doctor";

interface Deck {
  id: string;                     // DB CUID
  name: string;
  commander: DeckCard | null;
  partner: DeckCard | null;
  pairingType: CommanderPairingType;
  companion: DeckCard | null;     // Outside the 100, sideboard slot
  cards: DeckCard[];              // The 99 (or 98 with partner)
  format: "commander";
  targetBracket: 1 | 2 | 3 | 4;
  budget: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Commander Card Quantity Rules

Commander is a **singleton** format — max 1 copy per card — with the following exceptions enforced by `src/lib/deck/multiples.ts`:

### Unlimited copies (up to 99)
- All **basic lands** (type line contains "Basic Land")
- Templar Knight
- Tempest Hawk
- Hare Apparent
- Persistent Petitioners
- Shadowborn Apostle
- Rat Colony
- Relentless Rats
- Dragon's Approach
- Slime Against Humanity
- Vazal, the Compleat
- Cid, Timeless Artificer

### Capped copies
| Card | Max copies |
|---|---|
| Nazgûl | 9 |
| Seven Dwarves | 7 |

### Implementation
- `maxQuantity(cardName, typeLine): number` — returns the max allowed quantity for a card
- `allowsMultiples(cardName, typeLine): boolean` — true if max > 1
- `addCard` / `addDeckCard` increment quantity up to `maxQuantity` instead of blocking
- `updateCardQuantity(cardId, delta)` enforces bounds client-side before persisting
- `+` / `−` buttons appear on hover in list view only when the card allows multiples

---

## User Stories

### P0 — Must Have (all complete)

| # | Story | Status |
|---|---|---|
| US-1 | Search cards using Scryfall syntax (name, type, color, CMC, oracle text) | ✅ Done |
| US-2 | Pick a commander — color identity locks from this choice | ✅ Done |
| US-3 | Add cards to deck by clicking or dragging from search results | ✅ Done |
| US-4 | See live deck stats: card count, mana curve, color distribution, avg CMC | ✅ Done |
| US-5 | See bracket score update live with per-dimension breakdown | ✅ Done |
| US-6 | Get warned about banned cards (red flag + explanation) | ✅ Done |
| US-7 | Get warned about Game Changers with bracket-appropriate count | ✅ Done |
| US-8 | Get warned about color identity violations | ✅ Done |

### P1 — Should Have (all complete)

| # | Story | Status |
|---|---|---|
| US-9 | Set a budget (per card) and get cards over budget flagged | ✅ Done |
| US-10 | Manually recategorize cards by dragging between category groups | ✅ Done |
| US-11 | Import a decklist from plain text (1 Card Name format) | ✅ Done |
| US-12 | Export deck to MTGO, Arena, and plain text formats | ✅ Done |
| US-13 | Toggle between grid and list view for search results and deck cards | ✅ Done |
| US-14 | Inline deck rename (click title → input → Enter/Escape) | ✅ Done |
| US-15 | Choose card printing/art before adding to deck | ✅ Done |
| US-16 | Search by set code or color identity (dedicated tabs) | ✅ Done |
| US-17 | Companion card support (sideboard slot, outside the 99) | ✅ Done |

### P2 — Nice to Have (all complete)

| # | Story | Status |
|---|---|---|
| US-18 | Hover a card to see it full-size with oracle text and price | ✅ Done |
| US-19 | Filter by color/type/CMC/price via UI controls | ✅ Done |
| US-20 | Persist multiple decks across sessions | ✅ Done (PostgreSQL) |
| US-21 | Detect combos for current commander via Commander Spellbook | ✅ Done |
| US-22 | AI deck suggestions with reasoning (Claude / GPT fallback) | ✅ Done |
| US-23 | Light/dark theme toggle with persistence | ✅ Done |

### P2 (continued) — Snapshots

| # | Story | Status |
|---|---|---|
| US-24 | Save a named snapshot of the current deck (e.g. "v1 budget") | ✅ Done |
| US-25 | Browse version history of a deck with date, card count, commander | ✅ Done |
| US-26 | Restore a deck to a previous snapshot (with confirmation) | ✅ Done |
| US-27 | Delete a snapshot | ✅ Done |
| US-28 | Diff badge: `+N / -N cards` vs snapshot compared to current | ✅ Done |

### P3 — Future

| # | Story | Status |
|---|---|---|
| US-29 | Onboarding tutorial for new users | 📋 Planned |
| US-30 | Mobile-responsive layout | 📋 Planned |
| US-31 | Paginated Game Changers / banlist (> 175 cards) | 📋 Planned |
| US-32 | Moxfield / Archidekt import from URL | 📋 Planned |
| US-33 | User accounts and deck sharing | 📋 Planned |

---

## UI Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Header: [Logo] MagicAIBuilder    [My Decks] [New Deck] [Theme Toggle]   │
├────────────────┬───────────────────────────┬─────────────────────────────┤
│                │                           │                             │
│  Search Panel  │     Deck Editor           │    Stats Panel              │
│  (300px)       │                           │                             │
│                │  ┌─Commander Zone──────┐  │  ┌─Bracket Score──────────┐ │
│  [Tab: Name]   │  │  [Commander Card]   │  │  │  Bracket: 2            │ │
│  [Tab: Set ]   │  └─────────────────────┘  │  │  ████░░░░  GC: 0       │ │
│  [Tab: Color]  │                           │  └────────────────────────┘ │
│                │  ┌─Creatures (24)──────┐  │                             │
│  [Search Bar]  │  │  [card] [card] [card]│  │  ┌─Mana Curve────────────┐ │
│  [Filters]     │  └─────────────────────┘  │  │  ▁▃█▆▃▂▁               │ │
│                │                           │  └────────────────────────┘ │
│  Results Grid  │  ┌─Ramp (8)───────────┐  │                             │
│  or List       │  │  [card] [card]      │  │  ┌─Color Distribution────┐ │
│                │  └─────────────────────┘  │  │   W:12 U:18 B:8       │ │
│  Click or drag │                           │  └────────────────────────┘ │
│  to add cards  │  ┌─Card Draw (7)───────┐  │                             │
│                │  │  [card] [card]      │  │  ┌─Deck Checks───────────┐ │
│                │  └─────────────────────┘  │  │  ✓ 100 cards           │ │
│                │                           │  │  ✓ Color identity       │ │
│                │  [+ more categories...]   │  │  ✓ Banlist clean        │ │
│                │                           │  │  ⚠ Low ramp (5)        │ │
│                │  ┌─Combos Panel────────┐  │  └────────────────────────┘ │
│                │  │  [Combo list]       │  │                             │
│                │  └─────────────────────┘  │  ┌─AI Suggestions────────┐ │
│                │                           │  │  [Suggestion list]     │ │
│                │                           │  └────────────────────────┘ │
├────────────────┴───────────────────────────┴─────────────────────────────┤
│  Footer: Legal notices (WotC fan policy + Scryfall disclaimer)           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Theme & Design Tokens

Dark theme by default. Light theme available via toggle.

```css
/* Dark theme */
--background: #0a0a0f;
--surface: #12121a;
--surface-hover: #1a1a25;
--border: #2a2a35;
--text-primary: #e8e8ec;
--text-secondary: #8888a0;
--accent: #6366f1;

/* Bracket colors */
--bracket-1: #22c55e;   /* Green - casual */
--bracket-2: #3b82f6;   /* Blue - core */
--bracket-3: #f59e0b;   /* Amber - upgraded */
--bracket-4: #ef4444;   /* Red - optimized */
```

---

## Scryfall Image Sizes

| Size | Dimensions | Used For |
|---|---|---|
| `normal` | 488×680 | Card grid display |
| `large` | 672×936 | Hover zoom |
| `art_crop` | variable | Deck card backgrounds on home page |
| `small` | 146×204 | Thumbnails |
| `png` | 745×1040 | Highest quality |

---

## Legal & Compliance

See `LEGAL.md` for full disclaimer text.

- **Wizards of the Coast**: MagicAIBuilder is unofficial fan content permitted under the Fan Content Policy. Not affiliated with or endorsed by WotC.
- **Scryfall**: Card data and images provided via the Scryfall API. Not affiliated with Scryfall LLC.
- All card names, art, and game mechanics are © Wizards of the Coast LLC.
