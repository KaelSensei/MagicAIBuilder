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
  readonly date?: string;
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
    .replace(/[^a-z0-9\s-]/g, "") // strip punctuation
    .trim()
    .replace(/\s+/g, "-");        // spaces → hyphens
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

export async function fetchTournamentData(
  commanderName: string
): Promise<TournamentData> {
  const searchUrl = "https://www.mtgtop8.com/format?f=EDH&meta=150&a=&cp=";

  let res: Response;
  try {
    res = await httpGet(searchUrl, { headers: { Accept: "text/html" } });
  } catch {
    return { decks: [] };
  }

  const html = await res.text();

  // MTGTop8 deck entries typically have links like /event?e=XXX&d=YYY
  const deckLinkRe = /href="\/event\?e=(\d+)&d=(\d+)"[^>]*>([^<]+)<\/a>/gi;
  const decks: TournamentDeck[] = [];
  let m: RegExpExecArray | null;

  while ((m = deckLinkRe.exec(html)) !== null && decks.length < 5) {
    const eventId = m[1];
    const deckId = m[2];
    const deckName = m[3].trim();
    // Only include if commander name appears nearby in the HTML (simple heuristic)
    const contextStart = Math.max(0, m.index - 200);
    const context = html.slice(contextStart, m.index + 200).toLowerCase();
    const slugWords = commanderToSlug(commanderName).split("-").slice(0, 2);
    const isRelevant = slugWords.some((w) => w.length > 3 && context.includes(w));
    if (!isRelevant && decks.length === 0) continue; // Skip unrelated results

    decks.push({
      name: deckName || `EDH Deck #${deckId}`,
      url: `https://www.mtgtop8.com/event?e=${eventId}&d=${deckId}`,
      source: "mtgtop8",
    });
  }

  return { decks };
}
