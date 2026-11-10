import { describe, expect, it } from "vitest";
import { ALL_FORMATS } from "@/lib/deck/formats";
import {
  isFirstMulliganFree,
  isMultiplayerByDefault,
  offersMultiplayerChoice,
} from "./free-mulligan";

describe("free first mulligan (CR 103.5c)", () => {
  it("asks whether the game is multiplayer for Commander and Oathbreaker only", () => {
    expect(ALL_FORMATS.filter(offersMultiplayerChoice)).toEqual([
      "commander",
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
