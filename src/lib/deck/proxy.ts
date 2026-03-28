/**
 * Proxy export utilities.
 *
 * Builds the list of card slots to print (respecting quantity),
 * filtering by user options.
 */
import type { DeckCard } from "./types";

export interface ProxyConfig {
  /** Paper format */
  paper: "a4" | "letter";
  /** Cards per row × per column */
  layout: "3x3" | "2x2";
  /** Scryfall image size */
  quality: "standard" | "high";
  /** Include basic lands */
  includeLands: boolean;
  /** Include commander(s) */
  includeCommander: boolean;
}

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  paper: "a4",
  layout: "3x3",
  quality: "standard",
  includeLands: false,
  includeCommander: true,
};

export interface ProxySlot {
  readonly id: string;       // unique key (cardId + index for quantity > 1)
  readonly name: string;
  readonly imageUri: string; // normal or large depending on quality
  readonly manaCost: string;
  readonly typeLine: string;
  readonly isCommander: boolean;
}

const BASIC_LAND_TYPES = new Set([
  "plains", "island", "swamp", "mountain", "forest", "wastes",
]);

function isBasicLand(card: DeckCard): boolean {
  const type = card.typeLine.toLowerCase();
  return (
    type.includes("basic land") ||
    BASIC_LAND_TYPES.has(card.name.toLowerCase())
  );
}

/** Build the flat list of print slots from a deck */
export function buildProxySlots(
  cards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  config: ProxyConfig
): ProxySlot[] {
  const slots: ProxySlot[] = [];

  // Commanders
  if (config.includeCommander) {
    for (const cmd of [commander, partner]) {
      if (!cmd) continue;
      slots.push({
        id: `cmd-${cmd.id}`,
        name: cmd.name,
        imageUri: config.quality === "high" ? cmd.imageUri : cmd.imageUri,
        manaCost: cmd.manaCost,
        typeLine: cmd.typeLine,
        isCommander: true,
      });
    }
  }

  // Deck cards (main zone only, exclude sideboard/maybeboard)
  for (const card of cards) {
    if (card.zone !== "main") continue;
    if (!config.includeLands && isBasicLand(card)) continue;

    const qty = Math.max(1, card.quantity);
    for (let i = 0; i < qty; i++) {
      slots.push({
        id: `${card.id}-${i}`,
        name: card.name,
        imageUri: card.imageUri,
        manaCost: card.manaCost,
        typeLine: card.typeLine,
        isCommander: false,
      });
    }
  }

  return slots;
}

/** Cards-per-page for a given layout */
export function cardsPerPage(layout: ProxyConfig["layout"]): number {
  return layout === "3x3" ? 9 : 4;
}

/** Estimated page count */
export function estimatePages(slotCount: number, layout: ProxyConfig["layout"]): number {
  return Math.ceil(slotCount / cardsPerPage(layout));
}
