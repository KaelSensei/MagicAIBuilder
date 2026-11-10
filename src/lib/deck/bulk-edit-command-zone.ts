/**
 * The command zone of a bulk edit: commander, partner and companion.
 *
 * Each slot is compared with the name the edited text gives it, so a slot the
 * player left alone keeps its row and printing. A changed zone is resolved
 * with the rules the editor applies when the slots are filled by hand.
 *
 * @module deck/bulk-edit-command-zone
 */
import type { ImportResult } from "./import";
import type { CommanderPairingType, Deck, DeckCard } from "./types";
import { detectPairingType, pairCommanders, pairingCardOf } from "./pairing";
import {
  isBannedCompanionInCommander,
  isScryfallCompanionCard,
} from "./companion";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { normalizeImportedName } from "@/lib/scryfall/name-index";

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

/** Why an edited list cannot be saved as written. */
export type BulkEditRejection =
  | { readonly status: "unknownCards"; readonly names: readonly string[] }
  | { readonly status: "invalidPartner"; readonly name: string }
  | { readonly status: "invalidCompanion"; readonly name: string };

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
export function planCommandZone(
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
 * The name a command-zone slot ends up holding.
 *
 * @param edit - the slot's edit
 * @returns the card name, or null for an empty slot
 */
export function slotName(edit: CommandSlotEdit): string | null {
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
  // CR 702.124: the partner joins only through a partner ability both allow.
  if (
    commander &&
    partner &&
    !pairCommanders(pairingCardOf(commander), pairingCardOf(partner))
  ) {
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
 * The pairing a command zone records: the one a pair uses, or the slot a lone
 * card opens, as when a commander and partner are picked one after the other.
 *
 * @param cards - the looked-up card of each filled slot
 * @returns the pairing type to save
 */
function zonePairingType(cards: CommandZoneCards): CommanderPairingType {
  const commander = cards.commander ? pairingCardOf(cards.commander) : null;
  const partner = cards.partner ? pairingCardOf(cards.partner) : null;
  if (commander && partner) return pairCommanders(commander, partner) ?? "none";
  const lone = commander ?? partner;
  return lone ? detectPairingType(lone) : "none";
}

/**
 * The deck fields recording an edited command zone.
 *
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
  return {
    commanderId: printingId("commander"),
    commanderName: cards.commander?.name ?? null,
    partnerId: printingId("partner"),
    companionId: printingId("companion"),
    pairingType: zonePairingType(cards),
  };
}

/**
 * Resolves the edited command zone into rows to add and deck fields to write.
 *
 * @param zone - the edited command zone
 * @param cardsByName - looked-up cards keyed by normalized name
 * @returns the zone change, or why it cannot be saved
 */
export function resolveCommandZone(
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
