import { describe, it, expect } from "vitest";
import {
  COMMAND_ZONE_FIELDS,
  commandZoneFieldsIn,
  commandZoneFieldsRefusal,
  deckCardIdSchema,
  patchDeckSchema,
} from "./deck";

describe("patchDeckSchema", () => {
  it("accepts empty object", () => {
    const result = patchDeckSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid name update", () => {
    const result = patchDeckSchema.safeParse({ name: "Renamed Deck" });
    expect(result.success).toBe(true);
  });

  it("rejects name over 200 chars", () => {
    const result = patchDeckSchema.safeParse({ name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts valid bracket", () => {
    const result = patchDeckSchema.safeParse({ targetBracket: 3 });
    expect(result.success).toBe(true);
  });

  it("rejects bracket below 1", () => {
    const result = patchDeckSchema.safeParse({ targetBracket: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts bracket 5 (cEDH)", () => {
    const result = patchDeckSchema.safeParse({ targetBracket: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects bracket above 5", () => {
    const result = patchDeckSchema.safeParse({ targetBracket: 6 });
    expect(result.success).toBe(false);
  });

  it("accepts manualBracket as null", () => {
    const result = patchDeckSchema.safeParse({ manualBracket: null });
    expect(result.success).toBe(true);
  });

  it("accepts description as null", () => {
    const result = patchDeckSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects description over 2000 chars", () => {
    const result = patchDeckSchema.safeParse({ description: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts tags array", () => {
    const result = patchDeckSchema.safeParse({ tags: ["control", "budget"] });
    expect(result.success).toBe(true);
  });

  it("rejects tag over 50 chars", () => {
    const result = patchDeckSchema.safeParse({ tags: ["a".repeat(51)] });
    expect(result.success).toBe(false);
  });

  it("rejects tags array over 20 items", () => {
    const result = patchDeckSchema.safeParse({ tags: Array.from({ length: 21 }, (_, i) => `tag${i}`) });
    expect(result.success).toBe(false);
  });

  it("accepts shareEnabled flag", () => {
    const result = patchDeckSchema.safeParse({ shareEnabled: true });
    expect(result.success).toBe(true);
  });

  it("accepts isAIGenerated flag", () => {
    const result = patchDeckSchema.safeParse({ isAIGenerated: true });
    expect(result.success).toBe(true);
  });

  it("accepts a focused public feedback request", () => {
    const result = patchDeckSchema.safeParse({
      seekingFeedback: true,
      feedbackQuestion: "Which two cards would you cut for more interaction?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a feedback question longer than 240 characters", () => {
    const result = patchDeckSchema.safeParse({
      feedbackQuestion: "a".repeat(241),
    });
    expect(result.success).toBe(false);
  });

  it("rejects enabling feedback without a focused question", () => {
    const result = patchDeckSchema.safeParse({
      seekingFeedback: true,
      feedbackQuestion: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("knows no command-zone field: the command-zone route owns them", () => {
    const result = patchDeckSchema.safeParse({
      name: "Renamed",
      commanderId: "card-1",
      pairingType: "partner",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Renamed" });
  });
});

describe("commandZoneFieldsIn", () => {
  it("finds nothing in a metadata-only body", () => {
    expect(commandZoneFieldsIn({ name: "Renamed", tags: ["budget"] })).toEqual([]);
  });

  it("finds nothing in a body that is not an object", () => {
    expect(commandZoneFieldsIn(null)).toEqual([]);
    expect(commandZoneFieldsIn("commanderId")).toEqual([]);
  });

  it.each(COMMAND_ZONE_FIELDS)("finds %s when the body carries it", (field) => {
    expect(commandZoneFieldsIn({ [field]: "x" })).toEqual([field]);
  });

  it("counts a slot cleared with null: it would still change the zone", () => {
    expect(commandZoneFieldsIn({ commanderId: null })).toEqual(["commanderId"]);
  });

  it("lists several fields in the order of COMMAND_ZONE_FIELDS", () => {
    expect(
      commandZoneFieldsIn({ pairingType: "partner", name: "x", commanderId: "a", partnerId: "b" })
    ).toEqual(["commanderId", "partnerId", "pairingType"]);
  });
});

describe("commandZoneFieldsRefusal", () => {
  it("names one field and the route to use", () => {
    expect(commandZoneFieldsRefusal(["commanderId"])).toBe(
      "commanderId is not accepted here: change the command zone through PATCH /api/decks/[id]/command-zone"
    );
  });

  it("names every field when several come together", () => {
    expect(commandZoneFieldsRefusal(["commanderId", "partnerId"])).toBe(
      "commanderId, partnerId are not accepted here: change the command zone through PATCH /api/decks/[id]/command-zone"
    );
  });
});

describe("deckCardIdSchema", () => {
  it("rejects an empty string and accepts a padded id", () => {
    expect(deckCardIdSchema.safeParse("").success).toBe(false);
    expect(deckCardIdSchema.safeParse(" card-1 ").success).toBe(true);
  });
});
