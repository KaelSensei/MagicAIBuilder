import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

const { mockFindUnique, mockDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    scryfallSearchCache: {
      findUnique: mockFindUnique,
      delete: mockDelete,
    },
  },
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: vi.fn() }));

import { GET } from "./route";

describe("GET /api/cache/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it("records cache misses without logging the search query", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);

    const response = await GET(
      new Request("http://localhost/api/cache/search?query=private+deck+idea")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hit: false });
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: false, failed: false, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private deck idea");
  });

  it("records cache hits without logging the cached data", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    mockFindUnique.mockResolvedValue({
      cachedAt: new Date(),
      data: { secretCard: "Private Pick" },
    });

    const response = await GET(
      new Request("http://localhost/api/cache/search?query=private+deck+idea")
    );

    expect(await response.json()).toEqual({
      hit: true,
      data: { secretCard: "Private Pick" },
    });
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: true, failed: false, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("Private Pick");
  });

  it("records database failures as failed lookups while preserving the cache miss response", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    mockFindUnique.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(
      new Request("http://localhost/api/cache/search?query=private+deck+idea")
    );

    expect(await response.json()).toEqual({ hit: false });
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: false, failed: true, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private deck idea");
  });
});
