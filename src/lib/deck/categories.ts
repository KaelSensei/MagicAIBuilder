// Auto-categorization of cards based on type line and oracle text
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { CardCategory } from "./types";

function isRamp(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  const type = card.type_line.toLowerCase();

  if (card.cmc > 4) return false; // Ramp should be efficient

  return (
    text.includes("add {") ||
    text.includes("search your library for a basic land") ||
    text.includes("search your library for a land") ||
    text.includes("put a land") ||
    (text.includes("put up to") && text.includes("land")) ||
    (text.includes("mana of any color") && card.cmc <= 3) ||
    (type.includes("artifact") && text.includes("add") && text.includes("{"))
  );
}

function isBoardWipe(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  return (
    text.includes("destroy all") ||
    text.includes("exile all") ||
    (text.includes("return all") && text.includes("to") && text.includes("hand")) ||
    (text.includes("deals") && text.includes("damage to each")) ||
    text.includes("each creature gets -")
  );
}

function isRemoval(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  // Must target a specific permanent, not "all"
  if (isBoardWipe({ ...card })) return false;

  return (
    text.includes("destroy target") ||
    text.includes("exile target") ||
    (text.includes("return target") && text.includes("to") && text.includes("hand")) ||
    (text.includes("deals") && text.includes("damage to target")) ||
    text.includes("-x/-x") ||
    (text.includes("gets -") && text.includes("until end of turn"))
  );
}

function isCardDraw(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  return (
    text.includes("draw a card") ||
    text.includes("draw two cards") ||
    text.includes("draw three cards") ||
    text.includes("draw x cards") ||
    text.includes("draw cards") ||
    (text.includes("draw") && text.includes("card") && !text.includes("discard"))
  );
}

function isTutor(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  return (
    text.includes("search your library") &&
    !text.includes("basic land") &&
    !text.includes("land card")
  );
}

function isWinCondition(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  const keywords = card.keywords?.map((k) => k.toLowerCase()) ?? [];

  return (
    text.includes("win the game") ||
    text.includes("you win the game") ||
    text.includes("infinite") || // text-based check
    keywords.includes("infect") ||
    text.includes("poison counter") ||
    (text.includes("combat damage") && text.includes("each opponent")) ||
    text.includes("storm count")
  );
}

function isProtection(card: ScryfallCard): boolean {
  const text = (card.oracle_text ?? "").toLowerCase();
  const keywords = card.keywords?.map((k) => k.toLowerCase()) ?? [];

  return (
    (text.includes("hexproof") && card.cmc <= 3) ||
    (text.includes("shroud") && card.cmc <= 3) ||
    keywords.includes("counterspell") ||
    text.includes("counter target") ||
    text.includes("can't be countered") ||
    (text.includes("indestructible") && card.cmc <= 3)
  );
}

/** Auto-categorize a Scryfall card into a deck category */
export function categorizeCard(card: ScryfallCard): CardCategory {
  const type = card.type_line.toLowerCase();

  // Explicit type overrides
  if (type.includes("land")) return "land";
  if (type.includes("planeswalker")) return "planeswalker";

  // Functional categories (override type)
  if (isWinCondition(card)) return "winCondition";
  if (isRamp(card)) return "ramp";
  if (isBoardWipe(card)) return "boardWipe";
  if (isRemoval(card)) return "removal";
  if (isCardDraw(card)) return "draw";
  if (isTutor(card)) return "draw"; // Tutors count as card advantage
  if (isProtection(card)) return "protection";

  // Fall back to card type
  if (type.includes("creature")) return "creature";
  if (type.includes("instant")) return "instant";
  if (type.includes("sorcery")) return "sorcery";
  if (type.includes("artifact")) return "artifact";
  if (type.includes("enchantment")) return "enchantment";

  return "other";
}

/** Display label for each category */
export const CATEGORY_LABELS: Record<CardCategory, string> = {
  commander: "Commander",
  companion: "Companion",
  creature: "Creatures",
  instant: "Instants",
  sorcery: "Sorceries",
  artifact: "Artifacts",
  enchantment: "Enchantments",
  planeswalker: "Planeswalkers",
  land: "Lands",
  ramp: "Ramp",
  draw: "Card Draw",
  removal: "Removal",
  boardWipe: "Board Wipes",
  winCondition: "Win Conditions",
  protection: "Protection",
  other: "Other",
};

/** Ordered list of categories for display */
export const CATEGORY_ORDER: readonly CardCategory[] = [
  "commander",
  "creature",
  "ramp",
  "draw",
  "removal",
  "boardWipe",
  "winCondition",
  "protection",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
  "land",
  "other",
];
