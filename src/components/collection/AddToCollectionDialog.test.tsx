import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AddToCollectionDialog } from "./AddToCollectionDialog";

async function openDialog(locale: TestLocale = "en") {
  const user = userEvent.setup();
  renderWithIntl(<AddToCollectionDialog />, { locale });
  const trigger = screen.getByRole("button");
  await user.click(trigger);
  return { user, trigger };
}

describe("AddToCollectionDialog", () => {
  it("opens a modal dialog named by its heading", async () => {
    await openDialog();

    expect(
      screen.getByRole("dialog", { name: "Add to Collection" })
    ).toBeInTheDocument();
    // Modal: the page behind, trigger included, leaves the accessibility tree.
    expect(
      screen.queryByRole("button", { name: "Add Card" })
    ).not.toBeInTheDocument();
  });

  it("is named in the viewer's language", async () => {
    await openDialog("fr");

    expect(
      screen.getByRole("dialog", { name: "Ajouter à la collection" })
    ).toBeInTheDocument();
  });

  // Focus used to stay on the trigger, hidden behind the overlay. It now moves
  // to the dialog's first control, the card search; no `autoFocus` is involved.
  it("moves focus into the dialog when it opens", async () => {
    const { trigger } = await openDialog();

    expect(
      screen.getByRole("textbox", { name: "Search for a card…" })
    ).toHaveFocus();
    expect(trigger).not.toHaveFocus();
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const { user, trigger } = await openDialog();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = await openDialog();
    const dialog = screen.getByRole("dialog", { name: "Add to Collection" });

    // Search, Cancel, then the disabled submit is skipped: Tab wraps to search.
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(
      screen.getByRole("textbox", { name: "Search for a card…" })
    ).toHaveFocus();
  });
});
