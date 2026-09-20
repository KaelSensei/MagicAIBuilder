import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckDescriptionEditor } from "./DeckDescriptionEditor";

const updateDeckDescription = vi.fn();

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: () => ({ updateDeckDescription }),
}));

describe("DeckDescriptionEditor", () => {
  beforeEach(() => {
    updateDeckDescription.mockReset();
  });

  it("offers a primer template for an empty description", () => {
    renderWithIntl(<DeckDescriptionEditor deckId="deck-1" description="" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit description" }));

    expect(
      screen.getByRole("button", { name: "Use primer template" })
    ).toBeDefined();
  });

  it("inserts structured primer sections without saving immediately", () => {
    renderWithIntl(<DeckDescriptionEditor deckId="deck-1" description="" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit description" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Use primer template" })
    );

    expect(screen.getByDisplayValue(/## Game plan/)).toBeDefined();
    expect(screen.getByDisplayValue(/## Mulligan guide/)).toBeDefined();
    expect(screen.getByDisplayValue(/## Win conditions/)).toBeDefined();
    expect(screen.getByDisplayValue(/## Sequencing guide/)).toBeDefined();
    expect(updateDeckDescription).not.toHaveBeenCalled();
  });

  it("never offers the template over an existing description", () => {
    renderWithIntl(
      <DeckDescriptionEditor deckId="deck-1" description="My existing primer" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit description" }));

    expect(
      screen.queryByRole("button", { name: "Use primer template" })
    ).toBeNull();
    expect(screen.getByRole("textbox")).toHaveValue("My existing primer");
  });

  it("saves the inserted primer with Ctrl+Enter", () => {
    renderWithIntl(<DeckDescriptionEditor deckId="deck-1" description="" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit description" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Use primer template" })
    );
    const editor = screen.getByRole("textbox");

    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });

    expect(updateDeckDescription).toHaveBeenCalledWith(
      "deck-1",
      expect.stringContaining("## Game plan")
    );
  });
});
