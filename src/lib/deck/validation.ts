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

/** Validate whether a card can be added to a deck */
export function validateCardForDeck(
  card: DeckCard,
  deck: Deck
): CardValidationResult {
  const errors: string[] = [];
  let isBanned = false;
  let isColorViolation = false;
  const isGameChanger = card.isGameChanger;

  const config = getFormatConfig(deck.format);

  // Check banned
  if (card.isBanned) {
    isBanned = true;
    errors.push(`${card.name} is banned in ${config.label}`);
  }

  // Check color identity (only for formats with commander)
  if (config.hasColorIdentity && deck.commander) {
    const commanderIdentitySet = new Set([
      ...deck.commander.colorIdentity,
      ...(deck.partner?.colorIdentity ?? []),
    ]);
    const violation = card.colorIdentity.filter(
      (c) => !commanderIdentitySet.has(c)
    );
    if (violation.length > 0) {
      isColorViolation = true;
      errors.push(
        `${card.name} has colors outside your commander's identity (${violation.join(", ")})`
      );
    }
  }

  // Check duplicate (singleton formats only — except basic lands)
  if (config.isSingleton) {
    const isBasicLand = card.typeLine.toLowerCase().includes("basic land");
    if (!isBasicLand) {
      const existing = [
        ...deck.cards,
        ...(deck.commander ? [deck.commander] : []),
        ...(deck.partner ? [deck.partner] : []),
      ].find((c) => c.name === card.name);
      if (existing) {
        errors.push(`${card.name} is already in the deck (singleton rule)`);
      }
    }
  }

  return {
    canAdd: errors.length === 0,
    reason: errors[0],
    isBanned,
    isColorViolation,
    isGameChanger,
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
  warnings.push(`${gcCards.length} Game Changer(s) detected: ${gcCards.map((c) => c.name).join(", ")}`);
  if (gcCards.length > 3) {
    warnings.push("More than 3 Game Changers — deck is Bracket 4 minimum");
  }
}

function checkSingleton(allCards: DeckCard[], maxCopies: number, errors: string[]): void {
  const nameCounts: Record<string, number> = {};
  for (const card of allCards) {
    if (!card.typeLine.toLowerCase().includes("basic land")) {
      nameCounts[card.name] = (nameCounts[card.name] ?? 0) + 1;
    }
  }
  const duplicates = Object.entries(nameCounts)
    .filter(([, count]) => count > maxCopies)
    .map(([name]) => name);
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
