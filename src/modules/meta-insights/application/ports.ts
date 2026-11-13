/**
 * What serving a commander's meta needs from the outside: the `MetaCache`
 * rows that keep one answer per commander and source for a day, the two
 * providers behind the answers, the EDHREC history the live answers feed,
 * and the clock that decides whether a row is still fresh.
 *
 * The ports of the meta insights context's `application/` layer.
 * `infrastructure/` implements them (`meta-cache-repository.ts`,
 * `meta-provider.ts`, `snapshots.ts`) and `server.ts` wires the
 * implementations into `getCommanderMeta`. Tests hand the use case in-memory
 * fakes instead (ADR 0005): `testing/in-memory-meta-cache-repository.ts` and
 * the fakes declared in `get-commander-meta.test.ts`.
 *
 * @module meta-insights/application/ports
 */
import type {
  CommanderMetaData,
  EdhrecData,
  MetaSource,
  TournamentData,
} from "@/modules/meta-insights/domain/types";

/** The unique key of a `MetaCache` row: one answer per commander and source. */
export interface MetaCacheKey {
  /** The commander slug as the route validated it: `[a-z0-9-]{1,100}`. */
  readonly commanderSlug: string;
  readonly source: MetaSource;
}

/** One stored answer, with when it was observed and until when it counts as fresh. */
export interface MetaCacheEntry {
  readonly data: CommanderMetaData;
  /** When the live answer was observed; the route reports it as `observedAt`. */
  readonly cachedAt: Date;
  /** `cachedAt` plus the adapter's time to live (24 h in `infrastructure/meta-cache-repository.ts`). */
  readonly expiresAt: Date;
}

/**
 * The stored answers, one per commander and source.
 *
 * An implementation guarantees:
 * - `read` answers the stored entry whatever its age, or null when none is
 *   stored. The use case decides freshness from `expiresAt`, because a stale
 *   entry is still served when the provider fails;
 * - `read` answers null for a row whose stored data no longer has the shape
 *   of `CommanderMetaData` for its source: a row the adapter cannot read is a
 *   row that is not there;
 * - `write` replaces the entry for the key, with `cachedAt` = `observedAt`;
 * - neither throws. A failed read is a miss and a failed write is dropped,
 *   as the meta route did before the use case existed. B2-12 revisits that
 *   silence; it is pinned by `testing/meta-cache-repository-contract.ts`.
 */
export interface MetaCacheRepository {
  read(key: MetaCacheKey): Promise<MetaCacheEntry | null>;
  write(
    key: MetaCacheKey,
    data: CommanderMetaData,
    observedAt: Date
  ): Promise<void>;
}

/**
 * The two providers behind the meta answers: EDHREC for the popular cards,
 * MTGTop8 for the recent tournament decks (`infrastructure/meta-provider.ts`
 * over the adapters `infrastructure/edhrec.ts` and
 * `infrastructure/mtgtop8-source.ts`, one per provider as ADR 0004 asks).
 *
 * Both methods take the commander slug; the composition knows how each
 * provider is addressed. Either may reject: the adapters throw on a transport
 * or parsing failure, and the use case turns the rejection into the stale
 * fallback or the `unavailable` outcome.
 */
export interface MetaProvider {
  fetchEdhrec(commanderSlug: string): Promise<EdhrecData>;
  fetchTournament(commanderSlug: string): Promise<TournamentData>;
}

/**
 * The retained EDHREC history that `computeMetaShifts` differences
 * (`infrastructure/snapshots.ts`, `recordEdhrecSnapshot`).
 *
 * `recordEdhrec` never rejects: the history is a by-product of a live answer
 * and must not fail the answer. The use case awaits it anyway, because a
 * serverless invocation may be frozen as soon as the response is returned.
 */
export interface MetaHistory {
  recordEdhrec(commanderSlug: string, data: EdhrecData): Promise<void>;
}

/** The current time, so a test can place a cache entry before or after its expiry. */
export interface Clock {
  now(): Date;
}
