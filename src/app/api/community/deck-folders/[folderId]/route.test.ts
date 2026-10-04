import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockFolderDeleteMany, mockFolderUpdateMany, mockSavedUpdateMany } =
  vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockFolderDeleteMany: vi.fn(),
    mockFolderUpdateMany: vi.fn(),
    mockSavedUpdateMany: vi.fn(),
  }));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    publicDeckFolder: {
      deleteMany: mockFolderDeleteMany,
      updateMany: mockFolderUpdateMany,
    },
    savedPublicDeck: { updateMany: mockSavedUpdateMany },
    $transaction: vi.fn((operations: readonly Promise<unknown>[]) => Promise.all(operations)),
  },
}));

import { DELETE, PATCH } from "./route";

const context = { params: Promise.resolve({ folderId: "folder-1" }) };
const renameRequest = (name: string) =>
  new Request("http://localhost/api/community/deck-folders/folder-1", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

describe("/api/community/deck-folders/[folderId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
  });

  it("renames only a folder owned by the caller", async () => {
    mockFolderUpdateMany.mockResolvedValue({ count: 1 });

    const response = await PATCH(renameRequest("  Staples  "), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "folder-1", name: "Staples" });
    expect(mockFolderUpdateMany).toHaveBeenCalledWith({
      where: { id: "folder-1", userId: "user-1" },
      data: { name: "Staples" },
    });
  });

  it("does not reveal a folder owned by another user", async () => {
    mockFolderUpdateMany.mockResolvedValue({ count: 0 });

    expect((await PATCH(renameRequest("Stolen"), context)).status).toBe(404);
  });

  it("keeps saved decks unfiled when their folder is deleted", async () => {
    mockFolderDeleteMany.mockResolvedValue({ count: 1 });
    mockSavedUpdateMany.mockResolvedValue({ count: 2 });

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(mockSavedUpdateMany).toHaveBeenCalledWith({
      where: { folderId: "folder-1", userId: "user-1" },
      data: { folderId: null },
    });
    expect(mockFolderDeleteMany).toHaveBeenCalledWith({
      where: { id: "folder-1", userId: "user-1" },
    });
  });
});
