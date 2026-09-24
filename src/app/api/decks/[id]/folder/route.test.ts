import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deckFolder: { findFirst: mocks.findFirst },
    deck: { updateMany: mocks.updateMany },
  },
}));

import { PATCH } from "./route";

const context = { params: Promise.resolve({ id: "deck-1" }) };
const request = (folderId: string | null) =>
  new Request("http://localhost/api/decks/deck-1/folder", {
    method: "PATCH",
    body: JSON.stringify({ folderId }),
  });

describe("PATCH /api/decks/:id/folder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("rejects a destination folder not owned by the caller", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await PATCH(request("other-folder"), context);
    expect(response.status).toBe(404);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("moves only a deck owned by the caller", async () => {
    mocks.findFirst.mockResolvedValue({ id: "folder-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    const response = await PATCH(request("folder-1"), context);
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "deck-1", userId: "user-1" },
      data: { folderId: "folder-1" },
    });
  });
});
