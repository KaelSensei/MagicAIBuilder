import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { GraveyardZone } from "./GraveyardZone";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name = "Card"): DeckCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "creature", quantity: 1, zone: "main", scryfallId: id,
  };
}

describe("GraveyardZone", () => {
  const defaultProps = {
    graveyard: [makeCard("g1", "Dead Creature"), makeCard("g2", "Spent Spell")],
    exile: [makeCard("e1", "Exiled Card")],
    onRestore: vi.fn(),
  };

  it("displays graveyard count", () => {
    renderWithIntl(<GraveyardZone {...defaultProps} />);
    expect(screen.getByText(/graveyard: 2/i)).toBeDefined();
  });

  it("displays exile count", () => {
    renderWithIntl(<GraveyardZone {...defaultProps} />);
    expect(screen.getByText(/exile: 1/i)).toBeDefined();
  });

  it("shows cards in graveyard on expand", () => {
    renderWithIntl(<GraveyardZone {...defaultProps} />);
    const expandBtn = screen.getByRole("button", { name: /graveyard/i });
    fireEvent.click(expandBtn);
    expect(screen.getByText("Dead Creature")).toBeDefined();
  });

  it("shows 'Restore to hand' option when graveyard card is clicked", () => {
    renderWithIntl(<GraveyardZone {...defaultProps} />);
    const expandBtn = screen.getByRole("button", { name: /graveyard/i });
    fireEvent.click(expandBtn);
    const restoreBtn = screen.getAllByRole("button", { name: /restore to hand/i });
    expect(restoreBtn.length).toBeGreaterThan(0);
  });

  it("calls onRestore with correct args when restoring to hand", () => {
    const onRestore = vi.fn();
    renderWithIntl(<GraveyardZone {...defaultProps} onRestore={onRestore} />);
    const expandBtn = screen.getByRole("button", { name: /graveyard/i });
    fireEvent.click(expandBtn);
    // Cards are reversed (newest on top), so g2 is first
    const restoreBtn = screen.getAllByRole("button", { name: /restore to hand/i })[0];
    fireEvent.click(restoreBtn);
    expect(onRestore).toHaveBeenCalledWith(expect.any(String), "graveyard", "hand");
  });

  it("shows empty graveyard message when graveyard is empty", () => {
    renderWithIntl(<GraveyardZone {...defaultProps} graveyard={[]} />);
    const expandBtn = screen.getByRole("button", { name: /graveyard/i });
    fireEvent.click(expandBtn);
    expect(screen.getByText(/graveyard is empty/i)).toBeDefined();
  });
});
