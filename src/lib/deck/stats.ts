// Deck statistics computation
import type { Deck, DeckStats } from "./types";
import { detectThemes } from "./themes";

/** Compute comprehensive deck statistics */
export function computeDeckStats(deck: Deck): DeckStats {
  // Only include main-zone cards in stats (sideboard/maybeboard are excluded)
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  const allCards = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...mainCards,
  ];

  const nonLandCards = allCards.filter((c) => c.category !== "land");

  // Mana curve (exclude lands)
  const manaCurve: Record<number, number> = {};
  for (const card of nonLandCards) {
    const cmc = Math.min(card.cmc, 7); // Cap at 7+
    manaCurve[cmc] = (manaCurve[cmc] ?? 0) + card.quantity;
  }

  // Color distribution
  const colorDistribution: Record<string, number> = {};
  for (const card of allCards) {
    for (const color of card.colorIdentity) {
      colorDistribution[color] = (colorDistribution[color] ?? 0) + 1;
    }
  }

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

  // Color identity violations — only check if a commander is set
  // Include partner's color identity (both commanders contribute to the identity)
  const commanderIdentitySet = new Set([
    ...(deck.commander?.colorIdentity ?? []),
    ...(deck.partner?.colorIdentity ?? []),
  ]);
  const colorIdentityViolations = deck.commander
    ? mainCards
        .filter((c) =>
          c.colorIdentity.some((color) => !commanderIdentitySet.has(color))
        )
        .map((c) => c.name)
    : [];

  // Theme detection (on all non-land cards)
  const themes = detectThemes(allCards.filter((c) => c.category !== "land"));

  // Flexible lands: MDFC/DFC cards with a land back face
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
    flexibleLands,
    themes,
    flexibleLands,
  };
}
