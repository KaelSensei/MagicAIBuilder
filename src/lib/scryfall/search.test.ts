import { describe, it, expect } from "vitest";
import {
  buildSearchQuery,
  buildCommanderSearchQuery,
  buildPartnerSearchQuery,
  buildSetSearchQuery,
  buildColorSearchQuery,
} from "./search";

describe("buildSearchQuery", () => {
  it("adds legal:commander always", () => {
    const q = buildSearchQuery("", {});
    expect(q).toContain("legal:commander");
  });

  it("wraps plain text in name regex", () => {
    const q = buildSearchQuery("bolt", {});
    expect(q).toContain("name:/bolt/");
  });

  it("passes through Scryfall syntax (contains :)", () => {
    const q = buildSearchQuery("type:instant", {});
    expect(q).toContain("type:instant");
    expect(q).not.toContain("name:/");
  });

  it("adds color identity filter", () => {
    const q = buildSearchQuery("", { colors: ["W", "U"] });
    expect(q).toContain("id<=WU");
  });

  it("adds type filter", () => {
    const q = buildSearchQuery("", { types: ["instant", "sorcery"] });
    expect(q).toContain("type:instant");
    expect(q).toContain("type:sorcery");
    expect(q).toContain(" OR ");
  });

  it("adds cmcMin filter", () => {
    const q = buildSearchQuery("", { cmcMin: 2 });
    expect(q).toContain("cmc>=2");
  });

  it("adds cmcMax filter", () => {
    const q = buildSearchQuery("", { cmcMax: 4 });
    expect(q).toContain("cmc<=4");
  });

  it("adds priceMax filter", () => {
    const q = buildSearchQuery("", { priceMax: 10 });
    expect(q).toContain("usd<=10");
  });

  it("ignores null cmcMin", () => {
    const q = buildSearchQuery("", { cmcMin: null });
    expect(q).not.toContain("cmc>=");
  });

  it("ignores null cmcMax", () => {
    const q = buildSearchQuery("", { cmcMax: null });
    expect(q).not.toContain("cmc<=");
  });

  it("handles empty text with no filters", () => {
    const q = buildSearchQuery("", {});
    expect(q).toBe("legal:commander");
  });

  it("trims whitespace from text", () => {
    const q = buildSearchQuery("  sol ring  ", {});
    expect(q).toContain("name:/sol ring/");
  });
});

describe("buildCommanderSearchQuery", () => {
  it("always includes is:commander", () => {
    const q = buildCommanderSearchQuery("", {});
    expect(q).toContain("is:commander");
  });

  it("adds name regex when text provided", () => {
    const q = buildCommanderSearchQuery("atraxa", {});
    expect(q).toContain("name:/atraxa/");
  });

  it("adds color filter when provided", () => {
    const q = buildCommanderSearchQuery("", { colors: ["G", "W"] });
    expect(q).toContain("id<=GW");
  });

  it("skips name part when text is empty", () => {
    const q = buildCommanderSearchQuery("", {});
    expect(q).not.toContain("name:/");
  });
});

describe("buildPartnerSearchQuery", () => {
  it("handles generic partner type", () => {
    const q = buildPartnerSearchQuery("partner", "");
    expect(q).toContain('o:"Partner"');
    expect(q).toContain('-o:"Partner with"');
    expect(q).toContain("is:commander");
  });

  it("handles friends_forever type", () => {
    const q = buildPartnerSearchQuery("friends_forever", "");
    expect(q).toContain('o:"Friends forever"');
  });

  it("handles character_select type", () => {
    const q = buildPartnerSearchQuery("character_select", "");
    expect(q).toContain('o:"Character select"');
  });

  it("handles partner_with type", () => {
    const q = buildPartnerSearchQuery("partner_with", "");
    expect(q).toContain('o:"Partner with"');
  });

  it("handles unknown type as default", () => {
    const q = buildPartnerSearchQuery("unknown", "");
    expect(q).toBe("is:commander");
  });

  it("adds name filter when text provided", () => {
    const q = buildPartnerSearchQuery("partner", "korvold");
    expect(q).toContain("name:/korvold/");
  });

  it("adds color filter for partner type", () => {
    const q = buildPartnerSearchQuery("partner", "", { colors: ["R"] });
    expect(q).toContain("id<=R");
  });
});

describe("buildSetSearchQuery", () => {
  it("includes set code", () => {
    const q = buildSetSearchQuery("DOM");
    expect(q).toContain("set:DOM");
  });

  it("includes legal:commander", () => {
    const q = buildSetSearchQuery("DOM");
    expect(q).toContain("legal:commander");
  });

  it("adds color filter when provided", () => {
    const q = buildSetSearchQuery("DOM", ["B", "G"]);
    expect(q).toContain("id<=BG");
  });

  it("skips color filter when empty", () => {
    const q = buildSetSearchQuery("DOM", []);
    expect(q).not.toContain("id<=");
  });
});

describe("buildColorSearchQuery", () => {
  it("includes legal:commander", () => {
    const q = buildColorSearchQuery(["W"]);
    expect(q).toContain("legal:commander");
  });

  it("uses id<= for non-exact match", () => {
    const q = buildColorSearchQuery(["U", "B"]);
    expect(q).toContain("id<=UB");
  });

  it("uses c= for exact match", () => {
    const q = buildColorSearchQuery(["R", "G"], "", true);
    expect(q).toContain("c=RG");
  });

  it("adds name filter when text provided", () => {
    const q = buildColorSearchQuery(["W"], "sol ring");
    expect(q).toContain("name:/sol ring/");
  });

  it("handles empty colors (colorless)", () => {
    const q = buildColorSearchQuery([]);
    expect(q).toBe("legal:commander");
  });

  it("handles no text with colors", () => {
    const q = buildColorSearchQuery(["G"]);
    expect(q).not.toContain("name:/");
  });
});
