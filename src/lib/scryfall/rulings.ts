/** A dated card ruling returned by Scryfall. */
export interface CardRuling {
  readonly source: string;
  readonly publishedAt: string;
  readonly comment: string;
}

/** Indicates whether rulings came from Scryfall or the offline browser cache. */
export type CardRulingsResult =
  | { readonly source: "network"; readonly rulings: readonly CardRuling[] }
  | { readonly source: "cache"; readonly rulings: readonly CardRuling[] };

interface RulingCacheEntry {
  readonly cardId: string;
  readonly rulings: readonly CardRuling[];
}

const SCRYFALL_BASE = "https://api.scryfall.com";
const RULINGS_CACHE_KEY = "magic-ai-builder:rulings:v1";

/** Maximum recently viewed cards retained for offline rulings access. */
const MAX_CACHED_CARDS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRuling(value: unknown): CardRuling | null {
  if (!isRecord(value)) return null;
  const source = value["source"];
  const publishedAt = value["published_at"] ?? value["publishedAt"];
  const comment = value["comment"];
  if (
    typeof source !== "string" ||
    typeof publishedAt !== "string" ||
    typeof comment !== "string"
  ) {
    return null;
  }
  return { source, publishedAt, comment };
}

function parseRulings(value: unknown): readonly CardRuling[] | null {
  if (!Array.isArray(value)) return null;
  const rulings: CardRuling[] = [];
  for (const item of value) {
    const ruling = parseRuling(item);
    if (!ruling) return null;
    rulings.push(ruling);
  }
  return rulings;
}

function parseCacheEntry(value: unknown): RulingCacheEntry | null {
  if (!isRecord(value) || typeof value["cardId"] !== "string") return null;
  const rulings = parseRulings(value["rulings"]);
  if (!rulings) return null;
  return { cardId: value["cardId"], rulings };
}

function readCache(): readonly RulingCacheEntry[] {
  if (typeof globalThis.localStorage === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      globalThis.localStorage.getItem(RULINGS_CACHE_KEY) ?? "[]"
    );
    if (!Array.isArray(parsed)) return [];
    const entries: RulingCacheEntry[] = [];
    for (const value of parsed) {
      const entry = parseCacheEntry(value);
      if (entry) entries.push(entry);
    }
    return entries;
  } catch {
    return [];
  }
}

function findCachedRulings(cardId: string): readonly CardRuling[] | null {
  for (const entry of readCache()) {
    if (entry.cardId === cardId) return entry.rulings;
  }
  return null;
}

function writeCache(cardId: string, rulings: readonly CardRuling[]): void {
  if (typeof globalThis.localStorage === "undefined") return;
  const entries: RulingCacheEntry[] = [{ cardId, rulings }];
  for (const entry of readCache()) {
    if (entry.cardId !== cardId && entries.length < MAX_CACHED_CARDS) {
      entries.push(entry);
    }
  }
  try {
    globalThis.localStorage.setItem(RULINGS_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable or full; online rulings remain usable.
  }
}

async function fetchRulings(cardId: string): Promise<readonly CardRuling[]> {
  const response = await fetch(
    `${SCRYFALL_BASE}/cards/${encodeURIComponent(cardId)}/rulings`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) {
    throw new Error(`Scryfall rulings request failed: ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error("Invalid Scryfall rulings response");
  const rulings = parseRulings(payload["data"]);
  if (!rulings) throw new Error("Invalid Scryfall rulings response");
  return rulings;
}

/**
 * Fetches rulings and retains successful responses for later offline access.
 *
 * @param cardId - Scryfall printing ID whose Oracle rulings should be loaded.
 * @returns Rulings plus whether they came from the network or offline cache.
 */
export async function getCardRulings(cardId: string): Promise<CardRulingsResult> {
  try {
    const rulings = await fetchRulings(cardId);
    writeCache(cardId, rulings);
    return { source: "network", rulings };
  } catch (error) {
    const cached = findCachedRulings(cardId);
    if (cached) return { source: "cache", rulings: cached };
    throw error instanceof Error
      ? error
      : new Error("Unable to load card rulings");
  }
}
