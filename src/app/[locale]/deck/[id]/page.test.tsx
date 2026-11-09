import { afterEach, expect, it, vi } from "vitest";
import type { PublicCard, PublicDeck } from "@/lib/deck/public-deck";

const fetchPublicDeck = vi.hoisted(() => vi.fn());
vi.mock("@/lib/deck/public-deck", () => ({ fetchPublicDeck }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/profile/PublicDeckView", () => ({ PublicDeckView: () => null }));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const catalogs = {
    en: (await import("@/messages/en/deck.json")).default,
    fr: (await import("@/messages/fr/deck.json")).default,
  };
  return {
    getTranslations: async ({
      locale,
      namespace,
    }: {
      locale: "en" | "fr";
      namespace: "deck.socialImage";
    }) =>
      createTranslator({
        locale,
        messages: { deck: catalogs[locale] },
        namespace,
      }),
  };
});

import PublicDeckPage, { generateMetadata } from "./page";

const ATRAXA: PublicCard = {
  id: "card-1",
  scryfallId: "scryfall-atraxa",
  name: "Atraxa, Praetors' Voice",
  cmc: 4,
  colorIdentity: ["W", "U", "B", "G"],
  price: null,
  imageUri: "https://cards.example/atraxa.jpg",
  artCropUri: "https://cards.example/atraxa-art.jpg",
  category: "Commander",
  quantity: 1,
  isCommander: true,
  isPartner: false,
  isGameChanger: false,
};

const PUBLIC_DECK: PublicDeck = {
  id: "deck-1",
  name: "Superfriends",
  description: null,
  format: "commander",
  targetBracket: 3,
  isAIGenerated: false,
  isOwner: false,
  cards: [ATRAXA],
  seekingFeedback: false,
  feedbackQuestion: null,
  forkedFromDeckId: null,
  forkedFromDeckName: null,
  forkedFromUserName: null,
  user: { id: "user-1", name: null, username: "kael", image: null },
};

/** Every routed locale plus x-default, the same set on every locale's page. */
const DECK_LANGUAGES = {
  en: "/deck/deck-1",
  fr: "/fr/deck/deck-1",
  "x-default": "/deck/deck-1",
};

afterEach(() => fetchPublicDeck.mockReset());

it("does not label an unavailable public deck as missing in metadata", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Deck unavailable — MagicAIBuilder");
});

it("describes a public deck in English, canonical at its unprefixed URL", async () => {
  fetchPublicDeck.mockResolvedValue(PUBLIC_DECK);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Superfriends by kael — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commander: Atraxa, Praetors' Voice · Bracket 3 · commander"
  );
  expect(metadata.openGraph).toMatchObject({
    title: "Superfriends by kael",
    description: "Commander: Atraxa, Praetors' Voice · Bracket 3",
  });
  expect(metadata.alternates).toEqual({
    canonical: "/deck/deck-1",
    languages: DECK_LANGUAGES,
  });
});

it("describes a public deck in French under /fr, canonical at its own French URL", async () => {
  fetchPublicDeck.mockResolvedValue(PUBLIC_DECK);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Superfriends par kael — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commandant : Atraxa, Praetors' Voice · Bracket 3 · commander"
  );
  expect(metadata.openGraph).toMatchObject({
    title: "Superfriends par kael",
    description: "Commandant : Atraxa, Praetors' Voice · Bracket 3",
  });
  expect(metadata.alternates).toEqual({
    canonical: "/fr/deck/deck-1",
    languages: DECK_LANGUAGES,
  });
});

it("names a missing author and commander in the page's language", async () => {
  fetchPublicDeck.mockResolvedValue({ ...PUBLIC_DECK, cards: [], user: null });

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Superfriends par Inconnu — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commandant : Inconnu · Bracket 3 · commander"
  );
});

it("titles a missing or unavailable deck in French under /fr", async () => {
  fetchPublicDeck.mockResolvedValueOnce(null);
  const missing = await generateMetadata({
    params: Promise.resolve({ locale: "fr", id: "missing" }),
  });

  fetchPublicDeck.mockRejectedValueOnce(new Error("PUBLIC_DECK_UNAVAILABLE"));
  const unavailable = await generateMetadata({
    params: Promise.resolve({ locale: "fr", id: "deck-1" }),
  });

  expect(missing.title).toBe("Deck introuvable — MagicAIBuilder");
  expect(unavailable.title).toBe("Deck indisponible — MagicAIBuilder");
});

it("passes a temporary deck failure to the retryable route error boundary", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "deck-1" }) })
  ).rejects.toThrow("PUBLIC_DECK_UNAVAILABLE");
});

it("keeps a missing deck as not found", async () => {
  fetchPublicDeck.mockResolvedValue(null);

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "missing" }) })
  ).rejects.toThrow("NOT_FOUND");
});

const PUBLIC_DECK = {
  id: "deck-1",
  name: "Atraxa Superfriends",
  description: null,
  format: "commander",
  targetBracket: 3,
  isAIGenerated: false,
  isOwner: false,
  cards: [
    {
      id: "c1",
      name: "Atraxa, Praetors' Voice",
      manaCost: "{G}{W}{U}{B}",
      cmc: 4,
      typeLine: "Legendary Creature",
      imageUri: "https://cards.scryfall.io/normal/atraxa.jpg",
      artCropUri: "https://cards.scryfall.io/art_crop/atraxa.jpg",
      category: "commander",
      quantity: 1,
      isCommander: true,
      isPartner: false,
      isGameChanger: false,
    },
  ],
  user: { id: "u1", name: "Kael", username: "kael", image: null },
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-09T10:00:00.000Z",
};

/** The image URL carries `updatedAt` so a chat app re-fetches it after an edit. */
const DECK_IMAGE_URL = `/og/deck/deck-1?v=${Date.parse("2026-11-09T10:00:00.000Z")}`;

it("points Open Graph and Twitter at the deck image built from stored data", async () => {
  fetchPublicDeck.mockResolvedValue(PUBLIC_DECK);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  // Not the commander's art crop: Scryfall's art crop cuts the artist credit,
  // and a crop alone says nothing about the deck.
  const image = {
    url: DECK_IMAGE_URL,
    width: 1200,
    height: 630,
    alt: "Preview of the deck Atraxa Superfriends by Kael",
  };
  expect(metadata.openGraph?.images).toEqual([image]);
  expect(metadata.twitter).toEqual({
    card: "summary_large_image",
    title: "Atraxa Superfriends by Kael",
    description: "Commander: Atraxa, Praetors' Voice · Bracket 3",
    images: [image],
  });
});

it("describes the deck image in the page's language", async () => {
  fetchPublicDeck.mockResolvedValue(PUBLIC_DECK);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", id: "deck-1" }),
  });

  expect(metadata.openGraph?.images).toEqual([
    expect.objectContaining({
      alt: "Aperçu du deck Atraxa Superfriends par Kael",
    }),
  ]);
});

it("sets no deck image for a deck the viewer cannot see", async () => {
  fetchPublicDeck.mockResolvedValue(null);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "private-deck" }),
  });

  expect(metadata.openGraph).toBeUndefined();
  expect(metadata.twitter).toBeUndefined();
});
