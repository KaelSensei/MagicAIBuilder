import { describe, it, expect, vi, beforeEach } from "vitest";
import * as http from "@/lib/http";
import { commanderToSlug, fetchEdhrecData, fetchTournamentData, __resetArchetypeCache } from "./fetch";

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

  it("handles missing cardlists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ container: { json_dict: {} } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchEdhrecData("test");
    expect(result.cards).toHaveLength(0);
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

// ─── fetchTournamentData ─────────────────────────────────────────────────────
const FORM_HTML = `<select id=arch_EDH name=archetype_sel[EDH]>
<option value="">All</option>
<option value=1551 >Atraxa, Praetors' Voice</option>
</select>`;

const ROW = (id: number, name: string) => `<tr class=hover_tr>
<td><input type=checkbox></td>
<td class=S12><a href=event?e=1&d=${id}&f=EDH>${name}</a></td>
<td class=G12><a class=player href=search?player=x>Player ${id}</a></td>
<td class=S12>Duel Commander</td>
<td class=S11><a href=event?e=1&f=EDH>Open @ Somewhere</a></td>
<td align=center><img src=/graph/star.png></td>
<td class=S12 align=center>${id}</td>
<td class=S11>05/05/24</td>
</tr>`;

function latin1Response(html: string): Response {
  const bytes = Uint8Array.from(html, (ch) => ch.charCodeAt(0));
  return new Response(bytes, { status: 200, headers: { "Content-Type": "text/html; charset=iso-8859-1" } });
}

describe("fetchTournamentData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __resetArchetypeCache();
  });

  it("returns empty decks when the search form cannot be fetched", async () => {
    vi.spyOn(http, "httpGet").mockRejectedValueOnce(new Error("network down"));
    const result = await fetchTournamentData("atraxa praetors voice");
    expect(result.decks).toEqual([]);
  });

  it("searches the commander's archetype and returns the five most recent decks with context", async () => {
    const rows = [1, 2, 3, 4, 5, 6].map((i) => ROW(i, `Deck ${i}`)).join("");
    const spy = vi
      .spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockResolvedValueOnce(latin1Response(rows));

    const result = await fetchTournamentData("atraxa praetors voice");

    expect(result.decks).toHaveLength(5);
    expect(result.decks[0]).toMatchObject({
      name: "Deck 1",
      player: "Player 1",
      event: "Open @ Somewhere",
      date: "2024-05-05",
      placement: "1",
      format: "Duel Commander",
      eventLevel: 1,
      source: "mtgtop8",
    });
    const [, postOptions] = spy.mock.calls[1];
    expect(postOptions?.method).toBe("POST");
    expect(String(postOptions?.body)).toContain("archetype_sel%5BEDH%5D=1551");
  });

  it("falls back to a card search when MTGTop8 has no archetype for the commander", async () => {
    const spy = vi
      .spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockResolvedValueOnce(latin1Response(ROW(9, "Krenko Goblins")));

    const result = await fetchTournamentData("Krenko, Mob Boss");

    expect(result.decks.map((d) => d.name)).toEqual(["Krenko Goblins"]);
    expect(String(spy.mock.calls[1][1]?.body)).toContain("cards=Krenko");
  });

  it("fetches the archetype form once and reuses it for later commanders", async () => {
    const spy = vi
      .spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockResolvedValue(latin1Response(""));

    await fetchTournamentData("atraxa praetors voice");
    await fetchTournamentData("atraxa praetors voice");

    const formCalls = spy.mock.calls.filter(([, o]) => o?.method !== "POST");
    expect(formCalls).toHaveLength(1);
  });

  it("decodes the site's Latin-1 bytes so accented player names survive", async () => {
    vi.spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockResolvedValueOnce(latin1Response(ROW(1, "Atraxa").replace("Player 1", "Roméo")));

    const result = await fetchTournamentData("atraxa praetors voice");
    expect(result.decks[0].player).toBe("Roméo");
  });

  it("returns empty decks when the search itself fails", async () => {
    vi.spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockRejectedValueOnce(new Error("HTTP 503"));
    const result = await fetchTournamentData("atraxa praetors voice");
    expect(result.decks).toEqual([]);
  });
});

