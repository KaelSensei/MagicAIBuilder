import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The base layer of `globals.css` draws the app's one keyboard-focus
 * indicator on every native control: a 2px solid `--focus-ring` outline, 2px
 * outside it. A control with no focus class of its own, such as the dialog and
 * toast close buttons or the builder's title-bar pills, shows it too.
 *
 * It is an outline and never a box-shadow, because forced-colors mode removes
 * box-shadows and keeps outlines
 * (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors,
 * read 2026-11-26). `contrast.test.ts` holds the token to 3:1 on every
 * surface; `e2e/focus-visible.spec.ts` measures the outline in a browser.
 */
const GLOBALS_CSS = readFileSync(
  join(process.cwd(), "src", "styles", "globals.css"),
  "utf8"
);

/** The one rule of the `@layer base` block: its selector and its declarations. */
const BASE_LAYER_RULE = /@layer base\s*\{\s*([^{}]+)\{([^{}]*)\}\s*\}/;

describe("the focus outline of globals.css", () => {
  const rule = BASE_LAYER_RULE.exec(GLOBALS_CSS);
  const selector = (rule?.[1] ?? "").replaceAll(/\s/g, "");
  const declarations = rule?.[2] ?? "";

  it("is drawn on the keyboard focus of every native control, in the base layer", () => {
    expect(rule, "no @layer base rule in globals.css").not.toBeNull();
    expect(selector).toBe(
      ":where(a,button,input,select,textarea,summary,[tabindex]):focus-visible"
    );
  });

  it("is a 2px solid --focus-ring outline 2px outside the control, never a box-shadow", () => {
    expect(declarations).toMatch(/outline:\s*2px solid var\(--focus-ring\);/);
    expect(declarations).toMatch(/outline-offset:\s*2px;/);
    expect(declarations).not.toMatch(/box-shadow/);
  });
});
