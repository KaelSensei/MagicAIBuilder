/**
 * The public profile page (`/u/[username]`) reads the profile in-process. No
 * HTTP server answers in this file: `fetch` refuses every connection and
 * `NEXT_PUBLIC_APP_URL` is unset, so a page that called its own API would see
 * every profile as unavailable.
 */
import type { unstable_cache } from "next/cache";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

const {
  mockUserFindFirst,
  mockFollowCount,
  mockFollowFindUnique,
  mockRatingFindMany,
  mockUnstableCache,
  mockAuth,
} = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockFollowCount: vi.fn(),
  mockFollowFindUnique: vi.fn(),
  mockRatingFindMany: vi.fn(),
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
    user: { findFirst: mockUserFindFirst },
    userFollow: { count: mockFollowCount, findUnique: mockFollowFindUnique },
    deckRating: { findMany: mockRatingFindMany },
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
// The view's own rendering is pinned by its component tests; here it echoes
// the viewer-relative values the page hands it.
vi.mock(import("@/components/profile/PublicProfileView"), () => ({
  PublicProfileView: ({ profile, canFollow }) => (
    <p
      data-testid="profile"
      data-is-following={String(profile.isFollowing)}
      data-can-follow={String(canFollow)}
    >
      {profile.username}
    </p>
  ),
}));

import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import { logger } from "@/lib/logger";
import UserProfilePage, { generateMetadata } from "./page";

/** Kael's account as Prisma returns it under the public profile allowlist. */
const KAEL_RECORD = {
  id: "user-1",
  name: "Kael Sensei",
  username: "kael",
  image: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  decks: [
    {
      id: "deck-1",
      name: "Atraxa Superfriends",
      description: null,
      format: "commander",
      targetBracket: 3,
      commanderId: null,
      isAIGenerated: false,
      createdAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-01-03T00:00:00Z"),
      cards: [],
    },
  ],
};

/** Every routed locale plus x-default, the same set on every locale's page. */
const PROFILE_LANGUAGES = {
  en: "/u/kael",
  fr: "/fr/u/kael",
  "x-default": "/u/kael",
};

function pageParams(username: string, locale = "en") {
  return { params: Promise.resolve({ locale, username }) };
}

/** Renders the page and returns the echo of what it handed the view. */
async function renderProfile(username: string): Promise<HTMLElement> {
  renderWithIntl(await UserProfilePage(pageParams(username)));
  return screen.getByTestId("profile");
}

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
  mockFollowCount.mockResolvedValue(0);
  mockFollowFindUnique.mockResolvedValue(null);
  mockRatingFindMany.mockResolvedValue([]);
});

afterEach(() => {
  for (const mock of [
    mockUserFindFirst,
    mockFollowCount,
    mockFollowFindUnique,
    mockRatingFindMany,
    mockUnstableCache,
    mockAuth,
  ]) {
    mock.mockReset();
  }
  vi.restoreAllMocks();
});

// ─── The page reads the database in-process ───────────────────────────────────

it("renders the profile with no HTTP server and no NEXT_PUBLIC_APP_URL", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const profile = await renderProfile("kael");

  expect(profile).toHaveTextContent("kael");
});

it("tells a signed-out visitor nothing about following, and does not offer to follow", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const profile = await renderProfile("kael");

  expect(profile).toHaveAttribute("data-is-following", "false");
  expect(profile).toHaveAttribute("data-can-follow", "false");
  expect(mockFollowFindUnique).not.toHaveBeenCalled();
});

it("tells a signed-in viewer that they follow the profile, and lets them follow", async () => {
  mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);
  mockFollowFindUnique.mockResolvedValue({ id: "follow-1" });

  const profile = await renderProfile("kael");

  expect(profile).toHaveAttribute("data-is-following", "true");
  expect(profile).toHaveAttribute("data-can-follow", "true");
  expect(mockFollowFindUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        followerId_followingId: {
          followerId: "viewer-1",
          followingId: "user-1",
        },
      },
    })
  );
});

it("never offers the owner to follow themselves", async () => {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const profile = await renderProfile("kael");

  expect(profile).toHaveAttribute("data-is-following", "false");
  expect(profile).toHaveAttribute("data-can-follow", "false");
  expect(mockFollowFindUnique).not.toHaveBeenCalled();
});

// ─── Caching ──────────────────────────────────────────────────────────────────

it("serves a signed-out visitor from the data cache for a minute", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  await renderProfile("kael");

  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    ["public-profile"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  );
});

it("never serves a signed-in viewer from the data cache, so follow state stays theirs", async () => {
  mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  await renderProfile("kael");

  expect(mockUnstableCache).not.toHaveBeenCalled();
});

// ─── Missing and failing profiles ─────────────────────────────────────────────

it("shows an unknown username as not found", async () => {
  mockUserFindFirst.mockResolvedValue(null);

  await expect(UserProfilePage(pageParams("nobody"))).rejects.toThrow(
    "NOT_FOUND"
  );
});

it("shows a username no account can carry as not found without asking the database", async () => {
  // Reserved characters, a space, and one character over the sign-up limit.
  for (const username of ["a#b", "bad name!", "x".repeat(51)]) {
    await expect(UserProfilePage(pageParams(username))).rejects.toThrow(
      "NOT_FOUND"
    );
  }
  expect(mockUserFindFirst).not.toHaveBeenCalled();
});

it("logs a database failure and shows a retryable error instead of a 404", async () => {
  const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockUserFindFirst.mockRejectedValue(new Error("DB connection lost"));

  await expect(UserProfilePage(pageParams("kael"))).rejects.toThrow(
    "PROFILE_UNAVAILABLE"
  );
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DB connection lost" }),
    "/u/[username]",
    { username: "kael" }
  );
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

it("keeps a profile with no public deck out of search results", async () => {
  // The page still renders for visitors; only crawlers are told not to index
  // an empty profile (I-34 spec §4.5). The sitemap leaves it out too.
  mockUserFindFirst.mockResolvedValue({ ...KAEL_RECORD, decks: [] });

  const metadata = await generateMetadata(pageParams("kael"));

  expect(metadata.robots).toEqual({ index: false });
});

it("leaves a profile with a public deck open to search engines", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const metadata = await generateMetadata(pageParams("kael"));

  expect(metadata.robots).toBeUndefined();
});

it("keeps an unavailable profile from producing a not-found metadata title", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockUserFindFirst.mockRejectedValue(new Error("DB connection lost"));

  const metadata = await generateMetadata(pageParams("kael"));

  expect(metadata.title).toBe("Profile unavailable — MagicAIBuilder");
});

it("describes a profile in English, canonical at its unprefixed URL", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const metadata = await generateMetadata(pageParams("kael"));

  expect(metadata).toEqual({
    title: "Kael Sensei — MagicAIBuilder",
    description: "Kael Sensei's public Commander decks on MagicAIBuilder.",
    alternates: { canonical: "/u/kael", languages: PROFILE_LANGUAGES },
  });
});

it("describes a profile in French under /fr, canonical at its own French URL", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const metadata = await generateMetadata(pageParams("kael", "fr"));

  expect(metadata).toEqual({
    title: "Kael Sensei — MagicAIBuilder",
    description:
      "Les decks Commander publics de Kael Sensei sur MagicAIBuilder.",
    alternates: { canonical: "/fr/u/kael", languages: PROFILE_LANGUAGES },
  });
});

it("titles a missing or unavailable profile in French under /fr", async () => {
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  mockUserFindFirst.mockResolvedValueOnce(null);
  const missing = await generateMetadata(pageParams("nobody", "fr"));

  mockUserFindFirst.mockRejectedValueOnce(new Error("DB connection lost"));
  const unavailable = await generateMetadata(pageParams("kael", "fr"));

  expect(missing.title).toBe("Profil introuvable — MagicAIBuilder");
  expect(unavailable.title).toBe("Profil indisponible — MagicAIBuilder");
});
