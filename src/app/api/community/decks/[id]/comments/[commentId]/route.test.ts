import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockDeckFindUnique,
  mockCommentFindUnique,
  mockCommentUpdateMany,
  mockCommentDelete,
} = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockCommentFindUnique: vi.fn(),
  mockCommentUpdateMany: vi.fn(),
  mockCommentDelete: vi.fn(),
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
    deckComment: {
      findUnique: mockCommentFindUnique,
      updateMany: mockCommentUpdateMany,
      delete: mockCommentDelete,
    },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { PATCH, DELETE } from "./route";

const PUBLIC_DECK = { id: "deck-1", userId: "owner-1", isPublic: true };

function params() {
  return { params: Promise.resolve({ id: "deck-1", commentId: "c1" }) };
}

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function commentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    deckId: "deck-1",
    userId: "author-1",
    parentId: null,
    body: "Edited",
    createdAt: new Date("2026-08-19T10:00:00Z"),
    updatedAt: new Date("2026-08-19T12:00:00Z"),
    user: { name: "Ana", username: "ana", image: null },
    ...overrides,
  };
}

function patchRequest(body: unknown) {
  return new Request("http://test/api/community/decks/deck-1/comments/c1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/community/decks/[id]/comments/[commentId]", () => {
  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(patchRequest({ body: "Edited" }), params());

    expect(res.status).toBe(401);
  });

  it("lets the author edit their comment", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentUpdateMany.mockResolvedValue({ count: 1 });
    mockCommentFindUnique.mockResolvedValue(commentRow());

    const res = await PATCH(patchRequest({ body: "  Edited  " }), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.body).toBe("Edited");
    expect(mockCommentUpdateMany).toHaveBeenCalledWith({
      where: { id: "c1", deckId: "deck-1", userId: "author-1" },
      data: { body: "Edited" },
    });
  });

  it("404s when the caller is not the author", async () => {
    // updateMany scoped to the author matches nothing — same non-leak as
    // private decks: someone else's comment reads as not found.
    authedAs("stranger-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentUpdateMany.mockResolvedValue({ count: 0 });

    const res = await PATCH(patchRequest({ body: "Edited" }), params());

    expect(res.status).toBe(404);
  });

  it("rejects an empty body with 400", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    const res = await PATCH(patchRequest({ body: " " }), params());

    expect(res.status).toBe(400);
    expect(mockCommentUpdateMany).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/community/decks/[id]/comments/[commentId]", () => {
  it("lets the author delete their comment", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ userId: "author-1", deckId: "deck-1" });
    mockCommentDelete.mockResolvedValue({});

    const res = await DELETE(new Request("http://test"), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.deleted).toBe(true);
  });

  it("lets the deck owner delete anyone's comment", async () => {
    authedAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ userId: "author-1", deckId: "deck-1" });
    mockCommentDelete.mockResolvedValue({});

    const res = await DELETE(new Request("http://test"), params());

    expect(res.status).toBe(200);
  });

  it("403s a stranger", async () => {
    authedAs("stranger-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ userId: "author-1", deckId: "deck-1" });

    const res = await DELETE(new Request("http://test"), params());

    expect(res.status).toBe(403);
    expect(mockCommentDelete).not.toHaveBeenCalled();
  });

  it("404s a comment that belongs to a different deck", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue({ userId: "author-1", deckId: "other-deck" });

    const res = await DELETE(new Request("http://test"), params());

    expect(res.status).toBe(404);
  });

  it("404s a nonexistent comment", async () => {
    authedAs("author-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockCommentFindUnique.mockResolvedValue(null);

    const res = await DELETE(new Request("http://test"), params());

    expect(res.status).toBe(404);
  });
});
