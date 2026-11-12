import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardImage } from "./CardImage";

// Deck cards saved before Scryfall's 2026-10-14 WebP change store its JPEG URLs.
describe("CardImage", () => {
  it("shows a card stored with Scryfall's JPEG from the WebP grid", () => {
    render(
      <CardImage
        name="Sol Ring"
        imageUri="https://cards.scryfall.io/normal/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181"
      />
    );

    expect(screen.getByAltText("Sol Ring")).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181"
    );
  });
});
