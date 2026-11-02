import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpsert, mockUserFindUnique } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    notificationPreference: { upsert: mockUpsert },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { GET, PATCH } from "./route";

const DEFAULTS = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
};

function authed() {
  mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "user@example.test" } });
  mockUserFindUnique.mockResolvedValueOnce({
    id: "user-1",
    name: null,
    email: "user@example.test",
    image: null,
    createdAt: new Date("2026-01-01"),
    onboardingDone: true,
  });
}

describe("notification preferences API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the authenticated user's event preferences", async () => {
    authed();
    mockUpsert.mockResolvedValueOnce(DEFAULTS);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(DEFAULTS);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({ userId: "user-1", ...DEFAULTS }),
      })
    );
  });

  it("updates only the supplied event preference", async () => {
    authed();
    mockUpsert.mockResolvedValueOnce({ ...DEFAULTS, mentions: false });

    const response = await PATCH(
      new Request("http://localhost:3000/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentions: false }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ...DEFAULTS, mentions: false });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: { mentions: false },
      })
    );
  });

  it("rejects an empty preference update", async () => {
    authed();

    const response = await PATCH(
      new Request("http://localhost:3000/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
