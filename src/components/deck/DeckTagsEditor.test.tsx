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
});
