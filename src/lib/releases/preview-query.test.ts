import { describe, expect, it } from "vitest";
import { previewQuery } from "./preview-query";
import { buildSearchQuery, buildSetSearchQuery } from "@/lib/scryfall/search";

/** The day these tests run on, at noon UTC so no time zone moves the calendar day. */
const TODAY = new Date("2026-11-15T12:00:00Z");

describe("previewQuery", () => {
  it("lets cards released after today through the format filter, on paper only", () => {
    expect(previewQuery("set:mdd legal:commander", TODAY)).toBe(
      "set:mdd (legal:commander or date>2026-11-15) game:paper"
    );
  });

  it.each([
    ["has no format filter", "t:dragon c:r"],
    ["only excludes a format", "t:dragon -legal:commander"],
  ])("leaves a query that %s exactly as the player sees it", (_case, query) => {
    expect(previewQuery(query, TODAY)).toBe(query);
  });

  it("asks for paper cards once when the query already does", () => {
    expect(previewQuery("game:paper legal:commander t:elf", TODAY)).toBe(
      "game:paper (legal:commander or date>2026-11-15) t:elf"
    );
  });

  it("keeps every other part of the builder's search query, in order", () => {
    const query = buildSearchQuery("t:dragon", { colors: ["R"], landFilter: true });

    expect(previewQuery(query, TODAY)).toBe(
      `${query.replace("legal:commander", "(legal:commander or date>2026-11-15)")} game:paper`
    );
  });

  it("widens the set browser's query for the deck's own format", () => {
    expect(previewQuery(buildSetSearchQuery("mdd", ["B", "R"], "brawl"), TODAY)).toBe(
      "set:mdd (legal:brawl or date>2026-11-15) id<=BR game:paper"
    );
  });
});
