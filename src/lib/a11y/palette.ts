/**
 * Colour maths for checking that a palette reads for every player: contrast,
 * simulated colour vision and perceptual distance.
 *
 * Shared kernel: no business meaning, no IO. The token tests read colours from
 * `src/styles/globals.css` and pass them in, so no hex value is duplicated here.
 * Rules: WCAG 2.1 relative luminance and contrast (SC 1.4.3, 1.4.11); Machado,
 * Oliveira and Fernandes 2009 for colour-vision deficiency; Ottosson's OKLab for
 * distance. Thresholds are the product decision of I-49 requirement 4.2
 * (docs/product/specs/i49-colour-vision-and-low-vision-display.md).
 * Not responsible for: parsing CSS, choosing a palette, or labelling chart marks.
 *
 * @module a11y/palette
 */

/** The three dichromacies the palette is checked under. */
export const CVD_KINDS = ["protan", "deutan", "tritan"] as const;

/** A colour-vision deficiency, simulated at full severity. */
export type CvdKind = (typeof CVD_KINDS)[number];

/** Normal vision, or one of the simulated deficiencies. */
export type Vision = "normal" | CvdKind;

/**
 * The minimums a palette must meet, from I-49 requirement 4.2 and 3.3.
 *
 * Every pair of colours that can touch is at least ΔE 15 apart with normal
 * vision and ΔE 8 under each simulation. Each mark reaches 3:1 against its
 * surface, the WCAG 2.1 SC 1.4.11 non-text minimum
 * (https://www.w3.org/TR/WCAG21/#non-text-contrast, read 2026-11-20); a mark
 * below it needs an outline that does.
 */
export const PALETTE_THRESHOLDS = {
  normalDeltaE: 15,
  simulatedDeltaE: 8,
  markContrast: 3,
} as const;

/**
 * One reason a palette fails. `too-close` names a pair, in palette order, and
 * the vision under which it is too close; `low-contrast` names a mark that does
 * not stand out from the surface.
 */
export type PaletteFailure =
  | {
      readonly kind: "too-close";
      readonly first: string;
      readonly second: string;
      readonly vision: Vision;
      readonly deltaE: number;
      readonly minimum: number;
    }
  | {
      readonly kind: "low-contrast";
      readonly colour: string;
      readonly ratio: number;
      readonly minimum: number;
    };

type Rgb = readonly [number, number, number];
type Matrix = readonly [Rgb, Rgb, Rgb];

/**
 * Machado et al. 2009, severity 1.0, applied to linear RGB. Each row sums to 1,
 * so greys stay grey. Source: the paper's supplementary table,
 * https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
 * (read 2026-11-22).
 */
const MACHADO_MATRICES: Readonly<Record<CvdKind, Matrix>> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** Ottosson's OKLab, https://bottosson.github.io/posts/oklab/ (read 2026-11-22). */
const LINEAR_SRGB_TO_LMS: Matrix = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const LMS_CUBE_ROOT_TO_OKLAB: Matrix = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];

/** WCAG 2.1 luminance weights of linear red, green and blue. */
const LUMINANCE_WEIGHTS: Rgb = [0.2126, 0.7152, 0.0722];

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

/**
 * WCAG 2.1 contrast ratio between two colours, from 1 to 21. The order of the
 * two colours does not matter.
 *
 * @param foreground - `#rrggbb`, any case
 * @param background - `#rrggbb`, any case
 * @throws RangeError when either colour is not `#rrggbb`
 * @example contrastRatio("#767676", "#ffffff") // 4.54…, WCAG's reference pair
 */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * WCAG 2.1 relative luminance, from 0 for black to 1 for white. Use it to
 * order two colours by lightness; use {@link contrastRatio} to judge legibility.
 *
 * @param hex - `#rrggbb`, any case
 * @throws RangeError when `hex` is not `#rrggbb`
 */
export function relativeLuminance(hex: string): number {
  return dot(LUMINANCE_WEIGHTS, toLinearRgb(hex));
}

/**
 * The colour as a player with the given dichromacy sees it, at full severity.
 * Channels that leave the gamut are clipped, so the result is a `#rrggbb`
 * colour a screen can show. Greys are unchanged.
 *
 * @param hex - `#rrggbb`, any case
 * @returns lowercase `#rrggbb`
 * @throws RangeError when `hex` is not `#rrggbb`
 */
export function simulateCvd(hex: string, kind: CvdKind): string {
  const simulated = multiply(MACHADO_MATRICES[kind], toLinearRgb(hex));

  return toHex(simulated.map((channel) => Math.min(1, Math.max(0, channel))));
}

/**
 * Perceptual distance between two colours: the Euclidean distance in OKLab,
 * times 100, so black to white is 100 and an identical pair is 0.
 *
 * @throws RangeError when either colour is not `#rrggbb`
 */
export function deltaE(first: string, second: string): number {
  const [l1, a1, b1] = toOklab(toLinearRgb(first));
  const [l2, a2, b2] = toOklab(toLinearRgb(second));

  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Every way a palette misses {@link PALETTE_THRESHOLDS} on one surface; an
 * empty list means it passes.
 *
 * Every pair counts as touching, as it does for the mana chart, whose zero
 * counts are dropped (requirement 4.2). Each pair is measured with normal
 * vision and under each simulation, and the surface is held to the mark
 * minimum, never to a pair distance. A caller that labels every mark, and so
 * accepts ΔE 6 to 8, filters the `too-close` failures itself.
 *
 * @param colours - the marks, `#rrggbb`, in the order failures should name them
 * @param surface - the background the marks are drawn on, `#rrggbb`
 * @throws RangeError when any colour is not `#rrggbb`, before anything is measured
 */
export function validatePalette(
  colours: readonly string[],
  surface: string
): readonly PaletteFailure[] {
  for (const colour of [...colours, surface]) toLinearRgb(colour);

  return [...lowContrastMarks(colours, surface), ...tooClosePairs(colours)];
}

function lowContrastMarks(
  colours: readonly string[],
  surface: string
): readonly PaletteFailure[] {
  const minimum = PALETTE_THRESHOLDS.markContrast;

  return colours.flatMap((colour) => {
    const ratio = contrastRatio(colour, surface);
    return ratio < minimum ? [{ kind: "low-contrast", colour, ratio, minimum }] : [];
  });
}

function tooClosePairs(colours: readonly string[]): readonly PaletteFailure[] {
  const failures: PaletteFailure[] = [];

  colours.forEach((first, index) => {
    for (const second of colours.slice(index + 1)) {
      failures.push(...pairFailures(first, second));
    }
  });

  return failures;
}

function pairFailures(first: string, second: string): readonly PaletteFailure[] {
  const normal = {
    vision: "normal",
    deltaE: deltaE(first, second),
    minimum: PALETTE_THRESHOLDS.normalDeltaE,
  } as const;
  const simulated = CVD_KINDS.map((kind) => ({
    vision: kind,
    deltaE: deltaE(simulateCvd(first, kind), simulateCvd(second, kind)),
    minimum: PALETTE_THRESHOLDS.simulatedDeltaE,
  }));

  return [normal, ...simulated]
    .filter((measure) => measure.deltaE < measure.minimum)
    .map((measure) => ({ kind: "too-close", first, second, ...measure }));
}

/** Parses `#rrggbb` into linear-light sRGB channels from 0 to 1. */
function toLinearRgb(hex: string): Rgb {
  if (!HEX_COLOUR.test(hex)) {
    throw new RangeError(`Expected a #rrggbb colour, got ${JSON.stringify(hex)}`);
  }

  const channel = (offset: number): number =>
    decodeSrgb(Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);

  return [channel(1), channel(3), channel(5)];
}

/**
 * The sRGB transfer function. WCAG 2.1 prints 0.03928 as the threshold, the
 * sRGB standard 0.04045; no 8-bit value lies between them, so both agree.
 */
function decodeSrgb(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function encodeSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

function toHex(linear: readonly number[]): string {
  const bytes = linear.map((channel) =>
    Math.round(encodeSrgb(channel) * 255)
      .toString(16)
      .padStart(2, "0")
  );

  return `#${bytes.join("")}`;
}

function toOklab(linear: Rgb): Rgb {
  const lms = multiply(LINEAR_SRGB_TO_LMS, linear);

  return multiply(LMS_CUBE_ROOT_TO_OKLAB, [
    Math.cbrt(lms[0]),
    Math.cbrt(lms[1]),
    Math.cbrt(lms[2]),
  ]);
}

function multiply(matrix: Matrix, vector: Rgb): Rgb {
  return [dot(matrix[0], vector), dot(matrix[1], vector), dot(matrix[2], vector)];
}

function dot(row: Rgb, vector: Rgb): number {
  return row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2];
}
