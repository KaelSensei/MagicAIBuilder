import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * `toLocaleDateString()` reads the ambient locale, not the app's.
 *
 * Under next-intl the locale lives in the request, so a component that reaches
 * for the platform API renders a French page with English dates — and, because
 * "use client" components are still server-rendered for the initial HTML, it
 * formats once in the server's locale and again in the browser's.
 *
 * `useFormatter()` is the project's answer and was already in use in five
 * components; eight others had drifted. This test is what stops a ninth.
 */
const BANNED = /\.toLocale(Date|Time)?String\s*\(/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") || full.endsWith(".ts") ? [full] : [];
  });
}

describe("date localization", () => {
  it("formats every rendered date through next-intl, not the platform API", () => {
    const offenders = walk("src/components")
      .filter((file) => !file.includes(".test."))
      .filter((file) => BANNED.test(readFileSync(file, "utf8")))
      // The imported-deck name is persisted data, not rendered UI, so it is
      // not a localization decision the formatter should own.
      .filter((file) => !file.endsWith("Header.tsx"));

    expect(offenders).toEqual([]);
  });
});
