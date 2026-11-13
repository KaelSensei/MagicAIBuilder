import { describe, expect, it } from "vitest";

import { spellOutLigatures, stripDiacritics } from "./transliterate";

describe("stripDiacritics", () => {
  it("keeps an accented letter as its base letter", () => {
    expect(stripDiacritics("Lim-Dûl the Necromancer")).toBe(
      "Lim-Dul the Necromancer"
    );
    expect(stripDiacritics("Éowyn, Fearless Knight")).toBe(
      "Eowyn, Fearless Knight"
    );
  });

  it("keeps the case, the punctuation and the whitespace of the text", () => {
    expect(stripDiacritics("  Ürza's  Saga! ")).toBe("  Urza's  Saga! ");
  });

  it("leaves a text without marks untouched", () => {
    expect(stripDiacritics("Atraxa, Praetors' Voice")).toBe(
      "Atraxa, Praetors' Voice"
    );
  });

  it("drops a combining mark written on its own", () => {
    expect(stripDiacritics("é")).toBe("e");
  });

  it("leaves the Æ and Œ ligatures whole, as Unicode NFD does", () => {
    expect(stripDiacritics("Æther")).toBe("Æther");
  });
});

describe("spellOutLigatures", () => {
  it("spells Æ and Œ out as two letters in both cases", () => {
    expect(spellOutLigatures("Æther Vial")).toBe("Aether Vial");
    expect(spellOutLigatures("æther adept")).toBe("aether adept");
    expect(spellOutLigatures("Œnone")).toBe("Oenone");
    expect(spellOutLigatures("œnone")).toBe("oenone");
  });

  it("leaves every other letter untouched", () => {
    expect(spellOutLigatures("Lim-Dûl the Necromancer")).toBe(
      "Lim-Dûl the Necromancer"
    );
  });
});
