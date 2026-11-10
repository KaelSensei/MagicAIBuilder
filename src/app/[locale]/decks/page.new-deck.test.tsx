import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

const createDeck = vi.hoisted(() => vi.fn(async (_name: string) => "deck-1"));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/deck/store", () => ({
  useDeckStore: () => ({
    decks: {},
    createDeck,
    loadDecks: vi.fn(),
    isSyncing: false,
    deleteDeck: vi.fn(),
    duplicateDeck: vi.fn(),
    loadError: null,
  }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToastStore: () => vi.fn(),
}));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/deck/DeckWizard", () => ({ DeckWizard: () => null }));
vi.mock("@/components/deck/DecksHomeControls", () => ({
  DecksHomeControls: () => null,
}));
vi.mock("@/components/deck/DeckFolderControls", () => ({
  DeckFolderControls: () => null,
}));
vi.mock("@/components/deck/DeckComparisonPanel", () => ({
  DeckComparisonPanel: () => null,
}));
vi.mock("@/components/deck/HomeDeckCard", () => ({ HomeDeckCard: () => null }));
vi.mock("@/components/deck/DeckListTable", () => ({
  DeckListTable: () => null,
}));
vi.mock("@/components/deck/DeckListRefreshNotice", () => ({
  DeckListRefreshNotice: () => null,
}));

import DecksPage from "./page";

// The numbered default name was the English template `New Deck ${n}`, stored
// as the deck's name whatever language its creator used.
it("names a new deck in the creator's locale", async () => {
  renderWithIntl(<DecksPage />, { locale: "fr" });

  fireEvent.click(screen.getByRole("button", { name: "Créer un deck" }));

  await waitFor(() =>
    expect(createDeck).toHaveBeenCalledWith("Nouveau deck 1")
  );
});
