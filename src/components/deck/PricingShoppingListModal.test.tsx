import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { PricingShoppingListModal } from "./PricingShoppingListModal";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name: string, price: number | null, qty = 1): DeckCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price, imageUri: "", artCropUri: "",
    category: "creature", quantity: qty, zone: "main", scryfallId: id,
  };
}

describe("PricingShoppingListModal", () => {
  const defaultProps = {
    isOpen: true,
    deckName: "Atraxa Voltron",
    cards: [
      makeCard("c1", "Rhystic Study", 25, 1),
      makeCard("c2", "Counterspell", 18, 2),
      makeCard("c3", "No Price Card", null, 1),
    ],
    onClose: vi.fn(),
  };

  it("renders the modal when open", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText(/shopping list/i)).toBeDefined();
  });

  it("does not render when closed", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/shopping list/i)).toBeNull();
  });

  it("lists cards with names and prices", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText("Rhystic Study")).toBeDefined();
    expect(screen.getByText("Counterspell")).toBeDefined();
  });

  it("shows the deck subtotal", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    // 25 + 36 (18*2) = 61
    expect(screen.getByText(/61/)).toBeDefined();
  });

  it("says what happens to cards without price data", () => {
    // The note used to read "excluded", which stopped being true: the CSV now
    // lists unpriced cards at zero rather than dropping them from a buy list.
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText(/1 card has no known price/i)).toBeDefined();
    expect(screen.queryByText(/excluded/i)).toBeNull();
  });

  it("renders Download CSV button", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /download csv/i })).toBeDefined();
  });

  it("renders Copy to clipboard button", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    renderWithIntl(<PricingShoppingListModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop button is clicked", () => {
    const onClose = vi.fn();
    renderWithIntl(<PricingShoppingListModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close shopping list modal/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("sorts cards by total price descending", () => {
    renderWithIntl(<PricingShoppingListModal {...defaultProps} />);
    const rows = screen.getAllByRole("row");
    // Skip header row — first data row should be most expensive
    // Counterspell: 18*2=36, Rhystic Study: 25*1=25
    expect(rows[1].textContent).toContain("Counterspell");
  });
});
