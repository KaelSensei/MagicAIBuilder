/**
 * The EDHREC adapter: the cards EDHREC reports as popular for a commander,
 * with their inclusion rates, read from the site's commander JSON page
 * (ADR 0004, one adapter per provider).
 *
 * Meta-insights context, `infrastructure/`. EDHREC's wire shape
 * (`container.json_dict.cardlists[].cardviews[]`) stays in this file: the
 * adapter validates it, maps each view to a `MetaCard` and returns the
 * `EdhrecData` of `domain/types.ts`. `meta-provider.ts` exposes
 * {@link fetchEdhrecData} as the EDHREC half of the `MetaProvider` port;
 * `server.ts` also publishes it for a caller that wants the provider without
 * the cache. The recorded page is `fixtures/edhrec-commander-v1.ts`.
 *
 * The endpoint is unofficial: `https://json.edhrec.com/pages/commanders/<slug>.json`
 * is what the EDHREC site itself loads (read 2026-11-12, when the fixture was
 * recorded). A changed shape is rejected rather than read as an empty list.
 *
 * @module meta-insights/infrastructure/edhrec
 */
import { httpGet, parseJson } from "@/lib/http";
import type {
  EdhrecData,
  MetaCard,
} from "@/modules/meta-insights/domain/types";

/** One card entry of an EDHREC card list, with the fields the adapter reads. */
interface EdhrecCardView {
  name: string;
  num_decks?: number;
  potential_decks?: number;
  inclusion?: number;
}

/** The part of the commander page the adapter reads. */
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

/** EDHREC's top 20 across the page's lists is what the panel shows and what `history.ts` differences. */
const MAX_META_CARDS = 20;

/**
 * The inclusion EDHREC states, when it is a fraction between 0 and 1; else
 * the ratio of its two counts, when they are consistent; else 0.
 */
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

/** The two counts behind the inclusion, when EDHREC gave both and they agree. */
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

/**
 * Every card of every list, one entry per name (the first list met wins),
 * ranked by inclusion and cut at {@link MAX_META_CARDS}. A card's list
 * ("Lands", "New Cards") is dropped: the panel shows one flat list.
 */
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
  return cards.slice(0, MAX_META_CARDS);
}

/**
 * The popular cards EDHREC lists for a commander, top 20 by inclusion.
 *
 * A commander EDHREC does not know (its page answers 404) reads as no cards
 * and no error, so the panel can say "no EDHREC data" instead of failing.
 * Every other failure propagates: a transport error, a bot challenge, a body
 * that is not JSON, or a page whose card lists no longer have the recorded
 * shape. The use case then serves the stale cache, which must not be
 * replaced by an empty list that a changed site would otherwise produce.
 *
 * @param commanderSlug - the commander slug the route validated, as EDHREC spells its URLs
 * @throws `HttpStatusError` on a non-404 status, or an `Error` naming the malformed field
 */
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
