/**
 * The MTGTop8 adapter: the recent tournament decks for a commander, read from
 * the site's EDH search (ADR 0004, one adapter per provider).
 *
 * Meta-insights context, `infrastructure/`. This module owns the I/O of the
 * tournament source: the two HTTP calls (the search form, then the search),
 * the day-long cache of the archetype form, and the rule that tells an
 * ignored card filter from an empty feed. The parsing of the site's HTML and
 * the archetype matching stay in `mtgtop8.ts`, which has no I/O, so each can
 * be tested alone. `meta-provider.ts` exposes {@link fetchTournamentData} as
 * the tournament half of the `MetaProvider` port; `server.ts` also publishes
 * it for a caller that wants the provider without the cache.
 *
 * @module meta-insights/infrastructure/mtgtop8-source
 */
import { httpGet } from "@/lib/http";
import type { TournamentData } from "@/modules/meta-insights/domain/types";
import {
  MTGTOP8_SEARCH_URL,
  buildSearchBody,
  decodeLatin1,
  findArchetypeId,
  parseArchetypeOptions,
  parseSearchResults,
  readCardFilterEcho,
} from "./mtgtop8";

/** The panel shows the most recent decks only; a search page lists up to 25. */
const MAX_TOURNAMENT_DECKS = 5;

/**
 * How long the archetype form is reused: the same day the meta cache keeps an
 * answer fresh, so a commander MTGTop8 classified since is found at the latest
 * when its cached answer expires.
 */
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
 * filter reads as "no recorded deck", not as 44,000 unrelated ones (#1462).
 * Failures propagate so the use case can serve the stale cache without
 * replacing a previously good feed.
 *
 * @param commanderName - display name, or the slug's words as the meta route passes them
 * @returns the five most recent decks, or none when MTGTop8 has no deck for the commander
 * @throws when the form or the search cannot be fetched, or when either page
 *   no longer has the shape the parser knows: a changed site is rejected
 *   rather than read as an empty feed
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
