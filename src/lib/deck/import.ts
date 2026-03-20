// Deck import from text format
import type { DeckCard } from "./types";

export interface ImportResult {
  commander: string | null;
  cards: Array<{ name: string; quantity: number }>;
  errors: string[];
}

/** Parse a plain-text decklist (1x Card Name or 1 Card Name format) */
export function parseTextDecklist(text: string): ImportResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));

  const cards: Array<{ name: string; quantity: number }> = [];
  const errors: string[] = [];
  let commander: string | null = null;

  // Detect commander section
  let inCommanderSection = false;
  let inMainSection = false;

  for (const line of lines) {
    // Section headers
    if (/^commander/i.test(line)) {
      inCommanderSection = true;
      inMainSection = false;
      continue;
    }
    if (/^(deck|main|mainboard|99)/i.test(line)) {
      inCommanderSection = false;
      inMainSection = true;
      continue;
    }

    // Parse card line: "1 Card Name" or "1x Card Name" or just "Card Name"
    const match = line.match(/^(\d+)x?\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();
      if (inCommanderSection && !commander) {
        commander = name;
      } else {
        cards.push({ name, quantity });
      }
    } else if (line) {
      // Just a card name with no quantity
      if (inCommanderSection && !commander) {
        commander = line;
      } else {
        cards.push({ name: line, quantity: 1 });
      }
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

  if (commander) {
    lines.push("Commander");
    lines.push(`1 ${commander.name}`);
    lines.push("");
  }

  if (partner) {
    lines.push("Partner");
    lines.push(`1 ${partner.name}`);
    lines.push("");
  }

  lines.push("Deck");
  for (const card of cards) {
    lines.push(`${card.quantity} ${card.name}`);
  }

  return lines.join("\n");
}
