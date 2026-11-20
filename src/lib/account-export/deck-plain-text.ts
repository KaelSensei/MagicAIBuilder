/**
 * A stored deck as plain text, the format another deckbuilder imports
 * (I-38 requirement 7.2; GDPR Art. 20 portability).
 *
 * Identity context, pure. The text is line for line what the builder's
 * "Plain text" export writes (`exportPlainText` in `src/lib/deck/export.ts`),
 * built here from the stored rows: the account export runs on the server and
 * never loads the builder's store. The parity test in
 * `deck-plain-text.test.ts` keeps the two in step.
 *
 * @module account-export/deck-plain-text
 */
import {
  commandSlotOf,
  type CommandSlot,
} from "@/lib/deck/bulk-edit-command-zone";

/** The columns of a stored deck card the plain text reads. */
export interface PlainTextCardRow {
  readonly name: string;
  readonly quantity: number;
  readonly zone: string;
  readonly category: string;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly notes: string | null;
}

/** The command-zone headings, in the order the export writes them. */
const SLOT_HEADINGS: readonly (readonly [CommandSlot, string])[] = [
  ["commander", "Commander"],
  ["partner", "Partner"],
  ["companion", "Companion"],
];

/** The zones after the command zone, with the heading each one gets. */
const ZONE_HEADINGS: readonly (readonly [string, string])[] = [
  ["main", ""],
  ["sideboard", "Sideboard"],
  ["maybeboard", "Considering"],
];

/**
 * Writes a stored deck as the builder's plain-text export does.
 *
 * Each command-zone slot holds the first row that fills it, read by the same
 * flags as the deck loader (`commandSlotOf`), written as one copy. A partner
 * whose name matches the commander is dropped, as the loader drops it. Card
 * notes follow their card as `// Note:` lines.
 *
 * @param cards - The deck's stored card rows, in stored order.
 * @returns The deck's plain text, lines joined by `\n`.
 */
export function deckPlainText(cards: readonly PlainTextCardRow[]): string {
  const slots = commandZone(cards);
  const lines: string[] = [];
  for (const [slot, heading] of SLOT_HEADINGS) {
    const card = slots.get(slot);
    if (card) lines.push(heading, `1 ${card.name}`, "");
  }
  lines.push("Deck");
  const deckRows = cards.filter((card) => commandSlotOf(card) === null);
  for (const [zone, heading] of ZONE_HEADINGS) {
    const zoneRows = deckRows.filter((card) => card.zone === zone);
    if (zone !== "main" && zoneRows.length > 0) lines.push("", heading);
    lines.push(...zoneRows.flatMap(cardLines));
  }
  return lines.join("\n");
}

/** @returns the card filling each command-zone slot, as the deck loader picks it */
function commandZone(
  cards: readonly PlainTextCardRow[]
): ReadonlyMap<CommandSlot, PlainTextCardRow> {
  const slots = new Map<CommandSlot, PlainTextCardRow>();
  for (const card of cards) {
    const slot = commandSlotOf(card);
    if (slot !== null && !slots.has(slot)) slots.set(slot, card);
  }
  const partner = slots.get("partner");
  if (partner && partner.name === slots.get("commander")?.name) {
    slots.delete("partner");
  }
  return slots;
}

/** @returns the card's line, then one `// Note:` line per line of its note */
function cardLines(card: PlainTextCardRow): string[] {
  const note = card.notes?.trim();
  const notes = note
    ? note.split(/\r\n|\r|\n/).map((line) => `// Note: ${line}`)
    : [];
  return [`${card.quantity} ${card.name}`, ...notes];
}
