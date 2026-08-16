import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { HandZone } from "./HandZone";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name = "Test Card"): DeckCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "creature", quantity: 1, zone: "main", scryfallId: id,
  };
}

describe("HandZone", () => {
  const defaultProps = {
    hand: [makeCard("c1", "Lightning Bolt"), makeCard("c2", "Counterspell")],
    libraryCount: 90,
    onDrawCard: vi.fn(),
    onMoveCard: vi.fn(),
  };

  it("displays the hand card count", () => {
    renderWithIntl(<HandZone {...defaultProps} />);
    expect(screen.getByText(/hand: 2/i)).toBeDefined();
  });

  it("renders a Draw Card button", () => {
    renderWithIntl(<HandZone {...defaultProps} />);
    expect(screen.getByRole("button", { name: /draw card/i })).toBeDefined();
  });

  it("calls onDrawCard when Draw Card is clicked", () => {
    const onDrawCard = vi.fn();
    renderWithIntl(<HandZone {...defaultProps} onDrawCard={onDrawCard} />);
    fireEvent.click(screen.getByRole("button", { name: /draw card/i }));
    expect(onDrawCard).toHaveBeenCalledOnce();
  });

  it("renders a toggle to show card names", () => {
    renderWithIntl(<HandZone {...defaultProps} />);
    expect(screen.getByRole("button", { name: /show cards/i })).toBeDefined();
  });

  it("shows card names when toggle is enabled", () => {
    renderWithIntl(<HandZone {...defaultProps} />);
    const toggle = screen.getByRole("button", { name: /show cards/i });
    fireEvent.click(toggle);
    expect(screen.getAllByText("Lightning Bolt").length).toBeGreaterThan(0);
  });

  it("shows library count", () => {
    renderWithIntl(<HandZone {...defaultProps} />);
    expect(screen.getByText(/deck: 90/i)).toBeDefined();
  });

  it("disables Draw Card when library is empty", () => {
    renderWithIntl(<HandZone {...defaultProps} libraryCount={0} />);
    const btn = screen.getByRole("button", { name: /draw card/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  // This assertion used to read /deck vide/i — the component shipped a French
  // string in the English UI, and the test encoded it.
  it("shows deck empty message when library is 0", () => {
    renderWithIntl(<HandZone {...defaultProps} libraryCount={0} />);
    expect(screen.getByText(/deck empty/i)).toBeDefined();
  });
});
