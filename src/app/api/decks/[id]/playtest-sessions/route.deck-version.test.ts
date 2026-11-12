import { beforeEach, describe, expect, it, vi } from "vitest";

import { deckCard, FAKE_DECK, playtestDb } from "@/test/playtest-db-fake";

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { playtestDb: db } = await import("@/test/playtest-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

vi.mock("@/lib/auth/config", () => ({
  auth: async () => ({ user: { id: FAKE_DECK.userId } }),
}));

import { GET, POST } from "./route";
import { POST as saveSnapshot } from "@/app/api/decks/[id]/snapshots/route";

const VERSION_ONE = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Sol Ring"),
  deckCard("Forest", { quantity: 10 }),
];

/** The same deck with one card swapped, as an edit in the builder saves it. */
const VERSION_TWO = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Arcane Signet"),
  deckCard("Forest", { quantity: 10 }),
];

function params() {
  return { params: Promise.resolve({ id: FAKE_DECK.id }) };
}

/**
 * Records one run the way the playtest's result bar does: no snapshot id.
 *
 * @param result - How the run ended.
 * @param extra - Further body fields, such as an older client's snapshot id.
 * @returns The route response.
 */
function recordRun(
  result: "win" | "loss" | "draw",
  extra: Record<string, unknown> = {}
) {
  return POST(
    new Request(
      `http://localhost/api/decks/${FAKE_DECK.id}/playtest-sessions`,
      {
        method: "POST",
        body: JSON.stringify({ result, turns: 8, mulliganCount: 0, ...extra }),
      }
    ),
    params()
  );
}

beforeEach(() => {
  playtestDb.reset(VERSION_ONE);
});

describe("POST /api/decks/[id]/playtest-sessions — deck versions", () => {
  it("files repeated runs on an unchanged deck under one snapshot the comparison can select", async () => {
    await recordRun("win");
    await recordRun("loss");
    playtestDb.saveCards(VERSION_TWO);
    await recordRun("win");

    const [first, second, third] = playtestDb.sessions();
    expect(first.snapshotId).toEqual(expect.any(String));
    expect(second.snapshotId).toBe(first.snapshotId);
    expect(third.snapshotId).not.toBe(first.snapshotId);
    expect(playtestDb.snapshots()).toHaveLength(2);

    const comparison = await GET(
      new Request(
        `http://localhost/api/decks/${FAKE_DECK.id}/playtest-sessions?beforeSnapshotId=${first.snapshotId}&afterSnapshotId=${third.snapshotId}`
      ),
      params()
    );
    expect((await comparison.json()).comparison).toEqual(
      expect.objectContaining({
        beforeSessions: 2,
        afterSessions: 1,
        hasComparableData: true,
      })
    );
  });

  it("files a run on a reverted deck under the earlier version's snapshot", async () => {
    await recordRun("win");
    playtestDb.saveCards(VERSION_TWO);
    await recordRun("loss");
    playtestDb.saveCards(VERSION_ONE);
    await recordRun("win");

    const [first, , reverted] = playtestDb.sessions();
    expect(reverted.snapshotId).toBe(first.snapshotId);
    expect(playtestDb.snapshots()).toHaveLength(2);
  });

  it("reuses a snapshot the player saved by hand when it holds the deck as played", async () => {
    const saved = await saveSnapshot(
      new Request(`http://localhost/api/decks/${FAKE_DECK.id}/snapshots`, {
        method: "POST",
        body: JSON.stringify({ name: "Before the cuts" }),
      }),
      params()
    );
    const { id } = await saved.json();

    expect((await recordRun("win")).status).toBe(201);
    expect(playtestDb.sessions()[0].snapshotId).toBe(id);
    expect(playtestDb.snapshots()).toHaveLength(1);
  });

  it("names the snapshot it creates so the deck's history says where it came from", async () => {
    await recordRun("win");

    expect(playtestDb.snapshots()).toEqual([
      expect.objectContaining({
        name: expect.stringMatching(
          /^Playtest · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/
        ),
        commander: "Atraxa, Praetors' Voice",
        cardCount: VERSION_ONE.length,
        cardList: VERSION_ONE,
      }),
    ]);
  });

  it("still files a run under the snapshot id an older client sends", async () => {
    await recordRun("win");
    const [{ id }] = playtestDb.snapshots();
    playtestDb.saveCards(VERSION_TWO);

    expect((await recordRun("loss", { snapshotId: id })).status).toBe(201);
    expect(playtestDb.sessions()[1].snapshotId).toBe(id);
    expect(playtestDb.snapshots()).toHaveLength(1);
  });
});
