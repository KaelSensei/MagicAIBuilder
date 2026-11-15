import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpsert, mockUserFindUnique } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: mockUserFindUnique },
    notificationPreference: { upsert: mockUpsert },
  });
});

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

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

  // Characterization (master plan ID-01, server audit §1.2 and §6.9): neither
  // handler catches a database failure, so the error leaves the route instead
  // of becoming a logged 500. B2-13 flips both of these.
  describe("when the database fails", () => {
    it("currently lets a failed read escape the GET handler instead of answering 500 (pinned; see B2-13)", async () => {
      authed();
      mockUpsert.mockRejectedValueOnce(new Error("connection refused"));

      await expect(GET()).rejects.toThrow("connection refused");
    });

    it("currently lets a failed write escape the PATCH handler instead of answering 500 (pinned; see B2-13)", async () => {
      authed();
      mockUpsert.mockRejectedValueOnce(new Error("connection refused"));

      await expect(
        PATCH(
          new Request(
            "http://localhost:3000/api/user/notification-preferences",
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ follows: false }),
            }
          )
        )
      ).rejects.toThrow("connection refused");
    });

    it("currently writes on a read: GET upserts the defaults for a player who has no row yet (pinned; see B2-13)", async () => {
      authed();
      mockUpsert.mockResolvedValueOnce(DEFAULTS);

      await GET();

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert.mock.calls[0][0]).toMatchObject({
        update: {},
        create: { userId: "user-1", ...DEFAULTS },
      });
    });
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
