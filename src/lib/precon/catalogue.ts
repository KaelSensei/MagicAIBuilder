/**
 * A dated, append-only catalogue of official precon lists (I-17 slice 1).
 *
 * Deck building's neighbour for the sealed list. A correction is a new
 * version; writing a version that already exists fails and the previous
 * version stays. Card identity is the printing, because a precon ships
 * specific printings. The first imported set arrives through I-67 slice 13.
 * This module does not apply upgrades or price the list.
 *
 * @module precon/catalogue
 */

/** Where a precon card sits: the command zone or the main deck. */
export type PreconZone = "main" | "commander";

/** One printing in a precon version. */
export interface PreconCardLine {
  readonly scryfallId: string;
  /** Copies of this printing. A positive whole number. */
  readonly quantity: number;
  readonly zone: PreconZone;
}

/** One immutable version of a precon list. */
export interface PreconVersion {
  readonly id: string;
  /** 1 for the first stored list. A correction is the next integer. */
  readonly version: number;
  readonly setCode: string;
  readonly name: string;
  /** Oracle id of the face commander. The list itself stays at printing level. */
  readonly commanderOracleId: string;
  /** Release day, `YYYY-MM-DD`. */
  readonly releaseDate: string;
  readonly sourceUrl: string;
  /** Day the source was read, `YYYY-MM-DD`. */
  readonly sourceReadAt: string;
  readonly cards: readonly PreconCardLine[];
}

/** The stored versions. Order is the order they were recorded. */
export type Catalogue = readonly PreconVersion[];

/** Why a list was not stored. The previous catalogue is unchanged. */
export type PreconRejection =
  "existing-version" | "version-gap" | "not-a-precon";

/** A new catalogue, or the reason the candidate was refused. */
export type RecordPreconResult =
  | { readonly kind: "recorded"; readonly catalogue: Catalogue }
  | { readonly kind: "rejected"; readonly reason: PreconRejection };

/** No lists yet. I-67 slice 13 appends the first dated set. */
export const PUBLISHED_PRECONS: Catalogue = [];

const ZONES: readonly PreconZone[] = ["main", "commander"];
const ZONE_VALUES: readonly unknown[] = ZONES;

/**
 * Append one precon version. An existing version is refused.
 *
 * @param catalogue - the versions already stored
 * @param candidate - the list to append; it is copied, so later edits do not change the stored version
 * @returns the catalogue including the new version, or why it was refused
 */
export function recordPreconVersion(
  catalogue: Catalogue,
  candidate: PreconVersion
): RecordPreconResult {
  if (!isPreconVersion(candidate))
    return { kind: "rejected", reason: "not-a-precon" };
  const placement = placeVersion(catalogue, candidate.id, candidate.version);
  if (placement !== "next") return { kind: "rejected", reason: placement };
  return {
    kind: "recorded",
    catalogue: [...catalogue, copyVersion(candidate)],
  };
}

/** @returns `next` when this version is the one that may be appended. */
function placeVersion(
  catalogue: Catalogue,
  id: string,
  version: number
): "next" | "existing-version" | "version-gap" {
  let max = 0;
  for (const stored of catalogue) {
    if (stored.id !== id) continue;
    if (stored.version === version) return "existing-version";
    if (stored.version > max) max = stored.version;
  }
  return version === max + 1 ? "next" : "version-gap";
}

/** @returns a version whose card array is not the caller's array. */
function copyVersion(version: PreconVersion): PreconVersion {
  return {
    ...version,
    cards: version.cards.map((card) => ({ ...card })),
  };
}

/** @returns whether the candidate is a dated printing-level list. */
function isPreconVersion(value: PreconVersion): boolean {
  return (
    isLabel(value.id) &&
    isLabel(value.setCode) &&
    isLabel(value.name) &&
    isLabel(value.commanderOracleId) &&
    Number.isInteger(value.version) &&
    value.version >= 1 &&
    isCalendarDate(value.releaseDate) &&
    isCalendarDate(value.sourceReadAt) &&
    isHttpsUrl(value.sourceUrl) &&
    value.cards.length > 0 &&
    value.cards.every(isCardLine)
  );
}

/** @returns whether `value` is a non-empty string. */
function isLabel(value: string): boolean {
  return value.trim().length > 0;
}

/** @returns whether `value` is a real `YYYY-MM-DD` day. */
function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** @returns whether `value` is an https URL. */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** @returns whether the line is one printing with a positive copy count. */
function isCardLine(card: PreconCardLine): boolean {
  return (
    isLabel(card.scryfallId) &&
    Number.isInteger(card.quantity) &&
    card.quantity >= 1 &&
    ZONE_VALUES.includes(card.zone)
  );
}
