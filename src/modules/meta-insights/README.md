# Meta insights

> **Kind:** supporting. **Glossary:** [CONTEXT.md, Meta insights](../../../CONTEXT.md#meta-insights).
> **Decisions:** [ADR 0001](../../../docs/adr/0001-modular-monolith-by-bounded-context.md) (modular monolith),
> [ADR 0002](../../../docs/adr/0002-module-entry-points-index-server-client.md) (entry points),
> [ADR 0003](../../../docs/adr/0003-domain-as-readonly-data-and-pure-functions.md) (readonly domain),
> [ADR 0004](../../../docs/adr/0004-anti-corruption-layers-for-external-providers.md) (one adapter per provider).
> **Status:** series open (MI-01 and MI-02 pinned the providers; MI-03 moved the files; MI-06 split the
> analysis hook; MI-04 and MI-05 extract the use case and split the panel; MI-07 closes the series).
> The functional doc and the full README come with the closing slice.

What the wider meta plays for a commander: the cards EDHREC reports as popular, with their inclusion
rates; the recent tournament decks MTGTop8 lists for the commander; and, from one EDHREC snapshot a
day retained for a year, what moved between two dates. The builder page shows all three in the meta
panel and the trends view; the AI suggestions panel borrows the provenance badge and the freshness
line to label its own recommendations.

Not owned here: the commander slug (`lib/meta/commander-slug.ts`, community context, COM-02), the
`MetaCache` read-through that the meta route still performs itself (`app/api/meta/[commanderSlug]/route.ts`,
MI-04), and the AI suggestions panel that renders two of the badges (ai-copilot context).

## Layers

| Folder            | Holds                                  | Files                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Readonly data and pure functions       | `types.ts`: `MetaCard`, `TournamentDeck`, `EdhrecData`, `TournamentData`. `evidence-label.ts`: `MetaEvidenceKind`, the kinds of evidence behind a recommendation. `history.ts`: `computeMetaShifts`, `buildMetaTrendView` and the bounded-shift arithmetic over truncated top-20 lists.                                                                                                                               |
| `infrastructure/` | Provider adapters and the Prisma store | `fetch.ts`: `fetchEdhrecData` (EDHREC JSON) and `fetchTournamentData` (MTGTop8 search, archetype first, card search as the fallback). `mtgtop8.ts`: the MTGTop8 HTML parser and the archetype matching, no I/O. `snapshots.ts` (`server-only`): `recordEdhrecSnapshot`, `readSnapshotHistory` and the window and retention constants over `MetaSnapshot`. `fixtures/`: the recorded EDHREC and MTGTop8 pages (MI-02). |
| `client/`         | Browser hooks and their pure state     | `useMetaAnalysis.ts`: the request to `GET /api/meta/:slug`, one call per source, with its timeout and latest-wins guard. `meta-source-state.ts`: `MetaState` and each source's begin, finish and fail transitions. `meta-api-response.ts`: the response type and the rules reading a failure from a body and a status. `useMetaShifts.ts`: `GET /api/meta/:slug/history` as a report or `null`.                       |
| `ui/`             | React components                       | `MetaPanel.tsx`: the meta panel of the builder page. `MetaTrendsView.tsx`: the shifts over the window. `MetaSourceDisclosure.tsx`: which source a result comes from, with its freshness. `RecommendationProvenance.tsx`: the evidence-kind badge. `ExternalRecommendationFreshness.tsx`: source, observation time and sample size of an external recommendation.                                                      |

There is no `application/` folder yet: the meta route holds the cache read-through and calls the
fetchers and the snapshot store itself (MI-04). There is no `testing/` folder: the fetchers are
tested against the recorded fixtures through MSW, the parser on fixture text, the hooks and the
components with their callers mocked.

## Entry points

| File        | Publishes                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`  | `computeMetaShifts` and the types `EdhrecData`, `TournamentData`                                                                                  |
| `server.ts` | `fetchEdhrecData`, `fetchTournamentData`, `recordEdhrecSnapshot`, `readSnapshotHistory`, `DEFAULT_WINDOW_DAYS`, `MAX_WINDOW_DAYS` (`server-only`) |

There is no `client.ts` yet: the two hooks have no importer outside the context. The builder page
imports `MetaPanel` and `MetaTrendsView` by their `ui/` paths, and the AI suggestions panel imports
`RecommendationProvenance` and `ExternalRecommendationFreshness` the same way. `entry-points.test.ts`
pins the runtime export list of each entry point.

## Known gaps

- The meta route keeps the `MetaCache` read-through, its Prisma calls and two casts of the stored
  JSON; MI-04 moves them behind a use case and a repository with a Zod parse.
- `MetaPanel.tsx` is a 600-line component with `complexity` and `max-lines` suppressions; MI-05 splits
  it. The deck-versus-meta comparison (which popular cards the deck lacks) lives in that component,
  not in `domain/`; it moves there once MI-05 has extracted it into `useMetaPanel`.
- `fetch.ts` holds both providers in one module; ADR 0004 wants one adapter each (MI-04 or MI-07).
- The commander slug is imported from `lib/meta/commander-slug.ts` by `infrastructure/mtgtop8.ts`,
  `client/` and `ui/`; COM-02 moves it to the community context's `index.ts`.
- The boundary rules run at `warn` for this context until MI-07 closes the series.
