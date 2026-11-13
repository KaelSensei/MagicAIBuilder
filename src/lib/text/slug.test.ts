import { describe, expect, it } from "vitest";

import { fileStem, underscoreFileStem } from "./slug";

describe("fileStem", () => {
  it("folds each run of spaces and punctuation into one hyphen and trims the ends", () => {
    expect(fileStem("  My Deck! v2 ")).toBe("My-Deck-v2");
  });

  it("keeps the case of the name", () => {
    expect(fileStem("Atraxa Superfriends")).toBe("Atraxa-Superfriends");
  });

  it("keeps digits and existing hyphens", () => {
    expect(fileStem("mono-red 2024")).toBe("mono-red-2024");
  });

  it("falls back to 'deck' when nothing of the name survives", () => {
    expect(fileStem("")).toBe("deck");
    expect(fileStem("   ")).toBe("deck");
    expect(fileStem("!!!")).toBe("deck");
  });

  it("keeps an accented letter as its base letter (B2, was pinned by PT-07)", () => {
    expect(fileStem("Ürza's Saga")).toBe("Urza-s-Saga");
    expect(fileStem("Lim-Dûl the Necromancer")).toBe("Lim-Dul-the-Necromancer");
    expect(fileStem("Éowyn")).toBe("Eowyn");
  });

  it("spells out the Æ and Œ ligatures as Oracle text does", () => {
    expect(fileStem("Æther Vial")).toBe("Aether-Vial");
    expect(fileStem("Œnone")).toBe("Oenone");
  });

  it("still falls back to 'deck' when only marks and punctuation remain", () => {
    expect(fileStem("¡¿ ´¨")).toBe("deck");
  });
});

describe("underscoreFileStem", () => {
  it("lowercases and turns every character outside ASCII letters and digits into one underscore", () => {
    expect(underscoreFileStem("My Deck! v2")).toBe("my_deck__v2");
  });

  it("keeps an accented letter as its base letter", () => {
    expect(underscoreFileStem("Lim-Dûl the Necromancer")).toBe(
      "lim_dul_the_necromancer"
    );
    expect(underscoreFileStem("Éowyn")).toBe("eowyn");
  });

  it("spells out the Æ and Œ ligatures as Oracle text does", () => {
    expect(underscoreFileStem("Æther Vial")).toBe("aether_vial");
  });

  it("gives an empty stem for an empty name, as the deck export always has", () => {
    expect(underscoreFileStem("")).toBe("");
  });
});
