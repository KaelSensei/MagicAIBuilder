import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Colour contrast on the application tokens, for both themes.
 *
 * `--accent` cannot satisfy both of its jobs. Under white button text it has to
 * be dark enough; as text on a dark surface it has to be light enough. At
 * #6366f1 it was 4.46:1 and 4.42:1 — failing both by a hair, and no single
 * value fixes both, because the requirements point in opposite directions.
 * Hence a separate `--accent-text`, and hence this file: the split is only
 * correct while each token stays on its own side of the line.
 *
 * `--accent-hover` is asserted too, and Lighthouse cannot help there — an audit
 * measures the page as rendered, never a hover state. The dark theme's hover
 * was #818cf8, **2.98:1 under white text**, so hovering an accent button made
 * its label harder to read than leaving it alone.
 *
 * Every text token is checked against every surface it can land on, and the
 * binding constraint is the surface closest to it in luminance — the dark
 * theme's lightest and the light theme's darkest. Aiming at the obvious
 * extreme instead (pure white, pure black) passes and is wrong.
 */

const GLOBALS_CSS = join(process.cwd(), "src", "styles", "globals.css");

const MIN_RATIO = 4.5;
const WHITE = "#ffffff";

/** Surfaces text is painted on, in both themes. */
const SURFACE_TOKENS = ["--background", "--surface", "--surface-hover"] as const;

/** Relative luminance of a `#rrggbb` colour, per WCAG 2.1. */
function relativeLuminance(hex: string): number {
  const channel = (offset: number): number => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two `#rrggbb` colours, from 1 to 21. */
function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const css = readFileSync(GLOBALS_CSS, "utf8");

/** The `#rrggbb` tokens declared inside one selector block. */
function readBlock(selector: string): ReadonlyMap<string, string> {
  const escaped = selector.replaceAll(/[[\]"^$.*+?()\\|{}]/g, String.raw`\$&`);
  const block = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  expect(block, `${selector} block not found in globals.css`).not.toBeNull();

  const tokens = new Map<string, string>();
  for (const match of (block?.[1] ?? "").matchAll(
    /(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g
  )) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) tokens.set(name, value.toLowerCase());
  }

  return tokens;
}

const THEMES = [
  { name: "dark", selector: ":root" },
  { name: "light", selector: '[data-theme="light"]' },
] as const;

describe.each(THEMES)("$name theme tokens", ({ selector }) => {
  const tokens = readBlock(selector);

  const colour = (name: string): string => {
    const value = tokens.get(name);
    expect(value, `${name} is not declared in the ${selector} block`).toBeDefined();
    return value ?? "";
  };

  it.each(["--accent", "--accent-hover"])(
    "keeps white button text readable on %s",
    (token) => {
      const background = colour(token);
      const ratio = contrastRatio(WHITE, background);

      expect(
        ratio,
        `white on ${token} (${background}) is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(MIN_RATIO);
    }
  );

  it.each(SURFACE_TOKENS)("keeps --accent-text readable on %s", (surfaceToken) => {
    const foreground = colour("--accent-text");
    const background = colour(surfaceToken);
    const ratio = contrastRatio(foreground, background);

    expect(
      ratio,
      `--accent-text (${foreground}) on ${surfaceToken} (${background}) is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(MIN_RATIO);
  });

  it.each(SURFACE_TOKENS)("keeps --text-secondary readable on %s", (surfaceToken) => {
    const foreground = colour("--text-secondary");
    const background = colour(surfaceToken);
    const ratio = contrastRatio(foreground, background);

    expect(
      ratio,
      `--text-secondary (${foreground}) on ${surfaceToken} (${background}) is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(MIN_RATIO);
  });
});
