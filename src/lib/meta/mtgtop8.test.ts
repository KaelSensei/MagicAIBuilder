import { describe, it, expect } from "vitest";
import {
  buildSearchBody,
  decodeLatin1,
  findArchetypeId,
  parseArchetypeOptions,
  parseSearchResults,
  parseTop8Date,
} from "./mtgtop8";

// Trimmed from a live GET https://www.mtgtop8.com/search (2026-08-20)
const SEARCH_FORM_HTML = `
<select style="display:none;" id=arch_VI name=archetype_sel[VI]>
<option value="">All</option>
<option value=10 >Lands</option>
</select>
<select style="display:none;" id=arch_EDH name=archetype_sel[EDH]>
<option value="">All</option>
<option value=3106 >A-Lier, Disciple of the Drowned</option>
<option value=2182 >Abaddon the Despoiler</option>
<option value=1551 >Atraxa, Praetors' Voice</option>
<option value=2272 >Abuelo, Ancestral Echo</option>
</select>
<select style="display:none;" id=arch_cEDH name=archetype_sel[cEDH]>
<option value="">All</option>
<option value=99 >Atraxa, Praetors' Voice</option>
</select>`;

// Trimmed from a live POST https://www.mtgtop8.com/search (2026-08-20)
const RESULTS_HTML = `
<tr class=hover_tr>
  <td><input type=checkbox name=deck_check[1] value=1 checked><input type=hidden name=deck_ref[1] value=611376></td>
  <td class=S12><a href=event?e=55289&d=611376&f=EDH>Atraxa 7ccm</a></td>
  <td class=G12><a class=player href=search?player=Rom%E9o+Vincent>Roméo Vincent</a></td>
  <td class=S12>Duel Commander</td>
  <td class=S11><a href=event?e=55289&f=EDH>Open Qualifier DC @ Pisany (France)</a></td>
  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
  <td class=S12 align=center>8</td>
  <td class=S11>05/05/24</td>
</tr>
<tr class=hover_tr>
  <td><input type=checkbox name=deck_check[2] value=1 checked><input type=hidden name=deck_ref[2] value=598811></td>
  <td class=S12><a href=event?e=53639&d=598811&f=EDH>Sisay</a></td>
  <td class=G12><a class=player href=search?player=Aur%E9lien+Lion>Aurélien Lion</a></td>
  <td class=S12>Duel Commander</td>
  <td class=S11><a href=event?e=53639&f=EDH>Qualifier CDF @ L'héritage Du Jeu (Trégueux, France)</a></td>
  <td align=center><img src=/graph/star.png><img src=/graph/star.png><img src=/graph/star.png></td>
  <td class=S12 align=center>3-4</td>
  <td class=S11>23/03/24</td>
</tr>`;

describe("parseArchetypeOptions", () => {
  it("reads the EDH select only, keyed by lower-cased commander name", () => {
    const options = parseArchetypeOptions(SEARCH_FORM_HTML);
    expect(options.get("atraxa, praetors' voice")).toBe(1551);
    expect(options.get("abaddon the despoiler")).toBe(2182);
    expect(options.has("lands")).toBe(false);
  });

  it("ignores the empty 'All' option", () => {
    expect(parseArchetypeOptions(SEARCH_FORM_HTML).has("all")).toBe(false);
  });

  it("returns an empty map when the EDH select is absent", () => {
    expect(parseArchetypeOptions("<html></html>").size).toBe(0);
  });
});

describe("findArchetypeId", () => {
  const options = parseArchetypeOptions(SEARCH_FORM_HTML);

  it("matches case-insensitively on the full name", () => {
    expect(findArchetypeId(options, "ATRAXA, Praetors' Voice")).toBe(1551);
  });

  it("matches a slug-shaped name the way the meta route passes it", () => {
    // The route turns the slug back into words with hyphens as spaces, losing
    // the comma and apostrophe; the lookup must survive that.
    expect(findArchetypeId(options, "atraxa praetors voice")).toBe(1551);
  });

  it("returns null for an unknown commander", () => {
    expect(findArchetypeId(options, "Krenko, Mob Boss")).toBeNull();
  });
});

describe("parseSearchResults", () => {
  const decks = parseSearchResults(RESULTS_HTML);

  it("reads one deck per result row, in page order", () => {
    expect(decks.map((d) => d.name)).toEqual(["Atraxa 7ccm", "Sisay"]);
  });

  it("fills the event context the row carries", () => {
    expect(decks[0]).toEqual({
      name: "Atraxa 7ccm",
      player: "Roméo Vincent",
      event: "Open Qualifier DC @ Pisany (France)",
      date: "2024-05-05",
      placement: "8",
      format: "Duel Commander",
      eventLevel: 2,
      url: "https://www.mtgtop8.com/event?e=55289&d=611376&f=EDH",
      source: "mtgtop8",
    });
  });

  it("keeps a shared placement such as 3-4 as text", () => {
    expect(decks[1].placement).toBe("3-4");
    expect(decks[1].eventLevel).toBe(3);
  });

  it("returns nothing for a page with no result rows", () => {
    expect(parseSearchResults("<table></table>")).toEqual([]);
  });
});

describe("parseTop8Date", () => {
  it("turns dd/mm/yy into an ISO date", () => {
    expect(parseTop8Date("05/05/24")).toBe("2024-05-05");
  });

  it("returns undefined for anything else", () => {
    expect(parseTop8Date("yesterday")).toBeUndefined();
  });
});

describe("buildSearchBody", () => {
  it("searches the commander's archetype when it has one", () => {
    const body = buildSearchBody({ archetypeId: 1551, commanderName: "Atraxa, Praetors' Voice" });
    expect(body.get("format")).toBe("EDH");
    expect(body.get("archetype_sel[EDH]")).toBe("1551");
    expect(body.has("cards")).toBe(false);
  });

  it("falls back to a card-content search when the commander has no archetype", () => {
    const body = buildSearchBody({ archetypeId: null, commanderName: "Krenko, Mob Boss" });
    expect(body.get("cards")).toBe("Krenko, Mob Boss");
    expect(body.has("archetype_sel[EDH]")).toBe(false);
  });
});

describe("decodeLatin1", () => {
  it("decodes the ISO-8859-1 bytes MTGTop8 serves", () => {
    const bytes = new Uint8Array([0x52, 0x6f, 0x6d, 0xe9, 0x6f]); // "Roméo"
    expect(decodeLatin1(bytes.buffer)).toBe("Roméo");
  });
});
