// Deck statistics computation
import type { Deck, DeckStats } from "./types";
import { detectThemes } from "./themes";
import { extractColorPips } from "@/lib/mana/parse";
import { getColorIdentityViolations } from "./color-identity";

function buildManaCurve(nonLandCards: ReturnType<typeof buildAllCards>): Record<number, number> {
  const manaCurve: Record<number, number> = {};
  for (const card of nonLandCards) {
    const cmc = Math.min(card.cmc, 7);
    manaCurve[cmc] = (manaCurve[cmc] ?? 0) + card.quantity;
  }
  return manaCurve;
}

function buildColorDistribution(nonLandCards: ReturnType<typeof buildAllCards>): Record<string, number> {
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

function buildAllCards(deck: Deck) {
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  return [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...mainCards,
  ];
}

/** Compute comprehensive deck statistics (maybeboard cards are excluded) */
export function computeDeckStats(deck: Deck): DeckStats {
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  const allCards = buildAllCards(deck);
  const nonLandCards = allCards.filter((c) => c.category !== "land");

  const manaCurve = buildManaCurve(nonLandCards);
  const colorDistribution = buildColorDistribution(nonLandCards);

  // Avg CMC (excluding lands and commander, main zone only)
  const cmcCards = mainCards.filter((c) => c.category !== "land");
  const avgCmc =
    cmcCards.length > 0
      ? cmcCards.reduce((sum, c) => sum + c.cmc * c.quantity, 0) /
        cmcCards.reduce((sum, c) => sum + c.quantity, 0)
      : 0;

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
  const gameChangersList = gcCards.map((c) => c.name);

  // Total cards
  const totalCards = allCards.reduce((s, c) => s + c.quantity, 0);

  // Price
  const totalPrice = allCards.reduce(
    (sum, c) => sum + (c.price ?? 0) * c.quantity,
    0
  );
  const overBudgetCards =
    deck.budget === null || deck.budget === undefined
      ? []
      : allCards.filter((c) => (c.price ?? 0) > deck.budget!).map((c) => c.name);

  // Banned cards
  const bannedCards = allCards.filter((c) => c.isBanned).map((c) => c.name);

  const colorIdentityViolations = getColorIdentityViolations(deck).map((v) => v.cardName);

  // Theme detection (on all non-land cards)
  const themes = detectThemes(allCards.filter((c) => c.category !== "land"));

  const flexibleLands = allCards.filter((c) => c.isFlexibleLand === true).reduce((s, c) => s + c.quantity, 0);

  return {
    totalCards,
    lands,
    creatures,
    ramp,
    draw,
    removal,
    boardWipes,
    avgCmc: Math.round(avgCmc * 100) / 100,
    manaCurve,
    colorDistribution,
    gameChangersCount,
    gameChangersList,
    totalPrice: Math.round(totalPrice * 100) / 100,
    overBudgetCards,
    bannedCards,
    colorIdentityViolations,
    themes,
    flexibleLands,
  };
}
