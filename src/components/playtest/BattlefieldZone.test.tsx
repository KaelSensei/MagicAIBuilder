import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { BattlefieldZone } from "./BattlefieldZone";
import type { BattlefieldCard } from "@/lib/playtest/engine";

function makePermanent(id: string, name = "Creature", tapped = false): BattlefieldCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "creature", quantity: 1, zone: "main", scryfallId: id,
    tapped, counters: 0,
  };
}

describe("BattlefieldZone", () => {
  const defaultProps = {
    battlefield: [makePermanent("p1", "Rhystic Study"), makePermanent("p2", "Sol Ring")],
    onTap: vi.fn(),
    onAddCounter: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders all permanents on the battlefield", () => {
    renderWithIntl(<BattlefieldZone {...defaultProps} />);
    expect(screen.getByText("Rhystic Study")).toBeDefined();
    expect(screen.getByText("Sol Ring")).toBeDefined();
  });

  it("shows tap button for each permanent", () => {
    renderWithIntl(<BattlefieldZone {...defaultProps} />);
    const tapButtons = screen.getAllByRole("button", { name: /tap/i });
    expect(tapButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onTap with card id when Tap is clicked", () => {
    const onTap = vi.fn();
    renderWithIntl(<BattlefieldZone {...defaultProps} onTap={onTap} />);
    const tapButtons = screen.getAllByRole("button", { name: /tap/i });
    fireEvent.click(tapButtons[0]);
    expect(onTap).toHaveBeenCalledWith("p1");
  });

  it("shows tapped state visually (aria or data attribute)", () => {
    const tapped = [makePermanent("p1", "Tapped Card", true)];
    renderWithIntl(<BattlefieldZone {...defaultProps} battlefield={tapped} />);
    const card = screen.getByTestId("battlefield-card-p1");
    expect(card.getAttribute("data-tapped")).toBe("true");
  });

  it("shows counter value for each permanent", () => {
    const withCounters = [{ ...makePermanent("p1"), counters: 3 }];
    renderWithIntl(<BattlefieldZone {...defaultProps} battlefield={withCounters} />);
    expect(screen.getByText(/3/)).toBeDefined();
  });

  it("calls onAddCounter with +1 when + counter is clicked", () => {
    const onAddCounter = vi.fn();
    renderWithIntl(<BattlefieldZone {...defaultProps} onAddCounter={onAddCounter} />);
    const addBtn = screen.getAllByRole("button", { name: /\+1/i })[0];
    fireEvent.click(addBtn);
    expect(onAddCounter).toHaveBeenCalledWith("p1", 1);
  });

  it("calls onRemove when Remove is clicked", () => {
    const onRemove = vi.fn();
    renderWithIntl(<BattlefieldZone {...defaultProps} onRemove={onRemove} />);
    const removeBtn = screen.getAllByRole("button", { name: /remove/i })[0];
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith("p1");
  });

  it("shows empty state when battlefield is empty", () => {
    renderWithIntl(<BattlefieldZone {...defaultProps} battlefield={[]} />);
    expect(screen.getByText(/no permanents/i)).toBeDefined();
  });
});
