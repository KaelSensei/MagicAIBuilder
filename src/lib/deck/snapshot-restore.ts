import { commandSlotOf } from "@/lib/deck/bulk-edit-command-zone";
import type { DeckZone } from "@/lib/deck/types";
import { isNonEmptyString, isRecord } from "@/lib/guards";

const DECK_ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];

/**
 * The `Deck` columns that name its commanders. They copy the command-zone
 * rows: community discovery matches `commanderName` in SQL, so they must
 * change whenever those rows do.
 */
export interface DeckCommanders {
  /** The commander row's Scryfall id, or null without a commander row. */
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  /** The partner row's Scryfall id, or null without a partner row. */
  readonly partnerId: string | null;
}

/** A deck rebuilt from a snapshot: its card rows and the commanders they name. */
export interface RestoredDeck {
  readonly cards: readonly RestoredDeckCard[];
  readonly commanders: DeckCommanders;
}

/** One deck card rebuilt from a snapshot, ready for `deckCard.createMany`. */
export interface RestoredDeckCard {
  readonly deckId: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly notes: string | null;
  readonly zone: DeckZone;
}

/**
 * Rebuilds deck-card rows from a snapshot payload.
 *
 * Snapshots store the full card row, including zone, notes and power/toughness.
 * Restore must write those fields back; otherwise a sideboard card returns to
 * the main deck and annotations disappear.
 *
 * @param deckId - Deck that owns the restored cards.
 * @param cardList - `DeckSnapshot.cardList` JSON.
 * @returns Rows for `deckCard.createMany`, without the old database ids.
 */
export function restoredDeckCards(
  deckId: string,
  cardList: unknown
): readonly RestoredDeckCard[] {
  if (!Array.isArray(cardList)) {
    throw new TypeError("Snapshot card list is not an array");
  }
  return cardList.map((entry) => restoredDeckCard(deckId, entry));
}

/**
 * Rebuilds a deck from a snapshot payload: its card rows, and the commander
 * fields read from those rows, so a snapshot taken under another commander
 * brings that commander back on the deck too (I-55 requirement 5.6).
 *
 * @param deckId - Deck that owns the restored cards.
 * @param cardList - `DeckSnapshot.cardList` JSON.
 * @returns The rows to insert and the deck fields to write with them.
 * @throws when the card list is not a list of cards, before anything is written.
 */
export function restoredDeck(deckId: string, cardList: unknown): RestoredDeck {
  const cards = restoredDeckCards(deckId, cardList);
  return { cards, commanders: commandersOf(cards) };
}

/**
 * The commander fields a set of card rows implies. A row's slot is read with
 * the flags the deck loader uses (`commandSlotOf`), so a companion is never
 * taken for a commander. Without a commander row the fields are null: the
 * restored deck then shows no commander, and its columns must agree.
 *
 * @param cards - The deck's card rows.
 * @returns The commander and partner of those rows.
 */
export function commandersOf(
  cards: readonly RestoredDeckCard[]
): DeckCommanders {
  let commander: RestoredDeckCard | undefined;
  let partner: RestoredDeckCard | undefined;
  for (const card of cards) {
    const slot = commandSlotOf(card);
    if (slot === "commander") commander ??= card;
    else if (slot === "partner") partner ??= card;
  }
  return {
    commanderId: commander?.scryfallId ?? null,
    commanderName: commander?.name ?? null,
    partnerId: partner?.scryfallId ?? null,
  };
}

/**
 * @param deckId - Deck that owns the restored card.
 * @param entry - One element of the snapshot card list.
 * @returns The card row to insert.
 */
function restoredDeckCard(deckId: string, entry: unknown): RestoredDeckCard {
  if (!isRecord(entry)) {
    throw new Error("Snapshot card is not an object");
  }
  const scryfallId = readRequiredString(entry.scryfallId, "scryfallId");
  const name = readRequiredString(entry.name, "name");
  return {
    deckId,
    scryfallId,
    name,
    manaCost: readString(entry.manaCost, ""),
    cmc: readFiniteNumber(entry.cmc, 0),
    typeLine: readString(entry.typeLine, ""),
    oracleText: readString(entry.oracleText, ""),
    power: readNullableString(entry.power),
    toughness: readNullableString(entry.toughness),
    colorIdentity: readStrings(entry.colorIdentity),
    isGameChanger: readBoolean(entry.isGameChanger),
    isBanned: readBoolean(entry.isBanned),
    price: readNullableNumber(entry.price),
    imageUri: readString(entry.imageUri, ""),
    artCropUri: readString(entry.artCropUri, ""),
    category: readString(entry.category, "other"),
    quantity: readQuantity(entry.quantity),
    isCommander: readBoolean(entry.isCommander),
    isPartner: readBoolean(entry.isPartner),
    notes: readNullableString(entry.notes),
    zone: readZone(entry.zone),
  };
}

/**
 * @param value - Candidate string.
 * @param field - Field name included in the error when the value is unusable.
 * @returns The string when it is non-empty.
 */
function readRequiredString(value: unknown, field: string): string {
  if (isNonEmptyString(value)) return value;
  throw new Error(`Snapshot card is missing ${field}`);
}

/**
 * @param value - Candidate string.
 * @param fallback - Value used when `value` is not a string.
 * @returns The string, or `fallback`.
 */
function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * @param value - Candidate string.
 * @returns The string, or null when the snapshot did not store one.
 */
function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * @param value - Candidate boolean.
 * @returns The boolean, or false when the snapshot omitted it.
 */
function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

/**
 * @param value - Candidate number.
 * @param fallback - Value used when `value` is not a finite number.
 * @returns The number, or `fallback`.
 */
function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * @param value - Candidate price.
 * @returns The price, or null when the snapshot has no numeric price.
 */
function readNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * @param value - Candidate quantity.
 * @returns A positive integer, or 1 when the snapshot quantity is unusable.
 */
function readQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }
  return 1;
}

/**
 * @param value - Candidate string list.
 * @returns The strings from the list. Non-strings are dropped.
 */
function readStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings: string[] = [];
  for (const item of value) {
    if (typeof item === "string") strings.push(item);
  }
  return strings;
}

/**
 * @param value - Candidate zone.
 * @returns A known deck zone, or `"main"` when the snapshot zone is absent.
 */
function readZone(value: unknown): DeckZone {
  if (typeof value !== "string") return "main";
  for (const zone of DECK_ZONES) {
    if (zone === value) return zone;
  }
  return "main";
}
