/**
 * The command-slot rule: which slot a stored deck row fills, read from the
 * flags `COMMAND_SLOT_ROWS` names. Every reader of the command zone (the
 * store, the create route, the public views, the package routes) goes through
 * it, so these cases pin the one rule they share.
 *
 * CR 903.3: a deck has a commander. CR 702.124a: a partner ability adds a
 * second commander, saved with both `isCommander` and `isPartner`.
 * CR 702.139a: a companion is outside the deck and is not a commander; its row
 * is marked by the `companion` category with both flags false.
 */
import { describe, expect, it } from "vitest";

import {
  COMMAND_SLOTS,
  commandSlotOf,
  isCommanderRow,
  rowFillsCommandSlot,
} from "./bulk-edit-command-zone";

/** Every flag and category combination a stored row can carry. */
const ROWS = [false, true].flatMap((isCommander) =>
  [false, true].flatMap((isPartner) =>
    ["commander", "companion", "creature"].map((category) => ({
      isCommander,
      isPartner,
      category,
    }))
  )
);

describe("commandSlotOf", () => {
  it("reads a commander row as the commander slot", () => {
    expect(
      commandSlotOf({
        isCommander: true,
        isPartner: false,
        category: "commander",
      })
    ).toBe("commander");
  });

  it("reads a row with both flags as the partner slot", () => {
    expect(
      commandSlotOf({
        isCommander: true,
        isPartner: true,
        category: "commander",
      })
    ).toBe("partner");
  });

  it("reads a row with the partner flag alone as the partner slot", () => {
    expect(
      commandSlotOf({
        isCommander: false,
        isPartner: true,
        category: "creature",
      })
    ).toBe("partner");
  });

  it("reads a companion-category row with neither flag as the companion slot", () => {
    expect(
      commandSlotOf({
        isCommander: false,
        isPartner: false,
        category: "companion",
      })
    ).toBe("companion");
  });

  it("reads a companion-category row with the commander flag as the commander slot", () => {
    expect(
      commandSlotOf({
        isCommander: true,
        isPartner: false,
        category: "companion",
      })
    ).toBe("commander");
  });

  it("leaves any other row in the deck", () => {
    expect(
      commandSlotOf({
        isCommander: false,
        isPartner: false,
        category: "creature",
      })
    ).toBeNull();
  });

  it("names the one slot whose flags the row carries, for every flag combination", () => {
    for (const row of ROWS) {
      const filled = COMMAND_SLOTS.filter((slot) =>
        rowFillsCommandSlot(row, slot)
      );
      expect(filled.length).toBeLessThanOrEqual(1);
      expect(commandSlotOf(row)).toBe(filled[0] ?? null);
    }
  });
});

describe("isCommanderRow", () => {
  it("is true for the commander and partner slots and false otherwise, for every flag combination", () => {
    for (const row of ROWS) {
      const slot = commandSlotOf(row);
      expect(isCommanderRow(row)).toBe(
        slot === "commander" || slot === "partner"
      );
    }
  });
});
