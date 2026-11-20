/**
 * Deck builds (I-55 slice 1): a named variant of a deck, such as its Bracket 2
 * or its budget version, stored only as its differences from the main build.
 *
 * Two pure functions carry the model. `diffBuild` turns the list a player
 * wants into a normalised change set against the main build; `resolveBuild`
 * applies a change set to the main build as it is now, and says for each
 * change whether it still applies. A change records the main-build value it
 * was made against, so when the main build moves later, the change is applied,
 * absorbed (main now holds the change's value) or held (main holds a third
 * value, and the build shows main's). Nothing here reads a database or a clock:
 * the same inputs give the same output, byte for byte.
 *
 * A line is one card in one zone, keyed as bulk edit keys it (`lineKey`).
 * Command-zone changes resolve before lines, so legality and colour identity
 * are later checked against the build's own commander (I-55 1.5).
 *
 * @module deck/deck-build
 */
import { normalizeImportedName } from "@/lib/scryfall/name-index";
import { lineKey } from "./bulk-edit";
import { COMMAND_SLOTS, type CommandSlot } from "./bulk-edit-command-zone";
import type { DeckZone } from "./types";

/** Copies of one card in one zone, with the printing the line shows. */
export interface BuildLine {
  readonly name: string;
  readonly zone: DeckZone;
  readonly quantity: number;
  /** Scryfall id of the printing, or null when the line names no printing. */
  readonly printing: string | null;
}

/** The card name in each command-zone slot, or null for an empty slot. */
export type CommandZone = Readonly<Record<CommandSlot, string | null>>;

/** A whole deck list: the main build, a wanted list or a resolved build. */
export interface BuildList {
  readonly commandZone: CommandZone;
  readonly lines: readonly BuildLine[];
}

/** What a line holds: its copies and its printing. Null means no line. */
export interface LineState {
  readonly quantity: number;
  readonly printing: string | null;
}

/**
 * A change to one line. `expected` is the main build's state when the change
 * was made (null: main had no such line); `value` is the state the build sets
 * (null: the build drops the line). `position` orders a build's changes.
 */
export interface LineChange {
  readonly target: "line";
  readonly zone: DeckZone;
  readonly name: string;
  readonly position: number;
  readonly expected: LineState | null;
  readonly value: LineState | null;
}

/** A change to one command-zone slot, with the main build's card when made. */
export interface CommandSlotChange {
  readonly target: "commandSlot";
  readonly slot: CommandSlot;
  readonly expected: string | null;
  readonly value: string | null;
}

/** One difference of a build from the main build. A build holds one per line. */
export type BuildChange = LineChange | CommandSlotChange;

/** The five change kinds of I-55 1.2, as the change markers name them. */
export type BuildChangeKind =
  "add" | "remove" | "quantity" | "printing" | "commandSlot";

/**
 * How a change stands against the main build as it is now (I-55 4.2):
 * - `applied`: main still holds the value the change was made against;
 * - `absorbed`: main now holds the value the change sets, so it is redundant;
 * - `held`: main holds a third value; the change is not applied.
 */
export type BuildChangeStatus = "applied" | "absorbed" | "held";

/** A change with its status. */
export interface ResolvedChange {
  readonly change: BuildChange;
  readonly status: BuildChangeStatus;
}

/** The list a build resolves to, and the status of each of its changes. */
export interface ResolvedBuild {
  readonly list: BuildList;
  /** Command-zone changes first, in slot order, then lines by position and key. */
  readonly statuses: readonly ResolvedChange[];
}

/**
 * Names a change for its marker. A line change that moves both the copies and
 * the printing is a quantity change; its `value` carries the printing too.
 *
 * @param change - a change of a build
 * @returns its kind
 */
export function buildChangeKind(change: BuildChange): BuildChangeKind {
  if (change.target === "commandSlot") return "commandSlot";
  if (change.expected === null) return "add";
  if (change.value === null) return "remove";
  return change.expected.quantity === change.value.quantity
    ? "printing"
    : "quantity";
}

/**
 * Lists the changes that turn the main build into the wanted list: the
 * command-zone slots in slot order, then the main build's lines in its order,
 * then the lines only the wanted list has, in its order. A line left as it is
 * records nothing, so diffing the main build with itself gives no change.
 *
 * @param main - the main build now
 * @param wanted - the list the player wants this build to be
 * @returns the build's change set, positions numbered from 0
 */
export function diffBuild(
  main: BuildList,
  wanted: BuildList
): readonly BuildChange[] {
  const mainLines = linesByKey(main.lines);
  const wantedLines = linesByKey(wanted.lines);
  const lineChanges: LineChange[] = [];
  const record = (
    entry: BuildLine,
    expected: LineState | null,
    value: LineState | null
  ): void => {
    if (sameLineState(expected, value)) return;
    const { name, zone } = entry;
    const position = lineChanges.length;
    lineChanges.push({ target: "line", zone, name, position, expected, value });
  };
  for (const [key, entry] of mainLines) {
    record(entry, stateOf(entry), stateOf(wantedLines.get(key)));
  }
  for (const [key, entry] of wantedLines) {
    if (!mainLines.has(key)) record(entry, null, stateOf(entry));
  }
  return [...commandSlotChanges(main.commandZone, wanted), ...lineChanges];
}

/**
 * Applies a build's changes to the main build as it is now. Applied changes
 * take effect; absorbed ones already hold in main; held ones leave main's
 * value showing. Lines keep the main build's order, and added lines follow
 * in change order.
 *
 * @param main - the main build now
 * @param changes - the build's change set, at most one change per line or slot
 * @returns the resolved list and each change's status
 */
export function resolveBuild(
  main: BuildList,
  changes: readonly BuildChange[]
): ResolvedBuild {
  const commandZone: Record<CommandSlot, string | null> = {
    ...main.commandZone,
  };
  const lines = new Map(linesByKey(main.lines));
  const statuses: ResolvedChange[] = [];

  for (const change of orderedSlotChanges(changes)) {
    const status = changeStatus(commandZone[change.slot], change, sameCard);
    if (status === "applied") commandZone[change.slot] = change.value;
    statuses.push({ change, status });
  }
  for (const change of orderedLineChanges(changes)) {
    const key = lineKey(change.name, change.zone);
    const current = lines.get(key);
    const status = changeStatus(stateOf(current), change, sameLineState);
    if (status === "applied") applyLineChange(lines, key, change);
    statuses.push({ change, status });
  }
  return { list: { commandZone, lines: [...lines.values()] }, statuses };
}

/**
 * Merges a list's rows per line, in list order: copies add up, the first
 * row's name and printing stay (as bulk edit keeps the printing listed
 * first), and a line without copies is no line.
 *
 * @param lines - the rows of one list
 * @returns one line per key
 */
function linesByKey(
  lines: readonly BuildLine[]
): ReadonlyMap<string, BuildLine> {
  const merged = new Map<string, BuildLine>();
  for (const entry of lines) {
    if (entry.quantity <= 0) continue;
    const key = lineKey(entry.name, entry.zone);
    const earlier = merged.get(key);
    merged.set(
      key,
      earlier
        ? { ...earlier, quantity: earlier.quantity + entry.quantity }
        : entry
    );
  }
  return merged;
}

/**
 * @param entry - a line, or undefined when the list has none
 * @returns what the line holds, or null for no line
 */
function stateOf(entry: BuildLine | undefined): LineState | null {
  return entry ? { quantity: entry.quantity, printing: entry.printing } : null;
}

/**
 * @param left - one line state
 * @param right - another line state
 * @returns whether both hold the same copies and printing, or both no line
 */
function sameLineState(
  left: LineState | null,
  right: LineState | null
): boolean {
  if (left === null || right === null) return left === right;
  return left.quantity === right.quantity && left.printing === right.printing;
}

/**
 * @param left - a slot's card name, or null
 * @param right - another slot's card name, or null
 * @returns whether both name the same card as bulk edit matches names
 */
function sameCard(left: string | null, right: string | null): boolean {
  if (left === null || right === null) return left === right;
  return normalizeImportedName(left) === normalizeImportedName(right);
}

/**
 * @param main - the main build's command zone
 * @param wanted - the wanted list
 * @returns one change per slot whose card differs, in slot order
 */
function commandSlotChanges(
  main: CommandZone,
  wanted: BuildList
): readonly CommandSlotChange[] {
  return COMMAND_SLOTS.flatMap((slot) => {
    const value = wanted.commandZone[slot];
    if (sameCard(main[slot], value)) return [];
    const change: CommandSlotChange = {
      target: "commandSlot",
      slot,
      expected: main[slot],
      value,
    };
    return [change];
  });
}

/**
 * Compares main's current value with the value a change was made against and
 * the value it sets (I-55 4.2).
 *
 * @param current - main's value now
 * @param change - the change's expected and set values
 * @param same - equality for this kind of value
 * @returns the change's status
 */
function changeStatus<T>(
  current: T,
  change: { readonly expected: T; readonly value: T },
  same: (left: T, right: T) => boolean
): BuildChangeStatus {
  if (same(current, change.expected)) return "applied";
  if (same(current, change.value)) return "absorbed";
  return "held";
}

/**
 * Sets a line to the state an applied change gives it. A changed line keeps
 * its place and main's spelling; an added line goes last.
 *
 * @param lines - the resolved lines so far, edited in place
 * @param key - the line's key
 * @param change - the applied change
 */
function applyLineChange(
  lines: Map<string, BuildLine>,
  key: string,
  change: LineChange
): void {
  if (change.value === null) {
    lines.delete(key);
    return;
  }
  const name = lines.get(key)?.name ?? change.name;
  lines.set(key, { name, zone: change.zone, ...change.value });
}

/**
 * @param changes - a build's change set
 * @returns its command-zone changes, in slot order
 */
function orderedSlotChanges(
  changes: readonly BuildChange[]
): readonly CommandSlotChange[] {
  return changes
    .flatMap((change) => (change.target === "commandSlot" ? [change] : []))
    .sort(
      (left, right) =>
        COMMAND_SLOTS.indexOf(left.slot) - COMMAND_SLOTS.indexOf(right.slot)
    );
}

/**
 * @param changes - a build's change set
 * @returns its line changes by position, then by line key
 */
function orderedLineChanges(
  changes: readonly BuildChange[]
): readonly LineChange[] {
  return changes
    .flatMap((change) => (change.target === "line" ? [change] : []))
    .map((change) => ({ change, key: lineKey(change.name, change.zone) }))
    .sort(
      (left, right) =>
        left.change.position - right.change.position ||
        compareKeys(left.key, right.key)
    )
    .map(({ change }) => change);
}

/**
 * Orders line keys by code unit, so the order never depends on a locale.
 *
 * @param left - a line key
 * @param right - another line key
 * @returns negative, zero or positive, as `Array.prototype.sort` expects
 */
function compareKeys(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
