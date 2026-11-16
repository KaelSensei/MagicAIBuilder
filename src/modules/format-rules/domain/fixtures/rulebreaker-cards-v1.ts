/**
 * The eight rulebreaker commanders as Scryfall sent them: the Oracle texts the
 * rulebreaker table (`../rulebreakers.ts`) is derived from.
 *
 * Recorded on 2026-11-16 (22:22 UTC) from
 * `GET https://api.scryfall.com/cards/search?q=o%3Arulebreaker&unique=cards&order=name`
 * with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`, one
 * request. Scryfall answered `total_cards: 8`, all from Mystery Booster Commander
 * Edition (`mbc`, released 2026-10-19), every one `legal` in Commander. Each card keeps
 * the fields `ScryfallCard` declares that the deck rules read, with Scryfall's values
 * and key order; `legalities` keeps `commander` and `brawl`. Nothing else was edited.
 *
 * Test data only: production code reads the table, never this file.
 *
 * @module format-rules/fixtures/rulebreaker-cards-v1
 */

/** One recorded rulebreaker card. */
export interface RecordedRulebreakerCard {
  readonly id: string;
  readonly oracle_id: string;
  readonly name: string;
  readonly layout: string;
  readonly mana_cost: string;
  readonly cmc: number;
  readonly type_line: string;
  readonly oracle_text: string;
  readonly color_identity: readonly string[];
  readonly legalities: { readonly commander: string; readonly brawl: string };
  readonly set: string;
  readonly released_at: string;
}

/** The eight cards Scryfall's `o:rulebreaker` returned, by name. */
export const RECORDED_RULEBREAKER_CARDS = {
  grizzlegom: {
    id: "9aa1869b-4a5a-4f95-8a45-7a671be1c127",
    oracle_id: "3f5db55a-8bae-4e97-86bd-f2a2dacf07a4",
    name: "Grizzlegom, Hurloon Hero",
    layout: "normal",
    mana_cost: "{5}{R}{G}",
    cmc: 7,
    type_line: "Legendary Creature — Minotaur Warrior",
    oracle_text:
      "Rulebreaker — A deck with this commander can have any land cards.\nWhenever Grizzlegom attacks, create a 1/1 white Soldier creature token for each Plains you control. Draw a card for each Island you control. Each opponent loses 1 life for each Swamp you control. Put a +1/+1 counter on Grizzlegom for each Mountain you control. You gain 1 life for each Forest you control.",
    color_identity: ["G", "R"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  maular: {
    id: "ac8d307f-5340-4419-95b4-b0ca09f9fd89",
    oracle_id: "214f4e0a-eba7-4a08-86b2-d490d6ae1048",
    name: "Maular, the Next Evolution",
    layout: "normal",
    mana_cost: "{5}{G}{G}",
    cmc: 7,
    type_line: "Legendary Creature — Dinosaur Mutant",
    oracle_text:
      "Rulebreaker — A deck with this commander can have creature cards with mana value 7 or greater of any color identity and any basic land cards.\nWhenever a creature you control with mana value 7 or greater attacks, double its power and toughness until end of turn.",
    color_identity: ["G"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  seluma: {
    id: "1eb501cc-0f83-40ca-8987-424bbee5f584",
    oracle_id: "dbbf6379-01b4-400d-a277-5887e6be1d0f",
    name: "Seluma, Light of Aysen",
    layout: "normal",
    mana_cost: "{4}{W}",
    cmc: 5,
    type_line: "Legendary Creature — Angel Warrior",
    oracle_text:
      "Rulebreaker — A deck with this commander can have Angel cards of any color identity and any basic land cards.\nFlying\nWhenever Seluma deals combat damage to a player, return target Angel creature card from your graveyard to the battlefield.",
    color_identity: ["W"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  everforger: {
    id: "1d1a4c67-630c-42de-b37c-1188451d4b20",
    oracle_id: "b8354ac6-5285-43dd-9ba5-93064def2e96",
    name: "The Everforger",
    layout: "normal",
    mana_cost: "{6}",
    cmc: 6,
    type_line: "Legendary Artifact Creature — Construct",
    oracle_text:
      "Rulebreaker — A deck with this commander can have artifact creature and Equipment cards of any color identity and any basic land cards.\nWhenever you cast an artifact creature or Equipment spell, you may copy that spell. Do this only once each turn. (The copy becomes a token.)",
    color_identity: [],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  unluckiestPlaneswalker: {
    id: "abaa08a6-62aa-4f2f-8be9-5950c2b32dc4",
    oracle_id: "c7ea2ce7-f684-44a2-94b2-d4aa7353f6fc",
    name: "The Unluckiest Planeswalker",
    layout: "normal",
    mana_cost: "{2}{R}",
    cmc: 3,
    type_line: "Legendary Planeswalker",
    oracle_text:
      "Rulebreaker — A deck with this commander can have Aura cards of any color identity and any basic land cards.\n+1: Add one mana of any color. When you spend this mana to cast an Aura spell this turn, create a 1/1 red Gremlin creature token.\n−3: Discard your hand, then draw cards equal to twice the number of Auras you control. For each Aura attached to you, attach it to an opponent of your choice.\nThe Unluckiest Planeswalker can be your commander.",
    color_identity: ["R"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  tolabow: {
    id: "f42c02c2-e3d8-4690-8a93-7c7a4c96bdd6",
    oracle_id: "56d71eda-4037-45fb-9e98-1725147af6fc",
    name: "Tolabow, Loch Rascal",
    layout: "normal",
    mana_cost: "{2}{U}{U}",
    cmc: 4,
    type_line: "Legendary Creature — Otter",
    oracle_text:
      "Rulebreaker — If Tolabow, Loch Rascal is your commander, the color identity of instant and sorcery cards in your deck can include one color of your choice not in your commander's color identity, and your deck can have any basic land cards.\nWhenever you cast an instant or sorcery spell, create a 1/1 blue and red Otter creature token with prowess. (Whenever you cast a noncreature spell, it gets +1/+1 until end of turn.)",
    color_identity: ["U"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  valko: {
    id: "a0b51fb8-6e5a-479d-aa3a-17cf603dd05c",
    oracle_id: "8023d419-8fd2-4b92-b6ea-f25fd67e6410",
    name: "Valko Indorian",
    layout: "normal",
    mana_cost: "{3}{B}",
    cmc: 4,
    type_line: "Legendary Creature — Human Wizard",
    oracle_text:
      "Rulebreaker — A deck with this commander can have Phyrexian cards of any color identity and any basic land cards.\nPhyrexian creatures you control have menace and lifelink.",
    color_identity: ["B"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
  whtz: {
    id: "726f8ac7-d7a3-442c-adb6-82836e4490a7",
    oracle_id: "73ba7ed0-0f08-4ba4-9f51-42c48f1b62ea",
    name: "Whtz, the Bibliophile",
    layout: "normal",
    mana_cost: "{1}{W}{U}",
    cmc: 3,
    type_line: "Legendary Creature — Homunculus",
    oracle_text:
      "Rulebreaker — A deck with this commander has no maximum deck size.\n{3}, {T}: You draw a card and gain 1 life. This ability costs {3} less to activate if you had 200 or more cards in your starting deck.",
    color_identity: ["U", "W"],
    legalities: { commander: "legal", brawl: "not_legal" },
    set: "mbc",
    released_at: "2026-10-19",
  },
} as const satisfies Readonly<Record<string, RecordedRulebreakerCard>>;
