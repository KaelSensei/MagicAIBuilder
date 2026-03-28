import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

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
});
