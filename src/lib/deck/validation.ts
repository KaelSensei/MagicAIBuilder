// Deck validation: banlist, Game Changers, color identity
import type { DeckCard, Deck } from "./types";
import { getCompanionDeckWarnings } from "./companion";
import { getFormatConfig } from "./formats";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Ikoria-style companion rule checks (also merged into `warnings`). */
  companionWarnings: readonly string[];
}

export interface CardValidationResult {
  canAdd: boolean;
  reason?: string;
  isBanned: boolean;
  isColorViolation: boolean;
  isGameChanger: boolean;
}

/** Check color identity violation against commander identity */
function checkCardColorIdentity(card: DeckCard, deck: Deck): string | null {
  if (!deck.commander) return null;
  const identitySet = new Set([
    ...deck.commander.colorIdentity,
    ...(deck.partner?.colorIdentity ?? []),
  ]);
  const violations = card.colorIdentity.filter((c) => !identitySet.has(c));
  if (violations.length === 0) return null;
  return `${card.name} has colors outside your commander's identity (${violations.join(", ")})`;
}

/** Check the format's non-basic card copy limit before adding a card. */
function checkCardCopyLimit(card: DeckCard, deck: Deck, maxCopies: number): string | null {
  if (card.typeLine.toLowerCase().includes("basic land")) return null;
  const allCards = [
    ...deck.cards,
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
  ];
  const existingCopies = allCards.reduce(
    (count, existing) => count + (existing.name === card.name ? existing.quantity : 0),
    0
  );
  if (existingCopies + card.quantity <= maxCopies) return null;
  return maxCopies === 1
    ? `${card.name} is already in the deck (singleton rule)`
    : `${card.name} exceeds the ${maxCopies}-copy limit`;
}

/** Validate whether a card can be added to a deck */
export function validateCardForDeck(
  card: DeckCard,
  deck: Deck
): CardValidationResult {
  const config = getFormatConfig(deck.format);
  const errors: string[] = [];
  let isColorViolation = false;

  if (card.isBanned) {
    errors.push(`${card.name} is banned in ${config.label}`);
  }

  if (config.hasColorIdentity) {
    const colorError = checkCardColorIdentity(card, deck);
    if (colorError) {
      isColorViolation = true;
      errors.push(colorError);
    }
  }

  const copyLimitError = checkCardCopyLimit(card, deck, config.maxCopiesPerCard);
  if (copyLimitError) errors.push(copyLimitError);

  return {
    canAdd: errors.length === 0,
    reason: errors[0],
    isBanned: card.isBanned,
    isColorViolation,
    isGameChanger: card.isGameChanger,
  };
}

function checkCardCount(allCards: DeckCard[], deckSize: number, errors: string[], warnings: string[]): void {
  const total = allCards.reduce((sum, c) => sum + c.quantity, 0);
  if (total === deckSize) return;
  if (total < deckSize) {
    warnings.push(`Deck has ${total}/${deckSize} cards — needs ${deckSize - total} more`);
  } else {
    errors.push(`Deck has ${total}/${deckSize} cards — remove ${total - deckSize} cards`);
  }
}

function checkColorIdentityViolations(deck: Deck, errors: string[]): void {
  if (!deck.commander) return;
  const identitySet = new Set([...deck.commander.colorIdentity, ...(deck.partner?.colorIdentity ?? [])]);
  const violations = deck.cards.filter((c) =>
    c.colorIdentity.some((color) => !identitySet.has(color))
  );
  if (violations.length > 0) {
    errors.push(`Color identity violations: ${violations.map((c) => c.name).join(", ")}`);
  }
}

function checkGameChangers(allCards: DeckCard[], warnings: string[]): void {
  const gcCards = allCards.filter((c) => c.isGameChanger);
  if (gcCards.length === 0) return;
  const count = gcCards.reduce((total, card) => total + card.quantity, 0);
  const names = gcCards.map((card) => card.name).sort((a, b) => a.localeCompare(b));
  warnings.push(`${count} Game Changer(s) detected: ${names.join(", ")}`);
  if (count > 3) {
    warnings.push("More than 3 Game Changers — deck is Bracket 4 minimum");
  }
}

function checkSingleton(allCards: DeckCard[], maxCopies: number, errors: string[]): void {
  const nameCounts: Record<string, number> = {};
  for (const card of allCards) {
    if (!card.typeLine.toLowerCase().includes("basic land")) {
      nameCounts[card.name] = (nameCounts[card.name] ?? 0) + card.quantity;
    }
  }
  const duplicates = Object.entries(nameCounts)
    .filter(([, count]) => count > maxCopies)
    .map(([name]) => name)
    .toSorted((left, right) => left.localeCompare(right));
  if (duplicates.length > 0) {
    const ruleLabel = maxCopies === 1 ? "singleton violation" : `max ${maxCopies} copies`;
    errors.push(`Duplicate cards (${ruleLabel}): ${duplicates.join(", ")}`);
  }
}

/** Full deck validation */
export function validateDeck(deck: Deck): ValidationResult {
  const config = getFormatConfig(deck.format);
  const errors: string[] = [];
  const warnings: string[] = [];

  const allCards = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...deck.cards,
  ];

  checkCardCount(allCards, config.deckSize, errors, warnings);

  if (config.hasCommander && !deck.commander) {
    errors.push("Deck must have a commander");
  }

  const bannedCards = allCards.filter((c) => c.isBanned);
  if (bannedCards.length > 0) {
    errors.push(`Banned cards in deck: ${bannedCards.map((c) => c.name).join(", ")}`);
  }

  if (config.hasColorIdentity) {
    checkColorIdentityViolations(deck, errors);
  }
  if (config.hasBracketScoring) {
    checkGameChangers(allCards, warnings);
  }
  checkSingleton(allCards, config.maxCopiesPerCard, errors);

  const companionWarnings = getCompanionDeckWarnings(deck);
  const mergedWarnings = [...warnings, ...companionWarnings];

  return {
    valid: errors.length === 0,
    errors,
    warnings: mergedWarnings,
    companionWarnings,
  };
}

/** Check color identity compatibility */
export function checkColorIdentity(
  cardColors: string[],
  commanderColors: string[]
): boolean {
  return cardColors.every((c) => commanderColors.includes(c));
}

/** Check if a card is a Game Changer based on oracle text heuristics */
export function detectGameChanger(oracleText: string): boolean {
  const text = oracleText.toLowerCase();
  // Heuristics: very powerful effects
  return (
    (text.includes("search your library") && text.includes("put") && !text.includes("land")) ||
    text.includes("take an extra turn") ||
    text.includes("each opponent loses") ||
    text.includes("win the game")
  );
}
