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
import { logger } from "@/lib/logger";

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

describe("GET /api/user/init request timing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionFindMany.mockResolvedValue([]);
  });

  it.each([
    ["an existing user", () => { authed(); mockUserFindUnique.mockResolvedValueOnce({ onboardingDone: false }); }, 200],
    ["a missing user", () => { authed(); mockUserFindUnique.mockResolvedValueOnce(null); }, 404],
    ["a signed-out visitor", () => { mockRequireAuth.mockResolvedValueOnce({ error: new Response(null, { status: 401 }) }); }, 401],
    ["a database failure", () => { authed(); mockUserFindUnique.mockRejectedValueOnce(new Error("db down")); }, 500],
  ])("logs status and duration once for %s", async (_label, arrange, expected) => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    arrange();

    const response = await GET();

    expect(response.status).toBe(expected);
    const calls = info.mock.calls.filter(([message]) => message === "User init request completed");
    expect(calls).toEqual([
      ["User init request completed", "GET /api/user/init", { status: expected, durationMs: expect.any(Number) }],
    ]);
    vi.restoreAllMocks();
  });
});
