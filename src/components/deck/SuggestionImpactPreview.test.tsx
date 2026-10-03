import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckCard } from "@/lib/deck/types";
import { SuggestionImpactPreview } from "./SuggestionImpactPreview";

const currentCard: DeckCard = {
  id: "card-1",
  name: "Expensive Spell",
  manaCost: "{5}{U}",
  cmc: 6,
  typeLine: "Sorcery",
  oracleText: "",
  colorIdentity: ["U"],
  isGameChanger: false,
  isBanned: false,
  price: 4,
  imageUri: "",
  artCropUri: "",
  category: "sorcery",
  quantity: 1,
  zone: "main",
};

describe("SuggestionImpactPreview", () => {
  it("shows deterministic before and after metrics with evidence limits", () => {
    renderWithIntl(
      <SuggestionImpactPreview
        currentCards={[currentCard]}
        additions={[
          {
            name: "Unknown Card",
            reason: "Possible upgrade",
            category: "draw",
            priority: "medium",
          },
        ]}
        removals={["Expensive Spell"]}
      />
    );

    expect(
      screen.getByRole("region", { name: "Before and after" })
    ).toBeInTheDocument();
    expect(screen.getByText("Average mana value")).toBeInTheDocument();
    expect(screen.getByText(/1 evidence limitation/)).toBeInTheDocument();
  });
});
