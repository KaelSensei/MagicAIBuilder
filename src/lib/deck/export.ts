/**
 * The deck export entry point: every shipped export target, by name, and
 * {@link exportDeck}, which runs one under the export contract (I-50
 * requirement 1).
 *
 * Deck interchange. Each target's exporter lives in `./exports/<target>.ts`;
 * callers import from this file only, so the folder can change behind it.
 * Targets: plain text, Moxfield, MTG Arena, MTGO, TappedOut, Archidekt,
 * MTGGoldfish and EDHREC. The `exportX` functions return the text alone,
 * for callers that need no file name or notices. The printable registration
 * sheet (`registrationSheetExport`) follows the same contract but also takes
 * locale labels, so it is not one of `EXPORT_TARGETS`.
 *
 * @module deck/export
 */
import type { Deck } from "./types";
import type { ExportResult, ExportTarget, Exporter } from "./exports/contract";
import { plainTextExport } from "./exports/plain-text";
import { moxfieldExport } from "./exports/moxfield";
import { arenaExport } from "./exports/arena";
import { mtgoExport } from "./exports/mtgo";
import { tappedOutExport } from "./exports/tappedout";
import { archidektExport } from "./exports/archidekt";
import { goldfishExport } from "./exports/goldfish";
import { edhrecExport } from "./exports/edhrec";

export { exportPlainText } from "./exports/plain-text";
export { exportMoxfield } from "./exports/moxfield";
export { exportArena } from "./exports/arena";
export { exportMTGO } from "./exports/mtgo";
export { exportTappedOut } from "./exports/tappedout";
export { exportArchidekt } from "./exports/archidekt";
export { exportGoldfish } from "./exports/goldfish";
export { exportEdhrec } from "./exports/edhrec";
export {
  EXPORT_TARGETS,
  type ExportNotice,
  type ExportResult,
  type ExportSourceZone,
  type ExportTarget,
} from "./exports/contract";
export {
  registrationSheetExport,
  type RegistrationSheetLabels,
} from "./exports/registration-sheet";

const EXPORTERS: Readonly<Record<ExportTarget, Exporter>> = {
  moxfield: moxfieldExport,
  arena: arenaExport,
  mtgo: mtgoExport,
  tappedout: tappedOutExport,
  archidekt: archidektExport,
  goldfish: goldfishExport,
  edhrec: edhrecExport,
  plaintext: plainTextExport,
};

/**
 * Exports `deck` to `target`: its content, file name, MIME type and a notice
 * for every card the target drops or moves. Pure: the same deck gives the
 * same result, byte for byte (I-50 requirement 1.5).
 *
 * @param deck - the deck to export; it is not changed
 * @param target - one of the shipped targets
 */
export function exportDeck(deck: Deck, target: ExportTarget): ExportResult {
  return EXPORTERS[target](deck);
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
