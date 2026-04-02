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
  /** When false, print sheets use text/oracle placeholders only (no image preload). */
  includeCardArt: boolean;
}

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  paper: "a4",
  layout: "3x3",
  quality: "standard",
  includeLands: false,
  includeCommander: true,
  includeCardArt: true,
};

export interface ProxySlot {
  readonly id: string;       // unique key (cardId + index for quantity > 1)
  readonly name: string;
  readonly imageUri: string; // normal or large depending on quality
  readonly manaCost: string;
  readonly typeLine: string;
  readonly oracleText: string;
  /** Creature P/T for proxy fallback (bottom-right), e.g. "3/3" */
  readonly powerToughness: string | null;
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

/**
 * Extract power/toughness from a type line for print-proxy fallback.
 * Uses the last power/toughness token (e.g. 3/3, or stars for variable stats).
 *
 * @param typeLine Full type line from deck card
 */
function parsePowerToughnessFromTypeLine(typeLine: string): string | null {
  const matches = [...typeLine.matchAll(/\b(\d+|\*)\/(\d+|\*)\b/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const p = last?.[1];
  const t = last?.[2];
  if (p === undefined || t === undefined) return null;
  return `${p}/${t}`;
}

function makeCommanderSlot(cmd: DeckCard): ProxySlot {
  return {
    id: `cmd-${cmd.id}`,
    name: cmd.name,
    imageUri: cmd.imageUri,
    manaCost: cmd.manaCost,
    typeLine: cmd.typeLine,
    oracleText: cmd.oracleText ?? "",
    powerToughness: parsePowerToughnessFromTypeLine(cmd.typeLine),
    isCommander: true,
  };
}

function shouldExcludeCard(card: DeckCard, config: ProxyConfig): boolean {
  if (card.zone !== "main") return true;
  if (!config.includeLands && isBasicLand(card)) return true;
  return false;
}

function makeCardSlots(card: DeckCard): ProxySlot[] {
  const qty = Math.max(1, card.quantity);
  const powerToughness = parsePowerToughnessFromTypeLine(card.typeLine);
  const oracleText = card.oracleText ?? "";
  return Array.from({ length: qty }, (_, i) => ({
    id: `${card.id}-${i}`,
    name: card.name,
    imageUri: card.imageUri,
    manaCost: card.manaCost,
    typeLine: card.typeLine,
    oracleText,
    powerToughness,
    isCommander: false,
  }));
}

/** Build the flat list of print slots from a deck */
export function buildProxySlots(
  cards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  config: ProxyConfig
): ProxySlot[] {
  const slots: ProxySlot[] = [];

  if (config.includeCommander) {
    for (const cmd of [commander, partner]) {
      if (cmd) slots.push(makeCommanderSlot(cmd));
    }
  }

  for (const card of cards) {
    if (!shouldExcludeCard(card, config)) {
      slots.push(...makeCardSlots(card));
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
