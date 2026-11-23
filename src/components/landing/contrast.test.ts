import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio } from "@/lib/a11y/palette";

/**
 * The landing page used to ship its own gold and Cinzel palette. Small text
 * on those surfaces failed contrast, and the palette ignored the light theme.
 * The page now paints with the shared Lumen tokens, so this file checks two
 * things: the separate stylesheet is gone, and the tokens the page uses still
 * clear WCAG AA for small text on every canvas they can land on.
 */

const LANDING_DIR = join(process.cwd(), "src", "components", "landing");
const GLOBALS_CSS = readFileSync(
  join(process.cwd(), "src", "styles", "globals.css"),
  "utf8"
);
const LAYOUT_SOURCE = readFileSync(
  join(process.cwd(), "src", "app", "[locale]", "layout.tsx"),
  "utf8"
);

const MIN_RATIO_SMALL_TEXT = 4.5;

/**
 * Reads `#rrggbb` custom properties from one CSS rule block.
 *
 * @param source - full stylesheet
 * @param selector - rule selector, matched literally
 * @returns token name to lowercase hex
 */
function readBlockTokens(
  source: string,
  selector: string
): ReadonlyMap<string, string> {
  const marker = `\n${selector}`;
  const start = source.indexOf(marker);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  const block = source.slice(open + 1, close);
  const tokens = new Map<string, string>();

  for (const match of block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const name = match[1];
    const value = match[2];
    if (name === undefined || value === undefined) continue;
    tokens.set(name, value.toLowerCase());
  }

  return tokens;
}

const DARK = readBlockTokens(GLOBALS_CSS, ":root {");
const LIGHT = readBlockTokens(GLOBALS_CSS, '[data-theme="light"]');

/** Pairs of small text and the surfaces the landing page paints them on. */
const TEXT_PAIRS = [
  ["--text-primary", "--background"],
  ["--text-primary", "--surface"],
  ["--text-secondary", "--background"],
  ["--text-secondary", "--surface"],
  ["--accent-text", "--background"],
  ["--accent-text", "--surface"],
  ["--accent-text", "--accent-soft"],
] as const;

describe("landing page Lumen contrast", () => {
  it("no longer ships a separate gold and Cinzel stylesheet", () => {
    expect(existsSync(join(LANDING_DIR, "landing.css"))).toBe(false);
    const sources = readdirSync(LANDING_DIR)
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => readFileSync(join(LANDING_DIR, name), "utf8"))
      .join("\n");

    expect(sources).toContain("var(--accent)");
    expect(sources).toContain("var(--text-primary)");
    expect(sources).toContain("var(--lumen-radius-pill)");
    expect(sources.toLowerCase()).not.toContain("cinzel");
    expect(sources).not.toContain("--gold");
    expect(LAYOUT_SOURCE).not.toContain("Cinzel");
  });

  describe.each([
    ["dark", DARK],
    ["light", LIGHT],
  ] as const)("%s canvas", (_name, tokens) => {
    it.each(TEXT_PAIRS)(
      "%s clears 4.5:1 on %s",
      (textToken, backgroundToken) => {
        const foreground = tokens.get(textToken) ?? "";
        const background = tokens.get(backgroundToken) ?? "";
        const ratio = contrastRatio(foreground, background);

        expect(
          ratio,
          `${textToken} (${foreground}) on ${backgroundToken} (${background}) is ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(MIN_RATIO_SMALL_TEXT);
      }
    );

    it("keeps white button labels readable on the violet accent", () => {
      const accent = tokens.get("--accent") ?? "";
      const ratio = contrastRatio("#ffffff", accent);
      expect(ratio).toBeGreaterThanOrEqual(MIN_RATIO_SMALL_TEXT);
    });
  });
});
