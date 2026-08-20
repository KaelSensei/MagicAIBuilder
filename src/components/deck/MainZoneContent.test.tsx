import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
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
    attributes: {},
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
    isBanned: false, price: null, imageUri: "", artCropUri: "",
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

    it("renders nothing rather than crashing when there are no groups", () => {
      const { container } = renderWithIntl(
        <MainZoneContent {...baseProps} viewMode="list" />
      );
      expect(container).toBeTruthy();
    });
  });
});
