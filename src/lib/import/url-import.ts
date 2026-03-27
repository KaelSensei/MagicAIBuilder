// URL-based deck import — Moxfield and Archidekt
// No auth required on these public APIs.

export type ImportSource = "moxfield" | "archidekt";

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
  readonly ignored: readonly string[]; // cards that couldn't be resolved
}

// ─── URL parsing ─────────────────────────────────────────────────────────────

const MOXFIELD_RE = /^https?:\/\/(?:www\.)?moxfield\.com\/decks\/([A-Za-z0-9_-]+)/;
const ARCHIDEKT_RE = /^https?:\/\/(?:www\.)?archidekt\.com\/decks?\/(\d+)/;

export function detectSource(url: string): { source: ImportSource; id: string } | null {
  const mox = MOXFIELD_RE.exec(url);
  if (mox) return { source: "moxfield", id: mox[1] };

  const archi = ARCHIDEKT_RE.exec(url);
  if (archi) return { source: "archidekt", id: archi[1] };

  return null;
}

// ─── Moxfield ─────────────────────────────────────────────────────────────────

interface MoxfieldCard {
  quantity: number;
  card: { name: string };
  isCommander?: boolean;
}

interface MoxfieldDeck {
  name: string;
  commanders?: Record<string, MoxfieldCard>;
  mainboard?: Record<string, MoxfieldCard>;
  sideboard?: Record<string, MoxfieldCard>;
  companions?: Record<string, MoxfieldCard>;
}

async function fetchMoxfield(id: string): Promise<UrlImportResult> {
  const res = await fetch(`https://api2.moxfield.com/v3/decks/all/${id}`, {
    headers: {
      "User-Agent": "MagicAIBuilder/1.0 (deck import)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) throw new Error("Deck not found or is private.");
  if (!res.ok) throw new Error(`Moxfield returned HTTP ${res.status}.`);

  const data = (await res.json()) as MoxfieldDeck;
  const cards: UrlImportCard[] = [];

  // Commanders
  for (const entry of Object.values(data.commanders ?? {})) {
    cards.push({
      name: entry.card.name,
      quantity: entry.quantity,
      isCommander: true,
      isPartner: false,
    });
  }

  // Mainboard
  for (const entry of Object.values(data.mainboard ?? {})) {
    cards.push({
      name: entry.card.name,
      quantity: entry.quantity,
      isCommander: false,
      isPartner: false,
    });
  }

  return { name: data.name, source: "moxfield", cards, ignored: [] };
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
}

async function fetchArchidekt(id: string): Promise<UrlImportResult> {
  const res = await fetch(`https://archidekt.com/api/decks/${id}/`, {
    headers: {
      "User-Agent": "MagicAIBuilder/1.0 (deck import)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) throw new Error("Deck not found or is private.");
  if (!res.ok) throw new Error(`Archidekt returned HTTP ${res.status}.`);

  const data = (await res.json()) as ArchidektDeck;
  const cards: UrlImportCard[] = [];

  for (const entry of data.cards ?? []) {
    const isCommander = entry.categories.some(
      (c) => c.toLowerCase() === "commander"
    );
    cards.push({
      name: entry.card.oracleCard.name,
      quantity: entry.quantity,
      isCommander,
      isPartner: false,
    });
  }

  return { name: data.name, source: "archidekt", cards, ignored: [] };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function importFromUrl(url: string): Promise<UrlImportResult> {
  const detected = detectSource(url.trim());
  if (!detected) {
    throw new Error(
      "URL not recognised. Supported: moxfield.com/decks/… or archidekt.com/decks/…"
    );
  }

  if (detected.source === "moxfield") return fetchMoxfield(detected.id);
  return fetchArchidekt(detected.id);
}
