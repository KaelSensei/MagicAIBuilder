// @vitest-environment node
/**
 * `GET /api/meta/:commanderSlug?source=tournament` against a recorded MTGTop8, end to end
 * inside the process: the real route, the real fetchers and the real Latin-1 decoding, with
 * MSW serving the two MTGTop8 requests (the search form, then the search itself).
 *
 * Only the two transitional seams are mocked (ADR 0005 rule 5): Auth.js's `auth()` and
 * Prisma, which answers the meta cache. The rate limiter runs for real.
 *
 * Why a route-level test: the accent bug (B2) sat between two modules that each looked right
 * alone. The route folds the slug one way, the parser folded the option name another, and
 * only the pair showed that "eomer-marshal-of-rohan" never met "Éomer, Marshal of Rohan".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  latin1Bytes,
  RECORDED_ARCHETYPE_IDS,
  searchFormLatin1Bytes,
} from "@/modules/meta-insights/infrastructure/fixtures/mtgtop8-search-form-v1";
import {
  RECORDED_UNKNOWN_CARD_NAME,
  unknownCardPageLatin1Bytes,
} from "@/modules/meta-insights/infrastructure/fixtures/mtgtop8-card-search-v1";
import { setupMsw } from "@/test/msw";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  findMetaCache: vi.fn(),
  upsertMetaCache: vi.fn(),
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    metaCache: { findUnique: fake.findMetaCache, upsert: fake.upsertMetaCache },
  });
});

import { GET } from "./route";
import { __resetArchetypeCache } from "@/modules/meta-insights/infrastructure/mtgtop8-source";

const SEARCH_URL = "https://www.mtgtop8.com/search";

/** One result row for the archetype search, trimmed from a live POST /search (2026-08-20). */
const EOMER_RESULTS_HTML = `
<tr class=hover_tr>
  <td><input type=checkbox name=deck_check[1] value=1 checked><input type=hidden name=deck_ref[1] value=611376></td>
  <td class=S12><a href=event?e=55289&d=611376&f=EDH>Éomer Voltron</a></td>
  <td class=G12><a class=player href=search?player=Rom%E9o+Vincent>Roméo Vincent</a></td>
  <td class=S12>Duel Commander</td>
  <td class=S11><a href=event?e=55289&f=EDH>Open Qualifier DC @ Pisany (France)</a></td>
  <td align=center><img src=/graph/star.png><img src=/graph/star.png></td>
  <td class=S12 align=center>8</td>
  <td class=S11>05/05/24</td>
</tr>`;

/** A card search MTGTop8 applied (the form echoes the card) that matched no deck. */
const EOWYN_EMPTY_CARD_SEARCH_HTML = `<textarea name=cards style="width:230;height:60;">eowyn fearless knight</textarea><table></table>`;

/** The bodies of the POST /search requests the route sent, in order. */
const searchesSent: URLSearchParams[] = [];

const server = setupMsw(
  http.get(SEARCH_URL, () =>
    HttpResponse.arrayBuffer(searchFormLatin1Bytes(), {
      headers: { "Content-Type": "text/html; charset=ISO-8859-1" },
    })
  ),
  http.post(SEARCH_URL, async ({ request }) => {
    searchesSent.push(new URLSearchParams(await request.text()));
    return HttpResponse.arrayBuffer(latin1Bytes(EOMER_RESULTS_HTML), {
      headers: { "Content-Type": "text/html; charset=ISO-8859-1" },
    });
  })
);

function requestFor(
  slug: string
): [Request, { params: Promise<{ commanderSlug: string }> }] {
  return [
    new Request(`http://localhost/api/meta/${slug}?source=tournament`),
    { params: Promise.resolve({ commanderSlug: slug }) },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  searchesSent.length = 0;
  __resetArchetypeCache();
  fake.auth.mockResolvedValue(null);
  fake.findMetaCache.mockResolvedValue(null);
  fake.upsertMetaCache.mockResolvedValue(undefined);
});

describe("GET /api/meta/:commanderSlug?source=tournament for an accented commander", () => {
  it("searches the commander's archetype, found from the accent-free slug, and returns its decks", async () => {
    const response = await GET(...requestFor("eomer-marshal-of-rohan"));

    expect(searchesSent).toHaveLength(1);
    expect(searchesSent[0].get("archetype_sel[EDH]")).toBe(
      String(RECORDED_ARCHETYPE_IDS["Éomer, Marshal of Rohan"])
    );
    expect(searchesSent[0].has("cards")).toBe(false);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      decks: [
        { name: "Éomer Voltron", player: "Roméo Vincent", source: "mtgtop8" },
      ],
      _meta: { source: "tournament", cached: false },
    });
  });

  it("falls back to a card-content search when the form lists no archetype for the commander", async () => {
    server.use(
      http.post(SEARCH_URL, async ({ request }) => {
        searchesSent.push(new URLSearchParams(await request.text()));
        return HttpResponse.arrayBuffer(
          latin1Bytes(EOWYN_EMPTY_CARD_SEARCH_HTML),
          {
            headers: { "Content-Type": "text/html; charset=ISO-8859-1" },
          }
        );
      })
    );

    const response = await GET(...requestFor("eowyn-fearless-knight"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ decks: [] });
    expect(searchesSent[0].get("cards")).toBe("eowyn fearless knight");
    expect(searchesSent[0].has("archetype_sel[EDH]")).toBe(false);
  });
});

describe("GET /api/meta/:commanderSlug?source=tournament for a commander MTGTop8 does not know", () => {
  it("answers the fresh 'no recorded deck' state, not an error, when the site ignores the card search", async () => {
    server.use(
      http.post(SEARCH_URL, async ({ request }) => {
        searchesSent.push(new URLSearchParams(await request.text()));
        return HttpResponse.arrayBuffer(unknownCardPageLatin1Bytes(), {
          headers: { "Content-Type": "text/html; charset=ISO-8859-1" },
        });
      })
    );
    const slug = RECORDED_UNKNOWN_CARD_NAME.toLowerCase().replaceAll(" ", "-");

    const response = await GET(...requestFor(slug));

    expect(searchesSent[0].get("cards")).toBe(
      RECORDED_UNKNOWN_CARD_NAME.toLowerCase()
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      decks: [],
      _meta: {
        source: "tournament",
        cached: false,
        observedAt: expect.any(String),
      },
    });
    // A genuine empty feed is cached like any other answer; nothing stale is served.
    expect(fake.upsertMetaCache).toHaveBeenCalledTimes(1);
    expect(fake.upsertMetaCache.mock.calls[0][0]).toMatchObject({
      create: {
        commanderSlug: slug,
        source: "tournament",
        data: { decks: [] },
      },
    });
  });
});
