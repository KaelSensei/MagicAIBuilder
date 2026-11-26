import { describe, expect, it } from "vitest";
import { copyDeckName, DECK_NAME_MAX_LENGTH } from "./deck-name";

/** The French wording of a copy's name, as the catalog words it. */
const inFrench = (name: string): string => `${name} (copie)`;

describe("copyDeckName", () => {
  it("words the copy's name from the deck's name", () => {
    expect(copyDeckName("Atraxa", inFrench)).toBe("Atraxa (copie)");
  });

  it("keeps a name that fits exactly, spaces included", () => {
    const fitsExactly = `${"a".repeat(DECK_NAME_MAX_LENGTH - 9)} `;

    expect(copyDeckName(fitsExactly, inFrench)).toBe(`${fitsExactly} (copie)`);
  });

  it("shortens the deck's name, never the wording, so the copy fits the deck-name limit", () => {
    const longest = "a".repeat(DECK_NAME_MAX_LENGTH);

    const copy = copyDeckName(longest, inFrench);

    expect(copy).toHaveLength(DECK_NAME_MAX_LENGTH);
    expect(copy).toBe(`${"a".repeat(DECK_NAME_MAX_LENGTH - 8)} (copie)`);
  });

  it("drops the spaces a cut leaves before the wording", () => {
    const cutAfterSpaces = `${"a".repeat(DECK_NAME_MAX_LENGTH - 10)}   tail`;

    expect(copyDeckName(cutAfterSpaces, inFrench)).toBe(
      `${"a".repeat(DECK_NAME_MAX_LENGTH - 10)} (copie)`
    );
  });

  it("never cuts a character in half", () => {
    // "🐉" is two UTF-16 units; one unit of room is left for it at the cut.
    const dragonAtTheCut = `${"a".repeat(DECK_NAME_MAX_LENGTH - 9)}🐉🐉`;

    expect(copyDeckName(dragonAtTheCut, inFrench)).toBe(
      `${"a".repeat(DECK_NAME_MAX_LENGTH - 9)} (copie)`
    );
  });

  it.each([
    // Two regional indicators, 4 units: half of it would read as a lone 🇫.
    ["a flag", "🇫🇷"],
    // "e" and a combining acute accent: half of it would drop the accent.
    ["an accented letter written with a combining accent", "é"],
    // Two people joined by a zero-width joiner: half of it would leave a stray joiner.
    ["a joined emoji", "👩‍👧"],
  ])("never cuts %s in half", (_kind, character) => {
    // One unit short of room for the whole character at the cut.
    const filler = "a".repeat(DECK_NAME_MAX_LENGTH - 8 - character.length + 1);

    expect(copyDeckName(`${filler}${character}`, inFrench)).toBe(
      `${filler} (copie)`
    );
  });
});
