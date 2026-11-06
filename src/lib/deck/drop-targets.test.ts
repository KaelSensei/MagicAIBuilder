import { describe, expect, it } from "vitest";
import {
  ACTIVE_SURFACE_ID,
  explicitDropZone,
  isDeckZone,
  preferSmallerDropTarget,
  searchDropZone,
  zoneBodyId,
  zoneTabId,
} from "./drop-targets";

describe("explicitDropZone", () => {
  it("reads a zone tab without treating the active surface as a move", () => {
    expect(explicitDropZone(zoneTabId("sideboard"))).toBe("sideboard");
    expect(explicitDropZone(zoneTabId("maybeboard"))).toBe("maybeboard");
    expect(explicitDropZone(zoneTabId("main"))).toBe("main");
    expect(explicitDropZone(ACTIVE_SURFACE_ID)).toBeNull();
    expect(explicitDropZone("deck-category-ramp")).toBeNull();
  });

  it("reads the secondary zone body and ignores a tab-shaped suffix", () => {
    expect(explicitDropZone(zoneBodyId("sideboard"))).toBe("sideboard");
    expect(explicitDropZone("deck-zone-tab-sideboard")).toBe("sideboard");
    expect(isDeckZone("tab-sideboard")).toBe(false);
  });
});

describe("preferSmallerDropTarget", () => {
  it("keeps the nested target ahead of the editor surface", () => {
    const ordered = preferSmallerDropTarget(
      [{ id: ACTIVE_SURFACE_ID }, { id: zoneTabId("sideboard") }],
      (id) => (id === ACTIVE_SURFACE_ID ? 4000 : 120)
    );
    expect(ordered.map((entry) => entry.id)).toEqual([
      zoneTabId("sideboard"),
      ACTIVE_SURFACE_ID,
    ]);
  });
});

describe("searchDropZone", () => {
  it("uses the active zone when the drop is not a zone target", () => {
    expect(searchDropZone(ACTIVE_SURFACE_ID, "maybeboard")).toBe("maybeboard");
    expect(searchDropZone("deck-category-land", "sideboard")).toBe("sideboard");
    expect(searchDropZone(zoneTabId("main"), "maybeboard")).toBe("main");
  });
});
