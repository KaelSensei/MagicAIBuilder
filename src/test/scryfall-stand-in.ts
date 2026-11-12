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
 * One term of a Scryfall query, as its syntax spells it (https://scryfall.com/docs/syntax, read
 * 2026-11-12): `!"exact"` or `!exact`; `key:value`, or `key>=value` and the other comparisons,
 * with a quoted, `/regex/` or bare value kept as written; a quoted phrase; or a bare word.
 */
type QueryTerm =
  | { readonly kind: "exact"; readonly name: string }
  | { readonly kind: "pair"; readonly key: string; readonly value: string }
  | { readonly kind: "phrase"; readonly text: string }
  | { readonly kind: "word"; readonly text: string };

/** A term read from a query and the index just past it. */
interface ScannedTerm {
  readonly term: QueryTerm;
  readonly end: number;
}

/** A slice of a query and the index just past it. */
interface ScannedText {
  readonly text: string;
  readonly end: number;
}

function isWhitespace(char: string | undefined): boolean {
  return char === undefined || /\s/.test(char);
}

/** A key of a `key:value` term is letters and underscores; the value runs on from the operator. */
function isKeyChar(char: string | undefined): boolean {
  return char !== undefined && /[a-z_]/i.test(char);
}

/** The text between `delimiter` at `start` and its next occurrence; null when unopened or unclosed. */
function readDelimited(
  query: string,
  start: number,
  delimiter: string
): ScannedText | null {
  if (query[start] !== delimiter) return null;
  const close = query.indexOf(delimiter, start + 1);
  return close === -1
    ? null
    : { text: query.slice(start + 1, close), end: close + 1 };
}

/** The run of non-whitespace characters from `start`, possibly empty. */
function readBareRun(query: string, start: number): ScannedText {
  let end = start;
  while (end < query.length && !isWhitespace(query[end])) end += 1;
  return { text: query.slice(start, end), end };
}

/** `!"exact name"` or `!exact`; null when `!` stands alone. */
function readExact(query: string, start: number): ScannedTerm | null {
  if (query[start] !== "!") return null;
  const quoted = readDelimited(query, start + 1, '"');
  const { text, end } = quoted ?? readBareRun(query, start + 1);
  if (quoted === null && text === "") return null;
  return { term: { kind: "exact", name: text }, end };
}

/** The length of the operator at `index`: `:`, or `<`, `>`, `=`, `!` with an optional `=`; 0 if none. */
function operatorLength(query: string, index: number): number {
  const char = query[index];
  if (char === ":") return 1;
  if (char === "<" || char === ">" || char === "=" || char === "!") {
    return query[index + 1] === "=" ? 2 : 1;
  }
  return 0;
}

/** `key:value`, with an optional leading `-`; null when no key, operator or value is there. */
function readPair(query: string, start: number): ScannedTerm | null {
  const keyStart = query[start] === "-" ? start + 1 : start;
  let keyEnd = keyStart;
  while (isKeyChar(query[keyEnd])) keyEnd += 1;
  const operator = operatorLength(query, keyEnd);
  if (keyEnd === keyStart || operator === 0) return null;
  const valueStart = keyEnd + operator;
  const value =
    readDelimited(query, valueStart, '"') ??
    readDelimited(query, valueStart, "/") ??
    readBareRun(query, valueStart);
  if (value.end === valueStart) return null;
  const term: QueryTerm = {
    kind: "pair",
    key: query.slice(keyStart, keyEnd),
    value: query.slice(valueStart, value.end),
  };
  return { term, end: value.end };
}

function readPhrase(query: string, start: number): ScannedTerm | null {
  const quoted = readDelimited(query, start, '"');
  return quoted === null
    ? null
    : { term: { kind: "phrase", text: quoted.text }, end: quoted.end };
}

function readWord(query: string, start: number): ScannedTerm {
  const { text, end } = readBareRun(query, start);
  return { term: { kind: "word", text }, end };
}

/** The terms of `query` in order, each read with the first spelling that fits at its position. */
function scanQueryTerms(query: string): readonly QueryTerm[] {
  const terms: QueryTerm[] = [];
  let index = 0;
  while (index < query.length) {
    if (isWhitespace(query[index])) {
      index += 1;
      continue;
    }
    const scanned =
      readExact(query, index) ??
      readPair(query, index) ??
      readPhrase(query, index) ??
      readWord(query, index);
    terms.push(scanned.term);
    index = scanned.end;
  }
  return terms;
}

/** {@link NameTerms} while a query is being folded into it. */
interface NameTermsDraft {
  readonly exact: string[];
  readonly patterns: RegExp[];
  readonly words: string[];
  lang: string | null;
}

/** `lang:` picks the language, `name:` names the card as a regex or words; any other key narrows nothing. */
function collectPair(draft: NameTermsDraft, key: string, value: string): void {
  const lowerKey = key.toLowerCase();
  if (lowerKey === "lang") draft.lang = value.toLowerCase();
  if (lowerKey !== "name") return;
  if (value.startsWith("/")) {
    draft.patterns.push(new RegExp(value.slice(1, -1), "i"));
  } else {
    draft.words.push(value.replaceAll('"', ""));
  }
}

function collectTerm(draft: NameTermsDraft, term: QueryTerm): void {
  switch (term.kind) {
    case "exact":
      draft.exact.push(term.name);
      return;
    case "pair":
      collectPair(draft, term.key, term.value);
      return;
    case "phrase":
      draft.words.push(term.text);
      return;
    case "word":
      // Bare `OR` joins clauses on Scryfall; here it is simply not a name.
      if (term.text.toUpperCase() !== "OR") draft.words.push(term.text);
      return;
    default: {
      const unhandled: never = term;
      return unhandled;
    }
  }
}

function parseNameTerms(query: string): NameTerms {
  const draft: NameTermsDraft = {
    exact: [],
    patterns: [],
    words: [],
    lang: null,
  };
  // Parentheses group OR clauses, which this matcher does not model.
  for (const term of scanQueryTerms(query.replaceAll(/[()]/g, " "))) {
    collectTerm(draft, term);
  }
  return draft;
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

/**
 * The cards a `named` lookup may answer with: the card bearing `asked` as a whole name, else,
 * for a fuzzy lookup only, every card whose name contains it.
 */
function namedCandidates(
  asked: string,
  fuzzy: boolean
): readonly ScryfallCard[] {
  const byExactName = STAND_IN_CARDS.find((card) => hasName(card, asked));
  if (byExactName !== undefined) return [byExactName];
  if (!fuzzy) return [];
  const wanted = asked.toLowerCase();
  return uniqueByCard(
    STAND_IN_CARDS.filter((card) => card.name.toLowerCase().includes(wanted))
  );
}

/** `exact` is a whole name; `fuzzy` is satisfied by the one card whose name contains it. */
function namedResponse(params: URLSearchParams): Response {
  const exact = params.get("exact");
  const asked = exact ?? params.get("fuzzy") ?? "";
  const candidates = namedCandidates(asked, exact === null);
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
  const data = [...names]
    .sort((left, right) => left.localeCompare(right, "en"))
    .slice(0, AUTOCOMPLETE_LIMIT);
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
