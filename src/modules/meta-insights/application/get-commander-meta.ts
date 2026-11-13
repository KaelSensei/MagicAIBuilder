/**
 * What the wider meta plays for a commander, answered from the day's cached
 * answer when there is one, otherwise from the provider, otherwise from the
 * last answer however old it is.
 *
 * The one use case of the meta insights context. `GET /api/meta/:slug` calls
 * it through `server.ts` after validating the slug and the query, and maps
 * each outcome to a response; the HTTP concerns (the per-client rate limit,
 * who may force a refresh, status codes, the log line) stay in the route. The
 * use case depends on the ports in `ports.ts` only, so it runs in Vitest with
 * in-memory fakes and no network or database (ADR 0005).
 *
 * @module meta-insights/application/get-commander-meta
 */
import type {
  Clock,
  MetaCacheEntry,
  MetaCacheKey,
  MetaCacheRepository,
  MetaHistory,
  MetaProvider,
} from "@/modules/meta-insights/application/ports";
import type {
  CommanderMetaData,
  MetaSource,
} from "@/modules/meta-insights/domain/types";

/** The adapters an answer runs on; `server.ts` passes the real ones. */
export interface GetCommanderMetaPorts {
  readonly cache: MetaCacheRepository;
  readonly provider: MetaProvider;
  readonly history: MetaHistory;
  readonly clock: Clock;
}

/** One request for a commander's meta, as the route validated it. */
export interface GetCommanderMetaQuery {
  /** Already checked against `[a-z0-9-]{1,100}` by the route. */
  readonly commanderSlug: string;
  readonly source: MetaSource;
  /**
   * Skip a fresh cache entry and ask the provider anyway. The route grants it
   * to moderators only; the use case trusts the flag it is given.
   */
  readonly forceRefresh: boolean;
}

/** Why the provider gave no answer: its message, as the route logs it. */
export interface MetaFetchFailure {
  /** The provider error's message, or "Meta fetch failed" when it threw something else. */
  readonly message: string;
}

/**
 * How an answer was obtained, with what the route reports in `_meta`:
 * - `fresh-cache`: the stored answer, observed at `cachedAt` and still within
 *   its day;
 * - `live`: the provider's answer, observed now and stored for the next day;
 * - `stale-cache`: the provider failed and the stored answer, past its day,
 *   is served instead; `failure` says why the provider failed;
 * - `unavailable`: the provider failed and nothing is stored.
 */
export type CommanderMetaResult =
  | {
      readonly kind: "fresh-cache";
      readonly data: CommanderMetaData;
      readonly cachedAt: Date;
    }
  | {
      readonly kind: "live";
      readonly data: CommanderMetaData;
      readonly observedAt: Date;
    }
  | {
      readonly kind: "stale-cache";
      readonly data: CommanderMetaData;
      readonly cachedAt: Date;
      readonly failure: MetaFetchFailure;
    }
  | { readonly kind: "unavailable"; readonly failure: MetaFetchFailure };

/** A wired use case: a validated query in, a `CommanderMetaResult` out. */
export type GetCommanderMeta = (
  query: GetCommanderMetaQuery
) => Promise<CommanderMetaResult>;

/** The route's wording for a provider failure that carries no message of its own. */
const DEFAULT_FAILURE_MESSAGE = "Meta fetch failed";

function toFailure(error: unknown): MetaFetchFailure {
  return {
    message: error instanceof Error ? error.message : DEFAULT_FAILURE_MESSAGE,
  };
}

function isFresh(entry: MetaCacheEntry, now: Date): boolean {
  return entry.expiresAt > now;
}

/**
 * Asks the provider for the source, stores the answer and, for EDHREC, records
 * the day's snapshot. Rejects when the provider does; the caller falls back.
 */
async function fetchAndRetain(
  ports: GetCommanderMetaPorts,
  key: MetaCacheKey
): Promise<CommanderMetaResult> {
  const { cache, provider, history, clock } = ports;
  if (key.source === "edhrec") {
    const data = await provider.fetchEdhrec(key.commanderSlug);
    const observedAt = clock.now();
    await cache.write(key, data, observedAt);
    // Awaited, not fired and forgotten: a serverless invocation can be frozen
    // the moment its response is returned, and a detached promise would then
    // be lost at random, leaving holes in the history nothing could explain.
    await history.recordEdhrec(key.commanderSlug, data);
    return { kind: "live", data, observedAt };
  }
  const data = await provider.fetchTournament(key.commanderSlug);
  const observedAt = clock.now();
  await cache.write(key, data, observedAt);
  return { kind: "live", data, observedAt };
}

/**
 * Builds the use case over the given ports.
 *
 * The returned function reads the cache first unless the refresh is forced,
 * and answers a fresh entry as is. Otherwise it asks the provider; a live
 * answer is stored and, for EDHREC, recorded in the history before it is
 * returned. When the provider fails, the cache is read again and whatever it
 * holds is served as stale; the failure travels with the result so the route
 * can log it. The function never throws for a provider failure.
 *
 * @param ports - the cache, the provider, the history and the clock to run on
 * @returns the use case, ready to be called once per request
 */
export function makeGetCommanderMeta(
  ports: GetCommanderMetaPorts
): GetCommanderMeta {
  return async ({ commanderSlug, source, forceRefresh }) => {
    const key: MetaCacheKey = { commanderSlug, source };

    if (!forceRefresh) {
      const cached = await ports.cache.read(key);
      if (cached && isFresh(cached, ports.clock.now())) {
        return {
          kind: "fresh-cache",
          data: cached.data,
          cachedAt: cached.cachedAt,
        };
      }
    }

    try {
      return await fetchAndRetain(ports, key);
    } catch (error) {
      const failure = toFailure(error);
      // Read again rather than reuse the first read: the route always re-read
      // here, and a forced refresh made no first read at all.
      const stale = await ports.cache.read(key);
      if (stale) {
        return {
          kind: "stale-cache",
          data: stale.data,
          cachedAt: stale.cachedAt,
          failure,
        };
      }
      return { kind: "unavailable", failure };
    }
  };
}
