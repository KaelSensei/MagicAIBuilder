import { describe, expect, it } from "vitest";
import { parseDeckSearchQuery, serializeDeckSearchQuery } from "./deck-search-query";

/** Parses a query string the way a page receives it. */
function parse(search: string) {
  return parseDeckSearchQuery(new URLSearchParams(search));
}

describe("parseDeckSearchQuery", () => {
  it("reads an empty URL as the browse page: no filter, quality defaults on, recently updated first", () => {
    expect(parse("")).toEqual({
      cards: { all: [], any: [], none: [] },
      declaredBrackets: [],
      qualityDefaults: true,
      hasPrimer: false,
      seekingFeedback: false,
      originalsOnly: false,
      excludeAiBuilt: false,
      sort: "updated",
    });
  });
});

describe("serializeDeckSearchQuery", () => {
  it("writes the browse page as an empty query string, so the unfiltered page has one URL", () => {
    expect(serializeDeckSearchQuery(parse(""))).toBe("");
  });
});

/** The canonical query string of a URL the player typed or followed. */
function canonical(search: string): string {
  return serializeDeckSearchQuery(parse(search));
}

describe("the deck search URL", () => {
  it("keeps a named sort and drops an unknown one back to recently updated", () => {
    expect(parse("sort=price-desc").sort).toBe("price-desc");
    expect(canonical("sort=votes")).toBe("sort=votes");
    expect(canonical("sort=views")).toBe("");
    expect(canonical("sort=updated")).toBe("");
  });

  it("turns a switch filter on only when its key says 1", () => {
    expect(parse("primer=1&feedback=1&original=1&no-ai=1")).toMatchObject({
      hasPrimer: true,
      seekingFeedback: true,
      originalsOnly: true,
      excludeAiBuilt: true,
    });
    expect(canonical("no-ai=1&primer=1")).toBe("primer=1&no-ai=1");
    expect(canonical("primer=true&feedback=0&original=")).toBe("");
  });

  it("keeps the quality defaults on unless the player turned them off", () => {
    expect(parse("quality=off").qualityDefaults).toBe(false);
    expect(canonical("quality=off")).toBe("quality=off");
    expect(canonical("quality=on")).toBe("");
    expect(canonical("quality=no")).toBe("");
  });

  it("keeps declared brackets 1 to 5 once each, in ascending order", () => {
    expect(parse("bracket=4&bracket=2&bracket=4").declaredBrackets).toEqual([2, 4]);
    expect(canonical("bracket=4&bracket=2&bracket=4")).toBe("bracket=2&bracket=4");
    expect(canonical("bracket=0&bracket=6&bracket=2.5&bracket=x&bracket=")).toBe("");
  });

  it("keeps each card list trimmed, without duplicates, in name order", () => {
    const query = parse(
      "card=Smothering+Tithe&card=++Sol+++Ring+&card=Sol+Ring&any-card=Cyclonic+Rift&no-card=Rhystic+Study&no-card=+"
    );
    expect(query.cards).toEqual({
      all: ["Smothering Tithe", "Sol Ring"],
      any: ["Cyclonic Rift"],
      none: ["Rhystic Study"],
    });
    expect(serializeDeckSearchQuery(query)).toBe(
      "card=Smothering+Tithe&card=Sol+Ring&any-card=Cyclonic+Rift&no-card=Rhystic+Study"
    );
  });

  it("keeps the first ten distinct cards of a list and drops the rest", () => {
    const typed = ["Z", "Y", "X", "W", "V", "U", "T", "S", "R", "Q", "P", "O"];
    const search = typed.map((name) => `no-card=${name}`).join("&");
    expect(parse(search).cards.none).toEqual(["Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]);
  });

  it("drops a card name longer than 200 characters, which no card has", () => {
    expect(parse(`card=${"a".repeat(201)}&card=${"b".repeat(200)}`).cards.all).toEqual([
      "b".repeat(200),
    ]);
  });

  it("keeps the deck name text trimmed and drops it when blank or too long", () => {
    expect(parse("q=++Esper+++Stax+").nameContains).toBe("Esper Stax");
    expect(canonical("q=++Esper+++Stax+")).toBe("q=Esper+Stax");
    expect(canonical("q=+++")).toBe("");
    expect(canonical(`q=${"a".repeat(201)}`)).toBe("");
  });

  it("keeps an author only when the value can name an account", () => {
    expect(parse("author=kael_42").author).toBe("kael_42");
    expect(canonical("author=kael_42")).toBe("author=kael_42");
    expect(canonical("author=kael+42")).toBe("");
    expect(canonical("author=")).toBe("");
  });

  it("keeps a commander slug only when a commander's name could produce it", () => {
    expect(parse("commander=atraxa-grand-unifier").commander).toBe("atraxa-grand-unifier");
    expect(canonical("commander=atraxa-grand-unifier")).toBe("commander=atraxa-grand-unifier");
    expect(canonical("commander=Atraxa%2C+Grand+Unifier")).toBe("");
    expect(canonical("commander=---")).toBe("");
  });

  it("writes a commander pair in name order, so either order is one search", () => {
    expect(parse("commander=tymna-the-weaver&partner=thrasios-triton-hero")).toMatchObject({
      commander: "thrasios-triton-hero",
      partner: "tymna-the-weaver",
    });
    expect(canonical("partner=tymna-the-weaver&commander=thrasios-triton-hero")).toBe(
      "commander=thrasios-triton-hero&partner=tymna-the-weaver"
    );
    expect(canonical("commander=tymna-the-weaver&partner=tymna-the-weaver")).toBe(
      "commander=tymna-the-weaver"
    );
  });

  it("drops a partner named without a commander", () => {
    expect(canonical("partner=tymna-the-weaver")).toBe("");
    expect(canonical("commander=%3F&partner=tymna-the-weaver")).toBe("");
  });

  it("reads colour identity letters in any order or case as WUBRG, exactly by default", () => {
    expect(parse("colors=GwU").colorIdentity).toEqual({
      match: "exactly",
      colors: ["W", "U", "G"],
    });
    expect(canonical("colors=GwUg")).toBe("colors=wug");
    expect(canonical("colors=c")).toBe("colors=c");
    expect(parse("colors=C").colorIdentity).toEqual({ match: "exactly", colors: [] });
  });

  it("drops a colour identity with an unknown letter, or colourless mixed with colours", () => {
    expect(canonical("colors=wx")).toBe("");
    expect(canonical("colors=wc")).toBe("");
    expect(canonical("colors=")).toBe("");
  });

  it("compares colours exactly, within or including, and drops a mode without colours", () => {
    expect(parse("colors=wu&match=within").colorIdentity).toEqual({
      match: "within",
      colors: ["W", "U"],
    });
    expect(canonical("match=including&colors=g")).toBe("colors=g&match=including");
    expect(canonical("colors=g&match=exactly")).toBe("colors=g");
    expect(canonical("colors=g&match=most")).toBe("colors=g");
    expect(canonical("match=within")).toBe("");
  });

  it("writes colour searches that match the same decks as one URL", () => {
    expect(canonical("colors=c&match=within")).toBe("colors=c");
    expect(canonical("colors=wubrg&match=including")).toBe("colors=wubrg");
    expect(canonical("colors=c&match=including")).toBe("");
    expect(canonical("colors=wubrg&match=within")).toBe("");
  });

  it("keeps an update window of 30, 90, 180 or 365 days only", () => {
    expect(parse("updated=90").updatedWithinDays).toBe(90);
    expect(canonical("updated=365")).toBe("updated=365");
    expect(canonical("updated=7")).toBe("");
    expect(canonical("updated=090")).toBe("");
  });

  it("keeps a listed-since day only when it is a calendar date", () => {
    expect(parse("listed-since=2026-02-28").listedSince).toBe("2026-02-28");
    expect(canonical("listed-since=2024-02-29")).toBe("listed-since=2024-02-29");
    expect(canonical("listed-since=2026-02-29")).toBe("");
    expect(canonical("listed-since=2026-2-3")).toBe("");
    expect(canonical("listed-since=2026-11-17T00%3A00%3A00Z")).toBe("");
  });

  it("keeps a price range in whole US dollars, either bound alone, low bound first", () => {
    expect(parse("price-max=150").priceUsd).toEqual({ max: 150 });
    expect(canonical("price-min=0&price-max=150")).toBe("price-min=0&price-max=150");
    expect(canonical("price-min=300&price-max=150")).toBe("price-min=150&price-max=300");
    expect(canonical("price-min=-5&price-max=12.50")).toBe("");
    expect(canonical("price-max=1e3&price-min=")).toBe("");
  });

  it("keeps a page cursor of URL-safe characters and drops a malformed or oversized one", () => {
    expect(parse("cursor=eyJ1IjoxfQ_-").cursor).toBe("eyJ1IjoxfQ_-");
    expect(canonical("cursor=eyJ1IjoxfQ_-")).toBe("cursor=eyJ1IjoxfQ_-");
    expect(canonical("cursor=a%2Fb%3D")).toBe("");
    expect(canonical(`cursor=${"a".repeat(201)}`)).toBe("");
  });
});

describe("the canonical deck search URL", () => {
  const SCRAMBLED =
    "cursor=abc&sort=votes&no-ai=1&original=1&feedback=1&primer=1&quality=off&bracket=3" +
    "&price-max=150&price-min=20&no-card=Rhystic+Study&any-card=Cyclonic+Rift" +
    "&card=Smothering+Tithe&listed-since=2026-01-01&updated=365&author=kael" +
    "&match=including&colors=gw&partner=tymna-the-weaver&commander=thrasios-triton-hero" +
    "&q=Esper&utm_source=discord&page=3";
  const CANONICAL =
    "q=Esper&commander=thrasios-triton-hero&partner=tymna-the-weaver&colors=wg&match=including" +
    "&author=kael&updated=365&listed-since=2026-01-01&card=Smothering+Tithe" +
    "&any-card=Cyclonic+Rift&no-card=Rhystic+Study&price-min=20&price-max=150&bracket=3" +
    "&quality=off&primer=1&feedback=1&original=1&no-ai=1&sort=votes&cursor=abc";

  it("writes every key in one fixed order and drops keys the search does not know", () => {
    expect(canonical(SCRAMBLED)).toBe(CANONICAL);
  });

  it("reads back the same search it wrote", () => {
    const query = parse(SCRAMBLED);
    expect(parse(serializeDeckSearchQuery(query))).toEqual(query);
    expect(canonical(CANONICAL)).toBe(CANONICAL);
  });

  it("reads the first value of a key that takes one value", () => {
    expect(canonical("sort=votes&sort=listed&q=Esper&q=Grixis")).toBe("q=Esper&sort=votes");
  });
});
