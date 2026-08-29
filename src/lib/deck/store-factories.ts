// Pure deck-shape helpers, lifted out of the Zustand store.
//
// None of these touch store state: they map a Scryfall card or an API payload
// into the shapes the store holds, or answer a question about a deck. Keeping
// them here means the store file carries only state transitions, and means the
// mapping logic can be tested directly rather than through a store action.
//
// @module deck/store-factories
import type { Deck, DeckCard, CardFace } from "./types";
import { categorizeCard, categorizeDfcCard } from "./categories";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DFC_LAYOUTS } from "@/lib/scryfall/types";
import { getCardImageUri, buildScryfallImageUrl } from "@/lib/scryfall/images";
import type * as deckApi from "@/lib/db/deck-api";

export function buildCardFaces(sc: ScryfallCard): [CardFace, CardFace] | undefined {
  if (!DFC_LAYOUTS.has(sc.layout ?? "")) return undefined;
  const faces = sc.card_faces;
  if (!faces || faces.length < 2) return undefined;
  const [f0, f1] = faces;
  return [
    { name: f0.name, manaCost: f0.mana_cost ?? "", typeLine: f0.type_line ?? "", oracleText: f0.oracle_text ?? "", imageUri: f0.image_uris?.normal ?? getCardImageUri(sc, "normal", "front"), artCropUri: f0.image_uris?.art_crop ?? getCardImageUri(sc, "art_crop", "front") },
    { name: f1.name, manaCost: f1.mana_cost ?? "", typeLine: f1.type_line ?? "", oracleText: f1.oracle_text ?? "", imageUri: f1.image_uris?.normal ?? getCardImageUri(sc, "normal", "back"), artCropUri: f1.image_uris?.art_crop ?? getCardImageUri(sc, "art_crop", "back") },
  ];
}
export function makeDeckCard(scryfallCard: ScryfallCard): DeckCard {
  const cardFaces = buildCardFaces(scryfallCard);
  const isDfc = cardFaces !== undefined;
  const manaCost = scryfallCard.mana_cost ?? cardFaces?.[0].manaCost ?? "";
  const isFlexibleLand = isDfc && scryfallCard.layout === "modal_dfc" && (cardFaces?.[1].typeLine ?? "").toLowerCase().includes("land");
  const face0 = scryfallCard.card_faces?.[0];
  const power = (face0?.power ?? scryfallCard.power ?? null) || null;
  const toughness = (face0?.toughness ?? scryfallCard.toughness ?? null) || null;
  return {
    id: scryfallCard.id, name: scryfallCard.name, manaCost, cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line, oracleText: scryfallCard.oracle_text ?? cardFaces?.[0].oracleText ?? "",
    colorIdentity: scryfallCard.color_identity, isGameChanger: false, isBanned: false,
    price: scryfallCard.prices?.usd ? Number.parseFloat(scryfallCard.prices.usd) : null,
    imageUri: cardFaces?.[0].imageUri ?? getCardImageUri(scryfallCard, "normal"),
    artCropUri: cardFaces?.[0].artCropUri ?? getCardImageUri(scryfallCard, "art_crop"),
    category: isDfc ? categorizeDfcCard(scryfallCard) : categorizeCard(scryfallCard),
    power,
    toughness,
    quantity: 1, zone: "main", layout: scryfallCard.layout, cardFaces, isFlexibleLand,
  };
}

/**
 * Reconstruct cardFaces from DB-stored fields for DFC/MDFC cards.
 * DFC cards have names like "Front Name // Back Name" and their images
 * can be fetched via Scryfall's front/back face URLs using the scryfallId.
 */
function rebuildCardFaces(scryfallId: string, name: string, typeLine: string, manaCost: string, oracleText: string): [CardFace, CardFace] | undefined {
  if (!name.includes(" // ")) return undefined;
  const [frontName, backName] = name.split(" // ");
  const [frontType, backType] = typeLine.includes(" // ") ? typeLine.split(" // ") : [typeLine, ""];
  const [frontOracle, backOracle] = oracleText.includes(" // ") ? oracleText.split(" // ") : [oracleText, ""];
  const [frontMana, backMana] = manaCost.includes(" // ") ? manaCost.split(" // ") : [manaCost, ""];
  return [
    { name: frontName, manaCost: frontMana, typeLine: frontType, oracleText: frontOracle, imageUri: buildScryfallImageUrl(scryfallId, "normal", "front"), artCropUri: buildScryfallImageUrl(scryfallId, "art_crop", "front") },
    { name: backName, manaCost: backMana, typeLine: backType, oracleText: backOracle, imageUri: buildScryfallImageUrl(scryfallId, "normal", "back"), artCropUri: buildScryfallImageUrl(scryfallId, "art_crop", "back") },
  ];
}

/** Displays a toast warning when a Game Changer card is added to the deck. */

export function createEmptyDeck(id: string, name: string, format: Deck["format"] = "commander"): Deck {
  return {
    id,
    name,
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format,
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert an API deck response to a store Deck object.
 * Extracts commander/partner/companion from the cards array and builds the Deck.
 *
 * @param d - API deck response (may contain all cards or just commander/partner/companion)
 * @returns Store-ready Deck object
 */
export function apiDeckToStoreDeck(d: deckApi.ApiDeck): Deck {
  const allCards = d.cards ?? [];
  const commanderCard = allCards.find((c) => c.isCommander && !c.isPartner) ?? null;
  const rawPartnerCard = allCards.find((c) => c.isPartner) ?? null;
  const partnerCard = (rawPartnerCard && rawPartnerCard.name !== commanderCard?.name)
    ? rawPartnerCard
    : null;
  const companionCard = allCards.find((c) => !c.isCommander && !c.isPartner && c.category === "companion") ?? null;
  const deckCards = allCards.filter((c) => !c.isCommander && !c.isPartner && c.category !== "companion");

  const toDeckCard = (c: deckApi.ApiDeckCard): DeckCard => {
    const cardFaces = rebuildCardFaces(c.scryfallId, c.name, c.typeLine, c.manaCost, c.oracleText);
    const isFlexibleLand = cardFaces?.[1].typeLine.toLowerCase().includes("land") ?? false;
    return {
      id: c.id,
      scryfallId: c.scryfallId,
      name: c.name,
      manaCost: c.manaCost,
      cmc: c.cmc,
      typeLine: c.typeLine,
      oracleText: c.oracleText,
      colorIdentity: c.colorIdentity,
      isGameChanger: c.isGameChanger,
      isBanned: c.isBanned,
      price: c.price,
      imageUri: c.imageUri,
      artCropUri: c.artCropUri,
      category: c.category,
      power: c.power ?? null,
      toughness: c.toughness ?? null,
      quantity: c.quantity,
      notes: c.notes ?? null,
      zone: c.zone ?? "main",
      isMaybeboard: (c.zone ?? "main") === "maybeboard",
      cardFaces,
      isFlexibleLand: isFlexibleLand || undefined,
    };
  };

  // cardCount: use _count from listing endpoint, or derive from full card list
  const cardCount = d._count?.cards ?? allCards.length;

  return {
    id: d.id,
    name: d.name,
    format: d.format,
    targetBracket: d.targetBracket,
    manualBracket: (d.manualBracket ?? null) as 1 | 2 | 3 | 4 | null,
    budget: d.budget,
    description: d.description ?? "",
    tags: d.tags ?? [],
    shareToken: d.shareToken ?? null,
    shareEnabled: d.shareEnabled ?? false,
    isPublic: d.isPublic ?? false,
    isAIGenerated: d.isAIGenerated ?? false,
    commander: commanderCard ? toDeckCard(commanderCard) : null,
    partner: partnerCard ? toDeckCard(partnerCard) : null,
    companion: companionCard ? toDeckCard(companionCard) : null,
    pairingType: d.pairingType ?? "none",
    cards: deckCards.map(toDeckCard),
    cardCount,
    maybeboard: deckCards.filter((c) => (c.zone ?? "main") === "maybeboard").map(toDeckCard),
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}

/**
 * Whether a deck in the store is still the lightweight listing version.
 *
 * `GET /api/decks` returns only commander / partner / companion plus a total
 * count, so a stub reports fewer loaded cards than `cardCount`. The full deck
 * comes from `GET /api/decks/[id]`.
 *
 * @param deck - a deck held in the store
 * @returns true when its main-deck cards have not been loaded yet
 */
export function isDeckStub(deck: Deck): boolean {
  const loaded =
    deck.cards.length +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0) +
    (deck.companion ? 1 : 0);

  return loaded < deck.cardCount;
}
