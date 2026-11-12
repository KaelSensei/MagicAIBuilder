# Architecture

> **Scope.** How MagicAIBuilder is structured: the system and its neighbours, the bounded
> contexts, the layers inside a context, the entry points, and where new code goes. It describes
> the **target** decided on 2026-11-10 and, honestly, the **current state** measured on `dev` at
> `872f08ff` the same day.
>
> **Related.** Decisions and their reasons: [docs/adr/](../adr/README.md). Domain terms:
> [CONTEXT.md](../../CONTEXT.md). Stack, local setup and feature notes:
> [technical.md](technical.md). Comment and documentation rules:
> [code-documentation.md](code-documentation.md). Testing method: [tdd-with-ai.md](tdd-with-ai.md).

## Contents

- [Purpose](#purpose)
- [The system and its neighbours](#the-system-and-its-neighbours)
- [Bounded contexts](#bounded-contexts)
- [Context map](#context-map)
- [Layers and dependency rules](#layers-and-dependency-rules)
- [Entry points](#entry-points)
- [Where does this code go?](#where-does-this-code-go)
- [Current state and target](#current-state-and-target)
- [Migration approach](#migration-approach)
- [How to read the code base today](#how-to-read-the-code-base-today)

## Purpose

MagicAIBuilder helps Magic: The Gathering players build, analyse and playtest Commander decks,
with an AI copilot whose suggestions are checked against the rules before they are shown. It is
one Next.js 15 application (React 19, TypeScript strict) backed by one PostgreSQL database through
Prisma, served in English and French.

The architecture serves three goals:

1. **Find code by business area.** Everything about combos, playtests or the card catalog lives
   in one folder, named in the domain's language.
2. **Keep the rules right and in one place.** Commander rules are written once, as pure functions
   that cite the Comprehensive Rules, and the server is their authority
   ([ADR 0009](../adr/0009-legality-is-a-report-and-the-server-owns-rules.md)).
3. **Change one thing at a time.** A provider change touches one adapter; a rule change touches one
   function; a context can move or be rewritten without touching its neighbours' internals.

The style is a **modular monolith**: one deployable application, split into bounded contexts with
explicit public APIs ([ADR 0001](../adr/0001-modular-monolith-by-bounded-context.md)).

## The system and its neighbours

C4 container view. Arrows show who calls whom.

```mermaid
flowchart TB
  player([Player, guest or signed in])
  apiClient([API client with a personal API key])

  subgraph mab [MagicAIBuilder]
    browser["Browser app<br/>React 19 client components, Zustand, TanStack Query"]
    middleware["Edge middleware<br/>locale routing and session gate, pages only"]
    server["Next.js 15 server on Node.js<br/>Server Components and 67 route handlers"]
    db[("PostgreSQL 16<br/>Prisma, 30 models")]
  end

  scryfall[(Scryfall)]
  spellbook[(Commander Spellbook)]
  llm[(Anthropic and OpenAI)]
  meta[(EDHREC and MTGTop8)]
  sites[(Deck sites)]
  google[(Google OAuth)]
  sentry[(Sentry)]

  player --> browser
  apiClient -->|HTTPS /api/v1| server
  browser -->|page requests| middleware
  middleware --> server
  browser -->|fetch /api/*| server
  browser -->|card images, lookup fallback, set list| scryfall
  server -->|Prisma Client| db
  server -->|card cache fill| scryfall
  server -->|combo lookup| spellbook
  server -->|suggest and build| llm
  server -->|meta data| meta
  server -->|URL import| sites
  server -->|sign-in| google
  browser -->|errors| sentry
  server -->|errors| sentry
```

| Container           | Technology                                                           | Responsibility                                                                                                                                                                          | Where                                                                                |
| ------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Browser app         | React 19 client components, Zustand 5, TanStack Query 5, dnd-kit     | The builder, analysis panels, playtest, collection and community screens. Holds view state and optimistic copies of decks.                                                              | 228 `"use client"` modules under `src/components`, `src/lib/*/store.ts`, `src/hooks` |
| Edge middleware     | next-intl, Auth.js Edge configuration                                | Locale prefix (`en` unprefixed, `fr` under `/fr`) and the sign-in redirect for protected pages. Its matcher excludes `/api`.                                                            | `src/middleware.ts`, `src/lib/auth/edge-config.ts`, `src/lib/auth/public-paths.ts`   |
| Next.js server      | Next.js 15 App Router on Node.js, Auth.js 5 (Google and credentials) | Server Components, 67 route handlers including the public `/api/v1` API, the shared Scryfall cache, provider calls.                                                                     | `src/app/**`                                                                         |
| Database            | PostgreSQL 16, Prisma 6                                              | Decks, collections, community data, sessions, caches. Docker locally; hosted in production (see [infrastructure.md](infrastructure.md)).                                                | `prisma/schema.prisma`                                                               |
| Scryfall            | HTTPS JSON API                                                       | Card data, search, printings, rulings, images. The server fills a shared cache (cards 24 h, searches 1 h); the browser reads through it and calls Scryfall directly only as a fallback. | `src/lib/scryfall/`                                                                  |
| Commander Spellbook | HTTPS JSON API                                                       | Combos contained in a decklist, used for the combo panel and the bracket estimate.                                                                                                      | `src/lib/combos/`, `src/app/api/combos/route.ts`                                     |
| Anthropic, OpenAI   | HTTPS JSON APIs                                                      | The AI copilot: suggestions and deck builds, Anthropic first, then OpenAI, then a mock.                                                                                                 | `src/app/api/ai/**`, `src/lib/ai/`                                                   |
| EDHREC, MTGTop8     | JSON and HTML scraping                                               | What the wider meta plays for a commander, and how it shifts.                                                                                                                           | `src/lib/meta/`, `src/app/api/meta/**`                                               |
| Deck sites          | JSON or HTML per site                                                | URL import from Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, AetherHub and EDHREC.                                                                                                | `src/lib/import/`, `src/app/api/import/**`                                           |
| Google OAuth        | OAuth 2.0 through Auth.js                                            | Sign-in. Email and password sign-in is local.                                                                                                                                           | `src/lib/auth/config.ts`                                                             |
| Sentry              | `@sentry/nextjs`                                                     | Error tracking, browser and server.                                                                                                                                                     | `src/instrumentation*.ts`, `sentry.*.config.ts`                                      |

## Bounded contexts

A bounded context is a part of the product inside which every term has one meaning. "Card", for
example, means a printing in the card catalog, a row with a quantity and a zone in deck building,
an owned copy in the collection, and a game object in the playtest. The glossary of each context
is in [CONTEXT.md](../../CONTEXT.md).

| Kind       | Context          | Folder             | Covers                                                                                                                                                                                                                                                             | Tables owned                                                                                                                                 |
| ---------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Core       | Format rules     | `format-rules`     | Commander rules shared by the server and the browser: colour identity, copy limits and basic lands, commander eligibility and pairing (partner variants, Background, Doctor's companion, Friends forever), companion, banlist, Game Changers, bracket definitions. | none                                                                                                                                         |
| Core       | Deck building    | `deck-building`    | Decks, cards in decks, zones, categories, snapshots and versions, folders, sharing, forks, guest decks, the editor, the builder and the wizard's deck creation.                                                                                                    | `Deck`, `DeckCard`, `DeckFolder`, `DeckSnapshot`, `DeckTemplate`                                                                             |
| Core       | Deck analysis    | `deck-analysis`    | Read-only evaluation of a decklist: stats, mana curve, mana alignment, turn-one odds, bracket estimate, themes, commander rules check, price, comparison.                                                                                                          | none                                                                                                                                         |
| Core       | Playtest         | `playtest`         | Game simulation in the browser, the London mulligan and the free multiplayer mulligan, keep advice, recorded sessions.                                                                                                                                             | `PlaytestSession`                                                                                                                            |
| Core       | AI copilot       | `ai-copilot`       | Suggest and build use cases, prompts, the model port, validation of model output before display.                                                                                                                                                                   | none yet                                                                                                                                     |
| Supporting | Card catalog     | `card-catalog`     | The Scryfall anti-corruption layer: the `CatalogCard` type, search, printings, images, localised card text, rulings, the shared cache.                                                                                                                             | `CardCache`, `ScryfallSearchCache`                                                                                                           |
| Supporting | Combos           | `combos`           | The Commander Spellbook adapter. The **pilot** context of the migration.                                                                                                                                                                                           | none (in-memory cache)                                                                                                                       |
| Supporting | Meta insights    | `meta-insights`    | EDHREC and MTGTop8 adapters, meta snapshots and their history.                                                                                                                                                                                                     | `MetaCache`, `MetaSnapshot`                                                                                                                  |
| Supporting | Deck interchange | `deck-interchange` | Import and export: one adapter per site, the decklist text parsers, export formats, proxy sheets.                                                                                                                                                                  | none                                                                                                                                         |
| Supporting | Collection       | `collection`       | Owned cards and quantities, acquisition intents, acquisition plans, shopping lists.                                                                                                                                                                                | `CollectionCard`, `AcquisitionIntent`; `CardFavorite`, `FavoriteList`, `CardInFavoriteList` (never queried)                                  |
| Supporting | Community        | `community`        | Public decks, discovery, profiles, follows, votes, ratings and reviews, comments, saved decks, card packages, reports and moderation.                                                                                                                              | `DeckVote`, `DeckRating`, `DeckComment`, `DeckReport`, `SavedPublicDeck`, `PublicDeckFolder`, `CardPackage`, `CardPackageCard`, `UserFollow` |
| Generic    | Identity         | `identity`         | Accounts, sessions, onboarding, settings, API keys and scopes, the moderator role.                                                                                                                                                                                 | `User`, `Account`, `Session`, `VerificationToken`, `ApiKey`, `NotificationPreference`                                                        |
| Generic    | Rules reference  | `rules-reference`  | The Comprehensive Rules pages, the Game Changers and banlist pages.                                                                                                                                                                                                | none (file data)                                                                                                                             |
| Generic    | Site             | `site`             | SEO, sitemap, robots, Open Graph images, the landing page.                                                                                                                                                                                                         | none                                                                                                                                         |

**Core** contexts are where the product differs from its competitors; they get the most modelling
effort and tactical DDD. **Supporting** contexts are needed but not differentiating; plain use
cases are enough. **Generic** contexts solve problems every web app has.

**The shared kernel** is not a context. It holds code with no business meaning that every context
uses: UI primitives and the app shell (`src/components/ui/*`, `src/components/layout/*`), the
logger (`src/lib/logger.ts`), internationalisation (`src/i18n/*`), the Prisma client
(`src/lib/db/prisma.ts`) and authentication helpers (`src/lib/auth/*`). It stays where it is for
now, because moving it would rewrite 25 to 79 importers per file for no gain
([ADR 0001](../adr/0001-modular-monolith-by-bounded-context.md)). New shared code goes next to it.

## Context map

Arrows run from **upstream** (the supplier) to **downstream** (the consumer). Labels name the
relationship or the published type. **ACL** is an anti-corruption layer
([ADR 0004](../adr/0004-anti-corruption-layers-for-external-providers.md)).

```mermaid
flowchart LR
  scryfall[(Scryfall)]
  spellbook[(Commander Spellbook)]
  metaSites[(EDHREC and MTGTop8)]
  deckSites[(Deck sites)]
  llm[(Anthropic and OpenAI)]
  authjs[(Auth.js and Google)]

  CC[card-catalog]
  FR[format-rules]
  CB[combos]
  MI[meta-insights]
  DI[deck-interchange]
  DB[deck-building]
  DA[deck-analysis]
  PT[playtest]
  AI[ai-copilot]
  CO[collection]
  CM[community]
  ID[identity]
  RR[rules-reference]
  ST[site]

  scryfall -->|ACL| CC
  spellbook -->|ACL| CB
  metaSites -->|ACL| MI
  deckSites -->|ACL per site| DI
  llm -->|ACL| AI
  authjs -->|conformist| ID

  CC -->|CatalogCard| FR
  CC -->|CatalogCard| DB
  CC --> DI
  CC --> CO
  FR -->|rules| DB
  FR -->|rules| DA
  FR -->|rules| AI
  FR -->|rules| CM
  FR --> RR
  CB -->|Combo| DA
  DI -->|imported decklist| DB
  DB -->|decklist| DA
  DB -->|decklist| PT
  DB -->|decklist| AI
  DB -->|published deck| CM
  DB -->|decklists| CO
  DA -->|deck report| AI
  PT -->|playtest summary| AI
  MI -->|meta evidence| AI
  MI -->|commander slugs| ST
  CM -->|public decks| ST
  ID -->|current user| DB
  ID -->|current user| CO
  ID -->|current user| CM
  ID -->|current user| PT
  ID -->|current user| AI
```

How to read it:

- **Format rules is the most upstream core context.** Every context that judges a deck uses its
  pure functions, so a rule is written once and gives the same answer on the server and in the
  browser. On the server, legality is reported and never refuses a write. The browser keeps its
  current checks as player feedback (the copy clamp, the companion check and the "already in the
  deck" check); a refactor never changes them, and changing them is an owner decision
  ([ADR 0009](../adr/0009-legality-is-a-report-and-the-server-owns-rules.md)).
- **Deck building owns the deck.** Other contexts read decklists, and change a deck only by
  calling a deck-building use case. Today two routes write deck tables from other contexts
  (`src/app/api/community/card-packages/[packageId]/apply/route.ts` and
  `src/app/api/decks/[id]/playtest-sessions/route.ts`); both move behind deck-building use cases.
- **The AI copilot is the most downstream context.** It reads the decklist, the analysis report,
  the playtest summary and the meta evidence, and its output is validated with format rules before
  it is shown.
- **Providers stop at their adapter.** Their types never cross the ACL.

**Where the code contradicts the map today.** The architecture audit measured these inversions;
each is removed by a phase 1 slice or by its context's move series.

| Inversion                              | Evidence                                                                                                                                                        | Fix                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Card catalog imports deck building     | Deck-aware widgets in `src/components/card/` and `src/components/search/`, and `src/lib/scryfall/search.ts:2-9` importing deck types, formats and pairing rules | Deck-aware widgets move to deck building; the types and formats search needs move upstream |
| Playtest and AI depend on each other   | `src/lib/playtest/ai-context.ts` imports the AI schema while the AI route imports `ai-context`                                                                  | `ai-context.ts` moves to the AI copilot                                                    |
| The app shell depends on deck building | `src/components/layout/Header.tsx:7,13` imports the import dialog and the deck store                                                                            | The header takes its actions as a slot                                                     |
| Deck store calls the collection store  | `src/lib/deck/store.ts:12`                                                                                                                                      | Composed in the UI instead                                                                 |

## Layers and dependency rules

Inside a context, code is split by what it depends on. A layer folder exists only when the context
needs it ([ADR 0001](../adr/0001-modular-monolith-by-bounded-context.md)).

```mermaid
flowchart TB
  app["src/app/** routing and thin adapters"]
  ui[ui]
  client[client]
  application[application]
  infrastructure[infrastructure]
  domain[domain]

  app --> ui
  app --> application
  ui --> client
  ui --> domain
  client --> domain
  application --> domain
  infrastructure --> application
  infrastructure --> domain
```

An arrow means "may import". `infrastructure` implements the ports that `application` declares,
so the dependency points inward.

| Layer             | Holds                                                                                                                                 | May import                                                                                                                 | Must not import                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly types and pure functions: rules, value types, ports when the domain owns them                                                | Its own `domain/`; other contexts' `index.ts`; pure shared helpers                                                         | React, Next.js, Prisma, Zustand, TanStack Query, `fetch`, `process.env`, `window`; any other layer |
| `application/`    | Use cases (`makeX(deps) → x(input)`), port interfaces, input contracts                                                                | Its own `domain/` and ports; other contexts' `index.ts` and `server.ts`; the server shared kernel (logger)                 | React, Next.js routing, Prisma directly, `client/`, `ui/`                                          |
| `infrastructure/` | Prisma repositories, provider adapters with their wire types and mappers, recorded fixtures. Server-only, except a browser API client | Its own `domain/` and `application/` ports; `src/lib/db/prisma.ts`, `src/lib/http.ts`, the logger                          | `ui/`, `client/`, other contexts' internals                                                        |
| `client/`         | The typed browser API client, Zustand stores, TanStack Query hooks                                                                    | Its own `domain/`; other contexts' `index.ts` and `client.ts`; browser-safe shared helpers                                 | `server.ts`, `application/`, `infrastructure/`, Prisma                                             |
| `ui/`             | React components: containers compose presentational components; logic lives in hooks or the domain                                    | Its own `client/` and `domain/`; other contexts' `index.ts`, `client.ts` and `ui/*` paths; `src/components/ui`, `src/i18n` | `server.ts`, `application/`, `infrastructure/`, Prisma                                             |
| `src/app/**`      | Pages, layouts, route handlers, metadata, sitemap, robots                                                                             | Any context's `server.ts`, `index.ts`, `client.ts` and `ui/*`; the shared kernel                                           | Another context's `domain/`, `application/`, `infrastructure/` or `client/` internals              |
| Shared kernel     | UI primitives, app shell, logger, i18n, Prisma client, auth helpers                                                                   | Other shared kernel files                                                                                                  | Anything under `src/modules/` or `src/app/`                                                        |

**A route handler or page** does three things: parse its input with Zod, call one use case, map the
result to a response. It keeps no business rule and calls no Prisma model directly. Route handlers
stay route handlers; they are not converted to Server Actions.

**Domain modelling** follows [ADR 0003](../adr/0003-domain-as-readonly-data-and-pure-functions.md):
readonly data and pure functions, discriminated unions, branded IDs where IDs can be mixed up,
parse once at the boundary, plain factories instead of a DI container.

## Entry points

Each context exposes up to three files
([ADR 0002](../adr/0002-module-entry-points-index-server-client.md)):

| File        | Contains                                                                      | Safe in                                         |
| ----------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `index.ts`  | Pure domain types and functions                                               | Server, browser, Edge middleware                |
| `server.ts` | `import "server-only"`, then the use cases wired to their production adapters | Server only (route handlers, Server Components) |
| `client.ts` | Client-safe hooks, stores and the typed API client                            | Browser and Client Components                   |

UI components are imported by path (`@/modules/<context>/ui/<Component>`), never through a barrel.
Entry files use explicit named re-exports, not `export *`. Other contexts import only these entry
points or a `ui/` component path.

The shape of a context, for orientation (the folder names are fixed; the files are examples):

```text
src/modules/combos/
  README.md            purpose, public API, data flow, invariants, diagram
  domain/              deck-query.ts: canonical combo query; combo.ts: the Combo type
  application/         find-deck-combos.ts: the use case; ports.ts
  infrastructure/      spellbook-client.ts: the ACL; fixtures/find-my-combos-v1.ts
  client/              api.ts: browser call to /api/combos; use-combos.ts
  ui/                  CombosPanel.tsx
  index.ts             export type { Combo } …
  server.ts            import "server-only"; export const findDeckCombos = …
  client.ts            export { useCombos } …
```

## Where does this code go?

Answer the questions in order; the first "yes" decides.

|   # | Question                                                                                                                                                         | Then it goes in                                                        |
| --: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
|   1 | Is it a Next.js routing file: a page, layout, route handler, `loading`, `error`, metadata, sitemap or robots?                                                    | `src/app/**`, kept thin: parse, call one use case, map                 |
|   2 | Is it a Commander or format rule that the server and the browser both need (colour identity, copy limits, pairing, companion, banlist, Game Changers, brackets)? | `format-rules/domain/`, with its Comprehensive Rules citation          |
|   3 | Is it a pure rule, calculation or type of one business area, with no IO and no React?                                                                            | `<context>/domain/`                                                    |
|   4 | Does it carry out a business action on the server: load, decide, save?                                                                                           | `<context>/application/`, as a use case taking its ports as parameters |
|   5 | Does it talk to Prisma, a provider, the file system or a secret?                                                                                                 | `<context>/infrastructure/`, behind a port, server-only                |
|   6 | Does it hold browser state, call the app's API from the browser, or wrap TanStack Query?                                                                         | `<context>/client/`                                                    |
|   7 | Is it JSX?                                                                                                                                                       | `<context>/ui/`: a container composes small presentational components  |
|   8 | Is it generic, used by several contexts, with no business meaning (a button, `cn`, the logger, i18n)?                                                            | The shared kernel, next to the existing kernel files                   |

**Which context?** The one whose glossary in [CONTEXT.md](../../CONTEXT.md) defines the main noun
of the code. If two contexts are involved, the code belongs to the one that owns the data it
changes, and the other calls its use case.

**Until a context has moved,** put new code in the folder that holds its siblings today (see
[How to read the code base today](#how-to-read-the-code-base-today)), shaped as the target layer
would be: a pure rule in its own file with no IO, logic out of route handlers and into a function
the route calls, no new `vi.mock` of an internal module. Do not create `src/modules/<context>/` by
hand; a context moves in its own series, by codemod.

## Current state and target

Measured on `dev` at `872f08ff` (2026-11-10). Counts cover non-test `.ts` and `.tsx` files under
`src/` unless stated.

| Aspect                 | Target                                                 | Today                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organisation           | 14 contexts under `src/modules/`                       | `src/modules/` does not exist. 517 production files (67,140 lines): `src/components` 190, `src/lib` 185, `src/app` 106 (67 route handlers), `src/hooks` 29, `src/i18n` 4, root 3                                                                                                                                                      |
| Mixed folders          | One context per folder                                 | `src/lib/deck/` holds 59 files across about five contexts; `src/components/deck/` holds 74 across about nine                                                                                                                                                                                                                          |
| Route handlers         | Parse, call one use case, map                          | 53 of 67 import Prisma, with 155 inline Prisma calls (138 `prisma.<model>.<op>`, 6 `prisma.$…`, 11 inside transactions). The largest is `src/app/api/ai/suggest/route.ts` with 654 lines                                                                                                                                              |
| Application layer      | Use cases behind ports                                 | No port, repository or use case exists                                                                                                                                                                                                                                                                                                |
| Pages                  | Server Components composing contexts                   | The builder page is a 1,192-line `"use client"` page. Two server files query Prisma directly (`src/app/sitemap.ts`, `src/app/[locale]/moderation/reports/page.tsx`). Three server pages fetch the app's own API over HTTP (`u/[username]`, `commanders/[slug]/decks`, and the public deck page through `src/lib/deck/public-deck.ts`) |
| Client state           | Stores hold view state; rules come from `format-rules` | `src/lib/deck/store.ts` is 2,550 lines of `"use client"` code mixing state, HTTP, Scryfall calls, rules and toasts                                                                                                                                                                                                                    |
| Server/client boundary | `server-only` checked at build time                    | No `server-only` import. 228 `"use client"` modules. No client module reaches Prisma today, by convention only                                                                                                                                                                                                                        |
| Anti-corruption layers | Wire types stay in `infrastructure/`                   | `ScryfallCard` is referenced by 36 other production files (30 outside `src/lib/scryfall/`); Anthropic and OpenAI are called with raw `fetch` in two routes; one 481-line file adapts seven deck sites                                                                                                                                 |
| Dependency direction   | No cycles, no inward-to-outward imports                | 0 runtime cycles, 3 type-only cycles; 11 layer violations (5 `lib → app`, 3 `lib → hooks`, 3 component or hook `→ app`). All 14 start in the dependency-cruiser baseline ([ADR 0007](../adr/0007-architecture-enforcement-in-stages.md))                                                                                              |
| Tests                  | Fakes, contract tests, typed mocks                     | 406 colocated test files; 274 path-bound `vi.mock`/`vi.doMock` calls in 138 files (62 mock `@/lib/db/prisma`); 0 typed `vi.mock(import(…))`; 60 files stub `fetch`; 0 MSW; 2 in-memory fakes                                                                                                                                          |
| Comments               | Header, contract TSDoc, cited rules                    | The architecture audit found JSDoc on 60.6 % of exports; 13 production files cite a Comprehensive Rules number                                                                                                                                                                                                                        |
| Enforcement            | Staged tools                                           | `next lint` with the Next.js presets only; no dependency-cruiser, no size limits; 32 modules over 300 lines                                                                                                                                                                                                                           |

**How the numbers were measured.** Each figure is reproducible with `find`, `wc -l` and `grep` on
the commit above, for example:

```bash
# Route handlers that import Prisma
grep -lE "@/lib/db/prisma|@prisma/client" $(find src/app/api -name 'route.ts*') | wc -l
# Path-bound mocks of the project's own modules
grep -rhoE "vi\.(mock|doMock)\(['\"](\.|@/)[^'\"]*['\"]" src e2e | wc -l
```

Figures attributed to "the architecture audit" come from an import-graph analysis of the same
commit made for the clean-code programme.

## Migration approach

The migration is incremental: the tree stays shippable after every pull request, and the work can
stop after any context without leaving a half-moved tree.

| Phase | Content                                                                                                                                                                                                                                                                          | Decisions                                                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Documentation (this document, the ADRs, the glossary), agent rules, tooling (ESLint flat config, `server-only`, dependency-cruiser with a baseline of the 11 layer violations and the 3 type-only cycles, the move codemod)                                                      | [0001](../adr/0001-modular-monolith-by-bounded-context.md)–[0009](../adr/0009-legality-is-a-report-and-the-server-owns-rules.md) |
| B     | Behaviour fixes already in flight, each a `fix/` pull request with a Red test                                                                                                                                                                                                    | [0009](../adr/0009-legality-is-a-report-and-the-server-owns-rules.md)                                                            |
| 1     | Decouple in place, without moving folders: fix the inversions above, move shared types out of `src/app`, rename the browser HTTP clients out of `src/lib/db/`; write characterization tests for the store, the builder page, `DeckWizard`, the playtest engine and the AI routes | [0005](../adr/0005-testing-strategy-fakes-contracts-and-characterization.md)                                                     |
| 2     | Pilot context: `combos` (6 external importers, an adapter and a contract fixture already, a route that holds logic). It proves the template, the codemod, the entry points and gate staging                                                                                      | [0002](../adr/0002-module-entry-points-index-server-client.md), [0007](../adr/0007-architecture-enforcement-in-stages.md)        |
| 3+    | The other contexts in increasing order of risk; `deck-building` last                                                                                                                                                                                                             | [0004](../adr/0004-anti-corruption-layers-for-external-providers.md)                                                             |

The architecture audit proposes this order after the pilot: rules-reference, meta-insights,
playtest, collection and deck-interchange; then card-catalog with its `CatalogCard` type; then
identity, community, ai-copilot and deck-analysis; deck-building last, because it is the largest,
the most changed and touched by every pending branch. Format rules was named as a context after
that audit; its modules come out of `src/lib/deck/` and change their input type to `CatalogCard`,
so it fits best right after card-catalog. Confirm its slot when phase 4 is planned.

Rules for every series:

- **One context per series of small pull requests.** Pure moves and logic changes are separate
  pull requests. A behaviour change found during a refactor gets its own `fix/` pull request with
  a Red test; it is never hidden in a move.
- **Moves are made by a committed, idempotent codemod** driven by a move map (see
  [Running a move](#running-a-move) below). It rewrites static imports, `import()` expressions,
  `vi.mock` paths and `require` calls. Files move byte-identical, so git's rename detection carries
  concurrent edits across.
- **Temporary re-export shims** are allowed only within a series and are removed at its end, with
  one known exception: a shim cannot be removed while the on-hold AI metering branch
  (`feat/ai-usage-metering-and-monthly-quota`) still imports the old path. The move codemod also
  rewrites the import lines of that branch's files: rebase the branch and run the codemod on it.
  This small, known conflict is accepted.
- **Pending branches.** A file that a pending branch edits is not touched until that branch merges.
- **Dead code.** Only code with no importer and no product intent is deleted. Orphaned features
  (tested store actions with no reachable UI, favourites, the "Collection only" toggle) are listed
  for the owner, not deleted.
- **Each series ends** with the context's `README.md`, its `docs/functional/<context>.md`, its
  comments brought to the standard, and its dependency-cruiser rules at `error`.

### Running a move

A move pull request appends its entries to `scripts/refactor/moves.json` and runs
`pnpm refactor:apply-moves` (first with `--dry-run`). The codemod moves each file with `git mv`,
rewrites every module specifier that names it in `src/`, `e2e/` and `scripts/` (imports, `import()`
and `typeof import()`, `require`, and the path of every `vi.mock`-family call), keeps `@/`
specifiers as `@/`, keeps the dependency-cruiser baseline and the ESLint suppressions in step with
the moved paths, and refuses to write anything if a specifier would resolve to no file. It leaves the
rewrites unstaged, so the pure renames are committed first and the rewrites second. The map only
grows, and a second run changes nothing, so a branch that predates a move is rebased and then runs
the same command. It also rewrites the paths that root configs write by hand (`vitest.config.ts`,
`next.config.ts`, `sonar-project.properties`, the dependency-cruiser patterns), and reports what it
does not change: a moved file that leaves or joins a coverage or test list, and the old paths still
named in docs and configs, which are fixed by hand. An entry marked `"shim": true` keeps a temporary
re-export shim at its old path; the codemod lists it in `eslint.config.mjs`, where the
`migration-guard/no-shim-import` rule fails any import or `vi.mock` of that path. Details and limits:
[scripts/refactor/README.md](../../scripts/refactor/README.md).

## How to read the code base today

Until a context has moved, its code is spread over the current folders. This map tells you where
to look. It is a reading guide, not the move map: the file-level assignment is decided in each
context's series.

| Today                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Target context                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/modules/combos/` (moved; see its README), `src/app/api/combos/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | combos                                                                                         |
| `src/lib/deck/{formats,game-constants,color-identity,multiples,pairing,commander-eligibility,companion,legality,check-deck-legality,validation}.ts`, `src/lib/constants/brackets.ts`, `src/lib/mana/`                                                                                                                                                                                                                                                                                                                                                                 | format-rules                                                                                   |
| `src/lib/deck/{stats,analysis-types,bracket,mana-alignment,turn-one,themes,format-stats,commander-rules-check,comparison,weakest-card,warning-groups,pricing,card-role-explanation}.ts`, `src/hooks/{useBracketScore,useDeckPrice}.ts`, the analysis panels in `src/components/deck/` (`DeckStats`, `ManaCurve`, `BracketIndicator`, …)                                                                                                                                                                                                                               | deck-analysis                                                                                  |
| The rest of `src/lib/deck/` (`types`, `store`, `store-factories`, `deck-version`, `snapshot-restore`, `fork`, `guest-deck`, `guest-claim`, `bulk-edit*`, `command-zone-rows`, `categories`, …), `src/lib/db/{deck-api,snapshot-api}.ts` (browser HTTP clients despite the folder name), `src/lib/validation/{deck,card}.ts`, `src/hooks/{useGuestDeckClaim}.ts`, `src/components/builder/`, most of `src/components/deck/`, the deck-aware widgets in `src/components/card/`, `src/app/[locale]/{builder,decks}/`, `src/app/api/{decks,deck,deck-folders,templates}/` | deck-building                                                                                  |
| `src/lib/playtest/*` except `ai-context.ts`, `src/hooks/usePlaytestHistory.ts`, `src/components/playtest/`, `src/app/api/decks/[id]/playtest-sessions/`                                                                                                                                                                                                                                                                                                                                                                                                               | playtest                                                                                       |
| `src/lib/ai/`, `src/lib/validation/ai.ts`, `src/lib/playtest/ai-context.ts`, `src/hooks/{useAISuggestions,useAIDeckBuild}.ts`, the AI panels and `DeckWizard.tsx` in `src/components/deck/`, `src/app/api/ai/`                                                                                                                                                                                                                                                                                                                                                        | ai-copilot                                                                                     |
| `src/lib/scryfall/`, `src/lib/cache-limits.ts`, `src/lib/deck/{batch-fetch,store-card-faces}.ts`, `src/hooks/{useCardSearch,useCardPrintings,useBanlist,useGameChangers,useLocalizedCardText,useLocalizedDeckIndex}.ts`, the catalog widgets in `src/components/card/`, `src/components/search/`, `src/app/api/{cache,proxy-card-image}/`                                                                                                                                                                                                                             | card-catalog                                                                                   |
| `src/lib/meta/`, `src/hooks/{useMetaAnalysis,useMetaShifts}.ts`, the meta panels in `src/components/deck/`, `src/app/api/meta/`                                                                                                                                                                                                                                                                                                                                                                                                                                       | meta-insights                                                                                  |
| `src/lib/import/`, `src/lib/deck/{import,export,proxy,proxy-print-html}.ts`, `src/lib/deck/fixtures/`, the import and export dialogs in `src/components/deck/`, `src/app/api/import/`                                                                                                                                                                                                                                                                                                                                                                                 | deck-interchange                                                                               |
| `src/lib/collection/`, `src/hooks/useAcquisitionIntent.ts`, `src/components/collection/`, `src/app/[locale]/collection/`, `src/app/api/collection/`                                                                                                                                                                                                                                                                                                                                                                                                                   | collection                                                                                     |
| `src/lib/{community,ratings,social}/`, `src/components/{community,profile,moderation}/`, the card-package panels in `src/components/deck/`, `src/app/[locale]/{u,commanders,deck,share,saved-decks,moderation}/`, `src/app/api/{community,users,moderation,share}/`                                                                                                                                                                                                                                                                                                   | community                                                                                      |
| `src/lib/api/{authenticate,keys,scopes,viewer-request,openapi}.ts`, `src/hooks/{useApiKeys,useOnboarding}.ts`, `src/components/{auth,settings,onboarding}/`, `src/app/[locale]/{auth,settings}/`, `src/app/api/{auth,user,v1}/`                                                                                                                                                                                                                                                                                                                                       | identity                                                                                       |
| `src/lib/rules/`, `src/components/rules/`, `src/app/[locale]/rules/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | rules-reference                                                                                |
| `src/lib/seo/`, `src/components/landing/`, `src/app/{sitemap,robots}.ts`, `src/app/api/og/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | site                                                                                           |
| `src/components/{ui,layout}/`, `src/lib/logger.ts`, `src/i18n/`, `src/lib/db/prisma.ts`, `src/lib/auth/`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | shared kernel (stays)                                                                          |
| `src/lib/{http,rate-limit,crypto-random,security-headers,guards,download-text-file}.ts`, `src/lib/async/`, `src/lib/api/{json-body,idempotency-key}.ts`, `src/lib/db/{create-once,json-payload,prisma-errors}.ts`, `src/lib/{theme,ui}/`, `src/hooks/{useToast,useTheme,useKeyboardShortcuts,useCopyToClipboard,useBoundedSession,useResizePanel}.ts`, `src/components/providers/`                                                                                                                                                                                    | generic helpers and app shell: shared kernel candidates, decided in phase 1 and the last phase |

Folders that stay where Next.js or the tooling expects them: `src/app/` (routing),
`src/middleware.ts`, `src/instrumentation*.ts`, `src/i18n/` (loaded by `next.config.ts`),
`src/messages/` (locale catalogs), `src/styles/`, `src/test/` (shared test helpers and fakes).

Modules with no production importer (for example `src/lib/versioning/branching.ts`,
`src/lib/recommendations/engine.ts`, `src/lib/shortcuts/shortcuts.ts`) are listed for an owner
decision rather than mapped.
