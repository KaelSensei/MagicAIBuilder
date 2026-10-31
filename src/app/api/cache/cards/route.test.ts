import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockFindUnique, mockDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { cardCache: { findUnique: mockFindUnique, delete: mockDelete, upsert: vi.fn() } },
}));
vi.mock("@/lib/auth/helpers", () => ({ requireAuth: vi.fn() }));

import { GET } from "./route";
import { logger } from "@/lib/logger";

const CARD_ID = "0000579f-7b35-4ed3-b44c-db2a538066fe";

function lookup(id: string | null = CARD_ID): Request {
  const query = id === null ? "" : `?id=${id}`;
  return new Request(`http://localhost/api/cache/cards${query}`);
}

function timingCalls(info: ReturnType<typeof vi.spyOn>) {
  return info.mock.calls.filter(([message]) => message === "Card cache lookup completed");
}

describe("GET /api/cache/cards request timing", () => {
  let info: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records a fresh hit", async () => {
    mockFindUnique.mockResolvedValueOnce({ data: { name: "Sol Ring" }, cachedAt: new Date() });

    const body: unknown = await (await GET(lookup())).json();

    expect(body).toEqual({ hit: true, data: { name: "Sol Ring" } });
    expect(timingCalls(info)).toEqual([
      ["Card cache lookup completed", "GET /api/cache/cards", { hit: true, failed: false, durationMs: expect.any(Number) }],
    ]);
  });

  it("records a miss for an unknown card", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    await GET(lookup());

    expect(timingCalls(info)).toEqual([
      ["Card cache lookup completed", "GET /api/cache/cards", { hit: false, failed: false, durationMs: expect.any(Number) }],
    ]);
  });

  it("records a stale entry as a miss and deletes it", async () => {
    mockFindUnique.mockResolvedValueOnce({ data: {}, cachedAt: new Date(0) });
    mockDelete.mockResolvedValueOnce({});

    const body: unknown = await (await GET(lookup())).json();

    expect(body).toEqual({ hit: false });
    expect(mockDelete).toHaveBeenCalledWith({ where: { scryfallId: CARD_ID } });
    expect(timingCalls(info)[0]?.[2]).toEqual({ hit: false, failed: false, durationMs: expect.any(Number) });
  });

  it("records an invalid id without querying the database", async () => {
    await GET(lookup("not-a-uuid"));

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(timingCalls(info)).toHaveLength(1);
  });

  it("records a database failure as failed and still answers a miss", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("db down"));

    const body: unknown = await (await GET(lookup())).json();

    expect(body).toEqual({ hit: false });
    expect(timingCalls(info)[0]?.[2]).toEqual({ hit: false, failed: true, durationMs: expect.any(Number) });
  });
});
