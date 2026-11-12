/**
 * Pins that the request schemas take their card categories and commander pairing types from the
 * deck domain's tuples, so the API, the database values and the domain unions cannot drift apart.
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import {
  CARD_CATEGORIES,
  PAIRING_TYPES,
  type CardCategory,
  type CommanderPairingType,
} from "@/lib/deck/types";
import {
  addCardSchema,
  patchCardSchema,
  type AddCardInput,
  type PatchCardInput,
} from "./card";
import { pairingTypeSchema } from "./deck";

const solRing = {
  scryfallId: "f29ba16f-c8fb-42fe-aabf-87089cb214a7",
  name: "Sol Ring",
  imageUri: "https://cards.scryfall.io/normal/front/f/2/f29ba16f.jpg",
  artCropUri: "https://cards.scryfall.io/art_crop/front/f/2/f29ba16f.jpg",
};

describe("deck vocabulary at the request boundary", () => {
  it("files an added or patched card under every domain card category", () => {
    for (const category of CARD_CATEGORIES) {
      expect(addCardSchema.parse({ ...solRing, category }).category).toBe(
        category
      );
      expect(patchCardSchema.parse({ category }).category).toBe(category);
    }
  });

  it("accepts exactly the domain pairing types, in domain order, so the OpenAPI enum lists them", () => {
    expect(pairingTypeSchema.options).toEqual(PAIRING_TYPES);
  });

  it("infers the domain unions from the schemas", () => {
    expectTypeOf<AddCardInput["category"]>().toEqualTypeOf<CardCategory>();
    expectTypeOf<PatchCardInput["category"]>().toEqualTypeOf<
      CardCategory | undefined
    >();
    expectTypeOf<
      z.infer<typeof pairingTypeSchema>
    >().toEqualTypeOf<CommanderPairingType>();
  });
});
