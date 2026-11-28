import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { HIDES_FOCUS_OUTLINE } from "@/test/focus-outline";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckTagsEditor } from "./DeckTagsEditor";

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: () => ({ addTag: vi.fn(), removeTag: vi.fn() }),
}));

describe("DeckTagsEditor", () => {
  it("shows the add-tag control in French", () => {
    renderWithIntl(<DeckTagsEditor deckId="deck-1" tags={[]} />, { locale: "fr" });

    expect(screen.getByRole("button", { name: "Ajouter une étiquette" })).toBeInTheDocument();
  });

  // Design audit S1: the tag field hid its outline and drew nothing on focus.
  it("leaves the app's focus outline visible on the new-tag field", () => {
    renderWithIntl(<DeckTagsEditor deckId="deck-1" tags={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("textbox").className).not.toMatch(HIDES_FOCUS_OUTLINE);
  });

  // WCAG 2.2 SC 1.3.1, 3.3.2 and 4.1.2 (I-04 accessibility bundle 4): the
  // new-tag field was named only by its placeholder, and a placeholder is no name.
  it("names the new-tag field for a screen reader and keeps the prompt as its placeholder", () => {
    renderWithIntl(<DeckTagsEditor deckId="deck-1" tags={["casual"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("textbox", { name: "New tag" })).toHaveAttribute(
      "placeholder",
      "tag name…"
    );
  });

  it("names the new-tag field in French", () => {
    renderWithIntl(<DeckTagsEditor deckId="deck-1" tags={[]} />, { locale: "fr" });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une étiquette" }));

    expect(screen.getByRole("textbox", { name: "Nouvelle étiquette" })).toBeInTheDocument();
  });
});
