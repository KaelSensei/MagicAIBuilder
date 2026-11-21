import { afterEach, describe, expect, it } from "vitest";
import {
  DECK_ROW_PREFERENCES_STORAGE_KEY,
  readShowCollectionBadges,
  useDeckRowPreferencesStore,
} from "./deck-row-preferences";

/** Writes a stored preference blob the way the persist middleware does. */
function storeBlob(state: unknown): void {
  localStorage.setItem(
    DECK_ROW_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ state, version: 0 })
  );
}

afterEach(() => {
  useDeckRowPreferencesStore.getState().setShowCollectionBadges(true);
  localStorage.clear();
});

describe("deck row preferences", () => {
  it("shows the Owned and Buy badges by default, as before the switch existed", () => {
    expect(useDeckRowPreferencesStore.getState().showCollectionBadges).toBe(
      true
    );
  });

  it("remembers that the badges were hidden", () => {
    useDeckRowPreferencesStore.getState().setShowCollectionBadges(false);

    const stored: unknown = JSON.parse(
      localStorage.getItem(DECK_ROW_PREFERENCES_STORAGE_KEY) ?? "null"
    );
    expect(stored).toMatchObject({ state: { showCollectionBadges: false } });
  });

  it("restores a stored choice on the next visit", async () => {
    storeBlob({ showCollectionBadges: false });

    await useDeckRowPreferencesStore.persist.rehydrate();

    expect(useDeckRowPreferencesStore.getState().showCollectionBadges).toBe(
      false
    );
  });
});

describe("readShowCollectionBadges", () => {
  it.each([
    ["a stored false", { showCollectionBadges: false }, false],
    ["a stored true", { showCollectionBadges: true }, true],
    ["a missing field", {}, true],
    ["a string", { showCollectionBadges: "false" }, true],
    ["a falsy number", { showCollectionBadges: 0 }, true],
    ["null", null, true],
    ["a number", 0, true],
  ])("reads %s", (_label, persisted, expected) => {
    expect(readShowCollectionBadges(persisted)).toBe(expected);
  });
});
