// Deck statistics computation
import type { Deck, DeckCard, DeckStats } from "./types";
import { detectThemes } from "./themes";

const COLOR_SYMBOLS = ["W", "U", "B", "R", "G"] as const;
type ColorSymbol = (typeof COLOR_SYMBOLS)[number];

export const MANA_IMBALANCE_THRESHOLD = 15;

function parseManaSymbols(manaCost: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const tokens = manaCost.match(/\{[^}]+\}/g) ?? [];
  for (const token of tokens) {
    const inner = token.slice(1, -1);
    if (inner.includes("/")) {
      for (const part of inner.split("/")) {
        if ((COLOR_SYMBOLS as readonly string[]).includes(part)) {
          counts[part] = (counts[part] ?? 0) + 0.5;
        }
      }
    } else if ((COLOR_SYMBOLS as readonly string[]).includes(inner)) {
      counts[inner] = (counts[inner] ?? 0) + 1;
    }
  }
  return counts;
}

function computeManaSymbolRatio(nonLandCards: DeckCard[]): Record<ColorSymbol, number> {
  const totals: Record<string, number> = {};
  for (const card of nonLandCards) {
    const symbols = parseManaSymbols(card.manaCost);
    for (const [color, count] of Object.entries(symbols)) {
      totals[color] = (totals[color] ?? 0) + count * card.quantity;
    }
  }
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  if (grandTotal === 0) return {} as Record<ColorSymbol, number>;
  const ratio = {} as Record<ColorSymbol, number>;
  for (const [color, count] of Object.entries(totals)) {
    ratio[color as ColorSymbol] = Math.round((count / grandTotal) * 100);
  }
  return ratio;
}

function computeManaProductionRatio(landCards: DeckCard[]): Record<ColorSymbol, number> {
  const totals: Record<string, number> = {};
  for (const card of landCards) {
    for (const color of card.colorIdentity) {
      if ((COLOR_SYMBOLS as readonly string[]).includes(color)) {
        totals[color] = (totals[color] ?? 0) + card.quantity;
      }
    }
  }
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  if (grandTotal === 0) return {} as Record<ColorSymbol, number>;
  const ratio = {} as Record<ColorSymbol, number>;
  for (const [color, count] of Object.entries(totals)) {
    ratio[color as ColorSymbol] = Math.round((count / grandTotal) * 100);
  }
  return ratio;
}

export function computeDeckStats(deck: Deck): DeckStats {
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  const allCards = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...mainCards,
  ];

  const nonLandCards = allCards.filter((c) => c.category !== "land");
  const landCards = allCards.filter((c) => c.category === "land");

  const manaCurve: Record<number, number> = {};
  for (const card of nonLandCards) {
    const cmc = Math.min(card.cmc, 7);
    manaCurve[cmc] = (manaCurve[cmc] ?? 0) + card.quantity;
  }

  const colorDistribution: Record<string, number> = {};
  for (const card of allCards) {
    for (const color of card.colorIdentity) {
      colorDistribution[color] = (colorDistribution[color] ?? 0) + 1;
    }
  }

  const cmcCards = mainCards.filter((c) => c.category !== "land");
  const avgCmcWithoutLands =
    cmcCards.length > 0
      ? cmcCards.reduce((sum, c) => sum + c.cmc * c.quantity, 0) /
        cmcCards.reduce((sum, c) => sum + c.quantity, 0)
      : 0;

  const avgCmcWithLands =
    mainCards.length > 0
      ? mainCards.reduce((sum, c) => sum + c.cmc * c.quantity, 0) /
        mainCards.reduce((sum, c) => sum + c.quantity, 0)
      : 0;

  const turn1Playable = mainCards
    .filter((c) => c.category !== "land" && c.cmc <= 1)
    .reduce((s, c) => s + c.quantity, 0);

  const manaSymbolRatio = computeManaSymbolRatio(nonLandCards);
  const manaProductionRatio = computeManaProductionRatio(landCards);

  const allColors = new Set([...Object.keys(manaSymbolRatio), ...Object.keys(manaProductionRatio)]);
  const manaImbalance: Record<string, number> = {};
  for (const color of allColors) {
    const symPct = manaSymbolRatio[color as ColorSymbol] ?? 0;
    const prodPct = manaProductionRatio[color as ColorSymbol] ?? 0;
    manaImbalance[color] = Math.round((symPct - prodPct) * 10) / 10;
  }

  const lands = landCards.reduce((s, c) => s + c.quantity, 0);
  const creatures = allCards.filter((c) => c.category === "creature").reduce((s, c) => s + c.quantity, 0);
  const ramp = allCards.filter((c) => c.category === "ramp").reduce((s, c) => s + c.quantity, 0);
  const draw = allCards.filter((c) => c.category === "draw").reduce((s, c) => s + c.quantity, 0);
  const removal = allCards.filter((c) => c.category === "removal").reduce((s, c) => s + c.quantity, 0);
  const boardWipes = allCards.filter((c) => c.category === "boardWipe").reduce((s, c) => s + c.quantity, 0);

  const recommendedLandsByColor: Record<string, number> = {};
  for (const [color, pct] of Object.entries(manaSymbolRatio)) {
    recommendedLandsByColor[color] = Math.round((pct / 100) * lands);
  }

  const flexibleLands = allCards
    .filter(
      (c) =>
        c.layout === "modal_dfc" &&
        c.cardFaces != null &&
        c.cardFaces[1]?.typeLine?.toLowerCase().includes("land")
    )
    .reduce((s, c) => s + c.quantity, 0);

  const gcCards = allCards.filter((c) => c.isGameChanger);
  const gameChangersCount = gcCards.reduce((s, c) => s + c.quantity, 0);
  const gameChangersList = gcCards.map((c) => c.name);

  const totalCards = allCards.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = allCards.reduce((sum, c) => sum + (c.price ?? 0) * c.quantity, 0);
  const overBudgetCards =
    deck.budget === null || deck.budget === undefined
      ? []
      : allCards.filter((c) => (c.price ?? 0) > deck.budget!).map((c) => c.name);
  const bannedCards = allCards.filter((c) => c.isBanned).map((c) => c.name);

  const commanderIdentitySet = new Set([
    ...(deck.commander?.colorIdentity ?? []),
    ...(deck.partner?.colorIdentity ?? []),
  ]);
  const colorIdentityViolations = deck.commander
    ? mainCards
        .filter((c) => c.colorIdentity.some((color) => !commanderIdentitySet.has(color)))
        .map((c) => c.name)
    : [];

  const themes = detectThemes(allCards.filter((c) => c.category !== "land"));

  const roundedAvgCmcWithoutLands = Math.round(avgCmcWithoutLands * 100) / 100;

  return {
    totalCards, lands, creatures, ramp, draw, removal, boardWipes,
    avgCmc: roundedAvgCmcWithoutLands,
    avgCmcWithoutLands: roundedAvgCmcWithoutLands,
    avgCmcWithLands: Math.round(avgCmcWithLands * 100) / 100,
    turn1Playable,
    manaSymbolRatio, manaProductionRatio, manaImbalance,
    recommendedLandsByColor, flexibleLands,
    manaCurve, colorDistribution,
    gameChangersCount, gameChangersList,
    totalPrice: Math.round(totalPrice * 100) / 100,
    overBudgetCards, bannedCards, colorIdentityViolations, themes,
  };
}
