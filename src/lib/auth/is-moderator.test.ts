import { afterEach, describe, expect, it, vi } from "vitest";

const { mockUserFindUnique } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: mockUserFindUnique },
  });
});

import { isModerator } from "./is-moderator";

describe("isModerator", () => {
  afterEach(() => mockUserFindUnique.mockReset());

  it("grants a user whose moderator flag is set", async () => {
    mockUserFindUnique.mockResolvedValue({ isModerator: true });

    await expect(isModerator("moderator-1")).resolves.toBe(true);

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "moderator-1" },
      select: { isModerator: true },
    });
  });

  it("refuses a user whose moderator flag is off", async () => {
    mockUserFindUnique.mockResolvedValue({ isModerator: false });

    await expect(isModerator("user-1")).resolves.toBe(false);
  });

  it("refuses an id that names no user", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(isModerator("deleted-1")).resolves.toBe(false);
  });

  it("refuses a signed-out visitor without reading the database", async () => {
    await expect(isModerator(null)).resolves.toBe(false);

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("refuses a session that carries an empty id without reading the database", async () => {
    await expect(isModerator("")).resolves.toBe(false);

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });
});
