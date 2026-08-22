import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireScope, mockFindMany, mockCount, mockLogError } = vi.hoisted(() => ({
  mockRequireScope: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock("@/lib/api/authenticate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticate")>(
    "@/lib/api/authenticate"
  );
  return { ...actual, requireApiScope: mockRequireScope };
});
vi.mock("@/lib/db/prisma", () => ({
  prisma: { collectionCard: { findMany: mockFindMany, count: mockCount } },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import { GET } from "./route";
import { apiError } from "@/lib/api/authenticate";

function request(query = "") {
  return new Request(`http://localhost/api/v1/collection${query}`);
}

function cardRow(overrides: Record<string, unknown> = {}) {
  return {
    scryfallId: "abc",
    name: "Sol Ring",
    quantity: 2,
    foil: false,
    condition: "NM",
    acquiredAt: new Date("2026-05-01T00:00:00.000Z"),
    price: 1.5,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireScope.mockResolvedValue({
    ok: true,
    caller: { userId: "user-1", keyId: "key-1", scopes: ["collection:read"] },
  });
  mockFindMany.mockResolvedValue([cardRow()]);
  mockCount.mockResolvedValue(1);
});

describe("GET /api/v1/collection", () => {
  it("requires collection:read, not decks:read", async () => {
    await GET(request());
    expect(mockRequireScope).toHaveBeenCalledWith(expect.any(Request), "collection:read");
  });

  it("passes a scope refusal straight through", async () => {
    mockRequireScope.mockResolvedValue({
      ok: false,
      response: apiError("forbidden", 'This key is missing the "collection:read" scope'),
    });
    const res = await GET(request());
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("scopes the listing to the calling key's owner", async () => {
    await GET(request());
    expect(mockFindMany.mock.calls[0][0].where).toEqual({ userId: "user-1" });
    expect(mockCount.mock.calls[0][0].where).toEqual({ userId: "user-1" });
  });

  it("orders by name then finish, so a card in both finishes paginates stably", async () => {
    await GET(request());
    expect(mockFindMany.mock.calls[0][0].orderBy).toEqual([
      { name: "asc" },
      { foil: "asc" },
    ]);
  });

  it("serialises acquiredAt as ISO and keeps a null null", async () => {
    mockFindMany.mockResolvedValue([cardRow(), cardRow({ acquiredAt: null, foil: true })]);
    const body = await (await GET(request())).json();
    expect(body.data[0].acquiredAt).toBe("2026-05-01T00:00:00.000Z");
    expect(body.data[1].acquiredAt).toBeNull();
    expect(body.data[1].foil).toBe(true);
  });

  it("defaults to the first page of 50", async () => {
    await GET(request());
    expect(mockFindMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 50 });
  });

  it("translates page and limit into skip and take", async () => {
    await GET(request("?page=2&limit=20"));
    expect(mockFindMany.mock.calls[0][0]).toMatchObject({ skip: 40, take: 20 });
  });

  it.each(["?limit=201", "?limit=0", "?page=-1", "?page=abc"])(
    "rejects %s rather than clamping",
    async (query) => {
      expect((await GET(request(query))).status).toBe(400);
      expect(mockFindMany).not.toHaveBeenCalled();
    }
  );

  it("returns an empty page rather than 404 for an empty collection", async () => {
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
      error: { code: "server_error", message: "Could not list the collection" },
    });
    expect(mockLogError).toHaveBeenCalled();
  });
});
