import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireScope, mockFindMany, mockCount, mockLogError, mockGroupBy } =
  vi.hoisted(() => ({
    mockRequireScope: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
    mockLogError: vi.fn(),
    mockGroupBy: vi.fn(),
  }));

vi.mock(import("@/lib/api/authenticate"), async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticate")>(
    "@/lib/api/authenticate"
  );
  return { ...actual, requireApiScope: mockRequireScope };
});

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: mockFindMany, count: mockCount },
    deckCard: { groupBy: mockGroupBy },
  });
});
vi.mock(import("@/lib/logger"), () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: mockLogError },
}));

import { GET } from "./route";
import { apiError } from "@/lib/api/authenticate";
import {
  deckCardGroupByFake,
  storedHundredCardDeck,
} from "@/test/deck-card-group-by-fake";

function request(query = "") {
  return new Request(`http://localhost/api/v1/decks${query}`);
}

function deckRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "deck-1",
    name: "Atraxa Superfriends",
    format: "commander",
    commanderName: "Atraxa, Praetors' Voice",
    targetBracket: 3,
    isPublic: false,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-20T10:00:00.000Z"),
    _count: { cards: 99 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireScope.mockResolvedValue({
    ok: true,
    caller: { userId: "user-1", keyId: "key-1", scopes: ["decks:read"] },
  });
  mockFindMany.mockResolvedValue([deckRow()]);
  mockCount.mockResolvedValue(1);
  mockGroupBy.mockResolvedValue([]);
});

describe("GET /api/v1/decks", () => {
  it("requires the decks:read scope", async () => {
    await GET(request());
    expect(mockRequireScope).toHaveBeenCalledWith(expect.any(Request), "decks:read");
  });

  it("passes the authentication failure straight through", async () => {
    mockRequireScope.mockResolvedValue({
      ok: false,
      response: apiError("unauthorized", "Invalid API key"),
    });
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("scopes the listing to the calling key's owner", async () => {
    await GET(request());
    expect(mockFindMany.mock.calls[0][0].where).toEqual({ userId: "user-1" });
    expect(mockCount.mock.calls[0][0].where).toEqual({ userId: "user-1" });
  });

  it("serialises dates as ISO strings and flattens the card count", async () => {
    const body = await (await GET(request())).json();
    expect(body.data).toEqual([
      {
        id: "deck-1",
        name: "Atraxa Superfriends",
        format: "commander",
        commanderName: "Atraxa, Praetors' Voice",
        targetBracket: 3,
        isPublic: false,
        cardCount: 99,
        cardCopyCount: 0,
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-20T10:00:00.000Z",
      },
    ]);
    expect(body.pagination).toEqual({ page: 0, limit: 25, total: 1 });
  });

  // `cardCount` has always counted DeckCard rows, and a public field keeps its
  // meaning: the copies the editor counts arrive beside it.
  it("adds the card copies of a deck with one row of 30 Forests, and keeps cardCount the row count", async () => {
    const fake = deckCardGroupByFake(storedHundredCardDeck("deck-1"));
    mockGroupBy.mockImplementation(fake.groupBy);
    mockFindMany.mockResolvedValue([deckRow({ _count: { cards: 74 } })]);

    const body = await (await GET(request())).json();

    expect(body.data[0]).toMatchObject({ cardCount: 74, cardCopyCount: 100 });
    // Queries per page: the decks, the total and the copies — 3, whatever the page size.
    expect(mockFindMany.mock.calls.length + mockCount.mock.calls.length + fake.calls()).toBe(3);
  });

  it("defaults to the first page of 25", async () => {
    await GET(request());
    expect(mockFindMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 25 });
  });

  it("translates page and limit into skip and take", async () => {
    await GET(request("?page=3&limit=10"));
    expect(mockFindMany.mock.calls[0][0]).toMatchObject({ skip: 30, take: 10 });
  });

  it("rejects an oversized limit rather than clamping it", async () => {
    // Silently serving 100 to a client that asked for 500 makes a full page
    // look like the last one, and the client stops paginating.
    const res = await GET(request("?limit=500"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_request");
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it.each(["?page=-1", "?limit=0", "?page=abc"])("rejects %s", async (query) => {
    expect((await GET(request(query))).status).toBe(400);
  });

  it("returns an empty page rather than 404 when the owner has no decks", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("returns 500 in the API envelope without leaking the database error", async () => {
    mockFindMany.mockRejectedValue(new Error("connection terminated unexpectedly"));
    const res = await GET(request());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: { code: "server_error", message: "Could not list decks" },
    });
    expect(mockLogError).toHaveBeenCalled();
  });
});
