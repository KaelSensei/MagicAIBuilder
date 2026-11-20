import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * `--accent` is the button fill and never a text colour.
 *
 * As text it measures 3.09:1 on the dark canvas and 2.32:1 on the dark
 * `--surface-hover`, under the 4.5:1 that WCAG 2.1 SC 1.4.3 asks of body text
 * (docs/product/specs/i13-visual-direction.md, token requirement 3). Violet
 * copy and icons use `--accent-text`, which `contrast.test.ts` holds at 4.5:1
 * on every surface of both themes.
 *
 * Tailwind writes the same colour two ways, `text-[var(--accent)]` and the v4
 * shorthand `text-(--accent)`; both are caught, with any variant prefix such
 * as `hover:`. `--accent-text`, `--accent-hover` and `--accent-soft` are other
 * tokens and do not match, because the closing parenthesis must follow
 * `--accent` directly.
 */
const ACCENT_AS_TEXT = /text-(?:\[(?:color:)?var\(--accent\)\]|\(--accent\))/;

const SCANNED_ROOTS = ["src/components", "src/app"] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") || full.endsWith(".ts") ? [full] : [];
  });
}

describe("accent colour", () => {
  it("is never used as a text colour in components or pages", () => {
    const offenders = SCANNED_ROOTS.flatMap(walk)
      .filter((file) => !file.includes(".test."))
      .filter((file) => ACCENT_AS_TEXT.test(readFileSync(file, "utf8")));

    expect(offenders).toEqual([]);
  });

  it.each([
    "text-[var(--accent)]",
    "hover:text-[var(--accent)]",
    "text-[color:var(--accent)]",
    "text-(--accent)",
  ])("recognises %s as the accent used as text", (className) => {
    expect(ACCENT_AS_TEXT.test(className)).toBe(true);
  });

  it.each([
    "text-[var(--accent-text)]",
    "text-(--accent-text)",
    "hover:text-[var(--accent-hover)]",
    "bg-[var(--accent)] text-white",
    "border-[var(--accent)]",
  ])("leaves %s alone", (className) => {
    expect(ACCENT_AS_TEXT.test(className)).toBe(false);
  });
});
