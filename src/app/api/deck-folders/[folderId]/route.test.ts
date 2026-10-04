import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  findFirst: vi.fn(),
  moveDecks: vi.fn(),
  deleteFolder: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deckFolder: { updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}));

import { DELETE, PATCH } from "./route";

const context = { params: Promise.resolve({ folderId: "folder-1" }) };

describe("/api/deck-folders/:folderId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("renames only a folder owned by the caller", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    const request = new Request("http://localhost/api/deck-folders/folder-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "  Competitive  " }),
    });
    expect((await PATCH(request, context)).status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "folder-1", userId: "user-1" },
      data: { name: "Competitive" },
    });
  });

  it("unfiles owned decks before deleting an owned folder", async () => {
    mocks.transaction.mockImplementation(async (operation) =>
      operation({
        deckFolder: {
          findFirst: mocks.findFirst,
          delete: mocks.deleteFolder,
        },
        deck: { updateMany: mocks.moveDecks },
      })
    );
    mocks.findFirst.mockResolvedValue({ id: "folder-1" });
    const response = await DELETE(
      new Request("http://localhost/api/deck-folders/folder-1", {
        method: "DELETE",
      }),
      context
    );
    expect(response.status).toBe(204);
    expect(mocks.moveDecks).toHaveBeenCalledWith({
      where: { folderId: "folder-1", userId: "user-1" },
      data: { folderId: null },
    });
    expect(mocks.deleteFolder).toHaveBeenCalledWith({
      where: { id: "folder-1" },
    });
  });
});
