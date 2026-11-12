import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { useUIStore } from "@/lib/ui/store";
import {
  KeyboardShortcutsModal,
  KeyboardShortcutsTrigger,
} from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal as a dialog", () => {
  beforeEach(() => {
    useUIStore.setState({ showKeyboardModal: false });
  });

  it("is a modal dialog named by its own heading, and gives focus back on close", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <KeyboardShortcutsTrigger />
        <KeyboardShortcutsModal />
      </>
    );
    const trigger = screen.getByRole("button", { name: /shortcuts/i });

    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Keyboard Shortcuts" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useUIStore.getState().showKeyboardModal).toBe(false);
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
