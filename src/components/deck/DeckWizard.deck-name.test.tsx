import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

const store = vi.hoisted(() => ({
  createDeck: vi.fn(
    async (_name: string, _options?: { isAIGenerated?: boolean }) => "deck-ai"
  ),
  setActiveDeck: vi.fn(async (_id: string) => undefined),
  addDeckCard: vi.fn(async () => undefined),
  setCommander: vi.fn(async () => undefined),
}));

// Stable references: the wizard resets the build whenever `reset` changes.
const aiBuild = vi.hoisted(() => ({
  state: {
    statusMessages: [],
    commander: null,
    cards: [],
    totalCards: null,
    source: null,
    isLoading: false,
    error: null,
  },
  build: vi.fn(async () => ({ commander: null, cards: [], source: "demo" })),
  reset: vi.fn(),
}));

vi.mock("@/lib/deck/store", () => ({ useDeckStore: () => store }));
vi.mock("@/hooks/useAIDeckBuild", () => ({
  useAIDeckBuild: () => aiBuild,
  countCopies: () => 0,
}));

/** Walks the French wizard to its last step with the Control strategy. */
async function openFrenchPlanStep() {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />,
    { locale: "fr" }
  );
  const next = () =>
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

  fireEvent.click(screen.getByRole("button", { name: "Budget < 50 $" }));
  next();
  fireEvent.click(await screen.findByRole("button", { name: "Bleu" }));
  next();
  fireEvent.click(
    await screen.findByRole("button", { name: /Contrôle Contrer et contrôler/ })
  );
  next();
  fireEvent.click(
    await screen.findByRole("button", { name: /Amélioré \(bracket 3\)/ })
  );
  next();
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: /Amélioré/ })).toBeNull()
  );
  next();
  return screen.findByRole("button", { name: "Générer le deck" });
}

// The deck was stored as `AI Deck — ${strategy}`, mixing English with the
// strategy's English id ("Control") for a creator browsing in French.
it("names the generated deck in the creator's locale", async () => {
  fireEvent.click(await openFrenchPlanStep());

  await waitFor(() =>
    expect(store.createDeck).toHaveBeenCalledWith("Deck IA — Contrôle", {
      isAIGenerated: true,
    })
  );
});
