import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockReadHistory, mockCheckRateLimit } = vi.hoisted(() => ({
  mockReadHistory: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/meta/snapshots", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meta/snapshots")>(
    "@/lib/meta/snapshots"
  );
  return { ...actual, readSnapshotHistory: mockReadHistory };
});

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: () => "127.0.0.1",
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { GET } from "./route";

function params(slug = "atraxa-praetors-voice") {
  return { params: Promise.resolve({ commanderSlug: slug }) };
}

function request(query = "") {
  return new Request(`http://localhost/api/meta/atraxa-praetors-voice/history${query}`);
}

function snapshot(day: string, cards: Record<string, number>) {
  return {
    capturedOn: new Date(`${day}T00:00:00.000Z`),
    cards: Object.entries(cards).map(([name, inclusion]) => ({ name, inclusion })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockReadHistory.mockResolvedValue([]);
});

describe("GET /api/meta/:commanderSlug/history", () => {
  it("rejects a slug that is not a slug", async () => {
    const res = await GET(request(), params("../../etc/passwd"));
    expect(res.status).toBe(400);
  });

  it("defaults the window to 90 days", async () => {
    await GET(request(), params());
    expect(mockReadHistory).toHaveBeenCalledWith("atraxa-praetors-voice", 90);
  });

  it("honours an explicit window", async () => {
    await GET(request("?days=30"), params());
    expect(mockReadHistory).toHaveBeenCalledWith("atraxa-praetors-voice", 30);
  });

  it("rejects a window beyond the retention horizon", async () => {
    const res = await GET(request("?days=400"), params());
    expect(res.status).toBe(400);
    expect(mockReadHistory).not.toHaveBeenCalled();
  });

  it("answers 200 with a null report when there is no history yet", async () => {
    const res = await GET(request(), params());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      report: null,
      snapshotCount: 0,
      windowDays: 90,
    });
  });

  it("distinguishes recorded-once from never-recorded through the count", async () => {
    mockReadHistory.mockResolvedValue([snapshot("2026-08-22", { "Sol Ring": 0.9 })]);
    const body = await (await GET(request(), params())).json();
    expect(body.report).toBeNull();
    expect(body.snapshotCount).toBe(1);
  });

  it("returns the shifts once two days exist", async () => {
    mockReadHistory.mockResolvedValue([
      snapshot("2026-07-25", { "Sol Ring": 0.7 }),
      snapshot("2026-08-22", { "Sol Ring": 0.85 }),
    ]);

    const body = await (await GET(request(), params())).json();
    expect(body.snapshotCount).toBe(2);
    expect(body.report.spanDays).toBe(28);
    expect(body.report.shifts).toEqual([
      { kind: "rose", name: "Sol Ring", baseline: 0.7, current: 0.85, delta: 0.85 - 0.7 },
    ]);
  });

  it("rate limits", async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5_000 });
    const res = await GET(request(), params());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5");
  });

  it("returns 500 without leaking the database error", async () => {
    mockReadHistory.mockRejectedValue(new Error("relation MetaSnapshot does not exist"));
    const res = await GET(request(), params());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Meta history read failed" });
  });
});
