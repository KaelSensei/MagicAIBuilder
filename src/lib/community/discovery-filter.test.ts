import { describe, expect, it } from "vitest";
import { filterDiscoveryDecks } from "./discovery-filter";

const DECKS = [
  { name: "Direction B", commander: { name: "Atraxa, Grand Unifier" } },
  { name: "Lands", commander: { name: "Tatyova, Benthic Druid" } },
] as const;

describe("filterDiscoveryDecks", () => {
  it("returns the full list when the query is blank", () => {
    expect(filterDiscoveryDecks(DECKS, "  ")).toEqual(DECKS);
  });

  it("matches a deck name or its commander", () => {
    expect(filterDiscoveryDecks(DECKS, "atraxa").map((deck) => deck.name)).toEqual([
      "Direction B",
    ]);
    expect(filterDiscoveryDecks(DECKS, "LANDS").map((deck) => deck.name)).toEqual(["Lands"]);
  });
});
