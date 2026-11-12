import { describe, expect, it } from "vitest";
import { ALL_FORMATS } from "@/lib/deck/formats";
import {
  isFirstMulliganFree,
  isMultiplayerByDefault,
  offersMultiplayerChoice,
} from "./free-mulligan";

describe("free first mulligan (CR 103.5c)", () => {
  // The answer also sets the first-turn draw (CR 103.8) and Brawl's life total
  // (CR 903.12f), so Brawl is asked too; the constructed formats are duels.
  it("asks whether the game is multiplayer for Commander, Brawl and Oathbreaker", () => {
    expect(ALL_FORMATS.filter(offersMultiplayerChoice)).toEqual([
      "commander",
      "brawl",
      "oathbreaker",
    ]);
  });

  it("takes the formats usually played multiplayer as multiplayer by default", () => {
    expect(ALL_FORMATS.filter(isMultiplayerByDefault)).toEqual([
      "commander",
      "brawl",
      "oathbreaker",
    ]);
  });

  it.each([
    { format: "commander", multiplayer: true, free: true },
    { format: "commander", multiplayer: false, free: false },
    { format: "brawl", multiplayer: false, free: true },
    { format: "modern", multiplayer: false, free: false },
    { format: "modern", multiplayer: true, free: true },
  ] as const)(
    "makes the first $format mulligan free: $free (multiplayer: $multiplayer)",
    ({ format, multiplayer, free }) => {
      expect(isFirstMulliganFree(format, multiplayer)).toBe(free);
    }
  );
});
