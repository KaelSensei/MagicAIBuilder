import { describe, expect, it } from "vitest";
import { getCardCollection } from "@/lib/scryfall/client";
import {
  GRIZZLY_BEARS_PRINTINGS_RECORDED,
  LIGHTNING_BOLT_NAMED_RECORDED,
} from "@/lib/scryfall/fixtures/e2e-stand-in-v1";
import { setupMsw } from "@/test/msw";
import {
  answerScryfallRequest,
  scryfallStandInHandlers,
} from "@/test/scryfall-stand-in";

// Any origin: the E2E stack serves the handlers from http://scryfall:8787.
const ORIGIN = "http://scryfall.example.test";

async function ask(path: string, init?: RequestInit): Promise<Response> {
  return answerScryfallRequest(new Request(`${ORIGIN}${path}`, init));
}

async function search(params: Record<string, string>): Promise<Response> {
  return ask(`/cards/search?${new URLSearchParams(params)}`);
}

async function names(response: Response): Promise<readonly string[]> {
  const body = (await response.json()) as { data: { name: string }[] };
  return body.data.map((card) => card.name);
}

async function ids(response: Response): Promise<readonly string[]> {
  const body = (await response.json()) as { data: { id: string }[] };
  return body.data.map((card) => card.id);
}

function postCollection(identifiers: readonly unknown[]): Promise<Response> {
  return ask("/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers }),
  });
}

describe("the stand-in's card search", () => {
  it("answers the builder's name search with the recorded card", async () => {
    const response = await search({
      q: "name:/lightning bolt/ legal:commander",
      order: "edhrec",
    });
    expect(response.status).toBe(200);
    expect(await names(response)).toEqual(["Lightning Bolt"]);
  });

  it("answers a query that names no card with Scryfall's 404 body", async () => {
    const response = await search({ q: "zzzzznosuchcardzzzzz" });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      object: "error",
      code: "not_found",
    });
  });

  it("answers a filter-only query, such as the Game Changers catalog, with 404", async () => {
    expect((await search({ q: "is:gamechanger" })).status).toBe(404);
    expect((await search({ q: "banned:commander" })).status).toBe(404);
  });

  it("lists every recorded printing of an exact name when unique=prints is asked", async () => {
    const response = await search({
      q: '!"Grizzly Bears" game:paper',
      unique: "prints",
      order: "released",
      dir: "desc",
    });
    expect(await ids(response)).toEqual(
      GRIZZLY_BEARS_PRINTINGS_RECORDED.map((card) => card.id)
    );
  });

  it("lists one card per name otherwise", async () => {
    expect(await names(await search({ q: "grizzly" }))).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("hides non-English printings unless the query asks for a language", async () => {
    expect(await names(await search({ q: "llanowar" }))).toEqual([
      "Llanowar Elves",
    ]);
    const french = await search({
      q: "llanowar lang:fr",
      include_multilingual: "true",
    });
    const body = (await french.json()) as { data: { lang: string }[] };
    expect(body.data.map((card) => card.lang)).toEqual(["fr"]);
  });
});

describe("the stand-in's query parsing", () => {
  it("narrows nothing on a quoted filter value, so a Partner query with spaces still names no card", async () => {
    const response = await search({ q: 'is:commander o:"Partner with" grizzly' });
    expect(await names(response)).toEqual(["Grizzly Bears"]);
    expect(
      (await search({ q: 'is:commander o:"Doctor\'s companion"' })).status
    ).toBe(404);
  });

  it("narrows nothing on a comparison term such as cmc>=3", async () => {
    expect(await names(await search({ q: "cmc>=3 pow!=2 grizzly" }))).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("matches a name: term with a quoted or bare value, and a bare exact term", async () => {
    expect(await names(await search({ q: 'name:"Grizzly Bears"' }))).toEqual([
      "Grizzly Bears",
    ]);
    expect(await names(await search({ q: "name:grizzly" }))).toEqual([
      "Grizzly Bears",
    ]);
    expect(await names(await search({ q: "!Counterspell" }))).toEqual([
      "Counterspell",
    ]);
  });

  it("drops OR and parentheses rather than treating them as words", async () => {
    expect(await names(await search({ q: "(grizzly OR bears)" }))).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("answers the localized exact-name search the client sends", async () => {
    const response = await search({
      q: 'lang:fr unique:cards (!"Llanowar Elves")',
      include_multilingual: "true",
    });
    const body = (await response.json()) as {
      data: { name: string; lang: string }[];
    };
    expect(body.data.map((card) => [card.name, card.lang])).toEqual([
      ["Llanowar Elves", "fr"],
    ]);
  });
});

describe("the stand-in's collection endpoint", () => {
  it("finds cards by name, resolves a front-face name to the whole card and reports the rest as not found", async () => {
    const response = await postCollection([
      { name: "Sol Ring" },
      { name: "Sea Gate Restoration" },
      { name: "Zzyzx Card That Does Not Exist" },
    ]);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { name: string }[];
      not_found: unknown[];
    };
    expect(body.data.map((card) => card.name)).toEqual([
      "Sol Ring",
      "Sea Gate Restoration // Sea Gate, Reborn",
    ]);
    expect(body.not_found).toEqual([
      { name: "Zzyzx Card That Does Not Exist" },
    ]);
  });

  it("reports an unknown printing id as not found, as live Scryfall does for a spec's stub ids", async () => {
    const response = await postCollection([
      { id: "00000000-0000-4000-8000-000000000602" },
      { id: LIGHTNING_BOLT_NAMED_RECORDED.id },
    ]);
    const body = (await response.json()) as {
      data: { id: string }[];
      not_found: unknown[];
    };
    expect(body.data.map((card) => card.id)).toEqual([
      LIGHTNING_BOLT_NAMED_RECORDED.id,
    ]);
    expect(body.not_found).toEqual([
      { id: "00000000-0000-4000-8000-000000000602" },
    ]);
  });
});

describe("the stand-in's single-card endpoints", () => {
  it("answers an exact name, and 404 for a name no card has", async () => {
    const found = await ask("/cards/named?exact=Sol%20Ring");
    expect(((await found.json()) as { name: string }).name).toBe("Sol Ring");
    const missing = await ask("/cards/named?exact=Zzyzx");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      code: "not_found",
      details: expect.stringContaining("Zzyzx"),
    });
  });

  it("answers a fuzzy name with the one card whose name contains it", async () => {
    const response = await ask("/cards/named?fuzzy=Talrand");
    expect(((await response.json()) as { name: string }).name).toBe(
      "Talrand, Sky Summoner"
    );
  });

  it("autocompletes a prefix with the recorded names, as a catalog", async () => {
    const response = await ask("/cards/autocomplete?q=sol");
    expect(await response.json()).toEqual({
      object: "catalog",
      total_values: 2,
      data: ["Sol Ring", "Solemn Simulacrum"],
    });
  });

  it("answers a card by id, and 404 for an id it does not hold", async () => {
    const found = await ask(`/cards/${LIGHTNING_BOLT_NAMED_RECORDED.id}`);
    expect(await found.json()).toEqual(LIGHTNING_BOLT_NAMED_RECORDED);
    const missing = await ask("/cards/00000000-0000-4000-8000-000000000601");
    expect(missing.status).toBe(404);
  });

  it("answers a card's rulings with an empty list", async () => {
    const response = await ask(
      `/cards/${LIGHTNING_BOLT_NAMED_RECORDED.id}/rulings`
    );
    expect(await response.json()).toEqual({
      object: "list",
      has_more: false,
      data: [],
    });
  });

  it("answers a path it does not serve with a Scryfall error, never with nothing", async () => {
    const response = await ask("/sets/fdn");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ object: "error" });
  });
});

describe("the handlers under MSW, as a Vitest file would use them", () => {
  setupMsw(...scryfallStandInHandlers());

  it("let the real Scryfall client resolve a collection lookup", async () => {
    const collection = await getCardCollection([{ name: "Counterspell" }]);
    expect(collection.data.map((card) => card.name)).toEqual(["Counterspell"]);
    expect(collection.not_found).toEqual([]);
  });
});
