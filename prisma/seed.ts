/**
 * Prisma seed — creates a demo Atraxa Superfriends deck (100 cards).
 * Run with: pnpm db:seed  OR  pnpm prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Card data ─────────────────────────────────────────────────────────────────

/** Minimal card record shape for the seed */
interface SeedCard {
  scryfallId: string;
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];
  category: string;
  quantity: number;
  isCommander: boolean;
  isPartner: boolean;
  imageUri: string;
  artCropUri: string;
}

function card(
  scryfallId: string,
  name: string,
  manaCost: string,
  cmc: number,
  typeLine: string,
  category: string,
  colorIdentity: string[],
  quantity = 1
): SeedCard {
  return {
    scryfallId,
    name,
    manaCost,
    cmc,
    typeLine,
    oracleText: "",
    colorIdentity,
    category,
    quantity,
    isCommander: false,
    isPartner: false,
    imageUri: `https://api.scryfall.com/cards/${scryfallId}?format=image&version=normal`,
    artCropUri: `https://api.scryfall.com/cards/${scryfallId}?format=image&version=art_crop`,
  };
}

const COMMANDER: SeedCard = {
  ...card(
    "d0a51b55-2a9b-4a17-b2e4-90bfe4d4f4d5",
    "Atraxa, Praetors' Voice",
    "{G}{W}{U}{B}",
    4,
    "Legendary Creature — Phyrexian Angel Horror",
    "commander",
    ["B", "G", "U", "W"]
  ),
  isCommander: true,
  oracleText:
    "Flying, vigilance, deathtouch, lifelink. At the beginning of your end step, proliferate.",
};

/** 99 non-commander cards */
const CARDS: SeedCard[] = [
  // Planeswalkers (20)
  card("5a7a212a-a312-4f6e-9040-b93a6f94d11b", "Ajani Steadfast", "{3}{W}", 4, "Legendary Planeswalker — Ajani", "planeswalker", ["W"]),
  card("0f63ddb1-f56c-4be8-8ad9-7571aa527ba8", "Ashiok, Dream Render", "{1}{U/B}", 2, "Legendary Planeswalker — Ashiok", "planeswalker", ["B", "U"]),
  card("bc4e7e23-f3c4-4c14-bd9e-4b89bfb9c0e3", "Elspeth Resplendent", "{3}{W}{W}", 5, "Legendary Planeswalker — Elspeth", "planeswalker", ["W"]),
  card("d5416b26-f72b-4ef1-88d0-3da8a64db37d", "Garruk Wildspeaker", "{2}{G}{G}", 4, "Legendary Planeswalker — Garruk", "planeswalker", ["G"]),
  card("15a2951a-9bdb-4caf-b0e6-f3f9d0e6f43c", "Jace, the Mind Sculptor", "{2}{U}{U}", 4, "Legendary Planeswalker — Jace", "planeswalker", ["U"]),
  card("04acd50f-a4d7-4cae-80c7-2e2dc18ab7f2", "Liliana of the Veil", "{1}{B}{B}", 3, "Legendary Planeswalker — Liliana", "planeswalker", ["B"]),
  card("8d994f5e-fb2f-45b4-aa25-f64c6d13c84d", "Nissa, Who Shakes the World", "{3}{G}{G}", 5, "Legendary Planeswalker — Nissa", "planeswalker", ["G"]),
  card("0d8f1e7b-6b4a-4f14-84e5-0e2c02d3d3f6", "Oko, Thief of Crowns", "{1}{G}{U}", 3, "Legendary Planeswalker — Oko", "planeswalker", ["G", "U"]),
  card("9a3e7b22-cc3a-4b57-bbc5-c9d3efbe7a5c", "Teferi, Hero of Dominaria", "{3}{W}{U}", 5, "Legendary Planeswalker — Teferi", "planeswalker", ["U", "W"]),
  card("b5247c59-de72-4eb0-9cbc-f0f11d53b8e0", "Tamiyo, the Moon Sage", "{3}{U}{U}", 5, "Legendary Planeswalker — Tamiyo", "planeswalker", ["U"]),
  card("c64628e1-7e4e-4fd9-a98b-52ab4d69b06a", "Ugin, the Spirit Dragon", "{8}", 8, "Legendary Planeswalker — Ugin", "planeswalker", []),
  card("1b77e25c-2a37-4ad7-ab55-4ddb09f20f2d", "Vraska, Relic Seeker", "{4}{B}{G}", 6, "Legendary Planeswalker — Vraska", "planeswalker", ["B", "G"]),
  card("cc7ab0ec-9027-498e-8e4e-e6be59a04574", "Vivien, Monsters' Advocate", "{3}{G}{G}", 5, "Legendary Planeswalker — Vivien", "planeswalker", ["G"]),
  card("4f9c75cd-fb2a-4def-896b-b9f50e0e8867", "Sorin, Lord of Innistrad", "{2}{W}{B}", 4, "Legendary Planeswalker — Sorin", "planeswalker", ["B", "W"]),
  card("5e631bbc-d7d5-411a-a48a-a7bbb38a5aaa", "Sarkhan Unbroken", "{2}{G}{U}{R}", 5, "Legendary Planeswalker — Sarkhan", "planeswalker", ["G", "R", "U"]),
  card("76e45d4a-68e7-40a5-9b80-e6f0b41b39fe", "Narset, Parter of Veils", "{1}{W}{U}", 3, "Legendary Planeswalker — Narset", "planeswalker", ["U", "W"]),
  card("0b3a7b15-6f8f-4c4b-a62e-73c6af7bf61b", "Liliana, Dreadhorde General", "{4}{B}{B}", 6, "Legendary Planeswalker — Liliana", "planeswalker", ["B"]),
  card("4e29db45-c0ef-45c7-a1d8-8f4c8e3e3a09", "Jace, Architect of Thought", "{2}{U}{U}", 4, "Legendary Planeswalker — Jace", "planeswalker", ["U"]),
  card("8c3a9f2b-7e45-4f60-b5c3-9d8e7a2b1c0d", "Garruk, Primal Hunter", "{2}{G}{G}{G}", 5, "Legendary Planeswalker — Garruk", "planeswalker", ["G"]),
  card("3f7a4c8e-9b2d-4e51-a6c0-1d3f8b7e4a92", "Elspeth, Sun's Champion", "{4}{W}{W}", 6, "Legendary Planeswalker — Elspeth", "planeswalker", ["W"]),
  // Ramp (10)
  card("a9d7e523-bf3c-4ed4-b6a8-5e2f1d0c9b47", "Sol Ring", "{1}", 1, "Artifact", "artifact", []),
  card("4b8d3f2a-7c61-4e5a-90b8-3e7f2a1d6c59", "Arcane Signet", "{2}", 2, "Artifact", "artifact", []),
  card("2c9e8b17-5f43-4d72-a6e1-0b4c7f3a9d82", "Cultivate", "{2}{G}", 3, "Sorcery", "sorcery", ["G"]),
  card("7e3b1f9d-4a68-4c51-83d7-2e5f0b6c8a34", "Kodama's Reach", "{2}{G}", 3, "Sorcery — Arcane", "sorcery", ["G"]),
  card("1a7c4e8f-3b92-4d60-a5b3-9e2d0f7c6b41", "Farseek", "{1}{G}", 2, "Sorcery", "sorcery", ["G"]),
  card("6d9b2e4c-8f17-4a53-b7e0-3c1f5a9d8b26", "Chromatic Lantern", "{3}", 3, "Artifact", "artifact", []),
  card("3f1c7a9e-5b84-4d62-a0c8-7e2b4f8d3a61", "Aura of Silence", "{1}{W}{W}", 3, "Enchantment", "enchantment", ["W"]),
  card("8b4e2f6a-9c31-4d57-b0e3-5f1a7c8b4e92", "Smothering Tithe", "{3}{W}", 4, "Enchantment", "enchantment", ["W"]),
  card("5c9e1b7f-3a84-4d62-80c7-2e4f6a9c3b18", "Teferi's Ageless Insight", "{2}{U}{U}", 4, "Legendary Enchantment", "enchantment", ["U"]),
  card("0e7b3d9c-6f42-4a58-b1e4-8c2f5a0b7d93", "The Great Henge", "{7}{G}{G}", 9, "Legendary Artifact", "artifact", ["G"]),
  // Card draw (8)
  card("4a2f8c6b-9e31-4d57-a0b3-5c1f7e4a8b26", "Rhystic Study", "{2}{U}", 3, "Enchantment", "enchantment", ["U"]),
  card("7c3b9f1e-5a84-4d62-b0c8-2e6f4a7c9b31", "Phyrexian Arena", "{1}{B}{B}", 3, "Enchantment", "enchantment", ["B"]),
  card("1b8e4c7f-3a96-4d50-80b7-5e2f9a1c8b43", "Sylvan Library", "{1}{G}", 2, "Enchantment", "enchantment", ["G"]),
  card("6f2c4a9e-8b37-4d61-b0e3-3c5f1a7e6b29", "Brainstorm", "{U}", 1, "Instant", "instant", ["U"]),
  card("3e7b1f9c-5a64-4d72-80c8-2e4f6a9c3b57", "Ponder", "{U}", 1, "Sorcery", "sorcery", ["U"]),
  card("9a4c2f8e-7b31-4d59-a0b6-5e1f3c7a9b42", "Preordain", "{U}", 1, "Sorcery", "sorcery", ["U"]),
  card("2d6f4c8a-9e13-4b57-80b0-3e7a5f2d8c61", "Fact or Fiction", "{3}{U}", 4, "Instant", "instant", ["U"]),
  card("8c1e7b3f-5a94-4d62-b0c8-4e2f6a0c9b37", "Consecrated Sphinx", "{4}{U}{U}", 6, "Creature — Sphinx", "creature", ["U"]),
  // Removal (10)
  card("5b9e3c7f-1a84-4d62-80b0-6e2f4a5c9b38", "Swords to Plowshares", "{W}", 1, "Instant", "instant", ["W"]),
  card("3f7c9a1e-5b84-4d62-b0c8-2e6f0a3c7b49", "Path to Exile", "{W}", 1, "Instant", "instant", ["W"]),
  card("7a2e4c8f-9b13-4d57-a0b6-3e5f1c7a4b82", "Generous Gift", "{2}{W}", 3, "Instant", "instant", ["W"]),
  card("1c4f8a2e-7b93-4d61-80b0-5e3f9a1c4b76", "Cyclonic Rift", "{1}{U}", 2, "Instant", "instant", ["U"]),
  card("6b2e4f8c-9a37-4d60-a0b3-3e5f7c2a9b41", "Counterspell", "{U}{U}", 2, "Instant", "instant", ["U"]),
  card("4a7e1c9f-3b84-4d62-80b6-2e5f0a4c7b93", "Negate", "{1}{U}", 2, "Instant", "instant", ["U"]),
  card("9b3f2c8e-7a14-4d57-a0b0-5e1f4c9a8b32", "Assassin's Trophy", "{B}{G}", 2, "Instant", "instant", ["B", "G"]),
  card("2e8f4c6a-9b71-4d59-80b3-3e5f1a0c4b97", "Abrupt Decay", "{B}{G}", 2, "Instant", "instant", ["B", "G"]),
  card("7c1f3a9e-5b84-4d62-b0b8-4e2f6c0a7b53", "Toxic Deluge", "{2}{B}", 3, "Sorcery", "sorcery", ["B"]),
  card("3a6e8f2c-9b14-4d57-80b6-5e3f7c1a2b94", "Wrath of God", "{2}{W}{W}", 4, "Sorcery", "sorcery", ["W"]),
  // Proliferate synergies (8)
  card("5b1e7c3f-9a84-4d62-a0b0-2e4f8c5a9b71", "Inexorable Tide", "{3}{U}{U}", 5, "Enchantment", "enchantment", ["U"]),
  card("8f2c4a6e-7b93-4d61-80b3-3e5f1c8a4b02", "Contagion Engine", "{6}", 6, "Artifact", "artifact", []),
  card("1c9e3f7a-5b84-4d62-b0b8-6e2f4a1c9b37", "Contagion Clasp", "{2}", 2, "Artifact", "artifact", []),
  card("4b7f1e9c-3a84-4d62-80b6-5e2f6c0a7b93", "Viral Drake", "{4}{U}", 5, "Creature — Drake", "creature", ["U"]),
  card("9e2c4a8f-7b13-4d57-a0b0-3e5f1c9a6b42", "Evolution Sage", "{2}{G}", 3, "Creature — Elf Druid", "creature", ["G"]),
  card("2f6c8a4e-9b71-4d59-80b3-4e3f5c0a2b97", "Flux Channeler", "{2}{U}", 3, "Creature — Human Wizard", "creature", ["U"]),
  card("7a3e1f9c-5b84-4d62-b0b8-2e4f6a7c1b53", "Grateful Apparition", "{1}{W}", 2, "Creature — Spirit", "creature", ["W"]),
  card("0b4f2c8e-9a73-4d61-80b6-5e1f3c4a0b97", "Sword of Truth and Justice", "{3}", 3, "Artifact — Equipment", "artifact", []),
  // Utility creatures (6)
  card("5c1e7a3f-9b84-4d62-a0b0-2e4f8c5a9b71", "Deepglow Skate", "{4}{U}", 5, "Creature — Fish", "creature", ["U"]),
  card("8e2c4f6a-7b93-4d61-80b3-3e5f1a8c4b02", "Woodfall Primus", "{5}{G}{G}{G}", 8, "Creature — Treefolk Shaman", "creature", ["G"]),
  card("1a9c3f7e-5b84-4d62-b0b8-6e2f4c1a9b37", "Sun Titan", "{3}{W}{W}{W}", 6, "Creature — Giant", "creature", ["W"]),
  card("4f7b1e9c-3a84-4d62-80b6-5e2f6a0c7b93", "Vorinclex, Monstrous Raider", "{4}{G}{G}", 6, "Legendary Creature — Phyrexian Praetor", "creature", ["G"]),
  card("9b2e4c8f-7a13-4d57-a0b0-3e5f1c9a6b42", "Jin-Gitaxias, Core Augur", "{8}{U}", 9, "Legendary Creature — Phyrexian Praetor", "creature", ["U"]),
  card("2f6b8a4c-9e71-4d59-80b3-4e3f5a0b2c97", "Sheoldred, Whispering One", "{5}{B}{B}", 7, "Legendary Creature — Phyrexian Praetor", "creature", ["B"]),
  // Lands (37)
  card("bc71ebf6-2056-41f7-be35-b2e5c7f413d2", "Command Tower", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("c4bbf1a3-ad42-4bef-9cfe-6f03d3d1ac18", "Breeding Pool", "", 0, "Land — Forest Island", "land", ["G", "U"]),
  card("f7aa5f36-e37c-4b6a-ab60-92d0d839f3e5", "Watery Grave", "", 0, "Land — Island Swamp", "land", ["B", "U"]),
  card("d3ee0c88-0e4f-4b4d-96e5-a0d1b31fcf7c", "Temple Garden", "", 0, "Land — Forest Plains", "land", ["G", "W"]),
  card("aa52d30a-4b5c-4213-a559-4a4af1a0ad5e", "Godless Shrine", "", 0, "Land — Plains Swamp", "land", ["B", "W"]),
  card("fbe88ed6-7a9b-4f47-9f0d-0bef8cc9d30b", "Overgrown Tomb", "", 0, "Land — Forest Swamp", "land", ["B", "G"]),
  card("1c45ce38-b4f4-42f0-ab0e-dd7e2b8c8cc7", "Hallowed Fountain", "", 0, "Land — Plains Island", "land", ["U", "W"]),
  card("a00be91d-c3ed-4f5d-b012-7a6f28ff5cf0", "Polluted Delta", "", 0, "Land", "land", ["B", "U"]),
  card("a6b6e7bc-c374-45c3-b9b9-3c3ec10bf4e7", "Windswept Heath", "", 0, "Land", "land", ["G", "W"]),
  card("70e2f4f9-9219-47d3-aa48-54e94cd2f72c", "Misty Rainforest", "", 0, "Land", "land", ["G", "U"]),
  card("7bf9a1a2-2f98-47af-ab4e-2cd47c1e9fdb", "Verdant Catacombs", "", 0, "Land", "land", ["B", "G"]),
  card("a4cfe82b-7df2-4df8-8ce5-96c617e6c429", "Marsh Flats", "", 0, "Land", "land", ["B", "W"]),
  card("3fa9d3ef-8498-46b5-9e7b-43b84dba40d9", "Flooded Strand", "", 0, "Land", "land", ["U", "W"]),
  card("38d4b4e5-85c4-4abb-9c91-37d64f03d4b7", "Underground Sea", "", 0, "Land — Island Swamp", "land", ["B", "U"]),
  card("8a3b2091-4a5e-43d2-a4a0-25ede09bb0ff", "Tropical Island", "", 0, "Land — Forest Island", "land", ["G", "U"]),
  card("1a4e59ba-c38e-4f35-9e92-1d19ca6b5e7d", "Savannah", "", 0, "Land — Forest Plains", "land", ["G", "W"]),
  card("a3cfbf14-a879-4a45-9c95-f3e1fbd68f63", "Scrubland", "", 0, "Land — Plains Swamp", "land", ["B", "W"]),
  card("3e9f1a6b-5c84-4d62-80b2-7e2f4a0c9b38", "Bayou", "", 0, "Land — Forest Swamp", "land", ["B", "G"]),
  card("7a2f4c8e-9b13-4d57-a0b0-3e5f1c7a4b82", "Tundra", "", 0, "Land — Plains Island", "land", ["U", "W"]),
  card("4b9e2f6c-8a37-4d60-a0b3-1e5f7c4a9b21", "Arid Mesa", "", 0, "Land", "land", ["G", "W"]),
  card("8f1c3a7e-5b84-4d62-b0b8-4e2f6c8a1b53", "Exotic Orchard", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("2c7e4f8a-9b31-4d57-80b6-5e3f1a0c2b94", "Reflecting Pool", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("9b4e1f7c-3a84-4d62-b0b0-6e2f5c9a4b37", "City of Brass", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("5f2c8a4e-7b93-4d61-80b3-3e1f4c5a8b02", "Mana Confluence", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("1e7c3f9a-5b84-4d62-a0b8-2e4f6c1a9b71", "Evolving Wilds", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("6a4c2f8e-9b17-4d59-80b0-3e5f7a6c4b92", "Terramorphic Expanse", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("3c9b7e1f-5a84-4d62-b0b8-4e2f0c3a9b57", "Path of Ancestry", "", 0, "Land", "land", ["B", "G", "U", "W"]),
  card("8a5e3c7f-1b84-4d62-80b6-6e2f4c8a5b71", "Arcane Sanctum", "", 0, "Land", "land", ["B", "U", "W"]),
  card("2f4c8a6e-9b31-4d57-a0b0-3e5f1c2a4b97", "Murmuring Bosk", "", 0, "Land — Forest", "land", ["G", "W"]),
  card("7b1e3f9c-5a84-4d62-b0b8-4e2f6a7b1c53", "Forest", "", 0, "Basic Land — Forest", "land", ["G"], 4),
  card("1c4f8a2e-7b93-4d61-80b0-5e3f9a1c4b76", "Island", "", 0, "Basic Land — Island", "land", ["U"], 4),
  card("6b2e4f8c-9a37-4d60-a0b3-3e5f7c2a9b41", "Swamp", "", 0, "Basic Land — Swamp", "land", ["B"], 3),
  card("4a7e1c9f-3b84-4d62-80b6-2e5f0a4c7b93", "Plains", "", 0, "Basic Land — Plains", "land", ["W"], 3),
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding demo Atraxa Superfriends deck…");

  // Wipe existing demo deck if present
  await prisma.deck.deleteMany({ where: { name: "Atraxa Superfriends (Demo)" } });

  const deck = await prisma.deck.create({
    data: {
      name: "Atraxa Superfriends (Demo)",
      format: "commander",
      targetBracket: 3,
      pairingType: "none",
      description:
        "A demo Atraxa Superfriends deck featuring 20 planeswalkers and proliferate synergies. Generated by pnpm db:seed.",
      tags: ["superfriends", "proliferate", "demo"],
      cards: {
        create: [
          {
            ...COMMANDER,
            zone: "main",
          },
          ...CARDS.map((c) => ({ ...c, zone: "main" })),
        ],
      },
    },
  });

  const totalCards = CARDS.reduce((s, c) => s + c.quantity, 0) + 1; // +1 commander
  console.log(`✅ Created deck "${deck.name}" with ${totalCards} cards (id: ${deck.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
