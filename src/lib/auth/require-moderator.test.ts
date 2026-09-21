import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockUserFindUnique } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: mockUserFindUnique } },
}));

import { requireModerator } from "./require-moderator";

describe("requireModerator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes through the authentication error", async () => {
    const response = new Response(null, { status: 401 });
    mockRequireAuth.mockResolvedValue({ error: response });

    const result = await requireModerator();

    expect(result.error).toBe(response);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("forbids an authenticated user without moderation access", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockUserFindUnique.mockResolvedValue({ isModerator: false });

    const result = await requireModerator();

    expect(result.error?.status).toBe(403);
  });

  it("returns the moderator id when access is granted", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "moderator-1" } } });
    mockUserFindUnique.mockResolvedValue({ isModerator: true });

    const result = await requireModerator();

    expect(result).toEqual({ moderatorId: "moderator-1" });
  });
});
