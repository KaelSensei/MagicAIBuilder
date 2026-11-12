// The official bracket rules as the copilot is told them, read from the same
// table the bracket estimate uses so the two cannot disagree.
import {
  BRACKET_DEFINITIONS,
  type BracketDefinition,
  type BracketLevel,
  type BracketRestriction,
  type ExtraTurnRule,
  type TwoCardComboRule,
} from "@/lib/constants/brackets";

/** One bracket's rules, worded for a model prompt. */
export interface BracketBrief {
  /** Official name and intent, e.g. "Bracket 2 (Core): unoptimized and straightforward". */
  readonly heading: string;
  /** One official rule per line, shown to the player and given to the model. */
  readonly rules: readonly string[];
}

/** Restrictions on what a deck does to the table, stated on one line. */
const TABLE_RESTRICTIONS = [
  "massLandDenial",
  "extraTurns",
] as const satisfies readonly BracketRestriction[];

/** Joins phrases as "a, b or c". */
function joinWithOr(phrases: readonly string[]): string {
  const head = phrases.slice(0, -1);
  const last = phrases.slice(-1).join("");
  return head.length === 0 ? last : `${head.join(", ")} or ${last}`;
}

function extraTurnProhibition(rule: ExtraTurnRule): string | null {
  switch (rule) {
    case "none":
      return "extra turns";
    case "noChaining":
      return "chained extra turns";
    case "unrestricted":
      return null;
    default: {
      const unhandled: never = rule;
      throw new Error(`Unhandled extra-turn rule: ${String(unhandled)}`);
    }
  }
}

/**
 * Names what a bracket forbids under one restriction.
 *
 * @returns the forbidden pattern, or null when the bracket does not restrict it
 */
function prohibition(
  definition: BracketDefinition,
  restriction: BracketRestriction
): string | null {
  switch (restriction) {
    case "gameChangers":
      return definition.maxGameChangers === 0 ? "Game Changers" : null;
    case "massLandDenial":
      return definition.massLandDenial === "none" ? "mass land denial" : null;
    case "extraTurns":
      return extraTurnProhibition(definition.extraTurns);
    case "twoCardCombos":
      return definition.twoCardCombos.kind === "unrestricted"
        ? null
        : "two-card combos";
    default: {
      const unhandled: never = restriction;
      throw new Error(`Unhandled bracket restriction: ${String(unhandled)}`);
    }
  }
}

function prohibitions(
  definition: BracketDefinition,
  restrictions: readonly BracketRestriction[]
): readonly string[] {
  return restrictions.flatMap(
    (restriction) => prohibition(definition, restriction) ?? []
  );
}

function restrictsOnlyGameChangers(definition: BracketDefinition): boolean {
  return (
    definition.massLandDenial === "unrestricted" &&
    definition.extraTurns === "unrestricted" &&
    definition.twoCardCombos.kind === "unrestricted"
  );
}

function gameChangerRule(definition: BracketDefinition): string {
  if (definition.maxGameChangers === 0) return "No Game Changers";
  if (Number.isFinite(definition.maxGameChangers)) {
    return `Up to ${definition.maxGameChangers} Game Changers`;
  }
  return restrictsOnlyGameChangers(definition)
    ? "Unlimited Game Changers; only the banned list restricts cards"
    : "Unlimited Game Changers";
}

function twoCardComboRule(rule: TwoCardComboRule): string | null {
  const noCombos = "No two-card combos (game-ending, lockout or infinite)";
  switch (rule.kind) {
    case "none":
      return noCombos;
    case "notBeforeTurn":
      return `${noCombos} before turn ${rule.turn}`;
    case "unrestricted":
      return null;
    default: {
      const unhandled: never = rule;
      throw new Error(`Unhandled two-card combo rule: ${String(unhandled)}`);
    }
  }
}

function turnRule(minTurns: number | null): string {
  return minTurns === null
    ? "Games can end on any turn"
    : `Expect to play at least ${minTurns} turns before you win or lose`;
}

function briefFor(definition: BracketDefinition): BracketBrief {
  const excepted = new Set<BracketRestriction>(definition.thematicExceptions);
  const thematic = prohibitions(definition, definition.thematicExceptions);
  const atTable = prohibitions(
    definition,
    TABLE_RESTRICTIONS.filter((restriction) => !excepted.has(restriction))
  );
  const comboRule = excepted.has("twoCardCombos")
    ? null
    : twoCardComboRule(definition.twoCardCombos);

  return {
    heading: `Bracket ${definition.level} (${definition.name}): ${definition.intent}`,
    rules: [
      ...(thematic.length > 0
        ? [`No ${joinWithOr(thematic)} unless highly thematic`]
        : []),
      ...(excepted.has("gameChangers") ? [] : [gameChangerRule(definition)]),
      ...(comboRule === null ? [] : [comboRule]),
      ...(atTable.length > 0 ? [`No ${joinWithOr(atTable)}`] : []),
      // Models still apply the tutor limit Wizards dropped on 2025-10-21.
      ...(definition.maxGameChangers === 0
        ? ["Tutors are allowed unless they are Game Changers"]
        : []),
      turnRule(definition.minTurns),
    ],
  };
}

/**
 * States a bracket's official rules for the copilot, one rule per line.
 *
 * @param level - target bracket of the request
 * @returns the bracket heading and its rules, from `BRACKET_DEFINITIONS`
 */
export function bracketBrief(level: BracketLevel): BracketBrief {
  return briefFor(BRACKET_DEFINITIONS[level]);
}
