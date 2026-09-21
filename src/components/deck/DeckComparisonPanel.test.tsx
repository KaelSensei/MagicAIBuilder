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
          {
            name: "Sol Ring",
            scryfallId: "sol-ring",
            quantity: 1,
            cmc: 1,
            price: 2,
            colorIdentity: [],
          },
          {
            name: "Counterspell",
            scryfallId: "counterspell",
            quantity: 1,
            cmc: 2,
            price: 1,
            colorIdentity: ["U"],
          },
        ],
      })
      .mockResolvedValueOnce({
        cards: [
          {
            name: "Sol Ring",
            scryfallId: "sol-ring",
            quantity: 1,
            cmc: 1,
            price: 2,
            colorIdentity: [],
          },
          {
            name: "Swords to Plowshares",
            scryfallId: "swords",
            quantity: 1,
            cmc: 1,
            price: 3,
            colorIdentity: ["W"],
          },
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
    expect(screen.getByText("Average mana value")).toBeDefined();
    expect(screen.getByText("1.5 → 1")).toBeDefined();
    expect(screen.getByText("Estimated price")).toBeDefined();
    expect(screen.getByText("$3.00 → $5.00")).toBeDefined();
    expect(screen.getByText("Unique colors")).toBeDefined();
    expect(screen.getByText("U → W")).toBeDefined();
  });
});
