/**
 * The display-name rule shared by deck names and snapshot names: what
 * `sanitizeDisplayName` keeps, strips and cuts.
 */
import { describe, expect, it } from "vitest";

import { sanitizeDisplayName } from "@/lib/deck/display-name";

describe("sanitizeDisplayName", () => {
  it("keeps a plain name as typed", () => {
    expect(sanitizeDisplayName("Atraxa superfriends", 100)).toBe(
      "Atraxa superfriends"
    );
  });

  it("strips HTML tags and the spaces they leave at either end", () => {
    expect(sanitizeDisplayName("  <b>Before</b> the cuts <br/> ", 100)).toBe(
      "Before the cuts"
    );
  });

  it("cuts the name to the maximum length after trimming", () => {
    expect(sanitizeDisplayName(` ${"x".repeat(120)}`, 100)).toBe(
      "x".repeat(100)
    );
  });

  it("answers an empty string when only tags and spaces were given", () => {
    expect(sanitizeDisplayName(" <i></i> ", 100)).toBe("");
  });

  it("leaves a tag longer than 200 characters in place, so the pattern stays linear", () => {
    const longTag = `<${"a".repeat(201)}>`;

    expect(sanitizeDisplayName(longTag, 300)).toBe(longTag);
  });
});
