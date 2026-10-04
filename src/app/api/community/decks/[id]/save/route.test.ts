import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAuth,
  mockDeckFindUnique,
  mockFolderFindFirst,
  mockSavedDeleteMany,
  mockSavedUpsert,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockDeckFindUnique: vi.fn(),
  mockFolderFindFirst: vi.fn(),
  mockSavedDeleteMany: vi.fn(),
  mockSavedUpsert: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findUnique: mockDeckFindUnique },
    publicDeckFolder: { findFirst: mockFolderFindFirst },
    savedPublicDeck: { deleteMany: mockSavedDeleteMany, upsert: mockSavedUpsert },
  },
}));

import { DELETE, POST } from "./route";

const params = { params: Promise.resolve({ id: "deck-1" }) };
const postRequest = (folderId: string | null) =>
  new Request("http://localhost/api/community/decks/deck-1/save", {
    method: "POST",
    body: JSON.stringify({ folderId }),
  });

describe("/api/community/decks/[id]/save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockDeckFindUnique.mockResolvedValue({ id: "deck-1", isPublic: true, userId: "owner-1" });
    mockFolderFindFirst.mockResolvedValue({ id: "folder-1" });
    mockSavedUpsert.mockResolvedValue({ id: "saved-1" });
  });

  it("saves a public deck into a folder owned by the caller", async () => {
    const response = await POST(postRequest("folder-1"), params);

    expect(response.status).toBe(201);
    expect(mockFolderFindFirst).toHaveBeenCalledWith({
      where: { id: "folder-1", userId: "user-1" },
      select: { id: true },
    });
    expect(mockSavedUpsert).toHaveBeenCalledWith({
      where: { userId_deckId: { userId: "user-1", deckId: "deck-1" } },
      update: { folderId: "folder-1" },
      create: { userId: "user-1", deckId: "deck-1", folderId: "folder-1" },
    });
  });

  it("does not expose or save a private deck", async () => {
    mockDeckFindUnique.mockResolvedValue({ id: "deck-1", isPublic: false, userId: "owner-1" });

    expect((await POST(postRequest("folder-1"), params)).status).toBe(404);
    expect(mockSavedUpsert).not.toHaveBeenCalled();
  });

  it("rejects a folder not owned by the caller", async () => {
    mockFolderFindFirst.mockResolvedValue(null);

    expect((await POST(postRequest("other-folder"), params)).status).toBe(404);
    expect(mockSavedUpsert).not.toHaveBeenCalled();
  });

  it("removes only the caller's saved relationship", async () => {
    mockSavedDeleteMany.mockResolvedValue({ count: 1 });

    const response = await DELETE(new Request("http://localhost"), params);

    expect(response.status).toBe(200);
    expect(mockSavedDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", deckId: "deck-1" },
    });
  });
});
