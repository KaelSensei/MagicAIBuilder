import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";

/**
 * Replicate the exact token generation logic from the share route so we can
 * test its properties in isolation (no Prisma / Next.js dependency).
 */
function generateToken(): string {
  return randomBytes(9).toString("base64url");
}

describe("shareToken generation", () => {
  it("generates a string", () => {
    const token = generateToken();
    expect(typeof token).toBe("string");
  });

  it("generates exactly 12 characters (9 bytes → base64url = 12 chars)", () => {
    // base64url: ceil(9 * 4/3) = 12, no padding
    const token = generateToken();
    expect(token).toHaveLength(12);
  });

  it("only contains URL-safe characters (base64url alphabet: A-Z a-z 0-9 - _)", () => {
    for (let i = 0; i < 50; i++) {
      const token = generateToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("generates unique tokens (no collisions across 1000 samples)", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      tokens.add(generateToken());
    }
    expect(tokens.size).toBe(1000);
  });

  it("token passes the validation regex used in the API route", () => {
    // This mirrors: /^[a-zA-Z0-9_-]+$/.test(token) && token.length <= 64
    const token = generateToken();
    expect(/^[a-zA-Z0-9_-]+$/.test(token)).toBe(true);
    expect(token.length).toBeLessThanOrEqual(64);
  });
});
