import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { Modal, ModalTitle } from "./Modal";

/** A page with a trigger, a control behind the modal, and the modal itself. */
function ModalPage({
  customHeading = false,
}: {
  readonly customHeading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <button type="button">Behind the modal</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={customHeading ? undefined : "Settings"}
        showClose={!customHeading}
      >
        {customHeading && <ModalTitle>Custom settings</ModalTitle>}
        <button type="button">First option</button>
        <button type="button">Last option</button>
      </Modal>
    </>
  );
}

async function openModal(locale: TestLocale = "en", customHeading = false) {
  const user = userEvent.setup();
  renderWithIntl(<ModalPage customHeading={customHeading} />, { locale });
  const trigger = screen.getByRole("button", { name: "Open settings" });
  await user.click(trigger);
  return { user, trigger };
}

describe("Modal", () => {
  it("is a modal dialog named by its title", async () => {
    await openModal();

    expect(
      screen.getByRole("dialog", { name: "Settings" })
    ).toBeInTheDocument();
    // Modal: the page behind leaves the accessibility tree while it is open.
    expect(
      screen.queryByRole("button", { name: "Behind the modal" })
    ).not.toBeInTheDocument();
  });

  it("is named by a heading the content draws itself", async () => {
    await openModal("en", true);

    expect(
      screen.getByRole("dialog", { name: "Custom settings" })
    ).toBeInTheDocument();
  });

  it("names its close button in the viewer's language", async () => {
    await openModal("fr");

    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("moves focus into the dialog when it opens", async () => {
    await openModal();

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const { user, trigger } = await openModal();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("gives focus back to the trigger after the close button", async () => {
    const { user, trigger } = await openModal();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps Tab and Shift+Tab inside the dialog", async () => {
    const { user } = await openModal();

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Last option" })).toHaveFocus();

    // Past the last control, focus wraps to the first instead of leaving.
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last option" })).toHaveFocus();
  });
});
