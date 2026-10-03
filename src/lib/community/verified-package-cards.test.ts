import { beforeEach, describe, expect, it, vi } from "vitest";

const getCardCollection = vi.hoisted(() => vi.fn());
vi.mock("@/lib/scryfall/client", () => ({ getCardCollection }));

import { verifyPackageCards } from "./verified-package-cards";

describe("verifyPackageCards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("replaces forged package metadata with canonical card data", async () => {
    getCardCollection.mockResolvedValue({ data: [{
      id: "real-id", name: "Red Spell", color_identity: ["R"],
      type_line: "Sorcery", image_uris: { normal: "https://cards.scryfall.io/red.jpg" },
      legalities: { commander: "banned" },
    }], not_found: [] });

    const cards = await verifyPackageCards([{
      scryfallId: "real-id", name: "Island", quantity: 2,
      colorIdentity: ["U"], isBanned: false, isBasicLand: true, imageUri: "fake.jpg",
    }], "commander");

    expect(cards).toEqual([{
      scryfallId: "real-id", name: "Red Spell", quantity: 2,
      colorIdentity: ["R"], isBanned: true, isBasicLand: false,
      imageUri: "https://cards.scryfall.io/red.jpg",
    }]);
  });

  it("fails closed if an identifier cannot be verified", async () => {
    getCardCollection.mockResolvedValue({ data: [], not_found: [{ id: "missing" }] });
    await expect(verifyPackageCards([{
      scryfallId: "missing", name: "Fake", quantity: 1,
      colorIdentity: [], isBanned: false, isBasicLand: false, imageUri: "",
    }], "commander")).rejects.toThrow("Unable to verify package card");
  });
});
