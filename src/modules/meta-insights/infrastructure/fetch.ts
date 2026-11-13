/**
 * Meta analysis data fetchers.
 *
 * EDHRec  → popular cards for a commander (via unofficial JSON endpoint)
 * MTGTop8 → recent tournament decks for a commander (scraping)
 *
 * The shapes they return are declared in `./types`, so modules that only need
 * a type (the MTGTop8 parser, snapshots, history, the panel) do not import the
 * fetchers.
 *
 * @module meta/fetch
 */

import type { EdhrecData, MetaCard, TournamentData } from "@/modules/meta-insights/domain/types";

// ─── EDHRec ───────────────────────────────────────────────────────────────────

interface EdhrecCardView {
  name: string;
  num_decks?: number;
  potential_decks?: number;
  inclusion?: number;
}

interface EdhrecJson {
  container?: {
    json_dict?: {
      cardlists?: Array<{
        tag: string;
        cardviews: EdhrecCardView[];
      }>;
    };
  };
}

import { httpGet, parseJson } from "@/lib/http";
import {
  MTGTOP8_SEARCH_URL,
  buildSearchBody,
  decodeLatin1,
  findArchetypeId,
  parseArchetypeOptions,
  parseSearchResults,
  readCardFilterEcho,
} from "./mtgtop8";

function inclusionFromEdhrecView(view: EdhrecCardView): number {
  if (
    typeof view.inclusion === "number" &&
    Number.isFinite(view.inclusion) &&
    view.inclusion >= 0 &&
    view.inclusion <= 1
  )
    return view.inclusion;
  if (
    typeof view.num_decks === "number" &&
    typeof view.potential_decks === "number" &&
    Number.isFinite(view.num_decks) &&
    Number.isFinite(view.potential_decks) &&
    view.num_decks >= 0 &&
    view.potential_decks > 0 &&
    view.num_decks <= view.potential_decks
  ) {
    return view.num_decks / view.potential_decks;
  }
  return 0;
}

function sampleFromEdhrecView(view: EdhrecCardView): MetaCard["sample"] {
  if (
    !Number.isSafeInteger(view.num_decks) ||
    !Number.isSafeInteger(view.potential_decks) ||
    view.num_decks === undefined ||
    view.potential_decks === undefined ||
    view.num_decks < 0 ||
    view.potential_decks <= 0 ||
    view.num_decks > view.potential_decks
  )
    return undefined;
  return { decksWithCard: view.num_decks, eligibleDecks: view.potential_decks };
}

function collectMetaCardsFromEdhrecLists(
  cardlists: Array<{ tag: string; cardviews?: EdhrecCardView[] }> | undefined
): MetaCard[] {
  const lists = cardlists ?? [];
  const seen = new Set<string>();
  const cards: MetaCard[] = [];

  for (const list of lists) {
    for (const view of list.cardviews ?? []) {
      if (!view.name || seen.has(view.name)) continue;
      seen.add(view.name);
      const sample = sampleFromEdhrecView(view);
      cards.push({
        name: view.name,
        inclusion: sample
          ? sample.decksWithCard / sample.eligibleDecks
          : inclusionFromEdhrecView(view),
        ...(sample ? { sample } : {}),
      });
    }
  }

  cards.sort((a, b) => b.inclusion - a.inclusion);
  return cards.slice(0, 20);
}

export async function fetchEdhrecData(
  commanderSlug: string
): Promise<EdhrecData> {
  let res: Response;
  try {
    res = await httpGet(
      `https://json.edhrec.com/pages/commanders/${commanderSlug}.json`
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      return { cards: [] };
    }
    throw err;
  }

  const json = parseJson<EdhrecJson | null>(await res.json());
  const cardlists = json?.container?.json_dict?.cardlists;
  if (
    !Array.isArray(cardlists) ||
    cardlists.some(
      (list) =>
        !list || typeof list.tag !== "string" || !Array.isArray(list.cardviews)
    )
  ) {
    throw new Error("Invalid EDHREC response: cardlists malformed");
  }
  const cards = collectMetaCardsFromEdhrecLists(cardlists);

  return { cards };
}

// ─── MTGTop8 ─────────────────────────────────────────────────────────────────

const MAX_TOURNAMENT_DECKS = 5;
const ARCHETYPE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let archetypeCache: {
  readonly options: ReadonlyMap<string, number>;
  readonly expiresAt: number;
} | null = null;

/** Reset the archetype form cache (tests only). @internal */
export function __resetArchetypeCache(): void {
  archetypeCache = null;
}

/**
 * The commander → archetype id map from the MTGTop8 search form, fetched at
 * most once a day per server instance. The form is ~1,500 options and every
 * commander shares it, so fetching it per request would be the slow half of
 * each lookup.
 */
async function loadArchetypeOptions(): Promise<ReadonlyMap<string, number>> {
  if (archetypeCache && archetypeCache.expiresAt > Date.now())
    return archetypeCache.options;
  const res = await httpGet(MTGTOP8_SEARCH_URL, {
    headers: { Accept: "text/html" },
  });
  const options = parseArchetypeOptions(decodeLatin1(await res.arrayBuffer()));
  if (options.size === 0)
    throw new Error("Invalid MTGTop8 response: EDH archetypes missing");
  archetypeCache = { options, expiresAt: Date.now() + ARCHETYPE_CACHE_TTL_MS };
  return options;
}

/**
 * Recent tournament decks for a commander, with event context.
 *
 * Searches MTGTop8 by commander archetype (decks *led* by the commander) and
 * falls back to a card-content search for a commander the site has not
 * classified. The site ignores a card name it does not know and answers with
 * the whole EDH section; its echoed form tells the two apart, and an ignored
 * filter reads as "no recorded deck", not as 44,000 unrelated ones. Failures
 * propagate so the route can serve stale cache without replacing a previously
 * good feed.
 *
 * @param commanderName - display name, or the slug's words as the meta route passes them
 * @returns the five most recent decks, or none when MTGTop8 has no deck for the commander
 */
export async function fetchTournamentData(
  commanderName: string
): Promise<TournamentData> {
  const options = await loadArchetypeOptions();
  const archetypeId = findArchetypeId(options, commanderName);
  const res = await httpGet(MTGTOP8_SEARCH_URL, {
    method: "POST",
    headers: {
      Accept: "text/html",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildSearchBody({ archetypeId, commanderName }).toString(),
  });
  const page = decodeLatin1(await res.arrayBuffer());
  if (archetypeId === null && readCardFilterEcho(page) === null) {
    return { decks: [] };
  }
  const decks = parseSearchResults(page);
  return { decks: decks.slice(0, MAX_TOURNAMENT_DECKS) };
}
