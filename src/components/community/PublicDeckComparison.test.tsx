import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { PublicDeckComparison } from "./PublicDeckComparison";

const cardsByDeck = {
  "deck-a": [
    {
      name: "Sol Ring",
      quantity: 1,
      cmc: 1,
      price: 2,
      colorIdentity: [],
      category: "ramp",
    },
  ],
  "deck-b": [
    {
      name: "Rhystic Study",
      quantity: 1,
      cmc: 3,
      price: 40,
      colorIdentity: ["U"],
      category: "draw",
    },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe("PublicDeckComparison", () => {
  it("compares two decks through the public deck endpoint", async () => {
    const fetchMock = vi.fn((url: string) => {
      const id = url.endsWith("deck-a") ? "deck-a" : "deck-b";
      return Promise.resolve({
        ok: true,
        json: async () => ({ cards: cardsByDeck[id] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(
      <PublicDeckComparison
        decks={[
          { id: "deck-a", name: "Ramp" },
          { id: "deck-b", name: "Value" },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Compare decks" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith("/api/deck/deck-a");
    expect(fetchMock).toHaveBeenCalledWith("/api/deck/deck-b");
    expect(await screen.findByText("Role differences")).toBeDefined();
  });

  it("stays hidden when fewer than two public decks are available", () => {
    const { container } = renderWithIntl(
      <PublicDeckComparison decks={[{ id: "deck-a", name: "Only deck" }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
