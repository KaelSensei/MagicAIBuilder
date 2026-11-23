import { describe, expect, it } from "vitest";

import {
  CVD_KINDS,
  PALETTE_THRESHOLDS,
  contrastRatio,
  deltaE,
  relativeLuminance,
  simulateCvd,
  validatePalette,
} from "./palette";

const WHITE = "#ffffff";
const BLACK = "#000000";

/** The dark theme's `--surface` token, as `src/styles/globals.css` declares it. */
const DARK_SURFACE = "#261f38";

/** The mana tokens of `globals.css` on 2026-11-22, the spec's "Red today" palette. */
const TODAY_MANA = {
  white: "#f9faf4",
  blue: "#0e68ab",
  black: "#150b00",
  red: "#d3202a",
  green: "#00733e",
  colorless: "#ccc2c0",
} as const;

/** The feasibility example of I-49 requirement 4.4, found for the dark theme. */
const FEASIBLE_DARK_MANA = [
  "#f9f3d3",
  "#4173ad",
  "#463631",
  "#b65030",
  "#84cc7c",
  "#939292",
] as const;

describe("contrastRatio", () => {
  it("reproduces the WCAG reference pair: #767676 on white is 4.54:1", () => {
    expect(contrastRatio("#767676", WHITE)).toBeCloseTo(4.54, 2);
  });

  it("spans 1 to 21 and does not depend on which colour is the text", () => {
    expect(contrastRatio(BLACK, WHITE)).toBe(21);
    expect(contrastRatio(WHITE, BLACK)).toBe(21);
    expect(contrastRatio("#7C3AED", "#7c3aed")).toBe(1);
  });

  it.each(["767676", "#fff", "#12345g", "rgb(0, 0, 0)", ""])(
    "refuses %j, which is not a #rrggbb colour",
    (value) => {
      expect(() => contrastRatio(value, WHITE)).toThrow(RangeError);
    }
  );
});

describe("relativeLuminance", () => {
  it("runs from 0 for black to 1 for white, mid grey at about a fifth", () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10);
    expect(relativeLuminance("#808080")).toBeCloseTo(0.2159, 4);
  });
});

describe("simulateCvd", () => {
  it.each([
    ["protan", "#6d5f00"],
    ["deutan", "#a39000"],
    ["tritan", "#ff000f"],
  ] as const)(
    "applies Machado's severity-1.0 %s matrix in linear RGB to pure red",
    (kind, expected) => {
      expect(simulateCvd("#ff0000", kind)).toBe(expected);
    }
  );

  it.each(CVD_KINDS)("leaves greys unchanged under %s", (kind) => {
    for (const grey of [WHITE, BLACK, "#808080", "#3c3c3c"]) {
      expect(simulateCvd(grey, kind)).toBe(grey);
    }
  });
});

describe("deltaE", () => {
  it("measures black to white as 100, OKLab lightness times 100", () => {
    expect(deltaE(BLACK, WHITE)).toBeCloseTo(100, 3);
  });

  it("is zero for one colour written in two cases", () => {
    expect(deltaE("#B65030", "#b65030")).toBe(0);
  });

  it("places pure red at Ottosson's OKLab reference (0.628, 0.225, 0.126)", () => {
    // Euclidean distance of the published OKLab red from black, times 100.
    expect(deltaE("#ff0000", BLACK)).toBeCloseTo(67.88, 1);
  });
});

describe("validatePalette", () => {
  it("passes the feasibility example of requirement 4.4 on every pair and vision", () => {
    const failures = validatePalette(FEASIBLE_DARK_MANA, DARK_SURFACE);

    expect(failures.filter((failure) => failure.kind === "too-close")).toEqual([]);
  });

  it("reproduces the spec's closest simulated pair in that example, ΔE 13.1", () => {
    let closest = Number.POSITIVE_INFINITY;
    FEASIBLE_DARK_MANA.forEach((first, index) => {
      for (const second of FEASIBLE_DARK_MANA.slice(index + 1)) {
        for (const kind of CVD_KINDS) {
          closest = Math.min(
            closest,
            deltaE(simulateCvd(first, kind), simulateCvd(second, kind))
          );
        }
      }
    });

    expect(closest).toBeCloseTo(13.1, 1);
  });

  it("finds today's mana red and green too close under protan, about ΔE 7.3", () => {
    const failures = validatePalette(Object.values(TODAY_MANA), DARK_SURFACE);
    const redGreen = failures.find(
      (failure) =>
        failure.kind === "too-close" &&
        failure.vision === "protan" &&
        failure.first === TODAY_MANA.red &&
        failure.second === TODAY_MANA.green
    );

    expect(redGreen).toMatchObject({
      minimum: PALETTE_THRESHOLDS.simulatedDeltaE,
    });
    // The spec measured 7.3; this module gives 7.24. Either way, under 8.
    expect(redGreen?.kind === "too-close" && redGreen.deltaE).toBeCloseTo(7.3, 0);
  });

  it("reports a mark under 3:1 against the surface with its ratio", () => {
    const failures = validatePalette([TODAY_MANA.black, WHITE], DARK_SURFACE);

    expect(failures).toEqual([
      {
        kind: "low-contrast",
        colour: TODAY_MANA.black,
        ratio: expect.closeTo(1.24, 2),
        minimum: PALETTE_THRESHOLDS.markContrast,
      },
    ]);
  });

  it("holds unsimulated pairs to ΔE 15, stricter than the simulations' 8", () => {
    // Greys look the same under every simulation, so this pair is about ΔE 10.6
    // apart in all four visions: enough for the simulations, not for normal vision.
    const failures = validatePalette(["#808080", "#a0a0a0"], BLACK);

    expect(failures).toEqual([
      {
        kind: "too-close",
        first: "#808080",
        second: "#a0a0a0",
        vision: "normal",
        deltaE: expect.closeTo(10.6, 1),
        minimum: PALETTE_THRESHOLDS.normalDeltaE,
      },
    ]);
  });

  it("finds nothing to compare in an empty palette", () => {
    expect(validatePalette([], DARK_SURFACE)).toEqual([]);
  });

  it("refuses a colour that is not #rrggbb before measuring anything", () => {
    expect(() => validatePalette(["#ffffff", "white"], DARK_SURFACE)).toThrow(RangeError);
  });
});
