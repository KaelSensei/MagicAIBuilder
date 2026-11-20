import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckDescriptionEditor } from "./DeckDescriptionEditor";

const updateDeckDescription = vi.fn();

/** The slice of the store the editor reads: the save action, and no deck cards. */
interface EditorStoreSlice {
  readonly updateDeckDescription: typeof updateDeckDescription;
  readonly decks: Readonly<Record<string, undefined>>;
}

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: <T,>(select: (state: EditorStoreSlice) => T): T =>
    select({ updateDeckDescription, decks: {} }),
}));

describe("DeckDescriptionEditor", () => {
  beforeEach(() => {
    updateDeckDescription.mockReset();
  });

  it("keeps the description draft open until saving completes", async () => {
    const pending = Promise.withResolvers<void>();
    updateDeckDescription.mockReturnValueOnce(pending.promise);
    renderWithIntl(
      <DeckDescriptionEditor deckId="deck-1" description="Original" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit description" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Updated" },
    });
    fireEvent.keyDown(screen.getByRole("textbox"), {
      key: "Enter",
      ctrlKey: true,
    });
    try {
      expect(screen.getByRole("textbox")).toHaveValue("Updated");
    } finally {
      await act(async () => {
        pending.resolve();
        await pending.promise;
      });
    }
    expect(screen.queryByRole("textbox")).toBeNull();
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

  describe("split view", () => {
    /** Opens the editor on `description` and returns its source textarea. */
    function openEditor(description: string): HTMLElement {
      renderWithProviders(
        <DeckDescriptionEditor deckId="deck-1" description={description} />
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit description" }));
      return screen.getByRole("textbox");
    }

    it("shows the rendered primer beside the Markdown source while editing", () => {
      const source = openEditor("");

      fireEvent.change(source, { target: { value: "## Game plan" } });

      const preview = screen.getByRole("region", { name: "Preview" });
      expect(
        within(preview).getByRole("heading", { level: 2, name: "Game plan" })
      ).toBeDefined();
    });

    it("keeps the template insert on an empty draft, with a placeholder in the preview", () => {
      openEditor("");
      const preview = screen.getByRole("region", { name: "Preview" });
      expect(
        within(preview).getByText("Your primer appears here as you type.")
      ).toBeDefined();

      fireEvent.click(
        screen.getByRole("button", { name: "Use primer template" })
      );

      expect(
        within(preview).getByRole("heading", {
          level: 2,
          name: "Mulligan guide",
        })
      ).toBeDefined();
      expect(
        within(preview).queryByText("Your primer appears here as you type.")
      ).toBeNull();
    });

    it("stacks the preview below the source under lg, and sets them side by side from lg", () => {
      const source = openEditor("");
      const panes = screen.getByRole("region", {
        name: "Preview",
      }).parentElement;

      expect(
        screen.getByRole("dialog", { name: "Edit description" })
      ).toContainElement(panes);
      expect(panes).toContainElement(source);
      expect(panes).toHaveClass("grid", "grid-cols-1", "lg:grid-cols-2");
    });

    it("gives both panes a working height, each scrolling on its own", () => {
      const source = openEditor("");
      const previewBody = screen.getByText(
        "Your primer appears here as you type."
      ).parentElement;

      expect(source).not.toHaveAttribute("rows");
      expect(source).toHaveClass("h-[30vh]", "lg:h-[60vh]", "overflow-y-auto");
      expect(previewBody).toHaveClass(
        "h-[30vh]",
        "lg:h-[60vh]",
        "overflow-y-auto"
      );
    });

    it("renders the preview as a read-only region", () => {
      openEditor("## Game plan");
      const preview = screen.getByRole("region", { name: "Preview" });

      expect(within(preview).queryByRole("textbox")).toBeNull();
      expect(preview).not.toHaveAttribute("contenteditable");
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    });

    it("keeps the public page's link classification in the preview", () => {
      const source = openEditor("");

      fireEvent.change(source, {
        target: {
          value:
            "[Home](javascript:alert(1)) and [Guide](https://example.com/guide)",
        },
      });

      const preview = screen.getByRole("region", { name: "Preview" });
      expect(within(preview).queryByRole("link", { name: "Home" })).toBeNull();
      expect(within(preview).getByText("Home")).toBeDefined();
      expect(
        within(preview).getByRole("link", { name: "Guide" })
      ).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
    });

    it("drops the draft on Escape without saving", () => {
      const source = openEditor("Original");
      fireEvent.change(source, { target: { value: "Changed" } });

      fireEvent.keyDown(source, { key: "Escape" });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(updateDeckDescription).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Edit description" }));
      expect(screen.getByRole("textbox")).toHaveValue("Original");
    });

    it("saves the draft when the player presses outside the editor", async () => {
      const user = userEvent.setup();
      const source = openEditor("Original");
      fireEvent.change(source, { target: { value: "Updated" } });
      const backdrop = screen.getByRole("dialog").parentElement;

      await user.pointer({ keys: "[MouseLeft]", target: backdrop ?? source });

      expect(updateDeckDescription).toHaveBeenCalledTimes(1);
      expect(updateDeckDescription).toHaveBeenCalledWith("deck-1", "Updated");
    });

    it("keeps the editor open, unsaved, when the player presses inside it", async () => {
      const user = userEvent.setup();
      const source = openEditor("Original");
      fireEvent.change(source, { target: { value: "Updated" } });

      await user.click(screen.getByRole("region", { name: "Preview" }));

      expect(updateDeckDescription).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox")).toHaveValue("Updated");
    });

    it("saves the draft with the Save button", () => {
      const source = openEditor("Original");
      fireEvent.change(source, { target: { value: "Updated" } });

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(updateDeckDescription).toHaveBeenCalledWith("deck-1", "Updated");
    });

    it("keeps the 2,000-character cap and its counter", () => {
      const source = openEditor("Hello");

      expect(source).toHaveAttribute("maxlength", "2000");
      expect(
        screen.getByText("5/2000 · Ctrl+Enter to save · Esc to cancel")
      ).toBeDefined();
    });

    it("labels the preview in French", () => {
      renderWithProviders(
        <DeckDescriptionEditor deckId="deck-1" description="" />,
        { locale: "fr" }
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Modifier la description" })
      );

      const preview = screen.getByRole("region", { name: "Aperçu" });
      expect(
        within(preview).getByText(
          "Votre primer s’affiche ici pendant la saisie."
        )
      ).toBeDefined();
    });
  });
});
