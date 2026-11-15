import { describe, expect, it } from "vitest";
import { releaseStatus } from "./release-status";
import { aScryfallCard } from "@/test/builders/scryfall";

/** The day these tests run on, at noon UTC so no time zone moves the calendar day. */
const TODAY = new Date("2026-11-15T12:00:00Z");

describe("releaseStatus", () => {
  it("calls a new card a preview when it is released after today and Scryfall marks it not legal", () => {
    const card = aScryfallCard({
      released_at: "2027-02-05",
      legalities: { commander: "not_legal" },
    });

    expect(releaseStatus(card, TODAY)).toEqual({
      kind: "preview",
      releasesOn: "2027-02-05",
    });
  });

  it("calls a new card upcoming when it is released after today and Scryfall already marks it legal", () => {
    // Scryfall switches new cards to legal a few days before release (I-73 7.2).
    const card = aScryfallCard({
      released_at: "2026-11-18",
      legalities: { commander: "legal" },
    });

    expect(releaseStatus(card, TODAY)).toEqual({
      kind: "upcoming",
      releasesOn: "2026-11-18",
    });
  });

  it("calls a reprint released even when its new set comes out after today", () => {
    // Scryfall's legality is per card, not per printing, so a reprint keeps its legality.
    const card = aScryfallCard({
      released_at: "2027-02-05",
      reprint: true,
      legalities: { commander: "legal" },
    });

    expect(releaseStatus(card, TODAY)).toEqual({ kind: "released" });
  });

  it.each([
    ["on its release day", "2026-11-15"],
    ["after its release day", "2026-10-02"],
    ["with no release date, as card JSON cached before Scryfall's field was read", undefined],
  ])("calls a not-legal new card released %s", (_when, releasedAt) => {
    const card = aScryfallCard({
      released_at: releasedAt,
      legalities: { commander: "not_legal" },
    });

    expect(releaseStatus(card, TODAY)).toEqual({ kind: "released" });
  });

  it("reads today as the UTC calendar day, the day Scryfall's release dates are written in", () => {
    const lateEveningInNewYork = new Date("2026-11-14T22:00:00-05:00");
    const card = aScryfallCard({
      released_at: "2026-11-15",
      legalities: { commander: "legal" },
    });

    expect(releaseStatus(card, lateEveningInNewYork)).toEqual({ kind: "released" });
  });
});
