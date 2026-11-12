/**
 * MSW handlers that answer Scryfall's card endpoints from the recorded fixtures.
 *
 * Part of the shared test kit. One fixture set serves two runtimes: a Vitest file registers the
 * handlers with `setupMsw`, and the E2E stack serves them over HTTP from
 * `e2e/scryfall-stand-in.ts`, so the Playwright suite never reaches api.scryfall.com
 * (docs/engineering/quality-gate.md, "E2E environment"). The handlers match any origin: Vitest
 * code sends to https://api.scryfall.com and the stand-in receives on http://scryfall:8787.
 *
 * The search is deliberately small. A query is reduced to the terms that name a card: an exact
 * term (`!"Grizzly Bears"`), a regex name term (`name:/lightning bolt/`, which the builder sends)
 * and bare words. Every other term (`legal:commander`, `is:gamechanger`, `o:"Partner"`…) narrows
 * nothing, and a query with no name term matches nothing, as the catalogs the editor loads on its
 * own do. Scryfall's own 404 for an empty match is reproduced, because the client treats it as an
 * empty page. Language works as on Scryfall (https://scryfall.com/docs/syntax, read 2026-11-12):
 * only English printings are listed unless the query carries `lang:` and the request
 * `include_multilingual=true`.
 *
 * @module test/scryfall-stand-in
 */

import { getResponse, http, HttpResponse, type HttpHandler } from "msw";
import { z } from "zod";
import { RECORDED_CATALOG_CARDS } from "@/lib/scryfall/fixtures/catalog-cards-v1";
import { isScryfallCard } from "@/lib/scryfall/guards";
import {
  NAMED_NOT_FOUND_RECORDED,
  TALRAND_NAMED_RECORDED,
  WIZARD_COLLECTION_RECORDED,
} from "@/lib/scryfall/fixtures/deck-wizard-v1";
import {
  CARD_NOT_FOUND_RECORDED,
  GRIZZLY_BEARS_PRINTINGS_RECORDED,
  LIGHTNING_BOLT_NAMED_RECORDED,
  SEARCH_NOT_FOUND_RECORDED,
} from "@/lib/scryfall/fixtures/e2e-stand-in-v1";
import type {
  ScryfallCard,
  ScryfallCollectionIdentifier,
  ScryfallError,
} from "@/lib/scryfall/types";

/**
 * The catalog fixtures are recorded wire shapes, not all of them whole cards:
 * Scryfall sends a reversible card without the card-level `cmc` and
 * `type_line` a `ScryfallCard` requires, so the guard drops that one.
 */
const catalogCards: readonly unknown[] = Object.values(RECORDED_CATALOG_CARDS);

/** Every card the stand-in knows: the recorded fixtures, one list. */
export const STAND_IN_CARDS: readonly ScryfallCard[] = [
  ...catalogCards.filter(isScryfallCard),
  ...WIZARD_COLLECTION_RECORDED.data,
  TALRAND_NAMED_RECORDED,
  LIGHTNING_BOLT_NAMED_RECORDED,
  ...GRIZZLY_BEARS_PRINTINGS_RECORDED,
];

/** Scryfall caps an autocomplete answer at 20 names (https://scryfall.com/docs/api/cards/autocomplete, read 2026-11-12). */
const AUTOCOMPLETE_LIMIT = 20;

/** The card's name and each face's name, which Scryfall matches a name against. */
function namesOf(card: ScryfallCard): readonly string[] {
  return [card.name, ...(card.card_faces ?? []).map((face) => face.name)];
}

function hasName(card: ScryfallCard, name: string): boolean {
  const wanted = name.toLowerCase();
  return namesOf(card).some((candidate) => candidate.toLowerCase() === wanted);
}

/** The terms of a Scryfall query that name a card; everything else narrows nothing here. */
interface NameTerms {
  readonly exact: readonly string[];
  readonly patterns: readonly RegExp[];
  readonly words: readonly string[];
  readonly lang: string | null;
}

/**
 * One term of a query: `!"exact"` or `!exact` (1, 2), `key:value` with a quoted, regex or bare
 * value (3, 4, 5), a quoted phrase (6), or a bare word (7).
 */
const TERM =
  /!"([^"]*)"|!(\S+)|-?([a-z_]+)(?::|[<>=!]=?)("[^"]*"|\/[^/]*\/|\S+)()|"([^"]*)"|(\S+)/gi;

function parseNameTerms(query: string): NameTerms {
  const exact: string[] = [];
  const patterns: RegExp[] = [];
  const words: string[] = [];
  let lang: string | null = null;
  // Parentheses group OR clauses, which this matcher does not model.
  for (const match of query.replaceAll(/[()]/g, " ").matchAll(TERM)) {
    const [, exactQuoted, exactBare, key, value, , phrase, word] = match;
    if (exactQuoted !== undefined || exactBare !== undefined) {
      exact.push(exactQuoted ?? exactBare ?? "");
    } else if (key !== undefined && value !== undefined) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "lang") lang = value.toLowerCase();
      if (lowerKey === "name" && value.startsWith("/")) {
        patterns.push(new RegExp(value.slice(1, -1), "i"));
      } else if (lowerKey === "name") {
        words.push(value.replaceAll('"', ""));
      }
    } else if (phrase !== undefined) {
      words.push(phrase);
    } else if (word !== undefined && word.toUpperCase() !== "OR") {
      words.push(word);
    }
  }
  return { exact, patterns, words, lang };
}

function matchesNameTerms(card: ScryfallCard, terms: NameTerms): boolean {
  const names = namesOf(card);
  const lowerNames = names.map((name) => name.toLowerCase());
  return (
    terms.exact.every((name) => hasName(card, name)) &&
    terms.patterns.every((pattern) =>
      names.some((name) => pattern.test(name))
    ) &&
    terms.words.every((word) =>
      lowerNames.some((name) => name.includes(word.toLowerCase()))
    )
  );
}

/** One printing per card unless the request asks for every printing (`unique=prints`). */
function uniqueByCard(cards: readonly ScryfallCard[]): readonly ScryfallCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.oracle_id ?? card.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchResponse(params: URLSearchParams): Response {
  const terms = parseNameTerms(params.get("q") ?? "");
  const namesCard =
    terms.exact.length + terms.patterns.length + terms.words.length > 0;
  const multilingual = params.get("include_multilingual") === "true";
  const lang = terms.lang === null || !multilingual ? "en" : terms.lang;
  const matching = namesCard
    ? STAND_IN_CARDS.filter(
        (card) => (card.lang ?? "en") === lang && matchesNameTerms(card, terms)
      )
    : [];
  const data =
    params.get("unique") === "prints" ? matching : uniqueByCard(matching);
  if (data.length === 0) {
    return HttpResponse.json(SEARCH_NOT_FOUND_RECORDED, { status: 404 });
  }
  return HttpResponse.json({
    object: "list",
    total_cards: data.length,
    has_more: false,
    data,
  });
}

const namedNotFound = (name: string): ScryfallError => ({
  ...NAMED_NOT_FOUND_RECORDED,
  details: `No cards found matching “${name}”`,
});

/** `exact` is a whole name; `fuzzy` is satisfied by the one card whose name contains it. */
function namedResponse(params: URLSearchParams): Response {
  const exact = params.get("exact");
  const fuzzy = params.get("fuzzy");
  const asked = exact ?? fuzzy ?? "";
  const byExactName = STAND_IN_CARDS.find((card) => hasName(card, asked));
  const candidates =
    byExactName !== undefined
      ? [byExactName]
      : exact === null
        ? uniqueByCard(
            STAND_IN_CARDS.filter((card) =>
              card.name.toLowerCase().includes(asked.toLowerCase())
            )
          )
        : [];
  const [card] = candidates;
  return candidates.length === 1 && card !== undefined
    ? HttpResponse.json(card)
    : HttpResponse.json(namedNotFound(asked), { status: 404 });
}

/** Names of which a word starts with the typed text, as Scryfall's catalog lists them. */
function autocompleteResponse(params: URLSearchParams): Response {
  const typed = (params.get("q") ?? "").toLowerCase();
  const names = new Set(
    STAND_IN_CARDS.filter((card) =>
      card.name
        .toLowerCase()
        .split(/\s+/)
        .some((word) => typed !== "" && word.startsWith(typed))
    ).map((card) => card.name)
  );
  const data = [...names].sort().slice(0, AUTOCOMPLETE_LIMIT);
  return HttpResponse.json({
    object: "catalog",
    total_values: data.length,
    data,
  });
}

const COLLECTION_REQUEST = z.object({
  identifiers: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      set: z.string().optional(),
      collector_number: z.string().optional(),
    })
  ),
});

function findByIdentifier(
  identifier: ScryfallCollectionIdentifier
): ScryfallCard | undefined {
  if (identifier.id !== undefined) {
    return STAND_IN_CARDS.find((card) => card.id === identifier.id);
  }
  if (identifier.name !== undefined) {
    const name = identifier.name;
    return STAND_IN_CARDS.find((card) => hasName(card, name));
  }
  return undefined;
}

/** Found cards in request order; an identifier nothing matches is echoed in `not_found`. */
function collectionResponse(body: unknown): Response {
  const parsed = COLLECTION_REQUEST.safeParse(body);
  if (!parsed.success) {
    return HttpResponse.json(
      {
        object: "error",
        code: "bad_request",
        status: 400,
        details: "The stand-in needs an `identifiers` array.",
      },
      { status: 400 }
    );
  }
  const data: ScryfallCard[] = [];
  const notFound: ScryfallCollectionIdentifier[] = [];
  for (const identifier of parsed.data.identifiers) {
    const card = findByIdentifier(identifier);
    if (card === undefined) notFound.push(identifier);
    else data.push(card);
  }
  return HttpResponse.json({ object: "list", not_found: notFound, data });
}

function cardResponse(id: string): Response {
  const card = STAND_IN_CARDS.find((candidate) => candidate.id === id);
  return card === undefined
    ? HttpResponse.json(CARD_NOT_FOUND_RECORDED, { status: 404 })
    : HttpResponse.json(card);
}

/**
 * The handlers, one per endpoint the app calls. The card-by-id handler comes
 * last, because its `:id` segment would otherwise swallow `search`, `named`,
 * `autocomplete` and `collection`.
 *
 * @returns a fresh array, for `setupMsw(...)` or `getResponse`
 */
export function scryfallStandInHandlers(): HttpHandler[] {
  return [
    http.get("*/cards/search", ({ request }) =>
      searchResponse(new URL(request.url).searchParams)
    ),
    http.get("*/cards/named", ({ request }) =>
      namedResponse(new URL(request.url).searchParams)
    ),
    http.get("*/cards/autocomplete", ({ request }) =>
      autocompleteResponse(new URL(request.url).searchParams)
    ),
    http.post("*/cards/collection", async ({ request }) =>
      collectionResponse(await request.json())
    ),
    // No fixture records rulings; the rulings panel shows its empty state.
    http.get("*/cards/:id/rulings", () =>
      HttpResponse.json({ object: "list", has_more: false, data: [] })
    ),
    http.get("*/cards/:id", ({ params }) =>
      cardResponse(typeof params.id === "string" ? params.id : "")
    ),
  ];
}

const HANDLERS = scryfallStandInHandlers();

/**
 * Answers one request as the stand-in does: from the handlers, or with a
 * Scryfall-shaped 404 that names the unserved endpoint, so the app's client
 * sees an error it already handles rather than a hung connection.
 *
 * @param request - the request as received, any origin
 */
export async function answerScryfallRequest(
  request: Request
): Promise<Response> {
  const response = await getResponse(HANDLERS, request);
  if (response !== undefined) return response;
  const { pathname } = new URL(request.url);
  const unserved: ScryfallError = {
    object: "error",
    code: "not_found",
    status: 404,
    details: `The Scryfall stand-in serves no ${request.method} ${pathname}; add a handler in src/test/scryfall-stand-in.ts.`,
  };
  return HttpResponse.json(unserved, { status: 404 });
}
