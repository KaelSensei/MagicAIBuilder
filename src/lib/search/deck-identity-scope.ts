/**
 * The one Scryfall clause that keeps a search inside an open deck's colour
 * identity. Both the builder's name search and the described search add it,
 * so a rulebreaker commander widens the two the same way.
 *
 * Search context. Rules: CR 903.4 (a commander's colour identity), CR 903.5c
 * (every card's identity must sit inside the commander's), CR 702.124 (a
 * partner pair's identity is the union of both), CR 903.5e (a rulebreaker
 * commander admits some cards whatever their identity). The format table says
 * which formats read colour identity (`hasColorIdentity`).
 *
 * Not responsible for: legality (the caller adds `legal:`), and the player's
 * own colour filter, which narrows inside this clause and stays as chosen.
 *
 * @module search/deck-identity-scope
 */
import { commanderNameExceptions } from "@/lib/deck/color-identity";
import { getFormatConfig, type DeckFormat } from "@/lib/deck/formats";
import { PIP_COLORS, type PipColor } from "@/lib/deck/mana-alignment";
import { identityScopeClause } from "./rulebreaker-scope";

/** What the identity clause reads of the open deck. */
export interface DeckIdentityScope {
  readonly format: DeckFormat;
  /** False before a commander is set: there is no identity to scope to yet. */
  readonly enforceColorIdentity: boolean;
  /** The commander's and the partner's colour letters, in any order. */
  readonly colorIdentity: readonly string[];
  /** The commander's and the partner's names, never a card of the 99 (CR 903.5e). */
  readonly commandZoneNames: readonly string[];
}

/**
 * The deck's identity clause: `id<=` the command zone's colours in WUBRG
 * order, `id<=c` for a colourless commander, widened by a rulebreaker's
 * exceptions.
 *
 * @param scope - The open deck's format, command zone colours and names
 * @returns `id<=WB`, `(id<=WB OR t:angel OR t:basic)` under Seluma, or "" when
 *   the deck has no commander or its format has no colour identity
 */
export function deckIdentityScopeClause(scope: DeckIdentityScope): string {
  if (!scope.enforceColorIdentity) return "";
  if (!getFormatConfig(scope.format).hasColorIdentity) return "";
  const colors = orderedColors(scope.colorIdentity);
  return identityScopeClause(
    colors.length === 0 ? "c" : colors.join(""),
    commanderNameExceptions(scope.commandZoneNames)
  );
}

/**
 * Adds the deck's identity clause to a built query. Scryfall joins terms with
 * an implicit AND, so a player's own colour filter in `query` still narrows
 * inside the clause.
 *
 * @param query - A query built by the name search, legality included
 * @param clause - From {@link deckIdentityScopeClause}, or "" for no scope
 * @returns `query` followed by `clause`, or `query` unchanged when `clause` is ""
 */
export function withDeckIdentityScope(query: string, clause: string): string {
  if (clause.length === 0) return query;
  return `${query} ${clause}`;
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
