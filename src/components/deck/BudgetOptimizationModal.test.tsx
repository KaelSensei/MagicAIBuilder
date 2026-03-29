import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetOptimizationModal } from "./BudgetOptimizationModal";
import type { DeckCard } from "@/lib/deck/types";
import type { BudgetSuggestion } from "@/lib/deck/pricing";

function makeCard(id: string, name: string, price: number): DeckCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Enchantment",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price, imageUri: "", artCropUri: "",
    category: "enchantment", quantity: 1, zone: "main", scryfallId: id,
  };
}

function makeSuggestion(id: string, name: string, price: number, savings: number): BudgetSuggestion {
  return {
    cardToReplace: makeCard(id, name, price),
    suggestedReplacement: `${name} (budget)`,
    currentPrice: price,
    suggestedPrice: price - savings,
    savingsAmount: savings,
  };
}

describe("BudgetOptimizationModal", () => {
  const defaultProps = {
    isOpen: true,
    totalPrice: 450,
    targetBudget: 300,
    suggestions: [
      makeSuggestion("c1", "Rhystic Study", 25, 23),
      makeSuggestion("c2", "Counterspell", 18, 17),
    ],
    onApplySuggestion: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders the modal when open", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    expect(screen.getByText(/budget optimization/i)).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<BudgetOptimizationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/budget optimization/i)).toBeNull();
  });

  it("shows current deck price and target budget", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    expect(screen.getByText(/450/)).toBeDefined();
    expect(screen.getByText(/300/)).toBeDefined();
  });

  it("lists each suggestion with card name and savings", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    expect(screen.getByText("Rhystic Study")).toBeDefined();
    expect(screen.getByText("Counterspell")).toBeDefined();
  });

  it("shows savings amount for each suggestion", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    expect(screen.getByText(/save.*23|23.*save/i)).toBeDefined();
  });

  it("renders Apply button for each suggestion", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    const applyBtns = screen.getAllByRole("button", { name: /apply/i });
    expect(applyBtns).toHaveLength(2);
  });

  it("calls onApplySuggestion with card id when Apply is clicked", () => {
    const onApplySuggestion = vi.fn();
    render(<BudgetOptimizationModal {...defaultProps} onApplySuggestion={onApplySuggestion} />);
    const [firstApply] = screen.getAllByRole("button", { name: /apply/i });
    fireEvent.click(firstApply);
    expect(onApplySuggestion).toHaveBeenCalledWith("c1");
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<BudgetOptimizationModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows empty state when no suggestions", () => {
    render(<BudgetOptimizationModal {...defaultProps} suggestions={[]} />);
    expect(screen.getByText(/budget goal reached|no suggestions/i)).toBeDefined();
  });

  it("shows total potential savings", () => {
    render(<BudgetOptimizationModal {...defaultProps} />);
    // 23 + 17 = 40 total savings
    expect(screen.getByText(/40/)).toBeDefined();
  });
});
