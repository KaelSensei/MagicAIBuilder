/**
 * Unit tests for tag management rules:
 *   - Trimming, deduplication, empty rejection, max-length enforcement
 *   - These validate the same rules applied in both the store and the API route
 */
import { describe, it, expect } from "vitest";

// ─── Pure helper functions that mirror the store/API logic ───────────────────

/** Apply the same normalisation as the store's addTag action */
function normaliseTag(raw: string): string {
  return raw.trim().slice(0, 50);
}

/** Determine whether a tag should be added (mirrors store guard) */
function shouldAddTag(existingTags: string[], raw: string): boolean {
  const trimmed = normaliseTag(raw);
  if (!trimmed) return false;
  if (existingTags.includes(trimmed)) return false;
  return true;
}

/** Apply the same sanitisation as the API route for a tags array */
function sanitiseTags(tags: string[]): string[] {
  return tags.map((t) => t.trim().slice(0, 50)).filter(Boolean);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Tag normalisation (normaliseTag)", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normaliseTag("  casual  ")).toBe("casual");
  });

  it("keeps internal spaces", () => {
    expect(normaliseTag("my theme")).toBe("my theme");
  });

  it("truncates to 50 characters", () => {
    const long = "a".repeat(60);
    expect(normaliseTag(long)).toHaveLength(50);
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normaliseTag("   ")).toBe("");
  });

  it("returns the tag unchanged if already normalised", () => {
    expect(normaliseTag("cEDH")).toBe("cEDH");
  });
});

describe("Tag addition guard (shouldAddTag)", () => {
  it("allows a new tag that is not in the list", () => {
    expect(shouldAddTag(["casual"], "budget")).toBe(true);
  });

  it("rejects a duplicate tag (exact match)", () => {
    expect(shouldAddTag(["casual", "WIP"], "casual")).toBe(false);
  });

  it("rejects a tag that becomes duplicate after trimming", () => {
    expect(shouldAddTag(["casual"], "  casual  ")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(shouldAddTag([], "")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(shouldAddTag([], "   ")).toBe(false);
  });

  it("allows the first tag on an empty list", () => {
    expect(shouldAddTag([], "cEDH")).toBe(true);
  });

  it("is case-sensitive (cEdh ≠ cEDH)", () => {
    expect(shouldAddTag(["cEDH"], "cedh")).toBe(true);
  });
});

describe("Tag array sanitisation (API-level: sanitiseTags)", () => {
  it("trims each tag", () => {
    expect(sanitiseTags(["  casual  ", " WIP"])).toEqual(["casual", "WIP"]);
  });

  it("truncates tags to 50 chars", () => {
    const long = "x".repeat(60);
    const result = sanitiseTags([long]);
    expect(result[0]).toHaveLength(50);
  });

  it("filters out empty-string tags", () => {
    expect(sanitiseTags(["casual", "", "  "])).toEqual(["casual"]);
  });

  it("returns an empty array when all tags are blank", () => {
    expect(sanitiseTags(["  ", "  "])).toEqual([]);
  });

  it("preserves order", () => {
    expect(sanitiseTags(["budget", "cEDH", "tuned"])).toEqual(["budget", "cEDH", "tuned"]);
  });

  it("handles an empty input array", () => {
    expect(sanitiseTags([])).toEqual([]);
  });
});

describe("Tag suggestions coverage", () => {
  const SUGGESTED = ["casual", "cEDH", "WIP", "budget", "tuned", "theme"];

  it("all suggested tags pass normalisation unchanged", () => {
    SUGGESTED.forEach((tag) => {
      expect(normaliseTag(tag)).toBe(tag);
    });
  });

  it("all suggested tags are under 50 characters", () => {
    SUGGESTED.forEach((tag) => {
      expect(tag.length).toBeLessThanOrEqual(50);
    });
  });

  it("all suggested tags are unique", () => {
    expect(new Set(SUGGESTED).size).toBe(SUGGESTED.length);
  });
});
