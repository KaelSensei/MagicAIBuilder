import type { BuildRequest } from "@/app/api/ai/build/types";

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

const BRACKET_CONSTRAINTS: Readonly<Record<number, string>> = {
  1: "Bracket 1: theme-first, no tutors, combos, or game changers",
  2: "Bracket 2: at most 1 game changer and no infinite combos",
  3: "Bracket 3: up to 3 game changers and no cEDH optimization",
  4: "Bracket 4: optimized high-power play short of cEDH",
  5: "Bracket 5: fully optimized cEDH play",
};

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
      BRACKET_CONSTRAINTS[request.bracket] ?? BRACKET_CONSTRAINTS[2],
    ],
  };
}

export function formatDeckPlanForPrompt(plan: DeckPlan): string {
  const roles = plan.roles
    .map(({ role, target }) => `- ${role}: ${target} cards`)
    .join("\n");
  return `GAMEPLAN:\n${plan.gameplan}\n\nWIN CONDITIONS:\n${plan.winConditions.map((item) => `- ${item}`).join("\n")}\n\nROLE TARGETS:\n${roles}\n\nREVIEWED CONSTRAINTS:\n${plan.constraints.map((item) => `- ${item}`).join("\n")}`;
}
