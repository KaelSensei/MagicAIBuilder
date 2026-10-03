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

describe("PATCH /api/decks/folders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("deduplicates ids and moves only decks owned by the caller", async () => {
    mocks.findFirst.mockResolvedValue({ id: "folder-1" });
    mocks.updateMany.mockResolvedValue({ count: 2 });
    const request = new Request("http://localhost/api/decks/folders", {
      method: "PATCH",
      body: JSON.stringify({
        deckIds: ["deck-1", "deck-1", "deck-2"],
        folderId: "folder-1",
      }),
    });
    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["deck-1", "deck-2"] }, userId: "user-1" },
      data: { folderId: "folder-1" },
    });
  });

  it("rejects a destination folder owned by another user", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const request = new Request("http://localhost/api/decks/folders", {
      method: "PATCH",
      body: JSON.stringify({ deckIds: ["deck-1"], folderId: "other-folder" }),
    });
    expect((await PATCH(request)).status).toBe(404);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
