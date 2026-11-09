import { afterEach, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/profile/PublicProfileView", () => ({ PublicProfileView: () => null }));

import UserProfilePage, { generateMetadata } from "./page";

/** The profile fields metadata reads. */
const PROFILE = { id: "user-1", name: "Kael Sensei", username: "kael" };

/** Every routed locale plus x-default, the same set on every locale's page. */
const PROFILE_LANGUAGES = {
  en: "/u/kael",
  fr: "/fr/u/kael",
  "x-default": "/u/kael",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("shows a retryable error instead of a 404 when the profile service fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "player" }) })
  ).rejects.toThrow("PROFILE_UNAVAILABLE");
});

it("bounds the profile request to 15 seconds", async () => {
  const signal = new AbortController().signal;
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "player" }) })
  ).rejects.toThrow("NOT_FOUND");
  expect(timeout).toHaveBeenCalledWith(15_000);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ signal })
  );
});

it("encodes reserved characters in the username before requesting the profile", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "a#b" }) })
  ).rejects.toThrow("NOT_FOUND");
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/users/a%23b"),
    expect.any(Object)
  );
});

it("keeps a profile with no public deck out of search results", async () => {
  // The page still renders for visitors; only crawlers are told not to index
  // an empty profile (I-34 spec §4.5). The sitemap leaves it out too.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({ id: "user-1", name: "Lurker", username: "lurker", decks: [] })
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "lurker" }),
  });

  expect(metadata.robots).toEqual({ index: false });
});

it("leaves a profile with a public deck open to search engines", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        id: "user-1",
        name: "Kael",
        username: "kael",
        decks: [{ id: "deck-1", name: "Atraxa Superfriends" }],
      })
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "kael" }),
  });

  expect(metadata.robots).toBeUndefined();
});

it("does not hide a profile when the response carries no deck list", async () => {
  // Only a deck list proves the profile is empty; without one, the default
  // stands rather than hiding a profile that may have public decks.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({ id: "user-1", name: "Kael", username: "kael" })
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "kael" }),
  });

  expect(metadata.robots).toBeUndefined();
});

it("keeps an unavailable profile from producing a not-found metadata title", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "player" }),
  });

  expect(metadata.title).toBe("Profile unavailable — MagicAIBuilder");
});

it("describes a profile in English, canonical at its unprefixed URL", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(PROFILE)));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "kael" }),
  });

  expect(metadata).toEqual({
    title: "Kael Sensei — MagicAIBuilder",
    description: "Kael Sensei's public Commander decks on MagicAIBuilder.",
    alternates: { canonical: "/u/kael", languages: PROFILE_LANGUAGES },
  });
});

it("describes a profile in French under /fr, canonical at its own French URL", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(PROFILE)));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", username: "kael" }),
  });

  expect(metadata).toEqual({
    title: "Kael Sensei — MagicAIBuilder",
    description:
      "Les decks Commander publics de Kael Sensei sur MagicAIBuilder.",
    alternates: { canonical: "/fr/u/kael", languages: PROFILE_LANGUAGES },
  });
});

it("titles a missing or unavailable profile in French under /fr", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
  );
  const missing = await generateMetadata({
    params: Promise.resolve({ locale: "fr", username: "nobody" }),
  });

  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
  const unavailable = await generateMetadata({
    params: Promise.resolve({ locale: "fr", username: "kael" }),
  });

  expect(missing.title).toBe("Profil introuvable — MagicAIBuilder");
  expect(unavailable.title).toBe("Profil indisponible — MagicAIBuilder");
});
