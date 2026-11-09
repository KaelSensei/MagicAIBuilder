/**
 * Bulk Edit as a change set.
 *
 * The edited decklist is compared with the deck the player already has, line
 * by line on card name and zone, so a save touches only what the text changed.
 * Rows the player left alone keep their printing, category and notes.
 *
 * @module deck/bulk-edit
 */
import { MAX_QUANTITY, type ImportResult } from "./import";
import type { CommanderPairingType, Deck, DeckCard, DeckZone } from "./types";
import { canPairWith, detectPairingType } from "./pairing";
import {
  isBannedCompanionInCommander,
  isScryfallCompanionCard,
} from "./companion";
import { cardsFromZoneSource } from "./zone-source";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { normalizeImportedName } from "@/lib/scryfall/name-index";

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

/** The three command-zone slots a decklist names. */
export type CommandSlot = "commander" | "partner" | "companion";

/** Every command-zone slot, in the order a decklist lists them. */
export const COMMAND_SLOTS: readonly CommandSlot[] = [
  "commander",
  "partner",
  "companion",
];

/** The flags that mark a stored row as filling a slot, as the deck loader reads them. */
export const COMMAND_SLOT_ROWS: Readonly<
  Record<
    CommandSlot,
    {
      readonly isCommander?: boolean;
      readonly isPartner?: boolean;
      readonly category?: "companion";
    }
  >
> = {
  commander: { isCommander: true, isPartner: false },
  partner: { isPartner: true },
  companion: { isCommander: false, isPartner: false, category: "companion" },
};

/** How the edited text leaves one command-zone slot. */
export type CommandSlotEdit =
  | { readonly kind: "keep"; readonly card: DeckCard }
  | { readonly kind: "empty" }
  | { readonly kind: "replace"; readonly name: string };

/** The edited command zone, slot by slot. */
export type CommandZoneEdit = Readonly<Record<CommandSlot, CommandSlotEdit>>;

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

/** A card entering a command-zone slot. */
export interface CommandCardAddition {
  readonly card: ScryfallCard;
  readonly slot: CommandSlot;
}

/** The deck fields that record the command zone. */
export interface CommandZonePatch {
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: CommanderPairingType;
}

/** A changed command zone: the slots to empty, the rows to create, the deck fields to write. */
export interface CommandZoneChange {
  /**
   * Slots whose rows are removed, matched by role rather than by row id: a
   * commander picked by hand is known to the editor only by its printing.
   */
  readonly clearedSlots: readonly CommandSlot[];
  readonly cards: readonly CommandCardAddition[];
  readonly patch: CommandZonePatch;
}

/** A plan whose new lines all resolved to cards, ready to save. */
export interface BulkEdit {
  readonly removedCardIds: readonly string[];
  readonly quantityChanges: readonly CardQuantityChange[];
  readonly additions: readonly CardAddition[];
  readonly commandZone: CommandZoneChange | null;
}

/** Why an edited list cannot be saved as written. */
export type BulkEditRejection =
  | { readonly status: "unknownCards"; readonly names: readonly string[] }
  | { readonly status: "invalidPartner"; readonly name: string }
  | { readonly status: "invalidCompanion"; readonly name: string };

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
 * Compares one command-zone slot with the name the edited text gives it.
 *
 * @param current - the card the slot holds now
 * @param wanted - the name the text puts there, if any
 * @returns the slot's edit
 */
function planCommandSlot(
  current: DeckCard | null,
  wanted: string | null
): CommandSlotEdit {
  if (wanted === null) return { kind: "empty" };
  if (
    current &&
    normalizeImportedName(current.name) === normalizeImportedName(wanted)
  ) {
    return { kind: "keep", card: current };
  }
  return { kind: "replace", name: wanted };
}

/**
 * Plans the command zone slot by slot.
 *
 * @param deck - the deck the text was exported from
 * @param parsed - the edited decklist
 * @returns the zone edit, or null when no slot changes
 */
function planCommandZone(
  deck: Pick<Deck, CommandSlot>,
  parsed: Pick<ImportResult, CommandSlot>
): CommandZoneEdit | null {
  const edit: CommandZoneEdit = {
    commander: planCommandSlot(deck.commander, parsed.commander),
    partner: planCommandSlot(deck.partner, parsed.partner),
    companion: planCommandSlot(deck.companion, parsed.companion),
  };
  const changed = COMMAND_SLOTS.some((slot) =>
    edit[slot].kind === "empty"
      ? deck[slot] !== null
      : edit[slot].kind === "replace"
  );
  return changed ? edit : null;
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
 * The name a command-zone slot ends up holding.
 *
 * @param edit - the slot's edit
 * @returns the card name, or null for an empty slot
 */
function slotName(edit: CommandSlotEdit): string | null {
  switch (edit.kind) {
    case "keep":
      return edit.card.name;
    case "replace":
      return edit.name;
    case "empty":
      return null;
    default: {
      const exhaustive: never = edit;
      return exhaustive;
    }
  }
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
 * Whether a card may fill the companion slot, by the rules the editor applies
 * when a companion is picked directly.
 *
 * @param card - the looked-up companion
 * @returns true for a card with Companion that Commander does not ban there
 */
function isAllowedCompanion(card: ScryfallCard): boolean {
  return isScryfallCompanionCard(card) && !isBannedCompanionInCommander(card);
}

/** The looked-up card for every filled command-zone slot. */
type CommandZoneCards = Readonly<Record<CommandSlot, ScryfallCard | undefined>>;

/**
 * Applies the rules the editor enforces when the command zone is filled by hand.
 *
 * @param zone - the edited command zone
 * @param cards - the looked-up card of each filled slot
 * @returns why the zone is refused, or null when it is valid
 */
function commandZoneRejection(
  zone: CommandZoneEdit,
  cards: CommandZoneCards
): BulkEditRejection | null {
  const { commander, partner, companion } = cards;
  if (partner) {
    const commanderPairing = commander ? detectPairingType(commander) : "none";
    const sameCard = partner.name === commander?.name;
    const unpairable =
      commanderPairing === "father_son" &&
      !canPairWith(commanderPairing, detectPairingType(partner));
    if (sameCard || unpairable)
      return { status: "invalidPartner", name: partner.name };
  }
  if (companion) {
    const refusedNewCompanion =
      zone.companion.kind === "replace" && !isAllowedCompanion(companion);
    if (!commander || refusedNewCompanion)
      return { status: "invalidCompanion", name: companion.name };
  }
  return null;
}

/**
 * The deck fields recording an edited command zone.
 *
 * Pairing follows the commander, as when a commander and partner are picked one
 * after the other: a commander without a pairing ability takes the partner's.
 * A kept slot keeps the printing it already had.
 *
 * @param zone - the edited command zone
 * @param cards - the looked-up card of each filled slot
 * @returns the fields to write
 */
function commandZonePatch(
  zone: CommandZoneEdit,
  cards: CommandZoneCards
): CommandZonePatch {
  const printingId = (slot: CommandSlot): string | null => {
    const edit = zone[slot];
    if (edit.kind === "keep") return edit.card.scryfallId ?? edit.card.id;
    return cards[slot]?.id ?? null;
  };
  const commanderPairing = cards.commander
    ? detectPairingType(cards.commander)
    : "none";
  const partnerPairing = cards.partner
    ? detectPairingType(cards.partner)
    : "none";
  return {
    commanderId: printingId("commander"),
    commanderName: cards.commander?.name ?? null,
    partnerId: printingId("partner"),
    companionId: printingId("companion"),
    pairingType:
      commanderPairing === "none" ? partnerPairing : commanderPairing,
  };
}

/**
 * Resolves the edited command zone into rows to add and deck fields to write.
 *
 * @param zone - the edited command zone
 * @param cardsByName - looked-up cards keyed by normalized name
 * @returns the zone change, or why it cannot be saved
 */
function resolveCommandZone(
  zone: CommandZoneEdit,
  cardsByName: ReadonlyMap<string, ScryfallCard>
): ({ readonly status: "ready" } & CommandZoneChange) | BulkEditRejection {
  const unknown: string[] = [];
  const lookUp = (slot: CommandSlot): ScryfallCard | undefined => {
    const name = slotName(zone[slot]);
    if (name === null) return undefined;
    const card = cardsByName.get(normalizeImportedName(name));
    if (!card) unknown.push(name);
    return card;
  };
  const cards: CommandZoneCards = {
    commander: lookUp("commander"),
    partner: lookUp("partner"),
    companion: lookUp("companion"),
  };
  if (unknown.length > 0) return { status: "unknownCards", names: unknown };

  const rejection = commandZoneRejection(zone, cards);
  if (rejection) return rejection;
  return {
    status: "ready",
    clearedSlots: COMMAND_SLOTS.filter((slot) => zone[slot].kind !== "keep"),
    cards: COMMAND_SLOTS.flatMap((slot) => {
      const card = cards[slot];
      return zone[slot].kind === "replace" && card ? [{ card, slot }] : [];
    }),
    patch: commandZonePatch(zone, cards),
  };
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
