/**
 * Scryfall's Game Changer status on its collection answer, recorded from the live API.
 *
 * Recorded on 2026-11-19 (17:22 UTC) from `POST https://api.scryfall.com/cards/collection` with
 * the identifiers, in order: Grand Arbiter Augustin IV, Rhystic Study, Cyclonic Rift, Force of
 * Will, Fierce Guardianship, Thassa's Oracle, Mystic Remora. `not_found` was empty.
 *
 * Every card keeps the fields the generated-deck check reads (`id`, `name`, `mana_cost`, `cmc`,
 * `type_line`, `oracle_text`, `color_identity`, `keywords`, `legalities.commander`) and
 * `game_changer`, with the values Scryfall sent. Nothing else was edited.
 *
 * What the recording shows: every card object carries a boolean `game_changer`, `true` for a card
 * on the official Game Changers list and `false` otherwise (Mystic Remora is `false` that day).
 * A legendary creature can be one, so the command zone can hold a Game Changer (Grand Arbiter
 * Augustin IV).
 *
 * @module scryfall/fixtures/game-changers-v1
 */
import type { ScryfallCard } from "@/lib/scryfall/types";

const LEGAL = { commander: "legal" };

/** A legendary creature on the Game Changers list, so a commander that counts toward the limit. */
export const GRAND_ARBITER_AUGUSTIN_IV: ScryfallCard = {
  id: "f43748ea-1d65-4ee8-9c66-221412a284c0",
  name: "Grand Arbiter Augustin IV",
  mana_cost: "{2}{W}{U}",
  cmc: 4,
  type_line: "Legendary Creature — Human Advisor",
  oracle_text:
    "White spells you cast cost {1} less to cast.\nBlue spells you cast cost {1} less to cast.\nSpells your opponents cast cost {1} more to cast.",
  color_identity: ["U", "W"],
  keywords: [],
  legalities: LEGAL,
  game_changer: true,
};

/** Five blue Game Changers, in the order they were requested. */
export const BLUE_GAME_CHANGERS: readonly ScryfallCard[] = [
  {
    id: "9f37c5b6-a59c-45cd-9a99-e9357fe9ea1b",
    name: "Rhystic Study",
    mana_cost: "{2}{U}",
    cmc: 3,
    type_line: "Enchantment",
    oracle_text:
      "Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.",
    color_identity: ["U"],
    keywords: [],
    legalities: LEGAL,
    game_changer: true,
  },
  {
    id: "dfb7c4b9-f2f4-4d4e-baf2-86551c8150fe",
    name: "Cyclonic Rift",
    mana_cost: "{1}{U}",
    cmc: 2,
    type_line: "Instant",
    oracle_text:
      'Return target nonland permanent you don\'t control to its owner\'s hand.\nOverload {6}{U} (You may cast this spell for its overload cost. If you do, change "target" in its text to "each.")',
    color_identity: ["U"],
    keywords: ["Overload"],
    legalities: LEGAL,
    game_changer: true,
  },
  {
    id: "89f612d6-7c59-4a7b-a87d-45f789e88ba5",
    name: "Force of Will",
    mana_cost: "{3}{U}{U}",
    cmc: 5,
    type_line: "Instant",
    oracle_text:
      "You may pay 1 life and exile a blue card from your hand rather than pay this spell's mana cost.\nCounter target spell.",
    color_identity: ["U"],
    keywords: [],
    legalities: LEGAL,
    game_changer: true,
  },
  {
    id: "f7f3dd95-bd14-4e0f-a388-444f9cf1b0dc",
    name: "Fierce Guardianship",
    mana_cost: "{2}{U}",
    cmc: 3,
    type_line: "Instant",
    oracle_text:
      "If you control a commander, you may cast this spell without paying its mana cost.\nCounter target noncreature spell.",
    color_identity: ["U"],
    keywords: [],
    legalities: LEGAL,
    game_changer: true,
  },
  {
    id: "726e8b29-13e9-4138-b6a9-d2a0d8188d1c",
    name: "Thassa's Oracle",
    mana_cost: "{U}{U}",
    cmc: 2,
    type_line: "Creature — Merfolk Wizard",
    oracle_text:
      "When this creature enters, look at the top X cards of your library, where X is your devotion to blue. Put up to one of them on top of your library and the rest on the bottom of your library in a random order. If X is greater than or equal to the number of cards in your library, you win the game. (Each {U} in the mana costs of permanents you control counts toward your devotion to blue.)",
    color_identity: ["U"],
    keywords: [],
    legalities: LEGAL,
    game_changer: true,
  },
];

/** A blue card that is not a Game Changer on the recording day. */
export const MYSTIC_REMORA: ScryfallCard = {
  id: "40140991-cffa-4b52-9a25-37e9a8aa9ddd",
  name: "Mystic Remora",
  mana_cost: "{U}",
  cmc: 1,
  type_line: "Enchantment",
  oracle_text:
    "Cumulative upkeep {1} (At the beginning of your upkeep, put an age counter on this permanent, then sacrifice it unless you pay its upkeep cost for each age counter on it.)\nWhenever an opponent casts a noncreature spell, you may draw a card unless that player pays {4}.",
  color_identity: ["U"],
  keywords: ["Cumulative upkeep"],
  legalities: LEGAL,
  game_changer: false,
};
