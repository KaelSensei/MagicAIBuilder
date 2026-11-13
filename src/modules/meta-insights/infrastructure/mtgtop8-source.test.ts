import { describe, it, expect, vi, beforeEach } from "vitest";
import * as http from "@/lib/http";
import { fetchTournamentData, __resetArchetypeCache } from "./mtgtop8-source";

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

/** The search form's card row as MTGTop8 echoes it above the results of a card search. */
const CARD_FILTER_ECHO = (cards: string) =>
  `<tr><td colspan=2 align=center><textarea name=cards style="width:230;height:60;">${cards}</textarea></td></tr>`;

function latin1Response(html: string): Response {
  const bytes = Uint8Array.from(html, (ch) => ch.charCodeAt(0));
  return new Response(bytes, { status: 200, headers: { "Content-Type": "text/html; charset=iso-8859-1" } });
}

describe("fetchTournamentData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __resetArchetypeCache();
  });

  it("rejects when the search form cannot be fetched", async () => {
    vi.spyOn(http, "httpGet").mockRejectedValueOnce(new Error("network down"));
    await expect(fetchTournamentData("atraxa praetors voice")).rejects.toThrow("network down");
  });

  it("rejects a search form without EDH archetypes instead of using a card search", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      latin1Response(FORM_HTML.replace("name=archetype_sel[EDH]", "name=archetype_sel[VI]"))
    ).mockRejectedValue(new Error("Unexpected network request"));

    await expect(fetchTournamentData("atraxa praetors voice")).rejects.toThrow("Invalid MTGTop8 response");
    expect(spy).toHaveBeenCalledTimes(1);
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
      .mockResolvedValueOnce(
        latin1Response(
          CARD_FILTER_ECHO("Krenko, Mob Boss") + ROW(9, "Krenko Goblins")
        )
      );

    const result = await fetchTournamentData("Krenko, Mob Boss");

    expect(result.decks.map((d) => d.name)).toEqual(["Krenko Goblins"]);
    expect(String(spy.mock.calls[1][1]?.body)).toContain("cards=Krenko");
  });

  it("fetches the archetype form once and reuses it for later commanders", async () => {
    const spy = vi
      .spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockImplementation(async () => latin1Response("<table></table>"));

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

  it("rejects when the search itself fails", async () => {
    vi.spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockRejectedValueOnce(new Error("HTTP 503"));
    await expect(fetchTournamentData("atraxa praetors voice")).rejects.toThrow("HTTP 503");
  });

  it("rejects changed tournament rows rather than reporting an empty feed", async () => {
    vi.spyOn(http, "httpGet")
      .mockResolvedValueOnce(latin1Response(FORM_HTML))
      .mockResolvedValueOnce(latin1Response(ROW(1, "Atraxa").replace("class=hover_tr", "class=changed_row")));

    await expect(fetchTournamentData("atraxa praetors voice")).rejects.toThrow("Invalid MTGTop8 response");
  });
});
