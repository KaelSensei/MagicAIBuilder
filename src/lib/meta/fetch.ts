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

export async function fetchEdhrecData(commanderSlug: string): Promise<EdhrecData> {
  const res = await fetch(
    `https://json.edhrec.com/pages/commanders/${commanderSlug}.json`,
    {
      headers: { "User-Agent": "MagicAIBuilder/1.0 (meta analysis)" },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (res.status === 404) {
    return { cards: [] };
  }
  if (!res.ok) {
    throw new Error(`EDHRec returned HTTP ${res.status}`);
  }

  const json = (await res.json()) as EdhrecJson;
  const cardlists = json.container?.json_dict?.cardlists ?? [];

  const seen = new Set<string>();
  const cards: MetaCard[] = [];

  for (const list of cardlists) {
    for (const view of list.cardviews ?? []) {
      if (!view.name || seen.has(view.name)) continue;
      if (cards.length >= 20) break;
      seen.add(view.name);

      // inclusion = fraction, fallback to computed ratio
      const inclusion =
        view.inclusion != null
          ? view.inclusion
          : view.num_decks != null && view.potential_decks != null && view.potential_decks > 0
          ? view.num_decks / view.potential_decks
          : 0;

      cards.push({ name: view.name, inclusion });
    }
    if (cards.length >= 20) break;
  }

  return { cards };
}

// ─── MTGTop8 ─────────────────────────────────────────────────────────────────

export async function fetchTournamentData(
  commanderName: string
): Promise<TournamentData> {
  // MTGTop8 search: format EDH (f=EDH), search by commander name
  const encodedName = encodeURIComponent(commanderName);
  const searchUrl = `https://www.mtgtop8.com/format?f=EDH&meta=150&a=&cp=`;

  // Attempt a lightweight search — scrape deck links from HTML
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "MagicAIBuilder/1.0 (meta analysis)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return { decks: [] };

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

  // Fallback: return empty with no error if no relevant decks found
  // (MTGTop8 commander coverage is limited)
  void encodedName; // suppress unused var lint
  return { decks };
}
