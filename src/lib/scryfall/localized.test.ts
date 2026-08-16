import { describe, it, expect } from "vitest";

import { resolveLocalizedText, toScryfallLang } from "./localized";
import type { ScryfallCard } from "./types";

function makeCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "card-1",
    name: "Lightning Bolt",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Lightning Bolt deals 3 damage to any target.",
    color_identity: ["R"],
    ...overrides,
  };
}

describe("toScryfallLang", () => {
  it("passes through the codes Scryfall shares with the app", () => {
    expect(toScryfallLang("en")).toBe("en");
    expect(toScryfallLang("fr")).toBe("fr");
    expect(toScryfallLang("de")).toBe("de");
  });

  it("maps Chinese to Simplified, which is the code Scryfall prints under", () => {
    expect(toScryfallLang("zh")).toBe("zhs");
  });

  it("maps Portuguese to the Brazilian code Scryfall actually uses", () => {
    expect(toScryfallLang("pt")).toBe("pt");
  });

  it("falls back to English for a locale Scryfall does not print", () => {
    expect(toScryfallLang("xx")).toBe("en");
  });
});

describe("resolveLocalizedText", () => {
  it("returns the English fields when the printing has no localised text", () => {
    const resolved = resolveLocalizedText(makeCard());
    expect(resolved.name).toBe("Lightning Bolt");
    expect(resolved.typeLine).toBe("Instant");
    expect(resolved.oracleText).toBe("Lightning Bolt deals 3 damage to any target.");
  });

  it("prefers the printed text of a localised printing", () => {
    const card = makeCard({
      lang: "fr",
      printed_name: "Foudre",
      printed_type_line: "Éphémère",
      printed_text: "Foudre inflige 3 blessures à n'importe quelle cible.",
    });
    const resolved = resolveLocalizedText(card);
    expect(resolved.name).toBe("Foudre");
    expect(resolved.typeLine).toBe("Éphémère");
    expect(resolved.oracleText).toBe("Foudre inflige 3 blessures à n'importe quelle cible.");
  });

  it("falls back field by field, not all or nothing", () => {
    // Scryfall fills these independently: a printing can carry a printed name
    // with no printed text. Treating them as one unit would blank the rules.
    const card = makeCard({ lang: "fr", printed_name: "Foudre" });
    const resolved = resolveLocalizedText(card);
    expect(resolved.name).toBe("Foudre");
    expect(resolved.typeLine).toBe("Instant");
    expect(resolved.oracleText).toBe("Lightning Bolt deals 3 damage to any target.");
  });

  it("ignores an empty printed field rather than blanking the English one", () => {
    const card = makeCard({ lang: "fr", printed_text: "" });
    expect(resolveLocalizedText(card).oracleText).toBe(
      "Lightning Bolt deals 3 damage to any target."
    );
  });

  it("reads the front face of a double-faced card", () => {
    const card = makeCard({
      name: "Delver of Secrets // Insectile Aberration",
      type_line: "Creature — Human Wizard // Creature — Human Insect",
      oracle_text: undefined,
      card_faces: [
        { name: "Delver of Secrets", type_line: "Creature — Human Wizard", oracle_text: "Look at the top card." },
        { name: "Insectile Aberration", type_line: "Creature — Human Insect", oracle_text: "Flying." },
      ],
    });
    const resolved = resolveLocalizedText(card);
    expect(resolved.typeLine).toBe("Creature — Human Wizard");
    expect(resolved.oracleText).toBe("Look at the top card.");
  });

  it("prefers a face's printed text over its English text", () => {
    const card = makeCard({
      lang: "fr",
      card_faces: [
        {
          name: "Delver of Secrets",
          type_line: "Creature — Human Wizard",
          oracle_text: "Look at the top card.",
          printed_name: "Chercheur de secrets",
          printed_type_line: "Créature : humain et sorcier",
          printed_text: "Regardez la carte du dessus.",
        },
        { name: "Insectile Aberration", type_line: "Creature — Human Insect" },
      ],
    });
    const resolved = resolveLocalizedText(card);
    expect(resolved.name).toBe("Chercheur de secrets");
    expect(resolved.typeLine).toBe("Créature : humain et sorcier");
    expect(resolved.oracleText).toBe("Regardez la carte du dessus.");
  });

  it("keeps the card-level printed name when the face has none", () => {
    const card = makeCard({
      lang: "fr",
      printed_name: "Chercheur de secrets // Aberration insectoïde",
      card_faces: [{ name: "Delver of Secrets", type_line: "Creature — Human Wizard" }],
    });
    expect(resolveLocalizedText(card).name).toBe(
      "Chercheur de secrets // Aberration insectoïde"
    );
  });

  it("reports an absent oracle text as an empty string, never undefined", () => {
    const card = makeCard({ oracle_text: undefined });
    expect(resolveLocalizedText(card).oracleText).toBe("");
  });

  it("tells callers whether the text it returned is actually localised", () => {
    expect(resolveLocalizedText(makeCard()).isLocalized).toBe(false);
    expect(
      resolveLocalizedText(makeCard({ lang: "fr", printed_name: "Foudre" })).isLocalized
    ).toBe(true);
  });

  it("does not call an English printing localised, whatever fields it carries", () => {
    // Scryfall does emit printed_* on some English cards; that is not a translation.
    const card = makeCard({ lang: "en", printed_name: "Lightning Bolt" });
    expect(resolveLocalizedText(card).isLocalized).toBe(false);
  });
});
