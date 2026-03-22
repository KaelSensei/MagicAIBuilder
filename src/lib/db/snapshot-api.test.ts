import { describe, it, expect, vi, afterEach } from "vitest";
import {
  listSnapshots,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
} from "./snapshot-api";

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      json: async () => data,
    })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listSnapshots", () => {
  it("returns list of snapshots", async () => {
    const snapshots = [{ id: "snap-1", name: "Snapshot 1", commander: "Atraxa", cardCount: 99, createdAt: "2026-01-01" }];
    mockFetch(snapshots);
    const result = await listSnapshots("deck-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("snap-1");
  });

  it("calls the correct URL", async () => {
    mockFetch([]);
    await listSnapshots("deck-abc");
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock).toHaveBeenCalledWith("/api/decks/deck-abc/snapshots");
  });

  it("throws when response is not ok", async () => {
    mockFetch(null, false, 500);
    await expect(listSnapshots("deck-1")).rejects.toThrow("Failed to fetch snapshots");
  });
});

describe("createSnapshot", () => {
  it("returns snapshot data on success", async () => {
    const snap = { id: "snap-2", name: "Pre-update", commander: null, cardCount: 50, createdAt: "2026-01-01", cardList: [] };
    mockFetch(snap);
    const result = await createSnapshot("deck-1", "Pre-update");
    expect(result.id).toBe("snap-2");
    expect(result.name).toBe("Pre-update");
  });

  it("sends POST with name in body", async () => {
    mockFetch({ id: "snap-3", name: "test", cardList: [] });
    await createSnapshot("deck-1", "test");
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock).toHaveBeenCalledWith("/api/decks/deck-1/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });
  });

  it("throws with error message from body when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ error: "Name too long" }),
      })
    );
    await expect(createSnapshot("deck-1", "bad")).rejects.toThrow("Name too long");
  });

  it("throws generic message when error body has no error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
    );
    await expect(createSnapshot("deck-1", "bad")).rejects.toThrow("Failed to create snapshot");
  });
});

describe("deleteSnapshot", () => {
  it("calls DELETE on the correct URL", async () => {
    mockFetch(null, true);
    await deleteSnapshot("deck-1", "snap-1");
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock).toHaveBeenCalledWith("/api/decks/deck-1/snapshots/snap-1", { method: "DELETE" });
  });

  it("throws when response is not ok", async () => {
    mockFetch(null, false, 404);
    await expect(deleteSnapshot("deck-1", "snap-1")).rejects.toThrow("Failed to delete snapshot");
  });

  it("resolves to undefined on success", async () => {
    mockFetch(null, true);
    const result = await deleteSnapshot("deck-1", "snap-1");
    expect(result).toBeUndefined();
  });
});

describe("restoreSnapshot", () => {
  it("calls POST on the restore endpoint", async () => {
    mockFetch({ success: true });
    await restoreSnapshot("deck-1", "snap-1");
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/decks/deck-1/snapshots/snap-1/restore",
      { method: "POST" }
    );
  });

  it("returns response data", async () => {
    const data = { restored: true, cardCount: 99 };
    mockFetch(data);
    const result = await restoreSnapshot("deck-1", "snap-1");
    expect(result).toEqual(data);
  });

  it("throws when response is not ok", async () => {
    mockFetch(null, false, 500);
    await expect(restoreSnapshot("deck-1", "snap-1")).rejects.toThrow("Failed to restore snapshot");
  });
});
