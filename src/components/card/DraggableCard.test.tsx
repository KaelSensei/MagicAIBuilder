import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { aScryfallCard } from "@/test/builders/scryfall";
import { CardImage } from "./CardImage";
import { DraggableCard } from "./DraggableCard";

// dnd-kit gives the draggable wrapper `role="button"`. Without a name of its own, the wrapper
// takes its name from its content, so a search result whose image is the "Add … to deck" button
// announced two buttons with that name, and the deck builder's E2E could not tell them apart.
describe("DraggableCard", () => {
  it("names the drag handle after the card, leaving one button that adds it to the deck", () => {
    const card = aScryfallCard({ name: "Brainstorm" });

    render(
      <DndContext>
        <DraggableCard card={card}>
          <CardImage
            name={card.name}
            imageUri="https://cards.scryfall.io/grid/front/b/r/brainstorm.webp"
            showOverlay
            onClick={() => {}}
          />
        </DraggableCard>
      </DndContext>
    );

    expect(screen.getAllByRole("button", { name: "Add Brainstorm to deck" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Brainstorm" })).toHaveAttribute(
      "aria-roledescription",
      "draggable"
    );
  });
});
