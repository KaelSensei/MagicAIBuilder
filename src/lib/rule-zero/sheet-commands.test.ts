import { describe, expect, it } from "vitest";

import { createInMemorySheetRepository } from "@/lib/rule-zero/in-memory-sheet-repository";
import {
  createRuleZeroSheet,
  readRuleZeroSheet,
  updateRuleZeroSheet,
  type SheetClock,
} from "@/lib/rule-zero/sheet-commands";

const DECLARED = {
  speed: "optimized",
  winConditions: ["Combo"],
  combos: { present: true, note: "Thoracle" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 2,
  houseRules: "We stop at turn 8.",
};

const clock: SheetClock = {
  nextId: () => "sheet-1",
  now: () => "2026-11-20T12:00:00.000Z",
};

describe("a private per-deck rule 0 sheet", () => {
  it("stores the declared fields for the owner and reads them back unchanged", async () => {
    const sheets = createInMemorySheetRepository();

    const created = await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: "ada",
      deckId: "deck-1",
      input: DECLARED,
    });
    const read = await readRuleZeroSheet(sheets, "ada", "deck-1");

    expect(created).toMatchObject({
      kind: "created",
      sheet: { draft: DECLARED },
    });
    expect(read).toEqual(
      created.kind === "created"
        ? { kind: "sheet", sheet: created.sheet }
        : created
    );
  });

  it("does not show the sheet to another player, and the owner's copy stays", async () => {
    const sheets = createInMemorySheetRepository();
    await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: "ada",
      deckId: "deck-1",
      input: DECLARED,
    });

    expect(await readRuleZeroSheet(sheets, "grace", "deck-1")).toEqual({
      kind: "none",
    });
    expect(await readRuleZeroSheet(sheets, "ada", "deck-1")).toMatchObject({
      kind: "sheet",
      sheet: { draft: DECLARED },
    });
  });

  it("refuses a second sheet for the same deck", async () => {
    const sheets = createInMemorySheetRepository();
    await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: "ada",
      deckId: "deck-1",
      input: DECLARED,
    });

    const again = await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: "ada",
      deckId: "deck-1",
      input: { ...DECLARED, houseRules: "Different rules" },
    });

    expect(again).toEqual({ kind: "already-exists" });
    expect(await readRuleZeroSheet(sheets, "ada", "deck-1")).toMatchObject({
      kind: "sheet",
      sheet: { draft: DECLARED },
    });
  });

  it("edits only the declared fields and leaves the sheet private", async () => {
    const sheets = createInMemorySheetRepository();
    const later: SheetClock = {
      ...clock,
      now: () => "2026-11-20T13:00:00.000Z",
    };
    await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: "ada",
      deckId: "deck-1",
      input: DECLARED,
    });
    const edited = {
      ...DECLARED,
      speed: "core",
      proxyCount: 0,
      houseRules: "No extra turns.",
    };

    const updated = await updateRuleZeroSheet({
      sheets,
      clock: later,
      ownerId: "ada",
      deckId: "deck-1",
      input: edited,
    });
    const stranger = await updateRuleZeroSheet({
      sheets,
      clock: later,
      ownerId: "grace",
      deckId: "deck-1",
      input: { ...edited, houseRules: "Taken over" },
    });

    expect(updated).toMatchObject({
      kind: "updated",
      sheet: {
        id: "sheet-1",
        createdAt: "2026-11-20T12:00:00.000Z",
        draft: edited,
      },
    });
    expect(stranger).toEqual({ kind: "missing" });
    expect(await readRuleZeroSheet(sheets, "ada", "deck-1")).toEqual(
      updated.kind === "updated"
        ? { kind: "sheet", sheet: updated.sheet }
        : updated
    );
  });

  it("refuses a guest and a payload that is not a declared sheet", async () => {
    const sheets = createInMemorySheetRepository();

    expect(
      await createRuleZeroSheet({
        sheets,
        clock,
        ownerId: "",
        deckId: "deck-1",
        input: DECLARED,
      })
    ).toEqual({
      kind: "invalid",
      problem: "owner",
    });
    expect(
      await createRuleZeroSheet({
        sheets,
        clock,
        ownerId: "ada",
        deckId: "deck-1",
        input: { ...DECLARED, speed: "fast" },
      })
    ).toEqual({ kind: "invalid", problem: "speed" });
    expect(await readRuleZeroSheet(sheets, "ada", "deck-1")).toEqual({
      kind: "none",
    });
  });
});
