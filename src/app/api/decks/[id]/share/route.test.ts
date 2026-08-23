import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { deck: { findUnique: mockFindUnique, update: mockUpdate } },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { DELETE, POST } from "./route";

const OWNER = "user-1";
const INTRUDER = "user-2";

function signedInAs(id: string): void {
  mockAuth.mockResolvedValue({ user: { id, name: "Someone", email: "s@test.com" } });
}

function params(id = "deck-1") {
  return { params: Promise.resolve({ id }) };
}

/**
 * The share-link endpoint.
 *
 * A share token is a capability: whoever holds the URL can read the deck, and
 * `/api/share/[token]` checks `shareEnabled` and never `isPublic` — which is
 * how listing those tokens in the sitemap turned "anyone with this link" into
 * "anyone at all" (#521). So the properties that matter here are who can mint a
 * token, whether minting one twice invalidates the first, and whether revoking
 * really revokes.
 */
describe("POST /api/decks/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockImplementation(({ data }: { data: { shareToken: string } }) =>
      Promise.resolve({ id: "deck-1", ...data })
    );
  });

  it("mints a token for the owner and enables sharing", async () => {
    signedInAs(OWNER);
    mockFindUnique
      .mockResolvedValueOnce({ id: "deck-1", userId: OWNER })
      .mockResolvedValueOnce({ id: "deck-1", userId: OWNER, shareToken: null });

    const response = await POST(new Request("http://localhost:3000"), params());
    const body = (await response.json()) as { shareToken?: string; shareUrl?: string };

    expect(response.status).toBe(200);
    expect(body.shareToken).toMatch(/^[\w-]{12}$/);
    expect(body.shareUrl).toContain(`/share/${body.shareToken}`);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ shareEnabled: true }) })
    );
  });

  /**
   * Re-opening the dialog must not silently break every link already handed
   * out. The existing token is reused rather than regenerated, and nothing in
   * the response would tell the owner if it were not.
   */
  it("reuses an existing token instead of rotating it", async () => {
    signedInAs(OWNER);
    mockFindUnique
      .mockResolvedValueOnce({ id: "deck-1", userId: OWNER })
      .mockResolvedValueOnce({ id: "deck-1", userId: OWNER, shareToken: "already-set1" });

    const response = await POST(new Request("http://localhost:3000"), params());

    await expect(response.json()).resolves.toMatchObject({ shareToken: "already-set1" });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shareToken: "already-set1" }),
      })
    );
  });

  it("refuses another account's deck and mints nothing", async () => {
    signedInAs(INTRUDER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });

    const response = await POST(new Request("http://localhost:3000"), params());
    const body = (await response.json()) as { shareToken?: string };

    expect(response.status).toBe(403);
    expect(body.shareToken).toBeUndefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses an ownerless deck", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: null });

    const response = await POST(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 and mints nothing when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/decks/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ id: "deck-1" });
  });

  /**
   * Clearing `shareToken` as well as the flag is the point: leaving the token
   * behind would let a revoked link start working again the next time sharing
   * was switched on, for whoever still had it.
   */
  it("clears the token, not just the flag", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "deck-1" },
      data: { shareToken: null, shareEnabled: false },
    });
  });

  it("refuses another account's deck and revokes nothing", async () => {
    signedInAs(INTRUDER);
    mockFindUnique.mockResolvedValueOnce({ id: "deck-1", userId: OWNER });

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 for a deck that does not exist", async () => {
    signedInAs(OWNER);
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await DELETE(new Request("http://localhost:3000"), params());

    expect(response.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
