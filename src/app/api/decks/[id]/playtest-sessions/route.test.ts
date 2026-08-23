import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockDeckFindUnique, mockSessionFindMany, mockSessionCreate } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockSessionFindMany: vi.fn(),
  mockSessionCreate: vi.fn(),
}));

// requireAuth resolves the session id against the database, so authenticated
// route tests need that row to exist. These routes never query prisma.user
// themselves, so one persistent echo stub covers every case.
const { mockUserFindUnique } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(async ({ where }: { where: { id?: string } }) => ({
    id: where.id ?? "user-1",
    name: null,
    email: null,
    image: null,
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    deck: { findUnique: mockDeckFindUnique },
    playtestSession: { findMany: mockSessionFindMany, create: mockSessionCreate },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET, POST } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const OWNED_DECK = { id: "deck-1", userId: "owner-1" };
const SOMEONE_ELSES_DECK = { id: "deck-1", userId: "other-1" };

function params() {
  return { params: Promise.resolve({ id: "deck-1" }) };
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/decks/deck-1/playtest-sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function signedInAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    deckId: "deck-1",
    userId: "owner-1",
    result: "win",
    turns: 8,
    mulliganCount: 0,
    difficulty: null,
    notes: null,
    createdAt: new Date("2026-08-16T10:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionFindMany.mockResolvedValue([]);
});

describe("GET /api/decks/[id]/playtest-sessions", () => {
  it("refuses an anonymous caller", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), params());
    expect(response.status).toBe(401);
  });

  it("returns 404 for a deck the caller does not own", async () => {
    // Not 403: a deck you do not own should not be distinguishable from one
    // that does not exist, or the endpoint confirms which decks are real.
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(SOMEONE_ELSES_DECK);
    const response = await GET(new Request("http://localhost"), params());
    expect(response.status).toBe(404);
  });

  it("returns sessions with their summary", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    mockSessionFindMany.mockResolvedValue([row(), row({ id: "s2", result: "loss", turns: 12 })]);

    const response = await GET(new Request("http://localhost"), params());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessions).toHaveLength(2);
    expect(body.summary.total).toBe(2);
    expect(body.summary.winRate).toBe(50);
  });

  it("scopes the query to the caller, not just the deck", async () => {
    // Two players practising the same deck must not see each other's runs.
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    await GET(new Request("http://localhost"), params());

    expect(mockSessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deckId: "deck-1", userId: "owner-1" } })
    );
  });

  it("reports zeroes rather than failing for a deck never played", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    const body = await (await GET(new Request("http://localhost"), params())).json();
    expect(body.summary.total).toBe(0);
    expect(body.summary.winRate).toBe(0);
  });
});

describe("POST /api/decks/[id]/playtest-sessions", () => {
  it("refuses an anonymous caller", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(postRequest({ result: "win", turns: 8 }), params());
    expect(response.status).toBe(401);
  });

  it("rejects a result the schema cannot store", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    const response = await POST(postRequest({ result: "victory", turns: 8 }), params());
    expect(response.status).toBe(400);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it("rejects an impossible turn count", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    const response = await POST(postRequest({ result: "win", turns: 0 }), params());
    expect(response.status).toBe(400);
  });

  it("validates before touching the database", async () => {
    // A bad payload must not cost a deck lookup.
    signedInAs("owner-1");
    await POST(postRequest({ result: "nonsense", turns: 8 }), params());
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a deck the caller does not own", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(SOMEONE_ELSES_DECK);
    const response = await POST(postRequest({ result: "win", turns: 8 }), params());
    expect(response.status).toBe(404);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it("records the session against the caller and the deck", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    mockSessionCreate.mockResolvedValue(row());

    const response = await POST(
      postRequest({ result: "win", turns: 8, mulliganCount: 1, notes: "  kept a two-lander  " }),
      params()
    );

    expect(response.status).toBe(201);
    expect(mockSessionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deckId: "deck-1",
        userId: "owner-1",
        result: "win",
        turns: 8,
        mulliganCount: 1,
        notes: "kept a two-lander",
      }),
    });
  });

  it("creates a new row per run rather than replacing the last one", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(OWNED_DECK);
    mockSessionCreate.mockResolvedValue(row());

    await POST(postRequest({ result: "win", turns: 8 }), params());
    await POST(postRequest({ result: "loss", turns: 5 }), params());

    expect(mockSessionCreate).toHaveBeenCalledTimes(2);
  });
});
