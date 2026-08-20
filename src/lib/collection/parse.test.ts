import { describe, it, expect } from "vitest";
import { isRecord, parseCondition, parseCollectionCard } from "./parse";

/**
 * A rejection here is silent — the caller drops the row. So the risk is not a
 * crash, it is a card quietly disappearing from someone's collection, or a
 * malformed one slipping through. Both directions are asserted.
 */

function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "row-1",
    scryfallId: "11111111-1111-4111-8111-111111111111",
    name: "Sol Ring",
    quantity: 2,
    foil: false,
    createdAt: "2026-08-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("parseCondition", () => {
  it.each(["NM", "LP", "MP", "HP", "DMG"])("accepts %s", (value) => {
    expect(parseCondition(value)).toBe(value);
  });

  it("rejects an unknown grade rather than storing it", () => {
    expect(parseCondition("MINT")).toBeNull();
    expect(parseCondition("nm")).toBeNull();
  });

  it("treats a missing or non-string condition as no condition", () => {
    expect(parseCondition(undefined)).toBeNull();
    expect(parseCondition(null)).toBeNull();
    expect(parseCondition(3)).toBeNull();
  });
});

describe("isRecord", () => {
  it("accepts a plain object", () => {
    expect(isRecord({})).toBe(true);
  });

  it("rejects null, which typeof reports as an object", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("rejects primitives", () => {
    expect(isRecord("x")).toBe(false);
    expect(isRecord(1)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("parseCollectionCard", () => {
  it("parses a well-formed payload, coercing the dates", () => {
    const card = parseCollectionCard(
      payload({ condition: "LP", acquiredAt: "2026-01-02T00:00:00.000Z", price: 1.5, imageUri: "https://img/x.jpg" })
    );
    expect(card).toMatchObject({
      id: "row-1",
      name: "Sol Ring",
      quantity: 2,
      foil: false,
      condition: "LP",
      price: 1.5,
      imageUri: "https://img/x.jpg",
    });
    expect(card?.createdAt).toBeInstanceOf(Date);
    expect(card?.acquiredAt).toBeInstanceOf(Date);
  });

  it("rejects anything that is not an object", () => {
    expect(parseCollectionCard(null)).toBeNull();
    expect(parseCollectionCard("Sol Ring")).toBeNull();
    expect(parseCollectionCard(undefined)).toBeNull();
  });

  it.each([
    ["id", { id: 1 }],
    ["scryfallId", { scryfallId: null }],
    ["name", { name: 42 }],
    ["quantity", { quantity: "2" }],
    ["foil", { foil: "false" }],
    ["createdAt", { createdAt: 1_700_000_000 }],
  ])("rejects the whole row when %s has the wrong type", (_field, override) => {
    expect(parseCollectionCard(payload(override))).toBeNull();
  });

  it.each(["id", "scryfallId", "name", "quantity", "foil", "createdAt"])(
    "rejects the whole row when %s is missing",
    (field) => {
      const raw = payload();
      delete raw[field];
      expect(parseCollectionCard(raw)).toBeNull();
    }
  );

  it("keeps a quantity of zero — a valid row, not a falsy one", () => {
    expect(parseCollectionCard(payload({ quantity: 0 }))?.quantity).toBe(0);
  });

  it("degrades optional fields instead of rejecting the row", () => {
    const card = parseCollectionCard(payload({ condition: "MINT", price: "1.50", imageUri: null }));
    expect(card).not.toBeNull();
    expect(card?.condition).toBeNull();
    expect(card?.price).toBeNull();
    expect(card?.imageUri).toBe("");
    expect(card?.acquiredAt).toBeNull();
  });

  it("rejects an array, which is an object but carries none of the fields", () => {
    expect(parseCollectionCard([])).toBeNull();
  });
});
