// @vitest-environment node
/**
 * Characterization of the server's own Scryfall requests (master plan CC-01), the only writer of
 * the shared cache. Pinned before the move to `modules/card-catalog/infrastructure` (CC-07).
 *
 * Scryfall is MSW serving the recorded stand-in fixtures (`src/test/scryfall-stand-in.ts`), the
 * same answers the E2E stack gives. One test at a time overrides an endpoint to answer what the
 * stand-in never would: a card under another id, a body that is not a card, a failure status.
 *
 * @module scryfall/server-fetch.test
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { setupMsw } from "@/test/msw";
import { scryfallStandInHandlers } from "@/test/scryfall-stand-in";
import { LIGHTNING_BOLT_NAMED_RECORDED } from "./fixtures/e2e-stand-in-v1";
import { fetchCard, fetchSearchPage } from "./server-fetch";
import { EMPTY_SEARCH_RESPONSE } from "./types";

const server = setupMsw(...scryfallStandInHandlers());

const BOLT = LIGHTNING_BOLT_NAMED_RECORDED;
/** A well-formed id the stand-in has no card for. */
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000001";
const ANOTHER_ID = "11111111-1111-4111-8111-111111111111";

/** For one test, Scryfall answers `body` to every card-by-id request. */
function scryfallCardAnswers(body: JsonBodyType, status = 200): void {
  server.use(
    http.get("*/cards/:id", () => HttpResponse.json(body, { status }))
  );
}

/** For one test, Scryfall answers `body` to every search and records the URL it was asked. */
function scryfallSearchAnswers(
  body: JsonBodyType,
  status = 200
): { url: () => URL } {
  let asked: URL | undefined;
  server.use(
    http.get("*/cards/search", ({ request }) => {
      asked = new URL(request.url);
      return HttpResponse.json(body, { status });
    })
  );
  return {
    url: () => {
      if (asked === undefined) throw new Error("Scryfall was not asked");
      return asked;
    },
  };
}

describe("fetchCard", () => {
  it("returns the card Scryfall answers for a lower-case id", async () => {
    await expect(fetchCard(BOLT.id)).resolves.toEqual({
      kind: "found",
      data: BOLT,
    });
  });

  it("answers not_found for a card Scryfall does not know", async () => {
    await expect(fetchCard(UNKNOWN_ID)).resolves.toEqual({ kind: "not_found" });
  });

  it("refuses a card whose id is not the one asked for, as a failure without status", async () => {
    scryfallCardAnswers({ ...BOLT, id: ANOTHER_ID });

    await expect(fetchCard(BOLT.id)).resolves.toEqual({
      kind: "failed",
      status: null,
    });
  });

  // The id check is a strict string comparison. The one caller, the cards cache route, lower-cases
  // the id first (`parseCardCacheId`), so this is a contract on the input rather than a bug the
  // player can reach; a case-insensitive check, or a lower-case id type, would remove the trap.
  it("currently refuses the right card when the id was given in upper case (pinned; see server-fetch.ts:81)", async () => {
    scryfallCardAnswers(BOLT);

    await expect(fetchCard(BOLT.id.toUpperCase())).resolves.toEqual({
      kind: "failed",
      status: null,
    });
  });

  it("refuses a 200 body that is not a card, as a failure without status", async () => {
    scryfallCardAnswers({ object: "error", code: "bad_request", status: 200 });

    await expect(fetchCard(BOLT.id)).resolves.toEqual({
      kind: "failed",
      status: null,
    });
  });

  it.each([429, 500, 503])(
    "passes a %i on as a failure carrying that status, without retrying",
    async (status) => {
      let requests = 0;
      server.use(
        http.get("*/cards/:id", () => {
          requests += 1;
          return HttpResponse.json(
            { object: "error", code: "failed", status },
            { status }
          );
        })
      );

      await expect(fetchCard(BOLT.id)).resolves.toEqual({
        kind: "failed",
        status,
      });
      expect(requests).toBe(1);
    }
  );

  it("reports a network failure as a failure without status", async () => {
    server.use(http.get("*/cards/:id", () => HttpResponse.error()));

    await expect(fetchCard(BOLT.id)).resolves.toEqual({
      kind: "failed",
      status: null,
    });
  });
});

describe("fetchSearchPage", () => {
  it("returns the page Scryfall answers for a query that names a card", async () => {
    const result = await fetchSearchPage({
      query: '!"Lightning Bolt"',
      page: 1,
      multilingual: false,
    });

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.data.object).toBe("list");
    expect(result.data.data.map((card) => card.name)).toEqual([
      "Lightning Bolt",
    ]);
  });

  it("asks for the page in EDHREC order, and for other languages only when the key says so", async () => {
    const english = scryfallSearchAnswers(EMPTY_SEARCH_RESPONSE);
    await fetchSearchPage({ query: "t:goblin", page: 3, multilingual: false });
    const englishParams = english.url().searchParams;

    const multilingual = scryfallSearchAnswers(EMPTY_SEARCH_RESPONSE);
    await fetchSearchPage({
      query: "t:goblin lang:fr",
      page: 1,
      multilingual: true,
    });
    const multilingualParams = multilingual.url().searchParams;

    expect(Object.fromEntries(englishParams)).toEqual({
      q: "t:goblin",
      page: "3",
      order: "edhrec",
    });
    expect(Object.fromEntries(multilingualParams)).toEqual({
      q: "t:goblin lang:fr",
      page: "1",
      order: "edhrec",
      include_multilingual: "true",
    });
  });

  it("turns Scryfall's 404 for a query with no match into an empty page", async () => {
    await expect(
      fetchSearchPage({
        query: '!"No Such Card"',
        page: 1,
        multilingual: false,
      })
    ).resolves.toEqual({ kind: "found", data: EMPTY_SEARCH_RESPONSE });
  });

  it("refuses a 200 body that is not a list of cards, as a failure without status", async () => {
    scryfallSearchAnswers({ object: "list", data: [{ name: "No id" }] });

    await expect(
      fetchSearchPage({ query: "t:goblin", page: 1, multilingual: false })
    ).resolves.toEqual({ kind: "failed", status: null });
  });

  it("passes a failure status on as it is", async () => {
    scryfallSearchAnswers(
      { object: "error", code: "failed", status: 503 },
      503
    );

    await expect(
      fetchSearchPage({ query: "t:goblin", page: 1, multilingual: false })
    ).resolves.toEqual({ kind: "failed", status: 503 });
  });
});
