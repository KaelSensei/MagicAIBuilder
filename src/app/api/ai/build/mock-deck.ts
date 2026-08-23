/**
 * Demo decklist used when no AI provider is configured.
 *
 * It is deliberately built from colour-identity-free staples plus basic lands,
 * so whatever colours the user picked the list stays Commander-legal. It is a
 * placeholder, not a recommendation — the UI labels it as such.
 */
import type { AICard, AIDeckResponse, BuildColor, BuildRequest } from "./types";

/** Commander per colour identity, keyed by WUBRG-sorted colour string. */
export const MOCK_COMMANDERS = {
  C: "Kozilek, the Great Distortion",
  W: "Giada, Font of Hope",
  U: "Talrand, Sky Summoner",
  B: "Gonti, Lord of Luxury",
  R: "Krenko, Mob Boss",
  G: "Azusa, Lost but Seeking",
  WU: "Brago, King Eternal",
  WB: "Teysa Karlov",
  WR: "Feather, the Redeemed",
  WG: "Rhys the Redeemed",
  UB: "Lazav, the Multifarious",
  UR: "Niv-Mizzet, Parun",
  UG: "Kinnan, Bonder Prodigy",
  BR: "Judith, the Scourge Diva",
  BG: "Meren of Clan Nel Toth",
  RG: "Xenagos, God of Revels",
  WUB: "Sen Triplets",
  WUR: "Kykar, Wind's Fury",
  WUG: "Chulane, Teller of Tales",
  WBR: "Kaalia of the Vast",
  WBG: "Ghave, Guru of Spores",
  WRG: "Marath, Will of the Wild",
  UBR: "Nicol Bolas, the Ravager",
  UBG: "Muldrotha, the Gravetide",
  URG: "Animar, Soul of Elements",
  BRG: "Prossh, Skyraider of Kher",
  WUBR: "Breya, Etherium Shaper",
  WUBG: "Atraxa, Praetors' Voice",
  WURG: "Kynaios and Tiro of Meletis",
  WBRG: "Saskia the Unyielding",
  UBRG: "Yidris, Maelstrom Wielder",
  WUBRG: "Kenrith, the Returned King",
} as const satisfies Record<string, string>;

const WUBRG: readonly BuildColor[] = ["W", "U", "B", "R", "G"];

const BASIC_BY_COLOR: Record<Exclude<BuildColor, "C">, string> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

/**
 * Staples with no coloured mana symbol anywhere in their cost or text, so they
 * are legal in every colour identity.
 */
const COLORLESS_STAPLES: readonly AICard[] = [
  { name: "Sol Ring", quantity: 1, category: "ramp" },
  { name: "Arcane Signet", quantity: 1, category: "ramp" },
  { name: "Mind Stone", quantity: 1, category: "ramp" },
  { name: "Thought Vessel", quantity: 1, category: "ramp" },
  { name: "Wayfarer's Bauble", quantity: 1, category: "ramp" },
  { name: "Hedron Archive", quantity: 1, category: "ramp" },
  { name: "Worn Powerstone", quantity: 1, category: "ramp" },
  { name: "Solemn Simulacrum", quantity: 1, category: "ramp" },
  { name: "Burnished Hart", quantity: 1, category: "ramp" },
  { name: "Skyscanner", quantity: 1, category: "draw" },
  { name: "Endless Atlas", quantity: 1, category: "draw" },
  { name: "Mystic Forge", quantity: 1, category: "draw" },
  { name: "Meteor Golem", quantity: 1, category: "removal" },
  { name: "Spine of Ish Sah", quantity: 1, category: "removal" },
  { name: "Scour from Existence", quantity: 1, category: "removal" },
  { name: "Nevinyrral's Disk", quantity: 1, category: "boardWipe" },
  { name: "Oblivion Stone", quantity: 1, category: "boardWipe" },
  { name: "Steel Hellkite", quantity: 1, category: "creature" },
  { name: "Wurmcoil Engine", quantity: 1, category: "creature" },
  { name: "Duplicant", quantity: 1, category: "creature" },
  { name: "Sundering Titan", quantity: 1, category: "creature" },
  { name: "Swiftfoot Boots", quantity: 1, category: "protection" },
  { name: "Lightning Greaves", quantity: 1, category: "protection" },
  { name: "Darksteel Plate", quantity: 1, category: "protection" },
  { name: "Sensei's Divining Top", quantity: 1, category: "other" },
  { name: "Commander's Plate", quantity: 1, category: "other" },
  { name: "Blackblade Reforged", quantity: 1, category: "other" },
  { name: "Sword of the Animist", quantity: 1, category: "other" },
];

/** Non-basic lands that add no colour identity of their own. */
const COLORLESS_LANDS: readonly AICard[] = [
  { name: "Command Tower", quantity: 1, category: "land" },
  { name: "Exotic Orchard", quantity: 1, category: "land" },
  { name: "Evolving Wilds", quantity: 1, category: "land" },
  { name: "Terramorphic Expanse", quantity: 1, category: "land" },
  { name: "Myriad Landscape", quantity: 1, category: "land" },
  { name: "Reliquary Tower", quantity: 1, category: "land" },
  { name: "Rogue's Passage", quantity: 1, category: "land" },
  { name: "Bonders' Enclave", quantity: 1, category: "land" },
];

const DECK_SIZE = 99;

/** Sorts the requested colours into canonical WUBRG order and drops duplicates. */
export function colorIdentityKey(colors: readonly BuildColor[]): string {
  const wanted = new Set(colors);
  const key = WUBRG.filter((c) => wanted.has(c)).join("");
  return key === "" ? "C" : key;
}

/** Spreads `count` basics as evenly as possible over `names`, biggest share first. */
function distributeBasics(names: readonly string[], count: number): AICard[] {
  if (names.length === 0 || count <= 0) return [];
  const base = Math.floor(count / names.length);
  const remainder = count % names.length;
  return names
    .map((name, index) => ({
      name,
      quantity: base + (index < remainder ? 1 : 0),
      category: "land",
    }))
    .filter((c) => c.quantity > 0);
}

export function mockDeck(req: BuildRequest): AIDeckResponse {
  const key = colorIdentityKey(req.colors);
  const fallback: string = MOCK_COMMANDERS.C;
  const commander =
    req.commanderName ??
    (key in MOCK_COMMANDERS
      ? MOCK_COMMANDERS[key as keyof typeof MOCK_COMMANDERS]
      : fallback);

  const basicNames =
    key === "C"
      ? ["Wastes"]
      : [...key].map((c) => BASIC_BY_COLOR[c as Exclude<BuildColor, "C">]);

  const fixed = [...COLORLESS_STAPLES, ...COLORLESS_LANDS];
  const fixedCount = fixed.reduce((sum, c) => sum + c.quantity, 0);
  const basics = distributeBasics(basicNames, DECK_SIZE - fixedCount);

  return { commander, partner: null, cards: [...fixed, ...basics] };
}
