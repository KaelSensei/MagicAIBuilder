import { describe, it, expect } from "vitest";
import { detectPairingType, canPairWith, partnerSlotLabel, supportsPartner } from "./pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";

function makeCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "test-id",
    name: "Test Card",
    keywords: [],
    oracle_text: "",
    type_line: "Legendary Creature",
    color_identity: [],
    mana_cost: "",
    cmc: 0,
    colors: [],
    set: "tst",
    collector_number: "1",
    rarity: "rare",
    ...overrides,
  } as unknown as ScryfallCard;
}

describe("detectPairingType", () => {
  it("returns none for a card with no partner keywords", () => {
    expect(detectPairingType(makeCard())).toBe("none");
  });

  it("detects partner via keywords", () => {
    const card = makeCard({ keywords: ["Partner"] });
    expect(detectPairingType(card)).toBe("partner");
  });

  it("detects friends_forever via oracle text", () => {
    const card = makeCard({ oracle_text: "Friends forever" });
    expect(detectPairingType(card)).toBe("friends_forever");
  });

  it("detects partner_with via oracle text", () => {
    const card = makeCard({ oracle_text: "Partner with Tymna the Weaver" });
    expect(detectPairingType(card)).toBe("partner_with");
  });

  it("detects character_select via oracle text", () => {
    const card = makeCard({ oracle_text: "partner—character select" });
    expect(detectPairingType(card)).toBe("character_select");
  });

  it("detects background via oracle text", () => {
    const card = makeCard({ oracle_text: "choose a background" });
    expect(detectPairingType(card)).toBe("background");
  });

  it("detects doctor companion via oracle text", () => {
    const card = makeCard({ oracle_text: "doctor's companion" });
    expect(detectPairingType(card)).toBe("doctor");
  });

  it("prioritizes friends_forever over partner", () => {
    const card = makeCard({
      keywords: ["Partner"],
      oracle_text: "Friends forever",
    });
    expect(detectPairingType(card)).toBe("friends_forever");
  });

  it("is case-insensitive for keywords", () => {
    const card = makeCard({ keywords: ["PARTNER"] });
    expect(detectPairingType(card)).toBe("partner");
  });

  it("handles undefined keywords gracefully", () => {
    const card = makeCard({ keywords: undefined });
    expect(detectPairingType(card)).toBe("none");
  });

  it("handles undefined oracle_text gracefully", () => {
    const card = makeCard({ oracle_text: undefined });
    expect(detectPairingType(card)).toBe("none");
  });
});

describe("canPairWith", () => {
  it("partner can pair with partner", () => {
    expect(canPairWith("partner", "partner")).toBe(true);
  });

  it("partner_with can pair with partner_with", () => {
    expect(canPairWith("partner_with", "partner_with")).toBe(true);
  });

  it("friends_forever can pair with friends_forever", () => {
    expect(canPairWith("friends_forever", "friends_forever")).toBe(true);
  });

  it("character_select can pair with character_select", () => {
    expect(canPairWith("character_select", "character_select")).toBe(true);
  });

  it("background pairs with none", () => {
    expect(canPairWith("background", "none")).toBe(true);
  });

  it("doctor pairs with none", () => {
    expect(canPairWith("doctor", "none")).toBe(true);
  });

  it("partner cannot pair with friends_forever", () => {
    expect(canPairWith("partner", "friends_forever")).toBe(false);
  });

  it("none cannot pair with anything", () => {
    expect(canPairWith("none", "partner")).toBe(false);
    expect(canPairWith("none", "none")).toBe(false);
  });

  it("partner_with cannot pair with partner", () => {
    expect(canPairWith("partner_with", "partner")).toBe(false);
  });
});

describe("partnerSlotLabel", () => {
  it("returns Partner for partner type", () => {
    expect(partnerSlotLabel("partner")).toBe("Partner");
  });

  it("returns Partner With for partner_with type", () => {
    expect(partnerSlotLabel("partner_with")).toBe("Partner With");
  });

  it("returns Friends Forever for friends_forever type", () => {
    expect(partnerSlotLabel("friends_forever")).toBe("Friends Forever");
  });

  it("returns Background for background type", () => {
    expect(partnerSlotLabel("background")).toBe("Background");
  });

  it("returns Doctor's Companion for doctor type", () => {
    expect(partnerSlotLabel("doctor")).toBe("Doctor's Companion");
  });

  it("returns Character Select Partner for character_select type", () => {
    expect(partnerSlotLabel("character_select")).toBe("Character Select Partner");
  });

  it("falls through to default for none", () => {
    expect(partnerSlotLabel("none")).toBe("Partner");
  });
});

describe("supportsPartner", () => {
  it("returns false for none", () => {
    expect(supportsPartner("none")).toBe(false);
  });

  it("returns true for partner", () => {
    expect(supportsPartner("partner")).toBe(true);
  });

  it("returns true for friends_forever", () => {
    expect(supportsPartner("friends_forever")).toBe(true);
  });

  it("returns true for background", () => {
    expect(supportsPartner("background")).toBe(true);
  });

  it("returns true for doctor", () => {
    expect(supportsPartner("doctor")).toBe(true);
  });

  it("returns true for character_select", () => {
    expect(supportsPartner("character_select")).toBe(true);
  });

  it("returns true for partner_with", () => {
    expect(supportsPartner("partner_with")).toBe(true);
  });
});
