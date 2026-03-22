import { describe, it, expect } from "vitest";
import { addCardSchema, patchCardSchema } from "./card";

describe("addCardSchema", () => {
  const validCard = {
    scryfallId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Lightning Bolt",
  };

  it("accepts minimal valid card", () => {
    const result = addCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it("defaults quantity to 1", () => {
    const result = addCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(1);
  });

  it("defaults zone to main", () => {
    const result = addCardSchema.safeParse(validCard);
    if (result.success) expect(result.data.zone).toBe("main");
  });

  it("defaults category to other", () => {
    const result = addCardSchema.safeParse(validCard);
    if (result.success) expect(result.data.category).toBe("other");
  });

  it("strips HTML tags from name", () => {
    const result = addCardSchema.safeParse({
      ...validCard,
      name: "<b>Lightning Bolt</b>",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Lightning Bolt");
  });

  it("rejects invalid scryfallId format", () => {
    const result = addCardSchema.safeParse({ ...validCard, scryfallId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = addCardSchema.safeParse({ ...validCard, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = addCardSchema.safeParse({
      ...validCard,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity 0", () => {
    const result = addCardSchema.safeParse({ ...validCard, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity over 99", () => {
    const result = addCardSchema.safeParse({ ...validCard, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts sideboard zone", () => {
    const result = addCardSchema.safeParse({ ...validCard, zone: "sideboard" });
    expect(result.success).toBe(true);
  });

  it("accepts maybeboard zone", () => {
    const result = addCardSchema.safeParse({ ...validCard, zone: "maybeboard" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid zone", () => {
    const result = addCardSchema.safeParse({ ...validCard, zone: "graveyard" });
    expect(result.success).toBe(false);
  });

  it("accepts valid category", () => {
    const result = addCardSchema.safeParse({ ...validCard, category: "creature" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = addCardSchema.safeParse({ ...validCard, category: "spell" });
    expect(result.success).toBe(false);
  });

  it("accepts price as null", () => {
    const result = addCardSchema.safeParse({ ...validCard, price: null });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = addCardSchema.safeParse({ ...validCard, price: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts isCommander flag", () => {
    const result = addCardSchema.safeParse({ ...validCard, isCommander: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isCommander).toBe(true);
  });

  it("accepts full card data", () => {
    const result = addCardSchema.safeParse({
      scryfallId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Atraxa, Praetors' Voice",
      manaCost: "{G}{W}{U}{B}",
      cmc: 4,
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      oracleText: "Flying, vigilance, deathtouch, lifelink. Proliferate.",
      colorIdentity: ["W", "U", "B", "G"],
      isGameChanger: true,
      isBanned: false,
      price: 14.5,
      category: "commander",
      quantity: 1,
      isCommander: true,
      zone: "main",
    });
    expect(result.success).toBe(true);
  });
});

describe("patchCardSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = patchCardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid category", () => {
    const result = patchCardSchema.safeParse({ category: "land" });
    expect(result.success).toBe(true);
  });

  it("accepts valid zone", () => {
    const result = patchCardSchema.safeParse({ zone: "sideboard" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = patchCardSchema.safeParse({ category: "tree" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid zone", () => {
    const result = patchCardSchema.safeParse({ zone: "exile" });
    expect(result.success).toBe(false);
  });
});
