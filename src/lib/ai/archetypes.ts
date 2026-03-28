/**
 * MTG Commander archetype definitions.
 * Used for auto-detection and prompt templating in AI suggestions.
 */

export const ARCHETYPES = [
  "Combo",
  "Stax",
  "Voltron",
  "Aristocrats",
  "Tokens",
  "Spellslinger",
  "Reanimator",
  "Ramp",
  "Control",
  "Aggro",
  "Goodstuff",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

// ─── Prompt templates per archetype ──────────────────────────────────────────

export const ARCHETYPE_PROMPT_HINTS: Record<Archetype, string> = {
  Combo:
    "Focus on tutors (Demonic Tutor, Vampiric Tutor, Mystical Tutor), protection (Counterspell, Deflecting Swat), fast mana rocks, and win conditions that interact with the commander. Avoid redundant cards that don't advance the combo gameplan.",
  Stax:
    "Focus on tax effects (Thalia, Sphere of Resistance, Trinisphere), asymmetric resource denial (Collector Ouphe, Drannith Magistrate), hate pieces against common strategies, and mana acceleration that circumvents your own stax pieces.",
  Voltron:
    "Focus on equipment and auras that buff the commander (Sword of Feast and Famine, Colossus Hammer), protection (Lightning Greaves, Swiftfoot Boots, Hammer of Nazahn), evasion (Whispersilk Cloak), and ways to recur equipment after removal.",
  Aristocrats:
    "Focus on sacrifice outlets (Viscera Seer, Ashnod's Altar, Phyrexian Altar), death payoffs (Blood Artist, Zulaport Cutthroat, Dictate of Erebos), token generators for fodder, and recursion engines (Reassembling Skeleton, Midnight Reaper).",
  Tokens:
    "Focus on token generators (Lingering Souls, Secure the Wastes, Rhys the Redeemed), anthems and wide buffs (Intangible Virtue, Anointed Procession), board-wide evasion, and ways to go wide quickly.",
  Spellslinger:
    "Focus on copy effects (Swarm Intelligence, Thousand-Year Storm, Reverberate), instant/sorcery payoffs (Guttersnipe, Runechanter's Pike, Aria of Flame), cantrips for velocity, and protection for the commander.",
  Reanimator:
    "Focus on discard/mill enablers (Faithless Looting, Entomb, Buried Alive), reanimation spells (Animate Dead, Reanimate, Necromancy), graveyard payoffs, and protection against graveyard hate.",
  Ramp:
    "Focus on land ramp (Cultivate, Kodama's Reach, Sylvan Scrying), mana doublers (Zendikar Resurgent, Mana Reflection), big spell payoffs (Genesis Wave, Craterhoof Behemoth), and X spells that scale with available mana.",
  Control:
    "Focus on counterspells (Counterspell, Swan Song, Arcane Denial), efficient removal (Swords to Plowshares, Vanishing Verse), card advantage engines (Rhystic Study, Consecrated Sphinx), and win conditions that close the game from a controlling position.",
  Aggro:
    "Focus on efficient creatures with haste and evasion, combat buffs (Beastmaster Ascension, Shared Animosity), low-cost removal to clear blockers, and ways to refill hand after going wide.",
  Goodstuff:
    "Focus on high-value staples appropriate for the format and bracket (Sol Ring, Arcane Signet, Command Tower), strong draw engines, versatile removal, and cards that provide value regardless of the specific game state.",
};

// ─── Auto-detection heuristics ───────────────────────────────────────────────

interface DetectionInput {
  cardNames: readonly string[];
  categories: {
    ramp: number;
    draw: number;
    removal: number;
    boardWipe: number;
    creatures: number;
  };
  detectedThemes?: readonly string[];
}

// Keywords that signal each archetype (case-insensitive partial match on card names)
const ARCHETYPE_SIGNALS: Record<Archetype, readonly string[]> = {
  Combo: ["Demonic Tutor", "Vampiric Tutor", "Thassa's Oracle", "Labman", "Isochron Scepter", "Dramatic Reversal", "Thoracle"],
  Stax: ["Thalia", "Sphere of Resistance", "Trinisphere", "Winter Orb", "Static Orb", "Collector Ouphe", "Drannith Magistrate"],
  Voltron: ["Lightning Greaves", "Swiftfoot Boots", "Colossus Hammer", "Sword of ", "Hammer of ", "Sigarda's Aid"],
  Aristocrats: ["Blood Artist", "Zulaport Cutthroat", "Viscera Seer", "Ashnod's Altar", "Phyrexian Altar", "Grave Pact", "Dictate of Erebos"],
  Tokens: ["Anointed Procession", "Parallel Lives", "Doubling Season", "Rhys the Redeemed", "Secure the Wastes", "Intangible Virtue"],
  Spellslinger: ["Thousand-Year Storm", "Guttersnipe", "Pyromancer's Goggles", "Swarm Intelligence", "Aria of Flame", "Electrostatic Field"],
  Reanimator: ["Reanimate", "Animate Dead", "Entomb", "Buried Alive", "Necromancy", "Dance of the Dead", "Faithless Looting"],
  Ramp: ["Cultivate", "Kodama's Reach", "Selvala", "Zendikar Resurgent", "Mana Reflection", "Vorinclex", "Genesis Wave"],
  Control: ["Counterspell", "Swan Song", "Arcane Denial", "Rhystic Study", "Cyclonic Rift", "Consecrated Sphinx", "Mystic Remora"],
  Aggro: ["Beastmaster Ascension", "Shared Animosity", "Goblin Guide", "Purphoros", "Impact Tremors"],
  Goodstuff: [],
};

/**
 * Detect the most likely archetype(s) from deck composition.
 * Returns up to 2 archetypes sorted by match strength.
 */
function scoreArchetype(
  archetype: Archetype,
  cardNamesLower: string[],
  themeNames: string[]
): number {
  const signalScore = ARCHETYPE_SIGNALS[archetype].reduce((acc, signal) => {
    return acc + (cardNamesLower.some((n) => n.includes(signal.toLowerCase())) ? 2 : 0);
  }, 0);
  const themeBoost = themeNames.some((t) => t.includes(archetype.toLowerCase())) ? 3 : 0;
  return signalScore + themeBoost;
}

function applyHeuristics(
  scores: Record<Archetype, number>,
  categories: DetectionInput["categories"]
): void {
  const total = Object.values(categories).reduce((s, v) => s + v, 0);
  if (total === 0) return;
  if (categories.ramp / total > 0.15) scores.Ramp += 1;
  if (categories.creatures / total > 0.4) scores.Aggro += 1;
  if (categories.removal > 6) scores.Control += 1;
}

export function detectArchetypes(input: DetectionInput): Archetype[] {
  const cardNamesLower = input.cardNames.map((n) => n.toLowerCase());
  const themeNames = (input.detectedThemes ?? []).map((t) => t.toLowerCase());

  const scores = Object.fromEntries(
    ARCHETYPES.map((arch) => [arch, scoreArchetype(arch, cardNamesLower, themeNames)])
  ) as Record<Archetype, number>;

  applyHeuristics(scores, input.categories);

  const sorted = (Object.entries(scores) as [Archetype, number][])
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([arch]) => arch)
    .slice(0, 2);

  return sorted.length > 0 ? sorted : ["Goodstuff"];
}
