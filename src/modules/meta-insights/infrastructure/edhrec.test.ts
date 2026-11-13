import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEdhrecData } from "./edhrec";

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

  it("ranks popular cards across categories before limiting the result", async () => {
    const earlyCards = Array.from({ length: 20 }, (_, i) => ({
      name: `Early ${i}`,
      num_decks: 40 - i,
      potential_decks: 100,
    }));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        container: { json_dict: { cardlists: [
          { tag: "ramp", cardviews: earlyCards },
          { tag: "draw", cardviews: [{ name: "Late staple", num_decks: 90, potential_decks: 100 }] },
        ] } },
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards).toHaveLength(20);
    expect(result.cards[0]).toEqual(expect.objectContaining({ name: "Late staple", inclusion: 0.9 }));
    expect(result.cards.some((card) => card.name === "Early 19")).toBe(false);
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
    expect(result.cards[0].sample).toEqual({ decksWithCard: 80, eligibleDecks: 100 });
  });

  it("uses inclusion field when present", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{
                tag: "staples",
                cardviews: [{ name: "Rhystic Study", inclusion: 0.42 }],
              }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards[0].inclusion).toBe(0.42);
  });

  it("falls back to a valid deck ratio when inclusion is outside zero to one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{
                tag: "staples",
                cardviews: [{ name: "Sol Ring", inclusion: 42, num_decks: 80, potential_decks: 100 }],
              }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards[0].inclusion).toBe(0.8);
  });

  it("does not display an impossible ratio when the source counts disagree", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{
                tag: "staples",
                cardviews: [{ name: "Sol Ring", inclusion: -0.2, num_decks: 120, potential_decks: 100 }],
              }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards[0].inclusion).toBe(0);
    expect(result.cards[0].sample).toBeUndefined();
  });

  it("returns 0 inclusion when potential_decks is zero", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              cardlists: [{
                tag: "x",
                cardviews: [{ name: "X", num_decks: 5, potential_decks: 0 }],
              }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards[0].inclusion).toBe(0);
  });

  it("rejects a changed EDHREC response shape instead of caching an empty recommendation list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ container: { json_dict: {} } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(fetchEdhrecData("test")).rejects.toThrow("Invalid EDHREC response");
  });

  it("accepts an explicitly empty card list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ container: { json_dict: { cardlists: [] } } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards).toEqual([]);
  });

  it("rejects a list without cardviews instead of treating it as no recommendations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ container: { json_dict: { cardlists: [{ tag: "ramp" }] } } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(fetchEdhrecData("test")).rejects.toThrow("Invalid EDHREC response");
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
