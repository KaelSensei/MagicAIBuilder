import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { MainZoneContent } from "./MainZoneContent";
import type { CardCategory, Deck, DeckCard } from "@/lib/deck/types";
import { groupCards, type CardGroup, type GroupBy } from "@/lib/deck/sort";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders } from "@/test/render";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: { role: "button", tabIndex: 0 },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: { role: "button", tabIndex: 0 },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: "vertical",
}));

function card(id: string, name: string, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id, name, manaCost: "{1}", cmc: 1, typeLine: "Artifact",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "https://cards.scryfall.io/normal/front/a/b/card.jpg", artCropUri: "",
    category: "artifact", quantity: 1, zone: "main", scryfallId: id,
    ...overrides,
  };
}

function deck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "d1", name: "Test", commander: null, partner: null, companion: null,
    pairingType: "none", cards: [], cardCount: 0, format: "commander",
    targetBracket: 2, manualBracket: null, budget: null, description: null,
    tags: [], isPublic: false, shareToken: null, createdAt: new Date(),
    updatedAt: new Date(), ...overrides,
  } as Deck;
}

function group(key: string, cards: DeckCard[]): CardGroup {
  return { key, label: key, cards } as CardGroup;
}

const baseProps = {
  deck: deck(),
  mainCards: [] as DeckCard[],
  gridCols: 4,
  cardGroups: [] as CardGroup[],
  violationCardIds: new Set<string>(),
  onRemoveCard: vi.fn(),
  clearCommander: vi.fn(),
  setPartner: vi.fn(),
  clearCompanion: vi.fn(),
};

describe("MainZoneContent", () => {
  it("changes a card category from its mobile-friendly category menu", () => {
    const onChangeCategory = vi.fn();
    renderWithIntl(
      <MainZoneContent
        {...baseProps}
        viewMode="list"
        cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
        onChangeCategory={onChangeCategory}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Change category for Sol Ring" }), {
      target: { value: "ramp" },
    });

    expect(onChangeCategory).toHaveBeenCalledWith("c1", "ramp");
  });

  it("keeps the category reorder handle keyboard-focusable", () => {
    renderWithIntl(
      <MainZoneContent
        {...baseProps}
        viewMode="list"
        cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
      />
    );

    expect(screen.getByRole("button", { name: /drag to reorder/i })).toHaveAttribute("tabindex", "0");
  });

  it("reveals the reorder handle when a keyboard user focuses it", () => {
    renderWithIntl(
      <MainZoneContent
        {...baseProps}
        viewMode="list"
        cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
      />
    );

    expect(screen.getByRole("button", { name: /drag to reorder/i }))
      .toHaveClass("focus-visible:opacity-100");
  });

  describe("grid view", () => {
    it("changes a card category without switching to list view", () => {
      const onChangeCategory = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          mainCards={[card("c1", "Sol Ring")]}
          onChangeCategory={onChangeCategory}
        />
      );

      fireEvent.change(screen.getByRole("combobox", { name: "Change category for Sol Ring" }), {
        target: { value: "ramp" },
      });

      expect(onChangeCategory).toHaveBeenCalledWith("c1", "ramp");
    });

    it("invites the first card when the deck is empty and has no commander", () => {
      renderWithIntl(<MainZoneContent {...baseProps} viewMode="grid" />);
      expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
    });

    it("does not show the empty state once a commander is set", () => {
      // The commander occupies the grid even with zero main-deck cards, so the
      // "nothing here" message would be wrong.
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          deck={deck({ commander: card("cmd", "Atraxa") })}
        />
      );
      expect(screen.queryByText(/no cards yet/i)).not.toBeInTheDocument();
    });

    it("moves a card to considering without requiring drag and drop", () => {
      const onMoveToMaybeboard = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          mainCards={[card("c1", "Sol Ring")]}
          onMoveToMaybeboard={onMoveToMaybeboard}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /move.*considering/i }));

      expect(onMoveToMaybeboard).toHaveBeenCalledWith("c1");
    });

    it("moves a card to the sideboard without requiring drag and drop", () => {
      const onMoveToSideboard = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          mainCards={[card("c1", "Sol Ring")]}
          onMoveToSideboard={onMoveToSideboard}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /move sol ring.*sideboard/i }));

      expect(onMoveToSideboard).toHaveBeenCalledWith("c1");
    });

    it("keeps both move controls visible on touch devices", () => {
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          mainCards={[card("c1", "Sol Ring")]}
        />
      );

      expect(screen.getByRole("button", { name: /move.*considering/i }))
        .toHaveClass("[@media(hover:none)]:opacity-100");
      expect(screen.getByRole("button", { name: /move sol ring.*sideboard/i }))
        .toHaveClass("[@media(hover:none)]:opacity-100");
    });

    it("keeps card removal visible on touch devices", () => {
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="grid"
          mainCards={[card("c1", "Sol Ring")]}
        />
      );

      expect(screen.getByRole("button", { name: "Remove Sol Ring" }))
        .toHaveClass("[@media(hover:none)]:opacity-100");
    });
  });

  describe("list view", () => {
    it("changes a card category while grouped by mana value", () => {
      const onChangeCategory = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          cardGroups={[group("mana-value-1", [card("c1", "Sol Ring")])]}
          onChangeCategory={onChangeCategory}
        />
      );

      fireEvent.change(screen.getByRole("combobox", { name: "Change category for Sol Ring" }), {
        target: { value: "ramp" },
      });

      expect(onChangeCategory).toHaveBeenCalledWith("c1", "ramp");
    });

    it("renders each group's cards", () => {
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          mainCards={[card("c1", "Sol Ring")]}
          cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
        />
      );
      expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    });

    it("renders several groups side by side", () => {
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          cardGroups={[
            group("artifact", [card("c1", "Sol Ring")]),
            group("instant", [card("c2", "Counterspell", { category: "instant" })]),
          ]}
        />
      );
      expect(screen.getByText("Sol Ring")).toBeInTheDocument();
      expect(screen.getByText("Counterspell")).toBeInTheDocument();
    });

    it("moves a listed card to considering without requiring drag and drop", () => {
      const onMoveToMaybeboard = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
          onMoveToMaybeboard={onMoveToMaybeboard}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /move sol ring.*considering/i }));

      expect(onMoveToMaybeboard).toHaveBeenCalledWith("c1");
    });

    it("moves a listed card to the sideboard without requiring drag and drop", () => {
      const onMoveToSideboard = vi.fn();
      renderWithIntl(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          cardGroups={[group("artifact", [card("c1", "Sol Ring")])]}
          onMoveToSideboard={onMoveToSideboard}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /move sol ring.*sideboard/i }));

      expect(onMoveToSideboard).toHaveBeenCalledWith("c1");
    });

    it("renders nothing rather than crashing when there are no groups", () => {
      const { container } = renderWithIntl(
        <MainZoneContent {...baseProps} viewMode="list" />
      );
      expect(container).toBeTruthy();
    });
  });

  describe("group price subtotal (I-32)", () => {
    function renderGrouped(cards: DeckCard[], groupBy: GroupBy) {
      return renderWithProviders(
        <MainZoneContent
          {...baseProps}
          viewMode="list"
          mainCards={cards}
          cardGroups={groupCards(cards, groupBy)}
        />
      );
    }

    /** A row named after its id, so each test reads as a decklist. */
    function aRow(name: string, category: CardCategory, price: number | null) {
      return aDeckCard({ id: name, name, category, price });
    }

    it("shows the Creature heading's subtotal of a deck grouped by type", () => {
      const creatures = [
        aRow("Craterhoof Behemoth", "creature", 120.1),
        aRow("Dockside Extortionist", "creature", 15),
        { ...aRow("Llanowar Elves", "creature", 0.25), quantity: 28 },
      ];

      renderGrouped(creatures, "type");

      const heading = screen.getByRole("button", { name: /^creature/i });
      expect(heading).toHaveTextContent(/30\s*·\s*USD\s142\.10/);
      expect(heading).toHaveAccessibleName(/creature.*30.*subtotal.*142\.10/i);
    });

    it("shows the known subtotal and the cards without a price", () => {
      const instants = [
        aRow("Swords to Plowshares", "instant", 12.4),
        aRow("Promo Bolt", "instant", null),
        aRow("Promo Counterspell", "instant", null),
      ];

      renderGrouped(instants, "type");

      const heading = screen.getByRole("button", { name: /^instant/i });
      expect(heading).toHaveTextContent(/USD\s12\.40 · 2 without price/);
      expect(heading).toHaveAccessibleName(
        /known subtotal.*12\.40, 2 cards without price/i
      );
    });

    it("shows 'no price' when no card of the group is priced", () => {
      const sorceries = [
        aRow("Promo Wrath", "sorcery", null),
        aRow("Promo Tutor", "sorcery", null),
      ];

      renderGrouped(sorceries, "type");

      const heading = screen.getByRole("button", { name: /^sorcer/i });
      expect(heading).toHaveTextContent("· no price");
      expect(heading).not.toHaveTextContent(/USD/);
    });

    it("shows the subtotal under the mana-value grouping too", () => {
      const twoDrops = [
        { ...aRow("Arcane Signet", "artifact", 1.5), cmc: 2 },
        { ...aRow("Fellwar Stone", "artifact", 0.75), cmc: 2 },
      ];

      renderGrouped(twoDrops, "cmc");

      const heading = screen.getByRole("button", { name: /^2 CMC/ });
      expect(heading).toHaveAccessibleName(/2 CMC.*2.*subtotal.*2\.25/i);
    });

    it("shows one subtotal for the whole list when nothing groups it", () => {
      const cards = [
        aRow("Sol Ring", "artifact", 2),
        aRow("Counterspell", "instant", 1),
      ];

      renderGrouped(cards, "none");

      const heading = screen.getByRole("button", { name: /^all cards/i });
      expect(heading).toHaveAccessibleName(/subtotal.*3\.00/i);
    });
  });
});
