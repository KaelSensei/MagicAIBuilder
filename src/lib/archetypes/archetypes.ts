/**
 * Commander Archetypes Library — Official archetype definitions
 * Pure data + utility functions. No framework dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────
export interface Archetype {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly difficulty: 1 | 2 | 3 | 4 | 5; // 1=Easy, 5=Expert
  readonly difficultyLabel: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly bestFor: string;
  readonly coreElements: readonly string[];
  readonly tags: readonly string[]; // used for tag matching
  readonly metaPercentage?: number; // % of EDH decks in meta
}

// ─── Archetype definitions ─────────────────────────────────────────────────
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "combo",
    name: "Combo",
    description: "Win quickly through infinite loops or game-ending synergies. Requires precise sequencing and redundancy.",
    difficulty: 4,
    difficultyLabel: "Advanced",
    strengths: ["Wins fast", "Hard to interact with", "Consistent"],
    weaknesses: ["Fragile to interaction", "No plan B", "Complex sequencing"],
    bestFor: "Experienced players who enjoy puzzle-solving",
    coreElements: ["Tutors (4–6)", "Win conditions (2–3)", "Mana acceleration (6–8)", "Protection (2–3)"],
    tags: ["Combo", "Infinite"],
    metaPercentage: 15,
  },
  {
    id: "voltron",
    name: "Voltron",
    description: "Stack equipment and auras on your commander to deliver massive damage quickly. Simple but effective.",
    difficulty: 2,
    difficultyLabel: "Easy",
    strengths: ["Simple strategy", "Consistent damage", "Strong commander"],
    weaknesses: ["Weak to removal", "Single threat", "Loses to stax"],
    bestFor: "Beginners and players who enjoy aggro",
    coreElements: ["Equipment (8–10)", "Commander protection (3–4)", "Auras (2–4)", "Ramp (8–10)"],
    tags: ["Voltron", "Equipment"],
    metaPercentage: 12,
  },
  {
    id: "control",
    name: "Control",
    description: "Answer every threat and win when opponents run out of resources. Requires deep knowledge of the meta.",
    difficulty: 3,
    difficultyLabel: "Intermediate",
    strengths: ["Answers everything", "Wins late game", "Flexible"],
    weaknesses: ["Slow", "Needs many answers", "Hard against aggro"],
    bestFor: "Players who enjoy reactive gameplay",
    coreElements: ["Counterspells (5–8)", "Removal (8–10)", "Card draw (6–8)", "Win conditions (2–3)"],
    tags: ["Control", "Reactive"],
    metaPercentage: 20,
  },
  {
    id: "stax",
    name: "Stax",
    description: "Lock opponents out of the game through tax effects and resource denial. Extremely powerful but polarizing.",
    difficulty: 5,
    difficultyLabel: "Expert",
    strengths: ["Slows everyone", "Wins through attrition", "Strong vs combo"],
    weaknesses: ["Very complex", "Unpopular at tables", "Vulnerable if stax removed"],
    bestFor: "Expert players and CEDH environments",
    coreElements: ["Tax effects (6–8)", "Resource denial (4–6)", "Wincon (1–2)", "Fast mana (6–8)"],
    tags: ["Stax", "Tax", "Prison"],
    metaPercentage: 8,
  },
  {
    id: "tokens",
    name: "Tokens",
    description: "Flood the board with token creatures and overwhelm opponents with quantity over quality.",
    difficulty: 2,
    difficultyLabel: "Easy",
    strengths: ["Resilient to removal", "Scales with buffs", "Explosive turns"],
    weaknesses: ["Weak to boardwipes", "Needs anthem effects", "Slow setup"],
    bestFor: "Players who enjoy multiplayer politics",
    coreElements: ["Token generators (10–12)", "Anthem effects (4–6)", "Card draw (6–8)", "Protection (2–3)"],
    tags: ["Tokens", "Wide"],
    metaPercentage: 18,
  },
  {
    id: "reanimator",
    name: "Reanimator",
    description: "Fill your graveyard with powerful creatures and reanimate them at a discount. Graveyard is your resource.",
    difficulty: 3,
    difficultyLabel: "Intermediate",
    strengths: ["Cheats on mana", "Redundant threats", "Recovers from wipes"],
    weaknesses: ["Graveyard hate destroys it", "Setup intensive", "Needs payoffs"],
    bestFor: "Players who enjoy graveyard strategies",
    coreElements: ["Reanimation spells (6–8)", "Discard outlets (4–5)", "Targets (8–10)", "Graveyard protection (2–3)"],
    tags: ["Reanimator", "Graveyard"],
    metaPercentage: 10,
  },
  {
    id: "goodstuff",
    name: "Goodstuff",
    description: "Play the best cards in your colors regardless of synergy. Raw power over theme.",
    difficulty: 1,
    difficultyLabel: "Beginner",
    strengths: ["Easy to build", "Powerful cards", "Flexible"],
    weaknesses: ["Lacks cohesion", "Outclassed by focused decks", "Expensive"],
    bestFor: "New players and casual tables",
    coreElements: ["Removal (6–8)", "Ramp (8–10)", "Card draw (6–8)", "Win conditions (3–4)"],
    tags: ["Goodstuff", "Midrange"],
    metaPercentage: 25,
  },
  {
    id: "spellslinger",
    name: "Spellslinger",
    description: "Cast as many spells as possible to trigger powerful payoffs. Instants and sorceries are your weapons.",
    difficulty: 3,
    difficultyLabel: "Intermediate",
    strengths: ["Explosively powerful", "Synergistic", "Hard to interact with at instant speed"],
    weaknesses: ["Needs payoffs on board", "Vulnerable to permanent removal", "Complex counting"],
    bestFor: "Players who enjoy storm-style gameplay",
    coreElements: ["Payoffs (6–8)", "Cantrips (8–10)", "Mana doubling (3–4)", "Protection (2–3)"],
    tags: ["Spellslinger", "Storm", "Instants"],
    metaPercentage: 12,
  },
  {
    id: "ramp",
    name: "Ramp",
    description: "Accelerate mana production far ahead of curve to cast massive threats ahead of schedule.",
    difficulty: 2,
    difficultyLabel: "Easy",
    strengths: ["Plays big threats early", "Good in multiplayer", "Simple strategy"],
    weaknesses: ["Weak to stax", "Slow start", "Needs big finishers"],
    bestFor: "Players who enjoy big creatures and big turns",
    coreElements: ["Mana ramp (12–14)", "Mana doublers (3–4)", "Big finishers (8–10)", "Card draw (5–6)"],
    tags: ["Ramp", "Landfall", "Big Mana"],
    metaPercentage: 15,
  },
  {
    id: "aggro",
    name: "Aggro",
    description: "Apply pressure from turn 1 and win before opponents stabilize. Speed is everything.",
    difficulty: 2,
    difficultyLabel: "Easy",
    strengths: ["Wins fast", "Simple plan", "Disrupts slow decks"],
    weaknesses: ["Runs out of gas", "Weak late game", "Needs low curves"],
    bestFor: "Players who enjoy fast-paced games",
    coreElements: ["Cheap threats (15–18)", "Evasion (5–6)", "Combat tricks (4–5)", "Haste enablers (4–5)"],
    tags: ["Aggro", "Beatdown"],
    metaPercentage: 10,
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────
export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function filterByDifficulty(
  archetypes: readonly Archetype[],
  maxDifficulty: number
): Archetype[] {
  return archetypes.filter((a) => a.difficulty <= maxDifficulty);
}

/**
 * Detect archetype from deck tags.
 * Returns the first matching archetype (case-insensitive).
 */
export function getArchetypeForDeck(
  deckTags: readonly string[]
): Archetype | undefined {
  const lowerTags = new Set(deckTags.map((tag) => tag.toLowerCase()));
  return ARCHETYPES.find((arch) =>
    arch.tags.some((tag) => lowerTags.has(tag.toLowerCase()))
  );
}
