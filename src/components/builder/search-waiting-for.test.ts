/**
 * What the builder's search panel waits for before its tab sends a search.
 *
 * Solitary: `searchWaitingFor` is a pure policy. The queries below are the ones the page builds
 * (`buildSearchQueryFromMode` in `page.tsx`); `page.search-query.test.tsx` renders the result.
 *
 * @module components/builder/search-waiting-for.test
 */
import { describe, expect, it } from "vitest";
import { searchWaitingFor } from "./search-waiting-for";

describe("searchWaitingFor", () => {
  it("waits for a set on By Set while no set is chosen", () => {
    expect(searchWaitingFor("set", "")).toBe("set");
  });

  it("waits for colours on By Color while neither a colour nor a name is given", () => {
    expect(searchWaitingFor("color", "")).toBe("colors");
  });

  it("waits while the query is too short for the search hooks to send", () => {
    expect(searchWaitingFor("set", " x ")).toBe("set");
  });

  it("waits for nothing once By Set has a set to search", () => {
    expect(searchWaitingFor("set", "set:dsk legal:commander")).toBeNull();
  });

  it("waits for nothing once By Color has a colour or a name to search", () => {
    expect(searchWaitingFor("color", "legal:commander id<=W")).toBeNull();
    expect(searchWaitingFor("color", "legal:commander name:/sol/")).toBeNull();
  });

  // A pick's query replaces the tab's, so the tab's own fields do not decide.
  it("waits for nothing while a commander pick sends its own query on By Set", () => {
    expect(searchWaitingFor("set", "is:commander")).toBeNull();
  });

  it("never waits on the name search, which lists cards with an empty text box", () => {
    expect(searchWaitingFor("name", "legal:commander")).toBeNull();
    expect(searchWaitingFor("name", "")).toBeNull();
  });
});
