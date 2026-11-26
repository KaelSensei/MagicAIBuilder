/**
 * Which primary destination a page belongs to, from its locale-free pathname.
 * Solitary: `currentNavDestination` is a pure policy (design audit S9).
 */
import { describe, expect, it } from "vitest";
import { ariaCurrentPage, currentNavDestination } from "./primary-nav";

describe("currentNavDestination", () => {
  it.each([
    ["/decks", "decks"],
    ["/collection", "collection"],
    ["/rules/game-changers", "rules"],
  ] as const)(
    "finds the page a link opens: %s is %s",
    (pathname, destination) => {
      expect(currentNavDestination(pathname)).toBe(destination);
    }
  );

  it.each([
    ["/decks/abc", "decks"],
    ["/rules", "rules"],
    ["/rules/comprehensive", "rules"],
  ] as const)(
    "counts a page nested under a section as that section: %s is %s",
    (pathname, destination) => {
      expect(currentNavDestination(pathname)).toBe(destination);
    }
  );

  it.each([
    ["/decks/", "decks"],
    ["/collection/", "collection"],
    ["/rules/comprehensive/", "rules"],
  ] as const)("ignores a trailing slash: %s is %s", (pathname, destination) => {
    expect(currentNavDestination(pathname)).toBe(destination);
  });

  it.each([
    "/",
    "/builder/deck-1",
    "/deck/abc",
    "/saved-decks",
    "/decks-archive",
    "/collections",
    "/settings/account",
  ])("marks no destination on %s, which no link points to", (pathname) => {
    expect(currentNavDestination(pathname)).toBeNull();
  });

  it("marks no destination when there is no pathname, as outside Next's app router", () => {
    expect(currentNavDestination(null)).toBeNull();
  });
});

describe("ariaCurrentPage", () => {
  it("names the current destination's link the current page", () => {
    expect(ariaCurrentPage("collection", "collection")).toBe("page");
  });

  it("leaves aria-current off every other link, and off all of them on a page no link points to", () => {
    expect(ariaCurrentPage("collection", "decks")).toBeUndefined();
    expect(ariaCurrentPage(null, "decks")).toBeUndefined();
  });
});
