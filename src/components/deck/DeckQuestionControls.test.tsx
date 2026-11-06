import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { DeckQuestionControls } from "./DeckQuestionControls";

const cards: readonly DeckCard[] = [
  {
    id: "signet",
    name: "Arcane Signet",
    manaCost: "{2}",
    cmc: 2,
    typeLine: "Artifact",
    oracleText: "{T}: Add one mana of any color.",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    zone: "main",
  },
  {
    id: "roleless",
    name: "Roleless Seven Drop",
    manaCost: "{7}",
    cmc: 7,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
  },
];

describe("DeckQuestionControls", () => {
  it("asks why the selected card belongs in the deck", () => {
    const onAsk = vi.fn();
    renderWithIntl(
      <DeckQuestionControls
        cardNames={["Arcane Signet", "Sol Ring"]}
          cards={cards}
        onAsk={onAsk}
      />
    );

    fireEvent.change(screen.getByLabelText(/card to explain/i), {
      target: { value: "Sol Ring" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /why is this card here/i })
    );

    expect(onAsk).toHaveBeenCalledWith({
      type: "why-card",
      cardName: "Sol Ring",
    });
  });

  it("shows a local, criteria-based weakest card without invoking the AI callback", () => {
    const onAsk = vi.fn();
    renderWithIntl(
      <DeckQuestionControls
        cardNames={["Arcane Signet", "Roleless Seven Drop"]}
        cards={cards}
        onAsk={onAsk}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /find weakest card/i }));

    expect(onAsk).not.toHaveBeenCalled();
    expect(
      screen.getByText("Local assessment: Roleless Seven Drop")
    ).toBeInTheDocument();
    expect(screen.getByText(/no assigned deck role/i)).toBeInTheDocument();
  });
});
