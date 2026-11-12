/**
 * Bulk Edit as a change set.
 *
 * The edited decklist is compared with the deck the player already has, line
 * by line on card name and zone, so a save touches only what the text changed.
 * Rows the player left alone keep their printing, category and notes. The
 * command zone is planned in `bulk-edit-command-zone`.
 *
 * @module deck/bulk-edit
 */
import { MAX_QUANTITY, type ImportResult } from "./import";
import type { Deck, DeckCard, DeckZone } from "./types";
import { cardsFromZoneSource } from "./zone-source";
import {
  COMMAND_SLOTS,
  planCommandZone,
  resolveCommandZone,
  slotName,
  type BulkEditRejection,
  type CommandSlot,
  type CommandZoneChange,
  type CommandZoneEdit,
} from "./bulk-edit-command-zone";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { normalizeImportedName } from "@/lib/scryfall/name-index";

export type { BulkEditRejection } from "./bulk-edit-command-zone";

/** One existing row whose quantity the edited list changes. */
export interface CardQuantityChange {
  readonly cardId: string;
  readonly quantity: number;
}

/** A decklist line: copies of one card in one zone. */
export interface BulkEditLine {
  readonly name: string;
  readonly quantity: number;
  readonly zone: DeckZone;
}

/** What a bulk edit changes in the deck: existing rows, and lines to add by name. */
export interface BulkEditPlan {
  readonly removedCardIds: readonly string[];
  readonly quantityChanges: readonly CardQuantityChange[];
  readonly additions: readonly BulkEditLine[];
  /** The edited command zone, or null when the text leaves every slot as it is. */
  readonly commandZone: CommandZoneEdit | null;
}

/** A line to add, resolved to the Scryfall printing that will be saved. */
export interface CardAddition {
  readonly card: ScryfallCard;
  readonly quantity: number;
  readonly zone: DeckZone;
}

/** A plan whose new lines all resolved to cards, ready to save. */
export interface BulkEdit {
  readonly removedCardIds: readonly string[];
  readonly quantityChanges: readonly CardQuantityChange[];
  readonly additions: readonly CardAddition[];
  readonly commandZone: CommandZoneChange | null;
}

/** A plan ready to save, or the reason it cannot be saved as written. */
export type BulkEditResolution =
  { readonly status: "ready"; readonly edit: BulkEdit } | BulkEditRejection;

/**
 * Identifies a decklist line: the same card in another zone is another line.
 *
 * @param name - card name as written or stored
 * @param zone - zone holding the card
 * @returns the comparison key
 */
function lineKey(name: string, zone: DeckZone): string {
  return `${zone}\u0000${normalizeImportedName(name)}`;
}

/**
 * Merges the edited text's lines per card and zone. Repeated lines add up, to
 * the most a single line may ask for.
 *
 * @param cards - parsed non-command lines
 * @returns the requested line by key, in text order
 */
function requestedLines(
  cards: ImportResult["cards"]
): ReadonlyMap<string, BulkEditLine> {
  const requested = new Map<string, BulkEditLine>();
  for (const { name, quantity, zone = "main" } of cards) {
    const key = lineKey(name, zone);
    const earlier = requested.get(key);
    requested.set(key, {
      name: earlier?.name ?? name,
      quantity: Math.min(MAX_QUANTITY, (earlier?.quantity ?? 0) + quantity),
      zone,
    });
  }
  return requested;
}

/**
 * Groups the deck's rows by card and zone, keeping deck order.
 *
 * @param cards - every non-command row of the deck
 * @returns rows by line key
 */
function rowsByLine(
  cards: readonly DeckCard[]
): ReadonlyMap<string, readonly DeckCard[]> {
  const rows = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const key = lineKey(card.name, card.zone);
    const group = rows.get(key);
    if (group) group.push(card);
    else rows.set(key, [card]);
  }
  return rows;
}

/**
 * Brings one line's rows to the wanted number of copies. Extra copies go on
 * the first row; fewer copies come off the last rows, so the printing listed
 * first is the one that stays.
 *
 * @param rows - the line's rows, in deck order
 * @param wanted - copies the edited text asks for
 * @returns the rows to remove and the rows to resize
 */
function lineChanges(
  rows: readonly DeckCard[],
  wanted: number
): {
  readonly removed: readonly string[];
  readonly resized: readonly CardQuantityChange[];
} {
  const current = rows.reduce((total, row) => total + row.quantity, 0);
  const [first] = rows;
  if (!first || wanted === current) return { removed: [], resized: [] };
  if (wanted > current) {
    return {
      removed: [],
      resized: [
        { cardId: first.id, quantity: first.quantity + wanted - current },
      ],
    };
  }
  const removed: string[] = [];
  const resized: CardQuantityChange[] = [];
  let surplus = current - wanted;
  for (const row of [...rows].reverse()) {
    if (surplus === 0) break;
    if (row.quantity <= surplus) {
      removed.push(row.id);
      surplus -= row.quantity;
    } else {
      resized.push({ cardId: row.id, quantity: row.quantity - surplus });
      surplus = 0;
    }
  }
  return { removed, resized };
}

/**
 * Compares the edited decklist with the deck and lists the changes.
 *
 * @param deck - the deck the text was exported from
 * @param parsed - the edited decklist
 * @returns the changes a save must apply
 */
export function planBulkEdit(
  deck: Pick<Deck, "cards" | "maybeboard" | CommandSlot>,
  parsed: Pick<ImportResult, "cards" | CommandSlot>
): BulkEditPlan {
  const requested = requestedLines(parsed.cards);
  const existing = rowsByLine(cardsFromZoneSource(deck));
  const removedCardIds: string[] = [];
  const quantityChanges: CardQuantityChange[] = [];

  for (const [key, rows] of existing) {
    const { removed, resized } = lineChanges(
      rows,
      requested.get(key)?.quantity ?? 0
    );
    removedCardIds.push(...removed);
    quantityChanges.push(...resized);
  }

  return {
    removedCardIds,
    quantityChanges,
    additions: [...requested].flatMap(([key, line]) =>
      existing.has(key) ? [] : [line]
    ),
    commandZone: planCommandZone(deck, parsed),
  };
}

/**
 * The names a save has to look up: lines the deck does not hold yet, and the
 * command zone when it changes, since its pairing is read from the cards.
 *
 * @param plan - the planned changes
 * @returns distinct names, in text order
 */
export function namesToLookUp(plan: BulkEditPlan): readonly string[] {
  const zone = plan.commandZone;
  const commandNames = zone
    ? COMMAND_SLOTS.flatMap((slot) => {
        const name = slotName(zone[slot]);
        return name === null ? [] : [name];
      })
    : [];
  return [
    ...new Set([...commandNames, ...plan.additions.map((line) => line.name)]),
  ];
}

/**
 * Attaches the looked-up card to every line the plan adds. One unknown name
 * stops the whole save: dropping the line would delete what the player typed.
 *
 * @param plan - the planned changes
 * @param cardsByName - looked-up cards keyed by normalized name
 * @returns the edit to save, or why it cannot be saved
 */
export function resolveBulkEdit(
  plan: BulkEditPlan,
  cardsByName: ReadonlyMap<string, ScryfallCard>
): BulkEditResolution {
  const commandZone = plan.commandZone
    ? resolveCommandZone(plan.commandZone, cardsByName)
    : null;
  const additions: CardAddition[] = [];
  const unknown = new Set<string>(
    commandZone?.status === "unknownCards" ? commandZone.names : []
  );
  for (const { name, quantity, zone } of plan.additions) {
    const card = cardsByName.get(normalizeImportedName(name));
    if (card) additions.push({ card, quantity, zone });
    else unknown.add(name);
  }
  if (unknown.size > 0) return { status: "unknownCards", names: [...unknown] };
  if (commandZone && commandZone.status !== "ready") return commandZone;
  return {
    status: "ready",
    edit: {
      removedCardIds: plan.removedCardIds,
      quantityChanges: plan.quantityChanges,
      additions,
      commandZone: commandZone
        ? {
            clearedSlots: commandZone.clearedSlots,
            cards: commandZone.cards,
            patch: commandZone.patch,
          }
        : null,
    },
  };
}

/**
 * Whether a plan leaves the deck exactly as it is.
 *
 * @param plan - the planned changes
 * @returns true when there is nothing to save
 */
export function isEmptyBulkEdit(plan: BulkEditPlan): boolean {
  return (
    plan.removedCardIds.length === 0 &&
    plan.quantityChanges.length === 0 &&
    plan.additions.length === 0 &&
    plan.commandZone === null
  );
}
