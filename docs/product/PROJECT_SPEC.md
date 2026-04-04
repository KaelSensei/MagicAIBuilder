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
- Legal, accessible, fan-site compliant

---

## Stack

| Layer           | Technology                   | Version                   |
| --------------- | ---------------------------- | ------------------------- |
| Framework       | Next.js (App Router)         | 15.x                      |
| Language        | TypeScript                   | 5.x strict                |
| Styling         | Tailwind CSS                 | 4.x                       |
| Components      | shadcn/ui (Radix primitives) | latest                    |
| Animations      | Framer Motion                | 11.x                      |
| State           | Zustand                      | 5.x                       |
| Data fetching   | TanStack Query               | 5.x                       |
| Drag & Drop     | dnd-kit                      | 6.x                       |
| Database        | PostgreSQL 16                | via Docker                |
| ORM             | Prisma                       | 6.x (7.x upgrade pending) |
| Validation      | Zod                          | 3.x                       |
| Icons           | Lucide React                 | latest                    |
| Package manager | pnpm                         | 10.x                      |
| Testing         | Vitest 3 + Playwright        | —                         |

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
  id: string; // DB CUID (from Prisma DeckCard.id)
  scryfallId: string; // Scryfall card UUID
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
  | "commander"
  | "companion"
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

type CommanderPairingType =
  | "none"
  | "partner"
  | "partner_with"
  | "friends_forever"
  | "background"
  | "doctor"
  | "character_select";

interface Deck {
  id: string; // DB CUID
  name: string;
  commander: DeckCard | null;
  partner: DeckCard | null;
  pairingType: CommanderPairingType;
  /** Ikoria-style companion: outside the 99, registration sideboard slot — not generic Sideboard-tab cards. See [COMPANION_IMPLEMENTATION.md](./COMPANION_IMPLEMENTATION.md). */
  companion: DeckCard | null;
  cards: DeckCard[]; // The 99 (or 98 with partner)
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

| Card          | Max copies |
| ------------- | ---------- |
| Nazgûl        | 9          |
| Seven Dwarves | 7          |

### Implementation

- `maxQuantity(cardName, typeLine): number` — returns the max allowed quantity for a card
- `allowsMultiples(cardName, typeLine): boolean` — true if max > 1
- `addCard` / `addDeckCard` increment quantity up to `maxQuantity` instead of blocking
- `updateCardQuantity(cardId, delta)` enforces bounds client-side before persisting
- `+` / `−` buttons appear on hover in list view only when the card allows multiples

---

## User Stories

Track detailed user stories in [`docs/product/US_DETAIL.md`](./US_DETAIL.md). Quick summary below:

**Companion (Ikoria)** — product & rules reference: [`docs/product/COMPANION_IMPLEMENTATION.md`](./COMPANION_IMPLEMENTATION.md) (linked from **US-M** in `US_DETAIL.md`).

### Phase 9 — Core MVP (✅ all complete)

| Story                     | Details                                                                                                                                                                                   | PR      | Status  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| **P0 — Core builder**     | Search, add cards, drag-drop, live stats, bracket scoring, banlist/GC warnings                                                                                                            | Various | ✅ Done |
| **P1 — Persistence & UX** | Deck import (plain text), export (MTGO/Arena), grid/list view, inline rename, card printing selector, companion data + export ([full Companion UX — US-M](./COMPANION_IMPLEMENTATION.md)) | Various | ✅ Done |
| **P2 — Features**         | Card hover preview, advanced filters, combo detection (Spellbook), AI suggestions, light/dark theme, deck snapshots, annotations/tags                                                     | Various | ✅ Done |
| **US-01**                 | Game Changers / Banlist pagination (25/page, searchable, tabs)                                                                                                                            | #192    | ✅ Done |
| **US-02**                 | User accounts & deck sharing (public profiles, share URLs, private/public toggle)                                                                                                         | #194    | ✅ Done |
| **US-03**                 | Moxfield / Archidekt import from URL                                                                                                                                                      | #195    | ✅ Done |
| **US-04**                 | Onboarding tutorial for new users (wizard, tooltips, `onboardingDone` flag)                                                                                                               | #197    | ✅ Done |

### Sprint 2 (✅ all complete)

| Story    | Details                                                                                  | PR   | Status  |
| -------- | ---------------------------------------------------------------------------------------- | ---- | ------- |
| **US-A** | Bulk edit Sideboard & Maybeboard (multi-select, bulk move/delete, color validation)      | #199 | ✅ Done |
| **US-B** | Hybrid mana cards support (correct color identity, symbol display, 0.5 pip distribution) | #200 | ✅ Done |
| **US-C** | Enhanced AI deck builder (archetype detection, budget constraints, per-card reasoning)   | #201 | ✅ Done |
| **US-D** | Proxy sheets PDF export (configurable layout, client-side generation, 63×88mm cards)     | #202 | ✅ Done |

### Sprint 3 (✅ all complete)

| Story    | Details                                                                                                       | PR   | Status  |
| -------- | ------------------------------------------------------------------------------------------------------------- | ---- | ------- |
| **US-E** | Import from URL tournament (6 sources: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec)             | #204 | ✅ Done |
| **US-F** | Meta analysis — top cards & competitive decks for commander (EDHRec + tournament aggregation)                 | #205 | ✅ Done |
| **US-M** | Ikoria Companion — dedicated slot, search mode, validation & warnings ([spec](./COMPANION_IMPLEMENTATION.md)) | #283 | ✅ Done |

### Sprint 4 (🔄 in progress)

| Story    | Details                                                                                               | PR  | Status         |
| -------- | ----------------------------------------------------------------------------------------------------- | --- | -------------- |
| **US-G** | Collection tracking + shopping list (owned/missing per card, CSV export, `/collection` page)          | —   | 🔄 In Progress |
| **US-H** | Multiple format support (Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker)      | —   | ⏳ Waiting     |
| **US-I** | Community deck suggestions (upvote/comment, public `/commanders/[slug]/decks`, meta integration)      | —   | ⏳ Waiting     |
| **US-J** | i18n multi-language (EN, FR, JA, DE, ES, PT, ZH-Hans, IT via `next-intl` + Scryfall `lang` parameter) | —   | ⏳ Waiting     |

### Sprint 5 (🔄 planned)

| Story    | Details                                                                                             | PR  | Status         |
| -------- | --------------------------------------------------------------------------------------------------- | --- | -------------- |
| **US-K** | Enhanced Playtest Mode (hand management, London mulligan, turn phases, full-screen modal)           | —   | 🔄 In Progress |
| **US-L** | Advanced Deck Analytics (synergy scoring, threat density, interaction ratio, format-specific stats) | —   | ⏳ Waiting     |

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
--bracket-1: #22c55e; /* Green - casual */
--bracket-2: #3b82f6; /* Blue - core */
--bracket-3: #f59e0b; /* Amber - upgraded */
--bracket-4: #ef4444; /* Red - optimized */
```

---

## Scryfall Image Sizes

| Size       | Dimensions | Used For                           |
| ---------- | ---------- | ---------------------------------- |
| `normal`   | 488×680    | Card grid display                  |
| `large`    | 672×936    | Hover zoom                         |
| `art_crop` | variable   | Deck card backgrounds on home page |
| `small`    | 146×204    | Thumbnails                         |
| `png`      | 745×1040   | Highest quality                    |

---

## Legal & Compliance

See `LEGAL.md` for full disclaimer text.

- **Wizards of the Coast**: MagicAIBuilder is unofficial fan content permitted under the Fan Content Policy. Not affiliated with or endorsed by WotC.
- **Scryfall**: Card data and images provided via the Scryfall API. Not affiliated with Scryfall LLC.
- All card names, art, and game mechanics are © Wizards of the Coast LLC.
