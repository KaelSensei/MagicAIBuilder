import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

const {
  mockFindMany,
  mockFindFirst,
  mockCount,
  mockCreate,
  mockUserFindUnique,
  mockUserUpsert,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpsert: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      count: mockCount,
      create: mockCreate,
    },
    user: { findUnique: mockUserFindUnique, upsert: mockUserUpsert },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

const { mockGetCardCollection } = vi.hoisted(() => ({ mockGetCardCollection: vi.fn() }));
vi.mock("@/lib/scryfall/client", () => ({ getCardCollection: mockGetCardCollection }));

import { GET, POST } from "./route";

const OWNER = "user-1";

/**
 * `requireAuth` resolves the session id against the database on every call -
 * it does not trust the JWT's id outright, because that id rides in a signed
 * cookie and outlives the row it points at. So `prisma.user.findUnique` is on
 * the path of every authenticated request here, and a mock that stubs only
 * `prisma.deck` makes each one throw before it reaches the route.
 */
function authed(): void {
  mockAuth.mockResolvedValue({ user: { id: OWNER, name: "Kael", email: "k@test.com" } });
  mockUserFindUnique.mockResolvedValue({
    id: OWNER,
    name: "Kael",
    email: "k@test.com",
    image: null,
  });
}

function unauthed(): void {
  mockAuth.mockResolvedValue(null);
}

function listRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/decks${query}`);
}

function createRequest(
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request("http://localhost:3000/api/decks", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/**
 * The deck collection endpoint.
 *
 * It had no test at all, which is what a coverage report excluding
 * `src/app/**` buys you. The assertions below are about the two things that
 * cannot be seen from a response body: which rows the query asks for, and
 * whether a rejected request still wrote something.
 */
describe("GET /api/decks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it("records the successful listing status and duration without account data", async () => {
    authed();
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);

    const response = await GET(listRequest());

    expect(response.status).toBe(200);
    expect(log).toHaveBeenCalledWith(
      "Deck list request completed",
      "GET /api/decks",
      { status: 200, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(OWNER);
    log.mockRestore();
  });

  it("scopes the listing to the session's own user id", async () => {
    authed();

    await GET(listRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER } })
    );
    expect(mockCount).toHaveBeenCalledWith({ where: { userId: OWNER } });
  });

  /**
   * The scope comes from the session and nothing else. A `userId` in the query
   * string must not reach the query — that would turn a listing into "read any
   * account's decks", and the response would look perfectly normal.
   */
  it("ignores a userId supplied in the query string", async () => {
    authed();

    await GET(listRequest("?userId=someone-else"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER } })
    );
  });

  it("clamps an oversized page size to the maximum", async () => {
    authed();

    const response = await GET(listRequest("?limit=9999"));

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
    await expect(response.json()).resolves.toMatchObject({ limit: 50 });
  });

  it("floors a negative page rather than skipping backwards", async () => {
    authed();

    await GET(listRequest("?page=-5"));

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });

  it("falls back to the defaults when the parameters are not numbers", async () => {
    authed();

    await GET(listRequest("?page=abc&limit=xyz"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  it("returns 401 and queries nothing when unauthenticated", async () => {
    unauthed();
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);

    const response = await GET(listRequest());

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("Deck list request completed", "GET /api/decks", { status: 401, durationMs: expect.any(Number) });
    log.mockRestore();
  });

  it("reports a query failure as a 500 without leaking the message", async () => {
    authed();
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    mockFindMany.mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.0.0.1:5432"));

    const response = await GET(listRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to fetch decks" });
    expect(log).toHaveBeenCalledWith("Deck list request completed", "GET /api/decks", { status: 500, durationMs: expect.any(Number) });
    log.mockRestore();
  });
});

describe("POST /api/decks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCardCollection.mockResolvedValue({ data: [], not_found: [] });
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "deck-1", ...data, cards: [] })
    );
  });

  it("rejects different printings of the same Oracle card as commander and partner", async () => {
    authed();
    mockGetCardCollection.mockResolvedValueOnce({
      data: [
        { id: "printing-1", oracle_id: "oracle-1" },
        { id: "printing-2", oracle_id: "oracle-1" },
      ],
      not_found: [],
    });

    const response = await POST(createRequest({ name: "Duplicate Oracle pair", commanderId: "printing-1", partnerId: "printing-2" }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects creating a deck with the same commander and partner card", async () => {
    authed();

    const response = await POST(createRequest({ name: "Duplicate pair", commanderId: "card-1", partnerId: "card-1" }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only partner id without creating a deck", async () => {
    authed();

    const response = await POST(createRequest({ name: "Invalid pair", commanderId: "card-1", partnerId: "   " }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only commander id without creating a deck", async () => {
    authed();

    const response = await POST(createRequest({ name: "Blank commander", commanderId: "  " }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates the deck against the session's user id", async () => {
    authed();

    const response = await POST(createRequest({ name: "Atraxa" }));

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Atraxa", userId: OWNER }),
      })
    );
  });

  it("applies the documented defaults", async () => {
    authed();

    await POST(createRequest({ name: "Atraxa" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          format: "commander",
          targetBracket: 3,
          pairingType: "none",
          isAIGenerated: false,
        }),
      })
    );
  });

  it("creates a deck with Father & son pairing", async () => {
    authed();

    const response = await POST(createRequest({ name: "Family", pairingType: "father_son" }));

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pairingType: "father_son" }) })
    );
  });

  /**
   * The name is rendered on the public deck page and in the shared view, so a
   * tag surviving here is stored XSS. It is stripped before the row is written,
   * not on the way out — a sanitiser on the read path only protects the readers
   * that remember to call it.
   */
  it("strips HTML tags from the name before storing it", async () => {
    authed();

    await POST(createRequest({ name: "<script>alert(1)</script>Atraxa" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "alert(1)Atraxa" }),
      })
    );
  });

  it("rejects a name that is nothing but markup", async () => {
    authed();

    const response = await POST(createRequest({ name: "<b></b>" }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects an unknown format instead of storing it", async () => {
    authed();

    const response = await POST(createRequest({ name: "Atraxa", format: "peasant" }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a bracket outside 1-5", async () => {
    authed();

    const response = await POST(createRequest({ name: "Atraxa", targetBracket: 9 }));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 401 and writes nothing when unauthenticated", async () => {
    unauthed();

    const response = await POST(createRequest({ name: "Atraxa" }));

    expect(response.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

/**
 * A guest's deck is saved to the new account in one request: the deck, its
 * command zone and every card. The request carries an `Idempotency-Key`, so a
 * double click, a retry or a reload mid-request returns the deck the first one
 * wrote instead of writing a second.
 */
describe("POST /api/decks with cards and an idempotency key", () => {
  const KEY = "guest-claim-0123456789abcdef";
  const SOL_RING = {
    scryfallId: "4cbc6901-6a4a-4d0a-83ea-7eefa3b35021",
    name: "Sol Ring",
    category: "ramp",
    quantity: 1,
    zone: "main",
  };
  const ATRAXA = {
    scryfallId: "d0d33d52-3d28-4635-b985-51e126289259",
    name: "Atraxa, Praetors' Voice",
    category: "commander",
    isCommander: true,
  };
  const EXISTING = {
    id: "deck-from-first-request",
    name: "Guest Deck",
    cards: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "deck-1", ...data, cards: [] })
    );
  });

  it("writes the deck and all its cards in one create", async () => {
    authed();

    const response = await POST(
      createRequest(
        {
          name: "Guest Deck",
          commanderId: ATRAXA.scryfallId,
          commanderName: ATRAXA.name,
          description: "Counters matter",
          tags: ["counters"],
          manualBracket: 2,
          cards: [ATRAXA, SOL_RING],
        },
        { "Idempotency-Key": KEY }
      )
    );

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: OWNER,
          idempotencyKey: KEY,
          description: "Counters matter",
          tags: ["counters"],
          manualBracket: 2,
          cards: {
            create: [
              expect.objectContaining({ name: ATRAXA.name, isCommander: true }),
              expect.objectContaining({
                name: "Sol Ring",
                category: "ramp",
                zone: "main",
              }),
            ],
          },
        }),
      })
    );
  });

  it("returns the deck an earlier request with the same key wrote, without writing", async () => {
    authed();
    mockFindFirst.mockResolvedValueOnce(EXISTING);

    const response = await POST(
      createRequest(
        { name: "Guest Deck", cards: [SOL_RING] },
        { "Idempotency-Key": KEY }
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: EXISTING.id });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER, idempotencyKey: KEY } })
    );
  });

  it("returns the winner's deck when a concurrent request with the same key wrote first", async () => {
    authed();
    mockFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(EXISTING);
    mockCreate.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint"), { code: "P2002" })
    );

    const response = await POST(
      createRequest(
        { name: "Guest Deck", cards: [SOL_RING] },
        { "Idempotency-Key": KEY }
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: EXISTING.id });
  });

  it("rejects a malformed key without writing", async () => {
    authed();

    const response = await POST(
      createRequest({ name: "Guest Deck" }, { "Idempotency-Key": "short" })
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid card without writing the deck", async () => {
    authed();

    const response = await POST(
      createRequest({
        name: "Guest Deck",
        cards: [{ ...SOL_RING, scryfallId: "not-a-uuid" }],
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects two commander rows without writing the deck", async () => {
    authed();

    const response = await POST(
      createRequest({
        name: "Guest Deck",
        cards: [ATRAXA, { ...SOL_RING, isCommander: true }],
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("still creates an empty deck, with no key, as before", async () => {
    authed();

    const response = await POST(createRequest({ name: "Atraxa" }));

    expect(response.status).toBe(201);
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: null,
          cards: { create: [] },
        }),
      })
    );
  });
});
