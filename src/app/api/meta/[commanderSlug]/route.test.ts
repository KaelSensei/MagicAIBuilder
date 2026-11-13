import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindUnique,
  mockUpsert,
  mockFetchEdhrecData,
  mockFetchTournamentData,
  mockRecordSnapshot,
  mockCheckRateLimit,
  mockAuth,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpsert: vi.fn(),
  mockFetchEdhrecData: vi.fn(),
  mockFetchTournamentData: vi.fn(),
  mockRecordSnapshot: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockAuth: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    metaCache: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
    user: { findUnique: mockUserFindUnique },
  });
});
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

// One mock at the `MetaProvider` seam, where the two adapters meet the use
// case; the route still runs the real use case and cache repository.
vi.mock(import("@/modules/meta-insights/infrastructure/meta-provider"), () => ({
  metaProvider: {
    fetchEdhrec: mockFetchEdhrecData,
    fetchTournament: mockFetchTournamentData,
  },
}));

vi.mock(import("@/modules/meta-insights/infrastructure/snapshots"), () => ({
  recordEdhrecSnapshot: mockRecordSnapshot,
}));
vi.mock(import("@/lib/rate-limit"), () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: () => "127.0.0.1",
}));
vi.mock(import("@/lib/logger"), () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from "./route";

const OBSERVED_AT = "2026-08-30T01:00:00.000Z";

function request(): Request {
  return new Request("http://localhost/api/meta/atraxa?source=edhrec");
}

function params() {
  return { params: Promise.resolve({ commanderSlug: "atraxa" }) };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(OBSERVED_AT));
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockFindUnique.mockResolvedValue(null);
  mockUpsert.mockResolvedValue(undefined);
  mockFetchEdhrecData.mockResolvedValue({
    cards: [{ name: "Sol Ring", inclusion: 0.8 }],
  });
  mockRecordSnapshot.mockResolvedValue(undefined);
  mockAuth.mockResolvedValue(null);
  mockUserFindUnique.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/meta/:commanderSlug", () => {
  it("timestamps live recommendations with when they were observed", async () => {
    const response = await GET(request(), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      _meta: { source: "edhrec", cached: false, observedAt: OBSERVED_AT },
    });
  });

  it("preserves the observation time when serving cached recommendations", async () => {
    mockFindUnique.mockResolvedValue({
      data: { cards: [] },
      cachedAt: new Date("2026-08-29T10:30:00.000Z"),
      expiresAt: new Date("2026-08-31T10:30:00.000Z"),
    });

    const response = await GET(request(), params());

    await expect(response.json()).resolves.toMatchObject({
      _meta: {
        source: "edhrec",
        cached: true,
        observedAt: "2026-08-29T10:30:00.000Z",
      },
    });
  });

  it("preserves the observation time when falling back to stale recommendations", async () => {
    mockFindUnique.mockResolvedValue({
      data: { cards: [] },
      cachedAt: new Date("2026-08-20T10:30:00.000Z"),
      expiresAt: new Date("2026-08-21T10:30:00.000Z"),
    });
    mockFetchEdhrecData.mockRejectedValue(new Error("upstream unavailable"));

    const response = await GET(request(), params());

    await expect(response.json()).resolves.toMatchObject({
      _meta: {
        source: "edhrec",
        cached: true,
        stale: true,
        observedAt: "2026-08-20T10:30:00.000Z",
      },
    });
  });

  it("serves stale tournament decks without overwriting them when parsing fails", async () => {
    mockFindUnique.mockResolvedValue({
      data: { decks: [{ name: "Known deck", url: "https://www.mtgtop8.com/event?e=1&d=1&f=EDH", source: "mtgtop8" }] },
      cachedAt: new Date("2026-08-20T10:30:00.000Z"),
      expiresAt: new Date("2026-08-21T10:30:00.000Z"),
    });
    mockFetchTournamentData.mockRejectedValue(new Error("Invalid MTGTop8 response"));

    const response = await GET(new Request("http://localhost/api/meta/atraxa?source=tournament"), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      decks: [{ name: "Known deck" }],
      _meta: { source: "tournament", cached: true, stale: true },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

/** A cache row written an hour ago, still inside its 24 h lifetime. */
const FRESH_CACHE = {
  data: { cards: [] },
  cachedAt: new Date("2026-08-30T00:00:00.000Z"),
  expiresAt: new Date("2026-08-31T00:00:00.000Z"),
};

function requestWithRefresh(refresh: string): Request {
  return new Request(
    `http://localhost/api/meta/atraxa?source=edhrec&refresh=${refresh}`
  );
}

function signedInAs(id: string, isModerator: boolean): void {
  mockAuth.mockResolvedValue({ user: { id, email: `${id}@test.com` } });
  mockUserFindUnique.mockResolvedValue({ id, isModerator });
}

describe("GET /api/meta/:commanderSlug — forcing a refresh", () => {
  beforeEach(() => {
    mockFindUnique.mockResolvedValue(FRESH_CACHE);
  });

  it("serves the fresh cache when the refresh flag is false", async () => {
    const response = await GET(requestWithRefresh("false"), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      _meta: { cached: true },
    });
    expect(mockFetchEdhrecData).not.toHaveBeenCalled();
  });

  it("rejects a refresh flag that is neither true nor false", async () => {
    const response = await GET(requestWithRefresh("yes"), params());

    expect(response.status).toBe(400);
    expect(mockFetchEdhrecData).not.toHaveBeenCalled();
  });

  it("serves the fresh cache to an anonymous caller who asks for a refresh", async () => {
    const response = await GET(requestWithRefresh("true"), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      _meta: { cached: true },
    });
    expect(mockFetchEdhrecData).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("serves the fresh cache to a signed-in member who asks for a refresh", async () => {
    signedInAs("member-1", false);

    const response = await GET(requestWithRefresh("true"), params());

    await expect(response.json()).resolves.toMatchObject({
      _meta: { cached: true },
    });
    expect(mockFetchEdhrecData).not.toHaveBeenCalled();
  });

  it("re-fetches upstream when a moderator asks for a refresh", async () => {
    signedInAs("moderator-1", true);

    const response = await GET(requestWithRefresh("true"), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      _meta: { cached: false, observedAt: OBSERVED_AT },
    });
    expect(mockFetchEdhrecData).toHaveBeenCalledWith("atraxa");
  });
});
