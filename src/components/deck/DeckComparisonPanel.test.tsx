import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckComparisonPanel } from "./DeckComparisonPanel";

const { mockFetchDeck } = vi.hoisted(() => ({ mockFetchDeck: vi.fn() }));
vi.mock("@/lib/db/deck-api", () => ({ fetchDeck: mockFetchDeck }));

describe("DeckComparisonPanel", () => {
  it("loads both selected decks and shows their differences", async () => {
    mockFetchDeck
      .mockResolvedValueOnce({
        cards: [
          { name: "Sol Ring", scryfallId: "sol-ring", quantity: 1 },
          { name: "Counterspell", scryfallId: "counterspell", quantity: 1 },
        ],
      })
      .mockResolvedValueOnce({
        cards: [
          { name: "Sol Ring", scryfallId: "sol-ring", quantity: 1 },
          { name: "Swords to Plowshares", scryfallId: "swords", quantity: 1 },
        ],
      });

    renderWithIntl(
      <DeckComparisonPanel
        decks={[
          { id: "deck-a", name: "Control" },
          { id: "deck-b", name: "Midrange" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Compare decks" }));

    await waitFor(() => expect(mockFetchDeck).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Counterspell")).toBeDefined();
    expect(screen.getByText("Swords to Plowshares")).toBeDefined();
    expect(screen.getByText("1 shared card")).toBeDefined();
  });
});
