// Deck import from text format — with input sanitization
import type { DeckCard } from "./types";

export interface ImportResult {
  commander: string | null;
  cards: Array<{ name: string; quantity: number }>;
  errors: string[];
}

const MAX_LINES = 500;
const MAX_NAME_LENGTH = 200;
const MAX_QUANTITY = 99;
const MIN_QUANTITY = 1;

/** Strip HTML tags and control characters from a string */
function sanitizeName(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[^\x20-\x7E\u00C0-\u017E]/g, "") // printable ASCII + latin extended
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

/** Clamp quantity to [1, 99] */
function clampQuantity(n: number): number {
  if (!Number.isFinite(n) || n < MIN_QUANTITY) return MIN_QUANTITY;
  if (n > MAX_QUANTITY) return MAX_QUANTITY;
  return Math.floor(n);
}

/** Parse a plain-text decklist (1x Card Name or 1 Card Name format) */
export function parseTextDecklist(text: string): ImportResult {
  if (typeof text !== "string") {
    return { commander: null, cards: [], errors: ["Invalid input"] };
  }

  const lines = text
    .split("\n")
    .slice(0, MAX_LINES)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));

  const cards: Array<{ name: string; quantity: number }> = [];
  const errors: string[] = [];
  let commander: string | null = null;
  let inCommanderSection = false;

  for (const line of lines) {
    if (/^commander/i.test(line)) { inCommanderSection = true; continue; }
    if (/^(deck|main|mainboard|99)/i.test(line)) { inCommanderSection = false; continue; }

    const match = line.match(/^(\d+)x?\s+(.+)$/);
    if (match) {
      const quantity = clampQuantity(parseInt(match[1], 10));
      // Strip trailing set code + collector number: "Card Name (SET) 123" or "Card Name (SET) 123p" or "Card Name (SET) 123s"
      const rawName = match[2].replace(/\s+\([A-Z0-9]+\)\s+\d+[a-z*]*\s*$/i, "").trim();
      const name = sanitizeName(rawName);
      if (!name) { errors.push(`Skipped empty card name on line: ${line.slice(0, 50)}`); continue; }
      if (inCommanderSection && !commander) { commander = name; } else { cards.push({ name, quantity }); }
    } else if (line) {
      const rawName = line.replace(/\s+\([A-Z0-9]+\)\s+\d+[a-z*]*\s*$/i, "").trim();
      const name = sanitizeName(rawName);
      if (!name) continue;
      if (inCommanderSection && !commander) { commander = name; } else { cards.push({ name, quantity: 1 }); }
    }
  }

  return { commander, cards, errors };
}

/** Export deck to plain text */
export function exportToText(
  commander: DeckCard | null,
  partner: DeckCard | null,
  cards: DeckCard[]
): string {
  const lines: string[] = [];
  if (commander) { lines.push("Commander"); lines.push(`1 ${commander.name}`); lines.push(""); }
  if (partner) { lines.push("Partner"); lines.push(`1 ${partner.name}`); lines.push(""); }
  lines.push("Deck");
  for (const card of cards) { lines.push(`${card.quantity} ${card.name}`); }
  return lines.join("\n");
}
