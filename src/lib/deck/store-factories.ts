// Pure deck-shape helpers, lifted out of the Zustand store.
//
// None of these touch store state: they map a Scryfall card or an API payload
// into the shapes the store holds, or answer a question about a deck. Keeping
// them here means the store file carries only state transitions, and means the
// mapping logic can be tested directly rather than through a store action.
//
// @module deck/store-factories
import type { Deck, DeckCard } from "./types";
import type { CommandSlot } from "./bulk-edit-command-zone";
import type * as deckApi from "@/lib/db/deck-api";
import { parseBracketLevel } from "@/lib/constants/brackets";
import { rebuildCardFaces } from "./store-card-faces";
import { countLoadedCards, withLoadedCardCount } from "./loaded-card-count";

export { buildCardFaces, makeDeckCard } from "./store-card-faces";

/** The target bracket of a new deck, and of a stored one outside 1–5 (the database default). */
const DEFAULT_TARGET_BRACKET: Deck["targetBracket"] = 3;

/**
 * Builds an empty deck shell.
 *
 * @param id - deck id
 * @param name - deck name
 * @param format - constructed format, Commander by default
 * @returns a deck with no cards
 */
export function createEmptyDeck(
  id: string,
  name: string,
  format: Deck["format"] = "commander"
): Deck {
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
    targetBracket: DEFAULT_TARGET_BRACKET,
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
 * Maps one API card onto the store card, rebuilding double faces from stored text.
 *
 * @param card - card row from the deck API
 * @returns the store card
 */
function apiCardToDeckCard(card: deckApi.ApiDeckCard): DeckCard {
  const cardFaces = rebuildCardFaces(
    card.scryfallId,
    card.name,
    card.typeLine,
    card.manaCost,
    card.oracleText
  );
  const zone = card.zone ?? "main";
  const backIsLand = cardFaces?.[1].typeLine.toLowerCase().includes("land") ?? false;
  return {
    id: card.id,
    scryfallId: card.scryfallId,
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    colorIdentity: card.colorIdentity,
    isGameChanger: card.isGameChanger,
    isBanned: card.isBanned,
    price: card.price,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: card.category,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    quantity: card.quantity,
    notes: card.notes ?? null,
    zone,
    isMaybeboard: zone === "maybeboard",
    cardFaces,
    isFlexibleLand: backIsLand || undefined,
  };
}

/**
 * Separates commander, partner, companion, and the remaining deck rows.
 *
 * A partner whose name matches the commander is dropped. Companion is a
 * category, not a zone flag.
 *
 * @param allCards - cards returned with the deck
 * @returns the four groups
 */
function partitionApiCards(allCards: readonly deckApi.ApiDeckCard[]) {
  const commanderCard = allCards.find((card) => card.isCommander && !card.isPartner) ?? null;
  const rawPartnerCard = allCards.find((card) => card.isPartner) ?? null;
  const partnerCard =
    rawPartnerCard && rawPartnerCard.name !== commanderCard?.name ? rawPartnerCard : null;
  const companionCard =
    allCards.find((card) => !card.isCommander && !card.isPartner && card.category === "companion") ??
    null;
  const deckCards = allCards.filter(
    (card) => !card.isCommander && !card.isPartner && card.category !== "companion"
  );
  return { commanderCard, partnerCard, companionCard, deckCards };
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
  const { commanderCard, partnerCard, companionCard, deckCards } = partitionApiCards(allCards);

  // The listing sends the server's row count; a full deck is counted from the
  // rows it holds, once the command zone has been read out of them. The
  // version is set last, since `withLoadedCardCount` forgets it.
  const deck: Deck = {
    id: d.id,
    name: d.name,
    folderId: d.folderId ?? null,
    format: d.format,
    targetBracket: parseBracketLevel(d.targetBracket) ?? DEFAULT_TARGET_BRACKET,
    manualBracket: parseBracketLevel(d.manualBracket),
    budget: d.budget,
    description: d.description ?? "",
    tags: d.tags ?? [],
    shareToken: d.shareToken ?? null,
    shareEnabled: d.shareEnabled ?? false,
    isPublic: d.isPublic ?? false,
    isAIGenerated: d.isAIGenerated ?? false,
    commander: commanderCard ? apiCardToDeckCard(commanderCard) : null,
    partner: partnerCard ? apiCardToDeckCard(partnerCard) : null,
    companion: companionCard ? apiCardToDeckCard(companionCard) : null,
    pairingType: d.pairingType ?? "none",
    cards: deckCards.map(apiCardToDeckCard),
    cardCount: d._count?.cards ?? 0,
    maybeboard: deckCards
      .filter((card) => (card.zone ?? "main") === "maybeboard")
      .map(apiCardToDeckCard),
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
  const held = d._count ? deck : withLoadedCardCount(deck);
  // A whole deck just read is current: its version is the one to write with.
  return d.version === undefined ? held : { ...held, version: d.version };
}

/**
 * Whether a deck in the store is still the lightweight listing version.
 *
 * `GET /api/decks` returns only commander / partner / companion plus a total
 * count, so a stub holds fewer rows than `cardCount`. The full deck comes from
 * `GET /api/decks/[id]`, and every edit of a loaded deck keeps `cardCount`
 * equal to its rows (`withLoadedCardCount`), so a loaded deck never reads as a
 * stub again.
 *
 * @param deck - a deck held in the store
 * @returns true when its main-deck cards have not been loaded yet
 */
export function isDeckStub(deck: Deck): boolean {
  return countLoadedCards(deck) < deck.cardCount;
}

/**
 * The API payload that saves a deck card as a new row outside the command zone.
 *
 * @param card - the card as the store would hold it
 * @returns the row to create
 */
export function addCardPayload(card: DeckCard): deckApi.AddCardPayload {
  return {
    scryfallId: card.scryfallId ?? card.id,
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    colorIdentity: card.colorIdentity,
    isGameChanger: card.isGameChanger,
    isBanned: card.isBanned,
    price: card.price,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: card.category,
    quantity: card.quantity,
    isCommander: false,
    isPartner: false,
    zone: card.zone,
  };
}

/**
 * The API payload that saves a card into a command-zone slot.
 *
 * @param card - the card as the store would hold it
 * @param slot - the slot it fills
 * @returns the row to create
 */
export function commandCardPayload(card: DeckCard, slot: CommandSlot): deckApi.AddCardPayload {
  return {
    ...addCardPayload({ ...card, quantity: 1, zone: "main" }),
    category: slot === "companion" ? "companion" : "commander",
    isCommander: slot !== "companion",
    isPartner: slot === "partner",
  };
}
