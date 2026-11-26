import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Keyboard focus is drawn one way everywhere: a 2px solid outline in
 * `--focus-ring`, 2px outside the control.
 *
 * Before (design audit S1, 2026-11-25), about seventy controls drew their own:
 * a `ring` in `--accent`, which measures 2.76:1 on the dark `--surface` and
 * 2.32:1 on `--surface-hover`, under the 3:1 that WCAG 2.2 SC 1.4.11 asks of a
 * focus indicator (https://www.w3.org/TR/WCAG22/#non-text-contrast, read
 * 2026-11-26); fields that only swapped their border to `--accent`, a 1.34:1
 * change from rest; and controls that hid the outline and drew nothing.
 * `contrast.test.ts` holds `--focus-ring` to 3:1 on every surface.
 *
 * Two rules keep it that way, scanned over components and pages with no
 * exception list:
 *
 * 1. no `focus:`, `focus-visible:` or `focus-within:` variant paints with
 *    `--accent`, `--accent-soft`, a raw palette hue or `transparent`;
 * 2. no such variant draws a `ring`. Tailwind's ring is a box-shadow, and
 *    forced-colors mode removes box-shadows, while it keeps an outline
 *    (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors,
 *    read 2026-11-26).
 *
 * A variant nested in an arbitrary selector, such as `has-[a:focus-visible]:`,
 * counts too.
 *
 * The outline itself comes from the base layer of `globals.css`, for every
 * native control, so a control needs no focus class of its own
 * (`focus-outline.test.ts`).
 */
const FOCUS_IN_OLD_COLOUR =
  /(focus|focus-visible|focus-within)\]?:(ring|outline|border)-(\[(?:color:)?var\(--accent(-soft)?\)\]|\(--accent(-soft)?\)|(red|green|amber|purple|violet|blue)-\d{3}|transparent)/;

const FOCUS_AS_RING = /(focus|focus-visible|focus-within)\]?:ring-/;

const SCANNED_ROOTS = ["src/components", "src/app"] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") || full.endsWith(".ts") ? [full] : [];
  });
}

/** Every `file:line match` of `pattern` in the scanned sources, tests left out. */
function offendingLines(pattern: RegExp): readonly string[] {
  return SCANNED_ROOTS.flatMap(walk)
    .filter((file) => !file.includes(".test."))
    .flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) => {
          const match = pattern.exec(line);
          return match ? [`${file}:${index + 1} ${match[0]}`] : [];
        })
    );
}

describe("focus classes in components and pages", () => {
  it("never paint keyboard focus in --accent, --accent-soft, a raw hue or transparent", () => {
    expect(offendingLines(FOCUS_IN_OLD_COLOUR)).toEqual([]);
  });

  it("never draw keyboard focus as a ring, which forced-colors mode removes", () => {
    expect(offendingLines(FOCUS_AS_RING)).toEqual([]);
  });

  it.each([
    "focus-visible:ring-[var(--accent)]",
    "focus-visible:outline-[var(--accent)]",
    "focus-visible:outline-(--accent)",
    "focus:ring-[var(--accent-soft)]",
    "focus:border-[color:var(--accent)]",
    "focus:border-transparent",
    "focus-visible:ring-purple-400",
    "focus:border-purple-400/60",
    "focus-within:border-[var(--accent)]",
    "has-[a:focus-visible]:ring-[var(--accent)]",
  ])("recognises %s as focus painted in an old colour", (className) => {
    expect(FOCUS_IN_OLD_COLOUR.test(className)).toBe(true);
  });

  it.each([
    "focus-visible:outline-[var(--focus-ring)]",
    "focus-visible:border-[var(--focus-ring)]",
    "focus-visible:bg-[var(--accent-soft)]",
    "hover:border-[var(--accent)]",
    "focus-visible:outline-[var(--accent-text)]",
    "border-transparent",
  ])("leaves %s alone", (className) => {
    expect(FOCUS_IN_OLD_COLOUR.test(className)).toBe(false);
  });

  it.each([
    "focus-visible:ring-2",
    "focus:ring-1",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-white/60",
    "focus-within:ring-2",
    "has-[a:focus-visible]:ring-2",
  ])("recognises %s as focus drawn as a ring", (className) => {
    expect(FOCUS_AS_RING.test(className)).toBe(true);
  });

  it.each([
    "focus-visible:outline-2",
    "ring-1 ring-white/20",
    "data-[state=open]:ring-2",
    "focus-visible:opacity-100",
  ])("leaves %s alone as a ring", (className) => {
    expect(FOCUS_AS_RING.test(className)).toBe(false);
  });
});
