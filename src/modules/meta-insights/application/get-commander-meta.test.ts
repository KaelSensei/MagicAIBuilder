/**
 * Solitary tests of `getCommanderMeta` over in-memory fakes of its ports: the
 * read-through order (fresh cache, else the provider, else the stale entry),
 * what each outcome carries for the route, when the cache is written and when
 * the EDHREC history is recorded. The providers' own behaviour is pinned in
 * `infrastructure/fetch.test.ts`; the stored-row parse in
 * `infrastructure/meta-cache-repository.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { makeGetCommanderMeta } from "@/modules/meta-insights/application/get-commander-meta";
import type {
  Clock,
  MetaHistory,
  MetaProvider,
} from "@/modules/meta-insights/application/ports";
import type {
  EdhrecData,
  TournamentData,
} from "@/modules/meta-insights/domain/types";
import { inMemoryMetaCacheRepository } from "@/modules/meta-insights/testing/in-memory-meta-cache-repository";

const SLUG = "atraxa-praetors-voice";
const NOW = new Date("2026-08-30T01:00:00.000Z");
const ONE_HOUR_MS = 60 * 60 * 1000;

const LIVE_EDHREC: EdhrecData = {
  cards: [{ name: "Sol Ring", inclusion: 0.9 }],
};
const CACHED_EDHREC: EdhrecData = {
  cards: [{ name: "Arcane Signet", inclusion: 0.8 }],
};
const LIVE_TOURNAMENT: TournamentData = {
  decks: [
    {
      name: "Atraxa Superfriends",
      url: "https://www.mtgtop8.com/event?e=1&d=1&f=EDH",
      source: "mtgtop8",
    },
  ],
};

/** A cache row written an hour ago, fresh for another 23 hours. */
const FRESH_ENTRY = {
  data: CACHED_EDHREC,
  cachedAt: new Date(NOW.getTime() - ONE_HOUR_MS),
  expiresAt: new Date(NOW.getTime() + 23 * ONE_HOUR_MS),
};

/** A cache row written ten days ago, expired nine days ago. */
const EXPIRED_ENTRY = {
  data: CACHED_EDHREC,
  cachedAt: new Date("2026-08-20T10:30:00.000Z"),
  expiresAt: new Date("2026-08-21T10:30:00.000Z"),
};

interface FakeProvider extends MetaProvider {
  /** The slugs each provider was asked for, in call order. */
  readonly edhrecCalls: readonly string[];
  readonly tournamentCalls: readonly string[];
}

/** A provider that answers `edhrec` and `tournament`, or rejects with `failure` when given. */
function fakeProvider(answers: {
  readonly edhrec?: EdhrecData;
  readonly tournament?: TournamentData;
  readonly failure?: unknown;
}): FakeProvider {
  const edhrecCalls: string[] = [];
  const tournamentCalls: string[] = [];
  return {
    edhrecCalls,
    tournamentCalls,
    fetchEdhrec: (slug) => {
      edhrecCalls.push(slug);
      if (answers.edhrec) return Promise.resolve(answers.edhrec);
      return Promise.reject(answers.failure);
    },
    fetchTournament: (slug) => {
      tournamentCalls.push(slug);
      if (answers.tournament) return Promise.resolve(answers.tournament);
      return Promise.reject(answers.failure);
    },
  };
}

interface FakeHistory extends MetaHistory {
  readonly recorded: readonly { slug: string; data: EdhrecData }[];
}

/** A history that remembers what it was asked to record. */
function fakeHistory(): FakeHistory {
  const recorded: { slug: string; data: EdhrecData }[] = [];
  return {
    recorded,
    recordEdhrec: (slug, data) => {
      recorded.push({ slug, data });
      return Promise.resolve();
    },
  };
}

const clock: Clock = { now: () => NOW };

function edhrecQuery(forceRefresh = false) {
  return { commanderSlug: SLUG, source: "edhrec" as const, forceRefresh };
}

describe("getCommanderMeta — a fresh cache entry", () => {
  it("answers the stored cards with their observation time and asks no provider", async () => {
    const cache = inMemoryMetaCacheRepository();
    cache.seed({ commanderSlug: SLUG, source: "edhrec" }, FRESH_ENTRY);
    const provider = fakeProvider({ edhrec: LIVE_EDHREC });
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider,
      history: fakeHistory(),
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery());

    expect(result).toEqual({
      kind: "fresh-cache",
      data: CACHED_EDHREC,
      cachedAt: FRESH_ENTRY.cachedAt,
    });
    expect(provider.edhrecCalls).toEqual([]);
  });

  it("is bypassed when the refresh is forced: the provider answers and overwrites it", async () => {
    const cache = inMemoryMetaCacheRepository();
    cache.seed({ commanderSlug: SLUG, source: "edhrec" }, FRESH_ENTRY);
    const provider = fakeProvider({ edhrec: LIVE_EDHREC });
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider,
      history: fakeHistory(),
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery(true));

    expect(result).toEqual({
      kind: "live",
      data: LIVE_EDHREC,
      observedAt: NOW,
    });
    expect(provider.edhrecCalls).toEqual([SLUG]);
    expect(
      (await cache.read({ commanderSlug: SLUG, source: "edhrec" }))?.data
    ).toEqual(LIVE_EDHREC);
  });
});

describe("getCommanderMeta — an expired cache entry", () => {
  it("answers the provider, writes the cache and records the EDHREC history when the provider answers", async () => {
    const cache = inMemoryMetaCacheRepository();
    cache.seed({ commanderSlug: SLUG, source: "edhrec" }, EXPIRED_ENTRY);
    const history = fakeHistory();
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider: fakeProvider({ edhrec: LIVE_EDHREC }),
      history,
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery());

    expect(result).toEqual({
      kind: "live",
      data: LIVE_EDHREC,
      observedAt: NOW,
    });
    expect(await cache.read({ commanderSlug: SLUG, source: "edhrec" })).toEqual(
      {
        data: LIVE_EDHREC,
        cachedAt: NOW,
        expiresAt: new Date(NOW.getTime() + 24 * ONE_HOUR_MS),
      }
    );
    expect(history.recorded).toEqual([{ slug: SLUG, data: LIVE_EDHREC }]);
  });

  it("falls back to the stale entry, with the failure, when the provider fails, and writes nothing", async () => {
    const cache = inMemoryMetaCacheRepository();
    cache.seed({ commanderSlug: SLUG, source: "edhrec" }, EXPIRED_ENTRY);
    const history = fakeHistory();
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider: fakeProvider({ failure: new Error("upstream unavailable") }),
      history,
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery());

    expect(result).toEqual({
      kind: "stale-cache",
      data: CACHED_EDHREC,
      cachedAt: EXPIRED_ENTRY.cachedAt,
      failure: { message: "upstream unavailable" },
    });
    expect(cache.writes).toEqual([]);
    expect(history.recorded).toEqual([]);
  });
});

describe("getCommanderMeta — no cache entry", () => {
  it("answers the provider and records the history, like a first visit", async () => {
    const cache = inMemoryMetaCacheRepository();
    const history = fakeHistory();
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider: fakeProvider({ edhrec: LIVE_EDHREC }),
      history,
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery());

    expect(result).toEqual({
      kind: "live",
      data: LIVE_EDHREC,
      observedAt: NOW,
    });
    expect(cache.writes).toEqual([{ commanderSlug: SLUG, source: "edhrec" }]);
    expect(history.recorded).toHaveLength(1);
  });

  it("is unavailable, with the failure's message, when the provider fails too", async () => {
    const getCommanderMeta = makeGetCommanderMeta({
      cache: inMemoryMetaCacheRepository(),
      provider: fakeProvider({
        failure: new Error("Invalid MTGTop8 response"),
      }),
      history: fakeHistory(),
      clock,
    });

    const result = await getCommanderMeta({
      commanderSlug: SLUG,
      source: "tournament",
      forceRefresh: false,
    });

    expect(result).toEqual({
      kind: "unavailable",
      failure: { message: "Invalid MTGTop8 response" },
    });
  });

  it("names a failure that is not an Error 'Meta fetch failed', as the route always has", async () => {
    const getCommanderMeta = makeGetCommanderMeta({
      cache: inMemoryMetaCacheRepository(),
      provider: fakeProvider({ failure: "boom" }),
      history: fakeHistory(),
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery());

    expect(result).toEqual({
      kind: "unavailable",
      failure: { message: "Meta fetch failed" },
    });
  });

  it("serves the stale entry even when the refresh was forced and the provider fails", async () => {
    const cache = inMemoryMetaCacheRepository();
    cache.seed({ commanderSlug: SLUG, source: "edhrec" }, FRESH_ENTRY);
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider: fakeProvider({ failure: new Error("upstream unavailable") }),
      history: fakeHistory(),
      clock,
    });

    const result = await getCommanderMeta(edhrecQuery(true));

    expect(result).toMatchObject({ kind: "stale-cache", data: CACHED_EDHREC });
  });
});

describe("getCommanderMeta — the tournament source", () => {
  it("asks MTGTop8 by slug, caches the decks and records no EDHREC history", async () => {
    const cache = inMemoryMetaCacheRepository();
    const provider = fakeProvider({ tournament: LIVE_TOURNAMENT });
    const history = fakeHistory();
    const getCommanderMeta = makeGetCommanderMeta({
      cache,
      provider,
      history,
      clock,
    });

    const result = await getCommanderMeta({
      commanderSlug: SLUG,
      source: "tournament",
      forceRefresh: false,
    });

    expect(result).toEqual({
      kind: "live",
      data: LIVE_TOURNAMENT,
      observedAt: NOW,
    });
    expect(provider.tournamentCalls).toEqual([SLUG]);
    expect(provider.edhrecCalls).toEqual([]);
    expect(cache.writes).toEqual([
      { commanderSlug: SLUG, source: "tournament" },
    ]);
    expect(history.recorded).toEqual([]);
  });
});
