import { describe, it, expect } from "vitest";
import {
  buildCardFaces,
  createEmptyDeck,
  isDeckStub,
  makeDeckCard,
} from "./store-factories";
import type { Deck } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * These were only ever exercised through store actions, so a mapping bug
 * surfaced as a failing deck operation several layers away. Testing them
 * directly is the point of pulling them out of the store.
 */

function scryfallCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Sol Ring",
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "{T}: Add {C}{C}.",
    color_identity: [],
    ...overrides,
  };
}

const DFC = scryfallCard({
  name: "Delver of Secrets // Insectile Aberration",
  layout: "transform",
  mana_cost: undefined,
  oracle_text: undefined,
  type_line: "Creature — Human Wizard // Creature — Human Insect",
  card_faces: [
    {
      name: "Delver of Secrets",
      mana_cost: "{U}",
      type_line: "Creature — Human Wizard",
      oracle_text: "Look at the top card.",
      power: "1",
      toughness: "1",
    },
    {
      name: "Insectile Aberration",
      type_line: "Creature — Human Insect",
      oracle_text: "Flying.",
      power: "3",
      toughness: "2",
    },
  ],
});

describe("buildCardFaces", () => {
  it("returns nothing for a single-faced card", () => {
    expect(buildCardFaces(scryfallCard())).toBeUndefined();
  });

  it("returns nothing for a layout that is not double-faced, even with two faces", () => {
    const split = scryfallCard({
      layout: "normal",
      card_faces: DFC.card_faces,
    });
    expect(buildCardFaces(split)).toBeUndefined();
  });

  it("returns nothing when a double-faced layout is missing its second face", () => {
    const broken = scryfallCard({
      layout: "transform",
      card_faces: [DFC.card_faces![0]],
    });
    expect(buildCardFaces(broken)).toBeUndefined();
  });

  it("maps both faces, falling back to a derived image when the face has none", () => {
    const faces = buildCardFaces(DFC);
    expect(faces?.[0].name).toBe("Delver of Secrets");
    expect(faces?.[1].name).toBe("Insectile Aberration");
    // No image_uris on either face, so both fall back to the card-level builder.
    expect(faces?.[0].imageUri).toContain("front");
    expect(faces?.[1].imageUri).toContain("back");
  });
});

describe("makeDeckCard", () => {
  it("maps a single-faced card into deck shape", () => {
    const card = makeDeckCard(scryfallCard({ prices: { usd: "1.50", usd_foil: null, eur: null } }));
    expect(card).toMatchObject({
      name: "Sol Ring",
      manaCost: "{1}",
      quantity: 1,
      zone: "main",
      price: 1.5,
      isGameChanger: false,
      isBanned: false,
    });
    expect(card.cardFaces).toBeUndefined();
  });

  it("reports no price rather than NaN when Scryfall has none", () => {
    expect(makeDeckCard(scryfallCard()).price).toBeNull();
  });

  it("takes mana cost, rules and P/T from the front face of a double-faced card", () => {
    const card = makeDeckCard(DFC);
    expect(card.manaCost).toBe("{U}");
    expect(card.oracleText).toBe("Look at the top card.");
    expect(card.power).toBe("1");
    expect(card.toughness).toBe("1");
    expect(card.cardFaces).toHaveLength(2);
  });

  it("flags an MDFC whose back is a land, which is what makes it count flexibly", () => {
    const mdfc = scryfallCard({
      name: "Agadeem's Awakening // Agadeem, the Undercrypt",
      layout: "modal_dfc",
      card_faces: [
        { name: "Agadeem's Awakening", mana_cost: "{B}{B}{B}", type_line: "Sorcery" },
        { name: "Agadeem, the Undercrypt", type_line: "Land" },
      ],
    });
    expect(makeDeckCard(mdfc).isFlexibleLand).toBe(true);
  });

  it("does not flag a transform card whose back is a creature", () => {
    expect(makeDeckCard(DFC).isFlexibleLand).toBe(false);
  });

  it("normalises an empty power/toughness to null rather than an empty string", () => {
    const card = makeDeckCard(scryfallCard({ power: "", toughness: "" }));
    expect(card.power).toBeNull();
    expect(card.toughness).toBeNull();
  });
});

describe("createEmptyDeck", () => {
  it("starts empty, in the command zone's default pairing, as Commander", () => {
    const deck = createEmptyDeck("d1", "My Deck");
    expect(deck).toMatchObject({
      id: "d1",
      name: "My Deck",
      format: "commander",
      commander: null,
      partner: null,
      companion: null,
      pairingType: "none",
    });
    expect(deck.cards).toEqual([]);
  });

  it("honours a non-Commander format", () => {
    expect(createEmptyDeck("d2", "Modern deck", "modern").format).toBe("modern");
  });
});

describe("isDeckStub", () => {
  function deck(overrides: Partial<Deck>): Deck {
    return { ...createEmptyDeck("d", "d"), ...overrides };
  }

  it("calls a deck a stub while it holds fewer cards than it claims", () => {
    // GET /api/decks returns the command zone and a count, not the 99.
    expect(isDeckStub(deck({ cardCount: 100, cards: [] }))).toBe(true);
  });

  it("counts the command zone toward the loaded total", () => {
    const commander = makeDeckCard(scryfallCard());
    expect(isDeckStub(deck({ cardCount: 1, cards: [], commander }))).toBe(false);
  });

  it("is not a stub once the cards are loaded", () => {
    const cards = [makeDeckCard(scryfallCard())];
    expect(isDeckStub(deck({ cardCount: 1, cards }))).toBe(false);
  });

  it("treats an empty deck as loaded, not as a stub", () => {
    expect(isDeckStub(deck({ cardCount: 0, cards: [] }))).toBe(false);
  });
});
