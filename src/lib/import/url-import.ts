/**
 * URL-based deck import — multi-source.
 *
 * Supported sources:
 *   - Moxfield   : moxfield.com/decks/[id]
 *   - Archidekt  : archidekt.com/decks/[id]
 *   - TappedOut  : tappedout.net/mtg-decks/[slug]
 *   - MTGTop8    : mtgtop8.com/event?e=[id]&d=[id]
 *   - MTGDecks   : mtgdecks.net/Commander/[slug]
 *   - EDHRec     : edhrec.com/commanders/[slug] (average deck)
 *
 * All external calls happen server-side (called from /api/import/url).
 */

export type ImportSource =
  | "moxfield"
  | "archidekt"
  | "tappedout"
  | "mtgtop8"
  | "mtgdecks"
  | "edhrec";

export interface UrlImportCard {
  readonly name: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

export interface UrlImportResult {
  readonly name: string;
  readonly source: ImportSource;
  readonly cards: readonly UrlImportCard[];
  readonly ignored: readonly string[];
  /** Warning shown to user when deck is not Commander format */
  readonly formatWarning?: string;
}

// ─── URL detection ─────────────────────────────────────────────────────────────

const SOURCE_PATTERNS: Array<{
  source: ImportSource;
  re: RegExp;
  extract: (m: RegExpExecArray) => string;
}> = [
  {
    source: "moxfield",
    re: /^https?:\/\/(?:www\.)?moxfield\.com\/decks\/([A-Za-z0-9_-]+)/,
    extract: (m) => m[1],
  },
  {
    source: "archidekt",
    re: /^https?:\/\/(?:www\.)?archidekt\.com\/decks?\/(\d+)/,
    extract: (m) => m[1],
  },
  {
    source: "tappedout",
    re: /^https?:\/\/(?:www\.)?tappedout\.net\/mtg-decks\/([^/?#]+)/,
    extract: (m) => m[1],
  },
  {
    source: "mtgtop8",
    re: /^https?:\/\/(?:www\.)?mtgtop8\.com\/event\?(?:[^#]*&)?d=(\d+)/,
    extract: (m) => m[1],
  },
  {
    source: "mtgdecks",
    re: /^https?:\/\/(?:www\.)?mtgdecks\.net\/[^/]+\/([^/?#]+)/,
    extract: (m) => m[1],
  },
  {
    source: "edhrec",
    re: /^https?:\/\/(?:www\.)?edhrec\.com\/commanders\/([^/?#]+)/,
    extract: (m) => m[1],
  },
];

export function detectSource(
  url: string
): { source: ImportSource; id: string } | null {
  for (const { source, re, extract } of SOURCE_PATTERNS) {
    const m = re.exec(url);
    if (m) return { source, id: extract(m) };
  }
  return null;
}

import { httpGet, parseJson } from "@/lib/http";

// ─── Moxfield ─────────────────────────────────────────────────────────────────

interface MoxfieldCard {
  quantity: number;
  card: { name: string };
}

interface MoxfieldDeck {
  name: string;
  commanders?: Record<string, MoxfieldCard>;
  mainboard?: Record<string, MoxfieldCard>;
  format?: string;
}

async function importMoxfield(id: string): Promise<UrlImportResult> {
  const res = await httpGet(
    `https://api2.moxfield.com/v3/decks/all/${id}`
  );
  const data = parseJson<MoxfieldDeck>(await res.json());
  const cards: UrlImportCard[] = [];

  for (const entry of Object.values(data.commanders ?? {})) {
    cards.push({ name: entry.card.name, quantity: entry.quantity, isCommander: true, isPartner: false });
  }
  for (const entry of Object.values(data.mainboard ?? {})) {
    cards.push({ name: entry.card.name, quantity: entry.quantity, isCommander: false, isPartner: false });
  }

  const formatWarning =
    data.format && !["commander", "edh", "duel"].includes(data.format.toLowerCase())
      ? `This deck uses format "${data.format}" — it may not follow Commander rules.`
      : undefined;

  return { name: data.name, source: "moxfield", cards, ignored: [], formatWarning };
}

// ─── Archidekt ────────────────────────────────────────────────────────────────

interface ArchidektCard {
  quantity: number;
  card: { oracleCard: { name: string } };
  categories: string[];
}

interface ArchidektDeck {
  name: string;
  cards: ArchidektCard[];
  deckFormat?: number; // 3 = Commander
}

async function importArchidekt(id: string): Promise<UrlImportResult> {
  const res = await httpGet(`https://archidekt.com/api/decks/${id}/`);
  const data = parseJson<ArchidektDeck>(await res.json());
  const cards: UrlImportCard[] = [];

  for (const entry of data.cards ?? []) {
    const isCommander = entry.categories.some((c) => c.toLowerCase() === "commander");
    cards.push({ name: entry.card.oracleCard.name, quantity: entry.quantity, isCommander, isPartner: false });
  }

  const formatWarning =
    data.deckFormat !== undefined && data.deckFormat !== 3
      ? "This deck may not be in Commander format."
      : undefined;

  return { name: data.name, source: "archidekt", cards, ignored: [], formatWarning };
}

// ─── TappedOut ────────────────────────────────────────────────────────────────
// TappedOut exposes a plain-text export at /mtg-decks/[slug]/?fmt=txt

async function importTappedOut(slug: string): Promise<UrlImportResult> {
  const res = await httpGet(
    `https://tappedout.net/mtg-decks/${slug}/?fmt=txt`,
    { headers: { Accept: "text/plain" } }
  );
  const text = await res.text();

  if (!text.trim()) throw new Error("Deck is empty or not accessible.");

  const cards = parsePlainTextDecklist(text);
  if (cards.length === 0) throw new Error("No cards found in this deck.");

  const nameMatch = /^#\s*(\S.*)$/m.exec(text);
  const name = nameMatch ? nameMatch[1].trim() : `TappedOut deck (${slug})`;

  return { name, source: "tappedout", cards, ignored: [] };
}

// ─── MTGTop8 ──────────────────────────────────────────────────────────────────
// MTGTop8 deck page has a "Export" button that gives plain text.
// The direct export URL is: /mtg-decks/[event_id]/[deck_id]/export.txt or
// the deck list is in the HTML inside a <textarea> or specific div.

async function importMtgTop8(deckId: string): Promise<UrlImportResult> {
  // Try text export endpoint first
  const res = await httpGet(
    `https://www.mtgtop8.com/mtg-decks/${deckId}/export.txt`,
    { headers: { Accept: "text/plain, text/html" } }
  );
  const text = await res.text();
  const cards = parsePlainTextDecklist(text);

  if (cards.length === 0) {
    // Fall back: parse HTML for deck content
    const htmlRes = await httpGet(
      `https://www.mtgtop8.com/event?e=${deckId}&d=${deckId}`
    );
    const html = await htmlRes.text();
    const extracted = extractCardsFromHtml(html);
    if (extracted.length === 0) throw new Error("Could not parse deck from MTGTop8.");
    return { name: `MTGTop8 deck #${deckId}`, source: "mtgtop8", cards: extracted, ignored: [] };
  }

  return { name: `MTGTop8 deck #${deckId}`, source: "mtgtop8", cards, ignored: [] };
}

// ─── MTGDecks ─────────────────────────────────────────────────────────────────
// mtgdecks.net provides a text export at /[format]/[slug]/txt

async function importMtgDecks(slug: string): Promise<UrlImportResult> {
  const res = await httpGet(
    `https://mtgdecks.net/Commander/${slug}/txt`,
    { headers: { Accept: "text/plain, text/html" } }
  );
  const text = await res.text();
  const cards = parsePlainTextDecklist(text);

  if (cards.length === 0) throw new Error("No cards found in this deck.");

  return { name: `MTGDecks: ${slug}`, source: "mtgdecks", cards, ignored: [] };
}

// ─── EDHRec ───────────────────────────────────────────────────────────────────
// EDHRec average deck JSON: /json_to_card.json?commanders=[slug]

async function importEdhrec(commanderSlug: string): Promise<UrlImportResult> {
  const res = await httpGet(
    `https://json.edhrec.com/pages/commanders/${commanderSlug}.json`
  );
  interface EdhrecImportJson {
    container?: {
      json_dict?: {
        cardlists?: Array<{ tag: string; cardviews: Array<{ name: string }> }>;
        card?: { name: string };
      };
    };
  }
  const data = parseJson<EdhrecImportJson>(await res.json());

  const dict = data.container?.json_dict;
  if (!dict) throw new Error("EDHRec returned unexpected data.");

  const cards: UrlImportCard[] = [];

  // Commander card
  if (dict.card?.name) {
    cards.push({ name: dict.card.name, quantity: 1, isCommander: true, isPartner: false });
  }

  // Top cards from each category (take first 99 to build a complete deck)
  const cardlists = dict.cardlists ?? [];
  for (const list of cardlists) {
    for (const view of list.cardviews ?? []) {
      if (cards.filter((c) => !c.isCommander).length >= 99) break;
      cards.push({ name: view.name, quantity: 1, isCommander: false, isPartner: false });
    }
  }

  const commanderName = dict.card?.name ?? commanderSlug;
  return {
    name: `EDHRec average deck — ${commanderName}`,
    source: "edhrec",
    cards,
    ignored: [],
    formatWarning: "This is an EDHRec average deck, not a specific player's deck.",
  };
}

// ─── Plain-text parser (shared by TappedOut, MTGTop8, MTGDecks) ────────────────

function parsePlainTextDecklist(text: string): UrlImportCard[] {
  const cards: UrlImportCard[] = [];
  let inCommanderSection = false;

  for (const rawLine of text.split("\n").slice(0, 500)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      if (/commander/i.test(line)) inCommanderSection = true;
      else if (/^(deck|main|sideboard)/i.test(line)) inCommanderSection = false;
      continue;
    }

    const m = /^(\d+)x?\s+(\S.*)$/.exec(line);
    if (!m) continue;

    const quantity = Math.min(Math.max(1, Number.parseInt(m[1], 10)), 99);
    const name = m[2]
      .replace(/\s+\/\/\s+\S.*$/, "") // strip back face "Foo // Bar" → "Foo"
      .replace(/\s*\([A-Z0-9]{2,6}\)[\s\d]*$/, "") // strip set codes
      .trim();

    if (!name) continue;

    cards.push({ name, quantity, isCommander: inCommanderSection, isPartner: false });
    if (inCommanderSection) inCommanderSection = false; // only first card in section = commander
  }

  return cards;
}

/** Fallback: extract card names from HTML via simple regex patterns */
function extractCardsFromHtml(html: string): UrlImportCard[] {
  // MTGTop8 has cards in spans/divs with class "O14" or similar
  // Pattern: "N Card Name" in consecutive elements
  const cards: UrlImportCard[] = [];
  const matches = html.matchAll(/\b(\d+)\s+([A-Z][A-Za-z0-9', /()-]{1,60}?)(?=<|&nbsp;|\s{2,})/g);
  for (const m of matches) {
    const quantity = Number.parseInt(m[1], 10);
    const name = m[2].trim();
    if (quantity > 0 && quantity <= 20 && name.length > 2) {
      cards.push({ name, quantity, isCommander: false, isPartner: false });
    }
  }
  // Deduplicate by name
  const seen = new Set<string>();
  return cards.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

// ─── Public entry point ────────────────────────────────────────────────────────

export async function importFromUrl(url: string): Promise<UrlImportResult> {
  const detected = detectSource(url.trim());
  if (!detected) {
    throw new Error(
      "URL not recognised. Supported sources: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec."
    );
  }

  const { source, id } = detected;
  switch (source) {
    case "moxfield":   return importMoxfield(id);
    case "archidekt":  return importArchidekt(id);
    case "tappedout":  return importTappedOut(id);
    case "mtgtop8":    return importMtgTop8(id);
    case "mtgdecks":   return importMtgDecks(id);
    case "edhrec":     return importEdhrec(id);
  }
}
