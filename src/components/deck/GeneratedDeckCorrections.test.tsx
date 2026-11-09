import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DeckCorrection } from "@/app/api/ai/build/types";
import { renderWithIntl } from "@/test/render-with-intl";
import { GeneratedDeckCorrections } from "./GeneratedDeckCorrections";

const CORRECTIONS: readonly DeckCorrection[] = [
  {
    action: "removed",
    name: "Lightning Bolt",
    quantity: 1,
    reason: "outside_color_identity",
  },
  {
    action: "removed",
    name: "Totally Real Card",
    quantity: 1,
    reason: "unknown_card",
  },
  { action: "added", name: "Island", quantity: 2, reason: "fill_to_size" },
];

describe("GeneratedDeckCorrections", () => {
  it("shows the number of corrections and each change with the rule behind it", () => {
    renderWithIntl(
      <GeneratedDeckCorrections
        corrections={CORRECTIONS}
        onOpenDeck={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Checked against card data: 3 corrections",
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent)
    ).toEqual([
      "Removed Lightning Bolt: outside your commander's color identity",
      "Removed Totally Real Card: no card has this name",
      "Added Island ×2: to bring the deck to 100 cards",
    ]);
  });

  it("speaks French when the player does", () => {
    renderWithIntl(
      <GeneratedDeckCorrections
        corrections={CORRECTIONS.slice(0, 1)}
        onOpenDeck={vi.fn()}
      />,
      {
        locale: "fr",
      }
    );

    expect(
      screen.getByRole("heading", {
        name: "Vérifié avec les données des cartes : 1 correction",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "Retrait de Lightning Bolt : hors de l’identité de couleur de votre commandant"
    );
  });

  it("opens the deck only when the player asks", () => {
    const onOpenDeck = vi.fn();
    renderWithIntl(
      <GeneratedDeckCorrections
        corrections={CORRECTIONS}
        onOpenDeck={onOpenDeck}
      />
    );

    expect(onOpenDeck).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open the deck" }));
    expect(onOpenDeck).toHaveBeenCalledTimes(1);
  });
});
