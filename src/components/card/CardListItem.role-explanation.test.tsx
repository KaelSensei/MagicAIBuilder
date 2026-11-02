import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { CardListItem } from "./CardListItem";

vi.mock("./CardTooltip", () => ({
  CardTooltip: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
}));

const solRing: DeckCard = {
  id: "sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  colorIdentity: [],
  isGameChanger: false,
  isBanned: false,
  price: null,
  imageUri: "",
  artCropUri: "",
  category: "ramp",
  quantity: 1,
  zone: "main",
};

describe("CardListItem role explanation", () => {
  it("reveals the card's locally assigned deck role", () => {
    renderWithIntl(<CardListItem card={solRing} />);

    fireEvent.click(screen.getByRole("button", { name: "Why this card is in the deck" }));

    expect(screen.getByRole("note")).toHaveTextContent(
      "Its assigned role in this deck is Ramp."
    );
  });
});
