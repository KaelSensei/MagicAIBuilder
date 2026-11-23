import { describe, expect, it } from "vitest";

import {
  fillProject,
  slotFit,
  type ProjectDeck,
  type ProjectFill,
  type ProjectSlot,
  type SlotFill,
} from "./project-fill";
import { templateSlots } from "./project-templates";

/** A deck created on 1 March 2026, white-blue unless told otherwise. */
function aProjectDeck(overrides: Partial<ProjectDeck> = {}): ProjectDeck {
  return {
    deckId: "deck-1",
    colorIdentity: ["W", "U"],
    createdAt: new Date("2026-03-01T00:00:00Z"),
    ...overrides,
  };
}

/** A slot of one colour identity, neither pinned, planned nor skipped. */
function aSlot(identity: ProjectSlot["identity"]): ProjectSlot {
  return { key: identity.join("") || "C", identity, skipped: false };
}

describe("slotFit", () => {
  it("refuses a mono-green deck in the Selesnya slot, naming the deck's identity", () => {
    const fit = slotFit(
      aSlot(["W", "G"]),
      aProjectDeck({ colorIdentity: ["G"] })
    );

    expect(fit).toEqual({ kind: "doesNotMatch", deckIdentity: ["G"] });
  });

  it("accepts a deck whose identity lists the slot's colours in another order", () => {
    const fit = slotFit(
      aSlot(["W", "G"]),
      aProjectDeck({ colorIdentity: ["G", "W"] })
    );

    expect(fit).toEqual({ kind: "fits" });
  });
});

describe("templateSlots", () => {
  it("gives the 32 colour identities one slot each, colourless included", () => {
    const slots = templateSlots("identities32");

    expect(slots).toHaveLength(32);
    expect(new Set(slots.map((slot) => slot.key)).size).toBe(32);
    expect(slots[0]).toEqual({ key: "C", identity: [], skipped: false });
    expect(slots.at(-1)).toEqual({
      key: "WUBRG",
      identity: ["W", "U", "B", "R", "G"],
      skipped: false,
    });
  });

  it.each([
    ["pairs10", ["WU", "UB", "BR", "RG", "WG", "WB", "UR", "BG", "WR", "UG"]],
    ["shards5", ["WUG", "WUB", "UBR", "BRG", "WRG"]],
    ["wedges5", ["WBG", "WUR", "UBG", "WBR", "URG"]],
    ["fourColour5", ["UBRG", "WBRG", "WURG", "WUBG", "WUBR"]],
  ] as const)(
    "lists the %s template's identities in WUBRG order",
    (template, keys) => {
      expect(templateSlots(template).map((slot) => slot.key)).toEqual(keys);
    }
  );
});

const EARLIER_AZORIUS = aProjectDeck({
  deckId: "azorius-first",
  createdAt: new Date("2026-01-10T00:00:00Z"),
});
const LATER_AZORIUS = aProjectDeck({
  deckId: "azorius-second",
  createdAt: new Date("2026-05-10T00:00:00Z"),
});
const COLOURLESS = aProjectDeck({ deckId: "kozilek", colorIdentity: [] });

/** The fill of the slot with this key; fails the test when the project has no such slot. */
function slotOf(fill: ProjectFill, key: string): SlotFill {
  const slot = fill.slots.find((candidate) => candidate.slotKey === key);
  if (slot === undefined) throw new Error(`no slot ${key}`);
  return slot;
}

describe("fillProject", () => {
  it("fills each identity with its earliest deck, lists the others as also fitting, and counts 2 of 32", () => {
    const fill = fillProject(templateSlots("identities32"), [
      LATER_AZORIUS,
      COLOURLESS,
      EARLIER_AZORIUS,
    ]);

    expect(slotOf(fill, "WU")).toEqual({
      state: "built",
      slotKey: "WU",
      deckId: "azorius-first",
      fit: { kind: "fits" },
      alsoFits: ["azorius-second"],
    });
    expect(slotOf(fill, "C")).toMatchObject({
      state: "built",
      deckId: "kozilek",
    });
    expect(slotOf(fill, "UB")).toEqual({ state: "empty", slotKey: "UB" });
    expect(fill.progress).toEqual({
      built: 2,
      planned: 0,
      empty: 30,
      skipped: 0,
      counted: 32,
    });
  });

  it("shows the pinned deck in its slot and lists the default one as also fitting", () => {
    const slots = templateSlots("identities32").map((slot) =>
      slot.key === "WU" ? { ...slot, pinnedDeckId: "azorius-second" } : slot
    );

    const fill = fillProject(slots, [EARLIER_AZORIUS, LATER_AZORIUS]);

    expect(slotOf(fill, "WU")).toEqual({
      state: "built",
      slotKey: "WU",
      deckId: "azorius-second",
      fit: { kind: "fits" },
      alsoFits: ["azorius-first"],
    });
  });

  it("leaves the four skipped four-colour slots out of the count and reads 2 of 28, 4 skipped", () => {
    const fourColour = new Set(
      templateSlots("fourColour5").map((slot) => slot.key)
    );
    const slots = templateSlots("identities32").map((slot) =>
      fourColour.has(slot.key) && slot.key !== "WUBR"
        ? { ...slot, skipped: true }
        : slot
    );

    const fill = fillProject(slots, [
      EARLIER_AZORIUS,
      LATER_AZORIUS,
      COLOURLESS,
    ]);

    expect(slotOf(fill, "UBRG")).toEqual({ state: "skipped", slotKey: "UBRG" });
    expect(slotOf(fill, "WUBR")).toEqual({ state: "empty", slotKey: "WUBR" });
    expect(fill.progress).toEqual({
      built: 2,
      planned: 0,
      empty: 26,
      skipped: 4,
      counted: 28,
    });
  });

  it("keeps a pinned deck whose commander became black-green in its slot, saying it no longer fits", () => {
    const nowGolgari = aProjectDeck({
      deckId: "was-azorius",
      colorIdentity: ["G", "B"],
    });
    const slots = templateSlots("identities32").map((slot) =>
      slot.key === "WU" ? { ...slot, pinnedDeckId: "was-azorius" } : slot
    );

    const fill = fillProject(slots, [nowGolgari]);

    expect(slotOf(fill, "WU")).toEqual({
      state: "built",
      slotKey: "WU",
      deckId: "was-azorius",
      fit: { kind: "doesNotMatch", deckIdentity: ["B", "G"] },
      alsoFits: [],
    });
  });

  it("does not also place a deck pinned elsewhere in the slot of its own identity", () => {
    const slots = templateSlots("identities32").map((slot) =>
      slot.key === "WUBRG" ? { ...slot, pinnedDeckId: "azorius-first" } : slot
    );

    const fill = fillProject(slots, [EARLIER_AZORIUS, LATER_AZORIUS]);

    expect(slotOf(fill, "WU")).toEqual({
      state: "built",
      slotKey: "WU",
      deckId: "azorius-second",
      fit: { kind: "fits" },
      alsoFits: [],
    });
    expect(fill.progress.built).toBe(2);
  });

  it("reads a slot with a plan and no deck as planned, and counts it", () => {
    const plan = {
      commanderOracleId: "oracle-of-tymna",
      note: "pair with Thrasios",
    };
    const slots = templateSlots("pairs10").map((slot) =>
      slot.key === "UG" || slot.key === "WU" ? { ...slot, plan } : slot
    );

    const fill = fillProject(slots, [EARLIER_AZORIUS]);

    expect(slotOf(fill, "UG")).toEqual({
      state: "planned",
      slotKey: "UG",
      plan,
    });
    expect(slotOf(fill, "WU")).toMatchObject({
      state: "built",
      deckId: "azorius-first",
    });
    expect(fill.progress).toEqual({
      built: 1,
      planned: 1,
      empty: 8,
      skipped: 0,
      counted: 10,
    });
  });

  it("breaks a tie between decks created at the same moment by deck id, whatever their order", () => {
    const sameMoment = new Date("2026-02-02T00:00:00Z");
    const alpha = aProjectDeck({ deckId: "alpha", createdAt: sameMoment });
    const beta = aProjectDeck({ deckId: "beta", createdAt: sameMoment });

    const fill = fillProject(templateSlots("pairs10"), [beta, alpha]);

    expect(slotOf(fill, "WU")).toMatchObject({
      deckId: "alpha",
      alsoFits: ["beta"],
    });
  });

  it("falls back to the default deck when the pinned deck no longer exists", () => {
    const slots = templateSlots("pairs10").map((slot) =>
      slot.key === "WU" ? { ...slot, pinnedDeckId: "deleted-deck" } : slot
    );

    const fill = fillProject(slots, [EARLIER_AZORIUS]);

    expect(slotOf(fill, "WU")).toMatchObject({
      state: "built",
      deckId: "azorius-first",
    });
  });
});
