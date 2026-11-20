/**
 * The faces of a deck card as Deck Lab's rules read them: the front face, and the back face of a
 * double-faced card (CR 712.1), each with its type line and Oracle text.
 *
 * Context: deck analysis, Deck Lab (I-31 requirement 2.1). A card added from Scryfall carries its
 * faces in `cardFaces`; a row built without them stores `Front // Back` in its type line and
 * text, which this module splits as `rebuildCardFaces` (`lib/deck/store-card-faces.ts`) does.
 *
 * @module deck-lab/card-faces
 */
import type { DeckCard } from "@/lib/deck/types";

import type { LabCard } from "./types";

/** The text one face of a card prints, with the card's colour identity for colour fallbacks. */
export type FaceText = Pick<
  DeckCard,
  "typeLine" | "oracleText" | "colorIdentity"
>;

/** A card's front face, and its back face when it has one. */
export interface CardFaces {
  readonly front: FaceText;
  readonly back: FaceText | undefined;
}

/**
 * What one rule decides about a card: its kind and rule id, and the fields that differ from a
 * lab card's defaults. `classify-card.ts` fills in the rest.
 */
export type LabFacts = Pick<LabCard, "kind" | "ruleId"> &
  Partial<
    Pick<
      LabCard,
      | "produces"
      | "dependsOnOpponents"
      | "out"
      | "entersTapped"
      | "fetchTypes"
      | "drawN"
      | "toHand"
    >
  >;

const FACE_SEPARATOR = " // ";
const SUBTYPE_SEPARATOR = "—";

/** The halves of a stored `Front // Back` field; the back is empty for a single-faced card. */
function splitFaces(value: string): readonly [string, string] {
  const [front = "", back = ""] = value.split(FACE_SEPARATOR, 2);
  return [front, back];
}

/**
 * Reads a deck card's faces.
 *
 * @param card - a deck card
 * @returns its front face, and its back face when it is double-faced
 */
export function facesOf(card: DeckCard): CardFaces {
  const { colorIdentity } = card;
  if (card.cardFaces) {
    const [front, back] = card.cardFaces;
    return {
      front: {
        typeLine: front.typeLine,
        oracleText: front.oracleText,
        colorIdentity,
      },
      back: {
        typeLine: back.typeLine,
        oracleText: back.oracleText,
        colorIdentity,
      },
    };
  }
  const [frontType, backType] = splitFaces(card.typeLine);
  const [frontText, backText] = splitFaces(card.oracleText);
  return {
    front: { typeLine: frontType, oracleText: frontText, colorIdentity },
    back:
      backType === ""
        ? undefined
        : { typeLine: backType, oracleText: backText, colorIdentity },
  };
}

/**
 * Whether a face has a card type. CR 205.2a: card types are printed before the em dash, so a
 * subtype such as "Forest" never matches.
 *
 * @param face - the face to read
 * @param cardType - a card type, such as "Land" or "Creature"
 * @returns true when the face's type line lists it
 */
export function hasCardType(
  face: Pick<FaceText, "typeLine">,
  cardType: string
): boolean {
  const [types = ""] = face.typeLine.split(SUBTYPE_SEPARATOR, 1);
  return types.split(/\s+/).includes(cardType);
}
