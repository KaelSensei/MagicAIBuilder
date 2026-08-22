import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpsert, mockDeleteMany, mockFindMany, mockLogError } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockFindMany: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    metaSnapshot: {
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
      findMany: mockFindMany,
    },
  },
}));

vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import {
  readSnapshotHistory,
  recordEdhrecSnapshot,
  SNAPSHOT_RETENTION_DAYS,
} from "./snapshots";

const NOW = new Date("2026-08-22T18:30:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsert.mockResolvedValue({});
  mockDeleteMany.mockResolvedValue({ count: 0 });
  mockFindMany.mockResolvedValue([]);
});

describe("recordEdhrecSnapshot", () => {
  it("keys the row on the UTC day, not the moment", async () => {
    await recordEdhrecSnapshot("atraxa", { cards: [{ name: "Sol Ring", inclusion: 0.9 }] }, NOW);

    const arg = mockUpsert.mock.calls[0][0];
    expect(arg.where.commanderSlug_capturedOn.capturedOn.toISOString()).toBe(
      "2026-08-22T00:00:00.000Z"
    );
    expect(arg.create.data).toEqual({ cards: [{ name: "Sol Ring", inclusion: 0.9 }] });
  });

  it("overwrites the same day rather than adding a second point", async () => {
    await recordEdhrecSnapshot("atraxa", { cards: [{ name: "Sol Ring", inclusion: 0.9 }] }, NOW);
    expect(mockUpsert.mock.calls[0][0].update).toEqual({
      data: { cards: [{ name: "Sol Ring", inclusion: 0.9 }] },
    });
  });

  it("does not record an empty distribution", async () => {
    // An EDHRec 404 and a commander EDHRec has never heard of both arrive as
    // `{ cards: [] }`. Storing it would report every card in yesterday's
    // snapshot as having left the list.
    await recordEdhrecSnapshot("atraxa", { cards: [] }, NOW);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("drops snapshots past the retention horizon for that commander only", async () => {
    await recordEdhrecSnapshot("atraxa", { cards: [{ name: "Sol Ring", inclusion: 0.9 }] }, NOW);

    const where = mockDeleteMany.mock.calls[0][0].where;
    expect(where.commanderSlug).toBe("atraxa");
    const horizon = new Date(NOW.getTime() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    expect(where.capturedOn.lt.toISOString()).toBe(horizon.toISOString());
  });

  it("swallows a write failure — the panel's response must not depend on it", async () => {
    mockUpsert.mockRejectedValue(new Error("connection refused"));
    await expect(
      recordEdhrecSnapshot("atraxa", { cards: [{ name: "Sol Ring", inclusion: 0.9 }] }, NOW)
    ).resolves.toBeUndefined();
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe("readSnapshotHistory", () => {
  it("asks for the window in whole UTC days, oldest first", async () => {
    await readSnapshotHistory("atraxa", 30, NOW);

    const arg = mockFindMany.mock.calls[0][0];
    expect(arg.where.commanderSlug).toBe("atraxa");
    expect(arg.where.capturedOn.gte.toISOString()).toBe("2026-07-23T00:00:00.000Z");
    expect(arg.orderBy).toEqual({ capturedOn: "asc" });
  });

  it("returns the validated snapshots", async () => {
    mockFindMany.mockResolvedValue([
      {
        capturedOn: new Date("2026-08-01T00:00:00.000Z"),
        data: { cards: [{ name: "Sol Ring", inclusion: 0.7 }] },
      },
    ]);

    await expect(readSnapshotHistory("atraxa", 30, NOW)).resolves.toEqual([
      {
        capturedOn: new Date("2026-08-01T00:00:00.000Z"),
        cards: [{ name: "Sol Ring", inclusion: 0.7 }],
      },
    ]);
  });

  it("skips a row whose payload no longer validates, keeping the rest", async () => {
    mockFindMany.mockResolvedValue([
      { capturedOn: new Date("2026-08-01T00:00:00.000Z"), data: { cards: "not an array" } },
      {
        capturedOn: new Date("2026-08-22T00:00:00.000Z"),
        data: { cards: [{ name: "Sol Ring", inclusion: 0.7 }] },
      },
    ]);

    const snapshots = await readSnapshotHistory("atraxa", 30, NOW);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].capturedOn.toISOString()).toBe("2026-08-22T00:00:00.000Z");
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
