/**
 * Face mapping between Scryfall cards, stored double-faced text, and deck cards.
 */
import type { DeckCard, CardFace } from "./types";
import { categorizeCard, categorizeDfcCard } from "./categories";
import type { ScryfallCard, ScryfallCardFace } from "@/lib/scryfall/types";
import { DFC_LAYOUTS } from "@/lib/scryfall/types";
import { getCardImageUri, buildScryfallImageUrl } from "@/lib/scryfall/images";

/**
 * Maps one Scryfall face onto the deck face shape.
 *
 * @param face - Scryfall face
 * @param sc - parent card, used when the face has no image
 * @param side - which face image to request
 * @returns the stored face
 */
function toCardFace(
  face: ScryfallCardFace,
  sc: ScryfallCard,
  side: "front" | "back"
): CardFace {
  return {
    name: face.name,
    manaCost: face.mana_cost ?? "",
    typeLine: face.type_line ?? "",
    oracleText: face.oracle_text ?? "",
    imageUri: face.image_uris?.normal ?? getCardImageUri(sc, "normal", side),
    artCropUri: face.image_uris?.art_crop ?? getCardImageUri(sc, "art_crop", side),
  };
}

/**
 * Builds the two faces of a double-faced card.
 *
 * @param sc - Scryfall card
 * @returns both faces, or undefined when the card is not a two-faced layout
 */
export function buildCardFaces(
  sc: ScryfallCard
): [CardFace, CardFace] | undefined {
  if (!DFC_LAYOUTS.has(sc.layout ?? "")) return undefined;
  const front = sc.card_faces?.[0];
  const back = sc.card_faces?.[1];
  if (!front || !back) return undefined;
  return [toCardFace(front, sc, "front"), toCardFace(back, sc, "back")];
}

/**
 * Keeps a printed power or toughness, treating an empty string as absent.
 *
 * @param faceValue - value printed on the front face
 * @param cardValue - value printed on the card itself
 * @returns the stat, or null when neither side has one
 */
function printedStat(
  faceValue: string | undefined,
  cardValue: string | undefined
): string | null {
  return (faceValue ?? cardValue ?? null) || null;
}

/**
 * Parses a Scryfall USD price string.
 *
 * @param usd - price string from Scryfall
 * @returns the number, or null when Scryfall has no price
 */
function usdPrice(usd: string | null | undefined): number | null {
  if (!usd) return null;
  return Number.parseFloat(usd);
}

/**
 * Turns a Scryfall card into the deck card the store keeps.
 *
 * @param scryfallCard - card returned by Scryfall
 * @returns a main-deck card with quantity 1
 */
export function makeDeckCard(scryfallCard: ScryfallCard): DeckCard {
  const cardFaces = buildCardFaces(scryfallCard);
  const face0 = scryfallCard.card_faces?.[0];
  const backType = cardFaces?.[1].typeLine ?? "";
  return {
    id: scryfallCard.id,
    name: scryfallCard.name,
    manaCost: scryfallCard.mana_cost ?? cardFaces?.[0].manaCost ?? "",
    cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text ?? cardFaces?.[0].oracleText ?? "",
    colorIdentity: scryfallCard.color_identity,
    isGameChanger: false,
    isBanned: false,
    price: usdPrice(scryfallCard.prices?.usd),
    imageUri: cardFaces?.[0].imageUri ?? getCardImageUri(scryfallCard, "normal"),
    artCropUri: cardFaces?.[0].artCropUri ?? getCardImageUri(scryfallCard, "art_crop"),
    category: cardFaces
      ? categorizeDfcCard(scryfallCard)
      : categorizeCard(scryfallCard),
    power: printedStat(face0?.power, scryfallCard.power),
    toughness: printedStat(face0?.toughness, scryfallCard.toughness),
    quantity: 1,
    zone: "main",
    layout: scryfallCard.layout,
    cardFaces,
    isFlexibleLand:
      cardFaces !== undefined &&
      scryfallCard.layout === "modal_dfc" &&
      backType.toLowerCase().includes("land"),
  };
}

/**
 * Reconstruct cardFaces from DB-stored fields for DFC/MDFC cards.
 * DFC cards have names like "Front Name // Back Name" and their images
 * can be fetched via Scryfall's front/back face URLs using the scryfallId.
 */
/**
 * Splits a stored `Front // Back` field, leaving the back empty when it is single-faced.
 *
 * @param value - stored name, type, text, or mana cost
 * @returns the front and back halves
 */
function splitFaceField(value: string): readonly [string, string] {
  if (!value.includes(" // ")) return [value, ""];
  const [front, back] = value.split(" // ");
  return [front ?? "", back ?? ""];
}

/**
 * One face rebuilt from the stored halves and Scryfall's face image URL.
 *
 * @param scryfallId - printing id used in the image URL
 * @param side - front or back
 * @param fields - text stored for that face
 * @returns the face
 */
function storedFace(
  scryfallId: string,
  side: "front" | "back",
  fields: {
    readonly name: string;
    readonly manaCost: string;
    readonly typeLine: string;
    readonly oracleText: string;
  }
): CardFace {
  return {
    name: fields.name,
    manaCost: fields.manaCost,
    typeLine: fields.typeLine,
    oracleText: fields.oracleText,
    imageUri: buildScryfallImageUrl(scryfallId, "normal", side),
    artCropUri: buildScryfallImageUrl(scryfallId, "art_crop", side),
  };
}

/**
 * Reconstruct cardFaces from DB-stored fields for DFC/MDFC cards.
 * DFC cards have names like "Front Name // Back Name" and their images
 * can be fetched via Scryfall's front/back face URLs using the scryfallId.
 *
 * @param scryfallId - printing id
 * @param name - stored card name
 * @param typeLine - stored type line
 * @param manaCost - stored mana cost
 * @param oracleText - stored oracle text
 * @returns both faces, or undefined when the name is not a double face
 */
export function rebuildCardFaces(
  scryfallId: string,
  name: string,
  typeLine: string,
  manaCost: string,
  oracleText: string
): [CardFace, CardFace] | undefined {
  if (!name.includes(" // ")) return undefined;
  const [frontName, backName] = splitFaceField(name);
  const [frontType, backType] = splitFaceField(typeLine);
  const [frontOracle, backOracle] = splitFaceField(oracleText);
  const [frontMana, backMana] = splitFaceField(manaCost);
  return [
    storedFace(scryfallId, "front", {
      name: frontName,
      manaCost: frontMana,
      typeLine: frontType,
      oracleText: frontOracle,
    }),
    storedFace(scryfallId, "back", {
      name: backName,
      manaCost: backMana,
      typeLine: backType,
      oracleText: backOracle,
    }),
  ];
}
