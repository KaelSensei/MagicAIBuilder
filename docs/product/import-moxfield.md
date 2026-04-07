# Moxfield Import by URL (Reusable Guide)

This document summarizes how **MagicTheOfflining** imports a deck from **Moxfield** using a **deck URL** (or a deck ID). It’s written to be copied into another project.

> Note: Moxfield does not provide a stable official public API for all use-cases. These endpoints and anti-bot requirements can change over time.

---

## Goal

Given a Moxfield deck URL like:

- `https://www.moxfield.com/decks/<PUBLIC_ID>`

or just `<PUBLIC_ID>`, we want to:

- Extract the deck ID
- Fetch the deck JSON
- Normalize it into a simple internal model
- Store it (DB/file/memory)

---

## Internal data model (recommended)

Keep a small “contract” that your app imports into, independent of Moxfield’s schema:

```ts
export type BoardType = "mainboard" | "sideboard" | "maybeboard"; // maybeboard = considering

export type ScrapedCard = {
  name: string;
  quantity: number;
  imageUrl?: string | null;
  isCommander?: boolean;
  board?: BoardType;

  // optional enrichment
  cmc?: number | null;
  typeLine?: string | null;
  rarity?: string | null;
  colors?: string[] | null;
  colorIdentity?: string[] | null;
  typeCode?: number | null;
};

export type ScrapedDeck = {
  id: string; // Moxfield publicId
  name: string;
  author?: string | null;
  commander?: string | null;

  // optional enrichment
  bracket?: number | null;
  colorIdentity?: string[] | null;
  lastUpdatedAtUtc?: string | null;

  cards: ScrapedCard[];
};
```

---

## Step 1 — Extract the deck ID from URL (or accept raw ID)

In MagicTheOfflining, this is implemented as a tolerant parser:

- If it contains `moxfield.com/decks/<ID>` → use `<ID>`
- Else, if the input is already an ID-like string (`a-zA-Z0-9_-`) → use it

```ts
export function extractDeckIdFromUrl(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // URL: https://moxfield.com/decks/ID or https://www.moxfield.com/decks/ID
  const urlMatch = trimmed.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];

  // Raw ID
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}
```

---

## Step 2 — Use the Moxfield deck detail endpoint

MagicTheOfflining uses:

- `GET https://api2.moxfield.com/v3/decks/all/{publicId}`

This returns a JSON payload containing the deck and its boards:

- `boards.commanders.cards`
- `boards.mainboard.cards`
- `boards.sideboard.cards`
- `boards.maybeboard.cards` (the app uses this as “Considering”)

---

## Step 3 — Make requests “browser-like” (avoid 403 blocking)

Moxfield sometimes blocks automated traffic (403). The repo uses a `fetchApi()` helper with headers that resemble a browser request.

**Practical minimum:**

- `Accept`
- `User-Agent`
- `Origin: https://moxfield.com`
- `Referer: https://moxfield.com/`

Example helper:

```ts
async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      origin: "https://moxfield.com",
      pragma: "no-cache",
      referer: "https://moxfield.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      // optional (may change over time)
      "x-moxfield-version": "2026.01.12.2",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // handle 403/404 separately if desired
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}
```

---

## Step 4 — Normalize the response into `ScrapedDeck`

### The core algorithm

1. Build a `Map` keyed by card name (optionally with board suffix to avoid collisions).
2. Iterate board objects and add cards with:
   - `name`
   - `quantity`
   - `board` (mainboard/sideboard/maybeboard)
   - optional fields (cmc/typeLine/rarity/colors/colorIdentity/typeCode)
3. Identify commanders:
   - Treat `boards.commanders.cards` as commander candidates
   - Avoid marking `deckDetail.main` as commander blindly (it can be a “featured” card). If you do use it, validate it first.
4. Create `ScrapedDeck` with deck-level metadata.

### Minimal “import deck by URL/ID” function (skeleton)

```ts
export async function fetchDeckById(urlOrId: string): Promise<ScrapedDeck> {
  const id = extractDeckIdFromUrl(urlOrId);
  if (!id) throw new Error("Missing or invalid deck id/url.");

  const deckDetailUrl = `https://api2.moxfield.com/v3/decks/all/${encodeURIComponent(id)}`;
  const deckDetail = await fetchApi<any>(deckDetailUrl);

  // TODO: parse deckDetail.boards.*.cards into ScrapedCard[]
  // TODO: compute commander string if needed

  return {
    id,
    name: deckDetail?.name ?? "Unknown deck",
    author:
      deckDetail?.createdByUser?.userName ??
      deckDetail?.authors?.[0]?.userName ??
      null,
    commander: null, // fill if you extract commanders
    bracket: deckDetail?.userBracket ?? null,
    colorIdentity: deckDetail?.colorIdentity ?? deckDetail?.colors ?? null,
    lastUpdatedAtUtc: deckDetail?.lastUpdatedAtUtc ?? null,
    cards: [],
  };
}
```

---

## Optional — Import all decks from a user

MagicTheOfflining also supports “import by username” using a paginated search endpoint:

- `GET https://api2.moxfield.com/v2/decks/search-sfw?...&authorUserNames={username}&pageNumber=...&pageSize=...`

Then for each summary, it fetches deck details with:

- `GET https://api2.moxfield.com/v3/decks/all/{publicId}`

If you only need “import by URL”, you can ignore this.

---

## Reliability notes

- **403 Forbidden / bot protection**: can vary by IP, VPN, request burst, or changes on Moxfield.
- **Don’t over-retry**: treat repeated 403/429 as a hard failure and back off.
- **Boards**: decide how you want to map Moxfield boards to your app’s categories.
- **Commander detection**: Moxfield fields may not always match your expectations; validate commander rules if needed.
