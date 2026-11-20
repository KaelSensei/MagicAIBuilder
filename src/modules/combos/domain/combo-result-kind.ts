/**
 * The table that maps a Commander Spellbook Standalone result to the way it
 * ends a game (I-65 requirement 2.4, delivery slice 2).
 *
 * Context: combos. A combo route's kind is decided by Spellbook's result name,
 * never by rewriting the variant's text. The patterns are I-65's ("win the
 * game", "lose the game", "damage", "lifeloss", "mill" without "self-mill",
 * "lock", "skip", "control", "turns"), narrowed against the 323 Standalone
 * feature names Spellbook listed at https://backend.commanderspellbook.com/features/
 * on 2026-11-20 (API 7.4.4): "control" matches only control of opponents or of
 * their permanents, since "creatures you control" appears in dozens of results
 * that end nothing, and "turns" only infinite turns, since "on each of their
 * turns" describes a lock. A name the table does not know is `"other"`, shown
 * as "combo: other result"; it never throws.
 *
 * Not responsible for: the route model and its definitions (I-65 slice 1),
 * which results are Standalone (`Combo.standaloneResults`), or the wording.
 *
 * @module combos/combo-result-kind
 */

/**
 * How a combo's result ends the game, by the rule I-65 names for it:
 * - `alternativeWin`: a player wins or loses the game (CR 104.2b, 104.3e);
 * - `combat`: combat damage (CR 104.3b);
 * - `drain`: non-combat damage or life loss (CR 104.3b);
 * - `mill`: an opponent's library empties (CR 104.3c);
 * - `lock`: opponents skip turns, are controlled or locked out; it ends no game by itself;
 * - `extraTurn`: infinite extra turns (CR 500.7);
 * - `other`: a result the table does not map, such as infinite mana.
 */
export type ComboResultKind =
  | "alternativeWin"
  | "combat"
  | "drain"
  | "mill"
  | "lock"
  | "extraTurn"
  | "other";

/** One row of the table: the first row whose pattern matches decides. */
interface ResultRule {
  readonly kind: Exclude<ComboResultKind, "other">;
  readonly pattern: RegExp;
}

/**
 * The table, in order. The game loss comes first: "Skip all your future turns,
 * causing your opponents to … lose the game" ends the game, which outranks the
 * skipped turns that cause it. Combat damage comes before any other damage.
 */
const RESULT_RULES: readonly ResultRule[] = [
  { kind: "alternativeWin", pattern: /\bwin the game\b/i },
  { kind: "alternativeWin", pattern: /(?<!can't )\bloses? the game\b/i },
  {
    kind: "lock",
    pattern:
      /\bskips?\b|\blocks? out\b|\bgain control of\b|\byou control (?:one|up to \w+|your) opponents?\b/i,
  },
  { kind: "extraTurn", pattern: /\binfinite turns\b/i },
  { kind: "mill", pattern: /(?<!self-)\bmill\b/i },
  { kind: "combat", pattern: /\bcombat damage\b/i },
  { kind: "drain", pattern: /\bdamage\b|\blifeloss\b|\blife loss\b/i },
];

/**
 * Maps one Spellbook Standalone result name to how it ends the game.
 *
 * @param resultName - the feature name exactly as Spellbook sent it, any case
 * @returns the first matching kind of the table, or `"other"` when none matches
 */
export function comboResultKind(resultName: string): ComboResultKind {
  const rule = RESULT_RULES.find(({ pattern }) => pattern.test(resultName));
  return rule?.kind ?? "other";
}
