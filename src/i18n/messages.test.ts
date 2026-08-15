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

/** @returns every locale directory name under src/messages */
function listLocales(): readonly string[] {
  return readdirSync(MESSAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** @returns the namespace files present for a locale, without the extension */
function listNamespaces(locale: string): readonly string[] {
  return readdirSync(join(MESSAGES_DIR, locale))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""));
}

/**
 * Flattens a message object into dotted key paths.
 *
 * @param value - parsed catalog or nested object
 * @param prefix - accumulated path
 * @returns every leaf key path
 */
function flattenKeys(value: unknown, prefix = ""): readonly string[] {
  if (typeof value !== "object" || value === null) return [prefix];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

/** @returns the flattened key paths of one locale's namespace file */
function keysOf(locale: string, namespace: string): readonly string[] {
  const file = join(MESSAGES_DIR, locale, `${namespace}.json`);
  return [...flattenKeys(JSON.parse(readFileSync(file, "utf8")))].sort((a, b) =>
    a.localeCompare(b)
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

  // A key present in `en` but missing elsewhere renders as the raw key path in
  // that locale. Catching it here keeps the translation pass honest: adding a
  // string means adding it everywhere, even if the value is still English.
  describe("key parity with the default locale", () => {
    const namespaces = listNamespaces("en");
    const otherLocales = listLocales().filter((locale) => locale !== "en");

    it("every locale ships the same namespace files as en", () => {
      for (const locale of otherLocales) {
        expect([...listNamespaces(locale)].sort()).toEqual([...namespaces].sort());
      }
    });

    for (const namespace of namespaces) {
      it(`${namespace}.json has identical keys in every locale`, () => {
        const expected = keysOf("en", namespace);

        for (const locale of otherLocales) {
          expect(
            keysOf(locale, namespace),
            `${locale}/${namespace}.json diverges from en`
          ).toEqual(expected);
        }
      });
    }
  });
});
