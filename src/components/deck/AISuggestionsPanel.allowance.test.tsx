import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AiCallDenial } from "@/lib/ai/usage/denial";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

const DECEMBER = new Date("2026-12-01T00:00:00.000Z");

function renderRefusedPanel(denial: AiCallDenial, locale: TestLocale): void {
  renderWithIntl(
    <AISuggestionsPanel
      result={null}
      isLoading={false}
      error="AI request failed (429)"
      denial={denial}
      onAnalyze={vi.fn()}
      onAddCard={vi.fn()}
      onRemoveCard={vi.fn()}
    />,
    { locale }
  );
}

describe("AISuggestionsPanel monthly allowance", () => {
  it.each<[TestLocale, string]>([
    [
      "en",
      "Monthly AI suggestions used up (30). They reset on December 1, 2026. Everything else keeps working.",
    ],
    [
      "fr",
      "Suggestions IA du mois épuisées (30). Elles se renouvellent le 1 décembre 2026. Tout le reste fonctionne normalement.",
    ],
  ])(
    "says in %s that the month's suggestions are used up and when they reset",
    (locale, message) => {
      renderRefusedPanel(
        {
          code: "allowance_exhausted",
          route: "suggest",
          limit: 30,
          resetsAt: DECEMBER,
        },
        locale
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(
        screen.queryByText("AI request failed (429)")
      ).not.toBeInTheDocument();
      // Retrying cannot succeed before the reset.
      expect(
        screen.queryByRole("button", { name: /^(retry|réessayer)$/i })
      ).not.toBeInTheDocument();
    }
  );

  it.each<[TestLocale, string]>([
    [
      "en",
      "AI features are paused until December 1, 2026. Everything else keeps working.",
    ],
    [
      "fr",
      "Les fonctions IA sont en pause jusqu'au 1 décembre 2026. Tout le reste fonctionne normalement.",
    ],
  ])(
    "says in %s that AI is paused until the monthly reset",
    (locale, message) => {
      renderRefusedPanel(
        { code: "ai_spend_ceiling_reached", resetsAt: DECEMBER },
        locale
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    }
  );

  // Sonar S6819: the native <output> carries the status role, and the polite,
  // atomic announcement that role="status" implied stays explicit.
  it("announces the refusal in a polite, native status output", () => {
    renderRefusedPanel(
      { code: "ai_spend_ceiling_reached", resetsAt: DECEMBER },
      "en"
    );

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent(
      "AI features are paused until December 1, 2026. Everything else keeps working."
    );
    expect(notice).toBeInstanceOf(HTMLOutputElement);
    expect(notice).not.toHaveAttribute("role");
    expect(notice).toHaveAttribute("aria-live", "polite");
    expect(notice).toHaveAttribute("aria-atomic", "true");
  });
});
