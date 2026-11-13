/**
 * Characterization of the moderation reports page (`/moderation/reports`).
 * The page is private: it answers 404, not 403, to anyone who is not a
 * moderator, so its existence is not disclosed. These tests pin that gate and
 * the moderator's happy path before the check moves into the shared
 * `isModerator` read (COM-17).
 *
 * Sociable: the page, the header and the report queue are the real ones;
 * Next's own `notFound` throws, so nothing in `next/navigation` is mocked.
 * `next-intl/server` is replaced because outside a request it has no locale
 * to infer and throws; the stand-in reads the English catalog.
 *
 * One seam is left, `@/i18n/navigation`, replaced by the shared typed stub.
 * next-intl's ESM build imports `next/navigation` without a file extension,
 * which Node's loader cannot resolve unless Vitest inlines next-intl;
 * `vitest.config.ts` inlines only next-auth. That config change removes the
 * seam, as the builder page test records.
 */
import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { getTranslations } from "@/test/server-intl";

const { mockAuth, mockGetTranslations, mockUserFindUnique } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockGetTranslations: vi.fn(),
    mockUserFindUnique: vi.fn(),
  })
);

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: mockUserFindUnique },
  });
});
vi.mock(import("next-intl/server"), () => ({
  getTranslations: mockGetTranslations,
}));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));
// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

import ModerationReportsPage from "./page";

/** The digest Next's `notFound()` throws with, which the app router turns into a 404. */
const NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

// The page calls the implicit-locale `getTranslations(namespace)`, and the
// stand-in reads the English catalog for it.
mockGetTranslations.mockImplementation((namespace: string) =>
  getTranslations({ locale: "en", namespace })
);

afterEach(() => {
  mockAuth.mockReset();
  mockUserFindUnique.mockReset();
});

it("answers 404 to a signed-out visitor without reading the database", async () => {
  mockAuth.mockResolvedValue(null);

  await expect(ModerationReportsPage()).rejects.toThrow(NOT_FOUND_DIGEST);

  expect(mockUserFindUnique).not.toHaveBeenCalled();
});

it("answers 404 to a signed-in user without moderation access", async () => {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  mockUserFindUnique.mockResolvedValue({ isModerator: false });

  await expect(ModerationReportsPage()).rejects.toThrow(NOT_FOUND_DIGEST);
});

it("answers 404 to a session whose user row is gone", async () => {
  mockAuth.mockResolvedValue({ user: { id: "deleted-1" } });
  mockUserFindUnique.mockResolvedValue(null);

  await expect(ModerationReportsPage()).rejects.toThrow(NOT_FOUND_DIGEST);
});

it("shows the report queue to a moderator after reading their own flag", async () => {
  mockAuth.mockResolvedValue({ user: { id: "moderator-1" } });
  mockUserFindUnique.mockResolvedValue({ isModerator: true });

  renderWithProviders(await ModerationReportsPage(), {
    session: {
      user: { id: "moderator-1", name: "Mod" },
      expires: "2099-01-01T00:00:00.000Z",
    },
  });

  expect(
    screen.getByRole("heading", { level: 1, name: "Deck report queue" })
  ).toBeInTheDocument();
  // The queue loads itself from the API; with no server here it settles on its
  // error state. Waiting for it keeps React's act() warning out of the run.
  await screen.findByText("The report queue could not be updated.");
  expect(mockUserFindUnique).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: "moderator-1" } })
  );
});
