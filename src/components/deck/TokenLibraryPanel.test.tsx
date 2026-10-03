import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { TokenLibraryPanel } from "./TokenLibraryPanel";

function card(oracleText: string): DeckCard {
  return {
    id: "card",
    scryfallId: "card",
    name: "Token Maker",
    manaCost: "",
    cmc: 3,
    typeLine: "Creature",
    oracleText,
    colorIdentity: ["W"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
  };
}

describe("TokenLibraryPanel", () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn() },
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn().mockReturnValue("blob:tokens"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("stays hidden when the deck requires no tokens", () => {
    const { container } = renderWithIntl(
      <TokenLibraryPanel cards={[card("Draw a card.")]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows copy and download actions for a required token", () => {
    renderWithIntl(
      <TokenLibraryPanel
        cards={[card("Create two 1/1 white Soldier creature tokens.")]}
      />
    );
    expect(screen.getByText(/Soldier/)).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Copy token checklist" })
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Download token checklist" })
    ).toBeDefined();
  });

  it("copies the portable checklist", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    renderWithIntl(
      <TokenLibraryPanel
        cards={[card("Create two 1/1 white Soldier creature tokens.")]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Copy token checklist" })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "2x 1/1 white Soldier token"
      );
    });
  });

  it("downloads the checklist as a text file", () => {
    renderWithIntl(
      <TokenLibraryPanel
        cards={[card("Create two 1/1 white Soldier creature tokens.")]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download token checklist" })
    );

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:tokens");
  });
});
