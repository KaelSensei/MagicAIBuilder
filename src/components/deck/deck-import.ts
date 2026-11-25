/**
 * Adds a decklist the player previewed to the open deck, and reports what the deck took (I-01).
 *
 * The deck store refuses some adds and says which: a card already at its copy limit
 * (CR 100.2a, CR 903.5b) or a basic land its zone already holds. The command-zone setters
 * return nothing, so the import reads the deck once each has settled: a partner the commander
 * cannot pair with (CR 702.124a), a companion without a commander, or a save the server
 * refused leaves the slot without the card, and the store's own notice says why.
 *
 * The count is one per command-zone card and one per decklist line, whatever the line's
 * quantity, as the import's success sentence has always counted.
 *
 * @module components/deck/deck-import
 */
import { forEachSequential } from "@/lib/async/sequential";
import type { ImportResult } from "@/lib/deck/import";
import type { CardAdditionResult, DeckStore } from "@/lib/deck/store";
import type { Deck, DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
} from "@/lib/scryfall/name-index";

/** A command-zone slot a decklist can fill. */
export type CommandZoneSlot = "commander" | "partner" | "companion";

/** The slots in the order the import fills them: a partner pairs with the commander set first. */
const COMMAND_ZONE_SLOTS: readonly CommandZoneSlot[] = [
  "commander",
  "partner",
  "companion",
];

/** A command-zone card whose name Scryfall found. */
interface PlannedCommandZoneCard {
  readonly slot: CommandZoneSlot;
  readonly card: ScryfallCard;
}

/** A decklist line whose name Scryfall found. */
interface PlannedLine {
  readonly card: ScryfallCard;
  readonly quantity: number;
  readonly zone: DeckZone;
}

/** What an import adds, in order: the command zone first, then each decklist line. */
export interface DeckImportPlan {
  readonly commandZone: readonly PlannedCommandZoneCard[];
  readonly lines: readonly PlannedLine[];
}

/**
 * Why the deck refused a card: the store's own reasons for an add, or a command-zone slot
 * that does not hold the card once its setter has settled.
 */
export type DeckImportRefusal =
  | Extract<
      CardAdditionResult,
      { readonly kind: "at-copy-limit" | "basic-land-held" }
    >
  | { readonly kind: "command-zone-unchanged" };

/** A card the deck refused, named as Scryfall prints it. */
export interface RefusedCard {
  readonly name: string;
  readonly refusal: DeckImportRefusal;
}

/**
 * What an import did. `imported` counts the cards the deck took and lists the refused ones,
 * each name once; `no-open-deck` means the deck closed before the import ended.
 */
export type DeckImportOutcome =
  | {
      readonly kind: "imported";
      readonly added: number;
      readonly refused: readonly RefusedCard[];
    }
  | { readonly kind: "no-open-deck" };

/**
 * The store actions an import calls, and a read of the open deck's command zone, taken once a
 * setter has settled; `undefined` when no deck is open.
 */
export type DeckImportActions = Pick<
  DeckStore,
  "addCard" | "setCommander" | "setPartner" | "setCompanion"
> & {
  readonly openDeck: () => Pick<Deck, CommandZoneSlot> | undefined;
};

/** What adding one card did. */
type CardOutcome =
  CardAdditionResult | { readonly kind: "command-zone-unchanged" };

/** One card the import tried to add, and what came of it. */
interface ImportedCard {
  readonly name: string;
  readonly outcome: CardOutcome;
}

const SEAT_IN: Readonly<
  Record<
    CommandZoneSlot,
    (actions: DeckImportActions, card: ScryfallCard) => Promise<void>
  >
> = {
  commander: (actions, card) => actions.setCommander(card),
  partner: (actions, card) => actions.setPartner(card),
  companion: (actions, card) => actions.setCompanion(card),
};

/**
 * The import of a previewed text decklist: each name Scryfall found, with the card it found.
 * A name it did not find is left out; the preview already lists it.
 *
 * @param parsed - The decklist as the text parser read it
 * @param foundCards - The cards Scryfall returned for the decklist's names
 * @returns The cards to add, command zone first
 */
export function planTextImport(
  parsed: Pick<ImportResult, CommandZoneSlot | "cards">,
  foundCards: readonly ScryfallCard[]
): DeckImportPlan {
  const byName = buildScryfallNameIndex(foundCards);
  const find = (name: string) => byName.get(normalizeImportedName(name));
  return {
    commandZone: COMMAND_ZONE_SLOTS.flatMap((slot) => {
      const name = parsed[slot];
      const card = name ? find(name) : undefined;
      return card ? [{ slot, card }] : [];
    }),
    lines: parsed.cards.flatMap(({ name, quantity, zone = "main" }) => {
      const card = find(name);
      return card ? [{ card, quantity, zone }] : [];
    }),
  };
}

/**
 * Adds the planned cards to the open deck one after another, and reports what the deck took.
 *
 * @param plan - The cards to add, from {@link planTextImport}
 * @param actions - The deck store's actions and a read of the open deck
 * @returns The cards added and the cards refused, or `no-open-deck` when no deck was open
 */
export async function importIntoDeck(
  plan: DeckImportPlan,
  actions: DeckImportActions
): Promise<DeckImportOutcome> {
  const imported: ImportedCard[] = [];
  await forEachSequential(plan.commandZone, async (planned) => {
    imported.push({
      name: planned.card.name,
      outcome: await seat(planned, actions),
    });
  });
  await forEachSequential(plan.lines, async ({ card, quantity, zone }) => {
    imported.push({
      name: card.name,
      outcome: await actions.addCard(card, { quantity, zone }),
    });
  });
  return tally(imported);
}

/** Sets a command-zone card, then reads whether the slot holds it. */
async function seat(
  { slot, card }: PlannedCommandZoneCard,
  actions: DeckImportActions
): Promise<CardOutcome> {
  await SEAT_IN[slot](actions, card);
  const deck = actions.openDeck();
  if (!deck) return { kind: "no-open-deck" };
  return deck[slot]?.name === card.name
    ? { kind: "added" }
    : { kind: "command-zone-unchanged" };
}

/** Counts the cards the deck took and lists each refused name once, with its first reason. */
function tally(imported: readonly ImportedCard[]): DeckImportOutcome {
  let added = 0;
  const refused = new Map<string, RefusedCard>();
  for (const { name, outcome } of imported) {
    switch (outcome.kind) {
      case "no-open-deck":
        return { kind: "no-open-deck" };
      case "added":
        added += 1;
        break;
      default:
        if (!refused.has(name)) refused.set(name, { name, refusal: outcome });
    }
  }
  return { kind: "imported", added, refused: [...refused.values()] };
}
