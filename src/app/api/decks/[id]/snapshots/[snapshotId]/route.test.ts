// @vitest-environment node
/**
 * Characterization suite for `DELETE /api/decks/[id]/snapshots/[snapshotId]`:
 * the owner deleting one saved version of their deck. It had no test (audit
 * "server" §6 item 4, audit "tests-tooling" §6.1); this pins what it does
 * today.
 *
 * The real `requireDeckOwner` runs against two boundary fakes: the Auth.js
 * session (`auth()` from `lib/auth/config`) and the Prisma client, whose
 * `deck` and `deckSnapshot` calls are recorded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findUnique: vi.fn() },
  deck: { findUnique: vi.fn() },
  deckSnapshot: { findFirst: vi.fn(), delete: vi.fn() },
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));

// The typed factory must return a `PrismaClient`, so the real (never
// connected) client is wrapped and each model this route reads is answered by
// a recorded stub. Any other model is undefined, so a stray query fails.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { prisma } = await importOriginal();
  const models: Readonly<Record<string, unknown>> = {
    user: fake.user,
    deck: fake.deck,
    deckSnapshot: fake.deckSnapshot,
  };
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) =>
        typeof property === "string" ? models[property] : undefined,
    }),
  };
});

import { DELETE } from "./route";

const OWNER_ID = "owner-1";
const STRANGER_ID = "stranger-1";
const DECK_ID = "deck-1";
const SNAPSHOT = { id: "snapshot-1", deckId: DECK_ID, name: "Before the cuts" };

/** Signs this account in, as the session cookie and the user row agree. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId }, expires: "2099-01-01" });
  fake.user.findUnique.mockResolvedValue({ id: userId });
}

/** @returns the route's answer to deleting `snapshotId` from `deckId` */
function deleteSnapshot(
  snapshotId = SNAPSHOT.id,
  deckId = DECK_ID
): Promise<Response> {
  return DELETE(
    new Request(
      `http://localhost/api/decks/${deckId}/snapshots/${snapshotId}`,
      {
        method: "DELETE",
      }
    ),
    { params: Promise.resolve({ id: deckId, snapshotId }) }
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  signInAs(OWNER_ID);
  fake.deck.findUnique.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
  fake.deckSnapshot.findFirst.mockResolvedValue(SNAPSHOT);
  fake.deckSnapshot.delete.mockResolvedValue(SNAPSHOT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DELETE /api/decks/[id]/snapshots/[snapshotId]", () => {
  it("deletes a snapshot of the owner's deck and answers { success: true }", async () => {
    const response = await deleteSnapshot();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fake.deckSnapshot.delete).toHaveBeenCalledWith({
      where: { id: SNAPSHOT.id },
    });
  });

  it("looks the snapshot up within the deck in the path, so another deck's snapshot cannot be reached", async () => {
    await deleteSnapshot();
    expect(fake.deckSnapshot.findFirst).toHaveBeenCalledWith({
      where: { id: SNAPSHOT.id, deckId: DECK_ID },
    });
  });

  it("answers 404 and deletes nothing when the deck has no such snapshot", async () => {
    fake.deckSnapshot.findFirst.mockResolvedValue(null);
    const response = await deleteSnapshot("snapshot-of-another-deck");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Snapshot not found" });
    expect(fake.deckSnapshot.delete).not.toHaveBeenCalled();
  });

  it("refuses a caller with no session with 401", async () => {
    fake.auth.mockResolvedValue(null);
    expect((await deleteSnapshot()).status).toBe(401);
    expect(fake.deckSnapshot.delete).not.toHaveBeenCalled();
  });

  it("currently refuses someone else's deck with 403 (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await deleteSnapshot();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(fake.deckSnapshot.delete).not.toHaveBeenCalled();
  });

  it("answers 404 for a deck that does not exist", async () => {
    fake.deck.findUnique.mockResolvedValue(null);
    const response = await deleteSnapshot(SNAPSHOT.id, "missing-deck");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Deck not found" });
  });

  it("answers 500 with a message when the snapshot cannot be deleted", async () => {
    fake.deckSnapshot.delete.mockRejectedValue(new Error("connection lost"));
    const response = await deleteSnapshot();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to delete snapshot",
    });
  });
});
