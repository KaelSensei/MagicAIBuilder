/** The source target each colour gets from the deck's most demanding spell. */
import { describe, expect, it } from "vitest";
import { sourceTargetsByColour } from "./source-targets";

describe("sourceTargetsByColour", () => {
  it("gives a colour Karsten's 99-card entry for its one spell", () => {
    const targets = sourceTargetsByColour([
      { name: "Cultivate", manaCost: "{2}{G}" },
    ]);

    expect(targets).toEqual(
      new Map([
        ["G", { sources: 18, entry: "2C", driver: "Cultivate", gold: false }],
      ])
    );
  });

  it("takes the colour's most demanding spell as its driver", () => {
    const targets = sourceTargetsByColour([
      { name: "Llanowar Elves", manaCost: "{G}" },
      { name: "Primal Command", manaCost: "{3}{G}{G}" },
      { name: "Garruk Wildspeaker", manaCost: "{2}{G}{G}" },
    ]);

    expect(targets.get("G")).toEqual({
      sources: 26,
      entry: "2CC",
      driver: "Garruk Wildspeaker",
      gold: false,
    });
  });

  it("adds one source to each colour of a gold spell", () => {
    const targets = sourceTargetsByColour([
      { name: "Tymna the Weaver", manaCost: "{1}{W}{B}" },
    ]);

    expect(targets).toEqual(
      new Map([
        [
          "W",
          { sources: 19, entry: "2C", driver: "Tymna the Weaver", gold: true },
        ],
        [
          "B",
          { sources: 19, entry: "2C", driver: "Tymna the Weaver", gold: true },
        ],
      ])
    );
  });

  it("uses the entry with the same pips and the nearest lower mana value past the column", () => {
    const targets = sourceTargetsByColour([
      { name: "Craterhoof Behemoth", manaCost: "{5}{G}{G}{G}" },
    ]);

    expect(targets.get("G")).toEqual({
      sources: 26,
      entry: "4CCC",
      driver: "Craterhoof Behemoth",
      gold: false,
    });
  });

  it("counts X as zero, as the mana value does outside the stack", () => {
    const targets = sourceTargetsByColour([
      { name: "Crackle with Power", manaCost: "{X}{X}{X}{R}" },
    ]);

    expect(targets.get("R")).toMatchObject({ sources: 19, entry: "C" });
  });

  it("sets no target from a pip another kind of mana can pay", () => {
    const targets = sourceTargetsByColour([
      { name: "Kitchen Finks", manaCost: "{1}{G/W}{G/W}" },
      { name: "Spectral Procession", manaCost: "{2/W}{2/W}{2/W}" },
      { name: "Dismember", manaCost: "{1}{B/P}{B/P}" },
    ]);

    expect(targets).toEqual(new Map());
  });

  it("sets no number from a cost the column does not publish, and keeps the next driver", () => {
    const targets = sourceTargetsByColour([
      { name: "Khalni Hydra", manaCost: "{G}{G}{G}{G}{G}{G}{G}{G}" },
      { name: "Llanowar Elves", manaCost: "{G}" },
    ]);

    expect(targets).toEqual(
      new Map([
        [
          "G",
          { sources: 19, entry: "C", driver: "Llanowar Elves", gold: false },
        ],
      ])
    );
  });

  it("keeps the first listed spell when two set the same target", () => {
    const targets = sourceTargetsByColour([
      { name: "Talrand, Sky Summoner", manaCost: "{2}{U}{U}" },
      { name: "Wash Out", manaCost: "{3}{U}" },
      { name: "Mulldrifter", manaCost: "{4}{U}" },
      { name: "Control Magic", manaCost: "{2}{U}{U}" },
    ]);

    expect(targets.get("U")).toMatchObject({
      sources: 26,
      driver: "Talrand, Sky Summoner",
    });
  });

  it("returns no target for colourless and costless cards", () => {
    expect(
      sourceTargetsByColour([
        { name: "Sol Ring", manaCost: "{1}" },
        { name: "Forest", manaCost: "" },
        { name: "Kozilek, the Great Distortion", manaCost: "{8}{C}{C}" },
      ])
    ).toEqual(new Map());
  });
});
