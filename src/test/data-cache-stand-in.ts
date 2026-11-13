/**
 * A memoizing stand-in for `unstable_cache` from `next/cache`, for tests that
 * pin what a cached read may hand to the next viewer.
 *
 * Why: outside a Next request there is no data cache, and `unstable_cache`
 * throws ("incrementalCache missing"). The pass-through stand-in of the lookup
 * tests records the cache options and hands the read back untouched: it pins
 * *that* a read is cached, not *what* a later viewer gets from it. A
 * viewer-relative field (`isFollowing`, `viewerVote`, `isOwner`) can only leak
 * through a cache hit, so a leak test needs a cache that hits. This module
 * keeps every resolved answer in a `Map`, keyed the way Next keys its entries:
 * the read's source text, the `keyParts` and the JSON of the arguments
 * (https://nextjs.org/docs/app/api-reference/functions/unstable_cache, read
 * 2026-11-13). Two closures with the same source and `keyParts`, called with
 * the same arguments, therefore share one entry, exactly as they would in
 * production: a read that closes over the viewer instead of taking them as an
 * argument leaks here as it would there.
 *
 * An entry never expires: the windows are a minute long and a test lasts
 * milliseconds. A rejected read is not kept, as in Next.
 *
 * ```ts
 * vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));
 * import { dataCache } from "@/test/data-cache-stand-in";
 * afterEach(() => dataCache.reset());
 * ```
 *
 * The cached function is a `Proxy` of the read, so it has the read's own type
 * without a cast, as `stubPrisma` does for the Prisma client.
 *
 * @module test/data-cache-stand-in
 */
import type { unstable_cache as nextUnstableCache } from "next/cache";

type UnstableCache = typeof nextUnstableCache;

/** One `unstable_cache(read, keyParts, options)` call, as the subject made it. */
export interface DataCacheWrap {
  readonly keyParts: readonly string[];
  readonly options: Parameters<UnstableCache>[2];
}

interface DataCacheState {
  readonly entries: Map<string, unknown>;
  readonly wraps: DataCacheWrap[];
  hits: number;
}

const state: DataCacheState = { entries: new Map(), wraps: [], hits: 0 };

/** Next's key: the function's source, the key parts and the serialised arguments. */
function cacheKey(
  read: (...args: never[]) => unknown,
  keyParts: readonly string[],
  args: readonly unknown[]
): string {
  return JSON.stringify([read.toString(), keyParts, args]);
}

/**
 * The stand-in for `unstable_cache`: the same read, answered from the `Map`
 * when an entry exists for the key, otherwise run and kept.
 */
export const unstable_cache: UnstableCache = (read, keyParts = [], options) => {
  state.wraps.push({ keyParts, options });
  return new Proxy(read, {
    apply: async (target, thisArg, args: unknown[]) => {
      const key = cacheKey(target, keyParts, args);
      if (state.entries.has(key)) {
        state.hits += 1;
        return state.entries.get(key);
      }
      const value: unknown = await Reflect.apply(target, thisArg, args);
      state.entries.set(key, value);
      return value;
    },
  });
};

/** What a test may read or reset between scenarios. */
export const dataCache = {
  /** Every `unstable_cache` call since the last reset, in order. */
  get wraps(): readonly DataCacheWrap[] {
    return state.wraps;
  },
  /** How many reads were answered from a kept entry since the last reset. */
  get hits(): number {
    return state.hits;
  },
  /** How many answers the cache holds. */
  get size(): number {
    return state.entries.size;
  },
  /** Forgets every entry, wrap and hit, so one test's cache never reaches the next. */
  reset(): void {
    state.entries.clear();
    state.wraps.length = 0;
    state.hits = 0;
  },
};
