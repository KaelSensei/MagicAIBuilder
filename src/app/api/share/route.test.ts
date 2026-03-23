import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
// vi.mock() is hoisted to the top of the file by Vitest, so factory variables
// must be created with vi.hoisted() to ensure they're initialized in time.

const { mockDeckFindUnique } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: {
      findUnique: mockDeckFindUnique,
    },
  },
}));

// ─── Import route handler after mocks are in place ───────────────────────────

import { GET } from "@/app/api/share/[token]/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(token: string): Request {
  return new Request(`http://localhost:3000/api/share/${token}`);
}

function makeParams(token: string): { params: Promise<{ token: string }> } {
  return { params: Promise.resolve({ token }) };
}

/** Minimal shared deck fixture (shape returned by Prisma) */
function makeDbDeck(overrides: Record<string, unknown> = {}) {
  return {
    id: "cltest123",
    name: "Atraxa Superfriends",
    format: "commander",
    targetBracket: 3,
    budget: null,
    commanderId: "scryfall-uuid-atraxa",
    partnerId: null,
    companionId: null,
    pairingType: "none",
    shareToken: "abc123XYZABC",
    shareEnabled: true,
    cards: [
      {
        id: "card-db-id-1",
        deckId: "cltest123",
        scryfallId: "scryfall-uuid-atraxa",
        name: "Atraxa, Praetors' Voice",
        manaCost: "{G}{W}{U}{B}",
        cmc: 4,
        typeLine: "Legendary Creature — Phyrexian Angel Horror",
        oracleText: "Flying, vigilance, deathtouch, lifelink…",
        colorIdentity: ["G", "W", "U", "B"],
        isGameChanger: true,
        isBanned: false,
        price: 8.5,
        imageUri: "https://cards.scryfall.io/normal/front/test.jpg",
        artCropUri: "https://cards.scryfall.io/art_crop/front/test.jpg",
        category: "commander",
        quantity: 1,
        isCommander: true,
        isPartner: false,
      },
    ],
    createdAt: new Date("2026-03-21T00:00:00Z"),
    updatedAt: new Date("2026-03-21T12:00:00Z"),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/share/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 200 and deck JSON for a valid, enabled share token", async () => {
    const dbDeck = makeDbDeck();
    mockDeckFindUnique.mockResolvedValueOnce(dbDeck);

    const res = await GET(makeRequest("abc123XYZABC"), makeParams("abc123XYZABC"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("cltest123");
    expect(body.name).toBe("Atraxa Superfriends");
    expect(body.shareEnabled).toBe(true);
    expect(body.cards).toHaveLength(1);
  });

  it("strips shareToken from the public response", async () => {
    mockDeckFindUnique.mockResolvedValueOnce(makeDbDeck());

    const res = await GET(makeRequest("abc123XYZABC"), makeParams("abc123XYZABC"));
    const body = await res.json();

    expect(body).not.toHaveProperty("shareToken");
  });

  it("queries Prisma with the correct shareToken", async () => {
    mockDeckFindUnique.mockResolvedValueOnce(makeDbDeck());

    await GET(makeRequest("abc123XYZABC"), makeParams("abc123XYZABC"));

    expect(mockDeckFindUnique).toHaveBeenCalledWith({
      where: { shareToken: "abc123XYZABC" },
      include: { cards: true },
    });
  });

  // ── Not found / disabled ────────────────────────────────────────────────────

  it("returns 404 when deck is not found in DB (token doesn't exist)", async () => {
    mockDeckFindUnique.mockResolvedValueOnce(null);

    const res = await GET(makeRequest("unknowntoken1"), makeParams("unknowntoken1"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 404 when deck exists but shareEnabled is false", async () => {
    mockDeckFindUnique.mockResolvedValueOnce(
      makeDbDeck({ shareEnabled: false })
    );

    const res = await GET(makeRequest("abc123XYZABC"), makeParams("abc123XYZABC"));

    expect(res.status).toBe(404);
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it("returns 400 for an empty token", async () => {
    const res = await GET(makeRequest(""), makeParams(""));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a token exceeding 64 characters", async () => {
    const longToken = "a".repeat(65);
    const res = await GET(makeRequest(longToken), makeParams(longToken));

    expect(res.status).toBe(400);
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a token with invalid characters (spaces, <, >, etc.)", async () => {
    const badToken = "bad token!<>";
    const res = await GET(makeRequest(badToken), makeParams(badToken));

    expect(res.status).toBe(400);
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("accepts tokens with base64url special chars (- and _)", async () => {
    const token = "aB3-xY_z1qAB"; // 13 chars, but still valid pattern
    mockDeckFindUnique.mockResolvedValueOnce(
      makeDbDeck({ shareToken: token })
    );

    const res = await GET(makeRequest(token), makeParams(token));

    expect(res.status).toBe(200);
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  it("returns 500 when Prisma throws an unexpected error", async () => {
    mockDeckFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await GET(makeRequest("abc123XYZABC"), makeParams("abc123XYZABC"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
