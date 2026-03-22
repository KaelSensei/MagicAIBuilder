import { describe, it, expect } from "vitest";
import {
  buildSearchQuery,
  buildCommanderSearchQuery,
  buildPartnerSearchQuery,
  buildSetSearchQuery,
  buildColorSearchQuery,
} from "@/lib/scryfall/search";

describe("buildSearchQuery", () => {
  it("adds legal:commander always", () => {
    const q = buildSearchQuery("");
    expect(q).toContain("legal:commander");
  });

  it("wraps plain text in name regex", () => {
    const q = buildSearchQuery("Lightning Bolt");
    expect(q).toContain("name:/Lightning Bolt/");
  });

  it("passes through raw Scryfall syntax (contains :)", () => {
    const q = buildSearchQuery("type:instant o:draw");
    expect(q).toContain("type:instant o:draw");
    expect(q).not.toContain("name:/");
  });

  it("adds color filter", () => {
    const q = buildSearchQuery("", { colors: ["W", "U"] });
    expect(q).toContain("id<=WU");
  });

  it("adds type filter with OR", () => {
    const q = buildSearchQuery("", { types: ["Creature", "Instant"] });
    expect(q).toContain("(type:Creature OR type:Instant)");
  });

  it("adds cmc filters", () => {
    const q = buildSearchQuery("", { cmcMin: 2, cmcMax: 4 });
    expect(q).toContain("cmc>=2");
    expect(q).toContain("cmc<=4");
  });

  it("adds price filter", () => {
    const q = buildSearchQuery("", { priceMax: 5 });
    expect(q).toContain("usd<=5");
  });

  it("handles empty filters gracefully", () => {
    const q = buildSearchQuery("Sol Ring", {});
    expect(q).toContain("name:/Sol Ring/");
    expect(q).toContain("legal:commander");
  });
});

describe("buildCommanderSearchQuery", () => {
  it("always includes is:commander", () => {
    const q = buildCommanderSearchQuery("");
    expect(q).toContain("is:commander");
  });

  it("adds name filter when text provided", () => {
    const q = buildCommanderSearchQuery("Atraxa");
    expect(q).toContain("name:/Atraxa/");
  });

  it("adds color filter", () => {
    const q = buildCommanderSearchQuery("", { colors: ["G"] });
    expect(q).toContain("id<=G");
  });
});

describe("buildPartnerSearchQuery", () => {
  it("partner type query includes Partner keyword filter", () => {
    const q = buildPartnerSearchQuery("partner", "");
    expect(q).toContain('o:"Partner"');
    expect(q).toContain("is:commander");
  });

  it("friends_forever type query includes Friends forever filter", () => {
    const q = buildPartnerSearchQuery("friends_forever", "");
    expect(q).toContain('o:"Friends forever"');
  });

  it("character_select type query includes Character select filter", () => {
    const q = buildPartnerSearchQuery("character_select", "");
    expect(q).toContain('o:"Character select"');
  });

  it("partner_with type query includes Partner with filter", () => {
    const q = buildPartnerSearchQuery("partner_with", "");
    expect(q).toContain('o:"Partner with"');
  });

  it("unknown type defaults to is:commander", () => {
    const q = buildPartnerSearchQuery("none", "");
    expect(q).toContain("is:commander");
  });

  it("adds name part when text provided", () => {
    const q = buildPartnerSearchQuery("partner", "Tana");
    expect(q).toContain("name:/Tana/");
  });

  it("adds color filter when provided", () => {
    const q = buildPartnerSearchQuery("partner", "", { colors: ["R"] });
    expect(q).toContain("id<=R");
  });
});

describe("buildSetSearchQuery", () => {
  it("includes set code and legal:commander", () => {
    const q = buildSetSearchQuery("cmd");
    expect(q).toContain("set:cmd");
    expect(q).toContain("legal:commander");
  });

  it("adds color filter when provided", () => {
    const q = buildSetSearchQuery("cmd", ["W", "B"]);
    expect(q).toContain("id<=WB");
  });
});

describe("buildColorSearchQuery", () => {
  it("includes legal:commander", () => {
    const q = buildColorSearchQuery(["W"]);
    expect(q).toContain("legal:commander");
  });

  it("adds name filter when text provided", () => {
    const q = buildColorSearchQuery(["W"], "Path");
    expect(q).toContain("name:/Path/");
  });

  it("uses id<= for non-exact color filter", () => {
    const q = buildColorSearchQuery(["W", "U"]);
    expect(q).toContain("id<=WU");
  });

  it("uses c= for exact color filter", () => {
    const q = buildColorSearchQuery(["W", "U"], "", true);
    expect(q).toContain("c=WU");
    expect(q).not.toContain("id<=WU");
  });

  it("handles empty color array (colorless)", () => {
    const q = buildColorSearchQuery([]);
    expect(q).toContain("legal:commander");
    expect(q).not.toContain("id<=");
  });
});
