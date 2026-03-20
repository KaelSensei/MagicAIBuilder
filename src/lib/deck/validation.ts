// Deck validation: banlist, Game Changers, color identity
import type { DeckCard, Deck } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
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

  // Check banned
  if (card.isBanned) {
    isBanned = true;
    errors.push(`${card.name} is banned in Commander`);
  }

  // Check color identity
  if (deck.commander) {
    const commanderIdentity = [
      ...deck.commander.colorIdentity,
      ...(deck.partner?.colorIdentity ?? []),
    ];
    const violation = card.colorIdentity.filter(
      (c) => !commanderIdentity.includes(c)
    );
    if (violation.length > 0) {
      isColorViolation = true;
      errors.push(
        `${card.name} has colors outside your commander's identity (${violation.join(", ")})`
      );
    }
  }

  // Check duplicate (singleton rule — except basic lands)
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

  return {
    canAdd: errors.length === 0,
    reason: errors[0],
    isBanned,
    isColorViolation,
    isGameChanger,
  };
}

/** Full deck validation */
export function validateDeck(deck: Deck): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allCards = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...deck.cards,
  ];

  // Card count
  const totalCards = allCards.reduce((sum, c) => sum + c.quantity, 0);
  if (totalCards !== 100) {
    if (totalCards < 100) {
      warnings.push(`Deck has ${totalCards}/100 cards — needs ${100 - totalCards} more`);
    } else {
      errors.push(`Deck has ${totalCards}/100 cards — remove ${totalCards - 100} cards`);
    }
  }

  // Commander required
  if (!deck.commander) {
    errors.push("Deck must have a commander");
  }

  // Banned cards
  const bannedCards = allCards.filter((c) => c.isBanned);
  if (bannedCards.length > 0) {
    errors.push(
      `Banned cards in deck: ${bannedCards.map((c) => c.name).join(", ")}`
    );
  }

  // Color identity violations
  if (deck.commander) {
    const commanderIdentity = [
      ...deck.commander.colorIdentity,
      ...(deck.partner?.colorIdentity ?? []),
    ];
    const violations = deck.cards.filter((c) =>
      c.colorIdentity.some((color) => !commanderIdentity.includes(color))
    );
    if (violations.length > 0) {
      errors.push(
        `Color identity violations: ${violations.map((c) => c.name).join(", ")}`
      );
    }
  }

  // Game changers warnings
  const gcCards = allCards.filter((c) => c.isGameChanger);
  if (gcCards.length > 0) {
    warnings.push(
      `${gcCards.length} Game Changer(s) detected: ${gcCards.map((c) => c.name).join(", ")}`
    );
    if (gcCards.length > 3) {
      warnings.push("More than 3 Game Changers — deck is Bracket 4 minimum");
    }
  }

  // Singleton rule (non-basic lands)
  const nameCounts: Record<string, number> = {};
  for (const card of allCards) {
    if (!card.typeLine.toLowerCase().includes("basic land")) {
      nameCounts[card.name] = (nameCounts[card.name] ?? 0) + 1;
    }
  }
  const duplicates = Object.entries(nameCounts)
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  if (duplicates.length > 0) {
    errors.push(`Duplicate cards (singleton violation): ${duplicates.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
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
    text.includes("search your library") && text.includes("put") && !text.includes("land") ||
    text.includes("take an extra turn") ||
    text.includes("each opponent loses") ||
    text.includes("win the game")
  );
}
