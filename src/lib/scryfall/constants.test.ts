import { describe, expect, it } from "vitest";
import {
  SCRYFALL_API,
  SCRYFALL_IMAGE_HOST,
  manaSymbolSvgUrl,
} from "./constants";

describe("Scryfall constants", () => {
  it("points API requests at the api.scryfall.com origin, without a trailing slash", () => {
    expect(`${SCRYFALL_API}/cards/named`).toBe(
      "https://api.scryfall.com/cards/named"
    );
  });

  it("names the card image CDN by host only, as URL.hostname reports it", () => {
    expect(
      new URL("https://cards.scryfall.io/grid/front/a/b/ab.webp").hostname
    ).toBe(SCRYFALL_IMAGE_HOST);
  });
});

describe("manaSymbolSvgUrl", () => {
  it.each(["W", "U", "B", "R", "G", "C"])(
    "serves the %s symbol from Scryfall's SVG host",
    (symbol) => {
      expect(manaSymbolSvgUrl(symbol)).toBe(
        `https://svgs.scryfall.io/card-symbols/${symbol}.svg`
      );
    }
  );
});
