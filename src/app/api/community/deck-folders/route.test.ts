import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockFolderCreate, mockFolderFindMany, mockSavedFindMany } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockFolderCreate: vi.fn(),
  mockFolderFindMany: vi.fn(),
  mockSavedFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    publicDeckFolder: { create: mockFolderCreate, findMany: mockFolderFindMany },
    savedPublicDeck: { findMany: mockSavedFindMany },
  },
}));

import { GET, POST } from "./route";

const postRequest = (name: string) =>
  new Request("http://localhost/api/community/deck-folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

describe("/api/community/deck-folders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockSavedFindMany.mockResolvedValue([]);
  });

  it("creates a trimmed personal folder", async () => {
    mockFolderCreate.mockResolvedValue({ id: "folder-1", name: "Ideas" });

    const response = await POST(postRequest("  Ideas  "));

    expect(response.status).toBe(201);
    expect(mockFolderCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "Ideas" },
      select: { id: true, name: true, createdAt: true },
    });
  });

  it("rejects an empty folder name", async () => {
    expect((await POST(postRequest("   "))).status).toBe(400);
    expect(mockFolderCreate).not.toHaveBeenCalled();
  });

  it("lists only the caller's folders and public saved decks", async () => {
    mockFolderFindMany.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockFolderFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        savedDecks: {
          where: { deck: { isPublic: true } },
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            deck: {
              select: {
                id: true,
                name: true,
                commanderName: true,
                user: { select: { username: true, name: true } },
              },
            },
          },
        },
      },
    });
    expect(mockSavedFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", folderId: null, deck: { isPublic: true } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        deck: {
          select: {
            id: true,
            name: true,
            commanderName: true,
            user: { select: { username: true, name: true } },
          },
        },
      },
    });
  });
});
