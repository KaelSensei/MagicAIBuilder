import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDeckFindUnique, mockCommentFindMany, mockCommentFindUnique, mockCommentCreate } =
  vi.hoisted(() => ({
    mockDeckFindUnique: vi.fn(),
    mockCommentFindMany: vi.fn(),
    mockCommentFindUnique: vi.fn(),
    mockCommentCreate: vi.fn(),
  }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findUnique: mockDeckFindUnique },
    deckComment: {
      findMany: mockCommentFindMany,
      findUnique: mockCommentFindUnique,
      create: mockCommentCreate,
    },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { GET, POST } from "./route";

const PUBLIC_DECK = { id: "deck-1", userId: "owner-1", isPublic: true };
const PRIVATE_DECK = { id: "deck-1", userId: "owner-1", isPublic: false };

function params() {
  return { params: Promise.resolve({ id: "deck-1" }) };
}

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function unauthed() {
  mockAuth.mockResolvedValue(null);
}

function commentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    deckId: "deck-1",
    userId: "author-1",
    parentId: null,
    body: "Nice list!",
    createdAt: new Date("2026-08-19T10:00:00Z"),
    updatedAt: new Date("2026-08-19T10:00:00Z"),
    user: { name: "Ana", username: "ana", image: null },
    ...overrides,
  };
}

function postRequest(body: unknown) {
  return new Request("http://test/api/community/decks/deck-1/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/community/decks/[id]/comments", () => {
  it("returns the threaded stream to an anonymous viewer", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindMany.mockResolvedValue([
      commentRow(),
      commentRow({ id: "c2", parentId: "c1", createdAt: new Date("2026-08-19T11:00:00Z") }),
    ]);

    const res = await GET(new Request("http://test"), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.comments).toHaveLength(1);
    expect(json.comments[0].replies).toHaveLength(1);
  });

  it("badges comments written by the deck owner", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindMany.mockResolvedValue([commentRow({ userId: "owner-1" })]);

    const res = await GET(new Request("http://test"), params());
    const json = await res.json();

    expect(json.comments[0].isDeckOwner).toBe(true);
  });

  it("hides a private deck from strangers as a 404", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    const res = await GET(new Request("http://test"), params());

    expect(res.status).toBe(404);
  });

  it("lets the owner read their private deck's stream", async () => {
    authedAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);
    mockCommentFindMany.mockResolvedValue([]);

    const res = await GET(new Request("http://test"), params());

    expect(res.status).toBe(200);
  });

  it("404s a nonexistent deck", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://test"), params());

    expect(res.status).toBe(404);
  });
});

describe("POST /api/community/decks/[id]/comments", () => {
  it("requires a session", async () => {
    unauthed();

    const res = await POST(postRequest({ body: "hello" }), params());

    expect(res.status).toBe(401);
  });

  it("stores a trimmed top-level comment and returns it as 201", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentCreate.mockResolvedValue(commentRow());

    const res = await POST(postRequest({ body: "  Nice list!  " }), params());

    expect(res.status).toBe(201);
    expect(mockCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deckId: "deck-1", userId: "author-1", parentId: null, body: "Nice list!" },
      })
    );
  });

  it("allows the deck owner to comment on their own deck", async () => {
    authedAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentCreate.mockResolvedValue(commentRow({ userId: "owner-1" }));

    const res = await POST(postRequest({ body: "Thanks!" }), params());

    expect(res.status).toBe(201);
  });

  it("rejects an empty body with 400", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    const res = await POST(postRequest({ body: "   " }), params());

    expect(res.status).toBe(400);
    expect(mockCommentCreate).not.toHaveBeenCalled();
  });

  it("rejects a reply whose parent lives on another deck", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ deckId: "other-deck" });

    const res = await POST(postRequest({ body: "reply", parentId: "px" }), params());

    expect(res.status).toBe(400);
    expect(mockCommentCreate).not.toHaveBeenCalled();
  });

  it("rejects a reply to a nonexistent parent", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue(null);

    const res = await POST(postRequest({ body: "reply", parentId: "gone" }), params());

    expect(res.status).toBe(400);
  });

  it("stores a reply under its parent", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ deckId: "deck-1" });
    mockCommentCreate.mockResolvedValue(commentRow({ id: "c2", parentId: "c1" }));

    const res = await POST(postRequest({ body: "reply", parentId: "c1" }), params());

    expect(res.status).toBe(201);
    expect(mockCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ parentId: "c1" }) })
    );
  });

  it("404s a private deck for a stranger before reading the body", async () => {
    authedAs("stranger-1");
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    const res = await POST(postRequest({ body: "hello" }), params());

    expect(res.status).toBe(404);
  });
});
