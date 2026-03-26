// Deck import from text format — with input sanitization
import type { DeckCard } from "./types";

export interface ImportResult {
  commander: string | null;
  partner: string | null;
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
    // Bounded quantifier prevents ReDoS: HTML tags are at most ~200 chars
    .replaceAll(/<[^>]{0,200}>/g, "") // strip HTML tags
    .replaceAll(/[^\x20-\x7E\u00C0-\u017E]/g, "") // printable ASCII + latin extended
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

/** Clamp quantity to [1, 99] */
function clampQuantity(n: number): number {
  if (!Number.isFinite(n) || n < MIN_QUANTITY) return MIN_QUANTITY;
  if (n > MAX_QUANTITY) return MAX_QUANTITY;
  return Math.floor(n);
}

/** Strip trailing set code + collector number: "Card Name (SET) 123" or "... 123p" or "... 123★" */
// Bounded quantifiers prevent ReDoS: set codes ≤6 chars, collector numbers ≤6 digits
const SET_CODE_PATTERN = /\s{1,5}\([A-Z0-9]{1,6}\)\s{1,5}\d{1,6}[a-z*★]{0,3}\s*$/i;

type ParseState = {
  commander: string | null;
  partner: string | null;
  cards: Array<{ name: string; quantity: number }>;
  errors: string[];
  inCommanderSection: boolean;
};

/** Process a single line and mutate state accordingly */
function processImportLine(line: string, state: ParseState): void {
  if (/^commander/i.test(line)) { state.inCommanderSection = true; return; }
  if (/^(deck|main|mainboard|99)/i.test(line)) { state.inCommanderSection = false; return; }

  const match = /^(\d+)x?\s+(.+)$/.exec(line);
  const rawName = match
    ? match[2].replace(SET_CODE_PATTERN, "").trim()
    : line.replace(SET_CODE_PATTERN, "").trim();
  const quantity = match ? clampQuantity(Number.parseInt(match[1], 10)) : 1;
  const name = sanitizeName(rawName);

  if (!name) {
    if (match) state.errors.push(`Skipped empty card name on line: ${line.slice(0, 50)}`);
    return;
  }

  if (state.inCommanderSection) {
    if (!state.commander) {
      state.commander = name;
    } else if (!state.partner) {
      // Second card in Commander section = partner
      state.partner = name;
    } else {
      state.cards.push({ name, quantity });
    }
  } else {
    state.cards.push({ name, quantity });
  }
}

/** Parse a plain-text decklist (1x Card Name or 1 Card Name format) */
export function parseTextDecklist(text: string): ImportResult {
  if (typeof text !== "string") {
    return { commander: null, partner: null, cards: [], errors: ["Invalid input"] };
  }

  const lines = text
    .split("\n")
    .slice(0, MAX_LINES)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));

  const state: ParseState = { commander: null, partner: null, cards: [], errors: [], inCommanderSection: false };

  for (const line of lines) {
    processImportLine(line, state);
  }

  return { commander: state.commander, partner: state.partner, cards: state.cards, errors: state.errors };
}

/** Export deck to plain text */
export function exportToText(
  commander: DeckCard | null,
  partner: DeckCard | null,
  cards: DeckCard[]
): string {
  const lines: string[] = [];
  if (commander) { lines.push("Commander", `1 ${commander.name}`, ""); }
  if (partner) { lines.push("Partner", `1 ${partner.name}`, ""); }
  lines.push("Deck");
  for (const card of cards) { lines.push(`${card.quantity} ${card.name}`); }
  return lines.join("\n");
}
