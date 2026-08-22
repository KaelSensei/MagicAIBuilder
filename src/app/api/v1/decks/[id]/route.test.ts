import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireScope, mockFindFirst, mockLogError } = vi.hoisted(() => ({
  mockRequireScope: vi.fn(),
  mockFindFirst: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock("@/lib/api/authenticate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticate")>(
    "@/lib/api/authenticate"
  );
  return { ...actual, requireApiScope: mockRequireScope };
});
vi.mock("@/lib/db/prisma", () => ({ prisma: { deck: { findFirst: mockFindFirst } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import { GET } from "./route";
import { apiError } from "@/lib/api/authenticate";

const request = new Request("http://localhost/api/v1/decks/deck-1");

function params(id = "deck-1") {
  return { params: Promise.resolve({ id }) };
}

function deckRow() {
  return {
    id: "deck-1",
    name: "Atraxa Superfriends",
    description: "",
    tags: ["planeswalkers"],
    format: "commander",
    commanderName: "Atraxa, Praetors' Voice",
    targetBracket: 3,
    budget: 250.5,
    isPublic: false,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-20T10:00:00.000Z"),
    cards: [
      {
        scryfallId: "abc",
        name: "Sol Ring",
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Artifact",
        colorIdentity: [],
        category: "ramp",
        quantity: 1,
        isCommander: false,
        isPartner: false,
        zone: "main",
        price: 1.5,
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireScope.mockResolvedValue({
    ok: true,
    caller: { userId: "user-1", keyId: "key-1", scopes: ["decks:read"] },
  });
  mockFindFirst.mockResolvedValue(deckRow());
});

describe("GET /api/v1/decks/:id", () => {
  it("requires the decks:read scope", async () => {
    await GET(request, params());
    expect(mockRequireScope).toHaveBeenCalledWith(expect.any(Request), "decks:read");
  });

  it("passes an authentication failure through untouched", async () => {
    mockRequireScope.mockResolvedValue({
      ok: false,
      response: apiError("forbidden", 'This key is missing the "decks:read" scope'),
    });
    const res = await GET(request, params());
    expect(res.status).toBe(403);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("filters on the owner in the query rather than checking after the read", async () => {
    await GET(request, params());
    expect(mockFindFirst.mock.calls[0][0].where).toEqual({
      id: "deck-1",
      userId: "user-1",
    });
  });

  it("returns the deck with its cards", async () => {
    const body = await (await GET(request, params())).json();
    expect(body.data.id).toBe("deck-1");
    expect(body.data.cards).toHaveLength(1);
    expect(body.data.cards[0].name).toBe("Sol Ring");
    expect(body.data.createdAt).toBe("2026-08-01T10:00:00.000Z");
    expect(body.data.updatedAt).toBe("2026-08-20T10:00:00.000Z");
  });

  it("gives a missing deck and someone else's deck the same 404", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await GET(request, params("not-mine"));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: { code: "not_found", message: "Deck not found" },
    });
  });

  it("returns 500 in the API envelope without leaking the database error", async () => {
    mockFindFirst.mockRejectedValue(new Error("column \"zone\" does not exist"));
    const res = await GET(request, params());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: { code: "server_error", message: "Could not read the deck" },
    });
    expect(mockLogError).toHaveBeenCalled();
  });
});
