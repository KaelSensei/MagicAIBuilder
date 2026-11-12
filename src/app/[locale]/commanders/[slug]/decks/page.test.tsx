/**
 * The commander decks page (`/commanders/[slug]/decks`) reads the listing
 * in-process. No HTTP server answers in this file: `fetch` refuses every
 * connection and `NEXT_PUBLIC_APP_URL` is unset, so a page that called its
 * own API would see every listing as unavailable.
 */
import type { unstable_cache } from "next/cache";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

const { mockDeckFindMany, mockQueryRaw, mockUnstableCache, mockAuth } =
  vi.hoisted(() => ({
    mockDeckFindMany: vi.fn(),
    mockQueryRaw: vi.fn(),
    mockUnstableCache: vi.fn(),
    mockAuth: vi.fn(),
  }));

type UnstableCache = typeof unstable_cache;

vi.stubGlobal("fetch", () =>
  Promise.reject(new TypeError("fetch failed: ECONNREFUSED"))
);
vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: mockDeckFindMany },
    $queryRaw: mockQueryRaw,
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
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));
vi.mock(import("@/components/layout/Header"), () => ({ Header: () => <></> }));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import { logger } from "@/lib/logger";
import CommanderDecksPage, { generateMetadata } from "./page";

const ATRAXA = "Atraxa, Praetors' Voice";
const ATRAXA_SLUG = "atraxa-praetors-voice";

/** A public Atraxa deck as Prisma returns it to the discovery read. */
function atraxaDeck(votes: readonly { userId: string; value: number }[] = []) {
  return {
    id: "deck-1",
    name: "Atraxa Superfriends",
    format: "commander",
    commanderName: ATRAXA,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    user: { name: "Builder", username: "builder", image: null },
    cards: [{ name: ATRAXA, imageUri: "", artCropUri: "" }],
    votes: votes.map((vote) => ({ ...vote, deckId: "deck-1" })),
    ratings: [],
    _count: { cards: 100 },
  };
}

/** Every routed locale plus x-default, the same set on every locale's page. */
const ATRAXA_LANGUAGES = {
  en: `/commanders/${ATRAXA_SLUG}/decks`,
  fr: `/fr/commanders/${ATRAXA_SLUG}/decks`,
  "x-default": `/commanders/${ATRAXA_SLUG}/decks`,
};

/** Wires both reads: the id query finds these rows, the hydration returns them. */
function stubMatch(rows: readonly ReturnType<typeof atraxaDeck>[]) {
  mockQueryRaw.mockResolvedValue(rows.map((row) => ({ id: row.id })));
  mockDeckFindMany.mockResolvedValue(rows);
}

function pageParams(slug: string, locale = "en") {
  return { params: Promise.resolve({ locale, slug }) };
}

async function renderListing(slug: string): Promise<void> {
  renderWithIntl(await CommanderDecksPage(pageParams(slug)));
}

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
});

afterEach(() => {
  for (const mock of [
    mockDeckFindMany,
    mockQueryRaw,
    mockUnstableCache,
    mockAuth,
  ]) {
    mock.mockReset();
  }
  vi.restoreAllMocks();
});

// ─── The page reads the database in-process ───────────────────────────────────

it("renders the listing with no HTTP server and no NEXT_PUBLIC_APP_URL", async () => {
  stubMatch([atraxaDeck()]);

  await renderListing(ATRAXA_SLUG);

  expect(
    screen.getByRole("heading", { name: `${ATRAXA} decks` })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Atraxa Superfriends" })
  ).toBeInTheDocument();
});

it("renders the empty state for a commander nobody has published a deck for", async () => {
  stubMatch([]);

  await renderListing("nobody-has-this-commander");

  expect(
    screen.getByRole("heading", { name: "nobody has this commander decks" })
  ).toBeInTheDocument();
  expect(
    screen.getByText("No public decks for this commander yet.")
  ).toBeInTheDocument();
});

it("shows a signed-out visitor no vote of their own and no way to vote", async () => {
  stubMatch([atraxaDeck([{ userId: "someone", value: 1 }])]);

  await renderListing(ATRAXA_SLUG);

  const upvote = screen.getByRole("button", { name: "Upvote" });
  expect(upvote).toBeDisabled();
  expect(upvote).toHaveAttribute("aria-pressed", "false");
});

it("shows a signed-in viewer their own vote and lets them vote", async () => {
  mockAuth.mockResolvedValue({ user: { id: "me" } });
  stubMatch([atraxaDeck([{ userId: "me", value: 1 }])]);

  await renderListing(ATRAXA_SLUG);

  const upvote = screen.getByRole("button", { name: "Upvote" });
  expect(upvote).toBeEnabled();
  expect(upvote).toHaveAttribute("aria-pressed", "true");
});

// ─── Caching ──────────────────────────────────────────────────────────────────

it("serves a signed-out visitor from the data cache for a minute", async () => {
  stubMatch([atraxaDeck()]);

  await renderListing(ATRAXA_SLUG);

  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    ["commander-decks"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  );
});

it("never serves a signed-in viewer from the data cache, so their votes stay theirs", async () => {
  mockAuth.mockResolvedValue({ user: { id: "me" } });
  stubMatch([atraxaDeck()]);

  await renderListing(ATRAXA_SLUG);

  expect(mockUnstableCache).not.toHaveBeenCalled();
});

// ─── Missing and failing listings ─────────────────────────────────────────────

it("serves a 404, without asking the database, for a slug no commander name can produce", async () => {
  stubMatch([]);

  // Uppercase and underscores, URL-reserved characters, and hyphens with no
  // name between them: commanderToSlug never yields any of these.
  for (const slug of ["Not_A_Slug", "a?b#c/d", "---"]) {
    await expect(CommanderDecksPage(pageParams(slug))).rejects.toThrow(
      "NOT_FOUND"
    );
  }
  expect(mockQueryRaw).not.toHaveBeenCalled();
});

it("logs a database failure and shows a retryable error instead of a 404", async () => {
  const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockQueryRaw.mockRejectedValue(new Error("DB connection lost"));

  await expect(CommanderDecksPage(pageParams(ATRAXA_SLUG))).rejects.toThrow(
    "COMMANDER_DECKS_UNAVAILABLE"
  );
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DB connection lost" }),
    "/commanders/[slug]/decks",
    { slug: ATRAXA_SLUG }
  );
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

it("keeps an empty listing out of the index, with no canonical URL", async () => {
  stubMatch([]);

  const metadata = await generateMetadata(
    pageParams("nobody-has-this-commander", "fr")
  );

  expect(metadata.robots).toEqual({ index: false });
  expect(metadata.alternates).toBeUndefined();
  expect(metadata.title).toBe(
    "Decks nobody has this commander — MagicAIBuilder"
  );
});

it("describes a commander's listing in English, canonical at its unprefixed URL", async () => {
  stubMatch([atraxaDeck()]);

  const metadata = await generateMetadata(pageParams(ATRAXA_SLUG));

  expect(metadata).toEqual({
    title: "Atraxa, Praetors' Voice decks — MagicAIBuilder",
    description:
      "Public Commander decks led by Atraxa, Praetors' Voice, ranked by community votes.",
    alternates: {
      canonical: `/commanders/${ATRAXA_SLUG}/decks`,
      languages: ATRAXA_LANGUAGES,
    },
  });
});

it("describes a commander's listing in French under /fr, canonical at its own French URL", async () => {
  stubMatch([atraxaDeck()]);

  const metadata = await generateMetadata(pageParams(ATRAXA_SLUG, "fr"));

  expect(metadata).toEqual({
    title: "Decks Atraxa, Praetors' Voice — MagicAIBuilder",
    description:
      "Decks Commander publics menés par Atraxa, Praetors' Voice, classés par votes de la communauté.",
    alternates: {
      canonical: `/fr/commanders/${ATRAXA_SLUG}/decks`,
      languages: ATRAXA_LANGUAGES,
    },
  });
});

it("titles an unknown or unavailable commander in French under /fr", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockQueryRaw.mockRejectedValue(new Error("DB connection lost"));

  const notFound = await generateMetadata(pageParams("Not_A_Slug", "fr"));
  const unavailable = await generateMetadata(pageParams(ATRAXA_SLUG, "fr"));

  expect(notFound.title).toBe("Commandant introuvable — MagicAIBuilder");
  expect(unavailable.title).toBe(
    "Decks du commandant indisponibles — MagicAIBuilder"
  );
});

it("titles a slug no commander name can produce as not found, without asking the database", async () => {
  stubMatch([]);

  const metadata = await generateMetadata(pageParams("Not_A_Slug"));

  expect(metadata).toEqual({ title: "Commander not found — MagicAIBuilder" });
  expect(mockQueryRaw).not.toHaveBeenCalled();
});

it("keeps an unavailable listing from producing a not-found title", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockQueryRaw.mockRejectedValue(new Error("DB connection lost"));

  const metadata = await generateMetadata(pageParams(ATRAXA_SLUG));

  expect(metadata.title).toBe("Commander decks unavailable — MagicAIBuilder");
});
