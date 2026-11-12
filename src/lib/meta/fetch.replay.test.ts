// @vitest-environment node
/**
 * Replays the recorded EDHREC and MTGTop8 pages through `fetchEdhrecData` and
 * `fetchTournamentData`, the Meta Insights adapters, with MSW in place of the
 * network (ADR 0005, rule 4).
 *
 * Contract tests for the anti-corruption layer in front of the two sources
 * (architecture audit, §3.2): they pin what the app reads from each recorded
 * page and how each failure the adapters already handle comes back. They drive
 * the exported functions only, so the move into `src/modules/meta-insights`
 * (MI-03) changes nothing here but import paths. The recordings, with their
 * dates and sources, are `fixtures/edhrec-commander-v1.ts`,
 * `fixtures/mtgtop8-search-form-v1.ts`, `fixtures/mtgtop8-events-v1.ts` and
 * `fixtures/mtgtop8-card-search-v1.ts`.
 *
 * The node environment matches where the adapters run: `GET /api/meta/[slug]`
 * calls them on the server.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse, type JsonBodyType } from "msw";
import {
  EDHREC_COMMANDER_RECORDED,
  EDHREC_RECORDED_COMMANDER_SLUG,
  EDHREC_RECORDED_URL,
} from "./fixtures/edhrec-commander-v1";
import {
  RECORDED_ARCHETYPE_IDS,
  RECORDED_SEARCH_FORM,
  latin1Bytes,
  searchFormLatin1Bytes,
} from "./fixtures/mtgtop8-search-form-v1";
import {
  RECORDED_EVENTS_ARCHETYPE_ID,
  RECORDED_EVENTS_COMMANDER,
  eventsPageLatin1Bytes,
} from "./fixtures/mtgtop8-events-v1";
import {
  RECORDED_UNKNOWN_CARD_NAME,
  unknownCardPageLatin1Bytes,
} from "./fixtures/mtgtop8-card-search-v1";
import {
  __resetArchetypeCache,
  fetchEdhrecData,
  fetchTournamentData,
} from "./fetch";
import { MTGTOP8_SEARCH_URL } from "./mtgtop8";
import { BOT_CHALLENGE_MESSAGE, HttpStatusError, USER_AGENT } from "@/lib/http";
import { setupMsw } from "@/test/msw";

/** Every request a source received during the current test, in order. */
let received: Request[] = [];

/** EDHREC's commander page answering every request with `body`. */
function edhrecAnswers(body: JsonBodyType, status = 200) {
  return http.get(EDHREC_RECORDED_URL, ({ request }) => {
    received.push(request.clone());
    return HttpResponse.json(body, { status });
  });
}

/** EDHREC's commander page answering with a raw body of the given type. */
function edhrecAnswersRaw(body: string, contentType: string, status = 200) {
  return http.get(EDHREC_RECORDED_URL, () =>
    HttpResponse.text(body, {
      status,
      headers: { "Content-Type": contentType },
    })
  );
}

const LATIN1_HTML = { "Content-Type": "text/html; charset=ISO-8859-1" };

/** MTGTop8's search form (the GET) serving `bytes`. */
function searchFormAnswers(bytes: ArrayBuffer = searchFormLatin1Bytes()) {
  return http.get(MTGTOP8_SEARCH_URL, ({ request }) => {
    received.push(request.clone());
    return HttpResponse.arrayBuffer(bytes, { headers: LATIN1_HTML });
  });
}

/** MTGTop8's search results (the POST) serving `bytes`. */
function searchResultsAnswer(bytes: ArrayBuffer = eventsPageLatin1Bytes()) {
  return http.post(MTGTOP8_SEARCH_URL, ({ request }) => {
    received.push(request.clone());
    return HttpResponse.arrayBuffer(bytes, { headers: LATIN1_HTML });
  });
}

/** MTGTop8 refusing a request with `status` and a short HTML body. */
function mtgtop8Refuses(method: "get" | "post", status: number) {
  return http[method](MTGTOP8_SEARCH_URL, () =>
    HttpResponse.html("<html><body>Error</body></html>", { status })
  );
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("expected the adapter to reject");
}

describe("the Meta Insights adapters replay the recorded pages", () => {
  // Each source serves its recording unless a test says otherwise; any other
  // outgoing request fails the test.
  const server = setupMsw(
    edhrecAnswers(EDHREC_COMMANDER_RECORDED),
    searchFormAnswers(),
    searchResultsAnswer()
  );

  beforeEach(() => {
    received = [];
    __resetArchetypeCache();
  });

  afterEach(() => {
    __resetArchetypeCache();
  });

  describe("fetchEdhrecData (recorded EDHREC commander page)", () => {
    it("fetches the commander's JSON page once, naming the app in its User-Agent", async () => {
      await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);

      expect(received).toHaveLength(1);
      const [request] = received;
      expect(request.method).toBe("GET");
      expect(request.url).toBe(EDHREC_RECORDED_URL);
      expect(request.headers.get("User-Agent")).toBe(USER_AGENT);
      expect(request.headers.get("Accept")).toContain("application/json");
    });

    it("reads every card of every recorded category into one list ranked by inclusion", async () => {
      const { cards } = await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);

      // 10 views over 6 lists on the recording; the cap of 20 is not reached.
      expect(cards.map((card) => card.name)).toEqual([
        "Forest",
        "Command Tower",
        "Sol Ring",
        "Arcane Signet",
        "Tekuthal, Inquiry Dominus",
        "Evolution Sage",
        "Swords to Plowshares",
        "Flux Channeler",
        "Rhystic Study",
        "Sanctum Lurker",
      ]);
    });

    it("maps the inclusion figures as decks with the card over eligible decks, with the sample kept", async () => {
      const { cards } = await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);
      const byName = new Map(cards.map((card) => [card.name, card]));

      // Sol Ring: 39,308 of the 46,229 recorded Atraxa decks.
      expect(byName.get("Sol Ring")).toEqual({
        name: "Sol Ring",
        inclusion: 39308 / 46229,
        sample: { decksWithCard: 39308, eligibleDecks: 46229 },
      });
      expect(byName.get("Sol Ring")?.inclusion).toBeCloseTo(0.8503, 4);
      // Rhystic Study sits below the top cards, at 28%.
      expect(byName.get("Rhystic Study")?.inclusion).toBeCloseTo(0.2828, 4);
    });

    it("divides a new card by the decks saved since its release, as EDHREC does, not by every deck", async () => {
      const { cards } = await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);
      const newCard = cards.find((card) => card.name === "Sanctum Lurker");

      // "New Cards" carries potential_decks 6,031 where every other list has 46,229.
      expect(newCard?.sample).toEqual({
        decksWithCard: 614,
        eligibleDecks: 6031,
      });
      expect(newCard?.inclusion).toBeCloseTo(614 / 6031, 6);
    });

    it("currently drops the category a card came from: the app shows one flat list (pinned; no B2 row)", async () => {
      const { cards } = await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);

      const recordedTags =
        EDHREC_COMMANDER_RECORDED.container.json_dict.cardlists.map(
          (list) => list.tag
        );
      expect(recordedTags).toEqual([
        "newcards",
        "topcards",
        "creatures",
        "enchantments",
        "manaartifacts",
        "lands",
      ]);
      for (const card of cards) {
        expect(Object.keys(card).sort()).toEqual([
          "inclusion",
          "name",
          "sample",
        ]);
      }
    });

    it("keeps one entry for a card EDHREC lists in two categories, the first one met", async () => {
      const { cardlists } = EDHREC_COMMANDER_RECORDED.container.json_dict;
      const [topCards] = cardlists.filter((list) => list.tag === "topcards");
      const [manaArtifacts] = cardlists.filter(
        (list) => list.tag === "manaartifacts"
      );
      const [solRing] = manaArtifacts.cardviews;
      server.use(
        edhrecAnswers({
          container: {
            json_dict: {
              cardlists: [
                // The first list says Sol Ring sits in fewer decks; it wins.
                { ...topCards, cardviews: [{ ...solRing, num_decks: 1000 }] },
                manaArtifacts,
              ],
            },
          },
        })
      );

      const { cards } = await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG);

      expect(cards.filter((card) => card.name === "Sol Ring")).toEqual([
        {
          name: "Sol Ring",
          inclusion: 1000 / 46229,
          sample: { decksWithCard: 1000, eligibleDecks: 46229 },
        },
      ]);
    });

    describe("failures", () => {
      it("reads a 404 as a commander EDHREC does not know: no cards, no error", async () => {
        server.use(edhrecAnswers({ message: "Not found" }, 404));

        expect(await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)).toEqual({
          cards: [],
        });
      });

      it("currently rejects a plain 403 with the deck-import wording (pinned; see follow-up on lib/http.ts httpGet)", async () => {
        server.use(edhrecAnswers({ message: "Forbidden" }, 403));

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toBeInstanceOf(HttpStatusError);
        expect(error).toMatchObject({
          status: 403,
          message: "Deck is private or access denied.",
        });
      });

      it("rejects a 403 bot challenge with the automated-access message", async () => {
        server.use(
          http.get(EDHREC_RECORDED_URL, () =>
            HttpResponse.html("<html><body>Just a moment...</body></html>", {
              status: 403,
              headers: { "cf-mitigated": "challenge" },
            })
          )
        );

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toMatchObject({
          status: 403,
          message: BOT_CHALLENGE_MESSAGE,
        });
      });

      it.each([500, 502, 503])(
        "rejects HTTP %i with the status, so the route can keep a stale cache",
        async (status) => {
          server.use(edhrecAnswers({ message: "Upstream error" }, status));

          const error = await rejection(
            fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
          );

          expect(error).toBeInstanceOf(HttpStatusError);
          expect(error).toMatchObject({
            status,
            message: `Source returned HTTP ${status}.`,
          });
        }
      );

      it("rejects an empty 200 body as a JSON parse error rather than an empty list", async () => {
        server.use(edhrecAnswersRaw("", "application/json"));

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toBeInstanceOf(SyntaxError);
      });

      it("rejects a 200 that is not JSON (an HTML page) as a JSON parse error", async () => {
        server.use(
          edhrecAnswersRaw("<html><body>Maintenance</body></html>", "text/html")
        );

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toBeInstanceOf(SyntaxError);
      });

      it("rejects truncated JSON as a JSON parse error", async () => {
        const truncated = JSON.stringify(EDHREC_COMMANDER_RECORDED).slice(
          0,
          2000
        );
        server.use(edhrecAnswersRaw(truncated, "application/json"));

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toBeInstanceOf(SyntaxError);
      });

      it.each<{ readonly shape: string; readonly body: JsonBodyType }>([
        { shape: "the body is JSON null", body: null },
        { shape: "the container is missing", body: { header: "Atraxa" } },
        {
          shape: "the card lists are missing",
          body: { container: { json_dict: {} } },
        },
        {
          shape: "a list has no card views",
          body: {
            container: { json_dict: { cardlists: [{ tag: "topcards" }] } },
          },
        },
      ])(
        "rejects well-formed JSON of another shape as an invalid EDHREC response: $shape",
        async ({ body }) => {
          server.use(edhrecAnswers(body));

          await expect(
            fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
          ).rejects.toThrow("Invalid EDHREC response: cardlists malformed");
        }
      );

      it("reads an explicitly empty card list as no cards", async () => {
        server.use(
          edhrecAnswers({ container: { json_dict: { cardlists: [] } } })
        );

        expect(await fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)).toEqual({
          cards: [],
        });
      });

      it("rejects a network failure as it comes, without wrapping it", async () => {
        server.use(http.get(EDHREC_RECORDED_URL, () => HttpResponse.error()));

        const error = await rejection(
          fetchEdhrecData(EDHREC_RECORDED_COMMANDER_SLUG)
        );

        expect(error).toBeInstanceOf(TypeError);
      });
    });
  });

  describe("fetchTournamentData (recorded MTGTop8 form and results)", () => {
    it("reads the form, then posts the commander's recorded archetype id, both with the app's User-Agent", async () => {
      await fetchTournamentData(RECORDED_EVENTS_COMMANDER);

      expect(received.map((request) => request.method)).toEqual([
        "GET",
        "POST",
      ]);
      const [form, search] = received;
      expect(form.url).toBe(MTGTOP8_SEARCH_URL);
      expect(form.headers.get("User-Agent")).toBe(USER_AGENT);
      expect(form.headers.get("Accept")).toBe("text/html");
      expect(search.headers.get("User-Agent")).toBe(USER_AGENT);
      expect(search.headers.get("Content-Type")).toBe(
        "application/x-www-form-urlencoded"
      );
      const body = new URLSearchParams(await search.text());
      expect(RECORDED_ARCHETYPE_IDS["Atraxa, Praetors' Voice"]).toBe(
        RECORDED_EVENTS_ARCHETYPE_ID
      );
      expect(Object.fromEntries(body)).toEqual({
        format: "EDH",
        current_page: "",
        "archetype_sel[EDH]": String(RECORDED_EVENTS_ARCHETYPE_ID),
      });
    });

    it("reads the five most recent decks of the six recorded, with name, player, event, placing and date", async () => {
      const { decks } = await fetchTournamentData(RECORDED_EVENTS_COMMANDER);

      expect(decks).toEqual([
        {
          name: "Atraxa, Praetors' Voice",
          player: "Lucas Pelletier",
          format: "Duel Commander",
          event:
            "Mythique Hebdomadaire @ La Boutique Mythique (Québec, Québec)",
          eventLevel: 1,
          placement: "5-8",
          date: "2026-10-05",
          url: "https://www.mtgtop8.com/event?e=91732&d=896788&f=EDH",
          source: "mtgtop8",
        },
        {
          name: "Atraxa",
          player: "Thibault Malherbe",
          format: "Duel Commander",
          event: "Weekly League @ Le Vizz (Rouen, France)",
          eventLevel: 2,
          placement: "4",
          date: "2026-09-09",
          url: "https://www.mtgtop8.com/event?e=90672&d=888383&f=EDH",
          source: "mtgtop8",
        },
        {
          name: "Atraxa Good Cards",
          player: "Yuri",
          format: "Duel Commander",
          event: "Thursduel BCN @ Magic Barcelona (Barcelona)",
          eventLevel: 2,
          placement: "3",
          date: "2026-06-25",
          url: "https://www.mtgtop8.com/event?e=87824&d=866412&f=EDH",
          source: "mtgtop8",
        },
        {
          name: "Atraxa, Praetors' Voice",
          player: "Kuness",
          format: "Duel Commander",
          event: "Draw7 - Open Series 13 @ Thailand",
          eventLevel: 1,
          placement: "6",
          date: "2024-10-26",
          url: "https://www.mtgtop8.com/event?e=61415&d=662077&f=EDH",
          source: "mtgtop8",
        },
        {
          name: "Atraxa, Praetors' Voice",
          player: "Hugo Blanchet",
          format: "Duel Commander",
          event: "OCD Les fées Partajeux by Auro @ Martigues (France)",
          eventLevel: 1,
          placement: "3-4",
          date: "2024-07-20",
          url: "https://www.mtgtop8.com/event?e=57725&d=631274&f=EDH",
          source: "mtgtop8",
        },
      ]);
    });

    it("converts the site's dd/mm/yy dates to ISO and keeps the placings as printed", async () => {
      const { decks } = await fetchTournamentData(RECORDED_EVENTS_COMMANDER);

      expect(decks.map((deck) => deck.date)).toEqual([
        "2026-10-05",
        "2026-09-09",
        "2026-06-25",
        "2024-10-26",
        "2024-07-20",
      ]);
      expect(decks.map((deck) => deck.placement)).toEqual([
        "5-8",
        "4",
        "3",
        "6",
        "3-4",
      ]);
    });

    it("decodes the site's Latin-1 bytes, so 'Québec' and 'fées' keep their accents", async () => {
      const { decks } = await fetchTournamentData(RECORDED_EVENTS_COMMANDER);

      expect(decks[0].event).toContain("Québec, Québec");
      expect(decks[4].event).toContain("Les fées Partajeux");
    });

    it("fetches the form once and reuses its archetypes for a later commander", async () => {
      await fetchTournamentData(RECORDED_EVENTS_COMMANDER);
      await fetchTournamentData("Éomer, Marshal of Rohan");

      expect(received.map((request) => request.method)).toEqual([
        "GET",
        "POST",
        "POST",
      ]);
      const body = new URLSearchParams(await received[2].text());
      expect(body.get("archetype_sel[EDH]")).toBe(
        String(RECORDED_ARCHETYPE_IDS["Éomer, Marshal of Rohan"])
      );
    });

    it("currently returns the whole EDH section for a commander MTGTop8 does not list: the card-content fallback is ignored by the site (pinned; see follow-up on fetch.ts fetchTournamentData)", async () => {
      server.use(searchResultsAnswer(unknownCardPageLatin1Bytes()));

      const { decks } = await fetchTournamentData(RECORDED_UNKNOWN_CARD_NAME);

      const body = new URLSearchParams(await received[1].text());
      expect(body.get("cards")).toBe(RECORDED_UNKNOWN_CARD_NAME);
      expect(body.has("archetype_sel[EDH]")).toBe(false);
      // The recording answered "44269 decks matching"; neither deck has anything
      // to do with the searched name, and the adapter cannot tell.
      expect(decks.map((deck) => deck.name)).toEqual([
        "Teddy Riner Président !",
        "Jcvd",
      ]);
    });

    describe("failures", () => {
      it.each([403, 404, 500, 502, 503])(
        "rejects when the form answers HTTP %i, before any search is sent",
        async (status) => {
          server.use(mtgtop8Refuses("get", status));

          const error = await rejection(
            fetchTournamentData(RECORDED_EVENTS_COMMANDER)
          );

          expect(error).toBeInstanceOf(HttpStatusError);
          expect(error).toMatchObject({ status });
          expect(
            received.filter((request) => request.method === "POST")
          ).toHaveLength(0);
        }
      );

      it.each([403, 404, 500, 502, 503])(
        "rejects when the search answers HTTP %i, so the route keeps its stale cache",
        async (status) => {
          server.use(mtgtop8Refuses("post", status));

          const error = await rejection(
            fetchTournamentData(RECORDED_EVENTS_COMMANDER)
          );

          expect(error).toBeInstanceOf(HttpStatusError);
          expect(error).toMatchObject({ status });
        }
      );

      it("reads an empty result table as a commander with no recorded deck: no decks, no error", async () => {
        // MTGTop8 answered no empty page while recording: a card search for an
        // unknown name returns the whole section instead. The shape the adapter
        // accepts as "no results" is an empty table.
        server.use(searchResultsAnswer(latin1Bytes("<table></table>")));

        expect(await fetchTournamentData(RECORDED_EVENTS_COMMANDER)).toEqual({
          decks: [],
        });
      });

      it("rejects an empty search body as an unrecognizable page rather than an empty feed", async () => {
        server.use(searchResultsAnswer(latin1Bytes("")));

        await expect(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        ).rejects.toThrow("Invalid MTGTop8 response: no recognizable results");
      });

      it("rejects a search page whose rows changed shape rather than an empty feed", async () => {
        const changedRows = new TextDecoder("iso-8859-1")
          .decode(eventsPageLatin1Bytes())
          .replaceAll("class=hover_tr", "class=result_row");
        server.use(searchResultsAnswer(latin1Bytes(changedRows)));

        await expect(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        ).rejects.toThrow("Invalid MTGTop8 response: no recognizable results");
      });

      it("rejects a row whose deck link changed rather than a deck without a URL", async () => {
        const changedLinks = new TextDecoder("iso-8859-1")
          .decode(eventsPageLatin1Bytes())
          .replaceAll("&f=EDH>", "&f=DC>");
        server.use(searchResultsAnswer(latin1Bytes(changedLinks)));

        await expect(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        ).rejects.toThrow("Invalid MTGTop8 response: deck link malformed");
      });

      it("rejects a form without the EDH archetype select instead of falling back to a card search", async () => {
        const withoutEdh = RECORDED_SEARCH_FORM.replace(
          "name=archetype_sel[EDH]",
          "name=archetype_sel[DC]"
        );
        server.use(searchFormAnswers(latin1Bytes(withoutEdh)));

        await expect(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        ).rejects.toThrow("Invalid MTGTop8 response: EDH archetypes missing");
        expect(
          received.filter((request) => request.method === "POST")
        ).toHaveLength(0);
      });

      it("rejects an empty form body the same way", async () => {
        server.use(searchFormAnswers(latin1Bytes("")));

        await expect(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        ).rejects.toThrow("Invalid MTGTop8 response: EDH archetypes missing");
      });

      it("rejects a network failure on the search as it comes", async () => {
        server.use(http.post(MTGTOP8_SEARCH_URL, () => HttpResponse.error()));

        const error = await rejection(
          fetchTournamentData(RECORDED_EVENTS_COMMANDER)
        );

        expect(error).toBeInstanceOf(TypeError);
      });
    });
  });
});
