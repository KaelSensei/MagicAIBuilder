import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Colour contrast on the landing page.
 *
 * Nothing fails when a foreground and a background are too close: the page
 * renders, the text is there, and only a reader who cannot resolve it is
 * affected. Lighthouse found four such pairs on this page in one pass, and both
 * of the ones fixed here had shipped with the marketing landing.
 *
 * The trap this guards is narrower than "check the contrast". `#7c5cfc` clears
 * 4.5:1 against `--black` at 4.60 and fails against `--surface` at 4.08 — a
 * token verified against the darkest background alone reads as safe and is not.
 * So every text token is checked against **every** background token it can
 * legitimately land on, and the worst pair is the one that has to pass.
 *
 * Only small text is asserted at 4.5:1. WCAG allows 3:1 for large text, and
 * several headings use `--gold` at `clamp(1.8rem, 4vw, 3rem)`, which is
 * legitimately large — asserting 4.5:1 across every `color:` declaration in the
 * file would fail on those and teach the next reader to weaken the rule.
 */

const LANDING_CSS = join(
  process.cwd(),
  "src",
  "components",
  "landing",
  "landing.css"
);

/** Tokens carrying body copy, labels and links — all below the large-text cutoff. */
const SMALL_TEXT_TOKENS = ["--text", "--muted", "--white"] as const;

/** Every surface small text is painted on in this file. */
const BACKGROUND_TOKENS = [
  "--black",
  "--deep",
  "--card-bg",
  "--surface",
] as const;

const MIN_RATIO_SMALL_TEXT = 4.5;

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

const css = readFileSync(LANDING_CSS, "utf8");

/** The `#rrggbb` values declared in the stylesheet, by token name. */
function readTokens(source: string): ReadonlyMap<string, string> {
  const tokens = new Map<string, string>();

  for (const match of source.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const name = match[1];
    const value = match[2];
    if (name === undefined || value === undefined) continue;
    if (!tokens.has(name)) tokens.set(name, value.toLowerCase());
  }

  return tokens;
}

/** The token `.section-label` paints its text with. */
function readSectionLabelToken(source: string): string {
  const rule = /\.section-label\s*\{([^}]*)\}/.exec(source);
  expect(rule, "`.section-label` rule not found in landing.css").not.toBeNull();

  const colour = /color:\s*var\((--[\w-]+)\)/.exec(rule?.[1] ?? "");
  expect(
    colour,
    "`.section-label` does not set `color: var(--token)`"
  ).not.toBeNull();

  return colour?.[1] ?? "";
}

const tokens = readTokens(css);

/** Fails with the measured ratio, so the message names the fix. */
function expectReadable(
  textToken: string,
  backgroundToken: string,
  describeSource: string
): void {
  const foreground = tokens.get(textToken) ?? "";
  const background = tokens.get(backgroundToken) ?? "";
  const ratio = contrastRatio(foreground, background);

  expect(
    ratio,
    `${describeSource} (${foreground}) on ${backgroundToken} (${background}) is ${ratio.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(MIN_RATIO_SMALL_TEXT);
}

describe("landing page colour contrast", () => {
  it("declares every token the assertions below reference", () => {
    for (const name of [...SMALL_TEXT_TOKENS, ...BACKGROUND_TOKENS]) {
      expect(
        tokens.get(name),
        `${name} is not declared in landing.css`
      ).toBeDefined();
    }
  });

  describe.each(SMALL_TEXT_TOKENS)("%s as small text", (textToken) => {
    it.each(BACKGROUND_TOKENS)(
      `clears ${MIN_RATIO_SMALL_TEXT}:1 on %s`,
      (backgroundToken) => {
        expectReadable(textToken, backgroundToken, textToken);
      }
    );
  });

  describe(".section-label", () => {
    it.each(BACKGROUND_TOKENS)(
      `clears ${MIN_RATIO_SMALL_TEXT}:1 on %s`,
      (backgroundToken) => {
        const labelToken = readSectionLabelToken(css);
        expectReadable(
          labelToken,
          backgroundToken,
          `.section-label uses ${labelToken}`
        );
      }
    );
  });
});
