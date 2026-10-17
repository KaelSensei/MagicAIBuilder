import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const loadDecks = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
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
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/deck/DeckWizard", () => ({ DeckWizard: () => null }));
vi.mock("@/components/deck/DecksHomeControls", () => ({ DecksHomeControls: () => null }));
vi.mock("@/components/deck/DeckFolderControls", () => ({ DeckFolderControls: () => null }));
vi.mock("@/components/deck/DeckComparisonPanel", () => ({ DeckComparisonPanel: () => null }));
vi.mock("@/components/deck/HomeDeckCard", () => ({ HomeDeckCard: () => null }));
vi.mock("@/components/deck/DeckListTable", () => ({ DeckListTable: () => null }));
vi.mock("@/components/deck/DeckListRefreshNotice", () => ({ DeckListRefreshNotice: () => null }));

import DecksPage from "./page";

it("shows the empty deck state instead of loading forever for a signed-out visitor", () => {
  render(<DecksPage />);

  expect(screen.getByText("home.startBuilding")).toBeInTheDocument();
  expect(screen.queryByText("home.loading")).not.toBeInTheDocument();
  expect(loadDecks).not.toHaveBeenCalled();
});
