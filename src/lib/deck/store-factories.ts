// Pure deck-shape helpers, lifted out of the Zustand store.
//
// None of these touch store state: they map a Scryfall card or an API payload
// into the shapes the store holds, or answer a question about a deck. Keeping
// them here means the store file carries only state transitions, and means the
// mapping logic can be tested directly rather than through a store action.
//
// @module deck/store-factories
import type { Deck, DeckCard } from "./types";
import {
  commandSlotOf,
  type CommandSlot,
  type CommandSlotFlags,
} from "./bulk-edit-command-zone";
import type * as deckApi from "@/lib/db/deck-api";
import { parseBracketLevel } from "@/lib/constants/brackets";
import { rebuildCardFaces } from "./store-card-faces";
import { countLoadedCards, withLoadedCardCount } from "./loaded-card-count";
import { countDeckCards } from "./deck-size";

export { makeDeckCard } from "./store-card-faces";
export { buildCardFaces } from "@/lib/scryfall/faces";

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
    cardRowCount: 0,
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
 * The player statistics read (`player-stats-rows.ts`) maps stored rows through it too,
 * so a deck's bracket is computed from the same cards the builder holds.
 *
 * @param card - card row from the deck API
 * @returns the store card
 */
export function apiCardToDeckCard(card: deckApi.ApiDeckCard): DeckCard {
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
 * Each row's slot is read by `commandSlotOf`, the rule the server clears
 * slots by. A partner whose name matches the commander is dropped.
 * It reads only the slot flags and the name, so any stored row shape works:
 * the deck comparison partitions the rows it is handed the same way.
 *
 * @param allCards - cards returned with the deck
 * @returns the four groups, each holding the rows it was given
 */
export function partitionApiCards<
  Row extends CommandSlotFlags & { readonly name: string },
>(allCards: readonly Row[]) {
  const bySlot = new Map<CommandSlot | null, Row[]>();
  for (const card of allCards) {
    const slot = commandSlotOf(card);
    const group = bySlot.get(slot) ?? [];
    group.push(card);
    bySlot.set(slot, group);
  }
  const firstIn = (slot: CommandSlot) => bySlot.get(slot)?.[0] ?? null;
  const commanderCard = firstIn("commander");
  const rawPartnerCard = firstIn("partner");
  const partnerCard =
    rawPartnerCard && rawPartnerCard.name !== commanderCard?.name ? rawPartnerCard : null;
  const companionCard = firstIn("companion");
  const deckCards = bySlot.get(null) ?? [];
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

  // The listing sends the server's row count and card copies; a full deck is
  // counted from the rows it holds, once the command zone has been read out.
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
    cardRowCount: d._count?.cards ?? 0,
    cardCopyCount: d.cardCopyCount,
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
 * row count, so a stub holds fewer rows than `cardRowCount`. The full deck comes from
 * `GET /api/decks/[id]`, and every edit of a loaded deck keeps `cardRowCount`
 * equal to its rows (`withLoadedCardCount`), so a loaded deck never reads as a
 * stub again.
 *
 * @param deck - a deck held in the store
 * @returns true when its main-deck cards have not been loaded yet
 */
export function isDeckStub(deck: Deck): boolean {
  return countLoadedCards(deck) < deck.cardRowCount;
}

/**
 * A deck's card count as the deck list shows it, equal to the editor's and the
 * builder title bar's count of the same deck (`countDeckCards`): copies, not
 * rows, with the commander and the partner (CR 903.5a).
 *
 * A stub holds only its command zone, so its count is the one the listing
 * summed in the database (`cardCopyCount`); a stub listed without one, by a
 * server older than the field, falls back to its row count, the old figure.
 * A loaded deck is counted from its rows, so an edit shows at once.
 *
 * @param deck - a deck held in the store, listed or loaded
 * @returns the number of cards the deck holds against its size rule
 */
export function deckCardCount(deck: Deck): number {
  if (!isDeckStub(deck)) return countDeckCards(deck);
  return deck.cardCopyCount ?? deck.cardRowCount;
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
