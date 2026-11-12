import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { screen, fireEvent } from "@testing-library/react";
import { aDeckCard } from "@/test/builders/card";
import { renderWithIntl } from "@/test/render-with-intl";
import { CommandZone } from "./CommandZone";
import type { DeckCard } from "@/lib/deck/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { readonly alt: string; readonly src: string }) =>
    createElement("img", { alt, src }),
}));

function makeCard(id: string, name: string): DeckCard {
  return aDeckCard({
    id,
    name,
    cmc: 4,
    typeLine: "Legendary Creature",
    imageUri: `https://cards.test/${id}.jpg`,
    category: "commander",
    scryfallId: id,
  });
}

describe("CommandZone", () => {
  it("shows each commander face up and casts the one chosen", () => {
    const onCast = vi.fn();
    renderWithIntl(
      <CommandZone
        cards={[makeCard("cmd", "Kenrith"), makeCard("partner", "Tymna")]}
        onCast={onCast}
      />
    );

    expect(screen.getByRole("heading", { name: /command zone/i })).toBeDefined();
    expect(screen.getByRole("img", { name: "Kenrith" })).toHaveAttribute(
      "src",
      "https://cards.test/cmd.jpg"
    );

    fireEvent.click(screen.getByRole("button", { name: "Cast Tymna" }));

    expect(onCast).toHaveBeenCalledWith("partner");
  });

  it("shows a commander stored with Scryfall's JPEG from the WebP grid", () => {
    const kenrith = {
      ...makeCard("cmd", "Kenrith"),
      imageUri:
        "https://cards.scryfall.io/normal/front/a/c/ac2b2b62-ec2c-46f7-a8b6-8fca1a1e8b0b.jpg?1677149290",
    };

    renderWithIntl(<CommandZone cards={[kenrith]} onCast={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Kenrith" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/front/a/c/ac2b2b62-ec2c-46f7-a8b6-8fca1a1e8b0b.webp?1677149290"
    );
  });

  it("says how to bring a commander back once the zone is empty", () => {
    renderWithIntl(<CommandZone cards={[]} onCast={vi.fn()} />);

    expect(screen.getByText(/return your commander from the graveyard or exile/i)).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
