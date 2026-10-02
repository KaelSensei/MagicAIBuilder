import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { useCollectionStore } from "@/lib/collection/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { CollectionStatsPanel } from "./CollectionStatsPanel";

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
});
