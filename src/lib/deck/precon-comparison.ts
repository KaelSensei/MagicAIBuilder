/**
 * The decks of one precon product line, side by side (I-106 slice 1).
 *
 * Deck analysis, read model only
 * (`docs/product/specs/i106-choosing-a-precon-one-product-lines-decks-side-by-side.md`,
 * "Data model / API"). It computes no figure of its own: every cell is an
 * output another initiative owns, carried with that owner's label and date
 * (1.1), and a signal that does not exist yet is `notComputedYet`, never a
 * blank that reads as zero (1.3). There is no power, score or win-rate row
 * (1.2). Not responsible for: the catalogue (I-17), the page and its words
 * (slice 2), play styles and routes (slice 3) or the pilot load band (slice 4).
 *
 * @module deck/precon-comparison
 */
import type { BracketFloorRow } from "./bracket-assessment";
import type { BracketLevel } from "@/lib/constants/brackets";
import type { Catalogue, PreconVersion } from "@/lib/precon/catalogue";

/** The comparison's rows, in display order (I-106 2.2, plus slice 1's sealed list size). */
export const COMPARISON_ROWS = [
  "colourIdentity",
  "sealedListSize",
  "playStyles",
  "routes",
  "pilotLoad",
  "bracketFloors",
  "priceVsSealed",
  "firstBundleCost",
] as const;

/** One row of the comparison. */
export type ComparisonRowKind = (typeof COMPARISON_ROWS)[number];

/** The initiative whose output a row shows. */
export type SignalOwner = "I-17" | "I-32" | "I-54" | "I-65" | "I-77" | "I-99";

/** The rows no initiative computes yet; their cells are always `notComputedYet`. */
export type PendingRowKind = Exclude<
  ComparisonRowKind,
  "colourIdentity" | "sealedListSize" | "bracketFloors"
>;

/** A colour of a colour identity. Colourless is the empty identity. */
export type IdentityColour = "W" | "U" | "B" | "R" | "G";

/** How far a shown value can be trusted, as its owner labels it. */
export type CellLabel = "exact" | "estimated" | "computed";

/** A cell whose owner has no output for this deck yet. */
export interface NotComputedCell {
  readonly deckId: string;
  readonly label: "notComputedYet";
  readonly owner: SignalOwner;
}

/** A shown value, never without its label, owner and date (`YYYY-MM-DD`). */
export interface ShownCell<V> {
  readonly deckId: string;
  readonly label: CellLabel;
  readonly owner: SignalOwner;
  readonly asOf: string;
  readonly value: V;
}

/** One deck's cell in a row. */
export type RowCell<V> = ShownCell<V> | NotComputedCell;

/** I-77's floor block for a sealed list: the floor and the rows that set it, as I-77 labels them. */
export interface BracketFloorsValue {
  readonly floor: BracketLevel;
  readonly rows: readonly BracketFloorRow[];
}

/** One row and a cell per deck, in the line's deck order. */
export type ComparisonRow =
  | {
      readonly row: "colourIdentity";
      readonly cells: readonly RowCell<readonly IdentityColour[]>[];
    }
  | {
      readonly row: "sealedListSize";
      readonly cells: readonly RowCell<number>[];
    }
  | {
      readonly row: "bracketFloors";
      readonly cells: readonly RowCell<BracketFloorsValue>[];
    }
  | {
      readonly row: PendingRowKind;
      readonly cells: readonly NotComputedCell[];
    };

/**
 * What the owners have computed for one precon. `listVersion` is the
 * catalogue version the signals were read from; signals of another version
 * are not shown, since a correction can change the floors.
 */
export interface PreconSignals {
  readonly listVersion: number;
  readonly colourIdentity?: {
    readonly value: readonly IdentityColour[];
    readonly asOf: string;
  };
  readonly bracketFloors?: BracketFloorsValue & { readonly asOf: string };
}

/** A deck column: the latest catalogue version of one precon. */
export interface PreconColumn {
  readonly id: string;
  readonly version: number;
  readonly name: string;
  readonly commanderOracleId: string;
}

/** The comparison of a line's decks, or the line the catalogue does not hold. */
export type PreconComparison =
  | {
      readonly kind: "compared";
      readonly line: string;
      readonly decks: readonly PreconColumn[];
      readonly rows: readonly ComparisonRow[];
    }
  | { readonly kind: "unknownLine"; readonly line: string };

/** Which deck a cell belongs to and whose output it shows. */
interface CellKey {
  readonly deckId: string;
  readonly owner: SignalOwner;
}

/** Whose output each row shows (I-106 "Owns" and 2.2). */
const ROW_OWNERS: Readonly<Record<ComparisonRowKind, SignalOwner>> = {
  colourIdentity: "I-17",
  sealedListSize: "I-17",
  playStyles: "I-54",
  routes: "I-65",
  pilotLoad: "I-99",
  bracketFloors: "I-77",
  priceVsSealed: "I-32",
  firstBundleCost: "I-17",
};

/**
 * Compare the decks of one product line on stored, labelled signals.
 *
 * I-17's entries do not name a product line yet, so a line is the set code
 * its precons shipped in (the Foundations Commander decks share `fdc`). Each
 * precon shows its latest version, in the order the catalogue first
 * recorded it.
 *
 * @param catalogue - the stored precon versions
 * @param line - the set code of the product line
 * @param signals - each owner's output, keyed by precon id; a missing entry is not computed yet
 * @returns one column per deck and one row per {@link COMPARISON_ROWS} entry, or `unknownLine` when no precon has that set code
 */
export function comparePrecons(
  catalogue: Catalogue,
  line: string,
  signals: ReadonlyMap<string, PreconSignals>
): PreconComparison {
  const precons = latestVersionsOf(catalogue, line);
  if (precons.length === 0) return { kind: "unknownLine", line };
  return {
    kind: "compared",
    line,
    decks: precons.map(toColumn),
    rows: COMPARISON_ROWS.map((row) => buildRow(row, precons, signals)),
  };
}

/** @returns the line's precons at their highest version, in first-recorded order. */
function latestVersionsOf(
  catalogue: Catalogue,
  line: string
): readonly PreconVersion[] {
  const latest = new Map<string, PreconVersion>();
  for (const entry of catalogue) {
    if (entry.setCode !== line) continue;
    const stored = latest.get(entry.id);
    if (stored === undefined || entry.version > stored.version)
      latest.set(entry.id, entry);
  }
  return [...latest.values()];
}

function toColumn(precon: PreconVersion): PreconColumn {
  return {
    id: precon.id,
    version: precon.version,
    name: precon.name,
    commanderOracleId: precon.commanderOracleId,
  };
}

function buildRow(
  row: ComparisonRowKind,
  precons: readonly PreconVersion[],
  signals: ReadonlyMap<string, PreconSignals>
): ComparisonRow {
  const owner = ROW_OWNERS[row];
  const keyOf = (precon: PreconVersion): CellKey => ({
    deckId: precon.id,
    owner,
  });
  const signalOf = (precon: PreconVersion) => currentSignals(signals, precon);
  switch (row) {
    case "colourIdentity":
      return {
        row,
        cells: precons.map((precon) =>
          cell(keyOf(precon), "exact", signalOf(precon)?.colourIdentity)
        ),
      };
    case "sealedListSize":
      return { row, cells: precons.map((precon) => sealedSize(precon, owner)) };
    case "bracketFloors":
      return {
        row,
        cells: precons.map((precon) =>
          floorsCell(keyOf(precon), signalOf(precon)?.bracketFloors)
        ),
      };
    case "playStyles":
    case "routes":
    case "pilotLoad":
    case "priceVsSealed":
    case "firstBundleCost":
      return {
        row,
        cells: precons.map((precon) => notComputed(keyOf(precon))),
      };
  }
  const exhaustive: never = row;
  return exhaustive;
}

/** @returns the precon's signals when they were read from its current version. */
function currentSignals(
  signals: ReadonlyMap<string, PreconSignals>,
  precon: PreconVersion
): PreconSignals | undefined {
  const found = signals.get(precon.id);
  return found?.listVersion === precon.version ? found : undefined;
}

/** The sealed list's copies, commander included: exact, read from I-17's dated list. */
function sealedSize(
  precon: PreconVersion,
  owner: SignalOwner
): ShownCell<number> {
  let copies = 0;
  for (const card of precon.cards) copies += card.quantity;
  return {
    deckId: precon.id,
    label: "exact",
    owner,
    asOf: precon.sourceReadAt,
    value: copies,
  };
}

/** I-77's floors are computed from exact and sourced counts; each row keeps its own badge. */
function floorsCell(
  key: CellKey,
  floors: PreconSignals["bracketFloors"]
): RowCell<BracketFloorsValue> {
  if (floors === undefined) return notComputed(key);
  const { asOf, floor, rows } = floors;
  return cell(key, "computed", { asOf, value: { floor, rows } });
}

/** @returns the owner's value with its label and date, or `notComputedYet` when there is none. */
function cell<V>(
  key: CellKey,
  label: CellLabel,
  signal: { readonly value: V; readonly asOf: string } | undefined
): RowCell<V> {
  if (signal === undefined) return notComputed(key);
  return { ...key, label, asOf: signal.asOf, value: signal.value };
}

function notComputed(key: CellKey): NotComputedCell {
  return { ...key, label: "notComputedYet" };
}
