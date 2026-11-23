import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

// The player is on the guest builder. next-intl's navigation reads Next's
// pathname, so only that package export is replaced.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => "/builder/guest",
}));

/**
 * I-39 6.5: a guest who asks for AI suggestions used to read the raw
 * "AI request failed (401)". The panel says an account is needed instead,
 * and both ways to get one bring the player back to the deck.
 */
function renderSignedOutPanel(locale: TestLocale): void {
  renderWithIntl(
    <AISuggestionsPanel
      result={null}
      isLoading={false}
      error="AI request failed (401)"
      denial={{ code: "sign_in_required" }}
      onAnalyze={vi.fn()}
      onAddCard={vi.fn()}
      onRemoveCard={vi.fn()}
    />,
    { locale }
  );
}

describe("AISuggestionsPanel for a signed-out player", () => {
  it.each<[TestLocale, string]>([
    ["en", "AI suggestions need an account. Everything else keeps working."],
    [
      "fr",
      "Les suggestions IA demandent un compte. Tout le reste fonctionne normalement.",
    ],
  ])("says in %s that suggestions need an account", (locale, message) => {
    renderSignedOutPanel(locale);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/\(401\)/)).not.toBeInTheDocument();
    // Retrying cannot succeed without an account.
    expect(
      screen.queryByRole("button", { name: /^(retry|réessayer)$/i })
    ).not.toBeInTheDocument();
  });

  it("offers to create an account or sign in, both returning to this deck", () => {
    renderSignedOutPanel("en");

    expect(
      screen.getByRole("link", { name: "Create account" })
    ).toHaveAttribute("href", "/auth/signup?callbackUrl=%2Fbuilder%2Fguest");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fbuilder%2Fguest"
    );
  });
});
