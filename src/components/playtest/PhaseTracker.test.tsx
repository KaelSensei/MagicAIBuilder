import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { PhaseTracker } from "./PhaseTracker";

describe("PhaseTracker", () => {
  const defaultProps = {
    turn: 1,
    phase: "Draw" as const,
    onNextPhase: vi.fn(),
    onNextTurn: vi.fn(),
  };

  it("displays the current turn", () => {
    renderWithIntl(<PhaseTracker {...defaultProps} />);
    expect(screen.getByText(/turn 1/i)).toBeDefined();
  });

  it("displays all 7 phases", () => {
    renderWithIntl(<PhaseTracker {...defaultProps} />);
    expect(screen.getAllByText(/untap/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/upkeep/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/draw/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/main 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/combat/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/main 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/end/i).length).toBeGreaterThan(0);
  });

  it("renders Next Phase and Next Turn buttons", () => {
    renderWithIntl(<PhaseTracker {...defaultProps} />);
    expect(screen.getByRole("button", { name: /next phase/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /next turn/i })).toBeDefined();
  });

  it("calls onNextPhase when Next Phase is clicked", () => {
    const onNextPhase = vi.fn();
    renderWithIntl(<PhaseTracker {...defaultProps} onNextPhase={onNextPhase} />);
    fireEvent.click(screen.getByRole("button", { name: /next phase/i }));
    expect(onNextPhase).toHaveBeenCalledOnce();
  });

  it("calls onNextTurn when Next Turn is clicked", () => {
    const onNextTurn = vi.fn();
    renderWithIntl(<PhaseTracker {...defaultProps} onNextTurn={onNextTurn} />);
    fireEvent.click(screen.getByRole("button", { name: /next turn/i }));
    expect(onNextTurn).toHaveBeenCalledOnce();
  });

  it("highlights the current phase", () => {
    renderWithIntl(<PhaseTracker {...defaultProps} phase="Combat" />);
    // Current phase is highlighted with aria-current or data attribute
    const combat = screen.getByTestId("phase-Combat");
    expect(combat.getAttribute("data-active")).toBe("true");
  });
});
