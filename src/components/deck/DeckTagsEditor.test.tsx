import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
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
});
