import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aDeckCard } from "@/test/builders/card";
import type { DeckCard } from "@/lib/deck/types";
import { TokenLibraryPanel } from "./TokenLibraryPanel";

const PALACE_JAILER = aDeckCard({
  id: "palace-jailer",
  name: "Palace Jailer",
  oracleText:
    "When Palace Jailer enters, you become the monarch.\nWhen Palace Jailer enters, exile target creature an opponent controls until an opponent becomes the monarch.",
});
const QUEEN_MARCHESA = aDeckCard({
  id: "queen-marchesa",
  name: "Queen Marchesa",
  oracleText:
    "Deathtouch, haste\nWhen Queen Marchesa enters, you become the monarch.\nAt the beginning of your upkeep, if an opponent is the monarch, create a 1/1 black Assassin creature token with deathtouch and haste.",
});

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

  it("a deck with no token but a monarch card shows the panel with the monarch line", () => {
    renderWithProviders(
      <TokenLibraryPanel cards={[QUEEN_MARCHESA, PALACE_JAILER]} />
    );

    expect(screen.getByText("Game pieces")).toBeDefined();
    expect(
      screen.getByText("The monarch — Palace Jailer, Queen Marchesa")
    ).toBeDefined();
  });

  it("copies the game pieces under their own heading after the tokens", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    renderWithProviders(
      <TokenLibraryPanel
        cards={[
          card("Create two 1/1 white Soldier creature tokens."),
          PALACE_JAILER,
        ]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Copy token checklist" })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "2x 1/1 white Soldier token\n\nGame pieces\nThe monarch — Palace Jailer"
      );
    });
  });

  it("names the game pieces in French", () => {
    renderWithProviders(<TokenLibraryPanel cards={[PALACE_JAILER]} />, {
      locale: "fr",
    });

    expect(screen.getByText("Pièces de jeu")).toBeDefined();
    expect(screen.getByText("Le monarque — Palace Jailer")).toBeDefined();
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
