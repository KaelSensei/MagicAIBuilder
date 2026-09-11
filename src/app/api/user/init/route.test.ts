import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserFindUnique, mockCollectionFindMany } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockCollectionFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    collectionCard: { findMany: mockCollectionFindMany },
  },
}));

const { mockRequireAuth } = vi.hoisted(() => ({ mockRequireAuth: vi.fn() }));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));

import { GET } from "./route";

function authed() {
  mockRequireAuth.mockResolvedValueOnce({ session: { user: { id: "user-1" } } });
}

describe("GET /api/user/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionFindMany.mockResolvedValue([]);
  });

  it("returns the bootstrap payload for an existing user", async () => {
    authed();
    mockUserFindUnique.mockResolvedValueOnce({ onboardingDone: true });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      onboardingDone: true,
      collection: [],
    });
  });

  it("returns 404 instead of fabricating onboarding state for a missing user", async () => {
    mockRequireAuth.mockResolvedValueOnce({ session: { user: { id: "deleted-user" } } });
    mockUserFindUnique.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });
});
