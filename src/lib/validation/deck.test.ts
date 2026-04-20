import { describe, it, expect } from "vitest";
import { patchDeckSchema, createDeckSchema } from "./deck";

describe("createDeckSchema", () => {
  it("accepts valid name", () => {
    const result = createDeckSchema.safeParse({ name: "My Deck" });
    expect(result.success).toBe(true);
  });

  it("defaults format to commander", () => {
    const result = createDeckSchema.safeParse({ name: "My Deck" });
    if (result.success) expect(result.data.format).toBe("commander");
  });

  it("accepts brawl format", () => {
    const result = createDeckSchema.safeParse({ name: "Brawl Deck", format: "brawl" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createDeckSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = createDeckSchema.safeParse({ name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = createDeckSchema.safeParse({ name: "Test", format: "not_a_real_format" });
    expect(result.success).toBe(false);
  });
});

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

  it("accepts valid pairingType", () => {
    const result = patchDeckSchema.safeParse({ pairingType: "partner" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid pairingType", () => {
    const result = patchDeckSchema.safeParse({ pairingType: "alliance" });
    expect(result.success).toBe(false);
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

  it("accepts all pairing types", () => {
    const types = ["none", "partner", "partner_with", "friends_forever", "background", "doctor"] as const;
    for (const pairingType of types) {
      const result = patchDeckSchema.safeParse({ pairingType });
      expect(result.success).toBe(true);
    }
  });
});
