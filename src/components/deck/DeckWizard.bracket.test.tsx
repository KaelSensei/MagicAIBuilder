import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DORMANT_LOCALES } from "@/i18n/routing";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

/**
 * The target-bracket step must use the official Commander bracket names and
 * limits (bracket text of 2025-10-21, see
 * docs/product/guides/commander-deckbuilding-by-bracket.md).
 */

interface StepLabels {
  readonly budget: string;
  readonly next: string;
  readonly color: string;
  readonly strategy: RegExp;
  readonly bracketTitle: string;
}

/** Wizard labels needed to walk to the bracket step, per locale. */
const STEP_LABELS: Readonly<Record<TestLocale, StepLabels>> = {
  en: {
    budget: "Budget < $50",
    next: "Continue",
    color: "Blue",
    strategy: /Control Counter and control/,
    bracketTitle: "Power level?",
  },
  fr: {
    budget: "Budget < 50 $",
    next: "Continuer",
    color: "Bleu",
    strategy: /Contrôle Contrer et contrôler/,
    bracketTitle: "Niveau de puissance ?",
  },
};

function renderWizard(locale: TestLocale) {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />,
    { locale }
  );
}

async function openBracketStep(locale: TestLocale) {
  const labels = STEP_LABELS[locale];
  renderWizard(locale);
  fireEvent.click(screen.getByRole("button", { name: labels.budget }));
  fireEvent.click(screen.getByRole("button", { name: labels.next }));
  fireEvent.click(await screen.findByRole("button", { name: labels.color }));
  fireEvent.click(screen.getByRole("button", { name: labels.next }));
  fireEvent.click(await screen.findByRole("button", { name: labels.strategy }));
  fireEvent.click(screen.getByRole("button", { name: labels.next }));
  await screen.findByRole("heading", { name: labels.bracketTitle });
}

const WIZARD_CATALOG = z.object({ wizard: z.record(z.string(), z.string()) });

/** @returns the bracket picker strings (`bracketN`, `bracketNSub`, `bracketNDesc`) of a locale's deck catalog */
function bracketCopy(locale: string): Readonly<Record<string, string>> {
  const file = join(__dirname, "..", "..", "messages", locale, "deck.json");
  const { wizard } = WIZARD_CATALOG.parse(JSON.parse(readFileSync(file, "utf8")));
  return Object.fromEntries(
    Object.entries(wizard).filter(([key]) =>
      /^bracket[1-5](Sub|Desc)?$/.test(key)
    )
  );
}

describe("DeckWizard bracket step", () => {
  it("offers the official English bracket names with their Game Changer limits", async () => {
    await openBracketStep("en");

    expect(screen.getByRole("button", { name: /Bracket 1 — Exhibition/ })).toHaveTextContent(
      "No Game Changers"
    );
    expect(screen.getByRole("button", { name: /Bracket 2 — Core/ })).toHaveTextContent(
      "No Game Changers"
    );
    expect(screen.getByRole("button", { name: /Bracket 3 — Upgraded/ })).toHaveTextContent(
      "Up to 3 Game Changers"
    );
    expect(screen.getByRole("button", { name: /Bracket 4 — Optimized/ })).toHaveTextContent(
      "Unlimited Game Changers"
    );
    expect(
      screen.getByRole("button", { name: /Bracket 5 — cEDH/ })
    ).toHaveTextContent("Games can end on any turn");
  });

  it("names each French bracket as « Catégorie N — Nom (bracket N) » with its limits", async () => {
    await openBracketStep("fr");

    expect(
      screen.getByRole("button", { name: /Catégorie 1 — Exhibition \(bracket 1\)/ })
    ).toHaveTextContent("Ni Game Changers");
    expect(
      screen.getByRole("button", { name: /Catégorie 2 — Basique \(bracket 2\)/ })
    ).toHaveTextContent("Aucun Game Changer");
    expect(
      screen.getByRole("button", { name: /Catégorie 3 — Amélioré \(bracket 3\)/ })
    ).toHaveTextContent("Jusqu’à 3 Game Changers");
    expect(
      screen.getByRole("button", { name: /Catégorie 4 — Optimisé \(bracket 4\)/ })
    ).toHaveTextContent("Game Changers illimités");
    expect(
      screen.getByRole("button", { name: /Catégorie 5 — cEDH \(bracket 5\)/ })
    ).toHaveTextContent("La partie peut se terminer à n’importe quel tour");
  });
});

// The guide gives official bracket names only in English and French. Dormant
// catalogs keep the English copy until a native speaker reviews them.
describe("bracket picker copy in dormant catalogs", () => {
  it.each(DORMANT_LOCALES)("matches the official English copy in %s", (locale) => {
    expect(bracketCopy(locale)).toEqual(bracketCopy("en"));
  });
});
