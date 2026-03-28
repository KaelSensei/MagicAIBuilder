import { describe, it, expect, vi, beforeEach } from "vitest";
import { commanderToSlug, fetchEdhrecData } from "./fetch";

// ─── commanderToSlug ──────────────────────────────────────────────────────────
describe("commanderToSlug", () => {
  it("converts simple name", () => expect(commanderToSlug("Atraxa")).toBe("atraxa"));

  it("converts name with comma and apostrophe", () =>
    expect(commanderToSlug("Atraxa, Praetors' Voice")).toBe("atraxa-praetors-voice"));

  it("converts multi-word name", () =>
    expect(commanderToSlug("The Ur-Dragon")).toBe("the-ur-dragon"));

  it("handles trailing/leading spaces", () =>
    expect(commanderToSlug("  Sol Ring  ")).toBe("sol-ring"));

  it("strips quotes and punctuation", () =>
    expect(commanderToSlug("Tymna the Weaver")).toBe("tymna-the-weaver"));

  it("lowercases everything", () => expect(commanderToSlug("KENRITH")).toBe("kenrith"));

  it("handles empty string", () => expect(commanderToSlug("")).toBe(""));

  it("collapses multiple spaces", () =>
    expect(commanderToSlug("A  B  C")).toBe("a-b-c"));

  it("keeps numbers", () =>
    expect(commanderToSlug("Sliver Overlord 2")).toBe("sliver-overlord-2"));

  it("strips special chars Edgar example", () =>
    expect(commanderToSlug("Edgar, Charmed Groom")).toBe("edgar-charmed-groom"));
});

// ─── fetchEdhrecData ──────────────────────────────────────────────────────────
describe("fetchEdhrecData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty cards on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 })
    );
    const result = await fetchEdhrecData("unknown-commander");
    expect(result.cards).toHaveLength(0);
  });

  it("throws on non-404 HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    await expect(fetchEdhrecData("atraxa")).rejects.toThrow("HTTP 500");
  });

  it("returns top 20 cards from JSON response", async () => {
    const mockCards = Array.from({ length: 25 }, (_, i) => ({
      name: `Card ${i}`,
      num_decks: 100 - i,
      potential_decks: 100,
    }));

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{ tag: "ramp", cardviews: mockCards }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("atraxa");
    expect(result.cards).toHaveLength(20); // capped at 20
    expect(result.cards[0].name).toBe("Card 0");
  });

  it("computes inclusion from num_decks/potential_decks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{
                tag: "ramp",
                cardviews: [{ name: "Sol Ring", num_decks: 80, potential_decks: 100 }],
              }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards[0].inclusion).toBeCloseTo(0.8);
  });

  it("deduplicates cards with same name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [
                { tag: "ramp", cardviews: [{ name: "Sol Ring", num_decks: 80, potential_decks: 100 }] },
                { tag: "other", cardviews: [{ name: "Sol Ring", num_decks: 80, potential_decks: 100 }] },
              ],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards.filter((c) => c.name === "Sol Ring")).toHaveLength(1);
  });
});
