import { describe, it, expect } from "vitest";
import {
  buildSearchQuery,
  buildCommanderSearchQuery,
  buildPartnerSearchQuery,
  buildSetSearchQuery,
  buildColorSearchQuery,
  buildInteractionQuery,
  buildColorQuery,
} from "./search";

describe("buildColorQuery", () => {
  it("OR mode → id<= (within identity, permissive)", () => {
    expect(buildColorQuery(["W", "U"], "or")).toBe("id<=WU");
  });
  it("AND mode → c>= (all selected colors present)", () => {
    expect(buildColorQuery(["R", "G"], "and")).toBe("c>=RG");
  });
  it("EXACT mode → c= (exactly these colors, no more)", () => {
    expect(buildColorQuery(["R", "G"], "exact")).toBe("c=RG");
  });
  it("returns empty string for empty color array", () => {
    expect(buildColorQuery([], "or")).toBe("");
    expect(buildColorQuery([], "exact")).toBe("");
  });
});

describe("buildInteractionQuery", () => {
  it("removal → destroy/exile target oracle text", () => {
    const q = buildInteractionQuery("removal");
    expect(q).toContain('o:"destroy target"');
    expect(q).toContain('o:"exile target"');
  });
  it("counterspell → t:instant + counter target", () => {
    const q = buildInteractionQuery("counterspell");
    expect(q).toContain("t:instant");
    expect(q).toContain('o:"counter target"');
  });
  it("wipe → destroy all / exile all", () => {
    const q = buildInteractionQuery("wipe");
    expect(q).toContain('o:"destroy all"');
    expect(q).toContain('o:"exile all"');
  });
  it("tutor → search your library", () => {
    expect(buildInteractionQuery("tutor")).toContain('o:"search your library"');
  });
  it("draw → draw a card", () => {
    expect(buildInteractionQuery("draw")).toContain('o:"draw a card"');
  });
  it("ramp → t:land or add { mana oracle", () => {
    const q = buildInteractionQuery("ramp");
    expect(q).toContain("t:land");
    expect(q).toContain('o:"add {"');
  });
});

describe("buildSearchQuery", () => {
  it("always appends legal:commander", () => {
    expect(buildSearchQuery("", {})).toContain("legal:commander");
  });
  it("wraps plain text in name regex", () => {
    expect(buildSearchQuery("bolt", {})).toContain("name:/bolt/");
  });
  it("passes through raw Scryfall syntax (contains :)", () => {
    const q = buildSearchQuery("type:instant", {});
    expect(q).toContain("type:instant");
    expect(q).not.toContain("name:/");
  });
  it("trims whitespace from text", () => {
    expect(buildSearchQuery("  sol ring  ", {})).toContain("name:/sol ring/");
  });
  it("handles empty text with no filters → only legal:commander", () => {
    expect(buildSearchQuery("", {})).toBe("legal:commander");
  });

  // Color modes
  it("color OR mode → id<=WUBRG (permissive, default)", () => {
    const q = buildSearchQuery("", { colors: ["W", "U"], colorMode: "or" });
    expect(q).toContain("id<=WU");
    expect(q).not.toContain("c>=");
  });
  it("color AND mode → c>=WUBRG (all colors present)", () => {
    const q = buildSearchQuery("", { colors: ["R", "G"], colorMode: "and" });
    expect(q).toContain("c>=RG");
    expect(q).not.toContain("id<=");
  });
  it("color EXACT mode → c=WUBRG (exactly these colors)", () => {
    const q = buildSearchQuery("", { colors: ["R", "G"], colorMode: "exact" });
    expect(q).toContain("c=RG");
    expect(q).not.toContain("id<=");
  });
  it("falls back to OR (id<=) when colorMode is undefined", () => {
    expect(buildSearchQuery("", { colors: ["U"] })).toContain("id<=U");
  });

  // Colorless & lands
  it("colorlessFilter → c:c (truly colorless)", () => {
    const q = buildSearchQuery("", { colorlessFilter: true });
    expect(q).toContain("c:c");
    expect(q).not.toContain("id<=");
  });
  it("colorlessFilter takes priority over WUBRG colors", () => {
    const q = buildSearchQuery("", { colors: ["W"], colorMode: "or", colorlessFilter: true });
    expect(q).toContain("c:c");
    expect(q).not.toContain("id<=");
  });
  it("landFilter → t:land", () => {
    expect(buildSearchQuery("", { landFilter: true })).toContain("t:land");
  });
  it("landFilter combines with color filter", () => {
    const q = buildSearchQuery("", { colors: ["G"], colorMode: "or", landFilter: true });
    expect(q).toContain("id<=G");
    expect(q).toContain("t:land");
  });

  // Card types
  it("adds type filter (OR-joined)", () => {
    const q = buildSearchQuery("", { types: ["instant", "sorcery"] });
    expect(q).toContain("type:instant");
    expect(q).toContain("type:sorcery");
    expect(q).toContain(" OR ");
  });

  // CMC modes
  it("CMC range mode → cmc>=min cmc<=max", () => {
    const q = buildSearchQuery("", { cmcMode: "range", cmcMin: 2, cmcMax: 5 });
    expect(q).toContain("cmc>=2");
    expect(q).toContain("cmc<=5");
  });
  it("CMC exact mode → cmc=N", () => {
    const q = buildSearchQuery("", { cmcMode: "exact", cmcExact: 3 });
    expect(q).toContain("cmc=3");
    expect(q).not.toContain("cmc>=");
    expect(q).not.toContain("cmc<=");
  });
  it("CMC min mode → cmc>=N only", () => {
    const q = buildSearchQuery("", { cmcMode: "min", cmcMin: 2 });
    expect(q).toContain("cmc>=2");
    expect(q).not.toContain("cmc<=");
  });
  it("CMC max mode → cmc<=N only", () => {
    const q = buildSearchQuery("", { cmcMode: "max", cmcMax: 4 });
    expect(q).toContain("cmc<=4");
    expect(q).not.toContain("cmc>=");
  });
  it("defaults to range mode when cmcMode undefined", () => {
    const q = buildSearchQuery("", { cmcMin: 1, cmcMax: 3 });
    expect(q).toContain("cmc>=1");
    expect(q).toContain("cmc<=3");
  });
  it("ignores null cmcMin in range mode", () => {
    expect(buildSearchQuery("", { cmcMin: null })).not.toContain("cmc>=");
  });
  it("ignores null cmcMax in range mode", () => {
    expect(buildSearchQuery("", { cmcMax: null })).not.toContain("cmc<=");
  });
  it("ignores null cmcExact in exact mode", () => {
    expect(buildSearchQuery("", { cmcMode: "exact", cmcExact: null })).not.toContain("cmc=");
  });

  // Price
  it("priceMin → usd>=N", () => {
    expect(buildSearchQuery("", { priceMin: 2 })).toContain("usd>=2");
  });
  it("priceMax → usd<=N", () => {
    expect(buildSearchQuery("", { priceMax: 10 })).toContain("usd<=10");
  });
  it("price range → both bounds", () => {
    const q = buildSearchQuery("", { priceMin: 1, priceMax: 50 });
    expect(q).toContain("usd>=1");
    expect(q).toContain("usd<=50");
  });

  // Subtype
  it("subtype → t:<value> (Scryfall subtype syntax)", () => {
    expect(buildSearchQuery("", { subtype: "Elf" })).toContain("t:Elf");
  });
  it("subtype lowercase: t:elf", () => {
    expect(buildSearchQuery("", { subtype: "elf" })).toContain("t:elf");
  });
  it("ignores empty subtype", () => {
    expect(buildSearchQuery("", { subtype: "" })).not.toContain("t:Elf");
  });
  it("ignores whitespace-only subtype", () => {
    expect(buildSearchQuery("", { subtype: "   " })).not.toContain("t:");
  });

  // Keyword
  it("keyword → keyword:<value> (Scryfall keyword syntax)", () => {
    expect(buildSearchQuery("", { keyword: "Flying" })).toContain("keyword:Flying");
  });
  it("keyword lowercase: keyword:flying", () => {
    expect(buildSearchQuery("", { keyword: "flying" })).toContain("keyword:flying");
  });
  it("ignores empty keyword", () => {
    expect(buildSearchQuery("", { keyword: "" })).not.toContain("keyword:");
  });

  // Power / Toughness
  it("powerMin → pow>=N", () => {
    expect(buildSearchQuery("", { powerMin: 3 })).toContain("pow>=3");
  });
  it("powerMax → pow<=N", () => {
    expect(buildSearchQuery("", { powerMax: 5 })).toContain("pow<=5");
  });
  it("power range → both bounds", () => {
    const q = buildSearchQuery("", { powerMin: 2, powerMax: 6 });
    expect(q).toContain("pow>=2");
    expect(q).toContain("pow<=6");
  });
  it("toughnessMin → tou>=N", () => {
    expect(buildSearchQuery("", { toughnessMin: 2 })).toContain("tou>=2");
  });
  it("toughnessMax → tou<=N", () => {
    expect(buildSearchQuery("", { toughnessMax: 4 })).toContain("tou<=4");
  });
  it("toughness range → both bounds", () => {
    const q = buildSearchQuery("", { toughnessMin: 1, toughnessMax: 4 });
    expect(q).toContain("tou>=1");
    expect(q).toContain("tou<=4");
  });

  // Interaction type
  it("removal → oracle text for destroy/exile target", () => {
    const q = buildSearchQuery("", { interactionType: "removal" });
    expect(q).toContain('o:"destroy target"');
    expect(q).toContain('o:"exile target"');
  });
  it("counterspell → oracle text for counter target instant", () => {
    const q = buildSearchQuery("", { interactionType: "counterspell" });
    expect(q).toContain('o:"counter target"');
    expect(q).toContain("t:instant");
  });
  it("wipe → oracle text for destroy/exile all", () => {
    const q = buildSearchQuery("", { interactionType: "wipe" });
    expect(q).toContain('o:"destroy all"');
    expect(q).toContain('o:"exile all"');
  });
  it("tutor → oracle text for search your library", () => {
    expect(buildSearchQuery("", { interactionType: "tutor" })).toContain('o:"search your library"');
  });
  it("draw → oracle text for draw a card", () => {
    expect(buildSearchQuery("", { interactionType: "draw" })).toContain('o:"draw a card"');
  });
  it("ramp → oracle text for land or mana production", () => {
    const q = buildSearchQuery("", { interactionType: "ramp" });
    expect(q).toContain('o:"add {"');
    expect(q).toContain("t:land");
  });
  it("null interactionType adds nothing", () => {
    expect(buildSearchQuery("", { interactionType: null })).not.toContain('o:"');
  });
});

describe("buildCommanderSearchQuery", () => {
  it("always includes is:commander", () => {
    expect(buildCommanderSearchQuery("", {})).toContain("is:commander");
  });
  it("adds name regex when text provided", () => {
    expect(buildCommanderSearchQuery("atraxa", {})).toContain("name:/atraxa/");
  });
  it("adds color filter when provided", () => {
    expect(buildCommanderSearchQuery("", { colors: ["G", "W"] })).toContain("id<=GW");
  });
  it("skips name part when text is empty", () => {
    expect(buildCommanderSearchQuery("", {})).not.toContain("name:/");
  });
});

describe("buildPartnerSearchQuery", () => {
  it("partner type includes Partner oracle text", () => {
    const q = buildPartnerSearchQuery("partner", "");
    expect(q).toContain('o:"Partner"');
    expect(q).toContain('-o:"Partner with"');
    expect(q).toContain("is:commander");
  });
  it("friends_forever type", () => {
    expect(buildPartnerSearchQuery("friends_forever", "")).toContain('o:"Friends forever"');
  });
  it("character_select type", () => {
    expect(buildPartnerSearchQuery("character_select", "")).toContain('o:"Character select"');
  });
  it("partner_with type", () => {
    expect(buildPartnerSearchQuery("partner_with", "")).toContain('o:"Partner with"');
  });
  it("unknown type → is:commander only", () => {
    expect(buildPartnerSearchQuery("unknown", "")).toBe("is:commander");
  });
  it("adds name filter when text provided", () => {
    expect(buildPartnerSearchQuery("partner", "korvold")).toContain("name:/korvold/");
  });
  it("adds color filter for partner type", () => {
    expect(buildPartnerSearchQuery("partner", "", { colors: ["R"] })).toContain("id<=R");
  });
});

describe("buildSetSearchQuery", () => {
  it("includes set code", () => {
    expect(buildSetSearchQuery("DOM")).toContain("set:DOM");
  });
  it("includes legal:commander", () => {
    expect(buildSetSearchQuery("DOM")).toContain("legal:commander");
  });
  it("adds color filter when provided", () => {
    expect(buildSetSearchQuery("DOM", ["B", "G"])).toContain("id<=BG");
  });
  it("skips color filter when empty", () => {
    expect(buildSetSearchQuery("DOM", [])).not.toContain("id<=");
  });
});

describe("buildColorSearchQuery", () => {
  it("includes legal:commander", () => {
    expect(buildColorSearchQuery(["W"])).toContain("legal:commander");
  });
  it("uses id<= for non-exact match", () => {
    expect(buildColorSearchQuery(["U", "B"])).toContain("id<=UB");
  });
  it("uses c= for exact match", () => {
    expect(buildColorSearchQuery(["R", "G"], "", true)).toContain("c=RG");
  });
  it("adds name filter when text provided", () => {
    expect(buildColorSearchQuery(["W"], "sol ring")).toContain("name:/sol ring/");
  });
  it("handles empty colors (colorless)", () => {
    expect(buildColorSearchQuery([])).toBe("legal:commander");
  });
  it("handles no text with colors", () => {
    expect(buildColorSearchQuery(["G"])).not.toContain("name:/");
  });
});
