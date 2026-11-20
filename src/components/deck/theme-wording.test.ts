/**
 * The Theme panel's wording: a count, never a grade (I-102 requirement 1.3).
 *
 * Scans every English and French template of the panel (`builder.theme`) for
 * the verdict words of I-65 requirement 1.3, with the words I-102 adds: "not
 * thematic enough" and "pas assez thématique". A whole word or phrase is
 * matched, case-insensitively, so "bonus" never trips on "bon". The scan is
 * checked against each banned word first, so a scan that matches nothing
 * cannot pass for a clean catalog.
 */
import { describe, expect, it } from "vitest";
import enBuilder from "@/messages/en/builder.json";
import frBuilder from "@/messages/fr/builder.json";

/** Verdict words of I-65 1.3 and I-102 1.3, in English and French. */
const VERDICT_WORDS: readonly string[] = [
  "good",
  "weak",
  "bad",
  "not thematic enough",
  "you should",
  "score",
  "grade",
  "bon",
  "faible",
  "mauvais",
  "pas assez thématique",
  "vous devriez",
];

/**
 * The verdict words a text holds, each as a whole word: no letter may touch
 * it on either side, accented letters included.
 *
 * @param text - one template
 */
function verdictWordsIn(text: string): readonly string[] {
  return VERDICT_WORDS.filter((word) =>
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

describe("Theme panel wording", () => {
  it.each(VERDICT_WORDS)("the scan catches %s", (word) => {
    expect(verdictWordsIn(`This deck is ${word.toUpperCase()}.`)).toContain(
      word
    );
  });

  it("the scan reads whole words only", () => {
    expect(verdictWordsIn("A bonus card and a goodstuff pile")).toEqual([]);
  });

  it.each([
    ["English", enBuilder.theme],
    ["French", frBuilder.theme],
  ])("no %s template of the panel holds a verdict word", (_locale, block) => {
    const templates = templatesOf(block);

    expect(templates.length).toBeGreaterThan(20);
    expect(templates.flatMap(verdictWordsIn)).toEqual([]);
  });
});
