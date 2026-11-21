import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { aTextFile } from "@/test/builders/text-file";
import { ImportFileButton } from "./ImportFileButton";

/**
 * The picker on its own: how the player reaches it and what it hands the
 * dialog. The dialog's own tests cover the formats and the refusals.
 */

it("is a labelled button the keyboard reaches, and it opens the system file chooser", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ImportFileButton replacing={false} onRead={vi.fn()} />);
  const openChooser = vi.fn();
  screen.getByLabelText("Decklist files").addEventListener("click", openChooser);

  await user.tab();
  expect(screen.getByRole("button", { name: "Import from files…" })).toHaveFocus();
  expect(screen.getByRole("button", { name: "Import from files…" })).toHaveAccessibleDescription(
    ".txt, MTGO .dek or .csv. Read in your browser, never uploaded."
  );
  await user.keyboard("{Enter}");

  expect(openChooser).toHaveBeenCalledOnce();
});

it("hands the dialog the decklist text and the status line", async () => {
  const onRead = vi.fn();
  renderWithProviders(<ImportFileButton replacing={false} onRead={onRead} />);

  await userEvent.upload(screen.getByLabelText("Decklist files"), aTextFile("ramp.txt", "1 Sol Ring"));

  await waitFor(() =>
    expect(onRead).toHaveBeenCalledWith({
      kind: "read",
      text: "1 Sol Ring",
      message: "Read ramp.txt as a text decklist, 1 line.",
    })
  );
});

it("reads the same file again when the player chooses it a second time", async () => {
  const onRead = vi.fn();
  renderWithProviders(<ImportFileButton replacing onRead={onRead} />);
  const input = screen.getByLabelText("Decklist files");
  const file = aTextFile("ramp.txt", "1 Sol Ring");

  await userEvent.upload(input, file);
  await waitFor(() => expect(onRead).toHaveBeenCalledOnce());
  await userEvent.upload(input, file);

  await waitFor(() => expect(onRead).toHaveBeenCalledTimes(2));
});

it("cannot be used while the dialog validates a preview", () => {
  renderWithProviders(<ImportFileButton replacing={false} disabled onRead={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Import from files…" })).toBeDisabled();
});
