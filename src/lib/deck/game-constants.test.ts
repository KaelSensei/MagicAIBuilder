import { describe, it, expect } from "vitest";

import { FORMAT_CONFIG } from "./formats";
import { OPENING_HAND_SIZE, STARTING_LIFE } from "./game-constants";

describe("game constants", () => {
  // CR 103.5: the starting hand size is normally seven.
  it("deals an opening hand of seven cards", () => {
    expect(OPENING_HAND_SIZE).toBe(7);
  });

  // CR 103.4c, 903.7: Commander players start at 40 life.
  it("starts a Commander game at 40 life, the same total as the Commander format entry", () => {
    expect(STARTING_LIFE).toBe(40);
    expect(FORMAT_CONFIG.commander.startingLife).toEqual({
      twoPlayer: STARTING_LIFE,
      multiplayer: STARTING_LIFE,
    });
  });
});
