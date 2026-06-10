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
- 📦 **Companion (Ikoria)** — dedicated slot + **Companion** search mode, rule hints, color/mechanical warnings (not the same as Sideboard pile cards)
- 📤 **Multi-format export** — Moxfield, MTG Arena, MTGO (.dek), TappedOut, Archidekt, Manabox, Plain Text; import from Moxfield format (SET) 123
- 👑 **Set as commander** — crown icon on any deck card promotes it to commander slot
- 🔢 **Card quantities** — +/- buttons for basic lands and Commander-legal multiples (auto-detected via oracle text)
- 📝 **Deck notes & tags** — per-card notes, deck description, colored tag pills
- 📸 **Deck snapshots** — save and restore deck states at any point
- 🔗 **Deck sharing** — generate a shareable read-only link
- 🎮 **Playtest mode** — draw opening hand, mulligan, simulate turns
- ⌨️ **Keyboard shortcuts** — power-user navigation with undo stack
- 🎴 **Multi-format support** — Commander, Brawl, Oathbreaker, Standard, Pioneer, Modern, Legacy, Vintage, Pauper with correct rules per format
- 📦 **Collection tracking** — mark owned cards, shopping list with missing cost, CSV export, bulk "Mark all owned"
- ✨ **3D Spellbook landing** — immersive Three.js scene for unauthenticated visitors (mobile/a11y fallback)
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
| 3D Engine     | Three.js + R3F + drei   |
| Animations    | gsap (camera), Framer   |

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

# Start dev server on http://127.0.0.1:3000
pnpm dev:local
```

Open [http://localhost:3000/fr](http://localhost:3000/fr) for the French UI.
The root URL redirects once to the default English locale:
[http://localhost:3000/en](http://localhost:3000/en).

For a quick landing-page preview without Docker, you can run `pnpm dev:local`
directly. Authenticated deck, collection, and profile features require
PostgreSQL via `pnpm db:up` and `pnpm db:migrate`.

### Seed demo data (optional)

```bash
pnpm db:seed
```

Creates an Atraxa Superfriends demo deck with 100 cards, a snapshot, and collection entries.

### AI Suggestions (optional)

Add one of these to `.env.local` for personalized AI deck analysis:

```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

Without a key, the AI panel uses curated generic suggestions.

## Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Start Next.js dev server                  |
| `pnpm dev:local`  | Start dev server on 127.0.0.1:3000        |
| `pnpm build`      | Production build                          |
| `pnpm analyze`    | Production build + interactive bundle map |
| `pnpm lint`       | ESLint check                              |
| `pnpm test`       | Unit tests (Vitest)                       |
| `pnpm test:e2e`   | E2E tests (Playwright)                    |
| `pnpm db:up`      | Start PostgreSQL via Docker               |
| `pnpm db:down`    | Stop PostgreSQL                           |
| `pnpm db:migrate` | Apply pending migrations                  |
| `pnpm db:studio`  | Open Prisma Studio                        |
| `pnpm db:reset`   | Reset database                            |
| `pnpm db:seed`    | Seed demo data (Atraxa deck)              |

## E2E in Docker (Playwright)

If running Playwright locally is unreliable, you can run E2E tests fully inside Docker:

```bash
docker compose -f docker-compose.e2e.yml up --build --exit-code-from e2e
```

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

See [`docs/security/security.md`](docs/security/security.md) for the full security architecture.

Key points:

- All API keys are server-side only
- Input validation via Zod on all API routes
- HTML sanitization on user-controlled strings
- Commander Spellbook proxied to avoid CORS and SSRF vectors

## Quality Gate 🧪

> Maintained by Marco — The Bug Whisperer. See [`docs/engineering/quality-gate.md`](docs/engineering/quality-gate.md) for full details and history.

| Metric               | Baseline | Minimum |
| -------------------- | -------- | ------- |
| **Coverage**         | 94.3%    | ≥ 90%   |
| **Bugs**             | 0        | = 0     |
| **Vulnerabilities**  | 0        | = 0     |
| **Code Smells**      | 1        | ≤ 5     |
| **Duplicated Lines** | 1.8%     | ≤ 3.0%  |
| **Reliability**      | A        | A       |
| **Security**         | A        | A       |

A PR that degrades any of these metrics is blocked until fixed.

## Docs

`docs/` is organized by audience and purpose (product, engineering, project tracking, security).

```text
docs/
  engineering/
    dx-ci-overview.md          # CI/DX overview: pipelines, local dev checks, quality tooling
    infrastructure.md          # Infra + hosting notes (Vercel, DB, storage, observability)
    quality-gate.md            # Quality thresholds + Sonar/CI expectations
    technical.md               # Technical architecture: modules, data flow, DB, patterns
  product/
    companion-implementation.md  # Ikoria Companion product/rules (linked from user stories)
    competitive-landscape.md   # Competitor analysis / positioning notes
    project-spec.md            # Product/engineering spec: scope, UX, rules, implementation notes
    roadmap.md                 # Future work backlog: technical + functional roadmap + prioritization
    user-flows.md              # End-to-end user journeys and flows
    user-guide.md              # End-user manual: how to use the app
    us-detail.md               # Full user stories backlog
  project/
    changelog.md               # Release notes / history of changes
    progress.md                # Project checklist / milestones / tracking
  security/
    security.md                # Threat model + security architecture + hardening rules
  prompt-system/               # Prompting system docs (AI behavior, prompts, conventions)
  references/                  # Reference material (patterns, examples)
  rules/                       # Internal rules / conventions docs (e.g. magic-comp-rules-*.txt)
  init-prompt.md               # Seed prompt / bootstrap notes for agent-assisted work
```

## AI Agent Configuration

All shared agent resources are centralized in `.agents/` as the **single source of truth**. Agent-specific directories (`.claude/`, `.codex/`, `.cursor/`) contain only symlinks and local config — they are gitignored.

```text
.agents/                            ← committed, shared across all agents
  skills/                           ← skill definitions
    mtg-commander-analysis/         ← Commander deck analysis
    mtg-learn/                      ← MTG learning guide
    mtg-rules/                      ← Comprehensive rules engine
    typescript-craftsmanship/       ← TS + React + Next.js quality rules
    cursor-rules/                   ← Cursor-specific .mdc rules
  commands/                         ← shared commands (22 workflows)
  rules/                            ← shared coding rules (.mdc)
  docs/                             ← shared documentation
  hooks.json                        ← pre-PR quality gate hook (reference)

.claude/                            ← gitignored except settings.json
  settings.json                     ← pre-PR SonarCloud hook (committed)
  skills → ../.agents/skills        ← symlink
  settings.local.json               ← personal credentials (gitignored)
  mcp.json                          ← MCP tokens (gitignored)

.codex/                             ← entirely gitignored
  skills  → ../.agents/skills       ← symlink
  commands → ../.agents/commands
  rules    → ../.agents/rules
  docs     → ../.agents/docs

.cursor/                            ← entirely gitignored
  skills  → ../.agents/skills       ← symlink
  commands → ../.agents/commands
  rules    → ../.agents/rules
  docs     → ../.agents/docs
```

### Setup agent symlinks after cloning

After `pnpm install`, recreate the agent symlinks. A setup script is provided, or run manually:

**Linux / macOS / WSL:**

```bash
# Skills
cd .claude && ln -sf ../.agents/skills skills && cd ..
cd .codex  && ln -sf ../.agents/skills skills && cd ..
cd .cursor && ln -sf ../.agents/skills skills && cd ..

# Commands, rules, docs (Codex & Cursor only)
cd .codex && ln -sf ../.agents/commands commands && ln -sf ../.agents/rules rules && ln -sf ../.agents/docs docs && cd ..
cd .cursor && ln -sf ../.agents/commands commands && ln -sf ../.agents/rules rules && ln -sf ../.agents/docs docs && cd ..
```

**Windows (CMD, run as Administrator):**

```cmd
mklink /D .claude\skills .agents\skills
mklink /D .codex\skills  .agents\skills
mklink /D .cursor\skills .agents\skills
mklink /D .codex\commands .agents\commands
mklink /D .codex\rules    .agents\rules
mklink /D .codex\docs     .agents\docs
mklink /D .cursor\commands .agents\commands
mklink /D .cursor\rules    .agents\rules
mklink /D .cursor\docs     .agents\docs
```

**Windows (PowerShell, run as Administrator):**

```powershell
'claude','codex','cursor' | ForEach-Object {
  New-Item -ItemType SymbolicLink -Path ".$_\skills" -Target ".agents\skills" -Force
}
'codex','cursor' | ForEach-Object {
  'commands','rules','docs' | ForEach-Object -Begin { $agent = $_ } -Process {
    New-Item -ItemType SymbolicLink -Path ".$agent\$_" -Target ".agents\$_" -Force
  }
}
```

**Windows (Git Bash):**

```bash
# Requires: Windows Developer Mode enabled (Settings > For developers), OR run as Administrator
for dir in .claude .codex .cursor; do
  cd "$dir" && ln -sf ../.agents/skills skills && cd ..
done
for dir in .codex .cursor; do
  cd "$dir" && ln -sf ../.agents/commands commands && ln -sf ../.agents/rules rules && ln -sf ../.agents/docs docs && cd ..
done
```

> **Note Windows**: symlinks require either **Developer Mode** (Settings > For developers > Developer Mode ON) or running the terminal **as Administrator**. Without this, `mklink /D` and `ln -s` will fail with "Permission denied".

Coding standards are defined in `CLAUDE.md` (root) and automatically loaded by Claude Code every session.

## AI Assistants 👾

MagicAIBuilder was conceived, designed, and developed by **Kael**, with three AI assistants playing different roles in the story:

- **Claude (Anthropic – Sonnet 4.6 / Opus 4.6)** — helped bootstrap the project (Next.js + Prisma boilerplate), define the TypeScript/React architecture, and ship the very first features like deck creation and editing.
- **OpenAI Codex / ChatGPT (GPT‑5.4)** — brought in later for heavier work: complex features, deep refactors, proxy/export flows, database migrations, and DevOps plumbing.
- **Cursor “automatic” model (GPT‑5.1)** — the everyday in‑editor helper, used for fast bug‑fix passes, small refactors, and making the codebase feel “alive” while Kael iterates.

### Git commit attribution (optional)

To show [multiple authors on a commit](https://docs.github.com/en/pull-requests/committing-to-your-project-with-git-and-github/creating-a-commit-with-multiple-authors), add a blank line at the end of the message body, then one or more `Co-authored-by:` trailers (GitHub links avatars only when the email matches an account):

| Assistant                  | Example trailer                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Claude (Anthropic)**     | `Co-authored-by: Claude <noreply@anthropic.com>`                                                                    |
| **OpenAI Codex / ChatGPT** | `Co-authored-by: OpenAI Codex <email@example.com>` — use an address tied to your GitHub user if you want it linked. |
| **Cursor (Auto / Agent)**  | `Co-authored-by: Cursor Agent <noreply@cursor.com>`                                                                 |

## License

MIT

## Legal

Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of the Coast LLC. © 1993-2026 Wizards. All Rights Reserved.

MagicAIBuilder is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC. This project operates under Wizards' Fan Site Policy. MAGIC: THE GATHERING® is a trademark of Wizards of the Coast.

Some card prices and other card data are provided by [Scryfall](https://scryfall.com). Scryfall makes no guarantee about its price information.

See [LEGAL.md](LEGAL.md) for full legal notices.
