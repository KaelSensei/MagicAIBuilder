import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAISuggestions } from "@/hooks/useAISuggestions";
import { computeDeckStats } from "@/lib/deck/stats";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import type { TestLocale } from "@/test/intl-catalogs";
import { renderWithProviders } from "@/test/render";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

// The refusal notice links back to the builder. next-intl's navigation reads
// Next's pathname, so only that package export is replaced.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => "/builder/deck-1",
}));

/**
 * I-39: a suggestions request that failed without a coded refusal showed the
 * raw "AI request failed (<status>)". The panel now says, in the player's
 * language, that the suggestions could not be loaded, and offers Retry.
 *
 * The real hook drives the real panel; only the network is stubbed.
 */
function SuggestionsHarness() {
  const ai = useAISuggestions();
  const deck = aDeck({
    commander: aDeckCard({ id: "c1", name: "Atraxa, Praetors' Voice" }),
  });
  return (
    <AISuggestionsPanel
      result={ai.result}
      isLoading={ai.isLoading}
      error={ai.error}
      denial={ai.denial}
      onAnalyze={() => {
        void ai.analyze(deck, computeDeckStats(deck), null);
      }}
      onAddCard={vi.fn()}
      onRemoveCard={vi.fn()}
    />
  );
}

async function askForSuggestions(locale: TestLocale): Promise<void> {
  renderWithProviders(<SuggestionsHarness />, { locale });
  await userEvent.click(
    screen.getByRole("button", { name: /^(analyze deck|analyser le deck)$/i })
  );
}

const LOAD_FAILED: Readonly<Record<TestLocale, string>> = {
  en: "The suggestions could not be loaded.",
  fr: "Les suggestions n'ont pas pu être chargées.",
};

const RETRY = /^(retry|réessayer)$/i;

describe("AISuggestionsPanel when the suggestions request fails", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each<TestLocale>(["en", "fr"])(
    "says in %s that the suggestions could not be loaded after a server error, never the raw status",
    async (locale) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
      );

      await askForSuggestions(locale);

      expect(await screen.findByText(LOAD_FAILED[locale])).toBeInTheDocument();
      expect(screen.queryByText(/AI request failed/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: RETRY })).toBeInTheDocument();
    }
  );

  it("says the suggestions could not be loaded when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await askForSuggestions("en");

    expect(await screen.findByText(LOAD_FAILED.en)).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: RETRY })).toBeInTheDocument();
  });

  it("asks again when the player presses Retry", async () => {
    const fetchSuggestions = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchSuggestions);
    await askForSuggestions("en");

    await userEvent.click(await screen.findByRole("button", { name: RETRY }));

    await waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps the account-needed message for a signed-out player (#1881)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Unauthorized" }, { status: 401 })
        )
    );

    await askForSuggestions("en");

    expect(
      await screen.findByText(
        "AI suggestions need an account. Everything else keeps working."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(LOAD_FAILED.en)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: RETRY })
    ).not.toBeInTheDocument();
  });
});
