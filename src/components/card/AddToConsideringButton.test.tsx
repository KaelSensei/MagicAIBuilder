import { renderWithIntl } from "@/test/render-with-intl";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { AddToConsideringButton } from "./AddToConsideringButton";

const CARD: ScryfallCard = {
  id: "card-1",
  name: "Sol Ring",
  cmc: 1,
  type_line: "Artifact",
  color_identity: [],
};

describe("AddToConsideringButton", () => {
  it("adds the card to Considering when pressed", () => {
    const onAdd = vi.fn();
    renderWithIntl(<AddToConsideringButton card={CARD} isInMaybeboard={false} onAdd={onAdd} />, { locale: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Add Sol Ring to Considering" }));

    expect(onAdd).toHaveBeenCalledWith(CARD);
  });

  it("is disabled once the card is already in Considering", () => {
    const onAdd = vi.fn();
    renderWithIntl(<AddToConsideringButton card={CARD} isInMaybeboard onAdd={onAdd} />, { locale: "en" });

    const button = screen.getByRole("button", { name: "Sol Ring is already in Considering" });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("uses the French Considering label", () => {
    renderWithIntl(<AddToConsideringButton card={CARD} isInMaybeboard={false} onAdd={vi.fn()} />, { locale: "fr" });

    expect(screen.getByRole("button", { name: "Ajouter Sol Ring \u00e0 l'\u00e9tude" })).toBeInTheDocument();
  });
});
