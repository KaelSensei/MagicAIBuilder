/**
 * URL-based deck import — multi-source.
 *
 * Supported sources:
 *   - Moxfield   : moxfield.com/decks/[id]
 *   - Archidekt  : archidekt.com/decks/[id]
 *   - TappedOut  : tappedout.net/mtg-decks/[slug]
 *   - MTGTop8    : mtgtop8.com/event?e=[id]&d=[id]
 *   - MTGDecks   : mtgdecks.net/Commander/[slug]
 *   - AetherHub  : aetherhub.com/Deck/Builder?m=...&sb=...&t=cmd
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
  | "aetherhub"
  | "edhrec";

export interface UrlImportCard {
  readonly name: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly isCompanion?: boolean;
  readonly zone: "main" | "sideboard" | "maybeboard";
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
    re: /^https?:\/\/(?:www\.)?mtgdecks\.net\/([^/?#]+)\/([^/?#]+)/,
    extract: (m) => m[2],
  },
  {
    source: "aetherhub",
    re: /^https?:\/\/(?:www\.)?aetherhub\.com\/Deck\/Builder\?[^#]+/i,
    extract: (m) => m[0],
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
  const candidate = /^https?:\/\//.test(url) ? url : `https://${url}`;
  for (const { source, re, extract } of SOURCE_PATTERNS) {
    const m = re.exec(candidate);
    if (m) return { source, id: extract(m) };
  }

  // Tolerant Moxfield import: accept raw publicId-like strings (letters + digits + _-).
  // Avoid treating purely numeric values as Moxfield IDs (those often belong to other sources like Archidekt).
  if (/^[A-Za-z0-9_-]+$/.test(url) && /[A-Za-z_-]/.test(url)) {
    return { source: "moxfield", id: url };
  }

  return null;
}

import { httpGet, parseJson } from "@/lib/http";
import { normalizeImportedName } from "@/lib/scryfall/name-index";
import { extractCardsFromHtml, parsePlainTextDecklist } from "./decklist-parse";

// ─── Moxfield ─────────────────────────────────────────────────────────────────

interface MoxfieldCard {
  quantity: number;
  card: { name: string };
}

interface MoxfieldBoard {
  cards?: Record<string, MoxfieldCard>;
}

interface MoxfieldDeck {
  name: string;
  commanders?: Record<string, MoxfieldCard>;
  mainboard?: Record<string, MoxfieldCard>;
  format?: string;
  boards?: {
    commanders?: MoxfieldBoard;
    mainboard?: MoxfieldBoard;
    companions?: MoxfieldBoard;
    sideboard?: MoxfieldBoard;
    maybeboard?: MoxfieldBoard;
  };
}

/**
 * Prefers a Moxfield board, then a legacy top-level map.
 *
 * @param board - nested board, when the payload has one
 * @param fallback - legacy map used when the board is empty
 * @returns the card entries to import
 */
function moxfieldEntries(
  board: MoxfieldBoard | undefined,
  fallback?: Record<string, MoxfieldCard>
): readonly MoxfieldCard[] {
  const fromBoard = Object.values(board?.cards ?? {});
  if (fromBoard.length > 0) return fromBoard;
  return Object.values(fallback ?? {});
}

interface MoxfieldAppendOptions {
  readonly commandZone?: boolean;
  readonly companion?: boolean;
}

/**
 * Appends one Moxfield board onto the import list.
 *
 * @param cards - import list being built
 * @param entries - cards on the board
 * @param zone - deck zone those cards belong to
 * @param options - command-zone ordering or companion flag
 */
function appendMoxfieldCards(
  cards: UrlImportCard[],
  entries: readonly MoxfieldCard[],
  zone: UrlImportCard["zone"],
  options?: MoxfieldAppendOptions
): void {
  for (const [index, entry] of entries.entries()) {
    const imported: UrlImportCard = {
      name: entry.card.name,
      quantity: entry.quantity,
      isCommander: options?.commandZone === true && index === 0,
      isPartner: options?.commandZone === true && index === 1,
      zone,
    };
    cards.push(options?.companion === true ? { ...imported, isCompanion: true } : imported);
  }
}

/**
 * Warning shown when a Moxfield deck is not a Commander-like format.
 *
 * @param format - format string from Moxfield, if any
 * @returns the warning, or undefined when the format is acceptable or absent
 */
function moxfieldFormatWarning(format: string | undefined): string | undefined {
  if (!format) return undefined;
  const normalized = format.toLowerCase();
  if (normalized === "commander" || normalized === "edh" || normalized === "duel") return undefined;
  return `This deck uses format "${format}" — it may not follow Commander rules.`;
}

async function importMoxfield(id: string): Promise<UrlImportResult> {
  const res = await httpGet(`https://api2.moxfield.com/v3/decks/all/${id}`, {
    headers: { Accept: "application/json" },
  });
  const data = parseJson<MoxfieldDeck>(await res.json());
  const cards: UrlImportCard[] = [];
  appendMoxfieldCards(cards, moxfieldEntries(data.boards?.commanders, data.commanders), "main", {
    commandZone: true,
  });
  appendMoxfieldCards(cards, moxfieldEntries(data.boards?.mainboard, data.mainboard), "main");
  appendMoxfieldCards(cards, moxfieldEntries(data.boards?.companions), "main", { companion: true });
  appendMoxfieldCards(cards, moxfieldEntries(data.boards?.sideboard), "sideboard");
  appendMoxfieldCards(cards, moxfieldEntries(data.boards?.maybeboard), "maybeboard");

  return {
    name: data.name,
    source: "moxfield",
    cards,
    ignored: [],
    formatWarning: moxfieldFormatWarning(data.format),
  };
}

// ─── Archidekt ────────────────────────────────────────────────────────────────

interface ArchidektCard {
  quantity: number;
  card: { oracleCard: { name: string } };
  categories: string[];
}

interface ArchidektCategory {
  name: string;
  includedInDeck?: boolean;
}

interface ArchidektDeck {
  name: string;
  cards: ArchidektCard[];
  /** Category metadata — the source of truth for what the deck actually runs */
  categories?: ArchidektCategory[];
  deckFormat?: number; // 3 = Commander
}

/**
 * Resolves the zone an Archidekt card belongs to.
 *
 * Archidekt models Maybeboard/Sideboard/Considering (and any custom name) as
 * categories flagged `includedInDeck: false` — importing those into the main
 * zone would silently change the deck's contents. The name check backstops
 * the two conventional names when the metadata is absent from a payload.
 */
function archidektZone(
  cardCategories: readonly string[],
  notIncluded: ReadonlySet<string>
): UrlImportCard["zone"] {
  for (const category of cardCategories) {
    const lower = category.toLowerCase();
    if (lower === "sideboard") return "sideboard";
    if (notIncluded.has(lower) || lower === "maybeboard" || lower === "considering") {
      return "maybeboard";
    }
  }
  return "main";
}

async function importArchidekt(id: string): Promise<UrlImportResult> {
  const res = await httpGet(`https://archidekt.com/api/decks/${id}/`);
  const data = parseJson<ArchidektDeck>(await res.json());
  const cards: UrlImportCard[] = [];

  const notIncluded = new Set(
    (data.categories ?? [])
      .filter((c) => c.includedInDeck === false)
      .map((c) => c.name.toLowerCase())
  );

  // Archidekt has no partner flag — both halves of a pair sit in the
  // Commander category, and importing both as commander loses the second.
  let commanderSeen = false;
  for (const entry of data.cards ?? []) {
    const inCommanderCategory = entry.categories.some(
      (c) => c.toLowerCase() === "commander"
    );
    const isCommander = inCommanderCategory && !commanderSeen;
    const isPartner = inCommanderCategory && commanderSeen;
    if (inCommanderCategory) commanderSeen = true;

    cards.push({
      name: entry.card.oracleCard.name,
      quantity: entry.quantity,
      isCommander,
      isPartner,
      zone: inCommanderCategory ? "main" : archidektZone(entry.categories, notIncluded),
    });
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

/**
 * Returns the public MTGDecks format and slug path used by its text endpoint.
 *
 * @param url - A detected public MTGDecks deck URL.
 * @returns The format and deck slug separated by a slash.
 */
function mtgDecksPath(url: string): string {
  const candidate = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const pathParts = new URL(candidate).pathname.split("/").filter(Boolean);
  const format = pathParts[0];
  const slug = pathParts[1];

  if (!format || !slug) {
    throw new Error("MTGDecks URL is missing its format or deck identifier.");
  }

  return `${format}/${slug}`;
}

async function importMtgDecks(deckPath: string, slug: string): Promise<UrlImportResult> {
  const res = await httpGet(
    `https://mtgdecks.net/${deckPath}/txt`,
    { headers: { Accept: "text/plain, text/html" } }
  );
  const text = await res.text();
  const cards = parsePlainTextDecklist(text);

  if (cards.length === 0) throw new Error("No cards found in this deck.");

  return { name: `MTGDecks: ${slug}`, source: "mtgdecks", cards, ignored: [] };
}

/** Import AetherHub's documented URL payload without scraping a public page. */
function importAetherHub(url: string): UrlImportResult {
  const params = new URL(url).searchParams;
  const main = parsePlainTextDecklist(params.get("m") ?? "");
  const sideboardText = params.get("sb") ?? "";
  const isCommander = params.get("t") === "cmd";
  const sideboardHeader = isCommander ? "Commander" : "Sideboard";
  const sideboardPayload = sideboardText
    ? `${sideboardHeader}\n${sideboardText}`
    : "";
  const sideboard = parsePlainTextDecklist(sideboardPayload);

  if (main.length === 0 && sideboard.length === 0) {
    throw new Error("AetherHub URL does not contain any cards");
  }

  return {
    name: "AetherHub deck",
    source: "aetherhub",
    cards: [...main, ...sideboard],
    ignored: [],
    ...(isCommander ? {} : { formatWarning: "This AetherHub deck is not marked as Commander." }),
  };
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
  const seenNames = new Set<string>();

  // Commander card
  if (dict.card?.name) {
    cards.push({ name: dict.card.name, quantity: 1, isCommander: true, isPartner: false, zone: "main" });
    seenNames.add(normalizeImportedName(dict.card.name));
  }

  // Top cards from each category (take first 99 to build a complete deck)
  const cardlists = dict.cardlists ?? [];
  let mainCount = 0;
  for (const list of cardlists) {
    for (const view of list.cardviews ?? []) {
      if (mainCount >= 99) break;
      const key = normalizeImportedName(view.name);
      if (!key || seenNames.has(key)) continue;
      seenNames.add(key);
      cards.push({ name: view.name, quantity: 1, isCommander: false, isPartner: false, zone: "main" });
      mainCount++;
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

// ─── Public entry point ────────────────────────────────────────────────────────

export async function importFromUrl(url: string): Promise<UrlImportResult> {
  const detected = detectSource(url.trim());
  if (!detected) {
    throw new Error(
      "URL not recognised. Supported sources: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, AetherHub, EDHRec."
    );
  }

  const { source, id } = detected;
  switch (source) {
    case "moxfield":   return importMoxfield(id);
    case "archidekt":  return importArchidekt(id);
    case "tappedout":  return importTappedOut(id);
    case "mtgtop8":    return importMtgTop8(id);
    case "mtgdecks":   return importMtgDecks(mtgDecksPath(url.trim()), id);
    case "aetherhub":  return importAetherHub(id);
    case "edhrec":     return importEdhrec(id);
  }
}
