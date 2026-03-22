import { describe, it, expect } from "vitest";
import {
  detectPairingType,
  canPairWith,
  partnerSlotLabel,
  supportsPartner,
} from "@/lib/deck/pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";

function makeCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "x",
    name: "X",
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Legendary Creature",
    oracle_text: "",
    color_identity: [],
    colors: [],
    keywords: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "rare",
    prices: { usd: null, usd_foil: null, eur: null },
    image_uris: { small: "", normal: "", large: "", art_crop: "", border_crop: "", png: "" },
    card_faces: undefined,
    legalities: { commander: "legal" },
    ...overrides,
  };
}

describe("detectPairingType", () => {
  it("returns 'none' for a regular commander", () => {
    expect(detectPairingType(makeCard())).toBe("none");
  });

  it("detects 'partner' from keywords", () => {
    expect(detectPairingType(makeCard({ keywords: ["Partner"] }))).toBe("partner");
  });

  it("detects 'partner_with' from oracle text", () => {
    expect(
      detectPairingType(makeCard({ oracle_text: "Partner with Raff Capashen (When this creature enters the battlefield, target player may put Raff Capashen from their library or graveyard into their hand.)" }))
    ).toBe("partner_with");
  });

  it("detects 'friends_forever' from keywords", () => {
    expect(detectPairingType(makeCard({ keywords: ["Friends forever"] }))).toBe("friends_forever");
  });

  it("detects 'friends_forever' from oracle text", () => {
    expect(
      detectPairingType(makeCard({ oracle_text: "Friends forever (You can have two commanders if both have friends forever.)" }))
    ).toBe("friends_forever");
  });

  it("detects 'background' from oracle text", () => {
    expect(
      detectPairingType(makeCard({ oracle_text: "Choose a Background (You can have a Background as a second commander.)" }))
    ).toBe("background");
  });

  it("detects 'doctor' from keywords", () => {
    expect(detectPairingType(makeCard({ keywords: ["Doctor's companion"] }))).toBe("doctor");
  });

  it("detects 'character_select' from oracle text", () => {
    expect(
      detectPairingType(makeCard({ oracle_text: "Partner—Character select (You can have two commanders with Character select.)" }))
    ).toBe("character_select");
  });

  it("prioritizes 'friends_forever' over 'partner'", () => {
    expect(
      detectPairingType(
        makeCard({ keywords: ["Friends forever", "Partner"] })
      )
    ).toBe("friends_forever");
  });
});

describe("canPairWith", () => {
  it("partner pairs with partner", () => {
    expect(canPairWith("partner", "partner")).toBe(true);
  });

  it("partner does not pair with friends_forever", () => {
    expect(canPairWith("partner", "friends_forever")).toBe(false);
  });

  it("friends_forever pairs with friends_forever", () => {
    expect(canPairWith("friends_forever", "friends_forever")).toBe(true);
  });

  it("partner_with pairs with partner_with", () => {
    expect(canPairWith("partner_with", "partner_with")).toBe(true);
  });

  it("background pairs with none (the background card has no pairing type)", () => {
    expect(canPairWith("background", "none")).toBe(true);
  });

  it("doctor pairs with none", () => {
    expect(canPairWith("doctor", "none")).toBe(true);
  });

  it("character_select pairs with character_select", () => {
    expect(canPairWith("character_select", "character_select")).toBe(true);
  });

  it("none does not pair with anything", () => {
    expect(canPairWith("none", "partner")).toBe(false);
    expect(canPairWith("none", "none")).toBe(false);
  });
});

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

  it("returns 'Doctor\\'s Companion' for doctor", () => {
    expect(partnerSlotLabel("doctor")).toBe("Doctor's Companion");
  });

  it("returns 'Character Select Partner' for character_select", () => {
    expect(partnerSlotLabel("character_select")).toBe("Character Select Partner");
  });

  it("returns 'Partner' for none (default)", () => {
    expect(partnerSlotLabel("none")).toBe("Partner");
  });
});

describe("supportsPartner", () => {
  it("returns true for all pairing types except none", () => {
    expect(supportsPartner("partner")).toBe(true);
    expect(supportsPartner("partner_with")).toBe(true);
    expect(supportsPartner("friends_forever")).toBe(true);
    expect(supportsPartner("background")).toBe(true);
    expect(supportsPartner("doctor")).toBe(true);
    expect(supportsPartner("character_select")).toBe(true);
  });

  it("returns false for none", () => {
    expect(supportsPartner("none")).toBe(false);
  });
});
