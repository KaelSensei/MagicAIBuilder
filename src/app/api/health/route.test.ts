import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockQueryRaw } = vi.hoisted(() => ({ mockQueryRaw: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { $queryRaw: mockQueryRaw },
}));

// ─── Mock logger ──────────────────────────────────────────────────────────────

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: mockLoggerError },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
    mockLoggerError.mockReset();
  });

  it("returns 200 with an ok status when the database answers", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", db: "ok" });
    expect(typeof body.latencyMs).toBe("number");
  });

  it("returns 503 with a degraded status when the database is unreachable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ status: "degraded", db: "unreachable" });
  });

  it("does not leak the database error message to unauthenticated callers", async () => {
    mockQueryRaw.mockRejectedValue(
      new Error("password authentication failed for user 'postgres'")
    );

    const response = await GET();
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("password");
    expect(JSON.stringify(body)).not.toContain("postgres");
  });

  it("logs the failure so a database outage leaves a trace", async () => {
    const cause = new Error("connection refused");
    mockQueryRaw.mockRejectedValue(cause);

    await GET();

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError.mock.calls[0]).toContain("GET /api/health");
  });

  it("reports latency even when the check fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("timeout"));

    const body = await (await GET()).json();

    expect(typeof body.latencyMs).toBe("number");
  });
});
