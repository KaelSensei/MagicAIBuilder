/**
 * Solitary tests of the builder search panel's pick toggle, a pure policy. The page's sociable
 * tests (`page.search-query.test.tsx`) check that the toggles and the tabs apply it.
 */
import { describe, expect, it } from "vitest";
import { togglePick, type SearchPick } from "./search-pick";

describe("togglePick", () => {
  it.each<[SearchPick]>([["commander"], ["partner"], ["companion"]])(
    "starts the %s pick when no pick is on",
    (pressed) => {
      expect(togglePick(null, pressed)).toBe(pressed);
    }
  );

  it.each<[SearchPick]>([["commander"], ["partner"], ["companion"]])(
    "ends the %s pick when its own toggle is pressed again",
    (pressed) => {
      expect(togglePick(pressed, pressed)).toBeNull();
    }
  );

  it.each<[SearchPick, SearchPick]>([
    ["commander", "partner"],
    ["partner", "companion"],
    ["companion", "commander"],
  ])("replaces the %s pick with the %s pick", (current, pressed) => {
    expect(togglePick(current, pressed)).toBe(pressed);
  });
});
