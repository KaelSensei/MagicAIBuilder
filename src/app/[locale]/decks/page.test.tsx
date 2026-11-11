import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const loadDecks = vi.hoisted(() => vi.fn());

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
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/lib/deck/store", () => ({
  useDeckStore: () => ({
    decks: {},
    createDeck: vi.fn(),
    loadDecks,
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
vi.mock(import("@/components/deck/DeckWizard"), () => ({ DeckWizard: () => <></> }));
vi.mock(import("@/components/deck/DecksHomeControls"), () => ({ DecksHomeControls: () => <></> }));
vi.mock(import("@/components/deck/DeckFolderControls"), () => ({ DeckFolderControls: () => <></> }));
vi.mock(import("@/components/deck/DeckComparisonPanel"), () => ({ DeckComparisonPanel: () => null }));
vi.mock(import("@/components/deck/HomeDeckCard"), () => ({ HomeDeckCard: () => <></> }));
vi.mock(import("@/components/deck/DeckListTable"), () => ({ DeckListTable: () => <></> }));
vi.mock(import("@/components/deck/DeckListRefreshNotice"), () => ({ DeckListRefreshNotice: () => <></> }));
vi.mock(import("@/components/deck/GuestDeckClaimOffer"), () => ({
  GuestDeckClaimOffer: () => null,
}));

import DecksPage from "./page";

it("shows the empty deck state instead of loading forever for a signed-out visitor", () => {
  render(<DecksPage />);

  expect(screen.getByText("home.startBuilding")).toBeInTheDocument();
  expect(screen.queryByText("home.loading")).not.toBeInTheDocument();
  expect(loadDecks).not.toHaveBeenCalled();
});
