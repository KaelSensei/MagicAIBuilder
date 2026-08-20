import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { routing } from "./routing";

/**
 * Message catalog parity.
 *
 * A key added to `en` and forgotten elsewhere does not fail the build, does not
 * fail a render, and does not warn in production — next-intl prints the key
 * path itself into the UI. So the only place this class of mistake can be
 * caught cheaply is here.
 *
 * Parity is checked on **key paths only**. Values are deliberately not compared:
 * dormant locales carry the English text as a placeholder, which is how this
 * catalog was seeded, and asserting they differ would fail on every one of them.
 */

const MESSAGES_DIR = join(process.cwd(), "src", "messages");

/** Every leaf key path in a message object, e.g. `actions.rename`. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  );
}

function readCatalog(locale: string, namespace: string): unknown {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, locale, namespace), "utf8"));
}

const namespaces = readdirSync(join(MESSAGES_DIR, "en")).filter((f) =>
  f.endsWith(".json")
);
const otherLocales = routing.locales.filter((l) => l !== "en");

describe("message catalogs", () => {
  it("ships every locale declared in the routing config", () => {
    const present = new Set(readdirSync(MESSAGES_DIR));
    for (const locale of routing.locales) {
      expect(present.has(locale), `no message directory for "${locale}"`).toBe(true);
    }
  });

  it.each(otherLocales)("%s has the same namespaces as en", (locale) => {
    const present = readdirSync(join(MESSAGES_DIR, locale)).filter((f) =>
      f.endsWith(".json")
    );
    expect(present.sort()).toEqual([...namespaces].sort());
  });

  it.each(
    otherLocales.flatMap((locale) =>
      namespaces.map((namespace) => [locale, namespace] as const)
    )
  )("%s/%s has the same keys as en", (locale, namespace) => {
    const english = keyPaths(readCatalog("en", namespace)).sort();
    const translated = keyPaths(readCatalog(locale, namespace)).sort();

    const missing = english.filter((k) => !translated.includes(k));
    const extra = translated.filter((k) => !english.includes(k));

    expect(missing, `missing in ${locale}/${namespace}`).toEqual([]);
    expect(extra, `not in en/${namespace}`).toEqual([]);
  });
});
