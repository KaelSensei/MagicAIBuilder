import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LifeTracker } from "./LifeTracker";

describe("LifeTracker", () => {
  const defaultProps = {
    lifeTotal: 40,
    lifeHistory: [],
    onDamage: vi.fn(),
    onHeal: vi.fn(),
    onUndo: vi.fn(),
  };

  it("displays the current life total prominently", () => {
    render(<LifeTracker {...defaultProps} />);
    expect(screen.getByText("40")).toBeDefined();
  });

  it("renders +1, -1, +5, -5 buttons", () => {
    render(<LifeTracker {...defaultProps} />);
    expect(screen.getByRole("button", { name: "+1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "-1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "+5" })).toBeDefined();
    expect(screen.getByRole("button", { name: "-5" })).toBeDefined();
  });

  it("calls onHeal with 1 when +1 is clicked", () => {
    const onHeal = vi.fn();
    render(<LifeTracker {...defaultProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByRole("button", { name: "+1" }));
    expect(onHeal).toHaveBeenCalledWith(1);
  });

  it("calls onDamage with 1 when -1 is clicked", () => {
    const onDamage = vi.fn();
    render(<LifeTracker {...defaultProps} onDamage={onDamage} />);
    fireEvent.click(screen.getByRole("button", { name: "-1" }));
    expect(onDamage).toHaveBeenCalledWith(1);
  });

  it("calls onHeal with 5 when +5 is clicked", () => {
    const onHeal = vi.fn();
    render(<LifeTracker {...defaultProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByRole("button", { name: "+5" }));
    expect(onHeal).toHaveBeenCalledWith(5);
  });

  it("calls onDamage with 5 when -5 is clicked", () => {
    const onDamage = vi.fn();
    render(<LifeTracker {...defaultProps} onDamage={onDamage} />);
    fireEvent.click(screen.getByRole("button", { name: "-5" }));
    expect(onDamage).toHaveBeenCalledWith(5);
  });

  it("shows Game Over when life is 0 or below", () => {
    render(<LifeTracker {...defaultProps} lifeTotal={0} />);
    expect(screen.getByText(/game over/i)).toBeDefined();
  });

  it("shows life history entries when provided", () => {
    const history = [
      { turn: 1, phase: "Main1" as const, timestamp: Date.now(), delta: -5, description: "damage" },
    ];
    render(<LifeTracker {...defaultProps} lifeHistory={history} />);
    expect(screen.getAllByText(/-5/).length).toBeGreaterThan(0);
  });
});
