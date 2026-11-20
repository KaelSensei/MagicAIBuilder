/**
 * The export contract every deck export target follows (I-50 requirement 1).
 *
 * Deck interchange. An exporter is a pure function of the deck: no network,
 * no clock, no randomness, so the same deck gives byte-identical output
 * (1.5). It returns the content with its file name and MIME type, and one
 * notice for every card the target drops or moves, so nothing is lost
 * silently (1.2). Not responsible for: per-target name rules (slice 2),
 * printings (slice 1) or showing the notices (`ExportNotices` in the export
 * dialog).
 *
 * @module deck/exports/contract
 */
import type { Deck } from "@/lib/deck/types";
import { underscoreFileStem } from "@/lib/text/slug";

/**
 * Every shipped export target, in the order the export dialog lists them.
 * Each value is also the file-name suffix of its text download, so renaming
 * one renames the player's files.
 */
export const EXPORT_TARGETS = [
  "moxfield",
  "arena",
  "mtgo",
  "tappedout",
  "archidekt",
  "goldfish",
  "edhrec",
  "plaintext",
] as const;

/** One shipped export target: one of {@link EXPORT_TARGETS}. */
export type ExportTarget = (typeof EXPORT_TARGETS)[number];

/**
 * Where a card sat in the deck before the export: the command zone
 * (commander and partner), the companion slot, or a deck zone outside the
 * main deck. Main-deck cards are never dropped or moved, so they have no
 * source value.
 */
export type ExportSourceZone =
  "commandZone" | "companion" | "sideboard" | "maybeboard";

/**
 * What an export did to a card that does not appear where the deck holds it.
 *
 * - `cardDropped`: the target's file does not carry the card at all.
 * - `cardMoved`: the card is in the file, in another zone than in the deck.
 *
 * `quantity` is the number of copies concerned, so the exported counts equal
 * the deck's counts minus the dropped quantities (1.2).
 */
export type ExportNotice =
  | {
      readonly kind: "cardDropped";
      readonly cardName: string;
      readonly quantity: number;
      readonly from: ExportSourceZone;
    }
  | {
      readonly kind: "cardMoved";
      readonly cardName: string;
      readonly quantity: number;
      readonly from: "commandZone";
      readonly to: "mainDeck";
    };

/** What one export of a deck gives the player to copy or download. */
export interface ExportResult {
  /** The text to copy or save, exactly as the target reads it. */
  readonly content: string;
  /** The suggested download name, extension included. */
  readonly fileName: string;
  /** The download's MIME type. */
  readonly mimeType: string;
  /** One notice per card dropped or moved, in deck order; empty when none. */
  readonly notices: readonly ExportNotice[];
}

/** An export target: a pure function of the deck (1.1). */
export type Exporter = (deck: Deck) => ExportResult;

/**
 * The file name and MIME type of a plain-text download,
 * `<deck_stem>_<target>.txt`, as the export dialog has always named them.
 *
 * @param deck - the deck exported; only its name is read
 * @param target - the target, which becomes the file-name suffix
 */
export function textDownload(
  deck: Pick<Deck, "name">,
  target: ExportTarget
): Pick<ExportResult, "fileName" | "mimeType"> {
  return {
    fileName: `${underscoreFileStem(deck.name)}_${target}.txt`,
    mimeType: "text/plain",
  };
}
