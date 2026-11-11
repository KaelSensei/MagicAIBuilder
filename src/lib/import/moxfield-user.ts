import { isNonEmptyString, isRecordOrArray } from "@/lib/guards";
import { fetchMoxfieldJson } from "./moxfield-client";

export interface MoxfieldUserDeckSummary {
  readonly id: string;
  readonly name: string;
  readonly format: string | null;
  readonly lastUpdatedAt: string | null;
}

export interface MoxfieldUserDeckPage {
  readonly decks: readonly MoxfieldUserDeckSummary[];
  readonly total: number;
  readonly hasMore: boolean;
}

interface MoxfieldDeckRecord {
  readonly publicId?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
  readonly format?: unknown;
  readonly lastUpdatedAtUtc?: unknown;
}

function asDeckRecord(value: unknown): MoxfieldDeckRecord | null {
  return isRecordOrArray(value) ? value : null;
}

function readItems(data: unknown): { items: readonly unknown[]; total: number } {
  if (!isRecordOrArray(data)) return { items: [], total: 0 };

  const nested = isRecordOrArray(data.results) ? data.results : null;
  let items: readonly unknown[] = [];
  if (Array.isArray(nested?.items)) {
    items = nested.items;
  } else if (Array.isArray(data.data)) {
    items = data.data;
  }
  const rawTotal = nested?.total ?? data.totalResults ?? data.total;
  const total = typeof rawTotal === "number" && Number.isFinite(rawTotal)
    ? rawTotal
    : items.length;

  return { items, total };
}

/**
 * Normalizes the public deck search response returned by Moxfield.
 *
 * @param data Unknown JSON returned by Moxfield's search endpoint.
 * @returns A safe page of deck summaries for the profile picker.
 */
export function parseMoxfieldUserDecks(data: unknown): MoxfieldUserDeckPage {
  const { items, total } = readItems(data);
  const decks: MoxfieldUserDeckSummary[] = [];

  for (const item of items) {
    const record = asDeckRecord(item);
    if (!record) continue;
    const rawId = record.publicId ?? record.id;
    const rawName = record.name;
    if (!isNonEmptyString(rawId) || typeof rawName !== "string") {
      continue;
    }

    decks.push({
      id: rawId,
      name: rawName,
      format: typeof record.format === "string" ? record.format : null,
      lastUpdatedAt: typeof record.lastUpdatedAtUtc === "string" ? record.lastUpdatedAtUtc : null,
    });
  }

  if (decks.length === 0 && items.length > 0) {
    throw new Error("Moxfield returned no usable decks");
  }

  return { decks, total, hasMore: decks.length < total };
}

/**
 * Fetches one public-deck page for a Moxfield username.
 *
 * @param username Moxfield username without the @ prefix.
 * @param pageNumber Zero-based Moxfield page number.
 * @param pageSize Number of summaries requested.
 * @returns Normalized public deck summaries.
 * @throws MoxfieldRefusedError when Moxfield refuses the app.
 */
export async function fetchMoxfieldUserDecks(
  username: string,
  pageNumber = 1,
  pageSize = 20
): Promise<MoxfieldUserDeckPage> {
  const params = new URLSearchParams({
    authorUserNames: username,
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  return parseMoxfieldUserDecks(
    await fetchMoxfieldJson(`https://api2.moxfield.com/v2/decks/search-sfw?${params.toString()}`)
  );
}
