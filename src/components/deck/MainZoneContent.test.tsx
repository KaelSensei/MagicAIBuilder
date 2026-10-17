import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { MainZoneContent } from "./MainZoneContent";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { CardGroup } from "@/lib/deck/sort";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
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

  describe("grid view", () => {
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
});
