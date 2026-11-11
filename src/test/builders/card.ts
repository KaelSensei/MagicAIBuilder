/**
 * Test data builder for a card in a deck (`DeckCard`), shared by every test that needs one instead
 * of a local `makeCard` or `makeDeckCard` (audit tests_tooling TT-18, S5: 28 and 7 copies).
 *
 * Deck-building context. It moves to that context's `testing/` folder with the context's move
 * series; until then it lives in the shared kit. A new required field on `DeckCard` is added here
 * once, not in forty files.
 *
 * @module test/builders/card
 */
import type { DeckCard } from "@/lib/deck/types";

/**
 * A card row of a deck, with defaults that fit any Commander deck:
 *
 * - colourless (`colorIdentity: []`), so it fits every commander's colour identity (CR 903.5c);
 * - one copy (`quantity: 1`), which the singleton rule allows for any card (CR 903.5b);
 * - in the main deck (`zone: "main"`), not banned, not a Game Changer, without a price;
 * - blank card text: `id` "card-1", `name` "Card", no mana cost, mana value 0, empty type line and
 *   Oracle text, no image, `category` "other".
 *
 * Optional fields (`scryfallId`, `notes`, `power`, `cardFaces`…) are absent unless given. Give a
 * real card's name and text when the code under test reads them; give distinct `id`s when a deck
 * holds several cards.
 *
 * @param overrides - the fields this test cares about; they win over the defaults
 * @returns a new card each call, so a test may change it freely
 */
export function aDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Card",
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}
