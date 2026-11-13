/**
 * Where the onboarding dialog opens: the provider every `[locale]` page is
 * wrapped in, with the real hook, the real dialog and the real catalogs.
 *
 * Sociable: only the page's address (`next/navigation`) is replaced, because
 * Next's app router does not run in jsdom. A guest's progress lives in the
 * browser's `localStorage`, which jsdom provides.
 *
 * Expected behaviour: I-39 functional requirement 1.1
 * (docs/product/specs/i39-first-run-activation-and-measurement.md).
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { OnboardingProvider, useOnboardingContext } from "./OnboardingProvider";

const { currentPage } = vi.hoisted(() => ({
  currentPage: { pathname: "/" },
}));

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => currentPage.pathname,
}));

/** The dialog's accessible name: the title of its first step. */
const ONBOARDING_DIALOG = { name: "Welcome to MagicAIBuilder" };

/**
 * Any page, wrapped in the provider as `[locale]/providers.tsx` wraps it. A new
 * element on every call: React skips re-rendering an element it already has,
 * and a navigation re-renders the provider.
 */
function aPage() {
  return (
    <OnboardingProvider>
      <p>Page content</p>
    </OnboardingProvider>
  );
}

/** A visitor who never finished nor skipped the onboarding, on `pathname`. */
function renderFirstVisitOn(pathname: string) {
  currentPage.pathname = pathname;
  return renderWithProviders(aPage(), { session: null });
}

/** The user menu's "Replay tutorial" entry, reduced to the call it makes. */
function ReplayTutorialButton() {
  const { resetOnboarding } = useOnboardingContext();
  return (
    <button type="button" onClick={() => void resetOnboarding()}>
      Replay tutorial
    </button>
  );
}

/** A signed-in player who finished the onboarding long ago, on `pathname`. */
function renderSignedInPlayerOn(pathname: string) {
  currentPage.pathname = pathname;
  return renderWithProviders(
    <OnboardingProvider>
      <ReplayTutorialButton />
    </OnboardingProvider>,
    {
      session: {
        user: { id: "player-1", name: "Kael" },
        expires: "2099-01-01T00:00:00.000Z",
      },
    }
  );
}

describe("OnboardingProvider", () => {
  let resetRequests = 0;
  setupMsw(
    http.delete("/api/user/onboarding", () => {
      resetRequests += 1;
      return HttpResponse.json({ onboardingDone: false });
    })
  );

  beforeEach(() => {
    resetRequests = 0;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not open the onboarding dialog for a first-time visitor on the landing page", () => {
    renderFirstVisitOn("/");

    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", ONBOARDING_DIALOG)
    ).not.toBeInTheDocument();
  });

  it("still opens the onboarding dialog for a first-time visitor in the guest builder", () => {
    renderFirstVisitOn("/builder/guest");

    expect(screen.getByRole("dialog", ONBOARDING_DIALOG)).toBeVisible();
  });

  it("keeps the onboarding for the guest builder when a first-time visitor moves there from the landing page", () => {
    const view = renderFirstVisitOn("/");
    expect(
      screen.queryByRole("dialog", ONBOARDING_DIALOG)
    ).not.toBeInTheDocument();

    currentPage.pathname = "/builder/guest";
    view.rerender(aPage());

    expect(screen.getByRole("dialog", ONBOARDING_DIALOG)).toBeVisible();
  });

  it("opens the onboarding dialog on a public page when a signed-in player asks to replay it", async () => {
    renderSignedInPlayerOn("/deck/deck-1");
    expect(
      screen.queryByRole("dialog", ONBOARDING_DIALOG)
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Replay tutorial" })
    );

    expect(
      await screen.findByRole("dialog", ONBOARDING_DIALOG)
    ).toBeVisible();
    expect(resetRequests).toBe(1);
  });
});
