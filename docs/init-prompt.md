# OpenClaw Init Prompt — MagicAIBuilder

> **Archival.** This is the prompt that bootstrapped the project, kept as a record of
> the original brief. Several of its instructions no longer describe the app: there is
> a light/dark theme toggle rather than dark only, decks are persisted in Postgres
> rather than held in memory, and the AI features it defers to "Phase 3" have shipped.
> Read `docs/product/project-spec.md` and `CLAUDE.md` for what is actually true today.

Paste this prompt into OpenClaw to bootstrap the project.

---

## Prompt

````
You are a senior React/Next.js frontend developer. You are going to initialise
MagicAIBuilder, a Commander (EDH) deck builder for Magic: The Gathering.

## Context

Read these files in the repo first, to understand the project:
- README.md — overall vision, the two modes, positioning
- docs/product/project-spec.md — the complete Phase 1 technical spec (stack, structure, types, endpoints, UI layout, user stories)
- docs/references/game-changers.md — the Game Changers list, for the bracket system
- docs/references/banlists.md — the Commander banlist
- docs/references/edh-themes.md — themes and archetypes (for later, Phase 3)

## What you have to do

### 1. Initialise the Next.js project

```bash
pnpx create-next-app@latest magic-ai-builder --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd magic-ai-builder
````

### 2. Install the dependencies

```bash
pnpm add zustand @tanstack/react-query framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
pnpm add -D prettier eslint-config-prettier
```

### 3. Install shadcn/ui

```bash
pnpx shadcn@latest init
```

Then add the base components:

```bash
pnpx shadcn@latest add button input dialog card badge tooltip scroll-area separator sheet command popover
```

### 4. Create the folder structure

Follow exactly the structure defined in the "Project Structure" section of
docs/product/project-spec.md.

### 5. Configure the dark theme

Tailwind config with the design tokens from the spec ("Theme & Design Tokens"):

- Background near-black (#0a0a0f)
- Surface panels (#12121a)
- Accent indigo (#6366f1)
- Mana colors (W/U/B/R/G)
- Bracket colors (green/blue/amber/red)

Dark mode must be the DEFAULT, not a toggle.

### 6. Scaffold the base components

Create a minimal (placeholder) version of every component listed in the spec.
Each component must:

- Take the right TypeScript props
- Render a visible placeholder (not an empty div)
- Be exported cleanly

### 7. Create the Scryfall API client

Implement `src/lib/scryfall/client.ts` with:

- Rate limiting (100ms between requests, queued)
- The headers Scryfall requires (User-Agent, Accept)
- TypeScript types for the Scryfall responses
- Functions: searchCards, getCardByName, getCardByFuzzyName, batchLookup, getAutocomplete, getGameChangers, getBannedCards

### 8. Create the Zustand store

Implement `src/lib/deck/store.ts` with the spec's types and these actions:

- setCommander, setPartner, setCompanion
- addCard, removeCard, moveCard (between categories)
- setTargetBracket, setBudget
- importDeck, exportDeck
- computed: getStats, getBracketScore
- Partner validation: check the keyword (Partner, Partner with, Friends Forever, Background, Doctor's companion) and validate the pair
- Companion validation: check the companion's restriction against the whole deck

### 9. Create the builder page

Assemble the components in `src/app/builder/[deckId]/page.tsx`, following the
spec's ASCII layout:

- Left panel: search + results (300px)
- Centre: deck editor (categories with cards)
- Right panel: stats + bracket score + checks

### 10. First working render

The goal: search Scryfall for a card, see its image, and add it to the deck. The
bracket score and the stats must update in real time.

## Rules that matter

- TypeScript strict, no `any`
- Function components only, hooks for the logic
- Framer Motion for EVERY animation (hover, drag, transitions)
- Dark theme ONLY (no light mode)
- Looks are priority #1. Every component must be beautiful, polished, with micro-interactions
- Card images come from Scryfall (cards.scryfall.io)
- Scryfall rate limit: 10 req/s max — debounce the search (300ms)
- Do NOT fetch everything on start-up. Lazy load, search on demand
- No localStorage for decks in Phase 1 (kept in memory)
- Double-faced cards (DFC/MDFC): Scryfall returns `card_faces[]` instead of top-level `oracle_text`/`mana_cost`. Always check `card.layout` and use `card_faces[0]` for the front
- Partner: support all five variants (Partner, Partner with, Friends Forever, Choose a Background, Doctor's companion). The deck's colour identity is the union of both commanders
- Companion: the companion sits OUTSIDE the 100 cards. Its restriction must be satisfied by EVERY card in the deck. Lutri is banned as a companion only

```

---

## Notes

- This prompt is designed to be handed to OpenClaw as-is
- It references files in the repo, so OpenClaw needs access to the MagicAIBuilder folder
- If OpenClaw asks for clarification, point it back at `docs/product/project-spec.md`
- Phase 1 = Free Build only. The AI (Phase 3) comes later
- Remember to commit regularly as components become functional
```
