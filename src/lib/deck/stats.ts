// Deck statistics computation
import type { Deck, DeckCard } from "./types";
import { playedDeckCards } from "./played-deck-cards";
import { averageManaValue } from "./average-mana-value";
import type { DeckStats } from "./analysis-types";
import { detectThemes } from "./themes";
import { extractColorPips } from "@/lib/mana/parse";
import { getColorIdentityViolations } from "./color-identity";
import { getCommanderRuleIssues } from "./commander-rules-check";
import { buildFormatStats } from "./format-stats";
import { buildManaAlignment } from "./mana-alignment";
import { buildTurnOnePlayability } from "./turn-one";
import { compareByNameThenId, type NamedCardRow } from "./card-name-order";

function buildManaCurve(
  nonLandCards: readonly DeckCard[]
): Record<number, number> {
  const manaCurve: Record<number, number> = {};
  for (const card of nonLandCards) {
    const cmc = Math.min(card.cmc, 7);
    manaCurve[cmc] = (manaCurve[cmc] ?? 0) + card.quantity;
  }
  return manaCurve;
}

function buildColorDistribution(
  nonLandCards: readonly DeckCard[]
): Record<string, number> {
  const colorDistribution: Record<string, number> = {};
  for (const card of nonLandCards) {
    if (card.manaCost) {
      const pips = extractColorPips(card.manaCost);
      for (const [color, count] of Object.entries(pips)) {
        colorDistribution[color] = (colorDistribution[color] ?? 0) + count * card.quantity;
      }
    } else {
      for (const color of card.colorIdentity) {
        if (color !== "C") {
          colorDistribution[color] = (colorDistribution[color] ?? 0) + card.quantity;
        }
      }
    }
  }
  return colorDistribution;
}

/**
 * The names of the given rows by name, then id, so a warning list reads the
 * same whatever order the deck's rows arrive in (I-03 slice 5). The banned
 * list keys the builder's dismissed alert: a reorder must not re-open it.
 */
function namesByNameThenId(cards: readonly DeckCard[]): string[] {
  return cards
    .map((card): NamedCardRow => ({ name: card.name, cardId: card.id }))
    .toSorted(compareByNameThenId)
    .map((row) => row.name);
}

/** Compute comprehensive deck statistics (maybeboard cards are excluded) */
export function computeDeckStats(deck: Deck): DeckStats {
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  const allCards = playedDeckCards(deck);
  const nonLandCards = allCards.filter((c) => c.category !== "land");

  const manaCurve = buildManaCurve(nonLandCards);
  const colorDistribution = buildColorDistribution(nonLandCards);

  // The deck's rows, without the command zone: the shared deck view reads the same rule.
  const roundedAvgCmc = averageManaValue(deck.cards);

  // Category counts
  const lands = allCards.filter((c) => c.category === "land").reduce((s, c) => s + c.quantity, 0);
  const creatures = allCards.filter((c) => c.category === "creature").reduce((s, c) => s + c.quantity, 0);
  const ramp = allCards.filter((c) => c.category === "ramp").reduce((s, c) => s + c.quantity, 0);
  const draw = allCards.filter((c) => c.category === "draw").reduce((s, c) => s + c.quantity, 0);
  const removal = allCards.filter((c) => c.category === "removal").reduce((s, c) => s + c.quantity, 0);
  const boardWipes = allCards.filter((c) => c.category === "boardWipe").reduce((s, c) => s + c.quantity, 0);

  // Game Changers
  const gcCards = allCards.filter((c) => c.isGameChanger);
  const gameChangersCount = gcCards.reduce((s, c) => s + c.quantity, 0);
  const gameChangersList = namesByNameThenId(gcCards);

  // Total cards
  const totalCards = allCards.reduce((s, c) => s + c.quantity, 0);

  // Price
  const totalPrice = allCards.reduce(
    (sum, c) => sum + (c.price ?? 0) * c.quantity,
    0
  );
  const budget = deck.budget;
  const overBudgetCards =
    budget === null || budget === undefined
      ? []
      : namesByNameThenId(allCards.filter((c) => (c.price ?? 0) > budget));

  // Banned cards
  const bannedCards = namesByNameThenId(allCards.filter((c) => c.isBanned));

  const colorIdentityViolations = getColorIdentityViolations(deck).map((v) => v.cardName);

  // Theme detection (on all non-land cards)
  const themes = detectThemes(allCards.filter((c) => c.category !== "land"));

  const flexibleLands = allCards.filter((c) => c.isFlexibleLand === true).reduce((s, c) => s + c.quantity, 0);

  return {
    formatStats: buildFormatStats(deck.format, allCards, roundedAvgCmc),
    manaAlignment: buildManaAlignment(allCards),
    // Library only: the commander is cast from the command zone, never drawn.
    turnOnePlayability: buildTurnOnePlayability(mainCards),
    totalCards,
    lands,
    creatures,
    ramp,
    draw,
    removal,
    boardWipes,
    avgCmc: roundedAvgCmc,
    manaCurve,
    colorDistribution,
    gameChangersCount,
    gameChangersList,
    totalPrice: Math.round(totalPrice * 100) / 100,
    overBudgetCards,
    bannedCards,
    colorIdentityViolations,
    commanderRuleIssues: getCommanderRuleIssues(deck),
    themes,
    flexibleLands,
  };
}
