import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { CommandZone } from "./CommandZone";
import type { DeckCard } from "@/lib/deck/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { readonly alt: string; readonly src: string }) =>
    createElement("img", { alt, src }),
}));

function makeCard(id: string, name: string): DeckCard {
  return {
    id, name, manaCost: "", cmc: 4, typeLine: "Legendary Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: `https://cards.test/${id}.jpg`, artCropUri: "",
    category: "commander", quantity: 1, zone: "main", scryfallId: id,
  };
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

  it("says how to bring a commander back once the zone is empty", () => {
    renderWithIntl(<CommandZone cards={[]} onCast={vi.fn()} />);

    expect(screen.getByText(/return your commander from the graveyard or exile/i)).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
