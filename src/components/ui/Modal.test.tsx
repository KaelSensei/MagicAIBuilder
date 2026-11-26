import { useCallback, useRef, useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("hands the key presses made inside the dialog to onKeyDown, and still closes on Escape", async () => {
    const user = userEvent.setup();
    const keys: string[] = [];
    const onClose = vi.fn();
    renderWithIntl(
      <Modal
        open
        onClose={onClose}
        title="Settings"
        onKeyDown={(event) => keys.push(event.key)}
      >
        <button type="button">First option</button>
      </Modal>
    );

    await user.keyboard("{ArrowRight}{ArrowLeft}");
    expect(keys).toEqual(["ArrowRight", "ArrowLeft"]);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hands Escape to onEscape instead of onClose when the caller sets it", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onEscape = vi.fn();
    renderWithIntl(
      <Modal open onClose={onClose} onEscape={onEscape} title="Settings">
        <button type="button">First option</button>
      </Modal>
    );

    await user.keyboard("{Escape}");

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});

/**
 * A page whose opener can leave while the modal is open, as the collection's empty state does
 * once a first card is added, and a control that stays to take focus instead.
 */
function LeavingOpenerPage({ openerShown }: { readonly openerShown: boolean }) {
  const [open, setOpen] = useState(false);
  const stays = useRef<HTMLButtonElement>(null);
  const fallback = useCallback(() => stays.current, []);
  return (
    <>
      {openerShown ? (
        <button type="button" onClick={() => setOpen(true)}>
          Open settings
        </button>
      ) : null}
      <button type="button" ref={stays}>
        Settings menu
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Settings"
        returnFocusFallback={fallback}
      >
        <button type="button">First option</button>
      </Modal>
    </>
  );
}

describe("Modal with a focus fallback", () => {
  it("gives focus to the fallback when the element that opened it has left the page", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(<LeavingOpenerPage openerShown />);
    await user.click(screen.getByRole("button", { name: "Open settings" }));

    rerender(<LeavingOpenerPage openerShown={false} />);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Settings menu" })
      ).toHaveFocus()
    );
  });

  it("still gives focus back to the element that opened it while it is on the page", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LeavingOpenerPage openerShown />);
    const opener = screen.getByRole("button", { name: "Open settings" });
    await user.click(opener);

    await user.keyboard("{Escape}");

    await waitFor(() => expect(opener).toHaveFocus());
  });
});
