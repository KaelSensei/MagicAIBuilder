import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { CardListItem } from "./CardListItem";

vi.mock(import("./CardTooltip"), () => ({
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
  price: 1.5,
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

  it("labels its Scryfall price as USD for a French player", () => {
    renderWithIntl(<CardListItem card={solRing} />, { locale: "fr" });

    expect(screen.getByText(/1,50\s*USD/)).toBeInTheDocument();
  });

  it("keeps the double-faced card turn-over action visible on keyboard focus", () => {
    renderWithIntl(
      <CardListItem
        card={{
          ...solRing,
          cardFaces: [
            { name: "Front Face", manaCost: "{1}", typeLine: "Artifact", oracleText: "", imageUri: "", artCropUri: "" },
            { name: "Back Face", manaCost: "{2}", typeLine: "Artifact", oracleText: "", imageUri: "", artCropUri: "" },
          ],
        }}
      />
    );

    expect(screen.getByRole("button", { name: /back face/i })).toHaveClass(
      "focus-visible:opacity-100"
    );
  });
});
