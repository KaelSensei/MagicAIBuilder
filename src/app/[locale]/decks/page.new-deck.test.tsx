import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

const createDeck = vi.hoisted(() => vi.fn(async (_name: string) => "deck-1"));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
}));
vi.mock(import("next/navigation"), () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));
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
vi.mock(import("@/components/layout/Header"), () => ({ Header: () => <></> }));
vi.mock(import("@/components/layout/Footer"), () => ({ Footer: () => <></> }));
vi.mock(import("@/components/deck/DeckWizard"), () => ({
  DeckWizard: () => <></>,
}));
vi.mock(import("@/components/deck/DecksHomeControls"), () => ({
  DecksHomeControls: () => <></>,
}));
vi.mock(import("@/components/deck/DeckFolderControls"), () => ({
  DeckFolderControls: () => <></>,
}));
vi.mock(import("@/components/deck/DeckComparisonPanel"), () => ({
  DeckComparisonPanel: () => null,
}));
vi.mock(import("@/components/deck/HomeDeckCard"), () => ({
  HomeDeckCard: () => <></>,
}));
vi.mock(import("@/components/deck/DeckListTable"), () => ({
  DeckListTable: () => <></>,
}));
vi.mock(import("@/components/deck/DeckListRefreshNotice"), () => ({
  DeckListRefreshNotice: () => <></>,
}));
vi.mock(import("@/components/deck/GuestDeckClaimOffer"), () => ({
  GuestDeckClaimOffer: () => null,
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
