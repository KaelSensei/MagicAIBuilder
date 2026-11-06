import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const GLOBALS_CSS = readFileSync(join(process.cwd(), "src", "styles", "globals.css"), "utf8");

describe("Lumen shape tokens", () => {
  it("publishes generous radii for cards, controls, and pills", () => {
    expect(GLOBALS_CSS).toContain("--lumen-radius-lg: 1rem");
    expect(GLOBALS_CSS).toContain("--lumen-radius-xl: 1.25rem");
    expect(GLOBALS_CSS).toContain("--lumen-radius-pill: 999px");
  });

  it("publishes a soft shadow for both the night canvas and the light canvas", () => {
    const shadows = GLOBALS_CSS.match(/--lumen-shadow-md:/g);
    expect(shadows).toHaveLength(2);
  });
});
