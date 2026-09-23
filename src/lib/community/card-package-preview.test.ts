import { describe, expect, it } from "vitest";
import { previewCardPackage } from "./card-package-preview";

const context = {
  format: "commander" as const,
  commanderColorIdentity: ["U", "B"],
  existingCards: [{ name: "Counterspell", quantity: 1, isBasicLand: false }],
};

describe("previewCardPackage", () => {
  it("reports banned, color identity, and singleton violations per card", () => {
    const preview = previewCardPackage(
      [
        { scryfallId: "1", name: "Counterspell", quantity: 1, colorIdentity: ["U"], isBanned: false, isBasicLand: false },
        { scryfallId: "2", name: "Lightning Bolt", quantity: 1, colorIdentity: ["R"], isBanned: false, isBasicLand: false },
        { scryfallId: "3", name: "Banned Spell", quantity: 1, colorIdentity: ["B"], isBanned: true, isBasicLand: false },
      ],
      context
    );

    expect(preview.readyCount).toBe(0);
    expect(preview.blockedCount).toBe(3);
    expect(preview.cards.map((card) => card.issues[0]?.kind)).toEqual([
      "singleton",
      "colorIdentity",
      "banned",
    ]);
  });

  it("allows repeated basic lands in singleton formats", () => {
    const preview = previewCardPackage(
      [{ scryfallId: "4", name: "Island", quantity: 10, colorIdentity: ["U"], isBanned: false, isBasicLand: true }],
      { ...context, existingCards: [{ name: "Island", quantity: 12, isBasicLand: true }] }
    );

    expect(preview.cards[0]?.status).toBe("ready");
  });
});
