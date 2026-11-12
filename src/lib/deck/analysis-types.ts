/**
 * The report types deck analysis produces: the deck statistics and the bracket score.
 *
 * Context: deck analysis. `computeDeckStats` (`stats.ts`) fills `DeckStats` from the measures of
 * `commander-rules-check`, `themes`, `format-stats`, `mana-alignment` and `turn-one`;
 * `scoreBracket` (`bracket.ts`) reads it and returns `BracketScore`. The stats panel, the bracket
 * indicator and the AI suggestion payload consume both.
 *
 * Why a module of its own: these types used to live in `types.ts`, so the core `Deck` types
 * imported the analysis modules that import `Deck` back, a type-only cycle. Here they depend on the
 * analysis modules and nothing in the core types depends on them.
 *
 * @module deck/analysis-types
 */

import type { BracketLevel } from "@/lib/constants/brackets";

import type { CommanderRuleIssue } from "./commander-rules-check";
import type { FormatStats } from "./format-stats";
import type { ManaAlignment } from "./mana-alignment";
import type { DetectedTheme } from "./themes";
import type { TurnOnePlayability } from "./turn-one";

/**
 * Counts and measures of one deck, as `computeDeckStats` returns them. The nullable measures are
 * null when they do not apply to the deck, as each field says.
 */
export interface DeckStats {
  totalCards: number;
  lands: number;
  creatures: number;
  ramp: number;
  draw: number;
  removal: number;
  boardWipes: number;
  avgCmc: number;
  manaCurve: Record<number, number>;
  colorDistribution: Record<string, number>;
  gameChangersCount: number;
  gameChangersList: string[];
  totalPrice: number;
  overBudgetCards: string[];
  bannedCards: string[];
  colorIdentityViolations: string[];
  /** Main-deck cards whose rules text cannot work with this commander (deterministic rules check) */
  commanderRuleIssues: readonly CommanderRuleIssue[];
  themes?: DetectedTheme[];
  flexibleLands: number;
  /** Curve / threat / interaction measures; null for Commander (bracket scoring instead) */
  formatStats: FormatStats | null;
  /** Pips asked for vs. sources produced; null when no spell needs coloured mana */
  manaAlignment: ManaAlignment | null;
  /** Odds the opening hand can act on turn one; null when the deck has no one-drops */
  turnOnePlayability: TurnOnePlayability | null;
}

/**
 * The estimated Commander bracket of a deck list and the signals behind it, from `scoreBracket`.
 * Only formats with bracket scoring get one (`FORMAT_CONFIG.hasBracketScoring`).
 */
export interface BracketScore {
  /** Estimated bracket, 1 to 4: the cEDH metagame that sets Bracket 5 apart is not visible in a list. */
  overall: BracketLevel;
  /**
   * Power signals, each scored 1–4. Tutors are not one: Wizards removed the
   * tutor restriction on 2025-10-21 and lets the Game Changers list catch them.
   */
  dimensions: {
    ramp: number;
    draw: number;
    removal: number;
    winSpeed: number;
    avgCmc: number;
  };
  gameChangers: number;
  twoCardInfiniteCombos: number;
  warnings: string[];
}
