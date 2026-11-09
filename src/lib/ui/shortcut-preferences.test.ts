import { afterEach, describe, expect, it } from "vitest";
import {
  SHORTCUT_PREFERENCES_STORAGE_KEY,
  readSingleKeyShortcutsEnabled,
  useShortcutPreferencesStore,
} from "./shortcut-preferences";

/** Write a stored preference blob the way the persist middleware does. */
function storeBlob(state: unknown): void {
  localStorage.setItem(
    SHORTCUT_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ state, version: 0 })
  );
}

afterEach(() => {
  useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(true);
  localStorage.clear();
});

describe("shortcut preferences", () => {
  it("turns single-key shortcuts on by default", () => {
    expect(
      useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled
    ).toBe(true);
  });

  it("remembers that single-key shortcuts were turned off", () => {
    useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(false);

    const stored: unknown = JSON.parse(
      localStorage.getItem(SHORTCUT_PREFERENCES_STORAGE_KEY) ?? "null"
    );
    expect(stored).toMatchObject({
      state: { singleKeyShortcutsEnabled: false },
    });
  });

  it("restores a stored choice on the next visit", async () => {
    storeBlob({ singleKeyShortcutsEnabled: false });

    await useShortcutPreferencesStore.persist.rehydrate();

    expect(
      useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled
    ).toBe(false);
  });

  it("keeps the shortcuts on when the stored value is not a boolean", async () => {
    storeBlob({ singleKeyShortcutsEnabled: "no" });

    await useShortcutPreferencesStore.persist.rehydrate();

    expect(
      useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled
    ).toBe(true);
  });
});

describe("readSingleKeyShortcutsEnabled", () => {
  it.each([
    ["a stored false", { singleKeyShortcutsEnabled: false }, false],
    ["a stored true", { singleKeyShortcutsEnabled: true }, true],
    ["a missing field", {}, true],
    ["a string", { singleKeyShortcutsEnabled: "false" }, true],
    ["null", null, true],
    ["a number", 0, true],
  ])("reads %s", (_label, persisted, expected) => {
    expect(readSingleKeyShortcutsEnabled(persisted)).toBe(expected);
  });
});
