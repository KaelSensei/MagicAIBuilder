import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key-1", 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("allows up to the limit", () => {
    const key = "test-key-2";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks on limit+1", () => {
    const key = "test-key-3";
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000);
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
  });

  it("returns retryAfterMs when blocked", () => {
    const key = "test-key-4";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    }
  });

  it("resets after window expires", () => {
    const key = "test-key-5";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 1_000);
    // Block
    expect(checkRateLimit(key, 3, 1_000).allowed).toBe(false);
    // Advance time past window
    vi.advanceTimersByTime(1_001);
    // Should be allowed again
    expect(checkRateLimit(key, 3, 1_000).allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("key-a", 3, 60_000);
    expect(checkRateLimit("key-a", 3, 60_000).allowed).toBe(false);
    expect(checkRateLimit("key-b", 3, 60_000).allowed).toBe(true);
  });

  // signup budgets over 15 minutes and import over 60 seconds, and both share
  // one store. Pruning against the *caller's* window let the short-window
  // caller evict the long-window entry, so unrelated traffic reset a
  // brute-force counter every two minutes.
  it("keeps a long-window entry alive across a short-window caller's prune", () => {
    const FIFTEEN_MINUTES = 15 * 60_000;
    const victim = "signup:203.0.113.7";

    for (let i = 0; i < 3; i++) checkRateLimit(victim, 3, FIFTEEN_MINUTES);
    expect(checkRateLimit(victim, 3, FIFTEEN_MINUTES).allowed).toBe(false);

    // Three minutes on: well past 2x a 60-second window, nowhere near 15 minutes.
    vi.advanceTimersByTime(3 * 60_000);
    checkRateLimit("import:198.51.100.4", 10, 60_000);

    expect(checkRateLimit(victim, 3, FIFTEEN_MINUTES).allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  it("prefers first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.1, 10.0.0.1 " },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(getClientIp(req)).toBe("198.51.100.2");
  });

  it("returns unknown when no proxy headers", () => {
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});
