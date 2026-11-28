import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio, relativeLuminance } from "@/lib/a11y/palette";

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
 *
 * `--border` draws the boundary of inputs, buttons, cards and panels, so it is
 * held to WCAG 2.1 SC 1.4.11 (non-text contrast, 3:1) on the same four
 * surfaces. The I-13 audit measured #443a5e at 1.51:1 on the dark surface and
 * #e4dcf2 at 1.33:1 on white (docs/product/specs/i13-visual-direction.md).
 * There is no lighter decorative divider token: every `--border` use is held
 * to 3:1.
 *
 * `--focus-ring` draws the keyboard focus outline of every control, so it is
 * held to the same 3:1 on the same four surfaces (WCAG 2.2 SC 1.4.11 and
 * 2.4.7). Focus used to be drawn in `--accent`, which measured 2.76:1 on the
 * dark `--surface` and 2.32:1 on `--surface-hover` (design audit S1,
 * 2026-11-25).
 */

const GLOBALS_CSS = join(process.cwd(), "src", "styles", "globals.css");

const MIN_RATIO = 4.5;
/** WCAG 2.1 SC 1.4.11: https://www.w3.org/TR/WCAG21/#non-text-contrast (read 2026-11-20). */
const MIN_BOUNDARY_RATIO = 3;
const WHITE = "#ffffff";

/** Surfaces text is painted on, in both themes. */
const SURFACE_TOKENS = [
  "--background",
  "--surface",
  "--surface-elevated",
  "--surface-hover",
] as const;

/**
 * Every text token on every surface. `--text-primary` joined `--text-secondary`
 * with I-13 (design audit S5): the shared deck page's header without
 * commander art writes its title and commanders in it on `--surface`.
 */
const TEXT_ON_SURFACES = (
  ["--text-primary", "--text-secondary"] as const
).flatMap((textToken) =>
  SURFACE_TOKENS.map((surfaceToken) => [textToken, surfaceToken] as const)
);

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

/** The header bar's `bg-[var(--surface)]/90` (`src/components/layout/Header.tsx`). */
const HEADER_BAR_OPACITY = 0.9;

/**
 * `top` painted at `opacity` over the opaque `bottom`, per sRGB channel, as a
 * browser composites a translucent background.
 */
function paintedOver(top: string, opacity: number, bottom: string): string {
  const channels = [1, 3, 5].map((start) => {
    const upper = Number.parseInt(top.slice(start, start + 2), 16);
    const lower = Number.parseInt(bottom.slice(start, start + 2), 16);
    return Math.round(opacity * upper + (1 - opacity) * lower)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
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

  it("paints buttons with the Lumen violet", () => {
    expect(colour("--accent")).toBe("#7c3aed");
    expect(colour("--accent-hover")).toBe("#6d28d9");
  });

  it.each(TEXT_ON_SURFACES)(
    "keeps %s readable on %s",
    (textToken, surfaceToken) => {
      const foreground = colour(textToken);
      const background = colour(surfaceToken);
      const ratio = contrastRatio(foreground, background);

      expect(
        ratio,
        `${textToken} (${foreground}) on ${surfaceToken} (${background}) is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(MIN_RATIO);
    }
  );

  it.each(SURFACE_TOKENS)("draws component borders at 3:1 against %s", (surfaceToken) => {
    const border = colour("--border");
    const background = colour(surfaceToken);
    const ratio = contrastRatio(border, background);

    expect(
      ratio,
      `--border (${border}) on ${surfaceToken} (${background}) is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(MIN_BOUNDARY_RATIO);
  });

  it.each(SURFACE_TOKENS)("draws the focus ring at 3:1 against %s", (surfaceToken) => {
    const ring = colour("--focus-ring");
    const background = colour(surfaceToken);
    const ratio = contrastRatio(ring, background);

    expect(
      ratio,
      `--focus-ring (${ring}) on ${surfaceToken} (${background}) is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(MIN_BOUNDARY_RATIO);
  });

  it("lifts cards above the canvas", () => {
    const background = relativeLuminance(colour("--background"));
    const surface = relativeLuminance(colour("--surface"));

    expect(surface).toBeGreaterThan(background);
  });

  /*
   * The header marks the current page with a 2 px `--accent-text` underline
   * (design audit S9, `src/components/layout/primary-nav.ts`). Inside the
   * current link's `--surface-hover` fill it is held by the `--accent-text`
   * pairs above. The bar around the link is no token: `--surface` at 90 %
   * over the canvas and the `--accent-soft` glow under the header. The mark
   * is non-text, so 3:1 (WCAG 2.2 SC 1.4.11) on the bar over either colour.
   */
  it.each(["--background", "--accent-soft"])(
    "draws the header's current-page marker at 3:1 on the bar over %s",
    (canvasToken) => {
      const marker = colour("--accent-text");
      const bar = paintedOver(
        colour("--surface"),
        HEADER_BAR_OPACITY,
        colour(canvasToken)
      );
      const ratio = contrastRatio(marker, bar);

      expect(
        ratio,
        `--accent-text (${marker}) on the header bar over ${canvasToken} (${bar}) is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(MIN_BOUNDARY_RATIO);
    }
  );
});
