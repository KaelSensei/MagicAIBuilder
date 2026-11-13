/**
 * An in-memory `MetaCacheRepository` for tests (ADR 0005: owned ports get a
 * hand-written fake that passes the port's contract suite).
 *
 * A test seeds an entry as the adapter would have stored it, or tells the
 * fake that the store is down, and reads back what the use case wrote. Like
 * the Prisma adapter, it keeps one entry per commander and source, stamps
 * `expiresAt` from the same time to live, and never throws: a failed read is
 * a miss and a failed write is dropped. Contract:
 * `meta-cache-repository-contract.ts`.
 *
 * @module meta-insights/testing/in-memory-meta-cache-repository
 */
import type {
  MetaCacheEntry,
  MetaCacheKey,
  MetaCacheRepository,
} from "@/modules/meta-insights/application/ports";
import type { CommanderMetaData } from "@/modules/meta-insights/domain/types";

/**
 * How long a stored answer counts as fresh, the same day the adapter uses
 * (`META_CACHE_TTL_MS` in `infrastructure/meta-cache-repository.ts`). Kept
 * apart from it so the fake does not import an adapter.
 */
export const FAKE_META_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** The fake, plus the seeding, the failure switch and the record its tests read. */
export interface InMemoryMetaCacheRepository extends MetaCacheRepository {
  /** The stored entries, keyed by `metaCacheKey`; exposed for seeding and assertions. */
  readonly entries: Map<string, MetaCacheEntry>;
  /** Every key `write` was given, in call order, including the writes dropped while down. */
  readonly writes: readonly MetaCacheKey[];
  /** Stores `entry` as if the adapter had written it, with its own dates. */
  seed(key: MetaCacheKey, entry: MetaCacheEntry): void;
  /** From now on, every read misses and every write is dropped, until `recover`. */
  goDown(): void;
  /** The store answers again. */
  recover(): void;
}

/** @returns the one string the fake keys an entry on: the commander slug and the source. */
export function metaCacheKey(key: MetaCacheKey): string {
  return `${key.source}:${key.commanderSlug}`;
}

/** @returns a new, empty fake that answers, independent of every other */
export function inMemoryMetaCacheRepository(): InMemoryMetaCacheRepository {
  const entries = new Map<string, MetaCacheEntry>();
  const writes: MetaCacheKey[] = [];
  let down = false;

  return {
    entries,
    writes,
    seed(key, entry) {
      entries.set(metaCacheKey(key), entry);
    },
    goDown() {
      down = true;
    },
    recover() {
      down = false;
    },
    read: (key) =>
      Promise.resolve(down ? null : (entries.get(metaCacheKey(key)) ?? null)),
    write: (key, data: CommanderMetaData, observedAt) => {
      writes.push(key);
      if (!down) {
        entries.set(metaCacheKey(key), {
          data,
          cachedAt: observedAt,
          expiresAt: new Date(observedAt.getTime() + FAKE_META_CACHE_TTL_MS),
        });
      }
      return Promise.resolve();
    },
  };
}
