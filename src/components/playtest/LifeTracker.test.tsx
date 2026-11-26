import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
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
    renderWithIntl(<LifeTracker {...defaultProps} />);
    expect(screen.getByText("40")).toBeDefined();
  });

  it("renders +1, -1, +5, -5 buttons", () => {
    renderWithIntl(<LifeTracker {...defaultProps} />);
    expect(screen.getByRole("button", { name: "+1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "-1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "+5" })).toBeDefined();
    expect(screen.getByRole("button", { name: "-5" })).toBeDefined();
  });

  it("calls onHeal with 1 when +1 is clicked", () => {
    const onHeal = vi.fn();
    renderWithIntl(<LifeTracker {...defaultProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByRole("button", { name: "+1" }));
    expect(onHeal).toHaveBeenCalledWith(1);
  });

  it("calls onDamage with 1 when -1 is clicked", () => {
    const onDamage = vi.fn();
    renderWithIntl(<LifeTracker {...defaultProps} onDamage={onDamage} />);
    fireEvent.click(screen.getByRole("button", { name: "-1" }));
    expect(onDamage).toHaveBeenCalledWith(1);
  });

  it("calls onHeal with 5 when +5 is clicked", () => {
    const onHeal = vi.fn();
    renderWithIntl(<LifeTracker {...defaultProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByRole("button", { name: "+5" }));
    expect(onHeal).toHaveBeenCalledWith(5);
  });

  it("calls onDamage with 5 when -5 is clicked", () => {
    const onDamage = vi.fn();
    renderWithIntl(<LifeTracker {...defaultProps} onDamage={onDamage} />);
    fireEvent.click(screen.getByRole("button", { name: "-5" }));
    expect(onDamage).toHaveBeenCalledWith(5);
  });

  // The engine refuses negative damage (CR 107.1b); the tracker never sends one: a typed
  // negative amount is damage of its absolute value.
  it("sends a typed -4 as damage of 4, never as a negative amount", () => {
    const onDamage = vi.fn();
    const onHeal = vi.fn();
    renderWithIntl(
      <LifeTracker {...defaultProps} onDamage={onDamage} onHeal={onHeal} />
    );

    fireEvent.change(screen.getByPlaceholderText("+/- amount"), {
      target: { value: "-4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onDamage).toHaveBeenCalledWith(4);
    expect(onHeal).not.toHaveBeenCalled();
  });

  // WCAG 2.2 SC 1.3.1 and 4.1.2 (I-04 accessibility bundle 4): a placeholder
  // is not a name, so the custom life amount field carries its own.
  it("names the custom life amount field for a screen reader and keeps the hint as its placeholder", () => {
    renderWithIntl(<LifeTracker {...defaultProps} />);

    expect(
      screen.getByRole("spinbutton", { name: "Life to gain or lose" })
    ).toHaveAttribute("placeholder", "+/- amount");
  });

  it("names the custom life amount field in French", () => {
    renderWithIntl(<LifeTracker {...defaultProps} />, { locale: "fr" });

    expect(
      screen.getByRole("spinbutton", {
        name: "Points de vie à gagner ou à perdre",
      })
    ).toBeInTheDocument();
  });

  it("shows Game Over when life is 0 or below", () => {
    renderWithIntl(<LifeTracker {...defaultProps} lifeTotal={0} />);
    expect(screen.getByText(/game over/i)).toBeDefined();
  });

  it("drops Game Over once a heal brings life back above zero (CR 704.5a)", () => {
    const { rerender } = renderWithIntl(
      <LifeTracker {...defaultProps} lifeTotal={0} />
    );

    rerender(<LifeTracker {...defaultProps} lifeTotal={1} />);

    expect(screen.queryByText(/game over/i)).toBeNull();
  });

  it("shows life history entries when provided", () => {
    const history = [
      { turn: 1, phase: "Main1" as const, timestamp: Date.now(), delta: -5, description: "damage" },
    ];
    renderWithIntl(<LifeTracker {...defaultProps} lifeHistory={history} />);
    expect(screen.getAllByText(/-5/).length).toBeGreaterThan(0);
  });
});
