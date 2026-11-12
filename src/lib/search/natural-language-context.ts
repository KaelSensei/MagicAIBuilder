import { PIP_COLORS, type PipColor } from "@/lib/deck/mana-alignment";
import { getFormatConfig, type DeckFormat } from "@/lib/deck/formats";
import { removeLegalityClause } from "./scryfall-query-syntax";

/** Deck constraints shown on a generated query and checked after an edit. */
export interface NaturalLanguageSearchContext {
  readonly format: DeckFormat;
  readonly enforceColorIdentity: boolean;
  readonly colorIdentity: readonly PipColor[];
  /** When false, legality and color identity are left off the generated query. */
  readonly applyContext: boolean;
}

/**
 * Puts format legality and color identity on a generated query.
 *
 * An edited query is not passed here: the player's edit runs as written.
 *
 * @param query - the model's Scryfall text
 * @param context - the open deck, and whether the player left context on
 * @returns the query to show, with deck clauses only when context is on
 */
export function applySearchContext(
  query: string,
  context: NaturalLanguageSearchContext
): string {
  const withoutLegal = removeLegalityClause(query);
  if (!context.applyContext) return withoutLegal;
  const withIdentity = appendToken(withoutLegal, identityClause(context));
  return appendToken(withIdentity, `legal:${getFormatConfig(context.format).scryfallLegality}`);
}

/**
 * Reports whether an edited query searches outside the open deck.
 *
 * A narrower identity is still inside the deck. Dropping legality or naming a
 * color the commander cannot cast is a widening. Context that the player turned
 * off is not a widening; the panel says the results may be illegal instead.
 *
 * @param query - the text the player is about to run
 * @param context - the open deck
 * @returns true when the edit is wider than the deck and context is still on
 */
export function queryWidensDeckContext(
  query: string,
  context: NaturalLanguageSearchContext
): boolean {
  if (!context.applyContext) return false;
  if (!hasDeckLegality(query, context.format)) return true;
  if (!context.enforceColorIdentity) return false;
  return !identityStaysInside(query, context.colorIdentity);
}

function identityClause(context: NaturalLanguageSearchContext): string {
  if (!context.enforceColorIdentity) return "";
  if (!getFormatConfig(context.format).hasColorIdentity) return "";
  const colors = orderedColors(context.colorIdentity);
  if (colors.length === 0) return "id<=c";
  return `id<=${colors.join("")}`;
}

function orderedColors(colors: readonly string[]): readonly PipColor[] {
  const present = new Set<PipColor>();
  for (const color of colors) {
    if (isPipColor(color)) present.add(color);
  }
  return PIP_COLORS.filter((color) => present.has(color));
}

const COLOR_NAMES: readonly string[] = PIP_COLORS;

function isPipColor(value: string): value is PipColor {
  return COLOR_NAMES.includes(value);
}

function appendToken(query: string, token: string): string {
  if (token.length === 0 || ` ${query.toLowerCase()} `.includes(` ${token.toLowerCase()} `)) {
    return query;
  }
  return query.length === 0 ? token : `${query} ${token}`;
}

function hasDeckLegality(query: string, format: DeckFormat): boolean {
  const expected = `legal:${getFormatConfig(format).scryfallLegality}`;
  const clauses = query.toLowerCase().match(/\blegal:[a-z]+\b/gi) ?? [];
  return clauses.length === 1 && clauses[0]?.toLowerCase() === expected;
}

function identityStaysInside(query: string, colors: readonly PipColor[]): boolean {
  const clauses = [...query.toLowerCase().matchAll(/\bid<=([wubrgc]+)\b/g)].flatMap((match) => {
    const clause = match[1];
    return clause ? [clause] : [];
  });
  if (clauses.length === 0) return false;
  const allowed = new Set(colors.map((color) => color.toLowerCase()));
  if (allowed.size === 0) return clauses.every((clause) => clause === "c");
  return clauses.every((clause) => [...clause].every((letter) => allowed.has(letter)));
}
