import type { BracketScore, Deck, DeckStats } from "@/lib/deck/types";
import { detectArchetypes } from "@/lib/ai/archetypes";
import type { AIAnalysisOptions } from "./suggestion-types";

/**
 * Category counts the suggest route expects.
 *
 * @param stats - computed deck stats
 * @returns the category map sent to the assistant
 */
export function deckCategoryCounts(stats: DeckStats): {
  readonly ramp: number;
  readonly draw: number;
  readonly removal: number;
  readonly boardWipe: number;
  readonly creatures: number;
  readonly lands: number;
} {
  return {
    ramp: stats.ramp,
    draw: stats.draw,
    removal: stats.removal,
    boardWipe: stats.boardWipes,
    creatures: stats.creatures,
    lands: stats.lands,
  };
}

/**
 * Stable key for one analysis, so an unchanged deck is not sent again.
 *
 * @param deck - deck being analysed
 * @param stats - deck stats, accepted so the key stays aligned with the request
 * @param bracket - overall bracket sent with the request
 * @param options - overrides that change the answer
 * @returns a string that changes when the request would
 */
export function hashDeckState(
  deck: Deck,
  stats: DeckStats,
  bracket: number,
  options?: AIAnalysisOptions
): string {
  const cardNames = deck.cards
    .map((card) => card.name)
    .sort((left, right) => left.localeCompare(right))
    .join(",");
  const commander = deck.commander?.name ?? "";
  const partner = deck.partner?.name ?? "";
  const brief = options?.brief;
  const question = options?.question;
  const questionKey =
    question?.type === "why-card"
      ? `${question.type}:${question.cardName}`
      : (question?.type ?? "");
  return `${commander}|${partner}|${bracket}|${deck.targetBracket}|${deck.budget ?? ""}|${options?.budgetPerCard ?? ""}|${options?.archetypeOverride ?? ""}|${brief?.theme ?? ""}|${brief?.playPattern ?? ""}|${brief?.dislikes ?? ""}|${questionKey}|${cardNames}`;
}

/**
 * Body posted to `/api/ai/suggest`.
 *
 * @param deck - deck being analysed
 * @param stats - computed stats
 * @param bracketScore - scored bracket, when one exists
 * @param bracket - overall bracket number
 * @param options - optional overrides
 * @returns the JSON payload
 */
export function buildSuggestPayload(
  deck: Deck,
  stats: DeckStats,
  bracketScore: BracketScore | null,
  bracket: number,
  options?: AIAnalysisOptions
) {
  const { archetypeOverride, budgetPerCard, brief, question } = options ?? {};
  const cardNames = deck.cards.map((card) => card.name);
  const categories = deckCategoryCounts(stats);
  const detectedThemes = stats.themes?.map((theme) => theme.name);
  const archetype =
    archetypeOverride ??
    detectArchetypes({
      cardNames,
      categories,
      detectedThemes,
    })[0];

  const cardPrices: Record<string, number | null> = {};
  for (const card of deck.cards) {
    cardPrices[card.name] = card.price ?? null;
  }

  return {
    deckId: deck.id,
    commanderName: deck.commander?.name ?? null,
    partnerName: deck.partner?.name ?? null,
    colorIdentity: uniqueColors(deck),
    cardNames,
    categories,
    avgCmc: stats.avgCmc,
    bracket,
    bracketDimensions: bracketScore?.dimensions,
    bracketWarnings: bracketScore?.warnings,
    targetBracket: deck.targetBracket,
    budget: deck.budget,
    gameChangersCount: stats.gameChangersCount,
    gameChangersList: stats.gameChangersList,
    detectedThemes,
    archetype,
    budgetPerCard: budgetPerCard ?? null,
    cardPrices,
    brief,
    question,
  };
}

/**
 * Commander and partner colors, first occurrence kept.
 *
 * @param deck - deck whose commanders supply the identity
 * @returns the color identity without duplicates
 */
function uniqueColors(deck: Deck): string[] {
  const colors = [
    ...(deck.commander?.colorIdentity ?? []),
    ...(deck.partner?.colorIdentity ?? []),
  ];
  return colors.filter((color, index) => colors.indexOf(color) === index);
}
