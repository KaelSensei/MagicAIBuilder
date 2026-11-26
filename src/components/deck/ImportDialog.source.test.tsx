/**
 * The import dialog's source switch, Plain Text or From URL, as a screen
 * reader meets it: a named group whose chosen option is pressed (design audit
 * S3, WCAG 2.2 SC 4.1.2). The two buttons used to look chosen only through
 * their fill colour, and exposed no state.
 *
 * Sociable: the real `ImportDialog`, both of its tabs, the real deck store and
 * the real catalogs, through the shared test kit; nothing is mocked and no
 * request is sent.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ImportDialog } from "./ImportDialog";

describe("the import dialog's source switch", () => {
  it("opens on Plain Text, the one source pressed", () => {
    renderWithProviders(<ImportDialog open onOpenChange={vi.fn()} />);

    const source = screen.getByRole("group", { name: "Import source" });
    expect(within(source).getAllByRole("button", { pressed: true })).toEqual([
      within(source).getByRole("button", { name: "Plain Text" }),
    ]);
  });

  it("presses From URL once the player picks it, and shows the URL form", async () => {
    renderWithProviders(<ImportDialog open onOpenChange={vi.fn()} />);
    const source = screen.getByRole("group", { name: "Import source" });

    await userEvent.click(
      within(source).getByRole("button", { name: "From URL" })
    );

    expect(
      within(source).getByRole("button", { name: "From URL" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(source).getByRole("button", { name: "Plain Text" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("textbox", { name: /moxfield publicId/ })
    ).toBeInTheDocument();
  });

  it("names the switch in the player's language", () => {
    renderWithProviders(<ImportDialog open onOpenChange={vi.fn()} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("group", { name: "Source de l’import" })
    ).toBeInTheDocument();
  });
});
