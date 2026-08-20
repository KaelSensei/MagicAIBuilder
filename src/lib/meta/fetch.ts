/**
 * Meta analysis data fetchers.
 *
 * EDHRec  → popular cards for a commander (via unofficial JSON endpoint)
 * MTGTop8 → recent tournament decks for a commander (scraping)
 */

export interface MetaCard {
  readonly name: string;
  /** Fraction of decks (0–1), e.g. 0.78 = 78% */
  readonly inclusion: number;
  readonly imageUri?: string;
}

export interface TournamentDeck {
  readonly name: string;
  readonly player?: string;
  readonly event?: string;
  /** ISO date `yyyy-mm-dd` */
  readonly date?: string;
  /** Finishing position as the source prints it: "1", "8", "3-4" */
  readonly placement?: string;
  /** The source's format label — on MTGTop8 this is mostly "Duel Commander" (1v1) */
  readonly format?: string;
  /** Event size, 1 (local) to 4 (major), as MTGTop8 rates it */
  readonly eventLevel?: number;
  readonly url: string;
  readonly source: "mtgtop8" | "mtgdecks";
}

export interface EdhrecData {
  readonly cards: readonly MetaCard[];
}

export interface TournamentData {
  readonly decks: readonly TournamentDeck[];
}

// ─── EDHRec ───────────────────────────────────────────────────────────────────

/** Convert a commander name to an EDHRec slug, e.g. "Atraxa, Praetors' Voice" → "atraxa-praetors-voice" */
export function commanderToSlug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "") // strip punctuation
    .trim()
    .replaceAll(/\s+/g, "-"); // spaces → hyphens
}

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
} from "./mtgtop8";

function inclusionFromEdhrecView(view: EdhrecCardView): number {
  if (view.inclusion != null) return view.inclusion;
  if (
    view.num_decks != null &&
    view.potential_decks != null &&
    view.potential_decks > 0
  ) {
    return view.num_decks / view.potential_decks;
  }
  return 0;
}

function collectMetaCardsFromEdhrecLists(
  cardlists:
    | Array<{ tag: string; cardviews?: EdhrecCardView[] }>
    | undefined
): MetaCard[] {
  const lists = cardlists ?? [];
  const seen = new Set<string>();
  const cards: MetaCard[] = [];

  outer: for (const list of lists) {
    for (const view of list.cardviews ?? []) {
      if (!view.name || seen.has(view.name)) continue;
      if (cards.length >= 20) break outer;
      seen.add(view.name);
      cards.push({ name: view.name, inclusion: inclusionFromEdhrecView(view) });
    }
  }

  return cards;
}

export async function fetchEdhrecData(commanderSlug: string): Promise<EdhrecData> {
  let res: Response;
  try {
    res = await httpGet(`https://json.edhrec.com/pages/commanders/${commanderSlug}.json`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      return { cards: [] };
    }
    throw err;
  }

  const json = parseJson<EdhrecJson>(await res.json());
  const cardlists = json.container?.json_dict?.cardlists;
  const cards = collectMetaCardsFromEdhrecLists(cardlists);

  return { cards };
}

// ─── MTGTop8 ─────────────────────────────────────────────────────────────────

const MAX_TOURNAMENT_DECKS = 5;
const ARCHETYPE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let archetypeCache: { readonly options: ReadonlyMap<string, number>; readonly expiresAt: number } | null =
  null;

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
  if (archetypeCache && archetypeCache.expiresAt > Date.now()) return archetypeCache.options;
  const res = await httpGet(MTGTOP8_SEARCH_URL, { headers: { Accept: "text/html" } });
  const options = parseArchetypeOptions(decodeLatin1(await res.arrayBuffer()));
  archetypeCache = { options, expiresAt: Date.now() + ARCHETYPE_CACHE_TTL_MS };
  return options;
}

/**
 * Recent tournament decks for a commander, with event context.
 *
 * Searches MTGTop8 by commander archetype (decks *led* by the commander) and
 * falls back to a card-content search for a commander the site has not
 * classified. Any failure yields an empty list: the meta panel treats the
 * tournament feed as best-effort and the route serves stale cache when it can.
 *
 * @param commanderName - display name, or the slug's words as the meta route passes them
 */
export async function fetchTournamentData(commanderName: string): Promise<TournamentData> {
  try {
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
    const decks = parseSearchResults(decodeLatin1(await res.arrayBuffer()));
    return { decks: decks.slice(0, MAX_TOURNAMENT_DECKS) };
  } catch {
    return { decks: [] };
  }
}

