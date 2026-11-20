/**
 * The "To reach Bracket N" wording: what stands in the way, never a verdict
 * and never a replacement card (I-77 requirement 5.3), with the bracket
 * called "estimated", never "your bracket" (1.2).
 *
 * Scans every English and French template of the list
 * (`builder.details.bracketPath`) for the verdict words 5.3 names ("illegal",
 * "too strong", "must cut"), their French forms, and the words that would
 * point at a replacement card. A whole word or phrase is matched,
 * case-insensitively, accented letters included. The scan is checked against
 * each banned word first, so a scan that matches nothing cannot pass for a
 * clean catalog.
 */
import { describe, expect, it } from "vitest";
import enBuilder from "@/messages/en/builder.json";
import frBuilder from "@/messages/fr/builder.json";

/** Verdict words, replacement words and "your bracket", in English and French. */
const BANNED_WORDS: readonly string[] = [
  "illegal",
  "too strong",
  "must cut",
  "must",
  "cut",
  "replace",
  "replacement",
  "swap",
  "instead",
  "your bracket",
  "illégal",
  "illégale",
  "trop fort",
  "trop puissant",
  "doit",
  "devez",
  "couper",
  "retirer",
  "remplacer",
  "remplacement",
  "échanger",
  "à la place",
  "votre bracket",
  "ton bracket",
];

/**
 * The banned words a text holds, each as a whole word: no letter may touch it
 * on either side, accented letters included.
 *
 * @param text - one template
 */
function bannedWordsIn(text: string): readonly string[] {
  return BANNED_WORDS.filter((word) =>
    new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, "iu").test(text)
  );
}

/**
 * Every template of a catalog block, nested blocks included.
 *
 * @param block - a catalog object or one template
 */
function templatesOf(block: unknown): readonly string[] {
  if (typeof block === "string") {
    return [block];
  }
  if (typeof block === "object" && block !== null) {
    return Object.values(block).flatMap(templatesOf);
  }
  return [];
}

describe("To reach Bracket N wording", () => {
  it.each(BANNED_WORDS)("the scan catches %s", (word) => {
    expect(bannedWordsIn(`This card is ${word.toUpperCase()}.`)).toContain(
      word
    );
  });

  it("the scan reads whole words only", () => {
    expect(bannedWordsIn("A cutting-edge, mustard-coloured deck")).toEqual([]);
  });

  it.each([
    ["English", enBuilder.details.bracketPath],
    ["French", frBuilder.details.bracketPath],
  ])("no %s template names a verdict or a replacement", (_locale, block) => {
    const templates = templatesOf(block);

    expect(templates.length).toBeGreaterThan(20);
    expect(templates.flatMap(bannedWordsIn)).toEqual([]);
  });

  it.each([
    ["English", enBuilder.details.bracketPath.estimate, "Estimated"],
    ["French", frBuilder.details.bracketPath.estimate, "estimé"],
  ])("the %s list calls the bracket estimated", (_locale, text, word) => {
    expect(text).toContain(word);
  });
});
