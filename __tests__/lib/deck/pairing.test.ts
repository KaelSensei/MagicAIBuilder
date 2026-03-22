import { describe, it, expect } from "vitest";
import { detectPairingType, canPairWith, partnerSlotLabel, supportsPartner } from "@/lib/deck/pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";

function makeScryfall(overrides: Partial<ScryfallCard>): ScryfallCard {
  return {
    id: "test-id",
    name: "Test Card",
    cmc: 3,
    type_line: "Legendary Creature — Human",
    color_identity: [],
    keywords: [],
    oracle_text: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// detectPairingType
// ---------------------------------------------------------------------------
describe("detectPairingType", () => {
  it("detects generic 'partner' keyword", () => {
    const card = makeScryfall({ keywords: ["Partner"] });
    expect(detectPairingType(card)).toBe("partner");
  });

  it("detects 'partner with' from oracle text", () => {
    const card = makeScryfall({ oracle_text: "Partner with Tymna the Weaver" });
    expect(detectPairingType(card)).toBe("partner_with");
  });

  it("detects 'friends forever' keyword", () => {
    const card = makeScryfall({ keywords: ["Friends Forever"] });
    expect(detectPairingType(card)).toBe("friends_forever");
  });

  it("detects 'choose a background' from oracle text", () => {
    const card = makeScryfall({ oracle_text: "Choose a Background" });
    expect(detectPairingType(card)).toBe("background");
  });

  it("detects doctor's companion from oracle text", () => {
    const card = makeScryfall({ oracle_text: "Doctor's companion" });
    expect(detectPairingType(card)).toBe("doctor");
  });

  it("detects character select from oracle text", () => {
    const card = makeScryfall({ oracle_text: "Partner—Character select" });
    expect(detectPairingType(card)).toBe("character_select");
  });

  it("returns 'none' for regular commander", () => {
    const card = makeScryfall({ keywords: [], oracle_text: "Flying, deathtouch" });
    expect(detectPairingType(card)).toBe("none");
  });

  it("handles missing keywords array gracefully", () => {
    const card = makeScryfall({ keywords: undefined, oracle_text: "" });
    expect(detectPairingType(card)).toBe("none");
  });

  it("friends_forever takes priority over partner check", () => {
    const card = makeScryfall({ keywords: ["Friends Forever", "Partner"] });
    expect(detectPairingType(card)).toBe("friends_forever");
  });
});

// ---------------------------------------------------------------------------
// canPairWith
// ---------------------------------------------------------------------------
describe("canPairWith", () => {
  it("partner + partner can pair", () => {
    expect(canPairWith("partner", "partner")).toBe(true);
  });

  it("partner_with + partner_with can pair", () => {
    expect(canPairWith("partner_with", "partner_with")).toBe(true);
  });

  it("friends_forever + friends_forever can pair", () => {
    expect(canPairWith("friends_forever", "friends_forever")).toBe(true);
  });

  it("character_select + character_select can pair", () => {
    expect(canPairWith("character_select", "character_select")).toBe(true);
  });

  it("background + none can pair (background is chosen by commander)", () => {
    expect(canPairWith("background", "none")).toBe(true);
  });

  it("doctor + none can pair", () => {
    expect(canPairWith("doctor", "none")).toBe(true);
  });

  it("partner + none cannot pair", () => {
    expect(canPairWith("partner", "none")).toBe(false);
  });

  it("none + none cannot pair", () => {
    expect(canPairWith("none", "none")).toBe(false);
  });

  it("partner + friends_forever cannot pair", () => {
    expect(canPairWith("partner", "friends_forever")).toBe(false);
  });

  it("partner_with + partner cannot pair", () => {
    expect(canPairWith("partner_with", "partner")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// partnerSlotLabel
// ---------------------------------------------------------------------------
describe("partnerSlotLabel", () => {
  it("returns 'Partner' for partner type", () => {
    expect(partnerSlotLabel("partner")).toBe("Partner");
  });

  it("returns 'Partner With' for partner_with", () => {
    expect(partnerSlotLabel("partner_with")).toBe("Partner With");
  });

  it("returns 'Friends Forever' for friends_forever", () => {
    expect(partnerSlotLabel("friends_forever")).toBe("Friends Forever");
  });

  it("returns 'Background' for background", () => {
    expect(partnerSlotLabel("background")).toBe("Background");
  });

  it("returns 'Doctor's Companion' for doctor", () => {
    expect(partnerSlotLabel("doctor")).toBe("Doctor's Companion");
  });

  it("returns 'Character Select Partner' for character_select", () => {
    expect(partnerSlotLabel("character_select")).toBe("Character Select Partner");
  });

  it("returns 'Partner' as default for none (fallback)", () => {
    expect(partnerSlotLabel("none")).toBe("Partner");
  });
});

// ---------------------------------------------------------------------------
// supportsPartner
// ---------------------------------------------------------------------------
describe("supportsPartner", () => {
  it("returns false for 'none'", () => {
    expect(supportsPartner("none")).toBe(false);
  });

  it("returns true for 'partner'", () => {
    expect(supportsPartner("partner")).toBe(true);
  });

  it("returns true for 'partner_with'", () => {
    expect(supportsPartner("partner_with")).toBe(true);
  });

  it("returns true for 'friends_forever'", () => {
    expect(supportsPartner("friends_forever")).toBe(true);
  });

  it("returns true for 'background'", () => {
    expect(supportsPartner("background")).toBe(true);
  });

  it("returns true for 'doctor'", () => {
    expect(supportsPartner("doctor")).toBe(true);
  });

  it("returns true for 'character_select'", () => {
    expect(supportsPartner("character_select")).toBe(true);
  });
});
