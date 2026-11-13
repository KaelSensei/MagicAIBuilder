# Meta insights

> **Kind:** supporting. **Glossary:** [CONTEXT.md, Meta insights](../../../CONTEXT.md#meta-insights).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md) (modular monolith),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md) (entry points),
> [ADR 0003](../../../docs/adr/0003-domain-as-readonly-data-and-pure-functions.md) (readonly domain),
> [ADR 0004](../../../docs/adr/0004-anti-corruption-layers-for-external-providers.md) (one adapter per provider).
> **Status:** series open (MI-01 and MI-02 pinned the providers; MI-03 moved the files; MI-04 extracted
> the use case; MI-05 split the panel; MI-06 split the analysis hook; MI-07 closes the series).
> The functional doc and the full README come with the closing slice.

What the wider meta plays for a commander: the cards EDHREC reports as popular, with their inclusion
rates; the recent tournament decks MTGTop8 lists for the commander; and, from one EDHREC snapshot a
day retained for a year, what moved between two dates. The builder page shows all three in the meta
panel and the trends view; the AI suggestions panel borrows the provenance badge and the freshness
line to label its own recommendations.

Not owned here: the commander slug (`lib/meta/commander-slug.ts`, community context, COM-02), the
HTTP concerns of the meta route (`app/api/meta/[commanderSlug]/route.ts`: rate limit, validation, who
may force a refresh, the `_meta` envelope), and the AI suggestions panel that renders two of the
badges (ai-copilot context).

## Layers

| Folder            | Holds                                  | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions       | `types.ts`: `MetaCard`, `TournamentDeck`, `EdhrecData`, `TournamentData`, `MetaSource` (`"edhrec" \| "tournament"`), `CommanderMetaData`. `evidence-label.ts`: `MetaEvidenceKind`, the kinds of evidence behind a recommendation. `history.ts`: `computeMetaShifts`, `buildMetaTrendView` and the bounded-shift arithmetic over truncated top-20 lists.                                                                                                                                                                                                                                                                                                                                                                                |
| `application/`    | The use case and its ports             | `get-commander-meta.ts`: `makeGetCommanderMeta`, the read-through (a fresh `MetaCache` entry, else the provider, else the stale entry) answering a `CommanderMetaResult` of kind `fresh-cache`, `live`, `stale-cache` or `unavailable`. `ports.ts`: `MetaCacheRepository` (read and write one answer per commander and source; never throws), `MetaProvider` (EDHREC and MTGTop8 by slug), `MetaHistory` (the EDHREC snapshot), `Clock`.                                                                                                                                                                                                                                                                                               |
| `infrastructure/` | Provider adapters and the Prisma store | `fetch.ts`: `fetchEdhrecData` (EDHREC JSON) and `fetchTournamentData` (MTGTop8 search, archetype first, card search as the fallback). `meta-provider.ts`: the fetchers as `MetaProvider`, MTGTop8 addressed by the name folded from the slug. `mtgtop8.ts`: the MTGTop8 HTML parser and the archetype matching, no I/O. `meta-cache-repository.ts` (`server-only`): `prismaMetaCacheRepository` over `MetaCache`, a day of freshness, the stored `Json` parsed with Zod on read. `snapshots.ts` (`server-only`): `recordEdhrecSnapshot`, `readSnapshotHistory` and the window and retention constants over `MetaSnapshot`. `fixtures/`: the recorded EDHREC and MTGTop8 pages (MI-02).                                                 |
| `testing/`        | Fakes and contract suites (ADR 0005)   | `in-memory-meta-cache-repository.ts`: the `MetaCacheRepository` fake, with seeding and an outage switch. `meta-cache-repository-contract.ts`: the suite both the fake and the Prisma adapter pass; the adapter runs it over `src/test/meta-cache-db-fake.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `client/`         | Browser hooks and their pure state     | `useMetaAnalysis.ts`: the request to `GET /api/meta/:slug`, one call per source, with its timeout and latest-wins guard. `meta-source-state.ts`: `MetaState` and each source's begin, finish and fail transitions. `meta-api-response.ts`: the response type and the rules reading a failure from a body and a status. `useMetaShifts.ts`: `GET /api/meta/:slug/history` as a report or `null`.                                                                                                                                                                                                                                                                                                                                        |
| `ui/`             | React components                       | `MetaPanel.tsx`: the meta panel of the builder page, composing `MetaPanelHeader.tsx`, `CommanderMetaLinks.tsx` and the three sections `EdhrecCardsSection.tsx` (rows: `EdhrecCardRow.tsx`), `MetaShiftsSection.tsx` (rows: `MetaShiftRow.tsx`) and `TournamentDecksSection.tsx` (rows: `TournamentDeckRow.tsx`); `MetaSourceStatus.tsx` and `SkeletonRows.tsx` are the loading, error and empty states two sections share. `MetaTrendsView.tsx`: the shifts over the window. `MetaSourceDisclosure.tsx`: which source a result comes from, with its freshness. `RecommendationProvenance.tsx`: the evidence-kind badge. `ExternalRecommendationFreshness.tsx`: source, observation time and sample size of an external recommendation. |

The fetchers are tested against the recorded fixtures through MSW, the parser on fixture text, the
use case on the in-memory fakes, the panel and its hook through a stubbed `fetch`
(`ui/MetaPanel.characterization.test.tsx` pins every state of the three sections), and the other
components with their callers mocked. The two route test files are unchanged by MI-04: they still
mock `infrastructure/fetch`, `infrastructure/snapshots` and the Prisma client, which the wired
adapters reach as before.

## Entry points

| File        | Publishes                                                                                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`  | `computeMetaShifts` and the types `EdhrecData`, `TournamentData`, `MetaSource`, `CommanderMetaData`                                                                                                                                                                                           |
| `server.ts` | `getCommanderMeta` wired on the shared Prisma client, the two providers, the snapshot history and the system clock (plus its result types); `fetchEdhrecData`, `fetchTournamentData`, `recordEdhrecSnapshot`, `readSnapshotHistory`, `DEFAULT_WINDOW_DAYS`, `MAX_WINDOW_DAYS` (`server-only`) |

There is no `client.ts` yet: the two hooks have no importer outside the context. The builder page
imports `MetaPanel` and `MetaTrendsView` by their `ui/` paths, and the AI suggestions panel imports
`RecommendationProvenance` and `ExternalRecommendationFreshness` the same way. `entry-points.test.ts`
pins the runtime export list of each entry point.

## Known gaps

- The meta cache repository and the route's moderator lookup swallow their errors silently, as the
  route did before MI-04; B2-12 decides what to log. A stored `MetaCache` row that no longer parses
  reads as a miss and is refetched, where the route used to serve it as is.
- On a provider failure the use case reads the cache a second time for the stale entry, as the
  route did; reusing the first read would save one query on that path.
- The deck-versus-meta comparison (which popular cards the deck lacks) lives in
  `client/useMetaPanel.ts` since MI-05; it moves to `domain/` in a later slice.
- Fixed on 2026-11-13: a commander change while the panel is open now reads the new commander's
  sources and shows nothing of the previous one meanwhile. `useMetaPanel.ts` keys its "already read"
  state by commander name, and `useMetaAnalysis.ts` holds its state with the commander it was loaded
  for, so another commander reads it as untouched. `MetaPanel.characterization.test.tsx` pins the
  open, closed and cleared-commander cases.
- `fetch.ts` holds both providers in one module behind one `meta-provider.ts`; ADR 0004 wants one
  adapter each (MI-07).
- The commander slug is imported from `lib/meta/commander-slug.ts` by `infrastructure/mtgtop8.ts`,
  `client/` and `ui/`; COM-02 moves it to the community context's `index.ts`.
- The boundary rules run at `warn` for this context until MI-07 closes the series.
