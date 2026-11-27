import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

/** The answers that walk the wizard to its commander step, as each locale labels them. */
interface WizardAnswers {
  readonly budget: RegExp;
  readonly next: string;
  readonly colour: string;
  readonly strategy: RegExp;
  readonly bracket: RegExp;
}

const ENGLISH_ANSWERS: WizardAnswers = {
  budget: /Budget.*50/,
  next: "Continue",
  colour: "Blue",
  strategy: /Fast and aggressive/,
  bracket: /Bracket 3/,
};

const FRENCH_ANSWERS: WizardAnswers = {
  budget: /Budget < 50 \$ par carte/,
  next: "Continuer",
  colour: "Bleu",
  strategy: /Contrôle Contrer et contrôler/,
  bracket: /Amélioré \(bracket 3\)/,
};

async function openCommanderStep(answers: WizardAnswers): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: answers.budget }));
  fireEvent.click(screen.getByRole("button", { name: answers.next }));
  fireEvent.click(await screen.findByRole("button", { name: answers.colour }));
  fireEvent.click(screen.getByRole("button", { name: answers.next }));
  fireEvent.click(
    await screen.findByRole("button", { name: answers.strategy })
  );
  fireEvent.click(screen.getByRole("button", { name: answers.next }));
  fireEvent.click(await screen.findByRole("button", { name: answers.bracket }));
  fireEvent.click(screen.getByRole("button", { name: answers.next }));
}

// WCAG 2.2 SC 1.3.1 and 4.1.2 (I-04 accessibility bundle 4): a placeholder
// is not a name, so the commander search field carries its own.
it("names the commander search field for a screen reader and keeps the example as its placeholder", async () => {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
  );

  await openCommanderStep(ENGLISH_ANSWERS);

  expect(
    await screen.findByRole("textbox", { name: "Search for a commander" })
  ).toHaveAttribute("placeholder", "Search for a commander…");
});

it("names the commander search field in French", async () => {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />,
    { locale: "fr" }
  );

  await openCommanderStep(FRENCH_ANSWERS);

  expect(
    await screen.findByRole("textbox", { name: "Rechercher un commandant" })
  ).toHaveAttribute("placeholder", "Rechercher un commandant…");
});
