import { describe, it, expect } from "vitest";

import {
  buildLocalizedNamesQueries,
  indexLocalizedText,
  mergeLocalizedPrintings,
  resolveLocalizedText,
  toScryfallLang,
} from "./localized";
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

describe("mergeLocalizedPrintings", () => {
  const english = [
    makeCard({ id: "en-1", name: "Lightning Bolt" }),
    makeCard({ id: "en-2", name: "Sol Ring", type_line: "Artifact" }),
    makeCard({ id: "en-3", name: "Counterspell", type_line: "Instant" }),
  ];

  it("substitutes the localised printing where one exists", () => {
    const localized = [
      makeCard({ id: "fr-1", name: "Lightning Bolt", lang: "fr", printed_name: "Foudre" }),
    ];
    const merged = mergeLocalizedPrintings(english, localized);
    expect(merged[0].id).toBe("fr-1");
    expect(merged[0].printed_name).toBe("Foudre");
  });

  it("keeps every English card that has no localised printing", () => {
    // A lang-filtered Scryfall search only returns cards printed in that
    // language; merging over the English list is what keeps the rest visible.
    const localized = [
      makeCard({ id: "fr-2", name: "Sol Ring", lang: "fr", printed_name: "Anneau solaire" }),
    ];
    const merged = mergeLocalizedPrintings(english, localized);
    expect(merged.map((c) => c.id)).toEqual(["en-1", "fr-2", "en-3"]);
  });

  it("preserves the English list's order and length", () => {
    const localized = [
      makeCard({ id: "fr-3", name: "Counterspell", lang: "fr" }),
      makeCard({ id: "fr-1", name: "Lightning Bolt", lang: "fr" }),
    ];
    const merged = mergeLocalizedPrintings(english, localized);
    expect(merged).toHaveLength(3);
    expect(merged.map((c) => c.name)).toEqual([
      "Lightning Bolt",
      "Sol Ring",
      "Counterspell",
    ]);
  });

  it("returns the English list untouched when there is nothing to merge", () => {
    expect(mergeLocalizedPrintings(english, [])).toEqual(english);
  });

  it("ignores localised printings of cards not in the English list", () => {
    const localized = [makeCard({ id: "fr-9", name: "Brainstorm", lang: "fr" })];
    expect(mergeLocalizedPrintings(english, localized)).toEqual(english);
  });
});

describe("buildLocalizedNamesQueries", () => {
  it("ORs exact-name terms under a lang filter, one printing per card", () => {
    const queries = buildLocalizedNamesQueries(["Sol Ring", "Counterspell"], "fr");
    expect(queries).toEqual(['lang:fr unique:cards (!"Sol Ring" or !"Counterspell")']);
  });

  it("deduplicates names so a card held in two zones costs one term", () => {
    const queries = buildLocalizedNamesQueries(["Sol Ring", "Sol Ring"], "fr");
    expect(queries[0]).toBe('lang:fr unique:cards (!"Sol Ring")');
  });

  it("splits long lists into chunks of at most 20 names", () => {
    const names = Array.from({ length: 45 }, (_, i) => `Card ${i}`);
    const queries = buildLocalizedNamesQueries(names, "de");
    expect(queries).toHaveLength(3);
    expect(queries[0].match(/!"/g)).toHaveLength(20);
    expect(queries[2].match(/!"/g)).toHaveLength(5);
  });

  it("returns nothing for English or an empty list", () => {
    expect(buildLocalizedNamesQueries(["Sol Ring"], "en")).toEqual([]);
    expect(buildLocalizedNamesQueries([], "fr")).toEqual([]);
  });

  it("drops names containing a double quote rather than breaking the query", () => {
    const queries = buildLocalizedNamesQueries(['Bad "Name"', "Sol Ring"], "fr");
    expect(queries).toEqual(['lang:fr unique:cards (!"Sol Ring")']);
  });
});

describe("resolveLocalizedText — image", () => {
  const uris = { small: "", normal: "https://img/fr.jpg", large: "", art_crop: "", border_crop: "", png: "" };

  it("carries the printing's front image so the translated card can be shown", () => {
    expect(resolveLocalizedText(makeCard({ image_uris: uris })).imageUri).toBe("https://img/fr.jpg");
  });

  it("builds the image URL from the printing id when image_uris is absent", () => {
    expect(resolveLocalizedText(makeCard()).imageUri).toContain("card-1");
  });
});

describe("indexLocalizedText", () => {
  it("keys resolved text by the oracle (English) name", () => {
    const index = indexLocalizedText([
      makeCard({ name: "Sol Ring", lang: "fr", printed_name: "Anneau solaire" }),
    ]);
    expect(index.get("Sol Ring")?.name).toBe("Anneau solaire");
    expect(index.get("Sol Ring")?.isLocalized).toBe(true);
  });

  it("keeps the first printing when Scryfall returns the same card twice", () => {
    const index = indexLocalizedText([
      makeCard({ id: "a", name: "Sol Ring", lang: "fr", printed_name: "Anneau solaire" }),
      makeCard({ id: "b", name: "Sol Ring", lang: "fr", printed_name: "Autre" }),
    ]);
    expect(index.size).toBe(1);
    expect(index.get("Sol Ring")?.name).toBe("Anneau solaire");
  });
});
