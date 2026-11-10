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

// Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
// still store it, and a link preview must not point at a dead image.
it("previews the commander with Scryfall's WebP art", async () => {
  fetchPublicDeck.mockResolvedValue({
    name: "Superfriends",
    targetBracket: 3,
    format: "commander",
    user: { name: "Totoro", username: "totoro" },
    cards: [
      {
        name: "Atraxa",
        isCommander: true,
        isPartner: false,
        artCropUri:
          "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
      },
    ],
  });

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.openGraph?.images).toEqual([
    {
      url: "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796",
    },
  ]);
});
