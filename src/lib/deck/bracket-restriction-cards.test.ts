/**
 * The Oracle-text rules that find mass land denial and extra-turn cards
 * (I-77 slice 3). Solitary on the pure rules, one row per card, with the
 * card's Oracle text as Scryfall prints it.
 */
import { describe, expect, it } from "vitest";
import {
  extraTurnCards,
  massLandDenialCards,
} from "@/lib/deck/bracket-restriction-cards";
import { aDeckCard } from "@/test/builders/card";

function aCard(name: string, oracleText: string) {
  return aDeckCard({ id: name, name, oracleText });
}

describe("massLandDenialCards", () => {
  it.each([
    ["Armageddon", "Destroy all lands."],
    ["Ruination", "Destroy all nonbasic lands."],
    [
      "Jokulhaups",
      "Destroy all artifacts, creatures, and lands. They can't be regenerated.",
    ],
    [
      "Decree of Annihilation",
      "Exile all artifacts, creatures, and lands from the battlefield, all cards from all graveyards, and all cards from all hands.\nCycling {5}{R}{R}",
    ],
    ["Sunder", "Return all lands to their owners' hands."],
    [
      "Wildfire",
      "Each player sacrifices four lands. Wildfire deals 4 damage to each creature.",
    ],
    ["Tectonic Break", "Each player sacrifices X lands."],
    [
      "Cataclysm",
      "Each player chooses from among the permanents they control an artifact, a creature, an enchantment, and a land, then sacrifices the rest.",
    ],
    ["Blood Moon", "Nonbasic lands are Mountains."],
    [
      "Back to Basics",
      "Nonbasic lands don't untap during their controllers' untap steps.",
    ],
    [
      "Hokori, Dust Drinker",
      "Lands don't untap during their controllers' untap steps.\nAt the beginning of each player's upkeep, that player untaps a land they control.",
    ],
    [
      "Winter Orb",
      "As long as Winter Orb is untapped, players can't untap more than one land during their untap steps.",
    ],
  ])("reads %s as mass land denial", (name, text) => {
    expect(massLandDenialCards([aCard(name, text)])).toEqual([name]);
  });

  it.each([
    ["Wrath of God", "Destroy all creatures. They can't be regenerated."],
    ["Boil", "Destroy all Islands."],
    [
      "Splendid Reclamation",
      "Return all land cards from your graveyard to the battlefield tapped.",
    ],
    [
      "Strip Mine",
      "{T}: Add {C}.\n{T}, Sacrifice Strip Mine: Destroy target land.",
    ],
    [
      "Tragic Arrogance",
      "For each player, you choose from among the permanents that player controls an artifact, a creature, an enchantment, and a planeswalker. Then each player sacrifices all other nonland permanents they control.",
    ],
  ])("does not read %s as mass land denial", (name, text) => {
    expect(massLandDenialCards([aCard(name, text)])).toEqual([]);
  });
});

describe("extraTurnCards", () => {
  it.each([
    ["Time Warp", "Target player takes an extra turn after this one."],
    ["Time Stretch", "Target player takes two extra turns after this one."],
    [
      "Alrund's Epiphany",
      "Create two 1/1 blue Bird creature tokens with flying. Take an extra turn after this one. Exile Alrund's Epiphany.\nForetell {4}{U}{U}",
    ],
    [
      "Sage of Hours",
      "Heroic — Whenever you cast a spell that targets Sage of Hours, put a +1/+1 counter on it.\nRemove all +1/+1 counters from Sage of Hours: For each five counters removed this way, take an extra turn after this one.",
    ],
  ])("reads %s as an extra-turn card", (name, text) => {
    expect(extraTurnCards([aCard(name, text)])).toEqual([name]);
  });

  it("does not read Stranglehold, which stops extra turns, as one", () => {
    const stranglehold = aCard(
      "Stranglehold",
      "Your opponents can't search libraries.\nIf an opponent would begin an extra turn, that player skips that turn instead."
    );

    expect(extraTurnCards([stranglehold])).toEqual([]);
  });
});

describe("the restriction cards of a list", () => {
  it("are named once each, in name order, whatever the row order", () => {
    const rows = [
      aCard("Time Warp", "Target player takes an extra turn after this one."),
      aCard(
        "Capture of Jingzhou",
        "Target player takes an extra turn after this one."
      ),
      aCard("Time Warp", "Target player takes an extra turn after this one."),
    ];

    expect(extraTurnCards(rows)).toEqual(["Capture of Jingzhou", "Time Warp"]);
    expect(extraTurnCards(rows.toReversed())).toEqual([
      "Capture of Jingzhou",
      "Time Warp",
    ]);
  });
});
