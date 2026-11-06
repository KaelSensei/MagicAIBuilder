import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { SearchZoneMenu } from "./SearchZoneMenu";
import type { ScryfallCard } from "@/lib/scryfall/types";

function card(name: string): ScryfallCard {
  return {
    id: "sol-ring",
    name,
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "c16",
    set_name: "Commander 2016",
    rarity: "uncommon",
    prices: { usd: null, usd_foil: null, eur: null },
    image_uris: { small: "", normal: "", large: "", art_crop: "", border_crop: "", png: "" },
    keywords: [],
    legalities: { commander: "legal" },
  };
}

describe("SearchZoneMenu", () => {
  it("adds the card to the chosen zone without a drag", () => {
    const onAddToZone = vi.fn();
    const solRing = card("Sol Ring");
    renderWithIntl(<SearchZoneMenu card={solRing} onAddToZone={onAddToZone} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Add Sol Ring to" }), {
      target: { value: "sideboard" },
    });

    expect(onAddToZone).toHaveBeenCalledWith(solRing, "sideboard");
  });

  it("ignores the empty placeholder", () => {
    const onAddToZone = vi.fn();
    renderWithIntl(<SearchZoneMenu card={card("Sol Ring")} onAddToZone={onAddToZone} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Add Sol Ring to" }), {
      target: { value: "" },
    });

    expect(onAddToZone).not.toHaveBeenCalled();
  });
});
