import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFindMany, mockCount, mockCreate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findMany: mockFindMany, count: mockCount, create: mockCreate },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { GET, POST } from "./route";

const OWNER = "user-1";

function authed(): void {
  mockAuth.mockResolvedValue({ user: { id: OWNER, name: "Kael", email: "k@test.com" } });
}

function unauthed(): void {
  mockAuth.mockResolvedValue(null);
}

function listRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/decks${query}`);
}

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/decks", {
    method: "POST",
    headers: { "content-type": "application/json" },
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

    const response = await GET(listRequest());

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("reports a query failure as a 500 without leaking the message", async () => {
    authed();
    mockFindMany.mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.0.0.1:5432"));

    const response = await GET(listRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to fetch decks" });
  });
});

describe("POST /api/decks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "deck-1", ...data, cards: [] })
    );
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
