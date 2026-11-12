/**
 * The colour symbols request schemas accept, in one place.
 *
 * Format rules context. Zod schemas at the API boundary (`lib/validation/*`,
 * the card-package routes, the natural-language search context) validate
 * colour and colour-identity arrays against these tuples, so a symbol is
 * added or removed here once.
 * Rules: CR 105.1 (the five colours), CR 107.4c (the colourless symbol C).
 * Not responsible for: mana-cost parsing, which also knows the snow symbol S
 * (`lib/mana/parse.ts`), or colour-identity checks (`lib/deck/color-identity.ts`).
 *
 * @module mana/colors
 */

/**
 * The five colours, in WUBRG order.
 *
 * CR 105.1: white, blue, black, red and green are the only colours.
 */
export const FIVE_COLORS = ["W", "U", "B", "R", "G"] as const;

/**
 * Every symbol a colour or colour-identity field may hold: the five colours,
 * then `C`.
 *
 * Colourless is not a colour (CR 105.2), but the app stores `C` to mark a
 * colourless choice, using the colourless mana symbol (CR 107.4c).
 */
export const COLOR_SYMBOLS = [...FIVE_COLORS, "C"] as const;
