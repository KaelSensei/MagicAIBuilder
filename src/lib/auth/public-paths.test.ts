/**
 * Public pages a signed-out visitor can open.
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

describe("the precon catalogue", () => {
  it("is public in English and in French, including a list under that path", () => {
    expect(isPublicPagePath("/precons")).toBe(true);
    expect(isPublicPagePath(stripLocalePrefix("/fr/precons"))).toBe(true);
    expect(isPublicPagePath("/precons/cmm-eldrazi")).toBe(true);
  });
});
