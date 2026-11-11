import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock(import("next/headers"), () => ({ headers: async () => new Headers() }));
vi.mock(import("next/navigation"), () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock(import("@/components/layout/Header"), () => ({ Header: () => <></> }));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

import CommanderDecksPage, { generateMetadata } from "./page";

/**
 * What the discovery API answers for a commander nobody has published a deck
 * for yet — the builder's "Community decks" link reaches this for any
 * commander being built.
 */
const NO_PUBLIC_DECK = {
  slug: "nobody-has-this-commander",
  commanderName: null,
  total: 0,
  decks: [],
};

/**
 * A commander with a public deck. Metadata reads only the name and whether
 * the listing is empty, so the deck itself is reduced to its id.
 */
const ATRAXA_DECKS = {
  slug: "atraxa-praetors-voice",
  commanderName: "Atraxa, Praetors' Voice",
  total: 1,
  decks: [{ id: "deck-1" }],
};

/** Every routed locale plus x-default, the same set on every locale's page. */
const ATRAXA_LANGUAGES = {
  en: "/commanders/atraxa-praetors-voice/decks",
  fr: "/fr/commanders/atraxa-praetors-voice/decks",
  "x-default": "/commanders/atraxa-praetors-voice/decks",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders the empty state for a commander nobody has published a deck for", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(NO_PUBLIC_DECK))
  );

  renderWithIntl(
    await CommanderDecksPage({
      params: Promise.resolve({
        locale: "en",
        slug: "nobody-has-this-commander",
      }),
    })
  );

  expect(
    screen.getByRole("heading", { name: "nobody has this commander decks" })
  ).toBeInTheDocument();
  expect(
    screen.getByText("No public decks for this commander yet.")
  ).toBeInTheDocument();
});

it("serves a 404, without asking the API, for a slug no commander name can produce", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(NO_PUBLIC_DECK));
  vi.stubGlobal("fetch", fetchMock);

  // Uppercase and underscores, URL-reserved characters, and hyphens with no
  // name between them: commanderToSlug never yields any of these.
  for (const slug of ["Not_A_Slug", "a?b#c/d", "---"]) {
    await expect(
      CommanderDecksPage({ params: Promise.resolve({ locale: "en", slug }) })
    ).rejects.toThrow("NOT_FOUND");
  }
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows a retryable error instead of a 404 when the discovery API fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
  );

  await expect(
    CommanderDecksPage({
      params: Promise.resolve({ locale: "en", slug: "atraxa-praetors-voice" }),
    })
  ).rejects.toThrow("COMMANDER_DECKS_UNAVAILABLE");
});

it("keeps an empty listing out of the index, with no canonical URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(NO_PUBLIC_DECK))
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({
      locale: "fr",
      slug: "nobody-has-this-commander",
    }),
  });

  expect(metadata.robots).toEqual({ index: false });
  expect(metadata.alternates).toBeUndefined();
  expect(metadata.title).toBe(
    "Decks nobody has this commander — MagicAIBuilder"
  );
});

it("describes a commander's listing in English, canonical at its unprefixed URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(ATRAXA_DECKS))
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", slug: "atraxa-praetors-voice" }),
  });

  expect(metadata).toEqual({
    title: "Atraxa, Praetors' Voice decks — MagicAIBuilder",
    description:
      "Public Commander decks led by Atraxa, Praetors' Voice, ranked by community votes.",
    alternates: {
      canonical: "/commanders/atraxa-praetors-voice/decks",
      languages: ATRAXA_LANGUAGES,
    },
  });
});

it("describes a commander's listing in French under /fr, canonical at its own French URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(ATRAXA_DECKS))
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", slug: "atraxa-praetors-voice" }),
  });

  expect(metadata).toEqual({
    title: "Decks Atraxa, Praetors' Voice — MagicAIBuilder",
    description:
      "Decks Commander publics menés par Atraxa, Praetors' Voice, classés par votes de la communauté.",
    alternates: {
      canonical: "/fr/commanders/atraxa-praetors-voice/decks",
      languages: ATRAXA_LANGUAGES,
    },
  });
});

it("titles an unknown or unavailable commander in French under /fr", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const notFound = await generateMetadata({
    params: Promise.resolve({ locale: "fr", slug: "Not_A_Slug" }),
  });
  const unavailable = await generateMetadata({
    params: Promise.resolve({ locale: "fr", slug: "atraxa-praetors-voice" }),
  });

  expect(notFound.title).toBe("Commandant introuvable — MagicAIBuilder");
  expect(unavailable.title).toBe(
    "Decks du commandant indisponibles — MagicAIBuilder"
  );
});

it("titles a slug no commander name can produce as not found, without asking the API", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(NO_PUBLIC_DECK));
  vi.stubGlobal("fetch", fetchMock);

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", slug: "Not_A_Slug" }),
  });

  expect(metadata).toEqual({ title: "Commander not found — MagicAIBuilder" });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("keeps an unavailable discovery API from producing a not-found title", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", slug: "atraxa-praetors-voice" }),
  });

  expect(metadata.title).toBe("Commander decks unavailable — MagicAIBuilder");
});
