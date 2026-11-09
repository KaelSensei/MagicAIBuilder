import type { Bracket, BuildRequest } from "@/app/api/ai/build/types";

export interface DeckPlanRole {
  readonly role: string;
  readonly target: string;
}

export interface DeckPlan {
  readonly gameplan: string;
  readonly winConditions: readonly string[];
  readonly roles: readonly DeckPlanRole[];
  readonly constraints: readonly string[];
}

const COLOR_NAMES = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
} as const;

const CORE_ROLES: readonly DeckPlanRole[] = [
  { role: "Lands", target: "36-38" },
  { role: "Ramp", target: "10-12" },
  { role: "Card advantage", target: "10-12" },
  { role: "Interaction", target: "8-10" },
  { role: "Board wipes", target: "2-3" },
  { role: "Protection", target: "3-5" },
];

interface StrategyPlan {
  readonly gameplan: string;
  readonly winConditions: readonly string[];
  readonly roleOverrides?: Readonly<Record<string, string>>;
  readonly extraRoles?: readonly DeckPlanRole[];
}

const STRATEGY_PLANS: Readonly<Record<string, StrategyPlan>> = {
  aggro: {
    gameplan:
      "Apply pressure early, keep the curve low, and convert tempo into lethal combat damage.",
    winConditions: [
      "Overwhelm the table through combat",
      "Finish weakened opponents with reach or an overrun effect",
    ],
    roleOverrides: { Interaction: "8-10", Protection: "4-6" },
    extraRoles: [{ role: "Early threats", target: "14-18" }],
  },
  control: {
    gameplan:
      "Develop resources while controlling the table, then turn card advantage into an inevitable finish.",
    winConditions: [
      "Protect a resilient late-game threat",
      "Lock in an advantage engine and close after stabilizing",
    ],
    roleOverrides: { Interaction: "12-15", "Card advantage": "12-14" },
  },
  combo: {
    gameplan:
      "Assemble a compact combo while using selection, tutors, and protection to pick the right window.",
    winConditions: [
      "Resolve the primary combo",
      "Use a synergistic backup combo or commander engine",
    ],
    extraRoles: [{ role: "Combo pieces and tutors", target: "10-14" }],
  },
  midrange: {
    gameplan:
      "Build incremental value, answer the most important threats, and pivot from defense to pressure.",
    winConditions: [
      "Snowball a repeatable value engine",
      "Win combat with efficient, scalable threats",
    ],
  },
  tokens: {
    gameplan:
      "Build a wide token board, multiply its value, and protect the decisive attack.",
    winConditions: [
      "Overwhelm opponents with token combat damage",
      "Convert token creation into a non-combat payoff",
    ],
    extraRoles: [
      { role: "Token makers", target: "12-16" },
      { role: "Payoffs", target: "8-10" },
    ],
  },
  sacrifice: {
    gameplan:
      "Create disposable resources, sacrifice them for value, and recur key pieces faster than opponents can answer them.",
    winConditions: [
      "Drain the table through repeated sacrifice triggers",
      "Loop a recursion engine for decisive value",
    ],
    extraRoles: [
      { role: "Sacrifice outlets", target: "8-10" },
      { role: "Fodder and recursion", target: "12-16" },
    ],
  },
  ramp: {
    gameplan:
      "Accelerate ahead of the table and turn the mana advantage into high-impact threats.",
    winConditions: [
      "Resolve and protect oversized threats",
      "Convert excess mana into a scalable finisher",
    ],
    roleOverrides: { Ramp: "14-16" },
  },
  voltron: {
    gameplan:
      "Develop the commander, protect it, and reach lethal commander damage efficiently.",
    winConditions: [
      "Deal 21 commander damage",
      "Use an evasive backup threat if the commander is contained",
    ],
    roleOverrides: { Protection: "8-10" },
    extraRoles: [{ role: "Enhancements and evasion", target: "12-16" }],
  },
};

interface BracketBrief {
  /** Official name and intent, e.g. "Bracket 2 (Core): unoptimized and straightforward". */
  readonly heading: string;
  /** One official rule per line, shown to the player and given to the model. */
  readonly rules: readonly string[];
}

/**
 * The official Commander brackets as the copilot must apply them: bracket text
 * of 2025-10-21, Game Changers list of 2026-02-09. Tutors are restricted only
 * through the Game Changers list since 2025-10-21.
 *
 * Source: docs/product/guides/commander-deckbuilding-by-bracket.md. Kept here,
 * not derived from BRACKET_DEFINITIONS, until that constant covers bracket 5
 * and drops its outdated tutor flag (I-28 slice 2).
 */
const BRACKET_BRIEFS: Readonly<Record<Bracket, BracketBrief>> = {
  1: {
    heading: "Bracket 1 (Exhibition): a goal, theme or idea over power",
    rules: [
      "No Game Changers, extra turns or two-card combos unless highly thematic",
      "No mass land denial",
      "Tutors are allowed unless they are Game Changers",
      "Expect to play at least 9 turns before you win or lose",
    ],
  },
  2: {
    heading: "Bracket 2 (Core): unoptimized and straightforward",
    rules: [
      "No Game Changers",
      "No two-card combos (game-ending, lockout or infinite)",
      "No mass land denial or chained extra turns",
      "Tutors are allowed unless they are Game Changers",
      "Expect to play at least 8 turns before you win or lose",
    ],
  },
  3: {
    heading: "Bracket 3 (Upgraded): strong synergy and high card quality",
    rules: [
      "Up to 3 Game Changers",
      "No two-card combos (game-ending, lockout or infinite) before turn 6",
      "No mass land denial or chained extra turns",
      "Expect to play at least 6 turns before you win or lose",
    ],
  },
  4: {
    heading:
      "Bracket 4 (Optimized): lethal, consistent and fast, but not built for the cEDH metagame",
    rules: [
      "Unlimited Game Changers; only the banned list restricts cards",
      "Expect to play at least 4 turns before you win or lose",
    ],
  },
  5: {
    heading:
      "Bracket 5 (cEDH): built for the cEDH metagame, optimized for efficiency and consistency",
    rules: [
      "Unlimited Game Changers; only the banned list restricts cards",
      "Games can end on any turn",
    ],
  },
};

/**
 * Names a bracket the way the copilot prompt states the power level.
 *
 * @param bracket - target bracket of the build request
 * @returns the official bracket name and intent, e.g. "Bracket 3 (Upgraded): …"
 */
export function describeBracket(bracket: Bracket): string {
  return BRACKET_BRIEFS[bracket].heading;
}

function rolesFor(plan: StrategyPlan): readonly DeckPlanRole[] {
  const core = CORE_ROLES.map((role) => ({
    ...role,
    target: plan.roleOverrides?.[role.role] ?? role.target,
  }));
  return [...core, ...(plan.extraRoles ?? [])];
}

export function createDeckPlan(request: BuildRequest): DeckPlan {
  const strategy = STRATEGY_PLANS[request.strategy.toLowerCase()];
  const resolved = strategy ?? {
    gameplan: `Build around ${request.strategy} while maintaining a balanced Commander shell.`,
    winConditions: [
      `Turn the ${request.strategy} theme into a decisive advantage`,
      "Use a resilient combat-based backup plan",
    ],
  };
  const colors = request.colors.map((color) => COLOR_NAMES[color]).join(", ");
  const commanderConstraint = request.commanderName
    ? `Use ${request.commanderName} as commander`
    : `Choose a commander with exactly ${colors} color identity`;
  const bracket = BRACKET_BRIEFS[request.bracket];

  return {
    gameplan: resolved.gameplan,
    winConditions: resolved.winConditions,
    roles: rolesFor(resolved),
    constraints: [
      `${colors} color identity only`,
      commanderConstraint,
      request.budget === null
        ? "Favor accessible cards; no price cap"
        : `$${request.budget} maximum per card`,
      bracket.heading,
      ...bracket.rules,
    ],
  };
}

export function formatDeckPlanForPrompt(plan: DeckPlan): string {
  const roles = plan.roles
    .map(({ role, target }) => `- ${role}: ${target} cards`)
    .join("\n");
  const winConditions = plan.winConditions
    .map((item) => `- ${item}`)
    .join("\n");
  const constraints = plan.constraints.map((item) => `- ${item}`).join("\n");
  return `GAMEPLAN:\n${plan.gameplan}\n\nWIN CONDITIONS:\n${winConditions}\n\nROLE TARGETS:\n${roles}\n\nREVIEWED CONSTRAINTS:\n${constraints}`;
}
