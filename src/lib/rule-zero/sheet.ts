/**
 * A Rule 0 sheet: the fields a player declares before a game (I-15 slice 1).
 *
 * Deck-building's neighbour for the pre-game agreement. Every field is
 * player-stated. This module never reads a deck list, so a computed bracket,
 * a combo finder or a card name cannot land on the sheet (requirement 1.3).
 * Sharing, the computed column and the pod comparison are later slices.
 *
 * @module rule-zero/sheet
 */

import { isRecord } from "@/lib/guards";

/** Speeds a player can declare. Custom is the player's own words in the note fields. */
export const SHEET_SPEEDS = [
  "exhibition",
  "core",
  "upgraded",
  "optimized",
  "cedh",
  "custom",
] as const;

/** One intended speed from {@link SHEET_SPEEDS}. */
export type SheetSpeed = (typeof SHEET_SPEEDS)[number];

/** Widened for membership tests; a tuple of literals rejects `unknown` in `includes`. */
const SHEET_SPEED_VALUES: readonly unknown[] = SHEET_SPEEDS;

/** How many win conditions one sheet holds. */
export const MAX_WIN_CONDITIONS = 12;

/** Characters in one win condition, after trimming. */
export const MAX_WIN_CONDITION_LENGTH = 200;

/** Characters in a presence note or the house-rules text. */
export const MAX_DECLARED_TEXT_LENGTH = 2000;

/** A yes/no the player states, plus the words they wrote beside it. */
export interface DeclaredPresence {
  readonly present: boolean;
  readonly note: string;
}

/**
 * The declared contents of a sheet. No deck id and no calculated field:
 * those live on the stored sheet, not in what the player typed.
 */
export interface RuleZeroSheetDraft {
  readonly speed: SheetSpeed;
  readonly winConditions: readonly string[];
  readonly combos: DeclaredPresence;
  readonly extraTurns: DeclaredPresence;
  readonly resourceDenial: DeclaredPresence;
  /** Copies the player says are proxies. A whole number, zero or more. */
  readonly proxyCount: number;
  readonly houseRules: string;
}

/** Why a payload is not a declared sheet. */
export type SheetDraftProblem =
  | "shape"
  | "speed"
  | "win-conditions"
  | "presence"
  | "proxy-count"
  | "house-rules";

/** One stored sheet. The draft is exactly what the owner declared. */
export interface RuleZeroSheet {
  readonly id: string;
  readonly ownerId: string;
  readonly deckId: string;
  readonly draft: RuleZeroSheetDraft;
  /** ISO-8601 instant the sheet was created. */
  readonly createdAt: string;
  /** ISO-8601 instant the declared fields were last saved. */
  readonly updatedAt: string;
}

/** A draft, or the first problem that kept the payload out. */
export type SheetDraftResult =
  | { readonly ok: true; readonly draft: RuleZeroSheetDraft }
  | { readonly ok: false; readonly problem: SheetDraftProblem };

/** @returns whether `value` is one of {@link SHEET_SPEEDS}. */
export function isSheetSpeed(value: unknown): value is SheetSpeed {
  return SHEET_SPEED_VALUES.includes(value);
}

/**
 * Read a declared sheet from an untrusted payload.
 *
 * Extra fields, including a deck list, are ignored: they are not declared
 * fields and they are not copied onto the draft. A missing or mistyped
 * field refuses the whole payload.
 *
 * @param value - JSON or a form payload
 * @returns the draft, or the problem that refused it
 */
export function parseSheetDraft(value: unknown): SheetDraftResult {
  if (!isRecord(value)) return { ok: false, problem: "shape" };
  if (!isSheetSpeed(value.speed)) return { ok: false, problem: "speed" };

  const winConditions = parseWinConditions(value.winConditions);
  if (!winConditions.ok) return winConditions;

  const combos = parsePresence(value.combos);
  if (combos === undefined) return { ok: false, problem: "presence" };
  const extraTurns = parsePresence(value.extraTurns);
  if (extraTurns === undefined) return { ok: false, problem: "presence" };
  const resourceDenial = parsePresence(value.resourceDenial);
  if (resourceDenial === undefined) return { ok: false, problem: "presence" };

  if (!isProxyCount(value.proxyCount))
    return { ok: false, problem: "proxy-count" };
  if (!isDeclaredText(value.houseRules))
    return { ok: false, problem: "house-rules" };

  return {
    ok: true,
    draft: {
      speed: value.speed,
      winConditions: winConditions.lines,
      combos,
      extraTurns,
      resourceDenial,
      proxyCount: value.proxyCount,
      houseRules: value.houseRules.trim(),
    },
  };
}

/** A whole number of proxies: zero through a four-digit count. */
function isProxyCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 9999
  );
}

/** Text the player typed, within {@link MAX_DECLARED_TEXT_LENGTH}. */
function isDeclaredText(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length <= MAX_DECLARED_TEXT_LENGTH
  );
}

/** @returns the trimmed lines, or why the list is not declared win conditions. */
function parseWinConditions(
  value: unknown
):
  | { readonly ok: true; readonly lines: readonly string[] }
  | (SheetDraftResult & { ok: false }) {
  if (!Array.isArray(value) || value.length > MAX_WIN_CONDITIONS) {
    return { ok: false, problem: "win-conditions" };
  }
  const lines: string[] = [];
  for (const entry of value) {
    if (!isDeclaredText(entry) || entry.trim().length === 0) {
      return { ok: false, problem: "win-conditions" };
    }
    if (entry.trim().length > MAX_WIN_CONDITION_LENGTH) {
      return { ok: false, problem: "win-conditions" };
    }
    lines.push(entry.trim());
  }
  return { ok: true, lines };
}

/** @returns the presence, or undefined when the payload is not a declared yes/no. */
function parsePresence(value: unknown): DeclaredPresence | undefined {
  if (
    !isRecord(value) ||
    typeof value.present !== "boolean" ||
    !isDeclaredText(value.note)
  ) {
    return undefined;
  }
  return { present: value.present, note: value.note.trim() };
}
