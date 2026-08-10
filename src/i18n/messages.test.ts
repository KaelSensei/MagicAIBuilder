import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MESSAGES_DIR = join(__dirname, "..", "messages");

/**
 * next-intl's rich-text parser does not support self-closing tags:
 * `<br/>` renders as literal text. Line breaks must be written `<br></br>`
 * and rendered via a tag renderer in t.rich().
 */
const SELF_CLOSING_TAG = /<[a-zA-Z][^<>]*\/>/;

function listMessageFiles(): readonly string[] {
  return readdirSync(MESSAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((locale) =>
      readdirSync(join(MESSAGES_DIR, locale.name))
        .filter((file) => file.endsWith(".json"))
        .map((file) => join(MESSAGES_DIR, locale.name, file))
    );
}

describe("message catalogs", () => {
  it("contain no self-closing tags (unsupported by next-intl rich text)", () => {
    const offenders = listMessageFiles().flatMap((file) => {
      const lines = readFileSync(file, "utf8").split("\n");
      return lines
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => SELF_CLOSING_TAG.test(line))
        .map(({ i }) => `${file}:${i + 1}`);
    });
    expect(offenders).toEqual([]);
  });
});
