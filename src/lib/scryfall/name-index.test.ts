import { describe, it, expect } from "vitest";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
  scryfallCollectionLookupName,
} from "./name-index";
import type { ScryfallCard } from "./types";

function makeCard(overrides: Partial<ScryfallCard>): ScryfallCard {
  return {
    id: "id-1",
    name: "Test Card",
    cmc: 2,
    type_line: "Instant",
    color_identity: [],
    ...overrides,
  };
}

describe("scryfallCollectionLookupName", () => {
  it("strips back face after spaced // for collection API", () => {
    expect(
      scryfallCollectionLookupName("Etali, Primal Conqueror // Etali, Primal Sickness")
    ).toBe("Etali, Primal Conqueror");
  });

  it("strips back face when // has no surrounding spaces", () => {
    expect(scryfallCollectionLookupName("Wear//Tear")).toBe("Wear");
  });

  it("leaves normal card names unchanged", () => {
    expect(scryfallCollectionLookupName("Sol Ring")).toBe("Sol Ring");
  });
});

describe("buildScryfallNameIndex", () => {
  it("indexes full name and front-face name for split cards", () => {
    const card = makeCard({
      name: "Discovery // Dispersal",
      layout: "split",
      card_faces: [
        { name: "Discovery" },
        { name: "Dispersal" },
      ],
    });
    const index = buildScryfallNameIndex([card]);

    expect(index.get(normalizeImportedName("Discovery // Dispersal"))?.id).toBe("id-1");
    expect(index.get(normalizeImportedName("Discovery"))?.id).toBe("id-1");
  });

  it("indexes front face from card_faces when Scryfall name is only front face", () => {
    const card = makeCard({
      name: "Etali, Primal Conqueror // Etali, Primal Sickness",
      layout: "transform",
      card_faces: [
        { name: "Etali, Primal Conqueror" },
        { name: "Etali, Primal Sickness" },
      ],
    });

    const index = buildScryfallNameIndex([card]);
    expect(index.get(normalizeImportedName("Etali, Primal Conqueror"))?.id).toBe("id-1");
  });
});

