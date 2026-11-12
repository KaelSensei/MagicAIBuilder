import { describe, expect, it } from "vitest";
import {
  MAX_SCANNED_PAGES,
  SEARCH_PAGE_INTERVAL_MS,
  pauseFor,
  scanSearch,
  type SearchScanPorts,
} from "./search-scan";
import type { ScryfallCard, ScryfallSearchResponse } from "./types";

function card(name: string): ScryfallCard {
  return { id: name, name, cmc: 0, type_line: "Artifact", color_identity: [] };
}

/** An in-memory Scryfall search: `names[i]` is page i + 1. Records reads and pauses in order. */
function fakeSearch(
  pages: readonly (readonly string[])[],
  failOnPage?: number
) {
  const events: string[] = [];
  const totalCards = pages.reduce((sum, names) => sum + names.length, 0);
  const ports: SearchScanPorts = {
    fetchPage: async (page) => {
      events.push(`page ${page}`);
      if (page === failOnPage) throw new Error("Scryfall API error 503");
      const response: ScryfallSearchResponse = {
        object: "list",
        total_cards: totalCards,
        has_more: page < pages.length,
        data: (pages[page - 1] ?? []).map(card),
      };
      return response;
    },
    pause: async (ms) => {
      events.push(`pause ${ms}`);
    },
  };
  return { ports, events };
}

const isOwned = (owned: readonly string[]) => (c: ScryfallCard) =>
  owned.includes(c.name);

describe("scanSearch", () => {
  it("reads every page when the search ends before enough owned cards are found", async () => {
    const { ports, events } = fakeSearch([
      ["Sol Ring", "Arcane Signet"],
      ["Command Tower"],
    ]);

    const scan = await scanSearch(ports, { isWanted: isOwned(["Sol Ring"]) });

    expect(scan.cards.map((c) => c.name)).toEqual([
      "Sol Ring",
      "Arcane Signet",
      "Command Tower",
    ]);
    expect(scan).toMatchObject({ totalMatches: 3, complete: true });
    expect(events).toEqual([
      "page 1",
      `pause ${SEARCH_PAGE_INTERVAL_MS}`,
      "page 2",
    ]);
  });

  it("stops once enough owned cards were read, and reports the rest as unchecked", async () => {
    const { ports, events } = fakeSearch([
      ["Sol Ring"],
      ["Command Tower"],
      ["Arcane Signet"],
    ]);

    const scan = await scanSearch(ports, {
      isWanted: isOwned(["Sol Ring", "Command Tower"]),
      wantedTarget: 2,
    });

    expect(events.filter((e) => e.startsWith("page"))).toEqual([
      "page 1",
      "page 2",
    ]);
    expect(scan).toMatchObject({ totalMatches: 3, complete: false });
  });

  it(`reads at most ${MAX_SCANNED_PAGES} pages`, async () => {
    const pages = Array.from({ length: MAX_SCANNED_PAGES + 2 }, (_, i) => [
      `Card ${i + 1}`,
    ]);
    const { ports, events } = fakeSearch(pages);

    const scan = await scanSearch(ports, { isWanted: isOwned([]) });

    expect(events.filter((e) => e.startsWith("page"))).toHaveLength(
      MAX_SCANNED_PAGES
    );
    expect(scan).toMatchObject({
      totalMatches: MAX_SCANNED_PAGES + 2,
      complete: false,
    });
  });

  it("asks for nothing more when the first page holds enough", async () => {
    const { ports, events } = fakeSearch([["Sol Ring"], ["Command Tower"]]);

    await scanSearch(ports, {
      isWanted: isOwned(["Sol Ring"]),
      wantedTarget: 1,
    });

    expect(events).toEqual(["page 1"]);
  });

  it("keeps what it read when a later page fails, and reports the search as partly checked", async () => {
    const { ports } = fakeSearch(
      [["Sol Ring"], ["Command Tower"], ["Arcane Signet"]],
      2
    );

    const scan = await scanSearch(ports, { isWanted: isOwned(["Sol Ring"]) });

    expect(scan.cards.map((c) => c.name)).toEqual(["Sol Ring"]);
    expect(scan.complete).toBe(false);
  });

  it("fails like a search when the first page fails", async () => {
    const { ports } = fakeSearch([["Sol Ring"]], 1);

    await expect(scanSearch(ports, { isWanted: isOwned([]) })).rejects.toThrow(
      "Scryfall API error 503"
    );
  });

  it("stops before the next page when the scan is aborted", async () => {
    const controller = new AbortController();
    const { ports, events } = fakeSearch([["Sol Ring"], ["Command Tower"]]);

    const scan = scanSearch(
      {
        ...ports,
        pause: (ms, signal) => {
          controller.abort();
          return pauseFor(ms, signal);
        },
      },
      { isWanted: isOwned([]), signal: controller.signal }
    );

    await expect(scan).rejects.toThrow("aborted");
    expect(events).toEqual(["page 1"]);
  });
});
