import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import { useUIStore } from "@/lib/ui/store";
import {
  KeyboardShortcutsModal,
  KeyboardShortcutsTrigger,
} from "./KeyboardShortcutsModal";

/** The deck builder's shortcut wiring: the global hook, a visible trigger and the help. */
function BuilderShortcuts() {
  useKeyboardShortcuts({ searchResults: [], onAddCard: () => undefined });
  return (
    <>
      <KeyboardShortcutsTrigger />
      <KeyboardShortcutsModal />
    </>
  );
}

/** Move the focus back to the page, as clicking an empty area would. */
function focusPage() {
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();
}

beforeEach(() => {
  useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(true);
  useUIStore.getState().setShowKeyboardModal(false);
});

afterEach(() => {
  localStorage.clear();
});

describe("KeyboardShortcutsModal", () => {
  it("turns single-key shortcuts off from the list and back on from the trigger", async () => {
    const user = userEvent.setup();
    renderWithIntl(<BuilderShortcuts />);

    await user.keyboard("?");
    const toggle = screen.getByRole("switch", { name: "Single-key shortcuts" });
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(
      useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled
    ).toBe(false);

    act(() => useUIStore.getState().setShowKeyboardModal(false));
    focusPage();
    await user.keyboard("?");
    expect(useUIStore.getState().showKeyboardModal).toBe(false);

    await user.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(useUIStore.getState().showKeyboardModal).toBe(true);
    await user.click(
      screen.getByRole("switch", { name: "Single-key shortcuts" })
    );
    expect(
      useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled
    ).toBe(true);
  });

  it("explains in French what the switch turns off", async () => {
    renderWithIntl(<KeyboardShortcutsModal />, { locale: "fr" });
    act(() => useUIStore.getState().setShowKeyboardModal(true));

    const toggle = screen.getByRole("switch", {
      name: "Raccourcis à une touche",
    });
    expect(toggle).toHaveAccessibleDescription(/sans Ctrl ni ⌘/);
  });
});
