/**
 * Solitary tests for the client half of the `PATCH /api/collection/[id]`
 * contract: the response parser and the state change each answer causes.
 */
import { describe, expect, it } from "vitest";

import {
  applyCollectionPatchResult,
  parseCollectionPatchResponse,
} from "./card-patch";
import type { CollectionCard } from "./types";

const WIRE_CARD = {
  id: "row-1",
  scryfallId: "printing-a",
  name: "Sol Ring",
  quantity: 3,
  foil: false,
  condition: "NM",
  acquiredAt: null,
  price: 1.5,
  imageUri: "",
  createdAt: "2026-11-01T10:00:00.000Z",
};

/**
 * @param overrides - Fields that differ from row-1, a non-foil Sol Ring.
 * @returns A card as the store holds it.
 */
function card(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return {
    ...WIRE_CARD,
    condition: "NM",
    createdAt: new Date(WIRE_CARD.createdAt),
    acquiredAt: null,
    ...overrides,
  };
}

describe("parseCollectionPatchResponse", () => {
  it("reads a deleted row", () => {
    expect(parseCollectionPatchResponse({ deleted: true })).toEqual({
      kind: "deleted",
    });
  });

  it("reads an updated row from its envelope", () => {
    expect(
      parseCollectionPatchResponse({ merged: false, card: WIRE_CARD })
    ).toEqual({
      kind: "updated",
      card: card(),
    });
  });

  it("reads a merge, with the id of the row that disappeared", () => {
    expect(
      parseCollectionPatchResponse({
        merged: true,
        mergedFromId: "row-0",
        card: WIRE_CARD,
      })
    ).toEqual({ kind: "merged", mergedFromId: "row-0", card: card() });
  });

  it("rejects a bare card, which the route never sends", () => {
    expect(parseCollectionPatchResponse(WIRE_CARD)).toBeNull();
  });

  it.each([
    ["a merge without the id it removed", { merged: true, card: WIRE_CARD }],
    [
      "an envelope whose card is malformed",
      { merged: false, card: { id: "row-1" } },
    ],
    ["an envelope without a merge flag", { card: WIRE_CARD }],
    ["a deletion flag that is not true", { deleted: false }],
    ["a value that is not an object", "ok"],
  ])("rejects %s", (_label, raw) => {
    expect(parseCollectionPatchResponse(raw)).toBeNull();
  });
});

describe("applyCollectionPatchResult", () => {
  const edited = card({ id: "row-1", scryfallId: "printing-a", quantity: 1 });
  const foil = card({ id: "row-2", scryfallId: "printing-a", foil: true });
  const maps = {
    collectionCards: { "printing-a": edited },
    collectionCardsFoil: { "printing-a": foil },
  };

  it("removes a deleted row and leaves its foil twin alone", () => {
    expect(
      applyCollectionPatchResult(maps, "row-1", { kind: "deleted" })
    ).toEqual({
      collectionCards: {},
      collectionCardsFoil: { "printing-a": foil },
    });
  });

  it("files an updated row under its current printing", () => {
    const moved = card({ id: "row-1", scryfallId: "printing-b", quantity: 1 });

    expect(
      applyCollectionPatchResult(maps, "row-1", {
        kind: "updated",
        card: moved,
      })
    ).toEqual({
      collectionCards: { "printing-b": moved },
      collectionCardsFoil: { "printing-a": foil },
    });
  });

  it("replaces a merged row by the surviving row, whose id differs", () => {
    const survivor = card({
      id: "row-9",
      scryfallId: "printing-b",
      quantity: 4,
    });
    const withSurvivor = {
      ...maps,
      collectionCards: {
        ...maps.collectionCards,
        "printing-b": card({ id: "row-9", scryfallId: "printing-b" }),
      },
    };

    expect(
      applyCollectionPatchResult(withSurvivor, "row-1", {
        kind: "merged",
        mergedFromId: "row-1",
        card: survivor,
      })
    ).toEqual({
      collectionCards: { "printing-b": survivor },
      collectionCardsFoil: { "printing-a": foil },
    });
  });

  it("does not bring back a row the user removed while the request was in flight", () => {
    const result = applyCollectionPatchResult(maps, "row-gone", {
      kind: "updated",
      card: card({ id: "row-gone", scryfallId: "printing-z" }),
    });

    expect(result).toBe(maps);
  });
});
