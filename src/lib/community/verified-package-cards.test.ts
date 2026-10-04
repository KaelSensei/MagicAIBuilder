import { beforeEach, describe, expect, it, vi } from "vitest";

const getCardCollection = vi.hoisted(() => vi.fn());
vi.mock("@/lib/scryfall/client", () => ({ getCardCollection }));

import { verifyPackageCards } from "./verified-package-cards";
import { previewCardPackage } from "./card-package-preview";

describe("verifyPackageCards", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([0, 1])("blocks restricted copies above one with %i existing copies", async (existingQuantity) => {
    getCardCollection.mockResolvedValue({ data: [{
      id: "restricted", name: "Restricted Spell", color_identity: [],
      type_line: "Artifact", legalities: { vintage: "restricted" },
    }], not_found: [] });
    const cards = await verifyPackageCards([{
      scryfallId: "restricted", name: "Restricted Spell", quantity: 2 - existingQuantity,
      colorIdentity: [], isBanned: false, isBasicLand: false,
    }], "vintage");
    const preview = previewCardPackage(cards, {
      format: "vintage", commanderColorIdentity: [], existingCards: existingQuantity === 0 ? [] : [
        { name: "Restricted Spell", quantity: existingQuantity, isBasicLand: false },
      ],
    });
    expect(preview.cards[0]?.status).toBe("blocked");
    expect(preview.cards[0]?.issues).toContainEqual({
      kind: "copyLimit", message: "Restricted Spell exceeds the 1-copy limit",
    });
  });

  it("allows one canonical restricted card without treating it as banned", async () => {
    getCardCollection.mockResolvedValue({ data: [{
      id: "restricted", name: "Restricted Spell", color_identity: [],
      type_line: "Artifact", legalities: { vintage: "restricted" },
    }], not_found: [] });
    const cards = await verifyPackageCards([{
      scryfallId: "restricted", name: "Restricted Spell", quantity: 1,
      colorIdentity: [], isBanned: true, isBasicLand: false,
    }], "vintage");
    expect(previewCardPackage(cards, {
      format: "vintage", commanderColorIdentity: [], existingCards: [],
    }).cards[0]?.status).toBe("ready");
  });

  it("uses canonical Oracle text to allow multiple copies in a singleton package", async () => {
    getCardCollection.mockResolvedValue({ data: [{
      id: "rats", name: "Relentless Rats", color_identity: ["B"],
      type_line: "Creature", oracle_text: "A deck can have any number of cards named Relentless Rats.",
      legalities: { commander: "legal" },
    }], not_found: [] });
    const cards = await verifyPackageCards([{
      scryfallId: "rats", name: "Relentless Rats", quantity: 20,
      colorIdentity: ["B"], isBanned: false, isBasicLand: false,
    }], "commander");
    const preview = previewCardPackage(cards, {
      format: "commander", commanderColorIdentity: ["B"], existingCards: [],
    });
    expect(preview.cards[0]?.status).toBe("ready");
    expect(preview.cards[0]?.quantity).toBe(20);
  });

  it("ignores forged stored Oracle exceptions when checking copy limits", async () => {
    getCardCollection.mockResolvedValue({ data: [{
      id: "spell", name: "Counterspell", color_identity: ["U"],
      type_line: "Instant", oracle_text: "Counter target spell.",
      legalities: { commander: "legal" },
    }], not_found: [] });
    const forgedCard = {
      scryfallId: "spell", name: "Counterspell", quantity: 2,
      colorIdentity: ["U"], isBanned: false, isBasicLand: false,
      oracleText: "A deck can have any number of cards named Counterspell.",
    };
    const cards = await verifyPackageCards([forgedCard], "commander");
    const preview = previewCardPackage(cards, {
      format: "commander", commanderColorIdentity: ["U"], existingCards: [],
    });
    expect(preview.cards[0]?.issues).toContainEqual({
      kind: "singleton", message: "Counterspell exceeds the singleton limit",
    });
  });

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
      oracleText: "",
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
