/**
 * The API changelog is a public page. A signed-out visitor can read it, and
 * the allow is exact so a path under it is not public by accident.
 */
import { describe, expect, it } from "vitest";
import { isPublicPagePath, stripLocalePrefix } from "@/lib/auth/public-paths";

describe("the API changelog page", () => {
  it("is public in English and in French, and nowhere below that path", () => {
    expect(isPublicPagePath("/api-changelog")).toBe(true);
    expect(isPublicPagePath(stripLocalePrefix("/fr/api-changelog"))).toBe(true);
    expect(isPublicPagePath("/api-changelog/deck-1")).toBe(false);
  });
});
