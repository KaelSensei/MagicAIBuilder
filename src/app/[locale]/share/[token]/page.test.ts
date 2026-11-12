/**
 * The share page (`/share/[token]`) reads the deck behind a share link
 * in-process. No HTTP server answers in this file: `fetch` refuses every
 * connection and `NEXT_PUBLIC_APP_URL` is unset, so a page that called its own
 * API would see every link as missing.
 */
import type { unstable_cache } from "next/cache";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";

const { mockDeckFindUnique, mockUnstableCache } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockUnstableCache: vi.fn(),
}));

type UnstableCache = typeof unstable_cache;

vi.stubGlobal("fetch", () =>
  Promise.reject(new TypeError("fetch failed: ECONNREFUSED"))
);
vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findUnique: mockDeckFindUnique },
  });
});
// Outside a Next request there is no data cache, and `unstable_cache` would
// throw. The stand-in records the cache options and hands the read back as it
// is, so the test sees what the cache would have been asked to keep.
vi.mock(import("next/cache"), () => ({
  unstable_cache: <Read extends Parameters<UnstableCache>[0]>(
    read: Read,
    keyParts?: Parameters<UnstableCache>[1],
    options?: Parameters<UnstableCache>[2]
  ): Read => {
    mockUnstableCache(read, keyParts, options);
    return read;
  },
}));
vi.mock(import("next/navigation"), () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("@/components/deck/ShareDeckView", () => ({
  ShareDeckView: ({ deck }: { readonly deck: ApiSharedDeck }) =>
    createElement("h1", null, deck.name),
}));

import { logger } from "@/lib/logger";
import {
  SHARE_LINK_REVALIDATE_SECONDS,
  shareLinkCacheTag,
} from "@/lib/deck/share-link-cache";
import SharePage, { generateMetadata } from "./page";

/** A share token as `POST /api/decks/[id]/share` mints them: 12 base64url characters. */
const TOKEN = "abc123XYZ-_0";

/** A card row exactly as the share-link allowlist exposes it. */
function card(
  overrides: Partial<ApiCard> & Pick<ApiCard, "id" | "name">
): ApiCard {
  return {
    manaCost: "",
    cmc: 0,
    colorIdentity: [],
    imageUri: `https://cards.scryfall.io/normal/${overrides.id}.jpg`,
    artCropUri: "",
    category: "other",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    isGameChanger: false,
    ...overrides,
  };
}

/** A shared deck with partner commanders and one other card. */
const PARTNERS_DECK: ApiSharedDeck = {
  id: "deck-partners",
  name: "Partners in Crime",
  format: "commander",
  targetBracket: 2,
  budget: null,
  cards: [
    card({ id: "thrasios", name: "Thrasios, Triton Hero", isCommander: true }),
    card({
      id: "tymna",
      name: "Tymna the Weaver",
      isCommander: true,
      isPartner: true,
    }),
    card({ id: "sol-ring", name: "Sol Ring" }),
  ],
};

function pageParams(token: string, locale = "en") {
  return { params: Promise.resolve({ locale, token }) };
}

afterEach(() => {
  mockDeckFindUnique.mockReset();
  mockUnstableCache.mockReset();
  vi.restoreAllMocks();
});

// ─── The page reads the database in-process ───────────────────────────────────

it("renders the shared deck with no HTTP server and no NEXT_PUBLIC_APP_URL", async () => {
  mockDeckFindUnique.mockResolvedValue(PARTNERS_DECK);

  const page = await SharePage(pageParams(TOKEN));

  expect(renderToStaticMarkup(page)).toBe("<h1>Partners in Crime</h1>");
});

it("shows an unknown or revoked token as not found", async () => {
  mockDeckFindUnique.mockResolvedValue(null);

  await expect(SharePage(pageParams(TOKEN))).rejects.toThrow("NOT_FOUND");
});

it("shows a malformed token as not found without asking the database", async () => {
  await expect(SharePage(pageParams("not a token!"))).rejects.toThrow(
    "NOT_FOUND"
  );

  expect(mockDeckFindUnique).not.toHaveBeenCalled();
});

it("logs a database failure and shows the link as not found", async () => {
  const logged = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockDeckFindUnique.mockRejectedValue(new Error("DB connection lost"));

  const metadata = await generateMetadata(pageParams(TOKEN));
  await expect(SharePage(pageParams(TOKEN))).rejects.toThrow("NOT_FOUND");

  expect(metadata.title).toBe("Deck not found — MagicAIBuilder");
  expect(logged).toHaveBeenCalledWith("DB connection lost", "/share/[token]");
});

// The page caches the deck for a minute per token. `DELETE /api/decks/[id]/share`
// purges that token's tag, so the tag here and there must be the same one
// (OD-12: a revoked link stops working at once).
it("reads the deck under its token's cache tag, so revoking the link purges the page at once", async () => {
  mockDeckFindUnique.mockResolvedValue(PARTNERS_DECK);

  await generateMetadata(pageParams("tagged-token"));

  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    expect.any(Array),
    {
      revalidate: SHARE_LINK_REVALIDATE_SECONDS,
      tags: [shareLinkCacheTag("tagged-token")],
    }
  );
});

// ─── Metadata and OG tags ─────────────────────────────────────────────────────

it("tells crawlers not to retain or index a valid share link", async () => {
  mockDeckFindUnique.mockResolvedValue({ ...PARTNERS_DECK, cards: [] });

  const metadata = await generateMetadata(pageParams("private-token"));

  expect(metadata.robots).toEqual({
    index: false,
    follow: false,
    noarchive: true,
  });
});

// Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
// still store it, and a link preview must not point at a dead image.
it("previews the commander with Scryfall's WebP art", async () => {
  const art =
    "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796";
  mockDeckFindUnique.mockResolvedValue({
    ...PARTNERS_DECK,
    name: "Superfriends",
    targetBracket: 3,
    cards: [
      card({
        id: "atraxa",
        name: "Atraxa",
        isCommander: true,
        artCropUri:
          "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
      }),
    ],
  });

  const metadata = await generateMetadata(pageParams("share-token"));

  expect(metadata.openGraph?.images).toEqual([{ url: art, alt: "Atraxa" }]);
  expect(metadata.twitter?.images).toEqual([art]);
});

it("describes a shared deck in English", async () => {
  mockDeckFindUnique.mockResolvedValue(PARTNERS_DECK);

  const metadata = await generateMetadata(pageParams("private-token"));

  expect(metadata.title).toBe("Partners in Crime — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commander: Thrasios, Triton Hero + Tymna the Weaver · 3 cards · Bracket 2 · commander"
  );
  // A capability URL: no canonical, no hreflang.
  expect(metadata.alternates).toBeUndefined();
});

it("describes a shared deck in French under /fr", async () => {
  mockDeckFindUnique.mockResolvedValue(PARTNERS_DECK);

  const metadata = await generateMetadata(pageParams("private-token", "fr"));

  expect(metadata.title).toBe("Partners in Crime — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commandant : Thrasios, Triton Hero + Tymna the Weaver · 3 cartes · Bracket 2 · commander"
  );
  expect(metadata.openGraph).toMatchObject({
    description:
      "Commandant : Thrasios, Triton Hero + Tymna the Weaver · 3 cartes · Bracket 2 · commander",
  });
});

it("says in French when a shared deck has no commander or cannot be found", async () => {
  mockDeckFindUnique.mockResolvedValueOnce({ ...PARTNERS_DECK, cards: [] });
  const empty = await generateMetadata(pageParams("private-token", "fr"));

  mockDeckFindUnique.mockResolvedValueOnce(null);
  const missing = await generateMetadata(pageParams("revoked-token", "fr"));

  expect(empty.description).toBe(
    "Commandant : Aucun commandant · 0 carte · Bracket 2 · commander"
  );
  expect(missing.title).toBe("Deck introuvable — MagicAIBuilder");
});
