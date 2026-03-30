import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    render(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText(/shopping list/i)).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<PricingShoppingListModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/shopping list/i)).toBeNull();
  });

  it("lists cards with names and prices", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText("Rhystic Study")).toBeDefined();
    expect(screen.getByText("Counterspell")).toBeDefined();
  });

  it("shows the deck subtotal", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    // 25 + 36 (18*2) = 61
    expect(screen.getByText(/61/)).toBeDefined();
  });

  it("shows count of cards without price data", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByText(/1 card.*unknown price|unknown price.*1 card/i)).toBeDefined();
  });

  it("renders Download CSV button", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /download csv/i })).toBeDefined();
  });

  it("renders Copy to clipboard button", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<PricingShoppingListModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop button is clicked", () => {
    const onClose = vi.fn();
    render(<PricingShoppingListModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close shopping list modal/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("sorts cards by total price descending", () => {
    render(<PricingShoppingListModal {...defaultProps} />);
    const rows = screen.getAllByRole("row");
    // Skip header row — first data row should be most expensive
    // Counterspell: 18*2=36, Rhystic Study: 25*1=25
    expect(rows[1].textContent).toContain("Counterspell");
  });
});
