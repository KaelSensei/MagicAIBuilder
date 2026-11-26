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

/** The body of the `@layer base` block: its rules, up to the block's closing brace. */
const BASE_LAYER = /@layer base\s*\{([\s\S]*?\})\s*\}/;

/** One rule of a block: its selector and its declarations. */
const RULE = /([^{}]+)\{([^{}]*)\}/g;

/** The native controls the base layer draws the outline on. */
const CONTROLS = ":where(a,button,input,select,textarea,summary,[tabindex])";

/** The rules of the base layer, each selector with its whitespace removed. */
function baseLayerRules(): readonly {
  selector: string;
  declarations: string;
}[] {
  const block = BASE_LAYER.exec(GLOBALS_CSS)?.[1] ?? "";
  return [...block.matchAll(RULE)].map((match) => ({
    selector: (match[1] ?? "").replaceAll(/\s/g, ""),
    declarations: match[2] ?? "",
  }));
}

describe("the focus outline of globals.css", () => {
  const rules = baseLayerRules();
  const atRest = rules.find((rule) => rule.selector === CONTROLS);
  const onFocus = rules.find(
    (rule) => rule.selector === `${CONTROLS}:focus-visible`
  );

  it("is drawn on the keyboard focus of every native control, in the base layer", () => {
    expect(rules.map((rule) => rule.selector)).toEqual([
      CONTROLS,
      `${CONTROLS}:focus-visible`,
    ]);
  });

  it("holds a 2px --focus-ring outline 2px outside the control at rest, never a box-shadow", () => {
    expect(atRest?.declarations).toMatch(
      /outline-color:\s*var\(--focus-ring\);/
    );
    expect(atRest?.declarations).toMatch(/outline-width:\s*2px;/);
    expect(atRest?.declarations).toMatch(/outline-offset:\s*2px;/);
    expect(rules.some((rule) => /box-shadow/.test(rule.declarations))).toBe(
      false
    );
  });

  // A control's transition-colors or transition-all fades any outline
  // property that changes on focus; the style alone is discrete.
  it("switches only the outline's style on at focus, so no transition can fade it in", () => {
    expect(onFocus?.declarations.trim()).toBe("outline-style: solid;");
  });
});
