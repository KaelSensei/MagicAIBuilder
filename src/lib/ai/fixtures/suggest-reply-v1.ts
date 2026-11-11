/**
 * A model's answer to the suggestion prompt for `TALRAND_SUGGEST_REQUEST`, and
 * the Scryfall card data the route reads to attach evidence to it.
 *
 * Hand-written in the JSON shape the suggest prompt asks for (approved in
 * `app/api/ai/suggest/__prompts__/commander-only.txt`); no model was called.
 * It carries the mistakes a real reply makes, so the golden streams pin what
 * the route does with them today:
 * - Thousand-Year Storm is blue-red, outside the deck's mono-blue identity;
 * - "Lorien Revealed" drops the accent of Lórien Revealed;
 * - "Talrand's Insight" is not a card;
 * - the removal "Opt" names a card the deck does not hold.
 *
 * The card data is trimmed to the fields evidence reads (mana value, colour
 * identity, Commander legality, price). Prices are illustrative, not recorded.
 */
import type { ScryfallCard } from "@/lib/scryfall/types";

/** The reply object, in the order the model wrote it. */
export const SUGGEST_REPLY_V1 = {
  analysis:
    "Talrand wants a dense stream of cheap instants and sorceries, and the list already has strong cantrips and two premium draw engines. It is short on counter-magic that protects Talrand, has almost no lands, and needs a way to turn a board of Drakes into a win.",
  suggestions: [
    {
      name: "Archmage Emeritus",
      reason:
        "A second Talrand-style engine: every instant or sorcery draws a card, so the deck refuels while it builds Drakes.",
      category: "draw",
      priority: "high",
    },
    {
      name: "Fierce Guardianship",
      reason:
        "A free counterspell while Talrand is on the battlefield, which protects the engine on the turn it lands.",
      category: "protection",
      priority: "high",
      alternatives: [
        {
          name: "Dispel",
          reason:
            "One blue mana for the same protection against removal spells.",
          dimension: "budget",
        },
        {
          name: "Force of Will",
          reason: "Counters anything, at any time, without mana.",
          dimension: "power",
        },
        {
          name: "Narset's Reversal",
          reason: "Copies the removal spell back at the opponent's board.",
          dimension: "playstyle",
        },
      ],
    },
    {
      name: "Swan Song",
      reason:
        "One mana to stop a removal spell or a board wipe aimed at the Drakes.",
      category: "protection",
      priority: "high",
    },
    {
      name: "Mystic Sanctuary",
      reason:
        "A land that returns a spent instant or sorcery once the Islands are down.",
      category: "land",
      priority: "medium",
    },
    {
      name: "Mind Stone",
      reason: "Ramp that cycles away when the deck no longer needs mana.",
      category: "ramp",
      priority: "medium",
    },
    {
      name: "Thousand-Year Storm",
      reason:
        "Copies every later spell, so each one makes several Drakes with Talrand.",
      category: "winCondition",
      priority: "medium",
    },
    {
      name: "Lorien Revealed",
      reason: "Three cards now, or a cycled land search when the hand is full.",
      category: "draw",
      priority: "low",
    },
    {
      name: "Talrand's Insight",
      reason: "Scry and draw at instant speed to keep the spell count up.",
      category: "draw",
      priority: "low",
    },
  ],
  removals: [
    {
      name: "Arcane Signet",
      reason:
        "In a mono-blue deck Mind Stone does the same job and cycles later.",
    },
    {
      name: "Murmuring Mystic",
      reason:
        "A third payoff the deck cannot protect; the slot is better spent on protection.",
    },
    {
      name: "Mystic Remora",
      reason: "Its upkeep cost slows the deck down in long games at bracket 3.",
    },
    {
      name: "Opt",
      reason:
        "The weakest cantrip once Brainstorm, Ponder and Preordain are in.",
    },
  ],
} as const;

/** The reply as the model's text: pretty-printed JSON, without a markdown fence. */
export const SUGGEST_REPLY_TEXT_V1 = JSON.stringify(SUGGEST_REPLY_V1, null, 2);

/** Builds one trimmed card; `id` comes from the name so lookups stay stable. */
function card(
  name: string,
  cmc: number,
  typeLine: string,
  colorIdentity: readonly string[],
  priceUsd: string | null
): ScryfallCard {
  return {
    id: name.toLowerCase().replaceAll(/\W+/g, "-"),
    name,
    cmc,
    type_line: typeLine,
    color_identity: [...colorIdentity],
    legalities: { commander: "legal" },
    prices: { usd: priceUsd },
  };
}

/**
 * Card data for the reply's suggestions and alternatives, and for the
 * built-in suggestions the route answers with when no provider is set.
 * "Talrand's Insight" is absent because no such card exists.
 */
export const SUGGEST_REPLY_CARDS_V1: readonly ScryfallCard[] = [
  card("Archmage Emeritus", 4, "Creature — Human Wizard", ["U"], "0.89"),
  card("Fierce Guardianship", 3, "Instant", ["U"], "38.50"),
  card("Dispel", 1, "Instant", ["U"], "0.45"),
  card("Force of Will", 5, "Instant", ["U"], "79.99"),
  card("Narset's Reversal", 2, "Instant", ["U"], "1.20"),
  card("Swan Song", 1, "Instant", ["U"], "9.80"),
  card("Mystic Sanctuary", 0, "Land — Island", ["U"], "0.70"),
  card("Mind Stone", 2, "Artifact", [], "0.35"),
  card("Thousand-Year Storm", 6, "Enchantment", ["U", "R"], "2.10"),
  card("Lórien Revealed", 5, "Sorcery", ["U"], "0.60"),
  card("Command Tower", 0, "Land", [], "0.25"),
  card("Swords to Plowshares", 1, "Instant", ["W"], "1.95"),
  card("Swiftfoot Boots", 2, "Artifact — Equipment", [], null),
  card("Cultivate", 3, "Sorcery", ["G"], "0.40"),
];
