/**
 * The identity scope chip on its own: what it says in each state, in English
 * and French, and that it renders nothing when there is no scope. The builder
 * page's search-query test drives it with the real page.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CommanderIdentityChip } from "./CommanderIdentityChip";

describe("CommanderIdentityChip", () => {
  it("says the search is limited to the commander's colours and offers to show every colour", async () => {
    const onToggle = vi.fn();
    renderWithProviders(
      <CommanderIdentityChip state="scoped" onToggle={onToggle} />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Only cards in your commander's colors"
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Show every color" }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("says the search shows every colour once widened, and offers to narrow it again", () => {
    renderWithProviders(
      <CommanderIdentityChip state="widened" onToggle={vi.fn()} />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cards of every color"
    );
    expect(
      screen.getByRole("button", { name: "Only my commander's colors" })
    ).toBeInTheDocument();
  });

  it("speaks French to a French player", () => {
    renderWithProviders(
      <CommanderIdentityChip state="scoped" onToggle={vi.fn()} />,
      { locale: "fr" }
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Seulement les cartes aux couleurs de ton commandant"
    );
    expect(
      screen.getByRole("button", { name: "Afficher toutes les couleurs" })
    ).toBeInTheDocument();
  });

  it("renders nothing when the deck has no identity to scope to", () => {
    const { container } = renderWithProviders(
      <CommanderIdentityChip state="hidden" onToggle={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
