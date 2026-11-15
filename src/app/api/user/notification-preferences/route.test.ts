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

import { logger } from "@/lib/logger";
import { GET, PATCH } from "./route";

const DEFAULTS = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
};

function authed() {
  mockAuth.mockResolvedValueOnce({
    user: { id: "user-1", email: "user@example.test" },
  });
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
    await expect(response.json()).resolves.toEqual({
      ...DEFAULTS,
      mentions: false,
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: { mentions: false },
      })
    );
  });

  // B2-13 (server audit §1.2 and §6.9): a database failure used to leave both
  // handlers uncaught and reach the browser as Next's HTML 500 page. Each
  // handler now answers the standard JSON 500 and logs under its own name.
  // The read still writes the defaults for a player with no row; ID-01 pins
  // that last test until B2-13's follow-up decides it.
  describe("when the database fails", () => {
    it("answers 500 with the standard error body and logs the failed read under the route's name", async () => {
      authed();
      const failure = new Error("connection refused");
      mockUpsert.mockRejectedValueOnce(failure);
      const logged = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);

      const response = await GET();

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to load notification preferences",
      });
      expect(logged).toHaveBeenCalledWith(
        failure,
        "GET /api/user/notification-preferences"
      );
    });

    it("answers 500 with the standard error body and logs the failed write under the route's name", async () => {
      authed();
      const failure = new Error("connection refused");
      mockUpsert.mockRejectedValueOnce(failure);
      const logged = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);

      const response = await PATCH(
        new Request("http://localhost:3000/api/user/notification-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ follows: false }),
        })
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to save notification preferences",
      });
      expect(logged).toHaveBeenCalledWith(
        failure,
        "PATCH /api/user/notification-preferences"
      );
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
