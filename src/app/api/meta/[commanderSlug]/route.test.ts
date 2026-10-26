import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindUnique,
  mockUpsert,
  mockFetchEdhrecData,
  mockFetchTournamentData,
  mockRecordSnapshot,
  mockCheckRateLimit,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpsert: vi.fn(),
  mockFetchEdhrecData: vi.fn(),
  mockFetchTournamentData: vi.fn(),
  mockRecordSnapshot: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    metaCache: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
}));

vi.mock("@/lib/meta/fetch", () => ({
  fetchEdhrecData: mockFetchEdhrecData,
  fetchTournamentData: mockFetchTournamentData,
}));

vi.mock("@/lib/meta/snapshots", () => ({
  recordEdhrecSnapshot: mockRecordSnapshot,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: () => "127.0.0.1",
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

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
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/meta/:commanderSlug", () => {
  it("timestamps live recommendations with when they were observed", async () => {
    const response = await GET(request(), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      _meta: { cached: false, observedAt: OBSERVED_AT },
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
      _meta: { cached: true, stale: true },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
