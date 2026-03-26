# MagicAIBuilder ✦

![Banner](assets/banner.png)

> A beautiful, intelligent Commander deck builder powered by Scryfall, bracket scoring, and AI suggestions.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

[![CI](https://github.com/KaelSensei/MagicAIBuilder/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/KaelSensei/MagicAIBuilder/actions/workflows/ci.yml)
[![SonarCloud](https://github.com/KaelSensei/MagicAIBuilder/actions/workflows/sonar.yml/badge.svg?branch=main)](https://github.com/KaelSensei/MagicAIBuilder/actions/workflows/sonar.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=alert_status)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=coverage)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=bugs)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=code_smells)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=sqale_index)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=KaelSensei_MagicAIBuilder&metric=duplicated_lines_density)](https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder)

## Features

- 🔍 **Scryfall search** — full syntax support, commander mode, By Set, By Color
- 🎨 **Card printing selector** — choose your preferred art before adding or swap it anytime from the deck list
- 🃏 **Drag & drop deck builder** — list and grid views, categorized zones; commander pinned first in grid view
- 📊 **Live bracket scoring** — 6-dimension analysis (ramp, draw, removal, tutors, win speed, CMC)
- ⚡ **Game Changers detection** — auto-warns when you cross bracket thresholds
- 🤖 **AI suggestions** — Anthropic Claude or OpenAI GPT analyzes your deck and recommends cards + cuts
- 🤝 **Partner pairing** — Partner, Partner With, Friends Forever, Background, Doctor's Companion, Character Select (TMNT) — filtered search per pairing type
- 📦 **Companion support** — sideboard companion slot
- 📤 **Multi-format export** — Moxfield, MTG Arena, MTGO (.dek), TappedOut, Archidekt, Manabox, Plain Text; import from Moxfield format (SET) 123
- 👑 **Set as commander** — crown icon on any deck card promotes it to commander slot
- 🔢 **Card quantities** — +/- buttons for basic lands and Commander-legal multiples (auto-detected via oracle text)
- 📝 **Deck notes & tags** — per-card notes, deck description, colored tag pills
- 📸 **Deck snapshots** — save and restore deck states at any point
- 🔗 **Deck sharing** — generate a shareable read-only link
- 🎮 **Playtest mode** — draw opening hand, mulligan, simulate turns
- ⌨️ **Keyboard shortcuts** — power-user navigation with undo stack
- 🌙 **Dark / Light theme** — persisted across sessions
- 🔒 **Security hardened** — Zod validation, input sanitization, no client-side secrets

## Stack

| Layer         | Tech                    |
| ------------- | ----------------------- |
| Framework     | Next.js 15 (App Router) |
| Language      | TypeScript 5            |
| Styling       | Tailwind CSS 4          |
| Components    | shadcn/ui + Radix       |
| Animations    | Framer Motion           |
| State         | Zustand 5               |
| Data fetching | TanStack Query 5        |
| Database      | PostgreSQL 16 + Prisma  |
| Drag & Drop   | dnd-kit 6               |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone
git clone https://github.com/KaelSensei/MagicAIBuilder.git
cd MagicAIBuilder

# Install dependencies (generates Prisma client automatically)
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — DATABASE_URL is pre-filled for local Docker

# Start the database
pnpm db:up

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI Suggestions (optional)

Add one of these to `.env.local` for personalized AI deck analysis:

```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

Without a key, the AI panel uses curated generic suggestions.

## Scripts

| Command           | Description                 |
| ----------------- | --------------------------- |
| `pnpm dev`        | Start dev server            |
| `pnpm build`      | Production build            |
| `pnpm lint`       | ESLint check                |
| `pnpm test`       | Unit tests (Vitest)         |
| `pnpm test:e2e`        | E2E tests (Playwright, local)           |
| `pnpm test:e2e:docker` | E2E tests in Docker (identical to CI)   |
| `pnpm test:e2e:ui`     | E2E tests with interactive UI           |
| `pnpm test:e2e:report` | Open last Playwright HTML report        |
| `pnpm db:up`      | Start PostgreSQL via Docker |
| `pnpm db:down`    | Stop PostgreSQL             |
| `pnpm db:migrate` | Apply pending migrations    |
| `pnpm db:studio`  | Open Prisma Studio          |
| `pnpm db:reset`   | Reset database              |

## E2E Testing with Docker

Run the full Playwright suite in Docker — works identically on any machine:

```bash
pnpm test:e2e:docker
```

This matches what runs in GitHub Actions CI exactly. No more "works on my machine".

## Architecture

```
Browser (Zustand — optimistic updates)
    ↕ fetch
Next.js API Routes (/api/decks/*, /api/ai/suggest)
    ↕ Prisma Client
PostgreSQL 16 (Docker)
```

External APIs:

- **Scryfall** — card search, images, Game Changers list, banlist (direct from browser, CORS allowed)
- **Commander Spellbook** — combo detection (proxied via /api/combos)
- **Anthropic / OpenAI** — AI suggestions (server-side only, key never exposed to client)

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for the full security architecture.

Key points:

- All API keys are server-side only
- Input validation via Zod on all API routes
- HTML sanitization on user-controlled strings
- Commander Spellbook proxied to avoid CORS and SSRF vectors

## License

MIT

## Legal

Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of the Coast LLC. © 1993-2026 Wizards. All Rights Reserved.

MagicAIBuilder is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC. This project operates under Wizards' Fan Site Policy. MAGIC: THE GATHERING® is a trademark of Wizards of the Coast.

Some card prices and other card data are provided by [Scryfall](https://scryfall.com). Scryfall makes no guarantee about its price information.

See [LEGAL.md](LEGAL.md) for full legal notices.
