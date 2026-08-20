import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { SecondaryZoneContent } from "./SecondaryZoneContent";
import type { DeckCard } from "@/lib/deck/types";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

function card(id: string, name: string): DeckCard {
  return {
    id, name, manaCost: "{1}", cmc: 1, typeLine: "Artifact",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "artifact", quantity: 1, zone: "sideboard", scryfallId: id,
  };
}

const baseProps = {
  cards: [card("c1", "Sol Ring")],
  viewMode: "list" as const,
  gridCols: 4,
  onRemoveCard: vi.fn(),
  moveCardToZone: vi.fn(),
};

describe("SecondaryZoneContent", () => {
  it("shows the zone's own empty message rather than a generic one", () => {
    renderWithIntl(
      <SecondaryZoneContent {...baseProps} zone="maybeboard" cards={[]} />
    );
    expect(screen.getByText(/considering/i)).toBeInTheDocument();
  });

  /**
   * The move buttons are the zone-dependent part: a card can always go to the
   * main deck, and otherwise to *the other* secondary zone — never to the one
   * it is already in.
   */
  describe("move targets", () => {
    it("offers main and considering from the sideboard", () => {
      renderWithIntl(<SecondaryZoneContent {...baseProps} zone="sideboard" />);

      expect(screen.getByText("→ Main")).toBeInTheDocument();
      expect(screen.getByText("→ Considering")).toBeInTheDocument();
      expect(screen.queryByText("→ Sideboard")).not.toBeInTheDocument();
    });

    it("offers main and sideboard from considering", () => {
      renderWithIntl(<SecondaryZoneContent {...baseProps} zone="maybeboard" />);

      expect(screen.getByText("→ Main")).toBeInTheDocument();
      expect(screen.getByText("→ Sideboard")).toBeInTheDocument();
      expect(screen.queryByText("→ Considering")).not.toBeInTheDocument();
    });

    it("moves the clicked card to the chosen zone", () => {
      const moveCardToZone = vi.fn();
      renderWithIntl(
        <SecondaryZoneContent {...baseProps} zone="sideboard" moveCardToZone={moveCardToZone} />
      );

      fireEvent.click(screen.getByText("→ Considering"));

      expect(moveCardToZone).toHaveBeenCalledWith("c1", "maybeboard");
    });
  });

  it("renders every card in the zone", () => {
    renderWithIntl(
      <SecondaryZoneContent
        {...baseProps}
        zone="sideboard"
        cards={[card("c1", "Sol Ring"), card("c2", "Counterspell")]}
      />
    );

    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByText("Counterspell")).toBeInTheDocument();
  });
});
