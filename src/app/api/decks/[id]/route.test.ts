import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpdate, mockDelete, mockUserFindUnique, mockUserUpsert } =
  vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockUserUpsert: vi.fn(),
  }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findUnique: mockFindUnique, update: mockUpdate, delete: mockDelete },
    user: { findUnique: mockUserFindUnique, upsert: mockUserUpsert },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { DELETE, GET, PATCH } from "./route";

const OWNER = "user-1";
const INTRUDER = "user-2";

/**
 * `requireAuth` resolves the session id against the database on every call -
 * it does not trust the JWT's id outright, because that id rides in a signed
 * cookie and outlives the row it points at. So `prisma.user.findUnique` is on
 * the path of every authenticated request here, and a mock that stubs only
 * `prisma.deck` makes each one throw before it reaches the route.
 */
function signedInAs(id: string): void {
  mockAuth.mockResolvedValue({ user: { id, name: "Someone", email: "s@test.com" } });
  mockUserFindUnique.mockResolvedValue({
    id,
    name: "Someone",
    email: "s@test.com",
    image: null,
  });
}

function params(id = "deck-1") {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/decks/deck-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * The ownership boundary on a single deck.
 *
 * All three verbs guard it the same way and none of them had a test. What is
 * asserted here is not only the status code: a 403 that still ran the update is
 * a 403 the caller cannot distinguish from a real one, so every rejection also
 * asserts that nothing was written.
 *
 * `Deck.userId` is nullable while a session id never is, which is the shape
 * that produced a latent bug in #522 — an ownerless row read as owned by the
 * viewer. The only creation path sets `userId`, so no such row exists today;
 * it is asserted anyway, because the schema permits one.
 */
describe("GET /api/decks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the deck to its owner", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER, cards: [] });

    const response = await GET(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "deck-1" });
  });

  it("refuses another account's deck", async () => {
    signedInAs(INTRUDER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER, cards: [] });

    const response = await GET(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
  });

  it("refuses an ownerless deck rather than treating it as the viewer's", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: null, cards: [] });

    const response = await GET(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
  });

  it("returns 404 for a deck that does not exist", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(404);
  });

  it("returns 401 and reads nothing when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/decks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates only the fields the body carries", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });
    mockUpdate.mockResolvedValueOnce({ id: "deck-1", name: "Renamed", cards: [] });

    const response = await PATCH(patchRequest({ name: "Renamed" }), params());

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "deck-1" }, data: { name: "Renamed" } })
    );
  });

  /**
   * `userId` is not in the patchable key list. If it ever became patchable, a
   * deck could be handed to another account through an ordinary rename request.
   */
  it("never lets the body reassign ownership", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });
    mockUpdate.mockResolvedValueOnce({ id: "deck-1", cards: [] });

    await PATCH(patchRequest({ name: "Renamed", userId: INTRUDER }), params());

    const data = mockUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).not.toHaveProperty("userId");
  });

  it("refuses another account's deck and writes nothing", async () => {
    signedInAs(INTRUDER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });

    const response = await PATCH(patchRequest({ name: "Stolen" }), params());

    expect(response.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid body before it looks the deck up", async () => {
    signedInAs(OWNER);

    const response = await PATCH(patchRequest({ targetBracket: 99 }), params());

    expect(response.status).toBe(400);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 for a deck that does not exist", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await PATCH(patchRequest({ name: "Renamed" }), params());

    expect(response.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/decks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the owner's deck", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });
    mockDelete.mockResolvedValueOnce({ id: "deck-1" });

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "deck-1" } });
  });

  it("refuses another account's deck and deletes nothing", async () => {
    signedInAs(INTRUDER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("refuses an ownerless deck and deletes nothing", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: null });

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 401 and deletes nothing when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
