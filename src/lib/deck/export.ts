/**
 * The deck export entry point: every shipped export target, by name.
 *
 * Deck interchange. Each target's encoder lives in `./exports/<target>.ts`;
 * callers import from this file only, so the folder can change behind it.
 * Targets: plain text, Moxfield, MTG Arena, MTGO, TappedOut, Archidekt,
 * MTGGoldfish and EDHREC.
 *
 * @module deck/export
 */
export { exportPlainText } from "./exports/plain-text";
export { exportMoxfield } from "./exports/moxfield";
export { exportArena } from "./exports/arena";
export { exportMTGO } from "./exports/mtgo";
export { exportTappedOut } from "./exports/tappedout";
export { exportArchidekt } from "./exports/archidekt";
export { exportGoldfish } from "./exports/goldfish";
export { exportEdhrec } from "./exports/edhrec";

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
