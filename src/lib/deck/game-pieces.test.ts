import { describe, expect, it } from "vitest";

import { aDeckCard } from "@/test/builders/card";

import { gamePiecesOf, type GamePieceKind } from "./game-pieces";

function cardNamed(name: string, oracleText: string) {
  return aDeckCard({ id: name, scryfallId: name, name, oracleText });
}

/** Oracle texts as Scryfall serves them, flavour text excluded. */
const PALACE_JAILER = cardNamed(
  "Palace Jailer",
  "When Palace Jailer enters, you become the monarch.\nWhen Palace Jailer enters, exile target creature an opponent controls until an opponent becomes the monarch."
);
const QUEEN_MARCHESA = cardNamed(
  "Queen Marchesa",
  "Deathtouch, haste\nWhen Queen Marchesa enters, you become the monarch.\nAt the beginning of your upkeep, if an opponent is the monarch, create a 1/1 black Assassin creature token with deathtouch and haste."
);
const MIZZIX = cardNamed(
  "Mizzix, Mizzium Master",
  "Whenever you cast an instant or sorcery spell with mana value greater than the number of experience counters you have, you get an experience counter.\nSpells you cast cost {1} less to cast for each experience counter you have."
);

describe("gamePiecesOf", () => {
  it("Palace Jailer needs the monarch (CR 725)", () => {
    expect(gamePiecesOf([PALACE_JAILER])).toEqual([
      { kind: "monarch", cardNames: ["Palace Jailer"] },
    ]);
  });

  it.each<readonly [GamePieceKind, string, string]>([
    [
      "monarch",
      "Custodi Herald",
      "When this creature enters, target opponent becomes the monarch.",
    ],
    [
      "initiative",
      "Seasoned Dungeoneer",
      "When Seasoned Dungeoneer enters, you take the initiative.\nWhenever you attack, target attacking Cleric, Rogue, Warrior, or Wizard gains protection from creatures until end of turn. It explores.",
    ],
    [
      "dungeon",
      "Nadaar, Selfless Paladin",
      "Vigilance\nWhenever Nadaar, Selfless Paladin enters or attacks, venture into the dungeon. (Enter the first room or advance to the next room.)\nOther creatures you control get +1/+1 as long as you've completed a dungeon.",
    ],
    [
      "dungeon",
      "Gloom Stalker",
      "As long as you've completed a dungeon, Gloom Stalker has double strike.",
    ],
    [
      "ring",
      "Call of the Ring",
      "At the beginning of your upkeep, the Ring tempts you.\nWhenever you choose a creature as your Ring-bearer, you may pay 2 life. If you do, draw a card.",
    ],
    [
      "dayNight",
      "Celestus",
      "{T}: Add one mana of any color.\n{3}, {T}: If it's night, it becomes day. Otherwise, it becomes night. Activate only as a sorcery.",
    ],
    [
      "dayNight",
      "Brutal Cathar",
      "When this creature enters or transforms into Brutal Cathar, exile target creature an opponent controls until this creature leaves the battlefield.\nDaybound (If a player casts no spells during their own turn, it becomes night next turn.)",
    ],
    [
      "citysBlessing",
      "Wayward Swordtooth",
      "Ascend (If you control ten or more permanents, you get the city's blessing for the rest of the game.)\nYou may play an additional land on each of your turns.\nWayward Swordtooth can't attack or block unless you have the city's blessing.",
    ],
    [
      "energy",
      "Aetherworks Marvel",
      "Whenever a permanent you control is put into a graveyard, you get {E} (an energy counter).\n{T}, Pay {E}{E}{E}{E}{E}{E}: Look at the top six cards of your library. You may cast a spell from among them without paying its mana cost.",
    ],
    ["experience", "Mizzix, Mizzium Master", MIZZIX.oracleText],
    [
      "poison",
      "Vraska's Fall",
      "Each opponent sacrifices a creature or planeswalker and gets two poison counters.",
    ],
    [
      "poison",
      "Blighted Agent",
      "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\nBlighted Agent can't be blocked.",
    ],
    [
      "poison",
      "Bloated Contaminator",
      "Trample\nToxic 1 (Players dealt combat damage by this creature also get a poison counter.)\nWhenever this creature deals combat damage to a player, proliferate.",
    ],
  ])("lists %s for %s", (kind, name, oracleText) => {
    expect(gamePiecesOf([cardNamed(name, oracleText)])).toEqual([
      { kind, cardNames: [name] },
    ]);
  });

  it.each<readonly [string, string, string]>([
    [
      "the monarch named in reminder text only",
      "Reminder Herald",
      "Flying (The monarch draws a card at the beginning of their end step.)",
    ],
    [
      "the initiative named in reminder text only",
      "Reminder Scout",
      "Haste (Whenever one or more creatures a player controls deal combat damage to you, that player takes the initiative.)",
    ],
    [
      "a dungeon in a card's name",
      "Dungeon Geists",
      "Flying\nWhen Dungeon Geists enters, tap target creature an opponent controls. That creature doesn't untap during its controller's untap step for as long as you control Dungeon Geists.",
    ],
    [
      "a ring that never tempts",
      "The One Ring",
      "Indestructible\nWhen The One Ring enters, if you cast it, you gain protection from everything until your next turn.\nAt the beginning of your upkeep, you lose 1 life for each burden counter on The One Ring.\n{T}: Put a burden counter on The One Ring, then draw a card for each burden counter on The One Ring.",
    ],
    [
      "night in a card's name",
      "Midnight Clock",
      "{T}: Add {U}.\n{2}{U}: Put a glimpse counter on Midnight Clock.\nAt the beginning of each upkeep, put a glimpse counter on Midnight Clock.",
    ],
    [
      "a word that starts with ascend",
      "Ascendant Packleader",
      "Ascendant Packleader enters with a +1/+1 counter on it if you control a permanent with mana value 4 or greater.",
    ],
    [
      "energy without the energy symbol",
      "Energy Field",
      "Prevent all damage that would be dealt to you by sources you don't control.\nWhen a card is put into your graveyard from anywhere, sacrifice Energy Field.",
    ],
    [
      "a word that starts with experi",
      "Experiment One",
      "Evolve (Whenever a creature you control enters, if that creature has greater power or toughness than this creature, put a +1/+1 counter on this creature.)\nRemove two +1/+1 counters from Experiment One: Regenerate Experiment One.",
    ],
    [
      "poison without a poison counter",
      "Poison the Well",
      "Destroy target land. Poison the Well deals 2 damage to that land's controller.",
    ],
  ])("lists no piece for %s", (_case, name, oracleText) => {
    expect(gamePiecesOf([cardNamed(name, oracleText)])).toEqual([]);
  });

  describe("reading past reminder text (CR 207.2a; pinned before the S8786 rewrite)", () => {
    it.each<readonly [string, string, readonly GamePieceKind[]]>([
      [
        "drops each reminder on a line and keeps the rules text between them",
        "Flying (The monarch draws a card.) When this creature enters, you take the initiative. Haste (You become the monarch.)",
        ["initiative"],
      ],
      [
        "ends a reminder at its first closing parenthesis, even past another opening one",
        "Flying (Reminder (nested) you become the monarch.)",
        ["monarch"],
      ],
      [
        "keeps the text after an opening parenthesis that never closes",
        "Haste (When this creature enters, you become the monarch.",
        ["monarch"],
      ],
      [
        "keeps the text before a closing parenthesis that never opened",
        "When this creature enters, you become the monarch.) Flying (The initiative.)",
        ["monarch"],
      ],
      [
        "drops an empty reminder",
        "Vigilance () you get an experience counter.",
        ["experience"],
      ],
    ])("%s", (_case, oracleText, kinds) => {
      expect(
        gamePiecesOf([cardNamed("Pinned Card", oracleText)]).map(
          (entry) => entry.kind
        )
      ).toEqual(kinds);
    });

    it("reads a long line of unclosed parentheses in linear time", () => {
      const oracleText = `${"(".repeat(50_000)} you become the monarch.`;

      const startedAt = performance.now();
      const pieces = gamePiecesOf([cardNamed("Long Card", oracleText)]);
      const elapsedMs = performance.now() - startedAt;

      expect(pieces).toEqual([{ kind: "monarch", cardNames: ["Long Card"] }]);
      expect(elapsedMs).toBeLessThan(500);
    });
  });

  it("lists a piece once with every card that needs it, in name order", () => {
    expect(
      gamePiecesOf([QUEEN_MARCHESA, PALACE_JAILER, QUEEN_MARCHESA])
    ).toEqual([
      { kind: "monarch", cardNames: ["Palace Jailer", "Queen Marchesa"] },
    ]);
  });

  it("lists a card that needs two pieces under both", () => {
    const herald = cardNamed(
      "Twin Herald",
      "When this creature enters, you become the monarch and you get an experience counter."
    );

    expect(gamePiecesOf([MIZZIX, herald])).toEqual([
      { kind: "monarch", cardNames: ["Twin Herald"] },
      {
        kind: "experience",
        cardNames: ["Mizzix, Mizzium Master", "Twin Herald"],
      },
    ]);
  });
});
