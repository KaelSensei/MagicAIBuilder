import { describe, expect, it } from "vitest";
import { placeZoneMenu } from "./zone-menu-place";

const VIEWPORT = { width: 400, height: 300 };
const MENU = { width: 180, height: 120 };

describe("placeZoneMenu", () => {
  it("opens under the trigger, aligned to its right edge", () => {
    expect(
      placeZoneMenu({ top: 40, bottom: 80, left: 200, right: 280 }, VIEWPORT, MENU)
    ).toEqual({ top: 84, left: 100 });
  });

  it("flips above the trigger when the tile sits at the bottom of the viewport", () => {
    expect(
      placeZoneMenu({ top: 240, bottom: 280, left: 200, right: 280 }, VIEWPORT, MENU)
    ).toEqual({ top: 116, left: 100 });
  });

  it("keeps the menu inside the viewport when the trigger is at the left edge", () => {
    expect(
      placeZoneMenu({ top: 40, bottom: 80, left: 0, right: 40 }, VIEWPORT, MENU)
    ).toEqual({ top: 84, left: 8 });
  });
});
