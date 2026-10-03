import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { useCollectionStore } from "@/lib/collection/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { CollectionStatsPanel } from "./CollectionStatsPanel";
import { ShoppingListModal } from "./ShoppingListModal";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "owner" } } }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { readonly href: string; readonly children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const card: DeckCard = {
  id: "sol-ring",
  scryfallId: "sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "",
  colorIdentity: [],
  isGameChanger: false,
  isBanned: false,
  price: 1,
  imageUri: "",
  artCropUri: "",
  category: "artifact",
  quantity: 1,
  zone: "main",
};

const deck: Deck = {
  id: "deck-1",
  name: "Shared cards",
  commander: null,
  partner: null,
  companion: null,
  pairingType: "none",
  cards: [card],
  maybeboard: [],
  format: "commander",
  cardCount: 1,
  targetBracket: 1,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const initialCollectionState = useCollectionStore.getState();

afterEach(() => {
  cleanup();
  localStorage.clear();
  useCollectionStore.setState(initialCollectionState, true);
});

describe("CollectionStatsPanel", () => {
  it("sends owners to collection management instead of resetting shared inventory", () => {
    const removeFromCollection = vi.fn();
    const updateQuantity = vi.fn();
    useCollectionStore.setState({
      collectionCards: {
        "sol-ring": {
          id: "owned-1",
          scryfallId: "sol-ring",
          name: "Sol Ring",
          quantity: 1,
          foil: false,
          condition: null,
          acquiredAt: null,
          price: 1,
          imageUri: "",
          createdAt: new Date("2026-01-01"),
        },
      },
      collectionCardsFoil: {},
      removeFromCollection,
      updateQuantity,
    });

    renderWithIntl(<CollectionStatsPanel deck={deck} />);
    fireEvent.click(screen.getByRole("button", { name: /collection/i }));

    expect(screen.getByRole("link", { name: /manage collection/i })).toHaveAttribute("href", "/collection");
    expect(screen.queryByRole("button", { name: /^reset$/i })).not.toBeInTheDocument();
    expect(useCollectionStore.getState().collectionCards["sol-ring"].quantity).toBe(1);
    expect(removeFromCollection).not.toHaveBeenCalled();
    expect(updateQuantity).not.toHaveBeenCalled();
  });

  it("does not present missing prices as a zero-dollar estimate", () => {
    useCollectionStore.setState({ collectionCards: {}, collectionCardsFoil: {} });
    renderWithIntl(<CollectionStatsPanel deck={{ ...deck, cards: [{ ...card, price: null }] }} />);
    fireEvent.click(screen.getByRole("button", { name: /collection/i }));

    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument();
  });
});

describe("ShoppingListModal", () => {
  it("does not present all-unpriced shopping lists as a zero-dollar total", () => {
    renderWithIntl(
      <ShoppingListModal
        deck={{ ...deck, cards: [{ ...card, price: null }] }}
        ownedQuantities={{}}
        ownerId="owner"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument();
  });

  it("excludes deferred cards from the buy-now total without changing the deck", () => {
    const laterCard = { ...card, price: 5 };
    const nowCard = { ...card, id: "arcane-signat", scryfallId: "arcane-signat", name: "Arcane Signet", price: 10 };
    const plannedDeck = { ...deck, cards: [laterCard, nowCard] };

    renderWithIntl(<ShoppingListModal deck={plannedDeck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Buy later: Sol Ring" }));

    expect(screen.getByText("~$10.00")).toBeInTheDocument();
    expect(screen.queryByText(/\$15\.00/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy buy-now list" })).toBeEnabled();
    expect(plannedDeck.cards.map((entry) => entry.quantity)).toEqual([1, 1]);
  });

  it("disables buy-now exports when every missing card is deferred", () => {
    renderWithIntl(<ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Buy later: Sol Ring" }));

    expect(screen.getByText("No cards planned for now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy buy-now list" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export buy-now CSV" })).toBeDisabled();
  });

  it("copies only cards planned for now", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const nowCard = { ...card, id: "arcane-signat", scryfallId: "arcane-signat", name: "Arcane Signet" };
    renderWithIntl(
      <ShoppingListModal deck={{ ...deck, cards: [card, nowCard] }} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Buy later: Sol Ring" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy buy-now list" }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0]?.[0]).toContain("Arcane Signet");
    expect(writeText.mock.calls[0]?.[0]).not.toContain("Sol Ring");
  });

  it("restores deferred printings for the same owner and deck after reopening", async () => {
    const { unmount } = renderWithIntl(
      <ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Buy later: Sol Ring" }));
    unmount();

    renderWithIntl(<ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "Buy now: Sol Ring" })).toBeInTheDocument();
    expect(screen.getByText("No cards planned for now")).toBeInTheDocument();
  });

  it("keeps deferred printings separate across decks and owners", async () => {
    const { unmount } = renderWithIntl(
      <ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Buy later: Sol Ring" }));
    unmount();

    renderWithIntl(<ShoppingListModal deck={{ ...deck, id: "other-deck" }} ownedQuantities={{}} ownerId="owner" onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Buy later: Sol Ring" })).toBeInTheDocument();
    cleanup();

    renderWithIntl(<ShoppingListModal deck={deck} ownedQuantities={{}} ownerId="other-owner" onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Buy later: Sol Ring" })).toBeInTheDocument();
  });
});
