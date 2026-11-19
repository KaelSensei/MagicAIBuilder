/**
 * The two faces of a double-faced Scryfall card, as the app shows and stores them.
 *
 * Card catalog context. This is the one mapper from Scryfall's `card_faces` to the
 * `CardFace` pair: the search grid (`components/card/CardGrid.tsx`) renders it as a
 * flippable card, and the deck store (`lib/deck/store-card-faces.ts`) keeps it on the
 * `DeckCard`. Image URLs go through `getListedImageUri` and `getCardImageUri`
 * (`images.ts`), the one home of the WebP rule.
 *
 * Deck rows loaded from the database have no `card_faces`; they rebuild their faces from
 * the stored `Front // Back` fields in `rebuildCardFaces` (`lib/deck/store-card-faces.ts`).
 *
 * @module scryfall/faces
 */
import type { ScryfallCard, ScryfallCardFace } from "./types";
import { DFC_LAYOUTS } from "./types";
import { getCardImageUri, getListedImageUri } from "./images";

/**
 * One face of a double-faced card (CR 712.1): its own name, mana cost, type line, rules
 * text and images. A pair is ordered front face, then back face.
 *
 * Text Scryfall leaves out reads as `""`. The image URLs are always set: when the face
 * lists none, they are built from the card id and the side.
 */
export interface CardFace {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  imageUri: string;
  artCropUri: string;
}

type CardSide = "front" | "back";

/** One Scryfall face, its images falling back to the card's image for that side. */
function toCardFace(
  face: ScryfallCardFace,
  card: ScryfallCard,
  side: CardSide
): CardFace {
  return {
    name: face.name,
    manaCost: face.mana_cost ?? "",
    typeLine: face.type_line ?? "",
    oracleText: face.oracle_text ?? "",
    imageUri:
      getListedImageUri(face.image_uris, "grid") ??
      getCardImageUri(card, "grid", side),
    artCropUri:
      getListedImageUri(face.image_uris, "art") ??
      getCardImageUri(card, "art", side),
  };
}

/**
 * The front and back faces of a double-faced card.
 *
 * Only the layouts in `DFC_LAYOUTS` have a face on each side of the card: transform
 * (CR 712.2), modal double-faced (CR 712.3), reversible cards and double-faced tokens.
 * A split, flip or adventure card also lists two `card_faces`, but both are printed on
 * one side, so it gets no pair. Scryfall gives a meld card (CR 712.4) no `card_faces`.
 *
 * @param card - a card as Scryfall sends it
 * @returns the front face then the back face, or `undefined` when the layout is not
 *   double-faced or Scryfall sent fewer than two faces
 */
export function buildCardFaces(
  card: ScryfallCard
): [CardFace, CardFace] | undefined {
  if (!DFC_LAYOUTS.has(card.layout ?? "")) return undefined;
  const front = card.card_faces?.[0];
  const back = card.card_faces?.[1];
  if (!front || !back) return undefined;
  return [toCardFace(front, card, "front"), toCardFace(back, card, "back")];
}
